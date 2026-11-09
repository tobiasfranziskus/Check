'use strict';
(()=>{
 const $=id=>document.getElementById(id),session=W5wSession.create(),{rules}=W5wOriginal;
 const modeName=rules.rulesVersion===191?'W5-Transfer':rules.rulesVersion===19?'W5':rules.rulesVersion===18?'W4':rules.rulesVersion===17?'W3':rules.rulesVersion===16?'W2':'W1';
 const fmt=n=>Number.isSafeInteger(n)?n.toLocaleString('de-DE')+' ISK':'Unbekannt',
  val=x=>x===null||x===undefined?'Unbekannt':typeof x==='object'?JSON.stringify(x):String(x);
 let snap=session.snapshot(),current='mining',revision=0,angle=0;
 const canvas=document.querySelector('canvas'),graphics=W5uGraphics.grafik(canvas);
 const local={x:0,y:0,zoom:.3,reduced:true,selected:null};
 const node=(tag,value)=>{const n=document.createElement(tag);n.textContent=val(value);return n;};
 function table(root,headers,rows){
  const wrap=document.createElement('div');wrap.className='scroll';
  const t=document.createElement('table'),h=document.createElement('tr');
  headers.forEach(k=>h.append(node('th',k)));t.append(h);
  rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(v=>tr.append(node('td',v)));t.append(tr);});
  wrap.append(t);root.append(wrap);
 }
 function component(id,css,mount){
  const shadow=$(id).attachShadow({mode:'open'});
  const link=document.createElement('link');link.rel='stylesheet';link.href=css;
  const mountRoot=document.createElement('div');shadow.append(link,mountRoot);
  return mount(mountRoot);
 }
 const hq=component('hq','../legacy-corporation/corporation.css',root=>{
  root.className='legacy-corporation';root.style.height='100%';
  return LegacyCorporation.mount(root,snap.bundle.corporation);
 });
 const station=component('station','../legacy-station/station.css',root=>{
  root.className='legacy-station';
  return LegacyStation.mount(root,snap.bundle.station);
 });
 function draw(){
  if(current!=='ship')return;
  const s=snap.state.ships[snap.selected];
  $('ship-data').textContent=s?'Schiff '+s.id+' · Besitzer '+s.owner+
   ' · Auftrag '+s.auftrag+' · echtes Erz an Bord '+(s.ladung.erz||0):
   'Noch kein eigenes Schiff. Im Bergbau-Bereich einen Miner mit vorhandenem Kapital kaufen.';
  local.selected=s?.id||null;local.zoom=Number($('zoom').value);
  graphics.zeichnen({t:snap.state.tick,entities:s?
   [{id:s.id,ty:'p',nm:s.id,hull:'miner',x:0,y:0,a:angle}]:[],
   fields:[],cargo:s?.ladung.erz||0,capacity:rules.economy.cargo},local,0);
 }
 function refs(){
  const s=snap.state,f=snap.finance,owner=f.konzerne.house,npc=f.konzerne.npc3;
  const fields=[
   ['Spielerkasse (frei)',fmt(s.owners.house.cash)],
   ['Eigenes Arbeitskapital gebunden',fmt(owner.gebunden)],
   ['NPC-Kasse (frei)',fmt(s.owners.npc3.cash)],
   ['Stationskasse (frei)',fmt(s.owners.st_aldera.cash)],
   ['Abnahmemittel in Treuhand',fmt(f.station.gebunden)],
   ['Endkundenkonto (endlich)',fmt(s.owners.export.cash)],
   ['Nachweis der Geldsumme',fmt(snap.audit.total)],
   ['Geld neu geschöpft',fmt(s.minted)]
  ];
  $('headline-stats').replaceChildren(...fields.map(([name,value])=>{
   const d=document.createElement('div');d.append(node('strong',value),node('span',name));return d;
  }));
  $('finance').replaceChildren();
  const fin=[['Spieler',owner],['NPC-Bergbau',npc],['Station',f.station],['Miner-Verkäufer',f.verkauf],['Endabnehmer',f.kaeufer]];
  table($('finance'),['Eigentümer','Start-ISK','Frei','Gebunden','Erlöse','Kosten','Bilanzergebnis'],
    fin.map(([id,x])=>[id,fmt(x.anfang),fmt(x.frei),fmt(x.gebunden),fmt(x.erloese),fmt(x.kosten),fmt(x.netto)]));
  $('finance').append(node('p','Original-W1-Vollkostenprüfung: '+(f.ok&&snap.audit.vollkosten?.ok?'OK':'FEHLER')+
   ' · Bezahlte Hüllen '+f.minerKaeufe+' · Tatsächliche Förderarbeitskosten '+fmt(f.foerderArbeit)+
   ' · Keine automatische Berechnung einer zukünftigen Gewinnzusage.'));
  $('contracts').replaceChildren();
  const rows=Object.entries(s.erzpilotVertraege||{}).sort(([a],[b])=>a.localeCompare(b)).map(([id,v])=>[
   id,s.ships[id]?.owner||'Unbekannt',v.menge,fmt(s.owners[v.konto]?.cash),
   fmt(s.owners[v.arbeitsKonto]?.cash),v.preis+' ISK/Erz'
  ]);
  table($('contracts'),['Schiff','Eigentümer','Reservierte Erzmenge','Abnahme-ISK gebunden','Arbeits-ISK gebunden','Erzpreis'],rows);
  $('contracts').append(node('p','Aktiv: '+snap.contracts.auftraege+
    ' Verträge · gesamt '+snap.contracts.reserviert+' Erz reserviert · '+
    fmt(snap.contracts.gebunden)+' Käufermittel und '+fmt(snap.contracts.arbeitsGebunden)+
    ' Arbeitskapital. Leere Tabelle bedeutet keine aktiven Verträge.'));
  $('goods').replaceChildren();
  const ships=Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id));
  table($('goods'),['Güterort','Besitzer','Ware','Menge'],
    [['Station Aldera',s.stations.st_aldera.eigentum||'Stationslager','Erz',s.stations.st_aldera.lager.erz],
     ['Station Aldera',s.stations.st_aldera.eigentum||'Stationslager','Miner-Hüllen',s.stations.st_aldera.lager.miner],
     ...ships.map(sh=>[sh.id,sh.owner,'Erz an Bord',sh.ladung.erz||0])]);
  $('goods').append(node('p','W1-Güter-Audit '+(snap.audit.goods.ok?'OK':'FEHLER')+
   ' · Erz tatsächlich gefördert '+s.ledger.erz.mined+
   ' · verkauft/exportiert '+s.ledger.erz.exported+
   ' · Weltgeld '+fmt(snap.audit.total)+'. Käufer haben keine unbegrenzte Kaufpflicht.'));
 }
 function update(){
  snap=session.snapshot();hq.update(snap.bundle.corporation);
  if(snap.selected)hq.selectShip(snap.selected);
  station.update(snap.bundle.station);
  $('identity').textContent='Regel '+snap.state.rulesVersion+' · Schema '+snap.state.schema+
   ' · Tick '+snap.state.tick+' · Hash '+snap.hash+' · Original-Audit '+(snap.audit.ok?'OK':'FEHLER');
  const select=$('ship-select'),old=select.value,owned=Object.values(snap.state.ships)
   .filter(s=>s.owner==='house').sort((a,b)=>a.id.localeCompare(b.id));
  select.replaceChildren(...owned.map(sh=>{const opt=node('option',sh.id+' · '+sh.klasse+' · '+sh.auftrag);opt.value=sh.id;return opt;}));
  if(owned.some(sh=>sh.id===old))select.value=old;else if(snap.selected)select.value=snap.selected;
  const active=snap.state.ships[snap.selected]?.auftrag==='foerdern';
  $('start-mining').disabled=!snap.selected||active;
  $('stop-mining').disabled=!snap.selected||!active;
  $('buy-miner').disabled=!snap.audit.ok;
  const q=session.preview({type:'shipBuy',station:'st_aldera',klasse:'miner'});
  $('buy-preview').textContent=q.ok?'Original-'+modeName+'-Kaufvorschau: '+fmt(q.cashBefore-q.cashAfter)+
   ' bereits vorhandene ISK; Spielerkasse '+fmt(q.cashBefore)+' → '+fmt(q.cashAfter)+
   '. Nach Kauf gehört die Hülle dem Spieler.':'Original-'+modeName+'-Kauf abgelehnt: '+q.reason;
  const mq=snap.selected?session.preview({type:active?'shipWait':'shipMine',schiff:snap.selected,ware:'erz'}):null;
  $('mining-preview').textContent=!snap.selected?'Noch kein eigenes Minerschiff.':
   mq.ok?(active?'Stop möglich. Bei Ausführung werden gelieferte Erz und unbenutztes Treuhandgeld durch den Originalkern abgerechnet.':
      'Förderung anforderbar. Ab dem nächsten Core-Tick reservieren Station und Eigentümer vorhandene Mittel; keine garantierte Dauer-Nachfrage.'):
   'Original-'+modeName+'-Auftrag abgelehnt: '+mq.reason;
  refs();globalThis.W5xExtension?.render(snap);globalThis.W5yExtension?.render(snap);globalThis.W5aaExtension?.render(snap);globalThis.W5abExtension?.render(snap);globalThis.W5acExtension?.render(snap);
  $('fleet-data').replaceChildren();
  table($('fleet-data'),['ID','Eigentümer','Klasse','System','Aktivität','Erz an Bord'],
   Object.values(snap.state.ships).sort((a,b)=>a.id.localeCompare(b.id))
    .map(sh=>[sh.id,sh.owner,sh.klasse,sh.system,sh.auftrag,sh.ladung.erz||0]));
  draw();
 }
 function run(fn){
  revision++;
  try{const r=fn();$('message').textContent=r?.ok===false?'Abgelehnt: '+r.reason:
   'Original-'+modeName+'-Befehl geprüft und ausgeführt. Geld-, Waren- und Vertragsaudit OK.';}
  catch(e){$('message').textContent='Nicht übernommen: '+e.message;}
  update();
 }
 const go=name=>{
  current=name;document.querySelectorAll('[data-panel]').forEach(n=>n.hidden=n.id!==name);
  document.querySelectorAll('[data-view]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.view===name));
  draw();
 };
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
 $('ship-select').addEventListener('change',()=>run(()=>session.select($('ship-select').value)));
 $('hq').shadowRoot.addEventListener('click',e=>{
  const b=e.target.closest('[data-ship]');if(!b)return;
  const row=snap.bundle.corporation.ships?.[Number(b.dataset.ship)];
  if(row)run(()=>session.select(row.id));
 });
 $('buy-miner').addEventListener('click',()=>run(()=>session.command({type:'shipBuy',station:'st_aldera',klasse:'miner'})));
 $('start-mining').addEventListener('click',()=>run(()=>session.command({type:'shipMine',schiff:snap.selected,ware:'erz'})));
 $('stop-mining').addEventListener('click',()=>run(()=>session.command({type:'shipWait',schiff:snap.selected})));
 document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>run(()=>session.advance(Number(b.dataset.step)))));
 $('rotate').addEventListener('click',()=>{angle+=Math.PI/4;draw();});
 $('zoom').addEventListener('input',draw);window.addEventListener('resize',draw);
 $('export').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([session.export()],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=rules.rulesVersion===191?'aphros-w5ac-forschung-w5-transfer-regel191.json':rules.rulesVersion===19?'aphros-w5ab-forschung-w5-regel19.json':rules.rulesVersion===18?'aphros-w5aa-forschung-w4-regel18.json':rules.rulesVersion===17?'aphros-w5y-forschung-w3-regel17.json':rules.rulesVersion===16?'aphros-w5x-forschung-w2-regel16.json':'aphros-w5w-forschung-w1-regel15.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $('import').addEventListener('change',async()=>{
  const file=$('import').files[0],request=++revision;if(!file)return;
  try{
   if(file.size>5*1024*1024)throw Error('Datei größer als 5 MiB');
   const data=await file.text();
   if(request!==revision)return;
   run(()=>session.import(data));
  }catch(e){if(request===revision)$('message').textContent='Nicht übernommen: '+e.message;}
  finally{if($('import').files[0]===file)$('import').value='';}
 });
 globalThis.W5yExtension?.mount(session,run);globalThis.W5aaExtension?.mount(session,run);globalThis.W5abExtension?.mount(session,run);globalThis.W5acExtension?.mount(session,run);
 go('mining');update();
})();
