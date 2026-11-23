# PIR-4a – Reale Vergleichsproduktion leichter Jäger [FORSCHUNG / OPTION]
23.11.2026 · Basis main `679ba6c1fdb05435164e29b2e21514ddaa676279`. #606 Nachschubtests 2/2 und #607 Kostenmodell erfolgreich. Keine neue Spielregel, keine Migration. #604 Kampfentwicklung bleibt getrennt.

## Methodik und Grenzen
Sieben Original-JavaScript-Module über GitHub auf dem festgelegten SHA geladen und in getrennten CommonJS-Laufzeitkopien in V8 tatsächlich ausgeführt. Je Variante genau zwei Originaldefinitionen im Arbeitsspeicher geändert: r_jaeger (Bauteile, direktes Material, Dauer) und Warenbasispreis jaeger. Originalkauf, W6-Politik, W3/W4/J2b/J3/J4, Finanzierung, RNG, Audits und Flugkern unverändert. Kein Quellfile geändert, keine neuen Startbestände. Direkte ErstellungJ4c, Seed42, 3.000 Haus-/33.000 Welt-ISK, S02-Politik, NPC- und Siliziumopt-in. Anders als #606 (Migration aus 195) direkte Erstellung; neue Originalreferenz separat. Beide Nachfragelimits höchstens 2 bzw. 5 vom Testskript ausdrücklich bezahlte Hauskäufe, keine autonomen Käufer erzeugt. Alle Käufe auf realem Lagerbestand und freier Werft; Käufe alle 120 Minuten geprüft. Geld-/Waren-/Core- und Save/Load-Audit an Tag10/20/30 erfolgreich. Forschungs-Saves tragen intern noch die originale Regelnummer; nur in derselben Laufzeitkopie prüfen, niemals exportieren, in Produkt laden oder als neues Profil ausgeben. Produkt würde eine eigene autorisierte Regel-/Klassen-/Save-Identität benötigen. Keine Aussage über Kampfausgleich, nachhaltigen Nachschub oder Nettogewinn.

## Tatsächlich gemessene V8-Ergebnisse
| Nachfragegrenze | Variante | Erste Kaufminute | gebaut/verkauft Tag30 | Lager | Restteile | Haus-ISK | Hash Tag30 |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 2 | Original 900 | 13320 | 2/2 | 0 | 0 | 1200 | 4f58ab5f2be8023f |
| 2 | Kompakt 450 | 7920 | 3/2 | 1 | 7 | 2100 | ccdf1f6fa58db9aa |
| 2 | Halb 550 | 8040 | 3/2 | 1 | 4 | 1900 | 6df13b010e1f2a2f |
| 5 | Original 900 | 13320 | 2/2 | 0 | 0 | 1200 | 4f58ab5f2be8023f |
| 5 | Kompakt 450 | 7920 | 5/5 | 0 | 1 | 750 | 3ad8f6dd82d6b64a |
| 5 | Halb 550 | 8040 | 4/4 | 0 | 0 | 800 | 0e9967ed381fccb3 |

Initialhash in allen Welten b9e942aafa1d4c05 (Regelparameter selbst nicht Bestandteil dieses Hashes). Weltgeld stets 33.000, Mint/Burn 0, Siliziumfeld ab Tag10 leer. Bei Nachfragegrenze5 kompaktes Modell fünf echte Käufe bis Tick12840 (8,9167 Tage), halb vier bis Tick12720 (8,8333 Tage). Bei Grenze2 produziert NPC nur bis zu einem freien Lagerjäger und akkumuliert Teile; keine künstliche Nachfrage. Alle Welten 8 W3-Erzlieferungen bis Tag30. Restmaterial der Nachfragegrenze5 kompakt 3, halb und original 0. Die fünf Käufe belegen nicht, dass der Spieler diese Hüllen wirtschaftlich braucht. Der Startbestand an Silizium begrenzt weiterhin den Ersatz. Keine neuen Piloten-/NPC-Kaufrechte.

## Abnahmetest
Neuer Node22-Test mit identischem Laufzeitverfahren, exakten Messhashes, unabhängiger W6-Prüfung an Käufen/Checkpoints, echter Tag20->30-Fortsetzung im 60er Raster und unveränderter Originalkontrolle. Node22/CI und diese zusätzlichen Replay-Checks noch nicht ausgeführt bei PR-Erstellung. Vorhandene Originalquellen bleiben unverändert. Kein neues Produkt-Feature.

## Empfehlung
450-ISK-Kompaktvariante als führenden Kandidaten auswählen; 550 als Vergleich behalten. 900-ISK-Bestand unverändert. Erst echte neue Klassenidentität mit getrennter Regelversion und Eigentums-/Hüllenledger spezifizieren, dann 90/365/730, Szenarien und Nachfrage-/Kostenproben. Keine bloße Preisänderung im vorhandenen öffentlichen Save. PIR-3 muss Kampfwerte definieren; günstige leichte Hülle nicht automatisch gleich stark wie bisherige J4c-Hülle. Vor 4b/5d neue Käufer-/Pilotberechtigungen und Verlustabwicklung. Keine Paralleländerung am Codex-Code. P0 erhält Konzeptverweis, keine Überschreibung zentraler Roadmap.
