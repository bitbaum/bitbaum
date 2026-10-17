// The private part of the portfolio: client work the client has not agreed to
// show. The static page names nothing. The list comes from Loki only for the
// studio owner, signed in there — never for a shared code, because the code
// clients get for their own preview must not open anyone else's project.
const $ = (selector, root = document) => root.querySelector(selector);
const STATUS = { live: "live", prospect: "preview", "not live": "not live" };

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children.filter((v) => v != null).map((v) => (typeof v === "string" ? document.createTextNode(v) : v)));
  return node;
}

function card(p) {
  const status = STATUS[p.status] ?? p.status;
  return el("article", { class: "card text" }, el("div", { class: "card-body" },
    el("div", { class: "card-top" }, el("span", { class: "card-name", text: p.name }),
      status ? el("span", { class: `pill${p.status === "live" ? " beta" : ""}`, text: status }) : null),
    p.what ? el("span", { class: "card-what", text: p.what }) : null,
    p.since ? el("span", { class: "card-by", text: `since ${p.since}` }) : null,
    p.live ? el("a", { class: "textlink", href: p.live, target: "_blank", rel: "noopener noreferrer", text: `${p.live.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗` }) : null,
  ));
}

function signIn(root, origin, note) {
  root.replaceChildren(
    el("p", { class: "caption", text: note }),
    el("div", { class: "bleed-actions quiet-actions" },
      el("a", { class: "btn primary", href: `${origin}/studio-private`, text: "Sign in with Loki" }),
      el("a", { class: "btn secondary", href: "/work/", text: "Back to the public work" })),
  );
}

function list(root, projects) {
  root.replaceChildren(
    el("p", { class: "work-count", role: "status", text: projects.length === 1 ? "1 private project" : `${projects.length} private projects` }),
    projects.length
      ? el("div", { class: "grid work-grid private-grid" }, ...projects.map(card))
      : el("p", { class: "empty", text: "Nothing private right now — every client project is on the public work page." }),
    el("div", { class: "bleed-actions quiet-actions" }, el("a", { class: "btn secondary", href: "/work/", text: "Back to the public work" })),
  );
}

async function load(root) {
  const origin = root.dataset.apiOrigin;
  root.replaceChildren(el("p", { class: "caption", text: "Checking who you are…" }));
  try {
    const response = await fetch(`${origin}/api/fleet/private`, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) return list(root, data.projects ?? []);
    if (response.status === 401) return signIn(root, origin, "This list is for the studio owner. Sign in to Loki and you come straight back here.");
    if (response.status === 403) return signIn(root, origin, "These projects are visible to the studio owner only. If you were sent a preview, its own link and code still open it.");
    signIn(root, origin, data.error ?? "Could not reach the studio. Try again in a moment.");
  } catch {
    signIn(root, origin, "Could not reach the studio. Try again in a moment.");
  }
}

const root = $("[data-private]");
if (root) load(root);
