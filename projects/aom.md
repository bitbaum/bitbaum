# AOM

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-20  
**last_modified_summary:** Dropped fictional Venus expansion; AOM is the sole public label.

**Status:** Pseudonymous presentation profile (maps to a real live delivery project)  
**Tagline:** Compatibility-first housing placement and resident guidance  
**URL:** [aoz.orangecat.ch](https://aoz.orangecat.ch)  
**Internal delivery project:** `aoz-housing`  
**Codebase:** `/home/g/dev/aoz-housing/`

---

## What this is

`AOM` is the public/demo alias for the AOZ-facing product story.

It lets us talk about the system as a reusable collective identity on OrangeCat
without tying every public mention to the real operator name.

The mapping is:

- **OrangeCat collective identity:** `AOM` (entity type `organization`, typically label `nonprofit`)
- **FleetCrown / fleet footer label:** `AOM`
- **Internal product + repo:** `aoz-housing`
- **Infrastructure slug:** `aoz-wohnen`

The live product site at `aoz.orangecat.ch` keeps its own product presentation.
Everywhere else — OrangeCat, FleetCrown, demos, case studies — use **`AOM`**.

Do not invent expanded names for AOM. The short form is the public name.

---

## Executive Summary

AOM stands for a housing and guidance organisation that coordinates shared
living with more discipline than the status quo:

- placements based on compatibility, not only empty beds;
- resident-facing tools for money, house rules, chores, reporting, and
  messaging;
- staff-facing workflows for incidents, learning evidence, transfer requests,
  and operational follow-through.

The product logic is real. The organisation name here is pseudonymous.

---

## How OrangeCat uses AOM

OrangeCat is the **economic and social layer**; `aoz-housing` is the **operational
product**. AOM on OrangeCat is an **`organization`** entity (DB table `groups` —
see `orangecat/docs/architecture/ENTITY_TYPES.md`).

| Layer | Where | Role |
|-------|-------|------|
| Organization profile | OrangeCat (`AOM`) | Public identity, messaging, funding, discovery |
| Staff/resident app | `aoz.orangecat.ch` | Placements, chores, incidents, learning evidence |
| Infrastructure | `/opt/aoz-wohnen/`, DB `aoz_wohnen` | Unchanged — not renamed to AOM |

Alongside the organization, Cat may also draft `cause`, `project`, `service`, or
`event` entities when evidence exists — those are activities, not the identity.

---

## Naming rule

Use **`AOM`** in public or pseudonymous contexts.

Keep `aoz-housing`, `aoz-wohnen`, `/opt/aoz-wohnen/`, and database
`aoz_wohnen` unchanged in infrastructure, deploy, and runtime documents.
