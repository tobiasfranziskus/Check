'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {supply}=require('./k13-f7-vorbereitung.cjs');
(async()=>{
 const {w,s}=await supply(42),fixture=w.save(s),root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+'/')||! /\.(js|css|html)$/.test(file))return res.writeHead(404).end();
  try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';let browser;
 try{
  browser=await(kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{executablePath:process.env.CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
   // Fixture uses a fully audited, genuinely simulated industrial chain.
   // Only the first NEW world is seeded; reload uses real IndexedDB/save code.
   await page.route('**/welt-kern.js',async route=>{
    const body=fs.readFileSync(path.join(root,'prototypes/welt/welt-kern.js'),'utf8')+`
    {const api=globalThis.AphrosWelt;globalThis.AphrosWelt={...api,erstellenK7:(...args)=>{
      const w=api.erstellenK7(...args);return {...w,createState:()=>w.load(${JSON.stringify(fixture)})};
    }};}`;
    await route.fulfill({contentType:'text/javascript',body});
   });
   const tap=async sel=>{await page.locator(sel).scrollIntoViewIfNeeded();await page.locator(sel).tap();};
   const state=()=>page.evaluate(()=>JSON.parse(__welt.zustand()));
   const good=async()=>{const a=await page.evaluate(()=>__welt.audit());assert.equal(a.ok,true,JSON.stringify(a));assert.equal(Object.values((await state()).owners).reduce((n,o)=>n+o.cash,0),33000);};
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/spieltest/k13-f6/index.html');
    await page.waitForFunction(()=>window.__welt);
    await tap('nav button[data-ansicht="station"]');await good();
    const before=await state();assert.equal(await page.locator('#nadirKauf').isDisabled(),false);
    await tap('#nadirKauf');let z=await state();
    assert.equal(z.owners.house.cash,before.owners.house.cash-750);
    const id=z.kanon.spielerFrachterKaeufe.at(-1).id;assert.equal(z.ships[id].system,'nadir');await good();
    assert.equal(await page.locator('#nadirKauf').isDisabled(),true);
    await tap('#nadirUeberfuehrung');z=await state();assert.equal(z.w5ac.active.id,id);
    assert.equal(z.owners.w5ac_transfer_reserved.cash,60);await good();
    await page.evaluate(()=>__welt.schritte(30));await good();
    const mid=await page.evaluate(()=>__welt.hash());await page.evaluate(()=>__welt.sichern());
    await page.reload();await page.waitForFunction(()=>window.__welt&&/wiederhergestellt/.test(document.getElementById('meldung').textContent));
    assert.equal(await page.evaluate(()=>__welt.hash()),mid);await good();
    await page.evaluate(()=>__welt.schritte(30));z=await state();await good();
    assert.equal(z.ships[id].system,'aldera');assert.equal(z.w5ac.completed.at(-1).owner,'house');
    assert.equal(z.owners.w5ac_transfer_reserved.cash,0);assert.equal(z.w5ac.completed.at(-1).minuten,60);
    assert.deepEqual(errors,[]);
    const [scroll,inner]=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);assert.ok(scroll<=inner+1);
    console.log('F7_BROWSER_OK '+JSON.stringify({kind,width,height,id,hash:await page.evaluate(()=>__welt.hash())}));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
