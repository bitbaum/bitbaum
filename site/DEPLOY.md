# bitbaum.orangecat.ch

The studio's front door. A home page, a page per venture, a packages page
and a studio page — static HTML in `site/dist/`, no framework, no runtime
fetch. Caddy serves `/opt/bitbaum/app` on the box with clean directory URLs.

## What the site is for

A visitor who has met Cato, found a repo or read an article wants to know
what this studio is, what it has built, and whether any of it is real. So
every page answers with things that can be checked — a live URL, a public
repo, a screenshot a machine took — and never with a claim. There are no
clients on this site because there are none. The pilots say so.

## Where the content comes from

Nobody types the list. Three sources, all fetched at build time and
snapshotted beside this file so `--offline` builds work:

| source | what it decides | snapshot |
|---|---|---|
| <https://loki.orangecat.ch/api/fleet/map> | which ventures exist, where they run, what state they are in | `map.snapshot.json` |
| <https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json> | which shared packages exist, adopter counts, install lines | `packages.snapshot.json` |
| <https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json> | each repo's first commit and proven origin ("since", "anchored in block N") | `origin.snapshot.json` |

A missing source throws rather than quietly producing a page with nothing on
it — that would read exactly like "we have none".

What this repository owns is presentation, in `site/overrides.json`:

| key | meaning |
|---|---|
| `stages` | the four stages and their one-line definitions: `product`, `pilot`, `concept`, `next`. They are the STAGE facet on the home grid and the legend under it |
| `tagOrder` | the closed vocabulary for the FIELD facet. A tag not in this list fails the build, because a card nobody can filter to is a card nobody finds |
| `overrides.<slug>.stage` | which stage a venture is at. Chosen by what a visitor can verify, **not** by the register's kind: a `client-app` row is a *pilot* (built for a real organisation, in real use, no commercial terms), never a client |
| `overrides.<slug>.tags` | its fields, from `tagOrder` |
| `overrides.<slug>.what` | the one line. **Required** — a row without one is not shown |
| `overrides.<slug>.story` | the paragraph on the venture's own page |
| `overrides.<slug>.pillar`, `pillarRole` | for the three stack products: the layer name, and what that layer does for someone joining |
| `overrides.<slug>.name`, `url`, `order`, `for` | display name, URL override, position, who a pilot is for |
| `overrides.<slug>.shot: false` | keep a placeholder page's screenshot off the site |
| `adopterAliases` | repository name → venture slug, for the few packages whose adopter is not named after the venture (the Hirnli app lives in `bitbaum/hirnli`; the register row is `revamp-info`) |
| `extras` | things the register does not know (no host row): Annushka, Skif |
| `packages` | one line per package slug over the derived registry |

## Both directions of "what uses what"

The package registry records adopters by repository. The build inverts that, so
each package card lists the apps that use it (linked to their pages) and each
venture page lists the packages it is built from (linked to the package). Nobody
types either list; a package that quietly lost its last adopter shows it.

## The work grid

One grid with two facets rather than four headed sections: stage is a chip row,
field is a chip row, and the choice lives in the address bar (`#work?stage=pilot&field=health`)
so a filtered view is a link you can send. Within a facet the chips are OR; across
facets they are AND; an empty selection means no filter, never "nothing matches".
Without JavaScript every card is shown, which is the correct fallback for a list.

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
node site/build.mjs             # fetch the sources, write site/dist/
node site/build.mjs --offline   # build from the snapshots (no network)
node site/build.mjs --check     # exit 1 if site/dist/ is stale
site/publish.sh                 # --check, rsync dist to the box, prove every page answers
```

`site/dist/` is committed so a diff shows what changed on the site between
two builds, and so `--check` can fail when the sources moved and the site did
not.
