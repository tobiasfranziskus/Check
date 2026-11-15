// J10b – RESEARCH ONLY. No NPC policy is enabled in the shipped game.
// Original owner-specific commands, no grant/spawn/teleport; compare pre- and post-pendel timing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const J6=require('../prototypes/j6w/wirtschaft.js');
const J10=require('../prototypes/verbund/jaeger-werft-lage.js');
const initial195=OLD.create(42,'private195').export();

function start(){
 const session=J8.erstellen();
 session.starten195(initial195,true);
 const welt=session.weltReferenz(),s=welt.load(session.exportieren());
 assert.equal(welt.audit(s).ok,true);
 assert.equal(s.rulesVersion,204);
 assert.equal(s.tick,0);
 return {welt,s,source:session.exportieren()};
}
function audits(w,s){
 const a=w.audit(s);
 assert.equal(a.ok,true,JSON.stringify(a.fehler));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const [ware,entry] of Object.entries(s.ledger)){
  const physically=[...Object.values(s.stations).map(st=>st.lager),...Object.values(s.ships).map(sh=>sh.ladung)].reduce((n,l)=>n+(l[ware]||0),0);
  assert.equal(physically,entry.initial+entry.mined+entry.produced+entry.imported-entry.consumed-entry.exported,ware);
 }
}
function ownerCommand(w,s,owner,cmd){
 const api=J6.erstellen(w,owner),before=w.hash(s);
 const offer=api.angebot(s,cmd);
 assert.equal(w.hash(s),before,'Angebot darf nicht buchen');
 assert.equal(offer.ok,true,JSON.stringify({owner,cmd,offer}));
 const r=api.ausfuehren(s,cmd);
 assert.equal(r.ok,true,JSON.stringify({owner,cmd,r}));
 audits(w,s);
 return r;
}
function wait(w,s,condition,limit=1500){
 for(let i=0;i<limit;i++){
  if(condition())return i;
  w.minute(s);
  audits(w,s);
 }
 assert.fail('Originalwelt erreicht Ziel nicht innerhalb '+limit+' bezahlter Minuten');
}
function earlyContract(){
 const {welt:w,s,source}=start(),hash=w.hash(s);
 // Legitimate voluntary, financed expansion of the *independent* transport company.
 ownerCommand(w,s,'transport',{type:'shipBuy',station:'st_aldera',klasse:'frachter'});
 assert.equal(s.owners.transport.cash,1250);
 assert.equal(s.owners.werft_extern.cash,1350);
 assert.equal(s.ships.sh002.owner,'transport');
 assert.equal(s.ships.sh002.flug.lage,'angedockt');
 assert.equal(s.ships.sh001.owner,'npc3');
 assert.equal(s.ships.sh001.flug.lage,'angedockt');
 // A real order from Nadir and three individually owner-signed agreements.
 ownerCommand(w,s,'st_nadir',{type:'industrialOreOffer',miner:'sh001',frachter:'sh002'});
 const beforeReject=w.hash(s);
 const premature=J6.erstellen(w,'st_nadir').ausfuehren(s,{type:'industrialOreCommit'});
 assert.equal(premature.ok,false);
 assert.equal(w.hash(s),beforeReject);
 for(const [owner,type] of [
  ['npc3','industrialOreAcceptMine'],['transport','industrialOreAcceptFreight'],
  ['werft_extern','industrialOreAcceptYard']]){
  ownerCommand(w,s,owner,{type});
 }
 ownerCommand(w,s,'st_nadir',{type:'industrialOreCommit'});
 assert.equal(s.kanon.industrieErz.phase,'aktiv');
 assert.equal(s.owners.k7_werft_treuhand.cash,w.industriePreise.werft);
 assert.equal(s.owners.werft_extern.cash,1350-w.industriePreise.werft);
 const signed=w.save(s);
 const after=w.hash(s);
 assert.equal(w.hash(w.load(signed)),after);
 return {w,s,source,signed,startHash:hash};
}
test('J10b: before first NPC minute, real 750-ISK carrier purchase and 4 independent signers finance K7 contract',()=>{
 const {w,s,source,startHash}=earlyContract();
 const view=J10.erstellen(w,s);
 assert.equal(view.k7.vertragsphase,'aktiv');
 assert.equal(view.k7.angebotFrachter,'sh002');
 assert.equal(view.k7.angebotMiner,'sh001');
 assert.equal(view.weltgeld,33000);
 assert.equal(s.kanon.jaeger.fertig,0);
 assert.notEqual(w.hash(s),startHash);
 assert.equal(initial195,OLD.create(42,'private195').export(),'original exported 195 bytes intact');
 const tampered=JSON.parse(w.save(s));tampered.owners.transport.cash++;
 assert.throws(()=>w.load(JSON.stringify(tampered)),'dishonest money injection denied');
 console.log('J10B_K7_SIGNED',JSON.stringify({
  tick:s.tick,hash:w.hash(s),buyer:s.owners.st_nadir.cash,
  carrier:s.owners.transport.cash,miner:s.owners.npc3.cash,
  externalYard:s.owners.werft_extern.cash,escrow:s.owners.k7_werft_treuhand.cash,
  realCarrier:s.ships.sh002.id,originalCopyHash:w.hash(w.load(source))
 }));
});
test('J10b: real 50-ore haul, W4 work and K7 replacement hull; no fighter until actual silicon and parts',()=>{
 const {w,s}=earlyContract();
 const first=wait(w,s,()=>s.w3.auftrag?.phase==='rueck');
 assert.equal(s.w3.geliefert,50);
 assert.ok(s.stations.st_nadir.lager.erz>=50);
 assert.equal(s.kanon.industrieErz.erzAngenommen,true);
 ownerCommand(w,s,'st_nadir',{type:'stationRefine',station:'st_nadir'});
 wait(w,s,()=>!s.w4.auftrag,100);
 assert.ok(s.stations.st_nadir.lager.material>=5);
 ownerCommand(w,s,'werft_extern',{type:'industrialOreBuildShip'});
 wait(w,s,()=>!s.w5.auftrag&&!s.w3.auftrag,240);
 const last=J10.erstellen(w,s);
 assert.equal(s.kanon.industrieErz.werftVerwendet,true);
 assert.equal(s.owners.k7_werft_treuhand.cash,0);
 assert.ok(s.ledger.frachter.produced>=1);
 assert.equal(last.lager.jaeger,0);
 const pre=w.hash(s),cmd={type:'stationBuildFighter',station:'st_nadir'};
 const denied=J6.erstellen(w,'st_nadir').ausfuehren(s,cmd);
 assert.equal(denied.ok,false);
 assert.match(denied.reason,/Bauteile|Material/);
 assert.equal(w.hash(s),pre);
 const replay=w.load(w.save(s));
 assert.equal(w.hash(replay),w.hash(s));
 console.log('J10B_REAL_DELIVERY',JSON.stringify({
  tick:s.tick,ore:s.stations.st_nadir.lager.erz,material:s.stations.st_nadir.lager.material,
  parts:s.stations.st_nadir.lager.bauteil, silicon:s.stations.st_nadir.lager.silizium,
  carrierBuilt:s.ledger.frachter.produced,firstHaulMinutes:first,
  hash:w.hash(s),buyerCash:s.owners.st_nadir.cash,externalYard:s.owners.werft_extern.cash,
  houseCash:s.owners.house.cash,mint:s.minted,burn:s.burned
 }));
});
test('J10b: default policy is independently proven to miss signed industry while NPC miner shuttles',()=>{
 const {welt:w,s}=start(),save=w.save(s);
 w.minute(s);audits(w,s);
 assert.equal(s.owners.transport.cash,1250);
 assert.equal(s.owners.werft_extern.cash,1350);
 assert.equal(s.ships.sh002.owner,'transport');
 assert.equal(s.ships.sh001.flug.lage,'abdocken');
 const before=w.hash(s);
 const offer=J6.erstellen(w,'st_nadir').ausfuehren(s,{
  type:'industrialOreOffer',miner:'sh001',frachter:'sh002'
 });
 assert.equal(offer.ok,false);
 assert.match(offer.reason,/nicht frei im Dock/);
 assert.equal(w.hash(s),before);
 w.advance(s,130);audits(w,s);
 assert.equal(s.stations.st_nadir.lager.erz,0);
 assert.equal(s.kanon.jaeger.fertig,0);
 assert.equal(s.ships.sh001.ladung.erz,50);
 assert.equal(s.kanon.industrieErz.phase,'frei');
 console.log('J10B_DEFAULT_BLOCKER',JSON.stringify({
  tick:s.tick,miner:s.ships.sh001.flug.lage,load:s.ships.sh001.ladung.erz,
  carrier:s.ships.sh002.flug.lage,realCash:s.owners.transport.cash,
  signed:s.kanon.industrieErz.phase,worldMoney:33000,hash:w.hash(s),
  preservedOriginal:initial195===OLD.create(42,'private195').export()
 }));
 assert.notEqual(w.save(s),save);
});


test('J10b/K2: paid original Nadir miner built from delivered ore and purchased locally; no free silicon',()=>{
 const {w,s}=earlyContract();
 wait(w,s,()=>s.w3.auftrag?.phase==='rueck');
 ownerCommand(w,s,'st_nadir',{type:'stationRefine',station:'st_nadir'});
 wait(w,s,()=>!s.w4.auftrag,100);
 ownerCommand(w,s,'werft_extern',{type:'industrialOreBuildShip'});
 wait(w,s,()=>!s.w5.auftrag&&!s.w3.auftrag,240);
 // The signed K7 order has consumed 10 of its 50 really delivered ore.
 // Only existing stock can be refined: no invented silicon/miner inventory.
 assert.equal(s.stations.st_nadir.lager.erz,40);
 ownerCommand(w,s,'st_nadir',{type:'stationRefine',station:'st_nadir'});
 wait(w,s,()=>!s.w4.auftrag,100);
 const oldMineStock=s.stations.st_aldera.lager.miner||0;
 const k2={type:'stationBuildMiner',owner:'werft_extern',station:'st_nadir',besteller:'house'};
 const pre=w.hash(s);
 const firstAttempt=w.execute(w.load(w.save(s)),k2);
 console.log('J10B_K2_BEFORE',JSON.stringify({
  tick:s.tick,alderaMinerStock:oldMineStock,nadirMinerStock:s.stations.st_nadir.lager.miner||0,
  house:s.owners.house.cash,npc3:s.owners.npc3.cash,werft:s.owners.werft_extern.cash,
  material:s.stations.st_nadir.lager.material,ore:s.stations.st_nadir.lager.erz,
  k2Attempt:firstAttempt,foundryRules:{
   material:w.rules.w5.material,price:w.rules.w5.materialPreis,
   workMinutes:w.rules.w5.dauer,workPrice:w.rules.w5.lohnJeMinute
  }
 }));
 assert.equal(w.hash(s),pre,'copy-based K2 precheck does not mutate world');
 // Existing original K2 prevents manufacturing while cheaper Aldera starter
 // miners remain physically in stock. Purchases, not stock deletion, are required.
 if(oldMineStock>0){
  assert.equal(firstAttempt.ok,false);
  assert.match(firstAttempt.reason,/Aldera/);
  for(let k=0;k<oldMineStock;k++){
   const owner=k===0?'house':'npc3';
   ownerCommand(w,s,owner,{type:'shipBuy',station:'st_aldera',klasse:'miner'});
  }
 }
 assert.equal(s.stations.st_aldera.lager.miner||0,0);
 const start=w.hash(s);
 const real=w.execute(s,k2);
 assert.equal(real.ok,true,JSON.stringify(real));
 audits(w,s);
 assert.notEqual(w.hash(s),start);
 assert.equal(s.kanon.minerWerft.begonnen,1);
 wait(w,s,()=>!s.kanon.minerWerft.auftrag,100);
 assert.equal(s.stations.st_nadir.lager.miner,1);
 const cash=s.owners.house.cash,oldShips=Object.keys(s.ships);
 const claim={type:'stationClaimMinerLocal',owner:'house',station:'st_nadir'};
 const receipt=w.execute(s,claim);
 assert.equal(receipt.ok,true,JSON.stringify(receipt));
 audits(w,s);
 assert.equal(cash-s.owners.house.cash,600,'genuine house purchase of Nadir K2 miner');
 assert.equal(s.stations.st_nadir.lager.miner,0);
 const created=Object.values(s.ships).filter(sh=>!oldShips.includes(sh.id));
 assert.equal(created.length,1);
 assert.equal(created[0].owner,'house');
 assert.equal(created[0].klasse,'miner');
 assert.equal(created[0].heimat,'nadir');
 assert.equal(created[0].flug.lage,'angedockt');
 assert.ok(s.kanon.minerWerft.lokaleKaeufe.some(x=>x.id===created[0].id&&x.preis===600));
 assert.equal(s.stations.st_nadir.lager.silizium,0,'no silicon until real field mining and sale');
 assert.equal(s.kanon.jaeger.fertig,0);
 const loaded=w.load(w.save(s));
 assert.equal(w.hash(loaded),w.hash(s));
 console.log('J10B_K2_LOCAL_MINER',JSON.stringify({
  tick:s.tick,ship:created[0].id,houseCash:s.owners.house.cash,
  npc3Cash:s.owners.npc3.cash,externalYardCash:s.owners.werft_extern.cash,
  material:s.stations.st_nadir.lager.material,ore:s.stations.st_nadir.lager.erz,
  producedMiners:s.ledger.miner.produced,initialMinerPurchases:oldMineStock,
  worldMoney:33000,minted:s.minted,burned:s.burned,hash:w.hash(s)
 }));
});
