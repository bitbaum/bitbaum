# truthseeker — First-Principles Rebuttal Generator

**Status:** Experimental (v0.1, no deploy, dark)
**Tagline:** Paste an article → claims split into factual/normative/causal, first-principles critique, source and author transparency
**URL:** none — CI only, never deployed
**Codebase:** `/home/g/dev/truthseeker/` (public GitHub repo, 7 commits)

---

## Executive Summary

Self-described "v0.1 — text-only, English + German articles": paste an article URL (or text) and get structured output — core claims classified, first-principles critique, named sources and people quoted, author/publication bias notes. Historically notable as **the first dogfood project of the FleetCrown bootstrap loop** (documented in a published FleetCrown essay).

**What's built:** one page, one API route (`/api/analyze`), a small lib (LLM via Groq `llama-3.3-70b`, provider swappable), and a CLI that writes analyses to markdown — one sample analysis committed. Roadmap items (permanent analysis URLs, author profiles, transcript analysis) are unbuilt.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Groq. Single env var.

---

## Business Model

- **Monetization state: none.** No pricing, no processor, no deploy.

---

## Go-to-market

- **ICP:** unvalidated — readers who want claims separated from framing. Overlaps conceptually with biaslens (media bias engine); if either advances, they should probably converge rather than compete for the same slot.
- **Shortest first-paying-customer path:** none — not deployed. First step would be a live URL, not revenue.
- **Key metrics to move:** none active.

---

## Distribution

None — no live URL, no blog/RSS/OG/newsletter/social. Fleet standard pending a deploy decision.
