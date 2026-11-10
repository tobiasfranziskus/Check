/* Rule195 UI only: Legacy renderer, authoritative session commands, no flight simulation. */
(function(scope){
'use strict';
function model(snap,rules){
 const s=snap.state,ship=s.ships[snap.selected]||null;
 const fields=rules.world.fields.filter(f=>f.system===ship?.system);
 const cargo=ship?Object.values(ship.ladung).reduce((a,b)=>a+b,0):0;
 const contract=ship?s.erzpilotVertraege?.[ship.id]||null:null;
 return {ship,fields,cargo,capacity:rules.economy.cargo,contract,
  finance:snap.finance.konzerne.house,
  station:ship?rules.world.systems[ship.system]?.station:null};
}
const $=id=>document.getElementById(id);
function render(snap,session){
 const rules=scope.W5wOriginal.rules,m=model(snap,rules),s=snap.state,sh=m.ship;
 const select=$('miner-select');
 // Rebuild only on fleet/selection change; preserve native touch interaction between ticks.
 const owned=Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='miner').sort((a,b)=>a.id.localeCompare(b.id));
 const key=JSON.stringify(owned.map(x=>x.id));
 if(select.dataset.fleet!==key){select.replaceChildren(...owned.map(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.id;return o;}));select.dataset.fleet=key;}
 select.value=snap.selected||'';select.disabled=!owned.length;
 $('miner-location').textContent=sh?`${sh.id} · Eigentümer ${sh.owner} · System ${sh.system} · Station ${m.station} · Phase ${sh.phase} · Ziel ${sh.ziel||'keines'} · Ankunft ${sh.phase==='reise'?sh.ankunft:'–'} · Tick ${s.tick}`:'Noch kein eigener Miner. Eine reale Werfthülle kaufen oder Regel195-JSON importieren.';
 const requests=[['miner-erz',{type:'shipMine',schiff:snap.selected,ware:'erz'},'Erz'],['miner-eis',{type:'shipMine',schiff:snap.selected,ware:'eis'},'Eis'],['miner-stop',{type:'shipWait',schiff:snap.selected},'Stopp']];
 $('miner-offers').textContent=requests.map(([id,req,name])=>{
  const q=session.preview(req),same=sh?.auftrag==='foerdern'&&sh.ware===req.ware;
  const limit=req.type==='shipMine'?scope.W5agExtension.miningLimit(snap,req.ware):null;
  const reason=!q.ok?q.reason:limit?limit:same?'bereits aktiv':id==='miner-stop'&&sh?.auftrag!=='foerdern'?'kein laufender Förderauftrag':null;
  $(id).disabled=!!reason;$(id).title=reason||'Vom Core zugelassen';
  return name+': '+(reason||'Befehl zulässig; Finanzierung und Förderung prüft der Core beim nächsten Tick');
 }).join(' | ');
 scope.W5agExtension.renderSale(snap,session,'miner-sell');
 const buy=session.preview({type:'shipBuy',station:'st_aldera',klasse:'miner'});
 $('miner-buy').disabled=!buy.ok;$('miner-buy-quote').textContent=buy.ok?`Kauf: ${buy.cashBefore-buy.cashAfter} ISK aus vorhandener Spielerkasse.`:'Kauf gesperrt: '+buy.reason;
 const cargo=$('miner-cargo');cargo.replaceChildren();
 const label=document.createElement('p');label.textContent=`Fracht ${m.cargo}/${m.capacity} · Erz ${sh?.ladung.erz||0} · Eis ${sh?.ladung.eis||0}`;
 const meter=document.createElement('meter');meter.min=0;meter.max=m.capacity;meter.value=m.cargo;meter.setAttribute('aria-label','Belegter Frachtraum');cargo.append(label,meter);
 const f=m.finance;
 $('miner-finance').textContent=`Spielerkasse frei ${f.frei} ISK · gebunden ${f.gebunden} ISK · tatsächlich gebuchte Erlöse ${f.erloese} ISK · Kosten ${f.kosten} ISK · Bilanzergebnis ${f.netto} ISK (einschließlich Schiffskauf). Kein persönlicher Miner-Pilotenlohn. Erz-/Eis-Frachtpiloten separat: ${s.owners.pilot_erz.cash}/${s.owners.pilot_eis.cash} ISK.`;
 $('miner-order').textContent=sh?`Auftrag ${sh.auftrag} · Ressource ${sh.ware} · `+(m.contract?`Erzvertrag: ${m.contract.menge} Einheiten, Käufermittel ${s.owners[m.contract.konto].cash} ISK, Arbeitsreserve ${s.owners[m.contract.arbeitsKonto]?.cash||0} ISK.`:'Kein reservierter Erzvertrag. Eis wird im Core bei erreichter Charge und finanzierbarer Abnahme verkauft; Restladung manuell an Aldera anbieten. Ohne Käufergeld bleibt sie an Bord.'):'Kein Auftrag ausgewählt.';
 $('miner-resources').textContent='Ressourcen im aktuellen System: '+(m.fields.map(f=>f.ware).join(', ')||'keine')+'. Der Core speichert hier keinen endlichen Feldrestbestand. Aldera-Lager: Erz '+s.stations.st_aldera.lager.erz+', Eis '+s.stations.st_aldera.lager.eis+'.';
 $('miner-evidence').textContent=JSON.stringify({tick:s.tick,hash:snap.hash,audit:snap.audit.ok,schiff:sh,erzvertrag:m.contract,foerderzaehler:{erz:s.ledger.erz.mined,eis:s.ledger.eis.mined},eisVerkauf:{menge:s.w5n.mineVerkauft,wert:s.w5n.mineVerkaufWert},finanzen:f},null,2);
 const map=$('miner-map');map.replaceChildren();
 for(const [system,def]of Object.entries(rules.world.systems)){
  const article=document.createElement('article'),title=document.createElement('h3'),text=document.createElement('p');title.textContent=system+' · '+def.station;
  text.textContent=Object.values(s.ships).filter(x=>x.system===system).map(x=>`${x.id} (${x.owner}, ${x.phase}, ${x.auftrag}${x.ziel?', Ziel '+x.ziel:''})`).join(' · ')||'Keine Schiffe';article.append(title,text);map.append(article);
 }
 const route=document.createElement('p');route.textContent='Core-Routen: '+rules.world.gates.map(([a,b,t])=>`${a} ↔ ${b}: ${t} Minuten`).join(' · ');map.append(route);
}
function draw(snap,graphics,local,angle){
 const m=model(snap,scope.W5wOriginal.rules),sh=m.ship;
 const fields=m.fields.map((f,i)=>({...f,x:350,y:(i-(m.fields.length-1)/2)*340}));
 // All coordinates below are layout units. Only system/phase/cargo/order come from Core.
 const entities=sh?[{id:sh.id,ty:'p',nm:sh.id,hull:'miner',x:0,y:0,a:angle},
  {id:m.station,ty:'s',nm:m.station,x:-420,y:-250},
  ...fields.map(f=>({id:f.ware,ty:'r',nm:f.ware,x:f.x,y:f.y,ore:1}))]:[];
 local.selected=sh?.id||null;local.zoom=Number($('zoom').value);
 graphics.zeichnen({t:snap.state.tick,entities,fields,cargo:m.cargo,capacity:m.capacity,ware:sh?.ware,auftrag:sh?.auftrag,phase:sh?.phase},local,0);
 $('ship-data').textContent=sh?`${sh.id}: ${sh.auftrag} · ${sh.ware} · ${m.cargo}/${m.capacity} Fracht · Core-Phase ${sh.phase}`:'Kein Miner ausgewählt.';
}
function mount(session,run){
 document.querySelectorAll('[data-miner-view]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-view="'+b.dataset.minerView+'"]').click()));
 for(const ware of ['erz','eis'])$('miner-'+ware).addEventListener('click',()=>run(()=>session.command({type:'shipMine',schiff:session.snapshot().selected,ware})));
 $('miner-sell').addEventListener('click',()=>run(()=>session.command(scope.W5agExtension.saleRequest(session.snapshot(),'miner-sell'))));
 $('miner-sell-amount').addEventListener('input',()=>scope.W5agExtension.renderSale(session.snapshot(),session,'miner-sell'));
 $('miner-stop').addEventListener('click',()=>run(()=>session.command({type:'shipWait',schiff:session.snapshot().selected})));
 $('miner-buy').addEventListener('click',()=>run(()=>session.command({type:'shipBuy',station:'st_aldera',klasse:'miner'})));
 $('miner-select').addEventListener('change',()=>run(()=>session.select($('miner-select').value)));
 for(const n of [1,10,50])$('miner-step-'+n).addEventListener('click',()=>run(()=>session.advance(n)));
}
const api=Object.freeze({model,render,draw,mount});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5agMiner=api;
})(globalThis);
