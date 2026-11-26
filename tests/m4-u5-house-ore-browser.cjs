'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');

const standard='aphros-void:spielerkarriere:regel204:v1';
const haus='aphros-void:spielerkarriere:haus-erz:v1';
const w6='aphros-void:spielerkarriere:regel207-forschung:v1';
const pir='aphros-void:spielerkarriere:pir-1:v1';
const backup=haus+':vorherige';

async function pruefeHausErz(browser,art,width,height,url) {
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
 const page=await ctx.newPage(),fehler=[];
 page.on('pageerror',e=>fehler.push(String(e)));
 const el=id=>page.locator('#'+id);
 const slot=key=>page.evaluate(k=>localStorage.getItem(k),key);
 const dialoge=antworten=>{
   let fertig;
   const beantwortet=new Promise(resolve=>{fertig=resolve;});
   const handler=async dialog=>{
     const ja=antworten.shift();
     if(ja===undefined){fehler.push('Unerwarteter Dialog: '+dialog.message());await dialog.dismiss();return;}
     if(ja)await dialog.accept();
     else await dialog.dismiss();
     if(!antworten.length)fertig();
   };
   page.on('dialog',handler);
   return async()=>{
     let timeout;
     try{await Promise.race([beantwortet,new Promise((_,reject)=>{
       timeout=setTimeout(()=>reject(Error('Erwartete Bestätigung fehlt')),5000);
     })]);}
     finally{clearTimeout(timeout);page.off('dialog',handler);}
   };
 };
 const datei=json=>el('import-datei').setInputFiles({
   name:'haus-erz.json',mimeType:'application/json',buffer:Buffer.from(json)
 });
 const minute=()=>page.locator('[data-advance="1"]').tap();
 const menu=()=>el('open-menu').tap();
 const modi=()=>el('neues-spiel').tap();
 const impl=J8.erstellen(),forschung=J8.erstellen();
 impl.startenPiraten(true);
 forschung.startenP8g(true);
 await page.addInitScript(({paare})=>{
   if(location.pathname.endsWith('/prototypes/spiel/index.html'))
     for(const [k,v] of paare)if(!localStorage.getItem(k))localStorage.setItem(k,v);
 },{paare:[[pir,impl.exportieren()],[w6,forschung.exportieren()]]});
 try{
   await page.goto(url);
   await page.waitForURL('**/prototypes/spiel/index.html');
   await el('karriere-direkt').tap();
   await page.locator('[data-action="buy-st_aldera-frachter"]').tap();
   const vorher=await Promise.all([standard,pir,w6].map(slot));
   assert.ok(vorher.every(Boolean));
   await menu();await modi();
   let done=dialoge([false]);
   await el('kopie-haus-erz').tap();
   await done();
   assert.equal(await slot(haus),null);
   done=dialoge([true]);
   await el('kopie-haus-erz').tap();
   await done();
   const tickNull=await slot(haus);
   assert.deepEqual(JSON.parse(tickNull).kanon.hausErz,{folge:0});
   const t0=Date.now();
   await minute();
   const signieren=page.locator('[data-action^="haus-erz-"]');
   await signieren.waitFor({state:'visible'});
   const vorschauMs=Date.now()-t0;
   assert.ok(vorschauMs<10000,'Vorschau und Browserinteraktion brauchen '+vorschauMs+' ms');
   assert.equal(await signieren.isEnabled(),true);
   const box=await signieren.boundingBox();
   assert.ok(box&&box.width>=48&&box.height>=48);
   await signieren.tap();
   const pending=await slot(haus);
   assert.equal(JSON.parse(pending).kanon.industrieErz.signFracht,true);
   await page.reload();await modi();await el('fortsetzen-haus-erz').tap();
   assert.equal(await slot(haus),pending);
   await minute();
   const bezahlt=await slot(haus);
   assert.equal(JSON.parse(bezahlt).w3.auftrag.carrier,'house');
   for(let i=0;i<6;i++)await page.locator('[data-advance="60"]').tap();
   const fertig=await slot(haus),s=JSON.parse(fertig);
   const b=s.w5ad.freight.find(x=>x.owner==='house');
   assert.deepEqual([b.amount,b.end-b.start,b.fee,b.work],[50,120,240,120]);
   assert.ok(s.w4.abgeschlossen>0&&s.w5.fertig>0);
   assert.match(await el('haus-erz-status').innerText(),/50 Erz, 120 Minuten, 240 ISK Tarif und 120 ISK Fluglohn/);
   await menu();
   done=dialoge([false]);
   await datei(pending);
   await done();
   assert.equal(await slot(haus),fertig);
   done=dialoge([true,true]);
   await datei(pending);
   await done();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).kanon.industrieErz.phase==='storniert',haus);
   assert.equal(await slot(backup),fertig);
   const reset=await slot(haus);
   await menu();
   await page.evaluate(key=>{
     const set=Storage.prototype.setItem;
     Storage.prototype.setItem=function(k,v){
       if(k===key)throw new DOMException('Testquota','QuotaExceededError');
       return set.call(this,k,v);
     };
   },haus);
   done=dialoge([true,true]);
   await datei(bezahlt);
   await done();
   await page.waitForFunction(()=>document.getElementById('menumeldung').textContent.includes('Testquota'));
   assert.equal(await slot(haus),reset);
   assert.equal(await slot(backup),fertig);
   await page.reload();await modi();
   done=dialoge([true]);
   await el('vorige-haus-erz').tap();
   await done();
   assert.equal(await slot(haus),fertig);
   assert.equal(await slot(backup),reset);
   await menu();
   done=dialoge([true,true]);
   await datei(bezahlt);
   await done();
   await page.waitForFunction(({key,save})=>localStorage.getItem(key)===save,{key:haus,save:bezahlt});
   assert.deepEqual(await Promise.all([standard,pir,w6].map(slot)),vorher);
   assert.deepEqual(fehler,[]);
   console.log(art,width,height,'HAUS_ERZ_BROWSER_OK',JSON.stringify({vorschauMs,beleg:b}));
 }finally{await ctx.close();}
}
module.exports=pruefeHausErz;
