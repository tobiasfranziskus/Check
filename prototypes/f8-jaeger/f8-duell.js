/* F8-E: einzig isoliertes 2D-DuellTRAINING, NICHT Piratenkampf/Wirtschaft.
 * Gegnerprojektile entstehen aus echten F6-Koordinaten; Pilot-Huellen-HP
 * sind nur Uebungspunkte, kein Schiffsverlust, keine ISK/XP/Kopfgeld.
 */
(function(scope){
'use strict';
const F=typeof module==='object'&&module.exports
  ?require('../flug2d/flug-kern.js'):scope.FlugKern;
const TARGET=typeof module==='object'&&module.exports
  ?require('./f8-treffer.js'):scope.F8Treffertraining;
const K=Object.freeze({pilotMaxHp:96,schaden:24,tempo:9000,leben:40,
  treffradius:14000,reichweite:260000,intervall:36,maxGeschosse:2});
const ganz=(x,lo=0,hi=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=lo&&x<=hi;
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)
  &&Object.keys(x).sort().join()===k.slice().sort().join();
function neu(){
  return {pilotHp:K.pilotMaxHp,schuesse:0,treffer:0,naechster:0,
    geschosse:[],belege:[]};
}
function audit(s){
  const e=s?.zielprobe?.gegner,q=s?.zielprobe;
  if(!keys(e,['pilotHp','schuesse','treffer','naechster','geschosse','belege'])
    ||!ganz(e.pilotHp,0,K.pilotMaxHp)
    ||!ganz(e.schuesse)||!ganz(e.treffer,0,K.pilotMaxHp/K.schaden)
    ||!ganz(e.naechster)||e.pilotHp!==K.pilotMaxHp-e.treffer*K.schaden
    ||!Array.isArray(e.geschosse)||!Array.isArray(e.belege)
    ||e.belege.length!==e.treffer||e.treffer>e.schuesse
    ||e.naechster>s.sekunden+K.intervall
    ||(e.schuesse===0)!==(e.naechster===0))
    return {ok:false,grund:'F8-E: gegnerisches Trainingswaffenbuch'};
  if(q.modus!=='duell'&&(e.schuesse!==0||e.treffer!==0
    ||e.naechster!==0||e.geschosse.length!==0||e.belege.length!==0))
    return {ok:false,grund:'F8-E: Gegnerfeuer ohne Duellmodus'};
  const hits=new Set(),flying=new Set();
  for(let i=0;i<e.belege.length;i++){
    const b=e.belege[i];
    if(!keys(b,['schuss','tick','schaden','hp'])
      ||!ganz(b.schuss,1,e.schuesse)||hits.has(b.schuss)
      ||!ganz(b.tick,1,s.sekunden)||b.schaden!==K.schaden
      ||b.hp!==K.pilotMaxHp-(i+1)*K.schaden
      ||(i>0&&b.tick<e.belege[i-1].tick))
      return {ok:false,grund:'F8-E: manipulierte Pilotentreffer'};
    hits.add(b.schuss);
  }
  if(e.geschosse.length>K.maxGeschosse)return {ok:false,grund:'F8-E: Geschossgrenze'};
  for(const p of e.geschosse){
    if(!keys(p,['id','x','y','vx','vy','rest'])
      ||!ganz(p.id,1,e.schuesse)||hits.has(p.id)||flying.has(p.id)
      ||!ganz(p.rest,1,K.leben)
      ||!ganz(p.x,-F.DATEN.raumRadius*2,F.DATEN.raumRadius*2)
      ||!ganz(p.y,-F.DATEN.raumRadius*2,F.DATEN.raumRadius*2)
      ||!ganz(p.vx,-K.tempo,K.tempo)||!ganz(p.vy,-K.tempo,K.tempo))
      return {ok:false,grund:'F8-E: manipuliertes Gegnergeschoss'};
    flying.add(p.id);
  }
  return {ok:true,grund:'F8-E: konsistenter Duellschaden'};
}
function ergebnis(s){
  const q=s.zielprobe;
  if(q.modus!=='duell')return 'zieluebung';
  if(q.gegner.pilotHp===0)return 'niederlage';
  if(q.hp===0&&q.gegner.geschosse.length===0)return 'sieg';
  return 'aktiv';
}
function schritt(s,ship){
  const q=s.zielprobe;
  if(q.modus!=='duell')return;
  const e=q.gegner,b=ship.flug,bleiben=[];
  for(const p of e.geschosse){
    p.x+=p.vx;p.y+=p.vy;p.rest--;
    const dx=p.x-b.x,dy=p.y-b.y;
    if(e.pilotHp>0&&b.lage==='frei'&&dx*dx+dy*dy<=K.treffradius*K.treffradius){
      e.pilotHp=Math.max(0,e.pilotHp-K.schaden);
      e.treffer++;
      e.belege.push({schuss:p.id,tick:s.sekunden,schaden:K.schaden,hp:e.pilotHp});
    }else if(p.rest>0)bleiben.push(p);
  }
  e.geschosse=bleiben;
  if(b.lage!=='frei'||q.hp===0||e.pilotHp===0
    ||s.sekunden<e.naechster||e.geschosse.length>=K.maxGeschosse)return;
  const z=TARGET.zielposition(s),dx=b.x-z.x,dy=b.y-z.y;
  if(dx*dx+dy*dy>K.reichweite*K.reichweite)return;
  const kurs=F.richtungZu(dx,dy);
  const vx=Math.trunc(F.cos(kurs)*K.tempo/F.DATEN.einheit),
    vy=Math.trunc(F.sin(kurs)*K.tempo/F.DATEN.einheit);
  e.schuesse++;e.naechster=s.sekunden+K.intervall;
  e.geschosse.push({id:e.schuesse,x:z.x,y:z.y,vx,vy,rest:K.leben});
}
const api=Object.freeze({K,neu,audit,schritt,ergebnis});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.F8DuellTraining=api;
})(globalThis);
