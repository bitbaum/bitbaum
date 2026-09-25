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
