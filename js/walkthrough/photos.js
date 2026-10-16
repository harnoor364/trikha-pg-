// Photo walkthrough renderer: real property photos, one "shot" at a time.
//
// Each shot = a softly blurred full-bleed backdrop + the photo in a frame.
// While a shot is on screen it slowly pushes in; near its end the frame
// accelerates toward the camera and fades while the next shot rises into
// place — a forward "dolly" from one space into the next.
//
// Pure DOM/CSS transforms (no WebGL), so it is also the fallback when video or
// frames fail. Same interface as the other renderers.

import { smoothstep } from "../lib/progress.js";

export function createPhotoRenderer(container, scenes) {
  // Flatten all shots onto the global 0..1 timeline.
  const shots = [];
  scenes.forEach((s) => {
    const n = s.shots?.length || 1;
    const list = s.shots?.length ? s.shots : [{ src: s.still, alt: "" }];
    list.forEach((shot, k) => {
      const start = s.start + ((s.end - s.start) * k) / n;
      const end = s.start + ((s.end - s.start) * (k + 1)) / n;
      shots.push({ ...shot, start, end, scene: s.id });
    });
  });

  const wrap = document.createElement("div");
  wrap.className = "ph-stack";
  const layers = shots.map((shot, i) => {
    const el = document.createElement("div");
    el.className = "ph";
    el.innerHTML = `
      <img class="ph-bg" src="${shot.src}" alt="" aria-hidden="true" decoding="async" ${i < 3 ? "" : 'loading="lazy"'}>
      <figure class="ph-frame${shot.portrait ? " is-portrait" : ""}">
        <img class="ph-img" src="${shot.src}" alt="${(shot.alt || "").replace(/"/g, "&quot;")}" decoding="async" ${i === 0 ? 'fetchpriority="high"' : i < 3 ? "" : 'loading="lazy"'}>
      </figure>`;
    const img = el.querySelector(".ph-img");
    img.addEventListener("load", () => el.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(4)));
    if (img.complete && img.naturalWidth) el.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(4));
    wrap.appendChild(el);
    return { el, frame: el.querySelector(".ph-frame"), bg: el.querySelector(".ph-bg"), dir: i % 2 ? -1 : 1, shown: false };
  });
  container.appendChild(wrap);

  const state = { visible: true };
  let lastG = -1;

  function shotIndexAt(p) {
    for (let i = 0; i < shots.length; i++) if (p < shots[i].end) return i;
    return shots.length - 1;
  }

  function setProgress(p, pointer = { x: 0, y: 0 }) {
    if (!state.visible) return;
    const g = shotIndexAt(p);
    const s = shots[g];
    const u = Math.min(1, Math.max(0, (p - s.start) / (s.end - s.start)));
    const hasNext = g < shots.length - 1;
    const e = hasNext ? smoothstep((u - 0.76) / 0.24) : 0;

    layers.forEach((L, j) => {
      let o = 0, fs = 1, bs = 1.15, tx = 0;
      if (j === g) {
        o = 1 - e;
        fs = 1 + 0.06 * u + 0.38 * e * e; // push in, then rush past the camera
        bs = 1.15 + 0.05 * u + 0.25 * e;
        tx = L.dir * (u - 0.5) * 16;
      } else if (j === g + 1 && hasNext) {
        o = e;
        fs = 0.84 + 0.16 * e; // next space rises into place
        bs = 1.1 + 0.05 * e;
        tx = L.dir * -8;
      }
      const show = o > 0.001;
      if (show !== L.shown) { L.el.style.visibility = show ? "visible" : "hidden"; L.shown = show; }
      if (!show) return;
      L.el.style.opacity = o.toFixed(3);
      L.frame.style.transform = `translate3d(calc(-50% + ${(tx - pointer.x * 12).toFixed(1)}px), calc(-50% + ${(-pointer.y * 8).toFixed(1)}px), 0) scale(${fs.toFixed(4)})`;
      L.bg.style.transform = `translate3d(${(pointer.x * 10).toFixed(1)}px, ${(pointer.y * 6).toFixed(1)}px, 0) scale(${bs.toFixed(4)})`;
    });

    if (g !== lastG) {
      lastG = g;
      // Warm up the next couple of images.
      for (const k of [g + 1, g + 2]) {
        const img = layers[k]?.el.querySelectorAll("img");
        img?.forEach((im) => (im.loading = "eager"));
      }
    }
  }

  return {
    get visible() { return state.visible; },
    animating: false,
    setProgress,
    shots,
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
