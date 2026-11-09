/* W5y: read-only market and freight receipts; every button submits one original Rule17 command. */
(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const money=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE')+' ISK':'Unbekannt';
 const num=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE'):'Unbekannt';
 const field=(name,value)=>{const root=document.createElement('div'),val=document.createElement('strong'),key=document.createElement('span');
  val.textContent=String(value);key.textContent=name;root.append(val,key);return root;};
 function table(root,headers,rows){
  const wrap=document.createElement('div'),t=document.createElement('table'),h=document.createElement('tr');
  wrap.className='scroll';
  for(const name of headers){const th=document.createElement('th');th.textContent=name;h.append(th);}t.append(h);
  for(const data of rows){const tr=document.createElement('tr');for(const value of data){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}t.append(tr);}
  wrap.append(t);root.replaceChildren(wrap);
 }
 function render(snap){
  if(![17,18,19].includes(snap.state.rulesVersion)||!snap.freight?.audit?.ok)throw Error('W5y/W5aa ausschließlich Original-Rule17/18');
  const s=snap.state,c=snap.corporation.crisis,w=s.w3,f=snap.freight.audit,q=snap.freight.quote,ship=s.ships[snap.freight.shipId];
  $('w2-company-stats').replaceChildren(
   field('NPC-Bergbaukasse',money(s.owners.npc3.cash)),
   field('Endkundenetat, endlich',money(s.owners.export.cash)),
   field('W3-Erzkäufer Nadir, endlich',money(s.owners.st_nadir.cash)),
   field('W3-Spedition, eigenes Kapital',money(s.owners.transport.cash)),
   field('NPC-Miner',num(c.eigene)),
   field('Neuer W2-Erzbedarf',num(c.planbar))
  );
  $('w2-investment').textContent='W3-Regel 17: Die Spedition ist ein eigener Wirtschaftsakteur. Ihr Guthaben wird nicht mit dem Stations- oder Endkundengeld vermischt. W2-Endkundenbudget und W3-Nadir-Käuferetat werden getrennt bilanziert.';
  table($('w2-demand'),['Original-Core-Markt- und Krisenstatus','Istwert'],[
   ['W2-NPC-Krisenstatus',c.status],['Endkundenherkunft korrekt',c.kaeuferNachweisOk?'Ja':'Nein'],
   ['Verfügbarer W2-Endkundenetat',money(c.kaeuferCash)],
   ['Finanzierbare neue Erzförderung',num(c.planbar)],
   ['W3-Käufercash aus endlichem Startetat',money(f.buyer)],
   ['W3 in Nadir physisch gelieferte Erzmenge',num(w.geliefert)],
   ['Weltgeld laut Original-Audit',money(snap.audit.total)],
   ['Neue ISK',num(s.minted)]
  ]);
  const ships=Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner').sort((a,b)=>a.id.localeCompare(b.id));
  table($('w2-fleet'),['Miner-ID','Eigentümer','Originalauftrag','Erzladung'],ships.map(sh=>[
   sh.id,sh.owner,sh.auftrag,num(sh.ladung.erz||0)]));
  $('w2-warning').textContent='Bezahltes Erz im Aldera-Lager ist noch kein W3-Verkauf. Erst nach echtem Hinflug geht es gegen den gebundenen Warenwert an Nadir; die Spedition erhält das Entgelt erst nach finanzierter Rückfahrt.';
  $('freight-stats').replaceChildren(
   field('Spedition, freie Kasse',money(f.carrier)),
   field('Nadir-Käufer, freie Kasse',money(f.buyer)),
   field('W3-Warentreuhand',money(f.kaufTreuhand)),
   field('W3-Arbeitstreuhand',money(f.arbeitTreuhand)),
   field('Quelle Aldera, echtes Erz',num(s.stations.st_aldera.lager.erz)),
   field('Ziel Nadir, geliefertes Erz',num(s.stations.st_nadir.lager.erz)),
   field('Abgeschlossene Originalverträge',num(w.abgeschlossen)),
   field('Original-W3-Frachtaudit',f.ok?'OK':'FEHLER')
  );
  const active=w.auftrag;
  const phase=active?.phase==='hin'?'Hinflug – Ware an Bord':active?.phase==='rueck'?'Rückflug – Ware bereits bezahlt':'Kein laufender Auftrag';
  $('freight-status').textContent=(ship?'Frachter '+ship.id+' · '+ship.system+' · '+ship.phase:'Noch kein gekaufter Frachter')+' · '+phase;
  const financial=q.ok?
   'Original-Core genehmigt: '+num(scope.W5yOriginal.rules.w3.fracht)+' Erz, Warenwert '+money(q.erzWert)+
   ', gesamte Transportvergütung '+money(q.frachtGebuehr)+', Käuferbindung '+money(q.gesamt)+
   ', Arbeitsreserve '+money(q.arbeitsKosten)+', je '+num(q.zeit)+' Minuten pro Strecke.':
   'Original-W3-Finanzierungsprüfung verweigert: '+(q.grund||'kein finanzierter Auftrag')+'.';
  $('freight-quote').textContent=financial+' Eine Vorschau reserviert noch kein Geld und verspricht keinen zukünftigen Auftrag.';
  // Only historical, already paid Core receipts – not a second future-price or credit calculator.
  const historic=w.beauftragt>0?money(w.kaufAusgaben/w.beauftragt):'Noch keine Zahlung';
  $('freight-demand-gate').textContent='Abgeschlossene und bezahlte Hin-/Rücktransporte: '+num(w.abgeschlossen)+
   ' · In Nadir tatsächlich angekommen: '+num(w.geliefert)+' Erz.'+
   ' Bisherige echte Käuferausgaben: '+money(w.kaufAusgaben)+
   ' · historischer Betrag je begonnenem Auftrag: '+historic+
   ' · aktuell eigene Käufermittel: '+money(s.owners.st_nadir.cash)+'. '+
   (q.ok?'Der Original-W3-Core erlaubt jetzt genau einen neuen Auftrag; Ausführung wird erneut geprüft.':
    'Kein neuer Auftrag laut Original-W3-Core: '+(q.grund||'nicht finanzierbar')+'.')+
   ' Andere Konzern-, Speditions- oder Exportguthaben sind kein Anspruch des Käufers.';
  const buy=ship?null:scope.W5ySessionForUI.preview({type:'freightBuy'});
  $('freight-buy').disabled=!!ship||!buy?.ok;
  $('freight-buy-note').textContent=ship?'Original-Core: Frachter bereits im Eigentum der Spedition.':
   buy?.ok?'Frachterkauf real finanzierbar; Speditionscash '+money(buy.carrierBefore)+' → '+money(buy.carrierAfter)+'.':
   'Frachterkauf gesperrt: '+(buy?.reason||'unbekannt');
  $('freight-start').disabled=!q.ok;
  table($('freight-ledger'),['Core-Frachtbeleg','Reale Buchung'],[
   ['Käufer: bisherige echte W3-Ausgaben',money(w.kaufAusgaben)],
   ['Belegte Transportsparte: bisherige Lohnkosten',money(w.arbeitsKosten)],
   ['Frachtentgelt nach abgeschlossenem Rückflug',money(w.frachtUmsatz)],
   ['Bereits bezahlte Lieferungen in Nadir',num(w.geliefert)+' Erz'],
   ['Aktiver Vertrag und gebundene Mittel',active?active.phase+' / '+money(f.kaufTreuhand)+' Käufer / '+money(f.arbeitTreuhand)+' Arbeit':'Keiner'],
   ['Weltgeld / neue ISK',money(snap.audit.total)+' / '+num(s.minted)],
   ['W3-Core-Audit',f.ok?'OK':'FEHLER']
  ]);
 }
 function mount(session,run){
  scope.W5ySessionForUI=session;
  $('freight-buy').addEventListener('click',()=>run(()=>session.command({type:'freightBuy'})));
  $('freight-start').addEventListener('click',()=>run(()=>session.command({type:'freightStart',schiff:session.snapshot().freight.shipId})));
 }
 scope.W5yExtension=Object.freeze({render,mount});
})(globalThis);
