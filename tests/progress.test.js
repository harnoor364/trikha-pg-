import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { sceneIndexAt, localProgress, cutOpacity, captionOpacity, scrollOffsetForScene, validateScenes, softEase, shotAt } from "../js/lib/progress.js";
import { SCENES } from "../js/scenes.js";

test("scene config covers 0..1 contiguously", () => {
  assert.deepEqual(validateScenes(SCENES), []);
  assert.equal(SCENES.length, 9);
  assert.deepEqual(SCENES.map((s) => s.chapter), ["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
});

test("sceneIndexAt maps progress to the right chapter", () => {
  assert.equal(sceneIndexAt(0, SCENES), 0);
  assert.equal(sceneIndexAt(SCENES[1].start - 1e-6, SCENES), 0);
  assert.equal(sceneIndexAt(SCENES[1].start, SCENES), 1);
  assert.equal(sceneIndexAt(0.999, SCENES), 8);
  assert.equal(sceneIndexAt(1, SCENES), 8);
  assert.equal(sceneIndexAt(-5, SCENES), 0);
  assert.equal(sceneIndexAt(5, SCENES), 8);
});

test("localProgress is 0..1 inside a scene", () => {
  const s = { start: 0.2, end: 0.4 };
  assert.equal(localProgress(0.2, s), 0);
  assert.ok(Math.abs(localProgress(0.3, s) - 0.5) < 1e-9);
  assert.equal(localProgress(0.5, s), 1);
});

test("cutOpacity dips to black only around cut boundaries", () => {
  const scenes = [{ id: "a", start: 0, end: 0.5, cutAfter: true }, { id: "b", start: 0.5, end: 1 }];
  assert.ok(cutOpacity(0.5 - 1e-6, scenes) > 0.99, "fully black just before the cut");
  assert.ok(cutOpacity(0.5 + 1e-6, scenes) > 0.99, "still black just after the cut");
  assert.equal(cutOpacity(0.25, scenes), 0);
  // The photo walkthrough moves continuously: no cuts.
  for (let p = 0; p <= 1; p += 0.01) assert.equal(cutOpacity(p, SCENES), 0);
});

test("every walkthrough photo exists and has alt text", () => {
  for (const s of SCENES) {
    assert.ok(s.shots.length >= 1, s.id);
    for (const sh of s.shots) {
      assert.ok(existsSync(new URL(`../${sh.src}`, import.meta.url)), `missing ${sh.src}`);
      if (s.id !== "enquire") assert.ok(sh.alt && sh.alt.length > 10, `alt text for ${sh.src}`);
    }
  }
});

test("shotAt steps through each photo of a chapter", () => {
  const rooms = SCENES.find((s) => s.id === "room-2");
  const n = rooms.shots.length;
  for (let k = 0; k < n; k++) {
    const p = rooms.start + ((rooms.end - rooms.start) * (k + 0.5)) / n;
    const r = shotAt(p, SCENES);
    assert.equal(SCENES[r.index].id, "room-2");
    assert.equal(r.shot, k);
    assert.equal(r.count, n);
    assert.ok(Math.abs(r.u - 0.5) < 1e-6);
  }
  assert.equal(shotAt(1, SCENES).shot, 0);
});

test("captionOpacity fades in and out", () => {
  assert.equal(captionOpacity(0), 0);
  assert.equal(captionOpacity(0.5), 1);
  assert.equal(captionOpacity(1), 0);
});

test("scrollOffsetForScene lands inside the target chapter", () => {
  const h = 10000;
  SCENES.forEach((s, i) => {
    const p = scrollOffsetForScene(i, SCENES, h) / h;
    assert.equal(sceneIndexAt(p, SCENES), i);
  });
});

test("softEase keeps endpoints and stays monotonic", () => {
  assert.equal(softEase(0), 0);
  assert.equal(softEase(1), 1);
  let prev = -1;
  for (let t = 0; t <= 1; t += 0.01) { const v = softEase(t); assert.ok(v >= prev); prev = v; }
});
