import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
test('U7/U8 J8: separate 48-round manager copy, NPC offer, house consent, paid return and restart',()=>{
 const old=engpassNach48(),original=old.exportieren();
 const j=J8.erstellen();
 assert.throws(()=>j.oeffnenU7U8(original,false));
 const view=j.oeffnenU7U8(original,true);
 assert.equal(view.transportForschung,true);
 assert.equal(view.quelleHash,'f63f2cd09ba5a88c');
 const s=()=>j.zustandReferenz(),w=j.weltReferenz();
 const check=()=>assert.deepEqual(pruefen(w,s()),[]);
 const yes=id=>{const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);check();};
 const until=(pred,limit,label)=>{
  for(let i=0;i<limit&&!pred();i++)j.weiterspielen(1);
  assert.ok(pred(),label+' @ '+s().tick+' '+JSON.stringify({i:s().kanon.industrieErz,a:s().w3.auftrag,aldera:s().owners.st_aldera.cash,nadir:s().owners.st_nadir.cash,werft:s().owners.werft_extern.cash}));
  check();
 };
 const initial=j.exportieren();
 for(const id of ['industrialOreOffer','industrialOreCommit','industrialOreAcceptMine','industrialWaterBackhaul','industry-accept-sh999']){
  assert.equal(j.ausfuehren(id).ok,false);
  assert.equal(j.exportieren(),initial);
 }
 yes('stop-sh004');yes('stop-sh005');
 until(()=>j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok),240,'actual NPC offer');
 const i=s().kanon.industrieErz;
 assert.equal(i.signMiner,true);assert.equal(i.signWerft,true);assert.equal(i.signFracht,false);
 assert.equal(s().w3.auftrag,null);
 const offered=j.exportieren();
 assert.equal(w.execute(s(),{type:'industrialOreAcceptFreight',owner:'transport'}).ok,false);
 assert.equal(w.execute(s(),{type:'industrialOreAcceptYard',owner:'house'}).ok,false);
 assert.equal(j.exportieren(),offered);
 // No automatic transport dispatch before the house's consent.
 assert.equal(j.ausfuehren('industry-accept-sh999').ok,false);
 assert.equal(j.exportieren(),offered);
 yes('industry-accept-sh003');
 const signed=j.exportieren();
 assert.equal(j.ausfuehren('industry-accept-sh003').ok,false);
 assert.equal(j.exportieren(),signed,'second tap cannot duplicate consent');
 j.weiterspielen(1);
 assert.equal(s().w3.auftrag?.carrier,'house');
 yes('industry-water-sh003');
 const checkpoint=j.exportieren();
 assert.equal(j.ausfuehren('industry-water-sh003').ok,false);
 assert.equal(j.ausfuehren('freight-sh003').ok,false);
 assert.equal(j.exportieren(),checkpoint,'no double backhaul or parallel ice reservation');
 assert.throws(()=>J8.erstellen().oeffnen204(checkpoint,true),/U8/);
 assert.throws(()=>J8.erstellen().oeffnenU7U8(checkpoint,false));
 const resumed=J8.erstellen();resumed.oeffnenU7U8(checkpoint,true);
 // No dependence on selecting the exact arrival minute in the UI.
 for(let n=0;n<10&&s().w3.auftrag;n++){j.weiterspielen(60);resumed.weiterspielen(60);}
 assert.equal(j.exportieren(),resumed.exportieren());
 assert.equal(s().w3.abgeschlossen,1);
 assert.equal(s().w5ad.freight.at(-1).owner,'house');
 assert.ok(s().kanon.wasser.rueckGeliefert>1414,'actual water delivery');
 assert.equal(s().owners.w3_arbeit_treuhand.cash,0);
 assert.equal(s().owners.w3_kauf_treuhand.cash,0);
 // The signed 530 ISK shipyard reserve must have reached the original
 // production chain, not remain frozen after the freight closes.
 for(let n=0;n<10&&s().w5.fertig<1;n++){j.weiterspielen(60);resumed.weiterspielen(60);}
 assert.equal(j.exportieren(),resumed.exportieren());
 assert.equal(s().w5.fertig,1,'real paid W5 hull');
 assert.equal(s().owners.k7_werft_treuhand.cash,0);
 assert.equal(s().owners.w5_arbeit_treuhand.cash,0);
 assert.equal(s().w4.erzVerbraucht,w.rules.w4.erzJeCharge);
 assert.equal(s().w4.materialErzeugt,w.rules.w4.materialJeCharge);
 assert.equal(s().w4.gezahlt,w.rules.w4.dauer*w.rules.w4.lohnJeMinute);
 assert.equal(s().owners.w4_arbeit_treuhand.cash,0);
 assert.equal(s().w5.materialVerbraucht,w.rules.w5.material);
 assert.equal(s().w5.arbeitsGezahlt,w.rules.w5.dauer*w.rules.w5.lohnJeMinute);
 assert.equal(s().kanon.industrieErz.werftVerwendet,true);
 assert.equal(s().ledger.frachter.produced,1);
 assert.ok(s().w5.verkauft+(s().stations.st_nadir.lager.frachter||0)>=1);
 assert.equal(s().kanon.industrieAuto,undefined);
 assert.notEqual(s().kanon.npcAuto,true);
 check();assert.equal(old.exportieren(),original);
 console.log('M4_U7_U8_J8_WERFT',JSON.stringify({tick:s().tick,hull:s().w5.fertig,sold:s().w5.verkauft,available:s().stations.st_nadir.lager.frachter,materials:s().w5.materialVerbraucht,wages:s().w5.arbeitsGezahlt,hash:j.ansicht().hash}));
 console.log('M4_U7_U8_J8_MANAGER',JSON.stringify({tick:s().tick,hash:j.ansicht().hash,water:s().kanon.wasser.rueckGeliefert-1414,house:s().owners.house.cash}));

 const fertig=j.exportieren();
 const ungueltig=JSON.parse(fertig);
 ungueltig.kanon.industrieErz.signWerft=false;
 assert.throws(()=>J8.erstellen().oeffnenU7U8(JSON.stringify(ungueltig),true),/Abschluss ohne Zustimmungen/);
 assert.equal(s().w5.schiffIds.length,1);
 const fremd=s().w5.schiffIds[0];
 assert.equal(s().ships[fremd].owner,'transport');
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,false,'NPC purchase already consumed real offer');
 assert.equal(j.ausfuehren('reposition-'+fremd).ok,false);
 assert.equal(j.exportieren(),fertig);

});

test('M4 #575: S02 house buys real W5 stock, ferries it and completes a paid follow-up',()=>{
 const {marktS02,lauf}=require('../tools/m4-management-szenarien.cjs');
 const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
 const {welt:w,s}=marktS02();
 const start=w.save(s),j=J8.erstellen();
 j.oeffnenU7U8(start,true);
 const z=()=>j.zustandReferenz(),yes=id=>assert.equal(j.ausfuehren(id).ok,true,id);
 assert.equal(z().w5.fertig,1);
 assert.equal(z().stations.st_nadir.lager.frachter,1);
 assert.equal(z().owners.house.cash,3000);
 yes('buy-st_nadir-frachter');
 const kauf=z().kanon.spielerFrachterKaeufe.at(-1),gekauft=j.exportieren();
 assert.equal(kauf.preis,750);
 assert.equal(z().owners.house.cash,2250);
 assert.equal(z().ships[kauf.id].owner,'house');
 assert.equal(z().ships[kauf.id].flug.lage,'angedockt');
 assert.equal(z().stations.st_nadir.lager.frachter,0);
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,false);
 assert.equal(j.exportieren(),gekauft);
 j.weiterspielen(60);
 yes('reposition-'+kauf.id);
 const unterwegs=j.exportieren(),probe=w.load(unterwegs);
 const spedition=Object.values(probe.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 for(const type of ['shipFreightIce','shipFreight']){
  const r=w.execute(probe,{type,owner:spedition.owner,schiff:spedition.id});
  assert.match(r.reason,/Strecke durch Überführung/);
  assert.equal(w.save(probe),unterwegs,'cross-ship race must be atomic');
 }
 const resumed=J8.erstellen();
 resumed.oeffnenU7U8(unterwegs,true);
 for(const sitzung of [j,resumed]){
  const ok=id=>assert.equal(sitzung.ausfuehren(id).ok,true,id);
  sitzung.weiterspielen(60);
  const ankunft=sitzung.zustandReferenz();
  assert.equal(ankunft.ships[kauf.id].system,'aldera');
  assert.equal(ankunft.w5ac.completed.find(x=>x.id===kauf.id).kosten,60);
  assert.equal(ankunft.owners.w5ac_transfer_reserved.cash,0);
  ok('buy-st_aldera-miner');sitzung.weiterspielen(60);
  const miner=Object.values(sitzung.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
  ok('ice-'+miner.id);
  for(let i=0;i<6&&!sitzung.angebote().find(x=>x.id==='freight-'+kauf.id)?.ok;i++)sitzung.weiterspielen(60);
  ok('freight-'+kauf.id);sitzung.weiterspielen(60);sitzung.weiterspielen(60);
 }
 assert.equal(j.exportieren(),resumed.exportieren());
 const beleg=z().kanon.spielerFrachten.auftraege.at(-1);
 assert.equal(beleg.schiff,kauf.id);
 assert.equal(beleg.menge,50);
 assert.equal(beleg.fracht,240);assert.equal(beleg.arbeit,120);
 assert.ok(beleg.end>beleg.geliefert);
 // The same minute may legitimately open an independent NPC reservation.
 const nachfolger=z().w5n.frachtauftrag;
 assert.notEqual(nachfolger?.schiff,kauf.id);
 const rest=nachfolger?(2*nachfolger.zeit-nachfolger.gearbeitet)*w.rules.w5n.fliegerLohn:0;
 assert.equal(z().owners.w5n_fracht_arbeit.cash,rest);
 assert.equal(z().owners.w5n_fracht_kauf.cash,nachfolger
   ? nachfolger.phase==='hin' ? nachfolger.gesamt : nachfolger.fracht
   : 0);
 assert.deepEqual(pruefen(w,z()),[]);
 assert.equal(w.save(s),start);
 const s02=SZENARIEN.find(x=>x.id==='S02');
 const tag7=lauf(s02,7,42,true);
 assert.deepEqual(tag7,lauf(s02,7,42,true),'same management decisions replay byte-for-byte');
 assert.equal(tag7.ergebnis,'WERFTKAUF_MIT_FOLGEAUFTRAG');
 assert.ok(tag7.folgefahrten.some(x=>x.schiff===kauf.id));
 console.log('M4_575_S02_HAUS_WERFT',JSON.stringify({kauf,beleg,hash:j.ansicht().hash,tag7:tag7.verlauf[0].hash}));
});
