// Exact M4-U5 replay, then isolated U7/U8 counterfactual. No live/save migration.
// Every economic transition invokes the authoritative world commands.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const K=require('../prototypes/welt/welt-kern.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const cmd=(type,owner,rest={})=>({type,owner,...rest});
function check(w,s){
 assert.deepEqual(pruefen(w,s),[]);
 const saved=w.save(s);
 assert.equal(w.save(w.load(saved)),saved);
}
function snapshot(w,s){
 const a=s.stations.st_aldera.lager,n=s.stations.st_nadir.lager;
 return {tick:s.tick,house:s.owners.house.cash,aldera:s.owners.st_aldera.cash,
  nadir:s.owners.st_nadir.cash,npc3:s.owners.npc3.cash,werft:s.owners.werft_extern.cash,
  export:s.owners.export.cash,oreA:a.erz,oreN:n.erz,
  waterA:a.wasser,waterN:n.wasser,iceN:n.eis,
  iceFree:w.kern.obergrenze(s,w.rules,'st_nadir','eis')-n.eis,
  oreDone:s.w3.abgeschlossen,waterReturned:s.kanon.wasser.rueckGeliefert,
  hash:w.hash(s)};
}
function run(w,s){
 const before=snapshot(w,s),events=[],ship='sh003';
 assert.equal(s.ships[ship].owner,'house');
 assert.equal(before.export,0);
 let stage='pause';
 const yes=(c)=>{
  const result=w.execute(s,c);assert.equal(result.ok,true,JSON.stringify(c)+': '+result.reason);
  events.push({tick:s.tick,cmd:c,result});check(w,s);return result;
 };
 // Stop unbound house ore runs exactly as the existing UI permits.
 for(const sh of Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id))){
  const p=s.kanon.pendel[sh.id];
  if(sh.owner==='house'&&p?.ware==='erz'&&!p.beenden&&!s.erzpilotVertraege?.[sh.id]
   &&Object.values(sh.ladung).every(x=>x===0))yes(cmd('shipShuttleStop','house',{schiff:sh.id}));
 }
 // A docked NPC miner can provide real ore under the K7 industrial
 // purchase, even with zero export buyer budget. No invented buyers.
 const candidates=()=>Object.values(s.ships).filter(sh=>
  sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'
  &&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
  &&!w.stillgelegt(s,sh.id)&&!s.erzpilotVertraege?.[sh.id]
  &&Object.values(sh.ladung).every(x=>x===0)).sort((a,b)=>a.id.localeCompare(b.id));
 const probes=[];
 let selected=null;
 for(let t=0;t<=240&&!selected;t++){
  for(const miner of candidates()){
   const commands=[
    cmd('industrialOreOffer','st_nadir',{miner:miner.id,frachter:ship}),
    cmd('industrialOreAcceptMine','npc3'),cmd('industrialOreAcceptFreight','house'),
    cmd('industrialOreAcceptYard','werft_extern'),cmd('industrialOreCommit','st_nadir')];
   const copy=w.load(w.save(s));let reject=null;
   for(const c of commands){
    const old=w.save(copy),r=w.execute(copy,c);
    if(!r.ok){assert.equal(w.save(copy),old,'atomic refusal');reject={cmd:c,reason:r.reason};break;}
    check(w,copy);
   }
   if(!reject){selected=commands;break;}
   if(!probes.some(x=>x.reason===reject.reason))probes.push(reject);
  }
  if(!selected&&t<240)w.advance(s,1);
 }
 if(!selected){
  check(w,s);
  // Explicit economic failure result; not a successful transport.
  return {outcome:'BLOCKED_BEFORE_CONTRACT',before,after:snapshot(w,s),probes,
    candidates:candidates().map(x=>x.id),events};
 }
 stage='contract';
 for(const c of selected)yes(c);
 const count=s.w3.abgeschlossen,waterBefore=s.kanon.wasser.rueckGeliefert;
 for(let t=0;t<480&&s.w3.auftrag?.phase!=='rueck';t++)w.advance(s,1);
 if(s.w3.auftrag?.phase!=='rueck'){
  check(w,s);
  return {outcome:'BLOCKED_AFTER_CONTRACT',stage,before,after:snapshot(w,s),
    active:s.w3.auftrag,probes,events};
 }
 check(w,s);
 const arrival=snapshot(w,s);
 assert.equal(s.w3.auftrag.carrier,'house');
 assert.equal(s.w3.auftrag.menge,50);
 yes(cmd('industrialWaterAcceptBackhaul','house',{schiff:ship}));
 const waterCommand=cmd('industrialWaterBackhaul','st_aldera',{schiff:ship});
 const old=w.save(s),load=w.execute(s,waterCommand);
 if(!load.ok)assert.equal(w.save(s),old,'atomic buyer refusal');
 check(w,s);
 events.push({tick:s.tick,cmd:waterCommand,result:load});
 const remaining=s.ships[ship].ankunft-s.tick;
 w.advance(s,remaining);check(w,s);
 assert.equal(s.w3.abgeschlossen,count+1);
 assert.equal(s.w5ad.freight.at(-1).owner,'house');
 assert.equal(s.w5ad.freight.at(-1).fee,240);
 assert.equal(s.w5ad.freight.at(-1).work,120);
 assert.equal(s.kanon.wasser.rueckGeliefert-waterBefore,load.ok?load.menge:0);
 const delivered=snapshot(w,s);
 // Allow genuine existing water production to run, never change inventories.
 w.advance(s,180);check(w,s);
 const after=snapshot(w,s),iceQuote=w.kern.pilotIceFreightQuote(s,ship);
 return {outcome:load.ok?'REAL_COMBINED_DELIVERY':'REAL_ORE_ONLY',before,arrival,delivered,after,
  load,iceQuote,events,probes};
}
test('M4-U7/U8: exact 48-round fork, original owner commands, audited delivery or explicit real blocker',()=>{
 const j=engpassNach48(),original=j.exportieren(),old=j.weltReferenz();
 assert.equal(j.ansicht().hash,'f63f2cd09ba5a88c');
 const raw=JSON.parse(original),capital=raw.w5ad.profile;
 // Test-only conversion adds the explicit opt-in profile marker and nothing else.
 // It is NOT a public migration API or authorization from an imported save.
 const w=K.erstellenU8(capital);
 raw.kanon.u8ErzRueckfracht=true;
 const s=w.load(JSON.stringify(raw));check(w,s);
 const unmarked=JSON.parse(w.save(s));delete unmarked.kanon.u8ErzRueckfracht;
 assert.equal(old.canonical(unmarked),old.canonical(JSON.parse(original)));
 const initial=w.save(s),a=run(w,s),clone=w.load(initial),b=run(w,clone);
 assert.deepEqual(a,b,'deterministic counterfactual result');
 assert.equal(w.save(s),w.save(clone));
 assert.equal(j.exportieren(),original,'no changes to original test career');
 assert.equal(Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 if(a.outcome.startsWith('BLOCKED'))assert.equal(a.after.oreDone,a.before.oreDone);
 else assert.equal(a.delivered.oreDone,a.before.oreDone+1);
 console.log('M4_U7_U8_48_ROUND_RESULT '+JSON.stringify(a));
});
