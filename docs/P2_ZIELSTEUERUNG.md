# P2 Zielsteuerung [DRAFT]

Basis: main `6530dae867b56a98c8157ba5738f2817c1ca87e3`, Issue #410. Kein Merge/Deploy. P8b/c/d und Wirtschaftsregeln bleiben unverändert.

Gemeinsames Zielmenü für persönlich übernommene Miner/Frachter/Jäger: Annähern mit Originalbefehl, Orbit mit editierbarem Radius, Folgen mit editierbarem Abstand, Aufschalten/Lösen ohne Waffen und originales Andocken. Eingaben bleiben über HUD-Ticks erhalten. Handflug/Stopp ersetzt Orbit/Folgen unmittelbar; Geschwindigkeit baut der vorhandene Integrator kontinuierlich ab. Fremde Schiffe bleiben ausschließlich Ziele, keine Steuerungsübernahme.

`shipOrbit` (`zielArt`, `ziel` oder Punktkoordinaten, `radius`), `shipFollow` (`ziel`, `abstand`), `shipLock` (`zielArt`, `ziel`) und `shipUnlock` sind validierte Regel204-Flugbefehle. Finanzierung, Eigentumsprüfung, Pendelkonkurrenz und Reserveabrechnung verwenden unverändert den Weltkern und die Pilotensitzung. Keine UI-Physik, zweite Wirtschaft, RNG-Änderung oder Kampfhandlung. Radius-/Abstandswerte: ganze Weltpunkte, vom vorhandenen `punktHalt` bis `raumRadius`.

Der Radialregler kombiniert Distanzfehler und Bremsweg mit Zielgeschwindigkeit. Orbit ergänzt eine aus Original-Schub/Wendigkeit begrenzte Tangentialfahrt. Alles erzeugt nur Sollkurs/Sollfahrt für den Originalintegrator. Ein unerreichbar schneller Kontakt kann nicht eingeholt werden; Anflug und Kurven benötigen Zeit. Keine ideale Formation oder garantierte Distanz bei abrupten Manövern bzw. an Systemgrenzen.

Save-Kompatibilität: keine Schema-/Regelversionsänderung oder Migration. Alte Saves bleiben bytegleich, solange keine neuen Befehle ausgeführt werden. Neue Modi verwenden das vorhandene `ziel` mit streng validiertem Radius/Abstand; `erfassung` ist optional. Neue Saves mit P2-Aktivität benötigen diesen Softwarestand (alte Software kann unbekannte Modi zurückweisen). Ungültige Felder, IDs, Werte und Eigentümer werden abgewiesen. Verlorene Kontakte werden beim nächsten Core-Flugschritt gelöscht; Autopilot geht in gebremsten Halt. Aufschalten ist reine Identitätserfassung, ohne neues Radar-/Reichweiten-/Ausrüstungsbalancing.

## Geprüfte Altcode-Muster

Am Quell-SHA `19c3f792fbad8f21163f2f8550aa2ed7bd09a124` gezielt gelesen: `075-kern-simulation.js` (radiale/tangentiale Orbitrichtung, getrennte `lock`/`unlock`-Aktionen), `270-ve10-04-autopilot.js` (Zielverlust, manuelle Priorität), `370-ux06-auswahl.js` (Auswahl vor ausdrücklichem Befehl), `580-ux01-erweiterung.js` (Pointer-/Pinch-Abbruch). Wiederverwendung der Bedien-/Reglermuster im bestehenden RAUM-Cockpit; keine alte Simulation, Sofortstopps, Warp-, Kampf-, Wirtschafts- oder Save-Implementierung kopiert. Folgen ist neu.

## Dateien und Prüfpfade

- `prototypes/flug2d/flug-kern.js`: Befehle, Regelung, Zielverlust und Save-Audit.
- `prototypes/raum/raum-szene.js`, `raum-cockpit.js`: lesende Projektion, Zielmenü, native Abstandseingaben, HUD.
- `prototypes/verbund/konzern-session.js`: Pilotbefehls-Whitelist.
- `tests/p2-zielsteuerung.test.mjs`: Klassen, Radius, bewegte Ziele, Bremsen, Rechte, Save/Replay, Zielverlust und Docken.
- `tests/raum-szene.test.mjs`: neues Zielmenü erwartet; alte Referenzen unverändert.
- `tests/p1-spielstart-browser.cjs`, `.github/workflows/p1-spielstart.yml`: öffentlicher Karriereweg mit Orbit/Folgen/Handübernahme und bestehendem Export/Resume/Importschutz; Chromium/WebKit je vier Größen.

Prüfergebnisse werden nach tatsächlichem Abschluss ergänzt. Lokale Browserinstallation scheiterte für beide vorhandenen Playwright-Versionen an netzseitigem HTTP403 (`Domain forbidden`); kein lokaler Browserlauf als bestanden gewertet. Physisches iPad Safari und privates NAS bleiben offen. Übergabe an ChatGPT zur unabhängigen Integrationsabnahme.
