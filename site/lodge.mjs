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

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = () => innerWidth < 700;

// ── curtains ──────────────────────────────────────────────────────────────
// Velvet, from dark to sheen. A shade family of the signal green, deeper and
// bluer, so the curtain reads as cloth and the signal still reads as light.
// Night velvet is deep; by day the same cloth hangs in sunlight.
const VELVET_NIGHT = [[2, 16, 9], [6, 44, 26], [11, 82, 50], [44, 150, 102]];
const VELVET_DAY = [[14, 60, 40], [28, 100, 68], [54, 142, 98], [168, 218, 186]];
const isNight = () => document.documentElement.classList.contains("dark");
function velvet(s) {
  const VELVET = isNight() ? VELVET_NIGHT : VELVET_DAY;
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
    const hem = isNight() ? 0.6 : 0.28;
    shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(0.55, `rgba(0,0,0,${hem * 0.3})`); shade.addColorStop(1, `rgba(0,0,0,${hem})`);
    ctx.fillStyle = shade; ctx.fillRect(x0, 0, width + amp + 1, H);
    // The curtain throws a soft shadow onto the stage.
    const edge = side === "left" ? width : W - width;
    const cast = ctx.createLinearGradient(edge, 0, edge + (side === "left" ? 28 : -28), 0);
    cast.addColorStop(0, "rgba(0,0,0,0.55)"); cast.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cast;
    ctx.fillRect(side === "left" ? edge : edge - 28, 0, 28, H);
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let drawn = 0;
  const frame = (t) => {
    if (!start) start = t;
    const p = opened || still ? 1 : ease(Math.max(0, Math.min(1, (t - start - 250) / 2200)));
    // Once open, the velvet only sways: twenty frames a second is enough.
    if (p >= 1 && t - drawn < 48 && !still) { if (visible) raf = requestAnimationFrame(frame); return; }
    drawn = t;
    const width = W / 2 + 2 - (W / 2 + 2 - rest) * p;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
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

// ── falling through the rabbit holes ──────────────────────────────────────
// Each spiral between chapters turns counter-clockwise, so its arms flow
// inward, and swells as it passes the middle of the screen: you fall through
// it into the next chapter.
const holes = [...document.querySelectorAll(".rabbit-hole svg")];
if (holes.length && !still) {
  let queued = false;
  const fall = () => {
    queued = false;
    const mid = innerHeight / 2;
    for (const h of holes) {
      const r = h.getBoundingClientRect();
      const k = Math.max(0, 1 - Math.abs(r.top + r.height / 2 - mid) / (innerHeight * 0.5));
      h.style.transform = `rotate(${(-scrollY * 0.35) % 360}deg) scale(${(1 + k * k * 1.8).toFixed(3)})`;
      h.style.opacity = (0.55 + k * 0.45).toFixed(2);
    }
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(fall); } }, { passive: true });
  fall();
}

// ── the White Rabbit ─────────────────────────────────────────────────────
// He sits on the Lodge floor beside the burrow — a hole in the floor itself —
// fretting over his watch. Every so often he is late: a crouch, a hop, a dive
// into the spiral; a few seconds later he climbs back out.
const rabbit = document.querySelector(".rabbit");
const burrow = document.querySelector(".burrow");
if (rabbit && burrow) {
  const hero = burrow.closest("section");
  const seat = () => {
    const h = hero.getBoundingClientRect(), b = burrow.getBoundingClientRect();
    const w = rabbit.offsetWidth || 84;
    rabbit.style.left = `${(b.left - h.left - w * 0.9).toFixed(1)}px`;
    rabbit.style.top = `${(b.top - h.top + b.height * 0.55 - w * 1.02).toFixed(1)}px`;
  };
  seat();
  let lastW = innerWidth;
  addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; seat(); } }, { passive: true });
  addEventListener("load", seat, { once: true });
  const hop = rabbit.firstElementChild;
  if (!still) {
    const dive = () => {
      seat();
      const r = rabbit.getBoundingClientRect(), b = burrow.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height * 0.85);
      burrow.classList.add("gulp");
      const out = hop.animate([
        { transform: "translate(0, 0) scale(1, 1)" },
        { transform: "translate(0, 5px) scale(1.08, 0.88)", offset: 0.16 },
        { transform: `translate(${dx * 0.55}px, ${dy - r.height * 0.55}px) rotate(14deg)`, offset: 0.48 },
        { transform: `translate(${dx}px, ${dy}px) rotate(70deg) scale(0.15)`, opacity: 0, offset: 0.82 },
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
      ], { duration: 1600, easing: "ease-in", fill: "forwards" });
      out.onfinish = () => setTimeout(() => {
        const back = hop.animate([
          { transform: `translate(${dx}px, ${dy + 8}px) scale(0.85)`, opacity: 0 },
          { transform: `translate(${dx}px, ${dy - r.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${dx * 0.4}px, ${-r.height * 0.3}px)`, offset: 0.68 },
          { transform: "translate(0, 0)" },
        ], { duration: 1700, easing: "ease-out", fill: "forwards" });
        back.onfinish = () => { burrow.classList.remove("gulp"); out.cancel(); back.cancel(); };
      }, 3200);
    };
    let onScreen = false, timer = 0;
    const next = (ms) => { clearTimeout(timer); timer = setTimeout(() => { if (onScreen && !document.hidden) dive(); next(16000 + Math.random() * 12000); }, ms); };
    new IntersectionObserver(([e]) => { const was = onScreen; onScreen = e.isIntersecting; if (onScreen && !was && !timer) next(5000); }, { threshold: 0.4 }).observe(hero);
  }
}

// ── down the rabbit hole ─────────────────────────────────────────────────
// Following the White Rabbit takes you somewhere on this site — nobody knows
// where, not even him: a spiral opens from the hole and fills the screen,
// and you land on a page chosen at random from the site's own map.
if (burrow) {
  burrow.addEventListener("click", async (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    let dest = burrow.getAttribute("href");
    try {
      const xml = await (await fetch("/sitemap.xml")).text();
      const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => p !== location.pathname && p !== "/");
      if (pages.length) dest = pages[Math.floor(Math.random() * pages.length)];
    } catch { /* offline: the work page will do */ }
    if (still) { location.href = dest; return; }
    const b = burrow.getBoundingClientRect();
    const fall = document.createElement("div");
    fall.className = "falling";
    fall.style.setProperty("--fx", `${b.left + b.width / 2}px`);
    fall.style.setProperty("--fy", `${b.top + b.height / 2}px`);
    fall.innerHTML = burrow.querySelector("svg").outerHTML;
    document.body.append(fall);
    setTimeout(() => { location.href = dest; }, 950);
  });
}

// ── the egg, and the fox ─────────────────────────────────────────────────
// On the inner pages a speckled egg sits on the stage floor. While the stage
// is on screen it wobbles, the shell breaks, its cap tumbles away, and a fox
// kit sits up in the half-shell, looks about, grows — and runs off. The empty
// half-shell stays where it was: something has begun, and something is over.
// After that, now and then, the grown fox runs across the stage.
const fox = document.querySelector(".fox");
const egg = document.querySelector(".egg");
const foxStage = document.querySelector("[data-lodge].stage-floored");
if (fox && egg && foxStage) {
  foxStage.append(egg, fox);
  egg.hidden = false;
  const eggX = () => foxStage.clientWidth * (phone() ? 0.8 : 0.72);
  egg.style.left = `${eggX()}px`;
  const cap = egg.querySelector(".egg-cap");
  if (still) { egg.classList.add("hatched"); cap.hidden = true; }
  else {
    let onScreen = false, timer = 0, hatched = false;
    const runW = () => fox.offsetWidth || 150;
    const run = (fromX, dir) => {
      const w = foxStage.clientWidth, sz = runW();
      const to = dir > 0 ? w + sz : -sz;
      fox.hidden = false; fox.classList.remove("kit");
      fox.style.transform = `scaleX(${dir})`;
      const go = fox.animate([{ left: `${fromX}px` }, { left: `${to}px` }], { duration: (Math.abs(to - fromX) / 420) * 1000, easing: "cubic-bezier(.45,0,1,1)" });
      go.onfinish = () => { fox.hidden = true; };
    };
    const hatch = () => {
      hatched = true;
      const x = eggX();
      const wobble = egg.animate([
        { transform: "rotate(0)" }, { transform: "rotate(-8deg)", offset: 0.12 }, { transform: "rotate(6deg)", offset: 0.24 }, { transform: "rotate(0)", offset: 0.34 },
        { transform: "rotate(0)", offset: 0.55 }, { transform: "rotate(-11deg)", offset: 0.66 }, { transform: "rotate(10deg)", offset: 0.78 }, { transform: "rotate(-4deg)", offset: 0.88 }, { transform: "rotate(0)" },
      ], { duration: 2200, easing: "ease-in-out" });
      wobble.onfinish = () => {
        const dir = x > foxStage.clientWidth / 2 ? 1 : -1;
        egg.classList.add("hatched");
        cap.animate([
          { transform: "translate(0, 0) rotate(0)", opacity: 1 },
          { transform: `translate(${-dir * 16}px, -34px) rotate(${-dir * 55}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${-dir * 30}px, 18px) rotate(${-dir * 160}deg)`, opacity: 0 },
        ], { duration: 950, easing: "cubic-bezier(.2,.6,.5,1)", fill: "forwards" });
        // The kit sits up out of the shell, looks both ways, and grows.
        fox.hidden = false; fox.classList.add("kit");
        fox.style.left = `${x}px`;
        const kit = fox.querySelector(".fox-kit");
        const born = kit.animate([
          { transform: `translate(-50%, 40%) scale(${dir * 0.35}, 0.35)`, opacity: 0 },
          { transform: `translate(-50%, 8%) scale(${dir * 0.5}, 0.5)`, opacity: 1, offset: 0.2 },
          { transform: `translate(-50%, 8%) scale(${-dir * 0.5}, 0.5)`, offset: 0.4 },
          { transform: `translate(-50%, 8%) scale(${dir * 0.5}, 0.5)`, offset: 0.55 },
          { transform: `translate(-50%, 0) scale(${dir * 0.85}, 0.85)` },
        ], { duration: 2600, easing: "ease-out", fill: "forwards" });
        born.onfinish = () => { born.cancel(); run(x - runW() / 2, dir); };
      };
    };
    const next = (ms) => { clearTimeout(timer); timer = setTimeout(() => { if (onScreen && !document.hidden) { const dir = Math.random() < 0.5 ? 1 : -1; run(dir > 0 ? -runW() : foxStage.clientWidth + runW(), dir); } next(26000 + Math.random() * 22000); }, ms); };
    new IntersectionObserver(([e]) => {
      const was = onScreen; onScreen = e.isIntersecting;
      if (onScreen && !was && !hatched) setTimeout(() => { if (onScreen && !hatched) { hatch(); next(30000); } }, 1800);
    }, { threshold: 0.4 }).observe(foxStage);
  }
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
    // On a stage floor it keeps to the left half: the right is the egg's.
    if (kind === "floor") cat.style.setProperty("--cat-x", `${Math.round(16 + Math.random() * 22)}%`);
    if (kind === "footer") cat.style.setProperty("--cat-x", `${Math.round(58 + Math.random() * 30)}%`);
    if (kind === "peek") cat.style.setProperty("--cat-y", `${Math.round(24 + Math.random() * 20)}%`);
    host.append(cat);
    cat.hidden = false;
    const body = cat.querySelector(".fig");
    if (!still && matchMedia("(pointer: fine)").matches && body) {
      // It leans toward the pointer, a few degrees — enough to feel watched —
      // and if the pointer lingers near, it crouches and pounces, then goes
      // back to where it was sitting. Not on touch screens.
      let idleSince = 0, lastX = 0, lastY = 0, cooling = 0;
      addEventListener("pointermove", (e) => {
        if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 6) { idleSince = performance.now(); lastX = e.clientX; lastY = e.clientY; }
        const r = cat.getBoundingClientRect();
        const lean = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 400));
        cat.style.setProperty("--lean", `${(lean * 7).toFixed(2)}deg`);
      }, { passive: true });
      setInterval(() => {
        const now = performance.now();
        if (now < cooling || now - idleSince < 900 || cat.hidden) return;
        const r = cat.getBoundingClientRect();
        const dx = lastX - (r.left + r.width / 2), dy = lastY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d < 40 || d > 200 || Math.random() > 0.55) return;
        cooling = now + 7000;
        const k = Math.min(1, 130 / d), jx = dx * k, jy = dy * k;
        body.animate([
          { transform: "translate(0, 0) scale(1, 1)" },
          { transform: "translate(0, 3px) scale(1.1, 0.84)", offset: 0.18 },
          { transform: `translate(${jx * 0.5}px, ${jy * 0.5 - 46}px) scale(0.94, 1.08) rotate(${Math.sign(jx) * 12}deg)`, offset: 0.42 },
          { transform: `translate(${jx}px, ${jy}px) scale(1.08, 0.88)`, offset: 0.62 },
          { transform: `translate(${jx}px, ${jy}px) scale(1, 1)`, offset: 0.74 },
          { transform: "translate(0, 0) scale(1, 1)" },
        ], { duration: 1500, easing: "ease-in-out" });
      }, 400);
    }
  }
}

// ── weather, and what drifts through it ──────────────────────────────────
// The sky decides the weather once per visit (sky.mjs sets data-weather on
// <html>). Now and then a whale swims across the sky behind everything; in
// fog, something vast and long-legged walks slowly past, far off.
const skyLife = document.querySelector(".sky-life");
if (skyLife && !still) {
  const whale = skyLife.querySelector(".whale"), walker = skyLife.querySelector(".fog-walker");
  const pass = (el, seconds, rtl = true) => {
    el.hidden = false;
    const w = el.offsetWidth || 400;
    const a = el.animate([{ transform: `translateX(${rtl ? innerWidth + 40 : -w - 40}px)` }, { transform: `translateX(${rtl ? -w - 40 : innerWidth + 40}px)` }], { duration: seconds * 1000, easing: "linear" });
    a.onfinish = () => { el.hidden = true; };
  };
  // The whale: first a while after arrival, then rarely — a sighting, not a feature.
  const sight = (ms) => setTimeout(() => { if (!document.hidden) pass(whale, phone() ? 55 : 80); sight(150000 + Math.random() * 120000); }, ms);
  if (Math.random() < 0.7) sight(9000 + Math.random() * 16000);
  // In fog, something vast walks slowly past, far off — whenever the fog
  // comes, whether the visit began in it or the reader turned it on.
  let walking = 0;
  const walk = (ms) => { clearTimeout(walking); walking = setTimeout(() => { if (!document.hidden && document.documentElement.dataset.weather === "mist") pass(walker, 140, false); walk(200000); }, ms); };
  if (document.documentElement.dataset.weather === "mist") walk(6000);
  document.addEventListener("weather", (e) => { if (e.detail === "mist" && walker.hidden) walk(2500); });
}
