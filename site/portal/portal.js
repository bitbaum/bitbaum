// Bitbaum owns the experience; Loki supplies request-scoped state.
const $ = (selector, root = document) => root.querySelector(selector);
const read = (key) => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
const save = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ } };
const remove = (key) => { try { sessionStorage.removeItem(key); } catch { /* optional */ } };
function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children.filter((v) => v != null).map((v) => typeof v === "string" ? document.createTextNode(v) : v));
  return node;
}
const text = (copy, className = "") => el("p", { class: className, text: copy ?? "" });
const button = (copy) => el("button", { type: "submit", class: "btn primary", text: copy });
const link = (copy, href, className = "textlink") => el("a", { href, class: className, text: copy });
function field(form, name, title, { type = "text", max = 2000, required = true, value = "", options, min } = {}) {
  const id = `${form.id}-${name}`;
  const input = options ? el("select", { id, name, required }, ...options.map(([v, title]) => el("option", { value: v, text: title })))
    : type === "textarea" ? el("textarea", { id, name, rows: 5, maxLength: max, minLength: min, required })
    : el("input", { id, name, type, maxLength: max, minLength: min, required, ...(type === "text" && /url|website/.test(name) ? { inputmode: "url" } : {}) });
  input.value = value;
  form.append(el("label", { for: id, class: "portal-field" }, el("span", { text: title }), input));
  return input;
}
async function api(origin, path, { key, body } = {}) {
  const response = await fetch(origin + path, {
    method: body ? "POST" : "GET", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
    headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error ?? "The request did not complete. Your draft is still here; try again.");
  return data;
}
function accessKey() {
  return "spt_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function credential(raw) {
  return raw && /^[a-f\d-]{36}$/i.test(raw.id) && /^spt_[A-Za-z0-9_-]{43}$/.test(raw.key) ? { id: raw.id, key: raw.key } : null;
}
const portalUrl = (access) => new URL(`/portal/#id=${access.id}&key=${access.key}`, location.origin).href;
function remember(access) {
  save("bitbaum:portal:last", access);
  const stored = read("bitbaum:portal:recent");
  const recent = Array.isArray(stored) ? stored : [];
  save("bitbaum:portal:recent", [access, ...recent.filter((r) => r.id !== access.id)].slice(0, 10));
}
function intake(root) {
  const kind = root.dataset.kind;
  const draftKey = `bitbaum:intake:${kind}:v1`;
  const draft = read(draftKey) ?? {};
  let handoff = null;
  try {
    if (kind === "website" && location.hash.startsWith("#brief=")) {
      handoff = JSON.parse(decodeURIComponent(location.hash.slice(7)));
      history.replaceState(null, "", location.pathname + location.search + "#website");
    }
  } catch { /* Invalid handoffs leave the form usable. */ }
  const form = el("form", { id: `studio-${kind}`, class: "portal-form", "aria-label": kind === "website" ? "Website change request" : "Partner application" });
  const website = field(form, "website", kind === "website" ? "Website address" : "Portfolio or website (optional)", { required: kind === "website", max: 500, value: typeof handoff?.website === "string" ? handoff.website.slice(0, 500) : draft.website ?? "" });
  const changes = field(form, "changes", kind === "website" ? "What would you like to change?" : "Who are you and what do you build?", { type: "textarea", max: kind === "website" ? 1200 : 2000, value: typeof handoff?.changes === "string" ? handoff.changes.slice(0, 1200) : draft.changes ?? "" });
  const target = kind === "website" ? field(form, "target", "Who should review this brief?", { options: [["studio", "Bitbaum studio — current capacity and published offer"], ["partner", "Independent approved partner — their own quote"]], value: draft.target ?? "studio" }) : null;
  const contact = field(form, "contact", "Email for a reply (optional)", { type: "email", required: false, max: 200, value: draft.contact ?? "" });
  const company = field(form, "company", "Leave this field empty", { required: false });
  company.parentElement.hidden = true; company.tabIndex = -1; company.autocomplete = "off";
  let preferredPartnerId;
  if (kind === "website") {
    const choice = new URLSearchParams(location.hash.slice(1)).get("partner");
    if (choice && /^[a-f\d-]{36}$/i.test(choice)) { preferredPartnerId = choice; target.value = "partner"; form.append(text("This brief requests the partner you selected. Availability is checked again when you submit.", "caption")); }
  }
  const terms = el("p", { class: "caption" });
  const updateTerms = () => { terms.textContent = target?.value === "studio" ? root.dataset.offerSummary : kind === "website" ? "The studio reviews availability before assignment. You contract and agree scope and payment directly with the independent partner." : "Complete the pilot course evidence, then the studio reviews your application. Course pass and studio approval are separate."; };
  updateTerms(); target?.addEventListener("change", updateTerms);
  form.append(terms);
  const error = el("p", { role: "alert", class: "portal-error", hidden: true });
  const send = button(kind === "website" ? "Save this brief and open a portal" : "Save application and start the course");
  form.append(error, send);
  const diy = kind === "website" ? link("Build it yourself with free Loki", "", "btn secondary") : null;
  if (diy) form.append(diy);
  const current = () => ({ website: website.value, changes: changes.value, contact: contact.value, ...(target ? { target: target.value } : {}) });
  const persist = () => {
    const currentDraft = current(); save(draftKey, { ...read(draftKey), ...currentDraft });
    if (diy) diy.href = root.dataset.apiOrigin + "/commission#brief=" + encodeURIComponent(JSON.stringify({ website: website.value, changes: changes.value }));
  };
  form.addEventListener("input", persist); form.addEventListener("change", persist); persist();
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (send.disabled) return;
    persist(); error.hidden = true; send.disabled = true;
    const base = { kind, ...current(), company: company.value, ...(kind === "website" && target.value === "studio" ? { offerId: root.dataset.offerId } : {}), ...(kind === "website" && target.value === "partner" && preferredPartnerId ? { preferredPartnerId } : {}) };
    const signature = JSON.stringify(base);
    const pending = read(draftKey)?.pending;
    // Reuse the original receipt capability even after a lost response or reload.
    const body = pending?.signature === signature ? pending.body : { ...base, requestId: crypto.randomUUID(), accessKey: accessKey() };
    save(draftKey, { ...current(), pending: { signature, body } });
    try {
      const data = await api(root.dataset.apiOrigin, "/api/studio-intake", { body });
      const access = credential({ id: data.id, key: body.accessKey });
      if (!access) throw new Error("The receipt was incomplete. Retry the same brief to recover it.");
      remember(access); remove(draftKey);
      const receipt = el("section", { class: "portal-card", "aria-live": "polite" }, el("h3", { text: "Your request is saved" }), text(kind === "website" ? "Track the next action, replies and preview in your portal. Sending this brief does not book work or agree a price." : "Open your application to submit course evidence and follow the studio review."), link("Open your portal", portalUrl(access), "btn primary"), text("Keep this link private. Anyone holding it can access this request.", "caption"));
      const url = el("input", { type: "text", readonly: true, value: portalUrl(access), "aria-label": "Private portal link" });
      const copy = el("button", { type: "button", class: "btn secondary", text: "Copy private link" });
      copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(portalUrl(access)); copy.textContent = "Copied"; } catch { url.select(); copy.textContent = "Select and copy the link above"; } });
      receipt.append(url, copy); root.replaceChildren(receipt);
    } catch (err) { error.textContent = err.message; error.hidden = false; }
    finally { send.disabled = false; }
  });
  root.replaceChildren(form);
}
async function directory(root) {
  root.replaceChildren(text("Checking partner availability…", "caption"));
  try {
    const data = await api(root.dataset.apiOrigin, "/api/studio-partners");
    if (!data.partners?.length) { root.replaceChildren(text("No approved, available partner is listed yet. Build it yourself with Loki, or send the studio a brief while the first applications are reviewed."), link("Use free Loki", root.dataset.apiOrigin + "/commission", "btn secondary"), link("Send a studio brief", "/hire/#website", "btn secondary")); return; }
    root.replaceChildren(...data.partners.map((p) => el("article", { class: "portal-card" }, el("h3", { text: p.name }), text(p.headline), text(`${p.rate} · ${p.availability}`), link("View their work", p.url), link("Request this partner", `/hire/#partner=${p.id}`, "btn primary"))));
  } catch (err) { const retry = el("button", { type: "button", class: "btn secondary", text: "Check again" }); retry.addEventListener("click", () => directory(root)); root.replaceChildren(text(err.message, "portal-error"), retry, link("Use free Loki", root.dataset.apiOrigin + "/commission")); }
}
function portal(root) {
  let access = null;
  try {
    const fragment = new URLSearchParams(location.hash.slice(1));
    access = credential({ id: fragment.get("id"), key: fragment.get("key") });
  } finally { if (location.hash) history.replaceState(null, "", location.pathname + location.search); }
  access ||= credential(read("bitbaum:portal:last"));
  if (access) remember(access);
  const course = JSON.parse(root.dataset.course);
  const retries = new Map();
  function actionForm(parent, title, action, fields, makeBody, suffix = "") {
    const form = el("form", { id: `portal-${action}${suffix}`, class: "portal-form" });
    const draftKey = `bitbaum:action:${access.id}:${action}${suffix}`;
    const draft = read(draftKey) ?? {};
    form.append(el("h3", { text: title }));
    for (const f of fields) field(form, f.name, f.title, { ...f, value: draft[f.name] ?? f.value ?? "" });
    const consent = action === "propose_profile" ? el("input", { type: "checkbox", required: true }) : null;
    if (consent) form.append(el("label", { class: "portal-consent" }, consent, "I consent to the studio publishing this profile and its availability in the partner directory after review."));
    const error = el("p", { role: "alert", hidden: true, class: "portal-error" });
    const send = button(title); form.append(error, send);
    form.addEventListener("input", () => save(draftKey, Object.fromEntries(new FormData(form))));
    form.addEventListener("change", () => save(draftKey, Object.fromEntries(new FormData(form))));
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); if (send.disabled) return;
      const values = Object.fromEntries(new FormData(form));
      save(draftKey, values);
      const base = { action, ...makeBody(values) };
      const signature = JSON.stringify(base);
      const savedRetry = read(`${draftKey}:retry`);
      const mutationId = retries.get(signature) ?? (savedRetry?.signature === signature ? savedRetry.mutationId : crypto.randomUUID());
      retries.set(signature, mutationId); save(`${draftKey}:retry`, { signature, mutationId });
      send.disabled = true; error.hidden = true;
      try {
        await api(root.dataset.apiOrigin, `/api/studio-portal/${access.id}`, { key: access.key, body: { ...base, mutationId } });
        remove(draftKey); remove(`${draftKey}:retry`); retries.delete(signature); await load();
      } catch (err) { error.textContent = err.message; error.hidden = false; }
      finally { send.disabled = false; }
    });
    parent.append(form);
  }
  function preview(parent, request, mayAccept) {
    const d = request.delivery;
    if (!d) return;
    const section = el("section", { class: "portal-card" }, el("h2", { text: `Preview version ${d.version}${d.accepted ? " · accepted" : ""}` }), text(d.scope), text(d.summary), el("a", { href: d.url, target: "_blank", rel: "noreferrer", class: "btn secondary", text: "Open preview" }));
    if (mayAccept && ["ready_for_review", "changes_requested", "accepted"].includes(request.status.id)) {
      section.append(text("Acceptance applies to this version and the scope above. Production publication is agreed separately.", "caption"));
      if (!d.accepted) actionForm(section, "Accept this preview version", "accept_preview", [], () => ({ version: d.version }));
      actionForm(section, "Request changes to this version", "request_changes", [{ name: "body", title: "What should change?", type: "textarea" }], (v) => ({ version: d.version, body: v.body }));
    }
    parent.append(section);
  }
  function render(data) {
    const request = data.request;
    const content = el("div", { class: "portal-stack" });
    const heading = el("section", { class: "portal-card" }, el("h2", { text: request.status.title }), text(request.status.next), text(request.changes, "portal-words"));
    if (request.website) heading.append(el("a", { href: request.website, target: "_blank", rel: "noreferrer", class: "textlink", text: request.website }));
    if (request.offer) heading.append(text(`${request.offer.name} · ${request.offer.price} · ${request.offer.shape}`), text(request.offer.what));
    heading.append(link("Copy or save this private portal link", portalUrl(access)));
    content.append(heading); preview(content, request, true);
    if (request.partner) {
      const p = request.partner;
      content.append(text(`Course: ${p.coursePassed ? "passed" : "awaiting pass"}. Studio approval: ${p.approved ? "approved" : "pending"}.`, "caption"), link("Read the systems design pilot and rubric", "/academy/", "btn secondary"));
      if (!p.approved) actionForm(content, p.assessment ? "Submit revised course evidence" : "Submit course evidence", "submit_assessment", [
        ...course.modules.map((m) => ({ name: m.id, title: `${m.title}: ${m.prompt}`, type: "textarea", min: 30, max: 2500, value: p.assessment?.answers[m.id] ?? "" })),
        { name: "projectUrl", title: "Working capstone preview URL", value: p.assessment?.projectUrl ?? "" },
        { name: "sourceUrl", title: "Source and verification evidence URL", value: p.assessment?.sourceUrl ?? "" },
      ], (v) => ({ assessment: { version: course.version, answers: Object.fromEntries(course.modules.map((m) => [m.id, v[m.id]])), projectUrl: v.projectUrl, sourceUrl: v.sourceUrl } }));
      actionForm(content, p.profile ? "Propose a revised public profile" : "Propose your public profile", "propose_profile", [
        { name: "name", title: "Public name", max: 100, value: p.profile?.name ?? "" },
        { name: "headline", title: "What you build", max: 300, value: p.profile?.headline ?? "" },
        { name: "url", title: "Public work URL", max: 500, value: p.profile?.url ?? "" },
        { name: "rate", title: "Your rates or quoting basis", max: 200, value: p.profile?.rate ?? "" },
        { name: "availability", title: "Current availability", options: [["available", "Available"], ["limited", "Limited availability"], ["unavailable", "Unavailable"]], value: p.profile?.availability ?? "available" },
      ], (v) => ({ profile: v, consent: true }));
      content.append(text(p.profilePublished ? "Your approved profile is published. Proposing a revision removes it until the studio reviews it." : "Your proposed profile stays private until approval and publication review.", "caption"));
      if (p.approved && p.profile) actionForm(content, "Update availability", "set_availability", [{ name: "availability", title: "Availability", options: [["available", "Available"], ["limited", "Limited"], ["unavailable", "Unavailable"]], value: p.profile.availability }], (v) => ({ availability: v.availability }));
      if (p.approved) {
        content.append(el("h2", { text: "Assigned briefs" }));
        if (!data.assignments.length) content.append(text("No briefs are assigned to you yet. Keep your availability current."));
        for (const assignment of data.assignments) {
          const section = el("section", { class: "portal-card" }, el("h3", { text: assignment.website }), text(assignment.changes, "portal-words"), text(assignment.status.title));
          preview(section, assignment, false);
          if (assignment.status.id !== "closed") actionForm(section, "Submit next preview", "deliver_assignment", [{ name: "previewUrl", title: "Preview URL", max: 500 }, { name: "scope", title: "Scope for customer acceptance", type: "textarea", min: 10 }, { name: "summary", title: "Changes, verification and handover", type: "textarea", min: 10 }], (v) => ({ requestId: assignment.id, expectedVersion: assignment.delivery?.version ?? 0, ...v }), `-${assignment.id}`);
          content.append(section);
        }
      }
    }
    actionForm(content, "Send a reply", "message", [{ name: "body", title: "Add context or answer the reviewer", type: "textarea" }], (v) => ({ body: v.body }));
    const history = el("section", { class: "portal-card" }, el("h2", { text: "Request history" }));
    for (const event of request.history) history.append(el("article", { class: "portal-history" }, text(`${event.actor} · ${new Date(event.at).toLocaleString()}${event.version ? ` · version ${event.version}` : ""}`, "caption"), text(event.body, "portal-words")));
    content.append(history);
    const refresh = el("button", { type: "button", class: "btn secondary", text: "Refresh status" }); refresh.addEventListener("click", load); content.append(refresh);
    root.replaceChildren(content);
  }
  async function load() {
    if (!access) return recovery();
    try { render(await api(root.dataset.apiOrigin, `/api/studio-portal/${access.id}`, { key: access.key })); }
    catch (err) { recovery(err.message); }
  }
  function recovery(message = "Open the private link from your receipt to follow a request. No account is needed.") {
    const content = el("div", { class: "portal-stack" }, text(message, access ? "portal-error" : ""));
    const form = el("form", { id: "portal-recover", class: "portal-form" });
    field(form, "url", "Paste your complete private portal link", { max: 1000 });
    form.append(button("Open this request"));
    const error = el("p", { role: "alert", hidden: true, class: "portal-error" }); form.append(error);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try { const url = new URL(new FormData(form).get("url")); const parts = new URLSearchParams(url.hash.slice(1)); const next = credential({ id: parts.get("id"), key: parts.get("key") }); if (!next) throw new Error(); access = next; remember(access); load(); }
      catch { error.textContent = "Use the complete link including its private fragment."; error.hidden = false; }
    }); content.append(form);
    if (access) { const retry = el("button", { type: "button", class: "btn secondary", text: "Try this request again" }); retry.addEventListener("click", load); content.append(retry); }
    const stored = read("bitbaum:portal:recent");
    const recent = (Array.isArray(stored) ? stored : []).map(credential).filter(Boolean);
    if (recent.length) content.append(el("h2", { text: "Links saved in this browser session" }), ...recent.map((r) => link(`Open request ${r.id.slice(0, 8)}`, portalUrl(r), "btn secondary")));
    content.append(link("Send a new brief", "/hire/#website"), link("Apply as a partner", "/partners/#join")); root.replaceChildren(content);
  }
  window.addEventListener("hashchange", () => {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const next = credential({ id: fragment.get("id"), key: fragment.get("key") });
    if (!next) return;
    history.replaceState(null, "", location.pathname + location.search);
    access = next; remember(access); load();
  });
  load();
}
for (const root of document.querySelectorAll("[data-studio-intake]")) intake(root);
for (const root of document.querySelectorAll("[data-partner-directory]")) directory(root);
for (const root of document.querySelectorAll("[data-studio-portal]")) portal(root);
