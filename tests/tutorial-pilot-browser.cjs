'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const J=require('../prototypes/verbund/konzern-session.js'),O=require('../prototypes/w5ac/session.js');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const j=J.erstellen();j.starten195(O.create(42,'private195').export(),true);assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const save=j.exportieren();
 try{for(const [kind,type] of [['chromium',chromium],['webkit',webkit]].filter(([kind])=>!process.env.TUTORIAL_BROWSERS||process.env.TUTORIAL_BROWSERS.split(',').includes(kind))){
  const browser=await type.launch({headless:true,...(kind==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/prototypes/tutorial-pilot/index.html');
   assert.equal(await page.locator('[data-lektion]').count(),12);
   assert.equal(await page.locator('[data-lektion]:enabled').count(),0);
   await page.locator('#karriere').setInputFiles({name:'karriere.json',mimeType:'application/json',buffer:Buffer.from(save)});
   await page.waitForFunction(()=>document.getElementById('meldung').textContent.startsWith('Karriere geladen'));
   await page.locator('[data-lektion="auswahl"]').tap();
   assert.match(await page.locator('#akademie > [role=status]').textContent(),/Geschafft/);
   await page.locator('[data-lektion="abdocken"]').tap();
   await page.locator('#raum-abdocken').tap();
   await page.locator('#raum-tempo-60').tap();
   await page.waitForFunction(()=>document.getElementById('raum-lage').textContent.includes('Freier Flug'));
   // Real pointer drag -> original shipSteer, followed by original flight seconds.
   const stick=page.locator('#raum-knueppel');await stick.scrollIntoViewIfNeeded();const b=await stick.boundingBox();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-8,b.y+b.height/2,{steps:5});await page.mouse.up();
   await page.waitForFunction(()=>document.querySelector('#akademie > [role=status]').textContent.includes('Geschafft'));
   await page.locator('#raum-start').tap();
   await page.locator('#raum-konzern').tap();
   await page.locator('[data-lektion="aufschalten"]').focus();assert.equal(await page.locator('[data-lektion="aufschalten"]').evaluate(e=>e===document.activeElement),true);
   await page.locator('[data-lektion="aufschalten"]').tap();
   await page.locator('#raum-ziele').getByRole('button',{name:/Station Aldera/}).tap();
   await page.locator('#raum-zielaktionen').getByRole('button',{name:'Aufschalten',exact:true}).tap();
   assert.match(await page.locator('#raum-lage').textContent(),/Aufgeschaltet/);
   await page.locator('#raum-zielaktionen').getByRole('button',{name:'Aufschaltung lösen',exact:true}).tap();
   assert.match(await page.locator('#akademie > [role=status]').textContent(),/Geschafft/);
   const exportEvent=page.waitForEvent('download');await page.locator('#raum-export').click();const download=await exportEvent;
   const text=fs.readFileSync(await download.path(),'utf8'),raw=JSON.parse(text);
   assert.equal(Object.values(raw.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(raw.minted,0);assert.equal(raw.burned,0);
   assert.equal(text.includes('trainingAlt'),false);
   await page.locator('#karriere').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"rulesVersion":999}')});
   await page.waitForFunction(()=>document.getElementById('meldung').textContent.includes('nicht geladen'));
   assert.match(await page.locator('#meldung').textContent(),/nicht geladen/);
   assert.equal(await page.locator('#raumbereich').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync('/tmp/tutorial-pilot-screens',{recursive:true});await page.screenshot({path:'/tmp/tutorial-pilot-screens/'+kind+'-'+width+'.png',fullPage:true});
   assert.deepEqual(errors,[]);console.log('TUTORIAL_PILOT_BROWSER_OK',kind,width,height);
   await context.close();
  }}finally{await browser.close();}
 }}finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
