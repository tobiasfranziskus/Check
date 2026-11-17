/* W6/P8h: isolierter ORIGINAL-COMMAND Forschungsdispatcher (kein Produktmodul).
 * Der Testleiter simuliert voneinander getrennte Unternehmensentscheidungen
 * ausschliesslich mit bestehenden, einzeln autorisierten Core-Befehlen.
 * Keine Preise, Emission, Schiffsteleports, Reserve-/Save-Schema-Erweiterungen.
 * Dokumentierter Gegenversuch, NICHT bereits eine freigegebene NPC-KI.
 */
'use strict';

const ids=a=>Object.keys(a).sort();
const ladungLeer=sh=>Object.values(sh.ladung||{}).every(n=>n===0);
function geeignet(w,s,sh,system){
 return sh.owner==='transport'&&sh.klasse==='frachter'
   &&sh.system===system&&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
   &&sh.auftrag==='halten'&&ladungLeer(sh)&&w.buchwert(s,sh.id)>0;
}
function plan(w,s){
 if(w.rules.rulesVersion!==207||s.rulesVersion!==207)
   return {art:'gesperrt',grund:'Nur isolierte Regel207-Forschung'};
 if(!w.audit(s).ok)return {art:'gesperrt',grund:'Core-Audit fehlgeschlagen'};
 if(s.kanon.materialSupplyEnabled!==true)
   return {art:'gesperrt',grund:'Materialversorgung nicht ausdrücklich aktiviert'};
 const lager=s.stations.st_nadir.lager,k=s.kanon;
 const planBedarf=w.rules.w5.material+w.rules.j3.material+w.rules.j4.material;
 const rest=planBedarf-(lager.material||0);
 const teile=(lager.bauteil||0),silizium=(lager.silizium||0);
 const aktiveIndustrie=!!k.jaeger?.auftrag||!!k.bauteile?.auftrag;
 const ziel=(!aktiveIndustrie&&(lager.jaeger||0)<1
   &&teile<w.rules.j4.bauteile&&silizium>=w.rules.j3.silizium
   &&rest>0);
 if(!ziel)return {art:'kein-bedarf',grund:'Keine gegenwärtige reale J3/J4-Materiallücke'};
 if(k.industrieErz && ['angebot','aktiv'].includes(k.industrieErz.phase))
   return {art:'warten',grund:'Vorhandenen Erzvertrag nicht verdoppeln'};
 const frachter=ids(s.ships).map(id=>s.ships[id])
   .filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 const aldera=frachter.filter(sh=>geeignet(w,s,sh,'aldera'));
 if(aldera.length){
   const miner=ids(s.ships).map(id=>s.ships[id]).find(sh=>
     sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'
     &&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
     &&ladungLeer(sh)&&w.buchwert(s,sh.id)>0
     &&(!k.pendel?.[sh.id]||k.pendel[sh.id].ware==='erz')
     &&!s.erzpilotVertraege?.[sh.id]);
   if(!miner)return {art:'warten',grund:'Kein freier rechtmaessiger NPC3-Erzminer'};
   return {art:'vertrag',miner:miner.id,frachter:aldera[0].id,befehle:[
     {type:'industrialOreOfferMaterial',owner:'st_nadir',miner:miner.id,frachter:aldera[0].id},
     {type:'industrialOreAcceptMine',owner:'npc3'},
     {type:'industrialOreAcceptFreight',owner:'transport'},
     {type:'industrialOreCommitMaterial',owner:'st_nadir'}
   ]};
 }
 // Ein schon einmal ueberfuehrter Frachter darf nie erneut zum kostenlosen Ersatz werden.
 const nadir=frachter.find(sh=>geeignet(w,s,sh,'nadir')&&
   !s.w5ac.completed.some(x=>x.id===sh.id));
 if(nadir)return {art:'ueberfuehren',schiff:nadir.id,befehle:[
   {type:'shipReposition',owner:'transport',schiff:nadir.id}]};
 // Ein bereits rechtmaessig gekaufter und bezahlter Ersatzfrachter ist
 // unterwegs: weder zweite Werftbestellung noch zweite Kaufbindung ausloesen.
 const unterwegs=frachter.find(sh=>w.buchwert(s,sh.id)>0
   &&(s.w5ac?.active?.id===sh.id||sh.phase==='reise'));
 if(unterwegs)return {art:'warten',
   grund:'Bezahlter Speditionsfrachter '+unterwegs.id+' ist bereits unterwegs'};
 if((lager.frachter||0)>0){
   // Original-W5-Verkaufspreis und 60 echte Pilotenminuten, keine Kreditfiktion.
   const preis=w.rules.w5.verkaufsPreis;
   const reserve=60*w.rules.w5Transfer.lohnJeMinute;
   if(s.owners.transport.cash<preis+reserve)
     return {art:'warten',grund:'Spedition kann Kauf plus bezahlte Ueberfuehrung nicht decken'};
   return {art:'kaufen',befehle:[{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'}]};
 }
 if(s.w5.auftrag||k.minerWerft?.auftrag)
   return {art:'warten',grund:'W5-/K2-Werft ist bereits beschaeftigt'};
 const quote=w.kern.pilotW5Kalkulation(s);
 if(!quote.ok)return {art:'warten',grund:'Original-W5-Werft sperrt: '+quote.grund};
 return {art:'bauen',befehle:[{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'}]};
}
function ausfuehren(w,s,p){
 // Keine von aussen erfundenen NPC-Eigentuemerbefehle akzeptieren:
 // Nur der fuer DEN aktuellen, auditierten Zustand frisch berechnete Plan gilt.
 const aktuell=plan(w,s);
 if(JSON.stringify(aktuell)!==JSON.stringify(p))
   return {ok:false,grund:'Plan nicht aus dem aktuellen Originalzustand autorisiert',zustand:s};
 if(!p||!Array.isArray(p.befehle)||!p.befehle.length)
   return {ok:false,grund:p?.grund||'Kein aktueller, finanzierter Auftrag',zustand:s};
 // Jede Entscheidung prueft ihre vier getrennten Original-Firmenrechte,
 // jedoch nur auf einer Kopie. Fehler hinterlassen KEINE Teilvertraege.
 const original=w.save(s),hash=w.hash(s);
 const clone=w.load(original);
 for(const cmd of p.befehle){
   const r=w.execute(clone,cmd);
   if(!r.ok)return {ok:false,grund:cmd.owner+'/'+cmd.type+': '+r.reason,zustand:s};
 }
 const audit=w.audit(clone);
 if(!audit.ok)return {ok:false,grund:'Welt-Audit: '+audit.fehler.join('; '),zustand:s};
 if(w.save(s)!==original||w.hash(s)!==hash)
   throw Error('Forschungsdispatcher darf die Quellwelt niemals mutieren');
 return {ok:true,art:p.art,zustand:clone,befehle:p.befehle.map(b=>b.type)};
}
module.exports={plan,ausfuehren};
