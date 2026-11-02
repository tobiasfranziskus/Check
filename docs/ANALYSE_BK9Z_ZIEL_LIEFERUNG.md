# B-K9z – Zielprognose bis zum echten Warenverkauf

**[ANALYSE/DRAFT · 02.11.2026]** [PR #117](https://github.com/tobiasfranziskus/Check/pull/117), gestapelt auf #116 → #115 → #114 → #113 → #112 → #111 → #110 → #109 → #108. **[MAIN]** bleibt `b4e604d6`, v0.12.5, Regel14/Schema8. Nur neue testseitige Analyse; keine Änderung der produktiven `index.html`, Preis-, Lohn-, Rezept-, Emissions-, Save- oder Insolvenznegeln.

## Fragestellung

B-K9y zeigt in zwei jeweils sechs Spieltage langen Regel15-/Schema9-Draft-Simulationen, dass eine gezielte, aus wirklichen Vertragsreserven finanzierte NPC-Leerpositionierung zusätzlich bezahlte Nahrungskäufe ermöglicht, aber auch Marktrisiken verursacht. B-K9z untersucht **nicht erneut eine weitere Handelsregel**, sondern prüft, was mit den bereits ausgelösten, real bezahlten Zielreisen geschieht. Der gesamte Original-Core bleibt unverändert, die Beobachterinstrumentierung wird nur in einer getrennten Testkopie eingefügt.

Pro Zielentscheidung werden unabhängig beobachtet: erwartete Ware, wirkliche Leerfahrt/Vertrag, tatsächliche Stationsankunft, wirklicher Kauf und Einkaufsgebühr, anschließende Verkäufer-Gegenbuchung nach FIFO des Frachter-Losbestands, Verkaufsgebühr, real aus dem Vertrag abgegoltene Positionierungs-/Frachtausgaben, unverkaufte Restmengen und zeitgleich offene konkurrierende Kaufprognosen.

**Sicherheitsgrenze der Kostenrechnung:** Die tatsächlichen Vertragssummen werden über ihre Original-Vertragsnummer zugeordnet; für eine Ladung zählt die **beim Abflug vorhandene, unveränderliche Warenmenge**, nicht der möglicherweise erst nach dem Entladen stündlich gebuchte, dann schon geleerte Laderaum. Gemischte Fracht wird mengenanteilig zugeschrieben; diese Zuordnung ist eine **analytische Kostenzuordnung**, keine eigenständige Geldbuchung oder bereits bewiesene Vollkostenmarge. Kauf-/Verkaufsbuchungen selbst sind reale Original-Core-Transaktionen. Kosten aus Schiffsanschaffung, Wartung, Risiken und nicht erfassten Lieferungen werden nicht still als null ausgegeben.

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
- Der Folge-Head `66ddb0b` ordnet zeitversetzte Flugzahlungen erstmals durch Original-Vertragsnummer und Cargo-Abflug-Snapshot zu. **Seine eigene CI und die finalen Einzelgeschäfts-Kostenwerte sind separat abzunehmen**; die alte CI darf nicht als Bestätigung der neuen Kostenverteilung ausgegeben werden.
- Noch keine 13×90/365d-Realwelt, kein 40-Perioden-Tragfähigkeitsnachweis, keine reale iPad-/NAS-Abnahme.

## Konsequenz und nächstes Gate

**[ANALYSE]** Die gezielte Neupositionierung bringt in kurzen Original-Core-Welten mehr liquiden Handel und bezahlte Versorgung, beseitigt aber weder die 8 Positionierungen ohne Warenkauf noch die gesamtwirtschaftlichen Endnachfrage-/Stationskapitalprobleme. Ein hypothetischer Marktauftrag muss nach Ankunft **erneut** finanziell und bezüglich Preis, Stückzahl und Absatz geprüft werden; eine reine Startprognose ist nicht gesicherter Warenzugang.

**[OPTION B-K10a]** Bevor eine produktive Routenlogik zur Entscheidung gestellt wird, sollen die mehrfach um dieselbe Marktchance konkurrierenden Positionierungen und die unvollendeten Zielkäufe im gleichen unveränderten Core anhand ihrer realen Geldströme isoliert verglichen werden. Für einen sinnvollen Produktvorschlag müssen außerdem reale langfristige Warenverfügbarkeit und bezahlte Endnachfrage **gemeinsam** mit Geldverteilung, Frachterersatz und Schiffskapital bewertet werden. Keine stillschweigende Individualrettung oder zusätzliche ISK-Emission.
