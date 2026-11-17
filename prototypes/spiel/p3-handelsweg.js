/* P3 – lesende, wiederholbare Handelsnavigation. Alle Transaktionen erfolgen
 * ausschließlich über die vorhandene J8-Session und die Original-Core-Angebote.
 * Kein eigener Geld- oder Warenticker, kein Save-Feld, kein garantierter Käufer.
 */
(function(scope){
'use strict';
function auswerten(s,angebote){
 if(!s||![204,207].includes(s.rulesVersion)||!s.kanon||!Array.isArray(angebote))
   throw Error('P3 benötigt den geprüften Regel204/207-Karrierestand mit Core-Angeboten');
 const schiffe=Object.values(s.ships||{}).filter(sh=>sh.owner==='house');
 const miner=schiffe.filter(sh=>sh.klasse==='miner'&&sh.system==='aldera');
 const frachter=schiffe.filter(sh=>sh.klasse==='frachter'&&sh.system==='aldera');
 const eigeneFrachter=new Set(schiffe.filter(sh=>sh.klasse==='frachter').map(sh=>sh.id));
 const frachten=(s.kanon.spielerFrachten?.auftraege||[])
   .filter(a=>eigeneFrachter.has(a.schiff));
 const abgeschlossen=frachten.filter(a=>Number.isSafeInteger(a.end)
   &&Number.isSafeInteger(a.geliefert)).length;
 const offen=frachten.some(a=>a.end===null);
 const eis=s.stations?.st_aldera?.lager?.eis||0;
 const hauskasse=s.owners?.house?.cash;
 const gebuehr=s.kanon.spielerFrachten?.gebuehr||0;
 const lohn=s.kanon.spielerFrachten?.lohn||0;
 const suchen=id=>angebote.find(a=>a.id===id);
 let aktion=null,art='auftrag',titel='',anleitung='',angebot=null;
 if(!miner.length){
  titel='Eigenen Miner erwerben';
  anleitung='Für den ersten Schritt wird ein tatsächlich käuflicher Aldera-Miner benötigt.';
  aktion='buy-st_aldera-miner';
 }else if(!schiffe.some(sh=>sh.klasse==='frachter')){
  titel='Eigenen Frachter erwerben';
  anleitung='Eine Fracht benötigt einen rechtmäßig gekauften Transporter.';
  aktion='buy-st_aldera-frachter';
 }else if(offen){
  titel='Laufende Fracht abrechnen';
  anleitung='Der Originalvertrag ist unterwegs. Zeit nur mit regulärer, finanzierter Weltabrechnung fortsetzen.';
  art='zeit';
 }else if(eis>=50&&frachter.length){
  titel='Nächste Eis-Rundfracht beauftragen';
  anleitung='50 physische Einheiten Eis sind in Aldera verfügbar. Käuferbudget, Löhne und Frachter werden bei der Buchung erneut geprüft.';
  aktion='freight-'+frachter[0].id;
 }else if(miner.some(sh=>s.kanon.pendel?.[sh.id]?.ware==='eis')){
  titel='Bezahlten Bergbau fortsetzen';
  anleitung='Dein Miner fördert bereits. Bis zur nächsten 50er-Charge nur reguläre, finanzierte Spielzeit verwenden.';
  art='zeit';
 }else{
  titel='Eisförderung finanzieren';
  anleitung=eis>=50?'Für eine Fracht wird ein freier, eigener Frachter in Aldera benötigt.':
   'Der vorhandene Miner kann nur auf einen vom Originalkern zugelassenen Eisauftrag gesetzt werden.';
  if(eis>=50){art='blockiert';}
  else {aktion='ice-'+miner[0].id;}
 }
 if(aktion)angebot=suchen(aktion);
 const bereit=art==='zeit'||(art==='auftrag'&&!!angebot?.ok);
 const grund=art==='blockiert'?'Kein freier eigener Frachter in Aldera.'
  :aktion&&!bereit?(angebot?.reason||'Der Originalkern bietet diesen Auftrag derzeit nicht an.'):null;
 const text=abgeschlossen
  ?'Originalbelege: '+abgeschlossen+' abgeschlossene Eis-Rundfahrt'+(abgeschlossen===1?'':'en')+
    '. Jede weitere Fracht benötigt erneut Ware und zahlungsfähige Beteiligte.'
  :'Noch keine abgeschlossene Eis-Rundfahrt. Ein Auftrag ist erst nach Lieferung und Rückkehr abgeschlossen.';
 return Object.freeze({abgeschlossen,offen,eis,hauskasse,gebuehr,lohn,
  titel,anleitung,art,aktion,bereit,grund,text});
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Handelsweg=api;
})(globalThis);
