# C1d-8b – Zwei echte Viererverkäufe und vollständig finanzierte Frachtrundfahrten

**[DRAFT / FORSCHUNG · 08.11.2026]** Abhängiger Nachfolger von [C1d-8 / PR #261](https://github.com/tobiasfranziskus/Check/pull/261). Nur im isolierten Forschungsprofil `aphros-research:C1d-8b:second-paid-delivery-v1` (**Regel 3313**). Der Produktstand von `main` (Regel14/Schema8), produktive Saves, Pages, NAS und ROADMAP bleiben unverändert. **Keine Produktfreigabe, keine neuen ISK, kein zweiter Simulationskern.**

## Umsetzung: ein gemeinsamer Original-Core, zwei unterscheidbare abgeschlossene Verträge

Ausgangslage von C1d-8: bereits vier in Meridian gegen **1.720 ISK** aus der bestehenden Käuferkasse verkaufte Lagermodule; vier **zusätzlich aus eigenem Erz, Silizium, Material und Bauteilen bezahlte** Lagermodule mit eigenen Original-W5b-Titeln in Nadir, Tick1062. Erster Kaufvertrag `C1D4-0001`, erste Rundfracht: bereits endgültig erfüllt und ausgezahlt. Die vier neuen Waren **dürfen nicht** auf den ersten Beleg erneut verkauft werden.

Nur in Regel3313 erweitert derselbe autoritative **C1f-Kauf- und C1d-Flugkern** die registrierten Originalbefehle um `stationPrepayStorageSecond`, `shipCapitalFreightSecond` und `stationAcceptStorageSecond`. Keine neue statische Simulationsroutine, kein Geldemissionspfad und keine zweite Eigentums-/Wirtschaftsdatenbank.

1. Der bereits vorhandene Käufer `export` bestellt **die neuen vier tatsächlich im Nadir-Lager vorhandenen Module**. Originalvertrag `C1D8B-0002`, registriertes **neues** Original-Kassenjournal, 1.720 ISK komplette Abbuchung aus der zu diesem Zeitpunkt mit 18.180 ISK gedeckten bestehenden Käuferkasse. Davon 340 ISK echter Vorschuss an `house` und **1.380 ISK erneut gesperrter Kaufrest** im nach dem ersten Vertrag leer gewordenen Escrow. Der frühere Kaufbeleg `C1D4-0001` und seine Zahlungsbeträge bleiben vollständig erhalten, werden weder zurückgesetzt noch kopiert.
2. Der bestehende Frachter `sh002` muss wieder physisch frei und in Aldera angedockt sein. Der Hersteller bezahlt **erneut 300 ISK** aus seiner tatsächlichen Kasse in die Frachtreserve; die Spedition bezahlt **erneut alle 240 ISK Pilotarbeitszeit** im Voraus. Neuer unverwechselbarer Frachterbeleg `C1D8B-FREIGHT-0002`, neue Original-Kassenjournale; die erste alte Rundfracht verbleibt als abgeschlossener historischer Beleg.
3. **Tick1122**: Quelle Nadir −4 Module, echte Frachterladung +4. **Tick1182**: echte Frachterladung −4 und Meridian-Lager +4; **keine automatische Abnahme oder Auszahlung**. Beide Ausgaben- und Warenbücher müssen bei allen Schritten konsistent sein. In den folgenden 120 Minuten wird der Rückflug aus dem bereits gebundenen Pilotbudget abgerechnet.
4. **Tick1302**: vollständig bezahlter Rückflug beendet, vier Module warten real in Meridian; der Frachter ist wieder in Aldera. Erst jetzt akzeptiert derselbe ursprüngliche Kaufkern die neue physische Viererware gegen den **noch exakt 1.380 ISK** umfassenden zweiten Kaufrest. Bestand Meridian −4, `ledger.lager.exported` +4, 1.380 ISK aus dem nachweisbaren zweiten Escrow an `house`; keine ISK neu geschaffen oder verbrannt.
5. Alle C1f-/C1d-Audits sowie das ursprüngliche W5b-Waren-/Eigentumsbuch bleiben maßgeblich. Ihre kumulativen Prüfungen kennen nun in Regel3313 die zweite sachlich gebundene Fracht, die Summe der **zweimal bezahlten** Fracht- und Pilotenleistungen, die historischen Kontostände und die tatsächliche externe Ausbuchung von insgesamt acht fertigen Modulen. Die erste Entgelt-/Frachtbuchung wird nicht noch einmal angerechnet.

## Tatsächliche Endmesswerte – Seeds 42 und 7

| Prüfkriterium | Seed 42 und Seed 7 |
| --- | ---: |
| Simulations-Tick zweite Abnahme | **1302** |
| Kumulativ hergestellte Lagermodule | **8** |
| Real extern verkaufte Lagermodule | **4 + 4 = 8** |
| Zwei voneinander verschiedene signierte Kaufverträge | **`C1D4-0001` / `C1D8B-0002`** |
| Zwei nachweisbar ausgeführte Frachtverträge | **erstes Originalgeschäft / `C1D8B-FREIGHT-0002`** |
| Zweimal wirklich ausgezahlte Kaufpreise | **2 × 1.720 = 3.440 ISK** |
| Zweimal bezahlte Frachtrundfahrt | **2 × 300 = 600 ISK** |
| Sämtliche real bezahlten Pilotenminuten | **2 × 240 = 480 Minuten/ISK** |
| Herstellerkasse `house` | **3.572 ISK** |
| Käuferkasse `export` | **16.460 ISK** |
| Speditionskasse `transport` | **1.610 ISK** |
| Beide Kaufrest-Treuhande am Ende | **0 ISK** |
| Beide Fracht-/Arbeits-Treuhande am Ende | **0 ISK** |
| Gesamte Weltgeldmenge | **33.000 ISK** |
| Neu ausgegebene ISK | **0** |
| Endhash Seed 42 | `71c6e1551d7beeda` |
| Endhash Seed 7 | `e8f25c091fcecf04` |

Der Käufer hatte ursprünglich 20.000 ISK. Seine 16.460 ISK Endkasse enthält zusätzlich zu **3.440 ISK wirklich bezahlten Modulkäufen** den **−100-ISK-Deckungsbeitrag aus dem bestehenden Erz-Großhandelsgeschäft**. Das vorhandene Geld ist endlich und wird nicht ohne neue Einnahme ersetzt. Eine zweifache tatsächliche Abnahme **beweist keine dritte, vierte oder dauerhafte Endnachfrage**; Schiffskapital, Verschleiß und mögliche Insolvenzen sind weiterhin als eigenständige Fragestellungen offen.

## Unabhängige Audits und Fälschungsschutz

- Zwei Original-C1f-Kontobelege mit **verschiedenen IDs und signierten, kumulativen Käufer-Journalen**; jeweils nur genau eine Vorauszahlung und eine Endabnahme, keine zusätzliche Geldschöpfung oder fremder Kassenübertrag.
- Der zweite Original-C1d-Flug läuft über denselben Routen-/Tick- und Warenkern wie die erste Rundfracht. Der zweite Flug hat einen getrennten eindeutigen Arbeits-/Frachtbeleg, vorfinanzierte 300 ISK und 240 Minuten; der erste erfolgreiche historische Rückflug kann die zweite neue Ausbuchung nicht autorisieren.
- Der unabhängige Audit prüft unter anderem **beide Waren- und Titellosbestände, Original-Kaufgeld, Signatur-Baselines, aktuelle Kassen samt rechtmäßig gebundener Arbeitsreserve, kumulative Löhne, Frachtkonten, Stations- und Frachterladung sowie Null-Emission**.
- Doppelte Vorauszahlung, dritte Einmalfracht, doppelte Abnahme, manipulierte ID, Kaufpreis-/Treuhandbeträge, Pilotenlöhne, erfundene Waren oder direkte ungebuchte Kassenveränderungen werden abgelehnt. Keine stille Save-Migration zwischen Regel3312/3313.
- `tests/c1d-8b-zweiter-export.test.mjs`: **7/7 direkte Original-Core-Tests** in Seeds 42/7 tatsächlich bestanden, mit vollständigen Originalaudits bei jedem Tick, Save/Load, Replay und Fälschungsprüfungen. Forschungs-Node22-CI separat bestätigen. Die nachträglich gefundene alte JavaScript-Regressionsabweichung aus #261 (zusätzliches Feld `storageExpense:0` im unveränderten Standardprofil) wurde durch nur bei echter C1f-Vorauszahlung vorhandenes Feld korrigiert. Die vollständige Regression muss erneut ausgeführt werden; der Zustand von #261 bleibt historisch `553/554` und darf nicht als bestanden bezeichnet werden.
- Echte iPad-Safari-/NAS-Abnahme ausstehend; `main`, Pages, produktive Save-Slots und Roadmap unberührt.

## Nächster Schritt [OPTION]

Die Unternehmens- und Haushaltseinnahmen dürfen noch **nicht** durch frei erfundene Geldemissionen aufgefüllt werden. Mit unveränderten fünf- bis achtstelligen Forschungs-IDs, bereits finanzierten zwei Aufträgen und aufgebrauchter aktuellen Produktionsbegrenzung ist ein Dritterfolg ohne nachgewiesene neue Rohstoffe und Käuferleistung unzulässig. Eine dritte Periode sollte entweder durch echte nachgelagerte Nachfrage (Haushaltskäufe/Konzernverschleiß) oder ein gesondert freigegebenes, vollständig auditiertes Endnachfragemodell begründet werden. Zuvor unabhängige Bilanz **nach beiden Verkäufen**, tatsächlichen Kapitalschutz und Krisenfälle prüfen.
