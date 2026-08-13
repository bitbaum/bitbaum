# vitareba — Clinical Platform for VitaReBa GmbH

**Status:** Active Development (Live, one real clinic)
**Tagline:** Patient portal + clinician console for a metabolic-psychiatry / longevity practice
**URL:** [vitareba.ch](https://vitareba.ch)
**Codebase:** `/home/g/dev/vitareba/`

---

## Executive Summary

Purpose-built platform for VitaReBa GmbH — Manuel Schabus's metabolic-psychiatry clinic in Zürich. Public multilingual marketing site (de/en/fr/it) + patient portal + clinician admin. The flagship programme is ADHD diagnosis & optimisation for high performers.

**This is the fleet's #1 revenue priority: a real external user already exists.** The relationship beats any funnel.

---

## What's Built

- Public Inflection Edge self-assessment (no auth wall) with results, history, trend chart, and lead capture
- Daily wellness check-ins (sleep/energy/mood/focus/stress); clinical goals; secure async patient↔clinician messaging; document upload
- Patient signals engine with admin badges + at-a-glance risk; 5 systemd cron jobs (reminders, dip alerts, signals, digests)
- **Native conflict-free slot booking** — no Calendly, no paid SaaS (deleted; availability SSOT `lib/config/scheduling.ts`, DB partial unique index = race-proof); multi-doctor care + dual-role switching
- **Regulation ledger** at `/regulation`: every legally gated feature listed with statute, who passed it, who benefits; blocked AI routes return HTTP 451 with a `blockId` into the ledger. GDPR: Art. 15/20 self-service export, Art. 17 erasure requests
- AI layer: provider-agnostic OpenAI-compatible client (`AI_BASE_URL`/`AI_KEY`/`AI_MODEL`), documented constraint: EU/CH-hosted under a DPA; insights carry legal warning labels

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (standalone), TypeScript strict, Tailwind 4 (tokens in globals.css) |
| Database | Self-hosted Postgres + Drizzle |
| Auth | NextAuth 5; role resolution promote-only |
| i18n | de (default) / en / fr / it |
| AI | Provider-agnostic OpenAI-compatible client; EU/CH-hosted-under-DPA constraint |
| Email / observability | Resend sequences, Sentry |
| Deployment | Self-hosted Hetzner; 5 systemd cron timers |

---

## Business Model

- **Monetization state: no payment code at all — deliberate.** First customer path is the existing clinic relationship via invoice; no processor needed.
- Target per fleet GTM: a modest monthly amount (CHF 50–150) as first paying reference customer, once Manuel depends on the tool daily.
- Revenue to date: CHF 0

---

## Distribution

**What exists today:** `sitemap.ts`, `robots.ts`, site + locale OG images, PWA manifest, public assessment as lead magnet (`api/assessment-leads` — the closest thing to newsletter capture), Resend email sequences (welcome + assessment).

**Not yet — fleet distribution standard pending:** no blog, no RSS, no newsletter proper, no social queue. Distribution matters less here: the GTM is one relationship, not an audience.

---

## Go-to-market

- **ICP (explicit):** Manuel Schabus and his clinicians; patients = high-performer ADHD / burnout / longevity clients of the practice.
- **Positioning one-liner:** the clinic's own operating system — assessment to booking to daily signals — with law treated as a warning, not a wall (regulation ledger).
- **Shortest first-paying-customer path (fleet GTM rank #1):** ship value Manuel depends on → propose the paid arrangement (drafted for founder approval) → CHF 50–150/mo invoiced. Second clinic = referral from the first.
- **Monetization state:** none built; invoice-based by design for customer #1.
- **Key metrics to move:** Manuel's daily active use · patient check-in adherence · booked slots via native booking · the first paid invoice.

---

## Risks / Next Steps

- Single-customer concentration is the model, not a bug — but the platform's value must survive Manuel's schedule; adherence data will show it
- CalDAV/Google free/busy sync (Phase 2 of booking) open — Manuel's calendar provider unknown
- Regulatory posture is documented ("law = warning not wall") but untested against an actual MDR/AI-Act review
- Next: draft the paid-arrangement proposal for founder approval (fleet GTM next-move #4)
