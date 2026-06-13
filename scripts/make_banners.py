#!/usr/bin/env python3
# Баннеры/постеры/аватарки в стиле коллекции: постеризованные лица всех героев,
# уорхоловские сетки знаменитостей, чернила/бумага, выворотка-заголовки, крест приводки.
import os, json, random
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'banners'); os.makedirs(OUT, exist_ok=True)
INK = (21, 18, 15); PAPER = (244, 240, 232); RED = (186, 24, 38)
BLACK = '/System/Library/Fonts/Supplemental/Arial Black.ttf'
HELV = '/System/Library/Fonts/HelveticaNeue.ttc'
MONO = '/System/Library/Fonts/Menlo.ttc'
def font(p, s, i=0):
    try: return ImageFont.truetype(p, s, index=i)
    except Exception: return ImageFont.truetype(BLACK, s)

# bold flat palettes (dark -> light), mirror the engine's poster finishes
PINK = [(20,16,22),(224,33,138),(255,106,26),(255,210,30),(255,243,214)]
ELEC = [(10,14,26),(22,60,235),(0,205,180),(228,255,40),(243,247,224)]
TEAL = [(10,20,19),(13,92,99),(242,92,5),(255,200,150),(255,247,232)]
BLOOD= [(22,8,8),(166,12,30),(255,92,31),(255,205,63),(255,240,216)]
PURP = [(18,10,26),(78,20,132),(182,40,255),(200,255,46),(244,240,232)]
GOLD = [(20,15,8),(92,56,12),(206,124,22),(247,202,44),(255,244,212)]
ASH  = [(20,22,27),(60,72,82),(150,164,172),(238,236,228)]
NAVY = [(12,18,36),(36,78,150),(238,234,222)]
PALS = [PINK,ELEC,TEAL,BLOOD,PURP,GOLD,ASH,NAVY]

# one representative photo + label per series (order = display order)
FIGURES = [
 ('trump','TRUMP'),('musk','MUSK'),('saylor','SAYLOR'),('cz','CZ'),('dorsey','DORSEY'),
 ('vitalik','BUTERIN'),('powell','POWELL'),('buffett','BUFFETT'),('gates','GATES'),('zuck','ZUCK'),
 ('dimon','DIMON'),('armstrong','ARMSTRONG'),('sbf','SBF'),('cathie','WOOD'),('sun','SUN'),
 ('dokwon','KWON'),('ternus','TERNUS'),('huang','HUANG'),
]
def first_master(slug):
    m = json.load(open(f'{ROOT}/assets/{slug}/manifest.json'))['masters']
    return f'{ROOT}/assets/{slug}/{m[0]}'

def posterize(path, box, pal, anchor=0.18):
    im = Image.open(path).convert('L')
    w, h = im.size; bw, bh = box
    r = max(bw/w, bh/h); nw, nh = int(w*r), int(h*r)
    im = im.resize((nw, nh)); x = (nw-bw)//2; y = int((nh-bh)*anchor)
    im = im.crop((x, y, x+bw, y+bh))
    px = im.load(); out = Image.new('RGB', box); op = out.load()
    n = len(pal); thr = [255*k//n for k in range(1, n)]
    for j in range(bh):
        for i in range(bw):
            v = px[i, j]; z = 0
            while z < len(thr) and v >= thr[z]: z += 1
            op[i, j] = pal[z]
    return out

def reg_mark(d, cx, cy, R, fg, lw):
    d.ellipse([cx-R,cy-R,cx+R,cy+R], outline=fg, width=lw)
    d.line([cx-R*1.5,cy,cx+R*1.5,cy], fill=fg, width=lw)
    d.line([cx,cy-R*1.5,cx,cy+R*1.5], fill=fg, width=lw)

def wear(im, box, seed, dens=900):
    d = ImageDraw.Draw(im); rnd = random.Random(seed); px = im.load()
    x0,y0,x1,y1 = box
    for _ in range(dens):
        x = rnd.randint(x0,x1-1); y = rnd.randint(y0,y1-1)
        if px[x,y] == PAPER:
            r = rnd.uniform(0.5,2.4); d.ellipse([x-r,y-r,x+r,y+r], fill=INK)

# cache posterized faces per (slug, palette idx) at a base size
def face(slug, pidx, box):
    return posterize(first_master(slug), box, PALS[pidx % len(PALS)])

# ---------- 1. WALL OF FACES (Warhol celebrity grid) ----------
def wall(W, H, cols, rows, seed, gutter=4, title=None, fname=''):
    im = Image.new('RGB', (W, H), INK); d = ImageDraw.Draw(im)
    cw = (W - gutter*(cols+1)) // cols; ch = (H - gutter*(rows+1)) // rows
    rnd = random.Random(seed)
    figs = FIGURES[:cols*rows]
    for k,(slug,_) in enumerate(figs):
        r,c = divmod(k, cols)
        x = gutter + c*(cw+gutter); y = gutter + r*(ch+gutter)
        im.paste(face(slug, k+seed, (cw, ch)), (x, y))
    if title:
        # knockout title band — auto-fit font to width
        bh = int(H*0.18); by = (H-bh)//2
        band = Image.new('RGB',(W,bh),INK); bd=ImageDraw.Draw(band)
        fs = int(bh*0.55)
        while fs > 10:
            f = font(BLACK, fs)
            if bd.textbbox((0,0),title,font=f)[2] <= W*0.92: break
            fs -= 4
        bd.text((W/2, bh*0.5), title, font=f, fill=PAPER, anchor='mm')
        im.paste(band,(0,by))
        d.rectangle([0,by,W,by],fill=RED); d.rectangle([0,by+bh,W,by+bh+3],fill=RED)
    im.save(f'{OUT}/{fname}.png'); return im

# ---------- 2. HERO STRIP HEADER (faces row + wordmark) ----------
def header(W, H, seed, title, fname):
    im = Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(im)
    n = 8; cw = W//n
    for k in range(n):
        slug = FIGURES[(k+seed) % len(FIGURES)][0]
        im.paste(face(slug, k+seed, (cw, H)), (k*cw, 0))
    # ink scrim left for the wordmark
    scrim = Image.new('RGBA',(int(W*0.62),H),(21,18,15,205))
    im.paste(Image.alpha_composite(im.convert('RGBA').crop((0,0,int(W*0.62),H)),scrim).convert('RGB'),(0,0))
    f = font(BLACK, int(H*0.30))
    d.text((int(W*0.035), int(H*0.40)), title, font=f, fill=PAPER)
    wear(im, (int(W*0.035), int(H*0.30), int(W*0.58), int(H*0.78)), seed)
    d.text((int(W*0.037), int(H*0.18)), 'THE FACES OF THE BUBBLE', font=font(MONO,int(H*0.05)), fill=(150,145,132))
    d.text((int(W*0.037), int(H*0.80)), '18 SERIES · A SILKSCREEN PRESS WIRED TO A TICKER · THOMQU.COM',
           font=font(MONO,int(H*0.045)), fill=(150,145,132))
    reg_mark(d, int(W*0.55), int(H*0.86), int(H*0.04), PAPER, 2)
    im.save(f'{OUT}/{fname}.png'); return im

# ---------- 3. AVATAR (square) ----------
def avatar_mark(S, fname):
    im = Image.new('RGB',(S,S),INK); d=ImageDraw.Draw(im)
    reg_mark(d, S//2, int(S*0.42), int(S*0.20), PAPER, max(3,S//90))
    d.text((S/2, int(S*0.74)), 'THOMQU', font=font(BLACK,int(S*0.13)), fill=PAPER, anchor='mm')
    d.text((S/2, int(S*0.86)), 'PRESS', font=font(MONO,int(S*0.05)), fill=(150,145,132), anchor='mm')
    im.save(f'{OUT}/{fname}.png')

def avatar_face(S, slug, pidx, label, fname):
    im = posterize(first_master(slug), (S,S), PALS[pidx], anchor=0.12)
    d = ImageDraw.Draw(im)
    # bottom ink band + knockout name
    bh=int(S*0.18); d.rectangle([0,S-bh,S,S],fill=INK)
    d.text((S/2,S-bh*0.5), label, font=font(BLACK,int(bh*0.5)), fill=PAPER, anchor='mm')
    im.save(f'{OUT}/{fname}.png')

def avatar_quad(S, seed, fname):
    im = Image.new('RGB',(S,S),INK); h=(S-6)//2
    for k in range(4):
        r,c=divmod(k,2); slug=FIGURES[(k+seed)%len(FIGURES)][0]
        im.paste(face(slug,k+seed,(h,h)),(2+c*(h+2),2+r*(h+2)))
    d=ImageDraw.Draw(im); reg_mark(d,S//2,S//2,int(S*0.07),PAPER,3)
    im.save(f'{OUT}/{fname}.png')

# ---------- 4. STORY (vertical 1080x1920) ----------
def story(slug, pidx, title, fname):
    W,H=1080,1920; im=Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(im)
    port=posterize(first_master(slug),(W,int(H*0.62)),PALS[pidx],anchor=0.1)
    im.paste(port,(0,0))
    d.rectangle([0,int(H*0.62),W,int(H*0.62)+5],fill=RED)
    d.text((54,int(H*0.66)), title, font=font(BLACK,150), fill=PAPER)
    wear(im,(54,int(H*0.66),W-54,int(H*0.82)),7)
    d.text((58,int(H*0.63)), 'THOMQU PRESS', font=font(MONO,34), fill=(150,145,132))
    d.text((58,int(H*0.86)), 'A SILKSCREEN PRESS WIRED TO A TICKER.', font=font(MONO,34), fill=PAPER)
    d.text((58,int(H*0.90)), 'THOMQU.COM', font=font(MONO,30), fill=(150,145,132))
    reg_mark(d,W-110,int(H*0.90),34,PAPER,3)
    im.save(f'{OUT}/{fname}.png')

# ================= GENERATE =================
# X / Twitter headers 1500x500 — 3 variants
wall(1500,500,6,2,1,title='THOMQU',fname='x_header_wall')
header(1500,500,0,'THOMQU',fname='x_header_strip_1')
header(1500,500,5,'THE BUBBLE',fname='x_header_strip_2')
# Telegram / Discord banner 1280x640
wall(1280,640,6,3,3,title=None,fname='tg_banner_wall')
header(1280,520,2,'THOMQU',fname='discord_banner')
# square posts 1080x1080 — 2 variants (instagram / og-ish)
wall(1080,1080,4,5,2,title='THE FACES OF THE BUBBLE',fname='square_wall')
wall(1080,1080,3,3,7,title=None,fname='square_grid9')
# avatars 1000x1000 — multiple
avatar_mark(1000,'avatar_mark')
avatar_quad(1000,1,'avatar_quad')
for i,(slug,label) in enumerate([('trump','TRUMP'),('musk','MUSK'),('saylor','SAYLOR'),('cz','CZ'),('powell','POWELL'),('buffett','BUFFETT')]):
    avatar_face(1000,slug,i,label,f'avatar_{slug}')
# stories 1080x1920
story('trump',3,'TRUMP',fname='story_trump')
story('musk',1,'MUSK',fname='story_musk')
story('saylor',0,'SAYLOR',fname='story_saylor')
# full poster wall (big) 1600x2000
wall(1600,2000,4,5,4,title=None,fname='poster_wall_18')

print('banners written to', OUT)
print(sorted(os.listdir(OUT)))
