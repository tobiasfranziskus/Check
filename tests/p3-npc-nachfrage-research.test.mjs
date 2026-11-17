// Research only: trace AUTONOMOUS NPC income -> dividend -> water purchase.
// No new economy, no balance changes. Accurate negative findings are expected.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const money=s=>Object.values(s.owners).reduce((n,v)=>n+v.cash,0);
const inspect=(j,label)=>{
 const s=j.zustandReferenz(),w=j.weltReferenz(),entries=Object.entries(s.kanon.buch?.summen||{});
 assert.equal(w.audit(s).ok,true);assert.equal(money(s),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const paid=entries.filter(([k])=>/^(wasser-einzelhandel|dividende|wasser-grosshandel|wasser-)/.test(k));
 const k=s.kanon;
 const snapshot={
  label,tick:s.tick,tag:Math.floor(s.tick/1440),
  haus:s.owners.house.cash,aldera:s.owners.st_aldera.cash,nadir:s.owners.st_nadir.cash,
  npc3:s.owners.npc3.cash,transport:s.owners.transport.cash,
  npcOwners:Object.fromEntries(['eigner_npc3','eigner_st_nadir','eigner_st_aldera','eigner_transport','eigner_werft','pilot_npc3','pilot_house','w5n_arbeit','arbeitskraefte_nadir']
   .filter(id=>s.owners[id]).map(id=>[id,s.owners[id].cash])),
  water:{aldera:s.stations.st_aldera.lager.wasser,nadir:s.stations.st_nadir.lager.wasser,
   consumed:s.ledger.wasser.consumed,soldAldera:k.wasser.verkauftAldera,soldNadir:k.wasser.verkauftNadir},
  ice:{aldera:s.stations.st_aldera.lager.eis,nadir:s.stations.st_nadir.lager.eis},
  rounds:k.spielerFrachten?.auftraege.filter(x=>x.end!==null).length||0,
  transfer:paid.map(([k,v])=>[k,v]),pending:k.engpass,dividendInterval:k.politik.dividendeMinuten};
 console.log('P3_NPC_FLOW '+JSON.stringify(snapshot));
 return snapshot;
};
test('trace real NPC water demand after Aldera buyer market freeze and first dividend',()=>{
 const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);
 let n=0;
 while(n++<95){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(!p.bereit)break;
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true,p.aktion);
 }
 const blocked=inspect(j,'blocked-stand');
 assert.ok(blocked.rounds>=4);
 const baseCash=blocked.aldera,baseSold=blocked.water.soldAldera;
 for(let i=0;i<32;i++){
  j.weiterspielen(60);
  const s=j.zustandReferenz();
  if(s.tick%240===0 || s.tick===1440 || s.tick===1500 || s.tick===1560)inspect(j,'after-wait');
 }
 const after=inspect(j,'after-32-hours');
 const delta=after.water.soldAldera-baseSold;
 console.log('P3_NPC_FLOW_RESULT '+JSON.stringify({before:baseCash,after:after.aldera,rounds:blocked.rounds,
  npcWaterSalesAfterFreeze:delta,ownerNpcsCash:after.npcOwners,waterConsumed:after.water.consumed,world:money(j.zustandReferenz())}));
 assert.equal(j.weltReferenz().audit(j.zustandReferenz()).ok,true);
 // A negative result MUST NOT be disguised as a guaranteed market rescue.
});

test('NPC water income supports next original player-owned freight, without player purchasing water',()=>{
 const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);
 for(let i=0;i<95;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(!p.bereit)break;
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true,p.aktion);
 }
 const before=inspect(j,'player-freight-before-npc'),initialRounds=before.rounds,initialBuyer=before.aldera;
 let contract=null;
 for(let i=0;i<22;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(p.art==='auftrag'&&p.aktion?.startsWith('freight-')&&p.bereit){
   const tick=j.zustandReferenz().tick;
   const result=j.ausfuehren(p.aktion);assert.equal(result.ok,true,JSON.stringify(result));
   contract={tick,id:p.aktion,buyer:j.zustandReferenz().owners.st_aldera.cash};
   j.weiterspielen(60);j.weiterspielen(60);break;
  }
  j.weiterspielen(60);
 }
 const after=inspect(j,'player-freight-after-npc'),s=j.zustandReferenz();
 assert.ok(contract,'an ORIGINAL paid freight must be possible from a real batch');
 assert.equal(after.rounds,initialRounds+1,'one more actual dock-returned original F4');
 assert.equal(s.kanon.buch?.summen?.['wasser-einzelhandel|pilot_house|st_aldera']||0,0,
  'no manual or hidden pilot_house consumer spending');
 const grossNpcSales=(s.kanon.buch?.summen?.['wasser-einzelhandel|pilot_npc3|st_aldera']||0)
  +(s.kanon.buch?.summen?.['wasser-einzelhandel|fonds_aldera|st_aldera']||0)
  +(s.kanon.buch?.summen?.['wasser-einzelhandel|eigner_npc3|st_aldera']||0);
 assert.ok(grossNpcSales>0,'real financed NPC households must buy actual local water');
 assert.equal(money(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 const json=j.exportieren(),loaded=J8.erstellen();loaded.oeffnen204(json,true);
 assert.equal(loaded.exportieren(),json);
 console.log('P3_NPC_FREIGHT_OK '+JSON.stringify({beforeTick:before.tick,contract,
  buyerBefore:initialBuyer,afterTick:after.tick,npcWaterCash:grossNpcSales,
  afterRounds:after.rounds,privateConsumption:0,ledger:s.kanon.buch?.summen?.['dividende|npc3|eigner_npc3']||0,
  world:money(s),hash:j.weltReferenz().hash(s)}));
});
