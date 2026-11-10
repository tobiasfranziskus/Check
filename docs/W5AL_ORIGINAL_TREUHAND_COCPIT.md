# W5al – echte Treuhandliquidität im gemeinsamen Regel195-Hub [DRAFT]

> Forschungs-UI auf [W5ak #285](https://github.com/tobiasfranziskus/Check/pull/285); Wirtschaftsbeleg aus [W5aj-b #284](https://github.com/tobiasfranziskus/Check/pull/284). Nur lesende Projektion des **bestehenden** Regel195-Cores, kein neuer Kapitalfluss und keine Produktregel. Main, produktive `index.html`, Saves und Pages unverändert.

## Warum diese kleine Integration?

W5aj fand einen sofort gesperrten dritten Eisverkauf bei Tick550. W5aj-b konnte nachweisen: Aldera besitzt bei diesem Zeitpunkt zwar **0 ISK frei**, aber **1.000 ISK** sind bereits rechtswirksam in W1-Erz-Kaufaufträgen (`erz_treuhand_*`) gebunden. Diese Beträge dürfen nicht für Eis ausgegeben werden. Nach 50 tatsächlich absolvierten NPC-Core-Minuten werden sie durch echte Vertragsabwicklung wieder frei; danach kann die dritte reale Eischarge bezahlt und auf einem dritten vollständig vorfinanzierten Eis-Rundflug transportiert werden.

## Gelieferter Spielerwert

- Eisverkauf und Wasser-/Eisübersicht unterscheiden Alderas freie Käuferkasse, real gebundene Erz-Kaufgelder, Nadirs eigene freie Käuferkasse sowie die eigene freie Speditionskasse. Der Text nennt die separat erforderlichen Fracht-/Lohn-Reservierungen ausschließlich nach Original-Core-Kalkulation.
- Der read-only View-Adapter `capitalBridge` verifiziert gegen die echten Core-Eigentümerkonten und Buchungen: `Aldera frei + original Erz-Kauftreuhand = ursprüngliche Aldera-Kasse + tatsächlich gebuchte Erlöse − tatsächlich gebuchte Kosten`. Keine Buchung, kein zusätzlicher Timer, keine garantierte Reservenfreigabe.
- Wer bei 0 freiem Aldera-Geld verkaufen möchte, sieht jetzt den Unterschied zwischen **vorübergehend gebundener Nachfrage** und wirklich fehlender Finanzierung. Über gültige W1-Abschlüsse entscheidet weiterhin allein der Original-Core. Niemand erhält Geld durch die Oberfläche.
- Das dritte tatsächliche 50-Eis-Geschäft und ein weiterer realer Frachtflug sind durch Node- und Chromium-Touchszenario überprüfbar, ohne die historisch belegte W5ai-Tick480-Referenz zu ersetzen.
- Ein bereits in #285 vorhandener W5ag-CI-Workflow hatte einen **ungültigen nicht gequoteten YAML-Namen mit Doppelpunkt**. Diese Syntax ist hier korrigiert; die Touch-Gesamtabnahme wird nicht mehr als bestanden behauptet, bis CI tatsächlich grün ist.

## Schutzgrenzen

Das ist kein Geldmodell-B-Emissionsrecht, keine W6-Nachhaltigkeitsaussage, kein Refactoring des Wirtschaftskerns. Keine gezwungenen privaten Einkäufe, keine Übertragung fremden Geldes, kein Auto-Anschub. Produkt-Main sowie die Forschungsverzweigungen #281–#284 bleiben unverändert. Freiflug und manuelles Docking bleiben Core-Folgethemen; reale iPad-Safari/NAS-Abnahme offen.

**CI-Status:** Nach vollständig ausgeführten Node22- und Chromium-Touchprüfungen ergänzen.
