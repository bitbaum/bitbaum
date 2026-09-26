// The sky over every scene: a few faint stars, and constellations that are
// molecules — each drawn from its skeletal formula, atoms as stars, bonds as
// the faint lines a star chart draws between them, double bonds doubled.
// Nitrogen burns green (the site's one signal colour); oxygen, phosphorus,
// sulphur and chlorine are a touch larger. None is named: those who know the
// shapes will know them, and to everyone else they are simply stars.
//
// Coordinates are in bond lengths, y up, laid out on the hexagons and
// pentagons of the real rings. Shared by scenes.mjs and lodge.mjs.

const BONE = "235, 229, 216";
const G = "62, 224, 143";

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Indole (benzene + pyrrole), shared by the tryptamines.
const INDOLE = {
  C3a: [0.866, 0.5], C4: [0, 1], C5: [-0.866, 0.5], C6: [-0.866, -0.5], C7: [0, -1], C7a: [0.866, -0.5],
  N1: [1.817, -0.809], C2: [2.405, 0], C3: [1.817, 0.809],
};
const INDOLE_BONDS = [
  ["C3a", "C4"], ["C4", "C5", 2], ["C5", "C6"], ["C6", "C7", 2], ["C7", "C7a"], ["C7a", "C3a", 2],
  ["C7a", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C3a"],
];
// The ethylamine arm of a tryptamine, ending in a dimethylamine.
const DMT_ARM = { Ca: [2.126, 1.76], Cb: [3.104, 1.968], N: [3.413, 2.919], Me1: [4.391, 3.127], Me2: [2.744, 3.662] };
const DMT_ARM_BONDS = [["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["N", "Me1"], ["N", "Me2"]];

export const MOLECULES = {
  "DMT": {
    atoms: { ...INDOLE, ...DMT_ARM },
    bonds: [...INDOLE_BONDS, ...DMT_ARM_BONDS],
  },
  "5-MeO-DMT": {
    atoms: { ...INDOLE, ...DMT_ARM, O: [-1.732, 1], Me3: [-1.732, 2] },
    bonds: [...INDOLE_BONDS, ...DMT_ARM_BONDS, ["C5", "O"], ["O", "Me3"]],
  },
  "Psilocybin": {
    atoms: { ...INDOLE, ...DMT_ARM, O: [0, 2], P: [-0.866, 2.5], O2: [-0.866, 3.5], O3: [-1.866, 2.5], O4: [-1.4, 1.65] },
    bonds: [...INDOLE_BONDS, ...DMT_ARM_BONDS, ["C4", "O"], ["O", "P"], ["P", "O2", 2], ["P", "O3"], ["P", "O4"]],
  },
  // Ergoline: benzene A and ring C share C11–C16; the pyrrole bridges their
  // peri positions through C16; ring D shares C5–C10 with ring C.
  "LSD": {
    atoms: {
      C16: [0.866, 0.5], C15: [0, 1], C14: [-0.866, 0.5], C13: [-0.866, -0.5], C12: [0, -1], C11: [0.866, -0.5],
      N1: [0.37, 1.95], C2: [1.36, 1.95], C3: [1.732, 1], C4: [2.598, 0.5], C5: [2.598, -0.5], C10: [1.732, -1],
      N6: [3.464, -1], C7: [3.464, -2], C8: [2.598, -2.5], C9: [1.732, -2], Me: [4.33, -0.5],
      Cam: [2.598, -3.5], O: [1.732, -4], Nam: [3.464, -4], E1: [3.464, -5], E2: [4.33, -5.5], E3: [4.33, -3.5], E4: [5.196, -4],
    },
    bonds: [
      ["C16", "C15"], ["C15", "C14", 2], ["C14", "C13"], ["C13", "C12", 2], ["C12", "C11"], ["C11", "C16", 2],
      ["C15", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C16"],
      ["C3", "C4"], ["C4", "C5"], ["C5", "C10"], ["C10", "C11"],
      ["C5", "N6"], ["N6", "C7"], ["C7", "C8"], ["C8", "C9"], ["C9", "C10", 2], ["N6", "Me"],
      ["C8", "Cam"], ["Cam", "O", 2], ["Cam", "Nam"], ["Nam", "E1"], ["E1", "E2"], ["Nam", "E3"], ["E3", "E4"],
    ],
  },
  "Serotonin": {
    atoms: { ...INDOLE, Ca: DMT_ARM.Ca, Cb: DMT_ARM.Cb, N: DMT_ARM.N, O: [-1.732, 1] },
    bonds: [...INDOLE_BONDS, ["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["C5", "O"]],
  },
  // Oxytocin is a nonapeptide of some seventy heavy atoms; atom by atom it is
  // a tangle, so it is drawn by residue, the way it is recognised: a ring of
  // six closed by the disulfide bridge (the two larger stars), and a tail of three.
  "Oxytocin": {
    atoms: { cys1: [0.0, 1.307], tyr2: [0.924, 0.924], ile3: [1.307, 0.0], gln4: [0.924, -0.924], asn5: [0.0, -1.307], cys6: [-0.924, -0.924], S6: [-1.307, -0.0], S1: [-0.924, 0.924], pro7: [-1.631, -1.631], leu8: [-2.597, -1.89], gly9: [-3.304, -2.597], Nt: [-4.27, -2.856] },
    bonds: [
      ["cys1", "tyr2"], ["tyr2", "ile3"], ["ile3", "gln4"], ["gln4", "asn5"], ["asn5", "cys6"],
      ["cys6", "S6"], ["S6", "S1"], ["S1", "cys1"],
      ["cys6", "pro7"], ["pro7", "leu8"], ["leu8", "gly9"], ["gly9", "Nt"],
    ],
  },
  "MDMA": {
    atoms: {
      p0: [0.866, 0.5], p1: [0, 1], p2: [-0.866, 0.5], p3: [-0.866, -0.5], p4: [0, -1], p5: [0.866, -0.5],
      O1: [-1.817, 0.809], CH2: [-2.405, 0], O2: [-1.817, -0.809],
      Ca: [1.732, 1], Cb: [2.598, 0.5], Me: [2.598, -0.5], N: [3.464, 1], NMe: [4.33, 0.5],
    },
    bonds: [
      ["p0", "p1"], ["p1", "p2", 2], ["p2", "p3"], ["p3", "p4", 2], ["p4", "p5"], ["p5", "p0", 2],
      ["p2", "O1"], ["O1", "CH2"], ["CH2", "O2"], ["O2", "p3"],
      ["p0", "Ca"], ["Ca", "Cb"], ["Cb", "Me"], ["Cb", "N"], ["N", "NMe"],
    ],
  },
  "Ketamine": {
    atoms: {
      r0: [0.866, 0.5], r1: [0, 1], r2: [-0.866, 0.5], r3: [-0.866, -0.5], r4: [0, -1], r5: [0.866, -0.5], O: [1.732, -1],
      i: [1.866, 0.5], a1: [2.366, 1.366], a2: [3.366, 1.366], a3: [3.866, 0.5], a4: [3.366, -0.366], a5: [2.366, -0.366],
      Cl: [1.866, 2.232], N: [1.125, 1.466], Me: [0.418, 2.173],
    },
    bonds: [
      ["r0", "r1"], ["r1", "r2"], ["r2", "r3"], ["r3", "r4"], ["r4", "r5"], ["r5", "r0"], ["r5", "O", 2],
      ["r0", "i"], ["i", "a1", 2], ["a1", "a2"], ["a2", "a3", 2], ["a3", "a4"], ["a4", "a5", 2], ["a5", "i"],
      ["a1", "Cl"], ["r0", "N"], ["N", "Me"],
    ],
  },
};

const element = (name) => (/^N/.test(name) && !/^NMe/.test(name) ? "N" : /^O/.test(name) ? "O" : /^S\d/.test(name) ? "S" : name === "P" ? "P" : name === "Cl" ? "Cl" : "C");

// Draw one molecule as a constellation centred on (x, y).
export function constellation(ctx, name, x, y, bond, rot, t, still, alpha = 1) {
  const m = MOLECULES[name];
  if (!m) return;
  const pts = Object.values(m.atoms);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const c = Math.cos(rot), s = Math.sin(rot);
  const place = ([ax, ay]) => {
    const px = (ax - cx) * bond, py = -(ay - cy) * bond;
    return [x + px * c - py * s, y + px * s + py * c];
  };
  const P = Object.fromEntries(Object.entries(m.atoms).map(([k, v]) => [k, place(v)]));
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = `rgba(${BONE}, ${0.2 * alpha})`;
  for (const [a, b, order] of m.bonds) {
    const [x1, y1] = P[a], [x2, y2] = P[b];
    const d = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / d) * 1.6, ny = ((x2 - x1) / d) * 1.6;
    // Stop short of each star, as charts do.
    const k = 3.2 / d;
    const sx = x1 + (x2 - x1) * k, sy = y1 + (y2 - y1) * k, ex = x2 - (x2 - x1) * k, ey = y2 - (y2 - y1) * k;
    const lines = order === 2 ? [[nx, ny], [-nx, -ny]] : [[0, 0]];
    for (const [ox, oy] of lines) { ctx.beginPath(); ctx.moveTo(sx + ox, sy + oy); ctx.lineTo(ex + ox, ey + oy); ctx.stroke(); }
  }
  const tw = rng(name.length * 97);
  for (const [k, [px, py]] of Object.entries(P)) {
    const el = element(k);
    const twinkle = still ? 0.8 : 0.65 + 0.35 * Math.sin(t * 0.0016 + tw() * 6.28);
    const r = el === "C" ? 1.1 : 1.7;
    const rgb = el === "N" ? G : BONE;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
    g.addColorStop(0, `rgba(${rgb}, ${0.55 * twinkle * alpha})`); g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${el === "N" ? G : "250, 248, 240"}, ${0.9 * twinkle * alpha})`;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
}

// Background stars: seeded, faint, twinkling.
export function starfield(ctx, W, top, bottom, count, seed, t, still) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * W, y = top + r() * (bottom - top), ph = r() * 6.28, size = 0.45 + r() * 0.7;
    const a = 0.1 + 0.3 * (still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0012 + ph));
    ctx.fillStyle = `rgba(${BONE}, ${a})`;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  }
}
