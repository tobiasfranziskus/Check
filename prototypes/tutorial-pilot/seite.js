/* Standalone host for an explicitly imported career; reuses the original cockpit.
 * One J8 session; no new game, autosave, timer, physics or economy implementation.
 */
(function(scope){
'use strict';
const $=id=>document.getElementById(id);
let session=null,raum=null,patrouille=null,duell=null;
const meldung=text=>{$('meldung').textContent=text;};
const B={welt:()=>session?.weltReferenz(),zustand:()=>session?.zustandReferenz(),aktiv:()=>session?.pilotStatus(),
 szene:scope.RaumSzene,angebot:cmd=>session?.flugAngebot(cmd),
 patrouilleStand:()=>scope.J4dPatrouille.stand(patrouille),duellStand:()=>duell?scope.J4eDuell.stand(duell):null};
const akademie=scope.PilotenAkademie.erstellen(B);
const menue=scope.PilotenMenue.verbinden($('akademie'),akademie,()=>{unterricht();raum?.anzeigen();if(raum)$('raumbereich').scrollIntoView();});
function unterricht(){const s=akademie.stand(),text=(s.status==='erfolgreich'?'Geschafft! ':'')+s.meldung;if($('unterricht-status').textContent!==text)$('unterricht-status').textContent=text;}
function beobachten(){akademie.beobachten(session.zustandReferenz());menue.aktualisieren();unterricht();}
function exportieren(){
 if(!session)return;
 const url=URL.createObjectURL(new Blob([session.exportieren()],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download='aphros-flugschule.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function training(art){
 try{
  if(raum.laeuft())throw Error('Halte vor dem Trainingsstart die Zeit an.');
  if(['bereit','flug'].includes(patrouille?.status)||duell?.status==='aktiv')throw Error('Beende zuerst das laufende Training.');
  if(art==='patrouille')patrouille=scope.J4dPatrouille.beginnen(B.zustand(),B.aktiv());
  else duell=scope.J4eDuell.beginnen(B.welt(),B.zustand(),B.aktiv());
  beobachten();return {ok:true};
 }catch(e){return {ok:false,reason:e.message};}
}
function binden(){
 raum=scope.RaumCockpit.verbinden({welt:B.welt,zustand:B.zustand,jaeger:B.aktiv,bojen:scope.J4dPatrouille.TORE,
  patrouille:()=>patrouille,patrouilleStand:B.patrouilleStand,duellStand:B.duellStand,
  uebernehmen:(id,spielt)=>{const r=session.uebernehmen(id,spielt);if(r.ok){beobachten();menue.zeichnen();}return r;},
  angebot:B.angebot,ausfuehren:cmd=>{const r=session.flugBefehl(cmd);if(r.ok)beobachten();return r;},
  schritte:n=>{
   let minuten=0;
   // Existing J8 full-state reads between original seconds: its compact callback
   // omits P2 mode/target, cargo and contracts. Never infer those from UI clicks.
   for(let i=0;i<n;i++){
    minuten+=session.flugSchritte(1,probe=>{
     if(['bereit','flug'].includes(patrouille?.status))scope.J4dPatrouille.beobachten(patrouille,probe);
     if(duell?.status==='aktiv')scope.J4eDuell.beobachten(B.welt(),probe,duell);
    });
    beobachten();
   }
   return minuten;
  },audit:()=>session.flugAudit(),patrouilleStarten:()=>training('patrouille'),duellStarten:()=>training('duell'),
  feuern:()=>scope.J4eDuell.feuern(B.welt(),B.zustand(),duell),exportieren,
  ansicht:()=>{$('akademie').scrollIntoView();menue.zeichnen();},meldung,
  flugschreiber:()=>({vollstaendig:false,eintraege:[]})});
}
function flotte(){
 const select=$('pilot');select.replaceChildren();
 for(const sh of session.ansicht().schiffe){const o=document.createElement('option');o.value=sh.id;o.textContent=sh.klasse+' · '+sh.id;select.append(o);}
 select.value=B.aktiv()||'';
 const angebote=$('auftraege');angebote.replaceChildren();
 // Only already authorized actions. Financing is always revalidated by J8.
 for(const [prefix,text] of [['sil-start-','Siliziumauftrag finanzieren'],['freight-','Eisfracht finanzieren']]){
  const a=session.angebote().find(x=>x.id===prefix+B.aktiv());if(!a)continue;
  const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=!a.ok;b.title=a.reason||'';
  b.onclick=()=>{const r=session.ausfuehren(a.id);meldung(r.ok?'Auftrag angenommen.':r.reason);beobachten();flotte();menue.zeichnen();raum.sitzungGewechselt();};angebote.append(b);
 }
}
$('karriere').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>5*1024*1024)throw Error('Bitte eine Karriere bis 5 MB auswählen.');
  const neu=scope.J8KonzernSitzung.erstellen(),text=await file.text();
  if(JSON.parse(text).rulesVersion===207)neu.oeffnenP8g(text,true);else neu.oeffnen204(text,true);
  const id=neu.piloten().find(x=>!x.grund)?.id;
  if(id){const r=neu.uebernehmen(id,false);if(!r.ok)throw Error(r.reason);}
  // Replacement is explicit; an active in-memory flight must be exported first.
  if(session)throw Error('Exportiere deine geladene Karriere und öffne die Flugschule zum Wechsel neu.');
  session=neu;patrouille=null;duell=null;akademie.zuruecksetzen();
  if(!raum)binden();$('raumbereich').hidden=!id;
  if(id){raum.sitzungGewechselt();raum.aktivieren();}
  flotte();menue.zeichnen();meldung(id?'Karriere geladen. Wähle eine Flugübung.':'Übernimm zuerst ein rechtmäßig gekauftes Schiff in deiner Karriere.');
 }catch(err){meldung('Karriere konnte nicht geladen werden. '+(err.message.startsWith('Bitte ')||err.message.startsWith('Exportiere ')?err.message:'Bitte einen gültigen, unterstützten Karriereexport mit vollständigen Kauf- und Finanzierungsbelegen auswählen. Dein geladener Stand bleibt erhalten.'));}
 e.target.value='';
});
$('pilot').addEventListener('change',()=>{
 if(!session)return;const r=session.uebernehmen($('pilot').value,raum?.laeuft());
 if(!r.ok){meldung(r.reason);flotte();return;}
 beobachten();raum.sitzungGewechselt();flotte();menue.zeichnen();
});
$('neu').addEventListener('click',()=>{akademie.zuruecksetzen();menue.zeichnen();unterricht();});
})(globalThis);
