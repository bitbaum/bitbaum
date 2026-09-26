# The painted-world pipeline

How bitbaum.orangecat.ch's living scenes are made, written so the same
process can be run for a client site. The goal is quality *and* speed: every
step below exists because skipping it once cost a round of rework.

## 1. Direction before pixels
- Agree the influences and the one sentence the world says (here: "a dream
  of a past that never happened"; Lynch, Dalí, Giger, Carroll, Norstein).
- Decide what each page/section is FOR before placing anything on it. One
  story per screen; spread the cast over pages rather than crowding one.
- Phones first: the phone layout is decided before the desktop one.

## 2. Painting (ChatGPT image generation, one conversation)
- One long conversation, so every sheet shares the same hand. Prompt:
  "same painted style as before, flat pure magenta #FF00FF background, no
  shadows, no ground, separate figures with space between, none touching".
- Paint moving things as they will move: a windmill's tower and sails apart;
  a figure whose limb must bend in ONE piece (it will be mesh-warped).
- Capture at full resolution: show the image alone in the page and zoom-
  capture tiles, then stitch (`tmp/stitch.py`). Never ship a screenshot of a
  thumbnail.

## 3. Cutting
- Key the magenta (`cut.py`): alpha from colour distance, one-pixel edge
  trim, despill, largest N islands in reading order, crop.
- Sweep remaining fringe (`unpink.py`). Check every cut on a dark AND a
  light ground before using it.
- Ship as WebP, sized to twice the largest on-screen size (`site/art/`,
  sizes in `index.json`). Budget: a page loads only its own few pieces.

## 4. Motion
- **Never cut a painting into rotating pieces** — the seams always show.
  Bend it: `site/warp.mjs` lays the painting on a 28×28 mesh and turns each
  vertex about a part's joint by a weight that grows along the part
  (`site/art-src/rigs.json`: outline, joint, swing, sway/gesture). No
  dependency, WebGL, 30 fps, pauses off-screen, still `<img>` fallback.
- Gestures (heads, necks, ears) hold–turn–hold; tails and legs sway.
- Whole-figure motion (walks, flights) moves the figure through DEPTH:
  smaller and hazier far, larger near, with a contact shadow on the ground.
- For true walk cycles, the next tool is Spine (Professional licence) on a
  lazily loaded PixiJS/OGL scene — only where a figure truly walks on screen.

## 5. The world's systems
- Theme "local time": day/night from the sun's real height where the reader
  is (`theme.mjs`, mirrored in the `<head>` guard so nothing flashes).
- Weather: the real weather for the reader's city (Open-Meteo, no key, no
  permission), overridable with one button; season from date + hemisphere.
- Reduced motion and Save-Data: one still frame, no loops, no WebGL.

## 6. Checks before shipping (every time)
- Walk every screen of the home page and two inner pages at 390px and
  1440px, in day and night, and LOOK (screenshots, not assumptions).
- No sideways scroll at 375px, clickable doors hit-tested at 81 points,
  contrast ≥ 7:1, no page errors: `node --test site/*.test.mjs`,
  `check-claims`, `check-hire`, `check-theme`, `check-widget` (live).
- Performance: largest contentful paint ≤ 1.5 s locally; engines lazy.

## Tooling research (2026-09-26)
Measured gzip sizes: OGL 15 KB, GSAP 28 KB (+ScrollTrigger 46), Theatre core
35 KB, Three 134–191 KB, PixiJS 8 ~179 KB, Spine-on-Pixi ~183 KB, Lottie
49–79 KB (vector only), Rive 50 KB + 360–806 KB wasm. Spine mesh deformation
needs the Professional editor licence ($379); its runtime is free to ship.
For painted art the right primitives are mesh deformation, shader noise for
fog/clouds, instanced particles for weather, and layered planes for depth.
