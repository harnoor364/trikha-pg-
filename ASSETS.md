# TRIKHA PG: photos, footage & replacement guide

## 0. What's in use now

The walkthrough uses **18 real property photos** in `assets/images/property/`:

| File | Chapter | Shows |
|---|---|---|
| `01-exterior-gate.jpg` | 01 Arrival | Front gate from the street |
| `02-entrance-passage.jpg` | 02 Entrance | Plant-lined passage toward the red door |
| `03-passage-to-gate.jpg` | 03 Passage | Passage looking back toward the gate |
| `04-room-bed-wardrobe-tv.jpg` | 04 First room (also room card A, final CTA) | Bed, wardrobe, TV on desk, fridge |
| `05-room-steel-almirah.jpg` | 04 First room | Steel almirah and door |
| `09-room-study-desk.jpg` | 04 First room | Study desk and chair |
| `06-room-bed-door.jpg` | 05 More rooms (room card B) | Bed with door toward washroom |
| `07-room-bed-mirror.jpg` | 05 More rooms | Bed, mirror, curtains |
| `08-room-bed-wall-panel.jpg` | 05 More rooms | Bed against wall panel |
| `10-room-hooks-cabinet.jpg` | 05 More rooms | Hooks, chair, green cabinet |
| `11-kitchen-counter.jpg` | 06 Kitchen | Counter, shelves, fridge |
| `12-kitchen-fridge.jpg` | 06 Kitchen | Fridge and counter (straightened; the original was sideways) |
| `13-kitchen-sink.jpg` | 06 Kitchen | Sink, granite counter, water heater |
| `14-washroom-passage.jpg` | 07 Washrooms | Doorway into tiled washroom area |
| `15-washroom-toilet.jpg` | 07 Washrooms | Western toilet, washbasin |
| `16-washroom-shower.jpg` | 07 Washrooms | Shower area, hot/cold taps |
| `18-room-tv-desk-shelf.jpg` | 08 Comforts (room card C) | TV over desk, bookshelf |
| `17-room-ac.jpg` | 08 Comforts | Window AC above a door |

Two of the 20 uploads were duplicates. The originals were **167 px wide**, so they were upscaled 3× with Lanczos and light sharpening. That is as good as these files can get. **Replace them with full-size originals (same filenames) for a sharp site.** Ideally:
- ≥ 1600 px on the long side, JPG quality ~80, ≤ 300 KB (compress with <https://squoosh.app>)
- No phone-number watermark (the number is already on the site)
- Landscape where possible. Portrait is fine; set `portrait: true` in `js/scenes.js`.

**Nice-to-have extra shots:** a wide exterior of the whole building, reception/entry, staircase, a room shot from the doorway, the terrace or roof, the dining area if one exists, and the street or nearby landmarks.

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
If a measured model (e.g. a Matterport export) becomes available, export **glTF/GLB, Draco-compressed, ≤ 8 MB** and add a renderer in `js/walkthrough/` with the same interface (`setProgress`, `destroy`). Load it only after first paint, as `controller.js` does for video.

---

## 2. Room photos

For **each room type** the owner confirms: 3–5 photos (wide shot, bed, study/storage, window, bathroom if attached). Put them in `assets/images/property/` and list them in `data/rooms.json → rooms[].images`. Remove `photoLabel` once the photo really shows that room type.

## 3. Walkthrough chapters

Chapters and their photos live in `js/scenes.js`. Each shot needs `src`, a descriptive `alt` (for screen readers) and a short `caption`. Chapter lengths adjust automatically.

## 4. Other images

| File | Size | Notes |
|---|---|---|
| `assets/images/og-image.jpg` | 1200×630 | Link preview on WhatsApp/Facebook. Replace with a real exterior/room photo plus name. |
| `assets/images/apple-touch-icon.png` | 180×180 | Home-screen icon |
| `assets/images/favicon.svg` | — | Browser tab icon (a logo, if the PG has one) |

## 5. Compression

- Photos: <https://squoosh.app>, WebP or MozJPEG at quality ~75.
- Video: use the provided script (H.264, keyframe every 4 frames, `+faststart`, no audio).
- The first three walkthrough photos load immediately. The rest load just ahead of the visitor as they scroll.
