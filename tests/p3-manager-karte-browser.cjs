'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const J8=require('../prototypes/verbund/konzern-session.js');
const root=path.resolve(__dirname,'..');
const slot='aphros-void:spielerkarriere:regel204:v1';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const relative=url.pathname.replace(/^\/(?:Check|nas\/spiele\/aphros)\//,'/');
 const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
 if(file!==path.join(root,'index.html')&&!file.startsWith(path.join(root,'prototypes')+path.sep))
  return res.writeHead(404).end();
 try{
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});

async function pruefe(browser,kind,width,height,base){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(r.url());});
 const el=s=>page.locator(s);
 const save=()=>page.evaluate(key=>localStorage.getItem(key),slot);
 const action=el('#p3-handelsaktion'),selection=el('#sektor-auswahl'),details=el('#sektor-details');
 const ship=klasse=>el('.sektor-schiff').filter({hasText:klasse});
 try{
  await page.goto(base);
  await page.getByRole('link',{name:/^Wirtschaftsmanager/}).tap();
  await page.waitForLoadState('load');
  await el('#neues-spiel').tap();
  await el('#karriere-starten').tap();
  await el('.sektor-aldera button').waitFor();
  assert.match(await page.url(),/\/prototypes\/spiel\/index.html$/);
  assert.equal(await el('.sektor-station').count(),2);
  assert.equal(await el('.sektor-schiff').count(),0);
  assert.equal(await el('#sektor-auftraege').textContent(),'0');
  assert.equal(await el('#pilotenausbildung-details').getAttribute('open'),null);
  const box=await action.boundingBox();
  assert.ok(box.height>=48&&box.y>=0&&box.y+box.height<=height,'erste Aktion liegt im Bildschirm');
  await el('.sektor-nadir button').tap();
  assert.match(await details.innerText(),/Raffinerie.*In Bereitschaft/s);
  await selection.focus();
  await selection.press('Tab');
  await selection.press('Shift+Tab');
  await selection.selectOption('station:st_aldera');
  assert.equal(await selection.inputValue(),'station:st_aldera');
  assert.match(await details.innerText(),/Aldera Handelsstation/);
  assert.equal(await selection.evaluate(e=>e.matches(':focus-visible')),true);
  await action.tap();
  assert.equal(await el('#hausgeld').textContent(),'2.400 ISK');
  assert.equal(await ship('Bergbauschiff').count(),1);
  await ship('Bergbauschiff').tap();
  assert.match(await details.innerText(),/Dein Konzern.*Am Dock · Aldera.*600 ISK/s);
  await action.tap();
  assert.equal(await el('#hausgeld').textContent(),'1.650 ISK');
  // An intentional follow-up is distinct from a second tap on the purchase.
  await page.waitForTimeout(350);
  await action.tap();
  assert.equal(await el('#sektor-auftraege').textContent(),'1');
  const plus=el('[data-advance="60"]');
  await plus.tap();await plus.tap();
  assert.match(await action.innerText(),/Eisfracht transportieren/);
  await action.scrollIntoViewIfNeeded();
  const tap=await action.boundingBox();
  await page.touchscreen.tap(tap.x+tap.width/2,tap.y+tap.height/2);
  await page.touchscreen.tap(tap.x+tap.width/2,tap.y+tap.height/2);
  assert.match(await el('#zeit').innerText(),/120 Minuten/);
  const carrier=ship('Frachter');
  assert.equal(await el('.sektor-strecke .sektor-schiff').count(),1);
  await carrier.tap();
  assert.match(await details.innerText(),/Aldera → Nadir.*eis: 50.*Hinfahrt/s);
  const before=await save();
  // Browser DOM click with detail=2 models the second click of the same gesture.
  await action.dispatchEvent('click',{detail:2});
  assert.equal(await save(),before);
  const shot=process.env.S1_SCREENSHOT_DIR;
  if(shot&&(width===1180||width===390)){
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.screenshot({path:path.join(shot,`s1-${kind}-${width}.jpg`),quality:88});
  }
  await plus.tap();
  assert.match(await details.innerText(),/Nadir → Aldera.*leer.*Rückfahrt/s);
  await page.setViewportSize({width:height,height:width});
  assert.equal(await selection.inputValue(),await carrier.getAttribute('data-sektor'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.setViewportSize({width,height});
  await plus.tap();
  assert.equal(await el('.sektor-strecke .sektor-schiff').count(),0);
  assert.match(await details.innerText(),/Am Dock · Aldera/);
  assert.match(await el('#p3-handelsstand').innerText(),/240 ISK Frachtgebühren · 120 ISK Fluglöhne/);
  assert.equal(await el('#raumbereich').isVisible(),false);
  const original=await save(),j=J8.erstellen();
  j.oeffnen204(original,true);
  assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
  assert.equal(j.weltReferenz().audit(j.zustandReferenz()).ok,true);
  await el('#welt-sichern').tap();
  await page.reload();
  await el('#fortsetzen').tap();
  assert.equal(await save(),original);
  assert.equal(await selection.inputValue(),'station:st_aldera');
  await el('#tab-universum').tap();
  assert.match(await el('#sektorwirtschaft').innerText(),/physische Bestände/);
  await el('#tab-flotte').tap();
  assert.equal(await el('[data-pilot]').count(),2);
  await el('#tab-auftraege').tap();
  assert.equal(await el('#manager-betrieb').isVisible(),true);
  assert.ok(await page.evaluate(()=>scrollY>0));
  assert.deepEqual(errors,[]);
  console.log('S1_BROWSER_OK',kind,width+'x'+height,new URL(base).pathname,j.ansicht().hash);
 }finally{await ctx.close();}
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const rootUrl='http://127.0.0.1:'+server.address().port;
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=kind==='webkit'?await webkit.launch():await chromium.launch({
   executablePath:process.env.S1_CHROMIUM_PATH||undefined,args:['--no-sandbox']
  });
  await pruefe(browser,kind,1180,820,rootUrl+'/');
  await pruefe(browser,kind,1024,768,rootUrl+'/Check/');
  await pruefe(browser,kind,820,1180,rootUrl+'/nas/spiele/aphros/');
  await pruefe(browser,kind,390,844,rootUrl+'/Check/');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
