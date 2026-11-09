/* W5x: pure read-only presentation of original W2 corporate decision evidence. */
(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const format=v=>Number.isSafeInteger(v)?v.toLocaleString('de-DE'):'Unbekannt';
 const label=(k,v)=>{const card=document.createElement('div'),strong=document.createElement('strong'),caption=document.createElement('span');
  strong.textContent=String(v);caption.textContent=k;card.append(strong,caption);return card;};
 function table(root,heads,rows){
  const wrap=document.createElement('div'),tbl=document.createElement('table'),header=document.createElement('tr');
  wrap.className='scroll';
  for(const h of heads){const cell=document.createElement('th');cell.textContent=h;header.append(cell);}
  tbl.append(header);
  for(const row of rows){const tr=document.createElement('tr');for(const v of row){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}tbl.append(tr);}
  wrap.append(tbl);root.replaceChildren(wrap);
 }
 function render(snap){
  if(snap.state.rulesVersion!==16||!snap.corporation)throw Error('W5x verlangt den Original-W2-Snapshot');
  const c=snap.corporation.crisis,i=snap.corporation.investment,s=snap.state;
  $('w2-company-stats').replaceChildren(
   label('NPC-Firmenkasse (nicht automatisch frei investierbar)',format(s.owners.npc3.cash)+' ISK'),
   label('Endkundenkonto, endlich und geprüft',format(s.owners.export.cash)+' ISK'),
   label('NPC-eigene Miner',format(c.eigene)),
   label('Mit echtem Budget laufende NPC-Verträge',format(c.finanzierte)),
   label('Ruhende NPC-Miner',format(c.ruhend)),
   label('Zahlbarer nächster Erzauftrag laut Core',format(c.planbar)+' Erz')
  );
  $('w2-investment').textContent=i.ok?
   'Original-W2-Core: NPC-Investitionsvoraussetzungen erfüllt; ein Kauf erfolgt ausschließlich beim nächsten zulässigen Core-Schritt aus Firmenmitteln.':
   'Original-W2-Core lehnt einen weiteren Miner-Kauf aktuell ab: '+(i.grund||'nicht finanzierbar')+'.';
  table($('w2-demand'),
   ['Original-W2-Marktprüfung','Wert'],
   [
    ['Krisenstatus',c.status],
    ['Endkundenkasse belegbar',c.kaeuferNachweisOk?'Ja':'NEIN – Finanzierung gesperrt'],
    ['Endkundenkasse (vorhandene ISK)',format(c.kaeuferCash)+' ISK'],
    ['Vorhandenes/gebundenes Erz vor nächstem Absatz',format(c.vorbestand)],
    ['Fehlendes Kundenbudget für neue Nachfrage',format(c.kundenlueckeISK)+' ISK'],
    ['Freie physische Erz-Lagerplätze',format(c.freiePlaetze)],
    ['Zusätzliche Erzmenge durch Stationskasse',format(c.stationsMenge)],
    ['Zusätzliche Erzmenge durch Kundenbudget',format(c.kaeuferMenge)],
    ['Zusätzliche Erzmenge durch NPC-Arbeitskasse',format(c.arbeitsMenge)],
    ['Davon gleichzeitig finanzierbar',format(c.planbar)],
    ['Weltgeldmenge (muss mit Audit übereinstimmen)',format(snap.audit.total)+' ISK'],
    ['Neue ISK',format(s.minted)]
   ]);
  const ships=Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner')
   .sort((a,b)=>a.id.localeCompare(b.id));
  table($('w2-fleet'),['Schiff-ID','Eigentümer','Core-Auftrag','Erz an Bord','Finanzierter W0-Vertrag'],
   ships.map(sh=>[sh.id,sh.owner,sh.auftrag,format(sh.ladung.erz||0),
    s.erzpilotVertraege?.[sh.id]?'Ja, '+format(s.erzpilotVertraege[sh.id].menge)+' Erz':'Nein']));
  $('w2-warning').textContent=c.status==='absatzstopp'?
   'Absatzstopp: Der Endkundenetat ist aufgebraucht. '+c.ruhend+' NPC-Miner ruhen trotz '+format(c.unternehmenCash)+
   ' ISK Firmenkapital. Ohne belegtes neues Käufergeld gibt es keinen Wiederanlauf und keine Gratisrettung.':
   'Eigene und NPC-Miner konkurrieren um begrenzte, real finanzierte Käufermittel. Firmenkapital allein ist kein Absatznachweis. Kein automatischer Geldtransfer; kein neuer Core.';
 }
 scope.W5xExtension=Object.freeze({render});
})(globalThis);
