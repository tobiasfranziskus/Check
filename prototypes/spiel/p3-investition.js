/* P3 – optionaler kapitalgedeckter Minerzukauf. Nur Originalstände/Angebote
 * lesen; sämtliche Käufe/Arbeiten erfolgen im unveränderten J8-Originalkern.
 */
(function(scope){
'use strict';
function auswerten(w,s,angebote){
 if(s?.rulesVersion===207)return Object.freeze({sichtbar:false});
 if(!s||![204,208].includes(s.rulesVersion)||!w||w.regel!==s.rulesVersion||typeof w.audit!=='function'||
    !w.audit(s).ok||typeof w.buchwert!=='function'||!Array.isArray(angebote))
  throw Error('P3-Investition: nur geprüfte Regel204-Karriere');
 const eigene=Object.values(s.ships).filter(sh=>sh.owner==='house')
  .sort((a,b)=>a.id.localeCompare(b.id));
 const miner=eigene.filter(sh=>sh.klasse==='miner'&&sh.system==='aldera');
 const eigeneFrachter=new Set(eigene.filter(sh=>sh.klasse==='frachter').map(sh=>sh.id));
 const frachten=(s.kanon.spielerFrachten?.auftraege||[]).filter(a=>eigeneFrachter.has(a.schiff));
 const abgeschlossen=frachten.filter(a=>Number.isSafeInteger(a.end)&&
   Number.isSafeInteger(a.geliefert)).length;
 const unterwegs=frachten.some(a=>a.end===null);
 const preis=w.rules.economy.waren.miner.basis;
 const kasse=s.owners.house.cash;
 const buchwert=eigene.reduce((sum,sh)=>sum+w.buchwert(s,sh.id),0);
 const vermoegen=kasse+buchwert,referenz=3000,veraenderung=vermoegen-referenz;
 // 3000 ISK is the verified Rule204 default start, NOT a balancing constant.
 // Cash + depreciated ship book values exclude goods, work reserves and liabilities.
 const neuer=miner.length>1?miner[miner.length-1]:null;
 const beauftragt=!!(neuer&&s.kanon.pendel?.[neuer.id]?.ware==='eis');
 const art=neuer?(beauftragt?'wartet':'arbeiten'):'kaufen';
 const aktion=beauftragt?null:(neuer?'ice-'+neuer.id:'buy-st_aldera-miner');
 const quote=angebote.find(a=>a.id===aktion);
 const bereit=!!aktion&&!!quote?.ok&&!unterwegs;
 const grund=unterwegs?'Laufende Fracht vor einer weiteren Entscheidung abrechnen.'
  :aktion&&!bereit?(quote?.reason||'Kein finanziertes Originalangebot vorhanden'):null;
 const hinweis=neuer?(beauftragt
   ?'Der neue Miner besitzt einen Original-Pendelauftrag. Ob er fördert, hängt von Lagerpuffer und echten Käufermitteln ab.'
   :'Der neue Miner gehört dir. Sein Förderauftrag muss separat rechtmäßig vorfinanziert werden.')
  :veraenderung>=preis
    ?'Der Zuwachs aus Kasse und Restbuchwerten deckt den Preis rechnerisch. Keine garantierte Nachfrage oder Rendite.'
    :'Der bisherige Zuwachs deckt den Kaufpreis nicht vollständig. Sparen bleibt möglich; ein legaler Kauf aus vorhandenem Kapital bleibt deine Entscheidung.';
 return Object.freeze({sichtbar:abgeschlossen>=2,abgeschlossen,unterwegs,
  kasse,buchwert,vermoegen,referenz,veraenderung,preis,deckend:veraenderung>=preis,
  miner:miner.length,lagerMiner:s.stations.st_aldera.lager.miner||0,
  alderakasse:s.owners.st_aldera.cash,eis:s.stations.st_aldera.lager.eis||0,
  art,aktion,bereit,grund,hinweis});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Investition=api;
})(globalThis);
