# [DRAFT] Legacy-Bergbauscanner · Übernahmebericht

Stand: 05.11.2026. Unabhängige Basis: aktueller main
[`b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c),
am Arbeitstag per GitHub-Branch-API verifiziert; lokaler Ausgangsstand identisch.
Branch: `feature/legacy-mining-scanner-20261105`. Kein Merge/Deployment.
Nur neue eigene Dateien unter `prototypes/legacy-mining-scanner/`, zwei eigene
Testdateien und dieser Bericht. Roadmap/Projektstatus bleiben gemäß ausdrücklicher
Auftragsgrenze unverändert; dieser Draft verändert keine Produktpriorität.

## Sichtung und Wiederverwendung

AGENTS.md, docs/ROADMAP.md, docs/PROJEKTSTATUS.md, bestehender iPad-Querformatbericht
und offene PRs #161–#194 geprüft. Insbesondere:

- [#162](https://github.com/tobiasfranziskus/Check/pull/162), [#164](https://github.com/tobiasfranziskus/Check/pull/164): bestehende 2D-Miner-/Kamera-/Touchdarstellung, Herkunftsbericht bei Commit `35688082` gelesen. Keine Kopie des Miner-Moduls, seiner Schiffsmodelle, Sprites, HUDs oder Core-Anbindung.
- [#186](https://github.com/tobiasfranziskus/Check/pull/186): separater Legacy-Fitting-Draft, weder übernommen noch geändert. Weitere Legacy-Drafts #187/#189 bleiben separat.
- W5-Stack einschließlich #185/#188/#190–#194: Forschungsregeln und Mechanik nicht main und vollständig außerhalb dieses Auftrags; keine Branch-Änderungen.
- `void.html` ist auf main kein vorhandenes Artefakt. Konkrete Quelle ist die aufgeteilte Void-Echoes-Fassung am bekannten, festgeschriebenen Commit unten. Kein historisches Monolith-Layout erfunden.

Quelle: [Void Echoes `a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f),
drei Originalmodule lesend geprüft. Übernommen werden **gezielte Darstellungsmuster**,
keine identische Vollrenderer-Extraktion:

| Quelle in `src/script/` | Ziel in `scanner.js` | Anpassung |
| --- | --- | --- |
| `075-kern-simulation.js`, `cam/sc` | `project`, `layout` | Mittelpunkt + (Position − Kamera) × Zoom; Auto-Fit aus Snapshot statt Schiffskamera/Extrapolation |
| `085-kern-zeichnen-hud.js`, `draw`, Zweig `ty==='r'` | `draw` | Asteroidenkreis; konstanter Radius statt Erzformel, kein Vorratsschwellen-Farbwert |
| `085-kern-zeichnen-hud.js`, `draw`, `o.id==sel` | `draw` | Vier weiße Auswahlwinkel; statisch ohne Uhrzeit/Puls |
| `370-ux06-auswahl.js`, `txHit/txChoose` | Pointer-Handler, `choose` | Nächster Treffer in CSS-Pixeln; Zielgröße 48px, nur lokale Auswahl |
| `085-kern-zeichnen-hud.js`, `renderTargets/ui` | Liste/Detail | Name, übergebene Entfernung und bekannte Vorräte; sichere DOM-Texte statt String-HTML |

Neu sind Snapshot-Projektion, einfache Feld-/Zonenkreise, Textübersichten,
responsive Hülle, Lifecycle und Tests. Die Kreise sind gemeldete Gebietsflächen,
keine Radar-/Scanreichweiten. Die alten Radar-Aufschaltzeiten, Zielplatzlimits,
Modulwirkungen, Bergbaustrahlen, Regeneration, Preise, Förderformeln, Gefahren-
und Kampfregeln wurden bewusst nicht übernommen. Keine neue Spielmechanik.
Die Quelle ist laut bestehendem Herkunftsbericht UNLICENSED; dieser Auftrag
innerhalb der Nutzer-Repositories begründet keine zusätzliche öffentliche Lizenz.

## Schnittstelle, Datenwahrheit und Sicherheit

Start: `prototypes/legacy-mining-scanner/index.html`, direkt oder statisch per HTTP.
Buildfreie Vanilla-JS-/CSS-Dateien; kein Framework, Backend oder CDN. Öffnen lädt
nur die permanent als **DEMONSTRATION** markierte erfundene Beispielwelt.

Öffentlich: `LegacyMiningScanner.mount(root, snapshot)` → `{update(next), destroy()}`.
Vollständiger Vertrag und Beispiel im [README](../prototypes/legacy-mining-scanner/README.md).
Auswahl/Fokus bleiben bei stabiler ID erhalten. `destroy` entfernt Listener,
ResizeObserver und eigenen Teilbaum; keine globalen Animationsschleifen.

Alle Ausgaben stammen aus einer abgetrennten Projektion der bekannten Snapshot-
Felder. Keine Core-Referenzen, Queue, Saves, Speicherung oder Netzwerkabfragen.
Fehlend, ungültig und null sind ausdrücklich unbekannt; 0 ist ein bekannter
Nullbestand; leere Meldelisten sind nur „keine bekannten Gefahren“, keine Garantie.
Keine Rückrechnung von Entfernung, Sicherheit, Vorrat oder Abbaustatus aus
Positionen. Kein automatischer Zusammenhang zwischen Zone und Asteroid.
Texte ausschließlich `textContent`, Textknoten oder Canvas-`fillText`; keine
HTML-Interpretation von Namen, IDs, Einheiten oder Gefahrentexten.

Determinismus: identischer Snapshot, Auswahl und Viewport ergeben identische
Zeichenoperationen; keine Uhrzeit und kein Zufall. UI-Kamera/Resize verändern
keine Daten. Pixelidentität wird innerhalb desselben Chromium-Prozesses geprüft,
nicht über unterschiedliche Browser-/Schriftversionen behauptet.

## Validierung

- Node **22.23.4**: `node --test tests/*.test.mjs`: **9/9 Dateisubtests**, keine Fehler/Skips. Zusätzlich `--experimental-test-isolation=none`: **73/73 Einzeltests**, davon 67 bestehende und 6 neue; keine Fehler/Skips.
- Neue Node-Prüfungen: eingefrorener Input/referenzfreie Projektion, unbekannt vs. 0/leer, ungültige Zahlen, deterministische Kamera, doppelte IDs, Textsenken und Abwesenheit von Simulation/Speicherzugriffen.
- Chromium mit Touch-Emulation, statische HTTP-Auslieferung: **1180×820, 1024×768, 820×1180, 390×844**. Karte und Liste antippen, Daten-/Fehlwertanzeige, mindestens 48px Listenbuttons, kein Seitenüberlauf, Tastaturauswahl, sichere Angriffstexte, 100 Updates mit identischen Canvas-Pixeln und unverändertem eingefrorenem Input, stabile Auswahl, Entfernen und mehrfaches Destroy geprüft. Screenshots lokal unter `/tmp/legacy-mining-scanner-<Breite>x<Höhe>.png`; Querformat visuell geprüft.
- Ergänzend Gestenabbruch/Drag/Mehrfingerkontakt, Fokus über Updates und Größenwechsel geprüft. Keine JavaScript-Browserfehler.
- Vorhandene Tests/Referenzwerte unverändert. CI ist durch den ausschließlich neuen Testpfad unter `tests/` auslösbar; lokales Ergebnis ist kein behauptetes GitHub-CI-Ergebnis.

## Integrationsvoraussetzungen und Grenzen

1. Zuerst diesen eigenständigen UI-Draft prüfen. Kein Einbau in `index.html`,
   bestehende Prototypen oder laufende W5-Branches in diesem Auftrag.
2. Später gesondert einen rein lesenden Adapter vom autoritativen Core freigeben:
   stabile IDs, wahre Koordinaten/Einheiten, gemeldete Entfernungen, bekannte
   Rohstoffe/Vorräte, Abbaustatus und Gefahrenherkunft. Fehlende Core-Felder
   bleiben unbekannt; schematische Demo-Koordinaten werden keine Produktdaten.
3. Einheiten, Koordinatenrahmen, Snapshot-Aktualisierung und Sichtbarkeitsrechte
   im Host festlegen. Scanner meldet keine neuen Entdeckungen oder Förderbefehle.
   Keine automatische Spielstandmigration, Regelversion oder Modulwirkung.
4. Echte iPad-Safari-Abnahme (Hoch-/Querformat, Split View, Touch, native
   Scrollgesten, Safe Areas) und statische Auslieferung auf dem Ziel-NAS stehen
   aus. Chromium-Emulation ersetzt weder Safari noch Geräteprüfung. Kein WebKit-
   oder NAS-Test ausgeführt.

Beschriftungen können bei dicht benachbarten Punkten überlappen; die vollständige
Liste bleibt bedienbar. Keine Pinch-/Pan-Kamera, Live-Scans, Scan-Module,
Gefahrenmechanik, Abbauaktion oder wirtschaftlicher Langzeitnachweis enthalten.
