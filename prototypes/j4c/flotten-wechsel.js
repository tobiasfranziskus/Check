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
const API=Object.freeze({pruefen,liste});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J6FlottenWechsel=API;
})(typeof globalThis==='object'?globalThis:this);
