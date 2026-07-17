# bitbaum

Strategic planning repository for the bitbaum AI product studio.

@~/.claude/CLAUDE.md

## Mission

bitbaum is a solo-founder AI product studio: multiple vertical SaaS products on shared infrastructure, each profitable within 12 months, each owning a specific niche. This repo is the strategic single source of truth — keeping vision, financial targets, and product decisions consistent across simultaneous builds so the founder never has to re-derive context from scratch.

---

## What This Repo Is

This is a **documentation-only** repository — no code, no tests, no deployments. It contains the strategic vision, product specs, and business plans for all bitbaum products.

## Structure

```
README.md          — Company overview, portfolio, shared infra, business model
projects/
  orangecat.md     — AI-native economic platform (live at orangecat.ch)
  hirnli.md        — Fundraising intelligence platform (pre-launch, Q2 2026)
  botsmann.md      — AI agent marketplace (concept validation)
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
