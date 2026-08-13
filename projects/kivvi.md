# kivvi — The ERP That Knows Things Have a History

**Status:** Active Development (Live, in production at RevampIT)
**Tagline:** "The operating system for the circular economy"
**URL:** [kivvi.orangecat.ch](https://kivvi.orangecat.ch) (production) · kivvi.ch = marketing domain, app.kivvi.ch referenced in email templates
**Codebase:** `/home/g/dev/kivvi/` (pnpm + turbo monorepo; app = `apps/web`)

---

## Executive Summary

AI-first, Swiss-native ERP for refurbishers, Brockenhäuser, repair workshops, and vintage shops. Generic ERPs assume buy-new/sell-new; kivvi models the reality of second-life goods: intake ≠ purchasing, every item has a condition, products flow backwards, testing/repair is operations, pricing is flexible, inventory is mixed bulk+serialized, and impact is a first-class metric.

**Proof:** used in production by revamp-it (Zürich) and partner shops. Kivvi replaces Kivitendo as RevampIT's ERP companion — ledger, VAT, QR-bill invoices, banking, dunning — with 10 years of real financials imported (`kivitendo-export/`). Integration with evig is bidirectional and live (REST API + signed webhooks). Boundary: evig keeps marketplace/checkout/CMS; kivvi owns the books.

---

## What's Built

- Unified document flow: quote → order → delivery note → invoice → credit note → dunning
- Swiss compliance: 227-account KMU Kontenrahmen, QR-bills, VAT 8.1/2.6/0%, CAMT.053/054 bank import with QR-reference payment matching
- Inventory with condition tracking, intake pipeline, impact accounting
- AI tool registry (Anthropic/OpenAI/OpenRouter/Ollama); self-hosted AI path via Ollama for zero data egress

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + Server Actions + RSC, TypeScript strict |
| Monorepo | pnpm + turbo: apps/web · packages/database (Drizzle SSOT) · packages/core (domain, one tx per business op) · packages/ai |
| Money | decimal.js, Rappen rounding to 0.05 at line-item level |
| Auth | NextAuth v5 credentials/JWT |
| i18n | de-CH / en / fr |
| Testing | 880+ tests in CI |
| Deployment | Self-hosted Hetzner (systemd + Caddy); Vercel decommissioned 2026-07 |

---

## Business Model — fullest billing stack in the fleet

- **Stripe integrated:** webhook handling 4 events (checkout completed, subscription updated/deleted, payment failed), checkout via `STRIPE_PRICE_ID` (single plan), billing settings UI, `plan: free | premium` on company settings, hardcoded 30-day trial (`isPlanActive()`, tested)
- **Public pricing page** (3 tiers): Open Source — free forever, self-hosted, MIT · **Cloud — CHF 49/month**, hosted by revamp-it, data in Switzerland, 30-day trial no card (caveat: subtitled "Managed · Coming soon" in en.json — commercial availability unconfirmed) · Enterprise/On-Premise — price on request
- Revenue to date: unknown from repo; no MRR record found

---

## Distribution

**What exists today:** landing + pricing pages, `sitemap.ts`, `robots.ts`, 2 OG image routes (landing, pricing). Transactional email only (Brevo SMTP).

**Not yet — fleet distribution standard pending:** no blog, no RSS, no newsletter capture, no social queue, no GTM doc in-repo. Distribution today is entirely GitHub / word-of-mouth / the RevampIT relationship.

---

## Go-to-market

- **ICP (explicit in `PRODUCT.md`, 3 personas):** (1) computer refurbishers — revamp-it, Büro Mühle, TechInTheBox: ~20-person nonprofits on Kivitendo with unreliable stock counts; (2) Brockenhaus/charity shops — Brocki Zürich, Caritas, Heilsarmee, Emmaus: high volume, gut-feel pricing, need volunteer-friendly UI + impact reporting; (3) vintage/specialty resellers needing per-item provenance and condition-based pricing.
- **Positioning one-liner:** the ERP that knows things have a history.
- **Shortest first-paying-customer path (fleet GTM rank #2):** RevampIT (or the evig Verein) pays a real subscription — even internal, it exercises the whole billing path and creates the first MRR record. Then: Zürich second-hand/repair shops as outbound ICP (20–25 shops, research-only mode first, human-approved sends).
- **Monetization state:** billing path fully coded and priced (CHF 49/mo Cloud); needs the Stripe price live and one real subscriber.
- **Key metrics to move:** first MRR record · active companies on Cloud · trial→paid conversion · Kivitendo-migration completeness for RevampIT.

---

## Risks / Next Steps

- Cloud tier's "Coming soon" subtitle contradicts the working Stripe checkout — resolve commercial availability, then flip the first real subscription on (RevampIT/evig)
- Single `STRIPE_PRICE_ID` — no price catalog, per-seat, or usage metering yet
- Roadmap "Next" items are all product (Ricardo/Tutti shop-front, warehouse mobile app, AI autopilot); no GTM/distribution doc exists in-repo
- Kivitendo history import must complete cleanly for RevampIT's auditability promise to hold
