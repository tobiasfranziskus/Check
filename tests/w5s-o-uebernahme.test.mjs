import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
function rules(yes=true){return {...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
  autoLeadDays:2,retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,...(yes?{autoTakeover:true}:{})}};
}
function audit(s,r,label){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+' CORE '+JSON.stringify(
   Object.entries(a).filter(([,v])=>v?.ok===false).map(([k])=>k)));
 assert.equal(f.ok,true,label+' Speditions-Finanznachweis');
 assert.equal(f.takeover.ok,true,label+' Beteiligungsbuch');
 assert.equal(f.freight.available,f.freight.reconstructed,label+' Eigentümerkasse');
 assert.equal(s.minted,0,label+' kein neues ISK');assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
   s.initialSupply,label+' gesamte Welt-ISK');
 for(const [ware,l] of Object.entries(s.ledger)){
  const present=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
    +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
  assert.equal(present,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    label+' physische Waren '+ware);
 }
 return f;
}
function run(seed,days=90,yes=true){
 const r=rules(yes),s=api.createW5RState(seed,'full','npc3');
 let boughtAt=null,receivedAt=null;const points={};
 for(let d=1;d<=days;d++){
  api.advance(s,1440,r);
  const f=audit(s,r,'seed '+seed+' tag '+d);
  if(f.takeover.active &&boughtAt===null)boughtAt=d;
  if(f.takeover.dividends>0&&receivedAt===null)receivedAt=d;
  if([30,59,60,75,90,120,180,365].includes(d)){
    assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),'Save/Load');
    points[d]={ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
      water:s.w5n.wasserVerbraucht,capital:f.takeover,
      freight:s.owners.transport.cash,export:s.owners.export.cash,
      carrierOwned:f.continuity.freighters,
      yard:f.yardPlan.stage,oreGate:f.orePlan.stage,
      buyer:s.owners.w5n_kunden.cash};
  }
 }
 const f=api.w5sFinanzStatus(s,r);
 return {seed,days,yes,hash:api.hash(s),boughtAt,receivedAt,points,
   ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
   water:s.w5n.wasserVerbraucht,built:s.w5.fertig,
   freightCash:s.owners.transport.cash,merchantCash:s.owners.export.cash,
   takeover:f.takeover,continuity:f.continuity};
}
test('W5s-o: Flag AUS bleibt bitidentisch zum bestätigten W5s-m/n',()=>{
 for(const [seed,ref]of [[42,'cabb622881cd52d4'],[7,'36f9e9e6691b1aea']]){
   const x=run(seed,90,false);assert.equal(x.hash,ref);
   assert.equal(x.boughtAt,null);
   console.log('W5S_O_OFF '+JSON.stringify({seed,hash:x.hash}));
 }
});
test('W5s-o: erste echte Mehrheitsübernahme und reale nachfolgende Dividenden',()=>{
 const x=run(42,90,true);
 assert.ok(x.boughtAt!==null,'Kapitalanlage nach realen Frachtbelegen');
 assert.equal(x.takeover.active,true);
 assert.equal(x.takeover.capital,930);
 assert.equal(x.takeover.share,60);
 console.log('W5S_O_ACQUISITION '+JSON.stringify(x));
});
test('W5s-o: 13 feste Seeds ×90 Tage, tägliche Originalaudits, Save/Load',()=>{
 for(const seed of SEEDS){
   const x=run(seed,90,true);
   assert.equal(x.takeover.active,true);
   if([42,7].includes(seed))assert.deepEqual(run(seed,90,true),x);
   console.log('W5S_O_90D '+JSON.stringify({seed,hash:x.hash,
     boughtAt:x.boughtAt,ore:x.ore,water:x.water,ice:x.ice,
     newShares:x.takeover.capital,paid:x.takeover.dividends,
     freight:x.freightCash,export:x.merchantCash}));
 }
});
test('W5s-o: Seed42/7 ×365 Tage, investorische Verluste statt ungesicherter Rettung',()=>{
 for(const seed of [42,7]){
  const x=run(seed,365,true);
  assert.equal(x.takeover.active,true);
  console.log('W5S_O_365D '+JSON.stringify(x));
 }
});
