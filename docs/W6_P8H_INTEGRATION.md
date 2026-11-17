# W6/P8h – eigenfinanzierte NPC-Folgeversorgung

**[DRAFT / INTEGRATIONSABNAHME · 17.11.2026]** [Produkt-PR #455](https://github.com/tobiasfranziskus/Check/pull/455), [Original-Forschungsnachweis #454](https://github.com/tobiasfranziskus/Check/pull/454). Diese Datei ist **kein selbstständiger Releasebeleg**. MAIN/PAGES nur nach separat geprüftem Merge und Pages-Deploy.

## Spielpfad und Schutz

Öffentlicher Root `/` → neue **experimentelle Regel207-Forschung** (eigener Speicher-/Backup-Slot) → „Industrie/Schiffbau“ → „Siliziumversorgung“ → **„Eigenfinanzierte NPC-Folgeversorgung aktivieren“**. Der Schalter verlangt eine ausdrückliche Entscheidung und prüft den Core-Audit; ein externer Regel207-JSON-Import mit gesetzter Option verlangt eine zweite Zustimmung. Regel204 bleibt Standard. Bereits bestehende Regel207-Saves besitzen das neue Feld nicht; damit bleibt die bisherige Regel207-Simulation identisch, bis der Nutzer den Schalter bewusst betätigt. Keine automatisch erzwungene Migration.

**Funktion:** Nur bei `rulesVersion===207`, `npcAuto===true`, `materialSupplyEnabled===true`, `npcMaterialKette===true` prüft die originale Firmenpolitik in einem einheitlichen Weltkern alle 30 Weltminuten Bedarf, eigenen Werft-/Speditionsbestand, echten Restbuchwert, vorhandenes Material, Pilotenlöhne und Firmenkassen. Anschließend nutzt sie nur bestehende signierte W0–W5-/K7-Befehle: W5-Hülle bauen, 750-ISK-Kauf und real bezahlter W5ac-Frachtertransport, gegebenenfalls unterschriebener 50-Erz-Materialvertrag. Der **schon existierende** K7-Industrie-Autodisponent darf seinen rechtmäßig finanzierten Vertrag selbst abschließen; P8h darf keine zweite Unterschriftenkette erzwingen. Keine Gratisware, freie Schiffe, erfundene Nachfrage, Kreditrettung, neuen Tarife, Weltgeldemission oder Welt-Schemaerhöhung.

**Integrität:** Mehrfachbefehle werden zunächst in einer echten validierten Save/Load-Kopie vollständig geprüft; erst danach synchron durch den Originalkern gebucht. NPC-Befehlszähler sind auf vorhandene Werft-/Kauf-/Fracht-/K7-Nachweise begrenzt; gefälschte Save-Daten und unzulässige Regel204-Felder werden abgewiesen. Bei nicht ausreichender Kasse pausieren Firmen. Ein schon bezahlter Frachter unterwegs blockiert eine unnötige zweite Werftbestellung.

## Unabhängig gelesene CI-Ergebnisse aus frühem Produkt-Head

**[GEPRÜFT am Zwischencommit `05df59b0`, noch nicht am endgültigen Abnahmecommit]** [Node22-Log](https://github.com/tobiasfranziskus/Check/actions/runs/44026000313): 503 Tests insgesamt, 502 bestanden, ein Fehler aufgrund zu strenger Testannahme: Das originale K7-System, nicht der zusätzliche P8h-Dispatcher, signierte die ansonsten korrekt finanzierte Erzfracht. Der Test wurde danach auf physische W3-Lieferung, Original-K7-Signaturen und echte Firmenrechte umgestellt; **seine erneute CI-Abnahme bleibt offen**.

**13×90 Tage (alle Originalaudits bestanden):** S02 erstellt 4 Jäger, verkauft 3, schließt 5 W3-Frachten ab; eine weitere finanziert gebaute W5-Hülle wird nachgekauft. S03: 2 Jäger; S04: 3 Jäger; S11: 4 Jäger. Die anderen neun Regime erzeugen bis Tag 90 keinen Jäger und bleiben als negative Ergebnisse dokumentiert. Sämtliche 13 erhalten **33.000 ISK, Mint/Burn 0**, ohne negative Kassen, Waren-/Schiffs-/Eigentumslücken. Der Test prüft jeweils Tag 30/60/90 inklusive Save/Load.

**S02×365/730:** Am Tag 90: 4 gebaute und 3 verkaufte Jäger, 5 W3-Lieferungen, 10 Material und 0 Silizium in Nadir; kein einsatzfähiger Aldera-Speditionsfrachter. Am Tag 365 und 730 **keine weitere Jägerproduktion**. Die endlichen Siliziumfelder und der damit fehlende Folgeabsatz begrenzen die Industrie. Dies ist **kein** Nachweis einer dauerhaft selbsttragenden W6-Gesamtwirtschaft.

**Hashes des geloggten Versuchs:** S02 Tag 90 `32a72c8050699525`, Tag 365 `a2a150fa878224b9`, Tag 730 `d50f27e2c0b8e409`. Der P8h-OFF-Originalreferenzhash des 90-Tage-S02-Saves bleibt `ad0f037be40c32fd`.

## Ausstehende Freigabegates

- Aktueller letzter Commit: voller Node22-Testlauf **und** Originalhash/Save/Manipulationsschutz fehlerfrei.
- Root → Regel207 → Schalter, Browser/Touch Chromium und WebKit mit vier Größen, W5-NAS-Build, unabhängiger Product-Integrationscheck.
- 13×90 sowie S02×365/730 auf demselben finalen Commit; keine automatische „Nachhaltigkeit“ behaupten.
- Releasebackup `backup/main-before-w6-p8h-npc-20261117` schützt alten main; erst danach ggf. Merge. **Main-Merge und Pages-Deploy separat verifizieren.** Echte iPad-/NAS-Hardwareabnahme bleibt offen.

**Nächste Wirtschaftsforschung:** Die bis Tag 90 erschöpften vorhandenen Siliziumfelder und den dadurch endenden Jägerabsatz untersuchen. Neue Felder, Recycling, Module, Endnachfrage oder Geldmodell-B-Emissionen nur mit jeweils neuen echten Ressourcen-/Finanzierungsnachweisen und gesondert freigegebenen Balancingregeln.
