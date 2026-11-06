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
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,...(on?{autoIndustryWages:true}:{})
}};}
function check(s,r,day,seed){
 const audit=api.audit(s),f=api.w5sFinanzStatus(s,r),label=seed+' Tag '+day;
 assert.equal(audit.ok,true,label+': Core '+JSON.stringify(Object.keys(audit).filter(k=>audit[k]?.ok===false)));
 assert.equal(f.ok,true,label+': Finanzbuch');
 assert.equal(f.industryWages.ok,true,label+': Arbeitnehmerbuch');
 assert.equal(f.industryWages.paid,
   f.industryWages.details.reduce((sum,x)=>sum+x.paid,0));
 assert.equal(s.minted,0,label+' keine neuen ISK');
 assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),s.initialSupply,label+': vorhandenes ISK');
 for(const [ware,l] of Object.entries(s.ledger)){
   const stock=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     label+' physische Ware '+ware);
 }
 return f;
}
function run(seed,days,on=true){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3');
 const points={};let previous=0;const deliveries=[];
 for(let day=1;day<=days;day++){
  api.advance(s,1440,r);
  const f=check(s,r,day,seed);
  if(previous!==s.w3.abgeschlossen){
    deliveries.push({day,ore:s.w3.abgeschlossen});previous=s.w3.abgeschlossen;
  }
  if([30,59,60,90,104,105,120,125,150,180,240,365].includes(day)){
    assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),'Save/Load '+seed+' day '+day);
    points[day]={ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
      water:s.w5n.wasserVerbraucht,
      wages:f.industryWages,oreWages:f.orePilotWages,
      demand:f.chain,carrier:f.continuity,
      shipyard:s.w5.fertig,refined:s.w4.abgeschlossen,
      services:s.w5r.services,consumer:s.owners.w5n_kunden.cash};
  }
 }
 const f=api.w5sFinanzStatus(s,r);
 return {seed,days,on,hash:api.hash(s),ore:s.w3.abgeschlossen,
   ice:s.w5n.frachtAbgeschlossen,water:s.w5n.wasserVerbraucht,
   wages:f.industryWages,oreWages:f.orePilotWages,deliveries,points,
   consumer:s.owners.w5n_kunden.cash,freighterCash:s.owners.transport.cash};
}
test('W5s-r: deaktiviert exakt unveränderte W5s-q-Hashes und Welt',()=>{
 for(const [seed,hash]of [[42,'6a05e0121ae95948'],[7,'59193e57f052e8e0']]){
  const x=run(seed,365,false);assert.equal(x.hash,hash);
  assert.equal(x.wages.paid,0);assert.equal(x.ore,3);
  assert.equal(x.water,5823);
  console.log('W5S_R_OFF '+JSON.stringify({seed,hash:x.hash,water:x.water}));
 }
});
test('W5s-r: 13 Seeds ×90 Tage mit täglichen, unabhängigen Wirtschaftsprüfungen',()=>{
 for(const seed of seeds){
  const x=run(seed,90,true);
  assert.equal(x.wages.ok,true);
  assert.equal(x.wages.paid,640,'90 Tage: reale 160+240+240 ISK');
  assert.equal(x.wages.earned,640);
  assert.deepEqual(x.wages.details.map(z=>z.paid),[160,240,240]);
  assert.equal(x.water,4316);
  assert.equal(x.ice,88);
  assert.equal(x.ore,2);
  if(seed===42||seed===7)assert.deepEqual(run(seed,90,true),x);
  console.log('W5S_R_90D '+JSON.stringify({seed,hash:x.hash,ore:x.ore,
    water:x.water,ice:x.ice,wages:x.wages,refinery:x.points[90].refined,
    shipyard:x.points[90].shipyard,services:x.points[90].services}));
 }
});
test('W5s-r: Seed42/7 ×365 Tage – Industriearbeit kein Staatsgeld',()=>{
 for(const seed of [42,7]){
  const x=run(seed,365,true);
  assert.equal(x.wages.ok,true);
  assert.equal(x.water,6143,'zusätzlich real bezahlte 320 Wasser');
  assert.equal(x.ice,123,'fünf zusätzliche echte Eisfahrten');
  assert.equal(x.ore,3,'keine mangels Produktionsbedarf erfundene vierte Fracht');
  assert.equal(x.wages.earned,1730);
  assert.equal(x.wages.paid,1730);
  assert.deepEqual(x.wages.details.map(z=>z.paid),[260,390,1080]);
  assert.equal(x.points[365].shipyard,13);
  assert.equal(x.points[365].refined,13);
  assert.equal(x.points[365].services,18);
  assert.equal(x.points[365].demand.automatedW3Approved,false);
  assert.equal(x.points[365].carrier.freighters,0);
  assert.equal(x.points[365].carrier.ownCapitalMissing,810);
  console.log('W5S_R_365D '+JSON.stringify(x));
 }
});
test('W5s-r: frei erfundene Arbeiterlöhne, Kontentransfers, Doppelbelege werden abgelehnt',()=>{
 const r=rules(true),s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=105;d++)api.advance(s,1440,r);
 const f=check(s,r,105,42);
 assert.ok(f.industryWages.paid>0);
 const original=api.hash(s);
 for(const tamper of [
  q=>{q.w5s.industryWages.paid.refinery+=1},
  q=>{q.w5s.industryWages.events[0].amount+=1},
  q=>{q.w5s.industryWages.paid.shipyard+=40},
  q=>{q.w5s.industryWages.events.push({...q.w5s.industryWages.events[0]})},
  q=>{q.owners.w5n_kunden.cash+=50},
  q=>{q.owners.arbeitskraefte_nadir.cash-=1;q.owners.w5n_kunden.cash+=1}
 ]){
  const altered=api.loadW5R(api.save(s));
  tamper(altered);
  assert.equal(api.audit(altered).ok,false,'nicht beauftragte Arbeit wird nicht vergütet');
 }
 assert.equal(api.hash(s),original,'kein Originalzustand verändert');
});
