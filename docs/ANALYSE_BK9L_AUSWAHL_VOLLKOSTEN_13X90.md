# B-K9l – Originalhandel: reines Vollkosten-Entscheidungsgate im 13×90-Tage-Vergleich

**01.11.2026 · [ANALYSE/ARCHIV] PR #104 – NICHT integriert.**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, **Regel14/Schema8 bleibt unverändert**. Es wurde ausschließlich ein eigenständiges Analyseprogramm auf einem Branch erstellt. Kein Merge, keine produktive Änderung an `index.html`, keine neue Mint-Regel, keine Produktschema- oder Geldmodellentscheidung.

## Anlass und Umfang

[B-K9k #103](https://github.com/tobiasfranziskus/Check/pull/103) zeigte in realen Original-Abflügen 92 Neuware-Starts während der ersten drei Spieltage. **40/92** hätten bei konservativen identischen Hin-/Rückfluglöhnen und einem rein hypothetischen Ersatzanteil 39 ISK keine positive **prognostizierte** Vollkostenmarge gehabt. Deshalb untersuchte B-K9l nur die Originalauswahl `m_core_entscheidung.bestesPaar`: Kann das bestehende Handelssystem durch Zurückweisen dieser vermeintlichen Gewinne messbar stabiler werden?

Die Original-JavaScript-Module werden **ausschließlich innerhalb des Analyseprogramms im Speicher an genau zwei Quellstellen** instrumentiert: Nach dem echten positiven Preis-/Gebühren-`gewinn` greift ein zusätzlicher Vollkosten- und Barkassencheck; bei den unveränderten originalen `betriebskosten` werden tatsächlich verlangte, gezahlte und mangels Geld ungedeckte NPC-Löhne beobachtet. **Die zugrunde liegenden Handels-, Reise-, Produktions-, Kampf-, Waren- und Zahl-/Hashfunktionen sind unverändert.** Weiterhin keine atomare Geldreservierung; später können veränderte Weltpreise den erwarteten Gewinn aufheben.

**Vergleichsvarianten:**

1. **Kontrolle:** unveränderte Original-KI, Handelsmarge nach Gebühren muss positiv sein.
2. **Hinflug + 39 ISK:** zusätzlich konservativ `ceil(Flugminuten × 250 ISK/60 min)` plus **39 ISK hypothetischer Hüllenanteil**, und die NPC-Kasse muss Quellware/-gebühr **sowie** diese zusätzliche Arbeits-/Kapitalreserve vollständig vorhalten.
3. **Hin-/Rückflug + 39 ISK:** gleiche Regel, jedoch zusätzlich ein **zweiter gleich langer hypothetischer Rückflug**. Dieser ist konservative Vergleichsannahme, **keine bereits nachgewiesene notwendige Original-Rückfahrt**. Es entsteht kein tatsächlich gesperrtes Treuhandkonto; die 39 ISK sind eine Rechengröße (780 ISK ursprünglicher Ersatzpreis auf 20 Umläufe verteilt), **keine beschlossene Spielmechanik**.

## Tatsächlich ausgeführte Tests

[GitHub Actions #41348397034](https://github.com/tobiasfranziskus/Check/actions/runs/41348397034): **SUCCESS** auf Test-/CI-Commit `c8bd70b`.

- **67/67** originale Node-Regressionstests bestanden, kein Referenzhash geändert.
- **13 feste Originalspielerkrisen-Seeds** `1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535`, jeweils drei Varianten × **90 Spieltage** = **39 Original-Core-Welten**.
- **84.240** volle Stunden originaler `core.advance(60)`, nach **jeder** Stunde Original-Core- und unabhängiger ISK-/Warenerhaltungstest.
- **234** Schema8-/Regel14-Save/Load-Roundtrips mit identischem kanonischem Hash (Tag1,7,14,30,60,90 in jeder Welt) und **zwei deterministisch identische 14-Tage-Replays** der strengen Variante Seed7, Hash `1260c79c559c158c`.
- Alle Varianten eines Seeds haben den **identischen Anfangs-Hash**, gleiche aktive Spieler-Erzminenkrise und keine neu eingeführte ISK-Emission. Originale Kopfgeldschöpfung und Senken können nach dem Auseinanderlaufen der Weltzustände differieren.

| Tag90 (13-Seed-Median) | Original | Hinflug +39 | Hin-/Rückflug +39 |
| --- | ---: | ---: | ---: |
| Vorhandene NPC1/2-Frachter | **0** | **0** | **0** |
| Fälle mit wenigstens einem NPC1/2-Frachter | **0/13** | **0/13** | **0/13** |
| NPC-Handelsvorgänge | 7.008 | 6.394 | 6.174 |
| Kumulierte Mangelstunden | 35.817 | 35.808 | 35.804 |
| Stationen mit mindestens einem Versorgungsmangel | **6** | **6** | **6** |
| NPC1/2-Barbestand | 0 ISK | 0 ISK | 0 ISK |
| Ungedeckte echte NPC1/2-Arbeitskosten | 28.998 ISK | 27.456 ISK | 23.032 ISK |
| NPC1/2 bezahlte Arbeitskosten | 204.920 ISK | 189.351 ISK | 171.041 ISK |
| NPC1/2 im Spiel ersetzte Hüllen (Median) | 15 | 16 | 16 |
| NPC1/2 Schiffsverluste (Median) | 20 | 21 | 21 |
| Gesamtes Stationscash | 5.238 ISK | 5.383 ISK | 5.742 ISK |
| Spieler-Barbestand | 41.146 ISK | 41.041 ISK | 40.251 ISK |

**[BEWERTUNG DER GESAMTWIRTSCHAFT]**

- Die strenge Auswahl senkt im Median zwar ungedeckte NPC-Händlerarbeit um **5.966 ISK** gegenüber Kontrolle; bei der einfacheren Hinflugvariante verschlechtert die Summe der 13 Seeds sich sogar (**387.154 → 402.009 ISK** ungedeckte Arbeit). Der Vergleich ist **keine** monotone Kostenreparatur.
- Der mediane Mangel ändert sich praktisch nicht (35.817 →35.804 Stunden; **nur 13 Stunden Differenz** auf einem Niveau chronischer Unterversorgung). Bei einzelnen Seeds steigt der Mangel sogar deutlich, z. B. Seed7 **35.993 →36.186** in der strengen Variante.
- **Alle 39 Welten enden mit null NPC1/2-Händlerfrachtern**. Die 13 Seeds bleiben alle von Mängeln an sämtlichen sechs relevanten Verbrauchsstationen betroffen. Ein produktiver Erfolg oder Lösung der Spieler-Spar-Krise wurde **nicht** nachgewiesen.
- Die Testauswahl schließt viele ungünstige Original-Kaufentscheidungen aus, aber **die vorhandenen zufälligen Leerflüge, die Weiterfahrt mit unverkaufter Ladung, die realen stündlichen Löhne, und Original-Schiffsersatz-/Geld-/Stationsfondsregeln bleiben unverändert**. Damit kann unterdeckte Arbeit weiterhin entstehen, auch wenn der ursprüngliche Kauf-Scoringfehler reduziert ist.
- Die originale Route wird vor Start nicht mit echter späterer Preissicherung bezahlt; positive Vollkostenprognosen sind ohne ein atomar finanziertes Geschäft nur Kandidaten. Ein universales Verbot aller Leerflüge könnte die Versorgung noch weiter schwächen; dafür liegt **keine Produktfreigabe** vor.

## Entscheidung und nächster aussagefähiger kleiner Versuch

**[ANALYSE – NEGATIV]** Den vorgeschlagenen B-K9l-Handelsfilter **nicht** als eigenständige Lösung integrieren. Er behebt weder Schiffersatz noch das fehlende regelmäßige zahlungsfähige Nachfragesystem; gleichzeitig mindert er echten Handel.

**[OPTION B-K9m]** Vor einer weiteren Marktmechanik anhand des unveränderten Originals **die tatsächlich begonnenen Arbeitsstunden und NPC-Händler-Liquiditätslücken nach Ursache aufteilen**: bezahltes Handelsgut mit positivem realisiertem Verkauf, zufällige Leerflüge, Weiterleitung nicht verkaufter Ware, Verlust durch Kampf, reale Werftkauf-/Nachschubprobleme. Erst einen einzigen vorher und nachher budgetgedeckten Repositionierungs-/Warenabschluss testen und die Versorgung **gemeinsam mit** NPC-Geld, Hüllen und Gewerbe auditieren. Bei dafür nötiger zusätzlicher Emission ist eine separate Produktfreigabe erforderlich. **Keine Gratisrettungen, kein Limit für Spielersparen, keine Änderung am Grundmodell ohne Ursachennachweis.**

**[REPOSITORY-HYGIENE]** Der Analyse-PR wird nach dokumentierter CI **geschlossen und nicht gemergt**; die ungemergten Testbelege bleiben in geschlossener PR-/Branch-Historie. Die verbindliche Roadmap ist ausschließlich `docs/ROADMAP.md` auf `main`. Auch ein grüner CI-Lauf ersetzt keine iPad-Safari-/NAS-Abnahme.
