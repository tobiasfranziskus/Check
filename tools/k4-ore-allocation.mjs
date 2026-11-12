// K4-Forschung: vorhandene Erzware vor dem stündlichen Außenexport per Original-W3-Auftrag binden.
// Kein Core-Patch, keine neue Ware, kein zusätzliches Kapital und keine Preis-/Regeländerung.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { vorbereiten, SZENARIEN } from './welt-szenarien.mjs';
import { nachrechnen } from './k3-frachter-diagnose.mjs';

const S12 = SZENARIEN.find((x) => x.id === 'S12');
if (!S12) throw new Error('K4: S12 fehlt');

function freieFrachter(welt, state) {
  return Object.values(state.ships)
    .filter((sh) => sh.owner === 'transport' && sh.klasse === 'frachter'
      && sh.phase === 'dock' && sh.system === 'aldera' && sh.auftrag === 'halten'
      && Object.values(sh.ladung).every((n) => n === 0)
      && welt.buchwert(state, sh.id) > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function bilanz(welt, state, seed, modus, orders, ablehnungen, saveReplay) {
  const k = Object.values(state.owners).reduce((n, o) => n + o.cash, 0);
  const audit = welt.audit(state);
  const massen = nachrechnen(welt, state);
  return {
    seed, modus, tick: state.tick, hash: welt.hash(state),
    weltgeld: k, minted: state.minted, burned: state.burned,
    audit: audit.ok, auditFehler: audit.fehler || [],
    kassen: massen.kassen, nullsaldo: massen.nullsaldo,
    erz: {
      gefoerdert: state.ledger.erz.mined,
      exportiert: state.ledger.erz.exported,
      inAldera: state.stations.st_aldera.lager.erz || 0,
      inNadir: state.stations.st_nadir.lager.erz || 0,
      nachNadirGeliefert: state.w3.geliefert,
      frachtenBeauftragt: state.w3.beauftragt,
      frachtenAbgeschlossen: state.w3.abgeschlossen,
    },
    material: {
      erzeugt: state.w4.materialErzeugt,
      vorhanden: massen.massen.material.vorhanden,
      frachterGebaut: state.w5.fertig,
      frachterVerkauft: state.w5.verkauft,
      minerGebaut: state.kanon.minerWerft?.fertig || 0,
      minerGeliefert: state.kanon.minerWerft?.geliefert || 0,
    },
    wasser: {
      erzeugt: state.w5n.wasserProduziert,
      verkauftNadir: state.kanon.wasser.verkauftNadir,
      verkauftAldera: state.kanon.wasser.verkauftAldera,
      letzterAbsatzTick: state.k4LetzterWasserAbsatzTick ?? null,
    },
    frachter: Object.values(state.ships).filter((sh) => sh.klasse === 'frachter')
      .map((sh) => ({ id: sh.id, phase: sh.phase, system: sh.system,
        stillgelegt: welt.buchwert(state, sh.id) === 0,
        aktivMinuten: state.kanon.verschleiss[sh.id] || 0 })),
    manuelleW3Auftraege: orders,
    quoteAblehnungen: ablehnungen,
    saveReplay,
  };
}

// maxManuelleAuftraege=0 ist die unveränderte S12-Automatik.
// Die Forschungsvariante bindet bis zu zwei zusätzliche 50-Erz-Chargen ausschließlich
// unmittelbar vor einem bestehenden Stunden-/Exporttick und nur über den gültigen Originalbefehl.
export function laufenK4(seed = 42, maxManuelleAuftraege = 0, tage = 14) {
  if (!Number.isSafeInteger(maxManuelleAuftraege) || maxManuelleAuftraege < 0 || maxManuelleAuftraege > 2)
    throw new RangeError('K4: höchstens zwei zusätzliche Testaufträge');
  if (!Number.isSafeInteger(tage) || tage < 1 || tage > 90) throw new RangeError('K4: Tage außerhalb 1–90');
  const { welt, state } = vorbereiten(S12, seed);
  const orders = [], ablehnungen = {};
  let saveReplay = null, letzterWasserabsatz = 0, letzterWasserabsatzTick = null;
  const minuten = tage * 1440;

  for (let i = 0; i < minuten; i++) {
    // Direkt vor Tick 60/120/... ist der letzte sichere Zeitpunkt, an dem eine bereits
    // physisch gelagerte Charge vor dem nächsten stündlichen Export reserviert werden kann.
    if (maxManuelleAuftraege > orders.length && state.tick % 60 === 59
      && !state.w3.auftrag && !state.w5n.frachtauftrag
      && (state.stations.st_aldera.lager.erz || 0) >= 50) {
      const ship = freieFrachter(welt, state)[0];
      if (ship) {
        const quote = welt.kern.pilotW3Kalkulation(state, ship.id);
        if (quote.ok) {
          const result = welt.execute(state, { type: 'shipFreight', owner: 'transport', schiff: ship.id });
          assert.equal(result.ok, true, 'K4: gültige W3-Kalkulation muss Originalauftrag akzeptieren: ' + (result.reason || ''));
          assert.ok(welt.audit(state).ok, 'K4: Audit direkt nach Original-W3-Auftrag');
          const event = { tick: state.tick, ship: ship.id,
            erzVorhanden: state.stations.st_aldera.lager.erz,
            nadirVorher: state.owners.st_nadir.cash,
            transportVorher: state.owners.transport.cash,
            preis: quote.erzWert, flugarbeit: quote.arbeitsKosten, frachtgebuehr: quote.frachtGebuehr };
          orders.push(event);

          // Ein Save mitten im echten, vorfinanzierten Hinflug muss zwei bitgleiche Fortsetzungen erlauben.
          if (!saveReplay) {
            const a = welt.load(welt.save(state));
            const b = welt.load(welt.save(state));
            for (let n = 0; n < 130; n++) {
              welt.minute(a); welt.minute(b);
              nachrechnen(welt, a);
              assert.equal(welt.hash(a), welt.hash(b), 'K4: Save/Load-Fortsetzung muss deterministisch sein');
              assert.equal(welt.audit(a).ok, true, 'K4: Audit nach Save/Load-Fortsetzung');
            }
            saveReplay = { startTick: state.tick, fortsetzungsminuten: 130, hash: welt.hash(a) };
          }
        } else {
          const key = quote.grund || 'unbekannter W3-Grund';
          ablehnungen[key] = (ablehnungen[key] || 0) + 1;
        }
      }
    }

    welt.minute(state);
    nachrechnen(welt, state);
    const verkauft = state.kanon.wasser.verkauftNadir + state.kanon.wasser.verkauftAldera;
    if (verkauft > letzterWasserabsatz) {
      letzterWasserabsatz = verkauft;
      state.k4LetzterWasserAbsatzTick = state.tick;
    }
    if (state.tick % 1440 === 0) assert.equal(welt.audit(state).ok, true, 'K4: Tagesaudit Tag ' + (state.tick / 1440));
  }

  const result = bilanz(welt, state, seed, maxManuelleAuftraege ? 'vor-export' : 'basis',
    orders, ablehnungen, saveReplay);
  assert.equal(result.weltgeld, 33000, 'K4: Weltgeld muss erhalten bleiben');
  assert.equal(result.minted, 0, 'K4: keine ISK-Emission');
  assert.equal(result.burned, 0, 'K4: keine ISK-Senke');
  assert.equal(result.audit, true, 'K4: vollständiges K1/K2/K3-Audit');
  assert.equal(result.nullsaldo, 0, 'K4: K1-Transfers müssen Nullsaldo halten');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = Number(process.argv[2] || 42);
  const tage = Number(process.argv[3] || 14);
  console.log(JSON.stringify({
    basis: laufenK4(seed, 0, tage),
    vorExport: laufenK4(seed, 2, tage),
  }, null, 2));
}
