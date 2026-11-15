// J6-I: sichtbare, real bezahlte house-Aufträge auf derselben Regel204-Welt.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const Welt=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const original=fs.readFileSync(path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
 const profile=JSON.parse(original).w5ad.profile;
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
  try{
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
   res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/j4c/index.html');
  await page.locator('#beispiel').click();
  await page.waitForFunction(()=>document.querySelector('#schiff')?.textContent.includes('sh023'));
  await page.locator('#ansicht-konzern').click();
  const angebot=page.locator('#j6-w-angebote button');
  assert.equal(await angebot.count(),4,'vier ausschließlich erlaubte Spieleraktionen');
  assert.equal(await angebot.nth(0).isEnabled(),true,'echter eigener Siliziumauftrag');
  assert.equal(await angebot.nth(1).isDisabled(),true,'unbezahlte Ware nicht verkaufbar');
  assert.equal(await angebot.nth(2).isDisabled(),true,'kein unproduzierter Gratisjäger');
  assert.equal(await angebot.nth(3).isEnabled(),true,'wirklicher Frachter kaufbar');
  assert.match(await page.locator('#j6-w-nadir').textContent(),/fremder Eigentümer/);
  assert.match(await page.locator('#j6-w-konzern').textContent(),/Stationsaufträge sind keine Spielerbefehle/);
  await angebot.nth(0).click();
  assert.match(await page.locator('#meldung').textContent(),/Echter Spielerauftrag ausgeführt/);
  assert.equal(await angebot.nth(0).isDisabled(),true,'laufenden Auftrag nicht doppeln');
  await page.locator('#ansicht-cockpit').click();
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const dest=path.join(os.tmpdir(),'j6i-'+kind+'-'+process.pid+'.json');
  await dl.saveAs(dest);const raw=fs.readFileSync(dest,'utf8');fs.unlinkSync(dest);
  const w=Welt.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash}),s=w.load(raw);
  assert.equal(s.kanon.silizium.auftrag.schiff,'sh022','echter eigener Miner');
  const vorher=JSON.parse(original);
  // Original-J2b reserviert beim Start 128 ISK Arbeitslohn des Spielers
  // UND 192 ISK realen Käuferetats von Nadir. Keine unfinanzierten Waren.
  assert.equal(vorher.owners.house.cash-s.owners.house.cash,128);
  assert.equal(vorher.owners.st_nadir.cash-s.owners.st_nadir.cash,192);
  assert.equal(s.owners.k1_silizium_arbeit.cash,128);
  assert.equal(s.owners.k1_silizium_kauf.cash,192);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(w.audit(s).ok,true);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('J6I_BROWSER',kind,JSON.stringify({houseCash:s.owners.house.cash,money:33000,miner:s.kanon.silizium.auftrag.schiff}));
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
