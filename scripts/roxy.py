from PIL import Image
import numpy as np, json, os, sys

SRC = "scripts/roxy-source"
OUT = "public/roxy"
BOX = {"x": 24, "y": 66, "w": 25, "h": 28}
WANT = BOX["w"] / BOX["h"] * (16 / 9)
POSES = ["sleep", "wake", "sit", "bark"]

if not os.path.exists("public/images/interior-with-dog.png"):
    sys.exit("Back up the original room first: cp public/images/interior.png public/images/interior-with-dog.png")

os.makedirs(OUT, exist_ok=True)
found, size = [], None
for p in POSES:
    path = next((f"{SRC}/{p}{e}" for e in (".png", ".jpg", ".jpeg", ".webp") if os.path.exists(f"{SRC}/{p}{e}")), None)
    if not path:
        continue
    im = Image.open(path).convert("RGB")
    if size and im.size != size:
        sys.exit(f"{p} is {im.size[0]}x{im.size[1]} but the others are {size[0]}x{size[1]}. All poses must match.")
    size = im.size
    ar = im.size[0] / im.size[1]
    if abs(ar - WANT) / WANT > 0.05:
        print(f"! {p}: ratio {ar:.3f}, wanted about {WANT:.3f}. Roxy may sit a little off.")
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = np.clip(1 - (m - 40) / 120, 0, 1)
    spill = m > 0
    b = np.where(spill, np.minimum(b, g), b)
    r = np.where(spill, np.minimum(r, g + 70), r)
    out = np.dstack([r, g, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(f"{OUT}/{p}.png")
    found.append(p)
    print(f"{p}: done ({im.size[0]}x{im.size[1]})")

ready = all(p in found for p in ("sleep", "wake", "sit"))
json.dump({"ready": ready, "born": "2025-09", "box": BOX, "poses": found}, open("src/data/roxy.json", "w"), indent=2)
print("Roxy is ready." if ready else "Still missing: " + ", ".join(p for p in ("sleep", "wake", "sit") if p not in found))
