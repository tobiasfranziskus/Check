# B6d-C0 – Reales Stationshonorar nach Lieferung

**31. Oktober 2026 · [ANALYSE/DRAFT], vor abschließender CI.**

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

**[MAIN]** bleibt v0.12.5 / Regel 14 / Schema 8 auf `d454d066`. Keine Änderung an `index.html`, historischen Fixtures, Produkt-Tests, Roadmap, Save-Migrationen, iPad-/NAS-Deployment. Kein Merge. **CI bei PR-Eröffnung ausstehend.**
