/* Aphros Void · RAUM-1 [DRAFT] – Szene, Kamera und Befehlsabbildung des grafischen Raumcockpits.
 *
 * Ausschließlich LESENDE Projektion des autoritativen Regel204-Weltzustands
 * (prototypes/welt/welt-kern.js) plus reine Geometrie für Kamera, Trefferprüfung
 * und Steuerknüppel. Kein DOM, keine Uhrzeit, kein Zufall, keine Buchung, keine
 * eigene Physik. Jede Spieleraktion wird auf einen bereits vorhandenen,
 * vom Kern validierten Befehl abgebildet (shipUndock, shipDock, shipApproach,
 * shipFlyTo, shipSteer, siliconMineStart, siliconSell). Lehnt der Kern ab, gilt
 * seine Begründung; die Szene trifft keine eigene Wirtschafts- oder Flugentscheidung.
 *
 * Bedienmuster (Auswahl zuerst, Befehl erst nach ausdrücklicher Bestätigung;
 * Objektliste mit Distanz) stammt aus dem historischen Void-Echoes-Cockpit
 * (UX06 Auswahl, UX03 Übersicht). Dessen Regeln, Wirtschaft und Kampf werden
 * NICHT übernommen.
 */
(function (scope) {
'use strict';
const OWNER = 'house';
const ganz = (n) => Number.isSafeInteger(n);
const frieren = (o) => {
  if (o === null || typeof o !== 'object' || Object.isFrozen(o)) return o;
  Object.freeze(o);
  for (const k of Object.keys(o)) frieren(o[k]);
  return o;
};
const klemmen = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const KLASSENNAME = Object.freeze({ jaeger: 'Jäger', miner: 'Miner', frachter: 'Frachter' });
const ZOOM = Object.freeze({ min: 120, max: 9000, start: 900 }); // Weltpunkte je CSS-Pixel
const FAKTOREN = Object.freeze([1, 10, 60, 300]); // Spielsekunden je echter Sekunde (nur UI-Takt)

function flugDaten(welt) {
  const F = welt && welt.flugKern;
  if (!F || !F.DATEN || typeof F.richtungZu !== 'function') throw Error('RAUM: Original-Flugkern fehlt');
  return F;
}
function eigenesSchiff(s, id) {
  const sh = s && s.ships && Object.hasOwn(s.ships, id) ? s.ships[id] : null;
  if (!sh || sh.id !== id || sh.owner !== OWNER || !sh.flug) throw Error('RAUM: kein eigenes Schiff mit Flugkörper');
  return sh;
}
// Original-Jägerbelege bleiben zwingend. J9 erlaubt zusätzlich eine vollständig
// auditierte, nur mit echtem Hausgeld gekaufte Minerhülle ohne Anfangsjäger.
// Der Core hat beim Kauf das Eigentum gebucht, die Szene selbst erzeugt keine Hülle.
function sitzungPruefen(welt, s) {
  if (!welt || ![204,207].includes(welt.regel) || !s || s.rulesVersion !== welt.regel
      || !ganz(s.tick) || !ganz(s.flug && s.flug.schritt))
    throw Error('RAUM: nur auditierte Original-Regel204/207-Welt');
  const preis = welt.rules && welt.rules.j4 && welt.rules.j4.verkaufspreis;
  const kauf = s.kanon && s.kanon.jaeger && Array.isArray(s.kanon.jaeger.kaeufe)
    ? s.kanon.jaeger.kaeufe.find((k) => k.owner === OWNER && k.preis === preis
      && s.ships[k.id] && s.ships[k.id].owner === OWNER && s.ships[k.id].klasse === 'jaeger') : null;
  const eigeneJäger = Object.values(s.ships || {}).filter(sh => sh.owner === OWNER && sh.klasse === 'jaeger');
  if (eigeneJäger.length && !kauf)
    throw Error('RAUM: kein tatsächlich gekaufter Spielerjäger im Weltstand');
  if (kauf) return kauf.id;
  if (!Object.values(s.ships || {}).some(sh => sh.owner === OWNER && ['miner','frachter'].includes(sh.klasse) && sh.flug))
    throw Error('RAUM: noch kein rechtmäßig erworbener eigener Miner, Frachter oder Jäger');
  if (!welt.audit(s).ok) throw Error('RAUM: Minerübernahme verlangt vollständiges Original-Core-Audit');
  return null; // Kein künstlicher Jäger – Jägertraining bleibt gesperrt.
}
function ladungText(ladung) {
  const teile = Object.keys(ladung || {}).sort().filter((k) => ladung[k] > 0).map((k) => k + ': ' + ladung[k]);
  return teile.length ? teile.join(' · ') : 'leer';
}

// Bergbaulage des aktiven Miners. Zahlen stammen unverändert aus den Kernregeln (welt.rules.j2b)
// und dem Kernzustand; „imFeld“ ist nur eine Anzeige – ob gefördert wird, entscheidet der Kern.
function bergbau(welt, s, sh) {
  const C = welt.rules && welt.rules.j2b, b = s.kanon && s.kanon.silizium;
  if (!C || !b || !welt.siliziumFeld) return null;
  const F = flugDaten(welt), feld = welt.siliziumFeld, a = b.auftrag, k = sh.flug;
  const dx = k.x - feld.x, dy = k.y - feld.y;
  const imFeld = sh.klasse === 'miner' && sh.system === feld.system && k.lage === 'frei'
    && dx * dx + dy * dy <= feld.radius * feld.radius
    && k.vx * k.vx + k.vy * k.vy <= F.DATEN.abbau.tempo * F.DATEN.abbau.tempo;
  const eigener = !!a && a.schiff === sh.id && a.owner === OWNER;
  return {
    regel: { charge: C.charge, minutenJeEinheit: C.minutenJeEinheit, lohnJeMinute: C.lohnJeMinute, preis: C.preis,
      abbauTempo: F.DATEN.abbau.tempo },
    vorrat: b.vorrat, fremderAuftrag: !!a && !eigener,
    auftrag: eigener ? { menge: a.menge, gefoerdert: a.gefoerdert, gearbeitet: a.gearbeitet,
      fertig: a.gefoerdert === a.menge } : null,
    imFeld, anBord: sh.ladung.silizium || 0,
  };
}

/* Szene eines Systems aus Sicht des aktiven eigenen Schiffs.
 * extra.bojen: geometrische Patrouillenmarken (J4d), extra.patrouille: Beobachterstand,
 * extra.duell: F8-E-Trainingsstand (rein virtuell, nie im Weltstand).
 */
function erzeugen(welt, s, aktivId, extra) {
  const jaegerId = sitzungPruefen(welt, s);
  const F = flugDaten(welt), D = F.DATEN, x = extra || {};
  const sh = eigenesSchiff(s, aktivId), b = sh.flug, sys = D.systeme[sh.system];
  if (!sys) throw Error('RAUM: System ohne Flugdaten');
  const objekte = [];
  const station = s.stations[sys.station.id];
  objekte.push({ id: sys.station.id, art: 'station', name: 'Station ' + sh.system.charAt(0).toUpperCase() + sh.system.slice(1),
    x: sys.station.x, y: sys.station.y, radius: D.andocken.radius, lager: ladungText(station && station.lager) });
  for (const f of sys.felder) objekte.push({ id: f.id, art: 'feld', kern: true, ware: f.ware,
    name: (f.ware === 'erz' ? 'Erzfeld' : f.ware === 'eis' ? 'Eisfeld' : 'Feld') + ' ' + sh.system,
    x: f.x, y: f.y, radius: f.radius });
  const sf = welt.siliziumFeld;
  if (sf && sf.system === sh.system && s.kanon && s.kanon.silizium)
    objekte.push({ id: sf.system + ':silizium', art: 'feld', kern: false, ware: 'silizium', name: 'Siliziumfeld Nadir',
      x: sf.x, y: sf.y, radius: sf.radius, vorrat: s.kanon.silizium.vorrat });
  const tor = welt.daten && welt.daten.tor;
  if (tor && sh.system === 'aldera') objekte.push({ id: 'aldera:tor', art: 'tor', name: 'Abflugtor Aldera',
    x: tor.x, y: tor.y, radius: tor.radius });
  if (Array.isArray(x.bojen) && sh.system === 'nadir') {
    const p = x.patrouille, aktivP = !!p && (p.status === 'bereit' || p.status === 'flug');
    x.bojen.forEach((m, i) => objekte.push({ id: 'boje:' + i, art: 'boje', name: m.name, x: m.x, y: m.y,
      radius: m.radius, maxTempo: m.maxTempo, erreicht: !!p && i < p.stufe, offen: aktivP && p.stufe === i }));
  }
  const gedockt = [];
  let transit = 0;
  for (const id of Object.keys(s.ships).sort()) {
    const o = s.ships[id], k = o.flug;
    if (!k || o.system !== sh.system) continue;
    const basis = { id, klasse: o.klasse, owner: o.owner, eigen: o.owner === OWNER, aktiv: id === aktivId,
      ladung: ladungText(o.ladung), auftrag: o.auftrag };
    if (k.lage === 'transit') { transit++; if(id!==aktivId)continue; }
    if (k.lage === 'angedockt') { gedockt.push(basis); continue; }
    objekte.push({ ...basis, art: 'schiff', name: (KLASSENNAME[o.klasse] || o.klasse) + ' ' + id,
      x: k.x, y: k.y, vx: k.vx, vy: k.vy, kurs: k.kurs, lage: k.lage, radius: 0,
      gestrandet: !!(s.kanon.flugdienst[id] && s.kanon.flugdienst[id].gestrandet) });
  }
  const effekte = { projektile: [], gegnerGeschosse: [] };
  if (x.duell && sh.system === 'nadir') {
    const d = x.duell;
    objekte.push({ id: 'drohne', art: 'drohne', name: 'Trainingsdrohne (virtuell)', x: d.ziel.x, y: d.ziel.y, radius: 0,
      hp: d.zielHp, status: d.status });
    for (const p of d.projektile) effekte.projektile.push({ x: p.x, y: p.y });
    for (const p of d.gegnerGeschosse) effekte.gegnerGeschosse.push({ x: p.x, y: p.y });
  }
  const dienst = s.kanon.flugdienst[aktivId];
  const zentrum = { x: b.x, y: b.y };
  for (const o of objekte) {
    const dx = o.x - zentrum.x, dy = o.y - zentrum.y;
    o.distanz = Math.round(Math.sqrt(dx * dx + dy * dy));
  }
  const k = D.klassen[sh.klasse];
  return frieren({
    regel: s.rulesVersion, tick: s.tick, sekunde: s.flug.schritt, system: sh.system, jaeger: jaegerId,
    raumRadius: D.raumRadius,
    aktiv: { id: aktivId, klasse: sh.klasse, name: (KLASSENNAME[sh.klasse] || sh.klasse) + ' ' + aktivId,
      lage: b.lage, modus: b.modus, x: b.x, y: b.y, vx: b.vx, vy: b.vy, kurs: b.kurs, sollKurs: b.sollKurs,
      sollFahrt: b.sollFahrt, andocken: b.andocken, anker: b.anker, vmax: k ? k.vmax : 0,
      fahrt: Math.round(Math.sqrt(b.vx * b.vx + b.vy * b.vy)),
      erfassung: b.erfassung ? {...b.erfassung} : null, ziel: b.ziel ? { ...b.ziel } : null, ladung: ladungText(sh.ladung),
      gestrandet: !!(dienst && dienst.gestrandet),
      reserve: dienst && s.owners[dienst.konto] ? s.owners[dienst.konto].cash : 0,
      verschleiss: s.kanon.verschleiss[aktivId] || 0 },
    kasse: s.owners[OWNER].cash, pilotenkasse: s.owners.pilot_house ? s.owners.pilot_house.cash : 0,
    weltgeld: Object.keys(s.owners).reduce((n, id) => n + s.owners[id].cash, 0),
    station: sys.station.id, objekte, gedockt, transit, effekte,
    fracht: s.w5n?.frachtauftrag?.schiff===aktivId ? {
      phase:s.w5n.frachtauftrag.phase,
      lohnReserve:s.owners.w5n_fracht_arbeit?.cash||0,
      kaufReserve:s.owners.w5n_fracht_kauf?.cash||0
    } : null,
    bergbau: sh.klasse === 'miner' ? bergbau(welt, s, sh) : null,
  });
}

// Objektliste für die Übersicht: nächstes zuerst, eigenes aktives Schiff nicht als Ziel.
function ziele(szene) {
  return szene.objekte.filter((o) => !(o.art === 'schiff' && o.aktiv))
    .slice().sort((a, b) => a.distanz - b.distanz || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
const objekt = (szene, id) => szene.objekte.find((o) => o.id === id) || null;

// ---- Kamera (reine Darstellung; Weltpunkte <-> CSS-Pixel) ------------------------------------
function kamera(x, y, massstab) {
  return { x, y, massstab: klemmen(Number.isFinite(massstab) ? massstab : ZOOM.start, ZOOM.min, ZOOM.max) };
}
const zuBild = (k, breite, hoehe, wx, wy) => [breite / 2 + (wx - k.x) / k.massstab, hoehe / 2 + (wy - k.y) / k.massstab];
function zuWelt(k, breite, hoehe, px, py, raumRadius) {
  const R = ganz(raumRadius) ? raumRadius : Number.MAX_SAFE_INTEGER;
  return { x: klemmen(Math.round(k.x + (px - breite / 2) * k.massstab), -R, R),
    y: klemmen(Math.round(k.y + (py - hoehe / 2) * k.massstab), -R, R) };
}
// Tipp-Treffer: kleine Objekte (Schiffe, Bojen, Station) haben Vorrang vor großen Feldflächen;
// Mindestfläche 24 px Radius für Finger. Rückgabe Objekt-ID oder null (leerer Raum).
function treffer(szene, k, breite, hoehe, px, py, minPx) {
  const min = Number.isFinite(minPx) ? minPx : 24;
  let best = null;
  for (const o of ziele(szene)) {
    const [x, y] = zuBild(k, breite, hoehe, o.x, o.y);
    const flaeche = o.art === 'feld' || o.art === 'tor';
    const r = Math.max(min, flaeche ? o.radius / k.massstab : Math.min(o.radius / k.massstab, 60));
    const d = Math.hypot(x - px, y - py);
    if (d > r) continue;
    const rang = flaeche ? 1 : 0;
    if (!best || rang < best.rang || (rang === best.rang && d < best.d)) best = { id: o.id, rang, d };
  }
  return best ? best.id : null;
}

// ---- Eingabe -> vorhandene Kernbefehle --------------------------------------------------------
// Steuerknüppel: Auslenkung in Pixeln -> Kurs 0..255 (Original-richtungZu) und Fahrt in 5-%-Stufen.
function knueppel(welt, dx, dy, radiusPx) {
  const F = flugDaten(welt), len = Math.hypot(dx, dy), tot = radiusPx * 0.18;
  if (!(radiusPx > 0) || !Number.isFinite(len) || len <= tot) return null;
  const anteil = klemmen((len - tot) / (radiusPx - tot), 0, 1);
  return { kurs: F.richtungZu(Math.round(dx * 64), Math.round(dy * 64)), fahrt: Math.max(5, Math.round(anteil * 20) * 5) };
}
function befehl(welt, szene, aktion, ziel, abstand) {
  const F = flugDaten(welt), a = szene.aktiv, basis = { owner: OWNER, schiff: a.id };
  const o = typeof ziel === 'string' ? objekt(szene, ziel) : null;
  const punkt = o ? { x: o.x, y: o.y } : ziel && ganz(ziel.x) && ganz(ziel.y) ? { x: ziel.x, y: ziel.y } : null;
  switch (aktion) {
    case 'orbit':
      if (!o || !ganz(abstand)) return null;
      return {type:'shipOrbit', ...basis, radius:abstand, ...(o.art === 'station' || o.art === 'schiff' || o.kern ? {zielArt:o.art, ziel:o.id} : {zielArt:'punkt', x:o.x, y:o.y})};
    case 'folgen': return o?.art === 'schiff' && ganz(abstand) ? {type:'shipFollow', ...basis, ziel:o.id, abstand} : null;
    case 'aufschalten': return o && ['station','schiff'].includes(o.art) || o?.kern ? {type:'shipLock', ...basis, zielArt:o.art, ziel:o.id} : null;
    case 'loesen': return {type:'shipUnlock', ...basis};
    case 'abdocken': return { type: 'shipUndock', ...basis };
    case 'andocken': return { type: 'shipDock', ...basis, station: szene.station };
    case 'stopp': return { type: 'shipSteer', ...basis, kurs: a.kurs, fahrt: 0 };
    case 'steuern':
      if (!ziel || !ganz(ziel.kurs) || !ganz(ziel.fahrt)) return null;
      return { type: 'shipSteer', ...basis, kurs: ziel.kurs, fahrt: ziel.fahrt };
    case 'anfliegen':
      if (o && o.art === 'station') return { type: 'shipApproach', ...basis, zielArt: 'station', ziel: o.id };
      if (o && o.art === 'feld' && o.kern) return { type: 'shipApproach', ...basis, zielArt: 'feld', ziel: o.id };
      return punkt ? { type: 'shipFlyTo', ...basis, x: punkt.x, y: punkt.y } : null;
    case 'ausrichten':
      if (!punkt || (punkt.x === a.x && punkt.y === a.y)) return null;
      return { type: 'shipSteer', ...basis, kurs: F.richtungZu(punkt.x - a.x, punkt.y - a.y), fahrt: 0 };
    case 'eisfracht': return { type: 'shipFreightIce', ...basis };
    case 'torpruefen': return { type: 'shipGateCheck', ...basis };
    case 'torfracht': return { type: 'shipFreightGateIce', ...basis };
    case 'siliziumAuftrag': return { type: 'siliconMineStart', ...basis };
    case 'siliziumVerkauf': return { type: 'siliconSell', ...basis };
    default: return null;
  }
}
// Welche Aktionen bietet die Zielkarte an? Nur Anzeige; die Gültigkeit prüft der Kern beim Ausführen.
function aktionen(szene, ziel) {
  const a = szene.aktiv, o = typeof ziel === 'string' ? objekt(szene, ziel) : null, frei = a.lage === 'frei';
  const liste = [];
  if (!o && !(ziel && ganz(ziel.x))) return liste;
  liste.push({ id: 'anfliegen', text: o ? 'Autopilot: Annähern' : 'Hierhin fliegen', aktiv: frei });
  if (o && o.art === 'station') liste.push({ id: 'andocken', text: 'Andocken', aktiv: frei });
  if (o && (o.art === 'drohne' || o.art === 'schiff')) liste.push({ id: 'ausrichten', text: 'Ausrichten', aktiv: frei });
  if (o) {
    const echt = ['station','schiff'].includes(o.art) || o.kern;
    liste.push({id:'orbit', text:'Orbit', aktiv:frei && o.art !== 'drohne', grund:!frei ? 'Erst frei fliegen' : o.art === 'drohne' ? 'Virtuelles Trainingsziel' : ''});
    liste.push({id:'folgen', text:'Folgen', aktiv:frei && o.art === 'schiff' && o.lage === 'frei', grund:!frei ? 'Erst frei fliegen' : o.art !== 'schiff' ? 'Nur beweglichen Schiffen folgen' : o.lage !== 'frei' ? 'Ziel ist nicht frei im Flug' : ''});
    liste.push({id:'aufschalten', text:'Aufschalten', aktiv:frei && !!echt, grund:!frei ? 'Erst frei fliegen' : !echt ? 'Keine erfassbare Kernidentität' : ''});
    liste.push({id:'loesen', text:'Aufschaltung lösen', aktiv:frei && !!a.erfassung});
  }
  return liste;
}

/* Schiffwechsel ohne Ortsfiktion: Der Regel204-Kern kennt noch keinen eigenen Spielerstandort.
 * Deshalb wechselt die Steuerung nur zwischen eigenen Schiffen, die am selben Dock liegen.
 * Der Wechsel ändert den Weltzustand nicht; null = erlaubt, sonst Begründung.
 */
function wechselGrund(s, von, nach) {
  const ziel = s && s.ships && Object.hasOwn(s.ships, nach) ? s.ships[nach] : null;
  if (!ziel || ziel.owner !== OWNER || !ziel.flug) return 'Kein eigenes Schiff mit Flugkörper';
  if (von === nach) return 'Dieses Schiff wird bereits gesteuert';
  const alt = s.ships[von];
  if (!alt || alt.owner !== OWNER || !alt.flug) return 'Aktuelles Schiff ungültig';
  if (alt.flug.lage !== 'angedockt') return 'Erst mit dem aktuellen Schiff andocken';
  if (ziel.flug.lage !== 'angedockt' || ziel.flug.anker !== alt.flug.anker || ziel.system !== alt.system)
    return 'Zielschiff liegt nicht am selben Dock';
  return null;
}
// Eigene Schiffe für die Wechselliste (alle Systeme, mit Begründung, falls nicht erreichbar).
function flotte(s, aktivId) {
  return Object.keys(s.ships).sort().map((id) => s.ships[id]).filter((sh) => sh.owner === OWNER && sh.flug)
    .map((sh) => ({ id: sh.id, klasse: sh.klasse, name: (KLASSENNAME[sh.klasse] || sh.klasse) + ' ' + sh.id,
      system: sh.system, lage: sh.flug.lage, ladung: ladungText(sh.ladung), aktiv: sh.id === aktivId,
      grund: sh.id === aktivId ? null : wechselGrund(s, aktivId, sh.id) }));
}

// UI-Takt: echte Millisekunden -> ganze Flugschritte. Der Weltzustand hängt nur von der Zahl der
// Schritte und der Befehlsfolge ab, nie von Bildrate oder Wanduhr (siehe tests/raum-szene.test.mjs).
function zeitgeber(rest, dtMs, faktor, maxSchritte) {
  const dt = klemmen(Number.isFinite(dtMs) ? dtMs : 0, 0, 250);
  const summe = (Number.isFinite(rest) ? rest : 0) + dt * faktor / 1000;
  const schritte = Math.min(Math.floor(summe), maxSchritte > 0 ? maxSchritte : 600);
  return { schritte, rest: schritte === Math.floor(summe) ? summe - schritte : 0 };
}

const API = Object.freeze({ OWNER, ZOOM, FAKTOREN, KLASSENNAME, sitzungPruefen, erzeugen, ziele, objekt, kamera, zuBild, zuWelt,
  treffer, knueppel, befehl, aktionen, wechselGrund, flotte, zeitgeber, ladungText });
if (typeof module === 'object' && module.exports) module.exports = API;
else scope.RaumSzene = API;
})(typeof globalThis === 'object' ? globalThis : this);
