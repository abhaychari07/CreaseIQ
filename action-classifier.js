(function () {
  const names = ['nose','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
  function vector(landmarks) {
    const leftShoulder = landmarks.left_shoulder, rightShoulder = landmarks.right_shoulder, leftHip = landmarks.left_hip, rightHip = landmarks.right_hip;
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
    const centre = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    const scale = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    if (scale < .02) return null;
    const values = [];
    for (const name of names) {
      const point = landmarks[name];
      if (!point || (point.visibility ?? 1) < .45) return null;
      values.push((point.x - centre.x) / scale, (point.y - centre.y) / scale);
    }
    return values;
  }
  function distance(a, b) { return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0) / a.length); }
  function classify(landmarksList) {
    const vectors = landmarksList.map(vector).filter(Boolean);
    if (!vectors.length || !window.CreaseIQActionModel) return null;
    const average = vectors[0].map((_, index) => vectors.reduce((sum, item) => sum + item[index], 0) / vectors.length);
    const ranked = Object.entries(window.CreaseIQActionModel.categories).map(([label, category]) => ({ label, distance: distance(average, category.centroid) })).sort((a, b) => a.distance - b.distance);
    const best = ranked[0], next = ranked[1];
    return { label: best.label, confidence: Number(Math.max(0, Math.min(1, (next.distance - best.distance) / Math.max(next.distance, .001))).toFixed(2)), samples: vectors.length };
  }
  window.CreaseIQActionClassifier = { classify };
})();
