import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),F=require('../prototypes/flug2d/flug-kern.js'),W=require('../prototypes/welt/welt-kern.js');
const sample=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const neu=()=>{const p=JSON.parse(sample).w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});return {w,s:w.load(sample)}};
const cmd=(w,s,type,extra={})=>w.execute(s,{type,owner:'house',schiff:'sh023',...extra});
const steps=(w,s,n)=>{for(let i=0;i<n;i++)w.teilschritt(s)};
function isoliert(klasse){
 const body=x=>({...F.koerperAngedockt('aldera'),lage:'frei',anker:null,x});
 return {rulesVersion:204,flug:{schritt:0},ships:{a:{id:'a',owner:'house',klasse,system:'aldera',phase:'dock',flug:body(700000)},b:{id:'b',owner:'npc3',klasse:'frachter',system:'aldera',phase:'dock',flug:body(0)}}};
}
for(const klasse of ['miner','frachter','jaeger'])test(klasse+': Radiusregelung, bewegtes Ziel, Beschleunigen/Bremsen, Handübernahme',()=>{
 const s=isoliert(klasse),b=s.ships.a.flug,t=s.ships.b.flug;
 const run=(type,extra={})=>{const r=F.ausfuehren(s,{type,owner:'house',schiff:'a',...extra});assert.equal(r.ok,true,r.reason)};
 run('shipOrbit',{zielArt:'station',ziel:'st_aldera',radius:120000});
 let winkelaenderung=0,vor={...b};
 for(let i=0;i<6000;i++){
  F.schritt(s);
  assert.ok(Math.hypot(b.x-vor.x,b.y-vor.y)<=F.DATEN.klassen[klasse].vmax+1,'kontinuierliche Bewegung');
  if(i>4000){assert.ok(Math.abs(Math.hypot(b.x,b.y)-120000)<1200,'Radius innerhalb 1%');winkelaenderung+=Math.abs(b.x-vor.x)+Math.abs(b.y-vor.y)}
  vor={...b};
 }
 assert.ok(winkelaenderung>120000,'echte Umkreisung');
 run('shipSteer',{kurs:0,fahrt:0});assert.equal(b.ziel,null);
 run('shipFollow',{ziel:'b',abstand:90000});
 F.ausfuehren(s,{type:'shipSteer',owner:'npc3',schiff:'b',kurs:0,fahrt:30});
 for(let i=0;i<2500;i++){F.schritt(s);if(i>2000)assert.ok(Math.abs(Math.hypot(b.x-t.x,b.y-t.y)-90000)<3000,'Folgeabstand');}
 F.ausfuehren(s,{type:'shipSteer',owner:'npc3',schiff:'b',kurs:128,fahrt:0});
 for(let i=0;i<1000;i++)F.schritt(s);
 assert.ok(Math.abs(Math.hypot(b.x-t.x,b.y-t.y)-90000)<3000,'Abstand nach Bremsung');
 assert.ok(Math.hypot(b.vx,b.vy)<100,'Follower bremst');
 run('shipLock',{zielArt:'schiff',ziel:'b'});assert.equal(b.modus,'folgen');
 t.lage='transit';s.ships.b.phase='reise';F.schritt(s);
 assert.equal(b.modus,'halt');assert.equal(b.ziel,null);assert.equal(b.erfassung,undefined);
 run('shipSteer',{kurs:64,fahrt:50});assert.equal(b.modus,'hand');
});
test('Regel204: Geld/Eigentum, Originalsave, Replay, Save/Load und manipulierte Befehle',()=>{
 const {w,s}=neu();assert.equal(w.save(s),sample);
 const owners=Object.fromEntries(Object.values(s.ships).map(x=>[x.id,x.owner]));
 assert.equal(cmd(w,s,'shipUndock').ok,true);steps(w,s,40);
 const before=w.hash(s);
 for(const extra of [{radius:0},{radius:NaN},{radius:999999999},{radius:120000,ziel:'__proto__'},{radius:120000,owner:'npc3'},{radius:120000,schaden:1}]){
  assert.equal(cmd(w,s,'shipOrbit',{zielArt:'station',ziel:'st_nadir',...extra}).ok,false);assert.equal(w.hash(s),before);
 }
 assert.equal(cmd(w,s,'shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000}).ok,true);
 steps(w,s,500);const mid=w.save(s),restored=w.load(mid);assert.equal(w.save(restored),mid);
 steps(w,s,1000);steps(w,restored,1000);assert.equal(w.hash(s),w.hash(restored));
 assert.equal(w.audit(s).ok,true);assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 assert.deepEqual(Object.fromEntries(Object.values(s.ships).map(x=>[x.id,x.owner])),owners);
 for(const change of [b=>b.ziel.radius=-1,b=>b.ziel.id='unknown',b=>b.ziel.extra=1,b=>b.erfassung={art:'schiff',id:'__proto__'},b=>b.erfassung={art:'station',id:'st_nadir',waffe:true}]){
  const raw=JSON.parse(mid);change(raw.ships.sh023.flug);assert.throws(()=>w.load(JSON.stringify(raw)));
 }
 assert.equal(cmd(w,s,'shipSteer',{kurs:0,fahrt:10}).ok,true);assert.equal(s.ships.sh023.flug.ziel,null);
 assert.equal(cmd(w,s,'shipLock',{zielArt:'station',ziel:'st_nadir'}).ok,true);
 assert.equal(cmd(w,s,'shipDock',{station:'st_nadir'}).ok,true);
 for(let i=0;i<10000&&s.ships.sh023.flug.lage!=='angedockt';i++)w.teilschritt(s);
 assert.equal(s.ships.sh023.flug.lage,'angedockt');assert.equal(s.ships.sh023.flug.erfassung,undefined);assert.equal(w.audit(s).ok,true);
});
test('Finanziertes Folgen: Save/Load, Ziel dockt ab, manuelle Priorität und atomare Dockablehnung',()=>{
 const {w,s}=neu();
 assert.equal(w.execute(s,{type:'shipUndock',owner:'house',schiff:'sh022'}).ok,true);
 assert.equal(cmd(w,s,'shipUndock').ok,true);steps(w,s,40);
 assert.equal(w.execute(s,{type:'shipSteer',owner:'house',schiff:'sh022',kurs:0,fahrt:30}).ok,true);
 assert.equal(cmd(w,s,'shipFollow',{ziel:'sh022',abstand:90000}).ok,true);
 steps(w,s,500);const json=w.save(s),copy=w.load(json);
 steps(w,s,500);steps(w,copy,500);assert.equal(w.hash(s),w.hash(copy));assert.equal(w.audit(s).ok,true);
 assert.equal(cmd(w,s,'shipSteer',{kurs:64,fahrt:50}).ok,true);
 assert.equal(s.ships.sh023.flug.modus,'hand');assert.equal(s.ships.sh023.flug.ziel,null);
 assert.equal(cmd(w,s,'shipFollow',{ziel:'sh022',abstand:90000}).ok,true);
 assert.equal(cmd(w,s,'shipLock',{zielArt:'schiff',ziel:'sh022'}).ok,true);
 assert.equal(w.execute(s,{type:'shipDock',owner:'house',schiff:'sh022',station:'st_nadir'}).ok,true);
 for(let i=0;i<10000&&s.ships.sh022.flug.lage==='frei';i++)w.teilschritt(s);
 steps(w,s,1);assert.equal(s.ships.sh023.flug.modus,'halt');assert.equal(s.ships.sh023.flug.erfassung,undefined);
 assert.equal(w.audit(s).ok,true);
 const hash=w.hash(s);assert.equal(cmd(w,s,'shipFollow',{ziel:'sh022',abstand:90000}).ok,false);assert.equal(w.hash(s),hash);
});
