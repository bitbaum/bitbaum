// One sky behind every page. The site is a single landscape you fall
// through: the hero stands on the ground, and every section below is more of
// the same sky, drifting past a little slower than the page as you scroll.
// The theme is the time of day — dark is night (stars, the Milky Way, the
// molecule constellations, shooting stars), light is a clear Dalí day with
// the moon still up. The moon is always in today's real phase,
// its maria and bright craters where they really are.
//
// It also owns the palette the drawn scenes use, so a scene and its sky are
// always painted from the same colours: `palette` is updated when the theme
// changes, and scenes read it every frame.

const root = document.documentElement;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PARALLAX = still ? 0 : 0.3;

export const palette = { night: true, line: "235, 229, 216", signal: "62, 224, 143", hot: "255, 255, 255" };
function readPalette() {
  const cs = getComputedStyle(root);
  palette.night = root.classList.contains("dark");
  palette.line = cs.getPropertyValue("--line-rgb").trim().split(/\s+/).join(", ") || palette.line;
  palette.signal = cs.getPropertyValue("--signal-rgb").trim().split(/\s+/).join(", ") || palette.signal;
  palette.hot = palette.night ? "255, 255, 255" : palette.signal;
}
readPalette();

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The painted pieces the sky uses (site/art/): fetched once, when first
// asked for; until an image arrives its part of the sky simply waits.
const artCache = new Map();
let onArt = () => {};
function art(name) {
  if (!artCache.has(name)) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => onArt();
    img.src = `/art/${name}.webp`;
    artCache.set(name, img);
  }
  const img = artCache.get(name);
  return img.complete && img.naturalWidth ? img : null;
}

// ── weather ────────────────────────────────────────────────────────────────
// Chosen once per visit, weighted by the real season: snow is a winter thing,
// rain comes most in autumn, fog in any month. ?weather=clear|mist|rain|snow
// pins it. The choice is written to <html data-weather> so the page (and
// lodge.mjs, which sends things through the fog) can follow it.
export const WEATHERS = ["clear", "clouds", "wind", "mist", "rain", "snow"];
export let WEATHER = (() => {
  const pinned = new URLSearchParams(location.search).get("weather");
  if (WEATHERS.includes(pinned)) return pinned;
  let stored = null;
  try { stored = sessionStorage.getItem("bb-weather"); } catch { /* private mode */ }
  if (WEATHERS.includes(stored)) return stored;
  const m = new Date().getMonth();
  const table = m <= 1 || m === 11 ? [["clear", 0.35], ["snow", 0.35], ["mist", 0.3]]
    : m <= 4 ? [["clear", 0.45], ["rain", 0.25], ["mist", 0.3]]
    : m <= 7 ? [["clear", 0.6], ["rain", 0.15], ["mist", 0.25]]
    : [["clear", 0.35], ["rain", 0.3], ["mist", 0.35]];
  let r = Math.random(), w = "clear";
  for (const [k, p] of table) { if ((r -= p) < 0) { w = k; break; } }
  try { sessionStorage.setItem("bb-weather", w); } catch { /* ignore */ }
  return w;
})();
root.dataset.weather = WEATHER;
// The reader can turn the weather with one button; the choice holds for the
// rest of the visit and tells everyone who is listening.
export function setWeather(w, byReader = true) {
  WEATHER = w;
  root.dataset.weather = w;
  try { sessionStorage.setItem("bb-weather", w); if (byReader) sessionStorage.setItem("bb-weather-chosen", "1"); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent("weather", { detail: w }));
}
// The weather where the reader is, if we can know it without asking: the
// time zone names a city (Europe/Zurich → Zurich); Open-Meteo geocodes it and
// reports the weather there now. Only the city's name leaves the browser,
// no key, no location permission. If it is slow or unknown, the seasonal
// guess stands. A pin or the reader's own choice always wins.
export let PLACE = "";
(async () => {
  if (new URLSearchParams(location.search).get("weather")) return;
  let chosen = null;
  try { chosen = sessionStorage.getItem("bb-weather-chosen"); } catch { /* ignore */ }
  if (chosen) return;
  try {
    const cached = JSON.parse(sessionStorage.getItem("bb-weather-real") || "null");
    if (cached) { PLACE = cached.place; if (cached.w !== WEATHER) setWeather(cached.w, false); relabel(); return; }
  } catch { /* ignore */ }
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const city = zone.split("/").pop().replace(/_/g, " ");
  if (!city || /^(UTC|GMT|Etc)/i.test(zone)) return;
  const ctl = new AbortController();
  const stop = setTimeout(() => ctl.abort(), 3500);
  try {
    const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`, { signal: ctl.signal })).json();
    const g = geo.results?.[0];
    if (!g) return;
    const now = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=weather_code,wind_speed_10m`, { signal: ctl.signal })).json();
    const c = now.current?.weather_code;
    if (c == null) return;
    const wind = now.current?.wind_speed_10m ?? 0;
    const w = c === 45 || c === 48 ? "mist" : (c >= 71 && c <= 77) || c === 85 || c === 86 ? "snow" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95 ? "rain" : wind > 30 ? "wind" : c >= 2 ? "clouds" : "clear";
    PLACE = g.name;
    try { localStorage.setItem("bb-geo", JSON.stringify({ lat: g.latitude, lng: g.longitude })); dispatchEvent(new Event("bb-geo")); } catch { /* ignore */ }
    try { sessionStorage.setItem("bb-weather-real", JSON.stringify({ w, place: PLACE })); } catch { /* ignore */ }
    if (w !== WEATHER) setWeather(w, false);
    relabel();
  } catch { /* offline or slow: the seasonal guess stands */ } finally { clearTimeout(stop); }
})();
function relabel() { for (const b of document.querySelectorAll("[data-weather-cycle]")) b.dispatchEvent(new Event("relabel")); }

for (const b of document.querySelectorAll("[data-weather-cycle]")) {
  const label = () => {
    const now = `${WEATHER === "mist" ? "fog" : WEATHER}${PLACE ? ` — as in ${PLACE} now` : ""}`;
    b.setAttribute("aria-label", `Weather: ${now}. Change the weather`);
    b.title = `Weather: ${now}. Press to change it.`;
  };
  label();
  b.addEventListener("click", () => {
    setWeather(WEATHERS[(WEATHERS.indexOf(WEATHER) + 1) % WEATHERS.length]);
    for (const other of document.querySelectorAll("[data-weather-cycle]")) other.dispatchEvent(new Event("relabel"));
    b.classList.remove("turned"); void b.offsetWidth; b.classList.add("turned");
  });
  b.addEventListener("relabel", label);
}
// The season is the real one where the reader is: by month, turned over for
// the southern hemisphere once the weather lookup has learned the latitude.
const SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
export function season() {
  let m = new Date().getMonth();
  try { const g = JSON.parse(localStorage.getItem("bb-geo") || "null"); if (g && g.lat < 0) m = (m + 6) % 12; } catch { /* ignore */ }
  return new URLSearchParams(location.search).get("season") || SEASONS[m];
}
root.dataset.season = season();
addEventListener("bb-geo", () => { root.dataset.season = season(); });

// ── molecules, as skeletal formulas in bond lengths (y up) ─────────────────
const INDOLE = {
  C3a: [0.866, 0.5], C4: [0, 1], C5: [-0.866, 0.5], C6: [-0.866, -0.5], C7: [0, -1], C7a: [0.866, -0.5],
  N1: [1.817, -0.809], C2: [2.405, 0], C3: [1.817, 0.809],
};
const INDOLE_BONDS = [
  ["C3a", "C4"], ["C4", "C5", 2], ["C5", "C6"], ["C6", "C7", 2], ["C7", "C7a"], ["C7a", "C3a", 2],
  ["C7a", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C3a"],
];
const ARM = { Ca: [2.126, 1.76], Cb: [3.104, 1.968], N: [3.413, 2.919], Me1: [4.391, 3.127], Me2: [2.744, 3.662] };
const ARM_BONDS = [["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["N", "Me1"], ["N", "Me2"]];

export const MOLECULES = {
  dmt: { atoms: { ...INDOLE, ...ARM }, bonds: [...INDOLE_BONDS, ...ARM_BONDS] },
  meo: { atoms: { ...INDOLE, ...ARM, O: [-1.732, 1], Me3: [-1.732, 2] }, bonds: [...INDOLE_BONDS, ...ARM_BONDS, ["C5", "O"], ["O", "Me3"]] },
  psilocybin: {
    atoms: { ...INDOLE, ...ARM, O: [0, 2], P: [-0.866, 2.5], O2: [-0.866, 3.5], O3: [-1.866, 2.5], O4: [-1.4, 1.65] },
    bonds: [...INDOLE_BONDS, ...ARM_BONDS, ["C4", "O"], ["O", "P"], ["P", "O2", 2], ["P", "O3"], ["P", "O4"]],
  },
  serotonin: {
    atoms: { ...INDOLE, Ca: ARM.Ca, Cb: ARM.Cb, N: ARM.N, O: [-1.732, 1] },
    bonds: [...INDOLE_BONDS, ["C3", "Ca"], ["Ca", "Cb"], ["Cb", "N"], ["C5", "O"]],
  },
  // Ergoline: benzene and ring C share C11–C16, the pyrrole bridges their peri
  // positions through C16, ring D shares C5–C10 with ring C.
  lsd: {
    atoms: {
      C16: [0.866, 0.5], C15: [0, 1], C14: [-0.866, 0.5], C13: [-0.866, -0.5], C12: [0, -1], C11: [0.866, -0.5],
      N1: [0.37, 1.95], C2: [1.36, 1.95], C3: [1.732, 1], C4: [2.598, 0.5], C5: [2.598, -0.5], C10: [1.732, -1],
      N6: [3.464, -1], C7: [3.464, -2], C8: [2.598, -2.5], C9: [1.732, -2], Me: [4.33, -0.5],
      Cam: [2.598, -3.5], O: [1.732, -4], Nam: [3.464, -4], E1: [3.464, -5], E2: [4.33, -5.5], E3: [4.33, -3.5], E4: [5.196, -4],
    },
    bonds: [
      ["C16", "C15"], ["C15", "C14", 2], ["C14", "C13"], ["C13", "C12", 2], ["C12", "C11"], ["C11", "C16", 2],
      ["C15", "N1"], ["N1", "C2"], ["C2", "C3", 2], ["C3", "C16"], ["C3", "C4"], ["C4", "C5"], ["C5", "C10"], ["C10", "C11"],
      ["C5", "N6"], ["N6", "C7"], ["C7", "C8"], ["C8", "C9"], ["C9", "C10", 2], ["N6", "Me"],
      ["C8", "Cam"], ["Cam", "O", 2], ["Cam", "Nam"], ["Nam", "E1"], ["E1", "E2"], ["Nam", "E3"], ["E3", "E4"],
    ],
  },
  mdma: {
    atoms: {
      p0: [0.866, 0.5], p1: [0, 1], p2: [-0.866, 0.5], p3: [-0.866, -0.5], p4: [0, -1], p5: [0.866, -0.5],
      O1: [-1.817, 0.809], CH2: [-2.405, 0], O2: [-1.817, -0.809], Ca: [1.732, 1], Cb: [2.598, 0.5], Me: [2.598, -0.5], N: [3.464, 1], NMe: [4.33, 0.5],
    },
    bonds: [
      ["p0", "p1"], ["p1", "p2", 2], ["p2", "p3"], ["p3", "p4", 2], ["p4", "p5"], ["p5", "p0", 2],
      ["p2", "O1"], ["O1", "CH2"], ["CH2", "O2"], ["O2", "p3"], ["p0", "Ca"], ["Ca", "Cb"], ["Cb", "Me"], ["Cb", "N"], ["N", "NMe"],
    ],
  },
  // 2C-B: a phenethylamine — the ring with its two methoxy arms at 2 and 5,
  // the bromine at 4 (the larger star), and the ethylamine chain.
  "2cb": {
    atoms: {
      p0: [0.866, 0.5], p1: [0, 1], p2: [-0.866, 0.5], p3: [-0.866, -0.5], p4: [0, -1], p5: [0.866, -0.5],
      O1: [0, 2], Me1: [-0.866, 2.5], O2: [0, -2], Me2: [0.866, -2.5], Br: [-1.732, -1],
      Ca: [1.732, 1], Cb: [2.598, 0.5], N: [3.464, 1],
    },
    bonds: [
      ["p0", "p1", 2], ["p1", "p2"], ["p2", "p3", 2], ["p3", "p4"], ["p4", "p5", 2], ["p5", "p0"],
      ["p1", "O1"], ["O1", "Me1"], ["p4", "O2"], ["O2", "Me2"], ["p3", "Br"], ["p0", "Ca"], ["Ca", "Cb"], ["Cb", "N"],
    ],
  },
  ketamine: {
    atoms: {
      r0: [0.866, 0.5], r1: [0, 1], r2: [-0.866, 0.5], r3: [-0.866, -0.5], r4: [0, -1], r5: [0.866, -0.5], O: [1.732, -1],
      i: [1.866, 0.5], a1: [2.366, 1.366], a2: [3.366, 1.366], a3: [3.866, 0.5], a4: [3.366, -0.366], a5: [2.366, -0.366],
      Cl: [1.866, 2.232], N: [1.125, 1.466], Me: [0.418, 2.173],
    },
    bonds: [
      ["r0", "r1"], ["r1", "r2"], ["r2", "r3"], ["r3", "r4"], ["r4", "r5"], ["r5", "r0"], ["r5", "O", 2],
      ["r0", "i"], ["i", "a1", 2], ["a1", "a2"], ["a2", "a3", 2], ["a3", "a4"], ["a4", "a5", 2], ["a5", "i"], ["a1", "Cl"], ["r0", "N"], ["N", "Me"],
    ],
  },
  // A nonapeptide of some seventy heavy atoms, drawn by residue: a ring of six
  // closed by the disulfide bridge (the two larger stars), and a tail of three.
  oxytocin: {
    atoms: {
      cys1: [0, 1.307], tyr2: [0.924, 0.924], ile3: [1.307, 0], gln4: [0.924, -0.924], asn5: [0, -1.307], cys6: [-0.924, -0.924],
      S6: [-1.307, 0], S1: [-0.924, 0.924], pro7: [-1.631, -1.631], leu8: [-2.597, -1.89], gly9: [-3.304, -2.597], Nt: [-4.27, -2.856],
    },
    bonds: [
      ["cys1", "tyr2"], ["tyr2", "ile3"], ["ile3", "gln4"], ["gln4", "asn5"], ["asn5", "cys6"], ["cys6", "S6"], ["S6", "S1"], ["S1", "cys1"],
      ["cys6", "pro7"], ["pro7", "leu8"], ["leu8", "gly9"], ["gly9", "Nt"],
    ],
  },
};
const element = (k) => (/^N/.test(k) && k !== "NMe" ? "N" : /^O/.test(k) ? "O" : /^S\d/.test(k) ? "S" : k === "P" ? "P" : k === "Cl" ? "Cl" : k === "Br" ? "Br" : "C");

// ── the moon, in today's phase ─────────────────────────────────────────────
// A reference new moon (2000-01-06 18:14 UTC) and the synodic month.
export function lunarPhase(date = new Date()) {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  return (((days / 29.530588853) % 1) + 1) % 1; // 0 new, .25 first quarter, .5 full
}
// The painted moon, lit for today: every pixel of the disc is shaded by the
// angle between its sphere normal and the sun's direction for this phase, so
// the terminator falls where it really does tonight. The night side keeps a
// trace of earthshine; by day it simply is not there, as the eye sees it.
export function renderMoon(img, radius, dpr, phase, night) {
  const size = Math.ceil(radius * 2 * dpr) + 2;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.drawImage(img, 1, 1, size - 2, size - 2);
  const data = g.getImageData(0, 0, size, size);
  const a = phase * Math.PI * 2;
  const L = [Math.sin(a), 0.1, -Math.cos(a)];
  const n = Math.hypot(...L);
  const R = (size - 2) / 2;
  const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - size / 2) / R, y = -(py + 0.5 - size / 2) / R;
      const rr = x * x + y * y;
      const i = (py * size + px) * 4;
      if (rr > 1) { data.data[i + 3] = 0; continue; }
      const z = Math.sqrt(1 - rr);
      const ndl = (x * L[0] + y * L[1] + z * L[2]) / n;
      const lit = smooth(-0.06, 0.12, ndl);
      const k = night ? 0.07 + 0.93 * lit : lit;
      data.data[i] *= k; data.data[i + 1] *= k; data.data[i + 2] *= k * (night ? 1.04 : 1);
      if (!night) data.data[i + 3] *= 0.9 * lit;
      // soft edge
      data.data[i + 3] *= Math.min(1, (1 - Math.sqrt(rr)) * R + 0.5);
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// A soft glow, painted once per colour and then stamped: far cheaper than a
// fresh gradient per star per frame.
const sprites = new Map();
function glowSprite(rgb) {
  if (!sprites.has(rgb)) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb}, 1)`); grad.addColorStop(0.25, `rgba(${rgb}, 0.35)`); grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    sprites.set(rgb, c);
  }
  return sprites.get(rgb);
}

// ── the Little Prince, on B-612, looking up at a constellation ───────────
// Cut like the creatures (site/art-src/rigs.json → art/rig/prince.*): the
// scarf flies from his neck and the back of his coat lifts, in gusts.
const PRINCE = {
  coat: { box: [27.234, 30.199, 27.66, 30.484], origin: [89.54, 9.19], a: [-5, 4], speed: 4.6 },
  scarfa: { box: [25.957, 12.251, 35.319, 17.094], origin: [82.23, 51.18], a: [-6, 5], speed: 3.9 },
  scarfb: { box: [0, 23.647, 30.213, 13.96], origin: [92.68, 16.86], a: [-14, 11], speed: 3.9, lag: 0.9 },
};
// The scarf ripples rather than swings: its tail rides on its root and
// follows it a moment late, turning further, as cloth does in wind.
function prince(ctx, x, y, h, t = 0) {
  const body = art("rig/prince.body");
  if (!body) { const img = art("prince"); if (img) { const w = h * (img.naturalWidth / img.naturalHeight); ctx.drawImage(img, x - w / 2, y - h / 2, w, h); } return; }
  const w = h * (235 / 351), x0 = x - w / 2, y0 = y - h / 2;
  const gust = (sp, ph) => still ? 0.5 : 0.5 + 0.5 * (0.65 * Math.sin(t * 0.001 * sp + ph) + 0.35 * Math.sin(t * 0.001 * sp * 2.7 + ph * 1.9));
  const geo = (p) => {
    const [bx, by, bw, bh] = p.box;
    const px = x0 + (w * bx) / 100, py = y0 + (h * by) / 100, pw = (w * bw) / 100, ph = (h * bh) / 100;
    return { px, py, pw, ph, ox: px + (pw * p.origin[0]) / 100, oy: py + (ph * p.origin[1]) / 100 };
  };
  const angle = (p) => ((p.a[0] + (p.a[1] - p.a[0]) * gust(p.speed, -(p.lag || 0))) * Math.PI) / 180;
  const turn = (g, ang) => { ctx.translate(g.ox, g.oy); ctx.rotate(ang); ctx.translate(-g.ox, -g.oy); };
  const draw = (name, g) => { const img = art(`rig/prince.${name}`); if (img) ctx.drawImage(img, g.px, g.py, g.pw, g.ph); };
  const coat = geo(PRINCE.coat);
  ctx.save(); turn(coat, angle(PRINCE.coat)); draw("coat", coat); ctx.restore();
  ctx.drawImage(body, x0, y0, w, h);
  const a = geo(PRINCE.scarfa), b = geo(PRINCE.scarfb);
  ctx.save(); turn(a, angle(PRINCE.scarfa));
  ctx.save(); turn(b, angle(PRINCE.scarfb)); draw("scarfb", b); ctx.restore();
  draw("scarfa", a);
  ctx.restore();
}

// ── the dandelion clock ───────────────────────────────────────────────────
// It keeps the time of the visit. At the top of the page it is a flower; as
// you read on it closes and turns into a white clock; then its seeds lift off
// one by one and drift away across the sky, until by the footer the stem is
// bare. Scroll back and time runs backwards, as it does in the tree.
const SEEDS = 44;
const seedOrder = (() => { const r = rng(314); return [...Array(SEEDS).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i); })();
function pappus(ctx, x, y, dirx, diry, len, rgb, a, fine) {
  // A dandelion seed as it really is: a small ribbed brown achene, a long
  // fine beak, and at its tip an umbrella of many silky hairs that splay
  // up and out and droop a little at their ends.
  const base = Math.atan2(diry, dirx);
  const ax = Math.cos(base), ay = Math.sin(base);
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(122, 92, 58, ${a})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x - ax * len * 0.18, y - ay * len * 0.18); ctx.lineTo(x, y); ctx.stroke();
  const tx = x + ax * len, ty = y + ay * len;
  ctx.strokeStyle = `rgba(${rgb}, ${a * 0.8})`; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  const hairs = fine ? 22 : 12, r = len * 0.55;
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = `rgba(${rgb}, ${a * 0.85})`;
  ctx.beginPath();
  for (let k = 0; k < hairs; k++) {
    const spread = ((k / (hairs - 1)) - 0.5) * 2.4;
    const ang = base + spread;
    const ex = tx + Math.cos(ang) * r, ey = ty + Math.sin(ang) * r;
    const droop = Math.abs(spread) * r * 0.18;
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(ang) * r * 0.6, ty + Math.sin(ang) * r * 0.6, ex - ax * droop, ey - ay * droop);
  }
  ctx.stroke();
}
// Where each painting's head and stem foot are, in fractions of the image.
const DAND = {
  flower: { head: [0.48, 0.2], foot: 0.37 },
  clock: { head: [0.5, 0.33], r: 0.45, foot: 0.5 },
  bare: { head: [0.5, 0.1], foot: 0.5 },
};
let eaten = null, eatenCount = -1;
const seedLaunch = new Array(SEEDS).fill(0);
function dandelion(ctx, W, H, progress, t) {
  const phone = W < 700;
  const margin = Math.max(0, (W - 1280) / 2) + 48;
  // It lives in the right margin and must never reach across the content.
  const room = phone ? 56 : margin - 24;
  const tall = Math.max(70, Math.min(phone ? 110 : 180, room * 1.15)), foot = H + 6;
  const hx = W - (phone ? 30 : margin / 2);
  // It grows from a small mound of earth and grass in the corner of the
  // frame, like a plant at the edge of a stage — not out of nowhere.
  ctx.save();
  ctx.translate(hx, foot);
  const mw = Math.max(46, tall * 0.5), mh = tall * 0.13;
  ctx.fillStyle = palette.night ? "rgba(10, 12, 18, 0.96)" : "rgba(112, 96, 64, 0.92)";
  ctx.beginPath(); ctx.moveTo(-mw, 2); ctx.bezierCurveTo(-mw * 0.6, -mh * 1.1, mw * 0.5, -mh * 1.2, mw * 1.1, 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = palette.night ? "rgba(62, 150, 104, 0.5)" : "rgba(84, 120, 60, 0.85)"; ctx.lineWidth = 1.1;
  for (let k = 0; k < 16; k++) {
    const bx = -mw * 0.8 + (k / 15) * mw * 1.7, bh = mh * (0.8 + ((k * 37) % 7) / 6), lean = (((k * 53) % 9) - 4) * 1.2 + (still ? 0 : Math.sin(t * 0.0012 + k) * 1.5);
    ctx.beginPath(); ctx.moveTo(bx, -mh * 0.5); ctx.quadraticCurveTo(bx + lean * 0.4, -mh * 0.5 - bh * 0.6, bx + lean, -mh * 0.5 - bh); ctx.stroke();
  }
  ctx.restore();
  // The whole plant bends a little in the wind, from its foot.
  ctx.save();
  ctx.translate(hx, foot - mh * 0.55);
  ctx.rotate(still ? 0 : Math.sin(t * 0.0009) * 0.035 + Math.sin(t * 0.0023) * 0.012);
  const draw = (name, img, alpha, scaleHead = 1) => {
    if (!img || alpha <= 0.01) return;
    const k = DAND[name], w = tall * (img.naturalWidth / img.naturalHeight);
    const x0 = -w * k.foot, y0 = -tall;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (scaleHead !== 1) {
      // Scale about the head, so a flower closes and a clock opens in place.
      const cx = x0 + w * k.head[0], cy = y0 + tall * k.head[1];
      ctx.translate(cx, cy); ctx.scale(scaleHead, scaleHead); ctx.translate(-cx, -cy);
    }
    ctx.drawImage(img, x0, y0, w, tall);
    ctx.restore();
  };
  const smooth = (e0, e1, x) => { const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return u * u * (3 - 2 * u); };
  // Flower (0–0.1) closes; the seed clock opens in its place (0.1–0.22).
  const close = smooth(0.06, 0.16, progress), open = smooth(0.12, 0.22, progress);
  const flower = art("dandelion-flower"), clock = art("dandelion-clock"), bare = art("dandelion-bare");
  if (close < 1) draw("flower", flower, 1 - close, 1 - close * 0.45);
  if (open <= 0) { ctx.restore(); return; }
  // The bare head is always there under the clock; each seed that leaves
  // opens a small gap in the clock through which it shows.
  draw("bare", bare, open);
  const gone = seedOrder.map((i, n) => [i, Math.max(0, (progress - (0.3 + (n / SEEDS) * 0.62)) * 6)]).filter(([, f]) => f > 0);
  if (clock && gone.length < SEEDS) {
    if (gone.length !== eatenCount || !eaten) {
      eatenCount = gone.length;
      eaten = eaten || document.createElement("canvas");
      eaten.width = clock.naturalWidth; eaten.height = clock.naturalHeight;
      const g = eaten.getContext("2d");
      g.drawImage(clock, 0, 0);
      g.globalCompositeOperation = "destination-out";
      const cx = eaten.width * DAND.clock.head[0], cy = eaten.height * DAND.clock.head[1], R = eaten.width * DAND.clock.r;
      for (const [i] of gone) {
        const ang = (i / SEEDS) * Math.PI * 2;
        const px = cx + Math.cos(ang) * R * 0.66, py = cy + Math.sin(ang) * R * 0.66;
        const gr = g.createRadialGradient(px, py, 0, px, py, R * 0.6);
        gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.75, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(px, py, R * 0.6, 0, Math.PI * 2); g.fill();
      }
      g.globalCompositeOperation = "source-over";
    }
    const scale = 0.55 + open * 0.45;
    const w = tall * (clock.naturalWidth / clock.naturalHeight), x0 = -w * DAND.clock.foot, y0 = -tall;
    const cx = x0 + w * DAND.clock.head[0], cy = y0 + tall * DAND.clock.head[1];
    ctx.save(); ctx.globalAlpha *= open;
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
    ctx.drawImage(eaten, x0, y0, w, tall);
    ctx.restore();
  }
  // Scrolling only decides when a seed lets go. From then on it lives in its
  // own time: it lifts off the head, rises on the warm air, rides the gusts,
  // rocks under its parachute, and is gone in ten seconds or so. Scroll back
  // and the seeds grow back.
  const night = palette.night, seedRgb = night ? "245, 243, 236" : palette.line;
  const w = clock ? tall * (clock.naturalWidth / clock.naturalHeight) : tall * 0.7;
  const hcx = -w * DAND.clock.foot + w * DAND.clock.head[0], hcy = -tall + tall * DAND.clock.head[1], R = w * DAND.clock.r;
  const loose = new Set(gone.map(([i]) => i));
  for (let i = 0; i < SEEDS; i++) {
    if (!loose.has(i)) { seedLaunch[i] = 0; continue; }
    if (!seedLaunch[i]) seedLaunch[i] = t;
    if (still) continue;
    const age = (t - seedLaunch[i]) / 1000;
    if (age > 12) continue;
    const ang = (i / SEEDS) * Math.PI * 2;
    const sx = hcx + Math.cos(ang) * R * 0.66, sy = hcy + Math.sin(ang) * R * 0.66;
    const lift = Math.min(1, age / 0.8);
    const gust = Math.sin(t * 0.0006 + i * 0.7) * 0.5 + 0.5;
    const x = sx + Math.cos(ang) * 6 * lift - age * (16 + (i % 5) * 7) * (0.6 + gust) - Math.sin(age * 0.9 + i) * 14;
    const y = sy + Math.sin(ang) * 4 * lift - age * (11 + (i % 4) * 5) + Math.sin(age * 1.6 + i * 1.3) * 7 + Math.max(0, age - 7) * 4;
    const rock = Math.sin(age * 2.1 + i) * 0.35;
    const fade = Math.min(1, age * 3) * Math.max(0, 1 - Math.max(0, age - 9) / 3);
    pappus(ctx, x, y, Math.sin(rock) * 0.35, -1, R * 0.36, seedRgb, 0.92 * fade, !phone);
  }
  ctx.restore();
}

// ── the sky ────────────────────────────────────────────────────────────────
const canvas = document.querySelector("canvas.sky");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const phase = lunarPhase();
  let contentLeft = 0, wormhole = null;
  let W = 0, H = 0, dpr = 1, skyH = 0, stars = [], figures = [], milky = null, moon = null, moonR = 0;
  let shooting = null, nextShot = 0, lastDraw = 0, lastScroll = -1, raf = 0;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    base.width = canvas.width; base.height = canvas.height; baseKey = "";
    const docH = Math.max(document.documentElement.scrollHeight, H);
    skyH = H + (docH - H) * PARALLAX + 40;
    const phone = W < 700;
    const r = rng(2026);
    stars = [...Array(Math.round((W * skyH) / (phone ? 2600 : 2100)))].map(() => {
      const temp = r();
      return {
        x: r() * W, y: r() * skyH, s: Math.pow(r(), 5) * 1.6 + 0.35, ph: r() * 6.28, sp: 0.6 + r() * 1.4,
        rgb: temp < 0.12 ? "190, 210, 255" : temp > 0.9 ? "255, 214, 170" : "248, 246, 238",
      };
    });
    // The home page carries all nine, spaced through the open sky between
    // the scenes as you scroll; every other page has its own few, chosen by
    // its address so they are stable. Side, tilt and size are left to chance.
    const all = ["meo", "lsd", "psilocybin", "2cb", "serotonin", "mdma", "oxytocin", "ketamine"];
    const home = location.pathname === "/";
    const hash = [...location.pathname].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 11);
    const pick = rng(hash);
    const order = home ? ["dmt", ...all] : all.slice().sort(() => pick() - 0.5).slice(0, 3);
    // Large enough to read as a figure in the sky, never across the words.
    // Big enough to read as figures in the night, not specks.
    const margin0 = Math.max(0, (W - 1280) / 2) + 48;
    const bond = phone ? 15 : Math.max(18, Math.min(40, margin0 / 5.2));
    contentLeft = Math.max(0, (W - 1280) / 2) + Math.min(48, Math.max(20, W * 0.05));
    // Open stretches of the page (not drawn scenes), in page coordinates.
    const open = [...document.querySelectorAll("main > section")]
      .filter((el) => !el.classList.contains("bleed") && !el.hasAttribute("data-lodge") && el.offsetHeight > 200)
      .map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY + 60, r.bottom + scrollY - 60]; })
      .filter(([a, b]) => b > a && a > H * 0.9);
    const span = open.reduce((n, [a, b]) => n + (b - a), 0);
    const at = (f) => { let d = f * span; for (const [a, b] of open) { if (d <= b - a) return a + d; d -= b - a; } return open.at(-1)?.[1] ?? H * 2; };
    const rest = order.filter((n) => n !== "dmt");
    figures = order.map((name) => {
      if (name === "dmt" && phone) return null;
      if (name === "dmt") return { name, x: W * (phone ? 0.3 : 0.5), y: H * (phone ? 0.14 : 0.13), bond: bond * 0.75, rot: -0.3 };
      const k = rest.indexOf(name);
      const docY = span ? at((k + 0.5 + (pick() - 0.5) * 0.4) / rest.length) : H * (1.5 + k);
      // Strictly alternating sides, so they never gather on one; each sits in
      // its margin and, where the margin is narrow, reaches softly behind the
      // edge of the words.
      // Spread through the whole sky, not lined up in the margins: across the
      // width in bands that alternate sides, never twice in the same place.
      // In the margins either side of the words, strictly alternating, so they
      // are spread over the whole sky yet never cross a sentence. On a phone
      // there are no margins: they hang faint behind, at the edges.
      const side = (k + (hash & 1)) % 2 === 1;
      // Far enough in that the whole figure fits on the screen.
      const inset = Math.max(margin0 * 0.5, bond * 3.4);
      const x = phone ? W * (side ? 0.8 : 0.2) : side ? W - inset : inset;
      // A figure at sky height y sits mid-screen when its page point does.
      // …and never in the first screen, which belongs to the hero.
      const y = Math.max(H * 1.12, H / 2 + PARALLAX * (docY - H / 2));
      return { name, x, y, bond: bond * (0.9 + pick() * 0.25), rot: (pick() - 0.5) * Math.PI * 1.4 };
    });
    // One wormhole, on the home page, deep in the sky between two chapters.
    wormhole = false && home && span ? { x: W * (phone ? 0.5 : 0.8), y: Math.max(H * 1.3, H / 2 + PARALLAX * (at(0.55) - H / 2)), r: phone ? W * 0.42 : Math.min(W * 0.2, 290) } : null;
    // Without motion the sky does not move, so only the hero's figure shows.
    figures = figures.filter(Boolean);
    // No two figures may touch: on each side they are pushed apart to at
    // least their own size (the one with the Little Prince beneath it needs
    // room for him too), so every molecule reads on its own.
    const extent = (f) => { const m = MOLECULES[f.name]; const ys = Object.values(m.atoms).map((q) => q[1]); const xs = Object.values(m.atoms).map((q) => q[0]); return Math.max(Math.max(...ys) - Math.min(...ys), Math.max(...xs) - Math.min(...xs)) * f.bond; };
    for (const side of [true, false]) {
      const col = figures.filter((f) => f.name !== "dmt" && (f.x > W / 2) === side).sort((a, b) => a.y - b.y);
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1], need = (extent(prev) + extent(col[i])) / 2 + prev.bond * (prev.name === "lsd" ? 12 : 3);
        if (col[i].y - prev.y < need) col[i].y = prev.y + need;
      }
    }
    if (!PARALLAX) figures = figures.slice(0, 1);
    moonR = phone ? 30 : Math.max(40, Math.min(72, W * 0.042));
    const mimg = art("moon");
    // Painted large enough to stay sharp as it grows toward the horizon.
    moon = mimg ? renderMoon(mimg, moonR * 1.5, dpr, phase, palette.night) : null;
    milky = palette.night ? renderMilkyWay() : null;
  }

  // A faint diagonal band of dust and tiny stars, painted once.
  function renderMilkyWay() {
    const c = document.createElement("canvas");
    const mh = Math.round(H * 1.8);
    c.width = Math.round(W); c.height = mh;
    const g = c.getContext("2d");
    const r = rng(77);
    const angle = -0.42, cx = W * 0.5, cy = mh * 0.5;
    for (let i = 0; i < 26; i++) {
      const t = (r() - 0.5) * 1.6;
      const x = cx + Math.cos(angle) * t * W, y = cy + Math.sin(angle) * t * W + (r() - 0.5) * 80;
      const rad = 90 + r() * 160;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(170, 180, 210, ${0.035 + r() * 0.03})`); grad.addColorStop(1, "rgba(170, 180, 210, 0)");
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 2600; i++) {
      const t = (r() - 0.5) * 1.8, spread = (r() + r() + r() - 1.5) * 90;
      const x = cx + Math.cos(angle) * t * W - Math.sin(angle) * spread, y = cy + Math.sin(angle) * t * W + Math.cos(angle) * spread;
      g.fillStyle = `rgba(235, 235, 245, ${0.08 + r() * 0.25})`;
      g.fillRect(x, y, 0.8, 0.8);
    }
    return c;
  }

  // A figure drifting behind a drawn scene fades away, so constellations are
  // only ever seen in open sky, never tangled in a tree.
  function veiled(y) {
    let k = 1;
    for (const r of sceneRects) {
      const inside = Math.min(y - r.top, r.bottom - y); // < 0 outside, > 0 inside
      k = Math.min(k, Math.max(0, Math.min(1, 1 - (inside + 40) / 80)));
    }
    return k;
  }
  let sceneRects = [];
  function figure(f, off, t) {
    const m = MOLECULES[f.name];
    const y0 = f.y - off;
    if (y0 < -160 || y0 > H + 160) return;
    const veil = (f.name === "dmt" ? 1 : veiled(y0)) * (W < 700 ? 0.45 : 1);
    if (veil <= 0.02) return;
    ctx.globalAlpha = veil;
    const pts = Object.values(m.atoms);
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    const P = {};
    for (const [k, [ax, ay]] of Object.entries(m.atoms)) {
      const px = (ax - mx) * f.bond, py = -(ay - my) * f.bond;
      P[k] = [f.x + px * c - py * s, y0 + px * s + py * c];
    }
    const night = palette.night;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = night ? "rgba(200, 212, 240, 0.26)" : `rgba(${palette.line}, 0.22)`;
    for (const [a, b, order] of m.bonds) {
      const [x1, y1] = P[a], [x2, y2] = P[b];
      const d = Math.hypot(x2 - x1, y2 - y1) || 1, k = 4.5 / d;
      const nx = (-(y2 - y1) / d) * 2.2, ny = ((x2 - x1) / d) * 2.2;
      for (const o of order === 2 ? [1, -1] : [0]) {
        ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o);
        ctx.lineTo(x2 - (x2 - x1) * k + nx * o, y2 - (y2 - y1) * k + ny * o);
        ctx.stroke();
      }
    }
    const tw = rng(f.name.length * 131);
    for (const [k, [px, py]] of Object.entries(P)) {
      const el = element(k), hetero = el !== "C";
      const tws = still ? 0.85 : 0.7 + 0.3 * Math.sin(t * 0.0017 + tw() * 6.28);
      const rgb = el === "N" ? palette.signal : night ? "250, 248, 240" : palette.line;
      const core = hetero ? 2.6 : 1.8;
      if (night) {
        const before = ctx.globalAlpha;
        ctx.globalAlpha = before * 0.5 * tws;
        ctx.drawImage(glowSprite(rgb), px - core * 6, py - core * 6, core * 12, core * 12);
        ctx.globalAlpha = before;
        if (hetero) { // the soft cross of a bright star
          ctx.strokeStyle = `rgba(${rgb}, ${0.35 * tws})`; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.moveTo(px, py - 9); ctx.lineTo(px, py + 9); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${rgb}, ${(night ? 0.95 : 0.5) * tws})`;
      ctx.beginPath(); ctx.arc(px, py, core, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // The still layers — gradient, Milky Way, the faint stars, the moon — only
  // change when the page scrolls or the theme turns; they are painted into
  // `base` then, and every other frame just stamps it.
  const base = document.createElement("canvas");
  const bctx = base.getContext("2d");
  let baseKey = "";
  function paintBase(off) {
    const ctx = bctx, night = palette.night;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (night) { bg.addColorStop(0, "#02030a"); bg.addColorStop(0.6, "#050815"); bg.addColorStop(1, "#0a0d18"); }
    // Dalí's day: a clear, slightly cool sky that warms to a luminous horizon.
    else { bg.addColorStop(0, "#5f8fb8"); bg.addColorStop(0.45, "#a9c6d6"); bg.addColorStop(0.8, "#eadcc0"); bg.addColorStop(1, "#f3cf98"); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Dawn and dusk (theme "local time"): a warm band low in the sky.
    const light = root.dataset.theme === "auto" ? root.dataset.light : "";
    if (light === "dawn" || light === "dusk") {
      const warm = ctx.createLinearGradient(0, H * 0.35, 0, H);
      warm.addColorStop(0, "rgba(255, 150, 90, 0)"); warm.addColorStop(1, light === "dusk" ? "rgba(236, 120, 80, 0.38)" : "rgba(255, 176, 130, 0.3)");
      ctx.fillStyle = warm; ctx.fillRect(0, 0, W, H);
    }

    if (night) {
      if (milky) ctx.drawImage(milky, 0, -H * 0.4 - off * 0.6, W, milky.height);
      for (const s of stars) {
        const y = s.y - off;
        if (s.s > 1.1 || y < -2 || y > H + 2) continue;
        ctx.fillStyle = `rgba(${s.rgb}, ${0.35 + s.s * 0.3})`;
        ctx.fillRect(s.x, y, s.s, s.s);
      }
    }
    moonAt(ctx, off);
  }

  // By night the moon. By day the sun, low and soft, in Dalí's warm light —
  // and the moon too, faint, but only on the days it really stands in the
  // daytime sky: waxing it is up in the afternoon, waning in the morning;
  // round the full it rises at sunset and is not there by day.
  function moonAt(ctx, off) {
    const night = palette.night, phone = W < 700;
    // Over the length of the page the moon sets: it sinks toward the horizon,
    // grows as a low moon seems to, and warms to amber. By day the sun does
    // the same — a slow sunset for the reader who reads to the end.
    // Through the first screen the moon (or sun) grows a little and warms, as
    // a low moon does; then it rides up and away with the sky. It never
    // travels down across the words.
    const set = Math.min(1, scrollY / H), ease = set * set * (3 - 2 * set);
    const mx = W * (phone ? 0.82 : 0.86), my = H * (phone ? 0.15 : 0.2) - off * 0.9 + ease * H * 0.06;
    const grow = 1 + ease * 0.35;
    if (my < -moonR * 3) return;
    if (night) {
      if (!moon) return;
      const lit = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2), R = moonR * grow;
      const halo = ctx.createRadialGradient(mx, my, R * 0.95, mx, my, R * 3.2);
      halo.addColorStop(0, `rgba(${Math.round(220 + ease * 35)}, ${Math.round(225 - ease * 40)}, ${Math.round(240 - ease * 110)}, ${0.1 * lit + 0.02 + ease * 0.06})`); halo.addColorStop(1, "rgba(220, 200, 160, 0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, R * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      if (ease > 0.01) ctx.filter = `sepia(${(ease * 0.55).toFixed(2)}) saturate(${(1 + ease * 0.8).toFixed(2)})`;
      ctx.drawImage(moon, mx - R, my - R, R * 2, R * 2);
      ctx.restore();
      return;
    }
    {
      const sr = moonR * 0.9 * grow;
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, sr * 7);
      const g = Math.round(244 - ease * 70), b = Math.round(214 - ease * 120);
      glow.addColorStop(0, `rgba(255, ${g}, ${b}, 0.9)`); glow.addColorStop(0.12, `rgba(255, ${g - 8}, ${b - 18}, ${0.55 + ease * 0.15})`);
      glow.addColorStop(0.4, `rgba(255, ${g - 18}, ${b - 34}, ${0.16 + ease * 0.14})`); glow.addColorStop(1, "rgba(255, 200, 150, 0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mx, my, sr * 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, ${Math.round(250 - ease * 60)}, ${Math.round(236 - ease * 120)}, 0.96)`; ctx.beginPath(); ctx.arc(mx, my, sr, 0, Math.PI * 2); ctx.fill();
    }
    const dayMoon = (phase > 0.12 && phase < 0.42) || (phase > 0.58 && phase < 0.88);
    const dmx = W * (phone ? 0.58 : 0.66), dmy = H * 0.1;
    if (dayMoon && moon && dmy > -moonR * 2) {
      ctx.globalAlpha = 0.55;
      const R2 = moonR * 0.62;
      ctx.drawImage(moon, dmx - R2, dmy - R2, R2 * 2, R2 * 2);
      ctx.globalAlpha = 1;
    }
  }

  function draw(t) {
    const off = scrollY * PARALLAX;
    const night = palette.night;
    const key = `${Math.round(off * 2)}|${night}|${W}x${H}`;
    if (key !== baseKey) { paintBase(off); baseKey = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (night) {
      // Only the bright stars twinkle, so only they are drawn each frame.
      for (const s of stars) {
        if (s.s <= 1.1) continue;
        const y = s.y - off;
        if (y < -4 || y > H + 4) continue;
        ctx.globalAlpha = still ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.sp + s.ph);
        ctx.drawImage(glowSprite(s.rgb), s.x - s.s * 3, y - s.s * 3, s.s * 6, s.s * 6);
      }
      ctx.globalAlpha = 1;
      // Now and then, a shooting star.
      if (!still) {
        if (!shooting && t > nextShot) {
          const r = Math.random();
          shooting = { x: W * (0.2 + r * 0.7), y: H * (0.05 + Math.random() * 0.35), vx: -380 - r * 260, vy: 170 + r * 90, life: 0 };
          nextShot = t + 9000 + Math.random() * 16000;
        }
        if (shooting) {
          const s = shooting, dt = 1 / 60;
          s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
          const fade = Math.sin(Math.min(1, s.life / 0.9) * Math.PI);
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.18, s.y - s.vy * 0.18);
          g.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`); g.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.18, s.y - s.vy * 0.18); ctx.stroke();
          if (s.life > 0.9) shooting = null;
        }
      }
    }

    sceneRects = [...document.querySelectorAll("section.bleed:not(.glass)")].map((el) => el.getBoundingClientRect());
    // The wormhole turns inward, counter-clockwise like every spiral here;
    // by night its black is the night itself, by day it is a dark portal
    // open in the blue.
    // Fetched only once it is nearly in view.
    const wh = wormhole && wormhole.y - off < H * 2 && art("wormhole");
    if (wh) {
      const wy = wormhole.y - off, r = wormhole.r;
      const v = veiled(wy);
      if (wy > -r && wy < H + r && v > 0.02) {
        ctx.save();
        ctx.globalAlpha = v * (night ? 0.95 : 0.8);
        if (night) ctx.globalCompositeOperation = "screen";
        ctx.translate(wormhole.x, wy); ctx.rotate(still ? 0 : -t * 0.00005);
        ctx.drawImage(wh, -r, -r, r * 2, r * 2);
        ctx.restore();
      }
    }
    for (const f of figures) if (f) figure(f, off, t);
    const lsd = figures.find((f) => f && f.name === "lsd");
    if (lsd) {
      // He stands in the same margin as the figure, below it, looking up; he
      // needs room, so only where the margin can hold him.
      const room = W < 700 ? 0 : contentLeft - 16;
      const ph = Math.min(130, room * 1.3), py = lsd.y - off + lsd.bond * 7 + ph * 0.5;
      const pv = veiled(py) * veiled(lsd.y - off);
      if (ph >= 60 && pv > 0.02 && py > -ph && py < H + ph) { ctx.globalAlpha = pv; prince(ctx, lsd.x, py, ph, t); ctx.globalAlpha = 1; }
    }
    // On a phone there is no margin for it in the first screen; it rises into
    // view once the reader has moved on from the hero.
    const docH = Math.max(document.documentElement.scrollHeight - H, 1);
    // No room for it on a phone: it would stand on the words.
    const show = W < 700 ? 0 : 1;
    if (show > 0) { ctx.globalAlpha = show; dandelion(ctx, W, H, Math.min(1, scrollY / docH), t); ctx.globalAlpha = 1; }
    weather(t);
  }

  // Rain falls as fine slanting lines, snow as soft flakes that sway; both
  // are few, drawn over the sky and behind every word. Fog is CSS (a pair of
  // slow bands, styles.css) and needs nothing here.
  let drops = [], motes = [], clouds = [];
  document.addEventListener("weather", () => { drops = []; motes = []; clouds = []; if (still) draw(0); });
  // Weather and season, drawn behind every word. Particles are few and
  // capped; all of it holds still for reduced motion.
  function weather(t) {
    const dt = Math.min(0.05, (t - (weather.last || t)) / 1000); weather.last = t;
    const phone = W < 700, windy = WEATHER === "wind" ? 1 : 0;
    // Clouds: the painted ones, drifting at their own heights and speeds —
    // many under "clouds", a few wisps otherwise, none in snow or rain's dark.
    const nClouds = WEATHER === "clouds" ? (phone ? 3 : 5) : WEATHER === "wind" || WEATHER === "rain" ? (phone ? 2 : 3) : WEATHER === "clear" ? 1 : 0;
    if (clouds.length !== nClouds) clouds = [...Array(nClouds)].map((_, i) => ({ img: `cloud-${(i % 4) + 1}`, x: Math.random() * W, y: H * (0.06 + Math.random() * 0.34), s: 0.55 + Math.random() * 0.7, v: 6 + Math.random() * 10 }));
    for (const c of clouds) {
      const img = art(c.img);
      if (!img) continue;
      const w = Math.min(W * 0.55, 420) * c.s, h = w * (img.naturalHeight / img.naturalWidth);
      if (!still) c.x -= (c.v + windy * 40) * dt;
      if (c.x < -w) { c.x = W + w * 0.2; c.y = H * (0.06 + Math.random() * 0.34); }
      ctx.globalAlpha = palette.night ? 0.28 : WEATHER === "rain" ? 0.95 : 0.85;
      if (palette.night || WEATHER === "rain") ctx.filter = palette.night ? "brightness(0.5) saturate(0.4)" : "brightness(0.75) saturate(0.5)";
      ctx.drawImage(img, c.x, c.y, w, h);
      ctx.filter = "none"; ctx.globalAlpha = 1;
    }
    if (still) return;
    // The season, in a few drifting things: blossom in spring, motes (and at
    // night fireflies) in summer, leaves in autumn, glints of frost in winter.
    const sea = root.dataset.season;
    const nMotes = (phone ? 10 : 18) * (windy ? 2 : 1);
    if (motes.length !== nMotes) motes = [...Array(nMotes)].map(() => ({ x: Math.random() * W, y: Math.random() * H, v: 0.5 + Math.random(), r: Math.random() * 6.28, s: Math.random() }));
    for (const m of motes) {
      const gust = 1 + windy * 3;
      if (sea === "autumn" || sea === "spring") {
        m.x -= (18 + 30 * m.v) * gust * dt; m.y += (14 + 18 * m.v) * dt + Math.sin(t * 0.002 + m.s * 9) * 0.6; m.r += dt * (1 + m.v) * gust;
        if (m.y > H + 10 || m.x < -10) { m.x = W + Math.random() * 60; m.y = Math.random() * H * 0.7; }
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.r); ctx.scale(1, 0.45 + 0.4 * Math.abs(Math.sin(m.r * 2)));
        ctx.fillStyle = sea === "autumn" ? `rgba(${170 + Math.round(m.s * 50)}, ${80 + Math.round(m.s * 50)}, 30, ${palette.night ? 0.55 : 0.8})` : `rgba(248, 214, 222, ${palette.night ? 0.5 : 0.85})`;
        const sz = sea === "autumn" ? 5 + m.v * 3 : 3 + m.v * 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (sea === "summer") {
        m.x += Math.sin(t * 0.0007 + m.s * 20) * 12 * dt - windy * 60 * dt; m.y += Math.cos(t * 0.0009 + m.s * 13) * 9 * dt;
        if (m.x < -10) m.x = W + 10;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.003 + m.s * 30);
        if (palette.night) { ctx.globalAlpha = pulse * 0.9; ctx.drawImage(glowSprite("190, 240, 140"), m.x - 5, m.y - 5, 10, 10); ctx.globalAlpha = 1; }
        else { ctx.fillStyle = `rgba(255, 250, 220, ${0.35 * pulse})`; ctx.beginPath(); ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
      } else if (sea === "winter" && WEATHER !== "snow") {
        const glint = Math.max(0, Math.sin(t * 0.0015 + m.s * 40)) ** 8;
        if (glint > 0.05) { ctx.globalAlpha = glint * 0.8; ctx.drawImage(glowSprite("220, 235, 255"), m.x - 4, m.y - 4, 8, 8); ctx.globalAlpha = 1; }
      }
    }
    if (WEATHER !== "rain" && WEATHER !== "snow") return;
    const want = WEATHER === "rain" ? (phone ? 70 : 140) : (phone ? 60 : 110);
    if (drops.length !== want) drops = [...Array(want)].map(() => ({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.8, s: Math.random() }));
    if (WEATHER === "rain") {
      ctx.strokeStyle = palette.night ? "rgba(190, 205, 230, 0.28)" : "rgba(70, 90, 110, 0.3)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of drops) {
        d.y += 900 * d.v * dt; d.x -= 120 * d.v * dt;
        if (d.y > H) { d.y = -20; d.x = Math.random() * (W + 100); }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 5 * d.v, d.y - 16 * d.v);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = palette.night ? "rgba(240, 244, 250, 0.8)" : "rgba(255, 255, 255, 0.92)";
      for (const d of drops) {
        d.y += 40 * d.v * dt; d.x += Math.sin(t * 0.001 + d.s * 9) * 18 * dt;
        if (d.y > H) { d.y = -6; d.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(d.x, d.y, 0.8 + d.s * 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    // Twinkle at ~30fps; a scroll repaints at once, so the fall stays smooth.
    if (scrollY === lastScroll && t - lastDraw < 33) return;
    lastScroll = scrollY; lastDraw = t;
    draw(t);
  };

  onArt = () => { layout(); draw(performance.now()); };
  art("moon"); art("prince"); art("rig/prince.body"); art("rig/prince.scarfa"); art("rig/prince.scarfb"); art("rig/prince.coat"); art("dandelion-flower"); art("dandelion-clock"); art("dandelion-bare");
  layout();
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW && Math.abs(innerHeight - H) < 120) return; // phone URL bar
    lastW = innerWidth; layout(); if (still) draw(0);
  }, { passive: true });
  new ResizeObserver(() => {
    const docH = document.documentElement.scrollHeight;
    if (Math.abs(H + (docH - H) * PARALLAX + 40 - skyH) > 60) { layout(); if (still) draw(0); }
  }).observe(document.body);
  new MutationObserver(() => {
    const was = palette.night; readPalette();
    if (was !== palette.night) { layout(); draw(performance.now()); }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !still) raf = requestAnimationFrame(loop);
  });
  if (still) { draw(0); addEventListener("scroll", () => draw(0), { passive: true }); }
  else raf = requestAnimationFrame(loop);
}
