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

function mount(host) {
  const img = host.querySelector("img");
  const rig = JSON.parse(host.dataset.rig);
  const canvas = document.createElement("canvas");
  canvas.className = "warp-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return;
  const W = img.naturalWidth, H = img.naturalHeight;
  // Weights: for each vertex, how much each part moves it. Computed once.
  const verts = [];
  for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) verts.push([(c / COLS) * 100, (r / ROWS) * 100]);
  const parts = rig.map((p) => {
    const [px, py] = p.pivot;
    const reach = Math.max(...p.poly.map(([x, y]) => Math.hypot(x - px, y - py))) || 1;
    const feather = p.feather ?? 6;
    const w = verts.map(([x, y]) => {
      const inPart = inside(p.poly, x, y) ? 1 : 1 - smooth(0, feather, distToPoly(p.poly, x, y));
      // Grows along the part from its joint: a tail bends, it does not hinge.
      const along = smooth(0, 1, Math.hypot(x - px, y - py) / reach);
      return inPart * (p.rigid ? 1 : 0.25 + 0.75 * along);
    });
    return { ...p, w };
  });
  const pos = new Float32Array(verts.length * 2), uvs = new Float32Array(verts.length * 2);
  verts.forEach(([x, y], i) => { uvs[i * 2] = x / 100; uvs[i * 2 + 1] = y / 100; });
  const idx = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1;
    idx.push(a, b, d, b, e, d);
  }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = (data, attr) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW); const l = gl.getAttribLocation(prog, attr); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); return b; };
  const posBuf = buf(pos, "p"); buf(uvs, "uv");
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // The canvas is a little larger than the painting, so a bend can reach
  // past the painting's edge without being clipped.
  const PAD = 0.12;
  const size = () => {
    const r = img.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(2, Math.round(r.width * (1 + PAD * 2) * dpr));
    canvas.height = Math.max(2, Math.round(r.height * (1 + PAD * 2) * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const draw = (t) => {
    const ang = parts.map((p) => (angleAt(p, t) * Math.PI) / 180);
    for (let i = 0; i < verts.length; i++) {
      let [x, y] = verts[i];
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
      pos[i * 2] = ((X / W + PAD) / (1 + PAD * 2)) * 2 - 1;
      pos[i * 2 + 1] = 1 - ((Y / H + PAD) / (1 + PAD * 2)) * 2;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  };
  size();
  host.append(canvas);
  host.classList.add("warping");
  let raf = 0, visible = false, last = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 32) return; // 30 frames a second is plenty for a sway
    last = now;
    draw(now / 1000);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { size(); raf = requestAnimationFrame(loop); }
  }, { rootMargin: "80px" }).observe(host);
  new ResizeObserver(() => { if (visible) size(); }).observe(img);
}

if (!still) {
  for (const host of document.querySelectorAll("[data-rig]")) {
    const img = host.querySelector("img");
    const go = () => { try { mount(host); } catch { /* the still painting stays */ } };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
  }
}
