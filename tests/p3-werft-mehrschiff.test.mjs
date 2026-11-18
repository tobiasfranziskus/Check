import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');
const Industry=require('../prototypes/spiel/p3-industrie.js');
test('P3: original nine paid F4 and subsequent second bought W5 hull remain independently selectable',()=>{
 const f=erstellen(),j=J8.erstellen();
 j.oeffnen204(f.save,true);
 const w=j.weltReferenz(),s=j.zustandReferenz(),qs=j.angebote();
 const before=w.hash(s),v=(id)=>Industry.auswerten(w,s,qs,id);
 const def=v();
 assert.equal(def.werftSpielerSchiffId,f.first,'prefer genuinely docked Aldera hull');
 assert.deepEqual(def.werftFrachter.map(sh=>sh.id),[f.first,f.second]);
 assert.equal(def.werftSpielerAnzahl,2);
 assert.equal(def.werftSpielerOrt,'aldera');
 assert.equal(def.werftFrachtRunden,9);
 assert.equal(def.werftFrachtTarife,2160);
 assert.equal(def.werftFrachtLoehne,1080);
 assert.equal(def.werftFrachtId,'freight-'+f.first);
 assert.equal(def.werftTransferBereit,false);
 const nadir=v(f.second);
 assert.equal(nadir.werftSpielerSchiffId,f.second);
 assert.equal(nadir.werftSpielerOrt,'nadir');
 assert.equal(nadir.werftFrachtRunden,0);
 assert.equal(nadir.werftFrachtTarife,0);
 assert.equal(nadir.werftFrachtId,'freight-'+f.second);
 assert.equal(nadir.werftFrachtBereit,false,'Nadir ship cannot run Aldera F4 directly');
 assert.equal(nadir.werftTransferId,'reposition-'+f.second);
 assert.equal(nadir.werftFrachter.find(sh=>sh.id===f.first).ort,'aldera');
 assert.equal(nadir.werftFrachter.find(sh=>sh.id===f.second).ort,'nadir');
 assert.equal(v(f.first).werftSpielerSchiffId,f.first);
 assert.equal(v(f.miner).werftSpielerSchiffId,f.first,'miner may not be targeted as W5 carrier');
 assert.equal(v('sh002').werftSpielerSchiffId,f.first,'foreign freighter may not be chosen');
 assert.equal(v('sh999').werftSpielerSchiffId,f.first,'unknown ship may not be chosen');
 assert.equal(w.hash(s),before,'ship choice must not mutate one atom of the world');
 assert.equal(j.exportieren(),f.save,'selection must not be encoded into JSON save');
 assert.equal(w.audit(s).ok,true);
 console.log('P3_MULTI_W5_OK '+JSON.stringify({
   first:f.first,second:f.second,tick:f.tick,hash:f.hash,
   rounds:def.werftFrachtRunden,paidTotal:def.werftFrachtTarife,
   default:def.werftSpielerSchiffId,selectedNadir:nadir.werftSpielerSchiffId
 }));
});
