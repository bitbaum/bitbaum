// Is each venture's address actually up?
//
// The stage a venture shows is an editorial judgment in overrides.json, and
// a judgment typed once goes stale. Found 2026-10-18: Diplodoctor and Causius
// had been running for five weeks — health endpoints green, changelogs moving
// — under "Named, not built", because nothing ever compared the word to the
// world. So the build asks the world: every shown venture's address is
// fetched once per online build, the answers are kept in live.snapshot.json
// (so an offline build and --check render the same pages), and a venture
// typed "not built" whose address answers is shown as in development at the
// least, with a warning that names the stale line. A stage is only ever
// raised this way, never lowered: a site that is down for a minute is not a
// site that was never built.

/** An answer from a server that exists: success, a redirect, or a door that asks for a code. */
export function isRunning(status) {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

/** One address, followed through redirects; 0 when nothing answers. */
export async function probe(url, fetcher = fetch) {
  try {
    const res = await fetcher(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "bitbaum-site-build (+https://bitbaum.orangecat.ch)" },
    });
    return res.status;
  } catch {
    return 0;
  }
}

/** Every address at once, in a stable order so the snapshot only changes when an answer does. */
export async function probeAll(urls, fetcher = fetch) {
  const unique = [...new Set(urls.filter(Boolean))].sort();
  const statuses = await Promise.all(unique.map((u) => probe(u, fetcher)));
  return Object.fromEntries(unique.map((u, i) => [u, { status: statuses[i], running: isRunning(statuses[i]) }]));
}

/** The stage to show: the typed one, raised from "not built" when the address answers. */
export function shownStage(typed, running) {
  return typed === "next" && running ? "development" : typed;
}
