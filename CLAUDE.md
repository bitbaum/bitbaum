# bitbaum

Strategic planning repository for the bitbaum AI product studio.

@~/.claude/CLAUDE.md

## Mission

bitbaum is a solo-founder AI product studio: multiple vertical SaaS products on shared infrastructure, each profitable within 12 months, each owning a specific niche. This repo is the strategic single source of truth — keeping vision, financial targets, and product decisions consistent across simultaneous builds so the founder never has to re-derive context from scratch.

---

## Infrastructure (Hetzner — not Neon)

Every live product database is PostgreSQL on the Hetzner box **bitbaum** (`167.233.22.31`). The fleet list is `~/dev/fleetcrown/scripts/hetzner/apps.conf`. Neon, Vercel Postgres and hosted Supabase were left on **2026-06-12**. They are not a fallback. A laptop `.env` naming `neon.tech` is leftover garbage; Prisma/Drizzle will load it and time out — that is not "production is down". Env SSOT is `/opt/<app>/shared/.env` on the box.

AOZ Wohnen: database `aoz_wohnen`, app `/opt/aoz-wohnen/`, https://aoz-wohnen.orangecat.ch.

## What This Repo Is

This is a **documentation-only** repository — no code, no tests, no deployments. It contains the strategic vision, product specs, and business plans for all bitbaum products.

## Structure

```
README.md          — Company overview, portfolio, shared infra, business model
projects/          — one brief per fleet project, named after
                     the repo dir under ~/dev so FleetCrown's enrichment pipeline
                     can ingest projects/<name>.md. Each brief carries status,
                     business model, ## Distribution, and ## Go-to-market sections.
docs/              — (reserved for cross-product docs, legal templates, etc.)
```

## Product Codebases

| Product | Directory | Status |
|---------|-----------|--------|
| orangecat | `/home/g/dev/orangecat/` | Live |
| hirn.li | `/home/g/dev/hirnli/` | Pre-launch |
| botsmann | — | Concept only |
| revampit | `/home/g/dev/revampit/` | Active (separate entity) |

## Conventions for This Repo

- **Accuracy over completeness** — never leave placeholder text (`[TBD]`, `[To be defined]`) once the product direction is known
- **One source of truth per product** — `projects/<product>.md` is authoritative; README portfolio entry is a summary that links to it
- **Status must be current** — update status fields whenever a product's stage changes
- **No fake metrics** — revenue projections are estimates/targets, always labeled as such
