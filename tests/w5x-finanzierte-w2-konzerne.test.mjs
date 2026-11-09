import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {create}=require('../prototypes/w5x/session.js');
const {core,rules}=require('../prototypes/w5x/original-w2-core.js');
const {create:oldW1}=require('../prototypes/w5w/session.js');
const {create:oldR14}=require('../prototypes/w5u/session.js');
const q=(s,type,extra={})=>s.preview({type,schiff:s.snapshot().selected,...extra});
const cmd=(s,type,extra={})=>s.command({type,schiff:s.snapshot().selected,...extra});
const check=s=>{
 const x=s.snapshot();
 assert.equal(x.state.rulesVersion,16);
 assert.equal(x.state.schema,8);
 assert.equal(x.audit.ok,true);
 assert.equal(x.finance.ok,true);
 assert.equal(x.audit.finanzierung.ok,true);
 assert.equal(x.corporation.crisis.kaeuferNachweisOk,true);
 assert.equal(x.audit.total,27000);
 assert.equal(x.state.minted,0);
 assert.equal(x.state.burned,0);
 assert.equal(core.hash(core.loadW2(s.export())),x.hash);
 return x;
};

test('W5x: exact immutable Rule16 Data/Core slice from W2 PR167, not copied W1 economics',()=>{
 const f=readFileSync(new URL('../prototypes/w5x/original-w2-core.js',import.meta.url),'utf8');
 const a=f.indexOf('const m_data_systeme ='),b=f.indexOf('\nconst api=Object.freeze({core:m_core_index,rules:m_data_erzpilot.W2_RULES})');
 assert.ok(a>0&&b>a);
 const source=f.slice(a,b);
 assert.equal(source.length,110280);
 assert.equal(createHash('sha256').update(source).digest('hex'),
   '28dc594b195f241dedb2593217bf7f6c40dc81c87735253e14834cc190f9875d');
 assert.equal(rules.rulesVersion,16);
 assert.equal(rules.schema,8);
 assert.equal(core.W2_RULES,rules);
});

test('W5x: real NPC investment buys second 600-ISK miner, never pre-existing free hull',()=>{
 for(const seed of [42,7]){
  const s=create(seed),initial=check(s),initialJson=s.export();
  assert.equal(initial.state.tick,0);
  assert.equal(initial.corporation.crisis.status,'arbeitsbereit');
  assert.equal(initial.corporation.crisis.planbar,50);
  assert.equal(initial.corporation.crisis.eigene,1);
  assert.equal(initial.corporation.investment.ok,false);
  assert.equal(initial.state.ships.sh001.owner,'npc3');
  assert.equal(initial.state.owners.npc3.cash,2400);
  assert.equal(initial.state.owners.werft_extern.cash,600);
  assert.equal(s.export(),initialJson,'dashboard snapshot must remain pure');
  s.advance(60);s.advance(60);
  const x=check(s);
  assert.equal(x.state.tick,120);
  assert.equal(x.corporation.crisis.eigene,2);
  assert.equal(x.state.ships.sh002.owner,'npc3');
  assert.equal(x.state.ships.sh001.owner,'npc3');
  assert.equal(x.state.ledger.miner.consumed,2);
  assert.equal(x.state.owners.werft_extern.cash,1200);
  assert.equal(x.state.owners.npc3.cash,2500);
  assert.equal(x.corporation.crisis.finanzierte,1);
  assert.equal(x.corporation.crisis.kaeuferCash,19000);
  assert.equal(x.corporation.crisis.vorbestand,50);
  assert.equal(x.corporation.crisis.kaeuferNachweisOk,true);
  assert.equal(x.bundle.corporation.company.availableCapital,3000);
  assert.equal(x.bundle.corporation.ships.length,0,'NPC hulls must not appear as player property');
 }
});

test('W5x: player competes under exactly the same paid purchase and W0 ore contracts',()=>{
 for(const seed of [42,7]){
  const s=create(seed),saved=s.export();
  assert.equal(q(s,'shipBuy',{station:'st_aldera',klasse:'miner'}).ok,true);
  assert.equal(s.export(),saved);
  assert.equal(cmd(s,'shipBuy',{station:'st_aldera',klasse:'miner'}).ok,true);
  assert.equal(s.snapshot().selected,'sh002');
  assert.equal(check(s).state.owners.house.cash,2400);
  assert.equal(q(s,'shipMine',{ware:'erz'}).ok,true);
  assert.equal(cmd(s,'shipMine',{ware:'erz'}).ok,true);
  s.advance(10);s.advance(1);s.advance(1);s.advance(1);
  const m=check(s);
  assert.equal(m.state.ships.sh002.ladung.erz,13);
  assert.equal(m.contracts.auftraege,2);
  assert.equal(m.contracts.gebunden,1000);
  assert.equal(m.contracts.arbeitsGebunden,148);
  assert.equal(m.finance.konzerne.house.gebunden,74);
  const before=s.export(),stop=q(s,'shipWait');
  assert.equal(stop.ok,true);
  assert.equal(stop.cashBefore,2300);
  assert.equal(stop.cashAfter,2504);
  assert.equal(s.export(),before);
  assert.equal(cmd(s,'shipWait').ok,true);
  const x=check(s);
  assert.equal(x.finance.konzerne.house.erloese,130);
  assert.equal(x.finance.konzerne.house.netto,-496);
  assert.equal(x.state.owners.st_aldera.cash,370);
  assert.equal(x.state.ships.sh002.auftrag,'halten');
  assert.equal(x.contracts.auftraege,1);
 }
});

test('W5x: real end customer depletion stops two solvent NPCs without rescue or restart',()=>{
 for(const seed of [42,7]){
  const s=create(seed);
  for(let i=0;i<24;i++)s.advance(60);
  const x=check(s);
  assert.equal(x.state.tick,1440);
  assert.equal(x.state.owners.export.cash,0);
  assert.equal(x.state.ledger.erz.exported,2000);
  assert.equal(x.corporation.crisis.status,'absatzstopp');
  assert.equal(x.corporation.crisis.planbar,0);
  assert.equal(x.corporation.crisis.eigene,2);
  assert.equal(x.corporation.crisis.ruhend,2);
  assert.equal(x.corporation.crisis.finanzierte,0);
  assert.equal(x.corporation.crisis.kundenlueckeISK,10);
  assert.equal(x.state.owners.npc3.cash,17800);
  assert.equal(x.corporation.investment.ok,false);
  assert.ok(Object.values(x.state.ships).filter(sh=>sh.owner==='npc3').every(sh=>sh.auftrag==='halten'));
  const mined=x.state.ledger.erz.mined,owner=x.state.owners.npc3.cash;
  const saved=s.export();const before=s.snapshot().hash;
  for(let j=0;j<24;j++)s.advance(60);
  const after=check(s);
  assert.equal(after.state.ledger.erz.mined,mined);
  assert.equal(after.state.owners.npc3.cash,owner);
  assert.equal(after.corporation.crisis.status,'absatzstopp');
  assert.equal(core.hash(core.loadW2(saved)),before);
 }
});

test('W5x: W1, Rule14, altered money, forged buyer revenues or contracts never import as W2',()=>{
 const s=create(42);s.advance(60);
 const saved=s.export(),before=s.snapshot().hash;
 for(const mutation of [
  x=>x.rulesVersion=15,x=>x.rulesVersion=14,x=>x.schema=9,
  x=>x.owners.house.cash+=1,
  x=>x.owners.export.cash+=1000,
  x=>{x.owners.npc3.cash-=1000;x.owners.export.cash+=1000;},
  x=>x.ledger.erz.mined+=1,
  x=>x.erzpilotVertraege.sh001.menge+=1,
  x=>x.ships.sh001.owner='house',
  x=>x.owners.erz_treuhand_sh001.cash+=1,
  x=>x.owners.erz_arbeit_sh001.cash+=1
 ]){
  const next=JSON.parse(saved);mutation(next);
  assert.throws(()=>s.import(JSON.stringify(next)));
  assert.equal(s.export(),saved);
 }
 assert.throws(()=>s.import('{'));
 assert.throws(()=>s.import(oldW1().export()));
 assert.throws(()=>s.import(oldR14().export()));
 assert.equal(s.snapshot().hash,before);
 const other=create(7);
 other.import(saved);assert.equal(other.export(),saved);
 assert.equal(check(other).hash,before);
});

test('W5x: read-only crisis/decision view and 2D/HQ projection never alter RNG or world',()=>{
 const a=create(42),b=create(42);
 const old=a.export();
 for(let i=0;i<20;i++){const x=check(a);a.snapshot();
  assert.equal(x.corporation.crisis.aktiv,true);
  assert.ok(typeof x.corporation.investment.grund==='string'||x.corporation.investment.ok);
  assert.equal(a.export(),old);}
 for(let tick=0;tick<120;tick++){
  a.advance(1);b.advance(1);
  check(a);assert.equal(a.export(),b.export());
 }
 const x=check(a),h=x.hash;a.select;assert.equal(a.snapshot().hash,h);
 assert.equal(x.state.ledger.miner.consumed,2);
});

test('W5x: 13 deterministic Rule16 seeds ×90 simulated days, daily money/goods/audit and checkpoint Save/Load',()=>{
 const seeds=[42,7,1,2,3,4,5,6,8,9,11,13,99];
 let worlds=0,checks=0;
 for(const seed of seeds){
  let state=core.createW2State(seed);
  for(let day=1;day<=90;day++){
   core.advance(state,1440,rules);
   const a=core.audit(state),crisis=core.pilotNpcKrisenLage(state);
   assert.equal(a.ok,true,'seed '+seed+' day '+day+' '+JSON.stringify(a));
   assert.equal(a.total,27000);
   assert.equal(state.minted,0);
   assert.equal(crisis.kaeuferNachweisOk,true);
   if(day===30||day===60||day===90){
    const h=core.hash(state);
    state=core.loadW2(core.save(state));assert.equal(core.hash(state),h);
   }
   checks++;
  }
  assert.equal(core.pilotNpcKrisenLage(state).status,'absatzstopp');
  worlds++;
 }
 console.log('W5X_W2_LONGTERM '+JSON.stringify({worlds,days:90,audits:checks,worldMoney:27000,doesNotProveRenewableDemand:true}));
 assert.equal(worlds,13);
 assert.equal(checks,1170);
});

test('W5x: static single-Core W2 browser contract and protected W1 UI persist unchanged',()=>{
 const html=readFileSync(new URL('../prototypes/w5x/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../prototypes/w5w/app.js',import.meta.url),'utf8');
 const bridge=readFileSync(new URL('../prototypes/w5x/bootstrap.js',import.meta.url),'utf8');
 const extension=readFileSync(new URL('../prototypes/w5x/extension.js',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5x/session.js',import.meta.url),'utf8');
 assert.match(html,/src="original-w2-core\.js"/);
 assert.match(html,/src="\.\.\/w5w\/app\.js"/);
 assert.doesNotMatch(html,/src="\.\.\/w5w\/original-w1-core\.js"/);
 assert.match(html,/id="w2-company-stats"/);
 assert.match(html,/id="w2-investment"/);
 assert.match(html,/data-view="corporation"/);
 assert.match(app,/globalThis\.W5xExtension\?\.render\(snap\)/);
 assert.match(bridge,/scope\.W5wSession=scope\.W5xSession/);
 assert.match(extension,/pilot|invest|const c=snap\.corporation\.crisis/);
 assert.match(js,/core\.loadW2/);
 assert.doesNotMatch(js,/indexedDB|localStorage|sessionStorage|setItem|fetch\(/);
 assert.doesNotMatch(html,/(?:https?:)?\/\/cdn\./);
});
