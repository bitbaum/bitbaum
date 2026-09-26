// The site's creatures and things: one painted set, made for this site in a
// single hand — gouache and pencil on paper, the palette of a foggy evening —
// and cut out onto transparency (site/art/, sizes in site/art/index.json).
//
// The creatures move the way Norstein's did: cut-out animation. Each painting
// is cut into its body and its moving parts (site/art-src/rigs.json, sliced by
// site/art-src/slice.py into site/art/rig/); here the parts are stacked over
// the body, each turning on its own joint between two angles (styles.css,
// @keyframes swing). Everything is a plain lazy image, sized in advance, so
// nothing shifts as it arrives.

import { readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const INDEX = read("./art/index.json");
export const ART_NAMES = Object.keys(INDEX);

const lazy = (eager) => (eager ? 'fetchpriority="high"' : 'loading="lazy"');

// A rigged figure is ONE painting, bent on a mesh by warp.mjs (never cut
// into pieces: pieces show seams). The rig — each moving part's outline,
// joint and swing — travels with it as data-rig.
const RIGS_SRC = read("./art-src/rigs.json");
function puppet(name, cls, eager) {
  const [w, h] = INDEX[name];
  const rig = Object.values(RIGS_SRC[name].parts).map((p) => ({ poly: p.poly, pivot: p.pivot, a: p.a, dur: p.dur, delay: p.delay || 0, mode: p.mode || "swing", ...(p.rigid ? { rigid: true } : {}) }));
  return `<span class="fig puppet fig-${name}${cls ? ` ${cls}` : ""}" data-rig='${JSON.stringify(rig)}'><img class="pp-body" src="/art/${name}.webp" width="${w}" height="${h}" alt="" ${lazy(eager)} decoding="async" draggable="false"></span>`;
}

// fig("cow", "extra-class", { href, label }) — a figure, or a labelled door.
export function fig(name, cls = "", { href, label, eager = false, still = false } = {}) {
  const size = INDEX[name];
  if (!size) throw new Error(`art ${name} is not in site/art/index.json`);
  const body = RIGS_SRC[name]?.parts && !still
    ? puppet(name, cls, eager)
    : `<img class="fig fig-${name}${cls ? ` ${cls}` : ""}" src="/art/${name}.webp" width="${size[0]}" height="${size[1]}" alt="" ${lazy(eager)} decoding="async" draggable="false">`;
  if (!href) return body;
  return `<a class="door door-${name}" href="${href}" aria-label="${label}" data-label="${label} &rarr;">${body}</a>`;
}
