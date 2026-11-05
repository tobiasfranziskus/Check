import {w5jSitzung,w5jSicht} from './m_ui_w5j_core.mjs';
// Nur Projektion der unveränderten Regel26-Bücher, kein zweiter Core.
export const w5kSitzung=(api,initial=api.createW5IState(42))=>w5jSitzung(api,initial);
export function w5kStand(api,state){
 if(state?.rulesVersion!==api.W5I_RULES.rulesVersion||!api.audit(state).ok)
   throw Error('W5k: ungültiger Regel26-Spielstand');
 const ships=Object.values(state.ships);
 const npc=ships.find(sh=>sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera');
 const house=ships.find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.system==='aldera');
 const n=sh=>sh?.id?(state.stats.verkaeufe[sh.id]??0):0;
 const result=Object.freeze({
  npcMinerId:npc?.id??null,npcAuftrag:npc?.auftrag??'nicht vorhanden',
  npcErzverkaeufe:n(npc),houseMinerId:house?.id??null,
  houseAuftrag:house?.auftrag??'noch nicht gekauft',houseErzverkaeufe:n(house),
  npcErloese:state.stats.konto.npc3.erloes,houseErloese:state.stats.konto.house.erloes,
  erzGeliefert:state.w3.geliefert,jaegerGebaut:state.w5b.jaegerFertig,
  jaegerGekauft:state.w5b.jaegerVerkauft,minted:state.minted
 });
 if(![result.npcErzverkaeufe,result.houseErzverkaeufe,result.npcErloese,
   result.houseErloese].every(v=>Number.isSafeInteger(v)&&v>=0))
   throw Error('W5k: ungültige Kontenstatistik');
 return result;
}
export function w5kSicht(api,state,selection){
 const v=w5jSicht(api,state,selection);
 return Object.freeze({...v,version:'W5kSichtV1',w5k:w5kStand(api,state)});
}
