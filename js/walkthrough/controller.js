// Scroll-driven walkthrough controller.
//
// The section is tall (N × viewport) and its stage is `position: sticky`, so the
// browser does the pinning and scrolling stays native (no scroll hijacking).
// Scroll progress (from GSAP ScrollTrigger when loaded, otherwise measured
// directly) is smoothed and fed to the active renderer:
//
//   photos → real property photos with forward push-in transitions (default,
//            instant, no WebGL — also the fallback)
//   video  → real walkthrough footage, scroll scrubs currentTime
//   frames → real footage exported as an image sequence (smoothest on iOS)

import { clamp, smoothstep, sceneIndexAt, localProgress, cutOpacity, captionOpacity, scrollOffsetForScene, shotAt } from "../lib/progress.js";
import { createPhotoRenderer } from "./photos.js";

const MODE_BADGES = {
  photos: "Photo walkthrough · real photos of the property",
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
    captionCount: section.querySelector(".wt-caption-count"),
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
  const photos = createPhotoRenderer(media, scenes);
  let active = photos;
  let mode = "photos";
  setBadge("photos");

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
  let lastShotKey = "";
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
    if (active !== photos && photos.visible) photos.setProgress(p, pointer);
    updateUI(p);
  }

  function updateUI(p) {
    const { index: i, shot: k, count, u } = shotAt(p, scenes);
    const s = scenes[i];
    const t = localProgress(p, s);
    const shot = s.shots?.[k];

    // Hero copy fades as the journey begins.
    const heroO = 1 - smoothstep(p / 0.045);
    ui.hero.style.opacity = heroO.toFixed(3);
    ui.hero.style.transform = `translate3d(0, ${(-40 * (1 - heroO)).toFixed(1)}px, 0)`;
    ui.hero.style.visibility = heroO < 0.01 ? "hidden" : "visible";
    ui.hero.toggleAttribute("inert", heroO < 0.5);
    stage.style.setProperty("--hero", heroO.toFixed(3));

    if (i !== lastIndex) {
      lastIndex = i;
      ui.chapterNum.textContent = s.chapter;
      ui.chapterLabel.textContent = s.label;
      ui.captionTitle.textContent = s.title;
      ui.captionTag.hidden = s.confirmed !== false;
      ui.captionTag.textContent = s.confirmed === false ? (s.caption || "To be confirmed") : "";
      railButtons.forEach((b, j) => b.toggleAttribute("aria-current", j === i));
    }
    const shotKey = `${i}:${k}`;
    if (shotKey !== lastShotKey) {
      lastShotKey = shotKey;
      ui.captionText.textContent = shot?.caption || s.caption || "";
      ui.captionCount.textContent = count > 1 ? `${k + 1} / ${count}` : "";
      ui.captionCount.hidden = count < 2;
      ui.live.textContent = `Chapter ${s.chapter}: ${s.title}. ${shot?.caption || ""}`;
    }

    const showCopy = p > 0.035;
    // Caption follows each photo: in after it settles, out as the next one arrives.
    const capO = s.id === "enquire" ? 0
      : i === 0 ? captionOpacity(u, [0.3, 0.5], [0.72, 0.84])
      : captionOpacity(u, [0.06, 0.2], [0.7, 0.8]);
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
    ? wt.video.available ? "video" : wt.frames.available ? "frames" : "photos"
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
      }
      if (!r) return;
      active = r;
      mode = wantMode;
      section.dataset.mode = mode;
      setBadge(mode);
      r.setProgress(current, pointer);
      photos.fadeOut(() => kick());
      kick();
    } catch (err) {
      console.warn("[walkthrough] staying on the photo walkthrough:", err);
      fallBack();
    }
  }

  function fallBack() {
    if (active !== photos) { try { active.destroy?.(); } catch {} }
    active = photos;
    mode = "photos";
    section.dataset.mode = mode;
    photos.fadeIn();
    setBadge("photos");
    kick();
  }

  section.dataset.mode = mode;
  // Real footage (if configured) loads after first paint/idle so the hero is never blocked.
  if (wantMode !== "photos") {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
    if (document.readyState === "complete") idle(upgrade, { timeout: 1500 });
    else addEventListener("load", () => idle(upgrade, { timeout: 1500 }), { once: true });
  }

  render(0);
  kick();
  return { get mode() { return mode; }, goToScene };
}

/** Reduced-motion version: no pinning, no scrubbing — a calm sequence of chapters. */
function renderStatic(section, scenes) {
  section.classList.add("wt--static");
  section.querySelector(".wt-media").insertAdjacentHTML("beforeend",
    `<img class="wt-still wt-still--static" src="${scenes[0].still}" alt="" fetchpriority="high">`);
  const esc = (v) => String(v ?? "").replace(/"/g, "&quot;");
  const list = section.querySelector(".wt-static-list");
  list.innerHTML = scenes.filter((s) => s.id !== "enquire").map((s) => `
    <li class="wt-static-item">
      <div class="wt-static-head">
        <span class="eyebrow">${s.chapter} · ${s.label}</span>
        <h3>${s.title}</h3>
        ${s.confirmed === false ? `<span class="tag tag--pending">${s.caption || "To be confirmed"}</span>` : ""}
      </div>
      <div class="wt-static-shots">
        ${(s.shots || []).map((sh) => `
          <figure class="${sh.portrait ? "is-portrait" : ""}">
            <img src="${sh.src}" alt="${esc(sh.alt)}" loading="lazy">
            ${sh.caption ? `<figcaption>${sh.caption}</figcaption>` : ""}
          </figure>`).join("")}
      </div>
    </li>`).join("");
}
