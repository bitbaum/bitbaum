# ai-forms — @fleet/ai-forms (Internal Library, Fleet Standard)

**Status:** Shipped v0.1.0 (library, not a product; no deploy target by nature)
**Tagline:** Headless AI form filling and conversational refinement — fill any form from prose
**URL:** [github.com/maonakamoto/ai-forms](https://github.com/maonakamoto/ai-forms) (public); **not on npm** — installed via git tag (`npm install github:maonakamoto/ai-forms#v0.1.0`)
**Codebase:** `/home/g/dev/ai-forms/` (1 squashed commit, ~1,050 LOC, zero runtime deps)

---

## Executive Summary

Provider-agnostic core + React hook + server route factory implementing the fleet's AI-form standard. An app conforms when: forms fill from prose, refine by talking, never overwrite user typing, AI edits are reversible and visible, and page-aware chat can drive the form. Core mechanism: `fill` vs `refine` intent decides who wins on merge conflicts.

**Consumers (verified):** FleetCrown (merged — config SSOT, API route, assist bar, six New-X buttons, conformance script in CI) and aoz-housing (in-flight on a worktree, not yet merged to its main).

Stack: pure TypeScript ESM, React optional peer dep, `node --test`. MIT in package.json (LICENSE file missing — known gap).

---

## Business Model

- **Monetization state: none, and none intended** — this is shared fleet infrastructure. Its value is realized inside the products that consume it (a FleetCrown differentiator, an aoz-housing demo feature).

---

## Go-to-market

- **ICP / first-customer path:** not applicable as a standalone. If ever externalized, the path is npm publish + a docs page — neither exists today.
- **Key metrics to move:** fleet adoption count (2 of ~15 apps today) and conformance checks passing in consumer CI.

---

## Distribution

None, appropriately: no docs site, no npm listing, no blog/RSS/OG. The README is the documentation. Fleet distribution standard: not applicable to an internal library.
