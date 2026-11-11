// Entwicklungswerkzeug (kein Spielbestandteil): rechnet das Gesamtwirtschafts-Referenzmodell C
// aus docs/GESAMTWIRTSCHAFT_REFERENZMODELL.md (PR #245) unabhängig nach und stellt es der
// tatsächlich implementierten Welt gegenüber. Statische Mengenlösung (I−A)x=f, keine Simulation.
// Aufruf: node tools/referenzmodell-c.mjs [--json]
import { pathToFileURL } from 'node:url';

const SATZ = Object.freeze({ lohn: 1, wartung: 0.5, abschreibung: 0.3, kapital: 0.05, frachtJeEinheit: 5.4,
  frachtlos: 50, frachtpreis: 270, servicepreis: 100, huelleLieferung: 270, modulLieferung: 5.4 });

// Rezepte je Outputeinheit: [Inputs, Arbeitsminuten, Preis, Kostenstelle]
const R = (ein, minuten, preis, stelle) => ({ ein, minuten, preis, stelle });
export const WAREN = Object.freeze({
  Erz: R({}, 4, 10, 'foerderung'), Eis: R({}, 2, 5, 'foerderung'),
  Kristall: R({}, 10, 24, 'foerderung'), Silizium: R({}, 10, 24, 'foerderung'),
  Material: R({ Erz: 2.5 }, 2.5, 48, 'verarbeitung'), Bauteil: R({ Material: 2, Silizium: 1 }, 8, 170, 'verarbeitung'),
  Wasser: R({ Eis: 1 }, 2, 16, 'verarbeitung'), Nahrung: R({ Eis: 2 }, 6, 34, 'verarbeitung'),
  Medizin: R({ Kristall: 1, Material: 2 }, 7, 170, 'verarbeitung'),
  Lager: R({ Bauteil: 2 }, 12, 430, 'verarbeitung'), Bergbau: R({ Bauteil: 2, Material: 1 }, 15, 500, 'verarbeitung'),
  Fabrik: R({ Bauteil: 2, Material: 3 }, 18, 630, 'verarbeitung'), Dock: R({ Bauteil: 4 }, 20, 850, 'verarbeitung'),
  Werft: R({ Bauteil: 4, Material: 2 }, 24, 980, 'verarbeitung'), Verteidigung: R({ Bauteil: 2, Material: 2 }, 14, 560, 'verarbeitung'),
  Miner: R({ Bauteil: 6, Material: 1 }, 30, 1340, 'huellenbau'), Frachter: R({ Bauteil: 8 }, 36, 1690, 'huellenbau'),
  Jaeger: R({ Bauteil: 4, Material: 2 }, 24, 980, 'huellenbau'), Bauschiff: R({ Bauteil: 12, Material: 2 }, 48, 2640, 'huellenbau'),
  BohrerMK1: R({ Material: 1 }, 15, 94, 'verarbeitung'), LaserMK1: R({ Bauteil: 1, Kristall: 1 }, 15, 270, 'verarbeitung'),
  KernMK2: R({ Bauteil: 2, Kristall: 1, Silizium: 1 }, 30, 540, 'verarbeitung'),
  KernMK3: R({ Bauteil: 4, Kristall: 2, Silizium: 2 }, 60, 1080, 'verarbeitung'),
});
const HUELLEN = ['Miner', 'Frachter', 'Jaeger', 'Bauschiff'];
const MODULE = ['Lager', 'Bergbau', 'Fabrik', 'Dock', 'Werft', 'Verteidigung'];
const ERSATZMIX = Object.freeze({
  foerderung: { Miner: 0.9, Bergbau: 0.1 }, fracht: { Frachter: 0.9, Dock: 0.1 }, schutz: { Jaeger: 0.9, Verteidigung: 0.1 },
  verarbeitung: { Fabrik: 0.9, Lager: 0.1 }, huellenbau: { Werft: 0.8, Dock: 0.2 },
  reparatur: { Bauschiff: 0.5, Fabrik: 0.5 }, einzelhandel: { Lager: 1 },
});
export const EXPORTMIX = Object.freeze({ Miner: 0.15, Frachter: 0.20, Jaeger: 0.10, Bauschiff: 0.05,
  ...Object.fromEntries(MODULE.map((m) => [m, 1 / 12])) });
export const KORB = Object.freeze({ Wasser: 10, Nahrung: 2, Medizin: 0.2 });

// Vollständige Kostentabelle (M, T, L, W, D, K) je Zeile.
export function kostentabelle() {
  const z = {};
  for (const [name, r] of Object.entries(WAREN)) {
    const stueck = Object.values(r.ein).reduce((n, x) => n + x, 0);
    z[name] = { M: Object.entries(r.ein).reduce((n, [w, x]) => n + x * WAREN[w].preis, 0), T: stueck * SATZ.frachtJeEinheit,
      L: r.minuten * SATZ.lohn, W: r.minuten * SATZ.wartung, D: r.minuten * SATZ.abschreibung, K: r.minuten * SATZ.kapital,
      preis: r.preis, stelle: r.stelle, ein: r.ein, frachtlose: stueck / SATZ.frachtlos };
  }
  z.Service = { M: WAREN.Material.preis, T: SATZ.frachtJeEinheit, L: 30, W: 0, D: 10, K: 2, preis: SATZ.servicepreis,
    stelle: 'reparatur', ein: { Material: 1 }, frachtlose: 1 / SATZ.frachtlos };
  z.Schutz = { M: 0, T: 0, L: 60, W: 30, D: 18, K: 3, preis: 120, stelle: 'schutz', ein: {}, frachtlose: 0 };
  z.Fracht = { M: 24, T: 0, L: 120, W: 60, D: 36, K: 6, preis: SATZ.frachtpreis, stelle: 'fracht', ein: { Schutz: 0.2 }, frachtlose: 0 };
  for (const ware of Object.keys(KORB))
    z['Retail' + ware] = { M: WAREN[ware].preis, T: 0, L: 0.5, W: 0.1, D: 0.2, K: 0.05, preis: WAREN[ware].preis + 2,
      stelle: 'einzelhandel', ein: { [ware]: 1 }, frachtlose: 0 };
  for (const k of Object.values(z)) {
    k.BK = k.M + k.T + k.L + k.W; k.vollkosten = k.BK + k.D + k.K;
    k.buchgewinn = k.preis - k.BK - k.D; k.G = k.preis - k.vollkosten;
  }
  return z;
}
const lieferung = (asset) => (HUELLEN.includes(asset) ? SATZ.huelleLieferung : SATZ.modulLieferung);

function loese(A, f) { // Gauß mit Spaltenpivot auf (I−A)x=f
  const n = f.length, M = A.map((zeile, i) => [...zeile.map((a, j) => (i === j ? 1 : 0) - a), f[i]]);
  for (let s = 0; s < n; s++) {
    let p = s;
    for (let i = s + 1; i < n; i++) if (Math.abs(M[i][s]) > Math.abs(M[p][s])) p = i;
    if (Math.abs(M[p][s]) < 1e-12) throw Error('Matrix singulär');
    [M[s], M[p]] = [M[p], M[s]];
    for (let i = 0; i < n; i++) {
      if (i === s) continue;
      const q = M[i][s] / M[s][s];
      for (let j = s; j <= n; j++) M[i][j] -= q * M[s][j];
    }
  }
  return M.map((zeile, i) => zeile[n] / zeile[i]);
}

// exportISK: Außenabnahme je Tag (Referenz 240). korb: Haushaltsmengen je Tag.
export function berechne({ exportISK = 240, korb = KORB } = {}) {
  const k = kostentabelle(), namen = Object.keys(k), ix = Object.fromEntries(namen.map((n, i) => [n, i]));
  const n = namen.length, A = Array.from({ length: n }, () => Array(n).fill(0)), f = Array(n).fill(0);
  for (const [j, z] of Object.entries(k)) {
    for (const [ware, menge] of Object.entries(z.ein)) A[ix[ware]][ix[j]] += menge;
    A[ix.Fracht][ix[j]] += z.frachtlose;
    A[ix.Service][ix[j]] += z.W / SATZ.servicepreis;
    for (const [asset, anteil] of Object.entries(ERSATZMIX[z.stelle])) {
      const stueck = z.D * anteil / (k[asset].preis + lieferung(asset));
      A[ix[asset]][ix[j]] += stueck;
      A[ix.Fracht][ix[j]] += stueck * lieferung(asset) / SATZ.frachtpreis;
    }
  }
  for (const [ware, menge] of Object.entries(korb)) f[ix['Retail' + ware]] += menge;
  const exportStueck = {};
  for (const [asset, anteil] of Object.entries(EXPORTMIX)) {
    const stueck = exportISK * anteil / (k[asset].preis + lieferung(asset));
    exportStueck[asset] = stueck;
    f[ix[asset]] += stueck;
    f[ix.Fracht] += stueck * lieferung(asset) / SATZ.frachtpreis;
  }
  const x = loese(A, f);
  let residuum = 0;
  for (let i = 0; i < n; i++) residuum = Math.max(residuum, Math.abs(x[i] - A[i].reduce((s, a, j) => s + a * x[j], 0) - f[i]));
  const summe = (g) => namen.reduce((s, name, i) => s + g(k[name]) * x[i], 0);
  const konsum = Object.entries(korb).reduce((s, [ware, menge]) => s + menge * k['Retail' + ware].preis, 0);
  return {
    mengen: Object.fromEntries(namen.map((name, i) => [name, x[i]])), exportStueck, residuum,
    konsum, export: exportISK, loehne: summe((z) => z.L), buchgewinn: summe((z) => z.buchgewinn),
    ersatz: summe((z) => z.D), kapitalanspruch: summe((z) => z.K), umsatz: summe((z) => z.preis),
    ausfuehrungscash: summe((z) => z.BK), minNegativ: Math.min(...x),
  };
}

// Sparfreiheit: erforderliche Emission bei Sparquote s und Senke B (Abschnitt 8.2 des Modells).
export const emissionFuerSparquote = (s, C = 286.4, B = 0) => B + s * C / (1 - s);
export const maxSparquote = (E, C = 286.4) => E / (E + C);
export const reichweiteTage = (etat, abflussJeTag) => etat / abflussJeTag;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = berechne();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r));
  else {
    const z = (v, n = 6) => v.toFixed(n).replace('.', ',');
    console.log('Referenzmodell C – stationärer Tag (nachgerechnet)');
    for (const [name, wert] of [['Privater Endverbrauch', r.konsum], ['Außenabnahme = Emission', r.export], ['Löhne', r.loehne],
      ['Buchgewinn', r.buchgewinn], ['Ersatz (Abschreibung)', r.ersatz], ['Kalk. Kapitalanspruch', r.kapitalanspruch],
      ['Gesamtumsatz', r.umsatz], ['Ausführungscash', r.ausfuehrungscash], ['Residuum', r.residuum]])
      console.log('  ' + name.padEnd(26) + z(wert, name === 'Residuum' ? 18 : 6));
    console.log('  Kontrolle Löhne + Gewinn − (Konsum + Export) = ' + z(r.loehne + r.buchgewinn - r.konsum - r.export, 12));
    console.log('Mengen je Tag: ' + Object.entries(r.mengen).filter(([, v]) => v > 1e-9).map(([n, v]) => n + ' ' + z(v)).join(' · '));
    console.log('Erforderliche Emission je Tag bei Sparquote: ' + [0, 0.08, 0.3, 0.6, 0.9].map((s) => (s * 100) + ' % → ' + z(emissionFuerSparquote(s), 2)).join(' · '));
    console.log('Größte stationär verträgliche Sparquote bei 400 ISK/Tag: ' + z(maxSparquote(400) * 100, 4) + ' %');
    console.log('Reichweite des endlichen Regel195-Exportetats (20.000 ISK) bei 240 ISK/Tag: ' + z(reichweiteTage(20000, 240), 2) + ' Tage');
  }
}
