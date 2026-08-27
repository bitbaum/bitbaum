# OrangeCat Site Factory

**created_date:** 2026-08-20
**last_modified_date:** 2026-08-27
**last_modified_summary:** Rewritten against reality; Camille recorded as the worked case study; new-site.sh built, so the scaffold row is now real.

---

## Status, honestly

This document described a pipeline on 2026-08-20. On 2026-08-27 we checked every
tool it named:

| Named here | Reality |
|---|---|
| `fleetcrown/scripts/site-import/import-site.ts` | **does not exist** |
| `fleetcrown/scripts/hetzner/provision-site.sh` | **does not exist** |
| `fleetcrown/docs/architecture/site-factory.md` | **does not exist** |
| `fleetcrown/docs/standards/fleet-discipline.md` | **does not exist** |

The factory is currently a **narrative, not a system**. Camille — its only
output — was built by hand on the same day this was written, and shipped to
production with no git repository at all.

That is not an indictment of the idea. The idea is right and the principles
below held up under pressure. It is a record of a specific failure mode this
studio keeps hitting, documented so it stops being a surprise:

> **Writing it down is what failed.** `SHARED.md` already says this about
> duplication. This file says it about tooling. A document that describes tools
> nobody built reads exactly like a document describing tools that exist.

---

## The model

1. **Prospect** — a business with a bad site, or none.
2. **Import** — scrape their current site into a reviewable manifest.
3. **Build** — generate a real site from it.
4. **Host** — `{slug}.orangecat.ch` on bitbaum.
5. **Sell** — they look; buying is optional.
6. **Maintain** — the FleetCrown widget: they point at what they don't like,
   an agent changes it, the change goes live. **This is the product.** Steps 1–5
   are customer acquisition; step 6 is the recurring revenue and the reason this
   is not a dev shop.

The subdomain is an **address, not an affiliation**. `petvity.orangecat.ch` has
no OrangeCat profile. `sinktattoo.orangecat.ch` became `sinktattoo.com` without
a line of code changing. That is the whole relationship.

---

## The rule that matters

> **Every site is its own repository from birth, and OrangeCat is never the host.**

Stated here on 2026-08-20 as *"Customer sites — independent repos, one row in
`apps.conf` each"* and *"do not conflate OrangeCat RLS multi-tenancy with site
factory hosting."*

**It was violated a week later anyway.** Substrata was built as a group profile
inside OrangeCat, rendered by OrangeCat's app, from OrangeCat's config, in
OrangeCat's design tokens. The live page carried OrangeCat's header, Google
Analytics, and an Organization schema telling crawlers the domain *was*
OrangeCat. Unwound on 2026-08-27: −7,146 lines, and Substrata rebuilt as its
own repo, port, unit, Caddy block and design system.

The lesson is not "read the docs". It is that **a rule with nothing enforcing it
is a preference.** The reserved-subdomain list written by hand the same week was
missing fourteen of the twenty-two hosts already live on the box; the version
generated from Caddy and checked in CI could not be wrong. Generate and verify,
or expect drift.

---

## Case study: Camille

A fictional French bakery in Zürich. Scraped from the public
`juliette-boulangerie.ch`, pseudonymised to "Camille — pain du Quai",
generated, deployed to `camille.orangecat.ch`, `noindex`. It exists to prove the
factory works.

**What the handover rehearsal found (2026-08-27):**

| # | Finding | Status |
|---|---|---|
| 1 | No version control at all, in production since 19 Aug | fixed — repo created |
| 2 | Not in `apps.conf`; nothing knew it existed | fixed — registered |
| 3 | 2 high-severity vulns (Next 14.2.35 vs fleet 16.2.4) | **open** — must fix before any real handover |
| 4 | Content is a pseudonymised scrape — not the client's to receive | **open** — rewrite before transfer |

**What passed, and it is the part that matters.** A clean-room clone — no
`node_modules`, no env, no access to the original working copy — installed,
built four static pages and served HTTP 200.

The repository depends on **nothing of ours**: no bitbaum path, no Caddy
assumption, no shared package, no secret. That is not luck. It is a property of
keeping deploy logic in `fleetcrown` rather than in app repos, which means every
app repo is an ordinary Next app that anyone can host.

So *"you own this — cancel any time and take the code"* is **true today**, and
the obstacles were bookkeeping, not architecture.

Procedure: `camille-boulangerie/HANDOVER.md`.

**Three things Camille taught that generalise:**

1. **The demo is the pitch.** Rebuilding a prospect's own site and sending them
   the link is outbound where the artifact does the selling. Keep it pointed at
   the owner — restyling a third party's content under an invented brand to show
   someone else is a different and riskier thing.
2. **Generated content is a draft, not a deliverable.** It must be rewritten
   from the client's own material before anyone owns it.
3. **The un-glamorous steps are the ones that get skipped.** Camille had a
   deploy, a domain and a design. It had no repo, because a repo produces no
   visible result on the day. Automate exactly the steps with no immediate
   payoff.

---

## What actually exists today

| Concern | Where | Real? |
|---|---|---|
| Fleet register (port, domain, repo, owner, kind, status, plan, price) | `fleetcrown/scripts/hetzner/apps.conf` | **yes** |
| Box provisioning (systemd, launch.sh, Caddy, monitoring) | `fleetcrown/scripts/hetzner/sync-infra.sh <app>` | **yes** |
| Deploy from a laptop | `fleetcrown/scripts/hetzner/deploy.sh <app>` | **yes** |
| Shared CD | `fleetcrown/.github/workflows/selfhost-deploy.yml` | **yes** — 12-line shim per repo |
| DNS for a new subdomain | wildcard `*.orangecat.ch` → 167.233.22.31 | **yes** — zero-touch since 2026-08-27 |
| Handover procedure | `camille-boulangerie/HANDOVER.md` | **yes** — rehearsed |
| Site import from a URL | — | no |
| One-command scaffold | `fleetcrown/scripts/hetzner/new-site.sh <slug>` | **yes** — since 2026-08-27 |
| Per-site FleetCrown project + widget token | — | no |
| Preview / approve / revert for agent changes | — | no |

Spinning up Substrata by hand took nine steps. Eight are now one command —
`new-site.sh <slug>` does repo → register → box → deploy, refusing reserved and
duplicate slugs and allocating the port from the register rather than from
`ss -ltnp`. The ninth — setting `HETZNER_SSH_PRIVATE_KEY` on each new repo — is
deliberately not automated: a script should not handle private keys, and the
better fix is to put a self-hosted Actions runner on the box so the secret stops
existing at all.

The scaffold automates the *boring* steps on purpose. Camille's two missing
steps — create the repository, register it — were precisely the ones with no
visible payoff on the day, which is why they were skipped and why they are now
the ones a machine does.

---

## Do not conflate

**OrangeCat RLS multi-tenancy** (many actors inside one app) with **site factory
hosting** (many apps on one box). They look similar and are opposites: the first
shares a runtime deliberately, the second must never share one, because a site
that shares a runtime cannot be handed to its owner.

---

## Open questions

- **Capacity.** One box, 78% disk, 71% memory, ~24 apps. The trigger for a
  second box is not a date or a percentage — it is the first paid hosting
  commitment, when "down because another tenant's build ate the RAM" stops being
  embarrassing and becomes contractual.
- **Pricing.** `plan` and `price` are `-` for every row in the register. That is
  deliberate and it is the point: "what am I owed this month" is currently
  unanswerable.
- **Volume or value.** Free setup and a low monthly implies many small,
  support-heavy customers, and only works if the widget loop genuinely removes
  the founder from the loop. Fewer, larger clients is a different product. The
  metric that decides it is **support requests per site per month**.
