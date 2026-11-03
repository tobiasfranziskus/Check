# B-K11i – Zwei echte Folgelieferungen und Fonds-Aus-Gegenprobe

**[ANALYSE/DRAFT · 03.11.2026]** Gestapelter [PR #147](https://github.com/tobiasfranziskus/Check/pull/147) auf [Draft #146](https://github.com/tobiasfranziskus/Check/pull/146), nicht auf main integriert. Die exakt gepinnte historische R15-/Schema9-Core-Fixture aus #146 wird mit fortgeführtem bezahltem FIFO-Eis- und Nahrungsjournal benutzt. **main b4e604d6 bleibt Regel14/Schema8 und unverändert.** Kein Produktlohn, keine Emission, kein Save-/Regelwechsel, kein Merge.

## Fragestellung

Ein erfolgreicher 24er-Auftrag und ein zweites Käuferbudget (B-K11h) beweisen noch keine zweite echte Produktion/Belieferung. B-K11i führt in **demselben tatsächlich gespeicherten Simulationszustand** einen zweiten 24er-Weg aus: reales Eis vom Miner bezahlt, Nahrung im ursprünglichen Rezept hergestellt, Produktionslohn im isolierten R15-Testkern bezahlt, echter Schiffskauf/Flug sowie erst nach erfolgter Endabnahme ausgezahlter Haushalt-Vertrag.

Drei Gegenproben trennen den lokalen Geldumlauf:
- **A – Fonds durchgehend aktiv:** Zwei reale Lieferungen; alle tatsächlich neuen Kosten, Herkunfts- und Geldbelege pro Periode abgrenzen.
- **B – Fonds ab Anfang aus:** Identische Ausgangswelt, echte acht Stunden; vor Auftrag prüfen, ob eine volle 24er-Charge wirklich verkaufbar ist. Fehlende Ware nie kostenlos herstellen.
- **C – Fonds erst nach erster realer Lieferung aus:** Derselbe durch die erste Lieferung erreichte Save-/Waren-/Kassenstand wie in A. Danach ohne weitere Fonds-Mindeststandstransfers nochmals tatsächlich 24 liefern, falls alle realen Voraussetzungen erfüllt sind.

Varianten B und C verändern die Fondsparameter ausschließlich im isolierten Entwicklungs-Testkern, nicht in produktiven Spielständen.

## [TEST] Tatsächlich ausgeführt

**[CI #41635717867](https://github.com/tobiasfranziskus/Check/actions/runs/41635717867)** auf Testcode 08e9ebce erfolgreich: **6/6 Node-Tests** mit Seed 42 und 7. Die zwei ursprünglichen B-K11h-Endhashes bleiben unverändert. Alle gemeldeten Folgelieferungen stammen aus realen Original-Core-Befehlen im alten R15-Testkern; Geld-/Waren-/FIFO-Audit an jedem Stundenabschluss und Save/Load-Abgleich. Die erneute allgemeine Standard-CI wird separat überprüft.

| A – Fonds aktiv, je zwei tatsächliche Lieferungen | Seed42 | Seed7 |
| --- | ---: | ---: |
| Nahrung Erstlieferung + Folgelieferung | 24 + 24 | 24 + 24 |
| Haushalt nach erster Lieferung, vorhandene ISK | 1.972 | 2.252 |
| Zweite wirkliche Haushaltszahlung, ISK | 1.296 | 1.296 |
| In zweiter Periode echt angekauftes Eis | 136 | 136 |
| In zweiter Periode echt fertiggestellte Nahrung | 68 | 68 |
| Zweite reale Frachterkosten, ISK | 499 | 499 |
| Quellenbeitrag der ersten abgegrenzten 24er-Charge, ISK | −1.032 | −1.032 |
| Quellenbeitrag der zweiten abgegrenzten Charge, ISK | −474 | −474 |
| Nadir nach erstem Auftrag, ISK | 2.229 | 2.353 |
| Nadir nach zweitem Auftrag, ISK | 1.875 | 1.655 |
| Fonds-Mindestüberweisungen erster Zeitraum, ISK | 5.135 | 5.259 |
| Fonds-Mindestüberweisungen zweiter Zeitraum, ISK | 958 | 614 |
| Zweiter deterministischer Endhash | fa3c99f7b4bbff6e | 0f00c433f4e43452 |

| B/C – Fonds-Mindeststandsunterstützung aus | Seed42 | Seed7 |
| --- | ---: | ---: |
| B: ohne Fonds ab Start nach 8h frei verkäufliche Nahrung | **0** | **0** |
| B: Quellkasse nach 8h, ISK | 94 | 94 |
| B: tatsächlich bis dahin fertiggestellte Nahrung | 32 | 32 |
| C: nach erster finanzierten Lieferung zweite echte Endabnahme | **24** | **24** |
| C: Fonds-Mindestüberweisung während zweiter Periode | **0 ISK** | **0 ISK** |
| C: Nadir-Kasse nach zweiter Lieferung, ISK | **917** | **1.041** |
| C: zweite abgegrenzte Quellmarge, ISK | **−474** | **−474** |
| C: zweiter deterministischer Endhash | fecad114e0b10608 | 1bd24ad0814a5dc1 |

**Wesentliche Kausaltrennung:** Die Differenz A zu C in Nadirs Kasse nach dem zweiten Auftrag ist hier genau 958 bzw. 614 ISK und entspricht den echten Fonds-Mindeststandsüberweisungen in A. Diese Fonds schaffen keine neuen ISK; sie übertragen existierendes Geld. Durch vorherige Finanzierung aufgebaute Liquidität und Vorräte können **eine** zweite Lieferung tragen, auch wenn ab dann keine Mindestfondsüberweisung erfolgt. Fehlt diese Anlauffinanzierung von Beginn an, sind nach acht Stunden null Nahrungseinheiten frei verkaufbar. Das ist **keine** pauschale Rechtfertigung einer individuellen Insolvenzgarantie.

**Wichtige Interpretation:** Die zweite Quell-Chargenmarge −474 ISK unterscheidet sich von der **gesamten** Stationskassenänderung im Zeitraum. Denn Nadir betreibt parallel Minerhandel, weitere Fertigung, lokalen Verbrauch, Gebühren und andere Umbuchungen. Der 4-ISK/min-Fabriklohn ist nur für die R15-Testvariante bezahlt und keine beschlossene Produktregel; der Endkundenkauf ist eine isolierte Testimplementierung, nicht der zivile Endverbrauch im heutigen main.

## Abnahmegrenze und Folgeaufgabe

Die beiden bezahlten Lieferungen zeigen noch **keine dritte oder dauerhaft wiederholbare Fahrt**, **keinen** stabilen 13×90-Tage-Sektor und **keinen** real finanzierten Hüllenersatz/Piraterierisiko-Zyklus. Ohne Fonds sinken die Nadir-Kassen nach gerade zwei Lieferungen auf 917/1.041 ISK; eine selbsttragende Quelle ist nicht bewiesen. Ob weitere Aufträge an Käufergeld, Rohstoffen, Margen oder Quellliquidität scheitern, muss einzeln nachgewiesen werden.

**Nächstes enges Gate [ANALYSE]:** Beginnend am realen Endzustand nach zwei Lieferungen ohne Fonds die **erste tatsächlich nicht finanzierbare nächste Charge** messen und ihre genaue Ursache aus bestehender Kasse, Warenbestand, Rezeptlohn und tatsächlicher Nachfrage feststellen. Erst danach über D2/D3/D6 und eine konkrete leistungsgebundene, global begrenzte Geldmodell-B-Emissionsregel gesondert entscheiden. Spieler darf unbeschränkt sparen; einzelne NPC-Konzerne dürfen scheitern. Keine automatischen Gratisrettungen, keine Integration, kein Deployment.
