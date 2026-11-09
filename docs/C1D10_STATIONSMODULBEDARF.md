# C1d-10 – Ein wirklich bezahlter, intern benötigter Stationsausbau

**[DRAFT/FORSCHUNG · 08.11.2026]** Basierend auf [C1d-9 #263](https://github.com/tobiasfranziskus/Check/pull/263) ohne Änderung an `main`, Pages, NAS, produktiven Saves oder der einzigen ROADMAP. Neues opt-in-Profil `aphros-research:C1d-10:paid-station-capacity-v1`, **Regel 3314**. Keine neue ISK, keine zweite Simulations-Engine, keine versteckte finanzielle Rettung.

## Forschungsfrage

Nach zwei realen, aus vorhandenen Käufer-ISK vollständig bezahlten Meridian-Viererexporten sind Module zwar physisch hergestellt und verkauft, es fehlen jedoch belegte **interne** Käufer mit eigenem sachlichem Nutzen. Die nächste Forschungsstufe darf nicht einfach einen dritten wertlosen 1.720-ISK-Export erlauben.

Stattdessen erhält die bestehende Nadir-Station einen **einmaligen, aktiven Kauf** eines zusätzlich nachweislich hergestellten `lager`-Moduls für die im Original-Core vorhandene Stationslagermechanik. Ein **real eingebautes** Lagermodul erhöht dort die rechnerische `m_core_handel.obergrenze` für handelbare Rohstofflager um 50% gegenüber der vorherigen modullosen Kapazität. Dies ist **Kapazitätsausbau**, keine automatische Wiederbeschaffung und kein tatsächlicher Nachweis, dass die erhöhte Kapazität schon benötigt oder profitabel genutzt wird.

## Nachvollziehbare Folge

1. Ausgang ist der gültige abgeschlossene Zwei-Export-Zustand C1d-8b: **8 produzierte / 8 exportierte** Module, **20 unbehandelte Erz** in Nadir, Käufer `export` 16.460 ISK, `st_nadir` 1.676 ISK, Hersteller `house` 3.572 ISK, Welt 33.000 ISK.
2. Der Original-W4-Core raffiniert **10 der 20 vorhandenen Erz** mit **10 bezahlten Arbeitsminuten** zu **4 neuem Material**.
3. Der originale W5b-Core bezahlt **20 Silizium-Förderminuten**, verarbeitet vier reale Material und zwei reale Silizium zu einem weiteren **Bauteillos 0009** und bezahlt seine 16 Bauteilarbeitsminuten.
4. Original-`stationBuildStorage` entnimmt die **2 eigentumsrechtlich dem Hersteller gehörenden Bauteile**, bezahlt **12 Lagerbau-Arbeitsminuten** und erzeugt den zusätzlichen physischen Lagerartikel `C1D5-LAGER-0009` in Nadir.
5. Erst jetzt darf der konkrete Käufer `st_nadir` seinen eigenen vorhandenen Kontostand belasten: neuer Original-Core-Befehl `stationInstallPaidStorage`, **430 ISK an `house`**, einmalige Güterausbuchung aus Stationsbestand in `ledger.lager.consumed`, und tatsächliche Erhöhung von `stations.st_nadir.module.lager` um eins. Die Lagerobergrenze steigt gemäß **unverändertem** `m_core_handel.obergrenze`.
6. Eine zweite identische Bestellung ist ohne neues reales Modul, neue Finanzierung und neue Bedarfsberechtigung ausdrücklich gesperrt. C1d-4 / C1d-8b bleiben historisch abgeschlossen; keine neue Meridian-Rundfahrt.

## Gemessener Forschungsabschluss – beide Seeds 42 und 7

| Original-Core-Messung | Je Seed |
| --- | ---: |
| Abschlusszeitpunkt, Tick | **1.360** |
| Kumulativ produzierte Lagermodule | **9** |
| Davon extern bezahlt exportiert | **8** |
| Zusätzlich tatsächlich installiert | **1** |
| Nadir-Betriebskasse nach Kauf | **1.428 ISK** |
| Herstellerkasse nach Verkauf | **3.762 ISK** |
| Originale Erz-Lagerobergrenze Nadir vorher | **625 Erz** |
| Nach tatsächlichem Einbau | **937 Erz** |
| Weltweite Geldmenge | **33.000 ISK** |
| Neue ISK | **0** |
| Seed-42-Abschlusshash | `49a7e67f856938ee` |
| Seed-7-Abschlusshash | `ab4743294aec3ff0` |

**[TEST / direkte Ausführung]** Der vollständige Original-JavaScript-Core wurde im isolierten Prüf-Harness ausgeführt: **6/6 C1d-10-Testgruppen erfolgreich**, beide Seeds mit 1.360 echten Ticks, negativen Berechtigungs-/Fälschungsfällen, Save/Load und je 200 weiteren Ticks deterministischen Audits. Die eigenständigen GitHub-Node22- und Vollregressionsprüfungen sind damit **nicht** ersetzt. Die erste GitHub-Forschungs-CI #42522911304 war rot wegen eines nicht auf Null normalisierten, anfangs fehlenden Modulzählers; dies ist im neueren Code korrigiert. Die korrigierte [Node22-Forschungs-CI #42524393433](https://github.com/tobiasfranziskus/Check/actions/runs/42524393433) ist erfolgreich, ebenso die [vollständige JavaScript-Regression #42524393386](https://github.com/tobiasfranziskus/Check/actions/runs/42524393386): **573/573 Tests bestanden, 0 Fehler/Skips**, sieben erfolgreiche Jobs, ein optionaler Vergleich übersprungen. Die oben genannten Hashes sind die tatsächlichen Node22-/GitHub-CI-Werte (frühere lokale Prüf-Harness-Hashwerte waren nicht maßgeblich).

## Unabhängigkeit, Risiken und Tests

- Original-Core-Produktions-, Arbeits-, Geld-, Eigentums-, Kapazitäts- und Warenaudits sowie unabhängiger Forschungsprüfer `stationDemandAudit` greifen ineinander. Originalfrachtrundflüge und beide Käuferverträge bleiben vollständig erkennbar.
- Negative Tests: fremder Eigentümer, falsche Station, doppelte Ausführung, erfundene Ware oder Kontobewegung, manipulierte Titel, Kosten, Einbauzahlen, Journal-Signaturen und Lagerobergrenzen. Save/Load trennt Regel3314 strikt von 3313 und älteren Profilen.
- Wiederholte echte Seeds 42/7 mit identischem vollständigen C1d8b-Vorlauf, dem neuen zusätzlichen Modul und 200 weiteren Ticks, deterministische Hashes.
- Test-Datei: `tests/c1d-10-stationsmodulbedarf.test.mjs`; offizielle Node22-Forschungs-CI und Gesamtregression **inzwischen erfolgreich geprüft**. Ergebnisse werden erst nach tatsächlichem Lauf als bestanden bezeichnet.

## Grenzen

**Noch kein dauerhafter Nachfragekreislauf:** Ein zusätzlicher rational möglicher Stationsausbau ist ein **realer interner Käufer und eine reale Nutzung**, aber keine monatlich garantierte Nachfrage. Die Erhöhung der Lagerkapazität ist **keine automatische Notwendigkeit**; zukünftige zusätzliche Käufe müssen durch tatsächliche wirtschaftliche Nutzung, Finanzierung und Bedarfsrechte gerechtfertigt werden. Kein Eigentums-/Dividendenrecht, keine Emissionsregel, kein Schiffverschleiß und keine 13×90-/365-Tage-Stabilität daraus ableiten. Weitere Forschung: den Kapazitätsnutzen im aktiven W3-Markt tatsächlich messen und die Kaufentscheidung mit belegtem Kapazitätsbedarf verknüpfen.
