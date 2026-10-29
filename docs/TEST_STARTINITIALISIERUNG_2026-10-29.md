# Aphros Void – Startfehler, Smoke-Test und Korrektur

Datum: 2026-10-29  
Ausgangsstand: `main/index.html` v0.11.1, Blob `94334309827cd7a2aced9da5999ac6ec6172623e`

## Gemeldetes Problem
In der öffentlichen Spielversion ließ sich die Pause nicht beenden. Auf dem Flotten-Reiter ließen sich keine Schiffe öffnen.

## Bestätigte Ursache
`m_ui_main.kopfAktualisieren()` rief `spielstandZeichnen()` ohne Argument auf. Die vorhandene Funktion `m_ui_hq.spielstandZeichnen({ gespeichertUm, letzterExport, jetzt, tick, dauerhaft })` verwendet Destrukturierung ohne Standardwert. Der Aufruf löst beim ersten Rendern einen **TypeError** aus und verhindert, dass der folgende `starten()`-Aufruf erreicht wird. Dadurch bleibt `bereit=false`; die Spielzeitumschaltung ist wirkungslos und die Flottenliste wird nicht befüllt.

## Korrektur
Genau ein Aufruf in `kopfAktualisieren()` wird ersetzt:

```diff
-  spielstandZeichnen();
+  spielstandZeigen();
```

`spielstandZeigen()` ist die bereits vorhandene Hilfsfunktion im selben Modul, die `spielstandZeichnen()` mit vollständig befülltem Datenobjekt aufruft. Keine neuen Funktionen, keine Änderung an der Simulation, keine neuen Abhängigkeiten.

## Tatsächlich ausgeführter Test
Die vollständige unveränderte HTML-JavaScript-Datei und die korrigierte Variante wurden mit simuliertem DOM, MatchMedia, requestAnimationFrame und asynchronem IndexedDB in einer JavaScript-Laufzeit ausgeführt. Der Test erfasste Event-Handler und beobachtbare UI-Zustände.

**Vorher (main):**
- JavaScript-Ausnahme: `TypeError: Cannot destructure property 'gespeichertUm' of 'undefined' as it is undefined.`
- Stack: `spielstandZeichnen → kopfAktualisieren → anzeigen`; der UI-Start wird abgebrochen.

**Nachher (Fix):**
- Kein Startfehler.
- Initiale Statusanzeige: „Pausiert“; HQ-Kasse: „2 000 ISK“.
- Klick auf `1×` setzt Anzeige auf **„Läuft 1×“** und `aria-pressed=true`.
- Flotten-Reiter wird eingeblendet; Schiffsliste enthält echte `data-schiff`-Einträge.
- Klick auf `sh001` öffnet das Schiffsblatt mit Titel **„Miner sh001“**.
- Klick auf `1 Stunde` führt 60 Simulationsschritte aus; Anzeige **„Tag 1 · 01:00“**.
- Vollständiger Inline-JavaScript-Block vor Commit syntaktisch geprüft.

**Testgrenze:** DOM/IndexedDB wurden simuliert, kein echter Browser oder Safari auf dem iPad ausgeführt. Sichtbare Veröffentlichung erst nach Merge in `main` und erfolgreichem GitHub-Pages-Deployment.

## Risiko und nächste Schritte
- **Änderungsrisiko gering:** ein Funktionsaufruf, keine Regel- oder Zustandsänderung.
- Mögliche unabhängige Restprobleme: Ältere oder beschädigte automatisch gespeicherte Browserstände können über den bestehenden `sperre`-Pfad weiterhin explizit einen Neustart verlangen. Diese Situation ist nicht die hier reproduzierte Ursache.
- Nach Freigabe in `main` übernehmen, GitHub-Pages-Deployment prüfen und auf dem iPad eine kurze Bedienprobe (Pause aufheben, Flotte öffnen, ein Schiff anklicken, 1 Stunde laufen lassen) durchführen.
- Bereits offene Gebührenkorrektur (PR #6) bleibt unverändert und wird **nicht** mit diesem Hotfix vermischt.
- Die statische sichtbare Versionsbeschriftung bleibt auf ausdrücklichen Nutzerwunsch unverändert.
