import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
const RULES=Object.freeze({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true,
  autoTakeover:true,autoNpcVenture:true,autoOreWageHousehold:true,
  autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true
}});
const OFF={...RULES,w5s:{...RULES.w5s,successorOperations:false}};
function proof(s,label){
  const a=api.audit(s),f=api.w5sFinanzStatus(s,RULES);
  assert.equal(a.ok,true,label+' core '+Object.keys(a).filter(k=>a[k]?.ok===false).join(','));
  assert.equal(f.ok,true,label+' finance');
  assert.equal(f.successor.ok,true,label+' successor');
  assert.equal(f.freight.valid,true,label+' legacy freight');
  assert.equal(s.minted,0,label+' no issuance');
  assert.equal(s.burned,0,label+' no burn');
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000,label+' money');
  assert.equal(a.goods.ok,true,label+' real goods');
  return f;
}
function loadRoundTrip(s,label){
  const hash=api.hash(s);
  assert.equal(api.hash(api.loadW5R(api.save(s))),hash,label+' save/load');
  return hash;
}
function build(seed){
  const s=api.createW5RState(seed,'full','npc3');
  for(let d=1;d<=120;d++)api.advance(s,1440,RULES);
  proof(s,'vor Gründung');
  let cmd=api.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'},RULES);
  assert.equal(cmd.ok,true,'echte W4-Materialproduktion: '+cmd.reason);
  while(s.w4.auftrag)api.advance(s,1,RULES);
  cmd=api.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},RULES);
  assert.equal(cmd.ok,true,'echter W5-Werftbau: '+cmd.reason);
  while(s.w5.auftrag)api.advance(s,1,RULES);
  const oreBefore=s.stations.st_nadir.lager.frachter;
  assert.ok(oreBefore>0);
  const investorBefore=s.owners.export.cash,oldBefore=s.owners.transport.cash;
  cmd=api.execute(s,{type:'shipFoundCarrier',owner:'export'},RULES);
  assert.equal(cmd.ok,true,'privat finanzierte Gründung: '+cmd.reason);
  assert.equal(s.owners.export.cash,investorBefore-930);
  assert.equal(s.owners.transport.cash,oldBefore,'keine Alt-Firmenhilfe');
  cmd=api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'},RULES);
  assert.equal(cmd.ok,true,'bezahlte originale shipBuy: '+cmd.reason);
  assert.equal(s.stations.st_nadir.lager.frachter,oreBefore-1);
  assert.equal(s.owners.w5s_carrier2.cash,180);
  assert.equal(api.w5sNachfolgeBetrieb(s,RULES).stage,'ueberfuehrung_vorfinanziert');
  assert.equal(s.w5s.successor.autoOrders,undefined,'bisher kein NPC-Autopilotbefehl');
  return s;
}
function run(seed,log=false){
  const s=build(seed),id=s.w5s.successor.ship,start=s.tick;
  const steps=35*1440;
  let freightStart=null,finish=null,retire=null;
  let lastOrders=0,oldShip=s.w5r.frachter.id;
  for(let minute=1;minute<=steps;minute++){
    api.advance(s,1,RULES);
    const z=s.w5s.successor,events=z.autoOrders||[];
    if(events.length>lastOrders){
      assert.equal(events.length,lastOrders+1,'nur eine neue Beauftragung pro Takt');
      const event=events.at(-1);
      assert.equal(event.ship,id,'nur juristisch eigene Hülle');
      if(event.type==='shipReposition'){
        assert.equal(s.owners.w5s_carrier2.cash,120,'60 ISK bezahlt vor der Reise');
        assert.equal(s.owners.w5s_transfer_reserved.cash,60);
        assert.equal(s.w5s.active.owner,'w5s_carrier2');
      }else if(event.type==='shipFreightIce'){
        freightStart=s.tick;
        const a=s.w5n.frachtauftrag;
        assert.equal(a.owner,'w5s_carrier2');
        assert.equal(a.schiff,id);
        assert.equal(a.menge,50);
        assert.equal(s.owners.w5n_fracht_kauf.cash,490);
        assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
        assert.equal(s.owners.w5s_carrier2.cash,0);
      }else assert.fail('unbekanntes Auto-Event');
    }
    lastOrders=events.length;
    if(s.w5n.frachtauftrag?.owner==='w5s_carrier2')
      assert.equal(s.ships[id].owner,'w5s_carrier2');
    if(z.trips===1&&!finish)finish=s.tick;
    if(z.retired&&!retire)retire=s.tick;
    if(minute%60===0||events.length>0&&minute%60===1||z.retired&&minute%1440===0)
      proof(s,'Seed '+seed+' Minute '+minute);
    if([1,10,60,61,120,121,180,1440,7*1440,30*1440,31*1440,35*1440].includes(minute)
      ||s.tick===freightStart||s.tick===finish||s.tick===retire)loadRoundTrip(s,'Seed '+seed+' Minute '+minute);
  }
  const z=s.w5s.successor,f=proof(s,'Seed '+seed+' Ende 35d');
  assert.deepEqual(z.autoOrders.map(e=>e.type),['shipReposition','shipFreightIce']);
  assert.equal(z.flightPaid,60);
  assert.equal(z.flightAllocated,60);
  assert.equal(z.workReserved,120);
  assert.equal(z.workPaid,120);
  assert.equal(z.freightRevenue,240);
  assert.equal(z.trips,1);
  assert.ok(Number.isSafeInteger(freightStart)&&freightStart>z.bought);
  assert.equal(finish-freightStart,120,'Fracht nur nach 120 Arbeitstakten');
  assert.ok(retire>=z.bought+RULES.w5r.freighterLifeDays*1440);
  assert.equal(retire%1440,0,'Schiffsende bei Tagesgrenze statt während Bezahlung');
  assert.equal(z.retired.id,id);
  assert.equal(z.retired.reason,'verschleiss');
  assert.equal(s.ships[id],undefined,'Hülle physisch entfernt');
  assert.equal(s.w5r.losses.some(x=>x.id===id),false,'kein Alt-Konzernverlust');
  assert.equal(s.owners.w5s_carrier2.cash,240,'real erzielte Liquidität, kein Gratisersatz');
  assert.equal(f.successor.freightLicense,false,'verschlissenes Schiff darf nicht fahren');
  const next=api.w5sNachfolgeBetrieb(s,RULES);
  assert.equal(next.stage,'frachter_verschlissen');
  assert.equal(next.required,930);
  assert.equal(next.shortfall,690);
  assert.equal(next.replacement,'keine_physische_werft_huelle');
  assert.equal(api.execute(s,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id},RULES).ok,false);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'},RULES).ok,false);
  assert.equal(api.audit(s).ok,true);
  const result={seed,hash:api.hash(s),freightStart,finish,retire,days:35,
    cash:f.successor.held,iceTransport:50,successorFreight:240,
    ownLabor:120,initialHull:750,ownReposition:60,
    shortfall:690,autoOrders:z.autoOrders.length,worldMoney:33000,minted:0};
  if(log)console.log('W5S_V_REAL '+JSON.stringify(result));
  return {s,z,result};
}
test('W5s-v: 13x90 Tage ohne neue Gründung bleiben vollständig finanziert',()=>{
 for(const seed of seeds){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=90;day++){
   api.advance(s,1440,RULES);
   proof(s,'no-founder Seed '+seed+' Tag '+day);
  }
  assert.equal(s.w5s.successor,undefined);
  assert.equal(api.w5sNachfolgeBetrieb(s,RULES).stage,'keine_rechtmaessige_gruendung');
 }
});
test('W5s-v: Seed42/7×365 Tage ohne Gründung bitidentisch zu W5s-u',()=>{
 for(const [seed,hash] of [[42,'131d982e273bcd67'],[7,'e05c12e808d4b859']]){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=365;day++){
   api.advance(s,1440,RULES);proof(s,'Seed '+seed+' Tag '+day);
  }
  assert.equal(loadRoundTrip(s,'referenz'),hash);
 }
});
test('W5s-v: autonom W4→W5→Unternehmenskauf→50 Eis transportiert, nach 30 Tagen getrennt verschlissen',()=>{
 const a=run(42,true),b=run(7,true);
 assert.equal(a.result.retire,b.result.retire);
 assert.equal(a.result.freightStart,b.result.freightStart);
});
test('W5s-v: deterministischer Neustart und Save/Load der freien Nachfolgefirma',()=>{
 for(const seed of [42,7]){
  const a=run(seed),b=run(seed);
  assert.equal(a.result.hash,b.result.hash,'Doppellauf deterministisch');
  assert.equal(api.hash(api.loadW5R(api.save(a.s))),a.result.hash);
 }
});
test('W5s-v: Manipulationsschutz für Verlusturkunde, Autoverträge und rechtliche Fremdeigentümer',()=>{
 const {s,z}=run(42);
 for(const [property,broken] of [
  ['retired',{...z.retired,tick:z.retired.tick-1440*3}],
  ['retired',{...z.retired,id:'shFAKE'}],
  ['retired',{...z.retired,reason:'piraterie'}],
  ['autoOrders',[...z.autoOrders,{tick:z.autoOrders[1].tick,type:'shipFreightIce',ship:z.ship}]],
  ['autoOrders',[...z.autoOrders.slice(0,1),{...z.autoOrders[1],ship:'shFAKE'}]],
  ['workPaid',z.workPaid+1],
  ['freightRevenue',z.freightRevenue+240],
  ['trips',z.trips+1]
 ]){
  const modified=api.loadW5R(api.save(s));
  modified.w5s.successor[property]=structuredClone(broken);
  assert.equal(api.audit(modified).ok,false,'gefälschter Nachfolgernachweis '+property);
 }
 assert.equal(api.audit(s).ok,true);
});
test('W5s-v: ohne Operationsflag kein neuer NPC-Auftrag und keine neue Ermüdung',()=>{
 const s=api.createW5RState(42,'full','npc3');for(let d=1;d<=120;d++)api.advance(s,1440,OFF);
 let action=api.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'},OFF);
 assert.equal(action.ok,true);while(s.w4.auftrag)api.advance(s,1,OFF);
 action=api.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},OFF);
 assert.equal(action.ok,true);while(s.w5.auftrag)api.advance(s,1,OFF);
 assert.equal(api.execute(s,{type:'shipFoundCarrier',owner:'export'},OFF).ok,true);
 assert.equal(api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
   station:'st_nadir',klasse:'frachter'},OFF).ok,true);
 const id=s.w5s.successor.ship,old=api.hash(s);
 assert.equal(api.w5sNachfolgeBetrieb(s,OFF).stage,'inaktiv');
 api.advance(s,60,OFF);
 assert.equal(s.w5s.successor.autoOrders,undefined);
 assert.equal(s.ships[id].system,'nadir');
 assert.equal(s.owners.w5s_carrier2.cash,180);
 assert.equal(api.audit(s).ok,true);
 assert.notEqual(api.hash(s),old,'Core-Uhr darf weiterlaufen');
});

test('W5s-v: Seed42/7 nach echter Gründung bis Tag365 ohne Geisterschiff, Kredit oder geschenkten Ersatz',()=>{
 for(const [seed,expectedHash] of [[42,'433f98c35e9f2034'],[7,'adecb4a5a32d0a0a']]){
  const s=build(seed),id=s.w5s.successor.ship;
  const days=365-Math.floor(s.tick/1440);
  for(let i=1;i<=days;i++){
   api.advance(s,1440,RULES);
   proof(s,'Echte Nachfolge Seed '+seed+' Tag '+Math.floor(s.tick/1440));
   if(i%30===0)loadRoundTrip(s,'Nachfolge lang '+seed+' '+i);
  }
  const z=s.w5s.successor;
  assert.equal(z.retired.tick,217440);
  assert.equal(s.ships[id],undefined,'kein wiederbelebtes Schiff');
  assert.equal(z.autoOrders.length,2,'nur tatsächlich finanzierte Aufträge');
  assert.equal(z.trips,1,'keine Schattenfahrt nach Ausmusterung');
  assert.equal(z.freightRevenue,240);
  assert.equal(s.owners.w5s_carrier2.cash,240,'keine nachträgliche Rettung');
  assert.equal(api.w5sNachfolgeBetrieb(s,RULES).stage,'frachter_verschlissen');
  assert.equal(loadRoundTrip(s,'Nachfolger Tag365'),expectedHash);
  console.log('W5S_V_365D_REAL '+JSON.stringify({seed,hash:expectedHash,retired:z.retired.tick,
    realTrips:z.trips,cash:s.owners.w5s_carrier2.cash,minted:s.minted}));
 }
});
