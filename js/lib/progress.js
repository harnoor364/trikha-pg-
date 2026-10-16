// Pure helpers for mapping scroll progress (0..1) onto walkthrough scenes.
// No DOM access — unit-tested in tests/progress.test.js.

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const smoothstep = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** Gentle ease: mostly linear with softened ends, so chapters "settle" without stalling. */
export const softEase = (t, amount = 0.55) => {
  const x = clamp(t);
  return x + (smoothstep(x) - x) * amount;
};

/** Index of the scene that contains `p`. Scenes must be ordered with contiguous [start, end). */
export function sceneIndexAt(p, scenes) {
  const x = clamp(p);
  for (let i = 0; i < scenes.length; i++) {
    if (x < scenes[i].end) return i;
  }
  return scenes.length - 1;
}

/** Progress 0..1 inside scene `i`. */
export function localProgress(p, scene) {
  const span = scene.end - scene.start;
  return span <= 0 ? 0 : clamp((p - scene.start) / span);
}

/**
 * Opacity of the "dip to black" overlay used where the camera cuts between
 * non-contiguous shots. `cutAfter: true` on a scene fades out its last `w`
 * and fades in the first `w` of the next scene.
 */
export function cutOpacity(p, scenes, w = 0.18) {
  const i = sceneIndexAt(p, scenes);
  const s = scenes[i];
  const t = localProgress(p, s);
  let o = 0;
  if (s.cutAfter && i < scenes.length - 1) o = Math.max(o, smoothstep((t - (1 - w)) / w));
  const prev = scenes[i - 1];
  if (prev && prev.cutAfter) o = Math.max(o, 1 - smoothstep(t / w));
  return o;
}

/** Caption visibility inside a scene: fades in after the shot settles, out before it ends. */
export function captionOpacity(t, fadeIn = [0.12, 0.28], fadeOut = [0.78, 0.92]) {
  const a = smoothstep((t - fadeIn[0]) / (fadeIn[1] - fadeIn[0]));
  const b = 1 - smoothstep((t - fadeOut[0]) / (fadeOut[1] - fadeOut[0]));
  return clamp(Math.min(a, b));
}

/** Scroll offset (px from section top) that lands the visitor at the start of scene `i`. */
export function scrollOffsetForScene(i, scenes, scrollableHeight) {
  const s = scenes[clamp(i, 0, scenes.length - 1)];
  // Nudge slightly past the start so the caption has begun to appear.
  const p = s.start + (s.end - s.start) * (i === 0 ? 0 : 0.22);
  return Math.round(p * scrollableHeight);
}

/** Validates that scenes cover 0..1 contiguously. Returns an array of problems (empty = OK). */
export function validateScenes(scenes) {
  const errors = [];
  if (!scenes.length) return ["no scenes"];
  if (scenes[0].start !== 0) errors.push("first scene must start at 0");
  if (scenes[scenes.length - 1].end !== 1) errors.push("last scene must end at 1");
  for (let i = 1; i < scenes.length; i++) {
    if (Math.abs(scenes[i].start - scenes[i - 1].end) > 1e-9) errors.push(`gap/overlap before scene ${scenes[i].id}`);
  }
  scenes.forEach((s) => s.end <= s.start && errors.push(`scene ${s.id} has no length`));
  return errors;
}
