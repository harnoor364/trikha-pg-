// Pure helpers for contact links. Unit-tested in tests/contact.test.js.

const digits = (s) => String(s || "").replace(/\D/g, "");

/** A number is usable only when it is verified and looks like a full Indian/international number. */
export function isUsableNumber(n, verified) {
  const d = digits(n);
  return Boolean(verified) && d.length >= 11 && d.length <= 15;
}

export function telHref(phone) {
  if (!isUsableNumber(phone?.e164, phone?.verified)) return null;
  return `tel:+${digits(phone.e164)}`;
}

export function whatsappHref(whatsapp, message = "") {
  if (!isUsableNumber(whatsapp?.number, whatsapp?.verified)) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits(whatsapp.number)}${q}`;
}

export function enquiryMessage({ name, room, moveIn, occupancy, message } = {}, businessName = "TRIKHA PG") {
  const lines = [`Hello ${businessName}, I'd like to enquire about a room.`];
  if (name) lines.push(`Name: ${name}`);
  if (room) lines.push(`Room interest: ${room}`);
  if (occupancy) lines.push(`Preferred occupancy: ${occupancy}`);
  if (moveIn) lines.push(`Move-in date: ${moveIn}`);
  if (message) lines.push(`Message: ${message}`);
  return lines.join("\n");
}

export function mapsLinks(geo) {
  const ll = `${geo.lat},${geo.lng}`;
  return {
    listing: geo.mapsCid ? `https://maps.google.com/?cid=${geo.mapsCid}` : `https://www.google.com/maps/search/?api=1&query=${ll}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${ll}`,
    embed: `https://www.google.com/maps?q=${ll}&z=17&output=embed`,
  };
}
