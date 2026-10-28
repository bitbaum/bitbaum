# Agents — Bitbaum

<!-- fleet:rules:begin — generated from bitbaum/fleet templates/agent-rules.md; edit it there, not here -->

## Org rules

Read `bitbaum/fleet` `AGENTS.md`, `SHARED.md` and the registers it names before
inventing a host, a name, a page or a shared behaviour. Do not copy their facts
into this file.

- **Packages first.** If a `@bitbaum/*` package (or `bip-kit`, `limitkit`,
  `threadkit`, `ai-forms`) already does it, use it and fix a defect in the
  package, not in this app. Every chat is `@bitbaum/chatkit`, every search box
  `@bitbaum/searchkit`, every chart `@bitbaum/chartkit`, accounts
  `@bitbaum/accountkit`, model calls `@bitbaum/ai-kit`. Review this product's
  `package-plan.json` before building anything.
- **One shape per kind.** Things of the same kind look the same and sit in the
  same place (fleet `AGENTS.md`, "One shape per kind").
- **Finished work ships by itself.** Open a non-draft pull request; the fleet
  auto-merge sweep is the only merge path. Never merge by hand, through the
  merge API, with `--auto` or with an admin bypass, and never force-push a
  shared branch.
- **Nothing made up.** A fact on a page or in a doc needs a source that was
  opened; where there is none, the line is removed or softened.
- **Bitcoin orange is for Bitcoin and top-of-funnel actions only.**
- **No model identifier** in anything pushed to a repository.
- Before you finish, run `node <fleet>/scripts/ci/docs-truth-audit.mjs --dir .`:
  the same check the sweep runs on every pull request.

<!-- fleet:rules:end -->

Strategic planning repository for bitbaum, and the generator for its site, bitbaum.orangecat.ch.


Org rules are [bitbaum/fleet AGENTS.md](https://github.com/bitbaum/fleet/blob/main/AGENTS.md): packages by default (say why if you skip one), search through `@bitbaum/searchkit`, chat through `@bitbaum/chatkit`, shared names and the identity contract. Read that file. Do not restate it here.


## Mission

bitbaum builds AI-native products on shared open infrastructure so more than one person can ship here and be treated fairly. This repo is the strategic single source of truth — keeping vision, financial targets, and product decisions consistent across simultaneous builds.

---

## What This Repo Is

This repository holds the strategic vision, product briefs and business plans for all bitbaum products — plus `site/`, the generator for bitbaum.orangecat.ch. The site is a VIEW: Before adding anything to the site, read `site/PURPOSE.md`: what it is for, who it serves, and what it must never claim. `site/build.mjs` renders Loki's public fleet map (https://loki.orangecat.ch/api/fleet/map), fleet's package and origin registers, and `site/overrides.json` (group, one line, story per venture) into `site/dist/` — a home page, a page per venture, packages, studio — and publishes a **redacted** agent map as `map.json` (catalogue fields only; ops changelog/now/next stay offline in the snapshot). Ventures are filed by STAGE (product, pilot, development, concept, next — defined in `site/overrides.json` → `stages`) — what a visitor can verify, never the register's kind: there are no clients, and the site must not say there are. The home grid filters by stage and field with the choice in the URL. The public name is Cato and the contact address is cato@orangecat.ch; a `mao@` address or the `catomean` handle is a superseded identity and must never appear on a page. Never say "one-person studio" or "solo-founder": the point of OrangeCat, Loki and Solon is that more than one person can build here. Never type a venture into the page; describe it in its Loki profile and it appears.

## Structure

```
README.md          — the site: what it shows, how to build, verify and publish it
ROADMAP.md         — studio implementation plan (rendered at /roadmap/)
CHANGELOG.md       — completed changes (rendered at /changelog/)
projects/          — human briefs for Loki enrichment and operator notes; NOT
                     read by site/build.mjs. Site copy lives in site/overrides.json
                     and hire.json. Briefs are archival / enrichment input.
docs/              — studio delivery plan (commissioning-and-portals.md), the
                     painted-world pipeline (ART-PIPELINE.md) and the generated
                     cast register (CAST.md — written by site/build.mjs)
assets/            — logo and avatar files
site/              — generator + dist for bitbaum.orangecat.ch (see site/PURPOSE.md
                     and site/DEPLOY.md)
```

## Product Codebases

Every product repository is in the [`bitbaum` GitHub organisation](https://github.com/bitbaum).
Which ventures exist, their repository, address and state is Loki's fleet map
(https://loki.orangecat.ch/api/fleet/map) — read it there rather than keeping a
copy here. Publicly, nothing is "live": running services are beta, and every
other venture keeps its stage from `site/overrides.json`. Note that the map row
`revamp-info` is the repository `bitbaum/hirnli`.

## Conventions for This Repo

- **Accuracy over completeness** — never leave placeholder text (`[TBD]`, `[To be defined]`) once the product direction is known
- **One source of truth per product for strategy** — `projects/<product>.md` is the human brief; the live site catalogue is driven by Loki's map + `site/overrides.json`, not by those briefs
- **Status must be current** — update status fields whenever a product's stage changes
- **No fake metrics** — revenue projections are estimates/targets, always labeled as such

## Verification and package references

Read README.md and site/PURPOSE.md before changing the site. Run `pnpm test`,
`node site/build.mjs --offline`, `node site/build.mjs --check` and the applicable
browser checks. Publication uses `--require-fresh`; local snapshots are not
proof of current production capabilities. Package documentation is fetched by
site/package-records.mjs from its owning repositories; do not copy API/version
facts into site/overrides.json. Missing deployment evidence stays unverified.
