import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
const settings=(buffer,lead=30,retain=true,mode='full')=>({
  r:{...base,w5s:{minerIndustry:true,concurrent:true,
    autoIndustry:true,autoOre:true,autoNpcOre:true,
    prepaidOrders:true,autoStarterMiner:true,autoLeadDays:lead,
    retainFleetEarnings:retain,
    ...(buffer?{carrierWorkingCapital:true}:{})}},
  mode
});
function audit(s,r,label){
  const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
  assert.equal(a.ok,true,label+' core '+JSON.stringify(
    Object.entries(a).filter(([,v])=>v?.ok===false).map(([k])=>k)));
  assert.equal(f.ok,true,label+' bilanziert');
  assert.equal(f.freight.available,f.freight.reconstructed,label+' Eigentümerkonto');
  assert.equal(s.minted,0,label+' keine Geldemission');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply,
    label+' alle Welt-ISK');
  for(const [ware,l] of Object.entries(s.ledger)){
    const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      label+' reales Warenledger '+ware);
  }
  return f;
}
function run(seed,days,buffer,lead=30,retain=true,mode='full'){
  const {r}=settings(buffer,lead,retain,mode);
  const s=api.createW5RState(seed,mode,'npc3'),hash=api.hash(s);
  assert.equal(api.w5sFinanzStatus(s,r).ok,true);
  assert.equal(api.hash(s),hash,'Status rein lesend');
  let firstSecondOre=null;
  const points={};
  while(s.tick<days*1440){
    const n=Math.min(1440-s.tick%1440,days*1440-s.tick);
    api.advance(s,n,r);
    const d=s.tick/1440,f=audit(s,r,'seed '+seed+' day '+d);
    if(s.w3.abgeschlossen>=2&&firstSecondOre===null)firstSecondOre=d;
    if([1,7,15,30,60,90,180,365].includes(d)){
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
        'Roundtrip nach echten Treuhand-/Kaufbelegen');
      points[d]={ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
        water:s.w5n.wasserVerbraucht,cash:f.freight.current,
        bound:f.freight.escrow,dividend:f.freight.dividend,
        hulls:f.freight.hulls,station:f.demand.nadirBuyerCash,
        oreGate:f.orePlan.stage,workGate:f.yardPlan.stage};
    }
  }
  const f=api.w5sFinanzStatus(s,r);
  return {seed,days,buffer,lead,retain,mode,hash:api.hash(s),
    ore:s.w3.abgeschlossen,firstSecondOre,
    delivered:s.w3.geliefert,ice:s.w5n.frachtAbgeschlossen,
    water:s.w5n.wasserVerbraucht,built:s.w5.fertig,
    sold:s.w5.verkauft+(s.w5.minerVerkauft||0),
    replacements:(s.w5r.assignments||[]).length,
    lost:s.w5r.losses.length,npcCash:s.owners.npc3.cash,
    freightCash:f.freight.current,freightBound:f.freight.escrow,
    dividend:f.freight.dividend,
    cashMissing:f.freight.missing,oreStage:f.orePlan.stage,
    workStage:f.yardPlan.stage,points};
}
test('W5s-l: Forschungsflag isoliert, Kostenkalkulation unverändert und rein lesend',()=>{
  const s=api.createW5RState(42,'full','npc3');
  const yes=settings(true).r,no=settings(false).r;
  const hash=api.hash(s),y=api.w5sFinanzStatus(s,yes),
    n=api.w5sFinanzStatus(s,no);
  assert.equal(y.freight.workingCapitalRequired,120);
  assert.equal(y.freight.nextHullAndFlight,810);
  assert.equal(y.freight.nextHullWithWorkingCapital,930);
  assert.equal(n.freight.workingCapitalRequired,0);
  assert.equal(n.freight.nextHullWithWorkingCapital,810);
  assert.equal(api.hash(s),hash);
  assert.equal(y.demand.oreWorkReserve,120);
  assert.equal(y.demand.iceWorkReserve,120);
});
test('W5s-l: ohne Flag bitidentisch zu grünem W5s-k Seed42/7',()=>{
  for(const [seed,reference] of [[42,'12b217b14222d390'],
    [7,'83f8bc2dc6293710']]){
    const a=run(seed,90,false);
    assert.equal(a.hash,reference,
      'W5s-k Referenz ohne neuer Flag bleibt exakt gleich');
  }
});
test('W5s-l: ein echter 50-Erz-Folgeauftrag ist nur bei Finanzierung erlaubt – 13 Seeds ×90 Tage',()=>{
  for(const seed of SEEDS){
    const a=run(seed,90,true);
    if([42,7].includes(seed))
      assert.deepEqual(run(seed,90,true),a,'gepaarter Replay');
    assert.equal(a.delivered,a.ore*50,'W3 nur tatsächlich gelieferte volle Chargen');
    assert.ok(a.ore>=2,'mindestens zwei echte W3-Erztransporte aus realem Käuferkapital');
    assert.equal(a.firstSecondOre,31,'zweite vollständig abgewickelte Fracht bis Tag31');
    assert.ok(a.built>=5,'neue Werftbestände statt kostenloser Ersatzhülle');
    assert.ok(a.ice>=0&&a.water>=0);
    console.log('W5S_L_90D '+JSON.stringify(a));
  }
});
test('W5s-l: Seed42/7 volle 365 Tage plus Save/Load, keine automatische Gratisrettung',()=>{
  for(const seed of [42,7]){
    const a=run(seed,365,true);
    assert.equal(a.delivered,a.ore*50);
    assert.ok(a.ore>=2,'zweite Echtgeld-Erzlieferung bis Tag365 bleibt verbucht');
    console.log('W5S_L_365D '+JSON.stringify(a));
  }
});
test('W5s-l: kontrollierter Vergleich ohne/vollfinanzierte Reserve mit 2/7/30 Tagen Vorlauf',()=>{
  for(const seed of [42,7]){
    const rows=[run(seed,90,false,30),run(seed,90,true,30),
      run(seed,90,false,7),run(seed,90,true,7),
      run(seed,90,false,2),run(seed,90,true,2)];
    console.log('W5S_L_PAIRS '+JSON.stringify({seed,
      cases:rows.map(({buffer,lead,ore,firstSecondOre,delivered,
        ice,water,built,sold,replacements,lost,npcCash,freightCash,
        cashMissing,dividend,oreStage,workStage})=>({
        buffer,lead,ore,firstSecondOre,delivered,ice,water,built,sold,
        replacements,lost,npcCash,freightCash,cashMissing,dividend,
        oreStage,workStage}))}));
  }
});
