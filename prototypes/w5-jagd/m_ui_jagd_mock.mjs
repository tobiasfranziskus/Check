import {jagdSichtV1} from './m_ui_jagdsicht.mjs';
// Explicit fixtures, not a simulator. Mock IDs must never be passed to a real Core command.
export function mockSicht(stufe=0){
 return jagdSichtV1({version:'JagdSichtV1',mock:true,tick:120+stufe,systemId:'mock:aldera',anomalieId:'mock:piraten-07',
 schiffe:[
  {id:'mock:sh101',besitzer:{id:'house',art:'spieler'},klasse:'jaeger',status:'jagd'},
  {id:'mock:sh202',besitzer:{id:'npc1',art:'npc'},klasse:'jaeger',status:'jagd'},
  {id:'mock:sh303',besitzer:{id:'piraten',art:'pirat'},klasse:'pirat_klein',status:stufe===2?'zerstoert':'jagd'}],
 ereignisse:stufe===0?[]:[{id:'mock:ev1',belegId:'mock:kampfprotokoll-1',tick:121,art:'schuss',quelleId:'mock:sh101',zielId:'mock:sh303'},...(stufe===2?[{id:'mock:ev2',belegId:'mock:verlust-1',tick:122,art:'abschuss',quelleId:'mock:sh202',zielId:'mock:sh303'}]:[])]});
}
