'use strict';
// Compare an existing optional NPC policy, not a new world rule.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {lauf,VERGLEICH} = require('./m4-management-szenarien.cjs');
const {pruefen} = require('./w6-szenarien.cjs');
const [sz,pfad]=VERGLEICH.find(([x])=>x.id==='S02');
const reference=['2281d74dd8429a94','a54f47e25d4f7e00','ec3b282367838729'];
function run(enabled){
  let final=null;
  const observe=(w,s,phase)=>{
    if(s.tick!==90*1440)return;
    // Copies only: check whether an already purchased Nadir miner has a legal
    // existing route to Aldera in the current profile. No relocation invented.
    const json=w.save(s), probes=[];
    for(const sh of Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.system==='nadir'&&!w.stillgelegt(s,x.id))){
      for(const cmd of [
        {type:'shipMove',owner:'npc3',schiff:sh.id,ziel:'st_aldera'},
        {type:'shipReposition',owner:'npc3',schiff:sh.id},
        {type:'shipShuttle',owner:'npc3',schiff:sh.id,ware:'erz'}
      ]){
        const copy=w.load(json), before=w.save(copy), r=w.execute(copy,cmd);
        const fehler=r.ok?pruefen(w,copy):[];
        if(!r.ok)assert.equal(w.save(copy),before,'rejected command atomic');
        // An accepted but unauditable command is not a valid alternative.
        probes.push({cmd,ok:r.ok,grund:r.reason??null,auditFehler:fehler});
      }
    }
    assert.equal(w.save(s),json);
    final={hash:w.hash(s),lokal:structuredClone(s.kanon.minerWerft?.lokaleKaeufe||[]),
      silicon:structuredClone(s.kanon.npcSilizium),probes};
  };
  const result=lauf(sz,90,42,true,pfad,observe,enabled);
  assert.ok(final&&final.hash===result.verlauf.at(-1).hash);
  for(const v of result.verlauf){
    assert.equal(v.weltgeld,33000);assert.equal(v.mint,0);assert.equal(v.burn,0);
  }
  return {result,final};
}
const on=run(true), off=run(false);
assert.deepEqual(on.result.verlauf.map(x=>x.hash),reference);
assert.deepEqual(run(true),on);
assert.deepEqual(run(false),off);
const normal=lauf(sz,90,42,true,pfad);
assert.deepEqual(normal,on.result,'default manager scenario unchanged');
function compact(x){
  return {verlauf:x.result.verlauf.map(v=>({tag:v.tag,hash:v.hash,
    produktion:v.produktion,auftraege:v.auftraege,gebunden:v.gebunden,
    lager:v.lager,ersatzkaeufe:v.ersatzkaeufe,stilllegungen:v.stilllegungen,
    huellen:v.huellen,kassen:Object.fromEntries(['house','transport','npc3','st_aldera','st_nadir','werft_extern'].map(id=>[id,v.kassen[id]])),
    entscheidungen:v.entscheidungen,stationen:v.stationsrechnung})),final:x.final};
}
fs.writeFileSync(process.argv[2]||'w6-silizium-option.json',JSON.stringify({seed:42,on,off},null,2)+'\n');
console.log('W6_SILIZIUM_OPTION '+JSON.stringify({on:compact(on),off:compact(off),deterministic:true,defaultUnchanged:true}));
