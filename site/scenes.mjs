// The site's pictures are drawn, not photographed. Every section that used to
// hold a stock photo holds a scene instead, each one about what the section
// says, all grown from the same few lines of code — trees and neurons:
//
//   neuron    the home hero: a tree above a horizon, its reflection below as
//             dendrites, signals climbing the roots and firing the crown.
//   seed      "build it yourself": a seed on an empty plain, grown by the
//             reader's own scrolling, casting a long low shadow.
//   rings     the studio: a trunk's growth rings, turning slowly. Built to
//             last is what rings are; one spark traces this year's.
//   mycelium  partners: separate trees on one horizon whose roots meet
//             underground, passing signals from tree to tree.
//
// Colour has one meaning everywhere: green is signal. Bone is structure, ink
// is the ground. Seeded, so every visitor sees the same picture. Each canvas
// pauses off-screen; under prefers-reduced-motion each is drawn once, whole
// and still. All of it is aria-hidden decoration: the words carry the page.

import { palette } from "./sky.mjs";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Light adds up on a night sky; by day it would wash out, so it layers plainly.
const glowMode = () => (palette.night ? "lighter" : "source-over");

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── trees: relative angles and lengths, re-posed every frame so they sway ──
function growTree(seed, maxDepth, { three = 0.12, spread = 1 } = {}) {
  const r = rng(seed);
  const tips = [];
  const make = (depth, parent) => {
    const node = { depth, parent, turn: 0, len: 1, bend: 0, kids: [], flash: 0 };
    if (depth < maxDepth && !(depth > 4 && r() < 0.12)) {
      const n = depth < 1 ? 2 : r() < three ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const kid = make(depth + 1, node);
        const side = n === 2 ? (i ? 1 : -1) : i - 1;
        kid.turn = (side * (0.34 + r() * 0.36) + (r() - 0.5) * 0.2) * spread;
        kid.len = 0.7 + r() * 0.16;
        kid.bend = (r() - 0.5) * 0.5;
        node.kids.push(kid);
      }
    } else tips.push(node);
    return node;
  };
  return { root: make(0, null), tips };
}

// Lay a tree out from (x, y). `squash` < 0 grows it downwards (a reflection,
// or roots); `key` names the layout so one tree can be posed twice.
function pose(node, x, y, angle, len, opts) {
  const { t = 0, key = "up", squash = 1, sway = 1, phase = 0, lean = 0, progress = 99 } = opts;
  const s = still ? 0 : Math.sin(t * 0.0005 + phase + node.depth * 0.7) * 0.014 * node.depth * sway;
  const a = angle + node.turn + s + lean * node.depth * 0.012;
  const L = len * node.len;
  const part = Math.max(0, Math.min(1, progress - node.depth));
  const x2 = x + Math.sin(a) * L, y2 = y - Math.cos(a) * L * squash;
  const cx = (x + x2) / 2 + Math.cos(a) * L * node.bend;
  const cy = (y + y2) / 2 + Math.sin(a) * L * node.bend * squash;
  node[key] = { x, y, cx, cy, x2, y2, part };
  for (const k of node.kids) {
    if (part >= 1) pose(k, x2, y2, a, L, opts);
    else k[key] = null;
  }
}

const at = (s, u) => {
  const v = 1 - u;
  return [v * v * s.x + 2 * v * u * s.cx + u * u * s.x2, v * v * s.y + 2 * v * u * s.cy + u * u * s.y2];
};

function strokeTree(ctx, node, key, style, width0) {
  const s = node[key];
  if (!s || s.part <= 0) return;
  ctx.strokeStyle = style;
  ctx.lineWidth = Math.max(0.45, width0 * Math.pow(0.7, node.depth));
  ctx.beginPath(); ctx.moveTo(s.x, s.y);
  if (s.part >= 1) ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2);
  else {
    const [px, py] = at(s, s.part);
    ctx.quadraticCurveTo(s.x + (s.cx - s.x) * s.part, s.y + (s.cy - s.y) * s.part, px, py);
  }
  ctx.stroke();
  for (const k of node.kids) strokeTree(ctx, k, key, style, width0);
}

// Giger's biomechanics: the trunk and first limbs are not wood but a ribbed
// tube — vertebrae along the curve, walls either side — that turns into
// living branches further out. Drawn over the plain stroke, same colour.
function spine(ctx, node, key, style, width0, maxDepth = 2) {
  const s = node[key];
  if (!s || s.part < 1 || node.depth > maxDepth) return;
  const len = Math.hypot(s.x2 - s.x, s.y2 - s.y);
  const n = Math.max(3, Math.round(len / 6));
  const half = width0 * Math.pow(0.72, node.depth) * 2.1;
  const walls = [[], []];
  ctx.strokeStyle = style; ctx.lineWidth = 0.8;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const [px, py] = at(s, u);
    const dx = 2 * (1 - u) * (s.cx - s.x) + 2 * u * (s.x2 - s.cx), dy = 2 * (1 - u) * (s.cy - s.y) + 2 * u * (s.y2 - s.cy);
    const d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    const w = half * (1 - u * 0.35);
    walls[0].push([px + nx * w * 0.8, py + ny * w * 0.8]); walls[1].push([px - nx * w * 0.8, py - ny * w * 0.8]);
    if (k && k < n) {
      const r = k % 2 ? w * 0.7 : w; // vertebra, disc, vertebra
      ctx.beginPath(); ctx.moveTo(px + nx * r, py + ny * r); ctx.lineTo(px - nx * r, py - ny * r); ctx.stroke();
    }
  }
  for (const wall of walls) { ctx.beginPath(); wall.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
  for (const k of node.kids) spine(ctx, k, key, style, width0, maxDepth);
}

// Loki's mark: one line spiralling inward. Used wherever a centre needs one.
export function spiral(ctx, x, y, r, turn, style, width = 1.1) {
  ctx.strokeStyle = style; ctx.lineWidth = width; ctx.beginPath();
  for (let th = 0; th <= Math.PI * 2 * 3.2; th += 0.14) {
    const rr = r * (1 - th / (Math.PI * 2 * 3.5));
    const px = x + rr * Math.cos(th + turn), py = y + rr * Math.sin(th + turn);
    th ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
}

function glow(ctx, x, y, r, core, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, core === "white" ? `rgba(${palette.hot}, ${0.95 * alpha})` : `rgba(${palette.signal}, ${alpha})`);
  g.addColorStop(0.35, `rgba(${palette.signal}, ${0.45 * alpha})`);
  g.addColorStop(1, `rgba(${palette.signal}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

const pathTo = (tip) => { const p = []; for (let n = tip; n; n = n.parent) p.unshift(n); return p; };

// ── neuron: the home hero ────────────────────────────────────────────────
function neuron(ctx, box, canvas) {
  const chance = rng(42);
  let tree, maxDepth, horizon, rootX, trunk, phone, soma = 0, nextIn = 0, lean = 0, leanTo = 0;
  const signals = [];
  addEventListener("pointermove", (e) => { leanTo = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });
  const spawn = (dir) => {
    const tip = tree.tips[Math.floor(chance() * tree.tips.length)];
    const path = pathTo(tip);
    signals.push({ path, dir, s: dir === "in" ? path.length : 0, speed: 2.4 + chance() * 1.6, tip });
  };
  return {
    size(W, H) {
      phone = W < 700; maxDepth = phone ? 7 : 8;
      horizon = H * (phone ? 0.82 : 0.66);
      rootX = W * (phone ? 0.5 : 0.71);
      trunk = phone ? Math.min(H * 0.17, W * 0.36) : Math.min(H * 0.122, W * 0.2);
      tree = growTree(1917, maxDepth); signals.length = 0;
    },
    draw(t, dt, age) {
      const grown = still ? 99 : Math.min(maxDepth + 1, (age / 2800) * (maxDepth + 1));
      lean += (leanTo - lean) * 0.04;
      pose(tree.root, rootX, horizon, 0, trunk, { t, key: "up", progress: grown, lean });
      pose(tree.root, rootX, horizon, 0, trunk, { t, key: "down", squash: -0.8, sway: 1.7, phase: 2.4, progress: grown, lean });
      const W = canvas.clientWidth;
      // A low haze along the horizon, so what stands on it reads as silhouette.
      ctx.save(); ctx.translate(rootX, horizon); ctx.scale(1, 0.2);
      const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.45);
      haze.addColorStop(0, `rgba(${palette.line}, ${palette.night ? 0.1 : 0.14})`); haze.addColorStop(1, `rgba(${palette.line}, 0)`);
      ctx.fillStyle = haze; ctx.fillRect(-W * 0.45, -W * 0.45, W * 0.9, W * 0.45); ctx.restore();
      strokeTree(ctx, tree.root, "down", `rgba(${palette.signal}, ${phone ? 0.22 : 0.32})`, 2.2);
      spine(ctx, tree.root, "down", `rgba(${palette.signal}, ${phone ? 0.2 : 0.3})`, 2.2);
      strokeTree(ctx, tree.root, "up", `rgba(${palette.line}, ${phone ? 0.34 : 0.78})`, 2.4);
      spine(ctx, tree.root, "up", `rgba(${palette.line}, ${phone ? 0.3 : 0.62})`, 2.4);
      // Perches: the cat takes the fork of the right limb, Dalí's soft clock
      // drapes over the left one; the silhouettes stand on the horizon.
      const fork = tree.root.kids[1]?.up;
      const host = canvas.parentElement;
      host.style.setProperty("--horizon", `${horizon.toFixed(1)}px`);
      host.style.setProperty("--root-x", `${rootX.toFixed(1)}px`);
      const limb = tree.root.kids[0]?.up;
      if (limb && limb.part >= 1) {
        const [lx, ly] = at(limb, 0.55);
        host.style.setProperty("--clock-x", `${lx.toFixed(1)}px`);
        host.style.setProperty("--clock-y", `${ly.toFixed(1)}px`);
      }
      if (fork && fork.part >= 1) {
        host.style.setProperty("--perch-x", `${fork.x2.toFixed(1)}px`);
        host.style.setProperty("--perch-y", `${fork.y2.toFixed(1)}px`);
        host.dataset.perched = "";
      }
      if (still) return;
      if (grown > maxDepth && t > nextIn) { spawn("in"); nextIn = t + 380 + chance() * 900; }
      ctx.globalCompositeOperation = glowMode();
      for (let i = signals.length - 1; i >= 0; i--) {
        const g = signals[i];
        g.s += (g.dir === "out" ? 1 : -1) * g.speed * dt;
        if (g.dir === "out" ? g.s >= g.path.length : g.s <= 0) {
          signals.splice(i, 1);
          if (g.dir === "in") { soma = 1; spawn("out"); if (chance() < 0.35) spawn("out"); } else g.tip.flash = 1;
          continue;
        }
        const idx = Math.min(g.path.length - 1, Math.floor(g.s));
        const seg = g.path[idx][g.dir === "out" ? "up" : "down"];
        if (!seg || seg.part < 1) continue;
        const [x, y] = at(seg, g.s - idx);
        glow(ctx, x, y, g.dir === "out" ? 9 : 7, g.dir === "out" ? "white" : "green");
      }
      for (const tip of tree.tips) {
        if (tip.flash < 0.02 || !tip.up) continue;
        glow(ctx, tip.up.x2, tip.up.y2, 14, "green", 0.85 * tip.flash);
        tip.flash *= Math.pow(0.1, dt);
      }
      glow(ctx, rootX, horizon, 26 + soma * 18, "white", 0.25 + soma * 0.75);
      // Loki's spiral is the cell body: it turns as the neuron fires.
      // Counter-clockwise: the arms flow inward, the way into the rabbit hole.
      spiral(ctx, rootX, horizon, 9 + soma * 3, -(t * 0.0012 + soma), `rgba(${palette.hot}, ${0.55 + soma * 0.45})`);
      soma *= Math.pow(0.08, dt);
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

// Buckminster Fuller's geodesic dome: an icosahedron, each face split in
// four and pushed out to the sphere, the upper half kept. Many small struts,
// one strong shell — a system. It turns slowly on the plain.
const DOME = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  v = v.map(norm);
  const key = new Map(), edges = new Set();
  const mid = (a, b) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!key.has(k)) { v.push(norm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); key.set(k, v.length - 1); }
    return key.get(k);
  };
  const add = (a, b) => edges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  for (const [a, b, c] of f) {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    for (const [x, y, z] of [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]) { add(x, y); add(y, z); add(z, x); }
  }
  // Tilt so a vertex is not at the top, then keep the upper half.
  const tilt = 0.55, ct = Math.cos(tilt), st = Math.sin(tilt);
  v = v.map(([x, y, z]) => [x, y * ct - z * st, y * st + z * ct]);
  const list = [...edges].map((e) => e.split("-").map(Number)).filter(([a, b]) => v[a][1] > -0.08 && v[b][1] > -0.08);
  return { v, list };
})();
function dome(ctx, cx, ground, R, turn) {
  const c = Math.cos(turn), s = Math.sin(turn);
  const P = DOME.v.map(([x, y, z]) => [cx + (x * c - z * s) * R, ground - Math.max(0, y) * R, x * s + z * c]);
  ctx.lineWidth = 0.8;
  for (const [a, b] of DOME.list) {
    const depth = (P[a][2] + P[b][2]) / 2;
    ctx.strokeStyle = `rgba(${palette.line}, ${(0.18 + 0.5 * (depth + 1) / 2).toFixed(2)})`;
    ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
  }
}

// Psilocybe, fruiting from the network: a conical cap with its little umbo,
// fine gills, a wavy stem that bruises blue at the foot. `glow` lights the cap
// when a spark passes underneath.
function mushroom(ctx, x, ground, h, lean, glowK) {
  const top = ground - h, cw = h * 0.36, ch = h * 0.34, tx = x + lean;
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${palette.line}, 0.8)`; ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.beginPath(); ctx.moveTo(x, ground); ctx.bezierCurveTo(x - h * 0.08, ground - h * 0.4, tx + h * 0.08, top + h * 0.3, tx, top); ctx.stroke();
  ctx.strokeStyle = "rgba(70, 140, 196, 0.6)"; ctx.lineWidth = Math.max(1, h * 0.07);
  ctx.beginPath(); ctx.moveTo(x, ground); ctx.lineTo(x - h * 0.02, ground - h * 0.12); ctx.stroke();
  ctx.fillStyle = palette.night ? "rgba(196, 160, 112, 0.6)" : "rgba(168, 118, 70, 0.65)";
  ctx.strokeStyle = `rgba(${palette.line}, 0.85)`; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(tx - cw, top + 1);
  ctx.bezierCurveTo(tx - cw * 0.9, top - ch * 0.8, tx - cw * 0.25, top - ch, tx, top - ch * 1.12);
  ctx.bezierCurveTo(tx + cw * 0.25, top - ch, tx + cw * 0.9, top - ch * 0.8, tx + cw, top + 1);
  ctx.quadraticCurveTo(tx, top - ch * 0.12, tx - cw, top + 1); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 0.5;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(tx + k * cw * 0.2, top - ch * 0.05); ctx.lineTo(tx + k * cw * 0.34, top + 0.5); ctx.stroke(); }
  if (glowK > 0.02) {
    const g = ctx.createRadialGradient(tx, top - ch * 0.5, 0, tx, top - ch * 0.5, cw * 2.2);
    g.addColorStop(0, `rgba(${palette.signal}, ${0.55 * glowK})`); g.addColorStop(1, `rgba(${palette.signal}, 0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, top - ch * 0.5, cw * 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

// Rye in the foreground, heavy-eared and nodding — and on a few ears the dark
// curved spurs of ergot, Claviceps purpurea, where the LSD story began.
function rye(ctx, x, ground, h, t, seed) {
  const sway = still ? 0 : Math.sin(t * 0.0009 + seed) * h * 0.03;
  const tipX = x + sway + h * 0.06, tipY = ground - h;
  ctx.strokeStyle = `rgba(${palette.line}, 0.55)`; ctx.lineWidth = 1.1; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, ground); ctx.quadraticCurveTo(x + sway * 0.3, ground - h * 0.5, tipX, tipY); ctx.stroke();
  // The ear nods over at the top.
  const ear = h * 0.2, ang = -1.25 + (seed % 3) * 0.12;
  for (let k = 0; k < 9; k++) {
    const u = k / 9, ex = tipX + Math.cos(ang) * ear * u, ey = tipY + Math.sin(ang) * ear * u;
    for (const side of [-1, 1]) {
      const gx = ex + Math.cos(ang + side * 0.9) * 3.2, gy = ey + Math.sin(ang + side * 0.9) * 3.2;
      ctx.fillStyle = `rgba(${palette.line}, 0.5)`;
      ctx.beginPath(); ctx.ellipse(gx, gy, 2.4, 1.2, ang + side * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${palette.line}, 0.3)`; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(ang + side * 0.35) * 11, gy + Math.sin(ang + side * 0.35) * 11); ctx.stroke();
      if (seed % 2 === 0 && (k === 3 || k === 6) && side === (k === 3 ? 1 : -1)) {
        ctx.fillStyle = "rgba(34, 18, 30, 0.95)"; ctx.strokeStyle = `rgba(${palette.line}, 0.45)`; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.ellipse(gx + Math.cos(ang + side * 0.9) * 3, gy + Math.sin(ang + side * 0.9) * 3, 5.4, 1.5, ang + side * 0.95, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
  }
}

// ── seed: grown by the reader's scroll, with a long Dalí shadow ───────────
function seed(ctx, box, canvas) {
  let tree, maxDepth, horizon, rootX, trunk, W, H, phone;
  return {
    size(w, h) {
      W = w; H = h; phone = W < 700; maxDepth = phone ? 7 : 8;
      horizon = H * (phone ? 0.8 : 0.74);
      rootX = W * (phone ? 0.62 : 0.72);
      trunk = phone ? H * 0.12 : Math.min(H * 0.11, W * 0.17);
      tree = growTree(311, maxDepth, { spread: 1.1 });
    },
    draw(t) {
      // The plain: dusk-lit earth by night, Dalí's pale sand by day. The sky
      // above it is the page's own.
      const ground = ctx.createLinearGradient(0, horizon, 0, H);
      if (palette.night) { ground.addColorStop(0, "rgba(46, 43, 37, 0.95)"); ground.addColorStop(0.5, "rgba(22, 21, 15, 0.9)"); ground.addColorStop(1, "rgba(7, 7, 7, 0.6)"); }
      else { ground.addColorStop(0, "rgba(226, 212, 186, 0.95)"); ground.addColorStop(1, "rgba(201, 184, 150, 0.5)"); }
      ctx.fillStyle = ground; ctx.fillRect(0, horizon, W, H - horizon);
      // How far the reader has scrolled through this section grows the tree.
      const r = canvas.getBoundingClientRect();
      const seen = still ? 1 : Math.max(0, Math.min(1, (innerHeight - r.top) / (r.height + innerHeight * 0.1)));
      const progress = still ? 99 : Math.max(0.02, Math.min(maxDepth + 1, (seen - 0.12) / 0.62 * (maxDepth + 1)));
      pose(tree.root, rootX, horizon, 0, trunk, { t, key: "up", progress });
      // Where things stand and where the hummingbird feeds.
      const host = canvas.parentElement;
      host.style.setProperty("--horizon", `${horizon.toFixed(1)}px`);
      host.style.setProperty("--crown-x", `${rootX.toFixed(1)}px`);
      host.style.setProperty("--crown-y", `${(horizon - trunk * 3.1).toFixed(1)}px`);
      host.style.setProperty("--crown-r", `${(trunk * 2.3).toFixed(1)}px`);
      host.dataset.grown = progress > maxDepth ? "1" : "0";
      // The shadow: the same tree laid flat on the ground, stretched left.
      ctx.save();
      ctx.translate(rootX, horizon);
      ctx.transform(1, 0, 1.9, 0.2, 0, 0);
      ctx.translate(-rootX, -horizon);
      ctx.scale(1, -1); ctx.translate(0, -2 * horizon);
      strokeTree(ctx, tree.root, "up", palette.night ? "rgba(0, 0, 0, 0.9)" : "rgba(70, 52, 32, 0.4)", 3.6);
      ctx.restore();
      strokeTree(ctx, tree.root, "up", `rgba(${palette.line}, ${phone ? 0.4 : 0.85})`, 2.4);
      spine(ctx, tree.root, "up", `rgba(${palette.line}, ${phone ? 0.3 : 0.6})`, 2.4);
      dome(ctx, W * (phone ? 0.2 : 0.91), horizon, phone ? 26 : Math.min(72, W * 0.05), still ? 0.4 : t * 0.00012);
      // Rye in the near foreground, in the margin beside the words.
      const ryeAt = phone ? [[W - 14, 0.3], [W - 30, 0.26]] : [[W * 0.022, 0.46], [W * 0.04, 0.4], [W * 0.058, 0.44], [W * 0.075, 0.36]];
      ryeAt.forEach(([rx, rh], k) => rye(ctx, rx, H + 4, H * rh, t, k));
      // The seed itself, and — once grown — the crown's tips come alive.
      glow(ctx, rootX, horizon, 10, "green", progress < 1 ? 1 : 0.4);
      if (progress > maxDepth) {
        ctx.globalCompositeOperation = glowMode();
        const k = Math.min(1, progress - maxDepth);
        tree.tips.forEach((tip, i) => {
          if (!tip.up || i % 3) return;
          glow(ctx, tip.up.x2, tip.up.y2, 7, "green", k * (0.35 + 0.35 * Math.sin(t * 0.002 + i)));
        });
        ctx.globalCompositeOperation = "source-over";
      }
    },
    scrolls: true,
  };
}

// ── rings: a cross-section of a trunk, turning slowly ─────────────────────
function rings(ctx) {
  let W, H, cx, cy, R, bands;
  return {
    size(w, h) {
      W = w; H = h;
      const phone = W < 700;
      cx = W * (phone ? 0.5 : 0.72); cy = H * (phone ? 0.3 : 0.48);
      R = Math.min(W, H) * (phone ? 0.62 : 0.46);
      const r = rng(1291);
      bands = []; let rad = 0.02;
      while (rad < 1) {
        rad += 0.012 + r() * 0.03; // good years and lean ones
        bands.push({ rad, w: r() < 0.18 ? 2.2 : 0.7 + r() * 0.6, ph: r() * 6.28, amp: 0.01 + rad * 0.035, lobes: 2 + Math.floor(r() * 3) });
      }
    },
    draw(t) {
      const spin = still ? 0 : t * 0.00003;
      const breathe = still ? 1 : 1 + Math.sin(t * 0.0006) * 0.006;
      const shape = (b, th) => R * breathe * b.rad * (1 + b.amp * Math.sin(th * b.lobes + b.ph) + 0.012 * Math.sin(th * 7 + b.ph * 2));
      ctx.lineCap = "round";
      bands.forEach((b) => {
        ctx.strokeStyle = `rgba(${palette.line}, ${0.14 + 0.5 * (1 - b.rad) * (b.w > 2 ? 1.2 : 1)})`;
        ctx.lineWidth = b.w;
        ctx.beginPath();
        for (let k = 0; k <= 180; k++) {
          const th = (k / 180) * Math.PI * 2;
          const rr = shape(b, th);
          const x = cx + Math.cos(th + spin) * rr, y = cy + Math.sin(th + spin) * rr;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      // Rays from the pith, and one old check (crack) — the wood's own record.
      ctx.strokeStyle = `rgba(${palette.line}, 0.08)`; ctx.lineWidth = 0.7;
      for (let k = 0; k < 28; k++) {
        const th = (k / 28) * Math.PI * 2 + spin;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(th) * R * 0.06, cy + Math.sin(th) * R * 0.06);
        ctx.lineTo(cx + Math.cos(th) * R * 0.97, cy + Math.sin(th) * R * 0.97); ctx.stroke();
      }
      glow(ctx, cx, cy, 10, "white", 0.5);
      // This year's ring: a green spark tracing the outermost band.
      if (!still) {
        const b = bands[bands.length - 1];
        ctx.globalCompositeOperation = glowMode();
        for (let k = 0; k < 14; k++) {
          const th = t * 0.00045 - k * 0.035;
          const rr = shape(b, th);
          glow(ctx, cx + Math.cos(th + spin) * rr, cy + Math.sin(th + spin) * rr, 8 - k * 0.4, k ? "green" : "white", 1 - k / 14);
        }
        ctx.globalCompositeOperation = "source-over";
      }
    },
  };
}

// ── mycelium: separate trees, one network underground ────────────────────
// Barnsley's fern: four affine maps, iterated. The same rule at every scale —
// a fractal that happens to be a plant. Painted once, then just placed.
function fern(height, rgb) {
  const c = document.createElement("canvas");
  const w = Math.ceil(height * 0.55), h = Math.ceil(height);
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = `rgba(${rgb}, 0.55)`;
  let x = 0, y = 0;
  const r = Math.random;
  for (let i = 0; i < 26000; i++) {
    const p = r();
    [x, y] = p < 0.01 ? [0, 0.16 * y] : p < 0.86 ? [0.85 * x + 0.04 * y, -0.04 * x + 0.85 * y + 1.6] : p < 0.93 ? [0.2 * x - 0.26 * y, 0.23 * x + 0.22 * y + 1.6] : [-0.15 * x + 0.28 * y, 0.26 * x + 0.24 * y + 0.44];
    g.fillRect(w / 2 + x * (w / 5.6), h - y * (h / 10.2), 0.9, 0.9);
  }
  return c;
}

function mycelium(ctx, box, canvas) {
  let W, H, horizon, trees, links, sparks, phone, nextSpark = 0, frond = null, frondFor = "";
  const chance = rng(77);
  return {
    size(w, h) {
      W = w; H = h; phone = W < 700;
      horizon = H * (phone ? 0.4 : 0.5);
      const n = phone ? 4 : 6;
      trees = [];
      for (let i = 0; i < n; i++) {
        const x = W * (phone ? 0.14 + i * 0.24 : 0.36 + i * 0.12);
        const size = (phone ? H * 0.07 : H * 0.075) * (0.8 + chance() * 0.5);
        trees.push({ x, size, crown: growTree(900 + i, phone ? 6 : 7), roots: growTree(500 + i, 5, { spread: 1.35 }) });
      }
      // Hyphae: each tree's root tips reach for its neighbour's.
      links = [];
      for (let i = 0; i < n - 1; i++) {
        for (let k = 0; k < 4; k++) {
          const a = trees[i].roots.tips[Math.floor(chance() * trees[i].roots.tips.length)];
          const b = trees[i + 1].roots.tips[Math.floor(chance() * trees[i + 1].roots.tips.length)];
          links.push({ a, b, sag: 0.25 + chance() * 0.5 });
        }
      }
      sparks = [];
    },
    draw(t, dt) {
      canvas.parentElement.style.setProperty("--horizon", `${horizon.toFixed(1)}px`);
      // In the foreground, a fern unrolling out of the meadow's dark.
      const key = `${palette.line}|${H}`;
      if (frondFor !== key) { frond = fern(H * (phone ? 0.3 : 0.42), palette.line); frondFor = key; }
      const sway = still ? 0 : Math.sin(t * 0.0007) * 0.02;
      ctx.save(); ctx.translate(W * (phone ? 0.86 : 0.9), H); ctx.rotate(-0.12 + sway); ctx.globalAlpha = 0.55;
      ctx.drawImage(frond, -frond.width / 2, -frond.height); ctx.restore(); ctx.globalAlpha = 1;
      for (const [i, tr] of trees.entries()) {
        pose(tr.crown.root, tr.x, horizon, 0, tr.size, { t, key: "up", phase: i });
        pose(tr.roots.root, tr.x, horizon, 0, tr.size * 0.8, { t, key: "down", squash: -0.9, sway: 0.4, phase: i });
        strokeTree(ctx, tr.roots.root, "down", `rgba(${palette.signal}, 0.5)`, 1.9);
        strokeTree(ctx, tr.crown.root, "up", `rgba(${palette.line}, ${phone ? 0.5 : 0.8})`, 2);
      }
      const curve = (l) => {
        const A = l.a.down, B = l.b.down;
        if (!A || !B) return null;
        return { x: A.x2, y: A.y2, x2: B.x2, y2: B.y2, cx: (A.x2 + B.x2) / 2, cy: Math.max(A.y2, B.y2) + (B.x2 - A.x2) * l.sag, part: 1 };
      };
      ctx.strokeStyle = `rgba(${palette.signal}, 0.4)`; ctx.lineWidth = 1;
      for (const l of links) {
        const c = (l.c = curve(l));
        if (!c) continue;
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo(c.cx, c.cy, c.x2, c.y2); ctx.stroke();
      }
      const line = ctx.createLinearGradient(0, 0, W, 0);
      line.addColorStop(phone ? 0 : 0.3, `rgba(${palette.line}, 0)`); line.addColorStop(phone ? 0.3 : 0.5, `rgba(${palette.line}, 0.3)`); line.addColorStop(1, `rgba(${palette.line}, 0.1)`);
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();
      // Mushrooms fruit where the network surfaces, between the trees.
      const lit = sparks.map((sp) => (sp.l.c ? at(sp.l.c, sp.u)[0] : -1e4));
      for (let i = 0; i < trees.length - 1; i += phone ? 2 : 1) {
        const mx = (trees[i].x + trees[i + 1].x) / 2;
        const k = Math.max(0, ...lit.map((lx) => 1 - Math.abs(lx - mx) / 70));
        const hs = phone ? [11, 8] : [22, 15, 18];
        hs.forEach((h, j) => mushroom(ctx, mx + (j - 1) * h * 0.7, horizon, h, (j - 1) * 2, k));
      }
      if (still) return;
      if (t > nextSpark) {
        const l = links[Math.floor(chance() * links.length)];
        sparks.push({ l, u: chance() < 0.5 ? 0 : 1, dir: 0 }); sparks.at(-1).dir = sparks.at(-1).u ? -1 : 1;
        nextSpark = t + 250 + chance() * 500;
      }
      ctx.globalCompositeOperation = glowMode();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.u += s.dir * dt * 0.55;
        if (s.u < 0 || s.u > 1 || !s.l.c) { sparks.splice(i, 1); continue; }
        const [x, y] = at(s.l.c, s.u);
        glow(ctx, x, y, 8, "white");
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

const SCENES = { neuron, seed, rings, mycelium };

for (const canvas of document.querySelectorAll("canvas[data-scene]")) {
  const make = SCENES[canvas.dataset.scene];
  if (!make) continue;
  const ctx = canvas.getContext("2d");
  const scene = make(ctx, canvas.getBoundingClientRect(), canvas);
  let W = 0, H = 0, dpr = 1, start = 0, last = 0, raf = 0, visible = false;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    W = box.width; H = box.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    scene.size(W, H);
  };
  const frame = (t) => {
    if (!still && visible) raf = requestAnimationFrame(frame);
    // Thirty frames a second is plenty for things that sway and grow.
    if (start && t - last < 31) return;
    if (!start) start = last = t;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    scene.draw(t, dt, t - start);
  };
  size();
  let lastW = innerWidth;
  addEventListener("resize", () => {
    // Phones fire resize when the URL bar slides; only a width change re-lays the scene.
    if (innerWidth === lastW && W) return;
    lastW = innerWidth; size(); if (still) frame(performance.now());
  }, { passive: true });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }, { rootMargin: "100px" }).observe(canvas);
  if (still) frame(performance.now());
}
