# What bitbaum.orangecat.ch is for

**One sentence.** It is the proof and the door: it shows, with evidence anyone
can check, what the studio has built and why, so that the few people who
matter — someone who might commission work, adopt a package, receive an
application, or join — can decide in two minutes and take the next step.

Read this before adding a section. A new thing being true is not a reason to
put it on the site; serving one of the readers below is.

## Who it serves today — measured, 2026-09-15

Almost nobody, and the reason is structural, not visual.

- **Traffic.** In the retained access log (Caddy keeps three 50 MB rolls,
  which the Loki API fills within a day), this host received **33 of 112,533
  requests** on the box. The requests with a browser user agent came from four
  addresses — the server's own publish checks and three hosting-provider
  addresses — and hit `/robots.txt`, `/hire/` and `/`. **No request carried an
  external referrer.**
- **Nothing linked here.** No repository outside `bitbaum/bitbaum`, not the
  organisation's GitHub page (website field empty, no profile README), not the
  personal profile README, and the personal website field pointed at the old
  hire address.
- **Shares rendered as bare text.** `robots.txt` and `sitemap.xml` returned 404
  and no page carried a share image.
- **The one audience that measurably exists** is developers using the shared
  packages: 6,812 npm downloads in 30 days (CI installs included). They arrive
  on npm and GitHub, never here. Everything else in the readings register is
  near zero: 2 stars, 1 fork, 0 paying clients, CHF 0 revenue.

So the first job is **arrival**, and layout is second. See "How people arrive".

## Who it must serve — in order

| # | Reader | What they need to decide | Where they land | Their door |
|---|---|---|---|---|
| 1 | **Someone who might commission work** — a founder, a team without a senior engineer, an organisation with a rescue | Is this person real, senior, and worth waiting for? | `/hire/`, with venture pages as evidence | the waitlist form (or `cato@orangecat.ch`) |
| 2 | **A developer who already uses a package** | Is this maintained, and what else is here? | `/packages/`, reached from a package README | install, source |
| 3 | **An organisation receiving an application** — a public service, a non-profit, AOZ, SBB, Stadt Zürich | What exists, how real is it, can I reply? | one venture page, sent as a direct link | "Ask about …" on that page |
| 4 | **A builder who might join** | Can I contribute, and what do I get, exactly? | `/#join` | contributor terms, a pull request |
| 5 | **An agent** | What exists, where, in what state? | `/map.json` | — |

Reader 1 is first because it is the only near-term path to revenue. Reader 4 is
the long-term ambition — more than one person building here, on OrangeCat,
Loki and Solon — and is fourth only because what the site can honestly promise
a contributor today is small (see below).

**Not a reader:** a user of one product (each has its own site — route, do not
duplicate), a backer in the funding sense (OrangeCat is where a project is
backed; a venture page links its profile when one exists), and anyone looking
for a list of gaps (the fleet registers publish those, not this page).

## What each page is for

- **`/`** — who we are in one line, then *Start where you are*: four doors, one
  per reader, before any catalogue. The work grid, packages and joining follow.
- **Venture pages** — must stand alone, because reader 3 arrives on one with no
  other context: the problem, what exists, the honest stage, a screenshot a
  machine took, and a way to reply.
- **`/packages/`** — every package with the products that use it, so a
  developer can judge what it has survived.
- **`/hire/`** — the shape of the work, the method, the answers, and one door:
  a waitlist. **No prices while new work is closed** (2026-09-17) — a published
  rate is an offer, and an offer nobody can accept is noise; the number arrives
  with the reply, on a written scope. The form posts to Loki's
  `POST /api/newsletter` (`source: bitbaum-hire`), which rate-limits, dedupes
  and announces each new row, so a signup reaches a person rather than a table.
  If the request fails the page names the mailbox and the `mailto` still works.
- **`/studio/`** — the thesis and the rules, for the reader who wants the why.

## How people arrive — the part that actually matters

A page nobody reaches helps nobody. In leverage order:

1. **Shared links render properly** — share image and title on every page. *Done.*
2. **The GitHub organisation page** — website field and a profile README
   pointing at the four doors.
3. **The personal GitHub profile** — README and website field land on the site.
4. **Every package README** links back ("part of bitbaum"), routing the one
   audience that already exists. *Done, 2026-09-17* — all nine, each linking
   the studio and `/packages/#<slug>`, which lists the apps that use it.
5. **Applications link a venture page**, not the home page.
6. **OrangeCat articles** link the venture or package they are about.

## What this site must never say

- **"Client."** There are none. `client-app` in the hosting register is a
  provisioning fact; publicly those are *pilots* and *concepts*.
- **"Live" or "released."** Everything is in beta. Running is not released.
- **A price, while new work is closed.** A published rate is an offer; quoting
  terms nobody can accept today is the same kind of untruth as a fake client.
  Restore rates to `site/hire.json` only when Cato says capacity is open.
- **"One-person studio"**, or any solo framing. The point of the stack is that
  more than one person can build here.
- **More than the rules deliver.** The originator share (Solon, v1) pays
  whoever *first authored a repository*, there is no revenue, and a
  contribution to an existing repository earns no share. Say exactly that.
- **Anything hand-typed that a register already knows.** Counts, names and
  hosts are derived; a static image carries no numbers.

## How we will know it works

Read weekly, once they can be read:

- visits with an external referrer, and from where: `bash site/visits.sh [days]`
  reads this host's own log (90 days retained) and prints referrers, paths and
  agents. A referrer is the only evidence a link sent someone here;
- enquiries to `cato@orangecat.ch` that name a page;
- package-README referrals (referrer `npmjs.com` or `github.com`);
- stars and downloads in `fleet/registers/readings.json`.

## Open decisions — Cato's, not the site's

1. **Credit contributors in the originator share** (a Solon v2 proposal) —
   until then, joining is licensing and review, not income.
2. **The credibility spine on `/hire/`** — the finance-to-engineering path is
   the strongest differentiator on record and appears nowhere on the site.
   Publish only in wording Cato has confirmed.
3. **The named legal party** in Loki's licence, terms and privacy policy.

Measurement is no longer one of these: this host writes its own access log
(`/etc/caddy/apps.d/bitbaum.caddy`, 5mb rolls, 20 kept, 90 days) and
`site/visits.sh` reads it.
