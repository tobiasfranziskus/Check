// K1-Spielbarkeit: vollständiger, persönlich bedienter und finanzierter Eis-Bergbaurundlauf.
// Auf dem einzigen autoritativen Weltzustand: Dock -> Feld -> echte Förderung -> Dock -> Verkauf.
// Chromium und WebKit in 4 Touchgrößen. Kein Ersatz für reale iPad-/NAS-Abnahme.
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
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const webkitTest = process.env.WELT_BROWSER === 'webkit';
  const engine = webkitTest ? webkit : chromium;
  let browser;
  try {
    browser = await engine.launch(webkitTest ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on('dialog', (dialog) => dialog.accept());
      const tap = async (selector) => {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.locator(selector).tap();
      };
      const snapshot = () => page.evaluate(() => {
        const s = JSON.parse(window.__welt.zustand());
        return {
          tick: s.tick,
          miner: Object.values(s.ships).find(sh => sh.owner === 'house' && sh.klasse === 'miner') || null,
          haus: s.owners.house.cash,
          pilot: s.owners.pilot_house.cash,
          stationEis: s.stations.st_aldera.lager.eis,
          gefördert: s.w5n.eisAbgebaut,
          verkauft: s.w5n.mineVerkauft,
          lohn: s.w5n.mineLohn,
          weltgeld: window.__welt.bericht().weltgeld,
          minted: s.minted, burned: s.burned,
          hash: window.__welt.hash(),
        };
      });
      const advance = () => page.evaluate(() => window.__welt.schritte(1));
      try {
        await page.goto(base + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt &&
          /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        await tap('nav button[data-ansicht="station"]');
        await tap('#kaufMiner');
        await tap('nav button[data-ansicht="flug"]');
        const ausgang = await snapshot();
        assert.ok(ausgang.miner && ausgang.miner.flug.lage === 'angedockt', 'gekaufter Miner im Dock');
        assert.equal(ausgang.weltgeld, 33000);
        for (const id of ['abdocken', 'zumEis', 'foerdernEis', 'warten', 'andocken', 'verkaufen']) {
          assert.equal(await page.locator('#' + id).isVisible(), true, id + ' ohne verstecktes Menü sichtbar');
        }
        assert.equal(await page.locator('#verkaufen').isDisabled(), true, 'ohne eigene Ware kein Verkauf');
        assert.equal(await page.locator('#zumEis').isDisabled(), true, 'im Dock kein Feldanflug');
        await tap('#abdocken');
        await advance(); // echtes Abdockmanöver: 60 Flugsimulationssekunden
        assert.equal((await snapshot()).miner.flug.lage, 'frei');
        assert.equal(await page.locator('#zumEis').isDisabled(), false);
        await tap('#zumEis');
        let anflug = 0;
        while (await page.locator('#foerdernEis').isDisabled() && anflug < 80) {
          await advance(); anflug++;
        }
        assert.ok(anflug >= 1 && anflug < 80, 'Eisfeld wird nach echter bezahlter Flugzeit erreicht');
        assert.equal(await page.locator('#foerdernEis').isDisabled(), false, 'Fördern erst im Eisfeld');
        assert.equal(await page.locator('#foerdernErz').isDisabled(), true, 'kein Erzabbau im Eisfeld');
        assert.equal(await page.locator('#verkaufen').isDisabled(), true, 'kein Fernverkauf im Feld');

        const vorAbbau = await snapshot();
        await tap('#foerdernEis');
        await page.evaluate(() => window.__welt.schritte(10)); // echte bezahlte Förderminuten
        const mitLadung = await snapshot();
        const menge = (mitLadung.miner.ladung.eis || 0) - (vorAbbau.miner.ladung.eis || 0);
        assert.equal(menge, 10, 'zehn neu und tatsächlich im Feld geförderte Eis');
        assert.equal(mitLadung.gefördert - vorAbbau.gefördert, 10, 'Original-Förderbuch');
        assert.equal(mitLadung.lohn - vorAbbau.lohn, 20, 'zehn bezahlte Förderminuten');
        assert.equal(mitLadung.verkauft, vorAbbau.verkauft, 'am Feld noch kein Verkauf');
        assert.equal(await page.locator('#warten').isDisabled(), false, 'Förderstopp bedienbar');
        await tap('#warten');
        assert.equal((await snapshot()).miner.auftrag, 'halten', 'Original-shipWait stoppt Förderung');
        await tap('#andocken');
        let heimflug = 0;
        while ((await snapshot()).miner.flug.lage !== 'angedockt' && heimflug < 80) {
          await advance(); heimflug++;
        }
        assert.ok(heimflug >= 1 && heimflug < 80, 'physische Rückkehr zum Aldera-Dock');
        assert.equal(await page.locator('#verkaufen').isDisabled(), false, 'erst im Dock mit echter Ladung verkaufen');
        const vorVerkauf = await snapshot();
        assert.equal(vorVerkauf.miner.ladung.eis, menge, 'Ware bleibt bis zum Dock an Bord');
        await tap('#verkaufen');
        const nachVerkauf = await snapshot();
        assert.equal(nachVerkauf.miner.ladung.eis, 0, 'Eis ordnungsgemäß aus dem Schiff übertragen');
        assert.equal(nachVerkauf.verkauft - vorVerkauf.verkauft, menge, 'Original-Dockverkäufe');
        assert.equal(nachVerkauf.stationEis - vorVerkauf.stationEis, menge, 'Aldera erhält echte Ware');
        assert.equal(nachVerkauf.haus - vorVerkauf.haus, menge * 5, 'Aldera zahlt 5 ISK pro Eis an Eigentümer');
        assert.ok(nachVerkauf.pilot > ausgang.pilot, 'Pilot erhielt reale bezahlte Flugminuten');
        assert.equal(nachVerkauf.weltgeld, 33000);
        assert.equal(nachVerkauf.minted, 0);
        assert.equal(nachVerkauf.burned, 0);
        assert.equal(await page.evaluate(() => window.__welt.audit().ok), true);
        assert.equal(await page.locator('#verkaufen').isDisabled(), true, 'nach Verkauf kein doppelter Warenverkauf');

        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt &&
          /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const geladen = await snapshot();
        assert.equal(geladen.hash, nachVerkauf.hash, 'Save/Load erhält Original-Welt-Hash');
        assert.equal(geladen.verkauft, nachVerkauf.verkauft);
        assert.equal(geladen.haus, nachVerkauf.haus);
        assert.equal(await page.evaluate(() => window.__welt.audit().ok), true, 'Audit nach Reload');
        assert.deepEqual(errors, [], 'keine Browserausnahmen');
        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'kein horizontaler Touch-Überlauf: ' + overflow.join('/'));
        console.log('K1_BERGBAURUNDE_OK ' + JSON.stringify({
          browser: webkitTest ? 'webkit' : 'chromium', width, height, anflug, heimflug,
          eis: menge, erloes: menge * 5, tick: geladen.tick, hash: geladen.hash
        }));
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
