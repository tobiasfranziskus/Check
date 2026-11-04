/** JagdSichtV1: data-only boundary. No Core imports, commands, persistence or clock. */
export function jagdSichtV1(input) {
 const v=JSON.parse(JSON.stringify(input));
 const text=x=>typeof x==='string'&&x.length>0;
 const tick=x=>Number.isSafeInteger(x)&&x>=0;
 const fail=()=>{throw new TypeError('Ungültige JagdSichtV1-Projektion')};
 if(v.version!=='JagdSichtV1'||!tick(v.tick)||!text(v.systemId)||!text(v.anomalieId)||!Array.isArray(v.schiffe)||!Array.isArray(v.ereignisse))fail();
 const ids=new Set();
 for(const s of v.schiffe){
  if(!text(s.id)||ids.has(s.id)||!text(s.besitzer?.id)||!['spieler','npc','pirat'].includes(s.besitzer.art)||!text(s.klasse)||!text(s.status))fail();
  if(s.position&&(!Number.isFinite(s.position.x)||!Number.isFinite(s.position.y)))fail();
  ids.add(s.id);
 }
 const events=new Set(),kills=new Set();
 for(const e of v.ereignisse){
  if(!text(e.id)||events.has(e.id)||!text(e.belegId)||!tick(e.tick)||e.tick>v.tick||!['schuss','abschuss'].includes(e.art)||!ids.has(e.quelleId)||!ids.has(e.zielId)||e.quelleId===e.zielId)fail();
  if(e.art==='abschuss'){
   if(kills.has(e.zielId)||v.schiffe.find(s=>s.id===e.zielId).status!=='zerstoert')fail();
   kills.add(e.zielId);
  }
  events.add(e.id);
 }
 const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o)}return o};
 return freeze(v);
}
export function pilotenText(s){return `Pilot: ${s?.pilotId??'unbekannt'} · XP: ${s?.xp??'unbekannt'} · Rang: ${s?.rang??'unbekannt'}`}
// Presentation slots only: ID-sorted, independent of frame time. Optional authoritative positions win.
export function lagen(v){return [...v.schiffe].sort((a,b)=>a.id.localeCompare(b.id,'en')).map((s,i)=>({...s,x:s.position?.x??((i%3)-1)*620,y:s.position?.y??(Math.floor(i/3)*500-230)}))}
