// [ANALYSE] Loads the pinned historical R15 core, never the product runtime.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const fixture = fs.readFileSync(new URL('../fixtures/bk11h-r15-core-snapshot.txt', import.meta.url), 'utf8');
export const fixtureSHA = createHash('sha256').update(fixture).digest('hex');
assert.equal(fixtureSHA, 'e5e2c5092fda778b38064dcda2692004889635639ff56dc5c0c61b2377dd7680');
export const sum = xs => xs.reduce((a,b)=>a+b,0);
export function capital(s) {
  const out = Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  for (const v of Object.values(s.vertraege?.eintraege||{})) out[v.zahlender] += v.rest;
  return out;
}
export function audit(s, core, provenance) {
  assert.equal(sum(Object.values(capital(s))), s.initialSupply+s.minted-s.burned);
  for (const [ware,l] of Object.entries(s.ledger)) {
    const actual = sum(Object.values(s.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(s.ships).map(x=>x.ladung[ware]||0));
    assert.equal(actual,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
  }
  if(s.haushaltNeuLedger) {
    const l=s.haushaltNeuLedger;
    assert.equal(sum(Object.values(s.stations).map(x=>x.lokalNeuNahrung||0))+
      sum(Object.values(s.ships).map(x=>x.neuLadungNahrung||0))+l.ausgelagert+l.konsumiert,l.produziert);
    assert.equal(sum(Object.values(s.stats.haushaltskauf).map(x=>x.menge)),l.konsumiert);
    provenance.pruefe(s);
  }
  assert(core.audit(s).ok);
  for (const o of Object.values(s.owners)) assert(Number.isSafeInteger(o.cash)&&o.cash>=0);
}

// A: actual municipal purchases of physical consumption, paid at the unchanged
// spot price, only from existing local fund cash. Households buy new food first
// under the original rule. No cash-based rescue, goods grant, new wage or mint.
const publicConsumption = `function verbrauch(state, rules) {
  for (const id of ids(state.stations)) {
    const st=state.stations[id], bedarf=rules.world.stations[id].verbrauch;
    const f=state.owners[fondsIn(rules,st.system)];
    for (const ware of ids(bedarf)) {
      const da=anzahl(st.lager,ware), p=preis(state,id,ware,rules);
      let remaining=Math.min(da,bedarf[ware]), n=0;
      const tracked=ware==='nahrung'&&m_core_herkunft.aktiv(state,rules);
      const alt=tracked?da-st.lokalNeuNahrung:da;
      const hh=state.owners['hh_'+id];
      // Preserve ALT-first provenance and the original household affordability.
      const oldPublic=Math.min(remaining,alt,Math.floor(f.cash/p));
      let publicQty=oldPublic;
      remaining-=oldPublic; n+=oldPublic;
      const hhQty=tracked&&oldPublic===Math.min(alt,Math.min(da,bedarf[ware]))
        ?Math.min(remaining,st.lokalNeuNahrung,Math.floor(hh.cash/p)):0;
      if(hhQty) {
        const money=hhQty*p; hh.cash-=money; state.owners[id].cash+=money;
        buche(state,'hh_'+id,'kosten',money);buche(state,id,'erloes',money);
        __bk12.post(state,'household', 'hh_'+id,id,money,{ware,qty:hhQty});
      }
      remaining-=hhQty; n+=hhQty;
      const newPublic=tracked?Math.min(remaining,st.lokalNeuNahrung-hhQty,
        Math.floor((f.cash-oldPublic*p)/p)):0;
      publicQty+=newPublic; n+=newPublic;
      if(publicQty) {
        const money=publicQty*p; f.cash-=money; state.owners[id].cash+=money;
        buche(state,fondsIn(rules,st.system),'kosten',money);buche(state,id,'erloes',money);
        __bk12.post(state,'public-consumption',fondsIn(rules,st.system),id,money,
          {ware,qty:publicQty,old:oldPublic,new:newPublic});
      }
      if(tracked) {
        const paidNew=hhQty+newPublic;
        st.lokalNeuNahrung-=paidNew;state.haushaltNeuLedger.konsumiert+=paidNew;
        state.haushaltNeuLedger.altVerbraucht+=oldPublic;
        // Historical field counts all actually paid new consumption in A/C.
        // Separate journal payers are authoritative for HH vs public spending.
        state.stats.haushaltskauf[id].menge+=paidNew;
        state.stats.haushaltskauf[id].isk+=paidNew*p;
        state.stats.haushaltskauf[id].alt+=oldPublic;
        state.stats.haushaltskauf[id].fehlend+=bedarf[ware]-n;
      }
      st.lager[ware]=da-n;state.ledger[ware].consumed+=n;
      __bk12.consumed(state,id,ware,n,publicQty*p+hhQty*p);
      if(n<bedarf[ware])state.stats.mangel[id][ware]+=1;
    }
  }
}
`;
const householdConsumption = `function verbrauch(state, rules) {
  for(const id of ids(state.stations)) {
    const st=state.stations[id],bedarf=rules.world.stations[id].verbrauch;
    const hh=state.owners['hh_'+id];
    for(const ware of ids(bedarf)) {
      const da=anzahl(st.lager,ware),p=preis(state,id,ware,rules);
      const n=Math.min(da,bedarf[ware],Math.floor(hh.cash/p)),money=n*p;
      if(money) {
        hh.cash-=money;state.owners[id].cash+=money;
        buche(state,'hh_'+id,'kosten',money);buche(state,id,'erloes',money);
        __bk12.post(state,'household','hh_'+id,id,money,{ware,qty:n});
      }
      if(ware==='nahrung'&&m_core_herkunft.aktiv(state,rules)) {
        const old=Math.min(da-st.lokalNeuNahrung,n),neu=n-old;
        st.lokalNeuNahrung-=neu;state.haushaltNeuLedger.konsumiert+=neu;
        state.haushaltNeuLedger.altVerbraucht+=old;
        state.stats.haushaltskauf[id].menge+=neu;state.stats.haushaltskauf[id].isk+=neu*p;
        state.stats.haushaltskauf[id].alt+=old;state.stats.haushaltskauf[id].fehlend+=bedarf[ware]-n;
      }
      st.lager[ware]=da-n;state.ledger[ware].consumed+=n;
      __bk12.consumed(state,id,ware,n,money);
      if(n<bedarf[ware])state.stats.mangel[id][ware]+=1;
    }
  }
}
`;

export function model({variant='reference', observe=true, source=fixture, traceSource=false}={}) {
  const log={trades:[],payments:[],losses:[],departures:[],costs:[],consumption:[],production:[],net:{}, phases:0};
  // Only enabled in the isolated Nadir microcase: zero initial ice/food, held
  // competing freighters. Thus every traced unit has a real acquisition receipt.
  const ice=[],food=[],pending=new Map(),realized=[];
  const take=(lots,n)=>{assert(lots.length>=n,'no invented FIFO inputs');return lots.splice(0,n);};
  let js=source;
  const once=(a,b)=>{assert.equal(js.split(a).length,2,'unique anchor '+a.slice(0,80));js=js.replace(a,b);};
  if(variant==='public'||variant==='combined') {
    const a=js.indexOf('function verbrauch(state, rules) {');
    const b=js.indexOf('function betriebskosten(state, rules) {',a);
    assert(a>0&&b>a);js=js.slice(0,a)+publicConsumption+js.slice(b);
  }
  if(variant==='household'||variant==='household-roundtrip') {
    const a=js.indexOf('function verbrauch(state, rules) {');
    const b=js.indexOf('function betriebskosten(state, rules) {',a);
    assert(a>0&&b>a);js=js.slice(0,a)+householdConsumption+js.slice(b);
  }
  if(['roundtrip','combined','household-roundtrip'].includes(variant)) {
    once('      if (gewinn <= 0) continue;',
      `      const fahrt=Math.ceil(r.zeit*rules.world.betriebskosten.frachter/rules.economy.stunde);
      // Conservative closed journey: reserve value of an empty return too.
      // No assumption of a future paid backhaul or unchanged destination price.
      const netto=gewinn-2*fahrt;
      if (netto <= 0 || kasse < menge*pHier+gebuehr(state,rules,station,menge*pHier)+2*fahrt) continue;`);
    once('      const wertung = gewinn * (1000 + bonus);','      const wertung = netto * (1000 + bonus);');
    once('    else if (s.warten >= 2) {','    else if (false && s.warten >= 2) {');
  }
  const api={
    post(s,kind,from,to,isk,info={}) { if(observe)log.payments.push({tick:s.tick,kind,from,to,isk,...info}); },
    consumed(s,station,ware,qty,paid) {
      if(observe)log.consumption.push({tick:s.tick,station,ware,qty,paid});
      if(traceSource&&station==='st_nadir'&&ware==='nahrung'&&qty) {
        const lots=take(food,qty);realized.push({tick:s.tick,qty,paid,cost:sum(lots.map(x=>x.cost)),lots});
      }
    },
    trade(s,r,sh,station,ware,qty,buy,value,fee,recipient) {
      if(!observe)return;
      const data={tick:s.tick,ship:sh.id,owner:sh.owner,klasse:sh.klasse,station,ware,qty,buy,value,fee,recipient};
      log.trades.push(data);
      this.post(s,'trade',buy?sh.owner:station,buy?station:sh.owner,value,data);
      if(fee)this.post(s,'fee',sh.owner,recipient,fee,{ship:sh.id,ware});
      if(traceSource&&station==='st_nadir') {
        if(ware==='eis') {
          if(buy)take(ice,qty);
          else for(let i=0;i<qty;i++)ice.push({tick:s.tick,ship:sh.id,cost:value/qty});
        }
        if(ware==='nahrung'&&buy) {
          const lots=take(food,qty);realized.push({tick:s.tick,qty,paid:value,cost:sum(lots.map(x=>x.cost)),lots});
        }
      }
    },
    phase(name,s,fn,args) {
      if(!observe)return fn(...args);
      const before=capital(s),mint=s.minted,burn=s.burned;
      const beforeDock=['entscheidung','command','ersatzkauf'].includes(name)
        ?new Set(Object.values(s.ships).filter(x=>x.phase==='reise').map(x=>x.id)):null;
      const out=fn(...args), after=capital(s);
      if(beforeDock)for(const sh of Object.values(s.ships))if(sh.phase==='reise'&&!beforeDock.has(sh.id))
        log.departures.push({tick:s.tick,phase:name,ship:sh.id,owner:sh.owner,klasse:sh.klasse,
          destination:sh.ziel,arrival:sh.ankunft,reserve:sh.vertrag?s.vertraege.eintraege[sh.vertrag].rest:0,
          cargo:{...sh.ladung}});
      const row=log.net[name]||=(Object.fromEntries(Object.keys(before).map(id=>[id,0])));
      for(const id of Object.keys(after))row[id]=(row[id]||0)+after[id]-(before[id]||0);
      row.minted=(row.minted||0)+s.minted-mint;row.burned=(row.burned||0)+s.burned-burn;
      log.phases++;
      return out;
    },
    cost(s,sh,due,paid) {if(observe)log.costs.push({tick:s.tick,ship:sh.id,owner:sh.owner,klasse:sh.klasse,due,paid});},
    loss(s,sh) {if(observe)log.losses.push({tick:s.tick,ship:sh.id,owner:sh.owner,klasse:sh.klasse,cargo:{...sh.ladung}});},
    start(s,r,id,line,recipe) {
      if(traceSource&&id==='st_nadir'&&recipe==='r_nahrung')
        pending.set(line,{tick:s.tick,inputs:take(ice,2),wage:r.world.produktionslohnJeMinute*6});
    },
    produced(s,id,line,recipe,qty) {
      if(observe)log.production.push({tick:s.tick,station:id,line,recipe,qty});
      if(traceSource&&id==='st_nadir'&&recipe==='r_nahrung') {
        const lot=pending.get(line);assert(lot);pending.delete(line);
        food.push({...lot,finished:s.tick,cost:sum(lot.inputs.map(x=>x.cost))+lot.wage});
      }
    },
    sourceTrace(){return {ice,food,pending:[...pending.values()],realized};}
  };
  if(observe) {
    once("  buche(state, schiff.owner, 'kosten', fee);",
      "  buche(state, schiff.owner, 'kosten', fee);\n  __bk12.trade(state,rules,schiff,station,ware,menge,kauf,wert,fee,empfaenger);");
    once('    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;',
      '    const n = Math.min(besitzer.cash, kosten);\n    __bk12.cost(state,s,kosten,n);\n    if (n <= 0) continue;');
    once('function entfernen(state, rules, s) {','function entfernen(state, rules, s) {\n  __bk12.loss(state,s);');
    once('      state.owners[markt].cash -= wert; state.owners[owner].cash += wert;',
      "      __bk12.post(state,'pirate-loot',markt,owner,wert,{ship:s.id,ware,qty:m});\n      state.owners[markt].cash -= wert; state.owners[owner].cash += wert;");
    once("          state.stats.rezepte[id] += 1;",
      "          __bk12.produced(state,id,index,linie.rezept,r.aus);\n          state.stats.rezepte[id] += 1;");
    once('      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }',
      '      __bk12.start(state,rules,id,index,linie.rezept);\n      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }');
    once("    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {",
      "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n    __bk12.cost(state,s,kosten,kosten);\n  }\n  if (s.phase === 'dock') {");
    once("    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (!abschliessen(state, id))",
      "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n    __bk12.cost(state,s,kosten,kosten);\n  }\n  if (!abschliessen(state, id))");
    if(variant==='reference'||variant==='roundtrip') {
      once('      st.lager[ware] = da - n; state.ledger[ware].consumed += n;',
        "      __bk12.consumed(state,id,ware,n,ware==='nahrung'?(state.stats.haushaltskauf[id].isk-(__bk12.lastPaid?.[id]||0)):0);\n"+
        "      (__bk12.lastPaid||={})[id]=state.stats.haushaltskauf[id].isk;\n"+
        '      st.lager[ware] = da - n; state.ledger[ware].consumed += n;');
    }
    const start=js.indexOf('const m_core_step ='); const end=js.indexOf('const m_core_vertrag =',start);
    let step=js.slice(start,end);
    const names=['ankunft','foerderung','entscheidung','reise','produktion','escorteBewegen','verbrauch','betriebskosten','aussenhandel',
      'patrouille','ueberfall','piratenErsatz','schutzgeld','ersatzkauf','npcAusgaben','fonds','dividende'];
    for(const name of names) {
      assert.equal(step.split(name+'(state, rules)').length,2);
      step=step.replace(name+'(state, rules)',`__bk12.phase('${name}',state,${name},[state,rules])`);
    }
    step=step.replace('execute(state, cmd, rules)',"__bk12.phase('command',state,execute,[state,cmd,rules])");
    js=js.slice(0,start)+step+js.slice(end);
  }
  const modules=new Function('__bk12',js+';return {core:m_core_index,base:m_data_rules.RULES,provenance:m_core_herkunft};')(api);
  const rules={...modules.base,schema:9,rulesVersion:15,world:{...modules.base.world,
    produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
  return {...modules,rules,log,api,variant};
}

export function summary(s,m,initial,starting) {
  const {log,rules,core}=m, caps=capital(s), stations=Object.keys(s.stations).sort();
  const consumers=stations.filter(id=>(rules.world.stations[id].verbrauch.nahrung||0)>0);
  const byStation=Object.fromEntries(consumers.map(id=>[id,{
    cash:s.owners[id].cash,reserve:caps[id]-s.owners[id].cash,hh:s.owners['hh_'+id].cash,
    food:s.stations[id].lager.nahrung||0,newFood:s.stations[id].lokalNeuNahrung||0,
    med:s.stations[id].lager.medikamente||0,
    foodMissing:s.stats.mangel[id].nahrung-initial.stats.mangel[id].nahrung,
    medMissing:s.stats.mangel[id].medikamente-initial.stats.mangel[id].medikamente,
    paidNew:s.stats.haushaltskauf[id].menge-initial.stats.haushaltskauf[id].menge,
    oldConsumed:s.stats.haushaltskauf[id].alt-initial.stats.haushaltskauf[id].alt,
  }]));
  const trades=log.trades.filter(x=>x.klasse==='frachter'&&['npc1','npc2','npc3'].includes(x.owner));
  const costs=Object.fromEntries(['npc1','npc2','npc3','security','pirates','house'].map(id=>[id,{
    due:sum(log.costs.filter(x=>x.owner===id).map(x=>x.due)),paid:sum(log.costs.filter(x=>x.owner===id).map(x=>x.paid)),
  }]));
  for(const id of Object.keys(caps))assert.equal(caps[id],starting[id]+sum(Object.values(log.net).map(x=>x[id]||0)),id+' phase identity');
  return {variant:m.variant,tick:s.tick,hash:core.hash(s),money:s.initialSupply+s.minted-s.burned,
    minted:s.minted-initial.minted,burned:s.burned-initial.burned,
    cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),capital:caps,
    stations:byStation,foodMissing:sum(Object.values(byStation).map(x=>x.foodMissing)),
    medMissing:sum(Object.values(byStation).map(x=>x.medMissing)),
    paidNew:sum(Object.values(byStation).map(x=>x.paidNew)),
    buys:trades.filter(x=>x.buy).length,sales:trades.filter(x=>!x.buy).length,
    deliveredFood:sum(trades.filter(x=>!x.buy&&x.ware==='nahrung').map(x=>x.qty)),
    deliveredMed:sum(trades.filter(x=>!x.buy&&x.ware==='medikamente').map(x=>x.qty)),
    npcFreighters:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&x.owner.startsWith('npc')).length,
    losses:log.losses, replacementBuys:log.trades.filter(x=>x.buy&&['miner','frachter','jaeger'].includes(x.ware)),
    subsidy:s.stats.zuschuss-initial.stats.zuschuss,costs,net:log.net,
    traderCashflow:Object.fromEntries(['npc1','npc2'].map(id=>[id,{
      purchases:sum(trades.filter(x=>x.owner===id&&x.buy&&!['miner','frachter','jaeger'].includes(x.ware)).map(x=>x.value)),
      sales:sum(trades.filter(x=>x.owner===id&&!x.buy).map(x=>x.value)),
      fees:sum(log.trades.filter(x=>x.owner===id).map(x=>x.fee)),
      paidWork:costs[id].paid,
      hulls:sum(log.trades.filter(x=>x.owner===id&&x.buy&&['miner','frachter','jaeger'].includes(x.ware)).map(x=>x.value)),
      levy:-(log.net.npcAusgaben?.[id]||0),delta:caps[id]-starting[id]
    }])),
    freightDepartures:log.departures.filter(x=>x.klasse==='frachter').length,
    unreservedReplacementDepartures:log.departures.filter(x=>x.phase==='ersatzkauf'&&!x.reserve),
    pirateLoot:log.payments.filter(x=>x.kind==='pirate-loot'),
    publicPayments:sum(log.payments.filter(x=>x.kind==='public-consumption').map(x=>x.isk)),
    consumed:Object.fromEntries(['nahrung','medikamente','bauteil'].map(ware=>[ware,
      sum(log.consumption.filter(x=>x.ware===ware).map(x=>x.qty))])),
    paidConsumption:sum(log.consumption.map(x=>x.paid)),
    produced:Object.fromEntries(['nahrung','medikamente','frachter'].map(ware=>[ware,s.ledger[ware].produced-initial.ledger[ware].produced])),
    cargo:Object.fromEntries(Object.values(s.ships).filter(x=>Object.keys(x.ladung).length).map(x=>[x.id,{owner:x.owner,...x.ladung}]))};
}

// Common controls reproduce B-K11k-p: no station minimum/cap redistribution.
// No new rescue policy. Original hull grants are disabled equally in the strict
// comparison (the separate historical replay retains every original rule).
export function strictRules(m) {
  m.rules.world.mindeststand=0;m.rules.world.fondsObergrenze=1_000_000_000;
}
export const withoutGrants=fixture.replace('  if (n <= 0 || f.cash < n) return 0;', '  if (true) return 0;');
assert.notEqual(withoutGrants,fixture);

export function simulate({seed=7,variant='reference',minutes=1440,saved=null,strict=true,crisis=false,observe=true}={}) {
  const m=model({variant,observe,source:strict?withoutGrants:fixture});
  if(strict)strictRules(m);
  const s=saved?m.core.load(saved,undefined,m.rules):m.core.createState(seed,m.rules);
  if(crisis&&!saved) {
    // Existing player ships and commands only; unlimited savings stay untouched.
    for(const sh of Object.values(s.ships).filter(x=>x.owner==='house')) {
      const cmd=sh.klasse==='miner'?{type:'shipMine',ware:'erz'}:{type:'shipHandeln'};
      const accepted=m.core.submit(s,{owner:'house',schiff:sh.id,...cmd},m.rules);
      assert(accepted.ok,JSON.stringify(accepted));
    }
  }
  const initial=JSON.parse(JSON.stringify(s)),starting=capital(s),daily=[];
  audit(s,m.core,m.provenance);
  for(let i=0;i<minutes;i++) {
    m.core.step(s,m.rules);
    if(s.tick%60===0)audit(s,m.core,m.provenance);
    if(s.tick%1440===0) {
      const h=m.core.hash(s),copy=m.core.load(m.core.save(s),undefined,m.rules);
      assert.equal(m.core.hash(copy),h);daily.push(h);
    }
  }
  audit(s,m.core,m.provenance);
  const save=m.core.save(s);assert.equal(m.core.hash(m.core.load(save,undefined,m.rules)),m.core.hash(s));
  return {result:observe?summary(s,m,initial,starting):{hash:m.core.hash(s)},save,s,m,daily};
}
