# Website commissioning and Bitbaum's next product step

Status: product proposal, 30 September 2026. The website brief and direct partner application are the first steps; the portal options below are not implemented portals.

## The customer door

A website address and the customer's own description of the desired changes are enough to start a request. Bitbaum links to Loki's `/commission` page. The customer can either start a private Loki project with the existing build-and-review pipeline or save a request for the Bitbaum studio to review. The brief survives sign-in and failed submission. A successful studio submission offers a claim link into Loki's existing request tracking.

The commercial offer and capacity have one producer: `site/hire.json`. The generated `commission.json` exposes the currently selected offer and availability to Loki. The published CHF 6,500 Rescue currently covers a two-week assessment, local setup, CI tests and ranked risks. It does not currently promise every requested redesign or integration for that price. Saving a request neither charges the customer nor confirms scope or timing. Changing that package into a fixed-price website rebuild would be a separate commercial decision, with its deliverables and exclusions written into the same source.

A public URL provides reference material. It does not provide source-code ownership, access to private content or integrations, or permission to replace the original production site. Loki develops a separate version, records missing access in its project and presents a preview and verification evidence for review.

## Three options

| Option | What Bitbaum becomes | Benefit | Cost or constraint |
| --- | --- | --- | --- |
| **1. Shared project workspace — recommended** | The public studio and partner front door, with customer and partner views over the same Loki projects | One brief, status, preview, conversation and review history; can grow without duplicating project records | Requires project-scoped membership and clear responsibilities before partners can access customer work |
| 2. Customer portal first, managed studio only | A studio with a private place for customers to brief, review and approve work | Smallest operating model; a clear customer journey | Partner applications and delivery remain separate operational work until demand justifies a partner view |
| 3. Partner marketplace with separate portals | A directory and commissioning marketplace that matches customers to independent builders | Partners can take more work and maintain their own offers | Needs proven partner supply, matching, disputes, availability and contract handling; listing unapproved partners or promising automated matching would be premature |

## Recommended sequence

1. Make the brief reliable: URL and desired changes, a receipt, recovery after failure, and visible progress. Use the existing Loki project, repository and run identities throughout.
2. Add the customer workspace around that project: current stage, next action, preview, review notes, agreed scope and approvals. Explain what is waiting for the customer. A queued run or successful agent turn must not be presented as a verified deployment.
3. Make partner review operational: submitted → needs information → approved or declined. Keep application material private. A person approves the partner; only approved public profiles appear in the directory. Today's direct application uses the existing studio inbox and request tracking, not a new approval system.
4. Add the partner view after the studio has real assignments: assigned briefs, permission-limited project access, availability and delivery handover. Reuse Loki's existing Crew and project permissions where suitable; do not grant broad access to a customer's personal workspace.
5. Add commercial records once the delivery flow is proven: agreed scope, change requests, invoices or payment references, and reviewable approvals. The current partner model remains independent: customers contract and pay the partner directly, and the studio takes no cut.

## Decisions to explore before building a portal

- Is the first customer buying a human-managed Bitbaum engagement or using Loki directly? The two doors can share a brief, but ownership of delivery and commercial terms must stay explicit.
- Which partner work is actually needed: leads, delivery assignments, or both? Start from applications and real customer requests rather than creating a marketplace before there is supply.
- Who can approve scope, access a preview and authorize publication? Define those permissions per project before exposing partner access.
- What should the customer see when a build is blocked on source access, integrations, capacity or an approval? Make those states visible and actionable.
- Does the CHF 6,500 package remain a rescue assessment, or become a bounded website-change package? Decide its deliverables before changing the public promise.

## Artwork as the site grows

Mobile scenes occupy their own space below copy. Page guests use a dedicated stage with a floor; small compositions in `site/art-placement.mjs` live in the normal page flow. Keep existing assets and give new objects a page and a grounded composition rather than putting them over headings or buttons. The responsive browser gate covers all generated pages at phone and tablet widths, rotation and enlarged text.
