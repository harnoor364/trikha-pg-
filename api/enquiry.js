// Vercel serverless function: POST /api/enquiry
// Used when js/config.js has form.provider = "api" (Vercel hosting).
//
// Secrets live in Vercel → Project → Settings → Environment Variables, never in frontend code.
// Configure ONE delivery method:
//   A) Email via Resend:  RESEND_API_KEY, ENQUIRY_TO_EMAIL, ENQUIRY_FROM_EMAIL (a verified sender)
//   B) Webhook:           ENQUIRY_WEBHOOK_URL (e.g. a Google Apps Script / Zapier / Make hook)
// If neither is configured the function answers 503 and the site tells the visitor
// the enquiry was NOT sent — it never pretends to succeed.

import { validateEnquiry } from "../js/lib/validate.js";

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20_000) throw new Error("too large");
  }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed." });
  }

  let input;
  try { input = await readBody(req); } catch { return json(res, 400, { ok: false, error: "Invalid request." }); }
  if (input["bot-field"]) return json(res, 200, { ok: true }); // honeypot: silently drop bots

  const { ok, errors, value } = validateEnquiry(input);
  if (!ok) return json(res, 422, { ok: false, error: Object.values(errors)[0], errors });

  const { RESEND_API_KEY, ENQUIRY_TO_EMAIL, ENQUIRY_FROM_EMAIL, ENQUIRY_WEBHOOK_URL } = process.env;
  const text = [
    "New enquiry from the TRIKHA PG website",
    "",
    `Name: ${value.name}`,
    `Phone: +${value.phone}`,
    value.email && `Email: ${value.email}`,
    value.room && `Room interest: ${value.room}`,
    value.occupancy && `Occupancy: ${value.occupancy}`,
    value.moveIn && `Move-in: ${value.moveIn}`,
    value.message && `\nMessage:\n${value.message}`,
  ].filter(Boolean).join("\n");

  try {
    if (RESEND_API_KEY && ENQUIRY_TO_EMAIL && ENQUIRY_FROM_EMAIL) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: ENQUIRY_FROM_EMAIL,
          to: ENQUIRY_TO_EMAIL.split(",").map((s) => s.trim()),
          reply_to: value.email || undefined,
          subject: `PG enquiry: ${value.name}${value.room ? ` (${value.room})` : ""}`,
          text,
        }),
      });
      if (!r.ok) throw new Error(`email service ${r.status}`);
      return json(res, 200, { ok: true });
    }
    if (ENQUIRY_WEBHOOK_URL) {
      const r = await fetch(ENQUIRY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...value, text, receivedAt: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
      return json(res, 200, { ok: true });
    }
    return json(res, 503, { ok: false, error: "The enquiry service isn't configured yet." });
  } catch (err) {
    console.error("[enquiry] delivery failed:", err.message);
    return json(res, 502, { ok: false, error: "We couldn't deliver your enquiry right now. Please try again shortly." });
  }
}
