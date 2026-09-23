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
    if (n === 0) return `<span class="pill">on npm</span>`;
    return `<span class="pill">${n === 1 ? "1 app" : `${n} apps`}</span>`;
  }

  function pkgCard(p, editorial, ventureBySlug, alias) {
    const what = editorial?.what ?? p.description ?? "";
    const npmHref = p.install?.source === "npm" ? `https://www.npmjs.com/package/${p.name}` : null;
    const adopters = pkgAdopters(p, ventureBySlug, alias);
    const links = [`<a href="/packages/${esc(p.slug)}/">Why it exists</a>`];
    if (p.repo) links.push(`<a href="${esc(p.repo)}">source</a>`);
    if (npmHref) links.push(`<a href="${esc(npmHref)}">npm</a>`);
    else if (p.install?.source === "git") links.push(`<span>git tag</span>`);
    return `      <article class="card text pkg-card" id="${esc(p.slug)}">
        <div class="card-body">
          <a class="pkg-cover" href="/packages/${esc(p.slug)}/">
            <span class="card-top"><span class="card-name">${esc(p.slug)}</span>${pkgPill(p)}</span>
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
    const jump = sections.map((g) => `<a href="#${esc(g.id)}">${esc(g.title)}</a>`).join("");
    const body = `  <main>
    <section class="hero compact">
      <div class="wrap">
        <span class="eyebrow">${registry.length} you can install &middot; MIT &middot; ${totalUses} uses across the fleet</span>
        <h1 class="display-1">The trunk.</h1>
        <p class="lede">${esc(cfg.packages_lede ?? "")}</p>
        <nav class="pkg-jump" aria-label="Package groups">${jump}</nav>
      </div>
    </section>
${sections
  .map(
    (g) => `    <section class="section" id="${esc(g.id)}">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">${esc(g.title)}</h2>
          ${g.lede ? `<p class="lede">${esc(g.lede)}</p>` : ""}
        </div>
        <div class="grid">
${g.items.map((p) => pkgCard(p, cfg.packages?.[p.slug] ?? p, ventureBySlug, alias)).join("\n")}
        </div>
      </div>
    </section>`,
  )
  .join("\n")}
    <section class="section">
      <div class="wrap">
        <p class="caption">The name of a package opens its page. Adopter counts come from real <code>package.json</code> files, read by <a href="https://github.com/bitbaum/fleet/blob/main/scripts/ci/shared-registry-audit.mjs">fleet's registry audit</a>. Nobody types them. paykit is on npm; the register has not counted an adopter yet.</p>
      </div>
    </section>
  </main>`;
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
    const what = editorial.what ?? p.description ?? "";
    const why = editorial.why ?? "";
    const how = editorial.how ?? "";
    const fits = editorial.fits ?? "";
    const facts = [
      ["Licence", p.status === "next" ? "MIT, when it is published" : "MIT"],
      p.install?.command ? ["Install", `<code>${esc(p.install.command)}</code>`] : ["Install", "Not on npm yet"],
      p.repo
        ? ["Source", `<a href="${esc(p.repo)}">${esc(String(p.repo).replace("https://github.com/", ""))}</a>`]
        : ["Source", `<a href="/orangecat/">Inside OrangeCat</a>`],
      adopters.length ? ["Used by", `${p.adopters} ${p.adopters === 1 ? "app" : "apps"}`] : null,
    ].filter(Boolean);
    const body = `  <main>
    <section class="venture-hero">
      <div class="wrap">
        <span class="eyebrow${p.status === "next" ? " quiet" : ""}">${p.status === "next" ? "Next &middot; not on npm yet" : "Package &middot; MIT"}</span>
        <h1 class="display-1">${esc(p.slug)}</h1>
        <p class="lede">${esc(what)}</p>
        <div class="actions">
          ${npmHref ? `<a class="btn primary" href="${esc(npmHref)}">npm</a>` : `<a class="btn primary" href="/orangecat/">See it in OrangeCat</a>`}
          ${p.repo ? `<a class="btn secondary" href="${esc(p.repo)}">Source</a>` : ""}
          <a class="btn secondary" href="/packages/">All packages</a>
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
