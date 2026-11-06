import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r={...api.W5R_RULES,w5s:{minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true}};
test('W5s-o: echte Marktgüter und verfügbare Schiffe am Insolvenzzeitpunkt',()=>{
 const s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=130;d++){
   api.advance(s,1440,r);
   if([59,75,90,100,110,119,120,130].includes(d)){
     const h=s.ships.sh003;
     let sale=null;if(h?.ladung.eis>=50&&h.auftrag==='halten') {
       const clone=api.loadW5R(api.save(s));
       sale=api.execute(clone,{type:'shipSellIce',owner:'npc3',schiff:h.id,menge:50},r);
       sale={...sale,post:clone.stations.st_aldera.lager.eis,cash:clone.owners.npc3.cash};
     }
     console.log('W5S_O_DIAG '+JSON.stringify({d,
       actual:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager,
         owners:Object.fromEntries(['transport','npc3','export','st_aldera','st_nadir','werft_extern','w5n_kunden'].map(k=>[k,s.owners[k]?.cash])),
         residentMiner:s.ships.sh003,ships:Object.values(s.ships).filter(x=>x.klasse==='frachter'),
         yard:api.w5sWerkStatus(s,r),ore:api.w5sNpcErzStatus(s,r),
         financed:api.w5sFinanzStatus(s,r).continuity,escort:s.w5s?.contract,
         iceFreight:s.w5n.frachtauftrag,ice:s.w5n.frachtAbgeschlossen,
         oreTrips:s.w3.abgeschlossen},
       sale}));
   }
   if(d===120){
     assert.equal(s.stations.st_aldera.lager.eis,150,
       'Aldera kauft bei vollem Eis-Lager keine zusätzliche Ware');
     assert.equal(s.ships.sh003.ladung.eis,100,
       'weitere 100 physisch vorhandene Eis im NPC-Miner');
     assert.equal(s.owners.w5n_kunden.cash,2,
       'ausgetrockneter Wasser-Endkundenetat, keine erfundene Nachfrage');
     const hash=api.hash(s);
     const denied=api.execute(s,{type:'shipSellIce',owner:'npc3',
       schiff:'sh003',menge:50},r);
     assert.equal(denied.ok,false,
       'vollen Quellmarkt nicht mit Gratis-Eis aufstocken');
     assert.equal(api.hash(s),hash,'Ablehnung verändert keine Waren oder ISK');
   }
 }
 assert.equal(api.audit(s).ok,true);
});
