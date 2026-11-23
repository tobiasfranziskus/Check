# PIR-4a – Leichter Jäger: finanzierte Produktionskosten [OPTION / FORSCHUNG]
23.11.2026, main `679ba6c1fdb05435164e29b2e21514ddaa676279`. Nutzerfrage: plausibel günstiger als Miner 600 und Frachter 750. Keine Preis-, Rezept-, Kampf-, Save- oder Produktänderung. #604/Codex getrennt; #605 Konzept und #606 Nachschubbefund.

## Originalkosten statt Basispreis
K7: 50 Erz x 10 ISK = 500, plus 240 ISK Frachtentgelt (120 Pilotenlohn darin auf Speditionsseite, nicht erneut addieren) = 740 am Nadir-Käufer. W4: 5 Chargen zu 20 ISK Lohn, je 5 Material, zusammen 25 Material für 840 ISK (=33,6 je Einheit, kalkulatorisch). J2b: 24 ISK je Silizium, 8 je Charge. J3: 2 Material + 1 Silizium + 8 Lohn je Teil. J4: 8 Teile + 4 Material + 32 Lohn. Basispreis Material 20 ist kein tatsächlicher W3/W4-Kalkulationspreis. W5 verkauft Material für 100 je Einheit an externe Werft; dieser alternative Absatz ist begrenzt und nicht garantiert, daher separat als Opportunitätskostenrisiko betrachten, nicht als interne J4-Zahlung erfinden.

## Stückrechnung, keine neue Weltsimulation
| Variante | Teile | zusätzliches Material | Gesamtmaterial | Silizium | direkte J3/J4-Löhne | Kosten | Preis | Differenz vor Gemeinkosten |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Original | 8 | 4 | 20 | 8 | 96 | 960 | 900 | -60 |
| Halbes Rezept | 4 | 2 | 10 | 4 | 48 | 480 | 450 | -30 |
| Halbes Rezept | 4 | 2 | 10 | 4 | 48 | 480 | 500 | +20 |
| Halbes Rezept | 4 | 2 | 10 | 4 | 48 | 480 | 550 | +70 |
| Kompakt | 3 | 2 | 8 | 3 | 40 | 380,8 | 450 | +69,2 |
| Schwerer Typ, Option | 8 | 4 | 20 | 8 | 96 | 960 | 1050 | +90 |

Keine Preisfreigabe. Kosten gelten bei vollständig genutzter, normal bezahlter 50-Erz-Fracht und W4-Verarbeitung, ohne weitere Kosten/Wertverzehr/Nachfrage-/Bindungseffekte. Kein Nachweis tatsächlich kostendeckenden Absatzes aus Altlager oder künftig. Historische 900-ISK-Verkäufe sind reale Zahlungen, aber nicht der Nachweis eines positiven Stückdeckungsbeitrags auf neu zu beschaffende Inputs. Keine Umwertung von Bestand oder alten Käufen.

Chargen sind ganzzahlig: bei 2 Kompaktjägern 1 Erzcharge (840), 1 Siliziumcharge (192), 80 Lohn =1112 ISK Liquidität bei 900 ISK Erlös und 9 Material, 2 Silizium Restbestand. Bei 8 Kompaktjägern 3 Erzladungen (2520), 3 Siliziumchargen (576), 320 Lohn =3416 ISK, 3600 Erlös und 11 Material Rest. Die 8er-Variante braucht mindestens 24 Silizium; das heutige 16er-Regel204-Feld liefert maximal 5 kompakte Jäger bei vollständiger Nutzung, nicht 8. Keine fiktive Restlagerveräußerung.

## Empfehlung
- 450 ISK für einen wirklich kleineren Patrouillenjäger (3 Bauteile, 2 zusätzliches Material, 16 Werftminuten) oder 550 ISK für das halbe Rezept. Beide unter Miner/Frachter. Schwächere Ausstattung, geringere Kampfkraft/Rolle und Reichweite nur nach PIR-3-Abnahme separat kalibrieren; nicht bestehende J4c-Flugwerte still übernehmen.
- Bisherigen J4c unverändert lassen. 1050 nur möglicher schwerer Jäger im späteren Regelprofil, nicht neuer Preis alter Hüllen.
- Erst genehmigtes isoliertes Wirtschaftsprofil mit eigenem Hüllen-/Lager-/Kaufbeleg, echter K7/J2b/J3/J4-Buchung, endlichen Rohstoffen und autorisierten Käufern. Keine zusätzliche dauerhafte Parallelwirtschaft. Vergleich 450/550 mit originalem Seed42 30/90 Tage und Referenzprofil aus, anschließend 13×90/365/730. Nachfrage, gebundenes Kapital, tatsächliche Produktion, Insolvenz, Kosten-/Schadensmodell, Save/Load und fehlende Gratisbestände prüfen. Codespezifikation mit Codex nach PIR-3 koordinieren.

## #606 tatsächlich geprüfte Basis
Gezielter [Node22-Lauf 45265034852](https://github.com/tobiasfranziskus/Check/actions/runs/45265034852) 2/2 bestanden: 204 Tag30 2 gebaut/2 gekauft, Feld0, Hash 79512fd29238b040; 207 3 gebaut/2 gekauft, Feld8, Hash 20c13481d390e7f1. Je 33.000 ISK, Mint/Burn0. Zahlungsfähige NPC3/transport wurden trotz Hülle abgelehnt. Neue Kosten-Tests und eigenes CI hier; keine Behauptung einer simulierten neuen Produktionsregel. P0-Roadmapabgleich getrennt.
