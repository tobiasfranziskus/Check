# Aphros Void

**Weltraum-Konzernmanagement, deterministische Wirtschaft und persönlich spielbare 2D-Schiffe.** Statisches HTML/CSS/Vanilla JavaScript für iPad Safari, GitHub Pages und NAS.

[**Aphros Void – Neue Karriere starten**](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) · [Hauptseite](https://tobiasfranziskus.github.io/Check/) · [Klassische Konzernoberfläche](https://tobiasfranziskus.github.io/Check/prototypes/verbund/konzern.html) · [Jägertraining](https://tobiasfranziskus.github.io/Check/prototypes/j4c/index.html)

## Aktueller integrierter Stand · 15.11.2026

**[MAIN] `22146ac4` / J12+J11+P1**: [Integrations-PR #387](https://github.com/tobiasfranziskus/Check/pull/387) ergänzt den echten Karrierebildschirm um eine lebende Wirtschafts- und Stationsansicht. Aktuelle Lager, Firmenkassen, Eigentümerflotten und zulässige/gesperrte Werftkäufe werden unmittelbar aus dem Original-Core gelesen. Positive Kaufangebote führen nur zum bereits bestehenden Kaufknopf; NPC-W6-Automatik bleibt aus. [301/301 Node22, NAS/Touch](https://github.com/tobiasfranziskus/Check/actions/runs/43725162873) und [Chromium/WebKit je 4 Touchgrößen](https://github.com/tobiasfranziskus/Check/actions/runs/43725162790) im Integrations-PR erfolgreich. [Vorversion geschützt](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j12-sector-terminal-20261115). **[PAGES]** Deployment des neuen J12-Commits noch nicht unabhängig bestätigt; vorheriger J11-Deploy bleibt belegt. Echte iPad-/NAS-Geräteabnahme weiterhin offen.

**[MAIN / Vorversion] `b47a8303` / J11+P1**: [Neue Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) ohne Forschungsdatei, Firmenprolog und **wirklich spielbare Miner- und Frachtercockpits** aus derselben originalen Regel204-Wirtschaft. Echter Frachterkauf **750 ISK**, Miner **600 ISK**, freier Aldera-Flug mit **40 ISK Fluglohnreserve**; nach echtem Eisabbau eine voll finanzierte **50-Eis-F4-Rundfracht** für 120 ISK Pilotenlohn und 240 ISK Frachtentgelt. Keine Emission, keine erfundene Ware, keine neuen Save-Schemata. [Integrations-PR #383](https://github.com/tobiasfranziskus/Check/pull/383) · [Pages-Deploy #43716078089](https://github.com/tobiasfranziskus/Check/actions/runs/43716078089) · [Backup vor J11](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j11-freighter-integration-20261115).

**[QA]** **299/299 Node22** und Chromium/WebKit je vier Touchgrößen inkl. komplettem öffentlichen Karriere-Frachter-Spielpfad mit Original-Endhash `e4514490aedc13bd`. [E2E-Integration](https://github.com/tobiasfranziskus/Check/actions/runs/43715693985) · [vollständige Node-/NAS-Prüfung](https://github.com/tobiasfranziskus/Check/actions/runs/43715694123). Die originalen Freifluggrenzen (kein Nadir, keine freie Steuerung während F4-Vertrag) bleiben erhalten. **[DRAFT/ANALYSE]** laufende NPC-/W6-Wirtschaftsforschung und [K7-Käufergeldsperre #376](https://github.com/tobiasfranziskus/Check/pull/376) sind nicht gelöst oder integriert.

**[MAIN/J9–J10b]** Ein für 600 ISK rechtmäßig gekaufter Miner fliegt ohne JSON-Zwischenwechsel im selben RAUM-1-Cockpit; J10a zeigt echte Werftlager, Firmenkassen und Vertragssperren. **J10b** behebt den Kauf eines tatsächlich produzierten, für den Spieler vorgemerkten **Nadir-K2-Miners** über den originalen 600-ISK-K2-Befehl; fremdes NPC-Eigentum bleibt gesperrt. **[ANALYSE/J10c]** [#374](https://github.com/tobiasfranziskus/Check/pull/374) weist sieben mit Original-Arbeit bezahlte J3-Bauteile nach; für den achten und den vollständigen Jäger fehlen fünf Material beziehungsweise zehn echte Erz. Noch kein automatischer, dauerhaft tragfähiger Jäger-Produktionskreislauf. Echte iPad-/NAS-Abnahme offen.

## Projektquellen

- [**Verbindliche Produkt-Roadmap**](docs/ROADMAP.md) – Ziele, W0–W6, Prioritäten, Freigabe.
- [**Belegter technischer Projektstatus**](docs/PROJEKTSTATUS.md) – aktueller MAIN-/PAGES-Stand, CI, Blocker.
- [**Entwicklungsregeln und Release-Gates**](AGENTS.md) – deterministische Core-, Save- und Merge-Regeln.
- [**Repo-/Forschungsindex**](docs/README.md) – aktive/abgelöste PRs, Backups, Archiv.
- [**Historische Originaldokumentation**](docs/archiv/) – unverändert als Git-Blobs bewahrte ausführliche Berichte.

Forschungs-PRs und historische Zahlen dürfen **nicht** als aktueller integrierter Stand gelesen werden. Kein automatischer NAS-Push und kein Überschreiben von Spielerständen.
