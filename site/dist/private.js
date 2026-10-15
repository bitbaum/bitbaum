// The private part of the portfolio: client work the client has not agreed to
// show. The static page names nothing; the list comes from Loki only after the
// studio's access code, and a signed token remembers it on this device.
const KEY = "bitbaum:private:token";
const $ = (selector, root = document) => root.querySelector(selector);
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = (token) => { try { if (token) localStorage.setItem(KEY, token); } catch { /* optional */ } };
const forget = () => { try { localStorage.removeItem(KEY); } catch { /* optional */ } };
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

async function open(origin, body) {
  const response = await fetch(`${origin}/api/fleet/private`, {
    method: "POST", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const err = new Error(data.error ?? "Could not reach the studio. Try again in a moment.");
    err.status = response.status;
    throw err;
  }
  return data;
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

function form(root, origin, note = "") {
  const id = "private-code";
  const input = el("input", { id, name: "code", type: "password", autocomplete: "off", autocapitalize: "none", spellcheck: "false", required: true, maxlength: 200 });
  const error = el("p", { class: "portal-error", role: "alert", hidden: !note, text: note });
  const submit = el("button", { type: "submit", class: "btn primary", text: "Show private projects" });
  const f = el("form", { class: "portal-form private-form", novalidate: true },
    el("label", { for: id, class: "portal-field" }, el("span", { text: "Access code" }), input),
    error, submit,
    el("p", { class: "caption", text: "The code is the one the studio gave you with your preview. It is remembered on this device for 30 days." }));
  f.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) { error.hidden = false; error.textContent = "Type the code first."; input.focus(); return; }
    submit.disabled = true; submit.textContent = "Opening…"; error.hidden = true;
    try {
      const data = await open(origin, { code });
      save(data.token);
      list(root, origin, data.projects);
    } catch (err) {
      error.hidden = false; error.textContent = err.message;
      submit.disabled = false; submit.textContent = "Show private projects";
      input.select();
    }
  });
  root.replaceChildren(f);
  input.focus();
}

function list(root, origin, projects) {
  const lock = el("button", { type: "button", class: "btn secondary", text: "Lock again" });
  lock.addEventListener("click", () => { forget(); form(root, origin); });
  root.replaceChildren(
    el("p", { class: "work-count", role: "status", text: projects.length === 1 ? "1 private project" : `${projects.length} private projects` }),
    projects.length
      ? el("div", { class: "grid work-grid private-grid" }, ...projects.map(card))
      : el("p", { class: "empty", text: "Nothing private right now — every client project is on the public work page." }),
    el("div", { class: "bleed-actions quiet-actions" }, el("a", { class: "btn secondary", href: "/work/", text: "Back to the public work" }), lock),
  );
}

const root = $("[data-private]");
if (root) {
  const origin = root.dataset.apiOrigin;
  const token = read();
  if (!token) form(root, origin);
  else {
    root.replaceChildren(el("p", { class: "caption", text: "Opening…" }));
    open(origin, { token })
      .then((data) => list(root, origin, data.projects))
      .catch((err) => { if (err.status === 401) forget(); form(root, origin, err.status === 401 ? "Enter the code again — it has changed or expired." : err.message); });
  }
}
