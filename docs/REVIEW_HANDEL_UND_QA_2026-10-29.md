# Aphros Void – größeres Arbeitspaket: Handel und Regressionstests

**Stand:** 29. Oktober 2026  
**Ausgangsbasis:** `main`, Commit `7a32318560c172d0a671ded4ebb9dacfe5485393`, internes v0.11.1  
**Status:** PR #12 auf `feat/handel-gemeinsame-angebote-qa`; `main` unverändert.

## Anlass und bestätigte Befunde

Nach PR #11 berechnet der Markt Handelsmengen passend zu Kassen, Stationsvorräten und Frachtraum. Die Schiffsdetails verwendeten weiterhin starre Mengen (Kauf von zehn Einheiten; Verkauf aller Ladung, ohne Stationsaufnahmegrenze). Dadurch konnten Befehle trotz vorhandener Buttons abgelehnt werden.

Bei einem ersten Integrationsversuch trat zusätzlich ein `ReferenceError: preis is not defined` im Schiffsmenü auf, da der Import bei der Umstrukturierung zu weit reduziert worden war. Dieser Fehler wurde durch isolierte UI-Tests entdeckt und **vor** Eröffnung des Pull Requests korrigiert.

## Lösung und Architektur

1. Neues Modul `m_ui_handelsangebot` mit den zustandsfreien Funktionen `kauf` und `verkauf` für `{menge, betrag}` oder `null`. Es verwendet ausschließlich bestehende Core-Funktionen für `preis`, `gebuehr`, `verkaufbar`, `aufnehmbar`; kein eigener Regel-/Preisklon.
2. Markt und Schiffsdetails nutzen die gemeinsame Berechnung. Die deterministische Schiffswahl im Markt bleibt erhalten.
3. Im **Markt** bleiben maximal zehn Stück je Kauf-/Verkaufsklick und bei Schiffsware ein Stück erlaubt.
4. Im **Schiffsdetail** können weiterhin alle geladenen Stücke auf einmal verkauft werden, soweit Stationskasse und Lagerkapazität dies erlauben. Käufe berücksichtigen Kasse, Gebühren, Reserve und Frachtraum, maximal zehn Stück beziehungsweise ein Schiff.
5. Wenn ein Schiff aktuell keine verfügbaren Handelsaktionen hat, erscheint eine kurze Erklärung. Der Markt weist auf mengenbegrenzende Faktoren hin.
6. Keine Änderung an Core-Simulation, RNG, Wirtschaftsparametern, Spielstandschema oder Migrationen.

## Dauerhaft ausführbare Qualitätssicherung

Die folgenden Dateien sind **Entwicklungswerkzeuge** und werden nicht von Safari, NAS oder der Spieloberfläche geladen:

- `tests/handel-ui.test.mjs` – UI/Transaktionen, Gelderhaltung, Gebühren, knappe Mengen, Schiffsauswahl, Warteschlange, aufgeklappte Menüs, Vergleichs-Hashes
- `tests/start-smoke.test.mjs` – vollständiges Inline-JavaScript mit simuliertem DOM/IndexedDB: Start, Pause, 1×, Flotte, Miner-Auswahl, eine Stunde Simulationszeit
- `tests/spielstand.test.mjs` – aktuelles Save/Load, Schema 7→8, Regelversion 6→7, beschädigtes/zukünftiges Format
- `.github/workflows/ui-regression.yml` – automatischer GitHub-Actions-Lauf bei Änderungen an `index.html` oder Tests auf PRs und `main`, nur Node.js 22 und Bordmittel, keine npm-Abhängigkeiten

Manueller Testaufruf für Entwickler mit Node.js 22:

```sh
node --test tests/*.test.mjs
```

### Tatsächlich ausgeführte GitHub-Actions-Tests

**19 bestanden, 0 fehlgeschlagen** im PR-Branch, Workflow <https://github.com/tobiasfranziskus/Check/actions/runs/40929141613>. Drei vollständige Drei-Tages-Simulationen mit Seeds 42, 1234, 98765 entsprechen exakt den bisherigen Referenz-Hashes; alle Geld-/Warenaudits stimmen.

Die erste Erweiterung um Migrationstests zeigte eine reine Test-Harness-Abweichung: Ein `SyntaxError` aus einer isolierten Node-VM hat nicht denselben Prototyp wie im Testprozess. Der Test wurde auf die konkrete Fehlermeldung umgestellt und danach erfolgreich erneut ausgeführt. Die produktive App musste dafür **nicht** geändert werden.

## Risikobewertung

- **Geringes Wirtschaft-/Speicherrisiko:** Kern- und Speichermodule unverändert; verifizierte Baseline-Hashes und Migrationsverhalten.
- **Mittleres UI-Risiko:** Schiffs-Handelsangebote werden nur noch gezeigt, wenn aktuell ein gültiges Angebot existiert; eine bislang angebotene, aber nicht ausführbare Aktion ist daher verschwunden. Anzeige kann sich durch live veränderte Marktbedingungen ändern.
- **Wettlauf:** Aufträge im laufenden Spiel werden in die Queue aufgenommen; zwischen Anzeige und tatsächlicher Ausführung können sich Preise, Bestände und Kassen ändern. Der Kern kann einen solchen Auftrag weiterhin ablehnen; dies ist bewusst unverändert.
- **Performance:** Bei vielen Dockschiffen prüft der Markt die Angebotsmenge je Schiff und Ware. Die Schleifen sind bei Kauf auf zehn Einheiten begrenzt; dennoch ist ein echter iPad-Safari-Performance-/Layouttest sinnvoll.
- **Echte Browserprüfung:** Die automatisierten Tests nutzen Node mit simuliertem DOM und IndexedDB. Sie sind **kein realer Safari-Test**. Eine iPad-Bedienprobe und gegebenenfalls ein Screenshotvergleich im Quer- und Hochformat stehen noch aus.
- **CI-Abhängigkeit:** Node/GitHub Actions sind nur beim Entwickeln/Prüfen erforderlich; das Spiel selbst bleibt ohne Frameworks, Build-Prozess oder Server.

## iPad-Abnahme nach einer späteren Freigabe

1. Im Markt und in den Schiffsdetails bei wenig Geld dieselbe reduzierte Erz-Kaufmenge und ihren Gebührenbetrag prüfen.
2. Einen Frachter mit mehr als zehn Erz beladen: Im Markt maximal zehn verkaufen, in dessen Schiffsdetails die gesamte von der Station annehmbare Menge.
3. Wenn der Stationskasse Geld fehlt, muss die angebotene Verkaufsmenge schrumpfen.
4. Aufgeklappte Handelsgruppe bei 1× laufen lassen; sie soll offen bleiben, Befehle akzeptieren und das iPad weiterhin flüssig bedienbar sein.
5. Spielstand exportieren und nach Neustart importieren; eigenen gespeicherten Stand nicht ohne Backup ersetzen.

**Integration erfolgt erst nach ausdrücklicher Freigabe.**
