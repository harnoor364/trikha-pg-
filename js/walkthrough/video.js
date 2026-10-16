// Video renderer: scroll progress scrubs the walkthrough video's currentTime.
//
// For smooth scrubbing the file MUST be encoded with frequent keyframes
// (see scripts/encode-walkthrough.sh — it uses a keyframe every 2–5 frames and
// +faststart). Without that, seeking is slow and the scroll feels sticky.

export function createVideoRenderer(container, { src, poster }) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.className = "wt-video";
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");
    video.preload = "auto";
    if (poster) video.poster = poster;
    video.src = src;

    let duration = 0;
    let wanted = 0;
    let seeking = false;

    const timeout = setTimeout(() => fail(new Error("video metadata timeout")), 12000);
    function fail(err) { clearTimeout(timeout); video.remove(); reject(err); }

    video.addEventListener("error", () => fail(new Error("video failed to load")), { once: true });
    video.addEventListener("loadedmetadata", async () => {
      clearTimeout(timeout);
      duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return fail(new Error("invalid video duration"));
      // iOS needs a play/pause gesture-free "unlock" before seeking renders frames.
      try { await video.play(); video.pause(); } catch {}
      container.appendChild(video);
      resolve(api);
    }, { once: true });

    video.addEventListener("seeked", () => {
      seeking = false;
      if (Math.abs(video.currentTime - wanted) > 1 / 30) seek(wanted);
    });

    function seek(t) {
      seeking = true;
      if (typeof video.fastSeek === "function" && Math.abs(video.currentTime - t) > 2) video.fastSeek(t);
      else video.currentTime = t;
    }

    const api = {
      animating: false,
      setProgress(p) {
        if (!duration) return;
        wanted = Math.min(duration - 0.05, Math.max(0, p * duration));
        if (!seeking && Math.abs(video.currentTime - wanted) > 1 / 60) seek(wanted);
      },
      destroy() { video.removeAttribute("src"); video.load(); video.remove(); },
    };
    video.load();
  });
}
