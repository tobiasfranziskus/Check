// Reproduce all checked worlds and a second independent command replay.
// Usage: node tools/w5ad-report.mjs > /tmp/w5ad-results.jsonl
import assert from 'node:assert/strict';
import {scenarios,runScenario} from '../tests/helpers/w5ad-research.mjs';
for(const days of [90,365]){
 const selected=days===90?scenarios:scenarios.filter(x=>[
  'earned','short-929','buyer-739','saving-1500','second-loss'].includes(x.id));
 for(const cfg of selected){
  const a=runScenario(cfg,days),b=runScenario(cfg,days,{check:false});
  assert.equal(a.result.hash,b.result.hash,cfg.id+' '+days);
  process.stdout.write(JSON.stringify(a.result)+'\n');
 }
}
