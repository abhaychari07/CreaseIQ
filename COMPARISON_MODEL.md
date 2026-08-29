# CreaseIQ comparison model

`comparison-model.js` is the first cricket-technique comparison engine. It is designed to receive normalised body-pose landmarks from a video pose detector such as MediaPipe Pose.

## First supported technique

**Cover drive** — the model includes the full coaching rubric across stance and grip, footwork and alignment, body and bat position, and contact and follow-through. Pose-detectable checkpoints include:

- stance width and balance
- front-foot stride
- front-knee position
- head position over the front foot
- back-elbow height
- head stability

Each available checkpoint is compared with a coaching reference range. Grip, bat path, ball contact, foot direction, and follow-through are already represented in the rubric and will be scored once hand/bat, ball, 3D-pose, and multi-frame tracking are connected.

## Use from the website

```js
const report = window.CreaseIQComparison.compare(landmarks, "cover-drive");
```

The `landmarks` object should use normalised `x` and `y` coordinates (0 to 1), with the names shown in `example-landmarks.json`. The next integration step is to run a pose detector over each uploaded clip, identify the contact frame, and pass those landmarks to this model.

## Reference videos

When supplied, reference videos are used to tune the target ranges in `comparison-model.js`. Begin with 10–20 clearly filmed side-on cover drives by skilled players, plus an agreed coaching rubric.
