# B-K11m – Reale Hinflugkosten in der NPC-Routenwahl: negativer Gegenbeweis

**[ANALYSE/DRAFT · 03.11.2026]** [PR #151](https://github.com/tobiasfranziskus/Check/pull/151) auf #150 → #149 → #148 → #147 → #146 gestapelt. **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert; nur Test und Dokumentation am historisch isolierten R15-/Schema9-Kern. Keine Produkt-/Preis-/Lohn-/Geld-/Save-Regeländerung, keine neue ISK-Emission, keine Integrationsfreigabe.

## Kausalfrage und Methoden

B-K11l hat den tatsächlichen 48h-Verlust der Händler NPC1/2 kontengenau erklärt. `m_core_entscheidung.bestesPaar` bewertet Routen nach Preisdifferenz minus Marktgebühren, ohne die realen Kosten des Transports im erwarteten Gewinn zu berücksichtigen. Die **Original-Vertragsabrechnung selbst war bereits vollständig finanziert**; hier wird ausschließlich testseitig ein anderes **Routenwahl-Kriterium** eingeführt, nicht dessen Preis oder Zahlungsregel.

Kontrolle und Gegenarm starten **für Seed42/7 jeweils aus demselben Save** nach zwei voll bezahlten und einer echten dritten Teil-Lieferung aus B-K11j (Tick3960, Hash `ed0151cdaa03a8a1`/`61c198365462ede4`). In beiden Armen werden exakt fünf zuvor im Versuch angehaltene NPC-Frachter wieder auf den Original-Auftrag `handeln` gesetzt; alle übrigen Welt-/Kosten-/Risiko- und Haushaltsregeln bleiben identisch.

**[KONTROLLE]** Historische Originalwahl: `Brutto=menge × (Zielpreis−Quellpreis)−Quellgebühr−Zielgebühr`. **[TESTGEGENARM]** `Netto=Brutto−ceil(originale Routenzeit × Betriebskosten.frachter/Stundenlänge)`; nur Kandidaten mit `Netto > 0` antreten lassen und nach `Netto` statt `Brutto` rangieren. Das sind **allein die direkten Flugkosten der Hinroute**, keine bekannte Absatzgarantie, keine Berechnung einer Rückfahrt, keine Ersatz-/Personal-/Inventarvollkosten, keine neue Produktmechanik.

## [TEST] Ergebnis: Nach 48h keine Stabilisierung

| Gemessene Größe | Seed42 Original | Seed42 Hinflugkosten | Seed7 Original | Seed7 Hinflugkosten |
| --- | ---: | ---: | ---: | ---: |
| Endkasse NPC1 | 65 ISK | **19 ISK** | 66 ISK | **27 ISK** |
| Endkasse NPC2 | 124 ISK | **0 ISK** | 65 ISK | **31 ISK** |
| NPC-Frachter-Flüge | 83 | 93 | 123 | 106 |
| Echte Frachter-Käufe / Verkäufe | 39 / 71 | 33 / 58 | 89 / 117 | 39 / 62 |
| Real verkaufte Frachter-Wareneinheiten | 682 | 874 | 1.143 | 963 |
| Aldera-Station Endkasse | 2 ISK | 31 ISK | 7 ISK | 17 ISK |
| Aldera-Haushalt Endkasse | 1.864 ISK | 2.578 ISK | 2.744 ISK | 2.510 ISK |
| Aldera: tatsächlich bezahlte neue Nahrung | 0 | 5 | 3 | 0 |
| Aldera: Nahrungsmangelstunden / 48 | 48 | 47 | 45 | 48 |
| Reale NPC1/NPC2-Frachter am Ende | 4 | 4 | 4 | **3** |
| Gesamtes echtes bezahltes neues Nahrungsessen (alle Stationen) | 215 | 279 | 223 | 226 |
| Geprüfte Routenkandidaten, Hinflugarm | – | 4.991 | – | 8.175 |
| Davon Bruttomarge > 0, Netto <= 0 | – | 3.693 | – | 6.026 |
| Reale Weltgeldmenge inkl. Escrow | 50.000 ISK | 50.000 ISK | 50.000 ISK | 50.000 ISK |
| gepinnter Endhash | `0d47d35f43f1bac6` | `cc09fa2aaf02143c` | `e18524faeb778a7c` | `fc8706bb4b1c1628` |

**Interpretation:** Der Gegenarm verwirft zwar viele schon vor Antritt unprofitable Routen, aber die verfügbaren Händlerkassen bleiben knapp oder werden **schlechter**. Mehr an einer einzelnen Station bezahlte Nahrung (Seed42) widerlegt nicht den weiter vorhandenen Mangel; in Seed7 ist die Versorgung Alderas sogar schwächer. Dabei existieren laufende, noch gebundene Flugreserven und andere Stations-/Konzernkosten: Ein erfolgreicher Teilindikator ist keine wirtschaftliche Gesamtstabilität.

**[TEST/CHECK]** Gezielter [B-K11m-CI-Lauf #41666760854](https://github.com/tobiasfranziskus/Check/actions/runs/41666760854) hat **12/12 Node-Tests bestanden** (0 Fehler), Seed42/7 × beide 48h-Arme, stündliche unabhängige Geld-/Warenaudits, Herkunft, Save/Load, unveränderte Original-Hash-Referenzen. Standard-CI wird auf finalem Head gesondert geprüft. **Keine 13×90-Tage-Wirtschaftswelten**, keine reale iPad-/NAS-Abnahme, keine Produkt- oder Geldmodellentscheidung.

## Warum ein isoliertes Gewinn-Gate unzureichend ist

Vor einer konkreten Produktkorrektur müssen neben hinreichend positiver *voraussichtlicher* Handelsmarge auch die **tatsächlich finanzierbaren Warenkäufe, Routen-/Folgefahrtkosten, Zielstationskasse, Laden-/Entladen, Gesamtflottenbetrieb, Haushaltseinkommen und Systemfonds** zusammen geprüft werden. Insbesondere können weitere Marktbewegungen nach ursprünglich berechtigter Abfahrt die Verkaufsrealität ändern. Die bisherigen Geschäfts-/Flugkonten dürfen nicht vom Test umgeschrieben werden.

**Zweiter Schritt [OPTION, B-K11n]:** Auf denselben A/B-Starts das Beobachtungsfenster gezielt verlängern und für **alle sechs Verbrauchsstationen** kumulierte Mangelstunden, echte bezahlte Nahrung, Produktion, NPC-Frachter-Bestand, Liquidität und Geld-/Waren-/Save-Gates auswerten. Wenn das Netto-Gate nur Händleraufschub oder weniger Versorgung produziert, als negativer Gegenbeweis dokumentieren.
