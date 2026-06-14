#!/usr/bin/env python3
# Price-mechanic demo loops (square MP4): black bg, one token centered, a live price counter that
# rises -> falls -> returns (seamless loop), and the token morphs with the price via the REAL engine
# temperature (setTemp): high price -> press overheats, low price -> ink burns out. 4 different
# palettes = 4 different tokens. Each renders a temperature SWEEP through engine.js, then frames
# blend across the sweep as the counter moves.
import os, io, base64, json, math, subprocess, threading, functools, http.server, socketserver
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SER  = 'saylor'
LOW, HIGH = 104.17, 457.20            # MSTR frozen 52-week band (low..ATH)
MID  = 280.0                          # loop start/end price (clean press)
W = H = 1080                          # square
TOK_H = 720; TOK_W = int(TOK_H*0.75)  # centered portrait
FPS = 30; DUR = 12; NF = FPS*DUR      # 12s loop
SWEEP = [round(i/40, 3) for i in range(41)]   # temperatures 0..1 (Δ0.025)
BG = (7, 7, 8)
OUTDIR = os.path.expanduser('~/Desktop/SAYLOR_PRICE')    # save to Desktop, not the site
HELV = '/System/Library/Fonts/HelveticaNeue.ttc'; HELV_BOLD = 1
MONO = '/System/Library/Fonts/Menlo.ttc'
def font(p, s, i=0):
    try: return ImageFont.truetype(p, s, index=i)
    except Exception: return ImageFont.truetype(p, s)

def serve(root, port):
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', port),
            functools.partial(http.server.SimpleHTTPRequestHandler, directory=root))
    threading.Thread(target=httpd.serve_forever, daemon=True).start(); return httpd

def curated():
    m = json.load(open(f'{ROOT}/assets/{SER}/manifest.json'))
    return [n-1 for n in (m.get('curated') or list(range(1,129)))]   # 0-based engine indices

def bake(pg, idx, t):
    r = pg.evaluate('([s,i,t,h])=>window.bake(s,i,t,h)', [SER, idx, t, 900])
    img = Image.open(io.BytesIO(base64.b64decode(r['png'].split(',',1)[1]))).convert('RGB')
    return img.resize((TOK_W, TOK_H), Image.LANCZOS), r['recipe']['baseName']

# loop price: MID -> ATH -> LOW -> MID, smootherstep, seamless (start==end)
KEYS = [(0.0, MID), (0.36, HIGH), (0.70, LOW), (1.0, MID)]
def price_at(u):
    for k in range(len(KEYS)-1):
        u0,p0 = KEYS[k]; u1,p1 = KEYS[k+1]
        if u <= u1:
            f = (u-u0)/(u1-u0); f = f*f*f*(f*(f*6-15)+10)   # smootherstep
            return p0 + (p1-p0)*f
    return MID

def regime(t):
    if t > 0.62: return 'OVERHEATED', (255, 96, 56)
    if t < 0.38: return 'BURNOUT',    (86, 150, 255)
    return 'CLEAN', (150, 150, 150)

def frame(tok, price, rising, t):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    im.paste(tok, ((W-TOK_W)//2, (H-TOK_H)//2))
    col = (40, 210, 110) if rising else (235, 46, 58)
    chg = (price/MID - 1)*100
    arrow = '▲' if rising else '▼'
    pf = font(HELV, 96, HELV_BOLD); lf = font(MONO, 34)
    line = f'{arrow} {chg:+.1f}%   MSTR'
    price_s = f'${price:,.2f}'
    # live price counter — mirrored top and bottom
    d.text((W/2, 96),    price_s, font=pf, fill=col, anchor='mm')
    d.text((W/2, 176),   line,    font=lf, fill=col, anchor='mm')
    d.text((W/2, H-176), line,    font=lf, fill=col, anchor='mm')
    d.text((W/2, H-96),  price_s, font=pf, fill=col, anchor='mm')
    return im

def render_token(pg, idx, out, label):
    sweep = [bake(pg, idx, t)[0] for t in SWEEP]
    ff = subprocess.Popen(
        ['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24',
         '-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-',
         '-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart', out],
        stdin=subprocess.PIPE)
    prev = price_at(0)
    for i in range(NF):
        u = i/NF; p = price_at(u)
        t = max(0.0, min(1.0, (p-LOW)/(HIGH-LOW)))
        fp = t*40; lo = min(int(fp), 40); hi = min(lo+1, 40); frac = fp-lo
        tok = sweep[lo] if frac < 1e-3 else Image.blend(sweep[lo], sweep[hi], frac)
        rising = p >= prev; prev = p
        ff.stdin.write(np.asarray(frame(tok, p, rising, t)).tobytes())
    ff.stdin.close(); ff.wait()
    print(f'  wrote {out}  [{label}]  ({os.path.getsize(out)//1024} KB)')

def main():
    serve(ROOT, 8790)
    with sync_playwright() as pw:
        br = pw.chromium.launch(); pg = br.new_page(viewport={'width':400,'height':400})
        pg.set_default_timeout(120000)
        pg.goto('http://127.0.0.1:8790/drop/render.html'); pg.wait_for_function('window.__ready===true')
        # pick 4 tokens with distinct, colourful palettes
        want_order = ['Warhol Screenprint','Poster Electric','Poster Navy','Poster Blood',
                      'Poster Purple','Poster Teal','Poster Misprint','Poster Red/Black']
        skip = {'1-bit Stamp','Poster Ash'}
        found = {}                       # baseName -> idx
        for idx in curated():
            _, name = bake(pg, idx, 0.5)
            if name in skip or name in found: continue
            found[name] = idx
            if len(found) >= len(want_order): break
        chosen = []
        for nm in want_order:
            if nm in found: chosen.append((found[nm], nm))
            if len(chosen) == 4: break
        for nm, idx in found.items():     # backfill if fewer than 4 from priority list
            if len(chosen) >= 4: break
            if (idx, nm) not in chosen and nm not in [c[1] for c in chosen]: chosen.append((idx, nm))
        chosen = chosen[:4]
        ce = curated()                              # engine indices, 0-based, by edition order
        jobs = [(idx, f'saylor_price_{k}', nm) for k, (idx, nm) in enumerate(chosen, 1)]
        for ed in (46, 59, 103):                    # specific editions the user asked for
            jobs.append((ce[ed-1], f'saylor_price_{ed}', f'edition {ed}'))
        print('rendering:', [j[2] for j in jobs])
        os.makedirs(OUTDIR, exist_ok=True)
        for idx, out, label in jobs:
            render_token(pg, idx, f'{OUTDIR}/{out}.mp4', label)
        br.close()
    print('done.')

if __name__ == '__main__':
    main()
