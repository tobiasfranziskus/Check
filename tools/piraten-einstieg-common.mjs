// Aphros Void – Piraterie: ausschließlich Zielberechtigung in isolierter Analyse variieren.
// Kein Produktpatch, keine Laufzeitpflicht, keine zweite Wirtschafts-/Kampfrechnung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const MODES=['control','grace20','capital4000','activity'];
export const SHA=x=>createHash('sha256').update(x).digest('hex');
export const SEEDS=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
export const BASE='e0c27a3762d9d6e75d8bcc30ed47621eff2f152b';
export const PINS={evidence:'6855d76bb374dd777a1b7e30ea52c9a6eca36399',b1:'cec7f93758e4a499c238738ff50adac4416080d4'};
export function readCore(){
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.equal(html.includes('v0.12.4'),true,'nur tatsächlichen Regel-13-Kern zulassen');
 return html;
}
export function changePirates(src,mode){
 assert(MODES.includes(mode));
 if(mode==='control')return src;
 const needle="const ziele = ids(state.ships).filter((id) => zivil(rules, state.ships[id], system));";
 assert.equal(src.split(needle).length,2,'nur ursprüngliche Überfall-Zielauswahl ändern');
 let body;
 if(mode==='grace20'){
  // Initialflotte ist Tick 0; nach Tag 90 importierte alte Schiffe werden nicht künstlich neu gegründet.
  body="return state.tick - (s.erstelltTick ?? 0) >= 20 * 1440;";
 }else if(mode==='capital4000'){
  body="return state.owners[s.owner].cash >= 4000;";
 }else{
  body=[
   'const verkaeufe=anzahl(state.stats.verkaeufe,s.id);',
   'if(verkaeufe>=3)return true;',
   'const station=rules.world.systems[system].station;',
   'return ids(s.ladung).some(ware => s.ladung[ware]*preis(state,station,ware,rules)>=500);'
  ].join('\n');
 }
 const method='function piratenBerechtigt(state,rules,s,system){\n '+body+'\n}\n';
 const entry="function ueberfall(state, rules) {";
 assert.equal(src.split(entry).length,2,'nur ursprünglicher Überfall-Zweig');
 let result=src.replace(entry,method+entry).replace(needle,
  "const ziele = ids(state.ships).filter((id) => zivil(rules, state.ships[id], system) && piratenBerechtigt(state,rules,state.ships[id],system));");
 if(mode==='grace20'){
  const shipEntry="state.ships[id] = s; state.stats.verkaeufe[id] = 0; return s;";
  assert.equal(result.split(shipEntry).length,2,'eindeutige Indienststellung');
  result=result.replace(shipEntry,"s.erstelltTick = state.tick; "+shipEntry);
 }
 assert.notEqual(result,src);
 return result;
}
export function instrumentPirateTarget(source){
 const needle="const ziel = state.ships[ziele[rngInt(state, ziele.length)]];";
 assert.equal(source.split(needle).length,2,'ein Überfallziel pro Kampf');
 return source.replace(needle,needle+'\n    watch.pirateTarget(state,ziel,system);');
}
export function calculateSnapshot(state,rules,extra={}){
 const ownerIds=['house','npc1','npc2','npc3'];
 const owners=Object.fromEntries(ownerIds.map(id=>[id,state.owners[id].cash]));
 const ships={};
 for(const id of ownerIds){
  const active=Object.values(state.ships).filter(s=>s.owner===id);
  ships[id]={miners:active.filter(s=>s.klasse==='miner').length,freighters:active.filter(s=>s.klasse==='frachter').length};
 }
 const shortages={};
 for(const shortage of Object.values(state.stats.mangel))
  for(const [ware,minutes] of Object.entries(shortage))shortages[ware]=(shortages[ware]||0)+minutes;
 const lost={};
 for(const id of ownerIds)lost[id]={...(state.stats.verluste[id]||{})};
 const count=(obj)=>Object.values(obj).reduce((a,b)=>a+b,0);
 return {tick:state.tick,cash:owners,ships,shortages,totalShortage:count(shortages),losses:lost,
  trades:state.stats.handel,allSales:count(state.stats.verkaeufe),
  stationSilicon:state.stations.st_aldera.lager.silizium||0,
  stationParts:state.stations.st_aldera.lager.bauteil||0,
  npc3Missing:missingMiners(state,'npc3'),
  npc3Unpaid:extra.npc3Unpaid??null,
  battles:state.stats.kaempfe,minted:state.minted,burned:state.burned,
  digest:extra.hash};
}
export function missingMiners(s,owner){
 const slots=s.sollflotte[owner]||[];
 const counts={};
 for(const sh of Object.values(s.ships).filter(x=>x.owner===owner)){
  const k=[sh.klasse,sh.heimat,sh.ware].join('/');
  counts[k]=(counts[k]||0)+1;
 }
 let missing=0;
 for(const t of slots){
  if(t.klasse!=='miner')continue;
  const k=[t.klasse,t.heimat,t.ware].join('/');
  if((counts[k]||0)>0)counts[k]--;
  else missing++;
 }
 return missing;
}
export function independentlyAudit(state){
 let total=0;
 for(const o of Object.values(state.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0,'unzulässige Kasse');total+=o.cash;}
 assert.equal(total,state.initialSupply+state.minted-state.burned,'unabhängige Geldbilanz');
 const qty={};
 for(const st of Object.values(state.stations))
  for(const [ware,n] of Object.entries(st.lager)){assert(Number.isSafeInteger(n)&&n>=0,'Lager');qty[ware]=(qty[ware]||0)+n;}
 for(const sh of Object.values(state.ships))
  for(const [ware,n] of Object.entries(sh.ladung)){assert(Number.isSafeInteger(n)&&n>=0,'Fracht');qty[ware]=(qty[ware]||0)+n;}
 for(const [ware,l] of Object.entries(state.ledger))
  assert.equal(qty[ware]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'unabhängige Warenbilanz '+ware);
}
