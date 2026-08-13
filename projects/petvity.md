# petvity — Global Multi-Species Pet-Care Platform

**Status:** Active Development (Live)
**Tagline:** Health tracking with a "Digital Twin" wellness signal + care marketplace, in 9 languages
**URL:** [petvity.orangecat.ch](https://petvity.orangecat.ch)
**Codebase:** `/home/g/dev/petvity/`

---

## Executive Summary

Pet health tracking (7 metrics, Digital Twin emotional state with trend), vet/sitter/groomer booking with reviews and calendar conflict blocking, a shop with cart/checkout/fulfilment, cross-border adoption listings with moderation, and public "influencer" pet profiles. All four build phases marked complete. 9 locales (en/de/fr/es/ja/zh/ko/tr/ar incl. RTL).

**Demo access:** one-click `/demo` auto-signs into a shared demo account — the fleet's reference implementation of the no-account demo standard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router (standalone), TypeScript strict, Tailwind 4 |
| Database | Self-hosted PostgreSQL 17 + Drizzle ORM |
| Auth | NextAuth 5 (beta) |
| i18n | next-intl, 9 locales incl. RTL Arabic |
| Email / observability | Resend (key unset in prod), Sentry |
| Deployment | Self-hosted Hetzner behind Caddy (Vercel/Neon exit mid-2026) |

---

## Business Model

- **Pricing page live** (3 tiers, fully i18n'd): Free — $0 forever, all individual-owner features, no card · Pro (breeders/show animals/pet businesses) — **"Coming soon"** waitlist CTA · Clinic (veterinary businesses) — **"Coming soon"** contact CTA
- **Stripe IS integrated on main** (correcting earlier fleet notes): `stripe ^22.5.0`, env-gated `paymentsEnabled()` on `STRIPE_SECRET_KEY`, webhook route + tests, order-payment route returning 503 when payments off (PR #25). **No key configured in prod → payments dark.** Adoption fees are displayed, not charged.
- Revenue to date: CHF 0

**Known prod gaps:** `RESEND_API_KEY`, Google OAuth creds, `ADMIN_EMAILS` unset — email silently dropped, no admin access.

---

## Distribution

**What exists today:** `sitemap.ts` (force-dynamic), `robots.ts`, 4 OG image generators (site + per shop product + per pro profile + per adoption listing), `/unsubscribe` route, transactional email via Resend.

**Not yet — fleet distribution standard pending:** no blog, no RSS, no newsletter capture, no social queue.

---

## Go-to-market

- **ICP:** individual pet owners (free tier); Pro = breeders, show animals, pet businesses; Clinic = veterinary practices. No formal ICP doc beyond the pricing copy.
- **Positioning one-liner:** multi-species pet care with a digital-twin wellness signal, global from day one (9 languages, cross-border adoption).
- **Shortest first-paying-customer path:** none active — below the fleet's top-4 revenue priorities. When activated, the shortest path is enabling the existing Stripe rail (set the key) and charging marketplace orders, or launching the Pro waitlist tier.
- **Monetization state:** processor integrated but dark (no key); paid tiers "Coming soon"; CHF 0 ever.
- **Key metrics to move:** none active per fleet GTM; candidates when touched: demo→signup conversion, active pets tracked, first paid order.

---

## Risks / Next Steps

- Prod env gaps (Resend, Google OAuth, admin emails) silently degrade email + admin — cheap fixes, real user impact
- Paid tiers are copy, not product: Pro/Clinic feature boundaries undefined beyond pricing copy
- Two-sided marketplace (owners + pros + sellers) has cold-start risk in every vertical; no seeded supply strategy documented
- When the fleet's top-4 pays, the cheapest activation here is setting `STRIPE_SECRET_KEY` — the rail already exists
