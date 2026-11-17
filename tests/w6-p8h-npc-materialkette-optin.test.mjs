// W6/P8h opt-in: Echte autonome NPC-Originalbefehle im Rule207-Produktkern.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(s=>s.id==='S02').politik;
const cash=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function pruefen(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(cash(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function krise90(){
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
 let gekauft=0;
 for(let t=120;t<=90*1440;t+=120){
   w.advance(s,120);
   if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&gekauft<3){
     const e=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
     assert.equal(e.ok,true,e.reason);gekauft++;
   }
 }
 pruefen(w,s);
 assert.equal(w.hash(s),'ad0f037be40c32fd','P8h-off bewahrt originalen S02-Referenzhash');
 assert.equal(s.kanon.npcMaterialKette,undefined);
 return {w,s};
}
function lauf(w,quelle){
 const s=w.load(quelle),basis={w3:s.w3.abgeschlossen,w5:s.w5.fertig};
 assert.equal(w.npcMaterialKetteSetzen(s,true).aktiviert,true);
 let steps=0;const seen=[];
 while(steps<288){
   w.advance(s,30);steps++;
   if(steps%16===0)pruefen(w,s);
   if(s.w3.abgeschlossen>basis.w3&&s.kanon.industrieErz?.phase==='geliefert')break;
 }
 pruefen(w,s);
 return {s,steps,hash:w.hash(s),basis,belege:JSON.parse(JSON.stringify(s.kanon.npc.befehle)),
   w3Neu:s.w3.abgeschlossen-basis.w3,werftNeu:s.w5.fertig-basis.w5};
}
test('P8h: historische 204/207-Referenzen ohne Opt-in bleiben unveraendert; falsche Aktivierung blockiert',()=>{
 const old=K.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const s=old.createState(42);
 assert.throws(()=>old.npcMaterialKetteSetzen(s,true),/P8h/);
 const z=JSON.parse(old.save(s));z.kanon.npcMaterialKette=true;
 assert.equal(old.audit(z).ok,false,'Regel204 darf das neue NPC-Feld nicht tragen');
 assert.throws(()=>old.load(JSON.stringify(z)),/P8h|Audit|audit|verweigert/);
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const n=w.createState(42);
 assert.throws(()=>w.npcMaterialKetteSetzen(n,true),/Original-NPC/);
 assert.throws(()=>w.npcMaterialKetteSetzen(n,'true'),/Bool/);
 assert.equal(n.kanon.npcMaterialKette,undefined);
});
test('P8h: S02x90 aktiviert rechtmaessige automatische Ersatzkette – nur eine Werfthuelle, W3-Lieferung, doppelter Replay',()=>{
 const {w,s}=krise90(),quelle=w.save(s),h=w.hash(s);
 const a=lauf(w,quelle),b=lauf(w,quelle);
 assert.equal(a.hash,b.hash);
 assert.deepEqual(a.belege,b.belege);
 assert.equal(a.w3Neu,1,'neue reale finanzierte W3-Materialfracht');
 assert.equal(a.werftNeu,1,'keine unnoetige zweite W5-Huelle');
 for(const cmd of ['werft_extern:stationBuildShip','transport:shipBuy',
   'st_nadir:industrialOreOfferMaterial','npc3:industrialOreAcceptMine',
   'transport:industrialOreAcceptFreight','st_nadir:industrialOreCommitMaterial'])
   assert.equal(a.belege[cmd],1,cmd+' genau einmal mit Originaleigentum');
 // Die bereits vorhandene W5-Industrie kann die Ueberfuehrung rechtmaessig
 // selbst ausloesen. Nicht den Quellenpfad vorschreiben, sondern 60 echte
 // bezahlte Original-Pilotenminuten fuer die NEUE Huelle nachweisen.
 assert.ok((a.belege['transport:shipReposition']||0)<=1,
   'kein zweiter NPC-P8h-Ueberfuehrungsauftrag');
 const neuerFrachter=Object.values(a.s.ships).find(sh=>sh.owner==='transport'
   &&sh.klasse==='frachter'&&sh.system==='aldera'&&w.buchwert(a.s,sh.id)>0
   &&a.s.w5ac.completed.some(x=>x.id===sh.id&&x.kosten===60));
 assert.ok(neuerFrachter,'Original-W5ac-Nachweis der bezahlten neuen Frachterueberfuehrung');
 assert.equal(w.hash(s),h,'urspruengliche Krise unveraendert');
 assert.equal(w.save(s),quelle);
 console.log('P8H_PRODUCT_OPTIN_RECOVERY',JSON.stringify({sourceHash:h,finalHash:a.hash,
   minuten:a.steps*30,extraW3:a.w3Neu,extraW5:a.werftNeu,commandProof:a.belege,
   fighters:a.s.kanon.jaeger.fertig,ISK:cash(a.s),mint:a.s.minted,burn:a.s.burned}));
});
test('P8h: gefaelschte NPC-Entscheidungsbelege duerfen keine W5-/W3-Leistung vortaeuschen',()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42);w.npcAutoSetzen(s,true);w.materialSupplySetzen(s,true);
 w.npcMaterialKetteSetzen(s,true);w.advance(s,1);
 pruefen(w,s);
 for(const [key,notice] of [
   ['transport:shipReposition','Ueberfuehrung'],
   ['transport:shipBuy','Kauf'],
   ['werft_extern:stationBuildShip','Werft'],
   ['st_nadir:industrialOreOfferMaterial','Materialvertrag']
 ]){
   const copy=w.load(w.save(s));
   copy.kanon.npc.befehle[key]=1;
   const a=w.audit(copy);
   assert.equal(a.ok,false,'Gefaelschter '+notice+'-Beleg nicht akzeptiert');
   assert.ok(a.fehler.some(e=>/P8h/.test(e)),a.fehler.join('; '));
   assert.throws(()=>w.load(JSON.stringify(copy),{p8gImportFreigegeben:true}),
     /P8h|Audit|audit|verweigert/,
     'Auch nach ausdruecklich freigegebenem Regel207-Import bleibt der geaenderte Wirtschaftsbeleg verboten');
 }
});
test('P8h: Boolean-Aus und Save/Load ohne automatische Migration',()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42);
 w.npcAutoSetzen(s,true);w.materialSupplySetzen(s,true);
 const v=w.hash(s);
 w.npcMaterialKetteSetzen(s,true);
 assert.throws(()=>w.materialSupplySetzen(s,false),/P8h/,
   'NPC-Opt-in darf nicht durch Abschalten des erforderlichen W3-Originalkerns korrupt werden');
 pruefen(w,s);
 const loaded=w.load(w.save(s));
 assert.equal(loaded.kanon.npcMaterialKette,true);
 w.npcMaterialKetteSetzen(loaded,false);
 assert.equal(loaded.kanon.npcMaterialKette,false);
 pruefen(w,loaded);
 assert.notEqual(w.hash(loaded),v,'neue Option existiert nur nach expliziter Aktivierung');
});
