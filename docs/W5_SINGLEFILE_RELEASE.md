# Aphros Void – Ein-Datei-Veröffentlichung W0–W5

**[DRAFT bis bestandener CI und vollständiger Veröffentlichung]** Nutzerfreigabe am 10.11.2026: alte Hauptversion sichern und durch aktuelle W0–W5-Version ersetzen. **Auf dem NAS nur `aphros-void.html` überschreiben; keinen neuen Ordner anlegen.** GitHub Pages soll denselben neuen Inhalt direkt unter `https://tobiasfranziskus.github.io/Check/` anbieten.

## Alte Version vor dem Wechsel gesichert

- Der tatsächliche bisherige `main` (`fd3e915448a2f35fa803db709aff9ce223dddc6f`) ist vollständig im unveränderten Branch `backup/main-before-w5-20261110` erhalten.
- Die bisherige Root-`index.html` wird exakt unter `versionen/main-pre-w5-20261110/index.html` archiviert (Git-Blob `b2ab84d5c7d5c177268fe750a6987abdc1825f78`). Vorhandenes Archiv `versionen/v0.12.5/index.html` bleibt unverändert.
- **NAS-Sicherung kann nicht ferngewirkt werden:** Die dort bisher liegende `aphros-void.html` muss vor dem einmaligen Ersatz auf dem NAS selbst oder auf einem externen Speicher unter einem anderen Namen gesichert werden; ihre Bytegleichheit mit GitHubs altem `index.html` ist nicht geprüft. Alte Browser-Saves vor dem Wechsel zusätzlich als JSON exportieren.

## Aktuelle eigenständige HTML

- Neue Root-`index.html` für GitHub Pages und `aphros-void.html` für NAS sind **byteidentisch**, jeweils vollständig allein laufend. Sie bündeln den unveränderten Regel195-Core, 14 JavaScript- und 7 CSS-Dateien aus `prototypes/w5ag/` und seinen Abhängigkeiten. **Keine weiteren Dateipfade, Serverprozesse oder externe Laufzeitbibliotheken.**
- Deterministisch reproduzierbar via `node scripts/build-w5-singlefile.mjs --check`, optional `--write` beim Entwickeln; Node wird im fertigen Browser-Spiel nicht benötigt.
- Im W0–W5-Spielhub spielen: ein gemeinsamer Core für Firmen, echtes Miner-Eis/Erz, bezahlte Fraktionen, W3-Frachterrouten und -Löhne, W4-Material, W5-Schiffbau, Wasserwerk und freiwillige Privateinkommenskäufe, treuhandkorrekte dritte Eislieferung. Freiflug, echtes Docking, Jäger2D und W6-Dauerwirtschaft sind noch **nicht** fertig.

## Historische Tests, Save-Schutz und Grenzen

- Alle bisherigen Regel14-Regressionstests sind weiterhin aktiv, lesen aber nun **explizit die tatsächlich archivierte alte Hauptdatei** (statt irrtümlich neue Rule195-Root-Inhalte als altes Rule14 zu prüfen). Die alte Root-Datei wurde **nicht** modifiziert; die Tests behalten alle bisherigen Bedingungen und Hashes.
- Neue Release-Tests prüfen reproduzierbare Bündelung, Bytegleichheit Pages/NAS, unberührtes altes Git-Archiv und Rule195-Waren-/Geld-/Save-/Hash-Nachweise. Chromium-Touch wird außerdem tatsächlich auf der **eigenständigen `aphros-void.html`** in 4 Größen ausgeführt.
- Es gibt **keine** automatische Migration von Regel14 nach Regel195. Forschungsmodus speichert nicht automatisch dauerhaft; vor Reload immer JSON exportieren. Bestehende IndexedDB-Daten bleiben unberührt und die archivierte alte Hauptdatei bleibt vom gleichen GitHub-Origin erreichbar.
- **Echte iPad-/Safari- und NAS-Abnahme bleibt separat offen**. GitHub-Checks beweisen nicht den Erfolg des tatsächlich eingerichteten Pages-Deployments oder eines NAS-Uploads. Die konkrete Live-Adresse muss nach Merge geprüft werden.

## Veröffentlichungsprotokoll

**CI, Merge, Pages-Sichtbarkeit und Standalone-Test nur als abgeschlossen dokumentieren, wenn sie wirklich nachgewiesen wurden.** NAS lässt sich über die vorhandene GitHub-Verbindung nicht direkt beschreiben; der einmalige Austausch von `aphros-void.html` ist beim Nutzer vor Ort nötig.
