# B-K10l – Preis-/Kostenrelation für Nahrung in unveränderten autonomen Normalwelten

**[ANALYSE/DRAFT · 02.11.2026]** [PR #129](https://github.com/tobiasfranziskus/Check/pull/129), auf #128 → #127 → #126 → #124 → #123 → #108. **[MAIN]** weiterhin b4e604d6, v0.12.5 / Regel14 / Schema8. Regel15/Schema9 bleibt ein **nicht integrierter Kandidat**. Nur neues Testjournal in `tests/bk10l-normalwelt-nahrungsmargen.test.mjs` plus Dokumentation; **keine Änderung** an `index.html`, Produktionsmechanik, Preisen, Löhnen, Fonds, Geldschöpfung, Spielständen, Oberfläche, Merges oder Deployment.

## Auftrag und Unterschied zu B-K10k

B-K10k hat nach Entfernung des ursprünglichen Eisbestands bei einer realen, einzelnen Nahrungscharge einen erheblichen Verlust der Quellstation nachgewiesen. Diese künstliche Verknappung ließ den frühen Eispreis steigen. Deshalb wurde ausdrücklich **nicht** gefolgert, dass alle Nahrungsproduktionschargen in autonomen Normalwelten Verlust machen.

B-K10l beginnt mit sämtlichen **unveränderten Original-Startlagern**, allen autonomen NPC-Händlern, Minern, Piraten, Schutzjägern, Produktionslinien, Original-Fondsauffüllungen und der normalen deterministischen Preisformel. Es wird ausschließlich der bereits vorliegende, **nicht in main integrierte R15-/Schema9-Kandidat** aktiviert: finanzierte Frachterflüge, Fabrikproduktionsverträge mit explizitem Analyselohn **4 ISK pro Produktionsminute** und Geldzahlung für tatsächlich neu produzierte Nahrung durch lokale Haushalte. **Keine** NPC-Aufträge deaktiviert, **keine** Startware entfernt, **keine** Kasse verändert und **keine** ISK testseitig erzeugt.

Zentrale Frage: **Deckt der Original-Verkaufspreis die tatsächlich ausgezahlten Eisankäufe und Fabriklöhne – wenn die Produktionskette nicht künstlich mit knappen Anfangsvorräten beginnt?**

## Methode: Original-Core-Zahlungen statt angenommener Warenwerte

Ein test-only FIFO-Journal überwacht genau Nadirs originale Core-Buchungsstellen, ohne sie funktional zu ändern:

1. Beim Start führt es **100 Eis und 52 Nahrung** ausdrücklich als **historisch vorhandene Ware mit unbekanntem Anschaffungswert**, **nicht als kostenlose Ware**.
2. Jeder erfolgreiche Original-Handel mit Nadir wird protokolliert: Eiszugang mit tatsächlich von der Stationskasse gezahltem Stückpreis und Verkäufer (Original-NPC-Miner oder Trader), Nahrungsausgang mit tatsächlich an die Station gezahltem Preis und Schiffseigentümer. Etwaige eintreffende Händler-Nahrung wird als zugekaufte fremde Ware und **nicht** als eigene Original-Fabrikproduktion gezählt.
3. Bei jeder echten Produktionsreservierung werden genau **zwei FIFO-Eislose** aus dem Nadir-Lager entfernt und einer begonnenen Charge zugeordnet. Nach sechs Minuten wirklich erbrachter Arbeit und realem **24-ISK-Fabriklohn** wird genau ein Nahrungs-Fertiglos gebucht. Auch noch laufende Produktionsaufträge werden getrennt bilanziert.
4. Original-Nadir-Nahrungskonsum wird mit den tatsächlich im Core gezahlten Haushalts-ISK und kostenfreien ursprünglichen Altbestandsverbräuchen abgeglichen. Bei echten Händlerkäufen verlässt die originale, bezahlte Nahrung samt zugeordneter Einstandskosten das FIFO.
5. **Nur** Nahrung, deren **beide Eiseinheiten nachweislich aus echten bezahlten Eisankäufen** stammen, gilt als vollständig in der Probe kostenbelegt. Produkte aus Start-Eis werden ausdrücklich als *historischer Einstand unbekannt* aus der Istmargenrechnung ausgeschlossen, nicht mit 0 ISK bewertet. Dasselbe gilt für unverarbeitete Anfangsnahrung und fremd zugekaufte Nahrung.
6. Nadir-Fonds→Station-Zuflüsse werden unmittelbar bei den unveränderten Originalbuchungen protokolliert, strikt getrennt von Warenumsatz und Kosten. Das sind Überweisungen bereits vorhandener ISK, **keine Emissionen**.

**Audits:** 13 unterschiedliche Seeds × **72 Spielstunden** = 56.160 Spielminuten über 13 **getrennte** Welten. Stündlich test-eigener, unabhängiger Geld-Audit inklusive offenem Vertragsescrow, Warenledger- und Nadir-FIFO-Gegenprobe sowie Original-Core-Audit; täglich Save/Load/Hash. Seed42 zusätzlich ein deterministischer 24h-Replay. Das ist **kein 13×90-Tage-Test**, keine iPad-/NAS-Abnahme und kein Schiffersatz-/Kapitalwert-Audit.

## Ergebnisse: echte Nadir-Istkosten unter normalen Anfangslagern

| Gemessene autonome R15-Versuchswelt über 72h | Seed42 | Seed7 |
|---|---:|---:|
| Original-Nadir-Nahrung produziert | 318 | 231 |
| Eis vom NPC-Miner echt an Nadir verkauft | 659 Stk | 486 Stk |
| Nadir hat tatsächlich für dieses Eis bezahlt | 6.865 ISK | 5.135 ISK |
| Originale Preisformel, Eis **zu Beginn → am Ende** | 12 → 10 ISK | 12 → 10 ISK |
| Originale Preisformel, Nahrung **zu Beginn → am Ende** | 30 → 26 ISK | 30 → 36 ISK |
| **Kostenbelegte, exportierte Eigenproduktion** | **112 Stk** | **45 Stk** |
| Dafür tatsächlich eingenommener Nahrungspreis, Summe | 3.030 ISK | 1.125 ISK |
| Verbraucht gekauftes Eis dieser exportierten Lose | 2.515 ISK | 980 ISK |
| Tatsächlich dafür gezahlte Fabriklöhne | 2.688 ISK | 1.080 ISK |
| **Deckungsbeitrag dieser exportierten Eigenware** | **−2.173 ISK** | **−935 ISK** |
| **Kostenbelegte, lokal verbrauchte Eigenproduktion** | **96 Stk** | **96 Stk** |
| Dafür **wirklich bezahlter** Haushaltsumsatz | 3.158 ISK | 2.942 ISK |
| Zugeordnetes, tatsächlich gekauftes Eis | 1.920 ISK | 2.115 ISK |
| Tatsächlich gezahlter Fabriklohn | 2.304 ISK | 2.304 ISK |
| **Deckungsbeitrag dieser lokalen Eigenware** | **−1.066 ISK** | **−1.477 ISK** |
| Fonds→Nadir, Originalbuchungen in 72h | 13.574 ISK | 8.532 ISK |
| Nadir freie Kasse nach 72h | 433 ISK | 214 ISK |

**Korrekte Lesart:** Ein ausgewiesener Deckungsbeitrag enthält **nur die in der Tabelle konkret bezahlten** Rohstoff- und Fabriklöhne sowie den tatsächlich gebuchten Verkauf bzw. Endkonsum der zugeordneten Eigenware. Er ist **nicht** die vollständige Stations-Gesamtgewinnrechnung und berücksichtigt weder Schiffskapital, Bergbau-/Frachtkosten, Werfterneuerung noch die unbekannten Anschaffungskosten ursprünglicher Vorräte. In diesen zwei Seeds sind die verkauften vollständig belegten Nahrungsstücke **sämtlich einzeln negativ**, der lokale vollbelegte Aggregatbeitrag ebenfalls negativ.

### Breiterer Normalwelt-Test: 13 Seeds × 72 Stunden

| Zusammenfassung unabhängiger Testwelten | Wert |
|---|---:|
| Seeds | 1, 2, 7, 11, 13, 17, 42, 99, 1234, 2026, 65535, 98765, 314159 |
| Wirklich mit bezahltem Eis und Fabriklohn belegte Export-Nahrung | **1.309 Einheiten** |
| Summe dieser Export-Deckungsbeiträge über **getrennte Welten** | **−23.366 ISK** |
| Seeds mit überhaupt belegtem Nadir-Export | 12/13 |
| Seeds mit negativem *gesamtem* belegten Exportdeckungsbeitrag | **12/12** |
| Tatsächlich profitable vollbelegte Einzelexporte | **0** |
| Wirklich mit bezahltem Eis und Fabriklohn belegter lokaler Nahrungs-Endverbrauch | **1.228 Einheiten** |
| Summe der lokalen Deckungsbeiträge über **getrennte Welten** | **−18.727 ISK** |
| Seeds mit negativem *aggregiertem* lokalem Deckungsbeitrag | **13/13** |
| Fonds→Nadir, reale Brutto-Überweisungen über 13 **unabhängige** 72h-Welten | 186.086 ISK |

**Nicht missverstehen:** Die genannten aggregierten ISK sind **Summen aus 13 verschiedenen, niemals miteinander verbundenen Simulationen**. Es ist keine einzelne Wirtschaft mit −42.093 ISK Verlust oder 186.086 ISK Einmal-Fondsbedarf. Auch der Fondsumsatz ist kein Maß ausschließlich für Lebensmittelproduktion; andere Zahlungen gehen darüber. Seed314159 exportiert **keine** Nahrungseinheit mit vollständig bezahltem Rohstoffeinstand in den drei Tagen – daher **kein** positiver Exportbefund, aber auch kein dort negativer Exportnachweis. Einzelne lokal konsumierte Einheiten in Seed99 sind positiv; **der gesamte lokale Beitrag bleibt trotzdem negativ**.

## Interpretation: Ursache und Freigabegrenzen

**[ANALYSE / ROBUST REPRODUZIERT]** Der Produktverkaufspreis ist unter dem bestehenden, vom Lagerbestand getriebenen Preisverfahren und dem konkreten **R15-Testlohn von 4 ISK/Minute** für Nadirs wirklich bezahlte Eis→Nahrung-Fabrikarbeit in den geprüften autonomen Normalwelten im Mittel **nicht kostendeckend**. Der vorherige B-K10k-Kostennachteil ist somit **nicht bloß eine Folge der künstlich geleerten Eis-Startlager**. Die generelle Behauptung, alle produktiven Sektoren oder alle Stationen hätten dieselben Defizite, wäre dagegen unbelegt. Ebenso lässt sich aus diesen Daten **noch keine optimale neue Formel** für Preise oder Löhne herleiten.

Nadir bekommt gleichzeitig reale Fondsüberweisungen; diese decken **verschiedene Stationstransaktionen**, nicht automatisch ausschließlich die betrachteten Nahrungslose. Eine Umleitung vorhandener Rohstoff-/Handelsmargen mag den Fabrikstandort entlasten, **erhöht** aber ohne echte zusätzliche Endkundenleistung den Gesamtüberschuss **nicht**. Die aus B-K10k bekannte, bei 24 Stück lediglich **+29 ISK betragende konsolidierte Vor-Hülle-Marge** bleibt ein weiterer Engpass. Kein einzelner NPC darf aus einem simulierten Verlust heraus automatisch gerettet werden.

**[OPTION / nächstes Gate B-K10m]** Nun mit echten aktiven Weltdaten **parallel** Cyris und Veldra als andere Nahrungsproduzenten analysieren (die vorhandenen Anfangs- und Zukauflager differenzieren) und die **tatsächliche** konsolidierte Netto-Deckung durch Endverbrauch, bezahlten Flug, Minerarbeit und Produktionsarbeit untersuchen. Danach eine **einzige allgemeine, für Spieler und NPC identische Kosten-/Beschaffungs-Gate-Option** mit separatem Entscheidungsbedarf formulieren. Keine Preis-/Lohn-/Fonds-/Emissionsänderung, keine individuelle Insolvenzgarantie, keine Geldobergrenze und kein Merge ohne ausdrückliche Freigabe.

**[TESTSTATUS]** Direkte Ausführung aller drei B-K10l-Tests bestanden; vollständigen GitHub-CI-Workflow für den Testcode gesondert bestätigen. Siehe [ausführbaren Test](../tests/bk10l-normalwelt-nahrungsmargen.test.mjs).
