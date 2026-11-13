# K9 – Zweite refinanzierte W4-/W5-Industriekette nach K8

**[DRAFT / ANALYSE · 13.11.2026]** [PR #324](https://github.com/tobiasfranziskus/Check/pull/324) auf [K8 #323](https://github.com/tobiasfranziskus/Check/pull/323) und isolierter K1/K7-Regel200-Forschung [#322](https://github.com/tobiasfranziskus/Check/pull/322). Keine Änderung des autoritativen Wirtschafts- oder Flugkerns, der Preise, Geldmodelle, Bestände, Hauptversion oder gespeicherter Nutzerdaten. Keine Freigabe für `main`, Pages oder NAS.

## Aufgabe und Testaufbau

Die zweite reale 50-Erz-Lieferung aus K8 wurde bisher **nicht** in eine zweite Original-W4-Materialproduktion und zweite vollständig gekaufte und überführte W5-Hülle umgesetzt. Der neue, bewusst schmale K9-Nachweis verwendet ausschließlich die Originalbefehle `stationRefine`, `industrialOreBuildShip` (einmalige Freigabe der existierenden Werftreserve), `shipBuy` und `shipReposition`.

Pro Krisenseed **42 und 7**: ursprünglicher K4/K5-Save Tick 21612 → erster K7-Industrie-Erzvertrag → W4-Material/W5-Erstbau → vorab pausierte NPC-Ersatzbeschaffung und **drei rechtmäßig für je 750 ISK** erworbene und bezahlt überführte vorhandene Lagerhüllen als Deckung des nächsten Vertrags → zweiter realer 50-Erz-Vertrag mit Zustimmungen der korrekten Eigentümer, 740 ISK einheitlicher Nadir-Kauf-/Frachttreuhand, 120 ISK Crew- und 530 ISK Werftreserve → W1-Feldförderung/W3-Lieferung/Rückflug → **zweiter** W4-Originalauftrag und W5-Bau → realer Kauf des neuen Schiffs und bezahlte Überführung nach Aldera.

**Strenge Warenherkunftsgrenze:** Ein W4-Rezept verbraucht **10 Erz und produziert 5 Material**. Nach dem ersten W4-Auftrag sind im Nadir-Lager weitere 40 Erz der ersten 50er-Charge vorhanden. Das zweite Rezept startet **nach** der zweiten Lieferung und verbraucht nachweislich **10 tatsächlich eingelagerte Erz**, aber der bestehende fungible Lagerkern führt **keine Chargen-IDs**. Deshalb lässt sich nicht behaupten, gerade diese zehn Teilmengen stammten individuell aus der zweiten Erzlieferung. K9 testet **zeitliche Folge und vollständige Mengenbilanz**, nicht erfundene Charge-zu-Material-Provenienz.

## [TEST] Tatsächlich ausgeführter gezielter K9-Erstnachweis

[GitHub Actions #43394512994](https://github.com/tobiasfranziskus/Check/actions/runs/43394512994), auf Testcodehead `a9be5879`: **2/2 Node22-Testfälle bestanden** (beide Seeds), 0 fehlgeschlagen. Der vorherige K9-Anlauf war **rot aufgrund eines Testfehlers**: Die originale Transfer-Quote heißt `minuten`, nicht `minutes`. Diese Behauptung wurde korrigiert; keine Wirtschaftsregel wurde geändert.

| Tatsächlicher wirtschaftlicher Nachweis | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Zweite zusätzlich geförderte und gelieferte Erz | 50 | 50 |
| W3-Käuferreserve aus Nadir | 740 ISK | 740 ISK |
| Zweite W4-Rezeptur | 10 Erz → 5 Material | 10 Erz → 5 Material |
| Zweiter realer W5-Frachterbau | 1 | 1 |
| Eigentumskauf zu Originalpreis | 750 ISK | 750 ISK |
| Bezahlter Nadir-Aldera-Flug | 60 Minuten | 60 Minuten |
| Neue Schiff-ID | `sh024` | `sh024` |
| Weltgeld nach dem Folgezyklus | 33.000 ISK | 33.000 ISK |
| Mint / Burn | 0 / 0 | 0 / 0 |
| Resultierender Referenzhash | `c721cc9d554fc9bf` | `275ba145998ea29b` |

Die W4-Originalarbeitszeit beträgt 20 Minuten mit 1 ISK Lohn je Minute, W5 30 Minuten mit 1 ISK Lohn. K9 kontrolliert tatsächliche neue W4-Zähler und Erz-/Materialledger, W5-Materialverbrauch und Löhne, physisches Werftlager, einmalige Werfttreuhandauslösung, wirklichen Schiffskauf, neue Eigentümer-ID, bezahlte Überführung, Geldsumme und vollständigen Core-Audit. Negativprüfungen blockieren vorzeitigen Bau ohne Material und wiederholte Auslösung der Werftreserve. Save/Load nach Erzlieferung und nach Schiffkauf sowie 130-Minuten-Replay sind enthalten.

**[CI-ABGRENZUNG]** Der Test wurde anschließend auf dem letzten Draft-Codehead um unabhängige Kontrollen für 60 ISK Fluglohntreuhand, echte Auszahlung und eindeutige neue Hüllen-ID erweitert. Der abschließende CI-Lauf **dieses neuen Codeheads** ist bei Erstellung dieses Berichts noch offen; die obigen Zahlen stammen ausschließlich aus dem bereits ausgeführten Codehead `a9be5879`, nicht aus einem erfundenen neuen Test.

## Noch keine Dauerversorgung

Dieser positive **zweite** W4/W5-Zyklus ist **kein W6-Nachhaltigkeitsbeweis**. Offen bleiben die dritte und weitere legitime Industrie-Erzfinanzierung, langfristig ausreichende Unternehmensliquidität, echte Nachfrage nach neu produzierten Schiffen, Insolvenz und Ersatzgüter-Grenzfälle sowie neue 13×90-/365-/730-Tage-Prüfungen bei einem späteren produktiven Regelvorschlag. Die drei anfänglichen W5-Käufe sind **ein spezifischer Krisen-Gegenversuch**, keine allgemeine Kaufpflicht und keine Balancingfreigabe.

**[NÄCHSTE ANALYSE]** Ab dem nun finanziert gebauten und überführten `sh024` den dritten industriellen 50-Erz-Auftrag in einem bereits vollständig gebuchten K9-Endzustand versuchen. Keine künstlichen Transfers, keine Exportetataufstockung, kein Aufweichen der Werft- oder Eigentumsprüfung. Echte iPad Safari-/NAS-Gerätetests bleiben ausstehend.
