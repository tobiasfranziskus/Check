// J4e: echter Regel204-Jäger wird in Chromium/WebKit auf vier Touchgrößen
// durch das F8-E-Trainingsduell gesteuert, NICHT durch ein gratis F8-Demoschiff.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const assert=require('node:assert/strict');
const Welt=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 // Statischer, aus realer Finanzierungskette erzeugter JSON-Beleg bleibt im Release.
 // Forschungswerkzeuge laufen nicht als Build-Schritt oder im Browser.
 const filename=path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json');
 assert.ok(fs.existsSync(filename),'finanziertes Beispiel muss im Repository liegen');
 const proven=JSON.parse(fs.readFileSync(filename,'utf8'));
 const w=Welt.erstellenJ4c({carrierCash:proven.w5ad.profile.carrierCash,
  buyerCash:proven.w5ad.profile.buyerCash});
 assert.equal(w.audit(proven).ok,true,JSON.stringify(w.audit(proven).fehler));
 assert.equal(proven.ships.sh023.owner,'house');
 assert.equal(proven.ledger.jaeger.consumed,1);
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const dest=pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+pathname);
  const pagesRoot=pathname==='/'||pathname==='/index.html';
  const asset=dest.startsWith(root+path.sep+'prototypes'+path.sep)
   &&/[.]((html)|(js)|(css)|(json))$/.test(dest);
  if(!pagesRoot&&!asset){res.writeHead(404).end();return;}
  try{
   const ext=path.extname(dest),types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css'};
   res.setHeader('Content-Type',types[ext]||'text/plain');
   res.setHeader('Cache-Control','no-store');
   res.end(fs.readFileSync(dest));
  }catch(_){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browserKind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (browserKind==='webkit'?webkit:chromium).launch(
  browserKind==='webkit'?{}:{args:['--no-sandbox']});
 try{
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const tap=async id=>{
    const node=page.locator('#'+id);
    await node.scrollIntoViewIfNeeded();await node.tap();
   };
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    assert.match(await page.locator('#root-game-title').textContent(),/APHROS\s+VOID/);
    assert.match(await page.locator('#root-legacy-info h1').textContent(),/W0–W5/,
      'older W0–W5 mode and its technical identity remain available');
    const href=await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/j4c/index.html"]').getAttribute('href');
    assert.equal(href,'prototypes/j4c/index.html','öffentliches Hauptspiel verlinkt den Jäger');
    await page.locator('#root-portal .root-more summary').tap();
    await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/j4c/index.html"]').tap();
    await page.waitForURL('**/prototypes/j4c/index.html');
    assert.equal(await page.locator('#duell-start').isDisabled(),true);
    assert.equal(await page.locator('#duell-feuer').isDisabled(),true);
    // Öffentlicher Startknopf: echte, vorfinanzierte statische Welt statt CI-Download.
    await tap('beispiel');
    await page.waitForFunction(()=>document.querySelector('#schiff').textContent.includes('sh023'));
    assert.match(await page.locator('#meldung').textContent(),/real bezahlter Jäger/);
    assert.match(await page.locator('#weltgeld').textContent(),/33[.]000 ISK/);
    // J5: dieselbe Welt in der lesenden Konzernansicht, kein Reload oder zweites Save.
    const originalCash=await page.locator('#cash').textContent();
    const originalTick=await page.locator('#tick').textContent();
    await tap('ansicht-konzern');
    assert.equal(await page.locator('#spielbereich').isVisible(),false);
    assert.equal(await page.locator('#konzernbereich').isVisible(),true);
    assert.equal(await page.locator('#konzern-cash').textContent(),originalCash);
    assert.equal(await page.locator('#konzern-tick').textContent(),originalTick);
    assert.match(await page.locator('#konzern-weltgeld').textContent(),/33[.]000 ISK/);
    assert.ok(await page.locator('#konzern-schiffe tr').count()>=3);
    assert.ok((await page.locator('#konzern-schiffe').textContent()).includes('sh023'));
    assert.ok((await page.locator('#konzern-stationen').textContent()).includes('st_nadir'));
    await tap('konzern-zurueck');
    assert.equal(await page.locator('#spielbereich').isVisible(),true);
    assert.match(await page.locator('#schiff').textContent(),/sh023/);
    await tap('abdocken');assert.match(await page.locator('#reserve').textContent(),/40 ISK/);
    await tap('play');
    await page.waitForFunction(()=>document.querySelector('#lage').textContent==='frei',null,{timeout:12000});
    // In der Unternehmenssicht darf die laufende Flugwelt nicht versteckt weiterlaufen.
    await tap('ansicht-konzern');
    assert.equal(await page.locator('#play').textContent(),'Flugzeit starten');
    const pausedTick=await page.locator('#konzern-tick').textContent();
    await page.waitForTimeout(900);
    assert.equal(await page.locator('#konzern-tick').textContent(),pausedTick);
    await tap('konzern-zurueck');
    assert.equal(await page.locator('#lage').textContent(),'frei');
    assert.equal(await page.locator('#reserve').textContent(),await page.locator('#konzern-reserve').textContent());
    assert.equal(await page.locator('#duell-start').isDisabled(),false);
    await tap('duell-start');
    assert.match(await page.locator('#duell-status').textContent(),/aktiv/);
    assert.match(await page.locator('#duell-hp').textContent(),/96/);
    assert.equal(await page.locator('#duell-feuer').isDisabled(),false);
    await tap('duell-anflug');
    assert.match(await page.locator('#meldung').textContent(),/shipFlyTo bestätigt/);
    await tap('play');
    await page.waitForFunction(()=>{
      const s=document.querySelector('#duell-sektor').textContent;
      const n=Number(s.replace(/[^0-9]/g,''));
      return n>0&&n<7500;
    },null,{timeout:20000});
    await tap('play');
    const secondsBefore=Number((await page.locator('#duell-sekunden').textContent()).replace(/[^0-9]/g,''));
    assert.ok(secondsBefore>100);
    await tap('duell-ziel');
    assert.match(await page.locator('#meldung').textContent(),/shipSteer bestätigt/);
    await tap('play');
    await page.waitForFunction(v=>{
      const n=Number(document.querySelector('#duell-sekunden').textContent.replace(/[^0-9]/g,''));
      return n>v;
    },secondsBefore,{timeout:12000});
    await tap('play');
    await tap('duell-feuer');
    assert.match(await page.locator('#meldung').textContent(),/F8-E-Trainingsprojektil gestartet/);
    assert.match(await page.locator('#duell-status').textContent(),/aktiv/);
    // Ein Cockpit-/Konzernwechsel darf das laufende virtuelle Training nicht zurücksetzen.
    const duellVorher=await page.locator('#duell-sekunden').textContent();
    const trefferVorher=await page.locator('#duell-treffer').textContent();
    await tap('ansicht-konzern');
    await tap('konzern-zurueck');
    assert.match(await page.locator('#duell-status').textContent(),/aktiv/);
    assert.equal(await page.locator('#duell-sekunden').textContent(),duellVorher);
    assert.equal(await page.locator('#duell-treffer').textContent(),trefferVorher);
    assert.match(await page.locator('#audit').textContent(),/OK/);
    const [download]=await Promise.all([
      page.waitForEvent('download'),
      (async()=>{await tap('export');})(),
    ]);
    const pathOut=path.join(os.tmpdir(),'j4e-'+browserKind+'-'+width+'-'+process.pid+'.json');
    await download.saveAs(pathOut);
    const saved=fs.readFileSync(pathOut,'utf8'),loaded=w.load(saved);
    assert.equal(w.audit(loaded).ok,true,JSON.stringify(w.audit(loaded).fehler));
    assert.equal(Object.values(loaded.owners).reduce((n,x)=>n+x.cash,0),33000);
    assert.equal(loaded.ledger.jaeger.consumed,1);
    assert.equal(loaded.ships.sh023.owner,'house');
    assert.ok(loaded.kanon.flugdienst.sh023);
    assert.equal(saved.includes('zielprobe'),false,'F8-Trainingssimulation nicht als Wirtschaftsave');
    assert.deepEqual(errors,[],'kein Browser-JS-Fehler');
    console.log('J4E_PAID_DUEL_BROWSER_OK',JSON.stringify({browser:browserKind,width,height,
      ship:'sh023',tick:loaded.tick,hash:w.hash(loaded),geld:33000}));
    fs.unlinkSync(pathOut);
   }finally{await context.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
