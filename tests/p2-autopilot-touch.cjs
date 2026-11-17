// Bezahlter Karriereflug im echten Cockpit; keine injizierten Schiffe oder UI-Physik.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const W=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(__dirname,'..'),SLOT='aphros-void:spielerkarriere:regel204:v1';
(async()=>{
 const server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!f.startsWith(root+path.sep)||!/[.](html|js|css)$/.test(f))return res.writeHead(404).end();
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]);res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  const kind=process.env.WELT_BROWSER||'chromium';
  browser=await ({chromium,webkit})[kind].launch(kind==='chromium'?{executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']}:{});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const tap=async s=>{await page.locator(s).scrollIntoViewIfNeeded();await page.locator(s).tap()};
   const status=()=>page.locator('#raum-flugstatus').textContent();
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html');
    await tap('#neues-spiel');await tap('#karriere-starten');
    await tap('[data-action="buy-st_aldera-miner"]');
    const paid=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
    assert.equal(paid.owners.house.cash,2400);
    const miner=Object.values(paid.ships).find(s=>s.owner==='house'&&s.klasse==='miner');assert.ok(miner);
    await tap('#tab-flotte');await tap('[data-pilot="'+miner.id+'"]');
    await tap('#raum-tempo-60');await tap('#raum-abdocken');
    await page.waitForFunction(()=>/Freier Flug/.test(document.querySelector('#raum-lage').textContent));
    await tap('#raum-start'); // Auswahl allein startet keinen Flug
    await tap('[data-raum="objekt-st_aldera"]');assert.match(await status(),/Zeit pausiert/);
    assert.equal(await page.locator('[data-raum="ziel-anfliegen"]').textContent(),'Autopilot: Anfliegen');
    await tap('[data-raum="ziel-anfliegen"]');assert.match(await status(),/Autopilot: Anfliegen.*Station Aldera.*Zeit läuft/);
    await tap('#raum-start');assert.match(await status(),/Autopilot: Anfliegen.*Zeit pausiert/);
    if(process.env.P2_SCREENSHOTS){fs.mkdirSync(process.env.P2_SCREENSHOTS,{recursive:true});await page.locator('#raum-navigation').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.P2_SCREENSHOTS,kind+'-autopilot-'+width+'x'+height+'.png'),fullPage:true})}
    // Eingaben über HUD-Ticks erhalten, Orbit bleibt originaler Befehl.
    await page.locator('#ziel-orbit-abstand').fill('120000');await page.waitForTimeout(400);
    assert.equal(await page.locator('#ziel-orbit-abstand').inputValue(),'120000');
    await tap('[data-raum="ziel-orbit"]');assert.match(await status(),/Orbit.*120.000/);
    await tap('#raum-hand');assert.match(await status(),/Handflug/);
    await tap('[data-raum="ziel-anfliegen"]');await tap('#raum-stopp');
    assert.doesNotMatch(await status(),/Autopilot:/);
    if(await page.locator('#raum-start').getAttribute('aria-pressed')==='true')await tap('#raum-start');
    for(const s of ['#raum-hand','#raum-stopp','[data-raum="ziel-anfliegen"]']){
     const b=await page.locator(s).boundingBox();assert.ok(b.height>=48&&b.width>=44,s);
    }
    const target=await page.locator('#raum-zielkarte').boundingBox(),stage=await page.locator('#raum-buehne').boundingBox();
    assert.ok(target.y+target.height<=stage.y+1,'Zielkarte verdeckt keine Flugflächen');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    const out=process.env.P2_SCREENSHOTS;
    if(out){fs.mkdirSync(out,{recursive:true});await page.locator('#raum-navigation').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,kind+'-'+width+'x'+height+'.png'),fullPage:true})}
    await tap('#raum-konzern');await tap('#welt-sichern');
    const save=await page.evaluate(k=>localStorage.getItem(k),SLOT),raw=JSON.parse(save),p=raw.w5ad.profile;
    const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),s=w.load(save);
    assert.equal(w.audit(s).ok,true);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
    assert.equal(s.ships[miner.id].owner,'house');assert.equal(s.ships[miner.id].flug.ziel,null);
    assert.equal(w.save(w.load(save)),save);
    await page.reload();await tap('#fortsetzen');assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),save);
    assert.deepEqual(errors,[]);
    console.log('P2_AUTOPILOT_TOUCH_OK',JSON.stringify({kind,width,height,miner:miner.id,hash:w.hash(s),cash:s.owners.house.cash,reserve:s.kanon.flugdienst[miner.id],worldMoney:33000}));
   }finally{await ctx.close()}
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
