import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r=api.W5R_RULES;

test('W5s-a: realer Erz-Beschaffungsweg auf unveraendertem W5r-Kern',()=>{
  const s=api.createW5RState(42,'full','npc3');
  const old=api.hash(s);
  const buy=api.execute(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'},r);
  assert.equal(buy.ok,true,'Ein eigener Miner muss physisch kaufbar sein: '+buy.reason);
  const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
  assert.ok(miner);
  const mine=api.execute(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},r);
  assert.equal(mine.ok,true,'Erzauftrag muss bezahlbar sein: '+mine.reason);
  api.advance(s,50,r);
  const transport=Object.values(s.ships).find(sh=>sh.klasse==='frachter'&&sh.owner==='transport');
  const log={tick:s.tick,miner:miner.id,oreMined:s.ledger.erz.mined,
    oreStation:s.stations.st_aldera.lager.erz,oreCargo:miner.ladung.erz||0,
    oreDealer:s.w5h,transportId:transport?.id,
    iceStock:s.stations.st_aldera.lager.eis,iceCargo:transport?.ladung.eis||0,
    transportPhase:transport?.phase,w3:s.w3,check:api.audit(s).ok};
  console.log('W5S_A_PREP '+JSON.stringify(log));
  assert.equal(api.audit(s).ok,true,'Bisheriger W5r-Finanzierungs- und Waren-Audit');
  const job=api.execute(s,{type:'shipFreight',owner:'transport',schiff:transport.id},r);
  console.log('W5S_A_FREIGHT '+JSON.stringify({ok:job.ok,reason:job.reason,
    nr:s.w3.beauftragt,oreStock:s.stations.st_aldera.lager.erz,
    w5h:s.w5h,iceJob:s.w5n.frachtauftrag}));
  assert.equal(api.audit(s).ok,true,'Auch eine abgelehnte Aktion muss unveraendert konsistent bleiben');
  assert.notEqual(api.hash(s),old);
});
