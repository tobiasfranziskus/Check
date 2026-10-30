# Aphros Void – Projektstatus

## [MAIN] Integrierte Version

**30. Oktober 2026, GitHub `main`: v0.12.3, Merge-Commit `1ff556592b475082e58d2918a9c7f3b02abd0566`.** Enthalten sind die gemergten PRs **#17 (Asterion/Veldra-Konzernnamen), #18 (treibstofffreie Reisen/Silizium), #19 (Sicherheitszonen), #20 (Nadir und Meridian–Orion-Tor), #22 (Geografie-Referenz- und Wirtschaftstests)** und **#30 (bedarfsorientierte profitable Frachterrouten, Regelversion 12)**. `docs/ROADMAP.md` auf `main` ist die einzige verbindliche Produkt-Roadmap.

**Technik:** weiterhin statische `index.html`, Vanilla JS/HTML/CSS, kein Build oder Backend. **Spielstandschema 8**, **Regelversion 12**. Die bisherigen v8-/v10-Entwicklungsspielstände sind ausdrücklich als inkompatibel genehmigt, weil keine aktiven Nutzer/Spielstände vorhanden sind. Der Lader muss sie klar zurückweisen und niemals Browserdaten still überschreiben oder löschen. Für Regelversion 11 existiert die geprüfte Migration 11→12.

**Nachgewiesene CI-Abnahme:** [PR #30, GitHub Actions #41036228202](https://github.com/tobiasfranziskus/Check/actions/runs/41036228202) mit **48/48 Standardtests**, v10-/v11-Referenzprüfungen, 13 Seeds × 90 Tage für produktive v12-Goldenwerte sowie 13×90-Tage-Weltgeografievergleich: alle ausgeführten Jobs erfolgreich. Ein historischer bedingt übersprungener Sicherheitsgeografie-Job zählt nicht als Test. Die v12-Wirtschaftsreproduktion bestätigt für 13 Seeds × 90 Tage den Rückgang der Mangelstunden **4.204→791** bei Erhaltung von Geld-/Warenbuchungen, Kassenprüfung und Save/Load. **Weder iPad-Safari-Abnahme noch NAS-Deployment** ist damit belegt.

## [ANALYSE/DRAFT] NPC-Wiederanlauf nach Kollaps, 30. Oktober 2026

Folgeanalyse zu [#32](https://github.com/tobiasfranziskus/Check/pull/32) und [#33](https://github.com/tobiasfranziskus/Check/pull/33), Produktbasis weiter `main ed94b89`; [Bericht, reproduzierbare Varianten und Messdaten](TEST_NPC_WIEDERANLAUF_V12.md), Branch [`analyse/npc-wiederanlauf-v12`](https://github.com/tobiasfranziskus/Check/tree/analyse/npc-wiederanlauf-v12). **Ohne Spielerfilter aus #33; keine Produktions-, Goldenwert- oder Roadmap-Änderung.**

- Vier unveränderte Kollapsfälle an Tag 90, Kontrolle plus vier einzeln eingesetzte Fonds-/Zuschussvarianten bis Tag 365: **20/20 technische Replay-/Audit-/Save/Load-Prüfungen bestanden**, aber **0/16 Eingriffe** stellen beide Handelsflotten wieder her. Zusätzlich **48/48 Standardtests** und alle **13×90-Tage-v12-Goldenprofile** lokal erneut bestanden.
- Fondsweiter Zuschuss bezahlt im Miner-/Flottenfall je eine vorhandene Frachterhülle aus realen Meridian-Fondsmitteln. Danach **0 ISK Handelskasse**, kein Warenkauf/-verkauf, erneuter Verlust nach 81/7 Stunden. Werftreserve, Umleitung bestehender Fondsüberschüsse und Zuschuss einschließlich vorhandener 250-ISK-Rücklage bleiben jeweils allein wirkungslos.
- Aldera hat durchgehend **0 Bauteile und 0 Silizium**, während Meridian 91 Bauteile/100 Silizium hält. Die räumliche Produktions-/Transportblockade bleibt nach dem ersten bezahlten Ersatz bestehen; die Varianten erzeugen keine neuen Werfthüllen. Kein Erfolg aus bloßem Schiffbestand ableiten.
- **Keine getestete Einzelvariante als Produktkorrektur freigeben.** Eine Kombination vorhandener Fondsdeckung/Betriebsreserve mit nachgewiesenem realem Materialtransport ist lediglich Empfehlung für einen gesonderten Analyseauftrag. Keine neuen Geldquellen, keine Spielerabgabe, kein Merge oder Deployment.

## [ANALYSE/DRAFT] Gegenversuch Spieler-Überschussrückfluss, 30. Oktober 2026

Folgeanalyse auf den Werkzeugen aus [Draft-PR #32](https://github.com/tobiasfranziskus/Check/pull/32), Basis `main` [`ed94b89`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f), Analysebranch [`analyse/spieler-rueckfluss-v12`](https://github.com/tobiasfranziskus/Check/tree/analyse/spieler-rueckfluss-v12). [Bericht, Alternativen und Messdaten](TEST_SPIELER_RUECKFLUSS_V12.md). **Nur die Testregeln nehmen `player` zusätzlich in `npcAusgabenArten` auf; `index.html`, produktive Regeln, Goldenwerte und Roadmap bleiben unverändert.**

- Der im älteren Langzeitbericht noch ungetestete Rückfluss-Gegenversuch ist jetzt geprüft: **19/19 gepaarte Jahresvergleiche** mit je zwei Varianten und je einem uninstrumentierten Replay, stündlichen Geld-/Warenaudits, Einzelkassenflüssen, täglichen Hashes und Save/Load-Fortsetzung. **48/48 Standardtests** lokal bestanden. Alle **13 inaktiven Baselines bleiben kanonisch identisch**; beide Varianten reproduzieren alle alten 90-Tage-v12-Profile.
- Aktivierung ab Spielbeginn verhindert den Kollaps in den vier ausgewählten Startfällen: Miner/42 **154.598→207**, Flotte/42 **155.459→204**, Station/1234 **155.303→210**, Jagd/98765 **155.325→234** Jahres-Mangelstunden; Händlerflotten bleiben vorhanden. Das ist eine reale Verbesserung von Umlauf und Leistung, keine Produktfreigabe.
- **Fortschrittsverlust bestätigt:** Der einzelne Miner erreicht nie 8.000 liquide ISK (Maximum 7.056); der gleiche Stationskaufbefehl aus #32 wird im Gegenversuch abgelehnt. Kurzzeitige ≥8.000-Fenster mit mehreren aktiven Schiffen und günstigere tatsächliche Stationsangebote existieren; daher kein allgemeines Verbot jedes Stationskaufs behaupten.
- **Wiederanlauf unzureichend:** Aktivierung erst nach Tag 90 bringt Teilproduktion/Förderung zurück, aber keine dauerhaft wiederhergestellten Handelsflotten. Postmortems bestätigen vorhandene Hülle, zu kleinen Aldera-Zuschussfonds und fehlende Bauteile.
- **Keine pauschale Spielerabgabe als endgültige Lösung übernehmen.** Vor jeder Produktimplementierung muss die Projektleitung Spar-/Investitionsfreiheit und zulässigen Rückfluss entscheiden; Alternativen sind im Bericht mit Vor-/Nachteilen als ungetestete Optionen aufgeführt. Kein Merge oder Deployment.

## [ANALYSE/DRAFT] Langzeitwirtschaft v12, 30. Oktober 2026

Analysebranch [`analyse/wirtschaft-langzeit-v12`](https://github.com/tobiasfranziskus/Check/tree/analyse/wirtschaft-langzeit-v12), Basis [`ed94b89`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f). [Testbericht mit Methode und Messdaten](TEST_WIRTSCHAFT_LANGZEIT_V12.md). **Keine Änderung an `index.html`, Regeln, Rezepten, Preisen, KI, UI, Schema oder Roadmap; kein Merge/Deployment.**

- Lokal mit Node.js 22.23.4: **48/48 Standardtests**, **13/13 Seeds × 365 Tage** mit Zwischenständen 90/180/365, unveränderte v12-90-Tage-Fixwerte, stündliche Geld-/Warenaudits und Einzelkassenflussprüfung, täglicher Replayhash und Save/Load mit deterministischer Fortsetzung. Zusätzlich **3/3 Jahres-Spielerfälle und 3/3 isolierende 90-Tage-Kontrollen technisch bestanden**. Neue CI wird in sechs Gruppen aufgeteilt; lokalen Erfolg nicht als GitHub-CI-Erfolg ausgeben.
- Ohne Spieleraktionen Mangelstunden **791 / 1.582 / 3.142** nach 90/180/365 Tagen, Mangelquote etwa **0,15 %**. Alle **18.823** zivilen Jahresverluste aus vorhandenen Kassen/Werfthüllen ersetzt, ohne Fonds-Zuschüsse. Zivile Jahreskostenlücke **27.106 ISK**.
- **Bestätigte wirtschaftliche Grenzen:** Sicherheit bezahlt nur **6.367.160 von 28.470.000 ISK** Jahres-Sollkosten, arbeitet aber weiter. Alle drei aktiven Jahres-Spielerfälle verlieren beide NPC-Handelsflotten und bleiben von Tag 90 bis 365 ohne Erholung von Handel/Förderung/Produktion; Spielerkapital bindet Umlaufmittel. Schon ein einzelner regulärer Start-Miner-Befehl reproduziert den Flottenausfall auf Seed 42 im 90-Tage-Kontrollfall. Bestandene Audits sind daher keine wirtschaftliche Freigabe für Expansion.
- Kleinster zuerst zu untersuchender vorhandener Hebel: Owner-Geltung des bestehenden Überschussrückflusses `npcAusgaben`/`npcAusgabenArten`. **Ungetestete Reparaturhypothese, keine beschlossene Spielerabgabe oder Produktänderung.** Prioritäten bleiben in `ROADMAP.md`; weitere Wirtschaftsmechaniken und reale Safari-/NAS-Abnahme werden hier nicht freigegeben.

## [ANALYSE] Geschlossene Forschungs-/Alt-PRs

Historischer Audit **#1**, nicht ausreichend finanzierte NPC1-Expansion **#16**, Liquiditäts-/Preis-/Routenanalysen **#23, #26, #27**, Pilotengehalt **#24**, Modulbau-Prototyp **#25** sowie der von #30 abgelöste gestapelte Entwurf **#28** sind **geschlossen und nicht nach `main` gemergt**. Ergebnisse sind in [ANALYSEARCHIV_WIRTSCHAFT_V11.md](ANALYSEARCHIV_WIRTSCHAFT_V11.md) zusammengefasst. Die alten PR- und Git-Branches bleiben als reproduzierbarer Nachweis erhalten. **Keine** Pilotengehalts-, Modul- oder pauschale Preisänderung ist dadurch produktiv geworden.

## Offene Qualitäts-/Produktgates

- Reale iPad Safari Touch-/Querformat-/Hochformat- und NAS-Datei-/Persistenzabnahme; kein Rollout behaupten.
- Bestätigte Langzeit-Spieler-Kapitalbindung und Sicherheits-Kostenunterdeckung aus dem oben verlinkten Analysebericht beheben und mit denselben Jahres-/Spielerfällen erneut prüfen; vor einer Regeländerung deren Produktwirkung entscheiden.
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
