/* W5ah: a guarded, opt-in browser controller for the ONE original Rule195 Core.
   No own tick, pricing, money movements, persistence, or automatic demand. */
(function(scope){
'use strict';
const Factory=typeof module==='object'&&module.exports
  ?require('../w5ac/rule191-w5-ferry-core.js'):scope.W5acOriginal;
if(!Factory||typeof Factory.createPrivateWageResearch!=='function')
  throw Error('W5ag-Forschungs-Core fehlt');
function create({seed=42,carrierCash=2000,buyerCash=4000}={}){
 const {core,rules}=Factory.createPrivateWageResearch({carrierCash,buyerCash});
 if(rules.rulesVersion!==195||rules.schema!==8)throw Error('Nur Forschungsregel195 / Schema8');
 const own=Object.prototype.hasOwnProperty;
 function validate(json){
  if(typeof json!=='string')throw Error('Nur JSON-Text importierbar');
  const raw=JSON.parse(json);
  if(!raw||raw.schema!==8||raw.rulesVersion!==195)
   throw Error('Nur W5ag/W5ah-Forschungsregel195; keine produktiven oder fremden Saves');
  const candidate=core.loadW5(json),audit=core.audit(candidate);
  if(!audit.ok||!audit.personal?.ok||!audit.water?.ok||!audit.w3?.ok
    ||!audit.w4?.ok||!audit.w5?.ok||!audit.goods?.ok||!audit.isk?.ok)
   throw Error('Original-Core-Geld-/Privatlohn-/Waren-/Eigentums-Audit fehlgeschlagen');
  return candidate;
 }
 let state=validate(core.save(core.createW5State(seed)));
 function ship(s,owner,klasse){
  return Object.values(s.ships).sort((a,b)=>a.id.localeCompare(b.id))
    .find(x=>x.owner===owner&&x.klasse===klasse)||null;
 }
 function prepare(s,action,menge){
  const freighter=ship(s,'transport','frachter'),miner=ship(s,'house','miner');
  switch(action){
   case 'buy-freighter':return {type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'};
   case 'buy-miner':return {type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'};
   case 'mine-ice':
   case 'mine-ore':return miner
     ?{type:'shipMine',owner:'house',schiff:miner.id,ware:action==='mine-ice'?'eis':'erz'}:null;
   case 'stop-miner':return miner?{type:'shipWait',owner:'house',schiff:miner.id}:null;
   case 'ore-freight':
   case 'ice-freight':return freighter?{type:action==='ore-freight'?'shipFreight':'shipFreightIce',owner:'transport',schiff:freighter.id}:null;
   case 'produce-water':return {type:'stationWater',owner:'st_nadir',station:'st_nadir'};
   case 'ore-water':
   case 'ice-water':return Number.isSafeInteger(menge)&&menge>0
     ?{type:'pilotWaterBuy',owner:action==='ore-water'?'pilot_erz':'pilot_eis',menge}:null;
   default:return null;
  }
 }
 function changed(mutate){
  const next=validate(core.save(state)),res=mutate(next);
  if(res&&res.ok===false)return {ok:false,reason:res.reason};
  state=validate(core.save(next));return {ok:true};
 }
 function snapshot(){
  const audit=core.audit(state);
  if(!audit.ok)throw Error('Original-Core-Audit nicht bestanden');
  const bought=id=>state.w5n.kaufDeals.filter(x=>x.owner===id)
    .reduce((a,d)=>({menge:a.menge+d.menge,isk:a.isk+d.betrag}),{menge:0,isk:0});
  const cash={};
  for(const id of ['house','transport','st_aldera','st_nadir','pilot_erz','pilot_eis','fonds_transport'])
   cash[id]=state.owners[id].cash;
  return Object.freeze({
   tick:state.tick,hash:core.hash(state),rulesVersion:state.rulesVersion,
   cash:Object.freeze(cash),wages:Object.freeze({...state.w5ag.paid}),
   bought:Object.freeze({erz:bought('pilot_erz'),eis:bought('pilot_eis')}),
   freighter:ship(state,'transport','frachter')?{...ship(state,'transport','frachter')}:null,
   miner:ship(state,'house','miner')?{...ship(state,'house','miner')}:null,
   iceAldera:state.stations.st_aldera.lager.eis||0,
   iceNadir:state.stations.st_nadir.lager.eis||0,
   waterNadir:state.stations.st_nadir.lager.wasser||0,
   made:state.w5n.wasserProduziert,consumed:state.w5n.wasserVerbraucht,
   iceDelivered:state.w5n.eisGeliefert,price:rules.w5n.wasserPreis,
   oreTrips:state.w3.abgeschlossen,iceTrips:state.w5n.frachtAbgeschlossen,
   waterWorks:state.w5n.fabrikFertig,waterSales:state.w5n.wasserErlos,
   minted:state.minted,worldCash:Object.values(state.owners).reduce((a,o)=>a+o.cash,0),
   auditOk:audit.ok,events:state.ereignisse.slice(-5).map(x=>JSON.parse(JSON.stringify(x)))
  });
 }
 return Object.freeze({
  snapshot,export:()=>core.save(state),
  import(json){const next=validate(json);state=next;return {ok:true};},
  command(action,menge){
   const cmd=prepare(state,action,menge);
   if(!cmd)return {ok:false,reason:'Aktion/Menge oder eigenes Schiff nicht verfügbar'};
   return changed(next=>core.execute(next,cmd,rules));
  },
  advance(minutes){
   if(!Number.isSafeInteger(minutes)||minutes<1||minutes>1440)
    return {ok:false,reason:'Nur 1 bis 1440 echte Core-Minuten'};
   return changed(next=>{core.advance(next,minutes,rules);return {ok:true};});
  }
 });
}
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5ahSession=api;
})(globalThis);
