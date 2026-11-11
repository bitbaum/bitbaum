// Mesh deformation for the painted figures — the technique studios use for
// painted 2D characters (Spine, DragonBones, PixiJS meshes), in a few
// kilobytes of plain WebGL and no dependency.
//
// A painting is never cut into pieces. It is laid on a fine grid and the
// grid bends: every vertex turns about each moving part's joint by that
// part's angle times a weight — full inside the part and growing along it
// from the joint, fading smoothly outside. A tail therefore curves along its
// length and the body stays whole: no seams, nothing chopped.
//
// The rig comes from site/art-src/rigs.json (the same file the earlier
// cut-out used), inlined by art.mjs as data-rig. Without WebGL, or with
// reduced motion, the painting simply stays still as an <img>.
//
// ONE WebGL context serves the whole page. Each figure is drawn into it and
// copied onto that figure's own 2D canvas. Browsers cap live WebGL contexts
// and drop them under memory pressure (a phone with many tabs, an app sent to
// the background); a dropped WebGL canvas paints Chromium's "sad WebGL" face,
// which on a running figure crossed the screen. A 2D canvas never shows that,
// and if the shared context is lost every figure falls back to its still
// painting until (and unless) the browser restores it.

const still = matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData === true;
const COLS = 28, ROWS = 28;

const VS = `attribute vec2 p; attribute vec2 uv; varying vec2 v; void main(){ v = uv; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float; varying vec2 v; uniform sampler2D t; void main(){ gl_FragColor = texture2D(t, v); }`;

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distToPoly(poly, x, y) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l));
    d = Math.min(d, Math.hypot(ax + dx * u - x, ay + dy * u - y));
  }
  return d;
}
const smooth = (e0, e1, x) => { const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return u * u * (3 - 2 * u); };

// The angle a part holds at time t (seconds): a sway, or a gesture that
// holds, turns, holds — the two ways the cut-out rigs already moved.
function angleAt(p, t) {
  const [a0, a1] = p.a, period = p.dur * 2, ph = (((t + (p.delay || 0)) % period) + period) % period / period;
  if (p.mode === "gesture") {
    const k = ph < 0.52 ? 0 : ph < 0.64 ? smooth(0.52, 0.64, ph) : ph < 0.84 ? 1 : ph < 0.96 ? 1 - smooth(0.84, 0.96, ph) : 0;
    return a0 + (a1 - a0) * k;
  }
  return a0 + (a1 - a0) * (0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
}

const figs = [];
let gl = null, glCanvas = null, prog = null, posBuf = null, uvBuf = null, ib = null, posLoc = -1, uvLoc = -1, dead = false;
const VERTS = [];
for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) VERTS.push([(c / COLS) * 100, (r / ROWS) * 100]);
const IDX = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1;
  IDX.push(a, b, d, b, e, d);
}
const POS = new Float32Array(VERTS.length * 2);
const UVS = new Float32Array(VERTS.length * 2);
VERTS.forEach(([x, y], i) => { UVS[i * 2] = x / 100; UVS[i * 2 + 1] = y / 100; });
// The canvas is a little larger than the painting, so a bend can reach past
// the painting's edge without being clipped.
const PAD = 0.12;

// Every figure goes back to its still painting.
function rest() {
  for (const f of figs) { f.host.classList.remove("warping"); f.tex = null; }
}

function setup() {
  if (!glCanvas) {
    glCanvas = document.createElement("canvas");
    glCanvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); dead = true; gl = null; rest(); });
    glCanvas.addEventListener("webglcontextrestored", () => { dead = false; if (setup()) for (const f of figs) upload(f); });
  }
  const g = glCanvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!g || g.isContextLost()) return false;
  const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); return s; };
  const p = g.createProgram();
  g.attachShader(p, sh(g.VERTEX_SHADER, VS)); g.attachShader(p, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(p);
  if (!g.getProgramParameter(p, g.LINK_STATUS)) return false;
  g.useProgram(p);
  posLoc = g.getAttribLocation(p, "p"); uvLoc = g.getAttribLocation(p, "uv");
  posBuf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, posBuf); g.bufferData(g.ARRAY_BUFFER, POS, g.DYNAMIC_DRAW);
  uvBuf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, uvBuf); g.bufferData(g.ARRAY_BUFFER, UVS, g.STATIC_DRAW);
  ib = g.createBuffer(); g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, ib); g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint16Array(IDX), g.STATIC_DRAW);
  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  gl = g; prog = p;
  return true;
}

function upload(f) {
  if (!gl) return;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f.img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  f.tex = tex;
}

function size(f) {
  const r = f.img.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
  f.canvas.width = Math.max(2, Math.round(r.width * (1 + PAD * 2) * dpr));
  f.canvas.height = Math.max(2, Math.round(r.height * (1 + PAD * 2) * dpr));
}

function draw(f, t) {
  if (!gl || dead || !f.tex || gl.isContextLost()) return false;
  const { W, H, parts } = f, cw = f.canvas.width, ch = f.canvas.height;
  if (glCanvas.width < cw || glCanvas.height < ch) {
    glCanvas.width = Math.max(glCanvas.width, cw);
    glCanvas.height = Math.max(glCanvas.height, ch);
  }
  const ang = parts.map((p) => (angleAt(p, t) * Math.PI) / 180);
  for (let i = 0; i < VERTS.length; i++) {
    const [x, y] = VERTS[i];
    // Apply each part as a weighted turn about its joint, in pixel space so
    // the painting's aspect is kept.
    let X = (x * W) / 100, Y = (y * H) / 100;
    for (let k = 0; k < parts.length; k++) {
      const w = parts[k].w[i];
      if (!w) continue;
      const a = ang[k] * w, px = (parts[k].pivot[0] * W) / 100, py = (parts[k].pivot[1] * H) / 100;
      const c = Math.cos(a), s = Math.sin(a), dx = X - px, dy = Y - py;
      X = px + dx * c - dy * s; Y = py + dx * s + dy * c;
    }
    POS[i * 2] = ((X / W + PAD) / (1 + PAD * 2)) * 2 - 1;
    POS[i * 2 + 1] = 1 - ((Y / H + PAD) / (1 + PAD * 2)) * 2;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, POS);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(posLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(uvLoc);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bindTexture(gl.TEXTURE_2D, f.tex);
  // WebGL's origin is bottom-left: draw into the bottom-left corner of the
  // shared canvas, then copy that corner onto the figure's own canvas.
  gl.viewport(0, 0, cw, ch);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, IDX.length, gl.UNSIGNED_SHORT, 0);
  f.ctx.clearRect(0, 0, cw, ch);
  f.ctx.drawImage(glCanvas, 0, glCanvas.height - ch, cw, ch, 0, 0, cw, ch);
  return true;
}

function mount(host, img) {
  const rig = JSON.parse(host.dataset.rig);
  const W = img.naturalWidth, H = img.naturalHeight;
  if (!W || !H) return;
  // Weights: for each vertex, how much each part moves it. Computed once.
  const parts = rig.map((p) => {
    const [px, py] = p.pivot;
    const reach = Math.max(...p.poly.map(([x, y]) => Math.hypot(x - px, y - py))) || 1;
    const feather = p.feather ?? 6;
    const w = VERTS.map(([x, y]) => {
      const inPart = inside(p.poly, x, y) ? 1 : 1 - smooth(0, feather, distToPoly(p.poly, x, y));
      // Grows along the part from its joint: a tail bends, it does not hinge.
      const along = smooth(0, 1, Math.hypot(x - px, y - py) / reach);
      return inPart * (p.rigid ? 1 : 0.25 + 0.75 * along);
    });
    return { ...p, w };
  });
  const canvas = document.createElement("canvas");
  canvas.className = "warp-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const f = { host, img, canvas, ctx, W, H, parts, tex: null, visible: false };
  figs.push(f);
  upload(f);
  size(f);
  host.append(canvas);
  // The still painting stays until the first frame has really been drawn.
  if (draw(f, performance.now() / 1000)) host.classList.add("warping");
  new IntersectionObserver(([e]) => {
    f.visible = e.isIntersecting;
    if (f.visible) { size(f); start(); }
  }, { rootMargin: "80px" }).observe(host);
  new ResizeObserver(() => { if (f.visible) size(f); }).observe(img);
}

let raf = 0, last = 0;
function loop(now) {
  raf = 0;
  const live = figs.filter((f) => f.visible);
  if (!live.length || dead) return;
  raf = requestAnimationFrame(loop);
  if (now - last < 32) return; // 30 frames a second is plenty for a sway
  last = now;
  for (const f of live) {
    if (draw(f, now / 1000)) f.host.classList.add("warping");
    else f.host.classList.remove("warping");
  }
}
function start() { if (!raf && !dead) raf = requestAnimationFrame(loop); }

if (!still) {
  const hosts = [...document.querySelectorAll("[data-rig]")];
  if (hosts.length && setup()) {
    for (const host of hosts) {
      const img = host.querySelector("img");
      if (!img) continue;
      const go = () => { try { mount(host, img); } catch { host.classList.remove("warping"); /* the still painting stays */ } };
      if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
    }
  }
}
