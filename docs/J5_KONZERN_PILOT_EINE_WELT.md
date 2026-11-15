# J5 – Konzern und Pilot in demselben Regel204-Spielstand

**[DRAFT / Entwicklungsstand 15.11.2026]** Branch `feature/j5-eine-welt-konzernpilot-20261115`, Ausgangsbasis `main acaf2526578a961585a1835e81d2c5aee37ec9b7`. Nicht `main`, nicht veröffentlicht. Dieses J5-Teilstück erweitert ausschließlich das bisherige J4e-Cockpit mit einer **lesenden Konzern-/Flottenansicht** derselben geladenen Regel204-Welt.

## Funktion und Grenzen

- Die Navigation „Jägercockpit“ / „Konzern & Flotte“ wechselt ausschließlich sichtbare DOM-Bereiche; keine zweite `welt`, kein `erstellenJ4c`, keine Datenbank, kein Replay, kein Wirtschaftstick beim Wechsel.
- Beim Öffnen der Konzernansicht wird die laufende Flugzeitschleife **pausiert**, damit hinter dem ausgeblendeten Cockpit kein unerwarteter Lohnauslauf entsteht. Beim Zurückwechseln bleiben Weltzustand, aktuelles Schiff, F6-Flugposition und nichtpersistente Patrouillen-/Duellübung erhalten. Der Spieler muss die Flugzeit ausdrücklich wieder starten.
- Alle sichtbaren Daten stammen ausschließlich aus dem bestehenden geladenen `weltzustand`: Spieler- und Pilotenkasse, getrenntes Eigentümerhaushaltskonto, echte gebundene Fluglohnreserve, Weltgeldsumme, Weltzeit, wirklich `house` gehörende Schiffe, physische Stationslager und ausgewählte Betriebskassen verschiedener Eigentümer.
- **Stationslager und fremde Kassen sind keine Spielerbestände.** Kein erfundener Zugriff auf `st_nadir` oder `transport` und keine verdeckte Zusammenrechnung zu Spielerkapital. Kein Wirtschaftsbefehl in der ersten J5-Konzernansicht.
- Die Projektion `prototypes/j4c/konzern-lage.js` ist zustandsneutral, wird über dieselben Kernobjekte gespeist und gibt keine veränderbaren Core-Referenzen zurück. Die Tabelle nutzt ausschließlich `textContent`, nie ungeprüftes HTML.
- Bestehende Flug-, Patrouillen-, Duell- und JSON-Exportaktionen bleiben unangetastet. Trainings-HP und Patrouillenfortschritt sind weiterhin nicht im exportierten Wirtschafts-JSON enthalten. Kein zusätzlicher `localStorage`-/IndexedDB-Schlüssel, keine stillschweigende Save-Migration.

## Tests / Prüfgate

- Neuer Node22-Test `tests/j5-konzernansicht.test.mjs`: echter Seed42-Regel204-Save, verfügbare getrennte Konten, tatsächliche Spielerflotte, unveränderte Save-Bytes und Hashes nach Projektion, 33.000 Welt-ISK, echtes `shipUndock` mit 40-ISK-Reserve und Original-Tick, Save/Load, Sperre für fremde Schiffe und Regel195.
- Die vorhandene Chromium-/WebKit-Browserabnahme `tests/j4e-duell-browser.cjs` prüft auf vier Touchgrößen zusätzlich Navigation, Original-Kassen/Weltzeit, Spielerjäger und Flottenansicht, Rückkehr zum bestehenden Schiff sowie Flugpause während der Übersicht. Bisherige Root-, Duell-, Export- und Sicherheitsaudits bleiben Teil des Workflows.
- J4e-CI ruft den J5-Node-Test zusätzlich auf. **Ergebnisse erst nach tatsächlich abgeschlossenem CI-Lauf als bestanden markieren.** Weitere Node22-Gesamtregression und iPad-Safari-/NAS-Geräteabnahme bleiben getrennt zu prüfen.

## Noch nicht integriert

Dieses Teilstück ist **keine** Vereinigung der produktiven Regel195-Hauptwelt mit der Regel204-Forschungswelt, kein vollständiges Konzernmanagement, kein Schiffwechsel und keine nachhaltige W6-Wirtschaft. Die Integration gemeinsamer steuerbarer Konzern-/Pilotaktionen folgt erst nach geprüftem Core-Vertrag, Finanzierungsnachweis und explizitem Spielstandschutz. Keine Änderungen an Geldemission oder Eigentumsrechten.
