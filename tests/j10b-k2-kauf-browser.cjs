// J10b: actual Rule204 browser pickup of a genuinely produced K2 Nadir miner.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const OLD=require('../prototypes/w5ac/session.js');
const {erzeugen}=require('./j10b-k2-kauf-fixture.cjs');
(async()=>{
 const sample=erzeugen('house'),root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+p);
  if(!file.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
  try{
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
   res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const url='http://127.0.0.1:'+server.address().port+'/prototypes/verbund/konzern.html';
 let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(url);
   assert.equal(await page.locator('#start204').isDisabled(),true);
   await page.locator('#quelle204').setInputFiles({
    name:'originalfinanzierter-k2-spielstand.json',mimeType:'application/json',buffer:Buffer.from(sample.save)
   });
   assert.equal(await page.locator('#start204').isDisabled(),true);
   await page.locator('#zustimmung204').check();
   await page.locator('#start204').click();
   assert.equal(await page.locator('#konzernwelt').isVisible(),true);
   assert.match(await page.locator('#cash').textContent(),/2400 ISK/);
   assert.equal(await page.locator('#j10-fertige').textContent(),'0');
   const buy=page.locator('[data-aktion="buy-st_nadir-miner"]');
   assert.equal(await buy.count(),1);
   assert.equal(await buy.isEnabled(),true,'authentic paid K2 pickup available');
   assert.match(await buy.textContent(),/600 ISK/);
   await buy.click();
   assert.match(await page.locator('#cash').textContent(),/1800 ISK/);
   assert.match(await page.locator('#weltgeld').textContent(),/33000 ISK/);
   assert.equal(await page.locator('#schiffe tr').count(),2,'original house Aldera + new Nadir miner');
   const n=page.locator('#j9-piloten button').filter({hasText:'nadir'});
   assert.equal(await n.count(),1);
   assert.equal(await n.isEnabled(),true);
   await n.click();
   assert.equal(await page.locator('#raumbereich').isVisible(),true);
   assert.match(await page.locator('#raum-schiff').textContent(),/Miner/);
   assert.match(await page.locator('#raum-lage').textContent(),/Im Dock/);
   await page.locator('#raum-konzern').click();
   assert.equal(await page.locator('#konzernwelt').isVisible(),true);
   const [download]=await Promise.all([
    page.waitForEvent('download'),page.locator('#export204').click()
   ]);
   const tempfile=path.join(os.tmpdir(),'aphros-j10b-k2-'+kind+'-'+width+'-'+process.pid+'.json');
   await download.saveAs(tempfile);
   const raw=fs.readFileSync(tempfile,'utf8');
   fs.unlinkSync(tempfile);
   const p=JSON.parse(raw).w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
   const s=w.load(raw);
   assert.equal(w.audit(s).ok,true);
   const local=s.kanon.minerWerft.lokaleKaeufe;
   assert.equal(local.length,1);
   assert.equal(local[0].preis,600);
   assert.equal(local[0].owner,'house');
   assert.equal(s.ships[local[0].id].heimat,'nadir');
   assert.equal(s.ships[local[0].id].owner,'house');
   assert.equal(s.stations.st_nadir.lager.miner,0);
   assert.equal(s.owners.house.cash,1800);
   assert.equal(Object.values(s.owners).reduce((a,v)=>a+v.cash,0),33000);
   assert.equal(s.minted,0);assert.equal(s.burned,0);
   assert.equal(s.kanon.jaeger.fertig,0,'no free fighter');
   assert.equal(sample.original,OLD.create(42,'private195').export());
   assert.deepEqual(errors,[],'no browser errors');
   console.log('J10B_K2_BROWSER_OK',JSON.stringify({
    browser:kind,width,height,tick:s.tick,miner:local[0].id,
    paid:600,house:s.owners.house.cash,money:33000,hash:w.hash(s)
   }));
   await ctx.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
