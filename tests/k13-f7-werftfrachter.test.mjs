import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Welt=require('../prototypes/welt/welt-kern.js');
const buy={type:'shipBuy',owner:'house',klasse:'frachter',station:'st_nadir'};
const cmd=(w,s,c)=>{const r=w.execute(s,c);assert.equal(r.ok,true,JSON.stringify(r));return r;};
function good(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.stations.st_nadir.lager.frachter,s.w5.fertig-s.w5.verkauft);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function no(w,s,c){const before=w.canonical(s);assert.equal(w.execute(s,c).ok,false);assert.equal(w.canonical(s),before);}
const {supply}=require('./k13-f7-vorbereitung.cjs');
test('F7 capability is read-only, absent in Rule199; empty Nadir has no free hull',()=>{
 const old=Welt.erstellen(),w=Welt.erstellenK7(),s=w.createState(42,{politik:{automatik:false}});
 assert.equal(old.f7Werftfrachter,undefined);assert.equal(w.f7Werftfrachter,true);
 assert.throws(()=>{w.f7Werftfrachter=false;},TypeError);
 no(w,s,buy);no(old,old.createState(42),buy);good(w,s);
});
for(const seed of [42,7]) test('F7 seed '+seed+': real W1/W3/W4/W5, player purchase, 60 paid minutes, Aldera job',async()=>{
 const {w,s}=await supply(seed),original=w.save(s);
 const price=w.rules.economy.waren.frachter.basis;
 for(const c of [{...buy,owner:'npc3'},{...buy,klasse:'miner'},{...buy,preis:price-1},{...buy,station:'fake'}])no(w,s,c);
 for(const cash of [0,price-1]){const z=w.load(original);z.owners.house.cash=cash;no(w,z,buy);}
 const before={house:s.owners.house.cash,werf:s.owners.werft_extern.cash,stock:s.stations.st_nadir.lager.frachter,npc:s.owners.transport.cash};
 cmd(w,s,buy);const id=s.kanon.spielerFrachterKaeufe.at(-1).id,sh=s.ships[id];
 assert.equal(price,750);assert.equal(s.owners.house.cash,before.house-price);
 assert.equal(s.owners.werft_extern.cash,before.werf+price);
 assert.equal(s.owners.transport.cash,before.npc);
 assert.equal(s.stations.st_nadir.lager.frachter,before.stock-1);
 assert.equal(sh.owner,'house');assert.equal(sh.system,'nadir');assert.equal(sh.heimat,'nadir');
 assert.deepEqual(s.kanon.spielerFrachterKaeufe.at(-1),{id,tick:s.tick,station:'st_nadir',preis:price});
 good(w,s);no(w,s,buy);
 const transfer={type:'shipReposition',owner:'house',schiff:id};
 const q=w.kern.pilotW5TransferKalkulation(s,id);assert.deepEqual([q.ok,q.minuten,q.kosten],[true,60,60]);
 for(const cash of [0,q.kosten-1]){const z=w.load(w.save(s));z.owners.house.cash=cash;no(w,z,transfer);}
 no(w,s,{...transfer,owner:'transport'});no(w,s,{...transfer,schiff:'fake'});
 const busy=w.load(w.save(s));busy.w3.auftrag={schiff:'fake'};no(w,busy,transfer);
 const base={cash:s.owners.house.cash,pilot:s.owners.w5ac_transfer_pilot.cash,tick:s.tick};
 cmd(w,s,transfer);good(w,s);no(w,s,transfer);
 assert.equal(s.owners.house.cash,base.cash-60);assert.equal(s.owners.w5ac_transfer_reserved.cash,60);
 cmd(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:64,fahrt:50});w.advance(s,30);
 assert.ok(sh.flug.y>0);assert.equal(sh.system,'nadir');assert.equal(s.w5ac.active.gearbeitet,30);
 assert.equal(s.owners.w5ac_transfer_pilot.cash,base.pilot+30);good(w,s);
 for(const mutate of [
  z=>{z.w5ac.active.owner='transport';},
  z=>{z.w5ac.active.gearbeitet--;},
  z=>{z.w5ac.active.start--;},
  z=>{z.owners.w5ac_transfer_reserved.cash--;z.owners.house.cash++;},
  z=>{z.ships[id].ankunft--;},
  z=>{z.kanon.spielerFrachterKaeufe.at(-1).tick=z.tick;},
 ]){const z=JSON.parse(w.save(s));mutate(z);assert.equal(w.audit(z).ok,false);assert.throws(()=>w.load(JSON.stringify(z)));}

 const replay=w.load(w.save(s));w.advance(s,30);w.advance(replay,30);assert.equal(w.hash(replay),w.hash(s));
 assert.equal(s.tick,base.tick+60);assert.equal(sh.system,'aldera');assert.equal(sh.flug.lage,'angedockt');
 assert.equal(s.owners.w5ac_transfer_pilot.cash,base.pilot+60);assert.equal(s.owners.w5ac_transfer_reserved.cash,0);
 good(w,s);no(w,s,transfer);
 // Same physical hull can take the existing personal, fully funded ice job.
 // The terminal industrial scenario has only 2 real Aldera ice units.
 // No invented freight job: prove rejection, then real paid personal local flight.
 no(w,s,{type:'shipFreightIce',owner:'house',schiff:id});
 const pilot=s.owners.pilot_house.cash;
 cmd(w,s,{type:'shipUndock',owner:'house',schiff:id});w.advance(s,1);good(w,s);
 assert.equal(sh.flug.lage,'frei');assert.equal(s.owners.pilot_house.cash,pilot+1);
 const valid=w.save(s);
 for(const mutate of [
  z=>{z.kanon.spielerFrachterKaeufe.at(-1).station='st_aldera';},
  z=>{z.ships[id].owner='transport';},
  z=>{z.w5ac.completed.at(-1).owner='transport';},
  z=>{z.w5ac.completed.at(-1).minuten=59;},
  z=>{z.owners.house.cash--;z.owners.transport.cash++;},
  z=>{z.kanon.spielerFrachterKaeufe.at(-1).preis--;},
 ]){const z=JSON.parse(valid);mutate(z);assert.equal(w.audit(z).ok,false);assert.throws(()=>w.load(JSON.stringify(z)));}
 console.log('F7_PAID_HULL '+JSON.stringify({seed,id,tick:s.tick,hash:w.hash(s),price,ferryCost:60,worldMoney:33000}));
});
