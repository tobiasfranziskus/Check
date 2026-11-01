# B-K9j – Vorhandene Eisladung statt Neubergbau: Preis-, Kassen- und Flug-Gate

**01.11.2026 · [ANALYSE/ARCHIV] – PR #102 nach CI schließen, NICHT integrieren.**

**Verbindlicher [MAIN]**: `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, Aphros Void v0.12.5, Regel14/Schema8. Gegenüber `main` werden ausschließlich eine Diagnose, ein eigener CI-Workflow und dieser Bericht auf einem Branch abgelegt; `index.html` und die Roadmap auf `main` bleiben unverändert.

## Tatsächlich ausgeführte Prüfung

[GitHub Actions #41346461161](https://github.com/tobiasfranziskus/Check/actions/runs/41346461161) **SUCCESS**. `node tools/bk9j-vorhandenes-eis-originalmarkt-14d.mjs`: 13 feste Original-Spielerkrisenseeds ×14 Tage, 4.368 Stunden-Snapshots, 473 einzelne am Dock stehende leere NPC-Frachterangebote, Originalgeld-/Warenaudit täglich und 182 erfolgreiche Save-/Load-Hashes. **Keine Produkt- oder Simulationsmutation außer dem realen originalen Spielerminerbefehl**; der Test **reserviert, verlagert, kauft, transportiert und verkauft keine** Waren selbst. Jegliche Transfer-/Finanzierungsmöglichkeit ist ausdrücklich **nur eine lesende Momentaufnahme**.

Bedingungen einer hypothetischen 13-Nahrung-Abnahme aus bereits vorhandenen **26 Eis** des echten NPC3-Cyris-Miners:
- Die Rohstoffe sind **bereits** in der Minerladung; keine erneute Förderung und keine zweite pauschale Minerarbeitskostenposition in diesem Angebot (tatsächlich historisch gezahlte und ggf. unterdeckte Minerarbeit später separat nachweisen).
- Original-Eispreis ×26, aktueller Nahrungs-Original-Spot in Cyris und Aldera ×13, aktuelle Quell-/Ziel-Handelsgebühren; echte verfügbare Quelle-/Käufer-/Frachter-Besitzerkassen.
- Konservativer Originalfluglohn **105 ISK** für 25 Minuten Cyris→Aldera (aufgerundet; bei einigen abgeschlossenen Originalflügen wurden 100 ISK für 24 abgerechnete Minuten beobachtet), vor Abflug vollständige **250-ISK-Stundenreserve**, **39-ISK-Hüllenersatz** und 39 ISK hypothetisch wirklich zu zahlender Fabriklohn.
- Bei einem wirklich **an anderem Dock stehenden** leeren Frachter werden seine Original-Wegzeit und konservativen Anfahrtslohn **zusätzlich** voll eingerechnet. Es gab **keinen Teleport**, kein Gratisgeld, keine Emission, keinen vereinbarten fiktiven Verkaufspreis.
- Mindestens **26 echte Stationseinlagerungsplätze**, keine kostenlose Durchreichung durch einen zusätzlichen Dockpuffer. Darum ist dieser Gate bewusst strenger als der noch nicht genehmigte, ungemergte v15-B-K9f-Vorschlag.

| Prüfung über 13×14 Tage | Tatsächlich gezählte Snapshots |
| --- | ---: |
| Beobachtete Stunden | 4.368 |
| Geprüfte leere, wirklich gedockte NPC1-/NPC2-Frachterangebote | **473** |
| Stunden mit irgendeinem leeren gedockten NPC-Frachter | **384** |
| Stunden mit einem solchen Frachter **direkt in Cyris** | **63** |
| Vollständig zugleich vorfinanzierbare, lagermögliche und profitable Angebote | **0** |
| Seeds mit einem solchen Angebot | **0/13** |

In den 473 geprüften Frachtersnapshots konnten mehrere Ablehnungsgründe zugleich gelten: **426 negative Frachtermargen**, **345 nicht ausreichend vorfinanzierte Frachterkassen**, **179 nicht genügend freie Cyris-Eis-Lagerplätze für 26 Rohstoffe**, **168 Endkunden-Kassen unter aktueller Zielrechnung**, **107 negative Cyris-Fabrikmargen** und **65 noch nicht ausreichende bestehende Miner-Eisladungen**. Diese Häufigkeiten sind weder eindeutige Auftragsnummern noch additiv zu interpretieren.

### Konkrete Preise statt fiktiver Aufträge

**Seed7, Spieltag4**: Alt-Minerladung 100 Eis, Original-Eispreis 13 ISK, also 26 Eis = **338 ISK**. Das Ursprungswerk würde 13 Nahrung im Original-Cyris-Markt für **429 ISK** an den Frachter verkaufen. Bei **39 ISK** explizit zu zahlendem Fabriklohn blieben der Station **52 ISK** vor weiteren Anlagenkosten. Aldera zahlt real 13×53 = **689 ISK**; die eigentliche Cyris→Aldera-Fahrt wäre nach Original-Handelsgebühren, konservativem 105-ISK-Lohn und 39-ISK-Hüllenreserve bei unverändertem Preis mit ca. **+72 ISK** plausibel.

**ABER:** Der im betrachteten Snapshot herangezogene Frachter ist in Orion unterwegs; seine hypothetische gesondert finanzierte Umpositionierung von Orion→Cyris kostet nach Originalroute konservativ **180 ISK**. Damit fällt die komplette Fahrtermarge auf **−108 ISK**. Zudem können von 26 geplanten Eis am normalen Cyris-Lager nur **15** eingefahren werden. Dies ist nur ein Angebotssnapshot, keine tatsächlich gebuchte Transaktion.

**Seed7, Spieltag7**: Cyris-Rohstoffpreis inzwischen **24 ISK/Eis**, somit 624 ISK für 26, aber der aktuelle Cyris-Nahrungs-Spot nur 28 ISK/Stück = 364 ISK für 13; **Fabrikmarge −299 ISK nach den explizit geplanten 39 ISK Lohn**. Original-Cyris-Kasse nur 16 ISK. Hier scheitert sogar der lokale industrielle Teilzyklus – kein Frachter-Trick kann das wirtschaftlich neutralisieren.

## Gegenstand und Grenze

**[POSITIV]** Die Ursache ist nun zahlenmäßig eingrenzbar: Spätestens bei der weiteren Krise verhindern Lagerdurchsatz und echte Stationsliquidität die Eisabnahme. Davor fehlen teils bei vorhandener Ware die bezahlte Frachterpositionierung und nach vollständigen Kosten positive echte Handelsmargen.

**[NEGATIV]** In diesem untersuchten Suchraum (Cyris→Aldera, exakt 26 Alt-Eis→13 Nahrung, 14 Tage, leerer gedockter NPC1/2-Frachter, konservative Anfahrt/Lohn/Reserve) **0 echte Gesamtopportunitäten**. Das ist **kein Beweis**, dass kein anderes, anders großes, zeitlich späteres, anderes Produkt oder andere sichere Route rentabel wäre. Der bestehende Regel14-Spielerminer bleibt aktiv; die Alt-Arbeitskosten sind nicht automatisch nachträglich vollständig bezahlt, nur nicht doppelt abzurechnen.

**[PROJEKTLEITUNGSVORSCHLAG]** Keinen weiteren integrativen Vertrags- oder Geldemissionsmechanismus auf Vorrat entwickeln. Als nächsten **klar abgegrenzten** Ursachenversuch zuerst den realen **Eispreis-/Nahrungs-Preisabstand und die Produktionskäufe von Cyris** sowie vollständige NPC-Frachter-Leerfahrten und Zielkaufkraft systematisch gegentesten. Eine real zahlende Endkundennachfrage bleibt ungelöst. Eine Konzeption wie X3 mit direkt vom Piloten bezahltem Rohstoffkauf würde nur dann helfen, wenn Pilot, Käufer und Transport tatsächlich die Kapitalkosten tragen, nicht wenn ein negatives Margengeschäft in ein anderes Konto verschoben wird.

**Repo-Bereinigung:** #83–#101 (18 zuvor offene PRs) sind geschlossen, ohne Merge; #102 wird nach CI ebenfalls geschlossen. Die historischen Branches und Closed-PR-Refs halten den ungemergten Beweisbestand zugänglich; keine unautorisierte Löschung oder `main`-Integration.
