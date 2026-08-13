# biaslens — Media Bias Analysis Engine

**Status:** Experimental (step 1 of 6 built, no deploy, dark)
**Tagline:** Evidence before conclusions — separate fact from framing, measure uncertainty, every score explainable
**URL:** none — CI only, never deployed; requires a Postgres that is not provisioned anywhere in-repo
**Codebase:** `/home/g/dev/biaslens/` (public GitHub repo, 4 commits)

---

## Executive Summary

Aspires to be the "Bloomberg Terminal for media analysis"; bootstrapped by FleetCrown from a product/engineering spec. **What actually exists is small:** the core data model (7 Prisma models: Outlet, Article, Claim, Evidence, Narrative, EditorialDna, HomepageSnapshot; one applied migration), a 27-line homepage, one EvidenceVerifier component, two claim-verification API routes, and tested domain logic for claim verification. Steps 2–6 of the roadmap (extraction/claim agents, scoring engine, homepage loop, counterfactual headlines, public dashboard) are unbuilt; the "11 specialized agents" architecture is target-state, not implemented.

Stack: Next.js 15, React 19, TypeScript strict, Prisma 6 + Postgres, Vitest.

---

## Business Model

- **Monetization state: none.** No pricing, no processor, no deploy.

---

## Go-to-market

- **ICP:** unvalidated — media-literacy readers, researchers, newsrooms. Conceptual overlap with truthseeker (rebuttal generator); consolidation is the honest question before either gets investment.
- **Shortest first-paying-customer path:** none — the next milestone is a running instance, not a customer.
- **Key metrics to move:** none active.

---

## Distribution

None — no `public/` dir at all, no OG/robots/sitemap, no blog/RSS/newsletter/social. Fleet standard pending a deploy decision.
