// Generates the labelled SVG placeholder images in assets/images/.
// Run: node scripts/generate-placeholders.mjs
// These are line-drawing stand-ins ONLY — replace them with real photos (see ASSETS.md).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); console.log("wrote", p); };

const BRONZE = "#c9a47c";
const line = (x1, y1, x2, y2, o = 0.5, w = 1.4) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BRONZE}" stroke-opacity="${o}" stroke-width="${w}"/>`;
const rect = (x, y, w, h, o = 0.5, fill = "none", sw = 1.4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${BRONZE}" stroke-opacity="${o}" stroke-width="${sw}"/>`;
const poly = (pts, o = 0.5, fill = "none") => `<polygon points="${pts}" fill="${fill}" stroke="${BRONZE}" stroke-opacity="${o}" stroke-width="1.4"/>`;

/** One-point perspective box: back wall rect inside the frame. */
function room(W, H, b) {
  const [x0, y0, x1, y1] = b;
  return [
    rect(x0, y0, x1 - x0, y1 - y0, 0.55),
    line(0, 0, x0, y0), line(W, 0, x1, y0), line(0, H, x0, y1), line(W, H, x1, y1),
    // floor boards converging
    ...[0.2, 0.4, 0.6, 0.8].map((f) => line(W * f, H, x0 + (x1 - x0) * f, y1, 0.18, 1)),
    // ceiling light
    `<ellipse cx="${(x0 + x1) / 2}" cy="${y0 - (y0) * 0.45}" rx="60" ry="10" fill="#ffd9a8" fill-opacity="0.35"/>`,
  ].join("");
}

function frame({ W, H, title, chapter, file, body, glow = [0.5, 0.55], warm = 0.35 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Placeholder: ${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a1816"/><stop offset="0.55" stop-color="#26221e"/><stop offset="1" stop-color="#14120f"/>
    </linearGradient>
    <radialGradient id="glow" cx="${glow[0]}" cy="${glow[1]}" r="0.55">
      <stop offset="0" stop-color="#e9b77d" stop-opacity="${warm}"/><stop offset="1" stop-color="#e9b77d" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#fff" fill-opacity="0.025"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${body}
  <rect width="${W}" height="${H}" fill="url(#grain)"/>
  <g font-family="Manrope, system-ui, sans-serif" fill="#ecd7b8">
    <rect x="${W / 2 - 92}" y="${H * 0.5 - 70}" width="184" height="30" rx="15" fill="#120f0c" fill-opacity="0.7" stroke="${BRONZE}" stroke-opacity="0.7" stroke-dasharray="4 4"/>
    <text x="${W / 2}" y="${H * 0.5 - 50}" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="3">PLACEHOLDER</text>
    <text x="${W / 2}" y="${H * 0.5 + 6}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${W > 1300 ? 54 : 44}" fill="#f5f0e8">${chapter ? chapter + " · " : ""}${title}</text>
    <text x="${W / 2}" y="${H * 0.5 + 44}" text-anchor="middle" font-size="15" fill-opacity="0.75">Replace with real photo: ${file}</text>
  </g>
</svg>
`;
}

const W = 1600, H = 900;
const back = [560, 290, 1040, 620];
const scenes = [
  {
    file: "01-exterior", chapter: "01", title: "Exterior & approach", glow: [0.5, 0.42], warm: 0.4,
    body: [
      line(0, 720, W, 720, 0.35),
      poly("380,720 380,190 1220,190 1220,720", 0.55),
      ...[260, 420].flatMap((y) => [460, 610, 900, 1050].map((x) => rect(x, y, 90, 100, 0.45, "#ffcf94", 1).replace('fill="#ffcf94"', 'fill="#ffcf94" fill-opacity="0.16"'))),
      rect(740, 520, 120, 200, 0.7, "#ffd9a8").replace('fill="#ffd9a8"', 'fill="#ffd9a8" fill-opacity="0.18"'),
      rect(690, 500, 220, 14, 0.7),
      line(180, 760, 640, 760, 0.45, 3), line(960, 760, 1420, 760, 0.45, 3),
      rect(620, 640, 22, 120, 0.6), rect(958, 640, 22, 120, 0.6),
      `<circle cx="631" cy="628" r="9" fill="#ffd9a8" fill-opacity="0.8"/><circle cx="969" cy="628" r="9" fill="#ffd9a8" fill-opacity="0.8"/>`,
      line(640, 900, 760, 720, 0.25), line(960, 900, 840, 720, 0.25),
    ].join(""),
  },
  {
    file: "02-entry", chapter: "02", title: "Entry & reception", glow: [0.5, 0.5],
    body: room(W, H, back) + rect(720, 360, 160, 260, 0.6, "#ffd9a8").replace('fill="#ffd9a8"', 'fill="#ffd9a8" fill-opacity="0.12"') + poly("1120,640 1300,700 1300,560 1120,520", 0.45),
  },
  {
    file: "03-corridor", chapter: "03", title: "Corridor", glow: [0.5, 0.5], warm: 0.3,
    body: room(W, H, [700, 330, 900, 560]) +
      [0.18, 0.42].map((f) => {
        const xL = 700 * f, xR = W - xL;
        const yT = 330 * f + 120 * (1 - f), yB = H - (H - 560) * f;
        return poly(`${xL + 60},${yT + 40} ${xL + 150},${yT + 70} ${xL + 150},${yB - 50} ${xL + 60},${yB - 20}`, 0.45) +
          poly(`${xR - 60},${yT + 40} ${xR - 150},${yT + 70} ${xR - 150},${yB - 50} ${xR - 60},${yB - 20}`, 0.45);
      }).join(""),
  },
  {
    file: "04-room-1", chapter: "04", title: "Room one", glow: [0.62, 0.45],
    body: room(W, H, back) + rect(860, 350, 140, 130, 0.65, "#fff1dc").replace('fill="#fff1dc"', 'fill="#fff1dc" fill-opacity="0.18"') +
      poly("560,560 900,560 1000,700 380,760", 0.5) + poly("380,760 1000,700 1000,740 380,810", 0.4),
  },
  {
    file: "05-room-2", chapter: "05", title: "More rooms", glow: [0.4, 0.45],
    body: room(W, H, back) + rect(600, 350, 140, 130, 0.65, "#fff1dc").replace('fill="#fff1dc"', 'fill="#fff1dc" fill-opacity="0.18"') +
      poly("1040,560 700,560 600,700 1220,760", 0.5) + rect(300, 560, 200, 16, 0.5) + line(310, 576, 310, 700, 0.4) + line(490, 576, 490, 700, 0.4),
  },
  {
    file: "06-shared", chapter: "06", title: "Shared spaces", glow: [0.5, 0.4],
    body: room(W, H, [480, 280, 1120, 640]) + rect(500, 520, 600, 120, 0.5) + rect(500, 330, 600, 70, 0.4) +
      poly("620,700 980,700 1060,780 540,780", 0.55) +
      [700, 800, 900].map((x) => line(x, 0, x, 470, 0.3) + `<circle cx="${x}" cy="480" r="12" fill="#ffd9a8" fill-opacity="0.6"/>`).join(""),
  },
  {
    file: "07-final-room", chapter: "07", title: "Final room", glow: [0.5, 0.45], warm: 0.55,
    body: room(W, H, back) + rect(660, 330, 280, 210, 0.75, "#ffb46e").replace('fill="#ffb46e"', 'fill="#ffb46e" fill-opacity="0.28"') +
      poly("560,600 840,600 900,720 360,790", 0.45),
  },
  {
    file: "08-enquire", chapter: "08", title: "Make it yours", glow: [0.5, 0.48], warm: 0.75,
    body: rect(420, 160, 760, 560, 0.8, "#ffd2a1").replace('fill="#ffd2a1"', 'fill="#ffd2a1" fill-opacity="0.2"') + line(800, 160, 800, 720, 0.5) + line(420, 440, 1180, 440, 0.5),
  },
];
for (const s of scenes) out(`assets/images/scenes/${s.file}.svg`, frame({ W, H, ...s, file: `assets/images/scenes/${s.file}.jpg` }));

// Room card placeholders (4:3)
const RW = 1200, RH = 900;
const rb = [400, 280, 800, 600];
[["room-a-1", "Room type A", 0.6], ["room-b-1", "Room type B", 0.4], ["room-c-1", "Room type C", 0.5]].forEach(([f, t, gx]) => {
  out(`assets/images/rooms/${f}.svg`, frame({
    W: RW, H: RH, title: t, chapter: "", file: `assets/images/rooms/${f}.jpg`, glow: [gx, 0.45],
    body: room(RW, RH, rb) + rect(gx > 0.5 ? 640 : 440, 330, 120, 110, 0.6) + poly(gx > 0.5 ? "400,540 640,540 720,660 260,720" : "800,540 560,540 480,660 940,720", 0.5),
  }));
});

out("assets/images/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1b1a19"/><path d="M6 26V14L16 6l10 8v12" fill="none" stroke="#d2b18c" stroke-width="2"/><path d="M13 26v-7h6v7" fill="none" stroke="#d2b18c" stroke-width="2"/></svg>
`);
