# bitbaum

Strategic planning repository for the bitbaum AI product studio.

@~/.claude/CLAUDE.md

## Mission

bitbaum builds AI-native products on shared open infrastructure so more than one person can ship here and be treated fairly. This repo is the strategic single source of truth — keeping vision, financial targets, and product decisions consistent across simultaneous builds.

---

## What This Repo Is

This repository holds the strategic vision, product briefs and business plans for all bitbaum products — plus `site/`, the generator for bitbaum.orangecat.ch. The site is a VIEW: Before adding anything to the site, read `site/PURPOSE.md`: what it is for, who it serves, and what it must never claim. `site/build.mjs` renders Loki's public fleet map (https://loki.orangecat.ch/api/fleet/map), fleet's package and origin registers, and `site/overrides.json` (group, one line, story per venture) into `site/dist/` — a home page, a page per venture, packages, studio — and publishes a **redacted** agent map as `map.json` (catalogue fields only; ops changelog/now/next stay offline in the snapshot). Ventures are filed by STAGE (product, pilot, concept, next) — what a visitor can verify, never the register's kind: there are no clients, and the site must not say there are. The home grid filters by stage and field with the choice in the URL. The public name is Cato and the contact address is cato@orangecat.ch; a `mao@` address or the `catomean` handle is a superseded identity and must never appear on a page. Never say "one-person studio" or "solo-founder": the point of OrangeCat, Loki and Solon is that more than one person can build here. Never type a venture into the page; describe it in its Loki profile and it appears.

## Structure

```
README.md          — Company overview, portfolio, shared infra, business model
projects/          — human briefs for Loki enrichment and operator notes; NOT
                     read by site/build.mjs. Site copy lives in site/overrides.json
                     and hire.json. Briefs are archival / enrichment input.
docs/              — (reserved for cross-product docs, legal templates, etc.)
site/              — generator + dist for bitbaum.orangecat.ch (see site/PURPOSE.md)
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
- **One source of truth per product for strategy** — `projects/<product>.md` is the human brief; the live site catalogue is driven by Loki's map + `site/overrides.json`, not by those briefs
- **Status must be current** — update status fields whenever a product's stage changes
- **No fake metrics** — revenue projections are estimates/targets, always labeled as such
