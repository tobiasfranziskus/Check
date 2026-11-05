# W5h: echter Erzgroßhandel und Rückfluss aus realen Lieferungen

**05.11.2026 · DRAFT #184 · Regel25/Schema8 · gestapelt auf #183**

## Ausgangsdiagnose
Der W5g-Exportkäufer gibt 10 ISK je Erz aus seinem endlichen 20.000-ISK-Budget aus, die Ware wird aber endgültig aus dem Spiel entfernt. Das Käuferkonto hat keine Einnahme: 5 von 13 W5g-Welten erreichen deshalb keine dritte bezahlte Erzcharge. Die bestehende vollständig bezahlte W3-Lieferung verwendet 500 ISK Warenwert plus 240 ISK Frachtgebühr und 120 ISK reale Fluglohnkosten. W4 und W5b bleiben unverändert.

## Kleinstmögliche reale Rückflussstrecke
1. Der Exportkäufer kauft höchstens 50 echte Aldera-Erz aus **vorhandener** Kasse; Quellstation erhält 500 ISK. Das physische Erz bleibt mit separat bilanziertem Eigentum im Quelllager, wird **nicht** als Export vernichtet.
2. Der Kauf setzt einen realen Transportfrachter sowie die aktuell belegbare 740-ISK-Kaufkasse bei Nadir voraus. Der W3-Auftrag verlangt sowohl Händler-Lagerbestand als auch W3-Geld-/Arbeits-Treuhand. Ohne eine der Voraussetzungen findet kein belegter Transport statt.
3. Beim Hintransport liegt die Ware physisch im Frachter; erst bei Ankunft in Nadir wird sie gegen 500 ISK aus der W3-Kaufreserve an den Händler bezahlt und real im Ziel-Lager gebucht. Die Frachtgebühr bezahlt Nadir wie bisher am Ende, die Fluglöhne bleiben real vorfinanziert.
4. Dieselben 500 ISK können nun die nächste **physische** Charge finanzieren. Mehr als acht Chargen sind in diesem isolierten Forschungstest nicht erlaubt; daraus folgt keine Serienpreis- oder Ressourcenfreigabe.

## Nachweise und Fälschungsschutz
Das unabhängige W5h-Buch verlangt `gekauft = verkauft + lager + unterwegs`, `verkauft = W3-geliefertes-Erz`, die tatsächliche W3-Fracht bei `unterwegs`, reale Stations- und Händler-Kontoauszüge sowie `Exportkasse = 20.000 − 10*gekauft + 10*verkauft`. Das globale Geldledger verbleibt bei 33.000 ISK und die physische Warenbilanz bleibt unverändert; `minted=0`, `burned=0`. Gegenproben verschieben 500 ISK bilanzerhaltend oder fälschen Eigentumsbestand; beide Fälle müssen den unabhängigen Audit bzw. den Save-Import scheitern lassen. Testdatei `tests/w5h-erzhandel-kreislauf.test.mjs` enthält 13 feste Seeds ×90 Tage, tägliche Audits, Hashreplay und Save/Load. **CI-Resultat wird separat dokumentiert; bloß eingereichte Tests gelten nicht als bestanden.**

Neuer Browser-Datenspeicher `aphros-void-forschungswelt-w5h`; älterer Hauptspiel-/Forschungs-Save unverändert. Keine Migration von Regel24.

## Nicht gelöst – entscheidendes wirtschaftliches Gate
Die realen House-Werftzahlungen für einen Jäger betragen nach wie vor 2.288 ISK, der Jägerverkauf erlöst nur 900 ISK: **−1.388 ISK je Jäger** vor weiteren betrieblichen Kosten. Weder ein Großhandelskonto mit rückfließendem Geld noch eine per Klick gekaufte Hülle schafft dauerhafte, wirtschaftlich tragbare Schiffsnachfrage. Bei fehlender Endkasse, negativer Herstellermarge oder echtem Kapitalmangel muss Produktion stoppen. Piraten haben weiterhin keine finanzierten Ersatzkäufe. Weitere Preis-/Emissionsregeln, Nachfrage und NPC-Überleben erfordern gesonderte Freigabe.

Kein Merge/Deployment. Reale iPad-Safari-/NAS-/CSP-Abnahme offen.

## Tatsächlich ausgeführter Testbefund · 05.11.2026

**[CI] Workflow [#41962358218](https://github.com/tobiasfranziskus/Check/actions/runs/41962358218), Head `ea26862f9b856d6d3cd2452335e0e0233af32d61`: 226/226 Node-Tests bestanden, 0 fehlerhaft.** Bestandene Testkette: unveränderte 217 Legacy-Tests und neun W5h-Tests; unter letzteren 13 feste Seeds × 90 Simulations-Tage mit täglichen unabhängigen Bilanz-Checks, deterministischem Replay sowie Save/Load und zwei realen W3-Transporten je Seed. Die W5h-UI-/Save-Slot-Prüfungen bestanden ebenfalls. Referenz- und Geografieworkflows bestanden, ein nicht einschlägiger Vergleich war übersprungen.

Im 13×90-Tage-Test wurde je Seed ein Jäger produziert und verkauft; zwei W3-Fuhren transportierten insgesamt 100 Erz zu echtem Kaufpreis. Beispielsweise Seed42: Hash `8c898d441f90780a`, 100 Erz geliefert, weitere 50 bezahlt auf dem Quelllager, Exportkasse 19.500 ISK und House 1.364 ISK. Über alle 13 Seeds blieben Buchungen und Ware korrekt, `minted=burned=0`.

Ein zusätzlicher aktiver Krisentest Seed42 führte insgesamt **300 Erz in sechs real bezahlten Frachten** nach Nadir und stellte eine **zweite vollständig bezahlte Bauteilcharge** her. Danach verblieben **House 308 ISK und Nadir 2.100 ISK**. Die zweite Jägerendfertigung konnte die Vorprodukt- und Arbeitskosten nicht decken; der Core lehnte den Auftrag **ohne Mutation des Spielstands** ab. Ein zweiter Jäger wurde **nicht** gebaut. Das ist kein Testfehler: Der korrigierte Test verlangt gerade die belegte Ablehnung und schützt gegen eine verdeckte Gratisproduktion.

**[ANALYSE / NICHT ERREICHT]** W5h beseitigt den endlichen Exportabsatz-Abfluss, **nicht** die makroökonomische Umlauf- und Deckungsbeitragslücke. Die von House benötigten ISK existieren zum Teil bei Nadir oder anderen Empfängern, aber ohne bezahlten Gegendienst besteht kein legitimierter Rückweg. Hersteller-Vollzahlungen 2.288 ISK vs. Kaufpreis 900 ISK bleiben −1.388 ISK; keine Preisänderung oder Emission vorgenommen. Eine dauerhafte Jägernachfrage, beglichenes Zweitjäger-Investment, ein autonomer NPC-Wiederanlauf und rechtliche Insolvenzbehandlung sind nicht nachgewiesen. Weitere Produktmechaniken benötigen Freigabe.

Nur GitHub-Node-CI bestanden; echte iPad-Safari-/NAS-Abnahme offen.
