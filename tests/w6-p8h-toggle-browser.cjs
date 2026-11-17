// W6/P8h: real public career touch UI + separate voluntary NPC-follow-up consent.
// Playwright Chromium / WebKit, 4 mobile/iPad viewports. NOT physical iPad/NAS.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const oldSlot='aphros-void:spielerkarriere:regel204:v1';
const w6Slot='aphros-void:spielerkarriere:regel207-forschung:v1';
const sizes=[[1180,820],[1024,768],[820,1180],[390,844]];
const total=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
(async()=>{
 const server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://127.0.0.1');
   const file=url.pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep)||!/\.(html|js|css)$/.test(file)
      ||!fs.existsSync(file)||!fs.statSync(file).isFile()){
     res.writeHead(404).end();return;
   }
   res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)],'Cache-Control':'no-store'});
   fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const which=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (which==='webkit'?webkit:chromium).launch(which==='webkit'?{}:{args:['--no-sandbox']});
 try{
  for(const [width,height] of sizes){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[],dialogs=[];
   let consentToImportedAutomation=false;
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('dialog',async dialog=>{
     const message=dialog.message();
     dialogs.push(message);
     if(/Dieser importierte Spielstand aktiviert zusätzlich/.test(message)&&!consentToImportedAutomation)
       await dialog.dismiss();
     else await dialog.accept();
   });
   const url='http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html';
   try{
    await page.goto(url);
    // Existing normal Rule204 career remains the default and cannot gain P8h.
    await page.locator('#neues-spiel').tap();
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    await page.locator('#tab-jaeger').tap();
    assert.equal(await page.locator('#w6-p8h-controls').isHidden(),true);
    const baseline=await page.evaluate(k=>localStorage.getItem(k),oldSlot);
    assert.equal(JSON.parse(baseline).rulesVersion,204);
    assert.equal(JSON.parse(baseline).kanon.npcMaterialKette,undefined);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),w6Slot),null);

    // Explicitly choose a second, independent research career.
    await page.goto(url);
    await page.locator('#neues-spiel').tap();
    await page.locator('label[for="w6-p8g-start"]').tap();
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    await page.locator('#tab-jaeger').tap();
    assert.equal(await page.locator('#w6-p8h-controls').isVisible(),true);
    const originalW6=await page.evaluate(k=>localStorage.getItem(k),w6Slot);
    const original=JSON.parse(originalW6);
    assert.equal(original.rulesVersion,207);
    assert.equal(original.kanon.materialSupplyEnabled,true);
    assert.equal(original.kanon.npcMaterialKette,undefined);
    assert.equal(total(original),33000);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),baseline);
    assert.match(await page.locator('#w6-p8h-toggle').textContent(),/aktivieren/);

    // An actual touch and separate confirmation, not a JSON self-authorized toggle.
    await page.locator('#w6-p8h-toggle').tap();
    let active=await page.evaluate(k=>localStorage.getItem(k),w6Slot),s=JSON.parse(active);
    assert.equal(s.kanon.npcMaterialKette,true);
    assert.equal(total(s),33000);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),w6Slot+':vorherige'),originalW6);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),baseline);
    assert.match(await page.locator('#w6-p8h-toggle').textContent(),/pausieren/);
    assert.ok(dialogs.some(d=>/eigenständigen NPC-Unternehmen|eigenständigen NPC-Unternehmen|eigenständigen NPC/.test(d)),
       'NPC follow-up confirmation must be a genuine browser dialog');

    // Advance through the SAME authoritative core in the active career.
    const advance=page.locator('[data-advance="60"]');
    assert.equal(await advance.isVisible(),true);
    await advance.tap();
    active=await page.evaluate(k=>localStorage.getItem(k),w6Slot);
    s=JSON.parse(active);
    assert.equal(s.tick,60);
    assert.equal(s.kanon.npcMaterialKette,true);
    assert.equal(total(s),33000);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),baseline);

    // Persistent opt-in on reload without a second side-effect.
    await page.reload();
    await page.locator('#fortsetzen-w6').tap();
    await page.locator('#tab-jaeger').tap();
    assert.match(await page.locator('#w6-p8h-toggle').textContent(),/pausieren/);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),w6Slot),active);

    // Pausing the OPTIONAL strategy does not void already signed paid contracts.
    await page.locator('#w6-p8h-toggle').tap();
    const paused=await page.evaluate(k=>localStorage.getItem(k),w6Slot);
    assert.equal(JSON.parse(paused).kanon.npcMaterialKette,false);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),w6Slot+':vorherige'),active);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),baseline);

    // An EXTERNAL active Rule207 save needs *two* independent consents.
    await page.goto(url);
    const upload={name:'w6-p8h-external.json',mimeType:'application/json',buffer:Buffer.from(active)};
    await page.locator('#import-datei').setInputFiles(upload);
    await page.waitForFunction(()=>document.getElementById('import-datei').value==='');
    assert.equal(await page.locator('#startseite').isVisible(),true,
      'second NPC-consent dismissed; import must be completely aborted');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),w6Slot),paused,
      'rejected NPC-consent does not overwrite an existing experimental save');
    assert.ok(dialogs.some(d=>/Dieser importierte Spielstand aktiviert zusätzlich/.test(d)));
    consentToImportedAutomation=true;
    await page.locator('#import-datei').setInputFiles(upload);
    await page.waitForFunction(()=>document.getElementById('import-datei').value==='');
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const imported=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),w6Slot));
    assert.equal(imported.rulesVersion,207);
    assert.equal(imported.kanon.npcMaterialKette,true);
    assert.equal(imported.tick,60);
    assert.equal(total(imported),33000);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldSlot),baseline);
    assert.deepEqual(errors,[]);
    console.log('W6_P8H_PRODUCT_TOUCH_OK',JSON.stringify({browser:which,width,height,
       originalRule:204,researchRule:207,tick:60,worldISK:33000,mint:0,burn:0,
       optin:true,pauses:true,backup:true,dualImportConsent:true}));
   }finally{await ctx.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
