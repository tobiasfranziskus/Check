# B1-Folgeanalyse: NPC-Investition, Routenentscheidung und Dauerbetrieb

**30.10.2026 · [ANALYSE/DRAFT] · keine Produktänderung.** GitHub-main bei Arbeitsbeginn: `ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`, v0.12.3, Regeln 12, Schema 8. AGENTS.md, Roadmap und Projektstatus an dieser Basis gelesen. [#35](https://github.com/tobiasfranziskus/Check/pull/35) (`b9a6c1f`) und [#36](https://github.com/tobiasfranziskus/Check/pull/36) (`cec7f937`) waren zu diesem Zeitpunkt offen/Draft, nicht gemergt.

**Abgleich vor PR-Erstellung:** Während der Arbeit wurde #35 als reiner Dokumentationscommit [`906b7978d388e9af960443a2b7f4835b1d2a15c0`](https://github.com/tobiasfranziskus/Check/commit/906b7978d388e9af960443a2b7f4835b1d2a15c0) integriert. Neue Roadmap/Projektstatus erneut gelesen; `index.html`, AGENTS.md, vorhandene Tests/Werkzeuge/Workflows gegenüber `ed94b891` unverändert geprüft. Dieser Branch wurde auf diesen aktuellen main abgeglichen. Die Messdaten benennen weiterhin ihren tatsächlich verwendeten, bytegleichen Produktkern an `ed94b891`. #36 bleibt Draft und dient ausschließlich als gepinnter Analysebeleg; seine Änderungen sind nicht Produktbasis.

## Ursachenurteil

**Routenmarge, zahlungsfähiger Konzern und ersetzbare Flotte sind drei verschiedene Bedingungen.** Die neue Ausführung bestätigt alle vier B1-Kontrollverläufe vollständig bis Tag 97. Alle vier Frachter werden durch Meridian-Piraten im Kampf zerstört, nicht durch einen im Core gespeicherten Insolvenzfall. Ein Frachter hat bis zum Verlust sogar +444 ISK Betriebsergebnis vor Hüllenkauf. Die bezahlte Hülle selbst wird dadurch noch nicht verdient; gleichzeitig nutzt der Konzern dieselbe Kasse für Minerbetrieb und Minerersatz.

Die isolierte Betriebskostenbewertung verbessert das Betriebsergebnis in drei Fällen, verschlechtert es im Jagdfall und garantiert weder längeres Überleben noch Ersatz. Die zusätzliche kalkulatorische Hüllenreserve verbessert die Absicherung ebenfalls nicht allgemein: Im Minerfall kauft der Frachter gar keine Waren mehr und fliegt nach unveränderter Ausweichregel leer umher. Im Jagdfall lebt er fast acht Tage, hat aber 15.517 ISK unbezahlten Betrieb und kein Cash. **Längeres physisches Überleben ist hier kein wirtschaftlicher Erfolg.** Alle zwölf Frachter sind bis zum 30-Tage-Messpunkt verloren; bis Tag 365 entsteht kein Ersatz für den neu investierten Frachter.

**Präzisierung gegenüber #36:** Der B1-Text sprach pauschal von neun Minern und neun Verpflichtungen. Die gespeicherten Ausgangszustände enthalten tatsächlich **9/9/8/9 vorhandene Miner**, aber **in jedem Fall elf Miner-Sollplätze**. Der Stationsfall wurde im B1-Text falsch verallgemeinert. Zusätzlich kann das Umlenken eines erhaltenen Miners dessen Sollplatzzuordnung verlieren lassen. Die neuen Audits, Budgets und Lebensläufe verwenden die echten gespeicherten Strukturen; die Produktbasis hat sich dadurch nicht geändert.

## Versuchsaufbau und Isolation

[Runner](../tools/b1-dauerbetrieb.mjs), [Verdichtung](../tools/b1-dauerbetrieb-summary.mjs), [Messdaten](data/b1-dauerbetrieb-v12.json), [vollständige B1-Kontroll-Lebensläufe](B1_FRACHTER_LEBENSLAEUFE.md), [eigene CI](../.github/workflows/b1-dauerbetrieb.yml). Die Messdaten sind keine Golden-Fixture. Jeder Fall enthält außerdem alle Bewegungs-/Kauf-/Verkaufs-/Kosten-/Kampfereignisse der zwei Varianten; stündliche Budgetserien stehen in den vollständigen Rohartefakten.

Vier Tag-90-Fundamente wurden neu mit dem unveränderten #34-Werkzeug an `6855d76bb374dd777a1b7e30ea52c9a6eca36399` rekonstruiert, inklusive Replay und unabhängigen Kassen-/Warenaudits. Seeds unverändert: Miner/42, Handelsflotte/42, Station/1234, Jagd/98765. Aus jedem identischen Save laufen **control**, **operating**, danach **replacement** je 275 weitere Tage bis absolut Tag 365. Das ist zuerst die isolierte Betriebskostenprüfung, anschließend eine zusätzliche Rücklagensensitivität; keine Kombination mit Sollflottenänderung, Rettung, Kredit oder neuer Produktion.

Alle drei Fassungen führen dieselben vier validierten B1-Befehle aus: eigener Silizium-Miner nach Aldera (129601), vorhandene Frachterware kaufen (129662), aktivieren (129663), autonom handeln (129664). Keine Konten-/Fracht-/Eigentumsinjektion, kein anderes Befehlsband zur Ergebnisrettung. Der Carrier zahlt weiterhin seine reale 150-ISK-Anreise. Die Auswahl-IDs und Befehle stammen aus #36; die Kontrolle muss dessen ganzen Tag-97-Hash erreichen. Alle Ausführungsresultate müssen erfolgreich und im Replay identisch sein.

**Einzige experimentell abweichende Simulationsfunktion: `m_core_entscheidung.bestesPaar()`, und darin nur NPC3s Frachterbewertung.** Der Runner erzwingt, dass vollständiges Zurückersetzen dieser Funktion den Originalquelltext ergibt. Regelobjekt unverändert, Produktions-HTML mit festem SHA-256 geprüft. Alle anderen Owner benutzen die ursprüngliche Bewertung. Der jeweilige Replay benutzt dieselbe Funktionsfassung ohne Beobachter. Beobachter ergänzen ausschließlich Protokolle für Transaktionen, Reise und Kämpfe; kein zweiter Wirtschaftskern.

| Fassung | Konkrete Änderung in der Testfunktion | Bewusst erhaltene Grenzen |
| --- | --- | --- |
| control | Unveränderte Gebührenmarge und Versorgungsgewichtung | Betrieb, Waren-/Schiffsverlust und Wiederbeschaffung fehlen im Score. |
| operating | Vor Score/Positivprüfung wird `ceil(250 × (Reisezeit + 1) / 60)` von der Warenmarge nach beiden Gebühren abgezogen. Bestehender Versorgungsbonus und Tie-Break bleiben. | Nur nächste beladene Fahrt als Prognose; spätere Leerfahrt, Liegezeit und Verluste bleiben ungeschützt. Keine probabilistische Risikoprämie. |
| replacement | Zusätzlich für den Wareneinkauf verfügbare Kasse = max(0, Cash − aktuelle offene Arbeitskosten aller eigenen Schiffe − aktueller Frachterpreis inkl. Kaufgebühr − prognostizierter nächster Betrieb). Menge mit vorhandener `bezahlbar`-Formel. | Hüllenbetrag ist eine reine Entscheidungsschranke, kein neues Konto und kein abgeschöpftes Geld. Minerersatz und spätere Abbuchungen können ihn weiterhin verbrauchen. Fehlende Hülle wird dadurch nicht gebaut. |

Der Satz 250 ISK pro Stunde ist der vorhandene Frachterkostensatz, kein neuer Balancingwert. Die zusätzliche eine Minute ist eine deklarierte vorsichtige Abrechnungsannahme, keine veränderte Core-Kostenbuchung. Die Arbeitskostenreserve wird als Summe pro Schiff aufgerundet; tatsächliche Abbuchung bleibt unverändert abgerundet und cashbegrenzt. Die Ersatzquelle ist immer reale Werftware gegen reale Zahlung; die Variante fügt weder einen Anspruch noch einen kostenlosen Ersatz hinzu. Eine volle Hüllenreserve ist keine pro Fahrt nochmals als Aufwand verrechnete Hülle.

Unverändert bleiben **`besterAbsatz`, zufällige Leerfahrt nach Warten, Kampf, Sollflotte, `ersatzkauf`, Fonds, Abgaben und Dividenden**. Gerade diese Begrenzung ist für das Ergebnis wesentlich: eine abgelehnte Warenfahrt hält den Frachter nicht automatisch sicher und bezahlt im Dock. Für Variantenfortsetzung aus einem Save ist dieselbe explizite Testfunktion nötig; Schema/Regeln bleiben 8/12 und definieren keine Produktmigration für diese Experimente.

## Lebensgeschichte der vier B1-Frachter

Die Tabellen im [Ereignisanhang](B1_FRACHTER_LEBENSLAEUFE.md) enthalten lückenlos jede Warenbuchung, Abfahrt mit Core-Route und Fracht, Kostenabbuchung, Kampf samt Gegnern/HP sowie Budget am Verlust. Zusammengefasste Verlustsituationen der Kontrolle:

| Fall / Seed | Schiff | Aktivierung → Verlusttick | Angreiferklassen | Fracht vor Kampf | Runden / eigene Rest-HP | Konzerncash am Verlust | neuer Hüllenpreis inkl. Gebühr / Bestand | Cashlücke inkl. vorhandener Pflichten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| miner / 42 | sh158 | 129663 → 129840 | pirat_gross,pirat_mittel | silizium=25 | 4 / 0 | 571 | 1092 / 1 | 2643 |
| handel-flotte / 42 | sh106 | 129663 → 132480 | pirat_gross,pirat_mittel | material=8 | 4 / 0 | 30 | 780 / 2 | 1000 |
| station / 1234 | sh112 | 129663 → 129960 | pirat_gross,pirat_mittel | erz=25 | 2 / 0 | 3003 | 1404 / 0 | 0 |
| jagd / 98765 | sh125 | 129663 → 129960 | pirat_gross,pirat_mittel | erz=25 | 4 / 0 | 2662 | 780 / 2 | 0 |

Alle vier letzten beladenen Fahrten haben Ziel Meridian: Miner transportiert 25 Silizium, Handelsflotte acht Material, Station und Jagd je 25 Erz. Vor dem Kampf ist die Fracht noch vorhanden; danach wird bezahlbare Beute nach der bestehenden Regel direkt in Meridian gebucht und der Rest vernichtet. Der Erlös geht an Piraten, nicht an NPC3. Die dem Händler verbliebenen FIFO-Einstandskosten der gesamten verlorenen Fracht sind 520 / 199 / 208 / 182 ISK. „Leere Fracht beim Entfernen“ würde diesen bereits vorausgehenden Beute-/Vernichtungsvorgang verschweigen; der neue Beobachter erfasst deshalb den Kampf **vor** `zerstoeren()`.

Die letzte Gefechtsberechnung endet jeweils mit `sieger=B`, ohne Flucht, und eigenen HP null. Es findet kein cashabhängiges Verschrotten statt. Der Kern beurteilt reisende zivile Ziele anhand ihres **Zielsystems**: die aufgelistete Mehrtorroute bildet Reisezeit ab, aber nicht einzelne durchflogene Kampfstufen. Deshalb können Station-/Jagdfrachter bereits wenige Ticks nach Abfahrt Richtung Meridian betroffen sein. Die Daten sind keine aus Entfernungen abgeleitete statistische Überfallwahrscheinlichkeit.

Die erste Materiallieferung ist weiterhin tatsächlich profitabel; daraus folgt kein positiver Gesamtbetrieb. Spätere Frachten können beim Abflug positive Gebührenmargen versprechen, beim Ankommen jedoch nur teilweise/zu anderen Preisen verkauft werden. Dazu kommen Leerfahrten, neue Einkaufskosten, laufender Betrieb und der Verlust noch unverkaufter Ware. Die längste B1-Kontrolle lebt 46,95 Stunden und führt 81 Käufe/82 Verkäufe durch, erreicht trotzdem −4.853 ISK Netto-Betriebsergebnis vor Hülle.

## Ergebnisse der isolierten Routenvergleiche

Alle Zeilen bis Tag 365 verfolgt. Lebenszeit in Spielstunden seit Aktivierung; Nachkommastellen gerundet. P&L ist frachterbezogen, Cash und gesamte ungedeckte Kosten sind konzernbezogen.

| Fall | Fassung | Lebenszeit h | Warenkäufe / Verkäufe | realisierte Gebührenmarge | Frachterbetrieb Soll / bezahlt | verlorene Fracht zum Einstand | Netto-Betrieb vor Hülle | Konzerncash Tag 365 | Konzernbetrieb ungedeckt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| miner | control | 2.95 | 5 / 6 | 708 | 737 / 737 | 520 | -549 | 571 | 0 |
| miner | operating | 4.95 | 3 / 4 | 959 | 862 / 612 | 0 | 97 | 114 | 417 |
| miner | replacement | 20.95 | 0 / 0 | 0 | 2064 / 671 | 0 | -2064 | 0 | 1393 |
| handel-flotte | control | 46.95 | 81 / 82 | 7083 | 11737 / 11226 | 199 | -4853 | 254 | 870 |
| handel-flotte | operating | 9.95 | 7 / 8 | 2636 | 1397 / 1397 | 0 | 1239 | 1414 | 0 |
| handel-flotte | replacement | 9.95 | 7 / 8 | 2277 | 1397 / 1397 | 0 | 880 | 1372 | 0 |
| station | control | 4.95 | 7 / 10 | 1352 | 1237 / 1237 | 208 | -93 | 46 | 0 |
| station | operating | 4.95 | 3 / 7 | 851 | 906 / 906 | 0 | -55 | 144 | 0 |
| station | replacement | 4.95 | 3 / 7 | 851 | 906 / 906 | 0 | -55 | 144 | 0 |
| jagd | control | 4.95 | 7 / 8 | 1863 | 1237 / 1237 | 182 | 444 | 4 | 0 |
| jagd | operating | 75.95 | 37 / 37 | 8113 | 9708 / 9708 | 406 | -2001 | 1046 | 0 |
| jagd | replacement | 189.95 | 4 / 4 | 1311 | 17171 / 1654 | 0 | -15860 | 0 | 15517 |

**Ergebnisdefinition:** `Netto-Betrieb = realisierte FIFO-Marge nach Kauf-/Verkaufsgebühren − tatsächliches Betriebs-Soll − Einstand verlorener Restfracht`. Unbezahlter Betrieb wird nicht als kostenloser Gewinn behandelt; Soll und Ist stehen getrennt. Hüllenanschaffung, Geber-/Konzerntransfers, Minerverkäufe/-betrieb und Minerersatz gehören nicht zum Frachter-Betriebsergebnis. Für das Ergebnis nach Investition ist der reale erste Hüllenkauf von 780 / 780 / 1.092 / 780 zusätzlich abzuziehen. In der Kontrolle ergeben sich damit −1.329 / −5.633 / −1.185 / −336 ISK. Das bessere einzelne Geschäft rechtfertigt die Gesamtinvestition also nicht automatisch.

FIFO verteilt Gebühren bei Teilverkäufen anteilig; winzige Floatreste betreffen nur Diagnosewerte (z.B. 444.0000000000002), niemals gespeichertes Cash, Preise oder Waren. In den Tabellen wird dafür auf ISK gerundet. Käufer- und Verkäuferzahlungen selbst werden im unabhängigen Audit exakt als sichere Ganzzahlen geprüft.

**operating allein:** Netto verbessert sich in Miner/Flotte/Station von −549/−4.853/−93 auf +97/+1.239/−55, verschlechtert sich im Jagdfall von +444 auf −2.001. Überleben steigt von 2,95 auf 4,95 Stunden bzw. 4,95 auf 75,95 Stunden, fällt im Flottenfall aber von 46,95 auf 9,95 Stunden. Es bleibt somit kein allgemeiner Überlebensgewinn. Im Flottenfall kann der Konzern am Verlust sogar eine vorhandene Hülle und die momentanen Minerpflichten finanzieren; fehlende Sollregistrierung verhindert trotzdem den Frachterersatz.

**replacement zusätzlich:** Im Minerfall findet kein einziger Warenkauf/-verkauf statt. Der Frachter lehnt wegen Reserveknappheit Angebote ab, geht nach unveränderter Warte-/Leerfahrtlogik weiter auf Reisen und stirbt mit null Cash und unbezahltem Betrieb. Im Jagdfall bleiben vier Käufe/vier Verkäufe, aber lange überwiegend leere Bewegung: längstes Überleben 189,95 Stunden bei −15.860 ISK Betriebs-Soll-Ergebnis. Ein rein kalkulatorischer Reserveabzug in der Einkaufsauswahl kann das Ausgeben durch andere Mechaniken nicht sperren. Station ist in beiden Kostenfassungen zustandsgleich; der zusätzliche Filter bindet dort nicht weiter.

Alle Varianten sind spätestens am Tag-30-Messpunkt ohne den neuen Frachter. Messpunkte nach 1/7/30/90/180/275 Fortsetzungstagen enthalten Kasse, Kosten, Handelsmengen, Ergebnis, Ersatzfähigkeit und Hash. Kein 275-Tage-Wirtschaftserfolg wird aus einem überlebenden leeren Schiff abgeleitet. Identische Seeds bedeuten nach Entscheidungsänderung auch nicht identische Gefechtsschicksale: anderer Verkehr und weitere RNG-Aufrufe ändern den späteren Zufallsverlauf. Die vier ausgewählten Gegenbeispiele liefern keine Erfolgs-/Verlustwahrscheinlichkeit über alle Seeds.

## Getrennte Investitionsrechnung und Minerpflichten

Im Produkt existiert **kein separates Investitionskonto**. Der Runner legt ebenfalls keines an. Beide Frachtervarianten entscheiden aus NPC3s tatsächlicher gemeinsamer Kasse. Zur Prüfung ohne Doppelzählung wird daneben ausschließlich gemessen:

`freie Mittel = Konzerncash − bereits aufgelaufene unbezahlte Arbeitsabrechnung − Momentanpreis der fehlenden Miner-Sollplätze − einmal bestehende 250-ISK-Reserve`.

Für eine **zusätzliche** Ersatzhülle wird ihr momentaner Gesamtpreis erst anschließend abgezogen. Dieselben ISK werden nicht zugleich als Minerbudget, Frachterreserve und Warenkasse addiert. Alte diagnostische Sollkostenlücken sind keine im Spiel gespeicherten Verbindlichkeiten und werden hier nicht rückwirkend als Schulden eingeführt. Die offene Arbeitsabrechnung betrifft nur seit der letzten tatsächlichen Buchung geleistete Arbeit.

Momentaufnahme unmittelbar nach Aktivierung des neuen Frachters, noch vor dessen erstem Einkauf:

| Fall | echtes Cash | vorhandene Miner / fehlende Sollplätze | kalkulierter Minerersatz | offene Arbeit | gemeinsame vorhandene Reserve | frei nach Pflichten | weitere Frachterhülle | verbleibende Lücke |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| miner | 1120 | 9 / 3 | 3369 | 0 | 250 | -2499 | 1092 | 3591 |
| handel-flotte | 4250 | 9 / 3 | 3369 | 0 | 250 | 631 | 1092 | 461 |
| station | 5303 | 8 / 4 | 4492 | 0 | 250 | 561 | 1404 | 843 |
| jagd | 3582 | 9 / 3 | 3369 | 0 | 250 | -37 | 1092 | 1129 |

Damit trägt die frühere B1-Rechnung „Hülle + erste Ladung + 250“ nicht die **gesamte** Konzernplanung. Sie belegt den ersten Handelszyklus, übersieht aber den bereits vorhandenen Ersatzdruck. Die Reserve wird in dieser Tabelle einmal abgezogen; die prognostizierte Betriebskostenreserve aus der Variante wird nicht zusätzlich nochmals als derselbe freie Betrag gezählt.

Der kalkulierte Minerersatz multipliziert die fehlenden Sollplätze mit dem **aktuellen** Core-Angebot einschließlich Gebühr. Dies ist eine Prüf-Momentaufnahme, kein ausgeführter Kaufauftrag und kein Versprechen gleichbleibender Preise. Teilweise fehlt die Hüllenware ganz, weitere Käufe würden Preise ändern. Ebenfalls ist der Betrag keine Reservierung für beliebig viele künftige Verluste der elf Sollplätze. Deshalb werden tatsächliche Käufe und Kosten zusätzlich gemessen:

| Fall | Fassung | tatsächliche Miner-Ersatzkäufe / ISK inkl. Gebühren | gesamter NPC3-Betrieb Soll / bezahlt | NPC3-Cashänderung seit Tag 90 | Stunden ohne gedeckte aktuelle Minerpflichten und Reserve |
| --- | --- | --- | --- | --- | --- |
| miner | control | 0 / 0 | 887 / 887 | 90 | 6600 / 6600 |
| miner | operating | 2 / 1497 | 1533 / 1116 | -367 | 6600 / 6600 |
| miner | replacement | 1 / 624 | 2569 / 1176 | -481 | 6600 / 6600 |
| handel-flotte | control | 8 / 5988 | 16196 / 15326 | -4141 | 6567 / 6600 |
| handel-flotte | operating | 6 / 4740 | 3807 / 3807 | -2981 | 6567 / 6600 |
| handel-flotte | replacement | 6 / 4740 | 3847 / 3847 | -3023 | 6574 / 6600 |
| station | control | 7 / 5613 | 4071 / 4071 | -4311 | 6575 / 6600 |
| station | operating | 6 / 4989 | 3266 / 3266 | -4213 | 6587 / 6600 |
| station | replacement | 6 / 4989 | 3266 / 3266 | -4213 | 6587 / 6600 |
| jagd | control | 6 / 4491 | 3370 / 3370 | -1824 | 6564 / 6600 |
| jagd | operating | 10 / 7236 | 14964 / 14964 | -782 | 6519 / 6600 |
| jagd | replacement | 4 / 3243 | 18768 / 3251 | -1828 | 6595 / 6600 |

**Die Elf-/Neun-Falle:** `fehlend()` vergleicht `klasse/heimat/ware`, nicht lediglich Anzahl und Eigentümer. Vor der Investition sind schon zwei bzw. im Stationsfall drei Sollplätze unbesetzt. Der Silizium-Carrier verlässt Nadir, liefert nach Aldera und verliert dort wegen fehlenden Vorkommens seinen `ware`-Förderauftrag. Er bleibt real vorhanden, erfüllt aber den Nadir-Silizium-Sollschlüssel nicht mehr. Unmittelbar nach der Investition sind daher drei bzw. vier Sollplätze offen. Ersatz kann zu mehr als elf vorhandenen Minern führen, während andere Schlüssel weiterhin fehlen. Das ist keine freie zusätzliche Transportkapazität und keine nachgewiesene neue Expansion, sondern Folge des vorhandenen Sollvergleichs und umgelenkter/gestrandeter Assets.

Bargelddeckung nach Hüllenkauf ist somit kein Beleg, dass ein separates Investitionsbudget **plus** alter Förderbetrieb finanziert sind. Im Kontroll-Flottenfall gehen 5.988 ISK für acht Miner-Ersatzkäufe aus derselben Kasse ab, im Stationsfall 5.613 für sieben, im Jagdfall 4.491 für sechs. Im Kontroll-Minerfall gibt es keinen solchen Kauf, weil die Finanzierung bereits fehlt. Die vollständigen Gegenbuchungen trennen Miner-Verkaufserlöse, Frachtergeschäfte, Betrieb, Abgabe, Zuschuss und echte Käufe; fremde Stations-, Fonds- oder Spielerkassen werden nicht als Kapitalgeber verbucht.

## Warum der neue Frachter nicht ersetzt wird

1. `createState()` legt aus der initialen Flotte feste Soll-Einträge an. NPC3 besitzt elf Förder-Sollplätze.
2. `shipActivate` verbraucht eine vorhandene Hüllenware und erstellt ein Schiff, **ergänzt aber keine Sollflotte**. `shipHandeln` ändert den Auftrag, nicht die Sollplanung. Darum ist in sämtlichen Verlust- und Endbudgets `registeredFreighters=0`.
3. `ersatzkauf` iteriert ausschließlich fehlende gespeicherte Sollschlüssel; der neue Frachter gehört zu keinem. Weder ein Gewinn noch verfügbares Cash erzeugt automatisch einen Ersatzauftrag.
4. Selbst mit Sollplatz müsste eine reale Hülle verfügbar, Cash inklusive Gebühr und Rücklage vorhanden sowie eine Route möglich sein. Solange NPC3 noch irgendein Schiff hat, gilt der Konzern nicht als `leer`; ein fehlender Frachter allein eröffnet keinen Hüllenzuschuss.
5. Die vorhandene Schleife kauft je Owner/Stunde höchstens ein fehlendes Schiff in gespeicherter Reihenfolge. Eine nach hinten angehängte Frachterrolle könnte durch ständig fehlende Minerplätze weiter verdrängt werden. Eine Registrierung allein ist daher keine nachgewiesene Lösung.

Ein späterer regulärer Investitionsentscheid müsste **als gesondert freizugebende Option** finanzierte Zielrolle, Heimat/Förderware, dauerhaft gespeicherten Sollplatz, Wiederbeschaffungsbedarf und Priorität konsistent mit dem bezahlten Kauf/Aktivieren festlegen. Bei Aufgabenwechsel eines erhaltenen Miners muss entschieden werden, ob der alte Sollplatz bewusst aufgegeben, neu besetzt oder das vorhandene Schiff zurückgeführt wird. Benötigt würden gemeinsame Reserven für bestehende Verpflichtungen, Waren und Ersatz mit echter Verfügungsprüfung; kein neuer Sollplatz samt unfinanzierter Ersatzpflicht. Hier wurde weder ein Sollplatz ergänzt noch eine Priorität umgestellt oder eine neue Insolvenzregel eingeführt.

## Trennung von Risiko, Unterdeckung, Planung und Insolvenz

| Ursache | Beleg | Was daraus nicht folgt |
| --- | --- | --- |
| Routenrisiko | Alle vier B1-Kontrollen werden von realen Meridian-Piraten mit eigenen HP null besiegt; Frachtverluste im Ledger. | Positive Marge garantiert kein Überleben. Gleicher Seed/andere Entscheidungen liefert keinen isolierten statistischen Risikoschätzer. |
| Kostenunterdeckung | Gebührenmarge lässt Betriebs-Soll, Leer-/Umpositionierungsfahrt und Ersatz außen vor; Kostenfilter verbessert nur einen Teil. Cashnull führt bei NPCs zu gedeckelter Zahlung, nicht automatisch zum Stop. | Länger lebendes, unbezahlt fahrendes Schiff ist kein tragfähiges Geschäft. |
| Flottenplanung | Elf alte Sollrollen, umgelenkter Miner fällt aus seinem Schlüssel; neuer Frachter ohne Sollplatz; gemeinsame Kasse finanziert Minerersatz. | Mehr Cash oder ein Registereintrag allein garantiert keinen finanzierbaren und erreichbaren Ersatz. |
| Mögliche Insolvenz | Gemeinsame Mittel reichen häufig nicht für momentane Verpflichtungen und nächste Hülle; diese Deckungslücken werden gemessen. | Es existiert kein bilanziertes Insolvenzverfahren, kein gespeicherter rückständiger Kredit und kein nachgewiesener Insolvenz-Trigger als Frachterverlustursache. |

**Nächste Untersuchungsgrenzen, keine Produktfreigabe:** Keine der beiden Routenfassungen als hinreichende Dauerbetriebskorrektur übernehmen. Die vorhandene Ausweich-/Absatzlogik und ihre bezahlte Risikowirkung separat prüfen; anschließend einen konsistent finanzierten Soll-/Aufgabenwechsel untersuchen. Eine echte gemeinsame Investitionsentscheidung müsste zuerst Kapitalbindung und die vorhandenen elf Förderrollen erklären. Es braucht dafür aus diesem Befund weder eine Spielerabgabe noch ein kostenloses Rettungsschiff. Eine zusätzliche Geldquelle ist hier weder eingeführt noch als notwendige Heilung dieser konkreten Verlustursache belegt.

## Abnahme, Reproduktion und Grenzen

Neu ausgeführt mit Node.js **22.23.4**:

- Vier rekonstruierte 90-Tage-Fundamente mit unverändertem Core: 17.280 stündliche Auditzeitpunkte über Messlauf/Replay, 360 Tageshashvergleiche; eigene #34-Start-Hashes bestätigt.
- **Zwölf 275-Tage-Fortsetzungen** (vier Fälle × drei Fassungen), jede mit eigenem uninstrumentierten Replay: **158.400 stündliche Auditzeitpunkte**, **3.300 tägliche Replayhashes**, vollständige kanonische Vergleiche und insgesamt **144 Save/Load-Roundtrips** an den sechs Messpunkten. Replay danach jeweils aus dem Save fortgesetzt, außer am Endpunkt. Zusätzlich vier Vorlauf-Roundtrips.
- Core-Audit plus unabhängige Geld-/Warenzählung, sichere nichtnegative ganzzahlige Kassen/Bestände und Einzelkassen-Gegenbuchungen. Beobachter kann nur protokollieren; die uninstrumentierte Wiederholung muss denselben Zustand ergeben. Drei Funktionsfassungen verwenden unveränderte Regeln, Preise, Rezepte, RNG und Tickreihenfolge. Quellen- und Werkzeughashes in Messdaten.
- **Vier vollständige B1-Tag-97-Kontrollhashes** wieder erreicht. Keine alten Messdaten verändert oder Erwartungswerte abgeschwächt. Fälle und Resultate werden vollständig im Summenwerkzeug verlangt.
- Pflichtbefehl `node --test tests/*.test.mjs` bestanden (lokale Sandbox: sechs Dateisuiten); zusätzliche sichtbare Einzelzählung **48/48 vorhandene Tests**, 0 Fehler, 0 übersprungen, 0 abgebrochen. Kein Ersatz für Safari-/NAS-Abnahme.

Die aktuellen vier Fälle sind gezielte Diagnosefälle, keine 13-Seed-Produktabnahme einer neuen Mechanik. Keine neuen Produktionsregeln, Geldquellen, Gebühren, Rettungsschiffe oder Spielerabgabe; vorhandene Kopfgeldquellen/Sicherheits-Senken laufen unverändert und werden bilanziert. Die Simulation gibt keine Garantie, dass jede mögliche Handelsstrategie scheitern muss. Die beiden isolierten Varianten sind nur in Testprozessen vorhanden und haben keine Save-Migration oder Produktfreigabe.

```sh
# Node.js 22, keine Pakete; main 906b797, Produktkern identisch mit ed94b891
git fetch origin 6855d76bb374dd777a1b7e30ea52c9a6eca36399 cec7f93758e4a499c238738ff50adac4416080d4
mkdir -p /tmp/b1-evidence /tmp/follow-b1
git archive 6855d76bb374dd777a1b7e30ea52c9a6eca36399 | tar -x -C /tmp/b1-evidence
git archive cec7f93758e4a499c238738ff50adac4416080d4 | tar -x -C /tmp/follow-b1
LONGTERM_SOURCE_COMMIT=6855d76bb374dd777a1b7e30ea52c9a6eca36399 node /tmp/b1-evidence/tools/npc-restart-v12.mjs --prepare --out=/tmp/follow-start
for fall in miner handel-flotte station jagd; do
  node tools/b1-dauerbetrieb.mjs --case="$fall" --evidence=/tmp/b1-evidence --b1=/tmp/follow-b1 --starts=/tmp/follow-start --out=/tmp/b1-dauer
done
node tools/b1-dauerbetrieb-summary.mjs /tmp/b1-dauer /tmp/dauerbericht
node --test tests/*.test.mjs
```

Endhashes der tatsächlichen neuen Messläufe an absolut Tag 365:

| Fall | Fassung | Hash |
| --- | --- | --- |
| miner | control | `9b00de8697541ce5` |
| miner | operating | `d049c908f643bf74` |
| miner | replacement | `5d8219f0d9cc6e21` |
| handel-flotte | control | `b2f44fef99f3d49e` |
| handel-flotte | operating | `5c21f8d94a786b7d` |
| handel-flotte | replacement | `016211add41aff8e` |
| station | control | `7f71d2546a4febfd` |
| station | operating | `8613b35ecc413697` |
| station | replacement | `8613b35ecc413697` |
| jagd | control | `dc4c66ea46aa08bb` |
| jagd | operating | `92a0df24fd29f691` |
| jagd | replacement | `4b5c2c433bb15d69` |

CI wird in Fundamentrekonstruktion, vier Falljobs und vollständige Verdichtung/Standardtests aufgeteilt. Rohartefakte enthalten alle Lebensereignisse sowie stündliche Budgetserien. Der tatsächliche CI-Status am PR-Head ist separat im PR zu dokumentieren; ein lokaler Lauf ist kein CI-Nachweis. `index.html`, Regelobjekt, Roadmap und Goldenwerte bleiben unverändert. Kein Merge und kein Deployment.
