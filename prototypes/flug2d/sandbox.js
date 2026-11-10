/* Aphros Void · Flug2D-Sandbox [ANALYSE]: Touch-Hülle um den Flugkern.
 * Wandzeit bestimmt hier nur, WIE VIELE Flugschritte ausgeführt werden. Eingaben werden als
 * validierte Befehle an einen Schrittindex gebunden; daraus folgt ein exakt wiederholbares Replay.
 */
'use strict';
(() => {
const F = FlugKern, R = FlugReferenz, core = W5acOriginal.core;
const ICH = 'sp1', OWNER = 'house', N = F.DATEN.schritteJeMinute, TAU = Math.PI * 2;
const $ = (id) => document.getElementById(id);
const canvas = $('raum'), g = canvas.getContext('2d'), stick = $('knueppel'), knopf = $('knopf');
let state = R.welt(), start = core.canonical(state), log = [];
let pause = false, tempo = 1, rest = 0, zuletzt = null, wunsch = null, zeiger = null, vorher = {};
const grafik = window.FlugGrafik?.erstellen(g);
const vektor = () => !!grafik && $('grafik').value === 'ux08';
const ich = () => state.ships[ICH];
const melden = (text) => { $('meldung').textContent = text; };

function befehl(felder) {
  const cmd = { owner: OWNER, schiff: ICH, ...felder }, r = F.ausfuehren(state, cmd);
  log.push([R.index(state), cmd]);
  melden(r.ok ? 'Flugbefehl ' + cmd.type + ' angenommen.' : 'Abgelehnt: ' + r.reason);
  return r;
}
function schritte(n) {
  for (let i = 0; i < n; i++) {
    const b = ich().flug;
    if (wunsch && b.lage === 'frei' && !(b.modus === 'hand' && b.sollKurs === wunsch.kurs && b.sollFahrt === wunsch.fahrt))
      befehl({ type: 'shipSteer', kurs: wunsch.kurs, fahrt: wunsch.fahrt });
    wunsch = null;
    vorher = Object.fromEntries(Object.values(state.ships).map((s) => [s.id, [s.flug.x, s.flug.y]]));
    if (F.schritt(state)) R.minute(state);
  }
}

// --- Eingabe: Steuerknüppel (Pointer Events), Knöpfe, Tastatur ---
function auslenkung(e) {
  const r = stick.getBoundingClientRect(), radius = r.width / 2;
  const dx = Math.round(e.clientX - r.left - radius), dy = Math.round(e.clientY - r.top - radius);
  const len = Math.hypot(dx, dy), k = len > radius ? radius / len : 1;
  knopf.style.transform = `translate(${Math.round(dx * k)}px,${Math.round(dy * k)}px)`;
  const fahrt = len < 14 ? 0 : Math.min(100, Math.round(Math.min(len, radius) / radius * 10) * 10);
  wunsch = { kurs: fahrt ? F.richtungZu(dx, dy) : ich().flug.kurs, fahrt };
}
function loslassen() {
  zeiger = null; knopf.style.transform = '';
  // Eine inzwischen gewählte Anflugautomatik bleibt beim Loslassen bestehen.
  if (!$('tempomat').checked && ich().flug.modus === 'hand') wunsch = { kurs: ich().flug.kurs, fahrt: 0 };
}
// Mehrfinger-Bedienung: Während ein Finger den Knüppel hält, erzeugt der Browser für einen zweiten
// Finger kein "click". Flugknöpfe lösen deshalb bei pointerup aus; "click" bleibt für Tastatur,
// Maus und Bedienungshilfen erhalten und wird nach einem Touch-Auslöser einmal unterdrückt.
function taste(id, aktion) {
  const el = $(id); let beruehrt = -Infinity;
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' || el.disabled || !el.contains(document.elementFromPoint(e.clientX, e.clientY))) return;
    beruehrt = performance.now(); aktion();
  });
  el.addEventListener('click', (e) => {
    // Tastatur/Bedienungshilfen (detail=0) und echte Maus-Pointer bleiben sofort bedienbar.
    // Nur den Kompatibilitätsklick nach Touch/Stift einmal unterdrücken.
    if (e.detail !== 0 && e.pointerType !== 'mouse' && performance.now() - beruehrt < 700) {
      beruehrt = -Infinity; return;
    }
    aktion();
  });
}
stick.addEventListener('pointerdown', (e) => { zeiger = e.pointerId; stick.setPointerCapture(e.pointerId); auslenkung(e); e.preventDefault(); });
stick.addEventListener('pointermove', (e) => { if (e.pointerId === zeiger) auslenkung(e); });
for (const typ of ['pointerup', 'pointercancel', 'lostpointercapture'])
  stick.addEventListener(typ, (e) => { if (e.pointerId === zeiger) loslassen(); });
stick.addEventListener('contextmenu', (e) => e.preventDefault());
taste('bremse', () => { wunsch = { kurs: ich().flug.kurs, fahrt: 0 }; });
taste('erz', () => befehl({ type: 'shipApproach', zielArt: 'feld', ziel: 'aldera:erz' }));
taste('eis', () => befehl({ type: 'shipApproach', zielArt: 'feld', ziel: 'aldera:eis' }));
taste('dock', () => befehl(ich().flug.lage === 'angedockt' ? { type: 'shipUndock' } : { type: 'shipDock', station: 'st_aldera' }));
taste('pause', () => { pause = !pause; $('pause').setAttribute('aria-pressed', String(pause)); $('pause').textContent = pause ? 'Weiter' : 'Pause'; });
taste('tempo', () => { tempo = tempo === 1 ? 3 : 1; $('tempo').textContent = 'Zeit ' + tempo + '×'; });
taste('minute', () => { schritte(N); melden('Eine Spielminute (60 Flugschritte) ausgeführt.'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { zuletzt = null; if (zeiger !== null) loslassen(); } });
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,select,button,summary')) return;
  const b = ich().flug, basis = wunsch || { kurs: b.sollKurs, fahrt: b.modus === 'hand' ? b.sollFahrt : 0 };
  const neu = e.key === 'ArrowLeft' ? { kurs: (basis.kurs - 8) & 255, fahrt: basis.fahrt }
    : e.key === 'ArrowRight' ? { kurs: (basis.kurs + 8) & 255, fahrt: basis.fahrt }
      : e.key === 'ArrowUp' ? { kurs: basis.kurs, fahrt: Math.min(100, basis.fahrt + 10) }
        : e.key === 'ArrowDown' ? { kurs: basis.kurs, fahrt: Math.max(0, basis.fahrt - 10) }
          : e.key === ' ' ? { kurs: b.kurs, fahrt: 0 } : null;
  if (neu) { wunsch = neu; e.preventDefault(); }
});

// --- Ansicht: reine Darstellung, liest den Zustand nur ---
const zoom = () => Number($('zoom').value) / 16000;
function kamera(anteil) {
  const b = ich().flug, v = vorher[ICH] || [b.x, b.y];
  return [v[0] + (b.x - v[0]) * anteil, v[1] + (b.y - v[1]) * anteil];
}
let antippen = null;
canvas.addEventListener('pointerdown', (e) => { antippen = [e.pointerId, e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  const a = antippen; antippen = null;
  if (!a || a[0] !== e.pointerId || Math.hypot(e.clientX - a[1], e.clientY - a[2]) > 12) return;
  const r = canvas.getBoundingClientRect(), [cx, cy] = kamera(1), Rr = F.DATEN.raumRadius;
  const grenze = (v) => Math.max(-Rr, Math.min(Rr, Math.round(v)));
  befehl({ type: 'shipFlyTo', x: grenze(cx + (e.clientX - r.left - r.width / 2) / zoom()), y: grenze(cy + (e.clientY - r.top - r.height / 2) / zoom()) });
});
function zeichnen(anteil) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#070b12'; g.fillRect(0, 0, w, h);
  const z = zoom(), [cx, cy] = kamera(anteil), px = (x) => w / 2 + (x - cx) * z, py = (y) => h / 2 + (y - cy) * z;
  if (vektor()) grafik.himmel(cx, cy, z, w, h);
  const sys = F.DATEN.systeme[ich().system];
  g.font = '13px system-ui,sans-serif'; g.lineWidth = 1.5;
  for (const f of sys.felder) {
    g.strokeStyle = f.ware === 'erz' ? '#c9a15a' : '#8fd0ff'; g.beginPath(); g.arc(px(f.x), py(f.y), f.radius * z, 0, TAU); g.stroke();
    g.fillStyle = g.strokeStyle; g.fillText((f.ware === 'erz' ? 'Erzfeld' : 'Eisfeld'), px(f.x) - 22, py(f.y) + 4);
  }
  const st = sys.station;
  g.strokeStyle = '#5f7f95'; g.setLineDash([6, 6]); g.beginPath(); g.arc(px(st.x), py(st.y), F.DATEN.andocken.radius * z, 0, TAU); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#dbe6f0'; g.fillRect(px(st.x) - 9, py(st.y) - 9, 18, 18); g.fillText(st.id, px(st.x) + 14, py(st.y) - 12);
  for (const s of Object.values(state.ships)) {
    const b = s.flug, v = vorher[s.id] || [b.x, b.y];
    const view = vektor() ? FlugGrafik.adapter(s, v, anteil) : null;
    const [x,y] = view ? FlugGrafik.projektion(view.x, view.y, cx, cy, z, w, h) : [px(v[0] + (b.x-v[0])*anteil),py(v[1] + (b.y-v[1])*anteil)];
    const a = b.kurs / 256 * TAU, gross = s.klasse === 'frachter' ? 13 : s.klasse === 'jaeger' ? 9 : 11;
    if (b.ziel && s.id === ICH) {
      const t = b.ziel.art === 'punkt' ? b.ziel : b.ziel.art === 'station' ? st : sys.felder.find((f) => f.id === b.ziel.id);
      g.strokeStyle = 'rgba(141,228,237,.5)'; g.beginPath(); g.moveTo(x, y); g.lineTo(px(t.x), py(t.y)); g.stroke();
    }
    if (view) grafik.schiff(view, x, y, s.id === ICH ? 0 : s.owner === OWNER ? 1 : 2);
    else { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = s.id === ICH ? '#8de4ed' : s.owner === OWNER ? '#7fb08a' : '#d98c5f';
    g.beginPath(); g.moveTo(gross, 0); g.lineTo(-gross * .7, -gross * .6); g.lineTo(-gross * .4, 0); g.lineTo(-gross * .7, gross * .6); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = '#dbe6f0'; g.fillText(s.id + ' · ' + s.klasse, x + 12, y + 16);
  }
  const b = ich().flug, fahrt = F.isqrt(b.vx * b.vx + b.vy * b.vy), k = F.DATEN.klassen[ich().klasse];
  $('hud').textContent = `Tick ${state.tick} · Schritt ${state.flug.schritt}/${N} · ${ICH}: ${b.lage}${b.modus === 'anflug' ? ' (Automatik)' : ''} · Fahrt ${fahrt}/${k.vmax} · Kurs ${b.kurs} · Position ${b.x}/${b.y}`
    + ` · Erzfeld: ${F.imFeld(ich(), 'erz') ? 'Förderlage' : 'nein'} · Eisfeld: ${F.imFeld(ich(), 'eis') ? 'Förderlage' : 'nein'}`;
  $('dock').textContent = b.lage === 'angedockt' ? 'Abdocken' : b.lage === 'andocken' ? 'Dockt an …' : b.lage === 'abdocken' ? 'Dockt ab …' : 'Andocken';
  $('dock').disabled = b.lage === 'andocken' || b.lage === 'abdocken';
  for (const id of ['bremse', 'erz', 'eis']) $(id).disabled = b.lage !== 'frei';
  $('minute').disabled = !pause;
}
function bild(jetzt) {
  if (zuletzt !== null && !pause) {
    rest += Math.min(250, jetzt - zuletzt) * 20 * tempo / 1000; // 1× = 20 Flugschritte je Sekunde
    const n = Math.floor(rest); rest -= n; schritte(n);
  }
  zuletzt = jetzt; zeichnen(pause ? 1 : rest); requestAnimationFrame(bild);
}

// --- Prüfwerkzeuge: Referenzlauf, Replay, Export/Import ohne Browser-Speicher ---
function zeigeZustand(text) {
  $('pruefung').textContent = text;
  $('zustand').textContent = 'Hash ' + core.hash(state) + ' · Flugaudit ' + F.audit(state).grund + '\n' + JSON.stringify(ich().flug);
}
taste('referenz', () => {
  const h = R.kette(core);
  zeigeZustand(h === R.HASH ? 'Referenzlauf identisch: ' + h + ' (3600 Flugschritte, gleicher Wert wie Node 22).' : 'ABWEICHUNG: ' + h + ' statt ' + R.HASH);
});
taste('replay', () => {
  const s = JSON.parse(start), ziel = R.index(state);
  R.vor(s, ziel - R.index(s), log);
  for (const [wann, cmd] of log) if (wann === ziel) F.ausfuehren(s, cmd);
  const gleich = core.canonical(s) === core.canonical(state);
  zeigeZustand((gleich ? 'Replay identisch' : 'REPLAY WEICHT AB') + ': ' + log.length + ' Befehle, ' + (ziel - R.index(JSON.parse(start))) + ' Flugschritte.');
});
taste('export', () => {
  const url = URL.createObjectURL(new Blob([core.canonical(state)], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = 'aphros-flug2d-sandbox.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function pruefeImport(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || Object.keys(s).sort().join() !== 'flug,sandbox,ships,tick' || !Number.isSafeInteger(s.tick) || s.tick < 0)
    throw Error('Kein Flug2D-Sandboxzustand');
  for (const sh of Object.values(s.ships))
    if (!sh.flug || sh.phase !== 'dock' || !F.DATEN.klassen[sh.klasse] || !F.DATEN.systeme[sh.system]) throw Error('Unbekanntes Schiff');
  if (s.ships[ICH]?.owner !== OWNER) throw Error('Eigenes Schiff fehlt');
  for (const [id, p] of Object.entries(s.sandbox))
    if (!s.ships[id] || !['feld', 'station'].includes(p.ziel) || !['erz', 'eis'].includes(p.ware) || !Number.isSafeInteger(p.minuten)) throw Error('Auftragsersatz ungültig');
  const a = F.audit(s); if (!a.ok) throw Error(a.grund);
  return s;
}
$('import').addEventListener('change', async () => {
  const file = $('import').files[0]; if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw Error('Datei größer als 1 MiB');
    state = pruefeImport(await file.text()); start = core.canonical(state); log = []; vorher = {}; wunsch = null;
    zeigeZustand('Import geprüft und übernommen.');
  } catch (e) { zeigeZustand('Nicht übernommen: ' + e.message); }
  finally { $('import').value = ''; }
});
// Statische Modelllegende: keine zusätzlichen Flugkörper oder Befehle.
if (grafik) {
 const c=$('modelle'), h=c.getContext('2d'), legende=FlugGrafik.erstellen(h);
 h.font='13px system-ui';h.textAlign='center';
 for (const [i,klasse] of ['miner','frachter','jaeger'].entries()) {
  legende.schiff({modell:FlugGrafik.modell(klasse),winkel:-Math.PI/2,bewegt:false},48+i*96,35,i);
  h.fillStyle='#dbe6f0';h.fillText(['Miner','Frachter','Jäger'][i],48+i*96,74);
 }
} else { $('grafik').value='basis'; $('grafik').disabled=true; }
window.FlugSandbox = Object.freeze({ zustand: () => core.canonical(state),
 rendern: (anteil=1) => zeichnen(anteil), grafikCache: () => grafik?.cache() });
requestAnimationFrame(bild);
})();
