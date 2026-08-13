# printcraft — Scene Composer for Physical Art

**Status:** Active Development (Live app + manual pipeline; first client in progress)
**Tagline:** Separate photos of real people → one unified AI artwork with recognizable faces, engineered for a physical surface
**URL:** [printcraft.orangecat.ch](https://printcraft.orangecat.ch)
**Codebase:** `/home/g/dev/printcraft/` (only `app/` ships — the repo-root `src/` is a documented stale duplicate from 2026-03, unioned in by an unrelated-history merge; nothing builds it)

---

## Executive Summary

"NOT a collage app, NOT a filter app." printcraft composes separate photos of real people into one unified AI artwork with recognizable faces, engineered for a specific physical surface: shower wall, canvas, tile mural, metal print. The bet: "the output is always physical; digital-only has no soul."

**First client is real and concrete:** Roli's houseboat shower wall (`projects/duschwand-roli/` — L-corner 80×200cm + 120×200cm panels at 150 DPI, brief, 7 iteration rounds, seeder script). The repo's own stated Phase-1 goal: "Replace the manual workflow we've been doing for Roli's Duschwand… Solve Roli's Duschwand first. That's the real test."

**What's built:** 5-step web flow — surface → style → figures → compose → export — with projects, APIs, and surface presets (`shower-2-panel`, `canvas-large` 100×70, `poster-a1`, custom); plus a separate Python generation/compositor pipeline. Image provider: Grok (xAI Aurora), free tier for MVP.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js 16, React 19, Tailwind 4 (app/ dir only) |
| Backend | Self-hosted Supabase (supabase.orangecat.ch, schema printcraft) |
| Auth | Email + magic link (no social at MVP) |
| Generation | Python pipeline (printcraft/cli.py, PIPELINE.md); Grok (xAI Aurora) free tier |
| Deployment | Self-hosted Hetzner |

---

## Business Model

- **Pricing designed, zero lines implemented:** Simple (1–3 figures, single panel) **CHF 29** · Group (4–8, multi-panel) **CHF 59** · Epic (9–20, any surface) **CHF 99** — defined in CLAUDE.md only; no CHF/price string exists anywhere in app code, no processor.
- Flagged in the fleet audit as the **smallest gap to first revenue**: a priced offer + a real paying-shaped client, missing only delivery and an invoice.
- Revenue to date: CHF 0

---

## Distribution

**What exists today:** one OG image route.

**Not yet — fleet standard pending:** no sitemap, no robots, no blog, no RSS, no newsletter, no social queue.

---

## Go-to-market

- **ICP (by use case, ordered by emotional depth):** #1 memorial — bring a deceased loved one into a family photo; then family/friends reunification scenes. Buyers of physical keepsake art, not digital images.
- **Positioning one-liner:** everyone you love, in one artwork, on a real surface.
- **Shortest first-paying-customer path:** finish and deliver Roli's Duschwand (manual pipeline is fine), invoice it — first revenue and first case study in one step. Then productize the exact workflow that delivery exercised.
- **Monetization state:** tiers priced on paper; nothing wired. Invoice-first is the honest MVP.
- **Key metrics to move:** Roli delivery shipped · first invoice paid · time-per-artwork through the pipeline (manual → assisted).
