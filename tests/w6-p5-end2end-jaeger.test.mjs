// W6/P5 [ANALYSE] – erster autonom bis zum fertigen J4-Spielerangebot
// produzierter Jaeger aus frischer Rule195->204-Karriere.
// Ohne manuelle NPC-Fremdunterschrift, Siliziumspielerkauf, Startware oder Mint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const P=W6.SZENARIEN.find(x=>x.id==='S02').politik;
test('W6/P5: NPC3-Silizium -> Nadir-J3/J4 -> rechtmaessiger 900-ISK-Spielerjaeger',()=>{
 const {welt:w,s}=W6.start(P);
 w.npcSiliziumSetzen(s,true);
 const start=w.save(s);
 // Hier erfolgen ausdruecklich keine manuellen Firmen-/Bergbau-/Werftbefehle.
 let fertig=false;
 for(let t=0;t<28800;t++){
  if(s.kanon.jaeger.fertig>=1){fertig=true;break;}
  w.minute(s);
 }
 assert.ok(fertig,'J4-Huelle nicht autonom erreicht: '+JSON.stringify({
  tick:s.tick,auftrag:s.kanon.jaeger.auftrag,
  silizium:s.kanon.silizium,bauteile:s.kanon.bauteile,
  lager:s.stations.st_nadir.lager,werft:s.kanon.minerWerft,
  kassen:{npc3:s.owners.npc3.cash,nadir:s.owners.st_nadir.cash,
   werft:s.owners.werft_extern.cash,aldera:s.owners.st_aldera.cash},
  pausen:Object.entries(s.kanon.npc.pausen).slice(-12)}));
 const r=w.rules,n=s.kanon.npc.befehle;
 assert.ok((s.kanon.silizium.verkauft||0)>=8,'Silizium aus bezahltem NPC3-Verkauf');
 assert.ok((n['npc3:siliconSell']||0)>=1,'Silizium darf nicht erfunden sein');
 assert.ok((n['st_nadir:stationBuildParts']||0)>=8,'acht echte Nadir-J3-Auftraege');
 assert.equal(n['st_nadir:stationBuildFighter'],1,'ein originaler finanzierten Nadir-Jaeger');
 assert.equal(s.kanon.jaeger.fertig,1);
 assert.equal(s.kanon.jaeger.bauteileVerbraucht,r.j4.bauteile);
 assert.equal(s.kanon.jaeger.lohnBezahlt,r.j4.dauer*r.j4.lohnJeMinute);
 assert.equal(s.kanon.bauteile.siliziumVerbraucht,s.kanon.bauteile.begonnen*r.j3.silizium);
 assert.equal(s.stations.st_nadir.lager.jaeger,1,'echt produzierte physische Huelle');
 assert.equal(s.owners.house.cash,3000);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const vorKauf=w.save(s),vorKaufHash=w.hash(s),tick=s.tick;
 const replay=w.load(start);
 w.advance(replay,tick);
 assert.equal(w.canonical(replay),w.canonical(s),'autonome komplette Industrie-Endlage gleich');
 assert.equal(w.hash(replay),vorKaufHash);
 const geldVor=s.owners.st_nadir.cash, schiffeVor=new Set(Object.keys(s.ships));
 const gekauft=w.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'});
 assert.equal(gekauft.ok,true,JSON.stringify(gekauft));
 const fighter=Object.values(s.ships).find(sh=>!schiffeVor.has(sh.id));
 assert.ok(fighter&&fighter.klasse==='jaeger'&&fighter.owner==='house');
 assert.equal(s.owners.house.cash,2100);
 assert.equal(s.owners.st_nadir.cash-geldVor,900);
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 assert.equal(s.ledger.jaeger.consumed,1);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 console.log('W6_P5_END2END_FIGHTER',JSON.stringify({
  tick,vorKaufHash,nachKaufHash:w.hash(s),fighter:fighter.id,
  siliziumNpc3:s.kanon.silizium.verkauft,
  bauteile:s.kanon.bauteile.abgeschlossen,jaeger:s.kanon.jaeger.fertig,
  weltgeld:33000,haus:s.owners.house.cash,mint:s.minted,burn:s.burned,
  vonSpielerAbgeholterJ4Jaeger:true}));
});
