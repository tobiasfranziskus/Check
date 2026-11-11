// Research-only F1 browser acceptance: one economic Core, real UX08 canvas,
// financed player ship, F0 movement, Rule196 JSON and four touch screen sizes.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..'), html = '/prototypes/flug2d/f1-demo.html';
  const server = http.createServer((req,res) => {
    const location = path.resolve(root, '.'+new URL(req.url, 'http://localhost').pathname);
    if(!location.startsWith(root+'/prototypes/') || !/\.(?:html|js)$/.test(location)){
      res.writeHead(404).end();return;
    }
    try{
      res.setHeader('Content-Type', location.endsWith('.js')?'text/javascript':'text/html');
      res.end(fs.readFileSync(location));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const type = process.env.FLUG_BROWSER === 'webkit' ? webkit : chromium, isWK=type===webkit;
  let browser;
  try {
    browser = await type.launch(isWK?{}:{args:['--no-sandbox']});
    for (const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.stack||String(e)));
      try {
        await page.goto('http://127.0.0.1:'+server.address().port+html);
        await page.waitForFunction(()=>!!window.F1Demo && F1Demo.audit().ok);
        assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
        let initial=JSON.parse(await page.evaluate(()=>F1Demo.zustand()));
        assert.equal(initial.rulesVersion,196);
        assert.equal(initial.tick,0);
        assert.equal(initial.minted,0);
        assert.equal(Object.values(initial.ships).filter(s=>s.owner==='house'&&s.klasse==='miner').length,0);
        // Real purchase, then manual touch command. No debug insertion of a free hull.
        await page.locator('#kaufen').tap();
        let purchased=JSON.parse(await page.evaluate(()=>F1Demo.zustand()));
        const player=Object.values(purchased.ships).find(s=>s.owner==='house'&&s.klasse==='miner');
        assert.ok(player?.flug,'paid owner ship should be ready at station');
        assert.ok(purchased.owners.house.cash<initial.owners.house.cash);
        assert.equal(await page.evaluate(()=>F1Demo.audit().ok),true);
        await page.locator('#dock').tap();
        let afterDock=JSON.parse(await page.evaluate(()=>F1Demo.zustand()));
        assert.equal(afterDock.ships[player.id].flug.lage,'abdocken');
        await page.locator('#minute').tap();
        afterDock=JSON.parse(await page.evaluate(()=>F1Demo.zustand()));
        assert.equal(afterDock.ships[player.id].flug.lage,'frei');
        assert.equal(afterDock.tick,1);
        await page.locator('#erz').tap();
        for(let i=0;i<11;i++)await page.locator('#minute').tap();
        let flight=JSON.parse(await page.evaluate(()=>F1Demo.zustand()));
        assert.equal(flight.tick,12);
        assert.equal(flight.ships[player.id].flug.lage,'frei');
        assert.equal(await page.evaluate(()=>F1Demo.audit().ok),true);
        // Graphical render must be a pure read (including resize).
        const stable=await page.evaluate(()=>{
          const before=F1Demo.zustand(),cacheBefore=F1Demo.grafikCache();
          for(let i=0;i<250;i++)F1Demo.rendern();
          const after=F1Demo.zustand(),cacheAfter=F1Demo.grafikCache();
          return {same:before===after,cacheBefore,cacheAfter};
        });
        assert.equal(stable.same,true);
        assert.deepEqual(stable.cacheAfter,stable.cacheBefore);
        await page.setViewportSize({width:height,height:width});
        await page.evaluate(()=>F1Demo.rendern());
        assert.equal(await page.evaluate(()=>F1Demo.zustand()), JSON.stringify(flight));
        // Save/Load: explicit import with a dialog, no browser storage.
        const before=await page.evaluate(()=>F1Demo.zustand());
        // Native <details> is closed initially; open it before exercising a real
        // user-visible export. A hidden button cannot receive a touch tap.
        await page.locator('#steuerung details summary').tap();
        const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').tap()]);
        assert.equal(download.suggestedFilename(),'aphros-f1-forschung-regel196.json');
        page.once('dialog',dlg=>dlg.accept());
        await page.locator('#import').setInputFiles({name:'f1.json',mimeType:'application/json',buffer:Buffer.from(before)});
        await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Import erfolgreich'));
        assert.equal(await page.evaluate(()=>F1Demo.zustand()),before);
        const foreign=JSON.parse(before);foreign.rulesVersion=195;
        await page.locator('#import').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(foreign))});
        await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Import abgewiesen'));
        assert.equal(await page.evaluate(()=>F1Demo.zustand()),before);
        // Cross-engine F1 research reference: the SAME actually paid
        // NPC/player Erz/Eis roundtrip pinned in the independent Node22 test.
        const reference = await page.evaluate(() => {
          const f = F1Kopplung.erstellen({carrierCash:2000,buyerCash:4000});
          const s = f.createState(3301);
          const call = cmd => { const r=f.execute(s,cmd);if(!r.ok)throw Error(r.reason); };
          call({type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
          const ships = Object.values(s.ships);
          const npc = ships.find(x=>x.owner==='npc3'&&x.klasse==='miner');
          const own = ships.find(x=>x.owner==='house'&&x.klasse==='miner');
          for(const x of [npc,own])call({type:'shipUndock',owner:x.owner,schiff:x.id});
          f.fliegen(s,40);
          for(const [x,ware] of [[npc,'erz'],[own,'eis']])
            call({type:'shipApproach',owner:x.owner,schiff:x.id,zielArt:'feld',ziel:'aldera:'+ware});
          f.fliegen(s,1217);
          const saved=f.save(s), copy=f.load(saved);
          for(const x of [npc,own]){
            const cmd={type:'shipDock',owner:x.owner,schiff:x.id,station:'st_aldera'};
            call(cmd);const q=f.execute(copy,cmd);if(!q.ok)throw Error(q.reason);
          }
          f.fliegen(s,800);f.fliegen(copy,800);
          return {hash:f.hash(s),equal:f.canonical(s)===f.canonical(copy),
            audit:f.audit(s).ok,tick:s.tick,schritt:s.flug.schritt};
        });
        assert.deepEqual(reference,{hash:'ddb96b7b2164c1fb',equal:true,audit:true,tick:34,schritt:17},
          'F1 Node/Chromium/WebKit research hash mismatch');
        assert.equal(await page.evaluate(()=>F1Demo.zustand()),before,
          'Independent cross-engine replay must not mutate browser gameplay session');
        assert.deepEqual(errors,[]);
        console.log('F1_I0_BROWSER_OK '+(isWK?'WebKit':'Chromium')+' '+width+'x'+height+
          ' tick='+flight.tick+' cash='+purchased.owners.house.cash+' hash='+reference.hash);
      } finally {await context.close();}
    }
  } finally {
    if(browser)await browser.close();
    server.close();
  }
})().catch(err=>{console.error(err);process.exitCode=1;});
