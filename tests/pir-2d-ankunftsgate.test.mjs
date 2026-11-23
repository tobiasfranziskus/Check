import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

function kontakt(){
 const j=J8.erstellen(); j.startenPiraten(true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 assert(j.ausfuehren('buy-st_aldera-frachter').ok);
 assert(j.ausfuehren('buy-st_aldera-miner').ok);
 const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
 const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert(j.ausfuehren('ice-'+m).ok);
 w.advance(s,120); assert(j.ausfuehren('freight-'+f).ok);
 w.advance(s,56);
 assert.equal(s.ships[f].ankunft-s.tick,4);
 assert.equal(s.ships[f].ladung.eis,50);
 assert.equal(s.w5n.frachtauftrag.phase,'hin');
 assert.deepEqual(w.audit(s).fehler,[]);
 return {j,w,s,f};
}

// CURRENT boundary, not a future acceptance criterion. Remove/replace this
// baseline assertion only in the explicitly isolated new arrival profile.
test('PIR-2d baseline: an invented local body is rejected by both existing audits',()=>{
 const {j,w,s,f}=kontakt(),before=j.exportieren();
 for(const lage of ['frei','angedockt']){
  const c=structuredClone(s),sh=c.ships[f];
  sh.system='nadir';
  sh.flug=w.flugKern.koerperAngedockt('nadir');
  if(lage==='frei') Object.assign(sh.flug,{lage,x:96000,anker:null,kurs:128,sollKurs:128});
  const flug=w.flugKern.audit(c);
  assert.equal(flug.ok,false);
  assert.match(flug.grund,/Transit passt nicht/);
  const a=w.audit(c).fehler;
  assert(a.some(x=>x.includes('Transit passt nicht')));
  assert(a.some(x=>x.includes('K1-Spielerfracht/Vertragslohn')));
 }
 assert.equal(j.exportieren(),before);
 assert.deepEqual(w.audit(s).fehler,[]);
});

test('PIR-2d baseline: original delivery and return use the clock, not a Nadir dock receipt',()=>{
 const {w,s,f}=kontakt();
 const start=s.tick,receipt=s.kanon.spielerFrachten.auftraege.at(-1);
 const initialWork=s.owners.w5n_fracht_arbeit.cash;
 const initialBuy=s.owners.w5n_fracht_kauf.cash;
 const delivered=s.w5n.eisGeliefert, wages=s.kanon.spielerFrachten.lohn;
 const rows=[];
 for(let i=1;i<=4;i++){
  w.advance(s,1);
  assert.equal(s.owners.w5n_fracht_arbeit.cash,initialWork-i);
  assert.equal(s.kanon.spielerFrachten.lohn,wages+i);
  assert.equal(s.ships[f].owner,'house');
  assert.equal(s.ships[f].flug.lage,'transit');
  assert.deepEqual(w.audit(s).fehler,[]);
  assert.equal(w.save(w.load(w.save(s))),w.save(s));
  if(i<4){
   assert.equal(s.ships[f].ladung.eis,50);
   assert.equal(s.owners.w5n_fracht_kauf.cash,initialBuy);
   assert.equal(s.w5n.eisGeliefert,delivered);
   assert.equal(receipt.geliefert,null);
  }else{
   assert.equal(s.ships[f].ladung.eis,0);
   assert.equal(s.ships[f].system,'nadir');
   assert.equal(s.w5n.frachtauftrag.phase,'rueck');
   assert.equal(s.w5n.eisGeliefert,delivered+50);
   assert.equal(s.owners.w5n_fracht_kauf.cash,initialBuy-receipt.eis);
   assert.equal(receipt.geliefert,start+4);
   assert.equal(receipt.end,null);
  }
  rows.push({tick:s.tick,lage:s.ships[f].flug.lage,system:s.ships[f].system,
   phase:s.w5n.frachtauftrag.phase,work:s.owners.w5n_fracht_arbeit.cash,
   buy:s.owners.w5n_fracht_kauf.cash,ice:s.ships[f].ladung.eis});
 }
 w.advance(s,60);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.minted+s.burned,0);
 assert.deepEqual(w.audit(s).fehler,[]);
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
 console.log('PIR_2D_ARRIVAL_BASELINE '+JSON.stringify({rows,hash:w.hash(s)}));
});
