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
def windmill_sails(im, rig):
    """The sails turn in front of the tower. Cut them by colour — brown wood
    against the cream tower and green cap, anything at all against the sky —
    inside a circle round the hub; then fill the tower where they hid it by
    diffusing the surrounding wall into the gap."""
    a = np.asarray(im).astype(np.float32) / 255
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    hx, hy = rig["hub"][0] * W / 100, rig["hub"][1] * H / 100
    near = np.hypot(xx - hx, yy - hy) < rig["reach"] * W / 100
    tower = Image.new("L", (W, H), 0)
    ImageDraw.Draw(tower).polygon([(x * W / 100, y * H / 100) for x, y in rig["tower"]], fill=255)
    tower = np.asarray(tower.filter(ImageFilter.MaxFilter(7))) > 0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    wood = (lum < 0.47) & ((r - b) > 0.1) & (r > g * 1.03)
    keep_out = np.zeros_like(tower)
    for x0, y0, x1, y1 in rig["protect"]:
        keep_out[int(y0 * H / 100):int(y1 * H / 100), int(x0 * W / 100):int(x1 * W / 100)] = True
    sails = near & (a[..., 3] > 0.05) & ((~tower) | wood) & ~keep_out
    sails = np.asarray(Image.fromarray((sails * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    sails &= near & ~keep_out
    # Only the piece joined to the hub turns; loose specks stay on the tower.
    from scipy import ndimage
    lab, _ = ndimage.label(sails)
    hub_lab = lab[max(0, int(hy) - 3):int(hy) + 4, max(0, int(hx) - 3):int(hx) + 4]
    ids = [i for i in np.unique(hub_lab) if i]
    sails = np.isin(lab, ids) if ids else sails
    part = np.asarray(im).copy(); part[..., 3] = (part[..., 3] * sails).astype(np.uint8)
    body = np.asarray(im).astype(np.float32).copy()
    hole = sails & tower
    body[..., 3][sails & ~tower] = 0
    known = ~hole & tower & (body[..., 3] > 200)
    fill = body[..., :3].copy()
    for _ in range(160):
        acc = np.zeros_like(fill); cnt = np.zeros((H, W, 1), np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sh = np.roll(np.roll(fill, dy, 0), dx, 1); kn = np.roll(np.roll(known, dy, 0), dx, 1)
            acc += sh * kn[..., None]; cnt += kn[..., None]
        upd = hole & (cnt[..., 0] > 0)
        fill[upd] = acc[upd] / cnt[upd]
        known = known | upd
    body[..., :3][hole] = fill[hole]
    body[..., 3][hole] = 255
    return Image.fromarray(part, "RGBA"), Image.fromarray(body.astype(np.uint8), "RGBA"), (hx, hy)

for name, rig in rigs.items():
    im = Image.open(os.path.join(art, f"{name}.webp")).convert("RGBA")
    if rig.get("special") == "sails":
        part, body, (hx, hy) = windmill_sails(im, rig)
        W, H = im.size
        bb = part.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
        part.crop(bb).save(os.path.join(out, f"{name}.sails.webp"), quality=86, method=6)
        body.save(os.path.join(out, f"{name}.body.webp"), quality=86, method=6)
        x0, y0, x1, y1 = bb
        index[name] = {"size": [W, H], "parts": {"sails": {
            "box": [round(x0 / W * 100, 3), round(y0 / H * 100, 3), round((x1 - x0) / W * 100, 3), round((y1 - y0) / H * 100, 3)],
            "origin": [round((hx - x0) / (x1 - x0) * 100, 2), round((hy - y0) / (y1 - y0) * 100, 2)],
            "a": [0, -360], "dur": rig["dur"], "delay": 0, "under": False, "mode": "spin"}}}
        continue
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
            "a": p["a"], "dur": p["dur"], "mode": p.get("mode", "swing"), "delay": p.get("delay", 0), "under": bool(p.get("under")),
        }
    b = np.asarray(im).copy(); b[..., 3] = body_alpha.astype(np.uint8)
    Image.fromarray(b, "RGBA").save(os.path.join(out, f"{name}.body.webp"), quality=86, method=6)
    index[name] = entry
json.dump(index, open(os.path.join(out, "index.json"), "w"))
total = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.endswith(".webp"))
print(len(index), "rigs,", total // 1024, "KB")
