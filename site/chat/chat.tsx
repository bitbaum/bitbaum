// The site's chat: @bitbaum/chatkit, mounted wherever a page has a
// `[data-chat]` element. Replaces two things that fell short of the fleet's
// chat standard: a four-field "Ask about X" form on every venture page, and
// the homepage question box that handed off to the embeddable widget's
// vanilla chat (no mic, 13px text).
//
// The Cat and Loki answer from Loki's public fleet map (POST
// /api/widget/chat, the same fcw_* token the feedback widget uses). The mic's
// server leg is the widget's own transcription route. Anyone who wants a
// person instead sends the conversation to the studio's inbox with one field —
// their email — never a form.
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ChatStarters,
  ChatThread,
  Composer,
  type ChatMessageData,
} from "@bitbaum/chatkit/react";

type Config = { origin: string; token: string };
type Link = { label: string; url: string };
type Reply = {
  reply?: string;
  messages?: { speaker: "cat" | "loki" | null; text: string }[];
  links?: Link[];
  error?: string;
};

const SPEAKERS = { cat: { name: "Cat", id: "cat" }, loki: { name: "Loki", id: "loki" } } as const;

function safeUrl(raw: unknown): string | null {
  try {
    const u = new URL(String(raw));
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

function transcript(messages: ChatMessageData[]): string {
  return messages
    .filter((m) => !m.failed)
    .map((m) => `${m.role === "user" ? "Visitor" : (m.speaker?.name ?? "Answer")}: ${m.content}`)
    .join("\n\n");
}

function Handoff({ cfg, messages }: { cfg: Config; messages: ChatMessageData[] }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  if (!messages.some((m) => m.role === "user")) return null;
  if (state === "sent")
    return (
      <p className="chat-handoff-done" role="status">
        Sent. A person will reply to {email}.
      </p>
    );
  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return;
    setState("sending");
    try {
      const res = await fetch(`${cfg.origin}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: cfg.token,
          suggestion: `Question from the website chat:\n\n${transcript(messages)}`.slice(0, 2000),
          contact: email.trim().slice(0, 200),
          page: location.pathname.slice(0, 300),
          url: location.href.slice(0, 1000),
          pageTitle: document.title.slice(0, 300) || undefined,
        }),
      });
      setState(res.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };
  return (
    <form
      className="chat-handoff"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <label htmlFor={`handoff-${cfg.token.slice(-6)}`}>Want a person to reply? Leave your email and the conversation goes to the studio.</label>
      <div className="chat-handoff-row">
        <input
          id={`handoff-${cfg.token.slice(-6)}`}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn secondary" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send to a person"}
        </button>
      </div>
      {state === "failed" && (
        <p className="chat-handoff-error" role="status">
          That did not go through — try again, or open an issue on GitHub.
        </p>
      )}
    </form>
  );
}

function Chat({ cfg, starters, title }: { cfg: Config; starters: string[]; title: string }) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [links, setLinks] = useState<Record<string, Link[]>>({});
  const [sending, setSending] = useState(false);
  const [stopped, setStopped] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const lastQuestion = useRef("");

  const ask = async (question: string, history: ChatMessageData[]) => {
    lastQuestion.current = question;
    setStopped(false);
    setSending(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch(`${cfg.origin}/api/widget/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          token: cfg.token,
          message: question.slice(0, 1000),
          history: history
            .filter((m) => !m.failed)
            .slice(-12)
            .map((m) => ({
              role: m.role,
              content: (m.role === "assistant" && m.speaker ? `${m.speaker.name}: ` : "") + m.content,
            })),
          url: location.href.slice(0, 1000),
          pageTitle: document.title.slice(0, 300) || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as Reply;
      if (!res.ok || !body.reply) throw new Error(body.error ?? `The chat is not answering (${res.status}).`);
      const said = body.messages?.length ? body.messages : [{ speaker: null, text: body.reply }];
      const stamp = Date.now();
      const added: ChatMessageData[] = said.map((m, i) => ({
        id: `${stamp}-${i}`,
        role: "assistant",
        content: m.text,
        speaker: m.speaker ? SPEAKERS[m.speaker] : undefined,
      }));
      const safe = (body.links ?? [])
        .map((l) => ({ label: String(l.label ?? "").slice(0, 80), url: safeUrl(l.url) }))
        .filter((l): l is Link => Boolean(l.url && l.label));
      if (safe.length) setLinks((prev) => ({ ...prev, [added[added.length - 1]!.id]: safe }));
      setMessages((prev) => [...prev, ...added]);
    } catch (err) {
      if (controller.signal.aborted) {
        setStopped(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-f`,
            role: "assistant",
            content: err instanceof Error ? err.message : "That did not go through.",
            failed: true,
          },
        ]);
      }
    } finally {
      setSending(false);
      abort.current = null;
    }
  };

  const send = (text: string) => {
    const q = text.trim();
    if (!q || sending) return false;
    const next = [...messages, { id: `${Date.now()}-u`, role: "user" as const, content: q }];
    setMessages(next);
    void ask(q, messages);
    return true;
  };

  const retry = () => {
    if (!lastQuestion.current || sending) return;
    // Drop the failed or last answer and ask the same question again.
    const lastUser = messages.map((m) => m.role).lastIndexOf("user");
    const kept = lastUser >= 0 ? messages.slice(0, lastUser + 1) : messages;
    setMessages(kept);
    void ask(lastQuestion.current, kept.slice(0, -1));
  };

  return (
    <div className="chat-card">
      <ChatThread
        messages={messages}
        live={sending ? { status: "Looking through the projects" } : null}
        stopped={stopped}
        onStop={() => abort.current?.abort()}
        onRetry={retry}
        renderFooter={(m) =>
          links[m.id]?.length ? (
            <div className="chat-links">
              {links[m.id]!.map((l) => (
                <a key={l.url} className="chat-link" href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label} →
                </a>
              ))}
            </div>
          ) : null
        }
        empty={<ChatStarters title={title} starters={starters} onPick={(q) => send(q)} />}
      />
      <Composer
        onSend={(text) => send(text)}
        placeholder="Ask in your own words…"
        sending={sending}
        onStop={() => abort.current?.abort()}
        voice={{
          transcribe: async (audio) => {
            const body = new FormData();
            body.append("token", cfg.token);
            body.append("audio", new File([audio], "voice.webm", { type: audio.type || "audio/webm" }));
            const res = await fetch(`${cfg.origin}/api/widget/transcribe`, { method: "POST", body });
            if (!res.ok) throw new Error(`transcription ${res.status}`);
            const data = (await res.json()) as { text?: string };
            return (data.text ?? "").trim();
          },
        }}
      />
      <Handoff cfg={cfg} messages={messages} />
    </div>
  );
}

// The studio's one door, as a conversation. One free-form field — typed or
// spoken — and nothing is refused for its shape, because a request that
// bounces is a person lost. The words become a private studio request on
// Loki (POST /api/studio-intake): a website brief when an address is in the
// text, a partner application on /partners/, and otherwise the plain
// waitlist (Loki's inbox, POST /api/feedback) after one question — is there a
// site? Every request gets a private portal link; an email anywhere in the
// text becomes the reply address, and the follow-ups go to the same record.
// No AI answers here: the studio reads every word as written.
const EMAIL = /[^\s<>(),;:"']+@[^\s<>(),;:"']+\.[a-z]{2,}/i;
// A public address written loosely: "acme.ch", "www.acme.ch/shop", "https://…".
const SITE = /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"'(),]*)?/i;
const UUID = /^[a-f\d-]{36}$/i;

type Purpose = "studio" | "partner";
type Access = { id: string; key: string };
type IntakeCfg = Config & { purpose: Purpose; offerId: string; prompt: string; topic: () => string };

const siteIn = (text: string) => {
  const found = text.replace(EMAIL, " ").match(SITE)?.[0] ?? "";
  // "e.g." and "i.e." are not websites.
  return found && !/^(e\.g|i\.e)\b/i.test(found) ? found : "";
};
const newKey = () =>
  "spt_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const portalUrl = (a: Access) => new URL(`/portal/#id=${a.id}&key=${a.key}`, location.origin).href;
// The same keys portal.js reads, so /portal/ opens without the link.
function remember(a: Access) {
  try {
    sessionStorage.setItem("bitbaum:portal:last", JSON.stringify(a));
    const recent = (JSON.parse(sessionStorage.getItem("bitbaum:portal:recent") ?? "[]") as Access[]).filter((r) => r.id !== a.id);
    sessionStorage.setItem("bitbaum:portal:recent", JSON.stringify([a, ...recent].slice(0, 10)));
  } catch { /* a private window keeps the link on screen instead */ }
}
async function post(url: string, body: unknown, key?: string) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string; claimUrl?: string };
  if (!res.ok) throw Object.assign(new Error(data.error ?? `That did not go through (${res.status}).`), { status: res.status, said: Boolean(data.error) });
  return data;
}

function Intake({ cfg }: { cfg: IntakeCfg }) {
  const [messages, setMessages] = useState<ChatMessageData[]>([{ id: "hello", role: "assistant", content: cfg.prompt }]);
  const [sending, setSending] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  // What the first message became: nothing yet, a question about the site,
  // a studio request with a portal, or a plain waitlist note.
  const stage = useRef<{ kind: "fresh" } | { kind: "asked"; first: string } | { kind: "portal"; access: Access } | { kind: "waitlist"; first: string }>({ kind: "fresh" });
  const replyTo = useRef("");
  const ids = useRef<{ requestId: string; accessKey: string } | null>(null);
  const pending = useRef<{ text: string; kept: ChatMessageData[] } | null>(null);
  const partnerWanted = useRef<string | undefined>(undefined);
  if (partnerWanted.current === undefined) {
    const p = new URLSearchParams(location.hash.slice(1)).get("partner") ?? "";
    partnerWanted.current = UUID.test(p) ? p : "";
  }

  const say = (content: string, failed = false) =>
    setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistant", content, failed }]);
  const where = () => (cfg.purpose === "partner" ? "application" : "portal");
  const askReply = (email: string) =>
    email ? ` The reply will go to ${email}.` : " If you would like the reply by email, write the address here — optional; the link above works without one.";

  // A studio request on Loki, kept idempotent: a retry reuses the same ids.
  const open = async (body: Record<string, unknown>, email: string) => {
    ids.current ??= { requestId: crypto.randomUUID(), accessKey: newKey() };
    const data = await post(`${cfg.origin}/api/studio-intake`, { ...ids.current, company: "", contact: email, ...body });
    if (!data.id || !UUID.test(data.id)) throw new Error("The receipt was incomplete. Press “Try again”.");
    const access = { id: data.id, key: ids.current.accessKey };
    remember(access);
    stage.current = { kind: "portal", access };
    setLinks([{ label: `Open your ${where()}`, url: portalUrl(access) }]);
  };
  const note = (suggestion: string, email: string) =>
    post(`${cfg.origin}/api/feedback`, {
      token: cfg.token,
      suggestion: suggestion.slice(0, 2000),
      contact: (email || replyTo.current || undefined)?.slice(0, 200),
      page: location.pathname.slice(0, 300), url: location.href.slice(0, 1000), pageTitle: document.title.slice(0, 300) || undefined,
    });

  const deliver = async (text: string, kept: ChatMessageData[]) => {
    pending.current = { text, kept };
    setSending(true);
    const email = text.match(EMAIL)?.[0] ?? "";
    const site = siteIn(text);
    const s = stage.current;
    try {
      if (s.kind === "portal") {
        await post(`${cfg.origin}/api/studio-portal/${s.access.id}`, { action: "message", body: text.slice(0, 2000), mutationId: crypto.randomUUID() }, s.access.key);
        say(email && !replyTo.current ? `Added — the reply will go to ${email}.` : "Added to your request. The studio sees it in the same place.");
      } else if (s.kind === "waitlist") {
        await note(`Waitlist, follow-up to: “${s.first.slice(0, 300)}”\n\n${text}`, email);
        say(email && !replyTo.current ? `Thank you — the reply will go to ${email}.` : "Added to your note.");
      } else if (cfg.purpose === "partner") {
        await open({ kind: "partner", website: site, changes: text.slice(0, 2000) }, email);
        say(`Your application is saved and private — the link above opens it; keep it. Next step: the pilot course at /academy/. Submit your capstone evidence in the application and the studio reviews it. Passing the course and being approved are separate decisions, both by a person.${askReply(email)}`);
      } else if (site) {
        const first = s.kind === "asked" ? `${s.first}\n\n${text}` : text;
        const topic = cfg.topic();
        const target = partnerWanted.current ? "partner" : "studio";
        await open({
          kind: "website", website: site, target,
          changes: `${topic ? `Engagement: ${topic}\n` : ""}${first}`.slice(0, 1200),
          ...(target === "studio" ? { offerId: cfg.offerId } : { preferredPartnerId: partnerWanted.current }),
        }, email);
        say(`Saved — you are on the studio waitlist. The link above is your private portal: replies, status and previews appear there, so keep it. Sending this books no work and agrees no price; a person reads it.${askReply(email)}`);
      } else if (s.kind === "fresh") {
        stage.current = { kind: "asked", first: text };
        say("Noted. Is this about a website that already exists? Paste its address — or say it is something new.");
      } else {
        const first = `${s.first}\n\n${text}`;
        const topic = cfg.topic();
        const data = await note(`Waitlist — from the website${topic ? `\nEngagement: ${topic}` : ""}\n\n${first}`, email);
        stage.current = { kind: "waitlist", first };
        if (data.claimUrl?.startsWith(`${cfg.origin}/claim-feedback?token=`)) setLinks([{ label: "Track this request", url: data.claimUrl }]);
        say(`You are on the studio waitlist, and a person will read this — nothing automated goes out.${askReply(email || replyTo.current)}`);
      }
      pending.current = null;
      if (email) replyTo.current = email;
    } catch (err) {
      const e = err as Error & { said?: boolean };
      // The server's own reason when it gave one (a bad address, the course
      // paused, too many tries); otherwise the plain truth and a way on.
      say(e.said ? `${e.message} Your words are still here — press “Try again”, or add to them.` : "That did not reach us — your words are still here. Press “Try again” below.", true);
    } finally {
      setSending(false);
    }
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t || sending) return false;
    const next = [...messages.filter((m) => !m.failed), { id: `${Date.now()}-u`, role: "user" as const, content: t }];
    setMessages(next);
    void deliver(t, next);
    return true;
  };
  const retry = () => {
    const p = pending.current;
    if (!p || sending) return;
    setMessages(p.kept);
    void deliver(p.text, p.kept);
  };

  // A brief brought over from Loki's free tool (#brief={website,changes}).
  let draft = "";
  try {
    if (location.hash.startsWith("#brief=")) {
      const b = JSON.parse(decodeURIComponent(location.hash.slice(7))) as { website?: string; changes?: string };
      draft = [b.website, b.changes].filter((v) => typeof v === "string" && v.trim()).join(" — ").slice(0, 1400);
    }
  } catch { /* an unreadable handoff leaves an empty box */ }

  return (
    <div className="chat-card intake-card">
      <ChatThread
        messages={messages}
        live={sending ? { status: "Sending to the studio" } : null}
        onRetry={messages[messages.length - 1]?.failed ? retry : undefined}
      />
      <Composer
        onSend={(text) => send(text)}
        defaultValue={draft}
        placeholder={stage.current.kind === "fresh" ? (cfg.purpose === "partner" ? "Who you are, what you build, and a link to your work…" : "Your website and what should change — or what you want built…") : "Add anything, or your email…"}
        sending={sending}
        voice={{
          transcribe: async (audio) => {
            const body = new FormData();
            body.append("token", cfg.token);
            body.append("audio", new File([audio], "voice.webm", { type: audio.type || "audio/webm" }));
            const res = await fetch(`${cfg.origin}/api/widget/transcribe`, { method: "POST", body });
            if (!res.ok) throw new Error(`transcription ${res.status}`);
            const data = (await res.json()) as { text?: string };
            return (data.text ?? "").trim();
          },
        }}
      />
      {links.length > 0 && (
        <div className="chat-links">
          {links.map((l) => <a key={l.url} className="chat-link" href={l.url}>{l.label} →</a>)}
        </div>
      )}
    </div>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-intake]")) {
  // A rate card's "Request this" link says which engagement it came from.
  let topic = decodeURIComponent((location.hash.split("for=")[1] ?? "").replace(/-/g, " "));
  document.querySelectorAll<HTMLElement>("[data-engagement]").forEach((a) =>
    a.addEventListener("click", () => (topic = a.dataset.engagement ?? "")),
  );
  const cfg: IntakeCfg = {
    origin: el.dataset.origin ?? "", token: el.dataset.token ?? "",
    purpose: el.dataset.purpose === "partner" ? "partner" : "studio",
    offerId: el.dataset.offerId ?? "", prompt: el.dataset.prompt ?? "", topic: () => topic,
  };
  el.textContent = "";
  createRoot(el).render(<Intake cfg={cfg} />);
}

for (const el of document.querySelectorAll<HTMLElement>("[data-chat]")) {
  const cfg = { origin: el.dataset.origin ?? "", token: el.dataset.token ?? "" };
  let starters: string[] = [];
  try {
    starters = JSON.parse(el.dataset.starters ?? "[]");
  } catch {
    /* no starters */
  }
  el.textContent = "";
  createRoot(el).render(<Chat cfg={cfg} starters={starters} title={el.dataset.title ?? ""} />);
}
