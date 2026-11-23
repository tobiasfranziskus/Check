/* Aphros Void · Flug2D-Forschungskern [ANALYSE – nicht integriert, keine Regelversion].
 * Kandidat fuer m_data_flug + m_core_flug im gemeinsamen Core (siehe docs/FLUG2D_INTEGRATIONSENTWURF.md).
 * Reine Ganzzahl-Kinematik: kein Geld, keine Ware, kein Treibstoff, kein RNG, keine Uhrzeit, kein DOM.
 * Spieler und NPC benutzen dieselben Befehle und denselben Integrator.
 */
(function(scope){
'use strict';

const m_data_flug = (() => {
  // sin(2*pi*i/256)*16384 fuer i=0..64 als Literale: keine Laufzeit-Trigonometrie,
  // damit V8 (Node/Chromium) und JavaScriptCore (iPad Safari) bitgleich rechnen.
  const VIERTEL = Object.freeze([0,402,804,1205,1606,2006,2404,2801,3196,3590,3981,4370,4756,5139,5520,5897,
    6270,6639,7005,7366,7723,8076,8423,8765,9102,9434,9760,10080,10394,10702,11003,11297,
    11585,11866,12140,12406,12665,12916,13160,13395,13623,13842,14053,14256,14449,14635,14811,14978,
    15137,15286,15426,15557,15679,15791,15893,15986,16069,16143,16207,16261,16305,16340,16364,16379,16384]);
  function tiefFrieren(obj) {
    if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    for (const k of Object.keys(obj)) tiefFrieren(obj[k]);
    return obj;
  }
  // Alle Zahlen sind Forschungsparameter [OPTION], keine Balancingfreigabe.
  // Laenge in Punkten (P), Geschwindigkeit in P je Flugschritt, Kurs in 1/256-Umdrehungen
  // (0 = +x, 64 = +y; y waechst auf dem Bildschirm nach unten). Die Einheit ist bewusst fein:
  // bei Schub 32 P/Schritt² bleibt auch die kleinere Geschwindigkeitskomponente ganzzahlig aufloesbar.
  const FLUG = tiefFrieren({
    schritteJeMinute: 60, // 1 Flugschritt = 1 Spielsekunde; 60 Schritte = 1 Core-Tick
    richtungen: 256, einheit: 16384, raumRadius: 6400000,
    klassen: {
      miner: { vmax: 1920, schub: 32, bremse: 64, drehrate: 4 },
      frachter: { vmax: 1440, schub: 32, bremse: 48, drehrate: 2 },
      jaeger: { vmax: 4160, schub: 128, bremse: 160, drehrate: 10 },
    },
    andocken: { radius: 48000, tempo: 192, schritte: 40 },
    abbau: { tempo: 96 },
    punktHalt: 3200, kriechfahrt: 5, drehenVorSchub: 32,
    systeme: {
      aldera: {
        station: { id: 'st_aldera', x: 0, y: 0 },
        felder: [
          { id: 'aldera:erz', ware: 'erz', x: 960000, y: -384000, radius: 144000 },
          { id: 'aldera:eis', ware: 'eis', x: -672000, y: 832000, radius: 144000 },
        ],
      },
      nadir: { station: { id: 'st_nadir', x: 0, y: 0 }, felder: [] },
      // W6/Rule206+: Research-only Dravos field, not active in 204.
      dravos: {station:{id:'st_dravos',x:0,y:0},felder:[
        {id:'dravos:silizium',ware:'silizium',x:720000,y:-480000,radius:144000}
      ]},
    },
  });
  return { VIERTEL, FLUG };
})();

const m_core_flug = (() => {
const { VIERTEL, FLUG } = m_data_flug;
const KOERPER = ['andocken', 'anker', 'kurs', 'lage', 'modus', 'rest', 'sollFahrt', 'sollKurs', 'vx', 'vy', 'x', 'y', 'ziel'];
const LAGEN = ['angedockt', 'frei', 'andocken', 'abdocken', 'transit'];
const BEFEHLE = Object.freeze({
  shipOrbit: ['schiff', 'zielArt', 'ziel', 'radius', 'x', 'y'],
  shipFollow: ['schiff', 'ziel', 'abstand'], shipLock: ['schiff', 'zielArt', 'ziel'],
  shipUnlock: ['schiff'],
  shipSteer: ['schiff', 'kurs', 'fahrt'], shipApproach: ['schiff', 'zielArt', 'ziel'],
  shipFlyTo: ['schiff', 'x', 'y'], shipDock: ['schiff', 'station'], shipUndock: ['schiff'],
});
const ganz = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;

function sin(i) {
  const k = i & 255, q = k & 63, s = k >> 6;
  return s === 0 ? VIERTEL[q] : s === 1 ? VIERTEL[64 - q] : s === 2 ? 0 - VIERTEL[q] : 0 - VIERTEL[64 - q];
}
// Abschneiden zur Null ohne negatives Null-Ergebnis: der Zustand enthaelt nie -0 und ist damit
// im Speicher exakt gleich seiner JSON-Fassung.
const kuerzen = (v) => Math.trunc(v) + 0;
const cos = (i) => sin(i + 64);
// Exakte ganzzahlige Wurzel; die Korrekturschleifen machen das Ergebnis unabhaengig
// von der letzten Stelle der Plattform-Wurzel.
function isqrt(n) {
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}
// Identisches Maximum des ganzzahligen Skalarprodukts ohne 256er-Vollsuche.
// Auf jedem 90-Grad-Sektor sind die Nachbar-Steigungsverhaeltnisse der
// eingefrorenen VIERTEL-Tabelle monoton (vgl. flug2d-richtung.test.mjs).
// Deshalb ist das Skalarprodukt im passenden Quadranten unimodal.
// Gleichstand: immer die kleinste Original-ID, einschliesslich 0 vor 255.
function richtungZu(dx, dy) {
  if (dx === 0 && dy === 0) return 0;
  let links, rechts;
  if (dx >= 0 && dy >= 0) { links = 0; rechts = 64; }
  else if (dx < 0 && dy >= 0) { links = 64; rechts = 128; }
  else if (dx < 0 && dy < 0) { links = 128; rechts = 192; }
  else { links = 192; rechts = 256; }
  const wert = (i) => dx * cos(i) + dy * sin(i);
  while (links < rechts) {
    const mitte = (links + rechts) >> 1;
    if (wert(mitte) < wert(mitte + 1)) links = mitte + 1;
    else rechts = mitte;
  }
  // Index 256 entspricht Kurs 0 und hat im alten 0..255-Scan Vorrang.
  // Beispiel: (dx,dy)=(402,-5) ist Gleichstand zwischen 0 und 255.
  if (links >= 192 && wert(256) === wert(links)) return 0;
  return links & 255;
}
function drehen(kurs, soll, rate) {
  const d = (soll - kurs) & 255;
  if (d === 0) return kurs;
  return d <= 128 ? (kurs + Math.min(d, rate)) & 255 : (kurs - Math.min(256 - d, rate)) & 255;
}
const ids = (obj) => Object.keys(obj).sort();
const feld = (flug, system, id) => (flug.systeme[system]?.felder || []).find((f) => f.id === id) || null;

// Nur der belegte K1-Spielertransport darf im bezahlten W5n-Transit denselben
// Flugregler nutzen. NPC-Transits, Regel195 und fremde Schiffe bleiben unbeweglich.
// Das ist Korridor-Manoevrierung; die wirtschaftliche Ankunft berechnet allein W5n.
function steuerbarerTransit(state, sh) {
  const a=state.w5n?.frachtauftrag, f=state.kanon?.spielerFrachten?.auftraege;
  const ferry=state.w5ac?.active;
  const ice=(state.rulesVersion===199 || state.rulesVersion===200)
    && sh.auftrag==='eisfracht' && a?.schiff===sh.id && Array.isArray(f)
    && f.some(x=>x?.schiff===sh.id && x.end===null);
  const transfer=state.rulesVersion===200 && ferry?.id===sh.id
    && ferry.owner===sh.owner && sh.auftrag==='w5ac-ueberfuehrung'
    && state.w5?.schiffIds.includes(sh.id);
  return sh?.klasse==='frachter' && sh.owner==='house'
    && sh.phase==='reise' && sh.flug?.lage==='transit' && (ice || transfer);
}

// PIR-2d: explicit isolated research profile, only the original paid house
// inbound F4 contract. No other transport or legacy profile changes.
const PIR_ANFLUG = Object.freeze({punkte:144000,minuten:4,kurs:128});
function frachtAnflugFenster(state, sh) {
  const a=state.w5n?.frachtauftrag;
  if(state.rulesVersion!==204||state.kanon?.piraten?.profil!==2
    ||!sh||sh.owner!=='house'||sh.klasse!=='frachter'||sh.phase!=='reise'
    ||sh.auftrag!=='eisfracht'||sh.ziel!=='st_nadir'||a?.phase!=='hin'||a.schiff!==sh.id
    ||sh.ladung?.eis!==a.menge)return false;
  const rest=sh.ankunft-state.tick;
  return Number.isSafeInteger(rest)&&rest>=1&&rest<=PIR_ANFLUG.minuten;
}
function frachtAnflugKoerper(flug=FLUG){
  return {...koerperAngedockt('nadir',flug),x:PIR_ANFLUG.punkte,
    kurs:PIR_ANFLUG.kurs,sollKurs:PIR_ANFLUG.kurs,
    lage:'frei',anker:null,modus:'anflug',ziel:{art:'station',id:'st_nadir'},andocken:true};
}
// Independent exact path check. No additional simulation clock in the game:
// the miniature object is discarded and used solely for validation.
function frachtAnflugBelegt(state,sh,extra=0,flug=FLUG){
  if(!frachtAnflugFenster(state,sh)||sh.system!=='nadir')return false;
  const steps=(PIR_ANFLUG.minuten-(sh.ankunft-state.tick))*flug.schritteJeMinute
    +state.flug.schritt+extra;
  if(!Number.isSafeInteger(steps)||steps<0||steps>PIR_ANFLUG.minuten*flug.schritteJeMinute)return false;
  const test={rulesVersion:204,flug:{schritt:0},ships:{[sh.id]:{id:sh.id,klasse:'frachter',
    system:'nadir',flug:frachtAnflugKoerper(flug)}}};
  for(let i=0;i<steps;i++)schritt(test,flug,[sh.id]);
  const canon=v=>v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
  return JSON.stringify(canon(test.ships[sh.id].flug))===JSON.stringify(canon(sh.flug));
}
function koerperAngedockt(system, flug = FLUG) {
  const st = flug.systeme[system].station;
  return { x: st.x, y: st.y, vx: 0, vy: 0, kurs: 0, lage: 'angedockt', anker: st.id, rest: 0,
    modus: 'halt', sollKurs: 0, sollFahrt: 0, ziel: null, andocken: false };
}

// Zielidentität wird vor jedem Schritt erneut im autoritativen Zustand geprüft.
function zielObjekt(state, s, z, flug) {
  if (!z) return null;
  const sys = flug.systeme[s.system];
  if (z.art === 'station') return z.id === sys?.station.id ? sys.station : null;
  if (z.art === 'feld') return feld(flug, s.system, z.id);
  if (z.art === 'punkt') return ganz(z.x, -flug.raumRadius, flug.raumRadius) && ganz(z.y, -flug.raumRadius, flug.raumRadius) ? z : null;
  const t = z.art === 'schiff' && typeof z.id === 'string' && Object.hasOwn(state.ships, z.id) ? state.ships[z.id] : null;
  return t && t.id !== s.id && t.system === s.system && t.flug?.lage === 'frei' ? t.flug : null;
}

// Save-Validierung erlaubt einen inzwischen abgedockten/verlorenen Kontakt bis zum
// nächsten Flugschritt, aber keine erfundenen Identitäten oder zusätzlichen Felder.
function zielForm(state, s, z, flug) {
  if (!z || typeof z !== 'object' || Array.isArray(z)) return false;
  if (z.art === 'schiff') return typeof z.id === 'string' && z.id !== s.id && Object.hasOwn(state.ships,z.id);
  return !!zielObjekt(state,s,z,flug);
}
function pruefen(state, cmd, flug = FLUG) {
  if (cmd === null || typeof cmd !== 'object' || Array.isArray(cmd)) return 'Befehl ist kein Objekt';
  if (!Object.hasOwn(BEFEHLE, cmd.type)) return 'unbekannter Flugbefehl';
  const erlaubt = new Set(['type', 'owner', ...BEFEHLE[cmd.type]]);
  for (const k of Object.keys(cmd)) if (!erlaubt.has(k)) return `unerlaubtes Feld: ${k}`;
  if (typeof cmd.schiff !== 'string' || !Object.hasOwn(state.ships, cmd.schiff)) return 'unbekanntes Schiff';
  const s = state.ships[cmd.schiff], b = s.flug;
  if (typeof cmd.owner !== 'string' || s.owner !== cmd.owner) return 'Schiff gehört nicht dem Besitzer';
  if (!b || !Object.hasOwn(flug.klassen, s.klasse)) return 'Schiff hat keinen Flugkörper';
  if (cmd.type === 'shipUndock') return b.lage === 'angedockt' ? null : 'Schiff ist nicht angedockt';
  if (b.lage !== 'frei' && !(cmd.type==='shipSteer' && steuerbarerTransit(state,s)))
    return 'Schiff ist nicht im freien Flug';
  const sys = flug.systeme[s.system];
  if (['shipOrbit','shipFollow','shipLock','shipUnlock'].includes(cmd.type)) {
    if (state.rulesVersion !== 204) return 'P2 verlangt Regel204';
    if (cmd.type !== 'shipUnlock') {
      const z = {art: cmd.type === 'shipFollow' ? 'schiff' : cmd.zielArt, id: cmd.ziel, x: cmd.x, y: cmd.y};
      if (!zielObjekt(state, s, z, flug) || (cmd.type === 'shipLock' && z.art === 'punkt')) return 'Ziel nicht verfügbar';
      if (z.art === 'punkt' ? cmd.ziel !== undefined : cmd.x !== undefined || cmd.y !== undefined) return 'Widersprüchliches Ziel';
    }
    if (cmd.type === 'shipOrbit' && !ganz(cmd.radius, flug.punktHalt, flug.raumRadius)) return 'Orbitradius außerhalb des Systemraums';
    if (cmd.type === 'shipFollow' && !ganz(cmd.abstand, flug.punktHalt, flug.raumRadius)) return 'Folgeabstand außerhalb des Systemraums';
  }
  if (cmd.type === 'shipSteer') {
    if (!ganz(cmd.kurs, 0, 255)) return 'Kurs muss ganze Zahl 0..255 sein';
    if (!ganz(cmd.fahrt, 0, 100)) return 'Fahrt muss ganze Zahl 0..100 sein';
  }
  if (cmd.type === 'shipApproach') {
    if (cmd.zielArt === 'station') { if (cmd.ziel !== sys.station.id) return 'Station liegt nicht in diesem System'; }
    else if (cmd.zielArt === 'feld') { if (typeof cmd.ziel !== 'string' || !feld(flug, s.system, cmd.ziel)) return 'Feld liegt nicht in diesem System'; }
    else return 'unbekannte Zielart';
  }
  if (cmd.type === 'shipFlyTo' && !(ganz(cmd.x, -flug.raumRadius, flug.raumRadius) && ganz(cmd.y, -flug.raumRadius, flug.raumRadius)))
    return 'Zielpunkt außerhalb des Systemraums';
  if (cmd.type === 'shipDock' && cmd.station !== sys.station.id) return 'Station liegt nicht in diesem System';
  return null;
}

function ausfuehren(state, cmd, flug = FLUG) {
  const fehler = pruefen(state, cmd, flug);
  if (fehler) return { ok: false, type: cmd && cmd.type, reason: fehler };
  const b = state.ships[cmd.schiff].flug;
  switch (cmd.type) {
    case 'shipOrbit': b.modus = 'orbit'; b.ziel = cmd.zielArt === 'punkt' ? {art:'punkt', x:cmd.x, y:cmd.y, radius:cmd.radius} : {art:cmd.zielArt, id:cmd.ziel, radius:cmd.radius}; b.andocken = false; break;
    case 'shipFollow': b.modus = 'folgen'; b.ziel = {art:'schiff', id:cmd.ziel, abstand:cmd.abstand}; b.andocken = false; break;
    case 'shipLock': b.erfassung = {art:cmd.zielArt, id:cmd.ziel}; break;
    case 'shipUnlock': delete b.erfassung; break;
    case 'shipSteer': b.modus = 'hand'; b.sollKurs = cmd.kurs; b.sollFahrt = cmd.fahrt; b.ziel = null; b.andocken = false; break;
    case 'shipApproach': b.modus = 'anflug'; b.ziel = { art: cmd.zielArt, id: cmd.ziel }; b.andocken = false; break;
    case 'shipFlyTo': b.modus = 'anflug'; b.ziel = { art: 'punkt', x: cmd.x, y: cmd.y }; b.andocken = false; break;
    case 'shipDock': delete b.erfassung; b.modus = 'anflug'; b.ziel = { art: 'station', id: cmd.station }; b.andocken = true; break;
    case 'shipUndock': b.lage = 'abdocken'; b.rest = flug.andocken.schritte; break;
  }
  return { ok: true, type: cmd.type };
}

function zielpunkt(flug, s) {
  const z = s.flug.ziel, sys = flug.systeme[s.system];
  if (z.art === 'station') return { x: sys.station.x, y: sys.station.y, halt: flug.andocken.radius >> 1 };
  if (z.art === 'feld') { const f = feld(flug, s.system, z.id); return { x: f.x, y: f.y, halt: f.radius >> 1 }; }
  return { x: z.x, y: z.y, halt: flug.punktHalt };
}
// Derselbe Anflugregler fuer Spieler-Automatik und NPC: liefert nur Sollkurs/Sollfahrt.
function anflug(flug, s, k) {
  const b = s.flug, z = zielpunkt(flug, s);
  const dx = z.x - b.x, dy = z.y - b.y, dist = isqrt(dx * dx + dy * dy);
  if (dist <= z.halt) { b.sollFahrt = 0; return; }
  b.sollKurs = richtungZu(dx, dy);
  const abw = Math.min((b.sollKurs - b.kurs) & 255, (b.kurs - b.sollKurs) & 255);
  if (abw > flug.drehenVorSchub) { b.sollFahrt = 0; return; }
  const erlaubt = isqrt(k.bremse * (dist - z.halt));
  b.sollFahrt = Math.max(flug.kriechfahrt, Math.min(100, kuerzen(erlaubt * 100 / k.vmax)));
}
// Radiale Distanzregelung plus tangentiale Orbitfahrt. Nur Sollwerte: Beschleunigung,
// Bremsen, Drehrate und Integration bleiben ausschließlich im Original-bewegen().
function zielFlug(state, flug, s, k) {
  const b = s.flug, z = zielObjekt(state, s, b.ziel, flug);
  if (!z) { b.modus = 'halt'; b.ziel = null; b.sollFahrt = 0; b.andocken = false; return; }
  const dx = b.x - z.x, dy = b.y - z.y, d = Math.max(1, isqrt(dx*dx + dy*dy));
  const radius = b.modus === 'orbit' ? b.ziel.radius : b.ziel.abstand;
  const fehler = d - radius;
  // Bremsweg begrenzt den Anflug; die lineare Nahregelung vermeidet Pendeln.
  const radial = Math.sign(fehler) * Math.min(kuerzen(Math.abs(fehler)/16), isqrt(k.bremse*Math.abs(fehler)), k.vmax);
  // Konservative Kurvenfahrt aus Original-Beschleunigung und -Wendigkeit abgeleitet.
  const tangential = b.modus === 'orbit' ? Math.min(kuerzen(k.vmax/2), isqrt(k.schub*radius/4), kuerzen(radius*k.drehrate/128)) : 0;
  const ux = dx === 0 && dy === 0 ? flug.einheit : kuerzen(dx*flug.einheit/d);
  const uy = kuerzen(dy*flug.einheit/d);
  const vx = (z.vx || 0) - kuerzen((ux*radial + uy*tangential)/flug.einheit);
  const vy = (z.vy || 0) + kuerzen((ux*tangential - uy*radial)/flug.einheit);
  const tempo = isqrt(vx*vx + vy*vy);
  if (tempo) b.sollKurs = richtungZu(vx,vy);
  b.sollFahrt = Math.min(100, Math.round(tempo*100/k.vmax));
}
function bewegen(flug, s, state) {
  const b = s.flug, k = flug.klassen[s.klasse], E = flug.einheit;
  if (b.modus === 'orbit' || b.modus === 'folgen') zielFlug(state, flug, s, k);
  if (b.modus === 'anflug' && b.ziel) anflug(flug, s, k);
  b.kurs = drehen(b.kurs, b.sollKurs, k.drehrate);
  const zx = kuerzen(cos(b.kurs) * k.vmax * b.sollFahrt / (E * 100));
  const zy = kuerzen(sin(b.kurs) * k.vmax * b.sollFahrt / (E * 100));
  const dx = zx - b.vx, dy = zy - b.vy;
  const a = (b.sollFahrt === 0 || dx * b.vx + dy * b.vy < 0) ? k.bremse : k.schub;
  const d2 = dx * dx + dy * dy;
  if (d2 <= a * a) { b.vx = zx; b.vy = zy; }
  else {
    const len = isqrt(d2);
    let sx = kuerzen(dx * a / len), sy = kuerzen(dy * a / len);
    if (sx === 0 && sy === 0) { if (Math.abs(dx) >= Math.abs(dy)) sx = Math.sign(dx); else sy = Math.sign(dy); }
    b.vx += sx; b.vy += sy;
  }
  b.x += b.vx; b.y += b.vy;
  const R = flug.raumRadius;
  if (b.x > R || b.x < -R) { b.x = b.x > R ? R : -R; b.vx = 0; }
  if (b.y > R || b.y < -R) { b.y = b.y > R ? R : -R; b.vy = 0; }
  if (b.andocken && b.ziel && b.ziel.art === 'station') {
    const st = flug.systeme[s.system].station, ex = st.x - b.x, ey = st.y - b.y, d = flug.andocken;
    if (ex * ex + ey * ey <= d.radius * d.radius && b.vx * b.vx + b.vy * b.vy <= d.tempo * d.tempo) {
      b.lage = 'andocken'; b.anker = st.id; b.rest = d.schritte; b.vx = 0; b.vy = 0;
      b.modus = 'halt'; b.sollFahrt = 0; b.ziel = null; b.andocken = false;
    }
  }
}
// Ein Flugschritt fuer alle Schiffe in stabiler ID-Reihenfolge. Rueckgabe true = Core-Minute voll;
// der Aufrufer fuehrt dann genau einmal den bestehenden Minuten-Tick aus.
// Der dritte Parameter ist ausschliesslich fuer den privaten K1-Minuten-Batch:
// dort bleibt die Flottenmenge zwischen den 60 Flugschritten unveraendert.
// Direkte/isolierte Flugschritte behalten den bisherigen eigenen ID-Sortierpfad.
function schritt(state, flug = FLUG, sortierteSchiffIds = null) {
  for (const id of (sortierteSchiffIds || ids(state.ships))) {
    const s = state.ships[id], b = s.flug;
    if (!b) continue;
    if (b.erfassung && (b.lage !== 'frei' || !zielObjekt(state,s,b.erfassung,flug))) delete b.erfassung;
    if (b.lage === 'frei' || (steuerbarerTransit(state,s) && b.modus==='hand'))
      bewegen(flug, s, state);
    else if (b.lage === 'andocken') {
      const st = flug.systeme[s.system].station;
      b.rest -= 1;
      b.x += kuerzen((st.x - b.x) / (b.rest + 1)); b.y += kuerzen((st.y - b.y) / (b.rest + 1));
      if (b.rest === 0) { b.x = st.x; b.y = st.y; b.lage = 'angedockt'; }
    } else if (b.lage === 'abdocken') {
      b.rest -= 1;
      if (b.rest === 0) { b.lage = 'frei'; b.anker = null; }
    }
  }
  state.flug.schritt = (state.flug.schritt + 1) % flug.schritteJeMinute;
  return state.flug.schritt === 0;
}

// Ortsbedingungen fuer die spaetere Kopplung an bestehende Wirtschaftsbefehle.
// Schiffe ohne Flugkoerper behalten das bisherige abstrakte Verhalten.
function imFeld(s, ware, flug = FLUG) {
  const b = s.flug;
  if (!b) return true;
  if (b.lage !== 'frei') return false;
  const f = (flug.systeme[s.system]?.felder || []).find((x) => x.ware === ware);
  if (!f) return false;
  const dx = f.x - b.x, dy = f.y - b.y, t = flug.abbau.tempo;
  return dx * dx + dy * dy <= f.radius * f.radius && b.vx * b.vx + b.vy * b.vy <= t * t;
}
function angedocktAn(s, station) {
  return !s.flug || (s.flug.lage === 'angedockt' && s.flug.anker === station);
}
// Idempotente Bruecke Auftrag -> Flug: bringt ein Schiff mit denselben validierten Befehlen
// zum Sollort {art:'station'|'feld', id}. Erzeugt nur dann einen Befehl, wenn das Ziel abweicht.
function fuehreZu(state, s, sollort, flug = FLUG) {
  const b = s.flug, cmd = (felder) => ausfuehren(state, { owner: s.owner, schiff: s.id, ...felder }, flug);
  if (!b || b.lage === 'andocken' || b.lage === 'abdocken' || b.lage === 'transit') return null;
  if (sollort.art === 'station') {
    if (b.lage === 'angedockt') return null;
    if (b.andocken && b.ziel?.art === 'station' && b.ziel.id === sollort.id) return null;
    return cmd({ type: 'shipDock', station: sollort.id });
  }
  if (b.lage === 'angedockt') return cmd({ type: 'shipUndock' });
  if (b.modus === 'anflug' && b.ziel?.art === 'feld' && b.ziel.id === sollort.id) return null;
  return cmd({ type: 'shipApproach', zielArt: 'feld', ziel: sollort.id });
}

function audit(state, flug = FLUG) {
  const fehler = (grund) => ({ ok: false, grund });
  if (!state.flug || !ganz(state.flug.schritt, 0, flug.schritteJeMinute - 1) || Object.keys(state.flug).length !== 1)
    return fehler('Flugschrittzähler ungültig');
  const R = flug.raumRadius;
  for (const id of ids(state.ships)) {
    const s = state.ships[id], b = s.flug;
    if (b === undefined) continue;
    const k = flug.klassen[s.klasse], sys = flug.systeme[s.system];
    if (!b || typeof b !== 'object' || !k || !sys) return fehler(id + ': Flugkörper ohne Klasse/System');
    if (Object.keys(b).filter(k=>k!=='erfassung').sort().join() !== KOERPER.join()) return fehler(id + ': unbekannte oder fehlende Flugfelder');
    if (!ganz(b.x, -R, R) || !ganz(b.y, -R, R) || !ganz(b.vx, -k.vmax, k.vmax) || !ganz(b.vy, -k.vmax, k.vmax)
      || !ganz(b.kurs, 0, 255) || !ganz(b.sollKurs, 0, 255) || !ganz(b.sollFahrt, 0, 100))
      return fehler(id + ': Flugzahl außerhalb des Wertebereichs');
    if (!LAGEN.includes(b.lage) || !['hand', 'anflug', 'halt', ...(state.rulesVersion === 204 ? ['orbit','folgen'] : [])].includes(b.modus) || typeof b.andocken !== 'boolean')
      return fehler(id + ': unbekannte Lage oder Steuerart');
    const lokalerAnflug=frachtAnflugFenster(state,s);
    if(lokalerAnflug&&!frachtAnflugBelegt(state,s,0,flug))
      return fehler(id+': lokaler F4-Anflug ohne Originalflugnachweis');
    if ((b.lage === 'transit') !== (s.phase === 'reise'&&!lokalerAnflug)) return fehler(id + ': Transit passt nicht zur Core-Phase');
    const fest = b.lage === 'angedockt' || b.lage === 'andocken' || b.lage === 'abdocken';
    if (fest !== (b.anker !== null) || (fest && b.anker !== sys.station.id)) return fehler(id + ': Anker passt nicht zur Lage');
    if (b.lage !== 'frei' && !steuerbarerTransit(state,s)
      && (b.vx !== 0 || b.vy !== 0))
      return fehler(id + ': Geschwindigkeit außerhalb des freien Flugs');
    if (b.lage === 'transit' && !steuerbarerTransit(state,s)
      && (b.modus==='hand' || b.sollFahrt!==0))
      return fehler(id + ': unbefugte Transitsteuerung');
    if (b.lage === 'transit' && (b.andocken || b.ziel!==null))
      return fehler(id + ': Transit mit verbotener Dock-/Zielfreigabe');
    if (b.lage === 'angedockt' && (b.x !== sys.station.x || b.y !== sys.station.y)) return fehler(id + ': angedockt, aber nicht am Dock');
    const sequenz = b.lage === 'andocken' || b.lage === 'abdocken';
    if (!ganz(b.rest, sequenz ? 1 : 0, sequenz ? flug.andocken.schritte : 0)) return fehler(id + ': Sequenzzähler ungültig');
    if (Object.hasOwn(b,'erfassung') && !(state.rulesVersion === 204 && b.erfassung && Object.keys(b.erfassung).sort().join() === 'art,id' && ['station','feld','schiff'].includes(b.erfassung.art) && zielForm(state,s,b.erfassung,flug))) return fehler(id + ': Zielerfassung ungültig');
    const z = b.ziel;
    if (b.modus === 'orbit' || b.modus === 'folgen') {
      const distanz = b.modus === 'orbit' ? 'radius' : 'abstand';
      const keys = z?.art === 'punkt' ? ['art','x','y',distanz] : ['art','id',distanz];
      if (b.lage !== 'frei' || !z || Object.keys(z).sort().join() !== keys.sort().join() || !ganz(z[distanz],flug.punktHalt,R) || !['station','feld','punkt','schiff'].includes(z.art) || (b.modus === 'folgen' && z.art !== 'schiff') || !zielForm(state,s,z,flug) || b.andocken) return fehler(id + ': P2-Ziel ungültig');
      continue;
    }
    if (z !== null) {
      const ok = z && typeof z === 'object' && b.lage === 'frei' && b.modus === 'anflug'
        && (z.art === 'station' ? Object.keys(z).length === 2 && z.id === sys.station.id
          : z.art === 'feld' ? Object.keys(z).length === 2 && !!feld(flug, s.system, z.id)
            : z.art === 'punkt' && Object.keys(z).length === 3 && ganz(z.x, -R, R) && ganz(z.y, -R, R));
      if (!ok) return fehler(id + ': Anflugziel ungültig');
    }
    if (b.andocken && z?.art !== 'station') return fehler(id + ': Andockwunsch ohne Station');
  }
  return { ok: true, grund: 'Flugzustand konsistent' };
}

return { BEFEHLE, sin, cos, isqrt, richtungZu, drehen, koerperAngedockt, pruefen, ausfuehren, schritt,
  imFeld, angedocktAn, fuehreZu, audit, frachtAnflugFenster, frachtAnflugKoerper, frachtAnflugBelegt };
})();

const api = Object.freeze({ DATEN: m_data_flug.FLUG, VIERTEL: m_data_flug.VIERTEL, ...m_core_flug });
if (typeof module === 'object' && module.exports) module.exports = api; else scope.FlugKern = api;
})(globalThis);
