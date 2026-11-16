/* P1 · Spielerlebnis-Hülle. Keine zweite Welt, kein eigener Wirtschafts-Tick.
 * Verwendet ausschliesslich originale Regel195-Quelle, validierte J8-Session,
 * RAUM-1-Cockpit und separat geschützte eigene Karriere-Speicherstellen.
 */
(function(scope){
'use strict';
const d=scope.document,$=id=>d.getElementById(id);
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const BACKUP=SLOT+':vorherige';
const MAX=5*1024*1024;
const fmt=n=>Number(n).toLocaleString('de-DE');
let session=null,raum=null,ansicht='startseite',flugSchritte=0,flugSeitSicherung=0,patrouille=null;
let cockpitGenutzt=false,flugerfahrung=false;
const safeText=(s)=>String(s==null?'':s);
const error=(e)=>safeText(e&&e.message?e.message:e);

function speichern(copyOld=false){
 if(!session)return false;
 const json=session.exportieren();
 if(json.length>MAX)throw Error('Karrierestand übersteigt 5 MB. Bitte als JSON exportieren.');
 // Get, set and backup are deliberately isolated from every existing Rule195 slot.
 try {
   if(copyOld){const old=scope.localStorage.getItem(SLOT);if(old)scope.localStorage.setItem(BACKUP,old);}
   scope.localStorage.setItem(SLOT,json);
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
 const old=$('vorige-karriere');
 if(old)old.hidden=!gespeicherte(BACKUP);
}
function screen(id){
 ansicht=id;
 for(const name of ['startseite','briefing','spielwelt','raumbereich'])$(name).hidden=name!==id;
 if(id!=='raumbereich'&&raum)raum.deaktivieren();
 $('open-menu').hidden=id==='startseite';
 $('mode-indicator').textContent=id==='startseite'?'OFFLINE · ALDERA-SEKTOR':
   id==='briefing'?'PROLOG · ALDERA-SEKTOR':'ONLINE · ALDERA-SEKTOR';
 if(id==='spielwelt'&&session)anzeigen();
 scope.scrollTo?.(0,0);
}
function hinweis(message,fail=false){
 const text=safeText(message);
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
 const vorher=gespeicherte();
 if(vorher&&!scope.confirm('Hier besteht schon eine Karriere. Die bisherige Version bleibt als „Vorherige Karriere“ gesichert. Trotzdem eine neue Karriere beginnen?'))return;
 try{
  if(!scope.W5acSession||!scope.J8KonzernSitzung)throw Error('Original-Wirtschaftskern wurde nicht geladen');
  // A genuine Rule195 starting world, not a prefilled 204 test fixture.
  const w6Aktiv=$('w6-npc-start')?.checked===true;
  const original195=scope.W5acSession.create(42,'private195').export();
  const neu=neueSitzung();
  const a=neu.starten195(original195,true);
  if(a.regel!==204||a.weltgeld!==33000)throw Error('Ausgangswelt nicht autoritativ validiert');
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
  session=neu;flugSchritte=0;flugSeitSicherung=0;cockpitGenutzt=false;flugerfahrung=false;patrouille=null;
  const ok=speichern(!!vorher);
  aktiveSitzung('Karriere begonnen: '+fmt(a.weltgeld)+' ISK Weltgeld. '+(w6Aktiv
   ?'W6-NPC-Konzerne arbeiten auf eigene Rechnung; jeder Auftrag bleibt finanziert.'
   :'Unveränderte Karriere ohne NPC-W6-Automatik.')+' Kein kostenloses Schiff.');
  if(!ok)hinweis('Karriere gestartet. Lokales Speichern nicht verfügbar; bitte sofort JSON exportieren.',true);
 }catch(e){hinweis('Start verweigert: '+error(e),true);}
}
function ladeSitzung(json,auswahl,backup=false){
 if(typeof json!=='string'||json.length<1||json.length>MAX)
   throw Error('Ungültige Größe des Karriere-Spielstands.');
 if(session)throw Error('Laufende Karriere zuerst als JSON exportieren und die Seite neu öffnen.');
 const neu=neueSitzung();
 const a=neu.oeffnen204(json,true); // Strict Core validation; no auto migration.
 if(a.regel!==204||a.weltgeld!==33000)throw Error('Weltgeld- und Regel-Audit verweigert den Stand');
 if(auswahl==='datei'){
   if(gespeicherte()&&!scope.confirm('Der neue Datei-Spielstand ersetzt die aktive Karriere-Speicherstelle. Die bisherige Karriere wird zusätzlich gesichert. Fortfahren?'))return;
 }
 session=neu;flugSchritte=0;flugSeitSicherung=0;cockpitGenutzt=false;flugerfahrung=false;patrouille=null;
 if(auswahl==='datei'||backup)speichern(!!gespeicherte());
 aktiveSitzung(backup?'Vorherige Karriere aus dem separaten Sicherungsslot geladen.':'Willkommen zurück. Der Original-Core hat deinen Spielstand geprüft.');
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
  speichern();anzeigen();
  hinweis(n+' bezahlte Weltminuten vergangen. Alle Waren und Konten stammen aus dem Original-Core.');
 }catch(e){
  if(vorher!==null){
   try{
    const restore=neueSitzung();restore.oeffnen204(vorher,true);
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
  if(!a||!a.ok)throw Error(a?.reason||'Der Original-Core erlaubt diesen Auftrag nicht');
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
  hinweis('Auftrag gebucht: '+a.label+'. Konten und Eigentümer sind neu geprüft.');
  if(siliziumSchiff)pilotieren(siliziumSchiff);
 }catch(e){hinweis('Auftrag nicht ausgeführt: '+error(e),true);}
}
const namen=[
 ['buy-st_aldera-miner','Deinen ersten Miner kaufen','Aus einem wirklich vorhandenen Aldera-Werftlager, für 600 ISK.'],
 ['buy-st_aldera-frachter','Frachter erwerben','Ein eigener Frachter wird nur aus wirklichem Lagerbestand und deinem Kapital gekauft.'],
 ['buy-st_nadir-frachter','Nadir-Frachter erwerben','Nur eine wirklich vorhandene Hülle aus dem Nadir-Lager kaufen.'],
 ['buy-st_nadir-miner','Nadir-Miner übernehmen','Nur falls die Werft einen fertigen Miner mit Vormerkung für dich produziert hat.'],
 ['buy-st_nadir-jaeger','Jäger kaufen','Erst wenn Nadir eine echte, vollständig bezahlte Jägerhülle besitzt.']
];
function titel(a){return namen.find(x=>x[0]===a.id)?.[1]||(
 a.id.startsWith('ice-')?'Eisförderung beginnen':
 a.id.startsWith('stop-')?'Automatischen Pendelauftrag beenden':
 a.id.startsWith('sil-start-')?'Silizium fördern':
 a.id.startsWith('sil-sell-')?'Silizium verkaufen':
 a.id.startsWith('freight-')?'F4 · Bezahlte Eisfracht ausführen':
 a.id.startsWith('gate-freight-')?'F6 · Eisfracht mit Torbeleg':a.label);
}
function info(a){return namen.find(x=>x[0]===a.id)?.[2]||a.label;}
function datum(ms){return Math.floor(ms/1440)+' Tage · '+(ms%1440)+' Minuten';}
function missions(){
 const state=session.zustandReferenz(),mine=Object.values(state.ships).some(s=>s.owner==='house'&&s.klasse==='miner');
 const pilot=!!session.pilotStatus();
 const eigenesFrachtgut=Object.values(state.ships).some(sh=>sh.owner==='house'&&Object.values(sh.ladung||{}).some(n=>n>0));
 return [
  {done:mine,text:'Einen eigenen Miner aus echten Beständen kaufen'},
  {done:pilot||cockpitGenutzt,text:'Ins Cockpit steigen – ein Schiff, eine Welt'},
  {done:(state.kanon.fluglohnMinuten||0)>0||flugerfahrung,text:'Abdocken und den ersten bezahlten Flug beginnen'},
  {done:eigenesFrachtgut||!!state.kanon.silizium?.belege?.length,text:'Eigenes Eis oder Silizium wirklich gewinnen'}
 ];
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
  karte(lager,st.id+' · '+st.system,[
   ['Lager',st.lager],
   ['Eigene Stationskasse',Number.isSafeInteger(cash)?fmt(cash)+' ISK':'Kein eigenes Konto']
  ]);
 }
 const firmen=section('Unabhängige Unternehmen');
 for(const [id,name] of [['npc3','Bergbau · npc3'],['transport','Spedition · transport'],['werft_extern','Außenwerft · werft_extern']]){
  const owner=s.owners[id];if(!owner)continue;
  const schiffe=Object.values(s.ships).filter(x=>x.owner===id);
  const klassen=[...new Set(schiffe.map(x=>x.klasse))].sort()
    .map(klasse=>klasse+': '+schiffe.filter(x=>x.klasse===klasse).length).join(' · ')||'Keine eigenen Schiffe';
  karte(firmen,name,[['Firmenkasse',fmt(owner.cash)+' ISK'],
   ['Eigene Flotte',klassen]]);
 }
 const werft=section('Werft · tatsächlich geprüfte Kaufangebote');
 const kauf=angebote.filter(o=>namen.some(n=>n[0]===o.id));
 for(const angebot of kauf){
  const card=karte(werft,titel(angebot),[
   ['Core-Status',angebot.ok?'Kauf derzeit möglich':'Gesperrt'],
   ['Begründung',angebot.ok?info(angebot):angebot.reason||'Original-Core verweigert den Kauf']
  ]);
  if(angebot.ok){
   const link=d.createElement('button');
   link.type='button';link.className='economy-go';link.dataset.j12Offer=angebot.id;
   link.textContent='Zum geprüften Kaufangebot';
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
 footer.textContent='Weltgeld: '+fmt(a.weltgeld)+' ISK · Mint/Burn: '+fmt(s.minted)+' / '+fmt(s.burned)+
  ' ISK. Angezeigte Kaufangebote sind Momentaufnahmen; erst der Original-Core bucht einen Auftrag.';
 host.replaceChildren(lager,firmen,werft,footer);
}
// J13 – alle Voraussetzungen werden nur gelesen; ein Kauf folgt ausschliesslich
// dem bereits vorhandenen, unmittelbar erneut geprueften house-Originalauftrag.
function jaegerBeitraege(){
 const projekt=scope.J13Spielerprojekt.erstellen(session);
 $('jaeger-beitrag-hinweis').textContent=projekt.hinweis;
 const host=$('jaeger-beitrag-aktionen'),blocks=[];
 for(const gruppe of projekt.gruppen){
  const section=d.createElement('section'),h=d.createElement('h5');
  h.textContent=gruppe.titel;section.append(h);
  for(const a of gruppe.angebote){
   const box=d.createElement('div'),b=d.createElement('button'),p=d.createElement('small');
   box.className='order';b.type='button';b.dataset.j13Action=a.id;
   b.textContent=titel(a);b.disabled=!a.ok;
   p.textContent=a.label+' · '+(a.ok?'Original-Core: ausführbar':'Gesperrt: '+a.reason);
   b.addEventListener('click',()=>auftrag(a.id));box.append(b,p);section.append(box);
  }
  blocks.push(section);
 }
 host.replaceChildren(...blocks);
 $('jaeger-rohstoffe').textContent='Eigene belegte Siliziumverkäufe: '+projekt.silizium.eigeneVerkaeufe+
   ' · Alle Siliziumverkäufe an Nadir: '+projekt.silizium.verkauft+'.';
 $('jaeger-sperren').replaceChildren(...projekt.sperren.map(s=>{
  const p=d.createElement('p');p.textContent=s.titel+' · Eigentümer: '+s.eigentuemer+
   ' · house: '+(s.ok?'Core erlaubt den Auftrag':s.grund);return p;
 }));
 const a=projekt.aldera;
 $('jaeger-finanzierung').textContent='Neuer K7-Erzankauf: Aldera besitzt '+fmt(a.kasse)+
  ' von '+fmt(a.erzkauf)+' ISK; aktuell fehlen '+fmt(a.fehlend)+
  ' ISK. Diese Liquiditätsprüfung ersetzt keine Firmenzustimmung. '+
  'Die bekannte 500-ISK-Lücke im zweiten Forschungsvertrag ist dadurch nicht gelöst.';
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
  h.textContent=step.titel;p.textContent=step.hinweis;
  tag.className='jaeger-stand';tag.textContent=step.stand==='erfuellt'?'Vorhanden':
    step.stand==='laeuft'?'In Arbeit':step.stand==='bereit'?'Kaufbereit':'Noch offen';
  li.append(h,tag,p);stufen.append(li);
 }
 const k=d.createElement('p');
 k.className='economy-foot';
 k.textContent='K7-Erzvertrag: '+akte.k7.phase+
   (akte.k7.erzkauf!==null&&akte.k7.alderaKasse!==null
     ?' · Aldera '+fmt(akte.k7.alderaKasse)+' / '+fmt(akte.k7.erzkauf)+' ISK fuer einen neuen Erzankauf'
     :'')+'. Das ist eine Statusauskunft, keine Unterschrift.';
 host.replaceChildren(stufen,k);
 const button=$('jaeger-kaufweg');
 button.disabled=!akte.kauf.ok;
 $('jaeger-autoritaet').textContent=akte.eigeneJaeger>0
  ?'Bereits gekaufter Jäger: '+akte.eigeneJaeger+' · Eigentum und Cockpit über „Meine Flotte“.'
  :akte.kauf.ok
    ?'Original-Core-Kauf für '+fmt(akte.kauf.preis)+' ISK möglich. Der Button öffnet nur die bestehende Kaufansicht.'
    :'Kein Kauf: '+(akte.kauf.grund||'keine vollständige finanzierte Hülle')+
     '. Nur Nadir darf J3/J4-Arbeit beauftragen; keine fremden Aufträge werden hier signiert.';
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
 const beschaffung=w.dravosAktiv
  ?'Ein weiteres System ist im Regel204-Profil vorhanden, aber kein bezahlter Silizium-Frachtvertrag ist eingerichtet.'
  :'Dravos ist in der allgemeinen Karte verzeichnet, aber kein aktives Regel204-Foerder-/Frachtziel. Neue endliche Quellen sind noch nicht erschlossen.';
 host.replaceChildren(
  zeile('Endliches Nadir-Feld',fmt(f.rest)+' / '+fmt(f.gesamt)+' Silizium verbleiben · '+fmt(f.gefoerdert)+
   ' physisch gefoerdert · '+fmt(f.verkauft)+' bezahlt an Nadir verkauft · '+fmt(f.moeglicheNeueChargen)+
   ' volle '+fmt(f.charge)+'er-Chargen im Boden'),
  zeile('Vorhandene Ware',fmt(l.siliziumNadir)+' Silizium im Nadir-Lager · '+
   fmt(l.siliziumSchiffe)+' in echten Schiffsraeumen · '+fmt(l.bauteileNadir)+' fertige J3-Teile · '+
   fmt(l.jaegerNadir)+' verkaufsfaehige Jaeger · '+fmt(l.fertigeJaeger)+' Jaeger gesamt gebaut'),
  zeile('Laufender Abbau',f.auftrag?
   'Eigentuemer '+f.auftrag.owner+' · Miner '+f.auftrag.schiff+' · '+
   fmt(f.auftrag.gefoerdert)+' / '+fmt(f.auftrag.menge)+' Einheiten wirklich gefoerdert'
   :'Kein laufender J2b-Foerderauftrag'),
  zeile('Vorfinanzierung je weiterer Originalcharge',
   fmt(g.arbeitJeCharge)+' ISK Bergbaulohn · '+fmt(g.ankaufJeCharge)+
   ' ISK Nadir-Ankauf · mindestens '+fmt(g.flugreserve)+
   ' ISK Flugreserve bei neuer Ausfahrt. Kassen: npc3 '+fmt(g.npc3Kasse)+
   ' ISK, Nadir '+fmt(g.nadirKasse)+' ISK; eigene bezahlte Nadir-Miner: '+
   fmt(g.anzahlRechtmaessigerNpcNadirMiner)+'. Das ist keine bindende Kaufzusage.'),
  zeile('Weitere Siliziumfelder im aktiven Kern',fmt(w.fremdeAktiveSiliziumFelder)+
   ' · '+beschaffung),
  zeile('Lieferstatus',lage.stand)
 );
}
function anzeigen(){
 if(!session)return;
 const a=session.ansicht(),s=session.zustandReferenz();
 // Status stammt ausschließlich aus dem gespeicherten Core, nicht aus einem UI-Schalter.
 const w6Status=$('w6-status');
 if(w6Status)w6Status.hidden=!(s.kanon.npcAuto===true&&s.kanon.npcSilizium?.aktiv===true);
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
  small.textContent=o.ok?info(o):'Zurzeit gesperrt: '+o.reason;
  if(o.ok)small.className='available';
  button.addEventListener('click',()=>auftrag(o.id));
  box.append(button,small);return box;
 }));
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
   if(!pilot?.erlaubt&&!bereitsPilot){const m=d.createElement('small');m.textContent=pilot?.grund||'Cockpit für diese Schiffsklasse noch nicht verfügbar';box.append(h,p,b,m);}
   else box.append(h,p,b);
   return box;
 }):[(()=>{const p=d.createElement('p');p.textContent='Noch kein Schiff. Beginne mit dem Kauf eines wirklich vorhandenen Aldera-Miners.';return p;})()]));
}
function pilotieren(id){
 try{
  if(!raum)throw Error('2D-Cockpit steht nicht zur Verfügung');
  const r=session.uebernehmen(id,raum.laeuft());
  if(!r.ok)throw Error(r.reason);
  cockpitGenutzt=true;speichern();raum.sitzungGewechselt();
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
   duellStand:()=>null,
   // J11: transfer control through the same session, never by a second player world.
   uebernehmen:(id,spielt)=>session.uebernehmen(id,spielt),
   // Authoritative funding quotes on temporary audited clones; no NPC impersonation.
   angebot:cmd=>session.flugAngebot(cmd),
   schritte:n=>{
      const beobachten=patrouille&&['bereit','flug'].includes(patrouille.status)
        ?probe=>{
          try{scope.J4dPatrouille.beobachten(patrouille,probe);}
          catch(_){patrouille.status='unterbrochen';}
        }:undefined;
      const minutes=session.flugSchritte(n,beobachten);
      flugSchritte+=n;flugSeitSicherung+=minutes;
      if(minutes>0)flugerfahrung=true;
      if(flugSeitSicherung>=5){flugSeitSicherung=0;speichern();}
      return minutes;
   },
   ausfuehren:cmd=>{
     const r=session.flugBefehl(cmd);
     if(r.ok){flugerfahrung=true;speichern();}
     return r;
   },
   audit:()=>session.flugAudit(),
   patrouilleStarten:()=>{
     try{
       if(!session||!scope.J4dPatrouille)throw Error('Patrouillenkern nicht geladen');
       if(raum?.laeuft())throw Error('Vor dem Start die Weltzeit anhalten');
       if(patrouille&&['bereit','flug'].includes(patrouille.status))
         throw Error('Die laufende Patrouille zuerst abschließen');
       const neu=scope.J4dPatrouille.beginnen(session.zustandReferenz(),session.pilotStatus());
       patrouille=neu; // Nur Sitzungsübung, nicht Teil des wirtschaftlichen Spielstands.
       return {ok:true};
     }catch(e){return {ok:false,reason:error(e)};}
   },
   duellStarten:()=>({ok:false,reason:'Kein Trainingsduell ohne echte Jägerfreigabe'}),
   feuern:()=>({ok:false,reason:'Kein kostenloses Kampfmaterial'}),
   exportieren:saveDownload,
   ansicht:retour,
   meldung:(m,fail)=>hinweis(m,fail),
   flugschreiber:()=>({format:'aphros-raum-flugschreiber-1',regel:204,
       schritte:flugSchritte,vollstaendig:false,
       hinweis:'Diese Spielerlebnishülle speichert keinen vollständigen Replay-Befehlsstrom.',
       eintraege:[]})
  });
 }catch(e){raum=null;console.error('P1 cockpit bridge:',e);}
}
$('jaeger-kaufweg').addEventListener('click',()=>{
 if(!session)return;
 const quote=session.angebote().find(a=>a.id==='buy-st_nadir-jaeger');
 if(!quote?.ok){hinweis('Jägerkauf weiterhin gesperrt: '+(quote?.reason||'Kein Originalangebot'),true);anzeigen();return;}
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
$('vorige-karriere')?.addEventListener('click',()=>{try{
   if(session)throw Error('Erst die aktuelle Karriere als JSON sichern und neu laden');
   const json=gespeicherte(BACKUP);if(!json)throw Error('Keine vorherige Sicherung vorhanden');
   ladeSitzung(json,'backup',true);
 }catch(e){hinweis('Vorherige Karriere nicht geöffnet: '+error(e),true);}});
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
cockpitBinden();menustand();screen('startseite');
})(globalThis);
