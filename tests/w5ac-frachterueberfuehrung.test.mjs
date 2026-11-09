import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';
import Session from '../prototypes/w5ac/session.js';
import OldW5 from '../prototypes/w5ab/original-w5-core.js';

const {core,rules}=Original;
const ownerCash=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
function good(snapshot){
 const s=snapshot.state,a=core.audit(s),t=snapshot.transfer.audit;
 assert.equal(s.rulesVersion,191);assert.equal(s.schema,8);
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(a.isk.ok,true);assert.equal(a.goods.ok,true);
 assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);
 assert.equal(a.w5transfer.ok,true);
 assert.equal(snapshot.finance.ok,true);
 assert.equal(snapshot.refinery.audit.ok,true);
 assert.equal(snapshot.shipyard.audit.ok,true);
 assert.equal(snapshot.freight.audit.ok,true);
 assert.equal(t.ok,true);
 assert.equal(ownerCash(s),33000,'all owners and escrow cash independently summed');
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);
 assert.equal(s.owners.w5ac_transfer_reserved.cash,s.w5ac.allocated-s.w5ac.paid);
 assert.equal(s.owners.w5ac_transfer_pilot.cash,s.w5ac.paid);
 assert.equal(t.worker,s.w5ac.paid);assert.equal(t.reserved,s.owners.w5ac_transfer_reserved.cash);
 assert.equal(s.stations.st_nadir.lager.frachter,s.w5.fertig-s.w5.verkauft);
 assert.equal(s.stations.st_nadir.lager.material,s.w4.materialErzeugt-s.w5.materialVerbraucht);
 assert.equal(s.stations.st_nadir.lager.erz,s.w3.geliefert-s.w4.erzVerbraucht);
 const c=rules.w5Transfer;
 assert.equal(t.routeMinutes,core.route(rules.world,c.quelle,c.ziel).zeit);
 assert.equal(t.perMinute,c.lohnJeMinute);
}
function supply(seed){
 const session=Session.create(seed),cmd=(type,schiff)=>{
  const r=session.command({type,...(schiff?{schiff}:{})});
  assert.equal(r.ok,true,type+' '+r.reason);good(session.snapshot());
 };
 good(session.snapshot());
 assert.equal(session.command({type:'transferStart',schiff:'sh002'}).ok,false);
 cmd('freightBuy');
 session.advance(50);good(session.snapshot());
 cmd('freightStart');
 session.advance(60);good(session.snapshot());
 cmd('refineStart');
 session.advance(20);good(session.snapshot());
 cmd('yardStart');
 session.advance(30);good(session.snapshot());
 cmd('yardBuy');
 const id=session.snapshot().state.w5.schiffIds[0];assert.equal(id,'sh004');
 assert.equal(session.snapshot().state.ships[id].system,'nadir');
 assert.equal(session.snapshot().state.w3.auftrag.phase,'rueck');
 assert.equal(session.snapshot().state.tick,160);
 assert.equal(session.snapshot().transfer.quotes[id].ok,false,'concurrent W3 transfer excluded');
 const busy=session.snapshot().hash;
 assert.equal(session.command({type:'transferStart',schiff:id}).ok,false);
 assert.equal(session.snapshot().hash,busy);
 session.advance(10);good(session.snapshot());
 assert.equal(session.snapshot().state.tick,170);
 assert.equal(session.snapshot().state.owners.transport.cash,620);
 return {session,id,cmd};
}
test('W5ac: Rule191 is a clearly changed isolated derivative of Rule19 and the original W5s-b paid ferry',()=>{
 const source=readFileSync(new URL('../prototypes/w5ac/rule191-w5-ferry-core.js',import.meta.url),'utf8');
 assert.match(source,/Rule191 research derivative of original W5 Rule19 PR #170/);
 assert.match(source,/const m_core_w5_transfer=/);
 assert.match(source,/w5Transfer:\{owner:'transport'/);
 assert.match(source,/rulesVersion:191/);
 assert.match(source,/m_core_w5_transfer\.tick\(state,rules\)/);
 assert.match(source,/m_core_w5_transfer\.audit\(state,m_data_erzpilot\.W5_RULES\)/);
 assert.equal(rules.rulesVersion,191);
 assert.equal(OldW5.rules.rulesVersion,19);
 const x=Session.create(42),hash=x.snapshot().hash;
 assert.throws(()=>x.import(OldW5.core.save(OldW5.core.createW5State(42))),/Regel191|Rule191/);
 assert.equal(x.snapshot().hash,hash);
 assert.throws(()=>OldW5.core.loadW5(x.export()),/inkompatibel/i);
 good(x.snapshot());
});
test('W5ac: two real funded purchase->Nadir ship->60-minute ferry->Aldera route, midflight save/replay',()=>{
 for(const seed of [42,7]){
  const {session,id,cmd}=supply(seed);
  const before=session.snapshot(),quote=before.transfer.quotes[id],json=session.export();
  assert.deepEqual([quote.ok,quote.von,quote.nach,quote.minuten,quote.lohn,quote.kosten],[true,'nadir','aldera',60,1,60]);
  const preview=session.preview({type:'transferStart',schiff:id});
  assert.equal(preview.ok,true);
  assert.equal(preview.carrierBefore-preview.carrierAfter,60);
  assert.equal(preview.transferAfter.reserved,60);
  assert.equal(preview.transferAfter.active,true);
  assert.equal(session.snapshot().hash,before.hash,'ferry quote must never bind real money');
  assert.equal(session.export(),json);
  cmd('transferStart',id);
  let snap=session.snapshot();good(snap);
  assert.equal(snap.state.tick,170);
  assert.equal(snap.state.owners.transport.cash,560);
  assert.equal(snap.state.owners.w5ac_transfer_reserved.cash,60);
  assert.equal(snap.state.owners.w5ac_transfer_pilot.cash,0);
  assert.equal(snap.state.ships[id].phase,'reise');
  assert.equal(snap.state.ships[id].system,'nadir','no launch teleport');
  assert.equal(snap.state.ships[id].ankunft,230);
  const pendingHash=snap.hash;
  assert.equal(session.command({type:'transferStart',schiff:id}).ok,false);
  assert.equal(session.snapshot().hash,pendingHash);
  session.advance(30);
  snap=session.snapshot();good(snap);
  assert.equal(snap.state.tick,200);
  assert.equal(snap.transfer.audit.remaining,30);
  assert.equal(snap.state.owners.w5ac_transfer_reserved.cash,30);
  assert.equal(snap.state.owners.w5ac_transfer_pilot.cash,30);
  assert.equal(snap.state.ships[id].system,'nadir');
  const replay=Session.create(seed);
  replay.import(session.export());
  assert.equal(replay.snapshot().hash,snap.hash,'midflight save/load hash');
  session.advance(30);replay.advance(30);
  snap=session.snapshot();good(snap);
  assert.equal(replay.snapshot().hash,snap.hash);
  assert.equal(snap.state.tick,230);
  assert.equal(snap.state.ships[id].system,'aldera');
  assert.equal(snap.state.ships[id].phase,'dock');
  assert.equal(snap.state.ships[id].auftrag,'halten');
  assert.equal(snap.state.ships[id].owner,'transport');
  assert.equal(snap.state.ships[id].heimat,'nadir','provenance preserved after arrival');
  assert.equal(snap.transfer.audit.completed,1);
  assert.equal(snap.transfer.audit.reserved,0);
  assert.equal(snap.transfer.audit.worker,60);
  assert.equal(snap.state.owners.transport.cash,560);
  assert.equal(snap.transfer.quotes[id].ok,false,'same hull cannot be ferried again');
  assert.equal(snap.transfer.freightQuotes[id].ok,true,'real W3 follow-up freight can now use the arrived hull');
  const arrivalHash=snap.hash,arrivalSave=session.export();
  assert.equal(session.command({type:'transferStart',schiff:'sh002'}).ok,false);
  assert.equal(session.snapshot().hash,arrivalHash);
  assert.equal(session.export(),arrivalSave);
  console.log('W5AC_PAID_FERRY '+JSON.stringify({seed,tick:230,hash:snap.hash,id,
   destination:'aldera',wageEscrow:0,pilotPaid:60,carrierCash:560,worldCash:33000,mint:0}));
 }
});
test('W5ac: the PAID relocated ship itself executes a second real W3 ore roundtrip; no borrowed starter ship',()=>{
 for(const seed of [42,7]){
  const {session,id,cmd}=supply(seed);
  cmd('transferStart',id);session.advance(60);
  const arrival=session.snapshot();
  assert.equal(arrival.transfer.freightQuotes[id].ok,true);
  cmd('freightStart',id);
  let a=session.snapshot();good(a);
  assert.equal(a.state.w3.auftrag.schiff,id,'physical W5-produced ship performs the job');
  assert.equal(a.state.owners.transport.cash,440,'full 120 W3 pilot wage reserved atop ferry cost');
  assert.equal(a.state.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(a.state.owners.w3_kauf_treuhand.cash,740);
  session.advance(60);good(session.snapshot());
  a=session.snapshot();
  assert.equal(a.state.w3.auftrag.phase,'rueck');
  assert.equal(a.state.w3.geliefert,100);
  session.advance(60);
  a=session.snapshot();good(a);
  assert.equal(a.state.tick,350);
  assert.equal(a.state.w3.abgeschlossen,2);
  assert.equal(a.state.ships[id].system,'aldera');
  assert.equal(a.state.ships[id].phase,'dock');
  assert.equal(a.state.ships[id].auftrag,'halten');
  assert.equal(a.state.owners.transport.cash,680,'real fee 240 less real wages 120 on 2nd trip');
  assert.equal(a.state.owners.w5ac_transfer_pilot.cash,60);
  assert.equal(a.state.owners.w5ac_transfer_reserved.cash,0);
  assert.equal(a.state.w5ac.completed.length,1);
  const repeated=Session.create(seed);repeated.import(session.export());
  assert.equal(repeated.snapshot().hash,a.hash);
  console.log('W5AC_NEW_HULL_ACTUAL_FREIGHT '+JSON.stringify({seed,tick:350,ship:id,
   paidW3Trips:2,realOreDelivered:100,ferryPilotPaid:60,
   carrierCash:680,worldCash:33000,hash:a.hash}));
 }
});
test('W5ac: falsified 60-ISK labor, route, ownership, completion and neutral side payments cannot be imported',()=>{
 const {session,id,cmd}=supply(42);cmd('transferStart',id);session.advance(30);
 const original=session.export(),hash=session.snapshot().hash;
 const attacks=[
  s=>{s.rulesVersion=19;},
  s=>{s.schema=99;},
  s=>{s.owners.w5ac_transfer_reserved.cash+=20;s.owners.transport.cash-=20;},
  s=>{s.owners.w5ac_transfer_pilot.cash+=1;s.owners.export.cash-=1;},
  s=>{s.w5ac.paid+=1;},
  s=>{s.w5ac.allocated+=60;},
  s=>{s.w5ac.active.id='sh002';},
  s=>{s.w5ac.active.gearbeitet=60;},
  s=>{s.ships[id].owner='house';},
  s=>{s.ships[id].system='aldera';},
  s=>{s.ships[id].ziel='st_nadir';},
  s=>{s.ships[id].ankunft+=1;},
  s=>{s.w5.schiffIds=[];},
  s=>{s.w5ac.active=null;},
  s=>{s.w5ac.completed.push({id,owner:'transport',start:170,ankunft:230,minuten:60,kosten:60});}
 ];
 for(const attack of attacks){const fake=JSON.parse(original);attack(fake);
  assert.throws(()=>session.import(JSON.stringify(fake)));
  assert.equal(session.snapshot().hash,hash,'failed import is atomic');
 }
 assert.equal(session.import(original).ok,true);
 assert.equal(session.snapshot().hash,hash);
 session.advance(30);
 const landed=session.export(),h=session.snapshot().hash;
 const forged=JSON.parse(landed);forged.ships[id].system='nadir';
 assert.throws(()=>session.import(JSON.stringify(forged)),'completed ferry provenance requires real Aldera location');
 assert.equal(session.snapshot().hash,h);
});
test('W5ac: browser uses one static Rule191 engine, safe own-ship selection and no productive save slots',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const html=read('../prototypes/w5ac/index.html'),session=read('../prototypes/w5ac/session.js');
 const ext=read('../prototypes/w5ac/extension.js'),boot=read('../prototypes/w5ac/bootstrap.js');
 const adapter=read('../prototypes/legacy-hub/core-adapter.js'),app=read('../prototypes/w5w/app.js');
 assert.match(html,/src="rule191-w5-ferry-core\.js"/);
 assert.match(html,/src="\.\.\/w5ab\/extension\.js"/);
 assert.match(html,/data-view="transfer"/);
 assert.match(html,/id="transfer-start"/);
 assert.match(html,/id="transfer-freight-start"/);
 assert.match(boot,/W5wOriginal=scope\.W5acOriginal/);
 assert.match(boot,/W5abOriginal=scope\.W5acOriginal/);
 assert.match(session,/core\.loadW5/);
 assert.match(session,/core\.pilotW5TransferStand/);
 assert.match(session,/core\.pilotW5TransferKalkulation/);
 assert.match(session,/type:'shipReposition',owner:'transport',schiff:req\.schiff/);
 assert.match(session,/state\.w5\?\.schiffIds\.includes\(req\.schiff\)/);
 assert.match(adapter,/14,15,16,17,18,19,32,191/);
 assert.match(app,/W5acExtension\?\.render/);
 assert.match(app,/W5acExtension\?\.mount/);
 assert.match(ext,/scope\.W5acExtension/);
 assert.doesNotMatch(html,/https?:\/\//);
 assert.doesNotMatch(session,/localStorage|indexedDB|sessionStorage|setItem\(|fetch\(/);
 assert.doesNotMatch(ext,/\.advance\(|localStorage/);
});
