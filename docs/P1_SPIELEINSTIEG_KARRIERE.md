# P1 · Spieleinstieg statt Testzugang – Implementierungsbericht

**Status: [DRAFT]**. Entwicklung auf `feature/p1-spielerlebnis-startbildschirm-einfuehrung-20261115`, vom [MAIN] `17090ec6` vom 15.11.2026. Keine Produktmechanik, kein Geldmodell, kein Save-Schema geändert. Ziel ist ein spielbarer, durchgehend bedienbarer Karriereeinstieg ohne manuelle Forschungsdateien und **ohne Abhängigkeit von Codex-J11**.

## Spielerpfad

1. Öffentlicher Root-Einstieg `index.html` bietet als erstes und deutlichstes Element **APHROS VOID SPIELEN · Neue Karriere starten**. Bestehende Jäger-/Konzernlinks bleiben, ebenso der klassische W0–W5-Root. Die NAS-Einzeldatei `aphros-void.html` bleibt bytegleich.
2. `prototypes/spiel/index.html`: atmosphärischer Startbildschirm, `Neue Karriere`, `Karriere fortsetzen`, Datei-Import, separate Backup-Karriere. Kein Netzwerkdienst, keine Bild-CDNs, keine Build-Pflicht.
3. Konzernprolog zeigt nur tatsächlich existente Firmen und Systemrollen: Spieler `house`, Bergbau `npc3`, Aldera, Nadir, `transport`, `werft_extern`. Erzählerische Namen ändern kein NPC-Eigentum.
4. Neue Karriere generiert **originales `W5acSession.create(42,'private195').export()`** und startet über den vorhandenen strengen `J8KonzernSitzung.starten195(json,true)`. Damit gelten alle sechs validierten Original-Übernahmeschritte bis Regel204; **kein vorgefertigtes Test-Jäger-Save, kein freier Startminer**.
5. Spielbare Konzernbrücke: originale, geld- und eigentümerberechtigte Angebote für Miner, Frachter, Jäger, Silizium/Eis, Weltzeit und eigene Flotte. Kleine Aufgabenliste als reine UI-Führung, **ohne** Questgeld, künstliche Waren oder zusätzlichen Spieltick.
6. Über den originalen `J8KonzernSitzung.uebernehmen` und `RaumCockpit.verbinden` wird der legal gekaufte persönliche Miner im vorhandenen 2D-Cockpit gesteuert. Alle Flugbefehle, Fluglohnreserve, Bewegung und Systemzustände bleiben beim originalen Core. Frachterflug wird durch das parallel laufende J11-Projekt entwickelt, **hier nicht eigenmächtig entsperrt**.
7. Die Karriere nutzt zwei **neue, separat benannte localStorage-Schlüssel**: aktuelle Karriere und Vorversion. Alter W0–W5-IndexedDB-Speicher, vorhandene Autosaves und bestehende JSON-Dateien werden weder gelesen noch überschrieben. Expliziter JSON-Export, validierter nur gewählter Regel204-Import und Ablehnung ungültiger Stände sind vorhanden. Kein offline-automatischer Tick. Bei nicht verfügbarem Browser-Speicher bleibt manueller JSON-Export möglich.

## Abnahmegates (vor Merge erforderlich)

- Node22 Gesamtsuite, deterministische Original-Seed42-Einführungs-, Originalgeld- und 600-ISK-Schiffskauf-Nachweise inklusive 40-ISK-Flugreserve, Save-/Load-Audit.
- Browser: Root → Prolog → ursprüngliche Wirtschaftsstartwelt ohne Datei → bezahlter Miner → RAUM-Cockpit → Export → Reload/fortsetzen; ungültige JSON-Datei darf weder den laufenden Zustand noch den separaten Karriere-Slot ersetzen. Chromium und WebKit je vier Touchgrößen (1180×820, 1024×768, 820×1180, 390×844).
- Root-/NAS-Dual-Build per `node scripts/build-w5-singlefile.mjs --check`.
- Originalwirtschaft/Legacy-Spielstände erhalten. Ein **echter iPad-Safari-/privater NAS-Gerätetest** kann durch CI nicht ersetzt werden.

## Integrationsgrenzen

- **Konfliktfrei zu Codex J11:** Keine Änderungen an `prototypes/verbund/**`, `prototypes/raum/**`, `prototypes/j4c/**` und `prototypes/welt/**`. Nur `prototypes/spiel/**`, Root-Navigation + reproduzierbarer Generator, eigenständige Tests und Workflow.
- Die Einführungswelt enthält **keinen fertig finanzierten ersten Jäger aus frischem Regel195**. Unfinanzierte J4-/K7-Versorgung bleibt blockiert.
- Auto-Persistenz bezieht sich nur auf neue Karriere-Schlüssel, nicht auf alte Browser-Spielstände; vor dem erneuten Neu-Start bleibt die alte Karriere in einem eigenen lokalen Backup-Slot und kann per JSON exportiert werden.
- Bei erfolgreicher Abnahme: separaten Integrations-PR auf den aktuellen `main`, Backup, Merge/Pages nur nach Freigabegate. Dieser Feature-Draft ist **nicht automatisch integriert oder veröffentlicht**.
