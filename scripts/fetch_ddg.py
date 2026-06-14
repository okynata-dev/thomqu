#!/usr/bin/env python3
# Массовый добор портретов через DuckDuckGo image search (весь веб-индекс, без ключей).
# Личное/некоммерческое использование. Кроп 3:4, дедуп по хешу, дописывает в manifest.
import os, re, ssl, sys, json, time, hashlib, urllib.parse, urllib.request, certifi
from PIL import Image
CTX = ssl.create_default_context(cafile=certifi.where())
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

QUERIES = {
 'huang':['jensen huang portrait','jensen huang nvidia ceo face'],
 'saylor':['michael saylor portrait','michael saylor microstrategy face'],
 'vitalik':['vitalik buterin portrait','vitalik buterin ethereum face'],
 'powell':['jerome powell portrait','jerome powell fed chair face'],
 'gates':['bill gates portrait','bill gates face closeup'],
 'zuck':['mark zuckerberg portrait','mark zuckerberg face'],
 'cz':['changpeng zhao cz binance portrait','cz binance face'],
 'trump':['donald trump portrait','donald trump face'],
 'musk':['elon musk portrait','elon musk face closeup'],
 'sbf':['sam bankman-fried portrait','sam bankman fried ftx face'],
 'cathie':['cathie wood ark invest portrait','cathie wood investor face'],
 'buffett':['warren buffett portrait','warren buffett face'],
 'armstrong':['brian armstrong coinbase portrait','brian armstrong ceo face'],
 'dorsey':['jack dorsey portrait','jack dorsey face'],
 'dimon':['jamie dimon portrait','jamie dimon jpmorgan face'],
 'dokwon':['do kwon terra portrait','do kwon terraform labs face'],
 'sun':['justin sun tron portrait','justin sun crypto face'],
 'ternus':['john ternus apple portrait','john ternus apple ceo face'],
}

def get(url, referer=None, raw=False, timeout=30):
    h={'User-Agent':UA,'Accept':'*/*'}
    if referer: h['Referer']=referer
    req=urllib.request.Request(url,headers=h)
    r=urllib.request.urlopen(req,timeout=timeout,context=CTX)
    return r.read() if raw else r.read().decode('utf-8','ignore')

def vqd(query):
    html=get('https://duckduckgo.com/?'+urllib.parse.urlencode({'q':query,'iar':'images','ia':'images'}))
    m=re.search(r'vqd=["\']?([\d-]+)', html)
    return m.group(1) if m else None

def ddg_images(query, pages=4):
    v=vqd(query)
    if not v: print('  no vqd', query); return []
    out=[]; p=0
    while p<pages:
        u='https://duckduckgo.com/i.js?'+urllib.parse.urlencode(
            {'l':'us-en','o':'json','q':query,'vqd':v,'f':',,,,,','p':'1'})
        if out: u+='&s='+str(p*100)
        try: d=json.loads(get(u, referer='https://duckduckgo.com/'))
        except Exception as e: print('  ddg err',e); break
        res=d.get('results',[])
        if not res: break
        out+= [r['image'] for r in res if r.get('image')]
        if not d.get('next'): break
        p+=1; time.sleep(1.0)
    return out

def crop34(data, dst):
    import io
    im=Image.open(io.BytesIO(data)).convert('RGB')
    w,h=im.size
    if w<420 or h<420: return False
    if w/h>3/4: cw=int(h*3/4); x=(w-cw)//2; box=(x,0,x+cw,h)
    else: ch=int(w*4/3); y=int((h-ch)*0.14); box=(0,y,w,y+ch)
    im.crop(box).resize((900,1200),Image.LANCZOS).save(dst,'JPEG',quality=88)
    return True

def run(slug, cap=70):
    d=os.path.join(ROOT,'assets',slug); os.makedirs(d,exist_ok=True)
    mpath=os.path.join(d,'manifest.json')
    if os.path.exists(mpath):
        man=json.load(open(mpath))
    else:
        man={'slug':slug,'name':slug,'ticker':'','masters':[]}
    nextn=max([int(f.split('.')[0]) for f in man['masters']], default=0)+1
    # dedup vs existing by md5 of file bytes
    seen=set()
    for f in man['masters']:
        try: seen.add(hashlib.md5(open(os.path.join(d,f),'rb').read()).hexdigest())
        except: pass
    urls=[]
    for q in QUERIES[slug]: urls+=ddg_images(q)
    seenu=set(); added=0
    for url in urls:
        if added>=cap: break
        if url in seenu: continue
        seenu.add(url)
        try:
            data=get(url, raw=True, timeout=25)
            if len(data)<8000: continue
            tmp=os.path.join(d,f'_tmp_{nextn}.jpg'); open(tmp,'wb').write(data)
            # crop to a buffer first to compute dedup on normalized jpg
            fn=f'{nextn:03d}.jpg'; dst=os.path.join(d,fn)
            if not crop34(data,dst):
                os.remove(tmp); continue
            os.remove(tmp)
            hh=hashlib.md5(open(dst,'rb').read()).hexdigest()
            if hh in seen: os.remove(dst); continue
            seen.add(hh); man['masters'].append(fn); nextn+=1; added+=1
        except Exception as e:
            continue
        time.sleep(0.2)
    man['masters']=sorted(set(man['masters']))
    json.dump(man,open(mpath,'w'),indent=1)
    print(f'{slug}: +{added} -> {len(man["masters"])}')

if __name__=='__main__':
    only=sys.argv[1:] if len(sys.argv)>1 else list(QUERIES)
    for s in only: run(s)
