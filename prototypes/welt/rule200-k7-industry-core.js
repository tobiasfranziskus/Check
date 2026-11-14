/* W5ac: Rule191 research derivative of original W5 Rule19 PR #170 at c6dea414, incorporating W5s-b #204 paid ferry.
 * W5ac keeps Rule191 behavior; opt-in W5ad Rule192 reuses this core for financed replacement.
 * One common original core for W0-W5, no parallel simulation.
 */
(function createEngine(scope,research=null){
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

// Erzpilot: Regel-15-Forschungsmodus im bestehenden Core, keine parallele Weltuhr.
const m_data_erzpilot = (() => {
  const basis = m_data_rules.RULES;
  const world = {
    ...basis.world,
    systems: { aldera: { station: 'st_aldera', fonds: 'fonds_aldera', sicherheit: 'sicher' } },
    stations: { st_aldera: {
      system: 'aldera', linien: [], verbrauch: {}, ziel: { erz: 100, miner: 4 }, gebuehr: 0,
    } },
    fields: [{ system: 'aldera', ware: 'erz', miner: 0 }],
    gates: [], traders: [],
    sicherheit: { owner: 'security', jaeger: [], fokus: 'schwach', rueckzug: 30 },
    piraten: { owner: 'pirates', markt: 'st_aldera', soll: {} },
    werft: 'st_aldera', zielSchiff: 0, reichsgroesse: 0,
    betriebskosten: { miner: 120 }, npcAusgabenArten: [], senkeBesitzer: [],
    mindeststand: 0, fondsObergrenze: 1000000, npcObergrenze: 1000000,
  };
  const economy = {
    ...basis.economy,
    waren: { erz: { stufe: 'rohstoff', basis: 10 }, miner: { stufe: 'schiff', basis: 600 } },
    rezepte: {}, s: 0, preisgrenzen: [1000, 1000], region: { aldera: 1000 },
    start: { owner: 'house', flotte: [], system: 'aldera', auftrag: 'halten' },
    miningRate: 1, cargo: 100,
  };
  const owners = [
    { id: 'house', kind: 'player', cash: 3000 },
    { id: 'npc3', kind: 'miner', cash: 3000 },
    { id: 'st_aldera', kind: 'station', cash: 1000 },
    { id: 'fonds_aldera', kind: 'fund', cash: 0 },
    { id: 'export', kind: 'buyer', cash: 20000 },
    { id: 'werft_extern', kind: 'vendor', cash: 0 },
  ];
  // Endliches, vorfinanziertes Exportbudget: keine neue ISK, keine stillen Nachfuellungen.
  const ERZ_RULES = { schema: 8, rulesVersion: 15, maxAdvanceSteps: 10000, startSeed: 1,
    economy, world, owners, combat: basis.combat,
    erzpilot: { station: 'st_aldera', exportOwner: 'export',
      werftOwner: 'werft_extern', preis: 10, maximalJeStunde: 200, minerJeMinute: 2, auftragsMenge: 50 },
  };
  // W2-Variantenkern nur im Test-API: alte W1-Saves und Regeln bleiben unveraendert.
  const W2_RULES = { ...ERZ_RULES, rulesVersion: 16,
    erzpilot: { ...ERZ_RULES.erzpilot, npcInvestor: 'npc3' } };
  // W3 ist ein isolierter zweiter Handelsort mit EINER bereits bezahlten
  // kompletten Frachterhuelle und endlichem Stationskaufetat, kein neues ISK.
  const W3_RULES = { ...W2_RULES, rulesVersion: 17,
    world: { ...world,
      systems: { ...world.systems, nadir: { station: 'st_nadir', fonds: 'fonds_transport', sicherheit: 'sicher' } },
      stations: {
        ...world.stations,
        st_aldera: { ...world.stations.st_aldera, ziel: { ...world.stations.st_aldera.ziel, frachter: 1 } },
        st_nadir: { system: 'nadir', linien: [], verbrauch: {}, ziel: { erz: 500 }, gebuehr: 0 },
      },
      gates: [['aldera','nadir',60]],
    },
    economy: { ...economy, waren: { ...economy.waren, frachter: { stufe:'schiff', basis:750 } } },
    owners: [ ...owners,
      { id:'st_nadir', kind:'station', cash:4000 },
      { id:'transport', kind:'carrier', cash:2000 },
      { id:'fonds_transport', kind:'fund', cash:0 },
    ],
    w3: { quellStation:'st_aldera', zielStation:'st_nadir', kunde:'st_nadir',
      spedition:'transport', arbeitsFonds:'fonds_transport',
      fracht:50, arbeitJeMinute:1, frachtgebuehrJeMinute:2 },
  };
  // W4-Draft: dieselbe W3-Welt, echte Nadir-Verarbeitung ohne freie Vorprodukte.
  // Der konkrete 10:5-/20-Minuten-Prozess ist Testparameter, keine Balancingfreigabe.
  const W4_RULES = { ...W3_RULES, rulesVersion:18,
    world: { ...W3_RULES.world, stations: { ...W3_RULES.world.stations,
      st_nadir: { ...W3_RULES.world.stations.st_nadir,
        ziel: { ...W3_RULES.world.stations.st_nadir.ziel, material:200 } },
    } },
    economy: { ...W3_RULES.economy, waren: { ...W3_RULES.economy.waren,
      material: { stufe:'material', basis:20 } } },
    owners: [...W3_RULES.owners,
      {id:'arbeitskraefte_nadir',kind:'labor',cash:0}],
    w4: {station:'st_nadir',arbeitOwner:'arbeitskraefte_nadir',
      erzJeCharge:10,materialJeCharge:5,dauer:20,lohnJeMinute:1},
  };
  // W5: Ein realer Frachter aus fünf W4-Material, ausschließlich aus
  // vorhandenen Werfteinnahmen finanziert. Pilotparameter, kein Balancing.
  const W5_RULES = { ...W4_RULES, rulesVersion:191,
    world: { ...W4_RULES.world, stations: { ...W4_RULES.world.stations,
      st_nadir: { ...W4_RULES.world.stations.st_nadir,
        ziel: { ...W4_RULES.world.stations.st_nadir.ziel, frachter:2 } },
    } },
    owners: [...W4_RULES.owners,
      {id:'arbeiter_werft_nadir',kind:'labor',cash:0},
      {id:'w5ac_transfer_reserved',kind:'w5ac-escrow',cash:0},
      {id:'w5ac_transfer_pilot',kind:'w5ac-labor',cash:0}],
    w5: {station:'st_nadir',werft:'werft_extern',arbeiter:'arbeiter_werft_nadir',
      kaeufer:'transport',material:5,materialPreis:100,
      klasse:'frachter',dauer:30,lohnJeMinute:1,
      verkaufsPreis:W4_RULES.economy.waren.frachter.basis},
    w5Transfer:{owner:'transport',quelle:'nadir',ziel:'aldera',zielStation:'st_aldera',
      lohnJeMinute:W4_RULES.w3.arbeitJeMinute,
      reserved:'w5ac_transfer_reserved',pilot:'w5ac_transfer_pilot'},
  };
  // W5ad uses this SAME core. Genesis allocations are explicit research inputs,
  // never transfers or rescue during a running economy; total remains 33,000 ISK.
  if(research){
    W5_RULES.rulesVersion=research.personalWages===true?195:research.waterTrade===true?194:research.wageTrade===true?193:192;
    if(research.kanon===true)W5_RULES.rulesVersion=research.industryOre===true?200:199;
    if(research.industryOre===true)W5_RULES.k7={industrieErz:true, charge:50};
    // J2b ausschliesslich explizites Forschungsprofil 201. Die bestehende
    // Regel200, alte Hashes und Spielstaende kennen diese Ware NICHT.
    if(research.silizium===true){
      W5_RULES.rulesVersion=201;
      W5_RULES.j2b=Object.freeze({ware:'silizium',station:'st_nadir',
        feld:{system:'nadir',x:720000,y:-480000,radius:144000,vorrat:16},
        charge:8, minutenJeEinheit:8, lohnJeMinute:2, preis:24});
      W5_RULES.world={...W5_RULES.world,
        fields:[...W5_RULES.world.fields,{system:'nadir',ware:'silizium',miner:0}],
        stations:{...W5_RULES.world.stations,st_nadir:{
          ...W5_RULES.world.stations.st_nadir,
          ziel:{...W5_RULES.world.stations.st_nadir.ziel,silizium:0}
        }}};
      W5_RULES.economy={...W5_RULES.economy,waren:{
        ...W5_RULES.economy.waren,silizium:{stufe:'rohstoff',basis:24}
      }};
    }
    if(Object.keys(research).some(k=>!['carrierCash','buyerCash','wageTrade','waterTrade','personalWages','kanon','ort','industryOre','silizium','bauteile'].includes(k))
      || (Object.hasOwn(research,'kanon')&&(research.kanon!==true||research.personalWages!==true))
      || (Object.hasOwn(research,'ort')!==(research.kanon===true))
      || (research.kanon===true&&(typeof research.ort?.imFeld!=='function'
        ||typeof research.ort?.angedocktAn!=='function'))
      || (Object.hasOwn(research,'wageTrade')&&research.wageTrade!==true)
      || (Object.hasOwn(research,'waterTrade')&&research.waterTrade!==true)
      || (research.waterTrade===true&&research.wageTrade!==true)
      || (research.personalWages===true&&(research.waterTrade!==true||research.wageTrade!==true))
      || (Object.hasOwn(research,'personalWages')&&research.personalWages!==true)
      || (Object.hasOwn(research,'industryOre')&&(research.industryOre!==true||research.kanon!==true))
      || (Object.hasOwn(research,'silizium')&&(research.silizium!==true||research.industryOre!==true))
      || (Object.hasOwn(research,'bauteile')&&(research.bauteile!==true||research.silizium!==true)))
      throw TypeError('Unbekannter W5ad-Startparameter');
    const carrierCash=research.carrierCash??2000,buyerCash=research.buyerCash??4000;
    if(![carrierCash,buyerCash].every(n=>Number.isSafeInteger(n)&&n>=0)
      ||carrierCash+buyerCash>9000)throw TypeError('W5ad: ungueltige Anfangsverteilung');
    W5_RULES.owners=W5_RULES.owners.map(o=>({...o,cash:o.id==='transport'?carrierCash:
      o.id==='st_nadir'?buyerCash:o.id==='house'?9000-carrierCash-buyerCash:o.cash}));
    W5_RULES.w5Replacement={carrierCash,buyerCash};
    if(research.waterTrade===true){
      W5_RULES.world={...W5_RULES.world,
        fields:[...W5_RULES.world.fields,{system:'aldera',ware:'eis',miner:0}],
        stations:{...W5_RULES.world.stations,
          st_aldera:{...W5_RULES.world.stations.st_aldera,
            ziel:{...W5_RULES.world.stations.st_aldera.ziel,eis:120}},
          st_nadir:{...W5_RULES.world.stations.st_nadir,
            ziel:{...W5_RULES.world.stations.st_nadir.ziel,eis:120,wasser:100}}}
      };
      W5_RULES.economy={...W5_RULES.economy,waren:{...W5_RULES.economy.waren,
        eis:{stufe:'rohstoff',basis:5},wasser:{stufe:'verbrauch',basis:14}}};
      W5_RULES.owners=[...W5_RULES.owners,{id:'w5n_arbeit',kind:'labor',cash:0}];
      W5_RULES.w5n={
        quellStation:'st_aldera',zielStation:'st_nadir',kunde:'fonds_transport',
        frachterOwner:'transport',mineLohn:2,charge:50,eisPreis:5,
        flugMinuten:60,frachtJeMinute:2,fliegerLohn:1,
        rezeptEis:10,rezeptWasser:10,fabrikMinuten:20,fabrikLohn:1,
        wasserPreis:14,verbrauchStunde:2
      };
    }
    if(research.personalWages===true){
      W5_RULES.owners=[...W5_RULES.owners,
        {id:'pilot_erz',kind:'private-pilot',cash:0},
        {id:'pilot_eis',kind:'private-pilot',cash:0}];
      W5_RULES.w5ag={
        fonds:'fonds_transport',pilots:{erz:'pilot_erz',eis:'pilot_eis'},
        wagePerMinute:W5_RULES.w3.arbeitJeMinute
      };
    }
    // K1 / Regel 199: kanonische Welt. Nur Kennung; Parameter und Buch liegen in m_core_welt.
    if(research.bauteile===true){
      // J3: Rezept exakt aus dem vorhandenen R14-r_bauteil. Kein Gratis-Vorrat.
      W5_RULES.rulesVersion=202;
      W5_RULES.j3=Object.freeze({station:'st_nadir',owner:'st_nadir',
        arbeit:'j3_bauteil_arbeiter',material:2,silizium:1,
        proCharge:1,dauer:8,lohnJeMinute:1,preisBauteil:75});
      W5_RULES.world={...W5_RULES.world,stations:{
        ...W5_RULES.world.stations,st_nadir:{
          ...W5_RULES.world.stations.st_nadir,
          ziel:{...W5_RULES.world.stations.st_nadir.ziel,bauteil:0}
        }}};
      W5_RULES.economy={...W5_RULES.economy,waren:{
        ...W5_RULES.economy.waren,bauteil:{stufe:'bauteil',basis:75}
      }};
      W5_RULES.owners=[...W5_RULES.owners,
        {id:'j3_bauteil_arbeiter',kind:'labor',cash:0}];
    }
    if(research.kanon===true)W5_RULES.kanon={profil:'K1'};
    if(research.wageTrade===true){
      // New hypothetical contract: a collectively owned wage fund purchases
      // REAL W4 material and physically holds it, rather than pretending a
      // household has consumed water that this little world cannot produce.
      W5_RULES.w5WageTrade={
        buyer:'fonds_transport',seller:'st_nadir',ware:'material',
        preis:W5_RULES.w5.materialPreis
      };
    }
  }
  m_data_systeme.tiefFrieren(ERZ_RULES);
  m_data_systeme.tiefFrieren(W2_RULES);
  m_data_systeme.tiefFrieren(W3_RULES);
  m_data_systeme.tiefFrieren(W4_RULES);
  m_data_systeme.tiefFrieren(W5_RULES);
  return { ERZ_RULES, W2_RULES, W3_RULES, W4_RULES, W5_RULES };
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

// K1 (Forschungsregel 199): Haken der kanonischen Welt im SELBEN Kern.
// Ohne research.kanon gilt netto=0 und jede Ortsprüfung ist wahr: Regel14–198 bleiben bitgleich.
const m_core_kanon = (() => {
  const ORT = research && research.kanon === true ? research.ort : null;
  // Kumulierter Netto-Abfluss (positiv) bzw. -Zufluss (negativ) eines Kontos aus
  // belegten K1-Zusatzbuchungen. Die Stufen-Audits rekonstruieren weiterhin nur ihre
  // eigenen Flüsse; dieser eine benannte Korrekturterm verbindet beide Bücher.
  const netto = (s, id) => (s && s.kanon && Object.hasOwn(s.kanon.netto, id) ? s.kanon.netto[id] : 0);
  // Wasser, das Nadir über K1 verlässt (Einzelhandel vor Ort + Rückfracht), und K1-Endverbrauch.
  const wasserAbNadir = (s) => (s && s.kanon ? s.kanon.wasser.abNadir : 0);
  const wasserKonsum = (s) => (s && s.kanon ? s.kanon.wasser.konsum : 0);
  const imFeld = (sh, ware) => !ORT || !sh.flug || ORT.imFeld(sh, ware);
  const amDock = (sh, station) => !ORT || !sh.flug || ORT.angedocktAn(sh, station);
  const aktiv = () => !!ORT;
  return { netto, wasserAbNadir, wasserKonsum, imFeld, amDock, aktiv };
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
  shipInstall: ['schiff', 'modul'], stationBuy: ['schiff'], shipBuy: ['klasse', 'station'],
  stationRecipe: ['station', 'rezept'], shipRemoveModule: ['schiff', 'modul'],
  shipFreight: ['schiff'], stationRefine: ['station'],
  stationBuildShip: ['station'], shipReposition: ['schiff'],
  // J2a/Regel200-Forschung: lokale Abholung nur fertig produzierter K2-Miner.
  stationClaimMinerLocal: ['station'],
  researchShipLoss: ['schiff'], shipReplace: ['verlust','reserve'],
  workerMaterialBuy: ['menge'],
  shipFreightIce:['schiff'],shipSellIce:['schiff','menge'],
  stationWater:['station'],workerWaterBuy:['menge'],pilotWaterBuy:['menge'],
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
    if (rules.w3 && s.klasse === 'frachter' && cmd.type !== 'shipFreight' && cmd.type !== 'shipRename'
      && !(rules.w5Transfer && cmd.type === 'shipReposition')
      && !(rules.w5Replacement && cmd.type === 'researchShipLoss')
      && !(rules.w5n && cmd.type === 'shipFreightIce'))
      return 'W3-Frachter ausschließlich per finanziertem Transportauftrag steuern';
    if(cmd.type==='shipFreightIce'){
      const q=m_core_w5n.pruefenFracht(state,rules,s);
      if(!q.ok)return q.grund;
    }
    if(cmd.type==='shipSellIce'){
      if(!rules.w5n||s.klasse!=='miner'||!Number.isSafeInteger(cmd.menge)
        ||cmd.menge<=0||s.system!=='aldera'
        ||!m_core_w5n.ankaufbar(state,rules,s,cmd.menge))
        return 'Nur echt gefoerdertes, finanzierbares Eis kaufen';
    }
    if (cmd.type === 'shipReposition') {
      const p=m_core_w5_transfer.pruefen(state,rules,s);
      if(!p.ok)return p.grund;
    }
    if (cmd.type === 'shipFreight') {
      if (!rules.w3) return 'W3-Transport in dieser Regel nicht aktiv';
      const pruefung = m_core_w3.pruefen(state, rules, s);
      if (!pruefung.ok) return pruefung.grund;
    }
    if (cmd.type === 'shipHandeln' && s.klasse !== 'frachter') return 'nur Frachter können selbständig handeln';
    if (cmd.type === 'shipMine') {
      if(rules.w5n&&((cmd.ware==='eis'&&(s.ladung.erz||0)>0)
        ||(cmd.ware==='erz'&&(s.ladung.eis||0)>0)))
        return 'Erz- und Eisfracht nicht unbemerkt in derselben Miner-Ladung mischen';
      if(rules.w5n&&cmd.ware==='eis'&&state.erzpilotVertraege?.[s.id])
        return 'Eisabbau erfordert vollstaendig abgeschlossenen Erzauftrag';
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
  if(cmd.type==='stationWater'){
    const q=m_core_w5n.pruefenWasser(state,rules,cmd.owner,cmd.station);
    if(!q.ok)return q.grund;
  }
  if(cmd.type==='workerWaterBuy'){
    if(rules.w5ag)return 'Kollektivfonds hat in Regel195 kein privates Kaufrecht';
    const q=m_core_w5n.pruefenKonsum(state,rules,cmd.owner,cmd.menge);
    if(!q.ok)return q.grund;
  }
  if(cmd.type==='pilotWaterBuy'){
    if(!rules.w5ag)return 'Privatpiloten gibt es nur in Regel195';
    const q=m_core_w5n.pruefenKonsum(state,rules,cmd.owner,cmd.menge);
    if(!q.ok)return q.grund;
  }
  if (cmd.type === 'stationRefine') {
    if (!rules.w4) return 'Raffinerie in dieser Regel nicht aktiv';
    const pruefung = m_core_w4.pruefen(state,rules,cmd.owner,cmd.station);
    if (!pruefung.ok) return pruefung.grund;
  }
  if (cmd.type === 'stationBuildShip') {
    if (!rules.w5) return 'W5-Werft in dieser Regel nicht aktiv';
    const pruefung=m_core_w5.pruefen(state,rules,cmd.owner,cmd.station);
    if (!pruefung.ok) return pruefung.grund;
  }
  if(cmd.type==='researchShipLoss'){
    const q=m_core_w5_replacement.lossQuote(state,rules,state.ships[cmd.schiff]);
    if(!q.ok)return q.grund;
  }
  if(cmd.type==='shipReplace'){
    const q=m_core_w5_replacement.quote(state,rules,cmd.owner,cmd.verlust,cmd.reserve);
    if(!q.ok)return q.grund;
  }
  if(cmd.type==='workerMaterialBuy'){
    if(rules.w5ag)return 'Keine ungeprueften Kollektiv-Eigentumsrechte in Regel195';
    const q=m_core_w5_wage_trade.pruefen(state,rules,cmd.owner,cmd.menge);
    if(!q.ok)return q.grund;
  }
  if (rules.erzpilot && !['shipBuy', 'shipMine', 'shipWait', 'shipRename',
    ...(rules.w3 ? ['shipFreight'] : []), ...(rules.w4 ? ['stationRefine'] : []),
    ...(rules.w5 ? ['stationBuildShip'] : []),
    ...(rules.w5Transfer ? ['shipReposition'] : []),
    ...(rules.w5Replacement ? ['researchShipLoss','shipReplace'] : []),
    ...(rules.w5WageTrade ? ['workerMaterialBuy'] : []),
    ...(rules.w5n?['shipSellIce','shipFreightIce','stationWater','workerWaterBuy']:[]),
    ...(rules.w5ag?['pilotWaterBuy']:[]),
    ...(rules.k7?['stationClaimMinerLocal']:[])].includes(cmd.type))
    return 'Im Erzpilot derzeit nicht freigeschaltet';
  if (cmd.type === 'stationClaimMinerLocal') {
    // Keine Änderung des bestehenden shipBuy: die alten K2-Rückfracht-/J2-
    // Negativreferenzen bleiben dadurch bitgleich. Nur aktives K7-Regel200.
    const b = state.kanon?.minerWerft;
    if (!rules.k7 || !rules.kanon || !b || cmd.station !== rules.w5.station
      || !['house','npc3'].includes(cmd.owner)
      || b.auftrag || b.transport || b.wartetAuf !== cmd.owner
      || (state.stations[cmd.station]?.lager?.miner || 0) !== 1
      || b.fertig - b.verladen - (b.lokalGekauft || 0) !== 1)
      return 'K2/J2a: Nur der echte vorgemerkte Nadir-Miner darf lokal gekauft werden';
    if (state.owners[cmd.owner].cash < rules.economy.waren.miner.basis)
      return 'K2/J2a: 600 ISK für den eigenen Miner fehlen';
  }
  if (cmd.type === 'shipBuy') {
    // K1: bezahlter Aldera-Kauf; K7 zusätzlich reale W5-Nadir-Hüllen.
    // Regel195 und alle anderen Profile bleiben unverändert.
    const frachter = !!rules.w3 && cmd.klasse === 'frachter'
      && (cmd.owner === rules.w3.spedition
        || (!!rules.kanon && cmd.owner === rules.economy.start.owner && (cmd.station === rules.erzpilot.station
          || (!!rules.k7 && cmd.station === rules.w5.station))));
    const miner = cmd.klasse === 'miner' && (cmd.owner === 'house' || cmd.owner === 'npc3');
    const w5Kauf = !!rules.w5 && (cmd.owner === rules.w5.kaeufer
      || (!!rules.k7 && cmd.owner === rules.economy.start.owner))
      && cmd.klasse === rules.w5.klasse && cmd.station === rules.w5.station;
    if (!rules.erzpilot || (!frachter && !miner) || (cmd.station !== rules.erzpilot.station && !w5Kauf))
      return 'Komplettkauf nur fuer finanzierte Miner oder Frachter am Handelsplatz';
    if ((state.stations[cmd.station].lager[cmd.klasse] || 0) < 1) return 'kein Komplettschiff auf Lager';
    if (w5Kauf && !m_core_w5.verkaufPruefen(state,rules,cmd.owner).ok)
      return 'W5-Schiffskauf nicht belegbar';
    if (state.owners[cmd.owner].cash < rules.economy.waren[cmd.klasse].basis) return 'zu wenig ISK';
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
    case 'shipSellIce':{
      m_core_w5n.verkauf(state,rules,state.ships[cmd.schiff],cmd.menge);break;
    }
    case 'shipFreightIce':{
      m_core_w5n.frachtStart(state,rules,state.ships[cmd.schiff]);
      if(rules.w5ag)m_core_w5ag.iceStart(state,rules,cmd.schiff);
      break;
    }
    case 'stationWater':{
      m_core_w5n.wasserStart(state,rules,cmd.owner,cmd.station);break;
    }
    case 'pilotWaterBuy':
    case 'workerWaterBuy':{
      m_core_w5n.verbrauch(state,rules,cmd.owner,cmd.menge);break;
    }
    case 'workerMaterialBuy': {
      m_core_w5_wage_trade.kaufen(state,rules,cmd.owner,cmd.menge);break;
    }
    case 'researchShipLoss': {
      m_core_w5_replacement.lose(state,rules,state.ships[cmd.schiff]);break;
    }
    case 'shipReplace': {
      m_core_w5_replacement.replace(state,rules,cmd);break;
    }
    case 'shipReposition': {
      m_core_w5_transfer.start(state,rules,state.ships[cmd.schiff]);break;
    }
    case 'shipBuy':
    case 'stationClaimMinerLocal': {
      const localMiner = cmd.type === 'stationClaimMinerLocal';
      const klasse = localMiner ? 'miner' : cmd.klasse;
      const p = rules.economy.waren[klasse].basis;
      state.owners[cmd.owner].cash -= p;
      state.owners[rules.erzpilot.werftOwner].cash += p;
      state.stations[cmd.station].lager[klasse] -= 1;
      state.ledger[klasse].consumed += 1;
      const w5Kauf = !!rules.w5 && cmd.station === rules.w5.station
        && klasse === rules.w5.klasse && (cmd.owner === rules.w5.kaeufer
          || (!!rules.k7 && cmd.owner === rules.economy.start.owner));
      const system = w5Kauf || localMiner ? 'nadir' : 'aldera';
      const sh = m_core_state.neuesSchiff(state, {
        owner: cmd.owner, klasse, system,
        heimat: system, auftrag: 'halten', ware: null,
      });
      if(localMiner){
        const b=state.kanon.minerWerft;
        b.lokalGekauft=(b.lokalGekauft||0)+1;
        (b.lokaleKaeufe ||= []).push({
          id:sh.id,tick:state.tick,owner:cmd.owner,station:cmd.station,preis:p
        });
        b.wartetAuf=null;
      }
      if(rules.w5Replacement&&cmd.owner===rules.w3.spedition)
        state.w5ad.purchases.push({id:sh.id,tick:state.tick,station:cmd.station,preis:p});
      // Zusätzliche physische Spielerhülle: einmaliger Originalkaufbeleg.
      // Nur K1. Kein Journal bei Regel195 oder anderem Profil.
      if(rules.kanon && klasse==='frachter' && cmd.owner===rules.economy.start.owner)
        (state.kanon.spielerFrachterKaeufe ||= []).push({id:sh.id,tick:state.tick,station:cmd.station,preis:p});
      if (w5Kauf) {
        state.w5.verkauft++;
        state.w5.schiffIds.push(sh.id);
      }
      m_core_handel.buche(state, cmd.owner, 'kosten', p);
      m_core_handel.buche(state, rules.erzpilot.werftOwner, 'erloes', p);
      m_core_state.protokolliere(state, 'dienst', `${sh.id} als Komplettschiff fuer ${p} ISK gekauft`, cmd.owner);
      break;
    }
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
    case 'shipFreight': {
      m_core_w3.starten(state, rules, state.ships[cmd.schiff]); break;
    }
    case 'stationRefine': {
      m_core_w4.starten(state,rules,cmd.owner,cmd.station); break;
    }
    case 'stationBuildShip': {
      m_core_w5.starten(state,rules,cmd.owner,cmd.station); break;
    }
    case 'shipWait': {
      const s = state.ships[cmd.schiff];
      s.auftrag = 'halten'; s.eskorte = null;
      if (rules.erzpilot) m_core_erzpilot.stornieren(state, rules, s);
      break;
    }
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
  const vertrag = rules.erzpilot && !kauf && ware === 'erz'
    ? state.erzpilotVertraege?.[schiff.id] : null;
  if (rules.erzpilot && !kauf && ware === 'erz' && !vertrag) return false;
  const zahlkonto = vertrag ? state.owners[vertrag.konto] : kasse;
  const besitzer = state.owners[schiff.owner];
  const fondsId = fondsIn(rules, st.system);
  const wert = menge * p;
  const fee = gebuehr(state, rules, station, wert);
  const fracht = Object.values(schiff.ladung).reduce((a, b) => a + b, 0);
  const reicht = kauf
    ? anzahl(st.lager, ware) >= menge && besitzer.cash >= wert + fee
      && (freigestellt || (fracht + menge <= rules.economy.cargo
        && anzahl(st.lager, ware) - menge >= reserve(rules, station, ware)))
    : anzahl(schiff.ladung, ware) >= menge && zahlkonto.cash >= wert
      && (!vertrag || (menge <= vertrag.menge && vertrag.preis === p))
      && anzahl(st.lager, ware) + menge <= obergrenze(state, rules, station, ware);
  if (!reicht) return false;
  const d = kauf ? menge : -menge;
  st.lager[ware] -= d;
  schiff.ladung[ware] = anzahl(schiff.ladung, ware) + d;
  if (schiff.ladung[ware] === 0) delete schiff.ladung[ware];
  const geld = kauf ? wert : -wert;
  besitzer.cash -= geld; zahlkonto.cash += geld;
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
    if (!m_core_kanon.imFeld(s, ware)) {
      // K1: ohne Aufenthalt im Rohstofffeld keine Förderung. Ein erfüllter
      // Erzauftrag wird erst am Dock der Abnahmestation abgerechnet.
      if (rules.erzpilot && ware === 'erz') m_core_erzpilot.abliefern(state, rules, s);
      continue;
    }
    if (rules.erzpilot) {
      if(rules.w5n&&ware==='eis')m_core_w5n.foerdern(state,rules,s);
      else m_core_erzpilot.foerdern(state, rules, s);
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
return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, entfernen };
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

// W0/W1: Vorfinanzierte Erzauftraege und echte Abnahme im vorhandenen Core.
// Die Station sperrt Geld und Lagerkapazitaet vor Arbeitsbeginn; kein Minting.
const m_core_erzpilot = (() => {
  const { anzahl, ids } = m_core_zahl;
  const { buche, handel, obergrenze } = m_core_handel;
  const { protokolliere } = m_core_state;
  // Anzeigen und Audits duerfen alte Regel-15-Spielstaende ohne Auftragsbuch nicht mutieren.
  function vertragsbuch(state) { return state.erzpilotVertraege || {}; }
  function reserviert(state) {
    return Object.values(vertragsbuch(state)).reduce((sum, v) => sum + v.menge, 0);
  }
  // Frei finanzierbare Endabnahme: Ware im Stationslager, laufende Vertraege
  // und unverkaufte Fracht ohne Vertrag sind bereits vom Käuferetat gedeckt.
  function freieEndnachfrage(state, rules, ausnahmeSchiff = '') {
    const cfg = rules.erzpilot, buch = vertragsbuch(state);
    const bestand = anzahl(state.stations[cfg.station].lager, 'erz');
    const fremdeFracht = ids(state.ships).reduce((sum, id) => {
      if (id === ausnahmeSchiff || buch[id]) return sum;
      return sum + anzahl(state.ships[id].ladung, 'erz');
    }, 0);
    return Math.max(0, Math.floor(state.owners[cfg.exportOwner].cash / cfg.preis)
      - bestand - reserviert(state) - fremdeFracht);
  }
  function beauftragen(state, rules, schiff) {
    const cfg = rules.erzpilot, buch = (state.erzpilotVertraege ||= {});
    if (cfg.npcInvestor && !m_core_audit.audit(state).finanzierung?.ok) return null;
    if (buch[schiff.id]) return buch[schiff.id];
    const station = state.owners[cfg.station];
    const lager = state.stations[cfg.station].lager;
    const freiePlaetze = obergrenze(state, rules, cfg.station, 'erz')
      - anzahl(lager, 'erz') - reserviert(state);
    const vorhandenesErz = anzahl(schiff.ladung, 'erz');
    const verfuengbareArbeit = Math.floor(state.owners[schiff.owner].cash / cfg.minerJeMinute);
    let menge = Math.max(0, Math.min(cfg.auftragsMenge, rules.economy.cargo,
      Math.floor(station.cash / cfg.preis), freiePlaetze,
      Math.max(vorhandenesErz, verfuengbareArbeit)));
    // Regel16: Endverbraucher muss auch diese neue Charge nachvollziehbar
    // bezahlen koennen, nicht nur die lokale Station. Gilt fuer Spieler UND NPC.
    const industrie = rules.k7 && state.w3?.auftrag?.phase === 'vorbestellt'
      && state.w3.auftrag.industrieMiner === schiff.id
      && state.kanon?.industrieErz?.phase === 'aktiv'
      && state.kanon.industrieErz.erzAngenommen === false;
    if (cfg.npcInvestor && !industrie) menge = Math.min(menge, freieEndnachfrage(state, rules, schiff.id));
    if (industrie) menge = Math.min(menge, state.w3.auftrag.menge);
    if (menge <= 0) return null;
    const wert = menge * cfg.preis, konto = `erz_treuhand_${schiff.id}`;
    const arbeitsKonto = `erz_arbeit_${schiff.id}`;
    const arbeitsBudget = Math.max(0, menge - vorhandenesErz) * cfg.minerJeMinute;
    if (state.owners[schiff.owner].cash < arbeitsBudget) throw Error('Bergbauauftrag ohne Arbeitskapital');
    if (!state.owners[konto]) state.owners[konto] = { id: konto, kind: 'escrow', cash: 0 };
    if (!state.owners[arbeitsKonto]) state.owners[arbeitsKonto] = { id: arbeitsKonto, kind: 'escrow', cash: 0 };
    if (state.owners[konto].cash !== 0 || state.owners[arbeitsKonto].cash !== 0)
      throw Error('Doppelt gebundenes Auftragskapital');
    station.cash -= wert;
    state.owners[konto].cash += wert;
    state.owners[schiff.owner].cash -= arbeitsBudget;
    state.owners[arbeitsKonto].cash += arbeitsBudget;
    buch[schiff.id] = { konto, arbeitsKonto, menge, preis: cfg.preis, arbeitsPreis: cfg.minerJeMinute };
    return buch[schiff.id];
  }
  function abschliessen(state, rules, schiff, stornierung = false) {
    const cfg = rules.erzpilot, buch = vertragsbuch(state);
    const v = buch[schiff.id];
    if (!v) return 0;
    const menge = Math.min(v.menge, anzahl(schiff.ladung, 'erz'));
    if (!stornierung && menge < v.menge) return 0;
    // K1: Ware bleibt bis zur Übergabe am Dock an Bord; ein Storno im Raum gibt
    // nur die Treuhandbeträge zurück und verkauft nichts aus der Ferne.
    const amDock = m_core_kanon.amDock(schiff, cfg.station);
    if (!stornierung && !amDock) return 0;
    if (menge > 0 && amDock) {
      if (!handel(state, rules, schiff, cfg.station, 'erz', menge, false))
        throw Error('Reservierter Erzauftrag kann nicht bezahlt werden');
      state.stats.handel += 1;
      state.stats.verkaeufe[schiff.id] += 1;
    }
    const treuhand = state.owners[v.konto];
    if (treuhand.cash > 0) {
      state.owners[cfg.station].cash += treuhand.cash;
      treuhand.cash = 0;
    }
    // Betriebsmittel waren ebenfalls reserviert; beim Abbruch ungenutzten Rest zurueckgeben.
    if (v.arbeitsKonto) {
      const arbeit = state.owners[v.arbeitsKonto];
      state.owners[schiff.owner].cash += arbeit.cash;
      arbeit.cash = 0;
    }
    delete buch[schiff.id];
    if (!stornierung && menge > 0 && rules.k7 && state.w3?.auftrag?.phase === 'vorbestellt'
      && state.w3.auftrag.industrieMiner === schiff.id && state.kanon?.industrieErz?.phase === 'aktiv')
      state.kanon.industrieErz.erzAngenommen = true;
    return menge;
  }
  function stornieren(state, rules, schiff) {
    if (!rules.erzpilot) return 0;
    return abschliessen(state, rules, schiff, true);
  }
  // K1: Abnahme eines bereits vollständig geförderten Auftrags am Dock.
  function abliefern(state, rules, schiff) {
    const v = vertragsbuch(state)[schiff.id];
    if (!v || anzahl(schiff.ladung, 'erz') < v.menge) return 0;
    return abschliessen(state, rules, schiff);
  }
  function foerdern(state, rules, schiff) {
    const cfg = rules.erzpilot;
    const v = beauftragen(state, rules, schiff);
    if (!v) return 0; // kein Auftrag: keine unbezahlte oder spekulative Produktion.
    const vorher = anzahl(schiff.ladung, 'erz');
    if (vorher >= v.menge) return abschliessen(state, rules, schiff);
    const n = Math.min(rules.economy.miningRate, v.menge - vorher, rules.economy.cargo - vorher);
    const kosten = n * cfg.minerJeMinute;
    // Alte Regel-15-Draft-Saves ohne Arbeits-Treuhand weiter abwickeln,
    // neue Auftraege sind dagegen beidseitig voll vorfinanziert.
    const kasse = v.arbeitsKonto ? state.owners[v.arbeitsKonto] : state.owners[schiff.owner];
    if (n <= 0 || kasse.cash < kosten) {
      schiff.auftrag = 'halten';
      stornieren(state, rules, schiff);
      protokolliere(state, 'kosten',
        `${schiff.id}: Förderung mangels eigener Betriebsmittel gestoppt`, schiff.owner);
      return 0;
    }
    kasse.cash -= kosten;
    state.owners[rules.world.systems[schiff.system].fonds].cash += kosten;
    buche(state, schiff.owner, 'kosten', kosten);
    schiff.ladung.erz = vorher + n;
    state.ledger.erz.mined += n;
    if (schiff.ladung.erz >= v.menge) abschliessen(state, rules, schiff);
    return n;
  }
  // Export: nur nachweislich gelagertes Erz gegen reales endliches Kaeuferbudget.
  function exportiere(state, rules) {
    if (!rules.erzpilot) return 0;
    // W2 darf auch bei direkter Core-Nutzung keine unbelegte Aufstockung
    // des Endkundenkontos als neuen realen Absatz behandeln.
    if (rules.erzpilot.npcInvestor && !m_core_audit.audit(state).finanzierung?.ok)
      throw Error('W2: Endkundenkonto ohne belegte Einnahme; kein weiterer Erzexport');
    const cfg = rules.erzpilot;
    const lager = state.stations[cfg.station].lager;
    const kaeufer = state.owners[cfg.exportOwner];
    const station = state.owners[cfg.station];
    const menge = Math.min(anzahl(lager, 'erz'),
      Math.floor(kaeufer.cash / cfg.preis), cfg.maximalJeStunde);
    if (menge <= 0) return 0;
    const wert = menge * cfg.preis;
    lager.erz -= menge;
    state.ledger.erz.exported += menge;
    kaeufer.cash -= wert;
    station.cash += wert;
    buche(state, cfg.exportOwner, 'kosten', wert);
    buche(state, cfg.station, 'erloes', wert);
    return menge;
  }
  // W2: Entscheidung aus tatsaechlicher Nachfrage, bezahlter Arbeit und
  // belegtem Unternehmenssaldo. Nur vorhandene Core-Kauf-/Miningbefehle ausfuehren.
  function investitionsPruefung(state, rules) {
    const cfg = rules.erzpilot;
    if (!cfg?.npcInvestor) return { ok: false, grund: 'W2-Autonomie nicht aktiv' };
    const owner = cfg.npcInvestor;
    const schiffe = Object.values(state.ships);
    const eigene = schiffe.filter((s) => s.owner === owner && s.klasse === 'miner');
    const aktiv = schiffe.filter((s) => s.klasse === 'miner'
      && s.system === rules.world.stations[cfg.station].system && s.phase === 'dock'
      && s.auftrag === 'foerdern');
    const job = cfg.auftragsMenge, p = cfg.preis, lohn = cfg.minerJeMinute;
    const kaufpreis = rules.economy.waren.miner.basis;
    const marge = p - lohn;
    if (!m_core_audit.audit(state).ok) return { ok: false, grund: 'Bilanzabweichung' };
    if (marge <= 0) return { ok: false, grund: 'Keine positive Einheitsmarge' };
    if (eigene.length === 0 || aktiv.every((x) => x.owner !== owner))
      return { ok: false, grund: 'Kein aktiver NPC-Bergbau' };
    const saldo = state.stats.konto[owner];
    if (saldo.erloes - saldo.kosten <= 0)
      return { ok: false, grund: 'Bestehender Miner noch nicht amortisiert' };
    if (state.stations[cfg.station].lager.miner < 1)
      return { ok: false, grund: 'Kein fertiger Miner am Markt' };
    // Sowohl aktueller als auch zusaetzlicher Miner benoetigen je eine
    // sofort finanzierbare Charge. Vorhandenes Treuhandgeld zählt als gebunden.
    const vertraege = vertragsbuch(state);
    const reservierung = Object.values(vertraege).reduce((n, v) => n + v.menge, 0);
    const mittel = Object.values(vertraege).reduce((n, v) => n + (state.owners[v.konto]?.cash || 0), 0);
    const platz = obergrenze(state, rules, cfg.station, 'erz')
      - anzahl(state.stations[cfg.station].lager, 'erz');
    const gebraucht = Math.max(reservierung, aktiv.length * job) + job;
    if (platz < gebraucht)
      return { ok: false, grund: 'Lagerkapazitaet reicht nicht fuer zwei parallele Chargen' };
    if (state.owners[cfg.station].cash + mittel < gebraucht * p)
      return { ok: false, grund: 'Stationskapital reicht nicht fuer parallele Abnahme' };
    const amortisation = Math.ceil(kaufpreis / marge);
    if (state.owners[cfg.exportOwner].cash < (aktiv.length + 1) * amortisation * p)
      return { ok: false, grund: 'Endkunde kann zusaetzliche Miner nicht amortisieren' };
    const eigeneArbeit = eigene.filter((x) => x.auftrag === 'foerdern').length;
    if (state.owners[owner].cash < kaufpreis + (eigeneArbeit + 1) * job * lohn)
      return { ok: false, grund: 'Firmenkapital deckt Huelle und laufende Arbeit nicht' };
    return { ok: true, grund: 'Bezahlte Expansion wirtschaftlich moeglich',
      kaufpreis, amortisation, job, aktiveMiner: aktiv.length };
  }
  function npcInvestieren(state, rules) {
    const pruefung = investitionsPruefung(state, rules);
    if (!pruefung.ok) return false;
    const cfg = rules.erzpilot, owner = cfg.npcInvestor;
    const idAlt = state.nextShip;
    const kauf = m_core_commands.execute(state,
      { type: 'shipBuy', owner, klasse: 'miner', station: cfg.station }, rules);
    if (!kauf.ok) throw Error('W2: unmoeglicher NPC-Komplettkauf: ' + kauf.reason);
    const neu = m_core_state.schiffId(idAlt);
    const arbeit = m_core_commands.execute(state,
      { type: 'shipMine', owner, schiff: neu, ware: 'erz' }, rules);
    if (!arbeit.ok) throw Error('W2: Neuer bezahlter Miner kann nicht starten: ' + arbeit.reason);
    protokolliere(state, 'dienst',
      `${owner}: ${neu} fuer ${pruefung.kaufpreis} ISK gekauft (finanzierter W2-Auftrag)`, owner);
    return true;
  }
  // W2-Krise: reine Bestandsrechnung. Vorfinanzierte Vertraege laufen weiter,
  // aber freies Erz darf nicht mit bereits gebundenem Absatzbudget konkurrieren.
  function krisenLage(state, rules) {
    const cfg = rules.erzpilot;
    if (!cfg?.npcInvestor || state.rulesVersion !== rules.rulesVersion)
      return { aktiv: false, status: 'nicht_aktiv' };
    const owner = cfg.npcInvestor, eigene = ids(state.ships)
      .map((id) => state.ships[id])
      .filter((sh) => sh.owner === owner && sh.klasse === 'miner');
    const buch = vertragsbuch(state), lager = state.stations[cfg.station].lager;
    const reservierteMenge = reserviert(state);
    const kaeuferMenge = freieEndnachfrage(state, rules);
    const kaeuferNachweisOk = m_core_audit.audit(state).finanzierung?.ok === true;
    // Bereits erzeugtes/zugesagtes Erz verbraucht den naechsten vorhandenen
    // Kaufetat zuerst. So ist der benoetigte Betrag ohne neue Preistabelle
    // aus dem einzigen R16-Preis und dem bestehenden Core-Bestand hergeleitet.
    const fremdeFracht = ids(state.ships).reduce((sum, id) => {
      if (buch[id]) return sum;
      return sum + anzahl(state.ships[id].ladung, 'erz');
    }, 0);
    const vorbestand = anzahl(lager, 'erz') + reservierteMenge + fremdeFracht;
    const kundenlueckeISK = Math.max(0,
      (vorbestand + 1) * cfg.preis - state.owners[cfg.exportOwner].cash);
    const freiePlaetze = Math.max(0, obergrenze(state, rules, cfg.station, 'erz')
      - anzahl(lager, 'erz') - reservierteMenge);
    const stationsMenge = Math.max(0, Math.floor(state.owners[cfg.station].cash / cfg.preis));
    const arbeitsMenge = Math.max(0, Math.floor(state.owners[owner].cash / cfg.minerJeMinute));
    const planbar = kaeuferNachweisOk ? Math.min(cfg.auftragsMenge, rules.economy.cargo,
      kaeuferMenge, freiePlaetze, stationsMenge, arbeitsMenge) : 0;
    const finanzierte = eigene.filter((sh) => !!buch[sh.id]).length;
    // Fehlender Absatz ist keine Insolvenz: ein wohlhabender Konzern pausiert.
    const status = !kaeuferNachweisOk ? 'finanzierungsfehler'
      : planbar > 0 ? 'arbeitsbereit'
      : kaeuferMenge === 0 ? 'absatzstopp'
      : freiePlaetze === 0 ? 'lagerengpass'
      : stationsMenge === 0 ? 'abnahmeengpass'
      : 'betriebskapitalengpass';
    return { aktiv: true, status, planbar, eigene: eigene.length,
      finanzierte, ruhend: eigene.filter((sh) => sh.auftrag === 'halten').length,
      unternehmenCash: state.owners[owner].cash,
      kaeuferCash: state.owners[cfg.exportOwner].cash,
      kaeuferNachweisOk, vorbestand, kundenlueckeISK,
      freiePlaetze, stationsMenge, kaeuferMenge, arbeitsMenge };
  }
  function krisenSteuern(state, rules) {
    const info = krisenLage(state, rules);
    if (!info.aktiv) return info;
    const owner = rules.erzpilot.npcInvestor, buch = vertragsbuch(state);
    const eigene = ids(state.ships).map((id) => state.ships[id])
      .filter((sh) => sh.owner === owner && sh.klasse === 'miner' && sh.phase === 'dock');
    if (info.planbar === 0) {
      // Kein kostenloses Weiterfördern: Stop ausschließlich bei unbelegter Zukunft.
      // Ein schon bezahlter, noch nicht fertiggestellter Auftrag bleibt unangetastet.
      for (const sh of eigene) {
        if (sh.auftrag !== 'foerdern' || buch[sh.id]
          || (rules.k7 && state.w3?.auftrag?.phase === 'vorbestellt'
            && state.w3.auftrag.industrieMiner === sh.id
            && state.kanon?.industrieErz?.phase === 'aktiv' && !state.kanon.industrieErz.erzAngenommen)) continue;
        const res = m_core_commands.execute(state,
          { type: 'shipWait', owner, schiff: sh.id }, rules);
        if (!res.ok) throw Error('W2: Unfinanzierte Betriebsruhe abgelehnt: ' + res.reason);
        protokolliere(state, 'auftrag',
          `${sh.id}: NPC-Betriebsruhe (${info.status}), keine neue Finanzierung`, owner);
      }
    } else {
      // Ein bezahlbarer Auftrag darf wieder anlaufen; nie zwei ungeprüfte
      // Neustarts gleichzeitig auf dasselbe noch nicht gesperrte Budget.
      if (!eigene.some((sh) => sh.auftrag === 'foerdern' && !buch[sh.id])) {
        const frei = eigene.find((sh) => sh.auftrag === 'halten');
        if (frei) {
          const res = m_core_commands.execute(state,
            { type: 'shipMine', owner, schiff: frei.id, ware: 'erz' }, rules);
          if (!res.ok) throw Error('W2: Finanzierter Wiederanlauf abgelehnt: ' + res.reason);
          protokolliere(state, 'auftrag',
            `${frei.id}: NPC-Bergbau nach Finanzierungsprüfung wieder angefordert`, owner);
        }
      }
    }
    return krisenLage(state, rules);
  }
  function auftragsStand(state, rules) {
    const buch = vertragsbuch(state);
    const frei = state.owners[rules.erzpilot.station].cash;
    const gebunden = Object.values(buch).reduce((n, v) => n + state.owners[v.konto].cash, 0);
    const arbeitsGebunden = Object.values(buch).reduce((n, v) =>
      n + (v.arbeitsKonto ? state.owners[v.arbeitsKonto].cash : 0), 0);
    return { auftraege: ids(buch).length, gebunden, arbeitsGebunden, frei, reserviert: reserviert(state) };
  }
  return { beauftragen, stornieren, abliefern, foerdern, exportiere, auftragsStand,
    investitionsPruefung, npcInvestieren, krisenLage, krisenSteuern };
})();

// W3: Derselbe Core verarbeitet eine vorab finanzierte Hin- UND Rueckfahrt.
const m_core_w3 = (() => {
  const { anzahl }=m_core_zahl;
  const { buche, obergrenze }=m_core_handel;
  const { protokolliere }=m_core_state;
  function kalkulation(rules) {
    const c=rules.w3, route=m_core_route.route(rules.world,'aldera','nadir');
    if(!route||route.zeit<=0)throw Error('W3: keine echte Route');
    const erzWert=c.fracht*rules.erzpilot.preis;
    const arbeitsKosten=route.zeit*2*c.arbeitJeMinute;
    const frachtGebuehr=route.zeit*2*c.frachtgebuehrJeMinute;
    return {zeit:route.zeit,erzWert,arbeitsKosten,frachtGebuehr,gesamt:erzWert+frachtGebuehr};
  }
  function pruefen(state,rules,sh) {
    if(!rules.w3||state.rulesVersion!==rules.rulesVersion)
      return {ok:false,grund:'W3 nur im isolierten Transportkern'};
    const c=rules.w3,w=state.w3;
    if(!w||w.auftrag||state.w5n?.frachtauftrag)return {ok:false,grund:'Bereits ein W3-/Eisauftrag gebunden'};
    if(!sh||sh.owner!==c.spedition||sh.klasse!=='frachter'||sh.phase!=='dock'
      ||sh.system!=='aldera'||sh.auftrag!=='halten')
      return {ok:false,grund:'Bezahlter Frachter muss frei in Aldera liegen'};
    if(Object.values(sh.ladung).some(n=>n!==0))
      return {ok:false,grund:'Frachtraum nicht leer'};
    const k=kalkulation(rules);
    if(c.fracht>rules.economy.cargo||anzahl(state.stations[c.quellStation].lager,'erz')<c.fracht)
      return {ok:false,grund:'Noch keine echte Erzcharge im Quelllager'};
    if(anzahl(state.stations[c.zielStation].lager,'erz')+c.fracht
      >obergrenze(state,rules,c.zielStation,'erz'))
      return {ok:false,grund:'Kein Ziel-Lagerplatz'};
    if(state.owners[c.kunde].cash<k.gesamt)
      return {ok:false,grund:'Kaeufer kann Ware und beide Fluege nicht bezahlen'};
    if(state.owners[c.spedition].cash<k.arbeitsKosten)
      return {ok:false,grund:'Spedition kann die Flugloehne nicht decken'};
    const start=rules.owners.find(o=>o.id===c.kunde).cash;
    if(state.owners[c.kunde].cash+m_core_kanon.netto(state,c.kunde)+w.kaufAusgaben+(state.w4?.gebucht??0)
      -(state.w5?.materialUmsatz??0)-(state.w5ae?.spent??0)
        +(state.w5n?.kaufAusgaben??0)+(state.w5n?.fabrikGebucht??0)
        -(state.w5n?.wasserErlos??0)!==start)
      return {ok:false,grund:'W3: unbelegtes Kaeufergeld'};
    return {ok:true,grund:'Vollstaendig vorfinanziert',...k};
  }
  function starten(state,rules,sh) {
    const k=pruefen(state,rules,sh);
    if(!k.ok)throw Error('W3 ohne Kapital: '+k.grund);
    const c=rules.w3,w=state.w3,ka='w3_kauf_treuhand',ar='w3_arbeit_treuhand';
    if(!state.owners[ka])state.owners[ka]={id:ka,kind:'w3-reserve',cash:0};
    if(!state.owners[ar])state.owners[ar]={id:ar,kind:'w3-reserve',cash:0};
    if(state.owners[ka].cash||state.owners[ar].cash)throw Error('W3: Doppeltreuhand');
    state.owners[c.kunde].cash-=k.gesamt;state.owners[ka].cash+=k.gesamt;
    w.kaufAusgaben+=k.gesamt;buche(state,c.kunde,'kosten',k.gesamt);
    state.owners[c.spedition].cash-=k.arbeitsKosten;state.owners[ar].cash+=k.arbeitsKosten;
    state.stations[c.quellStation].lager.erz-=c.fracht;sh.ladung.erz=c.fracht;
    sh.phase='reise';sh.ziel=c.zielStation;sh.ankunft=state.tick+k.zeit;sh.auftrag='fracht';
    w.auftrag={schiff:sh.id,phase:'hin',menge:c.fracht,gearbeitet:0,...k};
    if(rules.w5Replacement)w.auftrag.start=state.tick;
    w.beauftragt++;
    protokolliere(state,'auftrag',sh.id+': Erz, Kaufetat und beide Flugkosten gesperrt',c.spedition);
    return true;
  }
  // K7 Forschungsregel200: die *Original*-W3-Treuhand vor der Erzförderung
  // genau einmal finanzieren. Vorbestellung darf kein Phantom-Erz verladen.
  function vorbestellen(state,rules,frachterId,minerId) {
    if (!rules.k7 || state.rulesVersion !== rules.rulesVersion) throw Error('K7 nur mit Forschungsregel 200');
    const w=state.w3,c=rules.w3,sh=state.ships[frachterId],mi=state.ships[minerId],k=kalkulation(rules);
    if(w.auftrag||state.w5n?.frachtauftrag) throw Error('K7: bestehende Frachtreserve');
    if(!sh||sh.owner!==c.spedition||sh.klasse!=='frachter'||sh.system!=='aldera'
      ||sh.phase!=='dock'||sh.auftrag!=='halten'||Object.values(sh.ladung).some(n=>n!==0))
      throw Error('K7: Spedition besitzt keinen freien Frachter in Aldera');
    if(!mi||mi.owner!==rules.erzpilot.npcInvestor||mi.klasse!=='miner'
      ||mi.system!=='aldera'||mi.phase!=='dock'||mi.flug?.lage!=='angedockt'
      ||Object.values(mi.ladung).some(n=>n!==0)
      ||state.erzpilotVertraege?.[minerId])
      throw Error('K7: Miner nicht rechtmäßig verfügbar');
    if(state.owners[c.kunde].cash<k.gesamt||state.owners[c.spedition].cash<k.arbeitsKosten
      ||state.owners[rules.erzpilot.station].cash<k.erzWert
      ||state.owners[mi.owner].cash<rules.erzpilot.minerJeMinute*c.fracht)
      throw Error('K7: nicht alle Firmen können Vorbestellung, Ankauf und Arbeit decken');
    if(state.stations[c.zielStation].lager.erz+c.fracht
      >obergrenze(state,rules,c.zielStation,'erz')) throw Error('K7: kein Nadir-Lagerplatz');
    const ka='w3_kauf_treuhand',ar='w3_arbeit_treuhand';
    if((state.owners[ka]?.cash||0)||(state.owners[ar]?.cash||0))throw Error('K7: Doppelreservierung');
    // W3-Kaufkosten/Quoten werden beim PREORDER und nie erneut beim Flug gebucht.
    if(!state.owners[ka])state.owners[ka]={id:ka,kind:'w3-reserve',cash:0};
    if(!state.owners[ar])state.owners[ar]={id:ar,kind:'w3-reserve',cash:0};
    state.owners[c.kunde].cash-=k.gesamt;state.owners[ka].cash+=k.gesamt;
    w.kaufAusgaben+=k.gesamt;buche(state,c.kunde,'kosten',k.gesamt);
    state.owners[c.spedition].cash-=k.arbeitsKosten;state.owners[ar].cash+=k.arbeitsKosten;
    w.auftrag={schiff:sh.id,industrieMiner:minerId,phase:'vorbestellt',
      menge:c.fracht,gearbeitet:0,...k};
    w.beauftragt++;
    protokolliere(state,'auftrag',sh.id+': K7 industrielle Erz-Vorbestellung; echte W3-Kauf-/Frachtlohnreserven',c.kunde);
    return true;
  }
  // Storno ausschließlich vor Beginn jeglicher realer W1-Arbeit und bei dockenden,
  // unbeladenen Schiffen. Bereits bezahlte Leistung oder Ware darf nie verschwinden.
  function stornierenVorArbeit(state,rules) {
    const w=state.w3,a=w?.auftrag,c=rules.w3;
    if(!rules.k7||a?.phase!=='vorbestellt')throw Error('K7: kein unbegonnener Vertrag');
    const mi=state.ships[a.industrieMiner],sh=state.ships[a.schiff];
    if(!mi||!sh||mi.flug?.lage!=='angedockt'||sh.phase!=='dock'
      ||Object.values(mi.ladung).some(x=>x!==0)
      ||state.erzpilotVertraege?.[mi.id])
      throw Error('K7: reale Förderung/Flug begonnen; nicht kostenlos stornierbar');
    const ka=state.owners.w3_kauf_treuhand,ar=state.owners.w3_arbeit_treuhand;
    if(ka?.cash!==a.gesamt||ar?.cash!==a.arbeitsKosten)
      throw Error('K7: Treuhand bereits verwendet');
    state.owners[c.kunde].cash+=a.gesamt;ka.cash=0;
    state.owners[c.spedition].cash+=a.arbeitsKosten;ar.cash=0;
    w.storniert++;w.stornoRueckzahlung+=a.gesamt;
    buche(state,c.kunde,'erloes',a.gesamt);
    w.auftrag=null;
    protokolliere(state,'auftrag','K7: unbegonnener Auftrag vollständig an Zahlende erstattet',c.kunde);
  }
  function tick(state,rules) {
    const w=state.w3,a=w?.auftrag;
    if(!a)return;
    const c=rules.w3,sh=state.ships[a.schiff];
    if (rules.k7 && a.phase==='vorbestellt') {
      // Kein Erz vorfinanzierungsfrei erfunden: echte Aldera-Lagerware und
      // Nachweis des tatsächlichen W1-Vertragsabschlusses sind erforderlich.
      const v=state.kanon?.industrieErz;
      if(!v||v.phase!=='aktiv'||v.miner!==a.industrieMiner)
        throw Error('K7: unbefugter W3-Industrieauftrag');
      if(!v.erzAngenommen || (state.stations[c.quellStation].lager.erz||0)<c.fracht)
        return;
      if(state.w5n?.frachtauftrag||sh.phase!=='dock'||sh.system!=='aldera'
        ||sh.auftrag!=='halten'||Object.values(sh.ladung).some(n=>n!==0))
        return; // echte W3-Kollision: auf freien Frachter warten
      state.stations[c.quellStation].lager.erz-=c.fracht;
      sh.ladung.erz=c.fracht;sh.phase='reise';sh.ziel=c.zielStation;
      sh.ankunft=state.tick+a.zeit;sh.auftrag='fracht';
      a.phase='hin';a.start=state.tick;
      protokolliere(state,'auftrag',sh.id+': physische K7-Erzcharge erstmals geladen; W3-Geld nicht erneut reserviert',c.spedition);
      return; // Erste Arbeitsminute erst im nächsten Tick
    }
    const arbeit=state.owners.w3_arbeit_treuhand,kauf=state.owners.w3_kauf_treuhand;
    if(!sh||sh.phase!=='reise'||!arbeit||!kauf||arbeit.cash<c.arbeitJeMinute)
      throw Error('W3: Nicht bezahlter Flug');
    arbeit.cash-=c.arbeitJeMinute;
    if(rules.w5ag)m_core_w5ag.pay(state,rules,'erz',c.arbeitJeMinute,sh.id);
    else state.owners[c.arbeitsFonds].cash+=c.arbeitJeMinute;
    buche(state,c.spedition,'kosten',c.arbeitJeMinute);w.arbeitsKosten+=c.arbeitJeMinute;
    a.gearbeitet++;
    if(state.tick!==sh.ankunft)return;
    if(a.phase==='hin') {
      if(sh.ziel!==c.zielStation||sh.ladung.erz!==a.menge||kauf.cash<a.erzWert)
        throw Error('W3: Lieferung ohne Ware/Kaufetat');
      delete sh.ladung.erz;state.stations[c.zielStation].lager.erz+=a.menge;
      kauf.cash-=a.erzWert;state.owners[c.quellStation].cash+=a.erzWert;
      buche(state,c.quellStation,'erloes',a.erzWert);w.geliefert+=a.menge;
      a.phase='rueck';sh.system='nadir';sh.ziel=c.quellStation;sh.ankunft+=a.zeit;
      protokolliere(state,'handel',sh.id+': '+a.menge+' Erz real in Nadir gekauft',c.spedition);
    } else {
      if(sh.ziel!==c.quellStation||kauf.cash!==a.frachtGebuehr
        ||arbeit.cash!==0||a.gearbeitet!==2*a.zeit)
        throw Error('W3: Rueckflug nicht vollstaendig finanziert');
      kauf.cash=0;state.owners[c.spedition].cash+=a.frachtGebuehr;
      buche(state,c.spedition,'erloes',a.frachtGebuehr);w.frachtUmsatz+=a.frachtGebuehr;
      if(rules.w5Replacement)state.w5ad.freight.push({id:sh.id,start:a.start,
        end:state.tick,work:a.arbeitsKosten,fee:a.frachtGebuehr,amount:a.menge});
      w.abgeschlossen++;w.auftrag=null;
      sh.system='aldera';sh.phase='dock';sh.ziel=null;sh.ankunft=state.tick;sh.auftrag='halten';
      protokolliere(state,'handel',sh.id+': Rueckfahrt bezahlt; Spedition entlohnt',c.spedition);
    }
  }
  function audit(state,rules) {
    const c=rules.w3,w=state.w3,a=w?.auftrag;
    if(!w||!c)return {ok:false,grund:'W3-Daten fehlen'};
    const k=kalkulation(rules),buyer=state.owners[c.kunde]?.cash;
    const startBuyer=rules.owners.find(o=>o.id===c.kunde).cash;
    const carrier=state.owners[c.spedition]?.cash,startCarrier=rules.owners.find(o=>o.id===c.spedition).cash;
    const kauf=state.owners.w3_kauf_treuhand?.cash??0,arbeit=state.owners.w3_arbeit_treuhand?.cash??0;
    // Spielerhuellen: voll bezahlt, aber nicht aus der Speditionskasse.
    const huelle=((state.ledger.frachter?.consumed??0)
      -(rules.kanon ? (state.kanon?.spielerFrachterKaeufe?.length??0) : 0))
      *rules.economy.waren.frachter.basis;
    const storniert=rules.k7?w.storniert:0,stornoRueck=rules.k7?w.stornoRueckzahlung:0;
    const erwarteteBezahlung=(w.abgeschlossen+storniert+(a?1:0))*k.gesamt;
    const erwarteteWare=w.abgeschlossen*c.fracht+(a?.phase==='rueck'?c.fracht:0);
    const erwarteteArbeit=w.abgeschlossen*k.arbeitsKosten+(a?.gearbeitet??0)*c.arbeitJeMinute;
    const ok=[buyer,carrier,kauf,arbeit,w.kaufAusgaben,w.geliefert,w.arbeitsKosten,
      w.frachtUmsatz,w.beauftragt,w.abgeschlossen,huelle].every(Number.isSafeInteger)
      && buyer>=0&&carrier>=0
      && buyer+m_core_kanon.netto(state,c.kunde)+w.kaufAusgaben-stornoRueck+(state.w4?.gebucht??0)
        -(state.w5?.materialUmsatz??0)-(state.w5ae?.spent??0)
        +(state.w5n?.kaufAusgaben??0)+(state.w5n?.fabrikGebucht??0)
        -(state.w5n?.wasserErlos??0)===startBuyer
      && w.kaufAusgaben===erwarteteBezahlung && w.geliefert===erwarteteWare
      && w.arbeitsKosten===erwarteteArbeit
      && w.frachtUmsatz===w.abgeschlossen*k.frachtGebuehr
      && w.beauftragt===w.abgeschlossen+storniert+(a?1:0)
      && (!rules.k7||(Number.isSafeInteger(storniert)&&storniert>=0&&stornoRueck===storniert*k.gesamt))
      && state.stations[c.zielStation].lager.erz
        ===w.geliefert-(state.w4?.erzVerbraucht??0)
      &&(rules.w5ag
         ?state.owners[c.arbeitsFonds].cash+m_core_kanon.netto(state,c.arbeitsFonds)===0&&(state.w5ae?.spent??0)===0
         :state.owners[c.arbeitsFonds].cash+(state.w5ae?.spent??0)
           +(state.w5n?.wasserErlos??0)===w.arbeitsKosten+(state.w5n?.frachtLohn??0))
      && kauf===(a?(a.phase==='hin'||a.phase==='vorbestellt'?a.gesamt:a.frachtGebuehr):0)
      && arbeit===(a?k.arbeitsKosten-a.gearbeitet*c.arbeitJeMinute:0)
      && carrier+m_core_kanon.netto(state,c.spedition)+arbeit+(state.owners.w5ac_transfer_reserved?.cash??0)
        +(state.w5ac?.paid??0)-(rules.k7?m_core_w5_transfer.spielerKosten(state,rules):0)
        +(state.owners.w5n_fracht_arbeit?.cash??0)
        -(rules.kanon && state.w5n?.frachtauftrag
          && state.ships[state.w5n.frachtauftrag.schiff]?.owner===rules.economy.start.owner
            ?(state.owners.w5n_fracht_arbeit?.cash??0):0)
        +(state.w5n?.frachtLohn??0)-(state.kanon?.spielerFrachten?.lohn??0)
        -(state.w5n?.frachtUmsatz??0)+(state.kanon?.spielerFrachten?.gebuehr??0)
        ===startCarrier-huelle-w.arbeitsKosten+w.frachtUmsatz
      && (!a||(a.menge===c.fracht&&a.zeit===k.zeit&&a.erzWert===k.erzWert
        && a.arbeitsKosten===k.arbeitsKosten&&a.frachtGebuehr===k.frachtGebuehr
        && a.gesamt===k.gesamt&&a.gearbeitet>=0&&a.gearbeitet<=2*k.zeit
        && state.ships[a.schiff]?.owner===c.spedition
        && (state.ships[a.schiff]?.ladung.erz??0)===(a.phase==='hin'?c.fracht:0)
        && (!rules.k7||a.phase!=='vorbestellt'
          ||(state.kanon?.industrieErz?.phase==='aktiv'
            && state.kanon.industrieErz.miner===a.industrieMiner))));
    return {ok,buyer,carrier,kaufTreuhand:kauf,arbeitTreuhand:arbeit,
      oreDelivered:w.geliefert,paidWork:w.arbeitsKosten,freightRevenue:w.frachtUmsatz,
      status:a?.phase??'frei'};
  }
  return {kalkulation,pruefen,starten,vorbestellen,stornierenVorArbeit,tick,audit};
})();

// W4: Erz in Nadir zu Material verarbeiten. Kein externer Zahlmeister und
// keine Gratisarbeit: die Nadir-Station sperrt alle realen Lohnmittel vorab.
const m_core_w4 = (() => {
  const { anzahl } = m_core_zahl;
  const { buche, obergrenze } = m_core_handel;
  const { protokolliere } = m_core_state;
  function kosten(rules) { return rules.w4.dauer*rules.w4.lohnJeMinute; }
  function pruefen(state,rules,owner,station) {
    if (!rules.w4 || state.rulesVersion!==rules.rulesVersion)
      return {ok:false,grund:'W4-Raffinerie in dieser Regel nicht aktiv'};
    const c=rules.w4, w=state.w4;
    if (owner!==c.station || station!==c.station)
      return {ok:false,grund:'Nur die Nadir-Raffinerie darf diesen Auftrag bezahlen'};
    if (!w || w.auftrag)
      return {ok:false,grund:'Eine Raffineriecharge ist bereits finanziert'};
    const lager=state.stations[c.station].lager;
    if (anzahl(lager,'erz')<c.erzJeCharge)
      return {ok:false,grund:'Es fehlt real angeliefertes Erz in Nadir'};
    if (anzahl(lager,'material')+c.materialJeCharge
      >obergrenze(state,rules,c.station,'material'))
      return {ok:false,grund:'Kein freier Material-Lagerplatz'};
    const budget=kosten(rules);
    if (state.owners[c.station].cash < budget)
      return {ok:false,grund:'Nadir kann die gesamte Arbeitscharge nicht bezahlen'};
    const start=rules.owners.find(o=>o.id===c.station).cash;
    if(state.owners[c.station].cash+m_core_kanon.netto(state,c.station)+(state.w3.kaufAusgaben-(state.w3.stornoRueckzahlung||0))+w.gebucht
      -(state.w5?.materialUmsatz??0)-(state.w5ae?.spent??0)
        +(state.w5n?.kaufAusgaben??0)+(state.w5n?.fabrikGebucht??0)
        -(state.w5n?.wasserErlos??0)!==start)
      return {ok:false,grund:'Nadir: nicht nachgewiesenes Produktionskapital'};
    return {ok:true,grund:'Erz und vollständige Arbeitskasse reservierbar',
      erz:c.erzJeCharge,material:c.materialJeCharge,arbeit:budget,dauer:c.dauer};
  }
  function starten(state,rules,owner,station) {
    const p=pruefen(state,rules,owner,station);
    if(!p.ok)throw Error('W4: unbezahlte Raffineriecharge: '+p.grund);
    const c=rules.w4,w=state.w4;
    const konto='w4_arbeit_treuhand';
    if(!state.owners[konto])state.owners[konto]={id:konto,kind:'w4-reserve',cash:0};
    if(state.owners[konto].cash!==0)throw Error('W4: doppeltes Arbeitstreuhand');
    state.owners[c.station].cash-=p.arbeit;
    state.owners[konto].cash+=p.arbeit;
    w.gebucht+=p.arbeit;
    buche(state,c.station,'kosten',p.arbeit);
    // Ware bleibt bis zum Produktionsabschluss im wirklichen Stationslager;
    // nur dieser eine Auftrag darf sie bis dahin in Anspruch nehmen.
    w.auftrag={begonnen:state.tick,gearbeitet:0,erz:p.erz,material:p.material,
      arbeitsBudget:p.arbeit};
    w.begonnen++;
    protokolliere(state,'auftrag',
      c.station+': '+p.erz+' Erz reserviert, '+p.arbeit+' ISK Arbeit vorfinanziert',c.station);
    return true;
  }
  function tick(state,rules) {
    const w=state.w4,vertrag=w?.auftrag;
    if(!vertrag)return;
    const c=rules.w4, arbeitsKasse=state.owners.w4_arbeit_treuhand;
    if(!arbeitsKasse || arbeitsKasse.cash<c.lohnJeMinute)
      throw Error('W4: Produktion ohne gedeckte Arbeitskasse');
    if(anzahl(state.stations[c.station].lager,'erz')<vertrag.erz)
      throw Error('W4: reserviertes Erz physisch nicht mehr im Lager');
    arbeitsKasse.cash-=c.lohnJeMinute;
    state.owners[c.arbeitOwner].cash+=c.lohnJeMinute;
    buche(state,c.arbeitOwner,'erloes',c.lohnJeMinute);
    w.gezahlt+=c.lohnJeMinute;
    vertrag.gearbeitet++;
    if(vertrag.gearbeitet<c.dauer)return;
    if(vertrag.gearbeitet!==c.dauer || arbeitsKasse.cash!==0)
      throw Error('W4: kein vollständig abgearbeiteter Auftrag');
    const lager=state.stations[c.station].lager;
    if(anzahl(lager,'material')+vertrag.material
      >obergrenze(state,rules,c.station,'material'))
      throw Error('W4: Materiallager kann fertige Ware nicht aufnehmen');
    lager.erz-=vertrag.erz; lager.material+=vertrag.material;
    state.ledger.erz.consumed+=vertrag.erz;
    state.ledger.material.produced+=vertrag.material;
    w.erzVerbraucht+=vertrag.erz;
    w.materialErzeugt+=vertrag.material;
    w.abgeschlossen++;w.auftrag=null;
    protokolliere(state,'produktion',
      c.station+': '+vertrag.erz+' Erz → '+vertrag.material+' Material, '
      +vertrag.arbeitsBudget+' ISK realer Lohn',c.station);
  }
  function audit(state,rules) {
    const c=rules.w4,w=state.w4,a=w?.auftrag;
    if(!w||!c)return {ok:false,grund:'W4-Auftragsbuch fehlt'};
    const p=kosten(rules),worker=state.owners[c.arbeitOwner]?.cash,
      escrow=state.owners.w4_arbeit_treuhand?.cash??0;
    const station=state.owners[c.station]?.cash,
      start=rules.owners.find(o=>o.id===c.station).cash;
    const lager=state.stations[c.station]?.lager,
      erz=lager?.erz,material=lager?.material;
    const erwarteterLohn=w.abgeschlossen*p+(a?.gearbeitet??0)*c.lohnJeMinute;
    const ok=[worker,escrow,station,w.gebucht,w.gezahlt,w.erzVerbraucht,
      w.materialErzeugt,w.begonnen,w.abgeschlossen,erz,material]
      .every(Number.isSafeInteger)
      && station>=0&&worker>=0&&escrow>=0
      && w.begonnen===w.abgeschlossen+(a?1:0)
      && w.gebucht===w.begonnen*p && w.gezahlt===erwarteterLohn
      && worker+m_core_kanon.netto(state,c.arbeitOwner)===w.gezahlt&&escrow===w.gebucht-w.gezahlt
      && station+m_core_kanon.netto(state,c.station)+(state.w3.kaufAusgaben-(state.w3.stornoRueckzahlung||0))+w.gebucht
        -(state.w5?.materialUmsatz??0)-(state.w5ae?.spent??0)
        +(state.w5n?.kaufAusgaben??0)+(state.w5n?.fabrikGebucht??0)
        -(state.w5n?.wasserErlos??0)===start
      && w.erzVerbraucht===w.abgeschlossen*c.erzJeCharge
      && w.materialErzeugt===w.abgeschlossen*c.materialJeCharge
      && state.ledger.erz.consumed===w.erzVerbraucht
      && state.ledger.material.produced===w.materialErzeugt
      && erz===state.w3.geliefert-w.erzVerbraucht
      && material===w.materialErzeugt-(state.w5?.materialVerbraucht??0)-(state.w5ae?.purchased??0)
        -(state.kanon?.minerWerft?.materialVerbraucht??0)
        -(state.kanon?.bauteile?.materialVerbraucht??0)
      && (!a || (a.erz===c.erzJeCharge&&a.material===c.materialJeCharge
        && a.arbeitsBudget===p&&Number.isSafeInteger(a.gearbeitet)
        && a.gearbeitet>=0&&a.gearbeitet<c.dauer));
    return {ok,arbeitsKasse:escrow,arbeiter:worker,station,erz,material,
      verbraucht:w.erzVerbraucht,produziert:w.materialErzeugt,
      begonnen:w.begonnen,abgeschlossen:w.abgeschlossen,
      status:a?'in_produktion':'bereit',restzeit:a?c.dauer-a.gearbeitet:0};
  }
  return {kosten,pruefen,starten,tick,audit};
})();

// W5: Schiffbau aus realen W4-Materialien, ausschliesslich aus dem
// Verkaufserloes des bestehenden externen Werftunternehmens finanziert.
const m_core_w5 = (() => {
  const { anzahl } = m_core_zahl;
  const { buche, obergrenze } = m_core_handel;
  const { protokolliere, neuesSchiff } = m_core_state;
  function plan(rules) {
    const c=rules.w5;
    return { material: c.material, materialKosten:c.material*c.materialPreis,
      arbeitKosten:c.dauer*c.lohnJeMinute, dauer:c.dauer,
      preis:c.verkaufsPreis };
  }
  function pruefen(state,rules,owner,station) {
    if(!rules.w5 || state.rulesVersion!==rules.rulesVersion)
      return {ok:false,grund:'W5-Werft nur in isolierter Regel19'};
    const c=rules.w5,w=state.w5,k=plan(rules);
    if(owner!==c.werft || station!==c.station)
      return {ok:false,grund:'Nur die finanzierende Werft darf Nadir-Schiffe bauen'};
    if(!w || w.auftrag)
      return {ok:false,grund:'Eine Werftcharge ist bereits beauftragt'};
    if(anzahl(state.stations[c.station].lager,'material')<k.material)
      return {ok:false,grund:'Nicht genug reales W4-Material in Nadir'};
    if(state.owners[c.werft].cash<k.materialKosten+k.arbeitKosten)
      return {ok:false,grund:'Werft kann Material und alle Lohnminuten nicht finanzieren'};
    if(anzahl(state.stations[c.station].lager,c.klasse)+1
      >obergrenze(state,rules,c.station,c.klasse))
      return {ok:false,grund:'Kein Platz fuer das fertige Schiff'};
    if(!audit(state,rules).ok) return {ok:false,grund:'W5: ungedecktes Werftkonto'};
    return {ok:true,grund:'Material und Arbeitskosten vollstaendig finanziert',...k};
  }
  function starten(state,rules,owner,station) {
    const check=pruefen(state,rules,owner,station);
    if(!check.ok) throw Error('W5-Schiffbau unbezahlt: '+check.grund);
    const c=rules.w5,w=state.w5,escrowId='w5_arbeit_treuhand';
    if(!state.owners[escrowId])state.owners[escrowId]={id:escrowId,kind:'w5-escrow',cash:0};
    const escrow=state.owners[escrowId];
    if(escrow.cash)throw Error('W5: Werftarbeit bereits hinterlegt');
    state.owners[c.werft].cash-=check.materialKosten;
    state.owners[c.station].cash+=check.materialKosten;
    buche(state,c.werft,'kosten',check.materialKosten);
    buche(state,c.station,'erloes',check.materialKosten);
    state.stations[c.station].lager.material-=check.material;
    state.ledger.material.consumed+=check.material;
    w.materialVerbraucht+=check.material;
    w.materialUmsatz+=check.materialKosten;
    state.owners[c.werft].cash-=check.arbeitKosten;
    escrow.cash+=check.arbeitKosten;
    w.arbeitsGebunden+=check.arbeitKosten;
    w.begonnen++;
    w.auftrag={gearbeitet:0,material:check.material,
      materialKosten:check.materialKosten,arbeitKosten:check.arbeitKosten};
    protokolliere(state,'auftrag',
      'Nadir-Werft: '+check.material+' Material gekauft, '+check.arbeitKosten
      +' ISK Arbeit gesichert',c.werft);
  }
  function tick(state,rules) {
    const w=state.w5,a=w?.auftrag;if(!a)return;
    const c=rules.w5,escrow=state.owners.w5_arbeit_treuhand;
    if(!escrow || escrow.cash<c.lohnJeMinute)
      throw Error('W5: Werftarbeit ohne gedecktes Arbeitsbudget');
    escrow.cash-=c.lohnJeMinute;
    state.owners[c.arbeiter].cash+=c.lohnJeMinute;
    buche(state,c.werft,'kosten',c.lohnJeMinute);
    buche(state,c.arbeiter,'erloes',c.lohnJeMinute);
    a.gearbeitet++;w.arbeitsGezahlt+=c.lohnJeMinute;
    if(a.gearbeitet<c.dauer)return;
    if(a.gearbeitet!==c.dauer || escrow.cash!==0)
      throw Error('W5: Werftvertrag nicht voll bezahlt');
    const lager=state.stations[c.station].lager;
    if(anzahl(lager,c.klasse)+1>obergrenze(state,rules,c.station,c.klasse))
      throw Error('W5: Fertigschiff ohne Lagerplatz');
    lager[c.klasse]=(lager[c.klasse]||0)+1;
    state.ledger[c.klasse].produced+=1;
    w.fertig++;
    w.auftrag=null;
    protokolliere(state,'produktion',
      'Nadir-Werft: ein '+c.klasse+' real gebaut, '+a.material
      +' Material und '+a.arbeitKosten+' ISK Lohn',c.werft);
  }
  function verkaufPruefen(state,rules,owner=rules.w5.kaeufer) {
    const c=rules.w5, w=state.w5;
    if(!w) return {ok:false,grund:'W5-Auftragsbuch fehlt'};
    if(!audit(state,rules).ok)
      return {ok:false,grund:'Werftbilanz nicht gueltig'};
    if((state.stations[c.station].lager[c.klasse]||0)<1)
      return {ok:false,grund:'Kein bezahltes Fertigschiff'};
    if(state.owners[owner]?.cash<c.verkaufsPreis)
      return {ok:false,grund:'Käufer kann Frachter nicht bezahlen'};
    return {ok:true,grund:'Fertigschiff und Kaufmittel vorhanden',
      preis:c.verkaufsPreis};
  }
  function audit(state,rules) {
    const c=rules.w5,w=state.w5, a=w?.auftrag;
    if(!c||!w)return {ok:false,grund:'Kein W5-Auftragsbuch'};
    const p=plan(rules),escrow=state.owners.w5_arbeit_treuhand?.cash??0;
    const st=state.stations[c.station]?.lager,old=rules.owners.find(o=>o.id===c.werft).cash;
    const werk=state.owners[c.werft]?.cash,arbeit=state.owners[c.arbeiter]?.cash;
    const werkEinnahmen=(state.owners[c.werft]?.cash??0)
      + (state.owners.w5_arbeit_treuhand?.cash??0);
    const werftErloese=state.stats.konto[c.werft]?.erloes;
    const werftKosten=state.stats.konto[c.werft]?.kosten;
    const w3VerkaufteFrachter=state.ledger.frachter?.consumed??0;
    const shipIds=w.schiffIds||[];
    const gekaufte=shipIds.every(id=>{
      const sh=state.ships[id];
      return (sh?.klasse===c.klasse && (sh.owner===c.kaeufer
        || (!!rules.k7 && sh.owner===rules.economy.start.owner
          &&state.kanon?.spielerFrachterKaeufe?.some(x=>x.id===id&&x.station===c.station)))
        && sh.heimat==='nadir') || (!!rules.w5Replacement
          &&state.w5ad?.losses.some(x=>x.id===id&&x.heimat==='nadir'));
    });
    const ok=[escrow,werk,arbeit,werftErloese,werftKosten,
      w.materialVerbraucht,w.materialUmsatz,w.arbeitsGebunden,
      w.arbeitsGezahlt,w.begonnen,w.fertig,w.verkauft,w3VerkaufteFrachter]
      .every(Number.isSafeInteger)
      && werk>=0&&arbeit>=0&&escrow>=0&&w.begonnen>=w.fertig
      && w.begonnen===w.fertig+(a?1:0)
      && w.materialVerbraucht===w.begonnen*p.material
      && w.materialUmsatz===w.begonnen*p.materialKosten
      && w.arbeitsGebunden===w.begonnen*p.arbeitKosten
      && w.arbeitsGezahlt===w.fertig*p.arbeitKosten
        +(a?.gearbeitet??0)*c.lohnJeMinute
      && escrow===w.arbeitsGebunden-w.arbeitsGezahlt
      && arbeit+m_core_kanon.netto(state,c.arbeiter)===w.arbeitsGezahlt
      && state.ledger.material.consumed===w.materialVerbraucht
        +(state.kanon?.minerWerft?.materialVerbraucht??0)
        +(state.kanon?.bauteile?.materialVerbraucht??0)
      && st.material===state.w4.materialErzeugt-w.materialVerbraucht-(state.w5ae?.purchased??0)
        -(state.kanon?.minerWerft?.materialVerbraucht??0)
        -(state.kanon?.bauteile?.materialVerbraucht??0)
      && state.ledger.frachter.produced===w.fertig
      && st.frachter===w.fertig-w.verkauft
      && w.verkauft===shipIds.length&&w.verkauft<=w.fertig
      && gekaufte
      && w3VerkaufteFrachter>=w.verkauft
      && werkEinnahmen+m_core_kanon.netto(state,c.werft)===old + werftErloese-werftKosten
      && state.owners[c.station].cash+m_core_kanon.netto(state,c.station)+(state.w3.kaufAusgaben-(state.w3.stornoRueckzahlung||0))
        +state.w4.gebucht-w.materialUmsatz-(state.w5ae?.spent??0)
        +(state.w5n?.kaufAusgaben??0)+(state.w5n?.fabrikGebucht??0)
        -(state.w5n?.wasserErlos??0)
          ===rules.owners.find(o=>o.id===c.station).cash
      && (!a || (a.material===p.material && a.materialKosten===p.materialKosten
        && a.arbeitKosten===p.arbeitKosten && Number.isSafeInteger(a.gearbeitet)
        && a.gearbeitet>=0&&a.gearbeitet<c.dauer));
    return {ok,werftCash:werk,werftEscrow:escrow,materialUmsatz:w.materialUmsatz,
      materialVerbraucht:w.materialVerbraucht,lohnBezahlt:w.arbeitsGezahlt,
      arbeitCash:arbeit,produziert:w.fertig,verkauft:w.verkauft,
      frachterLager:st.frachter,materialLager:st.material,
      buyerCash:state.owners[c.kaeufer].cash,
      stationCash:state.owners[c.station].cash,
      status:a?'bau':'bereit',restMinuten:a?c.dauer-a.gearbeitet:0 };
  }
  return {plan,pruefen,starten,tick,verkaufPruefen,audit};
})();

// W5ac: small isolated derivative of the FINANCED original W5s-b ferry contract (#204).
// Exactly one core tick/route, fully prepaid owner wage escrow, no teleport/ISK emission.
const m_core_w5_transfer=(()=>{
  const {buche}=m_core_handel,{protokolliere}=m_core_state;
  const ownerOk=(r,owner)=>owner===r.w5Transfer.owner
    || (!!r.k7 && owner===r.economy.start.owner);
  function spielerKosten(s,r){
    if(!r.k7)return 0;
    return [...s.w5ac.completed,...(s.w5ac.active?[s.w5ac.active]:[])]
      .filter(x=>x.owner===r.economy.start.owner).reduce((n,x)=>n+x.kosten,0);
  }
  function pruefen(s,r,sh){
    const cfg=r.w5Transfer,w=s.w5ac;
    if(!cfg||s.rulesVersion!==r.rulesVersion||!w||!s.w5)return {ok:false,grund:'W5ac-Regel191 nicht aktiv'};
    if(!sh||!ownerOk(r,sh.owner)||sh.klasse!=='frachter'||sh.heimat!==cfg.quelle
      ||sh.system!==cfg.quelle||sh.phase!=='dock'||sh.auftrag!=='halten'
      ||Object.values(sh.ladung).some(n=>n!==0))
      return {ok:false,grund:'Nur freie eigene gekaufte W5-Huelle in Nadir'};
    if(!s.w5.schiffIds.includes(sh.id))return {ok:false,grund:'Kein nachweislich gekaufter Werftfrachter'};
    if(s.w3.auftrag||s.w5n?.frachtauftrag||w.active||w.completed.some(x=>x.id===sh.id))
      return {ok:false,grund:'Noch aktive W3-Fracht oder Ueberfuehrung'};
    const route=m_core_route.route(r.world,cfg.quelle,cfg.ziel);
    const minuten=route?.zeit,lohn=cfg.lohnJeMinute,kosten=minuten*lohn;
    if(!Number.isSafeInteger(minuten)||minuten<=0||!Number.isSafeInteger(lohn)||lohn<=0
      ||!Number.isSafeInteger(kosten)||kosten<=0)
      return {ok:false,grund:'Keine gueltige bezahlbare Flugroute'};
    if(s.owners[sh.owner].cash<kosten)return {ok:false,grund:'Pilotenlohn nicht voll vorfinanzierbar'};
    if(s.owners[cfg.reserved]?.cash!==0)return {ok:false,grund:'Schon vorhandenes Flugtreuhand'};
    return {ok:true,grund:'Gekaufter freier Frachter, voll finanzierter Pilotenlohn',
      schiff:sh.id,von:cfg.quelle,nach:cfg.ziel,minuten,lohn,kosten};
  }
  function start(s,r,sh){
    const q=pruefen(s,r,sh);if(!q.ok)throw Error(q.grund);
    const c=r.w5Transfer,w=s.w5ac;
    s.owners[sh.owner].cash-=q.kosten;s.owners[c.reserved].cash+=q.kosten;
    w.allocated+=q.kosten;
    buche(s,sh.owner,'kosten',q.kosten);
    w.active={id:sh.id,owner:sh.owner,start:s.tick,minuten:q.minuten,
      lohn:q.lohn,kosten:q.kosten,gearbeitet:0};
    sh.phase='reise';sh.ziel=c.zielStation;sh.ankunft=s.tick+q.minuten;
    sh.auftrag='w5ac-ueberfuehrung';
    protokolliere(s,'auftrag',sh.id+': '+q.kosten+' ISK fuer '+q.minuten+' Flugminuten treuhaenderisch gebunden',sh.owner);
  }
  function tick(s,r){
    const c=r.w5Transfer,w=s.w5ac,a=w?.active;if(!a)return;
    const sh=s.ships[a.id],reserved=s.owners[c.reserved],worker=s.owners[c.pilot];
    if(!sh||sh.owner!==a.owner||!ownerOk(r,a.owner)||sh.klasse!=='frachter'
      ||sh.phase!=='reise'||sh.auftrag!=='w5ac-ueberfuehrung'
      ||sh.system!==c.quelle||sh.ziel!==c.zielStation
      ||sh.ankunft!==a.start+a.minuten||a.gearbeitet>=a.minuten
      ||s.tick!==a.start+a.gearbeitet+1
      ||!reserved||reserved.cash<a.lohn||!worker)
      throw Error('W5ac: unfinanzierte oder gefaelschte Flugminute');
    reserved.cash-=a.lohn;worker.cash+=a.lohn;
    buche(s,c.pilot,'erloes',a.lohn);
    w.paid+=a.lohn;a.gearbeitet++;
    if(a.gearbeitet===a.minuten){
      if(s.tick!==sh.ankunft||reserved.cash!==0)
        throw Error('W5ac: letzte Minute nicht voll bezahlt');
      w.completed.push({id:a.id,owner:a.owner,start:a.start,
        ankunft:s.tick,minuten:a.minuten,kosten:a.kosten});
      w.active=null;sh.auftrag='halten';
      protokolliere(s,'auftrag',sh.id+': Nadir-Aldera nach '+a.minuten+' voll bezahlten Minuten',a.owner);
    }
  }
  function audit(s,r){
    const c=r.w5Transfer,w=s.w5ac,a=w?.active;
    if(!c||!w)return {ok:false,grund:'Regel191-Transferbuch fehlt'};
    const reserved=s.owners[c.reserved]?.cash,worker=s.owners[c.pilot]?.cash;
    const route=m_core_route.route(r.world,c.quelle,c.ziel),duration=route?.zeit;
    const cost=duration*c.lohnJeMinute;
    const done=w.completed||[],ids=done.map(x=>x.id);
    const finished=done.reduce((n,x)=>n+x.kosten,0);
    const lost=id=>r.w5Replacement&&s.w5ad?.losses.find(x=>x.id===id);
    const validShip=x=>s.w5.schiffIds.includes(x.id)
      &&(x.owner!==r.economy.start.owner || !r.k7
        || s.kanon?.spielerFrachterKaeufe?.some(p=>p.id===x.id
          &&p.station===r.w5.station&&p.tick<=x.start))
      &&(s.ships[x.id]||lost(x.id))?.owner===x.owner&&ownerOk(r,x.owner)
      &&(s.ships[x.id]||lost(x.id))?.klasse==='frachter'
      &&(s.ships[x.id]||lost(x.id))?.heimat===c.quelle;
    const activeOk=!a||(validShip(a)&&ownerOk(r,a.owner)
      &&a.minuten===duration&&a.lohn===c.lohnJeMinute&&a.kosten===cost
      &&Number.isSafeInteger(a.gearbeitet)&&a.gearbeitet>=0&&a.gearbeitet<duration
      &&s.tick===a.start+a.gearbeitet
      &&s.ships[a.id]?.system===c.quelle
      &&s.ships[a.id]?.phase==='reise'
      &&s.ships[a.id]?.auftrag==='w5ac-ueberfuehrung'
      &&s.ships[a.id]?.ziel===c.zielStation
      &&s.ships[a.id]?.ankunft===a.start+duration);
    const ok=[reserved,worker,w.allocated,w.paid,duration,cost].every(x=>
      Number.isSafeInteger(x)&&x>=0)
      &&duration>0&&cost>0
      &&Array.isArray(done)&&new Set(ids).size===ids.length
      &&done.every(x=>validShip(x)&&ownerOk(r,x.owner)&&x.minuten===duration
        &&x.kosten===cost&&Number.isSafeInteger(x.start)&&x.start>=0
        &&x.ankunft===x.start+duration&&x.ankunft<=s.tick
        &&((lost(x.id)?.tick>=x.ankunft&&lost(x.id)?.system===c.ziel)
          ||s.w3.auftrag?.schiff===x.id
          ||(!!r.kanon&&s.w5n?.frachtauftrag?.schiff===x.id)
          ||(s.ships[x.id].system===c.ziel&&s.ships[x.id].phase==='dock'
            &&s.ships[x.id].auftrag==='halten')))
      &&activeOk&&(!a||!ids.includes(a.id))
      &&w.allocated===finished+(a?.kosten??0)
      &&w.paid===finished+(a?.gearbeitet??0)*c.lohnJeMinute
      &&reserved===w.allocated-w.paid&&worker+m_core_kanon.netto(s,c.pilot)===w.paid;
    return {ok,allocated:w.allocated,paid:w.paid,reserved,worker,
      active:!!a,completed:done.length,shipId:a?.id??null,
      remaining:a?duration-a.gearbeitet:0,
      routeMinutes:duration,perMinute:c.lohnJeMinute,
      ownerCash:s.owners[c.owner]?.cash};
  }
  return {pruefen,start,tick,audit,spielerKosten};
})();

// W5ad: opt-in Rule192 commands; uses the existing purchase, loss, route and labor core.
// Loss injection is a declared research event, never a new wear/combat rule.
const m_core_w5_replacement=(()=>{
  const fail=grund=>({ok:false,grund});
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  function lossQuote(s,r,sh){
    if(!r.w5Replacement||!s.w5ad)return fail('Nur W5ad-Forschung');
    if(!sh||sh.owner!==r.w3.spedition||sh.klasse!=='frachter'
      ||sh.phase!=='dock'||sh.system!=='aldera'||sh.auftrag!=='halten'
      ||Object.values(sh.ladung).some(n=>n!==0)||s.w3.auftrag||s.w5ac.active)
      return fail('Verlustgate: nur freier leerer eigener Aldera-Frachter');
    if(!s.w5ad.purchases.some(p=>p.id===sh.id))return fail('Kaufbeleg fehlt');
    return {ok:true};
  }
  function lose(s,r,sh){
    const q=lossQuote(s,r,sh);if(!q.ok)throw Error(q.grund);
    s.w5ad.losses.push({id:sh.id,tick:s.tick,owner:sh.owner,klasse:sh.klasse,
      system:sh.system,heimat:sh.heimat,cause:'declared-research-loss'});
    m_core_sicherheit.entfernen(s,r,sh);
    m_core_state.protokolliere(s,'verlust',sh.id+': deklarierter W5ad-Forschungsverlust',sh.owner);
  }
  function quote(s,r,owner,id,reserve=0){
    if(!r.w5Replacement||!s.w5ad)return fail('Nur W5ad-Forschung');
    if(owner!==r.w3.spedition)return fail('Keine fremde Konzernkasse');
    if(!integer(reserve))return fail('Ungueltige freiwillige Liquiditaetsreserve');
    const loss=s.w5ad.losses.find(x=>x.id===id);
    if(!loss||s.ships[id])return fail('Kein tatsaechlicher Verlust');
    if(s.w5ad.assignments.some(x=>x.lost===id))return fail('Verlust bereits zugeordnet');
    if(s.w3.auftrag||s.w5ac.active)return fail('Arbeit oder Ueberfuehrung noch gebunden');
    const sale=m_core_w5.verkaufPruefen(s,r);if(!sale.ok)return sale;
    const minutes=m_core_route.route(r.world,r.w5Transfer.quelle,r.w5Transfer.ziel)?.zeit;
    const ferry=minutes*r.w5Transfer.lohnJeMinute;
    const work=m_core_w3.kalkulation(r).arbeitsKosten;
    const held=Math.max(work,reserve),total=sale.preis+ferry+held;
    if(!integer(total)||total<=0)return fail('Ungueltige Vollkosten');
    const cash=s.owners[owner].cash;
    if(cash<total)return {ok:false,grund:'Eigenkapital unter Kauf + Flug + Arbeitsreserve',
      cash,price:sale.preis,ferry,work,held,total,shortfall:total-cash};
    if(s.owners[r.w5Transfer.reserved]?.cash!==0||!m_core_audit.audit(s).ok)
      return fail('Ungueltige Ausgangsbilanz oder belegtes Flugtreuhand');
    return {ok:true,cash,price:sale.preis,ferry,work,held,total,minutes};
  }
  function replace(s,r,cmd){
    const q=quote(s,r,cmd.owner,cmd.verlust,cmd.reserve);if(!q.ok)throw Error(q.grund);
    // All preconditions before the first mutation. Reuse the exact existing commands.
    const buy=m_core_commands.execute(s,{type:'shipBuy',owner:cmd.owner,
      klasse:r.w5.klasse,station:r.w5.station},r);
    if(!buy.ok)throw Error(buy.reason);
    const id=s.w5.schiffIds.at(-1),sh=s.ships[id];
    m_core_w5_transfer.start(s,r,sh);
    s.w5ad.assignments.push({lost:cmd.verlust,id,tick:s.tick,
      reserve:q.held,cashBefore:q.cash,
      ...(s.kanon?{netto:m_core_kanon.netto(s,cmd.owner)}:{})});
  }
  function audit(s,r){
    const b=s.w5ad;
    if(!b||!Array.isArray(b.purchases)||!Array.isArray(b.losses)
      ||!Array.isArray(b.assignments)||!Array.isArray(b.freight))return fail('Ersatzbuch fehlt');
    const {purchases:p,losses:l,assignments:a,freight:f}=b;
    const unique=(xs,key)=>new Set(xs.map(x=>x[key])).size===xs.length;
    const initial=r.owners.find(x=>x.id===r.w3.spedition).cash;
    const price=r.economy.waren.frachter.basis,k=m_core_w3.kalkulation(r);
    const loss=id=>l.find(x=>x.id===id),purchase=id=>p.find(x=>x.id===id);
    const ferries=[...s.w5ac.completed,...(s.w5ac.active?[s.w5ac.active]:[])];
    const ownerOk=Object.values(s.ships).filter(sh=>sh.owner===r.w3.spedition)
      .every(sh=>sh.klasse==='frachter'&&purchase(sh.id)&&!loss(sh.id));
    const purchaseOk=unique(p,'id')&&p.length===s.ledger.frachter.consumed
      -(r.kanon ? (s.kanon?.spielerFrachterKaeufe?.length??0) : 0)
      &&p.every((x,i)=>integer(x.tick)&&x.tick<=s.tick&&x.preis===price
        &&(i===0||p[i-1].tick<=x.tick)
        &&['st_aldera','st_nadir'].includes(x.station)
        &&(x.station==='st_nadir')===s.w5.schiffIds.includes(x.id)
        &&((s.ships[x.id]?.owner===r.w3.spedition
          &&s.ships[x.id]?.klasse==='frachter'
          &&s.ships[x.id]?.heimat===(x.station==='st_nadir'?'nadir':'aldera'))||loss(x.id)));
    const lossOk=unique(l,'id')&&l.length===(s.stats.verluste.transport?.frachter??0)
      &&l.every(x=>!s.ships[x.id]&&purchase(x.id)&&integer(x.tick)
        &&x.tick>=purchase(x.id).tick&&x.tick<=s.tick&&x.owner===r.w3.spedition
        &&x.klasse==='frachter'&&x.system==='aldera'
        &&x.heimat===(purchase(x.id).station==='st_nadir'?'nadir':'aldera')
        &&x.cause==='declared-research-loss'
        &&(x.heimat==='aldera'||s.w5ac.completed.some(t=>t.id===x.id&&t.ankunft<=x.tick)));
    const freightOk=f.length===s.w3.abgeschlossen&&f.every((x,i)=>purchase(x.id)
      &&integer(x.start)&&x.start>=purchase(x.id).tick&&x.end===x.start+2*k.zeit
      &&x.end<=s.tick&&x.work===k.arbeitsKosten&&x.fee===k.frachtGebuehr
      &&x.amount===r.w3.fracht&&(!loss(x.id)||x.end<=loss(x.id).tick)
      &&(i===0||f[i-1].end<=x.start)
      &&(purchase(x.id).station==='st_aldera'
        ||s.w5ac.completed.some(t=>t.id===x.id&&t.ankunft<=x.start)));
    const assignmentOk=unique(a,'lost')&&unique(a,'id')&&a.every(x=>{
      const lp=loss(x.lost),np=purchase(x.id),index=p.findIndex(t=>t.id===x.id);
      const flight=ferries.find(t=>t.id===x.id);
      // Reconstruct OWN cash before purchase from earlier purchases and completed work.
      const earned=f.filter(t=>t.end<=x.tick).reduce((n,t)=>n+t.fee-t.work,0);
      const paidFerries=ferries.filter(t=>t.owner===r.w3.spedition&&t.id!==x.id&&t.start<=x.tick)
        .reduce((n,t)=>n+t.kosten,0);
      return lp&&np&&flight&&integer(x.tick)&&x.tick>=lp.tick&&x.tick===np.tick
        &&np.station==='st_nadir'&&flight.start===x.tick
        &&integer(x.reserve)&&x.reserve>=k.arbeitsKosten
        &&x.cashBefore+(x.netto??0)===initial-index*price+earned-paidFerries
        &&x.cashBefore>=price+flight.kosten+x.reserve;
    });
    const active=s.w3.auftrag,sh=active?s.ships[active.schiff]:null;
    const activeOk=!active||(r.k7&&active.phase==='vorbestellt'
      ?(purchase(active.schiff)&&!loss(active.schiff)&&sh?.phase==='dock'
        &&sh.system==='aldera'&&sh.auftrag==='halten'&&active.gearbeitet===0
        &&Object.values(sh.ladung).every(n=>n===0))
      :(purchase(active.schiff)&&!loss(active.schiff)
      &&integer(active.start)&&s.tick===active.start+active.gearbeitet
      &&sh?.phase==='reise'&&sh.auftrag==='fracht'
      &&sh.system===(active.phase==='hin'?'aldera':'nadir')
      &&sh.ziel===(active.phase==='hin'?'st_nadir':'st_aldera')
      &&sh.ankunft===active.start+(active.phase==='hin'?k.zeit:2*k.zeit)));
    const profileOk=m_core_hash.canonical(b.profile)===m_core_hash.canonical(r.w5Replacement)
      &&Object.values(s.owners).every(o=>integer(o.cash))
      &&m_core_hash.canonical(p.filter(x=>x.station==='st_nadir').map(x=>x.id))
        ===m_core_hash.canonical(s.w5.schiffIds.filter(id=>!r.k7
          ||!s.kanon?.spielerFrachterKaeufe?.some(x=>x.id===id)));
    return {ok:profileOk&&ownerOk&&purchaseOk&&lossOk&&freightOk&&assignmentOk&&activeOk,
      profileOk,ownerOk,purchaseOk,lossOk,freightOk,assignmentOk,activeOk,
      lost:l.length,replaced:a.length,deployed:a.filter(x=>f.some(t=>t.id===x.id)).length};
  }
  return {lossQuote,lose,quote,replace,audit};
})();

// W5ae – wage-fund inventory purchase: voluntary, physical, finite and auditably funded.
// No water or private consumer utility is fabricated. Funds are treated as pooled
// collective purchasing capital ONLY in this isolated Rule193 research profile.
const m_core_w5_wage_trade=(()=>{
  const {buche}=m_core_handel,{protokolliere}=m_core_state;
  function pruefen(s,r,owner,menge){
    const cfg=r.w5WageTrade,w=s.w5ae;
    if(!cfg||!w||s.rulesVersion!==r.rulesVersion)
      return {ok:false,grund:'W5ae-Lohnforschung ist nicht aktiv'};
    if(owner!==cfg.buyer)return {ok:false,grund:'Kein Eigentum an diesem Lohnfonds'};
    if(!Number.isSafeInteger(menge)||menge<=0)
      return {ok:false,grund:'Nur positive ganze Materialmenge'};
    const total=menge*cfg.preis;
    if(!Number.isSafeInteger(total)||total<=0)
      return {ok:false,grund:'Materialpreis nicht abrechenbar'};
    if(s.owners[owner]?.cash<total)
      return {ok:false,grund:'Ausgezahltes eigenes Lohngeld reicht nicht aus'};
    const available=s.stations[cfg.seller]?.lager[cfg.ware];
    if(!Number.isSafeInteger(available)||available<menge)
      return {ok:false,grund:'Kein tatsächlich produziertes und verfügbares Material'};
    if(!audit(s,r).ok)return {ok:false,grund:'Lohn-/Lager-/Eigentumsbelege stimmen nicht'};
    return {ok:true,owner,menge,preisJeEinheit:cfg.preis,gesamt:total,
      seller:cfg.seller,buyer:cfg.buyer,ware:cfg.ware};
  }
  function kaufen(s,r,owner,menge){
    const q=pruefen(s,r,owner,menge);if(!q.ok)throw Error(q.grund);
    const cfg=r.w5WageTrade,w=s.w5ae;
    s.owners[owner].cash-=q.gesamt;
    s.owners[cfg.seller].cash+=q.gesamt;
    s.stations[cfg.seller].lager[cfg.ware]-=menge;
    w.inventory[cfg.ware]+=menge;
    w.purchased+=menge;w.spent+=q.gesamt;
    w.deals.push({tick:s.tick,owner,station:cfg.seller,ware:cfg.ware,
      menge,preis:cfg.preis,betrag:q.gesamt});
    buche(s,owner,'kosten',q.gesamt);
    buche(s,cfg.seller,'erloes',q.gesamt);
    protokolliere(s,'handel',owner+': '+menge+' Material fuer '+q.gesamt+
      ' ISK aus bereits ausgezahlten Frachtloehnen gekauft; echtes Privateigentum',owner);
  }
  function audit(s,r){
    const cfg=r.w5WageTrade,w=s.w5ae;
    if(!cfg||!w)return {ok:false,grund:'W5ae-Originalbuch fehlt'};
    const fund=s.owners[cfg.buyer]?.cash,seller=s.owners[cfg.seller]?.cash,
      inv=w.inventory?.[cfg.ware],deals=w.deals;
    const items=Array.isArray(deals)?deals.reduce((n,d)=>n+d.menge,0):NaN;
    const sales=Array.isArray(deals)?deals.reduce((n,d)=>n+d.betrag,0):NaN;
    const good=[fund,seller,inv,w.purchased,w.spent,items,sales].every(n=>
      Number.isSafeInteger(n)&&n>=0)
      &&Array.isArray(deals)&&deals.every((d,i)=>Number.isSafeInteger(d.tick)
        &&d.tick>=0&&d.tick<=s.tick&&(i===0||deals[i-1].tick<=d.tick)
        &&d.owner===cfg.buyer&&d.station===cfg.seller&&d.ware===cfg.ware
        &&Number.isSafeInteger(d.menge)&&d.menge>0
        &&d.preis===cfg.preis&&d.betrag===d.menge*cfg.preis)
      &&w.purchased===items&&w.spent===sales
      &&w.spent===w.purchased*cfg.preis
      &&inv===w.purchased
      &&(r.w5ag
        ?fund+m_core_kanon.netto(s,cfg.buyer)===0&&w.spent===0
        :fund+w.spent+(s.w5n?.wasserErlos??0)
           ===s.w3.arbeitsKosten+(s.w5n?.frachtLohn??0))
      &&s.stats.konto[cfg.buyer].kosten===w.spent+(r.w5ag?0:(s.w5n?.wasserErlos??0))
      &&s.stats.konto[cfg.seller].erloes===(s.w5?.materialUmsatz??0)+w.spent+(s.w5n?.wasserErlos??0)
        +(r.k7?(s.w3?.stornoRueckzahlung||0):0)
      &&seller+m_core_kanon.netto(s,cfg.seller)+(s.w3.kaufAusgaben-(s.w3.stornoRueckzahlung||0))+s.w4.gebucht
         -(s.w5?.materialUmsatz??0)-w.spent
         +(s.w5n?.kaufAusgaben??0)+(s.w5n?.fabrikGebucht??0)
         -(s.w5n?.wasserErlos??0)
         ===r.owners.find(o=>o.id===cfg.seller).cash;
    return {ok:good,workerCash:fund,stationCash:seller,
      materialOwned:inv,materialPurchased:w.purchased,
      price:cfg.preis,spent:w.spent,purchases:deals?.length??0,
      paidLabor:s.w3.arbeitsKosten,
      cannotClaimConsumption:true};
  }
  return {pruefen,kaufen,audit};
})();

const m_core_w5n=(()=>{
 const {buche,handel,aufnehmbar,obergrenze}=m_core_handel;
 const {protokolliere}=m_core_state;
 const {route}=m_core_route;
 const beitrag=(s)=>s.w5n;
 function ankaufbar(s,r,sh,n){
   return !!r.w5n&&sh?.klasse==='miner'&&sh.system==='aldera'
     &&m_core_kanon.amDock(sh,r.w5n.quellStation)
     &&Number.isSafeInteger(n)&&n>0&&(sh.ladung.eis||0)>=n
     &&n<=aufnehmbar(s,r,r.w5n.quellStation,'eis');
 }
 function verkauf(s,r,sh,n){
   if(!ankaufbar(s,r,sh,n)||!handel(s,r,sh,r.w5n.quellStation,'eis',n,false))
     throw Error('W5n: Eis ohne reales Stationskapital verkauft');
   const w=beitrag(s);w.mineVerkauft+=n;w.mineVerkaufWert+=n*r.w5n.eisPreis;
   s.stats.handel++;s.stats.verkaeufe[sh.id]++;
 }
 function foerdern(s,r,sh){
   const w=beitrag(s),c=r.w5n;
   const belegt=Object.values(sh.ladung).reduce((n,x)=>n+x,0);
   const n=Math.min(r.economy.miningRate,r.economy.cargo-belegt);
   if(n<=0||s.owners[sh.owner].cash<c.mineLohn){
     sh.auftrag='halten';
     protokolliere(s,'auftrag',sh.id+': Eisabbau pausiert (Fracht/Arbeitsgeld)',sh.owner);
     return 0;
   }
   s.owners[sh.owner].cash-=c.mineLohn;
   s.owners[r.world.systems[sh.system].fonds].cash+=c.mineLohn;
   buche(s,sh.owner,'kosten',c.mineLohn);
   sh.ladung.eis=(sh.ladung.eis||0)+n;
   s.ledger.eis.mined+=n;
   w.eisAbgebaut+=n;w.mineMinuten++;w.mineLohn+=c.mineLohn;
   // Research-only: dockgebundene F2b-Eisabnahme. Regel195 bleibt unverändert,
   // weil ausschließlich die Forschungskonfiguration dieses Flag aktivieren darf.
   if(sh.ladung.eis>=c.charge && r.w5n.f2bDockOnly!==true && !m_core_kanon.aktiv()){
     const abnahme=Math.min(sh.ladung.eis,aufnehmbar(s,r,c.quellStation,'eis'));
     if(abnahme>=c.charge)verkauf(s,r,sh,abnahme);
   }
   if(Object.values(sh.ladung).reduce((sum,x)=>sum+x,0)>=r.economy.cargo)
     sh.auftrag='halten';
   return n;
 }
 const preise=r=>{
   const c=r.w5n,weg=route(r.world,'aldera','nadir');
   if(!weg||weg.zeit!==c.flugMinuten)throw Error('W5n: Route inkonsistent');
   const eis=c.charge*c.eisPreis,fracht=2*weg.zeit*c.frachtJeMinute;
   const arbeit=2*weg.zeit*c.fliegerLohn;
   return {zeit:weg.zeit,eis,fracht,arbeit,gesamt:eis+fracht};
 };
 function pruefenFracht(s,r,sh){
   if(!r.w5n||s.rulesVersion!==r.rulesVersion||!s.w5n)
     return {ok:false,grund:'Eisroute nur in W5af/Rule194'};
   const c=r.w5n,w=s.w5n,p=preise(r);
   if(w.frachtauftrag||s.w3.auftrag)return {ok:false,grund:'Frachter bereits gebunden'};
   // K1/Draft: derselbe Originalauftrag darf auch durch den rechtmaessigen
   // Spieler-Eigentuemer ausgefuehrt werden. W5/Regel195 bleibt Speditionsrecht.
   const spieler=r.kanon&&sh?.owner===r.economy.start.owner;
   if(!sh||sh.klasse!=='frachter'||(sh.owner!==c.frachterOwner&&!spieler)
     ||sh.phase!=='dock'||sh.system!=='aldera'||sh.auftrag!=='halten'
     ||Object.values(sh.ladung).some(n=>n!==0)
     ||(spieler&&(!sh.flug||sh.flug.lage!=='angedockt'
       ||sh.flug.anker!==c.quellStation)))
     return {ok:false,grund:'Eigener leerer Frachter am Aldera-Dock erforderlich'};
   if((s.stations[c.quellStation].lager.eis||0)<c.charge)
     return {ok:false,grund:'Noch keine echte 50er-Eischarge im Quelllager'};
   if((s.stations[c.zielStation].lager.eis||0)+c.charge>obergrenze(s,r,c.zielStation,'eis'))
     return {ok:false,grund:'Eislager Nadir voll'};
   if(s.owners[c.zielStation].cash<p.gesamt)
     return {ok:false,grund:'Nadir kann Eis und Hin-/Rueckfracht nicht bezahlen'};
   if(s.owners[sh.owner].cash<p.arbeit)
     return {ok:false,grund:sh.owner===c.frachterOwner
       ? 'Spedition kann Flugarbeit nicht vorfinanzieren'
       : 'Spieler kann beide Fluege nicht vorfinanzieren'};
   return {ok:true,grund:'Beide Fluege, Ware und Frachttarif finanzierbar',...p};
 }
 function frachtStart(s,r,sh){
   const p=pruefenFracht(s,r,sh);if(!p.ok)throw Error('W5n-Fracht: '+p.grund);
   const c=r.w5n,w=s.w5n;
   for(const [id,kind]of [['w5n_fracht_kauf','w5n-reserve'],['w5n_fracht_arbeit','w5n-reserve']])
     if(!s.owners[id])s.owners[id]={id,kind,cash:0};
   const geld=s.owners.w5n_fracht_kauf,arbeit=s.owners.w5n_fracht_arbeit;
   if(geld.cash||arbeit.cash)throw Error('W5n doppelte Reservierung');
   s.owners[c.zielStation].cash-=p.gesamt;geld.cash+=p.gesamt;
   buche(s,c.zielStation,'kosten',p.gesamt);
   s.owners[sh.owner].cash-=p.arbeit;arbeit.cash+=p.arbeit;
   s.stations[c.quellStation].lager.eis-=c.charge;
   sh.ladung.eis=c.charge;
   sh.phase='reise';sh.ziel=c.zielStation;sh.ankunft=s.tick+p.zeit;sh.auftrag='eisfracht';
   w.kaufAusgaben+=p.gesamt;w.frachtBeauftragt++;
   w.frachtauftrag={schiff:sh.id,phase:'hin',gearbeitet:0,menge:c.charge,...p};
 }
 function pruefenWasser(s,r,owner,station){
   if(!r.w5n||s.rulesVersion!==r.rulesVersion||!s.w5n)
     return {ok:false,grund:'Wasserwerk nur in W5af/Rule194'};
   const c=r.w5n,w=s.w5n;
   if(owner!==c.zielStation||station!==c.zielStation)
     return {ok:false,grund:'Nur Nadir zahlt sein Wasserwerk'};
   if(w.fabrikauftrag)return {ok:false,grund:'Wasserwerk bereits beauftragt'};
   if(s.stations[station].lager.eis<c.rezeptEis)
     return {ok:false,grund:'Reales geliefertes Eis fehlt'};
   if(s.stations[station].lager.wasser+c.rezeptWasser>obergrenze(s,r,station,'wasser'))
     return {ok:false,grund:'Wasserlager voll'};
   const arbeit=c.fabrikMinuten*c.fabrikLohn;
   if(s.owners[station].cash<arbeit)return {ok:false,grund:'Wasserwerk-Arbeit nicht finanzierbar'};
   return {ok:true,grund:'Rohstoff, Arbeit und Lager finanziert',arbeit};
 }
 function wasserStart(s,r,owner,station){
   const p=pruefenWasser(s,r,owner,station);if(!p.ok)throw Error(p.grund);
   const w=s.w5n;
   if(!s.owners.w5n_fabrik_arbeit)s.owners.w5n_fabrik_arbeit={id:'w5n_fabrik_arbeit',kind:'w5n-reserve',cash:0};
   if(s.owners.w5n_fabrik_arbeit.cash)throw Error('Wasserwerk doppelt vorfinanziert');
   s.owners[station].cash-=p.arbeit;
   s.owners.w5n_fabrik_arbeit.cash+=p.arbeit;
   buche(s,station,'kosten',p.arbeit);
   w.fabrikGebucht+=p.arbeit;w.fabrikBegonnen++;
   w.fabrikauftrag={gearbeitet:0,arbeit:p.arbeit};
 }
 function tick(s,r){
   const c=r.w5n,w=s.w5n,a=w.frachtauftrag;
   if(a){
     const sh=s.ships[a.schiff],work=s.owners.w5n_fracht_arbeit,
       kauf=s.owners.w5n_fracht_kauf;
     if(!sh||sh.auftrag!=='eisfracht'||sh.phase!=='reise'
       ||!work||!kauf||work.cash<c.fliegerLohn)
       throw Error('W5n unbezahlte Frachtminute');
     work.cash-=c.fliegerLohn;
     if(r.w5ag)m_core_w5ag.pay(s,r,'eis',c.fliegerLohn,sh.id);
     else s.owners.fonds_transport.cash+=c.fliegerLohn;
     w.frachtLohn+=c.fliegerLohn;buche(s,sh.owner,'kosten',c.fliegerLohn);
     a.gearbeitet++;
     if(s.tick===sh.ankunft){
       if(a.phase==='hin'){
         if(sh.ziel!==c.zielStation||sh.ladung.eis!==a.menge||kauf.cash<a.eis)
           throw Error('W5n Fracht ohne Eis und Kaufbetrag');
         sh.ladung.eis=0;
         s.stations[c.zielStation].lager.eis+=a.menge;
         kauf.cash-=a.eis;s.owners[c.quellStation].cash+=a.eis;
         buche(s,c.quellStation,'erloes',a.eis);
         w.eisGeliefert+=a.menge;w.eisTransferWert+=a.eis;
         a.phase='rueck';sh.system='nadir';sh.ziel=c.quellStation;
         sh.ankunft+=a.zeit;
       }else{
         if(sh.ziel!==c.quellStation||kauf.cash!==a.fracht
           ||work.cash!==0||a.gearbeitet!==2*a.zeit)
           throw Error('W5n Rueckfahrt unbezahlt');
         kauf.cash=0;s.owners[sh.owner].cash+=a.fracht;
         buche(s,sh.owner,'erloes',a.fracht);
         w.frachtUmsatz+=a.fracht;w.frachtAbgeschlossen++;
         if(r.w5ag)m_core_w5ag.iceEnd(s,r,sh.id);
         w.frachtauftrag=null;
         sh.system='aldera';sh.phase='dock';sh.ziel=null;
         sh.ankunft=s.tick;sh.auftrag='halten';
       }
     }
   }
   const f=w.fabrikauftrag;
   if(f){
     const konto=s.owners.w5n_fabrik_arbeit;
     if(!konto||konto.cash<c.fabrikLohn)throw Error('W5n Wasserwerk ohne Lohnreserve');
     konto.cash-=c.fabrikLohn;s.owners.w5n_arbeit.cash+=c.fabrikLohn;
     buche(s,'w5n_arbeit','erloes',c.fabrikLohn);
     f.gearbeitet++;w.fabrikBezahlt+=c.fabrikLohn;
     if(f.gearbeitet===c.fabrikMinuten){
       const lager=s.stations[c.zielStation].lager;
       if(lager.eis<c.rezeptEis||lager.wasser+c.rezeptWasser>
         obergrenze(s,r,c.zielStation,'wasser'))throw Error('W5n Wasserproduktion ohne Material/Lager');
       lager.eis-=c.rezeptEis;lager.wasser+=c.rezeptWasser;
       s.ledger.eis.consumed+=c.rezeptEis;
       s.ledger.wasser.produced+=c.rezeptWasser;
       w.eisVerbraucht+=c.rezeptEis;w.wasserProduziert+=c.rezeptWasser;
       w.fabrikFertig++;w.fabrikauftrag=null;
     }
   }
 }
 function pruefenKonsum(s,r,owner,menge){
    const c=r.w5n,w=s.w5n;
    if(!c||!w||s.rulesVersion!==r.rulesVersion)
      return {ok:false,grund:'W5af nicht aktiv'};
    if(r.w5ag ? !Object.values(r.w5ag.pilots).includes(owner) : owner!==c.kunde)
      return {ok:false,grund:'Wasser nur aus eigenem wirklich verdienten Pilotenlohn'};
    if(!Number.isSafeInteger(menge)||menge<=0)
      return {ok:false,grund:'Nur positive ganze Wassermenge'};
    const kosten=menge*c.wasserPreis;
    if(!Number.isSafeInteger(kosten)||kosten<=0)
      return {ok:false,grund:'Unzulaessiger Preis'};
    if((s.stations[c.zielStation]?.lager.wasser??0)<menge)
      return {ok:false,grund:'Wasser nicht tatsaechlich produziert'};
    if(s.owners[owner].cash<kosten)
      return {ok:false,grund:'Nicht genug tatsaechlich bezahlter Fluglohn'};
    return {ok:true,menge,kosten,kunde:owner,station:c.zielStation,
      preisJeEinheit:c.wasserPreis};
  }
  function verbrauch(s,r,owner,menge){
    const q=pruefenKonsum(s,r,owner,menge);
    if(!q.ok)throw Error(q.grund);
    const c=r.w5n,w=s.w5n;
    s.stations[c.zielStation].lager.wasser-=menge;
    s.ledger.wasser.consumed+=menge;
    s.owners[owner].cash-=q.kosten;
    s.owners[c.zielStation].cash+=q.kosten;
    buche(s,owner,'kosten',q.kosten);
    buche(s,c.zielStation,'erloes',q.kosten);
    w.wasserVerbraucht+=menge;w.wasserErlos+=q.kosten;
    w.kaufDeals.push({tick:s.tick,owner,station:c.zielStation,menge,
      preis:c.wasserPreis,betrag:q.kosten});
    protokolliere(s,'handel',owner+': '+menge+' wirklich erzeugtes Wasser fuer '+
      q.kosten+' ISK aus erarbeitetem Lohn verbraucht',owner);
  }
  function audit(s,r){
   const w=s.w5n,c=r.w5n;if(!w||!c)return {ok:false,grund:'W5n-Buch fehlt'};
   const p=preise(r),a=w.frachtauftrag,f=w.fabrikauftrag;
   const iceCargo=Object.values(s.ships).filter(sh=>sh.klasse==='miner')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const iceRoute=Object.values(s.ships).filter(sh=>sh.klasse==='frachter')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const factoryCost=c.fabrikMinuten*c.fabrikLohn;
   const numbers=[w.eisAbgebaut,w.mineMinuten,w.mineLohn,w.mineVerkauft,w.mineVerkaufWert,
     w.eisTransferWert,w.frachtBeauftragt,w.frachtAbgeschlossen,w.eisGeliefert,
     w.kaufAusgaben,w.frachtLohn,w.frachtUmsatz,w.fabrikBegonnen,w.fabrikFertig,
     w.fabrikGebucht,w.fabrikBezahlt,w.eisVerbraucht,w.wasserProduziert,
     w.wasserVerbraucht,w.wasserErlos,w.knappheitsStunden,iceCargo,iceRoute];
   const ok=numbers.every(x=>Number.isSafeInteger(x)&&x>=0)
     &&w.eisAbgebaut===s.ledger.eis.mined&&w.mineLohn===w.mineMinuten*c.mineLohn
     &&w.eisAbgebaut>=w.mineMinuten
     &&w.eisAbgebaut<=w.mineMinuten*r.economy.miningRate
     &&w.eisAbgebaut===w.mineVerkauft+iceCargo
     &&w.mineVerkaufWert===w.mineVerkauft*c.eisPreis
     &&w.eisTransferWert===w.eisGeliefert*c.eisPreis
     &&w.mineVerkauft===s.stations[c.quellStation].lager.eis+iceRoute+w.eisGeliefert
     &&iceRoute===(a?.phase==='hin'?c.charge:0)
     &&s.stations[c.zielStation].lager.eis===w.eisGeliefert-w.eisVerbraucht
     &&s.stations[c.zielStation].lager.wasser===w.wasserProduziert-w.wasserVerbraucht-m_core_kanon.wasserAbNadir(s)
     &&w.eisVerbraucht===s.ledger.eis.consumed
     &&w.wasserProduziert===s.ledger.wasser.produced
     &&w.wasserVerbraucht+m_core_kanon.wasserKonsum(s)===s.ledger.wasser.consumed
     &&w.wasserErlos===w.wasserVerbraucht*c.wasserPreis
     &&(r.w5ag
       ?s.owners[c.kunde].cash+m_core_kanon.netto(s,c.kunde)===0&&(s.w5ae?.spent??0)===0
       :s.owners[c.kunde].cash+(s.w5ae?.spent??0)+w.wasserErlos
          ===s.w3.arbeitsKosten+w.frachtLohn)
      &&Array.isArray(w.kaufDeals)
      &&w.kaufDeals.every((d,i)=>Number.isSafeInteger(d.tick)
        &&d.tick>=0&&d.tick<=s.tick&&(i===0||w.kaufDeals[i-1].tick<=d.tick)
        &&(r.w5ag?Object.values(r.w5ag.pilots).includes(d.owner):d.owner===c.kunde)
        &&d.station===c.zielStation
        &&Number.isSafeInteger(d.menge)&&d.menge>0
        &&d.preis===c.wasserPreis&&d.betrag===d.menge*d.preis)
      &&w.kaufDeals.reduce((n,d)=>n+d.menge,0)===w.wasserVerbraucht
      &&w.kaufDeals.reduce((n,d)=>n+d.betrag,0)===w.wasserErlos
     &&w.frachtBeauftragt===w.frachtAbgeschlossen+(a?1:0)
     &&w.kaufAusgaben===w.frachtBeauftragt*p.gesamt
     &&w.eisGeliefert===(w.frachtAbgeschlossen+(a?.phase==='rueck'?1:0))*c.charge
     &&w.frachtLohn===w.frachtAbgeschlossen*p.arbeit+(a?.gearbeitet??0)*c.fliegerLohn
     &&w.frachtUmsatz===w.frachtAbgeschlossen*p.fracht
     &&(s.owners.w5n_fracht_kauf?.cash||0)===(a?(a.phase==='hin'?p.gesamt:p.fracht):0)
     &&(s.owners.w5n_fracht_arbeit?.cash||0)===(a?p.arbeit-a.gearbeitet*c.fliegerLohn:0)
     &&(!a||(a.eis===p.eis&&a.fracht===p.fracht&&a.arbeit===p.arbeit
       &&a.zeit===p.zeit&&a.gearbeitet>=0&&a.gearbeitet<2*p.zeit
       &&(s.ships[a.schiff]?.owner===c.frachterOwner
         ||(r.kanon&&s.ships[a.schiff]?.owner===r.economy.start.owner
           &&s.kanon?.spielerFrachten?.auftraege?.some(x=>x.schiff===a.schiff&&x.end===null)))))
     &&w.fabrikBegonnen===w.fabrikFertig+(f?1:0)
     &&w.fabrikGebucht===w.fabrikBegonnen*factoryCost
     &&w.fabrikBezahlt===w.fabrikFertig*factoryCost+(f?.gearbeitet??0)*c.fabrikLohn
     &&s.owners.w5n_arbeit.cash+m_core_kanon.netto(s,'w5n_arbeit')===w.fabrikBezahlt
     &&(s.owners.w5n_fabrik_arbeit?.cash||0)===w.fabrikGebucht-w.fabrikBezahlt
     &&w.eisVerbraucht===w.fabrikFertig*c.rezeptEis
     &&w.wasserProduziert===w.fabrikFertig*c.rezeptWasser
     &&s.minted===0&&s.burned===0;
   return {ok,eisAbgebaut:w.eisAbgebaut,eisVerkauft:w.mineVerkauft,
     eisGeliefert:w.eisGeliefert,wasserProduziert:w.wasserProduziert,
     wasserVerbraucht:w.wasserVerbraucht,waterBuyerCash:s.owners[c.kunde].cash,
     kundenZahlungen:w.wasserErlos,frachtAuftrag:a?.phase||'frei',
     fabrikAuftrag:f?'in_arbeit':'frei',knappheitsStunden:w.knappheitsStunden};
 }
 function stand(s,r){
   if(s.rulesVersion!==r.rulesVersion)throw Error('W5n: andere Regelversion');
   const w=s.w5n;
   return Object.freeze({regel:29,tick:s.tick,gefoerdert:w.eisAbgebaut,
     verkauft:w.mineVerkauft,lieferungen:w.frachtAbgeschlossen,
     eisGeliefert:w.eisGeliefert,wasserProduziert:w.wasserProduziert,
     wasserVerbraucht:w.wasserVerbraucht,
     zahlung:w.wasserErlos,kundenRest:s.owners[r.w5n.kunde].cash,
     nadirKasse:s.owners.st_nadir.cash,alderaKasse:s.owners.st_aldera.cash,
     houseKasse:s.owners.house.cash,
     frachtKasse:s.owners.transport.cash,
     knappheitsStunden:w.knappheitsStunden,
     audit:Object.freeze(audit(s,r))});
 }
 return {ankaufbar,verkauf,foerdern,preise,pruefenFracht,frachtStart,
   pruefenWasser,wasserStart,pruefenKonsum,tick,verbrauch,audit,stand};
})();


// W5ag: exclusive, individual pilot accounts; wages are booked ONLY
// when an existing W3/W5n flight escrow has paid a real Core minute.
// This is an opt-in private-ownership RESEARCH assumption, not product law.
const m_core_w5ag=(()=>{
  const {buche}=m_core_handel;
  function pay(s,r,kind,amount,ship){
    const cfg=r.w5ag,p=s.w5ag,id=cfg?.pilots?.[kind];
    if(!cfg||!p||!id||amount!==cfg.wagePerMinute
      ||!s.owners[id]||!Number.isSafeInteger(s.tick)||s.tick<=0)
      throw Error('W5ag: kein beweisbarer privater Pilotenlohn');
    s.owners[id].cash+=amount;
    buche(s,id,'erloes',amount);
    p.paid[kind]+=amount;
    // K1 verdichtet: Summe je Vertrag statt eines Eintrags je Flugminute.
    if(!r.kanon)p.payments.push({tick:s.tick,kind,owner:id,schiff:ship,isk:amount});
  }
  function iceStart(s,r,ship){
    const p=s.w5ag,a=s.w5n?.frachtauftrag;
    if(!p||!a||a.schiff!==ship||p.iceContracts.some(c=>c.end===null))
      throw Error('W5ag: unbelegter oder doppelter Eis-Arbeitsvertrag');
    p.iceContracts.push({schiff:ship,start:s.tick,end:null});
  }
  function iceEnd(s,r,ship){
    const p=s.w5ag,v=p?.iceContracts?.at(-1);
    if(!v||v.end!==null||v.schiff!==ship
      ||s.tick!==v.start+2*r.w5n.flugMinuten)
      throw Error('W5ag: Eislohn ohne echte 120-Minuten-Rundfracht');
    v.end=s.tick;
    // K1 verdichtet abgeschlossene Verträge zu einem Zähler.
    if(r.kanon){p.iceContracts.pop();p.eisFertig=(p.eisFertig||0)+1;}
  }
  function audit(s,r){
    const cfg=r.w5ag,p=s.w5ag;
    if(!cfg||!p||!Array.isArray(p.payments)||!Array.isArray(p.iceContracts)
      ||!p.paid)return {ok:false,grund:'Private Pilotenbelege fehlen'};
    const valid=n=>Number.isSafeInteger(n)&&n>=0;
    const ore=s.w5ad?.freight??[],ice=p.iceContracts,
      w=s.w5n,f3=s.w3;
    const expected=[];
    const kompakt=!!r.kanon,minuten={erz:0,eis:0};
    const eisFertig=kompakt?(p.eisFertig||0):0;
    const add=(kind,ship,start,end)=>{
      if(!valid(start)||!valid(end)||end<start||end>s.tick)return false;
      minuten[kind]+=end-start;
      if(!kompakt)for(let tick=start+1;tick<=end;tick++)
        expected.push({tick,kind,owner:cfg.pilots[kind],
          schiff:ship,isk:cfg.wagePerMinute});
      return true;
    };
    minuten.eis+=eisFertig*2*r.w5n.flugMinuten;
    let contractOk=Array.isArray(ore)&&Array.isArray(ice);
    for(const t of ore)
      contractOk=add('erz',t.id,t.start,t.end)&&contractOk;
    if(f3?.auftrag && f3.auftrag.phase!=='vorbestellt'){
      const a=f3.auftrag;
      contractOk=add('erz',a.schiff,a.start,a.start+a.gearbeitet)&&contractOk;
    }
    for(let i=0;i<ice.length;i++){
      const t=ice[i],active=t.end===null,
        worked=active?w?.frachtauftrag?.gearbeitet:2*r.w5n.flugMinuten;
      contractOk=typeof t.schiff==='string'&&valid(t.start)
        &&!ice.slice(0,i).some(x=>x.schiff===t.schiff&&x.start===t.start)
        &&(active
          ?i===ice.length-1&&w.frachtauftrag?.schiff===t.schiff
            &&valid(worked)&&s.tick===t.start+worked
          :t.end===t.start+2*r.w5n.flugMinuten)
        &&add('eis',t.schiff,t.start,t.start+worked)&&contractOk;
    }
    contractOk=contractOk&&valid(eisFertig)
      &&ice.filter(x=>x.end!==null).length+eisFertig===w.frachtAbgeschlossen
      &&ice.filter(x=>x.end===null).length===(w.frachtauftrag?1:0)
      &&ice.length+eisFertig===w.frachtBeauftragt
      &&ore.length===f3.abgeschlossen;
    expected.sort((a,b)=>a.tick-b.tick||a.kind.localeCompare(b.kind));
    const paymentsOk=kompakt?p.payments.length===0
      :expected.length===p.payments.length
      &&expected.every((d,i)=>{
        const got=p.payments[i];
        return got&&got.tick===d.tick&&got.kind===d.kind
          &&got.owner===d.owner&&got.schiff===d.schiff&&got.isk===d.isk;
      });
    const spent={erz:0,eis:0};
    for(const d of w?.kaufDeals??[]){
      if(d.owner===cfg.pilots.erz)spent.erz+=d.betrag;
      else if(d.owner===cfg.pilots.eis)spent.eis+=d.betrag;
    }
    const wagesOk=valid(p.paid.erz)&&valid(p.paid.eis)
      &&p.paid.erz===f3.arbeitsKosten&&p.paid.eis===w.frachtLohn
      &&p.paid.erz===minuten.erz*cfg.wagePerMinute
      &&p.paid.eis===minuten.eis*cfg.wagePerMinute;
    const ownerOk=['erz','eis'].every(kind=>{
      const id=cfg.pilots[kind],wallet=s.owners[id],
        stats=s.stats.konto[id],earned=p.paid[kind],cost=spent[kind];
      return wallet?.kind==='private-pilot'&&valid(wallet.cash)
        &&wallet.cash+m_core_kanon.netto(s,id)===earned-cost
        &&stats?.erloes===earned&&stats?.kosten===cost;
    })&&s.owners[cfg.fonds]?.cash+m_core_kanon.netto(s,cfg.fonds)===0
      &&s.stats.konto[cfg.fonds]?.kosten===0
      &&s.w5ae?.spent===0;
    return {ok:contractOk&&paymentsOk&&wagesOk&&ownerOk,
      contractOk,paymentsOk,wagesOk,ownerOk,
      earnedOre:p.paid.erz,earnedIce:p.paid.eis,
      spentOre:spent.erz,spentIce:spent.eis,
      cashOre:s.owners[cfg.pilots.erz]?.cash,
      cashIce:s.owners[cfg.pilots.eis]?.cash,
      pooledCash:s.owners[cfg.fonds]?.cash,
      paidMinutes:kompakt?minuten.erz+minuten.eis:p.payments.length,
      iceContracts:ice.length+eisFertig};
  }
  return {pay,iceStart,iceEnd,audit};
})();

// W1: rein lesende Vollkosten-/Liquiditaetsrechnung aus gebuchten Originalkonten.
// Kein eigener Wirtschaftskern, kein weiterer Geld- oder Warenfluss.
const m_core_w1_vollkosten = (() => {
  const { anzahl } = m_core_zahl;
  function pruefen(state, rules) {
    const cfg = rules.erzpilot;
    if (!cfg) return null;
    const vertraege = state.erzpilotVertraege || {};
    const startCash = (id) => rules.owners.find((o) => o.id === id)?.cash ?? null;
    function saldo(id, gebunden = 0) {
      const konto = state.owners[id], statistik = state.stats.konto[id];
      const anfang = startCash(id);
      const erloese = statistik?.erloes, kosten = statistik?.kosten, frei = konto?.cash;
      const netto = erloese - kosten;
      const kassenDelta = frei + gebunden - anfang + m_core_kanon.netto(state, id);
      const ok = [anfang, erloese, kosten, frei, gebunden, netto, kassenDelta]
        .every(Number.isSafeInteger) && anfang >= 0 && erloese >= 0 && kosten >= 0
        && frei >= 0 && gebunden >= 0 && netto === kassenDelta;
      return { anfang, frei, gebunden, erloese, kosten, netto, kassenDelta, ok };
    }
    const arbeitsGebunden = (id) => Object.entries(vertraege).reduce((sum, [schiffId, v]) => {
      const schiff = state.ships[schiffId];
      if (schiff?.owner !== id || !v.arbeitsKonto) return sum;
      return sum + (state.owners[v.arbeitsKonto]?.cash ?? NaN);
    }, 0);
    const abnahmeGebunden = Object.values(vertraege).reduce((sum, v) =>
      sum + (state.owners[v.konto]?.cash ?? NaN), 0);
    // K1: Eine vom Spieler vorausbezahlte W5n-Arbeitsreserve ist weiterhin
    // SEIN gebundenes Geld, nicht wirtschaftlicher Aufwand vor Lohnleistung.
    const spielerFrachtGebunden = rules.kanon && state.w5n?.frachtauftrag
      && state.ships[state.w5n.frachtauftrag.schiff]?.owner === rules.economy.start.owner
      ? (state.owners.w5n_fracht_arbeit?.cash ?? 0) : 0;
    const haus = saldo('house', arbeitsGebunden('house') + spielerFrachtGebunden);
    const npc = saldo('npc3', arbeitsGebunden('npc3'));
    const station = saldo(cfg.station, abnahmeGebunden);
    const verkauf = saldo(cfg.werftOwner,
      rules.w5 ? state.owners.w5_arbeit_treuhand?.cash ?? 0 : 0);
    const kaeufer = saldo(cfg.exportOwner);
    const minerKaeufe = anzahl(state.ledger.miner, 'consumed');
    const bezahlteHuelle = minerKaeufe * rules.economy.waren.miner.basis;
    const frachterHuelle = rules.w3 ? anzahl(state.ledger.frachter,'consumed')
      * rules.economy.waren.frachter.basis : 0;
    const foerderArbeit = state.ledger.erz.mined * cfg.minerJeMinute;
    const iceLohn=state.w5n?.mineLohn??0;
    // K1: eigener Frachterkauf ist Anlagenkauf, keine unbezahlte Bergbauarbeit.
    const spielerFrachterWert=rules.kanon
      ?(state.kanon?.spielerFrachterKaeufe?.length??0)*rules.economy.waren.frachter.basis:0;
    const belegteArbeit = haus.kosten + npc.kosten - bezahlteHuelle-iceLohn
      -spielerFrachterWert-(state.kanon?.spielerFrachten?.lohn??0)
      -(rules.k7?m_core_w5_transfer.spielerKosten(state,rules):0);
    const fondsId = rules.world.systems[rules.world.stations[cfg.station].system].fonds;
    const fonds = state.owners[fondsId].cash - startCash(fondsId) + m_core_kanon.netto(state, fondsId);
    const stationErz = state.stations[cfg.station].lager.erz;
    const wertUnverkauft = stationErz * cfg.preis; // Nur kalkulatorischer Wert, KEIN Geld.
    const beschaffung = station.kosten;
    const abnahme = station.erloese;
    const ketteOk = [minerKaeufe, bezahlteHuelle, foerderArbeit, belegteArbeit, fonds,
      stationErz, wertUnverkauft, beschaffung, abnahme].every(Number.isSafeInteger)
      && minerKaeufe >= 0 && stationErz >= 0
      && belegteArbeit === foerderArbeit && fonds === foerderArbeit+iceLohn
      && verkauf.erloese === bezahlteHuelle + frachterHuelle
      && beschaffung-(state.w5n?.mineVerkaufWert??0) === (state.ledger.erz.mined
        - Object.values(state.ships).filter(sh => sh.klasse==='miner')
          .reduce((sum, sh) => sum + anzahl(sh.ladung, 'erz'), 0)) * cfg.preis
      && abnahme-(state.w5n?.eisTransferWert??0) === (state.ledger.erz.exported
        + (rules.w3 ? state.w3.geliefert : 0)) * cfg.preis;
    return {
      ok: haus.ok && npc.ok && station.ok && verkauf.ok && kaeufer.ok && ketteOk,
      konzerne: { house: haus, npc3: npc },
      station, verkauf, kaeufer,
      minerKaeufe, bezahlteHuelle, foerderArbeit, belegteArbeit, fonds,
      stationErz, wertUnverkauft, beschaffung, abnahme, ketteOk,
      // Statischer Rechenwert für EIN vollständig bezahltes Schiff, kein Gewinnerhalt-Versprechen.
      amortisationErz: Math.ceil(rules.economy.waren.miner.basis /
        (cfg.preis - cfg.minerJeMinute)),
    };
  }
  return { pruefen };
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
  if (rules.erzpilot) {
    if (rules.w3) m_core_w3.tick(state,rules);
    if(rules.w5n)m_core_w5n.tick(state,rules);
    if (rules.w4) m_core_w4.tick(state,rules);
    if (rules.w5) m_core_w5.tick(state,rules);
    if (rules.w5Transfer) m_core_w5_transfer.tick(state,rules);
    ankunft(state, rules);
    foerderung(state, rules);
    if (state.tick % rules.economy.stunde === 0) {
      m_core_erzpilot.exportiere(state, rules);
      if (rules.erzpilot.npcInvestor) {
        m_core_erzpilot.krisenSteuern(state, rules);
        m_core_erzpilot.npcInvestieren(state, rules);
      }
    }
    return ergebnisse;
  }
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
  if(state.w5ae)zaehle(state.w5ae.inventory);
  const ledger = state.ledger || {};
  const goods = { ok: true, delta: {} };
  for (const w of [...new Set([...ids(ledger), ...ids(ist)])].sort()) {
    const l = ledger[w] || { initial: 0, mined: 0, produced: 0, consumed: 0, imported: 0, exported: 0 };
    const soll = l.initial + l.mined + l.produced + l.imported - l.consumed - l.exported;
    const d = anzahl(ist, w) - soll;
    if (d !== 0) { goods.ok = false; goods.delta[w] = d; }
  }
  const extra = {};
  let finanzierungsOk = true;
  if (state.rulesVersion === m_data_erzpilot.ERZ_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W2_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W3_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W4_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W5_RULES.rulesVersion) {
    const cfg = m_data_erzpilot.ERZ_RULES.erzpilot;
    const start = m_data_erzpilot.ERZ_RULES.owners.find((o) => o.id === cfg.exportOwner).cash;
    const exportiert = state.ledger?.erz?.exported;
    const rest = state.owners?.[cfg.exportOwner]?.cash;
    const ausgegeben = exportiert * cfg.preis;
    const differenz = rest + ausgegeben - start;
    // Ohne belegte Endkunden-Einnahmen darf ein blosses Verschieben vorhandener ISK
    // nicht als wiederkehrend finanziertes Exportgeschaeft gelten.
    finanzierungsOk = Number.isSafeInteger(rest) && rest >= 0
      && Number.isSafeInteger(exportiert) && exportiert >= 0
      && Number.isSafeInteger(ausgegeben) && Number.isSafeInteger(differenz)
      && differenz === 0;
    extra.finanzierung = { ok: finanzierungsOk, start, ausgegeben, rest,
      differenz, exportiert };
  }
  let wirtschaftOk = true;
  if (state.rulesVersion === m_data_erzpilot.ERZ_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W2_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W3_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W4_RULES.rulesVersion
    || state.rulesVersion === m_data_erzpilot.W5_RULES.rulesVersion) {
    const bericht = m_core_w1_vollkosten.pruefen(state,
      state.rulesVersion === m_data_erzpilot.W5_RULES.rulesVersion
        ? m_data_erzpilot.W5_RULES
        : state.rulesVersion === m_data_erzpilot.W4_RULES.rulesVersion
          ? m_data_erzpilot.W4_RULES
        : state.rulesVersion === m_data_erzpilot.W3_RULES.rulesVersion
          ? m_data_erzpilot.W3_RULES : m_data_erzpilot.ERZ_RULES);
    wirtschaftOk = bericht.ok;
    extra.vollkosten = { ok: wirtschaftOk, ketteOk: bericht.ketteOk,
      house: bericht.konzerne.house.ok, npc3: bericht.konzerne.npc3.ok,
      station: bericht.station.ok, werft: bericht.verkauf.ok, kaeufer: bericht.kaeufer.ok };
  }
  let vertragsOk = true;
  if (state.erzpilotVertraege) {
    const errors = {};
    const active = new Set();
    let reservierteMenge = 0;
    for (const id of ids(state.erzpilotVertraege)) {
      const v = state.erzpilotVertraege[id], konto = state.owners[v.konto], sh = state.ships[id];
      if (!sh || !konto || !Number.isSafeInteger(v.menge) || !(v.menge > 0)
        || !Number.isSafeInteger(v.preis) || !(v.preis > 0)
        || konto.cash !== v.menge * v.preis || active.has(v.konto)) {
        errors[id] = 'ungueltige Auftragsbindung';
        continue;
      }
      active.add(v.konto);
      if (v.arbeitsKonto) {
        const arbeit = state.owners[v.arbeitsKonto];
        const kostenJeEinheit = m_data_erzpilot.ERZ_RULES.erzpilot.minerJeMinute;
        const verbleibend = Math.max(0, v.menge - (sh.ladung.erz || 0));
        if (!arbeit || !Number.isSafeInteger(arbeit.cash)
          || arbeit.cash !== verbleibend * kostenJeEinheit
          || active.has(v.arbeitsKonto) || v.arbeitsPreis !== kostenJeEinheit)
          errors[id] = 'ungueltige Arbeitskapitalbindung';
        else active.add(v.arbeitsKonto);
      }
      reservierteMenge += v.menge;
    }
    for (const id of ids(state.owners)) {
      const o = state.owners[id];
      if (o.kind === 'escrow' && o.cash !== 0 && !active.has(id))
        errors[id] = 'Treuhandgeld ohne aktiven Auftrag';
    }
    // Kapazitaet aus der einzigen Core-Preis-/Lagerformel berechnen, nicht duplizieren.
    const cfg = m_data_erzpilot.ERZ_RULES;
    const mengeImLager = state.stations[cfg.erzpilot.station]?.lager?.erz;
    const kapazitaet = m_core_handel.obergrenze(state, cfg, cfg.erzpilot.station, 'erz');
    if (!Number.isSafeInteger(mengeImLager) || mengeImLager < 0
      || mengeImLager + reservierteMenge > kapazitaet)
      errors.lager = 'Auftragsvolumen uebersteigt Lagerkapazitaet';
    vertragsOk = Object.keys(errors).length === 0;
    extra.contracts = { ok: vertragsOk, errors, reserved: reservierteMenge };
  }
  const istW5 = state.rulesVersion === m_data_erzpilot.W5_RULES.rulesVersion;
  const istW4 = state.rulesVersion === m_data_erzpilot.W4_RULES.rulesVersion;
  const w3 = state.rulesVersion === m_data_erzpilot.W3_RULES.rulesVersion
    || istW4 || istW5
    ? m_core_w3.audit(state,istW5 ? m_data_erzpilot.W5_RULES
      : istW4 ? m_data_erzpilot.W4_RULES : m_data_erzpilot.W3_RULES) : null;
  const w4 = istW4 || istW5
    ? m_core_w4.audit(state,istW5 ? m_data_erzpilot.W5_RULES : m_data_erzpilot.W4_RULES) : null;
  const w5 = istW5 ? m_core_w5.audit(state,m_data_erzpilot.W5_RULES) : null;
  const w5transfer = istW5 ? m_core_w5_transfer.audit(state,m_data_erzpilot.W5_RULES) : null;
  const replacement=istW5&&m_data_erzpilot.W5_RULES.w5Replacement
    ?m_core_w5_replacement.audit(state,m_data_erzpilot.W5_RULES):null;
  const water=istW5&&m_data_erzpilot.W5_RULES.w5n
    ?m_core_w5n.audit(state,m_data_erzpilot.W5_RULES):null;
  if(water)extra.water=water;
  const personal=istW5&&m_data_erzpilot.W5_RULES.w5ag
    ?m_core_w5ag.audit(state,m_data_erzpilot.W5_RULES):null;
  if(personal)extra.personal=personal;
  const wageTrade=istW5&&m_data_erzpilot.W5_RULES.w5WageTrade
    ?m_core_w5_wage_trade.audit(state,m_data_erzpilot.W5_RULES):null;
  if(wageTrade)extra.wageTrade=wageTrade;
  if(replacement)extra.replacement=replacement;
  if (w5transfer)extra.w5transfer=w5transfer;
  if (w3) extra.w3=w3;
  if (w4) extra.w4=w4;
  if (w5) extra.w5=w5;
  return { ok: isk.ok && goods.ok && vertragsOk && finanzierungsOk
      && wirtschaftOk && (!w3 || w3.ok) && (!w4 || w4.ok) && (!w5 || w5.ok)
      && (!w5transfer || w5transfer.ok) && (!replacement || replacement.ok)
      && (!wageTrade || wageTrade.ok) && (!water||water.ok)
      &&(!personal||personal.ok),
    total, expected, delta: total - expected, isk, goods, ...extra };
}
return { audit };
})();

const m_core_index = (() => {
const { RULES } = m_data_rules;
const { ERZ_RULES, W2_RULES, W3_RULES, W4_RULES, W5_RULES } = m_data_erzpilot;
const pilotAuftragsStand = (state) => m_core_erzpilot.auftragsStand(state, ERZ_RULES);
const pilotNpcInvestition = (state) => m_core_erzpilot.investitionsPruefung(state, W2_RULES);
const pilotNpcKrisenLage = (state) => m_core_erzpilot.krisenLage(state,
  state.rulesVersion === W5_RULES.rulesVersion ? W5_RULES
    : state.rulesVersion === W4_RULES.rulesVersion ? W4_RULES
      : state.rulesVersion === W3_RULES.rulesVersion ? W3_RULES : W2_RULES);
const pilotWirtschaftsStand = (state) => m_core_w1_vollkosten.pruefen(state,
  state.rulesVersion === W5_RULES.rulesVersion ? W5_RULES
    : state.rulesVersion === W4_RULES.rulesVersion ? W4_RULES
      : state.rulesVersion === W3_RULES.rulesVersion ? W3_RULES : ERZ_RULES);
function createErzState(seed = ERZ_RULES.startSeed, rules = ERZ_RULES) {
  const state = m_core_state.createState(seed, rules);
  // Erz stammt nur aus echter Foerderung, nicht aus vorausgefuellten Zielbestaenden.
  const startErz = state.stations.st_aldera.lager.erz;
  state.stations.st_aldera.lager.erz = 0;
  state.ledger.erz.initial -= startErz;
  state.erzpilotVertraege = {};
  const kauf = m_core_commands.execute(state,
    { type: 'shipBuy', owner: 'npc3', klasse: 'miner', station: 'st_aldera' }, rules);
  if (!kauf.ok) throw new Error('NPC-Erstinvestition fehlgeschlagen: ' + kauf.reason);
  const miner = Object.values(state.ships).find((sh) => sh.owner === 'npc3');
  const abbauen = m_core_commands.execute(state,
    { type: 'shipMine', owner: 'npc3', schiff: miner.id, ware: 'erz' }, rules);
  if (!abbauen.ok) throw new Error('NPC-Erzauftrag fehlgeschlagen: ' + abbauen.reason);
  return state;
}
const createW2State = (seed = W2_RULES.startSeed) => createErzState(seed, W2_RULES);
function createW3State(seed = W3_RULES.startSeed, rules = W3_RULES) {
  const s=createErzState(seed,rules);
  // Keine vorproduzierte W3-Zielware; nur wirkliche Lieferung erzeugt Lager.
  const geschenkt=s.stations.st_nadir.lager.erz;
  s.stations.st_nadir.lager.erz=0;
  s.ledger.erz.initial-=geschenkt;
  s.w3={beauftragt:0,abgeschlossen:0,geliefert:0,kaufAusgaben:0,
    arbeitsKosten:0,frachtUmsatz:0,auftrag:null};
  if(rules.k7){s.w3.storniert=0;s.w3.stornoRueckzahlung=0;}
  return s;
}
function loadErz(json, rules = ERZ_RULES) {
  const s = JSON.parse(json);
  if (!s || s.rulesVersion !== rules.rulesVersion || s.schema !== rules.schema)
    throw new Error('Erzpilot-Spielstand inkompatibel; kein stilles Migrieren');
  const geladen = m_core_serialize.load(json, m_core_serialize.MIGRATIONS, rules.schema, rules.rulesVersion);
  for (const konto of ['house', 'npc3', 'st_aldera', 'fonds_aldera', 'export', 'werft_extern']) {
    if (!Number.isSafeInteger(geladen.owners?.[konto]?.cash) || geladen.owners[konto].cash < 0)
      throw new Error('Erzpilot-Spielstand: ungueltiges Konto ' + konto);
  }
  if (!Number.isSafeInteger(geladen.stations?.st_aldera?.lager?.erz)
    || !Number.isSafeInteger(geladen.stations.st_aldera.lager.miner))
    throw new Error('Erzpilot-Spielstand: ungueltiges Lager');
  if (!m_core_audit.audit(geladen).ok)
    throw new Error('Erzpilot-Spielstand: Geld-, Waren- oder Vertragsbilanz fehlerhaft (Käuferfinanzierung eingeschlossen)');
  return geladen;
}
const loadW2 = (json) => loadErz(json, W2_RULES);
const loadW3 = (json) => loadErz(json, W3_RULES);
function createW4State(seed = W4_RULES.startSeed,rules=W4_RULES) {
  const s=createW3State(seed,rules);
  // Das Material entsteht ausschließlich durch echte Fertigstellung.
  const vorbestand=s.stations.st_nadir.lager.material;
  s.stations.st_nadir.lager.material=0;
  s.ledger.material.initial-=vorbestand;
  s.w4={gebucht:0,gezahlt:0,erzVerbraucht:0,materialErzeugt:0,
    begonnen:0,abgeschlossen:0,auftrag:null};
  return s;
}
const loadW4 = (json) => loadErz(json,W4_RULES);
function createW5State(seed = W5_RULES.startSeed) {
  const s=createW4State(seed,W5_RULES);
  // Fertige Frachter beginnen ausschliesslich als neu PRODUZIERTE Waren.
  const starter=s.stations.st_nadir.lager.frachter;
  s.stations.st_nadir.lager.frachter=0;
  s.ledger.frachter.initial-=starter;
  s.w5={materialUmsatz:0,materialVerbraucht:0,arbeitsGebunden:0,
    arbeitsGezahlt:0,begonnen:0,fertig:0,verkauft:0,schiffIds:[],auftrag:null};
  if(W5_RULES.w5Transfer)s.w5ac={allocated:0,paid:0,active:null,completed:[]};
  if(W5_RULES.w5Replacement)s.w5ad={profile:{...W5_RULES.w5Replacement},
    purchases:[],losses:[],assignments:[],freight:[]};
  if(W5_RULES.w5WageTrade)s.w5ae={purchased:0,spent:0,inventory:{material:0},deals:[]};
  if(W5_RULES.w5ag)s.w5ag={
    paid:{erz:0,eis:0},payments:[],iceContracts:[]};
  if(W5_RULES.w5n){
    // Nonzero target is capacity only; initial goods are zero.
    for(const st of Object.values(s.stations))
      for(const ware of ['eis','wasser'])
        if(Object.hasOwn(st.lager,ware)){
          s.ledger[ware].initial-=st.lager[ware];st.lager[ware]=0;
        }
    s.w5n={eisAbgebaut:0,mineMinuten:0,mineLohn:0,mineVerkauft:0,
      mineVerkaufWert:0,eisTransferWert:0,frachtBeauftragt:0,
      frachtAbgeschlossen:0,eisGeliefert:0,kaufAusgaben:0,
      frachtLohn:0,frachtUmsatz:0,fabrikBegonnen:0,fabrikFertig:0,
      fabrikGebucht:0,fabrikBezahlt:0,eisVerbraucht:0,wasserProduziert:0,
      wasserVerbraucht:0,wasserErlos:0,knappheitsStunden:0,
      frachtauftrag:null,fabrikauftrag:null,kaufDeals:[]};
  }
  return s;
}
const loadW5 = (json) => loadErz(json,W5_RULES);
const industryOrePrebook=(s,carrierId,minerId)=>m_core_w3.vorbestellen(s,W5_RULES,carrierId,minerId);
const industryOreCancel=(s)=>m_core_w3.stornierenVorArbeit(s,W5_RULES);
const pilotW3Stand = (state) => m_core_w3.audit(state,
  state.rulesVersion===W5_RULES.rulesVersion?W5_RULES:
    state.rulesVersion===W4_RULES.rulesVersion?W4_RULES:W3_RULES);
const pilotW3Kalkulation = (state, schiff) => m_core_w3.pruefen(state,
  state.rulesVersion===W5_RULES.rulesVersion?W5_RULES:
    state.rulesVersion===W4_RULES.rulesVersion?W4_RULES:W3_RULES,state.ships[schiff]);
const pilotW4Stand = (state) => m_core_w4.audit(state,
  state.rulesVersion===W5_RULES.rulesVersion?W5_RULES:W4_RULES);
const pilotW4Kalkulation = (state) => m_core_w4.pruefen(state,
  state.rulesVersion===W5_RULES.rulesVersion?W5_RULES:W4_RULES,
  W4_RULES.w4.station,W4_RULES.w4.station);
const pilotW5Stand = (state) => m_core_w5.audit(state,W5_RULES);
const pilotW5Kalkulation = (state) => m_core_w5.pruefen(state,W5_RULES,
  W5_RULES.w5.werft,W5_RULES.w5.station);
const pilotW5Verkauf = (state) => m_core_w5.verkaufPruefen(state,W5_RULES);
const pilotW5TransferStand = (state) => m_core_w5_transfer.audit(state,W5_RULES);
const pilotW5TransferKalkulation = (state,shipId) => m_core_w5_transfer.pruefen(state,W5_RULES,state.ships[shipId]);
const pilotWageTradeStand=state=>m_core_w5_wage_trade.audit(state,W5_RULES);
const pilotWageTradeQuote=(state,menge=1)=>m_core_w5_wage_trade.pruefen(state,W5_RULES,'fonds_transport',menge);
const pilotWaterStand=state=>m_core_w5n.audit(state,W5_RULES);
const pilotWaterQuote=(state,menge=1)=>m_core_w5n.pruefenKonsum(state,W5_RULES,'fonds_transport',menge);
const pilotIceFreightQuote=(state,id)=>m_core_w5n.pruefenFracht(state,W5_RULES,state.ships[id]);
const pilotWaterFactoryQuote=state=>m_core_w5n.pruefenWasser(state,W5_RULES,'st_nadir','st_nadir');
const pilotPrivateWageStand=state=>m_core_w5ag.audit(state,W5_RULES);
const pilotPrivateWaterQuote=(state,id,menge=1)=>m_core_w5n.pruefenKonsum(state,W5_RULES,id,menge);
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
return { hash, hashString, canonical, save, migrate, MIGRATIONS, RULE_MIGRATIONS, audit, protokolliere, rngNext, rngInt, div, faktorFormel, preisFormel, handel, verkaufbar, aufnehmbar, reserve, obergrenze, stationspreis, gebuehr, route, verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag, reise, kampf, patrouille, ueberfall, piratenErsatz, ersatzkauf, zuschuss, CURRENT_SCHEMA: RULES.schema, ERZ_RULES, W2_RULES, W3_RULES, W4_RULES, W5_RULES,
  pilotAuftragsStand, pilotWirtschaftsStand, pilotNpcInvestition, pilotNpcKrisenLage,
  industryOrePrebook,industryOreCancel,
  pilotW3Stand, pilotW3Kalkulation, pilotW4Stand, pilotW4Kalkulation,
  pilotW5Stand, pilotW5Kalkulation, pilotW5Verkauf,
  pilotW5TransferStand, pilotW5TransferKalkulation,
  pilotWageTradeStand,pilotWageTradeQuote,
  pilotWaterStand,pilotWaterQuote,pilotIceFreightQuote,pilotWaterFactoryQuote,
  pilotPrivateWageStand,pilotPrivateWaterQuote,
  replacementQuote:(s,id,reserve=0)=>m_core_w5_replacement.quote(s,W5_RULES,
    W5_RULES.w3.spedition,id,reserve),
  createErzState, createW2State, createW3State, createW4State, createW5State,
  loadErz, loadW2, loadW3, loadW4, loadW5, createState, submit, execute, step, advance, load, preis, faktor };
})();


const api=Object.freeze({core:m_core_index,rules:m_data_erzpilot.W5_RULES,
  createResearch:options=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options))throw TypeError('W5ad-Parameterobjekt erforderlich');
    if(Object.hasOwn(options,'wageTrade'))throw TypeError('W5ad-Profil mischt keine W5ae-Vertraege');
    return createEngine({},options);
  },
  createWageResearch:options=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.hasOwn(options,'wageTrade'))
      throw TypeError('W5ae-Parameter: nur Herkunftsverteilung, keine Regel-Flags');
    return createEngine({},{...options,wageTrade:true});
  },
  createWaterResearch:options=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.hasOwn(options,'wageTrade')||Object.hasOwn(options,'waterTrade'))
      throw TypeError('W5af-Parameter: nur Kapitalverteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true});
  },
  createPrivateWageResearch:options=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.keys(options).some(k=>!['carrierCash','buyerCash'].includes(k)))
      throw TypeError('W5ag: nur eigene Anfangskapital-Verteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true,personalWages:true});
  },
  // K1 / Regel 199: derselbe Kern mit Ortsprüfung und Netto-Korrektur. Die
  // Ortsfunktionen stammen aus dem Flugkern; Regel195 bleibt davon unberührt.
  createKanonWelt:(options,ort)=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.keys(options).some(k=>!['carrierCash','buyerCash'].includes(k)))
      throw TypeError('K1: nur eigene Anfangskapital-Verteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true,
      personalWages:true,kanon:true,ort});
  },
  // K7: getrennte Forschungsregel200, keine Rule199-Migration/Produktänderung.
  createJ3Welt:(options,ort)=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.keys(options).some(k=>!['carrierCash','buyerCash'].includes(k)))
      throw TypeError('J3: nur originale Kapitalverteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true,
      personalWages:true,kanon:true,industryOre:true,
      silizium:true,bauteile:true,ort});
  },
  createJ2bWelt:(options,ort)=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.keys(options).some(k=>!['carrierCash','buyerCash'].includes(k)))
      throw TypeError('J2b: nur nachweisbare Anfangskapitalverteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true,
      personalWages:true,kanon:true,industryOre:true,silizium:true,ort});
  },
  createK7Welt:(options,ort)=>{
    if(options==null)options={};
    if(typeof options!=='object'||Array.isArray(options)
      ||Object.keys(options).some(k=>!['carrierCash','buyerCash'].includes(k)))
      throw TypeError('K7: nur eigene Anfangskapital-Verteilung');
    return createEngine({},{...options,wageTrade:true,waterTrade:true,
      personalWages:true,kanon:true,industryOre:true,ort});
  }});
if(research)return api;
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5acK7=api;
})(globalThis);
