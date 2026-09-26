// The green room. Every page opens on a stage: velvet curtains, drawn live,
// hang at its edges — Lynch's red room, in bitbaum's green. The first time a
// visitor arrives in a session they part like a theatre's; after that they
// simply hang there, so nobody pays for the flourish twice. They sit behind
// the words, never over them: the title is readable while they open.
//
// And somewhere on each page, in a different place each visit, sits a small
// orange cat: on a branch of the tree (Cheshire, so it fades to its eyes and
// back), on a stage floor, peeking round a curtain, or on the footer's floor.
// It is a real link — to OrangeCat, which is the one thing orange means here.

import { constellation, starfield, MOLECULES } from "./sky.mjs";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = () => innerWidth < 700;

// ── curtains ──────────────────────────────────────────────────────────────
// Velvet, from dark to sheen. A shade family of the signal green, deeper and
// bluer, so the curtain reads as cloth and the signal still reads as light.
const VELVET = [[2, 16, 9], [6, 44, 26], [11, 82, 50], [44, 150, 102]];
function velvet(s) {
  const k = Math.max(0, Math.min(1, s)) * (VELVET.length - 1);
  const i = Math.min(VELVET.length - 2, Math.floor(k)), f = k - i;
  const a = VELVET[i], b = VELVET[i + 1];
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(",")})`;
}

// If the page was slow to arrive, the reader is already looking at it: closing
// the curtains on them now would be a flicker, not a flourish. Only a prompt
// first arrival gets the opening.
let opened = performance.now() > 1500;
try { opened = opened || sessionStorage.getItem("bb-curtains") === "1"; sessionStorage.setItem("bb-curtains", "1"); } catch { /* private mode: open every time */ }

for (const stage of document.querySelectorAll("[data-lodge]")) {
  const canvas = document.createElement("canvas");
  canvas.className = "curtains";
  canvas.setAttribute("aria-hidden", "true");
  stage.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, rest = 0, raf = 0, visible = false, start = 0;
  const seed = [...Array(64)].map((_, i) => Math.sin(i * 12.9898) * 0.5);
  // A stage with no drawn scene of its own gets a night sky: stars and one
  // constellation, which one decided by the page's address so it is stable.
  const sky = !stage.querySelector("canvas[data-scene]");
  // The home scenes already carry DMT, 5-MeO-DMT, LSD and psilocybin.
  const names = ["MDMA", "Ketamine", "Serotonin", "Oxytocin"].filter((n) => MOLECULES[n]);
  const hash = [...location.pathname].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const molecule = names[hash % names.length];

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // Same numbers as --curtain in styles.css, which keeps the copy clear of it.
    rest = phone() ? 16 : Math.max(40, Math.min(128, innerWidth * 0.07));
  };

  // One curtain: vertical strips whose brightness follows the folds, each
  // strip swaying a little more toward the hem, darker away from the light.
  function curtain(side, width, t) {
    // Folds about 26px wide at rest; as the curtain opens it gathers, so the
    // same cloth packs into tighter folds, the way velvet does.
    const folds = Math.max(1.5, rest / 26);
    const strips = Math.max(24, Math.round(width / 2));
    const rows = 14;
    const amp = still ? 0 : Math.min(6, rest * 0.08);
    for (let i = 0; i < strips; i++) {
      const u0 = i / strips, u1 = (i + 1) / strips;
      const phase = u0 * folds * Math.PI * 2 + seed[i % 64];
      const wave = 0.5 + 0.5 * Math.cos(phase);
      // Body of the fold, plus a narrow sheen on its crest: velvet, not satin.
      const s = Math.pow(wave, 1.3) * 0.8 + Math.pow(wave, 14) * 0.35;
      ctx.fillStyle = velvet(0.06 + s * 0.94);
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const y = (r / rows) * H;
        const dx = Math.sin(y * 0.006 + t * 0.0007 + u0 * 5) * amp * (y / H);
        const x = side === "left" ? u0 * width + dx : W - u1 * width - dx;
        r ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      for (let r = rows; r >= 0; r--) {
        const y = (r / rows) * H;
        const dx = Math.sin(y * 0.006 + t * 0.0007 + u1 * 5) * amp * (y / H);
        const x = side === "left" ? u1 * width + dx + 0.6 : W - u0 * width - dx + 0.6;
        ctx.lineTo(x, y);
      }
      ctx.fill();
    }
    // Light from above: the hem sinks into shadow.
    const x0 = side === "left" ? 0 : W - width - amp;
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(0.55, "rgba(0,0,0,0.18)"); shade.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = shade; ctx.fillRect(x0, 0, width + amp + 1, H);
    // The curtain throws a soft shadow onto the stage.
    const edge = side === "left" ? width : W - width;
    const cast = ctx.createLinearGradient(edge, 0, edge + (side === "left" ? 28 : -28), 0);
    cast.addColorStop(0, "rgba(0,0,0,0.55)"); cast.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cast;
    ctx.fillRect(side === "left" ? edge : edge - 28, 0, 28, H);
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const frame = (t) => {
    if (!start) start = t;
    const p = opened || still ? 1 : ease(Math.max(0, Math.min(1, (t - start - 250) / 2200)));
    const width = W / 2 + 2 - (W / 2 + 2 - rest) * p;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (sky) {
      starfield(ctx, W, 0, H * 0.8, phone() ? 20 : 44, hash, t, still);
      if (phone()) constellation(ctx, molecule, W * 0.78, H * 0.14, 7.5, 0.3, t, still, 0.75);
      // High in the corner, above any column of copy a page hero may have.
      else constellation(ctx, molecule, W - rest - 120, 70, 10, 0.3, t, still);
    }
    curtain("left", width, t);
    curtain("right", width, t);
    if (!still && visible) raf = requestAnimationFrame(frame);
  };
  size();
  let lastW = innerWidth;
  addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; size(); if (still) frame(performance.now()); }, { passive: true });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(stage);
  if (still) frame(performance.now());
}

// ── the rabbit holes turn as you scroll past them, as if falling ──────────
const holes = [...document.querySelectorAll(".rabbit-hole svg")];
if (holes.length && !still) {
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const h of holes) h.style.transform = `rotate(${(scrollY * 0.35) % 360}deg)`;
    });
  }, { passive: true });
}

// ── the cat ───────────────────────────────────────────────────────────────
const cat = document.querySelector(".cat");
if (cat) {
  // Where it may sit on this page. Nothing that could land on words or a
  // button: the tree only on wide screens (on a phone the crown is behind
  // the copy), curtain peeks only where the curtain has room.
  const spots = [];
  const perch = document.querySelector("[data-cat-perch]");
  if (perch && !phone()) spots.push(["tree", perch]);
  for (const s of document.querySelectorAll(".stage-floored")) spots.push(["floor", s]);
  if (!phone()) for (const s of document.querySelectorAll("[data-lodge]")) spots.push(["peek", s]);
  const foot = document.querySelector("footer");
  if (foot) spots.push(["footer", foot]);
  if (spots.length) {
    // ?cat=tree|floor|peek|footer pins the spot, for checking each one.
    const want = new URLSearchParams(location.search).get("cat");
    const [kind, host] = spots.find(([k]) => k === want) ?? spots[Math.floor(Math.random() * spots.length)];
    cat.classList.add(`cat-${kind}`);
    if (kind === "floor" || kind === "footer") cat.style.setProperty("--cat-x", `${Math.round(58 + Math.random() * 30)}%`);
    if (kind === "peek") cat.style.setProperty("--cat-y", `${Math.round(24 + Math.random() * 20)}%`);
    host.append(cat);
    cat.hidden = false;
    // The eyes follow the pointer, a pixel or so — enough to feel watched.
    const eyes = cat.querySelector(".cat-eyes");
    if (!still && eyes) {
      addEventListener("pointermove", (e) => {
        const r = cat.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        eyes.style.transform = `translate(${((dx / d) * 1.2).toFixed(2)}px, ${((dy / d) * 1).toFixed(2)}px)`;
      }, { passive: true });
    }
  }
}
