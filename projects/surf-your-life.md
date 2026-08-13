# surf-your-life — Clinic Portal for Burnout & Long-COVID Care

**Status:** Active Development (Live)
**Tagline:** Client portal + practitioner console for a psychiatry-led Zürich clinic
**URL:** [surf-your-life.orangecat.ch](https://surf-your-life.orangecat.ch)
**Codebase:** `/home/g/dev/surf-your-life/`

---

## Executive Summary

Client portal and practitioner console for a psychiatry-led Zürich clinic treating burnout and Long COVID: daily check-ins, symptoms, sleep, techniques, assessments, medications, program content, secure messaging, booking, and an AI chat on the client side; an early-intervention console (at-risk cohort view, alerts, leads, bookings, services, programs) on the clinician side. The stated goal: replace ad-hoc spreadsheets with a purpose-built clinical tool for "Manu and team".

The most feature-complete of the fleet's small apps: ~41 page routes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, Tailwind 4 |
| Database | Drizzle + self-hosted Postgres + pgvector |
| Auth | Auth.js v5 — Google OAuth + email/password |
| i18n | de / en / fr |
| Email / observability | Resend; Sentry client + server with error boundaries |
| Deployment | Self-hosted Hetzner |

---

## Business Model

- **Monetization state: none.** No payment code; bookings and services exist but carry no prices in schema or UI.
- Like vitareba, the natural first-customer motion is the clinic relationship via invoice — but unlike vitareba, no paid arrangement is ranked in the fleet GTM. Whether "Manu" here is the same clinician as vitareba's Manuel is **not established in either repo** — do not conflate the two clinics.
- Revenue to date: CHF 0

---

## Distribution

**Strongest distribution surface among the fleet's small apps:**

- `sitemap.ts` (all locales × public pages) + `robots.ts` + OG metadata
- Public marketing pages (landing, FAQ, contact, privacy)
- Blog — but posts live in i18n message JSON (`t.raw("posts")`), not MDX/CMS: publishing means editing `messages/*.json`
- Newsletter signup form → `/api/leads` (`source: "newsletter"`), surfaced in the admin leads page

**Not yet:** no RSS feed, no social queue — fleet standard pending.

---

## Go-to-market

- **ICP (explicit):** burnout / Long-COVID reintegration and longevity clients; practitioners = the clinic team.
- **Positioning one-liner:** catch the dip before the crash — daily signals for clients, early-intervention visibility for clinicians.
- **Shortest first-paying-customer path:** clinic relationship via invoice (same pattern as vitareba). Not currently ranked in the fleet's top-4; no active revenue motion.
- **Monetization state:** none built.
- **Key metrics to move:** none active per fleet GTM; the leads table (newsletter + assessment sources) is the existing funnel asset when activated.
