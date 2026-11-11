// Entwicklungswerkzeug (kein Spielbestandteil): wirtschaftlich unterschiedliche Szenarien
// der kanonischen Welt K1. Jedes Szenario ändert Eingangsbedingungen (Kapital, Verhalten,
// Störungen) – nicht nur den Zufallsstartwert. Ausgabe: `node tools/welt-szenarien.mjs [--tage 90]`.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');

const HAUSHALTE = Object.keys(Welt.DATEN.haushalte);
const EIGNER = HAUSHALTE.filter((id) => id.startsWith('eigner_'));
const alle = (ids, wert) => Object.fromEntries(ids.map((id) => [id, wert]));
const FIRMEN = Object.keys(Welt.DATEN.anteile);

// Verhalten der Spielerfirma ist in jedem Szenario ausdrücklich gesetzt. „aktiv“: die Firma schüttet
// ihren freien Überschuss aus und die Privatkonten des Spielers geben ihr Einkommen aus.
const SPIELER = Object.freeze(['eigner_house', 'pilot_house']);
const aktiv = (extra = {}, quote = 0) => ({ ...extra, ausschuettung: { house: 1000, ...(extra.ausschuettung || {}) },
  sparquote: { ...alle(SPIELER, quote), ...(extra.sparquote || {}) } });

// ereignisse: [{ tag, politik } | { tag, pendel: 'stop'|'start' } | { tag, verlust: 'frachter' }]
export const SZENARIEN = Object.freeze([
  { id: 'S01', titel: 'Basis: alle Einkommen werden freiwillig ausgegeben, Spielerfirma schüttet aus',
    politik: aktiv() },
  { id: 'S02', titel: 'Spieler spart unbegrenzt: Firma thesauriert, Privatkonten geben nichts aus',
    politik: {} },
  { id: 'S03', titel: 'Kapitalhortung: alle Firmen thesaurieren, Haushalte haben nur Löhne',
    politik: { ausschuettung: alle(FIRMEN, 0), sparquote: alle(SPIELER, 0) } },
  { id: 'S04', titel: 'Haushalte sparen 30 % jedes Einkommens dauerhaft',
    politik: aktiv({ sparquoteStandard: 300 }, 300) },
  { id: 'S05', titel: 'Haushalte sparen 60 % jedes Einkommens dauerhaft',
    politik: aktiv({ sparquoteStandard: 600 }, 600) },
  { id: 'S06', titel: 'Eigentümer horten alle Ausschüttungen, Arbeiter konsumieren',
    politik: aktiv({ sparquote: alle(EIGNER, 1000) }) },
  { id: 'S07', titel: 'Knappe Käuferliquidität: Nadir startet mit 600 ISK',
    kapital: { carrierCash: 2000, buyerCash: 600 }, politik: aktiv({ betriebsreserve: { st_nadir: 590 } }) },
  { id: 'S08', titel: 'Unterkapitalisierte Spedition: 760 ISK reichen nur für die Hülle',
    kapital: { carrierCash: 760, buyerCash: 4000 }, politik: aktiv() },
  { id: 'S09', titel: 'Begrenzte Nachfrage: Sättigung bei 20 Wasser je Haushalt und Tag',
    politik: aktiv({ bedarfJeTag: 20 }) },
  { id: 'S10', titel: 'Rohstoffausfall: Eisförderung ruht von Tag 30 bis 45',
    politik: aktiv(), ereignisse: [{ tag: 30, pendel: 'stop' }, { tag: 45, pendel: 'start' }] },
  { id: 'S11', titel: 'Transportunterbrechung: keine Eisfracht von Tag 30 bis 45',
    politik: aktiv(),
    ereignisse: [{ tag: 30, politik: { eisfracht: false } }, { tag: 45, politik: { eisfracht: true } }] },
  { id: 'S12', titel: 'Verschleiß mit Stilllegung und real finanziertem Ersatz',
    politik: aktiv({ stilllegung: true, werftVorrat: 1, spielerErsatz: true }) },
  { id: 'S13', titel: 'Schiffverlust an Tag 20 und Ersatz aus eigener Kasse',
    politik: aktiv({ werftVorrat: 1 }), ereignisse: [{ tag: 20, verlust: 'frachter' }] },
  { id: 'S14', titel: 'Ungleiches Anfangskapital: Spieler 7.000, Spedition 1.000, Nadir 1.000 ISK',
    kapital: { carrierCash: 1000, buyerCash: 1000 }, politik: aktiv() },
  { id: 'S15', titel: 'Käuferkonkurrenz um knappes Wasser: Aldera erhält keine Rückfracht',
    politik: aktiv({ rueckfracht: false }) },
]);

const szenarioVon = (id) => {
  const s = SZENARIEN.find((x) => x.id === id);
  if (!s) throw Error('Unbekanntes Szenario ' + id);
  return s;
};

export function vorbereiten(szenario, seed = 42) {
  const welt = Welt.erstellen(szenario.kapital || {});
  const state = welt.createState(seed, { politik: szenario.politik || {} });
  const protokoll = [];
  const befehl = (cmd) => { const r = welt.execute(state, cmd); protokoll.push({ type: cmd.type, ok: r.ok, grund: r.reason || null }); return r; };
  // Gründung ausschließlich über validierte Befehle aus vorhandenem Kapital.
  befehl({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  const kauf = befehl({ type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' });
  let miner = null;
  if (kauf.ok) {
    miner = Object.values(state.ships).filter((sh) => sh.owner === 'house' && sh.klasse === 'miner').at(-1).id;
    befehl({ type: 'shipShuttle', owner: 'house', schiff: miner, ware: 'eis' });
  }
  return { welt, state, protokoll, befehl };
}

function ereignis(lauf, e) {
  const { welt, state, befehl } = lauf;
  if (e.politik) welt.politikSetzen(state, e.politik);
  if (e.pendel) {
    const eigene = Object.values(state.ships).filter((sh) => sh.owner === 'house' && sh.klasse === 'miner');
    for (const sh of eigene) {
      if (e.pendel === 'stop' && state.kanon.pendel[sh.id]) befehl({ type: 'shipShuttleStop', owner: 'house', schiff: sh.id });
      // Wiederaufnahme nur aus dem Dock: der Befehl wird erst dort angenommen.
      if (e.pendel === 'start') lauf.pendelWunsch = true;
    }
  }
  // Verlust nur am freien, leeren Schiff im Dock: laufende, bezahlte Fracht wird erst beendet.
  if (e.verlust === 'frachter') { lauf.verlustWunsch = true; welt.politikSetzen(state, { eisfracht: false }); }
}
// Wünsche, die erst bei gültigem Ort/Zustand als Befehl angenommen werden.
function wuensche(lauf) {
  const { state, befehl } = lauf;
  if (lauf.pendelWunsch) for (const sh of Object.values(state.ships)) {
    if (sh.owner !== 'house' || sh.klasse !== 'miner' || state.kanon.pendel[sh.id] || sh.flug.lage !== 'angedockt') continue;
    if (lauf.welt.buchwert(state, sh.id) === 0 && state.kanon.politik.stilllegung) continue;
    if (befehl({ type: 'shipShuttle', owner: 'house', schiff: sh.id, ware: 'eis' }).ok) lauf.pendelWunsch = false;
  }
  if (lauf.verlustWunsch) {
    const sh = Object.values(state.ships).find((x) => x.owner === 'transport' && x.klasse === 'frachter'
      && x.phase === 'dock' && x.system === 'aldera' && x.auftrag === 'halten' && Object.values(x.ladung).every((n) => n === 0));
    if (sh && befehl({ type: 'researchShipLoss', owner: 'transport', schiff: sh.id }).ok) {
      lauf.verlustWunsch = false; lauf.verlustTick = state.tick; lauf.welt.politikSetzen(state, { eisfracht: true });
    }
  }
}

export function ausfuehren(id, tage, seed = 42, optionen = {}) {
  const szenario = typeof id === 'string' ? szenarioVon(id) : id;
  const lauf = vorbereiten(szenario, seed);
  const { welt, state } = lauf;
  const reihe = [];
  let vorWasser = 0, letzterVerkaufTag = 0, letzteFrachtTag = 0, vorFracht = 0;
  // Engpasszähler je Tag: die bindende Ursache ist die häufigste Ablehnung NACH dem letzten Absatz
  // (bzw. der letzten sieben Tage), nicht die triviale Anlaufmeldung der ersten Stunde.
  const engpassTage = [{}];
  for (let tag = 1; tag <= tage; tag++) {
    for (const e of szenario.ereignisse || []) if (e.tag === tag) ereignis(lauf, e);
    if (lauf.pendelWunsch || lauf.verlustWunsch) {
      for (let m = 0; m < 1440; m++) { wuensche(lauf); welt.minute(state); }
    } else welt.advance(state, 1440);
    const pruefung = welt.audit(state);
    if (!pruefung.ok) throw Error(szenario.id + ' Tag ' + tag + ': Audit ' + pruefung.fehler.join('; '));
    const b = welt.bericht(state);
    const wasser = b.verkaeufe.wasserNadir + b.verkaeufe.wasserAldera;
    if (wasser > vorWasser) letzterVerkaufTag = tag;
    if (b.auftraege.eisfrachten > vorFracht) letzteFrachtTag = tag;
    reihe.push({ tag, wasserTag: wasser - vorWasser, frachtenTag: b.auftraege.eisfrachten - vorFracht,
      nadir: b.kaeuferliquiditaet.st_nadir, haushalte: b.kaeuferliquiditaet.haushalte });
    vorWasser = wasser; vorFracht = b.auftraege.eisfrachten;
    engpassTage.push(b.engpass ? { ...b.engpass.zaehler } : {});
    if (optionen.zwischen) optionen.zwischen(tag, welt, state, b);
  }
  const b = welt.bericht(state);
  const o = state.owners;
  const letzte = reihe.slice(-7);
  const mittel = (feld) => Math.round(letzte.reduce((n, x) => n + x[feld], 0) / letzte.length * 10) / 10;
  const tauglicheFrachter = b.schiffe.filter((s) => s.owner === 'transport' && s.klasse === 'frachter' && !s.stillgelegt).length;
  const handlungsunfaehig = [];
  if (o.st_nadir.cash < 490 && !state.w5n.frachtauftrag) handlungsunfaehig.push('st_nadir: ' + o.st_nadir.cash + ' ISK < 490 ISK für Eis + Hin-/Rückfracht');
  if (tauglicheFrachter === 0) handlungsunfaehig.push('transport: kein einsatzfähiger Frachter');
  else if (o.transport.cash < 120 && !state.w5n.frachtauftrag) handlungsunfaehig.push('transport: ' + o.transport.cash + ' ISK < 120 ISK Flugarbeit');
  if (!b.schiffe.some((s) => s.owner === 'house' && s.klasse === 'miner' && !s.stillgelegt)) handlungsunfaehig.push('house: kein einsatzfähiger Miner');
  else if (o.house.cash < 140) handlungsunfaehig.push('house: ' + o.house.cash + ' ISK < 140 ISK Förder- und Flugarbeit');
  const ab = letzterVerkaufTag < tage ? letzterVerkaufTag : Math.max(0, tage - 7);
  const basis = engpassTage[ab] || {};
  const zaehler = Object.entries(engpassTage.at(-1)).map(([grund, n]) => [grund, n - (basis[grund] || 0)])
    .filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
  return {
    id: szenario.id, titel: szenario.titel, tage, seed, hash: welt.hash(state),
    weltgeld: b.weltgeld, emission: b.minted, senke: b.burned,
    kaeuferliquiditaet: b.kaeuferliquiditaet,
    spielerPrivat: SPIELER.reduce((n, id) => n + o[id].cash, 0), // Eigentümer- und Pilotenkonto des Spielers
    produktion: b.produktion, verkaeufe: b.verkaeufe, auftraege: b.auftraege, loehne: b.loehne,
    dividenden: b.dividenden,
    kassen: Object.fromEntries(FIRMEN.map((f) => [f, b.firmen[f].kasse])),
    ruecklagen: Object.fromEntries(FIRMEN.map((f) => [f, b.firmen[f].ruecklage])),
    inventar: b.inventar, ersatzkaeufe: b.ersatzkaeufe, frachterGebaut: b.produktion.frachterGebaut,
    schiffe: b.schiffe.map((s) => s.id + ':' + s.owner + ':' + s.klasse + ':' + s.buchwert + (s.stillgelegt ? ':stillgelegt' : '')),
    letzterWasserverkaufTag: letzterVerkaufTag, letzteEisfrachtTag: letzteFrachtTag,
    wasserJeTagLetzte7: mittel('wasserTag'), frachtenJeTagLetzte7: mittel('frachtenTag'),
    laeuftAmEnde: mittel('wasserTag') > 0 && mittel('frachtenTag') > 0,
    handlungsunfaehig,
    bindenderEngpass: zaehler.length ? zaehler[0][0] : null, engpassAbTag: ab,
    haeufigsteEngpaesse: zaehler.slice(0, 3).map(([grund, n]) => ({ grund, n })),
    gruendung: lauf.protokoll.slice(0, 3),
    reihe,
  };
}

export function tabellenzeile(r) {
  const z = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const k = r.kaeuferliquiditaet, l = r.loehne;
  return '| ' + [r.id, r.titel, r.laeuftAmEnde ? 'läuft' : 'steht seit Tag ' + (r.letzterWasserverkaufTag + 1),
    z(k.st_nadir) + ' / ' + z(k.st_aldera) + ' / ' + z(k.haushalte),
    z(r.produktion.eisGefoerdert) + ' / ' + z(r.produktion.wasserProduziert),
    z(r.verkaeufe.wasserNadir + r.verkaeufe.wasserAldera) + ' (' + z(r.verkaeufe.wasserErloes) + ' ISK)',
    z(r.auftraege.eisfrachten) + ' / ' + z(r.auftraege.wasserchargen),
    z(l.bergbau + l.frachtpiloten + l.wasserwerk + l.minerflug),
    FIRMEN.map((f) => z(r.kassen[f])).join(' / '),
    z(r.inventar.eisAldera + r.inventar.eisNadir) + ' / ' + z(r.inventar.wasserNadir + r.inventar.wasserAldera),
    r.ersatzkaeufe + ' / ' + r.frachterGebaut,
    r.handlungsunfaehig.length ? r.handlungsunfaehig.join('; ') : '–',
    r.emission, r.bindenderEngpass || '–'].join(' | ') + ' |';
}
export const TABELLENKOPF = '| Nr. | Szenario | Zustand am Ende | Käuferliquidität Nadir / Aldera / Haushalte | Eis gefördert / Wasser produziert | Wasser tatsächlich verkauft | Eisfrachten / Wasserchargen | Löhne gesamt | Kassen ' + FIRMEN.join(' / ') + ' | Lager Eis / Wasser | Ersatzkäufe / gebaute Frachter | Handlungsunfähig | Emission | Bindender Engpass |\n| ' + Array(14).fill('---').join(' | ') + ' |';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name, std) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : std; };
  const tage = Number(arg('--tage', 90)), nur = arg('--nur', null), markdown = process.argv.includes('--markdown');
  if (markdown) console.log(TABELLENKOPF);
  for (const s of SZENARIEN) {
    if (nur && !nur.split(',').includes(s.id)) continue;
    const t = Date.now();
    const { reihe, ...kurz } = ausfuehren(s.id, tage);
    console.log(markdown ? tabellenzeile(kurz) : JSON.stringify({ ...kurz, rechenzeitMs: Date.now() - t }));
  }
}
