// Zusätzliche Prüfung des 3000-ISK-Puffers: stündliche Minima nach Investition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
if(process.env.BASELINE==='1')source=source.replace('schema: 8, rulesVersion: 9','schema: 8, rulesVersion: 8').replace('if (state.tick % (rules.economy.stunde * 24) === 0) investieren(state, rules);','');
source=source.replace('state.stats.zuschuss += n; return n;', 'state.stats.zuschuss += n; subsidy(state, owner, n); return n;');
let transfers=[];
const c=new Function('subsidy',source+';return m_core_index;')((s,owner,n)=>{if(owner==='npc1')transfers.push({tick:s.tick,n,soll:s.sollflotte.npc1.length});});
for(const seed of [7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159]) {
 transfers=[];const s=c.createState(seed);let min=null,zero=0,first=null;
 for(let hour=1;hour<=2160;hour++) {
  c.advance(s,60);assert(c.audit(s).ok);
  if(process.env.BASELINE==='1'?s.tick>=10080:s.sollflotte.npc1.length===4){if(first===null)first=s.tick;min=Math.min(min??Infinity,s.owners.npc1.cash);if(s.owners.npc1.cash===0)zero++;}
 }
 console.log(JSON.stringify({seed,first,minimumCashAfterGrowth:min,zeroHourEnds:zero,subsidies:transfers,hash:c.hash(s)}));
}
