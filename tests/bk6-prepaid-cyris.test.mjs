// B-K6 – unabhängiger Analysebeleg: vollständige Endkunden-Vorfinanzierung
// vor originalem Miner- und Fabrikbetrieb. Keine Produktregel und kein Minting.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('const m_data_systeme ='), html.indexOf('const m_data_oberflaeche ='));
const { core, rules, foerderung, handel, kosten, produktion, preis } = new Function(src +
  ';return {core:m_core_index,rules:m_data_rules.RULES,' +
  'foerderung:m_core_foerderung.foerderung,handel:m_core_handel.handel,' +
  'kosten:m_core_stunde.betriebskosten,produktion:m_core_produktion.produktion,' +
  'preis:m_core_preis.preis};')();
assert.equal(rules.rulesVersion, 14);
const S = 'st_cyris', F = 'fonds_cyris', M = 'npc3', H = 'haushalt_bk6', E = 'treuhand_bk6';
const HOURLY_UNITS = 3, RAW_UNITS = 6, CONTRACT_CAP = 120;
assert.equal(rules.world.stations[S].verbrauch.nahrung, HOURLY_UNITS);
assert.deepEqual(rules.economy.rezepte.r_nahrung.ein, {eis: 2});
assert.equal(rules.economy.rezepte.r_nahrung.dauer, 6);

function cash(s) { return Object.values(s.owners).reduce((v,o) => v + o.cash, 0); }
function audit(s) {
  assert(core.audit(s).ok, 'Original-Core-Audit');
  assert.equal(cash(s), s.initialSupply + s.minted - s.burned, 'unabhängige Geldbilanz');
  const stock = {};
  for (const st of Object.values(s.stations)) for (const [w,n] of Object.entries(st.lager)) {
    assert(Number.isSafeInteger(n) && n >= 0);
    stock[w] = (stock[w] || 0) + n;
  }
  for (const sh of Object.values(s.ships)) for (const [w,n] of Object.entries(sh.ladung)) {
    assert(Number.isSafeInteger(n) && n >= 0);
    stock[w] = (stock[w] || 0) + n;
  }
  for (const [w,l] of Object.entries(s.ledger))
    assert.equal(stock[w] || 0, l.initial + l.mined + l.produced + l.imported - l.consumed - l.exported, w);
}
function pay(s, from, to, amount, note) {
  assert(Number.isSafeInteger(amount) && amount >= 0, note);
  assert(s.owners[from].cash >= amount, note + ': ohne Deckung');
  s.owners[from].cash -= amount; s.owners[to].cash += amount;
}
function setup(seed = 42, householdStart = 900) {
  const s = core.createState(seed, rules);
  assert(s.owners[F].cash >= householdStart);
  s.owners[F].cash -= householdStart;
  for (const [id, initial] of [[H, householdStart], [E, 0]]) {
    s.owners[id] = {id,kind:id===H?'household':'escrow',cash:initial};
    s.stats.konto[id] = {erloes:0,kosten:0};
    s.stats.abgabe[id] = 0;
  }
  const miner = Object.values(s.ships).find(x => x.owner===M && x.klasse==='miner' &&
    x.system==='cyris' && x.ware==='eis');
  assert(miner);
  for (const sh of Object.values(s.ships)) {
    sh.arbeit = 0;
    if (sh !== miner) { sh.auftrag = 'halten'; sh.ware = null; }
  }
  for (const [id, st] of Object.entries(s.stations))
    st.linien = id===S ? st.linien.filter(x => x.rezept === 'r_nahrung') : [];
  assert.equal(s.stations[S].linien.length, 1);
  produktion(s, rules); // tatsächlich vorhandene 2 Eis in Original-WIP umwandeln
  assert.equal(s.stations[S].linien[0].rest, 6);
  audit(s);
  return {s,miner};
}
function oneOrder(s, miner, incomes = true) {
  // Vertrag: kein frei verfügbares Haushaltseinkommen, kein pauschales Stations-Budget.
  // Festes vorsichtiges Preislimit. Ein unfinanzierbarer Auftrag startet keinerlei Arbeit.
  if (s.owners[H].cash < CONTRACT_CAP || miner.auftrag !== 'foerdern' ||
      miner.phase !== 'dock' || miner.system !== 'cyris') return null;
  assert.equal(s.owners[E].cash, 0, 'kein offener/überlappender Auftrag');
  const rawPrice = preis(s,S,'eis',rules);
  const rawAdvance = RAW_UNITS * rawPrice;
  const minerWorkDue = Math.floor(rules.world.betriebskosten.miner * 6 / rules.economy.stunde);
  if (rawAdvance + 3 > CONTRACT_CAP || rawAdvance < minerWorkDue) return null;
  const before = {
    hh:s.owners[H].cash, st:s.owners[S].cash, miner:s.owners[M].cash,
    fund:s.owners[F].cash, mined:s.ledger.eis.mined,
    produced:s.ledger.nahrung.produced, consumed:s.ledger.nahrung.consumed,
  };
  // Treuhand als tatsächlicher separater Owner in der unveränderten Core-Bilanz.
  pay(s,H,E,CONTRACT_CAP,'Endabnehmer-Vorauszahlung');
  pay(s,E,S,rawAdvance,'zweckgebundener Vorschuss zur Rohstoffrechnung');
  assert.equal(s.owners[S].cash, before.st + rawAdvance);

  // Ausschließlich Originalförderung und Original-Handel. Stations-Grundkasse
  // bleibt nach dem rohen Einkauf exakt unangetastet.
  for (let i=0;i<6;i++) foerderung(s,rules);
  assert.equal(miner.arbeit,6);
  assert.equal(miner.ladung.eis, RAW_UNITS);
  assert(handel(s,rules,miner,S,'eis',RAW_UNITS,false));
  assert.equal(s.owners[S].cash, before.st, 'Rohstoffkauf allein durch Auftrag gedeckt');
  const afterTradeFund = s.owners[F].cash;
  kosten(s,rules);
  const paidWork = s.owners[F].cash - afterTradeFund;
  assert.equal(paidWork, minerWorkDue, 'vollständig gebuchte Minerarbeit');
  assert.equal(miner.arbeit,0);
  assert.equal(s.ledger.eis.mined-before.mined,6);
  for (let i=0;i<18;i++) produktion(s,rules);
  assert.equal(s.ledger.nahrung.produced-before.produced,HOURLY_UNITS);
  let foodRevenue=0;
  // Erfüllung gegen verbuchte Original-Ware und aktuelle originale Spotpreise.
  for (let i=0;i<HOURLY_UNITS;i++) {
    const p=preis(s,S,'nahrung',rules);
    assert(s.stations[S].lager.nahrung>0);
    s.stations[S].lager.nahrung--;s.ledger.nahrung.consumed++;
    foodRevenue+=p;
  }
  assert(foodRevenue >= rawAdvance + 3, 'kein negativer Fabrik-Rohbeitrag');
  assert(foodRevenue <= CONTRACT_CAP, 'Echtpreis überschreitet nicht den Vertragsdeckel');
  // Der Rohstoffvorschuss ist ein TEIL der Endrechnung, kein doppelter Umsatz.
  pay(s,E,S,foodRevenue-rawAdvance,'Restzahlung nach vollständig erbrachter Lieferung');
  pay(s,E,H,CONTRACT_CAP-foodRevenue,'unverbrauchten Vorschuss einmalig erstatten');
  assert.equal(s.owners[E].cash,0,'Auftrag sauber abgerechnet');
  const grossMine = s.owners[M].cash - before.miner;
  const grossStation = s.owners[S].cash - before.st;
  assert.equal(grossMine,60,'Netto-Miner nach echter Gebühr und Arbeit');
  assert.equal(grossStation,foodRevenue-rawAdvance);
  // Hypothetische, aber vollständig aus vorhandenen Konten finanzierte
  // Löhne/Dividenden. 6/3 sind Analyse-Rücklagen, KEIN Hüllenersatzbeleg.
  if(incomes){
    pay(s,M,H,grossMine-6,'Ausschüttung Miner-Überschuss');
    pay(s,S,H,grossStation-3,'Ausschüttung Fabrik-Überschuss');
    pay(s,F,H,paidWork,'tatsächlich vereinnahmter Arbeitslohn');
  }
  s.tick+=rules.economy.stunde;
  assert.equal(s.ledger.nahrung.consumed-before.consumed,HOURLY_UNITS);
  audit(s);
  return {foodRevenue,rawAdvance,paidWork,minerRetained:incomes?6:grossMine,
    factoryRetained:incomes?3:grossStation,household:s.owners[H].cash};
}
function run({seed=42,householdStart=900,hours=20,incomes=true}={}) {
  const {s,miner}=setup(seed,householdStart);
  const start={hh:s.owners[H].cash,miner:s.owners[M].cash,
    station:s.owners[S].cash,fund:s.owners[F].cash,
    mined:s.ledger.eis.mined,food:s.ledger.nahrung.produced,
    consumed:s.ledger.nahrung.consumed,supply:cash(s)};
  const log=[];
  for(let h=0;h<hours;h++){
    const result=oneOrder(s,miner,incomes);
    if(!result)break;
    log.push(result);
  }
  audit(s);
  return {s,start,log};
}

test('BK6: echtes Endkundenbudget finanziert 20 Original-Kern-Produktionszyklen ohne doppelte Auszahlung',()=>{
  const x=run();
  assert.equal(x.log.length,20);
  assert.equal(x.s.ledger.eis.mined-x.start.mined,120);
  assert.equal(x.s.ledger.nahrung.produced-x.start.food,60);
  assert.equal(x.s.ledger.nahrung.consumed-x.start.consumed,60);
  assert.equal(x.s.owners[H].cash,660);
  assert.equal(x.s.owners[M].cash-x.start.miner,120);
  assert.equal(x.s.owners[S].cash-x.start.station,60);
  assert.equal(x.s.owners[F].cash-x.start.fund,60);
  assert.equal(x.s.owners[E].cash,0);
  assert.equal(x.s.minted,0);assert.equal(x.s.burned,0);
  assert.equal(cash(x.s),x.start.supply);
  console.log('BK6_FUNDIERTE_ZELLE '+JSON.stringify({cycles:x.log.length,
    prepaidLimit:CONTRACT_CAP,first:x.log[0],last:x.log.at(-1),
    hhEnd:x.s.owners[H].cash,minerSaved:120,factorySaved:60,fundSaved:60,
    minted:x.s.minted,burned:x.s.burned}));
});
test('BK6: ohne Einkommen stoppt Auftrag nach 9 bezahlten Lieferungen vor Rohstoffbeschaffung',()=>{
  const x=run({incomes:false});
  assert.equal(x.log.length,9);
  assert(x.s.owners[H].cash<CONTRACT_CAP);
  assert.equal(x.s.owners[E].cash,0);
  assert.equal(x.s.ledger.eis.mined-x.start.mined,54);
  assert.equal(x.s.ledger.nahrung.consumed-x.start.consumed,27);
  console.log('BK6_NACHFRAGESTOPP '+JSON.stringify({orders:x.log.length,
    hhRemaining:x.s.owners[H].cash,refusedBeforeMining:true}));
});
test('BK6: bei 119 ISK kein Auftrag, kein Mining, keine Warenbuchung, kein unfinanzierter Vertrag',()=>{
  const {s,miner}=setup(42,119), hash=core.hash(s);
  assert.equal(oneOrder(s,miner),null);
  assert.equal(core.hash(s),hash);
  assert.equal(s.owners[E].cash,0);
  assert.equal(s.ledger.eis.mined,0);
});
test('BK6: bei fehlender Arbeitskapazität kein Auftrag und keine Buchung',()=>{
  const {s,miner}=setup();
  miner.auftrag='halten';
  const hash=core.hash(s);
  assert.equal(oneOrder(s,miner),null);
  assert.equal(core.hash(s),hash);
  assert.equal(s.owners[E].cash,0);
});
test('BK6: replizierbare 20h-Kasse/Ware/Hash in Seed7 und Seed42',()=>{
  for(const seed of [7,42]){
    const a=run({seed}),b=run({seed});
    assert.equal(a.log.length,20);
    assert.deepEqual(a.log,b.log);
    assert.equal(core.hash(a.s),core.hash(b.s));
    audit(a.s);audit(b.s);
  }
});


test('BK6: auch mit bezahlter Arbeit und Rücklagen endet der vorfinanzierte Zyklus ohne neuen Nachfragezufluss',()=>{
  // Kein neues Einkommen: nur Rückverteilung der bereits erzielten Erlöse.
  // 95 ISK Absatz minus 83 ISK vorfinanzierte Rückausschüttung = 12 ISK/h.
  const x=run({hours:90,incomes:true});
  assert.equal(x.log.length,66,'einmaliges Startkapital finanziert keinen Dauerbetrieb');
  assert.equal(x.s.owners[H].cash,108);
  assert.equal(x.s.owners[E].cash,0);
  assert.equal(x.s.ledger.eis.mined-x.start.mined,66*6);
  assert.equal(x.s.ledger.nahrung.consumed-x.start.consumed,66*3);
  assert.equal(x.s.minted,0);
  audit(x.s);
  console.log('BK6_LANGFRISTIGE_GRENZE '+JSON.stringify({
    completedHours:x.log.length,householdEnd:x.s.owners[H].cash,
    minerReserve:x.s.owners[M].cash-x.start.miner,
    factoryReserve:x.s.owners[S].cash-x.start.station,
    fundSavings:x.s.owners[F].cash-x.start.fund,
    refusedBeforeWork:true,minted:x.s.minted
  }));
});
