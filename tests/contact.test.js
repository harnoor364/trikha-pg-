import { test } from "node:test";
import assert from "node:assert/strict";
import { telHref, whatsappHref, enquiryMessage, mapsLinks, isUsableNumber } from "../js/lib/contact.js";
import { validateEnquiry, normalisePhone } from "../js/lib/validate.js";
import { CONFIG } from "../js/config.js";

test("unverified numbers never produce links", () => {
  assert.equal(telHref({ e164: "919876543210", verified: false }), null);
  assert.equal(whatsappHref({ number: "919876543210", verified: false }), null);
  assert.equal(whatsappHref({ number: "", verified: true }), null);
  assert.equal(isUsableNumber("98765", true), false);
});

test("verified numbers produce correct links", () => {
  assert.equal(telHref({ e164: "+91 98765 43210", verified: true }), "tel:+919876543210");
  assert.equal(whatsappHref({ number: "919876543210", verified: true }, "Hi there"), "https://wa.me/919876543210?text=Hi%20there");
});

test("shipped config keeps unconfirmed details switched off", () => {
  assert.equal(CONFIG.contact.phone.verified, false);
  assert.equal(CONFIG.contact.whatsapp.verified, false);
  assert.equal(CONFIG.rating.verified, false);
  assert.deepEqual(CONFIG.testimonials, []);
});

test("enquiryMessage includes provided fields only", () => {
  const m = enquiryMessage({ name: "Asha", room: "Room type A" });
  assert.match(m, /Name: Asha/);
  assert.match(m, /Room interest: Room type A/);
  assert.doesNotMatch(m, /Move-in/);
});

test("maps links use the listing pin", () => {
  const l = mapsLinks(CONFIG.geo);
  assert.match(l.directions, /destination=30\.8855232,75\.8156191/);
  assert.equal(l.listing, "https://maps.google.com/?cid=16447635875937687761");
});

test("phone normalisation", () => {
  assert.equal(normalisePhone("98765 43210"), "919876543210");
  assert.equal(normalisePhone("098765-43210"), "919876543210");
  assert.equal(normalisePhone("+91 98765 43210"), "919876543210");
});

test("validateEnquiry", () => {
  const bad = validateEnquiry({ name: "A", phone: "123", email: "x@", consent: false });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.name && bad.errors.phone && bad.errors.email && bad.errors.consent);
  const good = validateEnquiry({ name: "Asha", phone: "9876543210", email: "", moveIn: "2026-11-01", consent: true });
  assert.equal(good.ok, true);
  assert.equal(good.value.phone, "919876543210");
});
