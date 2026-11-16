/* Aphros Void J8 – freiwillige, nicht destruktive Regel195→204-Konzernsitzung.
 * EIN originaler Weltkern. Alle Aktionen auf einem geprüften, temporären Core-Klon,
 * danach atomarer Austausch der internen Sitzung; keine zweite Simulationsuhr.
 * Keine Autosaves oder Änderung bestehender IndexedDB-/Regel195-Spielstände.
 */
(function(scope){
'use strict';
const NODE=typeof module==='object'&&module.exports;
const W=NODE?require('../welt/welt-kern.js'):scope.AphrosWelt;
const J7=NODE?require('./kompatibilitaet.js'):scope.J7UebernahmeCheck;
const J6=NODE?require('../j4c/flotten-wechsel.js'):scope.J6FlottenWechsel;
if(!W||!J7)throw Error('J8 benötigt die vorhandenen Core- und J7-Prüfer');
const MAX=5*1024*1024;
const KETTE=Object.freeze([
 W.ausRegel195,W.ausRegel199K7,W.ausRegel200J2b,
 W.ausRegel201J3,W.ausRegel202J4b,W.ausRegel203J4c
]);
const safe=x=>Number.isSafeInteger(x)&&x>=0;
function paket(text){
 if(typeof text!=='string'||!text.length||text.length>MAX)throw Error('Nur JSON bis 5 MB zulässig');
 let raw;
 try{raw=JSON.parse(text);}catch{throw Error('JSON nicht lesbar');}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Ungültiges Zustandsobjekt');
 return raw;
}
function haushaltPlan(s){
 const plan=[],hinzu=(id,label,cmd)=>plan.push(Object.freeze({id,label,befehl:Object.freeze({...cmd,owner:'house'})}));
 for(const sh of Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='miner').sort((a,b)=>a.id.localeCompare(b.id))){
   if(s.kanon.pendel?.[sh.id]){
     hinzu('stop-'+sh.id,'Eis-Pendel von '+sh.id+' beenden',{type:'shipShuttleStop',schiff:sh.id});
   }else if(sh.system==='aldera'){
     hinzu('ice-'+sh.id,'Eisförderung mit '+sh.id+' (Original-Pendel)',{type:'shipShuttle',schiff:sh.id,ware:'eis'});
   }
   if(sh.system==='nadir'){
     hinzu('sil-start-'+sh.id,'Siliziumauftrag für '+sh.id+' vorfinanzieren',{type:'siliconMineStart',schiff:sh.id});
     hinzu('sil-sell-'+sh.id,'Silizium mit '+sh.id+' verkaufen',{type:'siliconSell',schiff:sh.id});
   }
 }
 for(const sh of Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='frachter')){
   hinzu('freight-'+sh.id,'F4 · bezahlte Eis-Rundfracht mit '+sh.id,{type:'shipFreightIce',schiff:sh.id});
   hinzu('gate-freight-'+sh.id,'F6 · Eis-Rundfracht mit Torbeleg '+sh.id,{type:'shipFreightGateIce',schiff:sh.id});
 }
 for(const [station,klasse] of [
   ['st_aldera','miner'],
   ['st_aldera','frachter'],['st_nadir','frachter'],['st_nadir','jaeger']
 ]){
   hinzu('buy-'+station+'-'+klasse,klasse+' in '+station+' kaufen (nur vorhandene, finanzierbare Hülle)',
    {type:'shipBuy',station,klasse});
 }
 // J10b: echte lokale Nadir-K2-Hülle nur mit rechtmäßigem K2-Vormerkbeleg.
 // Normales Komplettschiff-shipBuy deckt Nadir-Miner ausdrücklich nicht ab.
 hinzu('buy-st_nadir-miner',
   'Für house vormerkten, fertig gebauten Nadir-Miner für 600 ISK kaufen',
   {type:'stationClaimMinerLocal',station:'st_nadir'});
 return plan;
}
function erstellen(){
 let welt=null,zustand=null,herkunft=null,quelleHash=null;
 let pilot=null;
 function requireState(){if(!welt||!zustand)throw Error('J8: erst eine geprüfte Welt ausdrücklich starten');}
 function gleichesGeld(s){
   const summe=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
   if(!safe(summe)||s.minted!==0||s.burned!==0)throw Error('J8: Weltgeld-/Emissionsaudit unzulässig');
   return summe;
 }
 function pruefen(w,s){
   const rt=w.load(w.save(s));
   const a=w.audit(rt);
   if(!a.ok)throw Error('J8: Original-Core-Audit fehlgeschlagen');
   gleichesGeld(rt);
   return rt;
 }
 function aktivieren(w,s,quelle,hash){
   if(welt||zustand)throw Error('J8: laufende Sitzung zuerst als JSON sichern und Seite neu öffnen');
   const neu=pruefen(w,s);
   welt=w;zustand=neu;herkunft=quelle;quelleHash=hash;
   return ansicht();
 }
 function starten195(text,bestaetigt){
   if(bestaetigt!==true)throw Error('J8: ausdrückliche Entscheidung für eine getrennte Kopie erforderlich');
   if(welt)throw Error('J8: bestehende Sitzung nicht überschreiben');
   const raw=paket(text);
   if(raw.rulesVersion!==195||raw.schema!==8)throw Error('Nur Regel195/Schema8 zulässig');
   const report=J7.untersuchen(text);
   if(!report.ok)throw Error('J7 blockiert '+report.stufe+': '+report.reason);
   let lauf=text,letzter=null,quellHash=null;
   for(let i=0;i<KETTE.length;i++){
     letzter=KETTE[i](lauf);
     if(i===0)quellHash=letzter.nachweis?.quellHash; // Verifizierter Original-195-Hash aus dem Kernnachweis
     if(letzter.welt.hash(letzter.zustand)!==report.schritte[i].hash)
       throw Error('J8: der Original-Referenzhash weicht in Stufe '+i+' ab');
     lauf=letzter.welt.save(letzter.zustand);
   }
   if(letzter.welt.hash(letzter.zustand)!==report.hash)
     throw Error('J8: Endhash der J7-Prüfung weicht ab');
   // Jeder neue Jäger müsste einen echten Kaufbeleg besitzen. Eine 195-Kopie
   // bekommt keine zusätzliche Hülle; J7 meldet deshalb keinen Startjäger.
   if(report.eigenerJägerGekauft||Object.values(letzter.zustand.ships).some(sh=>sh.klasse==='jaeger'))
     throw Error('J8: Quelldaten dürfen keinen bereits herbeigezauberten Jäger enthalten');
   return aktivieren(letzter.welt,letzter.zustand,'Kopie aus Regel195',quellHash);
 }
 function oeffnen204(text,bestaetigt){
   if(bestaetigt!==true)throw Error('J8: ausdrückliche Spielstandauswahl erforderlich');
   if(welt)throw Error('J8: laufende Sitzung nicht überschreiben');
   const raw=paket(text),p=raw.w5ad?.profile;
   if(raw.rulesVersion!==204||raw.schema!==8||!safe(p?.carrierCash)||!safe(p?.buyerCash))
     throw Error('Nur Original-Regel204 mit vollständiger Anfangsfinanzierung');
   const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
   return aktivieren(w,w.load(text),'Fortgesetzter Regel204-Export',w.hash(w.load(text)));
 }
 // W6/P8g DRAFT: eine echte NEUE Regel207-Forschungswelt aus dem
 // originalfinanzierten Seed; niemals eine bestehende Regel204-Karriere umwandeln.
 // Das ist kein Importpfad, keine Gratisreserve und keine neue Simulationsuhr.
 function startenP8g(bestaetigt){
   if(bestaetigt!==true)throw Error('W6/P8g: eigenen Forschungsstart ausdrücklich bestätigen');
   if(welt)throw Error('J8: laufende Sitzung nicht überschreiben');
   const w=W.erstellenP8d({carrierCash:2000,buyerCash:4000});
   const s=w.createState(42);
   if(s.rulesVersion!==207||w.regel!==207||s.owners.house.cash!==3000)
     throw Error('W6/P8g: Originalstartwelt oder Eigentum nicht verifiziert');
   w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
   w.npcAutoSetzen(s,true);
   w.npcSiliziumSetzen(s,true);
   w.materialSupplySetzen(s,true);
   const audit=w.audit(s);
   if(!audit.ok)throw Error('W6/P8g: nicht finanzierte Forschungswelt: '+audit.fehler.join('; '));
   return aktivieren(w,s,'Explizite neue Regel207-Forschung (keine Regel204-Migration)',w.hash(s));
 }
 function oeffnenP8g(text,bestaetigt){
   if(bestaetigt!==true)throw Error('W6/P8g: externe JSON-Einwilligung ausdrücklich erforderlich');
   if(welt)throw Error('J8: laufende Sitzung nicht überschreiben');
   const raw=paket(text),p=raw.w5ad?.profile;
   if(raw.rulesVersion!==207||raw.schema!==8
      ||!safe(p?.carrierCash)||!safe(p?.buyerCash)
      ||raw.kanon?.materialSupplyEnabled!==true)
     throw Error('W6/P8g: ausschließlich separat aktivierte originale Regel207-Saves');
   const w=W.erstellenP8d({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
   const state=w.load(text,{p8gImportFreigegeben:true});
   if(!w.audit(state).ok)throw Error('W6/P8g: Wirtschafts-/Eigentumsaudit fehlgeschlagen');
   return aktivieren(w,state,'Ausdrücklich bestätigter Regel207-Forschungssave',w.hash(state));
 }
 function ansicht(){
   requireState();
   const s=pruefen(welt,zustand);
   const schiffe=Object.values(s.ships).filter(sh=>sh.owner==='house')
     .sort((a,b)=>a.id.localeCompare(b.id)).map(sh=>({
       id:sh.id,klasse:sh.klasse,system:sh.system,phase:sh.phase,
       flug:sh.flug?.lage||null,
       ladung:Object.entries(sh.ladung||{}).filter(([,n])=>n>0).map(([w,n])=>w+': '+n).join(' · ')||'leer'
     }));
   const stationen=Object.values(s.stations).map(st=>({
     id:st.id,system:st.system,
     lager:Object.entries(st.lager).filter(([,n])=>n>0).map(([w,n])=>w+': '+n).join(' · ')||'leer'
   }));
   const jaeger=schiffe.filter(sh=>sh.klasse==='jaeger');
   return Object.freeze({
     herkunft,quelleHash,regel:welt.regel,tick:s.tick,hash:welt.hash(s),
     weltgeld:gleichesGeld(s),hausgeld:s.owners.house.cash,schiffe,stationen,
     eigenerJaeger:jaeger.length, pilotierbar:schiffe.some(sh=>['jaeger','miner','frachter'].includes(sh.klasse)),
     ausgabe:welt.regel===207
       ?'Regel207 – isolierte Forschungskopie, kein automatisches Upgrade oder Import in 204'
       :'Regel204 – manuelle JSON-Sicherung, kein automatischer Rückweg nach Regel195'
   });
 }
 function angebot(cmd){
   requireState();
   const clone=pruefen(welt,zustand),hash=welt.hash(clone);
   try{
     const result=welt.execute(clone,cmd);
     return {ok:result.ok,reason:result.reason||null,hash};
   }catch(e){return {ok:false,reason:String(e.message||e),hash};}
 }
 function angebote(){
   requireState();
   return haushaltPlan(zustand).map(x=>{
     const a=angebot(x.befehl);
     return Object.freeze({id:x.id,label:x.label,ok:a.ok,reason:a.reason});
   });
 }
 function ausfuehren(id){
   requireState();
   if(typeof id!=='string')return {ok:false,reason:'Unbekannter Auftragswunsch'};
   const plan=haushaltPlan(zustand).find(x=>x.id===id);
   if(!plan)return {ok:false,reason:'Kein legitim auswählbarer Spielerauftrag'};
   const q=angebot(plan.befehl);
   if(!q.ok)return {ok:false,reason:q.reason};
   const neu=pruefen(welt,zustand);
   const result=welt.execute(neu,plan.befehl);
   if(!result.ok)return {ok:false,reason:result.reason||'Core hat Auftrag abgelehnt'};
   const final=pruefen(welt,neu);
   zustand=final;
   return {ok:true,type:plan.befehl.type,hash:welt.hash(zustand)};
 }
 function weiterspielen(minuten){
   requireState();
   if(![1,10,60].includes(minuten))throw RangeError('J8: nur 1, 10 oder 60 bezahlte Originalminuten');
   const next=pruefen(welt,zustand);
   welt.advance(next,minuten);
   const final=pruefen(welt,next);
   zustand=final;
   return ansicht();
 }
 // J9: Auswahl des einen persönlich gesteuerten, erworbenen Schiffs.
 // Das ist ein Controllerzustand derselben Spielwelt, kein Saveformat und kein Orts-Teleport.
 function piloten(){
   requireState();
   const copy=pruefen(welt,zustand);
   const own=Object.values(copy.ships).filter(sh=>
     sh.owner==='house'&&['miner','jaeger','frachter'].includes(sh.klasse)&&sh.flug);
   return Object.freeze(own.sort((a,b)=>a.id.localeCompare(b.id)).map(sh=>{
     // J14: Pilotwahl ist bewusst kein persistiertes Eigentums- oder Schiffsattribut.
     // Ein beim Import bereits laufender, vom Original-Core auditierter J2b-Hausauftrag
     // darf genau seinen real vorhandenen, rechtmaessig lokal gekauften Nadir-Miner
     // wieder anbinden – auch wenn house weitere Schiffe besitzt. Weder Wechsel
     // zu anderen Orten noch das Starten fremder/ungepruefter Auftraege folgt daraus.
     const einzelnWiederAnmelden=!pilot&&own.length===1;
     const gebunden=copy.kanon.silizium?.auftrag;
     const j2bWiederAnmelden=!pilot&&sh.klasse==='miner'&&sh.heimat==='nadir'
       &&sh.system==='nadir'&&gebunden?.schiff===sh.id
       &&gebunden.owner==='house'
       &&copy.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===sh.id&&k.owner==='house');
     const grund=J6.rollenGrund(copy,sh);
     const transitResume=einzelnWiederAnmelden&&sh.klasse==='frachter'&&sh.flug.lage==='transit';
     const erlaubt=(!grund&&sh.flug.lage==='angedockt')||
       (einzelnWiederAnmelden&&!copy.kanon.pendel?.[sh.id]&&(sh.klasse!=='frachter'||transitResume||!grund))||
       (j2bWiederAnmelden&&!copy.kanon.pendel?.[sh.id]);
     return Object.freeze({
       id:sh.id,klasse:sh.klasse,system:sh.system,lage:sh.flug.lage,
       erlaubt,
       grund:copy.kanon.pendel?.[sh.id]?'Autonomer Pendelauftrag zunächst beenden'
         :!erlaubt?(grund||'Vor einem Wechsel vollständig andocken'):null
     });
   }));
 }
 function uebernehmen(id,spielt=false){
   requireState();
   if(typeof id!=='string'||spielt||!J6||typeof J6.pruefenRolle!=='function')
     return {ok:false,reason:'Flugzeit anhalten und gültigen Piloten wählen'};
   const eigener=piloten().find(x=>x.id===id);
   if(!eigener)return {ok:false,reason:'Nur wirklich gekaufte eigene Miner/Jäger/Frachter'};
   if(pilot===id)return {ok:true,pilot:id};
   if(!eigener.erlaubt)return {ok:false,reason:eigener.grund};
   if(pilot){
     const gate=J6.pruefenRolle(welt,zustand,pilot,id,
       {spielt:false,patrouille:null,duell:null});
     if(!gate.ok)return gate;
   }else if(!welt.audit(zustand).ok)
     return {ok:false,reason:'Ungültiger ursprünglicher Weltstand'};
   pilot=id;
   return {ok:true,pilot:id};
 }
 const flugBefehle=new Set([
   'shipOrbit','shipFollow','shipLock','shipUnlock',
   'shipUndock','shipDock','shipApproach','shipFlyTo','shipSteer',
   'siliconMineStart','siliconSell','shipFreightIce','shipGateCheck','shipFreightGateIce'
 ]);
 function flugAngebot(cmd){
   requireState();
   if(cmd?.schiff!==pilot||cmd?.owner!=='house'||!flugBefehle.has(cmd?.type))return {ok:false,reason:'Kein eigener Pilot'};
   return angebot(cmd);
 }
 function flugBefehl(cmd){
   requireState();
   if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)||
      cmd.owner!=='house'||cmd.schiff!==pilot||!flugBefehle.has(cmd.type)||
      !zustand.ships[pilot]||zustand.ships[pilot].owner!=='house'||
      !['jaeger','miner','frachter'].includes(zustand.ships[pilot].klasse))
     return {ok:false,reason:'Nur gültige eigene Pilotenkernbefehle'};
   if(zustand.kanon.pendel?.[pilot])
     return {ok:false,reason:'Autonomer Pendelauftrag vor persönlicher Steuerung beenden'};
   try{
     const n=pruefen(welt,zustand),r=welt.execute(n,cmd);
     if(!r.ok)return {ok:false,reason:r.reason};
     zustand=pruefen(welt,n);
     return {ok:true,type:cmd.type};
   }catch(e){return {ok:false,reason:String(e.message||e)};}
 }
 function flugSchritte(zahl){
   requireState();
   if(!Number.isSafeInteger(zahl)||zahl<0||zahl>900)
     throw RangeError('J9: maximal 900 Original-Flugschritte pro Frame');
   if(!pilot||!zustand.ships[pilot]||zustand.ships[pilot].owner!=='house')
     throw Error('J9: kein eigener Pilot ausgewählt');
   if(zahl===0)return 0;
   const neu=pruefen(welt,zustand),vor=neu.tick;
   for(let i=0;i<zahl;i++)welt.teilschritt(neu);
   zustand=pruefen(welt,neu);
   return zustand.tick-vor;
 }
 function pilotStatus(){return pilot;}
 function weltReferenz(){return welt;}
 function zustandReferenz(){return zustand;}
 function flugAudit(){requireState();return welt.audit(zustand);}

 function exportieren(){requireState();return welt.save(zustand);}
 return Object.freeze({starten195,oeffnen204,startenP8g,oeffnenP8g,ansicht,angebote,ausfuehren,weiterspielen,exportieren,
  piloten,uebernehmen,pilotStatus,flugBefehl,flugAngebot,flugSchritte,weltReferenz,zustandReferenz,flugAudit});
}
const API=Object.freeze({erstellen});
if(NODE)module.exports=API;else scope.J8KonzernSitzung=API;
})(typeof globalThis==='object'?globalThis:this);
