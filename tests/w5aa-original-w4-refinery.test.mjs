import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Original from '../prototypes/w5aa/original-w4-core.js';
import Session from '../prototypes/w5aa/session.js';
import W3 from '../prototypes/w5y/original-w3-core.js';

const {core,rules}=Original;
const cash=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function audit(snapshot){
 const s=snapshot.state,a=core.audit(s);
 assert.equal(s.schema,8);
 assert.equal(s.rulesVersion,18);
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(a.w3.ok,true);
 assert.equal(a.w4.ok,true);
 assert.equal(snapshot.audit.ok,true);
 assert.equal(snapshot.finance.ok,true);
 assert.equal(snapshot.freight.audit.ok,true);
 assert.equal(snapshot.refinery.audit.ok,true);
 assert.equal(core.pilotWirtschaftsStand(s).ok,true);
 assert.equal(core.pilotW3Stand(s).ok,true);
 assert.equal(core.pilotW4Stand(s).ok,true);
 assert.equal(cash(s),33000,'independently summed exact owner ISK');
 assert.equal(s.minted,0);
 assert.equal(s.stations.st_nadir.lager.erz,s.w3.geliefert-s.w4.erzVerbraucht,
  'delivered less consumed ore = stored physical Nadir ore');
 assert.equal(s.stations.st_nadir.lager.material,s.w4.materialErzeugt,
  'W4 material exists only through genuinely completed original production');
 assert.equal(s.owners.arbeitskraefte_nadir.cash,s.w4.gezahlt,'real refinery wages');
 assert.equal(s.w4.gebucht,s.w4.gezahlt+(s.owners.w4_arbeit_treuhand?.cash??0),
  'W4 labor escrow never leaks/double pays');
 assert.equal(s.w4.materialErzeugt,5*s.w4.abgeschlossen);
 assert.equal(s.w4.erzVerbraucht,10*s.w4.abgeschlossen);
 assert.equal(s.owners.st_nadir.cash+s.w3.kaufAusgaben+s.w4.gebucht,4000,
  'one genuine finite Nadir purse pays both freight and refinery');
}
function startFreight(seed){
 const x=Session.create(seed);
 assert.equal(x.command({type:'refineStart'}).ok,false,'no free ore before real W3 delivery');
 assert.equal(x.command({type:'freightBuy'}).ok,true,'750 own ISK buys physical ship');
 x.advance(50);
 assert.equal(x.snapshot().state.stations.st_aldera.lager.erz,50);
 assert.equal(x.command({type:'freightStart'}).ok,true);
 x.advance(60);
 const s=x.snapshot();
 assert.equal(s.state.w3.geliefert,50);
 assert.equal(s.state.stations.st_nadir.lager.erz,50);
 assert.equal(s.state.stations.st_nadir.lager.material,0);
 audit(s);
 return x;
}

test('W5aa: exact unmodified original Rule18 core and separate W3/old save versions',()=>{
 const src=readFileSync(new URL('../prototypes/w5aa/original-w4-core.js',import.meta.url),'utf8');
 assert.match(src,/untouched original W4 Rule18 DATA\/CORE section from PR #169/);
 assert.match(src,/Exactly 129857 UTF-16 source code units/);
 assert.match(src,/const m_core_w4 =/);
 assert.equal(rules.rulesVersion,18);
 assert.equal(rules.schema,8);
 assert.equal(core.W4_RULES,rules);
 assert.equal(core.W3_RULES.rulesVersion,17);
 const s=Session.create(42),old=W3.core.createW3State(42);
 assert.equal(s.snapshot().state.stations.st_nadir.lager.material,0);
 assert.equal(s.snapshot().state.ledger.material.initial,0);
 assert.equal(s.snapshot().state.owners.arbeitskraefte_nadir.cash,0);
 assert.equal(s.snapshot().state.owners.st_nadir.cash,4000);
 assert.throws(()=>s.import(W3.core.save(old)),/Regel18/);
 assert.throws(()=>W3.core.loadW3(s.export()),/inkompatibel/);
 audit(s.snapshot());
});

test('W5aa: truly transported 50 ore, 20 reserved labor ISK and first 5 materials on same flight clock',()=>{
 for(const seed of [42,7]){
  const session=startFreight(seed);
  const before=session.snapshot(),json=session.export(),hash=before.hash;
  assert.equal(before.refinery.quote.ok,true);
  assert.deepEqual([before.refinery.quote.erz,before.refinery.quote.material,
   before.refinery.quote.arbeit,before.refinery.quote.dauer],[10,5,20,20]);
  const preview=session.preview({type:'refineStart'});
  assert.equal(preview.ok,true);
  assert.equal(preview.nadirBefore-preview.nadirAfter,20);
  assert.equal(preview.refineryAfter.arbeitsKasse,20);
  assert.equal(preview.refineryAfter.begonnen,1);
  assert.equal(session.export(),json,'quote may not change original owner cash');
  assert.equal(session.snapshot().hash,hash);
  assert.equal(session.command({type:'refineStart'}).ok,true);
  let s=session.snapshot();audit(s);
  assert.equal(s.state.owners.st_nadir.cash,3240);
  assert.equal(s.state.owners.w4_arbeit_treuhand.cash,20);
  assert.equal(s.state.w4.auftrag.gearbeitet,0);
  assert.equal(s.state.stations.st_nadir.lager.erz,50,'ore still exists during work');
  assert.equal(s.state.stations.st_nadir.lager.material,0);
  const pending=s.hash;
  assert.equal(session.command({type:'refineStart'}).ok,false,'no second concurrent processing contract');
  assert.equal(session.snapshot().hash,pending);
  session.advance(10);audit(session.snapshot());
  session.advance(1);session.advance(1);
  session.advance(1);session.advance(1);session.advance(1);
  session.advance(1);session.advance(1);session.advance(1);
  session.advance(1);session.advance(1); // 20 minutes all on one original W4 clock
  s=session.snapshot();audit(s);
  assert.equal(s.state.tick,130);
  assert.equal(s.state.w3.auftrag.phase,'rueck','W3 transport and W4 refinery share one tick');
  assert.equal(s.state.w3.auftrag.gearbeitet,80);
  assert.equal(s.refinery.audit.status,'bereit');
  assert.equal(s.state.stations.st_nadir.lager.erz,40);
  assert.equal(s.state.stations.st_nadir.lager.material,5);
  assert.equal(s.state.owners.w4_arbeit_treuhand.cash,0);
  assert.equal(s.state.owners.arbeitskraefte_nadir.cash,20);
  assert.equal(s.state.w4.abgeschlossen,1);
  const imported=Session.create(seed);
  assert.equal(imported.import(session.export()).ok,true);
  assert.equal(imported.snapshot().hash,s.hash);
  session.advance(50);imported.advance(50);
  assert.equal(imported.snapshot().hash,session.snapshot().hash);
  assert.equal(session.snapshot().state.w3.abgeschlossen,1);
  assert.equal(session.snapshot().state.owners.transport.cash,1370);
  console.log('W5AA_REAL_W4_FIRST '+JSON.stringify({seed,hash:session.snapshot().hash,
   material:5,oreConsumed:10,workPaid:20,freightDelivered:50,worldMoney:33000}));
 }
});

test('W5aa: 13 RNG seeds, five W3 shipments then exactly 15 real W4 batches; sixteenth denied',()=>{
 const seeds=[1,2,3,4,5,6,7,8,9,11,42,123,3301],hashes=[];
 for(const seed of seeds){
  const session=Session.create(seed);
  assert.equal(session.command({type:'freightBuy'}).ok,true);
  session.advance(50);
  for(let n=0;n<5;n++){
   assert.equal(session.snapshot().freight.quote.ok,true);
   assert.equal(session.command({type:'freightStart'}).ok,true);
   session.advance(60);session.advance(60);
   const s=session.snapshot();audit(s);
   assert.equal(s.state.w3.abgeschlossen,n+1);
   assert.equal(s.state.owners.st_nadir.cash,4000-740*(n+1));
  }
  assert.equal(session.snapshot().state.tick,650);
  assert.equal(session.snapshot().state.stations.st_nadir.lager.erz,250);
  assert.equal(session.snapshot().state.owners.st_nadir.cash,300);
  assert.equal(session.snapshot().freight.quote.ok,false,'no more W3 customer budget');
  for(let n=0;n<15;n++){
   const s=session.snapshot();assert.equal(s.refinery.quote.ok,true);
   const h=s.hash;
   assert.equal(session.command({type:'refineStart'}).ok,true);
   assert.notEqual(session.snapshot().hash,h);
   session.advance(20);
   const next=session.snapshot();audit(next);
   assert.equal(next.state.w4.abgeschlossen,n+1);
   assert.equal(next.state.owners.st_nadir.cash,300-20*(n+1));
   assert.equal(next.state.stations.st_nadir.lager.material,5*(n+1));
  }
  const after=session.snapshot(),json=session.export(),hash=after.hash;
  assert.equal(after.state.tick,950);
  assert.equal(after.state.owners.st_nadir.cash,0);
  assert.equal(after.state.owners.arbeitskraefte_nadir.cash,300);
  assert.equal(after.state.stations.st_nadir.lager.erz,100);
  assert.equal(after.state.stations.st_nadir.lager.material,75);
  assert.equal(after.state.w4.erzVerbraucht,150);
  assert.equal(after.state.w4.materialErzeugt,75);
  assert.equal(after.state.w3.geliefert,250);
  assert.equal(after.state.owners.transport.cash,1850);
  assert.equal(after.refinery.quote.ok,false);
  assert.match(after.refinery.quote.grund,/nicht bezahlen/);
  assert.equal(session.command({type:'refineStart'}).ok,false);
  assert.equal(session.snapshot().hash,hash,'funds-exhausted W4 refusal cannot mint or alter goods');
  assert.equal(session.export(),json);
  const loaded=Session.create(seed);
  assert.equal(loaded.import(json).ok,true);
  assert.equal(loaded.snapshot().hash,hash,'W4 15-charges roundtrip');
  audit(loaded.snapshot());
  hashes.push(hash);
  if(seed===42||seed===7)console.log('W5AA_W4_15_BATCES '+JSON.stringify({seed,hash,
   freight:5,refinery:15,ore:100,material:75,stationCash:0,wages:300,worldCash:33000,minted:0}));
 }
 assert.equal(new Set(hashes).size,13);
 console.log('W5AA_FINANCED_MATRIX '+JSON.stringify({seeds:13,realFreightVoyages:65,realRefineryBatches:195,distinctEconomicRegimes:1}));
});

test('W5aa: rejects forged W4 work escrow, material creation, identity and unauthorized cash transfers',()=>{
 const session=startFreight(42);
 session.command({type:'refineStart'});
 const json=session.export(),hash=session.snapshot().hash;
 for(const change of [
  s=>{s.rulesVersion=17;},
  s=>{s.schema=999;},
  s=>{s.owners.w4_arbeit_treuhand.cash+=1;},
  s=>{s.owners.st_nadir.cash+=20;s.owners.export.cash-=20;},
  s=>{s.stations.st_nadir.lager.material+=1;s.ledger.material.produced+=1;},
  s=>{s.w4.materialErzeugt+=5;s.stations.st_nadir.lager.material+=5;s.ledger.material.produced+=5;},
  s=>{s.owners.st_nadir.cash+=1000;},
  s=>{s.w4.auftrag=null;},
  s=>{s.stations.st_nadir.lager.erz+=10;}
 ]){
  const copy=JSON.parse(json);change(copy);
  assert.throws(()=>session.import(JSON.stringify(copy)),'original independent audit checks all rights/production');
  assert.equal(session.snapshot().hash,hash,'failed import atomic');
 }
 assert.equal(session.import(json).ok,true);
 assert.equal(session.snapshot().hash,hash);
 assert.equal(session.command({type:'stationRefine',owner:'npc3',station:'st_nadir'}).ok,false,'no bypass through UI');
 assert.equal(session.command({type:'shipFreight',owner:'transport',schiff:'sh002'}).ok,false);
});

test('W5aa: static W4 hub uses same original core and readable W3/W4 views without product storage',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 const html=read('../prototypes/w5aa/index.html');
 const js=read('../prototypes/w5aa/session.js');
 const ext=read('../prototypes/w5aa/extension.js');
 const boot=read('../prototypes/w5aa/bootstrap.js');
 const app=read('../prototypes/w5w/app.js');
 const adapter=read('../prototypes/legacy-hub/core-adapter.js');
 assert.match(html,/original-w4-core\.js/);
 assert.match(html,/\.\.\/w5y\/extension\.js/);
 assert.match(html,/\.\.\/w5w\/app\.js/);
 assert.match(html,/data-view="refinery"/);
 assert.match(html,/data-step="20"/);
 assert.match(html,/id="refinery-start"/);
 assert.match(html,/id="refinery-demand"/);
 assert.match(boot,/W5wOriginal=scope\.W5aaOriginal/);
 assert.match(boot,/W5yOriginal=scope\.W5aaOriginal/);
 assert.match(js,/core\.createW4State/);
 assert.match(js,/core\.loadW4/);
 assert.match(js,/core\.pilotW4Stand/);
 assert.match(js,/core\.pilotW4Kalkulation/);
 assert.match(js,/type:'stationRefine',owner:'st_nadir',station:'st_nadir'/);
 assert.match(adapter,/14,15,16,17,18,32/);
 assert.match(app,/W5aaExtension\?\.render/);
 assert.match(app,/W5aaExtension\?\.mount/);
 assert.match(ext,/scope\.W5aaExtension/);
 assert.doesNotMatch(js,/localStorage|indexedDB|sessionStorage|setItem\(/);
 assert.doesNotMatch(ext,/\.advance\(/);
 assert.doesNotMatch(html,/https?:\/\//);
});
