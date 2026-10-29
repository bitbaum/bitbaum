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
import { richAnswerText, type Attachment } from "@bitbaum/chatkit";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ChatStarters,
  ChatThread,
  Composer,
  type ChatMessageData,
} from "@bitbaum/chatkit/react";
import { ATTACH_LIMITS, UUID, createIntake, picturesFrom } from "./intake-flow.mjs";

/** The chatkit release this bundle was built from (site/build.mjs defines it
 *  from the installed package): stamped on every mount as data-chatkit, and
 *  in the bundle's first line, so the served version is one look away. */
declare const __CHATKIT_VERSION__: string;
const CHATKIT_VERSION = typeof __CHATKIT_VERSION__ === "string" ? __CHATKIT_VERSION__ : "unknown";

type Config = { origin: string; token: string };
type Link = { label: string; url: string };
type Reply = {
  reply?: string;
  messages?: { speaker: "cat" | "loki" | null; text: string }[];
  links?: Link[];
  error?: string;
};

const SPEAKERS = { cat: { name: "Cat", id: "cat" }, loki: { name: "Loki", id: "loki" } } as const;

/** The microphone: the widget's own transcription route, tried FIRST. One
 *  server model everywhere — the Android recogniser's cumulative partials
 *  ("build build me build me", 2026-10-27) never reach the box; the browser
 *  recogniser remains chatkit's fallback when the server leg cannot work. */
const voice = (cfg: Config) => ({
  prefer: "server" as const,
  transcribe: async (audio: Blob, locale: string) => {
    const body = new FormData();
    body.append("token", cfg.token);
    if (locale) body.append("locale", locale);
    body.append("audio", new File([audio], "voice.webm", { type: audio.type || "audio/webm" }));
    const res = await fetch(`${cfg.origin}/api/widget/transcribe`, { method: "POST", body });
    if (!res.ok) throw new Error(`transcription ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim();
  },
});

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
    .map((m) => `${m.role === "user" ? "Visitor" : (m.speaker?.name ?? "Answer")}: ${m.role === "assistant" ? richAnswerText(m.content) : m.content}`)
    .join("\n\n");
}

function Handoff({ cfg, messages, pictures }: { cfg: Config; messages: ChatMessageData[]; pictures: string[] }) {
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
          // The pictures shown in the conversation go with it (the ingest takes five).
          ...(pictures.length ? { screenshots: pictures.slice(-5) } : {}),
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
  const lastQuestion = useRef<{ text: string; images: string[] }>({ text: "", images: [] });
  const [pictures, setPictures] = useState<string[]>([]);

  const ask = async (question: string, history: ChatMessageData[], images: string[] = []) => {
    lastQuestion.current = { text: question, images };
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
          visualAnswers: true,
          message: question.slice(0, 1000),
          ...(images.length ? { images } : {}),
          history: history
            .filter((m) => !m.failed)
            .slice(-12)
            .map((m) => ({
              role: m.role,
              content: ((m.role === "assistant" && m.speaker ? `${m.speaker.name}: ` : "") + (m.role === "assistant" ? richAnswerText(m.content) : m.content)).slice(0, 2000),
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

  const send = (text: string, attachments: Attachment[] = []) => {
    const { images, refused } = picturesFrom(attachments);
    const q = text.trim() || (images.length ? "What does this picture show, and which project fits?" : "");
    const notes = refused.map((r, i) => ({ id: `${Date.now()}-r${i}`, role: "assistant" as const, content: r }));
    if (!q || sending) {
      if (notes.length) setMessages((prev) => [...prev, ...notes]);
      return false;
    }
    const next = [
      ...messages,
      { id: `${Date.now()}-u`, role: "user" as const, content: q, attachments: images.map((i) => ({ kind: "image" as const, name: i.name, previewUrl: i.url })) },
      ...notes,
    ];
    setMessages(next);
    if (images.length) setPictures((prev) => [...prev, ...images.map((i) => i.url)]);
    void ask(q, messages, images.map((i) => i.url));
    return true;
  };

  const retry = () => {
    if (!lastQuestion.current.text || sending) return;
    // Drop the failed or last answer and ask the same question again.
    const lastUser = messages.map((m) => m.role).lastIndexOf("user");
    const kept = lastUser >= 0 ? messages.slice(0, lastUser + 1) : messages;
    setMessages(kept);
    void ask(lastQuestion.current.text, kept.slice(0, -1), lastQuestion.current.images);
  };

  return (
    <div className="chat-card">
      <ChatThread
        messages={messages}
        live={sending ? { status: "Looking through the projects" } : null}
        stopped={stopped}
        onStop={() => abort.current?.abort()}
        onRetry={retry}
        onReply={text => { void send(text); }}
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
        onSend={(text, attachments) => send(text, attachments)}
        placeholder="Ask in your own words — or add a screenshot…"
        sending={sending}
        onStop={() => abort.current?.abort()}
        attach={ATTACH_LIMITS}
        attachmentOnlyText="What does this picture show, and which project fits?"
        voice={voice(cfg)}
      />
      <Handoff cfg={cfg} messages={messages} pictures={pictures} />
    </div>
  );
}

// The studio's one door, as a conversation. The logic — saved first, then a
// reply like a person's, the brief filed once when Loki's code says it is
// ready — lives in ./intake-flow.mjs (tested with fakes in
// site/intake-flow.test.mjs); this is only how it looks.
type Access = { id: string; key: string };
type IntakeCfg = Config & { purpose: "studio" | "partner"; offerId: string; prompt: string; topic: () => string; partner: string };
type Said = { text: string; speaker?: "loki" | null; failed?: boolean; status?: boolean };

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
  const [messages, setMessages] = useState<ChatMessageData[]>([{ id: "hello", role: "assistant", content: cfg.prompt, speaker: SPEAKERS.loki }]);
  const [sending, setSending] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [failed, setFailed] = useState(false);
  const flow = useRef<ReturnType<typeof createIntake> | null>(null);
  flow.current ??= createIntake(cfg, {
    post,
    chat: async (body: unknown) => {
      const res = await fetch(`${cfg.origin}/api/widget/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `chat ${res.status}`);
      return data;
    },
    newIds: () => ({ requestId: crypto.randomUUID(), accessKey: newKey() }),
    uuid: () => crypto.randomUUID(),
    remember,
    portalUrl,
    page: () => ({ pathname: location.pathname, href: location.href, title: document.title }),
  });

  const show = (said: Said[]) =>
    setMessages((prev) => [
      ...prev,
      ...said.map((m, i) => ({
        id: `${Date.now()}-${i}`,
        role: "assistant" as const,
        content: m.text,
        failed: m.failed,
        speaker: m.speaker === "loki" ? SPEAKERS.loki : undefined,
      })),
    ]);
  const run = async (turn: Promise<{ said: Said[]; link: Link | null } | null> | null) => {
    if (!turn) return;
    setSending(true);
    try {
      const out = await turn;
      if (!out) return;
      setFailed(out.said.some((m) => m.failed));
      if (out.link) setLinks([out.link]);
      show(out.said);
    } finally {
      setSending(false);
    }
  };

  const send = (text: string, attachments: Attachment[] = []) => {
    const t = text.trim();
    if ((!t && !attachments.length) || sending) return false;
    const { images, refused } = picturesFrom(attachments);
    if (!images.length && !t) {
      show(refused.map((r) => ({ text: r })));
      return false;
    }
    setMessages((prev) => [
      ...prev.filter((m) => !m.failed),
      { id: `${Date.now()}-u`, role: "user" as const, content: t || "See the picture.", attachments: images.map((i) => ({ kind: "image" as const, name: i.name, previewUrl: i.url })) },
      ...refused.map((r, i) => ({ id: `${Date.now()}-r${i}`, role: "assistant" as const, content: r })),
    ]);
    void run(flow.current!.send(t || "See the picture.", images));
    return true;
  };
  const retry = () => {
    if (sending) return;
    setMessages((prev) => prev.filter((m) => !m.failed));
    void run(flow.current!.retry());
  };

  // A brief brought over from Loki's free tool (#brief={website,changes}).
  let draft = "";
  try {
    if (location.hash.startsWith("#brief=")) {
      const b = JSON.parse(decodeURIComponent(location.hash.slice(7))) as { website?: string; changes?: string };
      draft = [b.website, b.changes].filter((v) => typeof v === "string" && v.trim()).join(" — ").slice(0, 1400);
    }
  } catch { /* an unreadable handoff leaves an empty box */ }

  const fresh = messages.length === 1;
  return (
    <div className="chat-card intake-card">
      <ChatThread
        messages={messages}
        live={sending ? { status: fresh ? "Saving it for the studio" : "Loki is reading" } : null}
        onRetry={failed ? retry : undefined}
      />
      <Composer
        onSend={(text, attachments) => send(text, attachments)}
        defaultValue={draft}
        placeholder={fresh ? (cfg.purpose === "partner" ? "Who you are, what you build, and a link to your work…" : "What should be built or changed — a screenshot helps…") : "Answer, add anything, or say “send it”…"}
        sending={sending}
        attach={ATTACH_LIMITS}
        attachmentOnlyText="See the picture."
        voice={voice(cfg)}
        labels={{ attachNotes: { tooMany: (max) => `Up to ${max} pictures per message.` } }}
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
  const p = new URLSearchParams(location.hash.slice(1)).get("partner") ?? "";
  const cfg: IntakeCfg = {
    origin: el.dataset.origin ?? "", token: el.dataset.token ?? "",
    purpose: el.dataset.purpose === "partner" ? "partner" : "studio",
    offerId: el.dataset.offerId ?? "", prompt: el.dataset.prompt ?? "", topic: () => topic,
    partner: UUID.test(p) ? p : "",
  };
  el.textContent = "";
  el.dataset.chatkit = CHATKIT_VERSION;
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
  el.dataset.chatkit = CHATKIT_VERSION;
  createRoot(el).render(<Chat cfg={cfg} starters={starters} title={el.dataset.title ?? ""} />);
}
