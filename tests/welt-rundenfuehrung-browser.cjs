// K1: freiwillige, zustandsgesteuerte Eisrunde als einziger Touch-Bedienpfad.
// Ein Tipp delegiert an die vorhandenen Originalbuttons, die den Core validieren.
// Vier Viewports je Chromium/WebKit, keine iPad-/NAS-Geräteabnahme.
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
  const engine = isWebkit ? webkit : chromium;
  let browser;
  try {
    browser = await engine.launch(isWebkit ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('dialog', d => d.accept());
      const tap = async selector => {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.locator(selector).tap();
      };
      const daten = () => page.evaluate(() => {
        const s = JSON.parse(window.__welt.zustand());
        return { s, hash: window.__welt.hash(), audit: window.__welt.audit(),
          weltgeld: window.__welt.bericht().weltgeld,
          miner: Object.values(s.ships).find(sh => sh.owner === 'house' && sh.klasse === 'miner') };
      });
      const titel = () => page.locator('#rundenTitel').textContent();
      const runde = () => tap('#rundenAktion');
      const audit = async phase => {
        const d = await daten();
        assert.equal(d.audit.ok, true, phase + ': ' + JSON.stringify(d.audit.fehler));
        assert.equal(d.weltgeld, 33000, phase + ': keine zusätzliche Währung');
        assert.equal(d.s.minted, 0, phase + ': kein Mint');
        assert.equal(d.s.burned, 0, phase + ': kein Burn');
        assert.equal(Object.values(d.s.owners).reduce((n, x) => n + x.cash, 0), 33000,
          phase + ': unabhängige Eigentümerkassensumme');
        return d;
      };
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt &&
          /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const anfang = await audit('vor der Eisrunde');
        assert.match(await titel(), /Miner kaufen/);
        assert.match(await page.locator('#rundenAktion').textContent(), /Zur Station/);
        await runde(); // nur zu vorhandenem Stationsreiter navigieren
        assert.equal(await page.locator('[data-seite="station"]').isVisible(), true);
        assert.equal((await daten()).hash, anfang.hash, 'Navigation erzeugt keinen Core-Befehl');

        await tap('#kaufMiner'); // exakt vorhandener, originalfinanzierter Kauf
        await tap('nav button[data-ansicht="flug"]');
        const kauf = await audit('nach Kauf');
        assert.ok(kauf.miner && kauf.miner.flug.lage === 'angedockt');
        assert.equal(kauf.s.owners.house.cash, anfang.s.owners.house.cash - 600);
        assert.match(await titel(), /1\/6 · Abdocken/);
        await runde();
        assert.equal((await daten()).miner.flug.lage, 'abdocken');
        assert.match(await titel(), /Abdockmanöver/);
        await runde(); // explizite echte Core-Minute
        assert.equal((await daten()).miner.flug.lage, 'frei');
        assert.match(await titel(), /2\/6 · Zum Eisfeld/);

        await runde(); // der bestehende originale shipApproach
        let anflug = await daten();
        assert.equal(anflug.miner.flug.modus, 'anflug');
        assert.equal(anflug.miner.flug.ziel.id, 'aldera:eis');
        let anflugMinuten = 0;
        while (!/3\/6 · Eisfeld erreicht/.test(await titel()) && anflugMinuten < 80) {
          assert.match(await titel(), /Anflug zum Feld/);
          const tickVorher = (await daten()).s.tick;
          await runde(); anflugMinuten++;
          const jetzt = await daten();
          assert.equal(jetzt.s.tick, tickVorher + 1,
            'geführter Minutenschritt muss den originalen Tick ausführen; UI=' +
            (await titel()) + ', Meldung=' + (await page.locator('#meldung').textContent()));
        }
        const nachAnflug = await daten();
        assert.ok(anflugMinuten > 0 && anflugMinuten < 80,
          'Eisfeld erreichbar: '+ JSON.stringify({minuten:anflugMinuten, flug:nachAnflug.miner.flug,
            auftrag:nachAnflug.miner.auftrag, tick:nachAnflug.s.tick, ui:await titel()}));
        assert.equal(await page.locator('#foerdernEis').isDisabled(), false);

        const vorMine = await audit('vor realer Förderung');
        const h = vorMine.hash;
        assert.match(await page.locator('#rundenAktion').textContent(), /Eisförderung prüfen/);
        // Wiederholtes reines Rendern darf weder Welt noch die Live-Region verändern.
        await page.evaluate(() => {
          window.__rundenMutationen = 0;
          window.__rundenObserver = new MutationObserver(list => { window.__rundenMutationen += list.length; });
          window.__rundenObserver.observe(document.querySelector('#rundenInfo'),
            { childList: true, characterData: true, subtree: true });
        });
        await page.waitForTimeout(100);
        const beobachtung = await page.evaluate(() => {
          window.__rundenObserver.disconnect();
          return window.__rundenMutationen;
        });
        assert.equal(beobachtung, 0, 'Keine Live-Region-Neuschreibung pro Animation');
        assert.equal((await daten()).hash, h, 'Hinweis verändert nie den Core');

        await runde(); // originaler bezahlter shipMine
        assert.equal((await daten()).miner.auftrag, 'foerdern');
        for (let n = 0; n < 10; n++) {
          assert.match(await titel(), /3\/6 · Eis wird gefördert/);
          await runde(); // immer genau eine bezahlte Förderminute
        }
        const mitEis = await audit('nach bezahlter Förderung');
        assert.equal((mitEis.miner.ladung.eis || 0) - (vorMine.miner.ladung.eis || 0), 10);
        assert.ok(mitEis.s.w5n.mineLohn > vorMine.s.w5n.mineLohn, 'Löhne tatsächlich gebucht');
        assert.equal(mitEis.s.w5n.mineVerkauft, vorMine.s.w5n.mineVerkauft,
          'kein Kauf außerhalb des Docks');
        await tap('#warten'); // freiwillig früher stoppen: alle Einzelbefehle bleiben verfügbar
        assert.match(await titel(), /5\/6 · Mit Ladung zurück/);
        await runde(); // originaler shipDock
        let heimMinuten = 0;
        while ((await daten()).miner.flug.lage !== 'angedockt' && heimMinuten < 80) {
          assert.match(await titel(), /Rückflug zum Dock|Andockmanöver läuft/);
          await runde(); heimMinuten++;
        }
        assert.ok(heimMinuten > 0 && heimMinuten < 80);
        assert.match(await titel(), /6\/6 · Eis am Dock verkaufen/);
        const vorVerkauf = await audit('vor echtem Dockverkauf');
        await runde();
        const verkauf = await audit('nach Dockverkauf');
        assert.equal(verkauf.miner.ladung.eis || 0, 0);
        assert.equal(verkauf.s.w5n.mineVerkauft - vorVerkauf.s.w5n.mineVerkauft, 10);
        assert.equal(verkauf.s.stations.st_aldera.lager.eis -
          vorVerkauf.s.stations.st_aldera.lager.eis, 10);
        assert.equal(verkauf.s.owners.house.cash - vorVerkauf.s.owners.house.cash, 50);
        assert.match(await titel(), /1\/6 · Abdocken/);

        await page.evaluate(() => window.__welt.sichern());
        await page.reload();
        await page.waitForFunction(() => window.__welt &&
          /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const geladen = await audit('nach Reload');
        assert.equal(geladen.hash, verkauf.hash, 'Save/Load unverändert');
        assert.match(await titel(), /1\/6 · Abdocken/);
        assert.deepEqual(errors, [], 'keine Browserausnahmen');
        const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(overflow[0] <= overflow[1] + 1, 'kein horizontaler Touch-Überlauf');
        console.log('K1_RUNDENFUEHRUNG_OK ' + JSON.stringify({
          browser: isWebkit ? 'webkit' : 'chromium', width, height,
          anflugMinuten, heimMinuten, eis: 10, tick: geladen.s.tick, hash: geladen.hash
        }));
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
