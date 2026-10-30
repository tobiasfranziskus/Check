# Aphros Void – B1: vollständige Handelszyklus- und Sektorbilanz

**30.10.2026 · [ANALYSE/DRAFT] · Produktbasis main `ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`, v0.12.3, Regeln 12, Schema 8.** Grundlagen: AGENTS.md und Roadmap/Projektstatus an dieser Basis, [Architektur-PR #35](https://github.com/tobiasfranziskus/Check/pull/35) (`b9a6c1f`), Diagnose-PRs [#32](https://github.com/tobiasfranziskus/Check/pull/32), [#33](https://github.com/tobiasfranziskus/Check/pull/33), [#34](https://github.com/tobiasfranziskus/Check/pull/34). Keine Produkt-, Regel-, Roadmap- oder Goldenwertänderung. Werkzeuge und CI sind ausschließlich Entwicklungsanalyse.

## Ergebnis

**Ein real finanzierter Einstieg ist in allen vier untersuchten Zuständen ohne fremde Kassen und ohne Geldschöpfung durch den Versuchsaufbau möglich:** Der bestehende Minerkonzern NPC3 liefert eigene vorhandene Siliziumfracht mit einem eigenen Miner an Aldera, bezahlt dessen Betrieb, kauft eine vorhandene Frachterhülle, aktiviert sie und lässt sie regulär handeln. Es werden weder Cash noch Fracht, Eigentum oder Schiffe direkt gesetzt. Für genau diesen Einstieg beträgt die zusätzliche externe Finanzierungslücke **in allen vier Fällen null**. Die ersten Warenkäufe und bezahlten Verkäufe werden tatsächlich ausgeführt.

**Das ist kein dauerhaft tragfähiger Wiederanlauf.** Alle vier neu aktivierten Frachter gehen innerhalb sieben Tagen verloren. Am Ende besitzen NPC1/NPC2/NPC3 in allen vier Versuchen null Frachter; im Flottenfall bleiben zusätzlich 870 ISK zivile Sollkosten unbezahlt. Der neue Frachter wird durch `shipActivate` nicht in NPC3s Sollflotte aufgenommen und daher nach Verlust nicht automatisch ersetzt. Die neun alten Miner-Sollplätze konkurrieren hingegen tatsächlich um dasselbe Geld. Die externe Aufgabenentscheidung für NPC3 ist ein neues **Testbefehlsband**, keine bereits vorhandene autonome Konzernstrategie und keine freigegebene Spielregel.

Für NPC1/NPC2 besteht unverändert eine Finanzierungssperre: Ihr eigenes Geld und der allein erlaubte Aldera-Fonds reichen nicht einmal für die erste Hülle. Die kleinste untersuchte statische, vollständig vorfinanzierte Frachterroute benötigt einschließlich Hülle 1.224 bzw. im Stationsfall 1.536 ISK; das ist ein **bedingtes Budget unter eingefrorenen Angeboten**, kein gemessenes minimales Startkapital für dauerhaft wiederholbaren Betrieb. Ein solches globales Minimum lässt sich aus diesen vier Zuständen ohne festgelegten Geschäftsplan, Finanzierungsrechte und Verlustabsicherung nicht als einzelne Zahl beweisen.

## Methode und Reproduktion

[B1-Werkzeug](../tools/b1-handelszyklus.mjs), [gemessene Verdichtung](data/b1-handelszyklus-v12.json), [eigener Analyseworkflow](../.github/workflows/b1-handelszyklus.yml). Die JSON ist ein Messprotokoll, keine Golden-Fixture. Vollständige Rohdaten mit allen Transferereignissen und Endzuständen werden lokal erzeugt und im Workflow als Artefakt gesichert.

Die bereits in #34 vorhandene Vorbereitung wurde **neu ausgeführt**: vier 90-Tage-Vorläufe mit Instrumentierung, unabhängigem uninstrumentierten Replay, stündlichen unabhängigen Geld-/Waren-/Einzelkassenaudits und täglichem Hashvergleich. Werkzeuge und Daten werden an `6855d76bb374dd777a1b7e30ea52c9a6eca36399` gepinnt. Danach je Zustand sieben Tage unveränderte Kontrolle und sieben Tage mit genau vier zusätzlichen validierten Befehlen, jeweils erneut mit uninstrumentiertem Replay. Keine Varianten aus #33/#34 aktiviert. Der Beobachter verändert ausschließlich Beobachtungshooks, der Replay enthält den unveränderten extrahierten Produktionskern.

Befehle: an Tick 129601 eigener Silizium-Miner nach Aldera; nach Ankunft an 129662 eine Frachterware kaufen; 129663 aktivieren; 129664 `shipHandeln`. Der Miner wird nach stabiler ID ausgewählt; es ist jeweils ein Nadir-Miner mit 100 Silizium. Zeit bis Aldera 60 Ticks. `foerdern` bleibt während der Reise erhalten: tatsächlich 150 ISK Betrieb an Tick 129660, keine ausgenutzte gehaltene Gratisreise. In Aldera fehlt das Siliziumvorkommen, daher stoppt die Förderung nach Core-Regel. Ankunft entlädt automatisch gegen vorhandene Stationskasse; nicht verkäufliche Restfracht bleibt Eigentum von NPC3. Der autonome Frachter bezahlt regulären Betrieb.

Neu geprüft: vier Vorläufe = 17.280 stündliche Auditzeitpunkte über Messlauf/Replay, 360 Tageshashvergleiche; acht Fortsetzungen = 2.688 stündliche Auditzeitpunkte, 56 Tageshashvergleiche. Je Fortsetzung Save/Load nach Tag 1 und 7; Replay wird nach Tag 1 tatsächlich daraus fortgesetzt, insgesamt 16 neue Fortsetzungs-Roundtrips plus vier Vorlauf-Roundtrips. Vollständige kanonische Gleichheit am Ende, stündliche Hashgleichheit in der Fortsetzung. Die Start-Hashes entsprechen #34 einschließlich dessen wartender Queue:

| Fall / Seed | Tag-90-Hash | Eingriff nach sieben Tagen |
| --- | --- | --- |
| miner / 42 | `10b078947304c198` | `36a2639992dc7d21` |
| handel-flotte / 42 | `bf5d35d6619d23d8` | `63eca4d5b13942a2` |
| station / 1234 | `527466bdec8ffcf2` | `168b4503b56ea64f` |
| jagd / 98765 | `cc18b0c15974aa7f` | `ef4f17f9ddfd77e5` |

Die Kontrollen zeigen in allen vier Fällen null Kassenänderung und keinen NPC-Handelsneustart. Zeit-, Mangel-, Kosten- und Meridian-Statistiken laufen trotzdem weiter; „null Kassenänderung“ bedeutet keine Zustandsidentität über Zeit. Die Rekonstruktion ist neue Ausführung bestehender Werkzeuge; sie wird nicht als neue #32–#34-Jahresprüfung ausgegeben.

```sh
# Node.js 22, im Repository; keine Pakete installieren
# Falls der gepinnte Diagnosecommit lokal fehlt:
git fetch origin 6855d76bb374dd777a1b7e30ea52c9a6eca36399
mkdir -p /tmp/b1-evidence
git archive 6855d76bb374dd777a1b7e30ea52c9a6eca36399 | tar -x -C /tmp/b1-evidence
LONGTERM_SOURCE_COMMIT=6855d76bb374dd777a1b7e30ea52c9a6eca36399 node /tmp/b1-evidence/tools/npc-restart-v12.mjs --prepare --out=/tmp/b1-start
node tools/b1-handelszyklus.mjs --evidence=/tmp/b1-evidence --starts=/tmp/b1-start --out=/tmp/b1-result.json
node --test tests/*.test.mjs
```

Der B1-Runner erzwingt SHA-256 des Produktions-HTML, Diagnosebeobachters und der #34-Daten; Befehlsausführung, Replaygleichheit, nichtnegative sichere Ganzzahlen sowie Einzelkassen- und Warenerhaltung sind Assertions. Er schreibt Werkzeug-/Quellhashes, tägliche Hashes, Konten, Lager, Ledger, Produktionsmengen, tatsächliche Käufe und Kosten. Alle Cashtransfers sind im Rohprotokoll; die Verdichtung behält zusätzlich NPC3s Waren-/Kosten-/Verlustereignisse. Geld- und Warenidentität werden unabhängig vom Core-Audit nachgezählt. Kein zweiter Wirtschaftskern und keine Laufzeitabhängigkeit.

## Sektorliquidität und Rechte an Finanzierung

Anfangsbestände, ISK; Spaltenfolge innerhalb der Zelle wie im Tabellenkopf:

| Fall | Spieler / Stationen / Fonds / Händler / Miner / Piraten / Sicherheit |
| --- | --- |
| miner | 42795 / 5238 / 1258 / 132 / 481 / 96 / 0 |
| handel-flotte | 39762 / 4466 / 1300 / 0 / 4395 / 77 / 0 |
| station | 30505 / 6151 / 720 / 0 / 4357 / 267 / 0 |
| jagd | 40455 / 7337 / 57 / 165 / 1828 / 158 / 0 |

Diese Summen sind **keine freie Kreditlinie**. NPC1/NPC2 besitzen keine Schiffe, NPC3 besitzt neun Miner mit gebundenem Sachkapital. Der Spieler hat im Minerfall einen gehaltenen leeren Frachter; in den anderen Fällen keinen Frachter. Seine Fracht/Kasse dürfen nicht automatisch für NPCs eingesetzt werden. Der Versuch nutzt sie nicht als Kapitalgeber. Im Stationsfall kann sich Spielercash durch die bestehende Dividende ändern, ohne einen Finanzierungsauftrag des Versuchs.

| Geldgeber | Tatsächlicher heutiger Pfad / Verpflichtung | Für NPC-Handelsneustart verfügbar? |
| --- | --- | --- |
| NPC1/NPC2 | Eigene Kasse 0/132, 0/0, 0/0 bzw. 165/0; Sollflotten 3/2 | Eigenes Geld ja, aber nicht ausreichend für eine Hülle. Kein allgemeiner Kredit-/Investitionsbefehl. |
| Aldera-Fonds | 0 / 0 / 720 / 57; `zuschuss` nur bei vollständiger Hüllendeckung | Finanzierungslücken für den Zuschuss bleiben bestehen. Die Teildeckung wird nicht ausbezahlt. |
| Andere Fonds | Gesamtsummen 1.258 / 1.300 / 720 / 57 | Kein produktiver Fonds-Pool. Lokale Auffüllung bis 2.500 und Überschussverteilung über 1.500 beanspruchen Mittel; Wiederverwendung derselben Reserve für mehrere Käufer wäre Doppelzählung. |
| Stationskonten | Tatsächliche Warenkäufer, Lager-/Grundverbrauch, Fondsbedarf; im Stationsfall Aldera zusätzlich Eigentum/Dividende | Einkaufsliquidität und oft unter Mindeststand. Kein frei verfügbares Investitionskonto; nur durch echte Lieferung erhält ein Verkäufer Geld. Aldera bezahlt hier Silizium, keine Unternehmensrettung. |
| NPC3 | Eigene Kasse, neun reale Miner-Sollplätze, deren Betrieb und Ersatz | Für eigene Käufe nutzbar, nicht automatisch an NPC1/NPC2 übertragbar. Im Versuch muss NPC3 zusätzlich seine tatsächlich wieder einsetzenden Miner bezahlen/ersetzen. |
| Spieler | Eigenes Vermögen und Investitionsfreiheit | Kein automatisches Verfügungsrecht und kein allgemeiner Kapitaltransferbefehl. Im Versuch keine Spielerfinanzierung. |
| Piraten / Sicherheit | Piratenbeute/Ersatz bzw. null Sicherheitscash mit laufenden ungedeckten Sollkosten | Keine legitime freie Handelsfinanzierung. Kopfgeld ist bestehende Quelle, aber kein Anfangskredit. |

Unbezahlte Sollkosten sind im heutigen Core keine gespeicherten Gläubigerforderungen. Eine Fonds-Zielgröße ist ebenfalls keine vertragliche Schuld. Beides muss dennoch als konkurrierender Finanzierungsbedarf sichtbar bleiben. Hier werden keine rückwirkenden Schulden erfunden.

## Statische Handels- und Finanzierungssuche

Alle vorhandenen Stationspaare, alle 18 Waren und ganzzahlige Mengen bis 100 wurden geprüft; Verkäuferreserve, Käufer-Bruttokasse, Annahmekapazität, Routen und unveränderte Gebühren werden aus dem Core bezogen. Kein Spieler-/Stations-/Fonds-Cash wird umgebucht. Für jede betrachtete Route werden leere Anreise von Aldera und Hin-/Rückfahrt zum Einkaufsort mit `ceil(250 × Arbeitsminuten / 60)` vorsorglich vorfinanziert. Dies ist eine statische Oberbudgetierung der Betriebskosten, keine Simulation der Stundenabrechnung. Positives Netto bedeutet nach Gebühren und diesem Betriebsbudget, **vor Schiffsverlust/Abschreibung**. Käufercash, Preise, Bestände und Verbrauch sind während der Rechnung eingefroren; es gibt keine Reservierung.

Das billigste so vollständig vorfinanzierte positive Angebot ist in allen vier Fällen: **11 Silizium Dravos → Aldera**, Kauf 187 + 7 Gebühr, Verkauf 473 − 18 Gebühr, Marge 261. Anreise 20, beladene Fahrt 20, Rückfahrt 20 Ticks: 250 ISK Betriebsbudget, Rest 11 ISK. Betrieb und Waren benötigen zusammen **444 ISK**. Die Suche liefert 26 / 5 / 62 / 86 positive Mengenangebote, keine entsprechend vielen unabhängigen Märkte. Der höchste statische Nettoüberschuss stammt jeweils ebenfalls aus Silizium nach Aldera: 577 / 105 / 1.001 / 1.285 ISK bei 35 / 15 / 53 / 65 Stück.

| Fall | Hülle + Gebühr | Hülle + 444 Budget | Eigene Finanzierungslücke NPC1 / NPC2 | Produktive Zuschusslücke nur Hülle NPC1 / NPC2 |
| --- | --- | --- | --- | --- |
| miner | 780 | 1224 | 1224 / 1092 | 780 / 648 |
| handel-flotte | 780 | 1224 | 1224 / 1224 | 780 / 780 |
| station | 1092 | 1536 | 1536 / 1536 | 372 / 372 |
| jagd | 780 | 1224 | 1059 / 1224 | 558 / 723 |

Die dritte Spalte ist ein vorsichtig vorfinanziertes **bedingtes Einstiegsbudget**, kein exaktes Kassenminimum: Ein Teil der Rückfahrtkosten könnte erst nach dem Verkauf bezahlt werden. Das exakte Cashminimum eines vorgegebenen Zahlungsbands ist dessen größter kumulierter Auszahlungsüberschuss. Es hängt vom Stundenfenster und tatsächlichen Ausführungen ab. Selbst die 444 ISK beweisen keinen Folgezyklus, weil die Lieferung die Knappheitspreise ändert und Aldera Silizium verbraucht. Für einen später wieder aus Dravos beginnenden Zyklus entfällt zwar die einmalige Anreise; ausreichend Nachfrage und finanzierbarer Verlustersatz sind dadurch nicht garantiert.

Die bestehende 250-ISK-Ersatzrücklage ist im vorfinanzierten Betriebsbudget **bereits berücksichtigt und nicht doppelt addiert**. Sie ist weder ein finanzierter zweiter Warenkauf noch eine Verlustversicherung. Als zusätzliche rein statische Absicherung für genau eine Ersatzhülle kämen beim selben Preis nochmals 780 / 780 / 1.092 / 780 ISK hinzu: 2.004 / 2.004 / 2.628 / 2.004 ISK. Auch diese Beträge sind keine geprüfte Überlebensgarantie; Folgepreise, Neubauinputs, Anzahl und Zeitpunkt von Verlusten sind offen.

## Reale Zahlungen: Silizium als vorhandenes Eigenkapital in Waren

| Fall | Miner → neuer Frachter | Silizium Stück / Brutto / Gebühr | NPC3-Cash nach Siliziumverkauf | Nach Hüllenkauf | Frachter-Käufe und -Verkäufe | Frachterverlusttick | NPC3 ungedeckter Betrieb bis Tag 97 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| miner | sh010 → sh158 | 38 / 1634 / 65 | 1900 | 1120 | 11 | 129840 | 0 |
| handel-flotte | sh010 → sh106 | 19 / 817 / 32 | 5030 | 4250 | 163 | 132480 | 870 |
| station | sh075 → sh112 | 53 / 2279 / 91 | 6395 | 5303 | 17 | 129960 | 0 |
| jagd | sh038 → sh125 | 65 / 2795 / 111 | 4362 | 3582 | 15 | 129960 | 0 |

Alle vier Ausgangsminer tragen 100 tatsächlich vorhandene Siliziumeinheiten. Die Lieferung verkauft nur die bezahlbare Menge 38 / 19 / 53 / 65; die Restladung bleibt an Bord. Vorher wurden in jedem Fall **150 ISK** echter Betrieb abgebucht. Die Summe aus bereits vorhandener Kasse und Verkaufserlös deckt Hülle und ersten Handelswarenkauf. Externe Finanzierungslücke dieses Befehlsbands: **0 / 0 / 0 / 0**. Der niedrigste im gesamten Lauf beobachtete NPC3-Cashstand ist 331 / 0 / 46 / 4 ISK. Das ist ein Messwert bei unveränderten Ausgangskassen, kein Versuch mit künstlich auf diese Werte gesetztem Startkapital.

Die 150 ISK bis zur ersten Liquidation sind eine untere Cashanforderung für diese konkrete Anreise bei vollständiger Bezahlung. Ausgangs-Cash 481 / 4.395 / 4.357 / 1.828 deckt sie. Die Fracht selbst ist **nicht kostenloser neuer Kapitalzufluss**: Sie ist vor Tag 90 durch Förderung entstanden, im Ledger enthalten und gehört NPC3. Ihr Verkauf senkt die Käuferkasse, erhöht NPC3s Kasse und überträgt reales Material. Ein Nachfolger ohne eigene Miner/Fracht könnte diesen Weg nicht ohne bezahlten Asset-/Warenerwerb übernehmen.

Erstes tatsächliches Handelsgeschäft des neuen Frachters:

| Fallgruppe | Tick 129664: 25 Material kaufen | Tick 129719: 25 Material verkaufen | Handelsmarge | Bis zum Verkauf aufgelaufene Frachterarbeit / Rückstellung |
| --- | --- | --- | --- | --- |
| Miner / Flotte | 600 + 24 | 975, gebührenfrei | 351 | 56 beobachtete Arbeitsminuten = 233 ISK abgerundete Rückstellung |
| Station / Jagd | 625 + 25 | 975, gebührenfrei | 325 | ebenso 233 ISK |

Der Wareneinkauf in Aldera transferiert Geld von NPC3 zur Station plus Fondsgebühr; in der besessenen Aldera-Station geht die Gebühr stattdessen an deren eigenes Konto. Meridian bezahlt die Lieferung aus vorhandenem Cash. **Es wurde real gekauft, geflogen, verkauft und positiv nach zugehöriger Betriebsrückstellung gehandelt.** Der erste tatsächliche Frachter-Kostenlauf um 129720 bucht 237 ISK, vollständig bezahlt. Die Marge bleibt auch nach diesen gesamten 237 positiv: 114 / 88 ISK. Die spätere 237-ISK-Abbuchung schließt bereits den Anfang der nächsten Fahrt ein; sie ist keine exakt einem Warenlos zugeordnete Kostenrechnung.

Am selben Verkaufstick kauft der Frachter Folgeware: Miner/Flotte 16 Nahrung für 672 ISK; Station/Jagd 25 Nahrung für 975 ISK. Rückfahrt nach Aldera, erste Ankunft 129774. Miner/Flotte verkaufen alle 16 für 864 − 34 = 830; Jagd alle 25 für 1.350 − 54 = 1.296. Im Stationsfall nehmen mehrere Käufer die Ladung nur schrittweise ab (17 + 1 in Aldera, sieben später in Dravos). Die erste vollständig durchgeführte Materiallieferung und die real finanzierten Folgekäufe sind bewiesen; gleicher Standort bedeutet keine identischen wiederholbaren Preise. Alle einzelnen Fracht-/Geldereignisse stehen in der JSON.

Bei eingefrorenen ersten Einkaufspreisen wäre Hülle + erste 25er-Ladung + bestehende 250er-Reserve 1.654 / 1.654 / 1.992 / 1.680 ISK. Nach der Siliziumlieferung stehen 1.900 / 5.030 / 6.395 / 4.362 ISK bereit. Es besteht dafür kein externer Fehlbetrag. Dies sind Budgetrechnungen auf **real gemessenen** Transaktionspreisen, keine zusätzlichen Mindestkapital-Experimente. Eine Reduzierung von NPC3-Cash würde Mengenwahl, Ersatzkäufe und Folgekassen ändern; der beobachtete Verlauf darf nicht einfach zu einem neuen Niedrigkapitaltest umetikettiert werden.

## Sektorbilanz des tatsächlichen siebentägigen Eingriffs

Nettoänderungen gegenüber Tag 90, ISK. Interne Transfers summieren sich zu null; Zeilensumme = Kopfgeldschöpfung minus tatsächliche Senken.

| Fall | Spieler | Stationen | Fonds | Händler | Miner NPC3 | Piraten | Sicherheit | minted / burned |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| miner | 881 | -1193 | 47 | 0 | 90 | 175 | 0 | 240 / 240 |
| handel-flotte | 4502 | -559 | 200 | 0 | -4141 | -2 | 0 | 1680 / 1680 |
| station | 2362 | 1754 | 337 | 0 | -4311 | -142 | 0 | 1080 / 1080 |
| jagd | 3304 | -1713 | 269 | 0 | -1824 | -36 | 0 | 720 / 720 |

Die Rohdaten führen jede Kasse und Transferkante separat. Die Stundenprüfung rekonstruiert jede Kasse aus ihren Gegenbuchungen; der unabhängige Audit zählt außerdem jede Ware in Lager/Fracht gegen ihr Ledger. Aufgelaufener Betrieb wird als Soll/bezahlt/unbezahlt dokumentiert, nur tatsächliche Zahlung verändert Cash. Förderung, Rezeptinputs/-outputs, Grundverbrauch, Aktivierung, Import/Export und Verlust bleiben getrennt. Das heutige Meridian-Außenlager importiert/exportiert weiterhin ohne Kaufpreis und Piratenersatz erzeugt bezahlte, aber nicht materialgedeckte Piratenhüllen. Der B1-Aufbau führt keine zusätzliche Quelle ein; er beweist keine geschlossene Außenwirtschaft.

## Werftmaterial und physische Erreichbarkeit

An Tag 90 Aldera null Bauteile/null Silizium, aber 193/194 Material. Meridian besitzt 91 Bauteile/100 Silizium; Dravos/Nadir jeweils 65 Silizium im Stationslager. Zudem besitzen die neun NPC-Miner Fracht außerhalb der Stationslager. Damit ist der vorhandene Silizium-Miner ein tatsächlich erreichbarer Nachschubpfad, ohne erst einen Frachter produzieren zu müssen. Die frühe eigene Siliziumlieferung wird in allen vier Fällen bezahlt; die Bauteillinie läuft real wieder an.

Produktion in Aldera während sieben Tagen: **45 / 121 / 72 / 94 Bauteile** und **1 / 1 / 2 / 1 Frachterhüllen**. Produktion ist kein Garantiebeleg für freien Frachterbestand: Minerbau und andere Linien verbrauchen dieselben Bauteile, Grundverbrauch läuft weiter. Aktive Flotten und Hüllenwaren sind verschiedene Bestände. Aktivierung verbraucht eine reale Hüllenware; kein Gratisersatz wurde erzeugt.

Der neue Frachter liefert tatsächlich zusätzliche Meridian-Bauteile nach Aldera im Stationsfall vier Stück (Tick 129950, 536 Brutto, 21 Gebühr), im Jagdfall 16 Stück (129897, 2.144 Brutto, 85 Gebühr). Die übrigen beiden Fälle belegen keine solche Bauteillieferung; ihr anfänglicher Werftneustart erfolgt durch die Siliziumlieferung und lokale Produktion. Teilverkäufe werden nicht als vollständig ausgelieferte Ursprungsladung gezählt. Acht Bauteile pro Frachter, bzw. 16 Material + acht Silizium für deren lokale Herstellung, und die 36 Produktionsticks der Hülle bleiben unverändert. Andere Verwendungen können mehr Nachschub erfordern.

## Betrieb, Risiken und Grenze der Wiederholbarkeit

NPC3s alte Sollflotte verlangt weiterhin neun Miner. Bereits an Tick 129780 kommt in Flotten-/Stations-/Jagdfall zusätzlich ein realer Minerersatz für **873 ISK** hinzu; die reine Frachterreserve 250 deckt diese Verpflichtung nicht. Die tatsächlich bezahlten NPC3-Betriebskosten über sieben Tage sind 887 / 15.326 / 4.071 / 3.370 ISK, ungedeckt 0 / 870 / 0 / 0. Diese Zahlen betreffen den gesamten Konzern, nicht nur den neuen Frachter. Das Kapital darf nicht zugleich vollständig als freie neue Handelsreserve gelten.

Der Frachter aus dem Minerfall geht an 129840 verloren, der aus dem Flottenfall an 132480, die anderen beiden an 129960. Hüllenverlust, Frachtverlust, Beuteverkauf und ISK-Senke sind getrennt: Schiffsverlust vernichtet nicht automatisch Geld. Es gibt keine garantierte vollständige Frachtbergung. Der Test weist keine statistische Verlustwahrscheinlichkeit, keinen versicherungsmathematischen Risikozuschlag und keine unbeschränkte Betriebsdauer nach. Routenwahl benutzt heutige Gebührenmargen und berücksichtigt laufende Betriebskosten und Verlustkosten nicht vollständig.

**Minimales Kapital für realistisch wiederholbaren Betrieb:** Für die nachgewiesene erste Lieferung und Folgekäufe reichen die tatsächlichen eigenen Bestände in allen vier Fällen. Für einen länger wiederholbaren Betrieb ist dagegen mit diesem Band kein ausreichender Mindestbetrag nachgewiesen: Konkurrenz um Liquidität, veränderte Preise/Absatz, alte Ersatzpflichten und fehlender Frachterersatz führen wieder zum Abbruch. Eine feste zusätzliche ISK-Zahl als Lösung wäre unbelegt. Erforderlich sind getrennte Budgets für Waren/Abrechnung, vorhandene Minerpflichten und einen tatsächlich beschaffbaren Frachterersatz; erst mit festgelegtem Betriebs-/Ersatzplan lässt sich dessen größter kumulierter Zahlungsfehlbetrag exakt messen. Die kleinsten statischen Budgets und die gemessenen Defizite oben beantworten die finanzielle Einstiegsfrage, nicht die langfristige Existenzfrage.

## Verbleibende Blockaden und Prüfgrenzen

- **NPC1/NPC2:** Kein deckender zulässiger Hüllenzuschuss; selbst ein Pool wäre erst eine neue, hier nicht benutzte Regel und würde Fracht/Betrieb nicht automatisch decken.
- **NPC3:** Eigene Fracht kann den Einstieg finanzieren, heutige autonome Minerstrategie trifft diese Aufgabenentscheidung nicht. Alte Sollflotte verbraucht reale Mittel; der neue Frachter besitzt keinen automatischen Ersatzplatz. Keine freie Übertragung an andere Firmen.
- **Werft:** Physische Lieferbarkeit und bezahlter lokaler Produktionsneustart sind in diesen Fällen belegt. Verfügbarkeit allein beweist noch keine dauerhaft priorisierte Zuteilung an den Frachterbau.
- **Gesamtwirtschaft:** Kein Nachweis, dass zusätzliche Geldquellen für den ersten Zyklus zwingend nötig sind; kein Gegenbeweis zum langfristigen Geldmengenproblem aus #35. Einmalige Liquidation vorhandener Fracht ist kein unbegrenzter Kapitalzufluss.

Neu lokal ausgeführt: Node.js **22.23.4**, vier Tag-90-Rekonstruktionen, vier Kontroll- und vier Befehlsfortsetzungen mit eigenen Replays/Audits; Pflichtbefehl erfolgreich (sechs Dateisuiten) und zusätzliche Einzelausgabe **48/48 vorhandene Tests**, null Fehler/Skip/Abbrüche. Frühere #32–#34-Jahres-/Variantenresultate bleiben historische Belege. Keine neue 13-Seed-Jahresprüfung, kein Goldenwertwechsel, keine Safari-/NAS-Abnahme, kein Merge/Deployment. Der neue B1-Workflow muss am tatsächlichen PR-Head separat geprüft werden; lokale Ergebnisse sind kein vorweggenommener CI-Erfolg.
