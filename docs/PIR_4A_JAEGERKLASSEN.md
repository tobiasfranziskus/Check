# PIR-4a – Jägerklassen MK I–III [SPEZIFIKATION / OPTION]
23.11.2026 · main `679ba6c1fdb05435164e29b2e21514ddaa676279`; #605/#606/#607/#609. #609 gezielte Node22-CI [45266821361](https://github.com/tobiasfranziskus/Check/actions/runs/45266821361) erfolgreich. Keine freigegebene neue Produktregel; #604 bleibt getrennt.

## Rollen und vorläufige Parameter
| | MK I Abfangjäger | MK II Mehrzweckjäger | MK III schwer |
| --- | ---: | ---: | ---: |
| Preis (ISK) | 450 | 550 | 1050 |
| Bauteile | 3 | 4 | 8 |
| direktes Material | 2 | 2 | 4 |
| Gesamtmaterial | 8 | 10 | 20 |
| Silizium | 3 | 4 | 8 |
| Werftminuten | 16 | 16 | 32 |
| Kosten nach #607 (ISK) | 380,8 | 480 | 960 |
| vmax P/Schritt | 4800 | 4160 | 3520 |
| Schub P/Schritt² | 144 | 128 | 96 |
| Bremse P/Schritt² | 176 | 160 | 128 |
| Drehung 1/256 pro Schritt | 12 | 10 | 8 |
| Schild (PIR3 abhängig) | 40 | 60 | 100 |
| Hülle (PIR3 abhängig) | 60 | 100 | 140 |
| Schaden/Schuss Vorschlag | 12 | 18 | 24 |
| Intervall Kernsekunden Vorschlag | 24 | 24 | 30 |
| Reichweite P Vorschlag | 180000 | 220000 | 260000 |
| Fluglohn ISK je Aktivminute | 1 | 1 | 1 |
| Wertverzehr Milli-ISK/Minute | 150 | 200 | 350 |
| Aktivminuten bis Buchwert 0 bei Stilllegung | 3000 | 2750 | 3000 |

Alle Flug-/Kampf-/Verschleißwerte neue Testhypothesen, nicht Ergebnis von Kämpfen. Bestehende FLUG.DATEN.jaeger = 4160/128/160/10; Regel204 J4c 900 ISK, 300 Milli-ISK pro Minute. Bestehende Miner/Frachterwerte 1920/32/64/4 und 1440/32/48/2. F8-Trainings-HP/Projektile sind kein weltweiter Schadenszustand. MK I schnell und leichter Rückzug; MK III nicht überall besser, schwere Schutzeinsätze. Kein zusätzlicher Treibstoff-/Munitionsverbrauch ohne echte Ware/Vertrag. Schilde nicht kostenlos als Hüllenreparatur verwenden; Schildregeneration erst nach PIR3-Regel; in erster Forschung keine automatische Heilung. K1-40-ISK-Startreserve und 1 ISK Lohn bleiben zunächst für alle, echte Nachschüsse und Rückkehr prüfen. Abschreibung ist kein abgebuchter Lohn. Für jede Hülle Anschaffungswert und Kurs-/Kampfparameter auditierbar speichern; Altbestand nicht neu bewerten.

## Technische Umsetzung nach PIR3
- Neues ausdrücklich autorisiertes Regel-/Klassenprofil, keine Umdeutung von originalem `klasse:'jaeger'` oder existierenden 900-ISK-Kaufbelegen. Stabile Varianten-ID, getrennte physische Lager-/Produktions-/Kaufbelege je Typ, Hüllenhistorie mit Verkäufen/Verlusten. Variantenwahl in Quote/Annahme, serverlose Core-Validierung vor Buchung. Kein neues paralleles Weltmodell.
- Klasse bleibt für bestehende Fähigkeiten Jäger; aufgelöste Typdaten an den bestehenden FLUG-Integrator übergeben, sämtliche Typauflösungswege (Körper, Befehle, Audit, K1, J8, Karte) einmalig koordinieren. Keine Typfelder im unfreigegebenen alten JSON; keine stille Save-Migration; Original-Referenzhashes erhalten. Legacy-J4c bleibt preislich/physikalisch unverändert.
- Erst PIR3 realer Kampf, dann vergleichbarer MK-I/II/III-gegen-Pirat-Test mit gleicher Ausgangsposition/Seed, Flucht und Eskorte bei echter F4-Ankunft. Kleine Hülle darf nicht gleichermaßen unbesiegbar sein wie schwere, schwere darf nicht jeden leichten Jäger automatisch besiegen. Treffer nur echte Reichweite, deterministische Kollision, Schussintervall/Teilschritt. Schild-/Hülle/Schaden- und Rückzugsaudit; Reparatur vorfinanziert, keine Gratisheilung.
- Eigentum und Anbieter: #606 zeigt J4-Audit derzeit verlangt `house`, Nadir und existierende Hülle. Vor NPC-/Piratenkauf/Verlust oder Systemreise die Hüllenhistorie, Pilotenberechtigung und Vertragsabwicklung separat implementieren; nicht Kaufvalidierung bloß abschalten.
- 90/365/730-Wirtschaft, 13×90, Kapital und Ersatz im Vergleich, reale Materialkosten, kein künstlicher Absatz. Ausführung unabhängig nach Codex-Integration; keine Änderung am Kampfcode im aktuellen PR. M4-UX und P0 separat.
