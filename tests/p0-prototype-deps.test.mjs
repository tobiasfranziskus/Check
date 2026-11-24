import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/p0-prototype-deps.mjs',import.meta.url));
const run=(arg)=>execFileSync(process.execPath,[script,arg],{encoding:'utf8'});
test('P0 public HTML assets and generated singlefile inputs remain present',()=>{
 assert.match(run('--check'),/^P0_PROTOTYPE_DEPS_OK /);
});
test('P0 distinguishes runtime modules from unintegrated legacy demos',()=>{
 const {summary,files}=JSON.parse(run('--json'));
 const byPath=new Map(files.map(x=>[x.path,x]));
 assert.ok(summary.paths_total>=300);
 assert.ok(summary.prototypes_total>=110);
 assert.deepEqual(summary.missing_static_assets,[]);
 for(const p of [
  'prototypes/spiel/spiel.js',
  'prototypes/welt/welt-kern.js',
  'prototypes/raum/raum-cockpit.js',
  'prototypes/f8-jaeger/f8-duell.js',
  'prototypes/w5ac/rule191-w5-ferry-core.js'
 ])assert.equal(byPath.get(p)?.public,true,p);
 for(const p of [
  'prototypes/w5ag/bootstrap.js',
  'prototypes/legacy-corporation/corporation.js',
  'prototypes/legacy-station/station.js',
  'prototypes/w5u/ship-graphics.js'
 ])assert.equal(byPath.get(p)?.build,true,p);
 // Diese UI-Quellen nicht mit einem unbenutzten, löschbaren Codepfad verwechseln:
 assert.equal(byPath.get('prototypes/legacy-fitting/model.js')?.public,false);
 assert.equal(byPath.get('prototypes/legacy-fitting/model.js')?.demo,true);
 assert.equal(byPath.get('prototypes/legacy-pilot/pilot.js')?.demo,true);
 assert.equal(byPath.get('prototypes/legacy-mining-scanner/scanner.js')?.demo,true);
});

// Direkte Nebenpfade und die aktuelle Management-Oberfläche dürfen nicht
// aus der statischen Schutzmenge verschwinden.
test('P0 protects public compatibility and standalone pilot entry as well as management assets',()=>{
 const {summary,files}=JSON.parse(run('--json'));
 const byPath=new Map(files.map(x=>[x.path,x]));
 for(const p of [
  'prototypes/verbund/index.html',
  'prototypes/tutorial-pilot/index.html'
 ])assert.ok(summary.public_entrypoints.includes(p),p);
 for(const p of [
  'prototypes/verbund/pruefung-ui.js',
  'prototypes/tutorial-pilot/seite.js',
  'prototypes/tutorial-pilot/akademie.js',
  'prototypes/tutorial-pilot/menue.js',
  'prototypes/tutorial-manager/manager.js',
  'prototypes/spiel/p3-manager-disposition.js',
  'prototypes/spiel/p3-manager-karte.js',
  'prototypes/spiel/p3-manager-flotte.js',
  'prototypes/spiel/p3-auftragsfeedback.js'
 ])assert.equal(byPath.get(p)?.public,true,p);
});

// Pages navigation is generated at repository root; paths resolve there.
test('P0 protects current root redirect and all static alternative entry links',()=>{
 const {summary}=JSON.parse(run('--json'));
 assert.equal(summary.root_redirect_target,'prototypes/spiel/index.html');
 for(const p of ['prototypes/spiel/index.html','prototypes/j4c/index.html','prototypes/verbund/konzern.html']){
  assert.ok(summary.root_navigation_targets.includes(p),p);
  assert.ok(summary.public_entrypoints.includes(p),p);
 }
 assert.deepEqual(summary.missing_static_assets,[]);
});

// Der CI-Bericht ist vollständig, eindeutig und an den ausgecheckten Commit gebunden.
test('P0 inventory contains one evidence row per tracked prototype and conservative references',()=>{
 const {summary,files}=JSON.parse(run('--json'));
 const cwd=fileURLToPath(new URL('../',import.meta.url));
 const tracked=execFileSync('git',['ls-files','-z'],{cwd,encoding:'utf8'}).split('\0').filter(p=>p.startsWith('prototypes/'));
 assert.deepEqual(files.map(x=>x.path),tracked);
 assert.equal(summary.commit,execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim());
 const categories=['LIVE','BUILD','TEST_PINNED','DEMO_REVIEW','MANUAL_REVIEW'];
 assert.deepEqual(summary.category_counts,Object.fromEntries(categories.map(c=>[c,files.filter(f=>f.category===c).length])));
 assert.equal(Object.values(summary.category_counts).reduce((a,b)=>a+b,0),files.length);
 for(const f of files){
  assert.equal(f.test,f.test_references.length>0,f.path);
  for(const r of f.test_references){assert.ok(r.source);assert.ok(['path','directory'].includes(r.match));}
  assert.equal(f.category,f.public?'LIVE':f.build?'BUILD':f.test?'TEST_PINNED':f.demo?'DEMO_REVIEW':'MANUAL_REVIEW');
 }
});
