/* Aphros Void · Kanonische Welt K1 – Oberfläche (m_ui). Liest nur aus der einen Welt und
 * verändert sie ausschließlich über validierte Core-Befehle. Keine eigenen Preis-, Lohn-
 * oder Kapazitätsformeln; alle Zahlen stammen aus welt.bericht() bzw. dem Zustand. */
(() => {
'use strict';
const BasisWelt = window.AphrosWelt, Speicher = window.AphrosWeltSpeicher, G = window.FlugGrafik;
// K7 ist ein ausdruecklich opt-in geoeffneter Forschungsstand. Keine Migration
// aus Regel195 und vor allem keine gemeinsame IndexedDB mit dem K1-Spieltest.
const istK7 = document.documentElement.dataset.forschungsprofil === 'k7';
const Welt = istK7 ? Object.freeze({
  ...BasisWelt, erstellen: BasisWelt.erstellenK7,
  ausRegel195: () => { throw Error('K7: Keine Regel195-Migration freigegeben'); }
}) : BasisWelt;
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString('de-DE');
const canvas = $('raum'), ctx = canvas.getContext('2d'), graph = G.erstellen(ctx);
const SPIELER = 'house', TEMPI = [1, 10, 60];
let welt = null, state = null, speicher = null, hülle = null;
let pausiert = true, tempo = 0, letzter = null, rest = 0, geaendert = false, ansicht = 'flug', letzterSave = 0, dauerhaft = true;
let rundenZiel = null; // Nur UI-Vorschlag: nie ein eigener Core-Befehl.
let pilotSchiff = null; // UI-Auswahl: weder Kursregler noch Kartenziel ändern den Core vor Bestätigung.
const KARTEN_MITTE = Object.freeze({ x: 144000, y: 224000 });
const KARTEN_TEXTE = Object.freeze({ 'st_aldera': 'Aldera-Dock', 'aldera:eis': 'Eisfeld',
  'aldera:erz': 'Erzfeld', 'aldera:tor': 'Aldera-Sprungtor' });
const kartenSkala = (w, h) => Math.min(w, h) / 2500000;

function melde(text, fehler = false) { const m = $('meldung'); m.textContent = text; m.classList.toggle('fehler', fehler); }
function sicher(f) { try { return f(); } catch (e) { pausiert = true; melde('Angehalten: ' + e.message, true); return null; } }
function befehl(cmd, erfolg) {
  const r = sicher(() => welt.execute(state, cmd));
  if (!r) return false;
  if (r.ok) { geaendert = true; melde(erfolg); } else melde('Abgelehnt: ' + r.reason, true);
  zeigen(true);
  return r.ok;
}
const eigene = () => Object.values(state.ships).filter((s) =>
  s.owner === SPIELER && (s.klasse === 'miner' || s.klasse === 'frachter')).sort((a, b) => a.id.localeCompare(b.id));
const gewaehlt = () => eigene().find((s) => s.id === $('schiff').value) || eigene()[0] || null;

// ---------------------------------------------------------------- Darstellung
function tabelle(ziel, kopf, zeilen) {
  const t = document.createElement('table'), h = t.createTHead().insertRow();
  for (const k of kopf) { const th = document.createElement('th'); th.textContent = k; h.appendChild(th); }
  const b = t.createTBody();
  for (const z of zeilen) { const r = b.insertRow(); for (const c of z) { const td = r.insertCell(); if (c instanceof Node) td.appendChild(c); else td.textContent = String(c); } }
  ziel.replaceChildren(t);
}
function knopf(text, aktion) { const b = document.createElement('button'); b.textContent = text; b.addEventListener('click', aktion); return b; }
function groesse() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [canvas.clientWidth, canvas.clientHeight];
}
const lageText = { angedockt: 'im Dock', frei: 'im Raum', andocken: 'dockt an', abdocken: 'dockt ab', transit: 'im Transit' };
// Sichtbares Cockpit ist ausschließlich Projektion des autoritativen Flugkörpers.
// Der Benutzer setzt nur bei einem ausdrücklichen Klick den ursprünglichen shipSteer-Befehl ab.
function pilotWerte() {
  $('pilotKursWert').textContent = $('pilotKurs').value;
  $('pilotFahrtWert').textContent = $('pilotFahrt').value + ' %';
  // Nur UI: weder Kurstasten noch Regler schreiben vor dem Anwenden in den Weltzustand.
  for (const taste of document.querySelectorAll('[data-pilot-kurs]'))
    taste.setAttribute('aria-pressed', String(taste.dataset.pilotKurs === $('pilotKurs').value));
}
function kartenZeigen(s, pendel, k) {
  const ziel = $('kartenZiel').value, zielText = KARTEN_TEXTE[ziel];
  const steuerbar = !!s && s.flug?.lage === 'frei' && !pendel && !k.flugdienst[s.id]?.gestrandet;
  $('kartenAnflug').disabled = !steuerbar || !zielText
    || (ziel === 'aldera:tor' && s?.klasse !== 'frachter');
  let hinweis;
  if (!zielText) hinweis = 'Auf der Karte Eisfeld, Erzfeld oder Dock berühren – oder Ziel in der Liste wählen. Noch kein Flugauftrag.';
  else if (!s) hinweis = zielText + ' vorgemerkt. Zuerst ein eigenes Schiff kaufen.';
  else if (pendel) hinweis = zielText + ' vorgemerkt. Pendelauftrag steuert selbst; erst beenden.';
  else if (ziel === 'aldera:tor' && s.klasse !== 'frachter')
    hinweis = 'Das Sprungtor ist nur Ziel für den eigenen finanzierten Frachter.';
  else if (s.flug.lage === 'angedockt') hinweis = zielText + ' vorgemerkt. Erst „Abdocken“ und das Manöver abwarten.';
  else if (!steuerbar) hinweis = zielText + ' vorgemerkt. Handflug aktuell nicht verfügbar.';
  else hinweis = zielText + ' vorgemerkt – erst „Zielflug bestätigen“ startet den bezahlten Original-Anflug.';
  // VoiceOver-Livebereich nicht jede Animationsframe erneut mutieren.
  if ($('kartenHinweis').textContent !== hinweis) $('kartenHinweis').textContent = hinweis;
}
// Begleitete Eisrunde: liest nur echte Fluglage/Ladung/Originalregeln und verweist
// auf die bereits vorhandenen Bedienknöpfe. Kein selbständiger Auftrag und keine
// Vorwegnahme der Core-Finanzierungs-, Eigentums- oder Abnahmeprüfung.
function rundenZeigen(s, pendel, k) {
  const b = s?.flug, dienst = s && k.flugdienst[s.id];
  const eis = s?.ladung.eis || 0;
  const ladung = s ? Object.values(s.ladung).reduce((sum, n) => sum + n, 0) : 0;
  const raum = welt.rules.economy.cargo;
  let titel, info, ziel = null, label = '';
  if (!s) {
    titel = 'Start · Miner kaufen';
    info = 'An der Station kann ein eigener Miner nur mit echtem Käufergeld und vorhandener Hülle gekauft werden.';
    ziel = 'station'; label = 'Zur Station';
  } else if (s.klasse === 'frachter') {
    titel = 'Persönlicher Frachterflug';
    info = 'Freie 2D-Steuerung nur für einen eigenen, ungebundenen Aldera-Frachter. Warenfahrten werden weiterhin im originalen W3-Core vergeben, nicht durch diesen Assistenten.';
  } else if (pendel) {
    titel = 'Pendelauftrag aktiv';
    info = 'Die NPC-Automatik steuert diesen Miner. Für eine persönliche Eisrunde zuerst den Pendelauftrag regulär beenden.';
  } else if (dienst?.gestrandet) {
    titel = 'Flug angehalten · Reserve fehlt';
    info = 'Keine kostenlose Rettung. Eine neue Finanzierung muss der Core prüfen.';
  } else if (b.lage === 'angedockt' && eis > 0) {
    titel = '6/6 · Eis am Dock verkaufen';
    info = fmt(eis) + ' selbst geförderte Eis an Bord. Aldera muss den Kauf aus eigener Kasse finanzieren.';
    ziel = 'verkaufen'; label = 'Eisverkauf prüfen';
  } else if (b.lage === 'angedockt' && ladung > 0) {
    titel = 'Andere Ware an Bord';
    info = 'Dieser Assistent führt nur durch Eisrunden. Für andere Ladung die vorhandenen Fachaktionen nutzen.';
  } else if (b.lage === 'angedockt') {
    titel = '1/6 · Abdocken';
    info = 'Der Core muss die bezahlte Flugreserve vor dem Start binden. Der Miner bleibt bis zur Ausführung im Dock.';
    ziel = 'abdocken'; label = 'Abdocken prüfen';
  } else if (b.lage === 'abdocken' || b.lage === 'andocken') {
    titel = b.lage === 'abdocken' ? 'Abdockmanöver läuft' : '5/6 · Andockmanöver läuft';
    info = 'Das Manöver benötigt echte Simulationszeit. Mit +1 Minute läuft der Originalkern weiter.';
    ziel = 'minute'; label = '+1 Minute simulieren';
  } else if (b.lage !== 'frei') {
    titel = 'Schiff nicht im freien Flug';
    info = 'Diese Fluglage wird ausschließlich vom Weltkern bestimmt.';
  } else if (b.modus === 'anflug' && b.ziel
    && !(b.ziel.art === 'feld' && b.ziel.id === 'aldera:eis' && welt.flugKern.imFeld(s, 'eis'))) {
    // Der Originalregler behält innerhalb des Feld-Haltradius den Modus „anflug“,
    // obwohl das Schiff schon ruht und die Core-Feldprüfung bereits Abbau erlaubt.
    // Hier entscheidet die echte Orts-/Tempo-Prüfung, nicht der bloße Modus.
    titel = b.andocken ? '5/6 · Rückflug zum Dock' : '2/6 · Anflug zum Feld';
    info = 'Der bestehende Flugbefehl ist aktiv. Die nächste Minute verursacht nur die im Core vorgesehenen Buchungen.';
    ziel = 'minute'; label = '+1 Minute simulieren';
  } else if (s.auftrag === 'foerdern' && s.ware !== 'eis') {
    titel = 'Erzförderung aktiv';
    info = 'Die Eisrunde greift nicht in einen laufenden Erzauftrag ein. Über „Förderung stoppen“ lässt er sich beenden.';
  } else if (s.auftrag === 'foerdern' && ladung < raum) {
    titel = '3/6 · Eis wird gefördert';
    info = fmt(eis) + ' Eis an Bord; ' + fmt(raum - ladung) + ' Ladeeinheiten frei. Der Bergbaulohn wird für echte Minuten bezahlt.';
    ziel = 'minute'; label = '+1 Förderminute';
  } else if (s.auftrag === 'foerdern') {
    titel = '4/6 · Laderaum voll';
    info = fmt(eis) + ' Eis an Bord. Den Förderauftrag stoppen, bevor der Rückflug beginnt.';
    ziel = 'warten'; label = 'Förderung stoppen';
  } else if (eis > 0 || ladung >= raum) {
    titel = '5/6 · Mit Ladung zurück';
    info = fmt(eis) + ' Eis an Bord. Verkauf ist nur nach einer echten Andockung möglich.';
    ziel = 'andocken'; label = 'Zum Dock zurück';
  } else if (welt.flugKern.imFeld(s, 'eis')) {
    titel = '3/6 · Eisfeld erreicht';
    info = 'Der Miner befindet sich wirklich im Eisfeld und ist langsam genug. Der Core entscheidet über den finanzierten Förderauftrag.';
    ziel = 'foerdernEis'; label = 'Eisförderung prüfen';
  } else {
    titel = '2/6 · Zum Eisfeld';
    info = 'Noch keine Eisladung. Der originale Zielflug braucht bezahlte Pilotenarbeit und echte Reisezeit.';
    ziel = 'zumEis'; label = 'Eisfeld anfliegen';
  }
  const t = $('rundenTitel'), p = $('rundenInfo'), a = $('rundenAktion');
  if (t.textContent !== titel) t.textContent = titel;
  if (p.textContent !== info) p.textContent = info; // Keine VoiceOver-Mutation pro Animationsframe.
  const original = ziel === 'station' ? document.querySelector('nav button[data-ansicht="station"]')
    : ziel ? $(ziel) : null;
  rundenZiel = original && !original.disabled ? ziel : null;
  a.disabled = !rundenZiel;
  if (a.textContent !== (rundenZiel ? label : 'Keine Aktion verfügbar'))
    a.textContent = rundenZiel ? label : 'Keine Aktion verfügbar';
}
function pilotZeigen(s, pendel, k, o) {
  const id = s ? s.id : '';
  if (pilotSchiff !== id) {
    pilotSchiff = id;
    $('kartenZiel').value = ''; // Bei Schiffs-/Weltwechsel keine alte, ungeprüfte Zielvormerkung übernehmen.
    $('pilotKurs').value = s ? String(s.flug.sollKurs) : '0';
    $('pilotFahrt').value = s ? String(s.flug.sollFahrt) : '0';
    pilotWerte();
  }
  const b = s?.flug, dienst = s && k.flugdienst[s.id];
  const transit = !!s && b?.lage === 'transit'
    && state.w5n.frachtauftrag?.schiff === s.id
    && k.spielerFrachten?.auftraege?.some(x => x.schiff === s.id && x.end === null);
  const steuerbar = !!b && (b.lage === 'frei' && !pendel && !dienst?.gestrandet || transit);
  for (const element of ['pilotKurs', 'pilotFahrt', 'pilotAnwenden', 'pilotBremsen'])
    $(element).disabled = !steuerbar;
  for (const taste of document.querySelectorAll('[data-pilot-kurs]')) taste.disabled = !steuerbar;
  $('pilotPosition').textContent = b ? Math.round(b.x / 1000) + ' / ' + Math.round(b.y / 1000) + ' kP' : '–';
  $('pilotIst').textContent = b ? b.kurs + ' / ' + Math.round(Math.hypot(b.vx, b.vy)) + ' P/s' : '–';
  $('pilotLage').textContent = b ? (lageText[b.lage] || b.lage) + ' · ' + (pendel ? 'Pendel ' + pendel.ware : b.modus) : '–';
  $('pilotReserve').textContent = transit
    ? fmt(o.w5n_fracht_arbeit?.cash ?? 0) + ' ISK · bezahlter W5n-Lohn'
    : dienst ? fmt(o[dienst.konto]?.cash ?? 0) + ' ISK' : 'nicht gebunden';
  let hinweis;
  if (!s) hinweis = 'Zuerst unter „Station“ einen eigenen Miner kaufen.';
  else if (pendel) hinweis = 'Der Pendelauftrag steuert automatisch. Für Handflug zuerst „Pendel beenden“ und die Dockrückkehr abwarten.';
  else if (dienst?.gestrandet) hinweis = 'Flug angehalten: Die Arbeitsreserve ist leer. Der Core prüft eine echte Nachfinanzierung.';
  else if (b.lage === 'angedockt') hinweis = 'Im Dock: „Abdocken“ drücken. Der Core bindet die echte Flugreserve; ein Kartenziel kann bereits vorgemerkt werden.';
  else if (b.lage === 'abdocken' || b.lage === 'andocken') hinweis = 'Dockmanöver läuft – Steuerung erst danach verfügbar.';
  else if (transit) hinweis = 'Bezahlter Fracht-Transitkorridor: Kurs und Sollfahrt bewegen den echten 2D-Flugkörper. Die Original-W5n-Route liefert nach 60 Minuten; Manöver verändern weder Lieferzeit noch Geld.';
  else if (b.lage !== 'frei') hinweis = 'Das Schiff ist derzeit nicht im freien Flug.';
  else if (s.klasse === 'frachter') hinweis = 'Eigener Frachter im Aldera-Raum: originale Kurs- und Kartensteuerung, bezahlter Pilotlohn; physisch andocken vor jedem wirtschaftlichen Auftrag.';
  else if (welt.flugKern.imFeld(s, 'eis')) hinweis = 'Eisfeld erreicht und langsam genug: Der Originalbefehl „Eis fördern“ kann jetzt geprüft werden.';
  else if (welt.flugKern.imFeld(s, 'erz')) hinweis = 'Erzfeld erreicht und langsam genug: Der Originalbefehl „Erz fördern“ kann jetzt geprüft werden.';
  else hinweis = 'Freier Flug: Kurs und Fahrt einstellen, dann „Manuell steuern“. Zur Station mit „Andocken“ zurückkehren.';
  if ($('pilotHinweis').textContent !== hinweis) $('pilotHinweis').textContent = hinweis;
}
function zeichnen() {
  const [w, h] = groesse(), K = welt.flugKern, sys = K.DATEN.systeme.aldera;
  const fr = gewaehlt(), a = state.w5n.frachtauftrag;
  const imKorridor = fr?.flug.lage === 'transit' && a?.schiff === fr.id
    && state.kanon.spielerFrachten?.auftraege?.some(x => x.schiff === fr.id && x.end === null);
  if (imKorridor) {
    // Reine Projektion EINES echten Flugkörpers aus dem gemeinsamen Core, keine
    // Kosmetik-Position: Kurs/Fahrt beeinflussen dieselben x/y/vx/vy wie in Aldera.
    // Der Fortschrittsbalken zeigt getrennt die unveränderte W5n-Zeit.
    // Kamera folgt dem echten Flugkörper, damit ein 60-Minuten-Kurs bei
    // jeder Displaygröße sichtbar bleibt; nur die Ansicht bewegt sich.
    const b = fr.flug, zoom = Math.min(w, h) / 1800000;
    const cx = b.x, cy = b.y;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#06101b'; ctx.fillRect(0, 0, w, h);
    graph.himmel(cx, cy, zoom, w, h);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#285b70';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    const [x, y] = G.projektion(b.x, b.y, cx, cy, zoom, w, h);
    graph.schiff(G.adapter(fr), x, y, 0);
    const hin = a.phase === 'hin', abschnitt = hin ? a.gearbeitet : a.gearbeitet - a.zeit;
    const ziel = hin ? 'Nadir' : 'Aldera';
    const rand = Math.min(16, w / 24), balken = Math.max(60, w - rand * 2);
    ctx.fillStyle = '#a9eaff'; ctx.font = '13px system-ui';
    ctx.fillText('2D-Transitkorridor · nach ' + ziel, rand, 22);
    ctx.fillStyle = '#284453'; ctx.fillRect(rand, 33, balken, 8);
    ctx.fillStyle = '#72d2e3'; ctx.fillRect(rand, 33, balken * Math.max(0, Math.min(1, abschnitt / a.zeit)), 8);
    $('hud').textContent = 'K1-Regel199 · ' + ziel + ': ' + fmt(abschnitt) + '/' + a.zeit
      + ' echte bezahlte Transitminuten · manueller 2D-Kurs ' + b.kurs
      + ' · X ' + Math.round(b.x / 1000) + ', Y ' + Math.round(b.y / 1000) + ' kP'
      + ' · W5n-Ankunft bleibt zeitgebunden' + (pausiert ? ' · pausiert' : '');
    return;
  }
  const cx = KARTEN_MITTE.x, cy = KARTEN_MITTE.y, z = kartenSkala(w, h);
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#06101b'; ctx.fillRect(0, 0, w, h);
  graph.himmel(cx, cy, z, w, h);
  const p = (x, y) => G.projektion(x, y, cx, cy, z, w, h);
  ctx.font = '12px system-ui';
  for (const f of sys.felder) {
    const [x, y] = p(f.x, f.y);
    ctx.strokeStyle = f.ware === 'eis' ? '#8dd9f4' : '#c08c62'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, Math.max(6, f.radius * z), 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.fillText(f.ware === 'eis' ? 'Eisfeld' : 'Erzfeld', x + 8, y - 12);
    if ($('kartenZiel').value === f.id) { ctx.beginPath(); ctx.strokeStyle = '#ffe59b'; ctx.lineWidth = 3; ctx.arc(x, y, Math.max(25, f.radius * z + 5), 0, Math.PI * 2); ctx.stroke(); }
  }
  const tor = welt.daten.tor;
  const [gx, gy] = p(tor.x, tor.y);
  ctx.strokeStyle = $('kartenZiel').value === 'aldera:tor' ? '#ffe59b' : '#8ad8bb';
  ctx.lineWidth = $('kartenZiel').value === 'aldera:tor' ? 3 : 1.5;
  ctx.beginPath(); ctx.arc(gx, gy, Math.max(8, tor.radius * z), 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#9fe6d1'; ctx.fillText('Sprungtor · Aldera', gx + 8, gy - 10);
  const [sx, sy] = p(sys.station.x, sys.station.y);
  ctx.strokeStyle = '#6a8f9e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#d3e8ec'; ctx.fillText('Aldera · Dock', sx + 18, sy - 8);
  if ($('kartenZiel').value === sys.station.id) { ctx.beginPath(); ctx.strokeStyle = '#ffe59b'; ctx.lineWidth = 3; ctx.arc(sx, sy, 25, 0, Math.PI * 2); ctx.stroke(); }
  let imDock = 0;
  for (const s of Object.values(state.ships).sort((a, b) => a.id.localeCompare(b.id))) {
    if (!s.flug || s.system !== 'aldera' || s.flug.lage === 'transit') continue;
    const v = G.adapter(s), [x, y] = p(v.x, v.y);
    const versatz = s.flug.lage === 'angedockt' ? (imDock++) * 14 - 14 : 0;
    graph.schiff(v, x + versatz, y + (s.flug.lage === 'angedockt' ? 24 : 0), s.owner === SPIELER ? 0 : 1);
    if (s.flug.lage !== 'angedockt') { ctx.fillStyle = s.owner === SPIELER ? '#aaf5ff' : '#c7e4bc'; ctx.fillText(s.id, x + 12, y + 20); }
  }
  const transit = Object.values(state.ships).filter((s) => s.flug?.lage === 'transit').length;
  $('hud').textContent = 'Regel 199 · Tag ' + (Math.floor(state.tick / 1440) + 1) + ', Minute ' + fmt(state.tick % 1440)
    + (transit ? ' · ' + transit + ' Frachter im Transit Aldera ↔ Nadir' : '') + (pausiert ? ' · pausiert' : '');
}
function zeigen(alles = false) {
  if (!state) return;
  const b = welt.bericht(state), o = state.owners, k = state.kanon;
  // Schiffsauswahl nur bei Bestandsänderung neu aufbauen, damit die Auswahl stabil bleibt.
  const liste = eigene().map((s) => s.id).join(), wahl = $('schiff');
  if (wahl.dataset.liste !== liste) {
    const alt = wahl.value;
    wahl.replaceChildren(...eigene().map((s) => { const op = document.createElement('option'); op.value = s.id; op.textContent = s.id + ' · ' + (s.klasse === 'frachter' ? 'Frachter' : 'Miner'); return op; }));
    if (!eigene().length) { const op = document.createElement('option'); op.value = ''; op.textContent = 'kein eigenes Schiff'; wahl.appendChild(op); }
    if (eigene().some((s) => s.id === alt)) wahl.value = alt;
    wahl.dataset.liste = liste;
  }
  const s = gewaehlt(), pendel = s && k.pendel[s.id], imRaum = s && s.flug.lage !== 'angedockt';
  pilotZeigen(s, pendel, k, o);
  kartenZeigen(s, pendel, k);
  const miner = !!s && s.klasse === 'miner';
  const frachter = !!s && s.klasse === 'frachter';
  $('minerAuftraege').hidden = $('minerAufgaben').hidden = !miner;
  $('rundenHilfe').hidden = frachter; // Ohne eigenes Schiff weiterhin zur Station leiten.
  $('frachterAufgaben').hidden = !frachter;
  if (frachter) {
    const aktiv = state.w5n.frachtauftrag?.schiff === s.id;
    const bestand = k.spielerFrachten?.auftraege || [];
    const letzter = bestand.filter((x) => x.schiff === s.id).at(-1);
    const angebot = !aktiv ? welt.kern.pilotIceFreightQuote(state, s.id) : null;
    const hinweis = aktiv
      ? 'Original-W5n-Rundfracht läuft: echte 2D-Kurs-/Bremsmanöver im Korridor möglich. Ankunft und Zahlung erfolgen unverändert nach 60+60 bezahlten Kernminuten.'
      : s.system === 'aldera' && s.phase === 'dock'
        ? 'Eigener Frachter ' + s.id + ' in Aldera. Handflug nach dem Abdocken oder bezahlter Eisfrachtvertrag direkt vom Dock.'
        : 'Der Frachter ist nicht frei am Aldera-Dock. Fracht und Handflug bleiben durch den gemeinsamen Kern gesperrt.';
    const quote = aktiv
      ? 'Unterwegs: ' + state.w5n.frachtauftrag.phase + ', ' + state.w5n.frachtauftrag.gearbeitet +
        ' von ' + 2 * welt.rules.w5n.flugMinuten + ' tatsächlich bezahlten Flugminuten.'
      : angebot?.ok
        ? 'Finanzierbar: ' + welt.rules.w5n.charge + ' Eis, ' + fmt(angebot.eis) + ' ISK Warenkauf aus Nadir, ' +
          fmt(angebot.fracht) + ' ISK Frachtentgelt, ' + fmt(angebot.arbeit) +
          ' ISK eigene Pilotenarbeitsreserve. Der Core bindet alle Mittel beim Annehmen.'
        : 'Nicht finanzierbar: ' + (angebot?.grund || 'kein verfügbares Originalangebot');
    const fortschritt = letzter
      ? 'Eigene Fracht: ' + (letzter.geliefert === null ? 'Eis unterwegs nach Nadir'
        : '50 Eis real an Nadir geliefert, Tick ' + letzter.geliefert) +
        (letzter.end === null ? ' · bezahlte Rückfahrt offen' : ' · Rundfahrt bezahlt abgeschlossen bei Tick ' + letzter.end)
      : 'Noch keine persönliche Fracht abgeschlossen.';
    for (const [id, text] of [['frachterHinweis', hinweis], ['frachtAngebot', quote], ['frachtFortschritt', fortschritt]])
      if ($(id).textContent !== text) $(id).textContent = text;
    $('frachtAnnehmen').disabled = !angebot?.ok
      || (k.politik.stilllegung && welt.buchwert(state, s.id) === 0);
    const torCheck = welt.torPruefen(state, s);
    const torFracht = welt.torFrachtPruefen(state, {type:'shipFreightGateIce',
      owner:SPIELER, schiff:s.id});
    const clearance = k.tor?.freigaben?.[s.id];
    const torText = clearance
      ? 'Aldera-Tor physisch geprüft, Tick ' + clearance.tick
        + ' nach ' + clearance.arbeit + ' tatsächlich bezahlten Handflugminuten.'
        + (s.flug.lage === 'angedockt' ? ' Am Dock kann die TOR-Fracht beauftragt werden.'
          : ' Jetzt zum Aldera-Dock zurückkehren und physisch andocken.')
      : 'Aldera-Tor (' + fmt(welt.daten.tor.x/1000) + ' / '
        + fmt(welt.daten.tor.y/1000) + ' kP): ' + torCheck.grund;
    if ($('torHinweis').textContent !== torText) $('torHinweis').textContent = torText;
    $('torPruefen').disabled = !torCheck.ok;
    $('torFracht').disabled = !torFracht.ok || !angebot?.ok;
  } else {
    $('frachtAnnehmen').disabled = true;
    $('torPruefen').disabled = true;
    $('torFracht').disabled = true;
  }
  $('pendelEis').disabled = $('pendelErz').disabled = !miner || !!pendel || imRaum;
  $('pendelStop').disabled = !pendel;
  const bergbauHand = miner && !pendel;
  $('zumEis').disabled = $('zumErz').disabled = !bergbauHand || s.flug.lage !== 'frei';
  $('warten').disabled = !bergbauHand || s.auftrag !== 'foerdern';
  $('verkaufen').disabled = !bergbauHand || s.flug.lage !== 'angedockt' || !(s.ladung.eis > 0);
  // Die sichtbaren Direktaktionen lesen nur die vorhandene Fluglage bzw. die Original-Feldprüfung.
  // Der Core validiert und finanziert den Auftrag bei Ausführung weiterhin selbst.
  $('abdocken').disabled = !s || !!pendel || s.flug.lage !== 'angedockt';
  $('andocken').disabled = !s || !!pendel || s.flug.lage !== 'frei';
  $('foerdernEis').disabled = !miner || !!pendel || !welt.flugKern.imFeld(s, 'eis');
  $('foerdernErz').disabled = !miner || !!pendel || !welt.flugKern.imFeld(s, 'erz');
  rundenZeigen(s, pendel, k);
  $('kaufMiner').disabled = o[SPIELER].cash < welt.rules.economy.waren.miner.basis || !(state.stations.st_aldera.lager.miner > 0);
  $('kaufFrachter').textContent = 'Frachter kaufen · ' + fmt(welt.rules.economy.waren.frachter.basis) + ' ISK';
  $('kaufFrachter').disabled = o[SPIELER].cash < welt.rules.economy.waren.frachter.basis
    || !(state.stations.st_aldera.lager.frachter > 0);
  $('dividende').disabled = b.firmen[SPIELER].ausschuettbar <= 0;
  $('automatik').setAttribute('aria-pressed', String(k.politik.automatik));
  $('automatik').textContent = 'NPC-Automatik ' + (k.politik.automatik ? 'an' : 'aus');
  if (s) tabelle($('schiffStatus'), ['Schiff', 'Lage', 'Auftrag', 'Ladung', 'Flugreserve', 'Buchwert'], [[s.id, lageText[s.flug.lage],
    (pendel ? 'Pendel ' + pendel.ware + (pendel.beenden ? ' (endet)' : '') : s.auftrag) + (k.flugdienst[s.id]?.gestrandet ? ' · gestrandet' : ''),
    Object.entries(s.ladung).filter(([, n]) => n > 0).map(([ware, n]) => n + ' ' + ware).join(', ') || '–',
    k.flugdienst[s.id] ? fmt(o[k.flugdienst[s.id].konto].cash) + ' ISK' : '–', fmt(welt.buchwert(state, s.id)) + ' ISK']]);
  else $('schiffStatus').replaceChildren();
  if (!alles && ansicht === 'flug') return;
  if (ansicht === 'konzern') tabelle($('firmen'), ['Firma', 'Kasse', 'Anlagewert', 'Ersatzrücklage', 'ausschüttbar', 'ausgeschüttet', 'Eigentümerkonto'],
    Object.entries(b.firmen).map(([f, v]) => [f === SPIELER ? f + ' (Spieler)' : f, fmt(v.kasse), fmt(v.anlagewert), fmt(v.ruecklage), fmt(v.ausschuettbar), fmt(v.ausgeschuettet), fmt(o[welt.daten.anteile[f]].cash)]));
  if (ansicht === 'station') tabelle($('stationen'), ['Station', 'Kasse', 'Erz', 'Eis', 'Wasser', 'Wasserpreis', 'Material', 'Miner', 'Frachter'],
    ['st_aldera', 'st_nadir'].map((id) => { const l = state.stations[id].lager; return [id === 'st_aldera' ? 'Aldera' : 'Nadir', fmt(o[id].cash), l.erz || 0, l.eis || 0, l.wasser || 0,
      (id === 'st_nadir' ? welt.rules.w5n.wasserPreis : welt.daten.wasser.preisAldera) + ' ISK', l.material || 0, l.miner || 0, l.frachter || 0]; }));
  if (ansicht === 'flotte') tabelle($('schiffe'), ['Schiff', 'Eigentümer', 'Klasse', 'Ort', 'Lage', 'Auftrag', 'aktive Minuten', 'Buchwert'],
    b.schiffe.map((x) => { const sh = state.ships[x.id]; return [x.id, x.owner, x.klasse, sh.system, lageText[sh.flug.lage], k.pendel[x.id] ? 'Pendel ' + k.pendel[x.id].ware : sh.auftrag,
      fmt(x.aktivMinuten), fmt(x.buchwert) + (x.stillgelegt ? ' · stillgelegt' : '')]; }));
  if (ansicht === 'wirtschaft') {
    tabelle($('kreislauf'), ['Größe', 'Wert'], [['Weltgeld', fmt(b.weltgeld) + ' ISK'], ['Emission / Senke', b.minted + ' / ' + b.burned],
      ['In Treuhand und Reserven gebunden', fmt(b.gebunden) + ' ISK'], ['Eis gefördert / an Aldera verkauft', fmt(b.produktion.eisGefoerdert) + ' / ' + fmt(b.verkaeufe.eisAnAldera)],
      ['Eisfrachten abgeschlossen', fmt(b.auftraege.eisfrachten)], ['Wasser produziert', fmt(b.produktion.wasserProduziert)],
      ['Wasser verkauft Nadir / Aldera', fmt(b.verkaeufe.wasserNadir) + ' / ' + fmt(b.verkaeufe.wasserAldera)], ['Wassererlös', fmt(b.verkaeufe.wasserErloes) + ' ISK'],
      ['Löhne Bergbau / Frachtpiloten', fmt(b.loehne.bergbau) + ' / ' + fmt(b.loehne.frachtpiloten) + ' ISK'],
      ['Löhne Wasserwerk / Minerflug', fmt(b.loehne.wasserwerk) + ' / ' + fmt(b.loehne.minerflug) + ' ISK'],
      ['Ausschüttungen', fmt(b.dividenden) + ' ISK'], ['Ersatzkäufe / gebaute Frachter', b.ersatzkaeufe + ' / ' + b.produktion.frachterGebaut],
      ['K2 Miner gebaut / nach Aldera geliefert', b.produktion.minerGebaut + ' / ' + b.produktion.minerGeliefert],
      ['K3 Ersatzfrachter · Material / Werft', (state.stations.st_nadir.lager.material || 0) + ' / ' + welt.kern.pilotW5Kalkulation(state).grund],
      ['K3 Kaufgeld / Überführung', fmt(o.transport.cash) + ' ISK / ' + (state.w5ac.active ? state.w5ac.active.id + ' unterwegs' : 'kein aktiver Transfer')],
      ['K3 nächster Auftrag', state.w5n.frachtauftrag ? 'Eisfracht finanziert' : state.w3.auftrag ? 'Erzfracht finanziert' : 'kein aktiver Frachtauftrag'],
      ['Erz exportiert / Rest Exportetat', fmt(b.verkaeufe.erzExportiert) + ' / ' + fmt(b.kaeuferliquiditaet.export) + ' ISK']]);
    tabelle($('haushalte'), ['Haushalt', 'Wohnort', 'Kasse', 'ausgegeben', 'Wasser gekauft'],
      Object.entries(b.haushalte).map(([id, v]) => [id, welt.daten.haushalte[id] === 'st_aldera' ? 'Aldera' : 'Nadir', fmt(v.kasse), fmt(v.ausgegeben), fmt(v.gekauft)]));
    const e = b.engpass ? Object.entries(b.engpass.zaehler).sort((x, y) => y[1] - x[1]).slice(0, 8) : [];
    tabelle($('engpass'), ['Ursache', 'Minuten'], e.length ? e.map(([g, n]) => [g, fmt(n)]) : [['bisher keiner', '–']]);
  }
  if (ansicht === 'spielstand') zeigeSpeicher();
}
function zeigeSpeicher() {
  if (!speicher) return;
  const ü = speicher.uebersicht();
  $('speicherStatus').replaceChildren(Object.assign(document.createElement('small'), { textContent:
    (speicher.gesperrt ? 'GESPERRT: ' + speicher.gesperrt + ' · ' : '') + (dauerhaft ? 'IndexedDB „' + Speicher.DATENBANK + '“' : 'Kein dauerhafter Speicher verfügbar – nur JSON-Export sichert diesen Stand')
    + ' · aktive Welt ' + (ü.aktiv || '–') + ' · Tick ' + fmt(state.tick) + ' · Hash ' + welt.hash(state) }));
  const zeilen = [];
  for (const w of ü.welten) for (const p of [...w.auto, ...w.manuell]) zeilen.push([w.weltId === ü.aktiv ? 'aktiv' : w.weltId.slice(0, 8) + '…', p.platz, p.revision, fmt(p.tick), p.gespeichert.slice(0, 19).replace('T', ' '),
    knopf('Laden', () => laden(w.weltId, p.platz)), knopf('Export', () => herunterladen(speicher.exportieren(w.weltId, p.platz), 'aphros-void-welt-' + p.tick + '.json'))]);
  tabelle($('plaetze'), ['Welt', 'Platz', 'Revision', 'Tick', 'gespeichert', '', ''], zeilen);
  tabelle($('sicherungen'), ['Sicherung', 'Grund', 'Zeit', 'Bytes', ''], ü.sicherungen.map((x) => [x.id, x.grund, x.zeit.slice(0, 19).replace('T', ' '), fmt(x.bytes),
    knopf('Export', () => herunterladen(speicher.sicherungExportieren(x.id), 'aphros-void-sicherung-' + x.id + '.json'))]));
}

// ---------------------------------------------------------------- Spielstand
function herunterladen(text, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function autosave(grund) {
  if (!speicher || !state || speicher.gesperrt) return;
  try { await speicher.autosave(welt.save(state)); geaendert = false; letzterSave = Date.now(); if (grund) melde(grund); }
  catch (e) { melde('Speichern fehlgeschlagen: ' + e.message + ' – bitte JSON exportieren.', true); }
  if (ansicht === 'spielstand') zeigeSpeicher();
}
function uebernehmen(geladen, text) {
  welt = geladen.welt; state = geladen.state; pausiert = true; rest = 0; geaendert = false;
  $('schiff').dataset.liste = ''; pilotSchiff = null; melde(text); zeigen(true);
}
async function laden(weltId, platz) {
  if (!confirm('Platz „' + platz + '“ laden? Der aktuelle Stand wird vorher als Autosave gesichert.')) return;
  try {
    await autosave();
    const g = speicher.laden(weltId, platz);
    if (weltId !== speicher.aktiv) await speicher.aktivieren(weltId);
    uebernehmen(g, 'Geladen und pausiert: ' + platz + ' (Tick ' + fmt(g.state.tick) + ').');
  } catch (e) { melde('Laden abgelehnt: ' + e.message, true); }
}
async function neueWelt(frage) {
  if (frage && !confirm('Neue Welt beginnen? Die bisherige Welt bleibt mit allen Plätzen erhalten.')) return;
  const w = Welt.erstellen({}), s = w.createState(42);
  try {
    if (state) await autosave();
    await speicher.neueWelt(w.save(s));
    uebernehmen({ welt: w, state: s }, 'Neue Welt angelegt (33.000 ISK, Regel 199). Pausiert.');
  } catch (e) { welt = w; state = s; melde('Welt läuft ohne Ablage: ' + e.message, true); zeigen(true); }
}
function dateiLesen(input, f) {
  const datei = input.files && input.files[0];
  if (!datei) return;
  const leser = new FileReader();
  leser.onload = () => { input.value = ''; f(String(leser.result)); };
  leser.onerror = () => melde('Datei nicht lesbar.', true);
  leser.readAsText(datei);
}

// ---------------------------------------------------------------- Zeit
function frame(zeit) {
  if (state && letzter !== null && !pausiert) {
    const faktor = TEMPI[tempo];
    rest += Math.min(250, Math.max(0, zeit - letzter)) * 60 * faktor / 1000; // 1× = eine Spielminute je Sekunde
    let n = Math.min(faktor >= 60 ? 3600 : 600, Math.floor(rest)); rest -= n;
    sicher(() => {
      while (n >= 60 && state.flug.schritt === 0 && faktor >= 60) { welt.minute(state); n -= 60; }
      for (; n > 0; n--) welt.teilschritt(state);
    });
    geaendert = true;
    if (Date.now() - letzterSave > 30000) { letzterSave = Date.now(); autosave(); }
  }
  letzter = zeit;
  if (state) { sicher(zeichnen); sicher(() => zeigen(false)); }
  requestAnimationFrame(frame);
}
let langsam = 0;
setInterval(() => { if (state && ansicht !== 'flug' && ++langsam) sicher(() => zeigen(true)); }, 1000);

// ---------------------------------------------------------------- Bedienung
// Auswahl per Tap oder Tastatur ist ausschließlich eine vorläufige UI-Markierung.
// Auf der Karte stehen nur die echten Core-Station und die echten Core-Felder zur Wahl.
canvas.addEventListener('click', (ev) => {
  if (!state || ansicht !== 'flug') return;
  const gewählt = gewaehlt();
  // Der Transportkorridor zeigt keine Aldera-Felder; Klicks dürfen dort nicht
  // als scheinbare Dock- oder Förderziele interpretiert werden.
  if (gewählt?.flug.lage === 'transit' && state.w5n.frachtauftrag?.schiff === gewählt.id) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const w = canvas.clientWidth, h = canvas.clientHeight, z = kartenSkala(w, h);
  const px = (ev.clientX - rect.left) * w / rect.width, py = (ev.clientY - rect.top) * h / rect.height;
  const sys = welt.flugKern.DATEN.systeme.aldera;
  const tor = welt.daten.tor;
  const ziele = [{ id: sys.station.id, x: sys.station.x, y: sys.station.y, radius: 30 },
    ...sys.felder.map(f => ({ id: f.id, x: f.x, y: f.y, radius: Math.max(30, f.radius * z) })),
    { id: 'aldera:tor', x: tor.x, y: tor.y, radius: Math.max(30, tor.radius * z) }];
  let kandidat = null, abstand = Infinity;
  for (const ziel of ziele) {
    const [x, y] = G.projektion(ziel.x, ziel.y, KARTEN_MITTE.x, KARTEN_MITTE.y, z, w, h);
    const d = (x - px) ** 2 + (y - py) ** 2;
    if (d <= ziel.radius ** 2 && d < abstand) { kandidat = ziel.id; abstand = d; }
  }
  if (kandidat && Object.hasOwn(KARTEN_TEXTE, kandidat)) {
    $('kartenZiel').value = kandidat;
    zeigen(false);
  }
});
$('kartenZiel').addEventListener('change', () => { if (state) zeigen(false); });
$('schiff').addEventListener('change', () => { if (state) zeigen(false); });
$('kartenAnflug').addEventListener('click', () => {
  const s = gewaehlt(), ziel = $('kartenZiel').value;
  if (!s || !Object.hasOwn(KARTEN_TEXTE, ziel)) return;
  const tor = welt.daten.tor;
  const cmd = ziel === 'st_aldera'
    ? { type: 'shipDock', owner: SPIELER, schiff: s.id, station: ziel }
    : ziel === 'aldera:tor'
      ? { type: 'shipFlyTo', owner: SPIELER, schiff: s.id, x: tor.x, y: tor.y }
      : { type: 'shipApproach', owner: SPIELER, schiff: s.id, zielArt: 'feld', ziel };
  befehl(cmd, 'Original-Flugauftrag bestätigt: ' + KARTEN_TEXTE[ziel] + '. Nur echte bezahlte Flugminuten.');
});
$('rundenAktion').addEventListener('click', () => {
  // Nur eine explizite Benutzeraktion, genau ein vorhandener Original-Handler.
  const ziel = rundenZiel;
  const original = ziel === 'station' ? document.querySelector('nav button[data-ansicht="station"]')
    : ziel ? $(ziel) : null;
  if (original && !original.disabled) original.click();
});
$('pilotKurs').addEventListener('input', pilotWerte);
$('pilotFahrt').addEventListener('input', pilotWerte);
for (const taste of document.querySelectorAll('[data-pilot-kurs]')) taste.addEventListener('click', () => {
  if (taste.disabled) return;
  $('pilotKurs').value = taste.dataset.pilotKurs;
  pilotWerte();
});
$('pilotAnwenden').addEventListener('click', () => {
  const s = gewaehlt(); if (!s) return;
  befehl({ type: 'shipSteer', owner: SPIELER, schiff: s.id,
    kurs: Number($('pilotKurs').value), fahrt: Number($('pilotFahrt').value) },
    'Manueller Flug: Kurs und Sollfahrt vom gemeinsamen Core übernommen.');
});
$('pilotBremsen').addEventListener('click', () => {
  const s = gewaehlt(); if (!s) return;
  $('pilotKurs').value = String(s.flug.kurs);
  $('pilotFahrt').value = '0'; pilotWerte();
  befehl({ type: 'shipSteer', owner: SPIELER, schiff: s.id, kurs: s.flug.kurs, fahrt: 0 },
    'Bremsung angefordert: 0 % Sollfahrt. Der Flugkörper verzögert physikalisch.');
});
const schiffBefehl = (type, extra, text) => () => { const s = gewaehlt(); if (s) befehl({ type, owner: SPIELER, schiff: s.id, ...extra }, text); };
$('pendelEis').addEventListener('click', schiffBefehl('shipShuttle', { ware: 'eis' }, 'Pendelauftrag Eis: Feld, Förderung, Dockverkauf – alles vorfinanziert.'));
$('pendelErz').addEventListener('click', schiffBefehl('shipShuttle', { ware: 'erz' }, 'Pendelauftrag Erz angenommen.'));
$('pendelStop').addEventListener('click', schiffBefehl('shipShuttleStop', {}, 'Pendel endet nach Rückkehr und Verkauf am Dock.'));
$('abdocken').addEventListener('click', schiffBefehl('shipUndock', {}, 'Abgedockt; 40 ISK Flugreserve gebunden.'));
$('zumEis').addEventListener('click', schiffBefehl('shipApproach', { zielArt: 'feld', ziel: 'aldera:eis' }, 'Kurs Eisfeld.'));
$('zumErz').addEventListener('click', schiffBefehl('shipApproach', { zielArt: 'feld', ziel: 'aldera:erz' }, 'Kurs Erzfeld.'));
$('andocken').addEventListener('click', schiffBefehl('shipDock', { station: 'st_aldera' }, 'Andockanflug Aldera.'));
$('foerdernEis').addEventListener('click', schiffBefehl('shipMine', { ware: 'eis' }, 'Förderauftrag Eis gesetzt – gefördert wird nur im Feld.'));
$('foerdernErz').addEventListener('click', schiffBefehl('shipMine', { ware: 'erz' }, 'Förderauftrag Erz gesetzt – gefördert wird nur im Feld.'));
$('warten').addEventListener('click', schiffBefehl('shipWait', {}, 'Auftrag angehalten.'));
$('verkaufen').addEventListener('click', () => { const s = gewaehlt(); if (s) befehl({ type: 'shipSellIce', owner: SPIELER, schiff: s.id, menge: s.ladung.eis || 0 }, 'Eis am Dock an Aldera verkauft.'); });
$('kaufMiner').addEventListener('click', () => befehl({ type: 'shipBuy', owner: SPIELER, klasse: 'miner', station: 'st_aldera' }, 'Miner aus dem Lager der Station gekauft.'));
$('kaufFrachter').addEventListener('click', () => befehl({ type: 'shipBuy', owner: SPIELER, klasse: 'frachter', station: 'st_aldera' }, 'Frachter zum Originalpreis aus dem physischen Aldera-Lager gekauft.'));
$('frachtAnnehmen').addEventListener('click', () => {
  const s = gewaehlt();
  if (s?.klasse === 'frachter') befehl({ type: 'shipFreightIce', owner: SPIELER, schiff: s.id },
    'Original-W5n-Fracht finanziert: reale 50 Eis, vollständige Waren-/Fracht-Treuhand und bezahlter Pilotenlohn.');
});
$('torPruefen').addEventListener('click', () => {
  const s = gewaehlt();
  if (s?.klasse === 'frachter') befehl({type:'shipGateCheck',owner:SPIELER,schiff:s.id},
    'Sprungtor-Freigabe nur nach physischem 2D-Anflug und wirklich bezahlten Flugminuten erteilt.');
});
$('torFracht').addEventListener('click', () => {
  const s = gewaehlt();
  if (s?.klasse === 'frachter') befehl({type:'shipFreightGateIce',owner:SPIELER,schiff:s.id},
    'Original-W5n-Eisfracht mit verbrauchter echter Torfreigabe finanziert.');
});
$('dividende').addEventListener('click', () => { const n = welt.ausschuettbar(state, SPIELER); if (n > 0) befehl({ type: 'dividendPay', owner: SPIELER, betrag: n }, fmt(n) + ' ISK an das eigene Eigentümerkonto ausgeschüttet.'); });
$('wasserKauf').addEventListener('click', () => befehl({ type: 'householdBuy', owner: $('haushalt').value, menge: Number($('wasserMenge').value) }, 'Wasser privat gekauft und verbraucht.'));
$('automatik').addEventListener('click', () => { sicher(() => welt.politikSetzen(state, { automatik: !state.kanon.politik.automatik })); geaendert = true; zeigen(true); });
$('pause').addEventListener('click', () => { pausiert = !pausiert; $('pause').textContent = pausiert ? 'Weiter' : 'Pause'; $('pause').setAttribute('aria-pressed', String(pausiert)); if (pausiert) autosave(); });
$('tempo').addEventListener('click', () => { tempo = (tempo + 1) % TEMPI.length; $('tempo').textContent = 'Zeit ' + TEMPI[tempo] + '×'; });
$('minute').addEventListener('click', () => { sicher(() => welt.minute(state)); geaendert = true; zeigen(true); });
$('stunde').addEventListener('click', () => { sicher(() => welt.advance(state, 60)); geaendert = true; zeigen(true); });
for (const b of document.querySelectorAll('nav button')) b.addEventListener('click', () => {
  ansicht = b.dataset.ansicht;
  for (const x of document.querySelectorAll('nav button')) x.setAttribute('aria-pressed', String(x === b));
  for (const x of document.querySelectorAll('[data-seite]')) x.hidden = x.dataset.seite !== ansicht;
  zeigen(true);
});
$('speichern').addEventListener('click', async () => {
  const name = $('platzName').value.trim();
  try { await speicher.manuell(name, welt.save(state)); melde('Gespeichert auf „' + name + '“.'); }
  catch (e) {
    if (/ausdrücklich bestätigen/.test(e.message) && confirm('Platz „' + name + '“ überschreiben? Der alte Stand wird vorher unveränderlich gesichert.')) {
      try { await speicher.manuell(name, welt.save(state), true); melde('Überschrieben; alter Stand liegt in den Sicherungen.'); }
      catch (f) { melde('Speichern abgelehnt: ' + f.message, true); }
    } else melde('Speichern abgelehnt: ' + e.message, true);
  }
  zeigeSpeicher();
});
$('exportieren').addEventListener('click', async () => { await autosave(); const a = speicher.uebersicht().welten.find((w) => w.weltId === speicher.aktiv); herunterladen(speicher.exportieren(speicher.aktiv, a.auto.at(-1).platz), 'aphros-void-welt-' + state.tick + '.json'); });
$('neueWelt').addEventListener('click', () => neueWelt(true));
$('importieren').addEventListener('change', (ev) => dateiLesen(ev.target, async (text) => {
  try { const r = await speicher.importieren(text); melde(r.bereitsVorhanden ? 'Dieser Stand ist bereits vorhanden.' : 'Importiert als „' + r.platz + '“. Zum Spielen in der Liste laden.'); }
  catch (e) { melde((e.name === 'Inkompatibel' ? 'Nicht importiert: ' : 'Import abgelehnt: ') + e.message + (e.sicherung ? ' Die Datei wurde unverändert als Sicherung ' + e.sicherung + ' aufbewahrt.' : ''), true); }
  zeigeSpeicher();
}));
$('regel195').addEventListener('change', (ev) => dateiLesen(ev.target, async (text) => {
  if (!confirm('Regel195-Stand als NEUE Welt übernehmen? Das Original bleibt als unveränderliche Sicherung erhalten; der Stand im Hauptspiel wird nicht berührt.')) return;
  try {
    await autosave();
    const r = await speicher.regel195Uebernehmen(text);
    uebernehmen(speicher.laden(r.weltId, 'auto-1'), 'Übernommen: Tick ' + fmt(r.nachweis.tick) + ', ' + fmt(r.nachweis.weltgeld) + ' ISK, Geld/Waren/Schiffe/Verträge feldweise gleich. Original: Sicherung ' + r.sicherung + '.');
  } catch (e) { melde('Übernahme abgelehnt: ' + e.message, true); }
  zeigeSpeicher();
}));
document.addEventListener('visibilitychange', () => { if (document.hidden && geaendert) autosave(); });
window.addEventListener('pagehide', () => { if (geaendert) autosave(); });

// ---------------------------------------------------------------- Start
(async () => {
  if (istK7) {
    const migration = $('regel195');
    if (migration) { migration.disabled = true; migration.title = 'K7: Produktspielstand-Migration nicht erlaubt'; }
  }
  hülle = Speicher.erstellen(Welt);
  let ablage;
  try { if (!window.indexedDB) throw Error('IndexedDB fehlt'); ablage = Speicher.indexedDbAblage(window.indexedDB); await ablage.lesen(); }
  catch (e) { ablage = Speicher.speicherAblage(); dauerhaft = false; }
  try {
    speicher = await hülle.oeffnen(ablage);
    const ü = speicher.uebersicht(), aktiv = ü.welten.find((w) => w.weltId === ü.aktiv);
    if (speicher.gesperrt) throw Error(speicher.gesperrt);
    if (aktiv && aktiv.auto.length) uebernehmen(speicher.laden(aktiv.weltId, aktiv.auto.at(-1).platz), 'Letzter Autosave wiederhergestellt und pausiert.');
    else await neueWelt(false);
  } catch (e) {
    const w = Welt.erstellen({}); welt = w; state = w.createState(42);
    melde('Ablage nicht nutzbar (' + e.message + '). Diese Sitzung läuft ohne Speichern; vorhandene Daten bleiben unverändert.', true); zeigen(true);
  }
  // Prüfzugang für automatisierte Browsertests; keine Spielfunktion.
  window.__welt = { zustand: () => welt.canonical(state), hash: () => welt.hash(state), audit: () => welt.audit(state), bericht: () => welt.bericht(state),
    uebersicht: () => speicher.uebersicht(), schritte: (n) => { for (let i = 0; i < n; i++) welt.minute(state); geaendert = true; zeigen(true); }, sichern: () => autosave() };
  requestAnimationFrame(frame);
})();
})();
