# HamsterCheek — Off-site storage for what must not be lost

**Status:** Building (milestone 1 shipped; private repo, no public surface)
**Tagline:** The box survives the ground; the app makes sure the location outlives your memory
**URL:** none yet (no domain, no deployed site)
**Codebase:** `bitbaum/hamstercheek` (PRIVATE) · box workspace `/home/ubuntu/dev/hamstercheek`

---

## Executive Summary

A weatherproof box you bury or hide, plus a web app that remembers exactly where
it is. Sign in → drop a map pin on the hiding spot → photo + notes → name a
recovery contact. The physical box is deliberately **not** fleet work: agents
build the digital half only.

Kicked off 2026-08-04 through FleetCrown's own "Make it happen" hero. Milestone 1
(map pin + notes + photo + detail page) is merged as `c516c8b8`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js |
| Database | Postgres |

## Milestones (build order)

1. ~~core data model~~ · 2. ~~map picker + coordinate storage~~ · 3. ~~photo upload~~
   (shipped together in PR #1) · 4. auth + recovery contact ← **next**
5. integrate into a working app

---

## Business Model

Nothing priced, nothing wired. Revenue to date: CHF 0. The obvious shape is
box-plus-app: the hardware is the paid object, the app is what makes it worth
buying. No processor, no pricing page, no tier defined.

---

## Distribution

**What exists today:** nothing. The repo is private, there is no deployed site,
no domain, no OG image, no sitemap, no RSS, no newsletter, no social presence.

**Fleet standard pending, in dependency order:** public deploy + domain → OG
card → sitemap/robots → one founding post explaining the premise → newsletter
capture → social queue (drafts only, nothing auto-posts).

The honest blocker is upstream of distribution: there is nothing linkable yet.

---

## Go-to-market

- **ICP:** people with something irreplaceable and a reason not to trust a bank
  or a drawer — seed phrases and hardware wallets first, then documents,
  heirlooms, and emergency caches. Preppers and bitcoiners are the beachhead
  because they already do this manually and already lose coordinates.
- **Positioning one-liner:** hide it anywhere; never lose where.
- **Wedge:** the failure mode is universal and embarrassing — people bury or
  stash things and genuinely forget where. The app is the memory, the recovery
  contact is the succession plan.
- **Shortest first-paying-customer path:** finish milestone 4 (auth + recovery
  contact) so a stranger's data is actually theirs, deploy publicly, then sell
  ten boxes by hand to the bitcoin/prepper niche at a fixed price with the app
  included. Hand-fulfilled, invoice-first — no processor needed for ten.
- **Key metrics to move:** public URL live · first non-George account · first
  pin stored by someone else · first box sold.
- **Risk to name honestly:** a location-of-my-valuables database is a target.
  Encryption-at-rest and a "we cannot read your pins" story are marketing
  requirements, not just engineering ones.
