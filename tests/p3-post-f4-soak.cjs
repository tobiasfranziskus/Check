'use strict';
// Independent paired research soak: production Rule204 versus one legally paid
// W5ac ferry and, only where genuinely admissible, one second owner F4 freight.
// This script does not construct artificial goods, money, jobs or buyers.
const assert = require('node:assert/strict');
const J8 = require('../prototypes/verbund/konzern-session.js');
const {erstellen} = require('./p3-werft-mehrschiff-fixture.cjs');
const {SZENARIEN, pruefen, kennzahlen} = require('../tools/w6-szenarien.cjs');

const FLAG='APHROS_P3_FAIR_FERRY_RESEARCH';
const PER_DAY=1440;
const fixture=erstellen();
const selection=process.argv[2]||'S02';
const days=Number(process.argv[3]||90);
assert.ok(Number.isSafeInteger(days)&&days>=3&&days<=730,'days 3..730');
const scenarios=SZENARIEN.filter(x=>selection==='all'||x.id===selection);
assert.ok(scenarios.length,'Unknown regime '+selection);

function make(scenario,research) {
  if(research)process.env[FLAG]='1';else delete process.env[FLAG];
  const session=J8.erstellen();
  session.oeffnen204(fixture.save,true);
  const world=session.weltReferenz(),state=session.zustandReferenz();
  assert.equal(world.regel,204);
  // Preserve the original audit's distinct policy matrix, not S02 defaults.
  world.politikSetzen(state,world.daten.politik);
  world.politikSetzen(state,scenario.politik);
  assert.equal(typeof world.p3ForschungsAnmeldung,research?'function':'undefined');
  return {world,state,initialHash:world.hash(state)};
}

function snapshot(world,state,initialPlayerF4,initialHouseFerry) {
  assert.deepEqual(pruefen(world,state),[],'independent economic conservation');
  const audit=world.audit(state);
  assert.equal(audit.ok,true,(audit.fehler||[]).join('; '));
  const occupancy=Number(!!state.w3.auftrag)+Number(!!state.w5n.frachtauftrag)
     +Number(!!state.w5ac.active);
  assert.ok(occupancy<=1,'one physically shared transport corridor');
  const funds=Object.values(state.owners).reduce((sum,v)=>sum+v.cash,0);
  assert.equal(funds,33000,'no new world money');
  assert.equal(state.minted,0);assert.equal(state.burned,0);
  assert.equal(world.hash(world.load(world.save(state))),world.hash(state),
    'real JSON load/save must reproduce the original state hash');
  const receipts=state.kanon.spielerFrachten?.auftraege||[];
  const playerF4=receipts.filter(x=>x.end!==null);
  return {
    hash:world.hash(state), tick:state.tick,
    worldMoney:funds, occupancy,
    // NPC count from original books, not from the player's delivery.
    npcIce:state.w5n.frachtAbgeschlossen-playerF4.length,
    npcFerry:state.w5ac.completed.filter(x=>x.owner==='transport').length,
    newHouseFerries:state.w5ac.completed.filter(x=>x.owner==='house').length-initialHouseFerry,
    newPlayerF4:playerF4.length-initialPlayerF4,
    lastHouseF4:playerF4.find(x=>x.schiff===fixture.second)?.end||null,
    ...kennzahlen(world,state),
  };
}

function mode(scenario,research,days) {
  const {world,state,initialHash}=make(scenario,research);
  const startTick=state.tick;
  const initialF4=(state.kanon.spielerFrachten?.auftraege||[]).filter(x=>x.end!==null).length;
  const initialFerry=state.w5ac.completed.filter(x=>x.owner==='house').length;
  const ferryRequest=research?world.p3ForschungsAnmeldung(state,fixture.second,720):null;
  if(research)assert.equal(ferryRequest.ok,true,'valid originally bought second hull');
  let attemptedF4=false,f4Request=null,f4AttemptTick=null;
  const checkpoints=[1,3,30,60,90,365,730].filter(x=>x<=days);
  const samples=[];
  for(const day of checkpoints) {
    const target=startTick+day*PER_DAY;
    if(research && state.tick<startTick+3*PER_DAY) {
      const earlyEnd=Math.min(target,startTick+3*PER_DAY);
      while(state.tick<earlyEnd) {
        world.minute(state);
        if(!attemptedF4 && state.w5ac.completed.some(x=>x.id===fixture.second && x.owner==='house')
          && !world.p3ForschungsStatus().npcVorrang
          && state.ships[fixture.second]?.system==='aldera'
          && state.ships[fixture.second]?.phase==='dock'
          && state.ships[fixture.second]?.flug?.lage==='angedockt') {
          f4AttemptTick=state.tick;
          f4Request=world.p3ForschungsFrachtAnmeldung(state,fixture.second,1440);
          attemptedF4=true;
        }
      }
    }
    if(state.tick<target)world.advance(state,target-state.tick);
    const row=snapshot(world,state,initialF4,initialFerry);
    samples.push({day,...row});
    console.log('P3_POST_F4_PAIR '+JSON.stringify({scenario:scenario.id,research,
      initialHash,day,ferryRequest,f4Request,f4AttemptTick,
      ...row}));
  }
  const last=samples.at(-1);
  if(research && scenario.id==='S02') {
    assert.ok(last.newHouseFerries>=1,'S02 must pay and complete second ferry');
    assert.ok(last.newPlayerF4>=1,
      'S02 bought and ferried second hull should complete one additional original paid F4');
    assert.ok(last.lastHouseF4!==null,'paid second-hull delivery must close');
  }
  return {initialHash,ferryRequest,f4Request,f4AttemptTick,samples};
}

const hashes=new Set();
for(const scenario of scenarios) {
  const baseline=mode(scenario,false,days);
  const research=mode(scenario,true,days);
  assert.equal(baseline.initialHash,research.initialHash,
    'the modes must have identical initial signed worlds');
  assert.ok(!hashes.has(baseline.initialHash),'regime policy must be distinct');
  hashes.add(baseline.initialHash);
  const b=baseline.samples.at(-1),f=research.samples.at(-1);
  console.log('P3_POST_F4_SUMMARY '+JSON.stringify({scenario:scenario.id,days,
    sameInitialWorld:true,baseline:{npcIce:b.npcIce,newPlayerF4:b.newPlayerF4,
      worldMoney:b.worldMoney,hash:b.hash},research:{npcIce:f.npcIce,
      newPlayerF4:f.newPlayerF4,newHouseFerries:f.newHouseFerries,
      worldMoney:f.worldMoney,hash:f.hash},f4Request:research.f4Request}));
}
delete process.env[FLAG];
