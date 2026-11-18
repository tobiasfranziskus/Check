/* Regression gates for independent P3 #508 report.
 * Intentionally NOT importing its characterization tests: those must remain
 * historical evidence of the original failures, not silently rewritten.
 * All behavior is Node22 research-only; no product rule or save migration.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
process.env.APHROS_P3_FAIR_FERRY_RESEARCH='1';
const J8=require('../prototypes/verbund/konzern-session.js');
const World=require('../prototypes/welt/welt-kern.js');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');

function open(){
 const fixture=erstellen(),session=J8.erstellen();
 session.oeffnen204(fixture.save,true);
 const world=session.weltReferenz(),state=session.zustandReferenz();
 assert.equal(state.rulesVersion,204);
 assert.equal(state.tick,3160);
 assert.equal(world.hash(state),fixture.hash);
 return {fixture,session,world,state};
}
function check(world,state){
 const a=world.audit(state);
 assert.equal(a.ok,true,(a.fehler||[]).join('; '));
 for(const k of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[k].ok,true,k);
 assert.equal(Object.values(state.owners).reduce((n,v)=>n+v.cash,0),33000);
 assert.equal(state.minted,0);assert.equal(state.burned,0);
 assert.ok([0,1].includes(Number(!!state.w3.auftrag)
  +Number(!!state.w5n.frachtauftrag)+Number(!!state.w5ac.active)));
 assert.equal(world.hash(world.load(world.save(state))),world.hash(state));
}
function start(){
 const x=open();
 assert.equal(x.world.p3ForschungsAnmeldung(x.state,x.fixture.second,360).ok,true);
 let n=0;
 while(x.state.tick<3520 && x.state.w5ac.active?.id!==x.fixture.second){
  x.world.minute(x.state);n++;
 }
 assert.equal(x.state.tick,3377);
 assert.equal(x.state.w5ac.active?.id,x.fixture.second);
 assert.equal(x.state.w5ac.active.kosten,60);
 assert.equal(x.state.owners[x.world.rules.w5Transfer.reserved].cash,60);
 check(x.world,x.state);
 return x;
}
test('P3 audit fix: active 60-minute original W5ac save/reload keeps one lane and bit-identical continuation',()=>{
 const {fixture,world,state}=start();
 const cold=World.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const clone=cold.load(world.save(state));
 assert.equal(world.hash(state),cold.hash(clone));
 assert.equal(cold.p3ForschungsStatus().wartend,null);
 for(let minute=1;minute<=60;minute++){
  world.minute(state);cold.minute(clone);
  assert.equal(state.tick,3377+minute);
  assert.equal(world.hash(state),cold.hash(clone),
    'same saved Rule204 state must replay identically at minute '+minute);
  assert.equal(Number(!!clone.w3.auftrag)+Number(!!clone.w5n.frachtauftrag)
    +Number(!!clone.w5ac.active),1,'no overlapping NPC lane after load');
  assert.equal(clone.owners[cold.rules.w5Transfer.reserved].cash,60-minute);
 }
 const receipt=state.w5ac.completed.find(a=>a.id===fixture.second);
 assert.equal(receipt.ankunft,3437);
 assert.equal(clone.w5ac.completed.find(a=>a.id===fixture.second).ankunft,3437);
 assert.ok(state.w5n.frachtauftrag,'NPC returns after original flight completion');
 assert.ok(clone.w5n.frachtauftrag,'NPC returns after reload at same tick');
 check(world,state);check(cold,clone);
 console.log('P3_AUDIT_FIX_ACTIVE_REPLAY '+JSON.stringify({tick:state.tick,
  hash:world.hash(state),ferry:fixture.second,npc:state.w5n.frachtauftrag.schiff}));
});

test('P3 audit fix: J8 world-object cloning abandons unprotected wait with explicit reason and re-admission',()=>{
 const {fixture,session,world,state}=open();
 const clean=J8.erstellen();clean.oeffnen204(fixture.save,true);
 const original=world.hash(state),money=state.owners.house.cash;
 assert.equal(world.p3ForschungsAnmeldung(state,fixture.second,60).ok,true);
 assert.equal(world.hash(state),original);
 session.weiterspielen(1);clean.weiterspielen(1);
 assert.equal(session.zustandReferenz().tick,3161);
 assert.equal(session.ansicht().hash,clean.ansicht().hash);
 assert.equal(world.p3ForschungsStatus().wartend,null,
  'a non-serialized wait cannot remain on an obsolete J8 state');
 assert.equal(world.p3ForschungsStatus().letzterBeleg?.status,
  'zustandswechsel-abgebrochen');
 assert.equal(session.zustandReferenz().owners.house.cash,money);
 const latest=session.zustandReferenz();
 assert.equal(world.p3ForschungsAnmeldung(latest,fixture.second,60).ok,true,
  'old world pointer must not block a later legitimate request forever');
 assert.equal(world.hash(latest),clean.ansicht().hash);
 session.weiterspielen(1);
 assert.equal(world.p3ForschungsStatus().wartend,null);
 check(world,session.zustandReferenz());
 console.log('P3_AUDIT_FIX_J8_CLONE '+JSON.stringify({tick:session.zustandReferenz().tick,
  event:world.p3ForschungsStatus().letzterBeleg?.status}));
});

test('P3 audit fix: absent NPC demand cannot hold player admission behind infinite preference',()=>{
 const {fixture,world,state}=start();
 assert.equal(world.p3ForschungsStatus().npcVorrang,true);
 world.politikSetzen(state,{automatik:false});
 world.advance(state,121);
 assert.equal(state.tick,3498);
 assert.equal(state.w5ac.active,null);
 assert.ok(state.w5ac.completed.some(x=>x.id===fixture.second));
 assert.equal(world.p3ForschungsStatus().npcVorrang,false,
  'when no NPC job can start, research NPC grace must be bounded');
 check(world,state);
 console.log('P3_AUDIT_FIX_BOUNDED_NPC '+JSON.stringify({tick:state.tick,
  completed:state.w5ac.completed.some(x=>x.id===fixture.second)}));
});

test('P3 audit fix: retired hull rejected on original world command and queued pre-start revalidation',()=>{
 const {fixture,world,state}=open();
 const ship=fixture.second;
 world.politikSetzen(state,{stilllegung:true});
 assert.equal(world.p3ForschungsAnmeldung(state,ship).ok,true);
 state.kanon.verschleiss[ship]=Math.ceil(
  world.buchwert(state,ship)*1000/world.daten.verschleiss.milliJeMinute.frachter);
 assert.equal(world.buchwert(state,ship),0);
 assert.equal(world.bericht(state).schiffe.find(x=>x.id===ship).stillgelegt,true);
 check(world,state);
 const before=world.save(state),cash=state.owners.house.cash;
 assert.equal(world.execute(state,{type:'shipReposition',owner:'house',schiff:ship}).ok,false);
 assert.equal(world.save(state),before);
 world.minute(state);
 assert.equal(world.p3ForschungsStatus().wartend,null);
 assert.equal(world.p3ForschungsStatus().letzterBeleg?.grund,'Huelle stillgelegt');
 assert.notEqual(state.w5ac.active?.id,ship);
 assert.equal(state.owners.house.cash,cash);
 check(world,state);
 console.log('P3_AUDIT_FIX_RETIRED '+JSON.stringify({tick:state.tick,reason:world.p3ForschungsStatus().letzterBeleg?.grund}));
});

test('P3 audit fix: imported active ferry blocks original freight starts and lane-invalid JSON fails research audit',()=>{
 const {fixture,world,state}=start();
 const before=world.save(state);
 for(const cmd of [
  {type:'shipFreightIce',owner:'house',schiff:fixture.first},
  {type:'shipFreight',owner:'transport',schiff:'sh002'},
 ]) {
  const result=world.execute(state,cmd);
  assert.equal(result.ok,false);
  assert.match(result.reason,/Korridor/);
  assert.equal(world.save(state),before);
 }
 const falsified=JSON.parse(before);
 falsified.w5n.frachtauftrag={schiff:'sh002',phase:'hin'};
 const failure=world.audit(falsified);
 assert.equal(failure.ok,false);
 assert.ok(failure.fehler.some(x=>x.includes('Doppelbelegung')),
  'research audit must inspect authoritative W3/W5n/W5ac occupancy');
 check(world,state);
});

test('P3 audit fix: without research opt-in the original Rule204 hash and API remain untouched',()=>{
 const key='APHROS_P3_FAIR_FERRY_RESEARCH';
 const enabled=process.env[key];delete process.env[key];
 try{
  const fixture=erstellen(),world=World.erstellenJ4c({carrierCash:2000,buyerCash:4000});
  const state=world.load(fixture.save);
  assert.equal(typeof world.p3ForschungsAnmeldung,'undefined');
  assert.equal(world.hash(state),fixture.hash);
  assert.equal(state.tick,3160);
  check(world,state);
 }finally{process.env[key]=enabled}
});
