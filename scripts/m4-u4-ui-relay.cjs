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

// Fixed, conservative viewport projection. It never serializes attributes, HTML, hidden
// state, storage, source, accessible-only labels or offscreen nodes. Not a pixel OCR.
function viewportText(markButtons=false){
 const maxChars=1800, maxRows=32, words=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const range=document.createRange();
 function visible(el){
  for(let p=el;p;p=p.parentElement){
   if(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','TITLE','TEXTAREA','SELECT','OPTION'].includes(p.tagName))return false;
   const c=getComputedStyle(p);
   if(c.display==='none'||c.visibility!=='visible'||Number(c.opacity)<0.1||c.contentVisibility==='hidden'||c.clipPath!=='none'||c.filter!=='none')return false;
   if(c.color==='transparent'||/^rgba\(.*,\s*0(?:\.0+)?\)$/.test(c.color))return false;
   if(parseFloat(c.fontSize)<8)return false;
  }
  return true;
 }
 function onScreen(rect,el){
  if(rect.width<1||rect.height<7||rect.left<0||rect.top<0||rect.right>innerWidth||rect.bottom>innerHeight)return false;
  const y=(rect.top+rect.bottom)/2;
  return [rect.left+Math.min(1,rect.width/2),(rect.left+rect.right)/2,rect.right-Math.min(1,rect.width/2)].every(x=>{
   const hit=document.elementFromPoint(x,y);
   return !!hit&&(hit===el||el.contains(hit));
  });
 }
 let n,visited=0;
 while((n=walker.nextNode())&&++visited<=4000&&words.length<800){
  const el=n.parentElement;
  if(!el||!visible(el))continue;
  const text=n.nodeValue;
  const button=markButtons?el.closest('button'):null;
  const control=button&&!button.matches(':disabled')?button:null;
  for(const match of text.matchAll(/\S+/gu)){
   if(match[0].length>100)continue;
   range.setStart(n,match.index);range.setEnd(n,match.index+match[0].length);
   const rects=Array.from(range.getClientRects());
   if(rects.length!==1||!onScreen(rects[0],el))continue;
   const b=rects[0];
   words.push({x:Math.round(b.left),y:Math.round((b.top+b.bottom)/2),right:Math.round(b.right),t:match[0],control});
   if(words.length>=800)break;
  }
 }
 // Preserve reading order across rows and separate distant columns. The coordinates
 // refer to visible words, not inferred game actions or hidden control identities.
 words.sort((a,b)=>a.y-b.y||a.x-b.x);
 const lines=[];
 for(const w of words){
  const last=lines[lines.length-1];
  if(last&&last.control===w.control&&Math.abs(last.y-w.y)<=4&&w.x>=last.right-2&&w.x-last.right<=28){
   last.t+=' '+w.t;last.right=w.right;
  }else lines.push({...w});
 }
 let result='',count=0;
 for(const l of lines){
  const row='('+l.x+','+l.y+') '+(l.control?'[B] ':'')+l.t.slice(0,140);
  if(count>=maxRows||result.length+row.length+1>maxChars-24){result+='\n[Anzeige gekürzt]';break;}
  result+=(result?'\n':'')+row;count++;
 }
 return result||'[Kein sichtbarer Text erkannt]';
}

async function session(root,out,{chromium,executablePath,textMode=false,markButtons=false}={}){
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
  let nativeDialog=false;
  page.on('dialog',d=>{nativeDialog=true;d.dismiss().catch(()=>{});}); // report unsupported native dialogs, never confirm silently
  ctx.on('page',p=>{if(p!==page)p.close().catch(()=>{});});
  await page.goto(origin+'/');
  await page.waitForTimeout(300);
  const started=performance.now();let rounds=0,closed=false;
  fs.mkdirSync(out,{recursive:true});
  async function close(){if(closed)return;closed=true;await ctx.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
  const elapsed=()=>Math.round(performance.now()-started);
  async function observe(){
   if(closed)throw Error('Session closed');
   if(nativeDialog)return {round:rounds,elapsedMs:elapsed(),done:true,error:'Native browser dialog unsupported; infrastructure blocked'};
   const obs={round:rounds,remaining:Math.max(0,LIMIT-rounds),width:WIDTH,height:HEIGHT};
   if(textMode)obs.visibleText=await page.evaluate(viewportText,markButtons);
   else{const name='round-'+String(rounds).padStart(2,'0')+'.jpg';
    await page.screenshot({path:path.join(out,name),type:'jpeg',quality:65,timeout:4000});obs.screenshot=name;}
   return {...obs,elapsedMs:elapsed(),done:rounds>=LIMIT||elapsed()>=MS};
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
 const s=await session(root,out,{executablePath:process.env.CHROMIUM_PATH,textMode:process.env.M4_UI_TEXT==='1'});
 const rl=readline.createInterface({input:process.stdin,terminal:false});
 const emit=x=>console.log(JSON.stringify({...x,...(x.screenshot?{screenshot:path.join(out,x.screenshot)}:{})}));
 const first=await s.observe();emit(first);
 if(first.done){rl.close();process.stdin.pause();await s.close();return;}
 const timer=setTimeout(()=>{rl.close();process.stdin.destroy();},Math.max(0,MS-first.elapsedMs));
 try{for await(const line of rl){
  let result;try{result=await s.step(JSON.parse(line));}catch{emit({error:'Invalid action JSON or arguments'});continue;}
  emit(result);if(result.done)break;
 }}finally{clearTimeout(timer);rl.close();process.stdin.pause();await s.close();}
}
if(require.main===module)main().catch(()=>{console.error('Browser adapter unavailable or startup failed');process.exitCode=1;});
module.exports={action,serverFor,session,WIDTH,HEIGHT,LIMIT,MS};
