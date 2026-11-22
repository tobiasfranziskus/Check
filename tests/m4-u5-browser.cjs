'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {marktS02}=require('../tools/m4-management-szenarien.cjs');

const root=path.resolve(__dirname,'..');
const slot='aphros-void:spielerkarriere:regel204:v1';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(file!==path.join(root,'index.html')&&!file.startsWith(path.join(root,'prototypes')+path.sep))
  return res.writeHead(404).end();
 try{
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});

async function pruefen(browser,art,width,height,json,markt){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await ctx.newPage(),fehler=[];
 page.on('pageerror',e=>fehler.push(String(e)));
 const el=id=>page.locator('#'+id);
 const save=()=>page.evaluate(key=>localStorage.getItem(key),slot);
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.getByRole('link',{name:/^Wirtschaftsmanager/}).tap();
  await page.waitForURL('**/prototypes/spiel/index.html');
  await el('import-datei').setInputFiles({name:'m4-u5-replay.json',mimeType:'application/json',buffer:Buffer.from(json)});
  await el('manager-transport-status').waitFor({state:'visible'});
  assert.equal(await save(),json);
  assert.match(await el('manager-transport-status').innerText(),/130 Eis auf Lager, 20 Plätze frei.*50 Eis/);
  assert.match(await el('manager-transport-grund').innerText(),/zu wenig Platz.*118 Wasser/);
  assert.match(await el('manager-erz-status').innerText(),/500 ISK beim Exportkäufer.*Fluglöhne/);
  assert.equal(await el('manager-transport-aktion').isEnabled(),false);
  assert.equal(await el('manager-erz-aktion').isEnabled(),false);
  assert.match(await el('manager-aussetzen-aktion').innerText(),/Erzförderung beenden/);
  assert.doesNotMatch(await el('manager-disposition').innerText(),/\b(?:F4|W1|W3|K1)\b/);
  await el('auftrag-details').locator('summary').first().tap();
  assert.equal(await el('auftrag-belege').getByText(/^Fracht sh003/).count(),5);
  assert.equal(await el('auftrag-belege-archiv').isVisible(),true);
  await el('tab-flotte').tap();
  await el('manager-flotte-auswahl').selectOption('sh004');
  assert.match(await el('manager-flotte-stand').innerText(),/Erzförderung/);
  const stop=page.locator('[data-dispo-action="stop-sh004"]');
  const box=await stop.boundingBox();
  assert.ok(box&&box.width>=48&&box.height>=48);
  if(width===390){await stop.focus();await page.keyboard.press('Enter');}
  else await stop.tap();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).kanon.pendel.sh004?.beenden,slot);
  const nachher=await save();
  assert.deepEqual(JSON.parse(nachher).owners,JSON.parse(json).owners,'Stopp bewegt kein Geld');
  await page.reload();
  await el('fortsetzen').tap();
  assert.equal(await save(),nachher);
  assert.deepEqual(fehler,[]);
  console.log(art,width,height,'48 Fahrten, Lager- und Käufersperren, Erzstopp, Reload');
  // The new transport career must never autosave into the standard slot.
  const transportSlot='aphros-void:spielerkarriere:transport-forschung:v1';
  const transportSave=()=>page.evaluate(key=>localStorage.getItem(key),transportSlot);
  assert.equal(await el('manager-industrie-transport').isVisible(),false);
  await el('open-menu').tap();
  page.on('dialog',dialog=>dialog.accept());
  await el('transport-kopie').tap();
  await el('manager-industrie-transport').waitFor({state:'visible'});
  assert.equal(await save(),nachher);
  assert.equal(JSON.parse(await transportSave()).kanon.u7Manager,true);
  await el('tab-auftraege').tap();
  const stopOther=el('spieleraktionen').locator('[data-action="stop-sh005"]');
  await stopOther.tap();
  const advance=page.locator('[data-advance="1"]');
  const permit=el('manager-industrie-aktionen').locator('[data-action="industry-accept-sh003"]');
  for(let n=0;n<240&&!(await permit.count());n++)await advance.tap();
  await permit.waitFor({state:'visible'});
  assert.equal(await permit.isEnabled(),true);
  const bounds=await permit.boundingBox();assert.ok(bounds&&bounds.width>=48&&bounds.height>=48);
  assert.match(await el('manager-industrie-status').innerText(),/Bergbau und Werft haben zugestimmt/);
  await permit.tap();
  const signed=await transportSave();
  assert.equal(JSON.parse(signed).kanon.industrieErz.signFracht,true);
  assert.equal(await permit.count(),0,'accepted offer leaves no second enabled control');
  assert.equal(JSON.parse(signed).w3.auftrag,null,'consent alone cannot bind funds');
  await el('auftrag-minute').tap();
  const water=el('manager-industrie-aktionen').locator('[data-action="industry-water-sh003"]');
  await water.waitFor({state:'visible'});
  await water.tap();
  const checkpoint=await transportSave();
  assert.equal(JSON.parse(checkpoint).w3.auftrag.wasserZustimmung,true);
  assert.equal(await save(),nachher);
  await page.reload();
  await el('transport-fortsetzen').tap();
  await el('manager-industrie-transport').waitFor({state:'visible'});
  assert.equal(await transportSave(),checkpoint);
  for(let n=0;n<10&&JSON.parse(await transportSave()).w3.auftrag;n++)
   await page.locator('[data-advance="60"]').tap();
  const finished=JSON.parse(await transportSave());
  assert.equal(finished.w3.abgeschlossen,1);
  assert.equal(finished.w5ad.freight.at(-1).owner,'house');
  assert.ok(finished.kanon.wasser.rueckGeliefert>1414);
  assert.match(await el('manager-industrie-status').innerText(),/Letzter Industrieauftrag/);
  const minuten=page.locator('[data-advance="60"]');
  for(let n=0;n<10&&JSON.parse(await transportSave()).w5.fertig===0;n++)await minuten.tap();
  const built=JSON.parse(await transportSave());
  assert.equal(built.w5.fertig,1);
  assert.equal(built.w5.materialVerbraucht,5);
  assert.equal(built.owners.k7_werft_treuhand.cash,0);
  assert.match(await el('manager-industrie-werft').innerText(),/Werftkauf gesperrt.*Asterion/);
  await el('manager-industrie-werftweg').tap();
  await el('p3-industrie').waitFor({state:'visible'});
  assert.equal(await el('p3-industrie-kauf').isEnabled(),false);
  assert.match(await el('p3-industrie-w5').innerText(),/1 fertige Frachter/);
  await el('auftrag-details').locator('summary').first().tap();
  assert.match(await el('auftrag-belege').innerText(),/Industriefracht sh003 · 50 Erz/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await save(),nachher);
  await el('open-menu').tap();
  await el('fortsetzen').tap();
  assert.equal(await el('manager-industrie-transport').isVisible(),false);
  assert.equal(await save(),nachher);
  assert.deepEqual(fehler,[]);
  console.log(art,width,height,'U7/U8: NPC-Angebot, Zustimmung, physische Industrie-/Wasserfahrt, separater Save und Wechsel zur Standardkarriere');
  await page.reload();
  await el('import-datei').setInputFiles({name:'s02-werft.json',mimeType:'application/json',buffer:Buffer.from(markt)});
  await el('manager-industrie-transport').waitFor({state:'visible'});
  assert.equal(await transportSave(),markt);
  assert.match(await el('manager-industrie-werft').innerText(),/750 ISK verfügbar/);
  await el('manager-industrie-werftweg').tap();
  await el('p3-industrie-kauf').tap();
  const nachKauf=await transportSave(),gekauft=JSON.parse(nachKauf);
  const neue=gekauft.kanon.spielerFrachterKaeufe.at(-1);
  assert.equal(neue.preis,750);
  assert.equal(gekauft.ships[neue.id].owner,'house');
  assert.equal(gekauft.owners.house.cash,JSON.parse(markt).owners.house.cash-750);
  assert.equal(gekauft.stations.st_nadir.lager.frachter,0);
  assert.equal(await el('p3-industrie-kauf').isEnabled(),false);
  const kaufTaste=await el('p3-industrie-kauf').boundingBox();
  await page.touchscreen.tap(kaufTaste.x+kaufTaste.width/2,kaufTaste.y+kaufTaste.height/2);
  assert.equal(await transportSave(),nachKauf,'repeated touch cannot buy the sold hull');
  for(let n=0;n<6&&!(await el('p3-industrie-transfer').isEnabled());n++)await minuten.tap();
  await el('p3-industrie-transfer').tap();
  assert.equal(JSON.parse(await transportSave()).w5ac.active.id,neue.id);
  await minuten.tap();
  const afterFerry=JSON.parse(await transportSave());
  assert.equal(afterFerry.ships[neue.id].system,'aldera');
  assert.equal(afterFerry.w5ac.completed.find(x=>x.id===neue.id).kosten,60);
  for(let n=0;n<6&&!(await el('p3-industrie-fracht').isEnabled());n++){
   const ice=el('spieleraktionen').locator('[data-action^="ice-"]:enabled');
   if(await ice.count())await ice.first().tap();
   else if(await el('spieleraktionen').locator('[data-action="buy-st_aldera-miner"]:enabled').count())
    await el('spieleraktionen').locator('[data-action="buy-st_aldera-miner"]').tap();
   await minuten.tap();
  }
  await el('p3-industrie-fracht').tap();
  const freight=await transportSave();
  await page.reload();
  await el('transport-fortsetzen').tap();
  assert.equal(await transportSave(),freight);
  await minuten.tap();await minuten.tap();
  const bezahlt=JSON.parse(await transportSave()).kanon.spielerFrachten.auftraege.at(-1);
  assert.equal(bezahlt.schiff,neue.id);
  assert.ok(bezahlt.end>bezahlt.geliefert);
  assert.equal(bezahlt.menge,50);assert.equal(bezahlt.arbeit,120);assert.equal(bezahlt.fracht,240);
  assert.equal(await save(),nachher);
  assert.deepEqual(fehler,[]);
  console.log(art,width,height,'S02: 750 ISK Kauf, 60 ISK Überführung, bezahlte Folgefracht und Reload',neue.id);
 }finally{await ctx.close();}
}

(async()=>{
 const json=engpassNach48().exportieren();
 const {welt,s}=marktS02(),markt=welt.save(s);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const art=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=art==='webkit'?await webkit.launch():await chromium.launch({
   executablePath:process.env.S1_CHROMIUM_PATH||undefined,args:['--no-sandbox']
  });
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]])
   await pruefen(browser,art,width,height,json,markt);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
