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
  ...(on?{autoOreWageHousehold:true}:{})
}}}
function audit(s,r,label){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+' vollständiger Original-Core '+JSON.stringify(Object.entries(a).filter(([,v])=>v?.ok===false).map(([k])=>k)));
 assert.equal(f.ok,true,label+' Carrier-Eigentümer-Buch');
 assert.equal(f.orePilotWages.ok,true,label+' echte Löhne');
 assert.equal(f.orePilotWages.earned,s.w3.arbeitsKosten);
 assert.ok(f.orePilotWages.paid<=f.orePilotWages.earned);
 assert.equal(s.minted,0,label+' ISK-Emission');assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply,label+' unabhängiges Geldledger');
 for(const [ware,l] of Object.entries(s.ledger)){
   const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,label+' Ware '+ware);
 }
 return f;
}
function run(seed,days,on){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3');
 let oldTrips=0;const events=[],points={};
 for(let d=1;d<=days;d++){
   api.advance(s,1440,r);
   const f=audit(s,r,'Seed '+seed+' day '+d);
   if(s.w3.abgeschlossen!==oldTrips){events.push({day:d,ore:s.w3.abgeschlossen});oldTrips=s.w3.abgeschlossen}
   if([30,59,60,90,104,105,120,125,150,180,240,365].includes(d)){
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),'Save/Load '+d);
     points[d]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
       ice:s.w5n.frachtAbgeschlossen,wages:f.orePilotWages,
       consumer:s.owners.w5n_kunden.cash,spedition:s.owners.transport.cash,
       buyer:s.owners.st_nadir.cash,
       oreMerchant:s.w5h.bestand,oreAtNadir:s.stations.st_nadir.lager.erz,
       plan:f.yardPlan.stage,orePlan:f.orePlan.stage,
       activeFreighters:f.continuity.freighters};
   }
 }
 const f=api.w5sFinanzStatus(s,r);
 return {seed,days,on,hash:api.hash(s),
   ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
   ice:s.w5n.frachtAbgeschlossen,wages:f.orePilotWages,
   ownerCash:s.owners.transport.cash,consumerCash:s.owners.w5n_kunden.cash,
   fundCash:s.owners.fonds_transport.cash,points,events};
}
test('W5s-q: Gegenprobe alte W5s-p-Forschungswelt ist ohne Flag bitidentisch',()=>{
 for(const [seed,hash]of [[42,'778b897e3213f827'],[7,'547778324a02446f']]){
   const x=run(seed,365,false);
   assert.equal(x.hash,hash,'Bestandsschutz und gleiche Geldpolitik');
   assert.equal(x.wages.paid,0);
   assert.equal(x.ore,3);
   assert.equal(x.water,5738);
   console.log('W5S_Q_WAGE_OFF '+JSON.stringify({seed,hash:x.hash,water:x.water,ore:x.ore}));
 }
});
test('W5s-q: 13 Seeds ×90 Tage – ausschließlich echte W3-Arbeit als privates Einkommen',()=>{
 for(const seed of seeds){
   const x=run(seed,90,true);
   assert.equal(x.ore,2,'Frachtende nur nach vollständigem Rückflug');
   assert.equal(x.wages.earned,240);
   assert.equal(x.wages.paid,240,'vollständig gebuchte 2 ×120 ISK W3-Pilotenlohn');
   assert.ok(x.water>=4316,'keine zusätzliche Wasserkrise vor Tag90');
   if([42,7].includes(seed))assert.deepEqual(run(seed,90,true),x,'Seed-Replay');
   console.log('W5S_Q_WAGE_90D '+JSON.stringify({seed,hash:x.hash,water:x.water,ice:x.ice,ore:x.ore,wages:x.wages}));
 }
});
test('W5s-q: Seed42/7 ×365 Tage – reales Haushaltseinkommen und unveränderte Weltbilanz',()=>{
 for(const seed of [42,7]){
   const x=run(seed,365,true);
   assert.equal(x.wages.paid,x.wages.earned,'alle gebuchten W3-Pilotenlöhne genau einmal');
   assert.ok(x.water>5738,'tatsächlich höherer bezahlter Wasserabsatz');
   assert.ok(x.ore>=3,'autonome dritte Erzlieferung bleibt erhalten');
   console.log('W5S_Q_WAGE_365D '+JSON.stringify(x));
 }
});
test('W5s-q: Manipuliertes Lohnbuch und unberechtigte Hausgeldschöpfung scheitern',()=>{
 const r=rules(true),s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=105;d++)api.advance(s,1440,r);
 audit(s,r,'Original');
 const original=api.hash(s);
 for(const mutation of [
   q=>{q.w5s.orePilotWages+=120},
   q=>{q.w5s.orePilotPays[0].amount+=1},
   q=>{q.owners.w5n_kunden.cash+=120},
   q=>{q.owners.fonds_transport.cash-=120;q.owners.w5n_kunden.cash+=120}
 ]){
   const clone=api.loadW5R(api.save(s));mutation(clone);
   assert.equal(api.audit(clone).ok,false,'manipulierte Einzelbilanz erkennen');
 }
 assert.equal(api.hash(s),original,'kein Original-Save angefasst');
});
