# bitbaum

Strategic planning repository for the bitbaum AI product studio.

@~/.claude/CLAUDE.md

## Mission

bitbaum is a solo-founder AI product studio: multiple vertical SaaS products on shared infrastructure, each profitable within 12 months, each owning a specific niche. This repo is the strategic single source of truth — keeping vision, financial targets, and product decisions consistent across simultaneous builds so the founder never has to re-derive context from scratch.

---

## What This Repo Is

This repository holds the strategic vision, product briefs and business plans for all bitbaum products — plus `site/`, the generator for bitbaum.orangecat.ch. The site is a VIEW: `site/generate.mjs` renders Loki's public fleet map (https://loki.orangecat.ch/api/fleet/map — every project with purpose, layer, state, doors and last movement) and publishes it next to the page as `map.json`. Never type a venture into the page; describe it in its Loki profile and it appears.

## Structure

```
README.md          — Company overview, portfolio, shared infra, business model
projects/          — one brief per fleet project (20 briefs, 2026-08), named after
                     the repo dir under ~/dev so Loki's enrichment pipeline
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
| evig | `/home/g/dev/evig/` | Active (Live) |

## Conventions for This Repo

- **Accuracy over completeness** — never leave placeholder text (`[TBD]`, `[To be defined]`) once the product direction is known
- **One source of truth per product** — `projects/<product>.md` is authoritative; README portfolio entry is a summary that links to it
- **Status must be current** — update status fields whenever a product's stage changes
- **No fake metrics** — revenue projections are estimates/targets, always labeled as such
