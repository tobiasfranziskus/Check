// RAUM-1: grafisches Raumcockpit in Chromium/WebKit auf vier Touchgrößen.
// Öffentliche Root → Jägerseite → finanzierter Seed42-Stand → Raumcockpit: Abdocken, Ziel auf der
// Leinwand antippen, Autopilot, Steuerknüppel, Konzernwechsel ohne Zeit-/Zustandsverlust, Andocken,
// Schiffwechsel, (einmal) vollständige Siliziumrunde, JSON-Export. Der exportierte Stand muss bitgleich
// dem Node-Replay des Flugschreibers entsprechen. Zusätzlich: Betrieb ohne Canvas-Grafik.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const assert=require('node:assert/strict');
const Welt=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const original=fs.readFileSync(path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
 const profil=JSON.parse(original).w5ad.profile;
 const neueWelt=()=>Welt.erstellenJ4c({carrierCash:profil.carrierCash,buyerCash:profil.buyerCash});
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const dest=pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+pathname);
  const pagesRoot=pathname==='/'||pathname==='/index.html';
  const asset=dest.startsWith(root+path.sep+'prototypes'+path.sep)&&/[.]((html)|(js)|(css)|(json))$/.test(dest);
  if(!pagesRoot&&!asset){res.writeHead(404).end();return;}
  try{
   const types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css'};
   res.setHeader('Content-Type',types[path.extname(dest)]||'text/plain');
   res.setHeader('Cache-Control','no-store');
   res.end(fs.readFileSync(dest));
  }catch(_){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const basis='http://127.0.0.1:'+server.address().port;
 const browserKind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (browserKind==='webkit'?webkit:chromium).launch(browserKind==='webkit'?{}:{args:['--no-sandbox']});
 // Replay: Originalstand + Flugschreiber (Schrittindex, Kernbefehl) → Weltstand, ganz ohne Browser.
 const replay=fs_=>{
  const w=neueWelt(),s=w.load(original);let schritt=0;
  assert.equal(fs_.format,'aphros-raum-flugschreiber-1');assert.equal(fs_.vollstaendig,true);
  for(const e of fs_.eintraege){
   assert.ok(e.schritt>=schritt,'Flugschreiber monoton');
   while(schritt<e.schritt){w.teilschritt(s);schritt++;}
   assert.equal(w.execute(s,e.cmd).ok,e.ok,'Replay-Befehl '+JSON.stringify(e.cmd));
  }
  while(schritt<fs_.schritte){w.teilschritt(s);schritt++;}
  return {w,s};
 };
 try{
  let ersteGroesse=true;
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const tap=async sel=>{const node=page.locator(sel);await node.scrollIntoViewIfNeeded();await node.tap();};
   const text=sel=>page.locator(sel).textContent();
   const lage=re=>page.waitForFunction(q=>new RegExp(q).test(document.querySelector('#raum-lage').textContent),re,{timeout:30000});
   const zustand=()=>page.evaluate(()=>RaumCockpit.sitzung.zustand());
   try{
    await page.goto(basis+'/');
    await page.locator('nav[aria-label="Spielmodi"] a[href="prototypes/j4c/index.html"]').tap();
    await page.waitForURL('**/prototypes/j4c/index.html');
    assert.equal(await page.locator('#ansicht-raum').isVisible(),true,'Raumcockpit-Umschalter sichtbar');
    // Ohne Weltstand: keine Welt, kein Schiff, kein Flug.
    await tap('#ansicht-raum');
    assert.match(await text('#raum-schiff'),/Kein Weltstand/);
    await tap('#raum-start');assert.equal((await zustand()).laeuft,false);
    await tap('#raum-pult');
    await tap('#beispiel');
    await page.waitForFunction(()=>document.querySelector('#schiff').textContent.includes('sh023'));
    const kasseStart=await text('#cash');
    await tap('#ansicht-raum');
    assert.equal(await page.locator('#spielbereich').isVisible(),false);
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.match(await text('#raum-schiff'),/Jäger sh023/);
    assert.equal(await text('#raum-kasse'),kasseStart,'gleiche Kasse wie im Steuerpult');
    assert.match(await text('#raum-audit'),/Audit OK · Welt 33[.]000 ISK/);
    assert.equal(await page.locator('#raum-dock').isVisible(),true,'Stationsansicht im Dock');
    // Touchflächen der Hauptbedienung mindestens 48 CSS-Pixel hoch.
    for(const sel of ['#raum-start','#raum-tempo-60','#raum-zoom-plus','#raum-abdocken','#ansicht-raum','[data-raum="dock-abdocken"]']){
     const box=await page.locator(sel).boundingBox();
     assert.ok(box&&box.height>=48&&box.width>=44,sel+' zu klein: '+JSON.stringify(box));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'kein horizontales Scrollen');
    // Die Leinwand zeigt wirklich Grafik (Himmel, Station, Schiffe), nicht nur eine leere Fläche.
    await page.waitForTimeout(250);
    const farben=await page.evaluate(()=>{
     const c=document.querySelector('#raum-leinwand'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,set=new Set();
     for(let i=0;i<d.length;i+=4*97)set.add(d[i]>>4<<8|d[i+1]>>4<<4|d[i+2]>>4);
     return set.size;
    });
    assert.ok(farben>=12,'Leinwand gezeichnet, Farbstufen: '+farben);
    // Patrouille vorbereiten, real abdocken (40 ISK Reserve), Zeit läuft sichtbar.
    await tap('[data-raum="dock-patrouille"]');
    await tap('#raum-tempo-60');
    await tap('#raum-abdocken');
    assert.match(await text('#raum-reserve'),/^40 ISK$/);
    assert.equal((await zustand()).laeuft,true);
    await lage('Freier Flug|Autopilot|Handflug');
    assert.equal(await page.locator('#raum-dock').isVisible(),false);
    // Ziel direkt auf der Leinwand antippen (herausgezoomt, damit die Boje im Bild liegt).
    await tap('#raum-zoom-minus');await tap('#raum-zoom-minus');
    await page.locator('#raum-buehne').scrollIntoViewIfNeeded();
    const boje=await page.evaluate(()=>RaumCockpit.sitzung.bildpunkt('boje:0'));
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,boje),'raum-leinwand','Boje liegt frei auf der Leinwand');
    await page.touchscreen.tap(boje.x,boje.y);
    await page.waitForFunction(()=>RaumCockpit.sitzung.zustand().auswahl==='boje:0');
    assert.match(await text('#raum-zielname'),/Außenposten Alpha/);
    await tap('[data-raum="ziel-anfliegen"]');
    assert.match(await text('#raum-meldung'),/Autopilot: Kurs gesetzt/);
    await page.waitForFunction(()=>/Patrouille flug · 1\/3/.test(document.querySelector('#raum-ladung').textContent),null,{timeout:40000});
    // Leerer Raum: Punkt markieren, Flug erst nach Bestätigung.
    const frei=await page.evaluate(()=>{const r=document.querySelector('#raum-leinwand').getBoundingClientRect();return {x:r.left+r.width/2-70,y:r.top+r.height/2+105};});
    await page.touchscreen.tap(frei.x,frei.y);
    await page.waitForFunction(()=>{const a=RaumCockpit.sitzung.zustand().auswahl;return !!a&&typeof a==='object';});
    assert.match(await text('#raum-zielname'),/Freier Raumpunkt/);
    await tap('[data-raum="ziel-anfliegen"]');
    assert.match(await text('#raum-meldung'),/Autopilot: Kurs gesetzt/);
    // Steuerknüppel: Zeigerbewegung wird zu echten shipSteer-Befehlen.
    const stab=await page.locator('#raum-knueppel').boundingBox();
    await page.mouse.move(stab.x+stab.width/2,stab.y+stab.height/2);await page.mouse.down();
    await page.mouse.move(stab.x+stab.width/2+stab.width*0.42,stab.y+stab.height/2-4,{steps:4});
    await page.mouse.up();
    await lage('Handflug');
    assert.match(await text('#raum-meldung'),/Handflug · Kurs \d+\/256 · Schub \d+ %/);
    await page.waitForFunction(()=>Number(document.querySelector('#raum-fahrt').textContent.replace(/[.]/g,'').match(/^\d+/)[0])>500,null,{timeout:15000});
    // Konzernwechsel: Flug pausiert, gleiche Welt; Rückkehr ins gleiche Raumcockpit ohne Verlust.
    await tap('#ansicht-konzern');
    assert.equal(await page.locator('#raumbereich').isVisible(),false);
    assert.equal((await zustand()).laeuft,false,'kein verdecktes Weitersimulieren');
    const tickPause=await text('#konzern-tick'),kassePause=await text('#konzern-cash');
    assert.match(await text('#konzern-weltgeld'),/33[.]000 ISK/);
    // J6-W: Spielerangebote sichtbar, Werftrechte fremder Firmen nicht nutzbar.
    assert.equal(await page.locator('#j6-w-angebote button').count(),4);
    assert.match(await text('#j6-w-nadir'),/fremder Eigentümer/);
    assert.equal(await page.locator('#j6-w-angebote button').nth(0).isEnabled(),true);
    assert.equal(await page.locator('#j6-w-angebote button').nth(2).isDisabled(),true);
    assert.ok((await text('#konzern-schiffe')).includes('sh023'));
    assert.match(await text('#konzern-reserve'),/\d+ ISK/);
    await page.waitForTimeout(700);
    assert.equal(await text('#konzern-tick'),tickPause,'Weltzeit steht in der Konzernansicht');
    assert.match(await text('#konzern-zurueck'),/Raumcockpit/);
    await tap('#konzern-zurueck');
    assert.equal(await page.locator('#raumbereich').isVisible(),true);
    assert.equal(await text('#raum-kasse'),kassePause);
    assert.match(await text('#raum-lage'),/Handflug/);
    assert.match(await text('#raum-ladung'),/Patrouille flug · 1\/3/,'Patrouillenfortschritt bleibt erhalten');
    assert.equal((await zustand()).aktiv,'sh023');
    // Tastatur-Fallback und Stopp.
    await page.locator('#raum-leinwand').focus().catch(()=>{});
    await page.keyboard.press('p');
    assert.equal((await zustand()).laeuft,true);
    await page.keyboard.press('ArrowLeft');
    assert.match(await text('#raum-lage'),/Handflug/);
    await tap('#raum-stopp');
    assert.match(await text('#raum-meldung'),/Handsteuerung/);
    // Andocken über den Kern; im Dock wird abgerechnet und die Zeit hält von selbst an.
    await tap('#raum-tempo-300');
    await tap('#raum-andocken');
    assert.match(await text('#raum-meldung'),/Andockanflug/);
    await page.waitForFunction(()=>!document.querySelector('#raum-dock').hidden&&!RaumCockpit.sitzung.zustand().laeuft,null,{timeout:60000});
    assert.match(await text('#raum-reserve'),/^0 ISK$/,'Flugreserve nach dem Andocken abgerechnet');
    assert.match(await text('#raum-audit'),/Audit OK · Welt 33[.]000 ISK/);
    // Schiffwechsel im Dock: gleicher Weltstand, anderes eigenes Schiff.
    const kasseVorWechsel=await text('#raum-kasse');
    await tap('[data-raum="wechsel-sh022"]');
    assert.match(await text('#raum-schiff'),/Miner sh022/);
    assert.equal(await text('#raum-kasse'),kasseVorWechsel);
    let silizium=null;
    if(ersteGroesse){
     // Vollständige, vorfinanzierte Siliziumrunde mit dem gekauften Miner.
     await tap('[data-raum="dock-auftrag"]');
     assert.match(await text('#raum-meldung'),/Siliziumauftrag angenommen/);
     await tap('[data-raum="dock-abdocken"]');
     await lage('Freier Flug|Autopilot');
     await tap('[data-raum="objekt-nadir:silizium"]');
     await tap('[data-raum="ziel-anfliegen"]');
     await page.waitForFunction(()=>/Silizium 8\/8/.test(document.querySelector('#raum-ladung').textContent),null,{timeout:120000});
     await tap('#raum-andocken');
     await page.waitForFunction(()=>!document.querySelector('#raum-dock').hidden&&!RaumCockpit.sitzung.zustand().laeuft,null,{timeout:60000});
     await tap('[data-raum="dock-verkauf"]');
     assert.match(await text('#raum-meldung'),/Silizium an Station Nadir verkauft/);
     silizium=8;
    }else{
     // Auf dieser F6-Basis darf ein gekaufter Nadir-Frachter NICHT frei pilotiert werden.
     const frachter=page.locator('[data-raum="wechsel-sh021"]');
     assert.equal(await frachter.isDisabled(),true,'Nadir-Frachtercockpit gesperrt');
     assert.match(await frachter.textContent(),/Frachter|keinen freien Frachterflug/);
     assert.match(await text('#raum-schiff'),/Miner sh022/);
     assert.match(await text('#raum-lage'),/Im Dock/);
    }
    assert.match(await text('#raum-audit'),/Audit OK · Welt 33[.]000 ISK/);
    // Export aus dem Raumcockpit und Vergleich mit dem Node-Replay des Flugschreibers.
    const schreiber=await page.evaluate(()=>RaumCockpit.sitzung.flugschreiber());
    const [download]=await Promise.all([page.waitForEvent('download'),(async()=>{await tap('#raum-export');})()]);
    const pathOut=path.join(os.tmpdir(),'raum-'+browserKind+'-'+width+'-'+process.pid+'.json');
    await download.saveAs(pathOut);
    const saved=fs.readFileSync(pathOut,'utf8');fs.unlinkSync(pathOut);
    const w=neueWelt(),loaded=w.load(saved);
    assert.equal(w.audit(loaded).ok,true,JSON.stringify(w.audit(loaded).fehler));
    assert.equal(Object.values(loaded.owners).reduce((n,x)=>n+x.cash,0),33000);
    assert.equal(loaded.minted,0);assert.equal(loaded.burned,0);
    for(const id of ['sh021','sh022','sh023'])assert.equal(loaded.ships[id].owner,'house');
    assert.equal(loaded.ships.sh023.flug.lage,'angedockt');
    assert.ok(loaded.tick>JSON.parse(original).tick,'Spielzeit ist fortgeschritten');
    if(silizium)assert.equal(loaded.kanon.silizium.verkauft,JSON.parse(original).kanon.silizium.verkauft+silizium);
    assert.equal(saved.includes('zielprobe')||saved.includes('auswahl')||saved.includes('massstab'),false,'keine Ansichts-/Trainingsdaten im Weltsave');
    const r=replay(schreiber);
    assert.equal(r.w.save(r.s),saved,'Browser-Sitzung == deterministisches Node-Replay');
    assert.ok(schreiber.eintraege.some(e=>e.cmd.type==='shipSteer')&&schreiber.eintraege.some(e=>e.cmd.type==='shipFlyTo'));
    // Zurück im Steuerpult ist es dieselbe Sitzung.
    await tap('#raum-pult');
    assert.equal(await page.locator('#spielbereich').isVisible(),true);
    assert.match(await text('#audit'),/OK/);
    assert.equal(await text('#cash'),await text('#raum-kasse'));
    assert.deepEqual(errors,[],'kein Browser-JS-Fehler');
    console.log('RAUM_COCKPIT_BROWSER_OK',JSON.stringify({browser:browserKind,width,height,tick:loaded.tick,
     hash:w.hash(loaded),befehle:schreiber.eintraege.length,schritte:schreiber.schritte,silizium:!!silizium,geld:33000}));
   }finally{await context.close();}
   ersteGroesse=false;
  }
  // Grafik-Fallback: ohne Canvas-2D bleibt dasselbe Schiff über Liste und Tasten steuerbar.
  {
   const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.addInitScript(()=>{
    const echt=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...a){return this.id==='raum-leinwand'?null:echt.apply(this,a);};
   });
   const tap=async sel=>{const node=page.locator(sel);await node.scrollIntoViewIfNeeded();await node.tap();};
   try{
    await page.goto(basis+'/prototypes/j4c/index.html');
    await tap('#beispiel');
    await page.waitForFunction(()=>document.querySelector('#schiff').textContent.includes('sh023'));
    await tap('#ansicht-raum');
    assert.equal(await page.locator('#raum-ersatz').isVisible(),true,'Hinweis ohne Grafik');
    assert.equal((await page.evaluate(()=>RaumCockpit.sitzung.zustand())).grafik,false);
    await tap('#raum-tempo-60');await tap('#raum-abdocken');
    await page.waitForFunction(()=>/Freier Flug|Autopilot/.test(document.querySelector('#raum-lage').textContent),null,{timeout:30000});
    await tap('[data-raum="objekt-boje:1"]');await tap('[data-raum="ziel-anfliegen"]');
    await page.waitForFunction(()=>/Autopilot/.test(document.querySelector('#raum-lage').textContent));
    await page.waitForFunction(()=>Number(document.querySelector('#raum-fahrt').textContent.replace(/[.]/g,'').match(/^\d+/)[0])>500,null,{timeout:15000});
    assert.match(await page.locator('#raum-audit').textContent(),/Audit OK/);
    // Virtuelles F8-E-Training aus dem Raumcockpit: Drohne als Ziel, Feuer nur als Trainingsbuch.
    await tap('#raum-duell');
    assert.match(await page.locator('#raum-meldung').textContent(),/Virtuelles F8-E-Training gestartet/);
    assert.equal((await page.evaluate(()=>RaumCockpit.sitzung.zustand())).auswahl,'drohne');
    assert.equal(await page.locator('[data-raum="objekt-drohne"]').count(),1);
    await tap('[data-raum="ziel-ausrichten"]');
    assert.match(await page.locator('#raum-meldung').textContent(),/Handsteuerung/);
    await tap('#raum-feuer');
    assert.match(await page.locator('#raum-meldung').textContent(),/Trainingsprojektil gestartet|Schuss gesperrt/);
    assert.match(await page.locator('#raum-ladung').textContent(),/Training aktiv/);
    assert.match(await page.locator('#raum-audit').textContent(),/Audit OK · Welt 33[.]000 ISK/);
    await tap('#raum-pult');
    assert.match(await page.locator('#duell-status').textContent(),/aktiv/,'dasselbe Training im Steuerpult');
    assert.match(await page.locator('#lage').textContent(),/frei/);
    assert.deepEqual(errors,[],'kein Browser-JS-Fehler ohne Canvas');
    console.log('RAUM_COCKPIT_FALLBACK_OK',JSON.stringify({browser:browserKind,grafik:false}));
   }finally{await context.close();}
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
