// Ergänzt den vorhandenen Duell-Smoke um Patrouille, Handflug, Import und IDB-Schutz.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const PW=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(__dirname,'..'),sample=fs.readFileSync(path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
const w=W.erstellenJ4c(JSON.parse(sample).w5ad.profile);
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(p)]||'text/plain');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const kind=process.env.WELT_BROWSER||'chromium';let browser;
 try{
  browser=await PW[kind].launch(kind==='chromium'?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+':'+r.status());});
   // Nur ausdrücklich bestätigter positiver Wechsel wird zugelassen.
   page.on('dialog',async dialog=>{assert.equal(dialog.type(),'confirm');await dialog.accept();});
   const tap=async id=>{await page.locator('#'+id).scrollIntoViewIfNeeded();await page.locator('#'+id).tap();};
   const base='http://127.0.0.1:'+server.address().port;
   const download=async()=>{
    const [d]=await Promise.all([page.waitForEvent('download'),tap('export')]);
    const saved=fs.readFileSync(await d.path(),'utf8');assert.equal(w.audit(w.load(saved)).ok,true);return saved;
   };
   const snapshot=()=>page.evaluate(async()=>{
    const result={};for(const {name} of await indexedDB.databases()){
     const db=await new Promise((ok,no)=>{const r=indexedDB.open(name);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
     result[name]={};for(const store of db.objectStoreNames){result[name][store]=await new Promise((ok,no)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}db.close();
    }return result;
   });
   try{
    await page.goto(base+'/#root-portal');await page.waitForFunction(()=>document.querySelector('#storage-status').textContent!=='Speicher wird geprüft …');
    assert.match(await page.locator('#root-game-title').textContent(),/APHROS\s+VOID/);
    assert.match(await page.locator('#root-legacy-info h1').textContent(),/W0–W5/,
      'classic economic world remains present even behind its secondary disclosure');
    // Eigener, leerer Browserkontext; kein Zugriff auf Nutzer-Spielstände.
    await page.evaluate(async()=>{const db=await new Promise(ok=>{const r=indexedDB.open('audit-legacy-sentinel',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>ok(r.result);});await new Promise(ok=>{const t=db.transaction('saves','readwrite');t.objectStore('saves').put({original:'erhalten'},'sentinel');t.oncomplete=ok;});db.close();});
    const before=await snapshot();
    await page.locator('#root-portal .root-more summary').tap();
    await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/j4c/index.html"]').tap();await page.waitForURL('**/prototypes/j4c/index.html');
    await tap('beispiel');await page.waitForFunction(()=>document.querySelector('#schiff').textContent.includes('sh023'));
    assert.equal(w.hash(w.load(await download())),'daec00c7618a6cd7');
    await tap('patrouille-start');await tap('abdocken');await tap('play');
    await page.waitForFunction(()=>document.querySelector('#lage').textContent==='frei');await tap('play');
    await tap('steuern');assert.match(await page.locator('#meldung').textContent(),/shipSteer bestätigt/);
    for(let stage=1;stage<=3;stage++){
     await tap('patrouille-ziel');await tap('play');
     await page.waitForFunction(n=>Number(document.querySelector('#patrouille-fortschritt').textContent.split('/')[0])>=n,stage,{timeout:30000});
     await tap('play');
    }
    await tap('patrouille-ziel');await tap('play');
    await page.waitForFunction(()=>document.querySelector('#patrouille-status').textContent==='erfolgreich',null,{timeout:30000});await tap('play');
    const exported=await download(),s=w.load(exported);
    assert.equal(s.ships.sh023.flug.lage,'angedockt');assert.ok(s.owners.pilot_house.cash>JSON.parse(sample).owners.pilot_house.cash);
    assert.ok(w.buchwert(s,'sh023')<900);assert.equal(s.minted,0);assert.equal(s.burned,0);
    await page.locator('#datei').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(exported)});
    await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('geladen'));
    assert.equal(await download(),exported);
    const bad=JSON.parse(exported);bad.kanon.jaeger.kaeufe[0].preis=0;
    await page.locator('#datei').setInputFiles({name:'manipuliert.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
    await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Laden abgebrochen'));
    const nachFehler=await download();
    assert.equal(nachFehler,exported,'ungültiger Import darf den bereits validen und exportierbaren Weltstand niemals ersetzen');
    assert.equal(w.hash(w.load(nachFehler)),w.hash(s),'nach negativem Import bleibt derselbe Replay-Hash erhalten');
    assert.match(await page.locator('#meldung').textContent(),/exportiert/);
    assert.deepEqual(await snapshot(),before,'Regel195 und Sentinel vollständig erhalten');
    assert.deepEqual(errors,[]);if(missing.length){console.error('J4E_MISSING_ASSETS',JSON.stringify({browser:kind,width,height,missing}));process.exitCode=1;}
    console.log('J4E_SECURITY_OK',JSON.stringify({browser:kind,width,height,hash:w.hash(s),tick:s.tick,patrouille:'erfolgreich',import:'positiv/negativ',indexedDB:'unverändert'}));
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
