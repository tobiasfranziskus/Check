// P8a: echter Root→P1→W6-Opt-in→Jägerprojekt-Lieferstatus, ohne neue Firma
// und ohne nicht existente Dravos-Route oder zusaetzliches Geld zu behaupten.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const P8=require('../prototypes/spiel/silizium-versorgung.js');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+pathname);
  if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep)){
   res.writeHead(404).end();return;
  }
  try{
   const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
   res.setHeader('Content-Type',mime[ext]||'text/plain');
   res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const rootURL='http://127.0.0.1:'+server.address().port;
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(rootURL+'/');
    await page.waitForURL('**/prototypes/spiel/index.html');
    await page.locator('#neues-spiel').tap();
    assert.equal(await page.locator('#w6-npc-start').isChecked(),false);
    await page.locator('label[for="w6-npc-start"]').tap();
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    assert.equal(await page.locator('#w6-status').isVisible(),true);
    const original=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const before=JSON.parse(original),p=before.w5ad.profile;
    const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
    assert.equal(w.audit(w.load(original)).ok,true);
    assert.equal(before.owners.house.cash,3000);
    await page.locator('#tab-jaeger').tap();
    const status=page.locator('#p8-silizium-lage');
    assert.equal(await status.isVisible(),true);
    const txt=await status.textContent();
    assert.match(txt,/16 \/ 16 Silizium verbleiben/);
    assert.match(txt,/128 ISK Bergbaulohn/);
    assert.match(txt,/192 ISK Nadir-Ankauf/);
    assert.match(txt,/mindestens 40 ISK Flugreserve/);
    assert.match(txt,/Weitere Siliziumfelder im aktiven Kern: 0/);
    assert.match(txt,/Dravos/);
    assert.match(txt,/keine bindende Kaufzusage/i);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),original,
      'Jägerbericht und Finanzierungsdiagnose duerfen keinen ISK/Speicherstand veraendern');
    await page.locator('[data-advance="1440"]').tap();
    const day=await page.evaluate(k=>localStorage.getItem(k),SLOT),state=w.load(day);
    assert.equal(state.tick,1440);
    assert.equal(w.audit(state).ok,true);
    const v=P8.erstellen(w,state),t=await status.textContent();
    assert.match(t,new RegExp(v.rohstoff.rest+' \\/ 16 Silizium verbleiben'));
    assert.equal(v.weg.fremdeAktiveSiliziumFelder,0);
    assert.equal(state.minted,0);assert.equal(state.burned,0);
    assert.equal(Object.values(state.owners).reduce((n,o)=>n+o.cash,0),33000);
    const hash=w.hash(state);
    await page.reload();
    await page.locator('#fortsetzen').tap();
    await page.locator('#tab-jaeger').tap();
    assert.equal(await status.isVisible(),true);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),day,
      'kein Refill oder JSON-Migration beim Reload');
    assert.equal(w.hash(w.load(day)),hash);
    assert.deepEqual(errors,[],'keine Browser-Exception');
    console.log('W6_P8A_BROWSER_OK',JSON.stringify({kind,width,height,
      hash,feldRest:v.rohstoff.rest,weitereQuellen:v.weg.fremdeAktiveSiliziumFelder,
      weltgeld:33000,mint:0,burn:0}));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
