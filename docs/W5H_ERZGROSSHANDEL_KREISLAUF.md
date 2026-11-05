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
