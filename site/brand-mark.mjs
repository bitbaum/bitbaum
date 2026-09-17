// SSOT for the bitbaum mark — a recursive binary tree.
//
// The name is the brief: bit + Baum. The site's one claim is "One trunk. Many
// products." A tree whose every branch splits in two is both at once, and it
// is a RULE rather than a drawing: the only thing that changes with size is
// how many generations are drawn. A poster gets four, a page header three, a
// favicon two. Nothing is ever redrawn by hand, so the favicon cannot drift
// from the logo — the same discipline as Loki's spiralPathD(), which exists
// because three hand-copied spirals had already diverged.
//
// Every asset derives from markSvg(). Never hand-edit an SVG.

export const TREE = {
  /** Square viewBox edge; all geometry below lives in this space. */
  viewBox: 100,
  /** Angle each branch turns away from its parent, in degrees. */
  spread: 34,
  /** How much shorter each generation is than the one before. */
  shrink: 0.68,
  /** Length of the trunk before the first split. */
  trunk: 34,
  /** Even margin inside the box, so the mark optically centres itself. */
  margin: 10,
};

/** Line segments of the tree, as [x1, y1, x2, y2]. Pure geometry. */
export function treeSegments(depth, p = TREE) {
  const out = [];
  const walk = (x, y, len, angle, d) => {
    const rad = (angle * Math.PI) / 180;
    const x2 = x + len * Math.sin(rad);
    const y2 = y - len * Math.cos(rad);
    out.push([x, y, x2, y2]);
    if (d === 0) return;
    walk(x2, y2, len * p.shrink, angle - p.spread, d - 1);
    walk(x2, y2, len * p.shrink, angle + p.spread, d - 1);
  };
  walk(p.viewBox / 2, p.viewBox - 5, p.trunk, 0, depth);
  return out;
}

/**
 * The mark as an SVG path `d`, fitted to the box.
 *
 * The fit is measured, not guessed: a tree grows upward from a fixed root, so
 * without measuring its own bounding box every depth would sit at a different
 * height and the header logo would jump when the depth changed.
 */
export function markPathD(depth, stroke, p = TREE) {
  const segs = treeSegments(depth, p);
  const pad = p.margin + stroke / 2;
  const xs = segs.flatMap(([x1, , x2]) => [x1, x2]);
  const ys = segs.flatMap(([, y1, , y2]) => [y1, y2]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  const s = Math.min((p.viewBox - 2 * pad) / w, (p.viewBox - 2 * pad) / h);
  const dx = (p.viewBox - w * s) / 2 - minX * s;
  const dy = (p.viewBox - h * s) / 2 - minY * s;
  return segs
    .map(([x1, y1, x2, y2]) =>
      `M${(x1 * s + dx).toFixed(1)} ${(y1 * s + dy).toFixed(1)}L${(x2 * s + dx).toFixed(1)} ${(y2 * s + dy).toFixed(1)}`,
    )
    .join("");
}

/** Standalone SVG markup. `currentColor` so the mark inherits the theme. */
export function markSvg(depth, stroke, { standalone = false, label = "bitbaum" } = {}) {
  const attrs = standalone
    ? ` xmlns="http://www.w3.org/2000/svg" width="100" height="100"`
    : "";
  return (
    `<svg${attrs} viewBox="0 0 ${TREE.viewBox} ${TREE.viewBox}" role="img" aria-label="${label}">` +
    `<path d="${markPathD(depth, stroke)}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/** The three sizes the site actually uses. */
export const MARK_HEADER = () => markSvg(3, 7);
export const MARK_FAVICON = () => markSvg(2, 9.5, { standalone: true });
export const MARK_POSTER = () => markSvg(4, 5, { standalone: true });
