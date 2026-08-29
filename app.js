const uploadModal = document.getElementById('uploadModal');
const demoModal = document.getElementById('demoModal');
const processingModal = document.getElementById('processingModal');
const videoInput = document.getElementById('videoInput');
const dropzone = document.getElementById('dropzone');
const startButton = document.getElementById('startAnalysis');
const status = document.getElementById('uploadStatus');
const video = document.getElementById('uploadedVideo');
const preview = document.getElementById('videoPreview');
const analysisOptions = document.querySelector('.analysis-options');
analysisOptions.insertAdjacentHTML('beforeend', `<label id="fastDeliveryLabel" class="delivery-type-hidden">Delivery type<select id="fastDeliverySelect"><option value="outswinger">Outswinger</option><option value="inswinger">Inswinger</option><option value="straight-seam">Straight seam</option><option value="wobble-seam">Wobble seam</option><option value="reverse-swing">Reverse swing</option></select></label>`);
analysisOptions.insertAdjacentHTML('beforeend', `<label id="paceActionLabel" class="delivery-type-hidden">Bowling action<select id="paceActionSelect"><option value="side-on">Side-on</option><option value="front-on">Front-on</option><option value="semi-open">Semi-open / 45°</option><option value="mixed">Mixed action</option></select></label>`);
analysisOptions.insertAdjacentHTML('beforeend', `<label id="spinDeliveryLabel" class="delivery-type-hidden">Delivery type<select id="spinDeliverySelect"><optgroup label="Finger spin"><option value="off-spin">Off-break (stock ball)</option><option value="left-arm-orthodox">Left-arm orthodox spin</option><option value="doosra">Doosra</option><option value="carrom-ball">Carrom ball</option><option value="arm-ball">Arm ball</option><option value="knuckle-top-spinner">Knuckle ball / Top spinner</option></optgroup><optgroup label="Wrist spin"><option value="leg-break">Leg-break (stock ball)</option><option value="left-arm-unorthodox">Left-arm unorthodox / Chinaman</option><option value="googly">Googly</option><option value="flipper">Flipper</option><option value="slider">Slider</option><option value="top-spinner">Top-spinner</option></optgroup></select></label>`);
analysisOptions.insertAdjacentHTML('afterend', `<section id="deliveryRubric" class="delivery-rubric" hidden></section>`);
analysisOptions.insertAdjacentHTML('afterend', `<p id="fastCaptureGuide" class="fast-capture-guide" hidden><b>Fast-bowling camera guide:</b> use a side-on, front-on, 45° or behind-bowler view. Keep the full run-up, release arm, landing foot and follow-through visible.</p>`);
analysisOptions.insertAdjacentHTML('afterend', `<p id="spinCaptureGuide" class="fast-capture-guide" hidden><b>Spin-bowling camera guide:</b> use a side-on, front-on, 45° or behind-bowler view. Keep the whole bowler, release arm, landing foot and follow-through visible.</p>`);
const paceRubrics = {
  outswinger: { title: 'Outswinger', seam: 'Angled toward the slips (off-side).', air: 'Moves away from a right-handed batter.', pitch: 'Continues away or holds its line after landing.', use: 'Early in the match with a new, shiny ball.' },
  inswinger: { title: 'Inswinger', seam: 'Angled toward fine leg or leg slip (leg-side).', air: 'Moves inward toward a right-handed batter.', pitch: 'Straightens or darts into the pads after pitching.', use: 'Target the stumps or trap a batter LBW.' },
  'straight-seam': { title: 'Straight seam', seam: 'Perfectly upright and stable.', air: 'Travels straight with minimal drift.', pitch: 'Nips unpredictably off the seam after landing.', use: 'Fresh, green pitches that offer seam movement.' },
  'wobble-seam': { title: 'Wobble seam', seam: 'Tilted and spinning slightly sideways.', air: 'Little to no predictable swing in the air.', pitch: 'Creates random bounce and movement off the pitch.', use: 'Flat or dry pitches where the ball does not swing normally.' },
  'reverse-swing': { title: 'Reverse swing', seam: 'Angled conventionally, using the rough side of the ball.', air: 'Swings late and sharply opposite to the shiny side.', pitch: 'Moves fast and late, making it hard to read.', use: 'Later in the game with an older, worn ball.' }
};
const paceActionRubrics = {
  'side-on': { title: 'Side-on action', alignment: 'Back foot lands parallel to or slightly behind the crease. Hips and shoulders are square to the batter, with the non-bowling shoulder pointing down the pitch.', characteristic: 'Favours conventional away-swing through clean lateral side-on rotation.' },
  'front-on': { title: 'Front-on action', alignment: 'Back foot lands more open down the pitch, with the chest and shoulders facing toward the target at delivery.', characteristic: 'Can generate extra bounce by driving up and over a braced front leg.' },
  'semi-open': { title: 'Semi-open / 45° action', alignment: 'Back foot lands at roughly 45 degrees; hips and shoulders rotate dynamically from a mid-point into the target.', characteristic: 'A hybrid action that can create a smooth kinetic-chain transfer.' },
  mixed: { title: 'Mixed action', alignment: 'Lower body lands side-on while shoulders forcefully twist front-on during the delivery stride.', characteristic: 'High injury risk: counter-rotation can place excessive stress on the lower back.' }
};
const spinRubrics = {
  'off-spin': { title: 'Off-break (stock ball)', motion: 'Doorknob-turning hand motion.', behavior: 'Spins from off-side to leg-side for a right-handed batter.' },
  'left-arm-orthodox': { title: 'Left-arm orthodox (stock ball)', motion: 'Left-handed finger action.', behavior: 'Spins from leg-side to off-side against a right-handed batter.' },
  doosra: { title: 'Doosra', motion: 'Modified wrist and finger action.', behavior: 'Spins in reverse of an off-break: leg-side to off-side.' },
  'carrom-ball': { title: 'Carrom ball', motion: 'Flicked off the thumb and ring finger.', behavior: 'Drifts or spins in an unexpected way.' },
  'arm-ball': { title: 'Arm ball', motion: 'No finger spin used.', behavior: 'Goes straight following the arm angle.' },
  'knuckle-top-spinner': { title: 'Knuckle ball / Top spinner', motion: 'Forward rotation applied.', behavior: 'Dips sharply or bounces higher.' },
  'leg-break': { title: 'Leg-break (stock ball)', motion: 'Anti-clockwise wrist flick.', behavior: 'Turns from leg-side to off-side for a right-arm wrist spinner.' },
  'left-arm-unorthodox': { title: 'Left-arm unorthodox / Chinaman', motion: 'Left-arm wrist-spin action.', behavior: 'Turns into a right-handed batter.' },
  googly: { title: "Googly (the wrong 'un)", motion: 'Rotated wrist upon release.', behavior: 'Looks like a leg-break but turns off-side to leg-side.' },
  flipper: { title: 'Flipper', motion: 'Squeezed between thumb and fingers from underneath.', behavior: 'Skids low and straight off the pitch.' },
  slider: { title: 'Slider', motion: 'Back-spin applied.', behavior: 'Skids low and fast with very little turn.' },
  'top-spinner': { title: 'Top-spinner', motion: 'Hand gets heavily over the top of the ball.', behavior: 'Produces extra dip and bounce without side turn.' }
};
function updatePaceRubric() {
  const rubric = paceRubrics[document.getElementById('fastDeliverySelect').value];
  const action = paceActionRubrics[document.getElementById('paceActionSelect').value];
  const panel = document.getElementById('deliveryRubric');
  panel.innerHTML = `<strong>${rubric.title} · ${action.title}</strong><div><span>Seam</span><p>${rubric.seam}</p></div><div><span>Air movement</span><p>${rubric.air}</p></div><div><span>After pitching</span><p>${rubric.pitch}</p></div><div><span>Best use</span><p>${rubric.use}</p></div><div><span>Action alignment</span><p>${action.alignment}</p></div><div><span>Action note</span><p>${action.characteristic}</p></div><div><span>Release point</span><p>Bowling arm fully extended vertically, or slightly round-arm, next to the ear or shoulder.</p></div><div><span>Wrist and seam</span><p>Keep a firm wrist behind the ball, with index and middle fingers controlling an upright seam.</p></div><div><span>Front-arm block</span><p>Pull the non-bowling arm tightly past the chest as the bowling shoulder comes over a braced front knee.</p></div>`;
}
function updateSpinRubric() {
  const rubric = spinRubrics[document.getElementById('spinDeliverySelect').value];
  const panel = document.getElementById('deliveryRubric');
  panel.innerHTML = `<strong>${rubric.title} coaching rubric</strong><div><span>Release motion</span><p>${rubric.motion}</p></div><div><span>Ball behaviour</span><p>${rubric.behavior}</p></div>`;
}
document.getElementById('fastDeliverySelect').addEventListener('change', updatePaceRubric);
document.getElementById('paceActionSelect').addEventListener('change', updatePaceRubric);
document.getElementById('spinDeliverySelect').addEventListener('change', updateSpinRubric);
let uploadedFile;
let activeUser = null;
let activeProfile = null;
let latestReport = null;
let latestClipUrl = null;

const drillLibrary = [
  { id: 'drop-ball-drive', group: 'batting', title: 'Drop-ball drive', duration: '10 min', focus: 'Cover drive', steps: ['Partner drops a tennis ball from shoulder height.', 'Step to the pitch and drive through a target gate.', 'Keep the ball on the ground for 20 repetitions.'] },
  { id: 'head-over-knee', group: 'batting', title: 'Head-over-knee shadow drill', duration: '6 min', focus: 'Balance', steps: ['Take a slow forward stride without a ball.', 'Pause with head over front knee and front foot.', 'Complete a high balanced follow-through.'] },
  { id: 'soft-hands-defense', group: 'batting', title: 'Soft-hands defense', duration: '12 min', focus: 'Defense', steps: ['Use soft half-volley feeds.', 'Block with a vertical bat close to the pad.', 'Keep every ball within a two-metre circle.'] },
  { id: 'target-gate-on-drive', group: 'batting', title: 'Mid-on target gate', duration: '12 min', focus: 'On-drive', steps: ['Place two cones through mid-on.', 'Drive underarm half-volleys between them.', 'Use top hand to keep the bat path straight.'] },
  { id: 'seam-release', group: 'pace', title: 'Seam release to wall', duration: '8 min', focus: 'Pace release', steps: ['Stand three metres from a wall target.', 'Practise an upright seam with a firm wrist.', 'Release with index and middle fingers controlling the seam.'] },
  { id: 'front-leg-brace', group: 'pace', title: 'Front-leg brace drill', duration: '10 min', focus: 'Pace action', steps: ['Use a shortened run-up.', 'Land over a stable, braced front knee.', 'Pull the front arm down and finish through the target.'] },
  { id: 'good-length-markers', group: 'pace', title: 'Good-length markers', duration: '18 min', focus: 'Accuracy', steps: ['Place markers 4–6 metres from the stumps.', 'Bowl six-ball sets at one target.', 'Review the clip and score the landing result.'] },
  { id: 'finger-spin-release', group: 'spin', title: 'Finger-spin release', duration: '10 min', focus: 'Off-spin', steps: ['Use a tennis ball or cricket ball.', 'Repeat the finger release slowly.', 'Aim for consistent revolutions before adding pace.'] },
  { id: 'wrist-spin-control', group: 'spin', title: 'Wrist-spin control', duration: '12 min', focus: 'Leg-spin', steps: ['Use a short approach.', 'Practise a clean wrist snap at release.', 'Land six deliveries on one marked length.'] }
];

const drillLibrarySection = document.createElement('section');
drillLibrarySection.id = 'drillLibrary';
drillLibrarySection.className = 'drill-library container';
document.querySelector('.how').insertAdjacentElement('beforebegin', drillLibrarySection);

function renderDrillLibrary(group = 'all') {
  const container = document.getElementById('drillLibrary');
  const visible = group === 'all' ? drillLibrary : drillLibrary.filter(drill => drill.group === group);
  container.innerHTML = `<div class="drill-library-head"><div><p class="overline">TRAIN WITH PURPOSE</p><h3>Drill library</h3></div><div class="drill-filters"><button data-group="all" class="${group === 'all' ? 'selected' : ''}">All</button><button data-group="batting" class="${group === 'batting' ? 'selected' : ''}">Batting</button><button data-group="pace" class="${group === 'pace' ? 'selected' : ''}">Pace</button><button data-group="spin" class="${group === 'spin' ? 'selected' : ''}">Spin</button></div></div><div class="drill-grid">${visible.map(drill => `<article class="drill-card"><span>${escapeHtml(drill.focus)} · ${drill.duration}</span><h4>${escapeHtml(drill.title)}</h4><p>${escapeHtml(drill.steps[0])}</p><button data-drill-id="${drill.id}">Open drill →</button></article>`).join('')}</div>`;
  container.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => renderDrillLibrary(button.dataset.group)));
  container.querySelectorAll('[data-drill-id]').forEach(button => button.addEventListener('click', () => openDrill(button.dataset.drillId)));
}

function openDrill(id) {
  const drill = drillLibrary.find(item => item.id === id);
  if (!drill) return;
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal drill-modal"><button class="close" aria-label="Close">×</button><p class="overline">${escapeHtml(drill.focus)} · ${drill.duration}</p><h2>${escapeHtml(drill.title)}</h2><ol>${drill.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol><button class="primary-button analyze-button" id="completeDrill">Mark complete <span>✓</span></button><p class="upload-status" id="drillStatus"></p></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  panel.querySelector('#completeDrill').addEventListener('click', async () => {
    const status = panel.querySelector('#drillStatus');
    try {
      const saved = await window.CreaseIQStorage.completeDrill(drill.id);
      status.textContent = saved.stored ? 'Drill completed and saved to your account.' : 'Drill completed locally. Sign in to save progress.';
    } catch (error) { status.textContent = error.message; }
  });
}
renderDrillLibrary();


function openUpload() { uploadModal.classList.add('open'); uploadModal.setAttribute('aria-hidden', 'false'); }
function closeUpload() { uploadModal.classList.remove('open'); uploadModal.setAttribute('aria-hidden', 'true'); }
function fileChosen(file) {
  if (!file || !file.type.startsWith('video/')) { status.textContent = 'Please choose a video file.'; return; }
  uploadedFile = file;
  video.src = URL.createObjectURL(file);
  latestClipUrl = video.src;
  preview.hidden = false;
  dropzone.hidden = true;
  startButton.disabled = false;
  const selectedMode = document.querySelector('.shot-types .selected').textContent.trim();
  status.textContent = selectedMode === 'Fast bowling' ? 'Clip loaded. Choose the delivery type, bowling action and camera angle.' : selectedMode === 'Spin bowling' ? 'Clip loaded. Choose the delivery type and camera angle.' : 'Clip loaded. Choose the technique and camera angle.';
  video.onloadedmetadata = () => { document.getElementById('clipMeta').textContent = `${Math.round(video.duration)} sec · ${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`; };
}

['heroUpload', 'navUpload', 'newAnalysis'].forEach(id => document.getElementById(id).addEventListener('click', openUpload));
document.getElementById('closeModal').addEventListener('click', closeUpload);
document.getElementById('modalBackdrop').addEventListener('click', closeUpload);
videoInput.addEventListener('change', event => fileChosen(event.target.files[0]));
['dragenter', 'dragover'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => fileChosen(e.dataTransfer.files[0]));
document.getElementById('replaceClip').addEventListener('click', () => { video.pause(); video.removeAttribute('src'); preview.hidden = true; dropzone.hidden = false; videoInput.click(); });
document.querySelectorAll('.shot-types button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.shot-types .selected').classList.remove('selected');
  button.classList.add('selected');
  const isBatting = button.textContent.trim() === 'Batting';
  const isFastBowling = button.textContent.trim() === 'Fast bowling';
  const isSpinBowling = button.textContent.trim() === 'Spin bowling';
  analysisOptions.classList.toggle('delivery-mode', isFastBowling || isSpinBowling);
  analysisOptions.querySelector('label:first-child').classList.toggle('batting-technique-hidden', !isBatting);
  document.getElementById('fastDeliveryLabel').classList.toggle('delivery-type-hidden', !isFastBowling);
  document.getElementById('paceActionLabel').classList.toggle('delivery-type-hidden', !isFastBowling);
  document.getElementById('spinDeliveryLabel').classList.toggle('delivery-type-hidden', !isSpinBowling);
  const deliveryRubric = document.getElementById('deliveryRubric');
  deliveryRubric.hidden = true;
  document.getElementById('fastCaptureGuide').hidden = !isFastBowling;
  document.getElementById('spinCaptureGuide').hidden = !isSpinBowling;
  startButton.disabled = !uploadedFile;
  status.textContent = isBatting
    ? (uploadedFile ? 'Clip loaded. Choose the technique and camera angle.' : '')
    : isFastBowling
      ? (uploadedFile ? 'Clip loaded. Choose the delivery type, bowling action and camera angle.' : '')
      : (uploadedFile ? 'Clip loaded. Choose the delivery type and camera angle.' : '');
}));

function confirmAnalysisType(role) {
  return new Promise(resolve => {
    const panel = document.createElement('section');
    panel.className = 'demo-modal open analysis-confirmation';
    const detail = role === 'Batting' ? 'You will receive feedback for the selected batting shot.' : `You will receive feedback for the selected ${role.toLowerCase()} action.`;
    panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal confirmation-box"><p class="overline">READY TO ANALYSE</p><div class="confirmation-icon">✓</div><h2>Analyse as ${escapeHtml(role)}?</h2><p class="modal-copy">${detail} Make sure this matches the uploaded video before we start.</p><div class="confirmation-actions"><button class="confirmation-secondary">Change selection</button><button class="primary-button confirmation-primary">Yes, analyse <span>→</span></button></div></div>`;
    document.body.append(panel);
    const finish = accepted => { panel.remove(); resolve(accepted); };
    panel.querySelector('.modal-backdrop').addEventListener('click', () => finish(false));
    panel.querySelector('.confirmation-secondary').addEventListener('click', () => finish(false));
    panel.querySelector('.confirmation-primary').addEventListener('click', () => finish(true));
  });
}

startButton.addEventListener('click', async () => {
  if (!uploadedFile) return;
  const techniqueSelect = document.getElementById('techniqueSelect');
  const selectedRole = document.querySelector('.shot-types .selected').textContent.trim();
  if (!(await confirmAnalysisType(selectedRole))) {
    status.textContent = `Select the correct analysis type before analysing this video.`;
    return;
  }
  closeUpload();
  const isFastBowling = selectedRole === 'Fast bowling';
  const isSpinBowling = selectedRole === 'Spin bowling';
  const technique = isFastBowling ? `${document.getElementById('fastDeliverySelect').options[document.getElementById('fastDeliverySelect').selectedIndex].text} · ${document.getElementById('paceActionSelect').options[document.getElementById('paceActionSelect').selectedIndex].text} fast bowling` : isSpinBowling ? `${document.getElementById('spinDeliverySelect').options[document.getElementById('spinDeliverySelect').selectedIndex].text} spin bowling` : techniqueSelect.options[techniqueSelect.selectedIndex].text;
  const angle = document.getElementById('angleSelect').value;
  const reference = 'professional';
  const techniqueKey = isFastBowling ? 'fast-bowling' : isSpinBowling ? 'spin-bowling' : techniqueSelect.value;
  const viewSessionButton = document.getElementById('viewSession');
  processingModal.classList.add('open');
  viewSessionButton.disabled = true;
  document.getElementById('processingCopy').textContent = 'Preparing your clip for body-pose analysis...';
  document.getElementById('qualityChecks').innerHTML = '';
  let savedSession = null;
  let storageNote = 'This prototype is not connected to permanent storage yet.';
  try {
    const saved = await window.CreaseIQStorage.saveSession({ file: uploadedFile, technique, cameraAngle: angle, referenceStyle: reference });
    if (saved.stored) { storageNote = 'Your video was securely saved to your session history.'; savedSession = saved.session; }
    if (saved.reason === 'not-signed-in') storageNote = 'Sign in to save this video to your session history.';
    if (saved.reason === 'not-configured') storageNote = 'Database setup is required before videos can be saved permanently.';
  } catch (error) {
    storageNote = `Video could not be saved: ${error.message}`;
  }
  document.getElementById('processingCopy').textContent = `Your ${technique.toLowerCase()} clip is ready for review. The ${angle.toLowerCase()} angle gives the coach a usable view of your movement. ${storageNote}`;
  document.getElementById('qualityChecks').innerHTML = `<div><span>Video format</span><span>Ready</span></div><div><span>Technique</span><span>${technique}</span></div><div><span>Camera angle</span><span>${angle}</span></div>`;
  await runPoseAnalysis({ file: uploadedFile, technique: techniqueKey, reference, cameraAngle: angle, session: savedSession, viewSessionButton });
});

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }

function updateDashboardFromReport(report) {
  latestReport = report;
  document.querySelector('.score span').textContent = report.score;
  document.querySelector('.score-line span').style.width = `${report.score}%`;
  const ratingList = document.querySelector('.rating-list');
  ratingList.innerHTML = report.rubricScores ? report.rubricScores.map(item => `<div><span>${escapeHtml(item.label)}</span>${item.points === null ? `<button class="dashboard-target-score">Score from clip</button>` : `<b>${item.points}/4</b>`}</div>`).join('') : report.findings.map(item => `<div><span>${escapeHtml(item.label)}</span><b>${item.score}</b></div>`).join('');
  ratingList.querySelector('.dashboard-target-score')?.addEventListener('click', () => openManualTargetScoring());
  document.querySelector('.score-card .up').textContent = report.rubricScores ? `${report.rubricTotal}/${report.rubricPossible} body-action points · accuracy pending ball tracking` : `Weighted score from ${report.findings.length} detected body-position checks`;
  const cards = report.findings.slice(0, 2).map((item, index) => `<article class="finding ${index === 0 ? 'focus' : ''}"><div class="finding-icon">0${index + 1}</div><div><span class="tag ${item.assessment === 'exemplary' ? 'neutral' : ''}">${item.assessment.replace('-', ' ').toUpperCase()}</span><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.message)}</p></div><a href="#drillLibrary">${item.assessment === 'exemplary' ? 'Keep building →' : 'Try drill →'}</a></article>`).join('');
  if (cards) document.querySelector('.finding-cards').innerHTML = cards;
  document.querySelector('.analysis-header h2').innerHTML = `${escapeHtml(report.technique)} <span class="success">• Analysed</span>`;
  if (latestClipUrl) {
    const frame = document.querySelector('.video-placeholder');
    frame.innerHTML = `<video class="analysis-clip" src="${latestClipUrl}" preload="metadata"></video><button class="video-play" id="activeClipPlay" aria-label="Watch clip">▶</button><span class="clip-label">YOUR CLIP • ${report.frameTime}s ACTION FRAME</span>`;
    document.getElementById('activeClipPlay').addEventListener('click', openClipViewer);
    document.querySelector('.video-footer span').textContent = `Analysed frame • ${report.frameTime}s`;
  }
}

async function runPoseAnalysis({ file, technique, reference, cameraAngle, session, viewSessionButton, allowUnverifiedBowling = false }) {
  try {
    if (session) await window.CreaseIQStorage.updateSessionStatus(session.id, 'processing');
    if (!window.CreaseIQPose) throw new Error('The pose-analysis engine is still loading. Refresh once and try again.');
    const stance = activeProfile?.batting_hand || 'right';
    const report = await window.CreaseIQPose.analyzeFile(file, {
      technique, stance, reference, cameraAngle, allowUnverifiedBowling,
      onProgress: message => { document.getElementById('processingCopy').textContent = message; }
    });
    updateDashboardFromReport(report);
    viewSessionButton.hidden = false;
    if (session) await window.CreaseIQStorage.saveAnalysis({ sessionId: session.id, report });
    const captureNote = report.bowlingCaptureUnverified ? ' We could not automatically verify a full bowling release, so review this report carefully.' : '';
    document.getElementById('processingCopy').textContent = `Analysis complete: ${report.score}/100. We checked ${report.framesChecked} frames and selected the clearest full-body action frame.${captureNote}`;
    const actionCheck = report.actionClassification ? `<div><span>Action check</span><span>${report.actionClassification.label.replace('-', ' ')} · ${Math.round(report.actionClassification.confidence * 100)}%</span></div>` : '';
    document.getElementById('qualityChecks').innerHTML = `<div><span>Video quality</span><span>${report.quality.width}×${report.quality.height}</span></div><div><span>Player coverage</span><span>${report.quality.playerCoverage}%</span></div><div><span>Headroom</span><span>${report.quality.headroom}%</span></div><div><span>Pose coverage</span><span>${report.landmarkCoverage}/9 key points</span></div><div><span>Frames checked</span><span>${report.framesChecked}</span></div>${actionCheck}<div><span>Action frame</span><span>${report.frameTime}s</span></div><div><span>Confidence</span><span>${report.confidence}</span></div>${report.bowlingCaptureUnverified ? '<div><span>Bowling capture</span><span>Review needed</span></div>' : ''}`;
  } catch (error) {
    if (error.code === 'UNVERIFIED_BOWLING_CAPTURE') {
      viewSessionButton.hidden = true;
      document.getElementById('processingCopy').textContent = `${error.message} If this is genuinely your bowling clip, confirm below to continue with a report marked for review.`;
      document.getElementById('qualityChecks').innerHTML = `<div><span>Automatic bowling check</span><span>Needs confirmation</span></div><div class="confirmation-actions"><button class="confirmation-secondary" id="rejectUnverifiedBowling">No, change selection</button><button class="primary-button analyze-button" id="confirmUnverifiedBowling">Yes, this is bowling — analyse it <span>→</span></button></div>`;
      document.getElementById('confirmUnverifiedBowling').addEventListener('click', () => {
        runPoseAnalysis({ file, technique, reference, cameraAngle, session, viewSessionButton, allowUnverifiedBowling: true });
      });
      document.getElementById('rejectUnverifiedBowling').addEventListener('click', async () => {
        if (session) await window.CreaseIQStorage.updateSessionStatus(session.id, 'failed').catch(() => {});
        processingModal.classList.remove('open');
        viewSessionButton.hidden = false;
        openUpload();
        status.textContent = 'Choose the correct analysis type, then start again.';
      });
      return;
    }
    if (session) await window.CreaseIQStorage.updateSessionStatus(session.id, 'failed').catch(() => {});
    document.getElementById('processingCopy').textContent = `Analysis could not finish: ${error.message}`;
  } finally {
    viewSessionButton.disabled = false;
  }
}
document.getElementById('viewSession').addEventListener('click', () => { processingModal.classList.remove('open'); document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' }); });

function openDemo() { demoModal.classList.add('open'); demoModal.setAttribute('aria-hidden', 'false'); }
function closeDemo() { demoModal.classList.remove('open'); demoModal.setAttribute('aria-hidden', 'true'); }
document.getElementById('demoButton').addEventListener('click', openDemo);
document.getElementById('cardPlay').addEventListener('click', openClipViewer);
document.getElementById('closeDemo').addEventListener('click', closeDemo);
document.querySelector('.demo-backdrop').addEventListener('click', closeDemo);
document.querySelector('.section-title button').addEventListener('click', openAnalysisReport);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeUpload(); closeDemo(); processingModal.classList.remove('open'); } });

// Dashboard controls
function showInfo(title, message, items = []) {
  const existing = document.getElementById('infoModal');
  if (existing) existing.remove();
  const list = items.length ? `<ul class="info-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>` : '';
  const panel = document.createElement('section');
  panel.id = 'infoModal';
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal demo-box"><button class="close" aria-label="Close">×</button><p class="overline">CREASEIQ</p><h2>${title}</h2><p class="modal-copy">${message}</p>${list}<button class="primary-button analyze-button">Done <span>→</span></button></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  panel.querySelector('.primary-button').addEventListener('click', close);
}

async function openSavedSessions() {
  if (!window.CreaseIQStorage.configured()) { showInfo('Sessions are not connected yet', 'Account saving has not been set up yet.'); return; }
  if (!activeUser) { showInfo('Sign in to view sessions', 'Your saved videos and reports are private to your player account.'); return; }
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal sessions-box"><button class="close" aria-label="Close">×</button><p class="overline">MY SESSIONS</p><div class="sessions-title"><h2>Saved analysis history.</h2><button id="clearHistory" class="clear-history">Clear history</button></div><p class="modal-copy">Loading your sessions...</p></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  try {
    const { sessions } = await window.CreaseIQStorage.listSessions();
    const content = sessions.length ? `<div class="session-list">${sessions.map(session => { const date = new Date(session.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); const score = session.analysis?.overall_score; const state = score !== undefined && score !== null ? `${score}/100` : session.status === 'failed' ? 'Failed' : session.status === 'processing' ? 'Processing' : 'No report'; return `<article><button class="saved-session" data-session-id="${session.id}"><div><strong>${escapeHtml(session.technique.replaceAll('-', ' '))}</strong><span>${escapeHtml(session.camera_angle)} · ${date}</span></div><b>${state}</b></button><button class="delete-session" data-session-id="${session.id}" data-video-path="${escapeHtml(session.video_path)}" aria-label="Delete this session" title="Delete session">×</button></article>`; }).join('')}</div>` : '<p class="modal-copy">No saved sessions yet. Analyse your first video to see it here.</p>';
    panel.querySelector('.modal-copy').remove();
    panel.querySelector('.sessions-box').insertAdjacentHTML('beforeend', content);
    panel.querySelectorAll('.saved-session').forEach(button => button.addEventListener('click', () => openSavedSession(button.dataset.sessionId)));
    panel.querySelectorAll('.delete-session').forEach(button => button.addEventListener('click', async () => {
      if (!(await confirmHistoryAction('Delete this session?', 'Its saved video and analysis report will be permanently removed.'))) return;
      await window.CreaseIQStorage.deleteSession({ sessionId: button.dataset.sessionId, videoPath: button.dataset.videoPath });
      panel.remove(); openSavedSessions();
    }));
    panel.querySelector('#clearHistory').addEventListener('click', async () => {
      if (!(await confirmHistoryAction('Clear all session history?', 'Every saved video and report in your account will be permanently removed.'))) return;
      await window.CreaseIQStorage.clearSessions();
      panel.remove(); openSavedSessions();
    });
  } catch (error) {
    panel.querySelector('.modal-copy').textContent = `Could not load sessions: ${error.message}`;
  }
}

function confirmHistoryAction(title, message) {
  return new Promise(resolve => {
    const panel = document.createElement('section');
    panel.className = 'demo-modal open';
    panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal confirmation-box history-confirm"><p class="overline">DELETE CONFIRMATION</p><div class="confirmation-icon">!</div><h2>${escapeHtml(title)}</h2><p class="modal-copy">${escapeHtml(message)}</p><div class="confirmation-actions"><button class="confirmation-secondary">Cancel</button><button class="danger-button">Delete</button></div></div>`;
    document.body.append(panel);
    const finish = value => { panel.remove(); resolve(value); };
    panel.querySelector('.modal-backdrop').addEventListener('click', () => finish(false));
    panel.querySelector('.confirmation-secondary').addEventListener('click', () => finish(false));
    panel.querySelector('.danger-button').addEventListener('click', () => finish(true));
  });
}

async function openSavedSession(sessionId) {
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal saved-session-view"><button class="close" aria-label="Close">×</button><p class="overline">SAVED SESSION</p><h2>Loading your session...</h2></div>`;
  document.body.append(panel);
  const close = () => { panel.querySelector('video')?.pause(); panel.remove(); };
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  try {
    const { session, analysis, videoUrl } = await window.CreaseIQStorage.getSession(sessionId);
    const findings = analysis?.report?.findings?.slice(0, 6).map(item => `<div><span>${escapeHtml(item.label)}</span><b>${item.score}/100</b></div>`).join('') || '';
    const date = new Date(session.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    panel.querySelector('.saved-session-view').innerHTML = `<button class="close" aria-label="Close">×</button><p class="overline">SAVED SESSION · ${date}</p><h2>${escapeHtml(session.technique.replaceAll('-', ' '))}</h2>${videoUrl ? `<video class="clip-player" src="${videoUrl}" controls playsinline></video>` : ''}<p class="modal-copy">${analysis ? `Score: ${analysis.overall_score}/100 · ${analysis.confidence} confidence` : `Status: ${session.status}. No completed report is available yet.`}</p>${findings ? `<div class="saved-findings">${findings}</div>` : ''}</div>`;
    panel.querySelector('.close').addEventListener('click', close);
  } catch (error) {
    panel.querySelector('.saved-session-view h2').textContent = 'Could not open this session.';
    panel.querySelector('.saved-session-view').insertAdjacentHTML('beforeend', `<p class="modal-copy">${escapeHtml(error.message)}</p>`);
  }
}

async function openProgress() {
  if (!window.CreaseIQStorage.configured()) { showInfo('Progress is not connected yet', 'Account saving has not been set up yet.'); return; }
  if (!activeUser) { showInfo('Sign in to view progress', 'Your score trend is built from sessions saved to your player account.'); return; }
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal progress-modal"><button class="close" aria-label="Close">×</button><p class="overline">PROGRESS TRACKING</p><h2>Your score trend.</h2><p class="modal-copy">Loading saved session scores...</p></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  try {
    const { sessions } = await window.CreaseIQStorage.listSessions();
    const completed = sessions.filter(session => session.analysis?.overall_score !== null && session.analysis?.overall_score !== undefined).reverse();
    const toPoints = selected => completed.filter(selected).map((session, index) => ({ x: index + 1, score: session.analysis.overall_score, date: new Date(session.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) }));
    const battingPoints = toPoints(session => !session.technique.includes('bowling'));
    const bowlingPoints = toPoints(session => session.technique.includes('bowling'));
    if (!completed.length) { panel.querySelector('.modal-copy').textContent = 'Complete an analysis to begin tracking progress.'; return; }
    const chart = (title, points) => {
      if (!points.length) return `<section class="progress-series" data-progress-series="${title.toLowerCase()}"><h3>${title}</h3><p>No scored ${title.toLowerCase()} sessions yet.</p></section>`;
      const width = 520, height = 220, left = 48, right = 20, top = 22, bottom = 42;
      const x = index => points.length === 1 ? (left + width - right) / 2 : left + ((width - left - right) * index / (points.length - 1));
      const y = score => top + ((100 - score) / 100) * (height - top - bottom);
      const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(point.score).toFixed(1)}`).join(' ');
      const dots = points.map((point, index) => `<circle class="progress-point" cx="${x(index).toFixed(1)}" cy="${y(point.score).toFixed(1)}" r="4" tabindex="0" role="button" data-series="${title}" data-score="${point.score}" data-date="${escapeHtml(point.date)}"><title>Session ${point.x}: ${point.score}/100 · ${point.date}</title></circle>`).join('');
      const labels = points.map((point, index) => `<text x="${x(index).toFixed(1)}" y="${height - 16}" text-anchor="middle">${escapeHtml(point.date)}</text>`).join('');
      const ticks = [0, 25, 50, 75, 100].map(score => `<g><line x1="${left}" x2="${width - right}" y1="${y(score)}" y2="${y(score)}"></line><text x="${left - 8}" y="${y(score) + 4}" text-anchor="end">${score}</text></g>`).join('');
      return `<section class="progress-series" data-progress-series="${title.toLowerCase()}"><div><h3>${title}</h3><strong>${points.at(-1).score}/100</strong></div><svg class="progress-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title} score trend across ${points.length} sessions"><title>${title} score trend</title><g class="chart-grid">${ticks}</g><path class="chart-line" d="${path}"></path><g class="chart-dots">${dots}</g><g class="chart-labels">${labels}</g></svg></section>`;
    };
    panel.querySelector('.modal-copy').remove();
    panel.querySelector('.progress-modal').insertAdjacentHTML('beforeend', `<div class="progress-filters"><button class="selected" data-progress-filter="batting">Batting</button><button data-progress-filter="bowling">Bowling</button></div><p id="progressPointDetail" class="progress-point-detail">Hover over a point to view that session’s score.</p>${chart('Batting', battingPoints)}${chart('Bowling', bowlingPoints)}`);
    const showPoint = point => { panel.querySelector('#progressPointDetail').textContent = `${point.dataset.series} · ${point.dataset.date} · ${point.dataset.score}/100`; };
    panel.querySelectorAll('.progress-point').forEach(point => {
      point.addEventListener('click', () => showPoint(point));
      point.addEventListener('mouseenter', () => showPoint(point));
      point.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showPoint(point); } });
    });
    panel.querySelectorAll('[data-progress-series]').forEach(series => { series.hidden = series.dataset.progressSeries !== 'batting'; });
    panel.querySelectorAll('[data-progress-filter]').forEach(button => button.addEventListener('click', () => {
      const selected = button.dataset.progressFilter;
      panel.querySelectorAll('[data-progress-filter]').forEach(control => control.classList.toggle('selected', control === button));
      panel.querySelectorAll('[data-progress-series]').forEach(series => { series.hidden = series.dataset.progressSeries !== selected; });
    }));
  } catch (error) { panel.querySelector('.modal-copy').textContent = `Could not load progress: ${error.message}`; }
}

function openSignIn() {
  if (!window.CreaseIQStorage.configured()) {
    showInfo('Accounts are not ready yet', 'Account saving is still being set up. Please try again shortly.');
    return;
  }
  const panel = document.createElement('section');
  panel.className = 'demo-modal open sign-in-modal';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal sign-in-box"><button class="close" aria-label="Close">×</button><p class="overline">WELCOME TO CREASEIQ</p><div class="confirmation-icon">↗</div><h2>Create or sign in to your player account.</h2><p class="modal-copy">Enter your email and we’ll send a secure link. New players get a CreaseIQ account automatically — no password needed.</p><form id="signInForm" class="profile-form"><label>Email address<input id="signInEmail" type="email" autocomplete="email" required placeholder="you@example.com" /></label><button class="primary-button analyze-button" type="submit">Continue with email <span>→</span></button><p class="upload-status" id="signInStatus"></p></form></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  panel.querySelector('#signInForm').addEventListener('submit', async event => {
    event.preventDefault();
    const email = panel.querySelector('#signInEmail').value.trim();
    const button = panel.querySelector('button[type="submit"]');
    const message = panel.querySelector('#signInStatus');
    button.disabled = true;
    message.textContent = 'Sending your secure link...';
    try {
      await window.CreaseIQStorage.signIn(email);
      close();
      showInfo('Check your email', `We sent a secure sign-in link to ${email}. Open it, then return here to upload and save videos.`);
    } catch (error) {
      button.disabled = false;
      message.textContent = error.message;
    }
  });
}
document.getElementById('signInButton').addEventListener('click', openSignIn);

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function displayProfile(profile) {
  activeProfile = profile;
  const name = profile.display_name || 'Player';
  document.querySelector('.sidebar-user strong').textContent = name;
  document.querySelector('.sidebar-user small').textContent = profile.academy_name || 'CreaseIQ player';
  document.querySelector('.player-avatar').textContent = initials(name);
  document.getElementById('signInButton').textContent = 'Signed in';
  document.getElementById('profileButton').textContent = initials(name);
}

function openProfileSetup(user, profile) {
  if (document.getElementById('profileModal')) return;
  const panel = document.createElement('section');
  panel.id = 'profileModal';
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal profile-box"><p class="overline">WELCOME TO CREASEIQ</p><h2>Successfully logged in.</h2><p class="modal-copy">Set up your player profile so every session is saved to the right account.</p><form id="profileForm" class="profile-form"><label>Full name<input id="profileName" required maxlength="80" placeholder="e.g. Abhay Chari" /></label><label>Batting hand<select id="profileHand"><option value="right">Right-handed</option><option value="left">Left-handed</option></select></label><label>Academy or club <span>(optional)</span><input id="profileAcademy" maxlength="100" placeholder="e.g. Mumbai Cricket Academy" /></label><button class="primary-button analyze-button" type="submit">Save profile <span>→</span></button><p class="upload-status" id="profileStatus"></p></form></div>`;
  document.body.append(panel);
  panel.querySelector('#profileName').value = profile?.display_name || '';
  panel.querySelector('#profileAcademy').value = profile?.academy_name || '';
  if (profile?.batting_hand) panel.querySelector('#profileHand').value = profile.batting_hand;
  panel.querySelector('#profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const saveButton = panel.querySelector('button[type="submit"]');
    const statusLine = panel.querySelector('#profileStatus');
    saveButton.disabled = true; statusLine.textContent = 'Saving your profile...';
    try {
      const updated = await window.CreaseIQStorage.updateProfile({
        userId: user.id,
        displayName: panel.querySelector('#profileName').value.trim(),
        battingHand: panel.querySelector('#profileHand').value,
        academyName: panel.querySelector('#profileAcademy').value.trim()
      });
      displayProfile(updated);
      panel.remove();
      showInfo('Profile created', `Welcome, ${updated.display_name}. Your videos, analyses, and progress will now be saved to your private profile.`);
    } catch (error) {
      saveButton.disabled = false; statusLine.textContent = `Could not save profile: ${error.message}`;
    }
  });
}

async function handleAuthenticatedUser(user) {
  if (!user) return;
  activeUser = user;
  try {
    const profile = await window.CreaseIQStorage.getProfile(user.id);
    if (profile && profile.profile_completed_at) {
      displayProfile(profile);
      return;
    }
    openProfileSetup(user, profile);
  } catch (error) {
    console.error('Profile load failed:', error);
  }
}

if (window.CreaseIQStorage.configured()) {
  window.CreaseIQStorage.onAuthStateChange(handleAuthenticatedUser);
}

async function openProfileView() {
  if (!window.CreaseIQStorage.configured()) {
    showInfo('Profile unavailable', 'Account saving has not been set up yet.');
    return;
  }
  const user = activeUser || await window.CreaseIQStorage.currentUser();
  if (!user) {
    showInfo('Sign in first', 'Use the Sign in button to access your private player profile.');
    return;
  }
  const profile = activeProfile || await window.CreaseIQStorage.getProfile(user.id);
  if (!profile || !profile.profile_completed_at) {
    openProfileSetup(user, profile);
    return;
  }
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal profile-view"><button class="close" aria-label="Close">×</button><div class="profile-hero"><div class="profile-large-avatar">${initials(profile.display_name || 'Player')}</div><div><p class="overline">PLAYER PROFILE</p><h2>${profile.display_name}</h2><p>${profile.academy_name || 'CreaseIQ player'}</p></div></div><div class="profile-details"><div><span>Batting hand</span><strong>${profile.batting_hand === 'left' ? 'Left-handed' : 'Right-handed'}</strong></div><div><span>Account email</span><strong>${user.email}</strong></div></div></div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
}
document.getElementById('profileButton').addEventListener('click', openProfileView);

function openClipViewer() {
  if (!latestClipUrl) { showInfo('No clip available', 'Upload and analyse a video first, then you can watch it from this card.'); return; }
  const techniqueName = latestReport?.technique || 'your technique';
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal clip-viewer"><button class="close" aria-label="Close">×</button><p class="overline">YOUR UPLOADED CLIP</p><h2>Watch your ${escapeHtml(techniqueName).toLowerCase()}.</h2><video class="clip-player" src="${latestClipUrl}" controls autoplay playsinline></video></div>`;
  document.body.append(panel);
  const close = () => { panel.querySelector('video').pause(); panel.remove(); };
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
}

function openAnalysisReport() {
  if (!latestReport) { showInfo('No analysis report yet', 'Upload a side-on cover-drive clip and select Check video & start to create your first report.'); return; }
  const report = latestReport;
  const findings = report.findings.map(item => `<div class="report-finding"><div><span class="report-grade ${item.assessment}">${item.assessment.replace('-', ' ')}</span><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.message)}</p></div><strong>${item.score}<small>/100</small></strong></div>`).join('');
  const rubricScores = report.rubricScores ? `<section class="rubric-score-report"><h3>${escapeHtml(report.technique)} scoring</h3>${report.rubricScores.map(item => `<div><div><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.note)}</p></div>${item.points === null ? `<button class="set-accuracy" data-accuracy="true">Score from clip</button>` : `<b>${item.points}/4</b>`}</div>`).join('')}<p class="rubric-total">Rubric total: ${report.rubricTotal}/${report.rubricPossible}. ${report.rubricScores.some(item => item.points === null) ? 'Score landing accuracy from the clip to complete the 16-point total.' : 'All four rubric categories are scored.'}</p></section>` : '';
  const pending = report.pendingChecks.length ? `<p class="report-note">Still awaiting bat/ball or eye tracking: ${report.pendingChecks.map(item => escapeHtml(item.label)).join(', ')}.</p>` : '';
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal report-modal"><button class="close" aria-label="Close">×</button><p class="overline">PERSONALISED COACHING REPORT</p><div class="report-title"><div><h2>${escapeHtml(report.technique)} analysis</h2></div><div class="report-score">${report.score}<small>/100</small></div></div><p class="modal-copy">${escapeHtml(report.message)} Analysed action frame: ${report.frameTime}s.</p>${rubricScores}<div class="report-findings">${findings}</div>${pending}</div>`;
  document.body.append(panel);
  const close = () => panel.remove();
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  panel.querySelector('.set-accuracy')?.addEventListener('click', () => openManualTargetScoring(() => { panel.remove(); openAnalysisReport(); }));
}

function openManualTargetScoring(onComplete) {
  if (!latestClipUrl || !latestReport?.rubricScores) return;
  const panel = document.createElement('section');
  panel.className = 'demo-modal open';
  panel.innerHTML = `<div class="modal-backdrop"></div><div class="modal target-score-modal"><button class="close" aria-label="Close">×</button><p class="overline">MANUAL TARGET REVIEW</p><h2>Score the landing accuracy.</h2><p class="modal-copy">Watch your real clip and select the score that best matches the ball’s landing. This completes the Accuracy &amp; Target Hit category until automatic ball tracking is added.</p><video class="clip-player" src="${latestClipUrl}" controls playsinline></video><div class="target-score-options"><button data-points="4"><b>4 · Advanced</b><span>Consistently hits the good-length or marked target zone.</span></button><button data-points="3"><b>3 · Proficient</b><span>Hits target most of the time; occasional full or short ball.</span></button><button data-points="2"><b>2 · Developing</b><span>Common wide or short deliveries; line is inconsistent.</span></button><button data-points="1"><b>1 · Beginner</b><span>Frequently misses the pitch or delivers wides.</span></button></div></div>`;
  document.body.append(panel);
  const close = () => { panel.querySelector('video').pause(); panel.remove(); };
  panel.querySelector('.close').addEventListener('click', close);
  panel.querySelector('.modal-backdrop').addEventListener('click', close);
  panel.querySelectorAll('[data-points]').forEach(button => button.addEventListener('click', () => {
    const points = Number(button.dataset.points);
    const accuracy = latestReport.rubricScores.find(item => item.points === null);
    accuracy.points = points;
    accuracy.note = `Manually scored from the uploaded clip: ${points}/4.`;
    latestReport.rubricTotal = latestReport.rubricScores.reduce((total, item) => total + (item.points || 0), 0);
    latestReport.rubricPossible = latestReport.rubricScores.length * 4;
    latestReport.score = Math.round((latestReport.rubricTotal / latestReport.rubricPossible) * 100);
    latestReport.message = `${latestReport.technique} rubric score: ${latestReport.rubricTotal}/${latestReport.rubricPossible}. Landing accuracy was manually reviewed from your clip.`;
    updateDashboardFromReport(latestReport);
    close();
    onComplete?.();
  }));
}

const sideMenuButtons = document.querySelectorAll('.side-menu button');
const sideMenuActions = [
  () => document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' }),
  () => openSavedSessions(),
  () => document.getElementById('drillLibrary').scrollIntoView({ behavior: 'smooth' }),
  () => openProgress()
];
sideMenuButtons.forEach((button, index) => button.addEventListener('click', () => {
  sideMenuButtons.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  sideMenuActions[index]();
}));

document.querySelector('.side-bottom button').addEventListener('click', () => showInfo('Tomorrow’s net plan', 'A focused 30-minute session for your cover drive.', ['10 shadow drives: head over front foot', '18 feeds: positive stride to cover', '12 controlled drives: high follow-through']));
document.querySelector('.video-footer button').addEventListener('click', openClipViewer);
processingModal.querySelector('.modal-backdrop').addEventListener('click', () => processingModal.classList.remove('open'));
