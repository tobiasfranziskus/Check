'use strict';
// Development-only generic UI relay. No game selectors, saves, core calls or model API.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const readline=require('node:readline'), os=require('node:os');
const {performance}=require('node:perf_hooks');
const WIDTH=1180, HEIGHT=820, LIMIT=12, MS=300000;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
function serverFor(root){
 root=fs.realpathSync(root);
 return http.createServer((req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method))throw Error();
   const url=new URL(req.url,'http://localhost');
   const rel=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
   const file=fs.realpathSync(path.resolve(root,rel));
   if(file!==path.join(root,'index.html')&&!file.startsWith(path.join(root,'prototypes')+path.sep))throw Error();
   const type=MIME[path.extname(file)];
   if(!type||!fs.statSync(file).isFile())throw Error();
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
   res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
}
function action(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Expected action object');
 const {op}=raw, fields={click:['x','y'],type:['text'],scroll:['x','y','dy'],wait:['ms'],reload:[],stop:[]};
 if(!Object.hasOwn(fields,op)||Object.keys(raw).some(k=>k!=='op'&&!fields[op].includes(k)))throw Error('Unsupported action or field');
 const integer=(k,min,max)=>{if(!Number.isInteger(raw[k])||raw[k]<min||raw[k]>max)throw Error('Invalid '+k);};
 if(op==='click'||op==='scroll'){integer('x',0,WIDTH-1);integer('y',0,HEIGHT-1);}
 if(op==='scroll')integer('dy',-1500,1500);
 if(op==='wait')integer('ms',0,2000);
 if(op==='type'&&(typeof raw.text!=='string'||raw.text.length>300||/[\u0000-\u001f]/.test(raw.text)))throw Error('Invalid text');
 return raw;
}
async function session(root,out,{chromium,executablePath}={}){
 const browserType=chromium||require(process.env.PLAYWRIGHT_MODULE||'playwright').chromium;
 const server=serverFor(root);
 let browser,ctx;
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await browserType.launch({headless:true,...(executablePath?{executablePath}:{})});
  ctx=await browser.newContext({viewport:{width:WIDTH,height:HEIGHT},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   let u;try{u=new URL(route.request().url());}catch{return route.abort();}
   return u.origin===origin?route.continue():route.abort();
  });
  const page=await ctx.newPage();page.setDefaultTimeout(4000);page.setDefaultNavigationTimeout(8000);
  page.on('dialog',d=>d.dismiss().catch(()=>{})); // native browser dialogs are not screenshot-visible
  ctx.on('page',p=>{if(p!==page)p.close().catch(()=>{});});
  await page.goto(origin+'/');
  await page.waitForTimeout(300);
  const started=performance.now();let rounds=0,closed=false;
  fs.mkdirSync(out,{recursive:true});
  async function close(){if(closed)return;closed=true;await ctx.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
  const elapsed=()=>Math.round(performance.now()-started);
  async function observe(){
   if(closed)throw Error('Session closed');
   const name='round-'+String(rounds).padStart(2,'0')+'.jpg';
   await page.screenshot({path:path.join(out,name),type:'jpeg',quality:65,timeout:4000});
   return {round:rounds,elapsedMs:elapsed(),remaining:Math.max(0,LIMIT-rounds),screenshot:name,width:WIDTH,height:HEIGHT,done:rounds>=LIMIT||elapsed()>=MS};
  }
  async function step(raw){
   const a=action(raw);
   if(closed||rounds>=LIMIT||elapsed()>=MS||a.op==='stop'){await close();return {done:true,round:rounds,elapsedMs:elapsed()};}
   rounds++;
   try{
    if(a.op==='click')await page.mouse.click(a.x,a.y);
    if(a.op==='type')await page.keyboard.insertText(a.text);
    if(a.op==='scroll'){await page.mouse.move(a.x,a.y);await page.mouse.wheel(0,a.dy);}
    if(a.op==='wait')await page.waitForTimeout(Math.min(a.ms,Math.max(0,MS-elapsed())));
    if(a.op==='reload')await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(150);
    return await observe();
   }catch{await close();return {done:true,round:rounds,elapsedMs:elapsed(),error:'UI action or observation failed'};}
  }
  return {observe,step,close};
 }catch(e){if(ctx)await ctx.close();if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));throw e;}
}
async function main(){
 const root=path.resolve(process.argv[2]||'.'),out=fs.mkdtempSync(path.join(os.tmpdir(),'blind-ui-'));
 const s=await session(root,out,{executablePath:process.env.CHROMIUM_PATH});
 const rl=readline.createInterface({input:process.stdin,terminal:false});
 const emit=x=>console.log(JSON.stringify({...x,...(x.screenshot?{screenshot:path.join(out,x.screenshot)}:{})}));
 const first=await s.observe();emit(first);
 const timer=setTimeout(()=>{rl.close();process.stdin.destroy();},Math.max(0,MS-first.elapsedMs));
 try{for await(const line of rl){
  let result;try{result=await s.step(JSON.parse(line));}catch{emit({error:'Invalid action JSON or arguments'});continue;}
  emit(result);if(result.done)break;
 }}finally{clearTimeout(timer);rl.close();process.stdin.pause();await s.close();}
}
if(require.main===module)main().catch(()=>{console.error('Browser adapter unavailable or startup failed');process.exitCode=1;});
module.exports={action,serverFor,session,WIDTH,HEIGHT,LIMIT,MS};
