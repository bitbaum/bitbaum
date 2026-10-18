// The private part of the portfolio: client work the client has not agreed to
// show. The static page names nothing. The list comes from Loki only for the
// studio owner, signed in there — never for a shared code, because the code
// clients get for their own preview must not open anyone else's project.
//
// Every project is drawn by the SAME tile as the public work grid (card.mjs):
// same picture, same honest status words, same layout. Only the audience
// differs, so only two things change: the tile opens the site itself (there is
// no public page for it), and its picture comes from Loki, which serves it to
// the owner alone — a private site's screenshot is never a public file.
import { card } from "/card.mjs";

const $ = (selector, root = document) => root.querySelector(selector);

/** What Loki's private list says, as the venture the tile draws. */
function venture(p, origin) {
  return {
    slug: p.slug,
    name: p.name,
    what: p.what ?? "",
    since: p.since ?? "",
    tags: [],
    // A preview is built and waiting on the client's yes: say so, never
    // "not built", which is what `prospect` means on the public map.
    stage: p.status === "prospect" ? "preview" : undefined,
    status: p.status,
    url: p.live ?? "",
    shotSrc: p.live ? `${origin}/api/fleet/private/shot/${encodeURIComponent(p.slug)}` : null,
  };
}

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children.filter((v) => v != null));
  return node;
}

function signIn(root, origin, note) {
  root.replaceChildren(
    el("p", { class: "caption", text: note }),
    el("div", { class: "bleed-actions quiet-actions" },
      el("a", { class: "btn primary", href: `${origin}/studio-private`, text: "Sign in with Loki" }),
      el("a", { class: "btn secondary", href: "/work/", text: "Back to the public work" })),
  );
}

function list(root, origin, projects) {
  const grid = el("div", { class: "grid work-grid" });
  // card() escapes every value it is given; it is the same template the
  // public grid is built from.
  grid.innerHTML = projects
    .map((p) => {
      const v = venture(p, origin);
      return card(v, { href: v.url || null, shotSrc: v.shotSrc });
    })
    .join("\n");
  root.replaceChildren(
    el("p", { class: "work-count", role: "status", text: projects.length === 1 ? "1 private project" : `${projects.length} private projects` }),
    projects.length ? grid : el("p", { class: "empty", text: "Nothing private right now — every client project is on the public work page." }),
    el("div", { class: "bleed-actions quiet-actions" }, el("a", { class: "btn secondary", href: "/work/", text: "Back to the public work" })),
  );
}

async function load(root) {
  const origin = root.dataset.apiOrigin;
  root.replaceChildren(el("p", { class: "caption", text: "Checking who you are…" }));
  try {
    const response = await fetch(`${origin}/api/fleet/private`, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) return list(root, origin, data.projects ?? []);
    if (response.status === 401) return signIn(root, origin, "This list is for the studio owner. Sign in to Loki and you come straight back here.");
    if (response.status === 403) return signIn(root, origin, "These projects are visible to the studio owner only. If you were sent a preview, its own link and code still open it.");
    signIn(root, origin, data.error ?? "Could not reach the studio. Try again in a moment.");
  } catch {
    signIn(root, origin, "Could not reach the studio. Try again in a moment.");
  }
}

const root = $("[data-private]");
if (root) load(root);
