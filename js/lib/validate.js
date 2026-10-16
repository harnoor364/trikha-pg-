// Enquiry validation, shared by the browser form and the /api/enquiry function.

export const FIELD_LIMITS = { name: 80, phone: 20, email: 120, room: 80, occupancy: 40, moveIn: 20, message: 1000 };

export function normalisePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`; // Indian mobile without country code
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

export function validateEnquiry(input = {}) {
  const v = {};
  for (const k of Object.keys(FIELD_LIMITS)) v[k] = String(input[k] ?? "").trim().slice(0, FIELD_LIMITS[k]);
  const errors = {};

  if (v.name.length < 2) errors.name = "Please enter your name.";
  const phone = normalisePhone(v.phone);
  if (phone.length < 11 || phone.length > 15) errors.phone = "Please enter a valid phone number.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errors.email = "Please check the email address.";
  if (v.moveIn && !/^\d{4}-\d{2}-\d{2}$/.test(v.moveIn)) errors.moveIn = "Please choose a valid date.";
  if (!input.consent) errors.consent = "Please allow us to contact you about this enquiry.";

  return { ok: Object.keys(errors).length === 0, errors, value: { ...v, phone } };
}
