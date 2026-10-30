# Aphros Void – Projektstatus

## [MAIN] Integrierte Version

**Stand 30. Oktober 2026 · GitHub `main`: v0.12.4, Squash-Merge `9b155640d51d0e1f4022433391a0061dcd5be2ac` ([PR #42](https://github.com/tobiasfranziskus/Check/pull/42)).** Integriert sind u. a. #17–#22, #30 (bedarfsorientierte NPC-Handelsrouten), #35 (docs-only-Wirtschaftsarchitektur) und **#42 (B5a)**. Die verbindliche Produktpriorität liegt weiterhin ausschließlich in [ROADMAP.md](ROADMAP.md).

**Produkttechnik:** statische `index.html`, HTML/CSS/Vanilla JS, kein Backend/Build. **Spielstandschema 8, Regelversion 13**; Migration **11→12→13** und **12→13** erhalten Kassen, Waren, Flüge, offene Arbeitsminuten und Felder. Die ausdrücklich als inkompatibel genehmigten Regelstände 8–10 bleiben klar abgewiesen, zukünftige Regeln ebenfalls. Kein stilles Überschreiben oder Löschen von Browser-Spielständen.

**[MAIN] B5a – gehaltene Reisen werden real bezahlt:** `m_core_stunde.betriebskosten` berücksichtigt tatsächlich angefallene Arbeitsminuten auch bei Auftrag `halten`; untätiges Warten bleibt kostenlos. Normaler Flug kostet keinen Treibstoff. Der gezielt validierte identische Zweietappen-Test bestätigt **0 ISK unter Regel 12 → 241 ISK unter Regel 13**, mit realer Zahlung an den bestehenden Fonds statt Geldschöpfung. Produktionskern wurde außer Kostenprüfung, Regelversions-/Migrationsmarkierung und Versionsanzeige nicht verändert.

**[TEST]** [Abschließende PR-CI #41113681392](https://github.com/tobiasfranziskus/Check/actions/runs/41113681392) auf dem tatsächlich gemergten PR-Head: **57/57 Standardtests**, 13 Seeds × 90 Tage unter Regel 13, **1.170 Tageshashes**, stündliche unabhängige Geld-/Warenaudits, deterministische Replays und Save/Load an Tag 3/30/90, alle 13 Wirtschaftskennzahlen je Seed gegenüber unveränderter v12-Fixture identisch (darunter **791 Mangelstunden insgesamt**, 310.058 Frachterverkäufe). Historische v12-13×90-Goldenprüfung am festgehaltenen ursprünglichen Commit `906b797`, v11-Referenz und Geografie-Dreiervergleich bestanden. Der historische v10-Job unter Regel 13 führte nur seine dokumentierte Überspringen-Verzweigung aus; der gestapelte Sicherheitsgeografie-Job wurde bedingt übersprungen. **Weder echte iPad-Safari-Abnahme noch NAS-Deployment** ist durch diese Prüfungen belegt.

**[ANALYSE/DRAFT] B1–B4 bleiben ungemergt:** [#36](https://github.com/tobiasfranziskus/Check/pull/36)–[#41](https://github.com/tobiasfranziskus/Check/pull/41) und [#32](https://github.com/tobiasfranziskus/Check/pull/32)–[#34](https://github.com/tobiasfranziskus/Check/pull/34) liefern reproduzierte wirtschaftliche Gegenbeispiele, aber keine freigegebenen Produktmechaniken. [B3 #40](https://github.com/tobiasfranziskus/Check/pull/40) belegte tatsächlich bezahlte, aber verlorene Ersatzfrachter samt verdrängtem Minerersatz und ungedecktem Betrieb; [B4 #41](https://github.com/tobiasfranziskus/Check/pull/41) belegte die vermischte Verwendung von `ware` als momentaner Auftrag und Sollrollenidentität. **B5b [OPTION]** muss diese Identitäten getrennt, mit Save-Schutz und Wirtschaftsvergleich behandeln. Über Kapitalgeber, Emissionsregel, Insolvenz, pauschale Spielerabgaben oder kostenlosen Wiederaufbau wurde keine neue Produktregel freigegeben.

## [ANALYSE/DRAFT] Langzeitdiagnose und Architekturprüfung (30.10.2026)

**Historische Prüfbasis der folgenden #32–#34-Auswertung (nicht aktueller main-Stand):**

GitHub `main` bei dieser Prüfung: [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f), Produkt weiterhin v0.12.3. Offen und nicht gemergt: [#32](https://github.com/tobiasfranziskus/Check/pull/32) (`8cd8713`, Basis `main`), [#33](https://github.com/tobiasfranziskus/Check/pull/33) (`4c55d4b`, Basis #32), [#34](https://github.com/tobiasfranziskus/Check/pull/34) (`6855d76`, Basis #33).

- **Übernommene bestehende Befunde:** #32 reproduziert aktive Spieler-Kollapsfälle trotz korrekter Geld-/Warenbilanz; #33 verhindert vier Startkollapse mit Spieler-Rückfluss, begrenzt dabei Sparen/Investition und heilt spätes Wiederanlaufen nicht dauerhaft. #34 erreicht in 16 Eingriffsfortsetzungen keinen Wiederanlauf beider Handelsflotten: zwei einzelne bezahlte Ersatzfrachter haben danach null Handelskapital, keinen Warenhandel und gehen erneut verloren. Aldera fehlen Bauteile/Silizium trotz vorhandener entfernter Bestände. Diese Langzeitversuche wurden im Architekturauftrag **nicht neu ausgeführt**.
- **Jetzt geprüfte CI-Metadaten:** Regression und jeweilige Analyse erfolgreich an allen drei genannten Heads. Analyse-Läufe: [#32](https://github.com/tobiasfranziskus/Check/actions/runs/41067401643), [#33](https://github.com/tobiasfranziskus/Check/actions/runs/41076425687), [#34](https://github.com/tobiasfranziskus/Check/actions/runs/41083152586). Technischer Erfolg ist keine wirtschaftliche Freigabe.
- **[ANALYSE/OPTION]** Der [Architekturbericht](ARCHITEKTUR_WIRTSCHAFT_V12.md) dokumentiert Ursachen, vorhandene Geld-/Warenpfade, drei Ansätze, mögliche Insolvenz-/Wiederaufbauabläufe und offene Entscheidungen. Die Empfehlung ist unimplementiert. Beschlossene Produktziele stehen ausschließlich in der [Roadmap](ROADMAP.md).
- **Neu lokal geprüft im docs-only-Auftrag:** Node.js 22.23.4, Pflichtbefehl erfolgreich (sechs Dateisuiten); zusätzlich einzeln sichtbare **48/48 bestehende Tests**, 0 Fehler/Skip/Abbrüche. Keine neue Jahres-/Wiederanlaufsimulation oder Safari-/NAS-Abnahme. Produktdatei, Regeln 12, Schema 8, Tests, Goldenwerte und Workflow unverändert. Wegen des Markdown-Pfadfilters ist kein neuer CI-Lauf zu erwarten; kein Merge/Deployment.

## [ANALYSE] Geschlossene Forschungs-/Alt-PRs

Historischer Audit **#1**, nicht ausreichend finanzierte NPC1-Expansion **#16**, Liquiditäts-/Preis-/Routenanalysen **#23, #26, #27**, Pilotengehalt **#24**, Modulbau-Prototyp **#25** sowie der von #30 abgelöste gestapelte Entwurf **#28** sind **geschlossen und nicht nach `main` gemergt**. Ergebnisse sind in [ANALYSEARCHIV_WIRTSCHAFT_V11.md](ANALYSEARCHIV_WIRTSCHAFT_V11.md) zusammengefasst. Die alten PR- und Git-Branches bleiben als reproduzierbarer Nachweis erhalten. **Keine** Pilotengehalts-, Modul- oder pauschale Preisänderung ist dadurch produktiv geworden.

## Offene Qualitäts-/Produktgates

- Reale iPad Safari Touch-/Querformat-/Hochformat- und NAS-Datei-/Persistenzabnahme; kein Rollout behaupten.
- Die in #32–#34 belegten Langzeit-/Spielerkollapse und Wiederanlaufgrenzen lösen: vollständige Zyklusfinanzierung, reale Nachschubpfade und freizugebendes Geldregime gemeinsam beurteilen; Diagnose ist noch keine Produktkorrektur.
- Erst nach Ursachenprüfung neue Geld-/Waren-Ausgaben, Piratenwirtschaft, Reparaturen, Module und NPC-Personal einführen. Phasen und Abhängigkeiten ausschließlich nach der [ROADMAP.md](ROADMAP.md).

## Archivierter Statusauszug vom 29. Oktober 2026

**Der folgende Bericht ist historisch und darf nicht als aktueller `main`- oder Roadmap-Stand interpretiert werden.** Er wird zur Rückverfolgbarkeit aufbewahrt.

Stand: 29. Oktober 2026. v0.11.2 auf `feat/v0.11.2-wirtschaft`, Basis main `d53bf14`. Noch nicht gemergt, veröffentlicht oder auf NAS/iPad abgenommen.

Schutzgeld ist 0; automatische NPC-Frachter verwenden zwei regulär bezahlte Reserveeinheiten. Schema 8 bleibt erhalten, Regelmigration 7→8 ändert nur die Regelnummer. [Aktueller Testbericht und Risiken](TEST_WIRTSCHAFT_V0_11_2.md): 40 Node-22-Tests sowie 13 wiederholte 90-Tage-Simulationen, alle Audits und Referenzvergleiche korrekt.

## Version und Architektur

| Bestandteil | Aktueller Stand |
| --- | --- |
| Anwendung | Aphros Void, HTML-Metatag `aphros-version`: `v0.11.2` |
| Spielstandschema | 8 |
| Regelversion | 8 |
| Laufzeit | HTML, CSS, Vanilla JavaScript in einer `index.html` |
| Auslieferung | Statische Datei; für iPad Safari und NAS-Webserver vorgesehen |
| Entwicklung | Node.js 22, integrierter Test-Runner; keine npm-Abhängigkeiten, kein Build-Schritt |

Die Versionsangabe im Metatag ist maßgeblich für diesen Bericht. Eine separate Korrektur sichtbarer Versionsanzeigen wurde als PR #5 geschlossen; daraus folgt kein neuer Release-Stand.

- `m_data_*`: Systeme, Wirtschaft, Kampf- und Weltparameter; `m_data_rules` bündelt Regeln, Schema und Regelversion.
- `m_core_*`: gespeicherter Seed/RNG, Zustand, validierte Befehle, Handel, Reisen, Produktion und Kampf. `m_core_step` verarbeitet die Queue und die Simulationsphasen in fester Reihenfolge. Kanonische Serialisierung, Zustands-Hash und Geld-/Warenaudit sichern Nachvollziehbarkeit.
- `m_ui_*`: Ansichten, Marktangebote, Schiffsnamen, Touch-Bedienung, Zeitsteuerung, Neuzeichnen und Browserpersistenz. Markt und Schiffsdetails verwenden gemeinsame Angebotsberechnungen auf Basis bestehender Core-Funktionen.
- Speicherung: IndexedDB-Datenbank `aphros-void`, Store `saves`, ergänzt durch JSON-Import/Export und eine Speicherhülle. Schema- und Regelmigrationen liegen im Core. Spielstände liegen im Browser, nicht automatisch auf dem NAS.
- Schiffskauf: Schiffsware wird zunächst als Fracht gekauft und anschließend per bestehendem `shipActivate` in Dienst gestellt. Bei laufender Simulation sind dies getrennte Befehle/Ticks.
- Schiffsnamen: Standardnamen nach Klasse und aktueller ID-Reihenfolge; optionaler gespeicherter `rufname` über validierten `shipRename`-Befehl. Umbenennen/Zurücksetzen löst Speichern aus. Interne IDs bleiben unverändert.

## Abgeschlossene Pull Requests

Quelle: GitHub-Liste der [geschlossenen Pull Requests](https://github.com/tobiasfranziskus/Check/pulls?q=is%3Apr+is%3Aclosed), am 29. Oktober 2026 geprüft, abgeglichen mit der Git-Historie von `main`. „Geschlossen“ bedeutet nicht automatisch „gemergt“.

| PR | Ergebnis | Inhalt |
| --- | --- | --- |
| [#4](https://github.com/tobiasfranziskus/Check/pull/4) | Gemergt | v0.11.1: Jagdprämie Faktor 3 und Warenbilanz bei Verlust beladener Schiffe |
| [#7](https://github.com/tobiasfranziskus/Check/pull/7) | Gemergt | Startfehler, Pause und Flottenbedienung repariert |
| [#8](https://github.com/tobiasfranziskus/Check/pull/8) | Gemergt | iPad-Querformat mit zwei Spalten und kompakten Schiffsmenüs |
| [#9](https://github.com/tobiasfranziskus/Check/pull/9) | Gemergt | Handelsbeträge inklusive Gebühren bzw. Nettoerlös |
| [#10](https://github.com/tobiasfranziskus/Check/pull/10) | Gemergt | Passendes Trägerschiff je Kauf/Verkauf und Ware |
| [#11](https://github.com/tobiasfranziskus/Check/pull/11) | Gemergt | Handelsmengen nach Kasse, Reserve, Bestand und Frachtraum |
| [#12](https://github.com/tobiasfranziskus/Check/pull/12) | Gemergt | Gemeinsame Handelsangebote in Markt/Flotte und automatisierte Regressionstests |
| [#13](https://github.com/tobiasfranziskus/Check/pull/13) | Gemergt | Direkte Inbetriebnahme gekaufter Schiffsware, lesbare Standardnamen, Umbenennen und sofortiges Speichern |
| [#2](https://github.com/tobiasfranziskus/Check/pull/2) | Ohne Merge geschlossen | Frühere komplexe Spielstandmigration/Ladevalidierung |
| [#3](https://github.com/tobiasfranziskus/Check/pull/3) | Ohne Merge geschlossen | Einzelne Frachtverlustkorrektur; in #4 enthalten |
| [#5](https://github.com/tobiasfranziskus/Check/pull/5) | Ohne Merge geschlossen | Separate Korrektur sichtbarer Versionsanzeigen |
| [#6](https://github.com/tobiasfranziskus/Check/pull/6) | Ohne Merge geschlossen | Früher Gebühren-UI-Ansatz; durch #9 ersetzt |

Historische Dokumente nennen diese Arbeiten teilweise noch „PR-Branch“ oder „nicht veröffentlicht“. Für die Integration gilt die obige Zuordnung; ein Merge allein bestätigt keinen laufenden Deployment-Stand.

## Qualitätssicherung

Verbindlicher Aufruf im Repository-Verzeichnis mit Node.js 22:

```sh
node --test tests/*.test.mjs
```

- `tests/handel-ui.test.mjs`: Handelsmengen und Gebühren, Schiffswahl, Inbetriebnahme, Namen, Escaping, Queue und deterministische Drei-Tages-Simulationen mit festen Referenz-Hashes für Seeds 42, 1234 und 98765.
- `tests/spielstand.test.mjs`: Save/Load-Roundtrip, Schema 7→8, Regelversion 6→7 sowie Ablehnung beschädigter/zukünftiger Formate.
- `tests/start-smoke.test.mjs`: gesamter Spielstart, Pause, Flotte, Schiffsauswahl, Zeitschritt und Umbenennen einschließlich IndexedDB-Speicherung mit simulierten Browser-Schnittstellen.
- `.github/workflows/ui-regression.yml`: Node.js 22 auf PRs und `main`, mit Pfadfilter für `index.html`, `tests/**` und die Workflow-Datei. Reine Markdown-PRs lösen diesen Job nicht aus.

Aktueller Lauf am 29. Oktober 2026 mit Node.js v22.23.4: **40 bestanden, 0 fehlgeschlagen, 0 übersprungen**. Wirtschaftsregeln, Versionsangabe und Tests wurden wie im aktuellen Testbericht beschrieben geändert; der Workflow bleibt unverändert. Die Tests enthalten keine echte iPad-Safari- oder NAS-End-to-End-Prüfung.

## Offene Probleme und Grenzen

1. **Safari-Abnahme der jüngsten Änderungen ausstehend:** Lange Markt-/Aktivierungstexte, Umbenennungsdialog, Bildschirmtastatur, Hoch-/Querformat, schmale Ansichten und laufende Tick-Neuzeichnung real prüfen. Laut Nutzerabnahme im Schiffskauf-Bericht funktionierten zuvor Markt/Flotte, Mengenbegrenzung, Pause/Zeitschritte, Handel und Speichern. Das ist keine Abnahme des neuen Namensdialogs.
2. **Persistenzrisiko:** Browserdaten sind originabhängig und können löschbar sein. Vor NAS-/Hostwechsel und Import einen Export sichern. Bestehende Spielstände müssen erhalten bleiben; die historische Testdaten-Ausnahme aus dem Releasebericht ist keine aktuelle Freigabe zum Verwerfen.
3. **Automatische Standardnamen können wechseln:** Nach Verlust eines früheren Schiffs wird anhand des aktuellen Bestands neu nummeriert. Eigene Rufnamen bleiben stabil; doppelte Rufnamen sind erlaubt. Stabile Seriennummern wären eine gesonderte Produkt-/Schemaentscheidung.
4. **Angebote können veralten:** Zwischen Anzeige und Queue-Ausführung können Kassen, Preise, Ladung oder Standort wechseln. Eine Ablehnung durch den Core ist erwartete Validierung, kein bestätigter neuer Defekt.
5. **Deployment nicht geprüft:** Der tatsächliche NAS-/Pages-Stand und Performance bei größeren Flotten sind hier nicht verifiziert. Aus fehlenden Browsertests folgt kein bestätigter Produktfehler.

Die GitHub-API war bei dieser Prüfung durch den Netzwerkproxy gesperrt. Die PR-Zuordnung oben basiert auf der erreichbaren GitHub-Webliste und Git. Eine vollständige aktuelle Issue-Inventur wurde nicht verifiziert; diese Liste erhebt daher keinen Anspruch auf Vollständigkeit aller GitHub-Issues.

## Nächste Entwicklungsschritte

1. iPad-Safari-Abnahme von #13 durchführen: Schiff kaufen → als Fracht sehen → in Dienst stellen → Flotteneintrag prüfen; Umbenennen und Zurücksetzen bei Pause sowie laufender Simulation, anschließend Neuladen/Save/Load prüfen.
2. Auf dem tatsächlichen NAS die statische Auslieferung und denselben Export-/Importpfad prüfen; vor Originwechsel einen existierenden Spielstand exportieren. Keine Spielstände für die Prüfung löschen.
3. Nur reproduzierte Befunde als gezielte UI-/Speicheraufträge bearbeiten. Dabei Regressionstests, deterministische Hashes und Audits erhalten; keine beiläufigen Balancingänderungen.
4. Offene GitHub-Issues nach verfügbarem API-Zugang abgleichen. Bedarf an stabilen Standard-Seriennummern oder vereinheitlichter Versionsanzeige gesondert klären, bevor Code oder Schema geändert werden.

Entwicklungsregeln stehen in [AGENTS.md](../AGENTS.md). Dieser Dokumentationsauftrag verändert weder `index.html` noch Spielmechaniken, Speicherformat oder Tests und umfasst keinen Merge oder Deployment.
