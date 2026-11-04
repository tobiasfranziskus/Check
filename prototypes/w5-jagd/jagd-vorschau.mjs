import {jagdRenderer} from './m_ui_jagd_renderer.mjs';
import {pilotenText} from './m_ui_jagdsicht.mjs';
import {mockSicht} from './m_ui_jagd_mock.mjs';
const $=id=>document.getElementById(id),select=$('schiffe');
const renderer=jagdRenderer(document.querySelector('canvas'),s=>{
 select.value=s?.id??'';$('auswahl').textContent=s?`${s.id} · ${s.klasse} · ${s.status} · Besitzer ${s.besitzer.id}`:'Kein Ziel gewählt';$('pilot').textContent=pilotenText(s);
});
function zeigen(stufe){
 const view=mockSicht(stufe),id=select.value;
 select.replaceChildren(new Option('Keine Auswahl',''),...view.schiffe.map(s=>new Option(`${s.id} · ${s.besitzer.art}`,s.id)));select.value=id;
 renderer.setSnapshot(view);
 $('ort').textContent=`${view.systemId} / ${view.anomalieId} · Tick ${view.tick}`;
 $('abschuesse').textContent=`${view.ereignisse.filter(e=>e.art==='abschuss').length} belegte Abschüsse in diesem Snapshot`;
 $('ereignisse').replaceChildren(...view.ereignisse.map(e=>{const li=document.createElement('li');li.textContent=`${e.art} · Tick ${e.tick} · ${e.quelleId} → ${e.zielId} · Beleg ${e.belegId}`;return li}));
 for(const b of document.querySelectorAll('[data-stufe]'))b.setAttribute('aria-pressed',Number(b.dataset.stufe)===stufe);
}
select.addEventListener('change',()=>renderer.auswaehlen(select.value));
$('plus').onclick=()=>renderer.zoom(1.25);$('minus').onclick=()=>renderer.zoom(.8);$('zentrum').onclick=()=>renderer.zentrieren();
for(const b of document.querySelectorAll('[data-stufe]'))b.onclick=()=>zeigen(Number(b.dataset.stufe));
zeigen(0);
