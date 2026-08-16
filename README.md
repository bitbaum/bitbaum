# bitbaum — AI-First Product Studio

**Status:** Early Stage — orangecat live · hirn.li launching Q2 2026 · FleetCrown in private development · bitbaum AG incorporation pending
**Type:** Umbrella Company / Holding Structure
**Inspired By:** ByteDance (multiple products, shared infrastructure)

---

## Vision

**Build multiple AI-powered products that solve real problems.**

Not a single product company. Not a consulting agency. A **product studio** that ships multiple SaaS products, all powered by AI, all profitable, all serving different markets.

**Why "bitbaum" (bit-tree):**
- **Bit** = Digital, software, AI
- **Baum** (German: tree) = Multiple branches (products) from one trunk (shared infrastructure)
- One company, many products, shared learnings

---

## Philosophy

### 1. AI-First Development
- Every product leverages AI (Claude API primary, embeddings, autonomous agents)
- Humans handle strategy, judgment, taste
- AI handles repetition, generation, automation
- 10x faster shipping than traditional software companies

### 2. Product Studio Model
- Launch 1-2 validated products per year; scale throughput as shared infrastructure matures
- Each product targets a different vertical/market
- Shared infrastructure (auth, payments, AI layer) cuts per-product build time in half
- Cross-pollinate learnings across products

### 3. Profitability First
- No "growth at all costs" mindset
- Each product must reach profitability within 12 months
- Bootstrap until PMF, then consider raising capital
- Owner-operator mentality

### 4. Vertical-Specific Solutions
- No horizontal platforms (too generic, hard to win)
- Deep domain expertise per vertical
- Solve specific pain points, not general problems
- Network effects within each vertical

---

## Product Portfolio

### 🦁 orangecat — AI-Native Economic Participation Platform

**Status:** Active Development (Live at [orangecat.ch](https://orangecat.ch))
**Vertical:** Decentralized Finance / Economic Infrastructure
**Codebase:** `/home/g/dev/orangecat/` · **Project doc:** `projects/orangecat.md`

**Problem:** Economic participation requires gatekeepers — banks, payment processors, platforms that demand identity verification, take cuts, and exclude entire categories of people (and AI agents).

**Solution:** An open platform where any identity — human, pseudonymous, or AI — participates in the full economic spectrum: exchanging, funding, lending, investing, and governing. Bitcoin/Lightning native. CHF as default fiat. No documents required.

**Core capabilities (live):** Commerce · Funding · Lending · Assets · Groups · AI Assistants · Events · Documents

**Architecture:** 13 entity types driven by a single registry SSOT. One actor model covers users, organizations, and AI agents. Row Level Security at database level — not in application code.

**Stack:** Next.js 15 · TypeScript 5.8 · Supabase (PostgreSQL + RLS) · Lightning Network · Vercel

**Business Model:** Platform fees on transactions + "My Cat" AI agent subscription (premium) + Enterprise API

**Moat:** AI agent economic participation (first-class, not bolted on) + Bitcoin-native + full economic spectrum in one platform

---

### 🤖 botsmann — AI Agent Marketplace

**Status:** Concept Validation
**Vertical:** AI/Automation
**Project doc:** `projects/botsmann.md`

**Problem:** Companies want AI agents but building from scratch requires ML engineers (CHF 150k+/year). No easy way to buy pre-built, vertical-specific agents — and no marketplace for creators to monetize them.

**Solution:** A two-sided marketplace — businesses trial (100 free tasks) and subscribe to pre-built agents; creators list and keep 70%. botsmann handles hosting, payments, quality review, and refunds.

**Business Model:** 30% marketplace take rate · premium listings · enterprise white-label (CHF 5k+/month)

**Differentiation:** Vertical-specific, quality-curated, no-code deploy (API + Zapier + embed widget)

**Revenue Projections:**
- **Year 1 (2027):** CHF 500k (30% of ~CHF 1.71M GMV)
- **Year 2 (2028):** CHF 3M revenue
- **Year 3 (2029):** CHF 15M revenue

**Risk:** OpenAI or Anthropic launch their own marketplace
**Mitigation:** Verticalization (they're horizontal, we're industry-specific), speed (build moat before they notice)

*Pre-build: interview 20 SMBs and 10 agent creators to validate demand before writing a line of code.*

---

### 👑 FleetCrown — AI Agent Fleet Command Platform

**Status:** Active Development (Live at [fleetcrown.orangecat.ch](https://fleetcrown.orangecat.ch), pre-1.0)
**Vertical:** AI-Agent Orchestration / Personal Operations
**Codebase:** `/home/g/dev/fleetcrown/` · [github.com/maonakamoto/fleetcrown](https://github.com/maonakamoto/fleetcrown) (public)
**Domain:** fleetcrown.com — unregistered; the brand/domain decision is the open blocker for paid marketing
**Project doc:** `projects/fleetcrown.md`

**Problem:** Builders running multiple projects simultaneously have to context-switch constantly — between codebases, tickets, calendars, contacts, and now dozens of AI agents working in parallel. There's no single command surface where a human captain stays in judgment mode while agents execute.

**Solution:** A captain-mode platform with two surfaces sharing one substrate: **FleetCrown Web** (cloud SaaS for remote command and monitoring) and **Fleet Runner** (local Electron desktop app that executes agent work where the code lives). One interface to track goals, people, habits, money, and events; one neutral orchestration layer to dispatch and monitor AI agents across projects.

**Core capabilities:** Control (fleet command center) · Today (calendar/weather/commitments) · People · Projects (with GitHub CI) · Goals · Habits · Money · Prompts · System

**Architecture:** Next.js 16 + Drizzle/Postgres for the web; Electron + local Node "Brain/Bridge/Worker" stack for the desktop runner; agents dispatched into zellij tabs on the user's own machine. Schema-as-SSOT throughout.

**Business Model:** Tiered SaaS subscription (Free / Personal / Pro / Team, CHF 0–90/month, billed annually); local Fleet Runner is the free executor. Stripe fully coded but not yet live — revenue to date CHF 0.

**Moat:** Local-first execution (no cloud GPU costs, agents work where the code is) + remote command surface (works from anywhere) + neutral orchestration layer (agnostic to which AI provider runs each agent).

*Pre-launch: validate with a small cohort of multi-project builders before opening signups.*

---

### 🧠 hirn.li — Fundraising Intelligence Platform

**Status:** Pre-Launch Development (Q2 2026 launch, Verein vertical)
**Vertical:** Fundraising (NGOs, Startups, Investment Banking)
**Codebase:** `/home/g/dev/hirnli/` · **Project doc:** `projects/hirnli.md`

**Problem:** Capital-raising is manual, expensive, and opaque — foundation research, application writing, investor matching, and deal rooms all require specialists charging CHF 150k+/year.

**Solution:** AI replaces 80% of that work — automated foundation/investor matching via vector embeddings, AI-generated Gesuch documents, CRM with relationship context, and deal room automation.

**Three verticals:** Verein (Swiss NGOs, Q2 2026) → Kapital (VC/PE, Q3 2026) → Investment (IB-as-a-Service, Q1 2027)

**Proof of concept:** Revamp-IT is Customer #1 (system already working in production).

**Business Model:** SaaS (CHF 99-499/mo + custom) for Verein + success fees (1% for Kapital, 1-2% for Investment)
**Revenue Target:** CHF 1.2M ARR (Year 1) → CHF 8.9M ARR (Year 3)

---

### 🌲 Revamp-IT — Digital Inclusion NGO

**Status:** Active (separate nonprofit — not part of bitbaum)
**Vertical:** Social Impact / Circular Economy
**Codebase:** `/home/g/dev/revampit/`

**Structure:** Revamp-IT is a legally independent nonprofit (Verein). Swiss law does not permit a for-profit entity to "own" a Verein — they can have the same founder, collaborate closely, and share services, but ownership is not possible. bitbaum's relationship with Revamp-IT is: founder overlap + hirn.li's first customer (proof of concept).

**Role in bitbaum ecosystem:** Revamp-IT is Customer #1 for hirn.li (Verein vertical). It validates the fundraising platform but is not a bitbaum product.

---

### Future Products (Backlog)

**Ideas to explore:**
1. **swiss-gpt** — AI trained on Swiss regulations, laws, standards (for businesses navigating Swiss compliance)
2. **docuflow** — AI-powered document automation for SMBs (contracts, invoices, reports)
3. **kundenmagnet** — AI lead generation for local businesses (restaurants, shops, services)
4. **codereviewer** — AI code review as a service (catch bugs, suggest improvements, enforce standards)
5. **sprachbrücke** — AI translation/localization for Swiss market (DE/FR/IT/EN, Swiss-specific terms)

**Criteria for next product:**
- ✅ Clear pain point (not a vitamin, a painkiller)
- ✅ Reachable customers (can acquire for <CHF 500)
- ✅ AI provides 10x improvement (not just 2x)
- ✅ Profitable within 12 months
- ✅ Can leverage bitbaum's existing infrastructure

---

## Shared Infrastructure

**Why shared infra:** Don't rebuild auth, payments, AI layer for each product

### Core Platform
- **Auth:** Supabase Auth (magic links, OAuth, SSO)
- **Database:** Supabase (PostgreSQL with RLS for multi-tenancy)
- **Payments:** Stripe (subscriptions, invoicing, Swiss CHF)
- **Email:** Resend (transactional email)
- **Hosting:** Vercel (edge network, automatic scaling)

### AI Layer
- **LLMs:** Claude API (Anthropic) — primary across all products
- **Embeddings:** OpenAI Embeddings (text-embedding-3-small)
- **Vector DB:** pgvector (PostgreSQL extension)
- **Prompt Management:** Centralized prompt library (shared across products)

### Shared Components
- **UI Library:** shadcn/ui (shared design system)
- **Auth Components:** Login, signup, password reset (reusable)
- **Billing Components:** Subscription management, invoicing, usage tracking
- **AI Components:** Chat interface, document generation, confidence scoring

### Monitoring & Analytics
- **Errors:** Sentry (centralized error tracking)
- **Performance:** Vercel Analytics
- **Product Analytics:** Posthog (self-hosted, GDPR compliant)
- **Logs:** Centralized logging (Vercel + Supabase)

**Cost Savings:**
- Each new product: 50% less development time (reuse infra)
- Shared monitoring/analytics: 1 subscription, not N subscriptions
- Shared learnings: Prompt patterns, UI patterns, growth tactics

---

## Organization Structure

### Legal Structure (Switzerland)

**Decision: Option A — Holding + subsidiaries**

```
bitbaum AG (Holding)
├── orangecat GmbH (SaaS — live)
├── hirn.li GmbH (SaaS — pre-launch)
├── FleetCrown GmbH (SaaS — private development)
└── botsmann GmbH (SaaS — concept)

Revamp-IT (Verein / nonprofit — independent, not part of bitbaum)
```

**Why Option A:**
- hirnli plans a seed round (CHF 500k, Q3 2026) — this requires a separate cap table; doing it under a single entity would dilute all other products
- If one product fails, the others are legally protected
- ByteDance model: holding coordinates, subsidiaries operate independently
- Tax optimization across CH cantons becomes possible per entity
- Revamp-IT is legally incapable of being "owned" (Swiss Verein law)

**Action:** Register bitbaum AG as holding entity (Zug canton preferred for tax). Incorporate hirn.li GmbH first (closest to revenue). orangecat GmbH second. Consult Swiss startup lawyer before first external investment.

---

### Team Structure (Year 1)

**Founder (You):**
- Product strategy (which products to build, what features)
- Sales & partnerships (first 100 customers per product)
- Fundraising (if/when needed)

**AI Engineer (Contract, 20hr/week):**
- Prompt engineering, RAG, vector search
- Shared AI layer (used by all products)

**Designer (Contract, 10hr/week):**
- UI/UX for new products
- Maintain shared design system

**Full-Stack Engineer (FTE, hired after CHF 1M ARR):**
- Platform stability, performance
- Shared infrastructure maintenance

**Philosophy:** Stay lean. Use AI agents for everything else. Don't hire until pain is unbearable.

---

## Business Model

### Revenue Streams

| Product | Model | Year 1 ARR (from launch) | Year 3 ARR (from launch) |
|---------|-------|--------------------------|--------------------------|
| hirn.li | SaaS + success fees | CHF 1.2M | CHF 8.9M |
| botsmann | Marketplace (30% take rate) | CHF 500k † | CHF 15M |
| orangecat | Platform fees + AI agent subscription | CHF 300k | CHF 2M |
| **2026 target (2 products)** | | **CHF 1.5M** ‡ | — |
| **Studio potential (all 3)** | | — | **CHF 25.9M** |

*† botsmann is pre-launch in 2026 (concept validation phase); its Year 1 ARR begins from its own launch date, expected 2027. Not included in the 2026 revenue target.*

*‡ "2026 target" = sum of each product's own Year 1 ARR from launch: orangecat CHF 300k + hirn.li CHF 1.2M. hirn.li Year 1 closes Q2 2027 (Investment vertical launches Q1 2027, its own Year 1 = hirn.li Year 2). Calendar year 2026 combined = CHF 1.1M (hirn.li Verein + Kapital only).*

### Profitability

**Year 1 Costs:**
- Salaries: CHF 8k/month × 12 = CHF 96k
- Cloud (all products): CHF 2k/month × 12 = CHF 24k
- AI API (all products): CHF 5k/month × 12 = CHF 60k
- Tools: CHF 2k/month × 12 = CHF 24k
- Marketing: CHF 5k/month × 12 = CHF 60k
- Legal/Accounting: CHF 2k/month × 12 = CHF 24k
- **Total:** CHF 288k

**Year 1 Profit (orangecat + hirn.li, period through Q2 2027):** CHF 1.1M revenue (orangecat CHF 300k + hirn.li CHF 800k period-based) - CHF 288k costs = **CHF 812k profit (74% margin)**

*The CHF 1.5M "2026 target" in the table above uses the Year 1 ARR-from-launch aggregate (which includes Investment's CHF 400k first-year target from its Q1 2027 launch). The CHF 1.1M figure here reflects period-based revenue actually recognised through Q2 2027.*

**Why so profitable?**
- Lean team (1 FTE + 2 contractors)
- AI does the heavy lifting
- Shared infrastructure (economies of scale)
- No expensive offices or perks

---

## Funding Strategy

### Phase 1 — Bootstrap (Now → CHF 1M ARR)
- orangecat is live (first product, personal capital deployed)
- hirn.li launching Q2 2026 with personal capital (CHF 50-100k)
- Both products target profitability within 12 months
- No external capital until PMF is proven

### Phase 2 — hirn.li Seed Round (Q3 2026)
- Raise: CHF 500k
- Valuation: CHF 4-5M pre-money (hirn.li GmbH only — separate cap table)
- Use: 1-2 engineering hires, sales, customer success for Verein vertical
- Trigger: First 20 paying customers + clear path to CHF 600k ARR

### Phase 3 — Studio-Level Raise (After CHF 2M ARR across 2+ products)
- Raise CHF 2-3M at bitbaum AG holding level (10-15% dilution)
- Use for: Shared engineering team (3-5 people), marketing scale, next product launch

### Long-Term Vision
- Build to CHF 25.9M ARR (2029 — when all three products reach Year 3 from launch)
- Exit options:
  - **Acquisition:** Strategic buyer per product (e.g., Salesforce for hirn.li)
  - **Stay independent:** Swiss Basecamp model — profitable, no VC pressure
  - **IPO:** Only at CHF 50M+ ARR (unlikely near-term)

**Preference:** Stay independent as long as possible. Profitability = freedom.

---

## Competitive Advantages

### 1. AI-First from Day 1
- Incumbents retrofitting AI into old products (slow, clunky)
- We design for AI from scratch (fast, native)

### 2. Verticalization
- Horizontal platforms (Salesforce, HubSpot) too generic
- We go deep in specific verticals (better product, stronger moat)

### 3. Speed
- AI-assisted development = 10x faster shipping
- Launch new products in 4-6 weeks (vs 6-12 months traditional)
- Iterate based on feedback daily (not quarterly)

### 4. Shared Infrastructure
- Each new product: 50% faster to build (reuse infra)
- Cost per product decreases as we add more (economies of scale)

### 5. Owner-Operator
- Founder builds products, talks to customers, writes code
- No bureaucracy, no politics, no misaligned incentives
- Fast decisions, high quality output

---

## Success Metrics (Company-Wide)

### Year 1 (2026–Q2 2027) — Targets
- [ ] 2 products generating revenue (orangecat + hirn.li)
- [ ] CHF 1.1M ARR (orangecat CHF 300k + hirn.li CHF 800k — Verein + Kapital; Investment launches Q1 2027 with first deals recognised in Year 2)
- [ ] Profitable at studio level
- [ ] 100+ paying customers across active products
- [ ] Team of 3 (1 FTE + 2 contractors)
- [ ] hirn.li seed round closed (Q3 2026)

### Year 2 (2027) — Targets
- [ ] 3 products live (+ botsmann MVP)
- [ ] CHF 3.9M ARR (hirn.li CHF 2.6M + botsmann CHF 500k + orangecat CHF 800k)
- [ ] CHF 2.8M profit (~72% margin)
- [ ] 2,000+ customers
- [ ] Team of 8

### Year 3 (2028) — Targets
- [ ] 3-4 products live
- [ ] CHF 13.9M ARR (hirn.li CHF 8.9M + botsmann CHF 3M + orangecat CHF 2M)
- [ ] CHF 10M profit (72% margin)
- [ ] 10,000+ customers
- [ ] Team of 15

---

## Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Revamp-IT structure** | Separate nonprofit (Verein) — not part of bitbaum | Swiss law bars for-profit ownership of a Verein; same founder, different entities |
| **Legal setup** | Option A: bitbaum AG (Holding) + per-product GmbH subsidiaries | hirnli seed round requires separate cap table; product isolation; ByteDance model |
| **Domain strategy** | Per-product domains + bitbaum.ch as corporate/holding site | orangecat.ch and hirn.li already live; products are consumer brands, bitbaum is the studio |
| **Branding** | Individual brands per product | Each product owns its vertical; bitbaum is invisible to end users (like ByteDance) |
| **orangecat monetization** | Activate fees after critical mass in ≥1 entity type | Charging before network density reduces adoption; validate commerce/funding volume first |

---

## Next Steps

1. **Scale orangecat** — Grow active economic actors, identify which entity types drive the most organic transaction volume
2. **Launch hirn.li Verein MVP** — Onboard Revamp-IT + 10 NGO free pilots first, then convert to paid; target 50 paying Swiss NGO customers by EOY 2026 (Q2 2026 MVP ship)
3. **Incorporate bitbaum AG** — Holding entity (Zug canton); then hirn.li GmbH before first external investment
4. **Validate botsmann** — Interview 20 SMBs on AI agent marketplace demand before building
5. **Register bitbaum.ch** — Corporate/investor-facing site; keep product domains independent
6. **Register fleetcrown.com** — Locked as the FleetCrown product domain (2026-06-02); still unregistered while the app runs live at fleetcrown.orangecat.ch. The open brand/domain decision blocks paid marketing, not the product

---

*One company. Many products. All AI-powered. All profitable.*
