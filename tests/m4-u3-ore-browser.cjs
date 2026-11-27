// M4-U3 browser: independent paid ore business from the actual public root.
// A true career UI action, not a fabricated state or direct core-side mutation.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const {prepare,importPrepared,SLOT}=require('../scripts/m4-u4-startstand.cjs');
const SLOT208='aphros-void:spielerkarriere:regel208:v1';
const root=path.resolve(__dirname,'..');
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
  const saved=()=>page.evaluate(k=>localStorage.getItem(k),SLOT208);
  const first=await saved(),s=JSON.parse(first);
  assert.equal(s.rulesVersion,208);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),null);
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
   const world=W.erstellenNpcErz208({carrierCash:s.w5ad.profile.carrierCash,buyerCash:s.w5ad.profile.buyerCash});
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

async function isolation(browser,kind,fixture){
 const ctx=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 const el=id=>page.locator('#'+id),read=key=>page.evaluate(k=>localStorage.getItem(k),key);
 const showMenu=()=>el('open-menu').tap();
 async function newCareer(s02=false){
  if(s02){await el('neues-spiel').tap();await el('w6-npc-start').check();await el('karriere-starten').tap();}
  else await el('karriere-direkt').tap();
  await el('spielwelt').waitFor({state:'visible'});
 }
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await importPrepared(page,fixture);assert.equal(await read(SLOT),fixture.json);
  await showMenu();await newCareer();
  const standard=await read(SLOT208);
  assert.equal(JSON.parse(standard).rulesVersion,208);
  assert.equal(await read(SLOT),fixture.json);
  assert.equal(await read(SLOT+':vorherige'),null);
  const expected=J8.erstellen();expected.starten208(true,false);
  assert.equal(standard,expected.exportieren());
  await el('manager-abbau-aktion').tap();assert.equal(expected.ausfuehren('buy-st_aldera-miner').ok,true);
  const working=await read(SLOT208);assert.equal(working,expected.exportieren());
  await showMenu();await el('neues-spiel').tap();
  await el('career-recovery').evaluate(e=>e.open=true);
  await el('fortsetzen-204').tap();
  assert.equal(await read(SLOT),fixture.json);
  assert.equal(await read(SLOT208),working);
  await showMenu();await el('fortsetzen').tap();
  assert.equal(await read(SLOT208),working);
  await showMenu();
  page.once('dialog',d=>d.dismiss());
  await el('karriere-direkt').tap();
  assert.equal(await read(SLOT208),working);
  assert.equal(await read(SLOT208+':vorherige'),null);
  page.once('dialog',d=>d.accept());
  await newCareer(true);
  const s02=await read(SLOT208),j=J8.erstellen();j.starten208(true,true);
  assert.equal(s02,j.exportieren());
  assert.equal(await read(SLOT208+':vorherige'),working);
  assert.equal(await read(SLOT),fixture.json);
  await page.reload();await el('fortsetzen').tap();
  assert.equal(await read(SLOT208),s02);
  await page.reload();await el('neues-spiel').tap();
  await el('career-recovery').evaluate(e=>e.open=true);
  page.once('dialog',d=>d.accept());await el('vorige-208').tap();
  assert.equal(await read(SLOT208),working);assert.equal(await read(SLOT208+':vorherige'),s02);
  assert.equal(await read(SLOT),fixture.json);
  // Real JSON import into its own slot: only the new slot is replaced.
  await page.reload();page.once('dialog',d=>d.accept());
  await el('import-datei').setInputFiles({name:'rule208.json',mimeType:'application/json',buffer:Buffer.from(s02)});
  await el('spielwelt').waitFor({state:'visible'});
  assert.equal(await read(SLOT208),s02);assert.equal(await read(SLOT208+':vorherige'),working);
  assert.equal(await read(SLOT),fixture.json);
  assert.deepEqual(errors,[]);
  console.log('RULE208_BROWSER_SLOT_ISOLATION',JSON.stringify({kind,legacy:204,new:208,oldHash:fixture.hash,
   newHash:j.ansicht().hash,oldBytesUnchanged:true,backupSwap:true,confirmCancel:true,explicitOldResume:true,import:true}));
 }finally{await ctx.close();}
}

async function checkAfterIce(browser,kind,width,height,fixture){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 const el=id=>page.locator('#'+id);
 const saved=()=>page.evaluate(key=>localStorage.getItem(key),SLOT);
 const evidence=process.env.M4_MANAGER_EVIDENCE;
 const capture=async label=>{
  if(evidence)await page.screenshot({path:path.join(evidence,`${kind}-${width}x${height}-after-${label}.png`)});
 };
 const tapSize=async button=>{
  const box=await button.boundingBox();
  assert.ok(box&&box.width>=48&&box.height>=48);
  return box;
 };
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await importPrepared(page,fixture);
  const jump=el('p3-auftragszentrale'),menu=el('open-menu');
  const jumpBox=await tapSize(jump);
  assert.ok(jumpBox.y>=0&&jumpBox.y+jumpBox.height<=height,'orders shortcut must fit the first viewport');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await menu.innerText(),'Hauptmenü');
  await capture('start');
  await menu.tap();
  assert.equal(await el('startseite').isVisible(),true);
  await capture('menu');
  await el('fortsetzen').tap();

  await el('tab-flotte').tap();
  await el('manager-flotte-auswahl').waitFor({state:'visible'});
  if(width===390){
   await jump.focus();
   await page.keyboard.press('Enter');
  }else await jump.tap();
  assert.equal(await el('tab-auftraege').getAttribute('aria-pressed'),'true');
  assert.ok(await el('tab-auftraege').evaluate(e=>e===document.activeElement));
  assert.ok(await el('tab-universum').isVisible());
  assert.equal(await el('manager-transport-aktion').isEnabled(),true);
  const ore=el('manager-erz-aktion'),minerLink=el('manager-erz-minerkauf');
  assert.equal(await ore.isEnabled(),false);
  assert.match(await el('manager-erz-grund').innerText(),/eingeteilt.*Förderpause/);
  await minerLink.scrollIntoViewIfNeeded();
  await tapSize(minerLink);
  await capture('offers');
  await minerLink.tap();
  const purchase=page.locator('#spieleraktionen [data-action="buy-st_aldera-miner"]');
  assert.ok(await purchase.evaluate(e=>e===document.activeElement));
  assert.match(await purchase.innerText(),/Weiteren Miner in Aldera kaufen · 600 ISK/);
  await capture('purchase');
  assert.equal(await saved(),fixture.json,'navigation must not buy, dispatch or advance time');

  const replay=J8.erstellen();
  replay.oeffnen204(fixture.json,true);
  assert.equal(replay.ausfuehren('buy-st_aldera-miner').ok,true);
  await purchase.tap();
  assert.equal(await saved(),replay.exportieren(),'same purchase as the original command');
  const bought=JSON.parse(await saved());
  const miner=Object.values(bought.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.id!=='sh002');
  assert.ok(miner);
  assert.equal(await minerLink.isVisible(),false);
  assert.equal(await ore.isEnabled(),true);
  assert.equal(replay.ausfuehren('ore-'+miner.id).ok,true);
  await ore.tap();
  assert.equal(await saved(),replay.exportieren(),'same dispatch as the original command');

  for(let i=0;i<2;i++){
   replay.weiterspielen(60);
   await el('manager-zeit-aktion').tap();
  }
  const finalJson=await saved(),final=JSON.parse(finalJson);
  assert.equal(finalJson,replay.exportieren(),'same state after the original world clock advances');
  assert.equal(final.stats.konto.house.erloes-bought.stats.konto.house.erloes,500);
  assert.ok(final.stats.verkaeufe[miner.id]>=1);
  assert.equal(final.kanon.pendel.sh002.ware,'eis');
  assert.equal(final.ships[miner.id].owner,'house');
  assert.equal(final.w3.abgeschlossen,0);
  assert.equal(sum(final),33000);
  assert.equal(final.minted,0);
  assert.equal(final.burned,0);
  assert.equal(replay.weltReferenz().audit(replay.zustandReferenz()).ok,true);
  await page.reload();
  await el('fortsetzen').tap();
  assert.equal(await saved(),finalJson);
  assert.deepEqual(errors,[]);
  console.log('M4_U3_AFTER_ICE_BROWSER',JSON.stringify({kind,width,height,minute:final.tick,
   miner:miner.id,revenue:500,hash:replay.ansicht().hash}));
 }finally{await ctx.close();}
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{
   executablePath:process.env.S1_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  const firstPaidTrip=prepare('C');
  await isolation(browser,kind,firstPaidTrip);
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   await check(browser,kind,width,height);
   await checkAfterIce(browser,kind,width,height,firstPaidTrip);
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
