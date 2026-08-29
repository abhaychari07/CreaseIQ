/* Client-side body-pose extraction for CreaseIQ batting-shot analysis. */
const landmarkNames = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner', 'right_eye', 'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index', 'right_index', 'left_thumb', 'right_thumb',
  'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_heel', 'right_heel', 'left_foot_index', 'right_foot_index'
];

let poseLandmarkerPromise;
let lastPoseTimestamp = 0;

function nextPoseTimestamp() {
  // A reused MediaPipe VIDEO-mode landmarker requires timestamps to increase
  // across every clip, not just within one uploaded file.
  lastPoseTimestamp = Math.max(lastPoseTimestamp + 1, Math.round(performance.now()));
  return lastPoseTimestamp;
}

async function getPoseLandmarker() {
  if (poseLandmarkerPromise) return poseLandmarkerPromise;
  poseLandmarkerPromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm');
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm');
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'GPU' },
      runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.55, minPosePresenceConfidence: 0.55, minTrackingConfidence: 0.55
    });
  })();
  return poseLandmarkerPromise;
}

function waitFor(video, event) {
  return new Promise((resolve, reject) => {
    const done = () => { video.removeEventListener(event, done); resolve(); };
    video.addEventListener(event, done, { once: true });
    video.addEventListener('error', () => reject(new Error('The video could not be decoded in this browser.')), { once: true });
  });
}

async function seek(video, seconds) {
  video.currentTime = Math.min(Math.max(seconds, 0), Math.max(video.duration - 0.01, 0));
  await waitFor(video, 'seeked');
}

function normaliseLandmarks(landmarks) {
  return landmarks.reduce((result, landmark, index) => {
    result[landmarkNames[index]] = { x: landmark.x, y: landmark.y, visibility: landmark.visibility ?? 1 };
    return result;
  }, {});
}

function usableLandmarkCount(landmarks) {
  const required = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
  return required.filter(name => (landmarks[name]?.visibility ?? 0) > 0.45).length;
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

async function estimateFrameRate(video) {
  if (!video.requestVideoFrameCallback) throw new Error('Use a current Chrome, Edge, or Safari browser so CreaseIQ can verify the video frame rate.');
  return new Promise((resolve, reject) => {
    const times = [];
    let timeout;
    const finish = () => {
      clearTimeout(timeout);
      video.pause();
      const deltas = times.slice(1).map((time, index) => time - times[index]).filter(delta => delta > 0.002 && delta < 0.1);
      if (deltas.length < 4) return reject(new Error('We could not verify the frame rate. Upload a longer 60 fps clip.'));
      resolve(1 / median(deltas));
    };
    const readFrame = (_now, metadata) => {
      times.push(metadata.mediaTime);
      if (times.length >= 9) return finish();
      video.requestVideoFrameCallback(readFrame);
    };
    timeout = setTimeout(() => reject(new Error('We could not verify the frame rate. Upload a longer 60 fps clip.')), 5000);
    video.requestVideoFrameCallback(readFrame);
    video.play().catch(() => reject(new Error('The video could not be played to verify its frame rate.')));
  });
}

function playerFraming(landmarks) {
  const visible = Object.values(landmarks).filter(point => (point.visibility ?? 0) >= 0.45);
  const xs = visible.map(point => point.x), ys = visible.map(point => point.y);
  const left = Math.max(0, Math.min(...xs)), right = Math.min(1, Math.max(...xs));
  const top = Math.max(0, Math.min(...ys)), bottom = Math.min(1, Math.max(...ys));
  return { coverage: (right - left) * (bottom - top), headroom: top };
}

function looksLikeBowlingAction(landmarks) {
  const leftShoulder = landmarks.left_shoulder, rightShoulder = landmarks.right_shoulder;
  if (!leftShoulder || !rightShoulder) return false;
  const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
  return ['left', 'right'].some(side => {
    const otherSide = side === 'left' ? 'right' : 'left';
    const shoulder = landmarks[`${side}_shoulder`], wrist = landmarks[`${side}_wrist`], elbow = landmarks[`${side}_elbow`], otherWrist = landmarks[`${otherSide}_wrist`];
    if (!shoulder || !wrist || !elbow || !otherWrist || (wrist.visibility ?? 0) < 0.45 || (otherWrist.visibility ?? 0) < 0.45 || shoulderWidth < 0.02) return false;
    const armReach = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y);
    const overhead = wrist.y < Math.min(shoulder.y, landmarks.nose?.y ?? shoulder.y) - (shoulderWidth * 0.18);
    const nearVertical = Math.abs(wrist.x - shoulder.x) < shoulderWidth * 0.75;
    const elbowRaised = elbow.y < shoulder.y + shoulderWidth * 0.2;
    // A batting follow-through can put a hand above the shoulder. It cannot
    // have the bowling-arm release AND the non-bowling arm pulled down at once.
    const otherArmPulledDown = otherWrist.y > shoulder.y + shoulderWidth * 0.45;
    const splitArms = Math.hypot(wrist.x - otherWrist.x, wrist.y - otherWrist.y) > shoulderWidth * 1.25;
    return overhead && nearVertical && elbowRaised && otherArmPulledDown && splitArms && armReach > shoulderWidth * 0.85;
  });
}

function hasApprovedFastBowlingFraming(landmarks) {
  const required = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
  return required.every(name => (landmarks[name]?.visibility ?? 0) >= 0.55);
}

function hasApprovedSpinBowlingFraming(landmarks) {
  const required = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
  return required.every(name => (landmarks[name]?.visibility ?? 0) >= 0.5);
}

async function analyzeFile(file, { technique, stance = 'right', reference = 'professional', cameraAngle = '', onProgress = () => {} }) {
  onProgress('Loading the body-pose model...');
  const landmarker = await getPoseLandmarker();
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);
  video.muted = true; video.playsInline = true; video.preload = 'auto'; video.src = url;
  try {
    await waitFor(video, 'loadedmetadata');
    if (!Number.isFinite(video.duration) || video.duration < 0.25) throw new Error('Use a longer video with the player’s full body in frame.');
    await seek(video, 0);
    // A focused scan keeps the browser responsive; the model is reused for later clips.
    const sampleCount = Math.min(12, Math.max(10, Math.round(video.duration * 1.2)));
    const candidates = [];
    let bowlingActionFrames = 0;
    let approvedFastBowlingFrames = 0;
    let approvedSpinBowlingFrames = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const time = video.duration * (0.08 + (0.84 * index / Math.max(sampleCount - 1, 1)));
      onProgress(`Reading body position: frame ${index + 1} of ${sampleCount}...`);
      await seek(video, time);
      const result = landmarker.detectForVideo(video, nextPoseTimestamp());
      if (!result.landmarks?.[0]) continue;
      const landmarks = normaliseLandmarks(result.landmarks[0]);
      const coverage = usableLandmarkCount(landmarks);
      if (coverage < 7) continue;
      if (looksLikeBowlingAction(landmarks)) bowlingActionFrames += 1;
      if (hasApprovedFastBowlingFraming(landmarks)) approvedFastBowlingFrames += 1;
      if (hasApprovedSpinBowlingFraming(landmarks)) approvedSpinBowlingFrames += 1;
      const report = window.CreaseIQComparison.compare(landmarks, technique, { stance, reference });
      candidates.push({ coverage, framing: playerFraming(landmarks), time, report, landmarks });
    }
    if (!candidates.length) throw new Error('No clear full-body pose was found. Try a brighter side-on clip with your entire body and bat visible.');
    const isBattingSelection = !['fast-bowling', 'spin-bowling'].includes(technique);
    if (isBattingSelection && bowlingActionFrames >= 1) {
      throw new Error('This clip looks like a bowling action. Select Fast bowling or Spin bowling before starting analysis.');
    }
    const bowlingSelection = technique === 'fast-bowling' || technique === 'spin-bowling';
    const approvedBowlingFrames = technique === 'fast-bowling' ? approvedFastBowlingFrames : approvedSpinBowlingFrames;
    const bowlingCaptureUnverified = bowlingSelection && (bowlingActionFrames < 1 || approvedBowlingFrames < 1);
    // Without ball tracking, choose the frame with the best whole-body coverage and most complete report.
    candidates.sort((a, b) => (b.coverage * 10 + b.report.findings.length) - (a.coverage * 10 + a.report.findings.length));
    const selected = candidates[0];
    const framing = selected.framing;
    if (framing.headroom < 0.05) throw new Error('Leave more space above the player’s head before recording (at least 5% of the frame height).');
    return { ...selected.report, frameTime: Number(selected.time.toFixed(2)), framesChecked: sampleCount, landmarkCoverage: selected.coverage, bowlingCaptureUnverified, quality: { width: video.videoWidth, height: video.videoHeight, playerCoverage: Math.round(framing.coverage * 100), headroom: Math.round(framing.headroom * 100) } };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute('src'); video.load();
  }
}

window.CreaseIQPose = { analyzeFile };
