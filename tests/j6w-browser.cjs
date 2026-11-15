// Optionaler Browser-Modultest: NODE_PATH mit vorhandener Playwright-Installation.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const scripts=['flug2d/flug-kern.js','welt/rule200-k7-industry-core.js','welt/j2b-silizium-core.js',
 'welt/j3-bauteil-core.js','welt/j4b-jaeger-werft-core.js','welt/welt-kern.js','j6w/wirtschaft.js'];
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+req.url);
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(req.url==='/smoke'){res.setHeader('content-type','text/html');return res.end(scripts.map(s=>`<script src="/prototypes/${s}"></script>`).join(''));}
 try{res.setHeader('content-type',target.endsWith('.js')?'text/javascript':'application/json');res.end(fs.readFileSync(target));}
 catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 try{for(const [name,engine] of Object.entries({chromium,webkit}).filter(([name])=>(process.env.J6W_BROWSER||'chromium,webkit').split(',').includes(name))){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{})});
 try{const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/smoke`);
 const result=await page.evaluate(async()=>{
  const w=AphrosWelt.erstellenJ4c({carrierCash:2000,buyerCash:4000});
  const s=w.load(await(await fetch('/prototypes/j4c/beispiel-jaeger-seed42.json')).text());
  const a=J6wWirtschaft.erstellen(w,'house'),before=w.hash(s);
  const offers=a.angebote(s),q=a.angebot(s,{type:'siliconMineStart',schiff:'sh022'});
  const neutral=w.hash(s)===before;
  const executed=a.ausfuehren(s,{type:'siliconMineStart',schiff:'sh022'});
  return {neutral,offers:offers.length,quote:q.ok,executed:executed.ok,
   audit:w.audit(s).ok,roundtrip:w.hash(w.load(w.save(s)))===w.hash(s),
   money:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),mint:s.minted,burn:s.burned};
 });
 assert.equal(result.neutral,true);assert.ok(result.offers>0);
 for(const k of ['quote','executed','audit','roundtrip'])assert.equal(result[k],true,k);
 assert.equal(result.money,33000);assert.equal(result.mint,0);assert.equal(result.burn,0);
 console.log(name,JSON.stringify(result));
 }finally{await browser.close();}
 }}finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
