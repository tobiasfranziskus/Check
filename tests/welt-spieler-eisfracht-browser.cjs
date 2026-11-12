// K1/F4: echter 50-Eis-Spielerauftrag im Touch-Cockpit, W5n Original-Core.
'use strict';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
   if(!p.startsWith(root+'/prototypes/')||!/\.(js|css|html)$/.test(p))return res.writeHead(404).end();
   try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}
   catch {res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const driver=kind==='webkit'?webkit:chromium;let browser;
 try{
  browser=await driver.launch(kind==='chromium'?{args:['--no-sandbox']}: {});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('dialog',d=>d.accept());
   const tap=async sel=>{await page.locator(sel).scrollIntoViewIfNeeded();await page.locator(sel).tap();};
   const screen=async name=>{await tap('nav button[data-ansicht="'+name+'"]');assert.equal(await page.locator('[data-seite="'+name+'"]').isVisible(),true);};
   const get=()=>page.evaluate(()=>{const s=JSON.parse(window.__welt.zustand());return {s,hash:window.__welt.hash(),audit:window.__welt.audit(),bericht:window.__welt.bericht()};});
   const good=async phase=>{
      const d=await get();assert.equal(d.audit.ok,true,phase+': '+JSON.stringify(d.audit.fehler));
      assert.equal(d.bericht.weltgeld,33000,phase+' Weltgeld');
      assert.equal(d.s.minted,0);assert.equal(d.s.burned,0);
      assert.equal(Object.values(d.s.owners).reduce((n,o)=>n+o.cash,0),33000);
      return d;
   };
   const go=n=>page.evaluate(n=>window.__welt.schritte(n),n);
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/welt/index.html');
    await page.waitForFunction(()=>window.__welt&&/Neue Welt angelegt|wiederhergestellt/.test(document.getElementById('meldung').textContent));
    await screen('konzern');await tap('#automatik');
    assert.equal((await get()).s.kanon.politik.automatik,false);
    await screen('station');await tap('#kaufFrachter');await tap('#kaufMiner');
    const b=await good('gekaufte Hüllen');
    const own=Object.values(b.s.ships).filter(s=>s.owner==='house');
    const fr=own.find(s=>s.klasse==='frachter'),miner=own.find(s=>s.klasse==='miner');
    assert.ok(fr&&miner);
    await screen('flug');await page.locator('#schiff').selectOption(fr.id);
    assert.equal(await page.locator('#frachtAnnehmen').isDisabled(),true,'kein Eis, kein Vertrag');
    assert.match(await page.locator('#frachtAngebot').textContent(),/50er-Eischarge/);
    await page.locator('#schiff').selectOption(miner.id);
    await tap('#pendelEis');
    let rest=0;
    while((await get()).s.w5n.mineVerkauft<50){
      await go(10);rest+=10;assert.ok(rest<=180,'ein echter 50-Eis-Pendel/Verkauf');
    }
    const mined=await good('wirklich geförderte 50 Eis');
    assert.ok(mined.s.stations.st_aldera.lager.eis>=50);
    await page.locator('#schiff').selectOption(fr.id);
    assert.equal(await page.locator('#frachterAufgaben').isVisible(),true);
    assert.equal(await page.locator('#frachtAnnehmen').isDisabled(),false,'echtes Angebot');
    assert.match(await page.locator('#frachtAngebot').textContent(),/490|250 ISK Warenkauf/);
    const oldHash=(await get()).hash;
    await page.locator('#frachterAufgaben').scrollIntoViewIfNeeded();
    assert.equal((await get()).hash,oldHash,'Angebot nur Anzeige');
    await tap('#frachtAnnehmen');
    const active=await good('Originalfracht gebunden');
    assert.equal(active.s.w5n.frachtauftrag.schiff,fr.id);
    assert.equal(active.s.ships[fr.id].flug.lage,'transit');
    assert.equal(active.s.owners.house.cash,mined.s.owners.house.cash-120);
    assert.equal(active.s.owners.st_nadir.cash,mined.s.owners.st_nadir.cash-490);
    assert.equal(active.s.owners.w5n_fracht_kauf.cash,490);
    assert.equal(active.s.owners.w5n_fracht_arbeit.cash,120);
    assert.equal(active.s.stations.st_aldera.lager.eis,mined.s.stations.st_aldera.lager.eis-50);
    assert.equal(await page.locator('#frachtAnnehmen').isDisabled(),true,'kein doppelter Vertrag');
    await go(60);
    const delivered=await good('Lieferung nach 60 Minuten');
    assert.equal(delivered.s.stations.st_nadir.lager.eis,50);
    assert.equal(delivered.s.w5n.eisGeliefert,50);
    assert.equal(delivered.s.owners.w5n_fracht_kauf.cash,240,'Frachtentgelt noch gebunden');
    assert.equal(delivered.s.kanon.spielerFrachten.auftraege[0].geliefert,delivered.s.tick);
    assert.equal(delivered.s.owners.pilot_house.cash,active.s.owners.pilot_house.cash+60);
    assert.match(await page.locator('#frachtFortschritt').textContent(),/geliefert/);
    await go(60);
    const end=await good('Rundfahrt abgeschlossen');
    assert.equal(end.s.w5n.frachtauftrag,null);
    assert.equal(end.s.w5n.frachtAbgeschlossen,1);
    assert.equal(end.s.ships[fr.id].phase,'dock');
    assert.equal(end.s.ships[fr.id].flug.lage,'angedockt');
    assert.equal(end.s.owners.house.cash,mined.s.owners.house.cash+120);
    assert.equal(end.s.owners.pilot_house.cash,mined.s.owners.pilot_house.cash+120);
    assert.equal(end.s.kanon.spielerFrachten.lohn,120);
    assert.equal(end.s.kanon.spielerFrachten.gebuehr,240);
    assert.equal(end.bericht.auftraege.spielerEisfracht,1);
    assert.equal(end.bericht.loehne.spielerFrachtpilot,120);
    await page.evaluate(()=>window.__welt.sichern());
    await page.reload();
    await page.waitForFunction(()=>window.__welt&&/wiederhergestellt/.test(document.getElementById('meldung').textContent));
    const loaded=await good('Save/Reload');
    assert.equal(loaded.hash,end.hash,'Hash exakt nach Reload');
    assert.deepEqual(errors,[],'keine Browserfehler');
    const size=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
    assert.ok(size[0]<=size[1]+1,'kein horizontaler Überlauf');
    console.log('K1_SPIELER_EISFRACHT_OK '+JSON.stringify({browser:kind,width,height,ship:fr.id,
      minuten:loaded.s.tick,geliefert:loaded.s.w5n.eisGeliefert,
      frachtEntgelt:240,pilotLohn:120,hash:loaded.hash}));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
