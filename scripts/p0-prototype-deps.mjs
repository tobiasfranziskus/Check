// P0: konservative, read-only Inventur. Kein Laufzeit-/Buildbestand wird verschoben.
// Aufruf: node scripts/p0-prototype-deps.mjs --check | --json
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
const present=new Set(tracked);
const publicHtml=[
 'index.html',
 'aphros-void.html',
 'prototypes/spiel/index.html',
 'prototypes/j4c/index.html',
 'prototypes/verbund/konzern.html',
 'prototypes/verbund/index.html',
 // Separat erreichbare, durch tutorial-pilot-browser.cjs geprüfte Alt-URL.
 'prototypes/tutorial-pilot/index.html'
];
const buildSources=[
 'prototypes/w5ag/index.html',
 // Diese zwei CSS-Quellen bettet build-w5-singlefile.mjs zusätzlich ein.
 'prototypes/legacy-corporation/corporation.css',
 'prototypes/legacy-station/station.css'
];
const required=[
 'prototypes/welt/welt-kern.js',
 'prototypes/flug2d/flug-kern.js',
 'prototypes/raum/raum-cockpit.js',
 'prototypes/spiel/spiel.js',
 'prototypes/f8-jaeger/f8-duell.js',
 'prototypes/legacy-hub/core-adapter.js',
 'prototypes/w5ac/rule191-w5-ferry-core.js',
 'prototypes/verbund/pruefung-ui.js',
 'prototypes/tutorial-pilot/seite.js',
 'prototypes/tutorial-pilot/akademie.js',
 'prototypes/tutorial-pilot/menue.js',
 'prototypes/tutorial-manager/manager.js',
 'prototypes/spiel/p3-manager-disposition.js',
 'prototypes/spiel/p3-manager-karte.js',
 'prototypes/spiel/p3-manager-flotte.js',
 'prototypes/spiel/p3-auftragsfeedback.js'
];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>present.has(p);
const htmlEntries=tracked.filter(p=>p.startsWith('prototypes/')&&p.endsWith('.html'));
const historicalHtml=htmlEntries.filter(p=>!publicHtml.includes(p)&&!buildSources.includes(p));
function local(from,raw){
 if(!raw || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(raw))return null;
 const clean=raw.split(/[?#]/,1)[0];
 if(!clean)return null;
 const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));
 if(resolved==='..'||resolved.startsWith('../'))return null;
 return resolved;
}
function directAssets(p){
 const source=read(p),found=[];
 if(p.endsWith('.html')){
  // Eine archivierte Demo darf weiterhin Ressourcen aus ihrem ursprünglichen
  // Verzeichnis laden. HTML-<base href> auf relative Asset-Pfade anwenden.
  const baseHref=/<base\s+[^>]*href\s*=\s*["']([^"']+)["']/i.exec(source)?.[1];
  const assetOrigin=baseHref ? (local(p,baseHref.endsWith('/') ? baseHref+'__base__.html' : baseHref) || p) : p;
  for(const m of source.matchAll(/<(script|link)\b[^>]*>/gi)){
   const tag=m[0],type=m[1].toLowerCase();
   const attr=(name)=>{
    const rx=new RegExp('\\b'+name+'\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i');
    return rx.exec(tag)?.[1];
   };
   if(type==='link'&&!/\bstylesheet\b/i.test(attr('rel')||''))continue;
   const dep=local(assetOrigin,attr(type==='script'?'src':'href'));
   if(dep)found.push(dep);
  }
 }
 if(p.endsWith('.css')){
  for(const m of source.matchAll(/(?:@import\s+(?:url\()?|url\()\s*["']?([^"')\s;]+)["']?\s*\)?/gi)){
   const dep=local(p,m[1]);if(dep)found.push(dep);
  }
 }
 return [...new Set(found)];
}
function closure(seeds){
 const visited=new Set(),missing=[],edges=[];
 const queue=[...seeds];
 while(queue.length){
  const p=queue.shift();
  if(visited.has(p))continue;
  if(!exists(p)){missing.push(p);continue}
  visited.add(p);
  if(p.endsWith('.html')||p.endsWith('.css')){
   for(const dep of directAssets(p)){
    edges.push([p,dep]);
    if(!exists(dep))missing.push(p+' -> '+dep);
    else queue.push(dep);
   }
  }
 }
 return {files:visited,edges,missing};
}
const publicGraph=closure(publicHtml);
const buildGraph=closure(buildSources);
const demoGraph=closure(historicalHtml);
const archivedHub=closure(['prototypes/legacy-hub/archiv/index.html','prototypes/legacy-hub/archiv/core-preview.html']);
const testAndCi=tracked.filter(p=>p.startsWith('tests/')||p.startsWith('.github/workflows/')||p==='scripts/build-w5-singlefile.mjs');
const testBodies=testAndCi.map(p=>[p,read(p)]);
const testRefs=new Map();
for(const p of tracked.filter(p=>p.startsWith('prototypes/')||p.startsWith('versionen/')||p.startsWith('spieltest/'))){
 const dir=p.split('/').slice(0,2).join('/')+'/';
 const refs=testBodies.filter(([source,body])=>body.includes(p)||body.includes(dir)).map(([source])=>source);
 if(refs.length)testRefs.set(p,refs);
}
const prototypes=tracked.filter(p=>p.startsWith('prototypes/'));
const report=prototypes.map(p=>({
 path:p,
 public:publicGraph.files.has(p),
 build:buildGraph.files.has(p),
 test:testRefs.has(p),
 demo:demoGraph.files.has(p),
 // Bewusst KEINE "sicher löschbar"-Kategorie: dynamische Pfade, URLs und Branches
 // lassen sich nicht allein durch diesen statischen Scan ausschließen.
 category:publicGraph.files.has(p)?'LIVE':buildGraph.files.has(p)?'BUILD':
  testRefs.has(p)?'TEST_PINNED':demoGraph.files.has(p)?'DEMO_REVIEW':'MANUAL_REVIEW'
}));
const missing=[...new Set([...publicGraph.missing,...buildGraph.missing])];
const guarded={
 paths_total:tracked.length,
 prototypes_total:prototypes.length,
 public_direct_or_transitive:report.filter(x=>x.public).length,
 build_direct_or_transitive:report.filter(x=>x.build).length,
 test_reference_conservative:report.filter(x=>x.test).length,
 demo_direct_or_transitive:report.filter(x=>x.demo).length,
 manual_review:report.filter(x=>x.category==='MANUAL_REVIEW').length,
 missing_static_assets:missing,
 missing_archived_hub_assets:archivedHub.missing,
 public_entrypoints:publicHtml,
 build_sources:buildSources
};
if(process.argv.includes('--check')){
 if(missing.length)throw Error('P0 dangling public/build assets: '+missing.join('; '));
 if(archivedHub.missing.length)throw Error('P0 dangling archived hub assets: '+archivedHub.missing.join('; '));
 for(const p of required){
  if(!publicGraph.files.has(p))throw Error('P0 required public runtime module missing: '+p);
 }
 if(!buildGraph.files.has('prototypes/legacy-corporation/corporation.css')||
    !buildGraph.files.has('prototypes/legacy-station/station.css')){
  throw Error('P0 generated single-file shadow styles no longer protected');
 }
 if(!read('scripts/build-w5-singlefile.mjs').includes("const source='prototypes/w5ag/index.html'")){
  throw Error('P0 build source changed; update inventory explicitly');
 }
 console.log('P0_PROTOTYPE_DEPS_OK '+JSON.stringify(guarded));
}else if(process.argv.includes('--json')){
 console.log(JSON.stringify({summary:guarded,files:report},null,2));
}else{
 console.log('P0 prototype dependency inventory (read-only; not a deletion verdict)');
 console.log(JSON.stringify(guarded,null,2));
 console.log('Use --json for per-file evidence or --check for CI gate');
}
