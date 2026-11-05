import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analysiereKaufkraft,vergleichOhneScheinemission,wertekettePro50}
  from '../analysis/w5p-kaufkraftanalyse.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const cases=[
  {modus:'none',minerOwner:'npc3',verkauft:100,fehl:4220,
    nurCash:2108,firstCash:53,lastSale:52,endCustomer:0,hash:'9ab008be7413c33a'},
  {modus:'wages',minerOwner:'npc3',verkauft:310,fehl:4010,
    nurCash:2004,firstCash:148,lastSale:158,endCustomer:0,hash:'fd11a68ce3115bb6'},
  {modus:'npcSave',minerOwner:'npc3',verkauft:789,fehl:3531,
    nurCash:1764,firstCash:396,lastSale:397,endCustomer:9,hash:'62bc07298d439e25'},
  {modus:'full',minerOwner:'npc3',verkauft:4316,fehl:4,
    nurCash:0,firstCash:null,lastSale:2160,endCustomer:3221,hash:'244ab5ef1069a304'},
  {modus:'full',minerOwner:'house',verkauft:733,fehl:3587,
    nurCash:1792,firstCash:369,lastSale:369,endCustomer:10,hash:'99c32927875bd821'}
];
test('W5p: 50 water goods/services close exactly without a single free ISK',()=>{
  const r=wertekettePro50(api.W5O_RULES);
  assert.equal(r.ladungEis,50);assert.equal(r.wasserEinheiten,50);
  assert.equal(r.wasserkaufISK,700);
  assert.equal(r.arbeitsLohnISK,320);
  assert.equal(r.minerlLohnISK,100);
  assert.equal(r.frachterLohnISK,120);
  assert.equal(r.werkLohnISK,100);
  assert.equal(r.minerGewinnISK,150);
  assert.equal(r.frachterGewinnISK,120);
  assert.equal(r.stationsGewinnISK,110);
  assert.equal(r.auskehrbarerGewinnISK,380);
  assert.equal(r.lueckeWennMinerSpartISK,150);
  assert.equal(r.lueckeJeWasserBeiMinerSparenISK,3);
  const mk1=wertekettePro50(api.W5O_RULES,{foerderrate:2});
  assert.equal(mk1.arbeitsLohnISK,270);
  assert.equal(mk1.minerGewinnISK,200);
  assert.equal(mk1.lueckeJeWasserBeiMinerSparenISK,4);
  assert.equal(mk1.vollstaendigerRueckflussISK,700);
  assert.throws(()=>wertekettePro50(api.W5O_RULES,{foerderrate:3}),/komplette/);
});
test('W5p: exact hourly diagnosis for five audited Seed42 90-day R30 histories',()=>{
  const results=cases.map(c=>{
    const x=analysiereKaufkraft(api,{seed:42,modus:c.modus,
      minerOwner:c.minerOwner,tage:90});
    assert.equal(x.nachfrage.wirklichGekauft,c.verkauft,c.modus);
    assert.equal(x.nachfrage.unverkauft,c.fehl,c.modus);
    assert.equal(x.nachfrage.verpassterNominalumsatzISK,c.fehl*14);
    assert.equal(x.mangel.kaufkraftAlleinStunden,c.nurCash);
    assert.equal(x.mangel.wareAlleinStunden,2);
    assert.equal(x.mangel.beideStunden,0);
    assert.equal(x.mangel.ersteKaufkraftSperre,c.firstCash);
    assert.equal(x.mangel.letzteBezahlteStunde,c.lastSale);
    assert.equal(x.haushalte.endISK,c.endCustomer);
    assert.equal(x.audits.hash,c.hash);
    assert.equal(x.restGeld.weltISK,33000);
    assert.equal(x.audits.keinMinting,true);
    assert.equal(x.tagebuch.length,90);
    for(const day of x.tagebuch)assert.equal(day.weltISK,33000);
    return x;
  });
  const comparison=vergleichOhneScheinemission(results);
  const expected=[4216,4006,3527,0,3583];
  assert.deepEqual(comparison.map(c=>c.entgangeneEinheitenGegenReferenz),expected);
  assert.deepEqual(comparison.map(c=>c.entgangenerNominalumsatzGegenReferenzISK),
    expected.map(n=>n*14));
  assert.ok(comparison.every(x=>x.emissionErforderlichISK===null));
  assert.equal(results[2].ware.wasserLagerNadir,31);
  assert.equal(results[3].mangel.stunden,2);
  assert.equal(results[4].restGeld.spielerISK,4750);
  console.log('W5P_90T '+JSON.stringify(comparison.map(x=>({mode:x.modus,
    owner:x.minerOwner,water:x.verkauft,missingNominal:x.entgangenerNominalumsatzGegenReferenzISK,
    physicallyFundableLoss:x.kaufkraftgebundenerAusfallISK}))));
});
test('W5p: nominal missed sales must never be mistaken for minted ISK or a cash requirement',()=>{
  const ref=analysiereKaufkraft(api,{tage:7,seed:42,modus:'full',minerOwner:'npc3'});
  const saving=analysiereKaufkraft(api,{tage:7,seed:42,modus:'npcSave',minerOwner:'npc3'});
  const result=vergleichOhneScheinemission([saving,ref]);
  assert.equal(result[0].emissionErforderlichISK,null);
  assert.ok(result[0].hinweis.includes('KEIN Emissionsbedarf'));
  assert.throws(()=>vergleichOhneScheinemission([saving,{...ref,tage:8}]),/identische/);
  assert.throws(()=>vergleichOhneScheinemission([saving]),/mindestens zwei/);
  const state=api.createW5OState(42,'full','npc3'),before=api.hash(state);
  analysiereKaufkraft(api,{seed:42,modus:'full',tage:1});
  assert.equal(api.hash(state),before,'observer does not alter external session');
  assert.throws(()=>analysiereKaufkraft(api,{tage:0}),/1\.\.365/);
  assert.throws(()=>analysiereKaufkraft(api,{tage:366}),/1\.\.365/);
});
test('W5p: 365d comparison – full recycling persists, profit saving exhausts paid demand',()=>{
  for(const row of [
    {mode:'full',owner:'npc3',water:17516,miss:2,last:8760,firstCash:null,hash:'51f385f0185c1708'},
    {mode:'npcSave',owner:'npc3',water:789,miss:8366,last:397,firstCash:396,hash:'67b60b56c1c0ee27'},
    {mode:'full',owner:'house',water:733,miss:8394,last:369,firstCash:369,hash:'41dd08e2c045f18c'}
  ]){
    const x=analysiereKaufkraft(api,{seed:42,modus:row.mode,minerOwner:row.owner,tage:365});
    assert.equal(x.nachfrage.wirklichGekauft,row.water);
    assert.equal(x.mangel.stunden,row.miss);
    assert.equal(x.mangel.letzteBezahlteStunde,row.last);
    assert.equal(x.mangel.ersteKaufkraftSperre,row.firstCash);
    assert.equal(x.audits.hash,row.hash);
    assert.equal(x.restGeld.weltISK,33000);
    assert.equal(x.tagebuch.length,365);
    console.log('W5P_365T '+JSON.stringify({mode:row.mode,owner:row.owner,
      water:row.water,shortageHours:row.miss,hash:row.hash}));
  }
});
test('W5p: 13 seeds x 90d measure NPC-saving crisis with daily independent audits and save hashes',()=>{
  for(const seed of seeds){
    const x=analysiereKaufkraft(api,{seed,modus:'npcSave',minerOwner:'npc3',tage:90});
    assert.equal(x.nachfrage.wirklichGekauft,789);
    assert.equal(x.mangel.ersteKaufkraftSperre,396);
    assert.equal(x.mangel.kaufkraftAlleinStunden,1764);
    assert.equal(x.ware.wasserLagerNadir,31);
    assert.equal(x.restGeld.weltISK,33000);
    assert.equal(x.tagebuch.length,90);
    assert.equal(x.audits.keinMinting,true);
    console.log('W5P_90_SEED '+JSON.stringify({seed,
      hash:x.audits.hash,water:x.nachfrage.wirklichGekauft,
      firstCashHour:x.mangel.ersteKaufkraftSperre,customerISK:x.haushalte.endISK}));
  }
});
