# J10b-K2 – rechtmäßiger Nadir-Minerkauf im echten Konzernspiel

**[DRAFT / 15.11.2026]** Ausgangs-`main 2e89ff83e2ebff31d60304715005b7b07c781a00`. Eigenständige spielbare Korrektur im J8/J9-Konzernspiel; keine Änderung an Core-Wirtschaftsregeln, Besitzerrechten, Geld, Waren, Saveformat, Regelversion, Root195-/NAS-Datei oder NPC-Automatik.

## Konkreter Gameplay-Fehler und Lösung

Bisher trug die J8-Angebotsliste für `buy-st_nadir-miner` einen generischen `shipBuy`-Befehl ein. Der **Original-Core lehnt diesen in Nadir stets korrekt ab**, denn K2-Miner dürfen dort nur vom **wirklich vorgemerkten Bauauftrag-Käufer** erworben werden. Dafür existiert schon seit Regel200 der spezielle, strikt geprüfte Befehl `stationClaimMinerLocal`.

Das Spiel behält seine bestehende Aktions-ID `buy-st_nadir-miner`, ruft dafür aber nun **`house/stationClaimMinerLocal/st_nadir`** auf. Der Core kontrolliert weiter:
- Auf Original-Buchungen beruhende K2-Werftfertigung: physische Hülle im Nadir-Lager, Material, 30 bezahlte Arbeitsminuten und Werftkonto.
- Exakt `house` als legitimer **vorab vorgemerkter Besteller**. Ein für `npc3` gebauter Miner kann von `house` auch mit 600 ISK **nicht** übernommen werden.
- Reale **600 ISK** Käufergeld, vorhandene Stationslagerhülle, eindeutige neue Schiff-ID und unterschriebenen `minerWerft.lokaleKaeufe`-Beleg.
- Die eigene Nadir-Hülle kann danach in der **bereits integrierten J9-Cockpitansicht** ohne Save-Zwischenweg persönlich geflogen werden. Kein freier Jäger oder zweiter Simulationskern.

Das ursprüngliche `shipBuy` bleibt für den tatsächlichen Aldera-Miner, sowie echte bestehende Frachter/Jäger, unverändert. K2-Miner an andere NPC-Käufer werden weiterhin **nicht** über den Spieler geklickt. Wenn kein real vorgemerkter Hausminer fertig ist, bleibt das Angebot deaktiviert.

## Vollständig echt finanzierter Test-Spielstand

`tests/j10b-k2-kauf-fixture.cjs` **konstruiert** beim Test jeden Zustand aus einem neuen, exportierten Regel195-Seed42-Spielstand durch die bestehenden sechs J8-Konverter und originale Core-Aktionen der jeweils wirtschaftlich berechtigten Unternehmen. Es wird kein manipulierter oder kostenloser Testsave abgelegt. Jeder Schritt und jede Arbeitsminute wird auditiert:

1. Spedition kauft aus eigener Kasse einen existierenden Frachter für 750 ISK.
2. Nadir, Bergbau, Spedition und Werft geben jeweils die Original-K7-Erzvertragsaktionen ab; die Simulation liefert tatsächlich 50 Erz.
3. Nadir bezahlt Raffineriearbeit, externe Werft erfüllt den finanzierten W5-Frachterauftrag; Nadir raffiniert weitere 10 Erz zu 5 Material.
4. Die ursprünglichen zwei Aldera-Gründungsminer werden durch echte `house`-/`npc3`-Käufe regulär aus dem Verkaufslager genommen (kein Gratis-Verschwinden).
5. Die externe Werft baut aus den echten 5 Material mit **30 bezahlten Minuten** einen Nadir-Miner und merkt ihn verbindlich für `house` (separate Testvariante `npc3`) vor.
6. Erst **danach** ist die echte 600-ISK-Hausabholung erfolgreich. Danach 33.000 ISK Weltgeld, Mint/Burn 0, alle Waren-/Schiffs-/Eigentums-/Lohnbelege und Save-/Load-Hashes erhalten.

Dies ist ein **begrenzt ausgeführter Eingangsbeleg**, keine Behauptung autonomer NPC-Verträge im normalen Browser. Die Original-NPC-Erzpendelautomatik verhindert weiterhin ohne rechtmäßige Vertragspriorität die frühe K7-Verwendung; diese separate Produktentscheidung bleibt offen.

## Prüfpfade

- `tests/j10b-k2-nadir-kauf.test.mjs`: echter Bau-/Kaufpfad, ursprünglich gesperrtes Angebot, fremde `npc3`-Vormerkung verweigert, manipulierte Werft-/Kassen-/Schiffbestände im Import abgelehnt, deterministischer Load/Replay, echter J9-Pilot und unveränderte Original-195-Datei.
- `tests/j10b-k2-kauf-browser.cjs`: Chromium/WebKit je 3 Touchgrößen, echter bestätigter Regel204-Dateiimport, **600-ISK-Kauf**, eigene neue Nadir-Hülle, sofortiges 2D-Cockpit derselben Welt, manueller Export und vollständig unabhängiger Core-/Money-Audit.
- Bestehender J4e-/J8-/J9-/J10a-Playwrightworkflow erneut über alle Touchgrößen, Root-/NAS-Schutz, vollständige Node22- und Wirtschaftsregression.
- **Bis zu den tatsächlichen CI-Resultaten keine Testerfolge behaupten.**

**Grenzen:** Es wurde keine neue Nadir-Bauautomatik für den Live-Spieler freigeschaltet und **kein Jäger produziert**. Für den nächsten Jäger aus frischer Wirtschaft fehlen nach real finanzierter K2-Siliziumförderung noch W4-Material und 8 J3-Bauteile plus bezahlter J4-Auftrag. Echte iPad-Safari-/NAS-Geräteabnahme offen.
