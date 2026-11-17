/* P3/W6: independent NPC fleet procurement is already in the original Rule204 core.
 * This adapter only observes signed assets, production, purchase quotes and transfers.
 * There is deliberately NO way for the player to spend NPC money or order an NPC hull.
 */
(function(scope){
'use strict';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function auswerten(w,s){
 if(s?.rulesVersion===207||s?.rulesVersion!==204||s?.kanon?.npcAuto!==true
   ||s?.kanon?.npcSilizium?.aktiv!==true)return Object.freeze({sichtbar:false});
 if(!w||w.regel!==204||!w.audit(s).ok)throw Error('W6-Frachterakte: Originalwelt nicht validiert');
 const carrier=s.owners.transport,shipyard=s.owners.werft_extern;
 if(!carrier||!shipyard)throw Error('W6-Frachterakte: Firmenkonten fehlen');
 const r=w.rules,price=r.economy.waren.frachter.basis;
 const ferryCost=r.w5n.flugMinuten*r.w5Transfer.lohnJeMinute;
 if(!integer(price)||!integer(ferryCost)||price<=0)throw Error('W6-Frachterakte: Originaltarife fehlen');
 const ships=Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 const active=ships.filter(sh=>w.buchwert(s,sh.id)>0);
 const usable=active.filter(sh=>sh.system==='aldera'&&sh.phase==='dock'
   &&sh.auftrag==='halten'&&sh.flug?.lage==='angedockt'
   &&Object.values(sh.ladung||{}).every(q=>q===0));
 const transfers=(s.w5ac?.completed||[]).filter(e=>ships.some(sh=>sh.id===e.id));
 const nadirStock=s.stations.st_nadir.lager.frachter||0;
 const alderaStock=s.stations.st_aldera.lager.frachter||0;
 const station=nadirStock>0?'st_nadir':'st_aldera';
 const copy=w.load(w.save(s)),offer=w.execute(copy,{type:'shipBuy',owner:'transport',klasse:'frachter',station});
 const purchased=ships.filter(sh=>(s.w5?.schiffIds||[]).includes(sh.id)).length;
 const totalReplacements=s.kanon.ersatzkaeufe||0;
 if(!integer(nadirStock)||!integer(alderaStock)||!integer(totalReplacements))
   throw Error('W6-Frachterakte: invalides Inventar');
 return Object.freeze({sichtbar:true,regel:s.rulesVersion,zeit:s.tick,automatik:true,
  transportGeld:carrier.cash,werftGeld:shipyard.cash,preis:price,
  ferryCost,gesamt:price+ferryCost,nadirStock,alderaStock,
  nadirMaterial:s.stations.st_nadir.lager.material||0,
  nadirErz:s.stations.st_nadir.lager.erz||0,
  gesamtFlotte:ships.length,fahrbereit:active.length,freiAldera:usable.length,
  werftherkunft:purchased,werftGebaut:s.w5.fertig,werftBelegt:s.w5.begonnen,
  materialVerbraucht:s.w5.materialVerbraucht,
  frachterGeliefert:s.ledger.frachter.consumed,
  frachterGebaut:s.ledger.frachter.produced,
  ueberfuehrt:transfers.length,ersatzInsgesamt:totalReplacements,
  angebot:Object.freeze({ok:offer.ok,grund:offer.reason||null,station}),
  engpass:s.kanon.engpass?.erster?.grund||null});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3NPCWerft=api;
})(globalThis);
