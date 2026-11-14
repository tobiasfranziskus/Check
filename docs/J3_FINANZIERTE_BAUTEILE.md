# J3 – Vorfinanzierte Bauteile aus tatsächlich geliefertem Silizium und bezahltem W4-Material

**[DRAFT / ANALYSE · 14.11.2026]** Eigenständiger Forschungsbranch auf J2b #340 (über #339/#338/#335/#331). Die Regel195-Hauptversion und die Regel200-/201-Forschungsprofile behalten ihren bisherigen Stand.

## Wirtschaftsherkunft

Das vorhandene W5-Referenzrezept r_bauteil lautet **2 Material + 1 Silizium → 1 Bauteil in 8 Arbeitsminuten**. J3 verwendet es ausschließlich in einem ausdrücklich gewählten Regel202-Forschungsprofil, nicht als freigegebenes Balancing. Die Nadir-Station ist wirtschaftlicher Besitzer des bereits aus echtem W3-Erz und bezahlter W4-Arbeit gewonnenen Materials sowie des bei J2b für 192 ISK vorfinanziert angekauften Siliziums. Diese Inputs werden nicht erneut künstlich gekauft; der ursprüngliche Warenkauf ist bereits bezahlt und verbucht.

## Umfang

- Die neue Regel-Fabrik createJ3Welt erzeugt nur auf ausdrücklichen Aufruf Regel202. Bauteil-Anfangslager und Warenledger betragen **0**. Die Funktion ausRegel201J3(json) validiert den vollständigen alten Regel201-Save und Quellhash, legt ausschließlich neue leere Bauteil-/Arbeiterbelege an und verändert den Ursprungsstand nicht. Keine automatische Migration.
- Im neuen J3-Modul prototypes/welt/j3-bauteil-core.js wird ausschließlich der strenge Auftrag stationBuildParts durch den Stationsbesitzer st_nadir akzeptiert. Voraussetzungen: mindestens 2 wirkliche Materialeinheiten und 1 wirkliches Silizium im Stationslager, 8 verfügbare Nadir-ISK, keine parallele Produktion.
- Direkt zum Auftragsbeginn: 2 Material und 1 Silizium werden physisch und im Warenledger verbraucht; genau 8 ISK werden über das Original-K1-Doppelbuch als Lohnreserve gesperrt. Jede autoritative Wirtschaftsminute wird 1 ISK an ein bei 0 startendes Arbeitskonto bezahlt. **Erst nach 8 bezahlten Minuten** entsteht 1 Bauteil samt Zeit- und Verbrauchsbeleg im wirklichen Stationslager.
- Die historischen W4-/W5-Materialaudits und der J2b-Siliziumaudit prüfen neue Industrieentnahmen nur unter dem echten J3-Verbrauchsbuch, mit ursprünglicher Waren- und Eigentumskontrolle. Der J3-Audit kontrolliert Auftragszahl, Lohnreservierung und -auszahlung, tatsächliche Belege, Lager und Ledger. Kein gratis Material, keine Schiffe, kein Kopfgeld.

## Tests und Grenzen

Der neue Test tests/j3-finanzierte-bauteile.test.mjs beginnt in Seeds42/7 bei der tatsächlich aus K6/K7, J2a und J2b finanzierten Welt. Er lässt anschließend ausschließlich eine zusätzliche echte W4-Charge aus bereits vorhandenem angeliefertem Erz herstellen. Positiver Sollnachweis: zwei wirkliche Bauteile nach 16 bezahlten Minuten, 4 Material und 2 Silizium Verbrauch. Weitere Fälle: Kassen-/Material-/Siliziummangel, parallele Aufträge, falsche Eigentümer, Einzelbelege, Save/Load, deterministischer Replay und Geldsumme 33.000 ISK mit Mint/Burn0.

**Bei Abfassung: Positive J3-CI, Altversionssuite, Browser- und 90/365/730-Tage-Langzeitabnahme noch offen.** Erfüllt der vorhandene Rohstoffbestand den Sollnachweis nicht, muss der Negativbefund dokumentiert werden; keine Waren nachfüllen. Echte iPad-Safari-/NAS-Abnahme separat offen.

**J4 – echter bezahlter Jägerbau** ist weiterhin ein eigenes Gate, erst nach acht real finanzierten Bauteilen und zusätzlichem Material. Keine Änderungen an main, Produkt-HTML, Original-F6, F8-Trainingscode, produktiven Saves oder Pages/NAS. Kein Merge/Deployment.
