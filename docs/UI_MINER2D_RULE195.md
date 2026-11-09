# UI-Miner2D · Regel195 [DRAFT]

Basis: geprüfter W5ag-Spielhub [#280](https://github.com/tobiasfranziskus/Check/pull/280), Head `500669a01ba94589a5f6e343a884833a2184d3fa`. Eigener Branch `feature/ui-miner2d-rule195`, [Draft-PR #282](https://github.com/tobiasfranziskus/Check/pull/282), Ziel ausschließlich `research/w5ag-spielintegration-20261109`. Verbindliche [main-Roadmap fd3e9154](https://github.com/tobiasfranziskus/Check/blob/fd3e915448a2f35fa803db709aff9ce223dddc6f/docs/ROADMAP.md) und AGENTS.md geprüft. Der parallele W5ai-Branch wird weder abgerufen noch geändert.

## Start und Bedienung

Repository statisch ausliefern und `prototypes/w5ag/index.html` öffnen. **2D-Miner** wählen, eine echte 600-ISK-Hülle kaufen, eigenes Schiff anhand seiner ID auswählen. **Erz fördern** oder **Eis fördern**, anschließend **1/10/50 Minuten arbeiten**. Diese Knöpfe bewegen die ganze gemeinsame Welt, einschließlich NPCs. Zwischen Schritten ist sie pausiert. **Stoppen / abrechnen** beendet den Förderauftrag; bestehende Erzverträge werden vom Core abgerechnet. Eine begonnene Aktion oder geförderte Ware ist noch kein Erlös.

Beispiel mit Seed42 ab Neustart: Miner kaufen → Erz fördern → 10 Minuten → Fracht 10 Erz, Erlös 0 → stoppen → Fracht 0, tatsächlich 100 ISK Erlös. Danach Eis fördern → 10 Minuten → 10 Eis an Bord; JSON exportieren/importieren → viermal 10 Minuten → stoppen. In dieser Folge bleiben 50 Eis an Bord, weil das vorhandene Stationskapital anderweitig gebunden ist. Das ist kein Bedienfehler und erzeugt keine UI-Vergütung. Der ursprüngliche, vollständig bezahlte Eis-/Wasserablauf aus [W5ag](W5AG_SPIELINTEGRATION.md) bleibt separat erfolgreich getestet.

HQ, Karte, Stationsansicht und Miner teilen dieselbe Sitzung. Kamera drehen und Zoom ändern nur die Anzeige. Die Schiffsauswahl im Cockpit und die vorhandene globale Auswahl bleiben synchron. Eigene Schiffe werden über IDs angesprochen, Textausgaben über `textContent` gesetzt. Die Karte zeigt alle Core-Schiffe, Systeme, Ziele und die echte 60-Minuten-Route Aldera–Nadir; bei reisenden Schiffen ist `system` das gespeicherte Ausgangssystem, `ziel` der Zielort, keine interpolierte Position.

Frachtanzeige summiert vorhandene Ladung, Kapazität kommt aus den Regeln. Ressourcenanzeigen unterscheiden Bordladung, Stationslager und tatsächliche Core-Förderzähler. Erlöse, Kosten, freie und gebundene Kasse stammen aus dem Core-Finanzbericht; das Bilanzergebnis enthält den Kaufpreis. Die zwei Frachtpiloten-Konten bleiben ausdrücklich getrennt vom Minereigentümer. Kein eigener persönlicher Minerlohn wird erfunden.

## Wiederverwendung und Save-Schutz

`miner.js` ist eine lesende Projektion mit Bedienanbindung an die bestehende W5ac-Sitzung im Regel195-Profil. `shipMine`, `shipWait`, `shipBuy`, `advance`, `select` und der bereits auditierte Import/Export bleiben die einzigen Wege. Drei optionale Hooks im gemeinsamen W5w-App-Modul binden nur bei vorhandenem W5ag-Miner-Modul Zeichnen, Darstellung und Ereignisse ein. Andere Profile laden das Modul nicht.

Der bestehende Legacy-Canvasrenderer `prototypes/w5u/ship-graphics.js` wird unverändert wiederverwendet: Minerform, Station, Ressourcen, Core-tickgesteuerter Förderstrahl, Frachtbogen, Drehung/Zoom. Layoutkoordinaten sind ausdrücklich schematisch und werden nie gespeichert oder als Simulationsposition verwendet. Kein zweiter Core, keine neue Flugphysik, keine Wirtschafts-/Preis-/Lohn-/Warenänderung, keine Schema-/Regeländerung und keine neue Laufzeitabhängigkeit.

Reload startet wie bisher eine neue isolierte Forschungswelt; vorher JSON exportieren. Produktive IndexedDB-/localStorage-Slots und die produktive `index.html` bleiben unberührt. Import bleibt auditierter Kandidatenaustausch. Kein neuer automatischer Speicherweg.

## Konkrete fehlende Core-Voraussetzungen

- `m_core_befehl.validieren` im Original-Core sperrt `shipMove` im `rules.erzpilot`-Profil. Ein existierender Legacy-Reisebefehl ist damit **kein** zulässiger Regel195-Miner-Stationswechsel. Die Sitzung schaltet ihn ebenfalls nicht frei.
- Keine autoritativen 2D-Positionen, Geschwindigkeit, Ausrichtung oder validierten Schub-/Bremsbefehle im Regel195-Minerzustand. Freiflug benötigt separat beauftragte Core-Befehle, deterministische Tickintegration und Save-/Replay-Unterstützung.
- Kein eigener Dock-/Undockbefehl oder räumlicher Andockbereich. Bergbau läuft im Original-Core in `phase: dock`; dies wird sichtbar so angezeigt. Manuelles Docken benötigt eine echte Core-Zustandsmaschine, Eigentums-/Orts-/Auftragsprüfungen und auditierte Übergänge.
- Miner-Stationswechsel benötigt eine für dieses Profil freigegebene, vollständig finanzierte Reise einschließlich laufender Verträge und Ladung. Keine Umgehung über den nur für gekaufte W5-Frachter erlaubten `shipReposition`-Befehl. Die vorhandenen Fracht-/Überführungsoberflächen bleiben nutzbar.
- Ressourcenfelder besitzen System und Ware, aber keinen endlichen Restbestand und keine räumlichen Koordinaten. Keine erfundenen Entfernungen, Reichweiten, Reserven oder Erschöpfungsanzeigen.

Diese Voraussetzungen sind Folgearbeit am Core; dieses UI liefert die tatsächlich unterstützte Fördersteuerung zuerst. Es behauptet keinen frei fliegenden Miner.

## Abnahme

Aktuelle Ergebnisse werden nach Abschluss der Läufe unten erfasst. Tests verändern nur frische Forschungswelten.

- `tests/ui-miner2d-rule195.test.mjs`: Seeds42/7, deterministischer Doppelreplay, echter Teil-Erzabbau und bezahlte Abrechnung, echter Eisabbau ohne Scheinverkauf, Mid-Mining-Save/Load, read-only Projektion/Vorschau, zwei eigene Hüllen/IDs, fremdes Schiff und gemischte Fracht abgewiesen, gesperrter Original-`shipMove` bleibt zustandsneutral.
- `tests/ui-miner2d-touch.py`: vier Chromium-Touchgrößen 1180×820, 1024×768, 820×1180, 390×844; derselbe echte Ablauf über Cockpitknöpfe, Herkunft/Finanzierung durch JSON geprüft, Kamera/Navigation ohne Zustandsänderung, Save/Load während Förderung, synchrone Auswahl, Touchhöhen mindestens 48px, kein horizontaler Seitenüberlauf. Screenshots `/tmp/ui-miner2d-*.png`; CI archiviert sie.
- Geerbte `tests/w5ag-touch.py` und `tests/w5ac-touch.py`: bezahlter W0–W5-/Eis-/Wasser-/Lohnablauf sowie Regel191-Kompatibilität und Frachterüberführung.
- **Echte iPad-Safari-Abnahme OFFEN:** Hoch-/Querformat und schmale Ansicht, native Auswahl, Touch, Zoomregler, JSON-Download/Import und Wiederaufnahme am Gerät.
- **Reale NAS-Abnahme OFFEN:** statische HTTP(S)-Auslieferung aller relativen Dateien, Safari-Save/Import/Export am tatsächlichen Origin. Lokaler Python-Testserver ist kein NAS-Nachweis.
- Kein Merge, kein Pages-/Produktrelease und kein Deployment. GitHub-CI-Status gesondert nach tatsächlichem Lauf beurteilen.

### Tatsächlich lokal geprüft · 09.11.2026

- Node **v22.23.4**, vorgeschriebener Aufruf `node --test tests/*.test.mjs`: **35/35 Dateigruppen bestanden**, 0 Fehler, 0 Skips, 133,5 Sekunden. Keine Referenzhashes oder geerbten Node-Tests geändert.
- Zusätzlicher vollständiger Node22-Lauf mit `--experimental-test-isolation=none`: **193/193 Einzeltests bestanden**, 0 Fehler/Skips, 143,5 Sekunden; einschließlich geerbter 13×90d-/365d-Regime.
- Neue gezielte Miner-Tests: **2/2 Einzeltests bestanden**, einschließlich Seeds42/7, deterministischer Replays, echter Core-Förderung/Abrechnung, fehlender Käuferfinanzierung und Save/Load.
- Chromium-Touch: neuer Miner-Test **4/4**, geerbter W5ag-Test **4/4**, geerbter Regel191/W5ac-Test **4/4**. Neuer Cockpit-Screenshot visuell geprüft. Kein JavaScript-Seitenfehler oder horizontaler Seitenüberlauf in den geprüften Ansichten.
- iPad Safari und reales NAS **nicht ausgeführt**. Diese Ergebnisse sind keine Gerätefreigabe und keine Wirtschaftsnachhaltigkeitsprüfung.
