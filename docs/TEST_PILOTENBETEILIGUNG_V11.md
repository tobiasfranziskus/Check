# Aphros Void – v11: Pilotengehälter und eigenfinanzierte Schiffskosten (Experiment)

**Stand:** 30.10.2026. [Draft-PR #24](https://github.com/tobiasfranziskus/Check/pull/24), Basis [PR #23](https://github.com/tobiasfranziskus/Check/pull/23). Nur Entwicklungsskripte und Testworkflow. **`index.html`, Produktionsmechanik, Regeln, Spielstandsformat und `main` sind unverändert.**

## Ziel

Prüfen, ob die gewünschte angestellte, erfolgsbeteiligte Pilotenwirtschaft innerhalb des einzigen deterministischen Simulationskerns finanzierbar ist: Konzerne behalten Schiffe und Handelskapital, Piloten verdienen nur nach tatsächlicher Lieferung und verfügen über eigene Kassen. Frachtervergütung bemisst sich am positiven realisierten Gewinn **nach** Einkaufs-/Verkaufsgebühren und tatsächlicher FIFO-Beschaffungskostenbasis; Miner erhalten einen Anteil des tatsächlich verkauften Rohstoff-Nettoerlöses. Gehaltsbuchungen verschieben vorhandenes Geld vom Konzern zum Piloten; es entsteht dabei **kein** zusätzliches ISK.

## Ausführung / Nachweis

[GitHub Actions #41018579612](https://github.com/tobiasfranziskus/Check/actions/runs/41018579612), Commit `918e349`, Node.js 22:

- **45 Standardtests bestanden**, 0 fehlgeschlagen, 0 übersprungen.
- `node tools/pilot-compensation-scenarios.mjs`: **4 Varianten × 13 Seeds × 90 Tage = 52 Läufe**, alle erfolgreich. Stündliche Core-Geld-/Warenaudits und Save/Load-Roundtrip je Lauf; unveränderte Basissimulation trifft die fixierten v11-Referenzhashes zu Tag 3/30/90. Keine externen Zufallsquellen, gleicher Kern und dieselben Seeds.
- Ebenfalls erfolgreich: bestehende v11-Referenzprüfung, Geografievergleich, NPC-Liquiditätsdiagnose und 6.000/12.000/unbegrenzt-Kapitalvergleich. Historischer Job `sicherheitsgeografie-vergleich` wurde planmäßig wegen seiner PR-Base-Bedingung übersprungen, nicht die Wirtschaftstests.

Die Testquoten sind **nur hypothetische Parameter**, keine zulässigen Produktwerte. Die Kapitalobergrenze bleibt bei 6.000 ISK, um denselben Wirtschaftskreislauf zu vergleichen. Kein NPC-Expansions-/Reparaturmodul wurde eingeschaltet.

## Die vier Varianten

- **A:** Bisherige v11-Wirtschaft, Konzern zahlt pauschale Betriebskosten, keine Piloten.
- **B:** Frachterpilot 10 % vom positiven Nettogewinn, Miner 20 % vom Nettoverkaufserlös, weiterhin Konzern-Betriebskosten.
- **C:** Wie B, jedoch wird die **bisherige abstrakte** Stundenkostenposition im Experiment auf das Pilotenkonto umgebucht; kein echter Reparaturkauf.
- **D:** Frachterpilot 25 % Gewinnanteil, Miner 40 % Nettoverkaufserlös, ebenfalls pilotfinanzierte Stundenkosten.

Individuelle Pilotenaccounts werden als `kind:'pilot'` in `state.owners` geführt; das normale `core.audit` berücksichtigt sie. Bei Schiffsverlust wird in dieser Versuchsanordnung der Pilot mit seinem Guthaben später einem freien Ersatzschiff desselben Konzerns zugeordnet. Verluste nicht mehr existierender Frachtschiffe werden nicht als erfolgreiche Verkäufe vergütet.

## Tatsächlich gemessene Ergebnisse

Alle Summen über **13 Seeds × 90 Tage je Variante**.

| Kennzahl | A Basis | B Gehalt, Konzernkosten | C Gehalt, Pilotkosten | D höheres Gehalt, Pilotkosten |
| --- | ---: | ---: | ---: | ---: |
| Mangelstunden | 4.204 | 485.081 | 284.870 | 471.197 |
| Ungedeckte Stundenkosten | 23.731 ISK | 356.661 ISK | 22.853.211 ISK | 3.484.482 ISK |
| Tatsächlich ausgezahlte Pilotengehälter | 0 | 532.957 ISK | 7.041.919 ISK | 2.324.349 ISK |
| Davon Frachterpilotengehälter | 0 | 191.447 ISK | 2.684.986 ISK | 933.742 ISK |
| Davon Minergehälter | 0 | 341.510 ISK | 4.356.933 ISK | 1.390.607 ISK |
| Pilotenkassen am Endtag | 0 | 532.957 ISK | 391.227 ISK | 492.841 ISK |
| Stationskassen am Endtag | 304.707 ISK | 45.153 ISK | 20.639 ISK | 27.040 ISK |
| Fonds am Endtag | 89.840 ISK | 524 ISK | 33 ISK | 0 ISK |
| NPC1-Abgaben | 37.399.287 ISK | 309.366 ISK | 13.200.154 ISK | 1.343.985 ISK |

### Bewertung

**A bleibt wirtschaftlicher Referenzfall.** Bei B verlassen Lohnzahlungen laufend die Konzernkassen, ohne dass die Piloten bereits einen realen Verbrauchs- oder Dienstleistungsmarkt hätten. Pilotenkassen binden zuletzt 532.957 ISK, während die Stations- und Fondskassen stark schrumpfen. Das Resultat ist eine massive Verknappung.

**C und D sind ebenfalls nicht abnahmefähig.** Die bisherigen abstrakten Betriebskosten auf Pilotenkonten umzubuchen erfüllt die gewünschte Mechanik noch nicht. Die Piloten können ihre laufenden Rechnungen häufig nicht bezahlen; es entstehen hohe, im aktuellen Kostenkern bislang **nicht als Schulden fortgeführte** Unterdeckungen. Dies ist keine wirtschaftlich korrekte Dauerlösung.

**Die Idee der autonomen Piloten ist nicht widerlegt**, nur ein isolierter Einbau der Gehalts-/Kostenumbuchung in eine bislang darauf nicht vorbereitete Wirtschaft. Künftige Reparaturen und Module müssen tatsächlich in stationären Waren-/Dienstleistungstransaktionen münden. Die Kapitalobergrenze darf nicht entfernt werden, solange ihr Rückfluss nicht anders ersetzt ist. Die Rückkopplung muss über die Gesamtwirtschaft geprüft werden, nicht allein über Piloteneinkommen.

## Erforderliches produktionsfähiges Minimaldesign

1. **Vertrag:** `pilotId` als dauerhafte Identität unabhängig von `shipId`, Anstellung bei Konzern, Berechtigungsgrenzen, auftragstypische Beteiligung. Konzerne besitzen Schiffe, Waren und Verkaufserlös.
2. **Buchung:** einmalige Gehaltszahlung nach erfolgreichem Verkauf oder bestätigtem Abschuss. Frachter: Gewinn erst nach Einkaufs- und Verkaufsgebühren, Verlust aus Schiffsvernichtung nicht als Gewinn. Miner: nach tatsächlicher Rohstoffanlieferung. Kopfgeld: bereits vom Core dem Schiffseigentümer gutgeschrieben und in `state.minted` erfasst; nur **Übertragung** eines Anteils, keine zweite Prämienprägung. Gruppenabschüsse benötigen eine nachvollziehbare Zuordnung.
3. **Ausgaben:** kein abstrakter zweiter Kostensatz. Reparaturen und Module benötigen einen Zustand am Schiff (Schaden, Verschleiß, Module), reale Material-/Arbeitsleistungen und buchhalterisch nachvollziehbare stationäre Einnahmen. Technische Betriebskosten werden erst abgelöst, wenn diese Schleife nachgewiesen ist.
4. **Abrechnung:** offene Rechnungen als Verbindlichkeiten, nicht als stillschweigend verfallene Kosten. Klare Regeln bei verunglückter/abgebrochener Mission, Jobwechsel und Tod. Optionaler Konzernvorschuss nur als Forderung/Rückzahlung, nicht als neues Geld.
5. **Erfahrung:** ausschließlich aus tatsächlich erfolgreich ausgeführten Aufträgen; verbessert Handelsbewertung und erlaubte Risikostufen deterministisch. Kein `Math.random`, keine eigenen Preis-/Kampfformeln. Auch NPC-Konzerne nutzen denselben Vertrag-/Pilotenmechanismus.
6. **Speicher:** gespeicherte `pilots`-/Vertragsdaten plus referenzielle Integrität und Schema-/Regelmigration; jede tatsächliche Integration braucht eine neue unabhängige Referenzabnahme. Dieses Experiment bietet **nur sofortigen** Save/Load-Hash-Roundtrip; die externe FIFO-Lotliste und Schiffsbesetzung bestehen bisher im Entwicklungswerkzeug und **sind nicht persistent**. Damit ist eine Fortsetzung nach Ladezeitpunkt ausdrücklich nicht nachgewiesen.

## Empfohlener nächster isolierter Versuch

Vor Pilotengehältern in `index.html`: **stationäre Reparatur-/Leistungsrechnung** als modellierte Waren- und Geldtransaktion entwerfen, ohne neue Wirtschaft zu erfinden; auf fehlendes Geld bei Stations-/NPC- und Pilotenkassen prüfen. Dann gemeinsamer Gegenversuch mit Gehalt und Reparaturkreislauf, mindestens 13 Seeds × 90 Tage mit Basisreferenz, Geld-/Warenaudits, Mangel, Zahlungsrückständen und Verteilung der Geldbestände. Nur bei deutlicher Verbesserung kleine Produktionsänderungen vorschlagen.

Noch kein Integrationsvorschlag, kein Merge, keine iPad-/NAS-Abnahme.
