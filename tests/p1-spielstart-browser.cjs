// P1: real visitor flow, no sample-save upload: public root → story → new career
// → authentic Rule195→204 conversion → paid miner → real RAUM cockpit → safe save/resume.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const W=require('../prototypes/welt/welt-kern.js');
const OLD=require('../prototypes/w5ac/session.js');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
async function siliziumPilot(browser,base,width,height,kind){
 // Conditional integration check only: independently signed original K2 fixture.
 // The regular career/project path above never imports it or signs for NPCs.
 const fixture=require('./j10b-k2-kauf-fixture.cjs').erzeugen('house');
 const context=await browser.newContext({viewport:{width,height},hasTouch:true});
 await context.addInitScript(({key,save})=>localStorage.setItem(key,save),{key:SLOT,save:fixture.save});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/prototypes/spiel/index.html');await page.locator('#fortsetzen').tap();
  await page.locator('#tab-jaeger').tap();
  await page.locator('[data-j13-action="buy-st_nadir-miner"]').tap();
  const paid=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
  const m=Object.values(paid.ships).find(s=>s.owner==='house'&&s.system==='nadir'&&s.klasse==='miner');
  assert.ok(m);
  await page.locator('[data-j13-action="sil-start-'+m.id+'"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true,'select legitimate pilot before binding J2b');
  const raw=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
  assert.equal(raw.kanon.silizium.auftrag.schiff,m.id);
  assert.equal(raw.kanon.silizium.auftrag.owner,'house');
  assert.equal(raw.minted,0);assert.equal(raw.burned,0);
  await page.locator('#raum-konzern').tap();await page.locator('#tab-flotte').tap();
  assert.equal(await page.locator('[data-pilot="'+m.id+'"]').isEnabled(),true,'current lawful pilot can return');
  await page.locator('[data-pilot="'+m.id+'"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('J13B_CONDITIONAL_K2_BROWSER_OK',JSON.stringify({kind,width,height,miner:m.id}));
 }finally{await context.close();}
}
async function projektPfad(browser,base,width,height,kind){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/prototypes/spiel/index.html');
  await page.locator('#neues-spiel').tap();await page.locator('#karriere-starten').tap();
  await page.locator('#tab-jaeger').tap();
  for(const id of ['buy-st_aldera-frachter','buy-st_aldera-miner'])
   await page.locator('[data-j13-action="'+id+'"]').tap();
  const paid=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),SLOT));
  const m=Object.values(paid.ships).find(s=>s.owner==='house'&&s.klasse==='miner');
  const f=Object.values(paid.ships).find(s=>s.owner==='house'&&s.klasse==='frachter');
  assert.equal(paid.owners.house.cash,1650);
  await page.locator('[data-j13-action="ice-'+m.id+'"]').tap();
  assert.equal(await page.locator('#panel-jaeger').isVisible(),true);
  for(let i=0;i<2;i++)await page.locator('[data-advance="60"]').tap();
  const freight=page.locator('[data-j13-action="freight-'+f.id+'"]');
  assert.equal(await freight.isEnabled(),true);await freight.tap();
  const transit=await page.evaluate(k=>localStorage.getItem(k),SLOT);
  await page.reload();await page.locator('#fortsetzen').tap();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),transit);
  for(let i=0;i<2;i++)await page.locator('[data-advance="60"]').tap();
  const text=await page.evaluate(k=>localStorage.getItem(k),SLOT),raw=JSON.parse(text),p=raw.w5ad.profile;
  const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),end=w.load(text);
  assert.equal(w.audit(end).ok,true);assert.equal(w.hash(end),'e4514490aedc13bd');
  assert.equal(end.kanon.spielerFrachten.lohn,120);assert.equal(end.kanon.spielerFrachten.gebuehr,240);
  assert.equal(Object.values(end.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(end.minted,0);assert.equal(end.burned,0);assert.equal(end.kanon.jaeger.fertig,0);
  await page.locator('#tab-jaeger').tap();
  assert.equal(await page.locator('#jaeger-kaufweg').isDisabled(),true);
  assert.equal(await page.locator('[data-j13-action="buy-st_nadir-miner"]').isDisabled(),true);
  assert.match(await page.locator('#jaeger-rohstoffe').textContent(),/Eigene belegte Siliziumverkäufe: 0/);
  assert.deepEqual(errors,[]);
  console.log('J13B_PROJECT_BROWSER_OK',JSON.stringify({kind,width,height,hash:w.hash(end),jaeger:0,money:33000}));
 }finally{await context.close();}
}
// W6/X1: sichtbarer, ausdruecklicher S02-Karriere-Opt-in ohne Altstandmigration.
// Jede Touchgroesse benutzt denselben echten P1-Rootweg und den Original-204-Core.
async function w6Optin(browser,base,width,height,kind){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/prototypes/spiel/index.html');
  await page.locator('#neues-spiel').tap();
  const label=page.locator('label[for="w6-npc-start"]');
  const box=await label.boundingBox();assert.ok(box?.height>=72,'Touchziel fuer W6-Opt-in');
  assert.equal(await page.locator('#w6-npc-start').isChecked(),false);
  await label.tap();
  assert.equal(await page.locator('#w6-npc-start').isChecked(),true);
  await page.locator('#karriere-starten').tap();
  assert.equal(await page.locator('#spielwelt').isVisible(),true);
  assert.equal(await page.locator('#w6-status').isVisible(),true);
  const raw=await page.evaluate(k=>localStorage.getItem(k),SLOT),s=JSON.parse(raw);
  const p=s.w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
  assert.equal(s.kanon.npcAuto,true);
  assert.deepEqual(s.kanon.npcSilizium,{aktiv:true,werftauftrag:false});
  assert.equal(s.kanon.politik.stilllegung,true);
  assert.equal(s.kanon.politik.betriebsreserve.werft_extern,1060);
  assert.equal(s.tick,0);assert.equal(s.owners.house.cash,3000);
  assert.equal(w.audit(w.load(raw)).ok,true);
  assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),33000);
  await page.locator('[data-advance="60"]').tap();
  await page.locator('[data-advance="1440"]').tap();
  const after=await page.evaluate(k=>localStorage.getItem(k),SLOT),s2=JSON.parse(after);
  assert.equal(s2.tick,1500,'+1 Spieltag verwendet exakt 24 Original-60-Minuten-Schritte');
  assert.equal(s2.kanon.npcAuto,true);
  assert.equal(w.audit(w.load(after)).ok,true);
  assert.equal(s2.minted,0);assert.equal(s2.burned,0);
  await page.reload();
  await page.locator('#fortsetzen').tap();
  assert.equal(await page.locator('#w6-status').isVisible(),true);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),after,
    'W6-Save wird bei Resume weder migriert noch still veraendert');
  assert.deepEqual(errors,[]);
  console.log('W6_P1_OPTIN_BROWSER_OK',JSON.stringify({kind,width,height,
    tick:s2.tick,hash:w.hash(w.load(after)),weltgeld:33000,originalHaus:3000}));
 }finally{await context.close();}
}
// P4: a *previously legally purchased* original Rule204 fighter (900 ISK)
// enters the very same public P1 career through the protected local save slot.
// No toy purchase, fake ships, virtual currency, or second simulation.
async function karrierePatrouille(browser,base,width,height,kind){
 const save=fs.readFileSync(path.join(__dirname,'../prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
 const original=JSON.parse(save);
 assert.ok(original.kanon.jaeger.kaeufe.some(k=>k.id==='sh023'&&k.owner==='house'&&k.preis===900));
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
 await ctx.addInitScript(({key,json})=>localStorage.setItem(key,json),{key:SLOT,json:save});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/prototypes/spiel/index.html');
  await page.locator('#fortsetzen').tap();
  await page.locator('#tab-flotte').tap();
  await page.locator('[data-pilot="sh023"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  assert.match(await page.locator('#raum-schiff').textContent(),/Jäger/);
  const before=await page.evaluate(key=>localStorage.getItem(key),SLOT);
  assert.equal(before,save,'opening paid fighter must not change world');
  await page.locator('[data-raum="dock-patrouille"]').tap();
  assert.match(await page.locator('#raum-ladung').textContent(),/Patrouille bereit · 0\/3/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),before,
    'starting observer mission must not generate money, goods, or a new save');
  assert.equal(await page.locator('[data-raum="objekt-boje:0"]').count(),1,
    'first geometric checkpoint is visible in the existing cockpit');
  await page.locator('#raum-tempo-300').tap();
  await page.locator('#raum-abdocken').tap();
  await page.waitForFunction(()=>/Patrouille flug/.test(document.querySelector('#raum-ladung').textContent),null,{timeout:15000});
  await page.locator('[data-raum="objekt-boje:0"]').tap();
  await page.locator('[data-raum="ziel-anfliegen"]').tap();
  await page.waitForFunction(()=>/Patrouille flug · 1\/3/.test(document.querySelector('#raum-ladung').textContent),null,{timeout:30000});
  await page.locator('#raum-start').tap();
  const data=await page.evaluate(key=>localStorage.getItem(key),SLOT),s=JSON.parse(data),p=s.w5ad.profile;
  const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
  assert.equal(w.audit(w.load(data)).ok,true);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.ships.sh023.owner,'house');
  assert.deepEqual(errors,[]);
  console.log('P4_PAID_FIGHTER_PATROL_BROWSER_OK',JSON.stringify({kind,width,height,ship:'sh023',
    checkpoints:1,total:3,money:33000,hash:w.hash(w.load(data))}));
 }finally{await ctx.close();}
}


// P4/F8-E: legally produced and bought original fighter in the public career.
// The target, projectiles and adversary are only temporary training overlays.
async function karriereDuell(browser,base,width,height,kind){
 const saved=fs.readFileSync(path.join(__dirname,'../prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
 const record=JSON.parse(saved);
 assert.ok(record.kanon.jaeger.kaeufe.some(k=>k.id==='sh023'&&k.owner==='house'&&k.preis===900));
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
 await ctx.addInitScript(({key,json})=>localStorage.setItem(key,json),{key:SLOT,json:saved});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/');
  await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]').tap();
  await page.locator('#fortsetzen').tap();
  await page.locator('#tab-flotte').tap();
  await page.locator('[data-pilot="sh023"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  assert.match(await page.locator('#raum-schiff').textContent(),/Jäger/);
  assert.equal(await page.locator('#raum-duell').isHidden(),true,'dock must not enable training fire');
  assert.equal(await page.locator('#raum-feuer').isHidden(),true);
  await page.locator('#raum-tempo-300').tap();
  await page.locator('#raum-abdocken').tap();
  await page.waitForFunction(()=>/Freier Flug|Handflug/.test(
    document.querySelector('#raum-lage').textContent),null,{timeout:18000});
  await page.locator('#raum-start').tap(); // halt original F6 clock for an atomic duel start
  assert.equal(await page.locator('#raum-duell').isVisible(),true);
  const before=await page.evaluate(key=>localStorage.getItem(key),SLOT);
  await page.locator('#raum-duell').tap();
  assert.match(await page.locator('#raum-ladung').textContent(),/Training aktiv/);
  assert.equal(await page.locator('[data-raum="objekt-drohne"]').count(),1);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),before,
    'virtual encounter cannot mint a world entity or modify world JSON');
  assert.equal(await page.locator('#raum-feuer').isVisible(),true);
  await page.locator('#raum-feuer').tap();
  assert.match(await page.locator('#raum-meldung').textContent(),/Trainingsprojektil gestartet/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),before,
    'virtual shooting cannot mint ammunition or write damages');
  await page.locator('[data-raum="objekt-drohne"]').tap();
  await page.locator('[data-raum="ziel-anfliegen"]').tap();
  await page.waitForFunction(previous=>document.querySelector('#raum-zeit').textContent!==previous,
    await page.locator('#raum-zeit').textContent(),{timeout:18000});
  if(await page.locator('#raum-start').getAttribute('aria-pressed')==='true')
    await page.locator('#raum-start').tap();
  const auditText=await page.evaluate(key=>localStorage.getItem(key),SLOT);
  const current=JSON.parse(auditText);
  const profile=current.w5ad.profile;
  const w=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
  assert.equal(w.audit(w.load(auditText)).ok,true);
  assert.equal(Object.values(current.owners).reduce((sum,o)=>sum+o.cash,0),33000);
  assert.equal(current.minted,0);assert.equal(current.burned,0);
  assert.equal(current.ships.sh023.owner,'house');
  assert.equal(auditText.includes('zielprobe'),false);
  assert.equal(auditText.includes('gegnerGeschosse'),false);
  assert.deepEqual(errors,[]);
  console.log('P4_PUBLIC_CAREER_PAID_F8_DUEL_OK',JSON.stringify({kind,width,height,ship:'sh023',
    worldMoney:33000,hash:w.hash(w.load(auditText))}));
 }finally{await ctx.close();}
}


async function managerAkademiePfad(browser,base,width,height,kind){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const key=SLOT;
 const proof=async()=>{
   const saved=await page.evaluate(k=>localStorage.getItem(k),key);
   const loaded=JSON.parse(saved),p=loaded.w5ad.profile;
   const world=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
   assert.equal(world.audit(world.load(saved)).ok,true);
   assert.equal(loaded.minted,0);assert.equal(loaded.burned,0);
   assert.equal(Object.values(loaded.owners).reduce((n,o)=>n+o.cash,0),33000);
   return {saved,loaded,hash:world.hash(world.load(saved))};
 };
 try{
  await page.goto(base+'/prototypes/spiel/index.html');
  await page.locator('#neues-spiel').tap();
  await page.locator('#karriere-starten').tap();
  const card=page.locator('#manager-akademie');
  assert.equal(await card.count(),1);
  await card.locator('summary').tap();
  assert.equal(await card.locator('nav [data-manager-mission]').count(),8);
  const before=await proof();
  await card.locator('[data-manager-mission="markt"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  assert.equal(await page.locator('#panel-auftraege').isVisible(),true);
  assert.equal((await proof()).saved,before.saved,'opening quote menu must not buy anything');
  await card.locator('[data-manager-mission="miner"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  assert.equal((await proof()).saved,before.saved,'tutorial CTA never executes a purchase');
  await page.locator('[data-action="buy-st_aldera-miner"]').tap();
  assert.match(await card.locator('[data-manager-mission="miner"]').textContent(),/✓/);
  await card.locator('[data-manager-mission="frachter"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  await page.locator('[data-action="buy-st_aldera-frachter"]').tap();
  assert.match(await card.locator('[data-manager-mission="frachter"]').textContent(),/✓/);
  assert.equal((await proof()).loaded.owners.house.cash,1650);
  await card.locator('[data-manager-mission="foerderung"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  const miner=Object.values((await proof()).loaded.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  const frachter=Object.values((await proof()).loaded.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert.ok(miner&&frachter);
  await page.locator('[data-action="ice-'+miner.id+'"]').tap();
  assert.match(await card.locator('[data-manager-mission="foerderung"]').textContent(),/✓/);
  await card.locator('[data-manager-mission="bestand"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  assert.equal(await page.locator('#panel-universum').isVisible(),true);
  assert.match(await card.locator('[data-manager-mission="bestand"]').textContent(),/✓/);
  await card.locator('[data-manager-mission="transport"]').tap();
  assert.equal(await card.locator('.manager-akademie-goto').isDisabled(),true,'no prepaid cargo before real mining');
  for(let i=0;i<2;i++)await page.locator('[data-advance="60"]').tap();
  await card.locator('.manager-akademie-goto').tap();
  assert.equal(await page.locator('#panel-auftraege').isVisible(),true);
  await page.locator('[data-action="freight-'+frachter.id+'"]').tap();
  assert.match(await card.locator('[data-manager-mission="transport"]').textContent(),/✓/);
  await card.locator('[data-manager-mission="abrechnung"]').tap();
  assert.doesNotMatch(await card.locator('[data-manager-mission="abrechnung"]').textContent(),/✓/,
    'real delivery is not paid on departure');
  for(let i=0;i<2;i++)await page.locator('[data-advance="60"]').tap();
  assert.match(await card.locator('[data-manager-mission="abrechnung"]').textContent(),/✓/);
  const result=await proof();
  assert.match(result.hash,/^[0-9a-f]{16}$/,'audited original world hash');
  assert.equal(result.loaded.kanon.spielerFrachten.lohn,120);
  assert.equal(result.loaded.kanon.spielerFrachten.gebuehr,240);
  assert.doesNotMatch(await card.locator('[data-manager-mission="verkauf"]').textContent(),/✓/,
    'freight fees are not a silicon sale');
  await page.reload();
  await page.locator('#fortsetzen').tap();
  const reopened=page.locator('#manager-akademie');
  await reopened.locator('summary').tap();
  assert.match(await reopened.locator('[data-manager-mission="abrechnung"]').textContent(),/✓/,
    'completed original-core delivery stays complete on reload');
  assert.equal((await proof()).hash,result.hash);
  assert.deepEqual(errors,[]);
  console.log('P1_MANAGER_ACADEMY_BROWSER_OK',JSON.stringify({kind,width,height,money:33000,hash:result.hash,chapters:8}));
 }finally{await ctx.close();}
}


// Integrated career, not the standalone import host: two academies, one paid world.
async function pilotAkademieKarrierePfad(browser,base,width,height,kind){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const state=async()=>{
  const saved=await page.evaluate(key=>localStorage.getItem(key),SLOT);
  const raw=JSON.parse(saved),p=raw.w5ad.profile;
  const world=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
  const val=world.load(saved);assert.equal(world.audit(val).ok,true);
  assert.equal(Object.values(raw.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(raw.minted,0);assert.equal(raw.burned,0);
  assert.equal(saved.includes('trainingAlt'),false);
  return {saved,raw,hash:world.hash(val)};
 };
 try{
  await page.goto(base+'/prototypes/spiel/index.html');
  await page.locator('#neues-spiel').tap();await page.locator('#karriere-starten').tap();
  const pilot=page.locator('#pilotenausbildung');
  assert.equal(await pilot.isVisible(),true);
  assert.equal(await page.locator('#manager-akademie').count(),1,'manager stays integrated');
  await pilot.locator('summary').tap();
  assert.equal(await pilot.locator('[data-lektion]').count(),12);
  assert.equal(await pilot.locator('[data-lektion]:enabled').count(),0,'no free starting ship');
  const before=await state();
  await page.locator('[data-action="buy-st_aldera-miner"]').tap();
  const bought=await state();
  assert.equal(bought.raw.owners.house.cash,2400,'real 600 ISK miner payment');
  assert.equal(await pilot.locator('[data-lektion="auswahl"]').isDisabled(),true,'select the legal pilot first');
  await page.locator('#tab-flotte').tap();
  const miner=Object.values(bought.raw.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert.ok(miner);
  await page.locator('[data-pilot="'+miner.id+'"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  await page.locator('#raum-konzern').tap();
  assert.equal(await page.locator('#spielwelt').isVisible(),true);
  await pilot.locator('[data-lektion="auswahl"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  assert.match(await page.locator('#pilotenausbildung-live').textContent(),/Geschafft/);
  assert.equal((await state()).saved,bought.saved,'select mission cannot change save');
  await page.locator('#raum-konzern').tap();
  await pilot.locator('[data-lektion="abdocken"]').tap();
  assert.equal(await page.locator('#raumbereich').isVisible(),true);
  await page.locator('#raum-abdocken').tap();
  await page.locator('#raum-tempo-60').tap();
  await page.waitForFunction(()=>document.querySelector('#raum-lage').textContent.includes('Freier Flug'),null,{timeout:18000});
  const stick=page.locator('#raum-knueppel');await stick.scrollIntoViewIfNeeded();const b=await stick.boundingBox();
  assert.ok(b?.width>40);
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width-9,b.y+b.height/2,{steps:5});await page.mouse.up();
  await page.waitForFunction(()=>/Geschafft/.test(document.querySelector('#pilotenausbildung-live').textContent),null,{timeout:18000});
  const flight=await state();
  assert.equal(flight.raw.ships[miner.id].owner,'house');
  assert.equal(flight.raw.ships[miner.id].flug.lage,'frei');
  assert.notEqual(flight.hash,before.hash,'real paid flight must update economic world');
  await page.locator('#raum-start').tap();
  await page.locator('#raum-konzern').tap();
  await pilot.locator('[data-lektion="aufschalten"]').tap();
  await page.locator('#raum-ziele').getByRole('button',{name:/Station Aldera/}).tap();
  await page.locator('#raum-zielaktionen').getByRole('button',{name:'Aufschalten',exact:true}).tap();
  await page.locator('#raum-zielaktionen').getByRole('button',{name:'Aufschaltung lösen',exact:true}).tap();
  assert.match(await page.locator('#pilotenausbildung-live').textContent(),/Geschafft/);
  const final=await state();
  await page.locator('#raum-konzern').tap();
  await page.locator('#welt-sichern').tap();
  await page.reload();await page.locator('#fortsetzen').tap();
  assert.equal((await state()).saved,final.saved);
  assert.equal(await page.locator('#pilotenausbildung').count(),1);
  assert.equal(await page.locator('#manager-akademie').count(),1);
  assert.equal(await page.locator('#pilotenausbildung-live').isHidden(),true,
    'training progress intentionally not added to economic save');
  assert.deepEqual(errors,[]);
  console.log('P1_PILOT_IN_CAREER_OK',JSON.stringify({kind,width,height,chapters:12,worldMoney:33000,hash:final.hash}));
 }finally{await ctx.close();}
}

(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const reqPath=new URL(req.url,'http://localhost').pathname;
   const file=reqPath==='/'?path.join(root,'index.html'):path.resolve(root,'.'+reqPath);
   const safe=file===path.join(root,'index.html')||file.startsWith(root+path.sep+'prototypes'+path.sep);
   if(!safe||!/\.(html|js|css)$/.test(file)){res.writeHead(404).end();return;}
   try{
    const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
    res.writeHead(200,{'Content-Type':mime[ext]||'text/plain','Cache-Control':'no-store'});
    res.end(fs.readFileSync(file));
   }catch(e){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium',factory=kind==='webkit'?webkit:chromium;
 let browser;
 try{
  browser=await factory.launch(kind==='webkit'?{}:{args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
   // P2 cockpit inspection hook: expose the existing read-only browser QA API,
   // without introducing a second world, command path, or product-code global.
   await page.addInitScript(()=>{
     let component;
     Object.defineProperty(window,'RaumCockpit',{
       configurable:true,
       get(){return component;},
       set(api){
         component=api;
         const original=api.verbinden;
         api.verbinden=function(...args){
           const cockpit=original.apply(this,args);
           api.sitzung=cockpit;
           return cockpit;
         };
       }
     });
   });

   try{
    await page.goto(base+'/');
    const gateway=page.locator('#root-portal');
    assert.equal(await gateway.isVisible(),true,'public root must offer the premium game entry');
    assert.match(await page.locator('#root-game-title').textContent(),/APHROS\s+VOID/);
    assert.equal(await page.locator('#root-legacy-info').count(),1);
    assert.equal(await page.locator('#root-legacy-info').evaluate(el=>el.open),false);
    assert.equal(await page.locator('#klassische-wirtschaft').count(),1);
    assert.equal(await page.locator('#save').count(),1,'original W0-W5 save button kept');
    assert.equal(await page.locator('#import').count(),1,'original W0-W5 import kept');
    assert.doesNotMatch(await gateway.textContent(),/Regel\s*20[47]|Prototyp|richtiger Miner/i);
    const entry=page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/spiel/index.html"]');
    assert.equal(await entry.count(),1,'visible first-class game entry from public root');
    await entry.tap();
    await page.waitForURL('**/prototypes/spiel/index.html');
    assert.equal(await page.locator('#startseite').isVisible(),true);
    assert.equal(await page.locator('#fortsetzen').isDisabled(),true);
    assert.equal(await page.locator('.entry-features article').count(),3);
    assert.doesNotMatch(await page.locator('#startseite').textContent(),/Regel\s*20[47]|Prototyp|richtiger Miner/i);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      'premium career start must not have horizontal overflow');
    assert.equal(await page.locator('#vorige-karriere').isHidden(),true);
    assert.match(await page.locator('h1').textContent(),/APHROS\s+VOID/);
    await page.locator('#neues-spiel').tap();
    assert.equal(await page.locator('#briefing').isVisible(),true);
    assert.equal(await page.locator('.faction').count(),4);
    assert.match(await page.locator('#briefing').textContent(),/Meridian Rohstoffwerke/);
    assert.match(await page.locator('#briefing').textContent(),/Asterion Logistik/);
    assert.match(await page.locator('#briefing').textContent(),/Nadir Schiffswerke/);
    assert.doesNotMatch(await page.locator('#briefing').textContent(),/Regel\s*20[47]|P8g|Prototyp|richtiger Miner/i);
    assert.match(await page.locator('#briefing').textContent(),/Aldera.*Nadir/s);
    await page.locator('#karriere-starten').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    assert.equal(await page.locator('#startseite').isVisible(),false);
    assert.match(await page.locator('#hausgeld').textContent(),/3[.,]000\s*ISK/);
    assert.match(await page.locator('#weltgeld').textContent(),/33[.,]000\s*ISK/);
    assert.equal(await page.locator('#schiff-anzahl').textContent(),'0');
    const rawStart=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    const st=JSON.parse(rawStart),p=st.w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
    assert.equal(w.audit(w.load(rawStart)).ok,true);
    assert.equal(st.rulesVersion,204);assert.equal(st.tick,0);
    assert.equal(st.minted,0);assert.equal(st.burned,0);
    assert.equal(Object.values(st.owners).reduce((n,o)=>n+o.cash,0),33000);
    // J12: the Universe tab is now a live, read-only terminal in the SAME career.
    await page.locator('#tab-universum').tap();
    assert.equal(await page.locator('#panel-universum').isVisible(),true);
    const terminal=page.locator('#sektorwirtschaft');
    assert.equal(await terminal.locator('.economy-card').count()>=6,true);
    const report=await terminal.textContent();
    assert.match(report,/Aldera/);
    assert.match(report,/Nadir/);
    assert.match(report,/Meridian Rohstoffwerke/);
    assert.match(report,/Nadir Schiffswerke/);
    assert.doesNotMatch(report,/\b(?:st_aldera|st_nadir|npc3|werft_extern)\b/,
      'the player-visible report should never expose internal owner IDs');
    assert.match(report,/33[.,]000 ISK/);
    assert.match(report,/Neu ausgegebene ISK:\s*0 · Eingezogene ISK:\s*0/);
    const link=terminal.locator('[data-j12-offer="buy-st_aldera-miner"]');
    assert.equal(await link.count(),1);
    await link.tap();
    assert.equal(await page.locator('#panel-auftraege').isVisible(),true);
    assert.equal(await page.locator('[data-action="buy-st_aldera-miner"]').isEnabled(),true);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),rawStart,
      'the economy terminal cannot silently buy ships or change money');
    // J13: no artificially unlocked fighter – only audited production prerequisites.
    await page.locator('#tab-jaeger').tap();
    assert.equal(await page.locator('#panel-jaeger').isVisible(),true);
    const fighterRecord=page.locator('#jaeger-akte');
    assert.equal(await fighterRecord.locator('.jaeger-schritt').count(),5);
    assert.match(await fighterRecord.textContent(),/8 Bauteilen/);
    assert.match(await fighterRecord.textContent(),/32 ISK Nadir-Arbeitslohn/);
    assert.match(await fighterRecord.textContent(),/900 ISK/);
    assert.equal(await page.locator('#jaeger-kaufweg').isDisabled(),true,
      'not even an enabled purchase navigation without the real yard hull');
    assert.match(await page.locator('#jaeger-autoritaet').textContent(),/Nur Nadir darf die Werftarbeit beauftragen/);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),rawStart,
      'reading a fighter project must not execute any company contract');
    // J13b: project actions are original player orders, revalidated on click.
    assert.match(await page.locator('#jaeger-sperren').textContent(),/K7-Erzvertrag.*nur realer Industriekäufer/s);
    assert.match(await page.locator('#jaeger-beitrag-hinweis').textContent(),/ersetzen weder Erz/);
    assert.equal(await page.locator('[data-j13-action="buy-st_nadir-miner"]').isDisabled(),true);
    assert.equal(await page.locator('#jaeger-sperren button').count(),0);
    const buy=page.locator('[data-j13-action="buy-st_aldera-miner"]');
    assert.equal(await buy.isEnabled(),true,'first genuine miner must be available');
    const touch=await buy.boundingBox();assert.ok(touch.height>=48);
    await buy.tap();
    assert.match(await page.locator('#hausgeld').textContent(),/2[.,]400\s*ISK/);
    assert.equal(await page.locator('#schiff-anzahl').textContent(),'1');
    const paid=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    const s=w.load(paid),ship=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
    assert.ok(ship);assert.equal(s.owners.house.cash,2400);assert.equal(w.audit(s).ok,true);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    assert.equal(await page.locator('[data-j13-action="ice-'+ship.id+'"]').isEnabled(),true);
    assert.equal(await page.locator('[data-j13-action="sil-start-'+ship.id+'"]').count(),0,
      'an Aldera miner is not a lawful Nadir K2 miner');
    await page.locator('#tab-flotte').tap();
    const enter=page.locator('[data-pilot="'+ship.id+'"]');
    assert.equal(await enter.isEnabled(),true);
    await enter.tap();
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.equal(await page.locator('#spielwelt').isVisible(),false);
    assert.match(await page.locator('#raum-schiff').textContent(),/Miner/);
    assert.equal(await page.locator('#raum-buehne').getAttribute('data-bereit'),'ja');
    await page.locator('#raum-abdocken').tap();
    const flying=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),SLOT));
    const job=flying.kanon.flugdienst[ship.id];
    assert.ok(job,'only real F6 departure may reserve worker salaries');
    assert.equal(flying.owners[job.konto].cash,40);
    assert.equal(flying.owners.house.cash,2360);
    assert.equal(flying.minted,0);assert.equal(flying.burned,0);
    assert.equal(w.audit(w.load(JSON.stringify(flying))).ok,true);
    // P2: the real public career uses the new commands through the pilot session.
    const tap=async sel=>{await page.locator(sel).tap();};
    await tap('#raum-tempo-300');
    // P2_PINCH_POINTERS_CHECK: Browser-Emulation zweier gleichzeitiger Touch-Pointer.
    // Kein physisches iPad: prüft Pointer-Zoom und Cancel ohne unbeabsichtigte Auswahl.
    const pinch=await page.evaluate(()=>{
      const canvas=document.querySelector('#raum-leinwand');
      const r=canvas.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const before=RaumCockpit.sitzung.zustand();
      const send=(type,id,x)=>canvas.dispatchEvent(new PointerEvent(type,{
        bubbles:true,pointerId:id,pointerType:'touch',isPrimary:id===91,
        clientX:x,clientY:cy
      }));
      send('pointerdown',91,cx-30);send('pointerdown',92,cx+30);
      send('pointermove',91,cx-50);send('pointermove',92,cx+50);
      const during=RaumCockpit.sitzung.zustand();
      send('pointercancel',91,cx-50);send('pointercancel',92,cx+50);
      const after=RaumCockpit.sitzung.zustand();
      return {start:before.massstab,zoom:during.massstab,end:after.massstab,
        beforeSelection:JSON.stringify(before.auswahl),afterSelection:JSON.stringify(after.auswahl)};
    });
    assert.ok(pinch.zoom<pinch.start,'Pinch-out must zoom into the canvas in both engines');
    assert.equal(pinch.end,pinch.zoom,'Cancelling fingers must keep the current zoom');
    assert.equal(pinch.afterSelection,pinch.beforeSelection,'Pinch must not select a target');

    await page.waitForFunction(()=>/Freier Flug|Handflug/.test(document.querySelector('#raum-lage').textContent));
    await tap('[data-raum="objekt-st_aldera"]');
    await page.locator('#ziel-orbit-abstand').fill('120000');
    await tap('[data-raum="ziel-orbit"]');
    await page.waitForFunction(()=>/Autopilot: orbit/.test(document.querySelector('#raum-lage').textContent));
    const orbitSave=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    assert.equal(w.load(orbitSave).ships[ship.id].flug.modus,'orbit');
    // Input stays intact across HUD ticks, also on touch keyboards.
    await page.locator('#ziel-orbit-abstand').fill('150000');
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#ziel-orbit-abstand').inputValue(),'150000');
    await tap('#raum-stopp');
    assert.match(await page.locator('#raum-lage').textContent(),/Handflug/);
    // NPC3's original financed mining shuttle is now moving in this same world.
    await page.waitForSelector('[data-raum="objekt-sh001"]');
    await tap('[data-raum="objekt-sh001"]');
    await page.locator('#ziel-folgen-abstand').fill('90000');
    await tap('[data-raum="ziel-folgen"]');
    await page.waitForFunction(()=>/Autopilot: folgen/.test(document.querySelector('#raum-lage').textContent));
    const followed=w.load(await page.evaluate(key=>localStorage.getItem(key),SLOT));
    assert.equal(followed.ships[ship.id].flug.ziel.id,'sh001');
    await tap('[data-raum="ziel-aufschalten"]');
    assert.match(await page.locator('#raum-lage').textContent(),/Aufgeschaltet: sh001/);
    await tap('#raum-stopp');
    await tap('#raum-start'); // pause after manual takeover
    assert.match(await page.locator('#raum-lage').textContent(),/Handflug/);
    await page.locator('#raum-konzern').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const [download]=await Promise.all([
      page.waitForEvent('download'),page.locator('#welt-export').tap()
    ]);
    assert.match(download.suggestedFilename(),/aphros-void-karriere-/);
    // Continue must use the dedicated P1 slot. No manually selected test JSON.
    const stored=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    await page.reload();
    assert.equal(await page.locator('#startseite').isVisible(),true);
    assert.equal(await page.locator('#fortsetzen').isEnabled(),true);
    await page.locator('#fortsetzen').tap();
    assert.equal(await page.locator('#spielwelt').isVisible(),true);
    const resumed=await page.evaluate(key=>localStorage.getItem(key),SLOT);
    assert.equal(w.hash(w.load(resumed)),w.hash(w.load(stored)));
    // Bad imports cannot replace the valid career.
    await page.locator('#open-menu').tap();
    assert.equal(await page.locator('#startseite').isVisible(),true);
    const [chooser]=await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('#import-aktion').tap()
    ]);
    await chooser.setFiles({
       name:'untrusted.json',mimeType:'application/json',
       buffer:Buffer.from(JSON.stringify({rulesVersion:204,schema:8,owners:{house:{cash:999999}}}))
    });
    await page.waitForFunction(()=>/nicht geladen|verweigert|laufende Karriere/i.test(document.querySelector('#menumeldung').textContent),null,{timeout:10000});
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),resumed);
    assert.deepEqual(errors,[],'console/page errors are not allowed');
    console.log('P1_GAME_BROWSER_OK',JSON.stringify({
       kind,width,height,hash:w.hash(w.load(stored)),ownedShip:ship.id,
       paid:600,reservedFlightSalary:40,money:33000,noFileUploadAtStart:true
    }));
   }finally{await ctx.close();}
   await projektPfad(browser,base,width,height,kind);
   await siliziumPilot(browser,base,width,height,kind);
   await w6Optin(browser,base,width,height,kind);
   await karrierePatrouille(browser,base,width,height,kind);
   await karriereDuell(browser,base,width,height,kind);
   await managerAkademiePfad(browser,base,width,height,kind);
   await pilotAkademieKarrierePfad(browser,base,width,height,kind);
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
