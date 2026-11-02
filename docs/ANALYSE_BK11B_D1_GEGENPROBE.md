# B-K11b – Testseitige Gegenprobe für den D1-Abrechnungstakt

**[ANALYSE/DRAFT]** 02.11.2026. Gestapelt auf B-K11a [#138](https://github.com/tobiasfranziskus/Check/pull/138) → B-K11 [#137](https://github.com/tobiasfranziskus/Check/pull/137). `main` bleibt `b4e604d6`, v0.12.5/Regel14/Schema8. **Keine Änderung an `index.html` und keine Produkt-/Save-Freigabe.**

## Beleg vor der Gegenprobe

B-K11a-Krisen-CI [41521445768](https://github.com/tobiasfranziskus/Check/actions/runs/41521445768), Job `wirtschaft (crises)`, **erfolgreich**: vier aktive 90-Tage-Krisen, Original-Kern, Kandidat und No-Rescue-Kontrolle (12 Welten), unabhängige stündliche Geld-/Waren-/Escrow-Audits, Hash-Replays, Save/Load. Für den Kandidaten insgesamt **122.148** wegen offenem Vertrag/Restarbeit geblockte Abflugversuche, **122.530** vertragsgebundene Dockminuten, davon **121.445** Versuche mit aktuell genügend freier Flugkasse und **50.126** mit Kasse und irgendwelcher Ladung. Das sind keine 122.148 eindeutigen Aufträge und kein Beweis rentabler Absatzmöglichkeiten.

Der Seed-Matrix-90d-Lauf aus #138 ist separat zu prüfen; er darf nicht als bestanden bezeichnet werden, solange sein finaler Workflow-Status offen ist.

## Isolierte Kausalhypothese

Weltvarianten im bestehenden `tools/bk11-wirtschaft.mjs`: `product` (Regel14/Schema8), `candidate` (unveränderte #137-Finanzierung), `candidate-arrival` (testseitiger D1-Gegenpfad). Beide Kandidaten reservieren echte ISK **vor** dem Abflug und bezahlen den originalen Frachtertarif aus der Reserve. Der Gegenpfad schließt den Vertrag **nach realer Ankunft und vor dem nächsten autonomen Routenentscheid**, also nicht bei Vertragsstart. Bis dahin geleistete Arbeit wird aus Escrow bezahlt. Die Original-`m_core_stunde`-Abrechnung wird für diese schon vergüteten Minuten entsprechend korrigiert, sodass eine doppelte Lohnbuchung verhindert wird. Stündliche kumulierte Ganzzahlrundung wird auch bei mehreren Reisen im selben Stundenfenster als Differenz abgerechnet. Ein Flug über eine Stundengrenze nutzt nach wie vor die Stundenabrechnung für seine erste Teilleistung. Die zugeordneten Zielsystemfonds werden weiterhin tatsächlich bezahlt.

**Experimentgrenze:** Diese Änderung ist ausschließlich eine In-Memory-Quelltransformation des Entwicklungsrunners. Der Zusatz `s.d1Bereits` ist ein Test-Hilfsfeld; seine Save/Load-Fähigkeit ist im Versuch zu prüfen, aber **kein neues freigegebenes Spielstandformat**. Die Zahlungszeitpunkte können Liquidität und Wege verändern. Das Modell ist daher eine **Kausalprobe**, keine sofort produktionsreife Alternative und nicht automatisch ein genehmigtes D1-Vertragsregelwerk.

## Falsifikations- und Abnahmegates

1. Kurzer Seed42-Original-Core-Smoke mit `--probe=arrival`, wahren Core-Belegen, Original-/unabhängigen Audits, unabhängigem stündlichem Hash-Replay und täglichem Save/Load.
2. Je sieben Tage Seeds42/7 sowie vier aktive Krisen zu je 14 Tagen mit drei Varianten; gegenüber `candidate` nur D1-Abrechnung ändern. Tatsächliche Mangelstunden, Warenverbrauch, Deckungsbeiträge, Ersatzkäufe, Verluste und weitere ungedeckte Arbeit **gemeinsam** vergleichen. Kurzläufe sind kein 13×90d-Nachweis.
3. Wenn Kurzläufe sowohl korrekt als auch wirtschaftlich nützlich sind, längere 13×90d-Läufe und historische Krisen gezielt nachführen. Bei negativer oder gemischter Wirkung keine Produktaktivierung und keine Preis-/Lohn- oder Emissionsausweichlösung.

## Reproduzierbare Befehle

```sh
node --test tests/bk11b-d1-ankunft-gegenprobe.test.mjs
node tools/bk11-wirtschaft.mjs --suite=standard --seed=42 --days=7 --probe=arrival --out=/tmp/bk11b42.json
node tools/bk11-wirtschaft.mjs --suite=standard --seed=7 --days=7 --probe=arrival --out=/tmp/bk11b7.json
node tools/bk11-wirtschaft.mjs --suite=crises --days=14 --probe=arrival --out=/tmp/bk11bkrisen.json
```

**Bis zur erfolgreichen CI der aktuellen Commits sind alle Gegenproben offen.** Kein Merge, keine Veröffentlichung, kein Ersatz der verbindlichen Roadmap.
