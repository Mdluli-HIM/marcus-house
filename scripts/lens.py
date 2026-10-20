from PIL import Image
import numpy as np, json, sys
from scipy import ndimage

SRC = "public/images/portrait-cutout.png"
OUT = "public/images/portrait.png"
THRESH = 215   # only used if the lens is white instead of transparent
GROW = 0.5     # % the video box grows past the hole on each side

a = np.array(Image.open(SRC).convert("RGBA"))
H, W = a.shape[:2]

def find_lens(mask):
    lab, n = ndimage.label(mask)
    best, best_area = None, 0
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k)
        if xs.min() == 0 or ys.min() == 0 or xs.max() == W - 1 or ys.max() == H - 1:
            continue  # touches the edge, so it is outside background
        cy = ys.mean() / H
        area = len(xs)
        if 0.10 < cy < 0.50 and area > 0.004 * W * H and area > best_area:
            best, best_area = k, area
    return lab, best

# 1) an already-transparent hole
lab, best = find_lens(a[:, :, 3] < 10)
mode = "transparent hole"

# 2) fall back to a white lens
if best is None:
    white = (a[:, :, 3] > 0) & (a[:, :, :3].min(axis=2) > THRESH)
    lab, best = find_lens(white)
    mode = "white lens"
    if best is not None:
        a[ndimage.binary_dilation(lab == best, iterations=1), 3] = 0

if best is None:
    sys.exit("No lens found. Check public/images/portrait-cutout.png")

Image.fromarray(a).save(OUT)

ys, xs = np.where(lab == best)
left, top = xs.min() / W * 100, ys.min() / H * 100
w = (xs.max() - xs.min() + 1) / W * 100
h = (ys.max() - ys.min() + 1) / H * 100

data = {
    "aspect": round(W / H, 5),
    "left": round(left - GROW, 2),
    "top": round(top - GROW, 2),
    "width": round(w + GROW * 2, 2),
    "height": round(h + GROW * 2, 2),
}
json.dump(data, open("src/data/lens.json", "w"), indent=2)
print(f"Found: {mode}  |  image {W}x{H}")
print(data)
