// The Starry Night, after Vincent van Gogh (1889, public domain) — drawn, not
// pasted, behind the home page's chat: the sky you ask when you are not sure
// where to start.
//
// What makes the painting is that the sky MOVES: every brushstroke follows one
// current, which coils into the great double swirl and rings each star. So
// this draws a flow field — a drifting westward current, two vortices, and a
// halo around every star and the moon — and lays thousands of short, thick
// strokes along it in the painting's blues, with yellow and white where the
// light is. The strokes creep along the current; the stars breathe.
//
// Seeded, so every visitor sees the same sky. Paused off-screen; drawn once
// and left still under prefers-reduced-motion. aria-hidden decoration.

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In unit space (x 0..1, y 0..1). Positions after the painting's own layout.
const SWIRLS = [
  { x: 0.42, y: 0.36, r: 0.2, spin: 1 },    // the great swirl
  { x: 0.6, y: 0.42, r: 0.14, spin: -1 },   // its counter-coil
];
const STARS = [
  { x: 0.08, y: 0.2, r: 0.045 }, { x: 0.2, y: 0.58, r: 0.04 }, { x: 0.3, y: 0.14, r: 0.03 },
  { x: 0.52, y: 0.12, r: 0.035 }, { x: 0.7, y: 0.22, r: 0.04 }, { x: 0.78, y: 0.6, r: 0.035 },
  { x: 0.62, y: 0.72, r: 0.03 }, { x: 0.38, y: 0.74, r: 0.028 },
];
const MOON = { x: 0.9, y: 0.2, r: 0.07 };

const BLUES = ["#1b3266", "#21407f", "#2b5296", "#3866ad", "#4c7fc0", "#6b98cf", "#8fb3dc"];
const LIGHT = ["#f5d76e", "#f8e6a0", "#fdf5d2", "#e9c24a"];
const NIGHT_TOP = "#0f1f45";
const NIGHT_LOW = "#1d3b78";

/** The current at a point: westward drift, bent by the swirls and the lights. */
function flow(x, y, aspect) {
  let vx = -0.25, vy = 0.08 * Math.sin(x * 9 + y * 4);
  const pull = (c, strength, spin) => {
    const dx = (x - c.x) * aspect, dy = y - c.y;
    const d = Math.hypot(dx, dy) + 1e-4;
    const fall = Math.exp(-((d / c.r) ** 2));
    // Tangential: round the centre, in its own direction.
    vx += (-dy / d) * strength * fall * spin;
    vy += (dx / d) * strength * fall * spin;
  };
  for (const s of SWIRLS) pull(s, 1.6, s.spin);
  for (const s of STARS) pull({ ...s, r: s.r * 2.4 }, 1.1, 1);
  pull({ ...MOON, r: MOON.r * 1.9 }, 1.2, -1);
  return Math.atan2(vy, vx);
}

function lightNear(x, y, aspect) {
  let best = 0;
  for (const s of [...STARS, MOON]) {
    const d = Math.hypot((x - s.x) * aspect, y - s.y) / (s.r * 2.6);
    best = Math.max(best, Math.max(0, 1 - d));
  }
  return best;
}

function paint(canvas) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, strokes = [], frame = 0, visible = false, raf = 0;

  function layout() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(box.width));
    H = Math.max(1, Math.round(box.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(1889);
    const aspect = W / H;
    // Density follows area, capped so a phone and a wide screen both stay quick.
    const n = Math.min(2600, Math.round((W * H) / 70));
    strokes = Array.from({ length: n }, () => {
      const x = r(), y = r();
      const glow = lightNear(x, y, aspect);
      const palette = glow > 0.25 && r() < glow + 0.2 ? LIGHT : BLUES;
      return {
        x, y, aspect,
        len: 7 + r() * 11,
        w: 2 + r() * 2.4,
        color: palette[Math.floor(r() * palette.length)],
        phase: r(),
      };
    });
  }

  function draw(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, NIGHT_TOP); g.addColorStop(1, NIGHT_LOW);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";
    const drift = still ? 0 : t * 0.000012;
    for (const s of strokes) {
      // Creep along the current, wrapping across the canvas.
      const a = flow(s.x, s.y, s.aspect);
      const step = (drift + s.phase) % 1;
      const x = (((s.x + Math.cos(a) * step * 0.02) % 1) + 1) % 1;
      const y = (((s.y + Math.sin(a) * step * 0.02) % 1) + 1) % 1;
      const ang = flow(x, y, s.aspect);
      const px = x * W, py = y * H, half = s.len / 2;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.w;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(ang) * half, py - Math.sin(ang) * half);
      ctx.lineTo(px + Math.cos(ang) * half, py + Math.sin(ang) * half);
      ctx.stroke();
    }
    // The lights: a halo of rings, a bright core; they breathe slowly.
    const unit = Math.min(W, H * 1.6);
    for (const [i, s] of [...STARS, MOON].entries()) {
      const moon = i === STARS.length;
      const breathe = still ? 1 : 1 + 0.06 * Math.sin(t * 0.0012 + i * 1.7);
      const R = s.r * unit * breathe;
      for (let k = 3; k >= 1; k--) {
        ctx.strokeStyle = k === 3 ? "rgba(245, 215, 110, 0.35)" : k === 2 ? "rgba(248, 230, 160, 0.6)" : "rgba(253, 245, 210, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([R * 0.35, R * 0.18]);
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, R * (0.45 + k * 0.28), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = moon ? "#f2c94c" : "#fdf5d2";
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, R * 0.42, 0, Math.PI * 2); ctx.fill();
      if (moon) {
        // A crescent: the night bites the disc.
        ctx.fillStyle = NIGHT_TOP;
        ctx.beginPath(); ctx.arc(s.x * W + R * 0.2, s.y * H - R * 0.12, R * 0.36, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function loop(t) {
    raf = 0;
    if (!visible) return;
    // About twenty frames a second is plenty for a sky that creeps.
    if (t - frame > 48) { frame = t; draw(t); }
    raf = requestAnimationFrame(loop);
  }

  layout();
  draw(0);
  new ResizeObserver(() => { layout(); draw(performance.now()); }).observe(canvas);
  if (still) return;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }).observe(canvas);
}

for (const canvas of document.querySelectorAll("canvas[data-starry]")) paint(canvas);
