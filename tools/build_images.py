"""Regenerate the site's images from the original photos.

Usage:  python3 tools/build_images.py <folder with the original photos>

The originals are large camera files and are not kept in the repo. Expected names:
  DSC01240.jpeg    sanctuary (wide interior)
  DSC01243.jpeg    crucifix and tabernacle
  DSC01252-2.jpeg  baptismal font

Writes AVIF, WebP and JPEG sizes to docs/images/, plus docs/apple-touch-icon.png
and docs/og-image.jpg (the link-preview card). Requires Pillow with AVIF support.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageOps

src_dir = sys.argv[1]
repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
docs = os.path.join(repo, "docs")
out = os.path.join(docs, "images")
os.makedirs(out, exist_ok=True)

PAPER, RED = (243, 235, 221), (177, 40, 30)


def load(name):
    return ImageOps.exif_transpose(Image.open(os.path.join(src_dir, name))).convert("RGB")


def emit(im, base, widths):
    for w in widths:
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(f"{out}/{base}-{w}.jpg", quality=80, optimize=True, progressive=True)
        r.save(f"{out}/{base}-{w}.webp", quality=78, method=6)
        r.save(f"{out}/{base}-{w}.avif", quality=58, speed=4)


# Sanctuary: the top 2600 rows keep the nativity figures out of frame.
# script.js locates the crucifix in this crop at 23.7% across, 21.5% down.
interior = load("DSC01240.jpeg")
emit(interior.crop((0, 0, interior.width, 2600)), "sanctuary", [1200, 2000, 2800])

# Crucifix: a 4:5 crop around the cross and tabernacle
cru = load("DSC01243.jpeg")
w = cru.width
emit(cru.crop((int(w * .22), 0, int(w * .78), int(w * .56 * 1.25))), "crucifix", [560, 900])

# Font: a 4:5 crop
font = load("DSC01252-2.jpeg")
fw, fh = font.width, int(font.width * 1.25)
top = int((font.height - fh) * .6)
emit(font.crop((0, top, fw, top + fh)), "font", [560, 900])

# Home-screen icon: a red cross pattée on paper (same shape as favicon.svg)
PATTEE = [(11, 2), (21, 2), (17.5, 14.5), (30, 11), (30, 21), (17.5, 17.5),
          (21, 30), (11, 30), (14.5, 17.5), (2, 21), (2, 11), (14.5, 14.5)]
icon = Image.new("RGB", (180, 180), PAPER)
ImageDraw.Draw(icon).polygon([(30 + x * 120 / 32, 30 + y * 120 / 32) for x, y in PATTEE], fill=RED)
icon.save(f"{docs}/apple-touch-icon.png", optimize=True)


# Link-preview card: the crucifix seen through a red-ruled cross on paper, like the page's opening
def cross(x0, y0, width, grow=0):
    u, g = width / 100, grow
    pts = [(43 - g, -g), (57 + g, -g), (57 + g, 38 - g), (100 + g, 38 - g), (100 + g, 52 + g), (57 + g, 52 + g),
           (57 + g, 140 + g), (43 - g, 140 + g), (43 - g, 52 + g), (-g, 52 + g), (-g, 38 - g), (43 - g, 38 - g)]
    return [(x0 + x * u, y0 + y * u) for x, y in pts]


W, H, cw = 1200, 630, 300
ch = int(cw * 1.4)
card = Image.new("RGB", (W, H), PAPER)
glow = Image.new("L", (W, H), 0)
ImageDraw.Draw(glow).ellipse((150, -150, 1050, 700), fill=255)
card.paste(Image.new("RGB", (W, H), (250, 245, 236)), (0, 0), glow.filter(ImageFilter.GaussianBlur(120)))
x0, y0 = (W - cw) / 2, (H - ch) / 2
ImageDraw.Draw(card).polygon(cross(x0, y0, cw, 1.6), fill=RED)
cx, half = int(cru.width * .495), 372          # centred on the crucifix, scaled so its crossbeam meets the arms
photo = cru.crop((cx - half, 0, cx + half, int(half * 2 * 1.4))).resize((cw, ch), Image.LANCZOS)
mask = Image.new("L", (cw, ch), 0)
ImageDraw.Draw(mask).polygon(cross(0, 0, cw), fill=255)
card.paste(photo, (int(x0), int(y0)), mask)
card.save(f"{docs}/og-image.jpg", quality=85, optimize=True, progressive=True)

print("Images written to", out)
