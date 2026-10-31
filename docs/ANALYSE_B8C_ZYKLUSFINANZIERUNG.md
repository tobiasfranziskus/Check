# B8c – Mindestkapital und Wiederholbarkeit von Rohstoffhandel

**31.10.2026 · [ANALYSE/DRAFT]**. Ausgangsbasis `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel14 / Schema8. **[BESCHLOSSEN]** Spieler darf Geld sparen; keine Pflichtsteuern/Einzelrettung; Modell-B-Geldquellen nur gegen echte Leistungen. Die **einzige verbindliche Roadmap** bleibt [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Fragestellung

B8b belegte an Tag14 im aktiven Seed42-Spielerfall: Fabriken ohne Eis/Material trotz vorhandener Rohstoffe anderswo; zahlungsunfähige Käufer Cyris und Nadir; NPC1/2 ohne Kapital und Frachter; NPC3 mit realem Kapital. B7f/B7h/B7i/B7k haben außerdem **bereits** echtes NPC3-Investment, selbstständige Folgetransporte, Vollkostenfilter und Risiko untersucht. B8c **wiederholt diese Varianten nicht** und testet **keine neue Geldquelle**.

Hier werden per ausschließlich lesender Originalkern-Instrumentierung die konkreten Einkaufsmengen identifiziert, die **über einen hypothetischen Hin- und Rückflug nach Originalpreisen, beiden Gebühren und angesetzter Fahrtarbeit rechnerisch positiv** wären. Zu jedem Angebot werden **tatsächlich vorhandene** Quellmengen und Ziel-Lagerkapazität, aktuelles Käufercash und daraus folgender Fehlbetrag, die notwendige Handelsvorfinanzierung für einen **frischen real zu kaufenden** NPC3-Konzernfrachter samt Leerpositionierung und der potenzielle zusätzliche Cashbedarf für eine **zweite identische Lieferung ohne zwischenzeitlichen Kaufkraftzufluss** ausgewiesen. Alle vorhandenen NPC-Kassen, alle Stationen und der Spieler bleiben im eigentlichen Weltlauf unverändert.

**Zentrale Grenze:** Das ist ein **Finanzierungsangebot / notwendige Cash-Bedingung**, keine bereits ausgeführte Lieferung und **kein belastbarer positiver Gewinnnachweis**. Betriebskosten werden als Minutenansatz `ceil(routeMinutes × Frachter-ISK/h / 60)` pro Etappe geschätzt. Hüllenpreis/-gebühr sind echte Core-Quotes, ihr Wert bleibt anschließend ein realer Vermögenswert. Leerlauf, Piraten-/Warte-/Minerersatzkosten, Steuern, Produktionsfolgemargen, eine denkbare zweite Käuferzahlung und mögliche günstige Anschlussrouten sind **nicht** als gesicherte Rendite modelliert. Die ausgewiesene komplette Vorfinanzierung enthält daher vorsorglich beide Fahrtarbeitsrichtungen, obwohl ein Verkauf in der Praxis den Rückweg finanzieren könnte; sie ist eine **konservative Größenordnung**, nicht zwingend das mathematische Minimum.

## Prüfung

- Originaler Regel14-Core, **exakt sieben** historische B1-Spielerbefehle ab Tick1 wie in B8b; Seed42 bis Tag90 und passive Seed42-Welt bis Tag14.
- Unveränderte historische Spieler-90d-Endreferenz `784047684dfe5c56`.
- Originalkern gegen nur beobachtend instrumentierten Kern, stündliche unabhängige Waren-/Geldprüfungen und Replayhashes, bestehende Save/Load-Roundtrips und 67 Standardtests.
- Quell- und Zielpreise, Reserven, Käufercash und Vollkostenangebote von Eis nach Nahrungsfabriken sowie Material nach Cyris ausschließlich durch bestehende Core-Funktionen.
- **Keine Änderungen an `index.html`, `tests/**`, Goldenwerten, PRs B7/B8a/B8b, Regeln, Schema, KI, Pacht, Spielern oder bestehenden Saveformaten. Kein echter Test einer ISK-Emission; die Zahlen zeigen nur, wo ein Modell-B-Finanzierungsmechanismus ansetzen müsste.**

## [TEST] B8c: belegte Original-Kontrolle und Liquiditätsgrenzen

**[CI #41227724539](https://github.com/tobiasfranziskus/Check/actions/runs/41227724539)** erfolgreich auf Analysecode und Original-Kern, **67/67 Node-Tests** (0 Fail), Seed42 aktiver Originalfall 90 Tage mit Endhash `784047684dfe5c56` und passiv 14 Tage; **2.496 stündliche unabhängige Geld-/Warenaudits + Replayhashes, 12 Save/Load-Roundtrips**. Ein erster fehlerhafter YAML-Workflow mit ungequotetem Doppelpunkt konnte *keinen* Testjob starten ([Run #41227690676](https://github.com/tobiasfranziskus/Check/actions/runs/41227690676)); YAML korrigiert und tatsächliche Testausführung nachgewiesen. Die später ergänzte **explizite Angebots-Assertprüfung** (vier positive Rohstoffkorridore ausschließlich bei nicht zahlungsfähigen Käufern, Käufer-/Konzerncash, passiver Positivvergleich und zweite Bestellung) wurde im abschließenden **[CI #41228004005](https://github.com/tobiasfranziskus/Check/actions/runs/41228004005)** erfolgreich ausgeführt, einschließlich erneut 67/67 Standardtests, unverändertem Hash, 2.496 Stunden-Audits und 12 Save/Loads. Die beiden Zwischenläufe #41227803001 und #41227935686 scheiterten ausschließlich an Shell-Zitierung im *neu ergänzten* Analyse-Assertblock; die betreffenden Kern-/Spielerwelt-Simulationen liefen zuvor durch. Die fehlerhaften CI-Checks werden nicht als bestanden gewertet.

### [ANALYSE] Aktiver Spielerfall – Marktangebote an Tag 14

| Rechnungsbeispiel (Quellstation → Fabrik) | Kleinste Ladung mit >0 ISK nach **Hin- und Rückflug** | Fehlendes Käufer-ISK bei realem Preis | Rückflugkalkulationsgewinn *vor* Risiko/Hülle | Frischinvestition NPC3: vorsorglich kalkuliertes Kapital inkl. Hülle |
| --- | ---: | ---: | ---: | ---: |
| Orion → Cyris, Eis | 29 | 687 ISK | **8 ISK** | 1.616 ISK |
| Veldra → Cyris, Material | 7 | 404 ISK | **20 ISK** | 1.324 ISK |
| Orion → Nadir, Eis | 14 | 293 ISK | **1 ISK** | 1.250 ISK |
| Orion → Veldra, Eis | 17 | 193 ISK | **1 ISK** | 1.281 ISK |

Alle vier Quellstationen verfügen im Originalzustand über regulär verkaufbare Ware. Der alternative, ebenfalls positiv kalkulierte Materialweg Aldera → Cyris benötigt für 7 Einheiten mit 13 ISK rechnerischem Überschuss sogar nur 1.164 ISK frische Gesamtvorfinanzierung, da die Hülle bereits an der Werft steht. **Der Spielzustand hat jedoch kein zusätzliches Stationsgeld erhalten und keinerlei dieser Angebote in neue NPC-Aufträge umgewandelt.**

Cyris hat **9 ISK**, daher würden zur gleichzeitigen Finanzierung der beiden genannten Mindestlieferungen Eis+Material (696 + 413 ISK) ohne zwischendurch bezahlte Einnahmen **1.100 ISK zusätzlich** fehlen. Die einzeln genannten Defizite 687 + 404 ISK dürfen **nicht** einfach addiert werden, weil beide Quoten dieselben 9 ISK vorhandener Cyris-Kasse unterstellen. Nadir hat 15 ISK, Veldra 147 ISK. NPC1/2 haben je 0 ISK und keinen Frachter. NPC3 hat 4.395 ISK und könnte die rechnerische **Erstinvestition** mit vorhandenen ISK tätigen; davon müssen bei echtem Schritt jedoch Minerbetrieb/Schiffsersatz ebenfalls finanzierbar bleiben.

Die kalkulierte **zweite identische Ladung ohne zwischenzeitliche Käufererlöse und bei eingefrorenem Preis** würde für die vier Beispielrechnungen ab originalem Tag14-Stand bereits 1.383 / 817 / 601 / 533 ISK Käuferfehlbetrag erfordern. Weil sich reale Preise, Lager, Nachfrage, Einnahmen und Risiko zwischen Fahrten verändern, ist dies **nur eine statische Sensitivität** und kein behaupteter zweiter Marktauftrag.

**[BEWERTUNG]** Eine positive Preis-/Gebührendifferenz ist nicht gleichbedeutend mit tragfähiger selbstständiger Handelswirtschaft. Bei den knappsten theoretisch positiven Rundfahrten verbleiben **nur 1 bis 20 ISK** Überschuss *vor* Verlustrisiko, Wartestand, Werftkapitalbindung oder Hüllenersatz. Käuferkasse und tatsächlicher Markteintritt sind zugleich blockiert. In der passiven Welt an Tag14 existiert für **Material Veldra → Cyris** eine rechnerisch finanzierbare volle Runde mit **0 ISK** zusätzlichem Käuferbedarf und **449 ISK** Überschuss nach angesetztem Hin-/Rückflug; das zeigt, dass die Kostenstruktur unter anderem Markt- und Lagerzustand nicht generell jede Fahrt verhindert. Andere passive Eisrouten sind bereits auskömmlich versorgt und brauchen keinen Händlerauftrag. Kein universeller Preisfehler ist dadurch bewiesen.

**Gegenwärtige Entscheidung: keine Geldemissionsfreigabe.** Ein zusätzliches ISK-Budget für einen Käufer ist ohne reale wiederkehrende Finanzierung der Folgebestellungen kein marktweit dauerhafter Kreislauf. Direkte Emission an *einzelne* notleidende Stationen verletzt ohnehin die Beschlusslage. B8c enthält deshalb keinen solchen Code und keinen Reparatur-/Schiffszuschuss.

**Nächstes Gate:** Wenn an einer konkret produktionskritischen Lieferung Käufer-ISC und Transportkapital wirtschaftlich zu unterscheiden sind, **nur einen** realen End-to-End-Vertrag ausführen und danach Liquiditätsrückfluss, zweiten Kauf und Produktionsfolge nachweisen. Erst danach Modell-B-Quellenentscheidung, 13 Seeds ×90 Tage und 365d-Spielerkrisen; kein Einzel-Bailout.

**Freigabe:** [ANALYSE/DRAFT], nicht mergen, nicht deployen, keine Safari-/NAS-Abnahme.
