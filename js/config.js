/**
 * TRIKHA PG — site configuration.
 * ------------------------------------------------------------------
 * EVERY business detail lives here. Anything not yet confirmed by the
 * owner is marked `verified: false` (or left empty) and the site shows
 * it as a placeholder / hides it. Flip the flag only after checking.
 *
 * Source of what IS known: the Google Maps listing
 * "TRIKHA PG in Ludhiana (BRS Nagar)" (category: student dormitory),
 * pin 30.8855232, 75.8156191.
 */
export const CONFIG = {
  siteUrl: "https://trikha-pg.netlify.app", // update when the real domain is live

  demo: {
    // Preview mode: banner on, placeholder notes visible, noindex (see README → Going live).
    enabled: true,
    bannerText: "Preview · photos, rooms, rent and contact details are placeholders",
  },

  business: {
    name: "TRIKHA PG",
    listingName: "TRIKHA PG in Ludhiana (BRS Nagar)",
    category: "Student accommodation / PG",
    // Audience is not yet confirmed (boys / girls / co-living / working professionals).
    audience: { value: "", verified: false },
  },

  contact: {
    // Leave "" until the owner confirms. Format: digits only with country code, e.g. "919876543210".
    phone: { e164: "", display: "", verified: false },
    whatsapp: { number: "", verified: false },
    email: { value: "", verified: false },
    visitingHours: { value: "", verified: false },
  },

  address: {
    line1: "", // street / house no. — TO CONFIRM
    locality: "BRS Nagar",
    city: "Ludhiana",
    region: "Punjab",
    postalCode: "", // TO CONFIRM
    country: "IN",
    landmark: { value: "", verified: false },
  },

  geo: {
    lat: 30.8855232,
    lng: 75.8156191,
    // Google Maps CID from the listing (0xe441bdaf943c98d1).
    mapsCid: "16447635875937687761",
  },

  rating: {
    // Reported on the Google listing: 4.8★ from 94 reviews.
    // Shown on the site ONLY when verified === true. Re-check the live listing first,
    // update value/count/checkedOn, then set verified: true.
    value: 4.8,
    count: 94,
    checkedOn: "",
    verified: false,
  },

  // Resident quotes: add ONLY real, attributable reviews you have permission to use.
  // { quote, name, source: "Google review", url, date, permission: true }
  testimonials: [],

  form: {
    // "netlify" → Netlify Forms (works only when deployed on Netlify)
    // "api"     → POST /api/enquiry (Vercel serverless function in /api; needs env vars)
    // "endpoint"→ POST JSON to `endpoint` (e.g. a Formspree form URL — public, not a secret)
    provider: "netlify",
    endpoint: "",
  },

  walkthrough: {
    // "auto" picks the best available: video → frames → placeholder3d → stills
    mode: "auto",
    // Set true once real footage is in assets/video (see ASSETS.md).
    video: {
      available: false,
      desktop: "assets/video/walkthrough-1080p.mp4",
      mobile: "assets/video/walkthrough-720p.mp4",
      poster: "assets/images/scenes/01-exterior.svg",
    },
    frames: {
      available: false,
      path: "assets/frames/desktop/frame_{i}.webp", // {i} → zero-padded index
      mobilePath: "assets/frames/mobile/frame_{i}.webp",
      count: 0,
      pad: 4,
    },
    // Procedural architectural block-out. NOT the real layout — always badged as such.
    placeholder3d: true,
  },
};
