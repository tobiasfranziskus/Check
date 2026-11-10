# I0 – gemeinsamer Flug2D-Forschungsstand

**[DRAFT / Forschung · 10.11.2026]** Basis ist der frisch geprüfte `main 04124f2bca27dc33b54be30c07b6a7bbb7387e81` einschließlich Spielstandschutz #289. Kein F1, kein Merge, kein Deployment. Statisch vom Repository-Verzeichnis ausliefern, etwa mit `python3 -m http.server 8000`, dann `/prototypes/flug2d/index.html` öffnen. Kein Build und keine Laufzeitabhängigkeit erforderlich.

## Übernommene Quellen

Alle Commits einzeln mit `cherry-pick -x` übernommen; Original-IDs stehen auch im Committext. Bestehende PR-Branches bleiben unverändert und offen.

| Quelle | Originalcommits in Übernahmereihenfolge |
| --- | --- |
| [#290 F0](https://github.com/tobiasfranziskus/Check/pull/290) | `ad80ba5`, `8deaab0`, `3d814a7`, `97b23e7`, `a12a3d0` |
| [#292 G1](https://github.com/tobiasfranziskus/Check/pull/292) | `e3500cf`, `322c0c7`, `24e7ade`, `0d5d1c3` |
| [#293 Richtung](https://github.com/tobiasfranziskus/Check/pull/293) | `817ea36`, `2792606`, `3931992`, `2ccb1b0`, `6d978fe` |

Nur die Dokumentation kollidierte mit dem neueren Main-Spielstandschutz; beide Informationsstände wurden erhalten. Historische F0-/G1-/Rechenprofilberichte beschreiben ihre jeweiligen Quellbranches. Dieser Bericht beschreibt die gemeinsame I0-Abnahme.

## Eingabekorrektur

`beruehrt=0` behandelte die ersten 700 ms wie einen bereits erfolgten Touch. Initialisierung und Rücksetzen verwenden jetzt `-Infinity`. Nur ein zeitnaher Kompatibilitätsklick nach Touch/Stift wird unterdrückt; Tastatur/Bedienungshilfen (`detail=0`) und echte Maus-Pointer bleiben unmittelbar bedienbar. Ein echter Maus-`pointerdown` hebt die Touch-Sperre auf, da WebKit den Kompatibilitätsklick selbst als Maus melden kann. Nichtprimäre Touch-Pointer werden weiterhin angenommen.

Der gemeinsame Chromium-/WebKit-Regressionshelfer hält `performance.now()` gezielt bei 100 ms: zwei frühe Mausklicks, Enter/Leertaste, echte Touch-Taps mit Kompatibilitätsklick, unmittelbarer Wechsel zu Tastatur/Maus, wiederholtes Touch und nichtprimärer Touch. Vorhandener echter Chromium-Dual-Touch mit gehaltenem Joystick bleibt erhalten. WebKit prüft zusätzlich Zwischenflug-JSON-Download/Import und Replay.

## Vergleich und Reproduktion

`node tests/tools/flug2d-benchmark.cjs --vergleich` führt dieselben 12.000 Schritte mit 4/20 angedockten und 4/20 dauerhaft anfliegenden Schiffen durch. Der Vergleich ersetzt ausschließlich `richtungZu` durch den ursprünglichen 256er-Scan. Vollständige Endzustände werden als SHA256 verglichen, Start/Ende fluggeprüft. Die 74.409 systematischen Vektoren, Achsen und Gleichstände werden separat getestet. Kurs 0 gewinnt weiterhin gegen 255; der Referenzhash bleibt **`e2674c1ef11678ba`**.

Lokale Node22-Messung (Linux, parallele Prüfprozesse, Stichprobe):

| Schiffe / Zustand | Vollscan | Optimiert |
| --- | ---: | ---: |
| 4 / anfliegend | 1,595 s | 0,179 s |
| 20 / anfliegend | 7,892 s | 0,777 s |
| 4 / angedockt | 0,077 s | 0,021 s |
| 20 / angedockt | 0,116 s | 0,124 s |

Alle vier kompletten Endzustände identisch. Keine hardwareabhängigen Zeitgrenzen in CI; diese Messung ist kein 13×90-Lauf und kein iPad-Benchmark.

## Abnahme

- Chromium lokal **4/4** einschließlich Frühstart, Dual-Touch, Hash, Replay und Zwischenflug-JSON bestanden. Negativkontrolle: ursprünglicher Handler scheitert am ersten Mausklick. Abschließende CI-Nachweise werden im [Draft-PR #294](https://github.com/tobiasfranziskus/Check/pull/294) mit konkretem Head und Links gepflegt.
- Erster I0-WebKit-Lauf [42894327707](https://github.com/tobiasfranziskus/Check/actions/runs/42894327707) deckte eine doppelte Touch-Auslösung auf: Der Kompatibilitätsklick war als Maus klassifiziert. Korrektur verwendet echten Maus-pointerdown statt click.pointerType; erneute Cross-Engine-Abnahme auf `fb01ea02` **bestanden**.
- Lokal 2.000 Renderframes: kanonischer Zustand und Cache unverändert, vier Sprites/Teilesätze, drei Sternschichten; ca. +124 KiB JS-Heap nach GC, 4,284 ms/Frame (diagnostisch). Fehlendes Grafikmodul: Basisansicht und Abdocken bestanden.
- Singlefile-Reproduktion: `W5_SINGLEFILE_OK`, 320.217 Zeichen, 7 CSS/15 JS; entspricht aktuellem Main mit Spielstandschutz.
- [Flug2D Node22/Chromium-CI auf `fb01ea02`](https://github.com/tobiasfranziskus/Check/actions/runs/42894608475): **235/235 vollständige Einzeltests**, zusätzlich 11/11 isolierte F0-Tests, 0 Fehler/Skips/Abbrüche; Chromium **4/4**, Frühstart **4/4**, Benchmark-Endzustände identisch, Speicher-/Fallback-/Singlefile-Check erfolgreich.
- [WebKit-CI auf `fb01ea02`](https://github.com/tobiasfranziskus/Check/actions/runs/42894608432): **4/4**, Frühstart **4/4**, alle vier JavaScriptCore-Kettenhashes `e2674c1ef11678ba`; Replay und Zwischenflug-JSON erfolgreich. Lokal Download tatsächlich versucht, HTTP 403 „Domain forbidden“; dies begrenzt nur den lokalen Lauf, nicht den erfolgreichen CI-Nachweis.
- Weitere Repository-CI und abschließender Dokumentationshead: [PR #294](https://github.com/tobiasfranziskus/Check/pull/294). Die hier verlinkte Abnahme bezeichnet den konkreten Codehead; der folgende Abschlusscommit ändert nur Dokumentation.
- Produktive `index.html`, `aphros-void.html`, `src/`, bestehende Prototypkerne, Save-Fixtures und Archive gegenüber Main unverändert. Sandbox verwendet JSON-Dateien und keinen produktiven Browser-Speicherslot. Keine Migration, Wirtschafts-/Preis-/Lohnregel oder zusätzliche Simulationsuhr.

## Offene F1-Schritte

1. Flugmodule erst in einem gesonderten Forschungsprofil in den gemeinsamen Core einbauen; Spieler/NPC dieselbe Befehlsvalidierung und stabile Schiffsreihenfolge.
2. 60 Teilminuten an die bestehende Core-Minute koppeln, Pause/Eingabeindex/Replay erhalten; keine zweite Uhr.
3. Pflicht-Flugaudit sowie Transit-/Dock-/Besitzkonsistenz im integrierten Zustand; Save-Vertrag und explizite Migrationsentscheidung unter Erhalt vorhandener Spielstände.
4. 13×90 unterschiedlich parametrisierte Welten und Krisen-/Langzeitläufe mit Geld-, Waren-, Eigentums- und Hashaudits; große Flotten und Zwischenflug-Save/Load integriert messen.
5. Renderer als lesenden Adapter an den integrierten Core hängen, Fallback und Cache-Grenzen bewahren.
6. Echte iPad-Safari-Abnahme (Hoch-/Querformat, Mehrfinger, Tastatur, Langzeit-Speicher) und statische NAS-Auslieferung.
7. Bergbau-/Handels-/Transport-Ortsbedingungen und wirtschaftliche Auswirkungen ausdrücklich erst als gesondertes F2-Thema entscheiden; I0/F1 erteilen dafür keine Freigabe.
