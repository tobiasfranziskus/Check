/* Aphros Void F8-A: isolierte 2D-Jaegerflug-Uebung, NICHT Weltwirtschaft.
 * Verwendet exakt das bestehende FlugKern aus F6. Keine bezahlten Schiffe,
 * keine echten Kampfobjekte, kein ISK/XP/Kopfgeld und kein Spielstandimport.
 * Der schuelerartige Demo-Flugkoerper besitzt KEINE Wirtschaftshuelle.
 */
(function(scope){
'use strict';
const FLUG=typeof module==='object'&&module.exports
  ?require('../flug2d/flug-kern.js'):scope.FlugKern;
const TREFFER=typeof module==='object'&&module.exports
  ?require('./f8-treffer.js'):scope.F8Treffertraining;
const ID='f8_training_only',MARKER=Object.freeze({x:720000,y:-288000,radius:48000,tempo:240});
const ganz=n=>Number.isSafeInteger(n);
function neu(){
  const schiff={id:ID,owner:'house',klasse:'jaeger',system:'aldera',
    heimat:'aldera',phase:'dock',auftrag:'training',
    flug:FLUG.koerperAngedockt('aldera')};
  return {schema:0,profil:'F8_FLUGUEBUNG_OHNE_WIRTSCHAFT',flug:{schritt:0},
    ships:{[ID]:schiff},sekunden:0,minuten:0,erreicht:null,zielprobe:TREFFER.neu()};
}
function audit(s){
  if(!s||s.schema!==0||s.profil!=='F8_FLUGUEBUNG_OHNE_WIRTSCHAFT'
    ||!s.ships||Object.keys(s.ships).join()!==ID
    ||s.ships[ID].owner!=='house'||s.ships[ID].klasse!=='jaeger'
    ||s.ships[ID].system!=='aldera'||s.ships[ID].id!==ID
    ||s.ships[ID].phase!=='dock'
    ||!ganz(s.sekunden)||s.sekunden<0||!ganz(s.minuten)||s.minuten<0
    ||s.minuten!==Math.floor(s.sekunden/FLUG.DATEN.schritteJeMinute)
    ||!((s.erreicht===null)||(ganz(s.erreicht)&&s.erreicht>=1&&s.erreicht<=s.sekunden))
    ||Object.keys(s).sort().join()!=='erreicht,flug,minuten,profil,schema,sekunden,ships,zielprobe')
    return {ok:false,grund:'F8: kein unveraenderter, isolierter Uebungszustand'};
  const f=FLUG.audit(s);
  return !f.ok?f:TREFFER.audit(s);
}
function befehl(s,cmd){
  const ok=audit(s);if(!ok.ok)throw Error(ok.grund);
  const ret=cmd?.type==='fighterFire'
    ?TREFFER.feuern(s,cmd,s.ships[ID]):FLUG.ausfuehren(s,cmd);
  if(!ret.ok)return ret;
  const check=audit(s);if(!check.ok)throw Error(check.grund);
  return ret;
}
function schritt(s,anzahl=1){
  if(!ganz(anzahl)||anzahl<1||anzahl>12000)throw RangeError('1..12000 Flugsekunden');
  const q=audit(s);if(!q.ok)throw Error(q.grund);
  for(let i=0;i<anzahl;i++){
    FLUG.schritt(s);
    s.sekunden++;s.minuten=Math.floor(s.sekunden/FLUG.DATEN.schritteJeMinute);
    TREFFER.schritt(s);
    const b=s.ships[ID].flug,dx=b.x-MARKER.x,dy=b.y-MARKER.y;
    if(s.erreicht===null&&b.lage==='frei'
      &&dx*dx+dy*dy<=MARKER.radius*MARKER.radius
      &&b.vx*b.vx+b.vy*b.vy<=MARKER.tempo*MARKER.tempo)
      s.erreicht=s.sekunden;
  }
  const check=audit(s);if(!check.ok)throw Error(check.grund);
  return s;
}
function status(s){
  const b=s.ships[ID].flug,dx=b.x-MARKER.x,dy=b.y-MARKER.y;
  return Object.freeze({sekunden:s.sekunden,minuten:s.minuten,lage:b.lage,
    x:b.x,y:b.y,vx:b.vx,vy:b.vy,kurs:b.kurs,sollKurs:b.sollKurs,
    sollFahrt:b.sollFahrt,distanz:FLUG.isqrt(dx*dx+dy*dy),
    erreicht:s.erreicht,bremsbereit:FLUG.isqrt(b.vx*b.vx+b.vy*b.vy)<=MARKER.tempo,
    zielHp:s.zielprobe.hp,treffer:s.zielprobe.treffer,schuesse:s.zielprobe.schuesse,
    naechsterSchuss:s.zielprobe.naechster,projektile:s.zielprobe.geschosse.length});
}
const api=Object.freeze({ID,MARKER,flug:FLUG,TRAINING: TREFFER.K,neu,befehl,schritt,audit,status,
  // Keine Welt-Save-API, keine bestaetigten Kopfgeld- oder Kampfauftraege.
  begrenzung:'Nur Fluguebung und Schiessziel; kein wirtschaftlich finanziertes Schiff oder echter Kampf'});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.F8JaegerTraining=api;
})(globalThis);
