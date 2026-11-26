# W6 – Geldumlauf, Absatz und eigenständige Wasserlogistik

[Forschungs-Draft #651](https://github.com/tobiasfranziskus/Check/pull/651), gestapelt auf [#650](https://github.com/tobiasfranziskus/Check/pull/650) bei `f4fa8d59d4723c328bdd7ad56885580260c72b59`. Ausgangspunkt ist [Prüfkommentar 7192784374](https://github.com/tobiasfranziskus/Check/pull/650#issuecomment-7192784374).

## Verfahren

`tools/w6-geldumlauf.cjs` nutzt das vorhandene isolierte Node-Forschungsprofil und den Abnahmetreiber von #650. Es liest die echten Konten, Sparbudgets, Buchwerte, Standortlager und Schiffe am Kontrollpunkt. Ein ausdrücklich ausgelöster Kauf oder eine Ausschüttung wird ausschließlich auf einer validierten Kopie mit dem Originalbefehl versucht. Der Bericht unterscheidet Kassenbewegungen, Schiffseigentum, ausführbare Folgeaufträge und gesicherte künftige Erlöse. Ein abgelehnter Befehl muss den Save bytegleich erhalten. Ein erfolgreicher Befehl muss die Core- und unabhängigen Audits bestehen, einschließlich Geld, Waren und Save/Load. Der gesamte Lauf einschließlich der Proben wird exakt wiederholt. Der Ausgangsstand bleibt bytegleich.

```sh
node --test tests/*.test.mjs
node tools/w6-gesamtpaket.cjs S02 730 42 gesamt
node tools/w6-geldumlauf.cjs S02 90 42
node tools/w6-geldumlauf.cjs S02 365 42
node tools/w6-geldumlauf.cjs S02 730 42
node tools/w6-geldumlauf-investition.cjs 42 90
```

## Reproduzierter S02-Stillstand und Geldumlauf

Der unveränderte #650-Treiber reproduzierte S02/42 bis Tag 730 mit exaktem Replay. Der gesamte JSON-Bericht stimmt mit dem [Referenzjob von #650](https://github.com/tobiasfranziskus/Check/actions/runs/45822411885/job/139917772147) überein. Der separate Tag-365-Lauf des Forschungswerkzeugs wiederholt `77aae111ae5163df`. Tag 730 endet bei `182e7175c374dfcb`. 1.100 F4-Eisfrachten, 22 W3-Erzfrachten, 54.870 produziertes Wasser und 54.750 Einheiten Konsum. In den letzten 30 und 7 Tagen gab es null Fortschritt bei den geprüften Produktions- und Ersatzzählern. Letzte W3-Lieferung bei Tick 140.238. Der letzte K7-Vertrag ist geliefert, W3/F4 sind inaktiv, alle Treuhandkassen leer. Das Weltgeld beträgt 33.000 ISK, Mint und Burn jeweils null. Der Stand enthält 134 Eis, null Erz und null Wasser in Aldera sowie 130 Eis, 20 Erz und 120 Wasser in Nadir.

| Konto, Seed 42 | Tag 90 | Tag 365 |
| --- | ---: | ---: |
| Konzern Haus | 15.307 | 19.146 |
| Hauspilot privat | 3.756 | 4.449 |
| Hauseigentümer privat | 0 | 0 |
| Haus + Hauspilot als Anteil am Weltgeld | 57,77 % | 71,50 % |
| Aldera | 1.099 | 1.100 |
| Nadir | 4.000 | 3.980 |
| Meridian | 1.962 | 2.297 |
| Spedition | 782 | 950 |
| Werft | 890 | 510 |
| Exportkäufer | 260 | 260 |

Kumuliert erfolgten bis Tag 365 Wasser-Einzelhandelszahlungen von 835.166 ISK und Ausschüttungen von 423.371 ISK, jeweils als wiederholt umlaufendes Geld. Der Rückfluss war vor dem Stillstand aktiv. Die 34.333 Verkäufe in Aldera und 20.417 in Nadir stammen aus den tatsächlich ausgeführten Käufen. Der Hauspilot konsumierte null und die Hausgesellschaft schüttete null aus. Das verbleibende Kaufbudget sitzt bei anderen Akteuren als die Ware. Auch die industrielle Ausweichroute hat einen eigenen Liquiditätsengpass. Das Exportkonto kann mit 260 ISK die volle W1-Erzcharge für 500 ISK nicht decken.

**Originalbefehle auf separaten Kopien, Tag 365.**

| Wahl | Beleg und Folge |
| --- | --- |
| Hauspilot kauft eine Einheit Wasser für 16 ISK | Atomare Ablehnung mangels Aldera-Bestand. |
| Haus schüttet den frei ausschüttbaren Überschuss aus | 16.961 ISK vom Konzern zum registrierten Eigentümer. Automatischer Verbrauchsetat des Eigentümers bleibt bei null. |
| Haus kauft Frachter in Nadir | 750 ISK an die Werft, neue Hülle `sh112`, bezahlte Überführung nach Aldera. Eisfolgeauftrag lehnt wegen vollem Nadir-Lager ab. |
| Haus kauft Miner in Aldera | 600 ISK an die Werft, neue Hülle `sh112` auf der eigenen Kopie. W1-Erzpendel lehnt wegen Unterdeckung des Exportkäufers ab. |
| Haus kauft einen Jäger für 900 ISK | Atomare Ablehnung mangels gebauter Hülle. Die 60-Prozent-Silizium-Kontrolle aus #650 belegte an Tag 90 einen freiwilligen Einzelkauf. |

### Freiwilliger Kauf mit verzögerter Folgeproduktion

Die Investitionsprobe startet über den unveränderten Manager-Treiber des Gesamtprofils bei S02/42, Tag 125, Hash `197255bedbdf6f93`. Kassen und kumulierte F4-/W3-Zähler entsprechen bereits dem Tag-365-Stillstand. Die Probe wiederholt den Kontrollarm und beide freiwilligen Käufe auf getrennten Original-Saves. Der einzige zusätzliche Versuch ist der reale Frachterkauf mit bezahlter Überführung beziehungsweise der reale Minerkauf. Anschließend laufen die vorhandenen Firmenpolitiken weiter. Die Lieferungen nutzen die bereits bezahlten Eisrunden und deren vorhandenen Rückfrachtpfad.

| Arm | Zusätzliche F4 nach 7 Tagen | Zusätzliches W3 | Zusätzliches Wasser | Veränderung Hauskasse | Hash nach 7 Tagen |
| --- | ---: | ---: | ---: | ---: | --- |
| Ohne Kauf | 0 | 0 | 0 | 0 ISK | `a760a95c654e1c3a` |
| Frachterkauf mit Überführung | 17 | 0 | 860 | +351 ISK | `ad3aa8b6d2bada6f` |
| Minerkauf | 16 | 0 | 800 | +432 ISK | `4f1f8adcd3620403` |

Der Kauf überträgt echte ISK an die Werft und entnimmt eine vorhandene Hülle aus dem Lager. Die frei gewordenen Lagerplätze und die höhere Werftkasse erlauben Folgeproduktion unter der vorhandenen Ersatzpolitik. In beiden Armen werden die letzten 20 Erz Nadirs verarbeitet und weitere Miner geliefert. Das ist ein gemessener Nutzen eines freiwilligen Einzelkaufs. Nach 30 und nach 90 zusätzlichen Tagen steht der Frachterarm bei +19 F4, +950 Wasser und +480 ISK Hauskasse gegenüber der Kontrolle. Der Minerarm steht bei +18 F4, +910 Wasser und +561 ISK Hauskasse. Zwischen beiden Kontrollpunkten entstand in keinem Arm weiteres Wasser, W3 oder F4. Die Werft hat die letzten 20 Erz in Nadir verarbeitet. Beide Kaufarme haben neue Produktion und Konsum ausgelöst, gefolgt von einem neuen Plateau. Der Kontrollarm blieb durchgehend im ursprünglichen Stillstand.

| Arm | Hash Tag 155 | Hash Tag 215 | Aldera-Wasser Tag 215 | Aldera-Kasse Tag 215 |
| --- | --- | --- | ---: | ---: |
| Ohne Kauf | `9ce544c9e7005230` | `1334c2d8d310cdce` | 0 | 1.100 ISK |
| Frachterkauf mit Überführung | `ab64707120d4ce7f` | `57d6c9d575968967` | 73 | 644 ISK |
| Minerkauf | `552aaaab70237068` | `b329c8194abe4081` | 86 | 517 ISK |

## Eigenständige Wasserlogistik

Die Originalrückfracht ist an den bereits bezahlten F4- oder W3-Rückflug gekoppelt. Der Endstand von S02 hat 120 Wasser in Nadir, null in Aldera. Die physische Kapazität und das Aldera-Lagerziel begrenzen eine hypothetische Fahrt auf 100 Einheiten. Preise sind 14 ISK in Nadir, 16 ISK im Aldera-Einzelhandel und 1 ISK Rückfracht je Einheit. Die Originalroute dauert 60 Minuten je Richtung. Lohn kostet 1 ISK/Minute, Wertverzehr 0,30 ISK/Minute. Die Rechnung bewertet Lohn und Wertverzehr als Untergrenze. Weitere Kosten für Kapital, Ausfall oder zusätzliche Abfertigung würden die Mindestdeckung erhöhen.

| Testfall | Befund |
| --- | --- |
| Rundfahrt zum Originalzuschlag | Vollladung deckt 100 von 156 ISK und unterschreitet bereits die 120 ISK Lohn. Mit Alderas 1.100 ISK kaufen Ware und Zuschlag höchstens 73 Einheiten für 1.095 ISK. Für den Frachtführer fehlen dann 83 ISK bis zu den Mindestkosten. Selbst bei vollständigem Absatz beträgt das gemeinsame Ergebnis −10 ISK. |
| Voll finanzierte Rundfahrt | 78 Einheiten decken 156 ISK genau bei vollständigem Absatz. 78 × 14 = 1.092 ISK reichen für die Ware. Einschließlich Lohn und Wertverzehr sind 1.248 ISK fällig, 148 mehr als Alderas Kasse. Aldera könnte aus der gesamten Kasse 67 Einheiten plus 156 ISK finanzieren. Die laufende Betriebsreserve von Aldera entspricht dem gesamten Kassenstand. |
| Rundfahrt mit 100 Einheiten | Kapital bis zur Lieferung 1.520 ISK für Ware und Lohn, 1.556 ISK einschließlich Wertverzehr. Mindestens 98 Verkäufe zu 16 ISK für eine vollkostenpositive Abrechnung. Bei vollständigem Absatz bleibt ein Überschuss von 44 ISK vor weiteren Kosten. Unverkaufte Ware bindet 14 ISK Einkaufspreis je Einheit. |
| Einzelfahrt ab Nadir | Kostengrenze 78 ISK, davon 60 ISK Lohn. Rechnerische Mindestmenge 39 Einheiten bei Vollabsatz und damit 624 ISK einschließlich Ware. Im S02-Endstand müsste der in Aldera stehende Frachter zuerst kostenpflichtig nach Nadir gelangen. Eine frisch gekaufte Nadir-Hülle bindet zusätzlich reales Kapital und ein Folgeauftrag erfordert wieder eine Positionierung. |
| Freiwilliges Angebot oder Vorfinanzierung | Nach ausgewiesener Betriebs- und Ersatzrücklage bleiben dem Haus rechnerisch 18.361 ISK, der Spedition 322 ISK. Beide könnten aus eigenem Kapital die Lücke von 148 ISK einer Mindestladung schließen. Bei voller Ladung übersteigen 456 ISK den freien Spielraum der Spedition. Gedeckte Bestellungen und Rückzahlung bleiben unbelegt. |

Die 13 rechnerisch unmittelbar kaufbaren Einheiten aus vorhandenen Aldera-Automatikbudgets ergeben sich aus fünf Einheiten für den Meridian-Eigentümer (92 ISK) und acht für den Aldera-Eigentümer (139 ISK). Die übrigen automatischen Haushalte haben am Kontrollpunkt weniger als 16 ISK ausgabefrei. Damit liegt der unmittelbar budgetierte Absatz selbst bei angenommenem Kaufverhalten unter der Mindestmenge von 39 Einheiten einer bereits in Nadir beginnenden Fahrt. Die 4.449 ISK des Hauspiloten wären für 278 Einheiten ausreichend, falls der Eigentümer sich ausdrücklich dafür entscheidet. Die bestehende Sparregel gibt der Automatik 0 ISK. Die Prognose zählt keine künftigen Löhne oder Ausschüttungen als vorab sichergestellte Erlöse. In Nadir bleiben alle fünf Haushalte unter dem Stückpreis von 14 ISK, obwohl ihr Wohnort 120 Einheiten auf Lager hat.

Im Regime S05 (80 % Standardsparquote) können vorhandene Aldera-Budgets am Tag 90 bis zu 87 Einheiten zusätzlich abnehmen, sofern die Haushalte nach der bestehenden Politik zum Kauf kommen. Die gemeinsame Rechnung für 87 vollständige Verkäufe ergibt 18 ISK über Lohn und Verschleiß. Mit 934 ISK Stationskasse fehlen für diese Ladung 440 ISK. Die reale Spedition und das Haus haben rechnerisch 1.000 beziehungsweise 2.203 ISK über ihren Rücklagen. Das ist ein Kandidat für eine spätere, ausdrücklich vereinbarte Vorfinanzierung. Ein hoher Sparbestand allein belegt weder Zustimmung noch Erlös. S08 ist der günstigere Gegenfall mit 117 Wasser in Nadir, freier 100er-Kapazität, zwei zeitlich geeigneten Frachtern in Aldera und 1.452 Einheiten rechnerischem Aldera-Automatikbudget. Aldera hält 750 ISK. Haus und Spedition könnten die Lücke von 806 ISK für 100 Einheiten aus dem Spielraum über ihren Rücklagen decken. Bei 98 Verkäufen blieben 12 ISK, bei 100 Verkäufen 44 ISK vor weiteren Kosten. Dieses Szenario deaktiviert die vorhandene Wasser-Rückfracht. Die gemessene Kaufkraft liefert eine Grundlage für freiwillige Bestellungen, aber noch keine Bestellung oder Abnahmegarantie. Gegenbeispiele sind S09 ohne Wasserbestand und S12 mit 20 Einheiten Lagerziel, bei dem die Fahrt trotz hoher Käuferbudgets mindestens 116 ISK unter den Vollkosten bleibt.

## Testnachweise

Lokal mit Node `22.23.4` 616/616 bestehende Regressionstests, 0 Fehler, Skips oder Abbrüche. Der unveränderte S02/42-Treiber lief bis Tag 730 mit exaktem Replay, die freiwillige Investitionsprobe auf allen drei Armen bis Tag 215 ebenfalls. Die [gesamte Abnahmematrix](https://github.com/tobiasfranziskus/Check/actions/runs/45827486733) enthält 39 Regime-Seed-Zellen über 90 Tage und S02 zusätzlich über 365 und 730 Tage für Seeds 42, 7 und 113. Jede Zelle veröffentlicht ein JSON-Ergebnis mit Save/Load- und Wirtschaftsprüfung sowie exakter Wiederholung.

## Offene Regelentscheidungen

1. **Verbindliche freiwillige Aufträge.** Ein Ausbau könnte eine explizite Bestellung durch bestehende Käufer ermöglichen. Vor Umsetzung wäre zu entscheiden, wer den Auftrag schließen darf, wie eigenes Geld und reales Wasser reserviert werden und wie ausgefallene Lieferungen abgewickelt werden. Die derzeit beobachteten Budgets belegen keinen kostendeckenden Auftrag.
2. **Träger und Risiko einer Vorfinanzierung.** Ein eigener Einsatz des Konzerns oder der Spedition braucht Zustimmung und eine Regel für Rückzahlung, Restwaren und Verluste. In der Forschungsrechnung ist der Vorschuss ein Risiko aus vorhandenem Kapital. Er ersetzt weder zahlende Abnehmer noch die vorhandenen Betriebs- und Ersatzrücklagen.
3. **Wirtschaftlicher Nutzen freiwilliger Käufe.** Ausschüttungen, Werftkäufe und ein persönlicher Wasserauftrag können freiwillige Entscheidungen bleiben. Eine Änderung an Nutzungszweck, Verbrauch oder Investitionsrechten braucht eine eigene Entscheidung. Einmalige Lagerkäufe belegen keinen laufenden Absatz.
