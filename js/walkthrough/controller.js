// Scroll-driven walkthrough controller.
//
// The section is tall (N × viewport) and its stage is `position: sticky`, so the
// browser does the pinning and scrolling stays native (no scroll hijacking).
// Scroll progress (from GSAP ScrollTrigger when loaded, otherwise measured
// directly) is smoothed and fed to the active renderer:
//
//   stills        → instant, lightweight; also the loading state and the fallback
//   video         → real walkthrough footage, scroll scrubs currentTime
//   frames        → real footage exported as an image sequence (smoothest on iOS)
//   placeholder3d → procedural Three.js block-out (until real footage exists)

import { clamp, smoothstep, sceneIndexAt, localProgress, cutOpacity, captionOpacity, scrollOffsetForScene } from "../lib/progress.js";
import { createStillsRenderer } from "./stills.js";

const MODE_BADGES = {
  stills: "Placeholder images · real photos coming soon",
  placeholder3d: "Illustrative 3D block-out · not the actual TRIKHA PG layout",
  video: "",
  frames: "",
};

export function initWalkthrough({ section, config, scenes, reducedMotion }) {
  const stage = section.querySelector(".wt-stage");
  const media = section.querySelector(".wt-media");
  const ui = {
    hero: section.querySelector(".wt-hero"),
    chapter: section.querySelector(".wt-chapter"),
    chapterNum: section.querySelector(".wt-chapter-num"),
    chapterLabel: section.querySelector(".wt-chapter-label"),
    caption: section.querySelector(".wt-caption"),
    captionTitle: section.querySelector(".wt-caption-title"),
    captionText: section.querySelector(".wt-caption-text"),
    captionTag: section.querySelector(".wt-caption-tag"),
    cut: section.querySelector(".wt-cut"),
    final: section.querySelector(".wt-final"),
    badge: section.querySelector(".wt-badge"),
    rail: section.querySelector(".wt-rail"),
    bar: section.querySelector(".wt-progress-bar"),
    live: section.querySelector(".wt-live"),
  };

  if (reducedMotion) {
    renderStatic(section, scenes);
    return { mode: "static" };
  }

  section.classList.add("wt--scroll");
  const isMobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;

  // ---- Renderers -----------------------------------------------------------
  const stills = createStillsRenderer(media, scenes);
  let active = stills;
  let mode = "stills";
  setBadge("stills");

  // ---- Rail (chapter navigation) ------------------------------------------
  const railButtons = scenes.map((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wt-rail-btn";
    b.innerHTML = `<span class="wt-rail-num">${s.chapter}</span><span class="wt-rail-label">${s.label}</span>`;
    b.setAttribute("aria-label", `Go to chapter ${s.chapter}: ${s.label}`);
    b.addEventListener("click", () => goToScene(i));
    ui.rail.appendChild(b);
    return b;
  });

  function scrollable() {
    return Math.max(1, section.offsetHeight - stage.offsetHeight);
  }
  function sectionTop() {
    return section.getBoundingClientRect().top + window.scrollY;
  }
  function goToScene(i) {
    const y = sectionTop() + scrollOffsetForScene(i, scenes, scrollable()) + 1;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // ---- Progress source -----------------------------------------------------
  let target = 0;
  let current = 0;
  let inView = true;
  let raf = 0;
  let last = performance.now();
  let lastIndex = -1;
  let pointer = { x: 0, y: 0 };
  let pointerTarget = { x: 0, y: 0 };
  const measure = () => {
    const r = section.getBoundingClientRect();
    target = clamp(-r.top / scrollable());
  };

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => { target = self.progress; kick(); },
      onRefresh: (self) => { target = self.progress; kick(); },
    });
  } else {
    addEventListener("scroll", () => { measure(); kick(); }, { passive: true });
    addEventListener("resize", () => { measure(); kick(); });
    measure();
  }

  // ---- Pointer parallax (desktop only, subtle) ------------------------------
  if (!isMobile) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      pointerTarget = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      kick();
    });
    stage.addEventListener("pointerleave", () => { pointerTarget = { x: 0, y: 0 }; kick(); });
  }

  // ---- Render loop (runs only while something is changing and in view) ------
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) kick(); }, { rootMargin: "100px" }).observe(section);
  document.addEventListener("visibilitychange", () => !document.hidden && kick());

  function kick() {
    if (!raf && inView && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = 1 - Math.pow(1 - 0.14, dt * 60); // frame-rate independent smoothing
    current += (target - current) * k;
    pointer.x += (pointerTarget.x - pointer.x) * k * 0.5;
    pointer.y += (pointerTarget.y - pointer.y) * k * 0.5;
    if (Math.abs(target - current) < 0.00005) current = target;

    render(current);

    const settled = current === target && Math.abs(pointerTarget.x - pointer.x) < 0.001 && Math.abs(pointerTarget.y - pointer.y) < 0.001;
    if (!settled || active.animating) kick();
  }

  function render(p) {
    active.setProgress(p, pointer);
    if (active !== stills && stills.visible) stills.setProgress(p, pointer);
    updateUI(p);
  }

  function updateUI(p) {
    const i = sceneIndexAt(p, scenes);
    const s = scenes[i];
    const t = localProgress(p, s);

    // Hero copy fades as the journey begins.
    const heroO = 1 - smoothstep(p / 0.045);
    ui.hero.style.opacity = heroO.toFixed(3);
    ui.hero.style.transform = `translate3d(0, ${(-40 * (1 - heroO)).toFixed(1)}px, 0)`;
    ui.hero.style.visibility = heroO < 0.01 ? "hidden" : "visible";
    ui.hero.toggleAttribute("inert", heroO < 0.5);

    if (i !== lastIndex) {
      lastIndex = i;
      ui.chapterNum.textContent = s.chapter;
      ui.chapterLabel.textContent = s.label;
      ui.captionTitle.textContent = s.title;
      ui.captionText.textContent = s.caption;
      ui.captionTag.hidden = s.confirmed !== false;
      railButtons.forEach((b, j) => b.toggleAttribute("aria-current", j === i));
      ui.live.textContent = `Chapter ${s.chapter}: ${s.title}`;
    }

    const showCopy = p > 0.035;
    const capO = s.id === "enquire" ? 1 - smoothstep((t - 0.05) / 0.2) : captionOpacity(t, i === 0 ? [0.3, 0.5] : [0.1, 0.26]);
    ui.caption.style.opacity = (showCopy ? capO : 0).toFixed(3);
    ui.caption.style.transform = `translate3d(0, ${(12 * (1 - capO)).toFixed(1)}px, 0)`;
    ui.chapter.style.opacity = showCopy ? "1" : "0";
    ui.rail.style.opacity = showCopy ? "1" : "0";
    ui.rail.toggleAttribute("inert", !showCopy);

    ui.cut.style.opacity = cutOpacity(p, scenes).toFixed(3);

    const finalO = s.id === "enquire" ? smoothstep((t - 0.2) / 0.35) : 0;
    ui.final.style.opacity = finalO.toFixed(3);
    ui.final.style.visibility = finalO < 0.01 ? "hidden" : "visible";
    ui.final.toggleAttribute("inert", finalO < 0.5);

    ui.bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  function setBadge(m) {
    const text = MODE_BADGES[m] ?? "";
    ui.badge.textContent = text;
    ui.badge.hidden = !text;
  }

  // ---- Upgrade to a richer renderer once the page is usable ------------------
  const wt = config.walkthrough;
  const wantMode = wt.mode === "auto"
    ? wt.video.available ? "video" : wt.frames.available ? "frames" : wt.placeholder3d ? "placeholder3d" : "stills"
    : wt.mode;

  async function upgrade() {
    try {
      let r = null;
      if (wantMode === "video") {
        const { createVideoRenderer } = await import("./video.js");
        r = await createVideoRenderer(media, { src: isMobile ? wt.video.mobile : wt.video.desktop, poster: wt.video.poster });
      } else if (wantMode === "frames") {
        const { createFrameRenderer } = await import("./frames.js");
        r = await createFrameRenderer(media, { ...wt.frames, path: isMobile && wt.frames.mobilePath ? wt.frames.mobilePath : wt.frames.path, onFrame: kick });
      } else if (wantMode === "placeholder3d") {
        if (!hasWebGL()) throw new Error("WebGL unavailable");
        const { createPlaceholder3D } = await import("./placeholder3d.js");
        r = await createPlaceholder3D(media, { scenes, mobile: isMobile, onLost: () => fallBack() });
      }
      if (!r) return;
      active = r;
      mode = wantMode;
      section.dataset.mode = mode;
      setBadge(mode);
      r.setProgress(current, pointer);
      stills.fadeOut(() => kick());
      kick();
    } catch (err) {
      console.warn("[walkthrough] staying on still images:", err);
      fallBack();
    }
  }

  function fallBack() {
    if (active !== stills) { try { active.destroy?.(); } catch {} }
    active = stills;
    mode = "stills";
    section.dataset.mode = mode;
    stills.fadeIn();
    setBadge("stills");
    kick();
  }

  section.dataset.mode = mode;
  // Start the heavier renderer after first paint/idle so the hero is never blocked.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  if (document.readyState === "complete") idle(upgrade, { timeout: 1500 });
  else addEventListener("load", () => idle(upgrade, { timeout: 1500 }), { once: true });

  render(0);
  kick();
  return { get mode() { return mode; }, goToScene };
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

/** Reduced-motion version: no pinning, no scrubbing — a calm sequence of chapters. */
function renderStatic(section, scenes) {
  section.classList.add("wt--static");
  section.querySelector(".wt-media").insertAdjacentHTML("beforeend",
    `<img class="wt-still" style="opacity:1" src="${scenes[0].still}" alt="" width="1600" height="900" fetchpriority="high">`);
  const list = section.querySelector(".wt-static-list");
  list.innerHTML = scenes.map((s) => `
    <li class="wt-static-item">
      <figure>
        <img src="${s.still}" alt="${s.title} — placeholder image" loading="lazy" width="1600" height="900">
        <figcaption>
          <span class="eyebrow">${s.chapter} · ${s.label}</span>
          <h3>${s.title}</h3>
          <p>${s.caption}</p>
          ${s.confirmed === false ? '<span class="tag tag--pending">To be confirmed</span>' : ""}
        </figcaption>
      </figure>
    </li>`).join("");
}
