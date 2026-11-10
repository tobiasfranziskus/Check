# Legacy-Quellcode-Audit vor F1 – `tobiasfranziskus/void-echoes`

**[ANALYSE · 10.11.2026 · NUR GITHUB-QUELLCODE, NICHT INTEGRIERT]**

## 0. Korrektur der Quellbasis

Die verbindliche Legacy-Quelle ist das **private GitHub-Repository** [`tobiasfranziskus/void-echoes`](https://github.com/tobiasfranziskus/void-echoes), **nicht** eine exportierte oder hochgeladene `void.html`. Diese Revision ersetzt den früheren Snapshot-basierten Audit. Aktueller `void-echoes/main` in der GitHub-Abfrage: `a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`; der Segment-Build meldet `X02-B`. Der Forschungsbranch `x02c` weicht ab und konzentriert sich vor allem auf Wirtschafts-/NPC-Korrekturen; er ist kein neues freigegebenes Flugmodell.

Quelle und Buildstruktur:
- [`README.md`](https://github.com/tobiasfranziskus/void-echoes/blob/main/README.md) dokumentiert die aufgeteilte statische HTML-Datei: `src/script/`, `src/head/`, `src/body/`, `build/manifest.json`.
- [`build/manifest.json`](https://github.com/tobiasfranziskus/void-echoes/blob/main/build/manifest.json) legt die Ausführungsreihenfolge verbindlich fest. **Nicht einfach das frühe `sgSprite()` kopieren:** später überschreibt UX08 diesen Renderer.
- [`docs/SEGMENTE.md`](https://github.com/tobiasfranziskus/void-echoes/blob/main/docs/SEGMENTE.md) indiziert Herkunft, Aufrufe und spätere Überschreibungen; nicht jedes Basis-Segment ist die wirksame Funktion.
- [`VERSIONS.md`](https://github.com/tobiasfranziskus/void-echoes/blob/main/VERSIONS.md) trennt historische NAS-/iPad-Angaben, archivierte Versionen und neuere Forschungsstände. Kein Deployment aus diesem Audit.

## 1. Gezielte Fundstellen und Priorität

| Priorität | GitHub-Quelldatei | Konkreter Befund | F1-Empfehlung |
|---|---|---|---|
| **A** | [`src/script/390-ux08-vektorgrafik.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/390-ux08-vektorgrafik.js) | `GX_MODELS`: 11 definierte Hüllengeometrien mit `role`, `engines`, `scale`; `gxParts()`, `gxCanvas()`, `gxSvg()`. **Wirksame** `sgSprite`-, `sgShip`- sowie Sternhimmel-Überschreibungen. Dieselben Teile für Canvas-Spielgrafik und SVG-Werftvorschau. | Vorrangig als **einheitliches, dekoratives 2D-Modellsystem** adaptieren, nicht älteren `SG_SHAPES`-Stand als aktuelle Optik ausgeben. Separater Grafik-Adapter auf F0. |
| **A** | [`src/script/080-ve08g-02-sprites.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/080-ve08g-02-sprites.js) | `SG_SHAPES`, `sgRandom`, `sgPolygon`, `sgAngle`, `sgSky` und Offscreen-/Canvas-Cache. Spätere Overrides kommen aus UX08. | Nur benötigte geometrische/Canvas-Basishilfen übernehmen. `SG`-/`GX`-Caches bleiben ausschließlich Renderzustand. |
| **A** | [`src/script/580-ux01-erweiterung.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/580-ux01-erweiterung.js) | `vt01Down/Move/Up/Cancel`, `setPointerCapture`, Multi-Touch/Pinch, Doppeltipp, Sichtbarkeits-/Sitzungswechsel, explizite Flugbestätigung. | Saubere Touch-Muster prüfen; **F0-Joystick bleibt**. Alte Input-Handler nicht global einhängen oder Befehle direkt wiederverwenden. |
| **B** | [`src/script/370-ux06-auswahl.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/370-ux06-auswahl.js) | `txHit` projiziert Objekte auf Canvas, `txRadius` berechnet Hit-Zonen; `txChoose` wählt Ziel, `txFlyPoint` löst erst nach eigener Prüfung einen alten `goto`-Befehl aus. | Hit-Testing, UI-Auswahl und explizite Bestätigung in den F0-UI-Adapter übersetzen, nicht alte `act()`-Befehle. |
| **B** | [`src/script/085-kern-zeichnen-hud.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/085-kern-zeichnen-hud.js) | `draw()` zeigt Stationen/Felder/Schiffe, Zielrahmen, Laser-/Bergbau- und Schadenseffekte; `ui()` ist an altes `S` und Wirtschaftsfelder gebunden. | Einzelne HUD-/Effektideen adaptieren, **nicht** `draw()` bzw. `ui()` komplett kopieren. |
| **B** | [`src/script/360-ux05-cockpit.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/360-ux05-cockpit.js) | Präsentations-Cockpit `cpRender` ohne eigene Welt-/Befehlsschreibzugriffe. | Optionale Vorlage für Status/HUD, nur wenn mit F0-Sandbox deutlich besser. |
| **C** | [`src/script/650-perf01-inputfix01.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/650-perf01-inputfix01.js) | Berührungs-Feedback, keine Doppelaktionen, Host-Bestätigung, Performance-Diagnostik und Eingabe-Kontextschutz. | Einzelne UX-/Messideen bei Bedarf wiederverwenden; keine WebRTC-/Host-Protokolle in F1. |
| **C / später** | [`src/script/550-ve3d02-adapter.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/550-ve3d02-adapter.js), [`src/script/570-ve3d02-renderer.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/570-ve3d02-renderer.js) | Lesender Weltadapter und separater WebGL-3D-Renderer. | Kein 3D-Import für F1. Adaptermuster ist nützlich, WebGL bleibt optional/spät. |

**Wichtige Abhängigkeitsfalle:** `390-ux08-vektorgrafik.js` verwendet bereits die frühere `sgPolygon`-Hilfe und `SG.sprites` aus `080-ve08g-02-sprites.js`; zugleich überschreibt es `sgSprite`, `sgShip`, `sgStars`, `sgSkyInit` und `sgSky`. Für Check die benötigten Funktionen als explizite reine Grafikmodule **ohne** globale Überschreibung isolieren. Ein einfaches Copy-paste des späteren Segments ist nicht startbar.

## 2. Alte Flugmechanik: ausschließlich Vergleich, keine Übernahme

[`src/script/075-kern-simulation.js`](https://github.com/tobiasfranziskus/void-echoes/blob/main/src/script/075-kern-simulation.js):
- `mv()` nutzt fließkommaabhängige `dt`-Glättung, Geschwindigkeiten und `Math.atan2`; `steer()` steuert `goto`, `appr`, `orb`, `warp` mit alten Entity-IDs und globalem `S`.
- `tick()` ruft Wirtschaft, Schiffsmodule, Kampf, Bergbau, NPC-Logik und Bewegung in einer gemeinsamen Schleife auf.
- `dock()` kombiniert Positionierungs-/Dockzustand mit Entladen, Reparatur, Modulen und Regeneration. Die alte `apply()`-Befehlshülle ist damit ebenfalls nicht für Regel195 verwendbar.
- Alte Warp-/Energie-/Fracht- und Netzwerkregeln passen nicht zum geplanten, autoritativen F0-Flugprofil.

**Fazit:** Null Flugphysik aus `void-echoes` in den neuen Core übernehmen. Vorhandene Routinen dienen nur als UX-/Feature-Vergleich (Zielwahl, Orbit-Darstellung, Blickrichtung).

## 3. F0 bleibt einzige Flugautorität

In [Check PR #290](https://github.com/tobiasfranziskus/Check/pull/290), Quellbranch `claude/inspiring-galileo-0d2mek`, liegt ein separater Forschungs-Flugkern mit festem Ganzzahlintegrator, 60 Teilschritten pro Kernminute, denselben Flugbefehlen für Spieler und NPC, Dock-Zustandsmaschine und separater Sandbox. Die unabhängig gemeldete F0-CI: **11/11 Kern-Tests, 217/217 Node22 gesamt, Chromium 4/4 und WebKit 4/4 mit gleichem Referenzhash**. Das beweist noch nicht die 13×90-Laufzeit oder ein echtes iPad Safari.

Check-Main zum Zeitpunkt dieses Audits: `04124f2bca27dc33b54be30c07b6a7bbb7387e81`; Regel195-Save-Schutz aus PR #289 integriert. Der PR-#290-Review-Branch stammt noch von `7374b29` und ist vor F1 mit Main abzugleichen.

## 4. Isolierte Übernahme in den F1-Nachfolgeaufträgen

1. **F1 Core (eigene Forschungsregel):** F0 auf aktuellen Main abgleichen; nur F0-Kinematik und Fly-Audit integrieren. Ohne neue Ortsbedingungen bleiben Regel195 und seine Geld-/Waren-/Hashreferenzen unverändert.
2. **Separater Grafikschritt:** `GX_MODELS`/`gxParts`/`gxCanvas` und einen passenden statischen SVG-/Canvas-Renderer adaptieren; `SG`-Sternhimmel als reine Darstellung. Ein kleiner, expliziter Render-Adapter nimmt nur lesend F0-`x/y/kurs/vx/vy` an. Keine Legacy-`S`-, `act`-, `tick`- oder `SG/GX`-Globalzustände.
3. **Touch-Ergänzung:** F0-Joystick und Buttonsemantik bewahren, nur bislang fehlende Zielauswahl/Pinch-/Pointer-Cancel-Muster nachbauen. Spielbefehle ausschließlich via die F0-Validierung; keine UI-Nebenbuchungen.
4. **Leistung und Nachweis:** Realistische Schiffsflotten, fest definierte Seeds und 13 × 90 Tage; 60 × 60 × 24 × 90 × 13 = **101.088.000** Flugteilschritte (pro 90-Tage-Welt 7.776.000). Vor allem ID-Sortierung pro Teilschritt und Canvas-Cache auf echten Viewports messen. Wirtschaftliche Durchsatzänderungen erst in F2 separat bewerten.
5. **Speichersicherheit:** F0-Flugaudit, Import/Export mitten im Flug, Zwischenzustände, ungültige Objekte, Browserkonflikte; kein stiller Regel195→F1-Save-Import. Echte iPad-Safari-/NAS-Abnahme bleibt gesondert offen.

## 5. Grenzen und Verifikation

Das ist eine **GitHub-Quelltextsichtung**, keine ausgeführte neue Spielintegration und kein erfolgreich gelaufener neuer CI-Job. Die GitHub-Dateien selbst (nicht eine exportierte `void.html`) wurden gelesen; keine unveröffentlichten `x02c`-Mechaniken in F1 importiert. Keine Änderung an `void-echoes`, Check-Produktcode, Saves, Pages oder NAS.

**[EMPFEHLUNG]** F0 physikalisch erhalten; aus `void-echoes` nur das wirksame UX08-/SG-Grafiksystem plus geprüfte UX06-/UX01-Eingabemuster zielgerichtet in eigene Check-Module überführen. Ergebnis unter Kontrolle eines einzelnen Wirtschafts- und Flugkerns.
