import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=(lead=2)=>({...api.W5R_RULES,w5s:{
 minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
 autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
 autoLeadDays:lead,retainFleetEarnings:true,carrierWorkingCapital:true,
 autoOreSettlement:true}});
function report(s,r,day){
 const f=api.w5sFinanzStatus(s,r),npc=api.w5sNpcErzStatus(s,r);
 const miners=Object.values(s.ships).filter(x=>x.klasse==='miner').map(x=>({
 id:x.id,owner:x.owner,sys:x.system,phase:x.phase,job:x.auftrag,ware:x.ware,
 cargo:x.ladung})).sort((a,b)=>a.id.localeCompare(b.id));
 const freighters=Object.values(s.ships).filter(x=>x.klasse==='frachter').map(x=>({
 id:x.id,owner:x.owner,sys:x.system,phase:x.phase,job:x.auftrag,cargo:x.ladung}))
 .sort((a,b)=>a.id.localeCompare(b.id));
 return {day,tick:s.tick,hash:api.hash(s),oreTrips:s.w3.abgeschlossen,
 oreDelivered:s.w3.geliefert,oreBought:s.w5h.gekauft,oreMerchant:s.w5h.bestand,
 oreInTransit:s.w5h.unterwegs,iceTrips:s.w5n.frachtAbgeschlossen,
 water:s.w5n.wasserVerbraucht,
 warehouse:{alderaOre:s.stations.st_aldera.lager.erz,
 nadirOre:s.stations.st_nadir.lager.erz,nadirMaterial:s.stations.st_nadir.lager.material,
 nadirMiner:s.stations.st_nadir.lager.miner,nadirFreighter:s.stations.st_nadir.lager.frachter},
 owners:Object.fromEntries(['npc3','st_aldera','export','transport','st_nadir',
 'werft_extern','w5n_kunden','fonds_aldera'].map(k=>[k,s.owners[k]?.cash])),
 decisions:{yard:f.yardPlan,ore:f.orePlan,npc},cargo:{miners,freighters},
 hulls:{built:s.w5.fertig,minerBuilt:s.w5.minerFertig,sold:s.w5.verkauft,
 minerSold:s.w5.minerVerkauft,lost:s.w5r.losses.length,
 replaced:s.w5r.assignments?.length??0,life:s.w5r},
 retained:{divMine:s.w5o.divMine,divFreight:s.w5o.divFracht,divStation:s.w5o.divStation},
 capital:{nextHull:f.freight.nextHullWithWorkingCapital,available:f.freight.available,
 pending:f.freight.escrow},proof:{core:api.audit(s).ok,fin:f.ok,minted:s.minted}};
}
test('W5s-n – drittes Erzgeschäft: Zustand, Finanzierung, physische Wertschöpfung',()=>{
 for(const seed of [42,7])for(const lead of [2,7,30]){
  const r=rules(lead),s=api.createW5RState(seed,'full','npc3');
  let lastTrips=0;
  for(let day=1;day<=365;day++){
    api.advance(s,1440,r);
    assert.equal(api.audit(s).ok,true,'Tag '+day+' Seed '+seed+' Core');
    if(s.w3.abgeschlossen!==lastTrips){
      console.log('W5S_N_EVENT '+JSON.stringify({
       seed,lead,day,from:lastTrips,to:s.w3.abgeschlossen}));
      lastTrips=s.w3.abgeschlossen;
    }
    if([15,30,45,59,60,75,90,105,120,150,180,240,300,365].includes(day)){
      const t=report(s,r,day);
      assert.equal(t.proof.fin,true);
      if(seed===42)console.log('W5S_N_DIAG '+JSON.stringify({seed,lead,...t}));
    }
  }
 }
});
