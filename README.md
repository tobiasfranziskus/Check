# Aphros Void

**Weltraum-Konzernmanagement, deterministische Wirtschaft und persönlich spielbare 2D-Schiffe.** Statisches HTML/CSS/Vanilla JavaScript für iPad Safari, GitHub Pages und NAS.

[**Aphros Void – Neue Karriere starten**](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) · [Hauptseite](https://tobiasfranziskus.github.io/Check/) · [Klassische Konzernoberfläche](https://tobiasfranziskus.github.io/Check/prototypes/verbund/konzern.html) · [Jägertraining](https://tobiasfranziskus.github.io/Check/prototypes/j4c/index.html)

## Aktueller integrierter Stand · 15.11.2026

**[MAIN] `52d0fe60` · J13a + J12 + J11/P1:** Die reguläre [Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) besitzt jetzt unter **Jägerprojekt** eine reale, lesende K7-/W4-/J2b-/J3-/J4-Produktionsakte: tatsächliche Rohmaterialien, NPC-Kassen, finanzierte Lohnrezepte, Werft- und Kaufsperren. Der Button führt nur bei bestätigtem Originalangebot zum vorhandenen 900-ISK-Kauf – keine fremde NPC-Unterschrift, keine Gratis-Hülle. [J13-Integrations-PR #391](https://github.com/tobiasfranziskus/Check/pull/391) · [Backup vor J13](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j13a-jaegerakte-20261115).

**[MAIN/J12] `22146ac4`:** Das bestehende Universum zeigt mit [PR #387](https://github.com/tobiasfranziskus/Check/pull/387) aktuelle Stationsbestände, NPC-Kassen, Schiffszuordnungen und Original-Core-Kaufangebote. J13 ergänzt ausschließlich die persönliche Jägerakte; der K7-Aldera-500-ISK-Blocker und W6 bleiben offen.

**[QA/J13a]** [Node22/Root/NAS/Touch #43729585557](https://github.com/tobiasfranziskus/Check/actions/runs/43729585557) 304/304, [Chromium/WebKit je vier Touchgrößen #43729585566](https://github.com/tobiasfranziskus/Check/actions/runs/43729585566), [Wirtschaftsregression #43729585461](https://github.com/tobiasfranziskus/Check/actions/runs/43729585461) in ausgeführten Jobs grün. F4-Hash `e4514490aedc13bd`. `main`-Merge bestätigt, **Pages-Deploy für `52d0fe60` über diese Schnittstelle nicht separat verifiziert**; nur der frühere J11-Deploy #43716078089 ist unabhängig belegt. Echte iPad-/NAS-Geräteabnahme offen.

**[MAIN / VORVERSION] `b47a8303` / J11+P1**: [Neue Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) ohne Forschungsdatei, Firmenprolog und **wirklich spielbare Miner- und Frachtercockpits** aus derselben originalen Regel204-Wirtschaft. Echter Frachterkauf **750 ISK**, Miner **600 ISK**, freier Aldera-Flug mit **40 ISK Fluglohnreserve**; nach echtem Eisabbau eine voll finanzierte **50-Eis-F4-Rundfracht** für 120 ISK Pilotenlohn und 240 ISK Frachtentgelt. Keine Emission, keine erfundene Ware, keine neuen Save-Schemata. [Integrations-PR #383](https://github.com/tobiasfranziskus/Check/pull/383) · [Pages-Deploy #43716078089](https://github.com/tobiasfranziskus/Check/actions/runs/43716078089) · [Backup vor J11](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j11-freighter-integration-20261115).

**[QA]** **299/299 Node22** und Chromium/WebKit je vier Touchgrößen inkl. komplettem öffentlichen Karriere-Frachter-Spielpfad mit Original-Endhash `e4514490aedc13bd`. [E2E-Integration](https://github.com/tobiasfranziskus/Check/actions/runs/43715693985) · [vollständige Node-/NAS-Prüfung](https://github.com/tobiasfranziskus/Check/actions/runs/43715694123). Die originalen Freifluggrenzen (kein Nadir, keine freie Steuerung während F4-Vertrag) bleiben erhalten. **[DRAFT/ANALYSE]** laufende NPC-/W6-Wirtschaftsforschung und [K7-Käufergeldsperre #376](https://github.com/tobiasfranziskus/Check/pull/376) sind nicht gelöst oder integriert.

**[MAIN/J9–J10b]** Ein für 600 ISK rechtmäßig gekaufter Miner fliegt ohne JSON-Zwischenwechsel im selben RAUM-1-Cockpit; J10a zeigt echte Werftlager, Firmenkassen und Vertragssperren. **J10b** behebt den Kauf eines tatsächlich produzierten, für den Spieler vorgemerkten **Nadir-K2-Miners** über den originalen 600-ISK-K2-Befehl; fremdes NPC-Eigentum bleibt gesperrt. **[ANALYSE/J10c]** [#374](https://github.com/tobiasfranziskus/Check/pull/374) weist sieben mit Original-Arbeit bezahlte J3-Bauteile nach; für den achten und den vollständigen Jäger fehlen fünf Material beziehungsweise zehn echte Erz. Noch kein automatischer, dauerhaft tragfähiger Jäger-Produktionskreislauf. Echte iPad-/NAS-Abnahme offen.

## Projektquellen

- [**Verbindliche Produkt-Roadmap**](docs/ROADMAP.md) – Ziele, W0–W6, Prioritäten, Freigabe.
- [**Belegter technischer Projektstatus**](docs/PROJEKTSTATUS.md) – aktueller MAIN-/PAGES-Stand, CI, Blocker.
- [**Entwicklungsregeln und Release-Gates**](AGENTS.md) – deterministische Core-, Save- und Merge-Regeln.
- [**Repo-/Forschungsindex**](docs/README.md) – aktive/abgelöste PRs, Backups, Archiv.
- [**Historische Originaldokumentation**](docs/archiv/) – unverändert als Git-Blobs bewahrte ausführliche Berichte.

Forschungs-PRs und historische Zahlen dürfen **nicht** als aktueller integrierter Stand gelesen werden. Kein automatischer NAS-Push und kein Überschreiben von Spielerständen.
