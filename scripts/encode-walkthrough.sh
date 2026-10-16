#!/usr/bin/env bash
# Prepare real walkthrough footage for scroll-scrubbing.
# Usage: scripts/encode-walkthrough.sh path/to/source.mp4
# Needs ffmpeg (https://ffmpeg.org). Outputs into assets/video/ and assets/frames/.
#
# Why special encoding? Browsers can only jump instantly to keyframes. A normal
# video has one keyframe every few seconds, so scrubbing stutters. These commands
# put a keyframe every 4 frames (-g 4), strip audio, and move metadata to the
# front (+faststart) so playback can start before the whole file downloads.
set -euo pipefail
SRC="${1:?give the source video path}"
cd "$(dirname "$0")/.."
mkdir -p assets/video assets/frames/desktop assets/frames/mobile

# 1) Desktop MP4 (1080p, ~6–10 MB per 30 s of footage)
ffmpeg -y -i "$SRC" -an -vf "scale=-2:1080:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 \
  -movflags +faststart assets/video/walkthrough-1080p.mp4

# 2) Mobile MP4 (720p, lighter)
ffmpeg -y -i "$SRC" -an -vf "scale=-2:720:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 \
  -movflags +faststart assets/video/walkthrough-720p.mp4

# 3) Poster frame for the opening screen
ffmpeg -y -i "$SRC" -frames:v 1 -vf "scale=1920:-2" -q:v 3 assets/images/scenes/01-exterior.jpg

# 4) OPTIONAL image sequence (smoothest on iPhone). ~12 fps keeps the count manageable.
#    Then set walkthrough.frames.available = true and frames.count in js/config.js.
ffmpeg -y -i "$SRC" -vf "fps=12,scale=1600:-2:flags=lanczos" -c:v libwebp -quality 70 assets/frames/desktop/frame_%04d.webp
ffmpeg -y -i "$SRC" -vf "fps=12,scale=900:-2:flags=lanczos"  -c:v libwebp -quality 65 assets/frames/mobile/frame_%04d.webp
echo "Frames written: $(ls assets/frames/desktop | wc -l) — put this number in js/config.js → walkthrough.frames.count"
