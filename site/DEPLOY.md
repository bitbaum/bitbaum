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
| `groups` | the four sections and their one-line ledes: `products`, `pilots`, `concepts`, `next` |
| `overrides.<slug>.group` | which section a venture belongs to. Chosen by what a visitor can verify, **not** by the register's kind: a `client-app` row is a *pilot* (built for a real organisation, in real use, no commercial terms), never a client |
| `overrides.<slug>.what` | the one line. **Required** — a row without one is not shown |
| `overrides.<slug>.story` | the two sentences on the venture's own page |
| `overrides.<slug>.name`, `url`, `order`, `pillar`, `for` | display name, URL override, position, the pillar label for the three featured products, who a pilot is for |
| `overrides.<slug>.shot: false` | keep a placeholder page's screenshot off the site |
| `extras` | things the register does not know (no host row): Annushka, Skif |
| `packages` | one line per package slug over the derived registry |

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
