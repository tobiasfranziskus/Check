import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const coreCode=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const uiCode=html.slice(html.indexOf('const m_ui_miner2d ='),html.indexOf('const m_ui_main ='));
const {c,r,u}=new Function(coreCode+uiCode+';return {c:m_core_index,r:m_data_rules.RULES,u:m_ui_miner2d}')();
function setup(){const s=c.createState(42,r);return {s,id:Object.keys(s.ships).find(id=>s.ships[id].owner==='house'&&s.ships[id].klasse==='miner')}}
test('2D-Projektion ist eingefroren, abgetrennt und unabhängig von Objekt-Einfügereihenfolge',()=>{
 const {s,id}=setup(),before=c.save(s),v=u.zustand(s,r,id);
 assert(Object.isFrozen(v.entities[0]));assert.throws(()=>v.entities[0].x=22,TypeError);
 const reversed=JSON.parse(before);reversed.ships=Object.fromEntries(Object.entries(reversed.ships).reverse());
 assert.deepEqual(u.zustand(reversed,r,id),v);assert.equal(c.save(s),before);assert.equal(u.zustand(s,r,'fehlt'),null);
});
test('Explizite Intents benutzen dieselbe Core-Queue, Tickfolge, Audits und Save/Load',()=>{
 const {s,id}=setup(),other=c.load(c.save(s),undefined,r),ware=u.zustand(s,r,id).fields[0].ware;
 for(const intent of [{art:'foerdern',ware},{art:'halten'},{art:'reisen',ziel:'st_cyris'}]){
  assert(u.befehl(s,r,id,intent).ok);
  const cmd=intent.art==='foerdern'?{type:'shipMine',ware}:intent.art==='halten'?{type:'shipWait'}:{type:'shipMove',ziel:intent.ziel};
  assert(c.submit(other,{...cmd,owner:'house',schiff:id},r).ok);
  for(let i=0;i<20;i++){c.step(s,r);c.step(other,r);assert.equal(c.hash(s),c.hash(other));assert(c.audit(s).ok)}
 }
 assert.equal(c.hash(c.load(c.save(s),undefined,r)),c.hash(s));
});
test('Fremde Schiffe, falsche Ware, fehlende Flugbefehle werden abgelehnt',()=>{
 const {s,id}=setup(),before=c.save(s),foreign=Object.keys(s.ships).find(id=>s.ships[id].owner!=='house');
 for(const [ship,intent]of [[foreign,{art:'halten'}],[id,{art:'foerdern',ware:'falsch'}],[id,{art:'goto',x:1,y:2}],[id,{art:'warp'}]])assert.equal(u.befehl(s,r,ship,intent).ok,false);
 assert.equal(c.save(s),before);
});
test('Touch-Auswahl verwendet CSS-Pixel und 44px Mindestziel',()=>{
 const view={entities:[{id:'a',x:0,y:0}]},local={x:0,y:0,zoom:.32},rect={left:10,top:20,width:500,height:300};
 assert.equal(u.treffer(view,local,rect,280,170,()=>3).id,'a');assert.equal(u.treffer(view,local,rect,283,170,()=>3),null);assert.equal(u.treffer(view,local,rect,-1,0,()=>3),null);
});
test('Tap, Pinch, Drag, Hold, Cancel und Kontextwechsel sind getrennt; niemals Befehle',()=>{
 const canvas={setPointerCapture(){},hasPointerCapture(){return false}},local={zoom:.32};let calls=0,context='a';
 const input=u.eingabe(canvas,local,()=>calls++,()=>context),ev=(id,x,y,t=0)=>({pointerId:id,clientX:x,clientY:y,timeStamp:t,button:0});
 input.down(ev(1,10,10));input.up(ev(1,10,10,50));assert.equal(calls,1);
 input.down(ev(1,10,10));input.move(ev(1,30,10));input.up(ev(1,30,10,50));
 input.down(ev(1,10,10));input.up(ev(1,10,10,700));
 input.down(ev(1,10,10));input.clear();input.up(ev(1,10,10,30));
 input.down(ev(1,10,10));context='b';input.up(ev(1,10,10,30));
 input.down(ev(1,10,10));input.down(ev(2,50,10));input.move(ev(2,90,10));assert.equal(local.zoom,.5);input.up(ev(2,90,10,50));input.up(ev(1,10,10,60));
 assert.equal(calls,1);
});
test('Übernommene Grafikzeilen bleiben mit den Quell-Hashes belegbar',async()=>{
 const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(fs.readFileSync(new URL('./fixtures/miner2d-herkunft.json',import.meta.url)));
 const hashes=new Set(uiCode.split('\n').map(line=>createHash('sha256').update(line).digest('hex')));
 for(const source of manifest.sources)for(const line of source.verbatimLines)assert(hashes.has(line.sha256),source.path+':'+line.line);
 assert(manifest.sources.find(s=>s.path.includes('390-')).verbatimLines.length>15);
});
test('Zeichnen vieler Frames verändert weder Core-RNG noch Save/Hash',()=>{
 const {s,id}=setup(),before=c.save(s),v=u.zustand(s,r,id);let calls=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),createPattern:()=>({})},{get:(o,k)=>k in o?o[k]:()=>{calls++}});
 const canvas={getContext:()=>ctx,clientWidth:900,clientHeight:600};
 globalThis.document={createElement:()=>({getContext:()=>ctx})};
 try{const g=u.grafik(canvas);for(let i=0;i<100;i++)g.zeichnen(v,{x:0,y:0,zoom:.32,selected:'feld:erz',reduced:i%2===0},i*16);assert(calls>100);assert.equal(c.save(s),before)}finally{delete globalThis.document}
});
