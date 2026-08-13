# revamp-info — Fundraising Intelligence Platform (working name; candidate name "Hirnli")

**Status:** Active Development (Live, single-tenant for Revamp-IT)
**Tagline:** Mine the Swiss foundation register, rank the pipeline, generate the Gesuch
**URL:** [revamp-info.orangecat.ch](https://revamp-info.orangecat.ch)
**Codebase:** `/home/g/dev/revamp-info/`

---

## Executive Summary

**Not an info site.** revamp-info is a fundraising-intelligence platform: it mines the Swiss foundation register, LLM-triages ~15.5k foundations into a ranked pipeline, and auto-generates German-language grant applications (Gesuche). It is the working proof-of-concept for the strategy described in `projects/hirnli.md` — final product name explicitly undecided ("Hirnli" is the candidate; see `docs/HIRNLI-REPLATFORM-PLAN.md` for the multi-tenant path).

**Live funnel (from README):** 16,900 Swiss universe → 15,506 in DB → 1,683 generated → **240 actionable** (P1=20, P2=78, P3=142) → **212 Gesuch pages, 199 quality-perfect (94%)**.

Outputs per foundation: 4-page Gesuch PDF, one-pager, HMAC-tokenized share landing page, 8-slide pitch deck, 2-page impact report. Three chromes via route groups: tenant org site (RevampIT's finances, impact, team, strategy), platform page, chrome-less share pages.

**Data-integrity rule:** automated enrichment is forbidden — a 2026-04 incident showed guessed URLs were 54% wrong.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, Tailwind 4; 31 page routes in 3 route-group chromes |
| Database | Drizzle + Postgres (15,506 foundations) |
| i18n | next-intl |
| AI | Groq-hosted LLM triage; automated enrichment forbidden by rule |
| Email | Resend (key unset → cron emails dark) |
| Deployment | Self-hosted Hetzner |

---

## Business Model

- **Monetization state: none for the software.** The `preismodell` page prices RevampIT's *repair services* (incl. "Gratis / Spende" for hardship cases), not the platform. SaaS intent is stated ("will be released as a standalone SaaS product") but no SaaS pricing or billing exists.
- Currently "built for and used exclusively by Revamp-IT" — the value delivered today is grant money raised for the tenant, not software revenue.
- Known gap: `RESEND_API_KEY` unset → cron email notifications are dark.

---

## Distribution

**What exists today:** `robots.ts`, dynamic OG image. The share pages themselves are a distribution mechanism (Gesuch links sent to foundations).

**Not yet — fleet standard pending:** no sitemap, no blog, no RSS, no newsletter capture, no social queue.

---

## Go-to-market

- **ICP:** mission-driven organizations seeking Swiss foundation grants — NGOs, Vereine, social enterprises. Tenant #1 (and only): Revamp-IT.
- **Positioning one-liner:** your fundraising team, automated — from foundation research to a submission-ready Gesuch.
- **Shortest first-paying-customer path:** prove grant money raised for Revamp-IT (the 240-foundation actionable pipeline is the working asset) → execute the Hirnli replatform (multi-tenant registry already scaffolded at `src/lib/tenant/registry.ts`) → convert one external NGO from the RevampIT/evig network to a paid pilot.
- **Monetization state:** none built; single-tenant proof phase.
- **Key metrics to move:** Gesuche actually submitted · responses/grants won (CHF) for Revamp-IT · then: first external tenant.
