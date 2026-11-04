# [DRAFT] Void-Echoes-2D im W1-Erzpiloten

Integrations-Draft: [PR #164](https://github.com/tobiasfranziskus/Check/pull/164), gegen den W1-Branch aus #161.

Stand 04.11.2026. Integration auf `feature/w1-miner2d-integration`, gestapelt auf
[PR #161](https://github.com/tobiasfranziskus/Check/pull/161), Commit
`61eebed51e07df5e99fe5d06a5c205887cb3c142`. Darstellung, Kamera, Grafikherkunft und
Touch-Arbitrierung gezielt aus [PR #162](https://github.com/tobiasfranziskus/Check/pull/162),
Commit `35688082332f686f88dc317c1ae1200edf8e60d3` übernommen.
Beide Ursprungsbranches und Void Echoes bleiben unverändert. Kein Merge/Deployment.

Statischer Einstieg: `index.html?modus=miner2d`. Die bisherige Kontenansicht
`?modus=erzpilot` verwendet denselben W1-Spielstand. Ohne Query startet weiterhin
Regel 14. Bedienung, Nachweise und offene Abnahme: [W1_2D_INTEGRATION.md](W1_2D_INTEGRATION.md).

## Geprüfte Quellen und Herkunft

Die Herkunftsdokumentation aus #162 benennt Void Echoes
[`a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f)
als geprüften Quellstand. Für diese Integration wurden ausschließlich die bereits
übernommenen Dateien aus Check #162 gelesen; kein erneuter Zugriff oder Eingriff
im Void-Echoes-Repository. Die dort dokumentierte Zuordnung bleibt erhalten:

Die Paketmetadaten von Void Echoes kennzeichnen den Quellcode als UNLICENSED;
die vom Nutzer ausdrücklich beauftragte Übernahme erfolgt innerhalb seiner
beiden Repositories. Daraus wird keine neue öffentliche Lizenz abgeleitet.

| Quellmodul (src/script/) | Übernahme nach m_ui_miner2d | Abgrenzung |
| --- | --- | --- |
| 080-ve08g-02-sprites.js | Canvas-Caches, isolierter dekorativer RNG, Polygonroutine, Winkeldarstellung und Sternfeldbasis | Nur lokale Closure; kein Zugriff auf Quell-Core |
| 390-ux08-vektorgrafik.js | Effektive GX_MODELS aller elf Hüllen, GX-Teile, Metallgradient, Spritecache, Schiffsdarstellung, verfeinerter Sternhimmel | Später geladenes Modul überschreibt 080; diese Qualitätsstufe bleibt erhalten. Menü-/Fitting-SVG und globale Monkeypatches entfallen |
| 085-kern-zeichnen-hud.js | Stations-/Asteroidenzeichnung, Auswahlwinkel, pulsierender Ring, Bergbaustrahl/-ring, HUD-Bogengeometrie | Alte draw-/ui-/loop-Funktionen nicht übernommen; Cargo ersetzt die nicht vorhandenen Schild-/Energie-Werte |
| 370-ux06-auswahl.js | CSS-Pixel-Treffertest, mindestens 44px Zieldurchmesser, Auswahl getrennt vom ausdrücklichen Befehl | Keine alten act-/Flight-/Host/Gast-Bindungen |
| 580-ux01-erweiterung.js | Effektive Pointer-/Pinch-Arbitrierung: 10px Bewegung, 600ms Tap, Pinch-Zoom .03–.5, Capture-/Kontextabbruch | Quellmodul 370 delegiert tatsächlich hierhin. Kein Doppeltipp-Flug, Protokoll oder Persistenz |
| 075-kern-simulation.js: cam/sc | Kamera-/Bildschirmformel Mittelpunkt + (Position − Kamera) × Zoom | Keine Simulationsfunktionen oder Extrapolation |

`tests/fixtures/miner2d-herkunft.json` hält die vollständigen Datei-SHA256 und
Hashes der wörtlich erhaltenen Grafikzeilen fest. Der Herkunftstest prüft sie
gegen das Inline-Modul. Bewusste spätere Änderungen benötigen Herkunftsnachtrag.
Die ursprüngliche kompakte Formatierung der Grafik bleibt zur Zuordnung erhalten.

## Integrierte Schnittstelle

- `m_ui_miner2d.zustand(state, rules, schiff)` liefert eine abgetrennte, rekursiv
  eingefrorene Projektion mit Tick, Core-Hash, Besitz-ID, Auftrag, Phase, Fracht,
  Kapazität und sortierten Entitäten. Fehlendes Schiff ergibt `null`.
- `grafik(canvas).zeichnen(view, local, now)` liest nur diese Projektion. `now`
  beeinflusst Dekoration; Auswahl, Zoom und Caches sind ungespeicherter UI-Zustand.
- `eingabe` und `treffer` bleiben die getesteten Touchfunktionen aus #162.
  Canvas-Tap kann eigene Schiffe oder Ziele auswählen, aber keine Befehle auslösen.
  Fremde Schiffe bleiben sichtbar; die Schiffliste enthält nur eigenen Besitz.
- Die bisherige Adapterfunktion `befehl` bleibt für explizite Queue-Intents testbar.
  Die integrierte Oberfläche verwendet wie #161 direkt `m_core_index.execute`
  für `shipBuy`, `shipMine`, `shipWait`. Die Core-Validierung bleibt maßgeblich.
  Die lokale `starten`-Funktion des flüchtigen #162-Demonstrators entfällt.
- Nur `m_ui_erzpilot` besitzt den Zustand und führt `advance` sowie Speicherung
  aus. Eine Minute, eine Stunde und ein Tag sind Schritte derselben Core-Uhr;
  der Renderloop berechnet keine Weltzeit, Förderung oder Zahlungen.
- W1-Kassen, Kosten, Erlöse, Vertrags-/Arbeitsbindungen, reale Lager und Audits
  kommen aus Originalkonten, `pilotAuftragsStand` und `pilotWirtschaftsStand`.
  Der Grafikadapter enthält keine Preis-/Förderformeln.

Feld-/Schiffspositionen, Asteroidenradius, Anflug und Strahl bleiben schematisch.
Keine gespeicherten Flugkoordinaten, kein Warp-/Orbit-/Dockmanöver, keine
zusätzliche Flugphysik oder erfundenen Schild-/Energiewerte. Schiffs-Rufnamen
werden ausschließlich über `textContent` oder Canvas-Text ausgegeben.
