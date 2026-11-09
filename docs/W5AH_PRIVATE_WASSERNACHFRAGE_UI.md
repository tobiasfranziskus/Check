# W5ah – spielbarer privater Wasserbedarf und echte zweite Charge

> **[DRAFT/ANALYSE · 09.11.2026]** Gestapelt auf W5ag [PR #278](https://github.com/tobiasfranziskus/Check/pull/278). Die einzige verbindliche Planung bleibt `main/docs/ROADMAP.md`. Kein Produktbeschluss, Merge, Deployment, neue Emission oder Save-Migration.

## Zweck und Begrenzung

W5ag #278 bewies zwei unabhängig vergütete Privatpiloten mit je 120 ISK aus wirklicher Flugzeit und einen ersten freiwilligen Wasserkauf. W5ah bringt diese **bereits vorhandene Original-Regel195** erstmals in eine separat bedienbare Touch-Forschungsoberfläche (`prototypes/w5ah/index.html`) und prüft einen **zweiten tatsächlich finanzierten** 10-Eis→10-Wasser-Fabrikauftrag mit erneuten individuellen Käufen. Keine neuen Wirtschaftsbefehle: Aufträge, Kaufpreis, Kontorechte, Treuhand, Tick, physischer Warenverbrauch, Hash und Audits laufen ausschließlich im gemeinsamen `prototypes/w5ac/rule191-w5-ferry-core.js`.

Die UI hat weder IndexedDB noch LocalStorage oder Auto-Tick; auf Knopfdruck geschehen nur explizite, vom Rule195-Core validierte Befehle. Forschung kann als JSON exportiert und nur nach Rule195/Schema8-, Personal-, W3/W4/W5-, Güter- und ISK-Audit wieder geladen werden. Absichtliche oder falsche Unterdeckung wird ohne Zustandswechsel verweigert. Die Versionen 191–194 und produktive Version 14/Saves bleiben unberührt.

## Nachweisziel (Seed 42, manuelle Auftragsfolge)

- 50 Eis werden auf echtes Miner-Arbeitskapital gefördert, verkauft und im selben Core über voll bezahlte W5n-Eisfracht nach Nadir gebracht. Ein separater echter W3-Erz-Rundflug zahlt ebenfalls eigene private Flugminuten.
- 10 Wasser entstehen aus 10 echtem Eis und 20 ISK vorfinanzierter Fabrikarbeit. Erzpilot (120 ISK) kauft freiwillig 6 Wasser/84 ISK, Eispilot (nach 80 Minuten) 4 Wasser/56 ISK. Eisrückflug zahlt anschließend weitere 40 Minuten.
- **Zweitkauf:** Bei Tick 290 sind weiterhin physische 40 Eis in Nadir. Nadir finanziert aus **seinem** verbliebenen Geld eine weitere 20-ISK-Produktionscharge, die bis Tick 310 10 neues Wasser erzeugt. Erzpilot kauft freiwillig 2 für 28 ISK, Eispilot 4 für 56 ISK, 4 Wasser bleiben real unverkauft. Beide Piloten sparen je **8 ISK**; kein Geld aus fremden Kassen.
- Kumuliert: 20 Wasser wirklich produziert, **16 Wasser** für **224 ISK** nachweislich privat bezahlt und verbraucht, 4 Wasser verbleibender Bestand, 33.000 ISK Weltgeld, 0 Minting. Dies ist **kein** vollständiger neuer Fluglohnzyklus: Alle Zweitkäufe stammen aus den bereits tatsächlich bezahlten 240 ISK Arbeitsminuten. Langfristige zahlende Nachfrage oder Konzernrentabilität ist damit **nicht** bewiesen.

## Tests, Grenzen und Entscheidungsbedarf

- `tests/w5ah-private-zweitkauf.test.mjs` prüft zwei reale Fabrik-/Kaufzyklen, individuelle Bilanzen, verweigerten Fremdzugriff/unterdeckte Käufe, exakte Zustandsidentität, isoliertes Rule195-Save/Load und gefälschte Imports. `tests/w5ah-touch.py` prüft Chromium-Touch auf vier Größen inkl. manueller Befehle, negiertem Import und Slot-Schutz. W5ah-GitHub-CI führt sämtliche bestehenden Node-Tests aus.
- Die zweite Wassercharge benötigt keine zweite Eisfracht (30 Eis bleiben physisch im Lager), wohl aber die echte zweite 20-ISK-Fabrikarbeit. Es gibt keine automatische Nachfrage, wiederkehrende neue Löhne, persönliche Lebenshaltungspflicht, Pilotengehaltsentscheidung oder nachhaltiges W6-Modell. Der historische Forschungs-Wasserpreis 14 ISK ist **nicht** als Produktbalancing beschlossen.
- Echte iPad Safari, NAS, Rule195-Save-Migration und integrierte `main/index.html`-Spielbarkeit sind **nicht** abgenommen.

**Prüfstatus:** CI-Ergebnis ausschließlich nach ausgeführtem GitHub-Run ergänzen; ein angelegter Test ist kein bestandenes Ergebnis.
