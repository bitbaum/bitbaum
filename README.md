# bitbaum

The Bitbaum studio website and its static site generator. The public site is
[bitbaum.orangecat.ch](https://bitbaum.orangecat.ch). It presents projects at
their editorially reviewed readiness stage, documents shared packages, and
routes people to the studio waitlist or to Loki for agent-assisted work.

This repository describes the website and how to build and publish it. It is
not a legal or financial plan. For the current public account of the studio,
see the [studio page](https://bitbaum.orangecat.ch/studio/); for project stage,
see the [work catalogue](https://bitbaum.orangecat.ch/work/). Do not treat a
host being up as evidence that a product is ready or generally available.

## What the site shows

- The homepage features the two flagship projects and a short package
  selection. The full catalogue lives at `/work/`; all shared packages live at
  `/packages/`.
- Project readiness is maintained in [`site/overrides.json`](site/overrides.json).
  Its stages distinguish public beta products, pilots, development, concepts,
  and projects that are not built. In particular, Solon is in development;
  Skif and Causius are not built.
- Project and package records, package versions and observed adopters are
  sourced from the Loki fleet map and Fleet registers. Editorial descriptions
  and the homepage selections are reviewed here. The build fails if a selected
  project or package is missing from its source register.
- The site does not promise contributor revenue shares. Package licences and
  adoption are linked to their public sources on the package catalogue.
- Studio engagements are currently closed to new starts. The waitlist is on
  `/hire/`; Loki is the self-serve path for people who need agent-assisted
  development now. Loki does not promise unsupervised or guaranteed delivery.
- The Loki feedback widget is included sitewide. Its public, write-only token
  is configured in [`site/loki-feedback.json`](site/loki-feedback.json). The
  publish check opens the live widget from Bitbaum's allowed origin.

## Build and verify

The site is static HTML and CSS in `site/dist/`. Install the pinned workspace
dependencies, then build from current Fleet sources:

```sh
pnpm install --frozen-lockfile
node site/build.mjs --require-fresh
node site/build.mjs --check
pnpm test
node site/check-claims.mjs
```

For offline development, `node site/build.mjs --offline` uses the committed
source snapshots. `--check` compares generated output with `site/dist/`; it
does not publish anything. Browser checks include:

```sh
node site/check-theme.mjs https://bitbaum.orangecat.ch
node site/check-hire.mjs https://bitbaum.orangecat.ch
node site/check-widget.mjs https://bitbaum.orangecat.ch
```

See [`site/DEPLOY.md`](site/DEPLOY.md) for source registers, configuration,
local serving, and the deployment process. Changes under `site/` are built,
checked and published by [the deploy workflow](.github/workflows/deploy-site.yml)
after they reach `main`. A successful local build alone does not change the
public site.

## CI/CD observations

The latest successful publish, [run 35972429669](https://github.com/bitbaum/bitbaum/actions/runs/35972429669),
took 2m01s end to end. The largest measured steps were the public publish and
smoke checks (30s), Playwright browser/dependency setup (21s), the live hire
form browser check (18s), the claims gate (13s), and the theme browser check
(8s). The earlier site deploy, [run 35971822830](https://github.com/bitbaum/bitbaum/actions/runs/35971822830),
took 1m34s. These are measured runs, not an SLA.

The claims gate currently checks each public repository's licence through
GitHub's API; it took 13s in the latest run. Batch or cache that evidence only
if it becomes a material part of deploy latency. GitHub also emitted a
non-blocking warning that `actions/cache@v4` declares Node 20 and is being
forced to Node 24. The deploy succeeded; review the action version during the
next workflow maintenance pass.
