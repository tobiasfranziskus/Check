import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const make=(lead=2,settlement=false)=>({...api.W5R_RULES,w5s:{minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:lead,retainFleetEarnings:true,carrierWorkingCapital:true,...(settlement?{autoOreSettlement:true}:{})}});
test('W5s-m: Ist-Analyse 2-/7-Tage-Erz-Nachfrage und Eigentumsfluss',()=>{
for(const lead of [2,7])for(const settlement of [false,true]){
 const r=make(lead,settlement),s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=90;d++){
   api.advance(s,1440,r);
   assert.equal(api.audit(s).ok,true,'vollstaendiges Buch day '+d);
   if([1,7,15,30,45,60,90].includes(d)){
     const f=api.w5sFinanzStatus(s,r),
       k=api.pilotNpcKrisenLage(s),
       m=api.w5sNpcErzStatus(s,r);
     console.log('W5S_M_DIAG '+JSON.stringify({lead,settlement,d,
       ore:s.w3.abgeschlossen,erzPlan:f.orePlan,werkPlan:f.yardPlan,
       npcOrePlan:m,krise:k,
       w5h:s.w5h,stationAlderaOre:s.stations.st_aldera.lager.erz,
       stationAlderaMiner:s.stations.st_aldera.lager.miner,
       stationNadirOre:s.stations.st_nadir.lager.erz,
       stationNadirMat:s.stations.st_nadir.lager.material,
       cash:Object.fromEntries(['npc3','st_aldera','export','transport','st_nadir','werft_extern','w5n_kunden'].map(k=>[k,s.owners[k]?.cash])),
       ships:Object.values(s.ships).filter(sh=>sh.klasse==='miner').map(sh=>({id:sh.id,owner:sh.owner,home:sh.heimat,sys:sh.system,phase:sh.phase,auftrag:sh.auftrag,ware:sh.ware,erz:sh.ladung.erz,eis:sh.ladung.eis})),
       wat:s.w5n.wasserVerbraucht
      }));
   }
 }
}});
