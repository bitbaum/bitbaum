# datacat — AI-Powered Data Ingestion & Form Platform

**Status:** Active Development (Live, no chosen vertical)
**Tagline:** Ingest → Analyze → Deliver — universal, white-labelable data capture
**URL:** [datacat.orangecat.ch](https://datacat.orangecat.ch)
**Codebase:** `/home/g/dev/datacat/` (deployed app = `frontend/` only; the Express `backend/` dir is local-dev legacy and is not deployed)

---

## Executive Summary

Universal AI-powered data ingestion and form-builder platform: drag-drop form builder, template library, public form renderer, submissions viewer, and multi-modal ingest pages (image, video, audio, website, database) plus an "Erfassung" capture flow. Domain-agnostic by design — `scripts/dev/rebrand.sh <vertical>` white-labels the whole platform in one command.

**AI pipeline:** GPT-4 Vision primary with Google Vision / AWS Textract / Tesseract.js failover; per-field confidence scores; 24h cache; WebSocket push on analysis complete.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3, React 19, TypeScript, Tailwind, Zustand |
| Database | Prisma + PostgreSQL; tRPC API routes |
| Queues | Redis + Bull |
| AI | GPT-4 Vision primary; Google Vision / AWS Textract / Tesseract.js failover |
| Deployment | Self-hosted Hetzner; frontend/ only (backend/ legacy, undeployed) |
| Known debt | Backend has zero tests (test script exits 1) |

---

## Business Model

- **Monetization state: none.** No pricing page, no payment code, no revenue.
- **No chosen ICP** — `VISION.md` lists illustrative verticals (healthcare, legal, manufacturing) but no customer segment has been picked or validated. The white-label mechanism exists precisely because the vertical is undecided.

---

## Distribution

**What exists today:** a contentlayer-backed blog with **exactly 1 post** (German, dated 2025-07); about page.

**Not yet — fleet standard pending:** no sitemap, no robots, no OG images, no RSS, no newsletter, no social queue.

---

## Go-to-market

- **ICP:** unknown — not chosen. The honest state: a capable horizontal tool waiting for a vertical.
- **Positioning one-liner (candidate):** turn any document, photo, or recording into structured data — no vertical committed yet.
- **Shortest first-paying-customer path:** none active; below the fleet's top-4 revenue priorities. A realistic path would be picking one vertical where the fleet already has a relationship (e.g. the RevampIT/evig intake orbit — evig's Erfassung pipeline is an adjacent problem) and white-labeling for it.
- **Monetization state:** none built.
- **Key metrics to move:** none active. First meaningful metric would be one external organization submitting real forms.
