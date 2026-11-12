// Ein echter Spieler-Frachter aus endlichem Lager: Kauf, Touch-Steuerung,
// gebundener Fluglohn, physisches Dock, Save/Load. Vier Touchgroessen je Engine.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const p = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!p.startsWith(root + '/prototypes/') || !/\.(html|js|css)$/.test(p)) return res.writeHead(404).end();
    try {
      res.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(p));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const isWebKit = process.env.WELT_BROWSER === 'webkit';
  const kind = isWebKit ? 'webkit' : 'chromium';
  const driver = isWebKit ? webkit : chromium;
  let browser;
  try {
    browser = await driver.launch(isWebKit ? {} : { args:['--no-sandbox'] });
    for (const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]) {
      const context = await browser.newContext({ viewport:{width,height}, hasTouch:true });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('dialog', dialog => dialog.accept());
      const tap = async selector => {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.locator(selector).tap();
      };
      const screen = async name => {
        await tap('nav button[data-ansicht="' + name + '"]');
        assert.equal(await page.locator('[data-seite="' + name + '"]').isVisible(), true);
      };
      const get = () => page.evaluate(() => {
        const state = JSON.parse(window.__welt.zustand());
        return { state, hash:window.__welt.hash(), audit:window.__welt.audit(),
          bericht:window.__welt.bericht(),
          fr:Object.values(state.ships).find(s => s.owner === 'house' && s.klasse === 'frachter') || null };
      });
      const audit = async text => {
        const x = await get();
        assert.equal(x.audit.ok, true, text+': '+JSON.stringify(x.audit.fehler));
        assert.equal(x.bericht.weltgeld, 33000);
        assert.equal(x.state.minted, 0);
        assert.equal(x.state.burned, 0);
        assert.equal(Object.values(x.state.owners).reduce((n, o) => n + o.cash, 0), 33000);
        return x;
      };
      const advance = async mins => page.evaluate(n => window.__welt.schritte(n), mins);
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt &&
          /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const before = await audit('Start');
        assert.equal(before.fr, null, 'kein kostenloser Spielerfrachter');
        assert.equal(await page.locator('#rundenAktion').isVisible(), true, 'bestehende Eis-Starthilfe bleibt');
        assert.ok(before.state.stations.st_aldera.lager.frachter > 0, 'echtes, endliches Aldera-Lager');

        await screen('station');
        assert.equal(await page.locator('#kaufFrachter').isDisabled(), false);
        const lager = before.state.stations.st_aldera.lager.frachter;
        const cash = before.state.owners.house.cash;
        await tap('#kaufFrachter');
        const gekauft = await audit('bezahlter Kauf');
        assert.ok(gekauft.fr && gekauft.fr.flug.lage === 'angedockt');
        assert.equal(gekauft.fr.system, 'aldera');
        assert.equal(gekauft.state.stations.st_aldera.lager.frachter, lager - 1);
        assert.equal(gekauft.state.owners.house.cash, cash - 750);
        assert.equal(Object.keys(gekauft.state.ships).length, Object.keys(before.state.ships).length + 1);

        await screen('flug');
        const id = gekauft.fr.id;
        await page.locator('#schiff').selectOption(id);
        assert.equal(await page.locator('#frachterAufgaben').isVisible(), true);
        assert.equal(await page.locator('#minerAufgaben').isVisible(), false);
        assert.equal(await page.locator('#rundenHilfe').isVisible(), false);
        assert.equal(await page.locator('#foerdernEis').isDisabled(), true);
        assert.equal(await page.locator('#abdocken').isDisabled(), false);
        await tap('#abdocken');
        const mitReserve = await audit('Abdockreserve');
        assert.equal(mitReserve.state.owners['k1_flug_' + id].cash, 40);
        assert.equal(mitReserve.state.owners.house.cash, gekauft.state.owners.house.cash - 40);
        await advance(1);
        assert.equal((await get()).fr.flug.lage, 'frei', 'echtes Abdocken');

        await tap('[data-pilot-kurs="0"]');
        await page.locator('#pilotFahrt').evaluate(input => {
          input.value = '60'; input.dispatchEvent(new Event('input', { bubbles:true }));
        });
        const vorSteuer = await get();
        await tap('#pilotAnwenden');
        const gesteuert = await get();
        assert.equal(gesteuert.fr.flug.modus, 'hand');
        assert.equal(gesteuert.fr.flug.sollFahrt, 60);
        assert.equal(gesteuert.fr.flug.sollKurs, 0);
        assert.equal(gesteuert.state.tick, vorSteuer.state.tick, 'Steuern benötigt keine versteckte Tickminute');
        await advance(3);
        const unterwegs = await audit('3 echte Flugminuten');
        assert.ok(unterwegs.fr.flug.x > 0, 'Frachter bewegt sich physikalisch im Aldera-Raum');
        assert.equal(unterwegs.fr.phase, 'dock', 'kein kostenloser W3-Ferntransport');
        assert.equal(unterwegs.fr.system, 'aldera');
        assert.ok(unterwegs.state.owners.pilot_house.cash > gekauft.state.owners.pilot_house.cash);

        await page.locator('#kartenZiel').selectOption('st_aldera');
        const vorBestätigung = (await get()).hash;
        assert.equal(await page.locator('#kartenAnflug').isDisabled(), false);
        assert.equal((await get()).hash, vorBestätigung, 'Kartenvormerkung nur UI');
        await tap('#kartenAnflug'); // originaler Kern-shipDock
        let retour = 0;
        while ((await get()).fr.flug.lage !== 'angedockt' && retour++ < 90) await advance(1);
        assert.ok(retour > 0 && retour < 90, 'physisches Rückdocken');
        const dock = await audit('Dock');
        assert.equal(dock.state.kanon.flugdienst[id], undefined);
        assert.equal(dock.state.owners['k1_flug_' + id].cash, 0);
        assert.ok(dock.state.owners.house.cash < gekauft.state.owners.house.cash);
        assert.equal(dock.fr.ladung.eis || 0, 0);
        assert.equal(dock.fr.ladung.erz || 0, 0);

        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt &&
          /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const loaded = await audit('Reload');
        assert.equal(loaded.hash, dock.hash, 'volle Save/Load-Deterministik');
        assert.equal(loaded.fr.id, id);
        assert.deepEqual(errors, [], 'keine Browser-Ausnahmen');
        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'keine horizontale Viewport-Ueberbreite');
        console.log('K1_FRACHTERFLUG_OK '+JSON.stringify({browser:kind,width,height,
          ship:id, preis:750, minuten:loaded.state.tick, rueckflug:retour, hash:loaded.hash}));
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode=1; });
