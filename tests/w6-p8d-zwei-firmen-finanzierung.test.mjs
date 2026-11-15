// P8d/W6: isolierte, strenge Unterschriften-/Zahlungs-Gates des Vertragsmoduls.
// KEINE erfundene Vollwelt: dieser kleine Fixture-Test beweist nur die
// lokalen Vorbedingungen, nicht eine reale Produzenten-/Nachfragekette.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const P8D=require('../prototypes/welt/p8d-dravos-fracht-core.js');
const rules={
 rulesVersion:207,p8d:{minerOwner:'npc3',frachterOwner:'transport'},
 j2b:{charge:8,minutenJeEinheit:8,preis:24},
 w3:{arbeitJeMinute:1,frachtgebuehrJeMinute:2},
 w5Transfer:{pilot:'w5ac_transfer_pilot'}
};
function fixture(minerCash,carrierCash){
 const journals=[];
 const transfer=(s,von,an,betrag,art)=>{
  assert.ok(Number.isSafeInteger(betrag)&&betrag>0);
  assert.ok(s.owners[von].cash>=betrag,'kein unfinanzierter Journaltransfer');
  s.owners[von].cash-=betrag;
  s.owners[an].cash+=betrag;
  journals.push({von,an,betrag,art});
 };
 const kern={route(_world,von,nach){
  if(von==='aldera'&&nach==='dravos')return {zeit:20,weg:['aldera','dravos']};
  if(von==='dravos'&&nach==='nadir')return {zeit:40,weg:['dravos','orion','nadir']};
  return null;
 }};
 const api=P8D.create({rules,kern,transfer,
   summe(_s,art){return journals.filter(x=>x.art===art).reduce((n,x)=>n+x.betrag,0)},
   ladungSumme:sh=>Object.values(sh.ladung).reduce((n,x)=>n+x,0),
   stillgelegt:()=>false,
   flugSync:()=>{},
   siliziumVerkaufen:()=>{throw Error('kein Verkauf im lokalen Gate-Test')}
 });
 const s={
  tick:1000,w3:{auftrag:null},w5n:{frachtauftrag:null},w5ac:{active:null},
  owners:{
   npc3:{cash:minerCash},transport:{cash:carrierCash},
   k1_p8d_fracht:{cash:0},k1_p8d_pilot:{cash:0},
   w5ac_transfer_pilot:{cash:0}
  },
  ships:{
   miner:{id:'miner',owner:'npc3',klasse:'miner',heimat:'nadir',
     system:'dravos',phase:'dock',auftrag:'halten',
     ladung:{silizium:8},flug:{lage:'angedockt',anker:'st_dravos'}},
   frachter:{id:'frachter',owner:'transport',klasse:'frachter',
     system:'aldera',phase:'dock',auftrag:'halten',
     ladung:{},flug:{lage:'angedockt',anker:'st_aldera'}}
  },
  kanon:{
   p8d:api.leer(),
   minerWerft:{lokaleKaeufe:[{id:'miner',owner:'npc3'}]},
   p8c:{reisen:[{schiff:'miner',nach:'dravos',ende:900,dauer:40,bezahlt:40}]},
   silizium:{auftrag:{schiff:'miner',owner:'npc3',feld:'dravos-silizium',
     gearbeitet:64,gefoerdert:8}}
  }
 };
 const offer={type:'siliconFreightOffer',owner:'npc3',miner:'miner',frachter:'frachter'};
 return {s,api,offer,journals};
}
test('Zwei getrennte Unternehmensbudgets: 119/120 ISK Auftrag und 59/60 ISK Crew führen zu reinem Abbruch',()=>{
 for(const [npc3,transport,re] of [
  [119,600,/Frachtgebuehr/],[120,59,/Pilotlohn/],
  [0,0,/Frachtgebuehr/]
 ]){
  const {s,api,offer,journals}=fixture(npc3,transport);
  const old=JSON.stringify(s);
  const r=api.ausfuehren(s,offer);
  assert.equal(r.ok,false);
  assert.match(r.reason,re);
  assert.equal(JSON.stringify(s),old,'abgelehnte Kassenprüfung darf nichts buchen');
  assert.equal(journals.length,0);
  assert.equal(api.audit(s),true);
 }
});
test('Beide Eigentümer signieren unabhängig, jede Reserve genau einmal, ohne zusätzlichen Lohn- oder Warenverkauf',()=>{
 const {s,api,offer,journals}=fixture(120,60);
 const startGeld=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 assert.deepEqual(api.ausfuehren(s,offer),{ok:true,type:offer.type});
 assert.equal(s.owners.npc3.cash,0);
 assert.equal(s.owners.k1_p8d_fracht.cash,120);
 assert.equal(s.owners.transport.cash,60);
 assert.equal(api.audit(s),true,'ausstehendes Angebot ist mit echtem Kundengeld hinterlegt');
 const before=JSON.stringify(s);
 const invalid=api.ausfuehren(s,{type:'siliconFreightAccept',owner:'npc3'});
 assert.equal(invalid.ok,false);
 assert.equal(JSON.stringify(s),before,'Bergbaufirma darf nicht für Spedition unterzeichnen');
 const sign=api.ausfuehren(s,{type:'siliconFreightAccept',owner:'transport'});
 assert.equal(sign.ok,true);
 assert.equal(s.owners.transport.cash,0);
 assert.equal(s.owners.k1_p8d_pilot.cash,60);
 assert.equal(api.audit(s),true);
 const second=JSON.stringify(s);
 assert.equal(api.ausfuehren(s,offer).ok,false,'dieselbe Ware nicht doppelt anbieten');
 assert.equal(api.ausfuehren(s,{type:'siliconFreightAccept',owner:'transport'}).ok,false);
 assert.equal(api.ausfuehren(s,{type:'siliconFreightDeliver',owner:'transport'}).ok,false);
 assert.equal(JSON.stringify(s),second);
 assert.equal(journals.length,2,'exakt eine gebundene Auftraggeber- und Speditionskasse');
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),startGeld);
 assert.equal(s.ships.miner.ladung.silizium,8,'kein fingierter Verkauf oder zweite Förderung');
 assert.equal(s.ships.frachter.ladung.silizium||0,0);
});
