/**
 * Agent-facing map for /map.json — same shape as Loki's fleet map, without
 * ops changelog / now / next prose (secrets, paths, emails, wallet detail).
 * The full map stays in map.snapshot.json for the builder; only this redacted
 * view is published next to the HTML.
 */

const STUDIO_MISSION =
  "bitbaum builds AI-native products on shared open infrastructure so more than one person can ship here and be treated fairly.";

function publicIdentity(slug, identity) {
  if (!identity || typeof identity !== "object") return identity ?? null;
  const out = { ...identity };
  if (slug === "bitbaum" && /solo-founder/i.test(String(out.mission ?? ""))) {
    out.mission = STUDIO_MISSION;
  }
  return out;
}

function publicProject(p) {
  return {
    slug: p.slug,
    name: p.name,
    what: p.what,
    stack: p.stack,
    layer: p.layer ?? null,
    status: p.status,
    owner: p.owner,
    since: p.since ?? null,
    urls: p.urls ?? {},
    identity: publicIdentity(p.slug, p.identity),
  };
}

/**
 * Strip ops fields; keep catalogue facts agents need. Only the ventures the
 * site shows are listed: the register may carry rows the site does not, and
 * map.json once published client work the pages never named.
 */
export function publicMap(map, shown = null) {
  return {
    generatedAt: map.generatedAt ?? null,
    thesis: map.thesis ?? null,
    pillars: map.pillars ?? [],
    summary: map.summary ?? null,
    projects: (map.projects ?? [])
      .filter((p) => !shown || shown.has(p.slug))
      .map(publicProject),
  };
}
