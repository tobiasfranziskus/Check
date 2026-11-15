# W6-S02 – unabhängige Langzeit- und Performanceprüfung

**[ANALYSE / NICHT MAIN] · 15.11.2026 · [Draft-PR #389](https://github.com/tobiasfranziskus/Check/pull/389).** Folgeprüfung des erhaltenen [QA-PR #385](https://github.com/tobiasfranziskus/Check/pull/385). Vor Beginn frisch abgerufen: Forschungshead `a95d0df70ff02aad1be4cdd1dab637c3228f22ab`, `main 4d36a37d7c23b11151a4514df7841eef5eef9d01`. Seit geprüftem Code `d5c570f98cdee28ec36044176cfa12c946fab3bf` lagen ausschließlich Dokumentationsänderungen vor.

## Tatsächlich abgeschlossene Ergebnisse

| Tag | Hüllen gesamt / verbraucht | Ersatzkäufe | Frachter / Miner gebaut | ausgezahlte Löhne gesamt (ISK) | Hash |
| --- | --- | --- | --- | --- | --- |
| 180 | 190 / 187 | 187 | 99 / 87 | 745,176 | `3f403fb44c57bcd9` |
| 365 | 382 / 379 | 379 | 200 / 178 | 1,511,820 | `29933833f78d8676` |
| 730 | 760 / 757 | 757 | 401 / 356 | 3,022,241 | `3a189d3d049500e3` |

Alle drei Meilensteine wurden tatsächlich erreicht und unabhängig aus ihren gespeicherten Zuständen geprüft. Weltgeld **33.000 ISK**, Mint/Burn **0**, keine negativen Kassen. Physische Warenbestände gegen alle Ledger-Gleichungen, bezahlte Hüllenentnahmen gegen Klassenbestände, bekannte Eigentümer/IDs, unveränderte historische Eigentümer, separat berechnete Abschreibung/Rücklage und Netto-Gegenbuchungen geprüft. Spieler behält 3.000 ISK und keine Schiffe. Details einschließlich aller Kassen, Waren, Produktions- und Lohnarten: [maschinenlesbare Ergebnisse](qa/w6-s02/results.json).

Die bisherige Kennzahl `loehne` wird unverändert mitgeführt. Die Tabelle ergänzt die tatsächlich ausgezahlten Raffinerie-, Frachterwerft- und Minerwerftlöhne; Reservierung ist keine Auszahlung.

**Determinismus / Save:** Separater zweiter Lauf von Tag 0 bis 365: exakte kanonische Gleichheit, Hash `29933833f78d8676`. Die tatsächlich geschriebene Tag-365-Datei wurde in einem frischen Prozess bis Tag 730 fortgesetzt. Alle **13 gemeinsamen Checkpoints** ab Tag 390 stimmen mit dem durchgehenden Lauf überein; Endzustände vollständig kanonisch gleich, nicht nur gleicher Hash. Exakte Save/Load-Roundtrips an sämtlichen Hauptcheckpoints; zusätzliche unabhängige Meilensteinaudits an 180/365/730.

**Kein dauerhafter Stillstand beobachtet:** In jedem gemessenen Abschnitt steigen Eisförderung, Wasserumsatz, Lohnzahlungen und Ersatzkäufe. Der erste protokollierte Engpass bei Tick 64 („Kein Wasser am Wohnort st_aldera“) ist eine vorübergehende Pause, keine erste Ursache eines dauerhaften Zusammenbruchs. Wiederkehrende Wasser-/Finanzierungs-/Dockpausen sind im JSON erhalten. Keine künstliche Behebung und keine Behauptung unbegrenzter Nachhaltigkeit oder allgemeiner Krisenfestigkeit.

## Ressourcen und Ursache der Verlangsamung

Node v22.23.4; CPU-Quote 2 Kerne, RAM-Limit 8 GiB, parallele Prüfprozesse. Hauptlauf 0→730: **2544.869 s**; unabhängiger 0→365-Replay: **772.831 s**; Dateifortsetzung 365→730: **1558.441 s**. Diese Wandzeiten sind keine isolierten Benchmarks und wegen Parallelität nicht zu einer Gesamtwandzeit zu addieren.

Tag 730: Hauptprozess-Spitzen-RSS **136.6 MiB**, Fortsetzungsprozess-Spitzen-RSS **149.2 MiB**, Save **510,965 Bytes**. Speicherwerte aller Abschnitte stehen im JSON; keine OOM-/Speichergrenze erreicht.

CPU-Median pro simuliertem Tag auf unveränderten legalen Saves (je 1 Aufwärmlauf + 3 Wiederholungen, Laden/Audit ausgenommen): **1,105 s bei 190 Hüllen (Tag 180), 2,090 s bei 382 (365), 4,077 s bei 760 (730)**. Rund 3,69-fache CPU-Kosten bei vierfacher Hüllenzahl. Auch die getrennt gemessenen Simulationsabschnitte werden deutlich teurer; Auditzeiten bleiben vergleichsweise klein.

Das CPU-Profil am Tag-180-Save zeigt u. a. Sortieren in `flug-kern.js:105` und `schritt` ab Zeile 219. Dort werden bei jedem Flugteilschritt sämtliche historischen Hüllen in stabiler Reihenfolge durchlaufen; weitere vollständige Durchläufe liegen in `welt-kern.js`. Bei aktiven Flügen sind bis zu 60 Teilschritte je Wirtschaftsminute nötig. Profil, Messreihe und unveränderte Quellen stützen den Zusammenhang; die beiden Saves unterscheiden sich auch im sonstigen legalen Wirtschaftsfortschritt, es wurde kein manipulierter Gegenversuch durch Löschen von Hüllen verwendet. **Die Core-Kosten bleiben bestehen.**

Nur das vorhandene Forschungswerkzeug wurde erweitert: exakte Meilensteine, Abschnitts-/Speichermessung, persistierte QA-Checkpoints, read-only Audits, Fortsetzung aus Datei und wiederholbare CPU-Messung. Keine neue Testarchitektur. Der ältere bereits laufende Hauptworker enthielt noch eine automatische zusätzliche Fortsetzung; diese redundante Arbeit wurde **erst nach vollständig geprüftem Tag 730** beendet, da die separate Dateifortsetzung bereits vollständig abgeschlossen war. Der angefangene doppelte interne Replay zählt nicht als bestanden. `--no-continuation` vermeidet ihn künftig. Kein wirtschaftlicher oder ressourcenbedingter Abbruch der ausgewiesenen Läufe.

## Regressionen und Grenzen

- Vorgeschriebener Node22-Gesamtbefehl: **61/61 Testdateien**, 0 Fehler, 0 Skips, 0 Abbrüche; 656.983 s. Enthält unveränderte **13×90-Szenarien**, Geld/Waren/Eigentum/Save/Determinismus und J11/P1. Das lokale TAP zählt Dateien; keine erfundene Einzeltestzahl. [Gesamtlog](qa/w6-s02/node22.tap).
- Nach letzter Werkzeugerweiterung: **3/3 direkte Beobachter-/Rücklagen-/Teilintervalltests**, 0 Fehler/Skips. Die neue Negativprobe erkennt gefälschte Netto-Buchungen und prüft, dass Beobachtung den Zustand nicht verändert. [Detail-Log](qa/w6-s02/observer.tap). Zusätzlich gültige Datei-Fortsetzung, ungültige CLI-Zeiten/Szenarien und Fortschreiben ab zu spätem Save direkt geprüft; CPU-Klon-Replays vollständig ausgeführt.
- `node scripts/build-w5-singlefile.mjs --check`: **W5_SINGLEFILE_OK**. Produktdateien, Forschungs-Core, Saveschema, UI, Preise, Politikregeln und Referenzfixtures gegenüber `d5c570f` unverändert. Keine Nutzer-Saves geschrieben oder migriert; nur isolierte QA-Exporte in `/tmp`.
- Browser-/echte iPad-/NAS-Prüfung in diesem Auftrag nicht ausgeführt. Keine neue Produktfreigabe, kein Merge, kein Pages-/NAS-Deployment. NPC-Politik, Ersatzrücklage und Werftreserve bleiben [OPTION].

## Reproduktion mit Node22

```sh
node --test tests/*.test.mjs
node tools/w6-independent-longrun.cjs S02 730 /tmp/s02 30 --no-continuation
node tools/w6-independent-longrun.cjs S02 365 /tmp/s02-replay365
node tools/w6-independent-longrun.cjs S02 730 /tmp/s02-cont 30 /tmp/s02/day365.save.json
node tools/w6-independent-longrun.cjs benchmark /tmp/s02/day180.save.json /tmp/s02/day365.save.json /tmp/s02/day730.save.json
```

Die Dateifortsetzung kann für kürzere Gesamtwandzeit bereits nach Vorliegen des Tag-365-Exports parallel gestartet werden. Ein vollständiger Endvergleich muss zusätzlich die kanonischen Endzustände und gemeinsamen Checkpoint-Hashes wie in diesem Nachweis vergleichen; ein grüner einzelner Runner behauptet diesen externen Vergleich nicht selbst.
