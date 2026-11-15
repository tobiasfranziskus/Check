/* Aphros Void · RAUM-1 [DRAFT] – rein dekorative Canvas-2D-Grafik des Raumcockpits.
 *
 * Herkunft: Vektor-Schiffsmodelle (GX_MODELS/gxParts, UX08), Parallax-Sternenhimmel
 * (VE08G-02), Stationsachteck, Auswahlklammern und Ring-Effekte stammen aus dem
 * historischen Void-Echoes-Projekt und wurden hier als eigenständiges Modul ohne
 * dessen Simulation, Wirtschaft, Kampfregeln, Speicherformat oder globale Variablen neu gefasst.
 *
 * Diese Datei liest NIE den Weltzustand und schreibt nichts hinein. Alle Koordinaten hier sind
 * Darstellungseinheiten. Der dekorative Zufall (xorshift mit festem Startwert) ist vom
 * gespeicherten Core-RNG vollständig getrennt. Kein WebGL, keine Bilddateien, kein Netz.
 */
(function (scope) {
'use strict';
const MODELLE = Object.freeze({
  // Jäger
  interceptor: { koerper: [[30,0],[5,-7],[-13,-20],[-22,-18],[-12,-4],[-23,-3],[-23,3],[-12,4],[-22,18],[-13,20],[5,7]],
    rolle: 'kampf', triebwerke: [[-20,-10],[-20,10]], mass: 1 },
  // Miner
  prospector: { koerper: [[22,0],[10,-6],[-1,-6],[1,-18],[-20,-18],[-23,-12],[-9,-12],[-9,-7],[-20,-4],[-20,4],[-9,7],[-9,12],[-23,12],[-20,18],[1,18],[-1,6],[10,6]],
    rolle: 'bergbau', triebwerke: [[-18,-9],[-18,9]], mass: 1.02 },
  // Frachter
  hauler: { koerper: [[24,-4],[19,-10],[8,-10],[8,-16],[-20,-16],[-25,-10],[-23,-5],[-23,5],[-25,10],[-20,16],[8,16],[8,10],[19,10],[24,4]],
    rolle: 'fracht', triebwerke: [[-23,-9],[-23,9]], mass: 1.04 },
  // virtuelle Trainingsdrohne
  hunter: { koerper: [[27,0],[7,-8],[-7,-17],[-21,-15],[-12,-3],[-23,0],[-12,3],[-21,15],[-7,17],[7,8]],
    rolle: 'kampf', triebwerke: [[-19,-8],[-19,8]], mass: 0.96 },
});
const KLASSE_MODELL = Object.freeze({ jaeger: 'interceptor', miner: 'prospector', frachter: 'hauler', drohne: 'hunter' });
const FARBE = Object.freeze({ eigen: '#7dd9ed', aktiv: '#ffe39d', fremd: '#c9a6ff', drohne: '#f46bb7',
  station: '#66ccff', feld: '#66aa77', boje: '#9db4cc', text: '#c7d9ec', warn: '#ffb38a' });
const modell = (klasse) => MODELLE[KLASSE_MODELL[klasse]] || MODELLE.interceptor;
const modellRadius = (klasse) => { const m = modell(klasse); return Math.max(...m.koerper.map((p) => Math.hypot(p[0], p[1]))) * m.mass; };

// Dekorativer, vom Core getrennter Zufall.
function zufall(seed) { let x = (seed >>> 0) || 0x8e02cafe; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }
function textSeed(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function teile(klasse, ton) {
  const m = modell(klasse), ops = [{ t: 'poly', p: m.koerper, fill: 'metall', stroke: '#abc1ce', w: 0.65 },
    { t: 'poly', p: [[21,0],[5,-3],[-13,-3],[-16,0],[-13,3],[5,3]], fill: '#243c50', stroke: '#7898ac', w: 0.5 }];
  const rect = (x, y, w, h, fill, stroke) => ops.push({ t: 'rect', x, y, w, h, fill, stroke });
  for (const e of m.triebwerke) { rect(e[0] - 2, e[1] - 2, 5, 4, '#142333', '#7d9dad'); rect(e[0] - 2, e[1] - 1, 1.5, 2, ton); }
  rect(6, -1.6, 4, 3.2, ton); rect(-5, -1, 8, 2, '#829daf');
  if (m.rolle === 'fracht') {
    for (let x = -17; x < 6; x += 7) { rect(x, -12, 5.5, 8, '#7792a0', '#b0c2c6'); rect(x, 4, 5.5, 8, '#3c596b', '#8ba4ad'); rect(x + 1, -10, 3, 0.7, '#d1b979'); }
  } else if (m.rolle === 'bergbau') {
    for (const y of [-16, 13]) { rect(-16, y, 18, 3, '#b7a378', '#d5c7a5'); rect(-9, y, 1.5, 3, '#344b5c'); rect(-4, y, 1.5, 3, '#344b5c'); }
    rect(-4, -7, 9, 3, '#677e8f'); rect(-4, 4, 9, 3, '#425d71');
  } else {
    for (const y of [-7, 6]) { rect(0, y, 10, 1.4, '#c2ced1'); rect(-5, y - 1, 4, 3, '#334a60', '#91a8b5'); }
    rect(-14, -10, 7, 2, '#6c899c'); rect(-14, 8, 7, 2, '#3c5b72');
  }
  return ops;
}
function pfad(g, p) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); }
function zeichneModell(g, klasse, ton) {
  const verlauf = g.createLinearGradient(0, -24, 0, 24);
  verlauf.addColorStop(0, '#9bb2c1'); verlauf.addColorStop(0.42, '#58768c'); verlauf.addColorStop(1, '#22394c');
  for (const op of teile(klasse, ton)) {
    g.fillStyle = op.fill === 'metall' ? verlauf : op.fill;
    if (op.t === 'poly') { pfad(g, op.p); g.fill(); if (op.stroke) { g.strokeStyle = op.stroke; g.lineWidth = op.w; g.stroke(); } }
    else { g.fillRect(op.x, op.y, op.w, op.h); if (op.stroke) { g.lineWidth = 0.45; g.strokeStyle = op.stroke; g.strokeRect(op.x, op.y, op.w, op.h); } }
  }
}

function erstellen(doc) {
  const sprites = new Map();
  let himmel = null;
  const KACHEL = 1024;
  // Zwischengespeicherte Schiffssprites; ohne Offscreen-Canvas wird direkt gezeichnet (Fallback).
  function sprite(klasse, ton) {
    const key = klasse + ton;
    if (sprites.has(key)) return sprites.get(key);
    let c = null;
    try {
      c = doc.createElement('canvas'); c.width = c.height = 160;
      const h = c.getContext('2d'); h.translate(80, 80); h.scale(2.4, 2.4); zeichneModell(h, klasse, ton);
    } catch (_) { c = null; }
    sprites.set(key, c); return c;
  }
  function sterne(ebene) {
    const r = zufall(0x8e02cafe + ebene * 991), n = [300, 140, 56][ebene], liste = [];
    for (let i = 0; i < n; i++) {
      let x = r(), y = r();
      if (r() < 0.28) { const c = i % 2 === 0 ? 0.28 : 0.76; x = (c + (r() + r() + r() - 1.5) * 0.22 + 1) % 1; y = (0.2 + c * 0.6 + (r() + r() - 1) * 0.19 + 1) % 1; }
      liste.push([x * KACHEL, y * KACHEL, 0.35 + r() * [0.75, 1.15, 1.75][ebene], 0.2 + r() * 0.62, r()]);
    }
    return liste;
  }
  function himmelBauen(g) {
    himmel = [];
    for (let l = 0; l < 3; l++) {
      const c = doc.createElement('canvas'); c.width = c.height = KACHEL;
      const h = c.getContext('2d');
      if (l === 0) for (const a of [[0.23, 0.35, 0.3, 'rgba(37,65,91,.16)'], [0.72, 0.57, 0.26, 'rgba(63,49,87,.13)']])
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const x = (a[0] + dx) * KACHEL, y = (a[1] + dy) * KACHEL, r = a[2] * KACHEL, t = h.createRadialGradient(x, y, 0, x, y, r);
          t.addColorStop(0, a[3]); t.addColorStop(1, 'rgba(6,10,20,0)'); h.fillStyle = t; h.fillRect(x - r, y - r, r * 2, r * 2);
        }
      for (const [x, y, r, a, col] of sterne(l)) {
        const farbe = col < 0.14 ? '171,199,235' : col > 0.88 ? '235,213,178' : '206,216,229';
        if (r > 1.6) { const t = h.createRadialGradient(x, y, 0, x, y, r * 3); t.addColorStop(0, 'rgba(' + farbe + ',' + a * 0.22 + ')'); t.addColorStop(1, 'rgba(' + farbe + ',0)'); h.fillStyle = t; h.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
        h.fillStyle = 'rgba(' + farbe + ',' + a + ')'; h.beginPath(); h.arc(x, y, r, 0, Math.PI * 2); h.fill();
      }
      himmel.push(g.createPattern(c, 'repeat'));
    }
  }
  // Parallax-Hintergrund. Fällt bei fehlender Pattern-Unterstützung auf eine einfarbige Fläche zurück.
  function zeichneHimmel(g, w, h, kx, ky, massstab) {
    g.fillStyle = '#040915'; g.fillRect(0, 0, w, h);
    try {
      if (!himmel) himmelBauen(g);
      for (let l = 0; l < 3; l++) {
        if (!himmel[l]) continue;
        const q = [0.02, 0.05, 0.11][l], x = -(kx / massstab) * q % KACHEL, y = -(ky / massstab) * q % KACHEL;
        g.save(); g.translate(x, y); g.fillStyle = himmel[l]; g.fillRect(-x, -y, w, h); g.restore();
      }
    } catch (_) { himmel = [null, null, null]; }
  }
  function zeichneStation(g, x, y, r, gewaehlt) {
    const R = Math.max(18, r);
    g.save(); g.translate(x, y);
    g.strokeStyle = 'rgba(102,204,255,.28)'; g.setLineDash([5, 7]); g.lineWidth = 1; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    const k = Math.max(15, Math.min(34, R * 0.45));
    g.strokeStyle = FARBE.station; g.fillStyle = '#0f2233'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < 8; i++) g.lineTo(Math.cos(i * Math.PI / 4 + Math.PI / 8) * k, Math.sin(i * Math.PI / 4 + Math.PI / 8) * k);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#8fdcff'; g.lineWidth = 1.2; g.strokeRect(-k / 2, -k / 2, k, k);
    g.fillStyle = '#55f7d0'; g.fillRect(-2, -2, 4, 4);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * k, Math.sin(a) * k); g.lineTo(Math.cos(a) * (k + 9), Math.sin(a) * (k + 9)); g.stroke(); }
    g.restore();
    if (gewaehlt) klammern(g, x, y, k + 12);
  }
  function zeichneFeld(g, x, y, r, id, erschoepft, ware) {
    g.save(); g.translate(x, y);
    g.strokeStyle = erschoepft ? 'rgba(140,150,165,.5)' : 'rgba(110,190,150,.6)'; g.setLineDash([6, 8]); g.lineWidth = 1.3;
    g.beginPath(); g.arc(0, 0, Math.max(10, r), 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    const z = zufall(textSeed(id)), n = 16;
    for (let i = 0; i < n; i++) {
      const a = z() * Math.PI * 2, d = Math.sqrt(z()) * Math.max(8, r) * 0.82, s = Math.max(2, Math.min(11, (0.35 + z()) * Math.max(4, r) * 0.07)), ecken = 5 + Math.floor(z() * 3), dreh = z() * 6;
      const form = []; for (let e = 0; e < ecken; e++) form.push(0.65 + z() * 0.45);
      g.beginPath();
      for (let e = 0; e < ecken; e++) { const w = dreh + e * Math.PI * 2 / ecken; g.lineTo(Math.cos(a) * d + Math.cos(w) * s * form[e], Math.sin(a) * d + Math.sin(w) * s * form[e]); }
      g.closePath();
      g.fillStyle = erschoepft ? '#2a3442' : ware === 'eis' ? '#6f93a8' : ware === 'silizium' ? '#7d7791' : '#86654f';
      g.fill(); g.strokeStyle = 'rgba(210,220,230,.35)'; g.lineWidth = 0.7; g.stroke();
    }
    g.restore();
  }
  function zeichneBoje(g, x, y, o, puls) {
    g.save(); g.translate(x, y);
    g.strokeStyle = o.erreicht ? '#67e0b2' : o.offen ? '#ffe39d' : FARBE.boje; g.lineWidth = o.offen ? 2.6 : 1.5;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(8, 0); g.lineTo(0, 9); g.lineTo(-8, 0); g.closePath(); g.stroke();
    if (o.offen) { g.globalAlpha = 0.35 + 0.3 * puls; g.beginPath(); g.arc(0, 0, 15 + puls * 5, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  function zeichneTor(g, x, y, r) {
    g.save(); g.translate(x, y); g.strokeStyle = '#b9a8ff'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, Math.max(12, r), 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, Math.max(6, r * 0.55), 0, Math.PI * 2); g.stroke(); g.restore();
  }
  // Schiff mit Triebwerksfahne; Größe bleibt fingerfreundlich und unabhängig vom Zoom.
  function zeichneSchiff(g, x, y, klasse, kursRad, ton, faehrt, groesse, ruhig) {
    const m = modell(klasse);
    g.save(); g.translate(x, y); g.rotate(kursRad); g.scale(groesse * m.mass, groesse * m.mass);
    if (faehrt) for (const e of m.triebwerke) {
      g.fillStyle = klasse === 'drohne' ? '#e79b6c' : '#71cde7'; g.globalAlpha = 0.45;
      g.beginPath(); g.moveTo(e[0] - 2, e[1] - 2); g.lineTo(e[0] - (ruhig ? 8 : 8 + faehrt * 9), e[1]); g.lineTo(e[0] - 2, e[1] + 2); g.fill();
      g.globalAlpha = 0.85; g.fillStyle = '#d9f8ff'; g.fillRect(e[0] - 3, e[1] - 0.6, 3, 1.2); g.globalAlpha = 1;
    }
    const s = sprite(klasse, ton);
    if (s) g.drawImage(s, -80 / 2.4, -80 / 2.4, 160 / 2.4, 160 / 2.4); else zeichneModell(g, klasse, ton);
    g.restore();
  }
  function klammern(g, x, y, r) {
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 1.6;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(x + a * r, y + b * (r - 7)); g.lineTo(x + a * r, y + b * r); g.lineTo(x + a * (r - 7), y + b * r); g.stroke(); }
    g.restore();
  }
  function zeichnePunkt(g, x, y) {
    g.save(); g.strokeStyle = '#6cf'; g.lineWidth = 1.5; g.strokeRect(x - 5, y - 5, 10, 10);
    g.beginPath(); g.moveTo(x - 11, y); g.lineTo(x - 6, y); g.moveTo(x + 6, y); g.lineTo(x + 11, y); g.moveTo(x, y - 11); g.lineTo(x, y - 6); g.moveTo(x, y + 6); g.lineTo(x, y + 11); g.stroke(); g.restore();
  }
  function zeichneLinie(g, x1, y1, x2, y2, farbe, gestrichelt) {
    g.save(); g.strokeStyle = farbe; g.lineWidth = 1.2; if (gestrichelt) g.setLineDash([4, 7]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
  }
  function zeichneRing(g, x, y, r, farbe, alpha, breite) {
    g.save(); g.globalAlpha = alpha; g.strokeStyle = farbe; g.lineWidth = breite || 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function zeichneGeschoss(g, x, y, farbe, r) { g.save(); g.fillStyle = farbe; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); }
  function text(g, t, x, y, farbe, fett) {
    g.save(); g.font = (fett ? '600 ' : '') + '11px system-ui,-apple-system,sans-serif'; g.fillStyle = 'rgba(4,9,21,.7)';
    const w = g.measureText(t).width; g.fillRect(x - 3, y - 10, w + 6, 14); g.fillStyle = farbe || FARBE.text; g.fillText(t, x, y); g.restore();
  }
  // Statusbögen nach Void-Echoes-Vorbild; hier nur Fahrt (und Trainings-HP, ausdrücklich virtuell).
  function zeichneBogen(g, x, y, r, anteil, farbe) {
    g.save(); g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = 'rgba(26,42,58,.9)'; g.beginPath(); g.arc(x, y, r, 2.36, 7.07); g.stroke();
    g.strokeStyle = farbe; g.beginPath(); g.arc(x, y, r, 2.36, 2.36 + 4.71 * Math.max(0, Math.min(1, anteil))); g.stroke(); g.restore();
  }
  return { zeichneHimmel, zeichneStation, zeichneFeld, zeichneBoje, zeichneTor, zeichneSchiff, klammern, zeichnePunkt, zeichneLinie,
    zeichneRing, zeichneGeschoss, text, zeichneBogen };
}

const API = Object.freeze({ MODELLE, KLASSE_MODELL, FARBE, modell, modellRadius, teile, zufall, textSeed, zeichneModell, erstellen });
if (typeof module === 'object' && module.exports) module.exports = API;
else scope.RaumGrafik = API;
})(typeof globalThis === 'object' ? globalThis : this);
