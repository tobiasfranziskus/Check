# B7k – Bezahlter Sicherheitsrückzug nach Warenlieferung

**31. Oktober 2026 · [ANALYSE/DRAFT] · PR #60 · ausschließlich isolierter Simulationstest**. Basis ist `main 517728a9` (v0.12.5, Regel14/Schema8) sowie der bisherige B7j-Versuch desselben mit **780 ISK** aus NPC3-Konzerngeld gekauften Frachters `sh131`. Die einzige verbindliche Planung bleibt `docs/ROADMAP.md` auf `main`. **Kein produktiver Kauf-, Flug-, Kampf-, Piraten-, Preis-, Geld-, Spieler- oder Spielstands-Code verändert.**

## Hypothese

B7j hatte den Frachter bei Tick **27.480** (Tag20) nach langem leeren Warten in **Dravos (gesetzlos, realer Pirat)** verloren, obwohl seine vorangegangene Lieferung nominell einen positiven Risikodeckungsbeitrag aufwies. **Nur wenn der Frachter leer und angedockt in einem nicht sicheren System mit einem tatsächlich gedockten Piraten steht und der vorhandene B7i/B7j-Kern keine aus aktuellen Mitteln finanzierte profitable Folgeroute findet**, darf der NPC3-Frachter eine gezielte **reguläre Leerfahrt** zum nächstgelegenen erreichbaren **sicheren System** erwägen. Zielauswahl deterministisch: kürzeste bestehende Route, bei gleicher Route lexikografisch erste Station. **Vor Abflug muss das tatsächlich vorhandene Eigentümerkonto** die nach B7i-Zeitformel konservativ angesetzte Schiffarbeit `ceil(Minuten × 250 / 60)` **und eine volle Miner-Betriebsstunde je bestehendem NPC3-Miner** decken. Die Reserve ist keine Auszahlung oder Garantie; die tatsächliche Arbeitsbuchung erfolgt unverändert durch den Core. Keine Teleportation oder Bevorzugung des NPC durch den Kampfcode; keine kostenlose zusätzliche Hülle. Die neue Regel ist bewusst **nur im isolierten NPC3-Analysepfad** aktiv, nicht beim Spieler oder NPC1/2.

## [TEST] Ausgeführter Vergleich

Referenz ist der erste 90-Tage-B7k-Simulationslauf von [CI #41213200611](https://github.com/tobiasfranziskus/Check/actions/runs/41213200611), dessen **Weltlauf, unabhängige Geld-/Warenaudits, Hash-Replays und Save/Load erfolgreich berechnet** wurden. Die nachgeschaltete neue B7k-CI-Zusatzprüfung war zunächst **rot wegen einer falschen Testannahme** `Leerfahrt-Arbeit >= 250 ISK`, obwohl die bestehende B7i-Entscheidung **zeitanteilige** Minutenarbeit berechnet. **Dieser Testfehler ist korrigiert:** Jetzt wird die tatsächlich angesetzte Formel `ceil(Minuten × 250 / 60)` auf positive Arbeit verifiziert. Der wiederholte abschließende CI-Lauf [#41213521985](https://github.com/tobiasfranziskus/Check/actions/runs/41213521985) muss vor Testfreigabe vollständig erfolgreich sein; die konkreten Marktergebnisse unten stammen aus den ausgeführten, bereits nach Geld-/Waren-/Replay-Hash auditierten Ergebnis-JSON der ersten CI. **Die neue B7k-Kernvariante hat gegenüber B7j den eigenständigen deterministischen 90-Tage-Hash `ec8b22cf9a3d2ed2`.**

Vergleichsaufbau: Regel14-Kontrolle/B7b-Konten je 10/90 Tage, B7f-Einmalinvestition, B7h-Autohandel, B7i-Vollkosten, B7j-Fahrtrisiko, B7k zusätzlich Leerflucht je90 Tage, also **neun** echte Weltläufe, **15.600 stündliche Geld-/Waren-Audits und parallele unabhängige Replays**, **650 Tageshashes und 114 Save/Load-Roundtrips**. Ursprünglicher B7j-Endhash `bacfb1cb1dc7ed8c`, B7i `517f7d05d13dfaae` unverändert; B7k und B7j **identische tägliche Weltzustände bis einschließlich Tag15**, derselbe erste Schiffskauf und 55-Siliziumverkauf, danach genau **eine** bezahlte Hülle pro Welt. Kein neues Geld aus dem B7k-Eingriff; Start 55.000 ISK, ursprüngliche Quellen/Senken ergeben Ende **50.000 ISK** in der geprüften Welt.

## Tatsächlich ausgelöste Sicherheitsfahrten

| Tick | Tatbestand | Finanzierung und Ziel |
| --- | --- | --- |
| **21.803** (Tag16) | Frachter steht nach Siliziumverkauf **leer in Dravos** mit Pirat; B7i/B7j findet keinen ausreichend finanzierten profitablen Folgeauftrag | **Dravos→Aldera** (sicher), 20 min, angesetzte Arbeit **84 ISK**; NPC3-Kasse **6.530 ISK**, Minerreserve **1.350 ISK** |
| **21.973** (Tag16) | Nach späterem Handel erneut **leer in Dravos** mit Pirat; kein bezahlbares Folgegeschäft | **Dravos→Aldera** (sicher), 20 min, Arbeit **84 ISK**; NPC3-Kasse **4.667 ISK**, Minerreserve **1.650 ISK** |

Beide Flüge sind über **unverändertes `abflug` / `reise` / `ankunft`** tatsächlich gestartet und angekommen. Ab dem zweiten Rückzug wartet `sh131` in **Aldera (sicher)**, nicht ungeschützt in Dravos. `sh131` wurde in der B7k-Welt **bis Tag90 nicht angegriffen oder zerstört**; der beobachtete B7j-Frachter wurde dagegen in Dravos am Tick27.480 nach mehreren echten Angriffen zerstört. **Das ist ein positives Einzel-Seed-Überlebensresultat, keine Garantie für andere Seeds, Routen oder Angriffsereignisse.**

## 90-Tage-Gesamtbilanz

| Kennzahl | B7j – Fahrt-Risikoaufschlag | B7k – zusätzlich bezahlte Leerflucht |
| --- | ---: | ---: |
| NPC3: bezahlte neue Frachterhüllen | **1** | **1** |
| NPC3-Frachter Tag90 | 0 | **1** (`sh131` in Aldera) |
| NPC3-Miner Tag90 | 8 | **9** |
| NPC3-Konzernkasse Tag90 | **3.060 ISK** | **1.936 ISK** |
| NPC3-Hüllenverluste insgesamt (alle Schiffsklassen) | 33 | **32** |
| NPC3-Betriebskosten fällig = bezahlt | 50.849 ISK | 51.352 ISK |
| Gesamt weltweit fällige/zahlte Arbeit | **245.234/245.234 ISK** | **245.737/245.737 ISK** |
| Ungedeckte Arbeit | **0 ISK** | **0 ISK** |
| NPC3-Frachter-Waren-Einkäufe/Verkäufe | 3/4 | **3/4** |
| Produktive, nach Lot-Arbeit positive abgeschlossene Frachterpartien | 3 | **3** |
| Produktion kumuliert | 7.084 | **7.092 (+8)** |
| Echter ziviler Nahrung-/Medikamentenverbrauch | 3.776 / 675 | **3.776 / 675** |
| Zivile Grundversorgungstage | 15 | **15** |
| Mangelstunden | 36.059 | 36.060 |
| Frachter nach langer Untätigkeit | zerstört | **überlebt, aber meist untätig** |
| Endhash | `bacfb1cb1dc7ed8c` | `ec8b22cf9a3d2ed2` |

**[BEWERTUNG – PARTIELL POSITIV, KEINE PRODUKTFREIGABE]** Ein **wirklich bezahlter** Sicherheitsrückzug vermeidet in diesem Seed den Totalausfall eines Frachters im Wert von ursprünglich 780 ISK und bewahrt einen zusätzlichen Miner, während **alle echten Betriebskosten vollständig gedeckt** bleiben. Zugleich besitzt der Konzern am Ende **1.124 ISK weniger freie Liquidität** als im B7j-Lauf, bei einem vorhandenen Frachter als Sachvermögen. Eine hypothetische Addition von nominal 780 ISK Sachwert ergibt **noch immer −344 ISK** gegenüber dem B7j-Kassenstand; Wertbeitrag und späterer Wiederverkauf sind **nicht** bewiesen. Die Vergleichswelten divergieren in weiteren Miner-/RNG-/Kassenereignissen, deshalb sind diese Unterschiede **keine isolierten Flugkosten von 168 ISK**. Handelsaufträge und reales zivil verbrauchtes Essen/Medizin verbessern sich nicht; bei B7k wurden im Verlauf nach dem frühen kurzen Handelsblock **3.590 Warteentscheidungen** (30-Minuten-Intervall) registriert. Ein dauerhaft wartendes, gefahrlos parkendes Schiff löst den **Waren-/Geld-/Nachfragekreislauf** nicht.

**Risiko-Spezifikation offen:** Die B7j-Risikoprämie ist eine **vereinfachte** Annahme aus anwesenden Piraten, Chancen und Marktwert, **keine** vollständig kalibrierte Verlusterwartung. B7k nimmt ausschließlich nach negativem Folgehandels-Gate eine sichere Leerabreise an; echte Eskorte, Aufenthalt bei unübersichtlichen Ankünften, Konvois, Piratenseite und tatsächlicher Ersatzkaufpreis bleiben spätere eigene Arbeitspakete. Die bereits getestete ursprüngliche Politik B7i kann wirtschaftlich solvent sein und trotzdem einen Frachter verlieren; B7k zeigt, wie man *einen* bekannten unnötigen Aufenthalt ohne Geldgeschenke vermeidet. NPC-Schiffe bleiben konzerngehörig, kein neuer persönlicher NPC-Schiffskauf oder Pachtvertrag.

## Empfehlung nächstes Arbeitspaket – Phase B statt weiterer Sicherheitsvarianten

**[OPTION / ANALYSE]** Nach diesem isolierten Sicherheitsgate **zuerst** den **echten zivilen Endverbrauch** wieder priorisieren: Warum bleiben in sechs der sieben Stationen langfristig Nahrung/Medikamente ohne regelmäßige aus vorhandenen Quellen finanzierte Bezahlung, selbst wenn ein Frachter sicher überlebt und Lieferungen ausführt? Die zuvor diskutierte **gesamtwirtschaftlich begrenzte Modell-B-Emissions-/Senkenregel** ausschließlich nach echter Weltleistung und ohne individuellen Konkurs-Bailout als getrenntes, kleinstes Testmodell mit Kaufkraft-, Margen-, Audit- und Sparfreiheit prüfen. Vor neuer Regelaufnahme nur auf Basis `main`-Roadmap beschließen und Mehrseed-Langläufe durchführen. *Alternativ* kann in einer späteren Flottenphase die B7i/B7k-Erkenntnis als eine **einheitliche** Spieler-/NPC-Fahrtentscheidung weiterentwickelt werden, aber nicht ohne 13×90d, Piraten-/Geleitschutz-, Altsave- und iPad-Gates.

**Status:** PR #60 [DRAFT/ANALYSE], Roadmap-Entwurf #55 [DRAFT/DOKUMENTATION], `main 517728a9` unverändert. Keine Integration, kein produktiver Gameplay-Patch, kein Deployment.
