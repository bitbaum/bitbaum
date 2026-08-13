# aoz-housing — Shared-Living Management & Compatibility Placement

**Status:** Active Development (Live — REAL instance since 2026-08-13)
**Tagline:** One product, two faces: a WG/shared-flat tool and a staff placement system for refugee housing
**URL:** [aoz-wohnen.orangecat.ch](https://aoz-wohnen.orangecat.ch) — runs in REAL mode (Witikonerstrasse 458 "Singapur", George's flat); demo mode OFF there (reset timer would truncate real data)
**Codebase:** `/home/g/dev/aoz-housing/`

---

## Executive Summary

Two audiences share one codebase, switched by config (`NEXT_PUBLIC_BRAND`: `aoz` | `aozh` | `wg`):

1. **Resident portal (WG face):** shared expenses with split transparency, monthly statements and settle-up; house rules with acknowledgement; proposals & voting that turn into binding rules (with a non-negotiable `FIXED` tier and a conflict ladder); chores, activities, profiles, transfer requests.
2. **Staff placement (AOZ face):** 38-factor, 4-dimension compatibility matching for placing asylum seekers into shared housing; residents/units/placements CRUD, incidents, maintenance, analytics, algorithm tuning, AI assistant (chat + fill-intake-from-prose), CSV import/export, audit trail.

Hard ethical constraints are code constraints: never track immigration status, religion, or diagnoses.

**Demo is the real tool behind a doorless login** — server-driven, seeded narrative (5 units, 15 residents), `DEMO-` prefixed rows, daily scoped reset, opt-in per deployment via `DEMO_ACCESS_ENABLED`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, TypeScript strict, Tailwind |
| Database | Prisma + PostgreSQL 16; Zod validation |
| Auth | JWT sessions (bcryptjs + jose) — no NextAuth |
| AI | @anthropic-ai/sdk, config-driven model; chat + form-assist with throttling |
| Testing | 212 unit (Jest) + 45 E2E (Playwright) incl. @axe-core a11y |
| Deployment | Self-hosted Hetzner (Vercel/Neon/Supabase exit) |

---

## Business Model

- **Monetization state: none.** No processor, no pricing page. Settlements *record* who paid whom; they don't move money.
- The business case is framed as **ROI for AOZ**, not a price: status quo costs ~CHF 1,150/month per location; targets −30% incidents, −50% relocations; 3-phase pilot proposed (`docs/AOZ-PITCH.md`).
- Revenue to date: CHF 0

---

## Distribution

**What exists today:** `robots.txt`, one OG image route ("a real social preview"). Extensive *internal* docs (pitch, UX master plan, readiness matrix) — not public-facing distribution.

**Not yet — fleet standard pending:** no sitemap route, no blog, no RSS, no newsletter, no social queue.

---

## Go-to-market

- **ICP (two, explicit):** (a) AOZ staff placing asylum seekers into shared housing — the pitch/pilot target; (b) WG/shared-flat households — the `wg` brand preset, of which Witikonerstrasse 458 is real instance #1.
- **Positioning one-liner:** shared living that runs itself — transparent money, binding house rules, and placements matched for compatibility instead of vacancy.
- **Shortest first-paying-customer path:** relationship-driven — the AOZ pilot via the pitch deck, invoiced (no processor needed). The live WG instance is the demo that proves daily use.
- **Monetization state:** none built; pilot-first by design.
- **Key metrics to move:** AOZ pilot signed · real WG instances beyond #1 · daily resident engagement on WIT-458 · incident/relocation deltas once a pilot runs.
