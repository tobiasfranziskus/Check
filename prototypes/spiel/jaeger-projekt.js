/* J13b: Spielerbeiträge aus bestehenden J8-Angeboten. Keine Firmenprokura.
 * Angebote und Sperrgründe werden im Original-Core auf Save/Load-Klonen geprüft.
 * Dieses Modell schreibt weder Weltzustand noch einen zusätzlichen Fortschritt.
 */
(function(scope){
'use strict';
const gruppen=Object.freeze([
 {titel:'Eigene Rohstoffarbeit',ids:['buy-st_nadir-miner'],prefix:['sil-start-','sil-sell-']},
 {titel:'Eigene Versorgung und Transport',ids:['buy-st_aldera-miner','buy-st_aldera-frachter','buy-st_nadir-frachter'],prefix:['ice-','stop-','freight-','gate-freight-']}
]);
function erstellen(sitzung){
 const w=sitzung.weltReferenz(),s=sitzung.zustandReferenz();
 if(![204,207].includes(w?.rules.rulesVersion)||s?.rulesVersion!==w.rules.rulesVersion)throw Error('J13b: originale Regel204/207 erforderlich');
 const angebote=sitzung.angebote();
 const probe=cmd=>{
  const clone=w.load(sitzung.exportieren());
  const r=w.execute(clone,{...cmd,owner:'house'});
  return Object.freeze({ok:r.ok,grund:r.reason||null});
 };
 const sperren=[
  ['K7-Erzvertrag','st_nadir / npc3 / transport / werft_extern',
   {type:'industrialOreOffer',miner:'sh001',frachter:''}],
  ['W4-Raffinerie','st_nadir',{type:'stationRefine',station:'st_nadir'}],
  ['J3-Bauteile',w.rules.j3.owner,{type:'stationBuildParts',station:w.rules.j3.station}],
  ['J4-Jägerwerft',w.rules.j4.owner,{type:'stationBuildFighter',station:w.rules.j4.station}]
 ].map(([titel,eigentuemer,cmd])=>Object.freeze({titel,eigentuemer,...probe(cmd)}));
 const aldera=s.owners.st_aldera.cash,erzkauf=w.industriePreise.alderakauf;
 return Object.freeze({
  gruppen:Object.freeze(gruppen.map(g=>Object.freeze({titel:g.titel,
   angebote:Object.freeze(angebote.filter(a=>g.ids.includes(a.id)||g.prefix.some(p=>a.id.startsWith(p))))}))),
  sperren:Object.freeze(sperren),
  aldera:Object.freeze({kasse:aldera,erzkauf,fehlend:Math.max(0,erzkauf-aldera)}),
  silizium:Object.freeze({verkauft:s.kanon.silizium.verkauft,
   eigeneVerkaeufe:s.kanon.silizium.belege.filter(b=>b.owner==='house').reduce((n,b)=>n+b.menge,0)}),
  hinweis:'Eis und F4 versorgen die Wasserwirtschaft. Sie ersetzen weder Erz noch Jägerbauteile. '+
   'Siliziumarbeit wird erst mit einem rechtmäßig vorgemerkten und gekauften Nadir-Miner möglich. '+
   'Dessen Produktion und K7/W4/J3/J4 bleiben Entscheidungen der jeweiligen Unternehmen.'
 });
}
const API=Object.freeze({erstellen});
if(typeof module==='object'&&module.exports)module.exports=API;else scope.J13Spielerprojekt=API;
})(globalThis);
