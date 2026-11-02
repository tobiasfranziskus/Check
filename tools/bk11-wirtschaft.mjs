// B-K11: reale Core-Welten; Beobachter und testseitiger No-Rescue-Gegenlauf.
// Keine Produktions-/Lohn-/Material-/Nachfrageregel aus dem Analyse-Stack.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {independentAudit,SEEDS} from '../tests/helpers/bk11-audit.mjs';
const BASE='b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c';
const source=html=>html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const current=source(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const observerSha=sha(fs.readFileSync(new URL(import.meta.url)));
const sum=a=>a.reduce((s,n)=>s+n,0);
const args=process.argv.slice(2),opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(days|seed|suite|out|baseline|probe)=/.test(x)));
const probe=opt('probe','none');
assert(['none','arrival'].includes(probe));
const mainHtml=opt('baseline','')?fs.readFileSync(opt('baseline',''),'utf8'):
  execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8',maxBuffer:1e7});
const main=source(mainHtml);
assert.equal(sha(mainHtml),'7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5','gepinntes main-Original');
const days=Number(opt('days','90')),suite=opt('suite','all'),out=opt('out','/tmp/bk11-wirtschaft.json');
assert(Number.isSafeInteger(days)&&days>0&&days<=365);
assert(['all','standard','crises'].includes(suite));
const seeds=opt('seed','')?[Number(opt('seed',''))]:SEEDS;
assert(seeds.every(s=>SEEDS.includes(s)));
function engine(src,watch=null,noRescue=false,arrival=false) {
  const once=(a,b)=>{assert.equal(src.split(a).length,2,a);src=src.replace(a,b);};
  if(noRescue)once('if (leer) zuschuss(state, rules, owner, bedarf);','if (false) zuschuss(state, rules, owner, bedarf);');
  if(watch) {
    once("  buche(state, schiff.owner, 'kosten', fee);",
      "  buche(state, schiff.owner, 'kosten', fee); watch.trade(state,schiff,station,ware,menge,kauf,wert,fee);");
    once('    const n = Math.min(besitzer.cash, kosten);',
      '    const n = Math.min(besitzer.cash, kosten); watch.cost(s,kosten,n);');
    once('const s = state.ships[id]; const arbeit = s.arbeit; s.arbeit = 0;',
      'const s = state.ships[id]; const arbeit = s.arbeit; watch.work(s,arbeit,rules); s.arbeit = 0;');
    once('  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;',
      '  watch.rescue(owner,n); f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;');
    once('  delete state.ships[s.id];\n  delete state.stats.verkaeufe[s.id];',
      '  watch.loss(state,s); delete state.ships[s.id];\n  delete state.stats.verkaeufe[s.id];');
    once("      traeger.ladung[cmd.klasse] -= 1;",
      "      watch.activate(traeger,cmd.klasse); traeger.ladung[cmd.klasse] -= 1;");
    if(src.includes('const m_core_vertrag =')) {
      // B-K11a: reiner Beobachter, der Original-Core bleibt bitidentisch.
      once('function fahrtStart(state, rules, s, ziel, zeit) {\n  if (state.schema !== 9',
        'function fahrtStart(state, rules, s, ziel, zeit) {\n  if (s.phase === \'dock\' && (s.vertrag || s.arbeit !== 0)) watch.blocked(state,s,ziel,zeit,rules);\n  if (state.schema !== 9');
      once('  s.vertrag = id;\n  return true;',
        '  s.vertrag = id; watch.reserve(state,s,id);\n  return true;');
      once('  e.belege[beleg] = betrag;',
        '  e.belege[beleg] = betrag; watch.pay(state,e,beleg,betrag);');
      once("  e.status = 'geschlossen';",
        "  e.status = 'geschlossen'; watch.close(state,e);");
    }
  }
  if(arrival){
    // ISOLIERTE TEST-GEGENPROBE. Kein index.html-/Produktcode-Eingriff.
    // Ankunft: tatsächlich geleistete Flugminuten aus dem laufenden Escrow zahlen,
    // kumulierte Stundenrundung erhalten, dann Vertrag schließen.
    once("    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n    entladen(state, rules, s);",
      "    s.phase='dock'; s.ziel=null; s.ankunft=state.tick;\n    if (state.schema===9 && s.klasse==='frachter' && s.vertrag) {"
      +" const vorher=s.d1Bereits||0, arbeit=s.arbeit;"
      +" const tarif=rules.world.betriebskosten.frachter, stunde=rules.economy.stunde;"
      +" const betrag=Math.floor((vorher+arbeit)*tarif/stunde)-Math.floor(vorher*tarif/stunde);"
      +" if(watch)watch.work(s,arbeit,rules);"
      +" m_core_vertrag.fahrtStunde(state,rules,s,betrag,s.system);"
      +" s.d1Bereits=vorher+arbeit; s.arbeit=0; }"
      +"\n    entladen(state, rules, s);");
    const arbeitNeedle=watch
      ? 'const s = state.ships[id]; const arbeit = s.arbeit; watch.work(s,arbeit,rules); s.arbeit = 0;'
      : 'const s = state.ships[id]; const arbeit = s.arbeit; s.arbeit = 0;';
    once(arbeitNeedle,arbeitNeedle+
      " const d1Vorher = s.klasse==='frachter' && state.schema===9 ? s.d1Bereits||0 : 0;"
      +" if(s.klasse==='frachter' && state.schema===9) delete s.d1Bereits;");
    once('const kosten = div(anzahl(w.betriebskosten, s.klasse) * arbeit, rules.economy.stunde);',
      "const kosten = s.klasse==='frachter' && state.schema===9"
      +" ? div(anzahl(w.betriebskosten,s.klasse)*(d1Vorher+arbeit),rules.economy.stunde)"
      +" - div(anzahl(w.betriebskosten,s.klasse)*d1Vorher,rules.economy.stunde)"
      +" : div(anzahl(w.betriebskosten,s.klasse)*arbeit,rules.economy.stunde);");
    once('const kosten = Math.floor(rules.world.betriebskosten.frachter * s.arbeit / rules.economy.stunde);',
      'const d1Vorher=s.d1Bereits||0;'
      +' const kosten=Math.floor(rules.world.betriebskosten.frachter*(d1Vorher+s.arbeit)/rules.economy.stunde)'
      +'-Math.floor(rules.world.betriebskosten.frachter*d1Vorher/rules.economy.stunde);');
  }
  return new Function('watch',src+';return {c:m_core_index,r:m_data_rules.RULES};')(watch);
}
class Watch {
  constructor(){
    this.owners={};this.contracts={};this.events=[];this.maxEscrow=0;
    this.timing={blockedAttempts:0,blockedWithCash:0,blockedWithCargo:0,
      blockedWithCashAndCargo:0,lockedDockMinutes:0,lockedWithCargoMinutes:0,
      dockMinutes:0,byOwner:{}};
  }
  timingRow(owner){return this.timing.byOwner[owner]??={
    blockedAttempts:0,blockedWithCash:0,blockedWithCargo:0,
    blockedWithCashAndCargo:0,lockedDockMinutes:0,lockedWithCargoMinutes:0,dockMinutes:0};}
  blocked(state,sh,ziel,zeit,rules){
    if(!['npc1','npc2','house'].includes(sh.owner))return;
    // Eine versuchte Original-Fahrt, die allein wegen Restarbeit/offenem Vertrag
    // schon vor der Finanzpruefung abgewiesen wird. Kein Nachweis von Absatz.
    if(sh.phase!=='dock'||!Number.isSafeInteger(zeit)||zeit<=0||!rules.world.stations[ziel])return;
    const x=this.timing,row=this.timingRow(sh.owner);
    const cashOk=state.owners[sh.owner].cash >=
      Math.ceil(zeit*rules.world.betriebskosten.frachter/rules.economy.stunde);
    const loaded=Object.values(sh.ladung).some(n=>n>0);
    x.blockedAttempts++;row.blockedAttempts++;
    if(cashOk){x.blockedWithCash++;row.blockedWithCash++;}
    if(loaded){x.blockedWithCargo++;row.blockedWithCargo++;}
    if(cashOk&&loaded){x.blockedWithCashAndCargo++;row.blockedWithCashAndCargo++;}
  }
  sample(state,rules){
    if(rules.schema!==9)return;
    for(const sh of Object.values(state.ships)){
      if(sh.klasse!=='frachter'||sh.phase!=='dock'
        ||!['npc1','npc2','house'].includes(sh.owner))continue;
      const x=this.timing,row=this.timingRow(sh.owner);
      const loaded=Object.values(sh.ladung).some(n=>n>0);
      const locked=!!sh.vertrag||sh.arbeit!==0;
      x.dockMinutes++;row.dockMinutes++;
      if(locked){
        x.lockedDockMinutes++;row.lockedDockMinutes++;
        if(loaded){x.lockedWithCargoMinutes++;row.lockedWithCargoMinutes++;}
      }
    }
  }
  row(owner){return this.owners[owner]??=(
    {buys:0,sales:0,purchase:0,revenue:0,fees:0,hulls:0,hullCount:0,flightPaid:0,
      due:0,paid:0,rescue:0,soldBasis:0,lostBasis:0,activatedAssets:0,stock:{},losses:0});}
  trade(s,sh,station,ware,n,buy,value,fee){
    const r=this.row(sh.owner);
    this.events.push(['trade',s.tick,sh.id,station,ware,n,buy,value,fee]);
    if(buy&&ware===sh.klasse&&['miner','frachter'].includes(ware)) {
      r.hulls+=value+fee;r.hullCount++;return;
    }
    if(sh.klasse!=='frachter')return;
      r.fees+=fee;
      if(!buy)r.salesFees=(r.salesFees||0)+fee;
    const key=sh.id+'/'+ware,lots=r.stock[key]??=[];
    if(buy){r.buys++;r.purchase+=value;lots.push({n,unit:(value+fee)/n});}
    else {
      r.sales++;r.revenue+=value;let left=n;
      while(left>0){
        const lot=lots[0];assert(lot,'verkaufte Fracht ohne beobachteten Einkauf '+key);
        const q=Math.min(left,lot.n);r.soldBasis+=q*lot.unit;left-=q;lot.n-=q;
        if(lot.n===0)lots.shift();
      }
    }
  }
  work(sh,minutes,rules){this.row(sh.owner).due+=Math.floor((rules.world.betriebskosten[sh.klasse]||0)*minutes/rules.economy.stunde);}
  cost(sh,due,paid){const r=this.row(sh.owner);r.paid+=paid;if(sh.klasse==='frachter')r.flightPaid+=paid;}
  activate(sh,ware){
    const r=this.row(sh.owner),lots=r.stock[sh.id+'/'+ware],lot=lots?.[0];
    assert(lot&&lot.n>=1,'Aktivierung nur nach echtem Kauf');
    r.activatedAssets+=lot.unit;lot.n--;if(lot.n===0)lots.shift();
  }
  rescue(owner,n){this.row(owner).rescue+=n;this.events.push(['rescue',owner,n]);}
  reserve(s,sh,id){
    const e=s.vertraege.eintraege[id];
    this.contracts[id]={budget:e.budget,paid:0,refund:0,closed:false};
    this.maxEscrow=Math.max(this.maxEscrow,sum(Object.values(s.vertraege.eintraege).map(v=>v.rest)));
    this.events.push(['reserve',s.tick,sh.id,id,e.budget]);
  }
  pay(s,e,beleg,n){
    const v=this.contracts[e.id];assert(v&&!v.closed);v.paid+=n;
    const r=this.row(e.zahlender);r.flightPaid+=n;r.paid+=n;
    this.events.push(['pay',s.tick,e.id,beleg,n]);
  }
  close(s,e){const v=this.contracts[e.id];assert(v&&!v.closed);v.refund=e.erstattet;v.closed=true;}
  loss(s,sh){
    const r=this.row(sh.owner);r.losses++;
    // Der Originalverlust verkauft ggf. zuvor Beute; der Rest ist nun ausgebucht.
    for(const key of Object.keys(r.stock).filter(k=>k.startsWith(sh.id+'/'))){
      r.lostBasis+=sum(r.stock[key].map(l=>l.n*l.unit));delete r.stock[key];
    }
    this.events.push(['loss',s.tick,sh.id,sh.owner,sh.klasse]);
  }
  audit(s){
    const a=independentAudit(s),rows=Object.values(this.contracts);
    assert.equal(sum(rows.map(v=>v.budget-v.paid-v.refund)),a.escrow,'Beobachter gegen Escrow');
    assert.equal(sum(rows.map(v=>v.paid)),a.paid,'Beobachter gegen Zahlbelege/Archiv');
    assert.equal(sum(rows.map(v=>v.refund)),a.refunded,'Beobachter gegen Erstattungen/Archiv');
    for(const o of ['npc1','npc2'])for(const sh of Object.values(s.ships).filter(sh=>sh.owner===o))
      for(const [ware,n] of Object.entries(sh.ladung))
        assert.equal(sum((this.row(o).stock[sh.id+'/'+ware]||[]).map(l=>l.n)),n,'unabhaengiger Fracht-FIFO');
    this.maxEscrow=Math.max(this.maxEscrow,a.escrow);
    return a;
  }
  summary(){
    return Object.fromEntries(Object.entries(this.owners).map(([o,r])=>{
      const inventory=sum(Object.values(r.stock).flat().map(l=>l.n*l.unit));
      // Einkaufskosten enthalten bereits Kaufgebuehren, Verkaufsgebuehren separat.
      const salesFees=r.salesFees||0;
      const contribution=r.revenue-salesFees-r.soldBasis-r.flightPaid;
      const cashFlow=r.revenue-r.purchase-r.fees-r.flightPaid;
      assert(Math.abs(cashFlow-(contribution-inventory-r.lostBasis-r.activatedAssets))<0.00001,
        'Frachtkostenbruecke aus FIFO und realen Zahlungen '+o);
      return [o,{...Object.fromEntries(Object.entries(r).filter(([k])=>k!=='stock')),
        inventoryCost:inventory,tradeCashFlow:r.revenue-r.purchase-r.fees-r.flightPaid,
        contribution,
        afterCargoLoss:r.revenue-salesFees-r.soldBasis-r.flightPaid-r.lostBasis,
        afterHullCash:r.revenue-r.purchase-r.fees-r.flightPaid-r.hulls}];
    }));
  }
}
// Eine aktive Spielerstrategie benutzt nur vorhandene validierte Befehle.
function commands(s,r,scenario,c){
  if(scenario==='passive')return [];
  const ships=Object.values(s.ships).filter(sh=>sh.owner==='house').sort((a,b)=>a.id.localeCompare(b.id));
  const miner=ships.find(sh=>sh.klasse==='miner'),freight=ships.find(sh=>sh.klasse==='frachter');
  const list=[],cmd=(sh,type,extra={})=>({type,owner:'house',schiff:sh.id,...extra});
  if(s.tick===0){
    list.push(cmd(miner,'shipMine',{ware:'erz'}));
    if(scenario==='handel-flotte')list.push(cmd(freight,'shipHandeln'));
  }
  if(scenario==='station'&&s.tick%60===0&&miner?.phase==='dock'){
    const station=r.world.systems[miner.system].station;
    if(!s.stations[station].eigentum&&s.owners.house.cash>=c.stationspreis(s,r,station))
      list.push(cmd(miner,'stationBuy'));
  }
  if(scenario==='jagd'){
    const hunter=ships.find(sh=>sh.klasse==='jaeger');
    if(!hunter&&freight?.phase==='dock'&&freight.system==='aldera'){
      if(freight.ladung.jaeger)list.push(cmd(freight,'shipActivate',{klasse:'jaeger'}));
      else if(s.tick%60===0&&s.stations.st_aldera.lager.jaeger>0){
        const p=c.preis(s,'st_aldera','jaeger',r);
        if(s.owners.house.cash>=p+c.gebuehr(s,r,'st_aldera',p))
          list.push(cmd(freight,'shipTrade',{ware:'jaeger',menge:1,kauf:true}));
      }
    }
    if(hunter?.phase==='dock'){
      if(hunter.system==='aldera')list.push(cmd(hunter,'shipMove',{ziel:'st_dravos'}));
      else if(hunter.auftrag!=='jagd')list.push(cmd(hunter,'shipHunt'));
    }
  }
  return list;
}
function snapshot(s,c,r,w){
  const audit=w.audit(s),companies={};
  for(const o of ['house','npc1','npc2','npc3']) {
    const ships=Object.values(s.ships).filter(sh=>sh.owner===o);
    const price=c.preis(s,r.world.werft,'frachter',r),full=price+c.gebuehr(s,r,r.world.werft,price);
    companies[o]={cash:s.owners[o].cash,freighters:ships.filter(sh=>sh.klasse==='frachter').length,
      miners:ships.filter(sh=>sh.klasse==='miner').length,
      hullPrice:full,cashHullCoverage:s.owners[o].cash/full,
      // Liquiditaetsindikator, keine abgesicherte Ersatzbestellung.
      yardStock:s.stations[r.world.werft].lager.frachter};
  }
  return {tick:s.tick,hash:c.hash(s),...audit,companies,
    stationCash:sum(Object.values(s.owners).filter(o=>o.kind==='station').map(o=>o.cash)),
    houseStations:Object.values(s.stations).filter(st=>st.eigentum==='house').length,
    foodConsumed:s.ledger.nahrung.consumed,medicineConsumed:s.ledger.medikamente.consumed,
    shortages:structuredClone(s.stats.mangel),hullProduced:s.ledger.frachter.produced,
    yardSilicon:s.stations.st_aldera.lager.silizium,yardParts:s.stations.st_aldera.lager.bauteil,
    losses:structuredClone(s.stats.verluste),subsidies:s.stats.zuschuss,minted:s.minted,burned:s.burned};
}
function run(seed,scenario,mode){
  const w=new Watch(),noRescue=mode==='candidate-no-rescue';
  const arrival=mode==='candidate-arrival';
  const {c,r:base}=engine(current,w,noRescue,arrival);
  const r=mode==='product'?base:{...base,schema:9,rulesVersion:15};
  const plain=engine(mode==='product'?main:current,null,noRescue,arrival);
  let s=c.createState(seed,r),replay=plain.c.createState(seed,r);
  assert.equal(c.hash(s),plain.c.hash(replay));
  const daily=[],executed=[];let roundtrips=0,hours=0,unfundedNew=0,escrowHours=0;
  for(let t=0;t<days*1440;t++) {
    const cmds=commands(s,r,scenario,c);
    for(const cmd of cmds){
      assert(c.submit(s,cmd,r).ok);assert(plain.c.submit(replay,cmd,r).ok);
      executed.push({tick:s.tick+1,cmd});
    }
    const results=c.step(s,r),other=plain.c.step(replay,r);
    assert.deepEqual(results,other);
    assert(results.every(x=>x.ok),JSON.stringify(results));
    w.sample(s,r); // ausschliesslich lesender Zeitbeobachter, Replay bleibt Original.
    if(r.schema===9)for(const sh of Object.values(s.ships))
      if(sh.klasse==='frachter'&&sh.phase==='reise'&&!sh.vertrag)unfundedNew++;
    if(s.tick%60===0){
      assert(c.audit(s).ok);const a=w.audit(s);independentAudit(replay);
      assert.equal(c.hash(s),plain.c.hash(replay),'stundenweiser Replay '+seed+'/'+mode+'/'+s.tick);
      escrowHours+=a.escrow;hours++;
    }
    if(s.tick%1440===0){
      const economy=w.summary();
      daily.push({...snapshot(s,c,r,w),traderEconomics:{npc1:economy.npc1,npc2:economy.npc2}});
      const before=c.hash(s);
      s=c.load(c.save(s),undefined,r);replay=plain.c.load(plain.c.save(replay),undefined,r);
      assert.equal(c.hash(s),before);assert.equal(c.hash(s),plain.c.hash(replay));roundtrips+=2;
    }
  }
  assert.equal(unfundedNew,0,'keine neue Frachterreise ohne Deckung');
  const result={seed,scenario,mode,days,hours,roundtrips,commands:executed,
    dailyHashes:daily.map(x=>x.hash),dailyTraderContributions:daily.map(x=>
      [x.traderEconomics.npc1.contribution,x.traderEconomics.npc2.contribution]),
    checkpoints:daily.filter(x=>[1,7,14,30,60,90,days].includes(x.tick/1440)),
    final:daily.at(-1),economics:w.summary(),maxEscrow:w.maxEscrow,meanHourlyEscrow:escrowHours/hours,
    events:w.events.length,eventDigest:sha(JSON.stringify(w.events)),unfundedNew,
    timing:w.timing};
  console.log('BK11_WORLD '+JSON.stringify({seed,scenario,mode,days,hash:result.final.hash,
    npc1:result.final.companies.npc1,npc2:result.final.companies.npc2,
    subsidies:result.final.subsidies,events:result.events}));
  return result;
}
const results=[];
if(suite!=='crises')for(const seed of seeds)for(const mode of (probe==='arrival'?['product','candidate','candidate-arrival']:['product','candidate','candidate-no-rescue']))
  results.push(run(seed,'passive',mode));
if(suite!=='standard')for(const [scenario,seed] of [['miner',42],['handel-flotte',42],['station',1234],['jagd',98765]])
  for(const mode of (probe==='arrival'?['product','candidate','candidate-arrival']:['product','candidate','candidate-no-rescue']))results.push(run(seed,scenario,mode));
fs.writeFileSync(out,JSON.stringify({base:BASE,coreSha256:sha(current),observerSha256:observerSha,
  node:process.version,days,suite,results},null,2)+'\n');
// B-K11a: CI-Log enthaelt nur Zaehler, keine aufgeblasenen Einzel-Tick-Dumps.
const cand=results.filter(x=>x.mode===(probe==='arrival'?'candidate-arrival':'candidate'));
const timingTotals={};
for(const key of ['blockedAttempts','blockedWithCash','blockedWithCargo',
    'blockedWithCashAndCargo','lockedDockMinutes','lockedWithCargoMinutes','dockMinutes'])
  timingTotals[key]=sum(cand.map(x=>x.timing[key]));
console.log('BK11A_TIMING '+JSON.stringify({days,suite,probe,worlds:cand.length,
  totals:timingTotals,byWorld:cand.map(x=>({seed:x.seed,scenario:x.scenario,...x.timing}))}));
if(probe==='arrival'){
  const tiefSumme=v=>typeof v==='number'?v:v&&typeof v==='object'
    ?sum(Object.values(v).map(tiefSumme)):0;
  const vergleich=results.map(x=>{
    const npc1=x.economics.npc1||{},npc2=x.economics.npc2||{};
    return {
      seed:x.seed,scenario:x.scenario,mode:x.mode,days:x.days,
      shortageHours:tiefSumme(x.final.shortages),
      foodConsumed:x.final.foodConsumed,medicineConsumed:x.final.medicineConsumed,
      npcContribution:(npc1.contribution||0)+(npc2.contribution||0),
      npcAfterHullCash:(npc1.afterHullCash||0)+(npc2.afterHullCash||0),
      npcFlightPaid:(npc1.flightPaid||0)+(npc2.flightPaid||0),
      npcHullPayments:(npc1.hulls||0)+(npc2.hulls||0),
      npcHullBuys:(npc1.hullCount||0)+(npc2.hullCount||0),
      npcFreighters:x.final.companies.npc1.freighters+x.final.companies.npc2.freighters,
      npcCash:x.final.companies.npc1.cash+x.final.companies.npc2.cash,
      npcCargoLost:(npc1.lostBasis||0)+(npc2.lostBasis||0),
      npcLosses:(npc1.losses||0)+(npc2.losses||0),
      unmetNPCWork:(npc1.due||0)+(npc2.due||0)-(npc1.paid||0)-(npc2.paid||0),
      meanEscrow:x.meanHourlyEscrow,
      blockedAttempts:x.timing.blockedAttempts
    };
  });
  console.log('BK11B_COMPARE '+JSON.stringify({days,suite,worlds:vergleich}));
}
console.log('BK11_AUDIT_PASS '+JSON.stringify({worlds:results.length,days,
  hourlyReplayAudits:sum(results.map(x=>x.hours)),saveLoads:sum(results.map(x=>x.roundtrips)),out}));
