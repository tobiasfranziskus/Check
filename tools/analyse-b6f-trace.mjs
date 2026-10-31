// B6f-P1: deterministischer EVENT-TRACE der archivierten B6e-Einzelsituation.
// Analysiert ausschliesslich B1 handelsflotte / seed 42 / Frachter sh112. Kein Produktcode.
// Regel 14 / Engine aus index.html, ausschliesslich als gekapselte Analyse-Quelltransformation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(seed|case|starts|b1|legacy|out|mode)=/.test(x)),'unbekannter Parameter');
const mode=opt('mode','control');
assert(['control','credit'].includes(mode),'nur Kontrollkern oder B6e Kredit-Gegenversuch');
const scenario=opt('case',null), seed=scenario?{miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario]:Number(opt('seed','42'));
assert.equal(scenario,'handel-flotte','B6f: nur historischer Fall handel-flotte');
assert.equal(seed,42,'B6f: ausschliesslich Seed 42');
assert(Number.isSafeInteger(seed) && seed>0,'Seed/Fall');
const named=['miner','handel-flotte','station','jagd'];
assert(!scenario||named.includes(scenario));
const CASES= {miner:42,'handel-flotte':42,station:1234,jagd:98765};
const SEEDS=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert(scenario||SEEDS.includes(seed),'nur 13 historische Seeds');
const sha=x=>createHash('sha256').update(x).digest('hex');
const sum=a=>a.reduce((x,y)=>x+y,0);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert(html.includes('v0.12.5'),'B6 nur auf v0.12.5');
function coreSource(h) {
  const a=h.indexOf('<script>')+8,b=h.indexOf('const m_data_oberflaeche');
  assert(a>=8&&b>a,'Core nicht auffindbar');
  return h.slice(a,b);
}
const original=coreSource(html);
assert.equal(sha(original),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9','historische main-Core-Quelle muss unveraendert bleiben');
function creditSource(code){
  let out=code;
  const pre="  ankunft(state, rules); foerderung(state, rules); entscheidung(state, rules); reise(state, rules); produktion(state, rules);";
  assert.equal(out.split(pre).length,2,"B6e Step Einstieg eindeutiger Anker");
  out=out.replace(pre,"  probe.before(state,rules);\n"+pre);
  const post="  return ergebnisse;\n}\nfunction advance(state, n, rules)";
  assert.equal(out.split(post).length,2,"B6e Step Abschluss eindeutiger Anker");
  out=out.replace(post,"  probe.after(state,rules);\n"+post);
  const trade="buche(state, schiff.owner, 'kosten', fee);";
  assert.equal(out.split(trade).length,2,"B6e Handelsanker");
  out=out.replace(trade,trade+"\n  probe.trade(state,schiff,ware,menge,kauf);");
  return out;
}
const src=mode==='credit'?creditSource(original):original;
assert.equal(sha(src),mode==='credit'?'50d83075bda5d5cef20ed8bdc9ae8a8b6c1ab7bc8976748b4458933682bbde00':sha(original),'historischer B6e-Variante-Hash');
const instrument=(code)=>{
  let s=code;
  const hook=(needle,insert)=>{
    assert.equal(s.split(needle).length,2,'genau ein Hook: '+needle);
    s=s.replace(needle,needle+'\n'+insert);
  };
  hook('if (!reicht) return false;',
    'watch.preTrade(state,rules,schiff,station,ware,menge,kauf,wert,fee);');
  hook("buche(state, schiff.owner, 'kosten', fee);",
    'watch.trade(state,schiff,station,ware,menge,kauf,wert,fee); watch.postTrade(state,schiff);');
  hook('const n = Math.min(besitzer.cash, kosten);',
    'watch.cost(state,s,kosten,n); watch.costBefore(state,s,kosten,n,arbeit,system);');
  hook("buche(state, s.owner, 'kosten', n);",'watch.costAfter(state,s);');
  hook('function zerstoeren(state, rules, s) {','watch.preLoss(state,rules,s);');
  hook('function entfernen(state, rules, s) {',
    'watch.lost(state,s); watch.postLoss(state,rules,s);');
  hook('state.ledger[x.klasse].consumed += 1;',
    'watch.hull(state,s,x,bedarf);');
  const marker='  return ergebnisse;\n}\nfunction advance(state, n, rules)';
  assert.equal(s.split(marker).length,2,'ein eindeutiger stundenbasierter Abschlussanker');
  s=s.replace(marker,'  watch.hour(state,rules);\n'+marker);
  return s;
};
function engine(code,watch,probe=null) {
  return new Function('watch','probe',code+';return {c:m_core_index,r:m_data_rules.RULES};')(watch,probe);
}
class Probe {
  constructor(){this.trace=[];this.stats={attempts:0,loans:0,lent:0,repayments:0,
    unfunded:0,noHull:0,notNeeded:0,missedAfterLoss:0};}
  before(state,rules){
    if(state.tick%60!==0)return;
    const w=rules.world,werft=w.werft,hulls=state.stations[werft].lager.frachter||0;
    for(const owner of ['npc1','npc2']){
      if(state.b6eContracts?.[owner])continue; // hoechstens ein echter Vertrag je Eigentümer
      if(Object.values(state.ships).some(sh=>sh.owner===owner)){this.stats.notNeeded++;continue;}
      if(!(state.sollflotte[owner]||[]).some(sh=>sh.klasse==='frachter'))continue;
      this.stats.attempts++;
      if(hulls<1){this.stats.noHull++;continue;}
      const p=m_corePreis(state,werft,rules);
      const need=Math.max(0,p+600-state.owners[owner].cash);
      if(need===0){this.stats.notNeeded++;continue;}
      // Eine einzelne neutrale Station: keine verbundenen Kassen und kein Spieler-Eingriff.
      const candidates=Object.keys(state.stations).sort()
        .filter(id=>!state.stations[id].eigentum)
        .filter(id=>state.owners[id].cash>=2500+need)
        .sort((a,b)=>state.owners[b].cash-state.owners[a].cash || a.localeCompare(b));
      const lender=candidates[0];
      if(!lender){this.stats.unfunded++;continue;}
      if(owner==='npc1' && state.tick===130620) this.trace.push({kind:'loan',tick:state.tick,lender,owner,amount:need,lenderBefore:state.owners[lender].cash,ownerBefore:state.owners[owner].cash,lenderAfter:state.owners[lender].cash-need,ownerAfter:state.owners[owner].cash+need});
      state.owners[lender].cash-=need;
      state.owners[owner].cash+=need;
      state.b6eContracts ||= {};
      state.b6eContracts[owner]={lender,principal:need,outstanding:need,issued:state.tick,
        repaid:0,delivered:0,firstDelivery:null};
      this.stats.loans++;this.stats.lent+=need;
      // Keine Waren-/Geldschöpfung; Darlehen als Vermögensforderung getrennt
      // von Betriebsertrag und Handelsgewinnen. Save/Load nur im Experiment.
    }
  }
  trade(state,ship,ware,quantity,kauf){
    if(kauf||ship.klasse!=='frachter'||!['npc1','npc2'].includes(ship.owner)||
      ['miner','frachter','jaeger','bauschiff'].includes(ware))return;
    const c=state.b6eContracts?.[ship.owner];if(!c)return;
    c.delivered++;c.firstDelivery??=state.tick;
  }
  after(state,rules){
    if(state.tick%60!==0)return;
    for(const owner of ['npc1','npc2']){
      const c=state.b6eContracts?.[owner];if(!c||c.outstanding<=0||c.delivered===0)continue;
      // Nur Erloese aus bereits erfolgten echten Lieferungen erlauben Tilgung;
      // mindestens 750 ISK beim Schuldner, kein Negativkonto, 1/4 der freien Kasse.
      const cash=state.owners[owner].cash;
      const due=Math.min(c.outstanding,Math.max(0,cash-750),Math.floor(cash/4));
      if(owner==='npc1' && state.tick>=130620 && state.tick<=132360) this.trace.push({kind:'repaymentCheck',tick:state.tick,owner,cash,outstanding:c.outstanding,reserve:750,due,delivered:c.delivered});
      if(due<=0)continue;
      state.owners[owner].cash-=due;state.owners[c.lender].cash+=due;
      c.outstanding-=due;c.repaid+=due;
      this.stats.repayments++;this.stats.repaid+=due;
    }
  }
}
function m_corePreis(state,werft,rules){
  const basis=m_data_economy_price(state,werft,rules);
  return basis;
}
function m_data_economy_price(state,station,rules){
  const idx=state.__b6e_priceHack;
  if(idx)throw Error('Anomalie');
  // Exakter Produktpreis + Gebuehr wird über den eingefrorenen Core-Index erzeugt.
  return m_coreIndexer.preis(state,station,'frachter',rules)+
    m_coreIndexer.gebuehr(state,rules,station,m_coreIndexer.preis(state,station,'frachter',rules));
}
let m_coreIndexer=null;
const probeMain=new Probe(),probeReplay=new Probe();
const plain=engine(src,null,probeReplay);
m_coreIndexer=plain.c;
assert.equal(plain.r.rulesVersion,14);
const watcher=new class {
  constructor() {this.owners={};this.ship={};this.closeouts=[];this.lossEvents=[];this.hulls=[];this.traderSales=0;this.pauses={frachter:0,miner:0};}
  pause(owner,klasse){this.pauses[klasse]++;}
  owner(id) {
    return this.owners[id] ||= {buys:0,buyValue:0,buyFees:0,sells:0,sellValue:0,sellFees:0,
      operatingDue:0,operatingPaid:0,unpaidHours:0,firstUnpaidTick:null,losses:0,activated:0,
      completedLots:0,postSalePurchases:0,positiveNetAfterWork:0,negativeNetAfterWork:0};
  }
  shiprow(s) {
    return this.ship[s.id] ||= {id:s.id,owner:s.owner,klasse:s.klasse,buys:0,sells:0,
      buyValue:0,sellValue:0,buyFees:0,sellFees:0,due:0,paid:0,open:{},
      afterSale:false,postSalePurchases:0};
  }
  trade(state,s,station,ware,menge,kauf,wert,fee) {
    if (!['npc1','npc2','npc3'].includes(s.owner) || s.klasse!=='frachter' ||
        ['miner','frachter','jaeger','bauschiff'].includes(ware)) return;
    const o=this.owner(s.owner),r=this.shiprow(s);
    if(!kauf && state.owners[s.owner].kind==='trader')this.traderSales++;
    if(kauf) {
      o.buys++;o.buyValue+=wert;o.buyFees+=fee;
      r.buys++;r.buyValue+=wert;r.buyFees+=fee;
      if(r.afterSale){r.postSalePurchases++;o.postSalePurchases++;r.afterSale=false;}
      const lot=r.open[ware] ||= {units:0,cost:0,sales:0,revenue:0,due:0,paid:0,firstTick:state.tick};
      lot.units+=menge;lot.cost+=wert+fee;
    } else {
      o.sells++;o.sellValue+=wert;o.sellFees+=fee;
      r.sells++;r.sellValue+=wert;r.sellFees+=fee;
      r.afterSale=true;
      const lot=r.open[ware];
      if(lot){
        // Teilverkaeufe koennen unterschiedliche Preise haben; bei vollstaendigem
        // Abverkauf ist die zugeordnete reale Geld-/Arbeitsbilanz nachvollziehbar.
        lot.units-=menge;lot.sales++;lot.revenue+=wert-fee;
        if(lot.units<=0){
          const net=lot.revenue-lot.cost-lot.due;
          this.closeouts.push({owner:s.owner,ship:s.id,ware,start:lot.firstTick,
            end:state.tick,purchaseCash:lot.cost,saleCash:lot.revenue,
            dueWork:lot.due,paidWork:lot.paid,netAfterDue:net});
          o.completedLots++;
          if(net>=0)o.positiveNetAfterWork++;else o.negativeNetAfterWork++;
          delete r.open[ware];
        }
      }
    }
  }
  cost(state,s,due,paid){
    if(!['npc1','npc2','npc3'].includes(s.owner))return;
    const o=this.owner(s.owner);
    o.operatingDue+=due;o.operatingPaid+=paid;
    if(due>paid){o.unpaidHours++;o.firstUnpaidTick??=state.tick;}
    if(s.klasse==='frachter'){
      const r=this.shiprow(s);r.due+=due;r.paid+=paid;
      for(const lot of Object.values(r.open)){lot.due+=due;lot.paid+=paid;}
    }
  }
  lost(state,s){
    if(!['npc1','npc2','npc3'].includes(s.owner))return;
    this.owner(s.owner).losses++;
    this.lossEvents.push({tick:state.tick,owner:s.owner,ship:s.id,klasse:s.klasse,cargo:{...s.ladung}});
    delete this.ship[s.id];
  }
  hull(state,s,x,price){
    if(!['npc1','npc2','npc3'].includes(s.owner))return;
    this.owner(s.owner).activated++;
    this.hulls.push({tick:state.tick,owner:s.owner,ship:s.id,klasse:x.klasse,
      priceIncludingFee:price,ownerCash:state.owners[s.owner].cash});
  }
}();

const WINDOW_FIRST=130620, WINDOW_LAST=132360;
const focused=(state,s)=>s?.id==='sh112' && s.owner==='npc1' && state.tick>=WINDOW_FIRST && state.tick<=WINDOW_LAST;
watcher.trace=[]; watcher.pendingTrades={}; watcher.pendingCosts={}; watcher.beforeLoss={};
watcher.preTrade=function(state,rules,s,station,ware,menge,kauf,wert,fee){
  if(!focused(state,s))return;
  assert(!this.pendingTrades[s.id],'kein verschachtelter Warenhandel');
  const st=state.stations[station],fonds=rules.world.systems[st.system].fonds;
  const recipient=st.eigentum?station:fonds;
  this.pendingTrades[s.id]={kind:'trade',tick:state.tick,ship:s.id,owner:s.owner,station,
    direction:kauf?'buy':'sell',ware,menge,wert,fee,recipient,
    shipCashBefore:state.owners[s.owner].cash,stationCashBefore:state.owners[station].cash,
    recipientCashBefore:state.owners[recipient].cash,
    stationStockBefore:st.lager[ware]||0,shipCargoBefore:s.ladung[ware]||0,
    phase:s.phase,system:s.system,arrival:s.ankunft,routeTarget:s.ziel};
};
watcher.postTrade=function(state,s){
  const e=this.pendingTrades[s.id];
  if(!e)return;
  assert.equal(e.tick,state.tick);
  e.shipCashAfter=state.owners[s.owner].cash;
  e.stationCashAfter=state.owners[e.station].cash;
  e.recipientCashAfter=state.owners[e.recipient].cash;
  e.stationStockAfter=state.stations[e.station].lager[e.ware]||0;
  e.shipCargoAfter=s.ladung[e.ware]||0;
  const delta=e.direction==='buy'?-(e.wert+e.fee):e.wert-e.fee;
  assert.equal(e.shipCashAfter-e.shipCashBefore,delta,'Frachter-Cash pro Transaktion');
  assert.equal(e.stationStockAfter-e.stationStockBefore,e.direction==='buy'?-e.menge:e.menge,'Stations-Lager pro Transaktion');
  assert.equal(e.shipCargoAfter-e.shipCargoBefore,e.direction==='buy'?e.menge:-e.menge,'Fracht pro Transaktion');
  this.trace.push(e); delete this.pendingTrades[s.id];
};
watcher.costBefore=function(state,s,due,paid,minutes,system){
  if(!focused(state,s))return;
  const e={kind:'work',tick:state.tick,ship:s.id,owner:s.owner,minutes,due,paid,
    unpaid:due-paid,system,phase:s.phase,routeTarget:s.ziel,
    shipCashBefore:state.owners[s.owner].cash};
  if(paid===0){e.shipCashAfter=state.owners[s.owner].cash;this.trace.push(e);return;}
  assert(!this.pendingCosts[s.id],'kein zweiter Kostenabschluss');
  this.pendingCosts[s.id]=e;
};
watcher.costAfter=function(state,s){
  const e=this.pendingCosts[s.id];
  if(!e)return;
  e.shipCashAfter=state.owners[s.owner].cash;
  assert.equal(e.shipCashBefore-e.shipCashAfter,e.paid,'Betriebszahlung');
  this.trace.push(e); delete this.pendingCosts[s.id];
};
watcher.preLoss=function(state,rules,s){
  if(!focused(state,s))return;
  const werft=rules.world.werft,p=plain.c.preis(state,werft,'frachter',rules);
  const pirateMarket=rules.world.piraten.markt, pirateOwner=rules.world.piraten.owner;
  const pirateStockBefore=Object.fromEntries(Object.keys(s.ladung).map(w=>[w,state.stations[pirateMarket].lager[w]||0]));
  const consumedBefore=Object.fromEntries(Object.keys(s.ladung).map(w=>[w,state.ledger[w].consumed]));
  const fee=plain.c.gebuehr(state,rules,werft,p);
  const e={kind:'preLoss',tick:state.tick,ship:s.id,owner:s.owner,system:s.system,
    cargoBeforePirate:{...s.ladung},cashBefore:state.owners[s.owner].cash,
    creditOutstanding:state.b6eContracts?.[s.owner]?.outstanding??null,
    replacementHullInventory:state.stations[werft].lager.frachter||0,
    replacementPriceIncludingFee:p+fee,werft,pirateMarket,pirateOwner,pirateStockBefore,consumedBefore,
    pirateMarketCashBefore:state.owners[pirateMarket].cash,pirateOwnerCashBefore:state.owners[pirateOwner].cash};
  this.beforeLoss[s.id]=e;
  this.trace.push(e);
};
watcher.postLoss=function(state,rules,s){
  if(!focused(state,s))return;
  const pre=this.beforeLoss[s.id]; assert(pre,'Verlustbeobachtung vor Zerstoerung fehlt');
  const disposition=Object.fromEntries(Object.keys(pre.cargoBeforePirate).map(w=>[w,{
    before:pre.cargoBeforePirate[w],
    transferredToPirateMarket:(state.stations[pre.pirateMarket].lager[w]||0)-pre.pirateStockBefore[w],
    consumed:state.ledger[w].consumed-pre.consumedBefore[w]}]));
  for(const x of Object.values(disposition)) assert.equal(x.transferredToPirateMarket+x.consumed,x.before,'Geld-/Warenverlusttrennung');
  this.trace.push({kind:'postPirateBeforeDeletion',tick:state.tick,ship:s.id,
    cargoAfterPirate:{...s.ladung},ownerCash:state.owners[s.owner].cash,disposition,
    pirateMarketCashAfter:state.owners[pre.pirateMarket].cash,
    pirateOwnerCashAfter:state.owners[pre.pirateOwner].cash});
};
watcher.hour=function(state,rules){
  if(state.tick%60!==0 || state.tick<WINDOW_FIRST || state.tick>WINDOW_LAST)return;
  const ship=state.ships.sh112;
  this.trace.push({kind:'hour',tick:state.tick,shipAlive:Boolean(ship),
    ownerCash:state.owners.npc1.cash,lenderCash:state.owners.st_meridian.cash,
    remainingCredit:state.b6eContracts?.npc1?.outstanding??0,
    ...(!ship?{}:{ship:ship.id,phase:ship.phase,system:ship.system,
      routeTarget:ship.ziel,arrival:ship.ankunft,auftrag:ship.auftrag,
      cargo:{...ship.ladung},warten:ship.warten})});
};

const observed=engine(instrument(src),watcher,probeMain);
assert.equal(observed.r.rulesVersion,14);

let state, replay, expected=[];
let expectedGolden=null, initialLegacyHash=null;
if(scenario){
  const b1=JSON.parse(fs.readFileSync(path.join(opt('b1','/tmp/b6-b1'),
    'docs/data/b1-handelszyklus-v12.json'),'utf8')).cases.find(x=>x.scenario===scenario);
  assert(b1&&b1.seed===CASES[scenario]&&b1.start.tick===129600);
  const save=JSON.parse(fs.readFileSync(path.join(opt('starts','/tmp/b6-start'),
    'start-'+scenario+'-'+seed+'.json'),'utf8')).save;
  const legacyHtml=fs.readFileSync(path.join(opt('legacy','/tmp/b6-legacy'),'index.html'),'utf8');
  const legacy=engine(coreSource(legacyHtml),null);
  assert.equal(legacy.r.rulesVersion,12);
  initialLegacyHash=legacy.c.hash(legacy.c.load(save));
  assert.equal(initialLegacyHash,b1.start.hash,'echter historischer B1-Startzustand');
  state=observed.c.load(save,undefined,observed.r);
  replay=plain.c.load(save,undefined,plain.r);
  expected=b1.active.commands.map(x=>({tick:x.tick,cmd:x.cmd}));
}else{
  const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-priority-v12.json',import.meta.url),'utf8'));
  expectedGolden=fixture.results.find(x=>x.seed===seed);
  assert(expectedGolden,'historische Referenz fehlt');
  state=observed.c.createState(seed,observed.r);
  replay=plain.c.createState(seed,plain.r);
}
const initialHash=plain.c.hash(replay);
assert.equal(observed.c.hash(state),initialHash);
let cursor=0,hours=0,roundtrips=0;
const days=scenario?275:90,dayHashes=[],daily=[];
function audit(s){
  assert(plain.c.audit(s).ok,'Produkt-Geld-/Warenaudit');
  const cash=sum(Object.values(s.owners).map(o=>{assert(Number.isSafeInteger(o.cash)&&o.cash>=0);return o.cash;}));
  assert.equal(cash,s.initialSupply+s.minted-s.burned,'unabhaengiger Geldaudit');
  for(const [w,l] of Object.entries(s.ledger)){
    const inventory=sum(Object.values(s.stations).map(st=>st.lager[w]||0))+
      sum(Object.values(s.ships).map(sh=>sh.ladung[w]||0));
    assert.equal(inventory,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'Warenaudit '+w);
  }
}
function snapshot(s){
  const npc={};
  for(const id of ['npc1','npc2','npc3']){
    const ss=Object.values(s.ships).filter(x=>x.owner===id);
    npc[id]={cash:s.owners[id].cash,miners:ss.filter(x=>x.klasse==='miner').length,
      freighters:ss.filter(x=>x.klasse==='frachter').length};
  }
  const shortage=sum(Object.values(s.stats.mangel).flatMap(x=>Object.values(x)));
  const recipes=sum(Object.values(s.stats.rezepte));
  const aldr=s.stations.st_aldera.lager;
  return {day:Math.round(s.tick/1440),npc,shortage,recipes,siliconAldera:aldr.silizium||0,
    partsAldera:aldr.bauteil||0,minted:s.minted,burned:s.burned,hash:plain.c.hash(s)};
}
for(let minute=1;minute<=days*1440;minute++){
  while(expected[cursor]?.tick===state.tick+1){
    const cmd=expected[cursor++].cmd;
    const a=observed.c.submit(state,cmd,observed.r),b=plain.c.submit(replay,cmd,plain.r);
    assert(a.ok&&b.ok,'B1-Befehl abgelehnt: '+JSON.stringify({cmd,a,b}));
  }
  const a=observed.c.step(state,observed.r),b=plain.c.step(replay,plain.r);
  assert.deepEqual(a,b,'Queue-Ergebnisse identisch');
  if(state.tick%60===0){
    audit(state);audit(replay);
    assert.equal(observed.c.hash(state),plain.c.hash(replay),'stundenweiser unveraenderter Hash');
    hours++;
  }
  if(state.tick%1440===0){
    const x=snapshot(state);daily.push(x);dayHashes.push(x.hash);
    const day=minute/1440;
    if([1,3,7,30,60,90,180,275].includes(day)){
      const save=observed.c.save(state);
      assert.equal(observed.c.hash(observed.c.load(save,undefined,observed.r)),
        observed.c.hash(state),'Save/Load unveraendert');
      const replaySave=plain.c.save(replay);
      replay=plain.c.load(replaySave,undefined,plain.r);
      assert.equal(plain.c.hash(replay),x.hash,'Replay-Save/Load');
      roundtrips+=2;
    }
  }
}
assert.equal(cursor,expected.length,'B1-Befehle vollstaendig');
assert.equal(hours,days*24);
if(!scenario && mode==='control'){
  assert.equal(daily.at(-1).shortage,expectedGolden.totalShortage,'unveraenderte Mangel-Goldenwerte');
}
assert.deepEqual(probeMain.stats,probeReplay.stats,'Darlehens-/Tilgungsprotokoll muss im Replay identisch sein');
assert.deepEqual(state.b6eContracts||{},replay.b6eContracts||{},'Darlehensbuch bei Replay gleich');
const traderSales=watcher.traderSales;
if(!scenario && mode==='control')assert.equal(traderSales,expectedGolden.traderSales,'unveraenderte Frachterverkaufs-Goldenwerte');
if(mode==='credit'){
  const o=watcher.owners.npc1;
  assert(o,'NPC1-B6e-Lieferungen erwartet');
  for(const [name,value] of Object.entries({buys:44,buyValue:4667,buyFees:81,sells:49,sellValue:6415,sellFees:153,operatingDue:7000,operatingPaid:2114,losses:1,activated:1})) assert.equal(o[name],value,'Original-JSON NPC1: '+name);
  const trade=watcher.trace.filter(x=>x.kind==='trade' && x.ware!=='frachter');
  assert.equal(trade.filter(x=>x.direction==='buy').length,44,'alle realen Warenkaeufe');
  assert.equal(trade.filter(x=>x.direction==='sell').length,49,'alle realen Warenverkaeufe');
  assert.equal(watcher.trace.filter(x=>x.kind==='work').reduce((s,e)=>s+e.due,0),7000,'vollstaendige Faelligkeit');
  assert.equal(watcher.trace.filter(x=>x.kind==='work').reduce((s,e)=>s+e.paid,0),2114,'bezahlte Arbeit');
  assert.equal(watcher.trace.filter(x=>x.kind==='preLoss' && x.ship==='sh112').length,1,'ein Verlust vor Piratenuebergabe');
  assert.equal(probeMain.trace.filter(x=>x.kind==='loan').length,1,'ein echter Kredit');
}
assert.equal(Object.keys(watcher.pendingTrades).length,0,'keine offene Handelsbeobachtung');
assert.equal(Object.keys(watcher.pendingCosts).length,0,'keine offene Arbeitsbeobachtung');
const totals={scenario:scenario||'standard',seed,mode,version:14,sourceSha256:sha(original),variantSha256:sha(src),pauses:watcher.pauses,
  credit:probeMain.stats,contracts:state.b6eContracts||{},
  initialHash,initialLegacyHash,days,hours,roundtrips,commands:cursor,
  paid:sum(Object.values(watcher.owners).map(x=>x.operatingPaid)),
  due:sum(Object.values(watcher.owners).map(x=>x.operatingDue)),
  unpaid:sum(Object.values(watcher.owners).map(x=>x.operatingDue-x.operatingPaid)),
  traderSales,closeouts:watcher.closeouts.length,
  followUpPurchases:sum(Object.values(watcher.owners).map(x=>x.postSalePurchases)),
  originalFreighterAlive:scenario?Boolean(state.ships[expected.find(x=>x.cmd.type==='shipHandeln')?.cmd.schiff]):null,
  final:daily.at(-1),owners:watcher.owners,hulls:watcher.hulls,losses:watcher.lossEvents,
  closeoutSamples:watcher.closeouts.slice(0,30),daily,
  b6fTrace:watcher.trace,b6fLoanTrace:probeMain.trace,
  b6fScope:{ship:'sh112',first:WINDOW_FIRST,last:WINDOW_LAST,originalB6eHead:'0113eb974d8a2e9fbc7f20f0f662730a91b17af7'}};
const out=opt('out','/tmp/b6f-results');
fs.mkdirSync(out,{recursive:true});
const file=path.join(out,'b6f-'+(scenario||'standard')+'-'+seed+'-'+mode+'.json');
fs.writeFileSync(file,JSON.stringify(totals,null,2)+'\n');
console.log('B6F_P1_EVENTTRACE_PASS '+JSON.stringify({scenario:totals.scenario,seed,mode,days,credit:totals.credit,contracts:totals.contracts,
  hourlyHashes:hours,dailyHashes:dayHashes.length,roundtrips,pauses:watcher.pauses,
  tradeSales:traderSales,paid:totals.paid,due:totals.due,unpaid:totals.unpaid,
  followUpPurchases:totals.followUpPurchases,
  endCash:totals.final.npc,shortage:totals.final.shortage}));
