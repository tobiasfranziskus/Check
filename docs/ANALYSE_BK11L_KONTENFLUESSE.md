# B-K11l – erste echte Finanzierungsblockaden und Bilanz der verlustbringenden NPC-Fahrten

**[ANALYSE/DRAFT · 03.11.2026]** [PR #150](https://github.com/tobiasfranziskus/Check/pull/150), gestapelt auf #149 → #148 → #147 → #146; **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert. Nur zusätzliche Beobachter und Node-Tests im historisch isolierten R15-/Schema9-Testkern. Kein Produkt-, Preis-, Lohn-, Vertrags-, Geld-, Save- oder Emissionsregelwechsel, kein Merge/Deployment.

## Fragestellung und Versuchsaufbau

[B-K11k #149](https://github.com/tobiasfranziskus/Check/pull/149) belegt: Wenn fünf zuvor isolierte NPC-Frachter in ihren **ursprünglichen Handel** zurückkehren, erzeugen sie echte Produktion und verdienen Aldera-Haushalte erneut Geld, aber Station und Händler werden illiquide. B-K11l fragt: **Wohin gehen die tatsächlich gebuchten ISK, und welche konkrete Original-Core-Reservierung scheitert zuerst?**

Die historisch festgehaltenen Spielstände **nach zwei vollen 24er-Lieferungen und einer echten dritten 14er/17er-Teilzustellung** werden aus `ed0151cdaa03a8a1` (Seed42) bzw. `61c198365462ede4` (Seed7), Tick3960, geladen. Fonds-Mindeststand ist nach der ersten Lieferung deaktiviert. In zwei **unabhängigen 48h-/2.880-Minuten**-Läufen werden lediglich fünf vorhandene NPC-Frachter durch `auftrag='handeln'` reaktiviert. Keine weiteren Spieleraufträge, neue ISK, Güter, Überweisungen oder geänderte wirtschaftliche Regeln.

Die ausschließlich testseitigen Beobachter werden an *wirklich erreichten Core-Buchungen* ausgeführt: Marktware inkl. Gebührenempfänger, Lohnabrechnungen, Hauskonsum, Vertrags-Flugkosten, Miner-Betriebskosten, Fonds-/NPC-Transfers, Abflüge inklusive Nullfracht und abgewiesene Produktions-/Fahrt-Reserven. Für die Konten werden sowohl **freie Kasse** als auch **offene, vom selben Kontoinhaber gesperrte Vertragssalden** verglichen. Ein bloß angenommener Überschuss oder freier Warenverkauf wird nicht als Geschäft verbucht.

## [TEST] Exakte Gegenbuchungen der Problemakteure

Alle Beträge in ISK, jeweils **nur die 48 Stunden nach Tick3960**. Negative Beträge sind real bezahlte Ausgaben.

| Gebuchte Hauptströme | Seed42 NPC1 | Seed42 NPC2 | Seed7 NPC1 | Seed7 NPC2 |
| --- | ---: | ---: | ---: | ---: |
| Original-Core-Warenverkauf | +17.890 | +3.791 | +22.428 | +15.497 |
| Original-Core-Warenankauf | −12.973 | −2.106 | −16.974 | −10.079 |
| **Brutto-Handelsspanne** | **+4.917** | **+1.685** | **+5.454** | **+5.418** |
| Originale Marktgebühren | −753 | −205 | −1.079 | −617 |
| **Bezahlte reale Frachterarbeit** | **−7.099** | **−4.356** | **−7.309** | **−7.736** |
| **Liquiditäts-/Kapitaländerung** | **−2.935** | **−2.876** | **−2.934** | **−2.935** |
| Händlerkasse Start → Ende | 3.000 → **65** | 3.000 → **124** | 3.000 → **66** | 3.000 → **65** |

**Die Ware hat in allen vier Fällen einen positiven unbereinigten Deckungsbeitrag, aber die tatsächlich gebuchten Flugkosten übersteigen die nach Gebühren verfügbare Handelsspanne.** Für diese beiden Händler erklärt der reine Handel mit real finanzierten Flugkosten **100 % des freien Kapitalverlusts**, ohne unbekannten Restposten. Ein neuer NPC-Einkauf mit positivem nominellem Preisunterschied ist also noch keine sich selbst tragende Wirtschaftsleistung.

Auch die Aldera-Station ist kontengenau deckungsschwach:

| Aldera-Station | Seed42 | Seed7 |
| --- | ---: | ---: |
| Originale Warenverkäufe | +4.392 | +7.653 |
| Originale Warenankäufe | −6.703 | −8.880 |
| Tatsächlich bezahlte Produktionslöhne | −1.824 | −2.856 |
| Tatsächlich bezahlte lokale Endkäufe | 0 | +150 |
| **Netto / Anfangs- → Endkasse** | **−4.135 / 4.137→2** | **−3.933 / 3.940→7** |

Das Geld der neuen Aldera-Kaufkraft stammt damit real aus **dem vorhandenen Stationskapital und Warenumsatz** und erzeugt keine zusätzliche kaufkräftige Nachfrage durch Produktion allein. Ein Ertrag eines Händlers ist zugleich Ausgabenseite einer kaufenden Station und keine zusätzliche ISK-Quelle.

## [TEST] Erste nachweisbare Ablehnungsereignisse

**Erster tatsächlich verweigerter Lohn-Escrow in der untersuchten Aldera-/NPC1-/NPC2-Kette:**

- Seed42 **Tick4101**: Aldera, Linie 1 `r_bauteil`, echter Input 2 Material +1 Silizium, tatsächlicher Core-Lohnbedarf **32 ISK**; Stationskasse **6 ISK**, **26 ISK fehlen**. Aldera-Haushalt hält 1.040 ISK, regionaler Fonds 2.237 ISK – beides ist **nicht die verfügbare Stationskasse**.
- Seed7 **Tick4077**: gleicher echter Bauteil-Lohn-Escrow **32 ISK**, Stationskasse **3 ISK**, **29 ISK fehlen**; Aldera-Haushalt 822 ISK, Fonds 1.569 ISK. Keine Rohstoff-/Rezept- oder Preisablehnung.

Anschließend sind auch echte Händler-Finanzierungssperren beobachtbar, von bloß betriebsbedingten Fahrtstart-Ablehnungen getrennt:

- Seed42 NPC2 **Tick4801**: beladener Frachter `sh018` mit **12 Material** in Cyris will nach Meridian, benötigt **125 ISK Fahrtreserve**, Eigentümer hat **25 ISK**. **100 ISK fehlen**; keinerlei kostenlose Fahrt.
- Seed42 NPC1 **Tick5161**: Frachter `sh017` in Meridian, freie Kasse **178 ISK**, Fahrtreserve **125 ISK**, erster Material-/Bauteilkauf hier `bauteil` **103 ISK pro Stück**. Schon nach Flugreserve verbleiben **53 ISK**, die erste Einheit ist im Original-Core-Preflight nicht finanzierbar (ohne Marktgebühr).
- Seed7 NPC1 **Tick5101**: Frachter `sh057` in Veldra, Kasse **127 ISK**, Fahrtreserve **125 ISK**, Material **29 ISK je Einheit**: nach Flugreserve nur **2 ISK** übrig.

**Wichtige Negativkontrolle:** Ein fehlgeschlagener `fahrtStart` bei Tick3979/3981 wird **ausdrücklich nicht** als Liquiditätskrise gewertet: Die vorherige Fahrt ist noch nicht vollständig abgerechnet (`schiff.arbeit > 0` / `schiff.vertrag` offen), obwohl genügend ISK vorhanden sind. Ebenso darf bei noch offenem Vertrag keine bloße zu niedrige Kasse als *isolierter* Finanzierungsgrund etikettiert werden. Bei Seed7 wird deshalb für NPC2 aus der ersten gemischten Ablehnung **kein alleiniger Geldmangel nachgewiesen**.

## [TEST] Beladene vs. leere Fahrtkosten

Aus dem Original-Core-`abflug` wird jede tatsächlich begonnene Route mit neuer Vertrags-ID protokolliert. Die **stundengenau aus Vertragsreserve bezahlten** Fahrtkosten werden derselben ID zugeordnet, einschließlich eventuell am Stichtag laufender Flüge.

| Bezahlt je Frachtertyp | Seed42 NPC1 | Seed42 NPC2 | Seed7 NPC1 | Seed7 NPC2 |
| --- | ---: | ---: | ---: | ---: |
| Gestartete echte Frachterflüge | 52 | 31 | 64 | 59 |
| Davon ohne Warenladung | 1 | 0 | 3 | 7 |
| Kosten beladener Flüge | **6.975 ISK** | **4.356 ISK** | **6.991 ISK** | **6.683 ISK** |
| Kosten leerer Flüge | 124 ISK | 0 ISK | 318 ISK | 1.053 ISK |
| Abgleich zur Gesamtbuchung | **7.099 ISK** | **4.356 ISK** | **7.309 ISK** | **7.736 ISK** |

**Vorherrschende Verlustursache ist in diesen vier Fällen NICHT die zufällige Leerpositionierung, sondern die bezahlte Arbeit auch der beladenen Transporte.** Das erklärt, warum ein bloßes Verbot leerer Flüge diesen Handel nicht tragfähig macht.

**Beleg am unveränderten Core:** `m_core_haendler.bestesPaar` (Bezeichnung des entsprechenden internen Handelsalgorithmus im Original) bewertet `gewinn = menge * (pDort - pHier) - gebuehrQuell - gebuehrZiel`, **ohne die echte Fahrtkostenreserve**. `besterAbsatz` bewertet ebenfalls potenzielle Verkaufserlöse/Marktgebühren, nicht den zusätzlichen Flugaufwand. Der spätere R15-`abflug` verlangt zwar die **reale** Fahrtkostenreserve und rechnet sie wirklich ab, seine Wahlentscheidung wurde aber bereits anhand eines unvollständigen Deckungsbeitrags getroffen. **Positiver Marktgewinn der Route ≠ positiver betrieblicher Gewinn nach Flugkosten.** Dies ist eine begründete Ursache für den beobachteten Geldverlust, noch **keine Freigabe** einer neuen Handelsstrategie.

## [TEST] Regionalfonds – kein verschwundenes Geld

Die Fonds nehmen tatsächlich Gebühren, Fahrkosten, laufende Miner-Betriebskosten und Überschussabgaben entgegen. Beispielsweise Aldera:

| Aldera-Fonds, 48h | Seed42 | Seed7 |
| --- | ---: | ---: |
| Anfang | 655 | 1.015 |
| Empfangene Handelsgebühren | +435 | +641 |
| Empfangene Flugkosten | +2.057 | +1.787 |
| Sonstige reale Schiffs-Betriebskosten | +523 | +737 |
| NPC-Überschussabgaben | +2.094 | +2.864 |
| Ende | **5.764** | **7.044** |

**Alle sieben** unabhängig ausgewiesenen Konten (Aldera/Nadir-Station, NPC1, NPC2, Aldera-Haushalt, Aldera-/Nadir-Fonds) sind nach Einbeziehen der offenen Escrow-Reste mit **0 ISK ungeklärter Abweichung** belegt. Die unabhängige globale Geld-/Warenauditierung und Save-/Load-Hashes bleiben ebenfalls unverändert. **Keine neuen ISK nötig, um diesen Verlust zu erklären.** Die Fonds-Mindeststandsüberweisungen waren testseitig ausgeschaltet; verfügbares Fondskapital ist daher nicht automatisch verfügbares Stations- oder Händlerkapital. Neue globale ISK-Emission oder individuelle Konkursrettung wird durch diese Diagnose nicht begründet.

## Prüfstatus und Grenzen

**[TEST]** Gezielte GitHub-CI der Instrumentierungsstufen [#41664863190](https://github.com/tobiasfranziskus/Check/actions/runs/41664863190) und [#41665044137](https://github.com/tobiasfranziskus/Check/actions/runs/41665044137): **11/11 Node-Tests, 0 fehlgeschlagen**, Seeds42/7 × 48h, echte Geld-/Waren-/Herkunftsaudits, Save/Load und feste historische B-K11j/k-Hashes; hier gezeigte Grunddaten und Fahrkostensummen ausgeführt. Die letzte verschärfte Prüfung mit **0 ungeklärten Kassen-Salden** und genauer Finanzierungsgate-Abgrenzung ist gesondert gegen neueste CI zu prüfen.

Die am Tick3960 reaktivierten NPC-Frachter stammen aus **einer künstlich isolierten Einzelauftragswelt**; kein natürlicher NPC-Handel von Beginn an, kein automatischer Beweis für 13×90d-Langzeitstabilität, Schiffswiederaufbau, Weltgeld-Balancing, produktive R15-/Schema9-Save-Migration oder reale iPad-/NAS-Abnahme.

## Enger nächster Schritt [OPTION, nicht beauftragt]

**B-K11m (getrennter Test-Draft):** Ein rein testseitiges, für *alle* NPC-Frachter gleiches **Vollkosten-Vorflug-Gate** aus bereits vorhandener Preis-/Routen-/Fahrtkosten-/Marktgebührenformel als Gegenarm zur ursprünglichen Route. Keine neuen ISK, Gratis-Hüllen, Fonds-Minima, Preis-/Lohnregeln oder Regelversionen. Neben erzielten Händlererlösen müssen echte Handelsabschlüsse, gelieferte Nahrung/Medizin, Stationskassen, Haushaltskaufkraft, Schiffsverluste, Geldsenken, Save-/Hash-Audits und spätestens erste Betriebsstillstände verglichen werden. Ein vermeintlich positives Händlerergebnis bei zusammengebrochener Versorgung ist **kein** Gesamtwirtschaftserfolg. Erst danach über eine gezielte Produktfreigabe nachdenken.
