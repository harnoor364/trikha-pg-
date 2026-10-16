# TRIKHA PG: scroll-driven walkthrough website

A premium, responsive website for **TRIKHA PG, BRS Nagar, Ludhiana, Punjab**. The main feature is a cinematic walkthrough that moves forward as the visitor scrolls: entrance, entry, corridor, rooms, shared spaces, final room, then the enquiry call to action.

> ⚠️ **Preview / demo mode is ON.** The walkthrough uses **18 real photos of the property** (exterior, entrance passage, rooms, kitchen, washrooms). It is a *photo* walkthrough, badged on screen as such. It is not yet a video walkthrough. The supplied photos are small thumbnails (167 px wide, gently upscaled), so **full-resolution originals will make it much sharper**. Room types, rent, availability and most facilities are still unconfirmed. See [ASSETS.md](ASSETS.md).

Plain HTML, CSS and JavaScript (ES modules). **No build step, no framework, no backend required.** GSAP 3.12.5 + ScrollTrigger are self-hosted in `js/vendor/`, so the site doesn't depend on third-party CDNs.

---

## What's confirmed vs placeholder

| Item | Status | Where to change |
|---|---|---|
| Name "TRIKHA PG", BRS Nagar, Ludhiana | ✅ From the Google Maps listing *"TRIKHA PG in Ludhiana (BRS Nagar)"* | `js/config.js` |
| Map pin 30.8855232, 75.8156191 and listing link | ✅ From the listing | `js/config.js → geo` |
| Street address, PIN code, landmark | ❌ To confirm | `js/config.js → address` |
| Phone 98557 57737 | ✅ Printed on all the property's photos, so the Call buttons are live. Re-confirm with the owner | `js/config.js → contact.phone` |
| WhatsApp, email, visiting hours | ❌ To confirm. WhatsApp is pre-filled with the same number but stays off until `verified: true` | `js/config.js → contact` |
| Google rating (reported 4.8★ / 94 reviews) | ❌ **Hidden** until re-checked on the live listing and `rating.verified: true` | `js/config.js → rating` |
| Testimonials | ❌ None shown. Add only real, attributed reviews with permission | `js/config.js → testimonials` |
| Room types, occupancy, rent, availability | ❌ Placeholders ("To be confirmed"). Cards use real room photos labelled "Representative photo" | `data/rooms.json` |
| Facilities | ⚠️ Items visible in the photos (AC, TV, fridge, kitchen, study desk, storage, western toilet, hot-water taps) are tagged **"Seen in photos"**. Everything else is an owner checklist shown only in demo mode | `data/rooms.json → facilities` |
| Walkthrough photos | ✅ Real, but low-resolution thumbnails | `assets/images/property/`, `js/scenes.js` |
| Walkthrough video | ❌ Not yet. Optional upgrade | see [ASSETS.md](ASSETS.md) |
| Audience (boys / girls / co-living) | ❌ Not stated anywhere on the site until confirmed | `js/config.js → business.audience` |

---

## File structure

```
index.html                  Single page: walkthrough → rooms → facilities → trust → location → enquiry
thank-you.html              Netlify Forms success page (no-JavaScript submissions)
404.html
css/styles.css              All styles. Colour/typography tokens at the top (:root)
js/
  config.js                 ← ALL business details + feature switches (verified flags)
  scenes.js                 ← Walkthrough chapters → photos ("shots") with captions & alt text
  main.js                   Page wiring: nav, contact links, rooms, form, map, trust gating
  lib/progress.js           Pure scroll→scene maths (unit-tested)
  lib/contact.js            tel:/wa.me/maps link builders (unit-tested)
  lib/validate.js           Enquiry validation, shared with /api/enquiry (unit-tested)
  walkthrough/
    controller.js           Sticky stage, ScrollTrigger progress, smoothing, UI, renderer selection
    photos.js               Photo walkthrough renderer (default; also the fallback)
    video.js                Scroll-scrubbed <video> renderer (for future footage)
    frames.js               Image-sequence canvas renderer (for future footage, best on iOS)
  vendor/                   gsap.min.js, ScrollTrigger.min.js
data/rooms.json             ← Room cards + facility checklist
assets/images/property/     ← The 18 property photos used by the walkthrough & room cards
assets/video/               ← Encoded walkthrough videos go here
assets/frames/              ← Optional image sequence goes here
api/enquiry.js              Vercel serverless function for the form (optional)
scripts/
  encode-walkthrough.sh     ffmpeg commands to prepare footage for scrubbing
tests/                      node --test unit tests
netlify.toml, vercel.json, robots.txt, sitemap.xml
```

---

## Run locally

ES modules and `fetch()` need a local web server; double-clicking `index.html` won't work.

```bash
npm start            # = npx serve -l 8080 .   → http://localhost:8080
# or: python3 -m http.server 8080
npm test             # unit tests (Node 18+)
```

The enquiry form **will not send on localhost**. It tells you so honestly instead of faking success. Test it on a Netlify deploy preview.

---

## How the walkthrough works

* The `#explore` section is `--wt-screens` viewport-heights tall (9 on desktop, 7 on mobile, set in `css/styles.css`), and its stage is `position: sticky`. The browser does the pinning and scrolling stays native, with **no scroll hijacking**.
* GSAP ScrollTrigger reports progress 0 → 1. If GSAP fails to load, the controller measures scroll itself.
* Progress is smoothed, frame-rate independently, and passed to the active renderer. The loop only runs while the section is on screen and something is changing.
* **9 chapters** come from `js/scenes.js`: Arrival → Entrance → Passage → First room → More rooms → Kitchen → Washrooms → Comforts → Enquire. Each chapter holds one or more photos ("shots"). Chapter lengths are computed from the number of photos, so adding or removing a photo needs no re-timing.
* **The photo walkthrough** (`js/walkthrough/photos.js`) shows each photo in a frame over a blurred, full-bleed copy of itself. While a photo is on screen it slowly pushes in. Near the end it rushes toward the camera and fades while the next photo rises into place, giving a forward "dolly" from one space to the next. Captions, the "2 / 3" counter and the "To be confirmed" notes follow each photo.
* **Renderer selection** (`walkthrough.mode: "auto"` in `config.js`): video → frames → photos. Photos paint instantly, so there is **never a loading screen**. If real video is configured, it loads after the page is idle and cross-fades in.
* **Fallbacks:** a failed video/frames load returns to the photos (pure CSS transforms, no WebGL needed). **`prefers-reduced-motion`** → no pinning or scrubbing, just the chapters as a calm photo grid. No JavaScript → hero plus normal page.
* **Accessibility:** a skip link, a "Skip walkthrough" link, keyboard-focusable chapter buttons, an `aria-live` chapter announcement, semantic landmarks, labelled form fields with inline errors, and focus styles.

---

## Updating the photos

Full specs: **[ASSETS.md](ASSETS.md)**. In short:

1. **Sharper photos (most impact):** get the original full-size photos and overwrite the files in `assets/images/property/` **with the same filenames**. Nothing else needs to change. Ideally 1600 px+ on the long side, under 300 KB each, *without* the phone-number watermark (the number is already on the site).
2. **Add or reorder photos:** edit the `shots` lists in `js/scenes.js` (`src`, `alt`, `caption`, and `portrait: true` for tall photos).
3. **Room cards:** once the owner confirms room types, set names, occupancy, rent and availability in `data/rooms.json` (`verified: true`) and pick the matching photos.
4. **Confirmations:** remove `confirmed: false` from a chapter once its note (e.g. "Attached or shared, to be confirmed") is answered.
5. **Video walkthrough (optional upgrade):** run `scripts/encode-walkthrough.sh source.mp4` and set `walkthrough.video.available: true`. Then give each chapter explicit `start`/`end` values matching the video.

---

## Enquiry form

Pick a provider in `js/config.js → form.provider`:

| Provider | Host | Setup |
|---|---|---|
| `"netlify"` (default) | Netlify | Nothing to do. Netlify detects the `enquiry` form on deploy. Submissions appear under **Site → Forms**; turn on email notifications there. Works without JavaScript too (redirects to `thank-you.html`). |
| `"api"` | Vercel | `api/enquiry.js` delivers via **Resend** email (`RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ENQUIRY_FROM_EMAIL`) or any **webhook** (`ENQUIRY_WEBHOOK_URL`). Set these in Vercel → Settings → Environment Variables. Secrets never reach the browser. Unconfigured, it returns 503 and the site says the enquiry was **not** sent. |
| `"endpoint"` | Anywhere | Set `form.endpoint` to a public form-service URL (e.g. Formspree). |

The site never shows a success message unless the service actually accepted the submission. Once the WhatsApp number is verified, a "Send on WhatsApp instead" button also appears.

---

## Deploy

### Netlify (recommended: forms work out of the box)
1. Netlify → **Add new site → Import an existing project** → GitHub → `harnoor364/trikha-pg-`.
2. Branch `main`, build command **empty**, publish directory **`.`** (already set in `netlify.toml`).
3. Deploy. Then **Site configuration → Forms**: confirm form detection is on and add a notification email.
4. Custom domain: **Domain management → Add domain**. Then replace `trikha-pg.netlify.app` in `index.html` (canonical, `og:` tags, JSON-LD), `js/config.js → siteUrl`, `sitemap.xml` and `robots.txt`.

Alternatively, drag the folder onto <https://app.netlify.com/drop>.

### Vercel
1. Vercel → **Add New → Project** → import `harnoor364/trikha-pg-`.
2. Framework preset **Other**, build command **none**, output directory **`.`**.
3. Set `form.provider: "api"` in `js/config.js` and add the environment variables above (or use `"endpoint"`).
4. Deploy. `vercel.json` sets the headers.

---

## Going live (remove demo mode)

When the owner has approved the content:

1. `js/config.js`: fill in and verify contact details, set `demo.enabled: false`.
2. `index.html`: delete the `<meta name="robots" content="noindex, nofollow">` line (marked `DEMO`). Add `telephone`/`address`/`aggregateRating` to the JSON-LD **only** with verified values.
3. `robots.txt`: allow crawling (instructions inside). `netlify.toml` / `vercel.json`: remove the `X-Robots-Tag` header.
4. Replace placeholder media (above). Make sure no "Placeholder" or "To be confirmed" tags remain for things that are actually known.
5. Re-check the Google rating, set `rating.value/count/checkedOn` and `verified: true`.
6. Submit `sitemap.xml` in Google Search Console and link the site from the Google Business Profile.

---

## ✅ To confirm with the owner

- [ ] Confirm **98557 57737** is the right enquiry number, and whether it takes **WhatsApp**
- [ ] Full street address, PIN code, nearest landmark; visiting hours
- [ ] Who the PG is for (students / working professionals; boys / girls / co-living)
- [ ] Room types, occupancy (single/double/triple), rent per type, deposit, what rent includes
- [ ] Current availability
- [ ] Facilities actually provided (Wi-Fi, meals, kitchen, laundry, power backup, security, AC, etc.)
- [ ] Kitchen: can residents cook? Are meals provided? Are washrooms attached or shared? Which rooms have AC/TV/fridge?
- [ ] Full-resolution originals of the 18 photos (and any more: exterior wide shot, reception, terrace)
- [ ] Current Google rating & review count; permission to quote specific reviews
- [ ] Permission to film the property for an optional video walkthrough (see ASSETS.md)
- [ ] Final domain name

## Credits

Design & development: Harnoor Singh. GSAP © GreenSock (standard no-charge licence). Fonts: Cormorant Garamond & Manrope (Google Fonts, OFL). Property photos: TRIKHA PG.
