// Trees and neurons. Above the horizon a tree, drawn as one bone-white line;
// below it the same tree reflected — which is a neuron's shape: the roots are
// dendrites, the foot of the trunk on the horizon is the cell body, the crown
// is the axon's branching. And it fires: signals climb the roots in green,
// flash through the cell body, and run up into the crown as white sparks that
// light the tip they reach. The reflection sways a beat behind the tree, like
// something on the other side of the glass only pretending to be a reflection.
//
// Colour has one meaning here: green is signal. Bone is structure, ink is the
// ground. Seeded, so every visitor sees the same tree; pauses off-screen;
// under prefers-reduced-motion it is drawn once, grown and still, no signals.

const canvas = document.querySelector("[data-glass]");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const GREEN = css.getPropertyValue("--baum").trim() || "#3ee08f";
  const BONE = "235, 229, 216";

  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const chance = rng(42);

  // Relative angles, lengths and bends — re-posed every frame so it can sway.
  function grow(maxDepth) {
    const r = rng(1917);
    const tips = [];
    const make = (depth, parent) => {
      const node = { depth, parent, turn: 0, len: 1, bend: 0, kids: [], flash: 0, up: {}, down: {} };
      if (depth < maxDepth && !(depth > 4 && r() < 0.12)) {
        const n = depth < 1 ? 2 : r() < 0.12 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const kid = make(depth + 1, node);
          const side = n === 2 ? (i ? 1 : -1) : i - 1;
          kid.turn = side * (0.34 + r() * 0.36) + (r() - 0.5) * 0.2;
          kid.len = 0.7 + r() * 0.16;
          kid.bend = (r() - 0.5) * 0.5;
          node.kids.push(kid);
        }
      } else tips.push(node);
      return node;
    };
    const root = make(0, null);
    return { root, tips };
  }

  let W = 0, H = 0, dpr = 1, tree = null, maxDepth = 8, lean = 0, leanTo = 0, phone = false;
  let horizon = 0, rootX = 0, trunk = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    W = box.width; H = box.height; phone = W < 700;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    maxDepth = phone ? 7 : 8;
    horizon = H * (phone ? 0.82 : 0.66);
    rootX = W * (phone ? 0.5 : 0.71);
    trunk = phone ? Math.min(H * 0.17, W * 0.36) : Math.min(H * 0.122, W * 0.2);
    tree = grow(maxDepth);
    signals.length = 0;
  }

  // Pose one side. `side` is "up" (the tree) or "down" (the reflection),
  // and each node remembers its curve so signals can ride it.
  function pose(node, x, y, angle, len, t, side, progress) {
    const mirror = side === "down";
    const phase = t * 0.0005 + (mirror ? 2.4 : 0);
    const sway = still ? 0 : Math.sin(phase + node.depth * 0.7) * 0.014 * node.depth * (mirror ? 1.7 : 1);
    const a = angle + node.turn + sway + lean * node.depth * 0.012;
    const L = len * node.len;
    const squash = mirror ? -0.8 : 1;
    const part = Math.max(0, Math.min(1, progress - node.depth));
    const x2 = x + Math.sin(a) * L, y2 = y - Math.cos(a) * L * squash;
    // Control point pushed sideways: branches curve like dendrites, not sticks.
    const cx = (x + x2) / 2 + Math.cos(a) * L * node.bend;
    const cy = (y + y2) / 2 + Math.sin(a) * L * node.bend * squash;
    node[side] = { x, y, cx, cy, x2, y2, part };
    if (part >= 1) for (const k of node.kids) pose(k, x2, y2, a, L, t, side, progress);
    else for (const k of node.kids) k[side] = null;
  }

  const at = (s, u) => {
    const v = 1 - u;
    return [v * v * s.x + 2 * v * u * s.cx + u * u * s.x2, v * v * s.y + 2 * v * u * s.cy + u * u * s.y2];
  };

  function stroke(node, side, rgba, width0) {
    const s = node[side];
    if (!s) return;
    ctx.strokeStyle = rgba;
    ctx.lineWidth = Math.max(0.45, width0 * Math.pow(0.7, node.depth));
    ctx.beginPath(); ctx.moveTo(s.x, s.y);
    if (s.part >= 1) ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2);
    else { const [px, py] = at(s, s.part); ctx.quadraticCurveTo(s.x + (s.cx - s.x) * s.part, s.y + (s.cy - s.y) * s.part, px, py); }
    ctx.stroke();
    for (const k of node.kids) stroke(k, side, rgba, width0);
  }

  // A signal is a path of nodes and a position along it. Inbound signals ride
  // the reflection from a root tip to the cell body; each one that arrives
  // sends an outbound spark up a random path to a tip of the crown.
  const signals = [];
  let soma = 0;
  function pathTo(tip) { const p = []; for (let n = tip; n; n = n.parent) p.unshift(n); return p; }
  function randomTip() { return tree.tips[Math.floor(chance() * tree.tips.length)]; }
  function spawn(dir) {
    const tip = randomTip();
    signals.push({ path: pathTo(tip), dir, s: dir === "in" ? pathTo(tip).length : 0, speed: 2.4 + chance() * 1.6, tip });
  }

  function drawSignals(dt) {
    ctx.globalCompositeOperation = "lighter";
    for (let i = signals.length - 1; i >= 0; i--) {
      const g = signals[i];
      g.s += (g.dir === "out" ? 1 : -1) * g.speed * dt;
      const done = g.dir === "out" ? g.s >= g.path.length : g.s <= 0;
      if (done) {
        signals.splice(i, 1);
        if (g.dir === "in") { soma = 1; spawn("out"); if (chance() < 0.35) spawn("out"); }
        else g.tip.flash = 1;
        continue;
      }
      const idx = Math.min(g.path.length - 1, Math.floor(g.s));
      const seg = g.path[idx][g.dir === "out" ? "up" : "down"];
      if (!seg || seg.part < 1) continue;
      const [x, y] = at(seg, g.s - idx);
      const hot = g.dir === "out";
      const r = hot ? 9 : 7;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, hot ? "rgba(255, 255, 255, 0.95)" : GREEN);
      grad.addColorStop(0.35, hot ? "rgba(190, 255, 220, 0.5)" : "rgba(62, 224, 143, 0.45)");
      grad.addColorStop(1, "rgba(62, 224, 143, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Tips that were reached glow and fade: synapses.
    for (const tip of tree.tips) {
      if (tip.flash < 0.02 || !tip.up) continue;
      const { x2, y2 } = tip.up;
      const grad = ctx.createRadialGradient(x2, y2, 0, x2, y2, 14);
      grad.addColorStop(0, `rgba(62, 224, 143, ${0.85 * tip.flash})`);
      grad.addColorStop(1, "rgba(62, 224, 143, 0)");
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x2, y2, 14, 0, Math.PI * 2); ctx.fill();
      tip.flash *= Math.pow(0.1, dt);
    }
    // The cell body, on the horizon, where the trunk meets its reflection.
    const glow = 0.25 + soma * 0.75;
    const grad = ctx.createRadialGradient(rootX, horizon, 0, rootX, horizon, 26 + soma * 18);
    grad.addColorStop(0, `rgba(255, 255, 255, ${glow})`);
    grad.addColorStop(0.25, `rgba(62, 224, 143, ${0.6 * glow})`);
    grad.addColorStop(1, "rgba(62, 224, 143, 0)");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(rootX, horizon, 44, 0, Math.PI * 2); ctx.fill();
    soma *= Math.pow(0.08, dt);
    ctx.globalCompositeOperation = "source-over";
  }

  let start = 0, last = 0, raf = 0, visible = true, nextIn = 0;
  function frame(t) {
    if (!start) start = last = t;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    const grown = still ? maxDepth + 1 : Math.min(maxDepth + 1, ((t - start) / 2800) * (maxDepth + 1));
    lean += (leanTo - lean) * 0.04;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    pose(tree.root, rootX, horizon, 0, trunk, t, "up", grown);
    pose(tree.root, rootX, horizon, 0, trunk, t, "down", grown);
    stroke(tree.root, "down", `rgba(62, 224, 143, ${phone ? 0.22 : 0.32})`, 2.2);
    stroke(tree.root, "up", `rgba(${BONE}, ${phone ? 0.34 : 0.78})`, 2.4);
    if (!still) {
      if (grown > maxDepth && t > nextIn) { spawn("in"); nextIn = t + 380 + chance() * 900; }
      drawSignals(dt);
    }
    if (!still && visible) raf = requestAnimationFrame(frame);
  }

  size();
  addEventListener("resize", () => { size(); if (still) frame(performance.now()); }, { passive: true });
  addEventListener("pointermove", (e) => { leanTo = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }).observe(canvas);
  raf = requestAnimationFrame(frame);
}
