# Aphros Void – Projektstatus

## [MAIN] Integrierte Version

**30. Oktober 2026, GitHub `main`: v0.12.3, Merge-Commit `1ff556592b475082e58d2918a9c7f3b02abd0566`.** Enthalten sind die gemergten PRs **#17 (Asterion/Veldra-Konzernnamen), #18 (treibstofffreie Reisen/Silizium), #19 (Sicherheitszonen), #20 (Nadir und Meridian–Orion-Tor), #22 (Geografie-Referenz- und Wirtschaftstests)** und **#30 (bedarfsorientierte profitable Frachterrouten, Regelversion 12)**. `docs/ROADMAP.md` auf `main` ist die einzige verbindliche Produkt-Roadmap.

**Technik:** weiterhin statische `index.html`, Vanilla JS/HTML/CSS, kein Build oder Backend. **Spielstandschema 8**, **Regelversion 12**. Die bisherigen v8-/v10-Entwicklungsspielstände sind ausdrücklich als inkompatibel genehmigt, weil keine aktiven Nutzer/Spielstände vorhanden sind. Der Lader muss sie klar zurückweisen und niemals Browserdaten still überschreiben oder löschen. Für Regelversion 11 existiert die geprüfte Migration 11→12.

**Nachgewiesene CI-Abnahme:** [PR #30, GitHub Actions #41036228202](https://github.com/tobiasfranziskus/Check/actions/runs/41036228202) mit **48/48 Standardtests**, historischer v11-Referenz, 13 Seeds × 90 Tage für produktive v12-Goldenwerte sowie 13×90-Tage-Weltgeografievergleich: alle ausgeführten Jobs erfolgreich. Am 30.10.2026 erneut geprüft: ein historischer Sicherheitsgeografie-Job ist bedingt übersprungen; der v10-Job führt unter Regel 12 nur seine dokumentierte Überspringen-Verzweigung aus und ist **kein neuer v10-Nachweis**. Die v12-Wirtschaftsreproduktion bestätigt für 13 Seeds × 90 Tage den Rückgang der Mangelstunden **4.204→791** bei Erhaltung von Geld-/Warenbuchungen, Kassenprüfung und Save/Load. **Weder iPad-Safari-Abnahme noch NAS-Deployment** ist damit belegt.

## [ANALYSE/DRAFT] Langzeitdiagnose und Architekturprüfung (30.10.2026)

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
