/* P3: read-only bridge to ORIGINAL paid householdBuy and finite water inventory.
 * No new prices, production, subsidies, buyer cash or persistent state.
 */
(function(scope){
'use strict';
function auswerten(w,s,angebote,daten){
 if(s?.rulesVersion===207)return Object.freeze({sichtbar:false});
 if(!s||![204,208].includes(s.rulesVersion)||!w||w.regel!==s.rulesVersion||!w.audit(s).ok
   ||!Array.isArray(angebote)||!daten?.wasser)
   throw Error('P3-Wasserkreislauf benötigt den auditierten Regel204-Originalkern');
 const frachten=(s.kanon.spielerFrachten?.auftraege||[])
   .filter(x=>x.end!==null&&x.geliefert!==null).length;
 const preis=daten.wasser.preisAldera,regeln=w.rules.w5n;
 if(!Number.isSafeInteger(preis)||preis<=0||!regeln)
   throw Error('P3-Wasser: ursprüngliche Originaltarife fehlen');
 const eisKosten=regeln.charge*regeln.eisPreis;
 const kasse=s.owners.st_aldera.cash,lohn=s.owners.pilot_house.cash;
 const wasser=s.stations.st_aldera.lager.wasser||0;
 const fehlbetrag=Math.max(0,eisKosten-kasse);
 const zielMenge=Math.ceil(fehlbetrag/preis),zielKosten=zielMenge*preis;
 const quote=angebote.find(x=>x.id==='water-pilot-house-bedarf');
 const klein=angebote.find(x=>x.id==='water-pilot-house-1');
 const zielBereit=fehlbetrag>0&&!!quote?.ok;
 const kleinBereit=!!klein?.ok;
 const grund=fehlbetrag===0
   ?'Die nächste Eischarge ist derzeit aus der Käuferkasse finanzierbar.'
   :zielBereit?'Ein freiwilliger Wasserkauf würde Alderas nächste Eischarge finanzierbar machen. Keine künftige Abnahmegarantie.'
   :quote?.reason||'Wasser, persönlicher Lohn oder Originalangebot fehlen.';
 return Object.freeze({sichtbar:frachten>=2,frachten,preis,wasser,lohn,
   kaeuferKasse:kasse,eisKosten,fehlbetrag,zielMenge,zielKosten,zielBereit,kleinBereit,
   zielAktion:'water-pilot-house-bedarf',kleinAktion:'water-pilot-house-1',
   kleinGrund:klein?.reason||null,grund});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3WasserLohn=api;
})(globalThis);
