# W6 Industrie-Langzeitprüfung [ANALYSE / DRAFT]

Basis: `main f86bcd4` nach #486/#488, unveränderter autoritativer Regel204-Kern.
Keine Änderungen an `prototypes/spiel/`, Karriere, P3-Tests, Weltkern oder #470.
Kein Merge/Deployment. Diese Untersuchung aktiviert keine Wirtschaftsregeln.

## Reproduktion und Abgrenzung

Node **v22.23.4**. Aus dem Repository:

```sh
node tools/w6-industrie-langzeit.cjs alle 90
node tools/w6-industrie-langzeit.cjs S02 730
node tools/w6-industrie-langzeit.cjs trace 15
node --test tests/industrie/*.test.mjs
node --test tests/*.test.mjs
```

`tests/fixtures/w6-industrie/reference.json` enthält Tageszähler, Kontrollpunkte,
Regime/Politik, Seed und deterministische Referenzhashes. S02 hat Kontrollpunkte
an Tag 14, 90, 365 und 730. 365 ist der Präfix des 730-Tage-Laufs und wird beim
Replay getrennt geprüft. Die 13 Läufe sind **verschiedene bestehende Politiken**,
nicht 13 Seeds. Alle starten über den originalen Regel195→204-J8-Weg mit Seed42,
NPC-Automatik und dem vorhandenen NPC-Silizium-Opt-in wie im Industrienachweis #486.
Keine Umverteilung von Startkapital, neuen Käufer, Waren, Spielerzwangskäufe,
zusätzlichen Firmenbefehle, Policywechsel oder Rettungen während des Laufs.

## Tatsächliche Auftragskette

- W3: 50 physische Erz, 500 ISK Warenpreis und 240 ISK Frachtgebühr aus
  Nadir-Kapital, 120 ISK vorfinanzierte Speditionsarbeit; Hin-/Rückreise je 60 Minuten.
  Eigentümer `transport`, Käufer `st_nadir`. K7 benötigt getrennte Firmensignaturen,
  100 ISK Bergbau, 500 ISK Aldera-Ankauf und 530 ISK Werftvorfinanzierung.
- W4: `st_nadir` verarbeitet 10 Erz zu 5 Material in 20 bezahlten Arbeitsminuten;
  20 ISK werden vor Auftrag in Treuhand gesperrt. Keine Produktion aus bloßem Bedarf.
- W5: `werft_extern` kauft 5 Material für 500 ISK und reserviert 30 ISK Arbeit;
  30 Minuten Bau. Verkauf einer fertigen Lagerhülle für 750 ISK aus Käuferkasse,
  danach 60 ISK bezahlte Überführung nach Aldera. 220 ISK Differenz zwischen
  Bauauszahlung und Verkauf sind **keine vollständige Konzern-GuV**.
- Bedarf entsteht im Disponenten durch Gründung, realen Verschleiß/Ersatz und
  bestehende Lagerpolitik. Ohne bezahlbaren Käufer ist Vorproduktion kein Absatz.
  Miner-, J3- und J4-Produktion konkurrieren um dasselbe reale Material.

Lagerziele sind keine Anfangsbestände: Nadir hat Ziele 500 Erz, 200 Material,
2 Frachter; Aldera 100 Erz, 4 Miner, 1 Frachter. Maßgeblich bleiben die
Original-Core-Kapazitäts-/Reservierungsprüfungen, nicht diese Zielwerte allein.
Freie, leere, arbeitsfähige Schiffe am richtigen Ort sind zusätzlich erforderlich.
Haushalts-, Eigentümer-, Firmen- und Treuhandkassen sind getrennt; private
Ausschüttungen sind keine beliebig nutzbare Firmenliquidität.

## Audits und Aussagegrenze

An Kontrollpunkten: vollständiges Originalaudit und zusätzliche eigene Summierung
aller Kassen und physischen Lager/Ladungen gegen das Warenledger; Schiffsanzahl
gegen verbrauchte Lagerhüllen, Kaufbelege gegen tatsächliche Eigentümer,
W5-Lager gegen Produktion/Verkauf, Materialverbrauch einschließlich Miner/J3/J4,
Arbeits-Treuhandsalden und Save/Load-Hash. Negative Kopien mit verändertem Geld,
Erz, gelöschtem Schiff und fremdem Eigentümer müssen unabhängige Prüfung und
Original-Load ablehnen. Replay startet von derselben Quelle ohne Referenzanpassung
oder künstliche Nachfrage. Weltgeld 33.000 ISK und Mint/Burn 0 sind notwendig,
aber für sich kein Rentabilitätsbeweis.

Die tägliche Statistik begrenzt den letzten Produktionstag auf Tagesauflösung.
Die gesonderte 15-Tage-Minutenaufzeichnung hält den ersten tatsächlich vom
Disponenten protokollierten Auftritt jeder Sperre fest. Ein fehlgeschlagenes
Momentangebot oder die erste Wasserknappheit bedeutet noch keinen dauerhaften
Industrieausfall. Die Referenzdaten unterscheiden daher letzte Produktion,
aktuelle Originalangebote, Kassen, Lager und Transportverfügbarkeit.

Node/Core und CI werden separat belegt. Browser, physisches iPad und NAS werden
in dieser reinen Kernuntersuchung nicht neu geprüft. Keine Aussage über
unendliche Laufzeit, weitere Seeds, neue Expansion, Kriegsschäden oder neue Regeln.

## 13×90-Tage-Ergebnis und wirtschaftliche Engpässe

Alle Zahlen kumuliert. „Letzter Bau“ ist der letzte Tag mit neuem W5-Abschluss. Verkäufe sind nur produzierte W5-Hüllen; der gekaufte Gründungsfrachter ist separat. Die benannte Sperre ist ein belegter Engpass, nicht automatisch die alleinige Ursache.

| Regime | W3 | W4 | W5 gebaut/verkauft | Letzter Bau | Engpass / Ergebnis | Endhash |
|---|---:|---:|---:|---:|---|---|
| S01 | 1 | 1 | 1/0 | 1 | Keine Stilllegung, kein bezahlter Ersatzbedarf; eine unverkaufte Neubauhülle. | `83583952fd6ae3e9` |
| S02 | 20 | 97 | 49/48 | 89 | Wiederholte Ersatzproduktion bis Tag 89; kurzfristige Kassen-/Frachtpausen überwunden. | `c8d111c5f6463540` |
| S03 | 4 | 17 | 7/6 | 13 | Werft 220 < 530 ISK trotz 5 Material; eine gebaute Hülle unverkauft. Miner-/Werftfinanzierung steht. | `ba1f226ba2ccd234` |
| S04 | 1 | 5 | 2/1 | 87 | Geringe Endnachfrage, zeitweise Käuferkasse/Eislager voll; 90-Tage-Lauf allein beweist keinen dauerhaften Totalausfall. | `5a4e42a5b615ed3a` |
| S05 | 1 | 2 | 1/0 | 1 | Aldera 58 ISK, nächste Eischarge nicht finanzierbar; 30 Erz bleiben unverarbeitet. | `e3b507b43ee94197` |
| S06 | 1 | 2 | 1/1 | 1 | Aldera 216 ISK, übrige Firmen horten Kapital; 30 Erz vorhanden, Originalraffinerieangebot gültig. | `a11e61f7930c7d0a` |
| S07 | 1 | 1 | 1/0 | 1 | Ersatzkauf ausdrücklich deaktiviert; keine fortgesetzte Ersatznachfrage. | `d73e6633ea9d40dc` |
| S08 | 1 | 1 | 1/0 | 1 | Wasserrückfracht deaktiviert, Eislager Nadir voll; Ware/Kapital allein beheben keine Transportpolitik. | `1306243a5ae4ff87` |
| S09 | 1 | 1 | 1/0 | 1 | Wasserwerk deaktiviert, Eislager Nadir voll; keine nachgelagerte Verarbeitung. | `7e86d0745acced69` |
| S10 | 1 | 3 | 1/1 | 1 | Werft 0 ISK trotz 5 Material, kein finanzierbarer Neubau/kein Ersatz auf Lager. | `674145dc7b2e515e` |
| S11 | 21 | 102 | 49/48 | 88 | Vorproduktion und Ersatz laufen weiter; 49 Frachter, 48 Verkäufe, echte kurzfristige Leer-/Fahrtzeiten. | `c46b77d618d61b78` |
| S12 | 1 | 1 | 1/0 | 1 | Kleine Eis-/Wasserpuffer, nur eine industrielle Charge; fehlender regulärer Anschlussbedarf. | `4f4734a43fe1a88b` |
| S13 | 1 | 2 | 1/1 | 1 | Aldera 12 ISK bei trägem Geldumlauf; keine weitere finanzierte Eisabnahme. | `0ae36e1dae6df0ea` |

## Erste reale Sperren, minutengenau in S02

| Minute | Tatsächliche Sperre | Vorhandene Mittel / Bedeutung |
|---:|---|---|
| 64 | Kein Wasser in Aldera | Frühe Versorgungslücke, kein dauerhafter Industriekollaps. |
| 233 | Kein Wasser in Nadir | Vorübergehend fehlende Endware. |
| 3.192 | Aldera kann nächste Eischarge nicht bezahlen | Aldera 87 ISK; kein Zugriff auf fremde/private Kassen. |
| 4.992 | Kein einsatzfähiger Frachter in Aldera | Ersatz-/Überführungsablauf und Ortsbindung zählen; keine Teleportation. |
| 12.409 | K2-Minerbau nicht vorfinanziert | Werft 0 ISK, zugleich 2 fertige Frachter und 5 Material in Nadir. Warenbestand ist kein frei verfügbares Bargeld. |

Die fünf Momentzustände stehen in `reference.json:trace`. Spätere Produktion
beweist die Überwindung dieser konkreten S02-Sperren, nicht deren Nichtexistenz.
`fleet.viable/ready` zählt positive Buchwerte; in S01 ist Stilllegung ausgeschaltet,
daher ist ein Buchwert von null dort keine automatische Betriebssperre.

## Konkrete finanzierbare Folgeentscheidung

**S03 nach 90 Tagen:** Das unveränderte Originalangebot
`welt.kern.pilotW5Verkauf(s)` ist **gültig**, Preis **750 ISK**:
eine echte unverkaufte Hülle, `transport` **1.484 ISK**, Werft **220 ISK**.
Ein von `transport` selbst beschlossener zusätzlicher Kauf dieser Hülle würde
die Werftkasse auf **970 ISK** und die Speditionskasse auf **734 ISK** bringen.
Auch **60 ISK Überführung plus 120 ISK Frachtarbeit** sind daraus gedeckt.
Die Werft hätte damit wieder mehr als die **530 ISK** für einen Original-W5-Bau;
**5 Material** liegen bereits dort. Der sofort fehlende Schritt ist hier also
**der bezahlte Absatz einer bereits vorhandenen W5-Hülle**, nicht eine neue
Geldquelle oder ein Gratisauftrag.

Warum geschieht er nicht automatisch? Der reguläre Ersatzkauf verlangt, dass
kein tauglicher Frachter mehr existiert. Es gibt jedoch noch einen tauglichen
Frachter, der ohne weitere tragfähige Förder-/Transportnachfrage nicht weiter
verschleißt. Lagerkapital, Miner-/Werftliquidität und ereignisgebundene
Ersatznachfrage können dadurch auseinanderfallen. Der Spieler besitzt kein
Recht, eine fremde Firma zu diesem zusätzlichen Flottenkauf zu verpflichten.
Die Untersuchung liest das Angebot und führt **keinen Rettungskauf** aus.

Das ist **kein universelles W6-Rezept**: S06 hat andere Engpässe. Dort sind
30 Erz, 5.574 ISK in Nadir und ein gültiges 20-ISK-W4-Angebot vorhanden,
aber Aldera hat nur 216 ISK für die nächste Eischarge. Eine zusätzliche
Raffineriebestellung wäre bezahlbar, garantiert jedoch weder einen sinnvollen
Schiffskäufer noch die Wiederherstellung des Konsum-/Förderkreislaufs.
S08/S09 sperren ausdrücklich Transport/Verarbeitung. Eine Entscheidung über
zusätzliche zahlende Nachfrage, freiwillige Reinvestition und Firmenpolitik
bleibt daher erforderlich; sie wird hier weder neu implementiert noch fingiert.

## Kapitalfinanzierung und zusätzliche Produktion

Bereits S02×90 widerlegt die Annahme, es gebe nur den einmaligen
14-Tage-Anfangserfolg: 49 gebaute und 48 verkaufte W5-Hüllen. Einschließlich
des originalen Gründungsfrachters besitzt `transport` 49 gekaufte Frachter:
**36.750 ISK kumulierte Hüllenkäufe** aus anfangs **2.000 ISK Firmenkapital**,
ohne Einlage, Minting oder zusätzlichen Käufer. Die Kontenprüfung deckt jede
Zwischenfinanzierung durch vorhandene Mittel; Arbeits-/Materialaufwendungen,
Überführungen und Lagerabgänge bleiben im Originalkern gebucht. Das ist realer
wiederholter Kapitalumschlag, keine bloße Bewertung zum Schiffsbuchwert.
Die tatsächlichen Folgekäufe gelten als Absatz, nicht der Bau allein.

Daraus folgt weder eine allgemeine Gewinnzusage noch ein Anspruch auf beliebige
Expansion. Der verbleibende liquide Firmenbestand, Privatdividenden, reale
Kaufnachfrage, Materialbindung, Verschleiß und Stillstand müssen getrennt bleiben.
Das vorhandene Exportkonto und alle ursprünglichen Gründungslager gehören zur
unveränderten Ausgangswelt; sie sind keine später ergänzte Rettungsressource.
Die Daten zeigen auch Kassen außerhalb der Produktionsfirmen, statt sie als
frei verfügbares „Weltkapital“ zusammenzuziehen.

S03s erste protokollierte W5-Finanzierungssperre tritt bereits in **Minute
6.552** auf: **5 Material**, aber nur **70 ISK Werftkasse**. In Minute **9.493**
scheitert K2-Vorfinanzierung mit **360 ISK**, **10 Material** und einer fertigen
Frachterhülle. Diese frühen Sperren werden teils noch überwunden; ab dem letzten
W5-Abschluss an Tag 13 bleibt der Lauf bis Tag 90 ohne neuen Frachterbau.
Die minutengenauen Zustände stehen separat in `reference.json:traceS03`.

Die zusätzliche Geldprüfung rekonstruiert für `house`, `npc3`, `transport` und
`werft_extern` außerdem Kasse plus echte Arbeits-/Überführungsbindung aus
ursprünglicher Kasse, Original-Kontostatistik und **aus den gepaarten Belegen neu
summierten** Zusatztransfers. Sie übernimmt dafür weder `audit.ok` noch
`kanon.netto` als Sollwert. Auch eine geldmengenneutrale, unberechtigte Umbuchung
zwischen Haus und Werft wird als Negativfall erkannt. Die übrigen Konten werden
vollständig summiert und durch die originalen Stufen-/Eigentumsprüfungen geschützt;
eine davon unabhängige vollständige GuV jedes Haushalts wird nicht behauptet.

## Tatsächliche lokale Node22-Prüfergebnisse

Runtime: `/workspace/check-tools/node-v22.23.4-linux-x64/bin/node`, **v22.23.4**.
Der systemweite `node` ist v24.19.0 und wurde für diese Abnahme nicht verwendet.
Rohprotokolle unter `tests/fixtures/w6-industrie/qa/`:

| Prüfung | Ergebnis |
|---|---|
| Vorgeschriebener Befehl `node --test tests/*.test.mjs` mit Node22 | 105 vom lokalen Reporter gezählte Testdateien: 100 bestanden, 5 fehlgeschlagen, 0 Skips/Abbrüche; 1.613.119 ms. **Dieser Lauf ist nicht vollständig grün.** |
| Wiederholung der fünf betroffenen Dateien mit erlaubten Node-Unterprozessen | 11/11 Einzeltests bestanden, 0 Fehler/Skips; 4.920 ms. Ursache im ersten Lauf: `spawnSync … node EPERM`, nicht ein verändertes Archiv oder Produktcode. |
| Neue 13×90-Matrix mit jeweils vollständigem zweiten Lauf | bestanden; lokaler isolierter Reporter zählt eine Testdatei, 0 Fehler/Skips; 516.584 ms. Nicht als „ein Wirtschaftsszenario“ missverstehen. |
| Neue Konten-/Eigentums-Negativkontrollen, minutengenaue S02/S03-Spuren und Quellhash-Prüfung | 3/3 Einzeltests bestanden, 0 Fehler/Skips; 13.242 ms. |
| S03/S06-Kauf-/Raffinerie-Folgeentscheidungen mit Replay | 2/2 Einzeltests bestanden, 0 Fehler/Skips; 37.590 ms. |
| Erneute gesamte 13×90-Matrix nach Verschärfung der vier Einzelkontenprüfungen | alle 13 Läufe bestanden, sämtliche Tageszähler und Kontrollhashes mit erster Erzeugung identisch. |

Die getrennten Wiederholungen werden nicht zu einer erfundenen vollständig
grünen lokalen Gesamtausführung zusammengezählt. Der PR erhält zusätzlich einen
eigenen Node22-CI-Job für sämtliche 17 neuen Testfälle einschließlich S02×730;
sein tatsächlicher Status und der der bestehenden ausgelösten Workflows stehen
im PR und den verlinkten Checkläufen. Ein nicht gestarteter, laufender oder
fehlgeschlagener Job gilt nicht als bestanden. Die Source-/Testdateien bleiben
nach dem belegten Head unverändert; CI-Nachträge erfolgen im PR-Text.

## S02 über 365 und 730 Tage: begrenzt positiver Befund

| Tag | Erzfrachten / Erz | W4 / Material | W5 gebaut / verkauft | Miner gebaut | Ersatzkäufe aller Klassen | Hash |
|---:|---:|---:|---:|---:|---:|---|
| 14 | 4 / 200 | 18 / 90 | 7 / 6 | 7 | 14 | `daafc5405c915767` |
| 90 | 20 / 1.000 | 97 / 485 | 49 / 48 | 44 | 93 | `c8d111c5f6463540` |
| 365 | 77 / 3.850 | 382 / 1.910 | 200 / 199 | 178 | 378 | `53bc41b94393a4ee` |
| 730 | 153 / 7.650 | 761 / 3.805 | 401 / 400 | 356 | 756 | `9147ce314b9020d7` |

W3, W4 und W5 haben ihren jeweils letzten neuen Abschluss **an Tag 730**.
Die unveränderte S02-Ersatzpolitik finanziert diese Teilkette im geprüften
Zeitraum wiederholt aus tatsächlich umgeschlagenem Kapital: **300.750 ISK**
kumulierte Frachterkäufe einschließlich des Gründungsfrachters, obwohl die
Spedition nur mit 2.000 ISK startet. Der komplette Lauf behält 33.000 Welt-ISK,
Mint/Burn 0 und 3.000 ISK unberührtes Spielerkapital. Keine erzwungenen Spielerkäufe.

Am 730-Tage-Kontrollpunkt sind **40 Erz, 0 Material, 1 fertiger Frachter und
1 unverkaufter Jäger** in Nadir vorhanden. Werftkasse **0 ISK**, Spedition
**1.747 ISK**, Nadir **4.000 ISK**. Auch der positive Lauf kennt somit
Warenbindung und augenblicklich leere Werftkassen. Der nächste vorhandene
Hüllenverkauf für 750 ISK kann Werftkapital freisetzen; zusätzliche Produktion
setzt danach die reguläre bezahlte Raffinerie-/Werftentscheidung voraus.
Die S02-Politik hat solche Folgeschritte im gemessenen Verlauf wiederholt
selbst ausgelöst. Ein fehlender Materialbestand am Endzeitpunkt beweist daher
keinen bereits eingetretenen dauerhaften Totalausfall.

**Entscheidende Abgrenzung:** Für den normalen S02-Ersatzpfad fehlt innerhalb
730 Tagen keine nachweislich dauerhaft blockierende zusätzliche Regel. Für
weiteren, vorgezogenen oder expandierenden Industrieabsatz fehlt ein tatsächlich
beschlossener, aus bestehender Kasse bezahlter Folgeauftrag. S03 zeigt konkret
den gültigen, aber von der Ersatzpolitik nicht ausgelösten Zusatzkauf. Das
ist eine Akteurs-/Nachfrageentscheidung, keine Befugnis des Spielers über fremde
Firmen und keine Freigabe für neue Wirtschaftsregeln.

Der Jägerpfad bleibt bei **einem** gebauten, nicht gekauften Jäger und **0
Silizium in Nadir**. Kein garantiertes Jäger-Kaufprogramm, kein universeller
Industrieabsatz und kein Nachweis für alle Regime oder unendliche Laufzeit.
Die negativen S01/S03–S10/S12/S13-Befunde werden durch den positiven S02-Pfad
nicht aufgehoben. S04 zeigt späte Einzelproduktion, aber keine mit S02
vergleichbare vollständige, dauerhafte Kette.
