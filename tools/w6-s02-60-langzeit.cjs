'use strict';
// Extend only the independently measured #647 60%/silicon-on cell.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {lauf,VERGLEICH}=require('./m4-management-szenarien.cjs');
const [original,pfad]=VERGLEICH.find(([x])=>x.id==='S02');
const sz={...original,politik:{...original.politik,ersatzVorlaufProzent:60}};
const [arg='365',file='w6-s02-60-langzeit.json']=process.argv.slice(2);
const tage=Number(arg);
assert.ok([365,730].includes(tage));
const expected=['19f89c50daadc124','6091f983a74a53af','452d5222e5b38709'];
function run(){
 const result=lauf(sz,tage,42,true,pfad,null,true);
 assert.deepEqual(result.verlauf.slice(0,3).map(v=>v.hash),expected);
 for(const v of result.verlauf){
  assert.equal(v.weltgeld,33000);assert.equal(v.mint,0);assert.equal(v.burn,0);
 }
 return result;
}
const a=run();
assert.deepEqual(run(),a,'exact replay');
const end=a.verlauf.at(-1);
const previous=a.verlauf.at(-2);
// The original scenario records genuine paid freight receipts. Keep their
// end ticks separate from cumulative water/production counters.
const lastW3=end.fracht.erz.reduce((n,x)=>Math.max(n,x.end??0),0);
const lastHouseIce=end.fracht.eisHaus.reduce((n,x)=>Math.max(n,x.end??0),0);
const diff=Object.fromEntries(Object.keys(end.produktion).map(k=>[k,end.produktion[k]-previous.produktion[k]]));
const report={seed:42,vorlauf:60,silizium:true,tage,deterministic:true,
 lastW3,lastHouseIce,lastInterval:{from:previous.tag,to:end.tag,production:diff,
  iceTrips:end.auftraege.eisfrachten-previous.auftraege.eisfrachten,
  w3Trips:end.auftraege.erzfrachten-previous.auftraege.erzfrachten,
  replacements:end.ersatzkaeufe-previous.ersatzkaeufe},
 verlauf:a.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,auftraege:v.auftraege,
  ersatz:v.ersatzkaeufe,gebunden:v.gebunden,stilllegungen:v.stilllegungen.length,
  live:v.huellen.filter(h=>!h.stillgelegt),kassen:v.kassen,lager:v.lager,
  aktiveAuftraege:v.aktiveAuftraege,entscheidungen:v.entscheidungen,weltgeld:v.weltgeld,mint:v.mint,burn:v.burn})),
 ersterStillstand:end.ersterStillstand};
fs.writeFileSync(file,JSON.stringify({report,full:a},null,2)+'\n');
console.log('W6_S02_60_LANGZEIT '+JSON.stringify(report));
