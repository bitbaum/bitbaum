/**
 * /packages/ and /packages/<slug>/ — kept out of the site builder so that
 * file does not keep growing.
 *
 * The registry says which packages exist and who installs them. This file
 * only turns that, plus the editorial in overrides.json, into HTML.
 */

export function createPackagePages({ esc, shell }) {
  function pkgAdopters(p, ventureBySlug, alias) {
    // An adopter with no venture page renders as plain text: it is a real
    // adopter the site does not show.
    return (p.adopterNames ?? []).map((a) => {
      const v = ventureBySlug.get(alias[a] ?? a);
      return v ? `<a href="/${esc(v.slug)}/">${esc(v.name)}</a>` : `<span>${esc(a)}</span>`;
    });
  }

  function pkgPill(p) {
    if (p.status === "next") return `<span class="pill">not on npm yet</span>`;
    const n = p.adopters ?? 0;
    if (n === 0) return `<span class="pill">0 apps</span>`;
    return `<span class="pill">${n === 1 ? "1 app" : `${n} apps`}</span>`;
  }

  function pkgVersion(p) {
    if (p.install?.source !== "npm" || !p.version) return "";
    return `<span class="pill pkg-version" aria-label="Latest npm version ${esc(p.version)}">npm&nbsp;v${esc(p.version)}</span>`;
  }

  function pkgCard(p, editorial, ventureBySlug, alias, group) {
    const category = group ?? { id: p.group ?? "other", title: "Shared" };
    const what = editorial?.what ?? p.description ?? "";
    const npmHref = p.install?.source === "npm" ? `https://www.npmjs.com/package/${p.name}` : null;
    const adopters = pkgAdopters(p, ventureBySlug, alias);
    const links = [`<a class="pkg-open" href="/packages/${esc(p.slug)}/" aria-label="Open the ${esc(p.slug)} developer profile">Developer profile <span aria-hidden="true">→</span></a>`];
    if (p.repo) links.push(`<a href="${esc(p.repo)}">source</a>`);
    if (npmHref) links.push(`<a href="${esc(npmHref)}">npm</a>`);
    else if (p.install?.source === "git") links.push(`<span>git tag</span>`);
    return `      <article class="card text pkg-card" id="${esc(p.slug)}" data-package="${esc(p.slug)}" data-group="${esc(category.id)}" data-adoption="${(p.adopters ?? 0) > 0 ? "adopted" : "new"}">
        <div class="card-body">
          <a class="pkg-cover" href="/packages/${esc(p.slug)}/">
            <span class="card-top"><span class="card-name">${esc(p.slug)}</span><span class="pkg-badges"><span class="pill pkg-category">${esc(category.title)}</span>${pkgVersion(p)}${pkgPill(p)}</span></span>
            <span class="card-what">${esc(what)}</span>
          </a>
          ${p.install?.command ? `<code class="pkg-install">${esc(p.install.command)}</code>` : ""}
${adopters.length ? `          <div class="uses"><span class="label">Used by</span><div class="chips">${adopters.join("")}</div></div>\n` : ""}          <div class="pkg-links">${links.join("")}</div>
        </div>
      </article>`;
  }

  /** Registry packages, then any the site names before they exist on npm. */
  function shownPackages(packages, cfg) {
    return [...(packages.packages ?? []), ...(cfg.upcomingPackages ?? [])];
  }

  function packageSections(list, cfg) {
    const groups = cfg.packageGroups ?? [];
    const used = new Set();
    const sections = groups
      .map((g) => {
        const items = list.filter((p) => cfg.packages?.[p.slug]?.group === g.id || p.group === g.id);
        items.forEach((p) => used.add(p.slug));
        return { ...g, items };
      })
      .filter((g) => g.items.length);
    const rest = list.filter((p) => !used.has(p.slug));
    if (rest.length) {
      sections.push({ id: "other", title: "Also", lede: "Shared code that does not sit in a group yet.", items: rest });
    }
    return sections;
  }

  function packagesPage(packages, cfg, all) {
    const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
    const alias = cfg.adopterAliases ?? {};
    const registry = packages.packages ?? [];
    const list = shownPackages(packages, cfg);
    const totalUses = registry.reduce((s, p) => s + (p.adopters ?? 0), 0);
    const sections = packageSections(list, cfg);
    const paykit = registry.find((p) => p.slug === "paykit");
    const groupOptions = sections.map((g) => `<option value="${esc(g.id)}" data-description="${esc(g.lede ?? "")}">${esc(g.title)}</option>`).join("");
    const cards = sections.flatMap((g) => g.items.map((p) => pkgCard(p, cfg.packages?.[p.slug] ?? p, ventureBySlug, alias, g))).join("\n");
    const body = `  <main>
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">${registry.length} you can install &middot; MIT &middot; ${totalUses} uses across the fleet</span>
        <h1 class="display-1">The trunk.</h1>
        <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
        ${paykit ? `<aside class="pkg-feature" aria-label="Paykit package">
          <div><span class="label">PAYMENTS · PAYKIT · NPM V${esc(paykit.version ?? "?")} · ${paykit.adopters ?? 0} APPS</span><p>${esc(cfg.packages?.paykit?.what ?? paykit.description ?? "")}</p></div>
          <a class="btn secondary" href="/packages/paykit/">Explore paykit <span aria-hidden="true">→</span></a>
        </aside>` : ""}
        <div class="pkg-controls" id="package-controls" hidden>
          <label>Find a package<input id="package-search" type="search" name="q" placeholder="Search packages, features, or adopters" autocomplete="off"></label>
          <label>Category<select id="package-group"><option value="" data-description="Browse shared tools by the jobs they do across the studio.">All categories</option>${groupOptions}</select></label>
          <label>Adoption<select id="package-adoption"><option value="">Any adoption</option><option value="adopted">Used by an app</option><option value="new">No app uses it yet</option></select></label>
          <label>Sort by<select id="package-sort"><option value="featured">Studio order</option><option value="name">Name</option><option value="adopters">Most used</option></select></label>
          <button type="button" class="clear" id="package-clear" hidden>Clear filters</button>
          <p class="pkg-guidance" id="package-guidance">Browse shared tools by the jobs they do across the studio.</p>
          <p class="pkg-result" id="package-result" role="status" aria-live="polite"></p>
        </div>
      </div>
    </section>
    <section class="section" aria-label="Shared packages">
      <div class="wrap"><div class="grid pkg-grid" id="package-grid">${cards}</div>
        <p class="empty" id="package-empty" hidden>No packages match those choices. <button type="button" class="linkish" data-package-clear>Clear filters</button> to see everything.</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <p class="caption">The name of a package opens its page. Adopter counts come from real <code>package.json</code> files, read by <a href="https://github.com/bitbaum/fleet/blob/main/scripts/ci/shared-registry-audit.mjs">fleet's registry audit</a>. Nobody types them. Packages with no adopters are listed openly; counts change when package manifests adopt them.</p>
      </div>
    </section>
  </main>
  <script type="module" src="/packages-filter.mjs"></script>`;
    return shell({ title: "Packages — bitbaum", description: cfg.packages_lede ?? "", path: "/packages/", body, nav: "/packages/" });
  }

  function packagePage(p, cfg, all, list) {
    const editorial = cfg.packages?.[p.slug] ?? p;
    const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
    const alias = cfg.adopterAliases ?? {};
    const adopters = pkgAdopters(p, ventureBySlug, alias);
    const i = list.findIndex((x) => x.slug === p.slug);
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    const npmHref = p.install?.source === "npm" ? `https://www.npmjs.com/package/${p.name}` : null;
    const repoHref = p.repo?.replace(/\/$/, "");
    const readmeHref = repoHref ? `${repoHref}#readme` : null;
    const versionsHref = npmHref ? `${npmHref}?activeTab=versions` : repoHref ? `${repoHref}/tags` : null;
    const what = editorial.what ?? p.description ?? "";
    const why = editorial.why ?? "";
    const how = editorial.how ?? "";
    const fits = editorial.fits ?? "";
    const facts = [
      ["Licence", p.status === "next" ? "MIT, when it is published" : "MIT"],
      p.install?.source === "npm" && p.version ? ["Latest npm version", `v${esc(p.version)}`] : null,
      p.install?.command ? ["Install", `<code>${esc(p.install.command)}</code>`] : ["Install", "Not on npm yet"],
      p.repo
        ? ["Source", `<a href="${esc(p.repo)}">${esc(String(p.repo).replace("https://github.com/", ""))}</a>`]
        : ["Source", `<a href="/orangecat/">Inside OrangeCat</a>`],
      adopters.length ? ["Used by", `${p.adopters} ${p.adopters === 1 ? "app" : "apps"}`] : ["Fleet adoption", "0 apps currently list this package as a dependency"],
    ].filter(Boolean);
    const body = `  <main>
    <section class="venture-hero">
      <div class="wrap">
        <span class="eyebrow${p.status === "next" ? " quiet" : ""}">${p.status === "next" ? "Next &middot; not on npm yet" : "Package &middot; MIT"}</span>
        <h1 class="display-1">${esc(p.slug)}</h1>
        <p class="lede">${esc(what)}</p>
        <div class="actions">
          ${npmHref ? `<a class="btn primary" href="${esc(npmHref)}">npm</a>` : `<a class="btn primary" href="/orangecat/">See it in OrangeCat</a>`}
          ${readmeHref ? `<a class="btn secondary" href="${esc(readmeHref)}">README &amp; API</a>` : ""}
          ${versionsHref ? `<a class="btn secondary" href="${esc(versionsHref)}">Version history</a>` : ""}
          ${p.repo ? `<a class="btn secondary" href="${esc(p.repo)}">Source</a>` : ""}
        </div>
      </div>
    </section>
    <section class="wrap venture-body">
      <div class="prose">
        ${why ? `<h2>Why it exists</h2><p>${esc(why)}</p>` : ""}
        ${how ? `<h2>How it works</h2><p>${esc(how)}</p>` : ""}
        ${fits ? `<h2>Where it fits</h2><p>${esc(fits)}</p>` : ""}
      </div>
      <div class="venture-facts">
${facts.map(([k, val]) => `        <div><span class="label">${esc(k)}</span><span>${val}</span></div>`).join("\n")}
${adopters.length ? `        <div class="uses"><span class="label">Used by</span><div class="chips">${adopters.join("")}</div></div>` : ""}
      </div>
    </section>
    <div class="wrap"><div class="pager"><a href="/packages/${esc(prev.slug)}/">&larr; ${esc(prev.slug)}</a><a href="/packages/">All packages</a><a href="/packages/${esc(next.slug)}/">${esc(next.slug)} &rarr;</a></div></div>
  </main>`;
    return shell({
      title: `${p.slug} — bitbaum`,
      description: what,
      path: `/packages/${p.slug}/`,
      body,
      nav: "/packages/",
    });
  }

  return { pkgCard, packagesPage, packagePage, shownPackages };
}
