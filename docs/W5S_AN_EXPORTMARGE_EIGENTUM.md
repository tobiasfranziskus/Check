# W5s-an – Exportdeckungsbeitrag und Eigentumsrecht vor der ersten Stationsaktie

**[DRAFT/ANALYSE · 07.11.2026]** Isolierte Forschung auf [W5s-am #241](https://github.com/tobiasfranziskus/Check/pull/241). **Keine** Ausgabe von Anteilen, kein fiktiver Dividendenanspruch, keine neue ISK-Quelle, kein Produkt- oder Balancingwechsel. Der W5s-Original-R32-Core mit einem einzigen Simulationszustand bleibt die einzige Datenquelle. Default-Regeln, Regelversion 32, Schema 8, produktiver Regel-14-Core, W5u und Spielstände bleiben unverändert.

## 1. Wesentliche wirtschaftliche Korrektur

Die Exportproben W5s-al/am vergleichen echte Geldumlaufwirkungen. **Exportumsatz darf aber nicht ohne Produktionsvollkosten in einen Dividendenanspruch umgedeutet werden.** Die bestehenden Core-Regeln `w5n` verwenden pro vollständiger 50er-Fracht:

| Gegenleistung / Kosten aus Original-Regeln | ISK je 50 Wasser |
|---|---:|
| Bezahltes Eis: 50 × 5 ISK | 250 |
| Bezahlte 60-Minuten-Hin-/Rückfracht: 2 × 60 × 2 ISK | 240 |
| Bezahlte Wasserwerksarbeit: 5 × 20 × 1 ISK | 100 |
| **Direkte Stations-Chargenkosten** | **590** |
| **Direkte Kosten je Wasser** | **11,80 ISK** |

Das rechnet exakt die für W5o bereits verwendete Stations-Dividendenkalkulation nach und **enthält noch keine zusätzlichen Wartungs-, Verschleiß- und Kapitalkosten**. Ein Export zu 7 ISK/Wasser erzeugt vor weiteren Kosten **−4,80 ISK je Wasser**. Er ist echte bezahlte Leistung und lässt reales Geld in der Modellwelt ankommen, ist jedoch **kein durch den Export selbst verdientes ausschüttbares Ergebnis**.

Die testweise 14-ISK-Variante erzielt +2,20 ISK vor weiteren Kosten, benötigt aber eine eigene nachgewiesene Beteiligungsberechtigung, Finanzierung und Betriebsreserve, bevor irgendwelche Ausschüttungen zulässig sind.

## 2. Genau der neue technische Schritt

- In `index.html` ausschließlich **read-only** `m_core_index.w5sStationEquityQuote(state,rules)`, zusätzlich und ausschließlich bei `rules.w5s.stationEquityQuote===true` verfügbar. **Default OFF**, keinerlei neue Befehle, keine Mutationen, keine Schemaänderungen.
- Das Quote-Objekt belegt physische W5q-Exportmenge, zuvor tatsächlich gebuchten Exporterlös, Original-R32-Eis-/Fracht-/Produktionskosten, Deckungsbeitrag **vor** Wartung, Rest-Exportbudget, Liquidität von Station und privatem Käufer sowie Schutz einer 14-ISK-Verbrauchseinheit. Berechtigt sind ausschließlich stationseigene `mode:'station'`-Erlöse, nicht die bloße Experimentaloption `mode:'household'`.
- Die Quote kann **keinen** Aktienkauf oder Dividendenvorgang abwickeln und gibt immer `existingShareContract:false`, `earnedDistributableProfit:0` und `authorizedDividends:0` aus. Frühere Exporte dürfen nicht rückwirkend einer noch gar nicht beteiligten Person gehören.
- Ein positiver historischer Deckungsbeitrag allein ist weder Bilanzgewinn nach Wartung noch rechtmäßiger Anspruch; das Verfahren zeigt daher keinen auszahlbaren Betrag an.
- Die Testdatei `tests/w5s-an-exportmarge-eigentumsquote.test.mjs` baut für Seeds 42/7 dieselben echten, vorfinanzierten W5s-ai/AL-Welten, prüft bestehende Core-Audits und Save/Load, Hashidentität vor/nach Quote und Kontenmanipulationen.

## 3. Referenzwerte und Entscheidungsgrenze

| Vergleich | 7 ISK | 14 ISK |
|---|---:|---:|
| Physisch exportierte Wasser bei 7.000-ISK-Deckel | 1.000 | 500 |
| Bereits gebuchter Exporterlös | 7.000 ISK | 7.000 ISK |
| Zugehörige direkte Stationskosten | 11.800 ISK | 5.900 ISK |
| Deckungsbeitrag **vor** Wartung u. a. | **−4.800 ISK** | **+1.100 ISK** |
| Bereits eingeräumter Anteil / Dividendenanspruch | 0 / 0 ISK | 0 / 0 ISK |

Die historischen Zahlen stammen aus W5s-al/am und dem Original-Regelsatz. **Die neuen Tests und ihr CI-Ergebnis werden erst nach tatsächlichem Abschluss als bestätigt geführt.** Keine Annahme einer fortbestehenden Nachfrage, kein endloser Exporthaushalt.

## 4. Nächste ausdrücklich zu entscheidende Produktfrage

Ist eine *echte* Minderheitsbeteiligung an `st_nadir` erwünscht, obwohl die Station nachweislich bereits vorhandene inländische Gewinne an denselben Modellhaushalt ausschüttet (W5o `divStation`)? Für einen neuen Vertrag müssen mindestens festgelegt werden:

1. **Käufer und Eigentümer:** Wer besitzt die Station aktuell rechtlich, wer darf Anteile neu ausgeben, wie hoch ist ihr Preis, welche konkrete Quote wird übertragen, und wer erhält welche bestehenden Gewinnansprüche? Kein kostenloser Anteil und keine doppelte Auszahlung bereits in W5o verteilter Gewinne.
2. **Prospektive Gewinngrenze:** Nur Leistungen *nach* wirksamem Anteilskauf; exportierte Waren mit vollen direkten Kosten sowie Wartung, Flottenverschleiß, Produktions-/Arbeitsreserve und vorherigen Dividenden abziehen. Bei Verlust zwingend Dividende 0.
3. **Echte Zahlungsbuchung:** Geld muss vollständig vor Zeichnung beim Käufer vorhanden und als Eigenkapital nachweisbar zur Station transferiert sein; ursprüngliche Kassen- und W5o/W5n-/W5q-Audits müssen den neuen Rechtsgrund unabhängig akzeptieren. Keine Freigabe nur anhand eines Summenaudits.
4. **Kein Rückwirkungs- oder Rettungsrecht:** Kein Nachzahlen alter Exporte, kein Erlös für fremde Waren, keine direkte Geldmodell-B-Emission an Investoren, kein Gratislohn. Spieler darf weiter sparen.
5. **Echter positiver Langzeittest:** 13×90d, Seed42/7 bis 730d, Spar-/Insolvenz-/Save-/Manipulationsfälle; nur echte zahlende weitere Verbraucher machen den Kreislauf funktional.

**Empfehlung:** Keine echte Anteilsausgabe im selben Schritt wie die Profitabilitätskorrektur. Zuerst belegen, dass ein rechtsgültiger Vertrag ohne Doppelausschüttung aus realen **Netto**gewinnen finanzierbar wäre. Besteht der Test nicht, ist das Ergebnis ein wirtschaftlich negativer Forschungsbefund, kein Anlass für eine Gratisdividende.
