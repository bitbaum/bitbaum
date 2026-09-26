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
const RIGS = read("./art/rig/index.json");
export const ART_NAMES = Object.keys(INDEX);

const lazy = (eager) => (eager ? 'fetchpriority="high"' : 'loading="lazy"');

function puppet(name, cls, eager) {
  const rig = RIGS[name];
  const [w, h] = rig.size;
  const layer = ([pname, p]) => {
    const [x, y, pw, ph] = p.box;
    const style = `left:${x}%;top:${y}%;width:${pw}%;height:${ph}%;transform-origin:${p.origin[0]}% ${p.origin[1]}%;--a0:${p.a[0]}deg;--a1:${p.a[1]}deg;animation-duration:${p.dur}s;animation-delay:${p.delay}s`;
    return `<img class="pp pp-${pname}" src="/art/rig/${name}.${pname}.webp" alt="" ${lazy(eager)} decoding="async" draggable="false" style="${style}">`;
  };
  const parts = Object.entries(rig.parts);
  return `<span class="fig puppet fig-${name}${cls ? ` ${cls}` : ""}">${parts.filter(([, p]) => p.under).map(layer).join("")}<img class="pp-body" src="/art/rig/${name}.body.webp" width="${w}" height="${h}" alt="" ${lazy(eager)} decoding="async" draggable="false">${parts.filter(([, p]) => !p.under).map(layer).join("")}</span>`;
}

// fig("cow", "extra-class", { href, label }) — a figure, or a labelled door.
export function fig(name, cls = "", { href, label, eager = false, still = false } = {}) {
  const size = INDEX[name];
  if (!size) throw new Error(`art ${name} is not in site/art/index.json`);
  const body = RIGS[name] && !still
    ? puppet(name, cls, eager)
    : `<img class="fig fig-${name}${cls ? ` ${cls}` : ""}" src="/art/${name}.webp" width="${size[0]}" height="${size[1]}" alt="" ${lazy(eager)} decoding="async" draggable="false">`;
  if (!href) return body;
  return `<a class="door door-${name}" href="${href}" aria-label="${label}" data-label="${label} &rarr;">${body}</a>`;
}
