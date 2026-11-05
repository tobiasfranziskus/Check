# W5m – Bergbaurendite durch bezahlte MK1-Umrüstung

**Status: [DRAFT/ANALYSE], 05.11.2026 – [PR #192](https://github.com/tobiasfranziskus/Check/pull/192) auf W5l #191.** Weiterhin nur Forschungsregel 28/Schema 8. Produktives `main` bleibt unberührt.

## Fragestellung

Kann ein Miner durch eine reale, selbst finanzierte Investition schneller und nach tatsächlichen Erzverkäufen profitabler werden als ein unverändert ausgestatteter Miner? Ein Geldzufluss aus bloßer Förderung ohne Käufer wäre eine Scheinrendite. Konkurrenz um begrenzte Käuferkassen muss bestehen bleiben.

## Bestehende Einheitspreise

| Rechengröße | W5l-Basis | W5m-MK1 |
| --- | ---: | ---: |
| Fördermenge | 1 Erz/Minute | 2 Erz/Minute |
| Kosten je tatsächlich geleisteter Förderminute | 2 ISK | 2 ISK |
| Förderkosten pro Erz bei voller Auslastung | 2 ISK | 1 ISK |
| Erlös bei echtem Verkauf | 10 ISK/Erz | 10 ISK/Erz |
| Rechnerischer Deckungsbeitrag bei kontinuierlichem Verkauf | 8 ISK/Erz | 9 ISK/Erz |
| Fertige Minerhülle | 600 ISK | 600 ISK |
| Zusätzliche einmalige Umrüstung | – | 10 eigenes Erz + 60 ISK |

Ein Basisminer amortisiert **600 / 8 = 75 tatsächlich verkaufte Erz** (ohne weitere Kosten). Das R28-MK1 benötigt zusätzlich 10 selbst geförderte Erz, die dadurch nicht mehr verkauft werden können. Bei Ansatz des aktuellen potenziellen Verkaufspreises von 10 ISK sind das 100 ISK Opportunitätskosten zuzüglich 60 ISK bezahlter Arbeitskosten. Die 160 ISK zusätzlichen kalkulatorischen Investitionskosten amortisieren sich in einem idealisierten gleichmäßigen Verkauf bei 1 ISK Lohnersparnis je erzielter Einheit nach etwa **160 zusätzlichen tatsächlich verkauften Erz** (ohne unbezahlte Lagerproduktion). Die reale Amortisationsdauer hängt von Käufern, Aufträgen, Frachtraum und Absatzverteilung ab.

## Kernregel und Besitzschutz

- `shipUpgradeMiner` gilt ausschließlich für eigene Miner in Aldera im ungemergten Regel-28-Forschungsstand.
- Erfordert **10 im eigenen Miner geladenes, nicht durch Erz-Treuhand gebundenes Erz** und **60 frei verfügbare ISK** für Werftarbeit.
- Erz wird aus genau dieser Schiffsladung und dem Waren-Ledger als Verbrauch ausgebucht; 60 ISK werden vom Schiffseigentümer an den bestehenden Aldera-Fonds überwiesen und in dessen Kostenbuch erfasst.
- Das Schiff trägt anschließend einen **direkt montierten Bohrkopf**. R28 behandelt ihn als gebundene Umrüstung, noch nicht als separat handelbare MK1-Modulware. Das wird erst mit einer gesondert finanzierten, geprüften Modulproduktion möglich.
- Verdopplung der Menge pro Minute, nicht der Zahl künstlicher Mining-Aufträge. Der Core rechnet **2 ISK je tatsächlich gearbeiteter Minute** ab. Basis: 1 Erz/Minute für 2 ISK, MK1: 2 Erz/Minute für dieselben 2 ISK. Das gilt sowohl für Eigenabbau als auch für vorfinanzierte 50er-Verträge. Es wird nur die benötigte Zahl von Arbeitsminuten vorfinanziert, aufgerundet auf ganze Minuten.
- Keine zusätzliche ISK-Quelle, keine Preis-/Kassenmanipulation, keine garantierte Nachfrage. Bei vollem Frachtraum oder fehlendem Betriebskapital ruht der Miner. Einzelne Konzerne können weiterhin scheitern.

## Rentabilitätsbericht

`pilotW5MStand(state)` liest je Eigentümer und je Miner **tatsächlich gefördertes Erz, echte Warenverkäufe, bezahlte Förderlöhne, Hüllenkauf und zusätzliche MK1-Arbeit**. Der konservative Vollkosten-Saldo belastet zusätzlich den potenziellen Verkaufspreis der beim Umbau verbrauchten 10 Erz. Nicht verkauftes Erz erzeugt weder Umsatz noch fiktive Gewinne.

`m_core_w5m.audit` vergleicht die gezählten Fördermengen mit dem ursprünglichen Ledger, die abgerechneten Verkäufe mit 10 ISK je Erz, Löhne mit 2 ISK je tatsächlich geleisteter Förderminute, tatsächliche Einbauten mit Schiffsausrüstungen und bezahltem Material-/Arbeitsaufwand. Zusätzlich gelten alte globale Geld-/Waren- und Vertragsprüfungen.

## Qualitäts-Gates

- Alte Regel26/Regel27-Stände inklusive goldenem Hash und separater Save-Version bleiben unverändert.
- Abgelehnte fremde, doppelte, zu teure und auf nicht vorhandenes Erz gestützte Umrüstungen verändern keine Spielbuchung.
- Drei identische tatsächlich finanzierte W3-Frachtrunden als Vergleich gegen denselben Basismine-Seed (mit einem konkurrierenden House-Miner); kein simuliertes Buyer-Refill ohne Kauf.
- 13 feste Seeds ×90 Spieltage: Geld-/Warenaudits, feste Hashes, Save/Load und kein ungebuchtes `minted`/ `burned`.
- Direkte Core-Ausführung Seed42 nach drei echten, voll finanzierten W3-Frachtrunden und 420 Spielminuten: Basismine NPC3 225 Erz verkauft, 596 ISK Förderlöhne, **1.054 ISK** Vollkostensaldo; MK1 NPC3 ebenfalls 225 Erz verkauft, **396 ISK** Förderlöhne, **1.094 ISK** Vollkostensaldo einschließlich MK1-Arbeit und verbautem Erz; Differenz **+40 ISK**. Jeweils Cash-/Warenaudit erfolgreich, `minted=0`. Das ist ein **begrenzter, reproduzierbarer Einzeltest**, keine permanente Absatzgarantie. CI-Ergebnis wird nach erfolgreicher Ausführung ergänzt.

## Nachvollziehbare Direktprüfungen (05.11.2026)

Der aktuelle R28-Core wurde unmittelbar mit derselben aus `index.html` extrahierten Funktion ausgeführt. Die **sechs neuen W5m-Kerntests** wurden unverändert in einer JavaScript-Testhülle mit Gleichheits-/Ablehnungs-Prüfungen durchlaufen: **6/6 erfolgreich**. Das ist kein Ersatz für den vorgeschriebenen Node-22-Gesamtlauf in GitHub-CI.

Für die **13 festen Seeds** 7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159 wurden nach bezahltem House-Miner-Kauf, echtem 60-Minuten-Bergbau und regulärem MK1-Upgrade je **90 Tage** mit täglichen Core-Geld-/Warenaudits simuliert. Alle 13 abgeschlossen, keine negativen Kassen oder Güterbilanzfehler, je 33.000 ISK Gesamtgeld und `minted=0`. Save/Load-Hashes an Tag30 und Tag90 stimmen überein. Seed42-Tag90-Hash `3ff612ed3550ebf6`, Seed7 `4b1410e2529c9cd7`. In dieser endlichen Vergleichswelt endet die aktuelle Nachfrage, danach liegen überwiegend unverkaufte Rohwaren; **kein dauerhaftes Mining-Einkommensversprechen**.

Bei drei wirklich finanzierten W3-Hin-/Rückfahrten mit identisch zwei konkurrierenden Minern auf Seed42 (420 Minuten) liegt der Vollkostensaldo des Basismine-Besitzers NPC3 bei **1.054 ISK** und mit MK1 bei **1.094 ISK**. Der Vergleichs-MK1-Hash lautet `7b307f24a27ea886`. Beide erzielen **genau 225 Erzverkäufe**; Mehrgewinn kommt nur aus tatsächlich geringerer bezahlter Arbeitszeit.

**Nicht bewiesen:** dauerhaft liquide Käufer, profitable Werft und ein stabiler Gesamtkreislauf ohne zusätzliche Nachfrage. Das ist weiter ein eigener Wirtschaftsauftrag. Keine Merge-/Deployment-Freigabe, echte Safari-/NAS-Abnahme offen.
