// K1-Kartenflug: Touch-Auswahl ist hashneutral; erst bestätigen führt den
// finanzierten Original-shipApproach-/shipDock-Befehl aus.
// Chromium/WebKit, vier Touch-Viewports, keine Änderungen an Save/Core.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

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
  const engineName = process.env.WELT_BROWSER === 'webkit' ? 'webkit' : 'chromium';
  const engine = engineName === 'webkit' ? webkit : chromium;
  let browser;
  try {
    browser = await engine.launch(engineName === 'webkit' ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('dialog', d => d.accept());
      const tap = async sel => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.locator(sel).tap(); };
      const zustand = () => page.evaluate(() => JSON.parse(window.__welt.zustand()));
      const hash = () => page.evaluate(() => window.__welt.hash());
      const miner = async () => Object.values((await zustand()).ships)
        .find(s => s.owner === 'house' && s.klasse === 'miner');
      const schritt = () => page.evaluate(() => window.__welt.schritte(1));
      // Test benutzt dieselbe Projektionsfunktion und Weltkoordinaten wie die Kartendarstellung.
      // Touchpunkt liegt garantiert innerhalb des gerenderten Canvas (kein DPR-/Scroll-Ratefehler).
      const karteTippen = async ziel => {
        await page.locator('#raum').scrollIntoViewIfNeeded();
        const p = await page.evaluate(z => {
          const canvas = document.getElementById('raum');
          const sys = window.FlugKern.DATEN.systeme.aldera;
          const obj = z === 'st_aldera' ? sys.station : sys.felder.find(f => f.id === z);
          if (!obj) throw Error('Unbekanntes Originalkartenziel ' + z);
          const w = canvas.clientWidth, h = canvas.clientHeight, skala = Math.min(w, h) / 2500000;
          const [x, y] = window.FlugGrafik.projektion(obj.x, obj.y, 144000, 224000, skala, w, h);
          const rect = canvas.getBoundingClientRect();
          return { x: rect.left + x * rect.width / w, y: rect.top + y * rect.height / h };
        }, ziel);
        assert.ok(p.x >= 0 && p.x < width && p.y >= 0 && p.y < height, 'Touchpunkt liegt im Viewport');
        await page.touchscreen.tap(p.x, p.y);
      };
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt &&
          /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        await tap('nav button[data-ansicht="station"]');
        await tap('#kaufMiner');
        await tap('nav button[data-ansicht="flug"]');
        assert.equal(await page.locator('#kartenZiel option').count(), 4);
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), true, 'ohne bestätigtes Ziel kein Auftrag');
        const vor = await hash();

        await karteTippen('st_aldera');
        assert.equal(await page.locator('#kartenZiel').inputValue(), 'st_aldera', 'Station per echtem Touch ausgewählt');
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), true, 'Dock: kein freier Flug');
        assert.equal(await hash(), vor, 'Dock-Tap verändert keinen Core-Zustand');

        await karteTippen('aldera:eis');
        assert.equal(await page.locator('#kartenZiel').inputValue(), 'aldera:eis', 'Eisfeld per echtem Touch gewählt');
        assert.match(await page.locator('#kartenHinweis').textContent(), /Eisfeld.*vorgemerkt/);
        assert.equal(await hash(), vor, 'Feldwahl vor Abdocken ist rein visuell');
        const liveMutationen = await page.evaluate(async () => {
          const meldungen = ['kartenHinweis', 'pilotHinweis'].map(id => document.getElementById(id));
          const aenderungen = [0, 0];
          const beobachter = meldungen.map((el, i) => {
            const observer = new MutationObserver(eintraege => { aenderungen[i] += eintraege.length; });
            observer.observe(el, { childList: true, characterData: true, subtree: true });
            return observer;
          });
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          beobachter.forEach(observer => observer.disconnect());
          return aenderungen;
        });
        assert.deepEqual(liveMutationen, [0, 0], 'VoiceOver-Status ohne Änderungen nicht je Frame neu schreiben');

        await tap('#abdocken');
        await schritt();
        assert.equal((await miner()).flug.lage, 'frei');
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), false);
        const freiHash = await hash();

        await page.locator('#kartenZiel').selectOption('aldera:erz');
        assert.equal(await hash(), freiHash, 'native Select-Auswahl ist hashneutral');
        assert.equal(await page.locator('#kartenZiel').inputValue(), 'aldera:erz');
        await karteTippen('aldera:eis');
        assert.equal(await hash(), freiHash, 'Karten-Tap erteilt noch keinen Anflug');
        await tap('#kartenAnflug');
        const mitAuftrag = await miner();
        assert.equal(mitAuftrag.flug.modus, 'anflug', 'Original-Core startet echten Zielflug');
        assert.deepEqual(mitAuftrag.flug.ziel, { art: 'feld', id: 'aldera:eis' });
        assert.notEqual(await hash(), freiHash);

        let flug = 0;
        while (await page.locator('#foerdernEis').isDisabled() && flug < 60) {
          await schritt(); flug++;
        }
        assert.ok(flug > 0 && flug < 60, 'Eisfeld real erreicht und physikalisch abgebremst');
        const feldHash = await hash();
        await karteTippen('st_aldera');
        assert.equal(await page.locator('#kartenZiel').inputValue(), 'st_aldera');
        assert.equal(await hash(), feldHash, 'Dockziel auswählen unterbricht den Flug nicht');
        await tap('#kartenAnflug');
        assert.deepEqual((await miner()).flug.ziel, { art: 'station', id: 'st_aldera' },
          'Original-shipDock führt Station als Ziel im selben Flugzustand');
        let heim = 0;
        while ((await miner()).flug.lage !== 'angedockt' && heim < 60) {
          await schritt(); heim++;
        }
        assert.ok(heim > 0 && heim < 60, 'reales Dockmanöver ohne Teleport');
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), true, 'im Dock keine doppelte Zielflugannahme');
        const report = await page.evaluate(() => ({
          hash: window.__welt.hash(), audit: window.__welt.audit(),
          report: window.__welt.bericht()
        }));
        assert.equal(report.audit.ok, true, JSON.stringify(report.audit.fehler));
        assert.equal(report.report.weltgeld, 33000);
        assert.equal(report.report.minted, 0);
        assert.equal(report.report.burned, 0);

        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt &&
          /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        assert.equal(await hash(), report.hash, 'Save/Load unverändert');
        assert.equal(await page.locator('#kartenZiel').inputValue(), '', 'Zielvormerkung wird nicht persistiert');
        assert.equal(await page.evaluate(() => window.__welt.audit().ok), true);
        assert.deepEqual(errors, [], 'keine Browser-Ausnahmen');
        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'kein horizontales Scrollen: ' + overflow);
        assert.ok(await page.locator('#kartenAnflug').evaluate(b => b.getBoundingClientRect().height >= 44),
          'Bestätigungstaste hat Touch-Mindestgröße');
        console.log('K1_KARTENFLUG_OK ' + JSON.stringify({
          browser: engineName, width, height, anflug: flug, rueckflug: heim, hash: report.hash
        }));
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
