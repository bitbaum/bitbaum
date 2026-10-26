import { parseContentBlocks } from "bip-kit";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function recordHref(raw, baseUrl) {
  try {
    const url = new URL(raw, baseUrl);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
function inline(spans, fallback, baseUrl) {
  if (!spans) return esc(fallback);
  return spans.map((span) => {
    if (span.t === "text") return esc(span.text);
    if (span.t === "code") return `<code>${esc(span.text)}</code>`;
    if (span.t === "strong" || span.t === "em") return `<${span.t}>${inline(span.children, undefined, baseUrl)}</${span.t}>`;
    if (span.t === "link") { const href = recordHref(span.href, baseUrl); return href ? `<a href="${esc(href)}">${inline(span.children, undefined, baseUrl)}</a>` : inline(span.children, undefined, baseUrl); }
    return "";
  }).join("");
}
/** Shared parser consumes canonical repo records. No HTML from markdown is trusted. */
export function renderRecord(markdown, options = {}) {
  return renderBlocks(parseContentBlocks(markdown.replace(/^# .+\n/, "")), options);
}
function renderBlocks(blocks, { baseUrl = "https://github.com/bitbaum/bitbaum/blob/main/", idPrefix = "" } = {}) {
  return blocks.map((block) => {
    if (block.type === "callout") return `<aside class="record-callout" role="note">${renderBlocks(block.blocks, { baseUrl, idPrefix })}</aside>`;
    if (block.type === "h1") return `<h2 id="${esc(idPrefix + block.id)}">${inline(block.spans, block.text, baseUrl)}</h2>`;
    if (["h2", "h3", "h4"].includes(block.type)) return `<${block.type} id="${esc(idPrefix + block.id)}">${inline(block.spans, block.text, baseUrl)}</${block.type}>`;
    if (block.type === "p") return `<p>${inline(block.spans, block.text, baseUrl)}</p>`;
    if (["ul", "ol"].includes(block.type)) return `<${block.type}>${block.items.map((item, i) => `<li>${inline(block.itemSpans?.[i], item, baseUrl)}</li>`).join("")}</${block.type}>`;
    if (block.type === "hr") return "<hr>";
    if (block.type === "table") return `<div class="record-table"><table><thead><tr>${block.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (block.type === "code") return `<pre><code>${esc(block.text)}</code></pre>`;
    if (block.type === "blockquote") return `<blockquote>${block.text.map((line, i) => `<p>${inline(block.spans?.[i], line, baseUrl)}</p>`).join("")}</blockquote>`;
    throw new Error(`Unsupported studio record block: ${block.type}`);
  }).join("\n");
}
