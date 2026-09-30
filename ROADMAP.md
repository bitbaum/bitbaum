# Bitbaum roadmap

Canonical studio implementation plan. Confirmed requirements and the accepted architecture are in [the delivery plan](docs/commissioning-and-portals.md). Order carries priority; dates and unbuilt capabilities are not promised. The public pages render these repository records through bip-kit. Checked items are implemented and verified in CI; production deployment and real pilot engagements have their own gates below.

## Now

### Separate the free tool from studio services
Give visitors routes to independent Loki self-service, an approved partner, or the studio waitlist.
- [x] Record that studio engagement prices belong to Bitbaum, while Loki is a standalone free tool
- [x] Put the studio URL/change intake on Bitbaum with its current offer and capacity
- [x] Remove studio pricing/submission from Loki's self-serve brief; retain an optional external studio link
- [x] Preserve the brief through an explicit self-serve handoff and sign-in
- [x] Offer only approved partners with real availability; provide an honest path while the directory is empty

### Make studio development traceable
Course, portal and product decisions should survive conversations and become visible work.
- [x] Add canonical repository roadmap and changelog
- [x] Separate confirmed requirements, code evidence and architecture proposals
- [x] Repair Bitbaum's profile/repository join so the map reads these records instead of test notes
- [x] Render and link public roadmap/changelog pages using the existing building-in-public contract
- [x] Reconcile studio-owned course/approval work on Loki's roadmap with Bitbaum ownership

### Prove the first portal engagement
Start one Bitbaum-branded customer flow with access to only that engagement and no mandatory cross-product participation.
- [x] Record the shared portal recommendation and two alternatives
- [x] Verify scoped Loki API/guest access, revocation and a narrow delivery-review action for the accepted shared backend
- [x] Build brief, receipt, status, next action, preview and change-request views
- [x] Record delivery approval without customer agent-execution or credential access
- [x] Verify customers and assigned partners cannot access unrelated projects
- [ ] Complete the first real engagement through brief, preview, revision and exact-version acceptance

## Next

### Start the systems-design course
Develop a studio-owned course through one transferable practical module and reviewed capstone before a full learning platform.
- [x] Write the first lesson, exercise and assessment rubric
- [ ] Pilot problem definition, system boundaries and a working capstone
- [ ] Extend to permissions, integrations, testing, accessibility, deployment, rollback and handover
- [x] Record course completion as evidence for studio review, not automatic approval
- [ ] Calibrate the rubric with a real candidate and reviewer before expanding the course

### Operate partner qualification and assignment
Application, course completion, studio approval and availability are separate states with useful next actions.
- [x] Add private application/qualification records with review reasons
- [x] Give reviewers course-evidence review and explicit approve/decline/request-information actions
- [x] Publish only approved, consenting partner profiles and maintain real availability
- [x] Give assigned partners only their assigned briefs and delivery actions; grant no technical project access by default
- [x] Preserve the current commercial model unless its owner explicitly changes it
- [ ] Complete the first studio-reviewed qualification and consenting directory publication

### Release the shared portal
Ship the verified backend before exposing the Bitbaum views.
- [x] Pass Loki's full CI, including real PostgreSQL isolation, revocation and retry tests
- [x] Pass Bitbaum's intake, portal, theme and 135 responsive browser checks
- [ ] Verify the additive production migration and deployed Loki API
- [ ] Deploy the Bitbaum views through the API availability gate and verify the public pages

## Later

### Connect products when the task needs it
Keep public discovery/funding, private execution and collective governance optional and understandable at the handoff.
- [x] Test standalone studio and Loki journeys without OrangeCat publication or Solon membership
- [ ] Test requested handoffs preserve identity, project context and explicit consent
- [ ] Review authentication dependencies before promising standalone participation in every product
- [ ] Add broader matching or marketplace features after actual engagements establish the need
