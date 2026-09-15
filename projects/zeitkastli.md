# Zeitkastli — a time capsule you can find again

**Status:** Building (milestone 1 shipped; public repo, no deployed site yet)
**Tagline:** Put something somewhere. Find it again.
**URL:** none yet (zeitkastli.com and zeitkast.com identified as available, not registered)
**Codebase:** `bitbaum/zeitkastli` (PUBLIC) · box workspace `/home/ubuntu/dev/zeitkastli`

> Renamed from **HamsterCheek** on 2026-09-15. The old framing — "storing
> valuables outside of homes and banks", "stashes", "off the grid", "hide it
> anywhere" — described asset concealment, in a public repo, which is not what
> this is and not a thing bitbaum should appear to be building. The product did
> not change; the honest description of it did. See the rename note at the
> bottom.

---

## Executive Summary

A weatherproof capsule you leave somewhere, plus a web app that remembers
exactly where it is. Drop a map pin on the spot → photo + notes → name the
person it is meant for and the date it should be opened. The physical capsule
is deliberately **not** fleet work: agents build the digital half only.

Kicked off 2026-08-04 through FleetCrown's own "Make it happen" hero. Milestone 1
(map pin + notes + photo + detail page) is merged as `c516c8b8`.

_Zeitkastli_ is Swiss German for "little time box" — `Kästli`, the diminutive of
`Kasten`. The umlaut is dropped in the name so the domain does not need punycode.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js |
| Database | Postgres |

## Milestones (build order)

1. ~~core data model~~ · 2. ~~map picker + coordinate storage~~ · 3. ~~photo upload~~
   (shipped together in PR #1) · 4. auth + open-on date + named recipient ← **next**
5. integrate into a working app

---

## Business Model

Nothing priced, nothing wired. Revenue to date: CHF 0. The obvious shape is
capsule-plus-app: the physical capsule is the paid object, the app is what makes
it worth buying. No processor, no pricing page, no tier defined.

---

## Distribution

**What exists today:** the repo is public; nothing else is. No deployed site, no
domain, no OG image, no sitemap, no RSS, no newsletter, no social presence.

**Fleet standard pending, in dependency order:** public deploy + domain → OG
card → sitemap/robots → one founding post explaining the premise → newsletter
capture → social queue (drafts only, nothing auto-posts).

The honest blocker is upstream of distribution: there is nothing linkable yet.

---

## Go-to-market

- **ICP:** people who leave something behind on purpose and want it found later
  — a parent or grandparent writing to a child, couples and friends marking a
  date, schools and clubs burying a class capsule, geocachers.
- **Positioning one-liner:** put something somewhere; find it again.
- **Wedge:** the failure mode is universal and slightly embarrassing — people
  bury or put away something meaningful and genuinely forget where. The app is
  the memory; the open-on date and named recipient are what make it a capsule
  rather than a note to self.
- **Shortest first-paying-customer path:** finish milestone 4 (auth, open-on
  date, named recipient) so a stranger's capsules are actually theirs, deploy
  publicly, then hand-sell a first small run of capsules at a fixed price with
  the app included. Hand-fulfilled, invoice-first — no processor needed for ten.
- **Key metrics to move:** public URL live · first non-George account · first
  capsule stored by someone else · first capsule sold.
- **Risk to name honestly:** a database of "where my things are" is a target,
  and coordinates are currently stored in plain text. Encryption-at-rest and an
  honest "what we can and cannot read" statement are engineering work before
  they are marketing claims — until then the README says plainly that this is a
  memory aid, not private storage.

---

## What this is not

Zeitkastli records where you left something so you, or the person you name, can
find it later. It is not a tool for concealing assets and it is not private
storage. This paragraph exists because the product's first description read as
the former, and a public repo is read by people who never see the intent behind
it.

---

## Rename note (2026-09-15)

The name and vocabulary changed; the product did not.

| Before | After |
|---|---|
| HamsterCheek | Zeitkastli |
| "storing valuables outside of homes and banks" | "a time capsule that remembers where you put it" |
| `stashes` table, `/stashes/[id]` | `capsules` table, `/capsules/[id]` |
| "off the grid" / "remember where it's hidden" | "a map that remembers where you put things" |
| ICP: "a reason not to trust a bank", preppers, emergency caches | ICP: families, schools and clubs, geocachers |

Changed in: `bitbaum/zeitkastli` (app, schema, copy, README), this brief, the
Loki project row and its 17 identity attributes (which feed
`loki.orangecat.ch/api/fleet/map` and therefore this site), the box workspace
path, and the GitHub repo name and description. Historical records were left
alone on purpose: `fleet/proofs/origin/*.json` are hash-chained and append-only,
so a past proof naming the old repo is correct history, not stale copy.
