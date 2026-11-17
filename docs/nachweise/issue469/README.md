# Ausführungsnachweise Issue469

Node v22.23.4, 17.11.2026. Alle Endläufe stammen vom Forschungsstand mit strenger Profilpflicht und letzter Minereigentumsprüfung. `quellhashes.txt` enthält ursprüngliche Git-Blob-IDs und abschließende SHA256 der sechs Implementierungs-/Testquellen.

| Datei | Bedeutung |
| --- | --- |
| `node22-final.log` | Endlauf `node --test tests/*.test.mjs`, vollständige Regression |
| `gezielt-final.log` | Endlauf `node --test tests/rohstoff-forschung.test.mjs`, 4/4 bestanden |
| `profil-A.jsonl` | Vollständiges A: 13×90 und S02 zusätzlich 365/730 |
| `vergleich.jsonl` | Vollständiger Vergleich B/C/alt mit denselben 13 Regimen und S02-Checkpoints |
| `replay-A-S02.jsonl` | Separater zweiter 730-Tage-A-S02-Lauf; vollständiges CLI-Resultat per deepEqual mit erstem Lauf verglichen |
| `vorversuch-A.jsonl`, `vorversuch-vergleich.jsonl` | **Unvollständige abgebrochene Vorversuche** vor Profilanpassung: A mit Erz/Eis 100/1/1/1 Tag, B 100/1/1/2 Tage. Nur die tatsächlich enthaltenen Zeilen gelten als ausgeführt. S02-A (90/365/730) bleibt bei 200 Erz/0 Eis/0 Silizium/0 Jägern. Keine vollständige Matrix behauptet. |
| `node22.log` | **Abgebrochener Sandbox-Erstlauf**, Prozessfehler `spawnSync EPERM`, keine grüne Gesamtprüfung; danach Wiederholung mit funktionsfähigen Kindprozessen |
| `node22-voll.log` | Fehlerauszug des **abgebrochenen Zwischenlaufs** vor Profilpflicht-/Eigentumskorrektur; zugunsten abschließenden Gesamtlaufs beendet |
| `gezielt.log` | **Fehlgeschlagener Zwischenlauf (2/4)**, vor den beiden obigen Korrekturen; durch gezielt-final ersetzt, nicht nachträglich grün editiert |

`alt` bezeichnet den unveränderten Regel207-P8h-Pfad (kein R1-Feldkonto). Alle CLI-Läufe starten denselben originalen Seed42 mit 33.000 ISK, Originalkapitalverteilung und ausdrücklich aktivierten vorhandenen NPC-/Materialoptionen. Bis zu drei Jägerkäufe sind echte 900-ISK-Spielerkäufe, kein neues Käuferprogramm. JSONL-Mengen sind Core-Wareneinheiten, nicht ungeprüft Tonnen. `verkauft.erz` ist **Exportmenge**, nicht mehrfach gezählter Zwischenhandel; Eis und Silizium sind Original-Erstverkaufszähler. Kristall hat keinen aktiven finanzierten Produktionspfad und bleibt 0. Original-Geldaudit sowie unabhängiger physischer Lager/Cargo-Abgleich werden spätestens alle 30 Tage und bei 365/730 geprüft. Jeder Audit prüft einen bitgleichen JSON-Save/Load-Roundtrip.

Browser-, Touch-, echtes iPad-, NAS- und Deploy-Gates wurden für R1 nicht ausgeführt; keine Browser-Spieloberfläche geändert oder hinzugefügt. GitHub-CI wird separat durch den Draft-PR angestoßen; lokale Logs sind kein CI-Erfolgsnachweis.

Endlauf: tests 519, pass 519, fail 0, cancelled 0, skipped 0, duration_ms 602722.062159; Prozess-Exit 0. Alle 52 CLI-Szenarioläufe sowie der unabhängige A-S02-Replay ebenfalls Exit 0.

CI-Portabilitätskorrektur nach dem 519/519-Lauf: Die vier gezielten Tests wurden nach Ersatz der Git-Historienabhängigkeit durch unabhängig erzeugte SHA256-Referenzen erneut bestanden. Core/CLI und ihre Simulationshashes unverändert; `gezielt-final.log` und abschließende Quellhashes beziehen sich auf diese portable Testfassung. Referenzerzeugung: `node tools/rohstoff-referenz.cjs` benötigt Historie und gibt nur JSON aus.
