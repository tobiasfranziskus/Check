# Schiffskauf und Inbetriebnahme – Bedienkorrektur

**Datum:** 29. Oktober 2026  
**Basis:** `main/index.html`, v0.11.1, Commit `9e2820d4329ee888a7e346e8dd1ce4ce235c9c26`  
**Status:** separater Branch, noch nicht veröffentlicht.

## Praxisbefund

iPad-Safari-Abnahme des Nutzers: Markt und Flotte, Mengenbegrenzung, Pausieren/Zeitschritte, Handel und Speichern funktionieren. Nach einem Miner-Kauf erscheint aber kein eigener Miner in der Flottenliste; der Nutzer konnte ihn verkaufen, aber nicht einsetzen.

## Ursache und Reproduktion

Die bisherige Kernmechanik unterscheidet **Schiffsware als Fracht** (`state.ships[traeger].ladung.miner`) von **aktiviertem Schiff** (`state.ships[neueId]`). Ein Kauf via `shipTrade` verändert nur die Ladung. Erst `shipActivate` verbraucht eine Einheit der Schiffsware, erzeugt eine neue Schiff-ID und fügt sie der Flotte hinzu.

Ausgeführter Test mit aktueller `main`:
- Markt im Startsystem bietet `Kaufe 1 Miner (624 ISK inkl. Gebühr) · sh001`.
- Nach Kauf: `sh001.ladung.miner === 1`, weiterhin nur zwei eigene Schiffe.
- Auf dem **Schiffsblatt von sh001** erscheint bereits `Miner in Dienst stellen`.
- `shipActivate` auf sh001 funktioniert: neue eigene Schiff-ID `sh028` im Startzustand, Ware aus Ladung entfernt, Geld-/Waren-Audit erfolgreich.

**Befund:** kein bestätigter Defekt der Aktivierungslogik, sondern fehlende Transparenz und direkter Zugang vom Kaufbildschirm.

## Änderungen

- Markt: Kaufen von Schiffen wird ausdrücklich als **„als Fracht“** gekennzeichnet. Der Benutzer sieht die Schiff-ID des Trägers.
- Markt: Sobald ein angedocktes eigenes Schiff Miner/Frachter/Jäger/Bauschiff als Ware trägt, erscheint neben Kauf/Verkauf der direkte Button **„[Klasse] in Dienst stellen · [Träger-ID]“**.
- Der Button sendet den bestehenden Befehl `shipActivate`; dies ist **kein automatischer Kauf mit Inbetriebnahme**. Auch bei laufender Simulation bleiben Kauf und Aktivierung zwei getrennte Befehle/Ticks.
- Die Markt-Klickbehandlung prüft, dass das ausgewählte eigene Trägerschiff noch im betreffenden System angedockt ist und die Schiffsware noch lädt. Veraltete Buttons erzeugen keinen Aktivierungsbefehl.
- Auch die Schiffsdetail-Kaufangebote schreiben **„als Fracht“**.
- Ein Hilfetext im Markt erläutert das zweistufige Vorgehen.
- Verkauf bleibt weiterhin möglich. Die Inbetriebnahme hängt **nicht** von der Stationskasse oder davon ab, ob die Station das gekaufte Schiff zurückkaufen kann.
- Simulation, RNG, Handels-/Gebührenformeln, Speicherformat, Migrationen und bestehende `shipActivate`-Semantik bleiben unverändert.

## Automatisierte Regressionen

Erweiterung von `tests/handel-ui.test.mjs` um:

1. Vor Kauf kein Aktivierungsbutton; nach Kauf als Fracht sichtbar; direkter Aktivierungsbutton erzeugt korrekt `shipActivate` und neues eigenes Schiff. Geld-/Waren-Audit, Wiederherstellung per Save/Load und Entfernung der Fracht geprüft.
2. Bei leerer Stationskasse ist Verkauf unmöglich, Aktivierung aber möglich.
3. Kauf und Inbetriebnahme im laufenden Spiel über `submit` in **zwei getrennten Ticks**, Audit korrekt.
4. Veraltete Buttons nach Verkauf oder bei Reise des Trägers werden ignoriert.
5. Schiffsdetail-Kaufbutton enthält ebenfalls den Hinweis **„als Fracht“**.

Zusätzlich bleiben die vorherigen 19 Node-Regressionstests (Markt-/Flottenhandel, vollständiger simulierte Start, Schema-/Regelmigration, drei Seeds × 4320 Ticks) erhalten.

## Risiken und Abnahme

- **UI-Änderung**, keine Wirtschaftsparameteränderung; Spielstände mit bereits als Fracht gekauften Schiffen bleiben kompatibel und können nach der Veröffentlichung direkt im Markt aktiviert werden, sofern Trägerschiff und Schiffsware am ausgewählten Standort vorhanden sind.
- Die Aktivierung erzeugt eine neue Schiff-ID, aber keinen automatisch laufenden Mining-Auftrag. Der neue Miner kann danach wie gewohnt in der Flotte befehligt werden.
- Ein aktiver Markt zeigt für mehrere Trägerschiffe pro Schiffsware nur den deterministisch ausgewählten Träger mit dem größten Bestand. Weitere Träger können weiterhin im eigenen Schiffsblatt aktiviert werden.
- Visuelle Prüfung auf iPad Safari im Quer- und Hochformat ausstehend. Lange Kauf-/Aktivierungstexte können umbrechen.
- Bei laufender Simulation wird eine Aktion erst bei der Tick-Ausführung wirksam; unmittelbar nach einem Kauf kann der Aktivierungsbutton daher noch fehlen.

**Merge nach `main` nur nach Freigabe.**
