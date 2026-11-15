// P1: real visitor flow, no sample-save upload: public root → story → new career
// → authentic Rule195→204 conversion → paid miner → real RAUM cockpit → safe save/resume.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const OLD=require('../prototypes/w5ac/session.js');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const reqPath=new URL(req.url,'http://localhost').pathname;
   const file=reqPath==='/'?path.join(root,'index.html'):path.resolve(root,'.'+reqPath);
   const safe=file===path.join(root,'index.html')||file.startsWith(root+path.sep+'prototypes'+path.sep);
   if(!safe||!/\.(html|js|css)$/.test(file)){res.writeHead(404).end();return;}
   try{
    const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
    res.writeHead(200,{'Content-Type':mime[ext]||'text/plain','Cache-Control':'no-store'});
    res.end(fs.readFileSync(file));
   }catch(e){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium',factory=kind==='webkit'?webkit:chromium;
 let browser;
 try{
  browser=await factory.launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
   try{
    await page.goto(base+'/');
    const entry=page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]');
    assert.equal(await entry.count(),1,'visible first-class game entry from public root');
    await entry.tap();
    await page.waitForURL('**/prototypes/spiel/index.html');
    assert.equal(await page.locator('#startseite').isVisible(),true);
    assert.equal(await page.locator('#fortsetzen').isDisabled(),true);
    assert.equal(await page.locator('#vorige-karriere').isHidden(),true);
    assert.match(await page.locator('h1').textContent(),/APHROS\s+VOID/);
    await page.locator('#neues-spiel').tap();
    assert.equal(await page.locator('#briefing').isVisible(),true);
    assert.equal(await page.locator('.faction').count(),4);
    assert.match(await page.locator('#briefing').textContent(),/Aldera.*Nadir/s);
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    assert.equal(await page.locator('#startseite').isVisible(),false);
    assert.match(await page.locator('#hausgeld').textContent(),/3[.,]000\s*ISK/);
    assert.match(await page.locator('#weltgeld').textContent(),/33[.,]000\s*ISK/);
    assert.equal(await page.locator('#schiff-anzahl').textContent(),'0');
    const rawStart=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    const st=JSON.parse(rawStart),p=st.w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
    assert.equal(w.audit(w.load(rawStart)).ok,true);
    assert.equal(st.rulesVersion,204);assert.equal(st.tick,0);
    assert.equal(st.minted,0);assert.equal(st.burned,0);
    assert.equal(Object.values(st.owners).reduce((n,o)=>n+o.cash,0),33000);
    // J12: the Universe tab is now a live, read-only terminal in the SAME career.
    await page.locator('#tab-universum').tap();
    assert.equal(await page.locator('#panel-universum').isVisible(),true);
    const terminal=page.locator('#sektorwirtschaft');
    assert.equal(await terminal.locator('.economy-card').count()>=6,true);
    const report=await terminal.textContent();
    assert.match(report,/st_aldera/);
    assert.match(report,/st_nadir/);
    assert.match(report,/Bergbau.*npc3/);
    assert.match(report,/Außenwerft.*werft_extern/);
    assert.match(report,/33[.,]000 ISK/);
    assert.match(report,/Mint\/Burn:\\s*0 \/ 0 ISK/);
    const link=terminal.locator('[data-j12-offer="buy-st_aldera-miner"]');
    assert.equal(await link.count(),1);
    await link.tap();
    assert.equal(await page.locator('#panel-auftraege').isVisible(),true);
    assert.equal(await page.locator('[data-action="buy-st_aldera-miner"]').isEnabled(),true);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),rawStart,
      'the economy terminal cannot silently buy ships or change money');
    const buy=page.locator('[data-action="buy-st_aldera-miner"]');
    assert.equal(await buy.isEnabled(),true,'first genuine miner must be available');
    await buy.tap();
    assert.match(await page.locator('#hausgeld').textContent(),/2[.,]400\s*ISK/);
    assert.equal(await page.locator('#schiff-anzahl').textContent(),'1');
    const paid=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    const s=w.load(paid),ship=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
    assert.ok(ship);assert.equal(s.owners.house.cash,2400);assert.equal(w.audit(s).ok,true);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    await page.locator('#tab-flotte').tap();
    const enter=page.locator('[data-pilot="'+ship.id+'"]');
    assert.equal(await enter.isEnabled(),true);
    await enter.tap();
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.equal(await page.locator('#spielwelt').isVisible(),false);
    assert.match(await page.locator('#raum-schiff').textContent(),/Miner/);
    assert.equal(await page.locator('#raum-buehne').getAttribute('data-bereit'),'ja');
    await page.locator('#raum-abdocken').tap();
    const flying=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),SLOT));
    const job=flying.kanon.flugdienst[ship.id];
    assert.ok(job,'only real F6 departure may reserve worker salaries');
    assert.equal(flying.owners[job.konto].cash,40);
    assert.equal(flying.owners.house.cash,2360);
    assert.equal(flying.minted,0);assert.equal(flying.burned,0);
    assert.equal(w.audit(w.load(JSON.stringify(flying))).ok,true);
    await page.locator('#raum-konzern').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const [download]=await Promise.all([
      page.waitForEvent('download'),page.locator('#welt-export').tap()
    ]);
    assert.match(download.suggestedFilename(),/aphros-void-karriere-/);
    // Continue must use the dedicated P1 slot. No manually selected test JSON.
    const stored=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    await page.reload();
    assert.equal(await page.locator('#startseite').isVisible(),true);
    assert.equal(await page.locator('#fortsetzen').isEnabled(),true);
    await page.locator('#fortsetzen').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const resumed=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    assert.equal(w.hash(w.load(resumed)),w.hash(w.load(stored)));
    // Bad imports cannot replace the valid career.
    await page.locator('#open-menu').tap();
    assert.equal(await page.locator('#startseite').isVisible(),true);
    const [chooser]=await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('#import-aktion').tap()
    ]);
    await chooser.setFiles({
       name:'untrusted.json',mimeType:'application/json',
       buffer:Buffer.from(JSON.stringify({rulesVersion:204,schema:8,owners:{house:{cash:999999}}}))
    });
    await page.waitForFunction(()=>/nicht geladen|verweigert|laufende Karriere/i.test(document.querySelector('#menumeldung').textContent),null,{timeout:10000});
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),resumed);
    assert.deepEqual(errors,[],'console/page errors are not allowed');
    console.log('P1_GAME_BROWSER_OK',JSON.stringify({
       kind,width,height,hash:w.hash(w.load(stored)),ownedShip:ship.id,
       paid:600,reservedFlightSalary:40,money:33000,noFileUploadAtStart:true
    }));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
