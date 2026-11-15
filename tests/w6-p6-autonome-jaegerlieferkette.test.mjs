// W6/P6 [ANALYSE] – echter autonomer NPC3->Nadir->J3->J4->Spielerkauf-Pfad.
// Ausschliesslich P5-Opt-in; unveraenderte Originalrechte, Materialrezepte und Preise.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const P=W6.SZENARIEN.find(x=>x.id==='S02').politik;

const audit=(w,s)=>{
 assert.deepEqual(W6.pruefen(w,s),[],'unabhaengige Geld-/Waren-/Eigentumspruefung');
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
};
const werte=(w,s)=>({
 tick:s.tick,hash:w.hash(s),weltgeld:Object.values(s.owners).reduce((a,x)=>a+x.cash,0),
 npcSilizium:s.kanon.npcSilizium,silizium:s.kanon.silizium.verkauft,
 rest:s.kanon.silizium.vorrat,bauteile:s.kanon.bauteile.abgeschlossen,
 jaeger:s.kanon.jaeger.fertig,wartet:s.kanon.jaeger.auftrag,
 material:s.stations.st_nadir.lager.material,erz:s.stations.st_nadir.lager.erz,
 siliziumLager:s.stations.st_nadir.lager.silizium,
 bauteileLager:s.stations.st_nadir.lager.bauteil,jaegerLager:s.stations.st_nadir.lager.jaeger,
 werft:s.owners.werft_extern.cash,nadir:s.owners.st_nadir.cash,npc3:s.owners.npc3.cash,
 stockWerft:s.stations.st_nadir.lager.miner,ersatz:s.kanon.ersatzkaeufe,
 pausengrund:Object.entries(s.kanon.npc.pausen).sort((a,b)=>b[1]-a[1]).slice(0,5)
});

test('W6/P6: originale autonom finanzierte NPC-Siliziumkette erzeugt mindestens einen fertigen J4-Jaeger',()=>{
 const {welt:w,s}=W6.start(P);
 assert.equal(s.kanon.npcSilizium,undefined,'Opt-in ist nicht produktiv aktiviert');
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 const beginn=w.save(s);
 const grenze=30*1440,pruefraster=120;
 let zwischen=null;
 while(s.tick<grenze&&s.kanon.jaeger.fertig===0) {
  w.advance(s,Math.min(pruefraster,grenze-s.tick));
  if(s.tick===7200)zwischen=w.save(s);
  if(s.tick%1440===0)audit(w,s);
 }
 const vorher=werte(w,s);
 console.log('W6_P6_NPC_JAEGER_BIS_30',JSON.stringify(vorher));
 audit(w,s);
 assert.ok(s.kanon.jaeger.fertig>=1,
  'Nach 30 Tagen keine autonome J4-Produktion: '+JSON.stringify(vorher));
 assert.ok(s.kanon.silizium.verkauft>=8,'erste reale Siliziumcharge von npc3');
 assert.ok(s.kanon.bauteile.abgeschlossen>=8,'acht finanzierte Original-J3-Bauteile');
 assert.ok(s.kanon.npc.befehle['npc3:stationClaimMinerLocal']>=1);
 assert.ok(s.kanon.npc.befehle['npc3:siliconSell']>=1);
 assert.ok(s.kanon.npc.befehle['st_nadir:stationBuildParts']>=8);
 assert.ok(s.kanon.npc.befehle['st_nadir:stationBuildFighter']>=1);
 assert.deepEqual(s.kanon.npc.abgelehnt,{},'kein unerlaubter Eigenbefehl');
 assert.equal(s.owners.house.cash,3000,'keine Spielergeldentnahme');
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house').length,0,
  'vor dem Kauf kein Gratisjaeger');
 const j4=w.rules.j4,aktion=s.kanon.jaeger;
 assert.equal(aktion.lohnBezahlt,aktion.fertig*j4.dauer*j4.lohnJeMinute);
 assert.equal(aktion.bauteileVerbraucht,aktion.begonnen*j4.bauteile);
 assert.equal(s.ledger.jaeger.produced,aktion.fertig);
 assert.equal(s.stations.st_nadir.lager.jaeger,aktion.fertig-aktion.verkauft);
 const lagervor=s.stations.st_nadir.lager.jaeger;
 const iskvor=s.owners.st_nadir.cash;
 const kauf=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
 assert.equal(kauf.ok,true,'Originalkauf verweigert: '+JSON.stringify(kauf));
 assert.equal(s.owners.house.cash,2100,'900-ISK-Kauf aus Spielerhand');
 assert.equal(s.owners.st_nadir.cash,iskvor+900,'echte Gegenbuchung bei Nadir');
 assert.equal(s.stations.st_nadir.lager.jaeger,lagervor-1,'physische Huelle entnommen');
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='jaeger').length,1);
 audit(w,s);
 const hash=w.hash(s);
 assert.equal(w.hash(w.load(w.save(s))),hash,'J4-Kauf ist Save/Load-fest');
 const historie=s.kanon.jaeger.kaeufe.at(-1);
 assert.equal(historie.owner,'house');assert.equal(historie.preis,900);
 console.log('W6_P6_SPIELER_JAEGER_KAUF',JSON.stringify({tick:s.tick,hash,beleg:historie,
  preis:900,weltgeld:33000,spieler:s.owners.house.cash,restFeld:s.kanon.silizium.vorrat}));
 // Das S02-Start-JSON bleibt nach einer neuen Separatsimulation unveraendert.
 const wieder=w.load(beginn);
 w.advance(wieder,Math.min(7200,s.tick));
 audit(w,wieder);
 if(zwischen)assert.equal(w.canonical(wieder),w.canonical(w.load(zwischen)),
   'Dateifortsetzung bis Tag 5 identisch');
});

test('W6/P6: ohne das neue Silizium-Opt-in bleibt der S02-Originalpfad unangetastet',()=>{
 const {welt:w,s}=W6.start(P);
 assert.equal(s.kanon.npcSilizium,undefined);
 w.advance(s,2000);
 assert.equal(s.kanon.silizium.verkauft,0);
 assert.equal(s.kanon.npc.befehle['npc3:siliconSell'],undefined);
 assert.equal(s.owners.house.cash,3000);
 audit(w,s);
});

test('W6/P6+S02: 90 Tage mit echter J4-Spielerabnahme erhalten bezahlte Eis-/Wasser-/Ersatzkreise',()=>{
 const {welt:w,s}=W6.start(P);
 w.npcSiliziumSetzen(s,true);
 let gekauft=false,mitte=null,wertTag60=null,wertTag90=null;
 const TAGESMINUTEN=1440,ende=90*TAGESMINUTEN,raster=120;
 for(let t=raster;t<=ende;t+=raster){
  w.advance(s,raster);
  if(!gekauft && (s.stations.st_nadir.lager.jaeger||0)>0){
   const kasse=s.owners.house.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(r.ok,true,JSON.stringify(r));
   assert.equal(kasse-s.owners.house.cash,900);
   gekauft=true;
  }
  if(s.tick%(15*TAGESMINUTEN)===0){
   audit(w,s);
   if(s.tick===45*TAGESMINUTEN)mitte=w.save(s);
   if(s.tick===60*TAGESMINUTEN)wertTag60=W6.kennzahlen(w,s);
   if(s.tick===90*TAGESMINUTEN)wertTag90=W6.kennzahlen(w,s);
  }
 }
 assert.equal(s.tick,ende);
 assert.equal(gekauft,true,'ohne J4-Huelle kein nachweisbarer originaler 900-ISK-Spielerkauf');
 assert.equal(s.owners.house.cash,2100,'Spieler spart den restlichen Betrag frei');
 assert.equal(Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='jaeger').length,1);
 assert.ok(s.kanon.silizium.gefoerdert<=w.rules.j2b.feld.vorrat,
   'Endlicher physischer Siliziumvorrat darf nie ueberzogen werden');
 assert.ok(s.kanon.jaeger.fertig>=1);
 assert.ok(s.kanon.ersatzkaeufe>20,'echte Ersatzwirtschaft auch nach Spieler-Jaegerkauf');
 assert.ok(wertTag60&&wertTag90&&mitte,'vollstaendige 45/60/90-Tage-Checkpointfolge');
 for(const feld of ['eis','wasserErloes','loehne','ersatz']){
  assert.ok(wertTag90[feld]>wertTag60[feld],
    'kein fortgesetzter, finanzierter '+feld+'-Kreislauf Tag 60-90: '+JSON.stringify({tag60:wertTag60,tag90:wertTag90}));
 }
 assert.deepEqual(s.kanon.npc.abgelehnt,{});
 const endHash=w.hash(s);
 const fortsetzung=w.load(mitte);
 w.advance(fortsetzung,45*TAGESMINUTEN);
 audit(w,fortsetzung);
 assert.equal(w.canonical(fortsetzung),w.canonical(s),'45→90 Save/Load gegen direkten 90-Tage-Pfad');
 assert.equal(w.hash(fortsetzung),endHash);
 console.log('W6_P6_S02_90_TAGE',JSON.stringify({
  tag:90,hash:endHash,autonomJ4:s.kanon.jaeger.fertig,
  originaleSpielerkaeufe:s.kanon.jaeger.kaeufe.length,
  siliziumGefoerdert:s.kanon.silizium.gefoerdert,
  siliziumVorrat:s.kanon.silizium.vorrat,ersatz:s.kanon.ersatzkaeufe,
  tag60:{eis:wertTag60.eis,wasserErloes:wertTag60.wasserErloes,
   loehne:wertTag60.loehne,ersatz:wertTag60.ersatz},
  tag90:{eis:wertTag90.eis,wasserErloes:wertTag90.wasserErloes,
   loehne:wertTag90.loehne,ersatz:wertTag90.ersatz},
  weltgeld:33000,mint:0,burn:0,spieler:s.owners.house.cash}));
});
