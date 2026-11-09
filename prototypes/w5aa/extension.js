/* W5aa: W4 refinery receipts from original Rule18 – only original stationRefine changes goods and money. */
(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const money=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE')+' ISK':'Unbekannt';
 const quantity=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE'):'Unbekannt';
 const field=(name,value)=>{
  const wrap=document.createElement('div'),strong=document.createElement('strong'),text=document.createElement('span');
  strong.textContent=String(value);text.textContent=name;wrap.append(strong,text);return wrap;
 };
 function table(root,rows){
  const holder=document.createElement('div'),tbl=document.createElement('table'),head=document.createElement('tr');
  holder.className='scroll';
  for(const h of ['Original-Core-Produktionsbeleg','Tatsächlicher Wert']){
   const td=document.createElement('th');td.textContent=h;head.append(td);
  }tbl.append(head);
  for(const [label,value] of rows){
   const tr=document.createElement('tr');
   for(const val of [label,value]){
    const td=document.createElement('td');td.textContent=String(val);tr.append(td);
   }tbl.append(tr);
  }
  holder.append(tbl);root.replaceChildren(holder);
 }
 function render(snapshot){
  if(![18,19,191].includes(snapshot.state.rulesVersion)||!snapshot.audit?.ok||!snapshot.refinery?.audit?.ok)
   throw Error('W5aa/W5ab: nur Original-W4/5-Regel18/19-Audit');
  const s=snapshot.state,r=snapshot.refinery.audit,q=snapshot.refinery.quote,work=s.w4;
  $('refinery-stats').replaceChildren(
   field('Echtes, geliefertes Erz in Nadir',quantity(r.erz)),
   field('Aus echtem Erz produziertes Material',quantity(r.material)),
   field('Nadir, eigenes ungebundenes ISK',money(r.station)),
   field('Raffinerie-Arbeitstreuhand',money(r.arbeitsKasse)),
   field('Tatsächlich gezahlte Raffinerielöhne',money(r.arbeiter)),
   field('Bezahlte Produktionschargen',quantity(r.abgeschlossen)),
   field('Noch benötigte Arbeitsminuten',quantity(r.restzeit)),
   field('Original-W4-Core-Audit',r.ok?'OK':'FEHLER')
  );
  $('refinery-status').textContent=r.status==='in_produktion'?
    'Eine echte Charge ist bereits finanziert; noch '+quantity(r.restzeit)+' originale Arbeitsminuten. Keine zweite Beauftragung.':
    'Keine aktive Raffineriecharge. Erz, Nadir-Kasse, Materiallager und Eigentümerrechte werden bei jedem Start erneut geprüft.';
  $('refinery-quote').textContent=q.ok?
    'Original-W4-Core erlaubt die nächste echte Charge: '+quantity(q.erz)+' Erz für '+quantity(q.material)+
     ' Material · '+money(q.arbeit)+' vollständig vorzufinanzierende Löhne · '+quantity(q.dauer)+
     ' Minuten Arbeit. Noch keine Reservierung, keine Verkaufszusage.':
    'Original-W4-Core verweigert weiteren Auftrag: '+(q.grund||'nicht finanzierbar')+'.';
  $('refinery-start').disabled=!q.ok;
  table($('refinery-ledger'),[
   ['Kumuliert vertraglich gebuchte Arbeit',money(work.gebucht)],
   ['Bisher ausgezahlte Arbeitslöhne',money(work.gezahlt)],
   ['Raffinerie tatsächlich verbrauchtes Erz',quantity(work.erzVerbraucht)+' Erz'],
   ['Aus echter Produktion entstandenes Material',quantity(work.materialErzeugt)+' Material'],
   ['Bezahlte abgeschlossene Chargen',quantity(work.abgeschlossen)],
   ['Aktiver Auftrag mit gebundenen 10 Erz',work.auftrag?work.auftrag.gearbeitet+' von '+quantity(q.dauer||scope.W5aaOriginal.rules.w4.dauer)+' Minuten geleistet':'Keiner'],
   ['Nadir-Lager Erz nach Fracht und Verbrauch',quantity(s.stations.st_nadir.lager.erz)],
   ['Nadir-Lager Material ohne Folgeverkauf',quantity(s.stations.st_nadir.lager.material)],
   ['Original-W3-Fracht / W4-Raffinerie-Audit',(snapshot.freight.audit.ok&&r.ok)?'Beide OK':'FEHLER'],
   ['Weltgeld / neue ISK',money(snapshot.audit.total)+' / '+quantity(s.minted)]
  ]);
  $('refinery-demand').textContent=[19,191].includes(s.rulesVersion)?
   'W5-Materialabsatz tatsächlich durch die eigenfinanzierte Werft gebucht: '+money(s.w5.materialUmsatz)+
   ' für '+quantity(s.w5.materialVerbraucht)+' verbrauchte Material. Übrig im Nadir-Lager: '+
   quantity(r.material)+' Material. Der nächste Kauf bleibt an eigenes Werftgeld und echte Hüllen-Nachfrage gebunden; ein Lagerbestand allein ist kein Umsatz.':
   'Folgeabsatz noch NICHT finanziert: '+quantity(r.material)+
   ' Material sind echte Bestände im Eigentum der Station Nadir, aber bisher gibt es keinen bezahlten Materialverkauf. '+
   'Nadir kann nur aus eigener Kasse weiterproduzieren ('+money(r.station)+'). '+
   'Weder das Speditionskonto noch fremde Export-Etats sind automatische Käufer. '+
   'Ohne späteren kostenpflichtigen Materialabnehmer entsteht aus Produktion kein Erlös.';
 }
 function mount(session,run){
  $('refinery-start').addEventListener('click',()=>run(()=>session.command({type:'refineStart'})));
 }
 scope.W5aaExtension=Object.freeze({render,mount});
})(globalThis);
