import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true}};
test('W5s-q: Mehrfache reale Blockaden Tag104–365; vollständiger Zustand',()=>{
 const s=api.createW5RState(42,'full','npc3');let oldTrips=0;
 for(let d=1;d<=365;d++){
  api.advance(s,1440,rules);
  const a=api.audit(s),f=api.w5sFinanzStatus(s,rules);
  assert.equal(a.ok,true,'Core Tag '+d);assert.equal(f.ok,true,'Finanz Tag '+d);
  if([59,60,75,90,103,104,105,110,115,120,125,130,135,140,150,165,180,200,240,300,365].includes(d)
    ||s.w3.abgeschlossen!==oldTrips){
    const k=api.pilotNpcKrisenLage(s);
    const min=Object.values(s.ships).filter(sh=>sh.klasse==='miner')
       .map(sh=>({id:sh.id,owner:sh.owner,system:sh.system,phase:sh.phase,
         job:sh.auftrag,ware:sh.ware,cargo:sh.ladung,bohrer:sh.bohrerMk1})),
      fre=Object.values(s.ships).filter(sh=>sh.klasse==='frachter')
       .map(sh=>({id:sh.id,owner:sh.owner,system:sh.system,phase:sh.phase,
         job:sh.auftrag,cargo:sh.ladung}));
    console.log('W5S_Q_DIAG '+JSON.stringify({day:d,hash:api.hash(s),
      complete:s.w3.abgeschlossen, delivered:s.w3.geliefert,
      ice:s.w5n.frachtAbgeschlossen,water:s.w5n.wasserVerbraucht,
      made:{w5:s.w5,w4:s.w4},
      groups:{npc3:k,venture:f.oreVenture,takeover:f.takeover},
      plan:{yard:f.yardPlan,ore:f.orePlan,
        npc:api.w5sNpcErzStatus(s,rules),venture:f.oreVenturePlan,
        carrier:f.continuity,demand:f.demand},
      ownerCash:Object.fromEntries(['npc3','house','export','st_aldera','st_nadir','transport','werft_extern','w5n_kunden','fonds_aldera','fonds_nadir'].map(id=>[id,s.owners[id]?.cash])),
      stocks:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager,
        merchantOre:s.w5h.bestand,oreOnWay:s.w5h.unterwegs},
      miners:min,freighters:fre,
      tick:s.tick}));
  }
  oldTrips=s.w3.abgeschlossen;
 }
});
