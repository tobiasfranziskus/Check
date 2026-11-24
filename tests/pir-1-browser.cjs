// Touchprüfung des echten PIR-1-Starts und der getrennten Speicherpfade.
'use strict';
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const {createServer}=require('node:http');
const path=require('node:path');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const ROOT=path.resolve(__dirname,'..');
const standard='aphros-void:spielerkarriere:regel204:v1';
const pir='aphros-void:spielerkarriere:pir-1:v1';
const browserName=process.env.WELT_BROWSER||'chromium';
const viewports=[[1180,820],[1024,768],[820,1180],[390,844]];

async function pruefen(browser,url,width,height){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('dialog',dialog=>dialog.accept());
  const tap=sel=>page.locator(sel).tap({timeout:8000});
  const save=key=>page.evaluate(id=>localStorage.getItem(id),key);
  await page.goto(url);
  await tap('#root-portal .root-primary');
  await tap('#neues-spiel');await tap('#karriere-starten');
  const normal=await save(standard);
  assert(normal&&!JSON.parse(normal).kanon.piraten);
  await page.reload();await tap('#neues-spiel');
  assert.equal(await page.locator('#pir-start').isChecked(),false);
  await tap('label[for="pir-start"]');await tap('#karriere-starten');
  assert.match(await page.locator('#mode-indicator').textContent(),/PIR-1/);
  const marke=page.locator('.sektor-pirat');
  assert.match(await marke.textContent(),/Piratenjäger.*Bereitschaft/);
  assert.match(await page.locator('[data-sektor="station:st_nadir"]').textContent(),/Umkämpft/);
  assert.match(await page.locator('[data-sektor="station:st_aldera"]').textContent(),/Sicher/);
  assert.equal(await page.locator('[data-sektor="station:st_dravos"]').count(),0);
  const pos=()=>marke.locator('svg path[transform]').getAttribute('transform');
  const dock=await pos();
  await tap('[data-advance="1"]');assert.match(await marke.textContent(),/Läuft aus/);
  for(let i=0;i<3;i++)await tap('[data-advance="1"]');
  assert.notEqual(await pos(),dock);
  for(let i=0;i<3;i++)await tap('[data-advance="60"]');
  for(let i=0;i<2;i++)await tap('[data-advance="10"]');
  await tap('.sektor-pirat');
  assert.match(await page.locator('#sektor-details').textContent(),/sh002.*198.*Korridorbericht/);
  assert.equal(await page.locator('#sektor-details [data-sektor-detail="flotte"]').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const text=await save(pir), w=W.erstellenPiraten(), result=w.load(text);
  assert(result.owners.pilot_piraten.cash>0);
  assert.equal(await save(standard),normal);
  const download=page.waitForEvent('download');await tap('#welt-export');
  const json=await readFile(await (await download).path());
  assert.equal(json.toString(),text);
  await page.reload();await tap('#fortsetzen-pir');
  assert.equal(await save(pir),text);
  await page.reload();
  await page.locator('#import-datei').setInputFiles({name:'pir.json',mimeType:'application/json',buffer:json});
  await marke.waitFor({state:'visible',timeout:8000});
  assert.equal(await save(pir),text);
  await tap('#open-menu');await tap('#fortsetzen');
  assert.equal(await marke.count(),0);assert.equal(await save(standard),normal);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:browserName,width,height,hash:w.hash(result),lohn:result.owners.pilot_piraten.cash}));
 }finally{await context.close();}
}

async function main(){
 const server=createServer(async(req,res)=>{
  try{
   const file=path.join(ROOT,req.url==='/'?'index.html':new URL(req.url,'http://localhost').pathname);
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
   res.end(await readFile(file));
  }catch(e){res.statusCode=404;res.end('Nicht gefunden');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const browser=await pw[browserName].launch({executablePath:process.env.PIR_BROWSER_PATH});
  try{
   for(const [width,height] of viewports)await pruefen(browser,'http://127.0.0.1:'+server.address().port,width,height);
  }finally{await browser.close();}
 }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
