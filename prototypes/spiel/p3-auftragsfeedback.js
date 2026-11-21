/* M-UX3: ausschließlich lesende Originalbelege; flüchtige UI-Meldung separat. */
(function(scope){
'use strict';
function auswerten(w,s){
 if(!w.audit(s).ok)throw Error('Auftragsfeedback: Originalaudit fehlgeschlagen');
 const owned=Object.values(s.ships).filter(x=>x.owner==='house');
 const ids=new Set(owned.map(x=>x.id));
 const f=s.kanon?.spielerFrachten;
 const frachten=(f?.auftraege||[]).filter(x=>ids.has(x.schiff)).map(x=>({
  schiff:x.schiff,start:x.start,end:x.end,menge:x.menge,geliefert:x.geliefert,
  status:x.end!==null?'Abgeschlossen':x.geliefert!==null?'Geliefert · Rückflug läuft':'Gestartet · Hinflug läuft'
 }));
 const foerderung=owned.filter(x=>s.kanon?.pendel?.[x.id]).map(x=>({
  schiff:x.id,phase:x.phase,ladung:Object.entries(x.ladung||{}).filter(([,n])=>n>0).map(([k,n])=>k+': '+n).join(', ')||'leer'
 }));
 return {tick:s.tick,frachten,foerderung,gebuehr:f?.gebuehr||0,lohn:f?.lohn||0,
  cash:s.owners.house.cash,buchwert:owned.reduce((n,x)=>n+w.buchwert(s,x.id),0),
  zeitAktiv:foerderung.length>0||frachten.some(x=>x.end===null)};
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3Auftragsfeedback=api;
})(globalThis);
