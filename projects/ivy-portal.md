# ivy-portal — Personal Assistant Dashboard (localhost)

**Status:** Personal Tool (no deploy, not a product)
**Tagline:** "Localhost god mode" — one page showing everything Ivy (George's AI assistant) knows and manages
**URL:** none public — localhost:18790, personal Tailscale access only
**Codebase:** `/home/g/dev/ivy-portal/` (public GitHub repo, 6 commits)

---

## Executive Summary

A single-page personal dashboard over George's OpenClaw/"Ivy" assistant infrastructure: Express + vanilla HTML/CSS/JS (deliberately no frameworks, no build step), better-sqlite3, ~280-line server with 10 read-only API routes (system, calendar, finance, projects, email, crons, commitments, knowledge, style, memory), plus Telegram/WhatsApp message indexers. Runs via a local systemd unit; no auth (localhost-only by design).

**Note:** the repo is public while the code reads personal data paths (finance, email, knowledge) — data files live outside the repo, but visibility is worth a deliberate decision.

---

## Business Model

- **Monetization state: none, and none intended** — this is personal infrastructure, not a product.

---

## Go-to-market

- **ICP / positioning / first-customer path:** not applicable. If the "personal life OS" thesis ever productizes, that path runs through FleetCrown (which already has the Today/People/Money surfaces multi-user), not this repo.
- **Key metrics to move:** none.

---

## Distribution

None — no site, blog, RSS, OG, newsletter, or social assets, and correctly so for a personal tool. Fleet distribution standard: not applicable.
