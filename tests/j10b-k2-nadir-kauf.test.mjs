import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const {erzeugen}=require('./j10b-k2-kauf-fixture.cjs');

test('J10b: initial offer to claim Nadir miner is blocked until real K2 build and registration',()=>{
 const old=OLD.create(42,'private195').export(),ses=J8.erstellen();
 const first=ses.starten195(old,true),before=ses.exportieren();
 assert.equal(first.schiffe.length,0);
 const offer=ses.angebote().find(v=>v.id==='buy-st_nadir-miner');
 assert.ok(offer);
 assert.equal(offer.ok,false);
 assert.match(offer.label,/Nadir-Miner.*600 ISK/);
 assert.match(offer.reason,/K2|J2a|vorgemerkte/);
 const r=ses.ausfuehren(offer.id);
 assert.equal(r.ok,false);
 assert.equal(ses.exportieren(),before,'rejected offer must not mutate source');
 assert.equal(OLD.create(42,'private195').export(),old);
});

test('J10b: own physically built K2 miner can be claimed locally for original 600 ISK',()=>{
 const sample=erzeugen('house');
 assert.equal(sample.tick,241);
 assert.equal(sample.houseCash,2400);
 assert.equal(sample.purchasePrice,600);
 const ses=J8.erstellen(),first=ses.oeffnen204(sample.save,true);
 assert.equal(first.hash,sample.hash);
 const offer=ses.angebote().find(v=>v.id==='buy-st_nadir-miner');
 assert.equal(offer.ok,true,JSON.stringify(offer));
 assert.match(offer.label,/600 ISK/);
 const src=ses.exportieren(),before=ses.zustandReferenz();
 const beforeShips=new Set(Object.keys(before.ships));
 const total=first.weltgeld;
 const r=ses.ausfuehren('buy-st_nadir-miner');
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.type,'stationClaimMinerLocal');
 assert.equal(ses.ansicht().hausgeld,1800);
 assert.equal(ses.ansicht().weltgeld,total);
 const s=ses.zustandReferenz(),w=ses.weltReferenz();
 const created=Object.values(s.ships).filter(sh=>!beforeShips.has(sh.id));
 assert.equal(created.length,1);
 const id=created[0].id;
 assert.equal(created[0].owner,'house');
 assert.equal(created[0].klasse,'miner');
 assert.equal(created[0].heimat,'nadir');
 assert.equal(created[0].flug.lage,'angedockt');
 assert.equal(s.stations.st_nadir.lager.miner,0);
 assert.ok(s.kanon.minerWerft.lokaleKaeufe.some(x=>x.id===id&&x.preis===600&&x.owner==='house'));
 assert.equal(s.kanon.jaeger.fertig,0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.audit(s).ok,true);
 const after=ses.exportieren();
 assert.notEqual(after,src,'genuine ship/payment ledger updated');
 assert.equal(w.hash(w.load(after)),ses.ansicht().hash);
 const next=J8.erstellen();next.oeffnen204(after,true);
 assert.equal(next.uebernehmen(id).ok,true,'original Nadir miner may enter J9 personal cockpit');
 assert.equal(next.pilotStatus(),id);
 assert.equal(OLD.create(42,'private195').export(),sample.original);
 console.log('J10B_LOCAL_GAMEPLAY',JSON.stringify({
  tick:s.tick,id,house:s.owners.house.cash,
  worldMoney:total,hash:w.hash(s),fighterCount:s.kanon.jaeger.fertig,
  original195Preserved:true
 }));
});

test('J10b: registered NPC3 K2 miner cannot be stolen by house, even when fully financed',()=>{
 const sample=erzeugen('npc3'),ses=J8.erstellen();
 ses.oeffnen204(sample.save,true);
 const state=ses.ansicht(),before=ses.exportieren();
 const offer=ses.angebote().find(v=>v.id==='buy-st_nadir-miner');
 assert.equal(offer.ok,false);
 assert.match(offer.reason,/K2|J2a|vorgemerkte/);
 assert.equal(ses.ausfuehren('buy-st_nadir-miner').ok,false);
 assert.equal(ses.exportieren(),before);
 assert.equal(ses.ansicht().hash,state.hash);
 assert.equal(ses.ansicht().weltgeld,33000);
 assert.equal(ses.zustandReferenz().kanon.minerWerft.wartetAuf,'npc3');
 assert.equal(ses.zustandReferenz().stations.st_nadir.lager.miner,1);
});

test('J10b: forged local pickup receipt, stock and owner money are rejected on import',()=>{
 const sample=erzeugen('house'),mutate={
  stock:s=>s.stations.st_nadir.lager.miner++,
  owner:s=>s.kanon.minerWerft.wartetAuf='none',
  miner:s=>s.ships.fake={id:'fake',klasse:'miner',owner:'house',system:'nadir',heimat:'nadir'},
  money:s=>s.owners.house.cash+=600
 };
 for(const [name,fn] of Object.entries(mutate)){
  const invalid=JSON.parse(sample.save);fn(invalid);
  const s=J8.erstellen();
  assert.throws(()=>s.oeffnen204(JSON.stringify(invalid),true),name);
 }
});
