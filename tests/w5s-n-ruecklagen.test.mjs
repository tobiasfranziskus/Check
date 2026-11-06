import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
function make(cycles=1,lead=2){
 return {...api.W5R_RULES,w5s:{
   minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
   autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
   autoLeadDays:lead,retainFleetEarnings:true,carrierWorkingCapital:true,
   autoOreSettlement:true,...(cycles!==1?{carrierRenewalCycles:cycles}:{})
 }};
}
function run(cycles,lead=2,days=365){
 const r=make(cycles,lead),s=api.createW5RState(42,'full','npc3');
 const data={},events=[];let last=0;
 for(let day=1;day<=days;day++){
   api.advance(s,1440,r);
   const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
   assert.equal(a.ok,true,'Core '+day);assert.equal(f.ok,true,'Liquidität '+day);
   assert.equal(s.minted,0);
   assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),s.initialSupply);
   if(s.w3.abgeschlossen!==last){events.push({day,ore:s.w3.abgeschlossen});last=s.w3.abgeschlossen}
   if([7,15,30,45,59,60,75,90,105,120,150,180,240,300,365].includes(day)){
     const oreOwned=Object.values(s.ships).filter(x=>x.klasse==='miner')
       .reduce((n,x)=>n+(x.ladung.erz||0),0);
     data[day]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
       ice:s.w5n.frachtAbgeschlossen,carrierCash:s.owners.transport.cash,
       dividends:s.w5o.divFracht,household:s.owners.w5n_kunden.cash,
       nadir:s.owners.st_nadir.cash,npc:s.owners.npc3.cash,
       merchant:s.w5h.bestand,oreOwned,oreAldera:s.stations.st_aldera.lager.erz,
       oreNadir:s.stations.st_nadir.lager.erz,built:s.w5.fertig,
       replacements:s.w5r.assignments?.length||0,
       hullId:s.w5r.frachter.id,stage:f.yardPlan.stage,oreStage:f.orePlan.stage};
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
   }
 }
 return {cycles,lead,days,events,hash:api.hash(s),data,
  ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,ice:s.w5n.frachtAbgeschlossen,
  built:s.w5.fertig,carrierCash:s.owners.transport.cash,npcCash:s.owners.npc3.cash,
  dividends:s.w5o.divFracht,initialSupply:s.initialSupply};
}
test('W5s-n: 1×/2×/3× Eigentümerrücklage, 365 Spieltage und tägliche originale Audits',()=>{
  for(const cycles of [1,2,3]){
    const x=run(cycles);
    assert.equal(x.initialSupply,33000);
    assert.equal(x.data[365].ore,x.ore);
    console.log('W5S_N_CYCLES '+JSON.stringify(x));
  }
});
