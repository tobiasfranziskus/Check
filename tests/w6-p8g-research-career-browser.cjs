// W6/P8g playable research start in SAME public P1/P2 shell, separate Rule207 slot.
// Browser emulation across four touch sizes is NOT physical iPad/NAS acceptance.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const oldSlot='aphros-void:spielerkarriere:regel204:v1';
const researchSlot='aphros-void:spielerkarriere:regel207-forschung:v1';
const sizes=[[1180,820],[1024,768],[820,1180],[390,844]];
const root=path.resolve(__dirname,'..');
const total=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
(async()=>{
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),file=url.pathname==='/'?
    path.join(root,'index.html'):path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)||!/\.(html|js|css)$/.test(file)||
      !fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)]});
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const which=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (which==='webkit'?webkit:chromium).launch(which==='webkit'?{}:{args:['--no-sandbox']});
 try{
  for(const [width,height] of sizes){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[],dialogs=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
   const url='http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html';
   try{
    await page.goto(url);
    assert.equal(await page.locator('#fortsetzen-w6').isDisabled(),true);
    await page.locator('#neues-spiel').tap();
    assert.equal(await page.locator('#w6-p8g-start').isChecked(),false);
    assert.equal(await page.locator('#w6-npc-start').isChecked(),false);
    await page.locator('label[for="w6-p8g-start"]').tap();
    assert.equal(await page.locator('#w6-p8g-start').isChecked(),true);
    assert.equal(await page.locator('#w6-npc-start').isChecked(),false);
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    assert.equal(await page.locator('#w6-status').isVisible(),true);
    assert.match(await page.locator('#w6-status').textContent(),/Dravos-Forschung/);
    const raw=await page.evaluate(k=>localStorage.getItem(k),researchSlot),s=JSON.parse(raw);
    assert.equal(s.rulesVersion,207);
    assert.equal(s.kanon.materialSupplyEnabled,true);
    assert.equal(s.kanon.npcAuto,true);
    assert.equal(total(s),33000);
    assert.equal(s.owners.house.cash,3000);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),null);
    assert.ok(dialogs.some(x=>/Regel207-Forschungswelt/.test(x)),'Research opt-in outside JSON confirmed');
    // Legitimate player-originated original miner purchase is still a real game action.
    await page.locator('#tab-jaeger').tap();
    const buy=page.locator('[data-j13-action="buy-st_aldera-miner"]');
    assert.equal(await buy.isEnabled(),true);
    await buy.tap();
    const paid=await page.evaluate(k=>localStorage.getItem(k),researchSlot),p=JSON.parse(paid);
    assert.equal(p.owners.house.cash,2400);
    assert.equal(total(p),33000);
    assert.ok(Object.values(p.ships).some(sh=>sh.owner==='house'&&sh.klasse==='miner'));
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),null);
    await page.reload();
    assert.equal(await page.locator('#fortsetzen-w6').isDisabled(),false);
    await page.locator('#fortsetzen-w6').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),researchSlot),paid,
      'Rule207 research resume cannot migrate or mutate old authored save');
    // Original 204 starts in its OWN slot even when 207 research exists.
    await page.goto(url);
    await page.locator('#neues-spiel').tap();
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const legacy=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),oldSlot));
    assert.equal(legacy.rulesVersion,204);
    assert.equal(total(legacy),33000);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),researchSlot),paid);
    assert.deepEqual(errors,[],'Browser error-free for both worlds in one public P1 shell');
    console.log('W6_P8G_RESEARCH_UI_TOUCH_OK',JSON.stringify({browser:which,width,height,
      researchRule:p.rulesVersion,legacyRule:legacy.rulesVersion,
      playerMinerBoughtFor:600,worldISK:33000,researchSavePreserved:true,consentOutsideJSON:true}));
   }finally{await ctx.close();}
  }
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1});