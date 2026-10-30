# Aphros Void – Langzeitstabilität der bestehenden Wirtschaft v12

**30. Oktober 2026 · [ANALYSE/DRAFT] · kein Merge, kein Deployment, keine Regeländerung.**

**Ergebnis:** Die unbeeinflusste Welt hält 365 Tage mit geringer, ungefähr konstanter Mangelquote durch. Das ist **keine ausreichende wirtschaftliche Freigabe für die nächste Roadmap-Phase**: reguläre Spielerförderung kann den Geldumlauf und anschließend NPC-Schiffsersatz und Versorgung dauerhaft zum Stillstand bringen. Außerdem arbeitet die Sicherheit trotz überwiegend unbezahlter Betriebskosten weiter. Technische Determinismus-/Bilanztests bestehen auch in diesen wirtschaftlich gescheiterten Fällen.

## 1. Quellen, Methode und Reproduktion

Verbindliche Planung bleibt [ROADMAP.md](ROADMAP.md); sie wurde nicht geändert. Vor der Arbeit wurden `AGENTS.md`, Projektstatus, Roadmap, produktive Daten-/Core-Module, vorhandene v11/v12-Werkzeuge, Fixtures, Tests und CI gelesen.

- Über den GitHub-Connector bestätigter aktueller `main`: [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f). Letzter Produktmerge: [`1ff556592b475082e58d2918a9c7f3b02abd0566`](https://github.com/tobiasfranziskus/Check/commit/1ff556592b475082e58d2918a9c7f3b02abd0566), [PR #30](https://github.com/tobiasfranziskus/Check/pull/30), auf GitHub als gemergt bestätigt. Der neuere `main`-Commit ändert Dokumentation. Produkt: **v0.12.3, Regeln 12, Schema 8, Versorgungspriorität 1000**.
- `index.html` blieb bytegleich zur Basis. Git-Blob: `be0dfb2fe2514895ed4c64a29dd20bd26056b656`; SHA-256: `5e842417c5b05e057ad26499659089060ac96ddda913e38922886b1c54ff3653`.
- 13 feste Seeds, identisch zur v12-Referenz: **7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159**. Kein Cherry-Picking. Dazu drei ausgewählte 365-Tage-Spielerfälle und drei isolierende 90-Tage-Kontrollen auf Seed 42.
- Pro Seed ein durchgehender **365-Tage-Messlauf**, Messpunkte 90/180/365 (129.600/259.200/525.600 Minuten-Ticks), plus ein vollständiger **unveränderter Produktionskern als Replay**. Kein separater nachgebauter Wirtschaftskern. Die Instrumentierung ergänzt ausschließlich Beobachteraufrufe im zur Testlaufzeit extrahierten Quelltext; jeder Anker muss eindeutig vorkommen. Regeln, Zufallsfolge und Zustandsfelder werden nicht verändert.
- Jede Stunde in beiden Trajektorien: produktiver Geld-/Warenaudit, unabhängige Geld-/Lagerzählung, ganzzahlige nichtnegative Kassen und Waren. Im Messlauf zusätzlich jede einzelne Kasse gegen sämtliche beobachteten Zu-/Abflüsse und die Warenverbrauchsgründe gegen das Ledger. Täglich Hashgleichheit; an jedem Messpunkt zusätzlich vollständige kanonische Zustandsidentität, damit Hashkollisionen dort keine Abweichung verdecken.
- Save/Load an allen drei Messpunkten; der Replay wird an Tag 90/180 tatsächlich aus seinem Save weitergeführt, während der Messlauf ununterbrochen weiterläuft. Spielerfälle speichern dabei zusätzlich gültige wartende Umbenennungsbefehle, soweit der Start-Miner noch existiert. Tag 365 prüft den Roundtrip, keine Fortsetzung über 365 hinaus.
- **280.320 bestandene stündliche Auditpaare aus Core-Audit und unabhängiger Zählung** über beide Trajektorien der 16 Jahresfälle; **5.840 tägliche Hashvergleiche**, 48 gemeinsame Messpunkte mit insgesamt 96 Save/Load-Roundtrips. Die drei Kontrollen ergänzen 12.960 stündliche Prüfzeitpunkte über beide Trajektorien, 270 tägliche Hashvergleiche und sechs Roundtrips. Gesamt: **293.280 stündliche Prüfzeitpunkte, 6.110 tägliche Hashvergleiche**. Ein Prüfzeitpunkt umfasst Geld und sämtliche Waren; er ist kein einzelner Node-Test.
- Nach 90 Tagen wird **jeder vorhandene v12-Fixwert je Seed** gegen die unveränderte [Referenz-Fixture](../tests/fixtures/economy-priority-v12.json) geprüft (Herkunft PR #27, SHA `d8908ffb93c0dbbf9d1fea2b56387eab39b83dc3`, CI `41026155660`). 13/13 Profile stimmen einschließlich 791 Mangelstunden und 16.090 ISK ziviler Kostenlücke überein. Die Fixture enthält keine festen v12-Jahreshashes; die neuen Jahresdaten sind Messnachweise, **keine ersetzten Goldenwerte**.

Werkzeuge: [Jahreslauf](../tools/longterm-v12.mjs), [Beobachter](../tools/longterm-v12-observer.mjs), [Kontrollen](../tools/longterm-v12-player-probes.mjs), [Verdichtung](../tools/longterm-v12-summary.mjs). Die [verdichteten Messdaten](data/wirtschaft-langzeit-v12.json) enthalten Einzel-Seeds, alle Messpunkte, Kassen, Kosten, Hashes, Verluste, Flottenlücken, Liquidität und aggregierte Waren-/Handels-/Preis-/Transferdaten. [Kontrolldaten](data/wirtschaft-langzeit-v12-spielerkontrollen.json) enthalten die isolierenden Befehle und Ergebnisse. Vollständige Rohdaten einschließlich täglicher Hashes, Stationslager, Produktions-/Verbrauchsgründe und Transferkanten werden in CI als Artefakte pro Gruppe aufbewahrt und können lokal neu erzeugt werden. Quellcommit, Produkt-SHA und kombinierter SHA-256 von Jahreslauf/Beobachter stehen in jedem Jahresdatensatz; die hier gemessenen Tools hatten den kombinierten SHA **`d8e93ea0284cb4ef865b40261dac6c2cac2a14aaf4bc4604d537229c3ee577bb`**.

```sh
# Node.js 22; keine zusätzlichen Pakete
export LONGTERM_SOURCE_COMMIT="$(git rev-parse HEAD)"
node --test tests/*.test.mjs
node tools/longterm-v12.mjs --out=work/langzeit
node tools/longterm-v12.mjs --players --out=work/langzeit
node tools/longterm-v12-player-probes.mjs
node tools/longterm-v12-summary.mjs work/langzeit work/langzeit-summary.json
```

CI teilt die 13 Seeds in vier Gruppen und Spielerfälle/Kontrollen in zwei weitere Jobs; jede Seed-Gruppe läuft nur bis 365 und liest Zwischenstände aus. Die bestehende Regressions-CI bleibt erhalten und reagiert jetzt auch auf `tools/**`. Rohdaten sind Diagnoseartefakte; **keine wirtschaftlichen Grenzwerte werden abgesenkt**, um Kollapsfälle als stabil auszugeben.

## 2. Vergleich 90/180/365 – ohne Spieleraktionen

Alle Summen beziehen sich auf 13 getrennte Welten. Bestandsgrößen sind Messpunktbestände; Flüsse und Mangelstunden sind seit Beginn kumuliert. „Mangelstunde“ zählt ein Stations-/Warenpaar mit unvollständig erfülltem Stundenbedarf; mehrere fehlende Waren derselben Station zählen mehrfach. Die Quote verwendet 18 verbrauchte Stations-/Warenpaare × 24 Stunden × Tage × 13 Seeds.

| Kennzahl | 90 Tage | 180 Tage | 365 Tage |
| --- | --- | --- | --- |
| Mangelstunden gesamt | 791 | 1.582 | 3.142 |
| davon Nahrung | 772 | 1.539 | 3.051 |
| davon Bauteile | 18 | 41 | 87 |
| davon Medikamente | 1 | 2 | 4 |
| Stationskassen ISK | 302.449 | 306.543 | 311.816 |
| Fondskassen ISK | 84.246 | 83.524 | 86.100 |
| Händlerkassen ISK | 148.930 | 148.967 | 141.221 |
| Minerkonzern ISK | 78.000 | 78.000 | 78.000 |
| Spieler ISK (inaktiv) | 26.000 | 26.000 | 26.000 |
| Sicherheit ISK | 600 | 240 | 720 |
| Piraten ISK | 10.375 | 6.966 | 6.863 |
| Gesamte Geldmenge ISK | 650.600 | 650.240 | 650.720 |
| Geldschöpfung / Kopfgeld ISK | 1.553.640 | 3.082.200 | 6.302.880 |
| ISK-Vernichtung / Sicherheit | 1.618.040 | 3.146.960 | 6.367.160 |
| Ungedeckte zivile NPC-Kosten ISK | 16.090 | 18.213 | 27.106 |
| Ungedeckte Sicherheitskosten ISK | 5.401.960 | 10.893.040 | 22.102.840 |
| Zivile NPC-Verluste / Ersatzkäufe | 4.622 | 9.219 | 18.823 |
| NPC-Frachterverkäufe | 310.058 | 621.274 | 1.259.701 |
| Mangelquote | 0.1565 % | 0.1565 % | 0.1533 % |
| Median Mangelstunden je Seed | 58 | 121 | 238 |
| Median zivile NPC-Kostenlücke ISK | 1.160 | 1.427 | 2.083 |
| Median Stationskassen je Welt ISK | 22.959 | 23.562 | 23.968 |

Die Referenzwerte aus [v12-Versorgungsprüfung](TEST_VERSORGUNGSPRIORITAET_V12.md) werden vollständig reproduziert. Die früheren v11-Mangelstunden 4.204 sind historische 90-Tage-Vergleichswerte, **kein** hier erneut ausgeführter v11-Jahresversuch. Die Mangelquote steigt im Jahreslauf nicht an; geringes Restproblem bleibt vor allem Nahrung in Aldera und Dravos. Das gilt ausschließlich für die inaktive Spielerwelt.

### Einzel-Seeds und kritische Ausreißer

| Seed | Mangel 90 | Mangel 180 | Mangel 365 | NPC-Kostenlücke 365 ISK | Zivile Verluste 365 | Hash 365 |
| --- | --- | --- | --- | --- | --- | --- |
| 7 | 57 | 119 | 238 | 2.083 | 1.459 | `1f827f7dafed1f05` |
| 11 | 48 | 102 | 215 | 2.490 | 1.404 | `b763f6035bba0d55` |
| 1 | 58 | 121 | 249 | 2.412 | 1.474 | `d8ebac130d06b8d1` |
| 2 | 54 | 109 | 222 | 949 | 1.435 | `b9f0796ed241b3e3` |
| 65535 | 59 | 125 | 254 | 2.857 | 1.489 | `5dc4f43eaecd2966` |
| 42 | 58 | 113 | 227 | 1.572 | 1.364 | `f7139a715303a31b` |
| 1234 | 83 | 142 | 282 | 1.705 | 1.466 | `1718eedb607c9bd9` |
| 98765 | 60 | 122 | 229 | 3.519 | 1.428 | `6101e32550e5c970` |
| 3 | 55 | 115 | 257 | 2.211 | 1.475 | `3eb174996afbf532` |
| 99 | 73 | 146 | 259 | 2.669 | 1.470 | `db3989145a1dfed5` |
| 2024 | 75 | 121 | 234 | 1.408 | 1.389 | `79b3bc742e81ffe2` |
| 2025 | 64 | 136 | 245 | 1.160 | 1.481 | `cfd3ef1fd72d2ffd` |
| 314159 | 47 | 111 | 231 | 2.071 | 1.489 | `b27299302f9243ec` |

Seed **1234** hat den höchsten Jahresmangel (282, davon 275 Nahrung), Seed **11** den niedrigsten (215). Die größte zivile Jahreskostenlücke hat Seed **98765** mit **3.519 ISK**. Keine dieser unbeeinflussten Welten verliert dauerhaft eine vollständige NPC-Flotte.

### Mangel nach Station und Ware

| Station | Nahrung 90/180/365 | Bauteile 90/180/365 | Medikamente 90/180/365 |
| --- | --- | --- | --- |
| st_aldera | 404 / 813 / 1.631 | 0 / 0 / 0 | 0 / 0 / 0 |
| st_cyris | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| st_dravos | 368 / 725 / 1.419 | 17 / 39 / 79 | 1 / 2 / 4 |
| st_meridian | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| st_nadir | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| st_orion | 0 / 1 / 1 | 0 / 0 / 0 | 0 / 0 / 0 |
| st_veldra | 0 / 0 / 0 | 1 / 2 / 8 | 0 / 0 / 0 |

Alle Station-/Ware-/Seed-Einzelzellen stehen in den verlinkten Messdaten unter `baseline[].points[].shortage`; Nullwerte wurden nicht aus dem Datenbestand entfernt.

## 3. Förderung, Produktion, Bestände und Meridian

Die folgende Tabelle bilanziert alle 18 Waren bis Tag 365 über 13 Welten. Bestand umfasst Stationslager **plus Fracht**; aktive Schiffe und eingebaute Module gelten im bestehenden Ledger bei Aktivierung/Einbau als verbrauchte Waren. `consumed` enthält Rezeptinputs, Grundverbrauch, Aktivierung und Frachtverlust; es bedeutet nicht ausschließlich Konsum durch Bevölkerung.

| Ware | Förderung | Produktion | Verbrauch gesamt | Import | Export | Bestand 90/180/365 |
| --- | --- | --- | --- | --- | --- | --- |
| bauschiff | 0 | 0 | 0 | 0 | 0 | 13 / 13 / 13 |
| bauteil | 0 | 1.378.442 | 1.384.196 | 40.564 | 35.241 | 3.045 / 3.179 / 3.053 |
| bergbau | 0 | 13 | 0 | 0 | 0 | 65 / 65 / 65 |
| dock | 0 | 0 | 0 | 0 | 0 | 39 / 39 / 39 |
| eis | 4.243.471 | 0 | 4.124.951 | 27.656 | 140.969 | 14.332 / 14.451 / 14.463 |
| erz | 11.442.496 | 0 | 11.315.337 | 4 | 117.558 | 23.280 / 23.319 / 23.385 |
| fabrik | 0 | 0 | 0 | 0 | 0 | 39 / 39 / 39 |
| frachter | 0 | 8.573 | 8.575 | 0 | 0 | 25 / 22 / 24 |
| jaeger | 0 | 0 | 0 | 0 | 0 | 26 / 26 / 26 |
| kristall | 753.379 | 0 | 716.592 | 2 | 35.353 | 3.237 / 3.190 / 3.204 |
| lager | 0 | 13 | 0 | 0 | 0 | 91 / 91 / 91 |
| material | 0 | 4.386.916 | 4.214.877 | 27.976 | 198.281 | 11.625 / 11.286 / 11.614 |
| medikamente | 0 | 716.225 | 684.169 | 21.675 | 54.025 | 2.775 / 2.747 / 2.735 |
| miner | 0 | 10.248 | 10.248 | 0 | 0 | 25 / 25 / 26 |
| nahrung | 0 | 2.005.306 | 1.931.665 | 24.722 | 98.373 | 4.252 / 4.239 / 4.228 |
| silizium | 1.860.262 | 0 | 1.736.494 | 33.646 | 154.251 | 7.293 / 7.102 / 7.401 |
| verteidigung | 0 | 13 | 0 | 0 | 0 | 65 / 65 / 65 |
| werft | 0 | 0 | 0 | 0 | 0 | 26 / 26 / 26 |

Verbrauchsgründe über alle Waren, in heterogenen Wareneinheiten: rezepte **21.402.601**, grundverbrauch **3.865.462**, frachtverlust **840.218**, aktivierung **18.823**. Diese Summe ist keine Wertsumme. Produktions- und Fördermengen je Station/System sowie Verbrauchsgründe je Ware sind in den Messdaten enthalten.

**Meridian ist ein offenes Warenreservoir.** Stündlich wird der Bestand um `floor((Ziel − Bestand)/10)` angepasst, ohne Kaufpreis, Verkäufer, Käufer oder externe ISK-Kasse. Import und Export sind sauber im Warenledger, aber keine selbstfinanzierte Außenwirtschaft. Bei negativem Abstand wirkt Abrunden asymmetrisch: kleine Überschüsse werden eher exportiert, kleine Fehlmengen unter zehn Einheiten erzeugen noch keinen Import. Das ist bestehender Code, kein in diesem Auftrag eingeführtes System. Selbstfinanzierung der ganzen Warenwirtschaft kann daher aus bestandenen Audits nicht abgeleitet werden. Es wurde kein Versuch ohne Meridian durchgeführt.

NPC-Piratenschiffe werden gegen ISK-Zahlung nacherzeugt, **ohne** vorhandene zivile Schiffshülle oder Rezeptinputs zu verbrauchen. Sie liegen außerhalb des Warenledgers; ihre Finanzierung und Verluste werden separat gezählt. Anfangsflotten sind Startausstattung, keine im Lauf bezahlten Ersatzkäufe.

## 4. Geldflüsse, Liquidität und Kapitalbindung

| Fluss ISK (kumuliert) | 90 | 180 | 365 |
| --- | --- | --- | --- |
| Warenhandel (Transfer) | 662.924.376 | 1.327.989.493 | 2.694.118.930 |
| Handelsgebühren → Fonds/Station | 20.766.478 | 41.639.551 | 84.527.919 |
| Bezahlter ziviler Betrieb → Fonds | 46.321.390 | 92.599.093 | 187.800.105 |
| NPC-Überschuss → Fonds der ärmsten Station | 98.710.024 | 197.935.870 | 401.432.967 |
| Lokaler Fonds → Station | 104.497.550 | 208.975.175 | 423.853.685 |
| Fondsüberschuss → ärmste Station | 61.307.096 | 123.206.815 | 249.912.206 |
| Meridian → Piraten für Beute | 3.850.975 | 7.669.866 | 15.720.563 |
| Piraten → Meridian für Ersatz | 3.879.600 | 7.701.900 | 15.752.700 |
| Neues Geld durch Kopfgeld | 1.553.640 | 3.082.200 | 6.302.880 |
| Vernichtetes Geld für Sicherheitsbetrieb | 1.618.040 | 3.146.960 | 6.367.160 |

Mehrfache Umläufe derselben ISK sind hier gewollt: diese Transferzeilen dürfen nicht als neu geschaffenes Geld addiert werden. Die vollständigen Transferkanten werden im Rohartefakt erfasst und jede Kasse stündlich gegen sie geprüft. Unbezahlte Kosten werden **nicht als Geldfluss** gezählt.

**Kein schleichendes Geldmengenwachstum im Basistest:** Start 55.000 ISK pro Welt; am Jahresende 50.000–50.240. Die Startkasse der Sicherheit (5.000) wird größtenteils vernichtet; anschließend halten Kopfgelder und tatsächlich bezahlter Sicherheitsbetrieb die zirkulierende Geldmenge ungefähr konstant. `minted = kopfgeld`; ziviler Betrieb, Gebühren, NPC-Abgaben, Zuschüsse und Fonds sind Transfers. Schiffs-/Frachtverlust vernichtet keine ISK. Nur der zusätzliche Stationskauf im Spielerfall verbrennt darüber hinaus 8.000 ISK.

**Zivile Kosten:** NPC1 17.963, NPC2 9.143, NPC3 0 ISK ungedeckt nach 365 Tagen. Die Kostenlücke von NPC1+2 steigt von 16.090 auf 27.106; bei 141.501.644 ISK Sollkosten ist sie klein, aber real. Sie ist eine Diagnose der nicht abgebuchten Sollkosten, **keine im Spiel gespeicherte Schuld**. Kosten werden auf vorhandene Kasse begrenzt; die meisten NPC-Aktivitäten laufen trotzdem weiter. 25.768 Stationsstunden unterschreiten 2.500 ISK, aber keine Stationskasse ist bei den Stundenendmessungen exakt null. Intrastündliche Minima werden nicht erfasst; Förder-/Handelsoperationen können also vorher stärker eingeschränkt sein.

**Sicherheit als bestätigte Unterdeckung:** 28.470.000 ISK Jahres-Sollkosten, nur 6.367.160 bezahlt, **22.102.840 ungedeckt (77,64 %)**. Sie arbeitet auch bei leerer Kasse weiter; alle fünf Startjäger pro Welt bleiben vorhanden. Dies belegt keine dauerhaft finanzierte Sicherheitsflotte. Die Kostenlücke bestand schon am Tag 90 und wurde in der bisherigen, auf zivile Händler konzentrierten Referenz nicht als Gesamtrisiko ausgewiesen.

**Baseline-Kapital:** Der Minerkonzern liegt an allen Messpunkten bei 6.000 ISK pro Welt, die Händler zusammen am Jahresende zwischen 8.408 und 12.000. Die bestehende stündliche Überschussabgabe oberhalb 6.000 verhindert bei diesen Owner-Arten dauerhafte Akkumulation; 401.432.967 ISK zirkulieren darüber zurück. Stationen/Fonds halten zusammen 397.916 ISK über alle Welten. Das ist ein funktionierender, stark genutzter Rückfluss, kein Beleg, dass beliebige zusätzliche Akteure oder Gewinne tragfähig wären.

## 5. Handel, Transport, Verluste und Schiffsersatz

| Kennzahl (Summe) | 90 | 180 | 365 |
| --- | --- | --- | --- |
| Erfolgreiche Warenhandelsoperationen | 1.246.880 | 2.497.894 | 5.066.374 |
| Gehandelte Wareneinheiten | 16.750.737 | 33.477.466 | 67.847.019 |
| Handelswert ISK ohne Gebühren | 662.924.376 | 1.327.989.493 | 2.694.118.930 |
| NPC-Frachter-Verkaufsvorgänge | 310.058 | 621.274 | 1.259.701 |
| Realisierte NPC-Frachter-Handelsmarge ISK | 102.279.081 | 204.894.436 | 415.669.626 |
| Reisende Schiffminuten | 8.438.894 | 16.878.721 | 34.238.010 |
| Fracht-Einheitenminuten | 213.663.119 | 426.579.147 | 864.037.941 |
| Zerstörte Frachteinheiten | 209.746 | 414.170 | 840.218 |
| Zivile NPC-Verluste | 4.622 | 9.219 | 18.823 |
| Bezahlte zivile Ersatzschiffe | 4.622 | 9.219 | 18.823 |
| Piratenverluste | 12.947 | 25.685 | 52.524 |
| Bezahlter Piratenersatz | 12.932 | 25.673 | 52.509 |
| Sicherheitsverluste | 0 | 0 | 0 |
| Ersatz-Zuschüsse aus Fonds ISK | 0 | 0 | 0 |

Handelsoperationen umfassen Käufe und Verkäufe einschließlich ziviler Ersatzhüllen; dieselbe Ware kann mehrfach gezählt werden. Beuteverkäufe laufen außerhalb dieser Handelsfunktion und stehen separat bei den Geldflüssen. Fracht-Einheitenminuten messen den tatsächlich an Bord transportierten Bestand pro Reise-Tick, auch bis zu einem Verlust; keine erfundenen Entfernungs- oder Tonnenwerte.

Die Handelsmarge nutzt FIFO-Einstand einschließlich Kaufgebühr und tatsächlich erzielten Verkaufserlös abzüglich Verkaufsgebühr. Sie wird nur für den zuordenbaren verkauften Teil berechnet, nicht für geförderte Waren ohne Einkauf. Sie ist **vor Betrieb, Ersatzschiffen, Abgaben und vernichteter/unverkaufter Fracht**; daher kein Konzern-Nettogewinn. Teilmengen verteilen Gebühren anteilig, Tabellen runden auf ISK. Vollständige Kassen- und Transferbilanz ist die maßgebliche Nettovermögensprüfung.

In den 13 Baselines werden alle 18.823 zivilen Verluste bis zu den Messpunktenden aus vorhandenen Kassen und vorhandenen Werfthüllen ersetzt; **kein Fonds-Zuschuss erforderlich**. Stundenend-Flottenlücken summieren sich auf Miner 226, NPC1 39 und NPC2 18 fehlende Schiffstunden; keine vollständige Flotte fällt eine Stunde aus. Das begründet tragfähigen **zivilen** Ersatz in diesen Welten. Sicherheit hat keinen Verlust und damit keinen Belastungsnachweis ihres Ersatzkaufs. Piratenersatz ist bezahlt, aber wie oben beschrieben nicht materialgedeckt. Die Differenz 52.524 Piratenverluste zu 52.509 Ersatzkäufen entspricht den an den Endpunkten fehlenden Start-/Sollschiffen.

## 6. Reale Spielerbefehle und isolierende Kontrollen

Keine Kassen, Lager, Flotten oder Regeln wurden für Spielerfälle direkt verändert. Alle starten mit den produktiven 2.000 ISK und zwei Startschiffen. Anfang: ein Nahrungskauf und -verkauf in getrennten Ticks, anschließend Kauf und Aktivierung einer Frachter- bzw. Jägerhülle; danach bestehende Förder-/Handelsbefehle. Alle ausgeführten Queue-Befehle müssen erfolgreich sein; eine Ablehnung bricht den Test ab. Die vollständigen Befehle mit Tick und Schiff-ID stehen in den Messdaten.

- `handel-flotte`, Seed 42: Start-Miner fördert Erz, beide Frachter handeln selbständig.
- `station`, Seed 1234: dieselbe aktive Flotte; bei ausreichender echter Spielerkasse Kauf einer erreichbaren Station. Tatsächlich ausgeführt bei Tick **781**, Preis **8.000 ISK**, keine Finanzspritze. Stationssubventionen entfallen gemäß bestehender Eigentumsregel, Dividenden gehen nach bestehender Regel an den Spieler.
- `jagd`, Seed 98765: Kauf/Aktivierung eines Jägers, Reise nach Orion und gültiger Jagdbefehl bei Tick **61**, daneben Start-Miner und Start-Frachter aktiv.

| Fall / Seed | Mangel 90 | Mangel 180 | Mangel 365 | Spielerkasse 365 ISK | NPC1/NPC2 Schiffe 365 |
| --- | --- | --- | --- | --- | --- |
| handel-flotte / 42 | 36.659 | 75.539 | 155.459 | 39.762 | 0 / 0 |
| jagd / 98765 | 36.525 | 75.405 | 155.325 | 40.455 | 0 / 0 |
| station / 1234 | 36.503 | 75.383 | 155.303 | 30.505 | 0 / 0 |

**Bestätigter dauerhafter Versorgungskollaps in allen drei Jahresfällen:** Handel, Förderung, Produktion und nichtspielerische Kassen verändern sich zwischen Tag 90, 180 und 365 nicht mehr; nur der offene Meridian-Warenausgleich und weiterlaufende Stunden-/Mangel-/Kostenstatistik bleiben aktiv. Die Mangelzunahme von Tag 90 bis 365 beträgt in jedem Fall exakt **118.800 = 275 × 24 × 18**: jedes regulär verbrauchte Stations-/Warenpaar fehlt in jeder weiteren Stunde. Beide NPC-Handelsflotten bleiben bei null. Beispiel Seed 42: NPC1 ist am Jahresende seit 8.641 Stunden durchgehend ohne Schiff, NPC2 seit 8.585 Stunden; vorhandene Ersatzregeln bringen sie nicht zurück. Die Spielerhändler können verloren gehen, ohne automatische Spieler-Wiederbeschaffung; das wird nicht als kostenloser Ersatz kaschiert.

Der Spieler besitzt im Fall 42 **79,52 %** der verbleibenden 50.000 ISK, im Jagdfall **80,91 %**. Geld wurde überwiegend **übertragen und gebunden**, nicht gelöscht. Im Stationsfall sind nach realer Kaufvernichtung noch 42.000 ISK vorhanden, davon 30.505 beim Spieler; der Kauf verschärft den Entzug, ist aber keine notwendige Bedingung.

Um Kauf, Flottengröße und Jagd als notwendige Auslöser zu prüfen, wurden zusätzlich **unveränderte Regeln** mit nur einem aktiven Startschiff bzw. nur einem Kauf auf Seed 42 für 90 Tage zweimal simuliert, einschließlich Stunden-Audits, täglichen Hashes und Save/Load an Tag 30/90:

| Kontrolle (Seed 42) | Mangel 30 | Mangel 90 | Spielerkasse 90 ISK | NPC1/NPC2 Schiffe 90 |
| --- | --- | --- | --- | --- |
| nur-miner | 9.878 | 35.798 | 42.795 | 0 / 0 |
| nur-handel | 60 | 202 | 17.102 | 3 / 2 |
| nur-kauf | 28 | 63 | 1.220 | 3 / 2 |

Zum Vergleich dieselbe inaktive Basis Seed 42: **58** Mangelstunden nach 90 Tagen. Bereits ein einzelner validierter `shipMine`-Befehl für den sicheren Aldera-Start-Miner genügt im isolierten Fall für den Totalausfall beider Händlerflotten. Nur der Kauf mit anschließendem Halten bleibt nahe am Basiswert. Nur der Handelsbefehl führt hier zum Verlust des Spielerfrachters, 17.102 gebundenen ISK und erhöhtem Mangel, aber **nicht** zum vollständigen NPC-Flottenausfall bis Tag 90. Die Zusatzkontrollen beweisen keine Häufigkeit über alle Seeds.

**Nachgewiesener Pfad:** Förderung erzeugt Erz, der Stationskauf des Erzes überträgt ISK an den Spieler; Betrieb und Gebühren geben nur einen Teil zurück. `npcAusgabenArten` enthält `trader`/`miner`, aber keinen `player`: der bestehende Überschussrückfluss erfasst das Handelshaus nicht. Beim Zusammenbruch haben Stationen zu wenig Kaufkraft, NPC-Händler sterben aus, Fonds können die Reaktivierung nicht ausreichend finanzieren, und Restkapital unterhalb der Abgabeschwelle bleibt in Teilkassen. Das ist durch tatsächliche Zahlungsflüsse und die Ein-Befehl-Kontrolle belegt. **Hypothese, noch nicht als Reparatur getestet:** Eine Anpassung des vorhandenen Überschussrückflusses könnte diese Bindung begrenzen. Keine vorgeschlagene Regelvariante wurde hier angewandt; eine Spieler-Kapitalobergrenze wäre zudem eine bewusste Produktentscheidung.

## 7. Preise und Stabilitätsurteil

Beobachtete stündliche Preise über alle Baseline-Stationen/Seeds, gewichtet nach der Zahl gleicher Stundenmessungen je Stations-/Warenpaar:

| Ware | Min–Max ISK (365) | Mittel 90 / 180 / 365 ISK |
| --- | --- | --- |
| erz | 7–17 | 8.69 / 8.69 / 8.69 |
| material | 21–67 | 28.43 / 28.42 / 28.42 |
| bauteil | 59–140 | 92.16 / 92.19 / 92.21 |
| eis | 9–27 | 11.65 / 11.65 / 11.64 |
| silizium | 17–52 | 25.26 / 25.23 / 25.24 |
| nahrung | 24–57 | 34.02 / 34.02 / 34.02 |
| medikamente | 79–192 | 128.91 / 128.90 / 128.93 |
| miner | 600–840 | 621.91 / 621.55 / 621.60 |
| frachter | 750–1350 | 772.13 / 772.44 / 772.75 |
| jaeger | 900–900 | 900.00 / 900.00 / 900.00 |
| lager | 156–156 | 156.00 / 156.00 / 156.00 |
| bergbau | 180–180 | 180.00 / 180.00 / 180.00 |
| fabrik | 300–300 | 300.00 / 300.00 / 300.00 |
| dock | 360–360 | 360.00 / 360.00 / 360.00 |
| werft | 450–450 | 450.00 / 450.00 / 450.00 |
| verteidigung | 202–202 | 202.00 / 202.00 / 202.00 |
| bauschiff | 1200–1200 | 1200.00 / 1200.00 / 1200.00 |
| kristall | 21–41 | 25.93 / 25.92 / 25.92 |

**Preise:** In den Baselines kein Hinweis auf fortschreitende Preisinflation; Mittelwerte stabilisieren sich, nominale Preisgrenzen und Basiswerte bleiben unverändert. Spieler-Kollapsfälle erreichen hohe Knappheitspreise bei fehlenden Käufern/Transporten: Preisgrenzen verhindern keinen realen Versorgungsausfall. Preisstabilität ist deshalb nicht mit funktionierender Wirtschaft gleichzusetzen. Die Baseline-Preistabelle ist kein Spieler-Preisnachweis; deren Stundenpreisreihen liegen im Rohartefakt.

**Versorgung:** Im inaktiven Jahrestest stabil mit geringem, räumlich konzentriertem Restmangel; mit aktiver Spielerförderung in den drei geprüften Fällen nicht langzeitstabil. Mehr globale Nahrung allein behebt einen Geld-/Transportstillstand nicht.

**Liquidität:** Die NPC-Überschuss- und Fondsregeln tragen die Baseline. Spielerakkumulation entzieht ihnen die Umlaufmittel. Sicherheit ist schon ohne Spieler strukturell unterfinanziert. Keine verallgemeinerte Aussage über noch nicht eingeführte Personal-/Reparatur-/Modulsysteme.

**Schiffsersatz:** Ziviler Baseline-Ersatz bezahlt und materialgedeckt; bei aktiven Spielerfällen keine ausreichende Erholungsfähigkeit. Sicherheit ohne gemessene Verluste nicht abgenommen; Piraten gegen ISK bezahlt, materialseitig außerhalb der Produktionswirtschaft.

**Roadmap-Gate:** v0.12.3 ist als reproduzierbare technische Basis und für gezielte Korrekturen in Phase B brauchbar, **nicht ausreichend wirtschaftlich abgesichert für selbstfinanzierte Expansion und weitere Ausgaben-/Piratensysteme**. Reale Safari-/NAS-Abnahme bleibt zusätzlich offen. Die Roadmap selbst wird durch diesen Analyse-PR nicht umgeplant.

## 8. Priorisierte kleinste Untersuchungen an vorhandenen Regeln

1. **P0 – Kapitalrückfluss zuerst:** den vorhandenen `npcAusgaben`-Pfad und seinen Owner-Filter `npcAusgabenArten` untersuchen. Der kleinste isolierte Gegenversuch wäre, nur die Geltung der bereits vorhandenen Überschussabgabe auf das aktive Handelshaus zu erweitern und alles andere unverändert zu lassen. Das ist **eine ungetestete Diagnosehypothese, keine Freigabe für eine automatische Spieler-Steuer oder harte Kapitalgrenze**. Der Parameter `npcObergrenze` allein für NPCs kann beim Spieler gebundene ISK nicht zurückholen; eine pauschale NPC-Grenzenänderung ist daher kein belegter Fix. Vor einer Produktänderung Nutzen und Eingriff in den Spielervermögensaufbau ausdrücklich entscheiden, dann gegen dieselben 13 Jahresfälle und Spieler-/Ein-Befehl-Kontrollen messen. Keine neuen Kostenarten, Gehälter oder Waren nötig, um diesen vorhandenen Rückfluss zu prüfen.
2. **P1 – Sicherheits-Sollkosten und Einnahmen:** im vorhandenen Kosten-/Kopfgeldpfad prüfen, wie die laufenden fünf Jäger mit tatsächlich gezahlten Mitteln finanziert werden können. Eine isolierte Änderung des bestehenden Jäger-Kostensatzes ist kleiner als ein neues Subventionssystem, aber ohne Gegenversuch keine Empfehlung für einen bestimmten neuen Wert. Das aktuelle Weiterarbeiten trotz 77,64 % unbezahlter Kosten darf nicht als Kostendeckung gelten; keine zusätzlichen pauschalen Kopfgeld-Mints als vermeintlichen Bilanzfix einführen.
3. **P1 – Erholung nach Verlust:** vorhandene `ersatzkauf`-/`zuschuss`-Bedingungen, reale Werftbestände und Aldera-Fondskasse in Kollapsfällen prüfen. Baseline ohne Zuschuss ist kein Beweis, dass leer gelaufene Handelskonzerne wieder starten. Eine reine Senkung der Ersatzrücklage kann fehlendes Kaufgeld nicht ersetzen; sie ist ohne Rückflusstest keine hinreichende Reparatur.
4. **P2 – verbleibende Nahrungslücke:** erst danach den bestehenden Versorgungsbonus gezielt gegen Aldera/Dravos variieren, ohne Preise oder Rezepte pauschal zu erhöhen. Den offenen Meridian-Ausgleich und materialfreien Piratenersatz bei späteren Selbstfinanzierungs-Gates explizit berücksichtigen. Keine zusätzlichen Systeme aus diesem Bericht ableiten.

Es wurde **keine** dieser Änderungen im Produktionscode oder im gemessenen Regelwerk umgesetzt. Keine alten Referenzen überschrieben; keine Tests zur Beseitigung eines Fehlers abgeschwächt.

## 9. Tatsächlich ausgeführte Prüfungen, Aufwand und Grenzen

- Node.js **v22.23.4**, Linux x64. Bestehender Pflichtbefehl `node --test tests/*.test.mjs` erfolgreich; die lokale Sandbox meldet dabei sechs Dateisuiten. Zusätzlich `node --test --experimental-test-isolation=none tests/*.test.mjs`: **48 Tests, 48 bestanden, 0 fehlgeschlagen, 0 übersprungen** mit einzeln sichtbaren Ergebnissen. CI verwendet weiterhin den unveränderten normalen Node-Testmodus.
- **13/13** Jahres-Baselines und **3/3** Jahres-Spielerfälle: vollständige technische Prüfungen bestanden. Wirtschaftlicher Stabilitätsbefund der drei Spielerfälle: **gescheitert**, trotz bestandener technischen Prüfungen. **3/3** isolierende Kontrollen technisch bestanden.
- GitHub-Basis-CI [#41036228202](https://github.com/tobiasfranziskus/Check/actions/runs/41036228202) zu PR #30 per Connector geprüft: fünf erfolgreiche Jobs, ein bedingt übersprungener historischer Geografie-Job. Der v10-Job meldet Erfolg, führt unter Regel 12 aber gemäß Workflow nur die dokumentierte Überspringen-Verzweigung aus: **kein neuer v10-Nachweis**. Im aktuellen lokalen Auftrag wurden die historischen v10-/v11-/Drei-Geografie-Langläufe nicht separat neu ausgeführt; die unveränderte Regressions-CI des Drafts prüft ihre bestehenden Jobs. Der neue Draft erhält außerdem sechs unabhängige Langzeit-CI-Jobs mit Rohartefakten; dessen tatsächlicher Status ist im PR abzulesen, nicht aus diesem lokalen Lauf abzuleiten.
- Aufwand je Baseline, **einschließlich zweier simulierter Welten, Audits, Hashes und Beobachter**: Wandzeit 36.90–68.39 s, Median 55.20 s; CPU 37.72–45.54 s. Die Läufe wurden teils parallel als Prozesse ausgeführt; Wandzeit ist kein isolierter Gerätebenchmark. Spielerfälle 43.60–48.23 s.
- Täglich gemessener RSS-Höchststand je Baseline 81.4–113.2 MiB; Heap-used 31.2–57.5 MiB. Daten enthalten zusätzlich den Kernel-Prozesshöchststand, der innerhalb einer Seed-Gruppe kumulativ ist. Diese Werte schließen zwei Core-Instanzen und Testmetrik-Sammler ein; sie belegen weder Speicherleckfreiheit noch iPad-Speicherbedarf. Saves am Tag 365 22,744–23,226 Bytes.
- Keine echte Safari-, iPad-, NAS-, UI-/Touch- oder Browser-Leistungsmessung, kein Deployment. Kein v11-Jahresvergleich, keine Parameterkorrektur und kein Versuch ohne offenen Außenhandel. Drei ausgewählte Spielerfälle und drei Kontrollen sind reproduzierbare Gegenbeispiele, keine statistische Prävalenzschätzung.
