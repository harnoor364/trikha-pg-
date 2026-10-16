// Walkthrough chapters, built from real photos of TRIKHA PG.
//
// Each chapter has one or more `shots` (photos). Scroll moves forward through
// them with a slow push-in and a forward "dolly" cross-fade into the next shot.
// Chapter lengths are computed from the number of shots (plus `weight`), so you
// can add/remove photos without re-timing anything by hand.
//
// To swap in sharper originals: keep the filenames in assets/images/property/
// (or change `src` here). Portrait photos are fine — set `portrait: true`.
//
// `confirmed: false` shows a small "To be confirmed" tag on the chapter, for
// things the photos alone don't establish (e.g. whether washrooms are attached).
//
// With real walkthrough VIDEO later: set walkthrough.video.available in config.js
// and give each chapter explicit `start`/`end` (fractions of the video) instead.

const P = "assets/images/property/";

const CHAPTERS = [
  {
    id: "exterior", label: "Arrival", title: "The approach",
    caption: "TRIKHA PG, BRS Nagar, Ludhiana.", weight: 1.6,
    shots: [{ src: P + "01-exterior-gate.jpg", alt: "Front of the building with its gate and a car parked on the street", caption: "Arrive at the gate in BRS Nagar, Ludhiana." }],
  },
  {
    id: "entry", label: "Entrance", title: "Step inside",
    shots: [{ src: P + "02-entrance-passage.jpg", alt: "Clean tiled entrance passage lined with potted plants, leading to a red door", caption: "A clean, plant-lined entrance passage." }],
  },
  {
    id: "corridor", label: "Passage", title: "Through the passage",
    shots: [{ src: P + "03-passage-to-gate.jpg", alt: "Bright tiled passage with potted plants looking toward the front gate", caption: "Bright, tidy common passage with plenty of greenery." }],
  },
  {
    id: "room-1", label: "First room", title: "Your room",
    shots: [
      { src: P + "04-room-bed-wardrobe-tv.jpg", alt: "Room with a double bed, white wardrobe, wall-mounted TV on a desk, chair and refrigerator", caption: "Bed, wardrobe, TV on a study desk, and a fridge." },
      { src: P + "05-room-steel-almirah.jpg", alt: "Grey steel almirah beside a door in a room", caption: "Steel almirah for secure storage." },
      { src: P + "09-room-study-desk.jpg", alt: "Study desk with a chair beside a door", caption: "A study desk and chair." },
    ],
  },
  {
    id: "room-2", label: "More rooms", title: "More rooms",
    caption: "Room types and occupancy to be confirmed.", confirmed: false,
    shots: [
      { src: P + "06-room-bed-door.jpg", alt: "Room with a bed and a door leading toward a washroom", caption: "Another furnished room." },
      { src: P + "07-room-bed-mirror.jpg", alt: "Bed with a patterned bedsheet, wall mirror and curtains", portrait: true, caption: "Bed, mirror and curtains." },
      { src: P + "08-room-bed-wall-panel.jpg", alt: "Bed against a patterned wall panel", portrait: true, caption: "Wall-panelled bedside." },
      { src: P + "10-room-hooks-cabinet.jpg", alt: "Clothes hooks, a chair and a green storage cabinet", portrait: true, caption: "Hooks and a storage cabinet." },
    ],
  },
  {
    id: "kitchen", label: "Kitchen", title: "The kitchen",
    caption: "Kitchen access and meal arrangements to be confirmed.", confirmed: false,
    shots: [
      { src: P + "11-kitchen-counter.jpg", alt: "Tiled kitchen with a counter, shelves and a refrigerator", caption: "A tiled kitchen with counter and shelves." },
      { src: P + "12-kitchen-fridge.jpg", alt: "Narrow kitchen with refrigerator, counter and window", portrait: true, caption: "Refrigerator and work counter." },
      { src: P + "13-kitchen-sink.jpg", alt: "Granite counter with sink and a wall-mounted water heater", caption: "Sink and granite counter." },
    ],
  },
  {
    id: "washrooms", label: "Washrooms", title: "Washrooms",
    caption: "Attached or shared — to be confirmed.", confirmed: false,
    shots: [
      { src: P + "14-washroom-passage.jpg", alt: "Doorway from a room into a tiled washroom area", caption: "Tiled washroom area." },
      { src: P + "15-washroom-toilet.jpg", alt: "Tiled washroom with a western toilet and washbasin", portrait: true, caption: "Western toilet and washbasin." },
      { src: P + "16-washroom-shower.jpg", alt: "Tiled shower area with taps and a bucket", portrait: true, caption: "Shower area with hot and cold taps." },
    ],
  },
  {
    id: "final-room", label: "Comforts", title: "Settle in",
    shots: [
      { src: P + "18-room-tv-desk-shelf.jpg", alt: "Room with a wall-mounted TV over a desk and a bookshelf", portrait: true, caption: "TV, desk and a bookshelf for your things." },
      { src: P + "17-room-ac.jpg", alt: "Window air conditioner installed above a room door", portrait: true, caption: "Air conditioning (ask which rooms have AC)." },
    ],
  },
  {
    id: "enquire", label: "Enquire", title: "Make it yours", weight: 1.3,
    caption: "Ask about availability and visit in person.",
    shots: [{ src: P + "04-room-bed-wardrobe-tv.jpg", alt: "", caption: "" }],
  },
];

// ---- derive contiguous start/end ranges from shot counts ---------------------
const weights = CHAPTERS.map((c) => c.weight ?? c.shots.length);
const total = weights.reduce((a, b) => a + b, 0);
let acc = 0;
export const SCENES = CHAPTERS.map((c, i) => {
  const start = acc;
  acc = i === CHAPTERS.length - 1 ? 1 : Math.round(((acc * total + weights[i]) / total) * 1e6) / 1e6;
  return {
    confirmed: true,
    caption: c.shots[0].caption,
    ...c,
    chapter: String(i + 1).padStart(2, "0"),
    start,
    end: acc,
    still: c.shots[0].src,
  };
});
