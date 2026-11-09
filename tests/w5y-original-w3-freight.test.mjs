import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import W3 from '../prototypes/w5y/original-w3-core.js';
import Session from '../prototypes/w5y/session.js';
const {core,rules}=W3;
function money(s){return Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);}
function good(s){
 const a=core.audit(s);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(core.pilotW3Stand(s).ok,true);
 assert.equal(core.pilotWirtschaftsStand(s).ok,true);
 assert.equal(money(s),33000,'33k existing ISK; no emission');
 assert.equal(s.minted,0);
}
test('W5y: exact Rule17 W3 original engine, Rule15/16 are isolated',()=>{
 const src=readFileSync(new URL('../prototypes/w5y/original-w3-core.js',import.meta.url),'utf8');
 assert.match(src,/exact original W3 Rule17 DATA\/CORE section/);
 assert.match(src,/Length of untouched source section: 120919/);
 assert.match(src,/const m_core_w3 =/);
 assert.match(src,/createW3State/);
 assert.equal(rules.rulesVersion,17);
 assert.equal(rules.schema,8);
 assert.equal(core.W3_RULES,rules);
 const a=Session.create(42),b=a.snapshot();
 assert.equal(b.state.rulesVersion,17);
 assert.equal(b.state.schema,8);
 assert.equal(b.freight.audit.ok,true);
 good(b.state);
 assert.equal(b.bundle.tick,0);
 assert.equal(b.bundle.freightOrders.length,0);
 assert.equal(b.bundle.ownerId,'house');
 const invalid=Session.create(42);
 const wrong=JSON.parse(invalid.export());wrong.rulesVersion=16;
 assert.throws(()=>invalid.import(JSON.stringify(wrong)),/Regel17/);
});
test('W5y: financed 50-ore original outward and return freight, two seeds and independent accounts',()=>{
 for(const seed of [42,7]){
  const s=Session.create(seed);
  const noHalter=s.command({type:'freightStart'});
  assert.equal(noHalter.ok,false);
  const buyQuote=s.preview({type:'freightBuy'});
  assert.equal(buyQuote.ok,true);
  assert.equal(buyQuote.carrierBefore,2000);
  assert.equal(buyQuote.carrierAfter,1250);
  assert.equal(s.snapshot().state.owners.transport.cash,2000,'preview cannot buy ships');
  assert.equal(s.command({type:'freightBuy'}).ok,true);
  const sh=s.snapshot().state.ships[s.snapshot().freight.shipId];
  assert.ok(sh&&sh.klasse==='frachter'&&sh.owner==='transport');
  assert.equal(s.snapshot().state.owners.transport.cash,1250);
  assert.equal(s.snapshot().state.stations.st_aldera.lager.frachter,0);
  assert.equal(s.command({type:'freightStart'}).ok,false,'no free ore before production');
  assert.equal(s.advance(50).ok,true);
  assert.equal(s.snapshot().state.stations.st_aldera.lager.erz,50);
  const ready=s.snapshot(),hash=ready.hash,json=s.export();
  const quote=ready.freight.quote;
  assert.equal(quote.ok,true);
  assert.equal(quote.gesamt,740);
  assert.equal(quote.arbeitsKosten,120);
  assert.equal(quote.erzWert,500);
  const preview=s.preview({type:'freightStart'});
  assert.equal(preview.ok,true);
  assert.equal(preview.freightAfter.kaufTreuhand,740);
  assert.equal(preview.freightAfter.arbeitTreuhand,120);
  assert.equal(s.snapshot().hash,hash);
  assert.equal(s.export(),json);
  assert.equal(s.command({type:'shipFreight',schiff:sh.id,owner:'house'}).ok,false,'UI cannot bypass W3 contract validation');
  assert.equal(s.command({type:'freightStart',schiff:sh.id}).ok,true);
  let t=s.snapshot();
  assert.equal(t.freight.audit.status,'hin');
  assert.equal(t.state.owners.st_nadir.cash,3260);
  assert.equal(t.state.owners.w3_kauf_treuhand.cash,740);
  assert.equal(t.state.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(t.state.ships[sh.id].ladung.erz,50);
  good(t.state);
  for(let i=0;i<60;i++){s.advance(1);good(s.snapshot().state);}
  t=s.snapshot();
  assert.equal(t.state.tick,110);
  assert.equal(t.freight.audit.status,'rueck');
  assert.equal(t.state.stations.st_nadir.lager.erz,50);
  assert.equal(t.state.w3.geliefert,50,'ware has reached its destination; seller receipt validated by core W3 audit');
  assert.equal(t.state.owners.w3_kauf_treuhand.cash,240);
  assert.equal(t.state.owners.w3_arbeit_treuhand.cash,60);
  const replay=Session.create(seed);
  assert.equal(replay.import(s.export()).ok,true);
  assert.equal(replay.snapshot().hash,s.snapshot().hash);
  for(let i=0;i<60;i++){s.advance(1);replay.advance(1);good(s.snapshot().state);}
  assert.equal(replay.snapshot().hash,s.snapshot().hash);
  t=s.snapshot();
  assert.equal(t.state.tick,170);
  assert.equal(t.freight.audit.status,'frei');
  assert.equal(t.state.w3.geliefert,50);
  assert.equal(t.state.w3.abgeschlossen,1);
  assert.equal(t.state.w3.arbeitsKosten,120);
  assert.equal(t.state.w3.frachtUmsatz,240);
  assert.equal(t.state.owners.transport.cash,1370);
  assert.equal(t.state.owners.fonds_transport.cash,120);
  assert.equal(t.state.owners.w3_kauf_treuhand.cash,0);
  assert.equal(t.state.owners.w3_arbeit_treuhand.cash,0);
  assert.equal(t.state.owners.st_nadir.cash,3260);
  good(t.state);
  console.log('W5Y_W3_REAL_DELIVERY '+JSON.stringify({seed,hash:t.hash,delivered:50,wage:120,freightRevenue:240,worldCash:33000}));
 }
});
test('W5y: rejected falsified W3 money, cargo, ownership, rule version, and import does not modify current world',()=>{
 const s=Session.create(42);
 s.command({type:'freightBuy'});s.advance(50);s.command({type:'freightStart'});
 const json=s.export(),hash=s.snapshot().hash;
 for(const mutation of [
   o=>{o.owners.st_nadir.cash+=740;},
   o=>{o.stations.st_nadir.lager.erz+=50;},
   o=>{o.ships[Object.keys(o.ships).find(k=>o.ships[k].klasse==='frachter')].owner='house';},
   o=>{o.owners.w3_arbeit_treuhand.cash+=10;},
   o=>{o.rulesVersion=16;},
   o=>{o.schema=999;}
 ]){
   const copy=JSON.parse(json);mutation(copy);
   assert.throws(()=>s.import(JSON.stringify(copy)));
   assert.equal(s.snapshot().hash,hash);
 }
 assert.equal(s.import(json).ok,true);
 assert.equal(s.snapshot().hash,hash);
});
test('W5y: static touch shell reuses validated HQ/2D and does not introduce a second economic core or save-slot',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const html=read('../prototypes/w5y/index.html'),app=read('../prototypes/w5w/app.js');
 const session=read('../prototypes/w5y/session.js'),extension=read('../prototypes/w5y/extension.js');
 const adapter=read('../prototypes/legacy-hub/core-adapter.js');
 assert.match(html,/src="original-w3-core\.js"/);
 assert.match(html,/src="\.\.\/w5w\/app\.js"/);
 assert.match(html,/data-view="freight"/);
 assert.match(html,/data-step="50"/);
 assert.match(html,/id="freight-buy"/);
 assert.match(html,/id="freight-start"/);
 assert.match(html,/src="\.\.\/w5u\/ship-graphics\.js"/);
 assert.match(app,/W5yExtension\?\.mount/);
 assert.match(app,/W5yExtension\?\.render/);
 assert.match(session,/core\.createW3State/);
 assert.match(session,/core\.loadW3/);
 assert.match(session,/core\.pilotW3Kalkulation/);
 assert.match(adapter,/14,15,16,17,32/);
 assert.match(extension,/scope\.W5yExtension=/);
 assert.doesNotMatch(session,/localStorage|indexedDB|sessionStorage|setItem|fetch\(/);
 assert.doesNotMatch(html,/https?:\/\//);
 assert.doesNotMatch(html,/src="\.\.\/w5x\/original-w2-core\.js"/);
});
