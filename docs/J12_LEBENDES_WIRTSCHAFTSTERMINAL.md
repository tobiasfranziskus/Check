# J12 – lebendes Wirtschafts- und Stationsterminal

**[DRAFT / NICHT MAIN] · 15.11.2026**

Basis: [MAIN] `4d36a37d7c23b11151a4514df7841eef5eef9d01` (J11+P1, unveränderte öffentliche Karriere). Dieser Schritt ergänzt die bereits vorhandene Tab-Ansicht „Das Universum“ um eine tatsächliche Wirtschaftsauskunft derselben Regel204-Sitzung.

## Spielergebnis

- **Stationen:** aktuelles Original-Lager aus `session.ansicht().stationen`, eigene Stationskasse aus `session.zustandReferenz().owners`.
- **NPC-Konzerne:** echte verfügbare Kassen und tatsächlich zugeordnete eigene Schiffsklassen für Bergbau, Spedition und Werft. Keine Fremdsteuerung.
- **Werft:** die vier bestehenden `house`-Angebote (Aldera-Miner/-Frachter, Nadir-Miner/-Jäger) samt tatsächlichem Core-Gate und konkretem Ablehnungsgrund.
- **Navigation:** ein positiver Kaufstatus öffnet nur das vorhandene Angebot und setzt den Tastaturfokus. Erst der originale `session.ausfuehren`-Auftragsknopf bucht.
- **Bilanz:** vorhandenes Weltgeld, Mint und Burn werden lesend angezeigt. Alle wechselnden Inhalte ausschließlich mittels `textContent`, nicht mittels HTML-Einfügen.
- **iPad:** responsives Kachel-Layout, Buttons mindestens 48 CSS-Pixel, unveränderte Touch-/Cockpitnavigation.

Keine neuen Wirtschaftsregeln, Preise, Erzquellen, NPC-Rechte, Warenvorräte, Produktionsbefehle, Spielstandfelder, Emissionen oder automatische W6-Firmenpolitik.

## Prüfungen / Merge-Gates

- Die lokale isolierte V8-JavaScript-Syntaxprüfung für die beiden geänderten JS-Dateien war erfolgreich. Das ist **kein** Node22-Core-/Browser-Regressionsnachweis.
- `tests/j12-wirtschaftsterminal.test.mjs`: Authentischer P1-Seed42-Start, reale Originalangebote und ein 600-ISK-Minerkauf, unabhängige Weltgeld-/Core-/Save-Prüfung und statische Ausführungsschranken der lesenden Darstellung.
- `tests/p1-spielstart-browser.cjs`: zusätzliche Probe für alle vier vorhandenen Touchgrößen in Chromium und WebKit, Live-Stationen, NPC-Kassen, gültiges Kaufangebot, reiner Tabwechsel ohne Buchung; anschließend bisherige echte Kauf-/Flug-/Save-Kette.
- CI-Gates erst nach tatsächlichen GitHub-Actions-Ergebnissen als bestanden markieren. Echte iPad Safari-/NAS-Geräteabnahme bleibt offen.

**Nicht zusammenführen**, solange Node22-Gesamtsuite, Root-/NAS-Einzeldatei-Check, Chromium/WebKit und Save/Load nicht erfolgreich nachgewiesen sind. Vor Integration gesichertes main-Backup und eigener Integrations-PR; stehende Freigabe nur bei vollständigem Gate. W6 #382/#385 bleibt unabhängig und gesperrt.
