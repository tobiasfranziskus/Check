# J9 – Persönlicher Miner direkt aus derselben Konzernwelt

**[DRAFT / 15.11.2026]** Ausgangsbasis: dokumentationsbereinigtes `main 1ff291f53bdd80eb0394176ab0628ca0890d353d`. **Nicht** in der Hauptversion und **nicht** auf Pages veröffentlicht, solange keine vollständige Abnahme auf dem aktuellen PR-Head vorliegt.

## Durchgängiger Spielerweg

1. Regel195-JSON wie bei J8 lokal prüfen, ausdrücklich getrennte Regel204-Kopie übernehmen, ohne den bestehenden Alt-Save zu überschreiben.
2. Im ursprünglichen Original-Core einen tatsächlich existierenden Aldera-Miner für **600 ISK** mit `house` kaufen. Kein Geschenk und keine erfundene Startposition.
3. Direkt aus der J8-Konzernoberfläche auf **„Miner persönlich fliegen“** klicken. Die schon vorhandenen Module `raum-szene.js`, `raum-grafik.js` und `raum-cockpit.js` rendern denselben Regel204-Zustand. Kein zweiter Core und kein JSON-Zwischentransfer.
4. Original-`shipUndock` bindet **40 ISK Flugreserve** aus dem eigenen Hauskonto. Original-`shipSteer`, `shipFlyTo`, `shipApproach`, `shipDock`, `siliconMineStart` und `siliconSell` bleiben über die vorhandenen Core-Prüfungen finanziert und ortsgebunden. Die Flugminute wird nur über `teilschritt` des Originals fortgeschrieben, niemals über eine zusätzliche physikalische Simulation.
5. Per **„Konzern & Flotte“** zurück zur selben Welt mit denselben Schiffen, Kassen, Ladungen, Fluglohnkonten und RNG-Werten. Laufende Flugzeit wird beim Ansichtswechsel angehalten; Save/Export weiter ausdrücklich über die bereits vorhandene J8-JSON-Sicherung.
6. Die ältere J4c-Jägersitzung mit echter 900-ISK-Kaufbelegpflicht, 3-Bojen-Patrouille und virtuellem Training bleibt bestehen. Ohne echten Jägerbeleg bleiben diese Fähigkeiten in der neuen Miner-Konzernsitzung gesperrt.

## Sicherheitsvertrag

- **Kein Teleport:** Eine eigene Hülle kann zunächst nur mit gültigem, geprüftem Eigentum ausgewählt werden; nach der ersten Pilotenauswahl sind Wechsel zu einer anderen Hülle ausschließlich am **selben realen Dock** mit `J6FlottenWechsel.pruefenRolle` zulässig. Abgelegtes Spiel mit genau *einer* eigenen Hülle kann nach eigenem gesicherten Import auch im echten Flug wieder übernommen werden – das ist keine Hüllen-/Ortsübertragung.
- **Keine Doppelsteuerung:** Ein autonomer `shipShuttle`-Pendelauftrag blockiert persönliches Fliegen derselben Hülle bis zum Ende bzw. wirksamen Stoppen.
- **Keine fremden Firmenrechte:** Flugbefehl nur für aktuell ausgewähltes, eigenes `house`-Schiff und die sieben vorhandenen F6-/Silizium-Kerntypen; `industrialOre*`, `shipBuy`, NPC-/Stations- und Kampfaufträge niemals über den Flugadapter.
- **Echte Geld-/Eigentumsaudits:** Befehl und einzelne Flug-Batches werden erst auf einer vom Core geladenen/geprüften Kopie ausgeführt. Nur bei erneut gültigem Save/Audit ersetzt die neue Welt die eine bisherige Sitzung. Die reine Szene erstellt weder Hülle noch Weltgeld.
- Das Saveformat und IndexedDB bleiben unverändert; der Pilotenauswahlzustand ist **noch kein persistenter Spielerstammsitz**. Zusätzliche Unternehmensübernahme/mehrsystemischer Ortswechsel erfordern einen eigenen späteren Core-Vertrag.

## Nachweise

`tests/j9-verbund-raummine.test.mjs`: bezahlter Originalminerkauf, 40-ISK-Reserve, wirklich bewegter F6-Worldhash, identischer Referenz-Replay/Save/Load, unzulässige Fremd-/Werft-/Doppelsteuerung verweigert.

`tests/j9-verbund-browser.cjs`: echtes J8-HTML mit übernommenem RAUM-1-Originalcockpit in Chromium/WebKit je drei Touchgrößen: Kauf → persönliches Cockpit → echtes Abdocken → zurück ins HQ → Export → unabhängiger Geld-/Schiff-/Eigentumsaudit.

**[OFFEN BIS CI]** Kein Node22-/Browser-/NAS-/Root-Test darf vor dem tatsächlich abgeschlossenen Workflow als bestanden gelten. Der zentrale W0–W5-Root bleibt unverändert; ältere Speicherplätze und alle Backupzweige bleiben geschützt. Echte iPad-Safari- und NAS-Geräteabnahme stehen separat aus.
