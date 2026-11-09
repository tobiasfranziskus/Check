# W5ad – finanzierte Ersatzwirtschaft

**[DRAFT / ANALYSE, 09.11.2026]** Auf [#274](https://github.com/tobiasfranziskus/Check/pull/274), Head [`4db5e8d6`](https://github.com/tobiasfranziskus/Check/commit/4db5e8d6cc99a5fd875faa1320e6ecc0d4549394). Geprüfter `main`: [`fd3e9154`](https://github.com/tobiasfranziskus/Check/commit/fd3e9154). Keine Integration, Preisfreigabe, neue Emission, Veröffentlichung oder Save-Migration. Verbindliche Produktplanung bleibt [ROADMAP.md](ROADMAP.md).

## Ergebnis und implementierter Teilpfad

Der Ersatzpfad funktioniert aus eigenen Mitteln und tatsächlich erzielten Frachtereinnahmen. Dauerhaft selbsttragende Fracht-/Ersatzwirtschaft ist unter den hier untersuchten kleinen W0–W5-Regeln **rechnerisch unmöglich**. Beides ist getrennt belegt; keine erfundenen Erfolgswerte.

Einziger Simulationskern bleibt `prototypes/w5ac/rule191-w5-ferry-core.js`. `createResearch({carrierCash,buyerCash})` aktiviert darin **Forschungsregel192 / Schema8**, ohne eine zweite Simulation oder eine kopierte Core-Datei. Der Default bleibt Regel191; dessen bisherige vier veröffentlichten Flug-/Anschlussfracht-Hashes bleiben unverändert. `index.html`, Versionsarchive und Browser-Speicherwege werden nicht geändert. Regel192 ist über Core-Kommandos und den reproduzierbaren Node-Forschungstreiber ausführbar; es gibt keine neue Regel192-Produktoberfläche.

- `researchShipLoss`: ausdrücklich deklarierter Forschungsverlust eines bezahlten, leeren, freien eigenen Aldera-Frachters. Entfernt das reale Schiff mit dem vorhandenen Verlustkern einschließlich Statistik und dauerhaftem Herkunftsbeleg. **Keine neue Verschleiß-, Lebensdauer- oder Kampfentscheidung.** Gebundene Fracht und laufende Überführung werden abgewiesen; Verluste während laufender Verträge samt Abbruchabrechnung bleiben außerhalb dieses Teilpfads.
- `shipReplace`: nur für einen belegten, noch nicht zugeordneten Verlust. Vor erster Buchung müssen reale Werftware und **750 Kauf + 60 Überführung + mindestens 120 Arbeitsreserve = 930 ISK eigene Liquidität** vorhanden sein. Höhere freiwillige Reserve bleibt erlaubt. Der vorhandene `shipBuy` kauft genau eine physische Hülle; der vorhandene Überführungskern sperrt 60 ISK und fliegt diese Schiff-ID 60 echte Core-Minuten nach Aldera. Die Arbeitsreserve bleibt eigenes freies Kapital, kein Aufwand und kein Fremdzuschuss. Der anschließende W3-Auftrag sperrt sie tatsächlich für Hin- und Rückflug.
- Verlust → Kauf-ID → Flug → tatsächlich abgeschlossene Folgefracht ist in `w5ad` nachvollziehbar. Historische Kauf-/Flugbelege bleiben auch nach einem weiteren realen Verlust auditierbar. Doppelzuordnung, Fremdkasse, fiktiver Verlust, falscher Standort und manipulierte Lohn-/Kaufbelege scheitern. Ein abgewiesener Ersatzauftrag ändert keinen Zustand.
- Eigenkapital-, Waren-, Eigentums-, Lohn- und Save-Prüfungen benutzen denselben Zustand und dieselbe Core-Uhr. Regel191/192, andere Anfangsverteilungen und Produkt-Saves werden nicht still ineinander geladen.

**Integrationsgrenze:** Der geerbte #274-Branch besitzt bereits einen anderen `index.html`-Einstieg als `main` und enthält dessen `versionen/v0.12.5/`-Archiv nicht. W5ad verändert diese geerbten Dateien nicht und wird ausschließlich gegen den #274-Head gestapelt. Dieser Stack ist kein freigegebener Merge-Kandidat gegen `main`; das produktive Archiv auf `main` bleibt erhalten.

## Finanzierung ohne fremde Konzernkassen

| Beteiligter / Vorgang | Tatsächlich erforderliche eigene Mittel / Güter |
| --- | --- |
| Miner | 600 ISK Hülle; 100 ISK Arbeit für 50 Erz vorfinanzieren |
| Aldera / W1-Abnahme | 500 ISK je 50 Erz; tatsächlicher Verkauf an endlichen Exportkäufer oder W3 erforderlich |
| Nadir / W3-Käufer | 740 ISK je Vertrag: 500 Erz + 240 Frachtgebühr |
| Spedition / W3 | 120 ISK Arbeit für 60 Minuten Hin- und 60 Minuten Rückflug; 240 ISK tatsächlich vereinnahmte Gebühr, **120 ISK Nettobeitrag** |
| Nadir / W4 | 10 wirklich gelieferte Erz + 20 ISK vollständig gesperrter Lohn → 5 Material |
| Werft / W5 | 500 ISK für diese 5 Material + 30 ISK gesperrter Lohn → eine reale Hülle |
| Spedition / Ersatz | 750 Hülle + 60 Pilotenlohn + 120 verbleibendes Betriebskapital = **930 ISK**; zusätzlich zahlungsfähiger W3-Kunde und echte Erzcharge für Einsatz |

Der Einnahmenfall beginnt mit 1.000 ISK Speditionskapital. Nach dem ursprünglichen 750-ISK-Kauf bleiben 250 ISK. Sieben abgeschlossene reale W3-Verträge bringen 1.680 ISK Gebühren und kosten 840 ISK vollständig gezahlte Löhne: **840 ISK Nettobeitrag**, Kasse **1.090 ISK**. Der echte Verlust erfolgt in Tick890. Kauf und 60-min-Flug kosten 810 ISK, durch die bisherigen Nettoeinnahmen vollständig gedeckt; 280 ISK verbleiben. Danach führt genau die Ersatzhülle eine achte reale Fracht aus: Endkasse **400 ISK**. Keine Rechnung über fremde Miner-, Export-, Werft- oder Haushaltskonten.

Die Grenzfälle unterscheiden sich um genau ein ISK Anfangskapital: `960 − 750 + 6 × 120 = 930` erlaubt Ersatz samt Betrieb; `959 − 750 + 6 × 120 = 929` verweigert ihn unverändert. Die Reserve ist kein Geldverbrauch. Für ausschließlich aus neuem Nettobeitrag gedeckte 810 ISK braucht man `ceil(810/120) = 7` Frachten.

Die Szenarien verteilen ausschließlich **bei Welterzeugung** die bisherigen 9.000 ISK von Haushalt, Spedition und Nadir anders; Haushalt = `9000 − carrierCash − buyerCash`. Alle übrigen Anfangskonten bleiben gleich, Weltgeld stets 33.000 ISK. Das sind transparente kontrafaktische Anfangsbedingungen, **keine** erlaubten Transfers in eine laufende Welt und keine Finanzierungsverträge. Im Basisszenario bleibt die originale Verteilung unverändert. Spieler-/Minervermögen wird nie zur Rettung herangezogen.

## 13 wirtschaftlich unterschiedliche Szenarien, jeweils 90 Tage

Alle verwenden absichtlich **denselben Seed42**. Variiert werden Kapital, Käuferbudget, Verlustzeit, reale Produktionsaufträge, freiwillige Reserve und erteilte Frachtaufträge. Produktions- und Nachfragepausen sind Entscheidungen des Forschungstreibers, keine neue Core-Regel oder garantierte Kaufpflicht. Die Werft wird bei Bedarf auch nach einem zweiten Verlust wieder real bezahlt; der zweite Kapitalengpass wird nicht durch ein künstliches Ein-Hüllen-Limit erzeugt.

`T/B` = Anfangskasse Spedition/Nadir; `E/K` = finanzierte Ersatzkäufe / davon mindestens einmal tatsächlich eingesetzte Hüllen. „Ruhend“ bezeichnet nur vorhandene freie Speditionsschiffe an Tag90. Anfangs-/Endkassen, alle Konzernkonten, Kauf-/Verlustzeitpunkte, Zwischenstände, Blockaden und vollständige Hashes stehen in [W5AD_ERGEBNISSE.jsonl](W5AD_ERGEBNISSE.jsonl).

| Szenario | T/B ISK; abweichende Bedingung | Frachten | Verluste | E/K | Ruhend | Endkasse T/B ISK | Belegter Engpass |
| --- | --- | ---: | ---: | --- | ---: | --- | --- |
| baseline | 2000/4000; Verlust nach 3 Frachten | 6 | 1 | 1/1 | 1 | 1160/40 | Käufer fehlen 700 ISK; Quellerz leer |
| earned | 1000/6000; Verlust nach 7 | 8 | 1 | 1/1 | 1 | 400/560 | Käufer fehlen 180 ISK; Quellerz leer |
| exact-930 | 960/6000; Verlust nach 6 | 8 | 1 | 1/1 | 1 | 360/560 | Ersatz exakt bei 930; später Käufer-/Erzstopp |
| short-929 | 959/6000; Verlust nach 6 | 6 | 1 | 0/0 | 0 | 929/2040 | Eine reale Hülle vorhanden, **1 ISK** Ersatzkapital fehlt |
| buyer-739 | 2000/739 | 0 | 0 | 0/0 | 1 | 1250/739 | Bereits erste Käuferreserve um **1 ISK** unterdeckt |
| early-loss | 1000/6000; Verlust nach 1 | 1 | 1 | 0/0 | 0 | 370/5740 | Reale Hülle vorhanden, 560 ISK eigenes Ersatzkapital fehlen |
| no-yard-production | 2000/4000; kein Bauauftrag | 3 | 1 | 0/0 | 0 | 1610/1760 | 5 reales Material, aber keine fertige Werftware |
| saving-1500 | 2000/4000; eigene Reserve 1500 | 3 | 1 | 0/0 | 0 | 1610/2260 | Freiwillige Vollreserve erfordert 2310; 700 fehlen |
| buffer-600 | 2000/4000; eigene Reserve 600 | 6 | 1 | 1/1 | 1 | 1160/40 | Ersatz bei 1410 Bedarf finanzierbar; später Absatzstopp |
| demand-one | 2000/4000; nur ein Frachtauftrag | 1 | 1 | 1/0 | 1 | 560/3740 | Bezahlt gekauft und angekommen, aber keine Folgeorder |
| idle-saving | 2000/4000; nur zwei Frachten, kein Verlust | 2 | 0 | 0/0 | 1 | 1490/3000 | Betrieb freiwillig ruhend; vorhandene Reservehülle unverkauft |
| second-loss | 2000/4000; Ersatz nach erstem Einsatz erneut verloren | 4 | 2 | 1/1 | 0 | 920/2000 | Zweite Hülle real produziert; **10 ISK** Ersatzkapital fehlen |
| no-refinery-material | 2000/4000; kein Raffinerieauftrag | 3 | 1 | 0/0 | 0 | 1610/1780 | Erz vorhanden, kein W4-Material und keine Werftware |

In diesen **13 getrennten Welten zusammen**: 51 bezahlte Frachten, 12 tatsächlich entfernte Frachter, 11 physisch produzierte Hüllen, 6 finanzierte Ersatzkäufe und Überführungen, davon 5 mit realem Folgeeinsatz; am Ende 7 ruhende Speditionsschiffe. Diese Summen sind keine gemeinsame Welt und kein Erfolgsanteil für Dauerbetrieb. Kapitalmangel für Ersatz wird als solcher benannt: keine erfundene rechtliche Insolvenzentscheidung und kein negatives Konto. Vermögende, sparende oder nachfragelose Konzerne sind nicht automatisch insolvent.

Fünf zusätzliche Welten (`earned`, `short-929`, `buyer-739`, `saving-1500`, `second-loss`) liefen **365 Tage**. Tag90 und Tag365 haben identische Fracht-, Ersatz-, Verlust-, Lohn- und Speditions-/Käuferkassenwerte; keine erholte Aktivität. Die Hashes ändern sich durch die weiterlaufende Core-Zeit, bleiben je Szenario im unabhängigen Replay gleich. Alle 18 Welten wurden zweimal aus ihren Anfangsbedingungen ausgeführt.

## Kontenbeispiel: Einnahmenfall an Tag90

| Eigentümer | Anfang | Tatsächliche Einnahmen | Gebuchte Kosten | Endkasse ISK |
| --- | ---: | ---: | ---: | ---: |
| Haushalt | 2000 | 0 | 0 | 2000 |
| NPC-Miner | 3000 | 24000 | 6000 | 21000 |
| Aldera | 1000 | 24000 | 24000 | 1000 |
| Aldera-Arbeitsfonds | 0 | 4800 | 0 | 4800 |
| Erzexportkäufer | 20000 | 0 | 20000 | 0 |
| Externe Werft | 0 | 2700 | 530 | 2170 |
| Nadir | 6000 | 500 | 5940 | 560 |
| Spedition | 1000 | 1920 | 2520 | 400 |
| Fracht-Arbeitsfonds | 0 | 960 | 0 | 960 |
| Raffineriearbeiter | 0 | 20 | 0 | 20 |
| Werftarbeiter | 0 | 30 | 0 | 30 |
| Überführungspilot | 0 | 60 | 0 | 60 |
| Überführungstreuhand | 0 | 0 | 0 | 0 |

Weltgeld = **33.000 ISK**, Emission und Vernichtung von Geld = **0**. Die beiden alten Arbeitsfonds verbuchen ihre tatsächlich erhaltenen Löhne nicht als `stats.konto.erloes`; der unabhängige Prüfer rekonstruiert diese Zuflüsse zusätzlich aus realer Arbeit. Das JSONL kennzeichnet die Statistikfelder deshalb als `bookedRevenue`/`bookedCost`. Fremde 21.000 Miner-ISK sind kein Speditionskapital. Vollständige Kontentabellen für jeden Lauf stehen im Artefakt.

## Rechnerischer Gegenbeweis zum Dauerbetrieb

Dieser Beweis gilt für den kleinen Original-W0–W5-Pfad aus #274 samt W5ad, **nicht** pauschal für jeden historischen R32-Zweig oder eine künftig beschlossene Wirtschaft.

1. Sei `N` die Zahl abgeschlossener W3-Frachten und `a >= 0` die schon gezahlte Arbeit eines laufenden Auftrags. Vorhandene Route: 60+60 Minuten; Lohn 1 ISK/Minute. Der unabhängige Kontenabgleich und das W3-Audit ergeben zwingend `fonds_transport.cash = 120N + a`.
2. Der Erzpilot-Tick führt keine allgemeinen Fonds-/Dividenden-Ausgaben aus. Es gibt keinen gültigen Auszahlungsvertrag dieses Arbeitsfonds; eine freie Umbuchung würde den W3-Audit brechen. Der Fonds ist somit monoton. Alle Konten sind nichtnegativ und ihre Summe bleibt `M = 33000`, ohne Emission oder Rettung.
3. Daher `120N <= fonds_transport.cash <= M` und zwingend **`N <= floor(33000/120) = 275`**. Dies ist eine großzügige globale Obergrenze, kein erreichbarer Erfolgswert; andere Arbeitszahlungen und Eigentums-/Warenengpässe verschärfen sie. Unendlich fortlaufende bezahlte Fracht und damit dauerhaft aus solchen Einnahmen finanzierter Ersatz sind unmöglich. Auch eine bessere Bestellstrategie kann diese Schranke nicht umgehen.
4. Bei abgeschlossenen Aufträgen gilt unabhängig für die Spedition: `T = T0 − 750P + 120N − 60F`, mit `P` allen wirklich gekauften Frachtern und `F` abgeschlossenen Überführungen. Vor dem nächsten Ersatz sind zusätzlich 120 frei verfügbare ISK nötig. Bei endlichem `T0` und begrenztem `N` bleibt auch die Zahl finanzierbarer Ersatzkäufe endlich. Schaden erzeugt keinen neuen Erlös.
5. Käuferbudget nach abgeschlossenen Frachten/Produktionen: `B = B0 − 740N − 20Q + 500H`, mit `Q` Raffineriechargen und `H` von der Werft wirklich gekauften Materialchargen. Materialverkauf ist vorhandenes Werftgeld, keine Emission. Erzexportbudget höchstens 20.000 ISK, also höchstens 2.000 Erz zu 10 ISK. W1s bestehende Nachfrageplanung stoppt nach Erschöpfung dieser endlichen Abnahme; in allen Endzuständen fehlt zusätzlich frisches Aldera-Erz. Mehr Käufergeld allein beweist keinen Warenzufluss.

Ein konkreter Engpass kann vor dieser globalen Schranke eintreten: zweiter Verlust bei 920 ISK mit realer zweiter Hülle, oder 929 ISK bei vorhandener Ware. Die nominalen Weltmittel reichen in beiden Fällen, die eigene Kasse nicht. Automatischer Zugriff auf Haushalt/Miner/Werft wäre eine neue, hier nicht erlaubte Regel.

## Reproduktion, Audits und Grenzen

Node.js **22.23.4**, ohne neue Abhängigkeit:

```sh
node --test tests/*.test.mjs
node tools/w5ad-report.mjs > /tmp/w5ad-results.jsonl
cmp docs/W5AD_ERGEBNISSE.jsonl /tmp/w5ad-results.jsonl
python tests/w5ac-touch.py
```

Der Forschungstreiber erteilt nur validierte Core-Kommandos und ruft `core.advance` auf; er berechnet keine eigene Bewegung, Förderung, Produktion oder Bezahlung. Tägliche originale Gesamtaudits plus unabhängige Summen/physische Lager-/Schiffs-/Konzern-/Lohnrechnung, vollständige Befehlsreplays, tägliche Save/Load und zusätzliche Teilflug-Saves. Geprüfte Manipulationen: fremde Mittel trotz neutraler Weltbilanz, fehlender Kauf/Verlust, Doppelzuordnung, falscher Cashbeleg, Profil-/Regelmischung, vorgezogene Ankunft und gefälschte Arbeit. Abweisung lässt die aktive Welt unverändert.

Lokale Abnahme: **169/169 Node-Tests, 0 Fehler, 0 Skips**; vier Chromium-Touchgrößen des unverändert bedienbaren Regel191-Hubs bestanden (1180×820, 1024×768, 820×1180, 390×844). Neue Matrix: 13×90 + 5×365 = **2.995 simulierte Tage pro Replay**, zweimal aus Anfangszustand, zusätzlich tägliche Save/Load. GitHub-CI wird im PR separat mit tatsächlichem Laufstatus verlinkt. Ausgangs-CI #274 wurde direkt geprüft: alle acht Workflows erfolgreich; [W5ac-Lauf 42626781995](https://github.com/tobiasfranziskus/Check/actions/runs/42626781995) beide Jobs erfolgreich.

Kein behaupteter iPad-Safari-/NAS-Test, keine Regel192-UI-Abnahme, keine Produkt-Save-Migration. Die 13 Szenarien sind eine deterministische Forschungsmatrix mit deklarierten Verlusten und Bestellentscheidungen, keine automatische Verlustwahrscheinlichkeit und kein W6-Erfolg.

## Nächster kleiner Schritt / Entscheidungen

1. **Empfehlung [OPTION]:** Zuerst einen ausdrücklichen, freiwilligen, vorfinanzierten Arbeiterkonsumvertrag aus **wirklich erhaltenem eigenem Lohn** prüfen, mit realer Ware und eindeutigem Verkäufer. Sparen muss erlaubt bleiben. Die heutige monotone Geldbindung würde nur durch eine gesondert beschlossene Vertragsregel aufgehoben; diese Arbeit führt sie nicht ein.
2. **Separates Warengate [OPTION]:** W1-Nachfrageplanung gegen einen tatsächlich gedeckten W3-Folgevertrag prüfen, sobald Exportetat ausläuft. Nur gebundene Käufermittel dürfen neue Erzabnahme begründen. Keine vorgetäuschte Endnachfrage und keine zweite Simulation.
3. **Bewusste Alternative [OPTION]:** Endliche, auslaufende Wirtschaft mit Betriebsruhe/Ausfall als gewünschtes Forschungsresultat akzeptieren. Dann Verlust-, Vertragsabbruch- und Nachfolgeberichte ausbauen, ohne Nachhaltigkeit zu behaupten.
4. Freiwillige Kredite/Investitionen benötigten tatsächliche Kapitalgeber, vertragliche Rechte, Rückzahlung und Verlusttragung. Sie könnten einzelne Ersatzkäufe ermöglichen, beseitigen für sich die globale Fonds-Schranke nicht. Zusätzliche Geldemission oder Preisänderungen bleiben separate Nutzerentscheidungen; hier weder nötig für den Teilnachweis noch implementiert.
