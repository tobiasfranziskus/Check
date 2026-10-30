# Aphros Void – v11: feste Referenz und isolierter Geografievergleich

Stand: 30.10.2026. Draft [PR #22](https://github.com/tobiasfranziskus/Check/pull/22) auf PR #20. **Kein Merge nach main; keine Freigabe für Geografie-/Wirtschaftsintegration.**

## Hintergrund

PR #21 wurde mit Nutzerfreigabe in den Entwicklungsbranch von PR #19 gemergt (Merge-Commit `6fd70a9`). Der darin behobene QA-Blocker betraf die fehlenden festen v10-Referenzen. Der alte PR-#20-Branch basiert aber noch auf dem davorliegenden Commit `3cff288` und muss vor einer späteren Integration mit dem aktuellen PR #19 synchronisiert werden, damit kein Regressionstest verloren geht.

## Geprüfte Versionen

- A: unveränderter v10-Sicherheitsstand, Commit `3cff288aa75c2c072c210298e9f81fb7b92a4ec7`.
- B: derselbe v10-Code, nur um den deklarierten Meridian–Orion-Tor-Eintrag mit 26 Minuten ergänzt; kein neuer System-/Stationsbestand. Reines Simulations-Gegenexperiment.
- C: v11-Geografiestand von PR #20, mit Tor und Nadir, fixiert auf Commit `f5fcde6380d66b2de0c73dc1fb7ef942f9971e8c`.

Testläufe: 13 Seeds `[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159]`, jeweils 129.600 Ticks = 90 Spieltage, stündlicher Geld-/Warenaudit. Gleiches Quellmodell und gleiche Seeds je Variante, aber durch unterschiedliche Pfade/RNG-Ereignisse keine paarweise identischen Zufallsereignisse garantiert.

## Tatsächlich ausgeführte Prüfungen

[GitHub Actions #41015069671](https://github.com/tobiasfranziskus/Check/actions/runs/41015069671), Commit `500ad67`, Node.js 22:

- Standardtests: **45 bestanden, 0 fehlgeschlagen, 0 übersprungen**.
- V11-Referenz: **13/13 Seeds × 90 Tage** erfolgreich. Fixierte Hashes an Tag 3/30/90, stündlicher Core-Audit und unabhängig formulierter Waren-/Geldaudit, Replay mit uninstrumentiertem Core, Save/Load sowie komplette Schlusskennzahlen. Fixture `tests/fixtures/economy-geography-v11.json` stammt aus einem vorherigen separaten CI-Lauf [#41012890333](https://github.com/tobiasfranziskus/Check/actions/runs/41012890333) von v11-Commit `f5fcde6`. Sie wird beim Test nicht neu geschrieben.
- Isolierter Drei-Varianten-Lauf: **13/13 Seed-Tripel erfolgreich**, 90 Tage je Variante; stündliche Audits sowie Save/Load je Lauf. Alle Varianten mit identischem Beobachtungsmechanismus. Zusätzliche CI-Jobbezeichnung `sicherheitsgeografie-vergleich` wurde wegen des anderen Basisbranches planmäßig übersprungen; die beiden neuen Jobs wurden ausgeführt und bestanden.
- Reproduktion im Git-Checkout: `node tools/geography-reference-v11.mjs` und `node tools/geography-three-way.mjs`.

Die festgeschriebenen Hashes sichern gegenüber dem bereits gemessenen v11-Stand ab. Das ist kein Beweis für wirtschaftliche Optimalität oder eine von Grund auf unabhängige Wirtschaftsimplementierung.

## Wirtschaftsergebnisse (Summe über alle 13 Seeds, soweit nicht anders angegeben)

| Kennzahl | A: v10 bisher | B: nur Tor | C: Tor + Nadir |
| --- | ---: | ---: | ---: |
| Median Mangelstunden in ursprünglichen Stationen | 304 | 302 | 326 |
| Mangelstunden gesamt | 4.000 | 4.101 | 4.204 |
| Tatsächliche NPC-Frachterverkäufe | 282.891 | 293.305 | 298.743 |
| Ungedeckte NPC1-Betriebskosten | 12.506 ISK | 11.251 ISK | 17.187 ISK |
| Ungedeckte NPC2-Betriebskosten | 4.996 ISK | 6.172 ISK | 6.544 ISK |
| NPC1-Schiffsverluste | 1.311 | 1.401 | 1.361 |
| NPC3-Schiffsverluste | 2.534 | 2.657 | 2.715 |
| Piratenschiffsverluste | 13.197 | 13.320 | 13.695 |
| Gefördertes Silizium | 417.877 | 425.689 | 472.337 |
| Industriell verbrauchtes Silizium | 400.749 | 407.349 | 439.603 |
| Produzierte Nahrung | 417.678 | 417.756 | 491.900 |

Die neue Station erhöht die anfängliche Gesamtgeldmenge von 50.000 auf 55.000 ISK. Ein Vergleich der **absoluten** Gesamtmengen ist deshalb nicht auf eine identisch große Volkswirtschaft normiert. Die 6 bestehenden Stationen werden separat bei `commonShortage` verglichen. Die Werte enthalten RNG-Folgeeffekte; streng isoliert ist nur der geänderte Tor-Eintrag in Variante B.

### Einzelne Nahrungsmängel (Summe in 13 Seeds)

| Station/Ware | A | B | C |
| --- | ---: | ---: | ---: |
| Aldera – Nahrung | 2.028 | 2.223 | 2.181 |
| Dravos – Nahrung | 1.833 | 1.793 | 1.795 |
| Dravos – Bauteile | 63 | 69 | 178 |
| Orion – Nahrung | 39 | 8 | 5 |
| Nadir – alle Verbrauchswaren | – | – | 0 |

Mehr Nahrung und Silizium werden in Variante C produziert, gleichzeitig verschlechtern sich Mangel und ungedeckte Kosten in den ursprünglichen Systemen gegenüber A. Die Verteilung von Waren und die Händlerliquidität sind mögliche Erklärungen, aber ihre genaue Kausalität wurde mit dieser aggregierten Statistik noch nicht isoliert.

## Konsequenz

**PR #20 bleibt wirtschaftlich nicht freigegeben.** Das direkte Tor allein ist nicht eindeutig wirtschaftlich neutral (Summe Mangel +101, NPC3-Verluste +123), aber entlastet im Vergleich NPC1 (ungedeckte Kosten −1.255 ISK), steigert Verkäufe und senkt den Mangel-Median leicht. Die vollständige Nadir-Variante erhöht gegenüber dem reinen Tor die NPC1-Kostenlücke um 5.936 ISK und den Mangel um 103 Stunden.

Nächste begrenzte Untersuchung: Händlerkapitalbindung nach Waren, Zahl und Art tatsächlicher NPC1-Käufe/Verkäufe, Handelsroutenverteilung sowie gezielte Nahrungs-/Bauteilversorgung Aldera/Dravos. **Keine spontanen Geldzuschüsse oder zusätzlichen Minerschiffe.**

**Integrationsgrenze:** PR #20 ist auf dem alten #19-Stand erstellt worden. Bei weiterer Bearbeitung die v10-Referenzfixes aus dem inzwischen gemergten PR #21 bewahren. Noch keine reale Safari-/NAS-Abnahme; keine Übernahme in main, keine neue Pilotensimulation.
