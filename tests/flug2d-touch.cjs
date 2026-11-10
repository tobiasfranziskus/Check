/* Dev-only: node tests/flug2d-touch.cjs  (optional CHROMIUM_PATH, PLAYWRIGHT_MODULE, FLUG2D_SHOTS)
   Chromium-Touch-Emulation der Flug2D-Sandbox. Kein Nachweis für echtes iPad Safari oder NAS. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),shots=process.env.FLUG2D_SHOTS||os.tmpdir();
const erlaubt=['prototypes/flug2d/index.html','prototypes/flug2d/flug-kern.js','prototypes/flug2d/referenz.js','prototypes/flug2d/sandbox.js','prototypes/flug2d/grafik.js','prototypes/w5ac/rule191-w5-ferry-core.js'];
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=req.url.split('?')[0].slice(1).replace(/\/$/,'/index.html');
  if(!erlaubt.includes(name)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(path.join(repo,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const binary=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
 const browser=await chromium.launch({headless:true,...(fs.existsSync(binary)?{executablePath:binary}:{}),args:['--no-sandbox']});
 try{
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/prototypes/flug2d/`);
   await page.waitForFunction(()=>window.FlugSandbox&&document.querySelector('#hud').textContent.includes('angedockt'));
   const zustand=async()=>JSON.parse(await page.evaluate(()=>FlugSandbox.zustand()));
   const sp=async()=>(await zustand()).ships.sp1.flug;
   const text=id=>page.locator(id).innerText();
   const ohneUeberlauf=async wo=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Überlauf ${width}x${height} ${wo}`);
   await ohneUeberlauf('Start');
   for(const sel of ['#dock','#bremse','#erz','#eis','#pause','#tempo','#minute','summary']){
    const box=await page.locator(sel).boundingBox();assert.ok(box.height>=48&&box.width>=44,`${sel} ${width}x${height} ${JSON.stringify(box)}`);
   }
   let stick=await page.locator('#knueppel').boundingBox();
   assert.ok(stick.width>=160&&stick.x>=0&&stick.y+stick.height<=Math.max(height,await page.evaluate(()=>document.documentElement.scrollHeight)));
   // Angedockt ist der Knüppel wirkungslos: der Kern lehnt Steuerbefehle ab, statt das UI raten zu lassen.
   assert.equal(await page.locator('#erz').isDisabled(),true);
   await page.locator('#tempo').tap();assert.match(await text('#tempo'),/3×/);
   await page.locator('#dock').tap();
   await page.waitForFunction(()=>JSON.parse(FlugSandbox.zustand()).ships.sp1.flug.lage==='frei');
   // On narrow portraits the page scrolls to reach the action buttons. Any
   // CDP finger coordinates captured before those taps are stale viewport coordinates.
   await page.locator('#knueppel').scrollIntoViewIfNeeded();
   stick=await page.locator('#knueppel').boundingBox();
   assert.ok(stick.y>=0&&stick.y+stick.height<=height,'Joystick must be visible to touch '+width+'x'+height);
   // Echter Touch-Zug am Steuerknüppel über CDP: Richtung -> Kurs, Auslenkung -> Fahrt.
   const cdp=await context.newCDPSession(page),mx=stick.x+stick.width/2,my=stick.y+stick.height/2;
   const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y])=>({x,y,id:1}))});
   await touch('touchStart',[[mx,my]]);
   for(let i=1;i<=6;i++)await touch('touchMove',[[mx+i*13,my-i*5]]);
   try{await page.waitForFunction(()=>{const b=JSON.parse(FlugSandbox.zustand()).ships.sp1.flug;return b.modus==='hand'&&b.sollFahrt===100&&b.vx>20;},{timeout:5000});}
   catch(e){
    console.error('FLUG2D_DIAG '+JSON.stringify({width,height,stick,stickNow:await page.locator('#knueppel').boundingBox(),
     viewport:await page.evaluate(()=>({scrollY,innerHeight,scrollHeight:document.documentElement.scrollHeight})),
     flight:await sp(),message:await text('#meldung')}));
    throw e;
   }
   const zug=await sp();assert.ok(zug.sollKurs>=236&&zug.sollKurs<=246,'Kurs rechts oben: '+zug.sollKurs);assert.ok(zug.vy<0);
   await touch('touchEnd',[]);
   // Loslassen ohne Tempomat = Bremsen bis zum Stillstand.
   await page.waitForFunction(()=>{const b=JSON.parse(FlugSandbox.zustand()).ships.sp1.flug;return b.sollFahrt===0&&b.vx===0&&b.vy===0;});
   // Zwei Finger: Knüppel bleibt gehalten, zweiter Finger wählt die Anflugautomatik. Loslassen bricht sie nicht ab.
   const erz=await page.locator('#erz').boundingBox(),ex=erz.x+erz.width/2,ey=erz.y+erz.height/2;
   const finger=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y,id])=>({x,y,id}))});
   await finger('touchStart',[[mx,my,1]]);await finger('touchMove',[[mx-60,my+20,1]]);
   await page.waitForFunction(()=>JSON.parse(FlugSandbox.zustand()).ships.sp1.flug.sollFahrt>0);
   await finger('touchStart',[[mx-60,my+20,1],[ex,ey,2]]);await finger('touchEnd',[[ex,ey,2]]); // nur Finger 2 hebt ab
   await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('shipApproach angenommen'));
   await finger('touchEnd',[[mx-60,my+20,1]]);await page.waitForTimeout(200);
   assert.deepEqual((await sp()).ziel,{art:'feld',id:'aldera:erz'});assert.equal((await sp()).modus,'anflug');
   // Pause hält die Welt exakt an; +1 Minute führt genau 60 Flugschritte aus.
   await page.locator('#pause').tap();const still=await zustand();await page.waitForTimeout(300);
   assert.deepEqual(await zustand(),still);
   await page.locator('#minute').tap();const danach=await zustand();
   assert.equal(danach.tick*60+danach.flug.schritt,still.tick*60+still.flug.schritt+60);
   await require('./flug2d-grafik-browser.cjs')(page,width,height);
   // Tippen auf den Raum setzt einen Anflugpunkt über denselben validierten Befehl.
   const feld=await page.locator('#raum').boundingBox();
   await page.locator('#raum').tap({position:{x:Math.round(feld.width*.8),y:Math.round(feld.height*.3)}});
   assert.match(await text('#meldung'),/shipFlyTo angenommen/);assert.equal((await sp()).ziel.art,'punkt');
   // Determinismus im Browser: fester Referenzlauf und Replay der eben gespielten Sitzung.
   await page.locator('summary').tap();
   await page.locator('#referenz').tap();assert.equal(await text('#pruefung'),'Referenzlauf identisch: '+require('../prototypes/flug2d/referenz.js').HASH+' (3600 Flugschritte, gleicher Wert wie Node 22).');
   await page.locator('#replay').tap();assert.match(await text('#pruefung'),/^Replay identisch/);
   // Export/Import mitten im Flug; manipulierte Datei wird abgewiesen und ändert nichts.
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').tap()]);
   const saved=fs.readFileSync(await download.path(),'utf8');assert.equal(saved,await page.evaluate(()=>FlugSandbox.zustand()));
   await page.locator('#minute').tap();assert.notEqual(await page.evaluate(()=>FlugSandbox.zustand()),saved);
   await page.locator('#import').setInputFiles({name:'flug.json',mimeType:'application/json',buffer:Buffer.from(saved)});
   await page.waitForFunction(()=>document.querySelector('#pruefung').textContent.includes('Import geprüft'));
   assert.equal(await page.evaluate(()=>FlugSandbox.zustand()),saved);
   const falsch=JSON.parse(saved);falsch.ships.sp1.flug.treibstoff=100;
   await page.locator('#import').setInputFiles({name:'falsch.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(falsch))});
   await page.waitForFunction(()=>document.querySelector('#pruefung').textContent.includes('Nicht übernommen'));
   assert.equal(await page.evaluate(()=>FlugSandbox.zustand()),saved);
   assert.equal(await page.evaluate(()=>Object.keys(localStorage).length+Object.keys(sessionStorage).length),0);
   await ohneUeberlauf('Ende');assert.deepEqual(errors,[]);
   await page.locator('#pause').tap();await page.waitForTimeout(400);
   await page.screenshot({path:path.join(shots,`flug2d-${width}x${height}.png`)});
   await context.close();console.log(`FLUG2D_TOUCH_OK ${width}x${height}`);
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
