// Kanonische Welt K1: geschlossener Vertikalschnitt, wirtschaftlich unterschiedliche
// 90-Tage-Szenarien, 365-Tage-Krisen und 730-Tage-Grenzfälle. Ein Szenario gilt nur dann
// als „läuft“, wenn in den letzten sieben Tagen real gefördert, geliefert, produziert,
// bezahlt und verbraucht wurde – ein gleicher Hash allein beweist keine Tragfähigkeit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SZENARIEN, ausfuehren, vorbereiten } from '../tools/welt-szenarien.mjs';

const kurz = ({ reihe, gruendung, schiffe, ...r }) => r;
function grundpruefung(r) {
  assert.equal(r.weltgeld, 33000, r.id + ': Weltgeld konstant');
  assert.equal(r.emission, 0, r.id + ': keine Emission');
  assert.equal(r.senke, 0, r.id + ': keine Senke');
  // Jede verkaufte Einheit wurde produziert, jede produzierte aus real geliefertem Eis.
  const verkauft = r.verkaeufe.wasserNadir + r.verkaeufe.wasserAldera;
  assert.equal(r.produktion.wasserProduziert, verkauft + r.inventar.wasserNadir + r.inventar.wasserAldera
    + r.inventar.wasserUnterwegs, r.id + ': Wasserherkunft (verkauft + Lager + an Bord)');
  assert.equal(r.produktion.wasserProduziert + r.inventar.eisNadir, r.auftraege.eisGeliefert, r.id + ': Wasser nur aus real geliefertem Eis');
  assert.ok(r.auftraege.eisGeliefert <= r.verkaeufe.eisAnAldera, r.id + ': Fracht nur aus am Dock verkauftem Eis');
  assert.ok(r.auftraege.eisfrachten * 50 <= r.auftraege.eisGeliefert, r.id + ': abgeschlossene Rundfrachten haben geliefert');
  assert.ok(r.verkaeufe.eisAnAldera <= r.produktion.eisGefoerdert, r.id + ': Eis nur aus Förderung');
  assert.equal(r.verkaeufe.wasserErloes, r.verkaeufe.wasserNadir * 14 + r.verkaeufe.wasserAldera * 16, r.id + ': Erlös = bezahlte Menge');
  for (const [firma, kasse] of Object.entries(r.kassen)) assert.ok(kasse >= 0, r.id + ': Kasse ' + firma);
}

test('K1-Vertikalschnitt: Förderung → Dockverkauf → Fracht → Wasserwerk → Löhne → Endabsatz → Folgeproduktion', () => {
  const lauf = vorbereiten(SZENARIEN.find((s) => s.id === 'S01'));
  const { welt, state } = lauf;
  assert.ok(lauf.protokoll.every((p) => p.ok), 'Gründung nur über angenommene Befehle');
  welt.advance(state, 9 * 1440);
  const a = welt.bericht(state), kontenA = Object.fromEntries(Object.entries(state.owners).map(([id, o]) => [id, o.cash]));
  const summenA = { ...state.kanon.buch.summen };
  welt.advance(state, 1440);
  const b = welt.bericht(state);
  assert.equal(welt.audit(state).ok, true);
  const d = (pfad) => pfad.split('.').reduce((o, k) => o[k], b) - pfad.split('.').reduce((o, k) => o[k], a);
  const buch = (art) => Object.keys(state.kanon.buch.summen).filter((k) => k.startsWith(art + '|'))
    .reduce((n, k) => n + state.kanon.buch.summen[k] - (summenA[k] || 0), 0);
  // Ein eingeschwungener Spieltag: 12 vollständige, real bezahlte Kreisläufe.
  assert.equal(d('auftraege.eisfrachten'), 12);
  assert.equal(d('produktion.eisGefoerdert'), 600); assert.equal(d('verkaeufe.eisAnAldera'), 600);
  assert.equal(d('produktion.wasserProduziert'), 600); assert.equal(d('auftraege.wasserchargen'), 60);
  const verkauft = d('verkaeufe.wasserNadir') + d('verkaeufe.wasserAldera');
  assert.ok(verkauft >= 560 && verkauft <= 640, 'Endabsatz folgt der Produktion: ' + verkauft);
  // Arbeitseinkommen: jede Minute hat einen benannten Zahler.
  assert.equal(d('loehne.bergbau'), 1200, 'Förderlohn 2 ISK je Minute im Feld (Zahler: Minereigner)');
  assert.equal(d('loehne.frachtpiloten'), 1440, '120 Flugminuten je Rundfracht (Zahler: Spedition)');
  assert.equal(d('loehne.wasserwerk'), 1200, '20 Arbeitsminuten je Charge (Zahler: Nadir)');
  assert.ok(d('loehne.minerflug') >= 200, 'Flugminuten des Miners (Zahler: Minereigner)');
  // Folgefinanzierung: Nadirs Ausgaben des Tages sind vollständig durch echte Wasserverkäufe gedeckt.
  const nadirAusgaben = 12 * 490 + 60 * 20;
  const nadirEinnahmen = d('verkaeufe.wasserNadir') * 14 + buch('wasser-grosshandel');
  assert.ok(nadirEinnahmen >= nadirAusgaben, 'Erlös ' + nadirEinnahmen + ' deckt Folgeproduktion ' + nadirAusgaben);
  assert.ok(state.owners.st_nadir.cash >= 490, 'nächste Eisfracht bleibt bezahlbar');
  // Rückweg ist bezahlt und trägt reale Ware; Aldera zahlt Ware und Rückfracht selbst.
  assert.ok(buch('rueckfracht') > 0, 'Spedition erhält die Rückfrachtgebühr erst nach Entladung in Aldera');
  assert.equal(buch('rueckfracht-reserve') - buch('rueckfracht'), state.owners.k1_rueckfracht.cash - kontenA.k1_rueckfracht);
  assert.equal(buch('wasser-grosshandel'), (d('auftraege.rueckfrachtWasser') + d('inventar.wasserUnterwegs')) * 14);
  // Kein Konto wird gerettet: Summe aller Kassenänderungen des Tages ist null.
  const delta = Object.entries(state.owners).reduce((n, [id, o]) => n + o.cash - (kontenA[id] ?? 0), 0);
  assert.equal(delta, 0); assert.equal(b.weltgeld, 33000); assert.equal(b.minted, 0);
  // Ersatzbedarf in der Kapitalrechnung: Abschreibung bleibt als Rücklage in der Firma.
  for (const f of ['house', 'transport']) {
    assert.ok(b.firmen[f].ruecklage > 0, f + ' bildet Ersatzrücklage');
    assert.ok(b.firmen[f].kasse >= b.firmen[f].ruecklage, f + ' hält die Rücklage in eigener Kasse');
  }
  console.log('K1_VERTIKALSCHNITT ' + JSON.stringify({ tag: b.tag, wasserVerkauft: verkauft, nadirEinnahmen, nadirAusgaben,
    loehne: { bergbau: d('loehne.bergbau'), frachtpiloten: d('loehne.frachtpiloten'), wasserwerk: d('loehne.wasserwerk'), minerflug: d('loehne.minerflug') },
    dividenden: d('dividenden'), ruecklagen: { house: b.firmen.house.ruecklage, transport: b.firmen.transport.ruecklage }, hash: welt.hash(state) }));
});

// Erwartung je Szenario: true = läuft am Ende; [von, bis] = letzter Wasserverkauf in diesem Tagesfenster.
const ERWARTUNG = {
  S01: true, S02: [8, 40], S03: [1, 10], S04: [3, 25], S05: [2, 15], S06: [1, 10], S07: true, S08: [0, 0],
  S09: true, S10: true, S11: true, S12: [2, 12], S13: true, S14: true, S15: [1, 6],
};
const ergebnisse90 = new Map();
for (const s of SZENARIEN) {
  test('K1 90 Tage ' + s.id + ': ' + s.titel, () => {
    const r = ausfuehren(s.id, 90);
    ergebnisse90.set(s.id, r);
    grundpruefung(r);
    const e = ERWARTUNG[s.id];
    if (e === true) {
      assert.equal(r.laeuftAmEnde, true, s.id + ' muss am Ende real produzieren und verkaufen');
      assert.equal(r.letzterWasserverkaufTag, 90);
      assert.deepEqual(r.handlungsunfaehig, []);
    } else {
      assert.equal(r.laeuftAmEnde, false, s.id + ' ist ein Gegenbeispiel und darf nicht verdeckt stabilisiert werden');
      assert.ok(r.letzterWasserverkaufTag >= e[0] && r.letzterWasserverkaufTag <= e[1], s.id + ' Stillstand Tag ' + r.letzterWasserverkaufTag);
      assert.ok(r.bindenderEngpass, s.id + ': Engpassursache benannt');
    }
    console.log('K1_SZENARIO_90 ' + JSON.stringify(kurz(r)));
  });
}

test('K1 90 Tage: mindestens 13 wirtschaftlich unterschiedliche Szenarien, nicht nur andere Startwerte', () => {
  assert.equal(ergebnisse90.size, SZENARIEN.length);
  assert.ok(SZENARIEN.length >= 13);
  // Unterschiedliche Eingangsbedingungen ...
  const eingaben = new Set(SZENARIEN.map((s) => JSON.stringify([s.kapital || {}, s.politik || {}, s.ereignisse || []])));
  assert.equal(eingaben.size, SZENARIEN.length);
  // ... und tatsächlich unterschiedliche Geldflüsse bei gleichem Startwert 42.
  const fluss = new Set([...ergebnisse90.values()].map((r) => JSON.stringify([r.kassen, r.kaeuferliquiditaet, r.verkaeufe, r.loehne, r.dividenden])));
  assert.equal(fluss.size, SZENARIEN.length);
  assert.equal(new Set([...ergebnisse90.values()].map((r) => r.hash)).size, SZENARIEN.length);
  // Wiederholbarkeit: gleiche Eingaben ergeben denselben Hash.
  assert.equal(ausfuehren('S07', 20).hash, ausfuehren('S07', 20).hash);
  // Ein anderer Startwert ändert die Wirtschaft dieser Welt nicht: der Unterschied zwischen
  // Szenarien stammt aus den Bedingungen, nicht aus dem Zufall.
  const a = ausfuehren('S03', 20, 42), b = ausfuehren('S03', 20, 7);
  assert.deepEqual([a.kassen, a.verkaeufe, a.loehne], [b.kassen, b.verkaeufe, b.loehne]);
  assert.notEqual(a.hash, b.hash);
});

test('K1 Gegenbeispiele: Sparen entzieht dem Kreislauf genau das gehortete Geld – keine verdeckte Stabilisierung', () => {
  const s02 = ergebnisse90.get('S02'), s03 = ergebnisse90.get('S03'), s05 = ergebnisse90.get('S05');
  // Spieler spart: sein Konzern und seine Privatkonten halten am Ende den Großteil des umlaufenden Geldes.
  assert.ok(s02.kassen.house + s02.spielerPrivat > 15000, 'Hort des Spielers: ' + (s02.kassen.house + s02.spielerPrivat));
  assert.equal(s02.dividenden > 0, true, 'NPC-Firmen schütten weiter aus – es hilft nicht');
  const uebrige = s02.kaeuferliquiditaet.haushalte - s02.spielerPrivat;
  assert.ok(uebrige < 3000, 'übrige Haushalte ohne Kaufkraft: ' + uebrige);
  // Alle Firmen thesaurieren: Haushalte haben nur Löhne, Dividenden sind null.
  assert.equal(s03.dividenden, 0);
  // Haushalte sparen 60 %: ihr Geld liegt still, obwohl Wasser vorhanden wäre.
  assert.ok(s05.kaeuferliquiditaet.haushalte > 15000);
  assert.ok(s05.inventar.wasserNadir > 0, 'unverkauftes Wasser bleibt liegen');
  for (const r of [s02, s03, s05]) {
    assert.equal(r.weltgeld, 33000); assert.equal(r.emission, 0);
    assert.equal(r.wasserJeTagLetzte7, 0); assert.equal(r.frachtenJeTagLetzte7, 0);
  }
});

test('K1 Gegenbeispiele: fehlendes Kapital, fehlende Nachfolge und nicht herstellbare Miner', () => {
  const s08 = ergebnisse90.get('S08'), s12 = ergebnisse90.get('S12'), s13 = ergebnisse90.get('S13');
  // Spedition kann die Flugarbeit nie vorfinanzieren; niemand darf oder kann sie ersetzen.
  assert.equal(s08.auftraege.eisfrachten, 0);
  assert.match(s08.handlungsunfaehig.join(), /transport: 10 ISK < 120 ISK/);
  assert.equal(s08.bindenderEngpass, 'Spedition kann Flugarbeit nicht vorfinanzieren');
  // Verschleiß: Frachter wird aus echter Produktion ersetzt, Miner nur aus dem endlichen Gründungslager.
  assert.ok(s12.frachterGebaut >= 1 && s12.ersatzkaeufe >= 2);
  assert.equal(s12.inventar.minerLager, 0, 'Gründungslager erschöpft');
  assert.match(s12.handlungsunfaehig.join(), /kein einsatzfähiger Miner/);
  // Schiffverlust: Ersatz aus Erz → Material → Werfthülle, aus eigener Kasse gekauft und bezahlt überführt.
  assert.equal(s13.ersatzkaeufe, 1); assert.ok(s13.frachterGebaut >= 1); assert.ok(s13.auftraege.erzfrachten >= 1);
  assert.equal(s13.produktion.materialErzeugt % 5, 0); assert.ok(s13.produktion.materialErzeugt >= 5);
});

const ergebnisse365 = new Map();
// S09 läuft 90 Tage und verklemmt erst im Langlauf: bei gesättigter Nachfrage hängt Alderas
// Wasserversorgung an Nadirs Eisbedarf, und eine reine Wasserfahrt wäre ein Verlustgeschäft.
for (const [id, erwartetLaeuft] of [['S01', true], ['S02', false], ['S05', false], ['S09', false], ['S12', false]]) {
  test('K1 365 Tage ' + id + ': ' + SZENARIEN.find((s) => s.id === id).titel, () => {
    const r = ausfuehren(id, 365);
    ergebnisse365.set(id, r);
    grundpruefung(r);
    assert.equal(r.laeuftAmEnde, erwartetLaeuft);
    const r90 = ergebnisse90.get(id);
    if (id === 'S09') {
      assert.ok(r.letzterWasserverkaufTag > 90 && r.letzterWasserverkaufTag < 365, 'Stillstand erst nach Tag 90: ' + r.letzterWasserverkaufTag);
      assert.equal(r.bindenderEngpass, 'Eislager Nadir voll');
      assert.ok(r.kaeuferliquiditaet.haushalte > 15000 && r.inventar.wasserNadir > 0, 'Kaufkraft und Ware vorhanden, aber am falschen Ort');
      assert.deepEqual(r.handlungsunfaehig, [], 'keine Firma ist zahlungsunfähig');
    } else if (!erwartetLaeuft && r90) {
      // Ein Stillstand heilt sich nicht von selbst: kein später Geldzufluss, keine Rettung.
      assert.equal(r.letzterWasserverkaufTag, r90.letzterWasserverkaufTag);
      assert.deepEqual(r.verkaeufe, r90.verkaeufe); assert.deepEqual(r.kassen, r90.kassen);
    }
    console.log('K1_SZENARIO_365 ' + JSON.stringify(kurz(r)));
  });
}

for (const [id, erwartetLaeuft] of [['S01', true], ['S04', false]]) {
  test('K1 730 Tage Grenzfall ' + id + ': ' + SZENARIEN.find((s) => s.id === id).titel, () => {
    const r = ausfuehren(id, 730);
    grundpruefung(r);
    assert.equal(r.laeuftAmEnde, erwartetLaeuft);
    if (id === 'S01') {
      // Stationär: gleiche Tagesleistung, gleiche Firmenkassen wie nach 90 und 365 Tagen.
      const r90 = ergebnisse90.get(id), r365 = ergebnisse365.get(id);
      assert.equal(r.wasserJeTagLetzte7, 600); assert.equal(r.frachtenJeTagLetzte7, 12);
      if (r90) assert.deepEqual(r.kassen, r90.kassen);
      if (r365) assert.deepEqual(r.kassen, r365.kassen);
      assert.equal(r.auftraege.eisfrachten > 8500, true);
    }
    console.log('K1_SZENARIO_730 ' + JSON.stringify(kurz(r)));
  });
}
