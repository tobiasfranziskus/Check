function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
/** Detached view only: no booking, command, tick, or mutation. Coordinates are schematic. */
export function frachterSicht(api,state,auswahl) {
 const rules=api.W3_RULES;
 if(state.rulesVersion!==rules.rulesVersion)throw Error('Diese Ansicht unterstützt derzeit nur W3-Regel17');
 const schiffe=Object.keys(state.ships).sort().map(id=>state.ships[id]).filter(s=>s.klasse==='frachter').map(s=>({
  id:s.id,name:s.rufname||s.id,owner:s.owner,system:s.system,phase:s.phase,ziel:s.ziel,
  ankunft:s.phase==='reise'?s.ankunft:null,ladung:{...s.ladung},
 }));
 const schiff=schiffe.find(s=>s.id===auswahl)??schiffe[0]??null;
 const vertrag=state.w3.auftrag,aktiv=Boolean(vertrag&&schiff&&vertrag.schiff===schiff.id);
 const rueck=aktiv&&vertrag.phase==='rueck';
 const rest=schiff?.ankunft==null?null:Math.max(0,schiff.ankunft-state.tick);
 const fortschritt=aktiv?1-rest/vertrag.zeit:0;
 const x=schiff?.system==='nadir'?650:-650;
 const entities=[{id:'st_aldera',ty:'s',nm:rules.world.systems.aldera.station,x:-650,y:0},
  {id:'st_nadir',ty:'s',nm:rules.world.systems.nadir.station,x:650,y:0}];
 if(schiff)entities.push({id:schiff.id,ty:'p',nm:schiff.name,hull:'trader',owner:schiff.owner,
  x:aktiv?(rueck?650-1300*fortschritt:-650+1300*fortschritt):x,y:0,a:rueck?Math.PI:0});
 return freeze({version:'FrachterSichtV1',tick:state.tick,hash:api.hash(state),schiffe,schiff,
  richtung:aktiv?(rueck?'Nadir → Aldera':'Aldera → Nadir'):'Kein aktiver Transport',rest,
  plan:api.pilotW3Kalkulation(state,schiff?.id),audit:api.audit(state),stand:api.pilotW3Stand(state),
  lager:{aldera:state.stations.st_aldera.lager.erz,nadir:state.stations.st_nadir.lager.erz},
  canvas:{t:state.tick,entities,fields:[],cargo:schiff?Object.values(schiff.ladung).reduce((a,b)=>a+b,0):0,
   capacity:rules.economy.cargo,phase:schiff?.phase,auftrag:'fracht'},
 });
}
