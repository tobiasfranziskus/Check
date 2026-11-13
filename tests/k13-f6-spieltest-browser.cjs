// Isolierter, tatsächlich klickbarer K13/F6-Rule200-Spieltest in Chromium/WebKit.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.'+new URL(req.url,'http://localhost').pathname);
    if (!file.startsWith(root+'/') || !/^(prototypes|spieltest)\//.test(path.relative(root,file).replace(/\\/g,'/'))
      || !/\.(html|js|css)$/.test(file)) return res.writeHead(404).end();
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0,'127.0.0.1',done));
  const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  const browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  try {
    for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:true});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      page.on('dialog',d=>d.accept());
      const tap=async selector=>{await page.locator(selector).scrollIntoViewIfNeeded();await page.locator(selector).tap();};
      const get=()=>page.evaluate(()=>{
        const state=JSON.parse(window.__welt.zustand());
        return {state,audit:window.__welt.audit(),hash:window.__welt.hash(),bericht:window.__welt.bericht(),
          db:window.AphrosWeltSpeicher.DATENBANK};
      });
      try {
        await page.goto('http://127.0.0.1:'+server.address().port+'/spieltest/k13-f6/index.html');
        await page.waitForFunction(()=>window.__welt && /Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
        let a=await get();
        assert.equal(a.state.rulesVersion,200);
        assert.equal(a.state.kanon.industrieErz.phase,'frei');
        assert.equal(a.db,'aphros-void-welt-k13-f6-v1');
        assert.equal(await page.locator('#regel195').isDisabled(),true);
        assert.equal(a.audit.ok,true,JSON.stringify(a.audit.fehler));
        assert.equal(a.bericht.weltgeld,33000);
        assert.equal(Object.values(a.state.owners).reduce((n,x)=>n+x.cash,0),33000);
        const first=a.hash;
        await tap('nav button[data-ansicht="station"]');
        assert.equal((await get()).hash,first,'Nur Ansichtswechsel darf Core nicht verändern');
        assert.ok(a.state.stations.st_aldera.lager.frachter>0);
        await tap('#kaufFrachter');
        let b=await get();
        assert.equal(b.audit.ok,true,JSON.stringify(b.audit.fehler));
        assert.equal(b.state.owners.house.cash,a.state.owners.house.cash-750);
        assert.equal(b.state.stations.st_aldera.lager.frachter,a.state.stations.st_aldera.lager.frachter-1);
        assert.equal(Object.values(b.state.ships).filter(x=>x.owner==='house'&&x.klasse==='frachter').length,1);
        await page.evaluate(()=>window.__welt.schritte(3));
        b=await get();
        assert.equal(b.audit.ok,true,JSON.stringify(b.audit.fehler));
        assert.equal(b.bericht.weltgeld,33000);
        assert.equal(b.state.minted,0);
        assert.equal(b.state.burned,0);
        assert.deepEqual(errors,[]);
        console.log('K13_F6_BROWSER_OK',kind,width,height,b.hash);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await new Promise(done=>server.close(done)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
