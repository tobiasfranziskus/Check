// Rule206 [ANALYSE]: echte Dravos-Miner-Expedition mit EINEM Rule205-K1-Kern.
// Keine Spende, kein zweiten Tick, keine implizite Rule204- oder Rule205-Migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const create=()=>{
 const w=K.erstellenP8c({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42,{politik:S02});
 assert.equal(w.regel,206);
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 assert.deepEqual(w.npcAutoSetzen(s,true),{ok:true,aktiviert:true});
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 return {w,s};
};
function independent(w,s){
 const e=W6.pruefen(w,s);
 assert.deepEqual(e,[],'Unabhaengige Geld-/Waren-/Eigentumsaudits: '+e.join('; '));
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),33000);
 assert.equal(s.ledger.silizium.mined,s.kanon.silizium.gefoerdert);
 assert.equal(s.ledger.silizium.consumed,s.kanon.bauteile.siliziumVerbraucht);
}
test('P8c: NUR isolierte Rule206 mit echtem Dravos-Null-Lager und historischer 40-Minuten-Route',()=>{
 const {w,s}=create();
 assert.equal(w.rules.j2b.nebenfeld.system,'dravos');
 assert.equal(w.rules.j2b.nebenfeld.vorrat,16);
 assert.equal(s.kanon.silizium.felder['dravos-silizium'].vorrat,16);
 assert.equal(s.stations.st_dravos.system,'dravos');
 assert.deepEqual(s.stations.st_dravos.lager,{});
 assert.equal(s.owners.st_dravos.cash,0);
 assert.equal(s.owners.fonds_dravos.cash,0);
 assert.equal(s.ledger.silizium.mined,0);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(Object.values(s.ships).filter(x=>x.system==='dravos').length,0,
   'keine geschenkten NPC-Miner/Frachter in Dravos');
 const route=w.kern.route(w.rules.world,'dravos','nadir');
 assert.deepEqual(route.weg,['dravos','orion','nadir']);
 assert.equal(route.zeit,40);
 assert.equal(w.flugKern.DATEN.systeme.dravos.station.id,'st_dravos');
 assert.equal(w.rules.world.stations.st_dravos.ziel.silizium,undefined,
   'Dravos kauft die Ware nicht heimlich automatisch');
 independent(w,s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.equal(K.erstellenJ4c().regel,204);
 assert.equal(K.erstellenP8b().regel,205);
});
test('P8c: Fremdtransport, erfundene Mine und ungebuchte W3-Route werden ohne Mutation abgelehnt',()=>{
 const {w,s}=create(),old=w.save(s);
 assert.equal(w.execute(s,{type:'shipTravelDravos',owner:'house',schiff:'sh999',ziel:'st_dravos'}).ok,false);
 assert.equal(w.execute(s,{type:'shipTravelDravos',owner:'npc3',schiff:'sh999',ziel:'st_dravos'}).ok,false);
 assert.equal(w.execute(s,{type:'shipTravelDravos',owner:'npc3',schiff:'sh999',ziel:'st_meridian'}).ok,false);
 assert.equal(w.execute(s,{type:'siliconMineStart',owner:'house',schiff:'sh999',feld:'dravos-silizium'}).ok,false);
 assert.equal(w.save(s),old,'Kauf-/Transit-Ablehnungen sind rein und ohne ISK-Bewegung');
});
test('P8c: 90 echte S02-Tage, 4 finanzierte J4, Dravos-Miner fliegt zweimal bezahlt hin und zurueck',()=>{
 const {w,s}=create();let buys=0,midTrip=null,tickStart=null;
 for(let t=120;t<=90*1440;t+=120){
  w.advance(s,120);
  if(s.kanon.p8c.auftrag && !midTrip){
   midTrip=w.save(s);tickStart=s.tick;
   assert.ok(s.kanon.p8c.auftrag.bezahlt>0);
   assert.ok(s.kanon.p8c.auftrag.bezahlt<s.kanon.p8c.auftrag.dauer);
  }
  if(s.stations.st_nadir.lager.jaeger>0 && s.owners.house.cash>=900&&buys<3){
   const before=s.owners.house.cash,nadir=s.owners.st_nadir.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(r.ok,true,JSON.stringify(r));
   assert.equal(before-s.owners.house.cash,900);
   assert.equal(s.owners.st_nadir.cash-nadir,900);
   buys++;
  }
  if(t%(15*1440)===0)independent(w,s);
 }
 independent(w,s);
 const b=s.kanon.silizium,f=b.felder,p=s.kanon.p8c;
 assert.equal(f['nadir-primaer'].gefoerdert,16);
 assert.equal(f['dravos-silizium'].gefoerdert,16);
 assert.equal(f['dravos-silizium'].verkauft,16,
   'Nadir-Kaeufer zahlt erst nach zwei echten Heimfluegen');
 assert.equal(b.gefoerdert,32);
 assert.equal(s.kanon.jaeger.fertig,4,'4 J4 nur aus physisch erhaltenem Silizium');
 assert.equal(buys,3,'3 echte vom Spieler gekaufte J4-Huellen');
 assert.equal(s.owners.house.cash,300);
 assert.equal(p.reisen.length,4,'2x Hinflug und 2x Rueckflug');
 assert.equal(p.reisen.filter(r=>r.nach==='dravos').length,2);
 assert.equal(p.reisen.filter(r=>r.nach==='nadir').length,2);
 assert.equal(p.minuten,160,'vier 40min Dravos-Orion-Nadir Originaltransite');
 assert.equal(p.bezahlt,160*w.rules.w3.arbeitJeMinute,'privater Transitpilot wirklich bezahlt');
 assert.equal(p.gebunden,p.bezahlt,'alle Transferkassen treuhaenderisch saldiert');
 assert.equal(s.owners.k1_p8c_reise.cash,0);
 assert.equal(p.auftrag,null);
 assert.equal(s.kanon.ersatzkaeufe,93);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.ok(midTrip&&tickStart,'bezahlter Zwischen-Save waehrend physischer Reise muss existieren');
 const restored=w.load(midTrip),restoredHash=w.hash(restored);
 w.advance(restored,60);
 independent(w,restored);
 assert.notEqual(w.hash(restored),restoredHash);
 assert.equal(w.hash(w.load(w.save(restored))),w.hash(restored));
 const forged=JSON.parse(w.save(s));
 forged.kanon.p8c.reisen[0].bezahlt--;
 assert.equal(w.audit(forged).ok,false,'fiktiver bezahlter Flug im Import muss scheitern');
 assert.throws(()=>w.load(JSON.stringify(forged)));
 const invalid=JSON.parse(w.save(s));
 invalid.kanon.silizium.felder['dravos-silizium'].vorrat+=8;
 assert.equal(w.audit(invalid).ok,false);
 assert.throws(()=>w.load(JSON.stringify(invalid)));
 console.log('P8C_ECHTE_DRAVOS_NADIR_EXPEDITION',JSON.stringify({
  hash:w.hash(s),day:90,silikonDravos:f['dravos-silizium'].gefoerdert,
  jaeger:s.kanon.jaeger.fertig,kaeufe:buys,
  echteReisen:p.reisen.map(x=>[x.von,x.nach,x.dauer,x.bezahlt]),
  flugloehne:p.bezahlt,haus:s.owners.house.cash,
  ersatz:s.kanon.ersatzkaeufe,weltgeld:33000,mint:0,burn:0}));
});
