/* Reused verbatim grafik() from feature/w5-frachter-2d-20261104. See integration report. */
(function(scope){
function grafik(canvas) {
 const g=canvas.getContext('2d'); let W=1,Hh=1,Z=.32,S={t:0},reducedMotion=false;
 const NPC_SPEC={}; let sgShip;
// VE08G-02: decorative Canvas caches only; never serialized or used by simulation.
const SG={seed:0x8e02cafe,tile:1536,layers:null,sprites:new Map(),heading:new Map(),last:0};
const SG_SHAPES={
 rookie:[[16,0],[3,-5],[-10,-10],[-5,-3],[-13,0],[-5,3],[-10,10],[3,5]],
 interceptor:[[20,0],[-12,-12],[-7,-3],[-17,0],[-7,3],[-12,12]],
 cruiser:[[18,0],[11,-8],[0,-9],[-2,-13],[-15,-12],[-17,-6],[-13,0],[-17,6],[-15,12],[-2,13],[0,9],[11,8]],
 prospector:[[15,0],[7,-5],[-1,-5],[1,-12],[-12,-12],[-12,-8],[-4,-8],[-7,-3],[-15,-3],[-15,3],[-7,3],[-4,8],[-12,8],[-12,12],[1,12],[-1,5],[7,5]],
 courier:[[22,0],[2,-4],[-7,-10],[-12,-10],[-9,-3],[-17,-3],[-17,3],[-9,3],[-12,10],[-7,10],[2,4]],
 hauler:[[18,-4],[13,-7],[-10,-7],[-10,-10],[-17,-10],[-17,10],[-10,10],[-10,7],[13,7],[18,4]],
 exhumer:[[16,0],[5,-6],[7,-15],[-14,-15],[-17,-10],[-7,-10],[-7,-5],[-16,-5],[-16,5],[-7,5],[-7,10],[-17,10],[-14,15],[7,15],[5,6]],
 miner:[[14,0],[5,-4],[3,-11],[-11,-11],[-13,-7],[-5,-7],[-8,-2],[-14,0],[-8,2],[-5,7],[-13,7],[-11,11],[3,11],[5,4]],
 trader:[[17,-3],[13,-6],[-9,-6],[-9,-10],[-15,-10],[-15,10],[-9,10],[-9,6],[13,6],[17,3]],
 hunter:[[17,0],[-3,-9],[-14,-8],[-8,-2],[-16,0],[-8,2],[-14,8],[-3,9]],
 pirate:[[19,0],[2,-5],[-6,-13],[-14,-10],[-7,-4],[-17,0],[-7,4],[-14,10],[-6,13],[2,5]]
};
function sgRandom(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function sgStars(seed,layer){const r=sgRandom(seed+layer*991),n=[420,190,76][layer],out=[],centers=[[.2,.27,.15],[.71,.68,.1],[.8,.12,.06]];for(let i=0;i<n;i++){let x,y;if(r()<.73){const c=centers[Math.floor(r()*centers.length)],a=r()*Math.PI*2,d=Math.sqrt(r())*c[2];x=(c[0]+Math.cos(a)*d+1)%1;y=(c[1]+Math.sin(a)*d*.58+1)%1}else{x=r();y=r()}out.push([x*SG.tile,y*SG.tile,.45+r()*[.8,1.15,1.8][layer],.24+r()*.6,r()])}return out}
function sgSkyInit(){if(SG.layers)return;SG.layers=[];for(let l=0;l<3;l++){const c=document.createElement('canvas');c.width=c.height=SG.tile;const h=c.getContext('2d'),stars=sgStars(SG.seed,l);if(l===0){for(const [x,y,r]of[[170,210,215],[590,530,180],[625,92,100]]){for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const a=x+dx*SG.tile,b=y+dy*SG.tile,t=h.createRadialGradient(a,b,0,a,b,r);t.addColorStop(0,'rgba(48,66,89,.12)');t.addColorStop(.45,'rgba(28,39,60,.07)');t.addColorStop(1,'rgba(6,10,20,0)');h.fillStyle=t;h.fillRect(a-r,b-r,r*2,r*2)}}}for(const [x,y,r,a,col]of stars){h.fillStyle=col<.08?`rgba(181,192,215,${a})`:col>.92?`rgba(215,205,187,${a})`:`rgba(196,209,226,${a})`;h.beginPath();h.arc(x,y,r,0,6.2832);h.fill();if(r>1.8){h.globalAlpha=.13;h.fillRect(x-3,y-.5,6,1);h.fillRect(x-.5,y-3,1,6);h.globalAlpha=1}}SG.layers.push({canvas:c,pattern:g.createPattern(c,'repeat'),stars})}}
function sgSky(cx,cy,m){if(S.t<SG.last)SG.heading.clear();SG.last=S.t;sgSkyInit();for(let l=0;l<3;l++){const a=SG.layers[l],q=[.025,.065,.14][l],x=-cx*Z*q%SG.tile,y=-cy*Z*q%SG.tile;g.save();g.translate(x,y);g.fillStyle=a.pattern;g.fillRect(-x,-y,W,Hh);g.restore()}if(m.wp){const a=SG.layers[2],x=-cx*Z*.14%SG.tile,y=-cy*Z*.14%SG.tile;g.strokeStyle='rgba(190,208,231,.27)';g.lineWidth=1;g.beginPath();for(let tx=Math.floor(-x/SG.tile);tx<=Math.floor((W-x)/SG.tile);tx++)for(let ty=Math.floor(-y/SG.tile);ty<=Math.floor((Hh-y)/SG.tile);ty++)for(const s of a.stars){const px=s[0]+x+tx*SG.tile,py=s[1]+y+ty*SG.tile;if(px<0||px>W||py<0||py>Hh)continue;g.moveTo(px,py);g.lineTo(px-Math.cos(m.a)*45,py-Math.sin(m.a)*45)}g.stroke()}}
function sgPolygon(h,p){h.beginPath();h.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)h.lineTo(p[i][0],p[i][1]);h.closePath()}
function sgSprite(kind,tint){const key=kind+tint;if(SG.sprites.has(key))return SG.sprites.get(key);const c=document.createElement('canvas');c.width=c.height=128;const h=c.getContext('2d');h.translate(64,64);h.scale(2,2);const p=SG_SHAPES[kind]||SG_SHAPES.rookie;h.translate(0,1.3);sgPolygon(h,p);h.fillStyle='#02060c';h.fill();h.translate(0,-1.3);sgPolygon(h,p);const v=h.createLinearGradient(0,-15,0,15);v.addColorStop(0,'#9aafbd');v.addColorStop(.4,'#4b6278');v.addColorStop(.55,'#34475a');v.addColorStop(1,'#172535');h.fillStyle=v;h.fill();h.strokeStyle='#7b92a8';h.lineWidth=.65;h.stroke();
 // Elevated spine, armour seams and small cockpit; all independent original geometry.
 sgPolygon(h,[[p[0][0]-2,0],[4,-2.7],[-12,-2.7],[-9,0],[-12,2.7],[4,2.7]]);h.fillStyle='#182a3b';h.fill();h.strokeStyle='#b4c2cb';h.lineWidth=.5;h.beginPath();h.moveTo(-9,-2);h.lineTo(5,-2);h.lineTo(p[0][0]-3,0);h.stroke();h.fillStyle=tint;h.fillRect(5,-1.5,3,3);h.fillRect(-7,-5,4,1);h.fillRect(-7,4,4,1);
 if(['hauler','trader'].includes(kind)){for(let x=-8;x<9;x+=5){h.fillStyle='#536a7c';h.fillRect(x,-5,4,3);h.fillStyle='#26394d';h.fillRect(x,2,4,3);h.strokeStyle='#8e9eaa';h.strokeRect(x,-5,4,3)}}else if(['prospector','exhumer','miner'].includes(kind)){h.fillStyle='#b49c69';h.fillRect(-10,-10,7,2);h.fillRect(-10,8,7,2);h.fillStyle='#17222c';h.fillRect(-7,-10,1,2);h.fillRect(-7,8,1,2)}else if(['cruiser','hunter','pirate'].includes(kind)){h.fillStyle='#a5adb2';h.fillRect(0,-7,6,1.2);h.fillRect(0,5.8,6,1.2)}
 h.fillStyle='#0b141e';h.fillRect(-14,-2,3,4);h.fillStyle=tint;h.globalAlpha=.8;h.fillRect(-14,-1.3,1,2.6);h.globalAlpha=1;if(tint==='#fff'){h.globalCompositeOperation='source-atop';h.fillStyle='rgba(255,255,255,.8)';h.fillRect(-32,-32,64,64);h.globalCompositeOperation='source-over'}SG.sprites.set(key,c);return c}
function sgAngle(o,now){const target=o.a||0;let a=SG.heading.get(o.id);if(!a){if(SG.heading.size>=128)SG.heading.clear();a={value:target,at:now};SG.heading.set(o.id,a)}const dt=Math.max(0,Math.min(.1,(now-a.at)/1000)),d=Math.atan2(Math.sin(target-a.value),Math.cos(target-a.value));a.value=reducedMotion||now-a.at>500||o.wp?target:a.value+d*(1-Math.exp(-dt*18));a.at=now;return a.value}

// UX08: one decorative vector source, cached Canvas sprites and matching menu SVG.
// Coordinates are presentation units only; never ship stats, physics or save fields.
const GX_MODELS={
 rookie:{body:[[25,0],[9,-7],[2,-6],[-7,-13],[-17,-12],[-12,-4],[-21,-3],[-21,3],[-12,4],[-17,12],[-7,13],[2,6],[9,7]],role:'scout',engines:[[-20,0]],scale:.92},
 interceptor:{body:[[30,0],[5,-7],[-13,-20],[-22,-18],[-12,-4],[-23,-3],[-23,3],[-12,4],[-22,18],[-13,20],[5,7]],role:'combat',engines:[[-20,-10],[-20,10]],scale:1},
 cruiser:{body:[[27,0],[19,-9],[7,-10],[-1,-20],[-19,-20],[-24,-13],[-17,-8],[-23,-5],[-23,5],[-17,8],[-24,13],[-19,20],[-1,20],[7,10],[19,9]],role:'combat',engines:[[-22,-12],[-22,12]],scale:1.08},
 prospector:{body:[[22,0],[10,-6],[-1,-6],[1,-18],[-20,-18],[-23,-12],[-9,-12],[-9,-7],[-20,-4],[-20,4],[-9,7],[-9,12],[-23,12],[-20,18],[1,18],[-1,6],[10,6]],role:'mining',engines:[[-18,-9],[-18,9]],scale:1.02},
 courier:{body:[[31,0],[12,-5],[-1,-5],[-13,-13],[-23,-11],[-16,-3],[-25,-2],[-25,2],[-16,3],[-23,11],[-13,13],[-1,5],[12,5]],role:'courier',engines:[[-24,0]],scale:.96},
 hauler:{body:[[24,-4],[19,-10],[8,-10],[8,-16],[-20,-16],[-25,-10],[-23,-5],[-23,5],[-25,10],[-20,16],[8,16],[8,10],[19,10],[24,4]],role:'cargo',engines:[[-23,-9],[-23,9]],scale:1.04},
 exhumer:{body:[[23,0],[12,-8],[6,-8],[6,-22],[-17,-22],[-25,-16],[-25,-10],[-9,-10],[-9,-6],[-23,-4],[-23,4],[-9,6],[-9,10],[-25,10],[-25,16],[-17,22],[6,22],[6,8],[12,8]],role:'mining',engines:[[-22,-8],[-22,8]],scale:1.08},
 miner:{body:[[22,0],[9,-5],[3,-17],[-17,-17],[-21,-10],[-7,-9],[-9,-4],[-20,0],[-9,4],[-7,9],[-21,10],[-17,17],[3,17],[9,5]],role:'mining',engines:[[-18,-6],[-18,6]],scale:.94},
 trader:{body:[[26,-3],[18,-8],[7,-8],[7,-14],[-19,-14],[-24,-8],[-21,-3],[-21,3],[-24,8],[-19,14],[7,14],[7,8],[18,8],[26,3]],role:'cargo',engines:[[-22,-7],[-22,7]],scale:1},
 hunter:{body:[[27,0],[7,-8],[-7,-17],[-21,-15],[-12,-3],[-23,0],[-12,3],[-21,15],[-7,17],[7,8]],role:'combat',engines:[[-19,-8],[-19,8]],scale:.96},
 pirate:{body:[[28,0],[6,-6],[-2,-17],[-13,-21],[-23,-15],[-13,-5],[-24,-2],[-24,2],[-13,5],[-23,15],[-13,21],[-2,17],[6,6]],role:'combat',engines:[[-21,-9],[-21,9]],scale:1}
};
const GX={parts:new Map(),svg:new Map(),skyReady:false};
for(const [kind,m]of Object.entries(GX_MODELS)){m.radius=Math.max(...m.body.map(p=>Math.hypot(...p)))*m.scale;SG_SHAPES[kind]=m.body}
function gxModel(kind){return GX_MODELS[kind]||GX_MODELS.rookie}
function gxKind(o){return o.ty==='n'?o.role:o.hull||'rookie'}
function gxParts(kind,tint){const key=kind+tint;if(GX.parts.has(key))return GX.parts.get(key);const m=gxModel(kind),ops=[{t:'poly',p:m.body,fill:'metal',stroke:'#abc1ce',w:.65},{t:'poly',p:[[21,0],[5,-3],[-13,-3],[-16,0],[-13,3],[5,3]],fill:'#243c50',stroke:'#7898ac',w:.5}];const rect=(x,y,w,h,fill,stroke)=>ops.push({t:'rect',x,y,w,h,fill,stroke});for(const e of m.engines){rect(e[0]-2,e[1]-2,5,4,'#142333','#7d9dad');rect(e[0]-2,e[1]-1,1.5,2,tint)}rect(6,-1.6,4,3.2,tint);rect(-5,-1,8,2,'#829daf');if(m.role==='cargo'){for(let x=-17;x<6;x+=7){rect(x,-12,5.5,8,'#7792a0','#b0c2c6');rect(x,4,5.5,8,'#3c596b','#8ba4ad');rect(x+1,-10,3,.7,'#d1b979')}}else if(m.role==='mining'){for(const y of [-16,13]){rect(-16,y,18,3,'#b7a378','#d5c7a5');rect(-9,y,1.5,3,'#344b5c');rect(-4,y,1.5,3,'#344b5c')}rect(-4,-7,9,3,'#677e8f');rect(-4,4,9,3,'#425d71')}else if(m.role==='combat'){for(const y of [-7,6]){rect(0,y,10,1.4,'#c2ced1');rect(-5,y-1,4,3,'#334a60','#91a8b5')}rect(-14,-10,7,2,'#6c899c');rect(-14,8,7,2,'#3c5b72')}else if(m.role==='courier'){rect(-13,-5,14,1,'#b4c7d0');rect(-13,4,14,1,'#607f95')}else{rect(-8,-7,6,2,'#a3b9c8');rect(-8,5,6,2,'#607f96')}GX.parts.set(key,ops);return ops}
function gxCanvas(h,kind,tint){const gradient=h.createLinearGradient(0,-24,0,24);gradient.addColorStop(0,'#9bb2c1');gradient.addColorStop(.42,'#58768c');gradient.addColorStop(1,'#22394c');for(const op of gxParts(kind,tint)){h.fillStyle=op.fill==='metal'?gradient:op.fill;if(op.t==='poly'){sgPolygon(h,op.p);h.fill();if(op.stroke){h.strokeStyle=op.stroke;h.lineWidth=op.w;h.stroke()}}else{h.fillRect(op.x,op.y,op.w,op.h);if(op.stroke){h.lineWidth=.45;h.strokeStyle=op.stroke;h.strokeRect(op.x,op.y,op.w,op.h)}}}}
sgSprite=function(kind,tint){const key=kind+tint;if(SG.sprites.has(key))return SG.sprites.get(key);const c=document.createElement('canvas');c.width=c.height=128;const h=c.getContext('2d');h.translate(64,64);h.scale(2,2);gxCanvas(h,kind,tint);if(tint==='#fff'){h.globalCompositeOperation='source-atop';h.fillStyle='rgba(240,250,255,.75)';h.fillRect(-32,-32,64,64);h.globalCompositeOperation='source-over'}SG.sprites.set(key,c);return c};SG.sprites.clear();
sgShip=function(o,now,isF){const kind=gxKind(o),m=gxModel(kind),tint=o.ty==='n'?(NPC_SPEC[o.role]?.color||'#e65'):o.id==='p0'?'#7dd9ed':'#f2c987',size=Math.max(.76,Math.min(1.12,.76+Z*.72));g.rotate(sgAngle(o,now));g.scale(size*m.scale,size*m.scale);const moving=Math.hypot(o.vx||0,o.vy||0)>8||o.wp;if(moving){const length=o.wp?17:7;for(const e of m.engines){g.fillStyle=o.ty==='n'&&o.role==='pirate'?'#e79b6c':'#71cde7';g.globalAlpha=o.wp?.58:.4;g.beginPath();g.moveTo(e[0]-2,e[1]-2);g.lineTo(e[0]-length,e[1]);g.lineTo(e[0]-2,e[1]+2);g.fill();g.globalAlpha=.85;g.fillStyle='#d9f8ff';g.fillRect(e[0]-3,e[1]-.6,3,1.2)}g.globalAlpha=1}g.drawImage(sgSprite(kind,tint),-32,-32,64,64);if(isF){if(!reducedMotion){g.globalAlpha=.45;g.drawImage(sgSprite(kind,'#fff'),-32,-32,64,64);g.globalAlpha=1}g.strokeStyle='#d9f3ff';g.lineWidth=1;g.beginPath();g.arc(0,0,m.radius/m.scale+2,0,Math.PI*2);g.stroke()}if(o.ty==='p'){g.fillStyle='#eff9ff';g.fillRect(-3,-1.5,1,3);if(o.id==='p1')g.fillRect(-1,-1.5,1,3)}};
// Seeded decorative randomness is isolated from the simulation RNG.
sgStars=function(seed,layer){const r=sgRandom(seed+layer*991),count=[340,160,64][layer],stars=[];for(let i=0;i<count;i++){let x=r(),y=r();if(r()<.28){const c=i%2===0?.28:.76;x=(c+(r()+r()+r()-1.5)*.22+1)%1;y=(.2+c*.6+(r()+r()-1)*.19+1)%1}stars.push([x*SG.tile,y*SG.tile,.35+r()*[.75,1.15,1.75][layer],.2+r()*.62,r()])}return stars};
sgSkyInit=function(){if(SG.layers)return;SG.layers=[];for(let l=0;l<3;l++){const c=document.createElement('canvas');c.width=c.height=SG.tile;const h=c.getContext('2d'),stars=sgStars(SG.seed,l);if(l===0){for(const a of [[.23,.35,.3,'rgba(37,65,91,.13)'],[.72,.57,.26,'rgba(63,49,87,.1)']])for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const x=(a[0]+dx)*SG.tile,y=(a[1]+dy)*SG.tile,r=a[2]*SG.tile,t=h.createRadialGradient(x,y,0,x,y,r);t.addColorStop(0,a[3]);t.addColorStop(1,'rgba(6,10,20,0)');h.fillStyle=t;h.fillRect(x-r,y-r,r*2,r*2)}}for(const [x,y,r,a,col]of stars){const color=col<.14?'171,199,235':col>.88?'235,213,178':'206,216,229';if(r>1.6){const t=h.createRadialGradient(x,y,0,x,y,r*3);t.addColorStop(0,'rgba('+color+','+a*.22+')');t.addColorStop(1,'rgba('+color+',0)');h.fillStyle=t;h.fillRect(x-r*3,y-r*3,r*6,r*6)}h.fillStyle='rgba('+color+','+a+')';h.beginPath();h.arc(x,y,r,0,Math.PI*2);h.fill()}SG.layers.push({canvas:c,pattern:g.createPattern(c,'repeat'),stars})}GX.skyReady=true};SG.layers=null;
const gxSkyBase=sgSky;sgSky=function(cx,cy,m){if(!reducedMotion||!m.wp)return gxSkyBase(cx,cy,m);if(S.t<SG.last)SG.heading.clear();SG.last=S.t;sgSkyInit();for(let l=0;l<3;l++){const q=[.025,.065,.14][l],x=-cx*Z*q%SG.tile,y=-cy*Z*q%SG.tile;g.save();g.translate(x,y);g.fillStyle=SG.layers[l].pattern;g.fillRect(-x,-y,W,Hh);g.restore()}};

 function zeichnen(view,local,now=0) {
  if(!view) return;
  W=canvas.clientWidth||1;Hh=canvas.clientHeight||1;
  const dpr=Math.min(2,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(Hh*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(Hh*dpr)}
  g.setTransform(dpr,0,0,dpr,0,0);Z=local.zoom;S=view;reducedMotion=local.reduced;
  const cx=local.x,cy=local.y,sc=o=>[W/2+(o.x-cx)*Z,Hh/2+(o.y-cy)*Z];
  g.fillStyle='#02040a';g.fillRect(0,0,W,Hh);sgSky(cx,cy,{a:0,wp:false});
  for(const o of view.entities){const [x,y]=sc(o);if(x<-90||x>W+90||y<-90||y>Hh+90)continue;
   g.save();g.translate(x,y);
   if(o.ty==='s'){const r=Math.max(16,260*Z);g.strokeStyle='#6cf';g.fillStyle='#123';g.lineWidth=2;g.beginPath();for(let i=0;i<8;i++)g.lineTo(Math.cos(i*.785)*r,Math.sin(i*.785)*r);g.closePath();g.fill();g.stroke();g.strokeRect(-r/2,-r/2,r,r)}
   else if(o.ty==='r'){g.fillStyle=o.ore>0?'#865':'#263040';g.beginPath();g.arc(0,0,Math.max(4,(25+o.ore/8)*Z),0,6.3);g.fill()}
   else sgShip(o,now,false);
   g.restore();g.fillStyle='#b6ccdf';g.font='12px sans-serif';g.fillText(o.nm,x+18,y-18);
   if(o.id===local.selected){g.strokeStyle='#fff';g.lineWidth=1.5;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]]){g.beginPath();g.moveTo(x+a*17,y+b*11);g.lineTo(x+a*17,y+b*17);g.lineTo(x+a*11,y+b*17);g.stroke()}if(!reducedMotion){g.strokeStyle='rgba(255,255,255,.28)';g.beginPath();g.arc(x,y,25+Math.sin(now/1000*3)*1.5,0,6.3);g.stroke()}}
  }
  const target=view.fields.find(f=>f.ware===view.ware);
  if(view.auftrag==='foerdern'&&view.phase==='dock'&&target){const [a,b]=sc({x:0,y:0}),[x,y]=sc(target);g.strokeStyle='#4f8';g.globalAlpha=.7;g.beginPath();g.moveTo(a,b);g.lineTo(x,y);g.stroke();g.globalAlpha=1;
   // Mining ring from 085, driven by Core ticks, never the Core RNG.
   const p=(view.t%6)/6;g.strokeStyle='#4f8';g.beginPath();g.arc(x,y,5+p*14,0,6.28);g.stroke();}
  // 085 arc geometry; only cargo has a matching Aphros value. No invented shields/energy.
  const X=W/2,Y=Hh-72;g.lineWidth=7;g.strokeStyle='#1a2a3a';g.beginPath();g.arc(X,Y,40,2.36,7.07);g.stroke();g.strokeStyle='#fd4';g.beginPath();g.arc(X,Y,40,2.36,2.36+4.71*Math.max(0,Math.min(1,view.cargo/view.capacity)));g.stroke();g.fillStyle='#cfe3ff';g.textAlign='center';g.fillText(view.cargo+'/'+view.capacity+' Fracht',X,Y+4);g.textAlign='left';
 }
 return {zeichnen,radius:o=>o.ty==='s'?Math.max(16,260*Z):o.ty==='r'?Math.max(4,(25+o.ore/8)*Z):gxModel(o.hull).radius*Math.max(.76,Math.min(1.12,.76+Z*.72))};
}

scope.W5uGraphics=Object.freeze({grafik});
})(globalThis);
