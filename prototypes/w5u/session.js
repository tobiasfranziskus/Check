/* One private original Core state; detached snapshots and transactional commands. */
(function(scope){
'use strict';
const original=typeof module==='object'&&module.exports?require('./original-core.js'):scope.W5uOriginal;
const adapter=typeof module==='object'&&module.exports?require('../legacy-hub/core-adapter.js'):scope.LegacyCoreAdapter;
const {core,rules}=original;
const allowed=new Set(['shipRename','shipWait','shipMine','shipHandeln','shipMove','shipTrade','shipActivate']);
function create(seed=42){
 let state=core.createState(seed),selected=null;
 const owner=rules.economy.start.owner;
 function validate(text){
  const raw=JSON.parse(text);
  if(raw.schema!==rules.schema||raw.rulesVersion!==rules.rulesVersion)throw Error('Nur Schema 8 / Regel 14; keine automatische Migration');
  const next=core.load(text);
  if(!core.audit(next).ok)throw Error('Geld-/Warenaudit fehlgeschlagen');
  adapter.project(core.save(next),{ownerId:owner});
  return next;
 }
 function selection(){if(!state.ships[selected]||state.ships[selected].owner!==owner)selected=Object.keys(state.ships).sort().find(id=>state.ships[id].owner===owner)??null;return selected;}
 function snapshot(){
  const text=core.save(state),bundle=adapter.project(text,{ownerId:owner});
  return {bundle,state:JSON.parse(text),selected:selection(),owner,hash:core.hash(state),audit:core.audit(state)};
 }
 return Object.freeze({snapshot,export:()=>core.save(state),
  select(id){if(!Object.hasOwn(state.ships,id)||state.ships[id].owner!==owner)throw Error('Nur eigene Schiffe auswählbar');selected=id;},
  import(text){const next=validate(text);state=next;selection();},
  command(intent){
   if(!allowed.has(intent.type))return {ok:false,reason:'Aktion nicht angebunden'};
   if(intent.schiff!==selection())return {ok:false,reason:'Ausgewähltes eigenes Schiff erforderlich'};
   const next=validate(core.save(state));
   const result=core.execute(next,{...intent,owner});
   if(!result.ok)return result;
   state=validate(core.save(next));return result;
  },
  advance(n){if(![1,10,60].includes(n))throw Error('Ungültiger Zeitschritt');const next=validate(core.save(state));core.advance(next,n);state=validate(core.save(next));}
 });
}
const api=Object.freeze({create});if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5uSession=api;
})(globalThis);
