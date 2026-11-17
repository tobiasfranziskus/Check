/* P3/W4/W5 – only audited facts from the ONE Rule204 world.
 * Genuine NPC-funded ore deliveries, refinery and shipyard, plus ONLY the
 * existing owner-authorized J8 purchase of a physically built Nadir hull.
 * No second scheduler, production, pricing, market or save schema.
 */
(function(scope){
'use strict';
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function auswerten(w,s,angebote){
 if(s?.rulesVersion!==204||s?.kanon?.npcAuto!==true||
   s?.kanon?.npcSilizium?.aktiv!==true)return Object.freeze({sichtbar:false});
 if(!w||w.regel!==204||!w.audit(s).ok||!Array.isArray(angebote))
   throw Error('W4/W5-Produktionsakte benötigt eine auditierte Original-S02-Welt');
 const r=w.rules,ore=s.w3,refinery=s.w4,yard=s.w5;
 const nadir=s.stations.st_nadir.lager,aldera=s.stations.st_aldera.lager;
 const buyer=angebote.find(a=>a.id==='buy-st_nadir-frachter');
 if(!buyer)throw Error('W4/W5: originales Nadir-Spielerangebot fehlt');
 const numbers=[ore.abgeschlossen,ore.geliefert,refinery.abgeschlossen,refinery.materialErzeugt,
   refinery.erzVerbraucht,yard.begonnen,yard.fertig,yard.materialVerbraucht,
   nadir.erz||0,nadir.material||0,nadir.frachter||0,aldera.erz||0];
 if(numbers.some(x=>!natural(x))||!natural(r.w3.fracht)||!natural(r.w4.erzJeCharge)
   ||!natural(r.w4.materialJeCharge)||!natural(r.w5.material))
   throw Error('W4/W5: Originalbestand oder Fertigungsrezept ist ungültig');
 const w3Paid=Object.entries(s.kanon.buch?.summen||{})
   .filter(([key])=>/^(erz|w3-|industrie|k7-)/.test(key)).map(([key,amount])=>({key,amount}));
 const signierteErzVertraege=ore.abgeschlossen;
 const auftrag=ore.auftrag?'Erzfracht wird wirklich transportiert':
   refinery.auftrag?'Nadir-Raffinerie arbeitet an einer finanzierten Charge':
   yard.auftrag?'Werft baut mit bezahltem Material eine neue Hülle':
   'Neue Aufträge hängen von Originalware, Firmenkapital, Lager und Kapazität ab';
 const stock=nadir.frachter||0,house=s.owners.house.cash;
 const stage=signierteErzVertraege===0?'W3 – Erztransport':
   refinery.abgeschlossen===0?'W4 – bezahlte Verarbeitung':
   yard.fertig===0?'W5 – Material zur Werft':'W3 → W4 → W5 nachgewiesen';
 return Object.freeze({sichtbar:true,stage,tick:s.tick,
  w3Vertraege:signierteErzVertraege,w3Geliefert:ore.geliefert,
  w3ProCharge:r.w3.fracht, w3Aktiv:!!ore.auftrag,
  w4Chargen:refinery.abgeschlossen,w4Material:refinery.materialErzeugt,
  w4ErzVerbraucht:refinery.erzVerbraucht,w4Aktiv:!!refinery.auftrag,
  w4RezeptErz:r.w4.erzJeCharge,w4RezeptMaterial:r.w4.materialJeCharge,
  w5Gebaut:yard.fertig,w5Begonnen:yard.begonnen,
  w5MaterialVerbraucht:yard.materialVerbraucht,w5MaterialJeSchiff:r.w5.material,
  w5Aktiv:!!yard.auftrag,erzNadir:nadir.erz||0,materialNadir:nadir.material||0,
  hullenNadir:stock,erzAldera:aldera.erz||0,
  nadirKasse:s.owners.st_nadir.cash,werftKasse:s.owners.werft_extern.cash,
  frachtKasse:s.owners.transport.cash,hausKasse:house,
  hausKaufpreis:r.economy.waren.frachter.basis,
  hausKaufbereit:buyer.ok===true,hausKaufgrund:buyer.reason||null,
  hausKaufId:'buy-st_nadir-frachter',produktionslage:auftrag,
  transportLohnGedeckt:s.owners.transport.cash>=0,
  ledger:Object.freeze({erzMined:s.ledger.erz.mined,materialProduced:s.ledger.material.produced,
    materialConsumed:s.ledger.material.consumed,freighterProduced:s.ledger.frachter.produced}),
  kaufberechtigt:stock>0&&house>=r.economy.waren.frachter.basis&&buyer.ok===true});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Industrie=api;
})(globalThis);
