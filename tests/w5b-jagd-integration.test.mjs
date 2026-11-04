import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {w5bJagdSichtAusCore} from '../prototypes/w5-jagd/m_ui_w5b_bridge.mjs';
import {jagdRenderer} from '../prototypes/w5-jagd/m_ui_jagd_renderer.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('const m_data_systeme =');
const b=html.indexOf('const m_data_oberflaeche =');
assert.ok(a>=0&&b>a);
const api=Function(html.slice(a,b)+'\nreturn m_core_index')();
const rules=api.W5B_RULES;
const exec=(s,cmd)=>{const r=api.execute(s,cmd,rules);assert.equal(r.ok,true,JSON.stringify({cmd,r}));};
const step=(s,n)=>api.advance(s,n,rules);
function fabrikFertigerJaeger(seed=42){
 const s=api.createW5BState(seed);
 exec(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_nadir'});
 const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.system==='nadir');
 assert.ok(miner);
 exec(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'silizium'});
 step(s,50);
 exec(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'});
 const frachter=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter'&&sh.system==='aldera');
 exec(s,{type:'shipFreight',owner:'transport',schiff:frachter.id});
 step(s,120);
 for(let i=0;i<4;i++){exec(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});step(s,20);}
 exec(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 step(s,64);
 exec(s,{type:'stationBuildFighter',owner:'house',station:'st_nadir'});
 step(s,32);
 assert.equal(s.w5b.jaegerFertig,1);
 assert.equal(api.audit(s).ok,true);
 return s;
}
function canvasFake(){
 let draws=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(obj,key)=>key in obj?obj[key]:(...args)=>{draws++;}});
 const canvas={clientWidth:900,clientHeight:500,getContext:()=>ctx,
   setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:900,height:500})};
 return {canvas,get draws(){return draws}};
}
test('Brücke: A und B sind nicht direkt kompatibel; Umformung wahrt echte Eigentümer/IDs',()=>{
 const s=fabrikFertigerJaeger();
 const raw=api.JagdSichtV1(s);
 const h=api.hash(s),saved=api.save(s);
 assert.throws(()=>w5bJagdSichtAusCore({version:'falsch'}),TypeError);
 const vor=w5bJagdSichtAusCore(raw);
 assert.equal(vor.tick,s.tick);assert.equal(vor.systemId,'nadir');
 assert.equal(vor.schiffe.length,0,'fertiger Jäger im Lager ist noch kein Kontakt');
 assert.equal(vor.ereignisse.length,0,'kein erfundener Pirat oder Kampfbeleg');
 assert.equal(vor.anomalieId,'werft-kontakte-ohne-anomalie');
 exec(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'});
 const autoritativ=api.JagdSichtV1(s);
 const bridge=w5bJagdSichtAusCore(autoritativ);
 assert.equal(bridge.schiffe.length,1);
 const sh=s.ships[s.w5b.schiffIds[0]];
 assert.equal(bridge.schiffe[0].id,sh.id);
 assert.deepEqual(bridge.schiffe[0].besitzer,{id:'npc3',art:'npc'});
 assert.equal(bridge.schiffe[0].status,'dock');
 assert.equal(bridge.ereignisse.length,0);
 assert.equal('position' in bridge.schiffe[0],false);
 assert.equal('xp' in bridge.schiffe[0],false);
 assert.ok(Object.isFrozen(bridge.schiffe[0].besitzer));
 assert.equal(api.hash(s),api.hash(api.loadW5B(api.save(s))));
 assert.notEqual(api.hash(s),h,'nur der echte Kauf ändert den Zustand');
 assert.notEqual(api.save(s),saved);
 assert.equal(api.audit(s).ok,true);
});
test('Brücke: 100 Renderdurchgänge verändern keine Kasse, Waren, Tick oder gespeicherten Zustand',()=>{
 const s=fabrikFertigerJaeger(7);
 exec(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'});
 const snapshot=w5bJagdSichtAusCore(api.JagdSichtV1(s));
 const hash=api.hash(s),save=api.save(s),sicht=JSON.stringify(snapshot);
 const fake=canvasFake(),r=jagdRenderer(fake.canvas);
 r.setSnapshot(snapshot);
 for(let i=0;i<100;i++)r.zeichnen();
 r.auswaehlen(s.w5b.schiffIds[0]);r.zoom(1.25);r.zentrieren();r.dispose();
 assert.ok(fake.draws>100);
 assert.equal(api.hash(s),hash);
 assert.equal(api.save(s),save);
 assert.equal(JSON.stringify(snapshot),sicht);
 assert.equal(api.audit(s).ok,true);
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);
});
test('Brücke: kein Multi-System-Mischbild, keine erdachten Belege oder Piloten',()=>{
 const s=fabrikFertigerJaeger();
 exec(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'});
 const base=api.JagdSichtV1(s);
 const no= w5bJagdSichtAusCore(base,'aldera');
 assert.equal(no.systemId,'aldera');
 assert.deepEqual(no.schiffe,[]);assert.deepEqual(no.ereignisse,[]);
 assert.equal(api.audit(s).ok,true);
});
