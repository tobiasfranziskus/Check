// K5: beobachtet unverändertes K4 und prüft genau eine zusätzliche 50-Eis-Kette.
// Keine Zustandsmutation außer Originalbefehlen; alle Messdaten bleiben außerhalb des Saves.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { vorbereiten, SZENARIEN } from './welt-szenarien.mjs';
import { nachrechnen } from './k3-frachter-diagnose.mjs';

export const K4_HEAD = '3030e14890d75dd5496b88b3f254e144dd702abd';
export const TERMINAL_TICK = 21612;
const sum = xs => xs.reduce((a, b) => a + b, 0);
const verkauf = s => s.kanon.wasser.verkauftNadir + s.kanon.wasser.verkauftAldera;
const zeit = tick => ({ tick, tag: Math.floor(tick / 1440) + 1,
  uhr: String(Math.floor(tick % 1440 / 60)).padStart(2, '0') + ':' + String(tick % 60).padStart(2, '0') });

export function pruefen(w, s) {
  const bilanz = nachrechnen(w, s);
  const sh = Object.values(s.ships);
  assert.equal(w.audit(s).ok, true, 'K5: Originalaudit');
  // Eigentümer der beweglichen Bestände direkt aus dem autoritativen Register.
  for (const x of sh) {
    assert.ok(s.owners[x.owner], 'K5: jeder Schiffseigentümer existiert');
    assert.ok(Object.values(x.ladung).every(n => Number.isSafeInteger(n) && n >= 0));
  }
  for (const x of Object.values(s.stations)) assert.ok(s.owners[x.id], 'K5: Stationslager hat Eigentümer');
  for (const klasse of ['miner', 'frachter']) {
    const l = s.ledger[klasse];
    assert.equal(sum(Object.values(s.stations).map(x => x.lager[klasse] || 0))
      + sum(sh.map(x => x.ladung[klasse] || 0)) + sh.filter(x => x.klasse === klasse).length,
    l.initial + l.produced + l.imported - l.exported, 'K5: alle Hüllen inkl. stillgelegter Körper');
  }
  return bilanz;
}

export function ablehnen(w, s, cmd) {
  const vor = w.canonical(s), r = w.execute(s, cmd);
  assert.equal(r.ok, false, 'K5: erwartete Ablehnung ' + JSON.stringify(cmd));
  assert.equal(w.canonical(s), vor, 'K5: Ablehnung muss den gesamten Zustand atomar erhalten');
  return { cmd, grund: r.reason };
}

export function moment(w, s) {
  const b = pruefen(w, s), bericht = w.bericht(s);
  return { ...zeit(s.tick), hash: w.hash(s), weltgeld: b.weltgeld, minted: s.minted, burned: s.burned,
    kassen: b.kassen, firmen: bericht.firmen, gebunden: bericht.gebunden,
    reserven: Object.fromEntries(Object.entries(s.owners).filter(([id, o]) =>
      o.cash > 0 && /treuhand|reserv|^k1_|^w5n_fracht|^w5n_fabrik|^erz_/.test(id)).map(([id, o]) => [id, o.cash])),
    waren: b.massen, lager: Object.fromEntries(Object.values(s.stations).map(st =>
      [st.id, { owner: st.id, waren: { ...st.lager } }])),
    schiffe: bericht.schiffe.map(sh => ({ ...sh, system: s.ships[sh.id].system,
      phase: s.ships[sh.id].phase, auftrag: s.ships[sh.id].auftrag, ware: s.ships[sh.id].ware,
      ort: s.ships[sh.id].flug.lage, anker: s.ships[sh.id].flug.anker,
      ladung: { ...s.ships[sh.id].ladung }, pendel: s.kanon.pendel[sh.id] || null })),
    offen: structuredClone({ queue: s.queue, erzBergbau: s.erzpilotVertraege, erzFracht: s.w3.auftrag,
      raffinerie: s.w4.auftrag, frachterBau: s.w5.auftrag, ueberfuehrung: s.w5ac.active,
      minerWerft: s.kanon.minerWerft, eisFracht: s.w5n.frachtauftrag,
      wasserwerk: s.w5n.fabrikauftrag, wasserRueckfracht: s.kanon.rueckfracht }),
    produktion: bericht.produktion, auftraege: bericht.auftraege, verkaeufe: bericht.verkaeufe,
    quotes: Object.fromEntries(bericht.schiffe.filter(sh => sh.klasse === 'frachter' && !sh.stillgelegt)
      .map(sh => [sh.id, { erz: w.kern.pilotW3Kalkulation(s, sh.id), eis: w.kern.pilotIceFreightQuote(s, sh.id) }])),
    erzMarkt: w.kern.pilotNpcKrisenLage(s), erzVertraege: w.kern.pilotAuftragsStand(s),
    raffinerie: w.kern.pilotW4Kalkulation(s), werft: w.kern.pilotW5Kalkulation(s),
    wasserwerk: w.kern.pilotWaterFactoryQuote(s) };
}

function zaehler(s) {
  return { erzFoerderung: s.ledger.erz.mined, export: s.ledger.erz.exported,
    erzLieferung: s.w3.geliefert, material: s.w4.materialErzeugt,
    materialVerbrauch: s.ledger.material.consumed, minerBeginn: s.kanon.minerWerft?.begonnen || 0,
    minerFertig: s.kanon.minerWerft?.fertig || 0, minerLieferung: s.kanon.minerWerft?.geliefert || 0,
    frachterKauf: s.w5.verkauft, eisFoerderung: s.w5n.eisAbgebaut, eisVerkauf: s.w5n.mineVerkauft,
    eisStart: s.w5n.frachtBeauftragt, eisLieferung: s.w5n.eisGeliefert,
    eisAbschluss: s.w5n.frachtAbgeschlossen, wasserProduktion: s.w5n.wasserProduziert,
    wasserVerkauf: verkauf(s) };
}

// Die zwei in K4 für beide Seeds belegten Aufträge werden exakt wiederholt.
// Tests vergleichen den vollen Welt-Hash mit laufenK4, nicht nur ausgewählte Zähler.
export function diagnoseK5(seed = 42, tage = 90) {
  if (![42, 7].includes(seed)) throw RangeError('K5: belegte Seeds 42 und 7');
  if (!Number.isSafeInteger(tage) || tage < 16 || tage > 90) throw RangeError('K5: 16–90 Tage');
  const { welt: w, state: s } = vorbereiten(SZENARIEN.find(x => x.id === 'S12'), seed);
  let vor = zaehler(s), terminalSave;
  const zuletzt = {}, ereignisse = [], checkpoints = {}, ablehnungen = [];
  const gesehen = new Set(); let letzteEngpaesse = {};
  for (let m = 0; m < tage * 1440; m++) {
    if ([599, 839].includes(s.tick)) {
      const frei = Object.values(s.ships).filter(sh => sh.owner === 'transport' && sh.klasse === 'frachter'
        && sh.phase === 'dock' && sh.system === 'aldera' && sh.auftrag === 'halten'
        && Object.values(sh.ladung).every(n => n === 0) && w.buchwert(s, sh.id) > 0).sort((a,b) => a.id.localeCompare(b.id))[0];
      assert.ok(frei);
      assert.equal(w.execute(s, { type: 'shipFreight', owner: 'transport', schiff: frei.id }).ok, true);
    }
    w.minute(s); nachrechnen(w, s);
    const jetzt = zaehler(s);
    for (const [key, value] of Object.entries(jetzt)) if (value > vor[key]) zuletzt[key] = { ...zeit(s.tick), wert: value };
    vor = jetzt;
    const arten = [];
    for (const sh of Object.values(s.ships)) if (w.buchwert(s, sh.id) === 0 && !gesehen.has(sh.id)) {
      gesehen.add(sh.id); arten.push('Stilllegung ' + sh.id);
    }
    if (s.owners.export.cash === 0 && !gesehen.has('export')) { gesehen.add('export'); arten.push('Exportetat leer'); }
    const engpaesse = s.kanon.engpass?.zaehler || {};
    if (s.ledger.material.consumed === 75) {
      for (const [grund, n] of Object.entries(engpaesse)) {
        if (n > (letzteEngpaesse[grund] || 0) && !gesehen.has(grund)
          && /Miner-Erzfracht|Ersatzminer house/.test(grund)) {
          gesehen.add(grund); arten.push(grund);
        }
      }
    }
    letzteEngpaesse = { ...engpaesse };
    if (arten.length) ereignisse.push({ arten, ...moment(w, s) });
    if ([2930, 3000, 16176, 16206, 16332, 18073, 19632, 20160, 21023, 21024, 21025, 21132, 21172, 21611, TERMINAL_TICK, 43200, 129600].includes(s.tick))
      checkpoints[s.tick] = moment(w, s);
    if (s.tick === TERMINAL_TICK) {
      terminalSave = w.save(s);
      const frachter = Object.values(s.ships).find(sh => sh.klasse === 'frachter' && w.buchwert(s, sh.id) > 0);
      for (const cmd of [
        { type: 'shipFreightIce', owner: frachter.owner, schiff: frachter.id },
        { type: 'shipFreight', owner: frachter.owner, schiff: frachter.id },
        { type: 'stationRefine', owner: 'st_nadir', station: 'st_nadir' },
        { type: 'stationBuildShip', owner: 'werft_extern', station: 'st_nadir' },
        { type: 'stationBuildMiner', owner: 'werft_extern', station: 'st_nadir', besteller: 'house' },
        { type: 'stationWater', owner: 'st_nadir', station: 'st_nadir' },
        { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' },
        { type: 'shipShuttle', owner: 'house', schiff: 'sh004', ware: 'eis' },
        { type: 'shipUndock', owner: 'house', schiff: 'sh018' },
      ]) ablehnungen.push(ablehnen(w, s, cmd));
    }
    if (s.tick % 1440 === 0) pruefen(w, s);
  }
  return { w, terminalSave, bericht: { basis: K4_HEAD, seed, tage, zuletzt, ereignisse,
    checkpoints, ablehnungen, ende: moment(w, s) } };
}

// Der Eingriff ist vorab auf 50 NEU gefördertes Eis begrenzt, dann Stop und Auslauf.
// Kein Transfer fremden Eigentums: npc3 nutzt seinen eigenen freien Miner und sein Geld.
export function gegenversuch(w, terminalSave) {
  const s = w.load(terminalSave), start = moment(w, s), c = w.rules.w5n;
  const miner = start.schiffe.find(sh => sh.owner === 'npc3' && sh.klasse === 'miner'
    && !sh.stillgelegt && sh.ort === 'angedockt' && Object.values(sh.ladung).every(n => n === 0));
  const frachter = start.schiffe.find(sh => sh.owner === 'transport' && sh.klasse === 'frachter'
    && !sh.stillgelegt && sh.phase === 'dock' && sh.system === 'aldera');
  // Konservatives Vollbudget inklusive höchstens 120 Flugminuten des Miners.
  // Die tatsächlichen Reserveabrufe und Löhne werden unten zusätzlich belegt.
  const budget = { miner: c.charge * c.mineLohn + 120 * w.daten.flug.lohnJeMinute,
    dockKauf: c.charge * c.eisPreis, kunde: c.charge * c.eisPreis + 2 * c.flugMinuten * c.frachtJeMinute
      + (c.charge / c.rezeptEis) * c.fabrikMinuten * c.fabrikLohn,
    spedition: 2 * c.flugMinuten * c.fliegerLohn,
    endkundenNadir: c.charge * c.wasserPreis };
  const haushalteNadir = Object.entries(w.daten.haushalte).filter(([, st]) => st === 'st_nadir')
    .reduce((n, [id]) => n + s.owners[id].cash, 0);
  const gedeckt = miner && frachter && s.owners.npc3.cash >= budget.miner
    && s.owners.st_aldera.cash >= budget.dockKauf && s.owners.st_nadir.cash >= budget.kunde
    && s.owners.transport.cash >= budget.spedition && haushalteNadir >= budget.endkundenNadir
    && miner.buchwert > 66 && frachter.buchwert > 36;
  if (!gedeckt) return { moeglich: false, budget, start, grund: 'Keine vollständig gedeckte Kette; kein Eingriff' };
  const befehle = [], phasen = [], replay = [], ereignisse = [], zukuenftigeHashes = new Map();
  const befehl = cmd => {
    const r = w.execute(s, cmd); assert.equal(r.ok, true, r.reason);
    befehle.push({ tick: s.tick, cmd }); pruefen(w, s);
  };
  befehl({ type: 'shipShuttleStop', owner: miner.owner, schiff: miner.id });
  befehl({ type: 'shipShuttle', owner: miner.owner, schiff: miner.id, ware: 'eis' });
  const basis = zaehler(s), schiffsEigentum = Object.fromEntries(Object.values(s.ships).map(sh => [sh.id, sh.owner]));
  let gestoppt = false, fertig = false, vorher = basis;
  const gates = new Set();
  for (let n = 0; n < 600; n++) {
    w.minute(s); pruefen(w, s);
    const neu = s.w5n.eisAbgebaut - basis.eisFoerderung;
    assert.ok(neu <= c.charge, 'K5: Experiment bleibt auf eine neue Charge begrenzt');
    if (!gestoppt && neu === c.charge) {
      befehl({ type: 'shipShuttleStop', owner: miner.owner, schiff: miner.id }); gestoppt = true;
    }
    for (const hash of zukuenftigeHashes.get(s.tick) || []) assert.equal(w.hash(s), hash, 'K5: echter Hauptlauf entspricht Save-Fortsetzung');
    const jetzt = zaehler(s);
    for (const key of ['eisVerkauf', 'eisStart', 'eisLieferung', 'eisAbschluss', 'wasserProduktion', 'wasserVerkauf'])
      if (jetzt[key] > vorher[key]) ereignisse.push({ tick: s.tick, art: key, delta: jetzt[key] - basis[key] });
    vorher = jetzt;
    let art;
    if (s.kanon.flugdienst[miner.id] && !gestoppt) art = 'minerflug';
    if (s.w5n.frachtauftrag?.gearbeitet === 30) art = 'eisfracht';
    if (s.w5n.fabrikauftrag?.gearbeitet === 10) art = 'wasserwerk';
    if (art && !gates.has(art)) {
      gates.add(art); phasen.push({ art, ...moment(w, s) });
      const a = w.load(w.save(s));
      assert.equal(w.canonical(a), w.canonical(s));
      // Save-Fortsetzung gegen ungespeicherte Kopie UND den späteren Hauptlauf.
      // Beide führen dieselbe auf 50 Eis begrenzte Stop-Entscheidung aus.
      const b = structuredClone(s);
      for (let m = 0; m < 130; m++) {
        for (const x of [a, b]) {
          w.minute(x);
          if (x.w5n.eisAbgebaut - basis.eisFoerderung === c.charge
            && x.kanon.pendel[miner.id] && !x.kanon.pendel[miner.id].beenden)
            assert.equal(w.execute(x, { type: 'shipShuttleStop', owner: miner.owner, schiff: miner.id }).ok, true);
          pruefen(w, x);
        }
        assert.equal(w.canonical(a), w.canonical(b));
        const liste = zukuenftigeHashes.get(a.tick) || [];
        liste.push(w.hash(a)); zukuenftigeHashes.set(a.tick, liste);
      }
      replay.push({ art, tick: s.tick, minuten: 130, hash: w.hash(a) });
    }
    if (gestoppt && verkauf(s) - basis.wasserVerkauf === c.charge && !s.w5n.frachtauftrag
      && !s.w5n.fabrikauftrag && !s.kanon.pendel[miner.id]) { fertig = true; break; }
  }
  assert.equal(fertig, true, 'K5: vollständiger bezahlter Endabsatz innerhalb der Grenze');
  assert.deepEqual(Object.fromEntries(Object.values(s.ships).map(sh => [sh.id, sh.owner])), schiffsEigentum);
  const ende = moment(w, s);
  const delta = Object.fromEntries(Object.entries(zaehler(s)).map(([k, v]) => [k, v - basis[k]]));
  assert.equal(delta.eisFoerderung, 50); assert.equal(delta.eisLieferung, 50);
  assert.equal(delta.wasserProduktion, 50); assert.equal(delta.wasserVerkauf, 50);
  assert.equal(delta.eisAbschluss, 1); assert.equal(ende.gebunden, 0);
  const kontenDelta = Object.fromEntries(Object.keys(s.owners).map(id => [id, s.owners[id].cash - (start.kassen[id] || 0)]));
  return { moeglich: true, budget, haushalteNadir, miner: miner.id, frachter: frachter.id,
    befehle, phasen, replay, ereignisse, start, ende, delta, kontenDelta,
    minerArbeit: { foerderlohn: delta.eisFoerderung * c.mineLohn,
      fluglohn: sum(Object.entries(s.kanon.buch.summen).filter(([key]) => key.startsWith('fluglohn|k1_flug_' + miner.id + '|')).map(([, v]) => v))
        - sum(Object.entries(w.load(terminalSave).kanon.buch.summen).filter(([key]) => key.startsWith('fluglohn|k1_flug_' + miner.id + '|')).map(([, v]) => v)) } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { w, terminalSave, bericht } = diagnoseK5(Number(process.argv[2] || 42), Number(process.argv[3] || 90));
  console.log(JSON.stringify({ ...bericht, gegenversuch: gegenversuch(w, terminalSave) }, null, 2));
}
