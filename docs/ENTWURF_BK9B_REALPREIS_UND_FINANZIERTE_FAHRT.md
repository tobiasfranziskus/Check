# B-K9b – Marktpreisgerechte Finanzierung, wirkliche Lieferung und Reserveabgrenzung

**01.11.2026 · [PRODUKT/DRAFT + KONTROLLIERTE ANALYSE] [PR #94](https://github.com/tobiasfranziskus/Check/pull/94), gestapelt auf [PR #93](https://github.com/tobiasfranziskus/Check/pull/93), NICHT integriert.**

**[MAIN]** bleibt `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5 / Regel14 / Schema8. Keine neue Emission, kein Mergen, kein neuer Save-Zustand im aktiven Spiel.

## 1. Korrektur: reservierte Arbeit ist nicht angefallene Arbeit

B-K9a hat für Cyris→Aldera 25 Minuten realen Flug in der Vertragsprüfung **250 ISK volle Stundenreserve** gebunden und diese fälschlich auch als vollständige *Kosten* der Reise von der Marge abgezogen. Ein vollständiger Lohnvorschuss von 250 ISK ist als Finanzierungssicherheit sinnvoll. Der Original-Core bucht jedoch nur die tatsächlich im jeweiligen Tick gearbeiteten Minuten. Bei 25 prognostizierten Minuten sind dies **104 ISK**, im konkret mit einem außerhalb des Schritts gestarteten Schiff **24 erfasste Flugminuten = 100 ISK**. **Nicht beanspruchte 150 ISK sind zurückzugeben**, dürfen nicht als faktischer Verlust in der Preisformel erscheinen. Abweichung von 104 zu 100 stammt aus der Original-Tick-Reihenfolge (`ankunft` vor `reise`), nicht aus einem manuellen Lohnrabatt.

**B-K9b korrigiert das in `index.html` (nur Draft):**
- `kosten.frachterlohn` bleibt die zwingende **volle Vorausreserve** für die gesamte angefangene Stunde.
- `kosten.frachterlohnFaellig` dokumentiert die konservativ erwartete **tatsächliche Minuten-Forderung**.
- Nur der erwartete verbrauchte Betrag geht in die Frachtermarge und den kostendeckenden Endpreis ein; die **gebundene Kassenprüfung bleibt unvermindert**.
- Neues, read-only `m_core_index.nahrungsmarktangebot` setzt den Endpreis *ausschließlich* auf den **echten aktuellen Original-Spotpreis der Zielstation**, also keine erfundene Zahlungsbereitschaft. Anders als die weiterhin für private Festpreisangebote verfügbare Funktion `nahrungsangebot` kann es eine überhöhte Wunschvergütung nicht automatisch als Marktnachfrage zählen. **Keines der beiden Angebote bucht ISK, bestellt Ware oder ändert den Zustand.**

Für die B-K9a-Musterrechnung mit drei Nahrung ändert sich die prognostizierte Frachtermarge bei 30 ISK/Stück von **−304 auf −158 ISK** und die kostendeckende Schwelle unter den gleichen weiteren Annahmen von **136 auf 85 ISK/Stück**. Diese Korrektur widerlegt nicht die frühere Diagnose `unter Spot unprofitabel`, wohl aber die damalige **Kostenhöhe**. Alle historischen Aussagen zu 136 ISK sind als **überhöhte Schätzung wegen Doppelzählung der Lohnreserve** zu behandeln. Der reale erforderliche Preis für ein einzelnes Geschäft hängt stark von der Sendungsmenge ab.

## 2. Beobachtete, nicht erfundene Marktfenster

Der Test `tests/bk9b-marktfenster.test.mjs` hat **vier echte Original-Rule14-Spielerwelten bis Tag14** (Seed7/42 × aktiver/passiver Spielerminer) gerechnet. An den Spieltagen **0,1,2,3,4,5,6,7,10,14** wurde pro Welt eine sichere Nahrungsroute Cyris→Aldera oder Cyris→Veldra für jeweils die Mengen **1–25** gegen die *aktuell gespeicherten* Original-Stationsbestände, Kurse und echten Owner-Kassen geprüft; insgesamt **2.000 Marktangebote**.

**Wesentliche Eingrenzung:** Für diese reine Machbarkeits-Obergrenze werden die bereits existierenden bzw. nach Hüllenverlust durch Test-Schiffsvorlagen hypothetisch verfügbaren NPC1-/NPC3-Schiffe in einer Kopie ideal in Cyris positioniert. **Das ist kein Beweis, dass die reale KI am Marktzeitpunkt den richtigen Frachter und Miner vor Ort hat**. Es werden keine ISK oder Waren im tatsächlichen Originalweltlauf erzeugt. Die Scan-Ergebnisse sind günstige Momentaufnahmen und keine 2.000 echten Vertragsabschlüsse.

| Vergleich | Marktangebote insgesamt | Mit positiver Frachtermarge | Alle Kapital-/Lager-/Kosten-Gates erfüllt |
| --- | ---: | ---: | ---: |
| Seed 7, passiver Spieler | 500 | 0 | **0** |
| Seed 7, aktiver Erzminer | 500 | 5 | **5** |
| Seed 42, passiver Spieler | 500 | 0 | **0** |
| Seed 42, aktiver Erzminer | 500 | 10 | **5** |

**[POSITIVER ECHTPREIS-FUND]** Seed7, Tag4, Liefermenge 13 Nahrung Cyris→Aldera: tatsächlicher Zielspot **53 ISK/Stück**, Käufercash **2.363 ISK**, Brutto-Auftragswert **689 ISK**, Marge der Frachterseite **+73 ISK** nach den prognostizierten 104 ISK Fluglohn und angenommenen 39 ISK Hüllenersatzrücklage, mit ausreichend realen Kassen aller Beteiligten. Auf derselben Momentaufnahme sind auch 9–12 Nahrung wirtschaftlich finanzierbar. In Seed42, Tag6, erzielt eine modellierte 16er-Sendung bei Zielspot 54 ISK **+122 ISK** Frachtermarge, aber ihr Käufer hat **nicht genügend Bargeld**; deshalb ist sie **nicht vollständig ausführbar**. Fünf kleinere Mengen erfüllen in diesem Seed alle Gates.

**Keine universelle Rentabilität:** Im passiven Kontrollfall gibt es unter derzeitigem kleinen Nachfrage-/Lager-/Routenmodell kein rentables Nahrungsangebot in den abgefragten Tagesständen. Das spricht gegen eine pauschale Pflichttransportregel. Preis- und Mengenfenster sind **selten** und verlangen eine tatsächlich verfügbare Flotte, zureichende Stationskassen und zuverlässige Produktionsversorgung.

## 3. B-K9b: Eine tatsächlich geflogene und bezahlte Warenlieferung

**[TEST]** `tests/bk9b-finanzierte-spotfahrt.test.mjs` führt einen kontrollierten, aber tatsächlichen **Original-Core-Handelskauf, validierten Original-`shipMove`-Befehl, Original-Ankunftsverkauf und Original-`betriebskosten`-Lohnbuchung** für das Seed7-/Tag4-Marktfenster aus. Die zum Zustand gehörende Frachterhülle wird **nur in der Testwelt** nach Cyris positioniert und andere Flüge für diesen Nachweis geparkt; dies **ist noch keine autonome tatsächliche KI-Auftragsakquise**. Für den Vertrag wird im Test eine bereits vorhandene 13er-Lagerfracht gekauft, **nicht die nachgewiesene Erzeugung einer brandneuen Nahrungscharge**.

**Atomaritätsgrenze:** Die drei Zahlungssperren sind **nur separat verbuchte Testkonten** und werden unmittelbar vor dem Original-Ankunftsverkauf bzw. Original-Stundenlohn freigegeben. Das belegt eine **vollständig bezahlbare Original-Buchungskette**, **keinen produktionsreifen, atomaren, speicherbaren Vertragskern**. Für diesen wird B9i/B9j benötigt.

| Tatsächlich durchgeführte Testbuchung | Ergebnis |
| --- | ---: |
| Original-Nahrungs-Quellkauf | 13 Stück |
| Im Voraus aus echten Aldera-ISK gesperrte Käuferzahlung | **689 ISK** |
| Original-`shipMove` Cyris→Aldera | 25-Minuten-Route, **24 bezahlbare Flug-Arbeitsminuten** im genau getesteten Tickpfad |
| Original-Ankunftsverkauf | 13 Nahrung, keine doppelte Fracht |
| Tatsächlich gebuchter/aus Originalkassen bezahlter Fluglohn | **100 ISK** |
| Vorab gebundene Flug-Arbeitsreserve | **250 ISK** |
| Einmalig erstattete, nicht verbrauchte Lohnreserve | **150 ISK** |
| Weiterhin separiert vorhandene Schiffsrücklage | **39 ISK** |
| Neu erzeugte ISK | **0** |
| Original-Core-Waren-/Geld-Audit und Save-Hash-Kopie | bestanden |
| Neue Nahrungsproduktion aus dem Auftrag selbst | **nicht belegt** |

Die tatsächliche Forderung von 100 statt der konservativen 104-ISK-Prognose erhöht die aus der Buchung ableitbare Fahrtmarge **um 4 ISK**, ist aber kein Beweis für NPC-Flottenersatz über viele Reisen. Die ungenutzte Finanzierungsreserve wurde korrekt erstattet, ohne neue ISK zu erzeugen.

**[TEST-CI]** [Workflow #41335914104](https://github.com/tobiasfranziskus/Check/actions/runs/41335914104), Node-Job **87/87 erfolgreich** nach bereinigten Fixture-/Tick-Tests (67 unveränderte + 20 Draft-Tests). Historische v10–v14-Wirtschaftsreferenzen bitte separat am Gesamtworkflow-Status prüfen.

## 4. Produktentscheidung: Erster realer Vertrag, aber noch nicht integrierbar

**[POSITIV]** Der erste **echte** profitorientierte Käufer→Händler-Spotauftrag mit vorher bezahltem Einkauf, Flug, Lieferung und Lohn sowie erhöhter Schiffsrücklage ist in einem kontrollierten Regel14-Test durchführbar. Die notwendige Differenzierung zwischen **Reserve** und **realen Kosten** korrigiert eine maßgebliche wirtschaftliche Fehleinschätzung aus B-K9a.

**[NICHT INTEGRIERBAR]** Die bisherige Produktfunktion kalkuliert nur. Der getestete Buchungspfad ist bislang instrumentiert, nicht an die globale KI/echte Save-Migration/atomare Transaktion im Spiel angeschlossen. Realistischen Fabriklohn, neue Warenherkunft, selbstfinanzierte Produktionsnachfrage und Ersatzkapital der gesamten Flotte einschließlich Sicherheit hat B-K9b noch nicht gelöst.

**[OPTION B-K9c, nächste kleine technische Scheibe]** Auf Grundlage der belastbaren B9i-/B9j-Adapter mit einem **strikt gespeicherten zentralen Treuhandbuch** (Schema9/Regel15 nur nach separat getesteter Migration) als ersten echten Kernauftrag die Markt-Spot-Gates von B-K9b und das vollständige 250-ISK-Lohnbudget verbinden. Erst **eine** reale Fahrt aktivieren, Rückzahlung/Verlust/Save-/Load deterministisch testen und keine Nachfrage fälschen. Danach Minervertrag/Fabrikfinanzierung und Erstproduktion in denselben Buchungskern einhängen. Keine automatische Emission, keine Gratisarbeit und kein Spieler-Sparlimit. Vor Main-Merge ausdrückliche Nutzerfreigabe.
