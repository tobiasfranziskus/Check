// Regel204-Paarlauf mit identischer Firmenpolitik. Auswertung verändert keinen Weltzustand.
'use strict';
const assert=require('node:assert/strict');
const W=require('../prototypes/welt/welt-kern.js');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');

function zivilzustand(s){
 const z=structuredClone(s);
 const konten=['piraten','pilot_piraten','k1_flug_pir001'];
 const lohn=z.owners.pilot_piraten.cash;
 z.initialSupply-=konten.reduce((geld,id)=>geld+(z.owners[id]?.cash||0),0);
 for(const id of konten){delete z.owners[id];delete z.kanon.netto[id];}
 for(const key of Object.keys(z.kanon.buch.summen)){
  if(key.split('|').slice(1).some(id=>konten.includes(id)))delete z.kanon.buch.summen[key];
 }
 delete z.ships.pir001;
 delete z.stats.verkaeufe.pir001;
 delete z.kanon.flugdienst.pir001;
 delete z.kanon.verschleiss.pir001;
 delete z.kanon.piraten;
 z.kanon.fluglohnMinuten-=lohn;
 // Die globale laufende Beleganzahl zählt auch legitime Piratenbuchungen.
 delete z.kanon.buch.belege;
 return z;
}
function vergleich(szenario,tage){
 const normal=W.erstellenJ4c({carrierCash:2000,buyerCash:4000}), pir=W.erstellenPiraten();
 const a=normal.createState(42), b=pir.createState(42);
 for(const [welt,s] of [[normal,a],[pir,b]]){
  welt.politikSetzen(s,szenario.politik);
  welt.npcAutoSetzen(s,true);
  welt.npcSiliziumSetzen(s,true);
 }
 for(const tick of [...new Set([0,1440,...Array.from({length:Math.floor(tage/30)},(_,i)=>(i+1)*43200),tage*1440])]){
  normal.advance(a,tick-a.tick);pir.advance(b,tick-b.tick);
  const kontrolle=structuredClone(a);delete kontrolle.kanon.buch.belege;
  assert.equal(normal.hash(kontrolle),pir.hash(zivilzustand(b)),`${szenario.id} Tick ${tick} Zivilzustand inkl. RNG`);
  assert.deepEqual(pruefen(normal,a),[]);
  assert.deepEqual(pir.audit(b).fehler,[]);
 }
 assert.equal(pir.hash(pir.load(pir.save(b))),pir.hash(b));
 return {id:szenario.id,tage,kontrolle:normal.hash(a),pir:pir.hash(b),weltgeld:b.initialSupply,
  eis:b.w5n.frachtAbgeschlossen,erz:b.w3.abgeschlossen,pilotlohn:b.owners.pilot_piraten.cash};
}
module.exports={zivilzustand,vergleich};
if(require.main===module){
 const wahl=process.argv[2]||'alle',tage=Number(process.argv[3]||90);
 const szenarien=SZENARIEN.filter(sz=>wahl==='alle'||sz.id===wahl);
 if(!szenarien.length||!Number.isSafeInteger(tage)||tage<1||tage>730)throw Error('Erwartet [S01..S13|alle] [1..730]');
 for(const sz of szenarien)console.log(JSON.stringify(vergleich(sz,tage)));
}
