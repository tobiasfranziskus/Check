// J8 – realer Browserpfad: alte 195-Datei, bestätigte eigene Kopie,
// echter kostenpflichtiger Miner, Eis-Pendel, Core-Save und sicherer 204-Reload.
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const Session=require('../prototypes/w5ac/session.js');
const W=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
  try{
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
   res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');
   res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium',seed=Session.create(42,'private195');
 const original=seed.export(),base='http://127.0.0.1:'+server.address().port+'/prototypes/verbund/konzern.html';
 let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[],outside=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:'))outside.push(request.url());});
   await page.goto(base);
   assert.equal(await page.locator('#start195').isDisabled(),true,'kein automatischer Import');
   assert.equal(await page.locator('#konzernwelt').isHidden(),true);
   await page.locator('#quelle195').setInputFiles({name:'regel195-original.json',mimeType:'application/json',buffer:Buffer.from(original)});
   await page.waitForFunction(()=>document.querySelectorAll('#stufen li').length===6);
   assert.equal(await page.locator('#start195').isDisabled(),true,'Vorschau braucht ausdrückliche Bestätigung');
   await page.locator('#zustimmung195').check();
   assert.equal(await page.locator('#start195').isEnabled(),true);
   await page.locator('#start195').click();
   assert.equal(await page.locator('#konzernwelt').isVisible(),true);
   assert.equal(await page.locator('#schiffe tr').count(),0,'kein geschenkter Startminer');
   assert.equal(await page.locator('#jaeger').textContent(),'0');
   assert.match(await page.locator('#weltgeld').textContent(),/33000 ISK/);
   const cashStart=Number((await page.locator('#cash').textContent()).split(' ')[0]);
   const kaufen=page.locator('[data-aktion="buy-st_aldera-miner"]');
   assert.equal(await kaufen.isEnabled(),true,'echter, finanzierter Kauf vorhanden');
   await kaufen.click();
   assert.equal(await page.locator('#schiffe tr').count(),1,'Original-Core stellt bezahlte eigene Hülle aus');
   const cashAfter=Number((await page.locator('#cash').textContent()).split(' ')[0]);
   assert.ok(cashAfter<cashStart,'Minerkauf kein Geschenk');
   const pendel=page.locator('[data-aktion^="ice-"]');
   assert.equal(await pendel.count(),1);
   assert.equal(await pendel.isEnabled(),true);
   await pendel.click();
   assert.equal(await page.locator('[data-aktion^="stop-"]').isEnabled(),true);
   await page.locator('[data-minute="10"]').click();
   assert.equal(await page.locator('#jaeger').textContent(),'0');
   const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#export204').click()]);
   const tmp=path.join(os.tmpdir(),'j8-'+kind+'-'+width+'-'+process.pid+'.json');
   await dl.saveAs(tmp);const json=fs.readFileSync(tmp,'utf8');fs.unlinkSync(tmp);
   const raw=JSON.parse(json),p=raw.w5ad.profile;
   const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),s=w.load(json);
   assert.equal(s.rulesVersion,204);
   assert.equal(w.audit(s).ok,true);
   assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
   assert.equal(s.minted,0);assert.equal(s.burned,0);
   assert.equal(s.kanon.jaeger.kaeufe.length,0);
   assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='miner').length,1);
   const hash=w.hash(s);
   // Neue Browserseite: getrennten Regel204-Export wieder importieren.
   const page2=await context.newPage();
   await page2.goto(base);
   await page2.locator('#quelle204').setInputFiles({name:'neue-regel204-kopie.json',mimeType:'application/json',buffer:Buffer.from(json)});
   assert.equal(await page2.locator('#start204').isDisabled(),true);
   await page2.locator('#zustimmung204').check();await page2.locator('#start204').click();
   assert.equal(await page2.locator('#konzernwelt').isVisible(),true);
   assert.match(await page2.locator('#hash').textContent(),new RegExp(hash));
   await page2.close();
   // Manipulierter Geldbestand wird schon in der 195-Vorschau verweigert.
   const fake=JSON.parse(original);fake.owners.house.cash++;
   const page3=await context.newPage();await page3.goto(base);
   await page3.locator('#quelle195').setInputFiles({name:'gefälscht.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fake))});
   await page3.waitForFunction(()=>document.querySelector('#preview195')?.classList.contains('fail'));
   await page3.locator('#zustimmung195').check();
   assert.equal(await page3.locator('#start195').isDisabled(),true);
   await page3.close();
   assert.equal(seed.export(),original,'Original195 unverändert');
   assert.deepEqual(outside,[],'kein Netzwerk-Upload');
   assert.deepEqual(errors,[],'keine JavaScript-Laufzeitfehler');
   console.log('J8_BROWSER_OK',JSON.stringify({browser:kind,width,height,weltgeld:33000,
     minerkauf:cashStart-cashAfter,hash,oldSavePreserved:true}));
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
