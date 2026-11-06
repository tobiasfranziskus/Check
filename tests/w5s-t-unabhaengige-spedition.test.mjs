import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
function rules(on=true){return {...api.W5R_RULES,w5s:{
 minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
 autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
 retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true,
 autoTakeover:true,autoNpcVenture:true,autoOreWageHousehold:true,
 autoIndustryWages:true,onDemandMaintenance:true,
 ...(on?{independentSuccessor:true}:{})
}};}
function check(s,r,day,seed){
 const a=api.audit(s),fin=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,'Seed'+seed+' Tag'+day+': '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(fin.ok,true,'Finance '+seed+' Tag'+day);
 assert.equal(fin.successor.ok,true,'Successor audit');
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 for(const [w,l]of Object.entries(s.ledger)){
  const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[w]||0),0)
   +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[w]||0),0);
  assert.equal(actual,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w+' Tag '+day);
 }
 const hash=api.hash(s),p=api.w5sNachfolgeStatus(s,r);
 assert.equal(hash,api.hash(s),'read-only plan');
 if([59,90,104,120,150,240,365].includes(day))
  assert.equal(api.hash(api.loadW5R(api.save(s))),hash,'Save/Load '+seed+'/'+day);
 return p;
}
function run(seed,days,on=true,diagnose=false){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3'),stages={},observed={};
 for(let d=1;d<=days;d++){
  api.advance(s,1440,r);const p=check(s,r,d,seed);
  stages[p.stage]=(stages[p.stage]||0)+1;
  if([30,59,60,90,104,120,150,180,240,365].includes(d)){
   observed[d]={stage:p.stage,details:p,
    cash:{export:s.owners.export.cash,transport:s.owners.transport.cash,
      nadir:s.owners.st_nadir.cash,house:s.owners.w5n_kunden.cash},
    hull:s.stations.st_nadir.lager.frachter,material:s.stations.st_nadir.lager.material,
    ore:s.stations.st_nadir.lager.erz,oldFleet:!!s.w5r.frachter.id,
    losses:s.w5r.frachter.lost,shipyard:s.w5.fertig,
    ice:s.stations.st_aldera.lager.eis};
  }
 }
 const result={seed,days,on,hash:api.hash(s),stages,
  water:s.w5n.wasserVerbraucht,ice:s.w5n.frachtAbgeschlossen,
  ore:s.w3.abgeschlossen,...(diagnose?{observed}:{})};
 return result;
}
test('W5s-t: abgeschaltetes Forschungsflag bitidentisch zu W5s-s',()=>{
 for(const [seed,hash]of [[42,'131d982e273bcd67'],[7,'e05c12e808d4b859']]){
  const x=run(seed,365,false);assert.equal(x.hash,hash);
  assert.equal(x.water,6068);
  console.log('W5S_T_OFF '+JSON.stringify({seed,hash:x.hash}));
 }
});
test('W5s-t: 13 Seeds x90d, rein lesender unabhängiger Gründungsplan',()=>{
 for(const seed of seeds){
  const x=run(seed,90,true);
  assert.equal(x.ore,2);
  assert.equal(x.water,4316);
  assert.equal(x.stages.finanzierbarer_neuer_spediteur||0,0,
   'ohne fertige alte Insolvenz kein automatischer Investortransfer');
  if(seed===42||seed===7)assert.deepEqual(run(seed,90,true),x);
  console.log('W5S_T_90D '+JSON.stringify(x));
 }
});
test('W5s-t: 2x365d tatsächliche Nachfolgehindernisse, kein Gratisgeld',()=>{
 for(const seed of [42,7]){
  const x=run(seed,365,true,true);
  assert.equal(x.ore,3);
  assert.equal(x.water,6068);
  console.log('W5S_T_365D '+JSON.stringify(x));
 }
});
test('W5s-t: Befehle ohne reale Firma, freie Werfthülle und Käufer abgelehnt',()=>{
 const r=rules(true),s=api.createW5RState(42,'full','npc3');
 const before=api.hash(s);
 assert.equal(api.execute(s,{type:'shipFoundCarrier',owner:'export'},r).ok,false);
 assert.equal(api.execute(s,{type:'shipBuy',owner:'export',station:'st_nadir',klasse:'frachter'},r).ok,false);
 assert.equal(api.execute(s,{type:'shipFoundCarrier',owner:'house'},r).ok,false);
 assert.equal(api.hash(s),before);
 assert.equal(api.audit(s).ok,true);
});
