import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../prototypes/f8-jaeger/f8-trainer.js');
const F=require('../prototypes/flug2d/flug-kern.js');
const cmd=(type,extra={})=>({type,owner:'house',schiff:T.ID,...extra});
const good=s=>assert.equal(T.audit(s).ok,true,JSON.stringify(T.audit(s)));
function anflug(modus='duell'){
 const s=T.neu();
 assert.equal(T.befehl(s,cmd('fighterTargetMode',{modus})).ok,true);
 assert.equal(T.befehl(s,cmd('shipUndock')).ok,true);
 T.schritt(s,40);
 assert.equal(T.befehl(s,cmd('shipFlyTo',{x:T.MARKER.x,y:T.MARKER.y})).ok,true);
 T.schritt(s,225);
 assert.equal(s.erreicht,265);
 good(s);return s;
}
function gewinnen(){
 const s=anflug();
 for(let n=1;n<=3;n++){
   const target=T.status(s).zielPosition,pilot=s.ships[T.ID].flug;
   assert.equal(T.befehl(s,cmd('shipSteer',{
     kurs:F.richtungZu(target.x-pilot.x,target.y-pilot.y),fahrt:0})).ok,true);
   T.schritt(s,8);
   assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
   T.schritt(s,16);
   assert.equal(s.zielprobe.treffer,n);
   good(s);
 }
 return s;
}
test('F8e: stationary and moving old modes retain original marker and cannot spawn opponent shots',()=>{
 for(const modus of ['stationaer','beweglich']){
   const s=anflug(modus);
   T.schritt(s,500);
   assert.equal(T.status(s).duellErgebnis,'zieluebung');
   assert.equal(s.zielprobe.gegner.pilotHp,96);
   assert.equal(s.zielprobe.gegner.schuesse,0);
   assert.equal(s.zielprobe.gegner.belege.length,0);
   good(s);
 }
});
test('F8e: stationary pilot is physically hit by orbiting drone; loss disables flight commands',()=>{
 const s=anflug();
 assert.equal(T.befehl(s,cmd('shipSteer',{kurs:64,fahrt:0})).ok,true);
 while(s.zielprobe.gegner.pilotHp>0&&s.sekunden<1000)T.schritt(s,1);
 assert.equal(s.sekunden,379,'deterministic defeat reference second');
 assert.equal(T.status(s).duellErgebnis,'niederlage');
 assert.deepEqual(s.zielprobe.gegner.belege.map(x=>x.tick),[272,308,343,379]);
 assert.equal(s.zielprobe.gegner.treffer,4);
 assert.equal(s.zielprobe.gegner.pilotHp,0);
 good(s);
 const frozen=JSON.stringify(s);
 for(const type of ['fighterFire','shipSteer','shipDock','fighterTargetMode']){
   const c=cmd(type,type==='shipSteer'?{kurs:0,fahrt:0}:
     type==='shipDock'?{station:'st_aldera'}:
     type==='fighterTargetMode'?{modus:'stationaer'}:{});
   assert.equal(T.befehl(s,c).ok,false,type);
   assert.equal(JSON.stringify(s),frozen,'no changes after simulated defeat');
 }
});
test('F8e: pursuit and three real moving-target hits produce victory with surviving pilot',()=>{
 const s=gewinnen();
 assert.equal(s.sekunden,337);
 assert.equal(T.status(s).duellErgebnis,'sieg');
 assert.equal(s.zielprobe.hp,0);
 assert.equal(s.zielprobe.gegner.pilotHp,48);
 assert.equal(s.zielprobe.gegner.schuesse,4);
 assert.equal(s.zielprobe.gegner.treffer,2);
 assert.deepEqual(s.zielprobe.gegner.belege.map(x=>x.tick),[272,308]);
 const old=JSON.stringify(s);
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,false);
 assert.equal(JSON.stringify(s),old);
 T.befehl(s,cmd('shipDock',{station:'st_aldera'}));
 for(let n=0;n<1000&&T.status(s).lage!=='angedockt';n++)T.schritt(s,1);
 assert.equal(T.status(s).lage,'angedockt');
 good(s);
});
test('F8e: maneuvering fighter evades mathematically moving projectiles',()=>{
 const parked=anflug(),moving=anflug();
 T.befehl(parked,cmd('shipSteer',{kurs:64,fahrt:0}));
 T.befehl(moving,cmd('shipSteer',{kurs:0,fahrt:100}));
 T.schritt(parked,140);
 T.schritt(moving,140);
 assert.equal(parked.zielprobe.gegner.pilotHp,0,'parked hull disabled');
 assert.equal(moving.zielprobe.gegner.pilotHp,72,'evasive maneuver reduces valid enemy hits');
 assert.equal(moving.zielprobe.gegner.treffer,1);
 assert.ok(moving.ships[T.ID].flug.x>1000000);
 good(parked);good(moving);
});
test('F8e: same commands replay identically; no money, cargo, pirate or user save',()=>{
 const a=gewinnen(),b=gewinnen();
 assert.deepEqual(a,b,'bitwise identical own shots and enemy shots');
 const data=JSON.stringify(a);
 assert.deepEqual(JSON.parse(data),a);good(JSON.parse(data));
 for(const name of ['owners','ledger','minted','burned','rulesVersion','kopfgeld','xp'])
   assert.equal(Object.hasOwn(a,name),false,'isolated training only: '+name);
});
test('F8e: enemy projectile, HP, receipts and mode tamper detected',()=>{
 const s=anflug();
 T.befehl(s,cmd('shipSteer',{kurs:64,fahrt:0}));
 T.schritt(s,50);
 good(s);
 const changes=[
  c=>{c.zielprobe.gegner.pilotHp=96},
  c=>{c.zielprobe.gegner.treffer=3},
  c=>{c.zielprobe.gegner.belege[0].hp=100},
  c=>{c.zielprobe.gegner.belege[0].schuss=999},
  c=>{c.zielprobe.gegner.belege.push({...c.zielprobe.gegner.belege[0]})},
  c=>{c.zielprobe.gegner.geschosse.push({id:1,x:0,y:0,vx:0,vy:0,rest:100})},
  c=>{c.zielprobe.gegner.naechster=999999},
  c=>{c.zielprobe.gegner.magic=true},
  c=>{c.zielprobe.modus='stationaer'},
  c=>{c.owners={house:{cash:900}}},
 ];
 for(const change of changes){const q=structuredClone(s);change(q);assert.equal(T.audit(q).ok,false,JSON.stringify(q.zielprobe.gegner))}
 good(s);
});
