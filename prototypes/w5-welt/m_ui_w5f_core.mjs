import {weltSicht} from './m_ui_welt_core.mjs';
/** Regel23-Forschung: exakt ein Core-State pro Sitzung, getrennter Save-Loader. */
export function w5fSitzung(api,anfang=api.createW5FState(42)){
 let state=anfang;
 const rules=api.W5F_RULES;
 function pruefen(){
   if(!state||state.rulesVersion!==rules.rulesVersion||state.schema!==rules.schema
     ||!api.audit(state).ok)throw Error('Regel23-Sitzung oder Geld-/Warenaudit ungültig');
 }
 pruefen();
 return {
   lesen:()=>state,export:()=>api.save(state),
   befehl:cmd=>{pruefen();const r=api.execute(state,cmd,rules);pruefen();return r;},
   schritt:n=>{
     if(![1,10,20,32,50,60,64,120].includes(n))throw Error('Ungültiger Zeitschritt');
     pruefen();api.advance(state,n,rules);pruefen();
   },
   import:raw=>{const loaded=api.loadW5F(raw);if(!api.audit(loaded).ok)throw Error('Audit ungültig');state=loaded;},
   neu:seed=>{
     if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw Error('Seed ungültig');
     const next=api.createW5FState(seed);if(!api.audit(next).ok)throw Error('Startaudit ungültig');state=next;
   },
 };
}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
/** Lesende Zusatzauswertung, keine UI-eigene Geld-/Warenformel. */
export function w5fSicht(api,state,selected){
 const base=weltSicht(api,state,selected),status=api.pilotW5FStand(state);
 return freeze({...base,version:'W5fSichtV1',
   pilot:{cash:status.pilotCash,lohn:status.pilotLohn,kopfgeld:status.kopfgeld,
     stunden:state.w5f.stunden,xp:status.xp,reserviert:status.bountyEscrow},
   laser:{gefertigt:status.fertigeLaser,verkauft:status.verkaufteLaser,
     eingebaut:status.eingebauteLaser,bonus:status.angriffBonus,
     vollkosten:api.pilotW5FVollkosten(),
     restLager:state.stations.st_nadir.lager.laser_mk1},
 });
}
