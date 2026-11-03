// B-K12a [ANALYSE]: keine Produktregel, sondern zwei bezahlte lokale
// Vollkosten-Abnahmevarianten am historisch isolierten R15/Schema9-Nadir.
// Gilt NUR fuer die echte Micro-Welt ohne Anfangs-Eis/-Nahrung und
// ohne anfangs handelnde NPC-Frachter. Kapital stammt immer aus realen Konten.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,model,strictRules,withoutGrants,capital,audit,sum} from './lib/bk12-analyse.mjs';

// Haengt eine rein testseitige, nur auf Nadir bezogene Abnahmeentscheidung
// an den bestehenden originalen, tatsaechlich bezahlten NEU-Endkauf an.
// Originalpreise, 4-ISK-Testlohn, Produktion und Rohstoffbuchungen bleiben.
const originalAfford='const neuKauf = Math.min(neuBedarf, Math.floor(hh.cash / p));';
const originalPost='state.stats.haushaltskauf[id].isk += geld;';
assert.equal(fixture.split(originalAfford).length,2);
assert.equal(fixture.split(originalPost).length,2);
const coveredSource=fixture.replace(originalAfford,
  'const neuKauf = __bk12.coverAffordable(state,id,ware,neuBedarf,p);')
  .replace(originalPost,originalPost+
  '\n          __bk12.coverPay(state,id,ware,neuKauf,p);');
assert.notEqual(coveredSource,fixture);
const NADIR='st_nadir';
const fundFor=(s,rules,station)=>
  rules.world.systems[s.stations[station].system].fonds;
function newMicro(seed,mode){
  const m=model({source:mode==='reference'?withoutGrants:
    coveredSource.replace('  if (n <= 0 || f.cash < n) return 0;',
      '  if (true) return 0;'),traceSource:true});
  strictRules(m);
  const s=m.core.createState(seed,m.rules);
  // Wie der verifizierte B-K12-Mikrofall: nur Ausgangswaren entfernen.
  for(const ware of ['eis','nahrung']){
    s.ledger[ware].initial-=s.stations[NADIR].lager[ware];
    s.stations[NADIR].lager[ware]=0;
  }
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
  const payouts=[];
  const rejected=[];
  const lots=()=>m.api.sourceTrace().food;
  const acct=()=>s.owners[NADIR];
  const payer=()=>mode==='haushalt'?'hh_'+NADIR:fundFor(s,m.rules,NADIR);
  const fundingNeed=(row,p)=>Math.max(0,row.cost-p);
  const coreStats=(who,field,isk)=>{
    assert(s.stats.konto[who]);
    s.stats.konto[who][field]+=isk;
  };
  if(mode!=='reference'){
    m.api.coverAffordable=(state,id,ware,need,unitPrice)=>{
      const hh=state.owners['hh_'+id];
      if(id!==NADIR||ware!=='nahrung')
        return Math.min(need,Math.floor(hh.cash/unitPrice));
      assert.equal(lots().length,state.stations[id].lokalNeuNahrung,
        'exakt vorhandene NEU-Lots vor dem Kauf, keine fingierte Ware');
      const budgetBuyer=hh.cash,budgetPayer=state.owners[payer()].cash;
      let base=0,extra=0,qty=0;
      for(const lot of lots().slice(0,need)){
        const plus=fundingNeed(lot,unitPrice);
        if(base+unitPrice>budgetBuyer ||
          (mode==='haushalt'&&base+unitPrice+extra+plus>budgetBuyer)||
          (mode==='fonds'&&extra+plus>budgetPayer)) break;
        base+=unitPrice;extra+=plus;qty++;
      }
      if(qty===0&&need>0)rejected.push({tick:state.tick,need,
        market:unitPrice,buyerCash:budgetBuyer,
        coverCash:budgetPayer,lowestCost:lots()[0]?.cost||null});
      return qty;
    };
    m.api.coverPay=(state,id,ware,qty,price)=>{
      if(id!==NADIR||ware!=='nahrung'||qty===0)return;
      const chosen=lots().slice(0,qty);
      assert.equal(chosen.length,qty);
      const costs=chosen.map(x=>x.cost);
      const additional=sum(chosen.map(x=>fundingNeed(x,price)));
      const from=payer();
      // Der Original-Core hat zuvor schon qty*price vom HH an Nadir gezahlt.
      // Der belegte Zusatzbetrag wird atomar aus tatsächlich vorhandenem
      // HH- oder Fonds-Cash durch den ORIGINALEN Vertragskern transferiert.
      if(additional>0){
        const contract=m.core.vertrag.reservieren(state,from,id,additional);
        assert(contract,'echtes Abnahmebudget ist vor Bezahlung nicht frei');
        const ok=m.core.vertrag.bezahlen(state,contract,
          'leistung:abnahme:'+mode+':'+id+':'+state.tick,additional);
        assert(ok,'nur nachgewiesener Original-NEU-Haushaltsverbrauch');
        assert(m.core.vertrag.abschliessen(state,contract));
        coreStats(from,'kosten',additional);
        coreStats(id,'erloes',additional);
      }
      payouts.push({tick:state.tick,mode,payer:from,qty,marketPrice:price,
        originalHouseholdISK:qty*price,extraPaidISK:additional,
        fullPaidISK:qty*price+additional,actualLotCosts:costs,
        cashStationAfter:acct().cash,
        cashHouseholdAfter:state.owners['hh_'+id].cash,
        cashFundAfter:state.owners[fundFor(state,m.rules,id)].cash});
    };
  }
  const initial=structuredClone(s);
  return {m,s,mode,seed,initial,payouts,rejected};
}
function runMicro(seed,mode,minutes){
  const w=newMicro(seed,mode),{m,s,initial}=w;
  const dayHashes=[],balances=[];
  for(let i=0;i<minutes;i++){
    m.core.step(s,m.rules);
    if(s.tick%60===0){
      audit(s,m.core,m.provenance);
      assert.equal(m.api.sourceTrace().food.length,s.stations[NADIR].lager.nahrung,
        'alle im Mikrofall neu produzierten Nadir-Vorratslose weiter im FIFO');
      if([120,1440,2880,10080].includes(s.tick)){
        balances.push({tick:s.tick,station:capital(s)[NADIR],
          cash:s.owners[NADIR].cash,hh:s.owners['hh_'+NADIR].cash,
          fund:s.owners[fundFor(s,m.rules,NADIR)].cash,
          food:s.stations[NADIR].lager.nahrung,ice:s.stations[NADIR].lager.eis,
          produced:s.ledger.nahrung.produced,
          paidNew:s.stats.haushaltskauf[NADIR].menge,
          paidISK:s.stats.haushaltskauf[NADIR].isk});
      }
    }
    if(s.tick%1440===0){
      const save=m.core.save(s),copy=m.core.load(save,undefined,m.rules);
      assert.equal(m.core.hash(copy),m.core.hash(s),'taeglicher Core Save/Load Hash');
      dayHashes.push(m.core.hash(s));
    }
  }
  audit(s,m.core,m.provenance);
  const trace=m.api.sourceTrace();
  const realized=trace.realized;
  const paid=sum(realized.map(x=>x.paid));
  const cost=sum(realized.map(x=>x.cost));
  const byHH=s.stats.haushaltskauf[NADIR].menge-
    initial.stats.haushaltskauf[NADIR].menge;
  const additional=sum(w.payouts.map(x=>x.extraPaidISK));
  const hhBase=s.stats.haushaltskauf[NADIR].isk-
    initial.stats.haushaltskauf[NADIR].isk;
  if(mode!=='reference'){
    assert.equal(sum(w.payouts.map(x=>x.qty)),byHH);
    assert.equal(sum(w.payouts.map(x=>x.originalHouseholdISK)),hhBase);
    assert.equal(sum(w.payouts.map(x=>x.fullPaidISK)),hhBase+additional);
    assert.equal(sum(w.payouts.map(x=>sum(x.actualLotCosts))),cost,
      'alle Zusatzleistungszahlungen sind tatsaechlich produzierten und konsumierten Chargen zugeordnet');
    assert(w.payouts.every(x=>x.fullPaidISK>=sum(x.actualLotCosts)),
      'nur ex post kostendeckend voll bezahlte einzelne konsumierte NEU-Lose');
    assert.equal(w.payouts.every(x=>x.payer===
      (mode==='haushalt'?'hh_'+NADIR:fundFor(s,m.rules,NADIR))),true);
  }else assert.equal(additional,0);
  const first=realized[0];
  return {seed,mode,days:minutes/1440,hash:m.core.hash(s),
    initialSupply:initial.initialSupply,
    initialMoney:initial.initialSupply+initial.minted-initial.burned,
    first:first&&{tick:first.tick,paid:first.paid,cost:first.cost,qty:first.qty},
    actualNewFoodPaid:byHH,spotPaidISK:hhBase,
    extraPaidISK:additional,realizedCostISK:cost,fullPaidISK:hhBase+additional,
    netAgainstCosts:hhBase+additional-cost,
    residualNewFood:trace.food.length,ice:trace.ice.length,
    wageCash:s.owners['hh_'+NADIR].cash,
    stationCash:s.owners[NADIR].cash,
    fundCash:s.owners[fundFor(s,m.rules,NADIR)].cash,
    shortageHours:s.stats.mangel[NADIR].nahrung-initial.stats.mangel[NADIR].nahrung,
    productionDone:s.stats.rezepte[NADIR]-initial.stats.rezepte[NADIR],
    payouts:w.payouts.slice(0,8),paymentCount:w.payouts.length,
    rejected:w.rejected.slice(0,8),rejectedCount:w.rejected.length,
    balances,dayHashes,minted:s.minted-initial.minted,burned:s.burned-initial.burned,
    money:s.initialSupply+s.minted-s.burned};
}
test('B-K12a: Original-Nadir: echter dynamischer Endpreis und historische FIFO-Stueckkosten',()=>{
  for(const seed of [42,7]){
    const o=runMicro(seed,'reference',1440);
    assert.deepEqual(o.first,{tick:120,paid:53,cost:68,qty:1});
    assert.equal(o.actualNewFoodPaid,23);
    assert.equal(o.spotPaidISK,1031);
    assert.equal(o.realizedCostISK,1564);
    assert.equal(o.netAgainstCosts,-533);
    assert.equal(o.stationCash,6);
    console.log('BK12A_ACTUAL_MARGIN '+JSON.stringify(o));
  }
});
test('B-K12a: zwei rein testseitige voll aus Bestandskonten bezahlte Endabnahmen, kein Preis- oder ISK-Mint',()=>{
  for(const seed of [42,7])for(const mode of ['haushalt','fonds']){
    const v=runMicro(seed,mode,1440);
    assert(v.first===undefined||v.first.cost<=v.first.paid+v.extraPaidISK);
    assert(v.netAgainstCosts>=0,'nur voll finanzierte tatsaechliche HH-Endkaeufe');
    assert.equal(v.money,v.initialMoney+v.minted-v.burned,
      'Weltgeld muss gemessenem Ursprungsbestand plus echten Core-Quellen minus Senken entsprechen');
    assert(v.actualNewFoodPaid<=24,'eine Ortswelt mit einem Tagesbedarf ohne Gratisverbrauch');
    console.log('BK12A_FUNDED_ONE_DAY '+JSON.stringify(v));
  }
});
test('B-K12a: sieben Tage Nachfinanzierung und Haushaltsnachfrage in derselben Realwirtschaft',()=>{
  for(const mode of ['reference','haushalt','fonds']){
    const s=runMicro(42,mode,10080);
    assert.equal(s.days,7);
    assert.equal(s.dayHashes.length,7);
    assert(s.shortageHours>=0&&s.shortageHours<=168);
    if(mode!=='reference')assert(s.netAgainstCosts>=0);
    const pinned={
      reference:{hash:'5554f722d40b92b6',paid:23,
        shortage:158,station:6,fund:2207,margin:-533},
      haushalt:{hash:'d7f658627d41237a',paid:14,
        shortage:162,station:7,fund:2199,margin:0},
      fonds:{hash:'9aa487944d9f4aa5',paid:125,
        shortage:107,station:18,fund:11,margin:0}
    }[mode];
    assert.equal(s.hash,pinned.hash,'Determinismus und Buchungsfolgerungen unveraendert');
    assert.equal(s.actualNewFoodPaid,pinned.paid,'wirklicher bezahlter Endkauf');
    assert.equal(s.shortageHours,pinned.shortage,'wirklicher lokaler Versorgungsmangel');
    assert.equal(s.stationCash,pinned.station);
    assert.equal(s.fundCash,pinned.fund);
    assert.equal(s.netAgainstCosts,pinned.margin,'wirkliche FIFO-Kostendeckung');
    assert.equal(s.money,s.initialMoney+s.minted-s.burned);
    console.log('BK12A_SEVEN_DAY_FINANCING '+JSON.stringify(s));
  }
});
