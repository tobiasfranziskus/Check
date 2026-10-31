// B7b: NPC reinvestment + validated manual player funding via ONE shared ship ledger.
// Isolated analysis. No production code, rule-version or official-save change.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(seed|case|b1|out|mode|days)=/.test(x)),'unbekannter Parameter');
const days=Number(opt('days','10'));
assert([10,90].includes(days),'B7b genau 10 oder 90 Spieltage');
const mode=opt('mode','control');
assert(['control','wallet'].includes(mode),'B7a nur Kontrollkern oder Schiffskonto-Gegenprobe');
const scenario=opt('case',null), seed=scenario?{miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario]:Number(opt('seed','42'));
assert.equal(seed,42,'H1-C1: ausschliesslich Seed 42');
assert.equal(scenario,'handel-flotte','B7a nur historische B1-Befehle handel-flotte ab Tick1');
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
assert.equal(sha(original),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9','eingefrorene Regel14-Quelle');
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
function h1Source(code){
  let s=code;
  const consumed='st.lager[ware] = da - n; state.ledger[ware].consumed += n;';
  assert.equal(s.split(consumed).length,2,'einziger echter Verbrauchshook');
  s=s.replace(consumed,consumed+'\n      h1.consume(state,id,ware,n);');
  const step='verbrauch(state, rules); betriebskosten(state, rules); aussenhandel(state, rules);';
  assert.equal(s.split(step).length,2,'einziger Stunden-Tick');
  s=s.replace(step,'verbrauch(state, rules); h1.pay(state,rules); betriebskosten(state, rules); aussenhandel(state, rules);');
  return s;
}

function walletSource(original){
 let s=original;
 const replace=(needle,withText)=>{
   assert.equal(s.split(needle).length,2,'B7a eindeutiger Coreanker '+needle);
   s=s.replace(needle,withText);
 };
 const module=String.raw`
const m_pilot_accounts = (() => {
const eligible=s=> (s.owner==='npc1'||s.owner==='npc2') && s.klasse==='frachter';
const asset=w=>['miner','frachter','jaeger','bauschiff'].includes(w);
function get(state,s){
  if(!eligible(s))return state.owners[s.owner];
  const w=state.pilotAccounts?.[s.id];
  if(!w)throw Error('B7a fehlendes pilot-account '+s.id);
  return w;
}
function account(state,s,ware){return eligible(s)&&!asset(ware)?get(state,s):state.owners[s.owner];}
function init(state){
  state.pilotAccounts={};
  for(const owner of ['npc1','npc2']){
    const ships=Object.values(state.ships).filter(s=>eligible(s)&&s.owner===owner).sort((a,b)=>a.id.localeCompare(b.id));
    const available=state.owners[owner].cash;
    if(ships.length===0)continue;
    const share=Math.floor(available/ships.length);
    for(let i=0;i<ships.length;i++){
      const n=i===ships.length-1?state.owners[owner].cash:share;
      state.owners[owner].cash-=n;
      state.pilotAccounts[ships[i].id]={cash:n,owner,initial:n};
    }
  }
}
function newShip(state,s){
  if(!eligible(s))return;
  const n=Math.min(state.owners[s.owner].cash,1000);
  state.owners[s.owner].cash-=n;
  state.pilotAccounts[s.id]={cash:n,owner:s.owner,initial:n};
}
function retire(state,s){
  if(!eligible(s)||!state.pilotAccounts?.[s.id])return;
  const n=state.pilotAccounts[s.id].cash;
  state.owners[s.owner].cash+=n;
  delete state.pilotAccounts[s.id];
}
function reserve(state,rules,s,minutes){
  return Math.ceil((s.arbeit+minutes)/rules.economy.stunde)*rules.world.betriebskosten.frachter;
}
function enough(state,rules,s,travelMinutes){
  return !eligible(s) || get(state,s).cash>=reserve(state,rules,s,travelMinutes);
}
function available(state,rules,s,travelMinutes){
  return Math.max(0,get(state,s).cash-(eligible(s)?reserve(state,rules,s,travelMinutes):0));
}
function settle(state) {
  for(const id of Object.keys(state.pilotAccounts||{}).sort()){
    const ship=state.ships[id],wallet=state.pilotAccounts[id];
    if(!ship||ship.phase!=='dock'||ship.arbeit!==0||Object.values(ship.ladung).some(n=>n>0))continue;
    const excess=Math.max(0,wallet.cash-1000);
    if(excess>0){wallet.cash-=excess;state.owners[wallet.owner].cash+=excess;}
  }
}
return {eligible,get,account,init,newShip,retire,reserve,enough,available,settle};
})();
`;
 replace('const m_core_handel = (() => {',module+'\nconst m_core_handel = (() => {');
 replace("  return state;\n}\nreturn { leereStats, kontoStats, kampfStats, zuschussStats, protokolliere, schiffId, neuesSchiff, createState };",
   "  m_pilot_accounts.init(state);\n  return state;\n}\nreturn { leereStats, kontoStats, kampfStats, zuschussStats, protokolliere, schiffId, neuesSchiff, createState };");
 replace('const besitzer = state.owners[schiff.owner];',
   'const besitzer = m_pilot_accounts.account(state,schiff,ware);');
 replace('const w = rules.world, hier = w.stations[station], kasse = state.owners[s.owner].cash;',
   'const w = rules.world, hier = w.stations[station], kasse = m_pilot_accounts.get(state,s).cash;');
 replace('bezahlbar(rules, station, kasse, pHier));',
   'bezahlbar(rules, station, m_pilot_accounts.available(state,rules,s,r.zeit), pHier));');
 replace('  if (!r || r.zeit <= 0) return false;\n  if (ware !== null) {',
   '  if (!r || r.zeit <= 0 || !m_pilot_accounts.enough(state,rules,s,r.zeit)) return false;\n  if (ware !== null) {');
 replace('bezahlbar(rules, station, state.owners[s.owner].cash, p));',
   'bezahlbar(rules, station, m_pilot_accounts.available(state,rules,s,r.zeit), p));');
 replace('    if (m > 0 && handel(state, rules, s, station, ware, m, true)) state.stats.handel += 1;',
   '    if (m <= 0 && m_pilot_accounts.eligible(s)) return false;\n    if (m > 0 && handel(state, rules, s, station, ware, m, true)) state.stats.handel += 1;');
 replace('    const besitzer = state.owners[s.owner];',
   '    const besitzer = m_pilot_accounts.get(state,s);');
 replace('function entfernen(state, rules, s) {',
   'function entfernen(state, rules, s) {\n  m_pilot_accounts.retire(state,s);');
 replace('      if (state.owners[owner].cash < bedarf + (leer ? 0 : w.ersatzRuecklage)) continue;',
   '      if (state.owners[owner].cash < bedarf + (m_pilot_accounts.eligible({owner,klasse:x.klasse})?500:(leer?0:w.ersatzRuecklage))) continue;');
 replace('      delete s.ladung[x.klasse]; state.ledger[x.klasse].consumed += 1;',
   '      delete s.ladung[x.klasse]; state.ledger[x.klasse].consumed += 1;\n      m_pilot_accounts.newShip(state,s);');
 replace('ersatzkauf(state, rules); npcAusgaben(state, rules); fonds(state, rules); dividende(state, rules);',
   'ersatzkauf(state, rules); m_pilot_accounts.settle(state); npcAusgaben(state, rules); fonds(state, rules); dividende(state, rules);');
 replace('  for (const o of Object.values(state.owners)) total += o.cash;',
   '  for (const o of Object.values(state.owners)) total += o.cash;\n  for (const o of Object.values(state.pilotAccounts||{})) total += o.cash;');
 return s;
}
function sharedSource(b7a){
  let s=b7a;
  const rep=(a,b)=>{const n=s.split(a).length-1;assert.equal(n,1,'B7b unique source anchor '+a);s=s.replace(a,b);};
  rep("const eligible=s=> (s.owner==='npc1'||s.owner==='npc2') && s.klasse==='frachter';",
      "const eligible=s=> ['npc1','npc2','house'].includes(s.owner) && s.klasse==='frachter';\nconst auto=s=>['npc1','npc2'].includes(s.owner)&&s.klasse==='frachter';");
  rep("  }\n}\nfunction newShip(state,s){",
      "  }\n  for(const ship of Object.values(state.ships).filter(x=>x.owner==='house'&&eligible(x)))state.pilotAccounts[ship.id]={cash:0,owner:'house',initial:0};\n}\nfunction fund(state,s,amount){\n  if(!eligible(s)||!Number.isSafeInteger(amount)||amount<=0)return false;\n  if(state.owners[s.owner].cash<amount)return false;\n  state.owners[s.owner].cash-=amount;get(state,s).cash+=amount;return true;\n}\nfunction newShip(state,s){");
  rep("  const n=Math.min(state.owners[s.owner].cash,1000);\n  state.owners[s.owner].cash-=n;\n  state.pilotAccounts[s.id]={cash:n,owner:s.owner,initial:n};",
      "  state.pilotAccounts[s.id]={cash:0,owner:s.owner,initial:0};\n  if(auto(s)){const n=Math.min(state.owners[s.owner].cash,1000);if(n>0)fund(state,s,n);}");
  rep("function enough(state,rules,s,travelMinutes){",
      "function buyingPower(state,rules,s,travelMinutes){\n  const c=get(state,s).cash+(auto(s)?state.owners[s.owner].cash:0);\n  return Math.max(0,c-reserve(state,rules,s,travelMinutes));\n}\nfunction finance(state,rules,s,travelMinutes,ware,units,station){\n  if(!eligible(s))return true;\n  const rent=reserve(state,rules,s,travelMinutes);\n  const p=ware===null?0:m_core_preis.preis(state,station,ware,rules);\n  const value=units*p;\n  const fee=ware===null?0:m_core_handel.gebuehr(state,rules,station,value);\n  const needed=Math.max(0,rent+value+fee-get(state,s).cash);\n  if(needed>0){if(!auto(s)||state.owners[s.owner].cash<needed||!fund(state,s,needed))return false;}\n  return get(state,s).cash>=rent+value+fee;\n}\nfunction enough(state,rules,s,travelMinutes){");
  rep("return {eligible,get,account,init,newShip,retire,reserve,enough,available,settle};",
      "return {eligible,auto,get,account,init,newShip,retire,reserve,enough,available,settle,finance,fund,buyingPower};");
  rep("shipMove: ['schiff', 'ziel'], shipTrade: ['schiff', 'ware', 'menge', 'kauf'],",
      "shipMove: ['schiff', 'ziel'], shipTrade: ['schiff', 'ware', 'menge', 'kauf'], shipFund: ['schiff', 'betrag'],");
  rep("    if (cmd.type === 'shipMove') {",
      "    if(cmd.type==='shipFund'){\n      if(s.klasse!=='frachter'||!m_pilot_accounts.eligible(s))return 'nur verwaltete Frachter';\n      if(!Number.isSafeInteger(cmd.betrag)||cmd.betrag<=0)return 'Betrag muss positive ganze Zahl sein';\n      if(state.owners[cmd.owner].cash<cmd.betrag)return 'zu wenig Konzernkapital';\n    }\n    if (cmd.type === 'shipMove') {");
  rep("    case 'shipMove': {",
      "    case 'shipFund': {\n      if(!m_pilot_accounts.fund(state,state.ships[cmd.schiff],cmd.betrag))return {ok:false,type:cmd.type,reason:'zu wenig Konzernkapital'};\n      break;\n    }\n    case 'shipMove': {");
  rep("      if (!r || r.zeit <= 0) return { ok: false, type: cmd.type, reason: 'kein Weg' };",
      "      if (!r || r.zeit <= 0) return { ok: false, type: cmd.type, reason: 'kein Weg' };\n      if(m_pilot_accounts.eligible(s)&&!m_pilot_accounts.enough(state,rules,s,r.zeit))return {ok:false,type:cmd.type,reason:'Fahrtkosten nicht finanziert'};");
  rep("      const neu = m_core_state.neuesSchiff(state, { owner: cmd.owner, klasse: cmd.klasse, system: traeger.system, heimat: traeger.system, auftrag: 'halten', ware: null });",
      "      const neu = m_core_state.neuesSchiff(state, { owner: cmd.owner, klasse: cmd.klasse, system: traeger.system, heimat: traeger.system, auftrag: 'halten', ware: null });\n      m_pilot_accounts.newShip(state,neu);");
  rep("const w = rules.world, hier = w.stations[station], kasse = m_pilot_accounts.get(state,s).cash;",
      "const w = rules.world, hier = w.stations[station], kasse = m_pilot_accounts.get(state,s).cash+(m_pilot_accounts.auto(s)?state.owners[s.owner].cash:0);");
  rep("bezahlbar(rules, station, m_pilot_accounts.available(state,rules,s,r.zeit), pHier));",
      "bezahlbar(rules, station, m_pilot_accounts.buyingPower(state,rules,s,r.zeit), pHier));");
  rep("  if (!r || r.zeit <= 0 || !m_pilot_accounts.enough(state,rules,s,r.zeit)) return false;\n  if (ware !== null) {",
      "  if (!r || r.zeit <= 0) return false;\n  if(ware!==null){\n    const m=Math.min(menge,rules.economy.cargo-Object.values(s.ladung).reduce((a,b)=>a+b,0),verkaufbar(state,rules,station,ware));\n    if(m<=0||!m_pilot_accounts.finance(state,rules,s,r.zeit,ware,m,station))return false;\n  }else if(!m_pilot_accounts.finance(state,rules,s,r.zeit,null,0,station))return false;\n  if (ware !== null) {");
  return s;
}

const src=mode==='wallet'?sharedSource(walletSource(original)):original;

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
  hook('st.lager[ware] = da - n; state.ledger[ware].consumed += n;',
    'watch.civilianConsume(state,id,ware,n,bedarf[ware]);');
  hook('state.owners[id].cash -= n; state.owners[spieler].cash += n;',
    'watch.dividendTransfer(state,id,spieler,n);');
  return s;
};
function engine(code,watch,probe=null,h1=null) {
  return new Function('watch','probe','h1',code+';return {c:m_core_index,r:m_data_rules.RULES};')(watch,probe,h1);
}
class Probe {
  constructor(){this.stats={attempts:0,loans:0,lent:0,repayments:0,repaid:0,
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
class H1Collector {
  constructor(){this.pending={};this.paid=0;this.consumedEligible=0;this.payEvents=[];this.daily={};this.byStation={};this.withGoodsNoPay=0;this.hoursWithPayment=0;this.hoursWithoutGoods=0;}
  consume(state,station,ware,n){
    if(!['nahrung','medikamente'].includes(ware)||n===0)return;
    const w=state.rulesVersion===14 ? (ware==='nahrung'?30:105) : null;
    assert.equal(w,ware==='nahrung'?30:105);
    assert(Number.isSafeInteger(n)&&n>0);
    const p=this.pending[station] ||= {weight:0,nahrung:0,medikamente:0};
    p.weight+=n*w;p[ware]+=n;
    this.consumedEligible+=n;
  }
  pay(state,rules){
    assert.equal(state.tick%60,0,'nur genau ein H1-Abschluss je Stunde');
    const budget=20, day=Math.floor((state.tick-1)/1440)+1;
    const ids=Object.keys(this.pending).sort();
    const total=ids.reduce((s,id)=>s+this.pending[id].weight,0);
    const amount=Math.min(budget,total);
    let allocations=[];
    if(total>0){
      let paid=0;
      allocations=ids.map(id=>{
        const weighted=amount*this.pending[id].weight,base=Math.floor(weighted/total),rest=weighted%total;
        paid+=base;return {id,base,rest};
      });
      for(const e of allocations.slice().sort((a,b)=>b.rest-a.rest || a.id.localeCompare(b.id)).slice(0,amount-paid)) e.base++;
      assert.equal(allocations.reduce((n,e)=>n+e.base,0),amount,'H1 Rundung exakt');
      for(const e of allocations){
        if(e.base===0)continue;
        assert(e.base<=this.pending[e.id].weight,'kein Ansatz ohne echte Leistung');
        state.owners[e.id].cash+=e.base;
        state.minted+=e.base;
        this.byStation[e.id]=(this.byStation[e.id]||0)+e.base;
      }
    }
    const daily=this.daily[day] ||= {day,paid:0,claim:0,nahrung:0,medikamente:0,activeHours:0,emptyHours:0};
    daily.paid+=amount;daily.claim+=total;
    for(const id of ids){daily.nahrung+=this.pending[id].nahrung;daily.medikamente+=this.pending[id].medikamente;}
    if(amount>0){daily.activeHours++;this.hoursWithPayment++;}
    else{daily.emptyHours++;this.hoursWithoutGoods++;}
    assert(amount<=20 && amount<=total,'globales 20-ISK-Stundenbudget nur nach konsumierter Ware');
    this.paid+=amount;
    if(amount>0)this.payEvents.push({tick:state.tick,day,claim:total,paid:amount,receivers:allocations.filter(x=>x.base>0).map(x=>({station:x.id,isk:x.base}))});
    this.pending={};
  }
}
const probeMain=new Probe(),probeReplay=new Probe();
const h1Observed=new H1Collector(),h1Replay=new H1Collector();
const plain=engine(src,null,probeReplay,h1Replay);
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

const ALL_CONSUMED=['nahrung','medikamente','bauteil'];
const BASE_WEIGHT={nahrung:30,medikamente:105};
const consumerDays={}; const dividendEvents=[];
function dayRow(day) {
  return consumerDays[day] ||= {day,consumed:{nahrung:0,medikamente:0,bauteil:0},
    weightedClaim:0,stations:{},dividendTransfers:0,dividendByStation:{}};
}
watcher.civilianConsume=(state,station,ware,n,demand)=>{
  if(!ALL_CONSUMED.includes(ware))return;
  assert(Number.isSafeInteger(n)&&n>=0&&n<=demand,'nur tatsaechlicher Verbrauch');
  assert(state.stations[station].lager[ware]>=0,'Lager nicht negativ');
  const d=dayRow(Math.ceil(state.tick/1440));
  const s=d.stations[station] ||= {nahrung:0,medikamente:0,bauteil:0,weightedClaim:0,ownedBy:state.stations[station].eigentum};
  d.consumed[ware]+=n;s[ware]+=n;
  if(ware==='nahrung'||ware==='medikamente'){
    const amount=n*BASE_WEIGHT[ware];
    d.weightedClaim+=amount;s.weightedClaim+=amount;
  }
};
watcher.dividendTransfer=(state,station,player,n)=>{
  assert(n>0 && state.stations[station].eigentum===player,'nur reale Spieler-Dividende');
  const d=dayRow(Math.ceil(state.tick/1440));
  d.dividendTransfers+=n;
  d.dividendByStation[station]=(d.dividendByStation[station]||0)+n;
  dividendEvents.push({tick:state.tick,station,player,amount:n});
};

const observed=engine(instrument(src),watcher,probeMain,h1Observed);
assert.equal(observed.r.rulesVersion,14);

const manualFlightProof=mode==='wallet'?(()=>{
  const test=observed.c.createState(42,observed.r);
  const ship=test.ships.sh002;
  assert(ship&&ship.owner==='house'&&ship.klasse==='frachter'&&ship.phase==='dock');
  const routes=Object.keys(observed.r.world.stations).sort().map(station=>{
    const r=observed.c.route(observed.r.world,ship.system,observed.r.world.stations[station].system);
    return {station,time:r?.zeit??0};
  }).filter(x=>x.time>0&&Math.ceil(x.time/60)*observed.r.world.betriebskosten.frachter<=test.owners.house.cash)
    .sort((a,b)=>a.time-b.time||a.station.localeCompare(b.station));
  assert(routes.length,'eine finanzierbare Spieler-Verbindung existiert');
  const target=routes[0],fare=Math.ceil(target.time/60)*observed.r.world.betriebskosten.frachter;
  const move={type:'shipMove',owner:'house',schiff:'sh002',ziel:target.station};
  assert(observed.c.submit(test,move,observed.r).ok,'Spieler darf Bewegung versuchen');
  const denied=observed.c.step(test,observed.r)[0];
  assert(denied&&!denied.ok,'ungedeckte Spielerfahrt wird vor Start abgelehnt');
  assert.equal(test.ships.sh002.phase,'dock');
  const finance={type:'shipFund',owner:'house',schiff:'sh002',betrag:fare};
  assert(observed.c.submit(test,finance,observed.r).ok,'Spieler finanziert aus eigenem existierenden Kapital');
  const funded=observed.c.step(test,observed.r)[0];assert(funded?.ok);
  assert.equal(test.pilotAccounts.sh002.cash,fare);
  assert(observed.c.submit(test,move,observed.r).ok);
  const departed=observed.c.step(test,observed.r)[0];assert(departed?.ok);
  assert.equal(test.ships.sh002.phase,'reise');
  assert.equal(test.pilotAccounts.sh002.cash,fare);
  return {destination:target.station,minutes:target.time,fare,rejectedBeforeFunding:true,departedAfterFunding:true};
})():null;

const ref=JSON.parse(fs.readFileSync(path.join(opt('b1','/tmp/h1-c2-b1'),'docs/data/wirtschaft-langzeit-v12.json'),'utf8'));
const originalPlayer=ref.players.find(p=>p.scenario===scenario&&p.seed===seed);
assert(originalPlayer&&originalPlayer.commands.length===9,'exaktes historisches B1 Spielerbefehlsband (9 Befehle)');
assert.equal(originalPlayer.commands[0].tick,1);
assert.equal(originalPlayer.commands.at(-1).tick,259201);
const expected=originalPlayer.commands.filter(x=>x.tick<=days*1440).map(({tick,...cmd})=>({tick,cmd}));
const manualFund={type:'shipFund',owner:'house',schiff:'sh002',betrag:1000};
let state=observed.c.createState(seed,observed.r),replay=plain.c.createState(seed,plain.r);
if(mode==='wallet'){
  for(const [e,r] of [[observed,state],[plain,replay]]){
    assert.equal(e.c.submit(r,{...manualFund,betrag:r.owners.house.cash+1},e.r).ok,false,'manual: Ueberziehung ablehnen');
    assert.equal(e.c.submit(r,{...manualFund,schiff:'sh014'},e.r).ok,false,'manual: fremdes Schiff ablehnen');
    assert(e.c.submit(r,manualFund,e.r).ok,'manual: selbst finanzierter Spielerfrachter');
  }
}
const initialLegacyHash=null;
const initialHash=plain.c.hash(replay);
assert.equal(observed.c.hash(state),initialHash);
let cursor=0,hours=0,roundtrips=0,manualFundExecuted=false,manualShipCashAtTick1=null;
const dayHashes=[],daily=[];
function audit(s){
  assert(plain.c.audit(s).ok,'Produkt-Geld-/Warenaudit');
  const cash=sum(Object.values(s.owners).map(o=>{assert(Number.isSafeInteger(o.cash)&&o.cash>=0);return o.cash;}))+
    sum(Object.values(s.pilotAccounts||{}).map(o=>{assert(Number.isSafeInteger(o.cash)&&o.cash>=0);return o.cash;}));
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
  const stationCash=Object.fromEntries(Object.keys(s.stations).sort().map(id=>[id,s.owners[id].cash]));
  const walletCash=Object.values(s.pilotAccounts||{}).reduce((a,x)=>a+x.cash,0);
  const walletCount=Object.keys(s.pilotAccounts||{}).length;
  return {day:Math.round(s.tick/1440),npc,walletCash,walletCount,playerCash:s.owners.house.cash,stationCash,shortage,recipes,siliconAldera:aldr.silizium||0,
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
  if(mode==='wallet'&&state.tick===1)assert.equal(a[1]?.ok,true,'historischer manueller Handelsauftrag nach gemeinsamer Umbuchung gueltig');
  if(mode==='wallet'&&state.tick===2)assert.equal(a[0]?.ok,true,'historischer manueller Warenverkauf nach gemeinsamer Umbuchung gueltig');
  if(mode==='wallet'&&state.tick===1){
    assert.equal(a[0]?.type,'shipFund','Spieler-Finanzierungsbefehl wird im Kern ausgefuehrt');
    assert.equal(a[0]?.ok,true,'Spieler-Finanzierung tatsaechlich erfolgreich');
    assert.equal(state.pilotAccounts?.sh002?.owner,'house','Konto nach erster Buchung vorhanden');
    manualShipCashAtTick1=state.pilotAccounts.sh002.cash;
    manualFundExecuted=true;
  }
  if(state.tick%60===0){
    audit(state);audit(replay);
    assert.equal(observed.c.hash(state),plain.c.hash(replay),'stundenweiser unveraenderter Hash');
    hours++;
  }
  if(state.tick%1440===0){
    const x=snapshot(state);daily.push(x);dayHashes.push(x.hash);
    dayRow(x.day);
    const day=minute/1440;
    if([1,3,7,10,30,60,90].includes(day)){
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
if(mode==='wallet')assert(manualFundExecuted,'Spieler-Befehl unabhaengig von spaeterem Schiffsverlust verifiziert');
assert.equal(hours,days*24);
assert.deepEqual(probeMain.stats,probeReplay.stats,'Darlehens-/Tilgungsprotokoll muss im Replay identisch sein');
assert.deepEqual(state.b6eContracts||{},replay.b6eContracts||{},'Darlehensbuch bei Replay gleich');
const traderSales=watcher.traderSales;
const measuredDays=Object.values(consumerDays).sort((a,b)=>a.day-b.day);
assert.equal(measuredDays.length,days,'jeder Spieltag separat beobachtet');
const aggregateCivil={nahrung:0,medikamente:0,bauteil:0,weightedClaim:0,dividends:0,daysWithConsumption:0,daysWithoutConsumption:0};
for(const d of measuredDays){
  for(const w of ALL_CONSUMED)aggregateCivil[w]+=d.consumed[w];
  aggregateCivil.weightedClaim+=d.weightedClaim;
  aggregateCivil.dividends+=d.dividendTransfers;
  assert.equal(d.weightedClaim,d.consumed.nahrung*30+d.consumed.medikamente*105,'Basiswert-Claim');
  assert(d.weightedClaim<=27360,'Welt-Vollversorgungsobergrenze je Tag');
  if(d.weightedClaim>0)aggregateCivil.daysWithConsumption++;
  else aggregateCivil.daysWithoutConsumption++;
}
if(mode==='control')assert.equal(src,original,'Kontrolle exakt unveraenderter Kern');
else assert.notEqual(src,original,'wallet source isolated'); 
assert.equal(h1Observed.paid,h1Replay.paid,'gepraegte ISK in Original/Replay gleich');
assert.deepEqual(h1Observed.byStation,h1Replay.byStation,'Empfaengerverteilung determiniert');
assert.deepEqual(h1Observed.daily,h1Replay.daily,'Tagesquoten reproduzierbar');
assert.equal(Object.keys(h1Observed.pending).length,0,'Stundenueberhang muss leer sein');
assert.equal(h1Observed.paid,0,'B7a erzeugt keine H1-ISK');
for(const e of h1Observed.payEvents)assert.equal(e.receivers.reduce((s,r)=>s+r.isk,0),e.paid,'keine verdeckte Gegenbuchung');
assert(Object.values(h1Observed.daily).every(x=>x.paid<=480),'Tagesbudget global');

assert.equal(state.minted,replay.minted,'keine Geldschoepfung durch Beobachter');
assert.equal(state.burned,replay.burned,'keine Veraenderung der Senken');
const totals={scenario:scenario||'standard',seed,mode,version:14,sourceSha256:sha(original),variantSha256:sha(src),pauses:watcher.pauses,
  consumerAudit:{aggregate:aggregateCivil,days:measuredDays,dividendEvents,nominalFullCoverageDaily:27360},
  wallet:{balance:Object.values(state.pilotAccounts||{}).reduce((a,w)=>a+w.cash,0),count:Object.keys(state.pilotAccounts||{}).length,
    accounts:state.pilotAccounts||{},manualFund:mode==='wallet'?manualFund:null,manualFundExecuted,manualShipCashAtTick1},
  h1:{Btag:0,paid:h1Observed.paid,byStation:h1Observed.byStation,
    hoursWithPayment:h1Observed.hoursWithPayment,hoursWithoutGoods:h1Observed.hoursWithoutGoods,
    days:Object.values(h1Observed.daily).sort((a,b)=>a.day-b.day),
    payEvents:h1Observed.payEvents},
  manualFlightProof,
  credit:probeMain.stats,contracts:state.b6eContracts||{},
  initialHash,initialLegacyHash,days,hours,roundtrips,commands:cursor,
  paid:sum(Object.values(watcher.owners).map(x=>x.operatingPaid)),
  due:sum(Object.values(watcher.owners).map(x=>x.operatingDue)),
  unpaid:sum(Object.values(watcher.owners).map(x=>x.operatingDue-x.operatingPaid)),
  traderSales,closeouts:watcher.closeouts.length,
  followUpPurchases:sum(Object.values(watcher.owners).map(x=>x.postSalePurchases)),
  originalFreighterAlive:scenario?Boolean(state.ships[expected.find(x=>x.cmd.type==='shipHandeln')?.cmd.schiff]):null,
  final:daily.at(-1),owners:watcher.owners,hulls:watcher.hulls,losses:watcher.lossEvents,
  closeoutSamples:watcher.closeouts.slice(0,30),daily};
const out=opt('out','/tmp/b7b-results');
fs.mkdirSync(out,{recursive:true});
const file=path.join(out,'b7b-'+scenario+'-'+seed+'-'+mode+'-'+days+'d.json');
fs.writeFileSync(file,JSON.stringify(totals,null,2)+'\n');
console.log('B7B_SHARED_ACCOUNT_PASS '+JSON.stringify({scenario:totals.scenario,seed,mode,days,credit:totals.credit,contracts:totals.contracts,
  hourlyHashes:hours,dailyHashes:dayHashes.length,roundtrips,pauses:watcher.pauses,
  tradeSales:traderSales,paid:totals.paid,due:totals.due,unpaid:totals.unpaid,
  followUpPurchases:totals.followUpPurchases,
  endCash:totals.final.npc,shortage:totals.final.shortage,
  civil:aggregateCivil,playerCash:totals.final.playerCash,shipWallet:totals.wallet,
  startCashIndependent:true,firstPayment:totals.h1.payEvents[0]?.tick??null}));
