import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule,sitzung} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {frachterSicht} from '../prototypes/w5-frachter/m_ui_frachter_sicht.mjs';
const {api,grafik}=vorhandeneModule(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
const rules=api.W3_RULES;
function ready(seed=42){const s=api.createW3State(seed);api.advance(s,50,rules);assert(api.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'},rules).ok);return s;}
function ship(s){return Object.values(s.ships).find(s=>s.klasse==='frachter');}
function ctx(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),createPattern:()=>({})},{get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)});}

test('W5-Frachter: echte W3-Snapshots, 100 Renderframes je Phase ohne Core-Mutation',()=>{
 const s=ready(),id=ship(s).id;
 const original=globalThis.document;
 globalThis.document={createElement:()=>({getContext:ctx})};
 try{
  const renderer=grafik.grafik({getContext:ctx,clientWidth:760,clientHeight:340});
  for(const phase of ['dock','hin','rueck','fertig']){
   if(phase==='hin')assert(api.execute(s,{type:'shipFreight',owner:'transport',schiff:id},rules).ok);
   if(phase==='rueck'||phase==='fertig')api.advance(s,60,rules);
   const saved=api.save(s),hash=api.hash(s),tick=s.tick;
   for(let n=0;n<100;n++){
    const v=frachterSicht(api,s,id);assert(Object.isFrozen(v.schiff.ladung));
    assert.equal(v.schiff.owner,'transport');assert.equal(v.schiff.id,id);
    renderer.zeichnen(v.canvas,{x:0,y:0,zoom:.32,reduced:true,selected:id},n*16);
   }
   assert.equal(api.save(s),saved);assert.equal(api.hash(s),hash);assert.equal(s.tick,tick);
   assert(api.audit(s).ok);assert.equal(api.audit(s).isk.total,33000);assert.equal(s.minted,0);
  }
 }finally{globalThis.document=original;}
});

test('W5-Frachter: Richtung, Ankunft, echte Budgets und Zahlungen, deterministischer Save/Load',()=>{
 for(const seed of [42,7]){
  const a=sitzung(api,ready(seed)),b=sitzung(api,api.loadW3(a.export())),id=ship(a.lesen()).id;
  const order={type:'shipFreight',owner:'transport',schiff:id};
  assert(a.befehl(order).ok);assert(b.befehl(order).ok);
  let v=frachterSicht(api,a.lesen(),id);
  assert.equal(v.richtung,'Aldera → Nadir');assert.equal(v.rest,60);assert.equal(v.schiff.ladung.erz,50);
  assert.equal(v.stand.kaufTreuhand,740);assert.equal(v.stand.arbeitTreuhand,120);
  for(let i=0;i<12;i++){
   a.schritt(10);b.schritt(10);
   assert.equal(api.hash(a.lesen()),api.hash(b.lesen()));
   assert.equal(api.hash(api.loadW3(a.export())),api.hash(a.lesen()));
   assert(api.audit(a.lesen()).ok);
   if(i===5){v=frachterSicht(api,a.lesen(),id);assert.equal(v.richtung,'Nadir → Aldera');assert.equal(v.rest,60);assert.equal(v.schiff.ladung.erz??0,0);assert.equal(v.stand.kaufTreuhand,240);}
  }
  v=frachterSicht(api,a.lesen(),id);assert.equal(v.schiff.system,'aldera');assert.equal(v.rest,null);
  assert.equal(v.stand.freightRevenue,240);assert.equal(v.stand.paidWork,120);assert.equal(v.stand.carrier,1370);
  console.log('W5_FRACHTER_HASH',seed,api.hash(a.lesen()));
 }
 const regular=api.createState(42);api.advance(regular,60);assert.equal(api.hash(regular),'866776f7d84ef15e');
});

test('W5-Frachter: fehlende Funktion und ungültige Befehle verändern keinen Save',()=>{
 const session=sitzung(api),before=session.export();
 assert.equal(frachterSicht(api,session.lesen()).schiff,null);
 assert.equal(session.befehl({type:'shipFreight',owner:'transport',schiff:'sh001'}).ok,false);
 assert.equal(session.export(),before);
 assert.throws(()=>session.import('{kaputt'));assert.equal(session.export(),before);
 assert.throws(()=>session.import(api.save(api.createState(42))));assert.equal(session.export(),before);
 const s=ready(),id=ship(s).id,hash=api.hash(s);
 assert(!api.execute(s,{type:'shipFreight',owner:'house',schiff:id},rules).ok);assert.equal(api.hash(s),hash);
 assert.throws(()=>frachterSicht(api,api.createState(42)),/nur W3/);
 assert.throws(()=>session.schritt(0));assert.equal(session.export(),before);
});
