// Entwicklungsmodell für Aphros Void: physische Module und Pilotenkäufe.
// Weder Browser-Laufzeitcode noch zweiter Wirtschafts-/Kampfkern.
// Sieben Bauarten × MK I–III; Größen S/M/L werden erst nach Grundabnahme eingeführt.
const KINDS = [
 ['cargo','Frachtraumerweiterung','material'],
 ['miner','Bergbauverstärker','silizium'],
 ['shield','Schildgenerator','bauteil'],
 ['laser','Laser','silizium'],
 ['afterburner','Nachbrenner','material'],
 ['battery','Batterie','silizium'],
 ['radar','Radar','kristall'],
];
export const MODULE_KINDS=Object.freeze(KINDS.map(([id,name])=>Object.freeze({id,name})));
const catalog={};
for(const [kind,name,special] of KINDS){
 for(let tier=1;tier<=3;tier++){
  const id=kind+'-mk'+tier;
  const inputs={material:1+tier,bauteil:tier};
  if(special!=='material'&&special!=='bauteil')inputs[special]=(inputs[special]||0)+tier;
  if(tier===3&&special!=='kristall')inputs.kristall=(inputs.kristall||0)+1;
  catalog[id]=Object.freeze({id,name:name+' MK '+tier,kind,tier,
   inputs:Object.freeze(inputs),cycles:2*tier,fee:15*tier});
 }
}
export const MODULE_CATALOG=Object.freeze(catalog);

export function moduleId(kind,tier){
 const id=kind+'-mk'+tier;
 return Object.hasOwn(MODULE_CATALOG,id)?id:null;
}
export function initModules(state){
 if(!state.moduleLab)state.moduleLab={stock:{},produced:{},sold:{},transactions:0,
  paidISK:0,consumed:{},buyCounts:{},crew:{},idle:{},lots:{},lostCargoCost:0};
 return state.moduleLab;
}
const qty=(o,k)=>o?.[k]||0;
export function priceModule(state,rules,core,station,id){
 const item=MODULE_CATALOG[id];
 if(!item||!state.stations[station]||!rules.world.stations[station])return 0;
 let cost=item.fee;
 for(const [ware,n] of Object.entries(item.inputs)){
  const offered=core.preis(state,station,ware,rules);
  const p=offered||rules.economy.waren[ware]?.basis;
  if(!Number.isSafeInteger(p)||p<=0)return 0;
  cost+=p*n;
 }
 return cost;
}
export function canCraft(state,rules,station,id){
 const r=MODULE_CATALOG[id],st=state.stations[station],cfg=rules.world.stations[station];
 if(!r||!st||!cfg)return false;
 // Nur existierende industrielle Stationen. Keine Fabrik aus dem Nichts.
 if(!st.linien.some(l=>l.rezept==='r_bauteil'||l.rezept==='r_material'))return false;
 for(const [ware,n] of Object.entries(r.inputs)){
  // Normaler Stationsverbrauch und übrige Produktion bleiben bevorzugt.
  const reserve=Math.floor(qty(cfg.ziel,ware)/2);
  if(qty(st.lager,ware)<reserve+n)return false;
 }
 return true;
}
export function craftModule(state,rules,station,id){
 if(!canCraft(state,rules,station,id))return false;
 const r=MODULE_CATALOG[id],st=state.stations[station],lab=initModules(state);
 for(const [ware,n] of Object.entries(r.inputs)){
  st.lager[ware]-=n;
  state.ledger[ware].consumed+=n;
  lab.consumed[ware]=qty(lab.consumed,ware)+n;
 }
 if(!lab.stock[station])lab.stock[station]={};
 lab.stock[station][id]=qty(lab.stock[station],id)+1;
 lab.produced[id]=qty(lab.produced,id)+1;
 return true;
}
export function buyModule(state,rules,core,station,pilotId,id){
 const lab=state.moduleLab,pilot=state.owners[pilotId],cfg=MODULE_CATALOG[id];
 if(!lab||!cfg||!pilot||pilot.kind!=='pilot'||!state.owners[station])return false;
 if(qty(lab.stock[station],id)<=0)return false;
 const cost=priceModule(state,rules,core,station,id);
 if(cost<=0||pilot.cash<cost)return false;
 const previous=pilot.modules?.[cfg.kind]||0;
 if(previous!==cfg.tier-1)return false; // I -> II -> III; kein Doppelkauf
 const stationOwner=state.owners[station];
 pilot.cash-=cost;stationOwner.cash+=cost;
 if(!pilot.modules)pilot.modules={};
 pilot.modules[cfg.kind]=cfg.tier;
 if(!pilot.ownedModules)pilot.ownedModules={};
 pilot.ownedModules[id]=qty(pilot.ownedModules,id)+1;
 lab.stock[station][id]--;
 lab.sold[id]=qty(lab.sold,id)+1;
 lab.buyCounts[pilotId]=qty(lab.buyCounts,pilotId)+1;
 lab.transactions++;lab.paidISK+=cost;
 state.stats.konto[pilotId].kosten+=cost;
 state.stats.konto[station].erloes+=cost;
 return true;
}
export function auditModules(state){
 const lab=state.moduleLab;
 if(!lab)return{ok:true,reason:'no module economy'};
 const errors=[],held={};
 for(const stock of Object.values(lab.stock)){
  for(const [id,n] of Object.entries(stock)){
   if(!Number.isSafeInteger(n)||n<0||!MODULE_CATALOG[id])errors.push('invalid station module '+id);
   held[id]=qty(held,id)+n;
  }
 }
 const bought={};
 for(const o of Object.values(state.owners)){
  if(o.kind!=='pilot')continue;
  for(const [id,n] of Object.entries(o.ownedModules||{})){
   if(!Number.isSafeInteger(n)||n<0||!MODULE_CATALOG[id])errors.push('invalid pilot module '+id);
   bought[id]=qty(bought,id)+n;
  }
 }
 for(const id of Object.keys(MODULE_CATALOG)){
  const made=qty(lab.produced,id),sold=qty(lab.sold,id);
  if(made!==sold+qty(held,id))errors.push('module stock mismatch '+id);
  if(sold!==qty(bought,id))errors.push('pilot ownership mismatch '+id);
 }
 return{ok:errors.length===0,errors};
}
