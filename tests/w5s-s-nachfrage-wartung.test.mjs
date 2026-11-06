import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];

function rules(on=true){
 return {...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,
  ...(on?{onDemandMaintenance:true}:{})
 }};
}
function auditAll(s,r,seed,day){
 const label=seed+' day '+day;
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+' Core '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(f.ok,true,label+' Speditions-/Auftragsfinanzbuch');
 assert.equal(f.industryWages.ok,true,label+' Industrie-Lohnbuch');
 assert.equal(f.industryWages.details.find(x=>x.key==='maintenance').paid,
   s.w5r.servicePaid,'Lohn nur nach realen Wartungsminuten');
 assert.equal(s.minted,0,label+' keine ISK-Emission');
 assert.equal(s.burned,0,label+' kein ISK-Vernichten');
 assert.equal(Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),
   s.initialSupply,label+' konstantes Weltgeld');
 for(const [ware,l] of Object.entries(s.ledger)){
  const stock=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
   +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    label+' physische Ware '+ware);
 }
 const before=api.hash(s);
 const p=api.w5sWartungStatus(s,r);
 assert.equal(api.hash(s),before,label+' Wartungsplanung strikt lesend');
 assert.equal(f.maintenance.stage,p.stage);
 if(r.w5s.onDemandMaintenance&&p.overdue&&!s.w5r.serviceJob){
  assert.ok(['kein_bezahlter_folgeauftrag',
    'wartung_plus_produktion_unfinanziert',
    'wartung_plus_produktion_vorfinanziert','fertigung_aktiv'].includes(p.stage),
    label+' kein still umgangener Service');
 }
 return p;
}
function run(seed,days,on=true){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3');
 const stages={}, checkpoints={};
 for(let day=1;day<=days;day++){
  api.advance(s,1440,r);
  const p=auditAll(s,r,seed,day);
  stages[p.stage]=(stages[p.stage]||0)+1;
  if([20,40,60,90,104,120,150,240,365].includes(day)){
   const original=api.hash(s);
   assert.equal(api.hash(api.loadW5R(api.save(s))),original,
    'Save/Load '+seed+' day '+day);
   checkpoints[day]={service:p.stage,paid:s.w5r.servicePaid,
    services:s.w5r.services,water:s.w5n.wasserVerbraucht,
    ore:s.w3.abgeschlossen,house:s.owners.w5n_kunden.cash};
  }
 }
 return {seed,days,on,hash:api.hash(s),stages,checkpoints,
  services:s.w5r.services,servicePaid:s.w5r.servicePaid,
  factory:s.w5n.fabrikFertig,ice:s.w5n.frachtAbgeschlossen,
  water:s.w5n.wasserVerbraucht,ore:s.w3.abgeschlossen,
  wages:api.w5sFinanzStatus(s,r).industryWages.paid,
  carrier:api.w5sFinanzStatus(s,r).continuity};
}

test('W5s-s: reiner Plan verlangt Eis, Käufer, Platz UND 60+20 echte Stations-ISK',()=>{
 const r=rules(true),s=api.createW5RState(42,'full','npc3');
 assert.equal(api.w5sWartungStatus(s,r).stage,'nicht_faellig');
 s.tick=s.w5r.serviceDue; // nur synthetischer, lesender Grenztest; KEIN Welt-Audit
 s.w5n.fabrikauftrag=null;
 s.stations.st_nadir.lager.eis=r.w5n.rezeptEis;
 s.stations.st_nadir.lager.wasser=0;
 s.owners.w5n_kunden.cash=0;
 s.owners.st_nadir.cash=100;
 assert.equal(api.w5sWartungStatus(s,r).stage,'kein_bezahlter_folgeauftrag');
 s.owners.w5n_kunden.cash=r.w5n.wasserPreis;
 s.owners.st_nadir.cash=79;
 assert.equal(api.w5sWartungStatus(s,r).stage,
  'wartung_plus_produktion_unfinanziert');
 assert.equal(api.w5sWartungStatus(s,r).fehlbetrag,1);
 s.owners.st_nadir.cash=80;
 const h=api.hash(s),p=api.w5sWartungStatus(s,r);
 assert.equal(p.stage,'wartung_plus_produktion_vorfinanziert');
 assert.equal(p.required,80);assert.equal(api.hash(s),h);
 s.stations.st_nadir.lager.eis=0;
 assert.equal(api.w5sWartungStatus(s,r).stage,'kein_bezahlter_folgeauftrag');
});

test('W5s-s: 13 Seeds x 90 Tage, tägliche vollständige Geld- und Warenbilanzen',()=>{
 for(const seed of seeds){
  const x=run(seed,90);
  assert.ok(x.services>0,'es gibt tatsächlich bezahlten Service');
  assert.ok(x.servicePaid>0);
  assert.equal(x.ore,2,'keine künstliche zusätzliche Erzfracht');
  assert.ok(x.factory>0,'reale Wasserproduktion');
  if(seed===42||seed===7)assert.deepEqual(run(seed,90),x,
    'deterministisches Doppelreplay');
  console.log('W5S_S_90D '+JSON.stringify(x));
 }
});

test('W5s-s: R32 ohne neues Flag exakt unveränderte W5s-r-365d-Hashes',()=>{
 for(const [seed,expected] of [[42,'dcc4b22bc8a90ecc'],[7,'5bbc5f901749282e']]){
  const x=run(seed,365,false);
  assert.equal(x.hash,expected);
  assert.equal(x.water,6143);
  assert.equal(x.services,18);
  assert.equal(x.servicePaid,1080);
  console.log('W5S_S_OFF '+JSON.stringify({seed,hash:x.hash}));
 }
});

test('W5s-s: Seed42/7 x 365d, keine Wartung ohne Nachfrage und keine Gratis-Produktion',()=>{
 for(const seed of [42,7]){
  const x=run(seed,365,true);
  assert.ok(x.servicePaid<=1080,'kein unbegründetes Mehr an Wartungsarbeit');
  assert.equal(x.servicePaid,x.services*60,'nur vollständige vorfinanzierte Arbeiten');
  assert.ok(x.water<=x.factory*10,'kein Wasserverbrauch ohne Produktion');
  assert.ok(x.ore<=3,'keine erfundene vierte Erzlieferung');
  assert.ok(x.stages.kein_bezahlter_folgeauftrag>0
      ||x.stages.wartung_plus_produktion_unfinanziert>0,
     'realer fehlender Wartungs-/Folgeetat sichtbar');
  console.log('W5S_S_365D '+JSON.stringify(x));
 }
});
