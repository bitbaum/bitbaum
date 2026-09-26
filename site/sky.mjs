// One sky behind every page. The site is a single landscape you fall
// through: the hero stands on the ground, and every section below is more of
// the same sky, drifting past a little slower than the page as you scroll.
// The theme is the time of day — dark is night (stars, the Milky Way, the
// molecule constellations, shooting stars), light is a pale Dalí day (a few
// soft clouds, the moon still up). The moon is always in today's real phase,
// its maria and bright craters where they really are.
//
// It also owns the palette the drawn scenes use, so a scene and its sky are
// always painted from the same colours: `palette` is updated when the theme
// changes, and scenes read it every frame.

const root = document.documentElement;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PARALLAX = still ? 0 : 0.3;

export const palette = { night: true, line: "235, 229, 216", signal: "62, 224, 143", hot: "255, 255, 255" };
function readPalette() {
  const cs = getComputedStyle(root);
  palette.night = root.classList.contains("dark");
  palette.line = cs.getPropertyValue("--line-rgb").trim().split(/\s+/).join(", ") || palette.line;
  palette.signal = cs.getPropertyValue("--signal-rgb").trim().split(/\s+/).join(", ") || palette.signal;
  palette.hot = palette.night ? "255, 255, 255" : palette.signal;
}
readPalette();

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── molecules, as skeletal formulas in bond lengths (y up) ─────────────────
const INDOLE = {
  C3a: [0.866, 0.5], C4: [0, 1], C5: [-0.866, 0.5], C6: [-0.866, -0.5], C7: [0, -1], C7a: [0.866, -0.5],
  N1: [1.817, -0.809], C2: [2.405, 0], C3: [1.817, 0.809],
};
const INDOLE_BONDS = [
  ["C3a", "C4"], ["C4", "C5", 2], ["C5", "C6"], ["C6", "C7", 2], ["C7", "C7a"], ["C7a", "C3a", 2],
  ["C7a", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C3a"],
];
const ARM = { Ca: [2.126, 1.76], Cb: [3.104, 1.968], N: [3.413, 2.919], Me1: [4.391, 3.127], Me2: [2.744, 3.662] };
const ARM_BONDS = [["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["N", "Me1"], ["N", "Me2"]];

export const MOLECULES = {
  dmt: { atoms: { ...INDOLE, ...ARM }, bonds: [...INDOLE_BONDS, ...ARM_BONDS] },
  meo: { atoms: { ...INDOLE, ...ARM, O: [-1.732, 1], Me3: [-1.732, 2] }, bonds: [...INDOLE_BONDS, ...ARM_BONDS, ["C5", "O"], ["O", "Me3"]] },
  psilocybin: {
    atoms: { ...INDOLE, ...ARM, O: [0, 2], P: [-0.866, 2.5], O2: [-0.866, 3.5], O3: [-1.866, 2.5], O4: [-1.4, 1.65] },
    bonds: [...INDOLE_BONDS, ...ARM_BONDS, ["C4", "O"], ["O", "P"], ["P", "O2", 2], ["P", "O3"], ["P", "O4"]],
  },
  serotonin: {
    atoms: { ...INDOLE, Ca: ARM.Ca, Cb: ARM.Cb, N: ARM.N, O: [-1.732, 1] },
    bonds: [...INDOLE_BONDS, ["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["C5", "O"]],
  },
  // Ergoline: benzene and ring C share C11–C16, the pyrrole bridges their peri
  // positions through C16, ring D shares C5–C10 with ring C.
  lsd: {
    atoms: {
      C16: [0.866, 0.5], C15: [0, 1], C14: [-0.866, 0.5], C13: [-0.866, -0.5], C12: [0, -1], C11: [0.866, -0.5],
      N1: [0.37, 1.95], C2: [1.36, 1.95], C3: [1.732, 1], C4: [2.598, 0.5], C5: [2.598, -0.5], C10: [1.732, -1],
      N6: [3.464, -1], C7: [3.464, -2], C8: [2.598, -2.5], C9: [1.732, -2], Me: [4.33, -0.5],
      Cam: [2.598, -3.5], O: [1.732, -4], Nam: [3.464, -4], E1: [3.464, -5], E2: [4.33, -5.5], E3: [4.33, -3.5], E4: [5.196, -4],
    },
    bonds: [
      ["C16", "C15"], ["C15", "C14", 2], ["C14", "C13"], ["C13", "C12", 2], ["C12", "C11"], ["C11", "C16", 2],
      ["C15", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C16"], ["C3", "C4"], ["C4", "C5"], ["C5", "C10"], ["C10", "C11"],
      ["C5", "N6"], ["N6", "C7"], ["C7", "C8"], ["C8", "C9"], ["C9", "C10", 2], ["N6", "Me"],
      ["C8", "Cam"], ["Cam", "O", 2], ["Cam", "Nam"], ["Nam", "E1"], ["E1", "E2"], ["Nam", "E3"], ["E3", "E4"],
    ],
  },
  mdma: {
    atoms: {
      p0: [0.866, 0.5], p1: [0, 1], p2: [-0.866, 0.5], p3: [-0.866, -0.5], p4: [0, -1], p5: [0.866, -0.5],
      O1: [-1.817, 0.809], CH2: [-2.405, 0], O2: [-1.817, -0.809], Ca: [1.732, 1], Cb: [2.598, 0.5], Me: [2.598, -0.5], N: [3.464, 1], NMe: [4.33, 0.5],
    },
    bonds: [
      ["p0", "p1"], ["p1", "p2", 2], ["p2", "p3"], ["p3", "p4", 2], ["p4", "p5"], ["p5", "p0", 2],
      ["p2", "O1"], ["O1", "CH2"], ["CH2", "O2"], ["O2", "p3"], ["p0", "Ca"], ["Ca", "Cb"], ["Cb", "Me"], ["Cb", "N"], ["N", "NMe"],
    ],
  },
  ketamine: {
    atoms: {
      r0: [0.866, 0.5], r1: [0, 1], r2: [-0.866, 0.5], r3: [-0.866, -0.5], r4: [0, -1], r5: [0.866, -0.5], O: [1.732, -1],
      i: [1.866, 0.5], a1: [2.366, 1.366], a2: [3.366, 1.366], a3: [3.866, 0.5], a4: [3.366, -0.366], a5: [2.366, -0.366],
      Cl: [1.866, 2.232], N: [1.125, 1.466], Me: [0.418, 2.173],
    },
    bonds: [
      ["r0", "r1"], ["r1", "r2"], ["r2", "r3"], ["r3", "r4"], ["r4", "r5"], ["r5", "r0"], ["r5", "O", 2],
      ["r0", "i"], ["i", "a1", 2], ["a1", "a2"], ["a2", "a3", 2], ["a3", "a4"], ["a4", "a5", 2], ["a5", "i"], ["a1", "Cl"], ["r0", "N"], ["N", "Me"],
    ],
  },
  // A nonapeptide of some seventy heavy atoms, drawn by residue: a ring of six
  // closed by the disulfide bridge (the two larger stars), and a tail of three.
  oxytocin: {
    atoms: {
      cys1: [0, 1.307], tyr2: [0.924, 0.924], ile3: [1.307, 0], gln4: [0.924, -0.924], asn5: [0, -1.307], cys6: [-0.924, -0.924],
      S6: [-1.307, 0], S1: [-0.924, 0.924], pro7: [-1.631, -1.631], leu8: [-2.597, -1.89], gly9: [-3.304, -2.597], Nt: [-4.27, -2.856],
    },
    bonds: [
      ["cys1", "tyr2"], ["tyr2", "ile3"], ["ile3", "gln4"], ["gln4", "asn5"], ["asn5", "cys6"], ["cys6", "S6"], ["S6", "S1"], ["S1", "cys1"],
      ["cys6", "pro7"], ["pro7", "leu8"], ["leu8", "gly9"], ["gly9", "Nt"],
    ],
  },
};
const element = (k) => (/^N/.test(k) && k !== "NMe" ? "N" : /^O/.test(k) ? "O" : /^S\d/.test(k) ? "S" : k === "P" ? "P" : k === "Cl" ? "Cl" : "C");

// ── the moon, in today's phase ─────────────────────────────────────────────
// A reference new moon (2000-01-06 18:14 UTC) and the synodic month.
export function lunarPhase(date = new Date()) {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  return (((days / 29.530588853) % 1) + 1) % 1; // 0 new, .25 first quarter, .5 full
}
// Maria and bright craters in disc coordinates (x right, y up, as seen from
// the northern hemisphere), roughly where they are on the real near side.
const MARIA = [
  [-0.56, 0.12, 0.3, 0.5], [-0.28, 0.43, 0.26, 0.22], [0.17, 0.38, 0.16, 0.15], [0.33, 0.12, 0.2, 0.18],
  [0.66, 0.3, 0.11, 0.09], [0.55, -0.15, 0.13, 0.15], [0.33, -0.27, 0.09, 0.09], [-0.22, -0.36, 0.18, 0.14],
  [-0.48, -0.33, 0.09, 0.09], [0.02, 0.63, 0.45, 0.07], [0.03, 0.16, 0.08, 0.06],
];
const BRIGHT = [[-0.12, -0.62, 0.045, "rays"], [-0.3, 0.13, 0.04], [-0.52, 0.12, 0.028], [-0.62, 0.35, 0.025]];

function noise2(seed) {
  const r = rng(seed), g = [...Array(256)].map(() => r());
  const h = (x, y) => g[(((x * 73856093) ^ (y * 19349663)) >>> 0) % 256];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  };
}

function renderMoon(radius, dpr, phase, night) {
  const size = Math.ceil(radius * 2 * dpr) + 2;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  const n = noise2(3);
  const fbm = (x, y) => n(x, y) * 0.5 + n(x * 2.1, y * 2.1) * 0.25 + n(x * 4.3, y * 4.3) * 0.15 + n(x * 9, y * 9) * 0.1;
  const a = phase * Math.PI * 2;
  const L = [Math.sin(a), 0.12, -Math.cos(a)];
  const Ln = Math.hypot(...L);
  L[0] /= Ln; L[1] /= Ln; L[2] /= Ln;
  const L2n = Math.hypot(L[0], L[1]) || 1, L2 = [L[0] / L2n, L[1] / L2n];
  const cr = rng(11);
  const craters = [...Array(70)].map(() => {
    const ang = cr() * 6.283, d = Math.sqrt(cr()) * 0.95;
    return [Math.cos(ang) * d, Math.sin(ang) * d, 0.012 + Math.pow(cr(), 3) * 0.07];
  });
  const R = (size - 2) / 2;
  const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - size / 2) / R, y = -(py + 0.5 - size / 2) / R;
      const rr = x * x + y * y;
      if (rr > 1.02) continue;
      const edge = Math.max(0, Math.min(1, (1 - Math.sqrt(rr)) * R + 0.5));
      const z = Math.sqrt(Math.max(0, 1 - rr));
      // Albedo: highlands, darker maria with ragged shores, fine texture.
      let alb = 0.8 + (fbm(x * 3 + 7, y * 3 + 7) - 0.5) * 0.16;
      for (const [mx, my, rx, ry] of MARIA) {
        const d = Math.hypot((x - mx) / rx, (y - my) / ry) + (fbm(x * 5 + mx * 9, y * 5) - 0.5) * 0.55;
        alb -= 0.3 * (1 - smooth(0.75, 1.05, d));
      }
      let relief = 0;
      for (const [cx, cy, r] of craters) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) / r;
        if (d > 1.3) continue;
        const ux = dx / (d * r || 1), uy = dy / (d * r || 1);
        if (d < 1) { alb -= 0.05 * (1 - d); relief += 0.34 * smooth(0.5, 1, d) * -(ux * L2[0] + uy * L2[1]); }
        else relief += 0.22 * (1 - (d - 1) / 0.3) * (ux * L2[0] + uy * L2[1]);
      }
      for (const [bx, by, br, rays] of BRIGHT) {
        const d = Math.hypot(x - bx, y - by);
        alb += 0.28 * (1 - smooth(br * 0.6, br * 1.6, d));
        if (rays) {
          const ang = Math.atan2(y - by, x - bx);
          const ray = Math.pow(Math.abs(Math.cos(ang * 7 + 0.6)) * Math.abs(Math.cos(ang * 11 + 1.9)), 6);
          alb += 0.16 * ray * (1 - smooth(0.05, 0.75, d));
        }
      }
      const ndl = x * L[0] + y * L[1] + z * L[2];
      const lit = smooth(-0.04, 0.1, ndl) * (0.6 + 0.4 * Math.sqrt(Math.max(0, ndl)));
      const shade = Math.max(0, Math.min(1.2, alb * lit + relief * lit * 0.8));
      const earthshine = night ? 0.05 * alb : 0;
      const lum = Math.max(earthshine, shade);
      const i = (py * size + px) * 4;
      if (night) {
        img.data[i] = 22 + 222 * lum; img.data[i + 1] = 22 + 218 * lum; img.data[i + 2] = 26 + 204 * lum; img.data[i + 3] = 255 * edge;
      } else {
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 252; img.data[i + 3] = 235 * edge * Math.min(1, lum * 1.05);
      }
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// A soft glow, painted once per colour and then stamped: far cheaper than a
// fresh gradient per star per frame.
const sprites = new Map();
function glowSprite(rgb) {
  if (!sprites.has(rgb)) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb}, 1)`); grad.addColorStop(0.25, `rgba(${rgb}, 0.35)`); grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    sprites.set(rgb, c);
  }
  return sprites.get(rgb);
}

// ── the Little Prince, on B-612, looking up at a constellation ───────────
const YELLOW = "242, 196, 64";
function prince(ctx, x, y, s, t, lookX, lookY) {
  const line = palette.line, night = palette.night;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // The asteroid, with a volcano and the rose under her glass.
  ctx.fillStyle = night ? "rgba(14, 16, 26, 0.95)" : "rgba(236, 230, 218, 0.95)";
  ctx.strokeStyle = `rgba(${line}, 0.8)`; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(0, 26 * s, 24 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 0.7;
  for (const [cx, cy, r] of [[-9, 30, 3.2], [7, 38, 2.2], [11, 24, 1.6]]) { ctx.beginPath(); ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-19 * s, 11 * s); ctx.lineTo(-15.5 * s, 5.5 * s); ctx.lineTo(-12.5 * s, 5.5 * s); ctx.lineTo(-10 * s, 9 * s); ctx.stroke();
  ctx.beginPath(); ctx.arc(14 * s, 0, 4.5 * s, Math.PI, 0); ctx.lineTo(18.5 * s, 3.5 * s); ctx.lineTo(9.5 * s, 3.5 * s); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14 * s, 3.2 * s); ctx.lineTo(14 * s, -1.2 * s); ctx.stroke();
  ctx.fillStyle = `rgba(${line}, 0.8)`; ctx.beginPath(); ctx.arc(14 * s, -1.8 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
  // The boy: long coat, a turn of the head toward the stars, the scarf in the wind.
  ctx.strokeStyle = `rgba(${line}, 0.95)`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-1.5 * s, 2.5 * s); ctx.lineTo(-1.8 * s, -3 * s); ctx.moveTo(1.5 * s, 2.5 * s); ctx.lineTo(1.8 * s, -3 * s); ctx.stroke();
  ctx.fillStyle = night ? "rgba(96, 134, 110, 0.95)" : "rgba(70, 110, 88, 0.95)";
  ctx.beginPath(); ctx.moveTo(-4 * s, -3 * s); ctx.lineTo(-2.6 * s, -14 * s); ctx.lineTo(2.6 * s, -14 * s); ctx.lineTo(4 * s, -3 * s); ctx.closePath(); ctx.fill();
  const up = Math.atan2(lookY - (y - 18 * s), lookX - x);
  const hx = Math.cos(up) * 1.2 * s, hy = -18 * s + Math.sin(up) * 0.8 * s;
  ctx.fillStyle = night ? "rgba(236, 226, 206, 0.95)" : "rgba(250, 244, 232, 1)";
  ctx.beginPath(); ctx.arc(hx, hy, 3.6 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = `rgba(${YELLOW}, 0.95)`; ctx.lineWidth = 1;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(hx + k * 1.3 * s, hy - 3 * s); ctx.lineTo(hx + k * 1.9 * s, hy - 5.6 * s); ctx.stroke(); }
  const flutter = still ? 0 : Math.sin(t * 0.004) * 1.6;
  ctx.fillStyle = `rgba(${YELLOW}, 0.95)`;
  ctx.beginPath(); ctx.moveTo(-2 * s, -14 * s); ctx.quadraticCurveTo(-9 * s, (-16 + flutter) * s, -15 * s, (-13 + flutter) * s);
  ctx.lineTo(-14 * s, (-11 + flutter) * s); ctx.quadraticCurveTo(-8 * s, (-12.5 + flutter) * s, -2 * s, -12.2 * s); ctx.fill();
  ctx.restore();
}

// ── the dandelion clock ───────────────────────────────────────────────────
// It keeps the time of the visit. At the top of the page it is a flower; as
// you read on it closes and turns into a white clock; then its seeds lift off
// one by one and drift away across the sky, until by the footer the stem is
// bare. Scroll back and time runs backwards, as it does in the tree.
const SEEDS = 44;
const seedOrder = (() => { const r = rng(314); return [...Array(SEEDS).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i); })();
function pappus(ctx, x, y, dirx, diry, len, rgb, a, fine) {
  // A seed: a beak, and at its tip a starburst whose rays fork again.
  ctx.strokeStyle = `rgba(${rgb}, ${a})`;
  ctx.lineWidth = 0.7;
  const tx = x + dirx * len, ty = y + diry * len;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  const base = Math.atan2(diry, dirx);
  ctx.lineWidth = 0.45;
  for (let k = 0; k < 7; k++) {
    const ang = base + (k - 3) * 0.32, r = len * 0.42;
    const ex = tx + Math.cos(ang) * r, ey = ty + Math.sin(ang) * r;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ex, ey);
    if (fine) for (const f of [-0.35, 0.35]) { ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang + f) * r * 0.3, ey + Math.sin(ang + f) * r * 0.3); }
    ctx.stroke();
  }
}
function dandelion(ctx, W, H, progress, t) {
  const phone = W < 700;
  const margin = Math.max(0, (W - 1280) / 2) + 48;
  const hx = phone ? W - 26 : W - Math.max(40, margin / 2), hy = H * (phone ? 0.86 : 0.78), R = phone ? 17 : 24;
  const night = palette.night;
  const seedRgb = night ? "243, 241, 234" : palette.line;
  // Stem.
  ctx.strokeStyle = `rgba(${palette.signal}, ${night ? 0.45 : 0.6})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(hx - 8, H + 4); ctx.quadraticCurveTo(hx - 12, (H + hy) / 2, hx, hy + 3); ctx.stroke();
  const bloom = Math.max(0, 1 - progress / 0.14), puff = Math.max(0, Math.min(1, (progress - 0.1) / 0.14));
  if (bloom > 0) {
    ctx.strokeStyle = `rgba(${YELLOW}, ${0.9 * bloom})`; ctx.lineWidth = 1.6;
    for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 22; k++) {
      const ang = (k / 22) * Math.PI * 2 + ring * 0.14, r = R * (0.95 - ring * 0.22) * (0.35 + 0.65 * bloom);
      ctx.beginPath(); ctx.moveTo(hx + Math.cos(ang) * r * 0.25, hy + Math.sin(ang) * r * 0.25); ctx.lineTo(hx + Math.cos(ang) * r, hy + Math.sin(ang) * r); ctx.stroke();
    }
  }
  if (puff <= 0) return;
  for (let n = 0; n < SEEDS; n++) {
    const i = seedOrder[n];
    const ang = (i / SEEDS) * Math.PI * 2 + (i % 3) * 0.05;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const release = 0.3 + (n / SEEDS) * 0.66;
    const f = Math.max(0, (progress - release) * 7);
    if (f <= 0) { pappus(ctx, hx + dx * 3, hy + dy * 3, dx, dy, R * 0.55, seedRgb, 0.75 * puff, !phone); continue; }
    if (f > 1.6) continue;
    // Away on the wind: up and to the right, turning, fluttering.
    const drift = still ? 0 : Math.sin(t * 0.0015 + i) * 10;
    const x = hx + dx * R * 0.5 + f * W * (0.55 + (i % 5) * 0.08) + drift;
    const y = hy + dy * R * 0.5 - f * H * (0.45 + (i % 4) * 0.1) + Math.sin(f * 6 + i) * 18;
    const spin = ang - f * 2.2, fade = Math.max(0, 1 - f / 1.6);
    pappus(ctx, x, y, Math.cos(spin - Math.PI / 2) * 0.2, -1, R * 0.55, seedRgb, 0.8 * fade, !phone);
  }
  ctx.fillStyle = `rgba(${palette.signal}, 0.55)`;
  ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, Math.PI * 2); ctx.fill();
}

// ── the sky ────────────────────────────────────────────────────────────────
const canvas = document.querySelector("canvas.sky");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const phase = lunarPhase();
  let W = 0, H = 0, dpr = 1, skyH = 0, stars = [], figures = [], clouds = [], milky = null, moon = null, moonR = 0;
  let shooting = null, nextShot = 0, lastDraw = 0, lastScroll = -1, raf = 0;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    base.width = canvas.width; base.height = canvas.height; baseKey = "";
    const docH = Math.max(document.documentElement.scrollHeight, H);
    skyH = H + (docH - H) * PARALLAX + 40;
    const phone = W < 700;
    const r = rng(2026);
    stars = [...Array(Math.round((W * skyH) / (phone ? 2600 : 2100)))].map(() => {
      const temp = r();
      return {
        x: r() * W, y: r() * skyH, s: Math.pow(r(), 5) * 1.6 + 0.35, ph: r() * 6.28, sp: 0.6 + r() * 1.4,
        rgb: temp < 0.12 ? "190, 210, 255" : temp > 0.9 ? "255, 214, 170" : "248, 246, 238",
      };
    });
    // Constellations fall past as the page scrolls: DMT and its sibling over
    // the hero, the rest spaced down the sky, alternating sides.
    const order = ["dmt", "meo", "lsd", "psilocybin", "serotonin", "mdma", "oxytocin", "ketamine"];
    const bond = phone ? 11 : Math.min(19, W / 72);
    // The content column is at most 80rem wide; on wide screens the figures
    // live in the margins either side of it, clear of the words.
    const margin = Math.max(0, (W - 1280) / 2) + 48;
    const leftX = margin > 150 ? margin / 2 : W * 0.08, rightX = margin > 150 ? W - margin / 2 : W * 0.92;
    // Each figure after the first is hung over a plain text section, so it
    // drifts past in open sky rather than across a drawn scene: a figure at
    // sky height PARALLAX*top + H/2 sits mid-screen when its section arrives.
    const anchors = [...document.querySelectorAll("main > section")].filter((el) => !el.classList.contains("bleed") && !el.hasAttribute("data-lodge") && el.offsetHeight > 240);
    figures = order.map((name, i) => {
      const hero = i === 0;
      // DMT over the hero; its sibling is the first thing met on the way down.
      const x = i === 0 ? W * (phone ? 0.72 : 0.5) : phone ? W * (i % 2 ? 0.8 : 0.2) : i % 2 ? rightX : leftX;
      const y = i === 0 ? H * (phone ? 0.16 : 0.13) : i === 1 ? H * 1.15 : H * 1.5 + ((skyH - H * 1.7) * (i - 2)) / (order.length - 3);
      const a = i > 0 ? anchors[i - 1] : null;
      const ay = a ? PARALLAX * (a.getBoundingClientRect().top + scrollY) + H * (0.45 + (i % 3) * 0.08) : y;
      return { name, x, y: ay, bond: hero ? bond * 0.75 : bond, rot: (r() - 0.5) * 1.2 };
    });
    // Without motion the sky does not move, so only the hero's figure shows.
    if (!PARALLAX) figures = figures.slice(0, 1);
    clouds = [...Array(phone ? 3 : 5)].map(() => ({ x: r() * W, y: r() * skyH * 0.6, w: 160 + r() * 260, h: 26 + r() * 30, v: 3 + r() * 5 }));
    moonR = phone ? 26 : Math.max(34, Math.min(62, W * 0.036));
    moon = renderMoon(moonR, dpr, phase, palette.night);
    milky = palette.night ? renderMilkyWay() : null;
  }

  // A faint diagonal band of dust and tiny stars, painted once.
  function renderMilkyWay() {
    const c = document.createElement("canvas");
    const mh = Math.round(H * 1.8);
    c.width = Math.round(W); c.height = mh;
    const g = c.getContext("2d");
    const r = rng(77);
    const angle = -0.42, cx = W * 0.5, cy = mh * 0.5;
    for (let i = 0; i < 26; i++) {
      const t = (r() - 0.5) * 1.6;
      const x = cx + Math.cos(angle) * t * W, y = cy + Math.sin(angle) * t * W + (r() - 0.5) * 80;
      const rad = 90 + r() * 160;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(170, 180, 210, ${0.035 + r() * 0.03})`); grad.addColorStop(1, "rgba(170, 180, 210, 0)");
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 2600; i++) {
      const t = (r() - 0.5) * 1.8, spread = (r() + r() + r() - 1.5) * 90;
      const x = cx + Math.cos(angle) * t * W - Math.sin(angle) * spread, y = cy + Math.sin(angle) * t * W + Math.cos(angle) * spread;
      g.fillStyle = `rgba(235, 235, 245, ${0.08 + r() * 0.25})`;
      g.fillRect(x, y, 0.8, 0.8);
    }
    return c;
  }

  // A figure drifting behind a drawn scene fades away, so constellations are
  // only ever seen in open sky, never tangled in a tree.
  function veiled(y) {
    let k = 1;
    for (const r of sceneRects) {
      const inside = Math.min(y - r.top, r.bottom - y); // < 0 outside, > 0 inside
      k = Math.min(k, Math.max(0, Math.min(1, 1 - (inside + 40) / 80)));
    }
    return k;
  }
  let sceneRects = [];
  function figure(f, off, t) {
    const m = MOLECULES[f.name];
    const y0 = f.y - off;
    if (y0 < -160 || y0 > H + 160) return;
    const veil = f.name === "dmt" ? 1 : veiled(y0);
    if (veil <= 0.02) return;
    ctx.globalAlpha = veil;
    const pts = Object.values(m.atoms);
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    const P = {};
    for (const [k, [ax, ay]] of Object.entries(m.atoms)) {
      const px = (ax - mx) * f.bond, py = -(ay - my) * f.bond;
      P[k] = [f.x + px * c - py * s, y0 + px * s + py * c];
    }
    const night = palette.night;
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = night ? "rgba(200, 212, 240, 0.26)" : `rgba(${palette.line}, 0.22)`;
    for (const [a, b, order] of m.bonds) {
      const [x1, y1] = P[a], [x2, y2] = P[b];
      const d = Math.hypot(x2 - x1, y2 - y1) || 1, k = 4.5 / d;
      const nx = (-(y2 - y1) / d) * 2.2, ny = ((x2 - x1) / d) * 2.2;
      for (const o of order === 2 ? [1, -1] : [0]) {
        ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o);
        ctx.lineTo(x2 - (x2 - x1) * k + nx * o, y2 - (y2 - y1) * k + ny * o);
        ctx.stroke();
      }
    }
    const tw = rng(f.name.length * 131);
    for (const [k, [px, py]] of Object.entries(P)) {
      const el = element(k), hetero = el !== "C";
      const tws = still ? 0.85 : 0.7 + 0.3 * Math.sin(t * 0.0017 + tw() * 6.28);
      const rgb = el === "N" ? palette.signal : night ? "250, 248, 240" : palette.line;
      const core = hetero ? 2.1 : 1.4;
      if (night) {
        const before = ctx.globalAlpha;
        ctx.globalAlpha = before * 0.5 * tws;
        ctx.drawImage(glowSprite(rgb), px - core * 6, py - core * 6, core * 12, core * 12);
        ctx.globalAlpha = before;
        if (hetero) { // the soft cross of a bright star
          ctx.strokeStyle = `rgba(${rgb}, ${0.35 * tws})`; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.moveTo(px, py - 9); ctx.lineTo(px, py + 9); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${rgb}, ${(night ? 0.95 : 0.5) * tws})`;
      ctx.beginPath(); ctx.arc(px, py, core, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // The still layers — gradient, Milky Way, the faint stars, the moon — only
  // change when the page scrolls or the theme turns; they are painted into
  // `base` then, and every other frame just stamps it.
  const base = document.createElement("canvas");
  const bctx = base.getContext("2d");
  let baseKey = "";
  function paintBase(off) {
    const ctx = bctx, night = palette.night;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (night) { bg.addColorStop(0, "#02030a"); bg.addColorStop(0.6, "#050815"); bg.addColorStop(1, "#0a0d18"); }
    else { bg.addColorStop(0, "#b8c7d6"); bg.addColorStop(0.55, "#dcdcd4"); bg.addColorStop(1, "#efe3cc"); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    if (night) {
      if (milky) ctx.drawImage(milky, 0, -H * 0.4 - off * 0.6, W, milky.height);
      for (const s of stars) {
        const y = s.y - off;
        if (s.s > 1.1 || y < -2 || y > H + 2) continue;
        ctx.fillStyle = `rgba(${s.rgb}, ${0.35 + s.s * 0.3})`;
        ctx.fillRect(s.x, y, s.s, s.s);
      }
    }
    moonAt(ctx, off);
  }

  function moonAt(ctx, off) {
    const night = palette.night, phone = W < 700;
    const mx = W * (phone ? 0.82 : 0.86), my = H * (phone ? 0.17 : 0.2) - off * 0.75;
    if (!moon || my < -moonR * 4) return;
    const lit = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    if (night) {
      const halo = ctx.createRadialGradient(mx, my, moonR * 0.95, mx, my, moonR * 3.2);
      halo.addColorStop(0, `rgba(220, 225, 240, ${0.1 * lit + 0.02})`); halo.addColorStop(1, "rgba(220, 225, 240, 0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, moonR * 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.drawImage(moon, mx - moonR - 1 / dpr, my - moonR - 1 / dpr, moon.width / dpr, moon.height / dpr);
  }

  function draw(t) {
    const off = scrollY * PARALLAX;
    const night = palette.night;
    const key = `${Math.round(off * 2)}|${night}|${W}x${H}`;
    if (key !== baseKey) { paintBase(off); baseKey = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (night) {
      // Only the bright stars twinkle, so only they are drawn each frame.
      for (const s of stars) {
        if (s.s <= 1.1) continue;
        const y = s.y - off;
        if (y < -4 || y > H + 4) continue;
        ctx.globalAlpha = still ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.sp + s.ph);
        ctx.drawImage(glowSprite(s.rgb), s.x - s.s * 3, y - s.s * 3, s.s * 6, s.s * 6);
      }
      ctx.globalAlpha = 1;
      // Now and then, a shooting star.
      if (!still) {
        if (!shooting && t > nextShot) {
          const r = Math.random();
          shooting = { x: W * (0.2 + r * 0.7), y: H * (0.05 + Math.random() * 0.35), vx: -380 - r * 260, vy: 170 + r * 90, life: 0 };
          nextShot = t + 9000 + Math.random() * 16000;
        }
        if (shooting) {
          const s = shooting, dt = 1 / 60;
          s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
          const fade = Math.sin(Math.min(1, s.life / 0.9) * Math.PI);
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.18, s.y - s.vy * 0.18);
          g.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`); g.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.18, s.y - s.vy * 0.18); ctx.stroke();
          if (s.life > 0.9) shooting = null;
        }
      }
    } else {
      // A few soft clouds, lit from above, drifting.
      for (const c of clouds) {
        const x = ((c.x + (still ? 0 : t * 0.001 * c.v)) % (W + c.w * 2)) - c.w, y = c.y - off * 0.8;
        if (y < -80 || y > H + 80) continue;
        for (let k = 0; k < 4; k++) {
          const cx = x + (k - 1.5) * c.w * 0.22, cy = y + Math.sin(k * 1.7) * c.h * 0.25, rad = c.w * (0.22 + (k % 2) * 0.08);
          const g = ctx.createRadialGradient(cx, cy - c.h * 0.2, 0, cx, cy, rad);
          g.addColorStop(0, "rgba(255, 253, 248, 0.55)"); g.addColorStop(0.7, "rgba(240, 236, 228, 0.18)"); g.addColorStop(1, "rgba(240, 236, 228, 0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * (c.h / c.w) * 2.2, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    sceneRects = [...document.querySelectorAll("section.bleed:not(.glass)")].map((el) => el.getBoundingClientRect());
    for (const f of figures) figure(f, off, t);
    const lsd = figures.find((f) => f.name === "lsd");
    if (lsd) {
      const px = lsd.x + (lsd.x > W / 2 ? -1 : 1) * Math.min(150, W * 0.18), py = lsd.y - off + (W < 700 ? 120 : 170);
      if (py > -80 && py < H + 80) prince(ctx, px, py, W < 700 ? 1.2 : 1.6, t, lsd.x, lsd.y - off);
    }
    const docH = Math.max(document.documentElement.scrollHeight - H, 1);
    dandelion(ctx, W, H, Math.min(1, scrollY / docH), t);
  }

  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    // Twinkle at ~30fps; a scroll repaints at once, so the fall stays smooth.
    if (scrollY === lastScroll && t - lastDraw < 33) return;
    lastScroll = scrollY; lastDraw = t;
    draw(t);
  };

  layout();
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW && Math.abs(innerHeight - H) < 120) return; // phone URL bar
    lastW = innerWidth; layout(); if (still) draw(0);
  }, { passive: true });
  new ResizeObserver(() => {
    const docH = document.documentElement.scrollHeight;
    if (Math.abs(H + (docH - H) * PARALLAX + 40 - skyH) > 60) { layout(); if (still) draw(0); }
  }).observe(document.body);
  new MutationObserver(() => {
    const was = palette.night; readPalette();
    if (was !== palette.night) { layout(); draw(performance.now()); }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !still) raf = requestAnimationFrame(loop);
  });
  if (still) { draw(0); addEventListener("scroll", () => draw(0), { passive: true }); }
  else raf = requestAnimationFrame(loop);
}
