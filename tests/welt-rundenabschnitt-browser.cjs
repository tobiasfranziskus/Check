// K1-UX: explizit begrenztes Abschnittssimulieren muss bitidentisch sein zu
// denselben einzelnen Original-Core-Minuten. Keine neuen Aufträge oder Käufe.
'use strict';
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), http = require('node:http'), path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/prototypes/') || !/\.(html|css|js)$/.test(file)) {
      res.writeHead(404).end(); return;
    }
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' :
        file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const isWebkit = process.env.WELT_BROWSER === 'webkit';
  const browserName = isWebkit ? 'webkit' : 'chromium';
  let browser;
  try {
    browser = await (isWebkit ? webkit : chromium).launch(isWebkit ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const results = [];
      for (const schnell of [false, true]) {
        const context = await browser.newContext({
          viewport: { width, height }, hasTouch: true, acceptDownloads: true,
        });
        const page = await context.newPage(), errors = [];
        page.on('pageerror', err => errors.push(String(err)));
        page.on('dialog', dialog => dialog.accept());
        const tap = async id => { const p = page.locator(id); await p.scrollIntoViewIfNeeded(); await p.tap(); };
        const zustand = () => page.evaluate(() => {
          const s = JSON.parse(window.__welt.zustand());
          return { s, hash: window.__welt.hash(), audit: window.__welt.audit(),
            weltgeld: window.__welt.bericht().weltgeld,
            miner: Object.values(s.ships).find(sh => sh.owner === 'house' && sh.klasse === 'miner') };
        });
        const assertAudit = async phase => {
          const d = await zustand();
          assert.equal(d.audit.ok, true, phase + ': ' + JSON.stringify(d.audit.fehler));
          assert.equal(d.weltgeld, 33000, phase + ': keine Geldemission');
          assert.equal(d.s.minted, 0); assert.equal(d.s.burned, 0);
          assert.equal(Object.values(d.s.owners).reduce((n, v) => n + v.cash, 0),
            33000, phase + ': unabhängige Eigentümerkassen');
          return d;
        };
        const simuliere = async (n, phase) => {
          const start = await zustand();
          if (schnell) {
            assert.equal(await page.locator('#rundenAbschnitt').isEnabled(), true,
              phase + ': Abschnitt durch UI verfügbar');
            await tap('#rundenAbschnitt');
          } else {
            await page.evaluate(n => window.__welt.schritte(n), n);
          }
          const d = await assertAudit(phase);
          assert.equal(d.s.tick - start.s.tick, n,
            phase + ': exakt ' + n + ' echte Core-Minuten; kein zusätzlicher UI-Tick');
          return d;
        };
        try {
          await page.goto('http://127.0.0.1:' + server.address().port + '/prototypes/welt/index.html');
          await page.waitForFunction(() => window.__welt &&
            /Neue Welt angelegt|wiederhergestellt/.test(document.querySelector('#meldung').textContent));
          const start = await assertAudit('Anfang');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'ohne eigenen aktiven Vorgang kein Abschnitt');
          await tap('nav button[data-ansicht="station"]');
          await tap('#kaufMiner');
          await tap('nav button[data-ansicht="flug"]');
          const kauf = await assertAudit('Kauf');
          assert.equal(kauf.s.owners.house.cash, start.s.owners.house.cash - 600,
            'echt finanzierter Miner, keine Gratis-Hülle');
          assert.ok(kauf.miner && kauf.miner.flug.lage === 'angedockt');

          // Alle Originalbefehle bleiben separat betätigbar; die beschleunigte
          // Variante bedient dieselben bewussten Aktionen durch die Begleithilfe.
          await tap(schnell ? '#rundenAktion' : '#abdocken');
          assert.equal((await zustand()).miner.flug.lage, 'abdocken');
          await simuliere(1, 'Abdocken');
          assert.equal((await zustand()).miner.flug.lage, 'frei');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'ohne begonnenen Flug keine Vorwegnahme des Zielflugs');
          await tap(schnell ? '#rundenAktion' : '#zumEis');
          const anflug = await simuliere(10, 'Eisfeldanflug');
          assert.equal(anflug.miner.flug.modus, 'anflug',
            'Original-Anflugmodus darf am Feld erhalten bleiben');
          assert.equal(await page.locator('#foerdernEis').isEnabled(), true,
            'die autoritative Orts- und Tempoprüfung erlaubt realen Abbau');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'keine automatische Förderung');

          await tap(schnell ? '#rundenAktion' : '#foerdernEis');
          assert.equal((await zustand()).miner.auftrag, 'foerdern');
          const vorher = await zustand();
          const abbau = await simuliere(50, 'volle bezahlte Eischarge');
          assert.equal((abbau.miner.ladung.eis || 0) - (vorher.miner.ladung.eis || 0),
            50, '50 echte Eis');
          assert.equal(abbau.s.w5n.mineLohn - vorher.s.w5n.mineLohn, 100,
            '50 × 2 ISK reale Förderlöhne');
          assert.equal(abbau.s.w5n.mineVerkauft, vorher.s.w5n.mineVerkauft,
            'kein Verkauf im Feld');
          assert.equal(abbau.miner.auftrag, 'foerdern',
            'Core begrenzt die freie Förderung NICHT künstlich auf eine Handelscharge');
          assert.match(await page.locator('#rundenTitel').textContent(),
            /Handelscharge erreicht/, 'UI empfiehlt freiwilligen Stopp bei Original-50er-W5-Charge');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'nach realer Handelscharge kein automatischer Weiterabbau');
          await tap(schnell ? '#rundenAktion' : '#warten');
          assert.equal((await zustand()).miner.auftrag, 'halten',
            'Spieler bestätigt den Original-Förderstopp');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'kein automatischer Rückflug');
          await tap(schnell ? '#rundenAktion' : '#andocken');
          const rueck = await simuliere(11, 'Dockrückflug');
          assert.equal(rueck.miner.flug.lage, 'angedockt');
          assert.equal(rueck.miner.ladung.eis, 50, 'Eigentum bis zur Abnahme an Bord');
          assert.equal(await page.locator('#rundenAbschnitt').isDisabled(), true,
            'kein automatischer Verkauf');
          const vorVerkauf = await zustand();
          await tap(schnell ? '#rundenAktion' : '#verkaufen');
          const verkauf = await assertAudit('echter Dockverkauf');
          assert.equal(verkauf.miner.ladung.eis || 0, 0, 'nicht doppelt verkaufbare Ladung');
          assert.equal(verkauf.s.w5n.mineVerkauft - vorVerkauf.s.w5n.mineVerkauft, 50);
          assert.equal(verkauf.s.stations.st_aldera.lager.eis -
            vorVerkauf.s.stations.st_aldera.lager.eis, 50);
          assert.equal(verkauf.s.owners.house.cash - vorVerkauf.s.owners.house.cash, 250,
            '250 ISK real vom Stationskonto');
          assert.equal(await page.locator('#verkaufen').isDisabled(), true);
          assert.equal(verkauf.s.tick, 72, 'echte 1+10+50+11 Minuten');
          const gespeichert = verkauf.hash;
          await page.evaluate(() => window.__welt.sichern());
          await page.reload();
          await page.waitForFunction(() => window.__welt &&
            /wiederhergestellt/.test(document.querySelector('#meldung').textContent));
          assert.equal((await assertAudit('Reload')).hash, gespeichert,
            'Save/Load bitgleich');
          assert.deepEqual(errors, [], 'keine Browserausnahmen');
          const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
          assert.ok(overflow[0] <= overflow[1] + 1, 'Touch-Screen ohne horizontalen Überlauf');
          results.push({ mode: schnell ? 'abschnitt' : 'einzelminuten', hash: gespeichert,
            zustand: JSON.stringify(verkauf.s), tick: verkauf.s.tick });

          if (schnell) {
            // Grenzfall: Nach echtem manuellen Langflug weit vom Eisfeld entfernt
            // dauert ein neuer Original-Anflug länger als die UI-Grenze von 60 min.
            // Die Abschnittstaste darf keinesfalls 61+ Ticks ausführen.
            await tap('#abdocken');
            await page.evaluate(() => window.__welt.schritte(1));
            assert.equal(await page.locator('#pilotAnwenden').isEnabled(), true);
            await page.locator('#pilotFahrt').evaluate(el => {
              el.value = '100';
              el.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await tap('#pilotAnwenden'); // Original-shipSteer statt Testmanipulation
            await page.evaluate(() => window.__welt.schritte(70));
            const weit = await assertAudit('echter manueller Langflug');
            assert.ok(weit.miner.flug.x >= 6000000,
              'Miner hat sich per Originalsteuerung deutlich vom Eisfeld entfernt');
            assert.equal(weit.miner.flug.lage, 'frei');
            await tap('#zumEis'); // Original-Zielflug
            assert.equal(await page.locator('#rundenAbschnitt').isEnabled(), true);
            const vorGrenze = await zustand();
            await tap('#rundenAbschnitt');
            const nachGrenze = await assertAudit('60-Minuten-Grenze');
            assert.equal(nachGrenze.s.tick - vorGrenze.s.tick, 60,
              'Abschnittstaste führt auch bei fernem Ziel maximal 60 echte Minuten aus');
            assert.equal(nachGrenze.miner.flug.lage, 'frei',
              'keine kostenlose Teleportation oder Dockung');
          }
        } finally { await context.close(); }
      }
      assert.equal(results[0].hash, results[1].hash, 'identischer Original-Referenzhash');
      assert.equal(results[0].zustand, results[1].zustand, 'vollständig identischer Kernzustand');
      console.log('K1_ABSCHNITT_OK ' + JSON.stringify({
        browser: browserName, width, height, tick: results[1].tick,
        eis: 50, erloes: 250, hash: results[1].hash,
      }));
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
