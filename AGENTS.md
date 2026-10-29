# Verbindliche Entwicklungsregeln für Aphros Void

Diese Regeln gelten für das gesamte Repository. Konkrete Anweisungen des Nutzers haben Vorrang. Vor Änderungen [docs/PROJEKTSTATUS.md](docs/PROJEKTSTATUS.md), relevante Testberichte und den aktuellen Code lesen; historische PR-Berichte beschreiben ihren damaligen Stand.

## Produkt und Technik

- Aphros Void bleibt eine statisch auslieferbare Anwendung aus HTML, CSS und Vanilla JavaScript. `index.html` enthält Oberfläche, Styles und JavaScript-Module. Kein Framework, npm-Laufzeitpaket, CDN, Build-Zwang oder Backend ohne ausdrücklichen Auftrag.
- Das Spiel muss auf iPad Safari und über einen statischen NAS-Webserver funktionieren. Node.js und Tests sind ausschließlich Entwicklungswerkzeuge und dürfen keine Voraussetzung zum Spielen werden.
- Bestehende Modulstruktur und deutsche Benennungen fortführen: `m_data_*` für Daten/Regeln, `m_core_*` für Simulation, `m_ui_*` für Darstellung, Interaktion und Browseranbindung. Keine umfangreiche Umstrukturierung nebenbei.
- Änderungen klein und auf den Auftrag begrenzt halten. UI-, Dokumentations- und Infrastrukturaufträge rechtfertigen keine Änderungen an Spielmechanik, Wirtschaft oder Balancing. Bei reinen Dokumentationsaufträgen bleibt `index.html` unverändert.

## Deterministische Simulation

- Gleicher Seed, gleiche Regeln und gleiche Befehlsfolge müssen denselben Simulationszustand und Hash ergeben. Tick-Reihenfolge, Queue-Reihenfolge, stabile Schiffsauswahl und vorhandene Gleichstandsregeln erhalten.
- Zufall ausschließlich über den gespeicherten Core-RNG erzeugen. Keine Abhängigkeit des Simulationskerns von `Math.random()`, Uhrzeit, DOM, Bildrate, asynchroner Ausführungsreihenfolge oder Browserzustand einführen. Wandzeit gehört in die UI-/Speicherhülle, nicht in die Spielregeln.
- Spieleraktionen über bestehende validierte Befehle abwickeln. Anzeigenamen sind keine Identitäten: interne Schiff-IDs und `data-schiff` bleiben maßgeblich. HTML aus Benutzereingaben, insbesondere Rufnamen, mit dem vorhandenen Escaping ausgeben.
- Preis-, Gebühren-, Reserve- und Kapazitätslogik aus dem Core wiederverwenden. Keine abweichenden Formeln im UI duplizieren. Angebote im laufenden Spiel sind Momentaufnahmen; der Core validiert den tatsächlichen Ausführungszustand erneut.
- Geld-/Warenaudits und deterministische Referenz-Hashes erhalten. Bei ausdrücklich beauftragten Regeländerungen Auswirkungen begründen und neue Referenzen unabhängig prüfen; erwartete Werte niemals nur zur Beseitigung eines Testfehlers ersetzen.

## Bestehende Spielstände schützen

- Bestehende Spielstände sind zu erhalten. Die frühere Testversions-Ausnahme in `docs/RELEASE_V0_11_1.md` ist keine allgemeine Erlaubnis zum Verwerfen von Daten.
- Vor Speicheränderungen Serialisierung, Ladevalidierung, Schema- und Regelmigrationen sowie die UI-Speicherhülle prüfen. Aktuellen Save/Load-Roundtrip und unterstützte Altformate weiter testen; beschädigte oder zukünftige Formate dürfen nicht stillschweigend akzeptiert oder überschrieben werden.
- Versionsanzeige, Spielstandschema und Regelversion sind unterschiedliche Größen. Schema-/Regelnummern nicht für reine UI-Korrekturen erhöhen; notwendige Migrationen bei tatsächlichen inkompatiblen Änderungen gezielt planen und testen. Optionale neue Felder müssen bei alten Spielständen fehlen dürfen.
- IndexedDB ist browser- und originabhängig. NAS-Dateiauslieferung ist keine serverseitige Spielstandsicherung. Vor Neuinitialisierung, Import-Überschreiben, Wechsel von Host/Protokoll/Port oder destruktiven Tests einen JSON-Export sichern; keine Nutzerdaten ohne ausdrücklichen Auftrag löschen.

## iPad Safari und NAS

- Touch-Bedienung, lesbare Beschriftungen, native Dialoge/Formulare, Scrollen und Tastatur berücksichtigen. Vorhandene Touchflächen erhalten; `<summary>` bleibt mindestens 48 CSS-Pixel hoch. Keine nur per Hover oder Maus erreichbaren Aktionen.
- Querformat ist ein wichtiger Nutzungspfad. Hochformat und schmale/geteilte Ansichten müssen bedienbar bleiben. Safari-Viewport, Safe Areas, virtuelle Tastatur und vorhandene CSS-Fallbacks beachten.
- Geöffnete Befehlsgruppen und Eingaben nicht durch Tick-Neuzeichnen verlieren. Pause, Geschwindigkeiten, Zeitschritte, Flottenauswahl und Kauf/Aktivierung nach betroffenen UI-Änderungen prüfen.
- NAS-Auslieferung per HTTP(S) ohne zusätzliche Serverlogik erhalten. Keine absoluten lokalen Pfade, geheimen Zugangsdaten oder maschinenspezifischen URLs in Produktcode aufnehmen.

## Arbeitsablauf und Abnahme

1. `git status` und aktuellen `main`-Stand prüfen; vorhandene Nutzeränderungen bewahren. Auf einem separaten Branch arbeiten. Die Cloud-Aufgabe ist bereits isoliert; keinen zusätzlichen Worktree ohne ausdrücklichen Auftrag erstellen.
2. Relevante bestehende Tests und Dokumentation lesen. Keine neuen Abhängigkeiten oder Änderungen an Tests/Referenzen allein für ein grünes Ergebnis einführen.
3. Mit Node.js 22 den vorhandenen Prüfbefehl aus dem Repository-Verzeichnis ausführen:

   ```sh
   node --test tests/*.test.mjs
   ```

4. Ergebnisse mit tatsächlicher Testzahl, Fehlern, übersprungenen und nicht ausgeführten Prüfungen berichten. Node-Tests simulieren DOM/IndexedDB; sie ersetzen keine echte Safari-Abnahme. Bei betroffenen Funktionen zusätzlich auf iPad Safari Hoch-/Querformat, Touch/Tastatur, Speicher-/Import-/Exportweg und NAS-Auslieferung prüfen oder die ausstehende Prüfung ausdrücklich benennen.
5. Diff auf unbeabsichtigte Änderungen prüfen. Dokumentation und Projektstatus bei relevanten Änderungen aktualisieren; historische Testberichte nicht nachträglich als aktuelle Abnahme darstellen.
6. Pull Request mit Problem, Änderung, Kompatibilität, Tests und Grenzen erstellen, wenn beauftragt. Kein Merge nach `main`, keine Veröffentlichung und kein Deployment ohne ausdrücklichen Auftrag. Ein erfolgreicher Testlauf beweist keine Veröffentlichung.

Die bestehende GitHub-Actions-Prüfung verwendet Node.js 22 und reagiert nur auf `index.html`, `tests/**` und die Workflow-Datei. Bei reinen Markdown-Änderungen den Testbefehl trotzdem lokal ausführen; einen nicht gestarteten CI-Lauf nicht als bestanden melden.
