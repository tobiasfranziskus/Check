'use strict';
// Isolate the existing replacement-lead policy in the current combined
// circulation profile. This deliberately does not include #645/#646.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {lauf,VERGLEICH}=require('./m4-management-szenarien.cjs');
const [original,pfad]=VERGLEICH.find(([s])=>s.id==='S02');
const [lead='40',silicon='on',file='w6-ersatzvorlauf.json']=process.argv.slice(2);
assert.ok(['40','60','80'].includes(lead)&&['on','off'].includes(silicon));
const on=silicon==='on',vorlauf=Number(lead);
const sz=vorlauf===40?original:{...original,politik:{...original.politik,ersatzVorlaufProzent:vorlauf}};
const hashes={on:['2281d74dd8429a94','a54f47e25d4f7e00','ec3b282367838729'],
 off:['85030b8df72a12ce','4e2e3657ef684657','7038f094f7aa754d']};
function run(){
 const result=lauf(sz,90,42,true,pfad,null,on);
 for(const v of result.verlauf){
  assert.equal(v.weltgeld,33000);
  assert.equal(v.mint,0);assert.equal(v.burn,0);
 }
 if(vorlauf===40)assert.deepEqual(result.verlauf.map(v=>v.hash),hashes[silicon]);
 return result;
}
const a=run();
assert.deepEqual(run(),a,'deterministic replay');
const end=a.verlauf.at(-1);
const report={seed:42,vorlauf,silizium:on,deterministic:true,
 verlauf:a.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,auftraege:v.auftraege,
  ersatz:v.ersatzkaeufe,gebunden:v.gebunden,stilllegungen:v.stilllegungen.length,
  live:v.huellen.filter(h=>!h.stillgelegt),kassen:v.kassen,lager:v.lager,
  aktiveAuftraege:v.aktiveAuftraege,entscheidungen:v.entscheidungen,weltgeld:v.weltgeld,
  mint:v.mint,burn:v.burn})),
 ersterStillstand:end.ersterStillstand,folgefahrten:a.folgefahrten};
fs.writeFileSync(file,JSON.stringify({report,full:a},null,2)+'\n');
console.log('W6_ERSATZVORLAUF '+JSON.stringify(report));
