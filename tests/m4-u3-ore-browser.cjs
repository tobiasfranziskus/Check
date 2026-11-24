// M4-U3 browser: independent paid ore business from the actual public root.
// A true career UI action, not a fabricated state or direct core-side mutation.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(__dirname,'..');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep))
  return res.writeHead(404).end();
 try{
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
const sum=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
async function check(browser,kind,width,height){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForURL('**/prototypes/spiel/index.html');
  await page.waitForURL('**/prototypes/spiel/index.html');
  await page.waitForLoadState('load');
  await page.locator('#neues-spiel').tap();
  await page.locator('#briefing').waitFor({state:'visible'});
  await page.locator('#karriere-starten').tap();
  const ore=page.locator('#manager-erz-aktion'),buy=page.locator('#manager-abbau-aktion');
  assert.equal(await ore.isEnabled(),false,'no house miner yet');
  await buy.tap();
  assert.equal(await ore.isEnabled(),true,'paid original W1 ore must be available at new career start');
  assert.match(await ore.innerText(),/50 Erz/);
  const b=await ore.boundingBox();
  assert.ok(b&&b.width>=48&&b.height>=48,'iPad-accessible ore action');
  if(width===390){await ore.focus();await page.keyboard.press('Enter');}
  else await ore.tap();
  const saved=()=>page.evaluate(k=>localStorage.getItem(k),SLOT);
  const first=await saved(),s=JSON.parse(first);
  assert.equal(s.kanon.pendel.sh002.ware,'erz');
  assert.equal(s.ships.sh002.owner,'house');
  assert.equal(s.w3.abgeschlossen,0,'W1 is not misrepresented as W3');
  assert.equal(sum(s),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(await ore.isEnabled(),false,'no duplicate ore task');
  assert.deepEqual(errors,[]);
  await page.reload();
  await page.locator('#fortsetzen').tap();
  assert.equal(await saved(),first,'reload must preserve the actual ore contract');
  if(width===1180){
   const world=W.erstellenJ4c({carrierCash:s.w5ad.profile.carrierCash,buyerCash:s.w5ad.profile.buyerCash});
   let final=s,done=false,minutes=0;
   for(let i=0;i<16;i++){
    await page.locator('#manager-zeit-aktion').tap();
    minutes+=60;
    final=JSON.parse(await saved());
    assert.equal(sum(final),33000);
    assert.equal(final.minted,0);assert.equal(final.burned,0);
    assert.equal(world.audit(world.load(JSON.stringify(final))).ok,true);
    if(final.stats.konto.house.erloes>=500&&final.ledger.erz.mined>=50){
      done=true;break;
    }
   }
   assert.equal(done,true,'real ore sale must be paid in the browser');
   assert.equal(final.w3.abgeschlossen,0);
   const json=await saved();
   await page.reload();await page.locator('#fortsetzen').tap();
   assert.equal(await saved(),json,'ore sale survives reload');
   console.log('M4_U3_ORE_BROWSER_PAID',JSON.stringify({kind,width,height,minutes,
     revenue:final.stats.konto.house.erloes,ore:final.ledger.erz.mined,
     hash:world.hash(world.load(json))}));
  }else console.log('M4_U3_ORE_BROWSER_TOUCH',JSON.stringify({kind,width,height,
    quote:'paid',owner:s.ships.sh002.owner,world:sum(s)}));
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{
   executablePath:process.env.S1_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]])
   await check(browser,kind,width,height);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
