# Plumber site generator

Generates a one-page plumber website (plus a privacy notice) from a JSON file. It's built for fast mockups: copy a client file, fill in their details from Google Maps, build, and send them the link.

No dependencies. Needs Node 18+.

```
node build.js                        # build every file in clients/
node build.js clients/smith.json     # build one client
```

Output goes to `dist/<slug>/` (`index.html`, `privacy.html`, `styles.css`). That folder is a complete static site: drop it on Netlify, Cloudflare Pages or GitHub Pages.

## Making a mockup (~20 min)

1. `cp clients/example.json clients/<slug>.json`
2. Fill in from their Google Business Profile: name, phone, email, areas, rating and review count, services they mention, and 3 real reviews (quote them word for word and keep the reviewer's first name only).
3. Leave `"mockup": true`. This shows a "Draft preview, not a live site" bar and blocks search engines from indexing it.
4. Photos: put images in `clients/<slug>/` (e.g. `clients/smith/hero.jpg`). They're copied into the build. Reference them as `"heroImage": "hero.jpg"` and in `gallery` as `{ "src": "job1.jpg", "caption": "Combi swap, Morecambe" }`. For a mockup, only use photos they've posted publicly, and only on the private preview link.
5. `node build.js clients/<slug>.json` and deploy `dist/<slug>/` to a preview URL.

## Going live after they pay

- Set `"mockup": false` and `siteUrl` to their domain.
- Set `formEndpoint` to a form service (Formspree, Basin, Netlify Forms). Without it, the form opens the visitor's email app, which works but loses some enquiries.
- Fill `companyNumber` if they're a limited company.
- Swap in their own photos and reviews they've approved.

## Field reference

| Field | Notes |
|---|---|
| `slug`, `name`, `town`, `phone`, `email` | Required |
| `gasSafeNumber` | **Only fill this with their real number** (check it at gassaferegister.co.uk). Displaying a Gas Safe claim that isn't true is a criminal offence for them. Leave it empty if they don't do gas work. |
| `insured`, `yearsTrading`, `accreditations` | Shown as trust badges. Only include what's true. |
| `rating` | `{ score, count, source, url }` from Google. Leave it out if they have few reviews. |
| `emergency`, `emergencyText` | Orange banner at the top |
| `services` | `[{ title, text, price? }]` |
| `reviews` | `[{ text, author, place?, source?, stars? }]` |
| `areas` | Towns and villages they cover. Also used for search engine data. |
| `faqs` | `[{ q, a }]` |
| `whatsapp` | Adds a WhatsApp button |
| `logo`, `heroImage`, `gallery` | Optional images |
| `colors` | `{ primary, accent }` to match their van and branding |

## Leads

`leads/lancaster-plumbers.csv` is the tracking sheet for the Google Maps check. For outreach, `limited_company` matters: UK law (PECR) allows unsolicited marketing emails to limited companies only. Contact sole traders by phone (check the TPS and CTPS do-not-call lists first), by post, or in person.
