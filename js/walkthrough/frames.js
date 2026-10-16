// Image-sequence renderer: draws the frame nearest to the scroll position on a
// canvas. This is the most reliable way to scrub footage on mobile Safari.
// Frames load progressively — a coarse pass first (every 8th frame), then the gaps.

export function createFrameRenderer(container, { path, count, pad = 4, onFrame }) {
  return new Promise((resolve, reject) => {
    if (!count) return reject(new Error("frames.count is 0"));
    const canvas = document.createElement("canvas");
    canvas.className = "wt-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    const frames = new Array(count);
    const url = (i) => path.replace("{i}", String(i + 1).padStart(pad, "0"));
    let wanted = 0;
    let drawn = -1;

    const queued = new Set();
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < count; i += step) queued.add(i);
    const order = [...queued];

    let failed = 0;
    let loadedFirst = false;
    let cursor = 0;
    const PARALLEL = 6;
    for (let k = 0; k < PARALLEL; k++) next();

    function next() {
      if (cursor >= order.length) return;
      const i = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        frames[i] = img;
        if (!loadedFirst && i === 0) { loadedFirst = true; container.appendChild(canvas); resize(); resolve(api); }
        if (Math.abs(i - wanted) < 8) { drawn = -1; onFrame?.(); }
        next();
      };
      img.onerror = () => { if (++failed > 10 && !loadedFirst) reject(new Error("frames failed to load")); next(); };
      img.src = url(i);
    }

    function nearestLoaded(i) {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    }

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      drawn = -1;
      draw();
    }
    addEventListener("resize", resize);

    function draw() {
      const j = nearestLoaded(wanted);
      if (j < 0 || j === drawn) return;
      const img = frames[j];
      const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = j;
    }

    const api = {
      animating: false,
      setProgress(p) { wanted = Math.round(p * (count - 1)); draw(); },
      destroy() { removeEventListener("resize", resize); canvas.remove(); },
    };
  });
}
