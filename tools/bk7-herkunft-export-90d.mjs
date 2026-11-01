// B-K7: Original-Regel14, echte stündliche Weltschritte, experimenteller
// Nachweisexport ausschließlich neuer lokaler Nahrung beim PRODUKTIONSEREIGNIS.
// Kein produktives Minting / kein neuer Core / keine Save-Migration.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src = html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='));
const needle = 'state.ledger[ware].produced += r.aus[ware];';
assert.equal(src.split(needle).length, 2, 'Originalrezept: eindeutiger Hook');
const traced = src.replace(needle, needle + ' witness.created(state, id, ware, r.aus[ware]);');

const RATE = 35;
const variants = {
  original: {qtyDay:0,price:0,dayISK:0,totalISK:0},
  unpaid: {qtyDay:6,price:0,dayISK:0,totalISK:0},
  modest: {qtyDay:6,price:RATE,dayISK:210,totalISK:10000},
  larger: {qtyDay:20,price:RATE,dayISK:700,totalISK:50000},
};
function makeWitness(variant) {
  const v=variants[variant];
  assert(v,'unbekannte Variante '+variant);
  const w={variant,day:-1,dayUnits:0,dayMint:0,
    units:0,contractPaid:0,certifiedProduction:0,events:0,
    byDay:{},note:'physischer Export beim originalen Rezeptabschluss, niemals Startlager'};
  w.created=(s,station,ware,n)=>{
    if(station!=='st_cyris' || ware!=='nahrung') return;
    assert(Number.isSafeInteger(n)&&n>0);
    w.certifiedProduction+=n;
    const day=Math.floor(s.tick/1440);
    if(day!==w.day) { w.day=day;w.dayUnits=0;w.dayMint=0; }
    const allowedDay=v.qtyDay-w.dayUnits;
    const allowedCurrency=v.price===0 ? n : Math.min(
      Math.floor((v.dayISK-w.dayMint)/v.price),
      Math.floor((v.totalISK-w.contractPaid)/v.price));
    const q=Math.max(0,Math.min(n,allowedDay,allowedCurrency));
    if(q===0)return;
    // Das neue Produkt wird exakt an seiner Entstehungsstelle aus dem
    // physischen Originalbestand entfernt. Es kann nie zugleich im
    // Startlager, Zivilverbrauch oder in einer Frachterladung landen.
    assert(s.stations[station].lager[ware]>=q);
    s.stations[station].lager[ware]-=q;
    s.ledger[ware].exported+=q;
    const amount=q*v.price;
    s.owners[station].cash+=amount;
    s.minted+=amount;
    s.stats.konto[station].erloes+=amount;
    w.contractPaid+=amount;w.dayMint+=amount;w.units+=q;w.dayUnits+=q;w.events++;
    w.byDay[day]??={units:0,paid:0};
    w.byDay[day].units+=q;w.byDay[day].paid+=amount;
    assert(w.dayMint<=v.dayISK && w.contractPaid<=v.totalISK);
  };
  return w;
}
function instantiate(w) {
  return new Function('witness',traced +
    ';return {core:m_core_index,rules:m_data_rules.RULES};')(w);
}
function cash(s) {return Object.values(s.owners).reduce((a,o)=>a+o.cash,0);}
function audit(s) {
  assert(s.owners.house.cash>=0);
  assert.equal(cash(s),s.initialSupply+s.minted-s.burned,'externe Geldbilanz');
  assert.equal(s.rulesVersion,14);
  assert.equal(s.schema,8);
  assert(s.minted>=0 && s.burned>=0);
  const physical={};
  for(const st of Object.values(s.stations)) for(const [w,n] of Object.entries(st.lager)) {
    assert(Number.isSafeInteger(n)&&n>=0);
    physical[w]=(physical[w]||0)+n;
  }
  for(const sh of Object.values(s.ships)) for(const [w,n] of Object.entries(sh.ladung)) {
    assert(Number.isSafeInteger(n)&&n>=0);
    physical[w]=(physical[w]||0)+n;
  }
  for(const [w,l] of Object.entries(s.ledger)) assert.equal(physical[w]||0,
    l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported, 'Warenerhaltung '+w);
}
function ships(s) {return Object.values(s.ships).filter(x=>
  (x.owner==='npc1'||x.owner==='npc2')&&x.klasse==='frachter').length;}
function wealth(s) {
  return {
    player:s.owners.house.cash,station: Object.values(s.owners).filter(x=>x.kind==='station').reduce((a,o)=>a+o.cash,0),
    trader: s.owners.npc1.cash+s.owners.npc2.cash,
    traderHulls:ships(s),shortages:Object.values(s.stats.mangel).reduce(
      (a,o)=>a+Object.values(o).reduce((x,n)=>x+n,0),0),
    traderSales:Object.entries(s.stats.verkaeufe).reduce((a,[id,n])=>
      a+(s.ships[id]&&s.ships[id].klasse==='frachter'&&
       ['npc1','npc2'].includes(s.ships[id].owner)?n:0),0),
    minted:s.minted,burned:s.burned,
  };
}
function world(seed,variant,days=90,traceHourly=true) {
  const w=makeWitness(variant),{core,rules}=instantiate(w);
  const s=core.createState(seed,rules);
  const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(miner);
  assert(core.execute(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},rules).ok);
  const points=[0,1,3,7,14,30,60,90], timeline=[{day:0,...wealth(s)}];
  for(let day=1;day<=days;day++) {
    for(let hour=0;hour<24;hour++) {
      core.advance(s,60,rules);
      if(traceHourly) { assert(core.audit(s).ok);audit(s); }
    }
    if(points.includes(day)) timeline.push({day,...wealth(s),exported:w.units,contractISK:w.contractPaid});
    if(!traceHourly) {assert(core.audit(s).ok);audit(s);}
  }
  assert(core.audit(s).ok);audit(s);
  assert.equal(s.ledger.nahrung.exported>=w.units,true);
  assert(w.units<=w.certifiedProduction);
  assert.equal(w.contractPaid, w.units*variants[variant].price);
  assert.equal(w.contractPaid, Object.values(w.byDay).reduce((a,o)=>a+o.paid,0));
  assert.equal(w.units, Object.values(w.byDay).reduce((a,o)=>a+o.units,0));
  assert(Object.values(w.byDay).every(o=>
    o.units<=variants[variant].qtyDay&&o.paid<=variants[variant].dayISK));
  const result={seed,variant,days,exported:w.units,paid:w.contractPaid,
    certifiedProduction:w.certifiedProduction,contractEvents:w.events,
    fullAudit:traceHourly,dayEvents:Object.keys(w.byDay).length,
    end:wealth(s),timeline,hash:core.hash(s)};
  return result;
}
function isolationTest() {
  const witness=makeWitness('larger');
  const {core,rules}=instantiate(witness);
  const s=core.createState(42,rules);
  // Ohne Produktionslinie gibt es trotz Startlager Nahrung keine Zertifizierung.
  const old=s.stations.st_cyris.lager.nahrung;
  s.stations.st_cyris.linien=[];
  core.advance(s,180,rules);
  assert.equal(witness.units,0);
  assert.equal(witness.contractPaid,0);
  assert.equal(s.stations.st_cyris.lager.nahrung<=old,true);
  assert(core.audit(s).ok);audit(s);
  const w2=makeWitness('modest'), x=instantiate(w2);
  const q=x.core.createState(42,x.rules);
  for(const [id,st] of Object.entries(q.stations))
    st.linien=id==='st_cyris'?st.linien.filter(l=>l.rezept==='r_nahrung'):[];
  for(const ship of Object.values(q.ships)){ship.auftrag='halten';ship.arbeit=0;}
  const beforeProduced=q.ledger.nahrung.produced,
        beforeExported=q.ledger.nahrung.exported,
        beforeMint=q.minted, beforeMoney=cash(q);
  for(let i=0;i<7;i++) x.core.step(q,x.rules);
  assert(w2.certifiedProduction>=1);
  assert(w2.units>=1);
  assert.equal(q.ledger.nahrung.exported-beforeExported,w2.units);
  assert.equal(q.minted-beforeMint,w2.contractPaid);
  assert.equal(cash(q)-beforeMoney,w2.contractPaid);
  assert(q.ledger.nahrung.produced-beforeProduced>=w2.units);
  assert(x.core.audit(q).ok);audit(q);
  // Derselbe Replay-Seed -> derselbe Endhash, ohne Wallclock/Math.random.
  const w3=makeWitness('modest'), y=instantiate(w3);
  const p=y.core.createState(42,y.rules);
  for(const [id,st] of Object.entries(p.stations))
    st.linien=id==='st_cyris'?st.linien.filter(l=>l.rezept==='r_nahrung'):[];
  for(const ship of Object.values(p.ships)){ship.auftrag='halten';ship.arbeit=0;}
  for(let i=0;i<7;i++) y.core.step(p,y.rules);
  assert.equal(x.core.hash(q),y.core.hash(p));
  console.log('BK7_PROVENIENZ_GATE '+JSON.stringify({
    startFood:old,initialStockPayment:0,newProduction:q.ledger.nahrung.produced-beforeProduced,
    exported:w2.units,paid:w2.contractPaid,coreHash:x.core.hash(q)}));
}
isolationTest();
const all=[];
for(const seed of [7,42]){
  for(const variant of ['original','unpaid','modest','larger']){
    const x=world(seed,variant);
    all.push(x);
    console.log('BK7_WELT_90D '+JSON.stringify(x));
  }
  // Wiederholung inklusive Core-Hash; spart keine Audits in Hauptläufen.
  const prior=all.find(x=>x.seed===seed&&x.variant==='modest');
  const replay=world(seed,'modest',90,false);
  assert.equal(prior.hash,replay.hash,'deterministischer Re-Run');
  assert.deepEqual(prior.timeline,replay.timeline);
  console.log('BK7_REPLAY '+JSON.stringify({seed,variant:'modest',hash:replay.hash,ok:true}));
}
assert.equal(all.length,8);
console.log('BK7_DONE '+JSON.stringify({worlds:all.length,seeds:[7,42],
  scenarios:['original','unpaid','modest','larger'],days:90,
  independentlyAuditedWorldHours:8*90*24,
  replayWorlds:2,ruleVersion:14,schema:8,
  note:'Keine Produktregel; externer Abnehmer nur im instrumentierten Analyse-Core.'}));
