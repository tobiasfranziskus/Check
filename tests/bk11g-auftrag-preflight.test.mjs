// [ANALYSE] B-K11g: Marktpreise aus Original-Core, test-only claims und echte Grenzen.
// Niemals als neuer produktiver Auftrag oder bezahlten Endkonsum ausgeben.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,coreApi,quote,claims,dryMaterialClaims,dryOutputClaims} from '../tools/bk11g-auftrag-preflight.mjs';
import {independentlyAudit} from '../tools/b5b-common.mjs';

test('B-K11g: Originalgebuehren, Preisbasis und Eigentuemerkassen statt Schattenwirtschaft',()=>{
 for(const seed of [42,7]){
   const world=createWorld(seed),{core,rules}=coreApi,hash=core.hash(world);
   const q=quote(world,8);
   assert.equal(q.tick,0);assert.equal(q.qty,8);
   assert.equal(q.source,'st_nadir');assert.equal(q.destination,'st_aldera');
   assert.equal(q.requiredIce,16);
   assert.equal(q.prices.ice,core.preis(world,'st_nadir','eis',rules));
   assert.equal(q.prices.sourceFood,core.preis(world,'st_nadir','nahrung',rules));
   assert.equal(q.prices.destinationFood,core.preis(world,'st_aldera','nahrung',rules));
   assert.equal(q.costs.sourceFee,core.gebuehr(world,rules,'st_nadir',8*q.prices.sourceFood));
   assert.equal(q.costs.buyerFee,core.gebuehr(world,rules,'st_aldera',8*q.prices.destinationFood));
   assert.equal(q.costs.wageShadow,8*6*4);
   assert.equal(q.costs.sourceIceReplacement,16*q.prices.ice);
   assert.equal(q.requiredCash.st_nadir,q.costs.sourceIceReplacement+q.costs.wageShadow);
   assert.equal(q.requiredCash.st_aldera,q.costs.buyerPurchase);
   assert.equal(q.requiredCash.house,q.costs.sourceSale+q.costs.sourceFee+
     q.costs.buyerFee+q.costs.flightUpper+q.costs.hullUpper);
   assert.equal(q.sourceGrossMargin,q.costs.sourceSale-q.requiredCash.st_nadir);
   assert.equal(q.traderGrossMargin,q.costs.buyerPurchase-q.costs.sourceSale-
     q.costs.sourceFee-q.costs.buyerFee-q.costs.flightUpper);
   assert.equal(q.readyForRealCore,false);
   assert(q.missingProofs.some(x=>x.includes('Endverbrauch')));
   assert(q.missingProofs.some(x=>x.includes('Anschaffungseinstand')));
   assert.equal(core.hash(world),hash,'read-only Originalquote darf nicht eingreifen');
   independentlyAudit(world);assert(core.audit(world).ok);
 }
});
function firstRealOffer(){
 // Seed7 ist in der echten passiven Produktwelt nach 1 Tag ausreichend lagerfaehig;
 // Startzustand Seed42 ist es nicht (wichtiges NEGATIVES Originaltestergebnis).
 const world=createWorld(7);
 for(let t=0;t<1440;t++) coreApi.core.step(world,coreApi.rules);
 independentlyAudit(world);assert(coreApi.core.audit(world).ok);
 const offer=quote(world,8);
 assert.equal(offer.status,'nurHypothetischVorfinanzierbar',JSON.stringify(offer));
 return world;
}
test('B-K11g: echte Seed7-Angebots-Kasse, Doppelreservierung und atomarer Storno',()=>{
 const world=firstRealOffer(),{core}=coreApi,hash=core.hash(world);
 const book=claims(world),a=book.reserve({qty:8,trader:'house'});
 assert(a.ok,JSON.stringify(a));
 assert(a.id.startsWith('analyse-'));
 assert.equal(book.inspect().orders.length,1);
 assert.equal(book.inspect().material.reserved,16);
 assert.equal(book.inspect().money.reserved.house,quote(world,8).requiredCash.house);
 const second=book.reserve({qty:8,trader:'house'});
 assert(!second.ok,'dasselbe Geld darf nicht nochmals verwendet werden');
 assert(second.missingCash.some(x=>x.owner==='house'));
 assert.equal(book.inspect().material.reserved,16,'gescheiterter Auftrag reserviert keine Teilware');
 const before=book.inspect();
 assert.throws(()=>book.unsafeSettle({type:'leistung:beliebig'}),/kein Core-Leistungsbeleg/i);
 assert.deepEqual(book.inspect(),before,'ein frei eingegebener Beleg zahlt niemals Geld');
 assert(book.cancel(a.id));assert.equal(book.cancel(a.id),false);
 assert.equal(book.inspect().material.reserved,0);
 const a2=book.reserve({qty:8,trader:'house'});
 assert(a2.ok,'Storno gibt Original-Geld und Material frei');
 assert.notEqual(a2.id,a.id,'keine wiederverwendete Vertrags-ID');
 assert(book.cancel(a2.id));
 assert.equal(book.inspect().material.reserved,0);
 assert.equal(core.hash(world),hash,'read-only Shadowanspruch veraendert die echte Welt nie');
 independentlyAudit(world);
});
test('B-K11g: echte Source-/Zielkapazitaet nicht mehrfach durch konkurrierende Auftraege belegen',()=>{
 const world=firstRealOffer(),hash=coreApi.core.hash(world);
 const out=dryOutputClaims(world,[8,8,8]);
 assert(out.capacity>=8&&out.capacity<24,'bestehende 24er-Lagergrenze tatsaechlich');
 assert.equal(out.decisions[0].accepted,true);
 assert.equal(out.decisions[2].accepted,false,'beide Lager bei doppelter Belegung gesperrt');
 assert(out.held<=out.capacity);
 assert.equal(coreApi.core.hash(world),hash);
});
test('B-K11g: physischer Bestand wird selbst ohne Kassenrechnung nicht mehrfach zugesagt',()=>{
 const world=createWorld(42),before=coreApi.core.hash(world);
 const r=dryMaterialClaims(world,[48,48,16]);
 assert.equal(r.stock,world.stations.st_nadir.lager.eis);
 assert.deepEqual(r.decisions.map(x=>x.accepted),[true,true,false]);
 assert.equal(r.held,96);
 assert.equal(coreApi.core.hash(world),before);
});
test('B-K11g: auch nach reservierbarem Angebot macht ein Tick das Angebot ungueltig',()=>{
 const world=firstRealOffer(),before=quote(world,8),book=claims(world);
 assert(book.reserve({qty:8}).ok);
 coreApi.core.step(world,coreApi.rules);
 const after=quote(world,8);
 assert.notEqual(after.hash,before.hash);
 assert.notEqual(after.tick,before.tick);
 assert.throws(()=>book.inspect(),/Originalzustand/);
 independentlyAudit(world);
});
test('B-K11g: reine Angebote reproduzierbar nach Original Save/Load ohne Regression',()=>{
 for(const seed of [7,42]){
   const world=createWorld(seed),original=coreApi.core.hash(world);
   const copy=coreApi.core.load(coreApi.core.save(world),undefined,coreApi.rules);
   assert.equal(coreApi.core.hash(copy),original);
   assert.deepEqual(quote(copy,8),quote(world,8));
   assert.deepEqual(quote(copy,24),quote(world,24));
 }
});
