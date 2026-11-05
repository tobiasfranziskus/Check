# W5s-b – bezahlte Frachterüberführung Nadir → Aldera

**[DRAFT / FORSCHUNG, 05.11.2026]** Branch `feature/w5s-b-bezahlte-frachterueberfuehrung-20261105`, direkt auf dem geprüften W5s-a-Head aus PR #202. Nicht in `main`, keine Freigabe von R32-Verschleißparametern, keine Produktregeländerung, kein Deployment.

## Problem und Grenze

W5s-a stellt aus 50 real beförderten Erz, 5 raffinierten Materialien, 530 ISK Werftaufwand und einer bezahlten 750-ISK-Schiffshülle einen Frachter in **Nadir** bereit. Der bestehende W5r-Eisautopilot benötigt ihn in **Aldera**. Bloßes Umsetzen des Systemfelds oder ein zweiter `shipBuy` wären weder finanziell noch physisch korrekt.

## W5s-b-Versuch – expliziter Forschungs-Gate

Die bisherigen Produktions-, Geld-, Waren- und Eigentumsregeln bleiben erhalten. Der neue Befehl `shipReposition` ist **ausschließlich** mit dem ausdrücklich übergebenen `rules.w5s`-Forschungsprofil bei einer R32-Welt zulässig.

1. Nur tatsächlich durch W5 in Nadir produzierter und vom Spediteur gekaufter, eigener, leerer, ungebundener Frachter darf auf die vorhandene Route Nadir–Aldera.
2. Vor Beginn wird der **volle** vorhandene Fliegerlohn von 1 ISK je realer Reiseminute vom Spediteurkonto in eine gesonderte Reserve gebunden. Kein Treibstoff. Kein Flug ohne Deckung, keine versteckte neue ISK.
3. Jede tatsächliche Core-Minute baut die Reserve ab und zahlt den Piloten aus. Der bestehende allgemeine Ankunftspfad führt die Hülle erst am echten Ende nach Aldera.
4. Bei Verlust des bisherigen Frachters prüft R32 zunächst, ob eine **bereits gekaufte und wirklich überführte** W5-Hülle in Aldera ungebunden bereitsteht. Erst dann wird diese Hülle mit neuem R32-Einsatzdatum zugeordnet. `w5r.assignments` dokumentiert die **Zuordnung**, `w5r.purchases` bleibt für *neue* Käufe zuständig. Dieselbe Hülle darf nicht zweimal gekauft/zugeordnet werden.
5. Die vorhandene Eisroute `shipFreightIce` bleibt eigenständig, mit der ursprünglichen vollständigen Eis-/Fracht-/Lohnfinanzierung und derselben Core-Prüfung.
6. Optionaler `state.w5s`-Nachweis führt gebundene und gezahlte Löhne, abgeschlossene Flüge und Hüllenidentitäten. Er wird unabhängig zu den bisherigen Buchungsprüfungen auditiert und kann in R32-Saves ohne Schemawechsel als Zusatzfeld auftauchen.

**Wichtige Einschränkung:** Die Auswahl `rules.w5s` wird nicht als eigenständiges Produkt-Save-Profil ausgeliefert. Tests übergeben das Forschungsprofil bei Fortsetzung ausdrücklich erneut. In der produktiven R32-Konfiguration bleibt der neue Befehl gesperrt. Die alte W5r-Regelversion und bestehende Referenzhashes sollen bei unveränderten Befehlen identisch bleiben.

## Prüfgates

- Gezielter Test `tests/w5s-bezahlte-ueberfuehrung.test.mjs`: Seed42 und Seed7 samt zweifachem deterministischem Durchlauf, echte Erz→Material→Werft→Kauf-Kette, finanzierte Positionierung, Auftrags-/Eigentumsgate, fehlende Gelddeckung, Doppelbefehle, unveränderter Hash nach Ablehnung, Audits nach Teilbuchungen, Zwischenspeicherung während der Reise, Tamper-/Lade-Ablehnung, tägliche Audits bis Tag30, Zuordnung ohne Doppel-Kauf, vollständig bezahlter Eis-Hin-/Rückflug, End-Save/Load.
- Unveränderte W5s-a-Tests, Node-22-Gesamt-CI und historische R32-Referenzen auf separat nachgewiesene Ergebnisse prüfen. Vor abgeschlossener CI **keine** Tests als bestanden behaupten.
- 13×90d mit aktivem Ersatz-/Werft-Dispatcher, 365d, Spar-/Insolvenzfälle und konkurrierende Eis-/Erzflüge bleiben spätere Integrations-Gates.
- Kein Miner-Neubau, keine Ersatzteile, kein erzwungener externer Geldzufluss und keine automatische durchgehend produktive Ersatzindustrie. Wirklicher iPad-Safari-/NAS-Check bleibt offen.

**Integration:** Nicht #201 (Docs), #203 (UI) oder `main` verändern. Nach positiver Prüfung weitere W5s-Schritte nur gegen gesonderte Freigabe.
