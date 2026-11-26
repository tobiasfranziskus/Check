# Verbindliche Entwicklungsregeln für Aphros Void

Diese Regeln gelten für das gesamte Repository. Konkrete Anweisungen des Nutzers haben Vorrang. **[docs/ROADMAP.md](docs/ROADMAP.md) ist die einzige verbindliche Produkt- und Prioritätsplanung**; [docs/PROJEKTSTATUS.md](docs/PROJEKTSTATUS.md) hält überprüfte technische Fakten fest. Vor Änderungen Roadmap, Projektstatus, relevante Testberichte und den aktuellen Code/PR-Stack lesen; historische Berichte beschreiben nur ihren damaligen Stand.

## Dauerfreigabe: `main` als öffentliche, fortlaufende Spieltestversion

**[BESCHLOSSEN am 14.11.2026 / Nutzerfreigabe]** `main` ist kein abgeschotteter Release-Branch mehr, sondern der **aktuelle integrierte und ausreichend geprüfte, spielbare Entwicklungsstand**. Öffentlicher Haupteinstieg ist **https://tobiasfranziskus.github.io/Check/**. Neue, wirklich spielbare und geprüfte Verbesserungen sollen regelmäßig dort verfügbar sein; separate Prototypenlinks und manueller Branchwechsel dürfen nicht zum dauerhaften Standardweg des Spieltests werden. `main` und die Pages-Website sind getrennte Nachweise: Ein Merge ist erst integriert, wenn sein Commit auf `main` liegt; ein GitHub-Pages-Deploy erst veröffentlicht, wenn der zugehörige Deploylauf erfolgreich ist.

**Stehende Integrations-/Veröffentlichungsfreigabe:** Der Nutzer hat ausdrücklich autorisiert, ausreichend geprüfte und zur Roadmap passende Spielschritte künftig **ohne erneute Freigabe für jeden einzelnen Merge** in `main` zu übernehmen und dadurch via GitHub Pages öffentlich zum Testen bereitzustellen. Diese Freigabe ersetzt nur das bisherige pauschale Merge-/Deploy-Verbot; sie ist **keine** Erlaubnis für undokumentierte Wirtschaftsregeln, Geldemission, willkürliche Balancing-Grundsatzwechsel, zerstörerische Datenmigrationen, unfinanzierte Güter/Schiffe/Schäden, echten Multiplayerbetrieb oder NAS-Zugriffe. Solche Produktentscheidungen bleiben beim Nutzer.

**Freigabe-Gate vor jedem größeren Merge nach `main`:**
1. Tatsächlichen `main`-SHA und Roadmap/Projektstatus prüfen, Branch-Basis und alle benötigten gestapelten PRs nachvollziehbar auflösen. Eigenen, gegen aktuellen `main` gerichteten Integrations-PR erstellen; weder 100+ Research-Dateien noch komplette Forschungsbranches allein wegen eines grünen isolierten PRs pauschal durchreichen. Unfertige Teile bewusst draußen lassen.
2. Den vorherigen funktionierenden `main`-Commit als eindeutig bezeichnete, nicht überschreibbare **Backup-Referenz** sichern (vorzugsweise Git-Tag, mindestens separater Backup-Branch; relevante Einzeldateiversionen unter `versionen/` archivieren). Referenz und Wiederherstellungsweg dokumentieren. Nutzer-Spielstände nie überschreiben oder still migrieren; ursprüngliche IndexedDB-Daten und Original-JSON-Exporte respektieren.
3. Vollständigen, wirklich ausgeführten Node22-/Core-/Geld-/Waren-/Eigentums-/Save-/Determinismus-Check einschließlich Negativfällen und betroffenen Browser-/WebKit-/Touchgrößen belegen. Neue Haupt-HTML als tatsächlichen Einstieg prüfen. Bei Wirtschaftsänderungen passende 13×90-Szenarien und ggf. 365-/730-Tage-Tests; ein isolierter grüner Forschungsjob ersetzt nicht die Integration. **Ausgefallene, abgebrochene oder nicht gestartete Checks gelten nicht als bestanden.**
4. Ein neuer Stand muss von der **öffentlichen Root-URL aus spielbar** sein, mit benutzbarer Oberfläche und einem nachvollziehbaren, **rechtmäßig finanzierten** Start-/Spielstandweg; kein unsichtbarer Prototyp, der nur nach manuellem GitHub-Actions-Artifact-Download startet. Bestehende Root-Mechaniken, Speicherplätze und Altzugänge erhalten oder explizit kompatibel migrieren.
5. Erst nach bestandenem Gate selbstständig mergen; anschließend den tatsächlichen **Pages-Deploy und die Root-Adresse** unabhängig prüfen, die neue `[MAIN]`-/`[PAGES]`-Version dokumentieren. Falls der neue Stand scheitert: nicht veröffentlichen oder zu letzter gesicherter Version zurückkehren, ohne Nutzerdaten zu löschen. Auf echtes iPad Safari und das private NAS weiterhin **nicht** als getestet schließen, solange nicht am Gerät geprüft.
6. Unreife Forschung weiterhin in Draft-PRs führen. Das NAS wird durch GitHub Pages nicht automatisch aktualisiert; kein NAS-Push ohne eigenen nachweisbaren Zugriff und Freigabe.

**Für tägliche Automationsberichte gilt weiterhin:** Rein informative oder docs-only-Abgleichs-PRs können bei Abweichungen erstellt werden, aber **der Bericht selbst** darf ohne gesonderten konkreten Entwicklungs-/Integrationsauftrag keine Merges/Veröffentlichungen auslösen. Die stehende Freigabe betrifft die reguläre projektverantwortliche Entwicklungsarbeit mit vollständigem Gate.

## Geführter Fortschritt und täglicher Repository-Putzplan [BESCHLOSSEN 15.11.2026]

- **Projektführung statt PR-Menge:** Die Spielbarkeits-Meilensteine **P0–P6** in `docs/ROADMAP.md` steuern die kurz- bis mittelfristige Produktintegration **parallel** zur unveränderten verbindlichen Wirtschaftsfolge W0–W6. Ein kleines, nutzbares Gesamtsystem hat Vorrang vor weiteren isolierten Demonstratoren. Bestehende Autorität, Wirtschaftssicherheit und Freigabepflichten bleiben unangetastet.
- **Jeden Morgen um 06:30 Europe/Berlin:** den wirklichen `main`-SHA und Pages-Deploy sowie `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, offene PRs/Forschungsbranches, Tests/CI und konkrete Nutzerpfade neu prüfen. Gegenstand der Supervision: (1) Beleglage und Ampel je P0–P6/W0–W6, (2) PR-Triage mit Nachfolgernachweis und Kollisionsrisiko, (3) Blocker/Entscheidungen, (4) genau 2–4 priorisierte nächste Schritte mit Abnahmekriterium.
- **Reale Aufräumarbeit, aber ohne Datenverlust:** überholte PRs anhand Hauptstand/Nachfolger/CI verlässlich identifizieren; Forschungsbranches, Hashes, Berichte, Tags, Saves und relevante Tests bewahren. Keine pauschalen Branchlöschungen, keine PR-Schließung nur wegen Alters. Automatische Supervision darf bei tatsächlicher Dokumentationsabweichung einen **einzigen** geeigneten docs-only-Draft-PR erstellen/fortführen; im Morgenlauf **keine PR-Merges, Deployments, produktiven Codeänderungen, Regel-/Balanceaktivierungen oder destruktiven Aufräumaktionen**. Notwendige Schließungen und Änderungen an Produktcode begründet als getrennte Arbeitspakete ausweisen.
- **Systemanweisungen synchron halten:** `docs/CHATGPT_PROJEKTANWEISUNGEN.md` ist die kopierbare Vorlage, `AGENTS.md` die Repository-Regel, `docs/ROADMAP.md` allein die Produktentscheidung. ChatGPT-Projekteinstellungen können durch einen GitHub-Commit **nicht** automatisch aktualisiert werden.
- **Umfang und Grenzen des täglichen Prozesses:** technische Prüfungen/Änderungen nur dann als ausgeführt melden, wenn die jeweilige Ausführung wirklich stattgefunden hat; kein stilles Erfinden von Lint/CI/Gerätetests. Detailliertes SOP und Checkliste in [docs/PROJEKTLEITUNG_SUPERVISION.md](docs/PROJEKTLEITUNG_SUPERVISION.md).

## Zentrale Projektsteuerung – Management-first [BESCHLOSSEN 26.11.2026]

Die technische Projektleitung bündelt drei Arbeitsstränge (P0, Wirtschaft W0–W6, Piraten/Sicherheit). Integration und UX sind gemeinsame Führungsaufgaben, die unabhängige KI-Blindabnahme ist Qualitätssicherung, kein vierter Entwicklungsstrang. Maßgeblich sind die bestehenden Management-Gates M0–M4 der Roadmap; keine zusätzliche Produktstufe oder neue Kampf-/Wirtschaftsregel.

- Ein allgemeines „Weiter“ im Leitungsdialog bedeutet: aktuellen Stand und Morgenbefund abgleichen, den wichtigsten konkreten Manager-Blocker auswählen, bis zum nachprüfbaren Ergebnis bearbeiten. Explizite Strangaufträge bleiben auf diesen begrenzt.
- Pro Strang grundsätzlich ein aktives Hauptpaket mit Ziel, Branch/PR, Dateigrenze, Abnahme und Integrationsziel; weitere Arbeiten nur begründet und konfliktfrei. Gestapelte Vorläufer als Abhängigkeiten, nicht als getrennte aktive Pakete zählen. Vor neuen Forschungszweigen zuerst vorhandene Ergebnisse und offene Integrations-Gates prüfen. Keine doppelte Bearbeitung durch Chat/Work/Codex.
- Die Projektleitung führt die kurze Steuerungsübersicht am Anfang von [docs/PROJEKTSTATUS.md](docs/PROJEKTSTATUS.md). Forschungsstränge melden Übergaben mit Basis/Head, Beleg, Risiken und nächstem Gate. Zentrale Dokumente nicht in konkurrierenden Forschungsbranches als autoritative Planung fortschreiben.
- Bei Übergabe in einen neuen Chat eine knappe, datierte, belegte Übergabe mit main/Pages, aktiven PRs, Freigaben, Blockern und nächstem Auftrag im Status festhalten. Kein behaupteter Zugriff auf eine exakte Chat-Kontextfüllanzeige.
- Der Morgenlauf priorisiert und berichtet; echte Integration erfolgt nur im konkreten Entwicklungsauftrag nach bestehender Dauerfreigabe und vollständigem Gate. Blindtestbefunde werden in die Priorisierung übernommen, die Tester bleiben ohne Entwicklerwissen. Das gültige modulare Verfahren steht in [docs/M4_U4_KI_BLINDABNAHME.md](docs/M4_U4_KI_BLINDABNAHME.md); Diagnostik ist keine formale Abnahme.

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

### Verbindliche iPad-Ersatzabnahme bis zur späten echten Geräteprüfung [BESCHLOSSEN 15.11.2026]

- Für betroffene Spieloberflächen **Chromium und WebKit** mit repräsentativen iPad-/schmalen Größen **1180×820, 1024×768, 820×1180 und 390×844**; zusätzlich, wenn vorhanden, Quer-/Hochformatwechsel, DPR/Zoom, Safe Areas, geteilte Ansichten und virtuelle Tastatur. Viewport allein ist kein echter Safari-Gerätetest.
- **Eingaben in echten Browserläufen** emulieren: Tippen, langes Drücken, Ziehen/Loslassen am Schubregler, Pointer-Cancel, Zwei-Finger-Pinch, Scrollen, Zielmenüs, Fokus/Hardwaretastatur, Rücknavigation, unsichtbare/überlappende Touchflächen und Wechsel Cockpit ↔ Konzern. Für Autopilot/Orbit/Folgen auch Abbruch durch Handflug, bewegtes/verlorenes Ziel, Anfluggrenzen und reproduzierbare Kurs-/Geschwindigkeitsänderungen.
- **Sitzungs-/Speichersicherheit:** IndexedDB/Storage/Reload, JSON Import/Export, Alt-Spielstände, Manipulationsabwehr, Browser-Hintergrund/Resume und verhinderte Überschreibung bei ungültigem Import. Statische HTTP-/GitHub-Pages-/NAS-kompatible Auslieferung testen; ein echter privater NAS-Server gilt nicht als getestet, wenn nicht erreichbar.
- **Core-Wirtschaft unabhängig auditiert:** Originalseed/Hash, Geld-/Waren-/Schiffs-/Eigentumssummen, finanzierte Flug- und Produktionskette, volle/knappe Kassen und passende Krisenfälle; neue Spieleraktionen dürfen keine Doppelberechnung im UI vornehmen.
- Im Bericht die Ebenen **Node/Simulationskern**, **Chromium-Touchsimulation**, **WebKit-Touchsimulation**, **Pages/HTTP-Smoke** und **echtes iPad-Safari-/NAS-Gerät** getrennt protokollieren, einschließlich fehlgeschlagener und ausgelassener Prüfungen. **Bis zur späteren physischen Abnahme gilt iPad-Safari als OFFEN**, auch bei vollständig grüner Browsermatrix. Dies blockiert gewöhnliche geprüfte Spieltest-Integrationen nicht pauschal, bleibt aber eine sichtbare Release-Restschuld.

## Arbeitsablauf und Abnahme

1. `git status` und aktuellen `main`-Stand prüfen; vorhandene Nutzeränderungen bewahren. Auf einem separaten Branch arbeiten. Die Cloud-Aufgabe ist bereits isoliert; keinen zusätzlichen Worktree ohne ausdrücklichen Auftrag erstellen.
2. Relevante bestehende Tests und Dokumentation lesen. Keine neuen Abhängigkeiten oder Änderungen an Tests/Referenzen allein für ein grünes Ergebnis einführen.
3. Mit Node.js 22 den vorhandenen Prüfbefehl aus dem Repository-Verzeichnis ausführen:

   ```sh
   node --test tests/*.test.mjs
   ```

4. Ergebnisse mit tatsächlicher Testzahl, Fehlern, übersprungenen und nicht ausgeführten Prüfungen berichten. Node-Tests simulieren DOM/IndexedDB; sie ersetzen keine echte Safari-Abnahme. Bei betroffenen Funktionen zusätzlich auf iPad Safari Hoch-/Querformat, Touch/Tastatur, Speicher-/Import-/Exportweg und NAS-Auslieferung prüfen oder die ausstehende Prüfung ausdrücklich benennen.
5. Diff auf unbeabsichtigte Änderungen prüfen. Dokumentation und Projektstatus bei relevanten Änderungen aktualisieren; historische Testberichte nicht nachträglich als aktuelle Abnahme darstellen.
6. Pull Request mit Problem, Änderung, Kompatibilität, Tests und Grenzen erstellen. Spielbare und ausreichend geprüfte Änderungen dürfen mit der **stehenden Nutzerfreigabe vom 14.11.2026** nach den obigen Schutz- und Integrations-Gates selbstständig nach `main` gemergt und über GitHub Pages veröffentlicht werden. Offene Forschungsprojekte, neue Produktregeln und destruktive Migrationen sind dadurch nicht automatisch freigegeben. Ein erfolgreicher Testlauf beweist weder Merge noch Veröffentlichung.

Die JavaScript-Regressionsprüfung verwendet Node.js 22 und reagiert auf `index.html`, `tests/**` sowie ihre eigene und die P0-Inventur-Workflow-Datei. Der P0-Workflow prüft auch Dokumentationsänderungen mit den vorhandenen Inventur- und Linktests. Die vollständige Node22-Suite weiterhin tatsächlich lokal oder in CI für den Integrationsstand ausführen; bei fehlendem Checkout und nicht gestartetem CI-Lauf bleibt das Gate offen. Keine ausgefallene Prüfung als bestanden melden.


## Zentrale Roadmap und fortlaufende Dokumentationspflege

- **Produktvision und Phasen:** vor der Planung `docs/ROADMAP.md` lesen; `docs/PROJEKTSTATUS.md` hält den kurzfristigen, überprüften technischen Stand. Bei Abweichung sind aktuelle `main`-Commits, PR-Basis, CI und Spielcode wichtiger als historische Statusbehauptungen. Aus einem Draft oder Analysewerkzeug nie „bereits integriert“ machen.
- **Nach jedem substanziellen Feature-, UI-, Wirtschafts- oder Designauftrag** prüfen, ob Meilenstein, Priorität, Abhängigkeit, offene Produktentscheidung oder Integrationsstatus geändert wurden. Falls ja, `docs/ROADMAP.md` in demselben PR gezielt nachführen. Den technischen Projektstatus nur mit belegten Daten anpassen. Alle Änderungen mit PR-/Commit-Links und Statuskategorie (`MAIN`, `DRAFT`, `ANALYSE`, `BESCHLOSSEN`, `OPTION`) kennzeichnen.
- **Automatischer Abgleich:** ein täglicher Projektbericht vergleicht GitHub und die Roadmap. Bei materieller Diskrepanz darf ein eigenständiger **reiner Dokumentations-PR** erstellt oder der vorhandene passende Dokumentations-PR aktualisiert werden; keine doppelten PRs. **Nie selbst mergen, deployen, bestehenden Produktcode oder Spielmechanik ändern.** Ohne Abweichung keine kosmetischen Schreibvorgänge. Blockierte Schreibzugriffe als offen melden.
- **ChatGPT-Projektanweisungen:** `docs/CHATGPT_PROJEKTANWEISUNGEN.md` enthält die kurze, kopierbare Fassung; sie muss vom Nutzer in der ChatGPT-Projektoberfläche eingetragen werden. Das Repository kann ChatGPT-Projekteinstellungen nicht direkt editieren. Der Verweis auf die Roadmap hält die Anleitung langfristig aktuell, ohne sie bei jeder neuen Funktion umzuschreiben.
- **Schutz der Vision:** Langfristig Konzernmanager **und** spielbarer Miner/Frachter/Jäger mit Spielerstandort, 2D-Flug, Station/Konzernbüro/Tablet/Cockpit, Module, weitere Systeme und ggf. Koop. Multiplayer bleibt optional; Wirtschaft, deterministischer Kern, iPad-Safari und Save-Schutz haben Vorrang.
