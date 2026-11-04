import {gxCanvas,treffer,eingabe} from './m_ui_jagd_vektoren.mjs';
import {jagdSichtV1,lagen} from './m_ui_jagdsicht.mjs';
const farben={spieler:'#74e3ff',npc:'#ffd17d',pirat:'#ff829b'};
/** UI-only state is enclosed. setSnapshot takes a detached immutable copy. */
export function jagdRenderer(canvas,onAuswahl=()=>{}){
 const basisZoom=()=>Math.max(.03,Math.min(.32,canvas.clientWidth/1800));
 const g=canvas.getContext('2d'),local={x:0,y:0,zoom:basisZoom()};
 let view=null,entities=[],selected=null,disposed=false;
 const sc=o=>[canvas.clientWidth/2+(o.x-local.x)*local.zoom,canvas.clientHeight/2+(o.y-local.y)*local.zoom];
 function zeichnen(){
  if(!view||disposed)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(2,globalThis.devicePixelRatio||1);
  canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);g.setTransform(d,0,0,d,0,0);
  g.fillStyle='#060d19';g.fillRect(0,0,w,h);
  // Fixed decorative sky, no simulation RNG and no animation clock.
  g.fillStyle='#60758e';for(let i=0;i<100;i++)g.fillRect((i*137.51)%w,(i*i*13.17)%h,1,1);
  const [cx,cy]=sc({x:0,y:0});g.strokeStyle='#35506d';g.setLineDash([5,7]);g.beginPath();g.ellipse(cx,cy,1050*local.zoom,760*local.zoom,0,0,Math.PI*2);g.stroke();g.setLineDash([]);
  for(const e of view.ereignisse){
   // Only supplied evidence is drawn; never infer a hit, damage, payout or a kill.
   const a=entities.find(s=>s.id===e.quelleId),b=entities.find(s=>s.id===e.zielId),[x,y]=sc(a),[u,v]=sc(b);
   g.strokeStyle=e.art==='abschuss'?'#ff829b':'#ffd17d';g.lineWidth=2;
   if(e.art==='schuss'){g.beginPath();g.moveTo(x,y);g.lineTo(u,v);g.stroke()}
   else {g.beginPath();g.arc(u,v,34,0,Math.PI*2);g.moveTo(u-22,v-22);g.lineTo(u+22,v+22);g.moveTo(u+22,v-22);g.lineTo(u-22,v+22);g.stroke()}
  }
  for(const s of entities){
   const [x,y]=sc(s),color=farben[s.besitzer.art];g.save();g.translate(x,y);
   if(s.status==='zerstoert')g.globalAlpha=.4;
   g.save();g.scale(.9,.9);gxCanvas(g,s.besitzer.art==='pirat'?'pirate':s.klasse==='jaeger'?'hunter':'rookie',color);g.restore();
   g.globalAlpha=1;g.strokeStyle=color;g.lineWidth=2;
   // Shape and text also distinguish allegiance, not color alone.
   if(s.besitzer.art==='spieler')g.strokeRect(-30,-28,60,56);
   else if(s.besitzer.art==='npc'){g.beginPath();g.arc(0,0,31,0,Math.PI*2);g.stroke()}
   else {g.beginPath();g.moveTo(0,-35);g.lineTo(36,0);g.lineTo(0,35);g.lineTo(-36,0);g.closePath();g.stroke()}
   if(selected===s.id){g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(-39,-39,78,78)}
   g.fillStyle='#e4edf8';g.font='12px system-ui';g.fillText(s.id,-32,53);g.fillText(`${s.besitzer.art} · ${s.besitzer.id}`,-32,69);g.restore();
  }
 }
 function auswaehlen(id){selected=entities.some(s=>s.id===id)?id:null;onAuswahl(view?.schiffe.find(s=>s.id===selected)??null);zeichnen()}
 const input=eingabe(canvas,local,(x,y)=>auswaehlen(treffer({entities},local,canvas.getBoundingClientRect(),x,y,()=>34)?.id),()=>view&&`${view.systemId}/${view.anomalieId}/${view.tick}`);
 // Reuse pointer arbitration; redraw after pinch. Drag never moves a ship.
 const move=canvas.onpointermove;canvas.onpointermove=e=>{move(e);zeichnen()};
 const resize=()=>{input.clear();zeichnen()};globalThis.addEventListener?.('resize',resize);
 return {
  setSnapshot(snapshot){const next=jagdSichtV1(snapshot);input.clear();view=next;entities=lagen(view);auswaehlen(selected)},
  auswaehlen,
  zoom(factor){input.clear();local.zoom=Math.max(.03,Math.min(.5,local.zoom*factor));zeichnen()},
  zentrieren(){local.x=0;local.y=0;local.zoom=basisZoom();input.clear();zeichnen()},
  zeichnen,
  dispose(){disposed=true;input.clear();globalThis.removeEventListener?.('resize',resize);for(const k of ['onpointerdown','onpointermove','onpointerup','onpointercancel','onlostpointercapture'])canvas[k]=null}
 };
}
