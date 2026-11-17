// P3: NPCs already earn and buy actual water; player provides a missing
// paid freight hull using ONLY existing original J8 action and world minutes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const NPC=require('../prototypes/spiel/p3-npc-markt.js');
const worldMoney=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function safe(j){
 const s=j.zustandReferenz();
 assert.equal(j.weltReferenz().audit(s).ok,true);
 assert.equal(worldMoney(s),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 return s;
}
function reproduce(){
 const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);
 const read=()=>NPC.auswerten(j.weltReferenz(),safe(j),j.angebote(),W.DATEN);
 let stop=null;
 for(let i=0;i<95;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(!p.bereit){stop=p;break;}
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true,p.aktion);
 }
 assert.ok(stop,'original buyer financing must eventually block');
 const frozen=safe(j),at=read();
 assert.equal(frozen.tick,960);
 assert.equal(stop.abgeschlossen,7);
 assert.equal(at.sichtbar,true);
 assert.equal(at.art,'zeit');
 assert.equal(at.npcFrachter,0,'NPC carrier does not own a matching available hull');
 assert.ok(at.eigeneFrachter>=1,'player already bought a real hull');
 assert.ok(at.npcWasserAl>0,'existing NPC accounts have already purchased water');
 assert.equal(at.npcDividenden,0,'cannot call wages dividends before day one');
 const oldHash=j.weltReferenz().hash(frozen),oldJson=j.exportieren();
 assert.deepEqual(read(),at,'only a reading, no second market or timer');
 assert.equal(j.exportieren(),oldJson,'read adapter must never mutate saved world');
 assert.equal(j.weltReferenz().hash(j.zustandReferenz()),oldHash);
 let receipt=null;
 for(let i=0;i<18;i++){
  const next=read();
  if(next.art==='fracht'){
   const offer=j.angebote().find(x=>x.id===next.aktion);
   assert.equal(offer?.ok,true,'only an owner-authorized original offer');
   receipt={tick:j.zustandReferenz().tick,quote:next.aktion,
     aldera:j.zustandReferenz().owners.st_aldera.cash,
     npcIncome:next.npcWasserAl};
   assert.equal(j.ausfuehren(next.aktion).ok,true);
   j.weiterspielen(60);j.weiterspielen(60);
   break;
  }
  assert.equal(next.art,'zeit');
  j.weiterspielen(60);
 }
 assert.ok(receipt,'original F4 route becomes available without buying from player pilot account');
 const end=safe(j),after=read();
 assert.equal(after.runde,at.runde+1,'real original F4 delivery + docked return');
 assert.equal(end.kanon.buch.summen['wasser-einzelhandel|pilot_house|st_aldera']||0,0,
  'private pilot never had to buy water to support NPC demand');
 assert.ok(after.npcWasserAl>=at.npcWasserAl);
 assert.ok(after.npcWasserAl>0);
 assert.equal(after.npcFrachter,0);
 const restored=J8.erstellen();
 const json=j.exportieren();restored.oeffnen204(json,true);
 assert.equal(restored.exportieren(),json);
 assert.equal(restored.weltReferenz().hash(restored.zustandReferenz()),j.weltReferenz().hash(end));
 const fraud=JSON.parse(json);
 fraud.owners.house.cash+=1;fraud.owners.st_aldera.cash-=1;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(fraud),true),
  'forged owner cash shift must fail despite preserved world money');
 console.log('P3_NPC_PLAYER_LOGISTICS_OK '+JSON.stringify({at:at.runde,after:after.runde,
  initialTick:frozen.tick,receipt,buyerBefore:at.alderakasse,
  NPCSales:after.npcWasserAl,NPCFreighters:after.npcFrachter,
  worldMoney:worldMoney(end),mint:end.minted,burn:end.burned,
  hash:j.weltReferenz().hash(end)}));
 return j.weltReferenz().hash(end);
}
test('P3: real NPC water demand and owner-paid freight recover a bottleneck without donations',()=>{
 assert.equal(reproduce(),reproduce(),'two independently generated worlds must replay identically');
});
test('P3: research Rule207 and unearned initial career do not expose the NPC market chapter',()=>{
 const p=J8.erstellen();p.startenP8g(true);
 assert.equal(NPC.auswerten(p.weltReferenz(),p.zustandReferenz(),p.angebote(),W.DATEN).sichtbar,false);
 const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);
 const c=NPC.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote(),W.DATEN);
 assert.equal(c.sichtbar,false);
 assert.equal(c.npcWasserAl,0);
 assert.equal(c.npcDividenden,0);
});
