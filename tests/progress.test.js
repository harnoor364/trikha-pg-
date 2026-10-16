import { test } from "node:test";
import assert from "node:assert/strict";
import { sceneIndexAt, localProgress, cutOpacity, captionOpacity, scrollOffsetForScene, validateScenes, softEase } from "../js/lib/progress.js";
import { SCENES } from "../js/scenes.js";

test("scene config covers 0..1 contiguously", () => {
  assert.deepEqual(validateScenes(SCENES), []);
  assert.equal(SCENES.length, 8);
});

test("sceneIndexAt maps progress to the right chapter", () => {
  assert.equal(sceneIndexAt(0, SCENES), 0);
  assert.equal(sceneIndexAt(0.1399, SCENES), 0);
  assert.equal(sceneIndexAt(0.14, SCENES), 1);
  assert.equal(sceneIndexAt(0.999, SCENES), 7);
  assert.equal(sceneIndexAt(1, SCENES), 7);
  assert.equal(sceneIndexAt(-5, SCENES), 0);
  assert.equal(sceneIndexAt(5, SCENES), 7);
});

test("localProgress is 0..1 inside a scene", () => {
  const s = { start: 0.2, end: 0.4 };
  assert.equal(localProgress(0.2, s), 0);
  assert.ok(Math.abs(localProgress(0.3, s) - 0.5) < 1e-9);
  assert.equal(localProgress(0.5, s), 1);
});

test("cutOpacity dips to black only around cut boundaries", () => {
  const room1 = SCENES.find((s) => s.id === "room-1");
  assert.equal(room1.cutAfter, true);
  assert.ok(cutOpacity(room1.end - 1e-6, SCENES) > 0.99, "fully black just before the cut");
  assert.ok(cutOpacity(room1.end + 1e-6, SCENES) > 0.99, "still black just after the cut");
  const mid = (room1.start + room1.end) / 2;
  assert.equal(cutOpacity(mid, SCENES), 0);
  const corridor = SCENES.find((s) => s.id === "corridor");
  assert.equal(cutOpacity(corridor.end - 1e-6, SCENES), 0, "continuous move, no dip");
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
