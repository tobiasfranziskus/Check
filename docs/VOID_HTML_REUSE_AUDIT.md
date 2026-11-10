# Legacy-Audit `void.html` vor F1 – Flug, Grafik und Steuerung

**[ANALYSE / NICHT INTEGRIERT · 10.11.2026]**

Ziel: Vor F1 gezielt feststellen, welche Teile der alten `void.html` für den neuen 2D-Flug wiederverwendbar sind. Das ist eine Bestandsaufnahme, keine Freigabe alter Spielregeln.

## 1. Quellen und aktueller Stand

- Geprüfte Quelle: persönliche Projektbibliothek `void.html`, 915.361 Bytes, dort am 30.10.2026 angelegt. Die Datei liegt **nicht** als `void.html` im Root des aktuellen GitHub-`main`; die Untersuchung bezieht sich ausdrücklich auf den Library-Snapshot.
- Aktueller Produkt-`main`: `04124f2bca27dc33b54be30c07b6a7bbb7387e81` (nach dem Abschluss von PR #289).
- Claudes F0-Flugkern: Quellcommit `8deaab072c55308caa422a7724990ae2aa608c18`; unabhängige Review-Fassung PR #290, Head `a12a3d00f216f066cd97178926ac3ad52119ecce`.
- PR #290 ist weiterhin Draft und nicht integriert. Sein Review-Branch basiert auf `7374b29`, liegt gegenüber aktuellem `main` einen Commit zurück und muss vor F1 aktualisiert werden.

## 2. Ergebnis: Was sich lohnt

| Bereich | Alte Funktionen / Fundstelle | Empfehlung |
|---|---|---|
| Schiffsgeometrie | `SG_SHAPES` (ca. Z. 1160): `rookie`, `interceptor`, `cruiser`, `prospector`, `courier`, `hauler`, `exhumer`, `miner`, `trader`, `hunter`, `pirate` | **Wiederverwenden.** Polygonformen als reine Grafikdaten auf Miner/Frachter/Jäger abbilden. |
| 2D-Sprites | `sgPolygon()`, `sgSprite()`, `sgShip()` (ca. Z. 1165–1175) | **Wiederverwenden/adaptieren.** Offscreen-Canvas, Sprite-Cache, Farbvarianten, Schiffsdetails und Triebwerksspur. Neuer Renderer liest ausschließlich den F0-Flugzustand. |
| Raumhintergrund | `sgStars()`, `sgSkyInit()`, `sgSky()` (ca. Z. 1160–1165) | **Wiederverwenden.** Der lokal gesetzte Seed und die Parallax-Ebenen sind reine Darstellung. Keine Verbindung zum Core-RNG. |
| Darstellung/HUD | `draw()` (ab ca. Z. 1177) | **Selektiv übernehmen.** Zielrahmen, Auswahl, Entfernungen, Beschriftungen und passende Effekte. Nicht die komplette alte Funktion mit dem alten Weltobjekt kopieren. |
| Touch-/Pointer-Muster | `txHit()`, `txFlyPoint()` (ca. Z. 3859–3865), `vt01Down/Move/Cancel/Up()` (ca. Z. 4869–4895) | **Muster wiederverwenden.** Pointer Capture, Pointer-Cancel, Mehrfingererkennung, Zoom, Trefferprüfung, Kontextschutz und explizite Bestätigung. Neu an F0-Befehle und den aktuellen UI-Zustand anbinden. |
| Kamera | `GridRenderer.rotate()`, `zoom()`, Pointer-Gesten (ca. Z. 4800–4890) | Für eine spätere optionale Beobachtung nützlich; nicht Voraussetzung für F1. |

Die alte Datei enthält außerdem einen separaten 3D-WebGL-Renderer (`GridRenderer`). Er wird für F1 **nicht** übernommen: Das Ziel ist ein persönlich steuerbares 2D-Schiff, und die bestehende Produktarchitektur soll nicht ohne gesonderte Entscheidung um eine 3D-Ansicht erweitert werden.

## 3. Was ausdrücklich nicht übernommen wird

| Alte Funktion | Technischer Befund | Entscheidung |
|---|---|---|
| `mv()` (ca. Z. 1067) | Fließkomma-Bewegung, `dt`-abhängige Glättung, `Math.hypot`, `Math.atan2` | Nicht übernehmen. Kein plattformübergreifend festgelegter Ganzzahl-Integrator. |
| `steer()` (ca. Z. 1074) | Alte Autopilotlogik für `goto`, `appr`, `orb`, `warp` | Nicht übernehmen. Nur UX-Ideen für Anflug/Orbit als Referenz nutzen. |
| `tick()` (ca. Z. 1081) | Vermischt Bewegung, Wirtschaft, Kampf, Module und NPC-Takt | Nicht übernehmen. Verstößt gegen die gewünschte Trennung. |
| `dock()` / `apply()` (ca. Z. 1066–1135) | Sofortiges Andocken, Entladen, Reparatur/Reset und alte Befehlssemantik | Nicht übernehmen. F0 besitzt eine explizite An-/Abdock-Zustandsmaschine und validierte Core-Befehle. |
| Warp-/Energiepfad | Alte Warp- und Modulmechanik mit Energieverbrauch | Nicht übernehmen. Kein Bestandteil des normalen F1-Raumflugs. |
| Alte Welt-, Netzwerk- und Speicherhülle | Globale Zustände, alte Entity-IDs, WebRTC/Signalisierung und eigene Save-Logik | Nicht übernehmen. Kein zweiter Weltzustand und keine parallele Befehls-/Speicherarchitektur. |

Wichtige Klarstellung: Die alte Datei bietet **keinen vergleichbaren manuellen Analog-Joystick**. Ihre freie Bewegung wird im Wesentlichen über Zielauswahl und Autopilotbefehle ausgelöst. Claudes F0-Sandbox hat bereits einen 168-px-Steuerknüppel, direkte Kurs-/Fahrtbefehle und Touch-/Tastaturbedienung.

## 4. Warum F0 die Grundlage bleibt

F0 verwendet eine eigene, von der alten Simulation getrennte Ganzzahl-Kinematik:

- 60 deterministische Flugteilschritte je bestehender Core-Minute.
- Spieler und NPC benutzen dieselben validierten Befehle und denselben Integrator.
- Kein Geld, keine Ware, kein Treibstoff, kein RNG und keine Wandzeit im Flugkern.
- Position, Geschwindigkeit, Kurs, Anflug und Andocken sind auditierbarer Zustand; JSON-Save/Load ist auch während des Flugs vorgesehen.
- Der unabhängige F0-Review meldet 11/11 isolierte Flugtests, 217/217 Gesamt-Node22-Tests sowie 4/4 Chromium- und 4/4 WebKit-Viewportprüfungen mit demselben Referenzhash. Das ist kein Nachweis für echtes iPad Safari oder die spätere 13×90-Leistung.

Die alte Grafik kann auf diesen Kern aufsetzen, nicht umgekehrt. Eine dünne Render-Adapter-Schicht übersetzt F0-Felder wie `x`, `y`, `kurs` und `vx/vy` in die Eingaben der Darstellung. Render-Interpolation, Partikel und Wandzeit bleiben strikt außerhalb von Zustand, Hash und Core.

## 5. Gates vor F1

1. **F0-Review aktualisieren:** PR #290 auf aktuellen `main 04124f2` bringen; die dortigen Hinweise auf PR #289 als noch offenen Draft sind nach dessen Abschluss überholt.
2. **F1 eng halten:** Flugkern als getrenntes, opt-in Forschungsprofil integrieren. Regel195 muss ohne Flugprofil bitgleich bleiben. Keine stille Migration, keine Ortskopplung an Förderung/Verkauf und keine Änderung der Wirtschaft in diesem Schritt.
3. **Grafik separat anbinden:** Zunächst nur Schiffsformen, 2D-Sprites, Sternenhimmel und passende HUD-Elemente aus `void.html` übernehmen. Keine alte Physik oder alte Weltobjekte.
4. **Touch nicht doppeln:** F0s bereits getesteten Steuerknüppel und Befehle als Basis behalten. Aus `void.html` nur robuste Pointer-/Auswahl-/Zoom-Muster übernehmen, falls im neuen Cockpit tatsächlich benötigt.
5. **Leistung vor Wirtschaftsankopplung messen:** 60 Teilschritte je Spielminute bedeuten 7.776.000 Flugschritte je 90-Tage-Welt und 101.088.000 über 13 solche Welten. F0 sortiert aktuell die Schiff-IDs in jedem Flugschritt erneut; Benchmark mit realistischer Flottengröße ist Pflicht. Noch kein solcher 13×90-Flugbenchmark als bestanden belegt.
6. **Fly-Audit und Save/Load:** Fehlende/fremde/manipulierte Flugfelder, Eigentümerwechsel, Zwischenflug-Save, Andocksequenzen und Regeltrennung testen. Erst danach separate Ortsbedingungen in einem späteren Schritt prüfen.
7. **Geräteabnahme:** Echte iPad-Safari- und statische NAS-Prüfung bleiben offen; Chromium/WebKit-CI ersetzt diese nicht.

## 6. Schlussfolgerung

**[EMPFEHLUNG]** F0 bleibt die alleinige Grundlage der Flugmechanik. Aus `void.html` übernehmen wir gezielt visuelle Assets/Algorithmen und ausgewählte Touch-Interaktionsmuster. Die alte Physik, Tick-/Wirtschaftslogik, Dock-/Warpregeln, alte Saves und Netzwerkhülle bleiben ausgeschlossen.

Diese Untersuchung ändert weder Produktcode noch Regel195, Schema, Preise, Spielstände, Pages oder NAS. Sie ist keine Freigabe für F1, Regel196 oder eine Migration.
