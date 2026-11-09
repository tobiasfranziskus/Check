'use strict';
(()=>{
 const $=id=>document.getElementById(id),session=W5uSession.create(),{core,rules}=W5uOriginal;
 let current='hq',revision=0,angle=0;
 const local={x:0,y:0,zoom:.3,reduced:true,selected:null},gfx=W5uGraphics.grafik(document.querySelector('canvas'));
 function component(id,css,mount){const root=$(id).attachShadow({mode:'open'}),link=document.createElement('link');link.rel='stylesheet';link.href=css;const target=document.createElement('div');root.append(link,target);return mount(target);}
 let snap=session.snapshot();
 const hq=component('hq','../legacy-corporation/corporation.css',el=>{el.className='legacy-corporation';el.style.height='100%';return LegacyCorporation.mount(el,snap.bundle.corporation);});
 const station=component('station','../legacy-station/station.css',el=>{el.className='legacy-station';return LegacyStation.mount(el,snap.bundle.station);});
 const text=v=>v==null?'Unbekannt':typeof v==='object'?JSON.stringify(v):String(v);
 function node(tag,value){const n=document.createElement(tag);n.textContent=text(value);return n;}
 function table(root,headers,rows){const wrap=document.createElement('div');wrap.className='scroll';const t=document.createElement('table'),head=document.createElement('tr');headers.forEach(x=>head.append(node('th',x)));t.append(head);rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(v=>tr.append(node('td',v)));t.append(tr);});wrap.append(t);root.append(wrap);}
 function options(select,rows){const old=select.value;select.replaceChildren(...rows.map(([id,name])=>{const o=node('option',name);o.value=id;return o;}));if(rows.some(([id])=>id===old))select.value=old;}
 function draw(){
  if(current!=='ship')return;const s=snap.state.ships[snap.selected];
  if(!s)return;
  const supported=['miner','frachter'].includes(s.klasse);
  $('ship-title').textContent=s.id+' · '+s.klasse+(supported?'':' · 2D-Rolle nicht unterstützt');
  $('ship-state').textContent=text({owner:s.owner,system:s.system,phase:s.phase,auftrag:s.auftrag,ladung:s.ladung});
  local.selected=s.id;local.zoom=Number($('zoom').value);
  gfx.zeichnen({t:snap.state.tick,entities:supported?[{id:s.id,ty:'p',nm:s.rufname||s.id,hull:s.klasse==='miner'?'miner':'trader',x:0,y:0,a:angle}]:[],fields:[],cargo:Object.values(s.ladung).reduce((a,b)=>a+b,0),capacity:rules.economy.cargo},local,0);
 }
 function quoteLabel(q,action){
  if(!q.ok)return 'Originalkern lehnt '+action+' ab: '+q.reason+'. Keine Abbuchung oder Warenbewegung.';
  const cash=Math.abs(q.cashDelta)+' ISK '+(q.cashDelta<0?'Zahlung':q.cashDelta>0?'Eingang':'ohne Kontobewegung');
  if(q.type==='shipActivate')
   return 'Vorschau: '+cash+' · Eigene Schiffe '+q.ownedShipsBefore+' → '+q.ownedShipsAfter
    +' · Hüllen an Bord '+q.cargoBefore+' → '+q.cargoAfter+'. Kern-Audit OK.';
  return 'Vorschau: '+cash+' · Eigene Kasse '+q.cashBefore+' → '+q.cashAfter+' ISK'
    +' · '+q.ware+' an Bord '+q.cargoBefore+' → '+q.cargoAfter
    +(q.station?' · Stationslager '+q.stationBefore+' → '+q.stationAfter:'')
    +'. Kern-Audit OK.';
 }
 function price(){
  const form=$('trade'),sh=snap.state.ships[snap.selected],ware=form.elements.ware.value,
    st=sh&&snap.state.systems[sh.system]?.station;
  $('price').textContent=st?'Core-Basispreis je Einheit: '+core.preis(snap.state,st,ware)
    +' ISK. Gebühren und Gesamtbetrag stehen in der folgenden Originalkern-Vorschau.':'Preis unbekannt';
  if(sh){
   const q=session.preview({type:'shipTrade',schiff:snap.selected,ware,
      menge:Number(form.elements.menge.value),kauf:form.elements.kauf.value==='true'});
   $('trade-preview').textContent=quoteLabel(q,'den Handel');
   const a=session.preview({type:'shipActivate',schiff:snap.selected,
     klasse:$('activate').elements.klasse.value});
   $('activate-preview').textContent=quoteLabel(a,'die Inbetriebnahme');
  }else{
   $('trade-preview').textContent='Kein eigenes Schiff ausgewählt.';
   $('activate-preview').textContent='Kein eigenes Schiff ausgewählt.';
  }
  // Vorschau ist ein sofortiger, isolierter Core-Zustandsübergang; kein
  // garantierter Preis in der Zukunft und keine tatsächliche Reservierung.
 }
 function refresh(){
  snap=session.snapshot();hq.update(snap.bundle.corporation);if(snap.selected)hq.selectShip(snap.selected);station.update(snap.bundle.station);
  $('identity').textContent='Eigentümer '+snap.owner+' · Tick '+snap.state.tick+' · Hash '+snap.hash+' · Geld-/Warenaudit '+(snap.audit.ok?'OK':'FEHLER');
  const ships=Object.values(snap.state.ships).sort((a,b)=>a.id.localeCompare(b.id));
  options($('selection'),ships.filter(s=>s.owner===snap.owner).map(s=>[s.id,s.id+' · '+s.klasse+' · '+(s.rufname||s.id)]));$('selection').value=snap.selected;
  $('fleet').replaceChildren(node('h2','Eigene Flotte'));
  const fields=s=>[s.id,s.owner,s.klasse,s.system,s.phase,s.auftrag,s.ladung];
  const headers=['ID','Eigentümer','Klasse','System','Phase','Auftrag','Bordladung (Eigentum unbekannt)'];
  table($('fleet'),headers,ships.filter(s=>s.owner===snap.owner).map(fields));$('fleet').append(node('h2','Fremde Schiffe · nur lesend'));table($('fleet'),headers,ships.filter(s=>s.owner!==snap.owner).map(fields));
  $('yard').replaceChildren(node('h2','Stationen und Werft · belegte Core-Daten'));
  for(const st of Object.values(snap.state.stations)){
   $('yard').append(node('h3',st.id),node('p','Eigentümer: '+text(st.eigentum)+' · Konten sind keine Eigentumsbelege.'));
   table($('yard'),['Ware / Hülle','Physischer Lagerbestand'],Object.entries(st.lager));
   table($('yard'),['Produktionsrezept','Restminuten','Herkunft'],st.linien.map(l=>[l.rezept,l.rest,l.herkunft]));
  }
  $('yard').append(node('p','Gewinn, freie Reserven und Bauangebote: unbekannt. Hüllen können über den Warenhandel gekauft und anschließend aus der Bordladung in Dienst gestellt werden. Direkter Bau ist nicht angebunden.'),node('pre',snap.bundle.financialEvidence));
  const s=snap.state.ships[snap.selected];
  $('actions').hidden=!s;
  if(s){options($('mine').elements.ware,rules.world.fields.filter(f=>f.system===s.system).map(f=>[f.ware,f.ware]));$('mine').querySelector('button').disabled=s.klasse!=='miner'||!$('mine').elements.ware.options.length;
   document.querySelector('[data-command="shipHandeln"]').disabled=s.klasse!=='frachter';}
  price();draw();
 }
 function act(fn){revision++;try{const result=fn();$('status').textContent=result?.ok===false?'Abgelehnt: '+result.reason:'Ausgeführt; Originalkern und Audit geprüft.';}catch(e){$('status').textContent='Nicht übernommen: '+e.message;}refresh();}
 function command(intent){act(()=>session.command({schiff:snap.selected,...intent}));}
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{current=b.dataset.view;document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.id!==current);document.querySelectorAll('[data-view]').forEach(n=>n.toggleAttribute('aria-current',n===b));draw();}));
 $('selection').addEventListener('change',()=>act(()=>session.select($('selection').value)));
 $('hq').shadowRoot.addEventListener('click',e=>{const b=e.target.closest('[data-ship]');if(b){const row=snap.bundle.corporation.ships[Number(b.dataset.ship)];if(row)act(()=>session.select(row.id));}});
 document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>act(()=>session.advance(Number(b.dataset.step)))));
 document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>command({type:b.dataset.command})));
 for(const [id,type] of Object.entries({rename:'shipRename',mine:'shipMine',move:'shipMove',trade:'shipTrade',activate:'shipActivate'}))$(id).addEventListener('submit',e=>{e.preventDefault();const args=Object.fromEntries(new FormData(e.target));if(id==='trade'){args.menge=Number(args.menge);args.kauf=args.kauf==='true';}command({type,...args});});
 options($('move').elements.ziel,Object.keys(rules.world.stations).map(id=>[id,id]));
 options($('trade').elements.ware,Object.keys(rules.economy.waren).map(id=>[id,id]));
 options($('activate').elements.klasse,Object.entries(rules.economy.waren).filter(([,v])=>v.stufe==='schiff').map(([id])=>[id,id]));
 for(const field of ['ware','menge','kauf']){
  const el=$('trade').elements[field];
  el.addEventListener(field==='menge'?'input':'change',price);
 }
 $('activate').elements.klasse.addEventListener('change',price);
 $('rotate').addEventListener('click',()=>{angle+=Math.PI/4;draw();});$('zoom').addEventListener('input',draw);window.addEventListener('resize',draw);
 $('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([session.export()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='aphros-w5u-forschung-r14.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('import').addEventListener('change',async()=>{const file=$('import').files[0],request=++revision;if(!file)return;try{if(file.size>5*1024*1024)throw Error('Datei größer als 5 MiB');const text=await file.text();if(request!==revision)return;act(()=>session.import(text));}catch(e){if(request===revision)$('status').textContent='Nicht übernommen: '+e.message;}finally{if($('import').files[0]===file)$('import').value='';}});
 refresh();document.querySelector('[data-view="hq"]').setAttribute('aria-current','page');
})();
