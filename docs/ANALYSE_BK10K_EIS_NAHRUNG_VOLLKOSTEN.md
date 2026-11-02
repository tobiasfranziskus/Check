# B-K10k – echte Eisförderung, bezahlte Nahrungscharge, Transport und Endverbrauch

**[ANALYSE/DRAFT · 02.11.2026]** [PR #128](https://github.com/tobiasfranziskus/Check/pull/128), gestapelt auf #127 → #126 → #124 → #123 → #108. **[MAIN]** `b4e604d6`, v0.12.5 / Regel14 / Schema8 **unverändert**. Produktcode `index.html`, Preise, Löhne, Fonds, Emission, Regeln, Save, UI und Spielmechaniken bleiben unverändert. Die R15-/Schema9-Varianten sind weiterhin **nicht integriert**, die direkte Haushaltsbestellung ist ausschließlich eine explizite **Testhypothese**.

## Experiment und echte Herkunft

Anders als bei einer groben Kalkulation erfasst dieser Versuch **tatsächlich im Original-Core ausgeführte** Eislieferungen und Produktionschargen:

1. Seed42 und Seed7 starten als Original-R15-/Schema9-Welt mit realen NPC-Minern, Fabriken, Verbrauchern und Systemfonds. **Nur für den kontrollierten Ursprungstest** werden die **100 anfänglichen Eiseinheiten und 52 anfänglichen Nahrungseinheiten in Nadir entfernt** und `state.ledger[ware].initial` um genau diese Warenmengen vermindert. Das ist eine **explizite kontrafaktische Bestandsentfernung** und keine auf die reguläre Gesamtwirtschaft übertragbare Aussage. Keine Waren oder ISK erfunden.
2. Original autonome Frachter erhalten **bereits ab dem Experimentbeginn** testseitig `auftrag='halten'`, um den zuordenbaren Strom des **bestehenden Nadir-Eisminers** nicht durch zusätzliche Händler zu vermischen. Alle Miner einschließlich `sh009`, Stationen, Produktionslinien, Haushalte, Fondsauffüllungen, Piraten und Jäger laufen weiterhin im Original-Core. Dadurch sind die beiden frühen Seed42-/7-Versuche in den untersuchten Chargen **faktisch identisch**: keine Behauptung, zwei unterschiedlich funktionierende Gesamtwirtschaften gezeigt zu haben.
3. Ein **Testjournal** beobachtet die vom Original-Miner tatsächlich an Nadir verkauften Eislose, ihre **wirklich gezahlten Marktpreise**, und die **tatsächlich ausgezahlten** Miner-Betriebskosten. Per ausschließlich testseitiger FIFO-Zuordnung entfernt jeder **originale** Produktionsauftrag zwei **vorher real gekaufte** Eiseinheiten; nach sechs wirklich ausgeführten Produktionsminuten und **24 ISK tatsächlichem Vertragslohn** schreibt der Core eine Nahrungseinheit gut. Localer echter Nadir-Haushaltsverbrauch entfernt die entsprechend ältesten Nahrungslose; der Original-`shipTrade` des bestehenden Spielerfrachters kauft nur physisch vorhandene Nahrung mit nachgewiesenen Eis- und Fabrikbelegen. Die FIFO-Markierung verändert **keine** Entscheidung, Produktion, Preise oder Geldbuchung.
4. Ein bestehender Spielerfrachter fliegt **60 Minuten Aldera→Nadir und 60 Minuten zurück** auf Original-Flugverträgen, zusammen **499 ISK wirklich bezahlt**. Der Kunde kann die real gelieferte Ware in der Original-Stationsankaufvariante oder in der ausdrücklich **nur im Test** abgewickelten, durch echte vorhandene Haushalts-ISK vorher finanzierte Bestellung erhalten (Vertragsreserve, Originalzahlungs- und Nachweisbuch, stündlich höchstens echter Bedarf, reale Marktgebühren, keine doppelte Verbrauchsbuchung).
5. Eigene Geld- und Warenbilanzen werden zusätzlich zum Original-`core.audit` geprüft; echte Nahrungshistorie/Transit, Save/Load/Hash, deterministischer Seed42-Replay und vollständig erstattete **500-ISK-Bestellung ohne Lieferung** werden getestet. Der Miner hat für den untersuchten Vorlauf seine berechneten Arbeitskosten tatsächlich vollständig an die Original-Systemfonds gezahlt. Die **proportional der Charge zugerechneten** 48 Minuten Minerarbeit entsprechen bei 150 ISK/Stunde **120 ISK**; der Test stellt ausdrücklich sicher, dass mindestens diese Arbeitskosten wirklich zuvor gedeckt und bezahlt wurden. Diese Zuordnung ist keine separat persistierte Schiff-/Arbeitscharge im Produkt.

## Vollständiger Originalbeleg für 24 Nahrungseinheiten

Die konkrete 24er-Charge wird aus **48 zuvor tatsächlich an Nadir verkauften Eiseinheiten** hergestellt. Die Eispreise sind die **Original-Marktpreise zum Zeitpunkt der wirklichen Eisgeschäfte**, **nicht** ein späterer Durchschnittspreis oder eine hypothetische Rohstoffkostenannahme.

| Getrennte wirtschaftliche Perspektive | Seed42 | Seed7 |
|---|---:|---:|
| Eismenge im später verkauften FIFO-Nahrungslos | 48 | 48 |
| **Nadir → Miner: wirklich bezahlter Eisankauf** | **1.056 ISK** | **1.056 ISK** |
| Nadir → Fabrikhaushalt: 24 tatsächliche Löhne à 24 ISK | 576 ISK | 576 ISK |
| **Quellstation: nachgewiesener Chargeneinstand** | **1.632 ISK** | **1.632 ISK** |
| Händler → Nadir: wirklicher 24er-Nahrungskauf | **600 ISK** | **600 ISK** |
| **Quellstation: direkter Chargendeckungsbeitrag** | **−1.032 ISK** | **−1.032 ISK** |
| Verfolgte Minerarbeit: 48 min × 150/60 ISK | 120 ISK | 120 ISK |
| Miner: 1.056 Eisverkauf minus 120 anteiliger real finanzierter Arbeit | **+936 ISK** | **+936 ISK** |
| Wirklich bezahlte Spielerfrachterflüge, beide Richtungen | 499 ISK | 499 ISK |
| Endverbraucherlös bei 24er-Testbestellung | 1.296 ISK | 1.296 ISK |
| Händler-Cashflow nach beiden Flügen und Gebühren | **+125 ISK** | **+125 ISK** |
| **Zusammengefasster Zahlungsdeckungsbeitrag (Miner, Fabrik, Händler)** | **+29 ISK** | **+29 ISK** |

**Die Ebenen dürfen nicht verwechselt werden:** Die **1.056 ISK Rohstoff-Ankaufskosten** sind **eine tatsächliche Auszahlung der Station an den Miner** und erscheinen beim Miner zugleich als **realer Verkaufserlös**; sie dürfen im zusammengefassten Beitrag **nicht zweimal** abgezogen werden. Daher ist der über die drei beteiligten Akteure konsolidierte Beitrag: Endverbrauch **1.296** minus **576** Fabriklöhne minus **120** anteilig wirklich finanzierte Minerarbeit minus **499** reale Flugkosten minus **72** reale Handelsgebühren = **+29 ISK**. Hier sind Löhne, Gebühren und Betriebskosten **Zahlungen an andere Konten**, kein neu geschaffenes oder verschwundenes Geld. Der Beitrag beschreibt **nur diesen Leistungspfad und keine Gewinnschöpfung aus dem Nichts**. Er enthält weder Bergbau-/Frachter-Schiffskapital und -ersatz noch Fabrik-/Stationsinvestitionen, Risiken, Abschreibungen oder vollständige Konkurrenz-/Langzeitfolgen. Der genaue FIFO-Preis lässt den ursprünglichen Miner enorm profitieren, während die Station bei derselben Ware massiv unterdeckt ist.

**Wichtig für die Kausalität:** Die ungewöhnlich hohen **1.056 ISK für 48 Eis (22 ISK/Eis)** stammen aus dem kontrollierten Versuch mit **aus Nadir entfernten Startbeständen**. In einem normalen 72-Stunden-Nadir-Markt lag der aktuelle Eispreis aus B-K10i bei **10 ISK/Eis**, aber auch ein Marktwertansatz von **2 × 10 + 24 = 44 ISK/Nahrung** übersteigt den dortigen Nahrungspreis von etwa **26/36 ISK**. Ein solches Grenzpreissignal ist noch **kein chargengenauer Originalkaufnachweis** für die unveränderte Welt. Die starke Quelle-Unterdeckung dieses kontrollierten Versuchs belegt deshalb ein **konkretes Preis-/Lohn-/Lieferkettenrisiko**, keine universelle gemessene −1.032-ISK-Nadir-Gewinnmarge.

## Weitere originale Warenmengen

Die Gegenprobe mit nachgewiesener Ware und tatsächlich bezahlter 120-Minuten-Fahrt variiert ausschließlich die echte eingekaufte Endmenge. 48 Eis für 24 Nahrung bzw. proportionale Mengen; dieselben Original-FIFO-Inputpreise im selektierten Frühproduktionslos.

| Test-only direkte Bestellung | 8 Nahrung | 16 Nahrung | 24 Nahrung |
|---|---:|---:|---:|
| Wirklich bezahlte Eis-Einkäufe für die Charge | 352 ISK | 704 ISK | 1.056 ISK |
| Tatsächlich gezahlte Fabriklöhne für die Charge | 192 ISK | 384 ISK | 576 ISK |
| **Quellstation-Chargenbeitrag** | **−344 ISK** | **−688 ISK** | **−1.032 ISK** |
| Miner-Erlös minus zugeordnete bezahlte Original-Arbeit | +312 ISK | +624 ISK | +936 ISK |
| Händler-Cashflow nach 499 ISK Flug und Gebühren | **−291 ISK** | **−83 ISK** | **+125 ISK** |
| **Konsolidierter Deckungsbeitrag vor Schiffskapital** | **−323 ISK** | **−147 ISK** | **+29 ISK** |

**Eine 24er-Lieferung erreicht erst eine schmale positive Obergrenze bei voller Bezahlung**, verliert sie aber mit realem Kapitalverschleiß leicht wieder. Gleichzeitig bleibt **jede Quellstation-Charge stark negativ**. Kleinere Frachten tragen die festen Fahrtkosten nicht. Die originale Stationskasse kaufte in diesem frühen Kontrollstand ebenfalls alle 24 Einheiten, weil sie anders als in der späteren B-K10j-Tag3-Welt ausnahmsweise über ausreichende ISK verfügte. Eine Haushaltsbestellung liefert hier **keinen nachgewiesenen Zusatzabsatz** – ihr Vorteil aus B-K10j trat unter später knapper Stationskasse auf. Das sind zwei **unterschiedliche, klar abgegrenzte Versuchslagen**, nicht widersprüchliche Testergebnisse.

## Gegenprobe: normale aktive 72h-Welt ohne Bestandsänderung

Um den kontrollierten, wegen des leeren Eislagers sehr hohen 22-ISK-Originalankauf **nicht** auf die gesamte Wirtschaft zu verallgemeinern, wurde derselbe unveränderte R15-Testcore zusätzlich mit Seed42 und Seed7 **ohne jegliche Startbestands- und Flottenmanipulation** 4.320 Ticks ausgeführt; beide Original-Core-Warenaudits waren korrekt. Die **aktuellen** Original-Marktpreise wurden an allen drei existierenden Nahrungsfabriken gegenüber dem **aktuellen** Eis-Marktpreis multipliziert mit dem echten Rezeptbedarf von 2 Eis plus 24 ISK/Nahrung Fabriklohn gestellt:

| Original-Nahrungsfabrik nach 72h | Seed42 Eispreis / Nahrungspreis | Seed42 aktueller Rohstoff+Lohn-Abstand | Seed7 Eispreis / Nahrungspreis | Seed7 aktueller Rohstoff+Lohn-Abstand |
|---|---|---:|---|---:|
| Cyris | 11 / 53 ISK | **+7 ISK** | 14 / 59 ISK | **+7 ISK** |
| Nadir | 10 / 26 ISK | **−18 ISK** | 10 / 36 ISK | **−8 ISK** |
| Veldra | 13 / 46 ISK | **−4 ISK** | 14 / 40 ISK | **−12 ISK** |

Der Original-`m_core_preis.preis` berechnet den Marktpreis über das **relative Lager zum Stationsziel, den Regionalfaktor und vorgegebene Grenzen**. **Tatsächlicher Eis-Einstand, Fabriklohn, Frachterflug und Abschreibung gehen nicht in diesen Preis ein.** Dieser Quellcodebefund erklärt, warum auch in der unmanipulierten Welt eine *negative kalkulatorische Ersatzproduktionsmarge* möglich ist – allerdings bei **Cyris nicht**, wo das momentane Preissignal positiv ist. Das sind **Momentaufnahmen**: Bei Produktion, Abnahme und anderem Lagerstand ändern sich die Preise. Sie belegen **nicht**, dass die historischen bezahlten Chargen in der unmanipulierten Welt jeweils exakt diese Einkaufspreise hatten, oder dass Produktionsstopp automatisch die Versorgung verbessert.

**Produktkonsequenz nur als [OPTION]:** Eine kostendeckungsgeprüfte Produktions-/Beschaffungsdisposition darf keine Geld- oder Warenrettung sein; vor einer Freigabe müsste nachgewiesen werden, dass andere rentable Quellen tatsächlich die lokalen Nachfrage- und Versorgungslücken decken können und dass wegen Produktionsausfall keine dauerhaften Gesamtblockaden entstehen. Einzelne Unternehmen dürfen scheitern; andere Akteure müssen ihre Aufgaben übernehmen können. Ohne echte Flugkosten, vorhandene Haushaltskaufkraft und vollständige Schiffsersatzkosten ist eine einfache Preisuntergrenze noch keine Lösung.

## Fondsströme: reale Umverteilung, keine Gratisrettung

Das Original-`m_core_stunde.fonds` wird ausschließlich im Test journalisiert, an seinen **unveränderten** echten Transferstellen für Stations-Mindeststand und Überschüsse. Die echte `fonds→st_nadir`-Mindeststand-Zahlung summiert sich im jeweiligen untersuchten **Gesamtszenario** aus Produktionsvorlauf, beiden Flugphasen und zehn weiteren Verbrauchsstunden auf:

| Lauf | Fonds → Nadir, tatsächliche Umbuchungen |
|---|---:|
| Seed42, Originalstationsankauf | 4.963 ISK |
| Seed42, Haushaltbestellung | 5.135 ISK |
| Seed7, Originalstationsankauf | 5.259 ISK |
| Seed7, Haushaltbestellung | 5.259 ISK |

**Das sind Brutto-Transfers des gesamten Original-Szenarios**, nicht eine gezielt für das FIFO-Los erzeugte Unterstützung und keine neue ISK-Emission. Die Originalstationsfondsregel gleicht bereits Stationen ohne Besitzer bis zum Mindeststand auf. Im Untersuchungszeitraum konnte Nadir trotz **−1.032 ISK reinem Chargenbeitrag** weiterproduzieren und aus bereits vorhandenen Systemfonds erhebliche zusätzliche Kassenmittel empfangen. Ein langfristig tragfähiger NPC-Betrieb ist damit **noch nicht belegt**, denn allgemeine Mittelverschiebungen können lokale Verluste verdecken.


## B-K10k Zusatzgate: dieselbe Frühwelt ohne Fonds-Auffüllung

**[TEST DIREKT BESTANDEN, finalen GitHub-CI-Abschluss gesondert prüfen]** Der fünfte Test aus Commit [ea54beb](https://github.com/tobiasfranziskus/Check/commit/ea54beb30c1e743bcdd906920992d99079882cfd) reproduziert jeweils bei Seed42 und Seed7 **denselben ledger-auditierten ursprünglichen Zustand**, einmal mit der unveränderten aktiven Stationsfondsauffüllung, einmal **ausschließlich in der Test-Regelkopie** mit Mindeststand 0 und Fondsobergrenze 1.000.000.000 (keine Mindeststand-/Überschusszahlungen an Stationen). Alle Preise, NPC-Kassen, Rohstoff- und Produktionsregeln bleiben identisch, keine Testgutschrift. Beide Zustände laufen bis Minute 480 mit stündlichen Geld-/Waren-/Herkunftsaudits und Save/Load-/Hash.

| Nach 480 Minuten in Nadir | Original-Fonds | Ohne Fonds-Auffüllung |
|---|---:|---:|
| Original abgeschlossene Nahrungsproduktionszyklen | **63** | **32** |
| Tatsächlich bezahlte Fabriklöhne | **1.512 ISK** | **768 ISK** |
| Neu vom NPC-Miner verkaufte Eismenge | 253 | 189 |
| Original-Core-Eisankaufszahlungen | 4.065 ISK | 3.417 ISK |
| **Tatsächlicher Fonds→Nadir-Mindeststandtransfer** | **3.890 ISK** | **0 ISK** |
| Nadir freie Stations-ISK | 2.500 | **94** |
| Neues, nach lokalem Konsum lagerndes Essen | 50 | 19 |
| **Nach Original-Core-Reserve für Export freigegebene Nahrung** | **24** | **0** |

**Unabhängige Geldbilanz:** Innerhalb desselben Seeds besteht **in beiden Varianten dieselbe gesamte ISK-Menge** (Seed42 54.320; Seed7 53.840). Der Unterschied ist ausschließlich die Weiterleitung von **bereits vorhandenen** Fondsmitteln, nicht die Erzeugung von ISK. Direkter Kausalbefund: Im isolierten frühen Nadir-Testlauf ermöglicht die ursprüngliche Fondsauffüllung die 24er-Liefermenge; ohne diese Auffüllung sind die lokale Produktions- und Ankaufkasse bei 94 ISK und die über Originalreserve handelbare Nahrungsmenge bei null. **Das beweist keinen Dauerverlust oder Insolvenz in der normalen autonomen Gesamtwirtschaft.**

**Wichtige Grenze:** Der zur Chargenidentifikation **entfernte Anfangs-Eisbestand** verursacht am Anfang außergewöhnlich hohe originale Eis-Knappheitspreise (**22 ISK** pro erstem attribuiertem Eisstück). Der reale normale Nadir-Bestand nach drei Tagen war in B-K10i viel höher, und der damalige Eispreis lag nur bei **10 ISK**. Die konkret beobachteten **−1.032 ISK** sind daher eine **Faktenrechnung für diesen Isolationstest**, **kein ungeprüfter allgemeiner Preisfehler in jeder normalen R15-Welt**. Der nächste Nachweis muss genau dies **in unveränderten aktiven Originalwelten** abgrenzen, mit sauberer Altbestandsbewertung. Ebenso sind 3.890 ISK Fondsaufstockung **nicht** die exakt zuordenbare Finanzierung nur der 24 exportierten Nahrungseinheiten: Nadir stellte bis Minute 480 63 Einheiten her, konsumierte weitere lokal und kaufte Eis für zusätzliche Produktion.

## Status und Nächstes

**[TEST BESTANDEN]** Die vollständige [GitHub-CI #41475270954](https://github.com/tobiasfranziskus/Check/actions/runs/41475270954) auf dem finalen B-K10k-Testcode [ea54beb](https://github.com/tobiasfranziskus/Check/commit/ea54beb30c1e743bcdd906920992d99079882cfd) ist **erfolgreich abgeschlossen: 165/165 Node-Tests, 0 Fehler**. Alle ausgeführten historischen v10–v14-/Geografie-Referenzjobs sind ebenfalls grün; ein separater Sicherheitsgeografie-Vergleich wurde **planmäßig übersprungen**, nicht als bestanden ausgegeben. Die fünf B-K10k-Tests umfassen echte Quelllose, Original-Fabriklohn, echte beidseitige Flüge, Seed42-Replay, Storno, Mengenstaffel und den kontrollierten Fonds-Gegenversuch. **Keine iPad-/NAS-Abnahme.** Nach dem getesteten Code folgten ausschließlich Dokumentationsänderungen. Noch **keine** 13 Seeds × 90 Spieltage, kein spielbare Spieler-/NPC-Bestellsystem-Design, keine vollständige echte Hull-/Werft-/Piratenverlustkostenaudit und keine iPad-/NAS-Abnahme.

**[NÄCHSTES GATE]** Preisrelation der Produktion bei *unverändert aktiver autonomer Wirtschaft* gegen tatsächliche Eis-Ankaufslospreise, Lohnreserve und echter Nahrungsabgabe prüfen. Keine produktive Preis-, Produktions-, Lohn-, Nachfrage-, Fonds- oder Emissionsregel ohne **ausdrückliche Nutzerentscheidung**. Keine Geldobergrenze, individuelle Insolvenzrettung, kostenlose Waren oder Doppelwirtschaft.

[Testsource](../tests/bk10k-reale-eis-nahrung-vollkosten.test.mjs) · [vorheriges B-K10j-Bestellgate](ANALYSE_BK10J_HAUSHALTSBESTELLUNG.md)
