# bitbaum.orangecat.ch

**Why this site exists and who it serves: [PURPOSE.md](PURPOSE.md).** Read it before adding a section.

The studio's front door. A focused home page, a filterable work catalogue, a
page per venture, a packages page and a studio page — static HTML in `site/dist/`, no framework, no runtime
fetch. The package catalogue's optional browser enhancement uses `listkit`
for search, category/adoption facets, sorting, and shareable URL state; its
cards remain present without JavaScript. Caddy serves `/opt/bitbaum/app` on
the box with clean directory URLs.

## What the site is for

A visitor who has met Cato, found a repo or read an article wants to know
what this studio is, what it has built, and whether any of it is real. So
every page answers with things that can be checked — a live URL, a public
repo, a screenshot a machine took — and never with a claim. There are no
clients on this site because there are none. The pilots say so.

## Where the content comes from

Nobody types the list. Four sources, all fetched at build time and
snapshotted beside this file so `--offline` builds work:

| source | what it decides | snapshot |
|---|---|---|
| <https://loki.orangecat.ch/api/fleet/map> | which ventures exist, where they run, what state they are in | `map.snapshot.json` |
| <https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json> | which shared packages exist, latest published npm versions, adopter counts, install lines | `packages.snapshot.json` |
| <https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json> | each repo's first commit and proven origin ("since", "anchored in block N") | `origin.snapshot.json` |
| <https://raw.githubusercontent.com/bitbaum/fleet/main/registers/readings.json> | dated GitHub/npm and client-revenue/originator-payment readings | `readings.snapshot.json` |

The automated publisher requires all four sources to respond successfully;
it will not publish from an old snapshot when a source is unavailable. Local
offline builds may use the committed snapshots, so a developer can still work
without network access.

The home page features the two flagship projects and the three packages named
in `home.featuredPackages`. Its build fails if a selected item disappears from
the source registers. `/work/` contains the full staged project catalogue and
`/packages/` contains every registered package. The Loki feedback widget is
configured by `site/loki-feedback.json` and included by the shared page shell;
its token is public and write-only. Dated readings appear only where useful,
link to their source, and disclose that package downloads include CI installs.

What this repository owns is presentation, in `site/overrides.json`:

| key | meaning |
|---|---|
| `stages` | readiness stages and their one-line definitions: `product`, `pilot`, `development`, `concept`, `next`. They drive the filter and legend on `/work/` and counts on the home page |
| `home.flagshipProjects` | the intentionally small project showcase on the home page |
| `home.featuredPackages` | the intentionally small package showcase on the home page |
| `tagOrder` | the closed vocabulary for the FIELD facet. A tag not in this list fails the build, because a card nobody can filter to is a card nobody finds |
| `overrides.<slug>.stage` | which stage a venture is at. Chosen by what a visitor can verify, **not** by the register's kind: a `client-app` row is a *pilot* (built for a real organisation, in real use, no commercial terms), never a client |
| `overrides.<slug>.tags` | its fields, from `tagOrder` |
| `overrides.<slug>.what` | the one line. **Required** — a row without one is not shown |
| `overrides.<slug>.story` | the paragraph on the venture's own page |
| `overrides.<slug>.pillar`, `pillarRole` | for the three stack products: the layer name, and what that layer does for someone joining |
| `overrides.<slug>.name`, `url`, `order`, `for` | display name, URL override, position, who a pilot is for |
| `overrides.<slug>.shot: false` | keep a placeholder page's screenshot off the site |
| `adopterAliases` | repository name → venture slug, for the few packages whose adopter is not named after the venture (the Hirnli app lives in `bitbaum/hirnli`; the register row is `revamp-info`) |
| `extras` | projects not represented by a row in the fleet map |
| `packages` | one line per package slug over the derived registry |

`site/hire.json` holds the hire page's editorial half: `offers` (name, price,
unit, what), `method`, `faq` and `contact`.

## Both directions of "what uses what"

The package registry records adopters by repository. The build inverts that, so
each package card lists the apps that use it (linked to their pages) and each
venture page lists the packages it is built from (linked to the package). Nobody
types either list; a package that quietly lost its last adopter shows it.

## The work catalogue

`/work/` has one grid with two facets rather than four headed sections: stage is a chip row,
field is a chip row, and the choice lives in the address bar
(`#work?stage=pilot&field=health`) so a filtered view is a link you can send.
Listkit owns the facet matching, search, sort, and URL codec used by this grid
and the package catalogue. Within a facet the chips are OR; across facets they
are AND; an empty selection means no filter, never "nothing matches". Without
JavaScript every card is shown, which is the correct fallback for a list.

## The hire page

`/hire/` is the destination of the primary button on every other page, so it is
the one page that must not read as a different company. It used to live on
GitHub Pages in its own design, under a personal name and a superseded GitHub
handle, with no contact address at all; `bitbaum/hire` now redirects here.

Rates, method, answers and the contact address are editorial, in
`site/hire.json`. The live-work list on it is **not**: it is the same derived
list as `/work/`, which is the rule that matters — the old hand-typed
version quoted a host that had been retired for two days, counted one renamed
organisation as two systems, and used two superseded product names.

The public name is **Cato** and the address is **cato@orangecat.ch**. An
earlier `mao@` address is the same person under a superseded handle and must
not appear on any page.

## Imagery

Every venture with a live URL is shown as a screenshot of that URL, taken by
`site/shots.mjs` at 1280×800 in dark colour scheme, JPEG, into
`site/dist/shots/`. Nothing is drawn by hand; if the product changed, so did
the picture. A shot the pages reference must exist or the build fails.

```bash
PLAYWRIGHT=/path/to/node_modules/playwright node site/shots.mjs            # all
PLAYWRIGHT=/path/to/node_modules/playwright node site/shots.mjs orangecat  # one
```

## Design

`site/styles.css`, tokens first. The values are the ones the products
themselves ship — OrangeCat and Loki: near-black ground, Inter at a heavy
weight with tight tracking for statements, one orange for actions. bitbaum
looks like the things it lists. Every rule below the tokens names a role.

## Build and publish

```bash
node site/og.mjs                # render the share card, site/dist/og/studio.png
node site/build.mjs             # fetch the sources, write site/dist/
node site/build.mjs --require-fresh # fail rather than fall back to snapshots
node site/build.mjs --offline   # build from the snapshots (no network)
node site/build.mjs --check     # exit 1 if site/dist/ is stale
node site/check-claims.mjs      # truth gate against dist/ (or pass a live URL)
node site/check-theme.mjs http://127.0.0.1:8731   # after serving dist/
node site/check-hire.mjs https://bitbaum.orangecat.ch
site/publish.sh                 # --check, rsync dist to the box, prove every page answers
```

**Build ≠ live.** `site/dist/` is a local (and git) artifact. The public site is `/opt/bitbaum/app` on the Hetzner box. A new page appears on bitbaum.orangecat.ch only after `site/publish.sh` (or the Deploy workflow) rsyncs successfully. Cache-Control is already `max-age=0, must-revalidate`; stale public HTML almost always means publish never ran.

`site/dist/` is committed so a diff shows what changed on the site between
two builds, including the pinned listkit browser modules, and so `--check`
can fail when the sources moved and the site did not. Main-branch changes to
the site or its workflow run tests, claims/theme gates, rebuild from current
Loki/Fleet sources, commit updated snapshots and generated pages, then publish
to Hetzner, verify the public routes, and run the hire form gate. Fleet
dispatches a refresh when its derived package registry changes, pinned to the
exact Fleet commit that produced the new register. Run `Deploy Bitbaum site`
manually from Actions to retry a failed publish; ordinary site changes also
publish on `push`.

### Caddy headers (owned on the box)

`/etc/caddy/apps.d/bitbaum.caddy` should keep at least:

- `Cache-Control: public, max-age=0, must-revalidate`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

`publish.sh` asserts those on `/packages/`. A Content-Security-Policy that
blocks inline scripts is a follow-on once the remaining FOUC theme boot is
hashed or moved; interactive modules already live at `/theme.mjs` and
`/request.mjs`.

---

created_date: 2026-06-01
last_modified_date: 2026-09-24
last_modified_summary: Card SSOT and honest claims; redacted map.json; build≠publish; CI truth gates; Caddy header smoke checks.
