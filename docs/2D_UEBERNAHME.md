# [DRAFT] Void-Echoes-2D → Aphros Void

Nachverfolgung: [Draft-PR #162](https://github.com/tobiasfranziskus/Check/pull/162), nicht integriert.

Stand 04.11.2026. Branch `feature/void-echoes-2d-miner`, Basis Check
[`b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c).
Kein Merge oder Deployment. Start: statisch ausgelieferte `index.html?modus=miner2d`.
Ohne Query bleibt das Konzernspiel erhalten. Der Demo-Einstieg läuft vor der
normalen UI-/Speicherinitialisierung. Jeder Start erzeugt einen flüchtigen
Core-Zustand; kein Lesen/Schreiben von Nutzersaves, kein Import/Export.

## Geprüfte Quellen und Herkunft

Void Echoes `main` wurde lesend aktualisiert; lokaler Stand und `origin/main`:
[`a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f`](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f).
`README.md`, `Eingefroren.md`, Paket-/Buildstruktur und die unten genannten
Module wurden geprüft. Keine AGENTS.md im Quellrepository. Das eingefrorene
Projekt bleibt unverändert. Check: AGENTS.md, Projektanweisungen, Roadmap,
Projektstatus und bestehender iPad-Testbericht berücksichtigt.

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

## Schnittstelle v1

Alle Teile sind im bestehenden statischen `index.html` gekapselt und ohne DOM
getrennt testbar. Keine Laufzeitabhängigkeiten oder Buildpflicht.

- `zustand(state, rules, schiff)` liefert `null` bei fehlendem Schiff, sonst eine
  rekursiv eingefrorene, abgetrennte Projektion mit Version, Tick, Core-Hash,
  System, Auftrag, Phase, Fracht, Kapazität, Kasse und sortierten Entitäten.
  Keine Core-Objektreferenzen verlassen den Adapter. Rufnamen gelangen nur in
  Canvas-Text oder `textContent`, nicht als Eingabe in HTML.
- `grafik(canvas).zeichnen(view, local, now)` liest nur diese Projektion. Zoom,
  Auswahl, Caches und Winkelglättung sind lokaler UI-Zustand. `now` beeinflusst
  ausschließlich Dekoration. Core-RNG, Queue und Save bleiben unberührt.
- `befehl(state, rules, schiff, intent)` nimmt ausschließlich `foerdern(ware)`,
  `halten` und `reisen(ziel)` entgegen. Owner wird aus den Host-Regeln gebunden;
  keine freie Übernahme fremder Befehlsfelder. Übersetzung zu `shipMine`,
  `shipWait`, `shipMove`, anschließend **submit** und erneute Validierung durch
  **step/execute**. Queue-Annahme ist sichtbar von Ausführung getrennt.
- Ausschließlich der Host führt `core.step` aus; keine Simulationszeit im
  Renderloop. Im Demo manuell eine Core-Minute pro Tastendruck. Ein laufender
  Integrationshost würde nach seinem Tick eine neue Projektion liefern.

Feld-/Schiffskoordinaten und Asteroidenradius sind **schematische Anzeigeplätze**.
Sie stehen weder im Save noch für reale Entfernungen, Vorräte oder Kollisionen.
Der Bergbaustrahl visualisiert den aktiven Auftrag, nicht einen neuen
Fördervorgang oder eine zusätzliche Buchung. Fracht und Geld kommen direkt aus
dem Core; Förderung, Verkauf und Kosten ausschließlich aus bestehenden Regeln.
Der UI-Schiffwechsel ist eine Beobachterauswahl, kein implementierter Pilotenort.

## Core-Lücken und bewusst fehlende Effekte

Aphros-Regel14 kennt Systemreisen, dock/reise und Aufträge; keine lokalen
x/y/vx/vy, Beschleunigung, Kurs-/Stoppbefehle, Anflug, Orbit, Warp, Reichweiten,
Kollisionen, lokalen Dockzustände oder persönlichen Pilotenstandort. Daher keine
freie Flugsteuerung und keine zweite Flugphysik. Die übernommene Schiffszeichnung
kann Triebwerke/Kursglättung darstellen, erhält hier aber keine erfundene
Geschwindigkeit. Treffer-, Schadens- und Explosionseffekte warten auf passende
Core-Ereignisse; keine vorgetäuschten Schild-/Panzer-/Energieanzeigen.

## PR #161 und Integrationsfolge

[#161](https://github.com/tobiasfranziskus/Check/pull/161) geprüft bei Head
`3a564e3e4f8b1d1a4dfc940268f6c6f85bace117`: offener Draft, fünf geänderte Dateien,
keine Diskussionskommentare. Er enthält W0/W1-Regel15 mit vorfinanzierten
Aufträgen, eigenem Save-Slot und endlichem Exportbudget. Diese Änderungen und die
auf seinem Branch vorgeschlagene W0–W6-Roadmap sind **nicht main**. Der vorliegende
Branch basiert unabhängig auf main und ändert weder PR #161 noch seine Regeln.

1. Diesen Grafik-/Adapter-Draft separat prüfen, insbesondere Herkunft und echte
   iPad-Abnahme. Keine Wirtschaft aus Void Echoes importieren.
2. Nach gesonderter Integration/Freigabe von W0/W1 denselben Adapter mit dessen
   autoritativem Regel-/State-Paar verbinden; **keine** Regel15-Kopie in diesem PR.
   Der Eigentümer-/Auftragsadapter muss dann gegen reale finanzierte Aufträge,
   Nullbudget, Stopp/Erstattung, Save/Load und Spieler/NPC-Gleichheit getestet werden.
3. Einen eigenen Core-Auftrag für deterministische lokale Positionen, Flugbefehle,
   Save-Migration und identische Spieler-/NPC-Bewegungsregeln definieren. Erst
   nach dessen Prüfung schematische Plätze durch echte Positionen ersetzen.
4. Später Pilot-/Stationswechsel und Konzernterminal anbinden. Bestehende Reiter,
   Saves und eine einzige Weltuhr erhalten. Treffer-/Dockereignisse erst danach
   an die übrigen vorhandenen Void-Echoes-Effekte anschließen.

## Prüfung und verbleibende Abnahme

- Node.js **22.23.4**, Pflichtbefehl `node --test tests/*.test.mjs`: **74/74 Einzeltests in neun Dateien** bestanden, keine Fehler/Skips. Bestehender Bestand: 67 Tests. Neue Suite: sieben Einzeltests für
  unveränderliche/kanonische Übergabe, echte Queue-Replays inkl. Audit/Save/Load,
  Ablehnung, CSS-Touchziele, Gesten, Herkunft und 100 Renderframes ohne Coreänderung.
- Bestehende Start-/Speicher-/Wirtschafts-/Hash-Regressionen unverändert; keine
  neuen Goldenwerte oder Regel-/Schemanummern. Der neue Modulblock plus Demo-Gate
  sind die einzigen Änderungen an index.html; Core bytegleich zur Basis.
- Optionaler Browserlauf: `PLAYWRIGHT_MODULE=/pfad/zu/playwright node
  tests/browser/miner2d.cjs` bei lokalem statischem Server auf Port 8765.
  Vorhandenes Playwright als Entwicklungswerkzeug, kein Paket im Projekt ergänzt.
  Chromium/iPad-Emulation: 1194×834, 834×1194, 375×812, Drehung,
  Touch-Auswahl ohne Tick/Befehl, Förder-/Halte-Queue samt Ausführung, Zoom,
  48px Bedienelemente, kein horizontaler Überlauf, keine JS-Fehler;
  Reduced-Motion-Einstieg geprüft. Screenshots lokal visuell geprüft, Kontrast
  korrigiert. Dies ist **keine echte iPad-Safari-Abnahme**.
- Offen: reales iPad Safari Hoch-/Querformat, Split View, Safe Areas/Toolbar,
  Pinch/Capture/Abbruch durch Appwechsel, längere Sitzungen und statische
  Auslieferung auf dem Ziel-NAS. Keine Geräte-/NAS-Verbindung vorhanden.
- Kein wirtschaftlicher Langzeitnachweis für den neuen W1-Core behauptet;
  dessen Integration und Wirtschaftsgates bleiben bei #161/separaten Aufträgen.

Manuelle Abnahme: Demo öffnen, Erz antippen (nur Auswahl), Förderknopf drücken
(nur Queue), Zeitschritt (Ausführung), halten, Zeitschritt, Systemreise,
Schiffwechsel, Zoom/Pinch und Drehen; anschließend normales Konzernspiel öffnen
und vorhandenen Save unverändert wiederfinden. Pinch, Ziehen, langes Halten,
Appwechsel und abgebrochene Berührungen dürfen keinen Auftrag erzeugen.
