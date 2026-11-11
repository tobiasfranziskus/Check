/* Aphros Void F2b [DRAFT]: vollstaendige physische 50-Eis-Charge.
 * KEIN paralleler Wirtschaftskern. Gemeinsamer Rule195/W5n-Buchungskern aus F2a,
 * mit exklusivem opt-in-Forschungsflag Rule198 fuer Dock-Abnahme.
 * Einzige Abweichung zur produktiven Regel195: keine automatische Eisabnahme
 * im Feld. Lohn, Finanzierung, Ladung, Kaufetat und Original-shipSellIce
 * bleiben die autoritative Core-Implementierung.
 */
(function(scope) {
'use strict';
const F2a = typeof module === 'object' && module.exports
  ? require('./f2a-eis-pendel.js') : scope.F2aEisPendel;
if (!F2a?.erstellen) throw Error('F2b: gemeinsamer F2a-Minerdienst fehlt');
const PROFIL=198, CHARGE=50;
function erstellen(startkapital={}) {
  const f=F2a.erstellen(startkapital,{researchProfile:PROFIL,charge:CHARGE});
  if(f.rules.rulesVersion!==PROFIL || f.rules.w5n.charge!==CHARGE
    || f.rules.w5n.f2bDockOnly!==true)
    throw Error('F2b: kein exklusiver Forschungs-Dockschutz aktiv');
  return f;
}
const api=Object.freeze({erstellen,PROFIL,CHARGE});
if(typeof module==='object' && module.exports) module.exports=api;
else scope.F2bVollcharge=api;
})(globalThis);
