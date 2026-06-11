#!/usr/bin/env python3
# Добор портретов через Openverse API (CC-лицензированные фото с Flickr/конференций и т.д.).
# Докидывает к существующим мастерам серии: assets/<slug>/NNN.jpg (продолжая нумерацию) + credits.
import json, os, re, ssl, sys, time, urllib.parse, urllib.request
import certifi
from PIL import Image

CTX = ssl.create_default_context(cafile=certifi.where())
H = {'User-Agent': 'thomqu-collection/1.0 (cryptokynata@gmail.com)'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.openverse.org/v1/images/'

QUERIES = {
    'vitalik': ['vitalik buterin', 'buterin ethereum', 'vitalik buterin devcon', 'vitalik buterin conference'],
    'gates':   ['bill gates', 'bill gates microsoft', 'bill gates speaking', 'bill gates portrait'],
    'zuck':    ['mark zuckerberg', 'mark zuckerberg facebook', 'zuckerberg speaking', 'zuckerberg meta'],
}
BAD = re.compile(r'(logo|chart|diagram|screenshot|coin|token|render|poster|cover|3d)', re.I)

TOKEN = None
def auth_token():
    global TOKEN
    if TOKEN: return TOKEN
    # регистрируем приложение и берём bearer-токен (повышает лимиты, обязателен с 2025)
    reg = urllib.request.Request('https://api.openverse.org/v1/auth_tokens/register/',
        data=json.dumps({'name': 'thomqu-'+str(int(time.time())), 'description': 'art research',
                         'email': 'cryptokynata@gmail.com'}).encode(),
        headers={**H, 'Content-Type': 'application/json'})
    c = json.load(urllib.request.urlopen(reg, timeout=40, context=CTX))
    tok = urllib.request.Request('https://api.openverse.org/v1/auth_tokens/token/',
        data=urllib.parse.urlencode({'client_id': c['client_id'], 'client_secret': c['client_secret'],
                                     'grant_type': 'client_credentials'}).encode(), headers=H)
    TOKEN = json.load(urllib.request.urlopen(tok, timeout=40, context=CTX))['access_token']
    return TOKEN

def get(url, auth=False):
    h = dict(H)
    if auth: h['Authorization'] = 'Bearer ' + auth_token()
    req = urllib.request.Request(url, headers=h)
    return urllib.request.urlopen(req, timeout=50, context=CTX)

def search(q, pages=4):
    out = []
    for p in range(1, pages + 1):
        u = API + '?' + urllib.parse.urlencode({'q': q, 'page': p, 'page_size': 50, 'mature': 'false'})
        try:
            d = json.load(get(u, auth=True))
        except Exception as e:
            print('  search err', q, p, e); break
        for r in d.get('results', []):
            out.append(r)
        if p >= d.get('page_count', 1): break
        time.sleep(0.5)
    return out

def crop34(src, dst):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if w / h > 3/4:
        cw = int(h*3/4); x = (w-cw)//2; box = (x, 0, x+cw, h)
    else:
        ch = int(w*4/3); y = int((h-ch)*0.18); box = (0, y, w, y+ch)
    im.crop(box).resize((900, 1200), Image.LANCZOS).save(dst, 'JPEG', quality=88)

def run(slug):
    outdir = os.path.join(ROOT, 'assets', slug)
    rawdir = os.path.join(ROOT, 'assets', 'raw', slug)
    os.makedirs(rawdir, exist_ok=True)
    man = json.load(open(os.path.join(outdir, 'manifest.json')))
    cred = json.load(open(os.path.join(outdir, 'credits.json')))
    have = set(man['masters'])
    nextn = max([int(f.split('.')[0]) for f in have], default=0) + 1
    seen_urls = set()
    results = []
    for q in QUERIES[slug]:
        results += search(q)
    print(f'{slug}: openverse returned {len(results)} raw results')
    added = 0
    for r in results:
        if added >= 80: break
        url = r.get('url')
        title = (r.get('title') or '')
        if not url or url in seen_urls: continue
        seen_urls.add(url)
        if BAD.search(title): continue
        lic = (r.get('license') or '').lower()
        if lic in ('', 'sampling+', 'nc-sampling+'): continue   # пропускаем неясные
        fn = f'{nextn:03d}.jpg'
        raw = os.path.join(rawdir, f'ov_{nextn:03d}')
        dst = os.path.join(outdir, fn)
        try:
            with get(url) as resp, open(raw, 'wb') as f:
                f.write(resp.read())
            crop34(raw, dst)
        except Exception as e:
            print('  fail', url[:60], e); continue
        man['masters'].append(fn)
        cred.append({'file': fn, 'title': title, 'page': r.get('foreign_landing_url', ''),
                     'license': (lic + ' ' + (r.get('license_version') or '')).strip(),
                     'artist': r.get('creator', ''), 'source': r.get('source', 'openverse')})
        nextn += 1; added += 1
        time.sleep(0.3)
    man['masters'] = sorted(set(man['masters']))
    json.dump(man, open(os.path.join(outdir, 'manifest.json'), 'w'), indent=1)
    json.dump(cred, open(os.path.join(outdir, 'credits.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{slug}: added {added}, total masters now {len(man["masters"])}')

if __name__ == '__main__':
    run(sys.argv[1] if len(sys.argv) > 1 else 'vitalik')
