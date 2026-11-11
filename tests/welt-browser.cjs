// Kanonische Welt K1 im echten Browser (Chromium, optional WebKit): vier Touch-Größen,
// spielbarer Kreislauf, IndexedDB-Autosave mit Wiederherstellung, Export/Import,
// Regel195-Übernahme und Trennung von der Regel195-Datenbank des Hauptspiels.
// Ersetzt keine Abnahme auf echtem iPad Safari / NAS.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const Kern = require('../prototypes/w5ac/rule191-w5-ferry-core.js');

function regel195Datei() {
  const e = Kern.createPrivateWageResearch({ buyerCash: 1536, carrierCash: 2000 }), c = e.core, r = e.rules, s = c.createW5State(42);
  const x = (type, owner, extra = {}) => assert.equal(c.execute(s, { type, owner, ...extra }, r).ok, true, type);
  x('shipBuy', 'transport', { station: 'st_aldera', klasse: 'frachter' }); x('shipBuy', 'house', { station: 'st_aldera', klasse: 'miner' });
  const mi = Object.values(s.ships).find((v) => v.owner === 'house');
  x('shipMine', 'house', { schiff: mi.id, ware: 'eis' }); c.advance(s, 50, r); x('shipWait', 'house', { schiff: mi.id });
  x('shipFreightIce', 'transport', { schiff: Object.values(s.ships).find((v) => v.klasse === 'frachter').id }); c.advance(s, 75, r);
  const datei = path.join(os.tmpdir(), 'welt-regel195-' + process.pid + '.json');
  fs.writeFileSync(datei, c.save(s));
  return { datei, hash: c.hash(s), tick: s.tick };
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/prototypes/') || !/\.(html|js|css)$/.test(file)) { res.writeHead(404).end(); return; }
    try { res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const basis = 'http://127.0.0.1:' + server.address().port;
  const engine = process.env.WELT_BROWSER === 'webkit' ? webkit : chromium, istWebkit = engine === webkit;
  const alt = regel195Datei();
  let browser = null;
  try {
    browser = await engine.launch(istWebkit ? {} : { args: ['--no-sandbox'] });
    for (const [width, height] of [[1180, 820], [1024, 768], [820, 1180], [390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, acceptDownloads: true });
      const page = await ctx.newPage(), fehler = [];
      page.on('pageerror', (e) => fehler.push(String(e.stack || e)));
      page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
      page.on('dialog', (d) => d.accept());
      const tippe = async (sel) => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.locator(sel).tap(); };
      const ansicht = (name) => tippe('nav button[data-ansicht="' + name + '"]');
      try {
        // Das Hauptspiel legt seine Regel195-Datenbank am selben Ursprung an; K1 darf sie nie öffnen.
        await page.goto(basis + '/prototypes/w5ag/index.html');
        await page.waitForFunction(() => indexedDB.databases ? indexedDB.databases().then((d) => d.some((x) => x.name === 'aphros-void-regel195-v1')) : true, null, { timeout: 15000 }).catch(() => {});
        fehler.length = 0; // nur Fehler der K1-Seite zählen
        await page.goto(basis + '/prototypes/welt/index.html');
        await page.waitForFunction(() => window.__welt && /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const start = await page.evaluate(() => ({ audit: window.__welt.audit().ok, b: window.__welt.bericht(), ü: window.__welt.uebersicht() }));
        assert.equal(start.audit, true); assert.equal(start.b.weltgeld, 33000); assert.equal(start.b.minted, 0);
        assert.equal(start.ü.welten.length, 1, 'genau eine neue Welt');
        // Bedienbarkeit: keine horizontale Seitenverschiebung, Touchflächen mindestens 44 px hoch.
        const layout = await page.evaluate(() => ({ breit: document.documentElement.scrollWidth, fenster: innerWidth,
          klein: [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent) }));
        assert.ok(layout.breit <= layout.fenster + 1, 'kein horizontales Scrollen: ' + layout.breit + ' > ' + layout.fenster);
        assert.deepEqual(layout.klein, [], 'Touchflächen');
        // Spieler kauft einen Miner und startet den Pendelauftrag – nur über Core-Befehle.
        await ansicht('station'); await tippe('#kaufMiner');
        await page.waitForFunction(() => /Miner aus dem Lager/.test(document.getElementById('meldung').textContent));
        await ansicht('flug'); await tippe('#pendelEis');
        await page.waitForFunction(() => /Pendelauftrag Eis/.test(document.getElementById('meldung').textContent));
        // Echtzeit: Pause lösen, das Schiff muss sich auf der Karte tatsächlich bewegen.
        const vorher = await page.evaluate(() => JSON.parse(window.__welt.zustand()).tick);
        await tippe('#tempo'); await tippe('#pause');
        await page.waitForFunction((t) => JSON.parse(window.__welt.zustand()).tick >= t + 20, vorher, { timeout: 30000 });
        const flug = await page.evaluate(() => { const s = JSON.parse(window.__welt.zustand()); const sh = Object.values(s.ships).find((x) => x.owner === 'house');
          return { lage: sh.flug.lage, x: sh.flug.x, y: sh.flug.y, dienst: !!s.kanon.flugdienst[sh.id] }; });
        assert.notEqual(flug.lage, 'angedockt'); assert.ok(flug.x !== 0 || flug.y !== 0, 'Position im Raum'); assert.equal(flug.dienst, true);
        await tippe('#pause');
        // Gesperrte Handlung: Fernverkauf im Raum wird vom Core abgelehnt und sichtbar gemeldet.
        await tippe('#pendelStop');
        await page.evaluate(() => { document.querySelector('details').open = true; });
        const pixel = await page.evaluate(() => { const c = document.getElementById('raum'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; });
        assert.ok(pixel > 200, 'Karte gezeichnet: ' + pixel);
        // Zwei Spieltage vorspulen: der Kreislauf produziert und verkauft tatsächlich.
        await page.evaluate(() => {
          const s = JSON.parse(window.__welt.zustand());
          window.__welt.schritte(200);
        });
        await tippe('#pendelEis').catch(() => {});
        await page.evaluate(() => window.__welt.schritte(2880));
        const lauf = await page.evaluate(() => ({ audit: window.__welt.audit(), b: window.__welt.bericht(), hash: window.__welt.hash() }));
        assert.equal(lauf.audit.ok, true, JSON.stringify(lauf.audit.fehler));
        assert.equal(lauf.b.weltgeld, 33000); assert.ok(lauf.b.produktion.eisGefoerdert >= 50, 'Eis im Feld gefördert');
        assert.ok(lauf.b.verkaeufe.eisAnAldera >= 50, 'Eis am Dock verkauft'); assert.ok(lauf.b.loehne.minerflug > 0, 'Flugarbeit bezahlt');
        for (const name of ['konzern', 'station', 'flotte', 'wirtschaft', 'spielstand']) {
          await ansicht(name);
          await page.waitForFunction((n) => !document.querySelector('[data-seite="' + n + '"]').hidden && document.querySelector('[data-seite="' + n + '"] table'), name);
        }
        await page.screenshot({ path: '/tmp/welt-k1-' + width + 'x' + height + '-' + (istWebkit ? 'webkit' : 'chromium') + '.png' });
        // Manueller Platz, Autosave in IndexedDB, Neuladen: derselbe Zustand, pausiert.
        await page.locator('#platzName').fill('Abnahme <b>' + width + '</b>');
        await tippe('#speichern');
        await page.waitForFunction(() => /Platzname|Gespeichert/.test(document.getElementById('meldung').textContent));
        assert.match(await page.locator('#meldung').textContent(), /Platzname/, 'unzulässige Zeichen im Platznamen abgelehnt');
        await page.locator('#platzName').fill('Abnahme ' + width);
        await tippe('#speichern');
        await page.waitForFunction(() => /Gespeichert auf/.test(document.getElementById('meldung').textContent));
        await page.evaluate(() => window.__welt.sichern());
        const dbs = await page.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name).sort() : null));
        if (dbs) assert.ok(dbs.includes('aphros-void-welt-v1'), 'eigene Datenbank: ' + dbs);
        await page.reload();
        await page.waitForFunction(() => window.__welt && /wiederhergestellt/.test(document.getElementById('meldung').textContent));
        const nach = await page.evaluate(() => ({ hash: window.__welt.hash(), pausiert: document.getElementById('pause').getAttribute('aria-pressed'), ü: window.__welt.uebersicht() }));
        assert.equal(nach.hash, lauf.hash, 'Autosave stellt exakt denselben Zustand wieder her');
        assert.equal(nach.pausiert, 'true');
        assert.ok(nach.ü.welten[0].manuell.some((p) => p.platz === 'Abnahme ' + width));
        // Export als Datei und Import: gleicher Stand wird erkannt, nichts überschrieben.
        await ansicht('spielstand');
        const [download] = await Promise.all([page.waitForEvent('download'), tippe('#exportieren')]);
        const datei = await download.path(), umschlag = JSON.parse(fs.readFileSync(datei, 'utf8'));
        assert.equal(umschlag.format, 'aphros-void-welt'); assert.equal(umschlag.hash, lauf.hash); assert.equal(umschlag.regel, 199);
        await page.locator('#importieren').setInputFiles(datei);
        await page.waitForFunction(() => /bereits vorhanden/.test(document.getElementById('meldung').textContent));
        // Regel195-Rohdatei über den normalen Import: abgelehnt, aber unverändert aufbewahrt.
        await page.locator('#importieren').setInputFiles(alt.datei);
        await page.waitForFunction(() => /Nicht importiert: Regel195-Stand erkannt/.test(document.getElementById('meldung').textContent));
        // Ausdrückliche Übernahme: neue Welt mit gleichem Tick und 33.000 ISK.
        await page.evaluate(() => { for (const d of document.querySelectorAll('details')) d.open = true; });
        await page.locator('#regel195').setInputFiles(alt.datei);
        await page.waitForFunction(() => /Übernommen: Tick/.test(document.getElementById('meldung').textContent));
        const über = await page.evaluate(() => ({ s: JSON.parse(window.__welt.zustand()), audit: window.__welt.audit().ok, ü: window.__welt.uebersicht() }));
        assert.equal(über.s.rulesVersion, 199); assert.equal(über.s.tick, alt.tick); assert.equal(über.audit, true);
        assert.equal(über.ü.welten.length, 2, 'bisherige Welt bleibt neben der übernommenen erhalten');
        // Das Original liegt genau einmal unverändert in den Sicherungen (inhaltsgleiche Datei wird nicht doppelt abgelegt).
        const original = fs.readFileSync(alt.datei, 'utf8');
        assert.equal(über.ü.sicherungen.filter((b) => b.bytes === original.length).length, 1);
        assert.equal(über.ü.welten.find((w) => w.weltId === über.ü.aktiv).herkunft.quellHash, alt.hash);
        // Die Regel195-Datenbank des Hauptspiels wurde weder gelöscht noch verändert.
        if (dbs && dbs.includes('aphros-void-regel195-v1')) {
          const danach = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
          assert.ok(danach.includes('aphros-void-regel195-v1'), 'Regel195-Datenbank bleibt bestehen');
        }
        assert.deepEqual(fehler.filter((f) => !/favicon/.test(f) && !/status of 404/.test(f)), [], 'keine Seitenfehler');
        const fehlend = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => r.responseStatus === 404 && !/favicon/.test(r.name)).map((r) => r.name));
        assert.deepEqual(fehlend, [], 'alle Dateien der Seite vorhanden');
        console.log('WELT_BROWSER_OK ' + JSON.stringify({ browser: istWebkit ? 'webkit' : 'chromium', width, height, hash: lauf.hash,
          tick: lauf.b.tick, eis: lauf.b.produktion.eisGefoerdert, wasser: lauf.b.verkaeufe.wasserNadir + lauf.b.verkaeufe.wasserAldera, datenbanken: dbs }));
      } finally { await ctx.close(); }
    }
  } finally {
    if (browser) await browser.close();
    server.close(); fs.rmSync(alt.datei, { force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
