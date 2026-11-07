# W5s-ah – real verdientes Überführungsentgelt erreicht die Verbraucherhaushalte

**[DRAFT/ANALYSE · 07.11.2026]** [PR #236](https://github.com/tobiasfranziskus/Check/pull/236), gestapelt auf [W5s-ag #235](https://github.com/tobiasfranziskus/Check/pull/235). [MAIN] `5a56d9d7`, Pages-Spieltest, alte Versionen und Save-Slots unberührt. Forschung ausschließlich mit `w5s.autoTransferWageHousehold:true`; Default OFF, Regel32/Schema8 unverändert, kein Merge oder Deployment.

## Ursachenaudit

W5s-ag erzielte in Seed42/7 weitere 384 echte Wasserverkäufe, 40 Fabrikchargen, acht Original-Eisfrachten und drei Drittspediteur-Erzfahrten, aber ab Tag185 blieb das Haushaltsgeld mit 10 ISK unter dem unveränderten Endverbrauchspreis von 14 ISK je Wasser. Die physische Ware und Stationsgeld waren noch vorhanden, ein weiterer vollfinanzierter Endkundenauftrag jedoch nicht.

Der Original-W5s-Flugkern reserviert vor einer Überführung den kompletten minutengenauen Lohn vom Schiffseigentümer. Jede tatsächlich geleistete Minute überweist aus `w5s_transfer_reserved` genau 1 ISK an `w5s_transfer_pilot`. Dieses *bereits verdiente* Lohnkonto wurde – anders als W3-Piloten, W4/W5/W5r-Arbeiter, W5n-Produktion – nicht an die R32-Verbraucherhaushalte ausgekehrt. Es hielt nach dem finanzierten dritten Carrier-Start 1.020 ISK, in der Folge 1.080 ISK. Die Gelder sind weder Kaufkraft aus dem Nichts noch freies Eigentümerkapital.

## Isolierte Änderung

Nur bei `autoTransferWageHousehold === true` und bereits aktiven R32-/W5s-Industriebedingungen wird zur bestehenden stündlichen Haushaltslohnverteilung `m_core_w5s.transferPilotWage` aufgerufen. Gutschrift höchstens `s.w5s.paid - (s.w5s.transferPilotWages||0)`, abzüglich des wirklich vorhandenen Arbeitskontos. `transferPilotPays` speichert Tick und Betrag. Der Beleg prüft gültige Stunden, eindeutige aufsteigende Ticks, positive ganze Beträge, die exakte Summe, `paid <= real paid flight minutes` und `pilot.cash === paid flight wages - distributed wages`.

Die vorhandenen W5n-/W5o-/W5q-Haushaltsgeldgleichungen sowie der W5s-Gesamtaudit wurden um *dieselbe* Auszahlung erweitert. W3-Treuhand, andere Gesellschaften, Hüllen, Preise, Verbrauch, Produktionsrezepte und Gesamtgeld sind unverändert. Ursprüngliche Stände ohne neuen Beleg und OFF-Simulationen sind weiter geprüft. Kein zweiter Core oder neue Laufzeitabhängigkeit.

## Direkte [TEST]-Ergebnisse (nicht mit Node-22-CI verwechseln)

Die sechs neuen Prüffälle wurden direkt gegen den tatsächlich im GitHub-Branch abgelegten Core ausgeführt: **6/6 bestanden**. Sie prüfen OFF-Gleichheit, echten 1.020-ISK-Lohnausgang und einmalige Buchung, gefälschte Lohn-/Tick-/Kontenbelege, spätere echte 60-ISK-Flugminuten, unabhängige Gesellschaften, 13 Seeds × 90 Tage mit unabhängigen Geld-/Waren-Audits sowie Seed 42/7 bis *exakt Tag365* mit täglichem Vollkosten- und periodischem Save/Load-Audit.

| Aus echten Seed42/7 nach bezahlter Dritt-Firmengründung | W5s-ag (35 Tage) | W5s-ah (35 Tage) |
| --- | ---: | ---: |
| Zusätzlich an Kunden verkaufte Wassereinheiten | 384 | **1.490** |
| Zusätzlich abgeschlossene Wasserwerkschargen | 40 | **150** |
| Originale zusätzliche Eisfrachtabschlüsse | 8 | **30** |
| Kasse unabhängiger Drittspediteur | 480 ISK | **1.080 ISK** |
| Davon bereits vorfinanzierter W5s-Pilotenlohn im Haushaltskreislauf | 0 ISK | **1.080 ISK** |
| Geldmenge weltweit | 33.000 ISK | **33.000 ISK** |
| Neu geschaffene / verbrannte ISK | 0 / 0 | **0 / 0** |

Seed42/7 Tag365: Hashes `8b2aad35deff33b8` / `777180b0d6276eaa`. Der Pilotarbeitskontosaldo ist anschließend 0 ISK; sämtliche 1.080 ISK wurden ausgezahlt. Die Endkunden besitzen **nur 9 ISK**, der Wasserpreis bleibt bei 14 ISK. Die zusätzliche Nachfrage ist real, aber **endlich**; ab dem späteren Zeitpunkt sind weder permanente Arbeitsaufträge noch Ersatzfrachter aus dem Produktionsschub garantiert.

## Qualität / nicht behauptete Freigaben

Neuer Node-22-Workflow `.github/workflows/w5s-ah-pilotenlohn.yml`, gezielte Checks plus vollständige Standardregression, ist separat abzunehmen. iPad Safari/NAS und die W5u-R32-Anbindung bleiben offen. Keine Änderung am veröffentlichten Stand und keine Freigabe für die dauerhafte Verbraucher-Einkommensregel. Nächster Wirtschaftsschritt: tatsächliche zusätzliche Käufer **mit realem Nutzungszweck** und vollständig vorfinanziertem Absatz oder ein eigenständiges wiederkehrendes Produktions-/Leistungsmodell, ausdrücklich keine automatische Haushaltsauffüllung, kein künstlicher Frachterauftrag und keine stillschweigende Massenemission.
