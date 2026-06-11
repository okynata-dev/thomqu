#!/usr/bin/env python3
# Сбор мастер-портретов с Wikimedia Commons (свободные лицензии, авторство фиксируется).
# Для каждого героя: категория + поиск -> фильтр лицензий/размера -> скачивание ->
# кроп 3:4 с верхним якорем -> assets/<slug>/NNN.jpg + credits.json + manifest.json
import json, os, re, ssl, sys, time, urllib.parse, urllib.request
import certifi
from PIL import Image

SSL_CTX = ssl.create_default_context(cafile=certifi.where())

API = 'https://commons.wikimedia.org/w/api.php'
HDRS = {'User-Agent': 'thomqu-collection/1.0 (contact: cryptokynata@gmail.com)'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PERSONS = [
    {'slug': 'huang',   'name': 'Jensen Huang',    'ticker': 'NVDA', 'cat': 'Category:Jensen Huang',     'q': 'Jensen Huang'},
    {'slug': 'saylor',  'name': 'Michael Saylor',  'ticker': 'MSTR', 'cat': 'Category:Michael J. Saylor','q': 'Michael Saylor'},
    {'slug': 'vitalik', 'name': 'Vitalik Buterin', 'ticker': 'ETH',  'cat': 'Category:Vitalik Buterin',  'q': 'Vitalik Buterin'},
    {'slug': 'powell',  'name': 'Jerome Powell',   'ticker': 'FED',  'cat': 'Category:Jerome Powell',    'q': 'Jerome Powell federal reserve'},
]

OK = re.compile(r'^(cc0|cc.by(.\d\.\d)?|public domain|pd|no restrictions|attribution)', re.I)   # разрешительные
SA = re.compile(r'cc.by.sa', re.I)                                                              # share-alike: качаем, но помечаем
BAD_NAME = re.compile(r'(logo|chart|diagram|screenshot|graph|map|icon|cover|book|slide)', re.I)

def api(params):
    p = dict(params, format='json')
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(p), headers=HDRS)
    return json.load(urllib.request.urlopen(req, timeout=40, context=SSL_CTX))

def gather(person):
    titles = []
    cont = {}
    while True:                                                   # файлы категории
        r = api({'action':'query','list':'categorymembers','cmtitle':person['cat'],
                 'cmtype':'file','cmlimit':'500', **cont})
        titles += [m['title'] for m in r.get('query',{}).get('categorymembers',[])]
        if 'continue' in r: cont = {'cmcontinue': r['continue']['cmcontinue']}
        else: break
    cont = {}
    for _ in range(4):                                            # добор поиском
        r = api({'action':'query','list':'search','srsearch':person['q'],
                 'srnamespace':'6','srlimit':'50', **cont})
        titles += [m['title'] for m in r.get('query',{}).get('search',[])]
        if 'continue' in r: cont = {'sroffset': r['continue']['sroffset']}
        else: break
    seen, out = set(), []
    for t in titles:
        if t not in seen: seen.add(t); out.append(t)
    return out

def fileinfo(titles):
    out = []
    for i in range(0, len(titles), 40):
        r = api({'action':'query','titles':'|'.join(titles[i:i+40]),'prop':'imageinfo',
                 'iiprop':'url|size|mime|extmetadata','iiurlwidth':'1600'})
        for p in r.get('query',{}).get('pages',{}).values():
            ii = (p.get('imageinfo') or [None])[0]
            if not ii: continue
            em = ii.get('extmetadata', {})
            g = lambda k: re.sub(r'<[^>]+>','',em.get(k,{}).get('value','') or '').strip()
            out.append({'title': p.get('title',''), 'mime': ii.get('mime',''),
                        'w': ii.get('width',0), 'h': ii.get('height',0),
                        'url': ii.get('thumburl') or ii.get('url'),
                        'page': ii.get('descriptionurl',''),
                        'license': g('LicenseShortName'), 'artist': g('Artist')})
        time.sleep(0.3)
    return out

def crop34(src, dst):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if w / h > 3/4:
        cw = int(h * 3/4); x = (w - cw)//2; box = (x, 0, x+cw, h)
    else:
        ch = int(w * 4/3); y = int((h - ch) * 0.18); box = (0, y, w, y+ch)   # верхний якорь
    im.crop(box).resize((900, 1200), Image.LANCZOS).save(dst, 'JPEG', quality=88)

def run(person, cap=120):
    slug = person['slug']
    rawdir = os.path.join(ROOT, 'assets', 'raw', slug)
    outdir = os.path.join(ROOT, 'assets', slug)
    os.makedirs(rawdir, exist_ok=True); os.makedirs(outdir, exist_ok=True)
    infos = fileinfo(gather(person))
    picked, credits = [], []
    for fi in infos:
        if len(picked) >= cap: break
        if fi['mime'] not in ('image/jpeg','image/png'): continue
        if fi['w'] < 600 or fi['h'] < 500: continue
        if BAD_NAME.search(fi['title']): continue
        lic = fi['license']
        if SA.search(lic): flag = 'BY-SA (share-alike!)'
        elif OK.match(lic): flag = ''
        else: continue                                            # незнакомая/несвободная лицензия — мимо
        picked.append((fi, flag))
    n = 0
    for fi, flag in picked:
        n += 1
        raw = os.path.join(rawdir, f'{n:03d}' + ('.png' if fi['mime']=='image/png' else '.jpg'))
        dst = os.path.join(outdir, f'{n:03d}.jpg')
        try:
            req = urllib.request.Request(fi['url'], headers=HDRS)
            with urllib.request.urlopen(req, timeout=60, context=SSL_CTX) as r, open(raw,'wb') as f:
                f.write(r.read())
            crop34(raw, dst)
        except Exception as e:
            print(f'  ! {slug} {n:03d} fail: {e}'); n -= 1; continue
        credits.append({'file': f'{n:03d}.jpg', 'title': fi['title'], 'page': fi['page'],
                        'license': fi['license'] + ((' · '+flag) if flag else ''), 'artist': fi['artist']})
        time.sleep(0.4)
    json.dump(credits, open(os.path.join(outdir,'credits.json'),'w'), ensure_ascii=False, indent=1)
    json.dump({'slug': slug, 'name': person['name'], 'ticker': person['ticker'],
               'masters': [c['file'] for c in credits]},
              open(os.path.join(outdir,'manifest.json'),'w'), indent=1)
    print(f'{slug}: candidates={len(infos)} picked={len(picked)} saved={len(credits)}')

if __name__ == '__main__':
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for p in PERSONS:
        if only and p['slug'] != only: continue
        run(p)
