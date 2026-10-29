# Aphros Void – Testprotokoll: Spielstandmigration und Ladevalidierung

**Stand:** 2026-10-29  
**Basis:** `main/index.html` v0.11.0, Blob `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`  
**Ziel:** Sicherer Migrationspfad vor zukünftigen Regeländerungen. Noch **keine** Änderung der Spielregeln oder der Version.

## Änderungen auf diesem Branch

1. `m_core_serialize.load()` prüft nach bestehenden Schema- und Regelmigrationen die erforderlichen Zustandsobjekte, Pflichtzähler, die Spielerkasse, zentrale Wirtschaftsstatistiken sowie referenzielle System-/Stations-/Schiffdaten. Die Prüffunktion verändert den Zustand nicht.
2. `m_ui_main.einlesen()` versucht bei `regel-alt` zunächst die bereits vorhandenen Kernmigrationen. Bei Erfolg wird vor Übernahme des migrierten Zustands eine Sicherheitskopie des ursprünglichen gespeicherten Stands erstellt (`alt-regel<version>` in IndexedDB). Bei Dateiimport mit laufendem Spiel wird stattdessen der bisherige Spielzustand unter `vor-import` gesichert; die importierte Quelldatei bleibt beim Nutzer.
3. Schlägt diese Sicherheitskopie fehl, wird der alte Zustand **nicht** ersetzt. Die Oberfläche bietet eine Datei-Sicherung an. Nicht migrierbare Altstände bleiben im bisherigen Schutz-/Neustartdialog; neuere Stände werden weiterhin abgewiesen.
4. `einlesen()` ist daher asynchron; die Aufrufer bei Import und Start warten auf das Ergebnis. Erfolgreich migrierte gespeicherte Stände werden mit aktueller Version erneut gespeichert.

## Tatsächlich ausgeführte Tests

### Kern und Simulation (isolierte JavaScript-Ausführung der echten index.html)

- **Syntax:** gesamter Inline-JavaScript-Block erfolgreich geparst.
- **Frischer Spielstand:** Save/Load und Waren-/Geldaudit erfolgreich.
- **Regelmigration 6→7:** aus v0.11.0-Zustand mit testweise rückgesetzter `rulesVersion`; Zielregelversion erreicht.
- **Schemamigration 7→8:** aus v0.11.0-Zustand mit rückgesetztem `schema` und entfernten `herkunft`-Feldern; alle Produktionslinien mit `herkunft` migriert.
- **Ungültige Daten:** fehlender Spieler-Owner, fehlende Station und ungültige Schiffssystem-Referenz werden von `load()` abgelehnt.
- **30 Tage passiv:** 43.200 echte Simulationsschritte, Geld- und Warenaudit erfolgreich.
- **Vier Seeds (1, 42, 1234, 98765):** Jeweils sieben Spieltage Erzabbau mit unverändertem `main` und Fix-Version unter identischen Bedingungen ausgeführt. **Hash identisch**; Geld- und Warenaudit in allen vier Fix-Läufen erfolgreich.
- **Save/Load-Hash:** für alle vier sieben-Tage-Läufe unverändert.
- **Synthetische Regelmigration 6→7 nach sieben Tagen:** resultierender Hash entspricht dem regulären Regel-7-Zustand.

### Ladeoberfläche (isolierter `einlesen()`-Test mit simulierten UI- und IndexedDB-Schnittstellen)

- Älterer gespeicherter Stand (Regel 6) wird **erst nach erfolgreicher Original-Backup-Schreibung** übernommen; migrierte Regel 7 und Zeitstempel korrekt.
- Simulierter Fehler bei `dbPut`: keine Übernahme, Sperre bleibt aktiv und Dialog `Migration nicht gesichert` erscheint.
- Import eines alten Spielstands über laufenden Stand: bisheriger Spielzustand wird unter `vor-import` gesichert.
- Aktueller Stand: Laden ohne Migration und ohne zusätzliche Backup-Schreibung.
- Neuerer Regelstand: wird abgewiesen.
- Beschädigter Spielstand ohne Spieler-Owner: Dialog `Spielstand beschädigt`.
- Nicht unterstützter älterer Regelstand: bleibt im Altstanddialog.

**Wichtig:** Für die älteren Speicherstände wurden regel-/schemavariierte **synthetische Testzustände** verwendet. Es standen keine historischen echten Browser-Spielstände aus älteren Releases zur Verfügung. Die UI-Tests verwendeten kontrollierte Stubs für IndexedDB und Dialoge; sie sind **keine ausgeführten iPad-Safari-End-to-End-Tests**.

## Vor Zusammenführung manuell auf dem iPad prüfen

1. **Zuerst** den vorhandenen Spielstand über `Export als Datei` sichern und Datei aufbewahren.
2. Mit einem separaten Test-Spielstand aktuelle Version speichern, Seite schließen und wieder öffnen: Spielstand, Uhrzeit, Bilanz und Spielbefehle unverändert.
3. Falls vorhanden: echten älteren Spielstand aus einer noch unterstützten Regelversion importieren; prüfen, ob er erhalten bleibt und die Migration die ursprünglichen Daten wahrt.
4. Testen, dass ein fremder/neuerer Spielstand nicht überschrieben wird; beschädigte Datei darf die bestehende Partie nicht ersetzen.
5. Nach Migration Browser schließen/öffnen, dann erneut speichern und exportieren; bei Safari-Hintergrundwechsel und fehlendem Speicherplatz die Fehleranzeige kontrollieren.
6. Optional über den Browser-Entwicklungszugang nachsehen, ob `alt-regel<version>` oder `vor-import` als Sicherung im IndexedDB-Store `saves` vorhanden ist. Diese Backups haben derzeit **noch keine eigene Wiederherstellungsoberfläche**.

## Risiken / offene Punkte

- Die neue Validierung ist bewusst eine **Mindeststrukturprüfung**, kein vollständiger semantischer Spielstandvalidator. Für echte Altstände mit sonstigen Inkonsistenzen können zusätzliche gezielte Prüfungen erforderlich sein.
- Bestehender Autosave-Code kann überschneidende Speicheranforderungen überspringen (`speicherLaeuft`); dies ist ein separates, bereits dokumentiertes Persistenzthema. **Nicht** im vorliegenden Fix enthalten.
- Die KI-Tests ersetzen keinen Safari-Test und liefern keine Zusage allgemeiner Fehlerfreiheit.
- Versionsnummer und Wirtschaftsparameter wurden absichtlich nicht verändert. Das Jagdbalancing folgt separat nach Freigabe.
