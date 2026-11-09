import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {create}=require('../prototypes/w5w/session.js');
const {core,rules}=require('../prototypes/w5w/original-w1-core.js');
const {create:oldRule14}=require('../prototypes/w5u/session.js');
const check=s=>{
 const x=s.snapshot();
 assert.equal(x.audit.ok,true);
 assert.equal(x.finance.ok,true);
 assert.equal(x.audit.vollkosten.ok,true);
 assert.equal(x.audit.contracts.ok,true);
 assert.equal(x.audit.total,27000);
 assert.equal(x.state.minted,0);
 assert.equal(x.state.burned,0);
 assert.equal(core.hash(core.loadErz(s.export())),x.hash);
 return x;
};
const command=(s,type,args={})=>s.command({type,schiff:s.snapshot().selected,...args});
const preview=(s,type,args={})=>s.preview({type,schiff:s.snapshot().selected,...args});
function fullCase(seed=42){
 const s=create(seed);
 assert.equal(command(s,'shipBuy',{station:'st_aldera',klasse:'miner'}).ok,true);
 const id=s.snapshot().selected;
 assert.equal(command(s,'shipMine',{ware:'erz'}).ok,true);
 s.advance(10);s.advance(1);s.advance(1);s.advance(1);
 return {s,id};
}

test('W5w: W1 module is exact signed PR164 Core, no UI or economic rewrite',()=>{
 const src=readFileSync(new URL('../prototypes/w5w/original-w1-core.js',import.meta.url),'utf8');
 const a=src.indexOf('const m_data_systeme ='),b=src.indexOf('\nconst api=Object.freeze({core:m_core_index,rules:m_data_erzpilot.ERZ_RULES})');
 assert.ok(a>0&&b>a);
 const slice=src.slice(a,b);
 assert.equal(slice.length,99770);
 assert.equal(createHash('sha256').update(slice).digest('hex'),
  'e614aab677beea021ae75b3cde0afc22b7436370b6a9ab34918bd66a74efe2f2');
 assert.equal(rules.rulesVersion,15);assert.equal(rules.schema,8);
 assert.equal(core.ERZ_RULES,rules);
 assert.equal(core.pilotWirtschaftsStand(core.createErzState()).ok,true);
});

test('W5w: original W1 startup, paid NPC hull and no free player ship in 2 seeds',()=>{
 for(const [seed,expected] of [[42,'7ab8197d1a499abb'],[7,'d014994756868ab2']]){
  const s=create(seed),x=check(s);
  assert.equal(x.hash,expected);
  assert.equal(x.owner,'house');
  assert.equal(x.selected,null);
  assert.equal(x.state.tick,0);
  assert.equal(x.state.owners.house.cash,3000);
  assert.equal(x.state.owners.npc3.cash,2400);
  assert.equal(x.state.owners.werft_extern.cash,600);
  assert.equal(x.state.ledger.miner.consumed,1);
  assert.equal(x.bundle.corporation.ships.length,0);
  assert.equal(x.bundle.station.stations[0].ships[0].owner,'npc3');
  assert.equal(x.state.owners.export.cash,20000);
  assert.equal(x.contracts.auftraege,0);
  assert.equal(x.finance.konzerne.house.netto,0);
  assert.equal(x.finance.konzerne.npc3.netto,-600);
 }
});

test('W5w: 600 ISK real player miner, same original NPC/player mining and fully prepaid contracts',()=>{
 for(const seed of [42,7]){
  const s=create(seed),start=s.export();
  assert.throws(()=>s.select('sh001'),/eigene/);
  const buy=preview(s,'shipBuy',{station:'st_aldera',klasse:'miner'});
  assert.equal(buy.ok,true);assert.equal(buy.cashBefore,3000);assert.equal(buy.cashAfter,2400);
  assert.equal(buy.shipsBefore,0);assert.equal(buy.shipsAfter,1);
  assert.equal(s.export(),start);
  assert.equal(command(s,'shipBuy',{station:'st_aldera',klasse:'miner'}).ok,true);
  const id=s.snapshot().selected;
  assert.equal(id,'sh002');assert.equal(check(s).state.ledger.miner.consumed,2);
  assert.equal(preview(s,'shipMine',{ware:'erz'}).ok,true);
  assert.equal(command(s,'shipMine',{ware:'erz'}).ok,true);
  assert.equal(s.snapshot().contracts.gebunden,0,'reservation starts only with real Core minute');
  s.advance(10);s.advance(1);s.advance(1);s.advance(1);
  const x=check(s);
  assert.equal(x.state.tick,13);
  assert.equal(x.state.ships[id].ladung.erz,13);
  assert.equal(x.state.ships.sh001.ladung.erz,13);
  assert.equal(x.contracts.auftraege,2);
  assert.equal(x.contracts.gebunden,1000);
  assert.equal(x.contracts.arbeitsGebunden,148);
  assert.equal(x.finance.konzerne.house.frei,2300);
  assert.equal(x.finance.konzerne.house.gebunden,74);
  assert.equal(x.finance.konzerne.npc3.gebunden,74);
  assert.equal(x.state.owners.st_aldera.cash,0);
  assert.equal(x.finance.foerderArbeit,52);
  assert.equal(x.state.ledger.erz.mined,26);
  assert.equal(x.audit.total,27000);
 }
});

test('W5w: stop pays exactly 13 delivered ore and returns 370 station / 74 labor escrow with full audits',()=>{
 for(const seed of [42,7]){
  const {s,id}=fullCase(seed),before=s.export();
  const q=preview(s,'shipWait');
  assert.equal(q.ok,true);
  assert.equal(q.cashBefore,2300);
  assert.equal(q.cashAfter,2504);
  assert.equal(q.cargoBefore,13);
  assert.equal(q.cargoAfter,0);
  assert.equal(q.buyerBefore,0);
  assert.equal(q.buyerAfter,370);
  assert.equal(s.export(),before);
  assert.equal(command(s,'shipWait').ok,true);
  const x=check(s);
  assert.equal(x.finance.konzerne.house.erloese,130);
  assert.equal(x.finance.konzerne.house.kosten,626);
  assert.equal(x.finance.konzerne.house.netto,-496,'600 ship and 26 labor versus 130 revenue');
  assert.equal(x.finance.konzerne.house.gebunden,0);
  assert.equal(x.finance.station.frei,370);
  assert.equal(x.finance.station.gebunden,500,'NPC contract still funded');
  assert.equal(x.contracts.auftraege,1);
  assert.equal(x.state.ships[id].auftrag,'halten');
  assert.equal(x.state.ships[id].ladung.erz||0,0);
  assert.equal(x.state.stations.st_aldera.lager.erz,13);
  assert.equal(x.state.owners.export.cash,20000,'outside customer not invoiced until actual export');
  const h=x.hash;s.select(id);check(s);assert.equal(s.snapshot().hash,h);
 }
});

test('W5w: invalid ownership, unfinanced hulls and wrong commands reject atomically',()=>{
 for(const seed of [42,7]){
  const s=create(seed),begin=s.export();
  for(const cmd of [
   {type:'shipBuy',station:'st_nadir',klasse:'miner'},
   {type:'shipBuy',station:'st_aldera',klasse:'frachter'},
   {type:'shipMine',schiff:'sh001',ware:'erz'},
   {type:'shipMine',schiff:'sh001',ware:'silizium'},
   {type:'stationBuildShip'},
  ]){
   assert.equal(s.preview(cmd).ok,false);
   assert.equal(s.command(cmd).ok,false);
   assert.equal(s.export(),begin);
  }
  assert.throws(()=>s.advance(13),/Schritte/);
  assert.equal(s.export(),begin);
  for(let i=0;i<10;i++)s.snapshot();
  assert.equal(s.export(),begin);
 }
});

test('W5w: damaged, future and Rule14 saves rejected; W1 roundtrip preserves escrow/hash across replay',()=>{
 const {s}=fullCase(),saved=s.export(),h=s.snapshot().hash;
 const another=create(7);another.import(saved);
 assert.equal(another.export(),saved);
 assert.equal(another.snapshot().hash,h);
 for(const mutation of [
  x=>x.rulesVersion=14,x=>x.schema=9,
  x=>x.owners.house.cash++,
  x=>x.owners.st_aldera.cash++,
  x=>x.owners.erz_treuhand_sh002.cash++,
  x=>x.owners.erz_arbeit_sh002.cash++,
  x=>x.erzpilotVertraege.sh002.menge++,
  x=>x.ledger.erz.mined++,
  x=>x.ships.sh002.owner='npc3',
 ]){
  const bad=JSON.parse(saved);mutation(bad);
  assert.throws(()=>another.import(JSON.stringify(bad)));
  assert.equal(another.export(),saved);
 }
 assert.throws(()=>another.import('{'));
 assert.throws(()=>another.import(oldRule14().export()));
 assert.equal(another.export(),saved);
 for(let i=0;i<30;i++){
  s.advance(1);another.advance(1);
  check(s);check(another);
  assert.equal(s.export(),another.export());
 }
});

test('W5w: view projections and 2D source are static, read-only, and safe from productive browser slots',()=>{
 const html=readFileSync(new URL('../prototypes/w5w/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../prototypes/w5w/app.js',import.meta.url),'utf8');
 const session=readFileSync(new URL('../prototypes/w5w/session.js',import.meta.url),'utf8');
 assert.match(html,/src="original-w1-core\.js"/);
 assert.doesNotMatch(html,/src="\.\.\/w5u\/original-core\.js"/);
 assert.match(html,/src="\.\.\/w5u\/ship-graphics\.js"/);
 assert.match(html,/id="ship"/);
 assert.match(html,/id="hq"/);
 assert.match(html,/id="station"/);
 assert.match(html,/id="contracts"/);
 assert.match(app,/W5wSession\.create/);
 assert.match(app,/textContent=/);
 assert.match(app,/graphics\.zeichnen/);
 assert.doesNotMatch(session,/indexedDB|localStorage|sessionStorage|setItem/);
 assert.doesNotMatch(html,/(?:https?:)?\/\/cdn\./);
});
