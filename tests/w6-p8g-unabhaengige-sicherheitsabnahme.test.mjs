// Independent acceptance: no imported expected hashes, fixtures or audit helpers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
const clone=x=>JSON.parse(JSON.stringify(x));
const digest=s=>createHash('sha256').update(w.canonical(s)).digest('hex');
function ok(s,c){const r=w.execute(s,c);assert.equal(r.ok,true,JSON.stringify({c,r}));return r;}
function reject(s,c){const before=JSON.stringify(s);const r=w.execute(s,c);assert.equal(r.ok,false,JSON.stringify({c,r}));assert.equal(JSON.stringify(s),before,'rejection must be atomic');}
function balance(s,world=w){
  assert.equal(world.audit(s).ok,true,JSON.stringify(world.audit(s)));
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0);
  for(const [ware,l] of Object.entries(s.ledger)){
    const physical=[...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)].reduce((n,x)=>n+(x[ware]||0),0);
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
  }
  for(const [id,sh] of Object.entries(s.ships)){assert.equal(sh.id,id);assert.ok(s.owners[sh.owner]);}
  for(const klasse of ['miner','frachter','jaeger']){
    const l=s.ledger[klasse];
    if(l)assert.equal(Object.values(s.ships).filter(x=>x.klasse===klasse).length,l.consumed,klasse+' hulls consumed into fleet');
  }
}
function productionAdvance(s,duration){w.advance(s,1);const restored=roundtrip(s);w.advance(s,duration-1);w.advance(restored,duration-1);assert.equal(digest(s),digest(restored));}
function roundtrip(s){balance(s);const restored=w.load(w.save(s));assert.equal(digest(restored),digest(s));return restored;}
// Obtain real demand through original public commands. Seed and stopping criteria
// are chosen here; no result, helper fixture or reference hash from original tests.
function prepare(){
  const s=w.createState(42,{politik:{stilllegung:true,betriebsreserve:{werft_extern:1060}}});
  w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
  for(let n=0;n<30*1440&&!s.kanon.p8d.belege.length;n+=60){
    w.advance(s,60);
    if(s.stations.st_nadir.lager.jaeger&&s.owners.house.cash>=900)ok(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
  }
  assert.ok(s.kanon.p8d.belege.length,'real paid Dravos delivery');
  w.politikSetzen(s,{automatik:false});w.materialSupplySetzen(s,true);
  const ids=new Set(Object.keys(s.ships));
  const cash=s.owners.transport.cash,yard=s.owners.werft_extern.cash;
  ok(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(cash-s.owners.transport.cash,750);assert.equal(s.owners.werft_extern.cash-yard,750);
  const freight=Object.keys(s.ships).find(id=>!ids.has(id));
  ok(s,{type:'shipReposition',owner:'transport',schiff:freight});w.advance(s,60);
  const miner=Object.values(s.ships).find(sh=>sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'&&sh.phase==='dock'&&sh.flug.lage==='angedockt'&&Object.values(sh.ladung).every(n=>n===0)&&!s.erzpilotVertraege?.[sh.id]&&w.buchwert(s,sh.id)>0);
  assert.ok(miner,'available owned miner');
  if(s.kanon.pendel[miner.id])ok(s,{type:'shipShuttleStop',owner:'npc3',schiff:miner.id});
  balance(s);return {s,miner:miner.id,freight};
}
const fixture=prepare();
const offer={type:'industrialOreOfferMaterial',owner:'st_nadir',miner:fixture.miner,frachter:fixture.freight};
function offered(){const s=clone(fixture.s);ok(s,offer);return s;}
function signed(){const s=offered();ok(s,{type:'industrialOreAcceptMine',owner:'npc3'});ok(s,{type:'industrialOreAcceptFreight',owner:'transport'});return s;}
const commit={type:'industrialOreCommitMaterial',owner:'st_nadir'};
function active(){const s=signed();ok(s,commit);balance(s);return s;}
function invalidImport(s){const audit=w.audit(s);let loaded=false;try{w.load(JSON.stringify(s));loaded=true;}catch{}assert.deepEqual({auditAccepted:audit.ok,loadAccepted:loaded},{auditAccepted:false,loadAccepted:false},'original audit and JSON loader must both reject');}

test('independent fixture: all money, goods, hulls and owners balance',()=>roundtrip(fixture.s));
for(const [type,owner] of [['industrialOreOfferMaterial','house'],['industrialOreAcceptMine','transport'],['industrialOreAcceptFreight','npc3'],['industrialOreCommitMaterial','house'],['industrialOreCancel','transport']])test('wrong owner '+type,()=>{const s=type==='industrialOreOfferMaterial'?clone(fixture.s):signed();reject(s,type==='industrialOreOfferMaterial'?{...offer,owner}:{type,owner});});
for(const field of ['miner','frachter'])test('foreign/missing ship '+field,()=>{for(const id of ['absent',fixture[field==='miner'?'freight':'miner']])reject(clone(fixture.s),{...offer,[field]:id});});
for(const signature of ['none','mine','freight'])test('missing signature '+signature,()=>{const s=offered();if(signature!=='none')ok(s,{type:signature==='mine'?'industrialOreAcceptMine':'industrialOreAcceptFreight',owner:signature==='mine'?'npc3':'transport'});reject(s,commit);});
for(const owner of ['npc3','transport','st_aldera','st_nadir'])test('insufficient cash at commit '+owner,()=>{const s=signed();s.owners.house.cash+=s.owners[owner].cash;s.owners[owner].cash=0;reject(s,commit);});
for(const [owner,type] of [['npc3','industrialOreAcceptMine'],['transport','industrialOreAcceptFreight']])test('insufficient signer cash '+owner,()=>{const s=offered();s.owners[owner].cash=0;reject(s,{type,owner});});
test('buyer cash at offer',()=>{const s=clone(fixture.s);s.owners.st_nadir.cash=0;reject(s,offer);});
for(const [name,change] of [
  ['bound yard escrow',s=>{s.owners.k7_werft_treuhand={cash:1};}],
  ['foreign freight job',s=>{s.w5n.frachtauftrag={schiff:fixture.freight};}],
  ['loaded freight',s=>{s.ships[fixture.freight].ladung.erz=1;}],
  ['loaded miner',s=>{s.ships[fixture.miner].ladung.erz=1;}],
  ['occupied miner',s=>{s.erzpilotVertraege[fixture.miner]={};}],
  ['worn miner',s=>{s.kanon.verschleiss[fixture.miner]=100000;}],
  ['worn freight',s=>{s.kanon.verschleiss[fixture.freight]=100000;}],
])test('offer rejects '+name,()=>{const s=clone(fixture.s);change(s);reject(s,offer);});
for(const account of ['w3_kauf_treuhand','w3_arbeit_treuhand'])test('already bound '+account,()=>{const s=signed();s.owners[account].cash=1;reject(s,commit);});
test('no target warehouse capacity',()=>{const s=signed();s.stations.st_nadir.lager.erz=100000;reject(s,commit);});
test('duplicate contract/signatures and forbidden yard operations',()=>{const s=active();for(const c of [offer,commit,{type:'industrialOreAcceptMine',owner:'npc3'},{type:'industrialOreAcceptFreight',owner:'transport'},{type:'industrialOreAcceptYard',owner:'werft_extern'},{type:'industrialOreBuildShip',owner:'werft_extern'},{type:'industrialOreCommit',owner:'st_nadir'}])reject(s,c);});
test('cancel offer, then reject duplicate cancel; no opt-out of pending offer',()=>{const s=offered();assert.throws(()=>w.materialSupplySetzen(s,false));ok(s,{type:'industrialOreCancel',owner:'st_nadir'});reject(s,{type:'industrialOreCancel',owner:'st_nadir'});w.materialSupplySetzen(s,false);roundtrip(s);});
test('cancel financed order before work refunds real accounts exactly',()=>{const s=active(),before=signed();ok(s,{type:'industrialOreCancel',owner:'st_nadir'});for(const id of ['npc3','transport','st_aldera','st_nadir','w3_kauf_treuhand','w3_arbeit_treuhand'])assert.equal(s.owners[id]?.cash||0,before.owners[id]?.cash||0,id);roundtrip(s);});

// Real phase checkpoints, shared as immutable JSON copies in the tests below.
const phases={};const delivery=active();phases.reserved=clone(delivery);
for(let n=0;n<20*1440&&delivery.kanon.industrieErz.phase!=='geliefert';n++){
  w.advance(delivery,1);
  const key=delivery.w3.auftrag?.phase;
  if(key==='vorbestellt'&&delivery.erzpilotVertraege?.[fixture.miner])phases.mining??=clone(delivery);
  if(key==='hin'||key==='rueck')phases[key]??=clone(delivery);
}
assert.equal(delivery.kanon.industrieErz.phase,'geliefert');phases.delivered=clone(delivery);
ok(delivery,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});w.advance(delivery,1);phases.production=clone(delivery);
for(const phase of ['mining','hin','rueck','production'])test('save/load and deterministic continuation '+phase,()=>{assert.ok(phases[phase]);const a=clone(phases[phase]),b=roundtrip(a);w.advance(a,31);w.advance(b,31);balance(a);balance(b);assert.equal(digest(a),digest(b));});
for(const phase of ['mining','hin','rueck','delivered'])test('no free cancellation after real work '+phase,()=>reject(clone(phases[phase]),{type:'industrialOreCancel',owner:'st_nadir'}));
for(const [name,change] of [
 ['duration',s=>{s.w3.auftrag.zeit=1;}],['wage cost',s=>{s.w3.auftrag.arbeitsKosten=1;}],
 ['amount',s=>{s.w3.auftrag.menge=51;}],['worked',s=>{s.w3.auftrag.gearbeitet=-1;}],
 ['contract phase',s=>{s.kanon.industrieErz.phase='frei';}],['freight phase',s=>{s.w3.auftrag.phase='invented';}],
 ['mine signature',s=>{s.kanon.industrieErz.signMiner=false;}],['freight signature',s=>{s.kanon.industrieErz.signFracht=false;}],
 ['yard signature',s=>{s.kanon.industrieErz.signWerft=true;}],['opt-out',s=>{s.kanon.materialSupplyEnabled=false;}],
 ['warehouse',s=>{s.stations.st_nadir.lager.erz++;}],['miner owner',s=>{s.ships[fixture.miner].owner='house';}],
 ['freight owner',s=>{s.ships[fixture.freight].owner='house';}],
 ['arrival time',s=>{s.ships[fixture.freight].ankunft=s.tick+1;}],
])test('import/audit rejects tampering '+name,()=>{const s=clone(phases.hin);change(s);invalidImport(s);});

test('SECURITY: old Rule207 JSON cannot self-authorize P8g',()=>{const old=w.createState(42);assert.equal(old.kanon.materialSupplyEnabled,undefined);const raw=JSON.parse(w.save(old));raw.kanon.materialSupplyEnabled=true;assert.throws(()=>w.load(JSON.stringify(raw)),'external import without explicit activation must not enable P8g');});
test('SECURITY: forged delivered contract without underlying W3 delivery',()=>{const s=w.createState(42);w.advance(s,1);const mi=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner');const fr=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');assert.ok(mi&&fr);s.kanon.industrieErz={phase:'geliefert',miner:mi.id,frachter:fr.id,signMiner:true,signFracht:true,signWerft:false,werftVerwendet:false,erzAngenommen:true,erstellt:0,materialOnly:true};invalidImport(s);});
for(const factory of ['erstellenJ4c','erstellenP8b','erstellenP8c','erstellenP8d'])test('legacy no opt-in '+factory,()=>{const world=K[factory]();const a=world.createState(42),b=world.load(world.save(a));const version=a.rulesVersion;assert.equal(a.kanon.materialSupplyEnabled,undefined);for(const s of [a,b]){assert.equal(world.execute(s,offer).ok,false);world.advance(s,60);balance(s,world);assert.equal(s.rulesVersion,version);assert.equal(s.kanon.materialSupplyEnabled,undefined);}assert.equal(world.canonical(a),world.canonical(b));});
test('two independently generated seeds/command streams replay identically',()=>{const again=prepare();assert.equal(digest(again.s),digest(fixture.s));console.log('INDEPENDENT_REPLAY_SHA256',digest(again.s));});
test('complete paid W1/W3/W4/J3/J4 chain and fleet/ownership reconciliation',()=>{
 const s=clone(phases.delivered),before=signed(),fleet=Object.fromEntries(Object.entries(before.ships).map(([id,x])=>[id,x.owner]));
 assert.equal(s.w3.geliefert-before.w3.geliefert,50);assert.equal(s.w3.arbeitsKosten-before.w3.arbeitsKosten,120);
 assert.equal(s.w5.fertig,before.w5.fertig);
 for(let n=0;n<5;n++){ok(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});productionAdvance(s,w.rules.w4.dauer);roundtrip(s);}
 for(let n=0;n<8;n++){ok(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});productionAdvance(s,w.rules.j3.dauer);roundtrip(s);}
 ok(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});productionAdvance(s,w.rules.j4.dauer);
 const buyer=s.owners.house.cash,seller=s.owners.st_nadir.cash;ok(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
 assert.equal(buyer-s.owners.house.cash,900);assert.equal(s.owners.st_nadir.cash-seller,900);roundtrip(s);
 for(const [id,owner] of Object.entries(fleet))assert.equal(s.ships[id].owner,owner);
 assert.equal(Object.keys(s.ships).length,Object.keys(fleet).length+1);
 console.log('INDEPENDENT_CHAIN',JSON.stringify({tick:s.tick,sha256:digest(s),coreHash:w.hash(s),cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),ledger:s.ledger,ships:Object.values(s.ships).map(x=>({id:x.id,owner:x.owner,klasse:x.klasse})),nadir:s.stations.st_nadir.lager}));
});

for(const role of ['miner','freight'])test('SECURITY: wear after signature must be rechecked '+role,()=>{const s=signed();s.kanon.verschleiss[fixture[role]]=100000;roundtrip(s);reject(s,commit);});
test('SECURITY: imported active order cannot erase ownership signatures in transit',()=>{const s=clone(phases.hin);s.kanon.industrieErz={phase:'frei'};invalidImport(s);});
test('untrusted command cannot override tariffs or amount',()=>{for(const extra of [{menge:1},{zeit:1},{lohn:0},{phase:'geliefert'}])reject(clone(fixture.s),{...offer,...extra});});

for(const factory of ['erstellenJ4c','erstellenP8b','erstellenP8c'])test('legacy rejects imported P8g field '+factory,()=>{const world=K[factory](),s=world.createState(42);s.kanon.materialSupplyEnabled=true;assert.equal(world.audit(s).ok,false);assert.throws(()=>world.load(JSON.stringify(s)));});
