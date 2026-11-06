import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const rules=(lead=30,retain=true)=>({...base,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,autoStarterMiner:true,prepaidOrders:true,
  retainFleetEarnings:retain,autoLeadDays:lead}});
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];

function audit(s,r,label){
  const core=api.audit(s),finance=api.w5sFinanzStatus(s,r);
  assert.equal(core.ok,true,label+' core '+JSON.stringify(Object.entries(core)
    .filter(([,v])=>v?.ok===false).map(([k])=>k)));
  assert.equal(finance.ok,true,label+' '+JSON.stringify(finance.freight));
  assert.equal(finance.freight.available,finance.freight.reconstructed,
    'Spedition: Anfang + Erlöse - Kosten = freie + treuhändisch gebundene ISK');
  assert.equal(finance.freight.revenueOre,s.w3.frachtUmsatz);
  assert.equal(finance.freight.laborOre,s.w3.arbeitsKosten);
  assert.equal(finance.freight.revenueIce,s.w5n.frachtUmsatz);
  assert.equal(finance.freight.laborIce,s.w5n.frachtLohn);
  assert.equal(finance.freight.hulls,
    s.ledger.frachter.consumed*r.economy.waren.frachter.basis);
  assert.equal(finance.freight.dividend,s.w5o.divFracht);
  assert.equal(finance.demand.oreDelivered,s.w3.geliefert);
  assert.equal(finance.demand.waterPaid,s.w5n.wasserVerbraucht);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),s.initialSupply,
    label+' Weltgeld');
  for(const [ware,b] of Object.entries(s.ledger)){
    const actual=Object.values(s.stations)
      .reduce((n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(actual,b.initial+b.mined+b.produced+b.imported-b.consumed-b.exported,
      label+' physisches '+ware);
  }
  return finance;
}
function run(seed,days,lead=30,retain=true,mode='full'){
  const r=rules(lead,retain),s=api.createW5RState(seed,mode,'npc3');
  const checkpoints={};
  const first=api.hash(s);
  assert.equal(api.w5sFinanzStatus(s,r).ok,true);
  assert.equal(api.hash(s),first,'Finanzstatus muss lesend sein');
  while(s.tick<days*1440){
    const n=Math.min(1440-s.tick%1440,days*1440-s.tick);
    api.advance(s,n,r);
    const d=s.tick/1440,p=audit(s,r,'Seed '+seed+' Tag '+d);
    if([1,7,15,30,60,90,180,365].includes(d)){
      const hash=api.hash(s);
      assert.equal(api.hash(api.loadW5R(api.save(s))),hash,
        'Save/Load ohne versteckte Beobachtungsdaten');
      assert.equal(api.hash(s),hash);
      checkpoints[d]={
        cashCarrier:p.freight.current,escrow:p.freight.escrow,
        revenue:p.freight.revenueOre+p.freight.revenueIce,
        labor:p.freight.laborOre+p.freight.laborIce,
        hulls:p.freight.hulls,transfer:p.freight.reposition,
        dividend:p.freight.dividend,household:p.demand.householdCash,
        nadir:p.demand.nadirBuyerCash,oreGate:p.orePlan.stage,
        yardGate:p.yardPlan.stage,oreTrips:p.demand.oreTrips,
        iceTrips:p.demand.iceTrips,water:p.demand.waterPaid
      };
    }
  }
  const p=api.w5sFinanzStatus(s,r);
  return {seed,days,lead,retain,mode,hash:api.hash(s),
    oreTrips:p.demand.oreTrips,iceTrips:p.demand.iceTrips,
    delivered:p.demand.oreDelivered,water:p.demand.waterPaid,
    freight:p.freight,consumers:p.demand,
    built:s.w5.fertig,
    sold:s.w5.verkauft+(s.w5.minerVerkauft||0),
    assignmentCount:s.w5r.assignments.length,
    losses:s.w5r.losses.length,
    oreGate:p.orePlan.stage,yardGate:p.yardPlan.stage,
    checkpoints};
}
test('W5s-k: reine Finanzprojektion, 120 ISK je vollständig bezahlter Route, keine Kontomutation',()=>{
  const r=rules(),s=api.createW5RState(42,'full','npc3');
  const h=api.hash(s),p=api.w5sFinanzStatus(s,r);
  assert.equal(p.ok,true);
  assert.equal(p.demand.nextOreBudget,50*base.erzpilot.preis+240);
  assert.equal(p.demand.oreWorkReserve,120);
  assert.equal(p.demand.iceWorkReserve,120);
  assert.equal(p.freight.nextHullAndFlight,810);
  assert.equal(p.freight.hulls,750,'Anfangsfrachter ist real bezahlt');
  assert.equal(p.freight.current,1250);
  assert.equal(p.freight.marginBeforeHulls,0);
  assert.equal(api.hash(s),h);
  assert.equal(api.w5sFinanzStatus(s,{...base}).stage,'inaktiv');
  const forged=api.loadW5R(api.save(s));
  forged.owners.transport.cash++;
  assert.equal(api.w5sFinanzStatus(forged,r).ok,false);
  assert.equal(api.audit(forged).ok,false);
  assert.equal(api.hash(s),h);
});
test('W5s-k: drei Tage echte, vorfinanzierte Eis- und Erzleistungen statt fiktiver Marge',()=>{
  for(const seed of [42,7]){
    const a=run(seed,3);
    assert.ok(a.delivered>=50,'wirklich bezahlte W3-Erzlieferung');
    assert.ok(a.iceTrips>=1,'wirklich bezahlte Eisfracht');
    assert.equal(a.freight.reconstructed,a.freight.available);
    console.log('W5S_K_START '+JSON.stringify(a));
  }
});
test('W5s-k: 13 feste Seeds ×90d, Tages-Audits und deterministische Seed42/7-Replays',()=>{
  for(const seed of SEEDS){
    const a=run(seed,90);
    if([42,7].includes(seed))
      assert.deepEqual(run(seed,90),a,'vollständiger Seed-Replay');
    console.log('W5S_K_90D '+JSON.stringify(a));
  }
});
test('W5s-k: Seed42/7 über 365 Tage – keine heimliche Flottenrettung oder Emission',()=>{
  for(const seed of [42,7]){
    const a=run(seed,365);
    assert.equal(a.freight.reconstructed,a.freight.available);
    console.log('W5S_K_365D '+JSON.stringify(a));
  }
});
test('W5s-k: kontrollierter Vorlauf-/Dividenden-Gegenversuch ausschließlich mit vorhandenen ISK',()=>{
  for(const seed of [42,7]){
    const rows=[
      run(seed,90,30,true,'full'),
      run(seed,90,7,true,'full'),
      run(seed,90,2,true,'full'),
      run(seed,90,30,false,'full'),
      run(seed,90,30,true,'npcSave')
    ];
    for(const x of rows)assert.equal(x.freight.reconstructed,x.freight.available);
    console.log('W5S_K_OPTIONS '+JSON.stringify({seed,
      rows:rows.map(({lead,retain,mode,oreTrips,iceTrips,delivered,water,
        built,sold,assignmentCount,losses,freight,consumers,oreGate,yardGate})=>({
        lead,retain,mode,oreTrips,iceTrips,delivered,water,built,sold,
        assignmentCount,losses,cash:freight.current,dividend:freight.dividend,
        hulls:freight.hulls,carrierMissing:freight.missing,
        nadir:consumers.nadirBuyerCash,household:consumers.householdCash,
        oreGate,yardGate}))}));
  }
});
