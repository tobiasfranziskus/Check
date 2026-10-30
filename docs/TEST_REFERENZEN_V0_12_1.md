# Aphros Void – v0.12.1: feste Referenzabsicherung für die Sicherheitswelt

**Stand:** 30. Oktober 2026 · [PR #21](https://github.com/tobiasfranziskus/Check/pull/21) (Draft, auf [PR #19](https://github.com/tobiasfranziskus/Check/pull/19)).

## Bestätigtes Problem

Im Sicherheitszonen-Branch `3cff288aa75c2c072c210298e9f81fb7b92a4ec7` wurde der bisherige feste Wirtschaftsreferenz-Vergleich in `tests/reisen-silizium.test.mjs` durch einen Abgleich zweier Läufe derselben Version ersetzt. Damit wurden deterministische, aber veränderte Simulationsergebnisse nicht erkannt. Die v9-Fixwerte von PR #18 gelten für eine andere Weltkonfiguration und können v10 nicht absichern.

## Herkunft der fixierten Werte

Die 13 Seeds `7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159` wurden im unabhängig vom PR-#19-Quellbranch ausgeführten 90-Tage-Basiskontrolllauf des Geografie-Vergleichs [GitHub Actions #41012578973](https://github.com/tobiasfranziskus/Check/actions/runs/41012578973) erfasst (job `123921545028`). Dieser Lauf lud den unveränderten PR-#19-Commit `3cff288` über `git show`, instrumentierte lediglich die Beobachtung von Handel und ungedeckten Betriebskosten und schrieb Hashes an Tag 3/30/90. Die so erfassten Daten sind **einmalig** in `tests/fixtures/economy-security-v10.json` fixiert worden und werden beim Testlauf nicht neu erzeugt.

Die anschließende Prüfung erfolgt bewusst auf anderem Weg: Der aktuelle **uninstrumentierte** Simulationskern wird mit `advance` statt `step` auf denselben Zustand gebracht. Zu jedem Fixpunkt muss er den bereits fixierten externen Hash erreichen. Ein zweiter instrumentierter Durchlauf prüft 13×90 Tage nach jedem Stundenabschluss die Core-Audits und eine separat formulierte Geld-/Warenbilanz; zusätzlich werden Verkäufe, Mangelstunden, Produktion, Betriebskostenlücken, Verluste und Kassen gegen die fixierten Werte geprüft.

Diese getrennten Ausführungswege und die im Voraus fixierten Sollwerte schützen vor zufälligen Referenzänderungen und vielen Regressionen. Sie sind **kein** Beleg dafür, dass der ursprüngliche v10-Simulationscode unabhängig neu implementiert oder wirtschaftlich optimal ist.

## Tatsächlich ausgeführte CI-Prüfung

[GitHub Actions #41014113729](https://github.com/tobiasfranziskus/Check/actions/runs/41014113729), Code-Commit `9ea6720`, Node 22:

- Standardtests: **43 bestanden, 0 fehlgeschlagen, 0 übersprungen**. In `tests/reisen-silizium.test.mjs` werden Seed 7, 11 und 42 nach Tag 3 wieder gegen fest hinterlegte externe Hashes geprüft.
- Langlauf: **13 Seeds × 90 Tage**, alle Referenzhashes an Tagen 3/30/90 und sämtliche fixierten Schlusskennzahlen getroffen; stündliche Core- und zusätzliche Bilanzen, separate Wiederholung mit uninstrumentiertem Code sowie Save/Load-Roundtrip bestanden.
- Ergebnis: Median Mangelstunden 304, Summe 4.000, NPC-Frachterverkäufe insgesamt 282.891, ungedeckte NPC1-Betriebskosten 12.506 ISK, Siliziumförderung 417.877 Einheiten.
- `index.html`, Systemgeografie, Spielstandformat und Regelversion bleiben unverändert. `main` bleibt unverändert.

## Grenzen und Integration

Das ist die **v10-Referenzabnahme für PR #19**, keine Freigabe der Nadir-Änderung (Regelversion 11 in PR #20) und keine iPad-Safari-/NAS-End-to-End-Prüfung. Für v11 sind eigene feste Referenzen notwendig. Der derzeitige Langlauf-Job überspringt v10-Fixwerte bei anderen Regelversionen ausdrücklich.

Keine neuen Wirtschaftsregeln oder Balanceparameter, kein Merge, keine Veröffentlichung. PR #21 muss vor einer wirtschaftlichen Integrationsfreigabe von PR #19 überprüft und ausdrücklich zur Übernahme freigegeben werden.
