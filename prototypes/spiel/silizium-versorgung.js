/* W6/P8a: Nur lesende, originalkernbasierte Silizium-Versorgungsdiagnose.
 * KEIN Feld-Refill, kein neuer Transport, keine Kaufzusage, keine NPC-Signatur.
 * Der vorhandene Regel204-Kern bleibt die alleinige wirtschaftliche Autoritaet.
 */
(function(scope){
'use strict';
const ganz=n=>Number.isSafeInteger(n)&&n>=0;
const summe=(list,feld)=>list.reduce((n,v)=>n+(v[feld]||0),0);
function erstellen(welt,zustand){
 const r=welt?.rules,s=zustand,k=s?.kanon,b=k?.silizium;
 if(r?.rulesVersion!==204||s?.rulesVersion!==204||!r.j2b||!r.j3||!r.j4||
    !r.world?.systems||!Array.isArray(r.world?.fields)||
    !s?.stations?.st_nadir?.lager||!s?.owners?.npc3||!s?.owners?.st_nadir||
    !b||!s?.ledger?.silizium||typeof welt.audit!=='function')
   throw Error('P8a: ausschliesslich vollstaendige, originale Regel204-Welt');
 const result=welt.audit(s);
 if(!result.ok)throw Error('P8a: Original-Waren-/Geld-/Eigentumsaudit verweigert Status');
 const depot=r.j2b.feld,charge=r.j2b.charge;
 const feldEigenschaft=['vorrat','gefoerdert','verkauft','auftraege'];
 if(!feldEigenschaft.every(key=>ganz(b[key]))||!ganz(depot.vorrat)||!ganz(charge)||charge===0)
   throw Error('P8a: ungueltige endliche Rohstoffrechnung');
 const aktiveSysteme=Object.keys(r.world.systems);
 // Rule204-Flug, Stationen und wirkliche J2b-Mengen sind entscheidend.
 // Allgemeine Karten-/Geografiemetadaten sind keine physische Abbaureserve.
 const aktiveSiliziumFelder=r.world.fields.filter(f=>
  f.ware==='silizium'&&aktiveSysteme.includes(f.system));
 const fremdfelder=aktiveSiliziumFelder.filter(f=>f.system!==depot.system);
 const schiffe=Object.values(s.ships);
 const anBord=summe(schiffe.map(sh=>sh.ladung||{}),'silizium');
 const nadir=s.stations.st_nadir.lager;
 const freiImDepot=nadir.silizium||0,bauteile=nadir.bauteil||0;
 const lagerJaeger=nadir.jaeger||0;
 const gebunden=b.auftrag ? Object.freeze({
  owner:b.auftrag.owner,schiff:b.auftrag.schiff,
  menge:b.auftrag.menge,gefoerdert:b.auftrag.gefoerdert
 }):null;
 const arbeit=r.j2b.charge*r.j2b.minutenJeEinheit*r.j2b.lohnJeMinute;
 const kauf=r.j2b.charge*r.j2b.preis;
 const flug=(welt.daten?.flug?.reserveMinuten??0)*(welt.daten?.flug?.lohnJeMinute??0);
 const eigeneMiner=schiffe.filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner'
  &&sh.system===depot.system&&sh.heimat===depot.system
  &&k?.minerWerft?.lokaleKaeufe?.some(x=>x.id===sh.id&&x.owner==='npc3'));
 const rohstoff=Object.freeze({
  system:depot.system,gesamt:depot.vorrat,rest:b.vorrat,
  gefoerdert:b.gefoerdert,verkauft:b.verkauft,charge,
  moeglicheNeueChargen:Math.floor(b.vorrat/charge),
  auftrag:gebunden
 });
 const lager=Object.freeze({siliziumNadir:freiImDepot,siliziumSchiffe:anBord,
  bauteileNadir:bauteile,jaegerNadir:lagerJaeger,
  fertigeJaeger:k.jaeger.fertig,verarbeiteteSilizium:k.bauteile.siliziumVerbraucht});
 const finanzierung=Object.freeze({
  // Nicht als verbindliches Jobangebot ausgeben: Schiff, Dock, Frachtraum,
  // Arbeitsvertrag, Wareneigentum und Auftrag muessen separat geprueft werden.
  arbeitJeCharge:arbeit,ankaufJeCharge:kauf,flugreserve:flug,
  npc3Kasse:s.owners.npc3.cash,nadirKasse:s.owners.st_nadir.cash,
  npc3MindestMitFlug:arbeit+flug,
  anzahlRechtmaessigerNpcNadirMiner:eigeneMiner.length,
  genugMindestkapital:s.owners.npc3.cash>=arbeit+flug && s.owners.st_nadir.cash>=kauf
 });
 const weg=Object.freeze({
  aktiveSysteme:Object.freeze(aktiveSysteme.sort()),
  aktiveSiliziumFelder:aktiveSiliziumFelder.length,
  fremdeAktiveSiliziumFelder:fremdfelder.length,
  dravosAktiv:aktiveSysteme.includes('dravos'),
  neueLieferrouteFinanziert:false // im Regel204-Kern keine fremde Silizium-Frachtart vorhanden
 });
 // Strenge Klassifikation, nicht irrefuehrend nach jeder J4-Lagerhuelle
 // "zwei weitere Jaeger moeglich" behaupten. Fertige und bauteilgebundene
 // Ware bleibt physisch erfasst, nicht als freie Rohstoffreserve gezaehlt.
 const engerRest=rohstoff.rest<charge;
 const stand=engerRest
  ?(freiImDepot>0||anBord>0||bauteile>0
    ?'Keine neue 8er-Foerdercharge im Nadir-Feld; vorhandene Ware/Teile separat nachweisbar'
    :'Nadir-Siliziumfeld erschoepft; ohne neue endliche, finanzierte Quelle kein weiterer J3-Rohstoffnachschub')
  :'Nadir-Feld hat noch endlichen Rohstoff; naechste Charge nur mit Original-Miner, Geld, Dock und Kaufvertrag';
 const probe=Object.freeze({regel:204,tick:s.tick,
  rohstoff,lager,finanzierung,weg,stand});
 return probe;
}
const API=Object.freeze({erstellen});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.P8SiliziumVersorgung=API;
})(globalThis);
