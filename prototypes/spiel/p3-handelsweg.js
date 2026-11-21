/* P3 – lesende, wiederholbare Handelsnavigation. Alle Transaktionen erfolgen
 * ausschließlich über die vorhandene J8-Session und die Original-Core-Angebote.
 * Kein eigener Geld- oder Warenticker, kein Save-Feld, kein garantierter Käufer.
 */
(function(scope){
'use strict';
function kaufpreis(welt,id){
 const kauf=/^buy-st_(?:aldera|nadir)-(miner|frachter|jaeger)$/.exec(id);
 return kauf?welt?.rules?.economy?.waren?.[kauf[1]]?.basis??null:null;
}
function auswerten(s,angebote,welt=null){
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
 // The original W5n rule defines the charge price, never the UI.
 const w=welt?.rules?.w5n;
 const eisAnkaufKosten=Number.isSafeInteger(w?.charge)&&Number.isSafeInteger(w?.eisPreis)
   ?w.charge*w.eisPreis:null;
 let aktion=null,art='auftrag',titel='',anleitung='',angebot=null,blockGrund=null;
 if(!miner.length){
  titel='Eigenen Miner erwerben';
  anleitung='Mit einem Bergbauschiff in Aldera kannst du Eisförderung beauftragen.';
  aktion='buy-st_aldera-miner';
 }else if(!schiffe.some(sh=>sh.klasse==='frachter')){
  titel='Eigenen Frachter erwerben';
  anleitung='Mit einem Frachter in Aldera kannst du das geförderte Eis nach Nadir liefern.';
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
  if(eisAnkaufKosten!==null&&s.owners.st_aldera.cash<eisAnkaufKosten){
   titel='Eisabnahme in Aldera nicht finanziert';
   blockGrund='Aldera besitzt '+s.owners.st_aldera.cash+' von '+eisAnkaufKosten+
     ' ISK für die nächste Original-Eischarge. Es gibt keinen garantierten Käufer.';
   anleitung='Reguläre Weltzeit kannst du weiterhin über die Kommandobrücke fortsetzen. '+
     'Ein neuer Verkauf ist erst nach echter Käuferfinanzierung möglich.';
   art='blockiert';
  }else{
   titel='Bezahlten Bergbau fortsetzen';
   anleitung='Dein Miner fördert bereits. Bis zur nächsten 50er-Charge nur reguläre, finanzierte Spielzeit verwenden.';
   art='zeit';
  }
 }else{
  titel='Eisförderung finanzieren';
  anleitung=eis>=50?'Für eine Fracht wird ein freier, eigener Frachter in Aldera benötigt.':
   'Beauftrage deinen Miner, Eis zu fördern und nach Aldera zu bringen.';
  if(eis>=50){art='blockiert';blockGrund='Kein freier eigener Frachter in Aldera.';}
  else {aktion='ice-'+miner[0].id;}
 }
 if(aktion)angebot=suchen(aktion);
 const bereit=art==='zeit'||(art==='auftrag'&&!!angebot?.ok);
 const grund=art==='blockiert'?blockGrund
  :aktion&&!bereit?(angebot?.reason||'Der Originalkern bietet diesen Auftrag derzeit nicht an.'):null;
 // Keine scheinbare Ersatzbeschaffung: nur die ORIGINAL-Quote des anderen Marktes
 // lesen. Ein Nadir-Schiff steht nach dem Kauf nicht automatisch in Aldera.
 let marktHinweis=null;
 if(grund==='kein Komplettschiff auf Lager'
   &&(aktion==='buy-st_aldera-frachter'||aktion==='buy-st_aldera-miner')){
  const klasse=aktion.endsWith('frachter')?'frachter':'miner';
  const bezeichnung=klasse==='frachter'?'Frachter':'Bergbauschiff';
  const nadir=suchen('buy-st_nadir-'+klasse);
  const start='Aldera: kein '+bezeichnung+' im aktuellen Werftbestand. ';
  marktHinweis=nadir?.ok===true
   ?start+'Nadir bietet aktuell einen echten Kauf an. Das Schiff befindet sich danach in Nadir und ist nicht sofort für Aldera-Aufträge verfügbar.'
   :nadir
    ?start+'Auch der Kauf in Nadir ist gesperrt: '+(nadir.reason||'Originalmarkt verweigert den Kauf')+'. Ein späteres Angebot ist nicht garantiert.'
    :start+'Für Nadir liegt gerade kein entsprechendes Kaufangebot vor. Ein späteres Angebot ist nicht garantiert.';
 }
 // A blocked carrier purchase need not prevent a first mining order.
 const foerderangebot=aktion==='buy-st_aldera-frachter'&&!bereit
  ?miner.map(sh=>suchen('ice-'+sh.id)).find(a=>a?.ok):null;
 const text=abgeschlossen
  ?'Originalbelege: '+abgeschlossen+' abgeschlossene Eis-Rundfahrt'+(abgeschlossen===1?'':'en')+
    '. Jede weitere Fracht benötigt erneut Ware und zahlungsfähige Beteiligte.'
  :'Noch keine abgeschlossene Eis-Rundfahrt. Ein Auftrag ist erst nach Lieferung und Rückkehr abgeschlossen.';
 return Object.freeze({abgeschlossen,offen,eis,hauskasse,gebuehr,lohn,
  titel,anleitung,art,aktion,bereit,grund,marktHinweis,foerderaktion:foerderangebot?.id??null,text});
}
// Nur autoritative, vollständig abgerechnete Eigenfrachten zählen als dauerhafter
// Karriere-Meilenstein; sichtbare Schiffsladung und begonnene Verträge zählen nicht.
function ersteBezahlteRundfahrt(s,welt){
 if(!s||![204,207].includes(s.rulesVersion)||typeof welt?.audit!=='function')return false;
 try{if(welt.audit(s).ok!==true)return false;}catch{return false;}
 const belege=s.kanon?.spielerFrachten;
 if(!belege||!Number.isSafeInteger(belege.gebuehr)||belege.gebuehr<=0||!Array.isArray(belege.auftraege))return false;
 // Das autoritative Spielerfracht-Journal beweist die historische Eigenfracht.
 // Ein späterer Schiffseigentümerwechsel darf den bereits verdienten Erfolg nicht löschen.
 return belege.auftraege.some(a=>typeof a.schiff==='string'&&a.schiff.length>0
   &&Number.isSafeInteger(a.start)&&a.start>=0
   &&Number.isSafeInteger(a.geliefert)&&Number.isSafeInteger(a.end)
   &&a.start<=a.geliefert&&a.geliefert<=a.end);
}
const api=Object.freeze({auswerten,kaufpreis,ersteBezahlteRundfahrt});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Handelsweg=api;
})(globalThis);
