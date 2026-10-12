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
    client: p.client ?? null,
    since: p.since ?? null,
    urls: p.urls ?? {},
    identity: publicIdentity(p.slug, p.identity),
  };
}

/**
 * Client work reaches the published map only with the client's consent
 * (Loki records it; `client.consentedAt`). An entry from before that field
 * existed is judged by its layer, and `clientSlugs` (overrides marked
 * `"client": true`) catches what the map itself cannot tell, so an old
 * snapshot cannot leak one.
 */
function shownPublicly(p, clientSlugs) {
  const client = clientSlugs.has(p.slug) || ("client" in p ? p.client != null : p.layer === "client");
  return !client || Boolean(p.client?.consentedAt);
}

/** Strip ops fields and unconsented client work; keep catalogue facts agents need. */
export function publicMap(map, clientSlugs = new Set()) {
  const projects = (map.projects ?? []).filter((p) => shownPublicly(p, clientSlugs));
  const hidden = (map.projects ?? []).length - projects.length;
  // The counts must not say what the list leaves out.
  const summary = map.summary
    ? {
        ...map.summary,
        projects: Math.max(0, (map.summary.projects ?? 0) - hidden),
        clients: projects.filter((p) => p.client?.consentedAt).length,
      }
    : null;
  return {
    generatedAt: map.generatedAt ?? null,
    thesis: map.thesis ?? null,
    pillars: map.pillars ?? [],
    summary,
    projects: projects.map(publicProject),
  };
}
