import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const opts={carrierCash:2000,buyerCash:4000};
const policy={...W6.SZENARIEN.find(x=>x.id==='S02').politik,sparquoteStandard:1000,rueckfracht:false};
function check(w,s){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
}
test('U8 research: explicit profile gate rejects ordinary saves and commands',()=>{
 const old=K.erstellenJ4c(opts),fresh=K.erstellenU8(opts);
 const s=old.createState(42),r=fresh.createState(42);
 const b=old.save(s),rb=fresh.save(r);
 assert.throws(()=>old.load(rb),/U8/);
 assert.throws(()=>fresh.load(b),/U8/);
 assert.equal(old.execute(s,{type:'industrialWaterBackhaul',owner:'st_aldera',schiff:'sh001'}).ok,false);
 assert.equal(old.save(s),b);
 assert.equal(fresh.execute(r,{type:'industrialWaterBackhaul',owner:'st_aldera',schiff:'sh001'}).ok,false);
 assert.equal(fresh.save(r),rb);
});
test('U8 research: real NPC W3 return, paid optional water, atomic rejection and reload',()=>{
 const w=K.erstellenU8(opts),s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 // Find a real arrival with original funded ore contract and produced water.
 // No manual inventory/cash injection, no generated hull or fabricated proof.
 let ship=null;
 for(let i=0;i<14*1440;i++){
  w.advance(s,1);
  const a=s.w3.auftrag,sh=a&&s.ships[a.schiff];
  if(a?.phase==='rueck'&&sh.ankunft-a.zeit===s.tick
    &&s.stations.st_nadir.lager.wasser>0&&s.owners.st_aldera.cash>=15
    &&s.stations.st_aldera.lager.wasser<100&&!s.w5ac.active&&!s.w5n.frachtauftrag
    &&!s.kanon.rueckfracht&&!w.stillgelegt(s,sh.id)){
   ship=sh.id;break;
  }
 }
 assert.ok(ship,'original W3 arrival with produced water and funded buyer required');
 check(w,s);
 const before=w.save(s),a=s.w3.auftrag,lohn=s.w3.arbeitsKosten,tarif=s.w3.frachtUmsatz;
 const source=s.stations.st_nadir.lager.wasser,stock=s.stations.st_aldera.lager.wasser;
 const buyer=s.owners.st_aldera.cash,producer=s.owners.st_nadir.cash;
 const earned=s.kanon.wasser.rueckGeliefert;
 for(const cmd of [
  {type:'industrialWaterBackhaul',owner:'house',schiff:ship},
  {type:'industrialWaterBackhaul',owner:'st_aldera',schiff:'fake'},
  {type:'industrialWaterBackhaul',owner:'st_aldera',schiff:ship,menge:999},
 ]){
  assert.equal(w.execute(s,cmd).ok,false);
  assert.equal(w.save(s),before);
 }
 const cmd={type:'industrialWaterBackhaul',owner:'st_aldera',schiff:ship};
 const p=w.execute(s,cmd);
 assert.equal(p.ok,true,p.reason);
 assert.ok(p.menge>0);
 assert.equal(s.owners.st_aldera.cash,buyer-p.menge*15);
 assert.equal(s.owners.st_nadir.cash,producer+p.menge*14);
 assert.equal(s.owners.k1_rueckfracht.cash,p.gebuehr);
 assert.equal(s.ships[ship].ladung.wasser,p.menge);
 assert.equal(s.stations.st_nadir.lager.wasser,source-p.menge);
 assert.equal(s.stations.st_aldera.lager.wasser,stock);
 assert.equal(s.w3.arbeitsKosten,lohn);
 const loaded=w.save(s);
 assert.equal(w.execute(s,cmd).ok,false);
 assert.equal(w.save(s),loaded);
 check(w,s);
 const fake=JSON.parse(loaded);fake.kanon.rueckfracht.schiff='fake';
 assert.throws(()=>w.load(JSON.stringify(fake)));
 const wrong=JSON.parse(loaded);delete wrong.kanon.rueckfracht.art;
 assert.throws(()=>w.load(JSON.stringify(wrong)));
 const copy=w.load(loaded),minutes=a.zeit;
 w.advance(s,minutes);w.advance(copy,minutes);
 assert.equal(w.save(s),w.save(copy));
 assert.equal(s.w3.arbeitsKosten-lohn,minutes);
 assert.equal(s.w3.frachtUmsatz-tarif,240);
 assert.equal(s.kanon.wasser.rueckGeliefert-earned,p.menge);
 assert.equal(s.stations.st_aldera.lager.wasser,stock+p.menge);
 assert.equal(s.owners.k1_rueckfracht.cash,0);
 assert.equal(s.ships[ship].ladung.wasser,undefined);
 assert.equal(s.ships[ship].owner,'transport');
 check(w,s);
 console.log('M4_U8_REAL_RETURN',JSON.stringify({ship,menge:p.menge,extraFee:p.gebuehr,returnMinutes:minutes,tick:s.tick,hash:w.hash(s)}));
});
