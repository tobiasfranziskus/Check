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
