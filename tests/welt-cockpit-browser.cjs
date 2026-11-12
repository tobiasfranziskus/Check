// K1-Spielbarkeit: echtes, touchfähiges Miner-Cockpit, Original-shipSteer,
// kein zweiter Integrator, keine Abweichung der Geld- oder Save-Bilanz.
// Chromium + WebKit, 4 Touchgrößen. Kein Ersatz für echte iPad-/NAS-Abnahme.
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
      const state = () => page.evaluate(() => JSON.parse(window.__welt.zustand()));
      const miner = async () => {
        const s = await state();
        return Object.values(s.ships).find((sh) => sh.owner === 'house' && sh.klasse === 'miner');
      };
      try {
        await page.goto(base + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt && /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        assert.equal(await page.evaluate(() => window.__welt.audit().ok), true);
        await tap('nav button[data-ansicht="station"]');
        await tap('#kaufMiner');
        await page.waitForFunction(() => /Miner aus dem Lager/.test(document.getElementById('meldung').textContent));
        await tap('nav button[data-ansicht="flug"]');
        assert.equal(await page.locator('#pilotAnwenden').isDisabled(), true, 'Kursbefehl im Dock gesperrt');
        assert.equal(await page.locator('#pilotRichtungen button').count(), 8, 'acht Kurs-Kurztasten');
        assert.equal(await page.locator('[data-pilot-kurs="64"]').isDisabled(), true, 'Richtung im Dock gesperrt');
        assert.equal(await page.locator('#abdocken').isVisible(), true, 'Abdocken ohne verstecktes Detailmenü sichtbar');
        assert.equal(await page.locator('#andocken').isDisabled(), true, 'Andocken im Dock gesperrt');
        assert.equal(await page.locator('#foerdernEis').isVisible(), true, 'Förderaktion unmittelbar im Cockpit sichtbar');
        assert.equal(await page.locator('#foerdernEis').isDisabled(), true, 'Fördern außerhalb des Feldes gesperrt');
        assert.match(await page.locator('#pilotHinweis').textContent(), /Dock/);

        await tap('#abdocken'); // Originalbefehl, echte 40-ISK-Flugreserve
        await page.waitForFunction(() => /Abgedockt/.test(document.getElementById('meldung').textContent));
        await page.evaluate(() => window.__welt.schritte(1)); // 60 physische Flugsekunden, Abdocken fertig
        assert.equal((await miner()).flug.lage, 'frei', 'erst nach originalem Abdockmanöver steuerbar');
        assert.equal(await page.locator('#pilotAnwenden').isDisabled(), false);
        const h0 = await page.evaluate(() => window.__welt.hash());
        assert.equal(await page.locator('#abdocken').isDisabled(), true, 'Abdocken im freien Flug gesperrt');
        assert.equal(await page.locator('#andocken').isDisabled(), false, 'Andocken im freien Flug verfügbar');
        assert.equal(await page.locator('#foerdernErz').isDisabled(), true, 'fremdes Feld: keine Förderung');
        await tap('[data-pilot-kurs="224"]');
        assert.equal(await page.locator('#pilotKurs').inputValue(), '224', 'Nordost legt nur den Sollkurs im Regler fest');
        assert.equal(await page.locator('[data-pilot-kurs="224"]').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.evaluate(() => window.__welt.hash()), h0, 'Kurztasten verändern nicht die Welt');
        await tap('[data-pilot-kurs="64"]');
        assert.equal(await page.locator('[data-pilot-kurs="224"]').getAttribute('aria-pressed'), 'false');
        assert.equal(await page.locator('[data-pilot-kurs="64"]').getAttribute('aria-pressed'), 'true');
        await page.locator('#pilotKurs').evaluate((e) => { e.value = '64'; e.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.locator('#pilotFahrt').evaluate((e) => { e.value = '75'; e.dispatchEvent(new Event('input', { bubbles: true })); });
        assert.equal(await page.locator('#pilotKursWert').textContent(), '64');
        assert.equal(await page.locator('#pilotFahrtWert').textContent(), '75 %');
        assert.equal(await page.evaluate(() => window.__welt.hash()), h0, 'bloße Regleränderung nicht zustandswirksam');
        await page.waitForTimeout(60);
        assert.equal(await page.locator('#pilotFahrt').inputValue(), '75', 'Rendering überschreibt Regler nicht');
        await tap('#pilotAnwenden');

        let sh = await miner();
        assert.equal(sh.flug.modus, 'hand');
        assert.equal(sh.flug.sollKurs, 64);
        assert.equal(sh.flug.sollFahrt, 75);
        await page.evaluate(() => window.__welt.schritte(3));
        sh = await miner();
        assert.ok(sh.flug.y > 0, 'manueller Kurs verändert echte 2D-Position');
        assert.notEqual(await page.evaluate(() => window.__welt.hash()), h0);
        assert.match(await page.locator('#pilotIst').textContent(), /P\/s/);
        assert.match(await page.locator('#pilotReserve').textContent(), /ISK/);

        await tap('#pilotBremsen');
        sh = await miner();
        assert.equal(sh.flug.modus, 'hand', 'Bremsbefehl bleibt Original-Handsteuerung');
        assert.equal(sh.flug.sollFahrt, 0);
        assert.equal(await page.locator('#pilotFahrt').inputValue(), '0');
        await tap('#andocken'); // Original: Zielstation + physische Abbremsung + Dockmanöver
        assert.match(await page.locator('#meldung').textContent(), /Andockanflug/);
        await page.evaluate(() => window.__welt.schritte(45));
        sh = await miner();
        assert.equal(sh.flug.lage, 'angedockt', 'nach realem Rückflug wieder im Dock');
        assert.equal(await page.locator('#pilotAnwenden').isDisabled(), true);
        const audit = await page.evaluate(() => ({ report: window.__welt.bericht(), audit: window.__welt.audit() }));
        assert.equal(audit.audit.ok, true, JSON.stringify(audit.audit.fehler));
        assert.equal(audit.report.weltgeld, 33000);
        assert.equal(audit.report.minted, 0);
        assert.equal(audit.report.burned, 0);

        await tap('#pendelEis');
        assert.equal(await page.locator('#pilotAnwenden').isDisabled(), true, 'Pendel sperrt direkte Steuerung');
        assert.equal(await page.locator('[data-pilot-kurs="64"]').isDisabled(), true, 'Pendel sperrt auch Kurztasten');
        await tap('#pendelStop');
        const hash = await page.evaluate(() => window.__welt.hash());
        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt && /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        assert.equal(await page.evaluate(() => window.__welt.hash()), hash, 'Cockpit beeinflusst Save/Load nicht');
        assert.equal(await page.evaluate(() => window.__welt.audit().ok), true);

        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'kein horizontales Überscrollen: ' + overflow.join('/'));
        const small = await page.evaluate(() => [...document.querySelectorAll('#pilotCockpit button')].filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.id));
        assert.deepEqual(small, [], 'alle Cockpit-Touchflächen mindestens 44px');
        assert.deepEqual(errors, [], 'keine Browser-Exceptions');
        console.log('K1_COCKPIT_OK ' + JSON.stringify({ engine: webkitTest ? 'WebKit' : 'Chromium', width, height, hash }));
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
