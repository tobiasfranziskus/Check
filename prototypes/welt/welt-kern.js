/* Aphros Void · Kanonische Welt K1 [DRAFT / Forschungsregel 199, nicht im Produkt].
 *
 * EIN Zustand, EIN Tick, EIN Zufallszustand, EIN Speicherformat:
 *   - Wirtschaft: isolierter K1/K7-Forschungsquellstand (prototypes/welt/rule200-k7-industry-core.js),
 *     als Profil 199 bzw. 200 mit Ortsprüfung; die produktive Regel195-Quelle bleibt unberührt.
 *   - Flug: prototypes/flug2d/flug-kern.js (m_data_flug/m_core_flug), 60 Teilschritte je Minute.
 *   - K1-Zusatzbuchungen: ausschließlich gepaarte, belegte Transfers vorhandener ISK.
 *
 * Keine zweite Welt, kein zweiter Wirtschaftstakt, kein Math.random, keine Uhrzeit, kein DOM.
 * Alle Zahlen unter m_data_kanon sind Forschungsparameter [OPTION], keine Balancingfreigabe.
 */
(function (scope) {
'use strict';
const NODE = typeof module === 'object' && module.exports;
const FACTORY = NODE ? require('./rule200-k7-industry-core.js') : scope.W5acK7;
const FLUG = NODE ? require('../flug2d/flug-kern.js') : scope.FlugKern;
const J2B = NODE ? require('./j2b-silizium-core.js') : scope.J2bSilizium;
const J3 = NODE ? require('./j3-bauteil-core.js') : scope.J3Bauteile;
if (!FACTORY || typeof FACTORY.createKanonWelt !== 'function' || !FLUG || typeof FLUG.schritt !== 'function')
  throw Error('K1 benötigt den gemeinsamen Wirtschaftskern (Profil 199) und den Flugkern');

const m_data_kanon = (() => {
  function tiefFrieren(obj) {
    if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    for (const k of Object.keys(obj)) tiefFrieren(obj[k]);
    return obj;
  }
  const KANON = tiefFrieren({
    profil: 'K1', regel: 199, schema: 8, modell: 1,
    // Flugarbeit des Miners: jede Dienstminute außerhalb des Docks ohne Förderlohn kostet
    // den Eigentümer 1 ISK an den eigenen Piloten. Reserve wird vor dem Abdocken gebunden.
    flug: { lohnJeMinute: 1, reserveMinuten: 40, nachschussUnter: 5 },
    // F6 [DRAFT/OPTION]: Sichtbares, physisch anzufliegendes Abflugtor in Aldera.
    // Kein kostenloser Systemwechsel: erst bezahlter 2D-Anflug, physische
    // Geschwindigkeitsprüfung und Rückdockung erlauben den OPTIONALEN Torvertrag.
    tor: { x: 576000, y: -288000, radius: 64000, tempo: 192 },
    // Wasser: Nadir verkauft zum bestehenden Regel195-Preis. Aldera erhält Wasser nur als
    // bezahlte Rückfracht des Eisfrachters und verkauft mit Einzelhandelsaufschlag.
    wasser: { preisAldera: 16, rueckfrachtJeEinheit: 1, lagerAldera: 100 },
    // Nutzungsabhängiger Wertverzehr in Milli-ISK je aktiver Minute (Referenzmodell: D = 0,30).
    verschleiss: { milliJeMinute: { miner: 300, frachter: 300 } },
    // Haushalte kaufen nur am Wohnort. Lohnkonten des Kerns sind je ein Haushalt.
    haushalte: {
      fonds_aldera: 'st_aldera', pilot_erz: 'st_aldera', pilot_eis: 'st_aldera',
      w5ac_transfer_pilot: 'st_aldera', pilot_house: 'st_aldera', pilot_npc3: 'st_aldera',
      eigner_house: 'st_aldera', eigner_npc3: 'st_aldera', eigner_transport: 'st_aldera',
      eigner_st_aldera: 'st_aldera',
      w5n_arbeit: 'st_nadir', arbeitskraefte_nadir: 'st_nadir', arbeiter_werft_nadir: 'st_nadir',
      eigner_st_nadir: 'st_nadir', eigner_werft: 'st_nadir',
    },
    // Je Firma genau ein eingetragener Eigentümerhaushalt (Forschungsannahme).
    anteile: {
      house: 'eigner_house', npc3: 'eigner_npc3', transport: 'eigner_transport',
      st_aldera: 'eigner_st_aldera', st_nadir: 'eigner_st_nadir', werft_extern: 'eigner_werft',
    },
    piloten: { house: 'pilot_house', npc3: 'pilot_npc3' },
    neueKonten: [
      { id: 'pilot_house', kind: 'haushalt' }, { id: 'pilot_npc3', kind: 'haushalt' },
      { id: 'eigner_house', kind: 'haushalt' }, { id: 'eigner_npc3', kind: 'haushalt' },
      { id: 'eigner_transport', kind: 'haushalt' }, { id: 'eigner_st_aldera', kind: 'haushalt' },
      { id: 'eigner_st_nadir', kind: 'haushalt' }, { id: 'eigner_werft', kind: 'haushalt' },
      { id: 'k1_rueckfracht', kind: 'k1-reserve' },
    ],
    // Verhalten der NPC-Akteure. Wird im Zustand gespeichert; Szenarien ändern nur diese Werte.
    politik: {
      automatik: true,
      // ‰ des Einkommens, das ein Haushalt nie ausgibt. Die Privatkonten des Spielers geben von
      // sich aus nichts aus: über sein Geld entscheidet nur der Spieler (Sparfreiheit).
      sparquote: { eigner_house: 1000, pilot_house: 1000 }, sparquoteStandard: 0,
      bedarfJeTag: 0,                                // 0 = kein Sättigungsdeckel je Haushalt
      ausschuettung: { house: 0, npc3: 1000, transport: 1000, st_aldera: 1000, st_nadir: 1000, werft_extern: 1000 },
      betriebsreserve: { house: 250, npc3: 250, transport: 250, st_aldera: 1100, st_nadir: 700, werft_extern: 530 },
      // Nachfragegeführt: Wasserwerk bis kurz unter die Lagergrenze, Aldera bis zum Lagerziel,
      // Eis-Pendel startet nur, wenn in Aldera keine unverschiffte Charge mehr liegt.
      wasserZielAldera: 100, wasserwerkBis: 115, eisPufferAldera: 50,
      einkaufMinuten: 60, dividendeMinuten: 1440,
      stilllegung: false, ersatzkauf: true, spielerErsatz: false, ersatzVorlaufProzent: 40, werftVorrat: 0,
      eisfracht: true, wasserwerk: true, rueckfracht: true,
      gruendung: true, // NPC-Spedition kauft ihre erste Hülle selbst aus eigenem Kapital
    },
  });
  return { KANON, tiefFrieren };
})();

function erstellen(startkapital = {}, k7 = false, silizium = false, bauteile = false) {
  const { KANON } = m_data_kanon;
  const ort = Object.freeze({
    imFeld: (sh, ware) => FLUG.imFeld(sh, ware),
    angedocktAn: (sh, station) => FLUG.angedocktAn(sh, station),
  });
  // Ein Forschungsquellstand für K1 (Regel199) oder explizit K7 (Regel200).
  // Niemals die produktive Regel195-Einzeldatei überschreiben.
  const engine = k7 ? (bauteile ? FACTORY.createJ3Welt(startkapital,ort) :
    silizium ? FACTORY.createJ2bWelt(startkapital, ort)
    : FACTORY.createK7Welt(startkapital, ort)) : FACTORY.createKanonWelt(startkapital, ort);
  const kern = engine.core, rules = engine.rules;
  if (rules.rulesVersion !== (bauteile ? 202 : silizium ? 201 : k7 ? 200 : KANON.regel) || rules.schema !== KANON.schema || !rules.kanon || !rules.w5n || !rules.w5ag)
    throw Error('K1: unerwartetes Kernprofil');
  const N = FLUG.DATEN.schritteJeMinute;
  const W = rules.w5n;
  // K7-Preise ausschließlich aus den Original-W1/W3/W5-Regeln ableiten,
  // keine zweite Tarif-/Balancingtabelle für den Forschungsauftrag.
  const K7_PREIS = k7 ? Object.freeze({
    menge: rules.w3.fracht,
    bergbau: rules.w3.fracht * rules.erzpilot.minerJeMinute,
    alderakauf: rules.w3.fracht * rules.erzpilot.preis,
    nadiraufwand: rules.w3.fracht * rules.erzpilot.preis
      + 2 * W.flugMinuten * rules.w3.frachtgebuehrJeMinute,
    frachtlohn: 2 * W.flugMinuten * rules.w3.arbeitJeMinute,
    werft: rules.w5.material * rules.w5.materialPreis
      + rules.w5.dauer * rules.w5.lohnJeMinute,
  }) : null;
  const ids = (obj) => Object.keys(obj).sort();
  const ganz = (n) => Number.isSafeInteger(n) && n >= 0;
  const hat = (obj, k) => Object.hasOwn(obj, k);
  const preisVon = (station) => (station === W.zielStation ? W.wasserPreis : KANON.wasser.preisAldera);
  const kaufpreis = (klasse) => rules.economy.waren[klasse].basis;
  const startCash = (id) => rules.owners.find((o) => o.id === id)?.cash ?? 0;
  const ladungSumme = (sh) => Object.values(sh.ladung).reduce((n, x) => n + x, 0);

  // ---------------------------------------------------------------- m_core_buch
  // Einziger Weg für K1-Geld: gepaarter Transfer vorhandener ISK mit benannter Art.
  const m_core_buch = (() => {
    function transfer(state, von, an, betrag, art) {
      const o = state.owners, k = state.kanon;
      if (!ganz(betrag) || betrag === 0 || von === an || !o[von] || !o[an] || typeof art !== 'string' || art.includes('|'))
        throw Error('K1-Buch: ungültige Buchung ' + art);
      if (o[von].cash < betrag) throw Error('K1-Buch: ungedeckte Buchung ' + art + ' von ' + von);
      o[von].cash -= betrag; o[an].cash += betrag;
      k.netto[von] = (k.netto[von] || 0) + betrag;
      k.netto[an] = (k.netto[an] || 0) - betrag;
      const key = art + '|' + von + '|' + an;
      k.buch.summen[key] = (k.buch.summen[key] || 0) + betrag;
      k.buch.belege += 1;
    }
    const summe = (state, art, filter = null) => {
      let n = 0;
      for (const key of Object.keys(state.kanon.buch.summen)) {
        const [a, von, an] = key.split('|');
        if (a === art && (!filter || filter(von, an))) n += state.kanon.buch.summen[key];
      }
      return n;
    };
    function audit(state) {
      const k = state.kanon, soll = {};
      let ok = ganz(k.buch.belege);
      for (const key of Object.keys(k.buch.summen)) {
        const teile = key.split('|'), betrag = k.buch.summen[key];
        if (teile.length !== 3 || !ganz(betrag) || betrag === 0 || !state.owners[teile[1]] || !state.owners[teile[2]]) ok = false;
        soll[teile[1]] = (soll[teile[1]] || 0) + betrag;
        soll[teile[2]] = (soll[teile[2]] || 0) - betrag;
      }
      let saldo = 0;
      for (const id of new Set([...Object.keys(soll), ...Object.keys(k.netto)])) {
        if ((soll[id] || 0) !== (k.netto[id] || 0) || !Number.isSafeInteger(k.netto[id] ?? 0)) ok = false;
        saldo += k.netto[id] || 0;
      }
      return ok && saldo === 0;
    }
    return { transfer, summe, audit };
  })();

  // -------------------------------------------------------------- m_core_anlage
  // Nutzungsabhängiger Wertverzehr. Rücklage ist gebundenes Eigengeld, kein Transfer.
  const m_core_anlage = (() => {
    const aktiv = (state, id) => state.kanon.verschleiss[id] || 0;
    const abschreibung = (state, sh) => Math.min(kaufpreis(sh.klasse),
      Math.floor(aktiv(state, sh.id) * KANON.verschleiss.milliJeMinute[sh.klasse] / 1000));
    const buchwert = (state, sh) => kaufpreis(sh.klasse) - abschreibung(state, sh);
    const verbraucht = (state, sh) => buchwert(state, sh) === 0;
    const stillgelegt = (state, sh) => state.kanon.politik.stilllegung === true && verbraucht(state, sh);
    const huellen = (state, owner) => ids(state.ships).map((id) => state.ships[id])
      .filter((sh) => sh.owner === owner && hat(KANON.verschleiss.milliJeMinute, sh.klasse));
    const anlagewert = (state, owner) => huellen(state, owner).reduce((n, sh) => n + buchwert(state, sh), 0);
    const ruecklage = (state, owner) => huellen(state, owner).reduce((n, sh) => n + abschreibung(state, sh), 0);
    return { aktiv, abschreibung, buchwert, verbraucht, stillgelegt, huellen, anlagewert, ruecklage };
  })();

  // ---------------------------------------------------------------- m_core_flugplan
  // Flugdienst (Reserve, Lohn) und Brücke Auftrag -> Sollort. Kein eigener Integrator.
  const m_core_flugplan = (() => {
    const station = (sh) => FLUG.DATEN.systeme[sh.system].station.id;
    const dienstKonto = (id) => 'k1_flug_' + id;
    function koerperSync(state) {
      for (const id of ids(state.ships)) {
        const sh = state.ships[id];
        if (!hat(FLUG.DATEN.klassen, sh.klasse) || !hat(FLUG.DATEN.systeme, sh.system)) continue;
        if (sh.flug === undefined) {
          if (sh.phase !== 'dock') throw Error('K1: neues Schiff ohne Dockzustand ' + id);
          sh.flug = FLUG.koerperAngedockt(sh.system);
        }
        const b = sh.flug;
        if (sh.phase === 'reise' && b.lage !== 'transit') {
          if (b.lage !== 'angedockt') throw Error('K1: Transit nur aus dem Dock ' + id);
          sh.flug = { ...FLUG.koerperAngedockt(sh.system), lage: 'transit', anker: null };
        } else if (sh.phase !== 'reise' && b.lage === 'transit') {
          sh.flug = FLUG.koerperAngedockt(sh.system);
        }
      }
    }
    // Ruhender Körper: 60 Teilschritte verändern ihn nachweislich nicht (siehe Test).
    function ruht(sh) {
      const b = sh.flug;
      if (!b || b.lage === 'angedockt') return true;
      // Transit ohne manuelle Bewegung bleibt wie bisher ein günstiger Core-Minutenlauf.
      // Bei echtem Korridormanöver darf der 60-Schritte-Integrator nie übersprungen werden.
      if (b.lage === 'transit') return b.modus !== 'hand'
        || (b.vx===0 && b.vy===0 && b.sollFahrt===0 && b.kurs===b.sollKurs);
      if (b.lage !== 'frei' || b.vx !== 0 || b.vy !== 0 || b.sollFahrt !== 0 || b.kurs !== b.sollKurs || b.andocken) return false;
      if (b.modus !== 'anflug' || !b.ziel) return true;
      if (b.ziel.art !== 'feld') return false;
      const f = FLUG.DATEN.systeme[sh.system].felder.find((x) => x.id === b.ziel.id);
      const dx = f.x - b.x, dy = f.y - b.y, halt = f.radius >> 1;
      return dx * dx + dy * dy <= halt * halt;
    }
    const alleRuhend = (state) => ids(state.ships).every((id) => ruht(state.ships[id]));

    // K1-Spielerfrachter: ein gekauftes, unbeladenes Schiff am Aldera-Dock,
    // ohne Frachtvertrag. NPC-Frachter und laufende W3-Transporte bleiben strikt im Transit.
    const spielerFrachter = (state, sh) => sh.klasse === 'frachter'
      && sh.owner === rules.economy.start.owner && sh.system === 'aldera'
      && sh.phase === 'dock' && sh.auftrag === 'halten'
      && ladungSumme(sh) === 0
      && ![state.w3?.auftrag?.schiff, state.w5n?.frachtauftrag?.schiff,
        state.w5ac?.active?.id, state.kanon?.rueckfracht?.schiff].includes(sh.id);
    function abdockenPruefen(state, sh) {
      if (sh.klasse !== 'miner' && !spielerFrachter(state, sh))
        return 'K1: nur Miner oder eigene freie Aldera-Frachter dürfen im System abdocken';
      if (m_core_anlage.stillgelegt(state, sh)) return 'K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen';
      const pilot = KANON.piloten[sh.owner];
      if (!pilot || !state.owners[pilot]) return 'K1: kein Pilotenkonto für diesen Eigentümer';
      const reserve = KANON.flug.reserveMinuten * KANON.flug.lohnJeMinute;
      const laufend = state.kanon.flugdienst[sh.id] ? state.owners[dienstKonto(sh.id)].cash : 0;
      if (state.owners[sh.owner].cash + laufend < reserve) return 'K1: Flugarbeit nicht vorfinanziert (' + reserve + ' ISK Reserve)';
      return null;
    }
    function befehl(state, cmd, intern) {
      const sh = state.ships[cmd && cmd.schiff];
      if (!sh || !sh.flug) return { ok: false, type: cmd && cmd.type, reason: 'unbekanntes Schiff' };
      if (!intern && hat(state.kanon.pendel, sh.id))
        return { ok: false, type: cmd.type, reason: 'K1: laufender Pendelauftrag steuert Flug und Andocken' };
      // Ein bereits voll finanziertes F4-Frachtgeschäft kann im Original-W5n-
      // Korridor physisch gesteuert werden. Keine weiteren Flug-/Dockbefehle,
      // keine fremden Schiffe, kein neuer Vertrag und keine Zusatzlohnreserve.
      const transitSteuerung = cmd.type === 'shipSteer' && sh.klasse === 'frachter'
        && sh.owner === rules.economy.start.owner && sh.flug.lage === 'transit'
        && ((state.w5n?.frachtauftrag?.schiff === sh.id
          && state.kanon.spielerFrachten?.auftraege?.some(x => x.schiff === sh.id && x.end === null))
          || (k7 && state.w5ac?.active?.id === sh.id && state.w5ac.active.owner === sh.owner));
      if (sh.klasse !== 'miner' && !spielerFrachter(state, sh) && !transitSteuerung)
        return { ok: false, type: cmd.type, reason: 'K1: nur Miner oder eigene freie Aldera-Frachter fliegen im System frei' };
      const vor = FLUG.pruefen(state, cmd);
      if (vor) return { ok: false, type: cmd.type, reason: vor };
      if (cmd.type === 'shipUndock') {
        const grund = abdockenPruefen(state, sh);
        if (grund) return { ok: false, type: cmd.type, reason: grund };
        // Ein in derselben Minute beendeter Dienst läuft weiter; sonst neue Reserve binden.
        if (!state.kanon.flugdienst[sh.id]) {
          const konto = dienstKonto(sh.id);
          if (!state.owners[konto]) state.owners[konto] = { id: konto, kind: 'k1-reserve', cash: 0 };
          if (state.owners[konto].cash !== 0) throw Error('K1: doppelte Flugreserve ' + sh.id);
          m_core_buch.transfer(state, sh.owner, konto, KANON.flug.reserveMinuten * KANON.flug.lohnJeMinute, 'flugreserve');
          state.kanon.flugdienst[sh.id] = { konto, minuten: 0 };
        }
      } else if (state.kanon.flugdienst[sh.id]?.gestrandet) {
        return { ok: false, type: cmd.type, reason: 'K1: Flugarbeit nicht finanziert; Schiff wartet auf Kapital' };
      }
      return FLUG.ausfuehren(state, cmd);
    }
    // Abrechnung einer Wirtschaftsminute: Lohn, Nachschuss, Stranden, Rückgabe am Dock.
    function minutenAbrechnung(state, gefoerdert) {
      const k = state.kanon, lohn = KANON.flug.lohnJeMinute;
      for (const id of ids(k.flugdienst)) {
        const d = k.flugdienst[id], sh = state.ships[id], konto = state.owners[d.konto];
        if (!sh) throw Error('K1: Flugdienst ohne Schiff ' + id);
        const nachschuss = () => {
          if (konto.cash >= lohn + KANON.flug.nachschussUnter * lohn) return;
          const nach = Math.min(state.owners[sh.owner].cash, KANON.flug.reserveMinuten * lohn - konto.cash);
          if (nach > 0) m_core_buch.transfer(state, sh.owner, d.konto, nach, 'flugreserve');
        };
        if (d.gestrandet) {
          // Stillstand ohne Lohnanspruch; Weiterflug erst, wenn wieder eine Minute gedeckt ist.
          nachschuss();
          if (konto.cash >= lohn) delete d.gestrandet;
        } else {
          k.verschleiss[id] = (k.verschleiss[id] || 0) + 1;
          // Förderminute: Arbeit ist bereits über den Bergbaulohn des Kerns bezahlt.
          if (!gefoerdert[id]) {
            if (konto.cash < lohn) throw Error('K1: unbezahlte Flugminute ' + id);
            m_core_buch.transfer(state, d.konto, KANON.piloten[sh.owner], lohn, 'fluglohn');
            d.minuten += 1; k.fluglohnMinuten += 1;
          }
        }
        if (sh.flug.lage === 'angedockt') {
          if (konto.cash > 0) m_core_buch.transfer(state, d.konto, sh.owner, konto.cash, 'flugreserve-rueck');
          delete k.flugdienst[id];
          continue;
        }
        if (d.gestrandet) continue;
        nachschuss();
        if (konto.cash < lohn) {
          // Keine unbezahlte Arbeit: Antrieb aus, bevor eine ungedeckte Minute beginnt.
          const b = sh.flug;
          b.modus = 'halt'; b.sollFahrt = 0; b.sollKurs = b.kurs; b.ziel = null; b.andocken = false;
          d.gestrandet = true;
          k.engpass = merke(k.engpass, state.tick, 'Flugarbeit nicht finanziert: ' + sh.owner);
        }
      }
    }
    // Sollort aus dem bestehenden Auftrag; nur für Schiffe mit Pendelauftrag (Automatik).
    // dock: Handlungen am Dock (Verkauf, neuer Auftrag, Abdocken) nur an Minutengrenzen.
    // zaehlen: Engpässe genau einmal je Wirtschaftsminute festhalten.
    function plan(state, dock, zaehlen) {
      const k = state.kanon;
      const merken = (grund) => { if (zaehlen) k.engpass = merke(k.engpass, state.tick, grund); };
      for (const id of ids(k.pendel)) {
        const sh = state.ships[id], b = sh.flug, p = k.pendel[id];
        if (m_core_anlage.stillgelegt(state, sh) && sh.auftrag === 'foerdern')
          kern.execute(state, { type: 'shipWait', owner: sh.owner, schiff: id }, rules);
        if (b.lage === 'andocken' || b.lage === 'abdocken' || b.lage === 'transit') continue;
        if (b.lage === 'angedockt' && !dock) continue;
        if (k.flugdienst[id]?.gestrandet) continue;
        const voll = () => {
          const vertrag = state.erzpilotVertraege?.[id];
          return ladungSumme(sh) >= rules.economy.cargo
            || (p.ware === 'eis' && (sh.ladung.eis || 0) >= W.charge)
            || (p.ware === 'erz' && !!vertrag && (sh.ladung.erz || 0) >= vertrag.menge);
        };
        if (p.beenden && sh.auftrag === 'foerdern')
          kern.execute(state, { type: 'shipWait', owner: sh.owner, schiff: id }, rules);
        if (b.lage === 'angedockt') {
          if (p.beenden && (p.ware !== 'eis' || !(sh.ladung.eis > 0))) { delete k.pendel[id]; continue; }
          if (p.ware === 'eis' && (sh.ladung.eis || 0) > 0) {
            // Verkauf ausschließlich am Dock über den Originalbefehl; scheitert er, bleibt die Ware an Bord.
            const r = kern.execute(state, { type: 'shipSellIce', owner: sh.owner, schiff: id, menge: sh.ladung.eis }, rules);
            if (!r.ok) { merken('Eisabnahme Aldera: ' + r.reason); continue; }
          }
          if (ladungSumme(sh) > 0 && p.ware === 'eis') continue;
          if (p.beenden) { delete k.pendel[id]; continue; }
          if (m_core_anlage.stillgelegt(state, sh)) continue; // Pendel merken, bis ein echter Ersatzkauf erfolgreich ist
          if (p.ware === 'erz' && p.ersatz && sh.auftrag !== 'foerdern') {
            const r = kern.execute(state, { type: 'shipMine', owner: sh.owner, schiff: id, ware: 'erz' }, rules);
            if (!r.ok) { merken('Erz-Ersatzauftrag: ' + r.reason); continue; }
            delete p.ersatz;
          }
          if (p.ware === 'eis' && sh.auftrag !== 'foerdern') {
            if (state.owners[sh.owner].cash < W.charge * W.mineLohn + KANON.flug.reserveMinuten) {
              merken('Bergbau nicht vorfinanziert: ' + sh.owner); continue;
            }
            if ((state.stations[W.quellStation].lager.eis || 0) >= k.politik.eisPufferAldera) continue; // Absatz abwarten, kostenfrei im Dock
            if (state.owners[W.quellStation].cash < W.charge * W.eisPreis) {
              merken('Aldera kann nächste Eischarge nicht bezahlen'); continue;
            }
            const r = kern.execute(state, { type: 'shipMine', owner: sh.owner, schiff: id, ware: 'eis' }, rules);
            if (!r.ok) continue;
          }
          if (sh.auftrag === 'foerdern' && !voll()) {
            const r = befehl(state, { type: 'shipUndock', owner: sh.owner, schiff: id }, true);
            if (!r.ok) merken(r.reason);
          }
          continue;
        }
        // im freien Flug
        if (p.ware === 'eis' && voll() && sh.auftrag === 'foerdern')
          kern.execute(state, { type: 'shipWait', owner: sh.owner, schiff: id }, rules);
        const zumDock = m_core_anlage.stillgelegt(state, sh) || voll() || sh.auftrag !== 'foerdern';
        const r = FLUG.fuehreZu(state, sh, zumDock
          ? { art: 'station', id: station(sh) } : { art: 'feld', id: sh.system + ':' + p.ware });
        if (r && !r.ok) throw Error('K1-Flugplan: ' + r.reason);
      }
    }
    return { koerperSync, ruht, alleRuhend, befehl, minutenAbrechnung, plan, dienstKonto, station };
  })();

  function merke(engpass, tick, grund) {
    const e = engpass || { erster: null, zaehler: {} };
    if (!e.erster) e.erster = { tick, grund };
    e.zaehler[grund] = (e.zaehler[grund] || 0) + 1;
    return e;
  }

  // -------------------------------------------------------------- m_core_kreislauf
  // K1-Befehle: Haushaltskauf am Wohnort, Wasser-Rückfracht, Ausschüttung, Pendelauftrag.
  const m_core_kreislauf = (() => {
    const BEFEHLE = Object.freeze({
      householdBuy: ['menge'], dividendPay: ['betrag'],
      shipShuttle: ['schiff', 'ware'], shipShuttleStop: ['schiff'],
    });
    const einkommen = (state, id) => state.owners[id].cash + (state.kanon.haushalte[id]?.ausgegeben || 0);
    function verfuegbar(state, id) {
      const p = state.kanon.politik;
      const quote = hat(p.sparquote, id) ? p.sparquote[id] : p.sparquoteStandard;
      const gebunden = Math.floor(einkommen(state, id) * quote / 1000);
      return Math.max(0, state.owners[id].cash - gebunden);
    }
    function ausschuettbar(state, firma) {
      const o = state.owners[firma];
      if (!o || !hat(KANON.anteile, firma)) return 0;
      const reserve = state.kanon.politik.betriebsreserve[firma] || 0;
      const eigenkapital = o.cash + m_core_anlage.anlagewert(state, firma);
      // Nur realisierter Überschuss über dem eingebrachten Kapital und nie die Ersatzrücklage.
      return Math.max(0, Math.min(o.cash - reserve - m_core_anlage.ruecklage(state, firma),
        eigenkapital - startCash(firma)));
    }
    function pruefen(state, cmd) {
      if (cmd === null || typeof cmd !== 'object' || Array.isArray(cmd)) return 'Befehl ist kein Objekt';
      if (!hat(BEFEHLE, cmd.type)) return 'unbekannter K1-Befehl';
      const erlaubt = new Set(['type', 'owner', ...BEFEHLE[cmd.type]]);
      for (const key of Object.keys(cmd)) if (!erlaubt.has(key)) return 'unerlaubtes Feld: ' + key;
      if (typeof cmd.owner !== 'string' || !state.owners[cmd.owner]) return 'unbekannter Besitzer';
      if (cmd.type === 'householdBuy') {
        const wohnort = KANON.haushalte[cmd.owner];
        if (!wohnort) return 'K1: kein eingetragener Haushalt';
        if (!ganz(cmd.menge) || cmd.menge === 0) return 'Nur positive ganze Wassermenge';
        if ((state.stations[wohnort].lager.wasser || 0) < cmd.menge) return 'Am Wohnort ist nicht genug Wasser tatsächlich vorhanden';
        if (state.owners[cmd.owner].cash < cmd.menge * preisVon(wohnort)) return 'Nicht genug eigenes Geld';
        return null;
      }
      if (cmd.type === 'dividendPay') {
        if (!hat(KANON.anteile, cmd.owner)) return 'K1: keine Firma mit eingetragenem Eigentümer';
        if (!ganz(cmd.betrag) || cmd.betrag === 0) return 'Nur positiver ganzer Betrag';
        if (cmd.betrag > ausschuettbar(state, cmd.owner)) return 'K1: übersteigt realisierten, freien Überschuss';
        return null;
      }
      const sh = state.ships[cmd.schiff];
      if (!sh || sh.owner !== cmd.owner || sh.klasse !== 'miner' || !sh.flug) return 'Nur eigener Miner mit Flugkörper';
      if (cmd.type === 'shipShuttle') {
        if (!rules.world.fields.some((f) => f.system === sh.system && f.ware === cmd.ware)) return 'kein solches Vorkommen im System';
        if (hat(state.kanon.pendel, sh.id)) return 'K1: Pendelauftrag läuft bereits';
        if (sh.flug.lage !== 'angedockt') return 'K1: Pendelauftrag nur aus dem Dock';
        if (cmd.ware === 'eis' && ((sh.ladung.erz || 0) > 0 || state.erzpilotVertraege?.[sh.id])) return 'Erz- und Eisfracht nicht mischen';
        return null;
      }
      return hat(state.kanon.pendel, sh.id) ? null : 'K1: kein laufender Pendelauftrag';
    }
    function ausfuehren(state, cmd) {
      const fehler = pruefen(state, cmd);
      if (fehler) return { ok: false, type: cmd && cmd.type, reason: fehler };
      const k = state.kanon;
      switch (cmd.type) {
        case 'householdBuy': {
          const wohnort = KANON.haushalte[cmd.owner], kosten = cmd.menge * preisVon(wohnort);
          m_core_buch.transfer(state, cmd.owner, wohnort, kosten, 'wasser-einzelhandel');
          state.stations[wohnort].lager.wasser -= cmd.menge;
          state.ledger.wasser.consumed += cmd.menge;
          k.wasser.konsum += cmd.menge;
          if (wohnort === W.zielStation) { k.wasser.abNadir += cmd.menge; k.wasser.verkauftNadir += cmd.menge; }
          else k.wasser.verkauftAldera += cmd.menge;
          const h = (k.haushalte[cmd.owner] ||= { ausgegeben: 0, gekauft: 0, heute: 0, tag: 0 });
          h.ausgegeben += kosten; h.gekauft += cmd.menge;
          break;
        }
        case 'dividendPay':
          m_core_buch.transfer(state, cmd.owner, KANON.anteile[cmd.owner], cmd.betrag, 'dividende');
          break;
        case 'shipShuttle': k.pendel[cmd.schiff] = { ware: cmd.ware }; break;
        case 'shipShuttleStop': {
          const sh = state.ships[cmd.schiff];
          if (sh.flug.lage === 'angedockt' && ladungSumme(sh) === 0) {
            if (sh.auftrag === 'foerdern') kern.execute(state, { type: 'shipWait', owner: sh.owner, schiff: sh.id }, rules);
            delete k.pendel[cmd.schiff];
          } else k.pendel[cmd.schiff].beenden = true; // kein herrenloses Schiff im Raum
          break;
        }
      }
      return { ok: true, type: cmd.type };
    }
    // Wasser-Rückfracht: Aldera kauft bei Ankunft des Eisfrachters in Nadir reales Wasser,
    // zahlt Ware und Rückfracht aus eigener Kasse; entladen wird erst am Dock in Aldera.
    function rueckfracht(state) {
      const k = state.kanon, a = state.w5n.frachtauftrag, p = k.politik;
      if (a && a.phase === 'rueck' && !k.rueckfracht && p.rueckfracht) {
        const sh = state.ships[a.schiff];
        if (sh.ankunft - a.zeit === state.tick) {
          const nadir = state.stations[W.zielStation].lager, aldera = state.stations[W.quellStation].lager;
          const stueck = W.wasserPreis + KANON.wasser.rueckfrachtJeEinheit;
          const menge = Math.max(0, Math.min(p.wasserZielAldera - aldera.wasser, nadir.wasser,
            KANON.wasser.lagerAldera - aldera.wasser, rules.economy.cargo - ladungSumme(sh),
            Math.floor(state.owners[W.quellStation].cash / stueck)));
          if (menge > 0) {
            m_core_buch.transfer(state, W.quellStation, W.zielStation, menge * W.wasserPreis, 'wasser-grosshandel');
            m_core_buch.transfer(state, W.quellStation, 'k1_rueckfracht', menge * KANON.wasser.rueckfrachtJeEinheit, 'rueckfracht-reserve');
            nadir.wasser -= menge; sh.ladung.wasser = (sh.ladung.wasser || 0) + menge;
            k.wasser.abNadir += menge; k.wasser.rueckGeladen += menge;
            k.rueckfracht = { schiff: sh.id, menge, gebuehr: menge * KANON.wasser.rueckfrachtJeEinheit };
          } else if (p.wasserZielAldera > aldera.wasser && nadir.wasser > 0) {
            k.engpass = merke(k.engpass, state.tick, 'Aldera kann Wasser-Rückfracht nicht bezahlen');
          }
        }
      }
      const r = k.rueckfracht;
      if (r) {
        const sh = state.ships[r.schiff];
        if (sh && sh.phase === 'dock' && sh.system === 'aldera' && FLUG.angedocktAn(sh, W.quellStation)) {
          if ((sh.ladung.wasser || 0) !== r.menge) throw Error('K1: Rückfracht ohne Ware');
          delete sh.ladung.wasser;
          state.stations[W.quellStation].lager.wasser += r.menge;
          k.wasser.rueckGeliefert += r.menge;
          m_core_buch.transfer(state, 'k1_rueckfracht', sh.owner, r.gebuehr, 'rueckfracht');
          k.rueckfracht = null;
        }
      }
    }
    return { BEFEHLE, pruefen, ausfuehren, rueckfracht, ausschuettbar, verfuegbar, einkommen };
  })();


  // K2: Kanonischer Minerbau, keine zweite Simulation. W4-Ware und ISK verbleiben
  // in den Original-Stationen/Konten; alle K2-Zahlungen sind gepaarte K1-Belege.
  const m_core_minerwerft = (() => {
    const C = Object.freeze({ station: rules.w5.station, werft: rules.w5.werft,
      arbeiter: rules.w5.arbeiter, material: rules.w5.material,
      preisMaterial: rules.w5.materialPreis, dauer: rules.w5.dauer,
      lohn: rules.w5.lohnJeMinute, kauf: kaufpreis('miner'),
      fracht: W.flugMinuten * rules.w3.arbeitJeMinute });
    const leer = () => ({ begonnen: 0, fertig: 0, materialVerbraucht: 0,
      verladen: 0, geliefert: 0, auftrag: null, wartetAuf: null, transport: null });
    function konto(s, id) {
      if (!s.owners[id]) s.owners[id] = { id, kind: 'k1-reserve', cash: 0 };
      return s.owners[id];
    }
    function pruefen(s, cmd) {
      if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd) || cmd.type !== 'stationBuildMiner'
        || Object.keys(cmd).some((k) => !['type', 'owner', 'station', 'besteller'].includes(k)))
        return 'K2: ungültige Befehlsform';
      if (cmd.owner !== C.werft || cmd.station !== C.station
        || !['house', 'npc3'].includes(cmd.besteller))
        return 'K2: Nur Nadir-Werft und bekannte Eigentümer';
      const b = s.kanon.minerWerft;
      if (s.w5.auftrag || b?.auftrag || b?.wartetAuf || b?.transport
        || (s.stations[C.station].lager.miner || 0) > 0) return 'K2: Werft/Lieferung belegt';
      if ((s.stations[C.station].lager.material || 0) < C.material)
        return 'K2: reales W4-Material fehlt';
      if (s.owners[C.werft].cash < C.material * C.preisMaterial + C.dauer * C.lohn)
        return 'K2: Material und Arbeitsminuten nicht vorfinanziert';
      if (s.owners[cmd.besteller].cash < C.kauf + C.fracht)
        return 'K2: Eigentümer kann Hülle und Rückfracht nicht zahlen';
      if ((s.stations[W.quellStation].lager.miner || 0) > 0)
        return 'K2: Miner liegen schon in Aldera';
      return null;
    }
    function bauen(s, cmd) {
      const fehler = pruefen(s, cmd);
      if (fehler) return { ok: false, type: 'stationBuildMiner', reason: fehler };
      const b = (s.kanon.minerWerft ||= leer());
      if (konto(s, 'k1_miner_arbeit').cash !== 0) throw Error('K2: Werfttreuhand doppelt');
      m_core_buch.transfer(s, C.werft, C.station, C.material * C.preisMaterial, 'miner-material');
      m_core_buch.transfer(s, C.werft, 'k1_miner_arbeit', C.dauer * C.lohn, 'miner-arbeitsreserve');
      s.stations[C.station].lager.material -= C.material;
      s.ledger.material.consumed += C.material;
      b.materialVerbraucht += C.material; b.begonnen++;
      b.auftrag = { besteller: cmd.besteller, gearbeitet: 0 };
      return { ok: true, type: 'stationBuildMiner' };
    }
    function tick(s) {
      const b = s.kanon.minerWerft, a = b?.auftrag;
      if (!a) return;
      if ((s.owners.k1_miner_arbeit?.cash || 0) < C.lohn) throw Error('K2: Lohnreserve fehlt');
      m_core_buch.transfer(s, 'k1_miner_arbeit', C.arbeiter, C.lohn, 'miner-arbeitslohn');
      a.gearbeitet++;
      if (a.gearbeitet === C.dauer) {
        if (s.owners.k1_miner_arbeit.cash !== 0 || (s.stations[C.station].lager.miner || 0) !== 0)
          throw Error('K2: Minerfertigung ohne Lohn-/Lagerabschluss');
        s.stations[C.station].lager.miner = 1;
        s.ledger.miner.produced++;
        b.fertig++; b.wartetAuf = a.besteller; b.auftrag = null;
      }
    }
    // Frachter nimmt die bezahlte Hülle physisch auf dem ohnehin finanzierten
    // Nadir->Aldera-Rückweg mit; Käufer trägt die zusätzliche Frachtgebühr.
    function transport(s) {
      const b = s.kanon.minerWerft, a = s.w5n.frachtauftrag;
      if (!b) return;
      if (a?.phase === 'rueck' && b.wartetAuf && !b.transport) {
        const sh = s.ships[a.schiff];
        if (sh && sh.system === 'nadir' && sh.ankunft - a.zeit === s.tick
          && (s.stations[C.station].lager.miner || 0) === 1
          && ladungSumme(sh) + 1 <= rules.economy.cargo
          && s.owners[b.wartetAuf].cash >= C.kauf + C.fracht) {
          if (konto(s, 'k1_miner_fracht').cash !== 0) throw Error('K2: Frachttreuhand doppelt');
          m_core_buch.transfer(s, b.wartetAuf, 'k1_miner_fracht', C.fracht, 'miner-frachtreserve');
          s.stations[C.station].lager.miner--;
          sh.ladung.miner = (sh.ladung.miner || 0) + 1;
          b.transport = { schiff: sh.id, besteller: b.wartetAuf };
          b.wartetAuf = null; b.verladen++;
        }
      }
      const t = b.transport, sh = t && s.ships[t.schiff];
      if (t && sh && sh.phase === 'dock' && sh.system === 'aldera'
        && FLUG.angedocktAn(sh, W.quellStation)) {
        if (sh.ladung.miner !== 1) throw Error('K2: Frachtminer verschwunden');
        delete sh.ladung.miner;
        s.stations[W.quellStation].lager.miner++;
        m_core_buch.transfer(s, 'k1_miner_fracht', sh.owner, C.fracht, 'miner-fracht');
        b.geliefert++; b.transport = null;
      }
    }
    function audit(s) {
      const b = s.kanon.minerWerft, nadir = s.stations[C.station].lager.miner || 0;
      if (!b) return s.ledger.miner.produced === 0 && nadir === 0;
      const a = b.auftrag, t = b.transport, l = b.fertig * C.dauer * C.lohn + (a?.gearbeitet || 0) * C.lohn;
      // J2a: Der vollständig finanzierte K2-Miner kann entweder nach Aldera
      // transportiert ODER an den bereits eingetragenen Besteller lokal verkauft
      // werden; niemals gleichzeitig. Alte K2-Saves haben diese Felder nicht.
      const lokal = b.lokalGekauft ?? 0, kauefe = b.lokaleKaeufe ?? [];
      const idSet = new Set();
      const kauefeOk = Array.isArray(kauefe) && kauefe.length === lokal
        && kauefe.every((k) => {
          const sh = s.ships[k?.id];
          if (!k || Object.keys(k).sort().join() !== 'id,owner,preis,station,tick'
            || typeof k.id !== 'string' || idSet.has(k.id)
            || !ganz(k.tick) || k.tick > s.tick || k.station !== C.station
            || !['house','npc3'].includes(k.owner) || k.preis !== C.kauf
            || !sh || sh.id !== k.id || sh.owner !== k.owner || sh.klasse !== 'miner'
            || sh.system !== 'nadir' || sh.heimat !== 'nadir') return false;
          idSet.add(k.id); return true;
        });
      const nadirAktiv = Object.values(s.ships).filter((sh) =>
        sh.klasse === 'miner' && sh.heimat === 'nadir');
      const anBord = Object.values(s.ships).reduce((n, sh) => n + (sh.ladung.miner || 0), 0);
      return ganz(lokal) && kauefeOk && nadirAktiv.length === lokal
        && nadirAktiv.every((sh) => idSet.has(sh.id))
        && [b.begonnen, b.fertig, b.verladen, b.geliefert, b.materialVerbraucht,
        nadir, s.stations[W.quellStation].lager.miner || 0, a?.gearbeitet || 0].every(ganz)
        && b.begonnen === b.fertig + (a ? 1 : 0)
        && b.materialVerbraucht === b.begonnen * C.material
        && b.verladen === b.geliefert + (t ? 1 : 0)
        && b.fertig >= b.verladen + lokal && b.fertig - b.verladen - lokal <= 1
        && nadir === b.fertig - b.verladen - lokal
        && (nadir > 0 ? ['house', 'npc3'].includes(b.wartetAuf) : b.wartetAuf === null)
        && (!a || (a.gearbeitet < C.dauer && ['house', 'npc3'].includes(a.besteller)))
        && m_core_buch.summe(s, 'miner-material') === b.begonnen * C.material * C.preisMaterial
        && m_core_buch.summe(s, 'miner-arbeitsreserve') === b.begonnen * C.dauer * C.lohn
        && m_core_buch.summe(s, 'miner-arbeitslohn') === l
        && (s.owners.k1_miner_arbeit?.cash || 0) === b.begonnen * C.dauer * C.lohn - l
        && m_core_buch.summe(s, 'miner-frachtreserve') === b.verladen * C.fracht
        && m_core_buch.summe(s, 'miner-fracht') === b.geliefert * C.fracht
        && (s.owners.k1_miner_fracht?.cash || 0) === (b.verladen - b.geliefert) * C.fracht
        && s.ledger.miner.produced === b.fertig
        && (s.stations[W.quellStation].lager.miner || 0)
            === s.ledger.miner.initial + b.geliefert + lokal - s.ledger.miner.consumed
        && anBord === (t ? 1 : 0)
        && (!t || (['house', 'npc3'].includes(t.besteller)
          && s.ships[t.schiff]?.ladung.miner === 1));
    }
    return { C, pruefen, bauen, tick, transport, audit };
  })();

  // J2b-Forschung benutzt ausschliesslich die bereits autoritative K1-Uhr,
  // die vorhandene Doppelkassenbuchung und den bestehenden F6-Schiffskörper.
  const m_core_silizium = silizium ? J2B.create({rules,FLUG,
    transfer:m_core_buch.transfer,summe:m_core_buch.summe,ganz,ladungSumme,
    stillgelegt:m_core_anlage.stillgelegt,pilot:KANON.piloten}) : null;
  const m_core_bauteile = bauteile ? J3.create({rules,
    transfer:m_core_buch.transfer,summe:m_core_buch.summe,ganz}) : null;

  // -------------------------------------------------------------- m_core_disponent
  // ---------------------------------------------------------------- m_core_spielerfracht
  // Der Original-W5n-Kern bleibt einziger Transportintegrator. K1 dokumentiert
  // Spieler-Eigentum und leitet jede BEZAHLTE W5ag-Pilotenminute durch ein
  // gepaartes Geldbuch vom Original-Verrechnungskonto an pilot_house weiter.
  const m_core_spielerfracht = (() => {
    const owner = rules.economy.start.owner, clearing = rules.w5ag.pilots.eis;
    const pilot = KANON.piloten[owner];
    function starten(s, sh) {
      const a = s.w5n.frachtauftrag;
      if (!a || a.schiff !== sh.id || sh.owner !== owner)
        throw Error('K1/F4: Original-Eisfrachtauftrag fehlt');
      const f = s.kanon.spielerFrachten ||= { auftraege: [], lohn: 0, gebuehr: 0 };
      if (f.auftraege.some(x => x.end === null)) throw Error('K1/F4: Doppelauftrag');
      f.auftraege.push({ schiff: sh.id, start: s.tick, end: null, geliefert: null,
        menge: a.menge, eis: a.eis, arbeit: a.arbeit, fracht: a.fracht, zeit: a.zeit });
    }
    function minute(s, vor, lohnVor, geliefertVor, gebuehrVor) {
      if (!vor || s.ships[vor.schiff]?.owner !== owner) return;
      const f = s.kanon.spielerFrachten, x = f?.auftraege.at(-1);
      if (!x || x.schiff !== vor.schiff || x.end !== null)
        throw Error('K1/F4: Spielerfracht ohne Originalvertrag');
      const lohn = s.w5n.frachtLohn - lohnVor;
      if (lohn !== W.fliegerLohn) throw Error('K1/F4: Flugminute nicht entlohnt');
      m_core_buch.transfer(s, clearing, pilot, lohn, 'spielerfracht-pilot');
      f.lohn += lohn;
      if (s.w5n.eisGeliefert !== geliefertVor) {
        if (x.geliefert !== null || s.w5n.eisGeliefert - geliefertVor !== x.menge
          || s.tick !== x.start + x.zeit) throw Error('K1/F4: Lieferbeleg fehlerhaft');
        x.geliefert = s.tick;
      }
      const gebuehr = s.w5n.frachtUmsatz - gebuehrVor;
      if (gebuehr) {
        if (gebuehr !== x.fracht || x.geliefert !== x.start + x.zeit
          || s.tick !== x.start + 2 * x.zeit
          || s.w5n.frachtauftrag?.schiff === x.schiff)
          throw Error('K1/F4: Frachtentgelt ohne Rundfahrt');
        x.end = s.tick; f.gebuehr += gebuehr;
      }
    }
    function audit(s) {
      const f = s.kanon.spielerFrachten, a = s.w5n.frachtauftrag;
      if (!f) return !a || s.ships[a.schiff]?.owner !== owner;
      if (!Array.isArray(f.auftraege) || !ganz(f.lohn) || !ganz(f.gebuehr)) return false;
      const dauer = 2 * W.flugMinuten, arbeit = dauer * W.fliegerLohn;
      const fracht = dauer * W.frachtJeMinute, eis = W.charge * W.eisPreis;
      let lohn = 0, gebuehr = 0, aktiv = 0;
      const gesehen = new Set();
      for (let i = 0; i < f.auftraege.length; i++) {
        const x = f.auftraege[i], sh = s.ships[x?.schiff], offen = x?.end === null;
        const key = x?.schiff + '|' + x?.start;
        if (!sh || sh.owner !== owner || sh.klasse !== 'frachter'
          || sh.heimat !== 'aldera' || !ganz(x.start) || x.start > s.tick
          || x.menge !== W.charge || x.eis !== eis || x.arbeit !== arbeit
          || x.fracht !== fracht || x.zeit !== W.flugMinuten
          || gesehen.has(key) || (i && f.auftraege[i-1].start > x.start)) return false;
        gesehen.add(key);
        if (offen) {
          if (++aktiv !== 1 || i !== f.auftraege.length - 1 || !a
            || a.schiff !== x.schiff || !ganz(a.gearbeitet)
            || a.gearbeitet >= dauer || s.tick !== x.start + a.gearbeitet
            || sh.phase !== 'reise' || sh.flug?.lage !== 'transit'
            || x.geliefert !== (a.phase === 'rueck' ? x.start + x.zeit : null))
            return false;
          lohn += a.gearbeitet * W.fliegerLohn;
        } else {
          if (!ganz(x.end) || x.end !== x.start + dauer
            || x.geliefert !== x.start + x.zeit || x.end > s.tick) return false;
          lohn += arbeit; gebuehr += fracht;
        }
      }
      if (a && s.ships[a.schiff]?.owner === owner && aktiv !== 1) return false;
      return f.lohn === lohn && f.gebuehr === gebuehr
        && m_core_buch.summe(s, 'spielerfracht-pilot',
          (von, an) => von === clearing && an === pilot) === lohn
        && m_core_buch.summe(s, 'spielerfracht-pilot') === lohn
        && s.w5n.frachtBeauftragt >= f.auftraege.length
        && s.w5n.frachtAbgeschlossen >= f.auftraege.length - aktiv
        && s.w5n.frachtLohn >= lohn && s.w5n.frachtUmsatz >= gebuehr;
    }
    return { starten, minute, audit };
  })();

  // ----------------------------------------------------------- m_core_torfreigabe
  // K1/F6: optionale, echte Abflug-Navigation, NICHT die W5n-Ankunft.
  // Jeder Torbeleg stammt aus bezahltem Original-2D-Handflug. Erst danach darf
  // der Spieler selbst den speziellen Original-W5n-Vertrag im Dock annehmen.
  // Historische F4-/F5-Verträge und Saves ohne tor-Feld bleiben identisch.
  const m_core_torfreigabe = (() => {
    const owner=rules.economy.start.owner, tor=KANON.tor;
    const inner=(sh)=> {
      if(!sh?.flug) return false;
      const b=sh.flug, dx=b.x-tor.x,dy=b.y-tor.y;
      return dx*dx+dy*dy<=tor.radius*tor.radius
        && b.vx*b.vx+b.vy*b.vy<=tor.tempo*tor.tempo;
    };
    const owned=(s,sh)=>!!sh && sh.owner===owner && sh.klasse==='frachter'
      && sh.system==='aldera' && sh.phase==='dock'
      && sh.auftrag==='halten' && ladungSumme(sh)===0
      && !m_core_anlage.stillgelegt(s,sh);
    const valide=(e,s)=>e && typeof e==='object' && !Array.isArray(e)
      && Object.keys(e).sort().join()==='arbeit,schiff,tick,vx,vy,x,y'
      && typeof e.schiff==='string' && ganz(e.tick) && e.tick<=s.tick
      && ganz(e.arbeit) && e.arbeit>0 && e.arbeit<=e.tick
      && [e.x,e.y,e.vx,e.vy].every(Number.isSafeInteger)
      && (e.x-tor.x)**2+(e.y-tor.y)**2<=tor.radius**2
      && e.vx**2+e.vy**2<=tor.tempo**2
      && s.ships[e.schiff]?.owner===owner
      && s.ships[e.schiff]?.klasse==='frachter';
    const key=(x)=>x.schiff+'|'+x.tick+'|'+x.arbeit;
    const same=(x,y)=>!!x&&!!y&&key(x)===key(y)
      && x.x===y.x&&x.y===y.y&&x.vx===y.vx&&x.vy===y.vy;
    function pruefen(s,sh) {
      if(!owned(s,sh))return {ok:false,grund:'Nur eigener freier Aldera-Frachter darf das Abflugtor bestaetigen'};
      if(sh.flug.lage!=='frei')return {ok:false,grund:'Torabnahme nur im echten freien 2D-Flug'};
      const dienst=s.kanon.flugdienst[sh.id];
      if(!dienst||dienst.gestrandet||!ganz(dienst.minuten)||dienst.minuten===0
        ||!s.owners[dienst.konto]||s.owners[dienst.konto].cash<1)
        return {ok:false,grund:'Tor-Anflug nur mit tatsaechlich finanzierter Pilotenarbeit'};
      if(!inner(sh))return {ok:false,grund:'Torposition oder Anflugtempo nicht erreicht'};
      if(s.kanon.tor?.freigaben?.[sh.id])
        return {ok:false,grund:'Torfreigabe bereits vorhanden'};
      return {ok:true,grund:'Bezahlter Anflug und Original-Flugtempo bestaetigt'};
    }
    function check(s,cmd) {
      const sh=s.ships[cmd?.schiff],typ='shipGateCheck';
      if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
        ||Object.keys(cmd).some(k=>!['type','owner','schiff'].includes(k))
        ||cmd.owner!==owner||cmd.owner!==sh?.owner)
        return {ok:false,type:typ,reason:'Torabnahme: nur rechtmaessiger Schiffeigentuemer'};
      const r=pruefen(s,sh);if(!r.ok)return {ok:false,type:typ,reason:r.grund};
      const d=s.kanon.flugdienst[sh.id],b=sh.flug;
      const e={schiff:sh.id,tick:s.tick,arbeit:d.minuten,x:b.x,y:b.y,vx:b.vx,vy:b.vy};
      const t=s.kanon.tor ||= {historie:[],freigaben:{},genutzt:0};
      t.historie.push(e);t.freigaben[sh.id]={...e};
      return {ok:true,type:typ};
    }
    function darfFracht(s,cmd){
      const sh=s.ships[cmd?.schiff],t=s.kanon.tor,typ='shipFreightGateIce';
      if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
        ||Object.keys(cmd).some(k=>!['type','owner','schiff'].includes(k))
        ||cmd.owner!==owner||cmd.owner!==sh?.owner)
        return {ok:false,type:typ,reason:'Torfracht: fremdes oder unbekanntes Schiff'};
      if(!owned(s,sh)||sh.flug.lage!=='angedockt'||sh.flug.anker!=='st_aldera')
        return {ok:false,type:typ,reason:'Torfracht: zuerst physisch zum Aldera-Dock zurueckkehren'};
      const proof=t?.freigaben?.[sh.id];
      if(!valide(proof,s)||!t.historie.some(x=>same(x,proof)))
        return {ok:false,type:typ,reason:'Torfracht: kein nachgewiesener bezahlter Toranflug'};
      return {ok:true,type:typ,proof:{...proof}};
    }
    function starten(s,cmd){
      const check=darfFracht(s,cmd);
      if(!check.ok)return check;
      // In exakt demselben Core-Execute startet der bereits bestehende,
      // vollstaendig finanzierte Original-W5n-Vertrag. Bei Ablehnung keinerlei
      // Mutationen am Torbuch. Erst ERFOLG konsumiert den Torbeleg.
      const r=execute(s,{type:'shipFreightIce',owner:cmd.owner,schiff:cmd.schiff});
      if(!r.ok)return {ok:false,type:'shipFreightGateIce',reason:r.reason};
      const a=s.kanon.spielerFrachten?.auftraege.at(-1);
      if(!a||a.schiff!==cmd.schiff||a.end!==null)throw Error('F6: Originalauftrag fehlt nach Start');
      const t=s.kanon.tor;
      a.tor={...check.proof};delete t.freigaben[cmd.schiff];t.genutzt++;
      return {ok:true,type:'shipFreightGateIce'};
    }
    function audit(s) {
      const t=s.kanon.tor;
      if(t===undefined)return !(s.kanon.spielerFrachten?.auftraege||[]).some(x=>x.tor!==undefined);
      if(!t||typeof t!=='object'||Array.isArray(t)
        ||Object.keys(t).sort().join()!=='freigaben,genutzt,historie'
        ||!Array.isArray(t.historie)||!t.freigaben||typeof t.freigaben!=='object'
        ||Array.isArray(t.freigaben)||!ganz(t.genutzt))return false;
      const keys=new Set(),used=new Set();
      for(const [i,e] of t.historie.entries()){
        if(!valide(e,s)||keys.has(key(e))
          ||(i&&t.historie[i-1].tick>e.tick))return false;
        keys.add(key(e));
      }
      for(const [id,e] of Object.entries(t.freigaben)){
        if(id!==e?.schiff||!valide(e,s)||!t.historie.some(x=>same(x,e)))return false;
        // Auch ein regulaerer F4-Vertrag darf ohne Torpflicht laufen; seine
        // vorherige Torfreigabe bleibt bis zur bewussten F6-Wahl ungenutzt.
      }
      let paid=0;
      for(const c of s.kanon.spielerFrachten?.auftraege||[])if(c.tor!==undefined){
        const e=c.tor;
        if(!valide(e,s)||!t.historie.some(x=>same(x,e))||used.has(key(e))
          ||e.schiff!==c.schiff||e.tick>=c.start) return false;
        used.add(key(e));paid++;
        if(t.freigaben[e.schiff]&&same(t.freigaben[e.schiff],e))return false;
      }
      return paid===t.genutzt && keys.size===used.size+Object.keys(t.freigaben).length
        && t.historie.every(e=>used.has(key(e))||same(t.freigaben[e.schiff],e));
    }
    return { pruefen, check, darfFracht, starten, audit };
  })();

  // NPC-Automatik: wählt nur finanzierte Aufträge und nutzt dieselben validierten Befehle.
  const m_core_disponent = (() => {
    const versuch = (state, cmd, k1) => (k1 ? m_core_kreislauf.ausfuehren(state, cmd) : kern.execute(state, cmd, rules));
    function schritt(state) {
      const k = state.kanon, p = k.politik;
      if (!p.automatik) return;
      // 1. Ersatz: nur als echter Kauf einer real vorhandenen Hülle aus eigener Kasse.
      //    Frachter stammen aus der Nadir-Werft (Erz -> Material -> Hülle) oder dem Gründungslager,
      //    Miner ausschließlich aus dem endlichen Gründungslager (Regel195 kennt kein Miner-Rezept).
      const flotte = (owner, klasse) => ids(state.ships).map((id) => state.ships[id])
        .filter((sh) => sh.owner === owner && sh.klasse === klasse);
      const tauglich = (sh) => !m_core_anlage.stillgelegt(state, sh);
      const frachter = flotte(W.frachterOwner, 'frachter');
      const hatte = frachter.length > 0 || state.ledger.frachter.consumed > 0;
      const werftlager = state.stations[rules.w5.station].lager.frachter || 0;
      if (p.gruendung && !hatte && werftlager + (state.stations[rules.erzpilot.station].lager.frachter || 0) > 0
        && state.owners[W.frachterOwner].cash >= kaufpreis('frachter')) {
        const quelle = werftlager > 0 ? rules.w5.station : rules.erzpilot.station;
        if (versuch(state, { type: 'shipBuy', owner: W.frachterOwner, klasse: 'frachter', station: quelle }).ok) m_core_flugplan.koerperSync(state);
      }
      if (p.ersatzkauf && hatte && !frachter.some(tauglich)) {
        const quelle = werftlager > 0 ? rules.w5.station : rules.erzpilot.station;
        const r = versuch(state, { type: 'shipBuy', owner: W.frachterOwner, klasse: 'frachter', station: quelle });
        if (r.ok) { k.ersatzkaeufe += 1; m_core_flugplan.koerperSync(state); }
        else k.engpass = merke(k.engpass, state.tick, 'Ersatzfrachter: ' + r.reason);
      }
      // Überführung einer gekauften Werfthülle nach Aldera: 60 bezahlte Flugminuten des Kerns.
      for (const sh of flotte(W.frachterOwner, 'frachter')) {
        if (sh.system !== 'nadir' || sh.phase !== 'dock' || !tauglich(sh)) continue;
        const q = kern.pilotW5TransferKalkulation(state, sh.id);
        if (q.ok) versuch(state, { type: 'shipReposition', owner: sh.owner, schiff: sh.id });
      }
      if (p.ersatzkauf) for (const id of ids(k.pendel)) {
        const sh = state.ships[id];
        if (tauglich(sh) || sh.flug.lage !== 'angedockt') continue;
        if (sh.owner === rules.economy.start.owner && !p.spielerErsatz) continue; // der Spieler kauft selbst
        const r = versuch(state, { type: 'shipBuy', owner: sh.owner, klasse: 'miner', station: rules.erzpilot.station });
        if (r.ok) {
          k.ersatzkaeufe += 1; m_core_flugplan.koerperSync(state);
          const neu = flotte(sh.owner, 'miner').at(-1);
          if (sh.auftrag === 'foerdern') kern.execute(state, { type: 'shipWait', owner: sh.owner, schiff: id }, rules);
          k.pendel[neu.id] = { ware: k.pendel[id].ware,
            ...(k.pendel[id].ware === 'erz' ? { ersatz: true } : {}) }; delete k.pendel[id];
        } else k.engpass = merke(k.engpass, state.tick, 'Ersatzminer ' + sh.owner + ': ' + r.reason);
      }

      // Die Werft priorisiert den drohenden Minerausfall gegenüber Vorratsfrachtern.
      const minerGefahr = p.stilllegung && p.ersatzkauf && ids(k.pendel).some((id) => {
        const sh = state.ships[id];
        return sh && (sh.owner !== rules.economy.start.owner || p.spielerErsatz)
          && m_core_anlage.buchwert(state, sh) * 100 <= kaufpreis('miner') * p.ersatzVorlaufProzent;
      }) && (state.stations[W.quellStation].lager.miner || 0) === 0
        && !(k.minerWerft?.auftrag || k.minerWerft?.wartetAuf || k.minerWerft?.transport);
      // Vorproduktion einer Ersatzhülle, sobald der Buchwert des letzten Frachters zur Neige geht.
      const rest = frachter.filter(tauglich).reduce((n, sh) => Math.max(n, m_core_anlage.buchwert(state, sh)), 0);
      const bedarf = hatte && werftlager === 0 && !state.w5.auftrag
        && !state.kanon.minerWerft?.auftrag && !minerGefahr
        && (frachter.every((sh) => !tauglich(sh)) || p.werftVorrat > 0
          || (p.stilllegung && rest * 100 <= kaufpreis('frachter') * p.ersatzVorlaufProzent));
      if (bedarf) {
        const nadir = state.stations[rules.w5.station].lager;
        if ((nadir.material || 0) >= rules.w5.material) {
          const q = kern.pilotW5Kalkulation(state);
          if (q.ok) versuch(state, { type: 'stationBuildShip', owner: rules.w5.werft, station: rules.w5.station });
          else k.engpass = merke(k.engpass, state.tick, 'Werft: ' + q.grund);
        } else if ((nadir.erz || 0) >= rules.w4.erzJeCharge) {
          if (!state.w4.auftrag) {
            const q = kern.pilotW4Kalkulation(state);
            if (q.ok) versuch(state, { type: 'stationRefine', owner: rules.w4.station, station: rules.w4.station });
            else k.engpass = merke(k.engpass, state.tick, 'Raffinerie: ' + q.grund);
          }
        } else if (!state.w3.auftrag && !state.w5n.frachtauftrag) {
          const frei = frachter.find((sh) => tauglich(sh) && sh.phase === 'dock' && sh.system === 'aldera' && sh.auftrag === 'halten' && ladungSumme(sh) === 0);
          if (frei) {
            const q = kern.pilotW3Kalkulation(state, frei.id);
            if (q.ok) { versuch(state, { type: 'shipFreight', owner: frei.owner, schiff: frei.id }); }
            else k.engpass = merke(k.engpass, state.tick, 'Erzfracht für Ersatzbau: ' + q.grund);
          }
        }
      }

      if (minerGefahr) {
        const nadir = state.stations[rules.w5.station].lager;
        const besteller = ids(k.pendel).map((id) => state.ships[id]).find((sh) =>
          (sh.owner !== rules.economy.start.owner || p.spielerErsatz)
          && m_core_anlage.buchwert(state, sh) * 100 <= kaufpreis('miner') * p.ersatzVorlaufProzent)?.owner;
        if (besteller && (nadir.material || 0) >= m_core_minerwerft.C.material) {
          const r = m_core_minerwerft.bauen(state, { type: 'stationBuildMiner', owner: rules.w5.werft,
            station: rules.w5.station, besteller });
          if (!r.ok) k.engpass = merke(k.engpass, state.tick, 'Minerwerft: ' + r.reason);
        } else if ((nadir.erz || 0) >= rules.w4.erzJeCharge && !state.w4.auftrag) {
          const q = kern.pilotW4Kalkulation(state);
          if (q.ok) versuch(state, { type: 'stationRefine', owner: rules.w4.station, station: rules.w4.station });
          else k.engpass = merke(k.engpass, state.tick, 'Miner-Material: ' + q.grund);
        } else if (!state.w3.auftrag && !state.w5n.frachtauftrag) {
          const frei = frachter.find((sh) => tauglich(sh) && sh.phase === 'dock'
            && sh.system === 'aldera' && sh.auftrag === 'halten' && ladungSumme(sh) === 0);
          if (frei) {
            const q = kern.pilotW3Kalkulation(state, frei.id);
            if (q.ok) versuch(state, { type: 'shipFreight', owner: frei.owner, schiff: frei.id });
            else k.engpass = merke(k.engpass, state.tick, 'Miner-Erzfracht: ' + q.grund);
          }
        }
      }
      // 2. Eisfracht Aldera -> Nadir, sobald Charge, Käuferetat und Arbeitsreserve vorhanden sind.
      if (p.eisfracht && !state.w5n.frachtauftrag && !state.w3.auftrag
        && (state.stations[W.quellStation].lager.eis || 0) >= W.charge) {
        const frei = ids(state.ships).map((id) => state.ships[id]).find((sh) => sh.owner === W.frachterOwner
          && sh.klasse === 'frachter' && sh.phase === 'dock' && sh.system === 'aldera' && sh.auftrag === 'halten'
          && ladungSumme(sh) === 0 && !m_core_anlage.stillgelegt(state, sh));
        if (frei) {
          const q = kern.pilotIceFreightQuote(state, frei.id);
          if (q.ok) versuch(state, { type: 'shipFreightIce', owner: W.frachterOwner, schiff: frei.id });
          else k.engpass = merke(k.engpass, state.tick, q.grund);
        } else k.engpass = merke(k.engpass, state.tick, 'Kein einsatzfähiger Frachter der Spedition in Aldera');
      }
      // 3. Wasserwerk: nur bei real geliefertem Eis und nur bis zum Lagerziel.
      if (p.wasserwerk && !state.w5n.fabrikauftrag
        && state.stations[W.zielStation].lager.wasser < p.wasserwerkBis
        && state.stations[W.zielStation].lager.eis >= W.rezeptEis) {
        const q = kern.pilotWaterFactoryQuote(state);
        if (q.ok) versuch(state, { type: 'stationWater', owner: W.zielStation, station: W.zielStation });
        else k.engpass = merke(k.engpass, state.tick, q.grund);
      }
      // 4. Freiwillige Haushaltskäufe am Wohnort, versetzt nach Kontonummer.
      const tag = Math.floor(state.tick / 1440);
      const haushalte = ids(KANON.haushalte);
      for (let i = 0; i < haushalte.length; i++) {
        const id = haushalte[i];
        if ((state.tick + i * 7) % p.einkaufMinuten !== 0 || !state.owners[id]) continue;
        const wohnort = KANON.haushalte[id], preis = preisVon(wohnort);
        const h = (k.haushalte[id] ||= { ausgegeben: 0, gekauft: 0, heute: 0, tag: 0 });
        if (h.tag !== tag) { h.tag = tag; h.heute = 0; }
        let menge = Math.min(Math.floor(m_core_kreislauf.verfuegbar(state, id) / preis),
          state.stations[wohnort].lager.wasser || 0);
        if (p.bedarfJeTag > 0) menge = Math.min(menge, p.bedarfJeTag - h.heute);
        if (menge > 0) {
          const r = versuch(state, { type: 'householdBuy', owner: id, menge }, true);
          if (r.ok) h.heute += menge;
        } else if (state.owners[id].cash >= preis && (state.stations[wohnort].lager.wasser || 0) === 0
          && m_core_kreislauf.verfuegbar(state, id) >= preis) {
          k.engpass = merke(k.engpass, state.tick, 'Kein Wasser am Wohnort ' + wohnort);
        }
      }
      // 5. Ausschüttung an eingetragene Eigentümer (täglich, nur freier realisierter Überschuss).
      if (state.tick % p.dividendeMinuten === 0) for (const firma of ids(KANON.anteile)) {
        const quote = p.ausschuettung[firma] || 0;
        const betrag = Math.floor(m_core_kreislauf.ausschuettbar(state, firma) * quote / 1000);
        if (betrag > 0) versuch(state, { type: 'dividendPay', owner: firma, betrag }, true);
      }
    }
    return { schritt };
  })();

  // ------------------------------------------------------------------ m_core_welt
  function pruefeForm(state) {
    if (state === null || typeof state !== 'object' || state.rulesVersion !== rules.rulesVersion || state.schema !== KANON.schema)
      throw Error('K1: fremde Regelversion oder Schema; keine automatische Migration');
    const k = state.kanon;
    if (!k || k.modell !== KANON.modell || !k.netto || !k.buch || !k.wasser || !k.pendel || !k.flugdienst
      || !k.verschleiss || !k.haushalte || !k.politik || !state.flug)
      throw Error('K1: Weltbuch unvollständig');
  }
  const sicherK7Reserve=(state,i)=>state.owners.k7_werft_treuhand?.cash??0;
  function audit(state) {
    try {
      pruefeForm(state);
      const k = state.kanon, fehler = [];
      if (k7) {
        if (k.industrieAuto !== undefined && typeof k.industrieAuto !== 'boolean')
          fehler.push('K7-Industrieautomatik: ungültige Einstellung');
        const i=k.industrieErz, a=state.w3?.auftrag;
        const beteiligte=i && ['angebot','aktiv','geliefert'].includes(i.phase);
        // Vertrags-IDs sind reale Eigentumsrechte, nicht vom JSON-Importer
        // beliebig neu verteilbare Namen. Auch nach der Lieferung prüfen.
        if(beteiligte && (state.ships[i.miner]?.owner!=='npc3'
          ||state.ships[i.miner]?.klasse!=='miner'
          ||state.ships[i.frachter]?.owner!=='transport'
          ||state.ships[i.frachter]?.klasse!=='frachter'
          ||!Number.isSafeInteger(i.erstellt)||i.erstellt<0||i.erstellt>state.tick
          ||typeof i.signMiner!=='boolean'||typeof i.signFracht!=='boolean'
          ||typeof i.signWerft!=='boolean'||typeof i.werftVerwendet!=='boolean'
          ||typeof i.erzAngenommen!=='boolean'))
          fehler.push('K7-Vertrag: unwirksame Eigentümer-/Unterschriftsbelege');
        if(i && ['aktiv','geliefert'].includes(i.phase)
          &&sicherK7Reserve(state,i)!==(i.werftVerwendet?0:K7_PREIS.werft))
          fehler.push('K7-Werftreserve nicht einmalig aus eigenem Vermögen gebunden');
        if(!i||!['frei','angebot','aktiv','geliefert','storniert'].includes(i.phase)
          ||(i.phase==='aktiv'&&(!a||a.industrieMiner!==i.miner||!i.signMiner||!i.signFracht||!i.signWerft))
          ||(a?.phase==='vorbestellt'&&(i.phase!=='aktiv'||!i.signMiner||!i.signFracht||!i.signWerft||i.miner!==a.industrieMiner))
          ||(i.phase==='geliefert'&&a?.industrieMiner===i.miner)
          ||(i.phase==='angebot'&&a?.industrieMiner)) fehler.push('K7-Industrieerzkette/Signaturen');
      }
      const flug = FLUG.audit(state);
      if (!flug.ok) fehler.push('Flug: ' + flug.grund);
      const wirtschaft = kern.audit(state);
      if (!wirtschaft.ok) fehler.push('Wirtschaft: ' + Object.keys(wirtschaft).filter((x) => wirtschaft[x] && wirtschaft[x].ok === false).join(','));
      if (!m_core_buch.audit(state)) fehler.push('K1-Buch');
      if (!m_core_minerwerft.audit(state)) fehler.push('K2-Minerwerft/Transport');
      if (silizium && !m_core_silizium.audit(state)) fehler.push('J2b-Silizium-/Geld-/Feldbuch');
      if (bauteile && !m_core_bauteile.audit(state)) fehler.push('J3-Bauteil-/Material-/Lohnbuch');
      if (!m_core_spielerfracht.audit(state)) fehler.push('K1-Spielerfracht/Vertragslohn');
      if (!m_core_torfreigabe.audit(state)) fehler.push('K1-Bezahltes-Tor/Vertragsfreigabe');
      if (state.minted !== 0 || state.burned !== 0) fehler.push('Emission/Senke in K1 nicht freigegeben');
      for (const id of ids(state.owners)) if (!ganz(state.owners[id].cash)) fehler.push('Kasse ' + id);
      // Unabhängige Gegenbuchung zum Original-W5ad-Transportkaufjournal:
      // nur tatsächlich gekaufte, vorhandene Spielerhüllen, niemals Gratis-Spawn.
      // Optional bei alten K1-Saves ohne Spielerfrachter; keine stille Migration.
      const spielerHuellen = ids(state.ships).map((id) => state.ships[id])
        .filter((sh) => sh.owner === rules.economy.start.owner && sh.klasse === 'frachter');
      const belege = k.spielerFrachterKaeufe ?? [];
      const frPreis = rules.economy.waren.frachter.basis;
      if (!Array.isArray(belege) || belege.length !== spielerHuellen.length
        || new Set(belege.map((x) => x?.id)).size !== belege.length
        || belege.some((x) => !x || typeof x.id !== 'string' || !ganz(x.tick)
          || x.tick > state.tick || !['st_aldera',...(k7?['st_nadir']:[])].includes(x.station) || x.preis !== frPreis
          || state.ships[x.id]?.owner !== rules.economy.start.owner
          || state.ships[x.id]?.klasse !== 'frachter'
          || state.ships[x.id]?.heimat !== (x.station==='st_nadir'?'nadir':'aldera')
          || (k7 && (x.station==='st_nadir') !== state.w5.schiffIds.includes(x.id)))
        || state.ledger.frachter.consumed !== (state.w5ad?.purchases?.length ?? 0) + belege.length)
        fehler.push('Spielerfrachter-Kaufbelege');
      // Wasserbuch: jede Einheit hat Herkunft (Wasserwerk) und Verbleib.
      const w = k.wasser, an = state.stations[W.quellStation].lager.wasser;
      const unterwegs = ids(state.ships).reduce((n, id) => n + (state.ships[id].ladung.wasser || 0), 0);
      if (![w.abNadir, w.konsum, w.rueckGeladen, w.rueckGeliefert, w.verkauftAldera, w.verkauftNadir, an].every(ganz)
        || w.abNadir !== w.verkauftNadir + w.rueckGeladen || w.rueckGeladen !== w.rueckGeliefert + unterwegs
        || an !== w.rueckGeliefert - w.verkauftAldera || w.konsum !== w.verkauftNadir + w.verkauftAldera
        || unterwegs !== (k.rueckfracht ? k.rueckfracht.menge : 0)
        || state.owners.k1_rueckfracht.cash !== (k.rueckfracht ? k.rueckfracht.gebuehr : 0))
        fehler.push('Wasserbuch');
      const einzel = m_core_buch.summe(state, 'wasser-einzelhandel');
      if (einzel !== w.verkauftNadir * W.wasserPreis + w.verkauftAldera * KANON.wasser.preisAldera
        || m_core_buch.summe(state, 'wasser-grosshandel') !== w.rueckGeladen * W.wasserPreis
        || ids(k.haushalte).reduce((n, id) => n + k.haushalte[id].ausgegeben, 0) !== einzel)
        fehler.push('Wasserzahlungen');
      // Jede Hülle hat genau einen Körper; Transit folgt der Kernphase; Pendel nur für Miner.
      for (const id of ids(state.ships)) {
        const sh = state.ships[id];
        if (hat(FLUG.DATEN.klassen, sh.klasse) && !sh.flug) fehler.push('Körper fehlt ' + id);
        if (sh.klasse === 'frachter' && sh.flug && !['angedockt', 'transit'].includes(sh.flug.lage)
          && (sh.owner !== rules.economy.start.owner || sh.system !== 'aldera'
            || sh.phase !== 'dock' || sh.auftrag !== 'halten' || ladungSumme(sh) !== 0))
          fehler.push('Unzulässiger Frachter im Freiflug ' + id);
        if (!ganz(k.verschleiss[id] ?? 0)) fehler.push('Verschleiß ' + id);
        // Ware an Bord eines Miners setzt echte Förderung voraus (Kernbuch prüft Mengen).
        if (sh.klasse === 'miner' && sh.phase !== 'dock') fehler.push('Miner in Kernreise ' + id);
      }
      for (const id of ids(k.pendel)) if (state.ships[id]?.klasse !== 'miner') fehler.push('Pendel ohne Miner ' + id);
      // Flugdienst: Reservekonto existiert genau für Schiffe außerhalb des Docks.
      for (const id of ids(state.ships)) {
        const sh = state.ships[id], d = k.flugdienst[id];
        if (!sh.flug || (sh.klasse !== 'miner'
          && !(sh.klasse === 'frachter' && sh.owner === rules.economy.start.owner
            && sh.phase === 'dock' && sh.system === 'aldera'))) continue;
        const konto = state.owners[m_core_flugplan.dienstKonto(id)];
        if (!d && konto && konto.cash !== 0) fehler.push('Flugreserve ohne Dienst ' + id);
        if (!d && sh.flug.lage !== 'angedockt') fehler.push('Flug ohne finanzierten Dienst ' + id);
        if (d && (!konto || d.konto !== konto.id || !ganz(d.minuten))) fehler.push('Flugdienst ' + id);
      }
      for (const id of ids(k.flugdienst)) if (!state.ships[id]) fehler.push('Flugdienst ohne Schiff ' + id);
      const lohnSoll = m_core_buch.summe(state, 'fluglohn');
      if (lohnSoll !== k.fluglohnMinuten * KANON.flug.lohnJeMinute) fehler.push('Fluglohn ohne Minutenbeleg');
      const reserveRein = m_core_buch.summe(state, 'flugreserve'), reserveRaus = m_core_buch.summe(state, 'flugreserve-rueck');
      const gebunden = ids(state.owners).filter((id) => id.startsWith('k1_flug_')).reduce((n, id) => n + state.owners[id].cash, 0);
      if (reserveRein - reserveRaus - lohnSoll !== gebunden) fehler.push('Flugreserve');
      return { ok: fehler.length === 0, fehler, flug, wirtschaft };
    } catch (e) {
      return { ok: false, fehler: [e.message] };
    }
  }

  function createState(seed = rules.startSeed, optionen = {}) {
    const opt = optionen || {};
    if (typeof opt !== 'object' || Array.isArray(opt) || Object.keys(opt).some((x) => x !== 'politik'))
      throw TypeError('K1: nur {politik} als Startoption');
    const state = kern.createW5State(seed);
    for (const o of KANON.neueKonten) state.owners[o.id] = { id: o.id, kind: o.kind, cash: 0 };
    state.stations[W.quellStation].lager.wasser = 0;
    state.flug = { schritt: 0 };
    state.kanon = {
      modell: KANON.modell, netto: {}, buch: { belege: 0, summen: {} },
      wasser: { abNadir: 0, konsum: 0, rueckGeladen: 0, rueckGeliefert: 0, verkauftAldera: 0, verkauftNadir: 0 },
      pendel: {}, flugdienst: {}, verschleiss: {}, haushalte: {}, ersatzkaeufe: 0,
      fluglohnMinuten: 0, rueckfracht: null, engpass: null,
      politik: JSON.parse(JSON.stringify(KANON.politik)),
    };
    if (opt.politik) politikSetzen(state, opt.politik);
    m_core_flugplan.koerperSync(state);
    // Die Kern-Initialisierung beauftragt den NPC-Miner bereits mit Erz: er erhält denselben
    // Pendelauftrag wie jedes Spielerschiff und muss ab jetzt wirklich zum Feld fliegen.
    npcPendel(state);
    if (k7) state.kanon.industrieErz = { phase: 'frei' };
    if (silizium) state.kanon.silizium = m_core_silizium.leer();
    if (bauteile) state.kanon.bauteile = m_core_bauteile.leer();
    const a = audit(state);
    if (!a.ok) throw Error('K1: Anfangszustand nicht konsistent: ' + a.fehler.join('; '));
    return state;
  }
  function npcPendel(state) {
    for (const id of ids(state.ships)) {
      const sh = state.ships[id];
      if (sh.klasse === 'miner' && sh.owner !== rules.economy.start.owner && sh.auftrag === 'foerdern'
        && !hat(state.kanon.pendel, id)) state.kanon.pendel[id] = { ware: sh.ware };
    }
  }
  function politikSetzen(state, patch) {
    const ziel = state.kanon.politik;
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) throw TypeError('K1: Politik muss ein Objekt sein');
    for (const key of Object.keys(patch)) {
      if (!hat(KANON.politik, key)) throw TypeError('K1: unbekannter Politikwert ' + key);
      const muster = KANON.politik[key], wert = patch[key];
      if (typeof muster === 'boolean') { if (typeof wert !== 'boolean') throw TypeError('K1: ' + key); ziel[key] = wert; }
      else if (typeof muster === 'number') { if (!ganz(wert)) throw TypeError('K1: ' + key); ziel[key] = wert; }
      else {
        if (wert === null || typeof wert !== 'object' || Array.isArray(wert)) throw TypeError('K1: ' + key);
        for (const id of Object.keys(wert)) {
          if (!ganz(wert[id]) || (key !== 'betriebsreserve' && wert[id] > 1000)) throw TypeError('K1: ' + key + '.' + id);
          if (key === 'sparquote' ? !hat(KANON.haushalte, id) : !hat(KANON.anteile, id)) throw TypeError('K1: unbekanntes Konto ' + id);
          ziel[key][id] = wert[id];
        }
      }
    }
    if (ziel.einkaufMinuten === 0 || ziel.dividendeMinuten === 0) throw TypeError('K1: Intervall muss positiv sein');
  }

  // K7: drei getrennt durch Original-Firmenrechte signierte Vertragsparteien.
  // Ein Angebot und die Signaturen erzeugen keine Ware, Geld oder Schiff.
  function k7Befehl(s, cmd) {
    const type=cmd?.type, i=s.kanon.industrieErz, angebot=i?.phase==='angebot';
    const erlaubte={
      industrialOreOffer:['type','owner','miner','frachter'],
      industrialOreAcceptMine:['type','owner'],
      industrialOreAcceptFreight:['type','owner'],
      industrialOreAcceptYard:['type','owner'],
      industrialOreBuildShip:['type','owner'],
      industrialOreCommit:['type','owner'],
      industrialOreCancel:['type','owner'],
    };
    if(!hat(erlaubte,type)||!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||Object.keys(cmd).some(k=>!erlaubte[type].includes(k))
      ||Object.keys(cmd).length!==erlaubte[type].length)
      return {ok:false,type,reason:'K7: unerlaubte Vertragsform'};
    const verwerfen=reason=>({ok:false,type,reason:'K7: '+reason});
    if(type==='industrialOreOffer'){
      if(cmd.owner!=='st_nadir')return verwerfen('nur realer Industriekäufer darf bestellen');
      if(!['frei','geliefert','storniert'].includes(i.phase))return verwerfen('Vertrag bereits vorhanden');
      if(s.w3.auftrag||s.w5n.frachtauftrag)return verwerfen('bereits laufende Fracht');
      if((s.owners.k7_werft_treuhand?.cash||0)!==0)
        return verwerfen('vorheriger Vertrag hat noch gebundenes Werftkapital');
      const mi=s.ships[cmd.miner],fr=s.ships[cmd.frachter];
      if(!mi||mi.owner!=='npc3'||mi.klasse!=='miner'||!fr||fr.owner!=='transport'
        ||fr.klasse!=='frachter'||m_core_anlage.stillgelegt(s,mi)||m_core_anlage.stillgelegt(s,fr))
        return verwerfen('fremdes oder verschlissenes Schiff');
      if(mi.system!=='aldera'||mi.flug?.lage!=='angedockt'
        ||Object.values(mi.ladung).some(x=>x!==0)||s.erzpilotVertraege?.[mi.id]
        ||fr.system!=='aldera'||fr.phase!=='dock'||fr.auftrag!=='halten'
        ||Object.values(fr.ladung).some(x=>x!==0))return verwerfen('Schiffe nicht frei im Dock');
      if(s.owners.st_nadir.cash<K7_PREIS.nadiraufwand)return verwerfen('Nadir kann Kauf und Rundfracht nicht vorfinanzieren');
      s.kanon.industrieErz={phase:'angebot',miner:mi.id,frachter:fr.id,
        signMiner:false,signFracht:false,signWerft:false,
        werftVerwendet:false,erzAngenommen:false,erstellt:s.tick};
      return {ok:true,type};
    }
    if(type==='industrialOreAcceptMine'){
      if(cmd.owner!=='npc3'||!angebot)return verwerfen('nur Bergbaueigentümer darf unterschreiben');
      if(i.signMiner)return verwerfen('Bergbau bereits unterschrieben');
      if(s.ships[i.miner]?.owner!=='npc3'||s.owners.npc3.cash<K7_PREIS.bergbau)
        return verwerfen('echte Bergbauarbeit nicht gedeckt');
      i.signMiner=true;return {ok:true,type};
    }
    if(type==='industrialOreAcceptFreight'){
      if(cmd.owner!=='transport'||!angebot)return verwerfen('nur Spedition darf unterschreiben');
      if(i.signFracht)return verwerfen('Transport bereits unterschrieben');
      if(s.ships[i.frachter]?.owner!=='transport'||s.owners.transport.cash<K7_PREIS.frachtlohn)
        return verwerfen('echte Frachtarbeit nicht gedeckt');
      i.signFracht=true;return {ok:true,type};
    }
    if(type==='industrialOreAcceptYard'){
      if(cmd.owner!=='werft_extern'||!angebot)return verwerfen('nur Werfteigentümer darf unterschreiben');
      if(i.signWerft)return verwerfen('Werft bereits unterschrieben');
      if(s.owners.werft_extern.cash<K7_PREIS.werft)return verwerfen('reales Werftmaterial und bezahlte Arbeitsminuten nicht gedeckt');
      i.signWerft=true;return {ok:true,type};
    }
    if(type==='industrialOreBuildShip'){
      // W4-Material entsteht schon bei der echten Hinlieferung. Der bezahlte
      // Rückflug dauert weiter; seine 240 ISK bleiben bis zur Rückkehr gesperrt.
      const echtGeliefert=i.phase==='geliefert'
        ||(i.phase==='aktiv'&&s.w3.auftrag?.phase==='rueck'
          &&s.w3.auftrag.industrieMiner===i.miner&&i.erzAngenommen);
      if(cmd.owner!=='werft_extern'||!echtGeliefert||!i.signWerft||i.werftVerwendet)
        return verwerfen('nur signierte Werft darf einmal nach echter Nadir-Ankunft bauen');
      if(s.owners.k7_werft_treuhand?.cash!==K7_PREIS.werft||s.w5.auftrag
        ||s.kanon.minerWerft?.auftrag
        ||(s.stations[rules.w5.station].lager.material||0)<rules.w5.material
        ||(s.stations[rules.w5.station].lager.frachter||0)
          >=rules.world.stations[rules.w5.station].ziel.frachter)
        return verwerfen('kein physisches Material oder keine freie W5-Werft');
      m_core_buch.transfer(s,'k7_werft_treuhand','werft_extern',K7_PREIS.werft,'k7-werftreserve-ausloesen');
      const q=kern.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},rules);
      if(!q.ok)throw Error('K7: Werkbudget gedeckt, aber Original-W5-Befehl abgelehnt: '+q.reason);
      i.werftVerwendet=true;
      return {ok:true,type};
    }
    if(type==='industrialOreCommit'){
      if(cmd.owner!=='st_nadir'||!angebot||!i.signMiner||!i.signFracht||!i.signWerft)
        return verwerfen('nur der Käufer bestätigt nach beiden Eigentümerzustimmungen');
      const mi=s.ships[i.miner],fr=s.ships[i.frachter];
      if(!mi||!fr||mi.owner!=='npc3'||fr.owner!=='transport'
        ||mi.flug?.lage!=='angedockt'||fr.phase!=='dock'
        ||Object.values(mi.ladung).some(x=>x!==0)||s.erzpilotVertraege?.[mi.id]
        ||(s.kanon.pendel[i.miner]&&s.kanon.pendel[i.miner].ware!=='erz'))
        return verwerfen('Einsatzschiffe/Erzauftrag nicht mehr verfügbar');
      if(s.owners.npc3.cash<K7_PREIS.bergbau||s.owners.st_aldera.cash<K7_PREIS.alderakauf
        ||s.owners.st_nadir.cash<K7_PREIS.nadiraufwand||s.owners.transport.cash<K7_PREIS.frachtlohn
        ||s.owners.werft_extern.cash<K7_PREIS.werft)
        return verwerfen('unvollständig vorfinanzierte Firmenkette');
      try { kern.industryOrePrebook(s,i.frachter,i.miner); }
      catch(e){return verwerfen(e.message);}
      if(!s.owners.k7_werft_treuhand)
        s.owners.k7_werft_treuhand={id:'k7_werft_treuhand',kind:'k7-reserve',cash:0};
      if(s.owners.k7_werft_treuhand.cash!==0)throw Error('K7: bereits gebundene Werfttreuhand');
      m_core_buch.transfer(s,'werft_extern','k7_werft_treuhand',K7_PREIS.werft,'k7-werftreserve');
      i.phase='aktiv';
      const m=kern.execute(s,{type:'shipMine',owner:'npc3',schiff:i.miner,ware:'erz'},rules);
      if(!m.ok)throw Error('K7: nach Vorfinanzierung abgelehnter Eigentümerauftrag: '+m.reason);
      s.kanon.pendel[i.miner]={ware:'erz'};
      return {ok:true,type};
    }
    if(type==='industrialOreCancel'){
      if(cmd.owner!=='st_nadir')return verwerfen('nur echter Auftraggeber darf stornieren');
      if(angebot){s.kanon.industrieErz={phase:'storniert'};return {ok:true,type};}
      if(i.phase!=='aktiv'||s.w3.auftrag?.phase!=='vorbestellt')
        return verwerfen('nach Lieferung nur ordentliche Abwicklung, keine Gratisstornierung');
      const mi=s.ships[i.miner];
      if(mi?.flug?.lage!=='angedockt'||Object.values(mi.ladung).some(x=>x!==0)
        ||s.erzpilotVertraege?.[mi.id])return verwerfen('bezahlte Arbeit oder Waren vorhanden');
      if(i.werftVerwendet||s.owners.k7_werft_treuhand?.cash!==K7_PREIS.werft)
        return verwerfen('bezahlte Werftleistung bereits begonnen');
      try{kern.industryOreCancel(s);}
      catch(e){return verwerfen(e.message);}
      m_core_buch.transfer(s,'k7_werft_treuhand','werft_extern',K7_PREIS.werft,'k7-werftreserve-rueck');
      const stop=kern.execute(s,{type:'shipWait',owner:'npc3',schiff:i.miner},rules);
      if(!stop.ok)throw Error('K7: gebuchtes Storno ohne Miner-Stopp: '+stop.reason);
      delete s.kanon.pendel[i.miner];
      s.kanon.industrieErz={phase:'storniert'};
      return {ok:true,type};
    }
    return verwerfen('unbekannte Vertragsaktion');
  }

  // K7 research-only: independent NPC signers use the existing validated K7
  // commands. The player's browser only changes the optional policy flag;
  // it cannot sign on behalf of NPC companies or create cash, ships or ore.
  function industrieAutoSchritt(s) {
    if (!k7 || s.kanon.industrieAuto !== true || s.kanon.politik.automatik !== true) return;
    const i = s.kanon.industrieErz, nadir = s.stations[rules.w5.station].lager;
    if (i.phase === 'aktiv' || i.phase === 'geliefert') {
      // Production may begin only after the existing physical Nadir arrival
      // and after full original W4 work funding has been checked.
      const amNadirGeliefert = i.phase === 'geliefert'
        || (s.w3.auftrag?.phase === 'rueck'
          && s.w3.auftrag?.industrieMiner === i.miner);
      if (i.erzAngenommen && amNadirGeliefert && !i.werftVerwendet) {
        if (!s.w4.auftrag && !s.w5.auftrag && !s.kanon.minerWerft?.auftrag
          && (nadir.material || 0) < rules.w5.material
          && (nadir.erz || 0) >= rules.w4.erzJeCharge) {
          const q = kern.pilotW4Kalkulation(s);
          if (q.ok) kern.execute(s, { type:'stationRefine', owner:rules.w4.station,
            station:rules.w4.station }, rules);
        }
        if (!s.w4.auftrag && !s.w5.auftrag && !s.kanon.minerWerft?.auftrag
          && (nadir.material || 0) >= rules.w5.material)
          k7Befehl(s, { type:'industrialOreBuildShip', owner:rules.w5.werft });
      }
      // The active contract must finish; the NPCs cannot replace its
      // signatures or issue a second W3 escrow in parallel.
      if (i.phase !== 'geliefert' || !i.werftVerwendet) return;
    }
    if (!['frei','storniert','geliefert'].includes(i.phase)
      || s.w3.auftrag || s.w5n.frachtauftrag || s.w4.auftrag || s.w5.auftrag
      || s.kanon.minerWerft?.auftrag) return;
    // A limited warehouse target is physical demand, not invented ISK.
    if ((nadir.frachter || 0) >= rules.world.stations[rules.w5.station].ziel.frachter)
      return;
    if (s.owners.npc3.cash < K7_PREIS.bergbau
      || s.owners.st_aldera.cash < K7_PREIS.alderakauf
      || s.owners.st_nadir.cash < K7_PREIS.nadiraufwand
      || s.owners.transport.cash < K7_PREIS.frachtlohn
      || s.owners.werft_extern.cash < K7_PREIS.werft) return;
    const miner = ids(s.ships).map(id=>s.ships[id]).find(sh =>
      sh.owner === 'npc3' && sh.klasse === 'miner' && sh.system === 'aldera'
      && sh.flug?.lage === 'angedockt' && !m_core_anlage.stillgelegt(s, sh)
      && ladungSumme(sh) === 0 && !s.erzpilotVertraege?.[sh.id]
      && (!s.kanon.pendel[sh.id] || s.kanon.pendel[sh.id].ware === 'erz'));
    const frachter = ids(s.ships).map(id=>s.ships[id]).find(sh =>
      sh.owner === 'transport' && sh.klasse === 'frachter'
      && sh.system === 'aldera' && sh.phase === 'dock'
      && sh.auftrag === 'halten' && !m_core_anlage.stillgelegt(s, sh)
      && ladungSumme(sh) === 0);
    if (!miner || !frachter) return;
    const befehle = [
      {type:'industrialOreOffer',owner:'st_nadir',miner:miner.id,frachter:frachter.id},
      {type:'industrialOreAcceptMine',owner:'npc3'},
      {type:'industrialOreAcceptFreight',owner:'transport'},
      {type:'industrialOreAcceptYard',owner:'werft_extern'},
      {type:'industrialOreCommit',owner:'st_nadir'},
    ];
    for (const cmd of befehle) {
      const r = k7Befehl(s, cmd);
      if (!r.ok) {
        if (s.kanon.industrieErz.phase === 'angebot')
          k7Befehl(s, {type:'industrialOreCancel',owner:'st_nadir'});
        return;
      }
    }
  }
  function industrieAutoSetzen(s, aktiviert) {
    pruefeForm(s);
    if (!k7) throw Error('K7-Automatik ist ausschließlich Regel200-Forschung');
    if (typeof aktiviert !== 'boolean') throw TypeError('K7-Automatik verlangt Boolean');
    s.kanon.industrieAuto = aktiviert;
    if (aktiviert) industrieAutoSchritt(s);
    return {ok:true, aktiviert};
  }

  function execute(state, cmd) {
    pruefeForm(state);
    const type = cmd && cmd.type;
    if(bauteile&&type==='stationBuildParts')
      return m_core_bauteile.ausfuehren(state,cmd);
    if(silizium&&['siliconMineStart','siliconSell'].includes(type))
      return m_core_silizium.ausfuehren(state,cmd);
    if(k7&&typeof type==='string'&&type.startsWith('industrialOre'))return k7Befehl(state,cmd);
    if (typeof type === 'string' && hat(FLUG.BEFEHLE, type)) return m_core_flugplan.befehl(state, cmd, false);
    if (type === 'shipGateCheck') return m_core_torfreigabe.check(state,cmd);
    if (type === 'shipFreightGateIce') return m_core_torfreigabe.starten(state,cmd);
    if (type === 'stationBuildMiner') return m_core_minerwerft.bauen(state, cmd);
    if (typeof type === 'string' && hat(m_core_kreislauf.BEFEHLE, type)) return m_core_kreislauf.ausfuehren(state, cmd);
    if (type === 'pilotWaterBuy')
      return { ok: false, type, reason: 'K1: Wasser nur am Wohnort über householdBuy; kein ortsloser Kauf' };
    const sh = cmd && typeof cmd.schiff === 'string' ? state.ships[cmd.schiff] : null;
    // Der ursprüngliche Wirtschaftskern kennt nur Dock und intersystemischen Transit.
    // Während echtem 2D-Freiflug keine wirtschaftlichen Dockbefehle auf dieselbe
    // Hülle anwenden: sonst würde eine Fracht ohne physische Andockung starten.
    if (sh?.klasse === 'frachter' && sh.flug?.lage !== 'angedockt')
      return { ok: false, type, reason: 'K1: Wirtschaftsauftrag nur mit physisch angedocktem Frachter' };
    if (sh && hat(state.kanon.pendel, sh.id) && ['shipMine', 'shipWait', 'shipSellIce'].includes(type))
      return { ok: false, type, reason: 'K1: laufender Pendelauftrag steuert Förderung und Abnahme' };
    if (sh && ['shipFreight', 'shipFreightIce'].includes(type) && m_core_anlage.stillgelegt(state, sh))
      return { ok: false, type, reason: 'K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen' };
    if (type === 'stationBuildShip' && state.kanon.minerWerft?.auftrag)
      return { ok: false, type, reason: 'K2: Werft baut einen Miner' };
    const r = kern.execute(state, cmd, rules);
    if (r.ok) {
      if (type === 'shipFreightIce' && sh?.owner === rules.economy.start.owner)
        m_core_spielerfracht.starten(state, sh);
      m_core_flugplan.koerperSync(state);
    }
    return r;
  }
  // Abschluss einer Wirtschaftsminute in fester Reihenfolge.
  function wirtschaftsMinute(state) {
    const vorher = {};
    for (const id of ids(state.ships)) vorher[id] = ladungSumme(state.ships[id]);
    const frachter = ids(state.ships).filter((id) => state.ships[id].klasse === 'frachter' && state.ships[id].phase === 'reise');
    const vorherEisauftrag = state.w5n.frachtauftrag
      ? { schiff: state.w5n.frachtauftrag.schiff } : null;
    const vorherEislohn = state.w5n.frachtLohn;
    const vorherEisgeliefert = state.w5n.eisGeliefert;
    const vorherEisgebuehr = state.w5n.frachtUmsatz;
    const ergebnis = kern.step(state, rules);
    m_core_spielerfracht.minute(state, vorherEisauftrag, vorherEislohn,
      vorherEisgeliefert, vorherEisgebuehr);
    if(k7&&state.kanon.industrieErz?.phase==='aktiv'
      &&state.w3.auftrag===null&&state.w3.abgeschlossen>0
      &&state.kanon.industrieErz.erzAngenommen)state.kanon.industrieErz.phase='geliefert';
    m_core_minerwerft.tick(state);
    if(silizium)m_core_silizium.minute(state);
    if(bauteile)m_core_bauteile.minute(state);
    m_core_flugplan.koerperSync(state);
    npcPendel(state);
    const gefoerdert = {};
    for (const id of ids(state.ships)) if (ladungSumme(state.ships[id]) > (vorher[id] ?? 0) && state.ships[id].klasse === 'miner') gefoerdert[id] = true;
    m_core_flugplan.minutenAbrechnung(state, gefoerdert);
    for (const id of frachter) state.kanon.verschleiss[id] = (state.kanon.verschleiss[id] || 0) + 1;
    m_core_kreislauf.rueckfracht(state);
    m_core_minerwerft.transport(state);
    // Signed K7-W5 reserve takes priority over discretionary NPC shipbuilding.
    industrieAutoSchritt(state);
    m_core_disponent.schritt(state);
    m_core_flugplan.koerperSync(state);
    m_core_flugplan.plan(state, true, true);
    return ergebnis;
  }
  function teilschritt(state) {
    pruefeForm(state);
    if (state.flug.schritt === 0) m_core_flugplan.plan(state, true, false);
    if (!FLUG.schritt(state)) { m_core_flugplan.plan(state, false, false); return null; }
    return wirtschaftsMinute(state);
  }
  function minute(state) {
    pruefeForm(state);
    if (state.flug.schritt === 0) {
      m_core_flugplan.plan(state, true, false);
      // Bitgleiche Abkürzung: ruhende Körper ändern sich in 60 Teilschritten nicht.
      if (m_core_flugplan.alleRuhend(state)) return wirtschaftsMinute(state);
    }
    let r = null;
    do { r = teilschritt(state); } while (r === null);
    return r;
  }
  function advance(state, minuten) {
    if (!ganz(minuten) || minuten > 1440 * 3650) throw RangeError('K1: ungültige Zahl an Wirtschaftsminuten');
    for (let i = 0; i < minuten; i++) minute(state);
  }
  function save(state) {
    const a = audit(state);
    if (!a.ok) throw Error('K1: ungültigen Zustand nicht speichern: ' + a.fehler.join('; '));
    return kern.save(state);
  }
  function load(json) {
    let roh;
    try { roh = JSON.parse(json); } catch (_) { throw Error('K1: JSON nicht lesbar'); }
    pruefeForm(roh);
    const state = kern.loadW5(json); // prüft Kernbilanzen einschließlich Netto-Korrektur
    const a = audit(state);
    if (!a.ok) throw Error('K1: Welt ungültig: ' + a.fehler.join('; '));
    return state;
  }

  // Lesender Bericht für Oberfläche, Tests und Szenarien; verändert nichts.
  function bericht(state) {
    const k = state.kanon, w5n = state.w5n, o = state.owners;
    const firmen = {};
    for (const f of ids(KANON.anteile)) firmen[f] = {
      kasse: o[f].cash, anlagewert: m_core_anlage.anlagewert(state, f), ruecklage: m_core_anlage.ruecklage(state, f),
      ausschuettbar: m_core_kreislauf.ausschuettbar(state, f),
      ausgeschuettet: m_core_buch.summe(state, 'dividende', (von) => von === f),
    };
    const haushalte = {};
    for (const h of ids(KANON.haushalte)) haushalte[h] = {
      kasse: o[h].cash, ausgegeben: k.haushalte[h]?.ausgegeben || 0, gekauft: k.haushalte[h]?.gekauft || 0,
    };
    const gebunden = ids(o).filter((id) => /treuhand|reserv|^k1_|^w5n_fracht|^w5n_fabrik|^erz_/.test(id)).reduce((n, id) => n + o[id].cash, 0);
    return {
      tick: state.tick, tag: Math.floor(state.tick / 1440), weltgeld: ids(o).reduce((n, id) => n + o[id].cash, 0),
      minted: state.minted, burned: state.burned, gebunden,
      kaeuferliquiditaet: { st_nadir: o.st_nadir.cash, st_aldera: o.st_aldera.cash, export: o.export.cash,
        haushalte: ids(KANON.haushalte).reduce((n, id) => n + o[id].cash, 0) },
      produktion: { eisGefoerdert: w5n.eisAbgebaut, erzGefoerdert: state.ledger.erz.mined, wasserProduziert: w5n.wasserProduziert,
        materialErzeugt: state.w4.materialErzeugt, frachterGebaut: state.w5.fertig,
        minerGebaut: k.minerWerft?.fertig || 0, minerGeliefert: k.minerWerft?.geliefert || 0 },
      verkaeufe: { eisAnAldera: w5n.mineVerkauft, wasserNadir: k.wasser.verkauftNadir, wasserAldera: k.wasser.verkauftAldera,
        wasserErloes: m_core_buch.summe(state, 'wasser-einzelhandel'), erzExportiert: state.ledger.erz.exported },
      auftraege: { eisfrachten: w5n.frachtAbgeschlossen, eisGeliefert: w5n.eisGeliefert,
        ...(k.spielerFrachten ? {
          spielerEisfracht: k.spielerFrachten.auftraege.filter((x) => x.end !== null).length,
          spielerFrachtAktiv: k.spielerFrachten.auftraege.some((x) => x.end === null)
        } : {}),
        erzfrachten: state.w3.abgeschlossen, wasserchargen: w5n.fabrikFertig,
        rueckfrachtWasser: k.wasser.rueckGeliefert },
      loehne: { bergbau: w5n.mineLohn + state.ledger.erz.mined * rules.erzpilot.minerJeMinute,
        frachtpiloten: state.w5ag.paid.erz + state.w5ag.paid.eis, wasserwerk: w5n.fabrikBezahlt,
        minerflug: m_core_buch.summe(state, 'fluglohn'),
        ...(k.spielerFrachten
          ? { spielerFrachtpilot: m_core_buch.summe(state, 'spielerfracht-pilot') } : {}) },
      dividenden: m_core_buch.summe(state, 'dividende'),
      inventar: { eisAldera: state.stations.st_aldera.lager.eis || 0, eisNadir: state.stations.st_nadir.lager.eis || 0,
        wasserNadir: state.stations.st_nadir.lager.wasser || 0, wasserAldera: state.stations.st_aldera.lager.wasser || 0,
        wasserUnterwegs: k.rueckfracht ? k.rueckfracht.menge : 0,
        minerLager: state.stations.st_aldera.lager.miner || 0, frachterLager: (state.stations.st_aldera.lager.frachter || 0) + (state.stations.st_nadir.lager.frachter || 0) },
      schiffe: ids(state.ships).map((id) => { const sh = state.ships[id]; return { id, owner: sh.owner, klasse: sh.klasse,
        aktivMinuten: m_core_anlage.aktiv(state, id), buchwert: m_core_anlage.buchwert(state, sh), stillgelegt: m_core_anlage.stillgelegt(state, sh) }; }),
      ersatzkaeufe: k.ersatzkaeufe, minerWerft: k.minerWerft || null, firmen, haushalte,
      engpass: k.engpass ? { erster: k.engpass.erster, zaehler: k.engpass.zaehler } : null,
    };
  }

  return Object.freeze({
    ...(k7 ? {f7Werftfrachter:true} : {}),
    ...(silizium ? {j2bSilizium:true,siliziumFeld:rules.j2b.feld} : {}),
    ...(bauteile ? {j3Bauteile:true} : {}),
    rules, daten: KANON, regel: rules.rulesVersion, modell: KANON.modell,
    createState, politikSetzen, industrieAutoSetzen, execute, teilschritt, minute, advance, audit, save, load, bericht,
    hash: kern.hash, canonical: kern.canonical, flugKern: FLUG, kern,
    torPruefen: m_core_torfreigabe.pruefen, torFrachtPruefen: m_core_torfreigabe.darfFracht,
    ruht: m_core_flugplan.ruht, ausschuettbar: m_core_kreislauf.ausschuettbar,
    buchwert: (state, id) => m_core_anlage.buchwert(state, state.ships[id]),
  });
}

// J3: Keine Migration des alten 201-Saves im Ladepfad. Nur ein explizit
// gewaehlter, vollstaendig gepruefter Quellstand erhaelt neue leere Felder.
function ausRegel201J3(json){
  if(typeof json!=='string'||json.length>5*1024*1024)
    throw Error('J3: ungültiges Quell-JSON');
  const raw=JSON.parse(json),p=raw.w5ad?.profile;
  if(raw.rulesVersion!==201||raw.schema!==8
    ||!Number.isSafeInteger(p?.carrierCash)||!Number.isSafeInteger(p?.buyerCash))
    throw Error('J3: ausschliesslich Regel201 mit belegtem Kapital');
  const kapital={carrierCash:p.carrierCash,buyerCash:p.buyerCash};
  const quelle=erstellen(kapital,true,true),alt=quelle.load(json),
    quellHash=quelle.hash(alt);
  const ziel=erstellen(kapital,true,true,true),
    neu=JSON.parse(quelle.canonical(alt));
  if(neu.ledger.bauteil||neu.stations.st_nadir.lager.bauteil!==undefined
    ||neu.kanon.bauteile||neu.owners.j3_bauteil_arbeiter)
    throw Error('J3: fremdes Bauteil-/Besitz-Startkapital');
  neu.rulesVersion=202;
  neu.ledger.bauteil={initial:0,mined:0,produced:0,consumed:0,imported:0,exported:0};
  neu.stations.st_nadir.lager.bauteil=0;
  neu.kanon.bauteile={begonnen:0,abgeschlossen:0,materialVerbraucht:0,
    siliziumVerbraucht:0,bauteile:0,arbeitsGebunden:0,
    arbeitsGezahlt:0,belege:[],auftrag:null};
  neu.owners.j3_bauteil_arbeiter={id:'j3_bauteil_arbeiter',kind:'labor',cash:0};
  const zustand=ziel.load(ziel.canonical(neu));
  if(quelle.hash(alt)!==quellHash)throw Error('J3: ursprünglicher Hash verändert');
  return {welt:ziel,zustand,quellHash};
}

// J2b: expliziter, nicht automatisch migrierender 200→201-Forschungsversuch.
function ausRegel200J2b(json) {
  if(typeof json!=='string'||json.length>5*1024*1024)
    throw Error('J2b: ungültiges Regel200-Quell-JSON');
  const raw=JSON.parse(json),p=raw.w5ad?.profile;
  if(raw.rulesVersion!==200||raw.schema!==8
    ||!Number.isSafeInteger(p?.carrierCash)||!Number.isSafeInteger(p?.buyerCash))
    throw Error('J2b: nur Regel200 mit belegtem Startkapital');
  const kapital={carrierCash:p.carrierCash,buyerCash:p.buyerCash};
  const quelle=erstellen(kapital,true),alt=quelle.load(json),quellHash=quelle.hash(alt);
  const ziel=erstellen(kapital,true,true),neu=JSON.parse(quelle.canonical(alt));
  if(neu.ledger.silizium||neu.stations.st_nadir.lager.silizium!==undefined
    ||neu.kanon.silizium)throw Error('J2b: versteckte Siliziumquelle');
  neu.rulesVersion=201;
  neu.ledger.silizium={initial:0,mined:0,produced:0,consumed:0,imported:0,exported:0};
  neu.stations.st_nadir.lager.silizium=0;
  neu.kanon.silizium={vorrat:ziel.rules.j2b.feld.vorrat,auftraege:0,gefoerdert:0,
    verkauft:0,arbeitsMinuten:0,belege:[],auftrag:null};
  const zustand=ziel.load(ziel.canonical(neu));
  if(quelle.hash(alt)!==quellHash)throw Error('J2b: Quelle unerwartet verändert');
  return {welt:ziel,zustand,quellHash};
}

// K7: nur auf ausdrücklichen Aufruf eine unabhängig geprüfte Rule199-Quelle
// in ein SEPARATES Forschungsregel200-Objekt kopieren. Das Quell-JSON bleibt unverändert.
function ausRegel199K7(json) {
  if(typeof json!=='string'||json.length>5*1024*1024)throw Error('K7: JSON-Größe');
  const quelle=erstellen(),alt=quelle.load(json),quellHash=quelle.hash(alt);
  if(alt.w3.auftrag||Object.keys(alt.erzpilotVertraege||{}).length)
    throw Error('K7: nur vertragsfreie Ursprungswelt explizit übernehmen');
  const profil=alt.w5ad?.profile;
  if(!profil||!ganzZahl(profil.carrierCash)||!ganzZahl(profil.buyerCash))
    throw Error('K7: nicht belegte Anfangsfinanzierung');
  const welt=erstellen({carrierCash:profil.carrierCash,buyerCash:profil.buyerCash},true);
  const s=JSON.parse(json);
  s.rulesVersion=200;s.w3.storniert=0;s.w3.stornoRueckzahlung=0;
  s.kanon.industrieErz={phase:'frei'};
  const a=welt.audit(s);
  if(!a.ok)throw Error('K7: Forschungstransfer verletzt Buch-/Eigentumsaudit: '+a.fehler.join('; '));
  if(quelle.hash(alt)!==quellHash)throw Error('K7: Quellstand manipuliert');
  return {welt,zustand:s,quellHash};
}
const ganzZahl=n=>Number.isSafeInteger(n)&&n>=0;

// Ausdrückliche, vollständig geprüfte Übernahme eines Regel195-Standes (Schema 8) in K1.
// Nie automatisch: der Aufrufer übergibt das exportierte JSON. Der Regel195-Stand selbst
// bleibt unverändert; ein Rückweg existiert nur über die aufbewahrte Originaldatei.
function ausRegel195(json) {
  if (typeof json !== 'string' || json.length > 5 * 1024 * 1024) throw Error('K1-Migration: ungültige JSON-Größe');
  let alt;
  try { alt = JSON.parse(json); } catch (_) { throw Error('K1-Migration: JSON nicht lesbar'); }
  if (alt === null || typeof alt !== 'object' || alt.rulesVersion !== 195 || alt.schema !== 8)
    throw Error('K1-Migration: nur Regel195 / Schema 8; andere Stände bleiben unverändert aufbewahrt');
  const profil = alt.w5ad && alt.w5ad.profile;
  if (!profil || !Number.isSafeInteger(profil.carrierCash) || !Number.isSafeInteger(profil.buyerCash))
    throw Error('K1-Migration: Anfangskapital des Standes nicht belegt');
  const kapital = { carrierCash: profil.carrierCash, buyerCash: profil.buyerCash };
  // 1. Der unveränderte Regel195-Kern prüft den Quellstand vollständig.
  const quelle = FACTORY.createPrivateWageResearch(kapital);
  const geprueft = quelle.core.loadW5(json);
  const quellHash = quelle.core.hash(geprueft);
  // 2. Zielwelt mit demselben Anfangskapital; nur additive Felder und verdichtete Belege.
  const welt = erstellen(kapital);
  const neu = JSON.parse(quelle.core.canonical(geprueft));
  if (neu.flug !== undefined || neu.kanon !== undefined) throw Error('K1-Migration: fremde Felder im Regel195-Stand');
  for (const id of Object.keys(neu.ships)) if (neu.ships[id].flug !== undefined) throw Error('K1-Migration: fremder Flugkörper');
  neu.rulesVersion = welt.regel;
  const leer = welt.createState(1);
  for (const id of Object.keys(leer.owners)) {
    if (!Object.hasOwn(neu.owners, id)) {
      if (leer.owners[id].cash !== 0) throw Error('K1-Migration: neues Konto mit Geld');
      neu.owners[id] = { ...leer.owners[id] };
    }
  }
  if (Object.hasOwn(neu.stations.st_aldera.lager, 'wasser')) throw Error('K1-Migration: unerwarteter Wasserbestand');
  neu.stations.st_aldera.lager.wasser = 0;
  neu.flug = { schritt: 0 };
  neu.kanon = JSON.parse(JSON.stringify(leer.kanon));
  neu.kanon.pendel = {};
  // Belegverdichtung: gleiche Summen, keine Minutenliste (Kern prüft Summe je Vertrag).
  const fertig = neu.w5ag.iceContracts.filter((c) => c.end !== null);
  neu.w5ag.iceContracts = neu.w5ag.iceContracts.filter((c) => c.end === null);
  neu.w5ag.eisFertig = fertig.length;
  neu.w5ag.payments = [];
  // Körper: Schiffe im Dock bleiben im Dock (auch mit Förderauftrag – gefördert wird erst im Feld),
  // Schiffe in bezahlter Kernreise sind im Transit. Keine Position wird erfunden.
  for (const id of Object.keys(neu.ships).sort()) {
    const sh = neu.ships[id];
    if (!Object.hasOwn(FLUG.DATEN.klassen, sh.klasse) || !Object.hasOwn(FLUG.DATEN.systeme, sh.system))
      throw Error('K1-Migration: Schiff ohne bekannten Ort ' + id);
    sh.flug = FLUG.koerperAngedockt(sh.system);
    if (sh.phase === 'reise') { sh.flug.lage = 'transit'; sh.flug.anker = null; }
    else if (sh.phase !== 'dock') throw Error('K1-Migration: unbekannte Schiffsphase ' + id);
  }
  const zustand = welt.load(welt.canonical(neu)); // Kern- und K1-Audit des Zielstands
  // 3. Unabhängiger Erhaltungsnachweis Feld für Feld.
  const gleich = (a, b) => quelle.core.canonical(a) === quelle.core.canonical(b);
  const ohneFlug = (ships) => Object.fromEntries(Object.keys(ships).map((id) => { const { flug, ...rest } = ships[id]; return [id, rest]; }));
  const altKonten = Object.keys(geprueft.owners);
  const nachweis = {
    quellRegel: 195, zielRegel: welt.regel, quellHash, zielHash: welt.hash(zustand), tick: zustand.tick,
    geldGleich: altKonten.every((id) => zustand.owners[id].cash === geprueft.owners[id].cash)
      && Object.keys(zustand.owners).filter((id) => !altKonten.includes(id)).every((id) => zustand.owners[id].cash === 0),
    weltgeld: Object.values(zustand.owners).reduce((n, o) => n + o.cash, 0),
    warenGleich: Object.keys(geprueft.stations).every((id) => {
      const { wasser, ...rest } = zustand.stations[id].lager;
      return id === 'st_aldera' ? wasser === 0 && gleich(rest, geprueft.stations[id].lager) : gleich(zustand.stations[id].lager, geprueft.stations[id].lager);
    }) && gleich(zustand.ledger, geprueft.ledger),
    schiffeGleich: gleich(ohneFlug(zustand.ships), geprueft.ships),
    vertraegeGleich: gleich(zustand.erzpilotVertraege, geprueft.erzpilotVertraege) && gleich(zustand.w3, geprueft.w3)
      && gleich(zustand.w4, geprueft.w4) && gleich(zustand.w5, geprueft.w5) && gleich(zustand.w5n, geprueft.w5n)
      && gleich(zustand.w5ac, geprueft.w5ac) && gleich(zustand.w5ad, geprueft.w5ad) && gleich(zustand.w5ae, geprueft.w5ae),
    loehneGleich: gleich(zustand.w5ag.paid, geprueft.w5ag.paid),
    zufallGleich: zustand.rng === geprueft.rng && zustand.tick === geprueft.tick && zustand.nextShip === geprueft.nextShip,
  };
  for (const feld of ['geldGleich', 'warenGleich', 'schiffeGleich', 'vertraegeGleich', 'loehneGleich', 'zufallGleich'])
    if (nachweis[feld] !== true) throw Error('K1-Migration: Erhaltungsnachweis fehlgeschlagen (' + feld + ')');
  return { welt, zustand, kapital, nachweis };
}

const api = Object.freeze({ erstellen, erstellenK7:(kapital={})=>erstellen(kapital,true),
  erstellenJ2b:(kapital={})=>erstellen(kapital,true,true),
  erstellenJ3:(kapital={})=>erstellen(kapital,true,true,true),
  ausRegel195, ausRegel199K7, ausRegel200J2b, ausRegel201J3,
  DATEN: m_data_kanon.KANON, REGEL: m_data_kanon.KANON.regel, SCHRITTE: FLUG.DATEN.schritteJeMinute });
if (NODE) module.exports = api; else scope.AphrosWelt = api;
})(globalThis);
