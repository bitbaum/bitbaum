// The studio's one door, as a conversation — the logic, with no React and no
// network of its own, so site/intake-flow.test.mjs can drive it with fakes.
//
// Two promises, kept in this order on every turn:
//
//  1. SAVED FIRST. The visitor's words (and pictures) reach the studio before
//     anything answers: the first message becomes a private request on Loki
//     at once — a website brief with a portal when an address is in it
//     (POST /api/studio-intake), a partner application on /partners/, and
//     otherwise a waitlist note (POST /api/feedback). Every later message is
//     added to the same record. A request that bounces is a person lost.
//  2. THEN A REPLY LIKE A PERSON'S. Loki answers through the widget chat's
//     intake mode (POST /api/widget/chat {mode: "intake"}): one or two
//     questions at a time, the published engagement the request resembles,
//     nothing promised. When Loki's code (not its prose) says the brief is
//     ready — or the visitor says "send it" — the brief is filed ONCE on the
//     same record, with the whole conversation.
//
// It used to answer every message with the same stamp ("you are on the
// waitlist"); the owner read that, rightly, as a chat that did not listen
// (2026-10-27). The honesty rules did not move: sending books no work and
// agrees no price, and a person reads every word.

export const EMAIL = /[^\s<>(),;:"']+@[^\s<>(),;:"']+\.[a-z]{2,}/i;
// A public address written loosely: "acme.ch", "www.acme.ch/shop", "https://…".
const SITE = /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"'(),]*)?/i;
export const UUID = /^[a-f\d-]{36}$/i;

export function siteIn(text) {
  // An address ends a sentence more often than not: the full stop, comma or
  // bracket after it is the sentence's, not the address's.
  const found = (text.replace(EMAIL, " ").match(SITE)?.[0] ?? "").replace(/[.,;:!?)\]]+$/, "");
  // "e.g." and "i.e." are not websites.
  return found && !/^(e\.g|i\.e)\b/i.test(found) ? found : "";
}

// ── pictures ────────────────────────────────────────────────────────────────
// The same shape Loki accepts for feedback screenshots and chat images:
// jpeg/png/webp data URLs, at most 600k characters each. Never SVG (it can
// carry script), never anything that is not a picture.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES = 3;
export const MAX_DATA_URL = 600_000;
/** What chatkit's composer is told, so a phone screenshot is shrunk on the
 *  device to fit before it is staged (420 KB → ~560k base64 characters). */
export const ATTACH_LIMITS = { maxFiles: MAX_IMAGES, maxImageEdge: 1280, maxImageBytes: 420_000 };

/** chatkit attachments → data URLs Loki accepts, and a plain sentence for
 *  every one that cannot travel (never a silent drop). */
export function picturesFrom(attachments = []) {
  const images = [];
  const refused = [];
  for (const a of attachments) {
    if (a.kind !== "image") {
      refused.push(`${a.name} is not a picture — paste its text into the box instead.`);
      continue;
    }
    const mime = String(a.mimeType).toLowerCase().replace("image/jpg", "image/jpeg");
    const url = `data:${mime};base64,${a.dataBase64}`;
    if (!IMAGE_TYPES.includes(mime)) refused.push(`${a.name} is not a JPEG, PNG or WebP picture.`);
    else if (!/^[A-Za-z0-9+/]+={0,2}$/.test(a.dataBase64)) refused.push(`${a.name} could not be read.`);
    else if (url.length > MAX_DATA_URL) refused.push(`${a.name} is too large to send.`);
    else if (images.length >= MAX_IMAGES) refused.push(`Only ${MAX_IMAGES} pictures fit in one message; ${a.name} stayed behind.`);
    else images.push({ name: a.name, url });
  }
  return { images, refused };
}

// ── words ───────────────────────────────────────────────────────────────────
const pics = (n) => (n ? ` [${n} picture${n > 1 ? "s" : ""} attached]` : "");
/** The conversation as the studio reads it. */
export function transcriptOf(turns) {
  return turns.map((t) => `${t.role === "user" ? "Visitor" : "Loki"}: ${t.text}${pics(t.pictures)}`).join("\n\n");
}
/** A body for a 2000-character field: the head, and as much of the
 *  conversation as fits, newest kept — the older words are already on the
 *  record, each saved as it was said. */
export function fit(head, transcript, max = 2000) {
  const room = max - head.length - 2;
  if (room <= 0) return head.slice(0, max);
  return `${head}\n\n${transcript.length > room ? `…${transcript.slice(-(room - 1))}` : transcript}`;
}

const SAVED_NOTE = "A person at the studio reads every word; sending books no work and agrees no price.";
const ASK_EMAIL = " Want the reply by email? Write your address here — optional.";

/**
 * One intake on one page. `io` is everything that touches the world:
 *   post(url, body, key?) → parsed JSON (throws {message, said} on failure)
 *   chat(body)            → Loki's widget chat answer (throws on failure)
 *   newIds()              → { requestId, accessKey } for an idempotent studio request
 *   uuid()                → a mutation id
 *   remember(access)      → keep the portal link for /portal/
 *   portalUrl(access)     → the private link
 *   page()                → { pathname, href, title }
 */
export function createIntake(cfg, io) {
  const state = {
    stage: { kind: "fresh" }, // | { kind: "portal", access } | { kind: "waitlist", first }
    replyTo: "",
    ids: null,
    turns: [], // { role, text, pictures }
    filed: false,
    pending: null,
  };
  const page = () => io.page();
  const where = () => (cfg.purpose === "partner" ? "application" : "portal");

  async function open(body, email) {
    state.ids ??= io.newIds();
    const data = await io.post(`${cfg.origin}/api/studio-intake`, { ...state.ids, company: "", contact: email, ...body });
    if (!data.id || !UUID.test(data.id)) throw Object.assign(new Error("The receipt was incomplete. Press “Try again”."), { said: true });
    const access = { id: data.id, key: state.ids.accessKey };
    io.remember(access);
    state.stage = { kind: "portal", access };
    return { label: `Open your ${where()}`, url: io.portalUrl(access) };
  }
  function note(suggestion, email, images = []) {
    const p = page();
    return io.post(`${cfg.origin}/api/feedback`, {
      token: cfg.token,
      suggestion: suggestion.slice(0, 2000),
      contact: (email || state.replyTo || undefined)?.slice(0, 200),
      page: p.pathname.slice(0, 300), url: p.href.slice(0, 1000), pageTitle: p.title.slice(0, 300) || undefined,
      ...(images.length ? { screenshots: images.map((i) => i.url) } : {}),
    });
  }
  function portal(body) {
    const s = state.stage;
    return io.post(`${cfg.origin}/api/studio-portal/${s.access.id}`, { ...body, mutationId: io.uuid() }, s.access.key);
  }
  const visitorWords = () => state.turns.filter((t) => t.role === "user").map((t) => t.text).join("\n\n");
  const topicLine = () => { const t = cfg.topic(); return t ? `Engagement: ${t}\n` : ""; };

  /** Promise 1: the words reach the record. Returns a link to show, if any. */
  async function save(text, images, email) {
    const site = siteIn(text);
    const s = state.stage;
    // Pictures sent to a portal request travel as a note beside it: the
    // studio-request record keeps words, the inbox keeps pictures.
    const picturesBeside = async (id) => {
      if (images.length) await note(`Pictures for studio request ${id}`, email, images);
    };
    if (s.kind === "portal") {
      if (email && email !== state.replyTo) await portal({ action: "set_contact", contact: email.slice(0, 200) });
      const rest = text.replace(email, "").replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g, "");
      if (rest.length > 1 || !email) await portal({ action: "message", body: text.slice(0, 2000) });
      await picturesBeside(s.access.id);
      return null;
    }
    if (s.kind === "waitlist" && site) {
      // The address that was missing: the note becomes a website brief with
      // its own portal, carrying everything said so far.
      const link = await openWebsite(site, visitorWords(), email);
      await picturesBeside(state.stage.access.id);
      return link;
    }
    if (s.kind === "waitlist") {
      await note(`Waitlist, follow-up to: “${s.first.slice(0, 300)}”\n\n${text}`, email, images);
      return null;
    }
    if (cfg.purpose === "partner") {
      const link = await open({ kind: "partner", website: site, changes: text.slice(0, 2000) }, email);
      await picturesBeside(state.stage.access.id);
      return link;
    }
    if (site) {
      const link = await openWebsite(site, text, email);
      await picturesBeside(state.stage.access.id);
      return link;
    }
    const data = await note(`Waitlist — from the website\n${topicLine()}\n${text}`, email, images);
    state.stage = { kind: "waitlist", first: text };
    return data.claimUrl?.startsWith(`${cfg.origin}/claim-feedback?token=`) ? { label: "Track this request", url: data.claimUrl } : null;
  }
  function openWebsite(site, words, email) {
    const target = cfg.partner ? "partner" : "studio";
    return open({
      kind: "website", website: site, target,
      changes: `${topicLine()}${words}`.slice(0, 1200),
      ...(target === "studio" ? { offerId: cfg.offerId } : { preferredPartnerId: cfg.partner }),
    }, email);
  }

  /** The brief, filed once, on the record the first message opened. */
  async function file(summary) {
    if (state.filed) return false;
    const head = `${cfg.purpose === "partner" ? "Partner application" : "Studio brief"} — from the website conversation\n${topicLine()}${summary ? `Summary: ${summary.slice(0, 600)}` : ""}`.trim();
    const body = fit(head, `Conversation:\n${transcriptOf(state.turns)}`);
    if (state.stage.kind === "portal") await portal({ action: "message", body });
    else await note(body, "");
    state.filed = true;
    return true;
  }

  /** Promise 2: an answer. Never throws — a chat that cannot answer says so. */
  async function answer(text, images) {
    const p = page();
    const history = state.turns.slice(0, -1).slice(-12).map((t) => ({ role: t.role === "user" ? "user" : "assistant", content: t.text.slice(0, 2000) }));
    try {
      const r = await io.chat({
        token: cfg.token, mode: "intake", purpose: cfg.purpose,
        message: text.slice(0, 1000), history,
        ...(images.length ? { images: images.map((i) => i.url) } : {}),
        url: p.href.slice(0, 1000), pageTitle: p.title.slice(0, 300) || undefined,
      });
      const said = (r.messages?.length ? r.messages.map((m) => m.text) : [r.reply]).filter((t) => typeof t === "string" && t.trim());
      if (!said.length) throw new Error("empty");
      return { said, ready: r.ready === true, summary: typeof r.summary === "string" ? r.summary : "" };
    } catch {
      return { said: ["The assistant is not answering right now — your words are with the studio all the same, and a person reads them. Add anything you like below."], ready: false, summary: "" };
    }
  }

  /**
   * One visitor turn. Returns what to show: assistant lines (one may be
   * `failed`, then `retry()` repeats the turn), and a link when the request
   * gained a portal or a tracking link.
   */
  async function send(text, images = []) {
    const email = text.match(EMAIL)?.[0] ?? "";
    const first = state.stage.kind === "fresh";
    state.pending = { text, images };
    let link;
    try {
      link = await save(text, images, email);
    } catch (err) {
      return {
        said: [{ text: err?.said ? `${err.message} Your words are still here — press “Try again”, or add to them.` : "That did not reach us — your words are still here. Press “Try again” below.", failed: true }],
        link: null,
      };
    }
    state.pending = null;
    const newEmail = email && email !== state.replyTo;
    if (email) state.replyTo = email;
    state.turns.push({ role: "user", text, pictures: images.length });

    const a = await answer(text, images);
    for (const t of a.said) state.turns.push({ role: "assistant", text: t });
    const out = a.said.map((t) => ({ text: t, speaker: "loki" }));
    const status = [];
    if (first) {
      const keep = !link ? "" : state.stage.kind === "portal" ? ` — the link below is your private ${where()}; keep it` : " — the link below follows it";
      status.push(`Your words are saved as a private request${keep}. ${SAVED_NOTE}`);
    }
    if (newEmail) status.push(`The reply will go to ${email}${state.stage.kind === "portal" ? ", and the private link is on its way there too" : ""}.`);
    if (a.ready && !state.filed) {
      try {
        if (await file(a.summary))
          status.push(`I have filed this as your ${cfg.purpose === "partner" ? "application" : "brief"} for the studio, with the whole conversation.${state.replyTo ? "" : ASK_EMAIL}`);
      } catch {
        status.push("Your words are saved; the summary did not go through this time and will be filed with your next message.");
      }
    } else if (first && !state.replyTo) status[status.length - 1] += ASK_EMAIL;
    for (const s of status) out.push({ text: s, speaker: null, status: true });
    return { said: out, link };
  }

  return {
    send,
    /** The failed turn again, with the same ids (the studio dedupes a replay). */
    retry: () => (state.pending ? send(state.pending.text, state.pending.images) : null),
    get stage() { return state.stage.kind; },
    get filed() { return state.filed; },
    get turns() { return state.turns; },
  };
}
