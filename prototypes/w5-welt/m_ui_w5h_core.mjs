import {w5fSicht} from './m_ui_w5f_core.mjs';
/** Ein einziger Regel25-Core; keine weiteren UI-Geldkonten, eigener Save. */
export function w5hSitzung(api,anfang=api.createW5HState(42)){
 let state=anfang;const rules=api.W5H_RULES;
 function pruefen(){
   if(state?.rulesVersion!==rules.rulesVersion||state.schema!==rules.schema
     ||!api.audit(state).ok)throw Error('Forschungsregel25 oder Geld-/Warenaudit nicht gültig');
 }
 pruefen();
 return {
   lesen:()=>state,export:()=>api.save(state),
   befehl:cmd=>{pruefen();const r=api.execute(state,cmd,rules);pruefen();return r;},
   schritt:n=>{
     if(![1,10,20,32,50,60,64,120].includes(n))throw Error('Nicht erlaubter Schritt');
     pruefen();api.advance(state,n,rules);pruefen();
   },
   import:raw=>{const next=api.loadW5H(raw);if(!api.audit(next).ok)throw Error('Audit ungültig');state=next;},
   neu:seed=>{
     if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw Error('Seed ungültig');
     const next=api.createW5HState(seed);
     if(!api.audit(next).ok)throw Error('Startaudit nicht gültig');state=next;
   },
 };
}
export function w5hSicht(api,state,selection){
 const old=w5fSicht(api,state,selection);
 const budget=api.pilotW5HPlan(state);
 const result={...old,version:'W5hSichtV1',w5h:budget};
 // Keine verdeckte Veränderung des Core-States durch Rendern.
 return Object.freeze(result);
}
