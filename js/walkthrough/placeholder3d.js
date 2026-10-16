// Procedural architectural block-out used until real TRIKHA PG footage exists.
//
// ⚠ This is NOT the property's real layout, room count or furnishing. It is a
// generic, clearly badged "greybox" so the scroll experience can be reviewed.
// Replace it with real footage (video/frames) or an accurate model — see ASSETS.md.
//
// Everything is generated in code (no model download): a few hundred boxes,
// two canvas textures and a pool of 4 moving point lights. Renders on demand.

import * as THREE from "../vendor/three.module.min.js";
import { sceneIndexAt, localProgress, softEase, clamp, smoothstep } from "../lib/progress.js";

const C = {
  night: 0x12100e,
  plaster: 0xe9e2d6,
  plasterWarm: 0xdcd0bf,
  charcoal: 0x2b2927,
  charcoalDeep: 0x1b1a19,
  bronze: 0xa9825a,
  wood: 0x6e4d35,
  woodLight: 0x9a7556,
  linen: 0xe6dfd3,
  throwA: 0x8a6a50,
  throwB: 0x55606a,
  throwC: 0xb08a63,
  glow: 0xffd8a8,
  daylight: 0xfff1dc,
  sunset: 0xffb46e,
};

export async function createPlaceholder3D(container, { scenes, mobile, onLost }) {
  try { await document.fonts?.ready; } catch {}
  const canvas = document.createElement("canvas");
  canvas.className = "wt-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: "high-performance", alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = gradientTexture(["#0e0d0c", "#1d1a17", "#3a2c22"]);
  scene.fog = new THREE.Fog(C.night, 14, 58);

  const camera = new THREE.PerspectiveCamera(mobile ? 62 : 54, 1, 0.05, 140);

  // ---- Materials -------------------------------------------------------------
  const tex = {
    stone: tileTexture({ base: "#cfc6b8", grout: "#b7ac9c", tiles: 4, noise: 10 }),
    paver: tileTexture({ base: "#3a3632", grout: "#2a2725", tiles: 6, noise: 14 }),
    plank: plankTexture(),
  };
  const M = {
    plaster: std(C.plaster, 0.92),
    plasterWarm: std(C.plasterWarm, 0.9),
    charcoal: std(C.charcoal, 0.85),
    charcoalDeep: std(C.charcoalDeep, 0.9),
    bronze: std(C.bronze, 0.38, 0.65),
    wood: std(C.wood, 0.6),
    woodLight: std(C.woodLight, 0.65),
    linen: std(C.linen, 0.95),
    throwA: std(C.throwA, 0.95),
    throwB: std(C.throwB, 0.95),
    throwC: std(C.throwC, 0.95),
    glass: new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.15, metalness: 0.2, emissive: 0x3a3226, emissiveIntensity: 0.6 }),
    ceiling: std(0xf1ece4, 0.95),
    leaf: std(0x3d4a36, 0.9),
  };
  const glowMat = (color, intensity = 1.6) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: intensity, roughness: 1 });

  const world = new THREE.Group();
  scene.add(world);
  const lightAnchors = [];
  const anchor = (x, y, z, color, intensity, distance) => lightAnchors.push({ pos: new THREE.Vector3(x, y, z), color: new THREE.Color(color), intensity, distance });

  // ---- Geometry helpers --------------------------------------------------------
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, mat, w, h, d, x, y, z, ry = 0) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function floor(parent, mat, texture, x0, x1, z0, z1, y = 0, repeatScale = 1) {
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(w / repeatScale, d / repeatScale);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    parent.add(m);
    return m;
  }
  function ceiling(parent, x0, x1, z0, z1, y) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0)), M.ceiling);
    m.rotation.x = Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    parent.add(m);
  }
  /**
   * A wall running along one axis with rectangular openings.
   * axis "z": wall at x = fixed spanning z from a→b. axis "x": wall at z = fixed spanning x from a→b.
   * openings: [{ c: centre along the run, w: width, h: height, sill: bottom (default 0) }]
   */
  function wall(parent, mat, axis, fixed, a, b, height, openings = [], thickness = 0.12) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const ops = [...openings].sort((p, q) => p.c - q.c);
    let cursor = lo;
    const piece = (s, e, y0, y1) => {
      if (e - s < 0.001 || y1 - y0 < 0.001) return;
      const len = e - s, mid = (s + e) / 2;
      if (axis === "z") box(parent, mat, thickness, y1 - y0, len, fixed, y0, mid);
      else box(parent, mat, len, y1 - y0, thickness, mid, y0, fixed);
    };
    for (const o of ops) {
      const s = o.c - o.w / 2, e = o.c + o.w / 2, sill = o.sill || 0;
      piece(cursor, s, 0, height);
      piece(s, e, o.h + sill, height); // lintel
      if (sill > 0) piece(s, e, 0, sill);
      cursor = e;
    }
    piece(cursor, hi, 0, height);
  }

  // =============================================================================
  // EXTERIOR — street, boundary wall with gate, facade (z = 0)
  // =============================================================================
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), std(0x2a2724, 0.95));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  world.add(ground);
  floor(world, null, tex.paver, -9, 9, 0, 9, 0.005, 1.2);
  // Street & kerb beyond the gate
  box(world, std(0x1e1d1c, 0.9), 80, 0.02, 7, 0, 0, 14);
  box(world, M.plasterWarm, 80, 0.14, 0.25, 0, 0, 10.4);
  for (let x = -30; x <= 30; x += 6) box(world, std(0xb8ad9c, 0.8), 2.4, 0.025, 0.12, x, 0, 14);
  // Warm up-lights washing the facade
  for (const sx of [-1, 1]) {
    box(world, glowMat(C.glow, 2.5), 0.3, 0.06, 0.3, sx * 5.5, 0, 0.6);
    anchor(sx * 5.5, 0.5, 1.6, C.glow, 30, 12);
  }

  // Boundary wall & gate
  wall(world, std(0x5a534b, 0.9), "x", 9, -16, 16, 1.25, [{ c: 0, w: 3.6, h: 3 }], 0.28);
  for (const sx of [-1, 1]) {
    box(world, M.charcoalDeep, 0.5, 2.1, 0.5, sx * 2.05, 0, 9);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12), glowMat(C.glow, 3));
    lamp.position.set(sx * 2.05, 2.3, 9);
    world.add(lamp);
    anchor(sx * 2.05, 2.3, 9.2, C.glow, 14, 9);
  }
  // Path lights along the forecourt
  for (const z of [2.2, 4.6, 7]) for (const sx of [-1, 1]) {
    box(world, M.charcoalDeep, 0.12, 0.6, 0.12, sx * 1.9, 0, z);
    box(world, glowMat(C.glow, 2.2), 0.13, 0.08, 0.13, sx * 1.9, 0.52, z);
  }

  // Building shell
  const BW = 9, BH = 10.6;
  const facade = new THREE.Group();
  world.add(facade);
  wall(facade, M.plasterWarm, "x", -0.15, -BW, BW, BH, [{ c: 0, w: 2.6, h: 3.05 }], 0.3);
  box(world, M.plasterWarm, 0.3, BH, 50, -BW, 0, -25);
  box(world, M.plasterWarm, 0.3, BH, 50, BW, 0, -25);
  box(world, M.charcoal, BW * 2 + 0.6, 0.4, 50.6, 0, BH, -25);
  // Floor bands & bronze fins
  for (const y of [3.45, 6.95]) box(facade, M.charcoal, BW * 2, 0.22, 0.42, 0, y, 0.05);
  for (const sx of [-1, 1]) box(facade, M.bronze, 0.12, BH, 0.24, sx * 1.65, 0, 0.12);
  // Windows (generic grid, warm interiors)
  const winGlow = [glowMat(0xffc98a, 1.1), glowMat(0xffdcae, 0.7), glowMat(0xf4b97a, 1.4), glowMat(0x2b2620, 0.3)];
  let wi = 0;
  for (const y of [4.3, 7.8]) for (const x of [-7, -4.6, -3.1, 3.1, 4.6, 7]) {
    if (Math.abs(x) === 3.1) continue;
    box(facade, winGlow[(wi++ * 7) % 4], 1.5, 1.7, 0.05, x, y, 0.02);
    box(facade, M.charcoalDeep, 1.66, 0.1, 0.18, x, y - 0.06, 0.06);
  }
  for (const x of [-5.6, 5.6]) {
    box(facade, winGlow[0], 2.4, 1.6, 0.05, x, 0.9, 0.02);
    box(facade, M.charcoalDeep, 2.56, 0.1, 0.22, x, 0.82, 0.08);
  }
  // Canopy + name sign
  box(facade, M.charcoalDeep, 4.4, 0.2, 1.9, 0, 3.25, 0.95);
  box(facade, glowMat(C.glow, 1.4), 4.0, 0.02, 1.6, 0, 3.24, 0.95);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.62), new THREE.MeshStandardMaterial({ map: signTexture(), emissive: 0xffffff, emissiveMap: signTexture(), emissiveIntensity: 0.9, roughness: 0.6 }));
  sign.position.set(0, 4.05, 0.08);
  facade.add(sign);
  anchor(0, 2.9, 1.6, C.glow, 18, 9);
  // Planters
  for (const sx of [-1, 1]) {
    box(facade, M.charcoal, 0.8, 0.55, 0.8, sx * 2.4, 0, 1.0);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), M.leaf);
    bush.position.set(sx * 2.4, 0.95, 1.0);
    facade.add(bush);
  }

  // =============================================================================
  // ENTRY LOBBY — z 0 → -6
  // =============================================================================
  const LH = 3.2;
  floor(world, null, tex.stone, -3, 3, -0.3, -6, 0.002, 1.2);
  ceiling(world, -3, 3, -0.3, -6, LH);
  wall(world, M.plaster, "z", -3, -0.3, -6, LH);
  wall(world, M.plaster, "z", 3, -0.3, -6, LH);
  wall(world, M.plaster, "x", -6, -3, 3, LH, [{ c: 0, w: 2.2, h: 2.75 }]);
  box(world, M.ceiling, 6, LH - 3.05, 0.3, 0, 3.05, -0.3); // header over door inside
  // Reception counter (generic)
  box(world, M.wood, 0.7, 1.05, 2.0, 2.3, 0, -3.3);
  box(world, M.bronze, 0.78, 0.05, 2.08, 2.3, 1.05, -3.3);
  // Bench + framed panel (left)
  box(world, M.charcoal, 0.5, 0.45, 1.8, -2.65, 0, -3.2);
  box(world, M.bronze, 0.04, 1.1, 1.6, -2.95, 1.25, -3.2);
  box(world, M.plasterWarm, 0.05, 0.95, 1.45, -2.93, 1.33, -3.2);
  box(world, glowMat(C.glow, 2.4), 1.4, 0.02, 1.4, 0, LH - 0.02, -3.1);
  anchor(0, 2.8, -3, C.glow, 9, 9);

  // =============================================================================
  // CORRIDOR — z -6 → -34, x ±1.1
  // =============================================================================
  const CH = 2.9, CW = 1.1;
  const doorsZ = [-10, -16, -22, -28];
  floor(world, null, tex.plank, -CW, CW, -6, -34, 0.002, 1.4);
  ceiling(world, -CW, CW, -6, -34, CH);
  const doorOps = doorsZ.map((c) => ({ c, w: 0.95, h: 2.15 }));
  wall(world, M.plaster, "z", -CW, -6, -34, CH, doorOps);
  wall(world, M.plaster, "z", CW, -6, -34, CH, doorOps);
  box(world, M.ceiling, CW * 2, CH - 2.75, 0.12, 0, 2.75, -6); // header from lobby
  // Skirting (bronze line) both sides
  for (const sx of [-1, 1]) box(world, M.charcoal, 0.02, 0.1, 28, sx * (CW - 0.06), 0, -20);
  // Doors: open for room-1 (left, -10) and room-2 (right, -16); closed elsewhere
  const doorPlate = glowMat(0xf2e3cc, 0.5);
  for (const z of doorsZ) for (const side of [-1, 1]) {
    const open = (side === -1 && z === -10) || (side === 1 && z === -16);
    const x = side * CW;
    // frame
    box(world, M.charcoalDeep, 0.16, 2.2, 0.06, x, 0, z - 0.5);
    box(world, M.charcoalDeep, 0.16, 2.2, 0.06, x, 0, z + 0.5);
    box(world, M.charcoalDeep, 0.16, 0.06, 1.06, x, 2.15, z);
    if (open) {
      const leaf = box(world, M.woodLight, 0.92, 2.12, 0.045, x + side * 0.46, 0, z - 0.47 + 0.02, 0);
      leaf.rotation.y = side * 0.12;
    } else {
      box(world, M.woodLight, 0.045, 2.12, 0.92, x - side * 0.02, 0, z);
      box(world, M.bronze, 0.05, 0.03, 0.16, x - side * 0.06, 1.02, z + 0.3);
    }
    box(world, doorPlate, 0.02, 0.12, 0.22, x - side * 0.07, 1.6, z + 0.62);
  }
  for (let z = -8; z > -34; z -= 3.2) box(world, glowMat(C.glow, 2), 0.5, 0.02, 0.5, 0, CH - 0.02, z);
  anchor(0, 2.6, -11, C.glow, 6, 7);
  anchor(0, 2.6, -18, C.glow, 6, 7);
  anchor(0, 2.6, -26, C.glow, 6, 7);
  anchor(0, 2.6, -32, C.glow, 6, 7);

  // =============================================================================
  // ROOMS (generic template). Local space: door wall at x = 0, room extends +x.
  // =============================================================================
  function makeRoom({ position, rotationY, W = 4.2, D = 3.6, H = 2.9, throwMat, accent, bedSide = -1, windowW = 1.4, light = C.glow, daylight = C.daylight, daylightIntensity = 2.2 }) {
    const g = new THREE.Group();
    g.position.copy(position);
    g.rotation.y = rotationY;
    world.add(g);

    floor(g, null, tex.plank, 0, W, -D / 2, D / 2, 0.003, 1.4);
    ceiling(g, 0, W, -D / 2, D / 2, H);
    wall(g, M.plaster, "x", -D / 2, 0, W, H);
    wall(g, M.plaster, "x", D / 2, 0, W, H);
    wall(g, M.plaster, "z", W, -D / 2, D / 2, H, [{ c: 0.3, w: windowW, h: 1.35, sill: 0.85 }]);
    // window: glowing pane + frame + sill
    box(g, glowMat(daylight, daylightIntensity), 0.02, 1.35, windowW, W + 0.04, 0.85, 0.3);
    box(g, M.charcoalDeep, 0.06, 0.05, windowW, W - 0.02, 1.5, 0.3);
    box(g, M.charcoalDeep, 0.06, 1.35, 0.05, W - 0.02, 0.85, 0.3);
    box(g, M.woodLight, 0.22, 0.04, windowW + 0.1, W - 0.1, 0.83, 0.3);
    if (accent) box(g, accent, 2.3, 1.25, 0.03, W - 1.1, 0.85, bedSide * (D / 2 - 0.07)); // accent panel behind the bed

    // Bed against a side wall, head toward the window wall
    const bz = bedSide * (D / 2 - 0.55);
    box(g, M.wood, 2.05, 0.32, 1.05, W - 1.1, 0, bz);
    box(g, M.linen, 1.95, 0.18, 0.98, W - 1.12, 0.32, bz);
    box(g, throwMat, 0.75, 0.04, 1.02, W - 1.75, 0.5, bz);
    box(g, M.linen, 0.38, 0.14, 0.62, W - 0.32, 0.5, bz);
    box(g, M.wood, 0.06, 0.95, 1.1, W - 0.05, 0, bz);
    // Desk + chair + lamp on the other side
    const dz = -bedSide * (D / 2 - 0.32);
    box(g, M.woodLight, 1.2, 0.04, 0.55, W - 1.35, 0.72, dz);
    for (const ox of [-0.56, 0.56]) box(g, M.charcoalDeep, 0.04, 0.72, 0.5, W - 1.35 + ox, 0, dz);
    box(g, M.charcoal, 0.45, 0.06, 0.45, W - 1.35, 0.45, dz + bedSide * 0.45);
    box(g, M.charcoal, 0.45, 0.5, 0.05, W - 1.35, 0.5, dz + bedSide * 0.68);
    box(g, glowMat(C.glow, 3), 0.12, 0.08, 0.12, W - 0.95, 0.95, dz);
    box(g, M.bronze, 0.02, 0.2, 0.02, W - 0.95, 0.76, dz);
    // Wardrobe near door
    box(g, M.woodLight, 1.0, 2.1, 0.6, 0.85, 0, -bedSide * (D / 2 - 0.32));
    box(g, M.bronze, 0.02, 0.5, 0.02, 0.85, 0.85, -bedSide * (D / 2 - 0.62));
    // Rug & ceiling light
    box(g, M.plasterWarm, 1.6, 0.01, 1.1, W / 2 + 0.2, 0.004, 0);
    box(g, glowMat(light, 2.2), 0.6, 0.02, 0.6, W / 2, H - 0.02, 0);

    g.updateMatrixWorld(true);
    const w = (x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z));
    const c = w(W / 2, 2.4, 0);
    anchor(c.x, c.y, c.z, light, 7, 7);
    const win = w(W - 0.4, 1.6, 0.3);
    anchor(win.x, win.y, win.z, daylight, 5, 5);
    return { group: g, w };
  }

  const room1 = makeRoom({ position: new THREE.Vector3(-CW, 0, -10), rotationY: Math.PI, throwMat: M.throwA, bedSide: 1 });
  const room2 = makeRoom({ position: new THREE.Vector3(CW, 0, -16), rotationY: 0, throwMat: M.throwB, bedSide: -1, accent: std(0xcbb9a2, 0.9) });

  // =============================================================================
  // SHARED HALL (kitchen/dining placeholder) — z -34 → -46, x ±5
  // =============================================================================
  const HH = 3.1;
  floor(world, null, tex.stone, -5, 5, -34, -46, 0.002, 1.2);
  ceiling(world, -5, 5, -34, -46, HH);
  wall(world, M.plaster, "x", -34, -5, 5, HH, [{ c: 0, w: 2.2, h: 2.9 }]);
  wall(world, M.plaster, "z", -5, -34, -46, HH, [{ c: -40, w: 1.0, h: 2.15 }]);
  wall(world, M.plaster, "z", 5, -34, -46, HH, [{ c: -38, w: 1.6, h: 1.5, sill: 0.9 }, { c: -42.5, w: 1.6, h: 1.5, sill: 0.9 }]);
  wall(world, M.plasterWarm, "x", -46, -5, 5, HH);
  for (const z of [-38, -42.5]) box(world, glowMat(C.daylight, 1.3), 0.02, 1.5, 1.6, 5.05, 0.9, z);
  // Kitchen counter run
  box(world, M.charcoal, 6.4, 0.88, 0.62, 0, 0, -45.6);
  box(world, M.plasterWarm, 6.5, 0.05, 0.66, 0, 0.88, -45.6);
  box(world, M.bronze, 6.4, 0.6, 0.02, 0, 0.93, -45.93);
  box(world, M.woodLight, 6.4, 0.7, 0.36, 0, 1.75, -45.78);
  box(world, glowMat(C.glow, 2.4), 6.2, 0.02, 0.2, 0, 1.74, -45.75);
  // Dining table + chairs
  box(world, M.woodLight, 2.4, 0.05, 1.0, 0, 0.74, -40.6);
  for (const ox of [-1.1, 1.1]) for (const oz of [-0.42, 0.42]) box(world, M.charcoalDeep, 0.05, 0.74, 0.05, ox, 0, -40.6 + oz);
  for (const ox of [-0.8, 0, 0.8]) for (const s of [-1, 1]) {
    box(world, M.charcoal, 0.42, 0.05, 0.42, ox, 0.45, -40.6 + s * 0.78);
    box(world, M.charcoal, 0.42, 0.45, 0.04, ox, 0.5, -40.6 + s * 0.98);
  }
  // Pendants
  for (const ox of [-0.8, 0, 0.8]) {
    box(world, M.charcoalDeep, 0.01, 1.0, 0.01, ox, HH - 1.0, -40.6);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.22, 20, 1, true), M.bronze);
    shade.position.set(ox, HH - 1.1, -40.6);
    world.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), glowMat(C.glow, 4));
    bulb.position.set(ox, HH - 1.18, -40.6);
    world.add(bulb);
  }
  anchor(0, 1.9, -40.6, C.glow, 16, 9);
  anchor(0, 2.6, -44.5, C.glow, 10, 7);
  anchor(3.5, 2.4, -38, C.daylight, 4, 6);

  // =============================================================================
  // FINAL ROOM — off the hall's left wall (x = -5, z = -40), larger window, sunset
  // =============================================================================
  const finalRoom = makeRoom({ position: new THREE.Vector3(-5, 0, -40), rotationY: Math.PI, W: 3.7, D: 3.8, throwMat: M.throwC, bedSide: -1, windowW: 2.2, daylight: C.sunset, daylightIntensity: 3.2 });

  // ---- Light pool (constant count → no shader recompiles) ----------------------
  scene.add(new THREE.HemisphereLight(0x6f7486, 0x3a2c22, 0.95));
  const moon = new THREE.DirectionalLight(0x9aa7c4, 0.35);
  moon.position.set(-12, 20, 18);
  scene.add(moon);
  const pool = Array.from({ length: mobile ? 4 : 5 }, () => {
    const l = new THREE.PointLight(0xffffff, 0, 8, 2);
    scene.add(l);
    return l;
  });

  // =============================================================================
  // CAMERA PATHS — one curve per chapter; consecutive chapters share endpoints
  // unless a scene has `cutAfter` (then the overlay dips to black between them).
  // =============================================================================
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const r1 = room1.w, r2 = room2.w, fr = finalRoom.w;
  const SHOTS = {
    exterior: { pos: [v(0, 1.85, 27), v(0, 1.78, 18), v(0, 1.72, 11)], look: [v(0, 3.4, 0), v(0, 2.8, 0), v(0, 2.1, -2)] },
    entry: { pos: [v(0, 1.72, 11), v(0, 1.7, 5), v(0, 1.66, 0.6), v(0.15, 1.65, -3)], look: [v(0, 2.1, -2), v(0, 1.85, -6), v(0.2, 1.65, -9), v(0, 1.6, -12)] },
    corridor: { pos: [v(0.15, 1.65, -3), v(0.05, 1.65, -6.6), v(0.15, 1.65, -8.7)], look: [v(0, 1.6, -12), v(-0.2, 1.55, -14.5), v(-1.6, 1.5, -10.4)] },
    "room-1": { pos: [v(0.15, 1.65, -8.7), v(-0.45, 1.64, -9.75), r1(0.9, 1.62, 0.25), r1(1.9, 1.6, 0.55)], look: [v(-1.6, 1.5, -10.4), r1(1.6, 1.42, 0), r1(4.2, 1.4, -0.5), r1(4.2, 1.15, -1.25)] },
    "room-2": { pos: [v(-0.3, 1.65, -13.2), v(0.3, 1.64, -15.2), r2(0.9, 1.62, -0.25), r2(2.0, 1.6, 0.35)], look: [v(0.7, 1.55, -17), r2(0.6, 1.5, 0), r2(4.2, 1.4, 0.4), r2(4.2, 1.15, -1.25)] },
    shared: { pos: [v(0, 1.66, -27), v(0, 1.66, -32.6), v(0.8, 1.72, -36.4), v(1.6, 1.74, -38.4)], look: [v(0, 1.6, -38), v(0, 1.35, -42), v(-0.4, 1.15, -42.5), v(-2.8, 1.3, -40.8)] },
    "final-room": { pos: [v(1.6, 1.74, -38.4), v(-2.4, 1.68, -39.5), v(-4.9, 1.63, -40), fr(1.0, 1.6, 0.15), fr(1.6, 1.58, 0.25)], look: [v(-2.8, 1.3, -40.8), v(-5.2, 1.5, -40), fr(1.5, 1.5, 0), fr(3.7, 1.45, 0.2), fr(3.7, 1.4, 0.3)] },
    enquire: { pos: [fr(1.6, 1.58, 0.25), fr(1.85, 1.57, 0.27)], look: [fr(3.7, 1.4, 0.3), fr(3.9, 1.45, 0.3)] },
  };
  const curves = {};
  for (const [id, s] of Object.entries(SHOTS)) {
    curves[id] = {
      pos: s.pos.length > 1 ? new THREE.CatmullRomCurve3(s.pos, false, "centripetal") : null,
      look: s.look.length > 1 ? new THREE.CatmullRomCurve3(s.look, false, "centripetal") : null,
    };
  }

  // ---- Sizing --------------------------------------------------------------------
  function resize() {
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep a similar horizontal field of view on tall phones.
    camera.fov = w / h < 0.8 ? 72 : mobile ? 62 : 54;
    camera.updateProjectionMatrix();
    needsRender = true;
  }
  const ro = new ResizeObserver(() => { resize(); api.setProgress(lastP, lastPointer); });
  ro.observe(container);

  // ---- Frame ---------------------------------------------------------------------
  const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let needsRender = true, lastP = -1, lastPointer = { x: 0, y: 0 };

  function place(p, pointer) {
    const i = sceneIndexAt(p, scenes);
    const s = scenes[i];
    const curve = curves[s.id] || curves.exterior;
    const t = softEase(localProgress(p, s));
    curve.pos.getPointAt(t, tmpPos);
    curve.look.getPointAt(t, tmpLook);
    // Subtle pointer parallax: shift the look target sideways/up.
    right.subVectors(tmpLook, tmpPos).cross(up).normalize();
    tmpLook.addScaledVector(right, pointer.x * 0.28).addScaledVector(up, -pointer.y * 0.16);
    camera.position.copy(tmpPos);
    camera.lookAt(tmpLook);

    // Final chapter: exposure lifts toward the window light.
    const exposure = s.id === "enquire" ? 1.05 + 0.8 * smoothstep(localProgress(p, s)) : 1.05;
    renderer.toneMappingExposure = exposure;
    scene.fog.far = s.id === "exterior" || s.id === "entry" ? 58 : 28;
    scene.fog.near = s.id === "exterior" || s.id === "entry" ? 14 : 6;

    // Assign the light pool to the nearest anchors.
    const sorted = lightAnchors
      .map((a) => ({ a, d: a.pos.distanceToSquared(tmpPos) }))
      .sort((x, y) => x.d - y.d);
    pool.forEach((l, k) => {
      const e = sorted[k];
      if (!e) { l.intensity = 0; return; }
      l.position.copy(e.a.pos);
      l.color.copy(e.a.color);
      l.distance = e.a.distance;
      // Fade lights near the edge of their range to hide pool swaps.
      const dist = Math.sqrt(e.d);
      l.intensity = e.a.intensity * clamp(1.4 - dist / (e.a.distance * 1.4));
    });
  }

  const api = {
    animating: false,
    setProgress(p, pointer = { x: 0, y: 0 }) {
      if (p === lastP && pointer.x === lastPointer.x && pointer.y === lastPointer.y && !needsRender) return;
      lastP = p;
      lastPointer = { ...pointer };
      place(p, pointer);
      renderer.render(scene, camera);
      needsRender = false;
    },
    destroy() {
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    },
  };

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onLost?.(); }, { once: true });

  container.appendChild(canvas);
  resize();
  api.setProgress(0);
  // Compile shaders up front so the first scroll doesn't hitch.
  renderer.compile(scene, camera);
  return api;
}

// ---- Material & texture helpers ----------------------------------------------------
function std(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function gradientTexture(stops) {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach((s, i) => grd.addColorStop(i / (stops.length - 1), s));
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noise(g, size, amount) {
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

function tileTexture({ base, grout, tiles, noise: amount }) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  noise(g, size, amount);
  g.strokeStyle = grout;
  g.lineWidth = 2;
  const step = size / tiles;
  for (let i = 0; i <= tiles; i++) {
    g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, size); g.stroke();
    g.beginPath(); g.moveTo(0, i * step); g.lineTo(size, i * step); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function plankTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const tones = ["#7a5a40", "#86644a", "#6f523b", "#8d6b4f", "#7f5f45"];
  const rows = 6, h = size / rows;
  for (let r = 0; r < rows; r++) {
    let x = -((r * 53) % 120);
    while (x < size) {
      const w = 110 + ((r * 37 + x) % 60);
      g.fillStyle = tones[(r + Math.abs(x)) % tones.length];
      g.fillRect(x, r * h, w, h);
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(x, r * h, 1.5, h);
      x += w;
    }
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(0, r * h, size, 1.5);
  }
  noise(g, size, 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

let _sign;
function signTexture() {
  if (_sign) return _sign;
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 188;
  const g = c.getContext("2d");
  g.fillStyle = "#1b1a19";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#a9825a";
  g.lineWidth = 4;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);
  g.fillStyle = "#e7c9a0";
  g.font = "600 104px 'Cormorant Garamond', Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("TRIKHA PG", c.width / 2, c.height / 2 + 6);
  _sign = new THREE.CanvasTexture(c);
  _sign.colorSpace = THREE.SRGBColorSpace;
  return _sign;
}
