# K1 – Begleitete Eis-Bergbaurunde im gemeinsamen Weltkern

**12.11.2026 · [DRAFT/UI]** Gestapelt auf K1-Gesamtspiel-QA [#312](https://github.com/tobiasfranziskus/Check/pull/312). Der produktive `main` bleibt Regel195/Schema8; K1-Regel199 ist ein getrennter Forschungsstand. Keine Merge- oder Veröffentlichungsfreigabe.

## Bedienung

In `prototypes/welt/index.html` ergänzt der Cockpitblock **Begleitete Eis-Bergbaurunde** die bisherigen freien Einzelbefehle. Die Hilfe liest ausschließlich die aktuellen Schiffsdaten und schon vorhandenen Core-Regeln. Ihr jeweils explizit anzutippender Knopf löst genau **einen vorhandenen UI-Originalhandler** aus.

- Ohne eigenen Miner führt die Hilfe nur zum Station-Reiter, der weiterhin den **bezahlten** Originalkauf anbietet.
- Vom angedockten Miner zur bezahlten Flugreserve, Abdockminute, Original-Zielflug ins Eisfeld, realer Förderung je Minute, wirklichem Rückflug, Core-validiertem Dockverkauf.
- Die Anzeige zeigt tatsächliche Ladung und freie Kapazität, nicht eine versprochene Förderung oder Zahlung. Förderung mit vollem Laderaum bzw. bei Geldmangel kann im Kern stoppen.
- Ein laufender Pendelauftrag, fremde Fracht, fehlende Flugreserve oder ein fremdes Erzvorhaben wird **nicht** vom Assistenten übernommen. Alle Originalknöpfe (Handflug, Förderung stoppen, Karte, Erz, Station, Wirtschaft) bleiben erreichbar.
- Die Hilfe wählt keine Ziele in der Karten-Vormerkung, überschreibt keine Save-Felder und setzt nie zeitgesteuert einen Auftrag ab. Nur ein tatsächlicher Tipp auf den sichtbaren Button kann einen bestehenden Originalhandler auslösen.
- Keine neue Handelsformel, Lohnregel, Ware, Hülle, Core-Funktion, RNG-Quelle oder Game-Schema. Keine automatische Geldemission.

## Qualität

Neues unabhängiges Browser-Szenario `tests/welt-rundenfuehrung-browser.cjs`: frischer Browserkontext pro Touchgröße; Navigation hashneutral, realer 600-ISK-Minerkauf, Original-`shipUndock`, `shipApproach`, 10 bezahlte `shipMine`-Minuten, freiwilliges `shipWait`, echter `shipDock`, am Dock 10 Eis gegen vorhandenes Aldera-Geld, Doppelverkaufsvermeidung, Geldsumme 33.000, Mint/Burn 0, Core-Audit, Save/Reload-Hash und keine wiederholten Screenreader-Statusmutationen. Die CI-Matrix prüft Chromium und WebKit mit vier Viewports.

**[TEST / tatsächlich ausgeführt auf Code-Head `c944084f8671ecdaa2e3f6aa6def1cf7dc335977`]** [K1-CI #43266657804](https://github.com/tobiasfranziskus/Check/actions/runs/43266657804) **3/3 Jobs completed/success**: Node22-Gesamtregression **328/328 bestanden, 0 Fehler, 0 Skips**, mit 15 wirtschaftlich unterschiedlichen 90-Tage-Szenarien, 5×365 und 2×730 Tage; neue Begleitrunde jeweils **4/4 Chromium und 4/4 WebKit** bei 1180×820, 1024×768, 820×1180 und 390×844. Alle acht Runden: echter 600-ISK-Minerkauf, 10 Minuten Anflug, zehn real bezahlte Eis-Förderminuten, 11 Minuten Rückflug, genau zehn Eis für insgesamt 50 ISK am Dock aus Original-Aldera-Kasse verkauft, keine doppelte Lieferung, Weltgeld 33.000 ISK, Mint/Burn 0, unabhängig auditierter Endhash **`29b164885920956c`** bei Tick32, Save/Reload erfolgreich. Der Test deckte einen falschen UI-Fortschritt bei bereits im Feld gebremstem Original-Anflug auf; der Code-Head korrigiert dies ausschließlich im Anzeigepfad, ohne Flugkernänderung. [W5-RC1 #43266657835](https://github.com/tobiasfranziskus/Check/actions/runs/43266657835) und [historische JS-CI #43266657853](https://github.com/tobiasfranziskus/Check/actions/runs/43266657853) sind ebenfalls abgeschlossen erfolgreich. **Diese Belege gehören zum genannten Code-Head; anschließende rein dokumentarische Commits dürfen nicht als neue Code-Abnahme ausgegeben werden.** Echte iPad-Safari-/NAS-Geräteprüfung offen.

**Nicht enthalten:** Jäger- oder Frachter-Direktsteuerung, echtes multisystemisches freies Fliegen, eine W6-Sanierung, K4–K7-Wirtschaftsforschung, Integration in `main`, produktive Save-Migration oder Deployment.
