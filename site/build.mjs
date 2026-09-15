#!/usr/bin/env node
// bitbaum.orangecat.ch — the studio's front door, generated.
//
// What the site is FOR: a visitor who has met Cato, found a repo, or read an
// article wants to know what this studio is, what it has built, and whether
// any of it is real. So every page answers with things that can be checked —
// a live URL, a public repo, a screenshot taken by a machine — and never with
// a claim. There are no clients on this site because there are none.
//
// What it is NOT: a list anyone types. Ventures come from the fleet map
// (Loki's register: what exists, where it runs, what state it is in) and
// packages from fleet's derived registry. This repo owns presentation only:
// overrides.json says the group a venture belongs to, its one line, and the
// two sentences on its own page.
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
const HIRE = "https://bitbaum.github.io/hire/";
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
const MARK = `<svg viewBox="110 76 180 202" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d="M 200,120 C 195,93 173,87 152,99 C 128,114 128,126 152,141 C 173,153 195,147 200,120 C 205,93 227,87 248,99 C 272,114 272,126 248,141 C 227,153 205,147 200,120"/><path fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d="M 200,232 C 195,205 173,199 152,211 C 128,226 128,238 152,253 C 173,265 195,259 200,232 C 205,205 227,199 248,211 C 272,226 272,238 248,253 C 227,265 205,259 200,232"/></svg>`;
const ARROW = `<span class="arrow" aria-hidden="true">&rarr;</span>`;

// ── the ventures: register facts + presentation ────────────────────────────
export function ventures(map, cfg, origin) {
  const byRepo = new Map((origin?.repos ?? []).map((r) => [r.repo.split("/")[1], r]));
  const out = [];
  const seen = new Set();
  for (const p of map.projects ?? []) {
    const o = cfg.overrides?.[p.slug];
    if (!o?.what || !o.group) continue;
    seen.add(p.slug);
    const repoName = p.urls?.repo ? p.urls.repo.split("/").pop() : null;
    const org = repoName ? byRepo.get(repoName) : null;
    out.push({
      slug: p.slug,
      name: o.name ?? p.name ?? p.slug,
      what: o.what,
      story: o.story ?? "",
      group: o.group,
      pillar: o.pillar ?? null,
      for: o.for ?? null,
      order: o.order ?? 99,
      status: p.status ?? "",
      url: o.url ?? p.urls?.live ?? null,
      repo: p.urls?.repo ?? null,
      since: org?.firstCommit?.date ?? p.since ?? null,
      shot: o.shot !== false && Boolean(o.url ?? p.urls?.live),
    });
  }
  for (const x of cfg.extras ?? []) {
    if (seen.has(x.slug) || !x.what || !x.group) continue;
    out.push({ ...x, story: x.story ?? "", pillar: null, for: x.for ?? null, order: x.order ?? 99, status: x.url ? "live" : "", url: x.url ?? null, repo: x.repo ?? null, since: null, shot: x.shot !== false && Boolean(x.url) });
  }
  // Home order is group order, then a venture's own order: the pager on a
  // venture page walks the same sequence a visitor scrolled.
  const rank = { products: 0, pilots: 1, concepts: 2, next: 3 };
  return out.sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9) || a.order - b.order || a.name.localeCompare(b.name));
}

const STATUS_PILL = { live: ["live", "live"], demo: ["demo", ""], validating: ["validating", ""], prospect: ["not built", ""], unverified: ["concept", ""], "not live": ["not live", ""] };
function pill(v) {
  if (v.group === "next") return `<span class="pill">not built</span>`;
  if (v.group === "concepts") return `<span class="pill">concept</span>`;
  const [text, cls] = STATUS_PILL[v.status] ?? [v.status || "", ""];
  return text ? `<span class="pill ${cls}">${esc(text)}</span>` : "";
}

// ── page chrome ─────────────────────────────────────────────────────────────
function shell({ title, description, path, body, nav }) {
  const items = [
    ["/#products", "Products"],
    ["/#pilots", "Pilots"],
    ["/#concepts", "Concepts"],
    ["/packages/", "Packages"],
    ["/studio/", "Studio"],
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
      <a class="btn secondary cta" href="${HIRE}">Work with me ${ARROW}</a>
    </div>
  </header>
${body}
  <footer>
    <div class="wrap">
      <span>bitbaum is Cato, Zürich. Nothing here is registered; an orangecat.ch name is an address on one server.</span>
      <nav aria-label="Elsewhere">
        <a href="${GITHUB}" rel="noopener">GitHub</a>
        <a href="${ARTICLES}">Writing</a>
        <a href="${HIRE}">Work with me</a>
        <a href="/map.json">map.json</a>
      </nav>
    </div>
  </footer>
</body>
</html>
`;
}

// ── cards ───────────────────────────────────────────────────────────────────
function card(v, { big = false } = {}) {
  const img = v.shot
    ? `        <div class="shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"></div>\n`
    : "";
  const cls = `card${big ? " big" : ""}${v.shot ? "" : " text"}`;
  const sub = v.pillar ? `<span class="label">${esc(v.pillar)}</span>` : v.for ? `<span class="label">for ${esc(v.for)}</span>` : "";
  return `      <a class="${cls}" href="/${esc(v.slug)}/">
${img}        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span>${pill(v)}</div>
          <span class="card-what">${esc(v.what)}</span>${sub ? `\n          ${sub}` : ""}
        </div>
      </a>`;
}

function section({ id, title, lede, cards, note }) {
  return `    <section class="section" id="${id}">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">${esc(title)}</h2>${note ? `<span class="label">${note}</span>` : ""}</div>
          ${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
        </div>
        <div class="grid${cards.length === 2 ? " two" : cards.length >= 8 ? " four" : ""}">
${cards.join("\n")}
        </div>
      </div>
    </section>`;
}

// ── pages ───────────────────────────────────────────────────────────────────
export function homePage(all, packages, cfg, origin) {
  const by = (g) => all.filter((v) => v.group === g);
  const products = by("products");
  const pillars = products.filter((v) => v.pillar);
  const rest = products.filter((v) => !v.pillar);
  const live = all.filter((v) => v.status === "live" && v.group !== "next").length;
  const pkgCount = (packages.packages ?? []).length;
  const proven = (origin?.repos ?? []).filter((r) => r.provenSince).length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  const G = cfg.groups ?? {};

  const body = `  <main>
    <section class="hero">
      <div class="wrap">
        <span class="eyebrow">One person &middot; Zürich &middot; everything public</span>
        <h1 class="display-1">One trunk. Many products.</h1>
        <p class="lede">bitbaum is a one-person studio building AI-native products on shared, open-source infrastructure. ${live} of them run today. Every line of code is public, and every product on this page is a screenshot, not a promise.</p>
        <div class="actions">
          <a class="btn primary" href="#products">See the products ${ARROW}</a>
          <a class="btn secondary" href="/studio/">How it works</a>
        </div>
        <div class="hero-facts">
          <span><b>${live}</b> live</span>
          <span><b>${pkgCount}</b> open-source packages</span>
          <span><b>${proven}</b> repositories with proven origin</span>
          <span><b>1</b> server</span>
        </div>
      </div>
    </section>

${section({ id: "products", title: G.products?.title ?? "Products", lede: G.products?.lede, cards: pillars.map((v) => card(v, { big: true })) })}
${rest.length ? `    <section class="section" id="more-products">
      <div class="wrap">
        <div class="grid four">
${rest.map((v) => card(v)).join("\n")}
        </div>
      </div>
    </section>` : ""}
${section({ id: "pilots", title: G.pilots?.title ?? "Pilots", lede: G.pilots?.lede, cards: by("pilots").map((v) => card(v)) })}
${section({ id: "concepts", title: G.concepts?.title ?? "Concepts", lede: G.concepts?.lede, cards: by("concepts").map((v) => card(v)) })}
${section({ id: "next", title: G.next?.title ?? "Next", lede: G.next?.lede, cards: by("next").map((v) => card(v)) })}
    <section class="section" id="packages">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">Built from ${pkgCount} shared packages</h2><a class="textlink" href="/packages/">All packages &rarr;</a></div>
          <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
        </div>
        <div class="grid">
${(packages.packages ?? []).slice(0, 3).map((p) => pkgCard(p, cfg.packages?.[p.slug])).join("\n")}
        </div>
      </div>
    </section>
    <section class="section" id="open">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Open by construction</h2>
          <p class="lede">Anyone can join the work or take it. Three things make that safe to say.</p>
        </div>
        <div class="facts">
          <div class="fact"><span class="label">Licence</span><span class="display-3">MIT, everywhere</span><p class="copy">Every product and package the studio owns is MIT. What is built for someone else stays theirs.</p></div>
          <div class="fact"><span class="label">Origin</span><span class="display-3">Proven nightly</span><p class="copy">Every repository's HEAD is stamped through OpenTimestamps and archived by Software Heritage${block ? `, anchored in Bitcoin since block ${block}` : ""}. Git dates prove nothing; a block does. <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">The register</a>.</p></div>
          <div class="fact"><span class="label">Numbers</span><span class="display-3">Read, not written</span><p class="copy">Stars, downloads, revenue and what has been paid back to originators are read nightly from sources that are not us, and published as they are. <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">The readings</a>.</p></div>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title: "bitbaum — one trunk, many products", description: `A one-person studio in Zürich building AI-native products on shared open-source infrastructure. ${live} live products, ${pkgCount} open-source packages, everything public.`, path: "/", body, nav: "/" });
}

function pkgCard(p, editorial) {
  const what = editorial?.what ?? p.description ?? "";
  const uses = p.adopters === 1 ? "used in 1 app" : `used in ${p.adopters} apps`;
  const npmHref = p.install?.source === "npm" ? `https://www.npmjs.com/package/${p.name}` : null;
  return `      <article class="card text">
        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(p.slug)}</span><span class="pill">${esc(uses)}</span></div>
          <span class="card-what">${esc(what)}</span>
          <code class="pkg-install">${esc(p.install?.command ?? "")}</code>
          <div class="pkg-links"><a href="${esc(p.repo)}">source</a>${npmHref ? `<a href="${esc(npmHref)}">npm</a>` : `<span>git tag</span>`}</div>
        </div>
      </article>`;
}

export function packagesPage(packages, cfg) {
  const list = packages.packages ?? [];
  const body = `  <main>
    <section class="hero">
      <div class="wrap">
        <span class="eyebrow">${list.length} packages &middot; MIT</span>
        <h1 class="display-1">The trunk.</h1>
        <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="grid">
${list.map((p) => pkgCard(p, cfg.packages?.[p.slug])).join("\n")}
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title: "Packages — bitbaum", description: cfg.packages_lede ?? "", path: "/packages/", body, nav: "/packages/" });
}

export function venturePage(v, all) {
  const i = all.indexOf(v);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const groupTitle = { products: "Product", pilots: "Pilot", concepts: "Concept", next: "Next" }[v.group] ?? "";
  const facts = [
    ["What", groupTitle + (v.for ? `, for ${v.for}` : "")],
    ["Status", v.group === "next" ? "Named, not built" : v.status === "live" ? "Live" : v.status === "demo" ? "Demo, mock data" : v.status === "validating" ? "Validating" : v.status || "—"],
    v.since ? ["Since", monthYear(v.since)] : null,
    v.url ? ["Address", `<a href="${esc(v.url)}">${esc(host(v.url))}</a>`] : null,
    v.repo ? ["Source", `<a href="${esc(v.repo)}">${esc(v.repo.replace("https://github.com/", ""))}</a>`] : null,
  ].filter(Boolean);
  const body = `  <main>
    <section class="venture-hero">
      <div class="wrap">
        <span class="eyebrow${v.status === "live" ? "" : " quiet"}">${esc(groupTitle)}${v.pillar ? ` &middot; ${esc(v.pillar)}` : ""}${v.for ? ` &middot; for ${esc(v.for)}` : ""}</span>
        <h1 class="display-1">${esc(v.name)}</h1>
        <p class="lede">${esc(v.what)}</p>
        <div class="actions">
          ${v.url ? `<a class="btn primary" href="${esc(v.url)}">Open ${esc(host(v.url))} ${ARROW}</a>` : ""}
          ${v.repo ? `<a class="btn secondary" href="${esc(v.repo)}">Source</a>` : ""}
        </div>
      </div>
    </section>
${v.shot ? `    <div class="wrap"><div class="venture-shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot of ${esc(host(v.url))}" width="1280" height="800"></div></div>` : ""}
    <section class="wrap venture-body">
      <div class="prose">
        ${v.story ? `<p>${esc(v.story)}</p>` : ""}
        ${v.shot ? `<p class="caption">The image is a screenshot of ${esc(host(v.url))}, taken by a machine when this site was built. If the product changed, so did the picture.</p>` : ""}
      </div>
      <div class="venture-facts">
${facts.map(([k, val]) => `        <div><span class="label">${esc(k)}</span><span>${val}</span></div>`).join("\n")}
      </div>
    </section>
    <div class="wrap"><div class="pager"><a href="/${esc(prev.slug)}/">&larr; ${esc(prev.name)}</a><a href="/#${esc(v.group)}">All ${esc({ products: "products", pilots: "pilots", concepts: "concepts", next: "next" }[v.group] ?? "")}</a><a href="/${esc(next.slug)}/">${esc(next.name)} &rarr;</a></div></div>
  </main>`;
  return shell({ title: `${v.name} — ${v.what}`, description: v.story || v.what, path: `/${v.slug}/`, body });
}

export function studioPage(all, packages, origin) {
  const live = all.filter((v) => v.status === "live" && v.group !== "next").length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  const body = `  <main>
    <section class="hero">
      <div class="wrap">
        <span class="eyebrow">The studio</span>
        <h1 class="display-1">Bit, and Baum.</h1>
        <p class="lede">Bit for software. Baum, German for tree, for the shape: many branches from one trunk. One person builds it, and the trunk is what makes that possible.</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap"><div class="prose">
        <h2>What bitbaum is</h2>
        <p>A product studio, not a consultancy and not a single-product company. It ships AI-native products for real problems — an economic agent, an operating system for AI fleets, governance you can recount, tools for a non-profit, a clinic, a housing organisation — and each one is built from the same shared infrastructure, so the next one is cheaper than the last. ${live} of them run today.</p>
        <h2>How one person ships this much</h2>
        <p>The trunk. ${(packages.packages ?? []).length} open-source packages carry the parts every product needs: which AI model to call and what to do when it fails, email, forms filled from prose, rate limits, lists, threads, design tokens, sites as data. On top of that, <a href="/loki/">Loki</a> runs a fleet of AI agents that build, verify and deploy every product here — including Loki. The human's job is judgment: what to build, what is good enough, what is true.</p>
        <h2>What is true</h2>
        <p>Nothing on this site is typed by hand. The list of products comes from the register that provisioning reads; the pictures are screenshots a machine takes on every build; the counts come from GitHub, npm and the register. There are no clients on this site because there are none: the pilots run for real organisations as favours, offered first, and say so.</p>
        <h2>Open by construction</h2>
        <p>Every product and package the studio owns is MIT. Contributor terms live in one place, <a href="https://github.com/bitbaum/.github/blob/main/CONTRIBUTING.md">bitbaum/.github</a>. Every repository's origin is stamped nightly through OpenTimestamps and archived by Software Heritage${block ? `, anchored in Bitcoin since block ${block}` : ""}, so precedence is arithmetic rather than a claim. And a rule in <a href="/solon/">Solon</a> routes a share of any revenue back to whoever originated the code a product is built from — by default, before there is revenue to route.</p>
        <h2>Numbers, in the open</h2>
        <p>Stars, forks, downloads, paying clients and what has been paid to originators are read nightly from sources that are not us and published as they are — most of them zero today. <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">The readings</a>, and the <a href="${ARTICLES}">writing</a> that keeps score in public.</p>
        <h2>Work with me</h2>
        <p>Fractional CTO and contract engineering, Zürich. Rates and scope are on the <a href="${HIRE}">hire page</a>. The code is on <a href="${GITHUB}">GitHub</a>.</p>
      </div></div>
    </section>
  </main>`;
  return shell({ title: "The studio — bitbaum", description: "Bit for software, Baum for the shape: many branches from one trunk. How one person in Zürich ships a fleet of AI-native products.", path: "/studio/", body, nav: "/studio/" });
}

// ── build ───────────────────────────────────────────────────────────────────
export function render({ map, packages, origin, cfg }) {
  const all = ventures(map, cfg, origin);
  const files = new Map();
  files.set("index.html", homePage(all, packages, cfg, origin));
  files.set("packages/index.html", packagesPage(packages, cfg));
  files.set("studio/index.html", studioPage(all, packages, origin));
  for (const v of all) files.set(`${v.slug}/index.html`, venturePage(v, all));
  files.set("map.json", JSON.stringify(map, null, 2) + "\n");
  return { all, files };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (args.has("--check")) args.add("--offline");
  const map = await fetchOrSnapshot(SOURCES.map);
  const packages = await fetchOrSnapshot(SOURCES.packages);
  const origin = await fetchOrSnapshot(SOURCES.origin);
  const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
  const { all, files } = render({ map, packages, origin, cfg });

  // A shot the page references must exist: a broken image on a product page
  // is worse than no product page.
  for (const v of all) {
    if (v.shot && !existsSync(join(DIST, "shots", `${v.slug}.jpg`))) {
      console.error(`missing shot for ${v.slug} — run: node site/shots.mjs ${v.slug}`);
      process.exit(1);
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
      if (d.isDirectory() && !["shots", "fonts", "packages", "studio"].includes(d.name) && !all.some((v) => v.slug === d.name)) rmSync(join(DIST, d.name), { recursive: true });
    }
    cpSync(join(here, "styles.css"), join(DIST, "styles.css"));
    cpSync(join(here, "logo-mark.svg"), join(DIST, "logo-mark.svg"));
    cpSync(join(here, "fonts"), join(DIST, "fonts"), { recursive: true });
    console.log(`wrote site/dist: ${files.size} pages (${all.length} ventures, ${(packages.packages ?? []).length} packages), map ${map.generatedAt ?? "snapshot"}`);
  }
}
