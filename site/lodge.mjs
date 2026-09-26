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

// ── the floor, as the camera glides ──────────────────────────────────────
// Lynch's floors do not move; the camera does. As the reader goes down the
// page the chevrons flow toward them and the floor tilts a little further
// away, like a slow dolly shot; the footer's strip slides with it.
if (!still) {
  let queued = false;
  const glide = () => {
    queued = false;
    document.documentElement.style.setProperty("--fy", `${(scrollY * 0.2).toFixed(1)}px`);
    document.documentElement.style.setProperty("--ftilt", Math.min(1, scrollY / innerHeight).toFixed(3));
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(glide); } }, { passive: true });
  glide();
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
    // A real rabbit's dive: crouch, spring in an arc, land nose-first at the
    // lip of the hole and sink into it — the floor swallows him from the feet
    // up — then, after a while, his ears come up first and he climbs out,
    // turns, and hops back to his place to go on fretting.
    const dive = () => {
      seat();
      const r = rabbit.getBoundingClientRect(), b = burrow.getBoundingClientRect();
      const h = r.height;
      const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height * 0.5 - r.bottom;
      burrow.classList.add("gulp");
      const whole = "inset(-20% -20% 0% -20%)", gone = "inset(-20% -20% 100% -20%)";
      const out = hop.animate([
        { transform: "translate(0, 0) rotate(0) scale(1, 1)", clipPath: whole, offset: 0 },
        { transform: "translate(0, 4%) rotate(0) scale(1.06, 0.9)", clipPath: whole, offset: 0.18, easing: "cubic-bezier(.3,0,.6,1)" },
        { transform: `translate(${dx * 0.5}px, ${dy - h * 0.32}px) rotate(12deg) scale(0.96, 1.06)`, clipPath: whole, offset: 0.46, easing: "cubic-bezier(.4,0,1,1)" },
        { transform: `translate(${dx}px, ${dy}px) rotate(24deg) scale(1.03, 0.95)`, clipPath: whole, offset: 0.66, easing: "cubic-bezier(.5,0,.8,.6)" },
        { transform: `translate(${dx}px, ${dy + h * 1.05}px) rotate(24deg) scale(1, 1)`, clipPath: gone, offset: 1 },
      ], { duration: 1500, fill: "forwards" });
      out.onfinish = () => setTimeout(() => {
        const back = hop.animate([
          { transform: `translate(${dx}px, ${dy + h * 1.05}px) scale(-1, 1)`, clipPath: gone, offset: 0 },
          { transform: `translate(${dx}px, ${dy + h * 0.55}px) scale(-1, 1)`, clipPath: "inset(-20% -20% 55% -20%)", offset: 0.25, easing: "ease-out" },
          { transform: `translate(${dx}px, ${dy}px) scale(-1, 1)`, clipPath: whole, offset: 0.42, easing: "cubic-bezier(.3,0,.6,1)" },
          { transform: `translate(${dx * 0.5}px, ${-h * 0.28}px) scale(-0.97, 1.04)`, clipPath: whole, offset: 0.6, easing: "cubic-bezier(.4,0,1,1)" },
          { transform: `translate(${dx * 0.12}px, 0) scale(-1.05, 0.92)`, clipPath: whole, offset: 0.76 },
          { transform: "translate(0, -6%) scale(-1, 1)", clipPath: whole, offset: 0.86 },
          { transform: "translate(0, 0) scale(1, 1)", clipPath: whole, offset: 1 },
        ], { duration: 2400, fill: "forwards" });
        back.onfinish = () => { burrow.classList.remove("gulp"); out.cancel(); back.cancel(); };
      }, 3600);
    };
    // Between dives he wanders: a few hops along the floor, a pause, a look
    // back; he never strays far from his hole.
    let pos = 0, busy = false;
    const face = (d) => { const f = rabbit.querySelector(".fig"); if (f) f.style.scale = d < 0 ? "-1 1" : "1 1"; };
    const wander = () => {
      if (busy || !onScreen || document.hidden) return;
      busy = true;
      const target = Math.max(-170, Math.min(40, pos + (Math.random() - 0.5) * 220)), d = Math.sign(target - pos) || 1;
      const hops = Math.max(1, Math.round(Math.abs(target - pos) / 42)), step = (target - pos) / hops;
      face(d);
      const frames = [];
      for (let k = 0; k < hops; k++) {
        const x0 = pos + step * k;
        frames.push({ translate: `${x0}px 0`, offset: k / hops });
        frames.push({ translate: `${x0 + step / 2}px -16px`, offset: (k + 0.5) / hops });
      }
      frames.push({ translate: `${target}px 0`, offset: 1 });
      rabbit.animate(frames, { duration: hops * 380, easing: "ease-in-out", fill: "forwards" }).onfinish = () => {
        pos = target;
        rabbit.style.translate = `${pos}px 0`;
        setTimeout(() => { if (Math.random() < 0.6) face(1); busy = false; }, 900 + Math.random() * 1400);
      };
    };
    let onScreen = false, timer = 0;
    const next = (ms) => { clearTimeout(timer); timer = setTimeout(() => { if (onScreen && !document.hidden && !busy) { busy = true; face(1); dive(); setTimeout(() => { busy = false; }, 8000); } next(16000 + Math.random() * 12000); }, ms); };
    setInterval(() => { if (Math.random() < 0.55) wander(); }, 5200);
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
    // Only pages worth landing on: the build lists them (live projects with
    // a screenshot, and the site's main rooms).
    const pages = (burrow.dataset.to || "").split(" ").filter((p) => p && p !== location.pathname);
    const dest = pages.length ? pages[Math.floor(Math.random() * pages.length)] : burrow.getAttribute("href");
    if (still) { location.href = dest; return; }
    const b = burrow.getBoundingClientRect();
    const fall = document.createElement("div");
    fall.className = "falling";
    fall.style.setProperty("--fx", `${b.left + b.width / 2}px`);
    fall.style.setProperty("--fy", `${b.top + b.height / 2}px`);
    fall.innerHTML = `${burrow.querySelector("svg").outerHTML}<img class="falling-worm" src="/art/wormhole.webp" alt="">`;
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
          { transform: `translate(${-dir * 10}px, -38px) rotate(${-dir * 70}deg)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${-dir * 30}px, 20px) rotate(${-dir * 170}deg)`, opacity: 1, offset: 0.8 },
          { transform: `translate(${-dir * 34}px, 18px) rotate(${-dir * 180}deg)`, opacity: 0 },
        ], { duration: 1100, easing: "cubic-bezier(.2,.6,.5,1)", fill: "forwards" });
        // The kit: ears over the rim first, a look left and right, a spring
        // out of the shell, a squashy landing, a moment's sitting — then off
        // in small bounding hops.
        fox.hidden = false; fox.classList.add("kit");
        const kit = fox.querySelector(".fox-kit");
        const kw = kit.offsetWidth || 64, kh = kit.offsetHeight || 78;
        fox.style.left = `${x - kw / 2}px`;
        const sink = kh * 0.72, rim = kh * 0.42, out = "inset(-40% -40% 0 -40%)";
        const born = kit.animate([
          { transform: `translate(0, ${sink}px)`, clipPath: `inset(-40% -40% ${sink}px -40%)`, offset: 0 },
          { transform: `translate(0, ${rim}px)`, clipPath: `inset(-40% -40% ${rim}px -40%)`, offset: 0.16, easing: "ease-out" },
          { transform: `translate(0, ${rim}px) rotate(-9deg)`, clipPath: `inset(-40% -40% ${rim}px -40%)`, offset: 0.28 },
          { transform: `translate(0, ${rim}px) rotate(9deg)`, clipPath: `inset(-40% -40% ${rim}px -40%)`, offset: 0.4 },
          { transform: `translate(0, ${rim * 1.15}px) scale(1.06, 0.9)`, clipPath: `inset(-40% -40% ${rim * 1.15}px -40%)`, offset: 0.5, easing: "cubic-bezier(.3,0,.6,1)" },
          { transform: `translate(${dir * kw * 0.35}px, ${-kh * 0.35}px) scale(0.95, 1.08)`, clipPath: out, offset: 0.64, easing: "cubic-bezier(.4,0,1,1)" },
          { transform: `translate(${dir * kw * 0.7}px, 0) scale(1.14, 0.84)`, clipPath: out, offset: 0.74, easing: "ease-out" },
          { transform: `translate(${dir * kw * 0.7}px, -4px) scale(0.97, 1.04)`, clipPath: out, offset: 0.8 },
          { transform: `translate(${dir * kw * 0.7}px, 0) scale(1, 1)`, clipPath: out, offset: 1 },
        ], { duration: 4200, fill: "forwards" });
        born.onfinish = () => {
          const start = x - kw / 2 + dir * kw * 0.7, w = foxStage.clientWidth;
          const end = dir > 0 ? w + kw : -kw * 2, dist = Math.abs(end - start);
          const hops = Math.max(4, Math.round(dist / 46)), hopMs = 330;
          born.cancel();
          kit.style.scale = dir > 0 ? "1 1" : "-1 1";
          const go = fox.animate([{ left: `${start}px` }, { left: `${end}px` }], { duration: hops * hopMs, easing: "linear", fill: "forwards" });
          kit.animate([
            { transform: "translate(0, 0) scale(1.06, 0.9)" },
            { transform: "translate(0, -22px) scale(0.96, 1.06)", offset: 0.45, easing: "cubic-bezier(.3,0,.7,1)" },
            { transform: "translate(0, 0) scale(1.08, 0.88)" },
          ], { duration: hopMs, iterations: hops, easing: "cubic-bezier(.4,0,.6,1)" });
          go.onfinish = () => { go.cancel(); fox.hidden = true; fox.classList.remove("kit"); kit.style.scale = ""; };
        };
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
  // (The tree is not a seat: a painted kitten on a line-drawn branch looked
  // pasted on. It sits on floors, peeks from curtains, or waits by the footer.)
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
  // The whale swims rather than slides: a long, slow undulating path across
  // the sky, its body pitching to follow the rise and fall, rising a little
  // as it goes. First soon after arrival, then as a rare sighting.
  const swim = () => {
    if (document.hidden) return;
    whale.hidden = false;
    const w = whale.offsetWidth || 380, from = innerWidth + 60, to = -w - 60;
    const dur = (phone() ? 48 : 70) * 1000, t0 = performance.now();
    const step = (now) => {
      const u = (now - t0) / dur;
      if (u >= 1) { whale.hidden = true; return; }
      // It comes from far away and high, swims closer as it crosses — larger,
      // lower, turning its body a little toward us — and recedes again.
      const x = from + (to - from) * u;
      const near = Math.sin(u * Math.PI);
      const wave = Math.sin(u * Math.PI * 3.4), slope = Math.cos(u * Math.PI * 3.4);
      const y = wave * 22 + near * innerHeight * 0.1 - 20;
      const s = 0.5 + near * 0.75;
      const turn = Math.cos(u * Math.PI) * 18;
      whale.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) perspective(900px) rotateY(${turn.toFixed(1)}deg) rotate(${(slope * 4 - 1).toFixed(2)}deg) scale(${s.toFixed(3)})`;
      whale.style.filter = `blur(${((1 - near) * 1.2).toFixed(2)}px)`;
      whale.style.opacity = Math.min(1, u / 0.06, (1 - u) / 0.06).toFixed(3);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const sight = (ms) => setTimeout(() => { swim(); sight(120000 + Math.random() * 90000); }, ms);
  sight(5000 + Math.random() * 6000);

  // In fog, something vast walks slowly past, far off — whenever the fog
  // comes, whether the visit began in it or the reader turned it on.
  let walking = 0;
  const walk = (ms) => { clearTimeout(walking); walking = setTimeout(() => { if (!document.hidden && document.documentElement.dataset.weather === "mist") pass(walker, 140, false); walk(200000); }, ms); };
  if (document.documentElement.dataset.weather === "mist") walk(6000);
  document.addEventListener("weather", (e) => { if (e.detail === "mist" && walker.hidden) walk(2500); });
}

// ── depth under the pointer ───────────────────────────────────────────────
// Three planes shift at different rates as the pointer moves — the far
// horizon hardly at all, the floor more, the foreground most — the cheapest
// honest cue that this is a space and not a picture. Desktop only.
if (!still && matchMedia("(pointer: fine)").matches) {
  let tx = 0, cx = 0, raf = 0;
  addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; if (!raf) raf = requestAnimationFrame(step); }, { passive: true });
  function step() {
    cx += (tx - cx) * 0.08;
    document.documentElement.style.setProperty("--px", cx.toFixed(4));
    raf = Math.abs(tx - cx) > 0.002 ? requestAnimationFrame(step) : 0;
  }
}

// ── the inner pages' stories ─────────────────────────────────────────────
// One guest per stage, living in the floor's depth: far is small, high on the
// floor and hazy; near is large and low. Each only moves while its stage is
// on screen; under reduced motion each simply stays where it is.
const guest = document.querySelector(".guest");
const stageFloor = document.querySelector("[data-lodge].stage-floored");
if (guest && stageFloor) {
  stageFloor.append(guest);
  guest.hidden = false;
  const W = () => stageFloor.clientWidth, Hs = () => stageFloor.clientHeight;
  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.2 }).observe(stageFloor);
  const every = (ms, fn) => setInterval(() => { if (onScreen && !document.hidden && !still) fn(); }, ms);
  const kind = [...guest.classList].find((c) => c.startsWith("guest-") && c !== "guest").slice(6);

  if (kind === "owl") {
    // It sits on its branch by the right curtain; now and then it flies a
    // wide slow loop across the stage — nearer as it passes — and lands again.
    const perch = guest.querySelector(".owl-perch"), fly = guest.querySelector(".owl-flying");
    every(24000, () => {
      const pr = perch.getBoundingClientRect(), sr = stageFloor.getBoundingClientRect();
      const x0 = pr.left - sr.left, y0 = pr.top - sr.top;
      perch.style.opacity = "0"; fly.hidden = false;
      const w = W();
      fly.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(0.7)`, offset: 0 },
        { transform: `translate(${w * 0.45}px, ${y0 + 40}px) scale(1.25)`, offset: 0.35 },
        { transform: `translate(${w * 0.08}px, ${y0 - 10}px) scale(0.8) scaleX(-1)`, offset: 0.6 },
        { transform: `translate(${w * 0.5}px, ${y0 - 30}px) scale(0.6) scaleX(-1)`, offset: 0.8 },
        { transform: `translate(${x0}px, ${y0}px) scale(0.7)`, offset: 1 },
      ], { duration: 9000, easing: "ease-in-out" }).onfinish = () => { fly.hidden = true; perch.style.opacity = ""; };
    });
  }

  if (kind === "horse") {
    // Far off on the floor it stands like something half-remembered; now and
    // then it gallops across, coming nearer as it goes, and stands again.
    const stand = guest.querySelector(".horse-stand"), run = guest.querySelector(".horse-gallop");
    every(30000, () => {
      stand.style.opacity = "0"; run.hidden = false;
      const w = W();
      run.animate([
        { transform: `translate(${w + 40}px, 0) scale(0.55)`, opacity: 0 },
        { transform: `translate(${w * 0.8}px, 6px) scale(0.65)`, opacity: 0.9, offset: 0.12 },
        { transform: `translate(${w * 0.2}px, 30px) scale(1)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${-w * 0.2}px, 36px) scale(1.1)`, opacity: 0 },
      ], { duration: 6500, easing: "linear" }).onfinish = () => { run.hidden = true; stand.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2400 }).onfinish = () => { stand.style.opacity = ""; }; };
    });
  }

  if (kind === "unicorn") {
    // Rare, and shy: it stands far back on the floor, half in the dark, and
    // when the pointer comes near it fades away, returning a while later.
    guest.style.pointerEvents = "auto";
    let gone = false;
    guest.addEventListener("pointerenter", () => {
      if (gone || still) return; gone = true;
      guest.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 1600, fill: "forwards" }).onfinish = () => setTimeout(() => {
        guest.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 3000, fill: "forwards" }).onfinish = () => { gone = false; };
      }, 9000);
    });
  }

  if (kind === "snail") {
    // It crawls, very slowly, along the front of the floor; touch it and it
    // draws into its shell for a while.
    let x = W() * 0.12, tucked = 0;
    const img = guest.querySelector(".fig");
    guest.style.pointerEvents = "auto";
    guest.addEventListener("pointerdown", () => { tucked = performance.now() + 4000; img.animate([{ scale: "1 1" }, { scale: "0.9 0.8" }], { duration: 300, fill: "forwards" }); });
    let last = performance.now();
    const crawl = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (onScreen && !still && t > tucked) {
        if (tucked && t - tucked < 50) img.animate([{ scale: "0.9 0.8" }, { scale: "1 1" }], { duration: 900, fill: "forwards" });
        x += dt * 6;
        if (x > W() * 0.9) x = W() * 0.05;
        guest.style.transform = `translateX(${x.toFixed(1)}px)`;
      }
      requestAnimationFrame(crawl);
    };
    guest.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(crawl);
  }

  if (kind === "moth") {
    // Drawn to the pointer as to a lamp: it flutters near it, now closer, now
    // further off; with no pointer it wanders over the stage.
    let x = W() * 0.7, y = Hs() * 0.35, z = 1, px = null, py = null;
    const img = guest.querySelector(".fig");
    stageFloor.addEventListener("pointermove", (e) => { const r = stageFloor.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; }, { passive: true });
    stageFloor.addEventListener("pointerleave", () => { px = null; });
    const tick = (t) => {
      if (onScreen && !still) {
        const tx = (px ?? W() * (0.5 + 0.3 * Math.sin(t * 0.0003))) + Math.sin(t * 0.004) * 40;
        const ty = (py ?? Hs() * (0.35 + 0.15 * Math.sin(t * 0.0005))) + Math.cos(t * 0.0053) * 30;
        const tz = 0.7 + 0.35 * Math.sin(t * 0.0011);
        x += (tx - x) * 0.04; y += (ty - y) * 0.04; z += (tz - z) * 0.05;
        const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.03));
        guest.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${z.toFixed(3)})`;
        img.style.scale = `${flap.toFixed(3)} 1`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (kind === "scarab") {
    // Khepri: the scarab rolls the sun. It walks backwards, as dung beetles
    // do, pushing its golden ball from the far side of the floor toward us;
    // the ball turns as it rolls, and both grow as they come nearer.
    const ball = guest.querySelector(".sunball");
    let u = 0, last = performance.now();
    const roll = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (onScreen && !still) {
        u += dt / 46;
        if (u > 1.08) u = -0.05;
        const w = W(), d = Math.max(0, Math.min(1, u));
        const x = w * (0.08 + d * 0.72), y = -d * -0.0 + (1 - d) * -46, s = 0.55 + d * 0.6;
        guest.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
        guest.style.opacity = Math.max(0, Math.min(1, u / 0.05, (1.05 - u) / 0.06)).toFixed(3);
        ball.style.rotate = `${(u * 2200).toFixed(1)}deg`;
      }
      requestAnimationFrame(roll);
    };
    requestAnimationFrame(roll);
  }
}
