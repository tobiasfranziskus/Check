// J11: real gekaufter Frachter im vorhandenen Cockpit auf vier Touchgrößen.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const OLD=require('../prototypes/w5ac/session.js');
const W=require('../prototypes/welt/welt-kern.js');
(async()=>{
 const root=path.resolve(__dirname,'..'),old=OLD.create(42,'private195'),original=old.export();
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname,dest=path.resolve(root,'.'+name);
  if(!dest.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
  try{const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
   res.setHeader('Content-Type',types[path.extname(dest)]||'text/plain');res.end(fs.readFileSync(dest));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/prototypes/verbund/konzern.html',kind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(url);
   await page.locator('#quelle195').setInputFiles({name:'original195.json',mimeType:'application/json',buffer:Buffer.from(original)});
   await page.waitForFunction(()=>document.querySelectorAll('#stufen li').length===6);
   await page.locator('#zustimmung195').check();await page.locator('#start195').click();
   assert.equal(await page.locator('#konzernwelt').isVisible(),true);
   assert.equal(await page.locator('#j9-piloten button').count(),0,'kein Startschiff geschenkt');
   await page.locator('[data-aktion="buy-st_aldera-frachter"]').click();
   assert.equal(await page.locator('#j9-piloten button').count(),1,'bezahlter Miner ist pilotierbar');
   const pilot=page.locator('#j9-piloten button');
   assert.equal(await pilot.isEnabled(),true);
   await pilot.click();
   assert.equal(await page.locator('#raumbereich').isVisible(),true);
   assert.equal(await page.locator('#konzernwelt').isHidden(),true);
   assert.match(await page.locator('#raum-schiff').textContent(),/Frachter/);
   assert.match(await page.locator('#raum-lage').textContent(),/Im Dock/);
   assert.match(await page.locator('#raum-audit').textContent(),/Audit OK/);
   assert.equal(await page.locator('#raum-dock').isVisible(),true);
   // Kein Zwischenexport: derselbe gekaufte Miner beginnt einen echten Original-F6-Flug.
   await page.locator('[data-raum="dock-abdocken"]').click();
   await page.waitForFunction(()=>document.querySelector('#raum-reserve')?.textContent.includes('40'));
   const raumCash=await page.locator('#raum-kasse').textContent();
   assert.match(raumCash,/ISK/);
   fs.mkdirSync(path.join(root,'docs/j11-screenshots'),{recursive:true});
   await page.screenshot({path:path.join(root,'docs/j11-screenshots',kind+'-'+width+'.png'),fullPage:true});
   await page.locator('#raum-konzern').click();
   assert.equal(await page.locator('#konzernwelt').isVisible(),true);
   assert.equal(await page.locator('#raumbereich').isHidden(),true);
   assert.match(await page.locator('#weltgeld').textContent(),/33000 ISK/);
   const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#export204').click()]);
   const tmp=path.join(os.tmpdir(),'aphros-j9-'+kind+'-'+width+'-'+process.pid+'.json');
   await dl.saveAs(tmp);const json=fs.readFileSync(tmp,'utf8');fs.unlinkSync(tmp);
   const raw=JSON.parse(json),w=W.erstellenJ4c({carrierCash:raw.w5ad.profile.carrierCash,buyerCash:raw.w5ad.profile.buyerCash}),s=w.load(json);
   const house=Object.values(s.ships).filter(sh=>sh.owner==='house');
   assert.equal(house.length,1);
   assert.equal(house[0].klasse,'frachter');
   assert.equal(s.kanon.jaeger.kaeufe.length,0,'kein kostenloser Jäger aus Szenenwechsel');
   assert.equal(s.owners['k1_flug_'+house[0].id].cash>=0,true);
   assert.equal(s.kanon.flugdienst[house[0].id]!=null,true,'echter bezahlter Flugdienst');
   assert.equal(s.minted,0);assert.equal(s.burned,0);
   assert.equal(Object.values(s.owners).reduce((v,o)=>v+o.cash,0),33000);
   assert.equal(w.audit(s).ok,true);
   assert.equal(old.export(),original,'195-Quelle nicht verändert');
   assert.deepEqual(errors,[],'kein JS-Fehler');
   console.log('J11_BROWSER_OK',JSON.stringify({browser:kind,width,height,hash:w.hash(s),pilot:house[0].id,money:33000,flight:true}));
   // Second world is an isolated TEST fixture, produced only with original paid commands.
   const J=require('../prototypes/verbund/konzern-session.js'),f=J.erstellen();
   f.starten195(original,true);assert.equal(f.ausfuehren('buy-st_aldera-frachter').ok,true);
   const fid=f.piloten()[0].id;assert.equal(f.ausfuehren('buy-st_aldera-miner').ok,true);
   const mid=f.piloten().find(x=>x.klasse==='miner').id;
   assert.equal(f.ausfuehren('ice-'+mid).ok,true);f.weiterspielen(60);f.weiterspielen(60);
   await page.reload();
   await page.locator('#quelle204').setInputFiles({name:'ready204.json',mimeType:'application/json',buffer:Buffer.from(f.exportieren())});
   await page.locator('#zustimmung204').check();await page.locator('#start204').click();
   await page.locator('[data-j9-pilot="'+fid+'"]').click();
   await page.locator('[data-raum="dock-eisfracht"]').click();
   assert.match(await page.locator('#raum-lage').textContent(),/Transit/);
   assert.match(await page.locator('#raum-ladung').textContent(),/Regel204 sperrt freie Steuerung/);
   assert.equal(await page.locator('#raum-knueppel').evaluate(x=>x.classList.contains('aus')),true);
   assert.equal(await page.locator('#raum-andocken').isHidden(),true);
   await page.screenshot({path:path.join(root,'docs/j11-screenshots',kind+'-'+width+'-f4.png'),fullPage:true});
   await page.locator('#raum-konzern').click();
   const [fdl]=await Promise.all([page.waitForEvent('download'),page.locator('#export204').click()]);
   await fdl.saveAs(tmp);const fj=fs.readFileSync(tmp,'utf8');fs.unlinkSync(tmp);
   const fw=W.erstellenJ4c({carrierCash:2000,buyerCash:4000}),fr=fw.load(fj);
   assert.equal(fw.audit(fr).ok,true);assert.equal(fr.w5n.frachtauftrag.schiff,fid);
   assert.equal(fr.ships[fid].ladung.eis,50);assert.equal(fr.kanon.spielerFrachten.auftraege[0].end,null);
   assert.deepEqual(errors,[]);console.log('J11_F4_BROWSER_OK',kind,width,fw.hash(fr));
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
