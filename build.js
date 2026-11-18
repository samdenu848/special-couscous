#!/usr/bin/env node
// Builds a plumber website from a client JSON file.
// Usage: node build.js clients/example.json   -> dist/<slug>/
//        node build.js                        -> builds every file in clients/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const telHref = (p) => "tel:" + String(p).replace(/[^\d+]/g, "").replace(/^0/, "+44");
const waHref = (p) => "https://wa.me/" + String(p).replace(/[^\d]/g, "").replace(/^0/, "44");
const year = new Date().getFullYear();

const ICONS = {
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>',
  check: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
  star: '<path d="M12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7 2 9.3l5.4 4.7-1.6 7z"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
  clock: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7z"/>',
};
const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${ICONS[n]}</svg>`;

function validate(c, file) {
  const missing = ["slug", "name", "town", "phone", "email"].filter((k) => !c[k]);
  if (missing.length) throw new Error(`${file}: missing required field(s): ${missing.join(", ")}`);
  if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`${file}: slug must be lowercase letters, digits and hyphens`);
}

function page(c) {
  const services = c.services || [];
  const reviews = c.reviews || [];
  const areas = c.areas || [];
  const faqs = c.faqs || [];
  const gallery = c.gallery || [];
  const badges = [];
  if (c.gasSafeNumber) badges.push(`Gas Safe registered · No. ${esc(c.gasSafeNumber)}`);
  (c.accreditations || []).forEach((a) => badges.push(esc(a)));
  if (c.insured) badges.push("Fully insured");
  if (c.yearsTrading) badges.push(`${esc(c.yearsTrading)}+ years in ${esc(c.town)}`);

  const ratingLine = c.rating
    ? `<p class="rating">${icon("star", "i star")} <strong>${esc(c.rating.score)}</strong> from ${esc(c.rating.count)} ${esc(c.rating.source || "Google")} reviews</p>`
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    name: c.name,
    telephone: c.phone,
    email: c.email,
    areaServed: areas.length ? areas : [c.town],
    ...(c.siteUrl && { url: c.siteUrl }),
    ...(c.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: c.address.street,
        addressLocality: c.address.locality || c.town,
        postalCode: c.address.postcode,
        addressCountry: "GB",
      },
    }),
  };

  const formAttrs = c.formEndpoint
    ? `action="${esc(c.formEndpoint)}" method="POST"`
    : `data-mailto="${esc(c.email)}"`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.name)} | Plumber in ${esc(c.town)}</title>
<meta name="description" content="${esc(c.metaDescription || `${c.name}: plumbing, heating and boiler services across ${c.town}${areas.length ? " and " + areas.slice(1, 4).join(", ") : ""}. Call ${c.phone} for a free quote.`)}">
${c.mockup ? '<meta name="robots" content="noindex, nofollow">' : ""}
${c.siteUrl ? `<link rel="canonical" href="${esc(c.siteUrl)}">` : ""}
<meta name="theme-color" content="${esc(c.colors?.primary || "#0b4f6c")}">
<link rel="stylesheet" href="styles.css">
<style>:root{${c.colors?.primary ? `--primary:${esc(c.colors.primary)};` : ""}${c.colors?.accent ? `--accent:${esc(c.colors.accent)};` : ""}}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
${c.mockup ? `<div class="mockup-bar">Draft preview prepared for ${esc(c.name)}. Not a live site.</div>` : ""}
${c.emergency ? `<div class="emergency">${icon("clock")} ${esc(c.emergencyText || "Emergency call-outs available")} · <a href="${telHref(c.phone)}">${esc(c.phone)}</a></div>` : ""}
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="#">${c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" height="44">` : esc(c.name)}</a>
    <nav class="nav" aria-label="Main">
      ${services.length ? '<a href="#services">Services</a>' : ""}
      ${gallery.length ? '<a href="#work">Our work</a>' : ""}
      ${reviews.length ? '<a href="#reviews">Reviews</a>' : ""}
      <a href="#quote">Get a quote</a>
    </nav>
    <a class="btn btn-call" href="${telHref(c.phone)}" aria-label="Call ${esc(c.phone)}">${icon("phone")} <span>${esc(c.phone)}</span></a>
  </div>
</header>

<main>
<section class="hero"${c.heroImage ? ` style="--hero:url('${esc(c.heroImage)}')"` : ""}>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1>${esc(c.headline || `Trusted plumber in ${c.town}`)}</h1>
      <p class="lede">${esc(c.tagline || "Leaks, boilers, bathrooms and repairs. Clear prices, tidy work, and we turn up when we say.")}</p>
      ${ratingLine}
      <div class="cta-row">
        <a class="btn btn-accent btn-lg" href="${telHref(c.phone)}">${icon("phone")} Call ${esc(c.phone)}</a>
        <a class="btn btn-ghost btn-lg" href="#quote">Get a free quote</a>
        ${c.whatsapp ? `<a class="btn btn-ghost btn-lg" href="${waHref(c.whatsapp)}">WhatsApp us</a>` : ""}
      </div>
    </div>
  </div>
</section>

${badges.length ? `<section class="badges" aria-label="Credentials"><div class="wrap badges-in">${badges.map((b) => `<span class="badge">${icon("check")} ${b}</span>`).join("")}</div></section>` : ""}

${services.length ? `<section id="services" class="section">
  <div class="wrap">
    <h2>What we do</h2>
    <div class="grid">${services.map((s) => `<article class="card"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.price ? `<p class="price">${esc(s.price)}</p>` : ""}</article>`).join("")}</div>
  </div>
</section>` : ""}

${gallery.length ? `<section id="work" class="section alt">
  <div class="wrap">
    <h2>Recent jobs</h2>
    <div class="gallery">${gallery.map((g) => `<figure><img src="${esc(g.src)}" alt="${esc(g.alt || g.caption || "")}" loading="lazy">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("")}</div>
  </div>
</section>` : ""}

${reviews.length ? `<section id="reviews" class="section">
  <div class="wrap">
    <h2>What customers say</h2>
    ${ratingLine}
    <div class="grid">${reviews.map((r) => `<blockquote class="card review"><div class="stars">${icon("star", "i star").repeat(r.stars || 5)}</div><p>${esc(r.text)}</p><footer>${esc(r.author)}${r.place ? `, ${esc(r.place)}` : ""}${r.source ? ` · <span class="muted">${esc(r.source)}</span>` : ""}</footer></blockquote>`).join("")}</div>
    ${c.rating?.url ? `<p><a href="${esc(c.rating.url)}" rel="noopener">Read all reviews</a></p>` : ""}
  </div>
</section>` : ""}

<section id="quote" class="section alt">
  <div class="wrap quote">
    <div>
      <h2>Get a free quote</h2>
      <p>Tell us what's wrong or what you're planning. We usually reply ${esc(c.replyTime || "the same day")}.</p>
      <ul class="contact">
        <li>${icon("phone")} <a href="${telHref(c.phone)}">${esc(c.phone)}</a></li>
        <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
        ${c.hours ? `<li>${icon("clock")} ${esc(c.hours)}</li>` : ""}
      </ul>
      ${areas.length ? `<h3>Areas we cover</h3><ul class="areas">${areas.map((a) => `<li>${icon("pin")} ${esc(a)}</li>`).join("")}</ul>` : ""}
    </div>
    <form class="form" ${formAttrs}>
      <label>Name <input name="name" required autocomplete="name"></label>
      <label>Phone <input name="phone" type="tel" required autocomplete="tel"></label>
      <label>Postcode <input name="postcode" autocomplete="postal-code"></label>
      <label>What do you need?
        <select name="job">${(services.length ? services.map((s) => s.title) : ["Repair", "Boiler", "Bathroom", "Other"]).map((t) => `<option>${esc(t)}</option>`).join("")}<option>Something else</option></select>
      </label>
      <label>Details <textarea name="message" rows="4"></textarea></label>
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-accent btn-lg" type="submit">Send enquiry</button>
      <p class="small muted">We only use your details to reply to this enquiry. See our <a href="privacy.html">privacy notice</a>.</p>
    </form>
  </div>
</section>

${faqs.length ? `<section class="section">
  <div class="wrap narrow">
    <h2>Common questions</h2>
    ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
  </div>
</section>` : ""}
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <div><strong>${esc(c.name)}</strong><br>${c.address ? `${esc(c.address.street)}, ${esc(c.address.locality || c.town)} ${esc(c.address.postcode)}<br>` : ""}${esc(c.phone)} · ${esc(c.email)}</div>
    <div class="small">${c.companyNumber ? `Registered in England &amp; Wales No. ${esc(c.companyNumber)}<br>` : ""}${c.gasSafeNumber ? `Gas Safe No. ${esc(c.gasSafeNumber)}<br>` : ""}<a href="privacy.html">Privacy notice</a> · © ${year} ${esc(c.name)}</div>
  </div>
</footer>

<div class="callbar"><a class="btn btn-accent" href="${telHref(c.phone)}">${icon("phone")} Call now</a><a class="btn btn-primary" href="#quote">Free quote</a></div>

<script>
(function(){
  var f=document.querySelector("form[data-mailto]"); if(!f) return;
  f.addEventListener("submit",function(e){
    e.preventDefault(); var d=new FormData(f); if(d.get("_gotcha")) return;
    var body=["Name: "+d.get("name"),"Phone: "+d.get("phone"),"Postcode: "+d.get("postcode"),"Job: "+d.get("job"),"",d.get("message")].join("\\n");
    location.href="mailto:"+f.dataset.mailto+"?subject="+encodeURIComponent("Quote request: "+d.get("job"))+"&body="+encodeURIComponent(body);
  });
})();
</script>
</body>
</html>
`;
}

function privacy(c) {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy notice | ${esc(c.name)}</title>${c.mockup ? '<meta name="robots" content="noindex, nofollow">' : ""}
<link rel="stylesheet" href="styles.css"></head>
<body><main class="section"><div class="wrap narrow">
<h1>Privacy notice</h1>
<p><strong>${esc(c.name)}</strong> (${esc(c.email)}, ${esc(c.phone)}) is responsible for the personal data collected through this website.</p>
<h2>What we collect</h2><p>When you send an enquiry we receive the name, phone number, postcode and details you enter.</p>
<h2>Why</h2><p>Only to reply to your enquiry and, if you go ahead, to carry out and invoice the work. Our lawful basis is taking steps at your request before entering into a contract, and our legitimate interest in responding to enquiries.</p>
<h2>How long</h2><p>Enquiries that do not lead to work are deleted within 12 months. Records of completed work are kept for 6 years for tax and warranty purposes.</p>
<h2>Sharing</h2><p>We do not sell your data. ${c.formEndpoint ? "Enquiries are delivered to us through a form-handling service that processes them on our behalf." : "Enquiries are sent from your own email app to our inbox."}</p>
<h2>Cookies</h2><p>This site does not set tracking cookies.</p>
<h2>Your rights</h2><p>You can ask to see, correct or delete your data by contacting us. You can also complain to the Information Commissioner's Office (ico.org.uk).</p>
<p><a href="index.html">Back to home</a></p>
</div></main></body></html>
`;
}

function build(file) {
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  validate(c, file);
  const out = path.join(ROOT, "dist", c.slug);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), page(c));
  fs.writeFileSync(path.join(out, "privacy.html"), privacy(c));
  fs.copyFileSync(path.join(ROOT, "template", "styles.css"), path.join(out, "styles.css"));
  const assets = path.join(path.dirname(file), c.slug);
  if (fs.existsSync(assets)) fs.cpSync(assets, out, { recursive: true });
  console.log(`built ${path.relative(ROOT, out)}/`);
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : fs.readdirSync(path.join(ROOT, "clients")).filter((f) => f.endsWith(".json")).map((f) => path.join(ROOT, "clients", f));
files.forEach(build);
