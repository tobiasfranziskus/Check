import {jagdSichtV1} from './m_ui_jagdsicht.mjs';

/**
 * Nur Darstellungsadapter zwischen Auftrag A (#173) und Auftrag B (#172).
 * Eingang: m_core_index.JagdSichtV1(state), keine Rohzustände und kein Coreimport.
 * Kein Pirat, Schuss, Abschuss, Pilot, Ort oder Kurs wird erfunden.
 * Mehrsystem-Stände müssen ausdrücklich auf ein System begrenzt werden.
 */
export function w5bJagdSichtAusCore(coreSicht, gewaehltSystem) {
 if(!coreSicht || coreSicht.version!=='JagdSichtV1'
   || !Number.isSafeInteger(coreSicht.tick) || coreSicht.tick<0
   || !Array.isArray(coreSicht.jaeger)) throw new TypeError('Ungültige W5b-Core-JagdSichtV1');
 const systemId=gewaehltSystem??coreSicht.jaeger[0]?.system??'nadir';
 if(typeof systemId!=='string'||!systemId)throw new TypeError('System-ID fehlt');
 const schiffe=coreSicht.jaeger.filter(s=>s.system===systemId).map(s=>{
   const owner=s.owner;
   if(typeof owner!=='string'||!owner||typeof s.id!=='string'||!s.id
     ||s.klasse!=='jaeger'||typeof s.phase!=='string'||!s.phase)
     throw new TypeError('Autoritatives Jaegerfeld unvollständig');
   return {
     id:s.id,besitzer:{id:owner,art:owner==='house'?'spieler':owner==='pirates'?'pirat':'npc'},
     klasse:s.klasse,status:s.phase,
     // Keine Position/XP/Rang erfinden: Renderer nutzt nur ID-sortierte Platzhalter.
   };
 });
 // W5b hat keine Piraten, Schuss-/Abschussbelege oder Jagdanomalie.
 // Kennung beschreibt nur eine schematische Werftübersicht, keine reale Anomalie.
 return jagdSichtV1({version:'JagdSichtV1',tick:coreSicht.tick,
   systemId,anomalieId:'werft-kontakte-ohne-anomalie',schiffe,ereignisse:[]});
}
