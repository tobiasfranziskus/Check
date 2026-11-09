import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Original from '../prototypes/w5ab/original-w5-core.js';
import Session from '../prototypes/w5ab/session.js';
import W4 from '../prototypes/w5aa/original-w4-core.js';

const {core,rules}=Original;
const countCash=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function good(snap) {
 const s=snap.state,report=core.audit(s);
 assert.equal(s.rulesVersion,19);
 assert.equal(s.schema,8);
 assert.equal(report.ok,true,JSON.stringify(report));
 assert.equal(report.w3.ok,true);assert.equal(report.w4.ok,true);assert.equal(report.w5.ok,true);
 assert.equal(snap.audit.ok,true);
 assert.equal(snap.shipyard.audit.ok,true);
 assert.equal(snap.refinery.audit.ok,true);
 assert.equal(snap.freight.audit.ok,true);
 assert.equal(snap.finance.ok,true);
 assert.equal(countCash(s),33000,'independently sum all owner and escrow accounts');
 assert.equal(snap.audit.total,33000);
 assert.equal(s.minted,0,'no invented ISK');
 assert.equal(s.stations.st_nadir.lager.erz,s.w3.geliefert-s.w4.erzVerbraucht,'genuinely delivered ore minus refined');
 assert.equal(s.stations.st_nadir.lager.material,s.w4.materialErzeugt-s.w5.materialVerbraucht,'really created material minus consumed in paid ship');
 assert.equal(s.stations.st_nadir.lager.frachter,s.w5.fertig-s.w5.verkauft,'physical produced unsold hulls');
 assert.equal(s.owners.st_nadir.cash+s.w3.kaufAusgaben+s.w4.gebucht-s.w5.materialUmsatz,4000,
   'Nadir receives ONLY real W5 materials sales and pays W3/W4 from own cash');
 assert.equal(s.owners.arbeiter_werft_nadir.cash,s.w5.arbeitsGezahlt,'every shipyard wage transferred');
 assert.equal(s.owners.w5_arbeit_treuhand?.cash??0,s.w5.arbeitsGebunden-s.w5.arbeitsGezahlt);
 assert.equal(s.w5.materialUmsatz,500*s.w5.begonnen);
 assert.equal(s.w5.materialVerbraucht,5*s.w5.begonnen);
 assert.equal(s.w5.arbeitsGebunden,30*s.w5.begonnen);
 for(const id of s.w5.schiffIds){
  const ship=s.ships[id];assert.equal(ship.owner,'transport');assert.equal(ship.klasse,'frachter');
  assert.equal(ship.heimat,'nadir');assert.equal(ship.system,'nadir');
 }
}
function firstProduction(seed=42) {
 const session=Session.create(seed),cmd=type=>{
  const r=session.command({type});assert.equal(r.ok,true,type+': '+r.reason);
 };
 const initial=session.snapshot();good(initial);
 assert.equal(initial.state.stations.st_nadir.lager.material,0);
 assert.equal(initial.state.stations.st_nadir.lager.frachter,0);
 assert.equal(initial.state.ledger.frachter.produced,0);
 assert.equal(initial.state.owners.arbeiter_werft_nadir.cash,0);
 assert.equal(session.command({type:'yardStart'}).ok,false,'no free starting W5 material');
 assert.equal(session.command({type:'yardBuy'}).ok,false,'no free finished freighter');
 assert.equal(session.snapshot().hash,initial.hash,'both denials must be atomic');
 cmd('freightBuy');
 session.advance(50);cmd('freightStart');session.advance(60);
 let s=session.snapshot();good(s);
 assert.equal(s.state.stations.st_nadir.lager.erz,50);
 assert.equal(s.state.w3.auftrag.phase,'rueck','W3 return can coexist with production');
 cmd('refineStart');session.advance(20);s=session.snapshot();good(s);
 assert.equal(s.state.stations.st_nadir.lager.material,5);
 assert.equal(s.state.owners.arbeitskraefte_nadir.cash,20);
 assert.equal(s.state.owners.st_nadir.cash,3240);
 return {session,cmd};
}

test('W5ab: original unmodified Rule19 with strict separate Rule18 saves, no starting material or ship',()=>{
 const src=readFileSync(new URL('../prototypes/w5ab/original-w5-core.js',import.meta.url),'utf8');
 assert.match(src,/exact original W5 Rule19 DATA\/CORE section from PR #170/);
 assert.match(src,/141030 UTF-16 source code units/);
 assert.match(src,/const m_core_w5 =/);
 assert.equal(rules.rulesVersion,19);assert.equal(rules.schema,8);
 assert.equal(core.W5_RULES,rules);
 const s=Session.create(42);
 good(s.snapshot());
 const prev=Session.create(42),old=W4.core.save(W4.core.createW4State(42));
 assert.throws(()=>s.import(old),/Regel19/);
 assert.equal(s.snapshot().hash,prev.snapshot().hash,'old-version rejection does not modify state');
 assert.throws(()=>W4.core.loadW4(s.export()),/inkompatibel/i);
});

test('W5ab: Rule19 pays real 500 material + 30 wages, builds hull only after work, then truly sells for 750',()=>{
 for(const seed of [42,7]){
  const {session,cmd}=firstProduction(seed);
  const ready=session.snapshot(),json=session.export(),hash=ready.hash,q=ready.shipyard.quote;
  assert.deepEqual([q.ok,q.material,q.materialKosten,q.arbeitKosten,q.dauer,q.preis],[true,5,500,30,30,750]);
  const p=session.preview({type:'yardStart'});
  assert.equal(p.ok,true);
  assert.equal(p.nadirAfter-p.nadirBefore,500,'500 real buyer funds go to Nadir before building');
  assert.equal(p.yardAfter.werftEscrow,30,'30 full labor reserve before work');
  assert.equal(p.yardAfter.materialLager,0,'five material immediately consumed only when paid');
  assert.equal(session.snapshot().hash,hash,'preview must remain read-only');
  assert.equal(session.export(),json);
  cmd('yardStart');
  let snap=session.snapshot();good(snap);
  assert.equal(snap.state.owners.st_nadir.cash,3740);
  assert.equal(snap.state.stations.st_nadir.lager.material,0);
  assert.equal(snap.state.owners.w5_arbeit_treuhand.cash,30);
  assert.equal(snap.state.ledger.frachter.produced,0,'not built before 30 genuine work minutes');
  const pendingHash=snap.hash;
  assert.equal(session.command({type:'yardStart'}).ok,false,'no double spending of a live shipyard order');
  assert.equal(session.snapshot().hash,pendingHash);
  session.advance(20);good(session.snapshot());
  assert.equal(session.snapshot().state.owners.arbeiter_werft_nadir.cash,20);
  assert.equal(session.snapshot().state.owners.w5_arbeit_treuhand.cash,10);
  const saved=session.export(),reloaded=Session.create(seed);
  assert.equal(reloaded.import(saved).ok,true);
  assert.equal(reloaded.snapshot().hash,session.snapshot().hash,'replay in-flight shipyard contract');
  session.advance(10);reloaded.advance(10);
  assert.equal(reloaded.snapshot().hash,session.snapshot().hash);
  snap=session.snapshot();good(snap);
  assert.equal(snap.state.tick,160);
  assert.equal(snap.state.stations.st_nadir.lager.frachter,1);
  assert.equal(snap.state.ledger.frachter.produced,1);
  assert.equal(snap.state.owners.arbeiter_werft_nadir.cash,30);
  assert.equal(snap.state.owners.w5_arbeit_treuhand.cash,0);
  assert.equal(snap.shipyard.sale.ok,true);
  const buyPreview=session.preview({type:'yardBuy'});
  assert.equal(buyPreview.ok,true);
  assert.equal(buyPreview.carrierBefore-buyPreview.carrierAfter,750);
  assert.equal(buyPreview.yardAfter.verkauft,1);
  assert.equal(session.snapshot().hash,snap.hash);
  cmd('yardBuy');
  snap=session.snapshot();good(snap);
  assert.equal(snap.state.w5.fertig,1);
  assert.equal(snap.state.w5.verkauft,1);
  assert.equal(snap.state.stations.st_nadir.lager.frachter,0);
  assert.equal(snap.state.owners.werft_extern.cash,2170);
  assert.equal(snap.state.owners.transport.cash,380);
  const id=snap.state.w5.schiffIds[0],ship=snap.state.ships[id];
  assert.equal(id,'sh004');
  assert.equal(ship.owner,'transport');
  assert.equal(ship.system,'nadir','NO free transfer from the shipyard to Aldera');
  assert.equal(ship.phase,'dock');
  const hashAfter=snap.hash;
  assert.equal(session.command({type:'yardBuy'}).ok,false,'one hull sold only once');
  assert.equal(session.snapshot().hash,hashAfter);
  assert.equal(session.import(session.export()).ok,true);
  assert.equal(session.snapshot().hash,hashAfter);
  console.log('W5AB_FIRST_FINANCED_HULL '+JSON.stringify({seed,tick:snap.state.tick,hash:snap.hash,
   ship:id,location:ship.system,materialPaid:500,shipyardWagesPaid:30,shipBoughtFor:750,
   nadirCash:snap.state.owners.st_nadir.cash,carrierCash:snap.state.owners.transport.cash,
   worldMoney:33000,minted:0}));
 }
});

test('W5ab: second physical 750-ISK hull cannot be sold to 740-ISK carrier; real material revenue finances Nadir',()=>{
 for(const seed of [42,7]){
  const {session,cmd}=firstProduction(seed);
  cmd('yardStart');session.advance(30);cmd('yardBuy');session.advance(10);
  let s=session.snapshot();good(s);
  assert.equal(s.state.tick,170);
  assert.equal(s.state.owners.transport.cash,620);
  assert.equal(s.state.owners.st_nadir.cash,3740,'real 500 received for material');
  assert.equal(s.freight.quote.ok,true,'Nadir can finance a new real W3 freight after material sale');
  cmd('freightStart');session.advance(60);session.advance(60);
  s=session.snapshot();good(s);
  assert.equal(s.state.w3.abgeschlossen,2);
  assert.equal(s.state.owners.transport.cash,740);
  assert.equal(s.state.owners.st_nadir.cash,3000);
  assert.equal(s.state.stations.st_nadir.lager.erz,90);
  cmd('refineStart');session.advance(20);
  assert.equal(session.snapshot().state.stations.st_nadir.lager.material,5);
  cmd('yardStart');session.advance(30);
  s=session.snapshot();good(s);
  assert.equal(s.state.tick,340);
  assert.equal(s.state.w5.fertig,2);
  assert.equal(s.state.w5.verkauft,1);
  assert.equal(s.state.stations.st_nadir.lager.frachter,1,'second complete physical hull unsold');
  assert.equal(s.state.owners.transport.cash,740,'carrier is missing exactly 10 ISK');
  assert.equal(s.shipyard.sale.ok,false);
  assert.match(s.shipyard.sale.grund,/nicht bezahlen/);
  const before=s.hash,saved=session.export();
  assert.equal(session.command({type:'yardBuy'}).ok,false,'no 10-ISK invented bridge loan');
  assert.equal(session.snapshot().hash,before);
  assert.equal(session.export(),saved);
  assert.equal(s.state.owners.st_nadir.cash,3480,'second material sale genuinely replenishes station cash');
  assert.equal(s.state.w5.materialUmsatz,1000);
  assert.equal(s.state.owners.arbeiter_werft_nadir.cash,60);
  assert.equal(s.state.minted,0);
  console.log('W5AB_UNSOLD_SECOND_HULL '+JSON.stringify({seed,hash:s.hash,tick:s.state.tick,
   built:2,sold:1,unsold:1,carrier:740,need:750,materialRevenue:1000,worldMoney:33000}));
 }
});

test('W5ab: forged material, ship ID, wage escrow and neutral owner transfers are rejected atomically',()=>{
 const {session,cmd}=firstProduction(42);
 cmd('yardStart');
 const before=session.export(),hash=session.snapshot().hash;
 for(const f of [
  s=>{s.rulesVersion=18;},
  s=>{s.schema=999;},
  s=>{s.owners.st_nadir.cash+=500;s.owners.werft_extern.cash-=500;},
  s=>{s.owners.w5_arbeit_treuhand.cash+=1;s.owners.werft_extern.cash-=1;},
  s=>{s.stations.st_nadir.lager.material+=1;s.ledger.material.produced+=1;},
  s=>{s.stations.st_nadir.lager.frachter+=1;s.ledger.frachter.produced+=1;},
  s=>{s.w5.auftrag=null;},
  s=>{s.w5.materialUmsatz+=500;},
  s=>{s.owners.arbeiter_werft_nadir.cash+=30;}
 ]){
  const o=JSON.parse(before);f(o);
  assert.throws(()=>session.import(JSON.stringify(o)),'Core rejects fraudulent ownership or production');
  assert.equal(session.snapshot().hash,hash,'failed import never mutates live world');
 }
 assert.equal(session.command({type:'stationBuildShip',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(session.command({type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'}).ok,false);
 assert.equal(session.snapshot().hash,hash);
});

test('W5ab: static single-core hub is Rule19 only, original commands, no writes to user storage',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const html=read('../prototypes/w5ab/index.html');
 const session=read('../prototypes/w5ab/session.js');
 const ext=read('../prototypes/w5ab/extension.js');
 const boot=read('../prototypes/w5ab/bootstrap.js');
 const adapter=read('../prototypes/legacy-hub/core-adapter.js');
 const app=read('../prototypes/w5w/app.js');
 assert.match(html,/src="original-w5-core\.js"/);
 assert.match(html,/src="\.\.\/w5aa\/extension\.js"/);
 assert.match(html,/data-view="shipyard"/);
 assert.match(html,/id="yard-build"/);
 assert.match(html,/id="yard-buy"/);
 assert.match(html,/data-step="30"/);
 assert.match(boot,/W5wOriginal=scope\.W5abOriginal/);
 assert.match(boot,/W5yOriginal=scope\.W5abOriginal/);
 assert.match(boot,/W5aaOriginal=scope\.W5abOriginal/);
 assert.match(session,/core\.createW5State/);
 assert.match(session,/core\.loadW5/);
 assert.match(session,/core\.pilotW5Stand/);
 assert.match(session,/core\.pilotW5Kalkulation/);
 assert.match(session,/core\.pilotW5Verkauf/);
 assert.match(session,/type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'/);
 assert.match(session,/type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'/);
 assert.match(adapter,/14,15,16,17,18,19,32/);
 assert.match(app,/W5abExtension\?\.render/);
 assert.match(app,/W5abExtension\?\.mount/);
 assert.match(ext,/scope\.W5abExtension=/);
 assert.doesNotMatch(session,/localStorage|indexedDB|sessionStorage|setItem\(|fetch\(/);
 assert.doesNotMatch(ext,/\.advance\(|setItem\(/);
 assert.doesNotMatch(html,/https?:\/\//);
});
