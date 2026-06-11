#!/usr/bin/env python3
# Генерирует бренд-детали: favicon (печатный крест приводки), тач-иконки, OG-карточку для шейринга.
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK = (21, 18, 15); PAPER = (244, 240, 232); RED = (186, 24, 38)
HELV = '/System/Library/Fonts/HelveticaNeue.ttc'
BLACK = '/System/Library/Fonts/Supplemental/Arial Black.ttf'
MONO = '/System/Library/Fonts/Menlo.ttc'

def font(path, size, idx=0):
    try: return ImageFont.truetype(path, size, index=idx)
    except Exception: return ImageFont.truetype(BLACK, size)

# ---- registration mark: printer's alignment crosshair (the silkscreen brand) ----
def reg_mark(size, bg, fg, pad_ratio=0.0):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg is not None:
        r = int(size * 0.16)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg)
    cx = cy = size / 2
    R = size * 0.30                  # circle radius
    lw = max(1, int(size * 0.055))
    arm = size * 0.46                # crosshair half-length (extends past circle)
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=fg, width=lw)
    d.line([cx - arm, cy, cx + arm, cy], fill=fg, width=lw)
    d.line([cx, cy - arm, cx, cy + arm], fill=fg, width=lw)
    d.ellipse([cx - lw, cy - lw, cx + lw, cy + lw], fill=fg)   # center dot
    return im

# favicons / app icons
reg_mark(512, INK, PAPER).save(f'{ROOT}/icon-512.png')
reg_mark(180, INK, PAPER).save(f'{ROOT}/apple-touch-icon.png')
reg_mark(32, INK, PAPER).save(f'{ROOT}/favicon-32.png')
reg_mark(16, INK, PAPER).save(f'{ROOT}/favicon-16.png')

# multi-size .ico
ico = reg_mark(64, INK, PAPER)
ico.save(f'{ROOT}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

# scalable SVG favicon (crisp at any size, adapts nowhere — fixed ink/paper)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="5" fill="#15120f"/>
<g fill="none" stroke="#f4f0e8" stroke-width="1.8">
<circle cx="16" cy="16" r="9.5"/>
<line x1="1.3" y1="16" x2="30.7" y2="16"/>
<line x1="16" y1="1.3" x2="16" y2="30.7"/>
</g>
<circle cx="16" cy="16" r="1.9" fill="#f4f0e8"/>
</svg>'''
open(f'{ROOT}/favicon.svg', 'w').write(svg)

# ---- posterize a portrait into the Warhol palette (no dots) for the OG card ----
WARHOL = [(20, 16, 22), (224, 33, 138), (255, 106, 26), (255, 210, 30), (255, 243, 214)]
THRESH = [38, 97, 158, 209]
def posterize(path, box):
    im = Image.open(path).convert('L').resize(box)
    px = im.load(); out = Image.new('RGB', box); op = out.load()
    for y in range(box[1]):
        for x in range(box[0]):
            v = px[x, y]; z = 0
            while z < len(THRESH) and v >= THRESH[z]: z += 1
            op[x, y] = WARHOL[z]
    return out

# ---- OG share card 1200x630: catalogue-cover typography + posterized portrait ----
def og_card():
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), INK); d = ImageDraw.Draw(im)
    # right portrait panel
    pw = 430
    port = posterize(f'{ROOT}/assets/saylor/005.jpg', (pw, H))
    im.paste(port, (W - pw, 0))
    d.line([(W - pw, 0), (W - pw, H)], fill=PAPER, width=3)
    # top kicker
    fk = font(HELV, 24, 2)
    d.text((64, 54), 'THOMQU PRESS', font=fk, fill=PAPER)
    d.text((64, 90), 'SERIES ONE — SAYLOR / MSTR', font=font(MONO, 18), fill=(150, 145, 132))
    # huge wordmark with ink-wear specks
    fb = font(BLACK, 188)
    d.text((58, 196), 'SAYLOR', font=fb, fill=PAPER)
    import random; random.seed(7)
    px = im.load()
    for _ in range(900):
        x = random.randint(58, 58 + 700); y = random.randint(210, 420)
        if px[x, y] == PAPER:
            r = random.uniform(0.5, 2.2)
            d.ellipse([x - r, y - r, x + r, y + r], fill=INK)
    # red rule + caption
    d.line([(64, 470), (W - pw - 60, 470)], fill=RED, width=4)
    cap = font(MONO, 19)
    d.text((64, 492), 'THE TEMPERATURE OF THE PRESS', font=cap, fill=PAPER)
    d.text((64, 520), 'IS THE PRICE OF $MSTR.', font=cap, fill=PAPER)
    d.text((64, 566), '128 WORKS · LIMITED EDITION · THOMQU.COM', font=font(MONO, 16), fill=(150, 145, 132))
    # registration mark, bottom-right of type panel
    m = reg_mark(54, None, PAPER); im.paste(m, (W - pw - 92, 540), m)
    im.save(f'{ROOT}/og.png')

og_card()
print('brand assets written:', 'favicon.svg/.ico, favicon-16/32, apple-touch-icon, icon-512, og.png')
