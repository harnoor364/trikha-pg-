# TRIKHA PG: scroll-driven walkthrough website

A premium, responsive website for **TRIKHA PG, BRS Nagar, Ludhiana, Punjab**. The main feature is a cinematic walkthrough that moves forward as the visitor scrolls: entrance, entry, corridor, rooms, shared spaces, final room, then the enquiry call to action.

> ⚠️ **Preview / demo mode is ON.** No real footage, photos, room details, rent, phone or WhatsApp number have been supplied yet. The walkthrough currently uses a **procedural 3D block-out**, badged on screen as *"Illustrative 3D block-out · not the actual TRIKHA PG layout"*. **It is not a real property walkthrough.** It becomes one only once genuine footage (or an accurate 3D model) is added. See [ASSETS.md](ASSETS.md).

Plain HTML, CSS and JavaScript (ES modules). **No build step, no framework, no backend required.** Libraries are self-hosted in `js/vendor/` (GSAP 3.12.5 + ScrollTrigger, three.js r160), so the site doesn't depend on third-party CDNs.

---

## What's confirmed vs placeholder

| Item | Status | Where to change |
|---|---|---|
| Name "TRIKHA PG", BRS Nagar, Ludhiana | ✅ From the Google Maps listing *"TRIKHA PG in Ludhiana (BRS Nagar)"* | `js/config.js` |
| Map pin 30.8855232, 75.8156191 and listing link | ✅ From the listing | `js/config.js → geo` |
| Street address, PIN code, landmark | ❌ To confirm | `js/config.js → address` |
| Phone, WhatsApp, email, visiting hours | ❌ To confirm. Buttons stay disabled until `verified: true` | `js/config.js → contact` |
| Google rating (reported 4.8★ / 94 reviews) | ❌ **Hidden** until re-checked on the live listing and `rating.verified: true` | `js/config.js → rating` |
| Testimonials | ❌ None shown. Add only real, attributed reviews with permission | `js/config.js → testimonials` |
| Room types, occupancy, facilities, rent, availability | ❌ Placeholders ("To be confirmed") | `data/rooms.json` |
| Shared facilities | ❌ Checklist only; just `confirmed: true` items show on the live site | `data/rooms.json → facilities` |
| Walkthrough footage / photos | ❌ Placeholders | see [ASSETS.md](ASSETS.md) |
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
  scenes.js                 ← Walkthrough chapters: titles, captions, timing, still images
  main.js                   Page wiring: nav, contact links, rooms, form, map, trust gating
  lib/progress.js           Pure scroll→scene maths (unit-tested)
  lib/contact.js            tel:/wa.me/maps link builders (unit-tested)
  lib/validate.js           Enquiry validation, shared with /api/enquiry (unit-tested)
  walkthrough/
    controller.js           Sticky stage, ScrollTrigger progress, smoothing, UI, renderer selection
    stills.js               Still-image renderer (first paint, loading state, fallback)
    video.js                Scroll-scrubbed <video> renderer (for real footage)
    frames.js               Image-sequence canvas renderer (for real footage, best on iOS)
    placeholder3d.js        Procedural three.js block-out (current placeholder)
  vendor/                   gsap.min.js, ScrollTrigger.min.js, three.module.min.js
data/rooms.json             ← Room cards + facility checklist
assets/images/scenes/       ← One still per walkthrough chapter (SVG placeholders now)
assets/images/rooms/        ← Room photos (SVG placeholders now)
assets/video/               ← Encoded walkthrough videos go here
assets/frames/              ← Optional image sequence goes here
api/enquiry.js              Vercel serverless function for the form (optional)
scripts/
  encode-walkthrough.sh     ffmpeg commands to prepare footage for scrubbing
  generate-placeholders.mjs Regenerates the SVG placeholders
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
* Chapters, captions, the dip-to-black on camera cuts, the chapter rail and the final CTA all come from `js/scenes.js`.
* **Renderer selection** (`walkthrough.mode: "auto"` in `config.js`): video → frames → placeholder3d → stills. The stills renderer paints instantly, so there is **never a loading screen**. The richer renderer loads after the page is idle and cross-fades in.
* **Fallbacks:** no WebGL, a lost WebGL context, or a failed video/frames load → still images. **`prefers-reduced-motion`** → no pinning or scrubbing, just a calm vertical list of chapters. No JavaScript → hero plus normal page.
* **Accessibility:** a skip link, a "Skip walkthrough" link, keyboard-focusable chapter buttons, an `aria-live` chapter announcement, semantic landmarks, labelled form fields with inline errors, and focus styles.

---

## Replacing placeholders with real TRIKHA PG media

Full shot list and specs: **[ASSETS.md](ASSETS.md)**. In short:

1. **Walkthrough video** (recommended): run `scripts/encode-walkthrough.sh source.mp4`, then set `walkthrough.video.available: true` in `js/config.js`. Re-time the chapters in `js/scenes.js` so each `start`/`end` matches where that space appears in the video (fraction of the duration, e.g. 0.37 = 37 %).
2. **Image sequence** (optional, smoothest on iPhone): the same script writes `assets/frames/…`. Set `frames.available: true` and `frames.count`.
3. **Chapter stills**: save a photo of each space as `assets/images/scenes/01-exterior.jpg` … `08-enquire.jpg` (1600×900, under 250 KB) and change the `.svg` paths in `js/scenes.js` to `.jpg`.
4. **Room photos**: add them to `assets/images/rooms/` and list them in `data/rooms.json → rooms[].images`. Set `placeholder: false`.
5. Once real footage is live, the placeholder 3D is no longer used. You can delete `js/walkthrough/placeholder3d.js` and `js/vendor/three.module.min.js` and set `placeholder3d: false`.
6. Remove the scene's `confirmed: false` (or set `true`) for every space that is genuinely shown.

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

- [ ] Phone number and **WhatsApp number** (confirm which number takes WhatsApp)
- [ ] Full street address, PIN code, nearest landmark; visiting hours
- [ ] Who the PG is for (students / working professionals; boys / girls / co-living)
- [ ] Room types, occupancy (single/double/triple), rent per type, deposit, what rent includes
- [ ] Current availability
- [ ] Facilities actually provided (Wi-Fi, meals, kitchen, laundry, power backup, security, AC, etc.)
- [ ] Whether kitchen/dining spaces exist (chapter 06) and how many room types to show (chapters 04/05)
- [ ] Current Google rating & review count; permission to quote specific reviews
- [ ] Permission to film/photograph the property (see ASSETS.md) and to use any Google-listing photos
- [ ] Final domain name

## Credits

Design & development: Harnoor Singh. GSAP © GreenSock (standard no-charge licence). three.js © mrdoob and contributors (MIT, `js/vendor/three.LICENSE`). Fonts: Cormorant Garamond & Manrope (Google Fonts, OFL).
