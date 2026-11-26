'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {abnahme}=require('./w6-gesamtpaket.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const {angebot}=require('./w6-wasser-vorbestellung.cjs');
const id=process.argv[2]||'S08';
assert.ok(['S08','S02'].includes(id));
const expected={S08:'fabca2f65d3300cb',S02:'77aae111ae5163df'};
function audit(w,s){
 const original=w.save(s);
 const request={schiff:id==='S08'?'sh002':'sh004',tarif:160,
  bestellungen:[{owner:id==='S08'?'eigner_npc3':'pilot_house',menge:100}]};
 const a=angebot(w,s,request);
 assert.equal(a.ok,true,JSON.stringify(a));
 const signatures=a.angebot.parteien.map(owner=>({owner,angebot:a.angebot.id}));
 const probe=()=>w.w6WasserReservierungsProbe(s,request,signatures);
 const result=probe();
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.reserviert.kauf,1600);
 assert.equal(result.reserviert.lohn,120);
 assert.equal(result.reserviert.besteller[0].delta,-1600);
 assert.equal(result.reserviert.carrierDelta,-120);
 assert.equal(result.reserviert.wasserLogischGebunden,100);
 assert.equal(result.storno.kauf,0);
 assert.equal(result.storno.lohn,0);
 assert.equal(result.storno.alleKassenWiederhergestellt,true);
 assert.equal(result.weltgeld,33000);
 assert.equal(result.mint,0);
 assert.equal(result.burn,0);
 assert.equal(result.importAbgelehnt,true);
 assert.equal(result.originalUnveraendert,true);
 assert.deepEqual(probe(),result);
 for(const sig of [[],signatures.slice(1),signatures.map((x,i)=>i===0?{...x,angebot:'fremd'}:x)])
   assert.equal(w.w6WasserReservierungsProbe(s,request,sig).ok,false);
 assert.equal(w.w6WasserReservierungsProbe(s,{...request,tarif:100},signatures).ok,false);
 const advanced=w.load(original);w.advance(advanced,1);
 assert.equal(w.w6WasserReservierungsProbe(advanced,request,signatures).ok,false);
 const forged=JSON.parse(original);
 forged.owners.w6_wasser_kauf_treuhand={id:'w6_wasser_kauf_treuhand',kind:'w6-water-reserve',cash:0};
 assert.throws(()=>w.load(JSON.stringify(forged)),/fluechtige Wasserreservierung/);
 assert.equal(w.save(s),original);
 assert.deepEqual(pruefen(w,s),[]);
 return {result,syntheticConsent:true,actualFlight:false};
}
const r=abnahme(id,id==='S08'?90:365,42,'gesamt',true,audit);
assert.equal(r.verlauf.at(-1).hash,expected[id]);
fs.writeFileSync(process.argv[3]||'report.json',JSON.stringify(r,null,2)+'\n');
console.log('W6_WASSER_RESERVE '+JSON.stringify({id,hash:r.verlauf.at(-1).hash,...r.untersuchung,replay:r.replay}));
