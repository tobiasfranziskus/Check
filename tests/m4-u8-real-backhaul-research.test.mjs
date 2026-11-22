import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const opts={carrierCash:2000,buyerCash:4000};
const policy={automatik:false,rueckfracht:false};
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
 const doCmd=cmd=>{
  const r=w.execute(s,cmd);
  assert.equal(r.ok,true,JSON.stringify(cmd)+': '+r.reason);
  check(w,s);
  return r;
 };
 // W2's hourly restart remains authoritative even with outer automatik=false.
 // Explicit NPC-owner test commands may request a safe pause; never cancel
 // a live funded contract or remove a loaded ship. Do not edit state/policies.
 let pauses=0;
 const pauseUnbound=()=>{
  for(const sh of Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id))){
   const p=s.kanon.pendel[sh.id];
   if(sh.owner!=='npc3'||sh.klasse!=='miner'||!p||p.beenden
     ||s.w3.auftrag?.industrieMiner===sh.id
     ||s.erzpilotVertraege?.[sh.id]
     ||Object.values(sh.ladung).some(x=>x!==0)
     ||!['frei','angedockt'].includes(sh.flug?.lage))continue;
   const result=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:sh.id});
   assert.equal(result.ok,true,result.reason);pauses++;
  }
 };
 const step=()=>{pauseUnbound();w.advance(s,1);};
 const advance=(n)=>{for(let i=0;i<n;i++)step();};
 const until=(predicate,limit,label)=>{
  for(let i=0;i<limit&&!predicate();i++)step();
  assert.ok(predicate(),label+' bei Minute '+s.tick+' '+JSON.stringify({
   aldera:s.owners.st_aldera.cash,nadir:s.owners.st_nadir.cash,
   ice:s.stations.st_aldera.lager.eis,water:s.stations.st_nadir.lager.wasser,
   ore:s.w3.auftrag,export:s.owners.export.cash,escrow:s.erzpilotVertraege,pauses,ships:Object.values(s.ships).map(x=>[x.id,x.owner,x.auftrag,x.flug?.lage])
  }));
  check(w,s);
 };
 // Explicit legal sequence, no injected stock or fabricated opening balances.
 pauseUnbound();
 doCmd({type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'});
 doCmd({type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
 const ship=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter').id;
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner').id;
 doCmd({type:'shipShuttle',owner:'house',schiff:miner,ware:'eis'});
 until(()=>s.stations.st_aldera.lager.eis>=w.rules.w5n.charge,240,'physically mined ice');
 doCmd({type:'shipShuttleStop',owner:'house',schiff:miner});
 doCmd({type:'shipFreightIce',owner:'transport',schiff:ship});
 advance(2*w.rules.w5n.flugMinuten);
 check(w,s);
 doCmd({type:'stationWater',owner:'st_nadir',station:'st_nadir'});
 advance(w.rules.w5n.fabrikMinuten);
 assert.ok(s.stations.st_nadir.lager.wasser>0,'real water production');
 check(w,s);
 // Original signers commit one original K7 contract only after ice and water.
 const eligibleMiner=()=>Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id)).find(sh=>
  sh.owner==='npc3'&&sh.klasse==='miner'&&sh.flug?.lage==='angedockt'
  &&!s.erzpilotVertraege?.[sh.id]&&Object.values(sh.ladung).every(x=>x===0)
  &&!s.kanon.pendel[sh.id]?.beenden&&!w.stillgelegt(s,sh.id));
 until(()=>!!eligibleMiner()&&s.owners.st_aldera.cash>=500
  &&s.owners.npc3.cash>=140&&s.owners.st_nadir.cash>=740
  &&s.owners.transport.cash>=120&&s.owners.werft_extern.cash>=530,
  1440,'available NPC miner and actual owner budgets');
 const npc=eligibleMiner().id;
 for(const cmd of [
  {type:'industrialOreOffer',owner:'st_nadir',miner:npc,frachter:ship},
  {type:'industrialOreAcceptMine',owner:'npc3'},
  {type:'industrialOreAcceptFreight',owner:'transport'},
  {type:'industrialOreAcceptYard',owner:'werft_extern'},
  {type:'industrialOreCommit',owner:'st_nadir'}
 ])doCmd(cmd);
 until(()=>s.w3.auftrag?.phase==='rueck'&&s.ships[ship].ankunft-s.w3.auftrag.zeit===s.tick,
   360,'original W3 arrival');
 assert.ok(s.owners.st_aldera.cash>=15&&s.stations.st_nadir.lager.wasser>0);
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
 console.log('M4_U8_REAL_RETURN',JSON.stringify({ship,menge:p.menge,extraFee:p.gebuehr,returnMinutes:minutes,pauses,tick:s.tick,hash:w.hash(s)}));
});
