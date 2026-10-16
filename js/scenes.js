// Walkthrough chapters. `start`/`end` are fractions of the whole scroll journey
// (and of the video duration in video mode). Keep them contiguous 0 → 1.
//
// `still` is the image shown before the 3D/video is ready, in the no-WebGL
// fallback, and in the reduced-motion version. Replace the SVG placeholders with
// real photos of the same shot (see ASSETS.md) — keep the same filenames or
// update the paths here.
//
// `cutAfter: true` → a soft dip-to-black into the next chapter (a camera cut).
// Leave it off where the camera moves continuously.
//
// `confirmed: false` → the chapter shows a "to be confirmed" note because the
// space it depicts has not been verified with the owner yet.

export const SCENES = [
  {
    id: "exterior", chapter: "01", label: "Arrival",
    title: "The approach",
    caption: "Arrive at TRIKHA PG in BRS Nagar, Ludhiana.",
    start: 0, end: 0.14,
    still: "assets/images/scenes/01-exterior.svg", confirmed: true,
  },
  {
    id: "entry", chapter: "02", label: "Entry",
    title: "Step inside",
    caption: "The entrance and reception area.",
    start: 0.14, end: 0.25,
    still: "assets/images/scenes/02-entry.svg", confirmed: false,
  },
  {
    id: "corridor", chapter: "03", label: "Corridor",
    title: "Down the corridor",
    caption: "Corridors lead to the residents' rooms.",
    start: 0.25, end: 0.37,
    still: "assets/images/scenes/03-corridor.svg", confirmed: false,
  },
  {
    id: "room-1", chapter: "04", label: "Room one",
    title: "Your room",
    caption: "Room layout, furniture and occupancy to be confirmed.",
    start: 0.37, end: 0.51, cutAfter: true,
    still: "assets/images/scenes/04-room-1.svg", confirmed: false,
  },
  {
    id: "room-2", chapter: "05", label: "More rooms",
    title: "More room options",
    caption: "Additional room types, if available, will be shown here.",
    start: 0.51, end: 0.63, cutAfter: true,
    still: "assets/images/scenes/05-room-2.svg", confirmed: false,
  },
  {
    id: "shared", chapter: "06", label: "Shared spaces",
    title: "Shared facilities",
    caption: "Kitchen and dining spaces will be shown once confirmed by the owner.",
    start: 0.63, end: 0.76,
    still: "assets/images/scenes/06-shared.svg", confirmed: false,
  },
  {
    id: "final-room", chapter: "07", label: "Final room",
    title: "A room with light",
    caption: "Picture yourself settling in.",
    start: 0.76, end: 0.9,
    still: "assets/images/scenes/07-final-room.svg", confirmed: false,
  },
  {
    id: "enquire", chapter: "08", label: "Enquire",
    title: "Make it yours",
    caption: "Ask about availability and visit in person.",
    start: 0.9, end: 1,
    still: "assets/images/scenes/08-enquire.svg", confirmed: true,
  },
];
