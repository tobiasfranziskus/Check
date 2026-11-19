// P3 browser acceptance: two original F4 rounds from the public entry using
// only the displayed decision button. No separate currency, storage or engine.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(__dirname,'..');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep+'prototypes'+path.sep))
  return res.writeHead(404).end();
 try{
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.getByRole('link',{name:/^Wirtschaftsmanager/}).tap();
    // The navigation may complete before all bottom-of-body JavaScript listeners
    // have been installed. Wait for actual document load BEFORE the mobile tap.
    await page.waitForURL('**/prototypes/spiel/index.html');
    await page.waitForLoadState('load');
    if(kind==='chromium'&&width===1180&&process.env.M0_SCREENSHOT_DIR)
     await page.screenshot({path:path.join(process.env.M0_SCREENSHOT_DIR,'m0-einstieg.jpg'),quality:82});
    await page.locator('#neues-spiel').tap();
    await page.locator('#briefing').waitFor({state:'visible'});
    assert.match(await page.locator('.briefing-bottom').innerText(),/Kaufe beide Schiffe, bevor du Wirtschaftszeit/);
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#p3-handelsauftrag').isVisible(),true);
    assert.equal(await page.locator('#pilotenausbildung-details').getAttribute('open'),null);
    assert.equal(await page.locator('#hausgeld').innerText(),'3.000 ISK');
    assert.equal(await page.locator('#schiff-anzahl').innerText(),'0');
    assert.match(await page.locator('#p3-handelsziel').textContent(),/Miner erwerben/);
    assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true);
    const handel=page.locator('#p3-handelsaktion');
    assert.match(await handel.textContent(),/Bergbauschiff kaufen/);
    assert.equal(await page.locator('#p3-handelsdetails').getAttribute('open'),null);
    const knopf=await handel.boundingBox();
    assert.ok(knopf && knopf.height>=48 && knopf.y>=0 && knopf.y+knopf.height<=height);
    const initial=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const zeitVorKauf=await page.locator('#zeit').innerText();
    const kaufhinweis=page.locator('#p3-kaufhinweis');
    assert.match(await kaufhinweis.innerText(),/beide Schiffe, bevor du Wirtschaftszeit/);
    assert.equal(await kaufhinweis.isVisible(),true);
    await handel.tap();
    assert.match(await handel.textContent(),/Frachter erwerben/);
    assert.equal(await kaufhinweis.isVisible(),true);
    await handel.tap();
    assert.equal(await page.locator('#hausgeld').innerText(),'1.650 ISK');
    assert.equal(await page.locator('#schiff-anzahl').innerText(),'2');
    assert.equal(await page.locator('#zeit').innerText(),zeitVorKauf,'purchases do not advance time');
    assert.equal(await kaufhinweis.isVisible(),false);
    assert.match(await handel.textContent(),/Eisförderung beginnen/);
    await handel.tap();
    for(let i=0;i<2;i++){
     assert.equal(await handel.textContent(),'60 Spielminuten weiter');
     await handel.tap();
    }
    assert.equal(await handel.textContent(),'Eisfracht transportieren');
    await handel.tap();
    assert.notEqual(await page.locator('#missions li:last-child').getAttribute('class'),'done',
      'an open freight order is not a completed delivery');
    for(let i=0;i<2;i++){
     assert.equal(await handel.textContent(),'60 Spielminuten weiter');
     await handel.tap();
    }
    assert.equal(await page.locator('#missions li:last-child').getAttribute('class'),'done',
      'paid completed freight must permanently complete the career milestone');
    assert.equal(await page.locator('#raumbereich').isVisible(),false);
    assert.match(await page.locator('#p3-handelsstand').innerText(),/1 bezahlte Rundfahrt · 240 ISK Frachtgebühren · 120 ISK Fluglöhne/);
    const firstSave=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const first=JSON.parse(firstSave);
    const world=W.erstellenJ4c({carrierCash:first.w5ad.profile.carrierCash,buyerCash:first.w5ad.profile.buyerCash});
    assert.equal(first.rulesVersion,204);
    assert.equal(first.kanon.spielerFrachten.gebuehr,240);
    assert.equal(first.kanon.spielerFrachten.lohn,120);
    assert.deepEqual(Object.values(first.ships).filter(sh=>sh.owner==='house').map(sh=>sh.klasse).sort(),['frachter','miner']);
    const firstWorld=world.load(firstSave);
    assert.equal(world.audit(firstWorld).ok,true);
    const firstHash=world.hash(firstWorld);
    if(kind==='chromium'&&width===1180&&process.env.M0_SCREENSHOT_DIR)
     await page.screenshot({path:path.join(process.env.M0_SCREENSHOT_DIR,'m0-erste-eisfracht.jpg'),quality:82});
    await page.reload();
    await page.locator('#fortsetzen').tap();
    const resumed=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    assert.equal(world.hash(world.load(resumed)),firstHash);
    assert.match(await page.locator('#p3-handelsstand').innerText(),/240 ISK Frachtgebühren · 120 ISK Fluglöhne/);
    assert.equal(await page.locator('#missions li:last-child').getAttribute('class'),'done',
      'first paid freight remains a milestone after reload');
    console.log('M0_MANAGER_BROWSER_OK',JSON.stringify({kind,width,height,firstHash}));
    for(let i=0;i<45;i++){
     const json=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     const s=JSON.parse(json),w=W.erstellenJ4c({carrierCash:s.w5ad.profile.carrierCash,buyerCash:s.w5ad.profile.buyerCash});
     assert.equal(w.audit(w.load(json)).ok,true);
     assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
     assert.equal(s.minted,0);assert.equal(s.burned,0);
     const completed=(s.kanon.spielerFrachten?.auftraege||[]).filter(a=>a.end!==null&&a.geliefert!==null).length;
     if(completed>=2)break;
     assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true,
       'Original P3 offer blocked after '+completed+' deliveries: '+await page.locator('#p3-handelssperre').textContent());
     await page.locator('#p3-handelsaktion').tap();
    }
    const final=await page.evaluate(k=>localStorage.getItem(k),SLOT),s=JSON.parse(final);
    assert.ok(s.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length>=2);
    assert.match(await page.locator('#p3-handelsstand').textContent(),/2 bezahlte Rundfahrten/);
    assert.ok(s.kanon.spielerFrachten.gebuehr>=480);
    await page.locator('#p3-handelsdetails summary').tap();
    assert.match(await page.locator('#p3-handelszahlen').innerText(),/Verfügbare Kasse/);
    assert.equal(final.includes('p3-handels'),false);
    assert.notEqual(final,initial);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.reload();await page.locator('#fortsetzen').tap();
    assert.match(await page.locator('#p3-handelsstand').textContent(),/2 bezahlte Rundfahrten/);
    assert.equal(await page.locator('#missions li:last-child').getAttribute('class'),'done',
      'a later business cycle must not erase the completed first shipment');
    // P3 chapter 03: continue the same career until earned asset-adjusted surplus
    // exceeds the exact original 600-ISK hull price. No additional profile or world.
    assert.equal(await page.locator('#p3-investition').isVisible(),true);
    assert.match(await page.locator('#p3-invest-bilanz').textContent(),/\+525 ISK/);
    for(let i=0;i<10;i++){
     const json=await page.evaluate(k=>localStorage.getItem(k),SLOT),raw=JSON.parse(json);
     if((raw.kanon.spielerFrachten?.auftraege||[]).filter(a=>a.end!==null).length>=3)break;
     assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true);
     await page.locator('#p3-handelsaktion').tap();
    }
    const preText=await page.evaluate(k=>localStorage.getItem(k),SLOT),pre=JSON.parse(preText);
    assert.equal(pre.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length,3);
    assert.equal(pre.owners.house.cash,2594);
    assert.match(await page.locator('#p3-invest-bilanz').textContent(),/\+751 ISK/);
    assert.match(await page.locator('#p3-invest-markt').textContent(),/258 ISK Käuferkasse/);
    assert.equal(await page.locator('#p3-invest-aktion').isEnabled(),true);
    const preShips=new Set(Object.keys(pre.ships));
    await page.locator('#p3-invest-aktion').tap();
    const investedText=await page.evaluate(k=>localStorage.getItem(k),SLOT),invested=JSON.parse(investedText);
    const newMiner=Object.values(invested.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&!preShips.has(sh.id));
    assert.ok(newMiner,'a second actual owned miner, never gifted');
    assert.equal(invested.owners.house.cash,1994,'exact original 600 ISK purchase');
    assert.equal(invested.stations.st_aldera.lager.miner,1,'original stock consumed once');
    const wInvest=W.erstellenJ4c({carrierCash:invested.w5ad.profile.carrierCash,buyerCash:invested.w5ad.profile.buyerCash});
    const loaded=wInvest.load(investedText);
    assert.equal(wInvest.audit(loaded).ok,true);
    assert.equal(wInvest.buchwert(loaded,newMiner.id),600);
    assert.equal(Object.values(invested.owners).reduce((n,o)=>n+o.cash,0),33000);
    assert.equal(invested.minted,0);assert.equal(invested.burned,0);
    assert.equal(await page.locator('#p3-invest-aktion').isEnabled(),true);
    await page.locator('#p3-invest-aktion').tap();
    let workingText=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    assert.equal(JSON.parse(workingText).kanon.pendel[newMiner.id].ware,'eis','new miner got own real core job');
    await page.locator('[data-advance="60"]').tap();
    workingText=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const working=JSON.parse(workingText),workingHash=wInvest.hash(wInvest.load(workingText));
    assert.equal(wInvest.audit(wInvest.load(workingText)).ok,true);
    assert.equal(wInvest.buchwert(wInvest.load(workingText),newMiner.id),600,
      'the real new miner is idle under existing inventory/financing restrictions');
    await page.reload();await page.locator('#fortsetzen').tap();
    const resume=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    assert.equal(wInvest.hash(wInvest.load(resume)),workingHash);
    assert.equal(await page.locator('#p3-investition').isVisible(),true);
    // Chapter 04: no invented demand. Advance the real paid career until the
    // finite buyer account blocks a new ice batch, then VOLUNTARILY consume
    // physical Aldera water from the player's already earned pilot wages.
    let blockText=null,block=null;
    for(let i=0;i<85;i++){
     const raw=await page.evaluate(k=>localStorage.getItem(k),SLOT);
     const now=JSON.parse(raw),cost=wInvest.rules.w5n.charge*wInvest.rules.w5n.eisPreis;
     if(now.owners.st_aldera.cash<cost && await page.locator('#p3-wasser-aktion').isEnabled()){
      blockText=raw;block=now;break;
     }
     assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true,
       'No legal buyer repayment path after '+i+' more player decisions');
     await page.locator('#p3-handelsaktion').tap();
    }
    assert.ok(block,'original buyer shortage with a real affordable private-water route');
    const cost=wInvest.rules.w5n.charge*wInvest.rules.w5n.eisPreis;
    const price=W.DATEN.wasser.preisAldera;
    const qty=Math.ceil((cost-block.owners.st_aldera.cash)/price),sum=qty*price;
    assert.ok(qty>0&&qty<=block.stations.st_aldera.lager.wasser);
    assert.equal(await page.locator('#p3-wasser-kreislauf').isVisible(),true);
    assert.match(await page.locator('#p3-wasser-aktion').textContent(),new RegExp(qty+' Wasser für '+sum+' ISK'));
    const existingRounds=block.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length;
    await page.locator('#p3-wasser-aktion').tap();
    const paid=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
    assert.equal(paid.owners.pilot_house.cash,block.owners.pilot_house.cash-sum);
    assert.equal(paid.owners.st_aldera.cash,block.owners.st_aldera.cash+sum);
    assert.equal(paid.stations.st_aldera.lager.wasser,block.stations.st_aldera.lager.wasser-qty);
    assert.equal(paid.ledger.wasser.consumed,block.ledger.wasser.consumed+qty);
    assert.equal(wInvest.audit(wInvest.load(JSON.stringify(paid))).ok,true);
    for(let i=0;i<40;i++){
     const latest=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
     if(latest.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length>existingRounds)break;
     assert.equal(await page.locator('#p3-handelsaktion').isEnabled(),true);
     await page.locator('#p3-handelsaktion').tap();
    }
    const afterWaterText=await page.evaluate(k=>localStorage.getItem(k),SLOT);
    const afterWater=JSON.parse(afterWaterText);
    assert.ok(afterWater.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length>existingRounds,
      'private consumption funded at least one further original F4 round');
    assert.equal(wInvest.audit(wInvest.load(afterWaterText)).ok,true);
    assert.equal(Object.values(afterWater.owners).reduce((n,o)=>n+o.cash,0),33000);
    assert.equal(afterWater.minted,0);assert.equal(afterWater.burned,0);
    const waterHash=wInvest.hash(wInvest.load(afterWaterText));
    await page.reload();await page.locator('#fortsetzen').tap();
    assert.equal(wInvest.hash(wInvest.load(await page.evaluate(k=>localStorage.getItem(k),SLOT))),waterHash);
    assert.deepEqual(errors,[]);
    console.log('P3_WATER_BROWSER_OK',JSON.stringify({
     kind,width,height,roundsBefore:existingRounds,roundsAfter:afterWater.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length,
     water:qty,wageDebit:sum,buyerBefore:block.owners.st_aldera.cash,buyerAfter:paid.owners.st_aldera.cash,hash:waterHash
    }));

    // Chapter 05: real NPC earnings and independent freight market.
    assert.equal(await page.locator('#p3-npc-markt').isVisible(),true);
    assert.match(await page.locator('#p3-npc-geld').textContent(),/NPC-Wasserkäufe: Aldera/);
    assert.match(await page.locator('#p3-npc-frachter').textContent(),/Asterion-Frachter:/);
    assert.equal(await page.locator('#p3-npc-aktion').isEnabled(),true);
    const beforeNpc=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
    const button=await page.locator('#p3-npc-aktion').textContent();
    await page.locator('#p3-npc-aktion').tap();
    const npcJson=await page.evaluate(k=>localStorage.getItem(k),SLOT),afterNpc=JSON.parse(npcJson);
    assert.equal(wInvest.audit(wInvest.load(npcJson)).ok,true);
    assert.equal(Object.values(afterNpc.owners).reduce((n,o)=>n+o.cash,0),33000);
    assert.equal(afterNpc.minted,0);assert.equal(afterNpc.burned,0);
    if(/60 reguläre/.test(button))assert.equal(afterNpc.tick,beforeNpc.tick+60);
    else {
     assert.match(button,/Original-Fracht/);
     assert.equal(afterNpc.tick,beforeNpc.tick);
     assert.ok(afterNpc.w5n.frachtauftrag,'original contract started rather than fabricated time');
    }
    const npcHash=wInvest.hash(wInvest.load(npcJson));
    await page.reload();await page.locator('#fortsetzen').tap();
    assert.equal(wInvest.hash(wInvest.load(await page.evaluate(k=>localStorage.getItem(k),SLOT))),npcHash);
    assert.equal(await page.locator('#p3-npc-markt').isVisible(),true);
    assert.deepEqual(errors,[]);
    console.log('P3_NPC_MARKT_BROWSER_OK',JSON.stringify({
      kind,width,height,aktion:button,tick:afterNpc.tick,hash:npcHash
    }));

    console.log('P3_REINVEST_BROWSER_OK',JSON.stringify({
     kind,width,height,rounds:3,cash:working.owners.house.cash,
     newMiner:newMiner.id,alderaBudget:working.owners.st_aldera.cash,
     world:33000,mint:0,burn:0,hash:workingHash}));

    console.log('P3_TRADE_BROWSER_OK',JSON.stringify({kind,width,height,freight:s.kanon.spielerFrachten.auftraege.length,
      fees:s.kanon.spielerFrachten.gebuehr,house:s.owners.house.cash,world:33000}));
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
