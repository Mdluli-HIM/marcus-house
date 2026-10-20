from PIL import Image, ImageDraw, ImageFont
from fractions import Fraction
import numpy as np, json, sys
from scipy import ndimage

SRC = "public/images/gallery-wall-source.png"
OUT = "public/images/gallery-wall.png"
MAP = "scripts/gallery-map.png"
MIN_AREA = 0.0005  # smallest frame, as a share of the whole image

im = Image.open(SRC).convert("RGBA")
a = np.array(im)
H, W = a.shape[:2]

top = a[: max(4, H // 50), :, :3].reshape(-1, 3)
bg = "#%02x%02x%02x" % tuple(int(v) for v in np.median(top, axis=0))

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
    frames.append({"x0": xs.start, "y0": ys.start, "x1": xs.stop, "y1": ys.stop, "fill": area / (bw * bh)})

if not frames:
    sys.exit("No magenta frames found. The picture areas must be solid #FF00FF.")

band = H * 0.10
frames.sort(key=lambda f: (int(f["y0"] // band), f["x0"]))

hole = ndimage.binary_dilation(np.isin(lab, ids), iterations=2)
a[hole, :3] = (40, 25, 18)
a[hole, 3] = 0
Image.fromarray(a).save(OUT)

data = {
    "aspect": round(W / H, 5),
    "bg": bg,
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
json.dump(data, open("src/data/gallery.json", "w"), indent=2)

vis = im.convert("RGB")
d = ImageDraw.Draw(vis)
try:
    font = ImageFont.load_default(size=max(28, W // 55))
except TypeError:
    font = ImageFont.load_default()

print(f"Wall {W}x{H}px, {len(frames)} frames\n")
print(" #   ratio    frame size    make the art about")
for i, f in enumerate(frames, 1):
    bw, bh = f["x1"] - f["x0"], f["y1"] - f["y0"]
    ratio = Fraction(bw, bh).limit_denominator(12)
    k = 2000 / max(bw, bh)
    print(f"{i:>2}   {str(ratio.numerator) + ':' + str(ratio.denominator):<7}  {bw}x{bh}px    {round(bw * k)}x{round(bh * k)}")
    d.rectangle([f["x0"], f["y0"], f["x1"] - 1, f["y1"] - 1], outline=(0, 255, 0), width=max(3, W // 700))
    try:
        d.text(((f["x0"] + f["x1"]) / 2, (f["y0"] + f["y1"]) / 2), str(i), fill=(255, 255, 255),
               font=font, anchor="mm", stroke_width=3, stroke_fill=(0, 0, 0))
    except ValueError:
        d.text((f["x0"] + 8, f["y0"] + 8), str(i), fill=(255, 255, 255), font=font)
    if f["fill"] < 0.93:
        print(f"   ! frame {i} is not a clean rectangle ({f['fill'] * 100:.0f}% filled): straighten it")
    if f["x0"] < 0.05 * W or f["x1"] > 0.95 * W or f["y0"] < 0.04 * H or f["y1"] > 0.96 * H:
        print(f"   ! frame {i} is close to the edge and may be cropped on some screens")
vis.save(MAP)
print("\nNumbered map: scripts/gallery-map.png")
