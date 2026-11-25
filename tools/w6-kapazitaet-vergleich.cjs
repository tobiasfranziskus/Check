'use strict';
// Node-only paired experiment. Both repositories run their original audited
// management scenario code; the comparator does not alter either world.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const [baselineDir, candidateDir, profile, output] = process.argv.slice(2);
assert.ok(baselineDir && candidateDir && profile && output);
const baseline = require(path.resolve(baselineDir,'tools/m4-management-szenarien.cjs'));
const candidate = require(path.resolve(candidateDir,'tools/m4-management-szenarien.cjs'));
const historical = {
  Standard:['17b80ef2a7388f0f','ea7b2fce660daafe','cad6e11de6881745'],
  K7:['186c5b32965e6f61','e4d83956d2682b93','7d441a7e7ce91cd7'],
  S02:['2281d74dd8429a94','478696c8bbb0c153','5c2750ddcb1af122']
};
assert.ok(Object.hasOwn(historical,profile),'unknown profile');
function run(api,research){
  const [scenario,pfad] = api.VERGLEICH.find(([s])=>s.id===profile);
  const a = api.lauf(scenario,90,42,research,pfad);
  assert.deepEqual(a.verlauf.map(x=>x.tag),[7,30,90]);
  for(const v of a.verlauf){
    assert.equal(v.weltgeld,33000);
    assert.equal(v.mint,0);
    assert.equal(v.burn,0);
  }
  return a;
}
const control = run(baseline,true);
assert.deepEqual(control.verlauf.map(x=>x.hash),historical[profile],
  'pinned historical U7/U8 baseline must reproduce');
const changed = run(candidate,true);
assert.deepEqual(run(candidate,true),changed,'deterministic candidate replay');
const oldStandard = run(baseline,false);
const newStandard = run(candidate,false);
assert.deepEqual(newStandard,oldStandard,'standard career unchanged');
const report = {profile,seed:42,days:90,baseline:control,candidate:changed,
  standardControl:oldStandard};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
function summary(r){
  return r.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,
    weltgeld:v.weltgeld,gebunden:v.gebunden,kassen:v.kassen,
    ersatzkaeufe:v.ersatzkaeufe,stilllegungen:v.stilllegungen,
    ersterStillstand:v.ersterStillstand,aktiveAuftraege:v.aktiveAuftraege,
    rentabilitaet:v.rentabilitaet}));
}
console.log('W6_KAPAZITAET_VERGLEICH '+JSON.stringify({
  profile,baseline:summary(control),candidate:summary(changed),
  standard:oldStandard.verlauf.map(v=>({tag:v.tag,hash:v.hash})),
  deterministic:true,standardUnchanged:true
}));
