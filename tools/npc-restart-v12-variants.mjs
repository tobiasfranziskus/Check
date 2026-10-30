// Ausschließlich Laborvarianten bestehender Fonds-/Zuschuss-/Ersatzregeln.
// Produktive Regeln, npcAusgaben und Spielerbefehle bleiben unverändert.
import assert from 'node:assert/strict';
export const variants=['control','fonds-pool','werft-reserve','ueberschuss-zur-werft','zuschuss-mit-ruecklage'];
function span(source,name){
 const start=source.indexOf('function '+name+'(');assert(start>=0,name);
 const end=source.indexOf('\n}',start)+2;assert(end>start,name);return {start,end,text:source.slice(start,end)};
}
function once(text,anchor,replacement){assert.equal(text.split(anchor).length,2,'Variantenanker: '+anchor);return text.replace(anchor,replacement);}
const needCode=`
  // Erster bezahlter Ersatz für einen vollständig ausgefallenen Händler.
  const leereHaendler = ids(state.sollflotte).filter((id) => o[id].kind === 'trader'
    && !ids(state.ships).some((s) => state.ships[s].owner === id));
  let werftBedarf = 0;
  for (const owner of leereHaendler) {
    const klasse = state.sollflotte[owner][0].klasse;
    if ((state.stations[w.werft].lager[klasse] || 0) < 1) continue;
    const p = m_core_preis.preis(state,w.werft,klasse,rules);
    werftBedarf = Math.max(werftBedarf,Math.max(0,p+m_core_handel.gebuehr(state,rules,w.werft,p)-o[owner].cash));
  }
  const werftFonds = fondsIn(rules,state.stations[w.werft].system);`;
export function variantSource(source,variant){
 assert(variants.includes(variant));if(variant==='control')return source;
 const name=variant==='fonds-pool'?'zuschuss':variant==='zuschuss-mit-ruecklage'?'ersatzkauf':'fonds',s=span(source,name);
 let modified=s.text;
 if(variant==='fonds-pool')modified=`function zuschuss(state, rules, owner, bedarf) {
  const restbedarf = bedarf - state.owners[owner].cash;
  const lokal = fondsIn(rules,state.stations[rules.world.werft].system);
  const quellen = state.owners[owner].kind === 'trader'
    ? ids(state.owners).filter((id) => state.owners[id].kind === 'fund') : [lokal];
  if (restbedarf <= 0 || quellen.reduce((n,id) => n+state.owners[id].cash,0) < restbedarf) return 0;
  let rest = restbedarf;
  for (const id of quellen) {
    const f = state.owners[id]; const n = Math.min(f.cash,rest);
    if (n <= 0) continue;
    f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n;
    rest -= n;
  }
  return restbedarf;
}`;
 if(variant==='werft-reserve'||variant==='ueberschuss-zur-werft'){
  modified=once(modified,'const w = rules.world; const o = state.owners; const stationen = ids(state.stations);',
   'const w = rules.world; const o = state.owners; const stationen = ids(state.stations);'+needCode);
  if(variant==='werft-reserve')modified=once(modified,'Math.min(f.cash, w.mindeststand - o[id].cash)',
   'Math.min(Math.max(0,f.cash-(id===w.werft?werftBedarf:0)), w.mindeststand - o[id].cash)');
  else modified=once(modified,'o[arm].cash += f.cash - w.fondsObergrenze;',
   'if (werftBedarf > o[werftFonds].cash && f.id !== werftFonds) arm = werftFonds;\n    o[arm].cash += f.cash - w.fondsObergrenze;');
 }
 if(variant==='zuschuss-mit-ruecklage')modified=once(modified,'if (leer) zuschuss(state, rules, owner, bedarf);',
  "if (leer) zuschuss(state, rules, owner, bedarf + (state.owners[owner].kind === 'trader' ? w.ersatzRuecklage : 0));");
 assert.notEqual(modified,s.text);
 const result=source.slice(0,s.start)+modified+source.slice(s.end);
 assert.equal(result.replace(modified,s.text),source,'Änderung außerhalb der einen zugelassenen Funktion');
 return result;
}
