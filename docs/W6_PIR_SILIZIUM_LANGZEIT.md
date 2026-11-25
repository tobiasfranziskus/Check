# W6 / PIR-4a – Silizium-Langzeittest 365/730/760 Tage [FORSCHUNG]
Basis #611 Head `49fcbae9d4bbdb29c3c89a06d7b5e775b72e19f4`, Produkt-main 679ba6c1. Vorheriger gezielter [Node22-Lauf 45268224425](https://github.com/tobiasfranziskus/Check/actions/runs/45268224425) tatsächlich abgeschlossen: 4/4, alle 90-Tage-Hashes, Replay und Negativproben grün. #609 alle drei Workflows grün. Dieser Nachtrag erweitert ausschließlich Forschungs-Tests und CI in #611; keine Produktquellen.

## Versuchsaufbau
Ein gemeinsamer Test-only Loader extrahiert die bereits geprüfte isolierte Laufzeitkopie. Drei CI-Jobs, Seed42 / Original-S02-Politik / Haus 3000 / Welt 33000, Preis 450, Rezept 3 Teile+2 Material, 16 Bauzeit. Endlicher Tiefenvorrat 192 zusätzlich, höchstens 24 Freilegungen in 8er-Chargen. Kein Lagergeschenk, kein Eingriff in laufende Kassen oder Ware. Ausgangsvergleich ohne Freilegung; zweite Variante 8/30 Tage; dritte wie zweite, aber maximal 2 Hauskäufe bis einschließlich Tag365, maximal 4 bis Tag730 und maximal 6 danach. So entsteht eine tatsächlich aus bestehender Kasse finanzierte späte **Testnachfrage**, nicht eine automatische Ersatz-/Kampfwirtschaft. Keine neue Nachfrage bei leerer Kasse. Kein erfundener Jägerverlust und kein künstlicher NPC-Käufer.

Messpunkte Tag30/90/180/365/395/730/760. Protokoll: Feld/erschlossen/Resttiefe, gefördert, bezahlt verkauft, Jägerbau/Kauf/Lager, Haus/Nadir/NPC3-Kasse, K2-Minerzustand und Buchwert, Original-W3 und Ersatzkäufe, Geldmenge, Emission/Senke, Hash. An jedem Kauf und Messpunkt unabhängiger W6- und Speicher-Audit. Replay Tag730→760 mit 60 statt 120 Minuten, Kaufzeitpunkte identisch. Frühere 90-Tage-Referenzen in den beiden sofort nachfragenden Fällen erhalten. Negative Produktions- und Absatzresultate erlaubt; die Tests erzwingen keine neue Fertigung nach Tag365/730. Ergebnisse bei Commit noch offen; inzwischen siehe unabhängige CI-Auswertung unten.

## Interpretation
30-Tage-Freilegung erschließt rechnerisch bis Tag365 96 und bis Tag730 192 zusätzliche Einheiten (ab Tag720 keine weitere Freilegung). Das ist Geologie, keine Fördermenge. Langfristige Tragfähigkeit erst nach tatsächlicher Produktion, Nachfrage, Finanzierungs- und Ersatznachweis mit realen Verlust-/Hüllenbelegen. Selbst erneuter Kauf aus ersparten 3000 ISK beweist keinen dauerhaften Sicherheitsmarkt. Wenn wiederholte Finanzierung ausbleibt, bleiben Lagerproduktion, Kasse und vorhandene Miner die Blocker. Keine automatische Emission oder Rettung.

Nächste Gatefolge: reale Wiederaufnahme bei spätem Kauf (hier messbar), dann autorisierter Pilot-/Hüllenverbleib, Abwicklung realer Verluste, finanzierte Sicherheitsverträge und Ersatzkäufe, Recycling als eigener bilanzieller Rohstoffpfad. Echte 13×90 für neues Regelprofil erst nach expliziter Regelentscheidung. Keine Änderungen an #604/Codex; die zentrale Roadmap bleibt P0 vorbehalten.

## Unabhängige CI-Auswertung 24.11.2026

Geprüfter Forschungshead `ae6931c9c8f502afe1dc540ea93e2c715ee5fc1e`. [Langzeit-CI 45268872554](https://github.com/tobiasfranziskus/Check/actions/runs/45268872554): alle drei Jobs completed/success, jeweils ein tatsächlich ausgeführter Node-Test, 0 Fehler; Original-90-Tage-Hashes und Tag730→760-Replay gemäß Testassertionen bestanden. Die gezielte [Nacherschließungs-CI 45268869671](https://github.com/tobiasfranziskus/Check/actions/runs/45268869671) meldet ebenfalls success. Die allgemeinen JavaScript- und W5-Workflows 45268872404 und 45268869673 waren cancelled, nicht bestanden. Keine erneute lokale Node-Ausführung durch die unabhängige Auswertung.

| Profil | Tag | Freigelegt zusätzlich | Feld | Gefördert/verkauft | Gebaut/gekauft | Haus ISK | Hash |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| endlich | 365 | 0 | 0 | 16 | 5/5 | 750 | 3bbb6694a6d9541e |
| endlich | 730 | 0 | 0 | 16 | 5/5 | 750 | 39dfc69aa8d3647e |
| endlich | 760 | 0 | 0 | 16 | 5/5 | 750 | ee287fe62c3df0b1 |
| monatlich | 365 | 96 | 88 | 24 | 7/6 | 300 | acc052799708011f |
| monatlich | 730 | 192 | 184 | 24 | 7/6 | 300 | 46f9ec31ddcd2d06 |
| monatlich | 760 | 192 | 184 | 24 | 7/6 | 300 | 36453c7acce06ddb |
| gestaffelt | 365 | 96 | 96 | 16 | 3/2 | 2100 | bf61917d1e7efcda |
| gestaffelt | 730 | 192 | 192 | 16 | 5/4 | 1200 | 4d896ed9f9eb46b6 |
| gestaffelt | 760 | 192 | 184 | 24 | 7/6 | 300 | 312847853bb16510 |

Jobbelege: [endlich](https://github.com/tobiasfranziskus/Check/actions/runs/45268872554/job/138023022564), [monatlich](https://github.com/tobiasfranziskus/Check/actions/runs/45268872554/job/138023022221), [gestaffelt](https://github.com/tobiasfranziskus/Check/actions/runs/45268872554/job/138023022801). Alle Checkpoints Weltgeld 33000, Mint/Burn 0. Im gestaffelten Profil liegen vier echte Kaufbelege nach Tag365 vor, davon zwei nach Tag730 (Ticks 1051320/1051680, jeweils 450 ISK). Zwischen Tag730 und 760 wurden zusätzlich 8 Siliziumeinheiten bezahlt gefördert/verkauft, zwei Hüllen gebaut und zwei gekauft; eine Hülle bleibt auf Lager. In den übrigen Profilen keine späteren Käufe. Die Wiederaufnahme ist belegt, aber die Nachfrage stammt weiterhin aus der ursprünglich vorhandenen Hauskasse, nicht aus Sicherheitsumsätzen oder realem Ersatzbedarf. Kein allgemeiner Nachhaltigkeitsbeweis.

**Nächstes Gate: PIR-3b → PIR-4.** Der separate Kampf-Draft #610 (Head c557fcf) liefert einen nichtletalen Angriff, aber noch keinen Verlust-/Reparaturpfad. Zunächst autorisierte Schadens- und Verlust-/Hüllenhistorie, dann separat eine tatsächlich bezahlte Eskorte: bestehender Auftraggeber mit nachgewiesener Kasse, eindeutiger Frachter und Jäger, Treuhandreserve, tatsächliche Flug-/Pilotenbuchungen und eindeutige Leistung/Abbruch/Rückzahlung. Erst danach echte wiederkehrende Sicherheitsnachfrage samt wirtschaftlichem Ersatz aus realem Gewinn und unabhängigen 90/365/730-Tests prüfen. Keine Nachfragestimulation durch Gratisgeld oder Zwangskauf. Monatliche Freilegung bleibt Testhypothese; schnellere Freilegung nicht erforderlich für die beobachtete Nachfrage. Keine Preis-/Regel-/Save-Änderung, kein Merge/Deploy. P0 #586 soll die CI-Ergebnisse in Roadmap/Projektstatus übernehmen, ohne parallele zentrale Dokumentänderung.
