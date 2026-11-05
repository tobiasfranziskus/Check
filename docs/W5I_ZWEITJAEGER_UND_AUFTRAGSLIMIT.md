# W5i – bezahlter Zweitjäger und begrenzte Erz-Auftragspipeline

**[DRAFT] 05.11.2026 · PR #185 auf #184 · isolierte Regel26/Schema8**

## Problem
W5h finanzierte echten wiederholbaren Erzhandel, aber im ursprünglichen aktiven Test blieb nach sechs Frachten die House-Kasse mit 308 ISK unter den benötigten 432 ISK für die zweite Jägerendfertigung. Aus dieser einen Aufgabenreihenfolge folgt noch keine grundsätzliche Unfinanzierbarkeit. Beim initialen NPC-Miner und House-Miner hängt reale Auftragsvergabe an aktivem Auftrag, verfügbarer Abnahme und Core-Reihenfolge. Außerdem durften sich in W5h bereits bezahlte, aber noch nicht verkäufliche Erzchargen im Quelllager sammeln.

## Kleinster echte Finanzierungsmechanismus
W5i verwendet sämtliche bestehenden Preise, Rezepte, Käufer und Buchungen. Das einzige neue Forschungs-Gate ist: **höchstens 50 Erz** gleichzeitig im Aldera-Quelllager, in schon reservierten W1-Bergbauaufträgen und als noch nicht angelieferte Schiffsware. Nach echter W3-Zustellung wird wieder ein Auftragsplatz frei. Nadir muss bei jedem neuen Auftrag 740 ISK frei finanzieren können; die bestehende W3-Treuhand reserviert wie bisher 740 ISK Warenwert + beide Strecken Gebühren und separate 120 ISK Transportarbeit. Jeder Verkauf stammt weiterhin aus dem globalen, konstanten ISK-Vorrat.

## Eigenständige NPC-Strategie – keine Spieler-Begünstigung als Produktregel
Der Forschungs-Dialog erlaubt, per **bestehendem `shipWait`** dem NPC-Eigentümer NPC3 explizit eine freiwillige erste Bergbaupause zuzuweisen. Es wird weder NPC-Geld noch ein NPC-Miner übertragen oder künstlich abgebaut; bei echter Nachfrage darf der bestehende W2-NPC-Entscheidungspfad die Förderarbeit wieder beginnen. Das ist ein **ausgewähltes wirtschaftliches Gegenbeispiel**, keine Aussage, dass NPCs generell freiwillig Spieler vorlassen. House verdient zusätzliche real gezahlte, mit tatsächlichem Erz und Arbeitskapital belegte 10-ISK-Abnahmen, die einen weiteren industriellen Bau ermöglichen.

## Tatsächlich direkter Core-Versuch vor CI
Seed42, Seed7 und Seed98765: 6×50 wirklich angelieferte Erz, 2 echte Silizium-/Bauteil-/Jägerchargen, zwei belegte 900-ISK-NPC-Käufe. Nach dem zweiten Kauf House 2.176 ISK, NPC3 600 ISK, Nadir 2.500 ISK, Export 19.500 ISK mit 50 realen Händler-Erz im Lager. Keine ISK-Emission oder Gratiswaren, unabhängig geprüftes Globalgeld 33.000 ISK. **Ein dritter Käuferauftrag ist mit NPC3 600 ISK nicht finanziert** und wird nicht fingiert.

## Nachweise und Grenzen
Neuer read-only-Audit prüft offene physische Erzmenge und Förderreservierung (max.50), vorhandenen Händlerbestand und unveränderte Kassenbilanz. Der Exportkäufer erhält seinen Warenpreis weiterhin erst nach echter W3-Ankunft. Negative Tests verweigern falsche Lager- und Geldverschiebungen selbst bei unveränderter globaler Menge. Eine eigene Regel26-HTML-Seite mit schreibkonfliktgeschütztem IndexedDB-Slot schützt das Hauptspiel und alle Regel15–25-Saves.

Die Werftfabrik bezahlt weiterhin 2.288 ISK und erhält 900 ISK je Jäger: **−1.388 ISK** Fertigungsdifferenz. Zusätzliche echte Bergbauumsätze decken einen Teil, aber es gibt keine Garantie dauerhaft finanzierbarer Jäger, kein zweites Piratenschiff und keine Insolvenz- oder Lohn-Endnachfrage-Regel. W5i verändert keinen Rohstoff, Produktionspreis oder Geldemissionsvorgang. Eine dauerhafte Marktlösung benötigt eine gesondert legitimierte, bezahlte Nachfrage und einen positiven Gesamtdeckungsbeitrag, nicht bloß Umverteilung.

**CI-Prüfplan:** `tests/w5i-zweitjaeger-finanzierung.test.mjs` und `tests/w5i-ui.test.mjs`: 13 Seeds × 90 Tage, zwei je 900 ISK tatsächlich gekaufte Jäger, tägliche unabhängige Geld- und Warenbilanz, Pipeline-Krisenfälle, Save/Load und Replay, Hashes, CAS-UI und manipulierte Saves. Erfolge erst nach tatsächlich abgeschlossenem Lauf melden. Reale iPad-Safari/NAS-Abnahme offen. Kein Merge/Deployment.
