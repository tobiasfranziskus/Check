# B-K9a – Produkt-Draft: echte Vollkostenprüfung vor einer Nahrungslieferung

**01.11.2026 · [PRODUKT/DRAFT] [PR #93](https://github.com/tobiasfranziskus/Check/pull/93)**  
**[MAIN]** weiterhin `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, Regel14, Schema8. **Kein Merge.**

## Ziel und tatsächliche Änderung

Neues **rein lesendes** Modul `m_core_auftragskalkulation` in `index.html`, über `m_core_index.nahrungsangebot(state,rules,angabe)` erreichbar. Prüft ausschließlich einen künftigen Festpreisauftrag für **neu aus Eis herzustellende Nahrung**, gefördert durch einen vorhandenen Miner im Quellsystem, hergestellt in einer vorhandenen originalen Produktionslinie und auf einem **durchgehend sicheren Weg** durch einen vorhandenen Frachter an die Verbrauchsstation transportiert.

Der bisherige Spielablauf **ruft dieses Modul noch nicht auf**, es gibt weder Vertragsbuch noch atomare Geldreservierung und **keine tatsächliche Lieferung durch das neue Modul**. Keine neuen `state`-Felder, kein zusätzlicher Zufall, kein geänderter Tick, keine produktive Lohn-/Emissions-/Preisregel, kein Schema-/Regelwechsel, keine neue Laufzeitpflicht. Deshalb bleiben vorhandene Spielstände, Hashes und Original-Wirtschaftstests unberührt. Das ist ein **Core-Baustein**, noch keine vollständige Produktfunktion.

## Welche Kassen und Kosten werden vorab geprüft?

Für einen beabsichtigten Vertrag mit `quelle,ziel,miner,frachter,menge,endpreis,fabriklohn,ersatzFahrten`:

- **Endkäufer:** die echte Kasse der Zielstation muss den gesamten vertraglichen Endpreis **bereits vor Beginn** decken.
- **Fabrik:** die echte Quellstationskasse muss die Original-Rohstoffrechnung zu aktuellem Preis sowie den *explizit geschätzten, bislang nicht produktiv erhobenen* Fabriklohn decken. Die originalen Rezept-/Lagerbedingungen müssen existieren; keine Lagerüberläufe.
- **Miner:** eigener Betriebskostenvorschuss für die erforderlichen Original-Förderminuten und Original-Handelsgebühr; Rohstofferlös muss diese Kosten decken.
- **Frachter:** echte Quellnahrungsrechnung, Quell- und Zielgebühr, konservativer Lohnpuffer von **vollen angefangenen Reisestunden** und eine Ersatzrücklage aus dem aktuellen Original-Werftpreis inklusive Gebühr, dividiert durch die **ausdrücklich angenommene** Zahl amortisierender Fahrten. Auch seine eigene Liquidität muss alle Posten vor dem ersten Start tragen.
- **Gemeinsame Konten:** Miner/Frachter dürfen denselben Konzern besitzen. Dann werden die Beträge **vor Prüfung summiert**, damit dieselbe ISK nicht zweimal eine Verpflichtung deckt.
- **Sicherheit/Abbruch:** unbekannte Schiffe und Stationen, negative/gebrochene oder überlaufende Zahlen, ungedeckte Teilkassen, negative einzelne Margen, volle Lager, fehlende Mine/Rezeptlinie und unsichere Routen werden mit gesonderten Gründen abgelehnt. **Kein automatischer Schutz oder Gratisrisiko**.

Das Modul enthält **nur die Kalkulation**; es reserviert weder Geld noch Fläche, und der spätere tatsächliche Abschluss müsste alle aktuellen Bedingungen **atomar erneut prüfen**. Die Fabriklohn- und Ersatzfahrten-Annahmen sind keine bereits genehmigten neuen Spielregeln. **WIP, verlorene Waren, Auftragsfristen, Risikoprämie und Wiederbeschaffung sind noch nicht vollständig bepreist**; der angebotene Mindestpreis ist insoweit eine konservative Teilkostenuntergrenze und keine bewiesene Gesamtmarktrendite.

## Reale Testdaten der bestehenden Welt, Seed42

**Angebot:** 3 Nahrung in Cyris hergestellt, sicherer Flug nach Aldera, 6 Eis, 6 Miner-Minuten, 18 Rezeptminuten, 25 Flugminuten, expliziter hypothetischer Fabriklohn 9 ISK und Ersatz eines 780-ISK-Frachters über **angenommene 20 bezahlte Lieferfahrten**.

| Bilanzposition | ISK |
| --- | ---: |
| 6 Eis kaufen | 78 |
| Eisverkaufsgebühr, vom Miner | 3 |
| Minerarbeit fällig | 15 |
| Fabriklohn (nur geplante Modellannahme) | 9 |
| Nahrungsquellwert an Frachter | 99 |
| Quellgebühr | 3 |
| konservative volle Frachter-Stundenreserve | 250 |
| Hüllenersatzrücklage je angenommener Fahrt | 39 |
| Käuferpreis am realen Originalspot in Aldera je Nahrung | **30** |
| Warenwert beim Zielspot für 3 Nahrung | **90** |
| Frachtermarge beim Zielspot nach Gebühren, voller Stunden-/Ersatzreserve | **−304** |
| Erforderlicher Frachter-Break-even je Nahrung bei genau diesen Annahmen | **136** |

Der kalkulierte positive Test-Festpreis **400 ISK pro Nahrung** (1.200 ISK gesamt) wurde **nur zur Ausführung der Finanzierungsprüfungen** gewählt. Er entspricht keinem heute belegten willigen Endkunden. Damit werden getrennte Kassenbedarfe ausgewiesen: Käufer 1.200, Fabrik 87, Miner 18 und Frachter 439 ISK. Die positive Testquote beweist **nicht**, dass der Markt 400 ISK real zahlen würde. Bei echten 30 ISK/Einheit ist die Transportverbindung nach diesen Kostenannahmen klar negativ, ebenso beim angebotsseitig ermittelten Grenzwert von 135 ISK. Erst 136 ISK/Einheit decken in der Quote die genannten Frachterposten; noch nicht zusätzlichen Rückflug, Ersatz der Produktion oder realen Kapitalkreislauf.

**[TEST/CI]:** [GitHub Workflow #41334280954](https://github.com/tobiasfranziskus/Check/actions/runs/41334280954), Node-Testjob **83/83 erfolgreich**, davon 16 neue B-K9a-Tests (gegenüber 67 unveränderten). Darunter vollständige Selbstfinanzierung, tatsächlicher Zielspot vs. Kostenschwelle, kombinierte Besitzerkassen, Negativfälle, Integergrenze, Sicherheit, Kapazität, Hash-Identität und 13 Seeds. Laufende historische Referenzjobs sind unabhängig zu bewerten; selbst erfolgreiche v14-Weltläufe testen das **ungenutzte** Modul nicht unter echten Vertragslasten.

## Entscheidung und nächstes Arbeitspaket

**[ANALYSE ERGEBNIS]** Der fehlende reine Kassencheck ist jetzt als Produktbaustein vorhanden, aber das **ökonomische Hindernis ist deutlicher**: Der erforderliche Frachtererlös ist auf der kleinen Original-Nahrungsroute ein Mehrfaches des aktuellen Endpreises. Neue ISK allein reparieren weder diese Marge noch die fehlende zahlende Zivilnachfrage.

**[NICHT ZUM MERGE EMPFOHLEN]** Vor dem echten Vertrag müssen zuerst die unterstellte Ersatz-Amortisation und die betrieblichen Gesamtkosten fachlich freigegeben sowie belastbare zahlungswillige Endabnehmer gefunden oder ein anderes, profitables Produkt/Routensegment ausgewählt werden.

**[OPTION B-K9b]** Auf denselben Kern ein ausdrücklich freigegebenes **atomar finanziertes**, gespeichert- und migrationsgeprüftes Vertragsbuch aufsetzen (B9i/B9j wiederverwenden), zunächst mit *einem* Käufer und *einem* Frachter, die Ware tatsächlich bestellen, produzieren, liefern und bezahlen. Vor erster Arbeit muss das Geld gesperrt sein. Bisherigen echten Spielbetrieb bis dahin unverändert lassen. Konkrete externe ISK-Emission benötigt eine **gesonderte Nutzerfreigabe**. Keine kostenlose Security-Arbeit, Individualrettung oder Spieler-Sparobergrenze.
