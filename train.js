const labels = [
  ['batting', 'battingFiles'],
  ['fast-bowling', 'fastFiles'],
  ['spin-bowling', 'spinFiles'],
  ['not-cricket', 'otherFiles']
];
const landmarkIds = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
let modelData = null;
let posePromise = null;

async function poseLandmarker() {
  if (posePromise) return posePromise;
  posePromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm');
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm');
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'GPU' },
      runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.55, minPosePresenceConfidence: 0.55, minTrackingConfidence: 0.55
    });
  })();
  return posePromise;
}

const waitFor = (element, event) => new Promise((resolve, reject) => {
  element.addEventListener(event, resolve, { once: true });
  element.addEventListener('error', () => reject(new Error('A video could not be read.')), { once: true });
});
async function seek(video, time) { video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - .02, 0)); await waitFor(video, 'seeked'); }
function mean(rows) { return rows[0].map((_, index) => rows.reduce((total, row) => total + row[index], 0) / rows.length); }

function vector(landmarks) {
  const leftShoulder = landmarks[11], rightShoulder = landmarks[12], leftHip = landmarks[23], rightHip = landmarks[24];
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
  const centre = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const scale = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
  if (scale < .02) return null;
  const values = [];
  for (const id of landmarkIds) {
    const point = landmarks[id];
    if (!point || (point.visibility ?? 1) < .45) return null;
    values.push((point.x - centre.x) / scale, (point.y - centre.y) / scale);
  }
  return values;
}

async function vectorsFromFile(file, onProgress) {
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);
  video.muted = true; video.playsInline = true; video.src = url;
  try {
    await waitFor(video, 'loadedmetadata');
    const pose = await poseLandmarker();
    const vectors = [];
    const frames = Math.min(30, Math.max(14, Math.round(video.duration * .65)));
    for (let index = 0; index < frames; index += 1) {
      onProgress(`Reading ${file.name}: frame ${index + 1} of ${frames}`);
      await seek(video, video.duration * (.05 + (.9 * index / Math.max(1, frames - 1))));
      const result = pose.detectForVideo(video, Math.round(performance.now()) + index);
      const item = result.landmarks?.[0] ? vector(result.landmarks[0]) : null;
      if (item) vectors.push(item);
    }
    return vectors;
  } finally { URL.revokeObjectURL(url); }
}

document.getElementById('trainerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.getElementById('trainerStatus');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const categories = {};
    for (const [label, inputId] of labels) {
      const examples = [];
      for (const file of document.getElementById(inputId).files) examples.push(...await vectorsFromFile(file, message => { status.textContent = message; }));
      if (examples.length < 4) throw new Error(`Not enough clear body frames for ${label}.`);
      categories[label] = { samples: examples.length, centroid: mean(examples) };
    }
    modelData = { version: 1, createdAt: new Date().toISOString(), feature: 'normalised-pose-centroid', categories };
    status.textContent = 'Private training complete.';
    document.getElementById('trainerResult').hidden = false;
  } catch (error) {
    status.textContent = `Training could not finish: ${error.message}`;
    button.disabled = false;
  }
});

document.getElementById('downloadModel').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'creaseiq-action-model.json'; link.click(); URL.revokeObjectURL(url);
});
