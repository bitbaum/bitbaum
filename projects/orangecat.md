# orangecat — AI-Native Economic Participation Platform

**Status:** Active Development (Live)
**URL:** [orangecat.ch](https://orangecat.ch)
**Type:** Open platform (under bitbaum umbrella)
**Vertical:** Decentralized Finance / Economic Infrastructure
**Codebase:** `/home/g/dev/orangecat/`

---

## Executive Summary

**orangecat** is an AI-native platform for universal economic participation. Every user gets "My Cat" — an AI agent that manages their economic activity across the full spectrum: exchanging, funding, lending, investing, and governing.

**Core thesis:** Economic participation still requires gatekeepers. To sell, fund, lend, invest, or govern collectively, you need banks, payment processors, and platforms that take cuts and dictate terms. OrangeCat removes gatekeepers entirely.

---

## The Problem

1. **Gatekeepers block participation** — Banks, payment processors, and platforms require identity verification, credit history, geographic presence
2. **AI agents can't transact** — No existing platform treats AI agents as first-class economic actors
3. **Currency fragmentation** — Global buyers and sellers can't transact directly without costly intermediaries
4. **Privacy vs. transparency tradeoff** — Platforms force an all-or-nothing choice; OrangeCat offers both

---

## The Solution

An economic layer where **any identity** — human, pseudonymous, or AI — can participate in the full economic spectrum.

### Core Features (Live)

| Domain | What it does |
|--------|-------------|
| **Commerce** | Products and services with Bitcoin Lightning payments |
| **Funding** | Transparent project funding, cause support, wishlists, research |
| **Lending** | Peer-to-peer loans with repayment tracking |
| **Assets** | Real estate, collateral, and rentable asset management |
| **Groups** | Organizations with shared wallets, governance proposals, collective decisions |
| **AI Assistants** | Autonomous economic actors as first-class entities |
| **Events** | Time-bound coordination with ticketing |
| **Documents** | Structured context for the AI agent |

### Key Differentiators

- **Any identity:** Human, pseudonymous, or AI — all are first-class economic participants
- **Any currency:** Bitcoin/Lightning is native and preferred; any payment method (Twint, PayPal, Monero, local) supported
- **Private where needed:** E2E encrypted messaging; on-chain transparency when chosen
- **No documents required:** No verification, no gatekeepers

---

## Architecture

**13 entity types, one registry.** One ownership model (actors), one permission layer (database RLS). Adding a new entity type requires 2-3 files.

### Entity Registry Pattern
`src/config/entity-registry.ts` — single source of truth for all 13 entity types. Drives CRUD, navigation, forms, and validation. No entity-specific switch statements.

### Actor System
Users and groups both have actors. All entities reference `actor_id`. One ownership model, one permission check — works for individuals, organizations, and AI agents.

### Currency Model
- **Storage:** BTC as `NUMERIC`/`DECIMAL` in DB (not integer satoshis)
- **Primary display:** BTC (crypto) / CHF (fiat default)
- **All payment methods** accepted as secondary rails

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, React 18, TypeScript 5.8 |
| Styling | Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Bitcoin | Lightning Network, BTCPay, NWC |
| Auth | Supabase Auth, JWT, Row Level Security |
| Deployment | Vercel, GitHub Actions CI/CD |
| AI | Claude API (Anthropic) |

---

## Business Model

- **Platform fees** on transactions — 1–3% per economic domain, activated sequentially once each domain reaches CHF 50k/month in transaction volume
- **"My Cat" premium** — enhanced AI agent capabilities (subscription)
- **Enterprise/API** — white-label economic infrastructure for other platforms

**Current focus:** Grow usage, validate which verticals attract the most organic transaction volume, then layer in monetization.

---

## Competitive Position

| Alternative | Their approach | OrangeCat advantage |
|-------------|---------------|---------------------|
| PayPal / Stripe | Requires identity, takes %, blocks certain businesses | No documents, lower fees, BTC native |
| OpenSea / NFT markets | Asset trading only | Full economic spectrum (fund, lend, invest, govern) |
| Gig platforms (Fiverr) | Centralized, 20% cut | Peer-to-peer, lower fees, any identity |
| DAOs | Crypto-native, complex UX | AI agent layer, familiar UX, any currency |

**Moat:** AI agent economic participation (first-class, not bolted on) + Bitcoin-native + full economic spectrum in one platform

---

## Distribution

**What exists today** (distribution engine shipped 2026-08-13, PR #692, merged to main):

- Blog (MDX) + public community articles; launch post `your-pay-link-already-works`
- RSS: `src/app/rss.xml/route.ts` — posts + public articles, sources fail independently
- Sitemap extended to carry all posts/articles
- Per-post and per-article OG images (`/api/og/blog/[slug]`, `/api/og/article/[slug]`) + site-level card
- Newsletter capture: `/api/newsletter/subscribe` + `newsletter_subscribers` table — **capture only, no sending pipeline yet**
- Public `/pay` landing + homepage link; every user owns `orangecat.ch/pay/<username>` (no payer account needed)
- Nostr: `publishEvent()` built (`src/lib/nostr/relays.ts`) with **zero call sites** — wiring publish-on-post is the next cycle's first task
- Social accounts: none; cross-posting is manual, drafts-only, founder-approved (fleet rule)

**Cadence (per GTM doc):** 1 essay/week (Wednesday), same-day cross-post, monthly product-truth post with real numbers. Channel order: blog+RSS+SEO → share-ready OG cards → Nostr → manual X/LinkedIn (never write natively there).

---

## Go-to-market

- **ICP:** indie builders and creators who want to get paid without platforms — solo devs, writers, artists, OSS maintainers, small service providers. Sharpest sub-segment: pseudonymous and "category-ineligible" people that processors decline or freeze — for them OrangeCat is not cheaper but *possible*.
- **Positioning one-liner:** "Your pay link, no middleman." The pay link is the wedge; funding/lending/investing/the Cat are roadmap.
- **Shortest first-paying-customer path (3 steps):** creator signs up → `/pay/<username>` exists immediately → shares the link once (bio, chat, invoice footer) → someone pays a real amount over Lightning. The first external payment is **the** activation event the GTM optimizes for.
- **Monetization state:** P2P payments are 0% forever and non-custodial — OC never earns on the rail. Planned revenue = "sell intelligence, not rails": Cat Credits (prepaid Lightning top-ups, margin in credit price), Supporter plan (CHF 10/mo or 10k sats), paid AI assistants at 95/5 split. Single blocker: `PLATFORM_NWC_URI` unset (founder-only step). Ground truth: 44 registered users, **0 completed payments ever** (prod DB, 2026-07-02).
- **Key metrics to move:** first external payment (the milestone); RSS subscriber proxies (baseline 0); newsletter signups (baseline 0); pay-link visits (not yet tracked separately); 90-day master-plan targets: ≥50 completed payments, ≥10 users who received ≥1 sat, median signup→first published offer <15 min.

---

## Revenue Targets

Monetization activates after critical mass in ≥1 entity type — validate volume first, then layer in fees.

| Period | ARR | Key Driver |
|--------|-----|------------|
| Year 1 (2026) | CHF 300k | Platform fees on commerce + "My Cat" premium subscriptions |
| Year 2 (2027) | CHF 800k | Expanded fee activation across funding/lending verticals |
| Year 3 (2028) | CHF 2M | Enterprise/API tier + scale across all 8 economic domains |

---

## Success Metrics

### Year 1 (2026)
- [ ] CHF 300k ARR (fees + "My Cat" subscriptions)
- [ ] 500+ Monthly Active Economic Actors (MAEA)
- [ ] Transaction volume: CHF 1M+ equivalent (BTC + CHF)
- [ ] ≥2 entity types with organic, repeat usage (validates depth of engagement)
- [ ] AI agent transactions live (first-class, not demo)

### Year 2 (2027)
- [ ] CHF 800k ARR
- [ ] 1,500+ MAEA
- [ ] Fees activated on ≥3 economic domains (expanded from commerce into funding/lending)
- [ ] "My Cat" premium subscription live
- [ ] AI agent transactions: 10%+ of total transaction volume

### Year 3 (2028)
- [ ] CHF 2M ARR
- [ ] 5,000+ MAEA
- [ ] Enterprise/API customers: 3-5
- [ ] AI agent transactions: 20%+ of total transaction volume

---

## Risks & Mitigation

### Risk 1: Cold Start / Network Effects
**Likelihood:** High
**Mitigation:** Launch with Bitcoin community (already motivated buyers + sellers); seed with Revamp-IT and Swiss NGO network; focus on one entity type (commerce) until critical mass before expanding to funding/lending

### Risk 2: Lightning Network Adoption Still Niche
**Likelihood:** Medium
**Mitigation:** "Any currency" positioning is the hedge — accept Twint, PayPal, bank transfer from day one; Lightning is preferred but never required

### Risk 3: Regulatory Uncertainty (FINMA / MiCA)
**Likelihood:** Medium
**Mitigation:** Swiss hosting; no custody of funds (peer-to-peer, not custodial); consult FINMA sandbox; structure as platform not exchange

### Risk 4: Monetization Timing
**Likelihood:** Medium
**Mitigation:** Pre-define activation thresholds (e.g., CHF 50k/month transaction volume in one entity type) so monetization decision is criteria-driven, not subjective

---

## Next Steps

1. **Identify highest-volume entity type** — Instrument usage analytics to find which of the 8 domains attracts most organic, repeat transactions
2. **Activate fees on top entity type** — Enable platform fee (1-3%) on highest-volume domain once CHF 50k/month transaction threshold is reached
3. **Launch "My Cat" premium** — Define premium AI agent capabilities; price based on usage patterns once the most-valued features are clear from analytics
4. **Target AI agent operators** — Developers building autonomous agents are the most motivated early adopter segment; partner with Swiss AI communities
5. **Scale to 500 MAEAs by EOY 2026** — Required to validate CHF 300k ARR target

---

*Any identity. Any currency. Full economic spectrum.*
