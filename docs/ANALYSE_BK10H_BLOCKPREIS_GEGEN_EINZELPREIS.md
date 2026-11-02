# B-K10h – vor-der-Transaktion-Blockpreis gegen echten Einzelstückpreis

**[ANALYSE/DRAFT · 02.11.2026]** [PR #125](https://github.com/tobiasfranziskus/Check/pull/125), unabhängig neben B-K10g #124 auf #123 → #108; `main b4e604d6`, v0.12.5/Regel14/Schema8 **unverändert**. Ausschließlich eigenes Testfile und dieser Bericht, keine neuen Produkt-, Preis-, Lohn-, Save-, Emissions- oder UI-Regeln. Kein Merge/Deployment.

## Exakte Hypothese aus dem bestehenden Original-Core

`m_core_handel.handel()` bestimmt vor jedem Auftrag genau einmal `p = preis(...)` und `wert = menge * p`. Die Preisfunktion hängt vom **aktuellen Lagerbestand** ab. Ein Blockauftrag `menge=24` bezahlt daher für alle 24 Einheiten den ursprünglichen Preis. Wird dieselbe Menge durch **24 originale** `handel(..., menge=1)`-Aufrufe abgewickelt, reagiert die gleiche unveränderte Formel bei jeder Teiltransaktion auf den neuen Lagerbestand. Beide Methoden sind im Kern heute technisch möglich; ein automatischer produktiver Einzelstückmodus ist damit **nicht** beschlossen.

In den ausschließlich analytischen Testwelten wird nur die automatische Core-Ankunftsentladung durch einen exakt begrenzten Testhook ausgesetzt. Dann werden bei **physisch wirklich angekommenem Schiff** entweder `1×24` oder `24×1` echte `m_core_handel.handel()`-Buchungen ohne Zeitfortschritt zwischen den Einzelbuchungen ausgeführt. Einkauf ebenfalls `1×24` bzw. `24×1`, jeweils beim bestehenden Original-Frachter in Cyris. **Beide Varianten** haben reale Original-`shipMove`-Hin-/Rückflüge mit Vertragsbindung und ausgezahlter Arbeit, Originalmärkte, Originalgebühren und einen echten nachgelagerten Haushaltskonsum; keine synthetischen Geld-/Warenbelege. Zur Provenienz-Isolation werden ausschließlich die ursprünglichen Quell-/Ziel-Nahrungsbestände einmalig mit symmetrischer `ledger.initial`-Korrektur entfernt. Beide Varianten durchlaufen dieselben ursprünglichen Waren-, Geld-, Provenienz-, Save/Load- und Hashaudits.

## [TEST BESTANDEN] Tatsächlich ausgeführter Vergleich

[CI #41456497535](https://github.com/tobiasfranziskus/Check/actions/runs/41456497535) auf Testcode-Commit [`83f86ed`](https://github.com/tobiasfranziskus/Check/commit/83f86edb1fc85240f94eb67f2c4ba74283be6c41) **vollständig erfolgreich**: **154/154 Node-Tests, 0 Fehler, 0 übersprungen**, historische v10–v14-/Geografie-Referenzen erfolgreich, ein separater Sicherheitsgeografievergleich planmäßig übersprungen. Zusätzlicher Seed42-Determinismus-Replay erfolgreich. Die beiden Seeds **42 und 7** haben je dieselben folgenden Werte.

| Echtes Geld/Ware, zwei Varianten | 1×24 Block | 24×1 Einzelbuchung |
|---|---:|---:|
| Preis Cyris vor/nach Warenentnahme | 34 → 46 ISK/Stk | 34 → 46 ISK/Stk |
| Original-Cyris-Warenkauf | 816 ISK | **958 ISK** |
| Quelle-Handelsgebühren | 32 ISK | 24 ISK |
| Preis Orion vor/nach Warenanlieferung | 57 → 37 ISK/Stk | 57 → 37 ISK/Stk |
| Original-Orion-Warenverkauf | 1.368 ISK | **1.128 ISK** |
| Ziel-Handelsgebühren | 54 ISK | 33 ISK |
| Wirklich gezahlter Hin- und Rückflug | 357 ISK | 357 ISK |
| **Händler-Cashflow vor Hülle/Risiko** | **+109 ISK** | **−244 ISK** |
| **Differenz zugunsten Blockpreis** | | **353 ISK** |

**Kontrollrechnung:** Die tatsächliche Quelle ist bei der schrittweisen Entnahme um **142 ISK teurer**. Der tatsächliche Zielverkauf bringt durch schrittweise Einlagerung **240 ISK weniger**. Die Einzelaufträge sparen **29 ISK Gebühren**. Zusammen ist die Blockvariante `142+240−29=353 ISK` vorteilhafter; genau das erklärt die Nettoabweichung `+109−(−244)=353 ISK`. Die gesamten Märkte bleiben unmittelbar nach beiden Verkäufen in denselben Lager-/Spotpreiszuständen, aber die realen Kassen weichen ab. Der kontrollierte Test zeigt eine **Preisstärke der Auftragsaggregation**, nicht unterschiedliche Produktions-, Transport- oder Verbraucherleistungen.

**[ERSTER TESTFEHLER OFFEN GELEGT]** [CI #41456054618](https://github.com/tobiasfranziskus/Check/actions/runs/41456054618) war **rot: 152/153**: ein nicht eindeutiger Textanker wurde irrtümlich für die Ankunftsentladung gehalten (der Core ruft `entladen` auch bei autonomen NPC-Entscheidungen auf). Die Testinstrumentierung wurde im anschließenden Code-Commit **ausschließlich auf den einzigartigen echten Ankunftspfad beschränkt**. Keine Preisregel, Produktdatei oder Referenzhash wurde verändert. Zweite CI vollständig grün.

## Bedeutung und nächste Entscheidungsvorbereitung

- Die **positive erste 24er-Rendite** aus B-K10f ist strukturell vom **einmalig verwendeten Blockpreis** abhängig. Bei derselben originalen Preisformel mit 24 einzelnen realen Ausführungen kippt sie auf **−244 ISK**, vor Hüllenkosten. Daher keinen positiven Wert aus Blocktransaktionen als Beleg einer langfristig selbsttragenden Markttiefe werten.
- B-K10g zeigt zusätzlich **unabhängig** von dieser Gegenprobe: Die zweite Blockpreis-Lieferung desselben Schiffes ist bei leer laufender Stations-/Haushaltskasse bereits **−485 ISK**, sechs Einheiten bleiben als bezahlte Fracht gebunden und der zweite 12h-Konsum fällt auf null. Ein Preisdetail allein löst die fehlende Endnachfrage nicht.
- **Keine Produktentscheidung** ist aus zwei Seed-Welten ableitbar. Ein produktiver Wechsel zu marginalen Preisen, Angebotsbüchern oder neuen Handelsgebühren wäre eine **gesondert freizugebende** Spielregel inklusive Save-/R15-, Spieler-/NPC-/Wettbewerbs- und 13×90d-Folgenprüfung. Ebenso keine Lohn-/Emissions-/Rettungsreform ohne Freigabe.
- **[OPTION NÄCHSTES GATE]** Zuerst systemweit prüfen, ob die Original-Core-Blockpreisbewertung wiederholt künstliche Handelsmargen und Stationsliquiditätsabflüsse erzeugt; gleichzeitig die lokale Lohnfinanzierung der Endnachfrage, Rohstoff-/Fabrikkosten, Schiffs-/Jägerarbeit sowie gebundenes Betriebskapital konsolidieren. Danach genau **eine** abgrenzbare produktive Regel zur Entscheidung vorlegen, nicht mehrere Heilmechanismen gleichzeitig.

Die [Testdatei](../tests/bk10h-blockpreis-gegeneinzelpreis.test.mjs) verändert **keinen** Spielcode und ersetzt keine realen iPad-/NAS-Tests.
