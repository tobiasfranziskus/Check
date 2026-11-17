// W4/W5 preflight: use original S02 economy and signed commands only.
// This is diagnostic code; no product rule, new money or goods.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const money=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function audit(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.equal(money(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
}
test('S02: original ore contracts, refining jobs, W5 hulls and Nadir purchase opportunity',()=>{
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=w.load(j.exportieren());
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 const before=w.hash(s),rows=[];
 let firstAvailable=null,firstW3=null,firstW4=null,firstW5=null;
 for(let m=0;m<=14*1440;m+=60){
  if(m)w.advance(s,60);
  if(m%1440===0){audit(w,s);rows.push({day:m/1440,w3:s.w3.abgeschlossen,ore:s.w3.geliefert,
    w4:s.w4.abgeschlossen,materials:s.w4.materialErzeugt,w5:s.w5.fertig,
    npcOrders:Object.fromEntries(Object.entries(s.kanon.npc.befehle).filter(([k])=>/shipFreight|stationRefine|stationBuildShip/.test(k))),
    material:s.stations.st_nadir.lager.material,nadirShips:s.stations.st_nadir.lager.frachter,
    cash:{transport:s.owners.transport.cash,nadir:s.owners.st_nadir.cash,werft:s.owners.werft_extern.cash,house:s.owners.house.cash}});}
  if(s.w3.abgeschlossen&&!firstW3)firstW3={m,n:s.w3.abgeschlossen};
  if(s.w4.abgeschlossen&&!firstW4)firstW4={m,n:s.w4.abgeschlossen};
  if(s.w5.fertig&&!firstW5)firstW5={m,n:s.w5.fertig};
  if(!firstAvailable && s.w5.fertig>0 && s.stations.st_nadir.lager.frachter>0){
   const copy=w.load(w.save(s));
   const oldCash=copy.owners.house.cash,oldStock=copy.stations.st_nadir.lager.frachter;
   const receipt=w.execute(copy,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_nadir'});
   if(receipt.ok){audit(w,copy);firstAvailable={minute:m,houseBefore:oldCash,after:copy.owners.house.cash,
     stockBefore:oldStock,stockAfter:copy.stations.st_nadir.lager.frachter,ownShips:Object.values(copy.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='frachter').map(sh=>sh.id),
     hash:w.hash(s),afterHash:w.hash(copy)};}
  }
 }
 audit(w,s);
 const data={rows,firstW3,firstW4,firstW5,firstAvailable,
  finalHash:w.hash(s),beforeHash:before,
  legalIndustrialOrders:Object.fromEntries(Object.entries(s.kanon.npc.befehle).filter(([k])=>/stationRefine|stationBuildShip|shipFreight/.test(k))),
  materialAudit:{produced:s.ledger.material.produced,consumed:s.ledger.material.consumed,oreDelivered:s.w3.geliefert,oreConsumed:s.w4.erzVerbraucht},
  ledger:{w3:s.w3,w4:s.w4,w5:s.w5},world:money(s)};
 console.log('W4_W5_ORE_RESEARCH '+JSON.stringify(data));
 assert.ok(s.w3.abgeschlossen>=2,'at least two real paid original W3 shipments');
 assert.ok(s.w4.abgeschlossen>=2,'at least two financed original refinery jobs');
 assert.ok(s.w5.fertig>=2,'at least two finished original W5 hulls');
 assert.ok(s.w3.geliefert>=s.w4.erzVerbraucht,'ore comes from true physical freight');
 assert.equal(s.ledger.material.produced,s.w4.materialErzeugt);
 assert.equal(s.w5.materialVerbraucht,s.w5.begonnen*w.rules.w5.material);
});
