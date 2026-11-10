// F2a Real-Browser: paid hull + on-location ICE + physical return + dock-only sale,
// deterministic Rule197 Save/Load and UX08 in Chromium / WebKit, four touch viewports.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
   if(!file.startsWith(root+'/prototypes/')||!/\.(html|js)$/.test(file)){
     res.writeHead(404).end();return;
   }
   try{
     res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');
     res.end(fs.readFileSync(file));
   }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const engine=process.env.FLUG_BROWSER==='webkit'?webkit:chromium, isWK=engine===webkit;
 let browser=null;
 try{
   browser=await engine.launch(isWK?{}:{args:['--no-sandbox']});
   for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
     const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e.stack||e)));
     try{
       await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/flug2d/f2a-demo.html');
       await page.waitForFunction(()=>!!window.F2aDemo&&F2aDemo.audit().ok);
       assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
       let start=JSON.parse(await page.evaluate(()=>F2aDemo.zustand()));
       assert.equal(start.rulesVersion,197);assert.equal(start.minted,0);
       assert.equal(start.owners.house.cash,3000);assert.equal(start.ledger.eis.mined,0);
       await page.locator('#kaufen').tap();
       const player=JSON.parse(await page.evaluate(()=>F2aDemo.zustand()));
       const own=Object.values(player.ships).find(s=>s.owner==='house'&&s.klasse==='miner');
       assert.ok(own?.flug);
       assert.equal(player.owners.house.cash,2400,'real 600 ISK ship purchase');
       await page.locator('#spieler').tap();
       let mission=JSON.parse(await page.evaluate(()=>F2aDemo.zustand()));
       assert.equal(mission.f2a.missionen[own.id].status,'abdocken');
       // Move deterministically using the same publicly exported F2a stepper,
       // not by inserting goods or bypassing economic commands.
       await page.evaluate(()=>F2aDemo.fliegen(1300));
       mission=JSON.parse(await page.evaluate(()=>F2aDemo.zustand()));
       assert.equal(mission.f2a.missionen[own.id].status,'abbau');
       assert.ok(mission.ledger.eis.mined>0&&mission.ledger.eis.mined<48);
       assert.equal(mission.w5n.mineVerkauft,0);
       assert.equal(mission.stations.st_aldera.lager.eis,0);
       assert.equal(await page.evaluate(()=>F2aDemo.audit().ok),true);
       const render=await page.evaluate(()=>{
         const before=F2aDemo.zustand(),cached=F2aDemo.cache();
         for(let i=0;i<200;i++)F2aDemo.rendern();
         return {equal:before===F2aDemo.zustand(),cached,sameCache:JSON.stringify(cached)===JSON.stringify(F2aDemo.cache())};
       });
       assert.equal(render.equal,true);
       assert.equal(render.sameCache,true);
       const saved=await page.evaluate(()=>F2aDemo.zustand());
       await page.locator('details summary').tap();
       const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').tap()]);
       assert.equal(download.suggestedFilename(),'aphros-f2a-forschung-regel197.json');
       page.once('dialog',d=>d.accept());
       await page.locator('#import').setInputFiles({name:'f2a.json',mimeType:'application/json',buffer:Buffer.from(saved)});
       await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Forschungsstand geladen'));
       assert.equal(await page.evaluate(()=>F2aDemo.zustand()),saved);
       const foreign=JSON.parse(saved);foreign.rulesVersion=196;
       await page.locator('#import').setInputFiles({name:'f1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(foreign))});
       await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Import abgewiesen'));
       assert.equal(await page.evaluate(()=>F2aDemo.zustand()),saved);
       // Total 4106 real F0 substeps from the original paid start, in one world.
       await page.evaluate(()=>F2aDemo.fliegen(4106-1300));
       const done=JSON.parse(await page.evaluate(()=>F2aDemo.zustand()));
       assert.equal(done.f2a.missionen[own.id].status,'fertig');
       assert.equal(done.ships[own.id].flug.lage,'angedockt');
       assert.equal(done.ships[own.id].ladung.eis||0,0);
       assert.equal(done.stations.st_aldera.lager.eis,48);
       assert.equal(done.w5n.mineVerkauft,48);
       assert.equal(done.w5n.mineLohn,96);
       assert.equal(done.owners.house.cash,2544);
       assert.equal(done.minted,0);
       assert.equal(await page.evaluate(()=>F2aDemo.audit().ok),true);
       assert.equal(await page.evaluate(()=>{
         // Hash from canonical state via the ORIGINAL economically coupled F2a instance.
         const F=F2aEisPendel.erstellen({carrierCash:2000,buyerCash:4000});
         return F.hash(JSON.parse(F2aDemo.zustand()));
       }),'c60851bb5f4f1475','F2a cross-engine paid-delivery hash');
       assert.deepEqual(errors,[]);
       console.log('F2A_EIS_BROWSER_OK '+(isWK?'WebKit':'Chromium')+' '+width+'x'+height+
         ' tick='+done.tick+' cash='+done.owners.house.cash+' hash=c60851bb5f4f1475');
     }finally{await ctx.close();}
   }
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
