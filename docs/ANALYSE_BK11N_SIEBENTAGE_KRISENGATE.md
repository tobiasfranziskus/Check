# B-K11n – 7-Tage-Versorgung und NPC-Liquidität nach Einweg-Flugkostengate

**[ANALYSE/DRAFT · 03.11.2026]** [PR #152](https://github.com/tobiasfranziskus/Check/pull/152) auf B-K11m #151 → B-K11l #150 → #149 → #148 → #147 → #146. **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert. Nur historisch isolierte R15/Schema9-Testwelt und Dokumentation; kein Produkt-, Preis-/Lohn-/Geld-/Flugregelwechsel, keine neue ISK-Emission, kein Merge.

## Fragestellung und A/B-Design

B-K11m zeigte nach 48h, dass das Abziehen **nur der tatsächlich vorfinanzierten Hinflugkosten** in der NPC-Routenbewertung die Händler nicht rettet und die Versorgung regional nicht zuverlässig verbessert. B-K11n prüft nun, ob sich dieser Trend über **168 Stunden** in der Versorgung aller sechs verbrauchenden Stationen trägt.

Pro Seed42/7 stammen beide Arme aus dem **identischen gepinnten Save nach dritter echter Teilbelieferung**, Tick3960 (B-K11j: `ed0151cdaa03a8a1` / `61c198365462ede4`). Genau fünf historisch angehaltene echte NPC-Frachter werden in beiden Armen aktiviert. Der **Originalarm** verwendet `m_core_entscheidung.bestesPaar`; der **testseitige Gegenarm** filtert nur Routen, deren Marktspanne nach Gebühren *und den direkten Hinflugkosten* nicht positiv ist, und rankt den Rest nach dieser Nettospanne. Weitere Welt, Haushalts-/Werft-/Risiko-/Geld- und Vertragsmechanik identisch. **2 Seeds × 2 Varianten × 7 Spieltage**, unabhängiger Geld-/Waren-/Herkunftsaudit jede Stunde und täglicher Save/Load-Hash.

## [TEST] Alle sechs Verbraucherstationen, 7 Tage

Für jede Ware ist eine Mangelstunde das Stundenintervall, in dem die jeweilige Station ihre geforderte Menge **nicht vollständig** bedienen konnte. Maximum je Ware 6 × 168 = **1.008 Stations-Mangelstunden**. Diese Größe misst Versorgung, **keine** unbeglichenen Löhne oder Geldkosten. Die Medikamentenverbrauchslogik ist in dieser Historienwelt **nicht gleichwertig als neuer bezahlter Haushalt-Endkauf implementiert**; Nahrungsendkäufe wurden dagegen als echte neue Ware/Original-Core-Zahlung protokolliert.

| Sieben-Tage-Gate | Seed42 original | Seed42 Hinflugkosten | Seed7 original | Seed7 Hinflugkosten |
| --- | ---: | ---: | ---: | ---: |
| Nahrungs-Mangelstunden / 1.008 | **881** | **869** | **885** | **897** |
| Medizin-Mangelstunden / 1.008 | **978** | **987** | **982** | **983** |
| Tatsächlich bezahlte neue Nahrung in allen 6 Stationen | **273** | **323** | **273** | **252** |
| ISK für tatsächlich bezahlte neue Nahrung | 10.689 | 13.252 | 11.356 | 10.752 |
| Tatsächlich ausgezahlte lokale Haushalts-Produktionslöhne | 7.788 | 12.484 | 9.328 | 8.704 |
| NPC1-Kasse am Ende | **65** | **19** | **66** | **27** |
| NPC2-Kasse am Ende | **124** | **0** | **65** | **31** |
| Echte NPC-Frachter-Verkäufe | 71 | 58 | 117 | 62 |
| NPC1/NPC2-Frachter am Ende | 4 | 3 | 2 | 3 |
| Aldera: bezahlte neue Nahrung | 0 | 5 | 3 | 0 |
| Aldera: Nahrungsmangelstunden /168 | 168 | 167 | 165 | 168 |
| Geldbestand inkl. Escrow / Kernquellen und -senken | 50.000 | 50.000 | 50.000 | 50.000 |
| Endhash | `71d881f80dc7608c` | `d70efdefcd455898` | `bf688f630cfdc86d` | `a4ffb5f908631659` |

**Seed42:** Hinflugkostengate **12 Nahrungsmangelstunden weniger**, 50 zusätzliche bezahlte neue Nahrung, aber **9 Medizin-Mangelstunden mehr**, eine NPC-Hülle weniger und NPC2 mit **0 ISK**. Die Aldera-Nahrungslage ist weiterhin 167 von 168 Stunden mangelhaft.

**Seed7:** Hinflugkostengate **12 Nahrungsmangelstunden mehr**, **21 weniger** echte bezahlte neue Nahrung, ein Händler verliert gegenüber dem Original länger Liquidität; Aldera erhält im Testarm **überhaupt keine** neue bezahlte Nahrung. Drei statt zwei NPC-Frachter bleiben zwar in der Gesamtflotte, aber ein höherer Hüllenbestand ist **kein** Beleg tragfähiger Warenversorgung.

Weitere echte Kontenbelege: Seed42-Aldera-Kasse original **2 ISK**, Gegenarm **703 ISK**; Aldera-Haushalt **1.864 / 4.226 ISK**, ohne dass die Nachfragesperre für Nahrung behoben wäre. Seed7 Aldera-Kasse **7 /17 ISK**, Haushalt **2.744 /2.510 ISK**, gleicher fehlender Endabsatz. **Geld auf einem Konto ist kein automatisch erfüllter Produktions-/Handelsvertrag.**

Die bisherigen Ausgangs- und B-K11m-Kontrollhashes bleiben erhalten. Die vier sieben-Tage-Hashes sowie sechs-Stationen-Mangelstunden und tatsächliche bezahlte Nahrung werden zusätzlich **deterministisch gepinnt**.

## Ergebnis, Grenzen und nächstes Gate

**[ANALYSE NEGATIV]** Das testseitige Einweg-Flugkostengate ist **keine hinreichende Korrektur** der Handels- und Produktionsfinanzierung. Es verschiebt Route, Warenabsatz, Stationslohn und Fondsströme, und kann je Seed einzelne Teilindikatoren verbessern oder verschlechtern. **In keiner der vier Welten ist nach sieben Tagen eine wirtschaftlich stabile Nahrungs-/Medizinversorgung erreicht.** Nur positives Budget einzelner Händler, weniger Leerflüge oder mehr Geld im Haushalt gelten nicht als Gesamterfolg.

Die vollständige **Handels-/Leistungskette** muss getrennt untersucht werden: wirtschaftlicher **tatsächlich finanzierbarer Zielverkauf**, gebundenes Käuferbudget und Zielstationsreserve, laufender Händler-Frachtbestand, Hin-/Folgefahrtarbeit, realer Produktionslohn und erreichbare Nachfrage. Die Tests isolieren NPC-Autohandel nach vorheriger gezielter Spielerkrise und sind **keine unveränderten Normalwelten ab Day 0**. Preis-/Lohnreform und Geldmodell-B-Emissionen benötigen eigene begründete Freigabe; keine individuelle Konkursgarantie, kein Spieler-Sparlimit.

**[TEST]** [Gezielte B-K11n-CI #41667293096](https://github.com/tobiasfranziskus/Check/actions/runs/41667293096), **13/13 Node-Tests erfolgreich**, 0 Fehler. Die gepinnten Zusatzassertionen wurden im Folgecommit eingetragen und sind auf der neuesten CI gesondert zu verifizieren. Standardregressionen und ältere 13×90d-Welten sind voneinander zu unterscheiden; kein Beleg für 13×90d-Wirtschaftsdauer, keine Regel15-/Schema9-Produktmigration oder reale iPad-/NAS-Abnahme. Keine Freigabe für Produktmechaniken und keinen Merge.
