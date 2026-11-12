import test from 'node:test';
import assert from 'node:assert/strict';
import { finanzierungsGate, k7Analyse, originalSperren, K7_OPTION } from '../tools/k7-industrieerz-gate.mjs';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
import { pruefen } from '../tools/k5-terminal-diagnose.mjs';

for (const seed of [42, 7]) {
  test('K7 Seed ' + seed + ': eine reale Industriebestellung wäre finanzierbar, aber W1-Bestellrecht fehlt', () => {
    const r = k7Analyse(seed), g = r.gate;
    assert.equal(g.option, K7_OPTION);
    assert.equal(g.tick, 21612);
    assert.equal(g.hash, r.basis);
    assert.equal(g.weltgeld, 33000); assert.equal(g.minted, 0); assert.equal(g.burned, 0);
    assert.equal(g.anzahlErz, 50);
    assert.equal(g.wertErz, 500);
    assert.equal(g.bergbau, 100);
    assert.equal(g.kaufTransport, 740);
    assert.equal(g.crewTransport, 120);
    assert.equal(g.raffinierChargen, 5);
    assert.equal(g.materialAusCharge, 25);
    assert.equal(g.raffinerieLohn, 100);
    assert.equal(g.werftMaterial, 500);
    assert.equal(g.werftLohn, 30);
    assert.equal(g.hullenPreis, 750);
    assert.equal(g.ueberfuehrung, 60);
    assert.equal(g.eigentuemerOk, true);
    assert.equal(g.ausreichend, true, 'nur die NICHT gebuchten Industrie-Vorfinanzierungen sind kapitalgedeckt');
    assert.equal(g.originalExportLuecke, 500, 'Original-W1 finanziert weiter ausschließlich über Export-Endkäufer');
    assert.equal(g.originalEndnachfrage.status, 'absatzstopp');
    assert.equal(g.originalEndnachfrage.planbar, 0);
    assert.equal(g.vorhandenePhysik.quelleErz, 0);
    assert.equal(g.vorhandenePhysik.zielErz, 0);
    assert.equal(g.vorhandenePhysik.zielMaterial, 0);
    assert.equal(g.vorhandenePhysik.frachterAktiv, true);
    assert.equal(g.vorhandenePhysik.minerEinsatzfaehig, true);
    assert.deepEqual(g.kassen, {
      npc3: 1597, st_aldera: 1100, st_nadir: 4560, transport: 6376,
      werft_extern: 530, export: 0,
    });
    assert.deepEqual(g.finanzierung, {
      npc3: { vorhanden: 1597, gebunden: 100, gedeckt: true, luecke: 0 },
      st_aldera: { vorhanden: 1100, gebunden: 500, gedeckt: true, luecke: 0 },
      st_nadir: { vorhanden: 4560, gebunden: 840, gedeckt: true, luecke: 0 },
      transport: { vorhanden: 6376, gebunden: 930, gedeckt: true, luecke: 0 },
      werft_extern: { vorhanden: 530, gebunden: 530, gedeckt: true, luecke: 0 },
    });
    assert.equal(g.produktivAusfuehrbar, false, 'ohne neue Produktfreigabe keine ungedeckte Industrie-Pipeline');
    assert.ok(g.strukturFehlt.some(x => /nicht doppelt|nicht doppelt|doppelt/.test(x)));
    assert.equal(g.originalQuotes.fracht.ok, false);
    assert.match(g.originalQuotes.fracht.grund, /Erzcharge/);
    assert.equal(g.originalQuotes.raffinieren.ok, false);
    assert.match(g.originalQuotes.raffinieren.grund, /Erz/);
    assert.equal(g.originalQuotes.werft.ok, false);
    assert.match(g.originalQuotes.werft.grund, /Material/);
    assert.equal(r.ablehnungen.length, 5);
    assert.ok(r.ablehnungen.every(a => typeof a.grund === 'string' && a.grund.length > 0));
    assert.equal(r.audit.weltgeld, 33000);
    assert.equal(r.audit.nullsaldo, 0);
    console.log('K7_RESULT ' + JSON.stringify({
      seed, tick: g.tick, hash: g.hash, exportLuecke: g.originalExportLuecke,
      originalEndkunde: g.originalEndnachfrage.status,
      kassen: g.kassen, budget: g.finanzierung, einsetzbareHuelle: g.vorhandenePhysik.frachterAktiv,
      gründe: r.ablehnungen.map(a => a.grund), weltgeld: g.weltgeld,
    }));
  });
  test('K7 Seed ' + seed + ': Kassen- und Eigentümerprüfungen strikt schreibgeschützt', () => {
    const { w, terminalSave } = k6Start(seed), s = w.load(terminalSave);
    const vor = w.canonical(s), h = w.hash(s);
    assert.throws(() => finanzierungsGate(w, s, { anzahlErz: 49 }), RangeError);
    const gefaelschterOwner = finanzierungsGate(w, s, { minerId: 'sh020' });
    assert.equal(gefaelschterOwner.eigentuemerOk, false);
    const unerreichbar = finanzierungsGate(w, s, { frachterId: 'sh003' });
    assert.equal(unerreichbar.eigentuemerOk, false);
    assert.equal(unerreichbar.produktivAusfuehrbar, false);
    assert.equal(w.canonical(s), vor, 'K7 darf keine Originalwelt ändern');
    assert.equal(w.hash(s), h, 'K7 darf keinen Welt-Hash ändern');
    assert.equal(pruefen(w, s).weltgeld, 33000);
    assert.equal(originalSperren(w, s).length, 5);
    assert.equal(w.canonical(s), vor);
  });
}
