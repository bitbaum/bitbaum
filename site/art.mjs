// The site's creatures and things: one painted set, made for this site in a
// single hand — gouache and pencil on paper, the palette of a foggy evening —
// and cut out onto transparency (site/art/, sizes in site/art/index.json).
// Pages place them as plain images: lazy, async-decoded, sized, so nothing
// shifts while they arrive and nothing is fetched before it is near.

import { readFileSync } from "node:fs";

const INDEX = JSON.parse(readFileSync(new URL("./art/index.json", import.meta.url), "utf8"));
export const ART_NAMES = Object.keys(INDEX);

// fig("cow", "extra-class", { href, label }) — an image, or a labelled door.
export function fig(name, cls = "", { href, label, eager = false } = {}) {
  const size = INDEX[name];
  if (!size) throw new Error(`art ${name} is not in site/art/index.json`);
  const img = `<img class="fig fig-${name}${cls ? ` ${cls}` : ""}" src="/art/${name}.webp" width="${size[0]}" height="${size[1]}" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">`;
  if (!href) return img;
  return `<a class="door door-${name}" href="${href}" aria-label="${label}" data-label="${label} &rarr;">${img}</a>`;
}
