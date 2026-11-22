// Independent J11+P1 acceptance: public one-click career -> paid ships -> real F4 voyage.
// No sample save import, no NPC authority, original Rule204 core and dedicated P1 save slot.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const SLOT_W6='aphros-void:spielerkarriere:regel207-forschung:v1';
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://localhost');
   const name=url.pathname==='/'?'/index.html':url.pathname;
   const file=path.resolve(root,'.'+name);
   if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
   try{
     const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
     res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');
     res.setHeader('Cache-Control','no-store');
     res.end(fs.readFileSync(file));
   }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const binary=kind==='webkit'?webkit:chromium;
 let browser;
 try{
  browser=await binary.launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try {
     await page.goto(base+'/');
     await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]').tap();
     await page.waitForURL('**/prototypes/spiel/index.html');
     await page.locator('#neues-spiel').tap();
     await page.locator('#karriere-starten').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true,'real career no upload needed');
     assert.equal(await page.locator('#schiff-anzahl').textContent(),'0','no free starting ship');
     const init=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
     assert.equal(init.rulesVersion,204);assert.equal(init.owners.house.cash,3000);
     assert.equal(Object.values(init.owners).reduce((n,x)=>n+x.cash,0),33000);
     await page.locator('[data-action="buy-st_aldera-frachter"]').tap();
     await page.locator('[data-action="buy-st_aldera-miner"]').tap();
     assert.equal(await page.locator('#schiff-anzahl').textContent(),'2');
     const paid=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
     assert.equal(paid.owners.house.cash,1650,'real 750-ISK freight + 600-ISK miner buy');
     const own=Object.values(paid.ships).filter(x=>x.owner==='house');
     const miner=own.find(x=>x.klasse==='miner'),freighter=own.find(x=>x.klasse==='frachter');
     assert.ok(miner);assert.ok(freighter);
     assert.ok(paid.kanon.spielerFrachterKaeufe.some(k=>k.id===freighter.id&&k.preis===750));
     const quote=page.locator('[data-action="ice-'+miner.id+'"]');
     assert.equal(await quote.isEnabled(),true,'only original house miner can start ice shuttle');
     await quote.tap();
     await page.locator('[data-advance="60"]').tap();
     await page.locator('[data-advance="60"]').tap();
     const freightOffer=page.locator('[data-action="freight-'+freighter.id+'"]');
     assert.equal(await freightOffer.count(),1,'original F4 freight now surfaced in career UI');
     assert.equal(await freightOffer.isEnabled(),true,'ice and company budgets fund F4');
     await page.locator('#tab-flotte').tap();
     const enter=page.locator('[data-pilot="'+freighter.id+'"]');
     assert.equal(await enter.isEnabled(),true);
     await enter.tap();
     assert.equal(await page.locator('#raumbereich').isVisible(),true);
     assert.match(await page.locator('#raum-schiff').textContent(),/Frachter/);
     const contract=page.locator('[data-raum="dock-eisfracht"]');
     assert.equal(await contract.isEnabled(),true,'only original, funded core F4 offer');
     await contract.tap();
     assert.match(await page.locator('#raum-lage').textContent(),/Transit/);
     assert.match(await page.locator('#raum-reserve').textContent(),/120 ISK Vertragslohn/);
     assert.match(await page.locator('#raum-ladung').textContent(),/Regel204 sperrt freie Steuerung/);
     assert.equal(await page.locator('#raum-knueppel').evaluate(x=>x.classList.contains('aus')),true);
     const exported=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     const raw=JSON.parse(exported),p=raw.w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),s=w.load(exported);
     assert.equal(w.audit(s).ok,true);
     assert.equal(s.w5n.frachtauftrag.schiff,freighter.id);
     assert.equal(s.ships[freighter.id].ladung.eis,50);
     assert.equal(s.minted,0);assert.equal(s.burned,0);
     assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
     await page.locator('#raum-konzern').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true);
     await page.locator('[data-advance="60"]').tap();
     await page.locator('[data-advance="60"]').tap();
     const complete=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     const c=w.load(complete);
     assert.equal(w.audit(c).ok,true);
     assert.equal(c.kanon.spielerFrachten.auftraege[0].end!==null,true,'real original F4 delivery completed');
     assert.equal(c.kanon.spielerFrachten.lohn,120);
     assert.equal(c.kanon.spielerFrachten.gebuehr,240);
     assert.equal(c.minted,0);assert.equal(c.burned,0);
     assert.equal(Object.values(c.owners).reduce((n,o)=>n+o.cash,0),33000);
     const hash=w.hash(c);
     await page.reload();
     await page.locator('#fortsetzen').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true);
     const resumed=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     assert.equal(w.hash(w.load(resumed)),hash,'same saved career and original world hash');
     // M4: Blindtest-Neustart aus einem bereits belegten Karriere-Slot.
     // Ablehnung darf weder Slot noch World-State antasten; Zustimmung beginnt Seed 42 neu.
     await page.locator('#open-menu').tap();
     await page.locator('#neues-spiel').tap();
     let dialogText='';
     page.once('dialog',async dialog=>{dialogText=dialog.message();await dialog.dismiss();});
     await page.locator('#karriere-starten').tap();
     assert.match(dialogText,/schon ein Spielstand|bisherige Version/i,'existing save prompts before replacement');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),resumed,'cancel must not replace saved career');
     page.once('dialog',dialog=>dialog.accept());
     await page.locator('#karriere-starten').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true,'confirmed new career reaches the world');
     const freshText=await page.evaluate(k=>localStorage.getItem(k),SLOT),fresh=JSON.parse(freshText);
     assert.equal(fresh.tick,0,'new career must start at world minute zero');
     assert.equal(fresh.owners.house.cash,3000,'original initial budget restored');
     assert.equal(Object.values(fresh.ships).filter(s=>s.owner==='house').length,0,'no carry-over owned ships');
     assert.equal(fresh.minted,0);assert.equal(fresh.burned,0);
     assert.equal(Object.values(fresh.owners).reduce((n,o)=>n+o.cash,0),33000);
     assert.equal(w.audit(w.load(freshText)).ok,true,'fresh original economy is balanced');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT+':vorherige'),resumed,
       'replaced career is available in the established backup slot');
     await page.reload();await page.locator('#fortsetzen').tap();
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),freshText,
       'new, not previous career resumes after reload');
     // M4 blindtest P1: switching between distinct career slots must work in the
     // same browser tab, without reloading or overwriting either world.
     await page.locator('#open-menu').tap();
     await page.locator('#neues-spiel').tap();
     await page.locator('#w6-p8g-start').check();
     page.once('dialog',dialog=>dialog.accept()); // Explicit Rule207 research authorization.
     await page.locator('#karriere-starten').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true,'Dravos starts in same tab');
     await page.locator('[data-advance="1"]').tap();
     const dravosText=await page.evaluate(k=>localStorage.getItem(k),SLOT_W6);
     assert.equal(JSON.parse(dravosText).rulesVersion,207);
     assert.equal(JSON.parse(dravosText).tick,1,'research time distinctly advanced');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),freshText,
       'research launch must leave standard slot untouched');
     await page.evaluate(()=>{document.getElementById('auftrag-meldung').textContent='Alter Auftrag aus anderer Karriere · Tick 2350';});
     await page.locator('#open-menu').tap();
     await page.locator('#fortsetzen').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true,'standard career selected despite active Dravos');
     assert.match(await page.locator('#auftrag-belege').textContent(),/Belegstand: Tick 0/,'standard world loaded in memory');
     assert.equal(await page.locator('#auftrag-meldung').textContent(),
       'Noch kein Auftrag in dieser Sitzung angeklickt.','transient order feedback cleared on switch');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),freshText);
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT_W6),dravosText);
     await page.evaluate(()=>{document.getElementById('auftrag-meldung').textContent='Alte Standardfracht · Tick 2350';});
     await page.locator('#open-menu').tap();
     await page.locator('#fortsetzen-w6').tap();
     assert.equal(await page.locator('#spielwelt').isVisible(),true,'research career selected despite active standard');
     assert.match(await page.locator('#auftrag-belege').textContent(),/Belegstand: Tick 1/,'Dravos world restored in memory');
     assert.equal(await page.locator('#auftrag-meldung').textContent(),
       'Noch kein Auftrag in dieser Sitzung angeklickt.','no stale standard order in Dravos');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),freshText,'standard save preserved');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT_W6),dravosText,'Dravos save preserved');
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT_W6+':vorherige'),null,
       'switching does not create an unwanted backup or overwrite');
     assert.deepEqual(errors,[],'browser must not report exceptions');
     console.log('J11_P1_GAME_BROWSER_OK',JSON.stringify({
       browser:kind,width,height,seed:42,freighter:freighter.id,miner:miner.id,
       paidFrachter:750,paidMiner:600,paidF4Labor:120,paidF4Fee:240,
       endHash:hash,worldMoney:33000,mint:0,burn:0
     }));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
