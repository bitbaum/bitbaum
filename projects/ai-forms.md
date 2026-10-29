# ai-forms — @fleet/ai-forms (Internal Library, Fleet Standard)

**Status:** Shipped (library, not a product; no deploy target by nature). Current version and adopters: `bitbaum/fleet` `registers/packages.json`
**Tagline:** Headless AI form filling and conversational refinement — fill any form from prose
**URL:** [github.com/bitbaum/ai-forms](https://github.com/bitbaum/ai-forms) (public); published on npm as `ai-forms` (`pnpm add ai-forms`)
**Codebase:** `/home/g/dev/ai-forms/` (1 squashed commit, ~1,050 LOC, zero runtime deps)

---

## Executive Summary

Provider-agnostic core + React hook + server route factory implementing the fleet's AI-form standard. An app conforms when: forms fill from prose, refine by talking, never overwrite user typing, AI edits are reversible and visible, and page-aware chat can drive the form. Core mechanism: `fill` vs `refine` intent decides who wins on merge conflicts.

**Consumers (verified):** Loki (merged — config SSOT, API route, assist bar, six New-X buttons, conformance script in CI) and aoz-begleitung (then in-flight on a worktree). The current adopter list is in `bitbaum/fleet` `registers/packages.json`.

Stack: pure TypeScript ESM, React optional peer dep, `node --test`. MIT in package.json (LICENSE file missing — known gap).

---

## Business Model

- **Monetization state: none, and none intended** — this is shared fleet infrastructure. Its value is realized inside the products that consume it (a Loki differentiator, an aoz-begleitung demo feature).

---

## Go-to-market

- **ICP / first-customer path:** not applicable as a standalone. It is published on npm as `ai-forms`; externalizing further would mean a docs page.
- **Key metrics to move:** fleet adoption count (see `registers/packages.json`) and conformance checks passing in consumer CI.

---

## Distribution

None, appropriately: no docs site, no npm listing, no blog/RSS/OG. The README is the documentation. Fleet distribution standard: not applicable to an internal library.
