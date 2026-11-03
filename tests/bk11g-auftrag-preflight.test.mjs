// [ANALYSE] B-K11g: Marktpreise aus Original-Core, test-only claims und echte Grenzen.
// Niemals als neuer produktiver Auftrag oder bezahlten Endkonsum ausgeben.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,coreApi,quote,claims,dryMaterialClaims} from '../tools/bk11g-auftrag-preflight.mjs';
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
   assert(q.missingProofs.some(x=>x.includes('Anfangsbestand')));
   assert.equal(core.hash(world),hash,'read-only Originalquote darf nicht eingreifen');
   independentlyAudit(world);assert(core.audit(world).ok);
 }
});
test('B-K11g: atomare Geld-/Input-/Outputclaims, konkurrierende Auftraege und Storno',()=>{
 const world=createWorld(42),{core}=coreApi,hash=core.hash(world);
 const b=claims(world),a=b.reserve({qty:8,trader:'house'});
 assert(a.ok,JSON.stringify(a));
 assert(a.id.startsWith('analyse-'));assert.equal(b.inspect().orders.length,1);
 assert.equal(b.inspect().material.reserved,16);
 assert.equal(b.inspect().money.reserved.house,quote(world,8).requiredCash.house);
 const a2=b.reserve({qty:8,trader:'house'});
 assert(!a2.ok,'kein zweites Mal gleiche freie Spielerkasse nutzen');
 assert(a2.missingCash.some(x=>x.owner==='house'));
 assert.equal(b.inspect().material.reserved,16,'gescheiterter Antrag reserviert gar nichts');
 const b2=b.reserve({qty:8,trader:'npc1'});
 const c2=b.reserve({qty:8,trader:'npc2'});
 assert(b2.ok,JSON.stringify(b2));assert(c2.ok,JSON.stringify(c2));
 assert.equal(b.inspect().material.reserved,48);
 const d2=b.reserve({qty:8,trader:'house'});
 assert(!d2.ok);
 assert(d2.missingOutputCapacity,'kein gleichzeitiger Anspruch auf denselben knappen Fertigwarenplatz');
 const before=b.inspect();
 assert.throws(()=>b.unsafeSettle({type:'leistung:beliebig'}),/kein Core-Leistungsbeleg/i);
 assert.deepEqual(b.inspect(),before,'Textbeleg kann niemals Geld freigeben');
 assert(b.cancel(a.id));assert.equal(b.cancel(a.id),false,'Storno idempotent');
 assert.equal(b.inspect().material.reserved,32);
 const a3=b.reserve({qty:8,trader:'house'});
 assert(a3.ok,'frei gewordene Claims wieder nutzbar');
 assert(b.cancel(a3.id));assert(b.cancel(b2.id));assert(b.cancel(c2.id));
 assert.equal(b.inspect().material.reserved,0);
 assert.equal(b.inspect().outputCapacity.sourceFree,
   core.obergrenze(world,coreApi.rules,'st_nadir','nahrung')-
     world.stations.st_nadir.lager.nahrung);
 assert.equal(core.hash(world),hash,'test-only Reservation darf das Spiel nicht mutieren');
 independentlyAudit(world);
});
test('B-K11g: physischer Bestand wird selbst ohne Kassenrechnung nicht mehrfach zugesagt',()=>{
 const world=createWorld(42),before=coreApi.core.hash(world);
 const r=dryMaterialClaims(world,[48,48,16]);
 assert.equal(r.stock,world.stations.st_nadir.lager.eis);
 assert.deepEqual(r.decisions.map(x=>x.accepted),[true,true,false]);
 assert.equal(r.held,96);
 assert.equal(coreApi.core.hash(world),before);
});
test('B-K11g: jeder Tick macht das reine Angebot erneut pruefpflichtig',()=>{
 const world=createWorld(42),a=quote(world,8),book=claims(world);
 assert(book.reserve({qty:8}).ok);
 coreApi.core.step(world,coreApi.rules);
 const b=quote(world,8);
 assert.notEqual(b.hash,a.hash);
 assert.notEqual(b.tick,a.tick);
 assert.throws(()=>book.inspect(),/unveraenderten Tick|Originalzustand/);
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
