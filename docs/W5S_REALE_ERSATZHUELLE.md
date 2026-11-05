# W5s-a – tatsächlich finanzierter Ersatzfrachter und offene Rückführung

**[DRAFT / ANALYSE · 05.11.2026]** Forschungs-PR [#202](https://github.com/tobiasfranziskus/Check/pull/202), gestapelt auf [W5r #200](https://github.com/tobiasfranziskus/Check/pull/200), getrennt von Codex' Legacy-UI-Hub. `main b4e604d6` bleibt v0.12.5/Regel14/Schema8 und unverändert. W5r-Regel32/Schema8 und alle bestehenden Speicherprofile bleiben erhalten. **Keine freigegebene Produktregel**, kein Merge oder Deployment.

## Reproduzierbarer realer Einzelbeleg

Der Test `tests/w5s-ersatzwerft-vertikalschnitt.test.mjs` verwendet den **vorhandenen deterministischen W5r-Core** und ausschließlich bestehende Befehle `shipBuy`, `shipMine`, `shipFreight`, `stationRefine`, `stationBuildShip` und `shipBuy`. Es gibt **keine Test-ISK, Test-Waren oder direkt gesetzten Werftbestände**.

1. Hauskonzern kauft **wirklich** einen weiteren 600-ISK-Miner und fördert aus eigenem Betriebskapital 50 Erz. Vorhandener W5h-Großhändler kauft echte Erzware.
2. Der wirklich gekaufte Erstfrachter `sh002` befördert 50 Erz auf vollständig finanzierter Hin-/Rückfahrt **Aldera–Nadir–Aldera**, nachweislich 50 tatsächliche W3-Liefermenge.
3. Die W4-Raffinerie verarbeitet aus 10 physisch angelieferten Erz **5 Material** gegen bezahlte Arbeitsminuten.
4. Die bestehende W5-Werft kauft 5 Material für **500 ISK** aus ihrer vorhandenen Kasse und bindet **30 ISK** in reales Werftarbeitstreuhand. Nach 30 bezahlten Minuten wird **genau eine physische Frachterware** in Nadir hergestellt.
5. Die Spedition kauft den Frachter **für 750 ISK** mit dem bestehenden `shipBuy` aus Nadir. Die reale neue Schiff-ID `sh004`, Eigentümer `transport`, befindet sich **in Nadir**, ohne magische Verlagerung nach Aldera. Vollständige Geld-/Waren-/Produktionsaudits nach den Teilhandlungen sowie ein Save/Load-Hash beweisen den Wertpfad.

**[TEST]** Gezielt ausgeführt in GitHub Actions [#42122520809](https://github.com/tobiasfranziskus/Check/actions/runs/42122520809): 2/2 Prüfungen grün nach korrigiertem Core-Step-Limit, 0 Fehler/Skips. Beleg-Hashes unmittelbar nach Kauf:
- **Seed42** `0a88b71b62ab46f0`, **Seed7** `c5a7403fbe67d59e`.
- Je Seed: 50 Erz geliefert, 5 Material erzeugt, eine Frachterware hergestellt und für 750 ISK gekauft, bezahlte Werftarbeit 30 ISK, Speditionskasse nach Kauf **620 ISK**, Weltgeld **33.000 ISK**, `minted=0`.

### Wichtige Begrenzung des Beweises

**Der Eis-Autopilot würde denselben Frachter sonst vorher für eine bezahlte Eisfracht reservieren.** Damit zunächst der Schiffbau ohne zusätzliche neue Flottenhülle im gleichen W5r-Core getestet werden kann, verwendet ausschließlich der zweite Testfall ein **nicht gespeichertes, explizites Scheduling-Diagnoseprofil** `oreFirst={...W5R_RULES,w5o:{...W5R_RULES.w5o,versorgungZiel:-1}}`. Es stoppt für diesen einmaligen W3-Werftnachweis die automatische Eisfracht-Disposition; weder Core-Regelnummer noch Startkapital, Waren, bestehende Produktionskosten oder Save-Schema werden geändert. Dies ist **keine** freigegebene Produkt-Dispatcherregel. Der erste Test beweist mit unverändertem R32-Autopiloten, dass der konkurrierende W3-Auftrag bei bereits laufender Eisfracht **korrekt ohne Nebenwirkung abgelehnt** wird.

**[TEST] Tag30 Negativ-Gate auf Seed42:** Am Forschungs-Tag30 ist der bisherige Frachter nach dem unveränderten W5r-Verschleiß tatsächlich verloren. Die bereits **bezahlte neue** Hülle `sh004` steht aber weiterhin in **Nadir**, nicht in Aldera: `w5r.frachter.lost=1`, `w5r.frachter.bought=0`, `w5r.frachter.id=null`, kein neuer Eisfrachtauftrag; **kein** Gratis-Kauf oder Standortwechsel. Unabhängiger Audit und Roundtrip bleiben grün, Weltgeld **33.000 ISK**, R32-Hash Tag30 `395f0ca5feccc7e8`. Eine bezahlte physische Überführung samt R32-Folgebuchungen/Dispatcher ist noch nicht umgesetzt.

## Kleiner Auditfehler behoben

Die bisherige R32-Hüllenprüfung zählte nur den initialen und automatisch ersetzten Miner/Frachter. Ein zusätzlich regulär gekaufter **House-Miner** wurde deshalb fälschlich als Bilanzfehler abgewiesen. Der W5s-Branch rechnet in `m_core_w5r.audit` je Klasse jetzt **tatsächlich existierende Schiffs-IDs plus belegte R32-Verluste** gegen `ledger[type].consumed`. Die normalen Eigentums-/Kauf-/Werft-/Geld-/Warenaudits bleiben weiter eingeschaltet. Dieser Fix ist **keine** Gratis-Erzeugung oder neue Verschleißregel. Manipulations- und R32-Altregressionen müssen auch in der gesamten Node-CI grün bleiben.

## Nächstes W5s-b-Gate, noch nicht implementiert

- Ein expliziter, vor der Arbeit finanzierter **Hüllen-Überführungsauftrag Nadir→Aldera** (ohne Treibstoff): tatsächlicher Schiffsstandort, Zeit, bezahlter Pilot, Rückfahrt-/Unterhaltsbudget und Eigentums-/Befehlsprüfung. Kein sofortiges Teleportieren der Handelsware.
- Anschließend originale R32-Ersatzzuordnung auf **wirklich erworbene, am richtigen Ort einsatzfähige** Frachter erlauben, ohne vorhandene `shipBuy`-Käufe doppelt zu zählen. Kein vollständiger automatischer Flottenneustart schon nachgewiesen.
- Miner-**Neubau** statt Verwendung endlicher fertiger Aldera-Minerhüllen ist ein **separates** physisches Rezept-/Finanzierungs-Gate und kann nicht durch bloßen Frachterbau ersetzt werden.
- Produktionskette unter konkurrierender **Eisversorgung** wirtschaftlich finanzieren; Stresstests bei mangelnder Werftkasse, fehlenden Materialien/Fracht, Sparfällen, insolventen Eigentümern und fehlendem Lager. Für eine größere echte Integration **13 feste Seeds ×90 Tage**, 365 Tage, unabhängige Geld-/Waren-/Schiffs-Audits, Replay/Save/Load. Kein eigener Simulationskern, keine Emission, keine individuelle Rettung.
- Alte R32-Hashes unter denselben Befehlen müssen unverändert sein. GitHub-Gesamt-CI des aktuellen Heads separat verifizieren; echtes iPad Safari/NAS weiter ausstehend.

**Fazit:** Die produktive **Ersatzhülle kann heute aus dem bereits bestehenden W3–W5-Core real hergestellt und bezahlt werden**. Beweis für einen dauerhaft funktionierenden **Ersatztransport und vollständigen Wiederanlauf** steht ausdrücklich **noch aus**.
