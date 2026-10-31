# B6a – Handelszyklus-Finanzierung, Zahlungsfähigkeit und ungedeckte Arbeit (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] – Messaufbau und ausgeführte CI-Abnahme.**
Basis ist der gepinnte GitHub-main-Commit `d454d0661dee48a7bfdb843d05096982d799e51f` (v0.12.5, Regel 14, Schema 8). Die verbindlichen Produktziele und Phasen stehen ausschließlich in [ROADMAP.md](ROADMAP.md). Kein neuer Wirtschaftsmechanismus wird durch diesen Analyse-PR freigegeben.

## Fragestellung

Ein positiver nomineller Waren-Spread nach Gebühren ist **keine** vollständige Zyklusfinanzierung. Ein NPC-Frachter braucht reale Kaufkraft für die Ladung, muss die Reise- und sonstige Arbeitszeit zahlen können, den Verkauf an eine zahlungsfähige Station abschließen und danach eine neue Ladung finanzieren. Bei Verlust oder Ausfall der Hülle sind Material, Werft, Kaufpreis und Reserven zu berücksichtigen. Gemeinsame Konzernkassen können zudem Minerersatz gegen Frachterfinanzierung verdrängen.

**Bestätigter Produktcode (keine neue Testaussage):**
- `m_core_entscheidung.bestesPaar()` berücksichtigt Warenpreise, Gebühren, Zielbedarf und Reisezeit, aber keine verpflichtende Deckung der kompletten Lohn-/Ersatzkosten.
- `m_core_stunde.betriebskosten()` berechnet Sollkosten und überträgt nur den Kassenbetrag `min(cash, kosten)`. Ungedeckte Differenz bleibt nicht als Schuld im Spielstand gespeichert; B5a bezahlt bereits angefallene Flug-Arbeit auch unter Auftrag halten.
- `m_core_schiffbau.ersatzkauf()` kauft und aktiviert verfügbare Werfthüllen real, verspricht aber keine Deckung der nachfolgenden Ladung und Arbeitsstunden. B5b hält den Sollplatz dauerhaft fest.
- Die Analysen #32–#34, #36–#41 sowie #44/#45/#48 zeigen voneinander getrennte Liquiditäts-, Transport- und Piratenrisiken. Diese Analysen sind **nicht** als Produktregeln integriert.

## Messaufbau und Sicherungen

1. **Unveränderter Kern:** `tools/analyse-b6-zyklus.mjs` lädt ausschließlich die produktive `index.html` auf Regel 14. Beobachter werden in exakt geprüfte Anker eingesetzt. Der Simulationszustand muss zu jedem Stundenende denselben Hash wie eine zweite Ausführung ohne Beobachter besitzen. RNG, Core-Reihenfolge und Befehle bleiben identisch.
2. **Regel-14-Standardwelt:** 13 historische Seeds × 90 Tage; 1.170 tägliche Hashes, 28.080 Stundenprüfungen. Historische 90-Tage-Mangel- und Händlerverkaufsgoldenwerte werden **verglichen, nicht neu geschrieben**.
3. **Vier reale Spielerkrisen:** B1-Starts nach 90 Tagen unter historischem Regel-12-Hash prüfen; gezielt nach Regel 14 migrieren; identische gültige Spielerbefehle fortsetzen bis Tag 365. Vier × 275 Tage ergeben 1.100 weitere Tageshashes und 26.400 Stundenprüfungen. Regel-/Schema-Migration und Roundtrips erhalten.
4. **Kassen- und Warenrechnungen:** Unabhängige Geld- und Lager-/Fracht-Audits je Stunde. Tatsächliche Ladungskäufe, Verkäufe, Gebühren, Soll-/Ist-Arbeitszahlung, Unterdeckungsereignisse, bezahlte Hüllenaktivierungen, Schiffsverluste, Folgekäufe derselben Schiff-ID und Aldera-Silizium/Bauteile je Fall dokumentieren.
5. **Auswertung:** `tools/analyse-b6-summary.mjs` prüft die Vollständigkeit aller 17 Dateien und erstellt eine Tabelle und maschinenlesbare Daten. Auf GitHub Actions werden zusätzlich alle vorhandenen Standardtests ausgeführt.

**[TEST/CI]** Auf dem unveränderten Code-Head `1b5a0b6bfb28aae5c02b91d621ad3ade9ff181a8` erfolgreich abgeschlossen: [B6a-Workflow #41177182205](https://github.com/tobiasfranziskus/Check/actions/runs/41177182205), **19/19 Jobs erfolgreich**, davon 13 passive Seeds, historische B1-Startrekonstruktion, vier Krisenfälle und Synthese. In der Synthese **67/67 Node-Tests bestanden**, 0 Fehler/Skips; 2.270 Tageshashes, 54.480 stündliche unabhängige Audits/bit-identische Replay-Hashes, 220 Save/Load-Roundtrips. Die unveränderten historischen Regel-14-Referenzen ergeben 791 Mangelstunden und 310.058 reguläre NPC-Trader-Frachterverkäufe. Ein vorheriger Versuch auf dem ursprünglichen PR-Head scheiterte an einer Namenskollision der neuen Beobachter-Verlustliste; diese wurde vor dem erfolgreichen Prüflauf korrigiert. Der Produktcode blieb unverändert.

### Gemessene Ergebnisse B6a

| Gruppe | NPC-Trader-Frachter-Warenverkäufe | Folgekäufe nach Verkauf durch dieselbe Schiff-ID (alle NPCs) | Soll-Arbeitskosten (ISK, alle NPC1–3) | Real bezahlt | Nicht bezahlt |
| --- | ---: | ---: | ---: | ---: | ---: |
| Passiv, 13 × 90 Tage | 310.058 | 225.968 | 46.337.480 | 46.321.390 | **16.090** |
| Vier B1-Spielerkrisen, 4 × 275 Tage | 0 | 72 | 21.813 | 17.363 | **4.450** |

Die vier B1-Fälle (**miner, handel-flotte, station, jagd**) haben an Tag 365 jeweils **0 NPC1- und 0 NPC2-Frachter**. Auch NPC3 besitzt am Ende in allen vier Fällen **0 Frachter** und Aldera **0 Silizium / 0 Bauteile**. Von den vier ursprünglichen B1-Frachtern überlebt **keiner**. Die Folgekäufe verteilen sich auf 4 / 57 / 6 / 5; die ungedeckten Kosten auf 0 / 433 / 4.017 / 0 ISK. Das ist ein technisch reproduzierter **wirtschaftlicher Misserfolg**, keine Produktfreigabe.

**Messgrenzen:** 0 NPC-Trader-Verkäufe bezieht sich auf die Handelskonzerne mit `kind='trader'`; die 72 protokollierten Folgekäufe schließen den separat betrachteten NPC3-Frachterhandel ein. Zyklen und Eigentümerkassen sind nicht austauschbar. Gezählt wird der erfolgte Kauf nach einem Verkauf derselben Schiff-ID; dies garantiert nicht, dass Verlust-, Leerfahrt- und Hüllenersatzkosten gedeckt wären. Die Artefakte `b6a-gesamt` enthalten vollständige Falltabellen und maschinenlesbare Ausgangsdaten. Dieser Erfolg prüft **keine** Insolvenz-, Pause- oder Schuldenregel und keine reale Safari-/NAS-Auslieferung.

**Produkturteil:** Kostenunterdeckung und fehlender Wiederanlauf bleiben trotz bestandener Core-Prüfungen offen. Die einzige verbindliche Roadmap wird damit nicht um eine neue Produktregel erweitert.

## Grenzen dieser Stufe

Der erste Schritt ist bewusst ein **reiner Beobachter**. Er untersucht noch nicht die kausale Wirkung neuer Gegenregeln. Der Anteil nachfolgender Frachterkäufe ist nicht automatisch das vollständige Betriebsergebnis; ein positives abgeschlossenes Warenlos deckt weder Hüllenersatz noch das Risiko künftig fehlender Käufer. Die getrennte FIFO-Annäherung ist kein neues Core-Lager-/Finanzbuch.

**Nächste klar isolierte Varianten für B6b [OPTION, nicht beschlossen]:**

- **P – Pausieren:** Arbeit erst beginnen/fortsetzen, wenn ihre fällige Bezahlung tatsächlich verfügbar ist. Sicherstellen, dass keine kostenlose Weiterfahrt oder unsichtbare Arbeitsleistung entsteht.
- **V – Verbindlichkeiten:** fällige, nicht bezahlte Arbeit als reale Schuld buchen; klären, welcher Gläubiger sie hält, wie Tilgung erfolgt und ob neue Kapitalillusion oder Spielstandmigration entsteht.
- **I – Insolvenz und Übernahme:** wirtschaftlich gescheiterte NPCs stoppen, vorhandene Güter und Hüllen mit echter Gegenleistung übertragen; Nachfolger benötigen eigene finanzierte erste Ladung und Folgebetrieb. Keine kostenlosen Schiffe, kein automatischer Rettungsfonds.

Jede B6b-Variante benötigt dieselben 13 × 90 + 4 × 275 Fälle, Preise, Kassen, Zahlungsverteilung, Produktion, Frachterverluste, Aldera-Versorgung, deterministische Audits/Hashes, Save/Load und eine nachvollziehbare Migration. Eine gemeinsame Lösung und das Geldregime sind noch nicht freigegeben. Die unbegrenzte Sparfreiheit des Spielers bleibt Produktvorgabe; kein verdeckter Spielerabfluss.

## Umsetzungsgrenzen

Nur `tools/analyse-b6-*.mjs`, dieser Bericht und der isolierte Analyse-Workflow werden angelegt. **Unverändert:** `index.html`, Preis-/Rezept-/Kampf-/Schiffregeln, UI, Save-/Regel-/Schemaversionen, Referenzfixturen und die Haupt-Roadmap. Kein Merge, keine produktive Regeländerung und kein iPad-/NAS-Deployment.
