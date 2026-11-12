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

**Vor CI-Abschluss unbestätigt:** Neue Funktion ist auf einem Feature-Branch implementiert, noch nicht als bestanden abgenommen. Erst nach tatsächlichem Abschluss des K1-Workflows Testanzahl/Status und gegebenenfalls negatives Ergebnis eintragen. Zusätzlich bleibt echte iPad-Safari-/NAS-Geräteprüfung offen.

**Nicht enthalten:** Jäger- oder Frachter-Direktsteuerung, echtes multisystemisches freies Fliegen, eine W6-Sanierung, K4–K7-Wirtschaftsforschung, Integration in `main`, produktive Save-Migration oder Deployment.
