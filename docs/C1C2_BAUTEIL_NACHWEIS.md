# C1c-2 – erste vollständig vorfinanzierte Bauteilcharge

**[DRAFT / FORSCHUNG · 08.11.2026]** Forschungsnachfolger von [C1c-1 / PR #250](https://github.com/tobiasfranziskus/Check/pull/250) auf #249/#247/#246. **Kein** vollständiger Modell-C-Nachweis oder freigegebenes Wirtschaftssystem. Produktive `index.html`, Saves, Roadmap, `main` und GitHub Pages unverändert.

## Abgeschlossener Nachweis

Die vorhandene W3-/W4-Erzfracht-/Raffineriekette aus #249 und der unveränderte Core-W5b-Prozess erzeugen erstmalig **ein echtes Bauteil aus 2 bezahlt erzeugten Material und 1 bezahlt geförderten Silizium**.

| Vorgang | Reale Herkunft und gebuchte Zahlung |
| --- | --- |
| Erz und 4 Material | Bestehender, bezahlter Erzabbau plus W3-Hin- und Rückflug, W4-Los `10 Erz → 4 Material`; Materialbestand in Nadir wird aus 0 erzeugt |
| Silizium | House kauft einen vorhandenen Nadir-Miner zu 600 ISK. Original-W5b-Abnahme reserviert 24 ISK; Silizium-Bergbauarbeit reserviert und zahlt **10 ISK**, Ergebnis 1 Einheit aus echtem eigenen Miner |
| Bauteilauftrag | House besitzt ausreichend freie ISK und erwirbt im bestehenden Core **2 Material × 48 + 1 Silizium × 24 = 120 ISK** an Nadir-Waren. Vor Beginn werden weitere **8 ISK für acht Fertigungsminuten** reserviert |
| Fertigung | Vor der 8. bezahlten Minute **0 Bauteile**; erst danach `1 Bauteil` im Nadir-Lager, 2 Material und 1 Silizium nachweislich verbraucht; 8 ISK auf dem bestehenden Arbeiterkonto |
| Export | **0**: kein Vertrag, keine Meridian-Lieferung, keine Abnahme, keine Minting-/Rettungsregel |

**Wichtig:** Die **C-Silizium-Fördercadence ist noch nicht implementiert.** Der vorhandene W5b-Core erzeugt die Siliziumeinheit nach **einem** Simulationsminutentick mit 10 ISK Gesamtlabor; Modell C verlangt dagegen **zehn einzeln bezahlte Minuten pro Siliziumeinheit**. Die Gesamtkosten sind hier angesetzt, aber **nicht** der zeitliche Arbeitsablauf bewiesen. Ein künftiger C-Förderregelnachfolger muss das im gemeinsamen Core nachweisen, nicht mit einer zweiten Node-Förderengine simulieren.

## Forschungstechnik

- Neue, isolierte Node-Forschungsregel `aphros-research:C1c-2:paid-component-v1`, Version **3304**, abgeleitet von C1c-1; C1b-1, C1b-2 und C1c-1 behalten getrennte Profile, Hashes und Saves.
- W5b erhält das echte Einzelbauteil-Rezept der Modell-C-Vorlage (`2 Material + 1 Silizium → 1 Bauteil`, acht bezahlte Arbeitsminuten). Nur die vorhandenen validierten Befehle `shipBuy`, `shipMine`, `shipFreight`, `stationRefine` und `stationBuildParts` werden ausgeführt. Keine neue Lohn-, Frachten- oder Produktions-Engine.
- Zusatz-Audit rekonstruiert Herkunft, Warenbestand, verbuchte Löhne, Fabriktreuhand, Produktionslos, Material-/Siliziumverbrauch und Bauteil-Gesamtbestand **unabhängig von** den Original-W5b-/W4-/W3-Core-Audits. Null-Mint und 33.000 Welt-ISK bleiben Invarianten.
- Forschung registriert nur die bewussten C-Preis-/Losparameter. Der Original-Minuten-Tick, Gesamtaudit und Serializer bleiben maßgeblich. Die vorhandenen W5s-q/r-Lohnrückflüsse aus C1c-1 bleiben aktiv; die W5b-Fabrikarbeiter-ISK liegen noch auf ihrem eigenen persönlichen Konto, nicht auf der privaten Wasserhaushalts-Sammelkasse.
- Zwei Seeds 42/7 werden bis zum fertig erzeugten Bauteil mit unabhängigen Minuten-Audits, gezielten Negativtests, vollständigem deterministischem Replay und Save/Load an Zwischenpunkten ausgeführt. Keine Gratisware aus Startlagern.

## Prüfergebnisse

Gezielter GitHub-Lauf [#42470696031](https://github.com/tobiasfranziskus/Check/actions/runs/42470696031) hat **5/5 neue C1c-2 Tests** sowie 8/8 C1b-1, 6/6 C1b-2 und 5/5 C1c-1 bestanden: insgesamt **24/24 gezielte Einzeltests** ohne Fehler. Messwerte der ausgeführten C1c-2-Läufe:

| Testfall | Fertigtick | Hash | Material fertig | Silizium abgebaut | Bauteile fertig | Mint |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| Seed 42 | 189 | `ca54e7eeaa58fbf1` | 4 | 1 | 1 | 0 |
| Seed 7 | 189 | `082ce6e44efdd1cf` | 4 | 1 | 1 | 0 |

Original-C1c-1-Vergleich weiterhin **120 + 10 ISK** aus bezahlter W3-/W4-Arbeit beim privaten Wasserkunden; keine Behauptung zusätzlicher Verkäufe. Die allgemeine CI-Regression [#42470695936](https://github.com/tobiasfranziskus/Check/actions/runs/42470695936) ist separat zu beurteilen. Ein laufender, übersprungener oder abgebrochener Gesamtlauf wird nicht als bestanden gewertet.

## Grenzen und nächste Integrationsschritte

**Offen:** exakte zeitbezogene Silizium-Cadence, echte C-Erz-Fördergeschwindigkeit; fortlaufende reproduzierbare Gewinn-/Vollkostenrechnung einschließlich Wartung, Lager- und Arbeitszeit; tatsächlich zahlender Folgeabnehmer; Lagermodul `2 Bauteile → 1 Lager` mit bezahlten zwölf Minuten; finanziertes Meridian-Transport-/Abnahme-/Etatrechtebuch; begrenzte Emission erst nach einmaliger Lieferung; Bruchteilsrepräsentation und verifizierte C-Save-/Produktintegration. **Keine 30-/90-Tage-Gesamtwirtschaftstests von C1c-2**, nur der 189-Minuten-Bauteil-Machbarkeitsnachweis.

**Empfehlung C1c-3:** Die vorhandene Förderregel im gemeinsamen Core mit zehn finanzierten Arbeitsminuten pro Siliziumeinheit korrekt parametrisierbar machen und ihre vollständigen Save-/Auditpfade prüfen. Anschließend ein vollständig bezahltes Lagermodul und erst dann die Meridian-Abnahme herstellen. Nicht erneut auf ungesicherte Importwaren oder fiktive Auszahlungen zurückgreifen.

**Kein Merge und kein Deployment.**
