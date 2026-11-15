// W6/P4 [ANALYSE]: NPC3 kauft einen echten Nadir-K2-Miner und liefert
// J2b-Silizium mit eigenen Eigentuemerbefehlen. Keine NPC-Autopolitik-Aenderung.
// Die Entscheidungen werden hier explizit durch NPC3/Station/Werft signiert.
// Kein Spielercash, keine Preis- oder Werftregel, kein zweiter Core.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
function sauber(w,s) {
  assert.deepEqual(W6.pruefen(w,s),[],'Geld-, Waren-, Eigentums- und Original-Core-Audit');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),33000);
}
function signiere(w,s,owner,befehl) {
  const hash=w.hash(s);
  const r=w.execute(s,{...befehl,owner});
  assert.equal(r.ok,true,JSON.stringify({owner,befehl,r,tick:s.tick,hash}));
  sauber(w,s);
  return r;
}
function bis(w,s,erreicht,maxMinuten,label) {
  for(let i=0;i<=maxMinuten;i++) {
    if(erreicht())return;
    if(i===maxMinuten)break;
    w.minute(s);
  }
  assert.fail(label+' nicht erreicht bis Tick '+s.tick);
}
test('W6/P4: NPC3 kauft, foerdert und verkauft Silizium mit ausschliesslich eigenem Kapital',()=>{
 const {welt:w,s}=W6.start(S02);
 const houseVor=s.owners.house.cash;
 const nadir=s.stations.st_nadir.lager, b=()=>s.kanon.minerWerft;
 // Der beobachtete S02-Kreislauf baut nur, wenn Werft und Waren real verfuegbar sind.
 bis(w,s,()=>(s.stations.st_aldera.lager.miner||0)===0&&!s.w4.auftrag&&!s.w5.auftrag
  &&!b()?.auftrag&&!b()?.wartetAuf&&!b()?.transport
  &&((nadir.material||0)>=5||(nadir.erz||0)>=10)
  &&s.owners.npc3.cash>=w.rules.economy.waren.miner.basis
  ,12000,'freie finanzierte Nadir-Werft fuer NPC3');
 if((nadir.material||0)<5) {
   signiere(w,s,'st_nadir',{type:'stationRefine',station:'st_nadir'});
   bis(w,s,()=>!s.w4.auftrag,90,'Original-Raffineriecharge');
 }
 signiere(w,s,'werft_extern',{type:'stationBuildMiner',station:'st_nadir',besteller:'npc3'});
 bis(w,s,()=>(nadir.miner||0)===1&&b().wartetAuf==='npc3',120,'K2-Miner fertig');
 // NPC3 kann waehrend der echten Werftminuten legitime Eis-Erloese erhalten.
 // Daher unmittelbar den Kauf kontieren, nicht zwei unterschiedliche Ticks.
 const kasseVor=s.owners.npc3.cash;
 const vorher=new Set(Object.keys(s.ships));
 signiere(w,s,'npc3',{type:'stationClaimMinerLocal',station:'st_nadir'});
 const id=Object.keys(s.ships).find(x=>!vorher.has(x));
 assert.ok(id);
 assert.equal(s.ships[id].owner,'npc3');
 assert.equal(s.ships[id].heimat,'nadir');
 assert.equal(s.owners.npc3.cash,kasseVor-600,'NPC-Minerkauf 600 ISK');
 assert.ok(b().lokaleKaeufe.some(x=>x.id===id&&x.owner==='npc3'));
 assert.equal(s.owners.house.cash,houseVor,'Spieler finanziert keinen NPC-Miner');
 sauber(w,s);

 const feld=w.siliziumFeld,C=w.rules.j2b;
 assert.equal(s.kanon.silizium.vorrat,16,'endlicher Siliziumvorrat ist keine Dauerquelle');
 const siliziumVor=nadir.silizium||0;
 const lohnVor=s.kanon.silizium.arbeitsMinuten;
 const kohleVor=s.owners.npc3.cash;
 signiere(w,s,'npc3',{type:'siliconMineStart',schiff:id});
 signiere(w,s,'npc3',{type:'shipUndock',schiff:id});
 w.minute(s);
 signiere(w,s,'npc3',{type:'shipFlyTo',schiff:id,x:feld.x,y:feld.y});
 bis(w,s,()=>s.kanon.silizium.auftrag?.gefoerdert===C.charge,500,'bezahltes Silizium am Originalfeld');
 signiere(w,s,'npc3',{type:'shipDock',schiff:id,station:'st_nadir'});
 bis(w,s,()=>s.ships[id].flug.lage==='angedockt',220,'Rueckkehr zur Nadir-Station');
 signiere(w,s,'npc3',{type:'siliconSell',schiff:id});

 assert.equal(s.kanon.silizium.verkauft,C.charge);
 assert.equal(nadir.silizium,siliziumVor+C.charge);
 assert.equal(s.kanon.silizium.vorrat,16-C.charge);
 assert.equal(s.ledger.silizium.mined,C.charge);
 assert.ok(s.kanon.silizium.arbeitsMinuten>lohnVor);
 assert.equal(s.kanon.silizium.belege.at(-1).owner,'npc3');
 assert.ok(s.owners.npc3.cash!==kohleVor,'Arbeit + Siliziumverkauf sind echte Geldfluesse');
 assert.equal(s.owners.house.cash,houseVor);
 sauber(w,s);
 const hash=w.hash(s);
 assert.equal(w.hash(w.load(w.save(s))),hash,'Replay-fester Nadir-Siliziumkauf');
 console.log('W6_P4_NPC_SILIZIUM',JSON.stringify({
  tick:s.tick,hash,miner:id,owner:s.ships[id].owner,
  vonNpc3RealGekauft:true,silizium:C.charge,restFeld:s.kanon.silizium.vorrat,
  weltgeld:33000,minted:s.minted,burned:s.burned,haus:s.owners.house.cash}));
});

test('W6/P4 negativ: fremder und nicht real gekaufter Siliziumminer bleibt gesperrt',()=>{
 const {welt:w,s}=W6.start(S02);
 const m=Object.values(s.ships).find(x=>x.owner==='npc3');
 assert.ok(m);
 for(const owner of ['house','transport','npc3']) {
  const hash=w.hash(s),r=w.execute(s,{type:'siliconMineStart',owner,schiff:m.id});
  assert.equal(r.ok,false,JSON.stringify(r));
  assert.equal(w.hash(s),hash,'ungedeckter Auftrag muss atomar scheitern');
 }
 sauber(w,s);
});
