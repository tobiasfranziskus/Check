/* P1 · Spielerlebnis-Hülle. Keine zweite Welt, kein eigener Wirtschafts-Tick.
 * Verwendet ausschliesslich originale Regel195-Quelle, validierte J8-Session,
 * RAUM-1-Cockpit und separat geschützte eigene Karriere-Speicherstellen.
 */
(function(scope){
'use strict';
const d=scope.document,$=id=>d.getElementById(id);
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const SLOT_W6='aphros-void:spielerkarriere:regel207-forschung:v1';
const BACKUP=SLOT+':vorherige';
const MAX=5*1024*1024;
const fmt=n=>Number(n).toLocaleString('de-DE');
let session=null,raum=null,ansicht='startseite',flugSchritte=0,flugSeitSicherung=0,patrouille=null,duell=null;
let cockpitGenutzt=false,flugerfahrung=false,managerTutor=null,pilotTutor=null,pilotMenu=null;
let werftAuswahlId=null; // Only UI memory, never exported into a Rule204/207 save.
const safeText=(s)=>String(s==null?'':s);
const error=(e)=>safeText(e&&e.message?e.message:e);
// Zentrale Anzeigenamen: nur für die Oberfläche, nie als ID in Befehlen oder Spielständen.
const KONZERN_ANZEIGENAMEN=Object.freeze({
 house:'Dein Konzern',
 npc3:'Meridian Rohstoffwerke',
 transport:'Asterion Logistik',
 werft_extern:'Nadir Schiffswerke',
 st_aldera:'Aldera Handelsstation',
 st_nadir:'Nadir Industriestation'
});
function konzernname(id){return Object.prototype.hasOwnProperty.call(KONZERN_ANZEIGENAMEN,id)
 ?KONZERN_ANZEIGENAMEN[id]:safeText(id);}
// Anzeigeebene für ältere Auftragsmeldungen: technische IDs sind niemals Spielernamen.
function anzeigetext(value){
 return safeText(value).replace(/(^|[^A-Za-z0-9_])(house|npc3|transport|werft_extern|st_aldera|st_nadir)(?=$|[^A-Za-z0-9_])/g,
  (_match,prefix,id)=>prefix+konzernname(id));
}
function firmennamenAnzeigen(){
 for(const el of d.querySelectorAll('[data-company-display]'))
  el.textContent=konzernname(el.dataset.companyDisplay);
}

function speichern(copyOld=false){
 if(!session)return false;
 const json=session.exportieren();
 if(json.length>MAX)throw Error('Karrierestand übersteigt 5 MB. Bitte als JSON exportieren.');
 // Preserve the original Rule204 write *literally*; the research slot
 // is a separate explicit branch, not a generic alias that could silently
 // redirect any existing Rule204/195 career storage.
 try {
   if(session.ansicht().regel===207){
     if(copyOld){const old=scope.localStorage.getItem(SLOT_W6);
       if(old)scope.localStorage.setItem(SLOT_W6+':vorherige',old);}
     scope.localStorage.setItem(SLOT_W6,json);
   }else{
     if(copyOld){const old=scope.localStorage.getItem(SLOT);
       if(old)scope.localStorage.setItem(BACKUP,old);}
     scope.localStorage.setItem(SLOT,json);
   }
   return true;
 }catch(e){
   hinweis('Lokales Sichern nicht möglich. Bitte den JSON-Export verwenden: '+error(e),true);
   return false;
 }
}
function gespeicherte(key=SLOT){
 try{return scope.localStorage.getItem(key)||null;}catch{return null;}
}
function menustand(){
 $('fortsetzen').disabled=!gespeicherte();
 $('fortsetzen-w6').disabled=!gespeicherte(SLOT_W6);
 const old=$('vorige-karriere');
 if(old)old.hidden=!gespeicherte(BACKUP);
 const w6Backup=$('vorige-forschung');
 if(w6Backup)w6Backup.hidden=!gespeicherte(SLOT_W6+':vorherige');
}
function screen(id){
 ansicht=id;
 for(const name of ['startseite','briefing','spielwelt','raumbereich'])$(name).hidden=name!==id;
 if(id!=='raumbereich'&&raum)raum.deaktivieren();
 $('open-menu').hidden=id==='startseite';
 $('mode-indicator').textContent=id==='startseite'?'OFFLINE · ALDERA-SEKTOR':
   id==='briefing'?'PROLOG · ALDERA-SEKTOR':'ONLINE · ALDERA-SEKTOR';
 if(id==='spielwelt'&&session)anzeigen();
 scope.scrollTo?.({top:0,left:0,behavior:'instant'});
}
function hinweis(message,fail=false){
 const text=anzeigetext(message);
 const id=ansicht==='spielwelt'||ansicht==='raumbereich'?'welt-meldung':
   ansicht==='briefing'?'briefing-meldung':'menumeldung';
 $(id).textContent=text;
 $(id).classList.toggle('error',!!fail);
}
function neueSitzung(){
 return scope.J8KonzernSitzung.erstellen();
}
function aktiveSitzung(nachricht){
 if(!session)throw Error('Es wurde noch keine Karriere gestartet.');
 screen('spielwelt');
 hinweis(nachricht||'Willkommen in Aldera. Dein Konzern wartet auf seinen ersten Auftrag.');
 menustand();
}
function startNeu(){
 try{
  if(!scope.W5acSession||!scope.J8KonzernSitzung)throw Error('Original-Wirtschaftskern wurde nicht geladen');
  // Explicitly selected NEW research world. Not a Rule204-to-207 save migration.
  const w6Aktiv=$('w6-npc-start')?.checked===true;
  const p8gAktiv=$('w6-p8g-start')?.checked===true;
  if(w6Aktiv&&p8gAktiv)throw Error('Bitte nur einen erweiterten Karrieremodus wählen');
  const slot=p8gAktiv?SLOT_W6:SLOT,vorher=gespeicherte(slot);
  if(p8gAktiv&&!scope.confirm('Die experimentelle Dravos-Karriere besitzt eine eigene Spielwelt mit begrenzten Rohstofffeldern. Deine normale Karriere bleibt unverändert. Experimentelle Karriere beginnen?'))return;
  if(vorher&&!scope.confirm('Für dieses Profil besteht schon ein Spielstand. Die bisherige Version bleibt als „Vorherige Karriere“ gesichert. Trotzdem neu beginnen?'))return;
  const neu=neueSitzung();
  const a=p8gAktiv?neu.startenP8g(true):neu.starten195(scope.W5acSession.create(42,'private195').export(),true);
  if(a.regel!==(p8gAktiv?207:204)||a.weltgeld!==33000)
    throw Error('Ausgangswelt nicht autoritativ validiert');
  if(w6Aktiv){
   const welt=neu.weltReferenz(),zustand=neu.zustandReferenz();
   if(typeof welt.politikSetzen!=='function'||typeof welt.npcAutoSetzen!=='function'
     ||typeof welt.npcSiliziumSetzen!=='function')throw Error('W6-Firmenpolitik nicht vollständig installiert');
   // Freigegebenes S02-Forschungsprofil. Eine Politik ist Verhalten, weder Geldquelle noch Ware.
   welt.politikSetzen(zustand,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
   welt.npcAutoSetzen(zustand,true);
   welt.npcSiliziumSetzen(zustand,true);
   const audit=welt.audit(zustand);
   if(!audit.ok)throw Error('W6: Wirtschaftsprüfung verweigert Start: '+audit.fehler.join('; '));
  }
  session=neu;werftAuswahlId=null;flugSchritte=0;flugSeitSicherung=0;cockpitGenutzt=false;flugerfahrung=false;patrouille=null;duell=null;
  pilotTutor?.zuruecksetzen();pilotMenu?.zeichnen();
  const ok=speichern(!!vorher);
  aktiveSitzung('Karriere begonnen: '+fmt(a.weltgeld)+' ISK Weltgeld. '+(p8gAktiv
   ?'Experimentelle Dravos-Karriere mit bezahltem Bergbau, Transport und Materialverträgen; deine normale Karriere bleibt unverändert.'
   :w6Aktiv?'Unabhängige Konzerne arbeiten auf eigene Rechnung; jeder Auftrag bleibt finanziert.'
   :'Klassische Karriere ohne autonome Industrieaufträge.')+' Kein kostenloses Schiff.');
  if(!ok)hinweis('Karriere gestartet. Lokales Speichern nicht verfügbar; bitte sofort JSON exportieren.',true);
 }catch(e){hinweis('Start verweigert: '+error(e),true);}
}
function ladeSitzung(json,auswahl,backup=false){
 if(typeof json!=='string'||json.length<1||json.length>MAX)
   throw Error('Ungültige Größe des Karriere-Spielstands.');
 if(session)throw Error('Laufende Karriere zuerst als JSON exportieren und die Seite neu öffnen.');
 const raw=JSON.parse(json),regel=raw?.rulesVersion;
 if(regel!==204&&regel!==207)throw Error('Dieser Spielstand gehört nicht zu einer unterstützten Karriere.');
 if(regel===207&&!['forschung','forschung-backup','datei'].includes(auswahl))
   throw Error('Bitte die experimentelle Karriere über ihren eigenen Zugang öffnen.');
 if(regel===204&&['forschung','forschung-backup'].includes(auswahl))
   throw Error('Der experimentelle Spielzugang kann keine normale Karriere überschreiben.');
 // The authorization is a real user action OUTSIDE the untrusted JSON:
 // named research-resume click or separate explicit file-import confirmation.
 if(regel===207&&auswahl==='datei'&&!scope.confirm(
   'Diese Datei enthält eine experimentelle Dravos-Karriere. Möchtest du diesen externen Spielstand ausdrücklich importieren? Deine normale Karriere bleibt separat erhalten.'))return;
 if(regel===207&&auswahl==='datei'&&raw.kanon?.npcMaterialKette===true
   &&!scope.confirm('Dieser importierte Spielstand aktiviert zusätzlich die eigenfinanzierte NPC-Folgeversorgung mit selbstständigen Werft-/Fracht-/Erzentscheidungen. Auch diese Automatik ausdrücklich übernehmen?'))return;
 const slot=regel===207?SLOT_W6:SLOT;
 if(auswahl==='datei'&&gespeicherte(slot)&&!scope.confirm(
   'Dieser Datei-Spielstand ersetzt NUR die gleichnamige Karriere-Speicherstelle. Die bisherige wird zuvor gesichert. Fortfahren?'))return;
 const neu=neueSitzung();
 const a=regel===207?neu.oeffnenP8g(json,true):neu.oeffnen204(json,true);
 if(a.regel!==regel||a.weltgeld!==33000)
   throw Error('Die Prüfung der Wirtschaft und des Spielstands ist fehlgeschlagen.');
 session=neu;werftAuswahlId=null;flugSchritte=0;flugSeitSicherung=0;cockpitGenutzt=false;flugerfahrung=false;patrouille=null;duell=null;
  pilotTutor?.zuruecksetzen();pilotMenu?.zeichnen();
 if(auswahl==='datei'||backup)speichern(!!gespeicherte(slot));
 aktiveSitzung(backup?'Vorherige Karriere aus dem separaten Sicherungsslot geladen.':'Willkommen zurück. Dein Spielstand wurde geprüft.');
}
function weiter(n){
 let vorher=null;
 try{
  if(n===1440){
   // Kein neuer schneller Wirtschaftstick: 24 echte, einzeln validierte 60-Minuten-Schritte.
   // Falls eine wirtschaftliche Sperre dazwischen auftritt, alten Save atomar bewahren.
   vorher=session.exportieren();
   for(let i=0;i<24;i++)session.weiterspielen(60);
  }else session.weiterspielen(n);
  if(duell?.status==='aktiv')duell.status='unterbrochen';
  if(patrouille&&['bereit','flug'].includes(patrouille.status))patrouille.status='unterbrochen';
  pilotTutor?.beobachten(session.zustandReferenz());pilotStatusAktualisieren();
  speichern();anzeigen();
  hinweis(n+' bezahlte Weltminuten vergangen. Alle Waren und Konten wurden regulär verbucht.');
 }catch(e){
  if(vorher!==null){
   try{
    const restore=neueSitzung();
    if(session?.ansicht().regel===207)restore.oeffnenP8g(vorher,true);
    else restore.oeffnen204(vorher,true);
    session=restore;anzeigen();
   }catch(restoreError){
    hinweis('Tagesfortschritt fehlgeschlagen; bitte letzte JSON-Sicherung verwenden: '+error(restoreError),true);
    return;
   }
  }
  hinweis('Zeitfortschritt verweigert: '+error(e),true);
 }
}
function auftrag(id){
 try{
  const a=session.angebote().find(x=>x.id===id);
  if(!a||!a.ok)throw Error(a?.reason||'Dieser Auftrag ist derzeit nicht verfügbar');
  // J2b binds the miner to a job. Select its lawful pilot BEFORE binding;
  // afterwards the existing fleet gate rejects a new cockpit selection.
  const siliziumSchiff=id.startsWith('sil-start-')?id.slice('sil-start-'.length):null;
  if(siliziumSchiff){
   if(!raum)throw Error('Für Siliziumarbeit ist das vorhandene Cockpit erforderlich');
   const pilot=session.uebernehmen(siliziumSchiff,raum.laeuft());
   if(!pilot.ok)throw Error(pilot.reason);
  }
  const result=session.ausfuehren(id);
  if(!result.ok)throw Error(result.reason);
  speichern();anzeigen();
  managerTutor?.gebucht(id);
  hinweis('Auftrag gebucht: '+a.label+'. Konten und Eigentümer sind neu geprüft.');
  if(siliziumSchiff)pilotieren(siliziumSchiff);
 }catch(e){hinweis('Auftrag nicht ausgeführt: '+error(e),true);}
}
const namen=[
 ['buy-st_aldera-miner','Dein erstes Bergbauschiff kaufen','Aus dem Aldera-Werftbestand für 600 ISK.'],
 ['buy-st_aldera-frachter','Frachter erwerben','Ein Transporter aus dem Aldera-Werftbestand, bezahlt aus deinem Kapital.'],
 ['buy-st_nadir-frachter','Frachter in Nadir erwerben','Nur lieferbare Schiffe aus dem Nadir-Werftbestand.'],
 ['buy-st_nadir-miner','Bergbauschiff in Nadir kaufen','Für dich vormerkbar, sobald eine fertige Schiffshülle bereitsteht.'],
 ['buy-st_nadir-jaeger','Jäger kaufen','Sobald die Nadir Schiffswerke einen vollständig finanzierten Jäger anbieten.']
];
function titel(a){return namen.find(x=>x[0]===a.id)?.[1]||(
 a.id.startsWith('ice-')?'Eisförderung beginnen':
 a.id.startsWith('stop-')?'Automatischen Pendelauftrag beenden':
 a.id.startsWith('sil-start-')?'Silizium fördern':
 a.id.startsWith('sil-sell-')?'Silizium verkaufen':
 a.id.startsWith('freight-')?'Eisfracht transportieren':
 a.id.startsWith('gate-freight-')?'Eisfracht über das Sprungtor':anzeigetext(a.label));
}
function info(a){return namen.find(x=>x[0]===a.id)?.[2]||anzeigetext(a.label);}
function datum(ms){return Math.floor(ms/1440)+' Tage · '+(ms%1440)+' Minuten';}
function missions(){
 const state=session.zustandReferenz(),mine=Object.values(state.ships).some(s=>s.owner==='house'&&s.klasse==='miner');
 const pilot=!!session.pilotStatus();
 const eigenMiner=new Set(Object.values(state.ships)
   .filter(sh=>sh.owner==='house'&&sh.klasse==='miner').map(sh=>sh.id));
 const eisBezahlt=scope.P3Handelsweg?.ersteBezahlteRundfahrt(state,session.weltReferenz())===true;
 const siliziumBezahlt=(state.kanon.silizium?.belege||[]).some(b=>b.owner==='house'
   &&eigenMiner.has(b.schiff)&&Number.isSafeInteger(b.preis)&&b.preis>0);
 return [
  {done:mine,text:'Dein erstes Bergbauschiff kaufen'},
  {done:pilot||cockpitGenutzt,text:'Ins Cockpit steigen – ein Schiff, eine Welt'},
  {done:(state.kanon.fluglohnMinuten||0)>0||flugerfahrung,text:'Abdocken und den ersten bezahlten Flug beginnen'},
  {done:eisBezahlt||siliziumBezahlt,text:'Eis oder Silizium fördern und transportieren'}
 ];
}
// P3: guiding the next REAL paid order, not adding a mission economy or save state.
function handelswegAnzeigen(s,angebote){
 const panel=$('p3-handelsauftrag');if(!panel||!scope.P3Handelsweg)return;
 const p=scope.P3Handelsweg.auswerten(s,angebote,session.weltReferenz());
 const grund=p.grund?anzeigetext(p.grund):'';
 const ausverkauft=grund==='kein Komplettschiff auf Lager';
 $('p3-handelsstand').textContent=p.abgeschlossen
   ?fmt(p.abgeschlossen)+(p.abgeschlossen===1?' bezahlte Rundfahrt':' bezahlte Rundfahrten')+
    ' · '+fmt(p.gebuehr)+' ISK Frachtgebühren · '+fmt(p.lohn)+' ISK Fluglöhne'
   :'';
 $('p3-handelszahlen').textContent='Aldera-Lager: '+fmt(p.eis)+' Eis · Verfügbare Kasse: '+
   fmt(p.hauskasse)+' ISK. Frachtgebühren und Fluglöhne bilden nur einen Teil des Ergebnisses.';
 $('p3-handelsziel').textContent=(p.abgeschlossen?'Runde '+(p.abgeschlossen+1)+': ':'Nächstes Handelsziel: ')+p.titel;
 const kaufhinweis=$('p3-kaufhinweis');
 kaufhinweis.hidden=p.aktion!=='buy-st_aldera-miner'&&p.aktion!=='buy-st_aldera-frachter';
 $('p3-handelsanleitung').textContent=ausverkauft?'':p.offen?'Die Rundfahrt endet nach der Lieferung und der Rückkehr nach Aldera.'
   :p.art==='zeit'?'Dein Miner arbeitet. Schau nach 60 Spielminuten wieder ins Lager.'
   :p.anleitung;
 const angebot=p.aktion?angebote.find(a=>a.id===p.aktion):null;
 const b=$('p3-handelsaktion');b.disabled=!p.bereit;
 b.textContent=p.art==='zeit'?'60 Spielminuten weiter':
   angebot?titel(angebot):'Kein Auftrag verfügbar';
 $('p3-handelssperre').textContent=p.marktHinweis
   ?anzeigetext(p.marktHinweis):grund?'Gesperrt: '+grund:'';
 $('p3-handelssperre-detail').textContent=grund;
}
// P3: exactly the Core's legal quote; asset view is read-only, not a second economy.
function investitionAnzeigen(s,angebote){
 const host=$('p3-investition');
 if(!host||!scope.P3Investition)return;
 const p=scope.P3Investition.auswerten(session.weltReferenz(),s,angebote);
 host.hidden=!p.sichtbar;
 if(!p.sichtbar)return;
 const vorzeichen=p.veraenderung>=0?'+':'';
 $('p3-invest-bilanz').textContent='Kasse '+fmt(p.kasse)+' ISK + Original-Schiffsbuchwerte '+
   fmt(p.buchwert)+' ISK = '+fmt(p.vermoegen)+' ISK · gegenüber der Standardstartkasse '+
   vorzeichen+fmt(p.veraenderung)+' ISK (Schiffsverschleiß berücksichtigt).';
 $('p3-invest-markt').textContent='Aldera: '+fmt(p.lagerMiner)+' Miner im echten Werftlager · '+ 
   fmt(p.alderakasse)+' ISK Käuferkasse · '+fmt(p.eis)+' Eis im Stationslager. '+
   'Diese Käufermittel können aufgebraucht werden.';
 $('p3-invest-ziel').textContent=p.art==='kaufen'?
   'Zusätzlichen Miner für '+fmt(p.preis)+' ISK erwerben oder Kapital sparen':
   p.art==='arbeiten'?'Deinen zusätzlich gekauften Miner in Arbeit schicken':
   'Zusätzlicher Miner beauftragt – reale Abnahme abwarten';
 $('p3-invest-hinweis').textContent=p.hinweis;
 const b=$('p3-invest-aktion');b.disabled=!p.bereit;
 b.textContent=p.art==='kaufen'?'Miner verbindlich kaufen ('+fmt(p.preis)+' ISK)':
   p.art==='arbeiten'?'Original-Eisförderung beauftragen':'Auftrag bereits vorhanden';
 $('p3-invest-sperre').textContent=p.grund?'Gesperrt: '+anzeigetext(p.grund):
   'Kaufen und Sparen sind deine Entscheidung. Kein kostenloses Schiff und kein garantierter Abnehmer.';
}
// P3: existing local water demand, paid ONLY from the player's personal pilot wage account.
function wasserLohnAnzeigen(s,angebote){
 const host=$('p3-wasser-kreislauf');
 if(!host||!scope.P3WasserLohn)return;
 const p=scope.P3WasserLohn.auswerten(session.weltReferenz(),s,angebote,scope.AphrosWelt.DATEN);
 host.hidden=!p.sichtbar;
 if(!p.sichtbar)return;
 $('p3-wasser-zahlen').textContent='Privater Pilotenlohn: '+fmt(p.lohn)+
   ' ISK · Aldera-Wasserlager: '+fmt(p.wasser)+' Einheiten · Wasserpreis: '+
   fmt(p.preis)+' ISK · Aldera-Käuferkasse: '+fmt(p.kaeuferKasse)+' ISK.';
 $('p3-wasser-bedarf').textContent=p.fehlbetrag>0
  ?'Nächste Eischarge: '+fmt(p.eisKosten)+' ISK erforderlich. Aktuell fehlen '+
    fmt(p.fehlbetrag)+' ISK. '+fmt(p.zielMenge)+' wirklich vorhandene Einheiten Wasser kosten '+
    fmt(p.zielKosten)+' ISK aus deinem PRIVATEN Pilotenlohn.'
  :'Die nächste Original-Eischarge ist derzeit bereits finanzierbar. Du darfst deinen Lohn behalten.';
 const b=$('p3-wasser-aktion');b.disabled=!p.zielBereit;
 b.textContent=p.fehlbetrag>0
  ?fmt(p.zielMenge)+' Wasser für '+fmt(p.zielKosten)+' ISK privat kaufen'
  :'Kein Käuferengpass – Lohn sparen';
 const klein=$('p3-wasser-klein');klein.disabled=!p.kleinBereit;
 klein.textContent='Freiwillig 1 Wasser für '+fmt(p.preis)+' ISK kaufen';
 $('p3-wasser-grund').textContent=(p.fehlbetrag>0&&!p.zielBereit?'Gesperrt: ':'')+
  anzeigetext(p.grund)+(p.fehlbetrag>0&&!p.zielBereit&&p.kleinBereit
    ?' Eine einzelne Einheit kannst du weiterhin legal kaufen.':'');
}
// P3 chapter 05: NPC household demand is already core-financed. Real choices
// are the normal financed F4 contract and the existing paid 60-minute clock.
function npcMarktAnzeigen(s,angebote){
 const host=$('p3-npc-markt');
 if(!host||!scope.P3NPCMarkt)return;
 const p=scope.P3NPCMarkt.auswerten(session.weltReferenz(),s,angebote,scope.AphrosWelt.DATEN);
 host.hidden=!p.sichtbar;
 if(!p.sichtbar)return;
 $('p3-npc-geld').textContent='Bisherige NPC-Wasserkäufe: Aldera '+fmt(p.npcWasserAl)+
  ' ISK · Nadir '+fmt(p.npcWasserNadir)+' ISK · reale Dividenden an NPC-Haushalte: '+
  fmt(p.npcDividenden)+' ISK.';
 $('p3-npc-ware').textContent='Aldera: '+fmt(p.alderakasse)+' ISK Käuferkasse · '+
  fmt(p.eis)+' Eis · '+fmt(p.wasser)+' Wasser. Nadir: '+fmt(p.nadirkasse)+
  ' ISK · '+fmt(p.wasserNadir)+' Wasser.';
 $('p3-npc-frachter').textContent='Asterion-Frachter: '+fmt(p.npcFrachter)+
  ' insgesamt, '+fmt(p.freiNpcFrachter)+' derzeit frei in Aldera. Deine bezahlten Frachter: '+
  fmt(p.eigeneFrachter)+'.';
 $('p3-npc-ziel').textContent=p.art==='fracht'?
  'Übernimm die tatsächlich angebotene Eisfracht mit deinem eigenen Schiff':
  'NPC-Markt beobachten: Einnahmen, Waren und echte Transportangebote';
 const button=$('p3-npc-aktion');
 button.disabled=!p.bereit;
 button.textContent=p.art==='fracht'?'Vorfinanzierte Original-Fracht annehmen':
  '60 reguläre Wirtschaftsminuten fortsetzen';
 $('p3-npc-grund').textContent=p.grund+
  (p.mangel?' Spielerangebot: '+anzeigetext(p.mangel):'')+
  (p.naechsteAbrechnung!==null?' · Nächste planmäßige Dividendenprüfung in '+
   fmt(p.naechsteAbrechnung)+' Minuten (keine Zahlungsgarantie).':'');
}
// W6/P3: read-only signed NPC hull/shipyard receipts. Never controls foreign wallets.
function npcWerftAnzeigen(s){
 const host=$('p3-npc-werft');
 if(!host||!scope.P3NPCWerft)return;
 const p=scope.P3NPCWerft.auswerten(session.weltReferenz(),s);
 host.hidden=!p.sichtbar;
 if(!p.sichtbar)return;
 $('p3-npc-werft-kassen').textContent='Asterion: '+fmt(p.transportGeld)+' ISK eigenes Firmenkapital · Nadir-Werft: '+
   fmt(p.werftGeld)+' ISK. Original-Frachterpreis '+fmt(p.preis)+
   ' ISK, eigenfinanzierte Überführung '+fmt(p.ferryCost)+' ISK.';
 $('p3-npc-werft-flotte').textContent='Asterion besitzt '+fmt(p.gesamtFlotte)+
   ' Frachter, davon '+fmt(p.fahrbereit)+' nicht vollständig verschlissen und '+
   fmt(p.freiAldera)+' frei am Aldera-Dock. '+fmt(p.werftherkunft)+
   ' dieser Frachter stammen aus nachweislich gebauten W5-Hüllen; '+fmt(p.ueberfuehrt)+
   ' abgeschlossene Originalüberführungen.';
 $('p3-npc-werft-auftrag').textContent='Nadir-Werft: '+fmt(p.werftGebaut)+
   ' produzierte Hüllen, '+fmt(p.nadirStock)+' Frachter im Verkaufs-Lager, '+
   fmt(p.nadirMaterial)+' Material, '+fmt(p.nadirErz)+' Erz. Gründungslager Aldera: '+
   fmt(p.alderaStock)+' Frachter. Tatsächlich gebuchte Ersatzkäufe aller Schiffsklassen: '+
   fmt(p.ersatzInsgesamt)+'.';
 const location=p.angebot.station==='st_nadir'?'Nadir':'Aldera';
 $('p3-npc-werft-grund').textContent=p.angebot.ok?
   'Ein Original-Frachterkauf durch Asterion wäre derzeit am '+location+
   '-Dock grundsätzlich gedeckt. Die Entscheidung trifft ausschließlich die NPC-Politik.':
   'Original-Frachterkauf '+location+' derzeit nicht möglich: '+
   anzeigetext(p.angebot.grund||'Werftbestand oder eigenes Firmenkapital unzureichend')+
   (p.engpass?' · Bereits dokumentierter Engpass: '+anzeigetext(p.engpass):'');
}
// P3 Kapitel 06: original financed W3-W4-W5 production and only a legal house purchase.
function industrieAnzeigen(s,angebote){
 const host=$('p3-industrie');if(!host||!scope.P3Industrie)return;
 const p=scope.P3Industrie.auswerten(session.weltReferenz(),s,angebote,werftAuswahlId);
 host.hidden=!p.sichtbar;if(!p.sichtbar)return;
 // Never turn a stale/foreign ID into an owner command after a career reload.
 werftAuswahlId=p.werftSpielerSchiffId;
 const select=$('p3-industrie-auswahl'),shipLabel=$('p3-industrie-auswahl-label');
 const ships=p.werftFrachter;
 select.hidden=shipLabel.hidden=ships.length===0;
 select.disabled=ships.length<2;
 select.replaceChildren(...ships.map(sh=>{
  const option=d.createElement('option');
  option.value=sh.id;
  option.textContent=sh.id+' · '+(sh.ort==='aldera'?'Aldera':sh.ort==='nadir'?'Nadir':sh.ort)+
   ' · '+(sh.phase==='dock'?'am Dock':sh.phase==='reise'?'unterwegs':sh.phase)+
   ' · '+fmt(sh.buchwert)+' ISK Buchwert';
  return option;
 }));
 if(p.werftSpielerSchiffId)select.value=p.werftSpielerSchiffId;
 $('p3-industrie-phase').textContent=p.stage+' · '+p.produktionslage;
 $('p3-industrie-w3').textContent='W3 Transport: '+fmt(p.w3Vertraege)+
  ' vollständig bezahlte Erzfrachten mit '+fmt(p.w3Geliefert)+' geliefertem Erz ('+
  fmt(p.w3ProCharge)+' je Vertrag). Nadir lagert '+fmt(p.erzNadir)+
  ' Erz, Aldera '+fmt(p.erzAldera)+'.';
 $('p3-industrie-w4').textContent='W4 Raffinerie: '+fmt(p.w4Chargen)+
  ' fertige bezahlte Chargen, '+fmt(p.w4ErzVerbraucht)+' Erz verbraucht und '+
  fmt(p.w4Material)+' Material erzeugt. Originalrezept: '+fmt(p.w4RezeptErz)+
  ' Erz → '+fmt(p.w4RezeptMaterial)+' Material.';
 $('p3-industrie-w5').textContent='W5 Schiffbau: '+fmt(p.w5Gebaut)+
  ' fertige Frachter aus '+fmt(p.w5MaterialVerbraucht)+' verarbeitetem Material ('+
  fmt(p.w5MaterialJeSchiff)+' Material je Hülle). Im Nadir-Lager: '+
  fmt(p.materialNadir)+' Material, '+fmt(p.hullenNadir)+' verkäufliche Hüllen.';
 $('p3-industrie-kassen').textContent='Kassen: Nadir '+fmt(p.nadirKasse)+
  ' ISK · Werft '+fmt(p.werftKasse)+' ISK · Asterion '+fmt(p.frachtKasse)+
  ' ISK · Dein Konzern '+fmt(p.hausKasse)+' ISK.';
 const b=$('p3-industrie-kauf');b.disabled=!p.kaufberechtigt;
 b.textContent='Vorhandene Nadir-Hülle für '+fmt(p.hausKaufpreis)+' ISK kaufen';
 $('p3-industrie-hinweis').textContent=p.kaufberechtigt
  ?'Eine real gefertigte und noch nicht verkaufte Hülle gehört nach dem Kauf deinem Konzern. Nadir und Asterion können sie dann nicht mehr kaufen.'
  :'Privater Original-Kauf aktuell gesperrt: '+anzeigetext(p.hausKaufgrund||
    'Keine bezahlbare frei verfügbare Werfthülle; Lager und Finanzierung bleiben endlich.');
 const cockpit=$('p3-industrie-cockpit'),note=$('p3-industrie-cockpit-hinweis'),
  transfer=$('p3-industrie-transfer');
 const eigeneId=p.werftSpielerSchiffId;
 const frei=eigeneId?session.piloten().find(x=>x.id===eigeneId):null;
 const steuerbar=!!eigeneId&&!!raum&&!p.werftTransferAktiv&&
  (frei?.erlaubt===true||session.pilotStatus()===eigeneId);
 const transferSichtbar=!!eigeneId&&p.werftSpielerOrt==='nadir';
 transfer.hidden=!transferSichtbar;
 transfer.disabled=!p.werftTransferBereit;
 transfer.textContent='Eigene Werfthülle '+(eigeneId||'')+' nach Aldera überführen'+
  (p.werftTransferBereit?' · '+fmt(p.werftTransferKosten)+' ISK für '+
    fmt(p.werftTransferMinuten)+' bezahlte Flugminuten':' · derzeit gesperrt');
 const strecke=$('p3-industrie-strecke');
 strecke.hidden=!transferSichtbar;
 strecke.textContent=transferSichtbar
  ?'Strecke Nadir–Aldera jetzt: '+(p.werftStreckeBelegt
    ?p.werftStreckenAuftraege.join(' · '):'kein aktiver W3-/W5n-/W5ac-Auftrag')+
   '. Original-Überführung für '+eigeneId+': '+
   (p.werftTransferBereit?'freigegeben – wird beim Klick erneut geprüft.'
    :'gesperrt – '+anzeigetext(p.werftTransferGrund||'kein freigegebenes Originalangebot')+
     '. Weitere Weltzeit kann den Status ändern, garantiert aber kein freies Zeitfenster.')
  :'';
 cockpit.hidden=!eigeneId;cockpit.disabled=!steuerbar;
 cockpit.textContent=eigeneId?'Werftfrachter '+eigeneId+' selbst fliegen':'Eigenen Werftfrachter selbst fliegen';
 const freight=$('p3-industrie-fracht');
 const freightStand=$('p3-industrie-frachtzahlen'),freightGrund=$('p3-industrie-frachtgrund');
 freight.hidden=!eigeneId;freight.disabled=!p.werftFrachtBereit;
 freight.textContent='50 Eis mit Werftfrachter '+(eigeneId||'')+' transportieren (Original-F4)';
 freightStand.hidden=!eigeneId;
 freightStand.textContent=eigeneId
  ?'Eigene Werftfracht: '+fmt(p.werftFrachtRunden)+' abgeschlossene Runden · '+
   fmt(p.werftFrachtTarife)+' ISK gebuchte Frachttarife · '+
   fmt(p.werftFrachtLoehne)+' ISK bezahlte Fracht-Pilotenlöhne · '+
   fmt(p.werftFrachtBeitragVorWertverzehr)+' ISK vor Wertverzehr und sonstigen Kosten. '+
   'Aktueller Original-Schiffsbuchwert '+fmt(p.werftFrachtBuchwert)+' ISK.'
  :'';
 freightGrund.hidden=!eigeneId;
 freightGrund.textContent=eigeneId
  ?p.werftFrachtBereit?'Echt vorfinanzierter Originalauftrag verfügbar. Käufer- und Pilotengeld werden beim Start gebunden.'
   :'Neuer F4-Auftrag gesperrt: '+anzeigetext(p.werftFrachtGrund||
    (p.werftTransferAktiv?'Die bezahlte Werftüberführung läuft noch.':
      'Nur ein eigener, freier und wirklich angedockter Frachter in Aldera darf die Ladung übernehmen.'))
  :'';
 note.hidden=!eigeneId;
 note.textContent=steuerbar
  ?'Echte bezahlte Werfthülle. Das bestehende 2D-Cockpit steuert sie in derselben Welt.'
  :p.werftTransferAktiv
   ?'Bezahlte Original-Überführung läuft. Bis zur echten Ankunft in Aldera keine freie Steuerung.'
   :'Cockpit derzeit gesperrt: '+anzeigetext(frei?.grund||'Schiffwechsel nicht freigegeben')+
    (transferSichtbar
     ?'. Original-Überführung: '+(p.werftTransferBereit
       ?'durch eigenen bezahlten Auftrag verfügbar'
       :anzeigetext(p.werftTransferGrund||'Finanzierung, W3-Fracht oder Transportkapazität nicht frei'))
     :'');
}
// J12: read-only station and company report from the SAME validated Rule204 session.
// No separate economy, NPC signatures, speculative prices, or unvalidated purchase paths.
function tabZeigen(name){
 if(!['auftraege','flotte','universum','jaeger'].includes(name))return;
 for(const p of ['auftraege','flotte','universum','jaeger']){
  $('panel-'+p).hidden=p!==name;
  $('tab-'+p).setAttribute('aria-pressed',String(p===name));
 }
}
function wirtschaftsbericht(a,s,angebote){
 const host=$('sektorwirtschaft');
 if(!host)return;
 const section=(label)=>{
  const block=d.createElement('section'),h=d.createElement('h4');
  block.className='economy-section';h.textContent=label;block.append(h);return block;
 };
 const karte=(parent,name,zeilen)=>{
  const card=d.createElement('article'),h=d.createElement('h5');
  card.className='economy-card';h.textContent=name;card.append(h);
  for(const [key,value] of zeilen){
   const line=d.createElement('div'),k=d.createElement('span'),v=d.createElement('strong');
   line.className='economy-line';k.textContent=key;v.textContent=value;
   line.append(k,v);card.append(line);
  }
  parent.append(card);return card;
 };
 const lager=section('Stationen · physische Bestände');
 for(const st of a.stationen){
  const cash=s.owners[st.id]?.cash;
  karte(lager,konzernname(st.id)+' · '+st.system,[
   ['Lager',st.lager],
   ['Eigene Stationskasse',Number.isSafeInteger(cash)?fmt(cash)+' ISK':'Kein eigenes Konto']
  ]);
 }
 const firmen=section('Unabhängige Unternehmen');
 for(const id of ['npc3','transport','werft_extern']){
  const owner=s.owners[id];if(!owner)continue;
  const schiffe=Object.values(s.ships).filter(x=>x.owner===id);
  const klassen=[...new Set(schiffe.map(x=>x.klasse))].sort()
    .map(klasse=>klasse+': '+schiffe.filter(x=>x.klasse===klasse).length).join(' · ')||'Keine eigenen Schiffe';
  karte(firmen,konzernname(id),[['Firmenkasse',fmt(owner.cash)+' ISK'],
   ['Eigene Flotte',klassen]]);
 }
 const werft=section('Werft · tatsächlich geprüfte Kaufangebote');
 const kauf=angebote.filter(o=>namen.some(n=>n[0]===o.id));
 for(const angebot of kauf){
  const card=karte(werft,titel(angebot),[
   ['Verfügbarkeit',angebot.ok?'Kauf derzeit möglich':'Gesperrt'],
   ['Begründung',angebot.ok?info(angebot):anzeigetext(angebot.reason||'Kauf derzeit nicht möglich')]
  ]);
  if(angebot.ok){
   const link=d.createElement('button');
   link.type='button';link.className='economy-go';link.dataset.j12Offer=angebot.id;
   link.textContent='Kaufangebot öffnen';
   link.addEventListener('click',()=>{
    tabZeigen('auftraege');
    const target=[...$('spieleraktionen').querySelectorAll('[data-action]')]
      .find(x=>x.dataset.action===angebot.id);
    target?.focus();
   });
   card.append(link);
  }
 }
 const footer=d.createElement('p');
 footer.className='economy-foot';
 footer.textContent='Geld im Universum: '+fmt(a.weltgeld)+' ISK · Neu ausgegebene ISK: '+fmt(s.minted)+
  ' · Eingezogene ISK: '+fmt(s.burned)+
  '. Kaufangebote können sich ändern und werden beim Kauf erneut geprüft.';
 host.replaceChildren(lager,firmen,werft,footer);
}
// J13 – alle Voraussetzungen werden nur gelesen; ein Kauf folgt ausschliesslich
// dem bereits vorhandenen, unmittelbar erneut geprueften house-Originalauftrag.
function jaegerBeitraege(){
 const projekt=scope.J13Spielerprojekt.erstellen(session);
 $('jaeger-beitrag-hinweis').textContent=anzeigetext(projekt.hinweis);
 const host=$('jaeger-beitrag-aktionen'),blocks=[];
 for(const gruppe of projekt.gruppen){
  const section=d.createElement('section'),h=d.createElement('h5');
  h.textContent=anzeigetext(gruppe.titel);section.append(h);
  for(const a of gruppe.angebote){
   const box=d.createElement('div'),b=d.createElement('button'),p=d.createElement('small');
   box.className='order';b.type='button';b.dataset.j13Action=a.id;
   b.textContent=titel(a);b.disabled=!a.ok;
   p.textContent=anzeigetext(a.label+' · '+(a.ok?'Auftrag verfügbar':'Gesperrt: '+a.reason));
   b.addEventListener('click',()=>auftrag(a.id));box.append(b,p);section.append(box);
  }
  blocks.push(section);
 }
 host.replaceChildren(...blocks);
 $('jaeger-rohstoffe').textContent='Eigene belegte Siliziumverkäufe: '+projekt.silizium.eigeneVerkaeufe+
   ' · Alle Siliziumverkäufe an Nadir: '+projekt.silizium.verkauft+'.';
 $('jaeger-sperren').replaceChildren(...projekt.sperren.map(s=>{
  const p=d.createElement('p');p.textContent=s.titel+' · Eigentümer: '+konzernname(s.eigentuemer)+
   ' · Dein Konzern: '+anzeigetext(s.ok?'Auftrag verfügbar':s.grund);return p;
 }));
 const a=projekt.aldera;
 $('jaeger-finanzierung').textContent='Neuer Erzankauf: Aldera besitzt '+fmt(a.kasse)+
  ' von '+fmt(a.erzkauf)+' ISK; aktuell fehlen '+fmt(a.fehlend)+
  ' ISK. Diese Liquiditätsprüfung ersetzt keine Firmenzustimmung. '+
  (a.fehlend>0?'Für diesen Erzankauf fehlt aktuell echte Kaufkraft.':
   'Die Kasse deckt den reinen Erzankauf; Vertrag, Lager und Firmenrechte bleiben gesondert zu prüfen.');
}
function jaegerBericht(zustand,angebote){
 if(!scope.J13Werftakte)throw Error('J13: die originale Produktionsakte fehlt');
 const kauf=angebote.find(a=>a.id==='buy-st_nadir-jaeger');
 const akte=scope.J13Werftakte.erstellen(session.weltReferenz(),zustand,kauf);
 const host=$('jaeger-akte'),stufen=d.createElement('ol');
 stufen.className='jaeger-schritte';
 for(const step of akte.schritte){
  const li=d.createElement('li'),h=d.createElement('strong'),p=d.createElement('p'),tag=d.createElement('span');
  li.className='jaeger-schritt';li.dataset.stand=step.stand;
  h.textContent=anzeigetext(step.titel);p.textContent=anzeigetext(step.hinweis);
  tag.className='jaeger-stand';tag.textContent=step.stand==='erfuellt'?'Vorhanden':
    step.stand==='laeuft'?'In Arbeit':step.stand==='bereit'?'Kaufbereit':'Noch offen';
  li.append(h,tag,p);stufen.append(li);
 }
 const k=d.createElement('p');
 k.className='economy-foot';
 k.textContent='Erzliefervertrag: '+akte.k7.phase+
   (akte.k7.erzkauf!==null&&akte.k7.alderaKasse!==null
     ?' · Aldera '+fmt(akte.k7.alderaKasse)+' / '+fmt(akte.k7.erzkauf)+' ISK fuer einen neuen Erzankauf'
     :'')+'. Das ist eine Statusauskunft, keine Unterschrift.';
 host.replaceChildren(stufen,k);
 const button=$('jaeger-kaufweg');
 button.disabled=!akte.kauf.ok;
 $('jaeger-autoritaet').textContent=akte.eigeneJaeger>0
  ?'Bereits gekaufter Jäger: '+akte.eigeneJaeger+' · Eigentum und Cockpit über „Meine Flotte“.'
  :akte.kauf.ok
    ?'Jägerkauf für '+fmt(akte.kauf.preis)+' ISK möglich. Der Button öffnet nur die bestehende Kaufansicht.'
    :'Kein Kauf: '+(akte.kauf.grund||'keine vollständige finanzierte Hülle')+
     '. Nur Nadir darf die Werftarbeit beauftragen. Aufträge fremder Unternehmen bleiben gesperrt.';
}
// P8a: Transparenz der TATSAECHLICHEN Quelle statt erfundener Nachschuborder.
function siliziumBericht(zustand){
 if(!scope.P8SiliziumVersorgung)throw Error('P8a: lesender Versorgungspruefer fehlt');
 const lage=scope.P8SiliziumVersorgung.erstellen(session.weltReferenz(),zustand);
 const host=$('p8-silizium-lage');
 if(!host)return;
 const zeile=(titel,info)=>{
  const p=d.createElement('p'),b=d.createElement('strong');
  b.textContent=titel+': ';p.append(b,d.createTextNode(info));return p;
 };
 const f=lage.rohstoff,l=lage.lager,g=lage.finanzierung,w=lage.weg;
 const beschaffung=zustand.rulesVersion===207
  ?'Experimentelle Dravos-Karriere: begrenzte Rohstofffelder, bezahlte Fracht und Eigentümerverträge. Lieferungen nur bei vorhandener Ware, Kapazität und zahlungsfähigem Käufer.'
  :w.dravosAktiv
   ?'Ein weiteres System ist bekannt, aber dort ist noch kein bezahlter Silizium-Frachtvertrag eingerichtet.'
   :'Dravos ist auf der Karte, aber noch kein aktives Förder- oder Frachtziel. Neue begrenzte Rohstoffquellen sind noch nicht erschlossen.';
 host.replaceChildren(
  zeile('Endliches Nadir-Feld',fmt(f.rest)+' / '+fmt(f.gesamt)+' Silizium verbleiben · '+fmt(f.gefoerdert)+
   ' physisch gefoerdert · '+fmt(f.verkauft)+' bezahlt an Nadir verkauft · '+fmt(f.moeglicheNeueChargen)+
   ' volle '+fmt(f.charge)+'er-Chargen im Boden'),
  zeile('Vorhandene Ware',fmt(l.siliziumNadir)+' Silizium im Nadir-Lager · '+
   fmt(l.siliziumSchiffe)+' in echten Schiffsraeumen · '+fmt(l.bauteileNadir)+' fertige Bauteile · '+
   fmt(l.jaegerNadir)+' verkaufsfaehige Jaeger · '+fmt(l.fertigeJaeger)+' Jaeger gesamt gebaut'),
  zeile('Laufender Abbau',f.auftrag?
   'Eigentümer '+konzernname(f.auftrag.owner)+' · Bergbauschiff '+f.auftrag.schiff+' · '+
   fmt(f.auftrag.gefoerdert)+' / '+fmt(f.auftrag.menge)+' Einheiten wirklich gefoerdert'
   :'Kein laufender Förderauftrag'),
  zeile('Kosten einer weiteren Fördercharge',
   fmt(g.arbeitJeCharge)+' ISK Bergbaulohn · '+fmt(g.ankaufJeCharge)+
   ' ISK Nadir-Ankauf · mindestens '+fmt(g.flugreserve)+
   ' ISK Flugreserve bei neuer Ausfahrt. Kassen: '+konzernname('npc3')+' '+fmt(g.npc3Kasse)+
   ' ISK, Nadir '+fmt(g.nadirKasse)+' ISK; eigene bezahlte Nadir-Miner: '+
   fmt(g.anzahlRechtmaessigerNpcNadirMiner)+'. Das ist keine bindende Kaufzusage.'),
  zeile('Weitere Siliziumfelder im aktiven Kern',fmt(w.fremdeAktiveSiliziumFelder)+
   ' · '+beschaffung),
  zeile('Lieferstatus',lage.stand)
 );
 if(zustand.rulesVersion===207){
   const w=session.weltReferenz(),k=zustand.kanon,warehouse=zustand.stations.st_nadir.lager;
   const dravos=Object.entries(k.silizium?.felder||{}).filter(([id])=>id.startsWith('dravos:'));
   const rest=dravos.reduce((n,[,f])=>n+(Number.isSafeInteger(f.vorrat)?f.vorrat:0),0);
   const transport=Object.values(zustand.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
   const alderadock=transport.filter(sh=>sh.system==='aldera'
     &&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
     &&Object.values(sh.ladung||{}).every(n=>n===0)&&w.buchwert(zustand,sh.id)>0);
   const phase=k.industrieErz?.phase||'frei',fr=k.p8d;
   host.append(
     zeile('Endliche Dravos-Bodenreserve',fmt(rest)+' echte Siliziumeinheiten, kein automatisches Auffüllen'),
     zeile('Bezahlte Dravos-Fracht',fmt(fr?.geliefert||0)+' abgeschlossene Lieferungen · '
       +fmt(fr?.angebote||0)+' veröffentlichte Angebote; neue Frachten nur gegen reale Kasse und Ware'),
     zeile('Materialauftrag',phase+(k.industrieErz?.materialOnly?' · ohne verpflichtenden Frachterneubau':'')
       +' · '+fmt(zustand.w3.abgeschlossen)+' W3-Lieferungen insgesamt'),
     zeile('Nadir-Industrie',fmt(warehouse.erz||0)+' Erz · '+fmt(warehouse.material||0)
       +' Material · '+fmt(warehouse.silizium||0)+' Silizium · '
       +fmt(k.bauteile.abgeschlossen)+' hergestellte Bauteile · '+fmt(k.jaeger.fertig)+' gebaute Jäger'),
     zeile('Frachtkapazität in Aldera',fmt(alderadock.length)+' leere, angedockte Speditionsfrachter mit Restbuchwert; dies allein ist noch keine finanzierte Vertragszusage')
   );
   const ersatz=lage.frachtErsatz;
   if(ersatz)host.append(
     zeile('W6 · Ersatz- und Transportlage',
       fmt(ersatz.alderaBereit)+' freie Original-Frachter in Aldera · '+
       fmt(ersatz.nadirBereit)+' unüberführte Hüllen bei der Spedition in Nadir · '+
       fmt(ersatz.fertigeHuellenNadir)+' fertige Frachter im Nadir-Lager'),
     zeile('Industrielle Materialreserve',
       fmt(ersatz.materialNadir)+' Material vorhanden · '+fmt(ersatz.materialFuerJ3J4UndW5)+
       ' Material als kombinierter Rechenbedarf für J3, J4 und W5 · '+
       fmt(ersatz.materialLuecke)+' Differenz. Dies ist eine Planungshilfe, kein neuer Auftragszwang.'),
     zeile('Eigenständige Firmenkassen',
       'Spedition '+fmt(ersatz.speditionKasse)+' ISK · Werft '+fmt(ersatz.werftKasse)+
       ' ISK. Keine dieser Kassen gehört deinem Konzern.'),
     zeile('Nächster wirtschaftlicher Engpass',ersatz.hinweis)
   );
 }
}
function anzeigen(){
 if(!session)return;
 const a=session.ansicht(),s=session.zustandReferenz();
 const p8hControls=$('w6-p8h-controls'),p8hTaste=$('w6-p8h-toggle'),p8hStatus=$('w6-p8h-status');
 if(p8hControls&&p8hTaste&&p8hStatus){
   p8hControls.hidden=s.rulesVersion!==207;
   if(s.rulesVersion===207){
     const aktiv=s.kanon.npcMaterialKette===true;
     p8hTaste.textContent=aktiv?'NPC-Folgeversorgung pausieren':'Eigenfinanzierte NPC-Folgeversorgung aktivieren';
     p8hStatus.textContent=aktiv
       ?'Aktiv: Nadir, Spedition und Bergbau entscheiden mit eigenem Kapital und echten Originalaufträgen. Kein garantierter Verkauf, keine Gratisressourcen.'
       :'Aus: Bisherige Regel207-Wirtschaft ohne zusätzliche Frachter- und Erz-Disposition. Aktivierung speichert eine eigene W6-Forschungsentscheidung.';
   }
 }
 // Status stammt ausschließlich aus dem gespeicherten Core, nicht aus einem UI-Schalter.
 const w6Status=$('w6-status');
 if(w6Status){w6Status.hidden=!(s.kanon.npcAuto===true&&s.kanon.npcSilizium?.aktiv===true);
   w6Status.textContent=s.rulesVersion===207?'Experimentelle Dravos-Karriere aktiv':'Erweiterte Wirtschaft aktiv';}
 $('hausgeld').textContent=fmt(a.hausgeld)+' ISK';
 $('zeit').textContent=datum(a.tick);
 $('weltgeld').textContent=fmt(a.weltgeld)+' ISK';
 $('aldera-kasse').textContent=fmt(s.owners.st_aldera.cash)+' ISK';
 $('nadir-kasse').textContent=fmt(s.owners.st_nadir.cash)+' ISK';
 $('schiff-anzahl').textContent=String(a.schiffe.length);
 const mission=missions();
 $('missions').replaceChildren(...mission.map(m=>{
   const li=d.createElement('li');li.textContent=m.text;if(m.done)li.className='done';return li;
 }));
 $('missions-text').textContent=mission.every(m=>m.done)
   ?'Du hast die ersten Etappen gemeistert. Die Wirtschaft gehört niemandem allein – dein nächster Auftrag liegt bei dir.'
   :mission.find(m=>!m.done).text;
 const allowed=new Set(namen.map(n=>n[0]));
 const alleAngebote=session.angebote();
 const offers=alleAngebote.filter(o=>allowed.has(o.id)
   ||/^(ice-|stop-|sil-start-|sil-sell-|freight-|gate-freight-)/.test(o.id));
 $('spieleraktionen').replaceChildren(...offers.map(o=>{
  const box=d.createElement('div'),button=d.createElement('button'),small=d.createElement('small');
  box.className='order';
  button.type='button';button.dataset.action=o.id;button.textContent=titel(o);button.disabled=!o.ok;
  small.textContent=o.ok?info(o):'Zurzeit gesperrt: '+anzeigetext(o.reason);
  if(o.ok)small.className='available';
  button.addEventListener('click',()=>auftrag(o.id));
  box.append(button,small);return box;
 }));
 handelswegAnzeigen(s,alleAngebote);
 investitionAnzeigen(s,alleAngebote);
 wasserLohnAnzeigen(s,alleAngebote);
 npcMarktAnzeigen(s,alleAngebote);
 npcWerftAnzeigen(s);
 industrieAnzeigen(s,alleAngebote);
 wirtschaftsbericht(a,s,alleAngebote);
 jaegerBericht(s,alleAngebote);
 jaegerBeitraege();
 siliziumBericht(s);
 const pilots=session.piloten();
 const own=a.schiffe;
 $('spielerschiffe').replaceChildren(...(own.length?own.map(sh=>{
   const box=d.createElement('div'),h=d.createElement('strong'),p=d.createElement('p'),b=d.createElement('button');
   box.className='ship';h.textContent=sh.klasse.toUpperCase()+' · '+sh.id;
   p.textContent='Ort: '+sh.system+' · '+sh.flug+' · Ladung: '+sh.ladung;
   const pilot=pilots.find(x=>x.id===sh.id);
   b.type='button';b.textContent='Selbst fliegen →';b.dataset.pilot=sh.id;
   const bereitsPilot=session.pilotStatus()===sh.id;
   b.disabled=(!pilot?.erlaubt&&!bereitsPilot)||!raum;
   b.addEventListener('click',()=>pilotieren(sh.id));
   if(!pilot?.erlaubt&&!bereitsPilot){const m=d.createElement('small');m.textContent=anzeigetext(pilot?.grund||'Cockpit für diese Schiffsklasse noch nicht verfügbar');box.append(h,p,b,m);}
   else box.append(h,p,b);
   return box;
 }):[(()=>{const p=d.createElement('p');p.textContent='Deine Flotte ist noch leer. Kaufe dein erstes Bergbauschiff in Aldera.';return p;})()]));
 managerTutor?.auffrischen();
 pilotMenu?.zeichnen();
}
function pilotieren(id){
 try{
  if(!raum)throw Error('2D-Cockpit steht nicht zur Verfügung');
  const vorher=session.pilotStatus();
  const r=session.uebernehmen(id,raum.laeuft());
  if(!r.ok)throw Error(r.reason);
  if(vorher!==id&&duell?.status==='aktiv')duell.status='abgebrochen';
  cockpitGenutzt=true;speichern();raum.sitzungGewechselt();
  pilotTutor?.beobachten(session.zustandReferenz());pilotMenu?.zeichnen();pilotStatusAktualisieren();
  screen('raumbereich');raum.aktivieren();
  hinweis('Du steuerst jetzt '+id+'. Das Schiff bleibt in der ursprünglichen Welt.');
 }catch(e){hinweis('Cockpit gesperrt: '+error(e),true);}
}
function saveDownload(){
 if(!session)return;
 try{
  const json=session.exportieren(),url=scope.URL.createObjectURL(new Blob([json],{type:'application/json;charset=utf-8'}));
  const a=d.createElement('a');a.href=url;a.download='aphros-void-karriere-'+session.ansicht().tick+'.json';
  d.body.append(a);a.click();a.remove();
  scope.setTimeout(()=>scope.URL.revokeObjectURL(url),1000);
  hinweis('Deine geprüfte Karriere wurde als eigene JSON-Datei bereitgestellt.');
 }catch(e){hinweis('Export nicht möglich: '+error(e),true);}
}
function retour(ziel){
 if(raum)raum.deaktivieren();
 if(session){speichern();screen('spielwelt');hinweis('Wieder auf der Kommandobrücke. Die Welt ist angehalten.');}
 else screen('startseite');
}
function cockpitBinden(){
 if(!scope.RaumCockpit||!scope.RaumSzene||!scope.RaumGrafik)return;
 try{
  raum=scope.RaumCockpit.verbinden({
   welt:()=>session?session.weltReferenz():null,
   zustand:()=>session?session.zustandReferenz():null,
   jaeger:()=>session?session.pilotStatus():null,
   bojen:scope.J4dPatrouille?scope.J4dPatrouille.TORE:[],
   patrouille:()=>patrouille,
   patrouilleStand:()=>scope.J4dPatrouille
     ?scope.J4dPatrouille.stand(patrouille):{status:'nicht gestartet',erreicht:0},
   duellStand:()=>duell&&scope.J4eDuell?scope.J4eDuell.stand(duell):null,
   // J11: transfer control through the same session, never by a second player world.
   uebernehmen:(id,spielt)=>session.uebernehmen(id,spielt),
   // Authoritative funding quotes on temporary audited clones; no NPC impersonation.
   angebot:cmd=>session.flugAngebot(cmd),
   schritte:n=>{
      const beobachtbar=(patrouille&&['bereit','flug'].includes(patrouille.status))||duell?.status==='aktiv';
      const beobachten=beobachtbar?probe=>{
        if(patrouille&&['bereit','flug'].includes(patrouille.status)){
          try{scope.J4dPatrouille.beobachten(patrouille,probe);}
          catch(_){patrouille.status='unterbrochen';}
        }
        if(duell?.status==='aktiv'){
          try{scope.J4eDuell.beobachten(session.weltReferenz(),probe,duell);}
          catch(_){duell.status='unterbrochen';}
        }
      }:undefined;
      const beobachtet=pilotTutor?.stand().status==='aktiv';
      const minutes=session.flugSchritte(n,beobachten,beobachtet?original=>{
        pilotTutor.beobachten(original);
        pilotStatusAktualisieren();
      }:undefined);
      if(beobachtet)pilotMenu?.aktualisieren();
      flugSchritte+=n;flugSeitSicherung+=minutes;
      if(minutes>0)flugerfahrung=true;
      if(flugSeitSicherung>=5){flugSeitSicherung=0;speichern();}
      return minutes;
   },
   ausfuehren:cmd=>{
     const r=session.flugBefehl(cmd);
     if(r.ok){
       flugerfahrung=true;
       pilotTutor?.beobachten(session.zustandReferenz());
       pilotMenu?.aktualisieren();pilotStatusAktualisieren();speichern();
     }
     return r;
   },
   audit:()=>session.flugAudit(),
   patrouilleStarten:()=>{
     try{
       if(!session||!scope.J4dPatrouille)throw Error('Patrouillenkern nicht geladen');
       if(raum?.laeuft())throw Error('Vor dem Start die Weltzeit anhalten');
       if(patrouille&&['bereit','flug'].includes(patrouille.status))
         throw Error('Die laufende Patrouille zuerst abschließen');
       if(duell?.status==='aktiv')throw Error('Zuerst das laufende Duelltraining beenden');
       const neu=scope.J4dPatrouille.beginnen(session.zustandReferenz(),session.pilotStatus());
       patrouille=neu; // Nur Sitzungsübung, nicht Teil des wirtschaftlichen Spielstands.
       pilotTutor?.beobachten(session.zustandReferenz());pilotStatusAktualisieren();
       return {ok:true};
     }catch(e){return {ok:false,reason:error(e)};}
   },
   duellStarten:()=>{
     try{
       if(!session||!scope.J4eDuell)throw Error('F8-E-Trainingskern nicht geladen');
       if(session.ansicht().regel!==204)throw Error('F8-E nur für die Original-Regel204-Karriere');
       if(patrouille&&['bereit','flug'].includes(patrouille.status))
         throw Error('Eine laufende Patrouille muss zuerst abgeschlossen werden');
       if(duell?.status==='aktiv')throw Error('Ein Duelltraining läuft bereits');
       duell=scope.J4eDuell.beginnen(
         session.weltReferenz(),session.zustandReferenz(),session.pilotStatus());
       pilotTutor?.beobachten(session.zustandReferenz());pilotStatusAktualisieren();
       return {ok:true};
     }catch(e){return {ok:false,reason:error(e)};}
   },
   feuern:()=>{
     if(!session||!scope.J4eDuell||!duell||duell.schiff!==session.pilotStatus())
       return {ok:false,reason:'Kein gültiges eigenes laufendes Trainingsduell'};
     // Ausschließlich das flüchtige F8-Trainingsbuch wird verändert.
     // Der Welt-Core erhält niemals einen kostenlosen Waffen- oder Schadenbefehl.
     return scope.J4eDuell.feuern(session.weltReferenz(),session.zustandReferenz(),duell);
   },
   exportieren:saveDownload,
   ansicht:retour,
   meldung:(m,fail)=>hinweis(m,fail),
   flugschreiber:()=>({format:'aphros-raum-flugschreiber-1',regel:session?.ansicht().regel||204,
       schritte:flugSchritte,vollstaendig:false,
       hinweis:'Diese Spielerlebnishülle speichert keinen vollständigen Replay-Befehlsstrom.',
       eintraege:[]})
  });
 }catch(e){raum=null;console.error('P1 cockpit bridge:',e);}
}
// P1/P2: lessons observe the currently loaded original career; no second world.
function pilotStatusAktualisieren(){
 const el=$('pilotenausbildung-live');if(!el)return;
 const t=pilotTutor?.stand();
 el.hidden=!t||t.status==='bereit';
 if(el.hidden)return;
 const v=(t.status==='erfolgreich'?'Geschafft · ':t.status==='unterbrochen'?'Übung unterbrochen · ':'Flugübung · ')+t.meldung;
 if(el.textContent!==v)el.textContent=v;
}
function pilotBinden(){
 if(!scope.PilotenAkademie||!scope.PilotenMenue)return;
 pilotTutor=scope.PilotenAkademie.erstellen({
   welt:()=>session?.weltReferenz(),zustand:()=>session?.zustandReferenz(),
   aktiv:()=>session?.pilotStatus(),szene:scope.RaumSzene,
   angebot:cmd=>session?.flugAngebot(cmd),
   patrouilleStand:()=>scope.J4dPatrouille.stand(patrouille),
   duellStand:()=>duell&&scope.J4eDuell.stand(duell)
 });
 pilotMenu=scope.PilotenMenue.verbinden($('pilotenausbildung-karten'),pilotTutor,()=>{
   pilotStatusAktualisieren();
   if(!session||!raum||!session.pilotStatus())return;
   screen('raumbereich');
   raum.aktivieren();
 });
 const manager=$('manager-akademie'),pilot=$('pilotenausbildung');
 if(manager&&pilot)manager.after(pilot);
 pilotMenu.zeichnen();
}
$('w6-p8h-toggle')?.addEventListener('click',()=>{
 try{
   if(!session||session.ansicht().regel!==207)
     throw Error('Folgeversorgung nur in der ausdrücklich gewählten Regel207-Forschung');
   const welt=session.weltReferenz(),s=session.zustandReferenz();
   if(typeof welt.npcMaterialKetteSetzen!=='function')
     throw Error('W6/P8h-Originaldispatcher ist nicht geladen');
   const alt=s.kanon.npcMaterialKette===true,neu=!alt;
   if(neu&&!scope.confirm('Die eigenständigen NPC-Unternehmen dürfen künftig neue Frachter bauen, kaufen und real finanzierte Erztransporte abschließen. Es gibt keine Preisgarantien, Kredite oder geschenkten Waren. Deinen bestehenden W6-Forschungsstand vorher sichern und die Folgekette aktivieren?'))return;
   welt.npcMaterialKetteSetzen(s,neu);
   const audit=welt.audit(s);
   if(!audit.ok){
     welt.npcMaterialKetteSetzen(s,alt);
     throw Error('Original-Wirtschaftsaudit: '+audit.fehler.join('; '));
   }
   if(!speichern(true)){
     // Bei verweigerter Speicherberechtigung kein ungesichertes Opt-in behaupten.
     welt.npcMaterialKetteSetzen(s,alt);
     throw Error('Aktivierung ohne geschützte lokale Sicherung verweigert; bitte JSON exportieren');
   }
   anzeigen();
   hinweis(neu?'W6-P8h-Folgeversorgung aktiviert. Jeder NPC-Auftrag benötigt Originalware und echtes Firmenkapital.':
     'W6-P8h-Folgeversorgung pausiert. Laufende bereits bezahlte Originalaufträge bleiben gültig.');
 }catch(e){hinweis('W6-Folgeversorgung nicht geändert: '+error(e),true);}
});
$('p3-handelsaktion')?.addEventListener('click',()=>{
 if(!session||!scope.P3Handelsweg)return;
 try{
  // Re-evaluate each click on actual current Core state; never trust the earlier DOM label.
  const p=scope.P3Handelsweg.auswerten(session.zustandReferenz(),session.angebote(),session.weltReferenz());
  if(!p.bereit)throw Error(p.grund||'Das Originalangebot ist derzeit nicht finanzierbar');
  if(p.art==='zeit')weiter(60); // The same paid world-step as the existing clock button.
  else if(p.art==='auftrag'&&p.aktion)auftrag(p.aktion); // Original validated J8 command.
 }catch(e){hinweis('Handelsauftrag gesperrt: '+error(e),true);anzeigen();}
});
$('p3-invest-aktion')?.addEventListener('click',()=>{
 if(!session||!scope.P3Investition)return;
 try{
  // Observe the current audited world and current quote again before every click.
  const p=scope.P3Investition.auswerten(session.weltReferenz(),
    session.zustandReferenz(),session.angebote());
  if(!p.sichtbar||!p.bereit||!p.aktion)
    throw Error(p.grund||'Kein rechtmäßig finanzierter Investitionsauftrag');
  auftrag(p.aktion); // The established J8 owner/stock/budget validation and autosave.
 }catch(e){hinweis('Investition gesperrt: '+error(e),true);anzeigen();}
});
// No direct mutations or foreign money controls: all choices go through the
// strict J8 plan and original householdBuy validation, then the normal autosave.
function wasserLohnAusgeben(id){
 if(!session||!scope.P3WasserLohn)return;
 try{
  const p=scope.P3WasserLohn.auswerten(session.weltReferenz(),
    session.zustandReferenz(),session.angebote(),scope.AphrosWelt.DATEN);
  const berechtigt=p.sichtbar&&(id===p.zielAktion?p.zielBereit:
    id===p.kleinAktion&&p.kleinBereit);
  if(!berechtigt)throw Error(p.grund||'Privater Wasserkauf nicht finanzierbar');
  auftrag(id);
 }catch(e){hinweis('Wasserkauf gesperrt: '+error(e),true);anzeigen();}
}
$('p3-wasser-aktion')?.addEventListener('click',()=>wasserLohnAusgeben('water-pilot-house-bedarf'));
$('p3-wasser-klein')?.addEventListener('click',()=>wasserLohnAusgeben('water-pilot-house-1'));
$('p3-npc-aktion')?.addEventListener('click',()=>{
 if(!session||!scope.P3NPCMarkt)return;
 try{
  // Always re-evaluate original validated core and offers, never a stale DOM quote.
  const p=scope.P3NPCMarkt.auswerten(session.weltReferenz(),
   session.zustandReferenz(),session.angebote(),scope.AphrosWelt.DATEN);
  if(!p.sichtbar||!p.bereit)throw Error('NPC-Markt ist für diese Karriere nicht verfügbar');
  if(p.art==='fracht'&&p.aktion)auftrag(p.aktion);
  else if(p.art==='zeit')weiter(60);
  else throw Error('Keine zulässige Originalaktion');
 }catch(e){hinweis('NPC-Markt gesperrt: '+error(e),true);anzeigen();}
});
$('p3-npc-werft-aktion')?.addEventListener('click',()=>{
 if(!session||!scope.P3NPCWerft)return;
 try{
  const p=scope.P3NPCWerft.auswerten(session.weltReferenz(),session.zustandReferenz());
  if(!p.sichtbar)throw Error('Nur im ausdrücklich gewählten Regel204-S02-Modus');
  weiter(60); // Originalwelt, Eigentum, Firmenpolitik, Save und 60 bezahlte Minuten.
 }catch(e){hinweis('NPC-Flottenbericht gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-kauf')?.addEventListener('click',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  // Revalidate original station stock, buyer's own cash and owner permissions.
  const p=scope.P3Industrie.auswerten(session.weltReferenz(),
   session.zustandReferenz(),session.angebote());
  if(!p.sichtbar||!p.kaufberechtigt)throw Error(p.hausKaufgrund||'Werfthülle nicht verfügbar');
  auftrag(p.hausKaufId); // J8 original house:shipBuy; atomic audit and save.
 }catch(e){hinweis('Werftkauf gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-auswahl')?.addEventListener('change',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  const next=$('p3-industrie-auswahl').value;
  const p=scope.P3Industrie.auswerten(session.weltReferenz(),
   session.zustandReferenz(),session.angebote(),next);
  if(!p.sichtbar||!p.werftFrachter.some(sh=>sh.id===next)
    ||p.werftSpielerSchiffId!==next)
   throw Error('Die Hülle gehört nicht zum original gebauten eigenen Werftbestand');
  werftAuswahlId=next;anzeigen(); // No save or economic command on selection.
 }catch(e){hinweis('Werftauswahl gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-transfer')?.addEventListener('click',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  const p=scope.P3Industrie.auswerten(session.weltReferenz(),
   session.zustandReferenz(),session.angebote(),werftAuswahlId);
  if(!p.sichtbar||!p.werftTransferBereit||!p.werftTransferId)
   throw Error(p.werftTransferGrund||'Kein vollständig finanzierter Original-Überführungsauftrag');
  auftrag(p.werftTransferId); // Existing W5ac owner-authorized wage escrow + real world minutes.
 }catch(e){hinweis('Werftüberführung gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-fracht')?.addEventListener('click',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  // No UI-made buyer, price or wage: re-evaluate the signed original J8 quote.
  const s=session.zustandReferenz(),p=scope.P3Industrie.auswerten(
   session.weltReferenz(),s,session.angebote(),werftAuswahlId);
  if(!p.sichtbar||!p.werftFrachtBereit||!p.werftFrachtId
    ||s.ships[p.werftSpielerSchiffId]?.owner!=='house'
    ||!s.w5.schiffIds.includes(p.werftSpielerSchiffId))
   throw Error(p.werftFrachtGrund||'Keine echte bezahlbare F4-Fracht fuer die Werfthuelle');
  auftrag(p.werftFrachtId);
 }catch(e){hinweis('Werftfracht gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-cockpit')?.addEventListener('click',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  const s=session.zustandReferenz(),p=scope.P3Industrie.auswerten(
   session.weltReferenz(),s,session.angebote(),werftAuswahlId);
  const id=p.werftSpielerSchiffId;
  if(!p.sichtbar||!id||p.werftTransferAktiv||s.ships[id]?.owner!=='house'||!s.w5.schiffIds.includes(id))
   throw Error('Kein eigenes, original gefertigtes Werftschiff vorhanden');
  const pruefung=session.piloten().find(x=>x.id===id);
  if(!pruefung?.erlaubt&&session.pilotStatus()!==id)
   throw Error(pruefung?.grund||'Persönliche Steuerung nicht freigegeben');
  pilotieren(id); // Existing validated transfer and original 2D cockpit; no new world.
 }catch(e){hinweis('Werftcockpit gesperrt: '+error(e),true);anzeigen();}
});
$('p3-industrie-zeit')?.addEventListener('click',()=>{
 if(!session||!scope.P3Industrie)return;
 try{
  const p=scope.P3Industrie.auswerten(session.weltReferenz(),
   session.zustandReferenz(),session.angebote());
  if(!p.sichtbar)throw Error('Nur für ausdrücklich gewählte Regel204-S02-Wirtschaft');
  weiter(60); // Same original scheduled, fully audited economic step.
 }catch(e){hinweis('Industrieschicht gesperrt: '+error(e),true);anzeigen();}
});
$('jaeger-kaufweg').addEventListener('click',()=>{
 if(!session)return;
 const quote=session.angebote().find(a=>a.id==='buy-st_nadir-jaeger');
 if(!quote?.ok){hinweis('Jägerkauf derzeit nicht möglich: '+(quote?.reason||'Kein Kaufangebot'),true);anzeigen();return;}
 tabZeigen('auftraege');
 const target=[...$('spieleraktionen').querySelectorAll('[data-action]')]
   .find(el=>el.dataset.action==='buy-st_nadir-jaeger');
 target?.focus(); // Navigiert nur; niemals automatisch kaufen.
});
$('neues-spiel').addEventListener('click',()=>screen('briefing'));
$('karriere-starten').addEventListener('click',startNeu);
$('fortsetzen').addEventListener('click',()=>{try{
   if(session){aktiveSitzung('Deine laufende Karriere ist geöffnet.');return;}
   const json=gespeicherte();if(!json)throw Error('Keine Karriere gespeichert');
   ladeSitzung(json,'lokal');
 }catch(e){hinweis('Karriere nicht geöffnet: '+error(e),true);}});
$('fortsetzen-w6').addEventListener('click',()=>{try{
   if(session){aktiveSitzung('Deine laufende Karriere ist geöffnet.');return;}
   const json=gespeicherte(SLOT_W6);if(!json)throw Error('Kein separater Forschungsstand gespeichert');
   ladeSitzung(json,'forschung');
 }catch(e){hinweis('Experimentelle Karriere nicht geöffnet: '+error(e),true);}});
$('w6-npc-start').addEventListener('change',()=>{
 if($('w6-npc-start').checked)$('w6-p8g-start').checked=false;
});
$('w6-p8g-start').addEventListener('change',()=>{
 if($('w6-p8g-start').checked)$('w6-npc-start').checked=false;
});
$('vorige-karriere')?.addEventListener('click',()=>{try{
   if(session)throw Error('Erst die aktuelle Karriere als JSON sichern und neu laden');
   const json=gespeicherte(BACKUP);if(!json)throw Error('Keine vorherige Sicherung vorhanden');
   ladeSitzung(json,'backup',true);
 }catch(e){hinweis('Vorherige Karriere nicht geöffnet: '+error(e),true);}});
$('vorige-forschung').addEventListener('click',()=>{try{
 if(session)throw Error('Erst die aktuelle Karriere als JSON sichern und die Seite neu öffnen');
 const json=gespeicherte(SLOT_W6+':vorherige');
 if(!json)throw Error('Keine gesonderte W6-Forschungssicherung vorhanden');
 ladeSitzung(json,'forschung-backup',true);
 }catch(e){hinweis('Experimentelle Karrieresicherung nicht geladen: '+error(e),true);}});
$('import-aktion').addEventListener('click',()=>$('import-datei').click());
$('import-datei').addEventListener('change',async e=>{
 const input=e.currentTarget; // Safari clears event.currentTarget after await.
 const f=input?.files?.[0];if(!f)return;
 try{
   if(f.size>MAX)throw Error('Datei größer als 5 MB');
   const json=await f.text();ladeSitzung(json,'datei');
 }catch(err){hinweis('Datei nicht geladen: '+error(err),true);}
 finally{input.value='';}
});
$('open-menu').addEventListener('click',()=>{
 if(ansicht==='raumbereich'&&raum?.laeuft()){hinweis('Flugzeit vor dem Wechsel pausieren.',true);return;}
 if(session)speichern();
 if(raum)raum.deaktivieren();
 screen('startseite');menustand();
});
$('welt-sichern').addEventListener('click',()=>{
 try{const ok=speichern();hinweis(ok?'Karriere lokal gesichert.':'Bitte JSON exportieren.',!ok);}
 catch(e){hinweis(error(e),true);}
});
$('welt-export').addEventListener('click',saveDownload);
for(const b of d.querySelectorAll('[data-advance]'))b.addEventListener('click',()=>weiter(Number(b.dataset.advance)));
for(const b of d.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>tabZeigen(b.dataset.tab));
scope.addEventListener('pagehide',()=>{if(session){try{speichern();}catch(_){/* local export stays available */}}});
// Ausbildungs-UI navigiert nur; alle Wirtschaftsaktionen bleiben im Original-Core.
if(scope.ManagerAkademie){
 managerTutor=scope.ManagerAkademie.verbinden({
   wurzel:$('spielwelt'),sitzung:()=>session,
   navigieren:(panel,id)=>{
     tabZeigen(panel);
     if(id){
       const target=[...d.querySelectorAll('[data-action], [data-j13-action]')]
         .find(b=>b.dataset.action===id||b.dataset.j13Action===id);
       if(target){target.scrollIntoView?.({block:'nearest'});target.focus();}
     }
   }
 });
}
firmennamenAnzeigen();cockpitBinden();pilotBinden();menustand();screen('startseite');
})(globalThis);
