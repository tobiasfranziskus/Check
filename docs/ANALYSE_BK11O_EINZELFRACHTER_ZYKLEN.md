# B-K11o – Wiederholte reale NPC-Einzelfrachtergeschäfte ohne Querfinanzierung

**[ANALYSE/DRAFT · 03.11.2026]** [PR #153](https://github.com/tobiasfranziskus/Check/pull/153), gestapelt auf #152 → #151 → #150 → #149 → #148 → #147 → #146. **[MAIN]** `b4e604d6`, v0.12.5 Regel14/Schema8 unverändert. Historischer isolierter R15-/Schema9-Testkern; keine Preis-/Lohn-/Fonds-/Geld-/Save-/Produktregeländerung, keine individuelle Rettung, kein Merge/Deployment.

## Fragestellung, echte Grenzen

B-K11l belegt, dass ursprüngliche positive Warenmargen der NPC-Flotte nicht deren reale Fahrtkosten tragen; B-K11m/n zeigt, dass ein alleiniger Einweg-Flugkostenfilter die gesamte Versorgung nicht repariert. B-K11o sucht **den ersten positiv belegten einzelnen Handelsbetrieb**: eine Frachteridentität, mindestens zwei wirklich von ihr gekaufte und von ihr später verkaufte Chargen, vollständig aus echter Konzernkasse bezahlte Frachterarbeit, keine Netto-Auszehrung des Eigentümers, kein versteckter Ersatz-/Querzufluss. Das beweist *noch nicht*, dass dieselben Waren an einer bedürftigen Station aus neuer lokaler Haushaltskaufkraft verzehrt wurden.

Aus denselben B-K11j-Saves (Tick3960, Seed42/7, vollständige vorherige Lieferungen) wird jeweils **nur einer** der fünf früher künstlich angehaltenen NPC-Händler sh014–sh018 zum vorhandenen Original-Autohandel freigegeben; alle anderen historischen NPC-Frachter bleiben zunächst angehalten. Je Schiff/Seed **Originalroute** und **B-K11m-Einwegkostenroute** für 48 Stunden, mithin 2×5×2=**20 echte Core-Gegenwelten**. Alle normalen Bergbau-/Industrie-/Haushalt-/Piraten-/Ersatzkauf-Mechaniken bleiben aktiv. Beobachtet werden **wirklich gebuchte Handels- und Gebührenbeträge, originale Frachter-Flugreserven, FIFO-Kauf-/Verkaufslose, Anfangsladung, offene Endladung, Konten, reale Schiffsverluste und sämtliche sechs Lebensmittel-Verbrauchsstationen**; stündliche unabhängige Core-Geld-/Waren-/Herkunftsaudits und täglicher Save-/Load-Hash.

**Wichtige Einschränkung:** Das Spiel kauft zerstörte NPC-Frachter nach vorhandenen Originalregeln wieder nach. Neubauten können wieder selbst handeln! Bei zerstörten Ausgangsfrachtern enthält die Konzernkasse daher **auch tatsächliche Ersatzkauf- und andere Schiffsgeschäfte**. Diese Fälle werden durch die testseitig protokollierte Eigentümer-Fahrzeugidentität sichtbar **disqualifiziert**; nicht als isolierter Frachter-Erfolg ausgegeben. Eventuell verbleibende Kontendifferenzen, etwa aus Piraterie, werden ausgewiesen. Es gibt keine erfundenen eigenen Pilotenbankkonten.

## [TEST] Zwei Seeds, alle fünf Schiffe und beide Routengates, 48h

**[TEST]** [Gezielte CI #41669910485](https://github.com/tobiasfranziskus/Check/actions/runs/41669910485), **14/14 Node-Tests bestanden**, darunter 20 Einzelhändler-Welten; volle Geld-/Waren-/Herkunftsaudits und Save-/Load-Hash. Alle zuvor festgelegten B-K11j/k/l/m/n-Referenzen reproduziert.

| Belegbarer positiver Kandidat | Seed7, sh015, Einweg-Flugkostengate |
| --- | ---: |
| Original-Core-Käufe | **23** |
| Original-Core-Verkäufe | **23** |
| Vollständig tatsächlich verkaufte, zuvor gekaufte FIFO-Chargen | **23** |
| Stückweise nicht wieder verkaufte gekaufte Ware am Ende | **0** |
| Originale tatsächliche Frachter-Flugbuchungen | **45** |
| Eigentümer NPC1 Startkasse | **3.000 ISK** |
| Eigentümer NPC1 Endkasse | **4.747 ISK** |
| **Echtes Ergebnis nach Waren, Gebühren und allen gebuchten Flügen** | **+1.747 ISK** |
| Einkünfte anderer NPC1-Frachter / sonstige aktive NPC1-Flüge | **0 ISK / 0 ISK** |
| Fonds-/NPC-Überschuss-Abgaben | **0 ISK** |
| NPC1-Kontendifferenz unerklärt | **0 ISK** |
| Ursprüngliches Schiff überlebt bis Tick6840 | **Ja** |
| NPC1-Kauf neuer Ersatzfrachter | **0** |
| Im selben Marktzeitraum von sh015 tatsächlich an Aldera gelieferte Nahrung | **0** |
| An Verbraucherstation Dravos von sh015 echt verkaufte Nahrung | **9 Einheiten** |
| Endhash | `64644f6b43a2e824` |

**[KAUSAL POSITIV]** Somit existiert in dieser historischen Testwelt tatsächlich **ein wiederholt handelnder, selbstfinanzierter NPC-Einzelfrachter**. Mehrmalige vollständig bezahlte Geschäfte und Weiterfahrten sind kein bloßes theoretisches Routensignal. Die Original-Concurrency/Kapitalfrage ist hier aufgelöst: nur **ein** alter Händler ist aktiviert und es gibt **keine** weiteren NPC1-Handelsbuchungen, keinen Ersatz und keinen unaufgeklärten Konto-Zufluss.

**[KAUSAL GRENZE]** sh015 lieferte in 48 Stunden keine Nahrung nach **Aldera**, aber **9 wirklich durch die Station bezahlte Nahrungseinheiten nach Dravos**. Eine Stationslieferung ist nicht automatisch deren anschließender aus *genau dieser* Fracht finanzierter Haushaltsendkauf. Es ist damit **noch nicht** der gesuchte lückenlos belegte Eis→Nahrung→bezahlter Verbraucher-Kreislauf. Auch die Belastbarkeit bei Piraten, Hüllenersatz und konkurrierenden Händlern ist nicht allgemein bewiesen.

Die übrigen **19** Einzelfrachter-Kontroll-/Kosten-Arme erfüllen das strenge kombinierte Gate nicht. Seed42 kein positiver isolierter Kandidat, Seed7 genau einer. Viele ursprüngliche Frachter verkaufen zwar ebenfalls mehrmals echt und erzielen positive reine Handels-Fahrt-Ergebnisse, gehen aber **verloren und lösen Original-Schiffersatzkosten/weitere Händleraktivitäten** aus. Ihre Eigentümer-Kassenentwicklung darf **nicht** dem einen Ausgangs-Frachter zugerechnet werden. Beispiel Seed42 sh014 Original: 18 vollständig wieder verkaufte Chargen, nach Waren/Fees/Flug **+2.836 ISK**, aber Ausgangsfrachter verloren, neue Frachter mit Original-Core gekauft, Eigentümer 3.000→3.065 ISK; **kein** dauerhafter Einzelschifferfolg.

**[GELDAUDIT]** In dieser freieren Einzelfrachter-Konstellation können bestehende Kopfgeldemission und Spiel-Geldsenken unterschiedlich hoch ausfallen; die Weltgeldmenge muss deshalb **genau** `50.000 + tatsächliche neue Core-Emission − tatsächliche Core-Senke` ISK ergeben, nicht mechanisch in jeder Gegenwelt 50.000 ISK. Der erste fehlerhafte Testlauf behauptete das, wurde korrigiert und **ist nicht bestanden**; die spätere CI #41669910485 ist tatsächlich erfolgreich.

## [TEST] 7-Tage-Fortsetzung desselben einzelnen Frachters – kein dauerhafter Erfolg

Die gezielte [B-K11o-CI #41670339064](https://github.com/tobiasfranziskus/Check/actions/runs/41670339064) hat **15/15 Tests bestanden**. Darin wurde der Seed7-Frachter sh015 nicht aus seinem Gewinner-Save, sondern **aus demselben initialen Tick3960-Drittlieferungs-Save** mit unverändertem Original-Core noch einmal über *sieben Tage* gestartet, je einmal mit Original- bzw. Einwegflugkosten-Wertung:

| Sieben Tage, Seed7, nur sh015 zu Beginn aktiviert | Originalroute | Einweg-Flugkostenroute |
| --- | ---: | ---: |
| Vollständig gekaufte und danach wirklich verkaufte Chargen | 21 | **35** |
| Netto seiner ursprünglichen Handels- und Vertrags-Fahrten | **+2.528 ISK** | **−942 ISK** |
| Reale NPC1-Gesamtkasse am Ende | 2.046 ISK | **926 ISK** |
| Ausgangsschiff sh015 endgültig zerstört bei Tick | **5.220** | **9.420** |
| Danach vom Original-Core nachgekaufte NPC1-Frachter | 2 | 1 |
| Von sh015 an Dravos tatsächlich verkaufte Nahrung | 21 | **34 Einheiten** |
| Von sh015 an Meridian tatsächlich verkaufte Nahrung | 0 | **12 Einheiten** |
| In Dravos aus der Gesamtstation real bezahlte neue Nahrung | 7 | **9 Einheiten** |
| Nahrung-Mangelstunden sechs Verbrauchsstationen / 1.008 | **870** | **878** |
| Weltgeld inklusive Escrow | unabhängig auditiert | unabhängig auditiert |
| Gepinnter 7d-Zustandshash | `84f43afea49bf8e2` | `00920e2a5507b371` |

**[ENTSCHEIDENDER NEGATIVBEFUND]** Derselbe 48 Stunden nachweislich profitable Einzelhändler **trägt sich nach sieben Tagen nicht mehr**. Der Frachter fährt echte lukrative Geschäfte, wird schließlich zerstört und lässt Original-Nachkäufe und Folgekosten entstehen. Über sieben Tage verliert der ursprüngliche Einzel-Frachter sogar **942 ISK durch den Handel nach Flugkosten**; zusammen mit realem Ersatz-/Zusatzbetrieb fällt der NPC1-Kassenstand von 3.000 auf 926 ISK. Die eigentlich geforderte **dauerhaft selbsttragende Versorgung** ist nicht bewiesen. Der tatsächliche real bezahlte Nahrungsendverbrauch Dravos von 9 Einheiten ist ein **Stationsgesamtwert**: Er darf nicht ohne einen weiteren FIFO-Nachweis vollständig der konkreten sh015-Nahrung zugerechnet werden.

Der Verlauf ist dennoch ein belegter konstruktiver Ansatz: Im 48h-Fenster können **23** vollständige, real finanzierte und ausschließlich auf einen Händler bezogene Handelszyklen funktionieren. Das als Produktregel zu verallgemeinern wäre verfrüht, weil bereits die Folgefrist das Scheitern zeigt.

## Grenzen und nächstes kausales Gate

**[TESTSTATUS]** Im bereits ausgeführten 7d-Gegenversuch ist sh015 bei Tick 9.420 real zerstört worden. In der langen Gegenwelt überwiegen gebuchte reale Ausgaben und Ersatzkosten die Einnahmen. Zwei CI-Läufe mit der erweiterten Testmethodik sind erfolgreich (#41669910485: 14/14; #41670339064: 15/15). Die nachträglich verschärften Hash-, Dravos-Haushalts- und Verlustzeitpunkt-Gates sind auf dem jeweils neuesten Head separat zu prüfen.

**[NÄCHSTE OPTION]** Aus den 48h kaufmännisch erfolgreichen, aber nach sieben Tagen nicht dauerhaft tragfähigen sh015-Lieferungen eine **konkrete Endabnehmerroute** überprüfen: Wer kauft die gelieferte Nahrung zu welchem echten Stationsbudget, wann entsteht daraus lokaler Haushaltslohn, wie finanziert der Händler seine **nächste** bezahlte Fahrt und wie gehen Piraten-/Schiffersatzkosten in dieselbe Ertragsrechnung ein? Ohne das wären neue Routenregeln oder Geldemission voreilig. Die 48h-Spezialprobe ist **keine** 13×90d-Normalökonomie, iPad-/NAS-Abnahme oder R15-/Schema9-Produktfreigabe.
