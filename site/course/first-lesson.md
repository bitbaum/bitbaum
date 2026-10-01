## Lesson 1: design around a real request

Start with one person trying to finish one task. A request such as “make booking easier on phones” is useful evidence, but it is not yet a complete design. Find where the person gets stuck: choosing a service, finding an available time, confirming a booking, or recovering after an error. Describe the current failure before choosing a framework.

Write a short brief with five parts: the user, the task, the present obstacle, the intended outcome and the constraints. Constraints include existing content and data, privacy, budget, time, source access and integrations you do not control. Separate facts you observed from assumptions you still need to test. An unavailable integration is a dependency to resolve, not a reason to pretend it works.

Next, draw the smallest useful boundary. For a booking request, the public form collects a service and time, an application validates availability, and a confirmation records the result. Each boundary needs an owner, a data contract and a recoverable failure. A visitor should keep their request when a connection fails, and retrying should not book twice.

Choose a measurable outcome. For example: a first-time visitor can complete a booking using a 320px screen and a keyboard; a failed confirmation preserves their choices; retrying creates one booking. These are testable outcomes. “Modern”, “AI-powered” and “better UX” are not acceptance criteria by themselves.

## Exercise

Choose a real website you are allowed to inspect. Pick one customer journey and write the five-part brief. List observed facts and open assumptions separately. Draw the components and the data crossing each boundary. Include one timeout, one duplicate submission and one person who must not be able to see another person's record.

Build a small working capstone in a repository you control. Include a preview, one command that verifies the important behavior, and a short handover explaining deployment and rollback. You may use any suitable tools. Using Loki, OrangeCat or Solon is optional.

## Pilot assessment rubric

The reviewer records a reason for each course decision. Every dimension must have usable evidence for a pass; missing evidence leads to a request for revision. Partner approval is a later studio decision.

| Dimension | Evidence required for a pass |
| --- | --- |
| Problem and constraints | A concrete user journey, observed failure, measurable outcome, scope limits and unresolved assumptions |
| Boundaries and data | Named components and owners, data contracts, retention and export/removal behavior |
| Permissions and privacy | A permission model and a passing negative test for access to another person's request |
| Integrations and failure | Demonstrated timeout recovery, safe retry/deduplication and honest dependency status |
| Testing and accessibility | Runnable checks, working keyboard controls, labels and mobile/desktop journey evidence |
| Deployment and handover | Working preview, repeatable deployment, rollback instructions and explicit remaining dependencies |

The pilot begins with this lesson and uses the six evidence dimensions for a capstone. Further lessons, teaching examples, assessment calibration and learning-platform features remain on the roadmap. Submission records evidence; it does not automatically certify a builder or approve a partner.
