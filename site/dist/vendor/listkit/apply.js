/**
 * Running a query against an in-memory array, and counting the result.
 *
 * This is one of two execution models on purpose. The survey found repos that
 * filter entirely in the browser over a bounded, statically generated array
 * (correct for them), repos that never do client work and push every predicate
 * into SQL (also correct), and repos that must mix because a computed column
 * cannot be filtered in the database. A package that forces one of those serves
 * one repo and strands the rest — so the SPEC is shared and the engine is not.
 * This module is the array engine; a SQL engine consumes the same spec.
 */
import { facetMatches, searchMatches } from "./facets.js";
import { compareBy } from "./sort.js";
import { pageOf } from "./page.js";
/** Every row that passes the query, unpaged and unsorted. */
export function matches(rows, spec, query) {
    return rows.filter((row) => {
        if (!searchMatches(spec.search, row, query.q))
            return false;
        for (const facet of spec.facets) {
            if (!facetMatches(facet, row, query.facets[facet.key] ?? []))
                return false;
        }
        return true;
    });
}
/**
 * How many rows each option of each facet would yield.
 *
 * Counted with that facet's OWN selection lifted, which is what makes the
 * numbers useful: while filtering by `kind=product`, the count beside
 * `kind=demo` should say how many demos there are, not zero.
 */
export function facetCounts(rows, spec, query) {
    const out = {};
    for (const facet of spec.facets) {
        const others = { ...query, facets: { ...query.facets, [facet.key]: [] } };
        const pool = matches(rows, spec, others);
        const tally = {};
        for (const option of facet.options ?? []) {
            tally[option] = pool.filter((row) => facetMatches(facet, row, [option])).length;
        }
        out[facet.key] = tally;
    }
    return out;
}
/** Filter, sort, count and page in one pass. */
export function applyQuery(rows, spec, query) {
    const passed = matches(rows, spec, query);
    const sort = spec.sorts.find((s) => s.key === query.sort) ?? spec.sorts[0];
    const sorted = sort ? [...passed].sort(compareBy(sort.by, query.dir)) : passed;
    const page = pageOf(sorted.length, query.page, query.pageSize);
    return {
        rows: sorted.slice(page.from, page.to),
        matched: passed.length,
        total: rows.length,
        page,
        counts: facetCounts(rows, spec, query),
    };
}
