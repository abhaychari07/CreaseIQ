/* Browser storage client. Safe to load before Supabase has been configured. */
(function () {
  const configuration = window.CREASEIQ_SUPABASE || {};
  const configured = () => Boolean(configuration.url && configuration.publishableKey && window.supabase);
  let sharedClient = null;
  const client = () => {
    if (!configured()) return null;
    if (!sharedClient) sharedClient = window.supabase.createClient(configuration.url, configuration.publishableKey);
    return sharedClient;
  };
  const fileExtension = file => (file.name.split('.').pop() || 'mp4').toLowerCase();
  const safeFileName = file => `${crypto.randomUUID()}.${fileExtension(file)}`;

  async function currentUser() {
    const db = client();
    if (!db) return null;
    const { data: { user } } = await db.auth.getUser();
    return user;
  }

  async function signIn(email) {
    const db = client();
    if (!db) throw new Error('Supabase is not configured yet.');
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
  }

  async function getProfile(userId) {
    const db = client();
    if (!db) return null;
    const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function updateProfile({ userId, displayName, battingHand, academyName }) {
    const db = client();
    if (!db) throw new Error('Supabase is not configured yet.');
    const { data, error } = await db.from('profiles').upsert({
      id: userId,
      display_name: displayName,
      batting_hand: battingHand,
      academy_name: academyName || null,
      profile_completed_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  }

  function onAuthStateChange(callback) {
    const db = client();
    if (!db) return { data: { subscription: { unsubscribe() {} } } };
    return db.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
      // Supabase can deadlock if another async API call starts inside this
      // callback. Defer profile loading until the auth lock is released.
      window.setTimeout(() => callback(session ? session.user : null), 50);
    });
  }

  async function saveSession({ file, technique, cameraAngle, referenceStyle }) {
    const db = client();
    if (!db) return { stored: false, reason: 'not-configured' };
    const user = await currentUser();
    if (!user) return { stored: false, reason: 'not-signed-in' };
    const path = `${user.id}/${safeFileName(file)}`;
    const { error: uploadError } = await db.storage.from('cricket-videos').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data, error: sessionError } = await db.from('sessions').insert({
      user_id: user.id, video_path: path, original_filename: file.name,
      technique: technique.toLowerCase().replaceAll(' ', '-'), camera_angle: cameraAngle,
      reference_style: referenceStyle, status: 'processing'
    }).select().single();
    if (sessionError) {
      await db.storage.from('cricket-videos').remove([path]);
      throw sessionError;
    }
    return { stored: true, session: data };
  }

  async function saveAnalysis({ sessionId, report }) {
    const db = client();
    if (!db || !sessionId) return null;
    const { data: analysis, error } = await db.from('analyses').insert({
      session_id: sessionId, model_version: 'cover-drive-pose-v0.1', overall_score: report.score,
      confidence: report.confidence, report
    }).select().single();
    if (error) throw error;
    const scores = report.findings.map(item => ({ analysis_id: analysis.id, checkpoint_id: item.id, score: item.score, status: item.status, message: item.message }));
    if (scores.length) {
      const { error: scoreError } = await db.from('technique_scores').insert(scores);
      if (scoreError) throw scoreError;
    }
    const { error: sessionError } = await db.from('sessions').update({ status: 'complete' }).eq('id', sessionId);
    if (sessionError) throw sessionError;
    return analysis;
  }

  async function updateSessionStatus(sessionId, status) {
    const db = client();
    if (!db || !sessionId) return null;
    const { error } = await db.from('sessions').update({ status }).eq('id', sessionId);
    if (error) throw error;
  }

  async function listSessions() {
    const db = client();
    if (!db) return { sessions: [], reason: 'not-configured' };
    const user = await currentUser();
    if (!user) return { sessions: [], reason: 'not-signed-in' };
    const { data: sessions, error } = await db.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    const ids = sessions.map(session => session.id);
    if (!ids.length) return { sessions: [] };
    const { data: analyses, error: analysisError } = await db.from('analyses').select('session_id, overall_score, confidence, created_at').in('session_id', ids);
    if (analysisError) throw analysisError;
    const analysisBySession = new Map(analyses.map(analysis => [analysis.session_id, analysis]));
    return { sessions: sessions.map(session => ({ ...session, analysis: analysisBySession.get(session.id) || null })) };
  }

  async function getSession(sessionId) {
    const db = client();
    if (!db) throw new Error('Supabase is not configured yet.');
    const { data: session, error } = await db.from('sessions').select('*').eq('id', sessionId).single();
    if (error) throw error;
    const { data: analysis, error: analysisError } = await db.from('analyses').select('*').eq('session_id', sessionId).maybeSingle();
    if (analysisError) throw analysisError;
    const { data: signed, error: videoError } = await db.storage.from('cricket-videos').createSignedUrl(session.video_path, 3600);
    if (videoError) throw videoError;
    return { session, analysis, videoUrl: signed.signedUrl };
  }

  async function deleteSession({ sessionId, videoPath }) {
    const db = client();
    if (!db) throw new Error('Supabase is not configured yet.');
    if (videoPath) {
      const { error: videoError } = await db.storage.from('cricket-videos').remove([videoPath]);
      if (videoError) throw videoError;
    }
    const { error } = await db.from('sessions').delete().eq('id', sessionId);
    if (error) throw error;
  }

  async function clearSessions() {
    const db = client();
    if (!db) throw new Error('Supabase is not configured yet.');
    const user = await currentUser();
    if (!user) throw new Error('Sign in to manage session history.');
    const { data: sessions, error: listError } = await db.from('sessions').select('id, video_path').eq('user_id', user.id);
    if (listError) throw listError;
    const paths = sessions.map(session => session.video_path).filter(Boolean);
    if (paths.length) {
      const { error: videoError } = await db.storage.from('cricket-videos').remove(paths);
      if (videoError) throw videoError;
    }
    const { error } = await db.from('sessions').delete().eq('user_id', user.id);
    if (error) throw error;
  }

  async function completeDrill(drillId) {
    const db = client();
    if (!db) return { stored: false, reason: 'not-configured' };
    const user = await currentUser();
    if (!user) return { stored: false, reason: 'not-signed-in' };
    const { error } = await db.from('drill_completions').insert({ user_id: user.id, drill_id: drillId });
    if (error) throw error;
    return { stored: true };
  }

  window.CreaseIQStorage = { configured, currentUser, signIn, getProfile, updateProfile, saveSession, saveAnalysis, updateSessionStatus, listSessions, getSession, deleteSession, clearSessions, completeDrill, onAuthStateChange };
})();
