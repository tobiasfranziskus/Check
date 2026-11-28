'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const J8 = require('../prototypes/verbund/konzern-session.js');
const OldSession = require('../prototypes/w5ac/session.js');
const Manager = require('../prototypes/spiel/p3-manager-disposition.js');
const Industry = require('../prototypes/spiel/p3-industrie.js');
const { pruefen } = require('../tools/w6-szenarien.cjs');

const DAY = 1440;
const END = 60 * DAY;
const STRATEGIES = [
  'standard', 'standard-etappen', 's02-aldera', 's02-werft', 's02-werft-etappen',
  's02-werft-etappen-ersatz',
];

function start(s02) {
  const session = J8.erstellen();
  session.starten208(true, s02);
  return session;
}

function reload(json) {
  const session = J8.erstellen();
  session.oeffnen208(json, true);
  assert.equal(session.exportieren(), json);
  return session;
}

function quote(session) {
  const json = session.exportieren();
  const s = session.zustandReferenz();
  const w = session.weltReferenz();
  const offers = session.angebote();
  const manager = Manager.auswerten(w, s, offers);
  const industry = Industry.auswerten(w, s, offers);
  assert.equal(session.exportieren(), json);
  return { w, s, offers, manager, industry };
}

function reject(session, id, reason) {
  const json = session.exportieren();
  const result = session.ausfuehren(id);
  assert.equal(result.ok, false, id);
  if (reason) assert.equal(result.reason, reason, id);
  assert.equal(session.exportieren(), json, id);
  return { id, reason: result.reason };
}

function audit(w, s) {
  assert.deepEqual(pruefen(w, s), []);
  const book = s.kanon.spielerFrachten;
  let fees = 0;
  let wages = 0;
  for (const trip of book?.auftraege ?? []) {
    assert.equal(s.ships[trip.schiff].owner, 'house');
    if (trip.end !== null) {
      assert.deepEqual(
        [trip.menge, trip.fracht, trip.arbeit, trip.geliefert - trip.start, trip.end - trip.start],
        [50, 240, 120, 60, 120],
      );
      fees += trip.fracht;
      wages += trip.arbeit;
    } else {
      assert.equal(s.w5n.frachtauftrag?.schiff, trip.schiff);
      wages += s.w5n.frachtauftrag.gearbeitet;
    }
    assert.equal(trip.tor, undefined);
  }
  assert.equal(book?.gebuehr ?? 0, fees);
  assert.equal(book?.lohn ?? 0, wages);
  assert.equal(s.kanon.buch.summen['wasser-einzelhandel|pilot_house|st_aldera'] ?? 0, 0);
  for (const ferry of s.w5ac.completed.filter(f => f.owner === 'house')) {
    assert.equal(s.ships[ferry.id].owner, 'house');
    assert.ok(s.w5.schiffIds.includes(ferry.id));
    assert.deepEqual([ferry.kosten, ferry.minuten, ferry.ankunft - ferry.start], [60, 60, 60]);
  }
}

function snapshot({ w, s, manager, industry, offers }) {
  audit(w, s);
  const house = Object.values(s.ships).filter(ship => ship.owner === 'house');
  const report = w.bericht(s);
  return structuredClone({
    tick: s.tick, hash: w.hash(s), cash: Object.fromEntries(
      Object.entries(s.owners).map(([id, owner]) => [id, owner.cash]),
    ),
    book: s.stats.konto.house, ledger: s.ledger, bottlenecks: report.engpass,
    stocks: { aldera: s.stations.st_aldera.lager, nadir: s.stations.st_nadir.lager },
    house: house.map(ship => ({
      id: ship.id, class: ship.klasse, system: ship.system, phase: ship.phase,
      order: ship.auftrag, cargo: ship.ladung, shuttle: s.kanon.pendel[ship.id] ?? null,
      remaining: w.restAktivminuten(s, ship.id), retired: w.stillgelegt(s, ship.id),
      bookValue: w.buchwert(s, ship.id), sales: s.stats.verkaeufe[ship.id],
    })),
    manager, industry, offers: offers.filter(o => !o.id.startsWith('water-')),
    active: {
      ore: s.w3.auftrag, contract: s.kanon.industrieErz, refinery: s.w4.auftrag,
      yard: s.w5.auftrag, ice: s.w5n.frachtauftrag, factory: s.w5n.fabrikauftrag,
      ferry: s.w5ac.active, oreMining: s.erzpilotVertraege, waterBackhaul: s.kanon.rueckfracht,
    },
    world: {
      money: report.weltgeld, escrow: report.gebunden, minted: s.minted, burned: s.burned,
      w3: s.w3.abgeschlossen, w4: s.w4.abgeschlossen, w5: s.w5.fertig,
      iceTrips: s.w5n.frachtAbgeschlossen, waterBatches: s.w5n.fabrikFertig,
      npcReplacementPurchases: report.ersatzkaeufe, waterSales: report.verkaeufe.wasserErloes,
    },
  });
}

function run(strategy) {
  const s02 = strategy.startsWith('s02-');
  const earlyReplacement = strategy === 's02-werft-etappen-ersatz';
  const paced = strategy.endsWith('-etappen') || earlyReplacement;
  let session = start(s02);
  const events = [];
  const saves = new Map();
  const checkpoints = {};
  const sales = [];
  let lastRevenue = 0;
  let lastIceSale = -DAY;
  let lastFreight = -DAY;
  let freightFees = 0;
  let lastReceiptSave;
  const rejected = [];

  function checkpoint(label) {
    const json = session.exportieren();
    saves.set(events.length, json);
    checkpoints[label] = snapshot(quote(session));
    session = reload(json);
  }

  function take(view, offer, rationale) {
    assert.equal(offer?.ok, true, rationale);
    const { tick } = view.s;
    const before = session.exportieren();
    const result = session.ausfuehren(offer.id);
    assert.equal(result.ok, true, result.reason);
    assert.notEqual(session.exportieren(), before);
    const after = session.zustandReferenz();
    const houseCashDelta = after.owners.house.cash - view.s.owners.house.cash;
    if (offer.id.startsWith('buy-')) {
      const acquired = Object.values(after.ships).filter(ship =>
        ship.owner === 'house' && view.s.ships[ship.id]?.owner !== 'house');
      assert.equal(acquired.length, 1);
      assert.equal(houseCashDelta, -view.w.rules.economy.waren[acquired[0].klasse].basis);
      if (offer.id === 'buy-st_nadir-frachter') assert.ok(after.w5.schiffIds.includes(acquired[0].id));
    }
    if (offer.id.startsWith('reposition-')) {
      assert.deepEqual([offer.kosten, offer.minuten, houseCashDelta], [60, 60, -60]);
      assert.equal(after.w5ac.active.id, offer.id.slice('reposition-'.length));
      assert.equal(after.w5ac.active.owner, 'house');
    }
    const budget = view.manager;
    events.push({
      tick, id: offer.id, rationale, houseCashDelta,
      aldera: budget.alderaKasse, nadir: budget.nadirKasse,
      iceAtSource: budget.eisLager, iceAtDestination: budget.eislagerNadir,
      waterAtDestination: budget.wasserNadir,
    });
  }

  checkpoint('genesis');
  let view = quote(session);
  const foreign = Object.values(view.s.ships).find(ship => ship.owner !== 'house');
  rejected.push(reject(session, 'ore-' + foreign.id));
  rejected.push(reject(session, 'haus-erz-nicht-zugeteilt'));
  const buyMiner = view.offers.find(o => o.id === 'buy-st_aldera-miner');
  take(view, buyMiner, 'Erster Miner für eine bezahlte Erzcharge, vor Eis und Werftinvestition');
  view = quote(session);
  if (strategy === 's02-aldera') {
    const local = view.offers.find(o => o.id === 'buy-st_aldera-frachter');
    take(view, local, 'Erste Aldera-Hülle vor der NPC-Industrie belegen, Überführungskosten vermeiden');
    view = quote(session);
  }
  const firstOre = view.offers.find(o => o.id.startsWith('ore-') && o.ok);
  take(view, firstOre, 'W1 zuerst, um mit einer bezahlten Charge die Finanzierung zu prüfen');
  rejected.push(reject(session, firstOre.id));
  checkpoint('w1-start');

  for (;;) {
    view = quote(session);
    const { s, w, manager: p, offers } = view;
    const tick = s.tick;
    const revenue = s.stats.konto.house.erloes;
    const fees = s.kanon.spielerFrachten?.gebuehr ?? 0;
    const hasIceOrder = Object.entries(s.kanon.pendel)
      .some(([id, shuttle]) => s.ships[id].owner === 'house' && shuttle.ware === 'eis');
    if (hasIceOrder && revenue - lastRevenue > fees - freightFees) lastIceSale = tick;
    freightFees = fees;
    if (revenue > lastRevenue) {
      sales.push({ tick, delta: revenue - lastRevenue, revenue, freightFees: fees,
        costs: s.stats.konto.house.kosten, cash: s.owners.house.cash });
      lastRevenue = revenue;
      lastReceiptSave = { index: events.length, json: session.exportieren() };
      if (sales.length === 1) {
        assert.equal(revenue, 500);
        checkpoint('first-receipt');
      }
    }
    if ([9120, 51960, END - 7 * DAY, END - DAY].includes(tick)) checkpoint('minute-' + tick);
    if (tick === END) break;
    const owned = Object.values(s.ships).filter(ship => ship.owner === 'house');
    const hulls = owned.filter(ship => !w.stillgelegt(s, ship.id));
    const miners = hulls.filter(ship => ship.klasse === 'miner');
    const productiveMiner = miners.find(ship => w.restAktivminuten(s, ship.id) >= 120);
    const miner = earlyReplacement ? productiveMiner ?? miners[0] : miners[0];
    const carriers = hulls.filter(ship => ship.klasse === 'frachter');
    const byId = id => offers.find(o => o.id === id && o.ok);
    const freight = offers.find(o => o.ok && o.id.startsWith('freight-'));
    const ferry = offers.find(o => o.ok && o.id.startsWith('reposition-')
      && carriers.some(ship => 'reposition-' + ship.id === o.id));
    const prices = w.kern.eisfrachtPreise(w.rules);
    // Supply idle factory capacity before building more inventory. The
    // paced variant also gives the existing NPC market a day between sales.
    const pull = p.wasserNadir < p.eisWasserwerkSchwelle && p.eislagerNadir < p.eisCharge;
    const buyer = p.nadirKasse >= prices.gesamt && p.eisFrei >= p.eisCharge;
    const source = p.eisLager >= p.eisCharge;
    const reserve = p.hausKasse >= prices.arbeit;
    const route = pull && buyer && reserve;
    const loadedRoute = route && source && (!paced || tick - lastFreight >= DAY);
    const pendingFerry = s.w5ac.active?.owner === 'house';
    const minerOrder = miner && s.kanon.pendel[miner.id];
    const needIce = route && !source && p.alderaKasse >= p.ankaufKosten
      && (!paced || tick - lastIceSale >= DAY);
    if (hulls.length < owned.length
        && !checkpoints['first-retirement']) checkpoint('first-retirement');
    if (!checkpoints['first-blocked-house-freight']
        && loadedRoute && carriers.length && !freight && !p.frachtOffen) {
      checkpoint('first-blocked-house-freight');
    }

    // A short remaining life and actual NPC transport justify a replacement
    // before the old miner retires, even without a usable HOUSE carrier.
    const npcFreight = s.w5n.frachtauftrag
      && s.ships[s.w5n.frachtauftrag.schiff].owner === 'transport';
    const minerBudget = w.rules.economy.waren.miner.basis
      + w.rules.w5n.charge * w.rules.w5n.mineLohn + prices.arbeit;
    if (earlyReplacement && !productiveMiner && !minerOrder && npcFreight
        && p.nadirKasse >= prices.gesamt && p.alderaKasse >= p.ankaufKosten
        && p.hausKasse >= minerBudget && byId('buy-st_aldera-miner')) {
      take(view, byId('buy-st_aldera-miner'),
        'Ersatz vor 120 Restaktivminuten bei belegtem NPC-Transport und voller Anschlussfinanzierung');
    } else if (minerOrder?.ware === 'erz' && !minerOrder.beenden && sales.length && byId('stop-' + miner.id)) {
      take(view, byId('stop-' + miner.id), 'Nach der ersten bezahlten Charge Kapital des Abnehmers für Eis schonen');
    } else if (ferry && p.hausKasse >= ferry.kosten + prices.arbeit) {
      take(view, ferry, 'Bereits bezahlte W5-Hülle im ersten legalen Fenster nach Aldera disponieren');
      if (!checkpoints['first-ferry']) checkpoint('first-ferry');
    } else if (freight && loadedRoute) {
      take(view, freight, 'Bezahlte Rundfahrt nur bei tatsächlichem Bedarf des Wasserwerks');
      lastFreight = tick;
      if (!checkpoints['first-freight']) checkpoint('first-freight');
    } else if (loadedRoute && !carriers.length && !p.frachtOffen && !pendingFerry && !s.w3.auftrag && !s.w5n.frachtauftrag) {
      const local = byId('buy-st_aldera-frachter');
      const yard = byId('buy-st_nadir-frachter');
      if (local && p.hausKasse >= w.rules.economy.waren.frachter.basis + prices.arbeit) {
        take(view, local, 'Aldera-Frachter erst für eine konkret absetzbare Eischarge kaufen');
      } else if (yard?.kaufPlan?.ueberfuehrung?.restkasse >= prices.arbeit) {
        take(view, yard, 'Reale Nadir-Hülle nur mit finanzierter Überführung und finanzierbarer Anschlussfracht');
      }
    } else if (needIce && !miner && byId('buy-st_aldera-miner')
        && carriers.some(ship => ship.system === 'aldera')) {
      take(view, byId('buy-st_aldera-miner'), 'Verschlissenen Miner nur für verfügbaren Transport und finanzierbaren Absatz ersetzen');
    } else if (needIce && miner && byId('ice-' + miner.id)) {
      take(view, byId('ice-' + miner.id), 'Fehlende Eischarge für finanzierten Bedarf produzieren');
    } else if (!needIce && minerOrder?.ware === 'eis' && !minerOrder.beenden
        && miner.flug.lage === 'angedockt' && byId('stop-' + miner.id)) {
      take(view, byId('stop-' + miner.id), 'Zwischen finanzierten Eisaufträgen im Dock Förderpause einlegen');
    }
    session.weiterspielen(60);
    events.push({ minutes: 60 });
  }
  checkpoint('day-60');
  const finale = quote(session);
  const { s } = finale;
  assert.ok(lastReceiptSave);
  saves.set(lastReceiptSave.index, lastReceiptSave.json);
  checkpoints['last-receipt'] = snapshot(quote(reload(lastReceiptSave.json)));
  for (const offer of finale.offers.filter(o => !o.ok && /^(buy-|ore-|freight-|gate-freight-|reposition-)/.test(o.id))) {
    rejected.push(reject(session, offer.id, offer.reason));
  }
  const weekStart = checkpoints['minute-' + (END - 7 * DAY)];
  const dayStart = checkpoints['minute-' + (END - DAY)];
  const recentDays = new Set(sales.filter(sale => sale.tick > weekStart.tick)
    .map(sale => Math.ceil(sale.tick / DAY)));
  const lastWeek = {
    paidDays: recentDays.size,
    receipts: s.stats.konto.house.erloes - weekStart.book.erloes,
    costs: s.stats.konto.house.kosten - weekStart.book.kosten,
    cashChange: s.owners.house.cash - weekStart.cash.house,
    lastDayReceipts: s.stats.konto.house.erloes - dayStart.book.erloes,
  };
  const result = {
    strategy, checkpoints, rejected, sales, lastWeek,
    activeUntilDay60: lastWeek.paidDays >= 2 && lastWeek.lastDayReceipts > 0
      && lastWeek.receipts > lastWeek.costs && lastWeek.cashChange > 0,
    decisions: events.filter(e => e.id), trips: s.kanon.spielerFrachten?.auftraege ?? [],
    ferries: s.w5ac.completed.filter(f => f.owner === 'house'),
  };
  const replay = start(s02);
  for (const [i, event] of events.entries()) {
    if (saves.has(i)) assert.equal(replay.exportieren(), saves.get(i), 'Replay checkpoint ' + i);
    if (event.minutes) replay.weiterspielen(event.minutes);
    else assert.equal(replay.ausfuehren(event.id).ok, true, event.id);
  }
  assert.equal(replay.exportieren(), session.exportieren());
  console.log('CODEX_M4_ALTERNATIVE_RESULT', JSON.stringify(result));
}

test('Original-Genesis Standard/S02: Regel204 und Regel208 haben dieselben Startwerte', () => {
  for (const s02 of [false, true]) {
    const old = J8.erstellen();
    old.starten195(OldSession.create(42, 'private195').export(), true);
    assert.equal(old.ansicht().hash, '674400c1d181fcf2');
    const w = old.weltReferenz();
    const s = w.load(old.exportieren());
    if (s02) {
      w.politikSetzen(s, { stilllegung: true, betriebsreserve: { werft_extern: 1060 } });
      w.npcAutoSetzen(s, true);
      w.npcSiliziumSetzen(s, true);
    }
    const current = start(s02);
    const json = current.exportieren();
    assert.deepEqual(JSON.parse(json), { ...JSON.parse(w.save(s)), rulesVersion: 208 });
    audit(current.weltReferenz(), current.zustandReferenz());
    assert.throws(() => J8.erstellen().oeffnen204(json, true));
    assert.throws(() => J8.erstellen().oeffnen208(w.save(s), true));
  }
});

for (const strategy of STRATEGIES) {
  test(strategy + ' · Angebote, Buchungsbelege, Save/Load und Replay bis Tag 60', () => run(strategy));
}
