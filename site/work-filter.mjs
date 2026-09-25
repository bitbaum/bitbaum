import { applyQuery, debounce, emptyQuery, isNarrowed, parseQuery, toggleInSet, writeQuery } from "/vendor/listkit/index.js";

const grid = document.querySelector("#work-grid");
const controls = document.querySelector("#work-filters");
if (grid && controls) {
  const cards = [...grid.children];
  const chips = [...controls.querySelectorAll(".chip")];
  const rows = cards.map((card, rank) => ({
    stage: card.dataset.stage,
    field: (card.dataset.tags ?? "").split(" ").filter(Boolean),
    name: card.dataset.name,
    host: card.dataset.host,
    since: card.dataset.since || null,
    rank,
    text: card.innerText,
    card,
  }));
  const stages = [...new Set(rows.map((row) => row.stage))];
  const fields = [...new Set(rows.flatMap((row) => row.field))];
  const spec = {
    facets: [
      { key: "stage", kind: "many", value: (row) => row.stage, options: stages },
      { key: "field", kind: "many", value: (row) => row.field, options: fields },
    ],
    search: { text: (row) => [row.name, row.host, row.text] },
    sorts: [
      { key: "studio", by: [(row) => row.rank] },
      { key: "name", by: [(row) => row.name] },
      { key: "newest", by: [(row) => row.since, (row) => row.name] },
    ],
    defaultSort: "studio",
    defaultPageSize: rows.length || 1,
  };
  const search = document.querySelector("#work-search");
  const sort = document.querySelector("#work-sort");
  const count = document.querySelector("#work-count");
  const clear = document.querySelector("#clear-filters");
  const empty = document.querySelector("#work-empty");

  function read() {
    const fragment = location.hash.split("?")[1] ?? "";
    const query = parseQuery(new URLSearchParams(fragment), spec);
    if (query.sort === "newest" && !new URLSearchParams(fragment).has("dir")) query.dir = "desc";
    return query;
  }

  function render(query) {
    search.value = query.q;
    sort.value = query.sort;
    const applied = applyQuery(rows, spec, query);
    const visible = new Set(applied.rows.map((row) => row.card));
    for (const card of cards) card.hidden = !visible.has(card);
    for (const row of applied.rows) grid.append(row.card);
    for (const chip of chips) {
      const selected = query.facets[chip.dataset.facet] ?? [];
      chip.setAttribute("aria-pressed", String(selected.includes(chip.dataset.value)));
      chip.querySelector(".chip-n").textContent = applied.counts[chip.dataset.facet]?.[chip.dataset.value] ?? 0;
    }
    count.textContent = `${applied.matched} of ${rows.length}`;
    empty.hidden = applied.matched !== 0;
    clear.hidden = (!isNarrowed(query) && query.sort === spec.defaultSort);
  }

  let state = read();
  function update(next, method = "pushState") {
    const oldParams = new URLSearchParams(location.hash.split("?")[1] ?? "");
    const params = writeQuery(oldParams, next, spec, state);
    state = next;
    const query = params.toString();
    history[method](null, "", `${location.pathname}${location.search}#work${query ? `?${query}` : ""}`);
    render(state);
  }

  search.addEventListener("input", debounce(() => update({ ...state, q: search.value.trim(), page: 1 }, "replaceState"), 180));
  sort.addEventListener("change", () => update({ ...state, sort: sort.value, dir: sort.value === "newest" ? "desc" : "asc", page: 1 }));
  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const key = chip.dataset.facet;
      const selected = toggleInSet(state.facets[key] ?? [], chip.dataset.value);
      const facets = { ...state.facets, [key]: selected };
      if (!selected.length) delete facets[key];
      update({ ...state, facets, page: 1 });
    });
  }
  function reset() { update(emptyQuery(spec)); }
  clear.addEventListener("click", reset);
  empty.querySelector("[data-clear]").addEventListener("click", reset);
  function restore() { state = read(); render(state); }
  addEventListener("popstate", restore);
  addEventListener("hashchange", restore);
  controls.hidden = false;
  render(state);
}

// The filter panel is always open beside the grid on a desk and folds shut
// above it on a phone. <details> gives the fold for free; this only keeps it
// open where there is room for it, following the viewport as it changes.
const box = document.querySelector("#work-filters-box");
if (box) {
  const wide = matchMedia("(min-width: 1024px)");
  const sync = () => {
    if (wide.matches) box.open = true;
  };
  sync();
  wide.addEventListener("change", sync);
}
