/* J4e [DRAFT] · F8-E-Kampftraining an wirklich gekauften Regel204-Jäger binden.
 * Kein Trainer-Ersatzschiff, keine zweite Weltuhr oder Physik: F8-Projektile sehen
 * ausschliesslich den autoritativen F6-Koerper und die Original-Weltsekunden.
 * Treffer/HP sind NICHT wirtschaftliche Waren, Hüllenschäden oder NPCs.
 * Das flüchtige Trainingsbuch wird NIEMALS im Regel204-Spielstand gespeichert.
 */
(function(scope) {
'use strict';
const NODE=typeof module==='object'&&module.exports;
const F=NODE?require('../flug2d/flug-kern.js'):scope.FlugKern;
const T=NODE?require('../f8-jaeger/f8-treffer.js'):scope.F8Treffertraining;
const D=NODE?require('../f8-jaeger/f8-duell.js'):scope.F8DuellTraining;
if(!F||!T||!D)throw Error('J4e: F8-E-Originalmodule fehlen');
const keys=(a,k)=>a&&typeof a==='object'&&!Array.isArray(a)
 &&Object.keys(a).sort().join()===k.slice().sort().join();
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const zeit=s=>s.tick*F.DATEN.schritteJeMinute+s.flug.schritt;
const ansicht=p=>({sekunden:p.sekunden,zielprobe:p.zielprobe});
function besitzer(w,s,id) {
 if(!w||w.regel!==204||s?.rulesVersion!==204||!w.audit(s).ok)
   throw Error('Nur auditiert bezahlte Regel204-Welt');
 const sh=s.ships?.[id],belege=s.kanon?.jaeger?.kaeufe;
 if(!sh||sh.id!==id||sh.owner!=='house'||sh.klasse!=='jaeger'
  ||sh.system!=='nadir'||sh.heimat!=='nadir'
  ||!belege?.some(k=>k.id===id&&k.owner==='house'&&k.station==='st_nadir'
    &&k.preis===w.rules.j4.verkaufspreis))
   throw Error('Originaler Eigentums-/900-ISK-Jägerkauf fehlt');
 return sh;
}
function beginnen(w,s,id) {
 const sh=besitzer(w,s,id),service=s.kanon.flugdienst?.[id];
 if(sh.flug.lage!=='frei'||!service||service.konto!=='k1_flug_'+id
  ||!s.owners?.[service.konto]||!safe(s.owners[service.konto].cash))
  throw Error('Duelltraining nur im wirklich vorfinanzierten freien Jägerflug');
 const jetzt=zeit(s);
 if(!safe(jetzt))throw Error('Ungültige Weltzeit');
 const q=T.neu();q.gegner=D.neu();
 const view={sekunden:0,zielprobe:q};
 if(!T.modusSetzen(view,'duell').ok||!T.audit(view).ok||!D.audit(view).ok)
  throw Error('F8-Trainingsbuch ungültig');
 return {schiff:id,beginn:jetzt,zuletzt:jetzt,sekunden:0,status:'aktiv',zielprobe:q};
}
function audit(p) {
 if(!keys(p,['schiff','beginn','zuletzt','sekunden','status','zielprobe'])
  ||typeof p.schiff!=='string'||!safe(p.beginn)||!safe(p.zuletzt)
  ||!safe(p.sekunden)||p.sekunden!==p.zuletzt-p.beginn
  ||!['aktiv','sieg','niederlage','unterbrochen','abgebrochen'].includes(p.status))
  return {ok:false,grund:'J4e: ungültiger Session-Beobachter'};
 const view=ansicht(p),a=T.audit(view),b=D.audit(view);
 if(!a.ok)return a;if(!b.ok)return b;
 const result=D.ergebnis(view);
 if(p.status==='sieg'&&result!=='sieg'||p.status==='niederlage'&&result!=='niederlage'
   ||p.status==='aktiv'&&result!=='aktiv')
  return {ok:false,grund:'J4e: Ergebnis nicht mit F8-Belegen vereinbar'};
 return {ok:true,grund:'Original-F8-E-Schuss-/Kollisionsjournal gültig'};
}
function feuern(w,s,p) {
 if(!p||p.status!=='aktiv'||!audit(p).ok||zeit(s)!==p.zuletzt)
  return {ok:false,type:'fighterFire',reason:'Kein gültiges laufendes F8-Duell'};
 let sh;
 try {sh=besitzer(w,s,p.schiff)} catch(e) {
  return {ok:false,type:'fighterFire',reason:e.message};
 }
 if(!s.kanon.flugdienst?.[sh.id])
  return {ok:false,type:'fighterFire',reason:'Pilotendienst nicht finanziert'};
 return T.feuern(ansicht(p),{type:'fighterFire',owner:'house',schiff:p.schiff},sh);
}
function beobachten(w,s,p) {
 if(!p||p.status!=='aktiv')return p;
 if(!audit(p).ok){p.status='unterbrochen';return p;}
 const jetzt=zeit(s);
 if(jetzt===p.zuletzt)return p;
 if(!safe(jetzt)||jetzt!==p.zuletzt+1){
  p.status='unterbrochen';return p;
 }
 const sh=s.ships?.[p.schiff];
 if(!sh||sh.owner!=='house'||sh.klasse!=='jaeger'
    ||sh.system!=='nadir'||!s.kanon?.jaeger?.kaeufe?.some(b=>b.id===p.schiff&&b.owner==='house')
    ||!s.kanon.flugdienst?.[p.schiff]){
  p.status='abgebrochen';return p;
 }
 p.zuletzt=jetzt;p.sekunden++;
 const view=ansicht(p);
 T.schritt(view);
 D.schritt(view,sh);
 const status=D.ergebnis(view);
 if(status==='sieg'||status==='niederlage')p.status=status;
 else if(sh.flug.lage!=='frei')p.status='abgebrochen';
 return p;
}
function stand(p) {
 if(!p)return {status:'nicht gestartet',sekunden:0,zielHp:T.K.maxHp,
   pilotHp:D.K.pilotMaxHp,treffer:0,gegnerTreffer:0,schuesse:0,ziel:{x:T.K.zielX,y:T.K.zielY},
   projektile:[],gegnerGeschosse:[]};
 const view=ansicht(p);
 return {status:p.status,sekunden:p.sekunden,zielHp:p.zielprobe.hp,
   pilotHp:p.zielprobe.gegner.pilotHp,treffer:p.zielprobe.treffer,
   gegnerTreffer:p.zielprobe.gegner.treffer,schuesse:p.zielprobe.schuesse,
   ziel:T.zielposition(view),projektile:p.zielprobe.geschosse,
   gegnerGeschosse:p.zielprobe.gegner.geschosse};
}
const api=Object.freeze({beginnen,besitzer,audit,feuern,beobachten,stand,
  TREFFER:T,DUELL:D});
if(NODE)module.exports=api;else scope.J4eDuell=api;
})(typeof globalThis==='object'?globalThis:this);
