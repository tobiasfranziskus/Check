import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {create}=require('../prototypes/w5u/session.js');
const {core,rules}=require('../prototypes/w5u/original-core.js');
const command=(s,type,args={})=>s.command({type,schiff:s.snapshot().selected,...args});
const quote=(s,type,args={})=>s.preview({type,schiff:s.snapshot().selected,...args});
const inspect=s=>{const x=s.snapshot();assert.equal(x.audit.ok,true);assert.equal(core.hash(core.load(s.export())),x.hash);return x;};

test('W5v: preview performs original-core trade on detached state only; exact cash, cargo and station match',()=>{
 for(const seed of [42,7,1234]){
  const s=create(seed),before=inspect(s),original=s.export();
  const q=quote(s,'shipTrade',{ware:'miner',menge:1,kauf:true});
  assert.equal(q.ok,true);
  assert.equal(q.auditOk,true);
  assert.equal(q.type,'shipTrade');
  assert.equal(q.ware,'miner');
  assert.equal(q.cashBefore,before.state.owners.house.cash);
  assert.ok(q.cashAfter<q.cashBefore,'purchase must spend existing money');
  assert.equal(q.cashDelta,q.cashAfter-q.cashBefore);
  assert.equal(q.cargoBefore,0);
  assert.equal(q.cargoAfter,1);
  assert.equal(q.cargoDelta,1);
  assert.equal(q.stationBefore-1,q.stationAfter);
  assert.equal(s.export(),original,'preview must not mutate state, RNG or journal');
  for(let i=0;i<10;i++)assert.deepEqual(quote(s,'shipTrade',{ware:'miner',menge:1,kauf:true}),q);
  assert.equal(s.export(),original);
  assert.equal(command(s,'shipTrade',{ware:'miner',menge:1,kauf:true}).ok,true);
  const actual=inspect(s).state;
  assert.equal(actual.owners.house.cash,q.cashAfter);
  assert.equal(actual.ships.sh001.ladung.miner||0,q.cargoAfter);
  assert.equal(actual.stations[q.station].lager.miner,q.stationAfter);
 }
});

test('W5v: selling after a paid purchase previews the actual Core payout without phantom ISK',()=>{
 for(const seed of [42,7]){
  const s=create(seed);
  assert.equal(command(s,'shipTrade',{ware:'miner',menge:1,kauf:true}).ok,true);
  const before=s.export();
  const q=quote(s,'shipTrade',{ware:'miner',menge:1,kauf:false});
  assert.equal(q.ok,true);
  assert.equal(q.cargoBefore,1);
  assert.equal(q.cargoAfter,0);
  assert.ok(q.cashDelta>0);
  assert.equal(s.export(),before);
  assert.equal(command(s,'shipTrade',{ware:'miner',menge:1,kauf:false}).ok,true);
  const actual=inspect(s).state;
  assert.equal(actual.owners.house.cash,q.cashAfter);
  assert.equal(actual.ships.sh001.ladung.miner||0,q.cargoAfter);
  assert.equal(actual.stations[q.station].lager.miner,q.stationAfter);
 }
});

test('W5v: only real bought hulls can be previewed and activated, and no free ship appears',()=>{
 for(const seed of [42,7]){
  const s=create(seed),before=inspect(s);
  const noHull=quote(s,'shipActivate',{klasse:'miner'});
  assert.equal(noHull.ok,false);
  assert.equal(s.snapshot().hash,before.hash);
  assert.equal(command(s,'shipTrade',{ware:'miner',menge:1,kauf:true}).ok,true);
  const money=s.snapshot().state.owners.house.cash;
  const beforeActivation=s.export();
  const q=quote(s,'shipActivate',{klasse:'miner'});
  assert.equal(q.ok,true);
  assert.equal(q.ownedShipsAfter,q.ownedShipsBefore+1);
  assert.equal(q.cargoBefore,1);
  assert.equal(q.cargoAfter,0);
  assert.equal(q.cashBefore,money);
  assert.equal(q.cashAfter,money);
  assert.equal(s.export(),beforeActivation);
  assert.equal(command(s,'shipActivate',{klasse:'miner'}).ok,true);
  const next=inspect(s);
  assert.equal(next.state.owners.house.cash,q.cashAfter);
  assert.equal(Object.values(next.state.ships).filter(x=>x.owner==='house').length,q.ownedShipsAfter);
  assert.equal(next.state.ships.sh001.ladung.miner||0,q.cargoAfter);
  assert.equal(quote(s,'shipActivate',{klasse:'miner'}).ok,false);
 }
});

test('W5v: missing money, ownership, quantity or stock rejected; no preview or rejected command may change save',()=>{
 const s=create(),base=s.export();
 for(const req of [
  {type:'shipTrade',schiff:'sh003',ware:'miner',menge:1,kauf:true},
  {type:'shipTrade',schiff:'sh001',ware:'miner',menge:999999,kauf:true},
  {type:'shipTrade',schiff:'sh001',ware:'miner',menge:0,kauf:true},
  {type:'shipTrade',schiff:'sh001',ware:'erz',menge:100000,kauf:false},
  {type:'stationBuildShip',schiff:'sh001'},
  {type:'shipActivate',schiff:'sh001',klasse:'jaeger'},
  {type:'shipTrade',schiff:'sh001',ware:'fake',menge:1,kauf:true},
 ]){
  const q=s.preview(req);
  assert.equal(q.ok,false,JSON.stringify(req));
  assert.equal(s.export(),base);
 }
 assert.equal(s.preview(null).ok,false);
 assert.equal(s.export(),base);
 const foreign=JSON.parse(base);foreign.owners.house.cash++;
 assert.throws(()=>s.import(JSON.stringify(foreign)));
 assert.equal(s.export(),base);
});

test('W5v: read-only previews never progress RNG/tick/queue; stays deterministic after export/import and advancing',()=>{
 const s=create(42),other=create(7);
 assert.equal(other.snapshot().hash===s.snapshot().hash,false);
 const start=s.export();
 const cmds=[
  {type:'shipTrade',schiff:'sh001',ware:'miner',menge:1,kauf:true},
  {type:'shipTrade',schiff:'sh001',ware:'miner',menge:4,kauf:true},
  {type:'shipActivate',schiff:'sh001',klasse:'miner'},
  {type:'shipTrade',schiff:'sh001',ware:'erz',menge:1,kauf:false},
 ];
 for(let i=0;i<16;i++){s.preview(cmds[i%cmds.length]);inspect(s);}
 assert.equal(s.export(),start);
 other.import(start);
 assert.equal(other.export(),start);
 for(const t of [1,10,60]){
  s.advance(t);other.advance(t);
  for(let i=0;i<8;i++)s.preview(cmds[i%cmds.length]);
  assert.equal(s.export(),other.export(),'read-only quotes must not affect simulation or RNG');
  inspect(s);
 }
});

test('W5v: HTML shows two independent polite quote regions; no framework, new save key or background writes',()=>{
 const html=readFileSync(new URL('../prototypes/w5u/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../prototypes/w5u/app.js',import.meta.url),'utf8');
 const session=readFileSync(new URL('../prototypes/w5u/session.js',import.meta.url),'utf8');
 assert.match(html,/id="trade-preview"[^>]*role="status"/);
 assert.match(html,/id="activate-preview"[^>]*role="status"/);
 assert.match(html,/aria-live="polite"/);
 assert.match(app,/session\.preview\(\{type:'shipTrade'/);
 assert.match(app,/session\.preview\(\{type:'shipActivate'/);
 assert.match(app,/textContent=quoteLabel/);
 assert.doesNotMatch(session,/localStorage|indexedDB|setItem|fetch\(|XMLHttpRequest/);
 assert.doesNotMatch(html,/(?:https?:)?\/\/cdn\./);
});
