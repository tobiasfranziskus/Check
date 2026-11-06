import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=(on=true)=>({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,...(on?{autoNpcVenture:true}:{})
}});
function dailyAudit(s,r,label){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+': Core '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(f.ok,true,label+': Carrier-Kasse');
 assert.equal(f.oreVenture.ok,true,label+': NPC3-Kapital');
 assert.equal(f.freight.available,f.freight.reconstructed);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
   s.initialSupply,label+': unabhängige Geldsumme');
 for(const [ware,l] of Object.entries(s.ledger)){
  const physical=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
    +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    label+': physische Ware '+ware);
 }
 return f;
}
function run(seed,days,on=true){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3'),
 points={},events=[];let last=0;
 for(let day=1;day<=days;day++){
   api.advance(s,1440,r);
   const f=dailyAudit(s,r,'Seed '+seed+' Tag'+day);
   if(s.w3.abgeschlossen!==last){
     events.push({day,ore:s.w3.abgeschlossen});last=s.w3.abgeschlossen;
   }
   if([30,59,60,61,62,75,90,100,105,120,150,180,240,365].includes(day)){
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
       'Save/Load '+day);
     const venture=f.oreVenture,sh=s.ships[venture.ship];
     points[day]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
       ice:s.w5n.frachtAbgeschlossen,venture,plan:f.oreVenturePlan,
       npcPlan:api.w5sNpcErzStatus(s,r),
       orePlan:f.orePlan,shop:f.yardPlan,
       npcCash:s.owners.npc3.cash,merchantCash:s.owners.export.cash,
       companyCash:s.owners.transport.cash,houseCash:s.owners.w5n_kunden.cash,
       stAldera:s.owners.st_aldera.cash,
       oreAtAldera:s.stations.st_aldera.lager.erz,
       merchantOre:s.w5h.bestand,
       minerStock:s.stations.st_aldera.lager.miner,
       miner:sh?{id:sh.id,owner:sh.owner,cargo:sh.ladung,job:sh.auftrag,ware:sh.ware,phase:sh.phase}:null};
   }
 }
 return {seed,days,on,hash:api.hash(s),events,points,
   ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
   water:s.w5n.wasserVerbraucht,
   venture:api.w5sFinanzStatus(s,r).oreVenture,
   npcCash:s.owners.npc3.cash,exportCash:s.owners.export.cash,
   transportCash:s.owners.transport.cash,shipCount:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length};
}
test('W5s-p: Finanzierter NPC-Erzlieferant im selben vollständigen R32-Core',()=>{
 const x=run(42,120,true);
 console.log('W5S_P_DIAG '+JSON.stringify(x));
 assert.equal(x.venture.active,true,'nach Investment tatsächlich gekaufter Miner');
 assert.ok(x.ore>=3,'dritte 50er Erzlieferung voll bezahlt');
});
