// /map/ — the work drawn as a network of loops.
//
// Every venture on this site is a loop: work that recurs and still needs a
// person somewhere in it. The map files each venture under the loop it serves
// and names, per loop, who stays in it and what routine part it aims to
// retire. The loops are editorial (overrides.json → loops); the ventures are
// the same objects the rest of the site renders, so a name, stage or link
// cannot differ between this page and /work/.
//
// Two rules keep it honest, and loopMap() enforces both at build time:
//   - a loop may only cite a venture the site actually shows;
//   - every shown venture sits in exactly one loop, so a new project cannot
//     appear on /work/ without someone deciding what it is for.
// A loop with no venture is allowed and is rendered as a gap. That is the
// point of drawing the map: the empty slot is visible, and nothing is claimed
// for it.

/** Resolve overrides.json's loops against the shown ventures. Throws on drift. */
export function loopMap(all, cfg) {
  const bySlug = new Map(all.map((v) => [v.slug, v]));
  const placed = new Map();
  const layers = (cfg.loops?.layers ?? []).map((layer) => ({
    ...layer,
    loops: (layer.loops ?? []).map((loop) => ({
      ...loop,
      ventures: (loop.ventures ?? []).map((slug) => {
        const v = bySlug.get(slug);
        if (!v) throw new Error(`loops: "${loop.title}" cites "${slug}", which the site does not show`);
        if (placed.has(slug)) throw new Error(`loops: "${slug}" is in both "${placed.get(slug)}" and "${loop.title}"`);
        placed.set(slug, loop.title);
        return v;
      }),
    })),
  }));
  const unplaced = all.filter((v) => !placed.has(v.slug)).map((v) => v.slug);
  if (unplaced.length) throw new Error(`loops: no loop for ${unplaced.join(", ")} — add each to a loop in overrides.json`);
  return layers;
}

export function createLoopsPage({ esc, shell, pill, ARROW }) {
  const ventureLink = (v) =>
    `<li><a href="/${esc(v.slug)}/">${esc(v.name)}</a>${pill(v)}</li>`;

  const loopCard = (loop) => {
    const gap = loop.ventures.length === 0;
    return `            <div class="card text loop${gap ? " loop-gap" : ""}">
              <div class="card-body">
                <div class="card-top"><span class="card-name">${esc(loop.title)}</span>${gap ? '<span class="pill">no venture yet</span>' : ""}</div>
                <p class="card-what"><span class="label">In the loop</span> ${esc(loop.human)}</p>
                <p class="card-story"><span class="label">Aims to retire</span> ${esc(loop.retires)}</p>
${gap
  ? `                <p class="card-story">${esc(loop.gap ?? "Named so the gap is visible. Nothing is built, offered or promised here yet.")}</p>`
  : `                <ul class="loop-ventures">${loop.ventures.map(ventureLink).join("")}</ul>`}
              </div>
            </div>`;
  };

  return function loopsPage(all, cfg, packages) {
    const layers = loopMap(all, cfg);
    const pkgCount = (packages?.packages ?? []).length;
    const text = cfg.loops ?? {};
    const sections = layers.map((layer) => `    <section class="section loop-layer" id="${esc(layer.id)}">
      <div class="wrap">
        <div class="prose">
          <span class="kicker quiet">${esc(layer.kicker ?? "")}</span>
          <h2>${esc(layer.title)}</h2>
          <p>${esc(layer.line)}</p>${layer.packages ? `
          <p>Under these sit <a href="/packages/">${pkgCount} shared packages</a>. Each is a loop already retired: a problem that kept recurring across projects, solved once so the next project starts past it.</p>` : ""}
        </div>
        <div class="grid loop-grid">
${layer.loops.map(loopCard).join("\n")}
        </div>
      </div>
    </section>`).join("\n");

    const body = `  <main id="main">
    <section data-lodge class="stage stage-floored hero compact">
      <div class="wrap">
        <span class="eyebrow">The map</span>
        <h1 class="display-1">${esc(text.headline)}</h1>
        <p class="lede">${esc(text.lede)}</p>
        <div class="actions">
          <a class="btn primary" href="/work/">The work, by stage ${ARROW}</a>
          <a class="btn secondary" href="/partners/">Work in a loop</a>
        </div>
      </div>
    </section>
${sections}
    <section class="section">
      <div class="wrap"><div class="prose">
        <h2>Loops kept human on purpose</h2>
        <p>${esc(text.kept)}</p>
      </div></div>
    </section>
  </main>`;
    return shell({
      title: "The map — bitbaum",
      description: text.description,
      path: "/map/",
      body,
      nav: "/map/",
    });
  };
}
