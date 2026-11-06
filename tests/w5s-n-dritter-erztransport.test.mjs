import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
const rules=(lead=2)=>({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
  autoLeadDays:lead,retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true
}});
function verify(s,r,msg){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,msg+' Original-Core');
 assert.equal(f.ok,true,msg+' echte Speditions-Kassenprovenienz');
 assert.equal(f.freight.available,f.freight.reconstructed,msg+' Beträge real');
 assert.equal(s.minted,0,msg+' keine Geldemission');assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
   s.initialSupply,msg+' alle Weltkonten');
 for(const [ware,l] of Object.entries(s.ledger)){
   const owned=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   assert.equal(owned,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     msg+' physische Ware '+ware);
 }
 const before=api.hash(s);
 const after=api.w5sFinanzStatus(s,r);
 assert.equal(api.hash(s),before,msg+' alle Finanzansichten nur lesend');
 assert.equal(after.continuity.ownerCash,s.owners.transport.cash);
 assert.equal(after.continuity.ownCapitalMissing,
   Math.max(0,after.continuity.replacementNeed-s.owners.transport.cash),
   msg+' fremde Kapitalquellen nicht eingerechnet');
 return f;
}
function run(seed,days=90,lead=2){
 const r=rules(lead),s=api.createW5RState(seed,'full','npc3');
 let second=null;let checkpoint=null;let day120=null;const stages={};
 while(s.tick<days*1440){
   api.advance(s,1440,r);
   const day=s.tick/1440,f=verify(s,r,'seed '+seed+' d'+day+' lead'+lead);
   if(s.w3.abgeschlossen>=2&&second===null)second=day;
   if([30,59,90,120,180,365].includes(day)){
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
       'Save/Load '+seed+' Tag'+day);
     stages[day]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
       ice:s.w5n.frachtAbgeschlossen,capital:f.continuity,
       freight:f.freight.current,oreStage:f.orePlan.stage,
       yardStage:f.yardPlan.stage};
   }
   if(day===90)checkpoint=api.hash(s);
   if(day===120)day120={...stages[120]};
 }
 const f=api.w5sFinanzStatus(s,r);
 return {seed,lead,days,hash:api.hash(s),hash90:checkpoint,
   second,ore:s.w3.abgeschlossen,delivered:s.w3.geliefert,
   water:s.w5n.wasserVerbraucht,ice:s.w5n.frachtAbgeschlossen,
   built:s.w5.fertig,freightCash:s.owners.transport.cash,
   npcCash:s.owners.npc3.cash,merchantCash:s.owners.export.cash,
   merchantOre:s.w5h.bestand,
   availableFreighters:f.continuity.freighters,
   workingCapital:f.continuity.replacementNeed,
   shortfall:f.continuity.ownCapitalMissing,
   continuity:f.continuity,day120,stages};
}
test('W5s-n: Kunden- und Fremdvermögen gehören niemals automatisch der Spedition',()=>{
 const r=rules(),s=api.createW5RState(42,'full','npc3');
 let f=verify(s,r,'Start');
 assert.equal(f.continuity.stage,'flotte_vorhanden');
 assert.equal(f.continuity.freighters,1);
 for(let day=0;day<120;day++)api.advance(s,1440,r);
 f=verify(s,r,'Tag120');
 assert.equal(f.continuity.stage,'spedition_ohne_frachter_und_kapital');
 assert.equal(f.continuity.freighters,0);
 assert.equal(f.continuity.ownerCash,480);
 assert.equal(f.continuity.replacementNeed,930);
 assert.equal(f.continuity.ownCapitalMissing,450);
 assert.equal(f.continuity.independentCapital.oreMerchant,19800);
 assert.equal(f.continuity.independentCapital.shipyard,3560);
 assert.equal(s.w3.abgeschlossen,2);
 assert.equal(s.w5h.bestand,20);
 assert.equal(s.stations.st_aldera.lager.erz,20);
 const unberuehrt=api.hash(s);
 const tooRich=api.loadW5R(api.save(s));
 tooRich.owners.transport.cash+=450; // eine unterstellte kostenlose Rettung
 assert.equal(api.audit(tooRich).ok,false,'unbelegte Schöpfung muss auffallen');
 assert.equal(api.w5sFinanzStatus(tooRich,r).ok,false,
   'auch unabhängige Kassenprovenienz erkennt die Rettung');
 assert.equal(api.hash(s),unberuehrt,'kein Angriff auf ursprünglichen Spielstand');
});
test('W5s-n: 13 Seeds ×90 Tage mit unveränderter W5s-m-Wirtschaft und vollem Audit',()=>{
 for(const seed of SEEDS){
   const x=run(seed);
   assert.equal(x.ore,2);assert.equal(x.delivered,100);
   assert.equal(x.second,59);
   assert.equal(x.ice,88);assert.equal(x.water,4316);
   assert.equal(x.built,8);
   if([42,7].includes(seed))
     assert.deepEqual(run(seed),x,'vollständiger Seed-Replay');
   if(seed===42)assert.equal(x.hash,'cabb622881cd52d4');
   if(seed===7)assert.equal(x.hash,'36f9e9e6691b1aea');
   console.log('W5S_N_90D '+JSON.stringify({seed,hash:x.hash,ore:x.ore,
     water:x.water,ice:x.ice,second:x.second,built:x.built,
     freight:x.freightCash}));
 }
});
test('W5s-n: Seed42/7 ×365 Tage – kein unfinanzierter 3. Transport',()=>{
 for(const [seed,expected] of [[42,'6db0645ce08ee715'],
     [7,'4b509e4eb1628743']]){
   const x=run(seed,365);
   assert.equal(x.hash,expected,'W5s-m-Langzeitvergleich bitidentisch');
   assert.equal(x.ore,2);
   assert.equal(x.water,4382);
   assert.equal(x.ice,89);
   assert.equal(x.availableFreighters,0);
   assert.equal(x.freightCash,480);
   assert.equal(x.shortfall,450);
   assert.equal(x.merchantCash,19800);
   assert.equal(x.merchantOre,20);
   assert.equal(x.continuity.stage,'spedition_ohne_frachter_und_kapital');
   console.log('W5S_N_365D '+JSON.stringify({seed,hash:x.hash,ore:x.ore,
     water:x.water,ice:x.ice,shortfall:x.shortfall,
     carrier:x.freightCash,merchant:x.merchantCash}));
 }
});
test('W5s-n: Vorlauf 7/30 Tage bleibt ohne Eingriff in Käufergeld und Hüllen',()=>{
 for(const seed of [42,7]){
   for(const lead of [7,30]){
     const x=run(seed,90,lead);
     assert.equal(x.ore,2,'kein neuer Auftrag ohne eigenen Frachter');
     assert.ok(x.water>0);
     console.log('W5S_N_LEAD '+JSON.stringify({seed,lead,
       hash:x.hash,water:x.water,ore:x.ore,shortfall:x.shortfall}));
   }
 }
});
