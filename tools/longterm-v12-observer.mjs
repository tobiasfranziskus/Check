// Read-only Beobachter im extrahierten Produktionskern; kein zweiter Simulationskern.
import assert from 'node:assert/strict';
export const sum = a => a.reduce((x, y) => x + y, 0);
const add = (o, k, n) => { o[k] = (o[k] || 0) + n; };
const copy = o => structuredClone(o);
export function coreSource(html) {
  const start = html.indexOf('<script>') + 8, end = html.indexOf('const m_data_oberflaeche');
  assert(start >= 8 && end > start, 'Produktionskern nicht gefunden');
  return html.slice(start, end);
}
export function engine(source, observer) {
  let text = source;
  const hook = (anchor, insertion, count = 1) => {
    assert.equal(text.split(anchor).length - 1, count, 'Beobachteranker: ' + anchor);
    text = text.replaceAll(anchor, anchor + '\n' + insertion);
  };
  if (observer) {
    hook("buche(state, schiff.owner, 'kosten', fee);", 'watch.trade(state,schiff,station,ware,menge,kauf,wert,fee,empfaenger);');
    hook('const n = Math.min(besitzer.cash, kosten);', 'watch.cost(state,s,kosten,n,system,rules);');
    hook('o[id].cash -= n; o[ziel].cash += n;', "watch.flow('npcAbgabe',id,ziel,n);");
    hook('f.cash -= n; o[id].cash += n;', "watch.flow('fondsLokal',f.id,id,n);");
    hook('o[arm].cash += f.cash - w.fondsObergrenze;', "watch.flow('fondsGlobal',f.id,arm,f.cash-w.fondsObergrenze);");
    hook('f.cash -= n; state.owners[owner].cash += n;', "watch.flow('ersatzZuschuss',f.id,owner,n);");
    hook('state.owners[id].cash -= n; state.owners[spieler].cash += n;', "watch.flow('dividende',id,spieler,n);");
    hook('state.owners[markt].cash -= wert; state.owners[owner].cash += wert;', "watch.flow('beuteVerkauf',markt,owner,wert);");
    hook('state.owners[owner].cash -= p; state.owners[markt].cash += p;', "watch.flow('piratenErsatz',owner,markt,p);");
    hook('state.owners[st].cash -= n; state.owners[w.piraten.owner].cash += n;', "watch.flow('schutzgeld',st,w.piraten.owner,n);");
    hook('state.owners[g.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;', "watch.flow('kopfgeld',null,g.owner,geld);");
    hook('state.owners[ziel.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;', "watch.flow('kopfgeld',null,ziel.owner,geld);");
    hook('state.burned += preis;', "watch.flow('stationskauf',cmd.owner,null,preis);");
    hook("if (s.phase === 'reise') { s.arbeit += 1;", 'watch.transport(s);');
    hook('function entfernen(state, rules, s) {', 'watch.lost(s);');
    hook('    state.ledger[ware].consumed += n;', "watch.consume('frachtverlust',s.system,ware,n);", 1);
    hook('state.ledger[ware].consumed += rest;', "watch.consume('frachtverlust',s.system,ware,rest);");
    hook('st.lager[ware] = da - n; state.ledger[ware].consumed += n;', "watch.consume('grundverbrauch',id,ware,n);");
    hook('state.ledger[ware].consumed += r.ein[ware];', "watch.consume('rezepte',id,ware,r.ein[ware]);");
    hook('state.ledger[ware].produced += r.aus[ware];', 'watch.produced(id,ware,r.aus[ware]);');
    hook('state.ledger[ware].mined += n;', 'watch.mined(s.system,ware,n);');
    hook('state.ledger[cmd.klasse].consumed += 1;', "watch.consume('aktivierung',traeger.system,cmd.klasse,1);");
    hook('state.ledger[x.klasse].consumed += 1;', "watch.consume('aktivierung',von,x.klasse,1);");
  }
  return new Function('watch', text + ';return {c:m_core_index,r:m_data_rules.RULES};')(observer);
}
export class Observer {
  constructor(initial) {
    this.initial = Object.fromEntries(Object.entries(initial.owners).map(([id, o]) => [id, o.cash]));
    this.balance = {}; this.flows = {}; this.costs = {}; this.trades = {}; this.consumeRows = {};
    this.production = {}; this.mining = {}; this.transportRows = {}; this.inventory = new Map();
    this.liquidity = {}; this.prices = {}; this.fleet = {}; this.stockRanges = {};
  }
  flow(kind, from, to, n) {
    assert(Number.isSafeInteger(n) && n >= 0, kind);
    if (!n) return;
    add(this.flows, kind + ':' + (from || 'MINT') + '>' + (to || 'BURN'), n);
    if (from) add(this.balance, from, -n);
    if (to) add(this.balance, to, n);
  }
  trade(state, ship, station, ware, n, buy, value, fee, recipient) {
    this.flow('handel', buy ? ship.owner : station, buy ? station : ship.owner, value);
    this.flow('gebuehr', ship.owner, recipient, fee);
    const key = [ship.owner, ship.klasse, ware, buy ? 'kauf' : 'verkauf'].join('/');
    const row = this.trades[key] ||= { count: 0, units: 0, value: 0, fees: 0, matchedUnits: 0, realizedMargin: 0, unpurchasedUnits: 0 };
    row.count++; row.units += n; row.value += value; row.fees += fee;
    // FIFO-Einstand inkl. Kaufgebühr; Förderung hat keinen Handelseinstand.
    const invkey = ship.id + '/' + ware, lots = this.inventory.get(invkey) || [];
    if (buy) { lots.push({ n, unitCost: (value + fee) / n }); this.inventory.set(invkey, lots); }
    else {
      let left = n;
      while (left && lots.length) {
        const lot = lots[0], used = Math.min(left, lot.n);
        row.matchedUnits += used;
        row.realizedMargin += used * ((value - fee) / n - lot.unitCost);
        lot.n -= used; left -= used;
        if (!lot.n) lots.shift();
      }
      row.unpurchasedUnits += left;
      if (!lots.length) this.inventory.delete(invkey);
    }
    // Bezahlte Schiffshülle wird unmittelbar aktiviert, kein Handelsinventar.
    if (buy && ['miner', 'frachter', 'jaeger', 'bauschiff'].includes(ware) && n === 1 && !ship.ladung[ware]) this.inventory.delete(invkey);
  }
  lost(ship) {
    for (const key of this.inventory.keys()) if (key.startsWith(ship.id + '/')) this.inventory.delete(key);
  }
  cost(state, ship, due, paid, system, rules) {
    const row = this.costs[ship.owner] ||= { due: 0, paid: 0, unpaid: 0, shortageCharges: 0, firstUnpaidTick: null, lastUnpaidTick: null };
    row.due += due; row.paid += paid; row.unpaid += due - paid;
    if (due > paid) { row.shortageCharges++; row.firstUnpaidTick ??= state.tick; row.lastUnpaidTick = state.tick; }
    this.flow(rules.world.senkeBesitzer.includes(ship.owner) ? 'sicherheitskosten' : 'betriebskosten', ship.owner,
      rules.world.senkeBesitzer.includes(ship.owner) ? null : rules.world.systems[system].fonds, paid);
  }
  consume(reason, station, ware, n) { add(this.consumeRows, [reason, station, ware].join('/'), n); }
  produced(station, ware, n) { add(this.production, station + '/' + ware, n); }
  mined(system, ware, n) { add(this.mining, system + '/' + ware, n); }
  transport(ship) {
    const row = this.transportRows[ship.owner] ||= { shipMinutes: 0, cargoUnitMinutes: 0, loadedShipMinutes: 0 };
    const cargo = sum(Object.values(ship.ladung));
    row.shipMinutes++; row.cargoUnitMinutes += cargo; if (cargo) row.loadedShipMinutes++;
  }
  hourly(s, c, r) {
    for (const [id, o] of Object.entries(s.owners)) {
      assert.equal(o.cash, this.initial[id] + (this.balance[id] || 0), 'Einzelkassenfluss ' + id + '/' + s.tick);
      const q = this.liquidity[id] ||= { min: o.cash, max: o.cash, zeroHours: 0, below2500Hours: 0, lastZeroTick: null };
      q.min = Math.min(q.min, o.cash); q.max = Math.max(q.max, o.cash);
      if (o.cash === 0) { q.zeroHours++; q.lastZeroTick = s.tick; }
      if (o.kind === 'station' && o.cash < r.world.mindeststand) q.below2500Hours++;
    }
    for (const [st, cfg] of Object.entries(r.world.stations)) for (const ware of Object.keys(cfg.ziel)) {
      const key = st + '/' + ware, p = c.preis(s, st, ware, r);
      const row = this.prices[key] ||= { min: p, max: p, sum: 0, samples: 0 };
      row.min = Math.min(row.min, p); row.max = Math.max(row.max, p); row.sum += p; row.samples++;
      const stock = s.stations[st].lager[ware] || 0;
      const range = this.stockRanges[key] ||= { min: stock, max: stock, zeroHours: 0 };
      range.min = Math.min(range.min, stock); range.max = Math.max(range.max, stock); if (!stock) range.zeroHours++;
    }
    for (const [owner, target] of Object.entries(s.sollflotte)) {
      if (owner === 'house') continue;
      const count = Object.values(s.ships).filter(sh => sh.owner === owner).length;
      const q = this.fleet[owner] ||= { target: target.length, min: count, maxMissing: 0, missingShipHours: 0, zeroFleetHours: 0, longestZeroHours: 0, currentZeroHours: 0 };
      q.min = Math.min(q.min, count); const missing = Math.max(0, target.length - count);
      q.maxMissing = Math.max(q.maxMissing, missing); q.missingShipHours += missing;
      q.currentZeroHours = count ? 0 : q.currentZeroHours + 1;
      if (!count) q.zeroFleetHours++;
      q.longestZeroHours = Math.max(q.longestZeroHours, q.currentZeroHours);
    }
    for (const [ware, ledger] of Object.entries(s.ledger)) {
      const consumed = sum(Object.entries(this.consumeRows).filter(([k]) => k.endsWith('/' + ware)).map(([, n]) => n));
      assert.equal(consumed, ledger.consumed, 'Verbrauchsgründe ' + ware);
    }
  }
  snapshot() {
    return copy({ flows: this.flows, costs: this.costs, trades: this.trades, consumption: this.consumeRows,
      production: this.production, mining: this.mining, transport: this.transportRows,
      liquidity: this.liquidity, prices: this.prices, fleet: this.fleet, stockRanges: this.stockRanges });
  }
}
export function independentAudit(s) {
  assert.equal(sum(Object.values(s.owners).map(o => o.cash)), s.initialSupply + s.minted - s.burned, 'Geldsumme');
  for (const o of Object.values(s.owners)) assert(Number.isSafeInteger(o.cash) && o.cash >= 0, 'Kassenbereich ' + o.id);
  for (const [ware, l] of Object.entries(s.ledger)) {
    const stocks = [...Object.values(s.stations).map(st => st.lager[ware] || 0), ...Object.values(s.ships).map(sh => sh.ladung[ware] || 0)];
    assert(stocks.every(n => Number.isSafeInteger(n) && n >= 0), 'Warenbereich ' + ware);
    assert.equal(sum(stocks), l.initial + l.mined + l.produced + l.imported - l.consumed - l.exported, 'Warenbilanz ' + ware);
  }
}
