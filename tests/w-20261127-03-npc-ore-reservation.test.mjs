// W-20261127-03: original financed NPC reservation, not a second economy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');

function start(s02=false){
  const j=J8.erstellen();
  j.starten195(OLD.create(42,'private195').export(),true);
  assert.equal(j.ansicht().hash,'674400c1d181fcf2');
  if(s02){
    const w=j.weltReferenz(),s=j.zustandReferenz();
    w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
    w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
  }
  return j;
}
function audit(w,s){assert.deepEqual(pruefen(w,s),[]);}
function roundtrip(w,s){
  audit(w,s);
  const json=w.save(s),loaded=w.load(json);
  assert.equal(w.save(loaded),json);
  return loaded;
}
function managerOpen(json){
  const j=J8.erstellen();j.oeffnen204(json,true);assert.equal(j.exportieren(),json);return j;
}
function act(w,s,cmd){const r=w.execute(s,cmd);assert.equal(r.ok,true,cmd.type+': '+r.reason);}
function reject(w,s,cmd){
  const before=w.save(s),r=w.execute(s,cmd);assert.equal(r.ok,false,cmd.type);
  assert.equal(w.save(s),before);return r.reason;
}
function advance(j,tick){
  // Same real elapsed minutes; explicit J8 import at each action boundary.
  const w=j.weltReferenz(),s=w.load(j.exportieren());
  assert.ok(tick>=s.tick);w.advance(s,tick-s.tick);audit(w,s);
  return managerOpen(w.save(s));
}
const trace=[[300,"buy-st_nadir-frachter"],[300,"reposition-sh004"],[360,"buy-st_aldera-miner"],[360,"ice-sh005"],[480,"freight-sh004"],[720,"freight-sh004"],[840,"freight-sh004"],[1200,"freight-sh004"],[1320,"freight-sh004"],[1440,"freight-sh004"],[1740,"freight-sh004"],[1980,"freight-sh004"],[2100,"freight-sh004"],[2220,"freight-sh004"],[2340,"freight-sh004"],[4460,"freight-sh004"],[5900,"buy-st_aldera-miner"],[5960,"ice-sh011"],[7100,"freight-sh004"],[9820,"freight-sh004"],[12540,"freight-sh004"],[14000,"buy-st_aldera-miner"],[14100,"ice-sh016"],[15180,"freight-sh004"],[17820,"freight-sh004"],[20540,"freight-sh004"],[22580,"buy-st_aldera-miner"],[22640,"ice-sh022"],[23180,"freight-sh004"],[25820,"freight-sh004"],[27570,"buy-st_nadir-frachter"],[28540,"freight-sh004"],[29620,"reposition-sh026"],[32220,"buy-st_aldera-miner"],[32280,"ice-sh029"],[32450,"freight-sh026"]];

test('NPC ore: original #665 S02 career, real accepted 50 at tick32640 survives export', {timeout:20*60*1000},()=>{
  let j=start(true);
  for(const [tick,id] of trace){
    j=advance(j,tick);
    const r=j.ausfuehren(id);assert.equal(r.ok,true,tick+' '+id+': '+r.reason);
  }
  j=advance(j,32639);
  let w=j.weltReferenz(),s=j.zustandReferenz();
  assert.equal(s.w3.auftrag.schiff,'sh030');
  assert.equal(s.w3.auftrag.industrieMiner,'sh024');
  assert.equal(s.kanon.industrieErz.erstellt,32570);
  assert.equal(s.kanon.industrieErz.erzAngenommen,false);
  assert.equal(s.ships.sh024.ladung.erz,50);
  assert.equal(s.ledger.erz.exported,1959);
  const before=j.exportieren();
  j=advance(j,32640);w=j.weltReferenz();s=j.zustandReferenz();
  assert.equal(s.kanon.industrieErz.erzAngenommen,true);
  assert.equal(s.w3.auftrag.npcErzReserviert,50);
  assert.equal(s.stations.st_aldera.lager.erz,50);
  assert.equal(s.ledger.erz.exported,1959);
  assert.equal(s.ledger.erz.mined,2350);
  assert.deepEqual([s.owners.w3_kauf_treuhand.cash,s.owners.w3_arbeit_treuhand.cash,s.owners.k7_werft_treuhand.cash],[740,120,530]);
  const accepted=j.exportieren();
  const clone=managerOpen(before);
  assert.equal(advance(clone,32640).exportieren(),accepted);
  const isolated=w.load(accepted);
  reject(w,isolated,{type:'industrialOreCancel',owner:'house'});
  reject(w,isolated,{type:'industrialOreCancel',owner:'st_nadir'});
  // Old states without proof are read byte-identically, never filled or migrated.
  const legacy=w.load(accepted);delete legacy.w3.auftrag.npcErzReserviert;
  const legacyJson=w.save(legacy);assert.equal(w.save(w.load(legacyJson)),legacyJson);
  const forged=JSON.parse(accepted);forged.w3.auftrag.npcErzReserviert=49;
  assert.throws(()=>w.load(JSON.stringify(forged)));
  j=advance(j,32641);s=j.zustandReferenz();
  assert.equal(s.w3.auftrag.phase,'hin');
  assert.equal(s.ships.sh030.ladung.erz,50);
  assert.equal(s.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(s.stations.st_aldera.lager.erz,0);
  j=advance(j,32761);s=j.zustandReferenz();
  const receipt=s.w5ad.freight.find(f=>f.id==='sh030'&&f.start===32641);
  assert.ok(receipt);
  assert.deepEqual([receipt.amount,receipt.end-receipt.start,receipt.fee,receipt.work],[50,120,240,120]);
  assert.equal(s.ships.sh030.owner,'transport');
  assert.ok(s.w4.abgeschlossen>0&&s.w5.fertig>0);
  j=advance(j,33060);s=j.zustandReferenz();
  const result={tick:s.tick,hash:j.ansicht().hash,receipt,
    w4:s.w4.abgeschlossen,w5:s.w5.fertig,ore:s.ledger.erz,
    offeredF4:j.angebote().find(o=>o.id==='freight-sh026')};
  assert.equal(advance(managerOpen(accepted),33060).exportieren(),j.exportieren());
  console.log('W_20261127_03_ORIGINAL_REPLAY',JSON.stringify(result));
});

function fixture(tick=50,extraMiner=false){
  const j=start(),w=j.weltReferenz(),s=w.load(j.exportieren());
  w.politikSetzen(s,{automatik:false});
  act(w,s,{type:'shipShuttleStop',owner:'npc3',schiff:'sh001'});
  act(w,s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'});
  const fr=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter').id;
  if(extraMiner)act(w,s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
  w.advance(s,tick);
  act(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh001',frachter:fr});
  return {w,s,fr};
}
const sign=(w,s)=>{
  act(w,s,{type:'industrialOreAcceptMine',owner:'npc3'});
  act(w,s,{type:'industrialOreAcceptFreight',owner:'transport'});
  act(w,s,{type:'industrialOreAcceptYard',owner:'werft_extern'});
};
test('NPC ore: original role, incomplete consent, full reserve, empty cancellation and partial work',()=>{
  const {w,s}=fixture(0);
  reject(w,s,{type:'industrialOreAcceptFreight',owner:'house'});
  reject(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  sign(w,s);
  const before=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  assert.equal(s.w3.auftrag.npcErzReserviert,undefined);
  assert.equal(s.kanon.industrieErz.erzAngenommen,false);
  const copy=roundtrip(w,s);
  act(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
  for(const [id,cash] of Object.entries(before))assert.equal(s.owners[id].cash,cash,id);
  assert.equal(s.w3.auftrag,null);audit(w,s);
  let n=0;
  while((copy.ships.sh001.ladung.erz??0)===0&&n++<100)w.minute(copy);
  assert.ok(copy.ships.sh001.ladung.erz>0&&copy.ships.sh001.ladung.erz<50);
  assert.equal(copy.w3.auftrag.npcErzReserviert,undefined);
  reject(w,copy,{type:'industrialOreCancel',owner:'st_nadir'});
  audit(w,copy);
});
test('NPC ore: insufficient commit funding is rejected without creating a reservation',()=>{
  const {w,s}=fixture(0);sign(w,s);
  // Deliberately invalid test-only balance to exercise the original command's
  // revalidation; never import this artificial state as a real career.
  s.owners.st_aldera.cash=499;
  const before=w.canonical(s);
  const r=w.execute(s,{type:'industrialOreCommit',owner:'st_nadir'});
  assert.equal(r.ok,false);assert.equal(w.canonical(s),before);
  assert.equal(s.w3.auftrag,null);
});
test('NPC ore: standard accepted cargo and simultaneous free ore remain separate',()=>{
  const {w,s,fr}=fixture(50,true);sign(w,s);
  const house=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  act(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
  act(w,s,{type:'shipShuttle',owner:'house',schiff:house.id,ware:'erz'});
  const initial=s.ledger.erz.exported;
  let protectedAt=null;
  for(let n=0;n<200;n++){
    w.minute(s);
    if(s.w3.auftrag?.npcErzReserviert!==undefined){
      assert.equal(s.w3.auftrag.npcErzReserviert,50);
      assert.ok(s.stations.st_aldera.lager.erz>=50);
      protectedAt=s.tick;roundtrip(w,s);
    }
    if(s.w3.auftrag?.phase==='hin')assert.equal(s.ships[fr].ladung.erz,50);
  }
  assert.ok(protectedAt!==null);
  assert.ok(s.w3.abgeschlossen>=1);
  assert.ok(s.ledger.erz.exported-initial>=50,'free house ore can still be exported');
  audit(w,s);
});
