// The site's creatures and things, drawn as one set: 19th-century natural-
// history engraving. A clean contour, the body laid in with fine parallel
// hatching (#engrave, which also carries the paper, so a figure hides what is
// behind it), the shadowed side in cross-hatch (#engrave-x), and a few drawn
// details. By day ink on cream; by night light cut into dark, like
// scratchboard. The patterns live in DEFS, once per page; styles.css colours
// them from the theme, so every figure changes with the time of day.

export const DEFS = `<pattern id="engrave" width="1.9" height="1.9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect class="pat-paper" width="1.9" height="1.9"/><path class="pat-line" d="M0 0.95H1.9"/></pattern><pattern id="engrave-x" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-48)"><path class="pat-x" d="M0 0.75H1.5M0.75 0V1.5"/></pattern>`;

// A figure standing on a horizon. `href` makes it a door to a page.
export function critter(cls, svg, href, label) {
  if (!href) return `<span class="critter ${cls}">${svg}</span>`;
  return `<a class="critter ${cls}" href="${href}" aria-label="${label}" data-label="${label} &rarr;">${svg}</a>`;
}

// Heidi's cow: Swiss, spotted, with her bell, grazing.
export const COW = `<svg viewBox="0 0 120 80" aria-hidden="true">
  <path class="ink-far" d="M28 50L27 76L31 76L33 52ZM80 52L82 76L86 76L85 50Z"/>
  <path class="ink-body" d="M20 34C22 26 34 23 50 23C64 23 76 22 86 25C92 27 95 31 96 35C97 42 94 47 90 50L88 76L84 76L83 52C74 55 62 56 52 55L46 55C44 60 43 68 43 76L39 76L38 54C32 53 27 51 25 48L24 76L20 76L20 47C18 43 18 38 20 34Z"/>
  <path class="ink-shade" d="M25 48C34 51 44 53 52 53C64 54 76 52 90 48L90 50C82 54 70 56 52 55C40 55 30 53 25 50Z"/>
  <path class="ink-spot" d="M38 30C44 25 54 28 53 34C52 40 43 41 38 36C36 34 36 32 38 30ZM68 28C74 25 81 29 79 35C77 40 70 39 68 35C67 32 67 30 68 28ZM24 36C27 33 31 34 31 38C31 42 26 44 23 42Z"/>
  <g class="cow-head"><path class="ink-body" d="M93 32C99 30 105 32 108 37L113 50C114 55 110 58 106 56C103 55 101 52 100 48L95 42Z"/>
  <path class="ink-shade" d="M106 56C110 58 114 55 113 50L110 49C110 53 108 55 106 56Z"/>
  <path class="ink-line" d="M100 32C101 28 104 26.5 107 27.5M95 35C91 34 89 37 91.5 39C93.5 38.5 95 37.5 96.5 37M107 50.5C108 51.5 109.5 51.5 110.5 50.5"/><circle class="ink-dot" cx="104" cy="38" r="1"/></g>
  <path class="ink-line" d="M96 44C97.5 47 99.5 48.5 101 48.5"/><path class="ink-bell" d="M98.5 48.5H103.5L104.5 55H97.5Z"/>
  <path class="ink-line" d="M60 55C61 59 66 59 67 55"/>
  <g class="cow-tail"><path class="ink-line" d="M20 34C15 38 13.5 48 14.5 58"/><path class="ink-body" d="M14.5 57C12.5 59 12.5 62 14.5 63.5C16.5 62 16.5 59 14.5 57Z"/></g>
</svg>`;

// Diplodoctor's diplodocus: neck raised into the canopy, browsing.
export const DIPLODOCUS = `<svg viewBox="0 0 200 80" aria-hidden="true">
  <path class="ink-far" d="M93 60L92 78L97.5 78L99 60ZM119 55L121 78L126.5 78L124 53Z"/>
  <path class="ink-body" d="M126 45C150 45 176 53 199 66C176 60 150 57 126 56Z"/>
  <g class="dip-neck"><path class="ink-body" d="M77 45C66 37 58 23 50 9C48 5.5 45 4.5 42 5.5L41 9.5C44 9.5 46 10.5 47.5 12.5C54 26 62 41 72 53Z"/>
  <path class="ink-body" d="M34 4.5C36 1 43 0.5 45.5 3.5C46.5 6.5 44 8.5 40 8.5C36.5 8.5 33.5 7.5 34 4.5Z"/><circle class="ink-dot" cx="38.6" cy="4.4" r="0.8"/>
  <path class="ink-line" d="M62 30C60 28 58.5 25 57.5 22M68 40C66 38 64.5 35.5 63.5 33"/></g>
  <path class="ink-body" d="M70 50C72 40 84 34 100 34C114 34 124 40 128 48C130 54 126 58 118 60L116 78L110 78L110 62C104 63 96 63 90 62L90 78L84 78L84 60C76 58 70 56 70 50Z"/>
  <path class="ink-shade" d="M72 54C80 58 92 60 104 60C114 60 122 58 128 53C127 57 122 59 118 60C108 62 96 63 88 61C80 60 74 58 72 54Z"/>
  <path class="ink-line" d="M84 40C92 37 104 37 114 40M95 45Q96 50 95 55M103 45Q104 50 103 55"/>
</svg>`;

// A roe deer, alert, one foreleg raised.
export const DEER = `<svg viewBox="0 0 70 80" aria-hidden="true">
  <path class="ink-far" d="M24 51L24 78L27 78L27.5 52ZM45 50L47 78L50 78L48 49Z"/>
  <path class="ink-body" d="M16 40C18 34 28 32 40 33C48 34 52 38 52 43C52 47 49 49 46 50L50 64L47 65L43 52C36 53 28 53 22 52L21 78L18 78L18 50C15 48 15 44 16 40Z"/>
  <path class="ink-shade" d="M18 48C26 51 36 51.5 46 49L46 50C38 53 28 53.5 20 51.5Z"/>
  <g class="deer-head"><path class="ink-body" d="M45 37C47 31 50 25 53 21L58 23C56 28 53 34 51 40Z"/>
  <path class="ink-body" d="M52 21C53 17 57 15 60 17L66 22C67 24 65 25 63 24L58 24C55 25 53 24 52 21Z"/><circle class="ink-dot" cx="58" cy="19.5" r="0.8"/>
  <path class="ink-body" d="M54 17L50 12L55.5 15ZM57 16L58 10L59.5 16Z"/>
  <path class="ink-line" d="M55 15L53 7L50.5 4M53 7L55 3.5M58 14.5L60 6.5L63 4M60 6.5L58.5 3"/></g>
  <path class="ink-line" d="M16 39L13.5 37.5M47 65L49 66"/>
</svg>`;

// Don Quixote on bony Rocinante, lance levelled; Sancho behind on his donkey.
export const QUIXOTE = `<svg viewBox="0 0 150 100" aria-hidden="true">
  <path class="ink-far" d="M48 68L47 98L50.5 98L52 69ZM79 67L81 98L84.5 98L82 66ZM11 78L10 98L13 98L14 79ZM28 78L29 98L32 98L30.5 77Z"/>
  <path class="ink-body" d="M40 58C44 52 60 50 76 51C84 52 88 55 89 60C89 64 86 66 82 67L85 98L81 98L77 69C68 70 58 70 50 69L46 98L42 98L43 67C39 65 38 62 40 58Z"/>
  <path class="ink-body" d="M84 56C88 48 92 42 96 38L104 40L108 48C108.5 51 106.5 52.5 104 51L99 47C96 52 92 58 89 62Z"/><path class="ink-body" d="M97 38.5L96 33L99.5 37.5Z"/><circle class="ink-dot" cx="100.5" cy="42" r="0.7"/>
  <path class="ink-shade" d="M43 66C54 69 70 69 82 66L82 67C70 70 54 70.5 43 68Z"/>
  <path class="ink-line" d="M40 58C35 62 34 72 36 82M58 54.5Q57 61 59 66.5M63 54Q62 61 64 67M68 54Q67 61 69 67M73 54.5Q72 61 74 66.5"/>
  <path class="ink-body" d="M61.5 51L63.5 30C63.8 27 68.2 26.5 69 29.5L70.5 51Z"/>
  <path class="ink-line" d="M66 51L71 60L69 73M68 33L75 39"/>
  <circle class="ink-body" cx="66.8" cy="22.5" r="3.3"/><path class="ink-body" d="M62.4 21.4C62.8 16 71 16 71.4 21.4Z"/><path class="ink-line" d="M60.6 21.4H73.2M66.4 25.8L65.8 29.8"/>
  <path class="ink-lance" d="M57 45L148 30"/><ellipse class="ink-body" cx="61" cy="39" rx="3.6" ry="4.8"/>
  <path class="ink-body" d="M6 72C8 66 18 64 28 65C33 66 35 69 35 73C35 76 33 77 30 78L31 98L28 98L26 79C20 80 14 80 11 79L10 98L7 98L7 77C5 75 5 74 6 72Z"/>
  <path class="ink-body" d="M32 68C35 63 38 60 41 60L44.5 64C44.5 66.5 42.5 67.5 40.5 66.5L36.5 70.5Z"/><path class="ink-body" d="M39 60.5L37.5 51.5L40.8 59.5ZM41.5 60L43.5 51.5L43 60.5Z"/>
  <path class="ink-shade" d="M8 76C16 79 24 79 32 76.5L31 78C24 80 16 80 9 78Z"/>
  <circle class="ink-body" cx="18.5" cy="57" r="8.2"/><path class="ink-shade" d="M11 60C13 64 20 66 25 62C25.5 63.5 23 66 18.5 65.2C14.5 64.8 12 63 11 60Z"/>
  <circle class="ink-body" cx="19.5" cy="45.5" r="4.3"/><path class="ink-body" d="M15.6 42.3C16 38 23 38 23.4 42.3Z"/><path class="ink-line" d="M12.8 42.3H26.2M20.5 63L24.5 71L23.5 79"/>
</svg>`;

// A La Mancha windmill: whitewashed drum, conical cap, lattice sails turning.
export const WINDMILL = `<svg viewBox="0 0 60 92" aria-hidden="true">
  <path class="ink-body" d="M21 90L25 42H35L39 90Z"/><path class="ink-shade" d="M32 42H35L39 90H33.5Z"/>
  <path class="ink-body" d="M23.5 42.5Q30 29 36.5 42.5Z"/><path class="ink-shade" d="M30.5 32Q34.5 36 36.5 42.5H31Z"/>
  <path class="ink-line" d="M28.4 90V82Q30 79 31.6 82V90M28.8 58.5H31.2V62H28.8Z"/>
  <g class="sails">${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 30 38)"><path class="ink-line spar" d="M30 38V7"/><path class="ink-lattice" d="M30.8 9H37.2V33H30.8M30.8 13H37.2M30.8 17H37.2M30.8 21H37.2M30.8 25H37.2M30.8 29H37.2M34 9V33"/></g>`).join("")}<circle class="ink-body" cx="30" cy="38" r="1.8"/></g>
</svg>`;

// Clockwork spilled from the melting watch: three brass wheels, meshing.
function gearPath(cx, cy, r, teeth, depth) {
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, w = Math.PI / teeth;
    for (const [da, rr] of [[-w * 0.55, r], [-w * 0.32, r + depth], [w * 0.32, r + depth], [w * 0.55, r]]) {
      pts.push(`${(cx + Math.cos(a + da) * rr).toFixed(2)} ${(cy + Math.sin(a + da) * rr).toFixed(2)}`);
    }
  }
  const hub = r * 0.22, rim = r * 0.72;
  const circle = (R) => `M${cx + R} ${cy}A${R} ${R} 0 1 0 ${cx - R} ${cy}A${R} ${R} 0 1 0 ${cx + R} ${cy}Z`;
  // Four windows between the spokes, cut out with the even-odd rule.
  const windows = [0, 1, 2, 3].map((k) => {
    const a0 = (k / 4) * Math.PI * 2 + 0.28, a1 = ((k + 1) / 4) * Math.PI * 2 - 0.28, r0 = hub * 1.7;
    const p = (a, R) => `${(cx + Math.cos(a) * R).toFixed(2)} ${(cy + Math.sin(a) * R).toFixed(2)}`;
    return `M${p(a0, r0)}L${p(a0, rim)}A${rim} ${rim} 0 0 1 ${p(a1, rim)}L${p(a1, r0)}A${r0} ${r0} 0 0 0 ${p(a0, r0)}Z`;
  }).join("");
  return `M${pts.join("L")}Z${windows}${circle(hub)}`;
}
export const GEARS = `<svg class="gears" viewBox="0 0 120 70" aria-hidden="true">
  <g class="gear g1"><path class="ink-brass" fill-rule="evenodd" d="${gearPath(40, 40, 22, 18, 3.4)}"/></g>
  <g class="gear g2"><path class="ink-brass" fill-rule="evenodd" d="${gearPath(76.7, 29.5, 13, 11, 3)}"/></g>
  <g class="gear g3"><path class="ink-brass" fill-rule="evenodd" d="${gearPath(95, 44.7, 8, 7, 2.6)}"/></g>
</svg>`;
