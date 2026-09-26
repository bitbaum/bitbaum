#!/usr/bin/env python3
"""Cut each rigged painting into a body and its moving parts.

    python3 site/art-src/slice.py   (reads site/art/<name>.webp, rigs.json)

Writes site/art/rig/<name>.<part>.webp (cropped to the part) and
site/art/rig/<name>.body.webp, plus site/art/rig/index.json with each part's
box and pivot in % of the whole, which art.mjs uses to stack them."""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
here = os.path.dirname(os.path.abspath(__file__))
art = os.path.join(here, "..", "art")
out = os.path.join(art, "rig")
os.makedirs(out, exist_ok=True)
rigs = {k: v for k, v in json.load(open(os.path.join(here, "rigs.json"))).items() if not k.startswith("_")}
index = {}
for name, rig in rigs.items():
    im = Image.open(os.path.join(art, f"{name}.webp")).convert("RGBA")
    W, H = im.size
    body_alpha = np.asarray(im.getchannel("A")).astype(np.float32)
    entry = {"size": [W, H], "parts": {}}
    for pname, p in rig["parts"].items():
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon([(x * W / 100, y * H / 100) for x, y in p["poly"]], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(1.2))
        mask = np.asarray(m).astype(np.float32) / 255
        # The body gives the part up, except at the joint, which it keeps.
        yy, xx = np.mgrid[0:H, 0:W]
        px, py = p["pivot"][0] * W / 100, p["pivot"][1] * H / 100
        keep = np.clip(1 - (np.hypot(xx - px, yy - py) - p["keep"] * W / 100) / 3, 0, 1) if p["keep"] else 0
        body_alpha *= 1 - mask * (1 - keep)
        a = np.asarray(im).copy()
        a[..., 3] = (a[..., 3] * mask).astype(np.uint8)
        part = Image.fromarray(a, "RGBA")
        bb = part.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
        if not bb: continue
        part.crop(bb).save(os.path.join(out, f"{name}.{pname}.webp"), quality=86, method=6)
        x0, y0, x1, y1 = bb
        entry["parts"][pname] = {
            "box": [round(x0 / W * 100, 3), round(y0 / H * 100, 3), round((x1 - x0) / W * 100, 3), round((y1 - y0) / H * 100, 3)],
            # pivot relative to the part's own box, for transform-origin
            "origin": [round((px - x0) / (x1 - x0) * 100, 2), round((py - y0) / (y1 - y0) * 100, 2)],
            "a": p["a"], "dur": p["dur"], "delay": p.get("delay", 0), "under": bool(p.get("under")),
        }
    b = np.asarray(im).copy(); b[..., 3] = body_alpha.astype(np.uint8)
    Image.fromarray(b, "RGBA").save(os.path.join(out, f"{name}.body.webp"), quality=86, method=6)
    index[name] = entry
json.dump(index, open(os.path.join(out, "index.json"), "w"))
total = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.endswith(".webp"))
print(len(index), "rigs,", total // 1024, "KB")
