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
| Endhash | `64644f6b43a2e824` |

**[KAUSAL POSITIV]** Somit existiert in dieser historischen Testwelt tatsächlich **ein wiederholt handelnder, selbstfinanzierter NPC-Einzelfrachter**. Mehrmalige vollständig bezahlte Geschäfte und Weiterfahrten sind kein bloßes theoretisches Routensignal. Die Original-Concurrency/Kapitalfrage ist hier aufgelöst: nur **ein** alter Händler ist aktiviert und es gibt **keine** weiteren NPC1-Handelsbuchungen, keinen Ersatz und keinen unaufgeklärten Konto-Zufluss.

**[KAUSAL GRENZE]** sh015 lieferte in 48 Stunden keine Nahrung nach **Aldera**, obwohl andere Lebensmittel-Endkäufe in der Welt stattfanden. Es ist damit **noch nicht** der gesuchte vollständige Eis→Nahrung→bezahlter Verbraucher-Kreislauf. Auch die Belastbarkeit bei Piraten, Hüllenersatz und konkurrierenden Händlern ist nicht allgemein bewiesen.

Die übrigen **19** Einzelfrachter-Kontroll-/Kosten-Arme erfüllen das strenge kombinierte Gate nicht. Seed42 kein positiver isolierter Kandidat, Seed7 genau einer. Viele ursprüngliche Frachter verkaufen zwar ebenfalls mehrmals echt und erzielen positive reine Handels-Fahrt-Ergebnisse, gehen aber **verloren und lösen Original-Schiffersatzkosten/weitere Händleraktivitäten** aus. Ihre Eigentümer-Kassenentwicklung darf **nicht** dem einen Ausgangs-Frachter zugerechnet werden. Beispiel Seed42 sh014 Original: 18 vollständig wieder verkaufte Chargen, nach Waren/Fees/Flug **+2.836 ISK**, aber Ausgangsfrachter verloren, neue Frachter mit Original-Core gekauft, Eigentümer 3.000→3.065 ISK; **kein** dauerhafter Einzelschifferfolg.

**[GELDAUDIT]** In dieser freieren Einzelfrachter-Konstellation können bestehende Kopfgeldemission und Spiel-Geldsenken unterschiedlich hoch ausfallen; die Weltgeldmenge muss deshalb **genau** `50.000 + tatsächliche neue Core-Emission − tatsächliche Core-Senke` ISK ergeben, nicht mechanisch in jeder Gegenwelt 50.000 ISK. Der erste fehlerhafte Testlauf behauptete das, wurde korrigiert und **ist nicht bestanden**; die spätere CI #41669910485 ist tatsächlich erfolgreich.

## Noch offenes Versorgungs-Gate

Nach dem 48h-Erfolg ist zusätzlich ein **siebentägiger Original-gegen-Hinflugkosten-Fortsetzungstest** für den nachweislich profitablen sh015/Seed7 aus **demselben Start-Save** als weiterer Test eingefügt. Dort sind Überleben, echte Handelsabschlüsse, neuer Schiffskauf, Solvenz und Zielstationen real verkaufter Nahrung samt tatsächlicher Endkäufe zu prüfen. Ein späterer Verlust ändert die Einzelnachweise der ersten 48h nicht, begrenzt aber deren Haltbarkeit. **Keine CI für diesen Folgeversuch als bestanden behaupten, bevor er ausgeführt wurde.**

**[NÄCHSTE OPTION]** Aus dem belegten wirklich profitablen Einzelfrachter eine **konkrete Endabnehmerroute** überprüfen: Wer kauft die gelieferte Nahrung zu welchem echten Stationsbudget, wann entsteht daraus lokaler Haushaltslohn, wie finanziert der Händler seine **nächste** bezahlte Fahrt und wie gehen Piraten-/Schiffersatzkosten in dieselbe Ertragsrechnung ein? Ohne das wären neue Routenregeln oder Geldemission voreilig. Die 48h-Spezialprobe ist **keine** 13×90d-Normalökonomie, iPad-/NAS-Abnahme oder R15-/Schema9-Produktfreigabe.
