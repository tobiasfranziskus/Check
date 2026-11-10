# Aphros Void – RC1 zum manuellen NAS-/iPad-Test

**[DRAFT] Nicht das produktive Hauptspiel; kein automatisches Speichern.**

## Bereitstellung nur im getrennten Testordner

1. Das GitHub-Actions-Artefakt **`w5rc1-static-nas-ipad-preview`** des erfolgreich abgeschlossenen [RC1-PR #287](https://github.com/tobiasfranziskus/Check/pull/287) herunterladen. Es erscheint ausschließlich, wenn **Node22- und Chromium-Touchtests erfolgreich** sind.
2. Die ZIP-Datei vollständig in **einen neuen, gesonderten NAS-Webordner** entpacken, z. B. `aphros-w5rc1-test`. **Nie** auf die produktive NAS-Wurzel `index.html` oder bestehende Saves entpacken. Das Archiv enthält absichtlich **keine produktive Root-`index.html`** und kein Produktversionsarchiv.
3. Über Safari auf dem iPad genau die Adresse `https://<NAS-TEST-ORIGIN>/<TESTORDNER>/spieltest/w5-rc1/index.html` öffnen; `http://` bei nicht-TLS-Testserver ist ebenfalls als Test möglich. Platzhalter durch den realen eigenen Host/Ordner ersetzen. Nicht `file://` verwenden. Alle CSS-/JS-Pfade bleiben relativ innerhalb des Pakets.
4. Den „W0–W5-Forschungswelt öffnen“-Link wählen. Finanzierte Befehle und Zeitschritte kontrollieren; für automatisierte Referenzwerte den [W5ak-Bericht](https://github.com/tobiasfranziskus/Check/blob/feature/w5ak-wiederholbare-wirtschaft/docs/W5AK_WIEDERHOLBARE_WIRTSCHAFT.md) bzw. [iPad-/NAS-Abnahmeplan im Docs-Draft #272](https://github.com/tobiasfranziskus/Check/blob/docs/w0-w4-regel18-integrationsstand-20261109/docs/W5AL_IPAD_NAS_ABNAHME.md) verwenden.
5. **Vor jedem Reload, Schließen oder Import Forschungssitzung als JSON exportieren.** Nur Regel195-JSON in dieser Forschung zurückimportieren. Produktive Regel14-Saves weder ändern noch in die Forschung importieren.

## Abnahmetabelle (durch echten Tester ausfüllen)

| Frage | Stand |
| --- | --- |
| iPad-Modell / iPadOS / Safari, Hoch-/Querformat | **NICHT GETESTET** |
| NAS-Modell / Test-Origin / relativer Einstieg / keine 404-Fehler | **NICHT GETESTET** |
| Touch / native Auswahl / 2D-Miner / Förderung / echtes Käufergeld | **NICHT GETESTET** |
| Bis Tick480 2 bezahlte Eisflüge, 25 Wasserkäufe und 0 Mint | **NICHT GETESTET** |
| Treuhandsperre und dritter bezahlter Flug bis Tick720 | **NICHT GETESTET** |
| JSON-Safari-Download, Dateien-App, geprüfter Reimport/Hash | **NICHT GETESTET** |
| Produktive Spielstände und Altversion vorher/nachher unverändert | **NICHT GETESTET** |

**Der RC1 ist noch keine W6-Freigabe.** Die 2D-Mineransicht steuert tatsächlich Erz und Eis, ist aber für die Positionen weiterhin schematisch; manuelles Fliegen und Andocken fehlen. Keine öffentliche Pages- oder `main`-Umstellung aus diesem Download ableiten.
