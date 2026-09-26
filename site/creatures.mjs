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
  let x = 0, y = 0, tx = 0, ty = 0, until = 0, raf = 0, visible = false, last = 0, facing = 1;
  const place = () => { [tx, ty] = pick(); until = performance.now() + hover(); };
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
    x = nx; y = ny;
    // A hovering thing is never quite still.
    const bob = Math.sin(t * 0.009) * 1.6;
    el.style.transform = `translate(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px) scaleX(${facing})`;
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
