# Bitbaum roadmap

Canonical studio implementation plan. Confirmed requirements and the accepted architecture are in [the delivery plan](docs/commissioning-and-portals.md). Order carries priority; dates and unbuilt capabilities are not promised. The public pages render these repository records through bip-kit. Checked items are implemented and verified in CI; production deployment and real pilot engagements have their own gates below.

## Now

### Separate the free tool from studio services
Give visitors routes to independent Loki self-service, an approved builder, or the studio waitlist.
- [x] Record that studio engagement prices belong to Bitbaum, while Loki is a standalone free tool
- [x] Put the studio URL/change intake on Bitbaum with its current offer and capacity
- [x] Remove studio pricing/submission from Loki's self-serve brief; retain an optional external studio link
- [x] Preserve the brief through an explicit self-serve handoff and sign-in
- [x] Offer only approved builders with real availability; provide an honest path while the directory is empty
- [x] One door: the waitlist, the website brief and the builder application are a single free-form field, typed or spoken, that refuses nothing and hands back a private portal link
- [ ] Let the words be structured by a model on Loki (address, email, kind, engagement) so the one question the intake still asks disappears
- [ ] Give a new-build idea without a website its own request kind on Loki, so it lands in the portal rather than the inbox

### Make the site work for a builder
A builder decides in two minutes whether to join, and can get back in without hunting for a link.
- [x] Two doors on the first screen: start a project, become a builder
- [x] A builders page that says what an approved builder gets, how approval works and what happens after the one message
- [x] Pages open at their top; the receipt link appears where the reply names it; "Copy your private link" copies
- [x] A chosen builder is carried with a request that has no website yet, and the page says who was asked for
- [x] Arriving with a builder chosen lands on the box; the box and the receipt stay on screen after a message, sent or failed
- [ ] Take the chatkit release that never follows a page upward (chatkit #88), set `--ck-follow-gap` on the contact box, and delete the correction in `site/chat/chat.tsx` that stands in for it
- [ ] The first studio-reviewed profile in the directory, which is empty today
- [ ] A builder workspace opened by an account: applications, profile, availability and briefs in one place, without a new private link each time
- [ ] A page per builder and a directory that can be searched by skill and availability

### Sign in from the studio site
The site holds no accounts; a person's account is their Loki account. The header should still know who is looking.
- [x] Loki answers the studio site with who is signed in, and sign-in returns to the page a person was on (Loki #1672, deployed)
- [x] accountkit: one account control for signed out, loading and signed in, and a menu that stays on the screen wherever it sits (accountkit #92)
- [ ] A release of accountkit that carries the account control (it is merged, and the published 0.29.0 does not have it)
- [ ] The header shows who is signed in, with their application and a way to sign out
- [ ] One name for sign-in on the portal, the private projects page and the header

### Move the chrome to sitekit
Header, menu and footer belong to the shared package; today they are drawn in this repository.
- [x] sitekit: its own box model, links to other origins, a footer year that does not read the clock (sitekit #51)
- [ ] sitekit: a menu script that works without React, a background per surface, reflow at 200% text
- [ ] sitekit: a scroll-aware masthead, slots for the call to action, the account and the utilities, a sheet menu, a configurable collapse
- [ ] Render the masthead and footer from sitekit at build time and delete the local menu script

### Answer a wrong address
A missing page should show the site and a way on, not an empty response.
- [x] The build writes a page for a missing address, with the header and four ways on
- [ ] Caddy on the box serves it for a missing path with the 404 status, and the publish check asks for it

### Read well at any text size
A reader who doubles their text size on a phone gets every word, whole.
- [x] No page is wider than the screen and no text is cut off at 200% text on 320px and 390px, checked on every page
- [ ] A one-word card title ("Diplodoctor", "design-tokens") still breaks mid-word at 200% text on a 320px screen, because the card's padding grows with the text; size it so the word fits
- [ ] A reading surface behind text sections, so a drifting cloud never passes behind a line

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
- [x] Verify customers and assigned builders cannot access unrelated projects
- [ ] Complete the first real engagement through brief, preview, revision and exact-version acceptance

## Next

### Start the systems-design course
Develop a studio-owned course through one transferable practical module and reviewed capstone before a full learning platform.
- [x] Write the first lesson, exercise and assessment rubric
- [ ] Pilot problem definition, system boundaries and a working capstone
- [ ] Extend to permissions, integrations, testing, accessibility, deployment, rollback and handover
- [x] Record course completion as evidence for studio review, not automatic approval
- [ ] Calibrate the rubric with a real candidate and reviewer before expanding the course

### Operate builder qualification and assignment
Application, course completion, studio approval and availability are separate states with useful next actions.
- [x] Add private application/qualification records with review reasons
- [x] Give reviewers course-evidence review and explicit approve/decline/request-information actions
- [x] Publish only approved, consenting builder profiles and maintain real availability
- [x] Give assigned builders only their assigned briefs and delivery actions; grant no technical project access by default
- [x] Preserve the current commercial model unless its owner explicitly changes it
- [ ] Complete the first studio-reviewed qualification and consenting directory publication

### Release the shared portal
Ship the verified backend before exposing the Bitbaum views.
- [x] Pass Loki's full CI, including real PostgreSQL isolation, revocation and retry tests
- [x] Pass Bitbaum's intake, portal, theme and 135 responsive browser checks
- [x] Verify the additive production migration and deployed Loki API (loki #995 is live; /api/studio-intake answers)
- [x] Deploy the Bitbaum views through the API availability gate and verify the public pages (`site/check-studio-api.mjs` passes against production; /hire/, /partners/ and /portal/ answer)
- [x] Notify the studio when a request or application is created (loki #1002: push, Telegram and an alert on every studio request and guest action)

## Later

### Connect products when the task needs it
Keep public discovery/funding, private execution and collective governance optional and understandable at the handoff.
- [x] Test standalone studio and Loki journeys without OrangeCat publication or Solon membership
- [ ] Test requested handoffs preserve identity, project context and explicit consent
- [ ] Review authentication dependencies before promising standalone participation in every product
- [ ] Add broader matching or marketplace features after actual engagements establish the need
