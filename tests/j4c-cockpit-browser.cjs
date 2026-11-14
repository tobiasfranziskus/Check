// J4c: echtes 2D-Touch-Cockpit in Chromium UND WebKit, vier iPad-/Mobilgrößen.
// Der tatsächlich bezahlte Spielstand wird durch den identischen Node22-Weltkern
// erstellt, nicht durch manipulierten Browserzustand oder eine Gratis-Hülle.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const Welt=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const filename=path.join(root,'artifacts/j4c-jaeger/aphros-j4c-echt-finanziert-seed-42-regel204.json');
 if(!fs.existsSync(filename)){
  execFileSync(process.execPath,[path.join(root,'tools/j4c-authentisches-beispiel.mjs')],
    {cwd:root,timeout:120000,stdio:'pipe'});
 }
 assert.ok(fs.existsSync(filename));
 const proven=JSON.parse(fs.readFileSync(filename,'utf8'));
 const originalW=Welt.erstellenJ4c({carrierCash:proven.w5ad.profile.carrierCash,
   buyerCash:proven.w5ad.profile.buyerCash});
 assert.equal(originalW.audit(proven).ok,true,JSON.stringify(originalW.audit(proven).fehler));
 assert.equal(proven.ships.sh023.owner,'house');
 assert.equal(proven.ledger.jaeger.consumed,1);
 const server=http.createServer((req,res)=>{
  const dest=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!dest.startsWith(root+'/prototypes/')||!/[.]((html)|(js)|(css))$/.test(dest)){
   res.writeHead(404).end();return;
  }
  try{res.setHeader('Content-Type',dest.endsWith('.js')?'text/javascript':
    dest.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(dest));}
  catch(_){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browserKind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (browserKind==='webkit'?webkit:chromium).launch(
   browserKind==='webkit'?{}:{args:['--no-sandbox']});
 try{
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errs=[];
   page.on('pageerror',e=>errs.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/j4c/index.html');
    assert.match(await page.title(),/bezahlter Jäger/);
    assert.equal(await page.locator('#abdocken').isDisabled(),true);
    await page.locator('#datei').setInputFiles(filename);
    await page.waitForFunction(()=>document.querySelector('#schiff').textContent.includes('sh023'));
    assert.match(await page.locator('#meldung').textContent(),/Geprüfter, real bezahlter Jäger/);
    assert.match(await page.locator('#cash').textContent(),/1[.]589 ISK/);
    assert.match(await page.locator('#weltgeld').textContent(),/33[.]000 ISK/);
    assert.match(await page.locator('#audit').textContent(),/OK/);
    assert.equal(await page.locator('#abdocken').isDisabled(),false);
    await page.locator('#abdocken').scrollIntoViewIfNeeded();
    await page.locator('#abdocken').tap();
    assert.match(await page.locator('#reserve').textContent(),/40 ISK/);
    assert.match(await page.locator('#cash').textContent(),/1[.]549 ISK/);
    await page.locator('#play').scrollIntoViewIfNeeded();
    await page.locator('#play').tap();
    await page.waitForFunction(()=>document.querySelector('#lage').textContent==='frei',{timeout:9000});
    await page.locator('#ziel').scrollIntoViewIfNeeded();
    await page.locator('#ziel').tap();
    assert.match(await page.locator('#meldung').textContent(),/shipFlyTo bestätigt/);
    await page.locator('#play').scrollIntoViewIfNeeded();await page.locator('#play').tap();
    assert.match(await page.locator('#audit').textContent(),/OK/);
    const [download]=await Promise.all([
      page.waitForEvent('download'),
      (async()=>{await page.locator('#export').scrollIntoViewIfNeeded();await page.locator('#export').tap();})()
    ]);
    const out=path.join(os.tmpdir(),'j4c-'+browserKind+'-'+width+'-'+process.pid+'.json');
    await download.saveAs(out);
    const saved=fs.readFileSync(out,'utf8'),loaded=originalW.load(saved);
    assert.equal(loaded.ships.sh023.owner,'house');
    assert.ok(loaded.kanon.flugdienst.sh023);
    assert.equal(Object.values(loaded.owners).reduce((n,o)=>n+o.cash,0),33000);
    assert.equal(loaded.ledger.jaeger.consumed,1);
    assert.equal(originalW.audit(loaded).ok,true,JSON.stringify(originalW.audit(loaded).fehler));
    assert.deepEqual(errs,[],'keine Browser-JavaScript-Fehler');
    console.log('J4C_BROWSER_OK',JSON.stringify({browser:browserKind,width,height,
      ship:'sh023',status:loaded.ships.sh023.flug.lage,isk:33000,hash:originalW.hash(loaded)}));
    fs.unlinkSync(out);
   }finally{await ctx.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err.stack||String(err));process.exitCode=1;});
