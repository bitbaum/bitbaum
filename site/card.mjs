// The project tile — ONE renderer for every place a project is shown.
//
// The public work grid renders it at build time (build.mjs); the private
// client-work page renders it in the browser from Loki's owner-only list
// (private/private.js imports this same file from /card.mjs). The private page
// once kept a hand-made copy of this tile: no screenshot, its own status
// words — it said "LIVE", a release claim the public site deliberately never
// makes — and its own CSS, so the owner saw two different products for one
// kind of thing (2026-10-18). A tile that looks different has to be a
// different thing; a private project is the same thing with a smaller audience.
//
// Pure string templates, no DOM and no Node APIs, so it runs in both places.

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
export const host = (url) => String(url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// apps.conf `live` means the process is SERVED. It is not a release claim, and
// rendering it as one is the mistake this table exists to not make: nothing
// here is finished enough to hand over without a caveat, OrangeCat included,
// so the public word is beta. "Live" is reserved for something we would be
// comfortable releasing, and today that is nothing.
export const STATUS_TEXT = { live: "beta", demo: "demo", validating: "validating", prospect: "not built", unverified: "concept", "not live": "not live" };

/** The words a stage says before any status: a stage is what can be verified. */
const STAGE_TEXT = { next: "not built", concept: "concept", development: "in development", preview: "preview" };

export function pill(v) {
  const staged = STAGE_TEXT[v.stage];
  if (staged) return `<span class="pill">${staged}</span>`;
  const text = STATUS_TEXT[v.status] ?? v.status;
  // Keyed on the STATUS, not the rendered word — so renaming the word cannot
  // silently drop the accent that marks a thing you can actually open.
  return text ? `<span class="pill ${v.status === "live" ? "beta" : ""}">${esc(text)}</span>` : "";
}

/**
 * One tile. `v` is a venture: slug, name, what, stage, status, tags, and
 * optionally shot, builtBy, for, since, url.
 *
 * - `filterable` adds the data the work filter reads.
 * - `href` sends the tile somewhere other than the venture page (a private
 *   project has no public page: its tile opens the site itself, in a new tab).
 * - `shotSrc` is the picture when it does not live in /shots/ (a private
 *   project's picture is served by Loki to its owner only, never published).
 */
export function card(v, { filterable = false, href = null, shotSrc = null } = {}) {
  const src = shotSrc ?? (v.shot ? `/shots/${esc(v.slug)}.jpg` : null);
  const img = src
    ? `        <div class="shot"><img src="${esc(src)}" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"${shotSrc ? ` onerror="this.closest('.card').classList.add('text');this.parentElement.remove()"` : ""}></div>\n`
    : "";
  // Who built it (and for whom) — the portfolio says who made what. Something
  // not built has no builder to credit.
  const credit = [v.stage !== "next" && v.builtBy ? `by ${esc(v.builtBy)}` : "", v.for ? `for ${esc(v.for)}` : ""].filter(Boolean).join(" · ");
  const sub = credit ? `<span class="card-by">${credit}</span>` : "";
  const meta = filterable ? `data-stage="${esc(v.stage)}" data-tags="${esc((v.tags ?? []).map(slugify).join(" "))}" data-name="${esc(v.name)}" data-host="${esc(host(v.url ?? ""))}" data-since="${esc(v.since ?? "")}"` : "";
  const target = href ? `href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : `href="/${esc(v.slug)}/"`;
  return `      <a class="card${src ? "" : " text"}" ${target}${meta ? ` ${meta}` : ""}>
${img}        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span>${pill(v)}</div>
          <span class="card-what">${esc(v.what)}</span>${sub ? `\n          ${sub}` : ""}
        </div>
      </a>`;
}
