// The roadmap and the changelog, drawn rather than read. Both are canonical
// repository records (ROADMAP.md, CHANGELOG.md) parsed by the shared bip-kit
// parser; nothing here is typed by hand. A visitor should SEE the state —
// what is done, what is next, what changed when — and open the detail only
// if they want it. The long text used to be rendered as it stood, and a
// phone showed a wall of checklists nobody would read.
import { parseContentBlocks } from "bip-kit";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
/** Plain words from a span tree: links keep their text, code keeps its text. */
function plain(spans, fallback) {
  if (!spans) return String(fallback ?? "");
  return spans.map((s) => (s.t === "text" || s.t === "code" ? s.text : plain(s.children))).join("");
}
function recordHref(raw) {
  try { const u = new URL(raw, "https://github.com/bitbaum/bitbaum/blob/main/"); return ["https:", "http:"].includes(u.protocol) ? u.href : null; } catch { return null; }
}
function inline(spans, fallback) {
  if (!spans) return esc(fallback);
  return spans.map((s) => {
    if (s.t === "text") return esc(s.text);
    if (s.t === "code") return `<code>${esc(s.text)}</code>`;
    if (s.t === "strong" || s.t === "em") return `<${s.t}>${inline(s.children)}</${s.t}>`;
    if (s.t === "link") { const h = recordHref(s.href); return h ? `<a href="${esc(h)}">${inline(s.children)}</a>` : inline(s.children); }
    return "";
  }).join("");
}

// ── the roadmap: horizons → themes → items ──────────────────────────────────
const CHECK = /^\[( |x|X)\]\s*/;
export function parseRoadmap(markdown) {
  const blocks = parseContentBlocks(markdown.replace(/^# .+\n/, ""));
  const horizons = [];
  let horizon = null, theme = null;
  for (const b of blocks) {
    if (b.type === "h2") { horizon = { title: plain(b.spans, b.text), themes: [] }; horizons.push(horizon); theme = null; }
    else if (b.type === "h3" && horizon) { theme = { title: plain(b.spans, b.text), summary: "", items: [] }; horizon.themes.push(theme); }
    else if (b.type === "p" && theme && !theme.summary) theme.summary = plain(b.spans, b.text);
    else if ((b.type === "ul" || b.type === "ol") && theme) {
      b.items.forEach((item, i) => {
        const m = String(item).match(CHECK);
        const text = plain(b.itemSpans?.[i], item).replace(CHECK, "");
        theme.items.push({ done: Boolean(m && m[1].toLowerCase() === "x"), text });
      });
    }
  }
  return horizons;
}

function progress(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress" role="img" aria-label="${esc(label ?? `${done} of ${total} done`)}"><span style="width:${pct}%"></span></div>`;
}

export function renderRoadmap(markdown) {
  const horizons = parseRoadmap(markdown);
  const all = horizons.flatMap((h) => h.themes.flatMap((t) => t.items));
  const done = all.filter((i) => i.done).length;
  const WORD = { Now: "Being built now", Next: "Coming next", Later: "Further out" };
  const lanes = horizons.map((h, hi) => {
    const items = h.themes.flatMap((t) => t.items), hd = items.filter((i) => i.done).length;
    // A div, not a section: the build puts a page's art stage after its first
    // closing section tag, and a lane is not where the deer should stand.
    return `      <div class="lane lane-${hi}" role="region" aria-labelledby="lane-${hi}">
        <header class="lane-head"><span class="kicker quiet">${esc(WORD[h.title] ?? h.title)}</span><h2 id="lane-${hi}" class="lane-title">${esc(h.title)}</h2><span class="lane-count">${hd} of ${items.length} done</span></header>
${h.themes.map((t, ti) => {
      const td = t.items.filter((i) => i.done).length, open = t.items.find((i) => !i.done);
      return `        <article class="rm-theme${td === t.items.length && t.items.length ? " rm-theme-done" : ""}">
          <h3 class="rm-theme-title">${esc(t.title)}</h3>
          ${t.summary ? `<p class="rm-theme-summary">${esc(t.summary)}</p>` : ""}
          <div class="rm-theme-meter"><span class="rm-theme-count">${td}/${t.items.length}</span>${progress(td, t.items.length, `${td} of ${t.items.length} steps done`)}</div>
          ${open ? `<p class="rm-theme-next"><span class="label">Next step</span> ${esc(open.text)}</p>` : `<p class="rm-theme-next"><span class="label">Done</span> Every step on this theme is in.</p>`}
          <details class="rm-theme-steps"><summary>All ${t.items.length} steps</summary><ul>${t.items.map((i) => `<li class="${i.done ? "step-done" : "step-open"}"><span class="step-mark" aria-hidden="true">${i.done ? "✓" : "○"}</span><span>${esc(i.text)}</span><span class="sr-only">${i.done ? " (done)" : " (open)"}</span></li>`).join("")}</ul></details>
        </article>`;
    }).join("\n")}
      </div>`;
  }).join("\n");
  return { html: `    <div class="roadmap-sum"><span class="roadmap-sum-n">${done}</span><span class="roadmap-sum-t">of ${all.length} steps done across ${horizons.length} horizons</span>${progress(done, all.length)}</div>
    <div class="board">
${lanes}
    </div>`, done, total: all.length };
}

// ── the changelog: a timeline ───────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateWords(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
export function parseChangelog(markdown) {
  const blocks = parseContentBlocks(markdown.replace(/^# .+\n/, ""));
  const entries = [];
  let entry = null;
  for (const b of blocks) {
    if (b.type === "h2") {
      const text = plain(b.spans, b.text);
      const m = text.match(/^(\d{4}-\d{2}-\d{2})\s*(?:[—–-]\s*(.+))?$/);
      entry = { date: m?.[1] ?? "", title: m?.[2]?.trim() || "", points: [], groups: [] };
      entries.push(entry);
    } else if (!entry) continue;
    else if (b.type === "h3") entry.groups.push(plain(b.spans, b.text));
    else if (b.type === "ul" || b.type === "ol") b.items.forEach((item, i) => entry.points.push({ html: inline(b.itemSpans?.[i], item), text: plain(b.itemSpans?.[i], item) }));
    else if (b.type === "p") entry.points.push({ html: inline(b.spans, b.text), text: plain(b.spans, b.text) });
  }
  for (const e of entries) if (!e.title) e.title = e.groups.length ? e.groups.join(" and ") : "Changes";
  // Newest first; the record is appended by hand and not always in order.
  return entries.filter((e) => e.date).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** One sentence of a point, for the line a visitor reads before opening more. */
function firstSentence(text) {
  const m = text.match(/^(.{20,220}?[.!?])(\s|$)/);
  return (m ? m[1] : text).trim();
}

export function renderChangelog(markdown) {
  const entries = parseChangelog(markdown);
  const byMonth = new Map();
  for (const e of entries) { const k = e.date.slice(0, 7); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(e); }
  return { html: `    <ol class="timeline">
${entries.map((e, i) => {
    const lead = e.points[0], rest = e.points.slice(1);
    return `      <li class="tl-entry">
        <time class="tl-date" datetime="${esc(e.date)}">${esc(dateWords(e.date))}</time>
        <div class="tl-card">
          <h2 class="tl-title">${esc(e.title)}</h2>
          ${lead ? `<p class="tl-lead">${esc(firstSentence(lead.text))}</p>` : ""}
          ${(rest.length || (lead && firstSentence(lead.text) !== lead.text)) ? `<details class="tl-more"><summary>${rest.length ? `${rest.length + 1} points` : "In full"}</summary><ul>${e.points.map((p) => `<li>${p.html}</li>`).join("")}</ul></details>` : ""}
        </div>
      </li>`;
  }).join("\n")}
    </ol>`, count: entries.length, months: byMonth.size };
}
