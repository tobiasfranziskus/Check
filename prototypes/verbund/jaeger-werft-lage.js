/* Aphros Void J10a – reine, geld- und eigentumsgeprüfte Werftdiagnose.
 * Keine zweite Welt, keine "fremder Firma handeln"-Befehle, keine neue
 * Industrie- oder NPC-Automatik. Alle Sperrgründe stammen aus Original-Core
 * über die bereits integrierte J6-W-Prüf-API.
 */
(function(scope){
'use strict';
const NODE=typeof module==='object'&&module.exports;
const API=NODE?require('../j6w/wirtschaft.js'):scope.J6wWirtschaft;
if(!API)throw Error('J10a benötigt J6-W-Originalangebotsprüfung');
const ZAHL=k=>Number.isSafeInteger(k)&&k>=0;
const einfrieren=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  Object.values(x).forEach(einfrieren);Object.freeze(x);
 }
 return x;
};
function erstellen(welt,zustand){
 if(!welt||welt.regel!==204||!zustand||zustand.rulesVersion!==204)
   throw Error('J10a: nur die echte Regel204-Welt');
 const quelleHash=welt.hash(zustand);
 const s=welt.load(welt.save(zustand));
 const audit=welt.audit(s);
 if(!audit.ok)throw Error('J10a: Original-Core-Audit fehlgeschlagen');
 const j4=welt.rules.j4,j3=welt.rules.j3;
 if(!j4||!j3||!welt.industriePreise)
   throw Error('J10a: J4-/J3-/K7-Regeln fehlen');
 const st=s.stations[j4.station],b=s.kanon.jaeger;
 if(!st||!b||!s.owners[j4.owner])throw Error('J10a: Werft-Eigentum fehlt');
 const nd=st.lager,haus=s.owners.house,werft=s.owners.werft_extern;
 const fertige=nd.jaeger||0;
 const fehlendeBauteile=Math.max(0,j4.bauteile-(nd.bauteil||0));
 const rohmaterialBedarf=j4.material+fehlendeBauteile*j3.material;
 const siliziumBedarf=fehlendeBauteile*j3.silizium;
 const lagerErz=nd.erz||0;
 const ware=Object.freeze({
  erz:lagerErz,material:nd.material||0,silizium:nd.silizium||0,
  bauteil:nd.bauteil||0,jaeger:fertige,
  frachter:nd.frachter||0,miner:nd.miner||0
 });
 const konto=Object.freeze({
  house:haus.cash,st_nadir:s.owners.st_nadir.cash,
  transport:s.owners.transport.cash,npc3:s.owners.npc3.cash,
  werft_extern:werft.cash
 });
 const actor=id=>API.erstellen(welt,id);
 const aktion=(id,label,eigentuemer,anfrage)=>{
   const check=actor(eigentuemer).angebot(s,anfrage);
   return Object.freeze({id,label,eigentuemer,
     nurAnzeige:eigentuemer!=='house',ok:check.ok===true,
     grund:check.reason||null,
     zahlungen:(check.zahlungen||[]).map(x=>Object.freeze({
       konto:x.owner,delta:x.delta
     }))});
 };
 const vorgaenge=[
  aktion('w4','10 Erz raffinieren','st_nadir',{type:'stationRefine',station:j4.station}),
  aktion('j3','Ein Bauteil produzieren','st_nadir',{type:'stationBuildParts',station:j4.station}),
  aktion('j4','Jäger produzieren','st_nadir',{type:'stationBuildFighter',station:j4.station}),
  aktion('house-buy','Fertigen Jäger für 900 ISK kaufen','house',
    {type:'shipBuy',station:j4.station,klasse:'jaeger'})
 ];
 const miner=Object.values(s.ships).filter(sh=>sh.klasse==='miner'&&sh.owner==='npc3')
   .sort((a,b)=>a.id.localeCompare(b.id));
 const frachter=Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&sh.owner==='transport')
   .sort((a,b)=>a.id.localeCompare(b.id));
 if(miner.length&&frachter.length){
   // Dies ist nur der tatsächliche Vorschlag für den fremden Auftraggeber;
   // kein Klick, kein automatisches Setzen einer Unterschrift.
   vorgaenge.push(aktion('k7-offer','Erz-Frachtvertrag anbieten','st_nadir',
     {type:'industrialOreOffer',miner:miner[0].id,frachter:frachter[0].id}));
 }
 for(const [id,label,owner] of [
  ['k7-mine','Bergbaubetrieb unterschreibt','npc3'],
  ['k7-freight','Spedition unterschreibt','transport'],
  ['k7-yard','Werftbetrieb unterschreibt','werft_extern']
 ]){
   const type=id==='k7-mine'?'industrialOreAcceptMine':id==='k7-freight'?'industrialOreAcceptFreight':'industrialOreAcceptYard';
   vorgaenge.push(aktion(id,label,owner,{type}));
 }
 vorgaenge.push(aktion('k7-commit','Erzvertrag abschließen','st_nadir',
   {type:'industrialOreCommit'}));
 const zahlungen=Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
 if(!ZAHL(zahlungen)||zahlungen!==33000||s.minted!==0||s.burned!==0)
   throw Error('J10a: Emissions-/Geldmengen-Abweichung');
 const ergebnis={
  regel:204,tick:s.tick,hash:quelleHash,weltgeld:zahlungen,
  kassen:konto,lager:ware,
  j4:{
   eigentuemer:j4.owner,station:j4.station,
   material:j4.material,bauteile:j4.bauteile,dauer:j4.dauer,
   lohn:j4.dauer*j4.lohnJeMinute,
   kaufpreis:j4.verkaufspreis,
   produzierterBestand:b.fertig,
   verkauft:b.verkauft,auftragAktiv:!!b.auftrag,
   gearbeitet:b.auftrag?.gearbeitet||0
  },
  fehlbedarf:{
   bauteile:fehlendeBauteile,
   material:Math.max(0,rohmaterialBedarf-ware.material),
   silizium:Math.max(0,siliziumBedarf-ware.silizium),
   // Rohmaterialbedarf als reine Projektion, keine neue Produktion:
   berechnungsgrundlage:'Für fehlende Bauteile J3-Rezept plus J4-Material; laufende Aufträge separat beachten.'
  },
  k7:{werftBarmittel:werft.cash,
     werftReserve:welt.industriePreise.werft,
     angebotMiner:miner[0]?.id||null,
     angebotFrachter:frachter[0]?.id||null,
     vertragsphase:s.kanon.industrieErz?.phase||null},
  vorgaenge,
  offeneRechte:'Nur house führt Hauskäufe aus. NPC-/Stationsaufträge bleiben reine Angebote.'
 };
 if(welt.hash(zustand)!==quelleHash)throw Error('J10a: Vorschau veränderte den Original-Worldhash');
 return einfrieren(ergebnis);
}
const publicApi=Object.freeze({erstellen});
if(NODE)module.exports=publicApi;else scope.J10WerftLage=publicApi;
})(typeof globalThis==='object'?globalThis:this);
