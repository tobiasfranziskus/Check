# C1d-9 – Zwei real bezahlte Modulzyklen: Firmenkapital, Löhne, Endnachfrage

**[DRAFT / UNABHÄNGIGE ANALYSE · 08.11.2026]** Unmittelbar auf [C1d-8b / PR #262](https://github.com/tobiasfranziskus/Check/pull/262) mit Original-Core-Forschungsprofil **Regel 3313** gestapelt. Kein neuer Wirtschaftskern, keine weitere Produktregel, keine erfundene Nachfrage, keine ISK-Emission und keine Änderung an den produktiven Spielständen, Pages oder `main`. Die Produkt-Roadmap ist unverändert.

## Prüfidee

C1d-8b weist eine **erste** und **zweite** real gebaute, wirklich bezahlte und physisch nach Meridian gelieferte Viererserie nach. C1d-9 nimmt für beide Seeds 42 und 7 die drei Originalzustände **Tick 0, 592 und 1302**, vergleicht **jede Eigentümerkasse**, die Original-Konto-Journale und die Waren-/Schiffstitel, und trennt ausdrücklich Kapitalausgabe, laufende Zahlungsüberschüsse und eine nur theoretische Käuferbudget-Reichweite. **Es wird keine dritte Lieferung behauptet.**

| Eigentümer | Tick 0 | Nach 1. Viererabnahme, Tick 592 | Nach 2. Viererabnahme, Tick 1302 | Kassenänderung gesamt |
| --- | ---: | ---: | ---: | ---: |
| `house` – Miner-/Modulhersteller | 3.000 | 2.740 | 3.572 | **+572** |
| `export` – endlicher Käufer | 20.000 | 18.180 | 16.460 | **−3.540** |
| `st_nadir` – Raffinerie-/Lagerbetrieb | 1.700 | 1.688 | 1.676 | **−24** |
| `transport` – bestehender Frachter | 1.250 | 1.430 | 1.610 | **+360** |
| `werft_extern` – Minerverkäufer | 1.350 | 2.550 | 2.550 | **+1.200** |

Diese Konten sind **nicht die gesamte Welt**: Arbeiter-/Pilotenkassen, Fonds und andere Eigentümer werden zusätzlich im vollständigen `33.000-ISK`-Weltkassen-Audit berücksichtigt. Kein Geld wird aus einer bloßen Nettoänderung dieser fünf Konten erschaffen oder vernichtet. Sämtliche beiden Kauf-, Transport- und Arbeits-Treuhande werden leer abgeschlossen; ihre Auszahlungen zählen nicht doppelt als neues Geld. Alle hier genannten Messwerte sind **Soll-/Prüfwerte** des neuen separaten Original-Core-Nachweises, nicht produktive `main`-Werte.

## Zurechenbare Zahlungskette und Grenzen

- **Zwei echte Käuferaufträge**: zusammen **8 Lagermodule × 430 ISK = 3.440 ISK** aus vorher vorhandener Käuferkasse. Zusätzlich **−100 ISK** beim bestehenden Erz-Großhandelsgeschäft, somit `export` **−3.540 ISK** in Summe. **Kein extern nachgewiesener neuer Käufererlös**.
- **Hersteller vor vollständiger Gewinnrechnung**: 1.920 ISK direkter Vorprodukteinkauf + 160 ISK Siliziumlohn + 224 ISK Fertigungs-/Montagelohn + 600 ISK Modulfracht = **2.904 ISK** bezahlte direkte Vertragsausgaben. **3.440 − 2.904 = +536 ISK** einfacher Modul-Deckungsbeitrag **vor** eigener Erzarbeit, eigener Schiffsanschaffung, gebundenen Rohstoffen und nicht nachgewiesenem Verschleiß. Nicht als Unternehmensgewinn ausgeben.
- **Herstellerkapital**: zwei real angeschaffte, weiter vorhandene **600-ISK-Miner** (**1.200 ISK Capex**). Kasse `house` stieg über beide Perioden um **572 ISK**; **+1.772 ISK** Betriebskassenänderung *vor* dem Minerkapitalabfluss. Weder +572 noch +1.772 ist ein geprüfter Periodengewinn; Preis, Abschreibung und Wiederbeschaffung der beiden Miner sind nicht bestimmt.
- **Spedition**: zweimal 240 ISK W3-Erzfrachtumsatz abzgl. zweimal 120 ISK W3-Pilotenarbeit, plus zweimal 300 ISK Modul-Frachtumsatz abzgl. zweimal 240 ISK Modulpilotarbeit: **+360 ISK Kasse**. Anschaffung/Verschleiß der bereits zuvor vorhandenen Frachterhülle ist hier nicht amortisiert.
- **Station**: **−24 ISK Kasse** bei weiter vorhandenem physischem Rest-Erz. Kumulativ **124 Erz gefördert, 100 nach Nadir geliefert, 80 raffiniert**, davon **20 Erz physisch in Nadir**; insgesamt **44 noch nicht verarbeitete Erz** in der Welt. Ohne dokumentierten Eigentums-/Einstandspreis und künftigen Absatz ist das weder frei verfügbares Geld noch ein gesicherter Lagergewinn.
- **Reale Löhne**: 248 ISK Erzförderung, 160 ISK Siliziumförderung, 80 ISK Raffinerie, 224 ISK Fabrik-/Lagermontage, 240 ISK W3-Frachtarbeit und 480 ISK Modul-Frachtarbeit; zusätzlich bestehende andere Arbeitsströme separat im Core. Kein Lohn ist ein zweites Mal aus Treuhand zu zählen.

## Das Nachfrage-Gate – entscheidende Grenze

Nach beiden Verkäufen besitzt `export` weiterhin **16.460 ISK**. Bei unverändertem Viererpreis von 1.720 ISK reichte **diese Kasse isoliert rechnerisch noch für neun weitere Viereraufträge** (`floor(16.460 / 1.720)`). **Das ist weder ein Vertragsrecht noch ein Absatzplan, noch würde es Rohstoffe, Fracht oder neue Produktionslose bezahlen.** Beide autorisierten Originalkäufe sind erfüllt und weitere gleichartige Kauf-/Frachtbefehle werden abgelehnt: **0 zusätzlich zulässige Verträge** im aktuellen Forschungsprofil.

Die Bindung liegt in **rechtmäßigem Folgeauftrag und realer endlicher Endnachfrage**, nicht schon an einer allgemeinen Erz-Verfügbarkeitsgrenze oder an einem automatischen Mangel von 1.720 ISK beim bisherigen Käufer. Neue von außen zufließende ISK oder ein Käufer-Reset dürfen das Problem **nicht** maskieren. Das Unternehmen kann weiter sparen; ein Überschuss wird nicht zwangsverteilt. Eine wiederkehrende Nachfrage benötigt künftig separate Rechte, reale Finanzierung sowie echten Warenverbrauch oder Ersatzbedarf.

## Umfang der reproduzierbaren Tests

`tools/research/c1d-9-kapitalreichweite.mjs` ist strikt lesend. `tests/c1d-9-kapitalreichweite.test.mjs` baut **beide vollständigen 1.302-Tick-Szenarien erneut über die Original-Befehle** auf, prüft laufend das autoritative Audit, alle drei Snapshots, jede Kassenbrücke, unabhängige Journale, Kapital-/Lohn-/Güterzahlen, Fälschungen und Ablehnung dritter Verträge. Save/Load, feste Endhashes und weitere **200 Ticks deterministischer Nachlauf** werden separat geprüft. **[TEST / CI]** Der offizielle [GitHub-Forschungsworkflow #42515989828](https://github.com/tobiasfranziskus/Check/actions/runs/42515989828) ist **erfolgreich abgeschlossen**, die eigene neue Stufe C1d-9 umfasst **6/6 bestandene Tests**, 0 Fehler, 0 Skips. Endhashes: Seed42 `71c6e1551d7beeda`; Seed7 `e8f25c091fcecf04`. Die separate [vollständige JavaScript-Regression #42515989825](https://github.com/tobiasfranziskus/Check/actions/runs/42515989825) war bei dieser Aktualisierung **noch nicht abgeschlossen**; ihr Erfolg wird hier nicht behauptet.

**Nicht nachgewiesen:** 13 × 90 oder 365 Tage unterschiedlicher wirtschaftlicher Regime, dauerhafte Haushalts-/Endkundennachfrage, Erneuerung von Schiffsvermögen, Insolvenzfolgen, kompletter Gewinn nach Verschleiß, rechtmäßig wiederkehrender dritter Modulabsatz. Kein Merge, keine Pages-/NAS-Veröffentlichung, keine reale iPad-Safari-Abnahme.
