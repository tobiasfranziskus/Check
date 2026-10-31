# B6d-C0 – Reales Stationshonorar nach Lieferung

**31. Oktober 2026 · [ANALYSE/DRAFT], abschließende Abnahme und wirtschaftliche Empfehlung.**

## Problem

In B6c [#52](https://github.com/tobiasfranziskus/Check/pull/52) sind in allen vier originalen Krisen bereits an Tag 90 **null NPC1/2-Frachter** vorhanden; die Konzerne verfügen an Tag 365 über höchstens 165 ISK. Bezahlt werden müsste nicht nur eine echte Hülle, sondern auch erste Ware, Anfahrt, Fahrtarbeit und ein weiterer Umlauf. Einzelne Stationen besitzen Geld, das aber örtlich gebunden ist und ihrer eigenen Versorgung dient.

Ein von einer Station finanzierter neuer Frachter/Wareneinkauf wäre **ein Vorschuss mit Eigentums-, Gläubiger-, Risiko- und Spielstandfolgen**, keine bloße Frachtdienstleistung. Daher zunächst kleinster kausal prüfbarer Versuch **C0**, ohne neue Hülle oder Vorschuss:

## Der isolierte Versuch

- Eine **neutrale Station** bietet NPC1/NPC2 einen dauerhaften, nachträglich erfüllbaren Frachtauftrag an.
- **Nur wenn der reale Regel-14-Kern tatsächlich Waren von einem NPC1/2-Frachter annimmt und zum vorhandenen Marktpreis bezahlt**, vergütet die Station den Transport gesondert. Das Frachtentgelt beträgt höchstens **10 % des gerade gekauften Warenwertes**. Nach der Marktzahlung müssen der Station mindestens **500 ISK** bleiben. Spielerstationen, Miner und sonstige Besitzer sind ausgeschlossen.
- Vom Stationskonto geht exakt der vergütete Betrag auf das Konto des Frachterbesitzers. Buchungen werden auch im vorhandenen `stats.konto` als Aufwand/Ertrag verzeichnet. **Keine Geldschöpfung**, kein freies Schiff, keine neue Ware, keine Preis-, Routen-, Piraten-, Arbeits- oder Werftregel.
- Die Zahlung erfolgt **nach vollständiger realer Markttransaktion**, nicht bei Ankündigung. Eine Station kann nicht unter 500 ISK sinken **durch diese Zusatzvergütung**; andere Ausgaben bleiben möglich. Die 10 % und 500 ISK sind lediglich bewusst begrenzte, frei prüfbare Hypothesen.
- Da keine Verträge oder Forderungen zwischen Ticks offen bleiben, werden **keine neuen Speicherdaten** eingeführt. Die Standing-Offer-Regel wird allein beim bestätigten Handelsereignis ausgeführt. Beide Simulations-/Replay-Kerne verwenden die identische, nur für das Analysewerkzeug instrumentierte Quellbasis.

## Wirtschaftliches Gate

**13 feste Seeds ×90 Tage, vier originale B1-Spielerkrisen ×275 Tage jeweils Kontrolle/C0**, 34 Läufe, 4.540 Tageshashes, 108.960 Stundenprüfungen, Geld-/Warenaudits, Replay, 440 Save/Load-Roundtrips und bestehende 67 Node-Tests. Produktive Kontroll-Goldenwerte **791 Mangelstunden, 310.058 NPC-Traderverkäufe, 16.090 ISK Kostenunterdeckung** sowie Krisenkontrolle **4.450 ISK ungedeckte Arbeit** müssen unverändert bleiben.

**Erfolg ist ausdrücklich nicht eine höhere Zahlungssumme:** Nur nachweislich besserer Folgehandel und Versorgung bei weiterhin bezahlbarer Stationsnachfrage, realem Hüllenersatz und ohne zusätzliche Geldquelle wäre ein tragfähiger Ansatz. Werden in den Krisen null reale Frachterverkäufe beobachtet, kann C0 logischerweise keine Mittel zur ersten Fahrt erzeugen. Der nächstfolgende denkbare Schritt wäre eine **explizit finanzierte und rückzahlbare Stations-/Werftbestellung** als anderer, getrennt zu genehmigender Gegenversuch. Keine automatische Übernahme.

## [TEST] Ausgeführte CI und Vergleich

[Erster vollständiger GitHub-Actions-Lauf #41179102326](https://github.com/tobiasfranziskus/Check/actions/runs/41179102326): **19/19 Jobs erfolgreich**, **67/67 Standard-Node-Tests**, keine Fehler/Skips. Beide Varianten mit 13 Seed-Welten ×90 Tagen und vier echten historischen B1-Krisen ×275 Tagen: **34 vollständige Simulationen, 4.540 Tageshashes, 108.960 stündliche unabhängige Geld-/Warenaudits, deterministisch identische Replays und 440 Save/Load-Roundtrips**. Referenzwerte auf Kontrolle: **791 Mangelstunden**, **310.058 NPC-Trader-Verkäufe**, **16.090 ISK ungedeckte NPC-Arbeit**; in den Krisen **4.450 ISK Unterdeckung**. Keine historische Regel-12-Startabweichung. Der Berichtsnachtrag nach dem gemessenen Code-Head ist nur Dokumentation; die anschließende CI muss gesondert geprüft werden.

### Passive Standardwelten (13 × 90 Tage)

| Kennzahl | Original-Regel 14 | C0: Stationshonorar |
| --- | ---: | ---: |
| Mangelstunden | 791 | **733** |
| Abgeschlossene Rezepte | 1.285.074 | **1.290.032** |
| NPC1/2-Frachterverkäufe | 310.058 | **307.856** |
| Wiederkäufe nach Verkauf derselben NPC-Frachter-ID (NPC1–3) | 225.968 | **221.689** |
| Honorare: tatsächliche Stationszahlung an Trader | 0 ISK | **24.893.684 ISK** |
| Tatsächlich angefallene NPC1–3-Arbeit | 46.337.480 ISK | **46.370.039 ISK** |
| Tatsächlich bezahlte NPC1–3-Arbeit | 46.321.390 ISK | **46.354.280 ISK** |
| Ungedeckte Arbeit | 16.090 ISK | **15.759 ISK** |
| Frachter NPC1/2, summierte Endbestände | 65 | **65** |
| Silizium in Aldera, summierte Endbestände | 541 | **523** |
| Bauteile in Aldera, summierte Endbestände | 505 | **399** |

Die Zahlungssumme 24,89 Mio. ISK ist **die Summe vieler einzelner realer Transfers im Zeitverlauf** und darf nicht mit neu geschaffener Geldmenge verwechselt werden. Im Regime C0 ist die Zusatzvergütung bei 62.779 potenziell berechtigten Lieferungen aufgrund der konkreten Liquiditäts-/Gebührenschranke nicht leistbar. Es entstehen **keine** kostenlosen Frachter, Waren oder ISK. Trotz 58 weniger Mangelstunden und 4.958 mehr Rezeptabschlüssen sinken tatsächliche Frachterverkäufe um 2.202, NPC-Folgekäufe um 4.279 und der summierte Endbestand von Bauteilen in Aldera um 106. Die wirtschaftliche Wirkung ist gemischt und der Aufwand hoch; die geringe Reduktion offener Betriebskosten um 331 ISK erklärt keinen vollständigen profitablen Zyklus.

### Vier originale aktive Spielerkrisen (4 × 275 Tage)

| Kennzahl | Kontrolle | C0 |
| --- | ---: | ---: |
| Mangelstunden | 620.550 | 620.550 |
| Rezepte | 24.356 | 24.356 |
| NPC1/2-Frachterverkäufe | **0** | **0** |
| Stationshonorar | **0 ISK** | **0 ISK** |
| Ungedeckte Arbeit | 4.450 ISK | 4.450 ISK |
| NPC1/2-Frachter am Endtag, alle Fälle | **0** | **0** |
| Aldera Silizium/Bauteile | **0/0** | **0/0** |

**[BESTÄTIGT]** Alle vier Krisen laufen unter C0 mit denselben Ergebnissen weiter; es fehlt jede auslösende Lieferung eines NPC-Handelsfrachters. **C0 kann prinzipiell keine erste Hülle, Warenfinanzierung oder Arbeitsminute vorstrecken.**

### [ANALYSE] Urteil und nächste kleine Frage

**C0 nicht integrieren.** Die passive Verbesserung der Mangelstunden rechtfertigt den erheblichen realen Kapitaltransfer bei gleichzeitig leicht sinkender Frachtaktivität, kritisch niedrigeren Aldera-Bauteil-Endbeständen und völlig unveränderten vier Zusammenbruchfällen nicht. Eine Produktfreigabe nur wegen erfolgreicher technischer Tests ist ausgeschlossen.

**[OPTION] B6e:** Einen einmaligen, klar nachverfolgten **beschränkten Transport-Investitionsvertrag** untersuchen, kein pauschales Stationshonorar: Wer ist echter Auftraggeber/Kapitalgeber, welche verfügbare Einzelkasse trägt den Kauf einer **real existierenden** Hülle und die erste Ware, welche Leistung/Schuld entsteht und wer trägt den Piratenverlust? Ohne ausreichend finanzierbare Gesamtkette wird **kein Vertrag** geschlossen. Puffer für Stationsverbrauch, keine Vergütung ohne realen Auftrag, konkrete Tilgungsregel und explizite Save-/Migrationstests sind zwingend. Erst wenn tatsächliche erste und wiederholte Lieferungen bei bezahlten Hüllen, funktionierenden Stationen und vollen Audits nachgewiesen sind, folgt ein Produktentscheid. Die insolvenz- und geldregimebezogenen Fragen sind weiter **nicht beschlossen**.

**[MAIN]** bleibt v0.12.5 / Regel 14 / Schema 8 auf `d454d066`. Keine Änderung an `index.html`, historischen Fixtures, Produkt-Tests, Roadmap, Save-Migrationen, iPad-/NAS-Deployment. Kein Merge.
