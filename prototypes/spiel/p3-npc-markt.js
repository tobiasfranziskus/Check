/* P3 – existing self-financed NPC demand and legal player freight.
 * Pure read adapter. No economic rule, new contract, timer, buyer or save field.
 */
(function(scope){
'use strict';
const legalInteger=n=>Number.isSafeInteger(n)&&n>=0;
function auswerten(w,s,angebote,daten){
 if(s?.rulesVersion===207)return Object.freeze({sichtbar:false});
 if(!s||s.rulesVersion!==204||!w||w.regel!==204||!Array.isArray(angebote)
   ||!w.audit(s).ok||!daten?.haushalte)throw Error('P3 NPC-Markt benötigt auditierten Regel204-Weltkern');
 const eigene=Object.values(s.ships).filter(sh=>sh.owner==='house');
 const eigeneFrachter=eigene.filter(sh=>sh.klasse==='frachter');
 const haushaltIds=new Set(Object.keys(daten.haushalte).filter(id=>!['pilot_house','eigner_house'].includes(id)));
 const ledger=s.kanon.buch?.summen||{};
 let npcWasserAl=0,npcWasserNadir=0,npcDividenden=0;
 for(const [k,v] of Object.entries(ledger)){
  if(!legalInteger(v))throw Error('P3 NPC-Markt: ungültiger Geldbuchungsbeleg');
  const [grund,von,an,...rest]=k.split('|');
  if(rest.length)continue;
  if(grund==='wasser-einzelhandel'&&haushaltIds.has(von)){
   if(an==='st_aldera')npcWasserAl+=v;
   if(an==='st_nadir')npcWasserNadir+=v;
  }else if(grund==='dividende'&&haushaltIds.has(an))npcDividenden+=v;
 }
 const runde=(s.kanon.spielerFrachten?.auftraege||[]).filter(a=>a.end!==null
   &&a.geliefert!==null&&eigeneFrachter.some(sh=>sh.id===a.schiff)).length;
 const fracht=angebote.find(a=>/^freight-/.test(a.id)&&a.ok===true
   &&eigeneFrachter.some(sh=>'freight-'+sh.id===a.id));
 const npcFrachter=Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 const freiNpcFrachter=npcFrachter.filter(sh=>sh.system==='aldera'&&sh.phase==='dock'
   &&sh.auftrag==='halten'&&(sh.flug?.lage==='angedockt')&&
   Object.values(sh.ladung||{}).every(n=>n===0));
 const interval=s.kanon.politik?.dividendeMinuten;
 const bisAbrechnung=legalInteger(interval)&&interval>0?interval-s.tick%interval:null;
 const datum=legalInteger(s.tick)?s.tick:null;
 const lager=s.stations.st_aldera.lager;
 const eisKosten=w.rules?.w5n?.charge*w.rules?.w5n?.eisPreis;
 if(!legalInteger(eisKosten)||!legalInteger(datum))throw Error('P3 NPC-Markt: ungültige Kernregel');
 const kannFracht=!!fracht;
 const grund=kannFracht
  ?'Eine originale, rechtmäßig bezahlte Eisfracht ist möglich. Du kannst selbst transportieren.'
  :npcFrachter.length===0
    ?'Die NPC-Spedition besitzt derzeit keinen eigenen Frachter; neue Hüllen entstehen nicht kostenlos.'
    :'Eine neue bezahlte Spielerfracht ist noch nicht angeboten. Warte auf reale Ware und Finanzierung.';
 return Object.freeze({
  sichtbar:runde>=2,runde,npcWasserAl,npcWasserNadir,npcDividenden,
  alderakasse:s.owners.st_aldera.cash,nadirkasse:s.owners.st_nadir.cash,
  eisPreisCharge:eisKosten,eis:lager.eis||0,wasser:lager.wasser||0,
  wasserNadir:s.stations.st_nadir.lager.wasser||0,
  npcFrachter:npcFrachter.length,freiNpcFrachter:freiNpcFrachter.length,
  eigeneFrachter:eigeneFrachter.length,naechsteAbrechnung:bisAbrechnung,
  art:kannFracht?'fracht':'zeit',aktion:kannFracht?fracht.id:null,
  bereit:kannFracht||true,grund,
  mangel:kannFracht?null:(angebote.find(a=>/^freight-/.test(a.id)&&eigeneFrachter.some(sh=>a.id==='freight-'+sh.id))?.reason||null)
 });
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.P3NPCMarkt=api;
})(globalThis);
