// Unabhängiges K1-Integrationsgate: EIN Weltzustand in Cockpit, Karte, Konzern,
// Flotte, Station, Wirtschaft und Spielstand. Keine Testbefehle direkt in den Core;
// Aktionen erfolgen über die ursprüngliche Touch-Bedienoberfläche.
// Chromium und WebKit in vier Viewports. Keine Produktfreigabe/iPad-Geräteabnahme.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/prototypes/') || !/\.(html|js|css)$/.test(file)) {
      res.writeHead(404).end(); return;
    }
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript'
        : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const isWebkit = process.env.WELT_BROWSER === 'webkit';
  const browserName = isWebkit ? 'webkit' : 'chromium';
  const engine = isWebkit ? webkit : chromium;
  let browser;
  try {
    browser = await engine.launch(isWebkit ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('dialog', d => d.accept());
      const tap = async sel => {
        await page.locator(sel).scrollIntoViewIfNeeded();
        await page.locator(sel).tap();
      };
      const view = async name => {
        await tap('nav button[data-ansicht="' + name + '"]');
        assert.equal(await page.locator('[data-seite="' + name + '"]').isVisible(), true,
          name + ' muss sichtbar sein');
      };
      const zustand = () => page.evaluate(() => JSON.parse(window.__welt.zustand()));
      const daten = () => page.evaluate(() => {
        const s = JSON.parse(window.__welt.zustand());
        return { state: s, bericht: window.__welt.bericht(),
          hash: window.__welt.hash(), audit: window.__welt.audit(),
          speicher: window.__welt.uebersicht() };
      });
      const miner = s => Object.values(s.ships).find(x => x.owner === 'house' && x.klasse === 'miner');
      const step = n => page.evaluate(n => window.__welt.schritte(n), n);
      const table = sel => page.locator(sel + ' tbody tr').evaluateAll(rows =>
        rows.map(r => [...r.querySelectorAll('td')].map(td => td.textContent.trim())));
      const num = value => Number(String(value).replace(/[^0-9-]/g, ''));
      const equalAudit = (d, phase) => {
        assert.equal(d.audit.ok, true, phase + ': ' + JSON.stringify(d.audit.fehler));
        assert.equal(d.bericht.weltgeld, 33000, phase + ': Gesamtgeld');
        assert.equal(d.state.minted, 0, phase + ': keine Emission');
        assert.equal(d.state.burned, 0, phase + ': keine Senke');
        assert.equal(Object.values(d.state.owners).reduce((n, x) => n + x.cash, 0),
          33000, phase + ': unabhängige Kassensumme');
      };
      // Die sichtbaren Tabellen müssen exakt den aktuellen Core-Bericht widerspiegeln.
      async function vergleicheAnsichten(d, phase) {
        const h = d.hash, worldId = d.speicher.aktiv, s = d.state, b = d.bericht;
        await view('konzern');
        const konzerne = await table('#firmen');
        const house = konzerne.find(row => row[0].startsWith('house (Spieler)'));
        assert.ok(house, phase + ': Spielerfirma sichtbar');
        assert.equal(num(house[1]), s.owners.house.cash, phase + ': Konzernkasse');
        assert.equal(num(house[3]), b.firmen.house.ruecklage, phase + ': echte Ersatzrücklage');
        await view('flotte');
        const fleet = await table('#schiffe');
        assert.equal(fleet.length, Object.keys(s.ships).length, phase + ': jede Hülle in der Flotte');
        const playerMiner = miner(s);
        if (playerMiner) {
          const sh = fleet.find(row => row[0] === playerMiner.id);
          assert.ok(sh, phase + ': eigenes Schiff auch in Flotte sichtbar');
          assert.equal(sh[1], 'house', phase + ': Eigentümer korrekt');
          assert.equal(sh[2], 'miner', phase + ': Schiffsklasse korrekt');
        }
        await view('station');
        const stationen = await table('#stationen');
        const aldera = stationen.find(row => row[0] === 'Aldera');
        const nadir = stationen.find(row => row[0] === 'Nadir');
        assert.ok(aldera && nadir, phase + ': beide Stationen');
        assert.equal(num(aldera[2]), s.stations.st_aldera.lager.erz || 0);
        assert.equal(num(aldera[3]), s.stations.st_aldera.lager.eis || 0, phase + ': Aldera-Eisbestand');
        assert.equal(num(aldera[4]), s.stations.st_aldera.lager.wasser || 0);
        assert.equal(num(nadir[4]), s.stations.st_nadir.lager.wasser || 0, phase + ': Nadir-Wasser');
        await view('wirtschaft');
        const stats = Object.fromEntries((await table('#kreislauf')).map(row => [row[0], row[1]]));
        assert.equal(num(stats['Weltgeld']), 33000, phase + ': UI-Weltgeld');
        assert.equal(stats['Emission / Senke'], '0 / 0', phase + ': UI-Geldemission');
        assert.equal(num(stats['Eisfrachten abgeschlossen']), b.auftraege.eisfrachten, phase + ': bezahlte Fracht');
        assert.equal(num(stats['Wasser produziert']), b.produktion.wasserProduziert, phase + ': Wasserwerk');
        assert.equal(num(stats['In Treuhand und Reserven gebunden']), b.gebunden, phase + ': Treuhand');
        const einkauf = stats['Eis gefördert / an Aldera verkauft'].split('/').map(num);
        assert.deepEqual(einkauf, [b.produktion.eisGefoerdert, b.verkaeufe.eisAnAldera],
          phase + ': dieselben Waren in Bergbau und Endabrechnung');
        await view('spielstand');
        assert.match(await page.locator('#speicherStatus').textContent(), new RegExp(h),
          phase + ': Speicheransicht mit Originalwelt-Hash');
        assert.equal(await page.evaluate(() => window.__welt.uebersicht().aktiv), worldId);
        assert.equal(await page.evaluate(() => window.__welt.hash()), h,
          phase + ': bloßer Ansichtswechsel verändert nicht die Welt');
      }
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt &&
          /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const start = await daten();
        equalAudit(start, 'Start');
        assert.equal(start.state.rulesVersion, 199);
        assert.equal(start.state.schema, 8);
        assert.equal(start.speicher.welten.length, 1);
        await vergleicheAnsichten(start, 'Start');

        // Echte Investition ausschließlich aus der Spielerkasse über die Station.
        await view('station');
        const lagerVor = (await zustand()).stations.st_aldera.lager.miner;
        await tap('#kaufMiner');
        const kauf = await daten(), eigen = miner(kauf.state);
        equalAudit(kauf, 'Kauf');
        assert.ok(eigen, 'Spieler besitzt den wirklich gekauften Miner');
        assert.equal(kauf.state.owners.house.cash, start.state.owners.house.cash - 600,
          '600 ISK Original-Komplettkauf');
        assert.equal(kauf.state.stations.st_aldera.lager.miner, lagerVor - 1,
          'keine kostenlose Hülle');
        await vergleicheAnsichten(kauf, 'Kauf');

        // Persönlicher Touchflug mit den autoritativen Feld-/Dock-IDs. Keine Teleports.
        await view('flug');
        assert.equal(await page.locator('#pilotPosition').isVisible(), true);
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), true);
        await tap('#abdocken');
        await step(1);
        const vorFlug = await daten();
        assert.equal(miner(vorFlug.state).flug.lage, 'frei');
        await page.locator('#kartenZiel').selectOption('aldera:eis');
        assert.equal(await page.evaluate(() => window.__welt.hash()), vorFlug.hash,
          'Kartenwahl kostet nichts und bewegt kein Schiff');
        await tap('#kartenAnflug');
        assert.deepEqual(miner((await daten()).state).flug.ziel, { art: 'feld', id: 'aldera:eis' });
        let hin = 0;
        while (await page.locator('#foerdernEis').isDisabled() && hin < 60) {
          await step(1); hin++;
        }
        assert.ok(hin > 0 && hin < 60, 'Eisfeld wurde real erreicht');
        await vergleicheAnsichten(await daten(), 'Feldankunft');
        await view('flug');
        await tap('#foerdernEis');
        await step(50);
        const abbau = await daten(), geladen = miner(abbau.state);
        equalAudit(abbau, 'Förderung');
        assert.equal(geladen.ladung.eis, 50, '50 reale Eis auf eigenem Schiff');
        assert.equal(abbau.state.w5n.mineLohn, 100, '50 bezahlte Original-Förderminuten à 2 ISK');
        assert.equal(abbau.bericht.verkaeufe.eisAnAldera, 0, 'kein Fernverkauf');
        await vergleicheAnsichten(abbau, 'Förderung');

        await view('flug');
        await tap('#warten');
        await page.locator('#kartenZiel').selectOption('st_aldera');
        await tap('#kartenAnflug');
        let rueck = 0;
        while (miner((await zustand())).flug.lage !== 'angedockt' && rueck < 80) {
          await step(1); rueck++;
        }
        assert.ok(rueck > 0 && rueck < 80, 'physischer Rückflug');
        const vorVerkauf = await daten();
        assert.equal(miner(vorVerkauf.state).ladung.eis, 50, 'bis Dock Eigentum des Spielers');
        await tap('#verkaufen');
        const verkauf = await daten();
        equalAudit(verkauf, 'Dockverkauf');
        assert.equal(miner(verkauf.state).ladung.eis || 0, 0, 'leerer Frachtraum');
        assert.equal(verkauf.bericht.verkaeufe.eisAnAldera, 50);
        assert.equal(verkauf.state.owners.house.cash - vorVerkauf.state.owners.house.cash,
          250, 'bezahlter Originalankauf von 50 Eis');
        assert.equal(verkauf.state.stations.st_aldera.lager.eis -
          vorVerkauf.state.stations.st_aldera.lager.eis, 50, 'realer Lagerzugang');
        await vergleicheAnsichten(verkauf, 'Verkauf');

        // Der deterministische NPC-Core darf die verkaufte Charge regulär transportieren.
        // Wir aktivieren keine unfinanzierten Fremdeigentümer-Befehle.
        await page.evaluate(() => window.__welt.schritte(500));
        const kreislauf = await daten();
        equalAudit(kreislauf, 'Wirtschaftslauf');
        assert.ok(kreislauf.bericht.produktion.eisGefoerdert >= 50);
        assert.ok(kreislauf.bericht.verkaeufe.eisAnAldera >= 50);
        assert.ok(kreislauf.bericht.auftraege.eisfrachten >= 1,
          'NPC-Kreisprozess hat aus realem Eis mindestens eine finanzierte Fracht durchgeführt');
        assert.ok(kreislauf.bericht.produktion.wasserProduziert >= 50,
          'aus der realen Fracht wurde Wasser produziert');
        await vergleicheAnsichten(kreislauf, 'Kreislauf');
        const speicherVor = kreislauf.speicher;
        await page.locator('#platzName').fill('Gesamtspiel ' + width);
        await tap('#speichern');
        await page.waitForFunction(() => /Gespeichert auf/.test(document.getElementById('meldung').textContent));
        // Exporte behalten den Hash und sind wiederholbar importierbar, nicht überschreibbar.
        const [download] = await Promise.all([page.waitForEvent('download'), tap('#exportieren')]);
        const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
        assert.equal(json.hash, kreislauf.hash, 'JSON-Export entspricht dem autoritativen Core');
        assert.equal(json.regel, 199);
        await page.locator('#importieren').setInputFiles(await download.path());
        await page.waitForFunction(() => /bereits vorhanden/.test(document.getElementById('meldung').textContent));
        assert.equal(await page.evaluate(() => window.__welt.hash()), kreislauf.hash,
          'doppelter Import verändert aktive Welt nicht');
        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt &&
          /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const nachLaden = await daten();
        equalAudit(nachLaden, 'Reload');
        assert.equal(nachLaden.hash, kreislauf.hash, 'automatisches Reload erhält Weltbitbild');
        assert.equal(nachLaden.speicher.aktiv, speicherVor.aktiv);
        assert.ok(nachLaden.speicher.welten[0].manuell.some(x => x.platz === 'Gesamtspiel ' + width));
        await vergleicheAnsichten(nachLaden, 'Reload');
        assert.deepEqual(errors, [], 'keine Browserausnahmen');
        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'kein horizontaler Seitenüberlauf');
        console.log('K1_GESAMTSPIEL_OK ' + JSON.stringify({
          browser: browserName, width, height, hash: nachLaden.hash,
          minuten: nachLaden.state.tick, hin, rueck,
          eisGefoerdert: nachLaden.bericht.produktion.eisGefoerdert,
          eisVerkauft: nachLaden.bericht.verkaeufe.eisAnAldera,
          eisfrachten: nachLaden.bericht.auftraege.eisfrachten,
          wasser: nachLaden.bericht.produktion.wasserProduziert
        }));
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
