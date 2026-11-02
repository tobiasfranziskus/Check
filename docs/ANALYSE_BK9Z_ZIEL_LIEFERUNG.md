# B-K9z – Zielprognose bis zum echten Warenverkauf

**[ANALYSE/DRAFT · 02.11.2026]** [PR #117](https://github.com/tobiasfranziskus/Check/pull/117), gestapelt auf #116 → #115 → #114 → #113 → #112 → #111 → #110 → #109 → #108. **[MAIN]** bleibt `b4e604d6`, v0.12.5, Regel14/Schema8. Nur neue testseitige Analyse; keine Änderung der produktiven `index.html`, Preis-, Lohn-, Rezept-, Emissions-, Save- oder Insolvenznegeln.

## Fragestellung

B-K9y zeigt in zwei jeweils sechs Spieltage langen Regel15-/Schema9-Draft-Simulationen, dass eine gezielte, aus wirklichen Vertragsreserven finanzierte NPC-Leerpositionierung zusätzlich bezahlte Nahrungskäufe ermöglicht, aber auch Marktrisiken verursacht. B-K9z untersucht **nicht erneut eine weitere Handelsregel**, sondern prüft, was mit den bereits ausgelösten, real bezahlten Zielreisen geschieht. Der gesamte Original-Core bleibt unverändert, die Beobachterinstrumentierung wird nur in einer getrennten Testkopie eingefügt.

Pro Zielentscheidung werden unabhängig beobachtet: erwartete Ware, wirkliche Leerfahrt/Vertrag, tatsächliche Stationsankunft, wirklicher Kauf und Einkaufsgebühr, anschließende Verkäufer-Gegenbuchung nach FIFO des Frachter-Losbestands, Verkaufsgebühr, real aus dem Vertrag abgegoltene Positionierungs-/Frachtausgaben, unverkaufte Restmengen und zeitgleich offene konkurrierende Kaufprognosen.

**Sicherheitsgrenze der Kostenrechnung:** Die tatsächlichen Vertragssummen werden über ihre Original-Vertragsnummer zugeordnet; für eine Ladung zählt die **beim Abflug vorhandene, unveränderliche Warenmenge**, nicht der möglicherweise erst nach dem Entladen stündlich gebuchte, dann schon geleerte Laderaum. Gemischte Fracht wird mengenanteilig zugeschrieben; diese Zuordnung ist eine **analytische Kostenzuordnung**, keine eigenständige Geldbuchung oder bereits bewiesene Vollkostenmarge. Kauf-/Verkaufsbuchungen selbst sind reale Original-Core-Transaktionen. Kosten aus Schiffsanschaffung, Wartung, Risiken und nicht erfassten Lieferungen werden nicht still als null ausgegeben.

## Bezahlte Zahlungen nach verifizierter Original-Vertragsnummer

**Der erste Test hatte bezahlte Frachterkosten bei später Stundenabrechnung noch nicht vollständig der bereits entladenen Ware zugeordnet.** Die überarbeitete Instrumentierung verwendet deshalb unveränderliche Cargo-Abflug-Snapshots und **exakte R15-Vertrags-IDs**. Der komplett abgeführte Original-ISK-Betrag wird weder vervielfacht noch als Einnahme interpretiert. Ein gemischt beladener Frachter liefert eine sachliche mengenproportionale Kostenzuordnung; sie ist keine neue Spielbuchung.

| Original-Core-Zahlungen nur der aus einer **gezielten Positionierung** erworbenen Lose, kumuliert nach 6 Tagen | Seed 42 | Seed 7 |
|---|---:|---:|
| Echte abverkaufte Mengen | 223 / 240 eingekauft | 225 / 225 |
| Bezahlte Einkaufsumsätze | −4.182 ISK | −3.887 ISK |
| Einkaufsgebühren | −165 ISK | −152 ISK |
| Echte Verkaufsumsätze | +6.124 ISK | +6.181 ISK |
| Verkaufsgebühren | −127 ISK | −124 ISK |
| Bezahlte vertragliche Ziel-Leerflüge | −1.245 ISK | −1.092 ISK |
| Auf die Abflug-Ladungen zugeordnete tatsächlich bezahlte Frachterarbeit | −1.133 ISK | −1.649 ISK |
| **Kumulativer Bargeldsaldo dieser Ziel-Lose** | **−728 ISK** | **−723 ISK** |
| Alle tatsächlich bezahlten NPC1/NPC2-Flugkosten (inkl. fremder/unabhängiger Fahrten) | 5.003 ISK | 4.888 ISK |
| Davon auf Zielreisen **plus deren zugekaufte Ladungen** zurückführbar | 2.378 ISK | 2.741 ISK |

**Ausgefallene Zielkäufe konkret:** Die **fünf/drei** Zielreisen ohne anschließend bezahlte Ware verursachen insgesamt **419/274 ISK** bereits abgegoltene reine Neuplatzierungskosten und erzeugen für diese Ziele **0 ISK Verkaufserlös**. Die übrigen Zielketten verbleiben damit kumulativ bei einem separaten Bargeldsaldo von **−309/−449 ISK**; Seed42 hat davon noch unverkaufte Ware, während Seed7 alle beobachteten Ziel-Lose veräußert hat. Damit ist die Kostenunterdeckung **nicht** allein durch die leer ausgehenden Frachter erklärbar.

**Abgrenzung:** Die Summen sind wirkliche Geldbewegungen auf Einkaufs-, Verkaufs-, Gebühren- und Vertragskonten, soweit dem Zielbeleg eindeutig zuordenbar. Bei gemischter Ladung ist der Kostenanteil eine analytische Mengenzuordnung und nicht wortwörtlich eine weitere Zahlung. Ein negatives Kumulativ-Cashflow-Ergebnis darf nicht als identische abgeschlossene Periodenrendite bezeichnet werden: In Seed42 stecken 17 bezahlte, noch unverkaufte Stücke im Inventar; weder deren Gegenwert noch andere Schiffs- und Unternehmensinvestitionen sind per Verkauf realisiert. Nicht der Positionierung eindeutig zugehörige Flüge bleiben aus dieser Zielrechnung heraus, nicht aus der Weltgeldbilanz.

**Einzelfall:** In Seed42 kauft die Zielpositionierung #11 in Dravos 22 Siliziumeinheiten, verkauft bis Tag6 jedoch nur 5. Einschließlich 91 ISK bezahltem Leerflug und 249 ISK belegter Frachtarbeit beträgt der **Bargeldabfluss der noch nicht abgeschlossenen Zielkette −732 ISK**. Dasselbe System/Produkt wird in benachbarten Zielprognosen mehrfach gleichzeitig angesteuert; dennoch ist aus der zeitlichen Korrelation allein keine individuelle Verdrängungsursache bewiesen. Seed7 hat vollständig verkaufte Ziel-Lose, aber insgesamt ebenso **−723 ISK** Cashflow nach gebuchter Ziel-/Frachtarbeit.

## Geprüfte Ergebnisse bis Tag 6 (zwei Seeds)

| Zielkette | Seed 42 | Seed 7 |
|---|---:|---:|
| Bezahlte gezielte Leerpositionierungen | 14 | 12 |
| Tatsächliche Ankunft am Zielmarkt | 14 | 12 |
| Danach wirklich gekaufte Ware | 9 | 9 |
| Davon prognostizierte Ware gekauft | 7 | 7 |
| Andere Ware nach Zielankunft gekauft | 2 | 2 |
| Zielkäufe mit mindestens einem echten Verkauf | 9 | 9 |
| Bereits vollständig verkaufte Zielkäufe | 8 | 9 |
| Zielreisen ohne anschließenden Kauf | **5** | **3** |
| Unverkaufte Ziel-Ladung zum Ende | 17 Einheiten | 0 Einheiten |
| Konkurrierende offene Prognosen auf dieselbe Station und Ware, paarweise Überschneidungen | 9 | 5 |
| Eigene Prognosen durch spätere Neupositionierung verdrängt | 3 | 1 |

**Interpretation:** Eine Zielankunft, ein dortiger Kauf, ein Ware-Abverkauf und eine rentable, im nächsten Auftrag wiederholbare Lieferkette sind vier unterschiedliche Nachweise. Von insgesamt 26 finanzieren Positionierungen acht **keinen** anschließenden Warenkauf. Der Test kennt derzeit nur den Zustand der bereits erfassten Kaufabsichten; aus einer gleichzeitig offenen Konkurrenzprognose ist noch keine kausale Verdrängung durch einen bestimmten Konkurrenten bewiesen. 17 Einheiten sind in Seed42 weiter als Wareneinsatz gebunden und dürfen weder als realisierter Gewinn noch als endgültig verloren gelten.

**Versorgung und Liquidität (K9y-Gegenkontrolle):** Nach sechs Tagen werden in der gezielten Variante in beiden Seeds jeweils 234 Einheiten neue Nahrung tatsächlich bezahlt, im ursprünglichen Routing hingegen nur 185/134. Die freie Händlerkasse ist in der gezielten Variante 5.732/7.052 ISK, im Original nur 528/35 ISK. Trotzdem kumuliert weltweiter Nahrungsmangel auf 2.013/2.013 Einheiten und betrifft in beiden Seeds alle sechs Verbrauchsstationen. Ein behaupteter gesamtwirtschaftlich stabiler Kreislauf ist damit ausdrücklich **nicht** belegt.

## Methodik und Teststatus

- `tests/bk9z-ziel-chargen-verkaufsbeleg.test.mjs`: ursprünglicher Original-Core im JS-Closure, drei Varianten (Original, K9x ohne Leerflüge, K9y gezielt), Seeds42/7 je sechs Tage; **unabhängiger stündlicher Geld-/Vertragsreserve-/Waren-/Herkunftsaudit**, täglicher Save/Load-Hash, 2-Tage deterministischer Beleg-Replay und 120-Tick Original-Core-Hashneutralität.
- [GitHub Actions #41439582179](https://github.com/tobiasfranziskus/Check/actions/runs/41439582179), erste Beleg-Zuordnung: **129/129 Node-Tests bestanden**, 0 Fehler; das war ein früherer Code-Head `33f0627`.
- [GitHub Actions #41439994059](https://github.com/tobiasfranziskus/Check/actions/runs/41439994059), **Testcode-Head `66ddb0b`**: Node.js 22 **129/129 Tests bestanden**, 0 Fehler. Die strengere Instrumentierung erfasst originale Vertragsnummern und Cargo-Abflug-Snapshots; die Einzelketten-Zahlungen stehen oben. Der vollständige Workflow-Status wird unabhängig geprüft. Der erste Testlauf `33f0627` war ebenfalls grün (129/129), deckte aber bei nachgelagerten Abrechnungen nicht den richtigen Cargo-Snapshot ab und ist **keine** finale Kostenreferenz.
- Noch keine 13×90/365d-Realwelt, kein 40-Perioden-Tragfähigkeitsnachweis, keine reale iPad-/NAS-Abnahme.

## Konsequenz und nächstes Gate

**[ANALYSE]** Die gezielte Neupositionierung bringt in kurzen Original-Core-Welten mehr liquiden Handel und bezahlte Versorgung, beseitigt aber weder die 8 Positionierungen ohne Warenkauf noch die gesamtwirtschaftlichen Endnachfrage-/Stationskapitalprobleme. Ein hypothetischer Marktauftrag muss nach Ankunft **erneut** finanziell und bezüglich Preis, Stückzahl und Absatz geprüft werden; eine reine Startprognose ist nicht gesicherter Warenzugang.

**[OPTION B-K10a]** Vor einer produktiven Routenentscheidung sollten Kaufgelegenheiten/Bestandsänderungen **nach** leerer Anfahrt erneut gegen den vollen echten Kapital- und Flugkostenbeleg geprüft werden. Die 9/5 überlappenden Prognosepaare können nur als Konkurrenzrisiko, nicht als Kausalbeweis, gelten. Denkbare eng begrenzte Folgeanalyse: bewertete Neuplatzierung nur bei einer tatsächlich noch zu bedienenden, kapitalgedeckten Versorgungslücke und einem nach belegten Flügen positiven Cash-Beitrag; Zielstation und Menge müssen am tatsächlichen Kauf nochmals validiert werden. Für einen sinnvollen Produktvorschlag müssen außerdem reale langfristige Warenverfügbarkeit und bezahlte Endnachfrage **gemeinsam** mit Geldverteilung, Frachterersatz und Schiffskapital bewertet werden. Keine stillschweigende Individualrettung oder zusätzliche ISK-Emission.
