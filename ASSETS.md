# TRIKHA PG: media shot list & replacement guide

Everything visual on the site today is a **placeholder**. This document lists exactly what to capture at the property and how to drop it in.

> The Google Maps photo pages that were shared are saved *web pages*, not image files. They contain no picture data, so no real photo could be extracted from them. To use those photos, open each one on Google Maps, right-click the image → **Save image as…** (or download the originals from the Google Business Profile), and send the JPG/PNG files. Confirm you have the right to use each photo. Visitor-uploaded Google photos belong to the person who took them.

---

## 1. Walkthrough footage (the centrepiece)

**One continuous, forward-moving take** (or a few takes edited into one) following the chapter order:

| # | Chapter | What to film | Suggested length |
|---|---|---|---|
| 01 | Exterior & approach | Walk from the street toward the gate/entrance. Building and signage visible. | 6–8 s |
| 02 | Entry | Through the entrance into reception/lobby. | 4–6 s |
| 03 | Corridor | Steady walk down the main corridor toward the first room. | 5–7 s |
| 04 | Room one | Turn into a typical room, slow pan across bed, desk, storage, window. | 6–8 s |
| 05 | More rooms *(if available)* | Other room types (double/triple). Cut between rooms is fine; the site adds a soft dip to black. | 5–8 s |
| 06 | Shared spaces *(only if they exist)* | Kitchen, dining, common area, laundry: whatever is actually provided. | 6–8 s |
| 07 | Final room | Best-looking room, ending facing a bright window. | 6–8 s |
| 08 | Enquire | Hold on the window or a calm wide shot for ~3 s (the CTA appears over it). | 3–4 s |

**Capture specs**
- 4K or 1080p, **30 fps** (or 60 fps, which the encoder conforms to 30), landscape.
- Gimbal or phone with stabilisation on. **Walk slowly and evenly**: scroll speed is the visitor's, so jerky footage looks jerkier.
- No zooming, no fast pans. Keep the horizon level. Eye height ~1.6 m.
- Daylight with all room lights on. Clean, tidy, beds made, no people or personal belongings in frame.
- Record a few seconds of extra footage at the start and end of every take.
- **Mobile version:** the same footage is fine, but keep important detail near the centre, because phones crop to portrait.

**Prepare it**
```bash
scripts/encode-walkthrough.sh ~/Videos/trikha-walkthrough.mp4
```
This writes `assets/video/walkthrough-1080p.mp4`, `walkthrough-720p.mp4`, a poster, and an optional image sequence. Then in `js/config.js`:
```js
walkthrough: { video: { available: true, … }, … }
// or, for the image sequence:
walkthrough: { frames: { available: true, count: 480, … }, … }
```
Finally, **re-time `js/scenes.js`**: watch the encoded video and note when each space starts as a fraction of the total duration (e.g. corridor starts at 0:09 of 0:48 → `0.19`). Keep `start`/`end` contiguous from 0 to 1 (`npm test` checks this).

Size targets: desktop MP4 ≤ 12 MB, mobile ≤ 6 MB per minute. If larger, raise `-crf` by 2 in the script.

### Alternative: accurate 3D model
If a measured model (e.g. Matterport export or an architect's model) becomes available, export **glTF/GLB, Draco-compressed, ≤ 8 MB**. Load it in `placeholder3d.js` in place of the procedural geometry (three.js `GLTFLoader` + `DRACOLoader`), and keep the camera-path structure (`SHOTS`). Only load it after first paint, as the current code already does.

---

## 2. Chapter stills (fallback, loading state & reduced-motion view)

One photo per chapter, **1600×900 (16:9), JPG/WebP, ≤ 250 KB**, framed like the matching moment in the video:

| File | Shot |
|---|---|
| `assets/images/scenes/01-exterior.jpg` | Building exterior from the street (also the opening-screen background) |
| `assets/images/scenes/02-entry.jpg` | Entrance / reception |
| `assets/images/scenes/03-corridor.jpg` | Corridor, one-point perspective |
| `assets/images/scenes/04-room-1.jpg` | Typical room, wide |
| `assets/images/scenes/05-room-2.jpg` | Second room type |
| `assets/images/scenes/06-shared.jpg` | Kitchen / dining / common area (only if it exists) |
| `assets/images/scenes/07-final-room.jpg` | Best room, window light |
| `assets/images/scenes/08-enquire.jpg` | Calm detail or window, for the CTA background |

After adding them, change each `still:` path in `js/scenes.js` from `.svg` to `.jpg`, and update the `<link rel="preload">` and `<noscript>` image in `index.html`.

---

## 3. Room photos

For **each room type**: 3–5 photos, **1200×900 (4:3), ≤ 200 KB each**: wide shot, bed, study/storage, window/view, attached bathroom if any.
Save as `assets/images/rooms/<room-id>-1.jpg`, `-2.jpg`, … and list them in `data/rooms.json` (`images`). Set `"placeholder": false`.

## 4. Other images

| File | Size | Notes |
|---|---|---|
| `assets/images/og-image.jpg` | 1200×630 | Link preview on WhatsApp/Facebook. Replace with a real exterior/room photo plus name. |
| `assets/images/apple-touch-icon.png` | 180×180 | Home-screen icon |
| `assets/images/favicon.svg` | — | Browser tab icon (a logo, if the PG has one) |

## 5. Compression

- Photos: <https://squoosh.app>, WebP or MozJPEG at quality ~75.
- Video: use the provided script (H.264, keyframe every 4 frames, `+faststart`, no audio).
- All images below the walkthrough are lazy-loaded. Chapter stills 1–2 load first and the rest load lazily.

## 6. Regenerating placeholders

`npm run placeholders` rewrites the SVG placeholders. Real JPGs with different extensions are never touched.
