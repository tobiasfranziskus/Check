/* W5w: exactly one original Rule-15 W1 economic state; isolated from W5u/Rule14. */
(function(scope){
'use strict';
const original=typeof module==='object'&&module.exports?require('./original-w1-core.js'):scope.W5wOriginal;
const adapter=typeof module==='object'&&module.exports?require('../legacy-hub/core-adapter.js'):scope.LegacyCoreAdapter;
const {core,rules}=original,owner='house',allowed=new Set(['shipBuy','shipMine','shipWait']);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function create(seed=42){
 let state=core.createErzState(seed),selected=null;
 function validate(text){
  const raw=JSON.parse(text);
  if(raw?.rulesVersion!==15||raw.schema!==8)throw Error('Nur Regel15 / Schema8; keine automatische Migration');
  const next=core.loadErz(text),a=core.audit(next),f=core.pilotWirtschaftsStand(next);
  if(!a.ok||!f?.ok)throw Error('Original-W1-Geld-/Waren-/Vertrags-/Vollkostenaudit nicht bestanden');
  adapter.project(core.save(next),{ownerId:owner});
  return next;
 }
 function selection(){
  if(!state.ships[selected]||state.ships[selected].owner!==owner)
   selected=Object.keys(state.ships).sort().find(id=>state.ships[id].owner===owner)||null;
  return selected;
 }
 function snapshot(){
  const text=core.save(state),a=core.audit(state),f=core.pilotWirtschaftsStand(state);
  if(!a.ok||!f?.ok)throw Error('W1-Core-Audit fehlgeschlagen');
  return {state:JSON.parse(text),bundle:adapter.project(text,{ownerId:owner}),
   owner,selected:selection(),hash:core.hash(state),audit:JSON.parse(JSON.stringify(a)),
   finance:JSON.parse(JSON.stringify(f)),contracts:core.pilotAuftragsStand(state)};
 }
 function build(request){
  if(!request||!allowed.has(request.type))return {ok:false,reason:'Nicht angebundener W1-Befehl'};
  if(request.type==='shipBuy'){
   if(request.klasse!=='miner'||request.station!=='st_aldera')
    return {ok:false,reason:'W1: nur fertig finanzierte Miner in Aldera'};
   return {ok:true,cmd:{type:'shipBuy',owner,station:'st_aldera',klasse:'miner'}};
  }
  if(!request.schiff||request.schiff!==selection())
   return {ok:false,reason:'Ausgewähltes eigenes Schiff erforderlich'};
  if(request.type==='shipMine'&&request.ware!=='erz')
   return {ok:false,reason:'W1: nur Erzabbau'};
  return {ok:true,cmd:{type:request.type,owner,schiff:request.schiff,...(request.type==='shipMine'?{ware:'erz'}:{})}};
 }
 function simulate(request){
  const built=build(request);if(!built.ok)return built;
  const next=validate(core.save(state));
  const result=core.execute(next,built.cmd,rules);
  if(!result.ok)return {ok:false,reason:result.reason};
  validate(core.save(next));
  return {ok:true,next,command:built.cmd};
 }
 function preview(request){
  const before=core.save(state),simulation=simulate(request);
  if(!simulation.ok)return Object.freeze({ok:false,reason:simulation.reason});
  const next=simulation.next,ship=request.schiff,started=state.ships[ship],after=next.ships[ship];
  const q={ok:true,type:request.type,cashBefore:state.owners.house.cash,
   cashAfter:next.owners.house.cash,
   buyerBefore:state.owners.st_aldera.cash,buyerAfter:next.owners.st_aldera.cash,
   shipsBefore:Object.values(state.ships).filter(x=>x.owner==='house').length,
   shipsAfter:Object.values(next.ships).filter(x=>x.owner==='house').length,
   cargoBefore:started?.ladung?.erz||0,cargoAfter:after?.ladung?.erz||0,
   activeAfter:after?.auftrag==='foerdern',
   immediateOnly:true,auditOk:true};
  if(core.save(state)!==before)throw Error('Vorschau hat autoritativen Zustand verändert');
  return Object.freeze(q);
 }
 return Object.freeze({snapshot,export:()=>core.save(state),preview,
  select(id){if(!own(state.ships,id)||state.ships[id].owner!==owner)throw Error('Nur eigene Miner auswählbar');selected=id;},
  import(text){const incoming=validate(text);state=incoming;selection();},
  command(request){
   const x=simulate(request);if(!x.ok)return x;
   state=x.next;selection();return {ok:true,type:request.type};
  },
  advance(n){
   if(![1,10,60].includes(n))throw Error('Nur feste W1-Minuten-Schritte');
   const next=validate(core.save(state));core.advance(next,n,rules);
   state=validate(core.save(next));return {ok:true};
  }
 });
}
const api=Object.freeze({create});if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5wSession=api;
})(globalThis);
