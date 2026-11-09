/* W5ac: only read-only Rule191 transfer provenance; touch action runs original shipReposition. */
(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const money=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE')+' ISK':'Unbekannt';
 const n=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE'):'Unbekannt';
 const field=(caption,value)=>{
  const root=document.createElement('div'),strong=document.createElement('strong'),label=document.createElement('span');
  strong.textContent=String(value);label.textContent=caption;root.append(strong,label);return root;
 };
 function table(root,rows){
  const wrapper=document.createElement('div'),t=document.createElement('table'),head=document.createElement('tr');
  wrapper.className='scroll';
  for(const k of ['Einzelbeleg aus Rule191-Original-Core','Realer Zustand']){
   const th=document.createElement('th');th.textContent=k;head.append(th);
  }
  t.append(head);
  for(const values of rows){
   const tr=document.createElement('tr');
   for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}
   t.append(tr);
  }
  wrapper.append(t);root.replaceChildren(wrapper);
 }
 function render(snapshot){
  if(snapshot.state.rulesVersion!==191||!snapshot.audit?.ok||!snapshot.transfer?.audit?.ok)
   throw Error('W5ac: Rule191 mit vollständig geprüfter Transferfinanzierung erforderlich');
  const s=snapshot.state,t=snapshot.transfer.audit,ids=s.w5.schiffIds,sel=$('transfer-select');
  const previous=sel.value;
  sel.replaceChildren(...ids.map(id=>{
   const sh=s.ships[id],op=document.createElement('option');
   op.value=id;op.textContent=id+' · '+sh?.owner+' · '+sh?.system+' · '+sh?.phase;
   return op;
  }));
  if(ids.includes(previous))sel.value=previous;
  const selected=sel.value||null;
  const quote=selected?snapshot.transfer.quotes[selected]:null,ship=s.ships[selected];
  $('transfer-stats').replaceChildren(
   field('Spedition, eigenes freies Kapital',money(s.owners.transport.cash)),
   field('Gebundener echter Pilotenlohn',money(t.reserved)),
   field('An echten Piloten gezahlt',money(t.worker)),
   field('Original-Route Nadir–Aldera',n(t.routeMinutes)+' Minuten'),
   field('Aktive Überführung',t.active?'Ja':'Nein'),
   field('Noch zu bezahlende Flugminuten',n(t.remaining)),
   field('Vollständig angekommene Schiffshüllen',n(t.completed)),
   field('Unabhängiger Flug-, Geld- und Herkunftsaudit',t.ok?'OK':'FEHLER')
  );
  $('transfer-status').textContent=!ids.length?
   'Noch keine aus W4-Material gebaute, vollständig bezahlte W5-Hülle. Zuerst Frachter, Erz, Material und Werftauftrag ausführen.':
   (ship?'Ausgewählte echte Hülle '+ship.id+' · Eigentümer '+ship.owner+
    ' · Ort '+ship.system+' · Phase '+ship.phase+' · Auftrag '+ship.auftrag+'. ':'')+
   (t.active?'Original-Core fliegt jetzt '+t.shipId+'; '+n(t.remaining)+' voll vorfinanzierte Arbeitsminuten verbleiben.':
    t.completed>0?'Original-Core-Ankunft nach vollem Pilotenlohn bereits belegt.':'Noch kein laufender Überführungsflug.');
  $('transfer-quote').textContent=quote?.ok?
   'Original-Rule191-Prüfung freigegeben: '+n(quote.minuten)+' echte Reiseminuten × '+
   money(quote.lohn)+' Pilotenlohn = '+money(quote.kosten)+' vollständig aus eigener Speditionskasse vorfinanziert. Nur Ausführung bucht.':
   'Original-Rule191-Überführung gesperrt: '+(quote?.grund||'Noch keine eigene bezahlte W5-Schiffshülle')+'.';
  $('transfer-start').disabled=!quote?.ok;
  const freightQuote=selected?snapshot.transfer.freightQuotes[selected]:null;
  $('transfer-freight-quote').textContent=freightQuote?.ok?
   'Original-W3-Folgeauftrag: '+n(snapshot.state.w3?.geliefert||0)+' Erz bereits geliefert; weitere 50 echte Erz, 740 ISK Kundengeld und 120 ISK Lohn für Hin- und Rückflug erforderlich. Der Core prüft dies bei Ausführung erneut.':
   'Noch kein finanzierter W3-Auftrag für diesen Frachter: '+(freightQuote?.grund||'kein eigener bezahlter Werftfrachter')+'.';
  $('transfer-freight-start').disabled=!freightQuote?.ok;
  table($('transfer-ledger'),[
   ['Gekaufte Original-W5-Hüllen (IDs)',ids.join(', ')||'Noch keine'],
   ['Für tatsächliche Überführungen kumuliert reserviert',money(t.allocated)],
   ['Davon tatsächlich ausbezahlte 1-ISK-Pilotenminuten',money(t.paid)],
   ['Aktuell wirklich hinterlegte Lohnmittel',money(s.owners.w5ac_transfer_reserved.cash)],
   ['Bezahltes getrenntes Pilotenlohnkonto',money(s.owners.w5ac_transfer_pilot.cash)],
   ['Aktiver W3-Erztransport (gegen Doppelauftrag)',s.w3.auftrag?.phase||'Keiner'],
   ['Aktive Original-Überführungs-Schiffs-ID',s.w5ac.active?.id||'Keine'],
   ['Original-Core: Flugkosten je Reiseminute',money(t.perMinute)],
   ['Angekommen / noch aktiv',n(t.completed)+' / '+(t.active?'1':'0')],
   ['Ausgewählte Hülle: Heimat / aktuelles System',ship?ship.heimat+' / '+ship.system:'Keine'],
   ['Weltgeld / neue ISK',money(snapshot.audit.total)+' / '+n(s.minted)],
   ['W0–W5, W3, W4, W5 und Transferaudits',snapshot.audit.ok&&snapshot.freight.audit.ok&&snapshot.refinery.audit.ok&&snapshot.shipyard.audit.ok&&t.ok?'Alle OK':'FEHLER']
  ]);
 }
 function mount(session,run){
  $('transfer-select').addEventListener('change',()=>render(session.snapshot()));
  $('transfer-start').addEventListener('click',()=>{
   const ship=$('transfer-select').value;
   run(()=>session.command({type:'transferStart',schiff:ship}));
  });
  $('transfer-freight-start').addEventListener('click',()=>{
   const ship=$('transfer-select').value;
   run(()=>session.command({type:'freightStart',schiff:ship}));
  });
 }
 scope.W5acExtension=Object.freeze({render,mount});
})(globalThis);
