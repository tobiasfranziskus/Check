# Aphros Void – Marktangebote an ausführbare Handelsmengen anpassen

Datum: 2026-10-29  
Basis: `main/index.html`, internes v0.11.1, Commit `daa0b93a5b53f71822052acb597322db8d80c655`, Blob `dd6d9d887daa91bc57646c9b7494e6beb7b2a4f6`.

## Problem und reproduzierte Ursache

Der Markt zeigte für normale Waren starr `Kaufe 10` bzw. `Verkaufe 10` und für Schiffsartikel `Kaufe 1`, ohne die tatsächliche Ausführbarkeit der Menge zu prüfen. Die bestehende automatische Schiffsauswahl aus PR #10 prüfte bereits den Frachtraum, aber weder Spieler-/Stationskasse noch verfügbare Bestände nach Stationsreserve oder den verbleibenden Stationslagerplatz.

Reproduziert im aktuellen `main` mit kontrollierter JavaScript-Ausführung und echtem `shipTrade`:
- Spielerkasse auf 50 ISK gesetzt, Basispreis Erz 10 ISK: Button `Kaufe 10 × Erz (104 ISK inkl. Gebühr)` blieb vorhanden, Handel wurde mit `Handel nicht möglich ...` abgelehnt.
- Spielerfrachter hat 10 Erz geladen, Stationskasse auf 50 ISK reduziert: Button `Verkaufe 10` blieb vorhanden, aber die Station kann nur 5 Erz zum aktuellen Preis bezahlen; Ausführung wurde abgelehnt.

## Lösung

Nur `m_ui_markt_ansicht` in `index.html` geändert:

- Für den Kauf die **größte Menge von 1 bis 10** (Schiffsware weiterhin genau 1) suchen, die die Stationsreserve respektiert, **inklusive Handelsgebühr** bezahlbar ist und für die ein eigenes Schiff mit entsprechendem freien Frachtraum vorhanden ist. Bei 0 verfügbarer Menge kein Kaufbutton.
- Für den Verkauf die Menge auf `min(10, Bestand des gewählten Frachters, aufnehmbar)` begrenzen; die bestehende Core-Funktion `aufnehmbar` berücksichtigt Stationskasse und Lagerkapazität. Wenn die Station nichts annehmen kann, keinen Verkaufsbutton zeigen.
- `m_core_index.verkaufbar`, `aufnehmbar` und `gebuehr` werden wiederverwendet. Keine Preisformeln dupliziert; keine Regel-, Migrations- oder Speicherformatänderung.
- Vorheriger PR #10 für feste Schiffszuordnung bleibt unberührt. Preise inkl. Gebühren/Nettoerlöse aus PR #9 gelten für die nun angezeigte Menge.

## Tatsächlich ausgeführte Tests

Isolierter vollständiger JS-Modulsatz mit simuliertem DOM; echte `m_core_commands.execute`-Buchungen:

1. **Normalfall unverändert:** 10 Erz kosten exakt 104 ISK und werden korrekt gebucht, Geld-/Warenbilanz stimmt.
2. **Unzureichendes Spielergeld:** Vorher abgelehnter 10-Erz-Kauf bei 50 ISK; nachher 4 Erz für 41 ISK, tatsächlich ausgeführt.
3. **Spielerkasse 0:** Keine Kaufbuttons für Erz oder Jäger, Preisübersicht bleibt sichtbar.
4. **Reserve:** Station hat nur zwei Erz oberhalb der Reserve; Kaufbutton bietet genau 2 Erz und Handel wird ausgeführt.
5. **Nur Reservebestand:** Kein Kaufbutton für Erz.
6. **Stationskasse 50 ISK:** Vorher ungültiger Verkauf von 10 Erz; nachher Verkauf von 5 Erz für 48 ISK netto, Gutschrift identisch.
7. **Stationslagerkapazität 3 Einheiten frei:** Verkauf bietet 3 Erz an, Handel wird ausgeführt, Lager endet exakt an Obergrenze.
8. **Frachtraum:** Miner hat nur zwei Einheiten frei, Frachter drei; Kauf von 3 Erz wird dem Frachter zugewiesen und ausgeführt.
9. **Schiffsware Jäger:** Bei Kasse 935 kein Button, bei 936 genau ein Jägerkauf; 936 ISK abgebucht.
10. **Laufende Simulation:** Handelsbefehl über UI eingespeist, in Queue aufgenommen und beim nächsten Simulationtick erfolgreich ausgeführt.
11. **Determinismus:** Seeds 42, 1234, 98765 jeweils 4320 Ticks, Zustands-Hashes gegenüber `main` identisch; Geld- und Waren-Audit erfolgreich.
12. **Regression:** Ganzes Inline-JavaScript syntaktisch geprüft; Kernmodule unverändert; Startfix, Querformat, aufklappbare Handelsbefehle, Schiff-IDs bleiben enthalten.

## Auswirkungen und Risiken

- Rein darstellungs- und UI-seitige Mengenbegrenzung. Die Handelsmechanik rechnet unverändert mit den übermittelten Mengen.
- Wenn zwischen Rendern und tatsächlicher Ausführung durch den nächsten Simulationtick die Welt geändert wird, kann ein zuvor gültiger Befehl weiterhin scheitern. Das ist korrekt; der Simulationskern muss alle Befehle erneut prüfen.
- In den Schiffsdetails (Flotten-Reiter) werden bislang feste Handelsmengen weiterhin angeboten. Die Korrektur betrifft bewusst nur den Markt, um die Änderung klein zu halten.
- Wenn ein Artikel nicht kaufbar oder verkaufbar ist, wird der betreffende Aktionsbutton ausgeblendet. Die Preiszeile bleibt immer sichtbar. Dies spart Platz, kann aber für Spieler ohne Erklärung zunächst ungewöhnlich sein.
- Synthetisch veränderte Kassen/Lager/Frachträume in den Grenzfalltests wurden **nicht** als natürliche Wirtschaftsverläufe ausgegeben. Das sind reproduzierbare Testzustände für UI-/Core-Befehle.
- **Kein echter Safari-/iPad-End-to-End-Test**; öffentliche Veröffentlichung erst nach Merge und GitHub-Pages-Erfolg.

## Empfohlener iPad-Test

1. Spieler-Geld nach Einkäufen knapp werden lassen. Im Markt prüfen, ob die vorgeschlagene Kaufmenge sinkt beziehungsweise kein Kaufbutton mehr erscheint.
2. Frachter mit Erz beladen; verkaufen; Nettoerlös und tatsächliche Gutschrift vergleichen.
3. Mit zwei Schiffen prüfen, dass die korrekte Schiff-ID weiterhin am Button steht.
4. Quer-/Hochformat und die aufklappbaren Schiffsdetails kurz prüfen.
