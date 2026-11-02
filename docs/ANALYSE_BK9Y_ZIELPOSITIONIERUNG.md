# B-K9y – gezielte, bezahlte Händler-Neuplatzierung statt zufälliger Leerflüge

**[ANALYSE/DRAFT · 02.11.2026]** [PR #116](https://github.com/tobiasfranziskus/Check/pull/116) auf #115 → #114 → #113 → #112 → #111 → #110 → #109 → #108. **[MAIN]** weiterhin `b4e604d6` (v0.12.5, Regel14/Schema8), kein Merge. **Nur Testskript und dieser Bericht**; Spieloberfläche, produktive `index.html`, Preise, Rezepte, Löhne, Emissionsregeln und Spielstandformate bleiben unverändert.

## Fragestellung und Design

B-K9x hat gezeigt: Die einfache vorwärtsgerichtete Hin-/Rückflug-Kalkulation löst die Krise nicht, solange die NPC-Entscheidung weiterhin zufällige Leerfahrten finanziert; vollständiges Unterbinden dieser Leerpositionierung bewahrt dagegen Händlerliquidität, kann aber Chancen für Versorgung ausschließen. B-K9y prüft eine einzige alternative **Testregel**, ohne sie produktiv einzubauen.

Drei unabhängige vollständige Original-Core-Welten mit denselben Seeds 42 und 7 werden je **sechs Spieltage** simuliert, mit Regel15/Schema9 ausschließlich als explizitem Draft-Kandidaten, bezahltem lokalem Neu-Nahrungsverbrauch, unverändertem Autohandel, Piraten, Schiffersatz und Werftfonds-Hilfe; wie B-K9x ist die allgemeine automatische Fonds-Mindeststandauffüllung zur Kausalabgrenzung deaktiviert.

1. **Original:** Preis-Spread minus Gebühren, danach zufällige Leerpositionierungen.
2. **K9x ohne Leerfahrt:** konservative Hin-/Rückflug-Vorauswahl, zufällige leere Umpositionierung vollständig gesperrt.
3. **K9y gezielt:** gleicher konservativer Hin-/Rückflug-Spread, aber bei fehlendem lokal rentablen Handelsziel wird eine andere erreichbare Ausgangsstation nur gewählt, wenn dort *bereits jetzt* ein tatsächlich vorhandener und für die Zielstation bezahlbarer Warenkauf mit positivem Deckungsbeitrag nach **Leerflugkosten + späterem Transport + geschätzter gleich teurer Rückfahrt + beiden Handelsgebühren** möglich ist. Die spätere Warenkasse wird unter Abzug der Positionierungskosten geprüft. Die Opportunität erhält eine deterministische beste Gewinn-/Zeit-Wahl. Echte Neuplatzierung startet nur über den vorhandenen `abflug` → `m_core_vertrag.fahrtStart`, welcher ihren **gesamten Leerflug** aus vorhandenen Eigentümer-ISK atomar reserviert. Kein neues Geld und kein Gratisflug.

**Wichtige Grenze:** Die spätere Warenanschaffung, der anschließende Handel und der hypothetische Rückflug werden nur *vorausberechnet*, nicht dauerhaft reserviert oder garantiert. Andere Händler können die Ware vorher kaufen, Preis und Stationskasse können sich verändern. Der Test zeichnet deshalb **Zielwahl → tatsächliche Ankunft → echten Kauf** getrennt auf; Prognose ist nicht gleich Lieferung. Andere leere Autohandelspositionierungen werden in der Zielvariante ausgeschlossen.

## Ausgeführte Ergebnisse bis Tag6

Kumulierte Neu-Nahrungszahlungen/Fehlbedarf über **alle sechs** Verbrauchsstationen; Händler-ISK sind die freien Kassen von NPC1+NPC2; Flugkosten nur tatsächlich aus Vertragsreserven abgerechnete NPC1-/NPC2-Flugleistungen. Der Handels-Cashflow nach Flug enthält auch noch nicht aufgelöste Einkaufs- und Hüllenzahlungen und ist **kein vollständiger Periodengewinn**.

| Kennzahl | Seed42 Original | Keine Leer | Gezielt |
|---|---:|---:|---:|
| **Bezahlter neuer Nahrungsverbrauch** | 185 | 214 | **234** |
| Kumulativ fehlende neue Nahrungseinheiten | 2.061 | 2.008 | 2.013 |
| NPC1+NPC2 freie Kasse | 528 ISK | 7.726 ISK | **5.732 ISK** |
| NPC-Händlerfrachter physisch | 5 | 2 | 3 |
| Tatsächlich bezahlte NPC-Flugstunden | 10.154 ISK | 3.075 ISK | **5.003 ISK** |
| Leere Auto-Starts | 10 | 0 | **14 gezielt** |
| Netto-Waren-Cashflow nach Flug | −5.202 ISK | +2.075 ISK | **+164 ISK** |
| Individuelle NPC-Werftfonds-Zuschüsse | 0 ISK | 0 ISK | 0 ISK |

| Kennzahl | Seed7 Original | Keine Leer | Gezielt |
|---|---:|---:|---:|
| **Bezahlter neuer Nahrungsverbrauch** | 134 | 202 | **234** |
| Kumulativ fehlende neue Nahrungseinheiten | 2.115 | 2.020 | 2.013 |
| NPC1+NPC2 freie Kasse | 35 ISK | 8.604 ISK | **7.052 ISK** |
| NPC-Händlerfrachter physisch | 3 | 2 | 2 |
| Tatsächlich bezahlte NPC-Flugstunden | 12.204 ISK | 3.322 ISK | **4.888 ISK** |
| Leere Auto-Starts | 10 | 0 | **12 gezielt** |
| Netto-Waren-Cashflow nach Flug | −6.558 ISK | +2.866 ISK | **+1.384 ISK** |
| Individuelle NPC-Werftfonds-Zuschüsse | 693 ISK | 0 ISK | 0 ISK |

**Befund:** Die gezielte Neuplatzierung kauft gegenüber Stillstand in Seed42/7 **20/32 weitere neue Nahrungseinheiten** durch bezahlten Haushalt-Endverbrauch. Die Kassen liegen deutlich über der jeweiligen Originalwelt, aber um 1.994/1.552 ISK unter dem vollständigen Leerflug-Stopp. Die ausgelösten zusätzlichen realen Flugkosten sind 1.928/1.566 ISK. Die Versorgungsnachfrage ist dennoch in beiden Seed-Welten an allen sechs Stationen weiter nicht ausreichend erfüllt; die akkumulierte Fehlmenge wird in Seed42 gegenüber völlig unterdrückten Leerfahrten sogar **um 5 Einheiten größer** trotz mehr bezahlter Produktion/Verkäufe. Eine verbesserte Teilkennzahl ist kein Stabilitätsnachweis.

## Zielankunft und Marktrisiko

| Beleg der tatsächlichen Zielpositionierung | Seed42 | Seed7 |
|---|---:|---:|
| Nach positivem Markttest bezahlte Leerstarts | 14 | 12 |
| Davon an der prognostizierten Ausgangsstation angekommen | 14 | 12 |
| Anschließende reale, der Zielposition zugeordnete Warenkäufe | 9 | 9 |
| Davon Kauf der vorhergesagten Ware | 7 | 7 |
| Kauf einer anderen Ware am vorhergesagten Markt | 2 | 2 |
| Noch offene, nicht gekaufte Prognosen nach Tag6 | 2 | 2 |
| Durch erneute Positionierung verdrängte frühere Prognosen | 3 | 1 |
| Kumulierte voraussichtliche Leerflugbudgets | 1.255 ISK | 1.101 ISK |

Das sind **keine** 14/12 erfolgreichen Handelsreisen. Die vorhandenen Warenangebote/Absatzbudgets sind dynamisch, mehrere NPC können dieselbe Marktchance sehen und der Markt kann vor Ankunft leergekauft werden. Die offenen Prognosen und Wiederholungspositionierungen müssen in einem Folgegate als mögliche Fehldispositionen untersucht werden; insbesondere ist die tatsächliche Frachtverkaufszahlung getrennt von einer bloßen Ankunft oder einem Kauf zu auditieren.

## Tests und Qualitätsgrenzen

- `tests/bk9y-zielpositionierung-finanziert.test.mjs`: stündlich unabhängiger Audit für Bargeld plus aktive Vertragsreserven = `initialSupply + minted − burned`, Original-Core-Waren- und Herkunftsaudit; täglich Save/Load-Hash, 120-Tick neutrale Original-Core-Instrumentierung und zusätzlich 48h deterministischer Replay. Drei Varianten × zwei Seeds × sechs Spieltage.
- [GitHub Actions #41437917820](https://github.com/tobiasfranziskus/Check/actions/runs/41437917820): erster vollständiger Lauf **126/126 Node-Tests bestanden**, Gesamtlauf erfolgreich. Der nachfolgende Testcode-Commit `e58d12a` ergänzt und besteht **zusätzlich** Assertions für die atomar tatsächlich gebundene Neuplatzierungsreserve, ausdrücklich positive erwartete Marge und die Trennung der ursprünglich prognostizierten Ware (7 Käufe) von anderer dann gekaufter Ware (2 Käufe je Seed). [CI #41438237731](https://github.com/tobiasfranziskus/Check/actions/runs/41438237731): der **Node-22-Testjob ist 126/126 grün**; der vollständige Workflow-Status wird separat geprüft.
- Die historischen v10–v14-CI-Jobs sind **keine** Regel15-Stabilitätsabnahme. Keine reale iPad-/NAS-Abnahme, keine 40 positiven Wiederholungsperioden, kein 13×90d-/365d-Langzeit- oder Spielerkrisentest.

## Entscheidungsempfehlung

**[ANALYSE POSITIV, PRODUKT NICHT FREIGEGEBEN]** Gezielt finanzierte Positionierungen könnten eine spätere Produktionsregel werden, denn sie bewahren in diesen zwei kurzen Seeds mehr Liquidität als Zufallsfahrten und erschließen zusätzliche bezahlte Nachfrage gegenüber völligem Leerfahrtenstopp. Das Ziel-/Kauf-Risiko ist aber nicht kleinzureden; **keine** sofortige Übernahme nach `main`.

**Nächstes sachliches Gate B-K9z [OPTION]:** per Start-/Ankunfts-/Warenkauf-/Warenverkauf-/Lohnkostenbeleg auswerten, *welche* angekündigten Neuplatzierungen zu abgeschlossenen rentablen Transporten führen und wie oft zwei Schiffe um dieselbe nicht gesicherte Ware konkurrieren. Zusätzlich weitere Seeds/Zeiträume prüfen, bevor eine kleinste produktive Dispositionsänderung ausdrücklich zur Entscheidung gestellt wird. **Keine neue Geldquelle, Preis- oder Lohnreform.**
