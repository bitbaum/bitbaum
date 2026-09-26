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

import { constellation, starfield } from "./sky.mjs";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = getComputedStyle(document.documentElement);
const GREEN = css.getPropertyValue("--baum").trim() || "#3ee08f";
const G = "62, 224, 143";
const BONE = "235, 229, 216";

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

// The moon, in the same line as everything else: a waxing gibbous with its
// craters foreshortened toward the rim, and a few stars. Once, not a theme.
function moonAndStars(ctx, W, H, horizon, phone, t) {
  starfield(ctx, W, 0, horizon * 0.72, phone ? 22 : 46, 5, t, still);
  const r = phone ? 20 : Math.min(W, H) * 0.048;
  const mx = W * (phone ? 0.8 : 0.9), my = H * (phone ? 0.2 : 0.21);
  const halo = ctx.createRadialGradient(mx, my, r * 0.9, mx, my, r * 2.2);
  halo.addColorStop(0, `rgba(${BONE}, 0.06)`); halo.addColorStop(1, `rgba(${BONE}, 0)`);
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = `rgba(${BONE}, 0.2)`; ctx.fillRect(mx - r, my - r, r * 2, r * 2);
  const craters = rng(9);
  ctx.strokeStyle = `rgba(${BONE}, 0.5)`; ctx.lineWidth = 0.8;
  for (let i = 0; i < 10; i++) {
    const a = craters() * 6.28, d = Math.sqrt(craters()) * r * 0.85, cr = r * (0.06 + craters() * 0.14);
    const cx = mx + Math.cos(a) * d, cy = my + Math.sin(a) * d;
    const squash = Math.sqrt(Math.max(0.15, 1 - (d / r) ** 2));
    ctx.beginPath(); ctx.ellipse(cx, cy, cr * squash, cr, a, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = "rgba(4, 4, 4, 0.88)"; // the night side
  ctx.beginPath(); ctx.arc(mx - r * 0.62, my - r * 0.08, r * 1.02, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = `rgba(${BONE}, 0.85)`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke();
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
  g.addColorStop(0, core === "white" ? `rgba(255, 255, 255, ${0.95 * alpha})` : `rgba(${G}, ${alpha})`);
  g.addColorStop(0.35, `rgba(${G}, ${0.45 * alpha})`);
  g.addColorStop(1, `rgba(${G}, 0)`);
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
      const W = canvas.clientWidth, H = canvas.clientHeight;
      moonAndStars(ctx, W, H, horizon, phone, t);
      // The tryptamine siblings, high in the sky between the words and the moon.
      if (phone) constellation(ctx, "DMT", W * 0.72, H * 0.17, 8.5, -0.25, t, still, 0.9);
      else {
        constellation(ctx, "DMT", W * 0.55, H * 0.13, 11, -0.3, t, still);
        constellation(ctx, "5-MeO-DMT", W * 0.73, H * 0.128, 9, 0.5, t, still, 0.8);
      }
      strokeTree(ctx, tree.root, "down", `rgba(${G}, ${phone ? 0.22 : 0.32})`, 2.2);
      spine(ctx, tree.root, "down", `rgba(${G}, ${phone ? 0.2 : 0.3})`, 2.2);
      strokeTree(ctx, tree.root, "up", `rgba(${BONE}, ${phone ? 0.34 : 0.78})`, 2.4);
      spine(ctx, tree.root, "up", `rgba(${BONE}, ${phone ? 0.3 : 0.62})`, 2.4);
      // A perch for the cat, if it chose the tree: the fork of the right limb.
      const fork = tree.root.kids[1]?.up;
      const host = canvas.parentElement;
      if (fork && fork.part >= 1) {
        host.style.setProperty("--perch-x", `${fork.x2.toFixed(1)}px`);
        host.style.setProperty("--perch-y", `${fork.y2.toFixed(1)}px`);
        host.dataset.perched = "";
      }
      if (still) return;
      if (grown > maxDepth && t > nextIn) { spawn("in"); nextIn = t + 380 + chance() * 900; }
      ctx.globalCompositeOperation = "lighter";
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
      spiral(ctx, rootX, horizon, 9 + soma * 3, t * 0.0012 + soma, `rgba(255, 255, 255, ${0.55 + soma * 0.45})`);
      soma *= Math.pow(0.08, dt);
      ctx.globalCompositeOperation = "source-over";
    },
  };
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
      // Ground a shade lighter than the sky, as in a Dalí plain at dusk.
      const ground = ctx.createLinearGradient(0, horizon, 0, H);
      ground.addColorStop(0, "#2e2b25"); ground.addColorStop(0.5, "#16150f"); ground.addColorStop(1, "#070707");
      ctx.fillStyle = ground; ctx.fillRect(0, horizon, W, H - horizon);
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#040404"); sky.addColorStop(1, "#11110f");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
      starfield(ctx, W, 0, horizon * 0.8, phone ? 18 : 40, 12, t, still);
      if (!phone) constellation(ctx, "LSD", W * 0.93, H * 0.24, 10, 0.35, t, still, 0.85);
      // How far the reader has scrolled through this section grows the tree.
      const r = canvas.getBoundingClientRect();
      const seen = still ? 1 : Math.max(0, Math.min(1, (innerHeight - r.top) / (r.height + innerHeight * 0.1)));
      const progress = still ? 99 : Math.max(0.02, Math.min(maxDepth + 1, (seen - 0.12) / 0.62 * (maxDepth + 1)));
      pose(tree.root, rootX, horizon, 0, trunk, { t, key: "up", progress });
      // The shadow: the same tree laid flat on the ground, stretched left.
      ctx.save();
      ctx.translate(rootX, horizon);
      ctx.transform(1, 0, 1.9, 0.2, 0, 0);
      ctx.translate(-rootX, -horizon);
      ctx.scale(1, -1); ctx.translate(0, -2 * horizon);
      strokeTree(ctx, tree.root, "up", "rgba(0, 0, 0, 0.9)", 3.6);
      ctx.restore();
      strokeTree(ctx, tree.root, "up", `rgba(${BONE}, ${phone ? 0.4 : 0.85})`, 2.4);
      spine(ctx, tree.root, "up", `rgba(${BONE}, ${phone ? 0.3 : 0.6})`, 2.4);
      // The seed itself, and — once grown — the crown's tips come alive.
      glow(ctx, rootX, horizon, 10, "green", progress < 1 ? 1 : 0.4);
      if (progress > maxDepth) {
        ctx.globalCompositeOperation = "lighter";
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
        ctx.strokeStyle = `rgba(${BONE}, ${0.14 + 0.5 * (1 - b.rad) * (b.w > 2 ? 1.2 : 1)})`;
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
      ctx.strokeStyle = `rgba(${BONE}, 0.08)`; ctx.lineWidth = 0.7;
      for (let k = 0; k < 28; k++) {
        const th = (k / 28) * Math.PI * 2 + spin;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(th) * R * 0.06, cy + Math.sin(th) * R * 0.06);
        ctx.lineTo(cx + Math.cos(th) * R * 0.97, cy + Math.sin(th) * R * 0.97); ctx.stroke();
      }
      glow(ctx, cx, cy, 10, "white", 0.5);
      // This year's ring: a green spark tracing the outermost band.
      if (!still) {
        const b = bands[bands.length - 1];
        ctx.globalCompositeOperation = "lighter";
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
function mycelium(ctx) {
  let W, H, horizon, trees, links, sparks, phone, nextSpark = 0;
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
      starfield(ctx, W, 0, horizon * 0.85, phone ? 16 : 36, 21, t, still);
      if (phone) constellation(ctx, "Psilocybin", W * 0.78, H * 0.1, 7.5, -0.2, t, still, 0.8);
      else constellation(ctx, "Psilocybin", W * 0.2, H * 0.22, 11, -0.2, t, still);
      for (const [i, tr] of trees.entries()) {
        pose(tr.crown.root, tr.x, horizon, 0, tr.size, { t, key: "up", phase: i });
        pose(tr.roots.root, tr.x, horizon, 0, tr.size * 0.8, { t, key: "down", squash: -0.9, sway: 0.4, phase: i });
        strokeTree(ctx, tr.roots.root, "down", `rgba(${G}, 0.5)`, 1.9);
        strokeTree(ctx, tr.crown.root, "up", `rgba(${BONE}, ${phone ? 0.5 : 0.8})`, 2);
      }
      const curve = (l) => {
        const A = l.a.down, B = l.b.down;
        if (!A || !B) return null;
        return { x: A.x2, y: A.y2, x2: B.x2, y2: B.y2, cx: (A.x2 + B.x2) / 2, cy: Math.max(A.y2, B.y2) + (B.x2 - A.x2) * l.sag, part: 1 };
      };
      ctx.strokeStyle = `rgba(${G}, 0.4)`; ctx.lineWidth = 1;
      for (const l of links) {
        const c = (l.c = curve(l));
        if (!c) continue;
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo(c.cx, c.cy, c.x2, c.y2); ctx.stroke();
      }
      const line = ctx.createLinearGradient(0, 0, W, 0);
      line.addColorStop(phone ? 0 : 0.3, `rgba(${BONE}, 0)`); line.addColorStop(phone ? 0.3 : 0.5, `rgba(${BONE}, 0.3)`); line.addColorStop(1, `rgba(${BONE}, 0.1)`);
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();
      if (still) return;
      if (t > nextSpark) {
        const l = links[Math.floor(chance() * links.length)];
        sparks.push({ l, u: chance() < 0.5 ? 0 : 1, dir: 0 }); sparks.at(-1).dir = sparks.at(-1).u ? -1 : 1;
        nextSpark = t + 250 + chance() * 500;
      }
      ctx.globalCompositeOperation = "lighter";
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
    if (!start) start = last = t;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    scene.draw(t, dt, t - start);
    if (!still && visible) raf = requestAnimationFrame(frame);
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
