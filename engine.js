// Shared generative engine — resolution-independent.
// compose(i) is deterministic per seed; geometry is fraction-of-canvas and byte params scale with width,
// so token #N at 4K == contact-sheet tile #N, just higher resolution.
(function(){
"use strict";
let W,H,SCALE,rb,R,G,B,L,fcv,fctx;
let MCV;                      // fitted master portrait (raw, pre-press pre-grade)
let PCV,PCTX,KCV,KCTX,CCV,CCTX; // scratch: press-collage ink / knockout (выворотка) / channel build
let PRESS=true;               // press collage on/off
let T=0.5,HEAT=0,BURN=0;      // NVDA temperature: t=0.5 clean print (grade is identity), >0.5 heat, <0.5 burnout
let CUR=0;                    // current token index (seeds heat jitter per token)
let COUNT=500;                // размер серии (для выходных данных No. i/COUNT)

const clamp=v=>v<0?0:v>255?255:v|0;
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function h2(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);}
function blotch(x,y,cell){const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=x/cell-gx,fy=y/cell-gy;const a=h2(gx,gy),b=h2(gx+1,gy),c=h2(gx,gy+1),d=h2(gx+1,gy+1);return a*(1-fx)*(1-fy)+b*fx*(1-fy)+c*(1-fx)*fy+d*fx*fy;}
const samp=(arr,x,y)=>{x=x|0;y=y|0;if(x<0)x=0;if(y<0)y=0;if(x>=W)x=W-1;if(y>=H)y=H-1;return arr[y*W+x];};

function pixel(fn){const im=new ImageData(W,H),d=im.data;for(let y=0,p=0;y<H;y++)for(let x=0;x<W;x++,p+=4){const i=y*W+x;const o=fn(L[i],R[i],G[i],B[i],x,y);d[p]=clamp(o[0]);d[p+1]=clamp(o[1]);d[p+2]=clamp(o[2]);d[p+3]=255;}return im;}
function dots(ctx,paper,screens,pitch){pitch*=SCALE;ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='multiply';
  for(const s of screens){
    // heat physically degrades the press: plates drift apart, screen angle/frequency detune -> moiré.
    // Jitter is seeded per (token, screen) so it is deterministic; key/dark plate stays tighter, like a real press.
    const jr=mulberry32(hashStr('temp-'+CUR+'-'+s.ang+'-'+s.col.join(','))),
          tight=(s.col[0]+s.col[1]+s.col[2]<120)?0.4:1,
          jA=(jr()*2-1),jP=(jr()*2-1),jD=jr()*Math.PI*2,jM=jr(),
          a=(s.ang+jA*HEAT*9)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),
          p=Math.max(2*SCALE,pitch+jP*HEAT*1.6*SCALE),
          ox=(s.ox||0)*SCALE+Math.cos(jD)*jM*HEAT*10*SCALE*tight,
          oy=(s.oy||0)*SCALE+Math.sin(jD)*jM*HEAT*10*SCALE*tight,
          span=Math.ceil(Math.sqrt(W*W+H*H)/p)+1;
    ctx.fillStyle=`rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;
    for(let i=-span;i<=span;i++)for(let j=-span;j<=span;j++){const Lx=W/2+(i*ca-j*sa)*p,Ly=H/2+(i*sa+j*ca)*p;if(Lx<-p||Ly<-p||Lx>W+p||Ly>H+p)continue;let ink=s.ink(Lx,Ly);if(ink<=0.015)continue;const rad=p*0.5*Math.sqrt(ink)*1.18;ctx.beginPath();ctx.arc(Lx+ox,Ly+oy,rad,0,7);ctx.fill();}}
  ctx.globalCompositeOperation='source-over';}
const lumAt=(x,y)=>samp(L,x,y)/255;
function cmykAt(x,y,ch){const r=samp(R,x,y)/255,g=samp(G,x,y)/255,b=samp(B,x,y)/255,k=1-Math.max(r,g,b);if(k>=0.999)return ch===3?1:0;if(ch===3)return k;return[(1-r-k)/(1-k),(1-g-k)/(1-k),(1-b-k)/(1-k)][ch];}

const FINISH=[
  ["CMYK Halftone", ctx=>dots(ctx,'#f4efe4',[{col:[0,158,200],ang:15,ink:(x,y)=>cmykAt(x,y,0)},{col:[222,0,140],ang:75,ink:(x,y)=>cmykAt(x,y,1)},{col:[245,206,0],ang:0,ink:(x,y)=>cmykAt(x,y,2)},{col:[18,15,18],ang:45,ink:(x,y)=>cmykAt(x,y,3)}],5)],
  ["Newsprint", ctx=>dots(ctx,'#f0e7d2',[{col:[22,20,18],ang:45,ink:(x,y)=>Math.pow(1-lumAt(x,y),1.05)}],6)],
  ["Duotone Ink", ctx=>dots(ctx,'#efeae0',[{col:[20,40,55],ang:45,ink:(x,y)=>Math.pow(1-lumAt(x,y),1.3)},{col:[0,150,150],ang:15,ink:(x,y)=>{const l=lumAt(x,y);return Math.max(0,1-Math.abs(l-0.5)*2.6);}}],5)],
  ["Warhol Screenprint", ctx=>{const pal=[[20,16,22],[224,33,138],[255,106,26],[255,210,30],[255,243,214]];ctx.putImageData(pixel(l=>{const L0=l/255;let z=L0<0.15?0:L0<0.38?1:L0<0.62?2:L0<0.82?3:4;return pal[z];}),0,0);}],
  ["Riso 2-Color", ctx=>{dots(ctx,'#f7f2e7',[{col:[0,120,190],ang:45,ox:1.5,oy:0,ink:(x,y)=>Math.pow(1-lumAt(x,y),1.4)},{col:[255,72,176],ang:15,ox:-1.5,oy:1,ink:(x,y)=>{const l=lumAt(x,y);return Math.max(0,0.9-Math.abs(l-0.55)*2.2);}}],5);const g=ctx.getImageData(0,0,W,H),d=g.data;for(let y=0,p=0;y<H;y++)for(let x=0;x<W;x++,p+=4){const n=(h2(x/SCALE,y/SCALE)-0.5)*22;d[p]=clamp(d[p]+n);d[p+1]=clamp(d[p+1]+n);d[p+2]=clamp(d[p+2]+n);}ctx.putImageData(g,0,0);}],
  ["Riso 3-Color", ctx=>dots(ctx,'#f8f3e8',[{col:[255,210,30],ang:0,ox:1,oy:-1,ink:(x,y)=>Math.max(0,(lumAt(x,y)-0.45)*1.6)},{col:[255,72,176],ang:15,ox:-2,oy:1,ink:(x,y)=>{const l=lumAt(x,y);return Math.max(0,0.85-Math.abs(l-0.5)*2.3);}},{col:[0,110,185],ang:45,ox:2,oy:1.5,ink:(x,y)=>Math.pow(1-lumAt(x,y),1.5)}],5)],
  ["1-bit Stamp", ctx=>ctx.putImageData(pixel((l,r,g,b,x,y)=>{const rough=(h2(x/SCALE*1.7,y/SCALE*1.7)-0.5)*0.12,t=(l/255)+rough;const dens=0.75+0.25*blotch(x/SCALE,y/SCALE,40);if(t<0.46){const v=clamp(30*(1.2-dens));return[v+10,v+8,v+8];}return[244,240,230];}),0,0)],
  ["Bayer Dither", ctx=>{const m=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];ctx.putImageData(pixel((l,r,g,b,x,y)=>{const fx=Math.floor(x/SCALE)&3,fy=Math.floor(y/SCALE)&3;const th=(m[fy][fx]+0.5)/16*255;return(l>th)?[245,241,231]:[24,20,22];}),0,0);}],
  ["Floyd–Steinberg", ctx=>{const dw=Math.round(W/SCALE),dh=Math.round(H/SCALE);const buf=new Float32Array(dw*dh);for(let y=0;y<dh;y++)for(let x=0;x<dw;x++)buf[y*dw+x]=samp(L,x*SCALE,y*SCALE);for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const i=y*dw+x;const old=buf[i];const nw=old<128?0:255;const err=old-nw;buf[i]=nw;if(x+1<dw)buf[i+1]+=err*7/16;if(y+1<dh){if(x>0)buf[i+dw-1]+=err*3/16;buf[i+dw]+=err*5/16;if(x+1<dw)buf[i+dw+1]+=err*1/16;}}const out=new ImageData(W,H),d=out.data;for(let y=0,p=0;y<H;y++)for(let x=0;x<W;x++,p+=4){const v=buf[(Math.floor(y/SCALE))*dw+Math.floor(x/SCALE)]<128?[26,22,24]:[246,242,232];d[p]=v[0];d[p+1]=v[1];d[p+2]=v[2];d[p+3]=255;}ctx.putImageData(out,0,0);}],
  ["Riso Misregister", ctx=>dots(ctx,'#f7f2e7',[{col:[20,30,40],ang:45,ink:(x,y)=>Math.pow(1-lumAt(x,y),1.3)},{col:[255,72,176],ang:15,ox:-7,oy:3,ink:(x,y)=>{const l=lumAt(x,y);return Math.max(0,0.9-Math.abs(l-0.5)*2.2);}},{col:[0,150,170],ang:75,ox:7,oy:-3,ink:(x,y)=>Math.max(0,(lumAt(x,y)-0.4)*1.4)}],5)],
];

const bidx=(x,y)=>(y*W+x)*3;
const briB=(b,i)=>0.299*b[i]+0.587*b[i+1]+0.114*b[i+2];
function echo(b,delay,decay){const N=b.length,o=new Uint8Array(N);for(let i=0;i<N;i++)o[i]=clamp(b[i]+(i-delay>=0?b[i-delay]*decay:0));return o;}
function reverseRange(b,s,len){let a=s,z=Math.min(s+len,b.length)-1;while(a<z){const t=b[a];b[a]=b[z];b[z]=t;a++;z--;}return b;}
function repeatChunk(b,src,len,count){for(let c=1;c<=count;c++){const dst=src+c*len;for(let k=0;k<len&&dst+k<b.length;k++)b[dst+k]=b[src+k];}return b;}
function deleteShift(b,start,len){len=len|0;for(let i=start;i<b.length-len;i++)b[i]=b[i+len];return b;}
function xorRange(b,mask,s,e){for(let i=s;i<e&&i<b.length;i++)b[i]^=mask;return b;}
function bitCrush(b,levels){const q=levels-1;for(let i=0;i<b.length;i++)b[i]=Math.round(Math.round(b[i]/255*q)/q*255);return b;}
function pSort(b,lo,hi,vert,desc){
  if(!vert){for(let y=0;y<H;y++){let x=0;while(x<W){let v=briB(b,bidx(x,y));if(v>=lo&&v<=hi){let s=x;while(x<W&&(v=briB(b,bidx(x,y)))>=lo&&v<=hi)x++;const arr=[];for(let k=s;k<x;k++){const i=bidx(k,y);arr.push([b[i],b[i+1],b[i+2],briB(b,i)]);}arr.sort((p,q)=>desc?q[3]-p[3]:p[3]-q[3]);for(let k=s;k<x;k++){const i=bidx(k,y),p=arr[k-s];b[i]=p[0];b[i+1]=p[1];b[i+2]=p[2];}}else x++;}}}
  else{for(let x=0;x<W;x++){let y=0;while(y<H){let v=briB(b,bidx(x,y));if(v>=lo&&v<=hi){let s=y;while(y<H&&(v=briB(b,bidx(x,y)))>=lo&&v<=hi)y++;const arr=[];for(let k=s;k<y;k++){const i=bidx(x,k);arr.push([b[i],b[i+1],b[i+2],briB(b,i)]);}arr.sort((p,q)=>desc?q[3]-p[3]:p[3]-q[3]);for(let k=s;k<y;k++){const i=bidx(x,k),p=arr[k-s];b[i]=p[0];b[i+1]=p[1];b[i+2]=p[2];}}else y++;}}}
  return b;}
function dctSmear(b,n,seed){let s=seed;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};for(let q=0;q<n;q++){const y0=Math.floor(rnd()*H),hb=4+Math.floor(rnd()*16),len=20+Math.floor(rnd()*120),x0=Math.floor(rnd()*(W-30));for(let y=y0;y<Math.min(y0+hb,H);y++)for(let x=x0+1;x<Math.min(x0+len,W);x++){const i=bidx(x,y),p=bidx(x-1,y);b[i]=clamp(b[i]*0.25+b[p]*0.75);b[i+1]=clamp(b[i+1]*0.25+b[p+1]*0.75);b[i+2]=clamp(b[i+2]*0.25+b[p+2]*0.75);}}return b;}

const EFFECT=[
  ["Chunk Delete",  b=>deleteShift(b,rb*40,rb*0.5)],
  ["Double Delete", b=>deleteShift(deleteShift(b,rb*30,rb*0.33),rb*90,rb*0.65)],
  ["Chunk Repeat",  b=>repeatChunk(b,rb*60,rb*5,6)],
  ["Chunk Reverse", b=>reverseRange(b,rb*80,rb*40)],
  ["Block Stutter", b=>repeatChunk(repeatChunk(b,rb*45,rb*3,4),rb*150,rb*4,5)],
  ["DCT Datamosh",  b=>dctSmear(b,26,17)],
  ["Sort Bright",   b=>pSort(b,150,255,false,false)],
  ["Sort Dark",     b=>pSort(b,0,90,false,true)],
  ["Sort Vertical", b=>pSort(b,120,255,true,true)],
  ["Sort Liquid",   b=>pSort(b,60,210,false,false)],
  ["Sort Mid Band", b=>pSort(b,90,170,false,true)],
  ["Sort Cross",    b=>pSort(pSort(b,150,255,false,false),140,255,true,true)],
  ["XOR Mask",      b=>xorRange(b,0x55,0,b.length)],
  ["Bit Crush 3",   b=>bitCrush(b,3)],
  ["Total Collapse",b=>pSort(echo(deleteShift(b,rb*50,rb*0.66),rb,0.5),60,200,false,false)],
];

// ---------------- glitch animation (XCOPY/ACK-style flicker frames) ----------------
// Кадры — порча ОДНОЙ и той же композиции токена: геометрия не плывёт, мерцает только разрушение.
function workToRGB(work){const b=new Uint8Array(W*H*3);for(let p=0,q=0;q<b.length;p+=4,q+=3){b[q]=work[p];b[q+1]=work[p+1];b[q+2]=work[p+2];}return b;}
function rgbToImage(o){const d=new Uint8ClampedArray(W*H*4);for(let p=0,q=0;q<o.length;p+=4,q+=3){d[p]=o[q];d[p+1]=o[q+1];d[p+2]=o[q+2];d[p+3]=255;}return new ImageData(d,W,H);}
function invertB(b){for(let i=0;i<b.length;i++)b[i]=255-b[i];return b;}
function redCrushB(b){for(let i=0;i<b.length;i+=3){const l=0.299*b[i]+0.587*b[i+1]+0.114*b[i+2];   // ч/б/красный — классика XCOPY
  if(l<70){b[i]=14;b[i+1]=10;b[i+2]=12;}else if(l>185){b[i]=246;b[i+1]=242;b[i+2]=232;}else{b[i]=225;b[i+1]=16;b[i+2]=34;}}return b;}
function chanShiftB(b,dx){const o=new Uint8Array(b);for(let y=0;y<H;y++)for(let x2=0;x2<W;x2++){const i=(y*W+x2)*3,
  xr=Math.min(W-1,Math.max(0,x2+dx)),xb=Math.min(W-1,Math.max(0,x2-dx));
  b[i]=o[(y*W+xr)*3];b[i+2]=o[(y*W+xb)*3+2];}return b;}
function sliceShiftB(b,seed){const rnd=mulberry32(seed),row=W*3,nb=3+((rnd()*6)|0);
  for(let k=0;k<nb;k++){const y0=(rnd()*H)|0,hh=2+((rnd()*Math.max(2,H*0.08))|0),dx=((rnd()*2-1)*W*0.2)|0;
    for(let y=y0;y<Math.min(H,y0+hh);y++){const st=y*row,line=b.slice(st,st+row);
      for(let x2=0;x2<W;x2++){let sx=((x2-dx)%W+W)%W;b[st+x2*3]=line[sx*3];b[st+x2*3+1]=line[sx*3+1];b[st+x2*3+2]=line[sx*3+2];}}}return b;}
function noiseRowsB(b,seed){const rnd=mulberry32(seed),row=W*3,nb=2+((rnd()*5)|0);
  for(let k=0;k<nb;k++){const y0=(rnd()*H)|0,hh=1+((rnd()*4)|0);
    for(let y=y0;y<Math.min(H,y0+hh);y++)for(let q=y*row;q<(y+1)*row;q+=3){const v=rnd()<0.5?12:240;b[q]=v;b[q+1]=v;b[q+2]=v;}}return b;}
function animFrames(i,n){
  n=n||7;
  const work=compose(i);
  const rng=mulberry32(hashStr('huang-anim-'+i));
  const out=[new ImageData(new Uint8ClampedArray(work),W,H)];
  for(let k=1;k<n;k++){
    let b=workToRGB(work);
    const m=rng();
    if(m<0.40)b=EFFECT[(rng()*EFFECT.length)|0][1](b);
    else if(m<0.55){b=EFFECT[(rng()*EFFECT.length)|0][1](b);b=sliceShiftB(b,(rng()*1e9)|0);}
    else if(m<0.70)b=sliceShiftB(b,(rng()*1e9)|0);
    else if(m<0.80)b=redCrushB(b);
    else if(m<0.90)b=chanShiftB(b,(2+rng()*10)*SCALE|0);
    else b=invertB(b);
    if(rng()<0.3)b=noiseRowsB(b,(rng()*1e9)|0);
    out.push(rgbToImage(b));
  }
  return out;
}

function finishData(idx){FINISH[idx][1](fctx);return fctx.getImageData(0,0,W,H).data;}
function effectLayer(work,ei){const b=new Uint8Array(W*H*3);for(let p=0,q=0;q<b.length;p+=4,q+=3){b[q]=work[p];b[q+1]=work[p+1];b[q+2]=work[p+2];}
  const o=EFFECT[ei][1](b);const layer=new Uint8ClampedArray(W*H*4);for(let p=0,q=0;q<o.length;p+=4,q+=3){layer[p]=o[q];layer[p+1]=o[q+1];layer[p+2]=o[q+2];layer[p+3]=255;}return layer;}
function blendRegion(work,layer,reg,a){const[x0,y0,x1,y1]=reg,ia=1-a;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*4;work[i]=work[i]*ia+layer[i]*a;work[i+1]=work[i+1]*ia+layer[i+1]*a;work[i+2]=work[i+2]*ia+layer[i+2]*a;}}
function pickRegion(rng,fullProb){
  if(rng()<fullProb)return[0,0,W,H];
  const t=rng();
  if(t<0.20){const w=Math.floor((0.15+rng()*0.5)*W),x=Math.floor(rng()*(W-w));return[x,0,x+w,H];}
  if(t<0.40){const h=Math.floor((0.15+rng()*0.5)*H),y=Math.floor(rng()*(H-h));return[0,y,W,y+h];}
  if(t<0.55){const k=Math.floor(rng()*4);return[[0,0,W>>1,H],[W>>1,0,W,H],[0,0,W,H>>1],[0,H>>1,W,H]][k];}
  if(t<0.72){const k=Math.floor(rng()*3),tw=(W/3)|0;return[k*tw,0,(k+1)*tw,H];}
  if(t<0.85){const k=Math.floor(rng()*3),th=(H/3)|0;return[0,k*th,W,(k+1)*th];}
  const w=Math.floor((0.25+rng()*0.5)*W),h=Math.floor((0.25+rng()*0.5)*H),x=Math.floor(rng()*(W-w)),y=Math.floor(rng()*(H-h));return[x,y,x+w,y+h];
}
// ---- автокурация seed'ов (рантайм-версия кураторского прохода 2026-06-10) ----
// Скан рецепта повторяет ПОРЯДОК draw'ов compose/pickRegion — менять строго синхронно!
// Каша = чужой растр-призрак (finish 0.3<a<0.95) или разрушительный эффект на весь кадр (a>0.5).
// Базовый seed со score<1.2 остаётся как есть (любимцы вида saylor #12/#31/#36 нетронуты);
// иначе берётся первый '~k' с чистым строгим профилем. Для первых 99 это воспроизводит
// зафиксированную кураторскую карту байт-в-байт, и работает для любого i (коллекции по 500).
function scanRecipe(seed){const rng=mulberry32(hashStr(seed));
  rng();let n=1+Math.floor(rng()*5);if(rng()<0.15)n+=2;
  const L=[];
  for(let k=0;k<n;k++){
    const isDB=rng()<0.55;let reg;
    if(rng()<0.15)reg='full';
    else{const t2=rng();
      if(t2<0.20){rng();rng();reg='vstrip';}
      else if(t2<0.40){rng();rng();reg='hstrip';}
      else if(t2<0.55){rng();reg='half';}
      else if(t2<0.72){rng();reg='thirdV';}
      else if(t2<0.85){rng();reg='thirdH';}
      else{rng();rng();rng();rng();reg='rect';}}
    const a=(1+Math.floor(rng()*100))/100,
          idx=isDB?Math.floor(rng()*EFFECT.length):Math.floor(rng()*FINISH.length);
    L.push({isDB,reg,a,idx});}
  return {n,L};}
const DESTRFX=new Set([5,6,7,8,9,10,11,12,14]);      // dct, сорты, xor, collapse
function mushScore(r){let s=0;
  for(const l of r.L){
    if(!l.isDB&&l.a>0.3&&l.a<0.95)s+=1.2;
    if(l.isDB&&DESTRFX.has(l.idx)&&l.reg==='full'&&l.a>0.5)s+=1.5;}
  if(r.n>4)s+=0.5*(r.n-4);
  return s;}
function strictOK(r){if(r.n>3)return false;let d=0;
  for(const l of r.L){
    if(!l.isDB&&!(l.a<=0.3||l.a>=0.95))return false;
    if(l.isDB&&DESTRFX.has(l.idx)){d++;
      if(l.reg==='full'||l.reg==='half')return false;
      if(l.a>0.65)return false;}}
  return d<=1;}
const SEEDCACHE={};
function pickSeed(i){
  if(SEEDCACHE[i])return SEEDCACHE[i];
  let seed='huang-gen-'+i;
  if(mushScore(scanRecipe(seed))>=1.2){
    for(let k=1;k<3000;k++){const s2='huang-gen-'+i+'~'+k,r=scanRecipe(s2);
      if(mushScore(r)===0&&strictOK(r)){seed=s2;break;}}}
  return SEEDCACHE[i]=seed;}

function compose(i){
  CUR=i;
  buildChannels(i);                                  // press collage + temp grade are per-token, pre-effects
  const rng=mulberry32(hashStr(pickSeed(i)));        // geometry seed (автокурация против «каши»)
  const base=Math.floor(rng()*FINISH.length);
  const work=new Uint8ClampedArray(finishData(base));
  let n=1+Math.floor(rng()*5); if(rng()<0.15)n+=2;
  for(let k=0;k<n;k++){
    const isDB=rng()<0.55;
    const reg=pickRegion(rng,0.15);
    const a=(1+Math.floor(rng()*100))/100;
    const layer=isDB?effectLayer(work,Math.floor(rng()*EFFECT.length)):finishData(Math.floor(rng()*FINISH.length));
    blendRegion(work,layer,reg,a);
  }
  return work;
}

function fitMaster(img){MCV=document.createElement('canvas');MCV.width=W;MCV.height=H;const x=MCV.getContext('2d');x.fillStyle='#b9b9bd';x.fillRect(0,0,W,H);const r=Math.max(W/img.width,H/img.height),w=img.width*r,h=img.height*r;x.drawImage(img,(W-w)/2,(H-h)/2,w,h);}

// NVDA temperature: stored here, applied per-compose in buildChannels.
// t=0.5 is a strict identity grade so legacy seed-only renders are unchanged.
function setTemp(t){T=Math.max(0,Math.min(1,+t||0));HEAT=Math.max(0,(T-0.5)*2);BURN=Math.max(0,(0.5-T)*2);}
function setPress(v){PRESS=!!v;}

// ---------------- press collage: headlines / tickers / article columns / charts ----------------
// Ink-only on transparent (multiply onto the master) — no panels, no backgrounds. Baked in BEFORE
// separation, halftone and databend effects, so the press gets screened/glitched like the portrait.
// Numbers are the frozen calibration facts from DECISIONS.md (2026-06-08).
// Пресса читает термометр: t→1 (ATH) — эйфория, t→0 (дно после схлопывания) — послекраховая хроника.
// Выбор пула взвешен HEAT/BURN, так что frozen-снапшот навсегда сохраняет газету своего дня.
const HEADS={
 hot:['NVIDIA HITS RECORD HIGH','RECORD CLOSE, AGAIN','AI EATS THE MARKET','NVDA SMASHES ESTIMATES',
  'WALL ST. BETS IT ALL ON AI','MOST VALUABLE COMPANY ON EARTH','DATACENTERS CAN’T GET ENOUGH',
  'COMPUTE IS DESTINY','ANALYSTS RAISE TARGETS, AGAIN','THE AI GOLD RUSH','THE TRILLION-DOLLAR CHIP',
  'MOORE IS DEAD. LONG LIVE JENSEN','BUY THE DIP','GPU SHORTAGE DEEPENS','INTELLIGENCE, BY THE WATT'],
 mid:['IS THIS A BUBBLE?','CAN ANYTHING STOP NVIDIA?','HOW LONG CAN IT LAST?','CHIPS ARE THE NEW OIL',
  'THE PICKS AND SHOVELS OF AI','NO ONE RINGS A BELL AT THE TOP','THE $208 QUESTION','SELL NOW?',
  'POWER GRIDS ARE THE NEW LIMIT','GRAVITY IS PATIENT','THE LAST SCARCE THING','EVERY FORECAST WAS WRONG'],
 cold:['THE BUBBLE POPS','AFTER THE GOLD RUSH','WHO KNEW?','MARGIN CALL','THE MUSIC STOPS',
  '$3 TRILLION ERASED','NOBODY RANG THE BELL','SELLOFF DEEPENS','THE GREAT UNWIND','CAPEX WINTER',
  'GPUs FOR SALE, NEVER RACKED','IT WAS OBVIOUS, AFTERWARD','THE HANGOVER','WHERE DID THE MONEY GO?']};
const TICKS={
 hot:['NVDA 208.64 ▲ +1.42 (+0.69%)','OPT FLOW ▲ CALLS 71% · IV 48.3 · MAX PAIN 195',
  'REV +94% YOY · DATA CTR +112% · GM 74.6%','NVDA · MKT CAP $5.1T · P/E 73.4',
  'SOX ▲1.2% · QQQ ▲0.4% · 10Y 4.21% · VIX 13.8','OPEN 206.10 · HIGH 209.88 · LOW 204.95 · CLOSE 208.64'],
 mid:['NASDAQ: NVDA · 52W 140.85–236.54','ATH 235.47 · −11.4% OFF HIGH','VOL 312,441,872 · BETA 1.7',
  'FWD P/E 41.2 · PEG 1.1 · EV/EBITDA 58.7','SHORT INT 0.9% · DAYS TO COVER 0.8','AI ▲▲ SEMI ▲ DRAM ▲ PWR ▲'],
 cold:['NVDA 96.20 ▼ −12.41 (−11.4%)','TRADING HALTED · LULD PAUSE 09:47','−59% OFF HIGH · 52W LOW 94.18',
  'OPT FLOW ▼ PUTS 83% · IV 112.6 · MAX PAIN 80','SOX ▼8.8% · QQQ ▼5.1% · VIX 61.2 · 10Y 3.02%',
  'MARGIN DEBT UNWIND · FORCED LIQUIDATIONS','CAPEX CUTS · ORDERS CANCELLED · INVENTORY GLUT']};
const STAMPS={
 hot:['+69%','$5T','×40','+3,100%','208.64','235.47','74.6%','▲'],
 mid:['P/E 73','Q4','140.85','−11%','52W','?'],
 cold:['−59%','▼','96.20','SOLD','−$3T','HALT','PANIC']};
const QUOTES={
 hot:['“demand is infinite”','“we see no signs of slowdown”','“this time is different”',
  '“the safest trade on earth”','“own the future or be priced out of it”'],
 mid:['“irrational exuberance”','“markets can stay irrational longer than you can stay solvent”',
  '“no one rings a bell at the top”','“trees do not grow to the sky”'],
 cold:['“no one could have seen this coming”','“it was obvious in hindsight”',
  '“we are cooperating with regulators”','“i sold everything in march”','“the fundamentals never mattered”']};
const BYLINES=['— A FUND MANAGER','— THE STREET','— AN ANONYMOUS TRADER','— EVERYONE, EVENTUALLY','— OFFICIAL STATEMENT'];
const PAGEIDX={
 hot:'MARKETS B1 · TECH C3 · OPINION A19 · LUXURY GOODS D4',
 mid:'MARKETS B1 · TECH C3 · OPINION A19 · OBITUARIES D7',
 cold:'MARKETS B1 · LAYOFFS C1 · BANKRUPTCIES D2 · OBITUARIES D7'};
const CORPUS={
 hot:'There has never been a better quarter and the next one will be better still. Order books stretch past the '
  +'horizon and the only constraint left is electricity. Sovereign funds queue for allocation like teenagers for '
  +'sneakers. The old economy moves atoms; the new one moves gradients. Skeptics have been wrong for three thousand '
  +'points and counting. Demand is infinite where intelligence is the product and the product improves itself. '
  +'Own the future or be priced out of it, the desks say, and the desks have been right all year.',
 mid:'The market has decided that intelligence itself is the commodity and one company sells the only shovels '
  +'in this gold rush. Demand for accelerated computing has outrun every forecast and every fab on earth. Analysts '
  +'who called the top a year ago now model power grids instead of price targets. Capital expenditure is the new faith '
  +'and the data center is its cathedral. Every bubble is obvious afterward and invisible from inside. The chart only '
  +'goes up until the morning it does not and nobody rings a bell at the top. Margins like these have never survived '
  +'history but history has never trained a trillion parameters either.',
 cold:'The bell nobody rang turned out to be a margin call. Data centers stand half wired, humming to no one, their '
  +'power contracts worth more than their tenants. The same analysts who modeled gigawatts now model liquidation '
  +'waterfalls. Money leaves quietly at first and then all at once. At the bottom every chart is a tombstone and '
  +'every earnings call an inquest. The chips still work; the story stopped. Hindsight arrives with the receivership '
  +'notice, punctual as ever, and the only thing still scarce is a bid.'};
const BUBBLES=[['TULIP MANIA','1637'],['SOUTH SEA','1720'],['RAILWAYS','1846'],['RADIO & AUTOS','1929'],
 ['NIFTY FIFTY','1972'],['DOT-COM','2000'],['HOUSING','2008'],['EVERYTHING','2021']];
const SECT=[['AMD',140],['TSM',190],['AVGO',1200],['MSFT',510],['INTC',20],['SMCI',45],['ARM',95],['MU',130]];
let BLEED=false;                 // bleed-through: зеркальная бледная «обратная сторона листа»
const INK=a=>'rgba(16,13,17,'+(BLEED?a*0.13:a)+')', RED=a=>'rgba(186,24,38,'+(BLEED?a*0.13:a)+')';

// ---- серия: вся специфика (тикер, band, контент-пулы) — конфиг; дефолт = huang/NVDA ----
const DEF={name:'Jensen Huang',ticker:'NVDA',low:140.85,high:236.54,ath:'235.47',copy:'$5T A COPY',
 bubbleRow:['ARTIFICIAL INTELLIGENCE','20__','2026'],
 heads:HEADS,ticks:TICKS,stamps:STAMPS,quotes:QUOTES,pageidx:PAGEIDX,corpus:CORPUS,sect:SECT,
 earn:[['REV',58,8,'B'],['DATA CTR',46,7,'B'],['GAMING',2.8,1.2,'B'],['AUTO',0.5,0.4,'B'],
       ['GM',73,3,'%'],['OP MARGIN',60,5,'%'],['EPS',1.2,0.5,''],['FCF',24,8,'B']]};
let CFG=DEF;
function setSeries(c){CFG=c?Object.assign({},DEF,c):DEF;}
function setCount(c){COUNT=Math.max(1,c|0);}
const fmtNum=v=>v>=1000?Math.round(v).toLocaleString('en-US'):v.toFixed(1);

function pressLayer(i){
  if(!PCV){PCV=document.createElement('canvas');PCV.width=W;PCV.height=H;PCTX=PCV.getContext('2d');
           KCV=document.createElement('canvas');KCV.width=W;KCV.height=H;KCTX=KCV.getContext('2d');}
  const x=PCTX,S=SCALE,rng=mulberry32(hashStr('huang-press-'+i));
  x.clearRect(0,0,W,H);KCTX.clearRect(0,0,W,H);let drawn=0;
  const CW=Math.PI/2;                                       // "повернуть на 90° вправо" — текст читается сверху вниз
  const KO='rgba(247,244,237,0.96)';                        // выворотка: буквы бумагой, без плашек (слой KCV)
  const placed=[];                                          // боксы заголовков/штампов — мишени для красных пометок
  const band=CFG.low+T*(CFG.high-CFG.low);                  // цена, имплицированная температурой (замороженный band)
  const pick=o=>{const r=rng(),p=r<HEAT?o.hot:r<HEAT+BURN?o.cold:o.mid;return p[(rng()*p.length)|0];};
  const pickS=o=>{const r=rng();return r<HEAT?o.hot:r<HEAT+BURN?o.cold:o.mid;};
  function headline(){const txt=pick(CFG.heads),serif=rng()<0.4,fs=(13+rng()*15)*S,vert=rng()<0.22,
    ko=!BLEED&&rng()<0.25,g=ko?KCTX:x,px=vert?(0.08+rng()*0.84)*W:W/2,
    py=vert?H/2:(rng()<0.5?(0.07+rng()*0.18)*H:(0.74+rng()*0.19)*H);
    g.save();g.translate(px,py);g.rotate(vert?CW+(rng()*6-3)*Math.PI/180:(rng()*8-4)*Math.PI/180);
    g.font='900 '+fs+'px '+(serif?'Georgia,"Times New Roman",serif':'"Helvetica Neue",Helvetica,Arial,sans-serif');
    g.textAlign='center';g.textBaseline='middle';
    const lim=(vert?H:W)*0.94;let w=g.measureText(txt).width;if(w>lim){g.scale(lim/w,1);w=lim;}
    g.fillStyle=ko?KO:INK(0.92);g.fillText(txt,0,0);g.restore();
    if(!BLEED)placed.push(vert?{x:px-fs*0.7,y:py-w/2,w:fs*1.4,h:w}:{x:px-w/2,y:py-fs*0.7,w:w,h:fs*1.4});
    drawn++;}
  function sectorLine(){let s=CFG.ticker+' '+band.toFixed(2)+(HEAT>=BURN?'▲':'▼');  // лента сектора, знак по термометру
    for(const e of CFG.sect){const up=rng()<0.5+(HEAT-BURN)*0.45;
      s+='   '+e[0]+' '+(e[1]*(1+(rng()-0.5)*0.08+(HEAT-BURN)*0.1)).toFixed(2)+(up?'▲':'▼');}
    return s;}
  function ticker(){const txt=rng()<0.3?sectorLine():pick(CFG.ticks),fs=(6.5+rng()*4.5)*S,rep=(txt+'   ').repeat(8),m=rng();
    x.save();x.font='600 '+fs+'px ui-monospace,Menlo,Consolas,monospace';x.fillStyle=rng()<0.3?RED(0.9):INK(0.85);
    if(m<0.25){x.translate(rng()<0.5?fs*0.4+rng()*W*0.35:W-fs*1.1-rng()*W*0.35,0);x.rotate(CW);x.fillText(rep,-rng()*H*0.3,0);}      // CW: сверху вниз
    else if(m<0.5){x.translate(rng()<0.5?fs*1.1:W-fs*0.3,H);x.rotate(-CW);x.fillText(rep,-rng()*H*0.4,0);}                          // CCW: снизу вверх
    else x.fillText(rep,-rng()*W,(0.04+rng()*0.92)*H);
    x.restore();drawn++;}
  function column(){const vert=rng()<0.2,ext=vert?H:W,cw=(0.20+rng()*0.14)*ext,
    fs=4.2*S,lh=fs*1.32,lines=((0.22+rng()*0.40)*(vert?W:H)/lh)|0,words=pickS(CFG.corpus).split(' ');
    x.save();
    if(vert){x.translate((0.25+rng()*0.65)*W,(0.02+rng()*0.15)*H);x.rotate(CW);}
    else x.translate(rng()<0.5?(0.03+rng()*0.07)*W:W-cw-(0.03+rng()*0.07)*W,(0.06+rng()*0.30)*H);
    x.font=fs+'px Georgia,serif';x.fillStyle=INK(0.8);x.textAlign='left';
    let wi=(rng()*words.length)|0;
    for(let l=0;l<lines;l++){let line='';
      for(;;){const nx=line?line+' '+words[wi%words.length]:words[wi%words.length];
        if(x.measureText(nx).width>cw&&line)break;line=nx;wi++;}
      x.fillText(line,0,l*lh);}
    x.restore();drawn++;}
  function stamp(){const txt=pick(CFG.stamps),fs=(24+rng()*30)*S,ko=!BLEED&&rng()<0.25,g=ko?KCTX:x,
    px=(0.2+rng()*0.6)*W,py=(0.2+rng()*0.6)*H;
    g.save();g.translate(px,py);
    g.rotate(rng()<0.2?CW:(rng()*30-15)*Math.PI/180);
    g.font='900 '+fs+'px "Helvetica Neue",Helvetica,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=ko?KO:(rng()<0.35?RED(0.85):INK(0.85));
    let w=g.measureText(txt).width;if(w>W*0.9){g.scale(W*0.9/w,1);w=W*0.9;}
    g.fillText(txt,0,0);g.restore();
    if(!BLEED)placed.push({x:px-w/2,y:py-fs*0.6,w:w,h:fs*1.2});drawn++;}
  function datatable(){ // столбик котировок или earnings-строки, моно, без рамок
    const fs=(4.4+rng()*2.2)*S,lh=fs*1.45,rows=6+((rng()*10)|0),earn=rng()<0.4;
    x.save();x.translate((0.05+rng()*0.62)*W,(0.05+rng()*0.65)*H);
    if(rng()<0.2)x.rotate(CW);
    x.font='600 '+fs+'px ui-monospace,Menlo,Consolas,monospace';x.textAlign='left';
    if(earn){
      const er=CFG.earn.map(e=>[e[0],e[1]+rng()*e[2],e[3]]);
      for(let r2=0;r2<er.length;r2++){const e=er[r2];
        x.fillStyle=INK(0.85);x.fillText(e[0],0,r2*lh);
        x.fillText(fmtNum(e[1])+e[2],fs*7.2,r2*lh);}
    }else{
      const span=CFG.high-CFG.low;
      let pr=band+(rng()-0.5)*span*0.3;const bias=0.45+BURN*0.3-HEAT*0.12;   // жар — зелёные дни, выгорание — красные
      for(let r2=0;r2<rows;r2++){
        const chg=(rng()-bias)*(4+BURN*4);pr=Math.max(CFG.low*0.45,Math.min(CFG.high*1.05,pr+(rng()-bias)*span*0.06));
        x.fillStyle=chg<0?(rng()<0.6?RED(0.85):INK(0.85)):INK(0.85);
        x.fillText('2026-0'+(1+((rng()*6)|0))+'-'+String(1+((rng()*28)|0)).padStart(2,'0')
          +'  '+pr.toFixed(2)+'  '+(chg>=0?'+':'')+chg.toFixed(2)+'%',0,r2*lh);}
    }
    x.restore();drawn++;}
  function chart(){ // bubble arc / candles, strokes only — axis numbers from the frozen band
    const cw=(0.45+rng()*0.45)*W,chh=(0.18+rng()*0.22)*H,cx0=(0.06+rng()*0.4)*W*((W-cw)/W),cy0=(0.08+rng()*0.6)*H;
    x.save();x.translate(Math.min(cx0,W-cw-2*S),cy0);
    const candle=rng()<0.4,n=candle?18+((rng()*14)|0):60+((rng()*60)|0),
          peak=0.25+T*0.62+rng()*0.1,slope=0.35+BURN*1.5+rng()*0.3,pts=[];  // жар: пик у правого края; выгорание: пик давно, обвал к плинтусу
    for(let k=0;k<n;k++){const u=k/(n-1),
      tr=u<peak?Math.pow(u/peak,2.1):Math.max(0,1-(u-peak)/(1-peak)*slope);
      pts.push(Math.max(0.02,Math.min(0.98,tr*0.8+0.12+(rng()-0.5)*0.07)));}
    x.lineWidth=0.5*S;x.strokeStyle=INK(0.3);                       // faint gridlines + axis values
    x.font='600 '+3.6*S+'px ui-monospace,Menlo,monospace';x.textAlign='right';
    for(let g=0;g<=4;g++){const yy=g/4*chh;
      x.beginPath();x.moveTo(0,yy);x.lineTo(cw,yy);x.stroke();
      x.fillStyle=INK(0.8);x.fillText((CFG.high-(CFG.high-CFG.low)*g/4).toFixed(0),-2*S,yy+1.3*S);}
    if(candle){const bw=cw/n*0.62;
      for(let k=0;k<n;k++){const o=k?pts[k-1]:pts[0],cl=pts[k],up=cl>=o,xx=k*(cw/n)+bw/2,
        hi=Math.min(0.99,Math.max(o,cl)+rng()*0.03),lo=Math.max(0.01,Math.min(o,cl)-rng()*0.03);
        x.strokeStyle=x.fillStyle=up?INK(0.85):RED(0.85);x.lineWidth=0.9*S;
        x.beginPath();x.moveTo(xx,(1-hi)*chh);x.lineTo(xx,(1-lo)*chh);x.stroke();
        x.fillRect(xx-bw/2,(1-Math.max(o,cl))*chh,bw,Math.max(1,Math.abs(cl-o)*chh));}}
    else{x.strokeStyle=INK(0.9);x.lineWidth=1.4*S;x.beginPath();
      pts.forEach((p,k)=>{const px=k/(n-1)*cw,py=(1-p)*chh;k?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();}
    const mY=(1-Math.max.apply(null,pts))*chh;                      // dashed ATH marker
    x.setLineDash([5*S,3.5*S]);x.strokeStyle=INK(0.7);x.lineWidth=0.7*S;
    x.beginPath();x.moveTo(0,mY);x.lineTo(cw,mY);x.stroke();x.setLineDash([]);
    x.fillStyle=INK(0.85);x.textAlign='left';x.fillText('ATH '+CFG.ath,2*S,mY-1.5*S);
    const lx=cw,ly=(1-pts[n-1])*chh;                                // последний клоуз = цена по термометру
    x.beginPath();x.arc(lx,ly,1.8*S,0,7);x.fill();
    x.fillText(band.toFixed(2),lx+2.5*S,ly+1.2*S);
    x.restore();drawn++;}
  function pullQuote(){const txt=pick(QUOTES),attr=rng()<0.5?BYLINES[(rng()*BYLINES.length)|0]:null,
    fs=(8+rng()*6)*S,vert=rng()<0.15,ko=!BLEED&&rng()<0.2,g=ko?KCTX:x;
    g.save();g.translate((0.08+rng()*0.55)*W,(0.1+rng()*0.72)*H);
    g.rotate(vert?CW:(rng()*4-2)*Math.PI/180);
    g.font='italic 700 '+fs+'px Georgia,"Times New Roman",serif';g.textAlign='left';
    const lim=(vert?H:W)*0.72,w=g.measureText(txt).width;if(w>lim)g.scale(lim/w,1);
    g.fillStyle=ko?KO:INK(0.88);g.fillText(txt,0,0);
    if(attr){g.font='700 '+fs*0.45+'px "Helvetica Neue",Arial,sans-serif';g.fillText(attr,fs*0.6,fs*1.05);}
    g.restore();drawn++;}
  function masthead(){const fs=4.8*S,y2=rng()<0.75?(0.03+rng()*0.03)*H:(0.96+rng()*0.015)*H;  // выходные данные: лист знает свой номер
    x.save();x.font='700 '+fs+'px Georgia,"Times New Roman",serif';x.textAlign='center';x.fillStyle=INK(0.85);
    x.fillText('No. '+(i+1)+'/'+COUNT+' · VOL. XCIX · JUNE 2026 · '+CFG.copy,W/2,y2);
    x.strokeStyle=INK(0.7);x.lineWidth=0.5*S;
    x.beginPath();x.moveTo(W*0.07,y2+fs*0.7);x.lineTo(W*0.93,y2+fs*0.7);x.stroke();
    x.beginPath();x.moveTo(W*0.07,y2+fs*0.7+2*S);x.lineTo(W*0.93,y2+fs*0.7+2*S);x.stroke();
    x.restore();drawn++;}
  function pageIndex(){const fs=3.9*S,y2=rng()<0.5?(0.015+rng()*0.02)*H+fs:(0.975-rng()*0.015)*H;
    x.save();x.font='700 '+fs+'px "Helvetica Neue",Arial,sans-serif';x.textAlign='center';
    x.fillStyle=INK(0.8);x.fillText(pickS(PAGEIDX),W/2,y2);x.restore();drawn++;}
  function bubbleTimeline(){const fs=(4.6+rng()*1.6)*S,lh=fs*1.6,colw=fs*15,vert=rng()<0.15;
    x.save();x.translate((0.06+rng()*0.5)*W,(0.08+rng()*0.5)*H);if(vert)x.rotate(CW);
    x.font='700 '+fs*0.92+'px "Helvetica Neue",Arial,sans-serif';x.fillStyle=INK(0.85);x.textAlign='left';
    x.fillText('A BRIEF HISTORY OF CERTAINTY',0,0);
    x.font=fs+'px Georgia,"Times New Roman",serif';
    BUBBLES.forEach((b,k)=>{const y2=(k+1.4)*lh;x.textAlign='left';x.fillText(b[0],0,y2);
      x.textAlign='right';x.fillText(b[1],colw,y2);});
    const y2=(BUBBLES.length+1.4)*lh,popped=BURN>0.3;                  // после схлопывания год известен
    x.fillStyle=popped?RED(0.9):INK(0.85);
    x.textAlign='left';x.fillText(CFG.bubbleRow[0],0,y2);
    x.textAlign='right';x.fillText(popped?CFG.bubbleRow[2]:CFG.bubbleRow[1],colw,y2);
    x.restore();drawn++;}
  function orderBook(){const fs=(4.2+rng()*1.6)*S,lh=fs*1.5,rows=5+((rng()*4)|0),colw=fs*9;
    x.save();x.translate((0.08+rng()*0.55)*W,(0.08+rng()*0.6)*H);if(rng()<0.15)x.rotate(CW);
    x.font='600 '+fs+'px ui-monospace,Menlo,Consolas,monospace';x.textAlign='left';
    x.fillStyle=INK(0.85);x.fillText('BID',0,0);x.fillText('ASK',colw,0);
    const tick2=(CFG.high-CFG.low)/380;                  // шаг стакана масштабируется к band
    for(let r2=1;r2<=rows;r2++){
      x.fillStyle=INK(0.8);
      x.fillText((band-r2*tick2*(0.2+rng())).toFixed(2)+' ×'+((50+rng()*900)|0),0,r2*lh);
      x.fillStyle=rng()<0.5?RED(0.8):INK(0.8);
      x.fillText((band+r2*tick2*(0.2+rng())).toFixed(2)+' ×'+((50+rng()*900)|0),colw,r2*lh);}
    x.restore();drawn++;}
  function cropMarks(){const m=0.035*W,len=0.05*W;                     // пробный оттиск из цеха: кресты приводки
    x.save();x.strokeStyle=INK(0.65);x.lineWidth=0.6*S;
    for(const[cx2,cy2,sx,sy]of[[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]]){
      x.beginPath();x.moveTo(cx2+sx*len*0.3,cy2);x.lineTo(cx2+sx*len,cy2);
      x.moveTo(cx2,cy2+sy*len*0.3);x.lineTo(cx2,cy2+sy*len);x.stroke();}
    if(rng()<0.7){const rx=rng()<0.5?m*1.6:W-m*1.6,ry=rng()<0.5?m*1.6:H-m*1.6,r=0.014*W;
      x.beginPath();x.arc(rx,ry,r,0,7);x.moveTo(rx-r*1.5,ry);x.lineTo(rx+r*1.5,ry);
      x.moveTo(rx,ry-r*1.5);x.lineTo(rx,ry+r*1.5);x.stroke();}
    x.restore();drawn++;}
  function cmykBar(){const sz=0.024*W,cols=[[0,158,200],[222,0,140],[245,206,0],[18,15,18]],
    vert=rng()<0.5,n=4+((rng()*5)|0),
    px=vert?(rng()<0.5?0.018*W:W-0.018*W-sz):(0.08+rng()*0.5)*W,
    py=vert?(0.1+rng()*0.5)*H:(rng()<0.5?0.012*H:H-0.012*H-sz);
    x.save();x.globalAlpha=BLEED?0.1:0.85;
    for(let k=0;k<n;k++){const c=cols[k%4];x.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';
      x.fillRect(px+(vert?0:k*(sz+2*S)),py+(vert?k*(sz+2*S):0),sz,sz);}
    x.restore();drawn++;}
  // большой шелкографский логотип серии — уорхоловский оверпринт с CMYK-сдвигом плит
  function ethDiamond(g,cx,cy,hh,col,a){const w2=hh*0.60,
    T=[cx,cy-hh/2],ML=[cx-w2/2,cy-hh*0.06],MR=[cx+w2/2,cy-hh*0.06],C=[cx,cy+hh*0.10],B=[cx,cy+hh/2];
    const face=(p,al)=>{g.globalAlpha=a*al;g.fillStyle=col;g.beginPath();
      g.moveTo(p[0][0],p[0][1]);for(let k=1;k<p.length;k++)g.lineTo(p[k][0],p[k][1]);g.closePath();g.fill();};
    face([T,MR,C],0.50);face([T,C,ML],0.85);          // upper gem: right light, left dark
    face([ML,C,B],0.85);face([C,MR,B],0.50);          // lower gem
    g.globalAlpha=1;}
  function drawGlyph(g,L,cx,cy,hh,col,a){
    if(L.kind==='eth'){ethDiamond(g,cx,cy,hh,col,a);return;}
    g.save();g.translate(cx,cy);g.font='900 '+hh+'px "Helvetica Neue",Arial,sans-serif';
    g.textAlign='center';g.textBaseline='middle';g.globalAlpha=a;g.fillStyle=col;
    g.fillText(L.text,0,0);g.restore();g.globalAlpha=1;}
  function logoPlate(){const L=CFG.logo;if(!L)return;
    const hh=(0.18+rng()*0.24)*H,cx=(0.22+rng()*0.56)*W,cy=(0.2+rng()*0.6)*H;
    if(!BLEED&&rng()<0.45){                                 // выворотка: чистый логотип бумагой сквозь краску
      drawGlyph(KCTX,L,cx,cy,hh,'rgba(247,244,237,0.97)',1);drawn++;return;}
    const reg=(3+rng()*9)*S,
      plates=[['rgba(0,150,195,1)',-reg,reg*0.4],['rgba(214,0,134,1)',reg,-reg*0.3],[INK(1),0,0]];
    x.globalCompositeOperation='multiply';
    for(const[col,dx,dy]of plates)drawGlyph(x,L,cx+dx,cy+dy,hh,col,0.92);
    x.globalCompositeOperation='destination-out';          // износ краски — крапины внутри логотипа
    for(let k=0,nn=hh*0.4;k<nn;k++){x.beginPath();
      x.arc(cx+(rng()-0.5)*hh*0.55,cy+(rng()-0.5)*hh,0.5+rng()*2.2,0,7);x.fill();}
    x.globalCompositeOperation='source-over';drawn++;}
  function logoRow(){const L=CFG.logo;if(!L)return;            // ряд мелких логотипов — сериальность
    const hh=(0.05+rng()*0.05)*H,n=4+((rng()*7)|0),y2=(0.1+rng()*0.8)*H,step=W/(n+1);
    for(let k=1;k<=n;k++){const col=rng()<0.3?RED(0.8):INK(0.85);
      drawGlyph(x,L,k*step,y2,hh,col.includes('186')?'rgb(186,24,38)':'rgb(16,13,17)',0.85);}
    drawn++;}
  function proofStamp(){const txts=['PROOF','SPECIMEN','NOT FOR RESALE','FILE COPY','VOID'],
    txt=txts[(rng()*txts.length)|0],fs=(20+rng()*22)*S;
    x.save();x.translate((0.3+rng()*0.4)*W,(0.3+rng()*0.4)*H);
    x.rotate(rng()<0.25?CW:(rng()*40-20)*Math.PI/180);
    x.font='900 '+fs+'px "Helvetica Neue",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.lineWidth=1.3*S;x.strokeStyle=rng()<0.6?RED(0.55):INK(0.5);
    const w=x.measureText(txt).width;if(w>W*0.85)x.scale(W*0.85/w,1);
    x.strokeText(txt,0,0);x.restore();drawn++;}
  function redMarks(){if(!placed.length)return;                        // рука редактора: обвести, подчеркнуть, стрелка
    const r=placed[(rng()*placed.length)|0],kind=rng(),cx2=r.x+r.w/2,cy2=r.y+r.h/2;
    x.save();x.strokeStyle=RED(0.75);x.lineWidth=2.0*S;x.lineCap='round';
    if(kind<0.45){const rx=r.w*0.62+5*S,ry=r.h*0.85+5*S,a0=rng()*7;x.beginPath();
      for(let a=0;a<=7;a+=0.22){const jr=1+(h2(a*3.7+i,a0)-0.5)*0.09,
        px2=cx2+Math.cos(a+a0)*rx*jr,py2=cy2+Math.sin(a+a0)*ry*jr;
        a?x.lineTo(px2,py2):x.moveTo(px2,py2);}x.stroke();}
    else if(kind<0.75){const y2=r.y+r.h+3*S;x.beginPath();
      for(let px2=r.x;px2<=r.x+r.w;px2+=8*S){const py2=y2+(h2(px2*0.3,y2)-0.5)*4*S;
        px2===r.x?x.moveTo(px2,py2):x.lineTo(px2,py2);}x.stroke();
      if(rng()<0.4){x.beginPath();x.moveTo(r.x+2*S,y2+5*S);x.lineTo(r.x+r.w-2*S,y2+5.5*S);x.stroke();}}
    else{const sx2=cx2+(rng()-0.5)*W*0.5,sy2=cy2+(rng()<0.5?-1:1)*(0.15+rng()*0.25)*H,
      ex=cx2+(rng()-0.5)*r.w*0.4,ey=cy2+(rng()-0.5)*r.h*0.6,ang=Math.atan2(ey-sy2,ex-sx2);
      x.beginPath();x.moveTo(sx2,sy2);x.quadraticCurveTo((sx2+ex)/2+(rng()-0.5)*40*S,(sy2+ey)/2,ex,ey);x.stroke();
      x.beginPath();x.moveTo(ex,ey);x.lineTo(ex-Math.cos(ang-0.45)*8*S,ey-Math.sin(ang-0.45)*8*S);
      x.moveTo(ex,ey);x.lineTo(ex-Math.cos(ang+0.45)*8*S,ey-Math.sin(ang+0.45)*8*S);x.stroke();}
    x.restore();}

  if(rng()<0.6){BLEED=true;x.save();x.translate(W,0);x.scale(-1,1);    // обратная сторона листа — под основной краской
    headline();if(rng()<0.5)ticker();if(rng()<0.4)column();
    x.restore();BLEED=false;}
  if(rng()<0.5)masthead();
  headline();if(rng()<0.5)headline();if(rng()<0.2)headline();
  ticker();if(rng()<0.5)ticker();if(rng()<0.25)ticker();
  if(rng()<0.7)column();if(rng()<0.35)column();
  if(rng()<0.65)chart();if(rng()<0.25)chart();
  if(rng()<0.5)stamp();if(rng()<0.2)stamp();
  if(rng()<0.6)datatable();if(rng()<0.25)datatable();
  if(rng()<0.45)pullQuote();if(rng()<0.15)pullQuote();
  if(rng()<0.3)bubbleTimeline();
  if(rng()<0.35)orderBook();
  if(rng()<0.35)pageIndex();
  if(rng()<0.5)cropMarks();
  if(rng()<0.35)cmykBar();
  if(rng()<0.25)proofStamp();
  const lb=CFG.logoBias||0;                                  // серии с логотипом (vitalik/ETH) — больше графики
  if(rng()<lb)logoPlate();if(rng()<lb*0.4)logoPlate();
  if(rng()<lb*0.7)logoRow();
  if(rng()<0.55)redMarks();if(rng()<0.2)redMarks();
  if(!drawn)headline();
  return PCV;
}

// master + press collage -> temperature grade -> R/G/B/L channels for this token
function buildChannels(i){
  if(!CCV){CCV=document.createElement('canvas');CCV.width=W;CCV.height=H;CCTX=CCV.getContext('2d');}
  CCTX.globalCompositeOperation='source-over';CCTX.drawImage(MCV,0,0);
  if(PRESS){CCTX.globalCompositeOperation='multiply';CCTX.drawImage(pressLayer(i),0,0);
    CCTX.globalCompositeOperation='source-over';CCTX.drawImage(KCV,0,0);}   // выворотка: буквы бумагой поверх краски
  const d=CCTX.getImageData(0,0,W,H).data,nn=W*H,
        contrast=1+HEAT*0.85-BURN*0.55,blackFloor=BURN*0.30,sat=1-BURN*0.95+HEAT*0.15,
        blowThresh=0.80-HEAT*0.30,blowAmt=Math.min(1,HEAT*2);
  R=new Uint8ClampedArray(nn);G=new Uint8ClampedArray(nn);B=new Uint8ClampedArray(nn);L=new Uint8ClampedArray(nn);
  for(let i2=0,p=0;i2<nn;i2++,p+=4){
    let r=d[p]/255,g=d[p+1]/255,b=d[p+2]/255;
    const Lm=0.299*r+0.587*g+0.114*b;
    r=Lm+(r-Lm)*sat;g=Lm+(g-Lm)*sat;b=Lm+(b-Lm)*sat;
    r=(r-0.5)*contrast+0.5;g=(g-0.5)*contrast+0.5;b=(b-0.5)*contrast+0.5;
    r=blackFloor+r*(1-blackFloor);g=blackFloor+g*(1-blackFloor);b=blackFloor+b*(1-blackFloor);
    if(blowAmt>0&&Lm>blowThresh){const k=Math.min(1,(Lm-blowThresh)/(1-blowThresh+1e-6))*blowAmt;r+=(1-r)*k;g+=(1-g)*k;b+=(1-b)*k;}
    R[i2]=clamp(r*255);G[i2]=clamp(g*255);B[i2]=clamp(b*255);L[i2]=clamp((0.299*r+0.587*g+0.114*b)*255);
  }
}
function init(w,h){W=w;H=h;SCALE=W/300;rb=W*3;fcv=document.createElement('canvas');fcv.width=W;fcv.height=H;fctx=fcv.getContext('2d');}

window.ENGINE={init,fitMaster,compose,animFrames,setTemp,setPress,setSeries,setCount,get W(){return W;},get H(){return H;},get T(){return T;}};
})();
