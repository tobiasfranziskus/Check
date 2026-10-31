// B6c: statischer Kapital-/Warenpfad nach realem Regel-14-Kern, ohne jede Produktregel-Aenderung.
// Momentaufnahmen sind KEIN vorweg simulierter Handelszyklus.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(seed|case|starts|b1|legacy|out)=/.test(x)),'unbekannter Parameter');
const scenario=opt('case',null), seed=scenario?{miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario]:Number(opt('seed','42'));
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
const src=coreSource(html);
const instrument=(code)=>{
  let s=code;
  const hook=(needle,insert)=>{
    assert.equal(s.split(needle).length,2,'genau ein Hook: '+needle);
    s=s.replace(needle,needle+'\n'+insert);
  };
  hook("buche(state, schiff.owner, 'kosten', fee);",
    'watch.trade(state,schiff,station,ware,menge,kauf,wert,fee);');
  hook('const n = Math.min(besitzer.cash, kosten);',
    'watch.cost(state,s,kosten,n);');
  hook('function entfernen(state, rules, s) {',
    'watch.lost(state,s);');
  hook('state.ledger[x.klasse].consumed += 1;',
    'watch.hull(state,s,x,bedarf);');
  return s;
};
function engine(code,watch) {
  return new Function('watch',code+';return {c:m_core_index,r:m_data_rules.RULES};')(watch);
}
const plain=engine(src,null);
assert.equal(plain.r.rulesVersion,14);
const watcher=new class {
  constructor() {this.owners={};this.ship={};this.closeouts=[];this.lossEvents=[];this.hulls=[];this.traderSales=0;}
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
const observed=engine(instrument(src),watcher);
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

const OWNERS=['npc1','npc2'], YARD=observed.r.world.werft;
const scanTimes=new Set(scenario?[0,1,30,90,180,275]:[1,30,90]);
const scans=[];
const ce=(a,b)=>Math.ceil(a*b/observed.r.economy.stunde);
const ids=x=>Object.keys(x).sort();
const sumCash=(s,pred)=>Object.values(s.owners).filter(pred).reduce((n,x)=>n+x.cash,0);
function inspect(state) {
  const r=observed.r,w=r.world,c=plain.c;
  const stationIds=ids(w.stations),ownerCash=Object.fromEntries(ids(state.owners).map(id=>[id,state.owners[id].cash]));
  const hullInYard=state.stations[YARD].lager.frachter||0;
  const hullPrice=c.preis(state,YARD,'frachter',r);
  const hullPurchase=hullPrice+c.gebuehr(state,r,YARD,hullPrice);
  const registry=Object.fromEntries(OWNERS.map(owner=>{
    const planned=(state.sollflotte[owner]||[]).filter(x=>x.klasse==='frachter').length;
    const owned=Object.values(state.ships).filter(x=>x.owner===owner);
    const ships=owned.filter(x=>x.klasse==='frachter');
    const free=ships.filter(x=>Object.values(x.ladung).reduce((a,b)=>a+b,0)===0);
    const earliest=free.map(s=>({id:s.id,phase:s.phase,loc:s.phase==='reise'?w.stations[s.ziel].system:s.system,remainingTravel:s.phase==='reise'?s.ankunft-state.tick:0}));
    const empty=owned.length===0;
    const yardFund=state.owners[w.systems[w.stations[YARD].system].fonds].cash;
    const subsidyPossible=empty&&yardFund>=Math.max(0,hullPurchase-state.owners[owner].cash)
      ?Math.max(0,hullPurchase-state.owners[owner].cash):0;
    const viableHull=free.length>0||(planned>ships.length&&hullInYard>0);
    let edges=0,marketEdges=0,positiveMargins=0,profitAfterWork=0,
        affordable=0,staticTwoLegs=0;
    const legs=[],stocks=Object.fromEntries(stationIds.map(x=>[x,0]));
    for(const from of stationIds)for(const to of stationIds){
      if(from===to)continue;
      const route=c.route(w,w.stations[from].system,w.stations[to].system);
      if(!route||route.zeit<=0)continue;
      edges++;
      for(const ware of ids(w.stations[from].ziel)){
        const supply=c.verkaufbar(state,r,from,ware);
        if(supply<=0)continue;
        stocks[from]+=supply;
        const pBuy=c.preis(state,from,ware,r), pSell=c.preis(state,to,ware,r);
        if(!pSell||pSell<=pBuy||!(w.stations[to].ziel[ware]>0))continue;
        marketEdges++;
        const destLimit=c.aufnehmbar(state,r,to,ware);
        const maxQ=Math.min(r.economy.cargo,supply,destLimit);
        if(maxQ<1)continue;
        const travelCost=ce(w.betriebskosten.frachter,route.zeit);
        // Es sind die gleichen realen Marktfunktionen wie im Core. Nachfolgende
        // Preis-/Kassenbewegungen bleiben bewusst ungepruefte Momentaufnahmen.
        const ferryCosts=earliest.map(x=>{
          const routeToSource=c.route(w,x.loc,w.stations[from].system);
          return routeToSource?{ship:x.id,phase:x.phase,remainingTravel:x.remainingTravel,
            work:ce(w.betriebskosten.frachter,routeToSource.zeit),minutes:routeToSource.zeit}:null;
        }).filter(Boolean);
        let ferry=Math.min(...ferryCosts.map(x=>x.work));
        let asset='owned';
        if(!Number.isFinite(ferry)){
          asset='replacement';
          if(hullInYard===0||ships.length>=planned)continue;
          const y=c.route(w,w.stations[YARD].system,w.stations[from].system);
          if(!y)continue;
          ferry=ce(w.betriebskosten.frachter,y.zeit);
        }
        for(let quantity=1;quantity<=maxQ;quantity++){
          const buy=quantity*pBuy+c.gebuehr(state,r,from,quantity*pBuy);
          const sell=quantity*pSell-c.gebuehr(state,r,to,quantity*pSell);
          const margin=sell-buy,net=margin-travelCost;
          if(margin<=0)continue;
          positiveMargins++;
          if(net<=0)continue;
          profitAfterWork++;
          const fixed=asset==='replacement'?hullPurchase:0;
          const upfront=fixed+ferry+buy+travelCost;
          const lack=Math.max(0,upfront-state.owners[owner].cash);
          if(!lack)affordable++;
          legs.push({from,to,ware,quantity,minutes:route.zeit,
            buy,sell,margin,travelCost,net,ferry,fixed,asset,upfront,lack});
        }
      }
    }
    const ranked=legs.sort((a,b)=>a.lack-b.lack||b.net-a.net||a.upfront-b.upfront||
      a.from.localeCompare(b.from)||a.to.localeCompare(b.to)||a.ware.localeCompare(b.ware));
    const byFrom={};for(const x of ranked){const a=byFrom[x.from]||=[];if(a.length<100)a.push(x);}
    let bestTwo=null;
    // Statischer Untergrenzen-Test fuer zwei aufeinanderfolgende gute Ladungen.
    // Nach erstem Verkauf ist zweiter Einkauf am Ankunftsort moeglich;
    // Marktpreise und Kassen werden NICHT als echte Transaktionen fortgeschrieben.
    for(const first of ranked.slice(0,100))for(const second of (byFrom[first.to]||[]).slice(0,50)){
      const requirement=Math.max(first.upfront,first.upfront+second.buy+second.travelCost-first.sell);
      const lack=Math.max(0,requirement-state.owners[owner].cash);
      const candidate={from:first.from,via:first.to,to:second.to,ware:first.ware,
        nextWare:second.ware,firstQuantity:first.quantity,secondQuantity:second.quantity,
        firstNet:first.net,secondNet:second.net,
        firstUpfront:first.upfront,afterFirstCashAtRequired:requirement-first.upfront+first.sell,
        requirement,lack};
      staticTwoLegs++;
      if(!bestTwo||lack<bestTwo.lack||lack===bestTwo.lack&&
        candidate.requirement<bestTwo.requirement)bestTwo=candidate;
    }
    return [owner,{
      cash:state.owners[owner].cash,
      allShips:owned.length,plannedFreighters:planned,freighters:ships.length,
      freeHullCount:free.length,emptyOwner:empty,
      freeLocations:earliest,missingFreighters:Math.max(0,planned-ships.length),
      hullInYard,hullPurchase,subsidyPossible,viableHull,
      routeOptions:edges,sourceTargetPairs:marketEdges,
      positiveMargins,profitableOptions:profitAfterWork,affordableOptions:affordable,
      staticTwoLegOptions:staticTwoLegs,
      bestOne:ranked[0]||null,bestTwo
    }];
  }));
  const shipCargo=Object.values(state.ships)
    .reduce((out,s)=>{if(s.klasse==='frachter')for(const [ware,n] of Object.entries(s.ladung))out[ware]=(out[ware]||0)+n;return out;},{});
  const wanted=['silizium','bauteil','frachter','material','erz','eis'];
  return {minute:state.tick,day:Math.round(state.tick/1440),hash:c.hash(state),
    ownerCash,
    cashGroups:{
      player:state.owners[r.economy.start.owner].cash,
      npcTraders:state.owners.npc1.cash+state.owners.npc2.cash,
      npcMiner:state.owners.npc3.cash,
      stations:sumCash(state,o=>o.kind==='station'),
      funds:sumCash(state,o=>o.kind==='fund'),
      pirates:sumCash(state,o=>o.kind==='pirate'),
      authority:sumCash(state,o=>o.kind==='authority'),
    },
    hullInYard,hullPurchase,shipCargo,
    stationStatus:Object.fromEntries(stationIds.map(id=>[id,{
      system:w.stations[id].system,cash:state.owners[id].cash,
      inventory:Object.fromEntries(wanted.map(x=>[x,state.stations[id].lager[x]||0])),
      sellable:Object.fromEntries(wanted.map(x=>[x,c.verkaufbar(state,r,id,x)])),
      buyable:Object.fromEntries(wanted.map(x=>[x,c.aufnehmbar(state,r,id,x)])),
    }])),
    registry,
    alderaMissing:{silizium:Math.max(0,w.stations.st_aldera.ziel.silizium-(state.stations.st_aldera.lager.silizium||0)),
      bauteil:Math.max(0,w.stations.st_aldera.ziel.bauteil-(state.stations.st_aldera.lager.bauteil||0))}
  };
}
scans.push(inspect(state));

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
    if(scanTimes.has(minute/1440))scans.push(inspect(state));
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
if(!scenario){
  assert.equal(daily.at(-1).shortage,expectedGolden.totalShortage,'unveraenderte Mangel-Goldenwerte');
}
const traderSales=watcher.traderSales;
if(!scenario)assert.equal(traderSales,expectedGolden.traderSales,'unveraenderte Frachterverkaufs-Goldenwerte');
const totals={scenario:scenario||'standard',seed,version:14,sourceSha256:sha(src),
  initialHash,initialLegacyHash,days,hours,roundtrips,commands:cursor,
  paid:sum(Object.values(watcher.owners).map(x=>x.operatingPaid)),
  due:sum(Object.values(watcher.owners).map(x=>x.operatingDue)),
  unpaid:sum(Object.values(watcher.owners).map(x=>x.operatingDue-x.operatingPaid)),
  traderSales,closeouts:watcher.closeouts.length,
  followUpPurchases:sum(Object.values(watcher.owners).map(x=>x.postSalePurchases)),
  originalFreighterAlive:scenario?Boolean(state.ships[expected.find(x=>x.cmd.type==='shipHandeln')?.cmd.schiff]):null,
  final:daily.at(-1),owners:watcher.owners,hulls:watcher.hulls,losses:watcher.lossEvents,
  closeoutSamples:watcher.closeouts.slice(0,30),daily,scans};
const out=opt('out','/tmp/b6c-results');
fs.mkdirSync(out,{recursive:true});
const file=path.join(out,(scenario||'standard')+'-'+seed+'.json');
fs.writeFileSync(file,JSON.stringify(totals,null,2)+'\n');
console.log('B6C_AUDIT_PASS '+JSON.stringify({scenario:totals.scenario,seed,days,
  hourlyHashes:hours,dailyHashes:dayHashes.length,roundtrips,
  tradeSales:traderSales,paid:totals.paid,due:totals.due,unpaid:totals.unpaid,
  followUpPurchases:totals.followUpPurchases,
  endCash:totals.final.npc,shortage:totals.final.shortage,
  checkpoints:scans.map(x=>({day:x.day,hash:x.hash,npc1:x.registry.npc1.bestOne?.lack??null,
  npc2:x.registry.npc2.bestOne?.lack??null,hull:x.hullInYard}))}));
