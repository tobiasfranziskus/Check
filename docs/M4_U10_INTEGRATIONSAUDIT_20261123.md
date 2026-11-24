# M4-U10 – unabhängiger Integrationscheck

**[DRAFT / INTEGRATION · 23.11.2026]** Geprüfte Basis `main 43f004dbed92b7128d8e78baee45ee11035b99c1`, Quell-Draft [#593](https://github.com/tobiasfranziskus/Check/pull/593) exakt `8cdb1e72efa4283e37634ab78bb8ebfbd0b69d0c`. Die zehn Quelldateien bilden den Ausgangspunkt dieses getrennten Integrationsbranches. Kein Alt-Forschungsstack.

## Lesender Audit
- Vollständige Produkt- und Testpatches des Quell-PR eingesehen. Core: dieselbe Verschleißrate und Abschreibungsformel, zusätzliche lesende Restminutenfunktion. Null bei erreichter Stilllegungsgrenze, keine Prognose bei deaktivierter Stilllegung.
- J8: Kaufvorschau beginnt mit einem geprüften Zustandsklon; die anschließende Überführungsprobe nutzt Originalbefehle und erneuten Audit auf diesem Klon. Reale Ausführung behält bisherige Angebots-, Eigentums- und Commit-Gates. Keine autonome Bestellung oder Buchung aus dem Operationsboard.
- Karte: Originalbestände/Bedarf, Hauskasse, vorhandener Frachtlohn und Asterion-Hüllen; Warenbedarf ist keine Auftragsvollmacht oder Finanzierungszusage. Kein versprochener kontinuierlicher Ertrag.
- Quell-CI unabhängig per GitHub-API geprüft: 9/9 Workflows completed/success. [W6/Node22](https://github.com/tobiasfranziskus/Check/actions/runs/45231800895): 18/18 erfolgreiche Jobs einschließlich 13×90, S02×365/730 und beider Browserbrücken. [P1](https://github.com/tobiasfranziskus/Check/actions/runs/45231800899) 3/3 erfolgreiche Jobs; [M4](https://github.com/tobiasfranziskus/Check/actions/runs/45231801387) 3/3 erfolgreiche Jobs. 589/589 Node22 laut Quellbericht; bedingter Sicherheitsvergleich dort skipped. Diese Ergebnisse gelten nicht als CI dieses neuen Integrationsheads.

## Eigenes Gate
`tests/m4-u10-integration.test.mjs` ergänzt zwei unabhängige Tests: wiederholte buchungsfreie Kaufvorschauen, Fremdschiffablehnung, Übereinstimmung echter Kassenabgänge mit der Vorschau; Restminuten an der Stilllegungsgrenze, ohne künstlichen Zustand zu persistieren. Lokaler Git-Checkout scheitert an DNS (`Could not resolve host: github.com`), deshalb keine lokale Testausführung behauptet. Eigene vollständige Node22-/Wirtschafts-/Chromium-/WebKit-CI auf finalem Integrationshead erforderlich. Danach Main erneut prüfen, Backup-Referenz anlegen, erst bei bestandenem Gate integrieren und tatsächlichen Pages-Lauf separat nachweisen.

## Parallelität
- [PIR-0/1 #594](https://github.com/tobiasfranziskus/Check/pull/594) bleibt isoliert: sechs gemeinsame Dateien (ROADMAP, PROJEKTSTATUS, Spiel-index, Karte, CSS, J8) plus welt-kern.js, insgesamt sieben. Erst U10 integrieren, anschließend PIR gezielt rebasen und gemeinsam testen. Der abgebrochene PIR-spezifische CI-Lauf auf `066ad765` bleibt offen.
- [P0 #586](https://github.com/tobiasfranziskus/Check/pull/586) überschneidet sich nur in Roadmap/Projektstatus; U10-Sachstand beim P0-Rebase übernehmen, Archivierung nicht zurückdrehen.
- [P0 #589](https://github.com/tobiasfranziskus/Check/pull/589) ohne gemeinsame Dateipfade. Forschungs-PRs bleiben unangetastet.
- Keine neuen W3-/Wasser-Vertragsrechte, keine Piratenregeln, keine Save-Migration, kein Merge/Deploy. Blindtest 60 Minuten, physisches iPad/NAS offen.
