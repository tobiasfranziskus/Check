// B6b-P1: isolierter Vorfinanzierungs-Gegenversuch gegen unveraenderte Regel 14.
// Nur Analyse-Quelltransformation, KEINE Produktregel und kein zweiter Simulationskern.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(seed|case|starts|b1|legacy|out|mode)=/.test(x)),'unbekannter Parameter');
const mode=opt('mode','control');
assert(['control','p1'].includes(mode),'nur Kontrollkern oder P1');
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
const original=coreSource(html);
function p1Source(code) {
  let s=code;
  const flight="if (!r || r.zeit <= 0) return false;\n  if (ware !== null) {";
  assert.equal(s.split(flight).length,2,'P1 Abfluganker');
  s=s.replace(flight,`if (!r || r.zeit <= 0) return false;
  // B6b-P1: NPC-Frachter nur starten, wenn Ladung plus planmaessige Reise-Arbeit
  // bereits vom Eigentuemer real finanzierbar waeren. Kein reserviertes Geld und
  // keine Garantie gegen konkurrierende Ausgaben waehrend des laufenden Fluges.
  if (['npc1','npc2','npc3'].includes(s.owner)) {
    const fahrkosten = Math.ceil((w.betriebskosten.frachter || 0) * r.zeit / rules.economy.stunde);
    const p = ware === null ? 0 : preis(state, station, ware, rules);
    const fracht = Object.values(s.ladung).reduce((a,b)=>a+b,0);
    const m = ware === null ? 0 : Math.min(menge, rules.economy.cargo - fracht,
      verkaufbar(state, rules, station, ware),
      bezahlbar(rules, station, state.owners[s.owner].cash, p));
    const zahlung = m > 0 ? m*p + gebuehr(state, rules, station, m*p) : 0;
    if (state.owners[s.owner].cash < fahrkosten + zahlung) {
      if (watch?.pause) watch.pause(s.owner,'frachter');
      s.ankunft = state.tick + w.warteLeer;
      return false;
    }
  }
  if (ware !== null) {`);
  const mine="if (vorher < e.cargo) {\n      const station = stationIn(rules, s.system);";
  assert.equal(s.split(mine).length,2,'P1 Foerderanker');
  s=s.replace(mine,`if (vorher < e.cargo) {
      // Keine Arbeit neu beginnen, falls die vollstaendige naechste Stunde
      // Minerarbeit nicht aus vorhandener NPC-Kasse gedeckt werden koennte.
      if (['npc1','npc2','npc3'].includes(s.owner) &&
          state.owners[s.owner].cash < (rules.world.betriebskosten.miner || 0)) {
        if (watch?.pause) watch.pause(s.owner,'miner');
        continue;
      }
      const station = stationIn(rules, s.system);`);
  return s;
}
const src=mode==='p1'?p1Source(original):original;
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
const traderSales=watcher.traderSales;
if(!scenario && mode==='control')assert.equal(traderSales,expectedGolden.traderSales,'unveraenderte Frachterverkaufs-Goldenwerte');
const totals={scenario:scenario||'standard',seed,mode,version:14,sourceSha256:sha(original),variantSha256:sha(src),pauses:watcher.pauses,
  initialHash,initialLegacyHash,days,hours,roundtrips,commands:cursor,
  paid:sum(Object.values(watcher.owners).map(x=>x.operatingPaid)),
  due:sum(Object.values(watcher.owners).map(x=>x.operatingDue)),
  unpaid:sum(Object.values(watcher.owners).map(x=>x.operatingDue-x.operatingPaid)),
  traderSales,closeouts:watcher.closeouts.length,
  followUpPurchases:sum(Object.values(watcher.owners).map(x=>x.postSalePurchases)),
  originalFreighterAlive:scenario?Boolean(state.ships[expected.find(x=>x.cmd.type==='shipHandeln')?.cmd.schiff]):null,
  final:daily.at(-1),owners:watcher.owners,hulls:watcher.hulls,losses:watcher.lossEvents,
  closeoutSamples:watcher.closeouts.slice(0,30),daily};
const out=opt('out','/tmp/b6-results');
fs.mkdirSync(out,{recursive:true});
const file=path.join(out,(scenario||'standard')+'-'+seed+'-'+mode+'.json');
fs.writeFileSync(file,JSON.stringify(totals,null,2)+'\n');
console.log('B6B_P1_AUDIT_PASS '+JSON.stringify({scenario:totals.scenario,seed,mode,days,
  hourlyHashes:hours,dailyHashes:dayHashes.length,roundtrips,pauses:watcher.pauses,
  tradeSales:traderSales,paid:totals.paid,due:totals.due,unpaid:totals.unpaid,
  followUpPurchases:totals.followUpPurchases,
  endCash:totals.final.npc,shortage:totals.final.shortage}));
