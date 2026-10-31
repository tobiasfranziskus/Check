# B6a – Handelszyklus-Finanzierung, Zahlungsfähigkeit und ungedeckte Arbeit (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] – Messaufbau, vor Ausführung.**
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

**Abnahme erst nach CI:** Kein Lauf, keine Zahl und keine bestandene Prüfung in diesem Dokument darf vor dem tatsächlich erfolgreichen Workflow als ausgeführt bezeichnet werden. Nach Abschluss CI-Link, Jobzahlen, Fehler, tatsächliche Wirtschaftskennzahlen und Grenzen ergänzen.

## Grenzen dieser Stufe

Der erste Schritt ist bewusst ein **reiner Beobachter**. Er untersucht noch nicht die kausale Wirkung neuer Gegenregeln. Der Anteil nachfolgender Frachterkäufe ist nicht automatisch das vollständige Betriebsergebnis; ein positives abgeschlossenes Warenlos deckt weder Hüllenersatz noch das Risiko künftig fehlender Käufer. Die getrennte FIFO-Annäherung ist kein neues Core-Lager-/Finanzbuch.

**Nächste klar isolierte Varianten für B6b [OPTION, nicht beschlossen]:**

- **P – Pausieren:** Arbeit erst beginnen/fortsetzen, wenn ihre fällige Bezahlung tatsächlich verfügbar ist. Sicherstellen, dass keine kostenlose Weiterfahrt oder unsichtbare Arbeitsleistung entsteht.
- **V – Verbindlichkeiten:** fällige, nicht bezahlte Arbeit als reale Schuld buchen; klären, welcher Gläubiger sie hält, wie Tilgung erfolgt und ob neue Kapitalillusion oder Spielstandmigration entsteht.
- **I – Insolvenz und Übernahme:** wirtschaftlich gescheiterte NPCs stoppen, vorhandene Güter und Hüllen mit echter Gegenleistung übertragen; Nachfolger benötigen eigene finanzierte erste Ladung und Folgebetrieb. Keine kostenlosen Schiffe, kein automatischer Rettungsfonds.

Jede B6b-Variante benötigt dieselben 13 × 90 + 4 × 275 Fälle, Preise, Kassen, Zahlungsverteilung, Produktion, Frachterverluste, Aldera-Versorgung, deterministische Audits/Hashes, Save/Load und eine nachvollziehbare Migration. Eine gemeinsame Lösung und das Geldregime sind noch nicht freigegeben. Die unbegrenzte Sparfreiheit des Spielers bleibt Produktvorgabe; kein verdeckter Spielerabfluss.

## Umsetzungsgrenzen

Nur `tools/analyse-b6-*.mjs`, dieser Bericht und der isolierte Analyse-Workflow werden angelegt. **Unverändert:** `index.html`, Preis-/Rezept-/Kampf-/Schiffregeln, UI, Save-/Regel-/Schemaversionen, Referenzfixturen und die Haupt-Roadmap. Kein Merge, keine produktive Regeländerung und kein iPad-/NAS-Deployment.
