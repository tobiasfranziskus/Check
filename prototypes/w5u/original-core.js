/* Exact data/Core slice of W5t b280a4e index.html; verified by tests. No UI bootstrap. */
(function(scope){
const m_data_systeme = (() => {
  function tiefFrieren(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object' || seen.has(obj)) return obj;
    seen.add(obj);
    Object.freeze(obj);
    for (const k of Object.keys(obj)) tiefFrieren(obj[k], seen);
    return obj;
  }

  const SYSTEME = [
    {
      id: 'aldera', name: 'Aldera', sicherheit: 'sicher',
      karte: { x: 140, y: 500 }, region: 1000,
      gates: [{ to: 'cyris', time: 25 }, { to: 'dravos', time: 20 }],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_material', 'r_bauteil', 'r_miner', 'r_frachter', 'r_jaeger', 'r_lager', 'r_bergbau', 'r_fabrik', 'r_dock', 'r_werft', 'r_verteidigung', 'r_bauschiff'],
        verbrauch: { nahrung: 3, medikamente: 1, bauteil: 2 },
        ziel: { erz: 240, material: 156, bauteil: 40, eis: 96, silizium: 52, nahrung: 20, medikamente: 20, miner: 2, frachter: 2, jaeger: 2, lager: 6, bergbau: 4, fabrik: 3, dock: 3, werft: 2, verteidigung: 4, bauschiff: 1 },
      },
      fields: [{ ware: 'erz', miner: 2 }],
      pirates: {},
      security: true,
      traders: [{ owner: 'npc1', start: 0 }],
    },
    {
      id: 'cyris', name: 'Cyris', sicherheit: 'sicher',
      karte: { x: 400, y: 810 }, region: 1100,
      gates: [{ to: 'meridian', time: 30 }, { to: 'veldra', time: 25 }],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_bauteil', 'r_medikamente', 'r_nahrung'],
        verbrauch: { nahrung: 3, medikamente: 1, bauteil: 2 },
        ziel: { material: 132, bauteil: 40, kristall: 36, medikamente: 40, eis: 80, nahrung: 52, silizium: 20 },
      },
      fields: [{ ware: 'kristall', miner: 1 }, { ware: 'eis', miner: 1 }],
      pirates: {},
      security: true,
      traders: [{ owner: 'npc1', start: 10 }],
    },
    {
      id: 'dravos', name: 'Dravos', sicherheit: 'gesetzlos',
      karte: { x: 400, y: 190 }, region: 900,
      gates: [{ to: 'orion', time: 22 }, { to: 'veldra', time: 20 }],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_material'],
        verbrauch: { nahrung: 3, medikamente: 1, bauteil: 2 },
        ziel: { erz: 240, material: 96, eis: 96, silizium: 52, nahrung: 20, medikamente: 20, bauteil: 20 },
      },
      fields: [{ ware: 'erz', miner: 1 }, { ware: 'silizium', miner: 1 }],
      pirates: { pirat_klein: 1 },
      security: false,
      traders: [{ owner: 'npc2', start: 5 }],
    },
    {
      id: 'meridian', name: 'Meridian', sicherheit: 'gesetzlos',
      karte: { x: 880, y: 880 }, region: 1300,
      gates: [{ to: 'veldra', time: 30 }, { to: 'orion', time: 26 }],
      station: {
        cash: 6000, fondsCash: 1000, gebuehr: 0,
        aussenhandel: true,
        linien: [],
        verbrauch: {},
        ziel: { erz: 100, eis: 100, kristall: 100, material: 100, bauteil: 100, silizium: 100, nahrung: 100, medikamente: 100 },
      },
      fields: [],
      pirates: { pirat_mittel: 1, pirat_gross: 1 },
      security: false,
      traders: [],
    },
    {
      // Grenzversorgungsstation: Eis -> Nahrung, Silizium -> Bauteilindustrie anderswo.
      // Weniger Grundverbrauch als große Industrieknoten; keine zusätzliche Werft.
      id: 'nadir', name: 'Nadir', sicherheit: 'umkaempft',
      karte: { x: 900, y: 540 }, region: 1000,
      gates: [{ to: 'orion', time: 18 }, { to: 'meridian', time: 21 }],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_nahrung'],
        verbrauch: { nahrung: 2, medikamente: 1, bauteil: 1 },
        ziel: { eis: 100, silizium: 52, nahrung: 52, material: 60, medikamente: 18, bauteil: 18 },
      },
      fields: [{ ware: 'eis', miner: 1 }, { ware: 'silizium', miner: 1 }],
      pirates: { pirat_klein: 1 },
      security: true,
      traders: [],
    },
    {
      id: 'orion', name: 'Orion', sicherheit: 'umkaempft',
      karte: { x: 830, y: 220 }, region: 1050,
      gates: [{ to: 'veldra', time: 18 }],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_material'],
        verbrauch: { nahrung: 3, medikamente: 1, bauteil: 2 },
        ziel: { erz: 240, eis: 160, material: 120, bauteil: 30, nahrung: 30, silizium: 30, medikamente: 15 },
      },
      fields: [{ ware: 'erz', miner: 1 }, { ware: 'eis', miner: 1 }],
      pirates: { pirat_klein: 1 },
      security: true,
      traders: [{ owner: 'npc1', start: 8 }],
    },
    {
      id: 'veldra', name: 'Veldra', sicherheit: 'sicher',
      karte: { x: 670, y: 500 }, region: 950,
      gates: [],
      station: {
        cash: 4000, fondsCash: 1000, gebuehr: 40,
        linien: ['r_material', 'r_nahrung'],
        verbrauch: { nahrung: 3, medikamente: 1, bauteil: 2 },
        ziel: { erz: 240, material: 96, eis: 80, nahrung: 52, silizium: 20, medikamente: 20, bauteil: 20 },
      },
      fields: [{ ware: 'erz', miner: 1 }],
      pirates: {},
      security: true,
      traders: [{ owner: 'npc2', start: 15 }],
    },
  ];

  const GLOBALE_OWNER = [
    { id: 'house', kind: 'player', cash: 2000 },
    { id: 'security', kind: 'authority', cash: 5000 },
    { id: 'pirates', kind: 'pirate', cash: 3000 },
    { id: 'npc1', kind: 'trader', cash: 3000 },
    { id: 'npc2', kind: 'trader', cash: 3000 },
    { id: 'npc3', kind: 'miner', cash: 2000 },
  ];

  const systems = {};
  const stations = {};
  const region = {};
  const karteSysteme = {};
  const fields = [];
  const traders = [];
  const piratenSoll = {};
  const sicherheitJaeger = [];
  const owners = GLOBALE_OWNER.map((o) => ({ ...o }));
  const gatesMap = new Map();

  for (const def of SYSTEME) {
    systems[def.id] = { station: `st_${def.id}`, fonds: `fonds_${def.id}`, sicherheit: def.sicherheit };
    stations[`st_${def.id}`] = {
      system: def.id,
      linien: [...def.station.linien],
      verbrauch: { ...def.station.verbrauch },
      ziel: { ...def.station.ziel },
      gebuehr: def.station.gebuehr,
      ...(def.station.aussenhandel ? { aussenhandel: true } : {}),
    };
    region[def.id] = def.region;
    karteSysteme[def.id] = { name: def.name, x: def.karte.x, y: def.karte.y };
    for (const f of (def.fields || [])) fields.push({ system: def.id, ware: f.ware, miner: f.miner });
    for (const t of (def.traders || [])) traders.push({ owner: t.owner, system: def.id, start: t.start });
    if (!['sicher', 'umkaempft', 'gesetzlos'].includes(def.sicherheit)) throw new Error(`Unbekannte Sicherheitsstufe: ${def.id}`);
    if (def.sicherheit === 'sicher' && Object.keys(def.pirates || {}).length) throw new Error(`Piraten im sicheren System: ${def.id}`);
    if (def.pirates && Object.keys(def.pirates).length > 0) piratenSoll[def.id] = { ...def.pirates };
    if (def.security) sicherheitJaeger.push(def.id);
    for (const g of def.gates) {
      const key = [def.id, g.to].sort().join('|');
      if (!gatesMap.has(key)) gatesMap.set(key, [def.id, g.to, g.time]);
    }
    owners.push(
      { id: `st_${def.id}`, kind: 'station', cash: def.station.cash },
      { id: `fonds_${def.id}`, kind: 'fund', cash: def.station.fondsCash ?? 1000 },
    );
  }

  const gates = [...gatesMap.values()];

  return { SYSTEME, GLOBALE_OWNER, systems, stations, region, karteSysteme, fields, traders, piratenSoll, sicherheitJaeger, gates, owners, tiefFrieren };
})();

const m_data_economy = (() => {
const ECONOMY = {
  waren: {
    erz: { stufe: 'rohstoff', basis: 10 }, eis: { stufe: 'rohstoff', basis: 12 }, kristall: { stufe: 'rohstoff', basis: 24 },
    material: { stufe: 'material', basis: 30 }, bauteil: { stufe: 'bauteil', basis: 75 },
    silizium: { stufe: 'rohstoff', basis: 24 }, nahrung: { stufe: 'verbrauch', basis: 30 }, medikamente: { stufe: 'verbrauch', basis: 105 },
    lager: { stufe: 'modul', basis: 180 }, bergbau: { stufe: 'modul', basis: 225 }, fabrik: { stufe: 'modul', basis: 300 },
    dock: { stufe: 'modul', basis: 360 }, werft: { stufe: 'modul', basis: 450 }, verteidigung: { stufe: 'modul', basis: 252 },
    miner: { stufe: 'schiff', basis: 600 }, frachter: { stufe: 'schiff', basis: 750 }, jaeger: { stufe: 'schiff', basis: 900 }, bauschiff: { stufe: 'schiff', basis: 1200 },
  },
  rezepte: {
    r_material: { ein: { erz: 10 }, aus: { material: 4 }, ort: 'fabrik', dauer: 10 },
    r_bauteil: { ein: { material: 2, silizium: 1 }, aus: { bauteil: 1 }, ort: 'fabrik', dauer: 8 },
    r_nahrung: { ein: { eis: 2 }, aus: { nahrung: 1 }, ort: 'fabrik', dauer: 6 },
    r_medikamente: { ein: { kristall: 1, material: 2 }, aus: { medikamente: 1 }, ort: 'fabrik', dauer: 7 },
    r_lager: { ein: { bauteil: 2 }, aus: { lager: 1 }, ort: 'fabrik', dauer: 12 },
    r_bergbau: { ein: { bauteil: 2, material: 1 }, aus: { bergbau: 1 }, ort: 'fabrik', dauer: 15 },
    r_fabrik: { ein: { bauteil: 2, material: 3 }, aus: { fabrik: 1 }, ort: 'fabrik', dauer: 18 },
    r_dock: { ein: { bauteil: 4 }, aus: { dock: 1 }, ort: 'fabrik', dauer: 20 },
    r_werft: { ein: { bauteil: 4, material: 2 }, aus: { werft: 1 }, ort: 'fabrik', dauer: 24 },
    r_verteidigung: { ein: { bauteil: 2, material: 2 }, aus: { verteidigung: 1 }, ort: 'fabrik', dauer: 14 },
    r_miner: { ein: { bauteil: 6, material: 1 }, aus: { miner: 1 }, ort: 'werft', dauer: 30 },
    r_frachter: { ein: { bauteil: 8 }, aus: { frachter: 1 }, ort: 'werft', dauer: 36 },
    r_jaeger: { ein: { bauteil: 8, material: 4 }, aus: { jaeger: 1 }, ort: 'werft', dauer: 32 },
    r_bauschiff: { ein: { bauteil: 12, material: 2 }, aus: { bauschiff: 1 }, ort: 'werft', dauer: 48 },
  },
  s: 800, preisgrenzen: [550, 2500],
  region: m_data_systeme.region,
  kopfgeld: { klein: 120, mittel: 180, gross: 240 }, kopfgeldFaktor: 3,
  miningRate: 1, cargo: 100, stunde: 60,
  start: { owner: 'house', flotte: ['miner', 'frachter'], system: 'aldera', auftrag: 'halten' },
};
return { ECONOMY };
})();

const m_data_world = (() => {
const WORLD = {
  systems: m_data_systeme.systems,
  gates: m_data_systeme.gates,
  aktiveRezepte: ['r_bauteil', 'r_frachter', 'r_jaeger', 'r_material', 'r_medikamente', 'r_miner', 'r_nahrung', 'r_lager', 'r_bergbau', 'r_fabrik', 'r_dock', 'r_werft', 'r_verteidigung', 'r_bauschiff'],
  werft: 'st_aldera', zielSchiff: 2, reichsgroesse: 3,
  // v0.11.0 / A3: dividendeFreibetrag von 2000 auf 3000 angehoben.
  // 3000 liegt bewusst über mindeststand (2500). In v0.10.0 (2000 < 2500) füllte
  // der Fonds Stationskassen bis mindeststand auf und die Dividende zog sie im
  // selben Tick wieder über den Freibetrag ab — Endlosschleife. Zusätzlich
  // subventioniert der Fonds seit A2 keine Stationen mit Eigentümer mehr.
  dividendeFreibetrag: 3000,
  stations: m_data_systeme.stations,
  obergrenze: 1250,
  fields: m_data_systeme.fields,
  minerOwner: 'npc3',
  traders: m_data_systeme.traders,
  aussenhandelTeiler: 10,
  betriebskosten: { miner: 150, frachter: 250, jaeger: 50 },
  senkeBesitzer: ['security'], mindeststand: 2500, fondsObergrenze: 1500, npcObergrenze: 6000, npcAusgabenArten: ['trader', 'miner'],
  sicherheit: { owner: 'security', jaeger: m_data_systeme.sicherheitJaeger, fokus: 'schwach', rueckzug: 30 },
  piraten: { owner: 'pirates', markt: 'st_meridian', soll: m_data_systeme.piratenSoll },
  patrouilleChance: 600, ueberfallChance: 100, ersatzRuecklage: 250, warteLeer: 30, schutzgeldJeStunde: 0,
  versorgungsPrioritaet: 1000, // +100 % Score bei komplett fehlendem, tatsächlich verbrauchtem Gut
  owners: m_data_systeme.owners,
};
return { WORLD };
})();

const m_data_combat = (() => {
const COMBAT = {
  einheiten: {
    jaeger: { hp: 296, angriff: 45, ruestung: 2, treffer: 511 },
    miner: { hp: 90, angriff: 3, ruestung: 2, treffer: 400 },
    frachter: { hp: 110, angriff: 3, ruestung: 2, treffer: 400 },
    bauschiff: { hp: 300, angriff: 3, ruestung: 2, treffer: 300 },
    pirat_klein: { hp: 110, angriff: 22, ruestung: 3, treffer: 503 },
    pirat_mittel: { hp: 190, angriff: 32, ruestung: 0, treffer: 600 },
    pirat_gross: { hp: 206, angriff: 55, ruestung: 3, treffer: 576 },
  },
  flucht: 500, maxRunden: 12,
  kopfgeldKlasse: { pirat_klein: 'klein', pirat_mittel: 'mittel', pirat_gross: 'gross' },
  ersatzpreis: { pirat_klein: 300, pirat_mittel: 450, pirat_gross: 900 },
};
return { COMBAT };
})();

const m_data_rules = (() => {
const RULES = {
  schema: 8, rulesVersion: 14, maxAdvanceSteps: 10000, startSeed: 1,
  owners: m_data_world.WORLD.owners, economy: m_data_economy.ECONOMY,
  world: m_data_world.WORLD, combat: m_data_combat.COMBAT,
};
m_data_systeme.tiefFrieren(RULES);
return { RULES };
})();

const m_core_rng = (() => {
function seedToState(seed) { if (!Number.isSafeInteger(seed)) throw new TypeError('Startwert muss eine ganze Zahl sein'); return seed >>> 0; }
function rngNext(state) {
  state.rng = (state.rng + 0x6D2B79F5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rngInt(state, n) { return Math.floor(rngNext(state) * n); }
return { seedToState, rngNext, rngInt };
})();

const m_core_zahl = (() => {
function div(a, b) { if (!(b > 0)) throw new RangeError('div: Teiler muss positiv sein'); return Math.floor(a / b); }
const clamp = (lo, hi, x) => (x < lo ? lo : x > hi ? hi : x);
const ids = (obj) => Object.keys(obj).sort();
const anzahl = (obj, k) => (Object.hasOwn(obj, k) ? obj[k] : 0);
return { div, clamp, ids, anzahl };
})();

const m_core_state = (() => {
const { seedToState } = m_core_rng;
const { ids } = m_core_zahl;
const leereStats = () => ({ handel: 0, rezepte: {}, verkaeufe: {}, mangel: {} });
function kontoStats(owners) {
  const konto = {}; const abgabe = {};
  for (const id of ids(owners)) { konto[id] = { erloes: 0, kosten: 0 }; abgabe[id] = 0; }
  return { konto, abgabe };
}
const kampfStats = () => ({ kaempfe: 0, kopfgeld: 0, abschuesse: {}, verluste: {}, indienst: {}, vernichtet: 0, piratenErsatz: 0 });
const zuschussStats = () => ({ zuschuss: 0 });
// v0.11.0: protokolliere um optionale station-ID erweitert, damit das
// Stations-Blatt Ereignisse ohne fragile Textsuche filtern kann. Der
// station-Schlüssel wird nur gesetzt, wenn vorhanden — sonst bleiben alte
// und neue Ereignisse im canonical-Hash unterscheidbar.
function protokolliere(state, art, text, owner = null, station = null) {
  const eintrag = { tick: state.tick, art, text, owner };
  if (station) eintrag.station = station;
  state.ereignisse.push(eintrag);
  if (state.ereignisse.length > 60) state.ereignisse.shift();
}
const schiffId = (n) => `sh${String(n).padStart(3, '0')}`;
function neuesSchiff(state, felder) {
  const id = schiffId(state.nextShip);
  state.nextShip += 1;
  const s = { id, phase: 'dock', ziel: null, ankunft: 0, ladung: {}, warten: 0, ware: null, arbeit: 0, escorte: null, ...felder };
  state.ships[id] = s; state.stats.verkaeufe[id] = 0; return s;
}
function createState(seed, rules) {
  const w = rules.world; const e = rules.economy;
  const owners = {}; let initialSupply = 0;
  for (const o of rules.owners) { owners[o.id] = { id: o.id, kind: o.kind, cash: o.cash }; initialSupply += o.cash; }
  const systems = {};
  for (const id of ids(w.systems)) systems[id] = { id, station: w.systems[id].station, fonds: w.systems[id].fonds };
  const stats = { ...leereStats(), ...kontoStats(owners), ...kampfStats(), ...zuschussStats() };
  const stations = {};
  for (const id of ids(w.stations)) {
    const cfg = w.stations[id]; const lager = {};
    for (const ware of ids(cfg.ziel)) lager[ware] = cfg.ziel[ware];
    stations[id] = {
      id, system: cfg.system, lager,
      linien: cfg.linien.map((rezept) => ({ rezept, rest: 0, herkunft: 'npc' })),
      eigentum: null, module: {},
    };
    stats.rezepte[id] = 0; stats.mangel[id] = {};
    for (const ware of ids(cfg.verbrauch)) stats.mangel[id][ware] = 0;
  }
  const ledger = {};
  for (const ware of ids(e.waren)) {
    let initial = 0;
    for (const id of ids(stations)) initial += stations[id].lager[ware] || 0;
    ledger[ware] = { initial, mined: 0, produced: 0, consumed: 0, imported: 0, exported: 0 };
  }
  const state = {
    schema: rules.schema, rulesVersion: rules.rulesVersion, tick: 0, rng: seedToState(seed), queue: [], ereignisse: [],
    owners, systems, nextShip: 1, minted: 0, burned: 0, initialSupply,
    stations, ships: {}, sollflotte: {}, ledger, stats,
  };
  const soll = (felder) => {
    const s = neuesSchiff(state, { heimat: felder.system, ...felder });
    const plan = (state.sollflotte[s.owner] ||= []);
    // B5b: numerischer, je Besitzer unveränderlicher Sollplatz; der aktuelle Arbeitsauftrag
    // (s.ware/s.auftrag) darf die Ersatzzuordnung nicht versehentlich aufheben.
    if (rules.rulesVersion >= 14) s.sollplatz = plan.length;
    plan.push({ klasse: s.klasse, heimat: s.heimat, ware: s.ware, auftrag: s.auftrag });
  };
  for (const klasse of e.start.flotte) soll({ owner: e.start.owner, klasse, system: e.start.system, auftrag: e.start.auftrag });
  for (const f of w.fields) for (let i = 0; i < f.miner; i++) soll({ owner: w.minerOwner, klasse: 'miner', system: f.system, auftrag: 'foerdern', ware: f.ware });
  for (const t of w.traders) soll({ owner: t.owner, klasse: 'frachter', system: t.system, auftrag: 'handeln', ankunft: t.start });
  for (const system of w.sicherheit.jaeger) soll({ owner: w.sicherheit.owner, klasse: 'jaeger', system, auftrag: 'patrouille' });
  for (const system of ids(w.piraten.soll)) for (const klasse of ids(w.piraten.soll[system]))
    for (let i = 0; i < w.piraten.soll[system][klasse]; i++)
      neuesSchiff(state, { owner: w.piraten.owner, klasse, system, heimat: system, auftrag: 'pirat' });
  return state;
}
return { leereStats, kontoStats, kampfStats, zuschussStats, protokolliere, schiffId, neuesSchiff, createState };
})();

const m_core_commands = (() => {
const { ids } = m_core_zahl;
const anzahlLadung = (lager, ware) => (Object.hasOwn(lager, ware) ? lager[ware] : 0);
const FIELDS = {
  shipMove: ['schiff', 'ziel'], shipTrade: ['schiff', 'ware', 'menge', 'kauf'],
  shipMine: ['schiff', 'ware'], shipWait: ['schiff'],
  shipActivate: ['schiff', 'klasse'], shipHandeln: ['schiff'], shipRename: ['schiff', 'name'],
  shipEscort: ['schiff', 'ziel'], shipHunt: ['schiff'],
  shipInstall: ['schiff', 'modul'], stationBuy: ['schiff'],
  stationRecipe: ['station', 'rezept'], shipRemoveModule: ['schiff', 'modul'],
};
function checkShape(state, cmd, rules) {
  if (cmd === null || typeof cmd !== 'object' || Array.isArray(cmd)) return 'Befehl ist kein Objekt';
  if (!Object.hasOwn(FIELDS, cmd.type)) return 'unbekannter Befehlstyp';
  if (typeof cmd.owner !== 'string' || !Object.hasOwn(state.owners, cmd.owner)) return 'unbekannter Besitzer';
  const erlaubt = new Set(['type', 'owner', ...FIELDS[cmd.type]]);
  for (const k of Object.keys(cmd)) if (!erlaubt.has(k)) return `unerlaubtes Feld: ${k}`;
  if (FIELDS[cmd.type].includes('schiff')) {
    if (typeof cmd.schiff !== 'string' || !Object.hasOwn(state.ships, cmd.schiff)) return 'unbekanntes Schiff';
    const s = state.ships[cmd.schiff];
    if (s.owner !== cmd.owner) return 'Schiff gehört nicht dem Besitzer';
    if (s.phase !== 'dock' && cmd.type !== 'shipRename' && !(cmd.type === 'shipWait' && s.phase === 'reise')) return 'Schiff ist nicht im Dock';
    if (cmd.type === 'shipMove') {
      if (typeof cmd.ziel !== 'string' || !Object.hasOwn(rules.world.stations, cmd.ziel)) return 'unbekanntes Ziel';
    }
    if (cmd.type === 'shipTrade') {
      if (typeof cmd.ware !== 'string' || !Object.hasOwn(rules.economy.waren, cmd.ware)) return 'unbekannte Ware';
      if (!Number.isSafeInteger(cmd.menge) || cmd.menge <= 0) return 'Menge muss positive ganze Zahl sein';
      if (typeof cmd.kauf !== 'boolean') return 'kauf muss boolean sein';
      const station = rules.world.systems[s.system].station;
      if (!Object.hasOwn(rules.world.stations[station].ziel, cmd.ware)) return 'Station handelt diese Ware nicht';
      if (cmd.kauf) {
        const fracht = Object.values(s.ladung).reduce((a, b) => a + b, 0);
        if (fracht + cmd.menge > rules.economy.cargo) return 'zu wenig Frachtraum';
        const lager = state.stations[station].lager[cmd.ware] || 0;
        if (lager - cmd.menge < m_core_handel.reserve(rules, station, cmd.ware)) return 'Station behält ihren Vorrat';
      }
    }
    if (cmd.type === 'shipRename') {
      if (typeof cmd.name !== 'string' || cmd.name.length > 24 || /[\u0000-\u001f\u007f]/.test(cmd.name))
        return 'Schiffsname muss Text mit maximal 24 Zeichen ohne Steuerzeichen sein';
    }
    if (cmd.type === 'shipActivate') {
      if (typeof cmd.klasse !== 'string' || !Object.hasOwn(rules.economy.waren, cmd.klasse)) return 'unbekannte Schiffsklasse';
      if (rules.economy.waren[cmd.klasse].stufe !== 'schiff') return 'Ware ist kein aktivierbares Schiff';
      if (!Object.hasOwn(s.ladung, cmd.klasse) || s.ladung[cmd.klasse] < 1) return 'Schiff nicht im Frachtraum';
    }
    if (cmd.type === 'shipHandeln' && s.klasse !== 'frachter') return 'nur Frachter können selbständig handeln';
    if (cmd.type === 'shipMine') {
      if (s.klasse !== 'miner') return 'nur Miner können fördern';
      if (typeof cmd.ware !== 'string' || !Object.hasOwn(rules.economy.waren, cmd.ware)) return 'unbekannte Ware';
      if (!rules.world.fields.some((f) => f.system === s.system && f.ware === cmd.ware))
        return `kein ${cmd.ware}-Vorkommen in ${s.system}`;
    }
    if (cmd.type === 'shipEscort' || cmd.type === 'shipHunt') {
      if (s.klasse !== 'jaeger') return 'nur Jäger können das';
      if (cmd.type === 'shipEscort') {
        if (typeof cmd.ziel !== 'string' || !Object.hasOwn(state.ships, cmd.ziel)) return 'unbekanntes Zielschiff';
        if (cmd.ziel === cmd.schiff) return 'Ein Schiff kann sich nicht selbst eskortieren';
        if (state.ships[cmd.ziel].owner !== cmd.owner) return 'Zielschiff gehört nicht dem Besitzer';
      }
    }
    if (cmd.type === 'shipInstall') {
      if (s.klasse !== 'bauschiff') return 'nur Bauschiffe können Module einbauen';
      if (typeof cmd.modul !== 'string' || !Object.hasOwn(rules.economy.waren, cmd.modul)) return 'unbekanntes Modul';
      if (rules.economy.waren[cmd.modul].stufe !== 'modul') return 'Ware ist kein Modul';
      if (anzahlLadung(s.ladung, cmd.modul) < 1) return 'Modul nicht im Frachtraum';
      const st = state.stations[rules.world.systems[s.system].station];
      // v0.11.0 / A4: Einbau nur an eigenen Stationen.
      if (st.eigentum !== cmd.owner) return 'Station gehört nicht dem Besitzer';
      if ((st.module[cmd.modul] || 0) >= 2) return 'maximal 2 Module dieser Art pro Station';
      if (Object.values(st.module).reduce((a, b) => a + b, 0) >= 6) return 'maximal 6 Module pro Station';
    }
    if (cmd.type === 'shipRemoveModule') {
      if (s.klasse !== 'bauschiff') return 'nur Bauschiffe können Module ausbauen';
      if (typeof cmd.modul !== 'string' || !Object.hasOwn(rules.economy.waren, cmd.modul)) return 'unbekanntes Modul';
      if (rules.economy.waren[cmd.modul].stufe !== 'modul') return 'Ware ist kein Modul';
      const st = state.stations[rules.world.systems[s.system].station];
      if (st.eigentum !== cmd.owner) return 'Station gehört nicht dem Besitzer';
      if ((st.module[cmd.modul] || 0) <= 0) return 'Modul nicht vorhanden';
      const fracht = Object.values(s.ladung).reduce((a, b) => a + b, 0);
      if (fracht + 1 > rules.economy.cargo) return 'zu wenig Frachtraum';
    }
    if (cmd.type === 'stationBuy') {
      const station = rules.world.systems[s.system].station;
      const st = state.stations[station];
      if (st.eigentum) return 'Station gehört bereits jemandem';
      const eigen = ids(state.stations).filter((id) => state.stations[id].eigentum === cmd.owner).length;
      if (eigen >= rules.world.reichsgroesse) return `Reich ist auf ${rules.world.reichsgroesse} Stationen begrenzt`;
      if (state.owners[cmd.owner].cash < m_core_handel.stationspreis(state, rules, station)) return 'zu wenig ISK für den Stationskauf';
    }
  }
  if (cmd.type === 'stationRecipe') {
    if (typeof cmd.station !== 'string' || !Object.hasOwn(state.stations, cmd.station)) return 'unbekannte Station';
    if (state.stations[cmd.station].eigentum !== cmd.owner) return 'Station gehört nicht dem Besitzer';
    if (typeof cmd.rezept !== 'string' || !Object.hasOwn(rules.economy.rezepte, cmd.rezept)) return 'unbekanntes Rezept';
    const ort = rules.economy.rezepte[cmd.rezept].ort;
    if (!state.stations[cmd.station].linien.some((l) => rules.economy.rezepte[l.rezept].ort === ort))
      return 'keine passende Produktionslinie vorhanden';
  }
  return null;
}

function submit(state, cmd, rules) {
  const fehler = checkShape(state, cmd, rules);
  if (fehler) return { ok: false, reason: fehler };
  state.queue.push(JSON.parse(JSON.stringify(cmd)));
  return { ok: true };
}

function execute(state, cmd, rules) {
  const fehler = checkShape(state, cmd, rules);
  if (fehler) return { ok: false, type: cmd && cmd.type, reason: fehler };
  switch (cmd.type) {
    case 'shipMove': {
      const s = state.ships[cmd.schiff];
      const r = m_core_route.route(rules.world, s.system, rules.world.stations[cmd.ziel].system);
      if (!r || r.zeit <= 0) return { ok: false, type: cmd.type, reason: 'kein Weg' };
      s.phase = 'reise'; s.ziel = cmd.ziel; s.ankunft = state.tick + r.zeit; s.warten = 0; s.eskorte = null; break;
    }
    case 'shipTrade': {
      const s = state.ships[cmd.schiff];
      const station = rules.world.systems[s.system].station;
      if (!m_core_handel.handel(state, rules, s, station, cmd.ware, cmd.menge, cmd.kauf))
        return { ok: false, type: cmd.type, reason: 'Handel nicht möglich (Kasse, Bestand, Frachtraum oder Vorrat)' };
      state.stats.handel += 1; state.stats.verkaeufe[s.id] += 1; break;
    }
    case 'shipMine': { const s = state.ships[cmd.schiff]; s.auftrag = 'foerdern'; s.ware = cmd.ware; s.eskorte = null; break; }
    case 'shipWait': { const s = state.ships[cmd.schiff]; s.auftrag = 'halten'; s.eskorte = null; break; }
    case 'shipRename': {
      const s = state.ships[cmd.schiff];
      const name = cmd.name.trim();
      if (name) s.rufname = name;
      else delete s.rufname;
      break;
    }
    case 'shipActivate': {
      const traeger = state.ships[cmd.schiff];
      traeger.ladung[cmd.klasse] -= 1;
      if (traeger.ladung[cmd.klasse] === 0) delete traeger.ladung[cmd.klasse];
      state.ledger[cmd.klasse].consumed += 1;
      const neu = m_core_state.neuesSchiff(state, { owner: cmd.owner, klasse: cmd.klasse, system: traeger.system, heimat: traeger.system, auftrag: 'halten', ware: null });
      m_core_state.protokolliere(state, 'dienst', `${neu.id} (${cmd.klasse}) in Dienst gestellt`, cmd.owner);
      break;
    }
    case 'shipHandeln': {
      const s = state.ships[cmd.schiff];
      s.auftrag = 'handeln'; s.ware = null; s.warten = 0; s.eskorte = null;
      m_core_state.protokolliere(state, 'auftrag', `${s.id} handelt jetzt selbständig`, cmd.owner);
      break;
    }
    case 'shipHunt': {
      const s = state.ships[cmd.schiff];
      s.auftrag = 'jagd'; s.eskorte = null; s.ware = null; s.warten = 0;
      m_core_state.protokolliere(state, 'auftrag', `${s.id} jagt Piraten in ${s.system}`, cmd.owner);
      break;
    }
    case 'shipEscort': {
      const s = state.ships[cmd.schiff];
      s.auftrag = 'eskorte'; s.eskorte = cmd.ziel; s.ware = null; s.warten = 0;
      m_core_state.protokolliere(state, 'auftrag', `${s.id} eskortiert ${cmd.ziel}`, cmd.owner);
      break;
    }
    case 'shipInstall': {
      const s = state.ships[cmd.schiff];
      const station = rules.world.systems[s.system].station;
      const st = state.stations[station];
      s.ladung[cmd.modul] -= 1;
      if (s.ladung[cmd.modul] === 0) delete s.ladung[cmd.modul];
      state.ledger[cmd.modul].consumed += 1;
      st.module[cmd.modul] = (st.module[cmd.modul] || 0) + 1;
      if (cmd.modul === 'fabrik') {
        const vorhanden = new Set(st.linien.map((l) => l.rezept));
        const rezept = ['r_material', 'r_nahrung', 'r_bauteil', 'r_medikamente'].find((r) => !vorhanden.has(r));
        if (rezept) st.linien.push({ rezept, rest: 0, herkunft: 'spieler' });
      }
      if (cmd.modul === 'werft') {
        const vorhanden = new Set(st.linien.map((l) => l.rezept));
        const rezept = ['r_jaeger', 'r_frachter', 'r_miner'].find((r) => !vorhanden.has(r));
        if (rezept) st.linien.push({ rezept, rest: 0, herkunft: 'spieler' });
      }
      m_core_state.protokolliere(state, 'dienst', `${s.id} baut ${cmd.modul} in ${station} ein`, cmd.owner, station);
      break;
    }
    case 'shipRemoveModule': {
      const s = state.ships[cmd.schiff];
      const station = rules.world.systems[s.system].station;
      const st = state.stations[station];
      st.module[cmd.modul] -= 1;
      if (!st.module[cmd.modul]) delete st.module[cmd.modul];
      s.ladung[cmd.modul] = (s.ladung[cmd.modul] || 0) + 1;
      state.ledger[cmd.modul].consumed -= 1;
      if ((cmd.modul === 'fabrik' || cmd.modul === 'werft') && !st.module[cmd.modul]) {
        const ort = cmd.modul;
        for (let i = st.linien.length - 1; i >= 0; i--) {
          const l = st.linien[i];
          if (l.herkunft === 'spieler' && rules.economy.rezepte[l.rezept].ort === ort) {
            st.linien.splice(i, 1);
            break;
          }
        }
      }
      m_core_state.protokolliere(state, 'dienst', `${s.id} baut ${cmd.modul} in ${station} aus`, cmd.owner, station);
      break;
    }
    case 'stationRecipe': {
      const st = state.stations[cmd.station];
      const ort = rules.economy.rezepte[cmd.rezept].ort;
      const idx = st.linien.findIndex((l) => rules.economy.rezepte[l.rezept].ort === ort);
      if (idx < 0) return { ok: false, type: cmd.type, reason: 'keine passende Produktionslinie vorhanden' };
      st.linien[idx] = { rezept: cmd.rezept, rest: 0, herkunft: st.linien[idx].herkunft };
      m_core_state.protokolliere(state, 'dienst', `${cmd.station}: Rezept auf ${cmd.rezept} umgestellt`, cmd.owner, cmd.station);
      break;
    }
    case 'stationBuy': {
      const station = rules.world.systems[state.ships[cmd.schiff].system].station;
      const preis = m_core_handel.stationspreis(state, rules, station);
      state.owners[cmd.owner].cash -= preis;
      state.burned += preis;
      state.stations[station].eigentum = cmd.owner;
      m_core_state.protokolliere(state, 'dienst', `${station} gekauft für ${preis} ISK`, cmd.owner, station);
      break;
    }
  }
  return { ok: true, type: cmd.type };
}
return { submit, execute };
})();

const m_core_preis = (() => {
const { div, clamp, anzahl } = m_core_zahl;
function faktorFormel(region, s, grenzen, ziel, bestand) {
  const kn = clamp(-1000, 1000, div(1000 * (ziel - bestand), ziel));
  const roh = div(region * (1000 + div(s * kn, 1000)), 1000);
  return clamp(grenzen[0], grenzen[1], roh);
}
function preisFormel(basis, f) { return Math.max(1, div(basis * f + 500, 1000)); }
function faktor(state, station, ware, rules) {
  const st = rules.world.stations[station];
  const ziel = anzahl(st.ziel, ware);
  if (ziel <= 0) return 0;
  const e = rules.economy;
  return faktorFormel(e.region[st.system], e.s, e.preisgrenzen, ziel, anzahl(state.stations[station].lager, ware));
}
function preis(state, station, ware, rules) {
  const f = faktor(state, station, ware, rules);
  return f > 0 ? preisFormel(rules.economy.waren[ware].basis, f) : 0;
}
return { faktorFormel, preisFormel, faktor, preis };
})();

const m_core_handel = (() => {
const { div, anzahl } = m_core_zahl;
const { preis } = m_core_preis;
const zielVon = (rules, station, ware) => anzahl(rules.world.stations[station].ziel, ware);
const stationIn = (rules, system) => rules.world.systems[system].station;
const fondsIn = (rules, system) => rules.world.systems[system].fonds;

function reserve(rules, station, ware) {
  const st = rules.world.stations[station];
  const nutzt = Object.hasOwn(st.verbrauch, ware) || st.linien.some((r) => Object.hasOwn(rules.economy.rezepte[r].ein, ware));
  return nutzt ? div(zielVon(rules, station, ware), 2) : 0;
}
function verkaufbar(state, rules, station, ware) {
  if (zielVon(rules, station, ware) <= 0) return 0;
  return Math.max(0, anzahl(state.stations[station].lager, ware) - reserve(rules, station, ware));
}
function obergrenze(state, rules, station, ware) {
  const n = anzahl(state.stations[station].module, 'lager');
  return div(zielVon(rules, station, ware) * rules.world.obergrenze * (1000 + 500 * n), 1000000);
}
function aufnehmbar(state, rules, station, ware) {
  if (zielVon(rules, station, ware) <= 0) return 0;
  const platz = obergrenze(state, rules, station, ware) - anzahl(state.stations[station].lager, ware);
  const geld = div(state.owners[station].cash, preis(state, station, ware, rules));
  return Math.max(0, Math.min(platz, geld));
}
function buche(state, owner, feld, n) {
  const konto = state.stats.konto;
  if (!Object.hasOwn(konto, owner)) konto[owner] = { erloes: 0, kosten: 0 };
  konto[owner][feld] += n;
}
const gebuehr = (state, rules, station, wert) => div(wert * rules.world.stations[station].gebuehr * 1000, 1000 * (1000 + 500 * anzahl(state.stations[station].module, 'dock')));
const stationspreis = (state, rules, station) => 2 * state.owners[station].cash + 3000;
function bezahlbar(rules, station, kasse, p) {
  if (kasse <= 0 || p <= 0) return 0;
  return div(kasse * 1000, p * (1000 + rules.world.stations[station].gebuehr));
}

function handel(state, rules, schiff, station, ware, menge, kauf, freigestellt = false) {
  if (!Number.isSafeInteger(menge) || menge <= 0) return false;
  const p = preis(state, station, ware, rules);
  if (p <= 0) return false;
  const st = state.stations[station];
  const kasse = state.owners[station];
  const besitzer = state.owners[schiff.owner];
  const fondsId = fondsIn(rules, st.system);
  const wert = menge * p;
  const fee = gebuehr(state, rules, station, wert);
  const fracht = Object.values(schiff.ladung).reduce((a, b) => a + b, 0);
  const reicht = kauf
    ? anzahl(st.lager, ware) >= menge && besitzer.cash >= wert + fee
      && (freigestellt || (fracht + menge <= rules.economy.cargo
        && anzahl(st.lager, ware) - menge >= reserve(rules, station, ware)))
    : anzahl(schiff.ladung, ware) >= menge && kasse.cash >= wert
      && anzahl(st.lager, ware) + menge <= obergrenze(state, rules, station, ware);
  if (!reicht) return false;
  const d = kauf ? menge : -menge;
  st.lager[ware] -= d;
  schiff.ladung[ware] = anzahl(schiff.ladung, ware) + d;
  if (schiff.ladung[ware] === 0) delete schiff.ladung[ware];
  const geld = kauf ? wert : -wert;
  besitzer.cash -= geld; kasse.cash += geld;
  // v0.11.0 / A1: Gebühren gehen an die Stationskasse, wenn die Station einen
  // Besitzer hat (st.eigentum ist die Owner-ID, nicht die Stations-ID).
  // Sonst — bei besitzerlosen NPC-Stationen — an den Fonds des Systems.
  const empfaenger = st.eigentum ? station : fondsId;
  besitzer.cash -= fee; state.owners[empfaenger].cash += fee;
  buche(state, kauf ? station : schiff.owner, 'erloes', wert);
  buche(state, kauf ? schiff.owner : station, 'kosten', wert);
  buche(state, schiff.owner, 'kosten', fee);
  return true;
}

return { stationIn, fondsIn, reserve, verkaufbar, obergrenze, aufnehmbar, buche, gebuehr, bezahlbar, handel, stationspreis };
})();

const m_core_ankunft = (() => {
const { ids, anzahl } = m_core_zahl;
const { handel, aufnehmbar, stationIn } = m_core_handel;
function entladen(state, rules, s) {
  const station = stationIn(rules, s.system);
  for (const ware of ids(s.ladung)) {
    const m = Math.min(anzahl(s.ladung, ware), aufnehmbar(state, rules, station, ware));
    if (m > 0 && handel(state, rules, s, station, ware, m, false)) {
      state.stats.handel += 1; state.stats.verkaeufe[s.id] += 1;
    }
  }
}
function reise(state, rules) {
  const jagdOhneBeute = rules
    ? (s) => !(Object.values(state.ships).some((x) => x.owner === rules.world.piraten.owner
      && x.system === s.system && x.phase === 'dock' && x.auftrag === 'pirat'))
    : () => true;
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.phase === 'reise') { s.arbeit += 1; continue; }
    if (s.phase === 'dock' && (s.auftrag === 'patrouille' || s.auftrag === 'jagd' || s.auftrag === 'eskorte')) {
      if (s.auftrag === 'jagd' && s.owner === rules.economy.start.owner && jagdOhneBeute(s)) continue;
      s.arbeit += 1;
    }
  }
}
function ankunft(state, rules) {
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.phase !== 'reise' || s.ankunft > state.tick) continue;
    s.system = rules.world.stations[s.ziel].system;
    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;
    entladen(state, rules, s);
  }
}
return { entladen, reise, ankunft };
})();

const m_core_foerderung = (() => {
const { ids, anzahl } = m_core_zahl;
const { handel, aufnehmbar, stationIn } = m_core_handel;
const { protokolliere } = m_core_state;
function foerderung(state, rules) {
  const e = rules.economy;
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.klasse !== 'miner' || s.auftrag !== 'foerdern' || s.phase !== 'dock') continue;
    const ware = s.ware;
    if (!rules.world.fields.some((f) => f.system === s.system && f.ware === ware)) {
      protokolliere(state, 'auftrag', `${id}: ${ware} kommt in ${s.system} nicht vor – Förderung gestoppt`, s.owner);
      s.auftrag = 'halten'; s.ware = null;
      continue;
    }
    const vorher = anzahl(s.ladung, ware);
    if (vorher < e.cargo) {
      const station = stationIn(rules, s.system);
      const rate = e.miningRate * (1 + anzahl(state.stations[station].module, 'bergbau'));
      const n = Math.min(rate, e.cargo - vorher);
      s.ladung[ware] = vorher + n;
      state.ledger[ware].mined += n; s.arbeit += 1;
    }
    if (s.ladung[ware] < e.cargo) continue;
    const station = stationIn(rules, s.system);
    const m = Math.min(s.ladung[ware], aufnehmbar(state, rules, station, ware));
    if (m > 0 && handel(state, rules, s, station, ware, m, false)) {
      state.stats.handel += 1; state.stats.verkaeufe[id] += 1;
    }
  }
}
return { foerderung };
})();

const m_core_route = (() => {
const ABLAGE = new WeakMap();
function kleiner(a, b) { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i]; return a.length < b.length; }
function berechnen(gates) {
  const nachbarn = {};
  for (const [a, b, zeit] of gates) { (nachbarn[a] ||= []).push([b, zeit]); (nachbarn[b] ||= []).push([a, zeit]); }
  for (const k of Object.keys(nachbarn)) nachbarn[k].sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
  const alle = {};
  for (const start of Object.keys(nachbarn).sort()) {
    const beste = {};
    const suche = (weg, zeit) => {
      const hier = weg[weg.length - 1];
      const b = beste[hier];
      if (!b || zeit < b.zeit || (zeit === b.zeit && kleiner(weg, b.weg))) beste[hier] = { zeit, weg: weg.slice() };
      for (const [n, t] of nachbarn[hier]) if (!weg.includes(n)) suche([...weg, n], zeit + t);
    };
    suche([start], 0);
    for (const ziel of Object.keys(beste)) beste[ziel].spruenge = beste[ziel].weg.length - 1;
    alle[start] = beste;
  }
  return alle;
}
function route(world, a, b) {
  let alle = ABLAGE.get(world.gates);
  if (!alle) { alle = berechnen(world.gates); ABLAGE.set(world.gates, alle); }
  return (alle[a] && alle[a][b]) || null;
}
return { route };
})();

const m_core_entscheidung = (() => {
const { ids, anzahl } = m_core_zahl;
const { rngInt } = m_core_rng;
const { preis } = m_core_preis;
const { route } = m_core_route;
const { handel, verkaufbar, aufnehmbar, gebuehr, bezahlbar, stationIn } = m_core_handel;
const { entladen } = m_core_ankunft;
const besser = (a, za, b, zb) => a * zb > b * za;
const divVersorgung = m_core_zahl.div;
// Reisen benötigen keine Güter mehr; die Entscheidung bewertet Handel und Reisezeit.
function bestesPaar(state, rules, s, station) {
  const w = rules.world, hier = w.stations[station], kasse = state.owners[s.owner].cash;
  let best = null;
  for (const ware of ids(hier.ziel)) {
    const vorrat = verkaufbar(state, rules, station, ware);
    if (vorrat <= 0) continue;
    const pHier = preis(state, station, ware, rules);
    for (const ziel of ids(w.stations)) {
      if (ziel === station || anzahl(w.stations[ziel].ziel, ware) <= 0) continue;
      const r = route(w, hier.system, w.stations[ziel].system);
      if (!r || r.zeit <= 0) continue;
      const pDort = preis(state, ziel, ware, rules);
      if (pDort <= pHier) continue;
      const menge = Math.min(rules.economy.cargo, vorrat, aufnehmbar(state, rules, ziel, ware),
        bezahlbar(rules, station, kasse, pHier));
      if (menge <= 0) continue;
      const gewinn = menge * (pDort - pHier) - gebuehr(state, rules, station, menge * pHier)
        - gebuehr(state, rules, ziel, menge * pDort);
      if (gewinn <= 0) continue;
      // Nur die Rangfolge bereits profitabler Fahrten wird verändert.
      // Ab Regelversion 12: Engpässe bei regulär verbrauchten Gütern bevorzugen;
      // Version 11 bleibt für die unveränderten historischen Referenzen prüfbar.
      const bedarf = anzahl(w.stations[ziel].verbrauch, ware);
      const zielbestand = anzahl(w.stations[ziel].ziel, ware);
      const knappheit = Math.max(0, zielbestand - anzahl(state.stations[ziel].lager, ware));
      const bonus = rules.rulesVersion >= 12 && bedarf > 0 && zielbestand > 0
        ? divVersorgung(w.versorgungsPrioritaet * knappheit, zielbestand) : 0;
      const wertung = gewinn * (1000 + bonus);
      if (!best || besser(wertung, r.zeit, best.wertung, best.zeit))
        best = { ware, ziel, menge, gewinn, wertung, zeit: r.zeit };
    }
  }
  return best;
}
function besterAbsatz(state, rules, s, station) {
  const w = rules.world, system = w.stations[station].system;
  let best = null;
  for (const ziel of ids(w.stations)) {
    if (ziel === station) continue;
    const r = route(w, system, w.stations[ziel].system);
    if (!r || r.zeit <= 0) continue;
    let erloes = 0;
    for (const ware of ids(s.ladung)) {
      const m = Math.min(anzahl(s.ladung, ware), aufnehmbar(state, rules, ziel, ware));
      if (m <= 0) continue;
      const wert = m * preis(state, ziel, ware, rules);
      erloes += wert - gebuehr(state, rules, ziel, wert);
    }
    if (erloes <= 0) continue;
    if (!best || besser(erloes, r.zeit, best.erloes, best.zeit)) best = { ziel, erloes, zeit: r.zeit };
  }
  return best;
}
function abflug(state, rules, s, station, ziel, ware, menge) {
  const w = rules.world, r = route(w, w.stations[station].system, w.stations[ziel].system);
  if (!r || r.zeit <= 0) return false;
  if (ware !== null) {
    const p = preis(state, station, ware, rules);
    const fracht = Object.values(s.ladung).reduce((a, b) => a + b, 0);
    const m = Math.min(menge, rules.economy.cargo - fracht, verkaufbar(state, rules, station, ware),
      bezahlbar(rules, station, state.owners[s.owner].cash, p));
    if (m > 0 && handel(state, rules, s, station, ware, m, true)) state.stats.handel += 1;
  }
  s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;
  return true;
}
function entscheidung(state, rules) {
  const w = rules.world;
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.klasse !== 'frachter' || s.auftrag !== 'handeln' || s.phase !== 'dock' || s.ankunft > state.tick) continue;
    const station = stationIn(rules, s.system);
    if (ids(s.ladung).length > 0) {
      entladen(state, rules, s);
      if (ids(s.ladung).length > 0) {
        const z = besterAbsatz(state, rules, s, station);
        if (z) abflug(state, rules, s, station, z.ziel, null, 0);
        else s.ankunft = state.tick + w.warteLeer;
        continue;
      }
    }
    const paar = bestesPaar(state, rules, s, station);
    if (paar) abflug(state, rules, s, station, paar.ziel, paar.ware, paar.menge);
    else if (s.warten >= 2) {
      const andere = ids(w.stations).filter((x) => x !== station && route(w, s.system, w.stations[x].system));
      if (andere.length > 0) abflug(state, rules, s, station, andere[rngInt(state, andere.length)], null, 0);
      else s.ankunft = state.tick + w.warteLeer;
    } else { s.warten += 1; s.ankunft = state.tick + w.warteLeer; }
  }
}
return { entscheidung };
})();

const m_core_produktion = (() => {
const { ids, anzahl } = m_core_zahl;
const { obergrenze } = m_core_handel;
function produktion(state, rules) {
  const rezepte = rules.economy.rezepte;
  for (const id of ids(state.stations)) {
    const st = state.stations[id];
    for (const linie of st.linien) {
      const r = rezepte[linie.rezept];
      if (linie.rest > 0) {
        linie.rest -= 1;
        if (linie.rest === 0) {
          for (const ware of ids(r.aus)) { st.lager[ware] = anzahl(st.lager, ware) + r.aus[ware]; state.ledger[ware].produced += r.aus[ware]; }
          state.stats.rezepte[id] += 1;
        }
      }
      if (linie.rest > 0) continue;
      const eingaben = ids(r.ein).every((w) => anzahl(st.lager, w) >= r.ein[w]);
      const platz = ids(r.aus).every((w) => anzahl(st.lager, w) + r.aus[w] <= obergrenze(state, rules, id, w));
      if (!eingaben || !platz) continue;
      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }
      linie.rest = r.dauer;
    }
  }
}
return { produktion };
})();

const m_core_stunde = (() => {
const { div, ids, anzahl } = m_core_zahl;
const { fondsIn, buche } = m_core_handel;
const { protokolliere } = m_core_state;
// v0.11.0 / A3: einziger Lesezugriff auf den Dividenden-Freibetrag.
// Regel und UI ziehen beide über diese Funktion, damit Anzeige und
// Berechnung nicht auseinanderlaufen können.
const wirksamerFreibetrag = (rules) => rules.world.dividendeFreibetrag;
function verbrauch(state, rules) {
  for (const id of ids(state.stations)) {
    const st = state.stations[id]; const bedarf = rules.world.stations[id].verbrauch;
    for (const ware of ids(bedarf)) {
      const da = anzahl(st.lager, ware);
      const n = Math.min(da, bedarf[ware]);
      st.lager[ware] = da - n; state.ledger[ware].consumed += n;
      if (da < bedarf[ware]) state.stats.mangel[id][ware] += 1;
    }
  }
}
function betriebskosten(state, rules) {
  const w = rules.world;
  for (const id of ids(state.ships)) {
    const s = state.ships[id]; const arbeit = s.arbeit; s.arbeit = 0;
    // Auch bei Auftrag 'halten' muessen bereits erflogene Arbeitsminuten bezahlt werden.
    // Nur echte Untätigkeit (arbeit=0) ist kostenlos, auch nach Ankunft im Dock.
    if (arbeit === 0) continue;
    const kosten = div(anzahl(w.betriebskosten, s.klasse) * arbeit, rules.economy.stunde);
    const system = s.phase === 'reise' ? w.stations[s.ziel].system : s.system;
    const besitzer = state.owners[s.owner];
    if (arbeit > 0 && s.owner === rules.economy.start.owner
      && (s.auftrag === 'jagd' || s.auftrag === 'eskorte' || s.auftrag === 'patrouille') && kosten > besitzer.cash) {
      s.auftrag = 'halten'; s.eskorte = null; s.ware = null;
      protokolliere(state, 'kosten', `${id} automatisch gestoppt – Kasse deckt die Betriebskosten (${kosten} ISK) nicht`, s.owner);
    }
    const n = Math.min(besitzer.cash, kosten);
    if (n <= 0) continue;
    besitzer.cash -= n;
    if (w.senkeBesitzer.includes(s.owner)) state.burned += n;
    else state.owners[fondsIn(rules, system)].cash += n;
    buche(state, s.owner, 'kosten', n);
  }
}
function aussenhandel(state, rules) {
  for (const id of ids(state.stations)) {
    const cfg = rules.world.stations[id]; if (!cfg.aussenhandel) continue;
    const st = state.stations[id];
    for (const ware of ids(cfg.ziel)) {
      const da = anzahl(st.lager, ware);
      const d = div(cfg.ziel[ware] - da, rules.world.aussenhandelTeiler);
      st.lager[ware] = da + d;
      if (d > 0) state.ledger[ware].imported += d;
      if (d < 0) state.ledger[ware].exported -= d;
    }
  }
}
function npcAusgaben(state, rules) {
  const w = rules.world; const o = state.owners; const stationen = ids(state.stations);
  if (stationen.length === 0) return;
  let arm = stationen[0];
  for (const id of stationen) if (o[id].cash < o[arm].cash) arm = id;
  const ziel = fondsIn(rules, state.stations[arm].system);
  for (const id of ids(o)) {
    if (!w.npcAusgabenArten.includes(o[id].kind)) continue;
    const n = o[id].cash - w.npcObergrenze;
    if (n <= 0) continue;
    o[id].cash -= n; o[ziel].cash += n;
    state.stats.abgabe[id] = anzahl(state.stats.abgabe, id) + n;
  }
}
function fonds(state, rules) {
  const w = rules.world; const o = state.owners; const stationen = ids(state.stations);
  for (const id of stationen) {
    // v0.11.0 / A2: Stationen mit Besitzer (Spieler wie NPC) werden nicht aus
    // dem Fonds aufgefüllt — sonst würde der Fonds die Spielerkasse subventionieren.
    if (state.stations[id].eigentum) continue;
    const f = o[fondsIn(rules, state.stations[id].system)];
    const n = Math.min(f.cash, w.mindeststand - o[id].cash);
    if (n <= 0) continue;
    f.cash -= n; o[id].cash += n;
  }
  if (stationen.length === 0) return;
  for (const system of ids(w.systems)) {
    const f = o[fondsIn(rules, system)];
    if (!f || f.cash <= w.fondsObergrenze) continue;
    let arm = stationen[0];
    for (const id of stationen) if (o[id].cash < o[arm].cash) arm = id;
    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;
  }
}
function dividende(state, rules) {
  const spieler = rules.economy.start.owner;
  const freibetrag = wirksamerFreibetrag(rules);
  for (const id of ids(state.stations)) {
    if (state.stations[id].eigentum !== spieler) continue;
    const n = state.owners[id].cash - freibetrag;
    if (n <= 0) continue;
    state.owners[id].cash -= n; state.owners[spieler].cash += n;
    buche(state, id, 'kosten', n); buche(state, spieler, 'erloes', n);
  }
}
return { verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag };
})();

const m_core_kampf = (() => {
const { rngInt } = m_core_rng;
const lebt = (hp) => hp.some((x) => x > 0);
const summe = (hp) => hp.reduce((n, x) => (x > 0 ? n + x : n), 0);
function zielwahl(fokus, hp) {
  let z = -1;
  for (let i = 0; i < hp.length; i++) {
    if (hp[i] <= 0) continue;
    if (z < 0) { z = i; if (fokus === 'erste') break; }
    else if ((fokus === 'schwach' && hp[i] < hp[z]) || (fokus === 'stark' && hp[i] > hp[z])) z = i;
  }
  return z;
}
function schiessen(state, werte, hp, fokus, gegnerWerte, gegnerHp, schaden) {
  for (let i = 0; i < hp.length; i++) {
    if (hp[i] <= 0) continue;
    const z = zielwahl(fokus, gegnerHp);
    const wurf = rngInt(state, 1000);
    if (z >= 0 && wurf < werte[i].treffer) schaden[z] += Math.max(1, werte[i].angriff - gegnerWerte[z].ruestung);
  }
}
function flieht(state, rules, seite, hp, start) {
  if (summe(hp) * 100 > seite.rueckzug * start) return false;
  return rngInt(state, 1000) < rules.combat.flucht;
}
function kampf(state, seiteA, seiteB, rules) {
  const einheiten = rules.combat.einheiten;
  const wa = seiteA.schiffe.map((s) => einheiten[s.einheit]);
  const wb = seiteB.schiffe.map((s) => einheiten[s.einheit]);
  const a = seiteA.schiffe.map((s) => s.hp); const b = seiteB.schiffe.map((s) => s.hp);
  const startA = summe(a); const startB = summe(b);
  let runden = 0; let flucht = null;
  while (runden < rules.combat.maxRunden && lebt(a) && lebt(b)) {
    runden += 1;
    const schadenA = a.map(() => 0); const schadenB = b.map(() => 0);
    schiessen(state, wa, a, seiteA.fokus, wb, b, schadenB);
    schiessen(state, wb, b, seiteB.fokus, wa, a, schadenA);
    for (let i = 0; i < a.length; i++) a[i] -= schadenA[i];
    for (let i = 0; i < b.length; i++) b[i] -= schadenB[i];
    if (!lebt(a) || !lebt(b)) break;
    if (flieht(state, rules, seiteA, a, startA)) flucht = 'A';
    else if (flieht(state, rules, seiteB, b, startB)) flucht = 'B';
    if (flucht) break;
  }
  const sieger = (flucht || lebt(a) === lebt(b)) ? 'keiner' : (lebt(a) ? 'A' : 'B');
  return { sieger, runden, flucht, a: a.map((x) => Math.max(0, x)), b: b.map((x) => Math.max(0, x)) };
}
return { kampf };
})();

const m_core_sicherheit = (() => {
const { ids, anzahl, div } = m_core_zahl;
const { rngInt } = m_core_rng;
const { preis } = m_core_preis;
const { aufnehmbar, buche, stationIn } = m_core_handel;
const { route } = m_core_route;
const { kampf } = m_core_kampf;
const { neuesSchiff, protokolliere } = m_core_state;
const zaehle = (obj, a, b) => { obj[a] ||= {}; obj[a][b] = anzahl(obj[a], b) + 1; };
const imSystem = (state, owner, system, auftrag) => ids(state.ships).map((id) => state.ships[id])
  .filter((s) => s.owner === owner && s.system === system && s.phase === 'dock' && s.auftrag === auftrag);
const seite = (rules, schiffe, fokus, rueckzug) => ({ schiffe: schiffe.map((s) => ({ einheit: s.klasse, hp: rules.combat.einheiten[s.klasse].hp })), fokus, rueckzug });

function entfernen(state, rules, s) {
  // Verbliebene Fracht beim Schiffverlust vollständig aus der Warenbilanz buchen.
  // zerstoeren() entfernt zuvor bereits verkaufte oder verbuchte Ladung.
  for (const ware of ids(s.ladung)) {
    const n = s.ladung[ware];
    state.ledger[ware].consumed += n;
    state.stats.vernichtet += n;
    delete s.ladung[ware];
  }
  delete state.ships[s.id];
  delete state.stats.verkaeufe[s.id];
  zaehle(state.stats.verluste, s.owner, s.klasse);
  for (const id of ids(state.ships)) {
    const e = state.ships[id];
    if (e.eskorte === s.id) { e.eskorte = null; if (e.auftrag === 'eskorte') e.auftrag = 'halten'; }
  }
  if (s.owner === rules.economy.start.owner) protokolliere(state, 'verlust', `${s.id} (${s.klasse}) verloren in ${s.system}`, s.owner);
}
function zerstoeren(state, rules, s) {
  const { markt, owner } = rules.world.piraten;
  for (const ware of ids(s.ladung)) {
    const m = Math.min(s.ladung[ware], aufnehmbar(state, rules, markt, ware));
    if (m > 0) {
      const wert = m * preis(state, markt, ware, rules);
      state.owners[markt].cash -= wert; state.owners[owner].cash += wert;
      state.stations[markt].lager[ware] = anzahl(state.stations[markt].lager, ware) + m;
      s.ladung[ware] -= m;
      buche(state, owner, 'erloes', wert); buche(state, markt, 'kosten', wert);
    }
    const rest = s.ladung[ware];
    state.ledger[ware].consumed += rest; state.stats.vernichtet += rest;
    delete s.ladung[ware];
  }
  entfernen(state, rules, s);
}
function patrouille(state, rules) {
  const w = rules.world;
  const gruppen = new Map();
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.klasse !== 'jaeger' || s.phase !== 'dock') continue;
    if (s.auftrag !== 'patrouille' && s.auftrag !== 'jagd') continue;
    const key = `${s.owner}|${s.system}`;
    if (!gruppen.has(key)) {
      const sicherheit = s.owner === w.sicherheit.owner;
      gruppen.set(key, {
        owner: s.owner, system: s.system,
        fokus: sicherheit ? w.sicherheit.fokus : 'schwach',
        rueckzug: sicherheit ? w.sicherheit.rueckzug : 50,
        jaeger: [],
      });
    }
    gruppen.get(key).jaeger.push(s);
  }
  for (const g of gruppen.values()) {
    const piraten = imSystem(state, w.piraten.owner, g.system, 'pirat');
    if (piraten.length === 0) continue;
    if (rngInt(state, 1000) >= w.patrouilleChance) continue;
    const e = kampf(state, seite(rules, g.jaeger, g.fokus, g.rueckzug), seite(rules, piraten, 'erste', 0), rules);
    state.stats.kaempfe += 1;
    g.jaeger.forEach((s, i) => { if (e.a[i] <= 0) entfernen(state, rules, s); });
    const wer = g.owner === w.sicherheit.owner ? 'der Sicherheit' : 'deiner Flotte';
    piraten.forEach((p, i) => {
      if (e.b[i] > 0) return;
      const praemie = g.owner === rules.economy.start.owner ? rules.economy.kopfgeldFaktor : 1;
      const geld = rules.economy.kopfgeld[rules.combat.kopfgeldKlasse[p.klasse]] * praemie;
      state.owners[g.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;
      buche(state, g.owner, 'erloes', geld);
      state.stats.abschuesse[p.klasse] = anzahl(state.stats.abschuesse, p.klasse) + 1;
      protokolliere(state, 'abschuss', `${p.klasse} von ${wer} in ${g.system} abgeschossen`, g.owner);
      entfernen(state, rules, p);
    });
  }
}
function zivil(rules, s, system) {
  const w = rules.world;
  if (s.owner === w.sicherheit.owner || s.owner === w.piraten.owner) return false;
  if (s.auftrag === 'halten' && Object.values(s.ladung).reduce((a, b) => a + b, 0) === 0) return false;
  if (s.klasse === 'miner') return s.auftrag === 'foerdern' && s.phase === 'dock' && s.system === system;
  if (s.klasse === 'frachter') return s.phase === 'reise' ? w.stations[s.ziel].system === system : s.system === system;
  return false;
}
function ueberfall(state, rules) {
  const w = rules.world;
  for (const system of ids(w.systems)) {
    if (w.systems[system].sicherheit === 'sicher') continue;
    const piraten = imSystem(state, w.piraten.owner, system, 'pirat');
    if (piraten.length === 0) continue;
    const verteidigung = anzahl(state.stations[w.systems[system].station].module, 'verteidigung');
    const chance = div(w.ueberfallChance * 1000, 1000 + 500 * verteidigung);
    if (rngInt(state, 1000) >= chance) continue;
    const ziele = ids(state.ships).filter((id) => zivil(rules, state.ships[id], system));
    if (ziele.length === 0) continue;
    const ziel = state.ships[ziele[rngInt(state, ziele.length)]];
    const eskorten = ids(state.ships).map((id) => state.ships[id]).filter((s) =>
      s.klasse === 'jaeger' && s.phase === 'dock' && s.system === system &&
      s.auftrag === 'eskorte' && s.eskorte === ziel.id && s.owner === ziel.owner);
    const verteidiger = [ziel, ...eskorten];
    const e = kampf(state, seite(rules, verteidiger, 'schwach', 0), seite(rules, piraten, 'erste', 0), rules);
    state.stats.kaempfe += 1;
    if (e.a[0] <= 0) zerstoeren(state, rules, ziel);
    eskorten.forEach((s, i) => { if (e.a[i + 1] <= 0) entfernen(state, rules, s); });
    piraten.forEach((p, i) => {
      if (e.b[i] > 0) return;
      const praemie = ziel.owner === rules.economy.start.owner ? rules.economy.kopfgeldFaktor : 1;
      const geld = rules.economy.kopfgeld[rules.combat.kopfgeldKlasse[p.klasse]] * praemie;
      state.owners[ziel.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;
      buche(state, ziel.owner, 'erloes', geld);
      state.stats.abschuesse[p.klasse] = anzahl(state.stats.abschuesse, p.klasse) + 1;
      protokolliere(state, 'abschuss', `${p.klasse} in ${system} verteidigt`, ziel.owner);
      entfernen(state, rules, p);
    });
  }
}
function escorteBewegen(state, rules) {
  const w = rules.world;
  for (const id of ids(state.ships)) {
    const s = state.ships[id];
    if (s.klasse !== 'jaeger' || s.auftrag !== 'eskorte' || !s.eskorte || s.phase !== 'dock') continue;
    const ziel = state.ships[s.eskorte];
    if (!ziel) { s.eskorte = null; s.auftrag = 'halten'; continue; }
    const zielSystem = ziel.phase === 'reise' ? w.stations[ziel.ziel].system : ziel.system;
    if (s.system === zielSystem) continue;
    const r = route(w, s.system, zielSystem);
    if (!r || r.zeit <= 0) continue;
    s.phase = 'reise'; s.ziel = w.systems[zielSystem].station; s.ankunft = state.tick + r.zeit; s.warten = 0;
  }
}
function piratenErsatz(state, rules) {
  const { owner, markt, soll } = rules.world.piraten;
  for (const system of ids(soll)) for (const klasse of ids(soll[system])) {
    if (rules.world.systems[system].sicherheit === 'sicher') continue;
    const da = imSystem(state, owner, system, 'pirat').filter((p) => p.klasse === klasse).length;
    const p = rules.combat.ersatzpreis[klasse];
    if (da >= soll[system][klasse] || state.owners[owner].cash < p) continue;
    state.owners[owner].cash -= p; state.owners[markt].cash += p;
    buche(state, owner, 'kosten', p); buche(state, markt, 'erloes', p);
    state.stats.piratenErsatz += 1;
    neuesSchiff(state, { owner, klasse, system, heimat: system, auftrag: 'pirat' });
  }
}
function schutzgeld(state, rules) {
  const w = rules.world;
  const je = w.schutzgeldJeStunde;
  if (!je) return;
  for (const system of ids(w.systems)) {
    const piraten = imSystem(state, w.piraten.owner, system, 'pirat');
    if (piraten.length === 0) continue;
    const st = w.systems[system].station;
    const n = Math.min(state.owners[st].cash, je * piraten.length);
    if (n <= 0) continue;
    state.owners[st].cash -= n; state.owners[w.piraten.owner].cash += n;
    buche(state, st, 'kosten', n); buche(state, w.piraten.owner, 'erloes', n);
  }
}
return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };
})();

const m_core_schiffbau = (() => {
const { ids, anzahl } = m_core_zahl;
const { preis } = m_core_preis;
const { route } = m_core_route;
const { handel, gebuehr, stationIn, fondsIn } = m_core_handel;
const { neuesSchiff } = m_core_state;
const schluessel = (x) => `${x.klasse}/${x.heimat}/${x.ware}`;
function fehlend(state, owner) {
  if (state.rulesVersion >= 14) {
    const plan = state.sollflotte[owner] || [];
    const belegt = new Set();
    for (const id of ids(state.ships)) {
      const s = state.ships[id], platz = s.sollplatz;
      if (s.owner !== owner || !Number.isSafeInteger(platz) || platz < 0 || platz >= plan.length) continue;
      const rolle = plan[platz];
      if (rolle.klasse === s.klasse && rolle.heimat === s.heimat) belegt.add(platz);
    }
    return plan.flatMap((x, platz) => belegt.has(platz) ? [] : [{ ...x, platz }]);
  }
  // Alte Referenzkerne (Regel 11–13) behalten exakt ihre historische Slot-Zählung.
  const da = {};
  for (const id of ids(state.ships)) { const s = state.ships[id]; if (s.owner === owner) da[schluessel(s)] = anzahl(da, schluessel(s)) + 1; }
  return state.sollflotte[owner].filter((x) => { const k = schluessel(x); if (anzahl(da, k) === 0) return true; da[k] -= 1; return false; });
}
function zuschuss(state, rules, owner, bedarf) {
  const n = bedarf - state.owners[owner].cash;
  const f = state.owners[fondsIn(rules, state.stations[rules.world.werft].system)];
  if (n <= 0 || f.cash < n) return 0;
  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;
}
function ersatzkauf(state, rules) {
  const w = rules.world; const werft = w.werft;
  for (const owner of ids(state.sollflotte)) {
    if (owner === w.piraten.owner || state.owners[owner].kind === 'player') continue;
    const leer = !ids(state.ships).some((id) => state.ships[id].owner === owner);
    for (const x of fehlend(state, owner)) {
      if (anzahl(state.stations[werft].lager, x.klasse) < 1) continue;
      const p = preis(state, werft, x.klasse, rules);
      const bedarf = p + gebuehr(state, rules, werft, p);
      if (leer) zuschuss(state, rules, owner, bedarf);
      if (state.owners[owner].cash < bedarf + (leer ? 0 : w.ersatzRuecklage)) continue;
      const von = state.stations[werft].system;
      const r = route(w, von, x.heimat);
      const s = neuesSchiff(state, { owner, klasse: x.klasse, system: von, heimat: x.heimat, ware: x.ware, auftrag: x.auftrag,
        ...(state.rulesVersion >= 14 ? { sollplatz: x.platz } : {}) });
      if (!handel(state, rules, s, werft, x.klasse, 1, true)) {
        delete state.ships[s.id];
        delete state.stats.verkaeufe[s.id];
        continue;
      }
      delete s.ladung[x.klasse]; state.ledger[x.klasse].consumed += 1;
      state.stats.indienst[owner] ||= {};
      state.stats.indienst[owner][x.klasse] = anzahl(state.stats.indienst[owner], x.klasse) + 1;
      s.ankunft = state.tick + r.zeit;
      if (r.zeit > 0) { s.phase = 'reise'; s.ziel = stationIn(rules, x.heimat); }
      break;
    }
  }
}
return { zuschuss, ersatzkauf };
})();

const m_core_step = (() => {
const { execute } = m_core_commands;
const { protokolliere } = m_core_state;
const { ankunft, reise } = m_core_ankunft;
const { foerderung } = m_core_foerderung;
const { entscheidung } = m_core_entscheidung;
const { produktion } = m_core_produktion;
const { verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende } = m_core_stunde;
const { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen } = m_core_sicherheit;
const { ersatzkauf } = m_core_schiffbau;

function step(state, rules) {
  state.tick += 1;
  const wartend = state.queue; state.queue = [];
  const ergebnisse = wartend.map((cmd) => execute(state, cmd, rules));
  wartend.forEach((cmd, i) => {
    if (!ergebnisse[i].ok) protokolliere(state, 'befehl', `${cmd.schiff ? `${cmd.schiff}: ` : ''}Befehl abgelehnt: ${ergebnisse[i].reason}`, cmd.owner);
  });
  ankunft(state, rules); foerderung(state, rules); entscheidung(state, rules); reise(state, rules); produktion(state, rules);
  escorteBewegen(state, rules);
  if (state.tick % rules.economy.stunde === 0) {
    verbrauch(state, rules); betriebskosten(state, rules); aussenhandel(state, rules);
    patrouille(state, rules); ueberfall(state, rules); piratenErsatz(state, rules); schutzgeld(state, rules);
    ersatzkauf(state, rules); npcAusgaben(state, rules); fonds(state, rules); dividende(state, rules);
  }
  return ergebnisse;
}
function advance(state, n, rules) {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('n muss eine ganze Zahl >= 0 sein');
  if (n > rules.maxAdvanceSteps) throw new RangeError(`n=${n} übersteigt die Obergrenze ${rules.maxAdvanceSteps}`);
  for (let i = 0; i < n; i++) step(state, rules);
}
return { step, advance };
})();

const m_core_hash = (() => {
function canonical(value) {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean': return value ? 'true' : 'false';
    case 'number': if (!Number.isFinite(value)) throw new TypeError('Zahl nicht endlich'); return JSON.stringify(value);
    case 'string': return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
      const keys = Object.keys(value).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
    }
    default: throw new TypeError(`Typ nicht serialisierbar: ${typeof value}`);
  }
}
const hex8 = (n) => (n >>> 0).toString(16).padStart(8, '0');
function hashString(str) {
  let h1 = 0xdeadbeef; let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return hex8(h2) + hex8(h1);
}
function hash(state) { return hashString(canonical(state)); }
return { canonical, hashString, hash };
})();

const m_core_serialize = (() => {
const { canonical } = m_core_hash;
const { ids } = m_core_zahl;
const { leereStats, kontoStats, kampfStats, zuschussStats, neuesSchiff } = m_core_state;
function migration3(s) {
  const ships = {}; const sollflotte = {}; let hoechste = 0;
  for (const id of ids(s.ships)) {
    const x = { ...s.ships[id], heimat: s.ships[id].system };
    ships[id] = x;
    (sollflotte[x.owner] ||= []).push({ klasse: x.klasse, heimat: x.heimat, ware: x.ware, auftrag: x.auftrag });
    hoechste = Math.max(hoechste, Number(id.slice(2)));
  }
  return { ...s, schema: 4, ships, sollflotte, nextShip: hoechste + 1, stats: { ...s.stats, ...kampfStats() } };
}
const MIGRATIONS = {
  1: (s) => ({ ...s, schema: 2, rulesVersion: 0, stations: {}, ships: {}, ledger: {}, stats: leereStats() }),
  2: (s) => ({ ...s, schema: 3, ships: Object.fromEntries(Object.entries(s.ships).map(([id, x]) => [id, { ...x, arbeit: 0 }])), stats: { ...s.stats, ...kontoStats(s.owners) } }),
  3: migration3,
  4: (s) => ({ ...s, schema: 5, burned: 0, stats: { ...s.stats, ...zuschussStats() } }),
  5: (s) => ({ ...s, schema: 6, ereignisse: [] }),
  6: (s) => ({ ...s, schema: 7, stations: Object.fromEntries(Object.entries(s.stations).map(([id, st]) => [id, { ...st, eigentum: st.eigentum ?? null, module: st.module ?? {} }])) }),
  // v0.11.0 / B2: Schema 7→8. Jede bestehende Produktionslinie bekommt ein
  // herkunft-Feld; fehlt es (Bestand), gilt sie als 'npc'. Neue Linien aus
  // shipInstall werden ab v0.11.0 mit 'spieler' angelegt.
  7: (s) => ({
    ...s,
    schema: 8,
    stations: Object.fromEntries(Object.entries(s.stations).map(([id, st]) => [
      id,
      { ...st, linien: st.linien.map((l) => ({ ...l, herkunft: l.herkunft ?? 'npc' })) },
    ])),
  }),
};

function migrationRegel4(s) {
  const def = m_data_systeme.SYSTEME.find((x) => x.id === 'orion');
  if (!def) throw new Error('Regelmigration 4→5: Orion fehlt in m_data_systeme.SYSTEME');
  const neu = JSON.parse(JSON.stringify(s));
  neu.systems.orion = { id: 'orion', station: 'st_orion', fonds: 'fonds_orion' };
  const lager = {};
  for (const ware of Object.keys(def.station.ziel)) lager[ware] = def.station.ziel[ware];
  neu.stations.st_orion = {
    id: 'st_orion', system: 'orion', lager,
    linien: def.station.linien.map((rezept) => ({ rezept, rest: 0, herkunft: 'npc' })),
  };
  neu.owners.st_orion = { id: 'st_orion', kind: 'station', cash: def.station.cash };
  neu.owners.fonds_orion = { id: 'fonds_orion', kind: 'fund', cash: def.station.fondsCash ?? 1000 };
  neu.stats.konto.st_orion = { erloes: 0, kosten: 0 };
  neu.stats.konto.fonds_orion = { erloes: 0, kosten: 0 };
  neu.stats.abgabe.st_orion = 0;
  neu.stats.abgabe.fonds_orion = 0;
  neu.initialSupply += def.station.cash + (def.station.fondsCash ?? 1000);
  for (const ware of Object.keys(lager)) {
    if (!neu.ledger[ware]) neu.ledger[ware] = { initial: 0, mined: 0, produced: 0, consumed: 0, imported: 0, exported: 0 };
    neu.ledger[ware].initial += lager[ware];
  }
  neu.stats.rezepte.st_orion = 0;
  neu.stats.mangel.st_orion = {};
  for (const ware of Object.keys(def.station.verbrauch)) neu.stats.mangel.st_orion[ware] = 0;
  const spawn = (felder, inSollflotte) => {
    const schiff = neuesSchiff(neu, felder);
    if (inSollflotte) (neu.sollflotte[schiff.owner] ||= []).push({ klasse: schiff.klasse, heimat: schiff.heimat, ware: schiff.ware, auftrag: schiff.auftrag });
  };
  if (def.security) spawn({ owner: 'security', klasse: 'jaeger', system: 'orion', heimat: 'orion', auftrag: 'patrouille' }, true);
  for (const t of (def.traders || [])) spawn({ owner: t.owner, klasse: 'frachter', system: 'orion', heimat: 'orion', auftrag: 'handeln', ankunft: t.start }, true);
  for (const f of (def.fields || [])) for (let i = 0; i < f.miner; i++) spawn({ owner: 'npc3', klasse: 'miner', system: 'orion', heimat: 'orion', auftrag: 'foerdern', ware: f.ware }, true);
  for (const klasse of Object.keys(def.pirates || {})) for (let i = 0; i < def.pirates[klasse]; i++) spawn({ owner: 'pirates', klasse, system: 'orion', heimat: 'orion', auftrag: 'pirat' }, false);
  neu.rulesVersion = 5;
  return neu;
}

function migrationRegel5(s) {
  const def = m_data_systeme.SYSTEME.find((x) => x.id === 'aldera');
  if (!def) throw new Error('Regelmigration 5→6: Aldera fehlt in m_data_systeme.SYSTEME');
  const neu = JSON.parse(JSON.stringify(s));
  const st = neu.stations.st_aldera;
  for (const rezept of def.station.linien) {
    if (!st.linien.some((l) => l.rezept === rezept)) st.linien.push({ rezept, rest: 0, herkunft: 'npc' });
  }
  for (const ware of Object.keys(def.station.ziel)) {
    if (Object.hasOwn(st.lager, ware)) continue;
    st.lager[ware] = def.station.ziel[ware];
    if (!neu.ledger[ware]) neu.ledger[ware] = { initial: 0, mined: 0, produced: 0, consumed: 0, imported: 0, exported: 0 };
    neu.ledger[ware].initial += def.station.ziel[ware];
  }
  neu.rulesVersion = 6;
  return neu;
}

// v0.11.0 / Regelmigration 6→7: reine Regeländerung ohne Schema-Anpassung.
// Die einzige inhaltliche Neuerung ist world.dividendeFreibetrag = 3000; sie
// wird bei jedem Start aus den eingefrorenen Regeln gelesen und braucht keine
// Anpassung der Spielstand-Struktur. Die Migration setzt nur die Regelversion.
function migrationRegel6(s) {
  const neu = JSON.parse(JSON.stringify(s));
  neu.rulesVersion = 7;
  return neu;
}

// Reine Regelübernahme: keine Schiffe, Waren oder Konten verändern.
function migrationRegel7(s) {
  return { ...s, rulesVersion: 8 };
}

// B5b (13→14): Bestehende Sollplätze bleiben unverändert. Nur die dauerhafte
// Zuordnung zu überlebenden Hüllen wird aus der alten Identität rekonstruiert.
function migrationRegel13(s) {
  const neu = JSON.parse(JSON.stringify(s));
  for (const owner of Object.keys(neu.sollflotte).sort()) {
    const plan = neu.sollflotte[owner];
    const schiffe = Object.keys(neu.ships).sort().map((id) => neu.ships[id]).filter((sh) => sh.owner === owner);
    const frei = new Set(schiffe.map((sh) => sh.id)), belegt = new Set();
    const zuweisen = (platz, sh) => { sh.sollplatz = platz; frei.delete(sh.id); belegt.add(platz); };
    // Phase 1: Exakte alte Identität (auch identische Miner-Sollrollen) stabil zuordnen.
    for (let platz = 0; platz < plan.length; platz++) {
      const rolle = plan[platz];
      const sh = schiffe.find((x) => frei.has(x.id) && x.klasse === rolle.klasse
        && x.heimat === rolle.heimat && (x.ware ?? null) === (rolle.ware ?? null));
      if (sh) zuweisen(platz, sh);
    }
    // Phase 2: Bei nur einer verbleibenden Rollenart pro Klasse/Heimat
    // auch vorübergehend gestoppte oder transportierende Alt-Miner erkennen.
    // Unterschiedliche Sollwaren am selben Ort sind ohne alte Schiffs-ID uneindeutig:
    // hier abbrechen statt einen fremden Miner still falsch zuzuweisen.
    for (let platz = 0; platz < plan.length; platz++) {
      if (belegt.has(platz)) continue;
      const rolle = plan[platz];
      const kandidaten = schiffe.filter((x) => frei.has(x.id)
        && x.klasse === rolle.klasse && x.heimat === rolle.heimat);
      if (!kandidaten.length) continue; // echter Verlust: dieser Sollplatz bleibt frei.
      const offen = plan.filter((x, i) => !belegt.has(i)
        && x.klasse === rolle.klasse && x.heimat === rolle.heimat);
      if (new Set(offen.map((x) => x.ware ?? null)).size !== 1)
        throw new Error('Regelmigration 13→14: uneindeutige Sollrollen in '+owner+'/'+rolle.heimat);
      zuweisen(platz, kandidaten[0]);
    }
  }
  neu.rulesVersion = 14;
  return neu;
}
const RULE_MIGRATIONS = {
  4: migrationRegel4,
  5: migrationRegel5,
  6: migrationRegel6,
  7: migrationRegel7,
  // 11→12: Nur die NPC-Handelspriorisierung ändert sich, kein gespeichertes Feld.
  11: (s) => ({ ...s, rulesVersion: 12 }),
  // 12→13: Angefallene Reise-Arbeit ist auch bei 'halten' zahlungspflichtig;
  // vorhandene Schiffe, Kassen, angefangene Fluege und Arbeit bleiben unveraendert.
  12: (s) => ({ ...s, rulesVersion: 13 }),
  13: migrationRegel13,
};
function migrate(state, from, to, table = MIGRATIONS) {
  let s = state;
  for (let v = from; v < to; v++) {
    if (typeof table[v] !== 'function') throw new Error(`Keine Migration von Schema ${v} nach ${v + 1}`);
    s = table[v](s);
    if (s.schema !== v + 1) throw new Error(`Migration ${v} lieferte Schema ${s.schema}`);
  }
  return s;
}
function save(state) { return canonical(state); }
function load(json, table = MIGRATIONS, currentSchema, currentRulesVersion, ruleTable = RULE_MIGRATIONS) {
  const s = JSON.parse(json);
  if (s === null || typeof s !== 'object' || !Number.isSafeInteger(s.schema)) throw new Error('Spielstand ohne Schema');
  if (s.schema > currentSchema) throw new Error(`Schema ${s.schema} ist neuer als ${currentSchema}`);
  let neu = s.schema < currentSchema ? migrate(s, s.schema, currentSchema, table) : s;
  for (const k of ['tick', 'rng', 'queue', 'ereignisse', 'owners', 'systems', 'minted', 'burned', 'initialSupply', 'rulesVersion', 'stations', 'ships', 'ledger', 'stats', 'sollflotte', 'nextShip'])
    if (!(k in neu)) throw new Error(`Spielstand unvollständig: ${k}`);
  const v = neu.rulesVersion;
  if (!Number.isSafeInteger(v)) throw new Error('Spielstand ohne Regelversion');
  if (v > currentRulesVersion) throw new Error(`Regelversion ${v} ist neuer als ${currentRulesVersion}`);
  for (let r = v; r < currentRulesVersion; r++) {
    if (typeof ruleTable[r] !== 'function') throw new Error(`Regelversion ${v} ist älter als ${currentRulesVersion}, keine Regelmigration vorhanden`);
    neu = ruleTable[r](neu);
  }
  return neu;
}
return { MIGRATIONS, RULE_MIGRATIONS, migrate, save, load };
})();

const m_core_audit = (() => {
const { ids, anzahl } = m_core_zahl;
// v0.11.0 / B3: Bewusste Audit-Entscheidung zu Modulen.
// state.stations[*].module bleibt aus dem Waren-Audit-ist draußen. Einbauten
// werden als ledger[ware].consumed ± 1 gebucht (Install +1, Remove −1); das
// eingebaute Modul taucht weder im Lager noch im Frachtraum auf, ist also
// netto "verbraucht". Zwischen Installation und Ausbau stimmen Ist und Soll,
// weil Remove symmetrisch bucht.
function audit(state) {
  let total = 0;
  for (const o of Object.values(state.owners)) total += o.cash;
  const expected = state.initialSupply + state.minted - (state.burned || 0);
  const isk = { ok: total === expected, total, expected, delta: total - expected };
  const ist = {};
  const zaehle = (lager) => { for (const w of ids(lager)) ist[w] = anzahl(ist, w) + lager[w]; };
  for (const id of ids(state.stations || {})) zaehle(state.stations[id].lager);
  for (const id of ids(state.ships || {})) zaehle(state.ships[id].ladung);
  const ledger = state.ledger || {};
  const goods = { ok: true, delta: {} };
  for (const w of [...new Set([...ids(ledger), ...ids(ist)])].sort()) {
    const l = ledger[w] || { initial: 0, mined: 0, produced: 0, consumed: 0, imported: 0, exported: 0 };
    const soll = l.initial + l.mined + l.produced + l.imported - l.consumed - l.exported;
    const d = anzahl(ist, w) - soll;
    if (d !== 0) { goods.ok = false; goods.delta[w] = d; }
  }
  return { ok: isk.ok && goods.ok, total, expected, delta: total - expected, isk, goods };
}
return { audit };
})();

const m_core_index = (() => {
const { RULES } = m_data_rules;
const createState = (seed = RULES.startSeed, rules = RULES) => m_core_state.createState(seed, rules);
const submit = (state, cmd, rules = RULES) => m_core_commands.submit(state, cmd, rules);
const execute = (state, cmd, rules = RULES) => m_core_commands.execute(state, cmd, rules);
const step = (state, rules = RULES) => m_core_step.step(state, rules);
const advance = (state, n, rules = RULES) => m_core_step.advance(state, n, rules);
const load = (json, table, rules = RULES) => m_core_serialize.load(json, table, rules.schema, rules.rulesVersion);
const preis = (state, station, ware, rules = RULES) => m_core_preis.preis(state, station, ware, rules);
const faktor = (state, station, ware, rules = RULES) => m_core_preis.faktor(state, station, ware, rules);
const { hash, hashString, canonical } = m_core_hash;
const { save, migrate, MIGRATIONS, RULE_MIGRATIONS } = m_core_serialize;
const { audit } = m_core_audit;
const { protokolliere } = m_core_state;
const { rngNext, rngInt } = m_core_rng;
const { div } = m_core_zahl;
const { faktorFormel, preisFormel } = m_core_preis;
const { handel, verkaufbar, aufnehmbar, reserve, obergrenze, stationspreis, gebuehr } = m_core_handel;
const { route } = m_core_route;
const { verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag } = m_core_stunde;
const { reise } = m_core_ankunft;
const { kampf } = m_core_kampf;
const { patrouille, ueberfall, piratenErsatz } = m_core_sicherheit;
const { ersatzkauf, zuschuss } = m_core_schiffbau;
return { hash, hashString, canonical, save, migrate, MIGRATIONS, RULE_MIGRATIONS, audit, protokolliere, rngNext, rngInt, div, faktorFormel, preisFormel, handel, verkaufbar, aufnehmbar, reserve, obergrenze, stationspreis, gebuehr, route, verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag, reise, kampf, patrouille, ueberfall, piratenErsatz, ersatzkauf, zuschuss, CURRENT_SCHEMA: RULES.schema, createState, submit, execute, step, advance, load, preis, faktor };
})();


const api=Object.freeze({core:m_core_index,rules:m_data_rules.RULES});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5uOriginal=api;
})(globalThis);
