# Raumhafen-Vorschau [DRAFT]

`index.html` direkt öffnen oder das Repository mit einem beliebigen statischen HTTP-Server ausliefern und `prototypes/legacy-station/` aufrufen. Kein Build, Framework, Backend, CDN oder Laufzeitpaket nötig. Die enthaltenen Beispieldaten sind fiktiv; fehlende Wirtschaftsdaten bleiben unbekannt.

Für Einbettung `station.css` und `station.js` laden, einer leeren DOM-Wurzel die Klasse `legacy-station` geben und einmal `LegacyStation.mount(root, snapshot)` aufrufen. Die Instanz bietet `update(nextSnapshot)`, `getSelection()` (Kopie) und `destroy()`. Vor erneuter Montage an derselben Wurzel die alte Instanz abbauen. `update` ersetzt den vollständigen Snapshot; keine Patches, keine Rückschreibungen, keine Commands. IDs und Tab bleiben erhalten, solange vorhanden; entfernte Stationen/Schiffe fallen auf den ersten Eintrag zurück. Stationswechsel wählt das erste angezeigte Schiff, ohne es im Spiel zu aktivieren.

Snapshot-Vertrag und Integrationsgrenzen: [Übernahmebericht](../../docs/LEGACY_STATION_UEBERNAHME.md).

Entwicklungstests (Node 22): `node --test tests/*.test.mjs` aus dem Repository. Optionaler echter Chromium-Touchtest: `PLAYWRIGHT_MODULE=/pfad/zu/playwright CHROMIUM_PATH=/pfad/zu/chromium node tests/legacy-station-touch.cjs`. Playwright ist ausschließlich ein extern bereitgestelltes Entwicklungswerkzeug; keine neue Repository-Abhängigkeit. Optional `SCREENSHOT_DIR` für Bildschirmnachweise setzen. Das Skript startet selbst einen temporären lokalen HTTP-Server und beendet ihn wieder.
