# B-K9h – 13×90-Tage-Gegenprobe: Echte Auftragsfenster ohne Schiffteleport

**01.11.2026 · [ANALYSE/DRAFT] [PR #100](https://github.com/tobiasfranziskus/Check/pull/100), abhängig vom unintegrierten Dock-/Werft-Kandidaten [#99](https://github.com/tobiasfranziskus/Check/pull/99). NICHT integrieren.**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel14 / Schema8, unverändert.

## Versuchsfrage und Methode

Kann der jetzt vollständig gespeicherte und grundsätzlich profitable, vorfinanzierte Originalvertrag B-K9f/B-K9g bei **realen Schiffspositionen, Originalpreisen und Liquidität** selbstständig wiederholte Aufträge ermöglichen, ohne dass wir (wie in B-K9f) den benötigten NPC-Miner und -Frachter vorab testweise nach Cyris setzen?

**[TEST] [GitHub Actions #41343648571](https://github.com/tobiasfranziskus/Check/actions/runs/41343648571) – SUCCESS.** `tools/bk9h-reale-vertragsfenster-13x90.mjs` führt 13 feste Seeds `1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535` jeweils mit aktivem und an allen Tagen weiterlaufendem Spieler-Erzminer als **gepaarte Kontrolle ohne Vertragsdisposition und Welt mit einem nur testseitigen deterministischen Vermittler** über volle 90 Tage aus. Das sind **26 originale Kernwelten** im explizit geladenen Schema9-/Regel15-Kandidaten.

Der Vermittler prüft **jede Spielstunde** nur *wirklich am Standort Cyris vorhandene*, gedockte und leere NPC3-Eisminer plus NPC1/2-Frachter; für Aldera und Veldra probiert er 1–26 Nahrung, ausschließlich zum **aktuellen Original-Zielspot**, mit vier bereits finanzierten Konten, Vorab-Arbeitslöhnen, Gebühren und Schiffsrücklage. Nach Erfolg würde er die existierende originale `vertragProduktion`- und `vertragFracht`-Schnittstelle aufrufen. **Keine teleportierten Schiffe, keine hinzugefügten Frachter, keine erfundenen Zivilkonten, keine Sonderpreise, kein neues Geld.** Ein externer Test-Verteiler darf dafür nur die normalen Auftragsattribute `halten`/`foerdern`/`handeln` zuweisen. Diese Vermittlung ist **keine ins Spiel integrierte NPC-Autonomie**, keine freie Rollenanpassung und keine allgemeine Suche über alle Systeme oder Waren.

Für jede Welt: **2.160 stündliche Original-Core-Audits UND unabhängige ISK-/Escrow-/Warenprüfungen**, sechs deterministische Save-/Load-Hash-Prüfungen, zusammen **56.160 Stunden-Audits und 156 Save/Load-Roundtrips**. Beide Welten pro Seed starten mit exakt gleichem Hash; alle Prüfungen sind erfolgreich abgeschlossen.

## Wichtigster Befund – keine selbsttätige Vertragsökonomie

| Nachgewiesene Kennzahl | Ergebnis |
| --- | ---: |
| Originalkern-Welten | **26 × 90 Tage** |
| Erfolgreiche Geld-/Waren-/Vertragsaudits | **56.160** |
| Save-/Load-Prüfungen | **156** |
| Geprüfte räumliche gemeinsame Einsatzstunden Miner/Frachter | **1 je Seed (13 gesamt)** |
| Exakt originale Preis-/Mengenquote-Kandidaten bei gemeinsamer Verfügbarkeit | **52 je Seed = 676 gesamt** |
| Positive Vollkosten-/Kapital-Gates unter diesen Kandidaten | **0** |
| Wirklich gestartete/erfüllte neue Verträge | **0 / 0** |
| NPC1-/NPC2-Handelsfrachter am Tag90 | **0 in allen 26 Welten** |
| Veränderung der Mangelstunden durch den Testvermittler | **0** |

Die sehr kurze gemeinsame Einsatzbereitschaft ist **eine Messung unter den streng geforderten Bedingungen** (`NPC3-Eisminer gedockt, am richtigen System, leer, plus NPC1/2-Frachter gedockt und leer`). Sie beweist **nicht**, dass in der gesamten Galaxie keine anderen realen Waren- oder Stationshandelsmöglichkeiten existieren. Auch der erste Tag4-Erfolg aus B-K9f ist nicht widerlegt: **Dort wurden beide konkreten Schiffe für den positiven Test erst gezielt nach Cyris disponiert**, was der unabhängige B-K9h-Versuch bewusst ausschließt.

Die 13 Krisen-Kontrollwelten verlieren ebenso wie ihre Vermittler-Gegenwelt **sämtliche NPC1-/NPC2-Frachter** bis Tag90. Insgesamt liegen die kumulierten Mangelstunden pro Welt zwischen **35.369 und 36.231**. Beispiel Seed7: **35.993 Stunden**, Händlercash NPC1/2 zusammen **169 ISK**, **0 Frachter**; Seed42: **35.798 Stunden**, **132 ISK**, **0 Frachter**. Das ist kein Beleg für eine erfolgreiche nachhaltige Wirtschaft; es zeigt vielmehr, dass ein korrekt finanziertes Vertragsbuch *ohne* eine passende reale Flotten- und Marktpolitik wirkungslos bleibt.

## Ursachenanalyse und unmittelbare Konsequenz

**[ANALYSE]** Die vorgegebenen sehr strengen physischen Startbedingungen und der kleine Suchraum sind der unmittelbare Grund, weshalb kein neues Angebot ausgelöst wird. Die vorangegangenen Teile B-K9f/B-K9g beweisen, dass ein bezahlter Einzelvertrag bei vorhandener, vorfinanzierter Hülle *durchführbar* ist, aber die derzeitige NPC-Flotte im normalen Spiel offenbar weder gemeinsam disponiert noch zeitgerecht die Quell-/Zielpreise und gebundenen Betriebskosten nutzt. Die normalen Stunden-/Mangelwerte bleiben trotz erfolgreich getesteter Vertragsinfrastruktur extrem kritisch.

**[ENTSCHEIDUNGSVORSCHLAG – NICHT AUTOMATISCH BESCHLOSSEN]** Keine weitere Ausweitung des Vertragsbuchs und **keine Geldemissionsregel allein wegen dieses Befunds**. Stattdessen als nächstes enges, reales Ursachen-Gate die *Auftragsfindung und Leerfahrt-Bereitschaft vorhandener NPC-Hüllen* isolieren: zunächst konkrete Ausgangspositionen/Frachtzustände/Wegkosten und die wirtschaftlich begründete Rück-/Leerfahrt berechnen, **ohne** Frachter zu schenken oder Schiffe zu teleportieren. Separat die wiederkehrend zahlungsfähige zivile Nachfrage und NPC-Konzernliquidität modellieren; eine hypothetische Festpreiszahlung ist kein echter Markt.

**[MERGESPERRRE]** Diese 13×90-Prüfung enthält null produktive Aufträge – also **keine** reale Langzeitbelastung des aktiven Vertragspfads. Es fehlen weiterhin Autonomie, vollständiger Schiffsersatz der gesamten Wirtschaft, bezahlte Security, dauerhafte Endkundeneinnahmen und reale Safari-/NAS-Abnahme. Keine automatische Code-Integration von Analysewerkzeugen, keine neue Auftrags-/Dock-/Emission-/Bailout-Regel, kein Spieler-Sparlimit.
