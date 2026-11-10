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
 // Read-only affordability quote. The ORIGINAL Core executes the exact
 // proposed command on a validated detached state; never project prices with a
 // second formula, never issue a command to the live simulation.
 function preview(intent){
  const request= intent && typeof intent==='object'?intent:{};
  if(!['shipTrade','shipActivate'].includes(request.type))
   return Object.freeze({ok:false,reason:'Nur Handel und Hüllen-Inbetriebnahme können vorab geprüft werden'});
  if(request.schiff!==selection())
   return Object.freeze({ok:false,reason:'Nur das ausgewählte eigene Schiff kann handeln'});
  const source=core.save(state),candidate=validate(source);
  const ship=state.ships[request.schiff],station=state.systems[ship.system]?.station||null;
  const ware=request.type==='shipTrade'?request.ware:request.klasse;
  const availableBefore=Number(state.owners[owner].cash);
  const cashBefore=state.owners[owner].cash;
  const cargoBefore=ship.ladung[ware]||0;
  const stationBefore=station?(state.stations[station]?.lager[ware]||0):null;
  const shipsBefore=Object.values(state.ships).filter(s=>s.owner===owner).length;
  const result=core.execute(candidate,{...request,owner},rules);
  if(!result.ok)
   return Object.freeze({ok:false,reason:result.reason||'Core-Befehl abgelehnt',
     type:request.type,ware,station,cashBefore,availableBefore});
  if(!core.audit(candidate).ok)throw Error('Core-Audit der schreibgeschützten Vorschau fehlgeschlagen');
  const cashAfter=candidate.owners[owner].cash,
    cargoAfter=candidate.ships[request.schiff].ladung[ware]||0,
    stationAfter=station?(candidate.stations[station]?.lager[ware]||0):null,
    shipsAfter=Object.values(candidate.ships).filter(s=>s.owner===owner).length;
  // A forecast is a detached immediate Core transition only. It cannot
  // promise later wages, ongoing automated trade, income or future prices.
  return Object.freeze({ok:true,type:request.type,ware,station,
    cashBefore,cashAfter,cashDelta:cashAfter-cashBefore,
    cargoBefore,cargoAfter,cargoDelta:cargoAfter-cargoBefore,
    stationBefore,stationAfter,
    ownedShipsBefore:shipsBefore,ownedShipsAfter:shipsAfter,
    auditOk:true,immediateOnly:true});
 }
 return Object.freeze({snapshot,preview,export:()=>core.save(state),
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
