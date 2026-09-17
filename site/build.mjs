#!/usr/bin/env node
// bitbaum.orangecat.ch — the studio's front door, generated.
//
// What the site is FOR: bringing more people into the work. A visitor who has
// met Cato, found a repo, installed a package or read an article should be
// able to see what exists, find the part that concerns them, and take a
// concrete next step — install it, read its source, open a PR, or get paid
// for what they build here. So every page ends in an action, and every claim
// is something that can be checked: a live URL, a public repo, a screenshot a
// machine took, an adopter list derived from real manifests.
//
// What it is NOT: a list anyone types. Ventures come from the fleet map
// (Loki's register: what exists, where it runs, what state it is in), packages
// and their adopters from fleet's derived registry, origin dates from the
// proof register. This repo owns presentation only: overrides.json says the
// stage a venture is at, its field tags, its one line and its story.
//
// Pages: /  /<slug>/  /packages/  /studio/  — static HTML in site/dist/,
// served by Caddy's file_server with clean directory URLs.
//
//   node site/build.mjs            fetch the sources, write site/dist/
//   node site/build.mjs --offline  build from the committed snapshots
//   node site/build.mjs --check    exit 1 if site/dist/ is stale
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");
const args = new Set(process.argv.slice(2));

const SOURCES = {
  map: [process.env.FLEET_MAP_URL ?? "https://loki.orangecat.ch/api/fleet/map", "map.snapshot.json", "fleet map"],
  packages: [process.env.FLEET_PACKAGES_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json", "packages.snapshot.json", "package registry"],
  origin: [process.env.FLEET_ORIGIN_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json", "origin.snapshot.json", "origin register"],
};
const SITE = "https://bitbaum.orangecat.ch";
const GITHUB = "https://github.com/bitbaum";
const CONTRIBUTING = "https://github.com/bitbaum/.github/blob/main/CONTRIBUTING.md";
const SHARE_POLICY = "https://solon.orangecat.ch/api/orgs/orangecat/policies/originator_share";
const HIRE = "/hire/";
const ARTICLES = "https://orangecat.ch/articles";

async function fetchOrSnapshot([url, file, what]) {
  const snapshot = join(here, file);
  if (!args.has("--offline")) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        writeFileSync(snapshot, JSON.stringify(json, null, 2) + "\n");
        return json;
      }
      console.error(`${what} answered ${res.status}; using snapshot`);
    } catch (e) {
      console.error(`${what} unreachable (${e?.message ?? e}); using snapshot`);
    }
  }
  // A missing source must not silently produce a page with nothing on it.
  if (!existsSync(snapshot)) throw new Error(`no ${what} and no snapshot — cannot build`);
  return JSON.parse(readFileSync(snapshot, "utf8"));
}

// ── helpers ─────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso) => (iso ? `${MONTHS[new Date(iso).getUTCMonth()]} ${new Date(iso).getUTCFullYear()}` : "");
const host = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MARK = `<svg viewBox="110 76 180 202" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d="M 200,120 C 195,93 173,87 152,99 C 128,114 128,126 152,141 C 173,153 195,147 200,120 C 205,93 227,87 248,99 C 272,114 272,126 248,141 C 227,153 205,147 200,120"/><path fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d="M 200,232 C 195,205 173,199 152,211 C 128,226 128,238 152,253 C 173,265 195,259 200,232 C 205,205 227,199 248,211 C 272,226 272,238 248,253 C 227,265 205,259 200,232"/></svg>`;
const ARROW = `<span class="arrow" aria-hidden="true">&rarr;</span>`;
const STAGE_RANK = { product: 0, pilot: 1, concept: 2, next: 3 };

// ── the ventures: register facts + presentation + what they are built from ──
export function ventures(map, cfg, origin, packages) {
  const byRepo = new Map((origin?.repos ?? []).map((r) => [r.repo.split("/")[1], r]));
  const alias = cfg.adopterAliases ?? {};
  // Invert the registry: which packages does each venture use? The registry
  // names adopters by repository, so an alias map carries the few that differ.
  const uses = new Map();
  for (const p of packages?.packages ?? []) {
    for (const a of p.adopterNames ?? []) {
      const slug = alias[a] ?? a;
      if (!uses.has(slug)) uses.set(slug, []);
      uses.get(slug).push(p.slug);
    }
  }
  const out = [];
  const seen = new Set();
  const build = (o, p = {}) => {
    const repoName = p.urls?.repo ? p.urls.repo.split("/").pop() : null;
    const org = repoName ? byRepo.get(repoName) : null;
    const url = o.url ?? p.urls?.live ?? null;
    const slug = o.slug ?? p.slug;
    return {
      slug,
      name: o.name ?? p.name ?? slug,
      what: o.what,
      story: o.story ?? "",
      stage: o.stage,
      tags: o.tags ?? [],
      pillar: o.pillar ?? null,
      pillarRole: o.pillarRole ?? null,
      for: o.for ?? null,
      order: o.order ?? 99,
      status: p.status ?? (url ? "live" : ""),
      url,
      repo: p.urls?.repo ?? o.repo ?? null,
      since: org?.firstCommit?.date ?? p.since ?? null,
      shot: o.shot !== false && Boolean(url),
      uses: (uses.get(slug) ?? []).sort(),
      // Where else this project exists. The fleet map has carried these two
      // since it was published and this generator discarded them, so "which
      // projects have a profile where" was a question only the raw JSON could
      // answer. Loki is deliberately not here: every project on the map is a
      // Loki project by construction (35 of 35) and its project pages need a
      // session — a column that is always true and never clickable tells a
      // reader nothing.
      profiles: {
        orangecat: p.urls?.orangecat ?? null,
        solon: p.urls?.solon ?? null,
      },
    };
  };
  for (const p of map.projects ?? []) {
    const o = cfg.overrides?.[p.slug];
    if (!o?.what || !o.stage) continue;
    seen.add(p.slug);
    out.push(build({ ...o, slug: p.slug }, p));
  }
  for (const x of cfg.extras ?? []) {
    if (seen.has(x.slug) || !x.what || !x.stage) continue;
    out.push(build(x));
  }
  // Stage order, then a venture's own order: the pager on a venture page
  // walks the same sequence the grid shows.
  return out.sort((a, b) => (STAGE_RANK[a.stage] ?? 9) - (STAGE_RANK[b.stage] ?? 9) || a.order - b.order || a.name.localeCompare(b.name));
}

// apps.conf `live` means the process is SERVED. It is not a release claim, and
// rendering it as one is the mistake this table exists to not make: nothing
// here is finished enough to hand over without a caveat, OrangeCat included,
// so the public word is beta. "Live" is reserved for something we would be
// comfortable releasing, and today that is nothing.
const STATUS_TEXT = { live: "beta", demo: "demo", validating: "validating", prospect: "not built", unverified: "concept", "not live": "not live" };
function pill(v) {
  if (v.stage === "next") return `<span class="pill">not built</span>`;
  if (v.stage === "concept") return `<span class="pill">concept</span>`;
  const text = STATUS_TEXT[v.status] ?? v.status;
  // Keyed on the STATUS, not the rendered word — so renaming the word cannot
  // silently drop the accent that marks a thing you can actually open.
  return text ? `<span class="pill ${v.status === "live" ? "beta" : ""}">${esc(text)}</span>` : "";
}

// ── page chrome ─────────────────────────────────────────────────────────────
function shell({ title, description, path, body, nav, script, image }) {
  // A link to this site is how almost anyone arrives, so the card a share
  // renders is part of the page: a venture shows its own screenshot, every
  // other page the studio card (site/og.mjs).
  const ogImage = `${SITE}${image ?? "/og/studio.png"}`;
  const items = [
    ["/#work", "The work"],
    ["/packages/", "Packages"],
    ["/studio/", "Studio"],
    ["/#join", "Build with us"],
    ["/hire/", "Hire"],
  ];
  return `<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:site_name" content="bitbaum">
<meta property="og:type" content="website">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="/logo-mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="top">
    <div class="wrap">
      <a class="mark" href="/">${MARK}bitbaum</a>
      <nav aria-label="Site">
${items.map(([href, t]) => `        <a href="${href}"${nav === href ? ' aria-current="page"' : ""}>${t}</a>`).join("\n")}
        <a href="${GITHUB}" rel="noopener">GitHub &#8599;</a>
      </nav>
      <a class="btn secondary cta" href="${HIRE}">Start a project ${ARROW}</a>
    </div>
  </header>
${body}
  <footer>
    <div class="wrap">
      <span>bitbaum is built in Zürich, in the open. Nothing here is registered; an orangecat.ch name is an address on one server.</span>
      <nav aria-label="Elsewhere">
        <a href="${GITHUB}" rel="noopener">GitHub</a>
        <a href="${CONTRIBUTING}">Contributing</a>
        <a href="${ARTICLES}">Writing</a>
        <a href="${HIRE}">Start a project</a>
        <a href="/map.json">map.json</a>
      </nav>
    </div>
  </footer>
${script ?? ""}
</body>
</html>
`;
}

// ── cards ───────────────────────────────────────────────────────────────────
function card(v) {
  const img = v.shot
    ? `        <div class="shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"></div>\n`
    : "";
  const sub = v.for ? `<span class="label">for ${esc(v.for)}</span>` : "";
  const meta = `data-stage="${esc(v.stage)}" data-tags="${esc(v.tags.map(slugify).join(" "))}"`;
  return `      <a class="card${v.shot ? "" : " text"}" href="/${esc(v.slug)}/" ${meta}>
${img}        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span>${pill(v)}</div>
          <span class="card-what">${esc(v.what)}</span>${sub ? `\n          ${sub}` : ""}
        </div>
      </a>`;
}

function pkgCard(p, editorial, ventureBySlug, alias) {
  const what = editorial?.what ?? p.description ?? "";
  const npmHref = p.install?.source === "npm" ? `https://www.npmjs.com/package/${p.name}` : null;
  // Who uses it, by name — the question "what uses this package?" answered on
  // the page rather than by reading nine manifests. An adopter with no venture
  // page renders as plain text, which is honest: it is a real adopter the site
  // does not show.
  const adopters = (p.adopterNames ?? []).map((a) => {
    const v = ventureBySlug.get(alias[a] ?? a);
    return v ? `<a href="/${esc(v.slug)}/">${esc(v.name)}</a>` : `<span>${esc(a)}</span>`;
  });
  return `      <article class="card text" id="${esc(p.slug)}">
        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(p.slug)}</span><span class="pill">${p.adopters === 1 ? "1 app" : `${p.adopters} apps`}</span></div>
          <span class="card-what">${esc(what)}</span>
          <code class="pkg-install">${esc(p.install?.command ?? "")}</code>
${adopters.length ? `          <div class="uses"><span class="label">Used by</span><div class="chips">${adopters.join("")}</div></div>\n` : ""}          <div class="pkg-links"><a href="${esc(p.repo)}">source</a>${npmHref ? `<a href="${esc(npmHref)}">npm</a>` : `<span>git tag</span>`}</div>
        </div>
      </article>`;
}

// ── the work: one grid, two facets ──────────────────────────────────────────
//
// Four sections by commercial honesty was the right TRUTH and the wrong
// NAVIGATION: someone looking for health tools had to read all four. So the
// stage becomes a facet rather than a heading — the honesty survives as a
// definition under the filter and as a pill on every card — and the field
// becomes a second facet. Without JavaScript every card is visible, which is
// the correct fallback for a list.
function workSection(all, cfg) {
  const stages = Object.entries(cfg.stages ?? {}).filter(([k]) => all.some((v) => v.stage === k));
  const tags = (cfg.tagOrder ?? []).filter((t) => all.some((v) => v.tags.includes(t)));
  const chip = (facet, value, label, n) =>
    `<button type="button" class="chip" data-facet="${facet}" data-value="${esc(value)}" aria-pressed="false">${esc(label)}<span class="chip-n">${n}</span></button>`;
  return `    <section class="section" id="work">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">The work</h2><span class="label" id="work-count">${all.length} of ${all.length}</span></div>
          <p class="lede">Everything the studio has built, at the stage it is really at. Pick a stage or a field — the address bar keeps your choice, so a filtered view is a link you can send.</p>
        </div>
        <div class="filters">
          <div class="filter-row"><span class="label">Stage</span><div class="chips">
${stages.map(([k, s]) => `            ${chip("stage", k, s.plural, all.filter((v) => v.stage === k).length)}`).join("\n")}
          </div></div>
          <div class="filter-row"><span class="label">Field</span><div class="chips">
${tags.map((t) => `            ${chip("tag", slugify(t), t, all.filter((v) => v.tags.includes(t)).length)}`).join("\n")}
          </div></div>
          <button type="button" class="clear" id="clear-filters" hidden>Clear ${ARROW}</button>
        </div>
        <dl class="legend">
${stages.map(([, s]) => `          <div><dt>${esc(s.plural)}</dt><dd>${esc(s.lede)}</dd></div>`).join("\n")}
        </dl>
        <div class="grid" id="work-grid">
${all.map((v) => card(v)).join("\n")}
        </div>
        <p class="empty" id="work-empty" hidden>Nothing at that intersection yet. <button type="button" class="linkish" data-clear>Clear the filter</button> to see everything.</p>
      </div>
    </section>`;
}

const FILTER_SCRIPT = `  <script>
  // Facet filtering, progressive: without this file every card is shown.
  // An empty selection means NO filter (never "nothing matches"), and the
  // address bar carries the choice so a filtered view can be shared.
  (function () {
    var grid = document.getElementById("work-grid");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.children);
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var countEl = document.getElementById("work-count");
    var emptyEl = document.getElementById("work-empty");
    var clearEl = document.getElementById("clear-filters");
    var state = { stage: new Set(), tag: new Set() };

    function apply(push) {
      var shown = 0;
      cards.forEach(function (c) {
        var stageOk = state.stage.size === 0 || state.stage.has(c.dataset.stage);
        var cardTags = (c.dataset.tags || "").split(" ").filter(Boolean);
        var tagOk = state.tag.size === 0 || cardTags.some(function (t) { return state.tag.has(t); });
        var on = stageOk && tagOk;
        c.hidden = !on;
        if (on) shown++;
      });
      chips.forEach(function (ch) {
        ch.setAttribute("aria-pressed", state[ch.dataset.facet].has(ch.dataset.value) ? "true" : "false");
      });
      countEl.textContent = shown + " of " + cards.length;
      emptyEl.hidden = shown !== 0;
      var any = state.stage.size + state.tag.size > 0;
      clearEl.hidden = !any;
      if (push) {
        var parts = [];
        if (state.stage.size) parts.push("stage=" + Array.from(state.stage).join(","));
        if (state.tag.size) parts.push("field=" + Array.from(state.tag).join(","));
        history.replaceState(null, "", parts.length ? "#work?" + parts.join("&") : location.pathname + "#work");
      }
    }
    function read() {
      var q = location.hash.indexOf("?");
      state.stage = new Set(); state.tag = new Set();
      if (q === -1) return;
      new URLSearchParams(location.hash.slice(q + 1)).forEach(function (val, key) {
        var into = key === "stage" ? state.stage : key === "field" ? state.tag : null;
        if (into) val.split(",").filter(Boolean).forEach(function (v) { into.add(v); });
      });
    }
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        var set = state[ch.dataset.facet];
        if (set.has(ch.dataset.value)) set.delete(ch.dataset.value); else set.add(ch.dataset.value);
        apply(true);
      });
    });
    function clear() { state.stage.clear(); state.tag.clear(); apply(true); }
    clearEl.addEventListener("click", clear);
    Array.prototype.forEach.call(document.querySelectorAll("[data-clear]"), function (b) { b.addEventListener("click", clear); });
    window.addEventListener("hashchange", function () { read(); apply(false); });
    read(); apply(false);
  })();
  </script>`;

// ── pages ───────────────────────────────────────────────────────────────────
export function homePage(all, packages, cfg, origin) {
  const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
  const alias = cfg.adopterAliases ?? {};
  const pillars = all.filter((v) => v.pillar);
  const running = all.filter((v) => v.status === "live" && v.stage !== "next").length;
  const pkgCount = (packages.packages ?? []).length;
  const proven = (origin?.repos ?? []).filter((r) => r.provenSince).length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  // The hero's bed is the work itself, in the order the grid below shows it.
  const mosaic = all.filter((v) => v.shot && v.status === "live").slice(0, 8);

  const body = `  <main>
    <section class="hero hero-cinema">
      <div class="hero-bed" aria-hidden="true">
${mosaic.map((v) => `        <img src="/shots/${esc(v.slug)}.jpg" alt="" width="1280" height="800">`).join("\n")}
      </div>
      <div class="wrap">
        <span class="eyebrow">Zürich &middot; MIT throughout &middot; open to contributors</span>
        <h1 class="display-1">One trunk. Many products.</h1>
        <p class="lede">bitbaum builds AI-native products on infrastructure that is open by construction — ${pkgCount} shared packages, one server, and a stack for moving value, dispatching work and deciding together. ${running} products run today, all of them in beta. Take any of it, or come build here.</p>
        <div class="actions">
          <a class="btn primary" href="#work">See the work ${ARROW}</a>
          <a class="btn secondary" href="#join">Build with us</a>
        </div>
        <div class="specs">
          <div class="spec"><span class="spec-value">${running}</span><span class="spec-label">Products in beta</span></div>
          <div class="spec"><span class="spec-value">${pkgCount}</span><span class="spec-label">Open-source packages</span></div>
          <div class="spec"><span class="spec-value">${proven}</span><span class="spec-label">Repos with proven origin</span></div>
          <div class="spec"><span class="spec-value">1</span><span class="spec-label">Server</span></div>
        </div>
      </div>
    </section>

    <section class="section" id="start">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Start where you are</h2>
          <p class="lede">People arrive here for one of four reasons. Each has its own door, so nobody has to read the whole page to find theirs.</p>
        </div>
        <div class="grid four">
          <a class="card text" href="${HIRE}">
            <div class="card-body">
              <div class="card-top"><span class="card-name">You want something built</span></div>
              <span class="card-what">A product, a pipeline, or a rescue of code nobody understands. New work is closed at the moment, so the waitlist is the way in.</span>
              <div class="pkg-links"><span>Join the waitlist &rarr;</span></div>
            </div>
          </a>
          <a class="card text" href="/packages/">
            <div class="card-body">
              <div class="card-top"><span class="card-name">You write code</span></div>
              <span class="card-what">${pkgCount} MIT packages, each showing which products use it — so you can see what it has survived before you install it.</span>
              <div class="pkg-links"><span>The packages &rarr;</span></div>
            </div>
          </a>
          <a class="card text" href="/#work?stage=pilot,concept">
            <div class="card-body">
              <div class="card-top"><span class="card-name">You run a service</span></div>
              <span class="card-what">Pilots and concepts built for real organisations and public services — what exists, what it runs on, and how to talk about it.</span>
              <div class="pkg-links"><span>Pilots and concepts &rarr;</span></div>
            </div>
          </a>
          <a class="card text" href="#join">
            <div class="card-body">
              <div class="card-top"><span class="card-name">You want to build with us</span></div>
              <span class="card-what">Use it, contribute to it, or share in it — with exactly what each of those means today, including what it does not.</span>
              <div class="pkg-links"><span>How to join &rarr;</span></div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <section class="section" id="stack">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Three layers, so others can build here</h2>
          <p class="lede">Working together needs more than a repository: a way to be paid, a way to get work done, and a way to decide. Each layer is a product in its own right, and each is what makes the next contributor possible.</p>
        </div>
        <div class="grid">
${pillars.map((v) => `      <a class="card big" href="/${esc(v.slug)}/">
        <div class="shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"></div>
        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span><span class="pill pillar">${esc(v.pillar)}</span></div>
          <span class="card-what">${esc(v.pillarRole ?? v.what)}</span>
        </div>
      </a>`).join("\n")}
        </div>
      </div>
    </section>

${workSection(all, cfg)}

    <section class="section" id="packages">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">Built from ${pkgCount} shared packages</h2><a class="textlink" href="/packages/">All ${pkgCount}, with who uses them &rarr;</a></div>
          <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
        </div>
        <div class="grid">
${(packages.packages ?? []).slice(0, 3).map((p) => pkgCard(p, cfg.packages?.[p.slug], ventureBySlug, alias)).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="join">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Build with us</h2>
          <p class="lede">Anyone can take this work or join it. Four doors, in order of how much they ask of you.</p>
        </div>
        <div class="grid four">
          <article class="card text">
            <div class="card-body">
              <div class="card-top"><span class="card-name">Use it</span><span class="pill">MIT</span></div>
              <span class="card-what">Every package is MIT and installable today. Nothing to ask, nothing to sign.</span>
              <code class="pkg-install">pnpm add @bitbaum/ai-kit</code>
              <div class="pkg-links"><a href="/packages/">All packages &rarr;</a></div>
            </div>
          </article>
          <article class="card text">
            <div class="card-body">
              <div class="card-top"><span class="card-name">Contribute</span><span class="pill">open PRs</span></div>
              <span class="card-what">Sign off your commits and open a pull request. A maintainer reviews every outside pull request; approved and green, it merges on its own.</span>
              <code class="pkg-install">git commit -s</code>
              <div class="pkg-links"><a href="${CONTRIBUTING}">Contributor terms</a><a href="${GITHUB}">Repositories</a></div>
            </div>
          </article>
          <article class="card text">
            <div class="card-body">
              <div class="card-top"><span class="card-name">Share in it</span><span class="pill">rule v1</span></div>
              <span class="card-what">A tenth of a product's net revenue goes, by governed rule, to the originators of the code it uses. Today that means a repository's first author, and there is no revenue yet: nothing has been paid, and contributions earn no share. Changing that is a Solon vote.</span>
              <div class="pkg-links"><a href="${SHARE_POLICY}">The policy</a><a href="/solon/">How it is governed</a></div>
            </div>
          </article>
          <article class="card text">
            <div class="card-body">
              <div class="card-top"><span class="card-name">Hire the studio</span><span class="pill">Zürich</span></div>
              <span class="card-what">Fractional CTO and contract engineering. New work is closed at the moment; the waitlist hears first when it opens.</span>
              <div class="pkg-links"><a href="${HIRE}">The waitlist</a><a href="${ARTICLES}">Writing</a></div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="open">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Open by construction</h2>
          <p class="lede">Three things make "take it, or join it" safe to say out loud.</p>
        </div>
        <div class="facts">
          <div class="fact"><span class="label">Licence</span><span class="display-3">MIT, everywhere</span><p class="copy">Every product and package the studio owns is MIT. What is built for someone else stays theirs.</p></div>
          <div class="fact"><span class="label">Origin</span><span class="display-3">Proven nightly</span><p class="copy">Every repository's HEAD is stamped through OpenTimestamps and archived by Software Heritage${block ? `, anchored in Bitcoin since block ${block}` : ""}. Git dates prove nothing; a block does. <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">The register</a>.</p></div>
          <div class="fact"><span class="label">Numbers</span><span class="display-3">Read, not written</span><p class="copy">Stars, downloads, revenue and what has been paid back to originators are read nightly from sources that are not us, and published as they are. <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">The readings</a>.</p></div>
        </div>
      </div>
    </section>
  </main>`;
  return shell({
    title: "bitbaum — one trunk, many products",
    description: `AI-native products on open infrastructure, built in Zürich. ${running} products in beta, ${pkgCount} MIT packages, and a stack for moving value, dispatching work and deciding together.`,
    path: "/", body, nav: "/", script: FILTER_SCRIPT,
  });
}

export function packagesPage(packages, cfg, all) {
  const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
  const alias = cfg.adopterAliases ?? {};
  const list = packages.packages ?? [];
  const totalUses = list.reduce((s, p) => s + (p.adopters ?? 0), 0);
  const body = `  <main>
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">${list.length} packages &middot; MIT &middot; ${totalUses} installs across the fleet</span>
        <h1 class="display-1">The trunk.</h1>
        <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
        <div class="actions">
          <a class="btn primary" href="${GITHUB}">Read the source ${ARROW}</a>
          <a class="btn secondary" href="${CONTRIBUTING}">How to contribute</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="grid">
${list.map((p) => pkgCard(p, cfg.packages?.[p.slug], ventureBySlug, alias)).join("\n")}
        </div>
        <p class="caption">Adopter lists are derived from real <code>package.json</code> files across the organisation by <a href="https://github.com/bitbaum/fleet/blob/main/scripts/ci/shared-registry-audit.mjs">fleet's registry audit</a> — nobody types them, and a package that quietly lost its last user would show it here.</p>
      </div>
    </section>
  </main>`;
  return shell({ title: "Packages — bitbaum", description: cfg.packages_lede ?? "", path: "/packages/", body, nav: "/packages/" });
}

/**
 * A venture's profiles on the other two pillars, as anchors.
 *
 * Named rather than inlined because the home grid counts them and the venture
 * page renders them, and those two must not disagree about what "has a
 * profile" means.
 */
export function profileLinks(v) {
  const p = v.profiles ?? {};
  return [
    p.orangecat ? `<a href="${esc(p.orangecat)}">OrangeCat</a>` : null,
    p.solon ? `<a href="${esc(p.solon)}">Solon</a>` : null,
  ].filter(Boolean);
}

export function venturePage(v, all, cfg, contact) {
  const i = all.indexOf(v);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const stage = cfg.stages?.[v.stage];
  const facts = [
    ["Stage", (stage?.title ?? v.stage) + (v.for ? `, for ${v.for}` : "")],
    ["Status", v.stage === "next" ? "Named, not built" : v.status === "live" ? "Beta — running, not released" : v.status === "demo" ? "Demo, mock data" : v.status === "validating" ? "Validating" : v.status || "—"],
    v.tags.length ? ["Field", v.tags.map((t) => `<a href="/#work?field=${esc(slugify(t))}">${esc(t)}</a>`).join(", ")] : null,
    v.since ? ["Since", monthYear(v.since)] : null,
    v.url ? ["Address", `<a href="${esc(v.url)}">${esc(host(v.url))}</a>`] : null,
    v.repo ? ["Source", `<a href="${esc(v.repo)}">${esc(v.repo.replace("https://github.com/", ""))}</a>`] : null,
    // Two of the three pillars, from the product's side: where it is funded and
    // found, and where its rules are decided. Absent ones are simply not listed
    // — a venture page is not the place to publish a gap; the register is
    // (fleet: scripts/ci/product-identity-audit.mjs).
    profileLinks(v).length ? ["Profiles", profileLinks(v).join(", ")] : null,
  ].filter(Boolean);
  // The other direction of "what uses these packages": from a product, to the
  // shared code it is made of.
  const built = v.uses.length
    ? `        <div class="uses"><span class="label">Built from</span><div class="chips">${v.uses.map((s) => `<a href="/packages/#${esc(s)}">${esc(s)}</a>`).join("")}</div></div>`
    : "";
  const body = `  <main>
    <section class="venture-hero">
      <div class="wrap">
        <span class="eyebrow${v.status === "live" ? "" : " quiet"}">${esc(stage?.title ?? v.stage)}${v.pillar ? ` &middot; ${esc(v.pillar)}` : ""}${v.for ? ` &middot; for ${esc(v.for)}` : ""}</span>
        <h1 class="display-1">${esc(v.name)}</h1>
        <p class="lede">${esc(v.what)}</p>
        <div class="actions">
          ${v.url ? `<a class="btn primary" href="${esc(v.url)}">Open ${esc(host(v.url))} ${ARROW}</a>` : ""}
          ${v.repo ? `<a class="btn secondary" href="${esc(v.repo)}">Source</a>` : ""}
          ${contact ? `<a class="btn secondary" href="mailto:${esc(contact)}?subject=${encodeURIComponent(`About ${v.name}`)}">Ask about ${esc(v.name)}</a>` : ""}
        </div>
      </div>
    </section>
${v.shot ? `    <div class="wrap"><div class="venture-shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot of ${esc(host(v.url))}" width="1280" height="800"></div></div>` : ""}
    <section class="wrap venture-body">
      <div class="prose">
        ${v.story ? `<p>${esc(v.story)}</p>` : ""}
        ${stage ? `<p class="caption"><strong>${esc(stage.plural)}:</strong> ${esc(stage.lede)}</p>` : ""}
        ${v.shot ? `<p class="caption">The image is a screenshot of ${esc(host(v.url))}, taken by a machine when this site was built. If the product changed, so did the picture.</p>` : ""}
      </div>
      <div class="venture-facts">
${facts.map(([k, val]) => `        <div><span class="label">${esc(k)}</span><span>${val}</span></div>`).join("\n")}
${built}
      </div>
    </section>
    <div class="wrap"><div class="pager"><a href="/${esc(prev.slug)}/">&larr; ${esc(prev.name)}</a><a href="/#work?stage=${esc(v.stage)}">All ${esc((stage?.plural ?? "").toLowerCase())}</a><a href="/${esc(next.slug)}/">${esc(next.name)} &rarr;</a></div></div>
  </main>`;
  return shell({ title: `${v.name} — ${v.what}`, description: v.story || v.what, path: `/${v.slug}/`, body, image: v.shot ? `/shots/${v.slug}.jpg` : undefined });
}

export function studioPage(all, packages, origin) {
  const running = all.filter((v) => v.status === "live" && v.stage !== "next").length;
  const pkgCount = (packages.packages ?? []).length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  const body = `  <main>
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">The studio</span>
        <h1 class="display-1">Bit, and Baum.</h1>
        <p class="lede">Bit for software. Baum, German for tree, for the shape: many branches from one trunk. The trunk is what lets a small group ship like a large one — and what lets the next person start in the middle rather than at the beginning.</p>
        <div class="actions">
          <a class="btn primary" href="/#join">Build with us ${ARROW}</a>
          <a class="btn secondary" href="/#work">See the work</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap"><div class="prose">
        <h2>What bitbaum is</h2>
        <p>A product studio, not a consultancy and not a single-product company. It ships AI-native products for real problems — an economic agent, an operating system for AI fleets, governance you can recount, tools for a non-profit, a clinic, a housing organisation — and each is built from the same shared infrastructure, so the next one is cheaper than the last. ${running} of them run today — in beta, every one.</p>
        <h2>Why the stack is what it is</h2>
        <p>Three of the products are less products for a customer than the conditions for working together. <a href="/orangecat/">OrangeCat</a> is how value reaches whoever did the work, without a bank deciding who qualifies. <a href="/loki/">Loki</a> is how work is dispatched to a fleet of AI agents and people, and verified before it ships. <a href="/solon/">Solon</a> is how rules are decided and recounted, by signature rather than by trust. Building them was the answer to a plain question: what has to exist before more than one person can build here and be treated fairly?</p>
        <h2>How the work gets done</h2>
        <p>The trunk. ${pkgCount} open-source packages carry the parts every product needs: which AI model to call and what to do when it fails, email, forms filled from prose, rate limits, lists, threads, design tokens, sites as data. Loki runs a fleet of AI agents that build, verify and deploy every product here — including Loki. The human job is judgment: what to build, what is good enough, what is true.</p>
        <h2>What is true</h2>
        <p>Nothing on this site is typed by hand. The list of products comes from the register that provisioning reads; the pictures are screenshots a machine takes on every build; the adopter lists come from real manifests; the counts come from GitHub, npm and the register. There are no clients on this site because there are none: the pilots run for real organisations as favours, offered first, and say so.</p>
        <h2>Open by construction</h2>
        <p>Every product and package the studio owns is MIT. Contributor terms live in one place, <a href="${CONTRIBUTING}">bitbaum/.github</a>: sign off your commits and a sweep merges anything green. Every repository's origin is stamped nightly through OpenTimestamps and archived by Software Heritage${block ? `, anchored in Bitcoin since block ${block}` : ""}, so precedence is arithmetic rather than a claim. And a <a href="${SHARE_POLICY}">rule in Solon</a> routes a tenth of any revenue back to whoever originated the code a product is built from — by default, before there is revenue to route.</p>
        <h2>Numbers, in the open</h2>
        <p>Stars, forks, downloads, paying clients and what has been paid to originators are read nightly from sources that are not us and published as they are — most of them zero today. <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">The readings</a>, and the <a href="${ARTICLES}">writing</a> that keeps score in public.</p>
        <h2>Work with the studio</h2>
        <p>Fractional CTO and contract engineering, Zürich. What the work looks like, and the waitlist, are on the <a href="${HIRE}">hire page</a>. The code is on <a href="${GITHUB}">GitHub</a>.</p>
      </div></div>
    </section>
  </main>`;
  return shell({ title: "The studio — bitbaum", description: "Bit for software, Baum for the shape: many branches from one trunk. What has to exist before more than one person can build here.", path: "/studio/", body, nav: "/studio/" });
}

// ── hire ────────────────────────────────────────────────────────────────────
//
// The page the primary button on every other page points at, so it is the one
// page that must not read as a different company. It lived on GitHub Pages in
// its own design, under a personal name and a superseded GitHub handle, with
// no way to make contact — a prospect's only link was a profile page.
//
// Rates, method and answers are editorial (site/hire.json). The evidence is
// NOT: the live-work list is derived from the same register as the rest of the
// site, which is why the old hand-typed one could quote a host that had been
// retired for two days.
// The list itself is Loki's newsletter table (POST /api/newsletter, source
// bitbaum-hire), which rate-limits, dedupes and — since bitbaum/loki#759 —
// announces a new row on Telegram. This page is static, so the request goes
// cross-origin from the visitor's browser; if it fails for any reason the
// mailto below it still works, and the copy says so rather than pretending.
const WAITLIST_ENDPOINT = "https://loki.orangecat.ch/api/newsletter";

function waitlistScript(email) {
  return `  <script>
    (function () {
      var form = document.getElementById("waitlist-form");
      var status = document.getElementById("wl-status");
      if (!form || !status) return;
      var button = form.querySelector("button");
      var DONE = "You are on the list. I write to it when capacity opens \\u2014 nothing else goes out.";
      function say(text, bad) {
        status.textContent = text;
        status.className = bad ? "form-status bad" : "form-status";
      }
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var address = (form.email.value || "").trim();
        if (address.indexOf("@") < 1 || address.indexOf(".") < 0) {
          say("Enter an email address I can reply to.", true);
          form.email.focus();
          return;
        }
        if (form.company.value) { form.hidden = true; say(DONE); return; }
        button.disabled = true;
        say("Sending\\u2026");
        fetch(${JSON.stringify(WAITLIST_ENDPOINT)}, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address, source: "bitbaum-hire" })
        })
          .then(function (res) {
            if (res.status === 429) throw new Error("rate");
            if (!res.ok) throw new Error("http");
            return res.json();
          })
          .then(function () { form.hidden = true; say(DONE); })
          .catch(function (err) {
            button.disabled = false;
            say(err && err.message === "rate"
              ? "That is a lot of tries at once \\u2014 give it a minute."
              : "That did not go through. Email ${email} and you are on the list just the same.", true);
          });
      });
    })();
  <\/script>`;
}

export function hirePage(all, cfg, hire, packages, origin) {
  const running = all.filter((v) => v.status === "live" && v.stage !== "next");
  const proven = (origin?.repos ?? []).filter((r) => r.provenSince).length;
  const pkgCount = (packages.packages ?? []).length;
  // A static site cannot hold a list, and a form that posts nowhere would be a
  // lie. One mailbox IS the list — the page says so, and says how to leave it.
  const join = (topic) =>
    `mailto:${hire.contact.email}?subject=${encodeURIComponent(topic ? `Waitlist — ${topic}` : "Waitlist")}` +
    `&body=${encodeURIComponent("What I'm building:\n\n\nRoughly when I need it:\n\n")}`;
  const mail = join();
  const body = `  <main>
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">${esc(hire.eyebrow)}</span>
        <h1 class="display-1">${esc(hire.title)}</h1>
        <p class="lede">${esc(hire.lede)}</p>
        <div class="actions">
          <a class="btn primary" href="#waitlist">${esc(hire.availability.cta)} ${ARROW}</a>
          <a class="btn secondary" href="#shipped">See what is running</a>
        </div>
        <p class="notice">${esc(hire.availability.line)}</p>
        <div class="hero-facts">
          <span><b>${running.length}</b> systems built and running</span>
          <span><b>${pkgCount}</b> packages published open source</span>
          <span><b>${proven}</b> repositories with proven origin</span>
          <span><b>0</b> manual steps between merge and deploy</span>
        </div>
        <p class="caption">Every number here is checkable: the systems are listed below with their addresses, the packages are on npm, and the origin proofs are <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">in a public register</a>.</p>
      </div>
    </section>

    <section class="section" id="engagements">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Three shapes of engagement</h2>
          <p class="lede">What the work looks like, so you can tell whether the list is worth joining. Rates are not published while it is closed — you get a scope and a fixed number with the reply.</p>
        </div>
        <div class="grid">
${hire.offers.map((o) => `          <article class="card text">
            <div class="card-body">
              <div class="card-top"><span class="card-name">${esc(o.name)}</span><span class="pill">${esc(o.shape)}</span></div>
              <span class="card-what">${esc(o.what)}</span>
              <div class="pkg-links"><a href="${join(o.name)}">Join for this &rarr;</a></div>
            </div>
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="shipped">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">${running.length} systems running right now</h2><a class="textlink" href="/#work">Everything, filterable &rarr;</a></div>
          <p class="lede">Not screenshots from finished engagements — running services you can open in a new tab, on infrastructure that is public.</p>
        </div>
        <div class="grid four">
${running.map((v) => card(v)).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="how">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">How I work</h2>
          <p class="lede">Four commitments that hold whether the engagement is two weeks or two years.</p>
        </div>
        <div class="grid two">
${hire.method.map((m) => `          <article class="card text">
            <div class="card-body">
              <span class="card-name">${esc(m.title)}</span>
              <span class="card-what">${esc(m.what)}</span>
            </div>
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="questions">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Questions people actually ask</h2>
        </div>
        <div class="qa">
${hire.faq.map((f) => `          <details>
            <summary>${esc(f.q)}</summary>
            <p>${esc(f.a)}</p>
          </details>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="waitlist">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">${esc(hire.availability.cta)}</h2>
          <p class="lede">${esc(hire.waitlist.lede)}</p>
        </div>
        <div class="grid">
${hire.waitlist.promises.map((w) => `          <article class="card text">
            <div class="card-body">
              <span class="card-name">${esc(w.title)}</span>
              <span class="card-what">${esc(w.what)}</span>
            </div>
          </article>`).join("\n")}
        </div>
        <form class="signup" id="waitlist-form" novalidate>
          <label class="sr-only" for="wl-email">Your email address</label>
          <input id="wl-email" name="email" type="email" autocomplete="email" placeholder="you@yourcompany.ch" required>
          <!-- A field no human sees. Anything in it came from a bot, which is
               told the same thing as everyone else and stored nowhere. -->
          <input class="hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn primary" type="submit">${esc(hire.availability.cta)} ${ARROW}</button>
        </form>
        <p class="form-status" id="wl-status" role="status"></p>
        <p class="caption">${esc(hire.contact.line)} You can skip the form and <a href="${mail}">write to ${esc(hire.contact.email)}</a> instead — same list, same person.</p>
      </div>
    </section>
  </main>`;
  return shell({
    title: "Hire the studio — bitbaum",
    description: `${hire.eyebrow}. ${hire.lede}`,
    path: "/hire/", body, nav: "/hire/", script: waitlistScript(hire.contact.email),
  });
}

// ── build ───────────────────────────────────────────────────────────────────
export function render({ map, packages, origin, cfg, hire }) {
  const all = ventures(map, cfg, origin, packages);
  const files = new Map();
  files.set("index.html", homePage(all, packages, cfg, origin));
  files.set("packages/index.html", packagesPage(packages, cfg, all));
  files.set("studio/index.html", studioPage(all, packages, origin));
  files.set("hire/index.html", hirePage(all, cfg, hire, packages, origin));
  for (const v of all) files.set(`${v.slug}/index.html`, venturePage(v, all, cfg, hire?.contact?.email));
  files.set("map.json", JSON.stringify(map, null, 2) + "\n");
  // Every page the build writes is in the sitemap, because the sitemap is
  // derived from the same map of files — a page cannot exist and be missing.
  const pages = [...files.keys()].filter((f) => f.endsWith("index.html")).map((f) => `${SITE}/${f.replace(/index\.html$/, "")}`).sort();
  files.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  files.set("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  return { all, files };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (args.has("--check")) args.add("--offline");
  const map = await fetchOrSnapshot(SOURCES.map);
  const packages = await fetchOrSnapshot(SOURCES.packages);
  const origin = await fetchOrSnapshot(SOURCES.origin);
  const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
  const hire = JSON.parse(readFileSync(join(here, "hire.json"), "utf8"));
  const { all, files } = render({ map, packages, origin, cfg, hire });

  // A shot the page references must exist: a broken image on a product page
  // is worse than no product page.
  for (const v of all) {
    if (v.shot && !existsSync(join(DIST, "shots", `${v.slug}.jpg`))) {
      console.error(`missing shot for ${v.slug} — run: node site/shots.mjs ${v.slug}`);
      process.exit(1);
    }
  }
  // The share card every non-venture page points at must exist, for the same
  // reason a screenshot must: a broken image is worse than none.
  if (!existsSync(join(DIST, "og", "studio.png"))) {
    console.error("missing share card dist/og/studio.png — run: node site/og.mjs");
    process.exit(1);
  }
  // A tag no chip offers is a card nobody can filter to.
  const known = new Set(cfg.tagOrder ?? []);
  for (const v of all) {
    for (const t of v.tags) {
      if (!known.has(t)) { console.error(`${v.slug}: tag "${t}" is not in tagOrder`); process.exit(1); }
    }
  }

  if (args.has("--check")) {
    let stale = 0;
    for (const [rel, html] of files) {
      const p = join(DIST, rel);
      if (!existsSync(p) || readFileSync(p, "utf8") !== html) { console.error(`stale: dist/${rel}`); stale++; }
    }
    if (readFileSync(join(here, "styles.css"), "utf8") !== (existsSync(join(DIST, "styles.css")) ? readFileSync(join(DIST, "styles.css"), "utf8") : "")) { console.error("stale: dist/styles.css"); stale++; }
    if (stale) { console.error(`site/dist is behind the sources — run: node site/build.mjs`); process.exit(1); }
    console.log(`site/dist is in sync (${files.size} pages)`);
  } else {
    for (const [rel, html] of files) {
      mkdirSync(dirname(join(DIST, rel)), { recursive: true });
      writeFileSync(join(DIST, rel), html);
    }
    // Pages for ventures that no longer exist must not linger.
    for (const d of readdirSync(DIST, { withFileTypes: true })) {
      if (d.isDirectory() && !["shots", "fonts", "packages", "studio", "hire", "og"].includes(d.name) && !all.some((v) => v.slug === d.name)) rmSync(join(DIST, d.name), { recursive: true });
    }
    cpSync(join(here, "styles.css"), join(DIST, "styles.css"));
    cpSync(join(here, "logo-mark.svg"), join(DIST, "logo-mark.svg"));
    cpSync(join(here, "fonts"), join(DIST, "fonts"), { recursive: true });
    console.log(`wrote site/dist: ${files.size} pages (${all.length} ventures, ${(packages.packages ?? []).length} packages), map ${map.generatedAt ?? "snapshot"}`);
    const orphans = all.filter((v) => v.uses.length === 0 && v.stage !== "next" && v.stage !== "concept").map((v) => v.slug);
    if (orphans.length) console.log(`  no shared packages recorded for: ${orphans.join(", ")}`);
  }
}
