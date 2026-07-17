# hirn.li — Fundraising Intelligence Platform

**Status:** Pre-Launch Development (Q2 2026 launch)
**Tagline:** "Replace your fundraising team with AI"
**Domains:** hirn.li, hirnli.com
**Target Market:** Swiss NGOs, startups seeking VC, mid-market M&A
**Codebase:** `/home/g/dev/hirnli/`

---

## Executive Summary

**hirn.li** replaces fundraising professionals with AI-powered intelligence systems. From NGO Gesuch documents to VC pitch decks to M&A deal rooms — the platform automates 80% of capital-raising work through pattern matching, relationship management, and document generation.

**Business Model:** SaaS (Verein) + Success fees (Kapital, Investment)
**Revenue Target:** CHF 800k ARR (Year 1 period, Q2 2026–Q2 2027) · CHF 1.2M aggregate first-year target across all three verticals from their launch dates → CHF 8.9M ARR (Year 3)

---

## The Insight

While building Revamp-IT's fundraising system, the pattern became clear:

- Foundation research = pattern matching (funder priorities → programs)
- Application writing = template + customization per funder
- Relationship management = CRM + context tracking
- Budget creation = scenario modeling + source attribution

**All automatable.** And if it works for Swiss NGOs, the same playbook applies to startups seeking VC, companies seeking PE, and corporations needing investment banking.

---

## Three Verticals

### 1. Verein — NGO Fundraising (Launch: Q2 2026)

**Target:** Swiss NGOs, foundations, social enterprises
**Proof:** Revamp-IT (Customer #1 — proof of concept already working)

**Features:**
- Foundation intelligence database (500+ Swiss foundations)
- Automated Gesuch (application) generation
- Deadline tracking & relationship CRM
- Budget scenario modeling
- Impact metrics dashboard

**Pricing:**
- Freemium: 5 foundations
- Pro: CHF 99/month (unlimited foundations)
- Enterprise: CHF 499/month (multi-org, white-label)
- Large Foundation / Federation: Custom pricing (contact for quote)

**Year 1 Target:** 50 customers (mix of Pro / Enterprise / custom), CHF 600k ARR

### 2. Kapital — VC/PE Fundraising (Launch: Q3 2026)

**Target:** Startups (seed to Series B), growth companies

**Features:**
- Investor database (500+ VCs/PE firms)
- Pitch deck generator
- Cap table modeling
- Deal room automation
- Investor matching algorithm

**Pricing:** Success-based — 1% of funds raised (min CHF 5k, max CHF 50k) + CHF 2k/month retainer for active campaigns

**Year 1 Target:** 10 campaigns, CHF 200k revenue

### 3. Investment — IB-as-a-Service (Launch: Q1 2027)

**Target:** Mid-market M&A, real estate, project finance

**Features:**
- Deal sourcing & buyer matching
- Financial modeling suite
- Valuation calculators
- Document automation (CIM, teaser, NDA)
- Transaction pipeline management

**Pricing:** Success-based — 1-2% of deal value (vs 3-5% traditional IB) + CHF 10k+/month retainer

**Year 1 Target:** 2-3 deals, CHF 400k revenue

---

## Business Model

| Vertical | Model | Year 1 ARR | Year 2 ARR | Year 3 ARR |
|----------|-------|------------|------------|------------|
| Verein | SaaS (CHF 99-499/mo + custom) | CHF 600k | CHF 1.4M | CHF 2.4M |
| Kapital | Success fees (1%) | CHF 200k | CHF 800k | CHF 1.5M |
| Investment | Success fees (1-2%) | — | CHF 400k | CHF 5M+ |
| **Total** | | **CHF 800k** | **CHF 2.6M** | **CHF 8.9M** |

*Year 1 period (Q2 2026 – Q2 2027): CHF 800k from Verein + Kapital only; Investment launches Q1 2027 but closes no deals before Year 1 ends. Year 2 Investment entry (CHF 400k) = Investment's own first-year target from its Q1 2027 launch. The CHF 1.2M figure cited in the Executive Summary and elsewhere is the aggregate of each vertical's first-year target from its own launch date (Verein CHF 600k + Kapital CHF 200k + Investment CHF 400k) — a common way to express staggered-launch SaaS potential.*

### Unit Economics (Verein — Pro tier, conservative baseline)

- **CAC:** CHF 500 (content + outbound)
- **LTV:** CHF 3,564 (36 months × CHF 99)
- **LTV:CAC:** 7.1x
- **Gross margin:** 85%+
- **Payback period:** 5 months

*Enterprise and custom tiers improve LTV and payback significantly; Pro-tier figures used as conservative model.*

---

## Go-to-Market

### Phase 1 — Verein (Q2–Q4 2026)
1. Launch with Revamp-IT as live showcase customer
2. Free 2-month pilots for 10 Swiss NGOs → convert to paid
3. Partnerships with Swiss foundation networks and consultants
4. Content marketing: foundation fundraising guides, case studies
5. **Target:** 50 paying customers by EOY 2026

### Phase 2 — Kapital (Q3 2026 – Q2 2027)
1. Seed investor database: 500+ Swiss + EU VCs/PE firms
2. Accelerator partnerships: F10, Impact Hub, Venture Kick
3. First 3 campaigns → case studies for social proof
4. **Target:** 20 active campaigns by Q2 2027

### Phase 3 — Investment (Q1 2027+)
1. White-label partnership with boutique investment banks
2. Real estate pilot: 3-5 developer projects
3. **Target:** 5+ deals closed by EOY 2027

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC) |
| Database | Supabase (PostgreSQL + RLS multi-tenant) |
| Auth | Supabase Auth (magic links, OAuth) |
| AI | Claude API (document generation, RAG) |
| Search | OpenAI Embeddings (foundation/investor matching) |
| Storage | Supabase Storage (documents, PDFs) |
| Email | Resend |
| Payments | Stripe |
| Hosting | Vercel |

### Multi-Tenant Architecture
Row-Level Security in Supabase. Organization-based isolation — every user belongs to an org. Shared schema, isolated data. White-label ready (custom branding per org).

### AI Layer
- **Document generation:** Prompt engineering + RAG over foundation/investor database
- **Matching:** Vector embeddings for funder similarity scoring
- **Background agents:** Cron jobs for research updates and deadline reminders
- **Quality control:** Human-in-loop review before document submission

---

## Competitive Landscape

| Competitor | Strength | Weakness | Our Advantage |
|------------|----------|----------|---------------|
| Manual research / consultants | Trusted, contextual | Expensive, slow, not scalable | 10x faster, 80% cheaper |
| Generic CRMs (Salesforce, HubSpot) | Mature product | Not fundraising-specific, no AI | Domain-specific AI, zero setup |
| Grant management software | Specialized | No AI, weak search | AI-generated applications, better matching |
| DIY ChatGPT | Free | No database, no CRM, no workflow | Structured database + integrated workflow |

**Moat:**
1. Foundation/investor database (proprietary, improves with every interaction)
2. Network effects (more matches → better pattern matching → better results)
3. Founder-market fit (built while solving Revamp-IT's own problem)

---

## Risks & Mitigation

### Risk 1: Slow NGO Sales Cycles
**Likelihood:** High
**Mitigation:** Free pilots lower barrier; Revamp-IT as reference customer; target smaller agile NGOs first

### Risk 2: AI Output Quality
**Likelihood:** Medium
**Mitigation:** Human-in-loop review; confidence scoring; explicit "AI draft — review before submitting" UX

### Risk 3: Regulatory / Data Privacy
**Likelihood:** Low
**Mitigation:** Supabase hosted in EU; Swiss data residency option; no PII shared with external models beyond prompt scope

---

## Success Metrics

### Year 1 (Q2 2026 – Q2 2027)
- 50 paying customers (Verein)
- CHF 600k ARR (Verein)
- 10 active campaigns (Kapital)
- CHF 800k ARR from Year 1 period (Verein CHF 600k + Kapital CHF 200k; Investment launches Q1 2027 — first deals recognized in Year 2)
- NPS > 50

### Year 2 (Q2 2027 – Q2 2028)
- CHF 1.4M ARR (Verein)
- CHF 800k ARR (Kapital) — ~40 active campaigns
- CHF 400k revenue (Investment, first full year from Q1 2027 launch — 5+ deals closed by EOY 2027)
- CHF 2.6M total ARR
- NPS > 50
- EU expansion scoped

### Year 3 (Q2 2028 – Q2 2029)
- 500+ customers across all verticals
- CHF 8.9M ARR
- 85%+ gross margin
- Team of 10-12
- EU expansion launched

---

## Next Steps

1. Stand up Next.js + Supabase development environment
2. Build Verein MVP (4-6 weeks)
3. Launch with Revamp-IT (Q2 2026)
4. Onboard first 10 pilot customers and iterate
5. Scale to 50 paying customers by EOY 2026

---

*Less painful capital-raising. More intelligent outcomes.*
