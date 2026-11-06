import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules={...api.W5R_RULES,w5s:{
 minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
 autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
 retainFleetEarnings:true,carrierWorkingCapital:true,autoOreSettlement:true,
 autoTakeover:true,autoNpcVenture:true,autoOreWageHousehold:true,
 autoIndustryWages:true,onDemandMaintenance:true,independentSuccessor:true
}};
const cmd=(s,c)=>api.execute(s,c,rules);
function hasAudit(s,where){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,rules);
 assert.equal(a.ok,true,where+': '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(f.ok,true,where+' / W5s books');
 assert.equal(f.successor.ok,true,where+' / successor identity');
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),s.initialSupply);
 return f;
}
test('W5s-t: echte W4/W5-Werftcharge + private Gründung + eigener bezahlter Frachter',()=>{
 for(const seed of [42,7]){
  const s=api.createW5RState(seed,'full','npc3');
  for(let d=1;d<=120;d++)api.advance(s,1440,rules);
  let p=api.w5sNachfolgeStatus(s,rules);
  assert.equal(s.w5r.frachter.lost>=2,true,'nachgewiesene ältere Schiffsverluste');
  assert.equal(s.stations.st_nadir.lager.frachter,0,'keine Gratis-Hülle im Depot');
  assert.equal(p.stage,'keine_physische_freie_werft_huelle','erst echte Werftproduktion');
  hasAudit(s,'vor W5-Bau');
  if(!s.w4.auftrag){
   const ref=cmd(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
   assert.equal(ref.ok,true,'W4 Refinement '+ref.reason);
  }
  while(s.w4.auftrag)api.advance(s,1,rules);
  const build=cmd(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'});
  assert.equal(build.ok,true,'W5 realer Schiffbau: '+build.reason);
  while(s.w5.auftrag)api.advance(s,1,rules);
  p=api.w5sNachfolgeStatus(s,rules);
  assert.equal(p.stage,'finanzierbarer_neuer_spediteur',JSON.stringify(p));
  const investor=s.owners.export.cash,legacy=s.owners.transport.cash;
  const oreTradeCost=s.stats.konto.export.kosten;
  const founded=cmd(s,{type:'shipFoundCarrier',owner:'export'});
  assert.equal(founded.ok,true,'einmalige private Kapitalgründung: '+founded.reason);
  assert.equal(s.owners.export.cash,investor-930);
  assert.equal(s.owners.transport.cash,legacy,'alte Spedition nicht gerettet');
  assert.equal(s.owners.w5s_carrier2.cash,930);
  assert.equal(s.stats.konto.export.kosten,oreTradeCost,
    'privates Anteilskapital ist KEIN Erz-Handelsaufwand');
  assert.equal(s.stats.konto.w5s_carrier2?.erloes??0,0,
    'Eigenkapital ist KEIN Frachtumsatz');
  assert.equal(s.w5s.successor.ship,null);
  assert.equal(cmd(s,{type:'shipFoundCarrier',owner:'export'}).ok,false,'keine zweite Gratisgründung');
  console.log('W5S_T_FOUNDER_AUDIT '+JSON.stringify({core:api.audit(s),finance:api.w5sFinanzStatus(s,rules)}));
  hasAudit(s,'nach Unternehmensgründung');
  const buyer=s.owners.werft_extern.cash;
  const before=s.nextShip;
  const purchase=cmd(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'});
  assert.equal(purchase.ok,true,'bezahlter Original-shipBuy: '+purchase.reason);
  const id=s.w5s.successor.ship,ship=s.ships[id];
  assert.equal(s.nextShip,before+1);
  assert.equal(ship?.owner,'w5s_carrier2');
  assert.equal(ship?.heimat,'nadir');
  assert.equal(s.owners.w5s_carrier2.cash,180,'Flug-/Arbeitsreserve bleibt bei neuer Firma');
  assert.equal(s.owners.werft_extern.cash,buyer+750,'Werft erhält vollen realen Preis');
  assert.equal(s.owners.transport.cash,legacy,'altes Konto unverändert');
  assert.equal(cmd(s,{type:'shipFreight',owner:'w5s_carrier2',schiff:id}).ok,false,
    'kein fremder W3-Auftrag ohne eigenen Rahmenvertrag');
  assert.equal(cmd(s,{type:'shipFreightIce',owner:'w5s_carrier2',schiff:id}).ok,false,
    'kein fremder W5n-Auftrag ohne eigenen Rahmenvertrag');
  const finance=hasAudit(s,'nach echtem W5-Verkauf');
  assert.equal(finance.successor.pricePaid,750);
  assert.equal(finance.successor.revenue,0,'keine fingierte Frachtmarge');
  const hash=api.hash(s);
  assert.equal(api.hash(api.loadW5R(api.save(s))),hash,'Save/Load');
  assert.equal(cmd(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'}).ok,false,
    'keine zweite Hülle auf denselben 930-ISK-Gründungsvertrag');
  assert.equal(api.hash(s),hash,'abgewiesener zweiter Kauf ohne Nebenwirkung');
  const illegal=api.loadW5R(api.save(s));
  illegal.w5s.successor.capital++;
  assert.equal(api.audit(illegal).ok,false,'Kapital ohne echte Gegenbuchung abgelehnt');
  assert.equal(api.hash(s),hash,'Manipulation nur auf Kopie');
  for(let day=121;day<=140;day++){
    api.advance(s,1440,rules);
    const verified=hasAudit(s,'Fortsetzung '+seed+' Tag'+day);
    assert.equal(verified.successor.ship,id,'kein stiller Schiffs-/Firmenwechsel');
    assert.equal(verified.successor.revenue,0,'ohne Frachtvertrag keine Gratiserlöse');
  }
  console.log('W5S_T_REAL '+JSON.stringify({seed,hash,ship:id,
    capital:finance.successor.capital,investorSpent:investor-s.owners.export.cash,
    shipyardRevenue:750,workingCapital:s.owners.w5s_carrier2.cash,
    legacyCash:s.owners.transport.cash,physicalHull:s.ledger.frachter.consumed,
    customer:s.owners.w5n_kunden.cash}));
 }
});
