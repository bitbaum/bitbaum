# fleetcrown — Fleet Command for AI Agent Runtimes

**Status:** Active Development (Live, pre-1.0, single-builder)
**Tagline:** "The captain's bridge over AI agent runtimes — not a runtime, not an agent"
**URL:** [fleetcrown.orangecat.ch](https://fleetcrown.orangecat.ch) · fleetcrown.com **unregistered** (see blocker)
**Repo:** [github.com/bitbaum/fleetcrown](https://github.com/bitbaum/fleetcrown) (public)
**Codebase:** `/home/g/dev/fleetcrown/`

---

## Executive Summary

FleetCrown is a multi-user SaaS for commanding AI agent fleets across projects: sign in with GitHub, register projects, dispatch and monitor agents from one dashboard. Strategy: **"borrow the workers, own the bridge"** — coding agents (Claude Code, Cursor, Codex, Grok Build, OpenClaw, …) are adapters in a registry, not rivals; 6 runtimes live. One assistant identity ("Loki") over a swappable runtime roster. Sibling stack: OrangeCat (economy), Solon (governance); FleetCrown is OrangeCat's first customer.

**Moat:** cross-model verification (a single agent's judge would be itself), fleet-wide governance and visibility, self-improvement loop wired to the OrangeCat economy.

---

## The Problem

AI-assisted solo builders run 3–15 projects with no dashboard: no cross-project visibility, no verification independent of the agent that produced the work, no single place to dispatch, watch, approve, and ship.

---

## What's Built

- Views: Control (dispatch + real-time SSE status), Terminal (live PTY per project), Loki chat, Activity timeline, Approvals queue, Projects, plus personal-OS surfaces (Today/People/Money/Goals/Habits)
- Worktree-per-agent isolation; auto-merge shipping ("nobody merges by hand"); deploy reconciler
- Fleet Runner desktop app = local executor; hosted execution mid-build (Phase 0 read-only live); multi-tenancy is Phase 3
- 63+ published essays on architecture/execution (`/thoughts`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript strict |
| Database | PostgreSQL 17 (self-hosted) + Drizzle ORM (schema = SSOT for types) |
| Styling | Tailwind CSS 4 + shadcn/ui, dark-first, four-layer token architecture |
| Local executor | Fleet Runner desktop app (Electron), zellij-driven PTYs |
| Deployment | Self-hosted Hetzner behind Caddy; auto-merge + deploy reconciler |

---

## Business Model

- Plans (code SSOT `src/config/plans.ts`, CHF/month, billed annually): **Free 0** (3 projects) / **Personal 15** (5) / **Pro 40** (∞) / **Team 90** (∞)
- Stripe fully coded (checkout, portal, webhook) behind `isStripeReady()`; **zero price IDs configured** → monetization scaffolded but dark. Parallel dark rail: OrangeCat pay (`src/lib/oc-pay.ts`)
- Revenue to date: **CHF 0**
- 90-day targets (master plan 2026-07): ≥10 external users with a connected runner · ≥5 paying customers · median signup→first successful dispatch <30 min
- **Blocker:** fleetcrown.com unregistered — the brand/domain decision blocks paid marketing, not the product. No paid ads before that decision (GTM rule).

---

## Distribution

**What exists today** (verified in tree, 2026-08-13):

- 64 essays in `content/thoughts/` (weekly cadence Apr–Aug; resumed)
- RSS: `src/app/rss.xml/route.ts` (all essays); full sitemap enumerating every essay
- OG cards: site-level + per-essay + per-user routes
- Newsletter capture: API + component + `newsletter_subscribers` table — **capture-only, no sending pipeline**
- Share buttons on every essay (`ShareBar`)
- Social queue: `content/social/queue.md` — X + LinkedIn drafts only; nothing posts without founder approval

**Planned:** 1 essay/week + cross-post drafts the next day; HN/lobste.rs for the 3 engineering deep-dives; outbound GTM agent dogfooding FleetCrown's own approval queue ("FleetCrown runs its own outbound") — buying-signal-triggered, sourced dossiers, any reply halts the queue.

---

## Go-to-market

- **ICP:** AI-assisted solo builders and micro-studios already shipping with agents — "the levelsio pattern productized"; laptop or VPS, 3–15 projects, no dashboard. Secondary: Swiss Bitcoin community via OrangeCat.
- **Positioning one-liner:** the captain's bridge over AI agent runtimes — not a runtime, not an agent.
- **Shortest first-paying-customer path:** build-in-public (essays → RSS/newsletter) → onboard 10 external users personally → convert ≥5 at CHF 15–40/mo. Fleet GTM revenue rank: #4.
- **Monetization state:** dark — pricing page shipped 2026-07-08, Stripe coded, no price IDs, CHF 0 ever.
- **Key metrics to move:** newsletter signups 0 → first 25 · GitHub stars (baseline ~1) growing WoW · referral traffic to /thoughts (Caddy logs) · external users with runner 0 → ≥10 · paying customers 0 → ≥5.

---

## Risks

- **Witnesses, not product, are the constraint** (fleet audit 2026-08-13: 63-essay content moat, near-zero distribution before the distribution engine shipped)
- Domain/brand decision pending (founder)
- Hosted execution and multi-tenancy unfinished — external onboarding is manual until then

---

*Borrow the workers. Own the bridge.*
