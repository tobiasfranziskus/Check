# Aphros Void – Projektstatus

**Aktueller Überblick, 30. Oktober 2026:** `main` enthält **v0.11.2, Commit `f01fd57`** (PR #15 gemergt, Spielstandschema 8 und Regelversion 8). Der tatsächliche NAS-/iPad-Deploymentstand wurde nicht nachgewiesen. Technische Fakten sind gegen den aktuellen `main`-Commit, PR-Basen und CI zu prüfen.

**Einzige verbindliche Produkt- und Phasenplanung:** [ROADMAP.md](ROADMAP.md). **Verbindliche Entwicklungsregeln:** [AGENTS.md](../AGENTS.md). Der Entwicklungs-PR-Stack **#18 → #19 → #20**, die QA-/Analyse-PRs **#22–#27** und die produktive Handelspriorität **#28** sind **nicht in `main`**; #28 benötigt vor einer Integration eine saubere Mechanikbasis, ohne Analyse-Commits versehentlich mitzunehmen. **#16** wegen Liquidität blockiert, **#24/#25** nur Experimente. Ein bestandener Simulationstest bedeutet keinen Merge und kein Deployment. Historische Regel- und Spielstandkompatibilität sowie Safari/NAS sind offene Freigabegates.

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
