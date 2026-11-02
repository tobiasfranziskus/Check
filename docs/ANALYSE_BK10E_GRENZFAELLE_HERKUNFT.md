# B-K10e – Grenzfälle der Herkunftsbilanz (R15-/Schema9-Draft)

**[ANALYSE/DRAFT · 02.11.2026]** [PR #122](https://github.com/tobiasfranziskus/Check/pull/122) auf #121 → #108. `main` weiterhin `b4e604d6`, produktiv v0.12.5/Regel14/Schema8, keine Integration und kein Deployment. Ausgangsbasis B-K10d: [CI #41449625448](https://github.com/tobiasfranziskus/Check/actions/runs/41449625448), 145/145 Node-Tests erfolgreich, realer Einzeltransport inkl. lokal bezahltem Endverbrauch.

## Exakter Auftrag und Status

B-K10e ist ein **eigenständiger test-only Grenzfall-Prüfschritt** für die auf #121 eingeführte bedingt aktivierte, gespeicherte mengenbezogene Herkunft `transport-neu-v2`. Die Tests verändern weder Produktionscore noch Preissatz, Löhne, Emissionen, Saveformat, UI oder Spielerwirtschaft. Änderungen am `index.html` sind hier nur nötig, falls eine tatsächlich reproduzierte Ursache anders nicht zu beseitigen ist; andernfalls bleiben sie ausgeschlossen.

Der unter [`tests/bk10e-grenzfaelle-neunahrung.test.mjs`](../tests/bk10e-grenzfaelle-neunahrung.test.mjs) verankerte Nachweis hat fünf Prüfgruppen (Seed42 und Seed7):

1. **Mischladung:** Echte neue Nahrung wird in Cyris produziert und aus einem Markt mit belegtem Altbestand wirklich gekauft. Bei einem Kauf von `Alt + 3` müssen exakt drei Einheiten neu sein. Wiederholte echte `shipTrade`-Teilverkäufe geben erst Altware, dann Neuware ab. Eine erneute Altware-Aufnahme darf die Neuware an Bord nicht umlabeln. Nach vollständiger Entladung muss `transit=0` sein.
2. **Beute und Restverlust:** Ein Frachter besitzt drei tatsächlich gekaufte neue Nahrungseinheiten. Die echte Core-Routine `zerstoeren` wird als **explizit erzwungener Kampfausgang** aufgerufen; ein aus vorhandener Marktkasse finanzierter Piratenmarkt übernimmt zwei Einheiten, die dritte wird nachweislich vernichtet. Der Markt wird für diese isolierte Probe auf genau zwei freie Lagerplätze gestellt, und seine Altbestandsänderung wird im ursprünglichen `ledger.initial` gegengebucht. Damit ist weder Piraten-Angriffsfrequenz noch politisches Geografiemodell getestet.
3. **Außenhandelsexport:** Ein kontrolliertes Marktziel von 4 statt 100 Einheiten schafft die benötigte enge Kapazität von 5 Einheiten. Ein echter Frachter liefert fünf neue Einheiten an den Meridiankaufmarkt, und die tatsächliche Originalroutine `aussenhandel` führt bei Überbestand exakt eine aus. Die Herkunft dieser Einheit muss endgültig als `ausgelagert` landen. Die **Marktzieländerung ist ausdrücklich nur eine Testwelt** und keine Preis-/Produktreform.
4. **Außenhandelsimport:** Ein leerer Meridian-Markt importiert aus der originalen neutralen Außenhandelsroutine 10 Einheiten, die als **unbewiesene Altware** gelten. Keine neue Herkunftsmenge darf dabei entstehen.
5. **Zwei Lieferzyklen:** Ein bereits existierender NPC-Frachter kauft jeweils eine neu produzierte Einheit, bezahlt die Original-Flugkosten aus gebundener Reserve und liefert zweimal nach Orion. Der Haushalt muss mindestens diese zwei belegten Einheiten aus zuvor verdienten ISK bezahlen. Der Original-Altstartbestand Orions wird dafür mit korrekter `ledger.initial`-Gegenbuchung entfernt, damit keine kostenlose Altware die beiden echten Lieferungen verdeckt. Ein zurückgekehrter Frachter darf erst dann erneut starten, wenn sein voriger Fahrtvertrag im realen Stundenabschluss beendet wurde. Kein konstruierter Waren- oder Geldtransfer zwischen den Stationen.

Stündlich beziehungsweise nach jedem Befehlsabschluss müssen zwei unabhängige Invarianten zusammen mit dem Core-Audit stimmen:

```
freie_isk + vertraglich_reservierte_isk = initialSupply + minted - burned
sum(stationen_neu) + sum(frachter_neu) + ausgelagert + konsumiert = produziert
sum(frachter_neu) = transit
```

Zusätzlich Original-Core-Warenaudit, Save/Load-Roundtrip, deterministische Hashes. Kontrollierte Anfangslageränderungen korrigieren das `ledger.initial` symmetrisch; sie **sind nicht als Wirtschaftserträge** zu interpretieren. Die Tests sind keine 13×90-Tage-Gesamtwelt und ersetzen keine unabhängige reale iPad-/NAS-Abnahme.

## Wirtschaftliche Aussage und Grenzen

B-K10d hat die Unterbrechung der bezahlten Neuware-Herkunft reparierbar gemacht, aber **keine profitable Transportwirtschaft** geschaffen: 46 ISK Einkauf + 178 ISK nachweislich bezahlte Frachterflugkosten, 56 ISK Zielerlös ergeben −168 ISK vor Handelsgebühren und anteiligen Hüllenkosten. B-K10e prüft vor einer Wirtschaftssimulation bewusst zuerst, ob jede relevante Art der **Warenherkunftsbuchung** korrekt bleibt.

Selbst bei vollständig grünen Herkunftstests wäre die wirtschaftliche Entscheidung offen. Die nächste belastbare Freigabegrenze ist die Wiederholung über reale autonome Händler und Haushalte in mehreren Seeds mit Kaufpreisen, Absatzmengen, Netto-Fahrtkosten, Betriebskapital, Schiffersatz, unabhängigen Geld-/Warenaudits und nachweislichem bezahltem Endverbrauch.

## CI-Ergebnis und reale Belege

**[TEST BESTANDEN]** Der korrigierte Test-Code-Commit [`ac658f4`](https://github.com/tobiasfranziskus/Check/commit/ac658f43fcb6d5e819b1126d9ffdd77d6c99dba5) hat die vollständige [GitHub Actions CI #41451935192](https://github.com/tobiasfranziskus/Check/actions/runs/41451935192) erfolgreich bestanden: **Node.js 22: 150/150 Tests, 0 Fehler, 0 übersprungen**. Historische v10–v14-/Geografie-Prüfjobs erfolgreich; nur der separate Sicherheitsgeografievergleich war planmäßig **übersprungen**, nicht bestanden. Die nachfolgenden Änderungen sind reine Dokumentation; der Code-Head wurde nach dieser CI nicht geändert.

**[TEST] Gemischte und wiederholte Warenbuchungen, je Seed42/7:** In echter Nahrungskauftransaktion waren **32 Einheiten Altware und 3 Einheiten Neuware** enthalten. Die ersten beiden Teilverkäufe über **31 und 2 Einheiten** sowie erneuter Altzukauf und zwei weitere Teilverkäufe über **2 und 1 Einheiten** blieben lückenlos mit der Neuware-Invariante und gespeicherten Hashes vereinbar; Transit am Ende **0**.

**[TEST] Piratenbeute, je Seed42/7:** Ursprünglich drei gekaufte neue Einheiten. Der original implementierte `zerstoeren`-Verlustpfad wurde bewusst *ohne zufälligen Piratenkampf* ausgelöst; Meridian übernahm **2 Einheiten**, wofür es aus seinem vorhandenen Marktkonto **64 ISK** an die Piraten zahlte (Marktpreis **32 ISK**). Die verbleibende **1 Einheit** wurde tatsächlich vernichtet und im Verbrauchs-/Herkunftsaudit als Verlust erfasst. Weder zusätzliche ISK noch Gratiswaren. Das ist **kein Test der Eintrittswahrscheinlichkeit oder Kampffairness**.

**[TEST] Außenhandel, je Seed42/7:** In der ausdrücklich testweise auf `ziel.nahrung=4` begrenzten Marktvariante wurden von fünf real angelieferten Neu-Einheiten **eine** über den Original-Außenhandel ausgeführt und **vier** blieben in Meridian. Der getrennt getestete neutrale Originalimport erzeugte **10 unmarkierte Altware-Einheiten**, kein frei erfundenes Neuwareetikett. Externe Warenimport-/Exportbeträge wurden im Core-Warenledger erfasst, **ohne** ISK-Emissionsregel.

**[TEST] Zwei reale Lieferungen, je Seed42/7:** Derselbe NPC1-Frachter startete zweimal mit wirklich gekaufter neuer Nahrung aus Cyris. Der Original-Core reservierte seine Hin-/Rück-/Hinflugkosten, zahlte die angefallenen Vertragsstunden wirklich und entlud beide Einheiten in Orion. Die bezahlte Haushaltsmenge war **2 Einheiten / 112 ISK**; der NPC1-Händler hatte am Prüfschluss **2.494 ISK frei**. Das ist **kein Gewinn- oder 90-Tage-Überlebensnachweis** und keine Aussage über alle NPC-Flotten. Orions ursprünglicher Nahrungsaltbestand wurde für diesen isolierten Konsumvergleich mittels Warenledger-Korrektur entfernt, um beide Endverkäufe sichtbar zu halten.

**Testrevision transparent:** Die erste [CI #41451588549](https://github.com/tobiasfranziskus/Check/actions/runs/41451588549) auf dem ersten Test-Head `3155f5d` war **rot: 149/150 Node-Tests**, nur der Zweifahrten-Test scheiterte an einer ungeeigneten Versuchsvoraussetzung (Orion verzehrte vorhandene Altware statt Neuware). Anschließend wurden **nur die Testbedingungen** korrigiert: Altbestand mit `ledger.initial`-Gegenbuchung entfernt sowie Rückflugvertrag vor erneutem Abflug korrekt auslaufen lassen. Das finale CI ist vollständig grün, keine bestehenden Referenzwerte verändert.

## Gesamtbewertung und nächstes Gate

**[POSITIV]** Die mengenmäßige Nahrungstransit-Herkunft bleibt auch nach vielen partiellen Kern-Transaktionen, Verlusten, Beute, neutraler Ausfuhr und Wiederbelieferung bilanzerhaltend. **[NICHT GEZEIGT]** Das ist weiterhin keine echte individuelle Charge mit Eis-Einstand, Fabriklohn, Einkaufskurs, Transportkosten, Hüllenanteil und Absatzrendite. Auch die natürliche automatische Piratenkampfrate, längerfristige Stationskaufkraft, vollständige Versorgung und NPC-Schiffersatz sind mit den B-K10e-Sonderwelten nicht geprüft.

**[OPTION B-K10f]** Jetzt die konkret untersuchte negative 1-Stück-Frachtbilanz als **Mengeneffekt** prüfen: Markttiefe, Warenkaufbudget, Stationskaufkraft, echte gemischte Frachtmenge, vertraglich vorfinanzierte Hin-/Rückflüge, zusätzliche Gebühren und anschließende tatsächlich bezahlte neue Endverbrauchseinheiten. Ohne Preis-/Lohn-/Emissionsänderung eine streng vollständige **einheitliche Erlös-/Vollkosten-Kette** für mehrere Mengen und zwei unterschiedliche Seeds berechnen; bei negativer Deckung Ursache belegen, keine pauschale Sanierung behaupten. Danach 13 Seeds × 14 und gegebenenfalls 90 Tage mit autonomen Händlern. Nichts integrieren oder deployen ohne ausdrückliche Freigabe.

**Kontrollrevision des Testaufbaus:** Nach dem ersten Start-Commit `3155f5d` wurde nur die Zweifahrten-Testvoraussetzung korrigiert: entfernte Anfangs-Altware Orions und Original-Core-Vertragsabschluss vor erneutem Abflug. [Code-Commit `ac658f4`](https://github.com/tobiasfranziskus/Check/commit/ac658f43fcb6d5e819b1126d9ffdd77d6c99dba5). Das sind keine Änderungen am Produktcode; die jeweils tatsächlich gelaufenen CI-Ergebnisse sind getrennt zu bewerten.
