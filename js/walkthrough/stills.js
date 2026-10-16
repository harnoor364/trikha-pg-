// Still-image renderer: one layer per chapter, cross-faded with a slow dolly-in.
// Used as the instant first paint, the loading state, and the fallback when
// video / WebGL is unavailable.

import { sceneIndexAt, localProgress, smoothstep } from "../lib/progress.js";

export function createStillsRenderer(container, scenes) {
  const wrap = document.createElement("div");
  wrap.className = "wt-stills";
  const layers = scenes.map((s, i) => {
    const img = new Image();
    img.className = "wt-still";
    img.alt = "";
    img.decoding = "async";
    img.width = 1600;
    img.height = 900;
    // First two load eagerly (hero), the rest lazily but early.
    img.loading = i < 2 ? "eager" : "lazy";
    if (i === 0) img.fetchPriority = "high";
    img.src = s.still;
    wrap.appendChild(img);
    return img;
  });
  container.appendChild(wrap);

  const state = { visible: true, animating: false };

  function setProgress(p, pointer = { x: 0, y: 0 }) {
    if (!state.visible) return;
    const i = sceneIndexAt(p, scenes);
    const s = scenes[i];
    const t = localProgress(p, s);
    const blend = s.cutAfter || i === scenes.length - 1 ? 0 : smoothstep((t - 0.82) / 0.18);
    layers.forEach((img, j) => {
      let o = 0;
      let scale = 1.04;
      if (j === i) { o = 1; scale = 1.04 + 0.1 * t; }
      else if (j === i + 1) { o = blend; scale = 1.02 + 0.02 * blend; }
      img.style.opacity = o.toFixed(3);
      if (o > 0) img.style.transform = `translate3d(${(-pointer.x * 10).toFixed(1)}px, ${(-pointer.y * 6).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
    });
  }

  return {
    get visible() { return state.visible; },
    animating: false,
    setProgress,
    fadeOut(done) {
      wrap.classList.add("is-hidden");
      setTimeout(() => { state.visible = false; done?.(); }, 900);
    },
    fadeIn() {
      state.visible = true;
      wrap.classList.remove("is-hidden");
    },
  };
}
