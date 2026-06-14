#!/usr/bin/env python3
# THOMQU press kit — ONE BANNER PER COLLECTION, built from REAL ENGINE TOKENS.
# The photo cuts are actual collection works rendered through engine.js (Playwright headless) — same
# finishes, same baked headlines/tickers, same databend, same fonts as the drop. No numpy re-port,
# no white frames. Over the montage: the surname set GIANT and stretched FULL-BLEED in the site's
# knockout wordmark (Helvetica Neue Bold, paper letters, light press-wear). Wide + square per series.
import os, io, json, math, base64, random, threading, functools, http.server, socketserver
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, 'banners'); os.makedirs(OUT, exist_ok=True)
INK=(21,18,15); PAPER=(244,240,232); RED=(196,20,26); GREY=(150,145,132)
HELV='/System/Library/Fonts/HelveticaNeue.ttc'; HELV_BOLD=1
MONO='/System/Library/Fonts/Menlo.ttc'
def font(p,s,i=0):
    try: return ImageFont.truetype(p,s,index=i)
    except Exception: return ImageFont.truetype(p,s)

# slug -> (surname for the giant wordmark, ticker)
SERIES = {
 'saylor':('SAYLOR','MSTR'),'huang':('HUANG','NVDA'),'vitalik':('BUTERIN','ETH'),'powell':('POWELL','FED'),
 'gates':('GATES','MSFT'),'zuck':('ZUCK','META'),'cz':('CZ','BNB'),'trump':('TRUMP','TRUMP'),
 'musk':('MUSK','DOGE'),'sbf':('SBF','FTT'),'cathie':('WOOD','ARKK'),'buffett':('BUFFETT','BRK'),
 'armstrong':('ARMSTRONG','COIN'),'dorsey':('DORSEY','BTC'),'dimon':('DIMON','JPM'),'dokwon':('KWON','LUNA'),
 'sun':('SUN','TRX'),'ternus':('TERNUS','AAPL'),
}
ORDER = list(SERIES.keys())

# which engine tokens to pull per series (prefer curated/vetted, else a good spread)
def token_indices(slug, n=6):
    man = json.load(open(f'{ROOT}/assets/{slug}/manifest.json'))
    cur = man.get('curated')
    if cur:
        idx = [cur[round(k*(len(cur)-1)/(n-1))]-1 for k in range(n)]    # spaced across curated (0-based)
    else:
        idx = [11,30,35,1,7,20][:n]                                      # default spread
    seen=[]; [seen.append(i) for i in idx if i not in seen]
    return seen

# ---------- composition furniture ----------
def reg_mark(d,cx,cy,R,fg,lw):
    d.ellipse([cx-R,cy-R,cx+R,cy+R],outline=fg,width=lw)
    d.line([cx-R*1.6,cy,cx+R*1.6,cy],fill=fg,width=lw); d.line([cx,cy-R*1.6,cx,cy+R*1.6],fill=fg,width=lw)
def diag_bar(im,p0,p1,w,color):
    (x0,y0),(x1,y1)=p0,p1; ln=math.hypot(x1-x0,y1-y0); ang=math.degrees(math.atan2(y1-y0,x1-x0))
    bar=Image.new('RGBA',(max(1,int(ln)),max(1,int(w))),color+(255,)).rotate(-ang,expand=True,resample=Image.BICUBIC)
    cx,cy=(x0+x1)/2,(y0+y1)/2; im.paste(bar,(int(cx-bar.width/2),int(cy-bar.height/2)),bar)
def paste_tilted(im,cut,cx,cy,angle):
    r=cut.convert('RGBA').rotate(angle,expand=True,resample=Image.BICUBIC)   # NO frame — clean tilted photo cut
    im.paste(r,(int(cx-r.width/2),int(cy-r.height/2)),r)
def chip(d,xy,text,f,fg=PAPER,bg=INK,pad=6):
    bb=d.textbbox(xy,text,font=f); d.rectangle([bb[0]-pad,bb[1]-pad,bb[2]+pad,bb[3]+pad],fill=bg); d.text(xy,text,font=f,fill=fg)

def giant_wordmark(text,W,H,fill=PAPER,seed=0):
    BASE=460; f=font(HELV,BASE,HELV_BOLD)
    td=ImageDraw.Draw(Image.new('L',(10,10))); bb=td.textbbox((0,0),text,font=f)
    tw,th=bb[2]-bb[0],bb[3]-bb[1]; pad=max(4,int(BASE*0.02))
    tight=Image.new('RGBA',(tw+pad*2,th+pad*2),(0,0,0,0))
    ImageDraw.Draw(tight).text((pad-bb[0],pad-bb[1]),text,font=f,fill=fill+(255,))
    a=np.asarray(tight).copy(); rnd=np.random.default_rng(seed+1)          # fine destination-out speckle = light non-print
    Hh,Ww,_=a.shape; m=a[...,3]>0; n=int(Hh*Ww/6500)
    ys=rnd.integers(0,Hh,n); xs=rnd.integers(0,Ww,n)
    a[ys,xs,3]=np.where(m[ys,xs],0,a[ys,xs,3])                              # single-pixel holes, much finer than before
    return Image.fromarray(a,'RGBA').resize((W,H),Image.BICUBIC)            # STRETCH full-bleed (wide->wide, square->condensed)

def grain(im,seed,dens=0.004):
    rnd=np.random.default_rng(seed); a=np.asarray(im).copy(); H,W,_=a.shape; n=int(H*W*dens)
    ys=rnd.integers(0,H,n); xs=rnd.integers(0,W,n); dk=rnd.random(n)<0.5
    a[ys[dk],xs[dk]]=INK; a[ys[~dk],xs[~dk]]=PAPER; return Image.fromarray(a)
def save(im,name): im.save(f'{OUT}/{name}.png'); print('  '+name)

# ---------- montage of real tokens ----------
def montage(toks,W,H,seed,square=False):
    im=Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(im); rnd=random.Random(seed)
    diag_bar(im,(-40,int(H*0.80)),(W+40,int(H*0.16)),int(H*0.045)+6,RED)
    if square: diag_bar(im,(int(W*0.12),-20),(int(W*0.60),H+20),int(H*0.03)+4,RED)
    n=len(toks)
    for k,t in enumerate(toks):
        th=int(H*(rnd.uniform(0.92,1.18) if square else rnd.uniform(0.96,1.16)))
        tw=int(th*0.75); cut=t.resize((tw,th),Image.LANCZOS)
        if square:
            cx=int(W*(0.18+0.64*((k+0.5)/n))); cy=int(H*rnd.uniform(0.3,0.7))
        else:
            cx=int(W*(0.10+0.80*((k+0.5)/n))); cy=int(H*(0.5+(0.10 if k%2 else -0.10)))
        paste_tilted(im,cut,cx,cy,rnd.uniform(-12,12))
    reg_mark(d,int(W*0.93),int(H*0.90),int(H*0.04),PAPER,3)
    return im

def collection_banner(slug,toks,seed):
    W,H=1500,500; sn,tk=SERIES[slug]
    im=montage(toks[:5],W,H,seed,square=False)
    wm=giant_wordmark(sn,W,H,seed=seed); im.paste(wm,(0,0),wm)
    chip(ImageDraw.Draw(im),(int(W*0.012),int(H*0.93)),f'{sn} / {tk} · THOMQU.COM',font(MONO,16),fg=GREY)
    save(grain(im,seed),f'banner_{slug}')

def collection_square(slug,toks,seed):
    S=1080; sn,tk=SERIES[slug]
    im=montage(toks[:6],S,S,seed+5,square=True)
    wm=giant_wordmark(sn,S,S,seed=seed+5); im.paste(wm,(0,0),wm)
    chip(ImageDraw.Draw(im),(int(S*0.02),int(S*0.955)),f'{sn} / {tk} · THOMQU.COM',font(MONO,18),fg=GREY)
    save(grain(im,seed+5),f'square_{slug}')

def avatar_mark():
    S=1000; im=Image.new('RGB',(S,S),INK); d=ImageDraw.Draw(im)
    diag_bar(im,(-30,int(S*0.72)),(S+30,int(S*0.30)),40,RED)
    reg_mark(d,S//2,int(S*0.40),int(S*0.20),PAPER,9)
    wm=giant_wordmark('THOMQU',int(S*0.86),int(S*0.18)); im.paste(wm,(int(S*0.07),int(S*0.30)),wm)
    d.text((S/2,int(S*0.84)),'A SILKSCREEN PRESS WIRED TO A TICKER',font=font(MONO,int(S*0.034)),fill=GREY,anchor='mm')
    save(im,'avatar_mark')

# ---------- real-engine render harness ----------
def serve(root,port):
    h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=root)
    socketserver.TCPServer.allow_reuse_address=True
    httpd=socketserver.TCPServer(('127.0.0.1',port),h)
    threading.Thread(target=httpd.serve_forever,daemon=True).start(); return httpd

def render_tokens(pg,slug,idxs,H=1200,temp=0.5):
    out=[]
    for i in idxs:
        r=pg.evaluate('([s,i,t,h])=>window.bake(s,i,t,h)',[slug,i,temp,H])
        out.append(Image.open(io.BytesIO(base64.b64decode(r['png'].split(',',1)[1]))).convert('RGB'))
    return out

def main(only=None,port=8788):
    serve(ROOT,port)
    series=only or ORDER
    print('rendering per-collection banners (real engine tokens) ->',OUT)
    with sync_playwright() as p:
        br=p.chromium.launch(); pg=br.new_page(viewport={'width':400,'height':400})
        pg.set_default_timeout(120000)
        pg.goto(f'http://127.0.0.1:{port}/drop/render.html'); pg.wait_for_function('window.__ready===true')
        for i,slug in enumerate(series):
            toks=render_tokens(pg,slug,token_indices(slug,6))
            seed=i*3+1
            collection_banner(slug,toks,seed); collection_square(slug,toks,seed)
        br.close()
    if not only: avatar_mark()
    print('done:',len(os.listdir(OUT)),'files in',OUT)

if __name__=='__main__':
    import sys
    main(only=sys.argv[1:] or None)
