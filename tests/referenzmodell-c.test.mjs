// Referenzmodell C (PR #245) unabhängig nachgerechnet und der implementierten Welt gegenübergestellt.
// Das Modell ist Entwurfsziel, keine Behauptung über die Simulation: der zweite Test hält die
// tatsächlichen Abweichungen der ausgeführten Regel195-/K1-Welt als Fakten fest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { berechne, kostentabelle, emissionFuerSparquote, maxSparquote, reichweiteTage, WAREN } from '../tools/referenzmodell-c.mjs';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const nah = (ist, soll, text, eps = 5e-7) => assert.ok(Math.abs(ist - soll) <= eps, text + ': ' + ist + ' statt ' + soll);

test('Referenzmodell C: veröffentlichte Tageswerte, Mengen und Kontrollen werden exakt reproduziert', () => {
  const r = berechne();
  nah(r.konsum, 286.40, 'privater Endverbrauch'); nah(r.loehne, 299.029311, 'Löhne');
  nah(r.buchgewinn, 227.370689, 'Buchgewinn'); nah(r.ersatz, 91.603008, 'Ersatz');
  nah(r.kapitalanspruch, 15.898573, 'Kapitalanspruch'); nah(r.umsatz, 1872.741846, 'Gesamtumsatz');
  nah(r.ausfuehrungscash, 1553.768149, 'Ausführungscash');
  nah(r.loehne + r.buchgewinn, r.konsum + r.export, 'Wertschöpfung = Endnachfrage', 1e-9);
  assert.ok(r.residuum < 1e-12 && r.minNegativ >= 0);
  const mengen = { Erz: 11.748067, Eis: 14, Kristall: 0.2, Silizium: 1.281564, Material: 4.699227, Bauteil: 1.281564,
    Wasser: 10, Nahrung: 2, Medizin: 0.2, Lager: 0.055638, Bergbau: 0.044904, Fabrik: 0.066861, Dock: 0.026857,
    Werft: 0.021094, Verteidigung: 0.035864, Miner: 0.037421, Frachter: 0.037242, Jaeger: 0.0212, Bauschiff: 0.00633,
    Service: 1.284214, Schutz: 0.154285, Fracht: 0.771426 };
  for (const [ware, soll] of Object.entries(mengen)) nah(r.mengen[ware], soll, ware);
  const k = kostentabelle();
  assert.equal(Object.keys(k).length, 29);
  for (const [name, z] of Object.entries(k)) assert.ok(z.G > 0, name + ' hat positive Vollkostenmarge');
  nah(k.Material.vollkosten, 43.125, 'Material'); nah(k.Bauteil.vollkosten, 151, 'Bauteil');
  nah(k.Wasser.vollkosten, 14.1, 'Wasser'); nah(k.Frachter.vollkosten, 1469.8, 'Frachter'); nah(k.Fracht.vollkosten, 246, 'Fracht');
  // 730-Tage-Rohstoffbedarf der vollständigen Kette.
  nah(r.mengen.Erz * 730, 8576.09, 'Erz 730 Tage', 0.01); nah(r.mengen.Silizium * 730, 935.54, 'Silizium 730 Tage', 0.01);
});

test('Referenzmodell C: Sparfreiheit hat eine berechenbare Grenze; ein endlicher Etat trägt nicht dauerhaft', () => {
  assert.equal(emissionFuerSparquote(0), 0);
  nah(emissionFuerSparquote(0.08), 24.904348, '8 %'); nah(emissionFuerSparquote(0.3), 122.742857, '30 %');
  nah(emissionFuerSparquote(0.6), 429.6, '60 %'); nah(emissionFuerSparquote(0.9), 2577.6, '90 %');
  nah(maxSparquote(400), 0.582751, 'Grenze bei 400 ISK/Tag');
  nah(reichweiteTage(7000, 240), 29.1667, 'einmalige 7.000 ISK', 1e-3);
  // Ohne Außenabnahme und ohne Sparen schließt der Kreis monetär; Ersatz bleibt nötig.
  const ohne = berechne({ exportISK: 0 });
  nah(ohne.loehne + ohne.buchgewinn, ohne.konsum, 'geschlossener Binnenkreis', 1e-9);
  assert.ok(ohne.ersatz > 0 && ohne.mengen.Frachter > 0, 'Ersatz muss physisch produziert werden');
});

test('Vergleich: die ausgeführte Welt weicht vom Referenzmodell in benannten, geprüften Punkten ab', () => {
  const w = Welt.erstellen({}), r = w.rules, s = w.createState(42);
  // Geldmenge und Geografie: 33.000 ISK in zwei Systemen statt 55.000 ISK in sieben.
  assert.equal(s.initialSupply, 33000);
  assert.deepEqual(Object.keys(r.world.systems).sort(), ['aldera', 'nadir']);
  // Sechs statt 19 Grundwaren; Silizium, Kristall, Bauteile, Nahrung, Medizin und Module fehlen.
  assert.deepEqual(Object.keys(r.economy.waren).sort(), ['eis', 'erz', 'frachter', 'material', 'miner', 'wasser']);
  assert.equal(Object.keys(WAREN).filter((x) => !/MK/.test(x)).length, 19);
  // Preise und Rezepte der Regel195-Welt (links) gegen das Modell (rechts).
  assert.equal(r.economy.waren.erz.basis, WAREN.Erz.preis);            // 10 = 10
  assert.equal(r.w5n.eisPreis, WAREN.Eis.preis);                       // 5 = 5
  assert.equal(r.w5n.wasserPreis, 14); assert.equal(WAREN.Wasser.preis, 16);
  assert.equal(r.economy.waren.frachter.basis, 750); assert.equal(WAREN.Frachter.preis, 1690);
  assert.equal(r.economy.waren.miner.basis, 600); assert.equal(WAREN.Miner.preis, 1340);
  assert.deepEqual([r.w4.erzJeCharge, r.w4.materialJeCharge], [10, 5]);  // Modell: 10 Erz → 4 Material
  assert.deepEqual([r.w5.material, r.w5.materialPreis], [5, 100]);       // Modell: Frachter aus 8 Bauteilen
  assert.equal(2 * 60 * r.w5n.frachtJeMinute, 240);                      // Modell: 270 je Rundlos inkl. Schutz
  assert.equal(r.w5n.mineLohn, 2); assert.equal(r.economy.miningRate, 1); // 2 ISK je Eis; Modell: 2 Minuten je Eis zu 1 ISK
  // Außenabnahme: endlicher, vorab vorhandener Erz-Etat statt erneuerbarer Emission gegen Industriegüter.
  assert.equal(s.owners.export.cash, 20000); assert.equal(s.minted, 0);
  assert.equal(r.erzpilot.preis * 2000, 20000);
  // Keine Miner-Produktion: Hüllen stammen aus einem endlichen Gründungslager.
  assert.equal(r.w5.klasse, 'frachter'); assert.equal(s.stations.st_aldera.lager.miner, 3);
  // K1 übernimmt aus dem Modell: Wertverzehr 0,30 ISK je aktiver Minute, Lohn 1 ISK je Flugminute.
  assert.equal(w.daten.verschleiss.milliJeMinute.miner, 300); assert.equal(w.daten.flug.lohnJeMinute, 1);
});
