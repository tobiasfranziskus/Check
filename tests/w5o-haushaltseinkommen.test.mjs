import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r=api.W5O_RULES,seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function audit(s,label=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+': '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([k,v])=>v?.ok===false))));
  assert.equal(s.rulesVersion,30);assert.equal(s.schema,8);
  assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000,label+' ISK conservation');
  for(const [id,o]of Object.entries(s.owners))
    assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'nonnegative cash '+id+' '+label);
  for(const [ware,x]of Object.entries(s.ledger)){
    const actual=Object.values(s.stations).reduce((n,z)=>n+(z.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,z)=>n+(z.ladung[ware]||0),0);
    assert.equal(actual,x.initial+x.mined+x.produced+x.imported-x.consumed-x.exported,
      label+' commodity '+ware);
  }
  assert.equal(a.w5n.ok,true);assert.equal(a.w5o.ok,true);
}
const start=(seed=42,mode='full',owner='npc3')=>{
  const s=api.createW5OState(seed,mode,owner);audit(s,'start');
  assert.equal(api.hash(api.loadW5O(api.save(s))),api.hash(s));
  return s;
};
function day(s){api.advance(s,1440,r);audit(s,'day '+(s.tick/1440));return s}
function invalid(s,changer){
 const raw=api.save(s),hash=api.hash(s),x=api.loadW5O(raw);changer(x);
 assert.equal(api.audit(x).ok,false,'ledger forgery must be rejected');
 assert.throws(()=>api.loadW5O(api.save(x)),/fehlerhaft/);
 assert.equal(api.hash(s),hash,'original preserved');
}
test('W5o: R30 separate, R26/R27/R28/R29 goldens and saves unchanged',()=>{
 const a=api.createW5IState(42);
 assert.equal(api.hash(a),'343559f8c88543e4');
 assert.equal(api.audit(a).ok,true);
 for(const [s,load] of [[api.createW5LState(42),api.loadW5L],
   [api.createW5MState(42),api.loadW5M],[api.createW5NState(42),api.loadW5N]]){
   assert.equal(api.audit(s).ok,true);
   assert.equal(api.hash(load(api.save(s))),api.hash(s));
   assert.throws(()=>api.loadW5O(api.save(s)),/inkompatibel/);
 }
 const s=start();
 assert.throws(()=>api.loadW5N(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.createW5OState(42,'subsidy','npc3'),/ungueltig/i);
 assert.throws(()=>api.createW5OState(42,'full','unknown'),/ungueltig/i);
});
test('W5o: one core clock, fully paid owner and transport startup, zero minted ISK',()=>{
 const s=start();
 assert.equal(s.owners.npc3.cash,2400,'NPC miner really bought for 600');
 assert.equal(s.owners.transport.cash,1250,'freighter really bought for 750');
 assert.equal(s.w5o.ausgezahlt,0);
 assert.equal(s.w5n.wasserErlos,0);
 assert.equal(s.owners.w5n_kunden.cash,1400);
 for(let i=0;i<48;i++)api.advance(s,60,r);
 audit(s,'48 hours');
 assert.ok(s.w5n.wasserVerbraucht>=80,'supply is real and already recurring');
 assert.ok(s.w5o.lohnEis>0&&s.w5o.lohnFracht>0&&s.w5o.lohnWasser>0);
 assert.ok(s.w5o.divMine>0&&s.w5o.divFracht>0&&s.w5o.divStation>0);
 assert.equal(s.owners.w5n_kunden.cash,1400+s.w5o.ausgezahlt-s.w5n.wasserErlos);
 const old=api.hash(s);for(let i=0;i<120;i++)api.pilotW5OStand(s);
 assert.equal(api.hash(s),old,'financial projection is strictly read-only');
});
test('W5o: no rescue, finite household accounts exhaust without wage/dividend recycling',()=>{
 const s=start(42,'none','npc3');
 for(let i=0;i<20;i++)day(s);
 assert.equal(s.w5o.ausgezahlt,0);
 assert.equal(s.w5n.wasserVerbraucht,100);
 assert.equal(s.owners.w5n_kunden.cash,0);
 assert.equal(s.w5n.wasserErlos,1400);
 assert.ok(s.w5n.knappheitsStunden>0);
 const consumed=s.w5n.wasserVerbraucht;
 for(let i=0;i<10;i++)day(s);
 assert.equal(s.w5n.wasserVerbraucht,consumed,'customer insolvency stops water sales');
 assert.equal(s.minted,0);
});
test('W5o: 90d counterfactuals distinguish wages, NPC saving and player saving',()=>{
 const variants=[
   ['none','npc3',100,0,2110],
   ['wages','npc3',310,0,2006],
   ['npcSave','npc3',789,9,1766],
   ['full','npc3',4316,3221,2],
   ['full','house',733,10,1794],
 ];
 for(const [mode,owner,water,cash,shortage]of variants){
   const s=start(42,mode,owner);
   for(let d=0;d<90;d++)day(s);
   assert.equal(s.w5n.wasserVerbraucht,water,mode+'/'+owner+' only real purchases');
   assert.equal(s.owners.w5n_kunden.cash,cash,mode+'/'+owner+' no hidden budget');
   assert.equal(s.w5n.knappheitsStunden,shortage,mode+'/'+owner);
   assert.equal(s.minted,0);assert.equal(s.burned,0);
   if(owner==='house'){
     assert.equal(s.w5o.divMine,0,'player profit must not be seized');
     assert.ok(s.owners.house.cash>3000,'player can accumulate savings');
   }
   console.log('W5O_VERGLEICH '+JSON.stringify({mode,owner,
     wasser:water,haushalt:cash,mangelstunden:shortage,hash:api.hash(s)}));
 }
});
test('W5o: each real paid wage and profit share independently audited; tampering denied',()=>{
 const s=start(42);
 for(let d=0;d<4;d++)day(s);
 assert.ok(s.w5o.divStation>0);
 invalid(s,x=>{x.w5o.ausgezahlt+=1;x.owners.w5n_kunden.cash+=1;x.owners.st_nadir.cash-=1});
 invalid(s,x=>{x.w5o.lohnEis+=1000;});
 invalid(s,x=>{x.w5o.divMine+=10;x.w5o.ausgezahlt+=10;
   x.owners.npc3.cash-=10;x.owners.w5n_kunden.cash+=10;});
 invalid(s,x=>{x.w5o.divStation+=500;x.w5o.ausgezahlt+=500;
   x.owners.st_nadir.cash-=500;x.owners.w5n_kunden.cash+=500;});
 invalid(s,x=>{x.owners.w5n_kunden.cash+=1});
 invalid(s,x=>{x.stations.st_nadir.lager.wasser+=1});
});
test('W5o: 13 seeds x 90d, stable replay, money+commodity audits, save/load',()=>{
 for(const seed of seeds){
   const s=start(seed,'full','npc3'),replay=start(seed,'full','npc3');
   for(let day=1;day<=90;day++){
     api.advance(s,1440,r);
     api.advance(replay,1440,r);
     audit(s,'seed '+seed+' day '+day);
     assert.equal(api.hash(s),api.hash(replay),'canonical replay '+seed+' day '+day);
     if(day===30||day===60||day===90)
       assert.equal(api.hash(api.loadW5O(api.save(s))),api.hash(s),
         'save/load '+seed+' day '+day);
   }
   assert.equal(s.w5n.wasserVerbraucht,4316,'steady system must not depend on seed-specific luck');
   assert.equal(s.w5n.knappheitsStunden,2);
   assert.equal(s.minted,0);
   console.log('W5O_90T '+JSON.stringify({seed,hash:api.hash(s),
     wasser:s.w5n.wasserVerbraucht,haushalt:s.owners.w5n_kunden.cash,
     income:s.w5o.ausgezahlt,ISKGesamt:33000}));
 }
});
