/* W5x: one authoritatively financed Rule-16 Core, never the W1/Rule-15 live state. */
(function(scope){
'use strict';
const original=typeof module==='object'&&module.exports?require('./original-w2-core.js'):scope.W5xOriginal;
const adapter=typeof module==='object'&&module.exports?require('../legacy-hub/core-adapter.js'):scope.LegacyCoreAdapter;
const {core,rules}=original,owner='house',allowed=new Set(['shipBuy','shipMine','shipWait']);
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function create(seed=42){
 let state=core.createW2State(seed),selected=null;
 function validate(text){
  const raw=JSON.parse(text);
  if(raw?.schema!==8||raw.rulesVersion!==16)throw Error('Nur Regel 16 / Schema 8; keine Migration von W1, W5u oder Produkt-Saves');
  const next=core.loadW2(text),audit=core.audit(next),full=core.pilotWirtschaftsStand(next);
  if(!audit.ok||!full?.ok)throw Error('W2-Geld-, Waren-, Käuferherkunfts-, Vertrags- oder Vollkostenaudit fehlgeschlagen');
  const diagnosis=core.pilotNpcKrisenLage(next);
  if(!diagnosis.kaeuferNachweisOk||diagnosis.status==='finanzierungsfehler')throw Error('W2 Käufermittel ohne belegten Ursprung');
  adapter.project(core.save(next),{ownerId:owner});
  return next;
 }
 function selection(){
  if(!state.ships[selected]||state.ships[selected].owner!==owner)
   selected=Object.keys(state.ships).sort().find(id=>state.ships[id].owner===owner)||null;
  return selected;
 }
 function snapshot(){
  const text=core.save(state),audit=core.audit(state),full=core.pilotWirtschaftsStand(state);
  if(!audit.ok||!full.ok)throw Error('Original-W2-Wirtschaftsaudit fehlgeschlagen');
  const crisis=core.pilotNpcKrisenLage(state),investment=core.pilotNpcInvestition(state);
  if(!crisis.kaeuferNachweisOk)throw Error('Unerlaubte W2 Endkundenfinanzierung');
  return {state:JSON.parse(text),bundle:adapter.project(text,{ownerId:owner}),
   owner,selected:selection(),hash:core.hash(state),
   audit:JSON.parse(JSON.stringify(audit)),finance:JSON.parse(JSON.stringify(full)),
   contracts:core.pilotAuftragsStand(state),
   corporation:Object.freeze({crisis:Object.freeze({...crisis}),investment:Object.freeze({...investment})})};
 }
 function build(req){
  if(!req||!allowed.has(req.type))return {ok:false,reason:'Kein W2-Core-Befehl'};
  if(req.type==='shipBuy'){
   if(req.klasse!=='miner'||req.station!=='st_aldera')return {ok:false,reason:'W2: nur vollständig bezahlte Miner in Aldera'};
   return {ok:true,command:{type:'shipBuy',owner,station:'st_aldera',klasse:'miner'}};
  }
  if(!req.schiff||req.schiff!==selection())return {ok:false,reason:'Eigene Schiffsauswahl erforderlich'};
  if(req.type==='shipMine'&&req.ware!=='erz')return {ok:false,reason:'W2: nur Erz'};
  return {ok:true,command:{type:req.type,owner,schiff:req.schiff,...(req.type==='shipMine'?{ware:'erz'}:{})}};
 }
 function simulate(req){
  const cmd=build(req);if(!cmd.ok)return cmd;
  const copy=validate(core.save(state));
  const result=core.execute(copy,cmd.command,rules);
  if(!result.ok)return {ok:false,reason:result.reason};
  validate(core.save(copy));
  return {ok:true,next:copy};
 }
 function preview(req){
  const before=core.save(state),simulation=simulate(req);
  if(!simulation.ok)return Object.freeze({ok:false,reason:simulation.reason});
  const next=simulation.next,s=req.schiff,ship=state.ships[s],future=next.ships[s];
  const result={ok:true,type:req.type,cashBefore:state.owners.house.cash,
   cashAfter:next.owners.house.cash,buyerBefore:state.owners.st_aldera.cash,
   buyerAfter:next.owners.st_aldera.cash,
   shipsBefore:Object.values(state.ships).filter(x=>x.owner===owner).length,
   shipsAfter:Object.values(next.ships).filter(x=>x.owner===owner).length,
   cargoBefore:ship?.ladung?.erz||0,cargoAfter:future?.ladung?.erz||0,
   activeAfter:future?.auftrag==='foerdern',immediateOnly:true,auditOk:true};
  if(core.save(state)!==before)throw Error('Read-only Vorschau verändert Live-Core');
  return Object.freeze(result);
 }
 return Object.freeze({snapshot,export:()=>core.save(state),preview,
  select(id){if(!own(state.ships,id)||state.ships[id].owner!==owner)throw Error('Nur eigene Miner auswählbar');selected=id;},
  import(text){const next=validate(text);state=next;selection();},
  command(req){const candidate=simulate(req);if(!candidate.ok)return candidate;state=candidate.next;selection();return {ok:true,type:req.type};},
  advance(n){
   if(![1,10,60].includes(n))throw Error('Nur geprüfte unmittelbare W2-Minuten-Schritte');
   const next=validate(core.save(state));core.advance(next,n,rules);state=validate(core.save(next));
   return {ok:true};
  }
 });
}
const api=Object.freeze({create});if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5xSession=api;
})(globalThis);
