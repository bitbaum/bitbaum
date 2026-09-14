# bitbaum.orangecat.ch

The studio's ventures in four groups — Products, Clients, Demos, Not live —
and the shared packages they are all built from. Static HTML, no framework, no
runtime fetch. Caddy serves `/opt/bitbaum/app` on the box.

Two kinds of object, deliberately shaped differently: a venture is something
you **visit**, a package is something you **install**. Rendering them the same
way is what made the distinction invisible.

## Where the list comes from

Nobody types the list. It is derived from the fleet register —
<https://loki.orangecat.ch/api/fleet/map> (human view:
<https://loki.orangecat.ch/fleet>) — which Loki builds from the
hosting register (`apps.conf`) joined with project profiles. That register is
the one place a project's existence, host and status are recorded.

The package list is derived too, from a second source —
<https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json>,
which `bitbaum/fleet`'s shared-registry audit generates from real `package.json`
data across the org. `SHARED.md` decides *which* packages are listed; everything
else on a card (adopter count, install line, repo link) is derived. The install
line in particular is taken from what adopters actually write rather than
assumed from the package name: `listkit`'s npm name belongs to a stranger, so
`pnpm add listkit` would install the wrong package.

The origin ledger is derived from a third source —
<https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json>,
which `bitbaum/fleet`'s nightly origin-proof workflow builds from its
OpenTimestamps manifests, GitHub's first-commit dates and Software Heritage's
archive. Git dates are set by whoever commits; every date in that section is
from a clock nobody here controls, and the page types none of them.

All three sources snapshot locally (`map.snapshot.json`,
`packages.snapshot.json`, `origin.snapshot.json`) so `--offline` builds work,
and a missing source throws rather than quietly producing a page with nothing
on it — that would read exactly like "we have none".

What this repository owns is presentation only, in `site/overrides.json`:

| key       | meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `what`    | the one-line tagline. **Required** — a row without one is not shown |
| `name`    | display name when the slug is not the name (`revamp-info` → Hirnli) |
| `group`   | `products` / `clients` / `demos` / `next`; overrides the kind-derived group |
| `order`   | position within the section                                     |
| `door`    | text in the right column when there is no URL (`not built`)     |
| `url`     | override the register's URL                                     |
| `packages` | one-line tagline per package slug, over the derived registry |
| `extras`  | things the register does not know (no host row): OrangeCat and Loki themselves, Annushka's static page, a name with nothing written down yet |

So: a new site provisioned through Loki appears in the register within
minutes, and on this page once someone writes its line here.

## Build and publish

```bash
node site/generate.mjs             # fetches the map, writes site/index.html, site/map.json and site/map.snapshot.json
node site/generate.mjs --offline   # builds from the snapshot (no network)
node site/generate.mjs --check     # exit 1 if index.html is stale
site/publish.sh                    # --check, then scp index.html to the box (keeps a .bak)
```

`map.snapshot.json` is committed so the page can be rebuilt without the
API and so a diff shows what changed in the register between two builds.

## Files

```
site/
├── index.html               # generated — do not edit by hand
├── head.html                # <head> and styles, the design
├── overrides.json           # editorial layer (see above)
├── map.snapshot.json   # last map the page was built from
├── generate.mjs             # the build
├── publish.sh               # the deploy
└── DEPLOY.md
```

## History

Until 2026-09-11 the list lived in `site/companies.json` here, and the page
that was actually live had been edited by hand on the server with no source in
this repository. Both drifted from reality within days (renamed repos,
retired hosts, redirects listed as sites). The register ended that.
