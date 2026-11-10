/* W5ab: read-only original Rule19 shipyard view; command buttons only call validated original W5 core. */
(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const money=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE')+' ISK':'Unbekannt';
 const n=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE'):'Unbekannt';
 const field=(name,val)=>{const root=document.createElement('div'),v=document.createElement('strong'),l=document.createElement('span');v.textContent=val;l.textContent=name;root.append(v,l);return root;};
 function receipts(root,entries){
  const holder=document.createElement('div'),table=document.createElement('table'),head=document.createElement('tr');
  holder.className='scroll';
  for(const heading of ['Original-Core-Beleg','Realer, auditierter Wert']){const h=document.createElement('th');h.textContent=heading;head.append(h);}
  table.append(head);
  for(const [label,value] of entries){
   const row=document.createElement('tr');
   for(const text of [label,value]){const td=document.createElement('td');td.textContent=String(text);row.append(td);}
   table.append(row);
  }
  holder.append(table);root.replaceChildren(holder);
 }
 function render(snapshot){
  if(![19,191,195].includes(snapshot.state.rulesVersion)||!snapshot.audit?.ok||!snapshot.shipyard?.audit?.ok)
   throw Error('W5ab nur originaler Regel19-W5-Core mit vollständigem Audit');
  const s=snapshot.state,y=snapshot.shipyard.audit,q=snapshot.shipyard.quote,offer=snapshot.shipyard.sale,w=s.w5;
  $('yard-stats').replaceChildren(
   field('Werft, eigenes verfügbares Kapital',money(y.werftCash)),
   field('Station Nadir, eigenes Kapital',money(y.stationCash)),
   field('Transportkonzern, eigene Kasse',money(y.buyerCash)),
   field('Werft-Lohntreuhand',money(y.werftEscrow)),
   field('Tatsächlich ausgezahlte Werftlöhne',money(y.arbeitCash)),
   field('W4-Material im Nadir-Lager',n(y.materialLager)),
   field('Gebauter, noch unverkaufter Frachter im Lager',n(y.frachterLager)),
   field('Verkaufte, eindeutig identifizierte Frachter',n(y.verkauft)),
   field('Original-W5-Werftaudit',y.ok?'OK':'FEHLER')
  );
  $('yard-status').textContent=w.auftrag?
   'Werftauftrag im Original-Core aktiv: '+n(y.restMinuten)+' Minuten bezahlte Arbeit offen. Doppelbau nicht möglich.':
   'Kein laufender Werftauftrag; gebaute Frachter bleiben reale Waren, bis der Core-Kauf tatsächlich bezahlt wurde.';
  $('yard-build-quote').textContent=q.ok?
   'Original-W5-Bau geprüft: '+n(q.material)+' echte Material für '+money(q.materialKosten)+
    ' kaufen, '+money(q.arbeitKosten)+' Werftarbeit reservieren und '+n(q.dauer)+
    ' Original-Core-Minuten bezahlen. Die Zahlung an Nadir ist noch nicht ausgeführt.':
   'Original-W5-Bau abgelehnt: '+(q.grund||'nicht finanzierbar')+'.';
  $('yard-build').disabled=!q.ok;
  $('yard-sale-quote').textContent=offer.ok?
   'Original-W5-Verkauf geprüft: '+money(offer.preis)+' aus der eigenen Speditionskasse; eine echte Hülle in Nadir. '+
   'Kauf und eindeutige Ship-ID entstehen erst bei der Ausführung.':
   'Original-W5-Verkauf abgelehnt: '+(offer.grund||'kein finanzierter Käufer')+'.';
  $('yard-buy').disabled=!offer.ok;
  receipts($('yard-ledger'),[
   ['Kumuliert verbrauchtes W4-Material',n(w.materialVerbraucht)+' Material'],
   ['Von der Werft an Nadir gezahlter Materialerlös',money(y.materialUmsatz)],
   ['Für Werftlöhne gebunden',money(w.arbeitsGebunden)],
   ['An Werftarbeiter tatsächlich gezahlt',money(y.lohnBezahlt)],
   ['Fertig produzierte Frachterhüllen',n(y.produziert)],
   ['Mit echtem Eigentumswechsel verkaufte Hüllen',n(y.verkauft)],
   ['Gebundene Käufer- / Arbeitsreserve',money(s.owners.w5_arbeit_treuhand?.cash??0)],
   ['Eindeutige Eigentümer-IDs neu gekaufter Frachter',w.schiffIds.length?w.schiffIds.join(', '):'Noch keine'],
   ['Fertigschiff-Lager / Eigentümer',n(s.stations.st_nadir.lager.frachter)+' / '+s.stations.st_nadir.eigentum],
   ['Weltgeld / Mint',money(snapshot.audit.total)+' / '+n(s.minted)],
   ['Geld-, Waren-, W3-, W4- und W5-Audit',snapshot.audit.ok&&snapshot.freight.audit.ok&&snapshot.refinery.audit.ok&&y.ok?'Alle OK':'FEHLER']
  ]);
  const ids=w.schiffIds.map(id=>s.ships[id]).filter(Boolean);
  const locations=ids.map(ship=>ship.id+' / '+ship.owner+' / '+ship.system+' / '+ship.phase).join(' · ');
  $('yard-demand').textContent='Echter Material-Folgeumsatz: '+money(y.materialUmsatz)+
   '. Physisch produzierte Frachter: '+n(y.produziert)+', tatsächlich verkauft: '+n(y.verkauft)+
   ', noch unverkauft: '+n(y.frachterLager)+'. '+
   (offer.ok?'Aktuell kann ein Käufer den vollen 750-ISK-Preis bezahlen.':
    'Aktuell kein verkaufbarer, vollständig bezahlbarer Frachter: '+offer.grund+'.')+
   ' Neue Schiffe bleiben in Nadir; kein Gratisflug nach Aldera. '+
   (locations?'Tatsächlicher Konzernbesitz: '+locations+'. ':'')+
   'Realer Materialkauf allein beweist keine dauerhafte W6-Endnachfrage.';
 }
 function mount(session,run){
  $('yard-build').addEventListener('click',()=>run(()=>session.command({type:'yardStart'})));
  $('yard-buy').addEventListener('click',()=>run(()=>session.command({type:'yardBuy'})));
 }
 scope.W5abExtension=Object.freeze({render,mount});
})(globalThis);
