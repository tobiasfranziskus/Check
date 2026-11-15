// W6 [DRAFT] – opt-in NPC-Firmenpolitik im EINEN Regel204-Weltkern.
// Keine manuellen Eigentümerbefehle nach dem Start: nur gespeicherte Politik, gemeinsamer Tick.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const ERSATZ=W6.SZENARIEN.find(x=>x.id==='S02').politik;

function frisch(){
 const sitzung=J8.erstellen();
 sitzung.starten195(OLD.create(42,'private195').export(),true);
 const w=sitzung.weltReferenz();
 return {w,s:w.load(sitzung.exportieren())};
}
function sauber(w,s){assert.deepEqual(W6.pruefen(w,s),[]);}
function laufen(w,s,minuten,raster=240){
 for(let rest=minuten;rest>0;rest-=raster){w.advance(s,Math.min(raster,rest));sauber(w,s);}
}
const schiffe=(s,klasse)=>Object.values(s.ships).filter(sh=>sh.klasse===klasse).length;

test('W6: ohne Aktivierung bleiben Regel204-Welt und K7-Forschungsautomatik bitgleich zu main 17090ec',()=>{
 const {w,s}=frisch();
 assert.equal(w.hash(s),'674400c1d181fcf2');
 w.advance(s,1440);
 assert.equal(w.hash(s),'bfccd599a06678b8');
 assert.equal(s.kanon.npc,undefined);assert.equal(s.kanon.npcAuto,undefined);
 const b=frisch();
 b.w.industrieAutoSetzen(b.s,true);b.w.advance(b.s,1440);
 assert.equal(b.w.hash(b.s),'cc7f8b0fa9058fb6');
 assert.equal(b.s.kanon.npc,undefined);
});

test('W6/P0: autonomer finanzierter Eis-Wasser-Lohn-Kreislauf ohne manuellen Eigentümerbefehl, Save/Load/Replay',()=>{
 const {welt:w,s}=W6.start({});
 const start=w.save(s);
 laufen(w,s,2000);
 const mitte=w.save(s);
 laufen(w,s,4320-2000);
 const b=w.bericht(s);
 // Nur die Bergbaufirma hat disponiert; jede Entscheidung ist ein vom Kern angenommener Eigenbefehl.
 assert.deepEqual(Object.keys(s.kanon.npc.befehle).sort(),['npc3:shipShuttle','npc3:shipShuttleStop']);
 assert.deepEqual(s.kanon.npc.abgelehnt,{});
 assert.ok(b.produktion.eisGefoerdert>=500&&b.produktion.wasserProduziert>=500);
 assert.ok(b.auftraege.eisfrachten>=10&&b.verkaeufe.wasserErloes>0&&b.dividenden>0);
 assert.equal(s.w3.abgeschlossen,1,'ein vollständig signierter K7-Erzvertrag');
 assert.equal(s.w5.fertig,1);assert.equal(s.ledger.frachter.produced,1);
 // Spieler unberührt: kein Befehl, kein Schiff, volles Sparguthaben.
 assert.equal(s.owners.house.cash,3000);
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house').length,0);
 const hash=w.hash(s);
 assert.equal(hash,'6cd006c9718db0fb');
 // Replay aus Startstand und Fortsetzung aus Zwischenstand liefern denselben Zustand.
 const r=w.load(start);w.advance(r,4320);assert.equal(w.hash(r),hash);
 const f=w.load(mitte);w.advance(f,4320-2000);assert.equal(w.hash(f),hash);
 assert.equal(w.hash(w.load(w.save(s))),hash);
 console.log('W6_P0',JSON.stringify({tick:s.tick,hash,eis:b.produktion.eisGefoerdert,wasser:b.produktion.wasserProduziert,
  wasserErloes:b.verkaeufe.wasserErloes,eisfrachten:b.auftraege.eisfrachten,dividenden:b.dividenden,weltgeld:b.weltgeld}));
});

test('W6/P2+P3: Erz→Material→Frachter/Miner und Ersatzkäufe aus eigenen Kassen über 10 Tage',()=>{
 const {welt:w,s}=W6.start(ERSATZ);
 laufen(w,s,14400);
 const r=w.rules,mw=s.kanon.minerWerft;
 assert.ok(s.w5.fertig>=4&&mw.fertig>=3&&s.kanon.ersatzkaeufe>=8);
 // Physische Kette: jede Hülle aus real raffiniertem Material, jedes Material aus geliefertem Erz.
 assert.equal(s.ledger.material.produced,s.w4.materialErzeugt);
 assert.equal(s.w4.erzVerbraucht,s.w4.begonnen*r.w4.erzJeCharge);
 assert.equal(s.ledger.erz.consumed,s.w4.erzVerbraucht);
 assert.ok(s.w3.geliefert>=s.w4.erzVerbraucht,'nur über signierte Verträge geliefertes Erz');
 assert.equal(s.ledger.material.consumed,s.w5.materialVerbraucht+mw.materialVerbraucht);
 assert.equal(s.w5.materialVerbraucht,s.w5.begonnen*r.w5.material);
 assert.equal(s.ledger.frachter.produced,s.w5.fertig);
 assert.equal(s.ledger.miner.produced,mw.fertig);
 // Finanzierung: Material und Arbeit je Hülle vollständig von der Werft bezahlt.
 assert.equal(s.w5.materialUmsatz,s.w5.begonnen*r.w5.material*r.w5.materialPreis);
 assert.equal(s.w5.arbeitsGezahlt,s.w5.fertig*r.w5.dauer*r.w5.lohnJeMinute);
 const summe=art=>Object.entries(s.kanon.buch.summen).filter(([k])=>k.split('|')[0]===art).reduce((n,[,v])=>n+v,0);
 assert.equal(summe('miner-material'),mw.begonnen*r.w5.material*r.w5.materialPreis);
 assert.equal(summe('miner-arbeitslohn'),mw.fertig*r.w5.dauer*r.w5.lohnJeMinute);
 assert.equal(summe('k7-werftreserve'),summe('k7-werftreserve-ausloesen'));
 assert.equal(s.owners.k7_werft_treuhand.cash,0);
 // Jede im Umlauf befindliche Hülle wurde dem Lager durch einen bezahlten Kauf entnommen.
 assert.equal(schiffe(s,'frachter'),s.ledger.frachter.consumed);
 assert.equal(schiffe(s,'miner'),s.ledger.miner.consumed);
 assert.ok(Object.values(s.ships).every(sh=>['npc3','transport'].includes(sh.owner)));
 assert.equal(w.hash(s),'ec4cfa29a8a6ca8f');
 console.log('W6_ERSATZ',JSON.stringify({tick:s.tick,hash:w.hash(s),frachter:s.w5.fertig,miner:mw.fertig,
  ersatz:s.kanon.ersatzkaeufe,erzvertraege:s.w3.abgeschlossen,material:s.w4.materialErzeugt}));
});

// Negative Finanzierungsfälle. Die Kassenverschiebung im Arbeitsspeicher ist KEIN Spielweg,
// sondern stellt nur einen unterfinanzierten Akteur her (Summe bleibt 33.000 ISK).
function ruhend(){
 const {w,s}=frisch();
 w.advance(s,10080); // Exportetat verbraucht, beide NPC-Miner frei am Dock, kein Wasser
 assert.equal(s.owners.export.cash,0);
 w.npcAutoSetzen(s,true);
 return {w,s};
}
test('W6 negativ: ohne gedeckte Abnahme oder eigenes Betriebskapital startet keine Förderung',()=>{
 const ok=ruhend();
 ok.w.advance(ok.s,1);
 assert.equal(ok.s.kanon.npc.befehle['npc3:shipShuttle'],1,'Kontrollfall: finanzierte Förderung startet');
 const a=ruhend();
 a.s.owners.eigner_st_aldera.cash+=a.s.owners.st_aldera.cash-200;a.s.owners.st_aldera.cash=200;
 a.w.advance(a.s,180);
 assert.equal(a.s.kanon.npc.befehle['npc3:shipShuttle'],undefined);
 assert.equal(a.s.w5n.eisAbgebaut,0);assert.equal(a.s.owners.st_aldera.cash,200);
 const b=ruhend();
 b.s.owners.eigner_npc3.cash+=b.s.owners.npc3.cash-50;b.s.owners.npc3.cash=50;
 b.w.advance(b.s,180);
 assert.equal(b.s.kanon.npc.befehle['npc3:shipShuttle'],undefined);
 assert.equal(b.s.kanon.npc.pausen['npc3: Eisförderung nicht vorfinanziert'],180);
 assert.equal(b.s.w5n.eisAbgebaut,0);assert.equal(b.s.owners.npc3.cash,50);
 for(const x of [a,b])assert.equal(Object.values(x.s.owners).reduce((n,o)=>n+o.cash,0),33000);
});

test('W6 negativ: fremde Befehle, unbelegte Ware und manipulierte Stände werden abgewiesen',()=>{
 const {w,s}=ruhend();
 for(const cmd of [
  {type:'shipShuttle',owner:'house',schiff:'sh001',ware:'eis'},
  {type:'shipShuttle',owner:'transport',schiff:'sh001',ware:'eis'},
  {type:'shipBuy',owner:'npc3',klasse:'miner',station:'st_aldera',preis:0},
  {type:'industrialOreAcceptMine',owner:'transport'},
  {type:'dividendPay',owner:'npc3',betrag:w.ausschuettbar(s,'npc3')+1}]){
  const vor=w.hash(s),r=w.execute(s,cmd);
  assert.equal(r.ok,false,JSON.stringify(cmd));assert.equal(w.hash(s),vor);
 }
 assert.throws(()=>w.npcAutoSetzen(s,'ja'));
 // Ohne real geliefertes Silizium beginnt Nadir keine Bauteile; nicht gefördertes Lager
 // (nur im Arbeitsspeicher herstellbar) ist weder speicher- noch ladbar.
 w.advance(s,30);
 assert.equal(s.kanon.bauteile.begonnen,0);assert.equal(s.kanon.jaeger.begonnen,0);
 const falsch=w.load(w.save(s));
 falsch.stations.st_nadir.lager.silizium=8;falsch.stations.st_nadir.lager.material=20;
 assert.equal(w.audit(falsch).ok,false);
 assert.throws(()=>w.save(falsch));
 // Manipulierte Speicherstände.
 const gut=ruhend();gut.w.advance(gut.s,600);sauber(gut.w,gut.s);
 const json=gut.w.save(gut.s);
 for(const aendern of [
  x=>{x.owners.npc3.cash+=1;},
  x=>{x.kanon.npcAuto='ja';},
  x=>{x.kanon.npc.befehle['house:shipBuy']=-1;},
  x=>{delete x.kanon.npc;},
  x=>{x.stations.st_aldera.lager.eis+=50;}]){
  const x=JSON.parse(json);aendern(x);
  assert.throws(()=>gut.w.load(JSON.stringify(x)));
 }
 assert.equal(gut.w.hash(gut.w.load(json)),gut.w.hash(gut.s));
});

test('W6/P2: nach echter Siliziumlieferung fertigt Nadir eigenständig Bauteile und einen Jäger; 900-ISK-Kauf',()=>{
 const {welt:w,s}=W6.start(ERSATZ);
 const warte=(bedingung,grenze,was)=>{
  for(let i=0;i<grenze;i++){if(bedingung())return;w.minute(s);}
  assert.fail(was+' nicht erreicht bis Tick '+s.tick);
 };
 const spieler=cmd=>{const r=w.execute(s,{...cmd,owner:'house'});assert.equal(r.ok,true,JSON.stringify({cmd,r}));sauber(w,s);};
 // Offene Produktlücke: Es gibt keinen Spielerbefehl für einen Werftauftrag. Wie in #374 schließen
 // Nadir, Werft und Käufer den Kundenauftrag hier ausdrücklich; jede Firma nutzt nur ihren Originalbefehl.
 const nadir=s.stations.st_nadir.lager,mw=()=>s.kanon.minerWerft;
 warte(()=>(s.stations.st_aldera.lager.miner||0)===0&&!s.w4.auftrag&&!s.w5.auftrag&&!mw()?.auftrag
  &&!mw()?.wartetAuf&&!mw()?.transport&&((nadir.material||0)>=5||(nadir.erz||0)>=10),6000,'freie Werft mit Erz/Material');
 if((nadir.material||0)<5){
  const raff=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  assert.equal(raff.ok,true,JSON.stringify(raff));
  warte(()=>!s.w4.auftrag,60,'bezahlte Raffineriecharge');
 }
 const bau=w.execute(s,{type:'stationBuildMiner',owner:'werft_extern',station:'st_nadir',besteller:'house'});
 assert.equal(bau.ok,true,JSON.stringify(bau));
 warte(()=>(nadir.miner||0)===1&&mw().wartetAuf==='house',100,'bezahlte Minerhülle');
 const vorher=new Set(Object.keys(s.ships));
 spieler({type:'stationClaimMinerLocal',station:'st_nadir'});
 const miner=Object.keys(s.ships).find(id=>!vorher.has(id));
 assert.equal(s.owners.house.cash,2400);
 for(let fahrt=0;fahrt<2;fahrt++){
  spieler({type:'siliconMineStart',schiff:miner});
  spieler({type:'shipUndock',schiff:miner});
  w.minute(s);
  spieler({type:'shipFlyTo',schiff:miner,x:w.siliziumFeld.x,y:w.siliziumFeld.y});
  warte(()=>s.kanon.silizium.auftrag?.gefoerdert===8,400,'Siliziumcharge');
  spieler({type:'shipDock',schiff:miner,station:'st_nadir'});
  warte(()=>s.ships[miner].flug.lage==='angedockt',200,'Rückkehr');
  spieler({type:'siliconSell',schiff:miner});
 }
 assert.equal(s.kanon.silizium.verkauft,16);assert.equal(s.kanon.silizium.vorrat,0,'Feld erschöpft: höchstens zwei Jäger');
 // Ab hier kein weiterer Befehl von außen: Raffinerie, Bauteile und Jäger entscheidet st_nadir.
 warte(()=>nadir.jaeger>=1,8000,'Jägerhülle');
 const n=s.kanon.npc.befehle,j=s.kanon.jaeger,b=s.kanon.bauteile,r=w.rules;
 assert.equal(n['st_nadir:stationBuildFighter'],1);
 assert.ok(n['st_nadir:stationBuildParts']>=8&&n['st_nadir:stationRefine']>=1);
 assert.equal(j.fertig,1);assert.equal(j.bauteileVerbraucht,r.j4.bauteile);assert.equal(j.lohnBezahlt,r.j4.dauer*r.j4.lohnJeMinute);
 assert.equal(b.materialVerbraucht,b.begonnen*r.j3.material);assert.equal(b.siliziumVerbraucht,b.begonnen*r.j3.silizium);
 sauber(w,s);
 const kasse=s.owners.house.cash,nadirKasse=s.owners.st_nadir.cash;
 spieler({type:'shipBuy',station:'st_nadir',klasse:'jaeger'});
 assert.equal(kasse-s.owners.house.cash,900);assert.equal(s.owners.st_nadir.cash-nadirKasse,900);
 assert.equal(nadir.jaeger,0);assert.equal(schiffe(s,'jaeger'),1);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.equal(w.hash(s),'cde4420bfd656e56');
 console.log('W6_JAEGER',JSON.stringify({tick:s.tick,hash:w.hash(s),bauteile:b.abgeschlossen,jaeger:j.fertig,
  haus:s.owners.house.cash,nadir:s.owners.st_nadir.cash,befehle:n}));
});
