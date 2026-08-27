# Prime tower — undecided scaffold

> **ARCHIVED 2026-08-27.** No deploy, no users, no commercial relationship. Archived
> rather than deleted: the work is kept, but it stops voting. A dark repo costs
> nothing in disk and everything in attention — every fleet sweep, dependabot
> alert and audit touched 24 projects instead of the ~12 that are actually live.
> Un-archive by removing this note and giving it a status above.


**Status:** Archived (was: Idea / scaffold only — no product decision has been made
**Tagline:** none yet
**URL:** none
**Codebase:** none locally; the FleetCrown profile describes a generated Next.js starter

---

## Executive Summary

**Read this before doing any work here.** "Prime tower" is currently a
FleetCrown-generated Next.js starter — root layout, home page, globals.css —
named after Zurich's Prime Tower. Its recorded mission ("provide information
about the Prime Tower to its audience") is the scaffold's own placeholder, not a
decision George made.

There is no product, no audience, no owner, and no local repository. An agent
picking this up must **not** invent a product: the only legitimate next action
is to get a scope decision from George, or to retire the project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js 15, Tailwind v4, TypeScript (starter defaults) |

---

## Business Model

None. Nothing priced, nothing built, no revenue path defined.

---

## Distribution

None, and none should be built. Publishing anything under this name before the
product exists would put an empty page on the fleet's public surface.

---

## Go-to-market

- **Decision required first:** is this a real project or a leftover scaffold?
  Two plausible shapes were never chosen between — a public information site
  about the building, or an unrelated product that merely inherited the name.
- **If retired:** use `scripts/db/retire-stale-projects.ts` so it stops counting
  against fleet fill metrics and stops attracting agent attention.
- **If kept:** the first deliverable is a one-paragraph brief from George
  answering who it is for and what it does. Everything else waits on that.
- **Key metric to move:** exactly one — a scope decision, or a retirement.
