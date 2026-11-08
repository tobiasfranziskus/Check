# C1d-4 – Vierer-Lagermodulfracht mit echtem, endlichem Käufer-Vorauftrag

**[DRAFT / FORSCHUNG · 08.11.2026]** Gestapelt auf [C1d-3 / #256](https://github.com/tobiasfranziskus/Check/pull/256). Diese Studie prüft **keine neue Geldschöpfung**, sondern einen verbindlichen Vertrag eines bereits im alten W1-Core vorhandenen, mit Start-ISK ausgestatteten Käufers. Keine Änderung von produktivem `main`, Regel14, Pages, Saves oder iPad-Safari-Freigaben.

## Geschäftsvorfall, ohne Gratisgeld

- Käufer **`export`** verwendet **1.720 ISK bestehender, endlicher Kasse** für vier mit genau 430 ISK bewertete Lagermodule. Er ist ein im Basis-Core bereits vorhandener Käufer, **kein** neuer Mittelschöpfungs-Fonds.
- Der Käufer erteilt den einen zulässigen Auftrag **erst nach** drei tatsächlich gefertigten Lagermodulen und vier tatsächlich bezahlten Bauteillosen. Er zahlt exakt **340 ISK** vorab an den Hersteller `house`; **1.380 ISK** werden gleichzeitig aus seinem eigenen Guthaben in eine eindeutige Kaufrest-Treuhand gesperrt.
- Dieser auf Warenübergabe verpflichtende Vorschuss ermöglicht, aus 312 vorhandenen Hersteller-ISK sowohl die **vierte Endmontage (352 ISK)** als auch die **einmalige gemeinsame Fracht (300 ISK)** zu finanzieren: **312 + 340 − 352 − 300 = 0 ISK** verbleibende Herstellerkasse unmittelbar nach Frachtbestellung. Eine fünfte Charge wird in diesem Test nicht ermöglicht.
- Das vierte Lagermodul benötigt wieder zwei wirklich produzierte Bauteile und **12 bezahlte Endmontageminuten**. Der vorhandene Frachter `sh002` befördert vier reale Module über Aldera → Nadir → Meridian → Aldera. Für die Fahrt: **300 ISK Speditionshonorar** plus **240 aus bestehendem Speditionskapital vorfinanzierte Pilotenminuten**; Rückflug vor Abnahmeauszahlung.
- Der Käufer kann den **1.380-ISK-Kaufrest nur nach physischem Eingang aller vier Module und abgeschlossenem bezahlten Rückflug** auszahlen lassen. Der ursprüngliche Lagerbestand wird dann exakt um vier reduziert und als **vier reale Exporte** verbucht. Gesamtzahlung 1.720 ISK; neuer Geldbestand **0 ISK**; keine Parallelabnahme von C1d-2.

Das ist ein **vorfinanzierter privater Endkauf**, keine Modell-C-Emission. Der Verkäufer hält die Ware bis zur Abnahme in seiner Herkunftskette, der Käufer hält die vertraglichen Abnahmerechte und den für die Erfüllung gesperrten Kaufrest. Forschungstarife, Käuferverpflichtung und konkretes Geschäftsmodell bleiben **[OPTION]**.

## Profile und technische Trennung

- Nur das eigene Forschungsprofil `aphros-research:C1d-4:four-paid-storage-preorder-v1` / **Regel 3309** verwendet die neue Core-Funktion und ihre registrierten, eingefrorenen Regeln. Die separaten Profile 3307 (einmalige Emissionsabnahme) und 3308 (drei ohne externe Abnahme) bleiben erreichbar und unverändert in ihrer Funktion.
- Der einzige vorhandene Spiel-Core in `index.html` verarbeitet die beiden neuen Opt-in-Befehle `stationPrepayStorage` und `stationAcceptStorage`. Kein neuer Browser- oder Python-Simulator; Node22 lädt die private Forschungs-Core-Instanz aus demselben Code, mit dokumentiertem SHA-256-Schutz.
- Globale Geld-/Waren-/Treuhandprüfung, W3/W4/W5b/C1d-Belege, unabhängiger Käuferbudget-/Vorschuss-/Restkauf-Audit, Zustandsserialisierung, Profile-Fingerprints, reproduzierbare Seeds und manipulierte Belege werden kontrolliert. Ein negativer Finanzierungsversuch darf weder Ware noch Kasse verändern.
- **Kein unbegrenzter Nachschuss:** Die Vorbestellung zieht die vollen 1.720 ISK aus dem existierenden Käuferkonto ab; bei leerer Kasse kommt kein weiterer Vertrag zustande. Ein unvollendeter Vertrag bindet den Kaufrest, bis eine **separat zu entwerfende** rechtssichere Rückabwicklung existiert. Diese Studie behauptet keine betriebssichere Insolvenzbehandlung.

## Kalkulation – bewusst keine Profitbehauptung

| Größe | Vier Module |
| --- | ---: |
| Käufer zahlt aus vorhandenem Geld | 4 × 430 = **1.720 ISK** |
| Eingepreiste Bauteile | 4 × 340 = **1.360 ISK** |
| Vier Endmontagen | 4 × 12 = **48 ISK** |
| Einmalige Vollrundfracht (Speditionshonorar) | **300 ISK** |
| **Nur nach diesen drei Kostenblöcken** | **+12 ISK** |

Diese 12 ISK sind **kein Nettogewinn**: Erz-/Siliziumherkunft, Raffinerie, Minerbeschaffung, Vorleistungen, Wartung, Werft-/Frachterabschreibung, freie Lohnzuflüsse, Stationskonten sowie der eigentliche einmalige Endkunde bleiben im Gesamtabschluss zu prüfen. Die 240 ISK Pilotenlöhne sind bereits reale Speditionsausgabe; eine Verrechnung nur auf Produzentenebene darf nicht fälschlich Gewinn der Gesamtwirtschaft ausweisen.

## Prüfgates

- Gezielter Test: `node --test tests/c1d-4-finanzierter-vierervertrag.test.mjs`; sechs Szenarien mit Seeds 42 und 7, Save/Load, Replay, Negativberechtigungen und Fälschungsabwehr.
- Zusätzlich Original-C1b/C1c/C1d-Forschungsworkflow und komplette Node22-Regression. **Zum Zeitpunkt der Erstellung sind keine neuen CI-Erfolge behauptet; die PR-Checks entscheiden über den tatsächlichen Teststand.**
- Ausdrücklich offen: Endlicher privater Käufer ist **keine nachhaltige dauerhafte Endnachfrage**, die vorgeschlagenen C-Tempo-4-Minuten je Erz fehlen weiterhin, C1d-2-Etat-/Bruchteils-/Rollover-Regeln gelten nicht im Profil 3309. Die stärkere C-Gesamtwirtschaft und jede Geldemissionsregel brauchen eine gesonderte Modellprüfung und Produktfreigabe.

**Nächster vertretbarer Schritt:** Die tatsächlichen Prüfergebnisse auswerten; dann **eine** abgeschlossene Vertrags-/Kosten-/Eigentumsrechnung über alle vier Lagermodule und die restlichen Erz-/Frachtvorleistungen erheben, statt die bloßen +12 ISK als funktionierende Kreislaufwirtschaft zu verkaufen. Kein Merge/Deployment.
