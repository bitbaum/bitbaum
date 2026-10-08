// Browser proof of the new studio journeys; API fixtures avoid creating fake
// production briefs. Database boundaries are exercised in Loki CI.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const base = process.argv[2];
if (!base) throw new Error("usage: node site/check-studio.mjs <base-url>");
const origin = new URL(base).origin;
const course = JSON.parse(readFileSync(new URL("./course/course.json", import.meta.url), "utf8"));
const id = "a9c3f9bc-ab63-4b89-8bdf-c982dbce2de9";
const key = "spt_" + "A".repeat(43);
const browser = await chromium.launch();
const headers = { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Authorization, Content-Type" };
const fixture = { id, kind: "website", target: "studio", website: "https://bitbaum.orangecat.ch/", changes: "Make booking easier on phones", offer: { name: "Rescue", price: "CHF 6,500", shape: "Two weeks", what: "Assessment scope" }, status: { id: "ready_for_review", title: "Preview ready", next: "Review the current scope" }, delivery: { version: 2, url: "https://bitbaum.orangecat.ch/preview", scope: "Booking form and recoverable failures", summary: "Verified on mobile and keyboard", accepted: false }, partner: null, history: [{ id: "event", actor: "studio", body: "Please review version two", at: "2026-09-30T00:00:00Z", version: 2 }] };
let checks = 0;
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
    await context.route("**/api/studio-partners", (r) => r.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ ok: true, partners: [] }) }));
    const page = await context.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    const sent = [];
    await page.route("**/api/studio-intake", (route) => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      sent.push(JSON.parse(route.request().postData()));
      return route.fulfill({ status: sent.length === 1 ? 503 : 200, headers, contentType: "application/json", body: JSON.stringify(sent.length === 1 ? { error: "Please retry; your draft is saved" } : { ok: true, id, status: "waitlisted" }) });
    });
    const handoff = encodeURIComponent(JSON.stringify({ website: "bitbaum.orangecat.ch", changes: fixture.changes }));
    await page.goto(`${base}/hire/#brief=${handoff}`, { waitUntil: "load" });
    await page.waitForSelector("#waitlist .ck-input");
    // The brief brought from Loki sits in the one field, ready to send — no form.
    assert.equal(await page.inputValue("#waitlist .ck-input"), `bitbaum.orangecat.ch — ${fixture.changes}`);
    assert.equal(await page.locator("#waitlist form, #waitlist select, #waitlist input[type=email]").count(), 0);
    assert.equal(await page.locator("#waitlist .ck-mic").count(), 1);
    await page.press("#waitlist .ck-input", "Enter");
    await page.locator("#waitlist").getByRole("button", { name: /try again/i }).first().waitFor();
    assert.match(await page.innerText("#waitlist .ck-thread"), /Please retry; your draft is saved/);
    await page.locator("#waitlist").getByRole("button", { name: /try again/i }).first().click();
    const portalLink = page.locator("#waitlist").getByRole("link", { name: "Open your portal →", exact: true });
    await portalLink.waitFor();
    assert.equal(sent.length, 2);
    assert.deepEqual(sent[0], sent[1]);
    assert.equal(sent[0].kind, "website"); assert.equal(sent[0].target, "studio");
    assert.equal(sent[0].website, "bitbaum.orangecat.ch"); assert.ok(sent[0].changes.includes(fixture.changes));
    assert.equal(sent[0].offerId, "rescue"); assert.equal(sent[0].contact, ""); assert.equal(sent[0].company, "");
    assert.match(sent[0].accessKey, /^spt_[A-Za-z0-9_-]{43}$/);
    assert.equal("userId" in sent[0] || "projectId" in sent[0], false);
    const privateLink = new URL(await portalLink.getAttribute("href"));
    assert.equal(privateLink.search, ""); assert.ok(privateLink.hash.includes(sent[0].accessKey));
    // A follow-up goes to the same record, as a message the reviewer sees.
    const follow = [];
    await page.route(`**/api/studio-portal/${id}`, (route) => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      follow.push({ auth: route.request().headers().authorization, body: JSON.parse(route.request().postData()) });
      return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.fill("#waitlist .ck-input", "Also the opening hours are wrong.");
    await page.press("#waitlist .ck-input", "Enter");
    await page.getByText("Added to your request", { exact: false }).waitFor();
    assert.equal(follow.length, 1); assert.equal(follow[0].auth, `Bearer ${sent[0].accessKey}`);
    assert.equal(follow[0].body.action, "message"); assert.equal(follow[0].body.body, "Also the opening hours are wrong.");
    // An address given later becomes the reply address (and Loki mails the link to it).
    await page.fill("#waitlist .ck-input", "ops@example.com");
    await page.press("#waitlist .ck-input", "Enter");
    await page.getByText("the private link is on its way there too", { exact: false }).waitFor();
    assert.equal(follow.length, 2); assert.equal(follow[1].body.action, "set_contact"); assert.equal(follow[1].body.contact, "ops@example.com");
    await page.unroute(`**/api/studio-portal/${id}`);
    // The portal page offers a way back without the link: the address given
    // asks for a fresh one, and the answer gives nothing away.
    const recovers = [];
    await page.route("**/api/studio-recover", (route) => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      recovers.push(JSON.parse(route.request().postData()));
      return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ ok: true, sent: true, message: "If that address belongs to a request, a fresh link is on its way to it." }) });
    });
    await page.goto(`${base}/portal/`, { waitUntil: "load" });
    await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
    await page.goto(`${base}/portal/`, { waitUntil: "load" });
    await page.waitForSelector("#portal-recover-mail");
    await page.locator("#portal-recover-mail [name=email]").fill("ops@example.com");
    await page.getByRole("button", { name: "Send me a new link", exact: true }).click();
    await page.getByText("a fresh link is on its way", { exact: false }).waitFor();
    assert.equal(recovers.length, 1); assert.equal(recovers[0].email, "ops@example.com"); assert.equal(recovers[0].company, "");
    await page.unroute("**/api/studio-recover");
    const actions = [];
    let request = structuredClone(fixture);
    let assignments = [];
    await page.route(`**/api/studio-portal/${id}`, (route) => {
      const req = route.request();
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      assert.equal(req.headers().authorization, `Bearer ${key}`);
      assert.equal(req.url().includes(key), false);
      if (req.method() === "POST") {
        const body = JSON.parse(req.postData()); actions.push(body);
        if (body.action === "accept_preview") { request.delivery.accepted = true; request.status.id = "accepted"; }
        return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      }
      return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ ok: true, request, assignments }) });
    });
    await page.goto(`${base}/portal/#id=${id}&key=${key}`, { waitUntil: "load" });
    await page.getByRole("heading", { name: "Preview version 2", exact: true }).waitFor();
    assert.equal(new URL(page.url()).hash, "");
    assert.equal(await page.locator('script[src*="widget.js"]').count(), 0);
    assert.ok(await page.getByText(fixture.delivery.scope, { exact: true }).isVisible());
    await page.getByRole("button", { name: "Accept this preview version", exact: true }).click();
    await page.getByRole("heading", { name: "Preview version 2 · accepted", exact: true }).waitFor();
    assert.equal(actions[0].action, "accept_preview"); assert.equal(actions[0].version, 2);
    assert.ok(actions[0].mutationId);
    await page.locator("#portal-request_changes [name=body]").fill("Improve the confirmation after a failed booking.");
    await page.getByRole("button", { name: "Request changes to this version", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#portal-request_changes [name=body]")?.value === "");
    assert.equal(actions[1].version, 2); assert.equal(actions[1].body, "Improve the confirmation after a failed booking.");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    // A declined application can resubmit current evidence and propose a profile.
    request = { ...structuredClone(fixture), kind: "partner", target: "application", website: "", offer: null, delivery: null, status: { id: "declined", title: "Application declined", next: "Revise evidence" }, partner: { assessment: null, coursePassed: false, approved: false, profile: null, profilePublished: false } };
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#portal-submit_assessment");
    for (const module of course.modules) await page.locator(`#portal-submit_assessment [name=${module.id}]`).fill("A specific user journey with meaningful verification and recoverable boundaries.");
    await page.locator("#portal-submit_assessment [name=projectUrl]").fill("https://bitbaum.orangecat.ch");
    await page.locator("#portal-submit_assessment [name=sourceUrl]").fill("https://github.com/bitbaum/bitbaum");
    await page.getByRole("button", { name: "Submit course evidence", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#portal-submit_assessment [name=projectUrl]")?.value === "");
    const assessment = actions.find((a) => a.action === "submit_assessment").assessment;
    assert.equal(assessment.version, course.version);
    assert.deepEqual(Object.keys(assessment.answers), course.modules.map((m) => m.id));
    assert.equal(await page.locator("#portal-propose_profile input[type=checkbox]").count(), 1);
    await page.locator("#portal-propose_profile [name=name]").fill("A qualified builder");
    await page.locator("#portal-propose_profile [name=headline]").fill("Booking systems with recoverable journeys");
    await page.locator("#portal-propose_profile [name=url]").fill("https://github.com/bitbaum");
    await page.locator("#portal-propose_profile [name=rate]").fill("Scope quoted directly");
    const countBeforeConsent = actions.length;
    await page.getByRole("button", { name: "Propose your public profile", exact: true }).click();
    assert.equal(actions.length, countBeforeConsent);
    await page.locator("#portal-propose_profile input[type=checkbox]").check();
    await page.getByRole("button", { name: "Propose your public profile", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#portal-propose_profile [name=name]")?.value === "");
    assert.equal(actions.find((a) => a.action === "propose_profile").consent, true);
    request.partner.approved = true; request.partner.coursePassed = true; request.status.id = "approved";
    const assignedId = "9a4dbe4e-cba2-4ab2-8ad3-c855ad32907f";
    assignments = [{ ...structuredClone(fixture), id: assignedId, target: "partner", delivery: { ...fixture.delivery, version: 4 } }];
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(`#portal-deliver_assignment-${assignedId}`);
    await page.locator(`#portal-deliver_assignment-${assignedId} [name=previewUrl]`).fill("https://bitbaum.orangecat.ch/next-preview");
    await page.locator(`#portal-deliver_assignment-${assignedId} [name=scope]`).fill("The assigned mobile booking flow");
    await page.locator(`#portal-deliver_assignment-${assignedId} [name=summary]`).fill("Verification evidence and a usable handover");
    await page.getByRole("button", { name: "Submit next preview", exact: true }).click();
    await page.waitForFunction((assignedId) => document.querySelector(`#portal-deliver_assignment-${assignedId} [name=previewUrl]`)?.value === "", assignedId);
    const delivered = actions.find((a) => a.action === "deliver_assignment");
    assert.equal(delivered.requestId, assignedId); assert.equal(delivered.expectedVersion, 4);

    assert.deepEqual(errors, []);
    await context.close(); checks++;
  }
} finally { await browser.close(); }
console.log(`PASS studio journeys at ${checks} widths: draft handoff, lost-response retry, private receipt, versioned review and revised course evidence`);
