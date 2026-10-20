from PIL import Image, ImageDraw, ImageFont
from fractions import Fraction
import numpy as np, json, sys
from scipy import ndimage

SRC = "public/images/work-wall-source.png"
OUT = "public/images/work-wall.png"
MAP = "scripts/work-map.png"
MIN_AREA = 0.002

im = Image.open(SRC).convert("RGBA")
a = np.array(im)
H, W = a.shape[:2]

edge = a[int(H * 0.02):int(H * 0.2), : max(4, int(W * 0.03)), :3].reshape(-1, 3)
bg = "#%02x%02x%02x" % tuple(int(v) for v in np.median(edge, axis=0))

r, g, b = (a[:, :, i].astype(int) for i in range(3))
mask = (r - g > 60) & (b - g > 60) & (r > 120) & (b > 120)
lab, _ = ndimage.label(mask)

frames, ids = [], []
for k, sl in enumerate(ndimage.find_objects(lab), start=1):
    if sl is None:
        continue
    ys, xs = sl
    area = int((lab[sl] == k).sum())
    if area < MIN_AREA * W * H:
        continue
    bw, bh = xs.stop - xs.start, ys.stop - ys.start
    ids.append(k)
    frames.append({"x0": xs.start, "y0": ys.start, "x1": xs.stop, "y1": ys.stop, "a": area, "fill": area / (bw * bh)})

if not frames:
    sys.exit("No magenta frames found. The picture areas must be solid #FF00FF.")

big = max(range(len(frames)), key=lambda i: frames[i]["a"])
rest = [f for i, f in enumerate(frames) if i != big]
band = H * 0.12
rest.sort(key=lambda f: (int(f["y0"] // band), f["x0"]))
frames = [frames[big]] + rest

hole = ndimage.binary_dilation(np.isin(lab, ids), iterations=2)
a[hole, :3] = (40, 25, 18)
a[hole, 3] = 0
Image.fromarray(a).save(OUT)

ratios = [(f["x1"] - f["x0"]) / (f["y1"] - f["y0"]) for f in frames]
med = float(np.median(ratios))

data = {
    "aspect": round(W / H, 5),
    "bg": bg,
    "ratio": round(med, 4),
    "frames": [
        {
            "x": round(f["x0"] / W * 100, 3),
            "y": round(f["y0"] / H * 100, 3),
            "w": round((f["x1"] - f["x0"]) / W * 100, 3),
            "h": round((f["y1"] - f["y0"]) / H * 100, 3),
        }
        for f in frames
    ],
}
json.dump(data, open("src/data/workwall.json", "w"), indent=2)

vis = im.convert("RGB")
d = ImageDraw.Draw(vis)
try:
    font = ImageFont.load_default(size=max(28, W // 40))
except TypeError:
    font = ImageFont.load_default()

print(f"Wall {W}x{H}px, {len(frames)} frames, typical ratio {med:.3f}\n")
print(" #   ratio   frame size")
for i, f in enumerate(frames, 1):
    bw, bh = f["x1"] - f["x0"], f["y1"] - f["y0"]
    print(f"{i:>2}   {bw / bh:.3f}   {bw}x{bh}px")
    d.rectangle([f["x0"], f["y0"], f["x1"] - 1, f["y1"] - 1], outline=(0, 255, 0), width=max(3, W // 600))
    try:
        d.text(((f["x0"] + f["x1"]) / 2, (f["y0"] + f["y1"]) / 2), str(i), fill=(255, 255, 255),
               font=font, anchor="mm", stroke_width=3, stroke_fill=(0, 0, 0))
    except ValueError:
        d.text((f["x0"] + 8, f["y0"] + 8), str(i), fill=(255, 255, 255), font=font)
    if f["fill"] < 0.93:
        print(f"   ! frame {i} is not a clean rectangle ({f['fill'] * 100:.0f}% filled)")
    if abs(bw / bh - med) / med > 0.06:
        print(f"   ! frame {i} has a different shape from the others")
vis.save(MAP)
print("\nFrame 1 is the biggest one: your featured project.")
print("Numbered map: scripts/work-map.png")
