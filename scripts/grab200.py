#!/usr/bin/env python3
# Pull N random works across ALL series, weighted (well-developed figures appear more often, thin ones
# less), render each through the REAL engine.js (headless), save PNG + per-work metadata + a manifest.
# Output: ~/Desktop/THOMQU_200/  (img/NNN.png, meta/NNN.json, manifest.json) — portable to any site.
import os, io, json, base64, random, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT    = os.path.expanduser('~/Desktop/THOMQU_200')
TOTAL  = 200
FLOOR  = 4                 # every figure appears at least this many times
H      = 2200              # render height (3:4 -> width = H*0.75)
TEMP   = 0.5               # clean canonical print
SEED   = 20260614
PORT   = 8793

# slug -> (SURNAME, TICKER, Full name)
SERIES = {
 'saylor':('SAYLOR','MSTR','Michael Saylor'),'huang':('HUANG','NVDA','Jensen Huang'),
 'vitalik':('BUTERIN','ETH','Vitalik Buterin'),'powell':('POWELL','FED','Jerome Powell'),
 'gates':('GATES','MSFT','Bill Gates'),'zuck':('ZUCK','META','Mark Zuckerberg'),
 'cz':('CZ','BNB','Changpeng Zhao'),'trump':('TRUMP','TRUMP','Donald Trump'),
 'musk':('MUSK','DOGE','Elon Musk'),'sbf':('SBF','FTT','Sam Bankman-Fried'),
 'cathie':('WOOD','ARKK','Cathie Wood'),'buffett':('BUFFETT','BRK','Warren Buffett'),
 'armstrong':('ARMSTRONG','COIN','Brian Armstrong'),'dorsey':('DORSEY','BTC','Jack Dorsey'),
 'dimon':('DIMON','JPM','Jamie Dimon'),'dokwon':('KWON','LUNA','Do Kwon'),
 'sun':('SUN','TRX','Justin Sun'),'ternus':('TERNUS','AAPL','John Ternus'),
}
SLUGS = list(SERIES.keys())

def photo_count(slug):
    try: return len(json.load(open(f'{ROOT}/assets/{slug}/manifest.json'))['masters'])
    except Exception: return 1

def serve(root, port):
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', port),
            functools.partial(http.server.SimpleHTTPRequestHandler, directory=root))
    threading.Thread(target=httpd.serve_forever, daemon=True).start(); return httpd

def allocate(rng):
    pc = {s: photo_count(s) for s in SLUGS}
    w  = {s: (pc[s]**0.6) * rng.uniform(0.8, 1.25) for s in SLUGS}   # weight ~ depth + jitter
    sw = sum(w.values())
    remaining = TOTAL - FLOOR*len(SLUGS)
    raw = {s: remaining*w[s]/sw for s in SLUGS}
    alloc = {s: FLOOR + int(raw[s]) for s in SLUGS}
    left = TOTAL - sum(alloc.values())
    for s in sorted(SLUGS, key=lambda s: raw[s]-int(raw[s]), reverse=True)[:left]:
        alloc[s] += 1
    return alloc, pc

def main():
    rng = random.Random(SEED)
    alloc, pc = allocate(rng)
    print('allocation (figure: works  |  photos):')
    for s in sorted(alloc, key=lambda s:-alloc[s]):
        print(f'  {SERIES[s][0]:10s} {alloc[s]:3d}   ({pc[s]} photos)')
    print('total =', sum(alloc.values()))

    picks = []
    for s in SLUGS:
        for i in rng.sample(range(500), alloc[s]):     # distinct token indices per figure
            picks.append((s, i))
    rng.shuffle(picks)

    os.makedirs(f'{OUT}/img', exist_ok=True); os.makedirs(f'{OUT}/meta', exist_ok=True)
    serve(ROOT, PORT)
    manifest = []
    with sync_playwright() as pw:
        br = pw.chromium.launch(); pg = br.new_page(viewport={'width':400,'height':400})
        pg.set_default_timeout(120000)
        pg.goto(f'http://127.0.0.1:{PORT}/drop/render.html'); pg.wait_for_function('window.__ready===true')
        for n,(slug,idx) in enumerate(picks, 1):
            r = pg.evaluate('([s,i,t,h])=>window.bake(s,i,t,h)', [slug, idx, TEMP, H])
            png = base64.b64decode(r['png'].split(',',1)[1])
            fn = f'{n:03d}'
            open(f'{OUT}/img/{fn}.png','wb').write(png)
            sn, tk, full = SERIES[slug]
            rec = r['recipe']
            meta = {
                "name": f"{sn} / {tk} — {fn}",
                "description": f"THOMQU — a silkscreen press wired to a ticker. {full} ({tk}) as a generative "
                               "screenprint: posterized plates, press misregistration, the day's newspaper "
                               "baked into the image. thomqu",
                "image": f"img/{fn}.png",
                "animation_url": f"https://thomqu.com/live?s={slug}&i={idx}",
                "attributes": [
                    {"trait_type":"Figure","value":full},
                    {"trait_type":"Series","value":f"{sn} / {tk}"},
                    {"trait_type":"Ticker","value":tk},
                    {"trait_type":"Finish","value":rec['baseName']},
                    {"trait_type":"Overprints","value":rec['n']},
                    {"trait_type":"Databend","value":"Yes" if rec['databend'] else "No"},
                    {"display_type":"number","trait_type":"No.","value":n,"max_value":TOTAL},
                ],
                "_src":{"slug":slug,"engineIndex":idx},
            }
            json.dump(meta, open(f'{OUT}/meta/{fn}.json','w'), ensure_ascii=False, indent=1)
            manifest.append({"file":f"img/{fn}.png","no":n,"figure":full,"series":f"{sn}/{tk}",
                             "ticker":tk,"finish":rec['baseName'],"slug":slug,"engineIndex":idx})
            if n % 20 == 0 or n == len(picks):
                print(f'  {n}/{len(picks)}  ({slug} #{idx}, {rec["baseName"]}, {len(png)//1024}KB)')
        br.close()
    json.dump({"collection":"THOMQU — 200","count":len(manifest),"works":manifest},
              open(f'{OUT}/manifest.json','w'), ensure_ascii=False, indent=1)
    import collections
    by = collections.Counter(w['slug'] for w in manifest)
    print('\nDONE ->', OUT)
    print('per figure:', {SERIES[s][0]:c for s,c in by.most_common()})

if __name__ == '__main__':
    main()
