/* W5ab: one original Rule19 W5 economy, from ore to purchased Nadir-built freighter. */
(function(scope){
'use strict';
const original=typeof module==='object'&&module.exports?require('./original-w5-core.js'):scope.W5abOriginal;
const adapter=typeof module==='object'&&module.exports?require('../legacy-hub/core-adapter.js'):scope.LegacyCoreAdapter;
const {core,rules}=original,owner='house';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function create(seed=42){
 let state=core.createW5State(seed),selected=null;
 function validate(json){
  if(typeof json!=='string')throw Error('Nur Original-JSON erlaubt');
  const raw=JSON.parse(json);
  if(raw?.schema!==8||raw.rulesVersion!==19)
   throw Error('Nur isolierter Original-W5-Stand (Regel19/Schema8); kein Regel18-/Produkt-Save');
  const next=core.loadW5(json),audit=core.audit(next),full=core.pilotWirtschaftsStand(next),freight=core.pilotW3Stand(next),refinery=core.pilotW4Stand(next),yard=core.pilotW5Stand(next);
  if(!audit.ok||!full?.ok||!freight.ok||!refinery.ok||!yard.ok)throw Error('Original-W5-Geld-/Fracht-/Material-/Hüllen-/Lohn-/Eigentümeraudit fehlgeschlagen');
  const market=core.pilotNpcKrisenLage(next);
  if(!market.kaeuferNachweisOk||market.status==='finanzierungsfehler')throw Error('Unbelegte W2-Käufermittel');
  adapter.project(core.save(next),{ownerId:owner});
  return next;
 }
 function selection(){
  if(!state.ships[selected]||state.ships[selected].owner!==owner||state.ships[selected].klasse!=='miner')
   selected=Object.keys(state.ships).sort().find(id=>state.ships[id].owner===owner&&state.ships[id].klasse==='miner')||null;
  return selected;
 }
 function hauler(s=state){
  return Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id))
   .find(sh=>sh.owner==='transport'&&sh.klasse==='frachter')||null;
 }
 function snapshot(){
  const json=core.save(state),audit=core.audit(state),finance=core.pilotWirtschaftsStand(state),freight=core.pilotW3Stand(state),refinery=core.pilotW4Stand(state),yard=core.pilotW5Stand(state);
  if(!audit.ok||!finance.ok||!freight.ok||!refinery.ok||!yard.ok)throw Error('Original-W5-Gesamtaudit nicht bestanden');
  const crisis=core.pilotNpcKrisenLage(state);
  if(!crisis.kaeuferNachweisOk)throw Error('Endkundenkapital unbelegt');
  const ship=hauler(),quote=core.pilotW3Kalkulation(state,ship?.id);
  return {state:JSON.parse(json),bundle:adapter.project(json,{ownerId:owner}),
   owner,selected:selection(),hash:core.hash(state),
   audit:JSON.parse(JSON.stringify(audit)),finance:JSON.parse(JSON.stringify(finance)),
   contracts:core.pilotAuftragsStand(state),
   corporation:Object.freeze({crisis:Object.freeze({...crisis})}),
   freight:Object.freeze({audit:Object.freeze({...freight}),quote:Object.freeze({...quote}),shipId:ship?.id||null}),
   refinery:Object.freeze({audit:Object.freeze({...refinery}),quote:Object.freeze({...core.pilotW4Kalkulation(state)})}),
   shipyard:Object.freeze({audit:Object.freeze({...yard}),quote:Object.freeze({...core.pilotW5Kalkulation(state)}),sale:Object.freeze({...core.pilotW5Verkauf(state)})})};
 }
 function build(req){
  if(!req||typeof req!=='object')return {ok:false,reason:'Fehlender Original-Core-Befehl'};
  if(req.type==='freightBuy')
   return {ok:true,command:{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'}};
  if(req.type==='freightStart'){
   const sh=hauler();
   if(!sh||req.schiff&&req.schiff!==sh.id)return {ok:false,reason:'Kein passender, real gekaufter Frachter'};
   return {ok:true,command:{type:'shipFreight',owner:'transport',schiff:sh.id}};
  }
  if(req.type==='refineStart')return {ok:true,command:{type:'stationRefine',owner:'st_nadir',station:'st_nadir'}};
  if(req.type==='yardStart')return {ok:true,command:{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'}};
  if(req.type==='yardBuy')return {ok:true,command:{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'}};
  if(req.type==='shipBuy'){
   if(req.klasse!=='miner'||req.station!=='st_aldera')return {ok:false,reason:'Nur echten Miner in Aldera kaufen'};
   return {ok:true,command:{type:'shipBuy',owner,station:'st_aldera',klasse:'miner'}};
  }
  if(!['shipMine','shipWait'].includes(req.type))return {ok:false,reason:'Nicht freigeschalteter W3-Core-Befehl'};
  if(!req.schiff||req.schiff!==selection())return {ok:false,reason:'Eigenen Miner auswählen'};
  if(req.type==='shipMine'&&req.ware!=='erz')return {ok:false,reason:'Nur echte Erzförderung'};
  return {ok:true,command:{type:req.type,owner,schiff:req.schiff,...(req.type==='shipMine'?{ware:'erz'}:{})}};
 }
 function simulate(req){
  const cmd=build(req);if(!cmd.ok)return cmd;
  const copy=validate(core.save(state)),result=core.execute(copy,cmd.command,rules);
  if(!result.ok)return {ok:false,reason:result.reason};
  validate(core.save(copy));
  return {ok:true,next:copy};
 }
 function preview(req){
  const before=core.save(state),out=simulate(req);
  if(!out.ok)return Object.freeze({ok:false,reason:out.reason});
  const next=out.next,ship=state.ships[req.schiff],future=next.ships[req.schiff];
  const res={ok:true,type:req.type,immediateOnly:true,auditOk:true,
   cashBefore:state.owners.house.cash,cashAfter:next.owners.house.cash,
   buyerBefore:state.owners.st_aldera.cash,buyerAfter:next.owners.st_aldera.cash,
   shipsBefore:Object.values(state.ships).filter(x=>x.owner===owner).length,
   shipsAfter:Object.values(next.ships).filter(x=>x.owner===owner).length,
   cargoBefore:ship?.ladung?.erz||0,cargoAfter:future?.ladung?.erz||0,
   activeAfter:future?.auftrag==='foerdern',
   carrierBefore:state.owners.transport.cash,carrierAfter:next.owners.transport.cash,
   nadirBefore:state.owners.st_nadir.cash,nadirAfter:next.owners.st_nadir.cash,
   freightBefore:core.pilotW3Stand(state),freightAfter:core.pilotW3Stand(next),
   refineryBefore:core.pilotW4Stand(state),refineryAfter:core.pilotW4Stand(next),
   yardBefore:core.pilotW5Stand(state),yardAfter:core.pilotW5Stand(next),
   yardBuyBefore:core.pilotW5Verkauf(state),yardBuyAfter:core.pilotW5Verkauf(next)};
  if(core.save(state)!==before)throw Error('Read-only-Vorschau hat Originalwelt verändert');
  return Object.freeze(res);
 }
 // Revalidate every changed state, including before commit and after Original Core action.
 validate(core.save(state));
 return Object.freeze({snapshot,export:()=>core.save(state),preview,
  select(id){if(!has(state.ships,id)||state.ships[id].owner!==owner||state.ships[id].klasse!=='miner')
    throw Error('Nur eigenen Miner wählen');selected=id;return {ok:true};},
  import(json){const next=validate(json);state=next;selection();return {ok:true};},
  command(req){const candidate=simulate(req);if(!candidate.ok)return candidate;
   state=candidate.next;selection();return {ok:true,type:req.type};},
  advance(n){if(![1,10,20,30,50,60].includes(n))throw Error('Nur 1, 10, 20, 30, 50 oder 60 originale Core-Minuten');
   const next=validate(core.save(state));core.advance(next,n,rules);
   state=validate(core.save(next));return {ok:true};}
 });
}
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5abSession=api;
})(globalThis);
