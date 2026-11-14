# J4e – Original-F8-E-Duell auf dem rechtmäßig gekauften Jäger im gemeinsamen Regel204-Kern

**[DRAFT / Forschung · 14.11.2026]** Ausgangsbasis [J4d #345](https://github.com/tobiasfranziskus/Check/pull/345), dessen [K1-CI #43598015193](https://github.com/tobiasfranziskus/Check/actions/runs/43598015193) einschließlich J4d-Fokus, Node22-K1-Gesamtlauf sowie Chromium und WebKit erfolgreich war. Neues Forschungsgate J4e; **kein** Hauptspiel-/Produktfreigabebeschluss.

## Bisher getrennte Systeme

- **Wirtschaft/Flug** [J4b #343](https://github.com/tobiasfranziskus/Check/pull/343) → [J4c #344](https://github.com/tobiasfranziskus/Check/pull/344) → [J4d #345](https://github.com/tobiasfranziskus/Check/pull/345): die physisch vorhandene, aus realen W1–W5/J2–J4a-Gütern produzierte Jägerhülle wird nach 32 bezahlten Werftminuten für **900 ISK** an `house` verkauft. Die danach existierende echte `sh023`-ID besitzt den ursprünglichen F6-Körper, 40 ISK vorab vom Spieler bezahlten Flugdienst, **1 ISK/echter Wirtschaftsminute** und den Original-Anlagewert/Abschreibungs- und Eigentumsaudit.
- **F8-E #337:** einziges ursprüngliches F6-Projektil-/Ziel-/Gegenfeuerduell mit ausschließlich *virtuellen* Trainingsschaden, 135 Gegner-HP, 96 Pilotentrainings-HP, räumlichem Treffen, zwei vollständig getrennten Geschossjournalen und deterministisch umlaufendem Ziel. Bisher nur Demo-Schiff `f8_training_only` im eigenständigen `F8_FLUGUEBUNG_OHNE_WIRTSCHAFT`-Zustand.

## J4e-Verbindung

Die unverändert übernommenen, konkreten Quellmodule `prototypes/f8-jaeger/f8-treffer.js` und `prototypes/f8-jaeger/f8-duell.js` aus F8-E werden nun **nur als Kampfübungslogik** geladen. Die neue Schnittstelle `prototypes/j4c/duell.js` akzeptiert ausschließlich den vollständigen, auditierten Original-Regel204-Zustand, die tatsächlich gekaufte `house`-Jäger-ID aus `kanon.jaeger.kaeufe`, eine physische `lage='frei'` und das bestehende echte, gedeckte K1-Flugdienstkonto `k1_flug_<id>`. Die Original-F6-/K1-/Wirtschaftsmodule, Schiffs-, Waren- und Geldkonten werden nicht umgebaut.

Die Trainings-Sitzung verwendet **kein neues Schiffsobjekt, keinen zweiten Takt und keinen zusätzlichen Physikintegrator**. Jede Trainingssekunde entsteht ausschließlich aus `state.tick * 60 + state.flug.schritt`, nur wenn genau **ein** tatsächlicher F6-Originalsekundenschritt vergangen ist. Die einzelnen Projektile/feindlichen Geschosse lesen die Original-2D-Position, Winkel und Fluggeschwindigkeit aus `state.ships[schiff].flug`. Das F8-interne Sekundenzählfeld ist lediglich der aus der Weltzeit abgeleitete relative Zeitpunkt seit Trainingsstart, **keine eigenständige laufende Uhr**. Übersprungene Simulationssekunden brechen das Training ab. F8-E-Ziel- und Schussjournale werden mit den Original-F8-E-Auditfunktionen geprüft.

Das Browsercockpit `prototypes/j4c/index.html` führt den Spieler mit Touchbuttons durch: authentisches JSON laden, mit 40-ISK-Reserve echt abdocken, im freien Flug Duell beginnen, mit Original-`shipFlyTo` in den Sektor des beweglichen Ziels steuern, über den Original-`shipSteer` physisch ausrichten, ein F8-E-Geometriegeschoss abfeuern und die räumlichen Treffer/Gegenfeuer/Trainings-HP ansehen. Vorhandene J4d-Patrouille, Handflug und Docking bleiben benutzbar; gleichzeitig aktives Patrouillen-/Duelltraining wird nicht durch eine einzige UI-Aktion vermischt.

## Wirtschaftlicher und technischer Schutz

- Das reale `house`-Schiff wird **nicht** durch eine Übungsniederlage zerstört. Die Trainings-HP des Piloten sind keine Rumpf-HP, reale Waffenschäden, echte Piraten oder Reparaturkosten. Nach Niederlage darf der Spieler den **real bezahlten** Rückflug zur Station antreten. Eine solche Trainingseinheit erzeugt **0** neue ISK, Waren, Module, Erfahrung oder Beute.
- Trainingsprojektile sind *ausschließlich geometrische Übungsanzeigen*, **keine materiellen Munitionsbestände** und kein kostenloser wirtschaftlicher Warenzufluss. Beim späteren **echten** Kampf müssen Waffeneinsatz, Munition/Strom/Wartung, Schäden und Ersatz separat auf reale bezahlte Kosten und W5-Ressourcen zurückgeführt werden.
- Kein aktueller Pirat hat hier ein Eigentumskonto, Warenherkunft oder signiertes Kopfgeldbudget. Kein Kopfgeld-Mint aus altem Regel14-Code aktivieren. W6-Finanzierungsprobleme und notwendige separate Freigabe der Geldemissionsregeln bleiben unberührt.
- Wie bei J4d ist das Duell **nicht persistent**. Ein Welt-JSON speichert nur Regel204-Wirtschaft und echten Originalflug, **keine** F8-E-Treffer, temporären HP oder Trainingsbefehle. Bei Browserwechsel/Reload wird das Training neu gestartet; es können keine künftigen Quest-/Kopfgeldzahlungen aus den flüchtigen Trefferbelegen abgeleitet werden. Altspielstände Regel195/203 werden nicht still migriert.

## Ausgeführte direkte technische Vorprobe

Die Original-Quellmodule F6, F8-B, F8-E und die neue J4e-Schnittstelle wurden per V8 ausgeführt (isolierte F6-Weltansicht mit einem bereits dokumentiert gekauften, korrekt finanzierten Jägerbeleg als Mock, **nicht** als vollständiger K1-Wirtschaftsaudit): nach 40 realen F6-Abdockschritten und 225 physisch simulierten Flugsekunden zum Duell-Sektor führten eigene F8-E-Geschosse zu echten virtuellen Zieltreffern bei den nachfolgenden Trainingssekunden 249, 273 und 285. **3 Treffer, Ziel 0/135 Trainings-HP, Pilot 48/96 Trainings-HP und 2 geometrisch belegte Gegentreffer**; F8-B- und F8-E-Audit im Direktlauf erfolgreich. **Diese Mock-Vorprobe ist kein Nachweis einer vollständigen originalen bezahlten Spielwelt** und enthält bewusst keine W6-Wirtschaftsaussage.

## CI-/Abnahmevertrag

- **Node22 `tests/j4e-bezahltes-duell.test.mjs`**: Seeds42/7 vollständige reale Rohstoff-/Lohn-/Werft-/Jäger-Kette, originale volle J4c-Importprüfung, 900-ISK-Kauf und laufende bezahlte K1-Flugreserve, F6-Anflug zum F8-Sektor, drei eigenhändig abgefeuerte F8-E-Geometrieprojektile und Gegentreffer, Replay/Save/Load-Hash, Null-Mint/Burn, 33.000 Welt-ISK und Ablehnung manipulierter/fremder Trainerkämpfe. Eine weitere Probe simuliert die Trainingsniederlage und echte reguläre Rückkehr nach Nadir.
- **Chromium/WebKit vier Touchgrößen**: zusätzliches `tests/j4e-duell-browser.cjs`, authentisches aus der J4b-Finanzierung erzeugtes unverändertes Original-Regel204-JSON statt Gratis-Demoschiff, echter 40-ISK-Flugdienst, Duell/Schuss, Welt-Audit, Download des Originalspielstands ohne Trainingsjournal.
- K1-Workflow hat den J4e-Fokusjob, Browsercheck und dieselbe historische Gesamtsuite/13×90-/Langzeitprüfungen. W5-RC1- und JavaScript-Regressionsläufe bleiben gesonderte GitHub-Checks.
- **CI-Auswertung des neuen PR-Heads ist bis zum erfolgreichen Lauf offen**. Echte Safari-iPad-/NAS-Geräteabnahmen weiterhin nicht ersetzt. Keine eigenständige 13×90-Wirtschaft mit wiederholten realen Kampfeinsätzen: **reale Kämpfe existieren hier nicht**.

**Bewusster Folgeschritt:** eigene, real kostenpflichtige Kampfschäden/Waffen, eine eindeutig bezahlte Piratenhülle und vorab finanzierte signierte Auftrags-/Kopfgeldzahlung im gleichen Autoritätskern; erst nach separat gebilligtem Kosten-/Emissionsmodell, nach unabhängigem Risiko- und Krisenaudit. Kein automatisches Merge/Deployment.
