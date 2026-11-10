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

## Ausgeführte Abnahme am Code-Head `ea6c2933`

- [W5ag/Original-Core/Touch-CI #42762510518](https://github.com/tobiasfranziskus/Check/actions/runs/42762510518): beide Jobs **erfolgreich**. `node --test tests/*.test.mjs` hat **200/200 Einzeltests**, 0 Fehler, 0 Skips bestanden (3 neue W5al-Tests).
- **Touch: alle 12/12 tatsächlich ausgeführten Chromium-Größenchecks bestanden.** W5ag 4/4, Miner2D 4/4, W5ak/W5al 4/4 (1180×820, 1024×768, 820×1180, 390×844). Der letzte Test führt die erste und zweite Eisfracht, die Kassen-/Erztreuhandsperre, den realen 50-Minuten-Auftragsabschluss, den dritten echten Eisverkauf und den dritten W5n-Rundflug über die Bedienoberfläche aus. Die ursprüngliche W5ai-Tick480-Referenz wird vor dem neuen dritten Flug geprüft.
- [JavaScript-Regression #42762510460](https://github.com/tobiasfranziskus/Check/actions/runs/42762510460): **erfolgreich**. Alte W5u-Historik/CI wird getrennt bewertet.
- **Seed42 Original-Core-Referenz nach drittem Flug:** Tick720, Hash `43a9992602f1addd`, 3 vollständig bezahlte Eisrundfahrten und 150 echtes Eis geliefert, insgesamt 480 tatsächlich vergütete Flugminuten (120 Erz/360 Eis), freie Aldera-Kasse 1.000 ISK, Nadir 2.066 ISK, Weltgeld 33.000 ISK, **0 Mint**. Im unabhängigen Seed7 mit identischem Käuferbudget gilt derselbe Ablauf, Hash `4dbd44700abcec1f` (kein abweichendes Käuferstartkapital behauptet).
- Kassen-Buchidentität wurde bei jedem ausgewiesenen Punkt aus dem gespeicherten Original-Core verifiziert. Bei Tick550 sind 1.000 ISK in W1-Erz-Käufer-Treuhand gebunden; bei Tick600 ist die Reserve durch echte W1-Arbeit frei und Aldera bezahlt die dritte 50-Eis-Charge. **Weder Käufersubvention noch Rückbuchung durch die UI.**

Echte iPad-Safari- und NAS-Abnahme offen. Kein Merge oder Deployment. Dokumentationsänderungen verändern weder Core noch Testreferenzen.
