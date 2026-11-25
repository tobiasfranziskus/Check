# W6 · Finanzierte Erz-Hinfracht und Wasser-Rückfracht

**Forschungsstand vom 25.11.2026.** Die Simulationsbasis ist [`main fb229ea5`](https://github.com/tobiasfranziskus/Check/commit/fb229ea5f3cb6c3018240ed321b6a281a06fffe4). Der Branch übernimmt gezielt den U7/U8-Kern aus [#574](https://github.com/tobiasfranziskus/Check/pull/574) sowie die J8-Befehle, Eigentumsprüfungen und das Szenariogerüst aus [#578](https://github.com/tobiasfranziskus/Check/pull/578). Einstieg für die Untersuchung ist eine ausdrücklich bestätigte Regel204-Forschungskopie. Die Standardkarriere und der PIR-Forschungsstart behalten ihre Ladepfade. Der öffentliche Einstieg bleibt auf dem Produktpfad. Während des Laufs wurde der Branch mit [`main 2ed9d54`](https://github.com/tobiasfranziskus/Check/commit/2ed9d54830f74a5b412a1f12431023f35369ca6f) abgeglichen. Dessen Änderungen aus #624 betreffen M4-U4-Werkzeuge und Dokumentation.

Nadir bestellt 50 Erz mit 740 ISK, Aldera stellt 500 ISK für den Erzankauf bereit, und der Frachter-Eigentümer bindet 120 ISK Fluglohn. Beim Wechsel zur Rückfahrt kauft Aldera aus seiner dann verfügbaren Kasse physisches Wasser für 14 ISK je Einheit und reserviert 1 ISK je Einheit für die Fracht. Eine Hausrückfracht setzt die Zustimmung des Eigentümers voraus. Sowohl der Tarif als auch die Warenbewegung werden erst mit der echten Fahrt abgerechnet.

## Reproduktion

```sh
node tools/m4-management-szenarien.cjs vergleich 90 42 > w6-vergleich.jsonl
node --test tests/m4-founding-economy.test.mjs tests/m4-u7-u8-*.test.mjs tests/m4-u8-real-backhaul-research.test.mjs
node --test tests/*.test.mjs
```

Seed 42, Standardpolitik, vorhandene K7-Automatik allein und S02 jeweils paarweise auf Regel204 und U7/U8. S02 aktiviert die ursprüngliche NPC-/Siliziumautomatik und lässt den NPC-Markt 300 Minuten anlaufen. Danach erfolgen Managementversuche im 60-Minuten-Raster. Das Haus erwirbt einen Frachter nur für den Einstieg oder Ersatz, solange es keine einsatzfähige Frachterhülle besitzt. Käufe, Löhne, Überführungen und Lagertransfers laufen über die vorhandenen Befehle. In den Kontrollläufen bleibt reguläre Wasser-Rückfracht auf der Eisroute möglich. Das Szenario prüft Forschungs- und Standardpolitik als Gesamtpaket. Der isolierte Beitrag der Wasser-Rückladung lässt sich aus ihrem einzelnen Frachtbeleg und den tatsächlich gebuchten Rollenbeträgen ablesen.

Jeder der sechs Läufe wurde vollständig wiederholt. Der Vergleich verlangt identische JSON-Berichte samt Hashes, Buchungen und Eigentümern. An den Stichtagen müssen Speichern und Laden bytegleich sein. Die Welt- und Warenbilanz wird auch im Wochenraster geprüft. Alle Stichtage zeigen 33.000 ISK Gesamtgeld, Mint/Burn je 0. Die JSON-Zeilen enthalten vollständige Stationslager, Haushalts- und Firmenkassen, Löhne, Schiffs-ID und Eigentümer, Aktivminuten, Buchwert, Stilllegungen, Kauf- und Frachtbelege sowie gebundene Reserven.

## 7, 30 und 90 Tage

Kumulative Mengen. Kombiniert zählt W3-Rundfahrten mit geladener und in Aldera eingetroffener Wasserfracht. Die Ersatzspalte gibt den Ersatzwirtschaftszähler des Kerns wieder. Einzelne Werftkäufe und der Besitzerwechsel stehen separat in den Belegen.

| Politik | Profil | Tag | Erz W3 | Kombiniert / Wasser | Wasser Haushalte | Eis gefördert / Wasser produziert | Material / Frachter gebaut | Ersatz | Hash |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Standard | 204 | 7 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `dbfa30c31d105505` |
| Standard | 204 | 30 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `4c425e523b102987` |
| Standard | 204 | 90 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `6037819109d5ff80` |
| Standard | U7/U8 | 7 | 50 | 1 / 41 | 3821 | 3987 / 3900 | 5 / 1 | 1 | `17b80ef2a7388f0f` |
| Standard | U7/U8 | 30 | 50 | 1 / 41 | 4759 | 5050 / 4880 | 5 / 1 | 1 | `ea7b2fce660daafe` |
| Standard | U7/U8 | 90 | 50 | 1 / 41 | 4759 | 5050 / 4880 | 5 / 1 | 1 | `cad6e11de6881745` |
| K7 | 204 | 7 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `c19fb7f34d966b9a` |
| K7 | 204 | 30 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `32a537dd989e031c` |
| K7 | 204 | 90 | 0 | 0 / 0 | 2369 | 2750 / 2580 | 0 / 0 | 0 | `9682730daad3b08e` |
| K7 | U7/U8 | 7 | 100 | 1 / 41 | 3757 | 3900 / 3810 | 10 / 2 | 1 | `186c5b32965e6f61` |
| K7 | U7/U8 | 30 | 100 | 1 / 41 | 5044 | 5350 / 5160 | 10 / 2 | 1 | `e4d83956d2682b93` |
| K7 | U7/U8 | 90 | 100 | 1 / 41 | 5044 | 5350 / 5160 | 10 / 2 | 1 | `7d441a7e7ce91cd7` |
| S02 | 204 | 7 | 150 | 0 / 0 | 3604 | 3833 / 3640 | 70 / 5 | 7 | `d1decd3a3053388d` |
| S02 | 204 | 30 | 400 | 0 / 0 | 16671 | 17170 / 16740 | 185 / 17 | 31 | `63eef87c47dfd175` |
| S02 | 204 | 90 | 1000 | 0 / 0 | 50000 | 50884 / 50000 | 500 / 49 | 94 | `052fec0f100512f4` |
| S02 | U7/U8 | 7 | 100 | 1 / 41 | 3659 | 3864 / 3720 | 50 / 4 | 7 | `2281d74dd8429a94` |
| S02 | U7/U8 | 30 | 150 | 2 / 82 | 6809 | 6915 / 6850 | 75 / 6 | 10 | `478696c8bbb0c153` |
| S02 | U7/U8 | 90 | 150 | 2 / 82 | 6809 | 6915 / 6850 | 75 / 6 | 10 | `5c2750ddcb1af122` |

Geldverteilung, Lager und Flotte an Tag 90. Reihenfolge der Konten ist Haus / Spedition / Aldera / Nadir. Die Lager zeigen Eis / Wasser / Erz / Material. Flotte umfasst auch stillgelegte Hüllen.

| Politik | Profil | Kassen (ISK) | Haushaltskassen (ISK) | Aldera | Nadir | Hüllen / stillgelegt |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Standard | 204 | 16884 / 2000 / 482 / 2770 | 7679 | 50 / 94 / 0 / 0 | 120 / 117 / 0 / 0 | 4 / 0 |
| Standard | U7/U8 | 17235 / 2000 / 1100 / 3758 | 5377 | 50 / 0 / 0 / 0 | 120 / 121 / 40 / 0 | 5 / 0 |
| K7 | 204 | 16884 / 2000 / 482 / 2770 | 7679 | 50 / 94 / 0 / 0 | 120 / 117 / 0 / 0 | 4 / 0 |
| K7 | U7/U8 | 18009 / 2000 / 1100 / 3346 | 5325 | 50 / 0 / 0 / 0 | 140 / 116 / 80 / 0 | 5 / 0 |
| S02 | 204 | 7127 / 1268 / 1100 / 4000 | 15714 | 76 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 100 / 95 |
| S02 | U7/U8 | 7329 / 2000 / 1100 / 3896 | 14338 | 65 / 0 / 0 / 0 | 0 / 41 / 0 / 0 | 16 / 13 |

## Rechnung nach Rolle

Die vier kombinierten Fahrten liefern je 50 Erz und 41 Wasser. Die Zahlen stammen aus dem realen Abschlussbeleg und den unveränderten, auditierten Stückpreisen. Geld in Treuhand und Lagerbestand werden getrennt ausgewiesen.

| Rolle | Buchung je kombinierter Fahrt | Ergebnis |
| --- | --- | --- |
| Nadir, Erzkäufer | 500 Ware + 240 Tarif, Eingang 50 Erz | −740 ISK Kasse und 50 Erz im Lager. Der Einstand beträgt 14,80 ISK je Erz. Eine real verkaufte Standard-Raffineriecharge ergibt 500 Erlös für 5 Material abzüglich 148 Einstand für 10 Erz und 20 Raffinierlohn, also 332 ISK Ergebnis bei Einstandsbewertung. Die übrigen 40 Erz binden 592 ISK. |
| Aldera, Erzverkäufer | 500 Erlös aus W3, 500 zuvor für W1-Erz bezahlt | 0 ISK direkte Handelsmarge. |
| Aldera, Wasserkäufer | 574 Ware + 41 Rückfracht, Eingang 41 Wasser | −615 ISK Kasse beim Einkauf. Realisierter Handelsdeckungsbeitrag von 1 ISK je verkaufter Einheit bei 16 ISK Einzelhandel und 15 ISK Einstand. Bei Verkauf aller 41 Einheiten entstehen 41 ISK. Der Lagerbestand ist fungibel, daher ist der Einzelverkauf einer bestimmten Fracht nicht zuzuordnen. |
| Nadir, Wasserverkäufer | 574 ISK realisierter Großhandelserlös | 90,20 ISK Deckungsbeitrag bei 11,80 ISK direkten Stückkosten (50 Eis für 250 ISK, 240 ISK Eisfracht, 100 ISK Werkslohn je 50 Wasser). Der Großhandel erzielt denselben Stückerlös wie der Nadir-Einzelhandel und kann anderen lokalen Absatz ersetzen. |
| Frachter-Eigentümer | 240 Erz + 41 Wasser − 120 Fluglohn | +161 ISK operativer Überschuss. 120 Aktivminuten × 0,30 ISK modellierter Wertverzehr ergeben +125 ISK Deckungsbeitrag nach Verschleiß. Die bereits finanzierte Rückfahrt erhält mit Wasser 41 ISK zusätzlichen Beitrag. |

Als Kontrolle liegt der Frachterbeitrag einer geschlossenen reinen Erzfahrt bei 120 ISK vor und 84 ISK nach modelliertem Verschleiß. Ersatzhüllen und Überführungen haben separate Kaufbelege. Beispielsweise zahlt das S02-Haus 750 ISK für `sh004` und 60 ISK zur Überführung. Ein positiver Deckungsbeitrag je Fahrt trägt die Ersatzbeschaffung erst bei wiederholtem Absatz.

Der jeweils tatsächliche **Kassenbeitrag des gesamten Stationsprozesses** (inklusive Lageraufbau und vermischter Ware) lautet an Tag 90:

| Politik | Profil | Aldera Wasser | Nadir Wasser | Nadir Erz/Material |
| --- | --- | ---: | ---: | ---: |
| Standard | 204 | +155 | +2.862 | 0 |
| Standard | U7/U8 | +3.339 | +7.866 | −260 |
| K7 | 204 | +155 | +2.862 | 0 |
| K7 | U7/U8 | +3.551 | +8.356 | −520 |
| S02 | 204 | +31.463 | +110.000 | +7.700 |
| S02 | U7/U8 | +4.337 | +14.496 | +480 |

## Stagnation und nächster Engpass

- **Standard und K7.** Je eine kombinierte Fahrt endet in Minute 2.533. Nadirs verbleibendes Erz deckt die nächste Verarbeitung, während weitere Eisfracht am vollen Lager scheitert. Ab Tag 30 stehen auch Haushaltskonsum und Produktion. Mehr Erztransport allein würde keinen Folgeabsatz nachweisen.
- **S02.** `sh004` liefert zwei kombinierte Fahrten, Rückkehr in Minute 6.853 und 12.733. Danach blockiert ein W3-Vorvertrag mit dem stillgelegten `sh011` (beobachtet in Minute 18.000). 22 Erz liegen physisch auf dem Miner. 740 ISK Kaufgeld, 120 ISK Fluglohn und 530 ISK Werftreserve bleiben gebunden. Nadir kann seinen Vertrag über den Originalbefehl nicht stornieren, weil bezahlte Arbeit oder Ware vorhanden ist. Der Ablehnungsversuch lässt den Save bytegleich. In der Kontrolle tritt der gleiche Typ später auf (Minute 127.320, `sh009`, 23 Erz, ebenfalls 1.390 ISK). Die Forschungsvariante verschlechtert in diesem Lauf den S02-Verlauf deutlich.
- **Nächster technischer Versuch.** Vor der W3-Bindung die verbleibenden rechtmäßig nutzbaren Aktivminuten des reservierten Miners gegen die geforderte 50er-Charge inklusive An-/Rückflug prüfen. Ablehnung muss vor allen Reserven greifen. Für bereits gebundene Teilladungen braucht es eine gesonderte, einvernehmliche Abwicklung unter Erhalt von Zahlungen, Eigentum und Ware.
- **Langzeitentscheidung.** 365 und 730 Tage wurden für dieses Paket nicht gestartet. Keine Forschungsvariante erreicht wiederkehrende Kombinationen bis Tag 90 und S02 stagniert bereits zwischen Tag 30 und Tag 90. Die historischen 365-/730-Nachweise von #578 gelten für dessen Stand.

Der [separate Haushaltsaudit #618](M4_GRUENDUNGSWIRTSCHAFT_AUDIT.md) benutzt Miner-first und einen anderen Hausentscheidungsplan. Er dient als überprüfter Ausgangsbefund für die Gründung. Die Zahlen seiner drei Profile sind deshalb nicht direkt mit der U7/U8-Matrix austauschbar.

## Regression

- Node 22.23.4, `node --test tests/*.test.mjs` mit 613/613 erfolgreich, 0 Fehler und 0 übersprungen. Enthalten sind die vorhandene 13×90-Matrix und die separate Regel207-S02-Regression bis Tag 365/730. Der übernommene 48-Fahrten-Fork bestätigte 22 Wasser Rückfracht und eine tatsächlich abgeschlossene 49. Eisfahrt. Die Tests für Haus- und NPC-Frachter bestätigen Eigentum, atomare Ablehnungen, reservierte Löhne und Save/Load während der Fahrt.
- Lokales Chromium, M4-U3 und M4-U5 jeweils 4/4 bei 1180×820, 1024×768, 820×1180 und 390×844. Statischer Root-Einstieg, echter W1-Verkauf, Lager- und Käufersperren, Erzpause, eigener Frachter, Import und Reload.
- Ergänzende M4-U4-Regressionsdateien aus dem späteren `main`-Abgleich mit Chromium-Dry-Run 12/12, 0 Fehler und 0 übersprungen.
- WebKit lokal durch Download-HTTP-403 blockiert. GitHub-CI separat im Draft. Physisches iPad und privates NAS bleiben ausstehend.
