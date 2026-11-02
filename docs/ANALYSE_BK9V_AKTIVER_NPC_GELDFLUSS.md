# B-K9v – Aktivwirtschaft: Zahlungsströme, Transport und Flottenzuschuss

**[ANALYSE/DRAFT, 02.11.2026]** B-K9v liegt in [PR #113](https://github.com/tobiasfranziskus/Check/pull/113) auf #112 → #111 → #110 → #109 → #108. **[MAIN]** weiterhin b4e604d6, v0.12.5/Regel14/Schema8, nicht verändert. Die Testwirtschaft aktiviert ausdrücklich Regel15/Schema9 mit **nur analytisch verwendeten 4 ISK Fabriklohn/Minute** und bezahltem lokalen Neu-Nahrungsverbrauch. Keine Preis-/Rezept-/Lohnreform, keine neue Emission und keine geänderten Zuschussregeln.

## Untersuchungsdesign und Buchungsgrenzen

Der zustandsneutrale Test `tests/bk9v-aktiver-npc-zahlungsstrom.test.mjs` lässt die **originale vollständige NPC-Disposition**, alle Stationen, Startlager, Förderer, Frachter, Produktionslinien, Schiffe, vorhandene Fonds, bestehende Zuschüsse und den Original-Kampf aktiv. Anders als B-K9u werden die Händler nicht angehalten und das Startlager nicht auf null gesetzt. Für die Nachfrageregel bleibt nur die bereits bekannte R15-Testoption eingeschaltet. Um die beiden Fondsarten voneinander zu trennen, ist die allgemeine Stationsfondsauffüllung analytisch durch `mindeststand:0` und sehr hohe `fondsObergrenze` unterdrückt; **der individuelle Werftfonds-Flottenzuschuss bleibt aktiv**.

Der Test protokolliert im Test-Closure:
- Original-Core-Warenumsatz mit Käufer, Verkäufer, Warenart, Wert und **separater, genau einem Empfänger zugeordneten Gebühr**;
- echte vorfinanzierte Fabriklöhne, wirklich bezahlten Neu-Nahrungskonsum, abgegoltene Frachter-Flugstunden inklusive Verlustabrechnung und tatsächlich bezahlte sonstige Schiffsbetriebskosten;
- finanzierte Schiffsankäufe, NPC-Abgaben, Fonds-Transfers, Dividenden, bestehende Werftfonds-Zuschüsse, Piratenersatz und ursprüngliche Kopfgeldemissionen.

**Wichtige Rechnungsregel:** Für jeden überprüften Eigentümer wird `freie ISK + noch gebundene eigene Vertragsreserve` mit der aus Gegenkonten rekonstruierten historischen Zahlungsbilanz verglichen. Ein Vertragsbudget ist damit kein verlorenes Geld und darf bei Freigabe oder Endabrechnung nicht doppelt verbucht werden. Alle Buchungen werden vom Original-Core ausgelöst; der Test implementiert keine eigene Wirtschaft. Je Stunde Geld-/Waren-/Herkunfts- und Save/Load-Audit; 120 Minuten Original-Core-Hash- und Save-Neutralitätsvergleich, zusätzliches deterministisches Replay.

## Aktive Welt: Original-Core-Regel15-Kandidat, zwei Seeds × fünf Tage

| Kennzahl (kumulativ, sofern nicht anders bezeichnet) | Seed 42, Tag 5 | Seed 7, Tag 5 |
|---|---:|---:|
| Cyris freie Stationskasse | 23 ISK | 5 ISK |
| Cyris Haushalt freie Kasse | 39 ISK | 286 ISK |
| Neue Nahrung in Cyris bezahlt verbraucht | 111 | 57 |
| Echter bezahlter Neu-Nahrungsumsatz Cyris | 5.737 ISK | 3.094 ISK |
| Cyris kumulativ unbefriedigter Neu-Nahrungsbedarf | 197 | 251 |
| NPC1 frei | 38 ISK | 0 ISK |
| NPC2 frei | 490 ISK | 35 ISK |
| NPC3 frei | 6.000 ISK | 1.050 ISK |
| NPC-Händlerfrachter physisch vorhanden | 5 | 3 |
| Weltweite **bereits ausgezahlte** Flugstundenkosten (nicht nur Nahrungstransport) | 10.154 ISK | 12.204 ISK |
| Weltweite tatsächliche Frachterankäufe, Ereigniszahl | 2 | 3 |
| Weltweite tatsächliche Minerankäufe, Ereigniszahl | 2 | 7 |
| **Individueller historischer Flottenzuschuss aus Werftfonds** | **0 ISK** | **693 ISK** |
| `minted` aus Originalmodell | 1.440 ISK | 1.440 ISK |
| `burned` aus Originalmodell | 6.440 ISK | 6.440 ISK |

Die ursprünglichen 52 Nahrungseinheiten von Cyris werden im konservativen Herkunftsmodell **nicht** als entlohnt erzeugte Neuware umetikettiert und dürfen deshalb nicht mit den bezahlten Stückzahlen verwechselt werden. Die weltweiten Flugstundenzahlungen sind **keine Kosten ausschließlich der Nahrungskette**. Ebenso sind alle weltweiten Miner-/Frachterankäufe nicht automatisch Nahrungskosten. Ihre Akteurszuordnung muss in der anschließenden konsolidierten Kettenrechnung sachgerecht erfolgen.

**Engpass-Timing:** Seed42 erreicht am Tag 3 nur noch 23 ISK Stationsgeld und 53 fehlende Bedarfseinheiten am Tag; an Tag 5 fehlen kumulativ 197. Seed7 erreicht bereits Tag 2 nur 5 ISK, an Tag 3 werden 72 weitere Einheiten pro Tag nicht bedient; kumulativ bis Tag5 sind es 251. Das bedeutet keine auf Dauer finanzierte Versorgung trotz tatsächlicher Lieferungen, vorhandener Schiffe und ursprünglicher Startlager.

## Die 693-ISK-Finanzhilfe ist ein eigenständiger Regelblocker

Der bestehende Original-Core-Pfad `m_core_schiffbau.zuschuss` überweist bei fehlender Hülle und unzureichender Eigentümerkasse nur bei ausreichendem Werftfondsbestand die Differenz in eine NPC-Eigentümerkasse. In Seed7 treten nach Tag2 **693 ISK** des alten Mechanismus auf; er verändert die Konten real, aber **nicht** `minted`. Er ist deshalb weder echte marktwirtschaftlich verdiente Einnahme noch freie neue ISK. Der neue Test hält einen eigenen Gegenbuchungsbeleg und stimmt dessen kumulierten Betrag mit `state.stats.zuschuss` ab. **Der Test ändert, sperrt oder ersetzt diesen Mechanismus nicht.**

## Konsolidierungsgrenze

Eine buchhalterisch exakte Transferspur für NPC1/NPC2/NPC3/Cyris und den Cyris-Haushalt ist **noch keine vollständige individuelle Vollkostenmarge jeder aus Eis entstandenen und per Frachter angelieferten Nahrungseinheit**: Original-Lieferwaren haben noch keine globale transportübergreifende Chargenprovenienz; Anfangsvorräte sind historisch unbewertet; Frachter-Lohnzahlungen und Schiffsersatz müssen den konkreten Warenfahrten zugeordnet werden. Auch ohne Ausfall privater Händler würde eine bloße Lohnerhöhung bei negativ belegten Chargenmargen nicht automatisch die wirtschaftliche Finanzierung sichern. Der gemessene 5-Tages-Ausfall ist kein stabiler 40-Perioden-Test.

## Ergebnis und nächstes Gate

**[BELEGT]** Im aktiv betriebenen Original-Core lassen sich tatsächliche Waren-, Lohn-, Haushalts-, Flugkosten-, Flottenersatz- und Fonds-Zahlungen mit offenen Vertragsreserven prüfen. Die Cyris-Haushaltsnachfrage fällt mangels frei verfügbarer Kauf-/Stationsmittel nach wenigen Tagen aus. Der historische individuelle NPC-Flottenzuschuss existiert weiterhin und ist von normalen Fonds-Mindeststandszahlungen getrennt.

**[OFFEN]** Konsolidierung entlang einer einzelnen, global identifizierbaren Eis/Nahrung/Fracht-Lieferung einschließlich nicht bewerteter Vorbestände; Verteilung echter Frachter-/Minerkosten auf transportierte Waren, Risiko, Schiffsersatz und Kapitalkosten; Folgeanlauf ohne Individualzuschuss (nur als Analyse, nicht spontan produktiv ändern); 40 Wiederholungsperioden, 13×90 Tage/365 Tage und echte iPad-/NAS-Abnahme.

**Empfohlen B-K9w:** Als kleinen isolierten Folgeschritt **die bereits existierende Zuschussstelle in zwei unveränderten Original-Core-Szenarien testweise deaktivieren** und den Seed7-Flottenersatz, die Fahrtfinanzierung und den echten Nahrungsumsatz quantitativ vergleichen; zugleich fahrtenweise Kosten der tatsächlich gelieferten Nahrung von anderen Fahrten abgrenzen. Eine Sperre wäre zunächst **nur ein Test**, keine Produktregel. Erst nach diesem Kausalnachweis Regeländerungen zur Entscheidung stellen.
