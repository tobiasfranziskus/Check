'use strict';
// J1 research evidence only. No commands, transfers, genesis or simulation clock.
const requiredGoods = Object.freeze(['silizium', 'material', 'bauteil', 'jaeger']);
const requiredRecipes = Object.freeze(['r_bauteil', 'r_jaeger']);
function inspect(welt, state) {
  if (welt.rules.rulesVersion !== 200 || state.rulesVersion !== 200)
    throw TypeError('J1 erfordert das explizite Regel200-Profil');
  const rules = welt.rules;
  const core = welt.audit(state);
  const errors = [...(core.ok ? [] : ['CORE_AUDIT'])];
  const money = Object.values(state.owners).reduce((n, o) => n + o.cash, 0);
  if (money !== state.initialSupply + state.minted - state.burned) errors.push('MONEY');
  if (state.minted !== 0 || state.burned !== 0) errors.push('MINT_BURN');
  const goods = {};
  for (const ware of requiredGoods) {
    goods[ware] = {
      registered: Object.hasOwn(rules.economy.waren, ware),
      stock: Object.values(state.stations).reduce((n, st) => n + (st.lager[ware] || 0), 0),
      cargo: Object.values(state.ships).reduce((n, sh) => n + (sh.ladung[ware] || 0), 0),
      ledger: state.ledger[ware] ? {...state.ledger[ware]} : null,
    };
  }
  // Independent stock reconstruction; a matching forged ledger alone is insufficient.
  for (const [ware, ledger] of Object.entries(state.ledger)) {
    if (!Object.hasOwn(rules.economy.waren, ware)) errors.push('UNREGISTERED_LEDGER:' + ware);
    const stock = Object.values(state.stations).reduce((n, st) => n + (st.lager[ware] || 0), 0)
      + Object.values(state.ships).reduce((n, sh) => n + (sh.ladung[ware] || 0), 0);
    // Original Core also accounts for goods bound in ongoing contracts.
    // Compare the simple equation only when none are in progress.
    if (!state.w4?.auftrag && !state.w5?.auftrag && !state.w3?.auftrag
      && !state.kanon.minerWerft?.auftrag && !state.kanon.rueckfracht) {
      const expected = ledger.initial + ledger.mined + ledger.produced + ledger.imported
        - ledger.consumed - ledger.exported;
      if (stock !== expected) errors.push('GOODS:' + ware);
    }
  }
  for (const st of Object.values(state.stations))
    for (const [ware, amount] of Object.entries(st.lager))
      if (amount && !Object.hasOwn(rules.economy.waren, ware)) errors.push('UNREGISTERED_STOCK:' + ware);
  const fighters = Object.values(state.ships).filter(sh => sh.klasse === 'jaeger')
    .map(sh => ({id: sh.id, owner: sh.owner, system: sh.system, phase: sh.phase}));
  for (const [id, sh] of Object.entries(state.ships)) {
    if (id !== sh.id) errors.push('SHIP_ID:' + id);
    for (const [ware, amount] of Object.entries(sh.ladung))
      if (amount && !Object.hasOwn(rules.economy.waren, ware)) errors.push('UNREGISTERED_CARGO:' + ware);
    if (!Object.hasOwn(rules.economy.waren, sh.klasse)) errors.push('UNREGISTERED_SHIP:' + sh.id);
    if (!Object.hasOwn(state.owners, sh.owner)) errors.push('SHIP_OWNER:' + sh.id);
  }
  const missingGoods = requiredGoods.filter(ware => !goods[ware].registered);
  const missingRecipes = requiredRecipes.filter(id => !Object.hasOwn(rules.economy.rezepte, id));
  const siliconFields = rules.world.fields.filter(f => f.ware === 'silizium').map(f => f.system);
  const productionLines = Object.values(state.stations).flatMap(st => st.linien.map(l => ({station: st.id, recipe: l.rezept})));
  return {
    kind: 'J1_BLOCKER_EVIDENCE_V1', tick: state.tick, hash: welt.hash(state),
    audit: {ok: errors.length === 0, errors, money, minted: state.minted, burned: state.burned},
    goods, fighters, missingGoods, missingRecipes, siliconFields, productionLines,
    shipyardClass: rules.w5.klasse,
    // A recipe name in world.aktiveRezepte is not an executable, financed recipe.
    advertisedRecipes: [...rules.world.aktiveRezepte],
    status: 'BLOCKED',
    implemented: {fighterProduction: false, fighterPurchase: false, fundedSortie: false,
      bountyEscrow: false, combatLoss: false, replacement: false},
  };
}
function loadChecked(welt, json) {
  const state = welt.load(json);
  const result = inspect(welt, state);
  if (!result.audit.ok) throw Error('J1: ' + result.audit.errors.join(', '));
  return state;
}
module.exports = Object.freeze({inspect, loadChecked});
