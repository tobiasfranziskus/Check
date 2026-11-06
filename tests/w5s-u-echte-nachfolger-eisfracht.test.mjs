import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
function rules(opts={}){
 return {...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true,
  autoTakeover:true,autoNpcVenture:true,autoOreWageHousehold:true,
  autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,...opts
 }};
}
function proof(s,r,label){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+': '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(f.ok,true,label+' / Finanzstatus');
 assert.equal(f.freight.valid,true,label+' / Altspedition');
 assert.equal(f.successor.ok,true,label+' / Nachfolgegesellschaft');
 assert.equal(a.isk.ok,true);assert.equal(a.goods.ok,true);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply);
 for(const [ware,l]of Object.entries(s.ledger)){
  const count=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
   +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
  assert.equal(count,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    label+' / ware '+ware);
 }
 return f;
}
function buySuccessor(seed,r){
 const s=api.createW5RState(seed,'full','npc3');
 for(let day=1;day<=120;day++)api.advance(s,1440,r);
 proof(s,r,'vor Gründung');
 const ore=s.stations.st_nadir.lager.erz;
 const refine=api.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'},r);
 assert.equal(refine.ok,true,'W4: '+refine.reason);
 while(s.w4.auftrag)api.advance(s,1,r);
 assert.equal(s.stations.st_nadir.lager.erz,ore-r.w4.erzJeCharge);
 const build=api.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},r);
 assert.equal(build.ok,true,'W5: '+build.reason);
 while(s.w5.auftrag)api.advance(s,1,r);
 const available=s.stations.st_nadir.lager.frachter;
 assert.ok(available>0,'keine Gratiswerft: Bestand physisch vorhanden');
 assert.equal(api.w5sNachfolgeStatus(s,r).stage,'finanzierbarer_neuer_spediteur');
 const inv=s.owners.export.cash,old=s.owners.transport.cash,shipyard=s.owners.werft_extern.cash;
 const founded=api.execute(s,{type:'shipFoundCarrier',owner:'export'},r);
 assert.equal(founded.ok,true,'Gründung: '+founded.reason);
 assert.equal(s.owners.export.cash,inv-930);
 assert.equal(s.owners.transport.cash,old);
 assert.equal(s.stats.konto.export.kosten, s.w5h.gekauft*r.erzpilot.preis);
 proof(s,r,'nach Gründung');
 const purchase=api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
   station:'st_nadir',klasse:'frachter'},r);
 assert.equal(purchase.ok,true,'realer Kauf: '+purchase.reason);
 const id=s.w5s.successor.ship;
 assert.equal(s.ships[id].owner,'w5s_carrier2');
 assert.equal(s.owners.werft_extern.cash,shipyard+750);
 assert.equal(s.owners.w5s_carrier2.cash,180);
 assert.equal(s.stations.st_nadir.lager.frachter,available-1);
 assert.equal(api.execute(s,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id},r).ok,false,
   'erst bezahlt überführen, keine Gratisreise');
 assert.equal(api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
   station:'st_nadir',klasse:'frachter'},r).ok,false,'kein doppelter Hüllenkauf');
 proof(s,r,'nach Hull-Kauf');
 return {s,id,old};
}
function oneTrip(seed,diagnostic=false){
 const r=rules(),{s,id,old}=buySuccessor(seed,r);
 const before=s.owners.w5s_carrier2.cash;
 const start=api.execute(s,{type:'shipReposition',owner:'w5s_carrier2',schiff:id},r);
 assert.equal(start.ok,true,'original W5s: '+start.reason);
 assert.equal(s.owners.w5s_carrier2.cash,before-60,'Überführung vorfinanziert');
 assert.equal(s.owners.w5s_transfer_reserved.cash,60,'volle Überführungs-Treuhand');
 for(let min=1;min<=60;min++){
  api.advance(s,1,r);
  proof(s,r,'Überführung Minute '+min);
  if(min===30||min===60)assert.equal(
   api.hash(api.loadW5R(api.save(s))),api.hash(s),'Save/Load Überführung '+min);
 }
 assert.equal(s.ships[id].system,'aldera');
 assert.equal(s.w5s.successor.flightPaid,60);
 assert.equal(s.owners.w5s_transfer_reserved.cash,0);
 assert.equal(s.owners.w5s_carrier2.cash,120);
 const ice=s.stations.st_aldera.lager.eis,delivered=s.w5n.eisGeliefert;
 const revenue=s.w5n.frachtUmsatz,oldBefore=s.owners.transport.cash;
 const clientBefore=s.owners.st_nadir.cash;
 const startFreight=api.execute(s,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id},r);
 assert.equal(startFreight.ok,true,'original W5n: '+startFreight.reason);
 assert.equal(s.owners.w5s_carrier2.cash,0,'120 ISK Lohn vor dem Abflug gesperrt');
 assert.equal(s.owners.transport.cash,oldBefore,'keine fremde alte Arbeitskasse');
 assert.equal(s.owners.st_nadir.cash,clientBefore-490,'Nadir zahlt Ware UND Tarif im Voraus');
 assert.equal(s.owners.w5n_fracht_kauf.cash,490);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(s.stations.st_aldera.lager.eis,ice-50);
 assert.equal(s.ships[id].ladung.eis,50);
 assert.equal(api.execute(s,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id},r).ok,false,
   'eine Schiffsfahrt nicht doppelt');
 proof(s,r,'gesamte Originalbuchung vor erster Minute');
 for(let min=1;min<=120;min++){
  api.advance(s,1,r);
  proof(s,r,'bezahlter W5n-Flug Minute '+min);
  if([1,30,60,61,90,119,120].includes(min)){
   assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
     'Save/Load aktive Hin-/Rückfahrt Minute '+min);
  }
  if(min===60)assert.equal(s.w5n.eisGeliefert,delivered+50,'Ware nach erster Etappe real in Nadir');
 }
 assert.equal(s.w5n.eisGeliefert,delivered+50);
 assert.equal(s.w5n.frachtUmsatz,revenue+240);
 assert.equal(s.w5s.successor.trips,1);
 assert.equal(s.w5s.successor.workReserved,120);
 assert.equal(s.w5s.successor.workPaid,120);
 assert.equal(s.w5s.successor.freightRevenue,240);
 assert.equal(s.owners.w5s_carrier2.cash,240);
 assert.equal(s.ships[id].system,'aldera');
 assert.equal(s.ships[id].phase,'dock');
 const f=proof(s,r,'abgeschlossene Nachfolger-W5n-Fahrt');
 assert.equal(f.successor.freightLicense,true);
 assert.equal(f.successor.revenue,240);
 assert.equal(f.successor.held,240);
 const hash=api.hash(s);
 if(diagnostic)console.log('W5S_U_POSITIVE '+JSON.stringify({
  seed,id,hash,capital:930,hull:750,flight:60,pilotWork:120,
  iceDelivered:50,customerPaid:490,freightRevenue:240,
  successorCash:f.successor.held,oldCarrierCash:s.owners.transport.cash,
  worldCash:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
  minted:s.minted,oreTrips:s.w3.abgeschlossen,iceTrips:s.w5n.frachtAbgeschlossen
 }));
 return {s,r,id,hash};
}
test('W5s-u: 13 feste Seeds x90 Tage mit vollständigem Geld-/Waren-Audit',()=>{
 for(const seed of seeds){
  const r=rules(),s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=90;day++){
   api.advance(s,1440,r);proof(s,r,'Seed '+seed+' Tag '+day);
  }
  assert.equal(s.w3.abgeschlossen,2);
  assert.equal(s.w5n.wasserVerbraucht,4316);
  assert.equal(s.w5s?.successor,undefined);
  console.log('W5S_U_90D '+JSON.stringify({seed,hash:api.hash(s)}));
 }
});
test('W5s-u: Seed42/7 x365 Tage ohne Gründungsbefehl bitidentisch',()=>{
 for(const [seed,oldHash] of [[42,'131d982e273bcd67'],[7,'e05c12e808d4b859']]){
  const r=rules(),s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=365;day++){
   api.advance(s,1440,r);proof(s,r,'Seed '+seed+' Tag '+day);
   if([59,90,104,120,180,240,365].includes(day))
    assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  }
  assert.equal(api.hash(s),oldHash);
  assert.equal(s.w3.abgeschlossen,3);
  assert.equal(s.w5n.wasserVerbraucht,6068);
  console.log('W5S_U_OFF '+JSON.stringify({seed,hash:oldHash}));
 }
});
test('W5s-u: zwei echte W4/W5/Nachfolge-Überführungs- und Eisfrachten mit jedem Minuten-Audit',()=>{
 for(const seed of [42,7]){
  const a=oneTrip(seed,true);
  const b=oneTrip(seed);
  assert.equal(a.hash,b.hash,'deterministischer Re-Run Seed '+seed);
 }
});
test('W5s-u: manipulierte Firmen-/Lohn-/Frachtbelege fallen durch unabhängiges Audit',()=>{
 const {s,r}=oneTrip(42);
 for(const [property,delta] of [
  ['capital',1],['flightPaid',1],['workReserved',1],
  ['workPaid',-1],['trips',1],['freightRevenue',1],['pricePaid',-1]
 ]){
  const x=api.loadW5R(api.save(s));
  x.w5s.successor[property]+=delta;
  assert.equal(api.audit(x).ok,false,'gefälschte '+property+' abweisen');
 }
 assert.equal(api.audit(s).ok,true,'unveränderte Welt weiter gültig');
});
test('W5s-u: Fremdbefehle und nicht überführte Eigentümer werden nicht lizenziert',()=>{
 const r=rules(),s=api.createW5RState(42,'full','npc3');
 const hash=api.hash(s);
 assert.equal(api.execute(s,{type:'shipFoundCarrier',owner:'house'},r).ok,false);
 assert.equal(api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',station:'st_nadir',klasse:'frachter'},r).ok,false);
 assert.equal(api.hash(s),hash);
 const {s:x,id}=buySuccessor(7,r);
 assert.equal(api.execute(x,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id},r).ok,false);
 assert.equal(api.execute(x,{type:'shipFreight',owner:'w5s_carrier2',schiff:id},r).ok,false);
 const off=rules({successorFreight:false});
 assert.equal(api.execute(x,{type:'shipReposition',owner:'w5s_carrier2',schiff:id},off).ok,false,
   'Flag aus: kein neuer fliegender NPC-Verkehr');
 assert.equal(api.audit(x).ok,true);
});
