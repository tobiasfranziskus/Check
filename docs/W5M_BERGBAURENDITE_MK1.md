# W5m – Bergbaurendite durch bezahlte MK1-Umrüstung

**Status: [DRAFT/ANALYSE], 05.11.2026 – [PR #192](https://github.com/tobiasfranziskus/Check/pull/192) auf W5l #191.** Weiterhin nur Forschungsregel 28/Schema 8. Produktives `main` bleibt unberührt.

## Fragestellung

Kann ein Miner durch eine reale, selbst finanzierte Investition schneller und nach tatsächlichen Erzverkäufen profitabler werden als ein unverändert ausgestatteter Miner? Ein Geldzufluss aus bloßer Förderung ohne Käufer wäre eine Scheinrendite. Konkurrenz um begrenzte Käuferkassen muss bestehen bleiben.

## Bestehende Einheitspreise

| Rechengröße | W5l-Basis | W5m-MK1 |
| --- | ---: | ---: |
| Fördermenge | 1 Erz/Minute | 2 Erz/Minute |
| Arbeitskosten | 2 ISK/Erz | 2 ISK/Erz |
| Erlös bei echtem Verkauf | 10 ISK/Erz | 10 ISK/Erz |
| Deckungsbeitrag je **verkauftem** Erz | 8 ISK | 8 ISK |
| Fertige Minerhülle | 600 ISK | 600 ISK |
| Zusätzliche einmalige Umrüstung | – | 10 eigenes Erz + 60 ISK |

Ein Basisminer amortisiert **600 / 8 = 75 tatsächlich verkaufte Erz** (ohne weitere Kosten). Das R28-MK1 benötigt zusätzlich 10 selbst geförderte Erz, die dadurch nicht mehr verkauft werden können. Bei Ansatz des aktuellen potenziellen Verkaufspreises von 10 ISK sind das 100 ISK Opportunitätskosten zuzüglich 60 ISK bezahlter Arbeitskosten. Bei einem zusätzlichen verkauften Erz je Minute und 8 ISK Deckungsbeitrag liegt eine **rechnerische** MK1-Amortisation bei 20 solchen zusätzlichen Einheiten bzw. 20 aktiven Förderminuten; tatsächlich hängt sie von Verkäufen, verfügbaren Aufträgen und Frachtraum ab.

## Kernregel und Besitzschutz

- `shipUpgradeMiner` gilt ausschließlich für eigene Miner in Aldera im ungemergten Regel-28-Forschungsstand.
- Erfordert **10 im eigenen Miner geladenes, nicht durch Erz-Treuhand gebundenes Erz** und **60 frei verfügbare ISK** für Werftarbeit.
- Erz wird aus genau dieser Schiffsladung und dem Waren-Ledger als Verbrauch ausgebucht; 60 ISK werden vom Schiffseigentümer an den bestehenden Aldera-Fonds überwiesen und in dessen Kostenbuch erfasst.
- Das Schiff trägt anschließend einen **direkt montierten Bohrkopf**. R28 behandelt ihn als gebundene Umrüstung, noch nicht als separat handelbare MK1-Modulware. Das wird erst mit einer gesondert finanzierten, geprüften Modulproduktion möglich.
- Verdopplung der Menge pro Minute, nicht der Zahl künstlicher Mining-Aufträge. Der Core rechnet die vollen Arbeitskosten pro geförderter Einheit auch beim Eigenabbau ohne Käufer und bei vorfinanzierten 50er-Verträgen ab.
- Keine zusätzliche ISK-Quelle, keine Preis-/Kassenmanipulation, keine garantierte Nachfrage. Bei vollem Frachtraum oder fehlendem Betriebskapital ruht der Miner. Einzelne Konzerne können weiterhin scheitern.

## Rentabilitätsbericht

`pilotW5MStand(state)` liest je Eigentümer und je Miner **tatsächlich gefördertes Erz, echte Warenverkäufe, bezahlte Förderlöhne, Hüllenkauf und zusätzliche MK1-Arbeit**. Der konservative Vollkosten-Saldo belastet zusätzlich den potenziellen Verkaufspreis der beim Umbau verbrauchten 10 Erz. Nicht verkauftes Erz erzeugt weder Umsatz noch fiktive Gewinne.

`m_core_w5m.audit` vergleicht die gezählten Fördermengen mit dem ursprünglichen Ledger, die abgerechneten Verkäufe mit 10 ISK je Erz, Löhne mit 2 ISK je gefördertem Erz, tatsächliche Einbauten mit Schiffsausrüstungen und bezahltem Material-/Arbeitsaufwand. Zusätzlich gelten alte globale Geld-/Waren- und Vertragsprüfungen.

## Qualitäts-Gates

- Alte Regel26/Regel27-Stände inklusive goldenem Hash und separater Save-Version bleiben unverändert.
- Abgelehnte fremde, doppelte, zu teure und auf nicht vorhandenes Erz gestützte Umrüstungen verändern keine Spielbuchung.
- Bezahlt vorhandene Folge-Kaufkraft über den ursprünglichen W5h/W3-Kreislauf und ein real bezahlter zweiter Erzabsatz müssen gegenüber einer unverbesserten Mine verglichen werden.
- 13 feste Seeds ×90 Spieltage: Geld-/Warenaudits, feste Hashes, Save/Load und kein ungebuchtes `minted`/ `burned`.
- GitHub CI-Ergebnis und konkrete Nettowerte werden erst nach tatsächlich ausgeführter Prüfung nachgetragen.

**Nicht bewiesen:** dauerhaft liquide Käufer, profitable Werft und ein stabiler Gesamtkreislauf ohne zusätzliche Nachfrage. Das ist weiter ein eigener Wirtschaftsauftrag. Keine Merge-/Deployment-Freigabe, echte Safari-/NAS-Abnahme offen.
