import { applyQuery, debounce, emptyQuery, isNarrowed, parseQuery, writeQuery } from "/vendor/listkit/index.js";

const grid = document.querySelector("#package-grid");
const controls = document.querySelector("#package-controls");
if (grid && controls) {
  const cards = [...grid.querySelectorAll("[data-package]")];
  const rows = cards.map((card, rank) => ({
    slug: card.dataset.package,
    group: card.dataset.group,
    adoption: card.dataset.adoption,
    rank,
    adopters: Number(card.dataset.adopters ?? 0),
    text: card.innerText,
    card,
  }));
  const groupOptions = [...new Set(rows.map((row) => row.group))];
  const spec = {
    facets: [
      { key: "group", kind: "one", value: (row) => row.group, options: groupOptions },
      { key: "adoption", kind: "one", value: (row) => row.adoption, options: ["adopted", "new"] },
    ],
    search: { text: (row) => [row.slug, row.text] },
    sorts: [
      { key: "featured", by: [(row) => row.rank] },
      { key: "name", by: [(row) => row.slug] },
      { key: "adopters", by: [(row) => row.adopters, (row) => row.slug] },
    ],
    defaultSort: "featured",
    defaultPageSize: rows.length || 1,
  };
  const search = document.querySelector("#package-search");
  const group = document.querySelector("#package-group");
  const adoption = document.querySelector("#package-adoption");
  const sort = document.querySelector("#package-sort");
  const clear = document.querySelector("#package-clear");
  const result = document.querySelector("#package-result");
  const guidance = document.querySelector("#package-guidance");
  const empty = document.querySelector("#package-empty");

  function read() {
    const query = parseQuery(new URLSearchParams(location.search), spec);
    if (query.sort === "adopters" && !new URLSearchParams(location.search).has("dir")) query.dir = "desc";
    return query;
  }

  function render(query) {
    search.value = query.q;
    group.value = query.facets.group?.[0] ?? "";
    adoption.value = query.facets.adoption?.[0] ?? "";
    sort.value = query.sort;
    guidance.textContent = group.selectedOptions[0]?.dataset.description ?? "Browse shared tools by the jobs they do across the studio.";
    const filtered = applyQuery(rows, spec, query).rows;
    const visible = new Set(filtered.map((row) => row.card));
    for (const card of cards) card.hidden = !visible.has(card);
    for (const row of filtered) grid.append(row.card);
    result.textContent = `${filtered.length} of ${rows.length} packages`;
    empty.hidden = filtered.length !== 0;
    clear.hidden = !isNarrowed(query) && query.sort === spec.defaultSort;
  }

  let state = read();
  function update(next, mode = "pushState") {
    state = next;
    const params = writeQuery(new URLSearchParams(location.search), state, spec);
    const query = params.toString();
    history[mode]({}, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    render(state);
  }

  function selected(facet, value) {
    const next = { ...state, facets: { ...state.facets, [facet]: value ? [value] : [] }, page: 1 };
    if (!value) delete next.facets[facet];
    update(next);
  }

  search.addEventListener("input", debounce(() => update({ ...state, q: search.value.trim(), page: 1 }, "replaceState"), 180));
  group.addEventListener("change", () => selected("group", group.value));
  adoption.addEventListener("change", () => selected("adoption", adoption.value));
  sort.addEventListener("change", () => update({ ...state, sort: sort.value, dir: sort.value === "adopters" ? "desc" : "asc", page: 1 }));
  clear.addEventListener("click", () => update(emptyQuery(spec)));
  empty.querySelector("[data-package-clear]").addEventListener("click", () => update(emptyQuery(spec)));
  addEventListener("popstate", () => { state = read(); render(state); });

  controls.hidden = false;
  render(state);
}
