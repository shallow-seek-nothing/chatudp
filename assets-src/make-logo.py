"""把 assets-src/logo.png 的白底线稿翻车鱼处理成透明 PNG，并统一染成赛博绿。"""

from PIL import Image
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "logo.png")
OUT_DIR = os.path.join(ROOT, "public", "assets")
os.makedirs(OUT_DIR, exist_ok=True)

im = Image.open(SRC).convert("RGBA")
arr = np.array(im).astype(np.float32)
rgb = arr[..., :3]
alpha_src = arr[..., 3]

# 白色背景 -> 透明；深蓝线稿 -> 不透明。用亮度反推 alpha。
lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
alpha = np.clip((255.0 - lum - 12.0) * 1.55, 0.0, 255.0) * (alpha_src / 255.0)
alpha = alpha.astype(np.uint8)

# 统一染色
def tint(color, alpha, path, max_side=None, pad_ratio=0.06):
    h, w = alpha.shape
    rgb_arr = np.zeros((h, w, 3), dtype=np.uint8)
    rgb_arr[..., 0] = color[0]
    rgb_arr[..., 1] = color[1]
    rgb_arr[..., 2] = color[2]
    out = np.dstack([rgb_arr, alpha])
    img = Image.fromarray(out, "RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    # 加方形留白，避免贴边
    w2, h2 = img.size
    side = max(w2, h2)
    pad = int(side * pad_ratio)
    side_padded = side + pad * 2
    canvas = Image.new("RGBA", (side_padded, side_padded), (0, 0, 0, 0))
    canvas.paste(img, ((side_padded - w2) // 2, (side_padded - h2) // 2), img)
    if max_side:
        canvas = canvas.resize((max_side, max_side), Image.LANCZOS)
    canvas.save(path)
    print(path, canvas.size)

GREEN = (0, 255, 156)   # 赛博绿 #00FF9C

tint(GREEN, alpha, os.path.join(OUT_DIR, "logo.png"), max_side=512)
tint(GREEN, alpha, os.path.join(OUT_DIR, "favicon.png"), max_side=64)
print("done")
