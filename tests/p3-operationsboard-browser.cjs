'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');

const basis=process.env.M4_BASELINE_ROOT;
const root=basis?path.resolve(basis):path.resolve(__dirname,'..');
const slot='aphros-void:spielerkarriere:regel204:v1';
const forschung='aphros-void:spielerkarriere:regel207-forschung:v1';
const bilder=process.env.M4_SCREENSHOT_DIR;
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

function vorlage(){
 const j=J8.erstellen(),experiment=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 experiment.startenP8g(true);
 function buchen(id){
  const r=j.ausfuehren(id);
  assert.equal(r.ok,true,r.reason);
 }
 buchen('buy-st_aldera-miner');
 buchen('buy-st_aldera-frachter');
 const schiffe=j.ansicht().schiffe;
 const miner=schiffe.find(sh=>sh.klasse==='miner').id;
 const frachter=schiffe.find(sh=>sh.klasse==='frachter').id;
 buchen('ice-'+miner);
 j.weiterspielen(60);j.weiterspielen(60);
 buchen('freight-'+frachter);
 assert.equal(j.ansicht().hash,'30a46fa2f3f3a2e3');
 return {j,miner,frachter,dravos:experiment.exportieren()};
}

async function pruefen(browser,kind,base,width,height){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
 const page=await ctx.newPage(),fehler=[];
 page.on('pageerror',e=>fehler.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))fehler.push(r.url());});
 const {j,miner,frachter,dravos}=vorlage();
 const hin=j.exportieren(),loc=s=>page.locator(s);
 const auswahl=loc('#sektor-auswahl'),karte=loc('#sektor-karte'),details=loc('#sektor-details');
 const marker=id=>karte.locator('[data-sektor="schiff:'+id+'"]');
 const save=key=>page.evaluate(k=>localStorage.getItem(k),key||slot);
 const plus=async minuten=>{
  await loc('[data-advance="'+minuten+'"]').tap();
  j.weiterspielen(minuten);
  assert.equal(await save(),j.exportieren(),'Browser und Originalbefehlsfolge liefern denselben Save');
 };
 try{
  await page.addInitScript(([standard,experiment,normalSave,researchSave])=>{
   if(!localStorage.getItem(standard))localStorage.setItem(standard,normalSave);
   if(!localStorage.getItem(experiment))localStorage.setItem(experiment,researchSave);
  },[slot,forschung,hin,dravos]);
  await page.goto(base);
  await page.getByRole('link',{name:/^Wirtschaftsmanager/}).tap();
  await loc('#fortsetzen').tap();
  assert.equal(await karte.locator('.sektor-station').count(),2);
  assert.equal(await marker(frachter).locator('..').getAttribute('class'),'sektor-strecke');
  await marker(frachter).tap();
  assert.match(await details.innerText(),/Aldera → Nadir.*eis: 50.*Hinfahrt/s);
  if(!basis)assert.match(await marker(frachter).innerText(),/Abflug/);
  assert.equal(await save(),hin);
  await plus(10);
  if(bilder){
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   await page.screenshot({path:path.join(bilder,kind+'-'+width+'x'+height+'.jpg'),quality:88});
   await loc('#management-spielfeld').screenshot({path:path.join(bilder,kind+'-'+width+'x'+height+'-karte.jpg'),quality:88});
  }
  if(basis)return;
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  const markerPosition=()=>marker(frachter).locator('svg g').getAttribute('transform');
  assert.match(await marker(frachter).innerText(),/10 \/ 60 Flugminuten/);
  const position=await markerPosition(),vorAuswahl=await save();
  const stationen=karte.locator('.sektor-station svg path[fill-rule]');
  assert.equal(new Set(await stationen.evaluateAll(paths=>paths.map(p=>p.getAttribute('d')))).size,2);
  assert.notEqual(await marker(miner).locator('polygon').getAttribute('points'),
   await marker(frachter).locator('polygon').getAttribute('points'));
  assert.equal(await details.getByText('Restbuchwert', {exact:false}).isVisible(),false);
  await details.getByText('Schiffsdetails',{exact:true}).tap();
  const buchwert=j.weltReferenz().buchwert(j.zustandReferenz(),frachter);
  assert.equal(await details.getByText('Restbuchwert: '+buchwert+' ISK').isVisible(),true);
  const sperre=j.angebote().find(o=>o.id==='freight-'+frachter).reason;
  assert.ok((await details.locator('p').allTextContents()).some(text=>text.endsWith(' · '+sperre)));
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await details.locator('details').getAttribute('open'),null);

  const fremd=Object.values(JSON.parse(hin).ships).find(s=>s.owner!=='house');
  await marker(fremd.id).tap();
  assert.match(await marker(fremd.id).innerText(),/Fremd/);
  assert.match(await details.innerText(),/Eigentümer.*Bergbau/s);
  assert.equal(await details.getByRole('button').count(),0);
  assert.equal(await marker(fremd.id).locator('svg g').count(),1);
  assert.equal(await marker(fremd.id).locator('svg > path').count(),0);
  await auswahl.focus();
  await page.keyboard.press('Tab');
  assert.equal(await karte.locator(':focus-visible').count(),1);
  await page.keyboard.press('Enter');
  assert.equal(await auswahl.inputValue(),'station:st_aldera');
  await marker(frachter).tap();
  assert.equal(await markerPosition(),position,'Auswahl und Wartezeit bewegen den Marker nicht');
  assert.equal(await save(),vorAuswahl,'Karte bucht keinen Auftrag und verändert keinen Tick');
  for(const gruppe of [karte.getByRole('button'),details.getByRole('button'),auswahl,details.locator('summary')]){
   for(const ziel of await gruppe.all()){
    const box=await ziel.boundingBox();
    assert.ok(box&&box.width>=48&&box.height>=48);
   }
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  const markerDetails=details.locator('summary');
  await markerDetails.tap();
  await markerDetails.focus();
  await loc('[data-advance="60"]').evaluate(button=>button.click());
  j.weiterspielen(60);
  assert.equal(await save(),j.exportieren());
  assert.equal(await markerDetails.evaluate(el=>el===document.activeElement),true);
  assert.equal(await details.locator('details').evaluate(el=>el.open),true);
  assert.match(await details.innerText(),/Nadir → Aldera.*leer.*Rückfahrt.*50 Eis in Nadir geliefert/s);
  assert.notEqual(await markerPosition(),position);
  assert.match(await marker(frachter).innerText(),/10 \/ 60 Flugminuten/);
  await plus(60);
  assert.equal(await karte.locator('.sektor-strecke .sektor-schiff').count(),0);
  assert.match(await details.innerText(),/Am Dock · Aldera/);
  await details.getByRole('button',{name:'In Flotte disponieren'}).tap();
  assert.equal(await loc('#manager-flotte-auswahl').inputValue(),frachter);
  const dock=await save();
  assert.equal(await loc('#tab-flotte').getAttribute('aria-pressed'),'true');
  assert.equal(dock,j.exportieren());
  const downloadFertig=page.waitForEvent('download');
  await loc('#welt-export').tap();
  const download=await downloadFertig;
  const json=fs.readFileSync(await download.path());
  assert.equal(json.toString('utf8'),dock,'Dateiexport entspricht dem unveränderten Original-JSON');
  await page.reload();
  page.once('dialog',dialog=>dialog.accept());
  await loc('#import-datei').setInputFiles({
   name:download.suggestedFilename(),mimeType:'application/json',buffer:json
  });
  await karte.waitFor();
  await auswahl.selectOption('schiff:'+frachter);
  assert.match(await details.innerText(),/Am Dock · Aldera/);
  assert.equal(await save(),dock);
  await loc('#open-menu').tap();
  await loc('#fortsetzen-w6').tap();
  await karte.locator('.sektor-dravos button').tap();
  assert.match(await details.innerText(),/Dravos/);
  assert.equal(await karte.locator('.sektor-station').count(),3);
  assert.equal(await save(forschung),dravos);
  assert.equal(await save(),dock);
  assert.deepEqual(fehler,[]);
  console.log('M4_OPERATIONSBOARD_OK',kind,width+'x'+height,j.ansicht().hash);
 }finally{await ctx.close();}
}

(async()=>{
 if(bilder)fs.mkdirSync(bilder,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=kind==='webkit'?await webkit.launch():await chromium.launch({
   executablePath:process.env.S1_CHROMIUM_PATH||undefined,args:['--no-sandbox']
  });
  for(const [b,h,prefix] of [[1180,820,'/'],[1024,768,'/Check/'],[820,1180,'/nas/spiele/aphros/'],[390,844,'/Check/']])
   await pruefen(browser,kind,base+prefix,b,h);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
