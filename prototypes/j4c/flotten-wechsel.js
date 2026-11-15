/* Aphros Void J6 – sichere Flottenübernahme innerhalb EINER Regel204-Sitzung.
 * Reine Prüfung der Pilotenauswahl: niemals Welt, Geld, Schiffe oder Save verändern.
 * Wechsel ausschließlich zwischen bereits bezahlten Spielerjägern am selben Dock.
 * Das Cockpit muss die zurückgegebene pilot-ID ausdrücklich selbst übernehmen;
 * laufende Trainingsanzeigen sind dabei getrennt vom unveränderten Wirtschafts-Save.
 */
(function(scope){
'use strict';

const ablehnung = reason => Object.freeze({ok:false,reason});
const gekauft = (s,id) => s.kanon?.jaeger?.kaeufe?.some(
  k=>k.id===id&&k.owner==='house'&&k.station==='st_nadir')===true;
function dock(s,sh) {
  const b=sh?.flug, st=s.stations?.[b?.anker];
  return sh?.phase==='dock' && b?.lage==='angedockt'
    && typeof b.anker==='string' && !!st
    && sh.system===st.system ? b.anker : null;
}
function pruefen(w,s,aktiv,ziel,sitzung){
  if(s?.rulesVersion!==204 || !w || typeof w.audit!=='function')
    return ablehnung('Nur eine Regel204-Welt mit Original-Core ist zulässig');
  if(!sitzung || typeof sitzung.spielt!=='boolean'
     || !Object.prototype.hasOwnProperty.call(sitzung,'patrouille')
     || !Object.prototype.hasOwnProperty.call(sitzung,'duell'))
    return ablehnung('Sitzungsstatus einschließlich Flug und Training fehlt');
  if(typeof aktiv!=='string'||typeof ziel!=='string'||aktiv===ziel)
    return ablehnung('Bitte ein anderes, tatsächlich vorhandenes Schiff wählen');
  let audit;
  try { audit=w.audit(s); }
  catch { return ablehnung('Wirtschafts- und Eigentumsaudit fehlgeschlagen'); }
  if(!audit?.ok) return ablehnung('Wirtschafts- und Eigentumsaudit fehlgeschlagen');
  const bisher=s.ships?.[aktiv],neu=s.ships?.[ziel];
  if(!bisher||bisher.owner!=='house'||bisher.klasse!=='jaeger'||!gekauft(s,aktiv))
    return ablehnung('Aktueller Pilot hat keinen bezahlten Spielerjäger');
  if(!neu||neu.owner!=='house'||neu.klasse!=='jaeger'||!gekauft(s,ziel))
    return ablehnung('Ziel ist kein eigener, vollständig gekaufter Jäger');
  if(sitzung.spielt) return ablehnung('Flugzeit erst pausieren');
  if(sitzung.patrouille && ['bereit','flug'].includes(sitzung.patrouille.status))
    return ablehnung('Aktive Patrouille zuerst abschließen oder abbrechen');
  if(sitzung.duell && sitzung.duell.status==='aktiv')
    return ablehnung('Aktives Trainingsduell zuerst beenden');
  const ort=dock(s,bisher);
  if(!ort) return ablehnung('Aktueller Jäger ist nicht vollständig angedockt');
  if(dock(s,neu)!==ort)
    return ablehnung('Zieljäger ist nicht am selben wirklichen Dock');
  if(s.kanon?.flugdienst?.[aktiv]||s.kanon?.flugdienst?.[ziel])
    return ablehnung('Flugdienst oder Lohnreserve noch aktiv');
  return Object.freeze({
    ok:true,pilot:ziel,vorher:aktiv,station:ort,
    trainingsanzeigenZuruecksetzen:!!(sitzung.patrouille||sitzung.duell)
  });
}
function liste(w,s,aktiv,sitzung){
  if(s?.rulesVersion!==204||!s.ships)
    throw Error('J6: keine Regel204-Flotte');
  return Object.freeze(Object.values(s.ships).filter(sh=>sh.owner==='house')
    .sort((a,b)=>a.id.localeCompare(b.id,'de'))
    .map(sh=>{
      const p=pruefen(w,s,aktiv,sh.id,sitzung);
      return Object.freeze({
        id:sh.id,klasse:sh.klasse,system:sh.system,
        station:dock(s,sh),auswaehlbar:p.ok,
        grund:p.ok?'':p.reason
      });
    }));
}

// RAUM-1-Rollenwechsel: auch ein tatsächlich vorhandener, eigener F6-Miner
// und ein tatsächlich gekaufter Aldera-Frachter dürfen am selben Dock übernommen werden.
function vertragsKonflikt(s,id){
  return !!s.kanon?.pendel?.[id] ||
    [s.w3?.auftrag?.schiff,s.w5n?.frachtauftrag?.schiff,
     s.w5ac?.active?.id,s.kanon?.rueckfracht?.schiff,
     s.kanon?.silizium?.auftrag?.schiff].includes(id);
}
function rollenGrund(s,sh){
  if(vertragsKonflikt(s,sh.id))return 'Laufenden Vertrag vor Schiffwechsel abschließen';
  if(sh.klasse==='frachter'){
    if(!s.kanon?.spielerFrachterKaeufe?.some(k=>k.id===sh.id))
      return 'Frachter ohne Original-Kaufbeleg';
    if(sh.system!=='aldera')return 'Original-Core erlaubt freien Frachterflug nur in Aldera';
  }
  return null;
}
function pruefenRolle(w,s,aktiv,ziel,sitzung){
  if(w?.regel!==204||s?.rulesVersion!==204||!s?.ships)
    return ablehnung('Nur die originale Regel204-Welt ist zulässig');
  if(!sitzung||typeof sitzung.spielt!=='boolean'
     ||!Object.hasOwn(sitzung,'patrouille')||!Object.hasOwn(sitzung,'duell'))
    return ablehnung('Vollständiger Sitzungsstatus fehlt');
  if(typeof aktiv!=='string'||typeof ziel!=='string'||aktiv===ziel)
    return ablehnung('Ein anderes eigenes Schiff wählen');
  const a=s.ships[aktiv],b=s.ships[ziel];
  if(!a||!b||a.owner!=='house'||b.owner!=='house')
    return ablehnung('Nur eigenes, physisch vorhandenes Schiff');
  if(!['jaeger','miner','frachter'].includes(a.klasse)||!['jaeger','miner','frachter'].includes(b.klasse))
    return ablehnung('Unbekannte Cockpitklasse');
  for(const sh of [a,b]){
    const grund=rollenGrund(s,sh);
    if(grund)return ablehnung(grund);
  }
  if((a.klasse==='jaeger'&&!gekauft(s,aktiv))
     ||(b.klasse==='jaeger'&&!gekauft(s,ziel)))
    return ablehnung('Jäger ohne tatsächlich nachgewiesenen Kaufbeleg');
  if(sitzung.spielt)return ablehnung('Weltzeit vor dem Schiffwechsel anhalten');
  if(sitzung.patrouille&&['bereit','flug'].includes(sitzung.patrouille.status))
    return ablehnung('Laufende Patrouille zuerst beenden');
  if(sitzung.duell&&sitzung.duell.status==='aktiv')
    return ablehnung('Trainingsduell zuerst beenden');
  const station=dock(s,a);
  if(!station||dock(s,b)!==station)
    return ablehnung('Beide Schiffe müssen vollständig am selben Dock liegen');
  if(s.kanon?.flugdienst?.[aktiv]||s.kanon?.flugdienst?.[ziel])
    return ablehnung('Fluglohnreserve erst am Dock abrechnen');
  let audit;
  try{audit=w.audit(s);}catch{return ablehnung('Weltaudit fehlgeschlagen');}
  if(!audit?.ok)return ablehnung('Weltaudit fehlgeschlagen');
  return Object.freeze({ok:true,pilot:ziel,vorher:aktiv,station,
    trainingsanzeigenZuruecksetzen:!!(sitzung.patrouille||sitzung.duell)});
}

const API=Object.freeze({pruefen,liste,pruefenRolle,vertragsKonflikt,rollenGrund});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J6FlottenWechsel=API;
})(typeof globalThis==='object'?globalThis:this);
