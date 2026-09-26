// Small lives in the scenes, each with its own way of moving and each
// noticing you:
//
//   dragonfly    hunts over the hero's mirrored horizon — darts, hangs in
//                the air, darts again, and flits off when the pointer comes
//                close.
//   hummingbird  feeds at the crown of the grown tree in "build it yourself",
//                hovering from blossom to blossom; curious, it comes to look
//                at a pointer that lingers nearby, then goes back to feeding.
//
// Each runs only while its scene is on screen, moves with transforms alone,
// and under prefers-reduced-motion is not shown at all.

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
let px = -1e4, py = -1e4;
addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; }, { passive: true });

const num = (el, name, fallback) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || fallback;
const lerp = (a, b, k) => a + (b - a) * k;

function creature(el, host, pick, { speed, hover, shy, curious }) {
  // z is depth: 1 is the painted size, less is further away. Each new target
  // lies at its own depth, so the flyer comes toward you and goes away, and it
  // banks into its turns.
  let x = 0, y = 0, z = 1, tx = 0, ty = 0, tz = 1, until = 0, raf = 0, visible = false, last = 0, facing = 1, tilt = 0;
  const place = () => { [tx, ty] = pick(); tz = 0.55 + Math.random() * 0.75; until = performance.now() + hover(); };
  const frame = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    const box = host.getBoundingClientRect();
    const mx = px - box.left, my = py - box.top;
    const near = Math.hypot(mx - x, my - y);
    if (shy && near < shy) { place(); until = t + 400; }
    else if (curious && fine && near < curious && near > 50) { tx = mx - Math.sign(mx - x) * 46; ty = my - 10; until = t + 900; }
    else if (t > until) place();
    const k = 1 - Math.exp(-speed * dt);
    const nx = lerp(x, tx, k), ny = lerp(y, ty, k);
    if (Math.abs(nx - x) > 0.3) facing = nx > x ? 1 : -1;
    tilt = lerp(tilt, Math.max(-18, Math.min(18, (ny - y) * 2.2)), 0.2);
    x = nx; y = ny; z = lerp(z, tz, k * 0.6);
    // A hovering thing is never quite still.
    const bob = Math.sin(t * 0.009) * 1.6;
    el.style.transform = `translate(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px) rotate(${(tilt * facing).toFixed(1)}deg) scale(${(facing * z).toFixed(3)}, ${z.toFixed(3)})`;
    el.style.opacity = (0.55 + 0.45 * Math.min(1, z)).toFixed(2);
    if (visible) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) {
      if (el.hidden) { el.hidden = false; place(); x = tx; y = ty; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
  }).observe(host);
}

// The elephant crosses the plain in depth: it appears small and far on the
// horizon, walks forward and to the left — toward us — growing as it nears,
// and fades before it reaches the words. Its legs stride as it goes
// (art.mjs), and scenes.mjs casts its long evening shadow on the sand.
const walker = document.querySelector(".walker");
const plain = walker?.closest("section");
if (walker && plain) {
  const LOOP = 95000;
  let raf = 0, visible = false, t0 = performance.now();
  const place = (now) => {
    const u = still ? 0.45 : ((now - t0) % LOOP) / LOOP;
    const w = plain.clientWidth, h = plain.clientHeight, horizon = num(plain, "--horizon", h * 0.74);
    const phoneW = w < 700;
    // Depth eases in: far is slow and small, near is larger and quicker.
    const d = u * u * 0.35 + u * 0.65;
    const x = w * (phoneW ? 0.95 - d * 0.35 : 0.97 - d * 0.3);
    const y = horizon + (h - horizon) * d * 0.62;
    const scale = 0.34 + d * 0.72;
    const fade = Math.min(1, u / 0.06, (1 - u) / 0.08);
    walker.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
    walker.style.opacity = Math.max(0, fade).toFixed(3);
    walker.style.setProperty("--depth", d.toFixed(3));
  };
  const frame = (now) => { place(now); if (visible && !still) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(plain);
  place(performance.now());
}

if (!still) {
  const dragonfly = document.querySelector(".dragonfly");
  const hero = dragonfly?.closest("section");
  if (dragonfly && hero) {
    creature(dragonfly, hero, () => {
      const w = hero.clientWidth, h = num(hero, "--horizon", hero.clientHeight * 0.66);
      // On a phone the words fill the sky, so it hunts over the water instead.
      if (w < 700) return [w * (0.15 + Math.random() * 0.7), h + 18 + Math.random() * 40];
      return [w * (0.5 + Math.random() * 0.42), h - 30 - Math.random() * 150];
    }, { speed: 7, hover: () => 700 + Math.random() * 1800, shy: 90 });
  }

  const bird = document.querySelector(".hummingbird");
  const plain = bird?.closest("section");
  if (bird && plain) {
    creature(bird, plain, () => {
      // Feed at the crown only once the tree has grown; before that, wait
      // high above the seed.
      const cx = num(plain, "--crown-x", plain.clientWidth * 0.7), cy = num(plain, "--crown-y", plain.clientHeight * 0.4);
      const r = num(plain, "--crown-r", 120) * (plain.dataset.grown === "1" ? 1 : 0.4);
      const a = Math.random() * Math.PI * 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6];
    }, { speed: 4, hover: () => 1200 + Math.random() * 1600, curious: 170 });
  }
}

// Touch a mushroom (or pass the pointer over it) and it breathes out a small
// cloud of glowing spores that drift up and away.
for (const m of document.querySelectorAll(".shroom")) {
  let last = 0;
  const puff = () => {
    const now = performance.now();
    if (still || now - last < 1400) return;
    last = now;
    m.animate([{ scale: "1 1" }, { scale: "1.06 0.9" }, { scale: "0.98 1.04" }, { scale: "1 1" }], { duration: 700, easing: "ease-out" });
    const host = m.parentElement, hr = host.getBoundingClientRect(), r = m.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const sp = document.createElement("span");
      sp.className = "spore";
      sp.style.left = `${r.left - hr.left + r.width * (0.3 + Math.random() * 0.4)}px`;
      sp.style.top = `${r.top - hr.top + r.height * 0.25}px`;
      host.append(sp);
      const dx = (Math.random() - 0.5) * 90, dy = -60 - Math.random() * 90;
      sp.animate([
        { transform: "translate(0, 0) scale(0.6)", opacity: 0 },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0 },
      ], { duration: 1800 + Math.random() * 1400, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => sp.remove();
    }
  };
  m.addEventListener("pointerenter", puff);
  m.addEventListener("click", puff);
}
