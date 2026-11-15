// Independent QA for Claude W6 #382 on the released J11+P1 main.
// NO new economic rule: this file only reads/executes the original Core.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const W6=require('../tools/w6-szenarien.cjs');
const start=()=>{const sitz=J8.erstellen();sitz.starten195(W5.create(42,'private195').export(),true);return {sitz,w:sitz.weltReferenz(),s:sitz.zustandReferenz()};};
const money=s=>Object.fromEntries(Object.entries(s.owners).map(([id,x])=>[id,x.cash]));
const cashTotal=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const audit=(w,s)=>assert.deepEqual(W6.pruefen(w,s),[]);
test('QA W6/J11: untouched public P1 startup has no hidden NPC automation',()=>{
 const {sitz,w,s}=start();
 assert.equal(w.hash(s),'674400c1d181fcf2');
 assert.equal(s.rulesVersion,204);
 assert.equal(s.owners.house.cash,3000);
 assert.equal(s.kanon.npc,undefined);
 assert.equal(s.kanon.npcAuto,undefined);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 audit(w,s);
 assert.ok(sitz.angebote().some(x=>x.id==='buy-st_aldera-frachter'&&x.ok));
 assert.ok(sitz.angebote().some(x=>x.id==='buy-st_aldera-miner'&&x.ok));
 for(const path of ['prototypes/spiel/spiel.js','prototypes/verbund/konzern-session.js']){
   const ui=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
   assert.doesNotMatch(ui,/npcAutoSetzen\s*\(/,'no unapproved W6 policy switch in public game '+path);
 }
});

test('QA W6/J11: merely setting opt-in cannot mint, prepay or transfer any property',()=>{
 const {w,s}=start(),before=w.hash(s),owners=money(s),stocks=structuredClone(s.stations),fleet=structuredClone(s.ships),ledger=structuredClone(s.ledger);
 assert.equal(w.npcAutoSetzen(s,true).ok,true);
 assert.equal(s.kanon.npcAuto,true);
 assert.notEqual(w.hash(s),before,'policy flag becomes part of deterministic state');
 assert.deepEqual(money(s),owners);
 assert.deepEqual(s.stations,stocks);
 assert.deepEqual(s.ships,fleet);
 assert.deepEqual(s.ledger,ledger);
 assert.equal(cashTotal(s),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 audit(w,s);
 const saved=w.save(s);
 assert.equal(w.hash(w.load(saved)),w.hash(s));
});

test('QA W6/J11: invalid activation input and forged policy logs cannot bypass audit',()=>{
 const {w,s}=start(),prior=w.hash(s);
 assert.throws(()=>w.npcAutoSetzen(s,'ja'),/Boolean/);
 assert.equal(w.hash(s),prior);
 w.npcAutoSetzen(s,true);
 const serialized=JSON.parse(w.save(s));
 serialized.kanon.npc.befehle['house:shipBuy']=1;
 assert.throws(()=>w.load(JSON.stringify(serialized)),'foreign owner event must not be accepted');
 const forgedClass=JSON.parse(w.save(s));
 forgedClass.kanon.npc.befehle['npc3:stationBuildFighter']=1;
 assert.throws(()=>w.load(JSON.stringify(forgedClass)),'wrong legal owner / command pairing');
 const forgedAtTickZero=JSON.parse(w.save(s));
 forgedAtTickZero.kanon.npc.befehle['npc3:shipShuttle']=1;
 assert.throws(()=>w.load(JSON.stringify(forgedAtTickZero)),'no automatic command before first world minute');
 const other=JSON.parse(w.save(s));other.kanon.npcAuto='true';
 assert.throws(()=>w.load(JSON.stringify(other)));
 audit(w,s);
});

test('QA W6/J11: switching off opt-in leaves authentic player cash untouched',()=>{
 const {w,s}=start();
 w.npcAutoSetzen(s,true);
 w.advance(s,10);
 audit(w,s);
 assert.equal(cashTotal(s),33000);
 assert.equal(s.owners.house.cash,3000);
 assert.equal(Object.values(s.ships).filter(x=>x.owner==='house').length,0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 w.npcAutoSetzen(s,false);
 const before=structuredClone(s.kanon.npc.befehle);
 w.advance(s,30);
 assert.deepEqual(s.kanon.npc.befehle,before,'all W6 NPC decisions must stop at toggle off');
 audit(w,s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
});
