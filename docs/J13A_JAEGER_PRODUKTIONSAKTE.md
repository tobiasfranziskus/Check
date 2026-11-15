# J13a – Jäger-Produktionsakte in der echten Karriere

**15.11.2026 · [DRAFT / nicht integriert]**

Ausgangsbasis: `main 22146ac4c6a1d166677655f32e8bc19c892d97bc` (J12). Diese Stufe ist **kein vollständig produzierter Spielerjäger**. Sie macht erstmals die bestehende, aber noch nicht durchgängig finanzierte Produktionskette als spielbezogenes Ziel nachvollziehbar.

## Technischer Vertrag und Spielerwirkung

Im öffentlichen Karriereeinstieg erscheint der Tab **Jägerprojekt**. Die neue `jaeger-akte.js` liest allein den aktuellen autoritativen Regel204-Zustand sowie `welt.rules.j3/j4`, `welt.industriePreise` und das bereits vorhandene, unmittelbar durch den Original-Core geprüfte `house`-Kaufangebot. Alle Texte werden als DOM-`textContent` ausgegeben.

Die fünf Stufen: **K7-Erz/W4-Material → J2b-Silizium → J3-Bauteile → J4-Jägerwerft → rechtmäßiger 900-ISK-Kauf**. Die Akte zeigt reale Nadir-Lager, noch benötigte Waren, zwei finanzierte Arbeitsrezepte (J3 = 2 Material + 1 Silizium + 8 ISK Arbeit je Teil; J4 = 8 Bauteile + 4 Material + 32 ISK Arbeit), Alderas Kapital für einen neuen K7-Erzkauf, Nadir- und house-Kassen sowie einen tatsächlich laufenden J3/J4-Auftrag, falls vorhanden.

Wichtig: Nach einem real begonnenen J4-Bau sind bereits verbrauchte Materialien nicht fälschlich erneut als „fehlend“ ausgewiesen. Gibt es eine fertige bezahlte Hülle, ist der bisherige `shipBuy`-Auftrag nutzbar und die normale persönliche `J9/J11`-Pilotenauswahl kann den Eigentümer prüfen. Der neue J13-Button führt **nur** zum unveränderten Angebotsknopf, er bucht keinen Kauf.

## Nicht geändert / keine neue Produktentscheidung

- Keine zusätzlichen `st_nadir`-, `npc3`-, `transport`- oder `werft_extern`-Befehlsrechte für `house`.
- Keine `industrialOreOffer/Commit`-Automatik, keine K7-Fremdsignatur, kein NPC-W6-Opt-in.
- Kein neues Siliziumfeld, Werftkapital, Preis, Lohn, Startlager oder ISK-Mint.
- Keine Änderung an `prototypes/welt/**`, Regel195/204/Schema8, Speicher-/Ladeformat, Root-Hauptoberfläche oder NAS-Einzeldatei.
- Der aus [J10d #376](https://github.com/tobiasfranziskus/Check/pull/376) bekannte 500-ISK-Käuferengpass bleibt [ANALYSE], nicht gelöst.
- W6-Forschung [#382](https://github.com/tobiasfranziskus/Check/pull/382)/[#385](https://github.com/tobiasfranziskus/Check/pull/385)/[#389](https://github.com/tobiasfranziskus/Check/pull/389) bleibt unabhängig und nicht produktiv aktiviert.

## Abnahme

Neu: `tests/j13-jaeger-akte.test.mjs` prüft einen echten unveränderten Regel195→204-Karrierestart, Ressourcen-/Finanzierungsstand, rechtmäßigen house-Minerkauf und einen zurückgewiesenen fremden Werftauftrag. Geld-, Eigentums-, Save/Load-, Core-Audit- und Original-195-Unverändertheit sind eingeschlossen.

Die bestehende `tests/p1-spielstart-browser.cjs` prüft J13 vor dem bekannten echten P1-Flug-/Save-Weg in **Chromium und WebKit, je vier Touchgrößen**: Tab sichtbar, fünf Stufen, echte Jägerpreise, kein Kauf ohne Hülle, kein finanzieller Seiteneffekt.

**Ausgeführtes Abschluss-Gate auf Feature-Head `36ed3819`:** [W5/Node22/Root/NAS/Touch #43729228526](https://github.com/tobiasfranziskus/Check/actions/runs/43729228526) **304/304 Tests, 0 Fehler, 0 Skips**, inklusive **3/3 neue J13-Prüfungen**, NAS-Einzeldatei `W5_SINGLEFILE_OK` und Touch-Preflight. [P1-Browser #43729228624](https://github.com/tobiasfranziskus/Check/actions/runs/43729228624): **Chromium + WebKit je vier Touchgrößen**, acht erfolgreiche P1-Rundläufe mit J13-Jägerakte und acht anschließende J11-Pfadrunden (tatsächlich 4/Engine und Testart). F4-Endhash unverändert `e4514490aedc13bd`, Weltgeld 33.000 ISK, Mint/Burn 0. [Wirtschaftsregression #43729228532](https://github.com/tobiasfranziskus/Check/actions/runs/43729228532): ausgeführte Jobs erfolgreich; der bedingte Sicherheitsgeografie-Job blieb **skipped** und wird ausdrücklich nicht als getestet gewertet. Reiner Dokumentations-Nachtrag nach den geprüften Code-Commits. Das separate main-Integrations-Gate und tatsächlicher Pages-Deploy sind danach noch unabhängig zu belegen. Echte iPad-Safari- und private NAS-Geräteabnahme weiterhin offen.

## Nachfolgender sachlicher Blocker

Der Nadir-Unternehmenseigentümer muss eigene K7-, J3- und J4-Aufträge **aus echter Liquidität** erteilen. Der Spieler darf diese NPC-Entscheidungen nicht durch UI-Buttons unterschreiben. Bis finanzierte eigenständige Werftproduktion im echten Karrierestart nachgewiesen oder ein separat freizugebendes Vertragsrecht beschlossen ist, bleibt der **erste aus dieser Karriere produzierte eigene Jäger unvollständig**. Die J13-Akte behauptet ausdrücklich keinen fertigen Jäger.
