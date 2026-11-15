/* J8 – reine Vanilla-JS-Oberfläche, keine Browser-Speicherung.
 * Alle wirtschaftlichen Auswirkungen erfolgen ausschließlich via J8-Session
 * und den Originalregel204-Kern. Kein Upload/Fetch und keine zweiten Ticks.
 */
(function(scope){
'use strict';
const d=scope.document,$=id=>d.getElementById(id);
const session=scope.J8KonzernSitzung.erstellen();
let raum=null,schrittzaehler=0,flugJournal=[],journalVoll=true;
const JOURNAL_MAX=50000;
const nichtMoeglich=grund=>({ok:false,reason:grund});
function sichtWechsel(ziel){
 if(!aktiv)return;
 if(ziel==='raum'){
   $('konzernwelt').hidden=true;$('raumbereich').hidden=false;
   if(raum)raum.aktivieren();
 }else{
   if(raum)raum.deaktivieren();
   $('raumbereich').hidden=true;$('konzernwelt').hidden=false;
   darstellen(session.ansicht());
 }
}
function flugBefehl(cmd){
 const r=session.flugBefehl(cmd);
 if(flugJournal.length<JOURNAL_MAX)flugJournal.push({schritt:schrittzaehler,cmd:{...cmd},ok:r.ok});
 else journalVoll=false;
 return r;
}
function flugSchritte(n){
 const m=session.flugSchritte(n);schrittzaehler+=n;return m;
}
if(scope.RaumCockpit&&scope.RaumSzene&&scope.RaumGrafik&&$('raumbereich')){
 try{
  raum=scope.RaumCockpit.verbinden({
   welt:()=>session.weltReferenz(),zustand:()=>session.zustandReferenz(),
   jaeger:()=>session.pilotStatus(),bojen:[],
   patrouille:()=>null,patrouilleStand:()=>({status:'nicht gestartet',erreicht:0}),
   duellStand:()=>null,
   schritte:flugSchritte,ausfuehren:flugBefehl,audit:()=>session.flugAudit(),
   patrouilleStarten:()=>nichtMoeglich('Kein Jäger und keine freigegebene Patrouille in J9'),
   duellStarten:()=>nichtMoeglich('Nur die bestehende Jägersitzung besitzt ein Trainingsduell'),
   feuern:()=>nichtMoeglich('Keine unfinanzierte Kampfmunition im Konzerncockpit'),
   exportieren:()=>$('export204').click(),
   ansicht:sichtWechsel,
   meldung:(s,fail)=>status(s,fail),
   flugschreiber:()=>({format:'aphros-raum-flugschreiber-1',regel:204,
     quellHash:session.ansicht().quelleHash,
     schritte:schrittzaehler,vollstaendig:journalVoll,
     eintraege:flugJournal.map(e=>({...e,cmd:{...e.cmd}}))})
  });
 }catch(e){raum=null;console.error('J9 Cockpit-Fallback: ',e.message);}
}

let text195=null,text204=null,pruefungOK=false,aktiv=false;
const status=(s,fehler=false)=>{const x=aktiv?$('weltmeldung'):$('preview195');
 x.textContent=s;x.className='message'+(fehler?' fail':'');};
function starts(){
 $('start195').disabled=aktiv||!pruefungOK||!$('zustimmung195').checked;
 $('start204').disabled=aktiv||!text204||!$('zustimmung204').checked;
}
$('zustimmung195').addEventListener('change',starts);
$('zustimmung204').addEventListener('change',starts);
$('quelle195').addEventListener('change',async()=>{
 text195=null;pruefungOK=false;starts();$('stufen').replaceChildren();
 const file=$('quelle195').files?.[0];if(!file)return;
 if(file.size>5*1024*1024){status('Datei größer als 5 MB – abgewiesen',true);return;}
 status('Sechs unveränderliche Core-Übernahmeschritte werden lokal geprüft …');
 try{
  const raw=await file.text(),result=scope.J7UebernahmeCheck.untersuchen(raw);
  const nodes=result.schritte.map(x=>{
   const li=d.createElement('li');li.className='success';
   li.textContent=x.von+' → '+x.nach+' · '+x.name+' · Hash '+x.hash+' · '+x.weltgeld+' ISK';
   return li;
  });
  if(!result.ok){const li=d.createElement('li');li.className='fail';
   li.textContent='STOPP '+result.stufe+': '+result.reason;nodes.push(li);}
  $('stufen').replaceChildren(...nodes);
  if(result.ok){
   text195=raw;pruefungOK=true;
   status('Regel195 kann auditiert kopiert werden: '+result.weltgeld+
    ' ISK, keine neue Ware oder Hülle. Kein Anfangsjäger. Bitte die getrennte Kopie ausdrücklich bestätigen.');
  }else status('Die Quelle ist nicht übertragbar: '+result.reason,true);
 }catch(e){status('Ungültige Quelle: '+e.message,true);}
 starts();
});
$('quelle204').addEventListener('change',async()=>{
 text204=null;starts();const f=$('quelle204').files?.[0];
 if(!f)return;if(f.size>5*1024*1024){status('Regel204-JSON zu groß',true);return;}
 text204=await f.text();starts();
});
$('start195').addEventListener('click',()=>{
 if(!pruefungOK||!$('zustimmung195').checked||!text195)return;
 try{
  const a=session.starten195(text195,true);
  text195=null;text204=null;aktiv=true;starts();$('quelle-bereich').hidden=true;
  $('konzernwelt').hidden=false;status('Separate Regel204-Konzernkopie erfolgreich geprüft und geöffnet.');
  darstellen(a);
 }catch(e){status('Übernahme nicht ausgeführt: '+e.message,true);}
});
$('start204').addEventListener('click',()=>{
 if(!text204||!$('zustimmung204').checked)return;
 try{
  const a=session.oeffnen204(text204,true);
  text195=null;text204=null;aktiv=true;starts();$('quelle-bereich').hidden=true;
  $('konzernwelt').hidden=false;status('Auditiertes Regel204-JSON in eigener Sitzung geöffnet.');
  darstellen(a);
 }catch(e){status('Regel204-Import verweigert: '+e.message,true);}
});
function tabelle(id,zeilen,spalten){
 const nodes=zeilen.map(x=>{
  const row=d.createElement('tr');
  for(const col of spalten(x)){const td=d.createElement('td');td.textContent=String(col);row.append(td);}
  return row;
 });$(id).replaceChildren(...nodes);
}
function darstellen(a=session.ansicht()){
 $('tick').textContent=a.tick+' min';
 $('cash').textContent=a.hausgeld+' ISK';
 $('weltgeld').textContent=a.weltgeld+' ISK';
 $('jaeger').textContent=a.eigenerJaeger;
 $('hash').textContent='Original-Core-Hash '+a.hash+' · '+a.herkunft+' · Quelle '+a.quelleHash;
 tabelle('schiffe',a.schiffe,s=>[s.id,s.klasse,s.system,s.flug||s.phase,s.ladung]);

 // Der Pilotwechsel verändert weder den Core-Worldhash noch eigene Waren/Gelder.
 const piloten=session.piloten();
 const nodes=piloten.map(p=>{
  const box=d.createElement('div');box.className='aktion';
  const taste=d.createElement('button');taste.type='button';
  taste.dataset.j9Pilot=p.id;
  taste.textContent=(p.klasse==='miner'?'Miner ':'Jäger ')+p.id+' · '+p.system+' · '+p.lage+' persönlich fliegen';
  taste.disabled=!raum||!p.erlaubt;
  const info=d.createElement('small');
  info.textContent=p.erlaubt
   ?'Eigene auditierte Hülle · Kopie derselben Welt, Lohnreserve beim Abdocken'
   :'Gesperrt: '+p.grund;
  taste.addEventListener('click',()=>{
   if(!raum){status('Grafisches Cockpit nicht verfügbar',true);return;}
   const r=session.uebernehmen(p.id,raum.laeuft());
   if(!r.ok){status('Schiffwechsel verweigert: '+r.reason,true);darstellen();return;}
   raum.sitzungGewechselt();
   sichtWechsel('raum');
  });
  box.append(taste,info);return box;
 });
 $('j9-piloten').replaceChildren(...(nodes.length?nodes:[(()=>{
   const p=d.createElement('p');p.className='note';
   p.textContent='Noch kein eigenes Schiff. Erst einen tatsächlich vorhandenen Miner bezahlen und kaufen.';
   return p;
 })()]));

 tabelle('stationen',a.stationen,s=>[s.id,s.system,s.lager]);
 const buttons=session.angebote().map(x=>{
  const box=d.createElement('div');box.className='aktion';
  const button=d.createElement('button');button.textContent=x.label;button.disabled=!x.ok;
  button.dataset.aktion=x.id;button.type='button';
  const reason=d.createElement('small');
  reason.textContent=x.ok?'Nach erneutem Core-Audit aktuell zulässig':'Gesperrt: '+x.reason;
  button.addEventListener('click',()=>{
   try{
    const r=session.ausfuehren(x.id);
    status(r.ok?'Originalauftrag finanziert und ausgeführt: '+x.label
     :'Core-Auftrag gesperrt: '+r.reason,!r.ok);
    darstellen();
   }catch(e){status('Auftrag ohne Änderung abgewiesen: '+e.message,true);}
  });
  box.append(button,reason);return box;
 });
 $('angebote').replaceChildren(...buttons);
 $('pilotstatus').textContent=a.eigenerJaeger>0
  ?'Eigener bezahlter Jäger verfügbar. Der direkte J9-Schiffwechsel benutzt dieselbe Regel204-Welt; regelmäßiges JSON-Backup empfohlen.'
  :'Kein eigener Jäger erforderlich: Ein legal gekaufter Miner kann direkt aus der Konzernansicht persönlich geflogen werden. Jägerproduktion und Kauf bleiben separat finanziert.';
}
for(const el of d.querySelectorAll('[data-minute]')){
 el.addEventListener('click',()=>{
  try{const n=Number(el.dataset.minute);const a=session.weiterspielen(n);
   status(n+' echte Wirtschaftsminuten simuliert; sämtliche Konten, Waren und Hüllen auditiert.');
   darstellen(a);
  }catch(e){status('Fortschritt abgebrochen: '+e.message,true);}
 });
}
$('export204').addEventListener('click',()=>{
 try{
  const json=session.exportieren();
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=d.createElement('a');
  a.href=url;a.download='aphros-void-j8-regel204-'+session.ansicht().tick+'.json';
  d.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Vollständig auditierten Regel204-Spielstand als eigene JSON-Datei zum Herunterladen bereitgestellt. Bitte sicher aufbewahren.');
 }catch(e){status('Export abgebrochen: '+e.message,true);}
});
})(globalThis);
