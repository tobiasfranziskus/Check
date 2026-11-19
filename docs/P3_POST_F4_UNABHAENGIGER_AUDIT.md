# P3 – unabhängige Folgeprüfung der zweiten F4 nach #509/#510

**[DRAFT / AUDIT · 19.11.2026]** Dieser unabhängige Prüfbranch ist auf dem exakt identifizierten Forschungskopf **[#510 `52fddda1cd997c388ea15c80cc75bfe6beb334a2`](https://github.com/tobiasfranziskus/Check/pull/510)** aufgebaut. Seine Ausgangsbasis ist die Sicherheitskorrektur [#509](https://github.com/tobiasfranziskus/Check/pull/509) und das ursprünglich kritische unabhängige [Audit #508](https://github.com/tobiasfranziskus/Check/pull/508). **Keine produktive Core-, Geld-, Waren-, Browser-, Save- oder Balancingregel wird hier verändert.**

## Ausgangs-Gates überprüft

- Original-`main` bleibt zum Prüfzeitpunkt `97214df1c8650b08f21fdb15d9421aafbe096ecc`, mit der schon veröffentlichten Streckenbelegung in Kapitel 06. #510 und dieser Review sind gestapelte Forschung; keine geänderte öffentliche Warteschlange.
- **#510-CI auf genau `52fddda1`:** JavaScript-Wirtschaftsworkflow `44452541794` erfolgreich, nach Log **542/542 Node22**, darunter der neue doppelt identisch reproduzierte signierte `sh010`-F4 (3377→3437 W5ac, 3557→3677 F4, 50 Eis, 120 ISK Pilotlohn, 240 ISK Frachttarif, Original-Käufer-/Arbeitstreuhand). W5-RC1/Touch/NAS-Build `44452541731` und Jäger-Chromium/WebKit `44452541778` vollständig erfolgreich. W6/P8g `44452541709` zum Zeitpunkt des ersten Audits noch nicht vollständig abgeschlossen; dessen bereits grüne Szenariojobs sind **keine** 13×90-Prüfung der **aktivierten** P3-Spezialqueue.
- #509 beweist die konkrete Reparatur des Save/Load-Streckenkonflikts, J8-Fail-Closed, des endlichen vorläufigen NPC-Vorrangs und der Verschleißsperre in seiner isolierten Forschung. Das sind keine verbindlich gespeicherten Wartescheine.

## Neue unabhängige Prüfung (dieser PR)

1. `tests/p3-post-f4-independent.test.mjs`: Prüft den von #510 **neu hinzugefügten F4-Antrag** beim regulären J8-Zustandswechsel und nach JSON-Import: unverbindliche Vormerkung wird vollständig verworfen, Originalhash und Kassen bleiben identisch, ein neuer Antrag ist erlaubt. Prüft eine stillgelegte Zweithülle sowohl **vor F4-Annahme** als auch **nach Annahme und vor Start**; keine F4-Buchung, kein Haus-ISK-Abfluss. Geld, Ware, Eigentum, Streckenexklusivität und Save/Load bleiben Teil der Assertions.
2. `tests/p3-post-f4-soak.cjs`: Gegenüberstellung **originaler Rule204-Politik ohne Queue** und **mit genau einer bezahlbaren Forschungs-W5ac-Anmeldung und höchstens einer nachgelagerten F4-Anmeldung**. Keine zusätzlichen NPC-Käufer, Waren, Geldemissionen oder absichtlich abgeschlossene Ersatzaufträge. Jede Testwelt beginnt mit demselben signierten Mehrschiff-Originalsave; Politik wird (wie in #508) explizit regimegetreu neu gesetzt. In der Forschungswelt wird nach rechtmäßigem Ferry-Abschluss und Freigabe des NPC-Vorrangs der echte zweite F4-Antrag gestellt, wenn der Frachter tatsächlich in Aldera angedockt ist. Ausschließlich Original-F4-Quote und -Execute dürfen in diesem Forschungslauf Geld und Ware bewegen.
3. **Messgrößen/Abbruch:** je Checkpoint Originalaudit, 33.000 ISK Weltgeld, Mint/Burn 0, Save/Load-Hash, kein paralleler W3/W5n/W5ac-Auftrag, Spieler-F4 getrennt von NPC-Eis, NPC-/Hausüberführungen, Ersatz- und Industriekennzahlen sowie vollständiger Endhash. Baseline- und Forschungsstart müssen dieselben Hashes besitzen; alle 13 Szenariopolitiken benötigen unterschiedliche Ausgangshashes. In S02 wird eine echte zusätzliche bezahlte Haus-W5ac und F4 verlangt; echte Krisenregime dürfen scheitern.
4. **Szenariomatrix in eigener Actions-Datei:** 13×90-Tage-Paare (26 Läufe) in drei Gruppen, sowie S02 und S04 je ×730 Tage (weitere vier Läufe), mit regelmäßigen wirtschaftlichen Checkpoints und unverfälschten Negativbefunden.

## Evidenzstatus

Zum Zeitpunkt der ersten Erstellung: **Tests, Soak-Runs und dieses neue CI-Gate noch ausstehend.** Keine Aussage über neue Fairness, Wartezeiten oder Langzeittragfähigkeit, bevor die Jobs wirklich erfolgreich beendet und ihre Originalzahlen ausgewertet sind. Ein fehlgeschlagener oder abgebrochener Job zählt als offen/rot. Der normale W6-Gesamtlauf ohne P3-Warteschlange ist ausdrücklich kein Ersatz.

## Weiter bestehende Integrationssperre

#510 verwendet eine **flüchtige, nicht signierte und nicht treuhänderisch vorfinanzierte** Forschungsqueue. Ihre Beendigung bei J8-Klon ist ein sicherer Abbruch, keine Vertragskontinuität. Der 120-Minuten-Vorrang ist eine vorläufige Forschungsheuristik. Mehr-Eigentümer-Fairness, Widerruf und Rückzahlung vorab gebundener Vertragstreuhand, Migration in eine neue Regel-/Save-Version, die Browser-Integration und die echte iPad-/NAS-Geräteprüfung fehlen weiterhin. **Kein Merge nach main, kein Pages-/NAS-Deployment, keine neue Balancing-/Wirtschaftsregel-Freigabe.**
