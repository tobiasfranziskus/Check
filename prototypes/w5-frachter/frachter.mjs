import {vorhandeneModule,sitzung} from './m_ui_frachter_core.mjs';
import {frachterSicht} from './m_ui_frachter_sicht.mjs';
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas');
try {
 const response=await fetch('../../index.html');if(!response.ok)throw Error('Core konnte nicht geladen werden');
 const {api,grafik}=vorhandeneModule(await response.text()),session=sitzung(api),renderer=grafik.grafik(canvas);
 let selected=null,view;
 const local={x:0,y:0,zoom:.32,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,selected:null};
 const geld=n=>new Intl.NumberFormat('de-DE').format(n)+' ISK';
 const message=text=>{$('meldung').textContent=text;};
 function draw(){if(view)renderer.zeichnen(view.canvas,local,0);}
 function render(){
  view=frachterSicht(api,session.lesen(),selected);selected=view.schiff?.id??null;local.selected=selected;canvas.dataset.schiff=selected??'';
  const old=$('schiff').value;
  if([...$('schiff').options].map(o=>o.value).join('|')!==view.schiffe.map(s=>s.id).join('|')){
   $('schiff').replaceChildren(...view.schiffe.map(s=>new Option(`${s.name} · ${s.id} · ${s.owner}`,s.id)));
   if(!view.schiffe.length)$('schiff').add(new Option('Noch kein bezahlter Frachter',''));
  }
  $('schiff').value=selected??old;
  const sh=view.schiff,w=view.stand;
  $('details').textContent=sh?`ID ${sh.id} · Eigentümer ${sh.owner} · ${sh.phase==='reise'?'Abflug aus':'Standort'} ${sh.system} · Ziel ${sh.ziel??'–'}`:'Erst echte Erzproduktion abwarten und einen Frachter kaufen.';
  $('ladung').textContent='Ladung: '+(sh?Object.entries(sh.ladung).filter(([,n])=>n>0).map(([id,n])=>`${n} ${id}`).join(', ')||'leer':'kein Schiff');
  $('route').textContent=view.richtung+(view.rest===null?'':` · Ankunft Tick ${sh.ankunft} · noch ${view.rest} Minuten`);
  $('zeit').textContent=`Core-Tick ${view.tick} · pausiert zwischen Schritten`;
  $('hash').textContent=`Deterministischer Core-Hash: ${view.hash}`;
  $('lager').textContent=`Echtes Erz im Lager: Aldera ${view.lager.aldera} · Nadir ${view.lager.nadir}`;
  $('grund').textContent=view.plan.grund;
  const rows=[['Freie Speditionskasse',w.carrier],['Freies Kaufbudget Nadir',w.buyer],['Gebundenes Kaufbudget inkl. Frachtentgelt',w.kaufTreuhand],['Gebundene Arbeitsreserve',w.arbeitTreuhand],['Bezahlte Frachterlöhne (kumuliert)',w.paidWork],['Frachterlöse (kumuliert)',w.freightRevenue]];
  if(view.plan.ok)rows.push(['Kaufbudget dieses Angebots',view.plan.gesamt],['Arbeitsreserve dieses Angebots',view.plan.arbeitsKosten],['Frachtentgelt bei Abschluss',view.plan.frachtGebuehr]);
  $('geld').replaceChildren(...rows.flatMap(([label,n])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=geld(n);return[dt,dd];}));
  $('audit').textContent=view.audit.ok?'Geld-/Warenaudits OK':'Auditfehler – Änderungen gesperrt';
  document.querySelectorAll('[data-step],#import,#export').forEach(b=>b.disabled=!view.audit.ok);
  $('kauf').textContent=`Frachter in Aldera kaufen · ${geld(api.W3_RULES.economy.waren.frachter.basis)}`;
  $('kauf').disabled=!view.audit.ok;
  $('start').disabled=!view.audit.ok||!view.plan.ok;
  draw();
 }
 function command(cmd){const result=session.befehl(cmd);message(result.ok?'Core-Befehl ausgeführt.':`Core lehnt ab: ${result.reason}`);render();}
 $('kauf').onclick=()=>command({type:'shipBuy',owner:api.W3_RULES.w3.spedition,klasse:'frachter',station:'st_aldera'});
 $('start').onclick=()=>command({type:'shipFreight',owner:api.W3_RULES.w3.spedition,schiff:selected});
 $('schiff').onchange=()=>{selected=$('schiff').value;render();};
 document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{session.schritt(Number(b.dataset.step));render();message('Core-Zeitschritt abgeschlossen.');});
 $('minus').onclick=()=>{local.zoom=Math.max(.1,local.zoom-.05);draw();};
 $('plus').onclick=()=>{local.zoom=Math.min(.5,local.zoom+.05);draw();};
 grafik.eingabe(canvas,local,(x,y)=>{const hit=grafik.treffer(view.canvas,local,canvas.getBoundingClientRect(),x,y,renderer.radius);if(hit?.ty==='p'){selected=hit.id;render();}},()=>selected);
 canvas.addEventListener('pointermove',draw);
 let breite=0;
 new ResizeObserver(()=>{if(canvas.clientWidth!==breite){breite=canvas.clientWidth;local.zoom=Math.min(.32,Math.max(.08,(breite-100)/1820));}draw();}).observe(canvas);
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([session.export()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='aphros-w3-frachter.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{const text=await file.text();api.loadW3(text);if(!confirm('Diese flüchtige Sitzung durch den geprüften W3-Spielstand ersetzen?'))return;session.import(text);selected=null;render();message('W3-Spielstand geprüft und importiert.');}catch(err){message('Import abgelehnt; Sitzung unverändert: '+err.message);}};
 render();message('Echte W3-Sitzung bereit. +50 Minuten lässt den vorhandenen NPC Erz fördern; Kauf und Auftrag bleiben ausdrückliche Core-Befehle.');
}catch(err){$('meldung').textContent='Noch nicht verfügbar: '+err.message;}
