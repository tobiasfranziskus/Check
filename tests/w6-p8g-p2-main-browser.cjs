// W6/P8g research-only browser wiring on the ACTUAL P1/P2 game entry.
// Touch Chromium/WebKit emulation; no false claim of real iPad validation.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const sizes=[[1180,820],[1024,768],[820,1180],[390,844]];
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  const f=p==='/'?path.join(ROOT,'index.html'):path.resolve(ROOT,'.'+p);
  if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()||!/\.(html|js|css)$/.test(f)){
   res.writeHead(404).end();return;
  }
  res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)],'Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(res);
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const which=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (which==='webkit'?webkit:chromium).launch(which==='webkit'?{}:{args:['--no-sandbox']});
 try{
  for(const [width,height] of sizes){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html');
    await page.locator('#neues-spiel').tap();
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const before=await page.evaluate(slot=>localStorage.getItem(slot),SLOT);
    assert.equal(JSON.parse(before).rulesVersion,204);
    const result=await page.evaluate(()=>{
      const API=window.AphrosWelt;
      if(!API||typeof API.erstellenP8d!=='function')throw Error('P8d-Modul im echten Browser-Einstieg nicht geladen');
      if(!window.P8dFracht?.create)throw Error('P8d-Browser-Merkmal fehlt');
      const original=API.erstellenJ4c({carrierCash:2000,buyerCash:4000});
      const pre=original.createState(42);
      const origHash=original.hash(pre);
      const research=API.erstellenP8d({carrierCash:2000,buyerCash:4000});
      const w6=research.createState(42,{politik:{stilllegung:true,betriebsreserve:{werft_extern:1060}}});
      if(w6.rulesVersion!==207||w6.kanon.materialSupplyEnabled!==undefined)throw Error('Dravos darf nicht still aktiviert werden');
      research.npcAutoSetzen(w6,true);
      research.npcSiliziumSetzen(w6,true);
      research.materialSupplySetzen(w6,true);
      const audit=research.audit(w6);
      if(!audit.ok)throw Error('W6-Audit '+audit.fehler.join('; '));
      const save=research.save(w6),hash=research.hash(w6);
      const roundtrip=research.load(save);
      if(hash!==research.hash(roundtrip))throw Error('W6 browser save/reload drift');
      const external=API.erstellenP8d({carrierCash:2000,buyerCash:4000});
      let denied=false;
      try{external.load(save)}catch(e){denied=/externer Import/.test(String(e.message));}
      if(!denied)throw Error('P8g foreign browser JSON improperly self-authorizes');
      const confirmed=external.load(save,{p8gImportFreigegeben:true});
      if(external.hash(confirmed)!==hash)throw Error('separately authorized P8g import drift');
      if(original.hash(pre)!==origHash)throw Error('public original world mutated');
      return {rule:207,hash,oldRule:pre.rulesVersion,oldHash:origHash,
        cash:Object.values(w6.owners).reduce((n,o)=>n+o.cash,0),
        mint:w6.minted,burn:w6.burned,parts:w6.kanon.bauteile.abgeschlossen,
        researchEnabled:w6.kanon.materialSupplyEnabled};
    });
    assert.equal(result.rule,207);
    assert.equal(result.oldRule,204);
    assert.equal(result.cash,33000);
    assert.equal(result.mint,0);assert.equal(result.burn,0);
    assert.equal(result.researchEnabled,true);
    assert.equal(await page.evaluate(slot=>localStorage.getItem(slot),SLOT),before,
      'P8g research API must not overwrite public Rule204 career');
    assert.deepEqual(errors,[]);
    console.log('W6_P8G_P2_BROWSER_OK',JSON.stringify({browser:which,width,height,...result}));
   }finally{await ctx.close();}
  }
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1});
