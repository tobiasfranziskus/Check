/* Aphros Void · RAUM-1 [DRAFT] – grafisches, touchbedienbares Raumcockpit.
 *
 * Dritte Ansicht DERSELBEN Regel204-Sitzung wie „Steuerpult“ und „Konzern & Flotte“
 * (prototypes/j4c/app.js). Diese Datei besitzt keinen Weltzustand: sie zeichnet die
 * lesende Szene (raum-szene.js) und reicht Eingaben als vorhandene Kernbefehle über die
 * Brücke der Sitzung weiter. Wandzeit und Bildrate bestimmen nur, WANN ganze Original-
 * Flugschritte ausgeführt werden – nie deren Ergebnis.
 */
(function (scope) {
'use strict';
function verbinden(B) {
  const S = scope.RaumSzene, G = scope.RaumGrafik, J6 = scope.J6FlottenWechsel, doc = scope.document;
  if (!S || !G || !doc || !B) throw Error('RAUM: Szene, Grafik oder Sitzungsbrücke fehlen');
  const $ = (id) => doc.getElementById(id);
  const canvas = $('raum-leinwand'), buehne = $('raum-buehne');
  let g = null;
  try { g = canvas.getContext('2d'); } catch (_) { g = null; }
  const grafik = g ? G.erstellen(doc) : null;
  const ruhig = !!(scope.matchMedia && scope.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const jetzt = () => (scope.performance && scope.performance.now ? scope.performance.now() : Date.now());
  const fmt = (n) => Number(n).toLocaleString('de-DE');
  const Z = { aktiv: null, auswahl: null, massstab: S.ZOOM.start, laeuft: false, faktor: 10, rest: 0, sichtbar: false,
    letzte: 0, hudZeit: 0, ringe: [], vorher: null, rahmenId: 0, zeiger: new Map(), tipp: null, kneifen: 0,
    knueppel: null, gesendet: '', auditOk: true, auditTick: -1, sig: {} };
  if (!g) { $('raum-ersatz').hidden = false; canvas.hidden = true; }

  const meldung = (text, fehler) => {
    const m = $('raum-meldung'); m.textContent = text; m.className = fehler ? 'fehler' : '';
    B.meldung(text, !!fehler);
  };
  function szene() {
    const welt = B.welt(), s = B.zustand();
    if (!welt || !s || !Z.aktiv) return null;
    return S.erzeugen(welt, s, Z.aktiv, { bojen: B.bojen, patrouille: B.patrouille(), duell: B.duellStand() });
  }
  function laufSetzen(an) {
    Z.laeuft = !!an && !!B.welt();
    if (!Z.laeuft) Z.rest = 0;
    Z.hudZeit = 0; // Anzeige im selben Bild nachziehen, nie einen veralteten Kassenstand stehen lassen
    $('raum-start').textContent = Z.laeuft ? 'Zeit anhalten' : 'Zeit starten';
    $('raum-start').setAttribute('aria-pressed', String(Z.laeuft));
  }
  function ring(x, y, farbe, dauer) { if (!ruhig) Z.ringe.push({ x, y, farbe, born: jetzt(), dauer: dauer || 900 }); }
  function pruefen() {
    const a = B.audit();
    Z.auditOk = !!(a && a.ok);
    if (!Z.auditOk) { laufSetzen(false); meldung('Audit fehlgeschlagen – Welt angehalten: ' + a.fehler.join('; '), true); }
    return Z.auditOk;
  }

  // ---- Befehle ---------------------------------------------------------------------------------
  const TEXT = { shipUndock: 'Abdocken eingeleitet – Flugreserve gebunden', shipDock: 'Andockanflug läuft',
    shipOrbit:'Autopilot: Orbit', shipFollow:'Autopilot: Folgen', shipLock:'Ziel erfasst – keine Waffen aktiviert', shipUnlock:'Zielerfassung gelöst', shipApproach: 'Autopilot: Anflug', shipFlyTo: 'Autopilot: Kurs gesetzt', shipSteer: 'Handsteuerung',
    siliconMineStart: 'Siliziumauftrag angenommen – Lohn und Ankauf sind vorfinanziert',
    siliconSell: 'Silizium an Station Nadir verkauft',
    shipFreightIce: 'Bezahlte Eis-Rundfracht angenommen – Zeit starten für Vertragsfahrt',
    shipGateCheck: 'Bezahlter Toranflug vom Original-Core bestätigt',
    shipFreightGateIce: 'Torfracht angenommen – Zeit starten für Vertragsfahrt' };
  function tun(aktion, ziel, leise, abstand) {
    const sz = szene();
    if (!sz) { meldung('Zuerst einen finanzierten Jägerstand laden', true); return null; }
    const cmd = S.befehl(B.welt(), sz, aktion, ziel, abstand);
    if (!cmd) { meldung('Für dieses Ziel gibt es keinen Kernbefehl', true); return null; }
    const r = B.ausfuehren(cmd);
    if (!r.ok) { meldung('Kern lehnt ab: ' + r.reason, true); hud(true); return r; }
    if (['shipOrbit', 'shipFollow', 'shipUndock', 'shipDock', 'shipApproach', 'shipFlyTo', 'shipSteer'].includes(cmd.type) && !Z.laeuft) laufSetzen(true);
    if (!leise) meldung((TEXT[cmd.type] || cmd.type) + ' · ' + sz.aktiv.name + (Z.laeuft ? ' · Zeit läuft ' + Z.faktor + '×' : ''));
    if (cmd.type === 'shipUndock' || cmd.type === 'siliconSell' || cmd.type === 'siliconMineStart') ring(sz.aktiv.x, sz.aktiv.y, '#6cf', 1100);
    pruefen(); hud(true);
    return r;
  }
  function waehlen(ziel) {
    Z.auswahl = ziel;
    hud(true);
  }
  function schiffWechseln(id) {
    const s = B.zustand();
    if (!s) return;
    const sitzung = {spielt:Z.laeuft,patrouille:B.patrouille(),duell:B.duellStand()};
    const ergebnis = J6 && J6.pruefenRolle
      ? J6.pruefenRolle(B.welt(),s,Z.aktiv,id,sitzung)
      : {ok:!S.wechselGrund(s,Z.aktiv,id),reason:S.wechselGrund(s,Z.aktiv,id)};
    if (!ergebnis.ok) { meldung('Schiffwechsel nicht möglich: ' + ergebnis.reason, true); return; }
    if(B.uebernehmen){const r=B.uebernehmen(id,Z.laeuft);if(!r.ok){meldung(r.reason,true);return;}}
    Z.aktiv = id; Z.auswahl = null; Z.vorher = null;
    meldung('Steuerung übernommen: ' + (S.KLASSENNAME[s.ships[id].klasse] || s.ships[id].klasse) + ' ' + id + ' · gleicher Weltstand, gleiche Kasse');
    hud(true);
  }

  function flotteGeprueft(sz) {
    const s=B.zustand(), auswahl=S.flotte(s,sz.aktiv.id);
    if(!J6 || !J6.pruefenRolle || sz.aktiv.lage!=='angedockt')return auswahl;
    const status={spielt:Z.laeuft,patrouille:B.patrouille(),duell:B.duellStand()};
    return auswahl.map(f=>{
      if(f.aktiv||f.system!==sz.system)return f;
      const ergebnis=J6.pruefenRolle(B.welt(),s,sz.aktiv.id,f.id,status);
      return {...f,grund:ergebnis.ok?null:ergebnis.reason};
    });
  }

  // ---- Zeitschritt und Bild --------------------------------------------------------------------
  function beobachten(sz) {
    const v = Z.vorher, a = sz.aktiv;
    if (v && v.id === a.id) {
      if (v.lage !== 'angedockt' && a.lage === 'angedockt') { ring(a.x, a.y, '#6cf', 1200); meldung('Angedockt an ' + sz.station + ' · Flugreserve wird zur nächsten Minute abgerechnet'); }
      if (sz.bergbau && v.anBord !== undefined && sz.bergbau.anBord > v.anBord) ring(a.x, a.y, '#7fe6a4', 900);
      if (sz.bergbau && sz.bergbau.auftrag && sz.bergbau.auftrag.fertig && !v.fertig) meldung('Charge vollständig gefördert – zurück zum Dock und verkaufen');
      if (a.gestrandet && !v.gestrandet) meldung('Flugarbeit nicht mehr finanziert – Antrieb aus, Schiff wartet auf Kapital', true);
    }
    // Im Dock und vollständig abgerechnet: Weltzeit nicht unbemerkt weiterlaufen lassen.
    if (Z.laeuft && a.lage === 'angedockt' && a.reserve === 0 && !B.zustand().kanon.flugdienst[a.id] && v && v.id === a.id && v.dienst) {
      laufSetzen(false); meldung('Im Dock abgerechnet – Zeit angehalten');
    }
    Z.vorher = { id: a.id, lage: a.lage, anBord: sz.bergbau ? sz.bergbau.anBord : undefined,
      fertig: !!(sz.bergbau && sz.bergbau.auftrag && sz.bergbau.auftrag.fertig), gestrandet: a.gestrandet,
      dienst: !!B.zustand().kanon.flugdienst[a.id] };
    const o = typeof Z.auswahl === 'string' ? S.objekt(sz, Z.auswahl) : null;
    if (typeof Z.auswahl === 'string' && !o) Z.auswahl = null;
    // Patrouille: nach erreichter Boje die nächste offene Marke vorschlagen.
    if (o && o.art === 'boje' && o.erreicht) { const n = sz.objekte.find((x) => x.art === 'boje' && x.offen); Z.auswahl = n ? n.id : sz.station; }
  }
  function rahmen(zeit) {
    Z.rahmenId = 0;
    if (!Z.sichtbar) return;
    const dt = Z.letzte ? zeit - Z.letzte : 0; Z.letzte = zeit;
    if (Z.laeuft && B.welt()) {
      const t = S.zeitgeber(Z.rest, dt, Z.faktor, 900);
      Z.rest = t.rest;
      if (t.schritte > 0) {
        try { const minuten = B.schritte(t.schritte); if (minuten > 0 && B.zustand().tick !== Z.auditTick) { Z.auditTick = B.zustand().tick; pruefen(); } }
        catch (e) { laufSetzen(false); meldung('Welt angehalten: ' + e.message, true); }
      }
    }
    let sz = null;
    try { sz = szene(); } catch (e) { laufSetzen(false); meldung('Szene nicht darstellbar: ' + e.message, true); }
    if (sz) beobachten(sz);
    if (g) zeichnen(sz);
    if (zeit - Z.hudZeit > 160) { Z.hudZeit = zeit; hud(false, sz); }
    planen();
  }
  function planen() {
    if (Z.sichtbar && !Z.rahmenId) Z.rahmenId = (scope.requestAnimationFrame || ((f) => scope.setTimeout(() => f(jetzt()), 33)))(rahmen);
  }
  function groesse() {
    const w = Math.max(240, canvas.clientWidth), h = Math.max(200, canvas.clientHeight), dpr = Math.min(2, scope.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [w, h];
  }
  const kam = (sz) => {
    const a = sz.aktiv, anteil = Z.laeuft && a.lage === 'frei' ? Z.rest : 0;
    return S.kamera(a.x + a.vx * anteil, a.y + a.vy * anteil, Z.massstab);
  };
  function randpfeil(w, h, x, y, farbe, text) {
    if (x >= 14 && x <= w - 14 && y >= 14 && y <= h - 14) return;
    const cx = w / 2, cy = h / 2, dx = x - cx, dy = y - cy, t = Math.min((cx - 26) / Math.abs(dx || 1e-9), (cy - 26) / Math.abs(dy || 1e-9));
    const px = cx + dx * t, py = cy + dy * t, a = Math.atan2(dy, dx);
    g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = farbe; g.beginPath(); g.moveTo(10, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath(); g.fill(); g.restore();
    const tx = Math.max(6, Math.min(w - 150, px - 60)), unten = py > h - 170 && (tx < 160 || tx > w - 330);
    grafik.text(g, text, tx, unten ? h - 170 : Math.max(14, Math.min(h - 8, py + (dy > 0 ? -14 : 22))), farbe);
  }
  function zeichnen(sz) {
    const [w, h] = groesse();
    if (!sz) {
      grafik.zeichneHimmel(g, w, h, 0, 0, Z.massstab);
      grafik.text(g, 'Kein Weltstand geladen – im Steuerpult den finanzierten Beispieljäger starten.', 16, 28, '#ffe39d', true);
      return;
    }
    const k = kam(sz), a = sz.aktiv, t = jetzt(), puls = ruhig ? 0.5 : 0.5 + 0.5 * Math.sin(t / 260);
    const P = (x, y) => S.zuBild(k, w, h, x, y);
    grafik.zeichneHimmel(g, w, h, k.x, k.y, k.massstab);
    let stationXY = null;
    for (const o of sz.objekte) {
      const [x, y] = P(o.x, o.y), r = o.radius / k.massstab, gew = Z.auswahl === o.id;
      if (o.art === 'feld') {
        if (x + r > -40 && x - r < w + 40 && y + r > -40 && y - r < h + 40) grafik.zeichneFeld(g, x, y, r, o.id, o.vorrat === 0, o.ware);
        grafik.text(g, o.name + (o.vorrat !== undefined ? ' · Vorrat ' + o.vorrat : ''), x + 10, y - Math.min(r, h / 3) - 6, G.FARBE.feld);
        if (gew) grafik.klammern(g, x, y, Math.max(20, Math.min(r, 46)));
      } else if (o.art === 'tor') { grafik.zeichneTor(g, x, y, r); grafik.text(g, o.name, x + r + 6, y, '#b9a8ff'); if (gew) grafik.klammern(g, x, y, Math.max(20, r + 6)); }
      else if (o.art === 'station') { stationXY = [x, y]; grafik.zeichneStation(g, x, y, r, gew); grafik.text(g, o.name.toUpperCase(), x + 34, y - 40, '#95fee1', true); }
      else if (o.art === 'boje') { grafik.zeichneBoje(g, x, y, o, puls); grafik.text(g, o.name + (o.erreicht ? ' ✓' : ''), x + 14, y - 10, o.offen ? '#ffe39d' : G.FARBE.boje); if (gew) grafik.klammern(g, x, y, 19); }
    }
    // Angedockte Schiffe: dekorative Liegeplätze rund um die Station (Position ist im Kern das Dock).
    if (stationXY) {
      const n = sz.gedockt.length;
      sz.gedockt.forEach((d, i) => {
        const w0 = -Math.PI / 2 + i * Math.PI * 2 / Math.max(6, n), rr = d.aktiv ? 58 : 46;
        const x = stationXY[0] + Math.cos(w0) * rr, y = stationXY[1] + Math.sin(w0) * rr;
        grafik.zeichneSchiff(g, x, y, d.klasse, w0, d.aktiv ? G.FARBE.aktiv : d.eigen ? G.FARBE.eigen : G.FARBE.fremd, 0, d.aktiv ? 0.6 : 0.4, ruhig);
        if (d.aktiv) { grafik.zeichneRing(g, x, y, 22, G.FARBE.aktiv, 0.6 + 0.3 * puls, 1.5); grafik.text(g, d.id + ' · im Dock', x + 26, y + 4, G.FARBE.aktiv, true); }
      });
    }
    const anteil = Z.laeuft ? Z.rest : 0;
    for (const o of sz.objekte) {
      if (o.art !== 'schiff' && o.art !== 'drohne') continue;
      const frei = o.lage === 'frei', ox = o.x + (frei ? o.vx * anteil : 0), oy = o.y + (frei ? o.vy * anteil : 0);
      const [x, y] = P(ox, oy), gew = Z.auswahl === o.id;
      if (o.art === 'drohne') {
        grafik.zeichneSchiff(g, x, y, 'drohne', t / 1400, G.FARBE.drohne, 0.4, 0.8, ruhig);
        grafik.zeichneRing(g, x, y, 26, G.FARBE.drohne, 0.7, 2);
        grafik.text(g, 'VIRTUELLE DROHNE · ' + o.hp + ' HP', x + 30, y - 14, '#f5b3da');
      } else {
        const tempo = Math.hypot(o.vx, o.vy), ton = o.aktiv ? G.FARBE.aktiv : o.eigen ? G.FARBE.eigen : G.FARBE.fremd;
        grafik.zeichneSchiff(g, x, y, o.klasse, o.kurs * Math.PI / 128, ton, tempo > 8 ? Math.min(1, tempo / 2000) : 0, o.aktiv ? 0.95 : 0.8, ruhig);
        if (!o.aktiv) grafik.text(g, o.name + (o.eigen ? '' : ' · ' + o.owner), x + 24, y - 14, ton);
        if (o.aktiv && frei && tempo > 0) grafik.zeichneLinie(g, x, y, x + o.vx / k.massstab * 12, y + o.vy / k.massstab * 12, 'rgba(255,227,157,.45)', false);
      }
      if (gew) grafik.klammern(g, x, y, 28);
    }
    for (const p of sz.effekte.projektile) { const [x, y] = P(p.x, p.y); grafik.zeichneGeschoss(g, x, y, '#67f6ff', 4); }
    for (const p of sz.effekte.gegnerGeschosse) { const [x, y] = P(p.x, p.y); grafik.zeichneGeschoss(g, x, y, '#ff8578', 5); }
    // Kurslinie zum Autopilotziel bzw. zur Auswahl.
    const [ax, ay] = P(k.x, k.y);
    if (a.lage === 'frei' && a.ziel) {
      const z = a.ziel.art === 'punkt' ? a.ziel : S.objekt(sz, a.ziel.id);
      if (z) { const [zx, zy] = P(z.x, z.y); grafik.zeichneLinie(g, ax, ay, zx, zy, 'rgba(102,204,255,.55)', true); if (a.ziel.art === 'punkt') grafik.zeichnePunkt(g, zx, zy); }
    }
    if (Z.auswahl && typeof Z.auswahl === 'object') { const [zx, zy] = P(Z.auswahl.x, Z.auswahl.y); grafik.zeichnePunkt(g, zx, zy); grafik.klammern(g, zx, zy, 16); }
    Z.ringe = Z.ringe.filter((r) => t - r.born < r.dauer);
    for (const r of Z.ringe) { const p = (t - r.born) / r.dauer, [x, y] = P(r.x, r.y); grafik.zeichneRing(g, x, y, 10 + p * 52, r.farbe, (1 - p) * 0.8, Math.max(1, (1 - p) * 3)); }
    // Randpfeile: Heimatstation, offene Patrouillenboje und Auswahl bleiben auffindbar.
    for (const o of sz.objekte) {
      if (!(o.art === 'station' || o.offen || Z.auswahl === o.id)) continue;
      const [x, y] = P(o.x, o.y);
      randpfeil(w, h, x, y, o.art === 'station' ? '#95fee1' : o.offen ? '#ffe39d' : '#fff', o.name + ' · ' + fmt(o.distanz) + ' P');
    }
    // Fahrtbogen und (nur im Training) virtuelle HP nach Void-Echoes-Vorbild.
    const bx = w / 2, by = h - 46;
    if (w >= 520) grafik.zeichneBogen(g, bx, by, 34, a.vmax ? a.fahrt / a.vmax : 0, '#71cde7');
    const d = B.duellStand();
    if (w >= 520 && d && d.status === 'aktiv') grafik.zeichneBogen(g, bx, by, 25, d.pilotHp / 96, '#f46bb7');
    if (w >= 520) { g.save(); g.fillStyle = '#cfe3ff'; g.textAlign = 'center'; g.font = '600 12px system-ui,sans-serif'; g.fillText(fmt(a.fahrt) + ' P/s', bx, by + 4); g.restore(); }
    if (w >= 520) radar(sz, w, h);
    grafik.text(g, 'EIN WELTZUSTAND · REGEL ' + sz.regel + ' · ' + sz.system.toUpperCase(), 10, h - 10, 'rgba(193,214,233,.8)');
  }
  function radar(sz, w, h) {
    const R = 54, cx = w - R - 12, cy = h / 2, a = sz.aktiv;
    let reich = 400000;
    for (const o of sz.objekte) reich = Math.max(reich, o.distanz * 1.15);
    g.save(); g.fillStyle = 'rgba(8,19,38,.72)'; g.strokeStyle = '#33485f'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    for (const o of sz.objekte) {
      if (o.art === 'schiff' && o.aktiv) continue;
      const x = cx + (o.x - a.x) / reich * R, y = cy + (o.y - a.y) / reich * R;
      g.fillStyle = o.art === 'station' ? '#95fee1' : o.art === 'feld' ? '#66aa77' : o.art === 'boje' ? (o.offen ? '#ffe39d' : '#9db4cc') : o.art === 'drohne' ? '#f46bb7' : o.eigen ? '#7dd9ed' : '#c9a6ff';
      if (o.art === 'feld') { g.globalAlpha = 0.35; g.beginPath(); g.arc(x, y, Math.max(3, o.radius / reich * R), 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      else g.fillRect(x - 2, y - 2, o.art === 'station' ? 5 : 4, o.art === 'station' ? 5 : 4);
    }
    g.fillStyle = '#ffe39d'; g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
    g.restore();
    grafik.text(g, 'Radar · ' + fmt(Math.round(reich / 1000)) + ' kP', cx - R, cy + R + 14, 'rgba(193,214,233,.8)');
  }

  // ---- HUD und Bedienflächen (DOM; Listen werden nur bei geändertem Inhalt neu aufgebaut) ---------
  const setzen = (id, text) => { const n = $(id); if (n.textContent !== text) n.textContent = text; };
  function knopf(text, klasse, handler, deaktiviert, datenId) {
    const b = doc.createElement('button'); b.type = 'button'; b.textContent = text; if (klasse) b.className = klasse;
    b.disabled = !!deaktiviert; if (datenId) b.dataset.raum = datenId; b.addEventListener('click', handler); return b;
  }
  const absatz = (text, klasse) => { const p = doc.createElement('p'); p.textContent = text; if (klasse) p.className = klasse; return p; };
  function neuBauen(schluessel, signatur, behaelter, bauen) {
    if (Z.sig[schluessel] === signatur) return;
    Z.sig[schluessel] = signatur; behaelter.replaceChildren(...bauen());
  }
  function hud(sofort, fertig) {
    let sz = fertig || null;
    if (!sz) { try { sz = szene(); } catch (_) { sz = null; } }
    const leer = !sz;
    $('raum-zielkarte').hidden = true; $('raum-dock').hidden = true;
    for (const id of ['raum-abdocken', 'raum-andocken', 'raum-stopp', 'raum-duell', 'raum-feuer']) $(id).hidden = true;
    if (leer) {
      setzen('raum-schiff', 'Kein Weltstand'); setzen('raum-lage', 'Im Steuerpult einen finanzierten Jäger laden'); setzen('raum-fahrt', ''); setzen('raum-ladung', '');
      setzen('raum-kasse', '–'); setzen('raum-reserve', '–'); setzen('raum-zeit', '–'); setzen('raum-audit', '–');
      neuBauen('ziele', 'leer', $('raum-ziele'), () => [absatz('Kein Weltstand geladen.', 'note')]);
      neuBauen('flotte', 'leer', $('raum-flotte'), () => [absatz('Kein Weltstand geladen.', 'note')]);
      return;
    }
    const a = sz.aktiv, frei = a.lage === 'frei', jaeger = a.id === sz.jaeger, d = B.duellStand(), p = B.patrouilleStand();
    const LAGE = { angedockt: 'Im Dock', frei: ['orbit','folgen'].includes(a.modus) ? 'Autopilot: ' + a.modus + ' · ' + fmt(a.ziel?.radius || a.ziel?.abstand) + ' P · Handflug/Stopp übernimmt' : a.modus === 'anflug' ? 'Autopilot' : a.modus === 'hand' ? 'Handflug' : 'Freier Flug – Halt',
      andocken: 'Dockt an …', abdocken: 'Legt ab …', transit: 'Transit' };
    setzen('raum-schiff', a.name);
    setzen('raum-lage', (LAGE[a.lage] || a.lage) + (a.gestrandet ? ' · NICHT FINANZIERT' : '') + (a.erfassung ? ' · Aufgeschaltet: ' + a.erfassung.id : ''));
    setzen('raum-fahrt', fmt(a.fahrt) + ' P/s · Kurs ' + a.kurs + '/256');
    let zusatz = 'Fracht: ' + a.ladung;
    if(a.klasse==='frachter'&&a.lage==='transit')zusatz+=' · Vertragsfahrt: Regel204 sperrt freie Steuerung; Lieferung und Rückkehr im Original-Core';
    if (sz.bergbau && sz.bergbau.auftrag) zusatz = 'Silizium ' + sz.bergbau.auftrag.gefoerdert + '/' + sz.bergbau.auftrag.menge + (sz.bergbau.imFeld ? ' · Förderlage erreicht' : frei ? ' · im Feld unter ' + sz.bergbau.regel.abbauTempo + ' P/s halten' : '');
    else if (jaeger && p.status !== 'nicht gestartet') zusatz = 'Patrouille ' + p.status + ' · ' + p.erreicht + '/' + B.bojen.length;
    if (jaeger && d && d.status !== 'nicht gestartet') zusatz = 'Training ' + d.status + ' · Treffer ' + d.treffer + '/3 · Gegentreffer ' + d.gegnerTreffer + '/4';
    setzen('raum-ladung', zusatz);
    setzen('raum-kasse', fmt(sz.kasse) + ' ISK'); setzen('raum-reserve', fmt(sz.fracht?sz.fracht.lohnReserve:a.reserve) + ' ISK' + (sz.fracht?' Vertragslohn':''));
    setzen('raum-zeit', 'Min ' + fmt(sz.tick) + ' + ' + sz.sekunde + ' s');
    setzen('raum-audit', Z.auditOk ? 'Audit OK · Welt ' + fmt(sz.weltgeld) + ' ISK' : 'AUDITFEHLER');
    $('raum-audit').className = Z.auditOk ? '' : 'fehler';
    // Aktionstasten
    $('raum-abdocken').hidden = a.lage !== 'angedockt';
    $('raum-andocken').hidden = !frei; $('raum-stopp').hidden = !frei;
    $('raum-duell').hidden = !(jaeger && frei && (!d || d.status !== 'aktiv') && !['bereit', 'flug'].includes(p.status));
    $('raum-feuer').hidden = !(jaeger && frei && d && d.status === 'aktiv');
    $('raum-knueppel').classList.toggle('aus', !frei);
    // Zielkarte
    const o = typeof Z.auswahl === 'string' ? S.objekt(sz, Z.auswahl) : null, punkt = Z.auswahl && typeof Z.auswahl === 'object' ? Z.auswahl : null;
    if ((o || punkt) && a.lage !== 'angedockt') {
      $('raum-zielkarte').hidden = false;
      setzen('raum-zielname', o ? o.name : 'Freier Raumpunkt');
      const dist = o ? o.distanz : Math.round(Math.hypot(punkt.x - a.x, punkt.y - a.y));
      setzen('raum-zielinfo', fmt(dist) + ' P' + (o && o.art === 'station' ? ' · Lager (nicht Spielereigentum): ' + o.lager : o && o.art === 'boje' ? ' · höchstens ' + o.maxTempo + ' P/s' : o && o.vorrat !== undefined ? ' · Vorrat ' + o.vorrat : o && o.art === 'schiff' ? ' · ' + o.owner + ' · ' + o.ladung : ''));
      const akt = S.aktionen(sz, Z.auswahl);
      if(a.klasse==='frachter'&&o?.art==='tor'&&B.angebot){const q=B.angebot(S.befehl(B.welt(),sz,'torpruefen'));akt.push({id:'torpruefen',text:'Bezahlten Toranflug bestätigen'+(q.ok?'':' · '+q.reason),aktiv:q.ok});}
      neuBauen('ziel', JSON.stringify([Z.auswahl, akt]), $('raum-zielaktionen'), () => {
        const teile = [];
        for (const x of akt) {
          let eingabe = null;
          if (x.id === 'orbit' || x.id === 'folgen') {
            const label = doc.createElement('label');
            label.textContent = x.id === 'orbit' ? 'Orbitradius (P) ' : 'Folgeabstand (P) ';
            eingabe = doc.createElement('input'); eingabe.type = 'number'; eingabe.inputMode = 'numeric';
            eingabe.min = String(B.welt().flugKern.DATEN.punktHalt); eingabe.max = String(sz.raumRadius); eingabe.step = '1';
            eingabe.value = String(Math.max(Number(eingabe.min), Math.min(sz.raumRadius, Math.round(dist))));
            eingabe.id = 'ziel-' + x.id + '-abstand'; label.htmlFor = eingabe.id;
            eingabe.style.minHeight = '48px'; eingabe.style.width = '100%';
            label.append(eingabe); teile.push(label);
          }
          teile.push(knopf(x.text, x.id === 'anfliegen' ? 'primary' : '', () => {
            if (eingabe && !eingabe.reportValidity()) return;
            tun(x.id, Z.auswahl, false, eingabe ? Number(eingabe.value) : undefined);
          }, !x.aktiv, 'ziel-' + x.id));
          if (!x.aktiv && x.grund) teile.push(absatz(x.grund, 'note'));
        }
        return teile;
      });
    }
    // Dockkarte (Stationsansicht)
    if (a.lage === 'angedockt') {
      $('raum-dock').hidden = false;
      const st = S.objekt(sz, sz.station), bb = sz.bergbau, fl = flotteGeprueft(sz), F = B.welt().daten.flug;
      const sig = JSON.stringify([a.id, st.lager, bb, fl, p.status, sz.kasse]);
      neuBauen('dock', sig, $('raum-dockinhalt'), () => {
        const teile = [absatz('Lager der Station (nicht Spielereigentum): ' + st.lager, 'note')];
        teile.push(knopf('Abdocken · bindet Flugreserve (' + F.reserveMinuten + ' min × ' + F.lohnJeMinute + ' ISK)', 'primary', () => tun('abdocken'), false, 'dock-abdocken'));
        if (a.klasse==='frachter' && B.angebot) {
          for(const [id,text] of [['eisfracht','F4 · bezahlte Eis-Rundfracht'],['torfracht','F6 · Eis-Rundfracht mit Torbeleg']]) {
            const q=B.angebot(S.befehl(B.welt(),sz,id));
            teile.push(knopf(text, '', ()=>tun(id), !q.ok, 'dock-'+id));
            teile.push(absatz(q.ok?'Original-Core: aktuell finanzierbar':q.reason,'note'));
          }
        }
        if (bb) {
          const r = bb.regel;
          teile.push(absatz('Bergbau laut Kernregel: Charge ' + r.charge + ' Silizium · ' + r.minutenJeEinheit + ' min je Einheit · Lohn ' + r.lohnJeMinute + ' ISK/min · Ankauf ' + r.preis + ' ISK je Einheit · Feldvorrat ' + bb.vorrat, 'note'));
          if (!bb.auftrag) teile.push(knopf('Siliziumauftrag annehmen (vorfinanziert)', '', () => tun('siliziumAuftrag'), bb.fremderAuftrag, 'dock-auftrag'));
          else if (bb.auftrag.fertig) teile.push(knopf('Geförderte Charge verkaufen', 'primary', () => tun('siliziumVerkauf'), false, 'dock-verkauf'));
          else teile.push(absatz('Auftrag läuft: ' + bb.auftrag.gefoerdert + '/' + bb.auftrag.menge + ' gefördert. Abdocken, das Siliziumfeld anfliegen und dort langsam halten.', 'note'));
        }
        if (a.id === sz.jaeger) teile.push(knopf('Patrouille beginnen (3 Bojen, kein Zusatzgeld)', '', () => {
          const r = B.patrouilleStarten(); meldung(r.ok ? 'Patrouille vorbereitet – abdocken und die markierte Boje anfliegen' : 'Patrouille abgelehnt: ' + r.reason, !r.ok);
          if (r.ok) Z.auswahl = 'boje:0'; hud(true);
        }, ['bereit', 'flug'].includes(p.status), 'dock-patrouille'));
        teile.push(absatz('Schiff wechseln (nur eigene Schiffe am selben Dock):', 'note'));
        for (const f of fl) if (!f.aktiv && f.system === sz.system) teile.push(knopf(f.name + ' · ' + (f.grund || 'Steuerung übernehmen'), '', () => schiffWechseln(f.id), !!f.grund, 'wechsel-' + f.id));
        const fern = fl.filter((f) => f.system !== sz.system);
        if (fern.length) teile.push(absatz(fern.length + ' weitere eigene Schiffe in anderen Systemen (' + [...new Set(fern.map((f) => f.system))].join(', ') + ') – ohne Reise kein Wechsel.', 'note'));
        teile.push(knopf('Konzern & Flotte öffnen', '', () => B.ansicht('konzern'), false, 'dock-konzern'));
        return teile;
      });
    }
    // Übersicht (Objektliste) – Knöpfe bleiben erhalten, nur Texte werden aktualisiert.
    const liste = S.ziele(sz), box = $('raum-ziele');
    neuBauen('ziele', liste.map((x) => x.id).join('|'), box, () => liste.map((x) => knopf('', '', () => waehlen(x.id), false, 'objekt-' + x.id)));
    liste.forEach((x, i) => {
      const b = box.children[i]; if (!b) return;
      const t = x.name + ' · ' + fmt(x.distanz) + ' P'; if (b.textContent !== t) b.textContent = t;
      b.setAttribute('aria-pressed', String(Z.auswahl === x.id));
    });
    const fl = flotteGeprueft(sz);
    neuBauen('flotte', JSON.stringify(fl), $('raum-flotte'), () => fl.map((f) => absatz(f.name + ' · ' + f.system + ' · ' + f.lage + ' · Fracht ' + f.ladung + (f.aktiv ? ' · WIRD GESTEUERT' : f.grund ? ' · ' + f.grund : ' · Wechsel im Dock möglich'), f.aktiv ? 'raum-aktivzeile' : '')));
    for (const f of S.FAKTOREN) $('raum-tempo-' + f).setAttribute('aria-pressed', String(Z.faktor === f));
  }

  // ---- Eingabe ---------------------------------------------------------------------------------
  const ort = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height]; };
  function zoom(faktor) { Z.massstab = Math.max(S.ZOOM.min, Math.min(S.ZOOM.max, Z.massstab * faktor)); }
  canvas.addEventListener('pointerdown', (e) => {
    Z.zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Z.zeiger.size === 1) Z.tipp = { id: e.pointerId, x: e.clientX, y: e.clientY, t: jetzt() };
    else { Z.tipp = null; const p = [...Z.zeiger.values()]; Z.kneifen = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!Z.zeiger.has(e.pointerId)) return;
    Z.zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Z.zeiger.size === 2 && Z.kneifen > 0) {
      const p = [...Z.zeiger.values()], abstand = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (abstand > 0) { zoom(Z.kneifen / abstand); Z.kneifen = abstand; }
    }
  });
  const zeigerEnde = (e) => {
    const t = Z.tipp; Z.zeiger.delete(e.pointerId); if (Z.zeiger.size < 2) Z.kneifen = 0;
    if (!t || t.id !== e.pointerId || e.type !== 'pointerup') { if (Z.zeiger.size === 0) Z.tipp = null; return; }
    Z.tipp = null;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12 || jetzt() - t.t > 700) return;
    let sz = null; try { sz = szene(); } catch (_) { sz = null; }
    if (!sz) return;
    const [px, py, w, h] = ort(e), k = kam(sz), id = S.treffer(sz, k, w, h, px, py, 26);
    if (id) waehlen(id);
    else if (sz.aktiv.lage === 'frei') waehlen(S.zuWelt(k, w, h, px, py, sz.raumRadius));
    else waehlen(null);
  };
  for (const typ of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(typ, zeigerEnde);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.2 : 1 / 1.2); }, { passive: false });

  // Steuerknüppel: jede geänderte Stellung ist ein gewöhnlicher shipSteer-Befehl des Kerns.
  const stab = $('raum-knueppel'), knauf = $('raum-knauf');
  function knueppelBewegen(e) {
    const r = stab.getBoundingClientRect(), R = r.width / 2, dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const len = Math.hypot(dx, dy) || 1, f = Math.min(1, len / R);
    knauf.style.transform = 'translate(' + (dx / len * f * (R - 22)) + 'px,' + (dy / len * f * (R - 22)) + 'px)';
    const wert = S.knueppel(B.welt(), dx, dy, R);
    if (!wert) return;
    const sig = wert.kurs + '/' + wert.fahrt;
    if (sig === Z.gesendet) return;
    const r2 = tun('steuern', wert, true);
    if (r2 && r2.ok) { Z.gesendet = sig; Z.auswahl = null; setzen('raum-meldung', 'Handflug · Kurs ' + wert.kurs + '/256 · Schub ' + wert.fahrt + ' %'); }
  }
  stab.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (!B.welt()) return;
    Z.knueppel = e.pointerId; Z.gesendet = ''; try { stab.setPointerCapture(e.pointerId); } catch (_) { /* ältere Browser */ }
    knueppelBewegen(e);
  });
  stab.addEventListener('pointermove', (e) => { if (Z.knueppel === e.pointerId) { e.preventDefault(); knueppelBewegen(e); } });
  const knueppelEnde = (e) => { if (Z.knueppel !== e.pointerId) return; Z.knueppel = null; knauf.style.transform = ''; };
  for (const typ of ['pointerup', 'pointercancel', 'lostpointercapture']) stab.addEventListener(typ, knueppelEnde);

  $('raum-start').addEventListener('click', () => {
    if (!B.welt()) return meldung('Zuerst einen finanzierten Jägerstand laden', true);
    laufSetzen(!Z.laeuft); meldung(Z.laeuft ? 'Weltzeit läuft ' + Z.faktor + '×' : 'Weltzeit angehalten'); hud(true);
  });
  for (const f of S.FAKTOREN) $('raum-tempo-' + f).addEventListener('click', () => { Z.faktor = f; Z.rest = 0; meldung('Zeitraffer ' + f + '× (nur Anzeigegeschwindigkeit, gleiche Kernschritte)'); hud(true); });
  $('raum-zoom-plus').addEventListener('click', () => zoom(1 / 1.6));
  $('raum-zoom-minus').addEventListener('click', () => zoom(1.6));
  $('raum-abdocken').addEventListener('click', () => tun('abdocken'));
  $('raum-andocken').addEventListener('click', () => { const r = tun('andocken'); if (r && r.ok) { const sz = szene(); Z.auswahl = sz ? sz.station : null; } });
  $('raum-stopp').addEventListener('click', () => { Z.gesendet = ''; tun('stopp'); });
  $('raum-duell').addEventListener('click', () => {
    const r = B.duellStarten();
    meldung(r.ok ? 'Virtuelles F8-E-Training gestartet – Drohne anfliegen, ausrichten, feuern (keine echte Beute, kein echter Schaden)' : 'Training verweigert: ' + r.reason, !r.ok);
    if (r.ok) Z.auswahl = 'drohne'; hud(true);
  });
  $('raum-feuer').addEventListener('click', () => { const r = B.feuern(); meldung(r.ok ? 'Trainingsprojektil gestartet · Schuss ' + r.schuss : 'Schuss gesperrt: ' + r.reason, !r.ok); });
  $('raum-ziel-zu').addEventListener('click', () => waehlen(null));
  $('raum-export').addEventListener('click', () => B.exportieren());
  $('raum-konzern').addEventListener('click', () => B.ansicht('konzern'));
  $('raum-pult').addEventListener('click', () => B.ansicht('cockpit'));
  $('raum-schreiber').addEventListener('click', () => {
    const daten = JSON.stringify(B.flugschreiber());
    try {
      const url = URL.createObjectURL(new Blob([daten], { type: 'application/json' })), l = doc.createElement('a');
      l.href = url; l.download = 'aphros-raum-flugschreiber-' + B.zustand().tick + '.json'; doc.body.append(l); l.click(); l.remove();
      scope.setTimeout(() => URL.revokeObjectURL(url), 30000); meldung('Flugschreiber exportiert (Befehlsfolge für deterministisches Replay; kein Spielstand)');
    } catch (e) { meldung('Flugschreiber nicht exportierbar: ' + e.message, true); }
  });
  // Tastatur-Fallback (Hardwaretastatur am iPad/Desktop).
  doc.addEventListener('keydown', (e) => {
    if (!Z.sichtbar || e.ctrlKey || e.metaKey || e.altKey) return;
    const ziel = e.target && e.target.tagName; if (ziel === 'INPUT' || ziel === 'TEXTAREA' || ziel === 'SELECT') return;
    // Auf fokussierten Tasten behalten Leertaste/Enter ihre gewohnte Bedeutung.
    if ((ziel === 'BUTTON' || ziel === 'SUMMARY') && (e.key === ' ' || e.key === 'Enter')) return;
    let sz = null; try { sz = szene(); } catch (_) { return; }
    if (!sz) return;
    const a = sz.aktiv, key = e.key.toLowerCase();
    const lenken = (dk, df) => tun('steuern', { kurs: (a.sollKurs + dk + 256) & 255, fahrt: Math.max(0, Math.min(100, a.sollFahrt + df)) }, true);
    if (key === 'arrowleft' || key === 'a') lenken(-8, 0); else if (key === 'arrowright' || key === 'd') lenken(8, 0);
    else if (key === 'arrowup' || key === 'w') lenken(0, 10); else if (key === 'arrowdown' || key === 's') lenken(0, -10);
    else if (key === ' ') tun('stopp'); else if (key === 'p') $('raum-start').click();
    else if (key === '+' || key === '=') zoom(1 / 1.6); else if (key === '-') zoom(1.6); else return;
    e.preventDefault();
  });
  scope.addEventListener('resize', () => { if (Z.sichtbar) planen(); });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && Z.laeuft) { laufSetzen(false); meldung('Fenster verdeckt – Weltzeit angehalten'); } Z.letzte = 0; });

  const api = {
    aktivieren() {
      Z.sichtbar = true; Z.letzte = 0; Z.sig = {};
      if (!Z.aktiv && B.welt()) Z.aktiv = B.jaeger();
      doc.body.classList.add('raum-aktiv'); hud(true); planen();
    },
    deaktivieren() { Z.sichtbar = false; laufSetzen(false); Z.knueppel = null; Z.zeiger.clear(); doc.body.classList.remove('raum-aktiv'); },
    sitzungGewechselt() { Z.aktiv = B.welt() ? B.jaeger() : null; Z.auswahl = null; Z.vorher = null; Z.sig = {}; Z.auditOk = true; laufSetzen(false); if (Z.sichtbar) hud(true); },
    anzeigen() { if (Z.sichtbar) { hud(true); planen(); } },
    laeuft: () => Z.laeuft,
    // Lesender Zugriff für Tests und Fehlersuche; verändert nichts.
    zustand: () => ({ aktiv: Z.aktiv, auswahl: Z.auswahl, laeuft: Z.laeuft, faktor: Z.faktor, massstab: Z.massstab, grafik: !!g }),
    flugschreiber: () => B.flugschreiber(),
    bildpunkt(id) { const sz = szene(); if (!sz) return null; const o = S.objekt(sz, id); if (!o) return null; const r = canvas.getBoundingClientRect(), p = S.zuBild(kam(sz), r.width, r.height, o.x, o.y); return { x: r.left + p[0], y: r.top + p[1] }; },
  };
  buehne.dataset.bereit = 'ja';
  return api;
}
const API = { verbinden, sitzung: null };
if (typeof module === 'object' && module.exports) module.exports = API;
else scope.RaumCockpit = API;
})(typeof globalThis === 'object' ? globalThis : this);
