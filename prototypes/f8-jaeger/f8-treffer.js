/* F8-B: deterministische 2D-Zielprobe, reine Trainingsmechanik [ANALYSE].
 * Kein Pirat, keine physische Wirtschafts-Huelle, kein Schadens-/ISK-Buch des Regel200-Cores.
 * Position, Schub, Kurs kommen ausschliesslich aus dem Original-F6-Flugkoerper.
 * Forschungswerte sind NICHT als Balancing oder reales Waffenfitting freigegeben.
 */
(function(scope){
'use strict';
const F=typeof module==='object'&&module.exports
  ?require('../flug2d/flug-kern.js'):scope.FlugKern;
const K=Object.freeze({schaden:45,maxHp:135,tempo:20000,leben:35,
  abstand:22000,intervall:16,zielX:720000,zielY:-288000,
  orbitRadius:96000,orbitSekundenJeWinkel:5});
const ganz=(x,lo=0,hi=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=lo&&x<=hi;
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)
  &&Object.keys(x).sort().join()===k.slice().sort().join();
function neu(){return {modus:'stationaer',hp:K.maxHp,schuesse:0,treffer:0,naechster:0,
  geschosse:[],belege:[]};}
function audit(s){
  const q=s.zielprobe;
  if(!keys(q,['modus','hp','schuesse','treffer','naechster','geschosse','belege','gegner'])
    ||!['stationaer','beweglich','duell'].includes(q.modus)
    ||!ganz(q.hp,0,K.maxHp)||!ganz(q.schuesse)||!ganz(q.treffer,0,3)
    ||!ganz(q.naechster)||q.hp!==K.maxHp-q.treffer*K.schaden
    ||!Array.isArray(q.geschosse)||!Array.isArray(q.belege)
    ||q.belege.length!==q.treffer||q.treffer>q.schuesse
    ||q.naechster>(s.sekunden+K.intervall)
    ||(q.schuesse===0)!==(q.naechster===0))
    return {ok:false,grund:'F8-B: Ziel-/Schussbuch unplausibel'};
  const belegIds=new Set(),flugIds=new Set();
  for(let n=0;n<q.belege.length;n++){
    const b=q.belege[n];
    if(!keys(b,['schuss','tick','schaden','hp'])
      ||!ganz(b.schuss,1,q.schuesse)||belegIds.has(b.schuss)
      ||!ganz(b.tick,1,s.sekunden)||b.schaden!==K.schaden
      ||b.hp!==K.maxHp-(n+1)*K.schaden
      ||(n>0&&b.tick<q.belege[n-1].tick))
      return {ok:false,grund:'F8-B: manipulierte Trefferbelege'};
    belegIds.add(b.schuss);
  }
  for(const p of q.geschosse){
    if(!keys(p,['id','x','y','vx','vy','rest'])
      ||!ganz(p.id,1,q.schuesse)||belegIds.has(p.id)||flugIds.has(p.id)
      ||!ganz(p.rest,1,K.leben)
      ||!ganz(p.x,-F.DATEN.raumRadius*2,F.DATEN.raumRadius*2)
      ||!ganz(p.y,-F.DATEN.raumRadius*2,F.DATEN.raumRadius*2)
      ||!ganz(p.vx,-K.tempo,K.tempo)||!ganz(p.vy,-K.tempo,K.tempo))
      return {ok:false,grund:'F8-B: manipulierte Projektile'};
    flugIds.add(p.id);
  }
  if(q.geschosse.length>3)return {ok:false,grund:'F8-B: zu viele gleichzeitige Geschosse'};
  return {ok:true,grund:'F8-B: konsistentes Trainingsschussbuch'};
}
// Rein aus dem gespeicherten Simulationssekundenzähler berechnet, ganzzahlig
// und Node/V8/WebKit gleich. Keine neue NPC-Uhr, keine Position im Renderer.
function zielposition(s){
  if(s.zielprobe.modus==='stationaer')
    return {x:K.zielX,y:K.zielY};
  const winkel=Math.floor(s.sekunden/K.orbitSekundenJeWinkel)&255;
  return {x:K.zielX+Math.trunc(F.cos(winkel)*K.orbitRadius/F.DATEN.einheit),
    y:K.zielY+Math.trunc(F.sin(winkel)*K.orbitRadius/F.DATEN.einheit)};
}
function modusSetzen(s,modus){
  if(!['stationaer','beweglich','duell'].includes(modus))
    return {ok:false,type:'fighterTargetMode',reason:'Unbekannter Trainingszielmodus'};
  if(s.sekunden!==0||s.zielprobe.schuesse!==0)
    return {ok:false,type:'fighterTargetMode',reason:'Moduswechsel nur vor Trainingsstart'};
  s.zielprobe.modus=modus;
  return {ok:true,type:'fighterTargetMode',modus};
}
function feuern(s,cmd,schiff){
  if(!keys(cmd,['type','owner','schiff'])||cmd.type!=='fighterFire'
    ||cmd.owner!=='house'||cmd.schiff!==schiff.id||schiff.klasse!=='jaeger')
    return {ok:false,type:'fighterFire',reason:'Nur eigener Trainingsjaeger'};
  if(!audit(s).ok)return {ok:false,type:'fighterFire',reason:'Trainingsschussbuch ungueltig'};
  const q=s.zielprobe,b=schiff.flug;
  if(b.lage!=='frei')return {ok:false,type:'fighterFire',reason:'Schuss nur im freien Flug'};
  if(q.hp===0)return {ok:false,type:'fighterFire',reason:'Trainingsziel bereits deaktiviert'};
  if(q.geschosse.length>=3)return {ok:false,type:'fighterFire',reason:'Maximal drei Geschosse in der Luft'};
  if(s.sekunden<q.naechster)return {ok:false,type:'fighterFire',reason:'Waffe noch in der Trainingspause'};
  const x=Math.trunc(F.cos(b.kurs)*K.tempo/F.DATEN.einheit),
    y=Math.trunc(F.sin(b.kurs)*K.tempo/F.DATEN.einheit);
  q.schuesse++;q.naechster=s.sekunden+K.intervall;
  q.geschosse.push({id:q.schuesse,x:b.x,y:b.y,vx:x,vy:y,rest:K.leben});
  return {ok:true,type:'fighterFire',schuss:q.schuesse,vorhanden:q.geschosse.length};
}
function schritt(s){
  const q=s.zielprobe;
  const rest=[];
  const ziel=zielposition(s);
  for(const p of q.geschosse){
    p.x+=p.vx;p.y+=p.vy;p.rest--;
    const dx=p.x-ziel.x,dy=p.y-ziel.y;
    if(q.hp>0&&dx*dx+dy*dy<=K.abstand*K.abstand){
      q.hp=Math.max(0,q.hp-K.schaden);
      q.treffer++;q.belege.push({schuss:p.id,tick:s.sekunden,schaden:K.schaden,hp:q.hp});
    }else if(p.rest>0) rest.push(p);
  }
  q.geschosse=rest;
}
const api=Object.freeze({K,neu,audit,feuern,schritt,zielposition,modusSetzen});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.F8Treffertraining=api;
})(globalThis);
