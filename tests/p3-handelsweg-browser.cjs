// P3 browser acceptance: two original F4 rounds from the public entry using
// only the displayed decision button. No separate currency, storage or engine.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(__dirname,'..');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep))
  return res.writeHead(404).end();
 try{
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]').tap();
    await page.locator('#neues-spiel').tap();await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#p3-handelsauftrag').isVisible(),true);
    assert.match(await page.locator('#p3-handelsziel').textContent(),/Miner erwerben/);
    assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true);
    const initial=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    for(let i=0;i<45;i++){
     const json=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     const s=JSON.parse(json),w=W.erstellenJ4c({carrierCash:s.w5ad.profile.carrierCash,buyerCash:s.w5ad.profile.buyerCash});
     assert.equal(w.audit(w.load(json)).ok,true);
     assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
     assert.equal(s.minted,0);assert.equal(s.burned,0);
     const completed=(s.kanon.spielerFrachten?.auftraege||[]).filter(a=>a.end!==null&&a.geliefert!==null).length;
     if(completed>=2)break;
     assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true,
       'Original P3 offer blocked after '+completed+' deliveries: '+await page.locator('#p3-handelssperre').textContent());
     await page.locator('#p3-handelsaktion').tap();
    }
    const final=await page.evaluate(k=>localStorage.getItem(k),SLOT),s=JSON.parse(final);
    assert.ok(s.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length>=2);
    assert.match(await page.locator('#p3-handelsstand').textContent(),/2 abgeschlossene Eis-Rundfahrten/);
    assert.ok(s.kanon.spielerFrachten.gebuehr>=480);
    assert.equal(final.includes('p3-handels'),false);
    assert.notEqual(final,initial);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.reload();await page.locator('#fortsetzen').tap();
    assert.match(await page.locator('#p3-handelsstand').textContent(),/2 abgeschlossene Eis-Rundfahrten/);
    assert.deepEqual(errors,[]);
    console.log('P3_TRADE_BROWSER_OK',JSON.stringify({kind,width,height,freight:s.kanon.spielerFrachten.auftraege.length,
      fees:s.kanon.spielerFrachten.gebuehr,house:s.owners.house.cash,world:33000}));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
