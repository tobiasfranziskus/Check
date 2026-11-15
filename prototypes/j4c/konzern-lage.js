/* Aphros Void J5 – ausschließlich lesende Konzernlage aus dem vorhandenen Regel204-Weltzustand.
 * Keine neue Simulation, keine Buchung, kein Schiff, keine Eigentumsfiktion.
 * Die Stationslager sind fremd- oder gemischtfinanzierte Bestände, NICHT house-Eigentum.
 */
(function (scope) {
'use strict';
const FIRMEN = Object.freeze(['house','npc3','transport','st_aldera','st_nadir','werft_extern']);
const zahl = n => Number.isSafeInteger(n) && n>=0 ? n : (()=>{throw Error('J5: ungültiger Geld-/Warenbestand');})();
function lagertext(lager) {
 return Object.entries(lager||{})
   .filter(([,menge])=>zahl(menge)>0)
   .sort(([a],[b])=>a.localeCompare(b,'de'))
   .map(([ware,menge])=>ware+': '+menge)
   .join(' · ') || 'leer';
}
function erzeugen(s,pilot) {
 if(s?.rulesVersion!==204||!s.owners||!s.ships||!s.stations||
    !Number.isSafeInteger(s.tick)||!Number.isSafeInteger(s.flug?.schritt)||
    !s.ships[pilot]||s.ships[pilot].owner!=='house'||
    !s.kanon?.jaeger?.kaeufe?.some(k=>k.id===pilot&&k.owner==='house'))
   throw Error('J5: Nur auditierter Regel204-Spielerjäger erlaubt');
 const konto=id=>zahl(s.owners[id]?.cash??0);
 const schiffe=Object.values(s.ships)
   .filter(sh=>sh.owner==='house')
   .map(sh=>Object.freeze({id:sh.id,klasse:sh.klasse,system:sh.system,
     lage:sh.flug?.lage||sh.phase||'unbekannt',ladung:lagertext(sh.ladung)}))
   .sort((a,b)=>a.id.localeCompare(b.id));
 const stationen=Object.values(s.stations)
   .map(st=>Object.freeze({id:st.id,system:st.system,lager:lagertext(st.lager)}))
   .sort((a,b)=>a.id.localeCompare(b.id));
 const betriebskassen=FIRMEN.filter(id=>s.owners[id])
   .map(id=>Object.freeze({id,cash:konto(id)}));
 const gesamt=Object.values(s.owners).reduce((sum,owner)=>sum+zahl(owner.cash),0);
 if(!Number.isSafeInteger(gesamt))throw Error('J5: Weltgeldsumme ungültig');
 const dienst=s.kanon.flugdienst?.[pilot];
 return Object.freeze({
   regel:s.rulesVersion,tick:s.tick,sekunde:s.flug.schritt,pilot,
   spielerkasse:konto('house'),pilotenkasse:konto('pilot_house'),
   eigentuemerhaushalt:konto('eigner_house'),
   fluglohnreserve:dienst?konto(dienst.konto):0,
   weltgeld:gesamt,schiffe:Object.freeze(schiffe),
   stationen:Object.freeze(stationen),betriebskassen:Object.freeze(betriebskassen)
 });
}
const API=Object.freeze({erzeugen});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J5KonzernLage=API;
})(typeof globalThis==='object'?globalThis:this);
