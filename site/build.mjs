#!/usr/bin/env node
// bitbaum.orangecat.ch — the studio's front door, generated.
//
// What the site is FOR: bringing more people into the work. A visitor who has
// met Cato, found a repo, installed a package or read an article should be
// able to see what exists, find the part that concerns them, and take a
// concrete next step — install it, read its source, open a PR, or join the
// studio waitlist. So every page ends in an action, and every claim
// is something that can be checked: a live URL, a public repo, a screenshot a
// machine took, an adopter list derived from real manifests.
//
// What it is NOT: a list anyone types. Ventures come from the fleet map
// (Loki's register: what exists, where it runs, what state it is in), packages
// and their adopters from fleet's derived registry, origin dates from the
// proof register. This repo owns presentation only: overrides.json says the
// stage a venture is at, its field tags, its one line and its story.
//
// Pages: /  /work/  /<slug>/  /packages/  /studio/  — static HTML in site/dist/,
// served by Caddy's file_server with clean directory URLs.
//
//   node site/build.mjs            fetch the sources, write site/dist/
//   node site/build.mjs --require-fresh  fail if any source must fall back to a snapshot
//   node site/build.mjs --offline  build from the committed snapshots
//   node site/build.mjs --check    exit 1 if site/dist/ is stale
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { MARK_HEADER, MARK_FAVICON } from "./brand-mark.mjs";
import { createPackagePages } from "./packages-page.mjs";
import { publicMap } from "./public-map.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");
const args = new Set(process.argv.slice(2));
const packagesSha = process.env.FLEET_PACKAGES_SHA;
if (packagesSha && !/^[a-f0-9]{40}$/i.test(packagesSha)) {
  throw new Error("FLEET_PACKAGES_SHA must be a full 40-character Git commit SHA");
}
const packagesUrl = process.env.FLEET_PACKAGES_URL ?? (packagesSha
  ? `https://raw.githubusercontent.com/bitbaum/fleet/${packagesSha}/registers/packages.json`
  : "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json");

const SOURCES = {
  map: [process.env.FLEET_MAP_URL ?? "https://loki.orangecat.ch/api/fleet/map", "map.snapshot.json", "fleet map"],
  packages: [packagesUrl, "packages.snapshot.json", "package registry"],
  origin: [process.env.FLEET_ORIGIN_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json", "origin.snapshot.json", "origin register"],
  readings: [process.env.FLEET_READINGS_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/readings.json", "readings.snapshot.json", "fleet readings"],
};
const SITE = "https://bitbaum.orangecat.ch";
const GITHUB = "https://github.com/bitbaum";
const CONTRIBUTING = "https://github.com/bitbaum/.github/blob/main/CONTRIBUTING.md";
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
      if (args.has("--require-fresh")) throw new Error(`${what} answered ${res.status}; --require-fresh forbids publishing from a snapshot`);
      console.error(`${what} answered ${res.status}; using snapshot`);
    } catch (e) {
      if (args.has("--require-fresh")) throw new Error(`${what} could not be fetched; --require-fresh forbids publishing from a snapshot: ${e?.message ?? e}`);
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
const MARK = MARK_HEADER();
const ARROW = `<span class="arrow" aria-hidden="true">&rarr;</span>`;
const LOKI_FEEDBACK = JSON.parse(readFileSync(join(here, "loki-feedback.json"), "utf8"));
if (!/^https:\/\//.test(LOKI_FEEDBACK.origin) || !/^fcw_[a-f0-9]{32}$/.test(LOKI_FEEDBACK.token)) {
  throw new Error("site/loki-feedback.json must contain an HTTPS Loki origin and public widget token");
}
// Which widget modes this site asks for. Chat is opt-in per embed (Loki's
// widget/surface-modes.ts) and it is the one the homepage's Ask box opens.
if (!/^(report|chat|watch)(,(report|chat|watch))*$/.test(LOKI_FEEDBACK.modes ?? "")) {
  throw new Error("site/loki-feedback.json must list the widget modes, e.g. \"chat,report\"");
}

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
      homeLine: o.homeLine ?? null,
      story: o.story ?? "",
      stage: o.stage,
      tags: o.tags ?? [],
      pillar: o.pillar ?? null,
      pillarRole: o.pillarRole ?? null,
      stack: o.stack ?? null,
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
  // The stage order is owned by overrides.json alongside its labels, filters
  // and definitions. The pager follows the same sequence as the work grid.
  const stageRank = new Map(Object.keys(cfg.stages ?? {}).map((stage, index) => [stage, index]));
  return out.sort((a, b) => (stageRank.get(a.stage) ?? Number.MAX_SAFE_INTEGER) - (stageRank.get(b.stage) ?? Number.MAX_SAFE_INTEGER) || a.order - b.order || a.name.localeCompare(b.name));
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
  if (v.stage === "development") return `<span class="pill">in development</span>`;
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
    ["/work/", "The work"],
    ["/packages/", "Packages"],
    ["/studio/", "Studio"],
    ["/#join", "Build with us"],
    ["/hire/", "Hire"],
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "bitbaum",
    url: SITE,
    address: { "@type": "PostalAddress", addressLocality: "Zürich", addressCountry: "CH" },
    sameAs: [GITHUB],
  });
  return `<!doctype html>
<html lang="en">
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
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<script type="application/ld+json">${jsonLd}<\/script>
<script>
  // Tiny FOUC guard only — theme UI lives in /theme.mjs.
  (function () {
    try {
      var saved = localStorage.getItem("theme") || "system";
      var dark = saved === "dark" || (saved === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = saved;
    } catch (e) {
      document.documentElement.classList.toggle("dark", matchMedia("(prefers-color-scheme: dark)").matches);
    }
  })();
<\/script>
<link rel="icon" href="/logo-mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/tokens.css">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="top">
    <div class="wrap">
      <a class="mark" href="/">${MARK}bitbaum</a>
      <nav aria-label="Site">
${items.map(([href, t]) => `        <a href="${href}"${nav === href ? ' aria-current="page"' : ""}>${t}</a>`).join("\n")}
        <a href="${GITHUB}" rel="noopener">GitHub &#8599;</a>
      </nav>
      <div class="theme" role="group" aria-label="Colour theme">
        <button type="button" data-set-theme="light" title="Light" aria-label="Light">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>
        </button>
        <button type="button" data-set-theme="system" title="Match system" aria-label="Match system">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.8" y="4.4" width="18.4" height="12.6" rx="1.6"/><path d="M8.6 20.4h6.8"/></svg>
        </button>
        <button type="button" data-set-theme="dark" title="Dark" aria-label="Dark">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8z"/></svg>
        </button>
      </div>
      <a class="btn secondary cta" href="${HIRE}#waitlist">Join the waitlist ${ARROW}</a>
    </div>
  </header>
${body}
  <footer>
    <div class="wrap">
      <div class="foot-cols">
        <div class="foot-brand">
          <a class="mark" href="/">${MARK}bitbaum</a>
          <p>AI-native products on infrastructure that is open by construction. Built in Zürich.</p>
        </div>
        <nav aria-label="The work">
          <h2 class="label">The work</h2>
          <a href="/work/">All work and stages</a>
          <a href="/packages/">Packages</a>
          <a href="/studio/">The studio</a>
          <a href="/map.json">map.json</a>
        </nav>
        <nav aria-label="Build with us">
          <h2 class="label">Build with us</h2>
          <a href="${GITHUB}" rel="noopener">GitHub</a>
          <a href="${CONTRIBUTING}">Contributing</a>
          <a href="/#join">How to join</a>
          <a href="${ARTICLES}">Writing</a>
        </nav>
        <nav aria-label="Work together">
          <h2 class="label">Work together</h2>
          <a href="${HIRE}">Engagements and rates</a>
          <a href="${HIRE}#waitlist">Join the waitlist</a>
        </nav>
      </div>
      <p class="foot-note">bitbaum is built in Zürich, in the open. Nothing here is registered as a company; an orangecat.ch name is an address on one server.</p>
    </div>
  </footer>
  <script type="module" src="/theme.mjs"><\/script>
${script ?? ""}
  <script src="${esc(LOKI_FEEDBACK.origin)}/widget.js" data-fc-project="${esc(LOKI_FEEDBACK.token)}" data-fc-modes="${esc(LOKI_FEEDBACK.modes)}" async><\/script>
</body>
</html>
`;
}

// ── cards ───────────────────────────────────────────────────────────────────
function card(v, filterable = false) {
  const img = v.shot
    ? `        <div class="shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"></div>\n`
    : "";
  const sub = v.for ? `<span class="label">for ${esc(v.for)}</span>` : "";
  const meta = filterable ? `data-stage="${esc(v.stage)}" data-tags="${esc(v.tags.map(slugify).join(" "))}" data-name="${esc(v.name)}" data-host="${esc(host(v.url ?? ""))}" data-since="${esc(v.since ?? "")}"` : "";
  return `      <a class="card${v.shot ? "" : " text"}" href="/${esc(v.slug)}/"${meta ? ` ${meta}` : ""}>
${img}        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span>${pill(v)}</div>
          <span class="card-what">${esc(v.what)}</span>${sub ? `\n          ${sub}` : ""}
        </div>
      </a>`;
}

const { pkgCard, packagesPage, packagePage, shownPackages } = createPackagePages({ esc, shell });

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
        <div class="filters" id="work-filters" hidden>
          <div class="filter-row"><span class="label">Stage</span><div class="chips">
${stages.map(([k, s]) => `            ${chip("stage", k, s.plural, all.filter((v) => v.stage === k).length)}`).join("\n")}
          </div></div>
          <div class="filter-row"><span class="label">Field</span><div class="chips">
${tags.map((t) => `            ${chip("field", slugify(t), t, all.filter((v) => v.tags.includes(t)).length)}`).join("\n")}
          </div></div>
          <label class="filter-search">Search work<input id="work-search" type="search" placeholder="Product, purpose, or address" autocomplete="off"></label>
          <label class="filter-sort">Sort by<select id="work-sort"><option value="studio">Studio order</option><option value="name">Name</option><option value="newest">Newest</option></select></label>
          <button type="button" class="clear" id="clear-filters" hidden>Clear ${ARROW}</button>
        </div>
        <dl class="legend">
${stages.map(([, s]) => `          <div><dt>${esc(s.plural)}</dt><dd>${esc(s.lede)}</dd></div>`).join("\n")}
        </dl>
        <div class="grid" id="work-grid">
${all.map((v) => card(v, true)).join("\n")}
        </div>
        <p class="empty" id="work-empty" hidden>Nothing at that intersection yet. <button type="button" class="linkish" data-clear>Clear the filter</button> to see everything.</p>
      </div>
    </section>`;
}

const FILTER_SCRIPT = `  <script type="module" src="/work-filter.mjs"></script>`;
const ASK_SCRIPT = `  <script type="module" src="/ask.mjs"></script>`;

// ── pages ───────────────────────────────────────────────────────────────────
export function homePage(all, packages, cfg, origin, readings, hire) {
  const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
  const alias = cfg.adopterAliases ?? {};
  const packageBySlug = new Map((packages.packages ?? []).map((p) => [p.slug, p]));
  const pkgCount = (packages.packages ?? []).length;
  const home = cfg.home ?? {};
  const flagshipSlugs = home.flagshipProjects ?? [];
  const packageSlugs = home.featuredPackages ?? [];
  const unique = (items) => items.length > 0 && new Set(items).size === items.length;
  if (!unique(flagshipSlugs) || flagshipSlugs.some((slug) => !ventureBySlug.has(slug))) {
    throw new Error("home.flagshipProjects must name distinct projects in the fleet map");
  }
  if (!unique(packageSlugs) || packageSlugs.some((slug) => !packageBySlug.has(slug))) {
    throw new Error("home.featuredPackages must name distinct packages in Fleet's package registry");
  }
  const flagships = flagshipSlugs.map((slug) => ventureBySlug.get(slug));
  const featuredPackages = packageSlugs.map((slug) => packageBySlug.get(slug));
  const stageLinks = Object.entries(cfg.stages ?? {})
    .filter(([stage]) => all.some((v) => v.stage === stage))
    .map(([stage, definition]) => {
      const count = all.filter((v) => v.stage === stage).length;
      return `<a class="stage-link" href="/work/#work?stage=${encodeURIComponent(stage)}"><span class="stage-count">${count}</span><span>${esc(definition.plural)}</span></a>`;
    }).join("\n");
  const pkgCards = featuredPackages.map((p) => pkgCard(
    p,
    cfg.packages?.[p.slug],
    ventureBySlug,
    alias,
    cfg.packageGroups?.find((g) => g.id === cfg.packages?.[p.slug]?.group),
  )).join("\n");
  const stackCards = flagships.map((v) => {
    if (!v.pillar || !v.homeLine) throw new Error(`home flagship ${v.slug} needs a pillar and concise homeLine`);
    return `        <a class="home-stack-item" href="#stack-${esc(v.slug)}" data-stack-project="${esc(v.slug)}">
          ${v.shot ? `<span class="home-stack-shot"><img src="/shots/${esc(v.slug)}.jpg" alt="" loading="lazy" width="1280" height="800"></span>` : ""}
          <span class="home-stack-copy">
            <span class="home-stack-top"><span class="home-stack-layer">${esc(v.pillar)}</span>${pill(v)}</span>
            <span class="home-stack-name">${esc(v.name)}</span>
            <span class="home-stack-line">${esc(v.homeLine)}</span>
          </span>
          <span class="home-stack-arrow" aria-hidden="true">&rarr;</span>
        </a>`;
  }).join("\n");
  // The hero card names each layer; this section says what it is FOR. One line
  // each was accurate and undersold all three — a visitor could not tell that
  // Loki builds every product here, or what OrangeCat changes for a person.
  // The copy is editorial (overrides.json `stack`) and required, not defaulted:
  // a flagship with nothing to say fails the build instead of rendering an
  // empty panel.
  const stackLayers = flagships.map((v, i) => {
    const s = v.stack;
    if (!s?.headline || !s.promise || !s.connects || !(s.does?.length >= 3)) {
      throw new Error(`home flagship ${v.slug} needs stack.headline, promise, connects and at least three stack.does lines`);
    }
    const open = v.url ? `<a class="btn primary" href="${esc(v.url)}">Open ${esc(host(v.url))} ${ARROW}</a>` : "";
    return `        <article class="stack-layer${i % 2 ? " flip" : ""}" id="stack-${esc(v.slug)}">
          <div class="stack-layer-copy">
            <div class="stack-layer-top"><span class="stack-layer-n">0${i + 1}</span><span class="home-stack-layer">${esc(v.pillar)}</span>${pill(v)}</div>
            <h3 class="stack-layer-name">${esc(v.name)}</h3>
            <p class="stack-layer-headline">${esc(s.headline)}</p>
            <p class="stack-layer-promise">${esc(s.promise)}</p>
            <ul class="stack-layer-does">
${s.does.map((d) => `              <li>${esc(d)}</li>`).join("\n")}
            </ul>
            <p class="stack-layer-connects"><span class="label">In the stack</span> ${esc(s.connects)}</p>
            <div class="actions">${open}<a class="btn secondary" href="/${esc(v.slug)}/">About ${esc(v.name)}</a></div>
          </div>
          ${v.shot ? `<a class="stack-layer-shot" href="/${esc(v.slug)}/" tabindex="-1" aria-hidden="true"><img src="/shots/${esc(v.slug)}.jpg" alt="" loading="lazy" width="1280" height="800"></a>` : ""}
        </article>`;
  }).join("\n");
  const stackIntro = home.stack ?? {};
  // The front desk. The question is answered by Loki's widget in Chat mode
  // (the Cat and Loki, from the public fleet map) — this page only hands it
  // over (site/ask.mjs). When the widget cannot answer, the box says so and
  // offers the catalogue; without JavaScript the form opens the catalogue.
  const ask = home.ask;
  if (!ask?.headline || !ask.lede || !(ask.starters?.length >= 2)) {
    throw new Error("home.ask needs a headline, a lede and at least two starters");
  }
  const askSection = `    <section class="section ask-section" id="ask">
      <div class="wrap ask">
        <div class="ask-copy">
          <span class="eyebrow">${esc(ask.eyebrow ?? "Ask")}</span>
          <h2 class="display-2">${esc(ask.headline)}</h2>
          <p class="lede">${esc(ask.lede)}</p>
        </div>
        <form class="ask-form" id="ask-form" action="/work/" method="get">
          <label class="sr-only" for="ask-q">Ask the chat about any project</label>
          <div class="ask-row">
            <input id="ask-q" type="text" maxlength="1000" autocomplete="off" placeholder="${esc(ask.placeholder ?? "")}">
            <button class="btn primary" type="submit">Ask ${ARROW}</button>
          </div>
          <div class="ask-starters">
${ask.starters.map((q) => `            <button type="button" class="ask-starter" data-q="${esc(q)}">${esc(q)}</button>`).join("\n")}
          </div>
          <p class="ask-status" id="ask-status" role="status" hidden>The assistant isn't reachable right now. <a class="textlink" href="/work/">Browse every project ${ARROW}</a> or <a class="textlink" href="${HIRE}#waitlist">join the waitlist</a>.</p>
          <p class="ask-note">Answered by AI from the public project catalogue — it can be wrong, and the links it gives are the catalogue's own.</p>
        </form>
      </div>
    </section>`;
  const body = `  <main id="main" class="home-page">
    <section class="hero home-hero">
      <div class="wrap">
        <div class="home-intro">
          <span class="eyebrow">AI-native product studio &middot; Zürich</span>
          <h1 class="display-1">One trunk. Many products.</h1>
          <p class="home-lede">Tools for agent-led work, economic participation and shared governance.</p>
          <div class="actions" id="join">
            <a class="btn primary" href="https://loki.orangecat.ch/">Start with Loki ${ARROW}</a>
            <a class="btn secondary" href="${HIRE}#waitlist">Join the waitlist ${ARROW}</a>
          </div>
          <p class="home-capacity">${esc(hire?.availability?.shortLine ?? hire?.availability?.line ?? "Studio availability is listed on the hire page.")}</p>
        </div>
        <aside class="home-stack" id="stack" aria-label="The Bitbaum stack">
          <div class="home-stack-heading"><span class="label">The stack</span><span>${flagships.length} connected layers</span></div>
${stackCards}
        </aside>
      </div>
    </section>

${askSection}

    <section class="section stack-section" id="the-stack">
      <div class="wrap">
        <div class="section-head">
          <div class="stack-head"><span class="eyebrow">${esc(stackIntro.eyebrow ?? "The stack")}</span><h2 class="display-2">${esc(stackIntro.headline ?? "")}</h2></div>
          ${stackIntro.lede ? `<p class="lede">${esc(stackIntro.lede)}</p>` : ""}
        </div>
${stackLayers}
      </div>
    </section>

    <section class="section" id="packages">
      <div class="wrap">
        <div class="home-section-head">
          <div><span class="eyebrow quiet">Shared code</span><h2 class="display-2">Packages</h2></div>
          <a class="textlink" href="/packages/">Explore all ${pkgCount} packages ${ARROW}</a>
        </div>
        <p class="home-section-note">Small tools for common jobs; each profile shows its source, version and verified adopters.</p>
        <div class="grid home-package-grid">${pkgCards}</div>
      </div>
    </section>

    <section class="section" id="work-preview">
      <div class="wrap">
        <div class="home-section-head">
          <div><span class="eyebrow quiet">Beyond the stack</span><h2 class="display-2">Other work</h2></div>
          <a class="textlink" href="/work/">Browse all ${all.length} projects ${ARROW}</a>
        </div>
        <p class="home-section-note">Each project is labelled by its actual stage. Select a stage to explore.</p>
        <div class="stage-links">${stageLinks}</div>
      </div>
    </section>
  </main>`;
  return shell({
    title: "bitbaum — one trunk, many products",
    description: "An AI-native product studio building tools for agent-led work, economic participation and shared governance. Explore Loki, OrangeCat and Solon.",
    path: "/", body, nav: "/", script: ASK_SCRIPT,
  });
}

export function workPage(all, cfg) {
  const body = `  <main id="main">
    <section class="hero compact"><div class="wrap">
      <span class="eyebrow">Projects and pilots</span>
      <h1 class="display-1">The work, at its actual stage.</h1>
      <p class="lede">Running services, real pilots, work in development, concepts, and named projects that are not built are labelled separately. Filter by stage and field; every count and result comes from this catalogue.</p>
    </div></section>
${workSection(all, cfg)}
  </main>`;
  return shell({
    title: "The work — bitbaum",
    description: "Browse Bitbaum projects by readiness stage and field, from running beta products to concepts and projects not yet built.",
    path: "/work/", body, nav: "/work/", script: FILTER_SCRIPT,
  });
}

/**
 * A venture's profiles on the other two pillars, as anchors.
 *
 * Named rather than inlined because the flagship list counts them and the venture
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
    v.tags.length ? ["Field", v.tags.map((t) => `<a href="/work/#work?field=${esc(slugify(t))}">${esc(t)}</a>`).join(", ")] : null,
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
    ? `        <div class="uses"><span class="label">Built from</span><div class="chips">${v.uses.map((s) => `<a href="/packages/${esc(s)}/">${esc(s)}</a>`).join("")}</div></div>`
    : "";
  const body = `  <main id="main">
    <section class="venture-hero">
      <div class="wrap">
        <span class="eyebrow${v.status === "live" ? "" : " quiet"}">${esc(stage?.title ?? v.stage)}${v.pillar ? ` &middot; ${esc(v.pillar)}` : ""}${v.for ? ` &middot; for ${esc(v.for)}` : ""}</span>
        <h1 class="display-1">${esc(v.name)}</h1>
        <p class="lede">${esc(v.what)}</p>
        <div class="actions">
          ${v.url ? `<a class="btn primary" href="${esc(v.url)}">Open ${esc(host(v.url))} ${ARROW}</a>` : ""}
          ${v.repo ? `<a class="btn secondary" href="${esc(v.repo)}">Source</a>` : ""}
          ${contact ? `<a class="btn secondary" href="#ask">Ask about ${esc(v.name)}</a>` : ""}
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
${contact ? `    <section class="section" id="ask">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Ask about ${esc(v.name)}</h2>
          <p class="lede">Whether you are evaluating it, want it for your organisation, or want to know how it was built — this reaches a person, and the reply comes from one.</p>
        </div>
${requestForm({
  id: `ask-${v.slug}`,
  cta: "Send",
  fields: [
    { name: "name", label: "Your name", kind: "text", autocomplete: "name", required: true },
    { name: "email", label: "Email", kind: "email", autocomplete: "email", required: true },
    { name: "org", label: "Company or organisation", kind: "text", autocomplete: "organization" },
    { name: "what", label: `What you want to know about ${esc(v.name)}`, kind: "textarea", required: true },
  ],
})}
      </div>
    </section>` : ""}
    <div class="wrap"><div class="pager"><a href="/${esc(prev.slug)}/">&larr; ${esc(prev.name)}</a><a href="/work/#work?stage=${encodeURIComponent(v.stage)}">All ${esc((stage?.plural ?? "").toLowerCase())}</a><a href="/${esc(next.slug)}/">${esc(next.name)} &rarr;</a></div></div>
  </main>`;
  return shell({ title: `${v.name} — ${v.what}`, description: v.story || v.what, path: `/${v.slug}/`, body, image: v.shot ? `/shots/${v.slug}.jpg` : undefined, script: contact ? requestScript() : undefined });
}

export function studioPage(all, packages, origin, readings) {
  const pkgCount = (packages.packages ?? []).length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  const reading = readings?.current;
  const body = `  <main id="main">
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">The studio</span>
        <h1 class="display-1">Bit, and Baum.</h1>
        <p class="lede">Bit for software. Baum, German for tree, for the shape: many branches from one trunk. The trunk is what lets a small group ship like a large one — and what lets the next person start in the middle rather than at the beginning.</p>
        <div class="actions">
          <a class="btn primary" href="/#join">Build with us ${ARROW}</a>
          <a class="btn secondary" href="/work/">See the work</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap"><div class="prose">
        <h2>What bitbaum is</h2>
        <p>Bitbaum is a product studio building AI-native software. OrangeCat and Loki are public beta products. Other projects are labelled on the <a href="/work/">work catalogue</a> by what can be verified: pilot, in development, concept, or not built.</p>
        <h2>Why the stack is what it is</h2>
        <p><a href="/orangecat/">OrangeCat</a> is the economic product, with payment links and Bitcoin settlement. <a href="/loki/">Loki</a> is the engineering control plane for dispatching work to agents, following sessions and reviewing changes. <a href="/solon/">Solon is still in development</a>; it is not presented as ready for an organisation to depend on.</p>
        <h2>How the work gets done</h2>
        <p>The studio publishes ${pkgCount} MIT-licensed packages for specific jobs: model routing, email, content, forms, rate limits, lists, threads and more. They are not all used by every product. Each <a href="/packages/">package profile</a> links to its source, current version and apps that list it as a dependency. Agents can do implementation work in Loki; people set the goals, review changes and remain responsible for what ships.</p>
        <h2>What is true</h2>
        <p>The project list and package adopters come from public registers; stage descriptions and short summaries are editorial and are kept here for review. The work catalogue distinguishes projects built for real organisations from demos and things that are not built.</p>
        <h2>Open by construction</h2>
        <p>The shared packages are MIT-licensed. Work built for someone else stays theirs. Contributor terms live in <a href="${CONTRIBUTING}">bitbaum/.github</a>. The <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">origin register</a> tracks <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">${origin?.repos?.length ?? 0} repositories</a>, of which <a href="https://archive.softwareheritage.org/">${origin?.repos?.filter((r) => r.swh?.snapshot).length ?? 0} have a Software Heritage snapshot</a>${block ? `; the <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">earliest recorded proof is anchored at Bitcoin block ${block}</a>` : ""}.</p>
        <h2>Numbers, in the open</h2>
        <p>Fleet's <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">${esc(reading?.date ?? "latest")} readings</a> report <a href="https://github.com/bitbaum">${Number(reading?.stars ?? 0)} GitHub stars</a> and <a href="https://www.npmjs.com/org/bitbaum">${Number(reading?.downloads?.lastMonth ?? 0).toLocaleString("en-US")} package downloads over 30 days</a> (including our own CI installs). The same dated register reports <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">CHF ${Number(reading?.clients?.mrrChf ?? 0).toLocaleString("en-US")} monthly client revenue</a>. These are readings, not forecasts; the source and date are linked.</p>
        <h2>Work with the studio</h2>
        <p>Fractional CTO and contract engineering, Zürich. Rates, scope and the waitlist are on the <a href="${HIRE}">hire page</a>. The code is on <a href="${GITHUB}">GitHub</a>.</p>
      </div></div>
    </section>
  </main>`;
  return shell({ title: "The studio — bitbaum", description: "What Bitbaum builds, how its projects differ in readiness, and where the public numbers come from.", path: "/studio/", body, nav: "/studio/" });
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
// Requests go to Loki's feedback inbox — the one inbound surface in the fleet
// that is cross-origin safe, rate-limited, deduped, notified AND triaged in a
// real UI (/feedback). The token is public ON PURPOSE (widget_tokens schema).
const REQUEST_ENDPOINT = "https://loki.orangecat.ch/api/feedback";

/** A field. `kind` is text | email | textarea | select. */
const field = (f) => {
  const id = `f-${f.form}-${f.name}`;
  const label = `<label for="${id}">${esc(f.label)}${f.required ? "" : ` <span class="opt">optional</span>`}</label>`;
  const req = f.required ? " required" : "";
  if (f.kind === "textarea")
    return `<p class="field wide">${label}<textarea id="${id}" name="${esc(f.name)}" rows="4" placeholder="${esc(f.placeholder ?? "")}"${req}></textarea></p>`;
  if (f.kind === "select")
    return `<p class="field">${label}<select id="${id}" name="${esc(f.name)}"${req}>${f.options
      .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
      .join("")}</select></p>`;
  return `<p class="field"><label for="${id}">${esc(f.label)}${f.required ? "" : ` <span class="opt">optional</span>`}</label><input id="${id}" type="${f.kind}" name="${esc(f.name)}" autocomplete="${esc(f.autocomplete ?? "on")}" placeholder="${esc(f.placeholder ?? "")}"${req}></p>`;
};

/** The intake form. Every door on this site is one of these. */
function requestForm({ id, fields, cta, note }) {
  return `        <form class="signup js-request" id="form-${esc(id)}" data-form="${esc(id)}" data-endpoint="${esc(REQUEST_ENDPOINT)}" novalidate>
${fields.map((f) => `          ${field({ ...f, form: id })}`).join("\n")}
          <div class="hp" aria-hidden="true">
            <label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <p class="field wide submit"><button class="btn primary" type="submit">${esc(cta)} ${ARROW}</button></p>
        </form>
        <p class="form-status" role="status"></p>
${note ? `        <p class="caption">${note}</p>` : ""}`;
}

function requestScript() {
  return `  <script type="module" src="/request.mjs" data-endpoint="${esc(LOKI_FEEDBACK.origin)}/api/feedback" data-token="${esc(LOKI_FEEDBACK.token)}"><\/script>`;
}

const slug = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function hirePage(all, cfg, hire, packages, origin) {
  const running = all.filter((v) => v.status === "live" && v.stage !== "next");
  const proven = (origin?.repos ?? []).filter((r) => r.provenSince).length;
  const pkgCount = (packages.packages ?? []).length;
  const body = `  <main id="main">
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
          <a href="#shipped"><b>${running.length}</b> systems built and running</a>
          <a href="/packages/"><b>${pkgCount}</b> packages published open source</a>
          <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json"><b>${proven}</b> repositories with proven origin</a>
        </div>
        <p class="caption">Every number here is checkable: the systems are listed below with their addresses, the packages are on npm, and the origin proofs are <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">in a public register</a>.</p>
      </div>
    </section>

    <section class="section" id="engagements">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Engagements and rates</h2>
          <p class="lede">Published rather than quoted on request, so you can qualify yourself before writing a single email. Fixed-scope work is confirmed in writing before it starts.</p>
        </div>
        <div class="grid">
${hire.offers.map((o) => `          <a class="card text" href="#waitlist" data-engagement="${esc(o.name)}">
            <div class="card-body">
              <div class="card-top"><span class="card-name">${esc(o.name)}</span><span class="pill">${esc(o.shape)}</span></div>
              <span class="price">${esc(o.price)}${o.unit ? `<span class="price-unit">${esc(o.unit)}</span>` : ""}</span>
              <span class="card-what">${esc(o.what)}</span>
              <div class="pkg-links"><span>Request this &rarr;</span></div>
            </div>
          </a>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="shipped">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">${running.length} systems running right now</h2><a class="textlink" href="/work/">Everything, filterable &rarr;</a></div>
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
          <h2 class="display-2">How we work</h2>
          <p class="lede">Four commitments that hold whether the engagement is two weeks or two years.</p>
        </div>
        <div class="grid two">
${hire.method.map((m) => `          <div class="method">
              <span class="card-name">${esc(m.title)}</span>
              <span class="card-what">${esc(m.what)}</span>
          </div>`).join("\n")}
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
${requestForm({
  id: "waitlist",
  cta: hire.availability.cta,
  note: esc(hire.contact.line),
  fields: [
    { name: "name", label: "Your name", kind: "text", autocomplete: "name", required: true },
    { name: "email", label: "Email", kind: "email", autocomplete: "email", placeholder: "you@yourcompany.ch", required: true },
    { name: "org", label: "Company or organisation", kind: "text", autocomplete: "organization" },
    { name: "engagement", label: "Which engagement", kind: "select", options: ["Not sure yet", ...hire.offers.map((o) => o.name)] },
    { name: "timeline", label: "When you need it", kind: "select", options: ["Not urgent", "This quarter", "Next quarter", "As soon as there is capacity"] },
    { name: "what", label: "What you are building, and what is in the way", kind: "textarea", placeholder: "A sentence or two is plenty.", required: true },
  ],
})}
      </div>
    </section>
  </main>`;
  return shell({
    title: "Hire the studio — bitbaum",
    description: `${hire.eyebrow}. ${hire.lede}`,
    path: "/hire/", body, nav: "/hire/", script: requestScript(),
  });
}

// ── build ───────────────────────────────────────────────────────────────────
export function render({ map, packages, origin, readings, cfg, hire }) {
  const all = ventures(map, cfg, origin, packages);
  const files = new Map();
  files.set("index.html", homePage(all, packages, cfg, origin, readings, hire));
  files.set("work/index.html", workPage(all, cfg));
  files.set("packages/index.html", packagesPage(packages, cfg, all));
  files.set("packages-filter.mjs", readFileSync(join(here, "packages-filter.mjs"), "utf8"));
  files.set("work-filter.mjs", readFileSync(join(here, "work-filter.mjs"), "utf8"));
  files.set("ask.mjs", readFileSync(join(here, "ask.mjs"), "utf8"));
  const listkitDist = join(here, "..", "node_modules", "listkit", "dist");
  if (!existsSync(join(listkitDist, "index.js"))) throw new Error("missing listkit browser modules — run: pnpm install");
  files.set("vendor/listkit/LICENSE", readFileSync(join(here, "..", "node_modules", "listkit", "LICENSE"), "utf8"));
  for (const name of readdirSync(listkitDist).filter((name) => name.endsWith(".js"))) {
    files.set(`vendor/listkit/${name}`, readFileSync(join(listkitDist, name), "utf8"));
  }
  const shown = shownPackages(packages, cfg);
  for (const p of shown) files.set(`packages/${p.slug}/index.html`, packagePage(p, cfg, all, shown));
  files.set("studio/index.html", studioPage(all, packages, origin, readings));
  files.set("hire/index.html", hirePage(all, cfg, hire, packages, origin));
  for (const v of all) files.set(`${v.slug}/index.html`, venturePage(v, all, cfg, hire?.contact?.email));
  files.set("map.json", JSON.stringify(publicMap(map), null, 2) + "\n");
  // Every page the build writes is in the sitemap, because the sitemap is
  // derived from the same map of files — a page cannot exist and be missing.
  const pages = [...files.keys()].filter((f) => f.endsWith("index.html")).map((f) => `${SITE}/${f.replace(/index\.html$/, "")}`).sort();
  files.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  files.set("robots.txt", `User-agent: *\nAllow: /\nDisallow: /map.json\n\nSitemap: ${SITE}/sitemap.xml\n`);
  files.set("theme.mjs", readFileSync(join(here, "theme.mjs"), "utf8"));
  files.set("request.mjs", readFileSync(join(here, "request.mjs"), "utf8"));
  return { all, files };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (args.has("--check")) args.add("--offline");
  const map = await fetchOrSnapshot(SOURCES.map);
  const packages = await fetchOrSnapshot(SOURCES.packages);
  const origin = await fetchOrSnapshot(SOURCES.origin);
  const readings = await fetchOrSnapshot(SOURCES.readings);
  const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
  const hire = JSON.parse(readFileSync(join(here, "hire.json"), "utf8"));
  const { all, files } = render({ map, packages, origin, readings, cfg, hire });
  const pageCount = [...files.keys()].filter((file) => file.endsWith("index.html")).length;

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
    {
      const src = join(here, "..", "node_modules", "@bitbaum", "design-tokens", "tokens.css");
      const want = existsSync(src) ? readFileSync(src, "utf8").replace(/url\(\.\/fonts\//g, "url(/fonts/") : "";
      const have = existsSync(join(DIST, "tokens.css")) ? readFileSync(join(DIST, "tokens.css"), "utf8") : "";
      if (want !== have) { console.error("stale: dist/tokens.css — the design tokens moved"); stale++; }
    }
    if (stale) { console.error(`site/dist is behind the sources — run: node site/build.mjs`); process.exit(1); }
    console.log(`site/dist is in sync (${pageCount} pages, ${files.size} generated files)`);
  } else {
    for (const [rel, html] of files) {
      mkdirSync(dirname(join(DIST, rel)), { recursive: true });
      writeFileSync(join(DIST, rel), html);
    }
    // Pages for ventures that no longer exist must not linger.
    for (const d of readdirSync(DIST, { withFileTypes: true })) {
      if (d.isDirectory() && !["shots", "fonts", "packages", "work", "studio", "hire", "og", "vendor"].includes(d.name) && !all.some((v) => v.slug === d.name)) rmSync(join(DIST, d.name), { recursive: true });
    }
    cpSync(join(here, "styles.css"), join(DIST, "styles.css"));
    // Same rule, fewer generations — a favicon that cannot drift from the logo.
    writeFileSync(join(DIST, "logo-mark.svg"), MARK_FAVICON() + "\n");
    cpSync(join(here, "fonts"), join(DIST, "fonts"), { recursive: true });
    // @bitbaum/design-tokens — the same SSOT OrangeCat, Loki and Solon consume.
    const tokensDir = join(here, "..", "node_modules", "@bitbaum", "design-tokens");
    if (!existsSync(join(tokensDir, "tokens.css"))) {
      console.error("missing @bitbaum/design-tokens — run: pnpm install");
      process.exit(1);
    }
    // The package's tokens.css asks for ./fonts/*; dist serves it from the root,
    // so the URLs are rewritten once here rather than duplicating the faces.
    writeFileSync(
      join(DIST, "tokens.css"),
      readFileSync(join(tokensDir, "tokens.css"), "utf8").replace(/url\(\.\/fonts\//g, "url(/fonts/"),
    );
    cpSync(join(tokensDir, "fonts"), join(DIST, "fonts"), { recursive: true });
    console.log(`wrote site/dist: ${pageCount} pages (${all.length} ventures, ${(packages.packages ?? []).length} packages), map ${map.generatedAt ?? "snapshot"}`);
    const orphans = all.filter((v) => v.uses.length === 0 && v.stage !== "next" && v.stage !== "concept").map((v) => v.slug);
    if (orphans.length) console.log(`  no shared packages recorded for: ${orphans.join(", ")}`);
  }
}
