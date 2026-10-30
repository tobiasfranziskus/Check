# Aphros Void – Sicherheitsgeografie und Grenzversorgung (Entwurf)

Stand: 30. Oktober 2026. Folge-PR [#20](https://github.com/tobiasfranziskus/Check/pull/20) auf [#19](https://github.com/tobiasfranziskus/Check/pull/19) auf [#18](https://github.com/tobiasfranziskus/Check/pull/18). **Keine Integration, keine Veröffentlichung.**

## Problem und Änderung

Bisher hatte Meridian keine direkte Verbindung nach Orion; es gab nur einen Silizium-Abbauort in Dravos. Die sechs Systeme enthielten lediglich ein umkämpftes Gebiet. Der Entwurf ergänzt:

- Meridian–Orion, direktes Sternentor, 26 Spielminuten, weiterhin ohne Flugtreibstoff.
- **Nadir** als zweites umkämpftes System mit Toren zu Orion (18 Minuten) und Meridian (21 Minuten), sichtbarer Position innerhalb der 1000×1000-Karte.
- Dort je ein Miner für Silizium und Eis, Nahrungsproduktion aus Eis, ein kleiner Pirat und ein Sicherheitsjäger. Die Station ist ein kleiner Außenposten (Grundverbrauch 2 Nahrung, 1 Medikament, 1 Bauteil pro Stunde) mit normalen stationären Kosten/Marktregeln.
- Keine Änderungen an Rezepten/Preisen, vorhandener Handels-KI, Kostenformeln, Kapitalobergrenze oder RNG.
- **Regelversion 11** statt 10 (Schema weiterhin 8): Weltbestand und Warenverteilung sind inkompatibel. Keine Migration 10→11; Spielstände der früheren Regelversion sollen klar abgelehnt, nicht stillschweigend fehlgeladen werden. Keine automatische Löschung vorhandener Browserdaten.

## Prüfverfahren

Node.js 22; Standard: `node --test tests/*.test.mjs`.

Unabhängiges Vergleichsskript: `node tools/sicherheitsgeografie-simulation.mjs` im vollständigen Git-Checkout. Es verwendet als unveränderten PR-#19-Ausgangspunkt Commit `3cff288aa75c2c072c210298e9f81fb7b92a4ec7`. Gleiche 13 Seeds `[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159]`, 90 Spieltage = 129600 Ticks je Welt. Bei jedem Stundenabschluss wird der Geld-/Warenaudit geprüft. Nach Tag 3/30/90 werden Hashes gespeichert; die neue Welt wird unabhängig mit demselben Seed wiederholt, an allen drei Punkten muss der Hash identisch sein. Save/Load-Roundtrip bei Tag 90. Zwei Weltvarianten, keine aktive Spielersteuerung.

Erster real ausgeführter GitHub-Actions-Lauf: [Run 41012294793](https://github.com/tobiasfranziskus/Check/actions/runs/41012294793), Commit `fe7610b`: **45 Tests bestanden; 0 Fehler; 0 übersprungen; 13 Seed-Paare, Audits und Wiederholung erfolgreich.** Nachfolgende Kartenkorrekturen und die Regelversionsanhebung ändern keine Wirtschaftsfunktionen. Für den endgültigen Head-Commit muss die CI dennoch separat erfolgreich abgeschlossen sein.

## Wirtschaftsergebnisse: PR #19 gegenüber erster Nadir-Variante

| Kennzahl | PR #19 | Entwurf Nadir | Interpretation |
| --- | ---: | ---: | --- |
| Median Mangelstunden, ursprüngliche 6 Stationen | 304 | 326 | Schlechter, 10 von 13 Seeds schlechter |
| Summe Mangelstunden, ursprüngliche 6 Stationen | 4000 | 4204 | +204 bzw. +5,1 % |
| Median tatsächliche NPC-Frachterverkäufe | 21789 | 23004 | +1215; alle 13 Seeds mehr |
| Gesamte NPC-Frachterverkäufe | 282891 | 298743 | +15852 bzw. +5,6 % |
| Gesamtförderung Silizium | 417877 | 472337 | +54460 |
| Gesamtverbrauch Silizium | 400749 | 439603 | +38854 |
| Gesamtproduktion Nahrung | 417678 | 491900 | +74222 |
| Ungedeckte NPC1-Betriebskosten, gesamt | 12506 ISK | 17187 ISK | +4681 ISK; 8 Seeds schlechter |
| Ungedeckte NPC2-Betriebskosten, gesamt | 4996 ISK | 6544 ISK | +1548 ISK |
| NPC3-Schiffsverluste, gesamt | 2534 | 2715 | +181 Schiffe, Risiko gestiegen |
| Median Nadir-Mangelstunden | – | 0 | Nadir selbst ohne gemeldeten Mangel |

Der aggregierte Mangel in der neuen Gesamtwelt ist in diesem Versuch identisch mit dem Mangel der ursprünglichen sechs Stationen, weil Nadir in allen 13 Seeds keine Mangelstunden meldet. **Weniger Mangel in Nadir bedeutet nicht automatisch bessere Gesamtversorgung.**

Die zusätzlichen Startbestände, Minenschiffe und Stationseigentümerkassen verändern die Weltgröße und Ausgangsliquidität. Kennzahlen müssen deshalb als Vergleich zweier unterschiedlich großer Volkswirtschaften interpretiert werden. Die Verkäufe zählen tatsächliche NPC-Frachterverkäufe, nicht Ertrag oder Gewinn.

## Bewertung und nächste Entscheidungen

**Technisch im ersten Vergleich bestanden, wirtschaftlich noch nicht freigegeben.** Mit der derzeitigen Konfiguration gibt es zusätzliche Siliziumförderung, Nahrungsproduktion und mehr Handelsumsatz, zugleich aber in den bisherigen Stationen mehr Engpässe, größere NPC1-Betriebskostenlücken und höhere NPC3-Verluste. Das zusätzliche Angebot darf nicht als Lösung der Liquiditätsfrage ausgegeben werden.

Vor Integrationsfreigabe ist ein gezielter zweiter Gegenversuch sinnvoll: Direktes Tor ohne Nadir versus Tor plus Nadir; zusätzlich Mangel je Ware/Station, Kapitalbindung, Konzernkassen und risikoabhängige Schiffskosten. Parameter nicht ohne Vergleich ändern. Die NPC1-Expansion aus PR #16 bleibt unverändert zurückgestellt.

## Grenzen

Keine reale Prüfung auf iPad Safari oder NAS; Browserkarte und Touch-Interaktion nur in Node-Tests bzw. Datenkoordinaten geprüft. Keine Prüfung einer direkt steuerbaren Pilotensimulation, Piratenunterhaltslogik oder späterer Schmuggelfrachter. Kein Merge in main oder in vorgelagerte Draft-PRs.
