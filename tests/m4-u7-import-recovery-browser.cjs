'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');
const standardKey='aphros-void:spielerkarriere:regel204:v1';
const slot='aphros-void:spielerkarriere:transport-forschung:v1',backup=slot+':vorherige';
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(file!==path.join(root,'index.html')&&!file.startsWith(path.join(root,'prototypes')+path.sep))return res.writeHead(404).end();
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
 catch{res.writeHead(404).end();}
});
function fixtures(){
 const original=engpassNach48().exportieren(),j=J8.erstellen();
 j.oeffnenU7U8(original,true);
 const early=j.exportieren();
 for(const id of ['stop-sh004','stop-sh005'])assert.equal(j.ausfuehren(id).ok,true);
 for(let i=0;i<240&&!j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok);i++)j.weiterspielen(1);
 const offered=j.exportieren(),fake=JSON.parse(offered);
 assert.equal(fake.kanon.industrieErz.signFracht,false);
 fake.kanon.industrieErz.signFracht=true;
 assert.equal(j.ausfuehren('industry-accept-sh003').ok,true);
 const accepted=j.exportieren();
 j.weiterspielen(1);
 const active=j.exportieren(),fakeWater=JSON.parse(active);
 assert.notEqual(fakeWater.w3.auftrag.wasserZustimmung,true);
 fakeWater.w3.auftrag.wasserZustimmung=true;
 assert.equal(j.ausfuehren('industry-water-sh003').ok,true);
 return {original,early,offered,accepted,water:j.exportieren(),fake:JSON.stringify(fake),fakeWater:JSON.stringify(fakeWater)};
}
async function run(browser,art,width,height,f){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const el=id=>page.locator('#'+id);
 const keys=[standardKey,slot,backup],read=()=>page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 let deny=null,dialogs=[];
 page.on('dialog',async d=>{dialogs.push(d.message());if(deny&&deny.test(d.message()))await d.dismiss();else await d.accept();});
 const reload=async()=>{await page.reload();await el('transport-fortsetzen').waitFor({state:'visible'});dialogs=[];};
 const upload=async json=>{
  dialogs=[];
  await el('import-datei').setInputFiles({name:'external.json',mimeType:'application/json',buffer:Buffer.from(json)});
  await page.waitForFunction(()=>document.getElementById('import-datei').value==='');
 };
 const same=(actual,expected)=>assert.deepEqual(actual,expected);
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html');
  await page.evaluate(({keys,f})=>{[f.original,f.offered,f.early].forEach((v,i)=>localStorage.setItem(keys[i],v));},{keys,f});
  await reload();
  const initial=await read();
  // If no backup existed, a failed replacement must restore that exact absence.
  await page.evaluate(({slot,backup})=>{
   localStorage.removeItem(backup);
   const set=Storage.prototype.setItem;let fail=true;
   Storage.prototype.setItem=function(k,v){
    if(fail&&k===slot){fail=false;throw new DOMException('Injected quota failure','QuotaExceededError');}
    return set.call(this,k,v);
   };
  },{slot,backup});
  await upload(f.fake);
  same(await read(),[initial[0],initial[1],null]);
  assert.equal(await el('startseite').isVisible(),true);
  await page.evaluate(({backup,v})=>localStorage.setItem(backup,v),{backup,v:initial[2]});
  await reload();
  same(await read(),initial);
  deny=/Diesen konkreten Auftrag/;
  await upload(f.fake);
  assert.ok(dialogs.some(x=>deny.test(x)));same(await read(),initial);
  assert.equal(await el('startseite').isVisible(),true);
  deny=null;await upload(f.fake);
  await el('manager-industrie-transport').waitFor({state:'visible'});
  assert.ok(dialogs.some(x=>/Diesen konkreten Auftrag/.test(x)));
  const accepted=await read();same(JSON.parse(accepted[1]),JSON.parse(f.accepted));
  assert.equal(accepted[0],f.original);assert.equal(accepted[2],f.offered);
  await reload();deny=/Diese noch nicht ausgeführte freiwillige Rückladung/;
  await upload(f.fakeWater);
  assert.ok(dialogs.some(x=>deny.test(x)));same(await read(),accepted);
  deny=null;await upload(f.fakeWater);
  await el('manager-industrie-transport').waitFor({state:'visible'});
  assert.ok(dialogs.some(x=>/Diese noch nicht ausgeführte freiwillige Rückladung/.test(x)));
  const water=await read();same(JSON.parse(water[1]),JSON.parse(f.water));
  assert.equal(water[0],f.original);assert.equal(water[2],accepted[1]);
  // Local resume retains already authorized state byte-for-byte, no extra dialogs.
  await reload();await el('transport-fortsetzen').tap();
  await el('manager-industrie-transport').waitFor({state:'visible'});
  same(await read(),water);same(dialogs,[]);
  // Recovery may be declined with zero changes.
  await reload();deny=/Vorherige Transportforschung wiederherstellen/;
  await el('transport-wiederherstellen').tap();same(await read(),water);
  assert.ok(dialogs.some(x=>deny.test(x)));
  // Simulate atomic setItem failure in the current transport slot once.
  // Both persistent versions and normal career must survive.
  deny=null;await page.evaluate(key=>{
   const set=Storage.prototype.setItem;let fail=true;
   Storage.prototype.setItem=function(k,v){
    if(fail&&k===key){fail=false;throw new DOMException('Injected quota failure','QuotaExceededError');}
    return set.call(this,k,v);
   };
  },slot);
  await el('transport-wiederherstellen').tap();
  same(await read(),water);
  assert.equal(await el('startseite').isVisible(),true);
  await reload();await el('transport-wiederherstellen').tap();
  await el('manager-industrie-transport').waitFor({state:'visible'});
  const recovered=await read();
  same(recovered,[f.original,water[2],water[1]]);
  same(errors,[]);
  console.log('U7_IMPORT_RECOVERY_BROWSER',art,width,height,'both consents declined and accepted, local resume, quota rollback, recovery swap, original unchanged');
 }finally{await ctx.close();}
}
(async()=>{
 const f=fixtures();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const art=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
  browser=art==='webkit'?await webkit.launch():await chromium.launch({args:['--no-sandbox']});
  for(const [w,h] of [[1180,820],[1024,768],[820,1180],[390,844]])await run(browser,art,w,h,f);
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
