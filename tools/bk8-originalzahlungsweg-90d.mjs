// B-K8: Zahlungsherkunft und Frachter-Vollkosten im unveränderten Original-Core.
// Instrumentierung NUR hier im Analyse-Runner, keine Produktänderung.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function hook(original,replacement){
  assert.equal(src.split(original).length,2,'Einmaliger Original-Core-Anker: '+original.slice(0,95));
  src=src.replace(original,replacement);
}
hook("  buche(state, schiff.owner, 'kosten', fee);\n  return true;",
     "  buche(state, schiff.owner, 'kosten', fee);\n  witness.trade(state, schiff, station, ware, menge, kauf, wert, fee);\n  return true;");
hook("    buche(state, s.owner, 'kosten', n);\n  }\n}\nfunction aussenhandel",
     "    buche(state, s.owner, 'kosten', n);\n    witness.work(state, s, kosten, n);\n  }\n}\nfunction aussenhandel");
hook("      st.lager[ware] = da - n; state.ledger[ware].consumed += n;",
     "      st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      witness.consume(state,id,ware,n);");
hook("state.ledger[ware].produced += r.aus[ware]; }",
     "state.ledger[ware].produced += r.aus[ware]; witness.produced(state,id,ware,r.aus[ware]); }");
hook("  delete state.ships[s.id];\n  delete state.stats.verkaeufe[s.id];\n  zaehle(state.stats.verluste",
     "  witness.lost(state,s);\n  delete state.ships[s.id];\n  delete state.stats.verkaeufe[s.id];\n  zaehle(state.stats.verluste");

function tracker(){
  const w={
    transfer:{rawToPlayer:0,rawToNpcMiner:0,shipSales:0,shipPurchases:0,
      allStationRawPurchases:0,minerFees:0,merchantFees:0,freightWages:0,minerWages:0,
      allTrades:0,freightCargoSales:0,freightCargoBought:0,unpaidWork:0},
    produced:{},consumed:{},losses:[],deliveries:[],buyLots:{},byShipLabor:{},
    paidCivilConsumption:0,
    shipSnapshot:{},events:0,
    work(s,ship,due,paid){
      const t=w.transfer;
      w.byShipLabor[ship.id]=(w.byShipLabor[ship.id]||0)+paid;
      if(due>paid)t.unpaidWork+=due-paid;
      if(ship.klasse==='frachter'&&['npc1','npc2'].includes(ship.owner))t.freightWages+=paid;
      if(ship.klasse==='miner'&&['npc3','house'].includes(ship.owner))t.minerWages+=paid;
    },
    consume(s,station,ware,n){w.consumed[ware]=(w.consumed[ware]||0)+n;},
    produced(s,station,ware,n){
      const k=station+'/'+ware;w.produced[k]=(w.produced[k]||0)+n;
    },
    lost(s,sh){
      if(['npc1','npc2'].includes(sh.owner)&&sh.klasse==='frachter')
        w.losses.push({day:Math.floor(s.tick/1440)+1,ship:sh.id,owner:sh.owner,system:sh.system});
    },
    trade(s,ship,station,ware,qty,isBuy,value,fee){
      const t=w.transfer; t.allTrades++;
      const owner=ship.owner;
      if(!isBuy&&ship.klasse==='miner'&&owner==='house'&&ware==='erz')
        t.rawToPlayer+=value;
      if(!isBuy&&ship.klasse==='miner'&&owner==='npc3')
        t.rawToNpcMiner+=value;
      if(!isBuy&&ship.klasse==='miner')
        t.allStationRawPurchases+=value;
      if(ship.klasse==='miner')t.minerFees+=fee;
      if(ship.klasse!=='frachter'||!['npc1','npc2'].includes(owner))return;
      t.merchantFees+=fee;
      if(isBuy){
        t.shipPurchases+=value;t.freightCargoBought+=qty;
        (w.buyLots[ship.id] ||= []).push({
          from:station,ware,qty,originalQty:qty,cost:value,originalCost:value,
          fee,originalFee:fee,tick:s.tick,workStart:w.byShipLabor[ship.id]||0
        });
      }else{
        t.shipSales+=value;t.freightCargoSales+=qty;
        const lots=w.buyLots[ship.id]||[];
        const match=lots.find(x=>x.ware===ware&&x.qty>0);
        if(!match)return; // report only genuine match, never invent provenance
        const used=Math.min(qty,match.qty);
        const allocatedCost=Math.floor(match.originalCost*used/match.originalQty);
        const allocatedFee=Math.floor(match.originalFee*used/match.originalQty);
        match.qty-=used;match.cost-=allocatedCost;match.fee-=allocatedFee;
        if(qty===used&&match.qty===0){
          const earned=value-allocatedCost-allocatedFee-fee;
          const worked=(w.byShipLabor[ship.id]||0)-match.workStart;
          const d={ship:ship.id,owner,from:match.from,to:station,ware,
            qty:used,daysElapsed:(s.tick-match.tick)/1440,
            buy:allocatedCost,sourceFee:allocatedFee,sale:value,destFee:fee,
            paidTravelWork:worked,
            freightContributionAfterPaidWork:earned-worked};
          w.deliveries.push(d);
        }
      }
    }
  };
  return w;
}
function build(witness){
  return new Function('witness',src+
    ';return {core:m_core_index,rules:m_data_rules.RULES};')(witness);
}
function money(s){
  let sum=0;for(const x of Object.values(s.owners)){assert(Number.isSafeInteger(x.cash)&&x.cash>=0);sum+=x.cash;}
  assert.equal(sum,s.initialSupply+s.minted-s.burned,'Geldbilanz');
  return sum;
}
function audit(core,s){
  const a=core.audit(s);assert(a.ok,'Core Audit '+JSON.stringify(a));
  money(s);
  const stocks={};
  for(const st of Object.values(s.stations))for(const [ware,n] of Object.entries(st.lager)){
    assert(Number.isSafeInteger(n)&&n>=0);
    stocks[ware]=(stocks[ware]||0)+n;
  }
  for(const sh of Object.values(s.ships))for(const [ware,n] of Object.entries(sh.ladung)){
    assert(Number.isSafeInteger(n)&&n>=0);
    stocks[ware]=(stocks[ware]||0)+n;
  }
  for(const [ware,l] of Object.entries(s.ledger)){
    assert.equal(stocks[ware]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Warenbilanz '+ware);
  }
}
const count=(s,owner,klass)=>Object.values(s.ships).filter(x=>x.owner===owner&&x.klasse===klass).length;
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
function snapshot(core,s,w,day){
  const shipCost=core.preis(s,'st_aldera','frachter')+
    core.gebuehr(s,s.rulesVersion&&w? 'st_aldera':'st_aldera',core.preis(s,'st_aldera','frachter')); // original werft/fee
  const t=w.transfer;
  const stationCash=Object.values(s.owners).filter(x=>x.kind==='station').reduce((a,x)=>a+x.cash,0);
  const traderCash=s.owners.npc1.cash+s.owners.npc2.cash;
  const shells=count(s,'npc1','frachter')+count(s,'npc2','frachter');
  return {day,player:s.owners.house.cash,aldera:s.owners.st_aldera.cash,
    cyris:s.owners.st_cyris.cash,stations:stationCash,traderCash,traderHulls:shells,
    minerCash:s.owners.npc3.cash,shipCost,canReplaceTrader:{
      npc1:s.owners.npc1.cash>=shipCost+250,npc2:s.owners.npc2.cash>=shipCost+250},
    rawToPlayer:t.rawToPlayer,rawToNpcMiner:t.rawToNpcMiner,
    shipBuys:t.shipPurchases,shipSells:t.shipSales,
    freightWages:t.freightWages,minerWages:t.minerWages,
    unpaidWork:t.unpaidWork,feesMerchant:t.merchantFees,
    civilFoodConsumed:w.consumed.nahrung||0,civilFoodPayments:w.paidCivilConsumption,
    recipeFoodProduced:Object.entries(w.produced).reduce((a,[k,n])=>a+(k.endsWith('/nahrung')?n:0),0),
    freightLosses:w.losses.length,matchedCargoDeliveries:w.deliveries.length,
    money:s.initialSupply+s.minted-s.burned,minted:s.minted,burned:s.burned,
    shortages:sum(Object.fromEntries(Object.entries(s.stats.mangel).map(([id,v])=>[id,sum(v)])))};
}
function simulate(seed,active,days=90,hourly=true){
  const w=tracker(),{core,rules}=build(w),s=core.createState(seed,rules);
  assert.equal(rules.rulesVersion,14);
  if(active){
    const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
    assert(miner);
    assert(core.execute(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},rules).ok);
  }
  const points=[0,1,3,5,7,14,30,60,90],timeline=[snapshot(core,s,w,0)];
  let audits=0,saves=0;
  for(let day=1;day<=days;day++){
    for(let hour=0;hour<24;hour++){
      core.advance(s,60,rules);
      if(hourly){audit(core,s);audits++;}
    }
    if(points.includes(day))timeline.push(snapshot(core,s,w,day));
    if([1,7,14,30,90].includes(day)){
      const copy=core.load(core.save(s));
      assert.equal(core.hash(s),core.hash(copy),'Original-Save-/Load');
      saves++;
    }
    if(!hourly)audit(core,s);
  }
  audit(core,s);
  assert.equal(w.paidCivilConsumption,0,'Keine fiktive zivilisierte Barzahlung im Originalkern');
  assert((w.consumed.nahrung||0)>0,'tatsächlicher Original-Nahrungsverbrauch');
  assert(w.deliveries.length>0,'mindestens eine reale bezahlte Frachter-Warenlieferung');
  const result={seed,mode:active?'spieler_mined_erz':'passiv',
    days,audits,saves,hash:core.hash(s),timeline,final:timeline.at(-1),
    transfers:w.transfer,work:w.byShipLabor,
    totalOriginalFoodProduced:Object.entries(w.produced).filter(([k])=>k.endsWith('/nahrung')).reduce((a,[_,n])=>a+n,0),
    originalCivilConsumption:w.consumed.nahrung||0,
    originalCivilPayments:w.paidCivilConsumption,
    lostMerchantShips:w.losses,matchedDeliveries:w.deliveries.length,
    firstMatchedDeliveries:w.deliveries.slice(0,5),
    lastMatchedDeliveries:w.deliveries.slice(-3),
    note:'Deckungsbeitrag der voll gematchten Ladung erfasst echte bezahlte Arbeitskosten, nicht Hüllenersatz und Folgefahrt'};
  return result;
}
const rows=[];
for(const seed of [7,42]){
  for(const active of [false,true]){
    const a=simulate(seed,active,90,true);rows.push(a);
    console.log('BK8_ACCOUNTING '+JSON.stringify(a));
  }
  const a=rows.find(x=>x.seed===seed&&x.mode==='spieler_mined_erz');
  const b=simulate(seed,true,14,false);
  const check=a.timeline.find(x=>x.day===14);
  assert.deepEqual(b.timeline.at(-1),check,'Tag14-Kassenvergleich stündliche vs Tagesaudits');
  console.log('BK8_DAY14_GATE '+JSON.stringify({seed,hash14:b.hash,householdFunding:0,
    consumerCashPayments:check.civilFoodPayments,foodConsumed:check.civilFoodConsumed,
    originalFreightReceipts:check.shipSells,originalRawBuyerCosts:check.rawToPlayer}));
}
assert.equal(rows.length,4);
console.log('BK8_DONE '+JSON.stringify({worlds:rows.length,days:90,seeds:[7,42],
  hourlyIndependentAudits:4*90*24,replayDailyComparisons:2,
  note:'Original finanziert real den Rohstoff- und Frachterhandel, hat aber null Barzahlungen für zivilen Endverbrauch.'}));
