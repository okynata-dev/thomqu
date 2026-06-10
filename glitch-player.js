// Shared XCOPY-style glitch player.
// Архитектура слоёв: НИЖНИЙ слой — глитч-анимация на весь кадр; ВЕРХНИЙ — статичная «кожа» листа
// (базовый оттиск) с вырезами: рваные щели/порезы/клочья + прозрачные надписи. Анимация видна только
// сквозь дыры и буквы — наружу не вылезает. Площадь дыр 10–30% (т.е. 70–90% кадра статичны).
// Всё детерминировано per token: seed 'huang-tear-{n}'.
window.GLITCH=(function(){
"use strict";
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const WORDS=['AI','NVDA','208.64','$5T','BUBBLE','SELL?','×40','GPU','73.4','RECORD','PANIC','MOON','TOP?'];

function build(n,cvs,ctx,texs){
  const Wt=cvs[0].width,H=cvs[0].height,NF=cvs.length,S2=Wt/900,
        sr=mulberry32(hashStr('huang-tear-'+n));
  // ---- маска разрывов: разрыв следует самому изображению, а не случайной геометрии ----
  // Уорхол: непропечатка живёт в тональных зонах оттиска, серийность — «бракованная» ячейка сетки.
  // XCOPY: глитч живёт в семантических зонах — цензор-бар, силуэт, целая зона мерцает.
  function bandFromLine(cl,th){const p=new Path2D(),up=[],dn=[];
    for(let k=0;k<cl.length;k++){
      const a=cl[k],b=cl[Math.min(cl.length-1,k+1)];
      let nx=-(b[1]-a[1]),ny=b[0]-a[0];const d=Math.hypot(nx,ny)||1;nx/=d;ny/=d;
      const o=th/2+(sr()*2-1)*th*0.6;
      up.push([a[0]+nx*o,a[1]+ny*o]);dn.push([a[0]-nx*o,a[1]-ny*o]);}
    up.concat(dn.reverse()).forEach((q,k)=>k?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));
    p.closePath();return p;}
  function chartCrack(){const len=Wt*(0.6+sr()*0.35),x0=sr()*(Wt-len),yb=H*(0.25+sr()*0.55),
    amp=H*(0.12+sr()*0.2),peak=0.5+sr()*0.3,m=24+((sr()*20)|0),cl=[];
    for(let k=0;k<=m;k++){const u=k/m,t2=u<peak?Math.pow(u/peak,2):Math.max(0,1-(u-peak)/(1-peak)*1.4);
      cl.push([x0+u*len,yb-amp*t2+(sr()-0.5)*amp*0.12]);}
    return bandFromLine(cl,(2+sr()*6)*S2);}

  const mask=document.createElement('canvas');mask.width=Wt;mask.height=H;
  const mx=mask.getContext('2d');mx.fillStyle='#000';
  const bd=cvs[0].getContext('2d').getImageData(0,0,Wt,H).data;
  const cdf=(()=>{const hst=new Float64Array(256);
    for(let i=0;i<bd.length;i+=4)hst[(0.299*bd[i]+0.587*bd[i+1]+0.114*bd[i+2])|0]++;
    let acc=0;const c2=new Float64Array(256);
    for(let v=0;v<256;v++){acc+=hst[v];c2[v]=acc/(Wt*H);}return c2;})();
  const pctl=p2=>{for(let v=0;v<256;v++)if(cdf[v]>=p2)return v;return 255;};
  const RESTRICT=sr()<0.5;                                 // зону можно ограничить полосой листа — композиция
  function zoneMask(lo,hi){
    const im=new ImageData(Wt,H),d2=im.data;
    for(let i=0,q=3;i<bd.length;i+=4,q+=4){const l=0.299*bd[i]+0.587*bd[i+1]+0.114*bd[i+2];
      if(l>=lo&&l<=hi)d2[q]=255;}
    const mc=document.createElement('canvas');mc.width=Wt;mc.height=H;
    mc.getContext('2d').putImageData(im,0,0);
    if(RESTRICT){const horiz=sr()<0.5,c3=document.createElement('canvas');c3.width=Wt;c3.height=H;
      const g3=c3.getContext('2d'),a0=sr()*0.5,a1=a0+0.35+sr()*0.4;
      g3.fillStyle='#000';
      if(horiz)g3.fillRect(0,a0*H,Wt,(a1-a0)*H);else g3.fillRect(a0*Wt,0,(a1-a0)*Wt,H);
      g3.globalCompositeOperation='source-in';g3.drawImage(mc,0,0);return c3;}
    return mc;}
  const fr0=0.04+sr()*0.10,fr=RESTRICT?Math.min(0.25,fr0*2):fr0;   // целевая доля анимации: 4–14%, тихо
  const MOTIFS=['ink','paper','mid','censor','cell','dots','press'];
  const style=MOTIFS[(sr()*MOTIFS.length)|0];
  if(style==='ink')mx.drawImage(zoneMask(0,pctl(fr)),0,0);                          // живёт тёмная масса краски
  else if(style==='paper')mx.drawImage(zoneMask(pctl(1-fr),255),0,0);               // выгорают света до анимации
  else if(style==='mid')mx.drawImage(zoneMask(pctl(0.5-fr/2),pctl(0.5+fr/2)),0,0);  // дышат полутона
  else if(style==='censor'){                                                        // цензор-бары: глаза, рот
    const bar=(yc,hh)=>{const y0=yc-hh/2,x0=Wt*(0.12+sr()*0.1),x1=Wt*(0.88-sr()*0.1),m2=10+((sr()*8)|0);
      mx.beginPath();mx.moveTo(x0,y0);
      for(let k=0;k<=m2;k++)mx.lineTo(x0+(x1-x0)*k/m2,y0+(sr()-0.5)*hh*0.15);
      for(let k=m2;k>=0;k--)mx.lineTo(x0+(x1-x0)*k/m2,y0+hh+(sr()-0.5)*hh*0.15);
      mx.closePath();mx.fill();};
    bar(H*(0.36+sr()*0.05),H*(0.09+sr()*0.05));
    if(sr()<0.6)bar(H*(0.56+sr()*0.05),H*(0.05+sr()*0.03));
    if(sr()<0.35)bar(H*(0.80+sr()*0.08),H*(0.06+sr()*0.04));}
  else if(style==='cell'){                                                          // «бракованный» повтор серии
    const g2=sr()<0.6?3:4,cells=1+(sr()<0.25?1:0),used=new Set();
    for(let k=0;k<cells;k++){let c3;do{c3=(sr()*g2*g2)|0;}while(used.has(c3));used.add(c3);
      const cx2=c3%g2,cy2=(c3/g2)|0,gap=2*S2;
      mx.fillRect(cx2*Wt/g2+gap,cy2*H/g2+gap,Wt/g2-gap*2,H/g2-gap*2);}}
  else if(style==='dots'){                                                          // живой растр: точки по тону, редкие
    const cell=(20+sr()*16)*S2;
    for(let cy2=cell/2;cy2<H;cy2+=cell)for(let cx2=cell/2;cx2<Wt;cx2+=cell){
      const i=((cy2|0)*Wt+(cx2|0))*4,l=0.299*bd[i]+0.587*bd[i+1]+0.114*bd[i+2],
            rr=cell*0.62*Math.pow(1-l/255,0.8)*(0.40+fr0);
      if(rr>cell*0.18){mx.beginPath();mx.arc(cx2,cy2,rr,0,7);mx.fill();}}}
  // press-мотив и акценты: прозрачные надписи + трещина-график (есть во всех мотивах)
  function holeWord(){const w=WORDS[(sr()*WORDS.length)|0],fs=(26+sr()*50)*S2;
    mx.save();mx.translate(Wt*(0.1+sr()*0.8),H*(0.08+sr()*0.84));
    mx.rotate(sr()<0.2?Math.PI/2:(sr()*2-1)*0.1);
    mx.font='900 '+fs+'px '+(sr()<0.35?'Georgia,"Times New Roman",serif':'"Helvetica Neue",Helvetica,Arial,sans-serif');
    mx.textAlign='center';mx.textBaseline='middle';mx.fillText(w,0,0);mx.restore();}
  if(style==='press'){const nw=1+((sr()*2)|0);for(let k=0;k<nw;k++)holeWord();
    mx.fill(chartCrack());if(sr()<0.35)mx.fill(chartCrack());}
  else{if(sr()<0.35)holeWord();if(sr()<0.2)mx.fill(chartCrack());}

  // верхний статичный слой: оттиск минус маска
  const top=document.createElement('canvas');top.width=Wt;top.height=H;
  const ttx=top.getContext('2d');
  ttx.drawImage(cvs[0],0,0);
  ttx.globalCompositeOperation='destination-out';
  ttx.drawImage(mask,0,0);
  ttx.globalCompositeOperation='source-over';
  // честная доля анимации — по маске
  let on=0;const md=mx.getImageData(0,0,Wt,H).data;
  for(let i=3;i<md.length;i+=16)if(md[i]>40)on++;
  const animFrac=on/(md.length/16);

  // ---- нижний слой: только текст — чернила по бумаге, в палитре самого оттиска ----
  // Сквозь разрывы видны фрагменты типографики: гигантские цифры/слова, тикерные стены,
  // колонки заголовков, таблицы котировок. Монохром, редкий красный акцент. Тихо.
  const tr=mulberry32(hashStr('huang-tex-'+n));
  const TXT={
    big:['AI','NVDA','208.64','$5T','×40','BUBBLE','SELL?','TOP','96.20','73.4','−59%','PANIC'],
    head:['CAN ANYTHING STOP NVIDIA?','NO ONE RINGS A BELL AT THE TOP','THE AI GOLD RUSH',
      'RECORD CLOSE, AGAIN','AFTER THE GOLD RUSH','IS THIS A BUBBLE?','EVERY FORECAST WAS WRONG','MARGIN CALL'],
    tick:['NVDA 208.64 ▲ +1.42 (+0.69%)','52W 140.85–236.54 · ATH 235.47','VOL 312,441,872 · BETA 1.7',
      'OPT FLOW ▲ CALLS 71% · IV 48.3','SOX ▲1.2% · QQQ ▲0.4% · VIX 13.8','P/E 73.4 · MKT CAP $5.1T']};
  const INK2=a=>'rgba(18,14,17,'+a+')';
  function textFrame(){
    const c=document.createElement('canvas');c.width=Wt;c.height=H;const g=c.getContext('2d');
    g.fillStyle='#f2ede1';g.fillRect(0,0,Wt,H);
    g.save();g.translate(Wt/2,H/2);g.rotate((tr()*2-1)*0.03);g.translate(-Wt/2,-H/2);
    const kind=tr();
    g.fillStyle=tr()<0.08?'rgba(170,24,36,0.85)':INK2(0.88);
    if(kind<0.35){                                        // гигантские глифы — в дырах фрагменты букв
      const m2=1+((tr()*2)|0);
      for(let k=0;k<m2;k++){const w=TXT.big[(tr()*TXT.big.length)|0],fs=H*(0.22+tr()*0.3);
        g.save();g.translate(Wt*(0.05+tr()*0.9),H*(0.1+tr()*0.85));
        if(tr()<0.25)g.rotate(Math.PI/2);
        g.font='900 '+fs+'px "Helvetica Neue",Helvetica,Arial,sans-serif';
        g.textAlign='center';g.textBaseline='middle';g.fillText(w,0,0);g.restore();}}
    else if(kind<0.6){                                    // тикерная стена
      const fs=(7+tr()*5)*S2,lh=fs*1.7;
      g.font='600 '+fs+'px ui-monospace,Menlo,monospace';g.textAlign='left';
      for(let y2=lh;y2<H+lh;y2+=lh){const t2=TXT.tick[(tr()*TXT.tick.length)|0];
        g.fillText((t2+'   ').repeat(4),-tr()*Wt*0.5,y2);}}
    else if(kind<0.85){                                   // колонки заголовков — серая фактура текста
      const fs=(8+tr()*6)*S2,lh=fs*1.55;
      g.font='700 '+fs+'px Georgia,"Times New Roman",serif';g.textAlign='left';
      for(let y2=lh;y2<H+lh;y2+=lh)
        g.fillText(TXT.head[(tr()*TXT.head.length)|0]+'  ·  '+TXT.head[(tr()*TXT.head.length)|0],-tr()*Wt*0.3,y2);}
    else{                                                 // таблица чисел
      const fs=(6.5+tr()*4)*S2,lh=fs*1.8,colw=fs*8;
      g.font='600 '+fs+'px ui-monospace,Menlo,monospace';g.textAlign='left';
      let pr=140+tr()*90;
      for(let y2=lh;y2<H+lh;y2+=lh)
        for(let cx2=0;cx2<Wt;cx2+=colw){pr=Math.max(60,Math.min(245,pr+(tr()-0.5)*8));
          g.fillText(pr.toFixed(2),cx2+2*S2,y2);}}
    g.restore();
    g.globalAlpha=0.25;g.drawImage(cvs[0],0,0);g.globalAlpha=1;   // лёгкая связка с оттиском
    return c;}
  const pool=[];
  for(let k=0;k<8;k++)pool.push(textFrame());

  // плейлист нижнего слоя: 60% времени лист цел (в дырах — сама база), редкая дрожь, почти без вспышек
  const SEQ=[];
  for(let k=0;k<36;k++){const calm=sr()<0.6;
    SEQ.push(calm?{f:-1,d:3+((sr()*5)|0),inv:false}
                 :{f:(sr()*pool.length)|0,d:1+((sr()*2)|0),inv:sr()<0.03});}
  let si=(sr()*SEQ.length)|0,hold=0;
  function adv(){if(++hold>=SEQ[si].d){hold=0;si=(si+1)%SEQ.length;}}

  return {
    style,
    staticPct:Math.round(100-animFrac*100),
    step(mult){                                           // mult>1: секвенция листается быстрее экрана
      for(let q=1;q<(mult||1);q++)adv();
      const s=SEQ[si];adv();
      ctx.drawImage(s.f<0?cvs[0]:pool[s.f],0,0);          // f<0 — затишье: лист выглядит целым
      if(s.inv){ctx.globalCompositeOperation='difference';ctx.fillStyle='#fff';
        ctx.fillRect(0,0,Wt,H);ctx.globalCompositeOperation='source-over';}
      ctx.drawImage(top,0,0);                             // статичная рваная кожа сверху, никогда не меняется
    }
  };
}
return {build};
})();
