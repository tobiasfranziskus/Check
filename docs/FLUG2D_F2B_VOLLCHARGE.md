# Flug2D F2b – volle Eischarge ohne Fernverkauf [DRAFT / ANALYSE]

**Stand: 11.11.2026.** Gestapelt auf [F2a #297](https://github.com/tobiasfranziskus/Check/pull/297), [F1 #296](https://github.com/tobiasfranziskus/Check/pull/296) und [I0 #294](https://github.com/tobiasfranziskus/Check/pull/294). Statisches HTML/CSS/Vanilla JS; keine Laufzeitbibliothek.

## Erreichte Funktion

Ein vorhandener NPC-Miner oder ein **für 600 ISK wirklich gekaufter Spieler-Miner** startet im Aldera-Dock. Der unveränderte F0-Kern führt zum Eisfeld und zurück. **Nur am physikalisch geprüften Eisfeld** fördert der unveränderte W5n-Originalcode jede Spielminute **1 Eis** für **2 ISK real gebuchten Förderlohn**. Nach 50 Einheiten setzt der F2b-Auftrag `shipWait`, fliegt die tatsächlichen 50 Eis zur Aldera-Station und löst **erst nach F0-Andocken** den bestehenden `shipSellIce`-Befehl aus. Dieser prüft reales Käuferbudget, Warenmenge und Lagerplatz und verbucht **50 × 5 = 250 ISK**. Ohne Käuferbudget erfolgt **kein Verkauf**; die Ladung verbleibt physisch beim Miner.

### Direkter V8-Forschungsgegenlauf (ausgeführt)

| Beleg | NPC-Miner | neu gekaufter Spieler-Miner |
| --- | ---: | ---: |
| Miningmenge | 50 Eis | 50 Eis |
| Mininglohn | 50 × 2 = **100 ISK** | 100 ISK |
| Stationsankauf | 50 × 5 = **250 ISK** | 250 ISK |
| zusätzlicher Schiffserwerb | bestehende finanzierte Hülle | **600 ISK** |
| Dauer Flug + Abbau + Rückflug | **4.226 Flugschritte / Tick70+26** | gleich |
| Abschluss-Eis im Stationslager | 50 | 50 |
| Verkauf vor echtem Andocken | **0** | **0** |
| Eigentümerkasse nach Abnahme | 2.550 ISK | 2.550 ISK |
| Weltgeld | **33.000 ISK**, Mint 0 | 33.000 ISK, Mint 0 |
| Referenzhash bei Seed3301 | `7be9ef8c7d66d847` | `187300eeaeb8029b` |

**Wirtschaftliche Abgrenzung:** 250 ISK Einnahmen − 100 ISK **belegte** Bergbauarbeit = 150 ISK Deckungsbeitrag **vor** Hüllenkauf, Pilot-/Flugarbeit, Verschleiß, Transport und weiteren Kosten. Diese zusätzlichen Leistungen sind **nicht** als bezahlt nachgewiesen. F2b ist daher kein vollständig finanziertes Dauerwirtschaftsmodell. Eine Pilotlohnregel erfordert eine separate Produktentscheidung und anschließende Kosten-/Treuhand-/Langzeitaudits.

## Eine originalwirtschaftliche Buchungskette

Bisher verkaufte der originale `m_core_w5n.foerdern` volle 50er-Chargen **sofort im Feld**. Das war für F2a nur durch eine echte 48er-Teilcharge zu vermeiden. F2b erweitert **genau diesen einen bedingten Core-Ausführungspunkt**:

```js
// Default-Regel195/196/197 bleibt bei demselben automatischen Verkauf.
if (sh.ladung.eis >= c.charge && r.w5n.f2bDockOnly !== true) {
  // originale unveränderte Kauf-/Budget- und Handelskette
}
```

- Das Flag stammt **ausschließlich aus der eingefrorenen Engine-Forschungskonfiguration Rule198**, nicht aus einem manipulierbaren Save-Feld. Rule195, Rule196 und Rule197 erhalten keine Änderung an ihrer Regelkonfiguration. Im F1-Adapter bleibt der eine Original-Wirtschaftskern aktiv.
- Die Original-Handler für `W5n.foerdern`, `W5n.verkauf`, `shipSellIce`, die Finanzierungs-/Waren-/Treuhandaudits und Tick-Reihenfolge bleiben dieselben. Beim Forschungsprofil wird einzig die **automatische** Stationsabnahme unterdrückt – die echte Abnahme verlangt weiterhin den originalen Kaufbefehl am Dock.
- F2a und F2b nutzen dieselbe kleine physikalische Pendelsteuerung, jedoch getrennte **Regel197/48** bzw. **Regel198/50** Forschungs-Saves. Keine stille Migration. Volle 50 Eis im Cargo werden vom Original-W5n-Ledger vorverkaufsfrei mitgezählt.
- Der Core ist ein **gemeinsamer** Quellcode, kein Fork und kein paralleler Wirtschaftskern. Das Flag ist standardmäßig aus; Regel195s echte automatische 50er-Abnahme bleibt ausdrücklich mit Regressionstest erhalten.
- Weil der Original-Core geändert wurde, wurden **ausschließlich auf diesem Forschungsbranch** die daraus reproduzierbar generierten `index.html` und `aphros-void.html` um exakt dieselben Quellzeilen aktualisiert. **Diese Dateien sind nicht auf main geändert, nicht ausgerollt und keine Produktfreigabe.** Der `W5_SINGLEFILE_OK`-Buildvergleich muss vor Annahme grün sein.

## Testoberfläche und Tests

- **Statische Forschungsseite:** `prototypes/flug2d/f2b-demo.html` über statischen Webserver; echter 600-ISK-Kauf, NPC-/Spieler-50er-Auftrag, Status/Bilanz, Zeitsteuerung, lesende UX08-Grafik, manuelle `Rule198`-JSON-Sicherung mit Importbestätigung. **Kein Browser-Autosave, keine Berührung produktiver Saves.**
- **Node22:** `node --test tests/flug2d-f2b-vollcharge.test.mjs` testet 50 tatsächlich bezahlte Feld-Minuten, null Fernverkauf, Originalkauf am Dock, Eigentümer-/Schiffkosten, Zwischenflug-Save, gefälschte Dockzustände, Profile 195/196/197 und **13 unterschiedliche feste Seeds**.
- **Chromium/WebKit:** `node tests/flug2d-f2b-browser.cjs` bzw. `FLUG_BROWSER=webkit node tests/flug2d-f2b-browser.cjs`: vier Touch-Viewports je Engine mit 50er-Transport, Browser-JSON, 200 neutralen Renderframes, realem Spieler-Minerkauf und unabhängigem Hash `187300eeaeb8029b`.
- **Regression:** Alle bestehenden Node-/Browser-/Wirtschafts-Tests sowie `node scripts/build-w5-singlefile.mjs --check` und CI. **CI des F2b-Codeheads `ca1fe0a` abgeschlossen, alle vier Workflows erfolgreich:** [Node22/Chromium #42969322621](https://github.com/tobiasfranziskus/Check/actions/runs/42969322621) **263/263** (0 Fehler/Skips), F2b-Chromium **4/4**; [WebKit/JavaScriptCore #42969322601](https://github.com/tobiasfranziskus/Check/actions/runs/42969322601) F2b-WebKit **4/4**, identischer Hash `187300eeaeb8029b`; [komplette JavaScript-/Wirtschaftsregression #42969322564](https://github.com/tobiasfranziskus/Check/actions/runs/42969322564) erfolgreich; [W5-RC1-/Touch-/NAS-Build #42969322575](https://github.com/tobiasfranziskus/Check/actions/runs/42969322575) erfolgreich. **`W5_SINGLEFILE_OK`**, 320.408 Zeichen, 7 Styles und 15 Skripte.

## Noch nicht realisiert

Erzverträge einschließlich separater Feldförderung, vorfinanzierter Auslieferung und Dockabrechnung; echte Piloten-/Flugarbeitslöhne (neue Regeln benötigen ausdrückliche Freigabe), wiederkehrende NPC-50er-Aufträge und volles Käuferbudget über lange Zeit; **13 × 90 Spieltage**; reale iPad-Safari-/NAS-Geräteabnahme. Die Forschung ist noch keine Freigabe für eine neue produktive Wirtschaft.

**Kein Merge nach main, kein Deployment oder GitHub-Pages-Update.**
