# evig — Affordable Intelligence, Circular Tech

**Status:** Active Development (Live) — rebranded from Revamp-IT 2026-07-24; gemeinnütziger Verein in Gründung
**Tagline:** "Intelligenz, für alle bezahlbar" (affordable intelligence)
**URL:** production serves at [revampit.orangecat.ch](https://revampit.orangecat.ch) (per repo CLAUDE.md); README/social drafts reference evig.orangecat.ch — infra cutover pending. Legacy www.revamp-it.ch = old Joomla site, not this app.
**Codebase:** `/home/g/dev/evig/` — **alias note:** `/home/g/dev/revampit/` is an identical older clone of the same codebase (same package name, same HEAD); evig is canonical. ONE brief covers both.

---

## Executive Summary

evig is the canonical circular-tech platform: curated, durable second-life hardware plus digital access at a fair price. The story is broader than refurb — "inequality of access to intelligence" (AI + compute) is the why; circular economy is the how. Seven surfaces in one app: Storefront, P2P Marketplace, IT-Hilfe (volunteer tech help), Workshops/Repair Café, Erfassung (AI intake pipeline), Member services (directory, donations, voting), and HIRN AI (staff assistant).

RevampIT the organization is the physical engine: its refurb inventory flows into the marketplace as `is_revampit` listings; P2P community listings share the same checkout. evig is also a **live client of kivvi** (ERP integration: product sync, signed webhooks).

---

## What's Built

- 8 locales (de/fr/en/it/es/ja/ko/ru); 15 blog posts with translations, JSON-LD, hreflang
- Marketplace with escrow-capable checkout; workshops with paid registration; membership (`/mitglied-werden`)
- AI intake pipeline (Erfassung); HIRN AI cascade Groq → OpenRouter → Ollama
- CO₂ transparency with open methodology (`/transparenz/co2`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router, React 18, TypeScript 5, Tailwind 3.4 |
| Database | PostgreSQL 17 self-hosted + Drizzle; ~130 TABLE_NAMES constants as DB SSOT |
| Auth | NextAuth v5 + @auth/pg-adapter; staff detection by @revamp-it.ch domain |
| Search / media | Meilisearch; Cloudflare R2 images; Upstash Redis rate limiting |
| AI | HIRN cascade: Groq → OpenRouter → Ollama |
| Testing | 7,500+ Jest tests / 500+ suites, Playwright E2E, Swiss-umlaut lint |
| Deployment | Merge-to-main → build → rsync → Hetzner systemd, page-render rollback gate |

---

## Payments (verified against code)

- **Payrexx = live default provider** (`src/config/payment-providers.ts`) — Swiss card/TWINT/ZKB, escrow-capable (authorize→capture) backing the P2P flow; webhook wired
- **BTCPay = fully wired, unprovisioned** — gated on `BTCPAY_SERVER_URL`/`API_KEY`/`STORE_ID`; hidden at checkout until set ("Bezahlung mit Bitcoin wird gerade eingerichtet")
- **GNU Taler = third rail**, same pending pattern
- **Stripe is NOT integrated** — no dependency; only legacy column residue

---

## Distribution

**The fleet's most complete loop, live today:**

- Blog (file-based + DB-backed admin editing) · RSS at `feed.xml` · sitemap + robots
- Newsletter: double opt-in via **self-hosted Listmonk** (listmonk.revampit.ch), Nodemailer/Brevo fallback
- OG images: site-level dynamic routes (no per-post OG yet)
- Social queue `content/social/queue.md` + GTM doc: written 2026-08-13, currently on unmerged branch `fix/blog-reader-experience` — DE/EN Mastodon + LinkedIn drafts, explicitly "nichts hiervon ist gepostet"
- Mastodon: self-hosted instance net.miaumuh.ch operational; @evig account still a TODO

**Planned cadence:** Monday publish (DE+EN) + queue social; Thursday marketplace highlight; monthly Listmonk digest + metrics review. Channel order: blog/RSS → newsletter → Mastodon (primary social) → LinkedIn (NGO/municipal) → local Swiss channels after 4+ weeks of cadence. No ads, no paid channels.

---

## Go-to-market

- **ICP (5 segments, in order):** (1) individuals needing a capable affordable machine — students, job-seekers, families; (2) Swiss circular-economy actors — Repair Cafés, zero-waste, Umwelt-Vereine; (3) NGOs/Vereine/Schulen needing 5–20 identical devices on one invoice; (4) Gemeinden in the Reparaturbonus orbit; (5) the existing RevampIT orbit (customers, donors, volunteers).
- **Positioning one-liner:** "Affordable intelligence" — complete, working second-life machines: hardware, software, and knowledge handed over together. Honest-by-default (open CO₂ methodology, "Verein in Gründung" stated plainly).
- **Shortest first-paying-customer path:** the shop is already live — publish weekly, every post links a purchasable surface, newsletter captures returners; first orders from the RevampIT orbit + Mastodon locals. Secondary paid paths already built: workshop registrations, membership. Fleet GTM revenue rank: #3.
- **Monetization state:** checkout live (Payrexx); BTCPay + Taler pending provisioning; physical inventory exists via RevampIT.
- **Key metrics to move:** Listmonk subscriber count · `feed.xml` requests (Caddy logs) · shop orders (count + CHF, refurb vs P2P split) · blog→shop click-through. Mission rule: metric-per-franc must hold.

---

## Risks / Debt

- Canonical public domain unresolved (revampit.orangecat.ch vs evig.orangecat.ch); infra identifiers still say revampit pending cutover
- Blog `force-dynamic` workaround renders per-request — fix before a traffic spike
- GTM doc + social queue not yet merged to main
