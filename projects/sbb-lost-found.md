# sbb-lost-found — Real-Time Lost-Item Recovery for Swiss Public Transport

**Status:** Concept / Demo (Live on mock data; no commercial relationship)
**Tagline:** Connect the passenger to train staff while the item is still on board
**URL:** [sbb.orangecat.ch](https://sbb.orangecat.ch)
**Codebase:** `/home/g/dev/sbb-lost-found/` (deployed = `frontend/` only; no database in the deploy registry — the live site runs on mock data)

---

## Executive Summary

The thesis: 1.2M items are lost annually in Swiss public transport with ~25% recovery. Items reported **within 30 minutes have >70% recovery**; after 24h it drops to ~25%. The entire architecture exists to collapse that time gap: report <1 min → staff push <30 sec → search during the trip → passenger update <30 min.

**Honest completeness:** of four designed microservices, only Reporting is fully implemented; Matching, Notification, and the API Gateway are stubs with defined interfaces. The frontend is 3 pages (passenger, staff, demo/concept overview) with real-time hooks and graceful fallback to mock data. Notable engineering discipline: strict SSOT (types → labels → Zod schemas → design system all derive; adding an item category = 2 edits).

**No SBB relationship is documented anywhere in the repo** — this is an unsolicited concept build. Least active fleet repo (last substantive commit 2026-07-22; default branch is `master`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind 3, Zod 4 (oldest stack in the fleet) |
| Backend design | Express microservices + PostgreSQL + Redis pub/sub + Socket.io (3 of 4 services stubs) |
| Infra artifacts | Docker Compose + k8s manifests (not deployed) |
| SSOT discipline | types.ts → labels.ts → schemas.ts → design-system.ts all derive; category add = 2 edits |
| Deployment | frontend/ only on Hetzner, mock-data fallback |

---

## Business Model

- **Monetization state: none, and none conceivable as built** — the buyer would be SBB / transport operators (B2B), and no contact, pilot, or procurement path exists.
- Revenue to date: CHF 0

---

## Distribution

**Nothing at all** — the only fleet project with zero distribution surface: no sitemap, no robots, no OG, no blog, no RSS, no newsletter, no social queue. Fleet standard pending, low priority.

---

## Go-to-market

- **ICP:** passengers (B2C side) and train staff / Fundbüro operations (B2B side — i.e. SBB itself as the buyer).
- **Positioning one-liner:** recover the item while it's still on the train.
- **Shortest first-paying-customer path:** none exists — would require an SBB innovation/procurement contact that has never been made. Honest status: portfolio/concept piece demonstrating the real-time architecture.
- **Monetization state:** none.
- **Key metrics to move:** none active. The demo's only current job is being a credible concept when shown.
