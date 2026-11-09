# W5ac – gekauften W5-Frachter mit echtem Pilotenlohn von Nadir nach Aldera überführen und anschließend verwenden

> **[DRAFT / FORSCHUNGSREGEL 191 · 09.11.2026]** Auf [#273 W5ab](https://github.com/tobiasfranziskus/Check/pull/273) gestapelt. `main` bleibt v0.12.5 / Regel14 / Schema8. W5ab-Originalregel19, W4-Regel18 und alle bisherigen produktiven und Forschungs-Spielstände bleiben unmodifiziert. **Keine Produktregel-Freigabe, kein Merge/Pages/Deployment, keine Migration.** Maßgebliche Roadmap: `main/docs/ROADMAP.md`.

## 1. Was wirklich neu ist

[Historischer belegter W5s-b-Überführungsversuch #204](https://github.com/tobiasfranziskus/Check/pull/204) zeigte bereits in einem komplexen Regel32-Forschungsprofil, dass der gekaufte Nadir-Frachter `sh004` mit 60 ISK vollständig vorfinanzierter Pilot-Arbeit in genau 60 wirklichen Minuten nach Aldera fliegen kann. Der bisherige neu aufgebaute kleine Original-W5-Core [#273](https://github.com/tobiasfranziskus/Check/pull/273) besaß diesen Befehl aber noch **nicht**.

W5ac **übernimmt den nachgewiesenen Ansatz**, nicht den umfangreichen R32-Wirtschaftsstack: eigener **Rule191/Schema8-Forschungs-Derivatkern** aus dem Original-W5a `c6dea414`, im Repository `prototypes/w5ac/rule191-w5-ferry-core.js`. Der Original-W5-Wirtschaftspfad aus [#170](https://github.com/tobiasfranziskus/Check/pull/170) ist Ausgangspunkt; **diese Rule191-Datei ist ausdrücklich verändert**, anders als die zuvor wörtlich übernommenen Rule19-/18-Quellen. Gezielte Rule191-Ergänzungen betreffen neue Stations-/Besitzerkonten mit 0 Start-ISK, W5-Transferauftrag/-audit, einen neuen Core-Befehl `shipReposition`, Original-Core-Ticks, originale Frachterarbeit mit bereinigtem W3-Eigentümeraudit, Save-Regeltrennung und die bereits gebaute UI. **Eine einzige Daten-/Core-Uhr**, keine zweite Geld-/Flugsimulation.

Ein echter `transport`-Frachter mit `w5.schiffIds`-Kaufbeleg, System Nadir, Dockstatus, leerem Frachtraum und eigener Arbeit darf nach Beendigung einer etwaigen laufenden W3-Fracht eine Überführung starten. Original-Route `m_core_route.route(world,'nadir','aldera')` bestimmt 60 Minuten; der aus dem bisherigen W3-Pilotenlohn abgeleitete Satz 1 ISK je tatsächlicher Minute ergibt **60 ISK vor Flugbeginn vollständig gebunden**, nicht nur nachträglich fällig. Der Vertrag bleibt in `state.w5ac` mit genauem Tick, Schiffs-ID, Besitzer, Lohn-/Minutenbeleg. **`w5ac_transfer_reserved`** hält das Speditionsgeld, **`w5ac_transfer_pilot`** erhält pro Minute 1 tatsächlich bezahlte ISK. Bei Abschluss erfolgt echte Original-`m_core_ankunft`-Ankunft in Aldera, keine Änderung von `ship.heimat='nadir'`, kein zweiter Kauf, kein Teleport, kein Treibstoff, kein Mint.

Eine gekaufte Hülle kann den Transfer nur einmal beginnen. Aktive W3-Fracht und die neue Rule191-Einmalüberführung konkurrieren nicht um denselben Eigentümer-/Arbeitsauftrag. Fehlender Besitz-/Kaufbeleg, beauftragter Frachter, aktives Flugtreuhand, zu wenig freies Kapital, manipuliertes Ziel oder gefälschte Löhne blockieren ohne Nebenbuchung. Das alte W3-Audit prüft die Speditionskasse jetzt **inklusive genau dieser wirklich gebuchten Überführungsreserve und Löhne**; ein bloß ausgeglichener Weltbetrag beweist keine legitime Bezahlung. Der zusätzliche `m_core_w5_transfer.audit` rekonstruiert die gesamte Pilotenabrechnung unabhängig aus Zeit, Original-Route, echten Ship-IDs, Konto-/Treuhandständen und Ankunftsbelegen.

## 2. Reale W0–W5-Liefer-/Werft-/Überführungs- und Folgefracht

| Original-Core-Tick | Eigentum, Waren, Standort | Tatsächliche Speditionsmittel |
| ---: | --- | ---: |
| 160 | Nach 50-Erz-W3-Lieferung, 10-Erz/W4-Charge und 5-Material/W5-Werftbau für 500 ISK + 30 ISK Lohn hat `transport` den neugebauten Frachter `sh004` für 750 ISK in Nadir gekauft; alte W3-Rückfahrt läuft noch | 380 ISK |
| 170 | Alte W3-Rückfahrt wirklich beendet und 240 ISK Frachtrate aus Vertrag bezahlt | 620 ISK |
| 170 | Rechtmäßige Nadir→Aldera-Überführung `sh004` begonnen, **60 ISK** für 60 volle Pilotenminuten in Eigentümer-Treuhand reserviert | **560 ISK** frei, 60 ISK gebunden |
| 200 | In derselben Core-Welt 30 echte Minuten, 30 ISK an Piloten ausgezahlt | 560 ISK frei, 30 ISK gebunden |
| 230 | 60 Minuten und 60 ISK vollständig bezahlt, `sh004` **wirklich in Aldera** angekommen; eigenes Eigentum bleibt, `heimat=nadir` als Herkunft | **560 ISK**, 0 Treuhand |
| 230 | **Mit genau `sh004`** neue echte W3-Erzfracht von Aldera nach Nadir gestartet: 50 reale Erz an Bord, **120 ISK** neuer Fluglohn gebunden, **740 ISK** Nadir-Käufermittel gesondert gebunden | 440 ISK frei |
| 350 | `sh004` absolviert echten 60-min-Hinflug, 50 Erz übergeben, 60-min-Rückflug und 240 ISK Frachtrate erhalten, 120 ISK Lohn bezahlt | **680 ISK** frei, 100 Erz aus zwei realen Frachten in Nadir ausgeliefert |

**Weltgeld:** 33.000 existierende ISK; **0 Mint**. Nadir-Käuferbudget stammt aus früherem tatsächlich bezahlten 500-ISK-W5-Materialverkauf, keine externen Gratisgelder. Eine erfolgreiche Fracht und reale Überführung belegen **nicht**, dass Ersatzflotten, Module, Miner und Verbraucher über Monate/Jahre nachhaltig finanzierbar sind.

**Wirtschaftlicher Vergleich:** Der 750-ISK-Hüllenkauf plus 60-ISK-Überführung kostet der Spedition vor erster Nutzung der neuen Hülle mindestens **810 ISK**, noch **ohne** 120 ISK unabhängiges Arbeitskapital für eine 50-Erz-Hin-/Rückfracht. Die volle liquide Anforderung wäre zum Zeitpunkt des Kauf-/Überführungsplans **930 ISK** einschließlich Betriebsreserve. W5ac führt **keine automatische Investitionsentscheidung** ein; die Spedition darf für Forschung aus vorhandenem Kapital handeln, auch falls der Langfristertrag noch unklar ist.

## 3. Gemeinsame UI und Save-Schutz

Forschungseinstieg: **`prototypes/w5ac/index.html`**. Statische HTML/CSS/Vanilla-JS, Original-HQ, Station, eigenfinanzierter Miner mit 2D-Anzeige, NPC-Konzerne, W3-Erzfracht, W4-Raffinerie, W5-Werft und neuer `W5 – Bezahlte Überführung`-Reiter. Der neue Reiter zeigt vorhandene real gekaufte W5-Ship-IDs, Standort, Besitzer, Core-Finanzierungsquote, tatsächliche 60-ISK-Arbeitstreuhand, zeitlichen Fortschritt, Hash, W3-Gate und den **Original-`shipReposition`-Befehl**. Nach Ankunft wird ein weiterer ausdrücklicher Core-Befehl `shipFreight` für genau dieses `sh004` angeboten, nie ein UI-Ersatzflug.

**Rule191 ist absichtlich save-inkompatibel** zu original Rule19. Alle Import-/Export-Daten werden durch `loadW5` sowie den vollständigen Original-Regel191-Geld-, Waren-, Vollkosten-, Fracht-, Material-, Werft- und zusätzlichen Überführungs-Audit geprüft. Alter Produkt-Save/Rule19 wird zurückgewiesen; kein `localStorage`, IndexedDB, Slot-1-Zugriff oder stiller Reload. Kein neues Framework, Backend, Build oder CDN; nach Reload beginnt neue isolierte Forschungssitzung. Bestehende Regel14–19-Tests/Hubs bleiben unabhängig.

## 4. Qualität und Grenzen

- `tests/w5ac-frachterueberfuehrung.test.mjs`: Seed42/7, vollständig wirklicher W0–W5-Erwerb, bezahlter W3-Rückflug, eigenfinanzierte, 60-minütige Nadir→Aldera-Überführung; 30-min-Teilbeleg samt exakt gleichem Save/Load-Hash; 60-min-Ankunft und separat mit **demselben** Schiff `sh004` ausgeführte neue vollständig bezahlte W3-Hin-/Rückfracht. Abweisungen: fremde/ältere Schiffs-ID, Doppelstart, noch laufende W3-Fracht, gefälschte Eigentümer, fehlende/umgebuchte/verdoppelte Löhne und Treuhand, andere Route/Ankunft, gefälschte ankunftsbereite Hülle, falsche Regelversion.
- `tests/w5ac-regel191-90d.test.mjs`: **13 Seed-Welten × 90 Tage** nach realem Bau/Kauf/Überführung/neuer Fracht, tägliche Original-Core-Gesamtaudits, unabhängige Summe aller Besitzer-/Treuhand-ISK, identische Replays und End-Saves. **Nur RNG-Seed-Unterschiede, keine 13 wirtschaftlich verschiedenen Krisensituationen.**
- `tests/w5ac-touch.py`: vier Chromium-Touchgrößen (**1180×820, 1024×768, 820×1180, 390×844**) mit tatsächlich bedienter W3-/W4-/W5-Kette, gesperrtem Abflug während W3, 60 ISK Arbeit, 30-min Save/Load, gefälschten/alten Importen, Ankunft und neuer vom Werftfrachter tatsächlich bezahlter W3-Fracht. Vorhandenes `localStorage`-Sentinel und alle produktiven Save-Slots geschützt.
- `.github/workflows/w5ac-integration.yml`: alle Node22-JS-Regressionen und vier vollständige Chromium-Touchtests. **Ergebnisse erst nach wirklicher GitHub-CI als bestanden benennen.**

Reale Safari-/NAS-Abnahme, frei steuerbares 2D-Frachtercockpit, echte 13 wirtschaftlich unterschiedliche Krisen, Ersatz-/Verschleißwirtschaft, rentable Dauer-Nachfrage und Produktfreigabe sind offen. **Kein Merge/Deployment.**

## 5. Nächster Schritt [OPTION]

Erst nach bestandener Rule191-Abnahme könnte eine eigenfinanzierte Ersatz-Spedition/echte Wiederverwendung der gebauten Hüllen gegen W3-Nachfrage, echte Verschleiß- und Moduleinnahmen getestet werden. Die Käuferprüfung muss die gesamten 930 ISK aus **eigenem** Kapital und gültiger Ware/Produktion berücksichtigen; ein fremder Exportfonds bleibt rechtlich Eigentum eines anderen Konzerns. Die bereits vorhandene R32-Forschung zu Reservebedarf, W5s-b und Konzernnachfolge ist Referenz, aber keine neue Produktregel oder automatisch importierter Wirtschaftskern.
