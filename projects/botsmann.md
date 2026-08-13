# botsmann — AI Agent Marketplace

**Status:** Concept Validation
**Tagline:** "The App Store for AI Agents"
**Target Market:** SMBs (50-500 employees) needing AI automation

---

## Hypothesis

botsmann is a marketplace where businesses discover, try, and buy pre-built AI agents for specific tasks (customer support, lead qualification, content writing, data analysis, etc.). Creators list agents; businesses deploy them without engineering help.

**Business Model:** 30% marketplace take rate (creator keeps 70%)
**Revenue Target:** CHF 500k (Year 1 from launch, 2027) → CHF 15M (Year 3)

---

## The Problem

### For Businesses (Buyers)
1. **Want AI but don't know how** — Building agents from scratch requires ML engineers (CHF 150k+/year)
2. **Generic tools don't work** — ChatGPT is too generic; no business context, no integrations
3. **Can't evaluate quality** — No way to know if an agent works before committing
4. **Integration is complex** — Requires engineering to deploy and maintain

**Market gap:** No easy way to buy pre-built, vertical-specific AI agents.

### For Agent Creators (Sellers)
1. **No distribution** — Great agent, no customers
2. **Hard to monetize** — Have to handle sales, payments, support yourself
3. **Reinventing the wheel** — Every creator rebuilds auth, payments, hosting from scratch

**Market gap:** No marketplace for selling AI agents.

---

## Solution

A two-sided marketplace: creators list agents (prompt templates or code), businesses try for free (100 tasks), then subscribe. botsmann handles hosting, payments, support, and refunds. Bootstrap with 10 seed agents built in-house to avoid cold-start.

**Key differentiator:** Vertical-specific, quality-curated (every agent tested before listing), no-code deploy (API + Zapier + embed widget).

---

## Business Model

| Stream | Rate | Notes |
|--------|------|-------|
| Marketplace fee | 30% of GMV | Primary; creator keeps 70% |
| Premium listings | CHF 500–5k/month | Featured placement, category sponsorship |
| Enterprise white-label | CHF 5k/month + 10% GMV | Future; post-PMF |

**Year 1 unit economics hypothesis:** 100 agents × 18 customers × CHF 79/month avg × 30% take = ~CHF 500k revenue. Requires validation.

---

## Competitive Landscape

| Competitor | Weakness | Our Angle |
|------------|----------|-----------|
| OpenAI GPT Store | Generic, consumer-focused | Vertical-specific, SMB-focused |
| HuggingFace | Too technical | No-code, business users |
| Zapier | Not AI-native | AI-first, better agent quality |
| DIY | Expensive, slow | 10x faster, 90% cheaper |

---

## Risks

| Risk | Likelihood | Key Question to Validate |
|------|------------|--------------------------|
| Low creator adoption | Medium | Will AI engineers list for 70% share with no audience? |
| Quality control at scale | Medium | Can botsmann review agents fast enough to keep quality high? |
| OpenAI/Anthropic launches marketplace | Low (2yr) | Can we build vertical moat before they enter? |

---

## Validation Plan

**Gate: build only if both conditions are met.**

1. **Buyer demand** — Interview 20 SMBs: "Would you pay CHF 99/month for a customer support AI agent?" Target: ≥50% say yes and name a specific use case they'd automate immediately.
2. **Seller supply** — Interview 10 AI engineers: "Would you list an agent here for 70% revenue share?" Target: ≥5 willing to list within 4 weeks of launch.

**If validated:** Build MVP in 4-6 weeks (marketplace, checkout, API, 3 seed agents) → Product Hunt launch → recruit creators.

---

## Distribution

**Reality check:** the deployed app at [botsmann.orangecat.ch](https://botsmann.orangecat.ch) is currently "six domain-specialized AI professionals" (Lex/Imhotep/Nerd/Heidi/Muse/Trident, multi-LLM routing Ollama → Groq → OpenRouter) — not yet the marketplace described above. `botsmann.com` has lapsed nameservers; the app serves on the orangecat.ch subdomain.

**What exists today:**
- Blog: 3 static posts at `/blog` (welcome, future-of-shopping, libertech-revolution)
- RSS / sitemap / OG cards / newsletter capture / social queue: **none — fleet distribution standard pending**
- Social accounts: none

**Planned:** fleet distribution standard (RSS + sitemap + OG cards + newsletter capture + share buttons + social queue) when next touched — per fleet GTM (2026-08), no distribution push here until a revenue-priority project has a paying customer.

---

## Go-to-market

- **ICP:** SMBs (50–500 employees) wanting task-specific AI without ML engineers; near-term, users wanting a domain-calibrated AI professional over a generic chatbot.
- **Positioning one-liner:** "Domain-specialized AI professionals, not another generic chatbot wrapper."
- **Shortest first-paying-customer path:** none active — botsmann sits below the fleet's top-4 revenue priorities; the validation gates above must pass first (≥50% of 20 interviewed SMBs would pay CHF 99/mo; ≥5 of 10 creators would list).
- **Monetization state:** no pricing page, no payment processor, no revenue. Marketplace take-rate model is hypothesis only.
- **Key metrics to move:** validation interview counts (buyer + seller gates). Until then: none — focus beats spread.

---

## Success Metrics

### Year 1 (2027, from launch)
- [ ] 100 agents listed (10 seed + 90 creator-built)
- [ ] ~1,800 paying customers
- [ ] CHF 500k revenue
- [ ] 50 active creators
- [ ] NPS > 50

### Year 3 (2029)
- [ ] 2,000 agents · 50,000 customers · CHF 15M revenue · 500 creators

---

*The future is agentic. We're building the infrastructure.*
