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

**CI-Status:** [GitHub Actions #41451588549](https://github.com/tobiasfranziskus/Check/actions/runs/41451588549) auf Test-Head `3155f5d` wurde gestartet; die konkrete Auswertung folgt nach Ende. Bis zu einem vollständig erfolgreichen Workflow **kein bestanden**.

**Kontrollrevision des Testaufbaus:** Nach dem ersten Start-Commit `3155f5d` wurde nur die Zweifahrten-Testvoraussetzung korrigiert: entfernte Anfangs-Altware Orions und Original-Core-Vertragsabschluss vor erneutem Abflug. [Code-Commit `ac658f4`](https://github.com/tobiasfranziskus/Check/commit/ac658f43fcb6d5e819b1126d9ffdd77d6c99dba5). Das sind keine Änderungen am Produktcode; die jeweils tatsächlich gelaufenen CI-Ergebnisse sind getrennt zu bewerten.
