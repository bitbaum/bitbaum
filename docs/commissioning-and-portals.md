# Bitbaum studio, independent tools and the partner network

Updated 30 September 2026 after the product owner's clarification. Confirmed requirements are distinguished from recommendations and observed code. Implementation progress belongs in [ROADMAP.md](../ROADMAP.md); completed changes belong in [CHANGELOG.md](../CHANGELOG.md).

## Confirmed requirements

- Loki is a standalone tool people can use for free to do their own work. Studio engagement prices, including CHF 6,500, belong to Bitbaum's human services, not Loki's website-change tool.
- Bitbaum presents its studio prices and actual capacity clearly. The studio is currently at capacity. Visitors should also have a route to an approved partner and a route to do the work themselves with Loki.
- A studio request starts with the website URL and desired changes. Bitbaum owns that front door and commercial context. Loki may supply execution and intake infrastructure without becoming the studio's storefront.
- Partners are approved by the studio after completing the studio's systems-design course. The course still needs development. Completion is a prerequisite for studio review, not automatic approval.
- Course and customer/partner portal work must be recorded, visible in the development plan, and started soon. Their unfinished status must remain clear.
- Products should work together without requiring everyone to participate in every product. Connecting OrangeCat, Solon or a Loki workspace must be relevant to the person's task and explicit.
- New information must survive a conversation: capture requirements, distinguish decisions from proposals, create work with acceptance criteria, and record verified outcomes.
- Existing artwork is retained and placed across the growing site in grounded compositions that do not overlap mobile copy or controls.

## Three visitor paths

| Path | Entry | Delivery | Commercial context |
| --- | --- | --- | --- |
| Do it yourself | Bitbaum links to Loki; people may also arrive directly on Loki | The visitor uses the independent tool | Free tool access is separate from studio services; execution resources are described by Loki's own rules |
| Hire an approved partner | Bitbaum's partner area and a project brief | An approved independent partner | The partner's agreed scope and quote; CHF 6,500 is not their default price |
| Hire the studio | Bitbaum's studio intake | Bitbaum | Published studio offer, scope and availability; currently a waitlist |

The two-field brief can share implementation, but each destination owns its next action. Preserve a brief through an explicit handoff. Studio prices must not become the default meaning of a Loki project. Never suggest a partner is available before an approved partner can actually accept the work.

Current prices, scope and capacity are produced by [site/hire.json](../site/hire.json), not this document. The existing CHF 6,500 offer describes Rescue assessment work. Redefining it as a bounded website rebuild remains a separate commercial decision; the clarification did not specify new deliverables.

## Initial code observations before implementation

Observed on repository main branches on 30 September 2026, not guarantees of readiness.

| Area | Evidence | Implication |
| --- | --- | --- |
| Website brief | Loki's commission page and WebsiteCommissionForm combine self-serve and studio modes and load the studio offer | Move studio intake/pricing to Bitbaum; keep Loki's independent brief focused on self-service |
| Studio intake and partner applications | Bitbaum's site/build.mjs uses existing intake; site/check-hire.mjs covers submission and tracking | Reuse receipt/recovery infrastructure rather than creating another inbox |
| Partner supply | site/partners.json is empty | No approved partners are listed; establish qualification and genuine availability before promising a hire |
| Course and partner track | [Loki's roadmap](https://github.com/bitbaum/loki/blob/main/ROADMAP.md) already lists the academy and partner track; no academy or partner-application implementation was found in src/ | The idea was recorded, but course and approval workflow are unbuilt; studio qualification belongs to Bitbaum |
| Project permissions | [Loki memberships](https://github.com/bitbaum/loki/blob/main/src/db/schema/project-memberships.ts) include editor, client, viewer and one-project invitations | Useful portal foundation; client is read-only today, so delivery approval needs its own narrow action, not editor rights |
| Human delivery | Loki already has Crew assignments and share-link delivery | Investigate reusing bounded assignment flows; a guest recipient need not enter the whole operator workspace |
| Development records | [Repository record contract](https://github.com/bitbaum/loki/blob/main/docs/architecture/building-in-public-records.md) reads root ROADMAP.md and CHANGELOG.md; [bip-kit](https://github.com/bitbaum/bip-kit) supplies loaders/renderers | Render canonical records rather than maintaining another handwritten list |
| Bitbaum records | Before this update there were no root records or generated roadmap/changelog pages; the map snapshot contained test notes | Repair the profile/repository join, then render proper studio records |
| Integrations | [OrangeCat's contract](https://github.com/bitbaum/orangecat/blob/main/src/config/ecosystem.ts) uses explicit handoffs; [Solon authentication](https://github.com/bitbaum/solon/blob/main/src/lib/auth/index.ts) uses OrangeCat recognition | Independence is not uniform today. Review that dependency before promising standalone Solon participation |

## Portal options

Option 1 was accepted on 30 September 2026. Bitbaum owns the portal views and course; Loki supplies a bounded request API and signed-in reviewer view. The alternatives remain as context for later changes, not open decisions.

| Option | Shape | Reason and tradeoff |
| --- | --- | --- |
| **1. One Bitbaum portal with customer and partner views — recommended** | One engagement/history, different customer, partner and reviewer permissions | Share brief, preview and acceptance records. Reuse Loki project/assignment APIs where they fit while keeping the studio experience on Bitbaum |
| 2. Separate customer and partner applications | Two applications with explicit shared contracts | Useful if workflows become different products; more identity, deployment and permission work before the first complete engagement |
| 3. Studio-branded guest project links first | Bitbaum opens narrowly scoped project/review links; fuller portal follows | Fastest delivery validation, but qualification, training and commercial scope still need a coherent studio surface |

Start option 1 with one complete engagement, not a large dashboard: brief, receipt, status, next action, preview, changes and approval. Partners see assigned work, required access and handover. Studio reviewers see application evidence, course completion and approval.

Navigation should describe the task: projects, messages, previews and approvals. Optional actions may offer Loki self-service, OrangeCat publication/funding or Solon governance, explaining the consequence before leaving the studio.

## Ownership and access

| Record/action | Proposed owner | Boundary |
| --- | --- | --- |
| Offers, capacity, engagement scope | Bitbaum | Studio business facts are not copied into Loki pricing |
| Qualification, course progress, studio approval | Bitbaum | Evidence stays private; only approved, consenting profiles appear publicly |
| Technical project, repository, runs, preview evidence | Loki | Reference the canonical project ID; do not duplicate the technical project |
| Public profile, funding/economic activity | OrangeCat when requested | A private engagement is not automatically public |
| Collective decisions/governance | Solon when appropriate | An ordinary brief, course completion or delivery approval needs no governance organisation or vote |
| Public roadmap/changelog | Each owning repository via the existing record contract | The website renders records rather than maintaining another copy |

Shared identity grants no cross-product access by itself. Grant explicit customer, partner and reviewer actions per engagement/project. A customer approving a preview must not gain agent-execution or credential access. Connecting a product is separate from signing in. Audit actual login and execution paths before promising a particular account journey.

The first implementation is a bounded portal: one Bitbaum-branded customer/guest view reading one Loki project and recording one delivery review. Verify scope, revocation and approval boundaries before choosing framework or backend placement. Reuse APIs that fit, adding missing capabilities at their owner. Bitbaum currently has a static generator; a stateful portal requires an application service, not just a link or an empty dashboard.

## Course and studio approval

The studio owns the course. Proposed curriculum: problem definition/constraints; data and system boundaries; identities, permissions and privacy; integrations and recoverable failures; testing, accessibility and observability; deployment/rollback; operating a system; customer handover and explaining tradeoffs.

Teach transferable systems design. Studio products can provide examples; learning must not require participating in every product.

Begin with one practical module and a capstone rubric before building a full learning platform. A candidate demonstrates a working system, a clear design, meaningful verification and usable handover. Course completion and studio approval are distinct events.

Proposed states: submitted, course in progress, course complete, studio review, approved, declined or more information needed. Review records include reasons and next actions. Qualification and current availability are different facts; neither follows from merely sending a message.

## Work packets

Acceptance criteria and priority live in [ROADMAP.md](../ROADMAP.md).

| Work | Owning codebase | First result |
| --- | --- | --- |
| Correct the three visitor paths | Bitbaum + Loki | Studio intake on Bitbaum; free self-serve brief on Loki; honest partner availability |
| Publish development records | Bitbaum + existing bip-kit/Loki seam | Correct profile/repository join and public roadmap/changelog |
| Portal feasibility and customer flow | Bitbaum + Loki project APIs | Brief → receipt → next action → preview → review, with access/revocation checks |
| First course module/assessment | Bitbaum | Transferable practical lesson and pilot capstone rubric |
| Qualification and delivery | Bitbaum + bounded Loki assignments | Course evidence → studio review → approved profile → permitted assignment |
| Optional integrations | Relevant source/destination products | Preserved context/consent and a useful path when an integration is declined |

Completed work links implementation and verification in the changelog. Public development records do not publish customer briefs, code, contact details or qualification evidence. Open questions include portal service placement, assessment details, existing-candidate handling and any revised studio deliverables; none is silently decided here.

## Implementation and remaining proof

The approved first slice uses a Bitbaum browser view backed by Loki's PostgreSQL request records. Website briefs and partner applications receive a 256-bit private request link, carried in the URL fragment and sent to the API as a bearer credential. No ecosystem account is required for these guest views. Project linkage is an internal reference and grants no execution, project membership or credential access.

Customers see their brief, current offer snapshot, status, next action, visible history and the current preview's scope. Acceptance records an exact delivery version; a revision clears that acceptance. Partners can submit revised evidence, propose a consenting profile, maintain availability and deliver only assigned briefs. A signed-in studio owner reviews course evidence, separately approves or declines the application, and reviews profile publication. Each action has an idempotent retry identifier. Guest access can be revoked.

The course is a pilot: one written lesson, one exercise, six capstone evidence dimensions and a review rubric. Full lessons, teaching examples and assessment calibration remain work. Passing the course does not automatically approve a partner. Existing direct customer/partner contracts and no-cut model are retained; no payment or revenue-share feature is introduced.

Canonical roadmap and changelog pages use bip-kit and the repository records. A missing repository URL in a studio project is resolved through the existing serve-register join rather than a broad database update by name.

Release requires database isolation/revocation/retry tests, browser tests of intake and versioned review, mobile layout regression and the normal repository CI/deployment gates. A working local view alone is not deployment evidence. The first real partner review and customer engagement remain pilot work after release.
