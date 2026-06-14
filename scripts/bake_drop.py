#!/usr/bin/env python3
# Bake a drop: render every CURATED token of a series through the REAL engine.js (headless, Playwright)
# to a full-res PNG, and emit OpenSea-standard ERC-721 metadata JSON. Output lands under drop/<slug>/
# ready to host at https://thomqu.com/drop/<slug>/ and point a Base contract's baseURI there.
#
#   python3 scripts/bake_drop.py saylor [--res 2400] [--temp 0.5] [--limit N]
#
import os, sys, json, base64, threading, argparse, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_HOST = 'https://thomqu.com'                 # where the drop will be served (own domain)

DESC = ("THOMQU — a silkscreen press wired to a ticker. {name} ({ticker}) rendered as a generative "
        "screenprint: posterized ink plates, press misregistration and databend, the day's newspaper "
        "baked into the channels. Each work is frozen at its mint-day press state. {edition} of {total}, "
        "limited edition. thomqu.com")

def serve(root, port):
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
    httpd = socketserver.TCPServer(('127.0.0.1', port), h)
    httpd.allow_reuse_address = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def regime(t):
    return 'Overheated' if t > 0.62 else 'Burnout' if t < 0.38 else 'Clean'

def traits(slug, cfg, k, total, N, temp, recipe, master):
    a = [
        {"trait_type":"Series", "value": f"{cfg['name'].split()[-1]} / {cfg['ticker']}"},
        {"trait_type":"Ticker", "value": cfg['ticker']},
        {"trait_type":"Base Finish", "value": recipe['baseName']},
        {"trait_type":"Overprints", "value": recipe['n']},
        {"trait_type":"Databend", "value": "Yes" if recipe['databend'] else "No"},
        {"trait_type":"Press State", "value": regime(temp)},
    ]
    # name the strongest databend effect, if any (provenance / rarity signal)
    dbs = [l['name'] for l in recipe['layers'] if l['isDB']]
    if dbs:
        a.append({"trait_type":"Effect", "value": dbs[-1]})
    a.append({"display_type":"number","trait_type":"Edition","value":k,"max_value":total})
    a.append({"trait_type":"Press No.", "value": str(N)})   # original engine seed index — provenance
    return a

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('slug')
    ap.add_argument('--res', type=int, default=2400)        # output height (3:4 => width = res*0.75)
    ap.add_argument('--temp', type=float, default=0.5)      # frozen mint-day press temperature
    ap.add_argument('--limit', type=int, default=0)         # bake only first N (smoke test)
    ap.add_argument('--port', type=int, default=8799)
    args = ap.parse_args()
    slug = args.slug

    man = json.load(open(f'{ROOT}/assets/{slug}/manifest.json'))
    cur = man.get('curated') or list(range(1, 501))
    if args.limit: cur = cur[:args.limit]
    total = len(man.get('curated') or cur)
    import re
    s = open(f'{ROOT}/series.js').read(); i = s.find(f'{slug}:{{'); seg = s[i:i+700]
    cfg = {k: (re.search(k+r":\s*'([^']*)'", seg) or re.search(k+r":\s*([0-9.]+)", seg)).group(1)
           for k in ['name','ticker']}

    out = f'{ROOT}/drop/{slug}'
    img_dir = f'{out}/img'; meta_dir = f'{out}/meta'
    os.makedirs(img_dir, exist_ok=True); os.makedirs(meta_dir, exist_ok=True)

    serve(ROOT, args.port)
    base_img  = f'{BASE_HOST}/drop/{slug}/img'
    base_meta = f'{BASE_HOST}/drop/{slug}/meta'

    print(f'baking {slug}: {len(cur)} curated works @ {int(args.res*0.75)}x{args.res}, t={args.temp}')
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={'width':400,'height':400})
        pg.set_default_timeout(120000)
        pg.goto(f'http://127.0.0.1:{args.port}/drop/render.html')
        pg.wait_for_function('window.__ready===true')
        for k, N in enumerate(cur, start=1):           # k = edition tokenId (1..total); N = engine token no. (1-based)
            r = pg.evaluate('([s,i,t,h])=>window.bake(s,i,t,h)', [slug, N-1, args.temp, args.res])
            png = base64.b64decode(r['png'].split(',',1)[1])
            open(f'{img_dir}/{k}.png','wb').write(png)
            meta = {
                "name": f"{cfg['name'].split()[-1].upper()} / {cfg['ticker']} — No. {k}",
                "description": DESC.format(name=cfg['name'], ticker=cfg['ticker'], edition=k, total=total),
                "image": f"{base_img}/{k}.png",
                "animation_url": f"{BASE_HOST}/live?s={slug}&id={k}",   # live price-temperature render
                "external_url": f"{BASE_HOST}/token.html?n={N}&s={slug}&t={args.temp:.2f}",
                "attributes": traits(slug, cfg, k, total, N, args.temp, r['recipe'], r['master']),
            }
            txt = json.dumps(meta, ensure_ascii=False, indent=1)
            open(f'{meta_dir}/{k}.json','w').write(txt)     # for contracts that append ".json"
            open(f'{meta_dir}/{k}','w').write(txt)           # for contracts that append nothing
            if k % 16 == 0 or k == len(cur):
                print(f'  {k}/{len(cur)}  (#{N}, {r["recipe"]["baseName"]}, {len(png)//1024}KB)')
        br.close()

    print('\nDONE ->', out)
    print('baseURI  :', base_meta + '/')
    print('images   :', base_img + '/')
    print('files    :', len(os.listdir(img_dir)), 'png +', len(os.listdir(meta_dir)), 'meta')

if __name__ == '__main__':
    main()
