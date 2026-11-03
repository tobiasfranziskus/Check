// B-K11f [ANALYSE]: atomare Vorfinanzierungs- und Geld-/Warenaudits auf
// HISTORISCHEN B-K10k-Belegen. Nicht als neue real ausgefuehrte Core-Lieferung ausgeben.
import test from 'node:test';
import assert from 'node:assert/strict';
import {invoice,order,preflight,repairRange,source} from '../tools/bk11f-vertragsbilanz.mjs';

const sum=x=>Object.values(x).reduce((n,v)=>n+v,0);
test('B-K11f: B-K10k-Originalbelege 8/16/24, keine ISK oder Fracht erfunden',()=>{
 const expected=[
  {q:8,source:-344,miner:312,trader:-291,group:-323},
  {q:16,source:-688,miner:624,trader:-83,group:-147},
  {q:24,source:-1032,miner:936,trader:125,group:29}
 ];
 for(const e of expected){
  const v=invoice(e.q),r=order({q:e.q});
  assert(r.ok);assert.equal(r.outcome,'delivered');
  assert.deepEqual([r.delta.source,r.delta.miner,r.delta.trader,r.groupBusiness],
   [e.source,e.miner,e.trader,e.group],'Unabhaengige bereits belegte B-K10k-Deckungsbeitraege');
  assert.equal(r.goods.iceUsed,2*e.q);
  assert.equal(r.goods.foodProduced,e.q);assert.equal(r.goods.foodConsumed,e.q);
  assert.equal(r.goods.foodDestroyed,0);assert.equal(r.goods.minerIce,0);
  assert.equal(r.escrowRemaining,0,'unverdientes Escrow nicht gebunden');
  assert.equal(sum(r.initial),sum(r.final),'jeder ISK nur transferiert');
  assert.equal(sum(r.delta),0,'inklusive Empfaenger Fonds, Arbeit, Endkunde');
  for(const step of r.cashSnapshots){
    assert.equal(sum(step.wallets)+sum(step.escrow),r.supply,
      'Geld zu JEDEM Arbeitsschritt erhalten: '+step.step);
    assert(Object.values(step.wallets).every(x=>x>=0),'nie negativer Geldbestand');
    assert(Object.values(step.escrow).every(x=>x>=0));
  }
  assert.equal(v.iceISK,44*e.q);assert.equal(v.wageISK,24*e.q);
  assert.equal(v.customerISK,54*e.q);
  assert.equal(v.freightISK,499);
  assert.equal(v.feesISK,3*e.q);
  assert.equal(v.hullReserveISK,780);
 }
 assert(source.proofType.includes('KEIN neuer Produktkernlauf'));
});
test('B-K11f: vor Start ALLE Mittel gleichzeitig reserviert; keine kreditfinanzierte Fahrt',()=>{
 const v=invoice(24),ok=preflight(24);
 assert(ok.gate.ok);
 const expected={source:1632,miner:120,trader:1951,buyer:1296};
 for(const [payer,total] of Object.entries(expected)){
   const reserved=Object.entries(ok.escrow)
     .filter(([key])=>({
       source:['ice','wage'],miner:['minerWork'],
       trader:['wholesale','flights','fees','hull'],buyer:['buyer']
     })[payer].includes(key))
     .reduce((n,[,value])=>n+value,0);
   assert.equal(reserved,total,payer+' Vorfinanzierung');
 }
 assert.equal(v.wholesaleISK,600);
 assert.equal(v.iceISK+v.wageISK,1632);
 assert.equal(ok.wallets.trader,49,'Fahrt+Ware+Gebuehr+Huellensicherheit beim Abflug bezahlt');
 for(const [owner,cap] of [['buyer',0],['trader',1950],['source',1631],['miner',119]]){
  const w={source:4000,miner:2000,trader:2000,buyer:1296,worker:0,funds:0,shipyard:0};
  w[owner]=cap;
  const fail=preflight(24,w);
  assert.equal(fail.gate.ok,false,'nie Kredit bei insolventem '+owner);
  assert(fail.gate.missing.some(x=>x.owner===owner));
  assert.deepEqual(fail.wallets,w,'atomare Ablehnung ohne Teilabbuchung');
  assert.equal(Object.keys(fail.escrow).length,0,'kein Escrow geoeffnet');
  assert.equal(fail.journal.length,0,'kein Zahlungsbeleg ohne gesichertes Budget');
 }
});
test('B-K11f: Erfolgreiche erste Lieferung finanziert ohne Einkommen von aussen KEINEN zweiten Haushaltkauf',()=>{
 const done=order({q:24});
 assert(done.ok);
 assert.equal(done.final.buyer,0);
 assert.equal(done.final.source,2968);
 assert.equal(done.final.trader,2125);
 assert.equal(done.final.miner,2936);
 const second=order({q:24,wallets:done.final});
 assert.equal(second.ok,false);
 assert(second.missing.some(x=>x.owner==='buyer'&&x.have===0&&x.need===1296));
 assert.deepEqual(second.wallets,done.final,'verweigerter Folgeauftrag aendert kein Geld');
 assert.equal(sum(done.final),sum(done.initial));
});
test('B-K11f: Verlust nach echter Arbeit gibt unverdiente Bestell-ISK zurueck, nicht Flug- und Lohnkosten',()=>{
 const lost=order({q:24,outcome:'lost'});
 assert(lost.ok);assert.equal(lost.goods.foodConsumed,0);
 assert.equal(lost.goods.foodDestroyed,24);
 assert.equal(lost.goods.iceUsed,48);
 assert.equal(lost.delta.buyer,0,'Endkunde zahlt nicht fuer verloren gegangene Ladung');
 assert.equal(lost.delta.shipyard,780,'nur Reservesaettigung eines Preises, KEINE Huelle erzeugt');
 assert.equal(lost.delta.trader, -(600+499+72+780));
 assert.equal(lost.delta.worker,576,'geleistete Fabrikarbeit bleibt bezahlt');
 assert.equal(lost.delta.miner,936,'geleistete Minerarbeit und Rohstoffverkauf bleiben bezahlt');
 assert.equal(lost.escrowRemaining,0);
 assert.equal(sum(lost.delta),0);
 const replay=order({q:24,outcome:'lost'});
 assert.deepEqual(lost,replay,'deterministischer Buchungs-Replay');
});
test('B-K11f: Quelle und Auftragnehmer sind beim Originalpreis unterschiedlich rentabel',()=>{
 const x=repairRange(24);
 assert.equal(x.minIceISK,120,'bezahlte Minerarbeit');
 assert.equal(x.sourceCostWithMinerAtCost,696);
 assert.equal(x.merchantMaxWholesaleISK,725);
 assert.equal(x.totalRedistributableBusinessMargin,29);
 assert.equal(x.historicalIceISK,1056);
 assert.equal(x.sourceMinWholesaleAtHistoricalIceISK,1632);
 assert.equal(x.fixedFeeCustomerMinWithHistoricalIceISK,2203);
 assert.equal(x.additionalCustomerISKLowerBoundAtFixedFees,907,
   'Mindestens 907 ISK MEHR Kundenumsatz bei unveraendert hohen Eis-Preisen / fixen Gebuehren');
 assert(x.note.includes('nicht Original-Core-Preise'));
 const proof=order({q:24});
 assert.equal(proof.groupBusiness,29);
 assert(proof.groupBusiness<780,'ein Ersatz-Frachter kostenpflichtig und nicht durch einen 29-ISK-Beitrag bezahlt');
 assert.equal(Math.ceil(780/proof.groupBusiness),27,'mindestens 27 solche Beitraege fuer eine Huelle');
});
