/* P3/W4/W5 – only audited facts from the ONE Rule204 world.
 * Genuine NPC-funded ore deliveries, refinery and shipyard, plus ONLY the
 * existing owner-authorized J8 purchase of a physically built Nadir hull.
 * No second scheduler, production, pricing, market or save schema.
 */
(function(scope){
'use strict';
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function auswerten(w,s,angebote,auswahlId=null){
 if(![204,208].includes(s?.rulesVersion)||(!w?.hausErzProfil&&(s?.kanon?.npcAuto!==true||
   s?.kanon?.npcSilizium?.aktiv!==true)))return Object.freeze({sichtbar:false});
 if(!w||w.regel!==s.rulesVersion||!w.audit(s).ok||!Array.isArray(angebote))
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
 const signierteErzVertraege=ore.abgeschlossen;
 const auftrag=ore.auftrag?'Erzfracht wird wirklich transportiert':
   refinery.auftrag?'Nadir-Raffinerie arbeitet an einer finanzierten Charge':
   yard.auftrag?'Werft baut mit bezahltem Material eine neue Hülle':
   'Neue Aufträge hängen von Originalware, Firmenkapital, Lager und Kapazität ab';
 const stock=nadir.frachter||0,house=s.owners.house.cash;
 // Only *physically produced* W5 hulls lawfully owned by the player qualify.
 const w5Ids=new Set(yard.schiffIds||[]);
 const eigeneWerftFrachter=Object.values(s.ships).filter(sh=>
   sh.owner==='house'&&sh.klasse==='frachter'&&w5Ids.has(sh.id))
   .sort((a,b)=>a.id.localeCompare(b.id));
 // User-only ephemeral UI selection. On old saves and missing choices prefer an
 // already docked Aldera carrier, not the newest untransferred Nadir hull.
 const auswahl=eigeneWerftFrachter.find(sh=>sh.id===auswahlId)
   ||eigeneWerftFrachter.find(sh=>sh.system==='aldera'&&sh.phase==='dock')
   ||eigeneWerftFrachter[0]||null;
 const eigenesWerftSchiff=auswahl?.id||null;
 const gekauft=eigenesWerftSchiff?s.ships[eigenesWerftSchiff]:null;
 const werftFrachter=Object.freeze(eigeneWerftFrachter.map(sh=>Object.freeze({
   id:sh.id,ort:sh.system,phase:sh.phase,
   buchwert:w.buchwert(s,sh.id)
 })));
 const transferId=eigenesWerftSchiff?'reposition-'+eigenesWerftSchiff:null;
 const transferAngebot=transferId?angebote.find(a=>a.id===transferId):null;
 const transferAktiv=!!(eigenesWerftSchiff&&s.w5ac?.active?.id===eigenesWerftSchiff);
 // Only observed, current original orders: no artificial reservation or predicted slot.
 const streckenAuftraege=Object.freeze([
   ore.auftrag?'W3-Erzfracht':null,
   s.w5n?.frachtauftrag?'W5n-Eisfracht':null,
   s.w5ac?.active?'W5ac-Überführung':null
 ].filter(Boolean));
 // Exactly the already-audited K1/F4 player contracts of THIS purchased W5 hull.
 // Company cash includes mining, purchases and NPC activity: never call it freight profit.
 const belege=(s.kanon.spielerFrachten?.auftraege||[]).filter(a=>
   a.schiff===eigenesWerftSchiff&&a.end!==null&&a.geliefert!==null);
 const frachtTarife=belege.reduce((n,a)=>n+a.fracht,0);
 const frachtLoehne=belege.reduce((n,a)=>n+a.arbeit,0);
 const frachtId=eigenesWerftSchiff?'freight-'+eigenesWerftSchiff:null;
 const frachtAngebot=frachtId?angebote.find(a=>a.id===frachtId):null;
 const frachtBuchwert=gekauft?w.buchwert(s,gekauft.id):null;
 if(!natural(frachtTarife)||!natural(frachtLoehne)||!natural(frachtBuchwert??0)
   ||frachtTarife<frachtLoehne)
   throw Error('P3 Werftfrachter: Original-Frachtbuch oder Schiffsbuchwert ungueltig');
 // M3: account balances are CURRENT reserves; paid sums are HISTORICAL counters.
 // These are original Rule204 fields, not player receivables or invented ledger entries.
 const k7=s.kanon.industrieErz||{},balance=id=>s.owners[id]?.cash??0;
 const buchungen=Object.freeze({
  k7Phase:k7.phase||'frei',
  auftraggeber:r.w3.kunde,
  minerEigentuemer:k7.miner?(s.ships[k7.miner]?.owner||null):null,
  frachterEigentuemer:k7.frachter?(s.ships[k7.frachter]?.owner||null):null,
  raffinerieEigentuemer:r.w4.station,werftEigentuemer:r.w5.werft,
  signaturen:Object.freeze({
   bergbau:k7.signMiner===true,spediteur:k7.signFracht===true,werft:k7.signWerft===true,
   ...(w.hausErzProfil?{aldera:k7.signaturen?.st_aldera===k7.kennung&&!!k7.kennung}:{})
  }),
  w3:Object.freeze({
   kaufReserve:balance('w3_kauf_treuhand'),arbeitsReserve:balance('w3_arbeit_treuhand'),
   erzKaufGebucht:ore.kaufAusgaben??0,fluglohnBezahlt:ore.arbeitsKosten??0,
   frachttarifAusgezahlt:ore.frachtUmsatz??0,phase:ore.auftrag?.phase||null
  }),
  w4:Object.freeze({
   arbeitsReserve:balance('w4_arbeit_treuhand'),arbeitsGebucht:refinery.gebucht??0,
   arbeitsBezahlt:refinery.gezahlt??0,auftragAktiv:!!refinery.auftrag
  }),
  w5:Object.freeze({
   k7WerftReserve:balance('k7_werft_treuhand'),
   materialBezahlt:yard.materialUmsatz??0,
   arbeitsReserve:balance('w5_arbeit_treuhand'),
   arbeitsGebunden:yard.arbeitsGebunden??0,
   arbeitsBezahlt:yard.arbeitsGezahlt??0,auftragAktiv:!!yard.auftrag
  })
 });
 const buchZahlen=[buchungen.w3.kaufReserve,buchungen.w3.arbeitsReserve,
  buchungen.w3.erzKaufGebucht,buchungen.w3.fluglohnBezahlt,
  buchungen.w3.frachttarifAusgezahlt,buchungen.w4.arbeitsReserve,
  buchungen.w4.arbeitsGebucht,buchungen.w4.arbeitsBezahlt,
  buchungen.w5.k7WerftReserve,buchungen.w5.materialBezahlt,
  buchungen.w5.arbeitsReserve,buchungen.w5.arbeitsGebunden,buchungen.w5.arbeitsBezahlt];
 if(buchZahlen.some(x=>!natural(x)))
  throw Error('M3 Industrie: Original-Treuhand oder Zahlungszaehler ungueltig');
 const stage=signierteErzVertraege===0?'W3 – Erztransport':
   refinery.abgeschlossen===0?'W4 – bezahlte Verarbeitung':
   yard.fertig===0?'W5 – Material zur Werft':'W3 → W4 → W5 nachgewiesen';
 return Object.freeze({sichtbar:true,stage,tick:s.tick,buchungen,
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
  werftSpielerSchiffId:eigenesWerftSchiff,
  werftFrachter,werftSpielerAnzahl:eigeneWerftFrachter.length,
  werftSpielerOrt:gekauft?.system||null,
  werftTransferId:transferId,
  werftTransferAktiv:transferAktiv,
  werftStreckeBelegt:streckenAuftraege.length>0,
  werftStreckenAuftraege:streckenAuftraege,
  werftTransferBereit:gekauft?.system==='nadir'&&transferAngebot?.ok===true,
  werftTransferGrund:transferAngebot?.reason||null,
  werftTransferKosten:transferAngebot?.ok?transferAngebot.kosten:null,
  werftTransferMinuten:transferAngebot?.ok?transferAngebot.minuten:null,
  werftFrachtId:frachtId,werftFrachtRunden:belege.length,
  werftFrachtTarife:frachtTarife,werftFrachtLoehne:frachtLoehne,
  werftFrachtBeitragVorWertverzehr:frachtTarife-frachtLoehne,
  werftFrachtBuchwert:frachtBuchwert,
  werftFrachtBereit:gekauft?.system==='aldera'&&frachtAngebot?.ok===true,
  werftFrachtGrund:frachtAngebot?.reason||null,
  werftFrachtAktiv:!!(eigenesWerftSchiff
    &&s.kanon.spielerFrachten?.auftraege?.some(a=>a.schiff===eigenesWerftSchiff&&a.end===null)),
  ledger:Object.freeze({erzMined:s.ledger.erz.mined,materialProduced:s.ledger.material.produced,
    materialConsumed:s.ledger.material.consumed,freighterProduced:s.ledger.frachter.produced}),
  kaufberechtigt:stock>0&&house>=r.economy.waren.frachter.basis&&buyer.ok===true});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Industrie=api;
})(globalThis);
