import {w5fSicht} from './m_ui_w5f_core.mjs';
/** Ein einziger Regel24-Core; keine weiteren UI-Geldkonten, eigener Save. */
export function w5gSitzung(api,anfang=api.createW5GState(42)){
 let state=anfang;const rules=api.W5G_RULES;
 function pruefen(){
   if(state?.rulesVersion!==rules.rulesVersion||state.schema!==rules.schema
     ||!api.audit(state).ok)throw Error('Forschungsregel24 oder Geld-/Warenaudit nicht gültig');
 }
 pruefen();
 return {
   lesen:()=>state,export:()=>api.save(state),
   befehl:cmd=>{pruefen();const r=api.execute(state,cmd,rules);pruefen();return r;},
   schritt:n=>{
     if(![1,10,20,32,50,60,64,120].includes(n))throw Error('Nicht erlaubter Schritt');
     pruefen();api.advance(state,n,rules);pruefen();
   },
   import:raw=>{const next=api.loadW5G(raw);if(!api.audit(next).ok)throw Error('Audit ungültig');state=next;},
   neu:seed=>{
     if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw Error('Seed ungültig');
     const next=api.createW5GState(seed);
     if(!api.audit(next).ok)throw Error('Startaudit nicht gültig');state=next;
   },
 };
}
export function w5gSicht(api,state,selection){
 const old=w5fSicht(api,state,selection);
 const budget=api.pilotW5GPlan(state);
 const result={...old,version:'W5gSichtV1',w5g:budget};
 // Keine verdeckte Veränderung des Core-States durch Rendern.
 return Object.freeze(result);
}
