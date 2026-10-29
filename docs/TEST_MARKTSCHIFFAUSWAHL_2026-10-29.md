# Aphros Void – Markthandel: Schiffsauswahl je Ware

Datum: 2026-10-29  
Ausgangsstand: `main/index.html` v0.11.1, Commit `8e7966bc01442dc719edb1ec4e5368c700db8979`, Blob `c6b6dff8cceecf0295989dc0e531a7e2ff990347`  
Status: geprüfter PR-Branch, **nicht in `main` veröffentlicht**.

## Problem

Der Markt verwendete für alle Käufe und Verkäufe stets dasselbe angedockte Schiff: das mit der geringsten Gesamtladung. Ein leerer Miner (`sh001`) konnte dadurch ein Erzangebot eines beladenen Frachters (`sh002`) verdecken. Ein Kauf konnte ebenfalls am fehlenden Platz des ausgewählten Schiffes scheitern, obwohl ein anderes Schiff noch Frachtraum hatte.

**Reproduktion:** Startzustand Seed 42, 10 Erz auf `sh002` gekauft, `sh001` bleibt leer. Vor der Korrektur wird im Markt **kein Erz-Verkauf** angezeigt, obwohl `sh002` die Ware geladen hat.

## Lösung

Nur `m_ui_markt_ansicht` in `index.html` geändert:

- `dockSchiffe` bestimmt für das ausgewählte System nur eigene, angedockte Schiffe.
- `handelsschiff` wählt je Ware und Aktion:
  - **Kauf:** Schiff mit mindestens der benötigten freien Ladekapazität, davon das am geringsten beladene. Gleichstand: kleinste Schiff-ID.
  - **Verkauf:** Schiff mit mindestens einer Einheit der Ware; von diesen das mit dem höchsten Bestand der Ware. Gleichstand: kleinste Schiff-ID. Pro Klick werden weiterhin maximal zehn Einheiten verkauft.
- Jeder generierte Kauf-/Verkaufsbutton enthält `data-schiff`, und die angezeigte Schiffs-ID ist Teil des Buttons. Bei Klick wird exakt dieses Schiff verwendet, statt erneut pauschal nach Gesamtladung auszuwählen.
- Markt-Kopf zeigt jetzt `Schiffe im Dock` mit Anzahl und Spieler-Kasse, nicht eine scheinbar universelle Einzel-Schiffs-ID.
- Wenn kein Schiff für eine Kaufmenge Platz hat, wird kein entsprechender Kaufbutton angezeigt. Verkaufsbuttons anderer Schiffe bleiben verfügbar.
- Gebührenausweis (Brutto-Kauf und Netto-Verkauf) aus PR #9 bleibt identisch.

## Tatsächlich ausgeführte Tests

1. **Vorher:** Originalfehler reproduziert: Frachter `sh002` mit 10 Erz, Miner `sh001` leer; kein Verkaufsbutton.
2. **Nachher:** `Verkaufe 10 (96 ISK netto) · sh002`; Klick sendet `shipTrade` mit `schiff:'sh002'`; tatsächliche Gutschrift 96 ISK, Waren-/Geldaudit korrekt.
3. **Zwei verschiedene Waren:** Erz auf `sh002`, Jäger auf `sh001`. Der Markt ordnet die Verkaufsaktionen jeweils dem richtigen Schiff zu.
4. **Kauf bei vollem Miner:** `sh001` künstlich mit 100 Erz befüllt, `sh002` frei. Jägerkauf wird `sh002` zugewiesen; tatsächliche Abbuchung 936 ISK.
5. **Alle Schiffe voll:** Kein Jäger-Kaufbutton; Erz-Verkauf bleibt verfügbar, deterministischer Gleichstand führt zu `sh001`.
6. **Unterwegs/fremd:** Nicht angedockte und fremde Schiffe werden für eigene Verkäufe nicht ausgewählt.
7. **Simulation:** Drei Seeds (42, 1234, 98765), jeweils 4.320 Ticks. Identische Zustands-Hashes gegenüber unverändertem `main`; Waren-/Geldaudit korrekt.
8. **Regression:** Gesamtes Inline-JavaScript syntaktisch geprüft; Start-Hotfix, Querformatmenüs und Gebührentexte bleiben vorhanden.

**Testgrenzen:** HTML-Ausgabe und Event-Handler wurden in einer isolierten JavaScript-Laufzeit mit simuliertem DOM geprüft. Kein echter iPad-Safari-/visueller Browser-End-to-End-Test. Die synthetisch volle Schiffsladung in Test 4/5 diente nur der Auswahlprüfung; diese Testzustände wurden nicht als Wirtschaftssimulation ausgewertet.

## Technische Auswirkungen und Risiken

- Nur Markt-UI-Code; keine Änderung der Handelsformel, des Simulationskerns, des Speicherformats oder der Wirtschaftsparameter.
- Anzeigen und Aktion sind jetzt auf dieselbe Schiff-ID gebunden. Wenn das Schiff bis zur Befehlsausführung nicht mehr angedockt oder seine Ladung verändert ist, kann die vorhandene Kernvalidierung den Handel weiterhin ablehnen. Das ist korrekt und schützt vor stiller Umleitung auf ein anderes Schiff.
- Kaufbuttons werden nur nach vorhandenem Frachtraum gefiltert, **nicht** nach Stationsreserve oder Spieler-Kasse. Bestehendes Verhalten bei fehlendem Geld/Bestand bleibt erhalten; es handelt sich um keinen umfassenden Verfügbarkeitsvalidator.
- Button-Texte enthalten die Schiff-ID und sind etwas länger; Umbruch im iPad-Quer- und Hochformat prüfen.

## Empfohlene Safari-Abnahme

Im Markt mit Miner und Frachter im selben System:
1. Per Frachter eine Ware kaufen; im Markt überprüfen, dass `Verkaufe` den Frachter kennzeichnet.
2. Verkauf ausführen und Rückgang der Frachterladung/Gutschrift kontrollieren.
3. Zweite Ware mit Miner oder anderem Schiff kaufen und prüfen, dass beide Verkaufsbuttons zu den passenden Schiffen gehören.
4. iPad ins Hochformat drehen; keine überlappenden Schaltflächen oder horizontales Scrollen.
5. Pause, Zeitsteuerung und aufklappbare Schiffsmenüs kurz nachprüfen.
