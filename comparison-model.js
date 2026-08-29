/* CreaseIQ comparison model v0.2 — accepts normalised MediaPipe-style points. */
(function () {
  const point = (l, name) => l[name] || null;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const average = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const angle = (a, b, c) => {
    const ab = { x: a.x - b.x, y: a.y - b.y }, cb = { x: c.x - b.x, y: c.y - b.y };
    return Math.round(Math.acos(clamp((ab.x * cb.x + ab.y * cb.y) / (Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y)), -1, 1)) * 180 / Math.PI);
  };
  const scoreRange = (v, [min, max], tolerance) => v >= min && v <= max ? 100 : Math.round(100 * (1 - clamp((v < min ? min - v : v - max) / tolerance, 0, 1)));
  const has = (l, names) => names.every(name => point(l, name));
  const assessmentForScore = score => score >= 86 ? 'exemplary' : score >= 65 ? 'competent' : 'needs-practice';

  // Every technique principle supplied for the cover drive is stored here.
  const coverDriveChecklist = [
    ["stance-width", "Stance and grip", "Feet are shoulder-width apart", "pose"],
    ["weight-balance", "Balance and weight transfer", "Weight transfer", "pose"],
    ["relaxed-grip", "Stance and grip", "Bat is held with a comfortable, relaxed grip", "hand-and-bat"],
    ["shoulder-alignment", "Stance and grip", "Shoulders face the bowler's run-up", "3d-pose"],
    ["positive-stride", "Footwork and alignment", "Front foot steps smoothly towards the ball", "pose"],
    ["pitch-proximity", "Footwork and alignment", "Front foot is close to the pitch of the ball", "ball-tracking"],
    ["front-toe", "Footwork and alignment", "Front toe points towards cover", "3d-pose"],
    ["back-foot-stability", "Footwork and alignment", "Back foot remains stable and grounded", "temporal-pose"],
    ["front-knee", "Body and bat position", "Front knee moves over the front toe", "pose"],
    ["head-over-front-foot", "Body and bat position", "Head position", "pose"],
    ["head-stability", "Head and eyes", "Head stays still through contact", "pose"],
    ["eye-tracking", "Head and eyes", "Eyes stay level and track the ball onto the bat face", "eye-tracking"],
    ["back-elbow", "Body and bat position", "Back elbow", "pose"],
    ["straight-bat-path", "Body and bat position", "Bat swings straight down in line with the ball", "bat-tracking"],
    ["late-contact", "Contact and follow-through", "Ball is hit late and under the eyes", "ball-and-bat"],
    ["middle-contact", "Contact and follow-through", "Ball meets the middle of the bat face", "ball-and-bat"],
    ["firm-wrists", "Contact and follow-through", "Wrists remain firm through impact", "hand-and-bat"],
    ["high-follow-through", "Contact and follow-through", "Finish is high, balanced, and points to target", "temporal-pose"]
  ].map(([id, phase, label, tracking]) => ({ id, phase, label, tracking }));
  const checkpoint = (id, phase, label, tracking = 'pose', drill = '') => ({ id, phase, label, tracking, drill });
  const bodyChecks = (labels = {}) => [
    checkpoint('stance-width', 'Set-up', labels.stance || 'Stable base'),
    checkpoint('weight-balance', 'Balance', labels.balance || 'Balance and weight transfer'),
    checkpoint('positive-stride', 'Footwork', labels.footwork || 'Foot movement'),
    checkpoint('front-knee', 'Body position', labels.knee || 'Knee position'),
    checkpoint('head-over-front-foot', 'Head and eyes', labels.head || 'Head position'),
    checkpoint('back-elbow', 'Bat position', labels.elbow || 'Elbow position'),
    checkpoint('head-stability', 'Head and eyes', labels.stability || 'Head stability')
  ];
  const profiles = {
    'cover-drive': { label: 'Cover drive', checklist: coverDriveChecklist },
    'fast-bowling': { label: 'Fast bowling', checklist: [...bodyChecks({ stance: 'Run-up base', balance: 'Follow-through balance', footwork: 'Delivery stride', knee: 'Front-leg brace', head: 'Head alignment', elbow: 'Bowling-arm position', stability: 'Action stability' }), checkpoint('seam-grip', 'Technique and grip', 'Two-finger grip and seam orientation', 'hand-and-ball'), checkpoint('target-hit', 'Accuracy and target hit', 'Good-length target hit', 'ball-tracking')], drill: 'Record side-on with the complete run-up, delivery stride and follow-through in frame.' },
    'spin-bowling': { label: 'Spin bowling', checklist: [...bodyChecks({ stance: 'Balanced approach base', balance: 'Follow-through balance', footwork: 'Delivery stride', knee: 'Front-leg control', head: 'Head alignment', elbow: 'Bowling-arm position', stability: 'Action stability' }), checkpoint('spin-grip', 'Technique and release', 'Finger or wrist release control', 'hand-and-ball'), checkpoint('flight-turn-target', 'Flight, turn and target hit', 'Line, length, flight and turn', 'ball-tracking')], drill: 'Record the full approach, release, flight and follow-through with the pitch in view.' },
    'straight-off-drive': { label: 'Straight drive / Off drive', checklist: [...bodyChecks({ head: 'Head over ball', elbow: 'High front elbow', footwork: 'Front-foot pitch' }), checkpoint('full-bat-face', 'Contact', 'Full bat face presented', 'bat-tracking'), checkpoint('ground-contact', 'Contact', 'Ball driven along the ground', 'ball-tracking')], drill: 'Drop-ball drill: drive a dropped ball along the ground through a target gate.' },
    'on-drive': { label: 'On-drive', checklist: [...bodyChecks({ balance: 'Balance into leg-stump line', footwork: 'Stride led by head and front shoulder', elbow: 'Straight vertical bat path' }), checkpoint('top-hand-control', 'Bat control', 'Top-hand dominance', 'hand-and-bat'), checkpoint('back-toe', 'Footwork', 'Back heel lifts while anchored on toe', 'temporal-pose')], drill: 'Target gate drill: drive half-volleys through cones at mid-on.' },
    'back-foot-punch': { label: 'Back-foot punch', checklist: [...bodyChecks({ balance: 'Weight over back foot', footwork: 'Back and across movement', head: 'Head over back foot', elbow: 'High controlling elbow' }), checkpoint('downward-punch', 'Bat path', 'Authoritative downward punch', 'bat-tracking')], drill: 'Short-hop deflection: move back and punch bouncing feeds down past a cone.' },
    'square-late-cut': { label: 'Square cut / Late cut', checklist: [...bodyChecks({ footwork: 'Deep back-and-across movement', balance: 'Weight transfer to back foot', elbow: 'Full arm extension' }), checkpoint('horizontal-arc', 'Bat path', 'Wide horizontal bat arc', 'bat-tracking'), checkpoint('wrist-roll', 'Contact', 'Wrists roll over after contact', 'hand-and-bat')], drill: 'Side-arm cutting: use wide off-stump feeds and roll the wrists over the ball.' },
    'pull-shot': { label: 'Pull shot', checklist: [...bodyChecks({ balance: 'Weight onto back foot', head: 'Head inside the ball line', footwork: 'Stable pulling base' }), checkpoint('horizontal-swing', 'Bat path', 'High-to-low horizontal swing', 'bat-tracking'), checkpoint('ball-tracking', 'Head and eyes', 'Eyes stay on the ball', 'eye-tracking')], drill: 'Incrediball pulling: roll the wrists and hit waist-high feeds into a floor mat.' },
    'hook-shot': { label: 'Hook shot', checklist: [...bodyChecks({ head: 'Head stays steady through rotation', balance: 'Body gets inside bouncer line', footwork: 'Balanced bouncer position' }), checkpoint('shoulder-height-contact', 'Contact', 'Ball contacted at chest or shoulder height', 'ball-and-bat'), checkpoint('bouncer-tracking', 'Head and eyes', 'Eyes track the bouncer', 'eye-tracking')], drill: 'Bouncer tracking: use soft balls at shoulder height into a protective net.' },
    'forward-defensive': { label: 'Forward defensive', checklist: [...bodyChecks({ balance: 'Weight over front knee', footwork: 'Long comfortable forward stride', head: 'Head over front knee', elbow: 'Vertical bat position' }), checkpoint('bat-pad', 'Defense', 'Bat held close to front pad', 'bat-tracking'), checkpoint('soft-hands', 'Defense', 'Loose bottom hand absorbs impact', 'hand-and-bat')], drill: 'Bobble-feed blocking: keep every soft feed within a two-metre circle.' },
    'backward-defensive': { label: 'Backward defensive', checklist: [...bodyChecks({ balance: 'Weight over back foot', footwork: 'Back and across to cover stumps', head: 'Ball met under the eyes', elbow: 'Hands stay elevated' }), checkpoint('vertical-bat', 'Defense', 'Vertical bat kills momentum', 'bat-tracking'), checkpoint('soft-hands', 'Defense', 'Soft hands absorb bounce', 'hand-and-bat')], drill: 'Short-length defense: step back and absorb the ball with soft hands.' },
    'leave': { label: 'The leave', checklist: [...bodyChecks({ footwork: 'Decisive movement to control position', head: 'Eyes follow ball to wicketkeeper', balance: 'Balanced body position' }), checkpoint('bat-retraction', 'Decision', 'Bat withdrawn early from ball line', 'bat-tracking'), checkpoint('line-judgment', 'Decision', 'Correct off-stump line judgment', 'ball-tracking')], drill: 'Line-judgment drill: call Play or Leave before the ball bounces.' },
    'leg-glance-flick': { label: 'Leg glance / Flick shot', checklist: [...bodyChecks({ footwork: 'Front foot creates leg-side room', head: 'Contact under the eyes', balance: 'Balanced deflection base' }), checkpoint('late-bat-face', 'Bat control', 'Bat face stays straight until impact', 'bat-tracking'), checkpoint('wrist-snap', 'Contact', 'Wrists deflect the ball cleanly', 'hand-and-bat')], drill: 'Stump-line feeding: use light wrists to guide leg-stump feeds past fine leg.' },
    'sweep-shot': { label: 'Sweep shot', checklist: [...bodyChecks({ footwork: 'Front foot reaches down the ball line', knee: 'Low one-knee base', head: 'Head low over front knee', balance: 'Low balanced base' }), checkpoint('low-sweep', 'Bat path', 'Low, flat horizontal sweep', 'bat-tracking'), checkpoint('half-volley-contact', 'Contact', 'Ball met on the half-volley', 'ball-and-bat')], drill: 'Paddle-sweep progression: drop low and brush soft spin feeds fine.' }
  };
  // The professional standard uses the same consistent coaching rubric for every player.
  const referenceStyles = {
    "professional": { label: "Professional player analysis", stance: "right", note: "Benchmarked against a consistent professional cover-drive coaching standard.", emphasis: {} }
  };

  function poseMetrics(l, stance, profile) {
    const front = stance === "left" ? "right" : "left", back = front === "left" ? "right" : "left";
    const shoulderWidth = () => distance(point(l, "left_shoulder"), point(l, "right_shoulder"));
    const metrics = [
      ["stance-width", 10, ["left_ankle", "right_ankle", "left_shoulder", "right_shoulder"], () => distance(point(l, "left_ankle"), point(l, "right_ankle")) / shoulderWidth(), [0.85, 1.65], .85, "Base is athletic and shoulder-width apart.", "Set your feet roughly shoulder-width apart before the ball is released."],
      ["weight-balance", 10, ["left_shoulder", "right_shoulder", "left_ankle", "right_ankle"], () => Math.abs(average(point(l, "left_shoulder"), point(l, "right_shoulder")).x - average(point(l, "left_ankle"), point(l, "right_ankle")).x) / shoulderWidth(), [0, .3], .45, "Your body mass is centred over a stable base.", "Start with your weight more evenly centred between both feet."],
      ["positive-stride", 15, ["left_ankle", "right_ankle", "left_shoulder", "right_shoulder"], () => distance(point(l, `${front}_ankle`), point(l, `${back}_ankle`)) / shoulderWidth(), [.9, 1.85], .95, "Your front-foot stride is positive and controlled.", "Take a slightly more committed stride towards the pitch of the ball."],
      ["front-knee", 20, [`${front}_hip`, `${front}_knee`, `${front}_ankle`], () => angle(point(l, `${front}_hip`), point(l, `${front}_knee`), point(l, `${front}_ankle`)), [125, 165], 42, "Front knee is in a strong position over the toe.", "Let the front knee travel forward over the front toe as you reach the ball."],
      ["head-over-front-foot", 20, ["nose", "left_shoulder", "right_shoulder", `${front}_ankle`], () => Math.abs(point(l, "nose").x - point(l, `${front}_ankle`).x) / shoulderWidth(), [0, .62], .7, "Your head is well placed over the front foot.", "Keep your head closer to the front foot so the ball stays under your eyes."],
      ["back-elbow", 15, [`${back}_shoulder`, `${back}_elbow`, "left_shoulder", "right_shoulder"], () => (point(l, `${back}_elbow`).y - point(l, `${back}_shoulder`).y) / shoulderWidth(), [-.55, .18], .65, "Back elbow is high enough to support a controlled downswing.", "Raise the back elbow earlier to create a straighter, more powerful bat swing."],
      ["head-stability", 10, ["nose", "left_shoulder", "right_shoulder"], () => Math.abs(point(l, "nose").x - average(point(l, "left_shoulder"), point(l, "right_shoulder")).x) / shoulderWidth(), [0, .28], .42, "Head remains quiet through the shot.", "Avoid letting your head fall sideways during contact."]
    ];
    return metrics.filter(([, , needs]) => has(l, needs)).map(([id, weight, , measure, target, tolerance, good, improve]) => {
      const value = measure(), score = scoreRange(value, target, tolerance), criterion = profile.checklist.find(c => c.id === id) || { phase: 'Technique', label: id.replaceAll('-', ' ') };
      return { id, phase: criterion.phase, label: criterion.label, value, target, weight, score, source: "pose", assessment: assessmentForScore(score), status: score >= 75 ? "good" : "improve", message: score >= 86 ? good : score >= 65 ? `Competent: ${good}` : improve };
    });
  }

  function compare(landmarks, technique = "cover-drive", options = {}) {
    const profile = profiles[technique];
    if (!profile) throw new Error(`Unsupported technique: ${technique}`);
    const reference = referenceStyles[options.reference || "professional"] || referenceStyles.professional;
    const findings = poseMetrics(landmarks, options.stance || reference.stance, profile);
    const suppliedChecks = options.checks || {};
    profile.checklist.filter(c => c.tracking !== "pose" && suppliedChecks[c.id] !== undefined).forEach(c => {
      const raw = suppliedChecks[c.id], score = typeof raw === "boolean" ? (raw ? 100 : 0) : clamp(Number(raw), 0, 100);
      findings.push({ id: c.id, phase: c.phase, label: c.label, score, weight: 10, source: c.tracking, assessment: assessmentForScore(score), status: score >= 75 ? "good" : "improve", message: score >= 86 ? 'Exemplary execution.' : score >= 65 ? 'Competent foundation; keep refining this checkpoint.' : `Needs practice: ${c.label.toLowerCase()}.` });
    });
    findings.forEach(item => { item.weight = Math.round(item.weight * (reference.emphasis[item.id] || 1)); });
    if (!findings.length) return { technique: profile.label, reference: reference.label, score: null, confidence: "low", findings: [], pendingChecks: profile.checklist, message: "No usable body landmarks were supplied." };
    const totalWeight = findings.reduce((t, item) => t + item.weight, 0);
    findings.forEach(item => { item.weightShare = Math.round((item.weight / totalWeight) * 100); item.weightedPoints = Number(((item.score * item.weight) / totalWeight).toFixed(1)); });
    const score = Math.round(findings.reduce((t, item) => t + item.score * item.weight, 0) / totalWeight), finished = new Set(findings.map(item => item.id));
    const categorySummary = [...new Set(findings.map(item => item.phase))].map(phase => {
      const items = findings.filter(item => item.phase === phase);
      const categoryScore = Math.round(items.reduce((total, item) => total + item.score, 0) / items.length);
      return { phase, score: categoryScore, assessment: assessmentForScore(categoryScore) };
    });
    const result = { technique: profile.label, reference: reference.label, referenceNote: reference.note, score, confidence: findings.length >= 7 ? "high" : "medium", findings: findings.sort((a, b) => a.score - b.score), categories: categorySummary, pendingChecks: profile.checklist.filter(c => !finished.has(c.id)), message: `Compared ${findings.length} available checkpoints against the ${profile.label} rubric.` };
    if (technique === 'fast-bowling' || technique === 'spin-bowling') {
      const fourPointScore = ids => {
        const items = findings.filter(item => ids.includes(item.id));
        if (!items.length) return null;
        const averageScore = items.reduce((total, item) => total + item.score, 0) / items.length;
        return averageScore >= 86 ? 4 : averageScore >= 65 ? 3 : averageScore >= 40 ? 2 : 1;
      };
      const isSpin = technique === 'spin-bowling';
      const rubricScores = [
        { label: isSpin ? 'Technique and release' : 'Technique and grip', points: fourPointScore(['positive-stride', 'back-elbow']), note: isSpin ? 'Approach and release posture; finger/wrist release needs hand-and-ball tracking.' : 'Run-up and release posture; seam grip needs hand-and-ball tracking.' },
        { label: 'Body alignment and action', points: fourPointScore(['front-knee', 'head-over-front-foot']), note: 'Delivery stride, front-leg brace and alignment.' },
        { label: isSpin ? 'Flight, turn and target hit' : 'Accuracy and target hit', points: null, note: 'Awaiting ball and pitch target tracking.' },
        { label: 'Follow-through and balance', points: fourPointScore(['weight-balance', 'head-stability']), note: 'Balance and control through the action.' }
      ];
      const scored = rubricScores.filter(item => item.points !== null);
      const totalPoints = scored.reduce((total, item) => total + item.points, 0);
      result.rubricScores = rubricScores;
      result.rubricTotal = totalPoints;
      result.rubricPossible = scored.length * 4;
      result.score = Math.round((totalPoints / result.rubricPossible) * 100);
      result.message = `${profile.label} body-action score: ${totalPoints}/${result.rubricPossible}. Ball-flight and target tracking are pending.`;
    }
    return result;
  }
  window.CreaseIQComparison = { compare, profiles, referenceStyles };
})();
