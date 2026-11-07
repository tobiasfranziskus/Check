import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true
}};
const RULES=Object.freeze(base);
const OFF={...RULES,w5s:{...RULES.w5s,successorOreFreight:false}};
function proof(s,label){
  const core=api.audit(s),money=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  assert.equal(core.ok,true,label+' Kern: '+Object.keys(core).filter(k=>core[k]?.ok===false).join(','));
  const f=api.w5sFinanzStatus(s,RULES);
  assert.equal(f.ok,true,label+' W5s Finanz');
  assert.equal(f.successor.ok,true,label+' Nachfolger');
  assert.equal(f.freight.valid,true,label+' Eigentümer alt');
  assert.equal(money,33000,label+' volle Geldbilanz');
  assert.equal(s.minted,0,label+' keine Geldemission');
  assert.equal(s.burned,0,label+' keine Senke');
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),label+' SaveLoad');
}
function build(seed,rules=RULES){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,rules);
  for(const [cmd,owner] of [
    ['stationRefine','st_nadir'],
    ['stationBuildShip','werft_extern'],
    ['shipFoundCarrier','export'],
    ['shipBuy','w5s_carrier2']
  ]){
    const a={type:cmd,owner,
      ...(cmd==='stationRefine'||cmd==='stationBuildShip'?{station:'st_nadir'}:{}),
      ...(cmd==='shipBuy'?{station:'st_nadir',klasse:'frachter'}:{})};
    const res=api.execute(s,a,rules);
    assert.equal(res.ok,true,cmd+': '+res.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,rules);
  }
  return s;
}
function run(seed,days=35){
 const s=build(seed),id=s.w5s.successor.ship;
 let oreStart=0,iceStart=0,oreFinished=0,lastOre=0,oreBlocked=0;
 for(let hour=1;hour<=days*24;hour++){
   api.advance(s,60,RULES);
   const z=s.w5s.successor;
   const newOre=(z.autoOrders||[]).filter(x=>x.type==='shipFreight').length;
   if(newOre>oreStart)oreStart=newOre;
   const newIce=(z.autoOrders||[]).filter(x=>x.type==='shipFreightIce').length;
   if(newIce>iceStart)iceStart=newIce;
   if((z.oreTrips||0)>lastOre)oreFinished+=(z.oreTrips||0)-lastOre;
   lastOre=z.oreTrips||0;
   if(!z.retired&&api.w5sNachfolgeBetrieb(s,RULES).stage==='kein_zusaetzlicher_versorgungsbedarf')
     oreBlocked++;
   if(hour%24===0)proof(s,'seed '+seed+' Tag '+hour/24);
 }
 const z=s.w5s.successor,f=api.w5sFinanzStatus(s,RULES);
 assert.equal(oreFinished,z.oreTrips||0);
 assert.equal(z.oreWorkReserved||0,(z.oreTrips||0)*120,
   'durch W3-Audit belegte echte Erzpilotenreserve');
 assert.equal(z.oreWorkPaid||0,(z.oreTrips||0)*120);
 assert.equal(z.oreFreightRevenue||0,(z.oreTrips||0)*240);
 assert.equal(f.successor.oreTrips,z.oreTrips||0);
 assert.equal(s.owners[z.owner].cash,930-750-60-120-120*(z.oreTrips||0)+240+240*(z.oreTrips||0),
   'Eigenkapital/werthaltige W3+W5n-Erlöse korrekt rekonstruiert');
 const record={seed,hash:api.hash(s),oreStart,oreFinished,iceStart,
   oreBlocked,retired:z.retired?.tick,successorCash:s.owners[z.owner].cash};
 console.log('W5S_X_REAL '+JSON.stringify(record));
 assert.equal(z.ship,id);
 return record;
}
test('W5s-x: 2 aktive natürliche Krisen mit getrenntem W3/W5n-Kern, täglichen Audits',()=>{
  run(42);run(7);
});
test('W5s-x: deterministische Wiederholung/SaveLoad/zweifache Finanzierung ausgeschlossen',()=>{
  assert.deepEqual(run(42),run(42));
});
test('W5s-x: ohne neue Freigabe bleibt alter W5s-v-Transport und dessen Hash stabil',()=>{
  const s=build(42,OFF);
  for(let day=1;day<=35;day++)api.advance(s,1440,OFF);
  assert.equal(s.w5s.successor?.oreTrips||0,0);
  assert.equal((s.w5s.successor?.autoOrders||[]).some(x=>x.type==='shipFreight'),false);
  assert.equal(api.audit(s).ok,true);
  assert.equal(api.hash(s),'6a15b8cdc26a25df');
});
