// K6 [ANALYSE]: ein versus zwei versus vier vorhandene, selbst finanzierte npc3-Miner.
// Ausschließlich echte Originalbefehle, keine Geld-/Waren-/Schiffserzeugung,
// keine Änderungen am K1/K4/K5-Core und keine neue Produktregel.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { diagnoseK5, pruefen } from './k5-terminal-diagnose.mjs';

export const K6_TERMINAL = 21612;
export const K6_MINUTEN = 3000;
export const K6_SEEDS = Object.freeze([42, 7]);
const eiskauf = s => s.w5n.mineVerkauft;
const wasserabsatz = s => s.kanon.wasser.verkauftNadir + s.kanon.wasser.verkauftAldera;
const eigentuemer = s => Object.fromEntries(Object.values(s.ships).map(sh => [sh.id, sh.owner]));
const geld = s => Object.values(s.owners).reduce((n, a) => n + a.cash, 0);
const zaehler = s => ({
  erz: s.ledger.erz.mined, export: s.ledger.erz.exported,
  erzFracht: s.w3.geliefert, material: s.w4.materialErzeugt,
  frachter: s.w5.fertig, minerBau: s.kanon.minerWerft?.fertig || 0,
  eis: s.w5n.eisAbgebaut, eisKauf: eiskauf(s),
  eisFracht: s.w5n.eisGeliefert, eisAbschluss: s.w5n.frachtAbgeschlossen,
  wasser: s.w5n.wasserProduziert, wasserKauf: wasserabsatz(s),
});
const differenz = (a, b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v - a[k]]));

// Erzeugt den identischen und unabhängig durch K5/K4 verifizierten Stoppzustand.
// Nur einmal je Seed erzeugen; alle Varianten starten von einem unveränderlichen Save.
export function k6Start(seed) {
  if (!K6_SEEDS.includes(seed)) throw RangeError('K6: nur Seed 42 und 7');
  const { w, terminalSave, bericht } = diagnoseK5(seed, 16);
  const s = w.load(terminalSave);
  assert.equal(s.tick, K6_TERMINAL);
  pruefen(w, s);
  assert.equal(w.hash(s), bericht.checkpoints[K6_TERMINAL].hash);
  const ausgang = Object.values(s.ships)
    .filter(sh => sh.owner === 'npc3' && sh.klasse === 'miner'
      && w.buchwert(s, sh.id) > 0 && sh.flug.lage === 'angedockt'
      && Object.values(sh.ladung).every(x => x === 0))
    .sort((a, b) => a.id.localeCompare(b.id)).map(x => x.id);
  assert.deepEqual(ausgang, ['sh004', 'sh005', 'sh006', 'sh008'], 'K5: vier echte NPC-Ersatzoptionen');
  return { w, terminalSave, ausgang, seed, startHash: w.hash(s) };
}

// Begrenzter Vergleich: pro gewähltem Miner höchstens 50 NEU geförderte Eis,
// einmalig beim Start disponiert. Kein Nachstarten durch den Test, kein weiteres
// Nachfinanzieren; alle späteren Transaktionen nur durch den vorhandenen Core.
export function k6Versuch(quelle, anzahl, minuten = K6_MINUTEN) {
  if (![0, 1, 2, 4].includes(anzahl) || !Number.isSafeInteger(minuten)
      || minuten < 350 || minuten > 90 * 1440)
    throw RangeError('K6: unzulässiger begrenzter Test');
  const { w, terminalSave, ausgang, seed, startHash } = quelle;
  const s = w.load(terminalSave), start = zaehler(s), eigentum = eigentuemer(s);
  const kasseVor = Object.fromEntries(Object.entries(s.owners).map(([id, a]) => [id, a.cash]));
  const minerIds = ausgang.slice(0, anzahl);
  const arbeit = Object.fromEntries(minerIds.map(id => [id, {
    gefuellt: 0, letzterLaderaum: s.ships[id].ladung.eis || 0, stopTick: null,
  }]));
  const befehle = [], checkpoints = [], letzterAbsatz = { tick: null }, maxOffen = { eis: 0, wasser: 0 };
  const original = cmd => {
    const vor = w.canonical(s), r = w.execute(s, cmd);
    assert.equal(r.ok, true, 'K6 Originalbefehl ' + JSON.stringify(cmd) + ': ' + r.reason);
    assert.notEqual(w.canonical(s), vor, 'angenommener Originalbefehl hat sichtbare Wirkung');
    befehle.push({ tick: s.tick, ...cmd });
  };
  // Kein Spieler kann fremde Mine beauftragen. Ablehnung muss vollständig atomar sein.
  if (anzahl) {
    const vorher = w.canonical(s);
    const ablehnung = w.execute(s, { type: 'shipShuttle', owner: 'house',
      schiff: minerIds[0], ware: 'eis' });
    assert.equal(ablehnung.ok, false);
    assert.equal(w.canonical(s), vorher, 'fremder Eigentümer niemals verfügungsberechtigt');
  }
  for (const id of minerIds) {
    original({ type: 'shipShuttleStop', owner: 'npc3', schiff: id });
    original({ type: 'shipShuttle', owner: 'npc3', schiff: id, ware: 'eis' });
  }
  let vorAbsatz = wasserabsatz(s), hashK5 = null;
  for (let n = 0; n < minuten; n++) {
    w.minute(s);
    for (const id of minerIds) {
      const a = arbeit[id], aktuell = s.ships[id].ladung.eis || 0;
      if (aktuell > a.letzterLaderaum) a.gefuellt += aktuell - a.letzterLaderaum;
      a.letzterLaderaum = aktuell;
      if (a.gefuellt >= 50 && a.stopTick === null) {
        // Nur das bereits vorhandene Original-Pendel anhalten. Exakt wie K5.
        assert.equal(a.gefuellt, 50, 'keine über 50 hinaus gekaufte Testförderung');
        original({ type: 'shipShuttleStop', owner: 'npc3', schiff: id });
        a.stopTick = s.tick;
      }
    }
    if (wasserabsatz(s) > vorAbsatz) letzterAbsatz.tick = s.tick;
    vorAbsatz = wasserabsatz(s);
    maxOffen.eis = Math.max(maxOffen.eis, s.stations.st_aldera.lager.eis || 0);
    maxOffen.wasser = Math.max(maxOffen.wasser, s.stations.st_nadir.lager.wasser || 0);
    if (s.tick === 21865) hashK5 = w.hash(s);
    if (s.tick % 120 === 0 || n === minuten - 1) {
      pruefen(w, s);
      checkpoints.push({ tick: s.tick, hash: w.hash(s),
        delta: differenz(start, zaehler(s)), geld: geld(s) });
    }
  }
  const end = zaehler(s), delta = differenz(start, end), saldo = Object.fromEntries(
    Object.entries(s.owners).map(([id, a]) => [id, a.cash - (kasseVor[id] || 0)]));
  const stand = {
    seed, anzahl, minuten, tick: s.tick, startHash, hash: w.hash(s),
    k5Hash21865: hashK5, minerIds, arbeit: Object.fromEntries(Object.entries(arbeit)
      .map(([id, a]) => [id, { gefuellt: a.gefuellt, stopTick: a.stopTick }])),
    befehle, delta, letzterAbsatz, maxOffen, saldo,
    kassen: Object.fromEntries(Object.entries(s.owners).map(([id, a]) => [id, a.cash])),
    amEnde: { erz: s.stations.st_aldera.lager.erz || 0, material: s.stations.st_nadir.lager.material || 0,
      eis: s.stations.st_aldera.lager.eis || 0, wasser: s.stations.st_nadir.lager.wasser || 0,
      eisFrachtAktiv: !!s.w5n.frachtauftrag, wasserwerkAktiv: !!s.w5n.fabrikauftrag,
      bergbauAktiv: minerIds.filter(id => s.kanon.pendel[id] && !s.kanon.pendel[id].beenden),
      frachterAktiv: Object.values(s.ships).filter(sh => sh.klasse === 'frachter' && w.buchwert(s, sh.id) > 0).map(sh => sh.id),
    },
    geld: geld(s), minted: s.minted, burned: s.burned,
    audit: w.audit(s).ok,
    checkpoints,
  };
  assert.equal(stand.geld, 33000); assert.equal(stand.minted, 0); assert.equal(stand.burned, 0);
  assert.equal(stand.audit, true);
  assert.deepEqual(eigentuemer(s), eigentum, 'keine fremde Hülle oder Eigentumsübertragung');
  assert.ok(Object.values(arbeit).every(a => a.gefuellt <= 50), 'kein Miner über Testgrenze');
  assert.equal(delta.erz, 0, 'keine neuen Erzaufträge/Exporte nach K5');
  assert.equal(delta.material, 0, 'keine kostenlose Industrieproduktion');
  assert.equal(delta.minerBau, 0, 'keine kostenlose Minerfertigung');
  assert.equal(delta.frachter, 0, 'kein kostenloser Frachter');
  // Save und echte unabhängige 130-Minuten-Fortsetzung in beiden Kopien.
  const save = w.save(s), geladen = w.load(save);
  assert.equal(w.canonical(geladen), w.canonical(s));
  const fort = structuredClone(s);
  for (let n = 0; n < 130; n++) { w.minute(geladen); w.minute(fort); }
  pruefen(w, geladen); pruefen(w, fort);
  assert.equal(w.hash(geladen), w.hash(fort), 'deterministische Save-Fortsetzung');
  stand.replay = { minuten: 130, hash: w.hash(geladen) };
  return stand;
}

export function k6Vergleich(seed = 42, minuten = K6_MINUTEN) {
  const quelle = k6Start(seed);
  return { seed, k4TerminalHash: quelle.startHash,
    varianten: [0, 1, 2, 4].map(anzahl => k6Versuch(quelle, anzahl, minuten)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = Number(process.argv[2] || 42), minuten = Number(process.argv[3] || K6_MINUTEN);
  // Bewusst kompakte Standardausgabe, volle Prüfdaten können aus API importiert werden.
  const r = k6Vergleich(seed, minuten);
  console.log('K6_RESULT ' + JSON.stringify({ seed: r.seed, k4TerminalHash: r.k4TerminalHash,
    varianten: r.varianten.map(({ checkpoints, ...v }) => v) }));
}
