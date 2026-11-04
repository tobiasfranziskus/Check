import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {jagdSichtV1,lagen,pilotenText} from '../prototypes/w5-jagd/m_ui_jagdsicht.mjs';
import {mockSicht} from '../prototypes/w5-jagd/m_ui_jagd_mock.mjs';
import {jagdRenderer} from '../prototypes/w5-jagd/m_ui_jagd_renderer.mjs';
import {eingabe} from '../prototypes/w5-jagd/m_ui_jagd_vektoren.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
test('JagdSichtV1 trennt und friert Snapshot rekursiv ein; Identitäten und optionale Daten bleiben erhalten',()=>{
 const raw=clone(mockSicht(2));raw.schiffe[0].pilotId='pilot-real';raw.schiffe[0].xp=0;
 const v=jagdSichtV1(raw);raw.schiffe[0].besitzer.id='manipuliert';
 assert.equal(v.schiffe[0].besitzer.id,'house');assert(Object.isFrozen(v.ereignisse[0]));assert(Object.isFrozen(v.schiffe[0].besitzer));
 assert.throws(()=>v.schiffe[0].status='flug',TypeError);assert.match(pilotenText(v.schiffe[0]),/pilot-real.*XP: 0.*Rang: unbekannt/);
 assert.equal('xp' in v.schiffe[1],false);assert.match(pilotenText(v.schiffe[1]),/XP: unbekannt/);
 const reverse={...v,schiffe:[...v.schiffe].reverse()};assert.deepEqual(lagen(reverse),lagen(v));
});
test('Unbelegte, zukünftige, doppelte und nicht referenzierbare Kampfereignisse werden abgewiesen',()=>{
 for(const change of [v=>v.ereignisse[0].belegId='',v=>v.ereignisse[0].tick=999,v=>v.ereignisse[0].zielId='erfunden',v=>v.ereignisse.push(v.ereignisse[0]),v=>v.schiffe[2].status='jagd',v=>v.schiffe.push(v.schiffe[0]),v=>v.schiffe[0].position={x:Infinity,y:0}]){
  const v=clone(mockSicht(2));change(v);assert.throws(()=>jagdSichtV1(v),TypeError);
 }
});
test('100 Renderframes, Zoom, Auswahl und Snapshotwechsel verändern keinen W5-Save/Hash und keine Projektion',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const code=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
 const c=new Function(code+';return m_core_index')(),state=c.createW5State(42),before=c.save(state),hash=c.hash(state);
 let strokes=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{strokes++}});
 const canvas={clientWidth:900,clientHeight:500,getContext:()=>ctx,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:900,height:500})};
 const view=mockSicht(2),serialized=JSON.stringify(view),r=jagdRenderer(canvas);
 r.setSnapshot(view);for(let i=0;i<100;i++)r.zeichnen();r.zoom(1.25);r.auswaehlen('mock:sh101');r.zentrieren();r.setSnapshot(mockSicht(0));r.dispose();
 assert(strokes>100);assert.equal(JSON.stringify(view),serialized);assert.equal(c.save(state),before);assert.equal(c.hash(state),hash);assert.equal(canvas.onpointerdown,null);
});
test('Extraktion nutzt wörtlich vorhandene GX- und Touchfunktionen ohne Core/Boot-Import',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const src=fs.readFileSync(new URL('../prototypes/w5-jagd/m_ui_jagd_vektoren.mjs',import.meta.url),'utf8');
 for(const line of src.split('\n').filter(l=>l&&!l.startsWith('//')&&!l.startsWith('const GX=')&&!l.startsWith('export ')))assert(html.includes(line),line.slice(0,90));
 for(const name of ['m_ui_jagd_renderer.mjs','m_ui_jagdsicht.mjs','m_ui_jagd_vektoren.mjs']){
  const s=fs.readFileSync(new URL('../prototypes/w5-jagd/'+name,import.meta.url),'utf8');assert.doesNotMatch(s,/m_core_|localStorage|indexedDB|requestAnimationFrame|setInterval|Math.random/);
 }
});
test('Touch: Pinch, Cancel, langer Druck und Kontextwechsel selektieren nicht',()=>{
 const local={zoom:.32},canvas={setPointerCapture(){}};let calls=0,context='a';const i=eingabe(canvas,local,()=>calls++,()=>context);
 const e=(id,x,t=0)=>({pointerId:id,clientX:x,clientY:0,timeStamp:t,button:0});
 i.down(e(1,0));i.up(e(1,0,50));assert.equal(calls,1);
 i.down(e(1,0));i.down(e(2,100));i.move(e(2,120));assert(local.zoom>.32);i.up(e(2,120,50));i.up(e(1,0,50));
 i.down(e(1,0));i.clear();i.up(e(1,0,50));i.down(e(1,0));i.up(e(1,0,700));
 i.down(e(1,0));context='b';i.up(e(1,0,50));assert.equal(calls,1);
});
