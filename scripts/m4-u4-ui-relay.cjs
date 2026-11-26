'use strict';
// Development-only generic UI relay. No game selectors, saves, core calls or model API.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const readline=require('node:readline'), os=require('node:os');
const {performance}=require('node:perf_hooks');
const WIDTH=1180, HEIGHT=820, LIMIT=12, MS=300000;
const TARGETS_PER_PAGE=20, MAX_TARGETS=4000;
const SELECT_KEYS=Object.freeze(['ArrowUp','ArrowDown','Home','End','Enter','Escape','Space']);
const DEFAULT_VIEWPORT=Object.freeze({width:WIDTH,height:HEIGHT});
function checkedViewport(viewport=DEFAULT_VIEWPORT){
 const {width,height}=viewport;
 if(!((width===WIDTH&&height===HEIGHT)||(width===1024&&height===768)))throw Error('Unsupported viewport');
 return {width,height};
}
function browserOptions(env){
 const size=env.M4_UI_VIEWPORT??'1180x820',engine=env.M4_UI_BROWSER_ENGINE??'chromium';
 if(!['1180x820','1024x768'].includes(size)||!['chromium','webkit'].includes(engine))throw Error('Invalid browser options');
 const [width,height]=size.split('x').map(Number);
 return {viewport:{width,height},engine,executablePath:engine==='chromium'?env.CHROMIUM_PATH:undefined};
}
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
function action(raw,viewport=DEFAULT_VIEWPORT){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Expected action object');
 const {width,height}=checkedViewport(viewport);
 const {op}=raw, fields={pick:['id'],targets:['page'],key:['key'],click:['x','y'],type:['text'],scroll:['x','y','dy'],wait:['ms'],reload:[],stop:[],dialog:['choice']};
 if(!Object.hasOwn(fields,op)||Object.keys(raw).some(k=>k!=='op'&&!fields[op].includes(k)))throw Error('Unsupported action or field');
 const integer=(k,min,max)=>{if(!Number.isInteger(raw[k])||raw[k]<min||raw[k]>max)throw Error('Invalid '+k);};
 if(op==='click'||op==='scroll'){integer('x',0,width-1);integer('y',0,height-1);}
 if(op==='pick')integer('id',1,TARGETS_PER_PAGE);
 if(op==='targets')integer('page',1,MAX_TARGETS/TARGETS_PER_PAGE);
 if(op==='key'&&!SELECT_KEYS.includes(raw.key))throw Error('Invalid key');
 if(op==='scroll')integer('dy',-1500,1500);
 if(op==='wait')integer('ms',0,2000);
 if(op==='type'&&(typeof raw.text!=='string'||raw.text.length>300||/[\u0000-\u001f]/.test(raw.text)))throw Error('Invalid text');
 if(op==='dialog'&&!['accept','dismiss'].includes(raw.choice))throw Error('Invalid choice');
 return raw;
}

// Fixed, conservative viewport projection. It never serializes attributes, HTML, hidden
// state, storage, source, accessible-only labels or offscreen nodes. Not a pixel OCR.
function viewportObservation({markButtons,inventory,targetPage,targetsPerPage,maxTargets}){
 const maxChars=1800, maxRows=32, words=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const range=document.createRange();
 function visible(el,text=false){
  for(let p=el;p;p=p.parentElement){
   if(text&&['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','TITLE','TEXTAREA','SELECT','OPTION'].includes(p.tagName))return false;
   const c=getComputedStyle(p);
   if(c.display==='none'||c.visibility!=='visible'||Number(c.opacity)<0.1||c.contentVisibility==='hidden'||(c.clip&&c.clip!=='auto')||c.clipPath!=='none'||c.filter!=='none')return false;
   if(!text)continue;
   if(c.color==='transparent'||/^rgba\(.*,\s*0(?:\.0+)?\)$/.test(c.color))return false;
   if(parseFloat(c.fontSize)<8)return false;
  }
  return true;
 }
 function hit(el,x,y){
  const top=document.elementFromPoint(x,y);
  return !!top&&(top===el||el.contains(top));
 }
 function onScreen(rect,el){
  if(rect.width<1||rect.height<7||rect.left<0||rect.top<0||rect.right>innerWidth||rect.bottom>innerHeight)return false;
  const y=(rect.top+rect.bottom)/2;
  return [rect.left+rect.width/4,(rect.left+rect.right)/2,rect.right-rect.width/4].every(x=>{
   return hit(el,x,y);
  });
 }
 let n,visited=0;
 while((n=walker.nextNode())&&++visited<=4000&&words.length<800){
  const el=n.parentElement;
  if(!el||!visible(el,true))continue;
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
 const observation={visibleText:result||'[Kein sichtbarer Text erkannt]'};
 if(!inventory)return observation;

 // Only return points hit-tested against the control itself or one of its descendants.
 // Try the center and a bounded set of interior points in the visible fragment.
 function point(el,accepts=(x,y)=>hit(el,x,y)){
  for(const r of el.getClientRects()){
   const left=Math.max(0,Math.ceil(r.left)),right=Math.min(innerWidth-1,Math.ceil(r.right)-1);
   const top=Math.max(0,Math.ceil(r.top)),bottom=Math.min(innerHeight-1,Math.ceil(r.bottom)-1);
   if(right-left<2||bottom-top<2)continue;
   for(const v of [0.5,0.25,0.75]){
    for(const u of [0.5,0.25,0.75]){
     const x=Math.round(left+(right-left)*u),y=Math.round(top+(bottom-top)*v);
     if(accepts(x,y))return {x,y};
    }
   }
  }
  return null;
 }
 function eligible(el){
  return !el.matches(':disabled')&&!el.closest('[inert]')&&visible(el);
 }
 function caption(el){
  if(el.tagName==='SELECT'){
   // Collapsed, single-line native selects paint the selected option label, never
   // the submitted value or the unselected options. Omit ambiguous/clipped labels.
   const r=el.getBoundingClientRect(),c=getComputedStyle(el);
   if(!c.fontSize||parseFloat(c.fontSize)<8||c.color==='transparent'||
      /^rgba\(.*,\s*0(?:\.0+)?\)$/.test(c.color)||!onScreen(r,el))return '';
   const option=el.selectedOptions[0];
   if(!option||option.hidden||option.closest('optgroup[hidden]'))return '';
   const label=option.label.trim().replace(/\s+/gu,' ');
   if(!label||label.length>100||c.textTransform!=='none'||c.textIndent!=='0px')return '';
   const measure=document.createElement('canvas').getContext('2d');
   measure.font=c.fontSize+' '+c.fontFamily;
   const padding=[c.paddingLeft,c.paddingRight,c.borderLeftWidth,c.borderRightWidth].reduce((sum,v)=>sum+parseFloat(v),0);
   const spacing=Math.max(0,parseFloat(c.letterSpacing)||0);
   return measure.measureText(label).width+spacing*label.length<=r.width-padding-28?label:'';
  }
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  let n,label='',visited=0;
  while((n=walker.nextNode())&&++visited<=80&&label.length<100){
   if(!visible(n.parentElement,true))continue;
   for(const match of n.nodeValue.matchAll(/\S+/gu)){
    if(match[0].length>100-label.length)break;
    range.setStart(n,match.index);range.setEnd(n,match.index+match[0].length);
    const rects=range.getClientRects();
    if(rects.length===1&&onScreen(rects[0],n.parentElement))label+=(label?' ':'')+match[0];
   }
  }
  return label;
 }
 function collapsedSelect(el){
  return !el.multiple&&el.size<=1&&getComputedStyle(el).appearance!=='none';
 }
 // Scan independently of the text budget. IDs describe the current page of targets.
 const candidates=document.querySelectorAll('button,a[href],details > summary:first-of-type,select');
 const hits=[];
 let scanTruncated=false;
 for(const el of candidates){
  if(!eligible(el)||(el.tagName==='SELECT'&&!collapsedSelect(el)))continue;
  const p=point(el,(x,y)=>document.elementFromPoint(x,y)?.closest('button,a[href],summary,select')===el);
  if(!p)continue;
  if(hits.length===maxTargets){scanTruncated=true;break;}
  hits.push({el,...p});
 }
 hits.sort((a,b)=>a.y-b.y||a.x-b.x);
 const pages=Math.max(1,Math.ceil(hits.length/targetsPerPage));
 const current=Math.min(targetPage,pages);
 const targets=hits.slice((current-1)*targetsPerPage,current*targetsPerPage).map(({el,x,y},i)=>({
  id:i+1,x,y,kind:el.tagName==='A'?'link':el.tagName.toLowerCase(),label:caption(el)
 }));

 const scrollRegions=[];
 function scrollRegion(el,root=false){
  if(!el)return;
  const up=el.scrollTop>0,down=el.scrollTop+el.clientHeight<el.scrollHeight-1;
  if(!up&&!down)return;
  const p=point(root?document.documentElement:el,(x,y)=>{
   // A wheel point belongs to the innermost scrollable ancestor under it.
   let hit=document.elementFromPoint(x,y);
   while(hit&&hit!==document.scrollingElement){
    if(wheelScrollable(hit))return !root&&hit===el;
    hit=hit.parentElement;
   }
   return root&&!!hit;
  });
  if(p)scrollRegions.push({...p,up,down,kind:root?'page':'region'});
 }
 function wheelScrollable(el){
  return el.scrollHeight>el.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(el).overflowY);
 }
 // Scroll containers need not have interactive descendants.
 const root=document.scrollingElement;
 const walkerElements=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT);
 scrollRegion(root,true);
 let el,scrollScan=0;
 while(scrollRegions.length<=8&&(el=walkerElements.nextNode())&&++scrollScan<=4000){
  if(wheelScrollable(el)&&visible(el))scrollRegion(el);
 }
 const focused=document.activeElement;
 return {...observation,targets,targetInventory:{page:current,pages,total:hits.length,scanTruncated},
  scrollRegions:scrollRegions.slice(0,8),scrollInventoryTruncated:scrollRegions.length>8||scrollScan>4000,
  ...(focused?.tagName==='SELECT'&&collapsedSelect(focused)&&eligible(focused)&&point(focused)?{selectKeys:true}:{})};

}

async function session(root,out,{chromium,engine='chromium',viewport,executablePath,textMode=false,
 markButtons=false,inventory=textMode,captureScreenshots=false,allowDialogs=false,preparePage}={}){
 const {width,height}=checkedViewport(viewport);
 if(!['chromium','webkit'].includes(engine))throw Error('Unsupported browser engine');
 const browserType=chromium||require(process.env.PLAYWRIGHT_MODULE||'playwright')[engine];
 const server=serverFor(root);
 let browser,ctx;
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await browserType.launch({headless:true,...(executablePath?{executablePath}:{})});
  ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   let u;try{u=new URL(route.request().url());}catch{return route.abort();}
   return u.origin===origin?route.continue():route.abort();
  });
  await ctx.routeWebSocket('**/*',socket=>socket.close());
  const page=await ctx.newPage();page.setDefaultTimeout(4000);page.setDefaultNavigationTimeout(8000);
  let nativeDialog=false,pending=null,wake=null,inFlight=null;
  page.on('dialog',d=>{
   // Only an actual confirm in an opted-in text session during a UI action
   // may await an explicit tester decision. No automatic acceptance.
   if(allowDialogs&&textMode&&wake&&!pending&&d.type()==='confirm'){
    pending=d;wake();return;
   }
   nativeDialog=true;d.dismiss().catch(()=>{});
  });
  ctx.on('page',p=>{if(p!==page)p.close().catch(()=>{});});
  await page.goto(origin+'/');
  await page.waitForTimeout(300);
  if(preparePage!==undefined){
   if(typeof preparePage!=='function')throw Error('Invalid trusted setup');
   await preparePage(page);
  }
  const started=performance.now();let rounds=0,closed=false,targetPage=1,lastObservation;
  const project=()=>page.evaluate(viewportObservation,{
   markButtons,inventory,targetPage,targetsPerPage:TARGETS_PER_PAGE,maxTargets:MAX_TARGETS
  });
  fs.mkdirSync(out,{recursive:true});
  async function close(){if(closed)return;closed=true;if(pending){const d=pending;pending=null;await d.dismiss().catch(()=>{});}await ctx.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
  const elapsed=()=>Math.round(performance.now()-started);
  async function observe(){
   if(closed)throw Error('Session closed');
   if(nativeDialog)return {round:rounds,elapsedMs:elapsed(),done:true,error:'Native browser dialog unsupported; infrastructure blocked'};
   const obs={round:rounds,remaining:Math.max(0,LIMIT-rounds),width,height};
   if(pending){
    obs.visibleText='[Browser-Bestätigungsdialog] '+pending.message().replace(/[\u0000-\u001f]/g,' ').slice(0,600)+'\n[dialog: accept = bestätigen, dismiss = abbrechen]';
    obs.dialog='confirm';
   }else if(textMode)Object.assign(obs,await project());
   if(!pending&&(!textMode||captureScreenshots)){const name='round-'+String(rounds).padStart(2,'0')+'.jpg';
    await page.screenshot({path:path.join(out,name),type:'jpeg',quality:65,timeout:4000});obs.screenshot=name;}
   lastObservation=obs;
   return {...obs,elapsedMs:elapsed(),done:rounds>=LIMIT||elapsed()>=MS};
  }
  async function step(raw){
   const a=action(raw,{width,height});
   if(closed||rounds>=LIMIT||elapsed()>=MS||a.op==='stop'){await close();return {done:true,round:rounds,elapsedMs:elapsed()};}
   // Reject invalid inventory commands before spending a round or sending input.
   let picked;
   if(!pending&&a.op==='targets'&&a.page>(lastObservation?.targetInventory?.pages??0))throw Error('Invalid inventory page');
   if(!pending&&a.op==='pick'){
    picked=lastObservation?.targets?.find(target=>target.id===a.id);
    if(!picked)throw Error('Invalid control choice');
   }
   if(!pending&&a.op==='key'&&!lastObservation?.selectKeys)throw Error('No visible focused select');
   rounds++;
   try{
    if(pending&&a.op!=='dialog')return await observe();
    if(a.op==='targets'){targetPage=a.page;return await observe();}
    if(a.op==='pick'){
     const fresh=(await project()).targets?.find(target=>target.id===a.id);
     if(!fresh||Object.keys(picked).some(k=>picked[k]!==fresh[k]))return await observe();
    }
    if(a.op==='key'&&!(await project()).selectKeys)return await observe();
    if(a.op!=='wait')targetPage=1;
    if(elapsed()>=MS)return await observe();
    if(a.op==='dialog'&&!pending)throw Error('No pending confirmation');
    // A Playwright mouse/keyboard call can wait for the modal to close.
    // Race the entire operation against the actual dialog event, retaining
    // the in-flight task until the tester explicitly responds.
    const opened=new Promise(resolve=>{wake=resolve;});
    const previous=inFlight;
    const task=(async()=>{
     if(a.op==='dialog'){
      const d=pending;pending=null;
      if(a.choice==='accept')await d.accept();else await d.dismiss();
      if(previous)await previous;
     }
     if(a.op==='click')await page.mouse.click(a.x,a.y);
     if(a.op==='pick')await page.mouse.click(picked.x,picked.y);
     if(a.op==='key')await page.keyboard.press(a.key);
     if(a.op==='type')await page.keyboard.insertText(a.text);
     if(a.op==='scroll'){await page.mouse.move(a.x,a.y);await page.mouse.wheel(0,a.dy);}
     if(a.op==='wait')await page.waitForTimeout(Math.min(a.ms,Math.max(0,MS-elapsed())));
     if(a.op==='reload')await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForTimeout(150);
    })();
    inFlight=task;
    try{await Promise.race([task,opened]);}finally{wake=null;}
    if(!pending)inFlight=null;
    return await observe();
   }catch{await close();return {done:true,round:rounds,elapsedMs:elapsed(),error:'UI action or observation failed'};}
  }
  return {observe,step,close};
 }catch(e){if(ctx)await ctx.close();if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));throw e;}
}
async function main(){
 const root=path.resolve(process.argv[2]||'.'),out=fs.mkdtempSync(path.join(os.tmpdir(),'blind-ui-'));
 const s=await session(root,out,{...browserOptions(process.env),textMode:process.env.M4_UI_TEXT==='1'});
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
module.exports={action,serverFor,session,WIDTH,HEIGHT,LIMIT,MS,checkedViewport,browserOptions,SELECT_KEYS,MAX_TARGETS,TARGETS_PER_PAGE};
