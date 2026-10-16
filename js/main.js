import { CONFIG } from "./config.js";
import { SCENES } from "./scenes.js";
import { telHref, whatsappHref, enquiryMessage, mapsLinks } from "./lib/contact.js";
import { validateEnquiry } from "./lib/validate.js";
import { validateScenes } from "./lib/progress.js";
import { initWalkthrough } from "./walkthrough/controller.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const demo = CONFIG.demo.enabled;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.documentElement.classList.toggle("is-demo", demo);
if (reducedMotion) document.documentElement.classList.add("reduced-motion");

// ---------------------------------------------------------------- Demo banner
if (demo) {
  const b = $("[data-demo-banner]");
  b.hidden = false;
  $("[data-bind=demoText]", b).textContent = CONFIG.demo.bannerText;
  const setBannerH = () => document.documentElement.style.setProperty("--banner-h", `${b.offsetHeight}px`);
  setBannerH();
  addEventListener("resize", setBannerH);
}
if (!reducedMotion) document.documentElement.classList.add("js-intro");
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------------------------------------------------------------- Navigation
const header = $("[data-header]");
const toggle = $("[data-nav-toggle]");
const menu = $("[data-nav-menu]");
function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  menu.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  if (open) menu.querySelector("a")?.focus();
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
});
const onScrollHeader = () => header.classList.toggle("is-solid", scrollY > innerHeight * 0.6);
addEventListener("scroll", onScrollHeader, { passive: true });
onScrollHeader();

// ---------------------------------------------------------------- Toast
const toastEl = document.createElement("div");
toastEl.className = "toast";
toastEl.setAttribute("role", "status");
toastEl.setAttribute("aria-live", "polite");
document.body.appendChild(toastEl);
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 4200);
}

// ---------------------------------------------------------------- Contact links
const tel = telHref(CONFIG.contact.phone);
const waReady = Boolean(whatsappHref(CONFIG.contact.whatsapp));

function goToForm() {
  $("#contact").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  setTimeout(() => $("#f-name")?.focus({ preventScroll: true }), reducedMotion ? 0 : 700);
}

$$("[data-call-link]").forEach((a) => {
  if (tel) {
    a.href = tel;
    if (a.hasAttribute("data-call-text")) a.textContent = CONFIG.contact.phone.display || tel.replace("tel:", "");
  } else {
    a.removeAttribute("href");
    a.setAttribute("role", "link");
    a.setAttribute("aria-disabled", "true");
    a.tabIndex = 0;
    a.classList.add("is-pending");
    if (!a.hasAttribute("data-call-text")) a.title = "Phone number to be confirmed";
    const msg = () => { toast("The phone number is being confirmed. Please use the enquiry form for now."); goToForm(); };
    a.addEventListener("click", msg);
    a.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), msg()));
    if (!demo && !a.hasAttribute("data-call-text")) a.hidden = true;
  }
});

$$("[data-whatsapp-link]").forEach((a) => {
  const href = whatsappHref(CONFIG.contact.whatsapp, a.dataset.waMessage || "");
  if (href) {
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    if (a.hasAttribute("data-wa-text")) a.textContent = `+${CONFIG.contact.whatsapp.number.replace(/\D/g, "")}`;
    if (a.hasAttribute("data-wa-float")) a.hidden = false;
  } else {
    a.removeAttribute("href");
    a.setAttribute("role", "link");
    a.setAttribute("aria-disabled", "true");
    a.tabIndex = 0;
    a.classList.add("is-pending");
    const msg = () => { toast("The WhatsApp number is being confirmed. Please use the enquiry form for now."); goToForm(); };
    a.addEventListener("click", msg);
    a.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), msg()));
    if (a.hasAttribute("data-wa-float")) {
      a.hidden = !demo; // in preview, show a muted button so the owner sees where it goes
      a.setAttribute("aria-label", "WhatsApp enquiry (number to be confirmed)");
    } else if (!demo && !a.hasAttribute("data-wa-text")) a.hidden = true;
  }
});

const email = CONFIG.contact.email;
if (email.verified && email.value) {
  $("[data-email-row]").hidden = false;
  const a = $("[data-email]");
  a.href = `mailto:${email.value}`;
  a.textContent = email.value;
}
if (CONFIG.contact.visitingHours.verified && CONFIG.contact.visitingHours.value) {
  $("[data-hours-row]").hidden = false;
  $("[data-hours]").textContent = CONFIG.contact.visitingHours.value;
}

// ---------------------------------------------------------------- Address & map
const ad = CONFIG.address;
const fullAddress = [ad.line1, ad.locality, ad.city, `${ad.region}${ad.postalCode ? " " + ad.postalCode : ""}`].filter(Boolean).join(", ");
$$("[data-address], [data-address-short]").forEach((el) => (el.textContent = fullAddress));
if (ad.landmark.verified && ad.landmark.value) {
  const lm = $("[data-landmark]");
  lm.hidden = false;
  lm.textContent = `Landmark: ${ad.landmark.value}`;
}
const maps = mapsLinks(CONFIG.geo);
$$("[data-directions]").forEach((a) => (a.href = maps.directions));
$$("[data-maps-listing]").forEach((a) => (a.href = maps.listing));
$("[data-map-load]").addEventListener("click", () => {
  const frame = document.createElement("iframe");
  frame.src = maps.embed;
  frame.title = "Map showing TRIKHA PG, BRS Nagar, Ludhiana";
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer-when-downgrade";
  frame.allowFullscreen = true;
  $("[data-map]").replaceChildren(frame);
  frame.focus?.();
});

// ---------------------------------------------------------------- Trust (rating & reviews)
const rating = CONFIG.rating;
if (rating.verified && rating.value && rating.count) {
  const card = $("[data-rating]");
  card.hidden = false;
  card.href = maps.listing;
  $("[data-rating-value]").textContent = rating.value.toFixed(1);
  $("[data-rating-meta]").textContent = `Google rating · ${rating.count} reviews${rating.checkedOn ? ` (as of ${rating.checkedOn})` : ""}`;
  card.setAttribute("aria-label", `Rated ${rating.value} out of 5 on Google from ${rating.count} reviews. Opens Google Maps.`);
} else if (demo) {
  $("[data-rating-pending]").hidden = false;
}
const quotes = CONFIG.testimonials.filter((t) => t.permission && t.quote && t.name && t.source);
if (quotes.length) {
  const ul = $("[data-testimonials]");
  ul.hidden = false;
  ul.innerHTML = quotes.map((t) => `
    <li class="quote reveal">
      <blockquote><p>“${esc(t.quote)}”</p></blockquote>
      <p class="quote-by">${esc(t.name)} · ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.source)}</a>` : esc(t.source)}${t.date ? ` · ${esc(t.date)}` : ""}</p>
    </li>`).join("");
}

// ---------------------------------------------------------------- Rooms & facilities
const pending = (label = "To be confirmed") => `<span class="tag tag--pending">${label}</span>`;
async function loadRooms() {
  const grid = $("[data-rooms]");
  let data;
  try {
    const res = await fetch("data/rooms.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="muted">Room details couldn't be loaded. Please <a href="#contact">ask us directly</a>.</p>`;
    return;
  }
  const select = $("[data-room-select]");
  grid.innerHTML = data.rooms.map((r) => {
    const name = r.name.value || "Room";
    const fac = r.facilities.verified && r.facilities.value.length
      ? `<ul class="room-fac">${r.facilities.value.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
      : pending();
    const rent = r.rent.verified && r.rent.value ? `<strong>₹${esc(r.rent.value)}</strong> <span class="muted">${esc(r.rent.period)}</span>` : `<span>Rent on request</span> ${pending()}`;
    const avail = r.availability.verified && r.availability.value ? `<span class="avail">${esc(r.availability.value)}</span>` : `<span>Ask for availability</span>`;
    const img = r.images?.[0];
    return `
      <article class="room-card reveal">
        <div class="room-media">
          ${img ? `<img src="${esc(img)}" alt="${esc(name)}${r.placeholder ? " — placeholder image" : ""}" loading="lazy" width="1200" height="900">` : ""}
          ${r.placeholder ? `<span class="tag tag--overlay">Placeholder photo</span>` : ""}
        </div>
        <div class="room-body">
          <h3>${esc(name)} ${r.name.verified ? "" : pending("Placeholder")}</h3>
          <dl class="room-specs">
            <div><dt>Occupancy</dt><dd>${r.occupancy.verified && r.occupancy.value ? esc(r.occupancy.value) : pending()}</dd></div>
            <div><dt>Facilities</dt><dd>${fac}</dd></div>
            <div><dt>Rent</dt><dd>${rent}</dd></div>
            <div><dt>Availability</dt><dd>${avail}</dd></div>
          </dl>
          <a class="btn btn--dark btn--block" href="#contact" data-enquire data-room="${esc(name)}">Enquire about this room</a>
        </div>
      </article>`;
  }).join("");
  data.rooms.forEach((r) => select.add(new Option(r.name.value || r.id, r.name.value || r.id)));

  const items = data.facilities.items;
  const list = $("[data-facilities]");
  const shown = items.filter((f) => f.confirmed || demo);
  if (!items.some((f) => f.confirmed)) $("[data-fac-empty]").hidden = false;
  list.innerHTML = shown.map((f) => `
    <li class="fac-item${f.confirmed ? "" : " is-pending"}">
      <span class="fac-dot" aria-hidden="true"></span>
      <span>${esc(f.label)}</span>
      ${f.confirmed ? "" : pending("To confirm")}
    </li>`).join("");
  if (demo && shown.some((f) => !f.confirmed)) {
    $("[data-fac-lead]").textContent = "Preview: these are the facilities to confirm with the owner. Only confirmed items will appear on the live site.";
  }
  observeReveals();
}

// "Enquire" buttons can pre-select a room / topic.
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-enquire]");
  if (!a) return;
  if (a.dataset.room) $("[data-room-select]").value = a.dataset.room;
  if (a.dataset.enquireTopic) {
    const msg = $("#f-message");
    if (!msg.value) msg.value = `${a.dataset.enquireTopic}: `;
  }
});

// ---------------------------------------------------------------- Enquiry form
const form = $("[data-enquiry-form]");
const status = $("[data-form-status]");
const submitBtn = $("[data-submit]");
const waSend = $("[data-wa-send]");
if (waReady) waSend.hidden = false;

function formValues() {
  const fd = new FormData(form);
  return { ...Object.fromEntries(fd.entries()), consent: fd.get("consent") === "yes" };
}
function showErrors(errors) {
  $$("[data-error-for]", form).forEach((p) => {
    const k = p.dataset.errorFor;
    p.textContent = errors[k] || "";
    const input = form.elements[k];
    input?.setAttribute("aria-invalid", errors[k] ? "true" : "false");
  });
  const first = Object.keys(errors)[0];
  if (first) form.elements[first]?.focus();
}
function setStatus(kind, html) {
  status.hidden = false;
  status.className = `form-status form-status--${kind}`;
  status.innerHTML = html;
}
const altContact = () => {
  const bits = [];
  if (waReady) bits.push(`<a href="${whatsappHref(CONFIG.contact.whatsapp, enquiryMessage(formValues()))}" target="_blank" rel="noopener">WhatsApp us</a>`);
  if (tel) bits.push(`<a href="${tel}">call us</a>`);
  return bits.length ? ` You can also ${bits.join(" or ")}.` : "";
};

async function send(values) {
  const { provider, endpoint } = CONFIG.form;
  const local = ["localhost", "127.0.0.1", "0.0.0.0", ""].includes(location.hostname) || location.protocol === "file:";
  if (provider === "netlify") {
    if (local) throw new Error("Form submissions only work on the deployed Netlify site, not on a local preview.");
    const body = new URLSearchParams(new FormData(form)).toString();
    const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!res.ok) throw new Error(`The form service responded with ${res.status}.`);
    return;
  }
  const url = provider === "api" ? "/api/enquiry" : endpoint;
  if (!url) throw new Error("The enquiry form isn't connected to a service yet.");
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(values) });
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || (provider === "api" && !json?.ok)) throw new Error(json?.error || `The form service responded with ${res.status}.`);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.elements["bot-field"].value) return; // honeypot
  const { ok, errors, value } = validateEnquiry(formValues());
  showErrors(errors);
  if (!ok) return;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";
  status.hidden = true;
  try {
    await send(value);
    setStatus("ok", `<strong>Thank you, ${esc(value.name)}.</strong> Your enquiry has been sent. We'll contact you on ${esc(value.phone.replace(/^91/, "+91 "))}.`);
    form.reset();
  } catch (err) {
    setStatus("error", `<strong>Your enquiry was not sent.</strong> ${esc(err.message)}${altContact()}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send enquiry";
  }
});

waSend.addEventListener("click", () => {
  const href = whatsappHref(CONFIG.contact.whatsapp, enquiryMessage(formValues(), CONFIG.business.name));
  if (href) window.open(href, "_blank", "noopener");
});

// ---------------------------------------------------------------- Reveal on scroll
let revealObserver;
function observeReveals() {
  if (reducedMotion || !("IntersectionObserver" in window)) {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
    return;
  }
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealObserver.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal:not(.is-in)").forEach((el) => revealObserver.observe(el));
}

// ---------------------------------------------------------------- Walkthrough
const sceneProblems = validateScenes(SCENES);
if (sceneProblems.length) console.warn("[walkthrough] scene config:", sceneProblems);
try {
  initWalkthrough({ section: $("[data-walkthrough]"), config: CONFIG, scenes: SCENES, reducedMotion });
} catch (err) {
  console.error("[walkthrough] failed, showing static version", err);
  document.querySelector("[data-walkthrough]").classList.remove("wt--scroll");
}

observeReveals();
loadRooms();

// Recalculate scroll positions once fonts/images settle.
addEventListener("load", () => window.ScrollTrigger?.refresh());
