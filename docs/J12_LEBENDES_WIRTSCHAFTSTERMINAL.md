# J12 – lebendes Wirtschafts- und Stationsterminal

**[J12 / INTEGRATION ÜBER PR #387] · 15.11.2026**

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

- **Node22/W5-RC1:** [#43724534987](https://github.com/tobiasfranziskus/Check/actions/runs/43724534987) **301/301 Tests, 0 Fehler, 0 Skips**, inklusive beider neuen J12-Gegenproben, Save/Load und Original-Core-Audit. Root-/NAS-Check `W5_SINGLEFILE_OK`, iPad-Touch-Preflight und NAS-Lieferformat-Job ebenfalls tatsächlich erfolgreich.
- **Browser/P1/J11:** [#43724534999](https://github.com/tobiasfranziskus/Check/actions/runs/43724534999) Chromium und WebKit mit je vier Touchgrößen, neuem Live-Terminal und reinem Angebotswechsel ohne Buchung erfolgreich; danach echte Miner-/Frachter-Käufe, F4-Fracht, 120 ISK Vertragslohn, 240 ISK Frachtentgelt, JSON-Sicherung und unveränderter F4-Endhash `e4514490aedc13bd`.
- **Wirtschaftsregression:** [#43724534998](https://github.com/tobiasfranziskus/Check/actions/runs/43724534998) ausgeführte Jobs erfolgreich; der bedingt ausgelassene `sicherheitsgeografie-vergleich` gilt ausdrücklich **nicht** als getestet.
- **Syntaktische Zusatzprüfung:** J12-JS und Browserprüfskript isoliert mit V8 fehlerfrei kompiliert. Der neue Code stammt weiterhin nur aus P1-Oberfläche und Tests, ohne produktive Kern- oder Speicheränderung.
- **Offen:** echte iPad-Safari-/private NAS-Geräteprüfung; CI-WebKit ersetzt dies nicht.

**Integrationsstatus:** Der separat geprüfte [Feature-Draft #386](https://github.com/tobiasfranziskus/Check/pull/386) wird durch [Integrations-PR #387](https://github.com/tobiasfranziskus/Check/pull/387) kontrolliert nach main übertragen. Die dokumentierten Code-Gates sind grün; die Vorversion muss vor Merge gesichert sein und Pages erst nach Erfolg als veröffentlicht gelten. Der konkrete integrierte Commit und Pages-Deploy werden im Projektstatus geführt. W6 #382/#385 bleibt unabhängig und gesperrt.
