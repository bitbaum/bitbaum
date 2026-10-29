// The studio intake as a conversation (site/chat/intake-flow.mjs), driven with
// fakes: no network, no browser. Pinned: the first words are saved before
// anything answers; Loki's reply is shown, not a stamp; the brief is filed
// once when Loki's code says ready (or the visitor says go); a failed save is
// retried with the same ids; pictures are validated before they travel.
import test from "node:test";
import assert from "node:assert/strict";
import { ATTACH_LIMITS, MAX_DATA_URL, createIntake, fit, picturesFrom, siteIn, transcriptOf } from "./chat/intake-flow.mjs";

const ORIGIN = "https://loki.example";
const ID = "11111111-2222-3333-4444-555555555555";

function harness({ purpose = "studio", replies = [], failSaves = 0 } = {}) {
  const posts = [];
  const chats = [];
  let failures = failSaves;
  let n = 0;
  const io = {
    async post(url, body, key) {
      posts.push({ url, body, key });
      if (failures > 0) { failures--; throw new Error("network"); }
      if (url.endsWith("/api/studio-intake")) return { ok: true, id: ID };
      if (url.endsWith("/api/feedback")) return { ok: true, claimUrl: `${ORIGIN}/claim-feedback?token=t1` };
      return { ok: true };
    },
    async chat(body) {
      chats.push(body);
      const r = replies.shift();
      if (r instanceof Error) throw r;
      return r ?? { ok: true, reply: "Tell me more.", messages: [{ speaker: "loki", text: "Tell me more." }], ready: false, summary: "" };
    },
    newIds: () => ({ requestId: `req-${++n}`, accessKey: "spt_x" }),
    uuid: () => `m-${++n}`,
    remember() {},
    portalUrl: (a) => `https://site.example/portal/#id=${a.id}&key=${a.key}`,
    page: () => ({ pathname: "/hire/", href: "https://site.example/hire/", title: "Hire" }),
  };
  const intake = createIntake({ origin: ORIGIN, token: "fcw_t", purpose, offerId: "rescue", topic: () => "", partner: "" }, io);
  return { intake, posts, chats };
}

const loki = (text, extra = {}) => ({ ok: true, reply: text, messages: [{ speaker: "loki", text }], ready: false, summary: "", ...extra });

test("a clarifying turn: saved first, then Loki's own question — never only a stamp", async () => {
  const q = "A bakery site with online ordering sounds like a Build sprint (from CHF 18,000, four to six weeks). Do you have a website today, and should people pay online or at pick-up?";
  const { intake, posts, chats } = harness({ replies: [loki(q)] });
  const out = await intake.send("Build me a website for my bakery in Zurich with online ordering");
  assert.equal(posts.length, 1, "one save");
  assert.match(posts[0].url, /\/api\/feedback$/);
  assert.match(posts[0].body.suggestion, /^Waitlist — from the website\n\nBuild me a website/);
  assert.equal(chats.length, 1, "then one answer");
  assert.equal(chats[0].mode, "intake");
  assert.equal(chats[0].purpose, "studio");
  assert.deepEqual(chats[0].history, [], "the first turn has no history");
  assert.equal(out.said[0].text, q, "Loki's reply is what the visitor reads first");
  assert.equal(out.said[0].speaker, "loki");
  assert.match(out.said[1].text, /saved as a private request/);
  assert.match(out.said[1].text, /books no work and agrees no price/);
  assert.deepEqual(out.link, { label: "Track this request", url: `${ORIGIN}/claim-feedback?token=t1` });
  assert.equal(intake.filed, false, "one line is not a brief");
});

test("ready to file: decided by Loki's code, filed once with the whole conversation", async () => {
  const { intake, posts } = harness({
    replies: [
      loki("Do you have a website today?"),
      loki("Thank you — that is what the studio needs.", { ready: true, summary: "Bakery in Zurich, no site, online ordering, pay at pick-up." }),
      loki("Noted.", { ready: true, summary: "Same." }),
    ],
  });
  await intake.send("Build me a website for my bakery");
  const second = await intake.send("No website yet. Pay at pick-up.");
  assert.equal(intake.filed, true);
  const filed = posts.filter((p) => /Studio brief — from the website conversation/.test(p.body.suggestion ?? ""));
  assert.equal(filed.length, 1);
  assert.match(filed[0].body.suggestion, /Summary: Bakery in Zurich/);
  assert.match(filed[0].body.suggestion, /Visitor: Build me a website for my bakery/);
  assert.match(filed[0].body.suggestion, /Loki: Do you have a website today\?/);
  assert.ok(filed[0].body.suggestion.length <= 2000);
  assert.ok(second.said.some((s) => /filed this as your brief/.test(s.text)));
  // A third turn with ready again: saved as a follow-up, never filed twice.
  await intake.send("Also a gift card page.");
  assert.equal(posts.filter((p) => /Studio brief —/.test(p.body.suggestion ?? "")).length, 1, "idempotent filing");
  assert.match(posts.at(-1).body.suggestion, /^Waitlist, follow-up to:/);
});

test("an address turns the request into a website brief with a private portal", async () => {
  const { intake, posts } = harness();
  const out = await intake.send("Our site acme.ch is slow, please rebuild it. me@acme.ch");
  assert.match(posts[0].url, /\/api\/studio-intake$/);
  assert.equal(posts[0].body.kind, "website");
  assert.equal(posts[0].body.website, "acme.ch");
  assert.equal(posts[0].body.contact, "me@acme.ch");
  assert.equal(out.link.label, "Open your portal");
  assert.equal(intake.stage, "portal");
  await intake.send("Also it should work in German.");
  const msg = posts.at(-1);
  assert.match(msg.url, new RegExp(`/api/studio-portal/${ID}$`));
  assert.equal(msg.key, "spt_x");
  assert.equal(msg.body.action, "message");
});

test("a failed save is retried with the same ids, and nothing answers before it is saved", async () => {
  const { intake, posts, chats } = harness({ failSaves: 1 });
  const out = await intake.send("Rebuild acme.ch");
  assert.equal(out.said[0].failed, true);
  assert.equal(chats.length, 0, "no reply before the words are saved");
  await intake.retry();
  const tries = posts.filter((p) => p.url.endsWith("/api/studio-intake"));
  assert.equal(tries.length, 2);
  assert.equal(tries[0].body.requestId, tries[1].body.requestId, "same request id — the studio dedupes");
  assert.equal(chats.length, 1);
});

test("'send it' needs no model: the route decides, the flow files", async () => {
  const { intake, posts } = harness({ replies: [loki("What exists today?"), loki("Sent.", { ready: true, summary: "" })] });
  await intake.send("I need help with an old PHP app");
  await intake.send("send it");
  assert.equal(intake.filed, true);
  assert.ok(posts.some((p) => /Studio brief —/.test(p.body.suggestion ?? "")));
});

test("Loki down: the words are still saved and the visitor is told so", async () => {
  const { intake, posts } = harness({ replies: [new Error("503")] });
  const out = await intake.send("Build me a shop");
  assert.equal(posts.length, 1);
  assert.match(out.said[0].text, /not answering right now — your words are with the studio/);
});

test("pictures: validated, sent to both the record and the reply", async () => {
  const png = { kind: "image", name: "shot.png", mimeType: "image/png", dataBase64: "iVBORw0KGgo=" };
  const { images, refused } = picturesFrom([
    png,
    { kind: "image", name: "x.svg", mimeType: "image/svg+xml", dataBase64: "PHN2Zz4=" },
    { kind: "image", name: "evil.png", mimeType: "image/png", dataBase64: "AAA<script>" },
    { kind: "image", name: "big.jpg", mimeType: "image/jpeg", dataBase64: "A".repeat(MAX_DATA_URL) },
    { kind: "text", name: "notes.txt", content: "hi" },
    png, png, png,
  ]);
  assert.equal(images.length, 3);
  assert.equal(images[0].url, "data:image/png;base64,iVBORw0KGgo=");
  assert.equal(refused.length, 5);
  assert.match(refused.join(" "), /x\.svg is not a JPEG, PNG or WebP/);
  assert.match(refused.join(" "), /notes\.txt is not a picture/);
  assert.match(refused.join(" "), /big\.jpg is too large/);
  assert.match(refused.join(" "), /Only 3 pictures/);
  // The composer is told to shrink to fit the same cap.
  assert.ok(ATTACH_LIMITS.maxImageBytes * 4 / 3 + 40 < MAX_DATA_URL);

  const { intake, posts, chats } = harness();
  await intake.send("This page is broken", images.slice(0, 1));
  assert.deepEqual(posts[0].body.screenshots, ["data:image/png;base64,iVBORw0KGgo="]);
  assert.deepEqual(chats[0].images, ["data:image/png;base64,iVBORw0KGgo="]);
  assert.match(transcriptOf(intake.turns), /\[1 picture attached\]/);
});

test("helpers", () => {
  assert.equal(siteIn("see acme.ch."), "acme.ch");
  assert.equal(siteIn("e.g. this"), "");
  assert.equal(siteIn("mail me@acme.ch"), "");
  const long = fit("head", "x".repeat(5000));
  assert.equal(long.length, 2000);
  assert.ok(long.startsWith("head\n\n…"));
});
