/* J7: reine lokale Dateiprüfung; keinerlei Speichern, Upload, Fetch oder Konvertierungsdownload. */
(function(scope){
'use strict';
const doc=scope.document, datei=doc.getElementById('quelle'),
  ergebnis=doc.getElementById('ergebnis'),stufen=doc.getElementById('stufen');
datei.addEventListener('change',async()=>{
 const file=datei.files?.[0];
 if(!file)return;
 stufen.replaceChildren();
 if(file.size>5*1024*1024){ergebnis.textContent='Abgelehnt: JSON ist größer als 5 MB.';ergebnis.className='fail';return;}
 ergebnis.textContent='Lokale Core-Audits laufen …';ergebnis.className='';
 try{
  const original=await file.text();
  const report=scope.J7UebernahmeCheck.untersuchen(original);
  const fragment=doc.createDocumentFragment();
  for(const s of report.schritte){
   const el=doc.createElement('li');
   el.textContent='Regel '+s.von+' → '+s.nach+' · '+s.name+' · Hash '+s.hash+' · '+s.weltgeld+' ISK';
   el.className='success';fragment.append(el);
  }
  if(!report.ok){
   const el=doc.createElement('li');el.textContent='STOPP bei '+report.stufe+': '+report.reason;
   el.className='fail';fragment.append(el);
  }
  stufen.replaceChildren(fragment);
  ergebnis.textContent=report.ok
   ?'Alle sechs Original-Core-Übernahmestufen prüfbar. Kein Jäger kostenlos erzeugt. '
     +'Der Quellstand wurde nicht gespeichert, überschrieben oder als neuer Spielstand importiert.'
   :'Keine Übernahme zulässig: '+report.reason+'. Der Originalspielstand bleibt erhalten.';
  ergebnis.className=report.ok?'success':'fail';
 }catch(e){ergebnis.textContent='Prüfung abgebrochen: '+e.message;ergebnis.className='fail';}
});
})(globalThis);
