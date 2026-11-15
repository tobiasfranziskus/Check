// J14 independent public-root -> import legitimate multi-ship J2b career -> cockpit resume.
// The fixture is produced from real funded Rule195->204 commands, never fake stock.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const J8=require('../prototypes/verbund/konzern-session.js');
const W=require('../prototypes/welt/welt-kern.js');
const {erzeugen}=require('./j10b-k2-kauf-fixture.cjs');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const initial=()=>{
 const prepared=erzeugen('house'),ses=J8.erstellen();
 ses.oeffnen204(prepared.save,true);
 assert.equal(ses.ausfuehren('buy-st_nadir-miner').ok,true);
 const own=Object.values(ses.zustandReferenz().ships).filter(s=>s.owner==='house');
 assert.ok(own.length>=2);
 const miner=own.find(s=>s.heimat==='nadir'&&s.klasse==='miner');
 assert.ok(miner);assert.equal(ses.ausfuehren('sil-start-'+miner.id).ok,true);
 assert.equal(ses.zustandReferenz().kanon.silizium.auftrag.owner,'house');
 assert.equal(ses.flugAudit().ok,true);
 return {json:ses.exportieren(),minerId:miner.id,house:ses.ansicht().hausgeld};
};
(async()=>{
 const source=initial(),root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep)){
   res.writeHead(404).end();return;
  }
  try{
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
   res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');
   res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(origin+'/');
    await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]').tap();
    await page.waitForURL('**/prototypes/spiel/index.html');
    // Only this resume-specific QA uses a genuine, fully funded external JSON.
    await page.locator('#import-datei').setInputFiles({
     name:'j14-real-registered-multi-ship-silicon.json',
     mimeType:'application/json',buffer:Buffer.from(source.json)
    });
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    await page.locator('#tab-flotte').tap();
    const pilot=page.locator('[data-pilot="'+source.minerId+'"]');
    assert.equal(await pilot.count(),1);
    assert.equal(await pilot.isEnabled(),true,'real J2b booked miner must be available after import');
    const saved=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    assert.equal(saved,source.json,'import and rendering never mutate the original approved world');
    await pilot.tap();
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.match(await page.locator('#raum-schiff').textContent(),/Miner/);
    assert.match(await page.locator('#raum-audit').textContent(),/Audit OK/);
    const linked=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    assert.equal(linked,source.json,'controller selection must never alter saved money or ships');
    // Use the original F6 undock action. This spends only already authorised
    // flight wages and cannot give the player remote control of the other miner.
    const undock=page.locator('[data-raum="dock-abdocken"]');
    assert.equal(await undock.isVisible(),true);
    await undock.tap();
    const out=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const p=JSON.parse(out).w5ad.profile;
    const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
    const s=w.load(out);
    assert.equal(w.audit(s).ok,true);
    assert.equal(s.kanon.silizium.auftrag.schiff,source.minerId);
    assert.equal(s.ships[source.minerId].owner,'house');
    assert.equal(s.ships[source.minerId].flug.lage,'abdocken',
     'Original-Core-Abdockphase ist noch nicht frei; keine Flugteleportation');
    assert.equal(Object.values(s.owners).reduce((v,o)=>v+o.cash,0),33000);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    await page.reload();
    await page.locator('#fortsetzen').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    await page.locator('#tab-flotte').tap();
    assert.equal(await pilot.isEnabled(),true,'reloaded running J2b flight retains recovery rights');
    await pilot.tap();
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.deepEqual(errors,[]);
    console.log('J14_P1_BROWSER_OK',JSON.stringify({kind,width,height,
      ship:source.minerId,house:source.house,hash:w.hash(s),worldMoney:33000,
      mint:0,burn:0,pilotRecovered:true}));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
