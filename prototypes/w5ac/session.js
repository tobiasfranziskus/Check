/* W5ac: isolated Rule191 W0-W5 core with independently audited prepaid ship reposition. */
(function(scope){
'use strict';
const original=typeof module==='object'&&module.exports?require('./rule191-w5-ferry-core.js'):scope.W5acOriginal;
const adapter=typeof module==='object'&&module.exports?require('../legacy-hub/core-adapter.js'):scope.LegacyCoreAdapter;
const owner='house';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function create(seed=42,profile=null){
 if(profile!==null&&profile!=="private195")throw Error("Unbekanntes Forschungsprofil");
 const engine=profile==="private195"?original.createPrivateWageResearch({carrierCash:2000,buyerCash:4000}):original;
 const {core,rules}=engine;
 let state=core.createW5State(seed),selected=null;
 function validate(json){
  if(typeof json!=='string')throw Error('Nur Original-JSON erlaubt');
  const raw=JSON.parse(json);
  if(raw?.schema!==8||raw.rulesVersion!==rules.rulesVersion)
   throw Error('Nur isolierter Forschungsstand Regel'+rules.rulesVersion+'; andere Profile bleiben getrennt');
  const next=core.loadW5(json),audit=core.audit(next),full=core.pilotWirtschaftsStand(next),freight=core.pilotW3Stand(next),refinery=core.pilotW4Stand(next),yard=core.pilotW5Stand(next),transfer=core.pilotW5TransferStand(next);
  if(!audit.ok||!full?.ok||!freight.ok||!refinery.ok||!yard.ok||!transfer.ok)throw Error('Rule191-Geld-/Fracht-/Material-/Hüllen-/Fluglohn-/Eigentümeraudit fehlgeschlagen');
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
  const json=core.save(state),audit=core.audit(state),finance=core.pilotWirtschaftsStand(state),freight=core.pilotW3Stand(state),refinery=core.pilotW4Stand(state),yard=core.pilotW5Stand(state),transfer=core.pilotW5TransferStand(state);
  if(!audit.ok||!finance.ok||!freight.ok||!refinery.ok||!yard.ok||!transfer.ok)throw Error('Rule191-W0–W5-Gesamtaudit nicht bestanden');
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
   shipyard:Object.freeze({audit:Object.freeze({...yard}),quote:Object.freeze({...core.pilotW5Kalkulation(state)}),sale:Object.freeze({...core.pilotW5Verkauf(state)})}),
   water:rules.rulesVersion===195?{price:rules.w5n.wasserPreis,
    audit:core.pilotWaterStand(state),personal:core.pilotPrivateWageStand(state),
    freight:core.pilotIceFreightQuote(state,ship?.id),factory:core.pilotWaterFactoryQuote(state)
   }:null,
   transfer:Object.freeze({audit:Object.freeze({...transfer}),
    quotes:Object.freeze(Object.fromEntries((state.w5?.schiffIds||[]).map(id=>[id,Object.freeze({...core.pilotW5TransferKalkulation(state,id)})]))),
    freightQuotes:Object.freeze(Object.fromEntries((state.w5?.schiffIds||[]).map(id=>[id,Object.freeze({...core.pilotW3Kalkulation(state,id)})])))})};
 }
 function build(req){
  if(!req||typeof req!=='object')return {ok:false,reason:'Fehlender Original-Core-Befehl'};
  if(rules.rulesVersion===195){
   if(req.type==='shipSellIce'){
    if(!req.schiff||req.schiff!==selection())return {ok:false,reason:'Eigenen Miner auswählen'};
    return {ok:true,command:{type:'shipSellIce',owner,schiff:req.schiff,menge:req.menge}};
   }
   if(req.type==='iceFreight')return {ok:true,command:{type:'shipFreightIce',owner:'transport',schiff:hauler()?.id}};
   if(req.type==='waterStart')return {ok:true,command:{type:'stationWater',owner:'st_nadir',station:'st_nadir'}};
   if(req.type==='waterBuy'){
    if(!['pilot_erz','pilot_eis'].includes(req.owner))return {ok:false,reason:'Eigenes Pilotenkonto wählen'};
    return {ok:true,command:{type:'pilotWaterBuy',owner:req.owner,menge:req.menge}};
   }
  }
  if(req.type==='freightBuy')
   return {ok:true,command:{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'}};
  if(req.type==='freightStart'){
   const sh=req.schiff?state.ships[req.schiff]:hauler();
   if(!sh||sh.owner!=='transport'||sh.klasse!=='frachter')
    return {ok:false,reason:'Nur echte eigene Transport-Frachter dürfen W3 fahren'};
   return {ok:true,command:{type:'shipFreight',owner:'transport',schiff:sh.id}};
  }
  if(req.type==='refineStart')return {ok:true,command:{type:'stationRefine',owner:'st_nadir',station:'st_nadir'}};
  if(req.type==='yardStart')return {ok:true,command:{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'}};
  if(req.type==='yardBuy')return {ok:true,command:{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'}};
  if(req.type==='transferStart'){
   if(typeof req.schiff!=='string'||!state.w5?.schiffIds.includes(req.schiff))
    return {ok:false,reason:'Nur gekaufte Original-W5-Huelle ueberfuehren'};
   return {ok:true,command:{type:'shipReposition',owner:'transport',schiff:req.schiff}};
  }
  if(req.type==='shipBuy'){
   if(req.klasse!=='miner'||req.station!=='st_aldera')return {ok:false,reason:'Nur echten Miner in Aldera kaufen'};
   return {ok:true,command:{type:'shipBuy',owner,station:'st_aldera',klasse:'miner'}};
  }
  if(!['shipMine','shipWait'].includes(req.type))return {ok:false,reason:'Nicht freigeschalteter W3-Core-Befehl'};
  if(!req.schiff||req.schiff!==selection())return {ok:false,reason:'Eigenen Miner auswählen'};
  if(req.type==='shipMine'&&!['erz',...(rules.rulesVersion===195?['eis']:[])].includes(req.ware))return {ok:false,reason:'Nur echte Erzförderung'};
  return {ok:true,command:{type:req.type,owner,schiff:req.schiff,...(req.type==='shipMine'?{ware:req.ware}:{})}};
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
   yardBuyBefore:core.pilotW5Verkauf(state),yardBuyAfter:core.pilotW5Verkauf(next),
   transferBefore:core.pilotW5TransferStand(state),transferAfter:core.pilotW5TransferStand(next)};
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
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5acSession=api;
})(globalThis);
