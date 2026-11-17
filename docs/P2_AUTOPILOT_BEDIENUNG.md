# P2 – Autopilot-Bedienung [DRAFT, Issue #445]

Basis: aktueller `main 4bc436b287b268b4ee949914b829f27703608c9f`, am 17.11.2026 per GitHub-API und anschließend `git fetch origin main` verifiziert. Eigener Branch `codex/p2-autopilot-bedienung-445`. Kein Merge oder Deploy.

## Bedienung und Grenzen

1. `prototypes/spiel/index.html` → Neue Karriere → Karriere starten (Regel204 bleibt Standard).
2. Eigenen Aldera-Miner für **600 ISK** kaufen → Flotte → persönlich übernehmen.
3. Abdocken bindet die originalen **40 ISK** Flugreserve. Ein gesperrter Abflug zeigt die Core-Begründung.
4. Ein Ziel auf der Leinwand oder in der Objektliste wählen. Auswahl allein erzeugt keinen Flugauftrag. Die Zielkarte liegt oberhalb der Leinwand und verdeckt keine Handflugflächen.
5. **Autopilot: Anfliegen** wählen. Die vorhandenen Befehle `shipApproach` bzw. `shipFlyTo` starten den Flug. Der Status nennt Flugmodus, tatsächliches Flugziel und laufende/pausierte Zeit. Das gewählte Ziel steht separat: Eine neue Auswahl ersetzt den laufenden Auftrag erst durch einen Befehl.
6. **Manuell übernehmen** sendet `shipSteer` mit dem aktuellen Sollkurs/Sollschub; der Knüppel bleibt nutzbar. **Stoppen** sendet den bisherigen Nullschub-Befehl und bremst kontinuierlich. **Zeit anhalten** pausiert die Welt und erhält den Flugauftrag.

Orbit mit Radius, Folgen mit Abstand, Aufschalten/Lösen und Andocken verwenden unverändert P2-Core und Sitzungsbrücke. Folgen aktualisiert bewegte Ziele; Anfliegen eines Schiffes bleibt der bisherige Flug zur ausgewählten Position. Zielverlust beendet die Automatik nach den bestehenden Core-Regeln. Kein neuer Regler, keine Physik, Buchung, Save-Migration, Regelversion oder Balanceänderung.

Die Vorschau verwendet `B.angebot` (Original-Sitzungsprüfung). Für den historischen J4c-Einstieg ohne diese Brücke kapselt `RaumSzene.angebot` denselben Original-Core auf einer Save/Load-Kopie. Nur `B.ausfuehren` erreicht den autoritativen Zustand. Vorschauen verändern weder Geld noch Flugschreiber. Beim Ausführen validiert der Core erneut. Keine neu kopierten Legacy-Implementierungen; Katalog und bereits integrierte P2-Muster gezielt geprüft.

48-Pixel-Bedienflächen, Fokusmarkierung, Screenreader-Status und zugeordnete Sperrgründe; 16px-Zahleingaben, seitliche/untere Safe Areas, keine zusätzlichen Animationen. Radius-/Abstandseingaben bleiben über HUD-Ticks erhalten. Die bestehende Reduced-Motion-Behandlung bleibt aktiv.

## Tatsächlich ausgeführte Prüfungen

- Node **22.23.4**, gezielt: `node --test tests/p2-autopilot-sichtbarkeit.test.mjs tests/p2-zielsteuerung.test.mjs tests/raum-szene.test.mjs`: **19/19**, keine Fehler/Skips. Echter HUD mit/ohne Angebotsbrücke, reine Vorschau, Anflugstatus, Auswahl/Flugziel, Pause, Übernahme, Stop, Core-Sperren/Finanzierungsanzeige, ungültiges Ziel, Original-Core-Replay hashgleich. Bestehende P2-Tests prüfen Miner/Frachter/Jäger, bewegte/verlorene Ziele, Save/Load, Geld und Eigentum.
- Vollständige Node22-Regression: abschließender Lauf gestartet; Ergebnis wird vor Übergabe nachgetragen. Frühere Läufe mit Zwischenständen gelten nicht als Abnahme.
- **Chromium (Systembrowser), 4/4**: 1180×820, 1024×768, 820×1180, 390×844, echte Touch-Taps und statisches HTTP. Neuer `tests/p2-autopilot-touch.cjs`: regulärer 600-ISK-Kauf, eigenes `sh002`, bezahlter Originalabflug, Anfliegen, Pause, editierter Orbit, Handübernahme, Stop, freie Touchflächen, kein horizontaler Überlauf, Save/Reload und Core-Audit. Weltgeld **33.000 ISK**, Mint/Burn **0**, eigene Kasse nach Kauf/Reserve **2.360 ISK**. Browser-Endhashes variieren mit der realen Eingabezeit und ersetzen keine deterministischen Referenzen.
- Screenshots für jede Größe: `chromium-autopilot-WIDTHxHEIGHT.png` (Anflug pausiert) und `chromium-WIDTHxHEIGHT.png` (Handflug), im Übergabeordner `/workspace/p2-screenshots`. Keine zusätzlichen Bildassets im Repository. Reproduzierbar mit `P2_SCREENSHOTS=/tmp/p2-screenshots PLAYWRIGHT_MODULE=… CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/p2-autopilot-touch.cjs`.
- **WebKit lokal nicht ausgeführt:** keine Binary vorhanden; separater Installationsversuch endet mit HTTP403 `Domain forbidden`. Entsprechend keine lokalen WebKit-Screenshots oder bestandene WebKit-Matrix behauptet. Neuer Browserlauf ist über `WELT_BROWSER=webkit` ausführbar; vorhandene P1-/J4e-Workflows prüfen beide Engines nach PR-Erstellung.
- `git diff --check` sauber. Originaltests und Referenzwerte unverändert. Root-/Build-/Wirtschafts-/Save-Dateien nicht verändert.

## Gefundene Fehler und offene Abnahme

Der erste neue DOM-Test registrierte dynamische IDs unvollständig; Testinstrumentierung korrigiert. Ein bestehender Architekturtest verbietet direkte Core-Aufrufe im Cockpit: Vorschau im lesenden Szenenadapter gekapselt, bestehender Test anschließend grün. Ein testweise manipulierter Finanzzustand wurde korrekt vom Core-Save-Audit abgewiesen; verworfen, Finanzierungsanzeige separat mit ablehnender Sitzungsbrücke geprüft. Dock-Sperrgründe sind Bestandteil der Render-Signatur, damit veränderte Berechtigungen auch ohne Kassenänderung angezeigt werden.

Offen bleiben physisches iPad Safari, echte Safe-Area-/virtuelle Tastatur-/Hintergrund-Geräteprüfung und privates NAS. Die neue Browsermatrix prüft keinen vollständigen JSON-Import-/IndexedDB-/Pinch-Pfad; diese Wege bleiben Gegenstand vorhandener Regression/CI und werden nicht aus dem neuen Touchlauf abgeleitet. Regel204/207- und Altformat-/Originalhashnachweise stammen aus den jeweiligen Core-Regressionsprüfungen. ChatGPT übernimmt die unabhängige Integration; dieser Draft ist keine Veröffentlichungsfreigabe.
