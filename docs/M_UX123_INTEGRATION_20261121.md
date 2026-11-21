# Aphros Void – M-UX1/2/3 Integrationsprüfung [DRAFT]

Erstellt: 21.11.2026. Ausgangs-main: ac480b4c8d5f06f52e6d1d657e0c6d7d6526fa8f. Git-Basis ist der M-UX1-Quell-Head cf39ef6551d407184a6d31c8ae4dca5bd08d7dfa.

## Quellen und Scope

- [M-UX1 #552](https://github.com/tobiasfranziskus/Check/pull/552): echte Kaufpreise, Kauf-/Kassenbestätigung, rechtmäßig angebotene Förderalternative bei ausverkauftem Frachter.
- [M-UX2 #553](https://github.com/tobiasfranziskus/Check/pull/553): bidirektionale Karte/Flottenauswahl, separate Betrachtung fremder Schiffe, Original-Sperrgründe.
- [M-UX3 #554](https://github.com/tobiasfranziskus/Check/pull/554): originale Frachtphasen und Förderstatus, getrennte Waren-/Geld-/Lohn-/Buchwertbelege sowie regulärer Ein-Minuten-Tick während laufender Aufträge.
- [S1/S2-Dokumentation #550](https://github.com/tobiasfranziskus/Check/pull/550): Dokumentationsabgleich des bereits integrierten und veröffentlichten Management-Spielfelds.

## Bewusste Konfliktauflösung

UX1 und UX3 bearbeiten denselben `auftrag(id)`-Block von `prototypes/spiel/spiel.js`. Die UX3-Meldung wurde in die von UX1 geänderte Originalbuchung mit Kaufpreis-/Speicherrückmeldung eingefügt statt den älteren UX3-Block zu überschreiben. Die UX2-Flottenbrücke bleibt unverändert. Die zusätzlichen Browsertest-Hunks aus UX2 und UX3 wurden beide in `tests/p3-manager-karte-browser.cjs` aufgenommen. Neues Feedbackmodul und Test aus #554 wörtlich übernommen. Statusdokumente nehmen den Main-/Pages-Abgleich aus #550 auf; UX1 und UX3 haben eigene Nachweisberichte.

Keine Eingriffe in Wirtschaftskern, Marktpreise, Eigentum, RNG, Geldschöpfung, Save-Schema oder Originalreferenzhashes beabsichtigt. Keine fremden Schiffe disponieren.

## Nachweisstand vor Integrations-CI

Quell-PR #552: 567/567 Node22 und Browser Chromium/WebKit in vier Größen. Quell-PR #553: 566/566 Node22 und Chromium/WebKit in vier Größen. Quell-PR #554: lokaler erster Volltest 562/567 wegen fünf P0-Dateiinventarfehlern, die vor dem Git-Tracking der neuen Moduldatei auftraten; daraufhin gezielter P0-Nachlauf 8/8 erfolgreich. Ein durchgehend grüner lokaler Volltest von #554 ist nicht belegt. Getrennte Quelltests ersetzen keine gemeinsame Integrations-CI.

**Offen vor main:** alle vollständigen gemeinsamen Node22-Workflows, Geld-/Waren-/Eigentums-/Save-/Replay-Audits, Chromium/WebKit bei 1180×820 / 1024×768 / 820×1180 / 390×844; schnelle Kauf- und Stop/Start-Doppeltipps; Karte→Flotte→Auftrag; Root→frische Karriere; zwei rechtmäßig finanzierte Frachtrunden; Original-Sperrgründe und Speicherfortsetzung. Vor Main-Merge Backup-Tag/-Branch zum tatsächlichen main-Head; danach eigenen Pages-Deploy und Root-HTTP-Abruf prüfen.

**Nicht durch diese Abnahme ersetzt:** echter iPad-Safari-Gerätetest, privates NAS und unabhängiger interaktiver 60-Minuten-Erstspieler-Blindtest.
