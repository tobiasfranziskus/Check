# W6 – Geldumlauf, Absatz und eigenständige Wasserlogistik

[Forschungs-Draft #651](https://github.com/tobiasfranziskus/Check/pull/651), gestapelt auf [#650](https://github.com/tobiasfranziskus/Check/pull/650) bei `f4fa8d59d4723c328bdd7ad56885580260c72b59`. Ausgangspunkt ist [Prüfkommentar 7192784374](https://github.com/tobiasfranziskus/Check/pull/650#issuecomment-7192784374).

## Verfahren

`tools/w6-geldumlauf.cjs` nutzt das vorhandene isolierte Node-Forschungsprofil und den Abnahmetreiber von #650. Es liest die echten Konten, Sparbudgets, Buchwerte, Standortlager und Schiffe am Kontrollpunkt. Ein ausdrücklich ausgelöster Kauf oder eine Ausschüttung wird ausschließlich auf einer validierten Kopie mit dem Originalbefehl versucht. Der Bericht unterscheidet Kassenbewegungen, Schiffseigentum, ausführbare Folgeaufträge und ungesicherte Erlöspotenziale. Ein abgelehnter Befehl muss den Save bytegleich erhalten. Ein erfolgreicher Befehl muss die Core- und unabhängigen Audits bestehen, einschließlich Geld, Waren und Save/Load. Der gesamte Lauf einschließlich der Proben wird exakt wiederholt. Der Ausgangsstand bleibt bytegleich.

```sh
node --test tests/*.test.mjs
node tools/w6-gesamtpaket.cjs S02 730 42 gesamt
node tools/w6-geldumlauf.cjs S02 90 42
node tools/w6-geldumlauf.cjs S02 365 42
node tools/w6-geldumlauf.cjs S02 730 42
node tools/w6-geldumlauf-investition.cjs 42 90
node tools/w6-geldumlauf-investition.cjs 42 605
```

## Reproduzierter S02-Stillstand und Geldumlauf

Der unveränderte #650-Treiber reproduzierte S02/42 bis Tag 730 mit exaktem Replay. Der gesamte JSON-Bericht stimmt mit dem [Referenzjob von #650](https://github.com/tobiasfranziskus/Check/actions/runs/45822411885/job/139917772147) überein. Der separate Tag-365-Lauf des Forschungswerkzeugs wiederholt `77aae111ae5163df`. Tag 730 endet bei `182e7175c374dfcb`. 1.100 F4-Eisfrachten, 22 W3-Erzfrachten, 54.870 produziertes Wasser und 54.750 Einheiten Konsum. In den letzten 30 und 7 Tagen gab es null Fortschritt bei den geprüften Produktions- und Ersatzzählern. Letzte W3-Lieferung bei Tick 140.238. Der letzte K7-Vertrag ist geliefert, W3/F4 sind inaktiv, alle Treuhandkassen leer. Das Weltgeld beträgt 33.000 ISK, Mint und Burn jeweils null. Der Stand enthält 134 Eis, null Erz und null Wasser in Aldera sowie 130 Eis, 20 Erz und 120 Wasser in Nadir.

| Konto, Seed 42 | Tag 90 | Tag 365 und 730 |
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

Der Kauf überträgt echte ISK an die Werft und entnimmt eine vorhandene Hülle aus dem Lager. Die frei gewordenen Lagerplätze und die höhere Werftkasse erlauben Folgeproduktion unter der vorhandenen Ersatzpolitik. Beide Kaufarme verarbeiten die letzten 20 Erz in Nadir und liefern weitere Miner. Ab Tag 155 steht der Frachterarm bei +19 F4, +950 Wasser und +480 ISK Hauskasse gegenüber der Kontrolle. Der Minerarm steht bei +18 F4, +910 Wasser und +561 ISK Hauskasse. Die zwei Kaufarme enden bei diesen Mengen auf einem neuen Plateau, der Kontrollarm bleibt im ursprünglichen Stillstand.

| Arm | Hash Tag 155 | Hash Tag 215 | Hash Tag 365 | Hash Tag 730 | Aldera-Wasser Tag 730 | Aldera-Kasse Tag 730 |
| --- | --- | --- | --- | --- | ---: | ---: |
| Ohne Kauf | `9ce544c9e7005230` | `1334c2d8d310cdce` | `77aae111ae5163df` | `182e7175c374dfcb` | 0 | 1.100 ISK |
| Frachterkauf mit Überführung | `ab64707120d4ce7f` | `57d6c9d575968967` | `0ffc3b51e897f35c` | `68a1bcebef3a62b9` | 73 | 644 ISK |
| Minerkauf | `552aaaab70237068` | `b329c8194abe4081` | `fb65d8e8453af203` | `3e0622c8bef7d210` | 86 | 517 ISK |

Alle drei Arme wurden bis zum Welttag 730 mit exakt gleichem Replay ausgeführt. Kassen, Lager und kumulierte Produktions- und Auftragsmengen sind je Arm von Tag 155 bis Tag 730 gleich. Alle ausgegebenen Kontrollpunkte haben 33.000 Welt-ISK, Mint/Burn 0 und Treuhand 0. Der Kontrollarm erreicht an Tag 365 und 730 genau die Hashes des ursprünglichen #650-Treibers.

## Eigenständige Wasserlogistik

Die Originalrückfracht ist an den bereits bezahlten F4- oder W3-Rückflug gekoppelt. Der Endstand von S02 hat 120 Wasser in Nadir, null in Aldera. Die physische Kapazität und das Aldera-Lagerziel begrenzen eine hypothetische Fahrt auf 100 Einheiten. Preise sind 14 ISK in Nadir, 16 ISK im Aldera-Einzelhandel und 1 ISK Rückfracht je Einheit. Die Originalroute dauert 60 Minuten je Richtung. Lohn kostet 1 ISK/Minute, Wertverzehr 0,30 ISK/Minute. Die Rechnung bewertet Lohn und Wertverzehr als Untergrenze. Weitere Kosten für Kapital, Ausfall oder zusätzliche Abfertigung würden die Mindestdeckung erhöhen.

| Testfall | Befund |
| --- | --- |
| Rundfahrt zum Originalzuschlag | Vollladung deckt 100 von 156 ISK und unterschreitet bereits die 120 ISK Lohn. Mit Alderas 1.100 ISK kaufen Ware und Zuschlag höchstens 73 Einheiten für 1.095 ISK. Für den Frachtführer fehlen dann 83 ISK bis zu den Mindestkosten. Selbst bei vollständigem Absatz beträgt das gemeinsame Ergebnis −10 ISK. |
| Voll finanzierte Rundfahrt | 78 Einheiten decken 156 ISK genau bei vollständigem Absatz. 78 × 14 = 1.092 ISK reichen für die Ware. Einschließlich Lohn und Wertverzehr sind 1.248 ISK fällig, 148 mehr als Alderas Kasse. Aldera könnte aus der gesamten Kasse 67 Einheiten plus 156 ISK finanzieren. Die laufende Betriebsreserve von Aldera entspricht dem gesamten Kassenstand. |
| Rundfahrt mit 100 Einheiten | Kapital bis zur Lieferung 1.520 ISK für Ware und Lohn, 1.556 ISK einschließlich Wertverzehr. Mindestens 98 Verkäufe zu 16 ISK für eine vollkostenpositive Abrechnung. Bei vollständigem Absatz bleibt ein Überschuss von 44 ISK vor weiteren Kosten. Unverkaufte Ware bindet 14 ISK Einkaufspreis je Einheit. |
| Einzelfahrt ab Nadir | Kostengrenze 78 ISK, davon 60 ISK Lohn. Rechnerische Mindestmenge 39 Einheiten bei Vollabsatz und damit 624 ISK einschließlich Ware. Im S02-Endstand stehen die zwei für eine Runde geeigneten Frachter `sh004` (Haus, 1.000 Restminuten) und `sh110` (Spedition, 1.240 Restminuten) in Aldera. Eine frisch gekaufte Nadir-Hülle bindet zusätzlich reales Kapital und ein Folgeauftrag erfordert wieder eine Positionierung. |
| Freiwilliges Angebot oder Vorfinanzierung | Nach ausgewiesener Betriebs- und Ersatzrücklage bleiben dem Haus rechnerisch 18.361 ISK, der Spedition 322 ISK. Beide könnten aus eigenem Kapital die Lücke von 148 ISK einer Mindestladung schließen. Bei voller Ladung übersteigen 456 ISK den freien Spielraum der Spedition. Gedeckte Bestellungen und Rückzahlung bleiben unbelegt. |

Die 13 rechnerisch unmittelbar kaufbaren Einheiten aus vorhandenen Aldera-Automatikbudgets ergeben sich aus fünf Einheiten für den Meridian-Eigentümer (92 ISK) und acht für den Aldera-Eigentümer (139 ISK). Die übrigen automatischen Haushalte haben am Kontrollpunkt weniger als 16 ISK ausgabefrei. Damit liegt der unmittelbar budgetierte Absatz selbst bei angenommenem Kaufverhalten unter der Mindestmenge von 39 Einheiten einer bereits in Nadir beginnenden Fahrt. Die 4.449 ISK des Hauspiloten wären für 278 Einheiten ausreichend, falls der Eigentümer sich ausdrücklich dafür entscheidet. Die bestehende Sparregel gibt der Automatik 0 ISK. Die Prognose zählt keine künftigen Löhne oder Ausschüttungen als vorab sichergestellte Erlöse. In Nadir bleiben alle fünf Haushalte unter dem Stückpreis von 14 ISK, obwohl ihr Wohnort 120 Einheiten auf Lager hat.

Im Regime S05 (80 % Standardsparquote) können vorhandene Aldera-Budgets am Tag 90 bis zu 87 Einheiten zusätzlich abnehmen, sofern die Haushalte nach der bestehenden Politik zum Kauf kommen. Die gemeinsame Rechnung für 87 vollständige Verkäufe ergibt 18 ISK über Lohn und Verschleiß. Mit 934 ISK Stationskasse fehlen für diese Ladung 440 ISK. Die reale Spedition und das Haus haben rechnerisch 1.000 beziehungsweise 2.203 ISK über ihren Rücklagen. Das ist ein Kandidat für eine spätere, ausdrücklich vereinbarte Vorfinanzierung. Ein hoher Sparbestand allein belegt weder Zustimmung noch Erlös.

S08 ist der günstigere Gegenfall mit 117 Wasser in Nadir, Platz für 100 Einheiten, zwei zeitlich geeigneten Frachtern in Aldera und 1.452 Einheiten rechnerischem Aldera-Automatikbudget. Aldera hält 750 ISK. Haus und Spedition könnten die Lücke von 806 ISK für 100 Einheiten aus dem Spielraum über ihren Rücklagen decken. Bei 98 Verkäufen blieben 12 ISK, bei 100 Verkäufen 44 ISK vor weiteren Kosten. Dieses Szenario deaktiviert die vorhandene Wasser-Rückfracht. Die gemessene Kaufkraft liefert eine Grundlage für freiwillige Bestellungen, aber noch keine Bestellung oder Abnahmegarantie. Gegenbeispiele sind S09 ohne Wasserbestand und S12 mit 20 Einheiten Lagerziel, bei dem die Fahrt trotz hoher Käuferbudgets mindestens 116 ISK unter den Vollkosten bleibt.

## Testnachweise

Lokal mit Node `22.23.4` 616/616 bestehende Regressionstests, 0 Fehler, Skips oder Abbrüche. Die Abnahmematrix auf `9eba37c103153345912aa6b22264e1ae057de1fc` ist mit 45/45 Jobs und 45 JSON-Artefakten abgeschlossen. Jede Zelle ist mit Save/Load- und Wirtschaftsprüfung sowie exakter Wiederholung belegt. Die ergänzende Investitionsprobe lief lokal mit Node 22. [GitHub-Actions-Lauf und Artefakte](https://github.com/tobiasfranziskus/Check/actions/runs/45827486733)

### 90 Tage mit drei Seeds

Alle 39 Zellen über 90 Tage lieferten vollständige Ergebnisse und exakt wiederholte Simulationsberichte. Jede Zelle hält 33.000 Welt-ISK und Mint/Burn 0. Die Endhashes stimmen durchgehend mit dem Gesamtprofil aus #650 überein. Die Mengen und Budgets sind innerhalb jedes Regimes über alle drei Seeds gleich. Das Aldera-Budget ist eine Obergrenze in Einheiten zu 16 ISK inklusive möglicher Abnahme des vorhandenen Aldera-Bestands. Importkapazität ist realer Nadir-Bestand, begrenzt durch Schiff und freies Aldera-Lagerziel. Kaufbudgets entsprechen keinen eingegangenen Bestellungen.

| Regime | F4 | W3 | Wasser | Wasser letzte 7 Tage | Aldera-Budget in Einheiten | Importkapazität | Endhashes 42 · 7 · 113 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| S01 | 227 | 1 | 11210 | 0 | 0 | 40 | `3867e00d9277b86c` · `3e3c87707b9c906c` · `445e4fb53a4dcbb5` |
| S02 | 1015 | 20 | 50650 | 3880 | 133 | 14 | `e13ef07d73b2b042` · `04ff18c46bb7aa13` · `d57ab0a57ff9b2da` |
| S03 | 196 | 4 | 9800 | 0 | 519 | 0 | `7234a0cb49e7496b` · `7391f9d2762b813b` · `e60b1ce467822c6b` |
| S04 | 34 | 2 | 1570 | 80 | 10 | 50 | `ebe42c07dd785c1a` · `657755690c4fefa2` · `82b13ad4b5a54aa9` |
| S05 | 9 | 1 | 340 | 0 | 87 | 100 | `f64c8f8ed46753a5` · `5c577eb65fd3288d` · `65871ed853b172e6` |
| S06 | 17 | 1 | 850 | 0 | 0 | 13 | `e13d0659a1a5e50f` · `17dcfbcb8725eca6` · `e7b3a1dabc17cbb9` |
| S07 | 52 | 1 | 2600 | 0 | 404 | 0 | `785e52d62c56828e` · `ed9de682b8b2cb95` · `6587120ceed6bef4` |
| S08 | 8 | 2 | 290 | 0 | 1452 | 100 | `fabca2f65d3300cb` · `2a5cce1974f608a7` · `aad9ecdacf2b84c5` |
| S09 | 3 | 2 | 0 | 0 | 1309 | 0 | `c63ab05e8ad976f0` · `77d2560252268175` · `dca1805e8022f6d4` |
| S10 | 39 | 1 | 1950 | 0 | 717 | 0 | `1520ad63c76a3da8` · `aa884e2f3a24082f` · `3521f27eb7b2c40c` |
| S11 | 1016 | 21 | 50800 | 3940 | 728 | 0 | `347812c8a3e659ef` · `6f1b7194e28acb20` · `ccdce7a87a7455dd` |
| S12 | 10 | 2 | 390 | 0 | 1250 | 20 | `18b9f12b19a90d42` · `6d0ca6cc68077c7f` · `0ff5d8ee18203196` |
| S13 | 33 | 2 | 1650 | 200 | 1195 | 13 | `622084db224ca622` · `316fafbe19e57fb7` · `452b10d4cb742579` |

### S02 bis Tag 365 und 730

Die sechs Langzeitläufe bestätigen über beide Horizonte jeweils 1.100 F4, 22 W3, 54.870 Wasser und null Fortschritt in den letzten 30 und 7 Tagen. Jeder Endstand hat 33.000 Welt-ISK, Mint/Burn 0, Treuhand 0 und einen rechnerischen unmittelbar finanzierbaren Aldera-Absatz von 13 Einheiten. Alle sechs Hashes stimmen mit den Referenzen aus #650 überein.

| Seed | Tag 365 | Tag 730 |
| --- | --- | --- |
| 42 | `77aae111ae5163df` | `182e7175c374dfcb` |
| 7 | `00f778b43a50f20e` | `60b542f78c9e383e` |
| 113 | `e9d6c003fb1c8848` | `169897ae8d20dc49` |

## Offene Regelentscheidungen

1. **Verbindliche freiwillige Aufträge.** Ein Ausbau könnte eine explizite Bestellung durch bestehende Käufer ermöglichen. Vor Umsetzung wäre zu entscheiden, wer den Auftrag schließen darf, wie eigenes Geld und reales Wasser reserviert werden und wie ausgefallene Lieferungen abgewickelt werden. Die derzeit beobachteten Budgets belegen keinen kostendeckenden Auftrag.
2. **Träger und Risiko einer Vorfinanzierung.** Ein eigener Einsatz des Konzerns oder der Spedition braucht Zustimmung und eine Regel für Rückzahlung, Restwaren und Verluste. In der Forschungsrechnung ist der Vorschuss ein Risiko aus vorhandenem Kapital. Er ersetzt weder zahlende Abnehmer noch die vorhandenen Betriebs- und Ersatzrücklagen.
3. **Wirtschaftlicher Nutzen freiwilliger Käufe.** Ausschüttungen, Werftkäufe und ein persönlicher Wasserauftrag können freiwillige Entscheidungen bleiben. Eine Änderung an Nutzungszweck, Verbrauch oder Investitionsrechten braucht eine eigene Entscheidung. Einmalige Lagerkäufe belegen keinen laufenden Absatz.
