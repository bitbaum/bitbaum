# reparaturbonus-zh — Zürich Repair-Bonus Platform

**Status:** Active Development (Live; city relationship unverified)
**Tagline:** "Repair instead of replace" — residents, certified repair shops, and subsidised bonus codes
**URL:** [reparaturbonus.orangecat.ch](https://reparaturbonus.orangecat.ch)
**Codebase:** `/home/g/dev/reparaturbonus-zh/`

---

## Executive Summary

Connects Zürich residents with certified repair shops via government-subsidised bonus codes, tied to the Stadt Zürich repair-bonus programme. The most-iterated of the fleet's small apps (72 PRs by 2026-08).

**What's built:** shop directory with category/text/postal-code/radius (haversine) search across three qualifying categories (Elektro/Elektronik, Kleidung, Schuhe); bonus-code lifecycle (`generateBonusCode()`, 30-day expiry, redemption/validation at `/verify`); shop onboarding; customer dashboard; role-gated admin (user management, shop approval, bonus tracking, platform stats); content pages. Design decision on record: **flat CHF 100 bonus** (percentage-of-repair-cost was considered and rejected — flat is simpler to communicate, no valuation disputes). Every shop endpoint falls back to demo data if the DB is down — no 500s.

**Whether an actual Stadt Zürich relationship exists is not verifiable from the repo.**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5, React 19, Tailwind 4 |
| Database | Prisma 6 + PostgreSQL (8 models, 3 enums; schema = type SSOT) |
| Auth | NextAuth v4 — credentials + bcrypt, role in JWT |
| Resilience | Every shop endpoint falls back to demo data if DB down |
| Deployment | Self-hosted Hetzner |

---

## Business Model

- **Monetization state: none for the operator.** The CHF 100 is a city subsidy being *disbursed* — money flows the other way. No payment processing, no merchant fees, no shop subscriptions.
- The realistic revenue model would be the city (or a Verein mandated by it) paying to operate the platform — unbuilt, unproposed.
- Revenue to date: CHF 0

---

## Distribution

**Nothing:** no sitemap, no robots, no OG or metadata tags anywhere in `src/` (grep-confirmed), no blog, no RSS, no newsletter, no social queue. A public consumer product invisible to search and social — flagged in the fleet audit as the most obvious gap-to-value. Fleet standard pending.

---

## Go-to-market

- **ICP:** Zürich residents holding/seeking a repair bonus (demand side); certified local repair shops (supply side, onboarded in-app); Stadt Zürich as programme sponsor and the only plausible paying customer.
- **Positioning one-liner:** the missing storefront for Zürich's repair-bonus programme — find a certified shop, redeem your CHF 100.
- **Shortest first-paying-customer path:** none active — requires a city/programme relationship that is not documented. Adjacent fleet asset: evig's circular-economy orbit and its `/reparaturbonus` surface target the same Gemeinden (fleet GTM ICP #4 for evig) — any municipal conversation should carry both.
- **Monetization state:** none built.
- **Key metrics to move:** none active. If pursued: onboarded shops, codes redeemed, and a signed city mandate.
