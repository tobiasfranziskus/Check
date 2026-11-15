# Aphros Void

**Weltraum-Konzernmanagement, deterministische Wirtschaft und persönlich spielbare 2D-Schiffe.** Statisches HTML/CSS/Vanilla JavaScript für iPad Safari, GitHub Pages und NAS.

[**Aphros Void – Neue Karriere starten**](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) · [Hauptseite](https://tobiasfranziskus.github.io/Check/) · [Klassische Konzernoberfläche](https://tobiasfranziskus.github.io/Check/prototypes/verbund/konzern.html) · [Jägertraining](https://tobiasfranziskus.github.io/Check/prototypes/j4c/index.html)

## Aktueller integrierter Stand · 15.11.2026

**[MAIN] `b63701a9d953b2692ae3266b6816ae4e571ec6ca` / J13b + W6-S02:** Die [Neue Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) startet ohne Import mit echter Seed42-Regel195→204-Welt und einem sichtbaren Jägerprojekt. Eigene Miner und Frachter können rechtmäßig für **600 bzw. 750 ISK** gekauft, persönlich geflogen und für bezahlte Eis-/F4-Fracht eingesetzt werden. Eigentumsrechte und Firmenkassen bleiben getrennt; fremde K7-/Industrie-/Werftbefehle kann der Spieler nicht eigenmächtig ausführen. [J13b-Integration #399](https://github.com/tobiasfranziskus/Check/pull/399).

**[MAIN/W6 – auswählbarer Wirtschaftsmodus]:** Im normalen Prolog kann die **standardmäßig ausgeschaltete** Option „W6: Autonome NPC-Wirtschaft im Testprofil S02 starten“ für eine **neue** Karriere eingeschaltet werden. NPC-Konzerne bezahlen Eis-/Erz-/Siliziumabbau, Frachten, Material, Ersatzminer/-frachter, J3-Bauteile und J4-Jäger auf eigenen Konten; ein fertig finanzierter Jäger wird erst durch echten **900-ISK-Spielerkauf** Eigentum des Spielers. Der Knopf **+1 Spieltag** führt 24 vollständig verbuchte Original-60-Minuten-Schritte aus. Unveränderte alte Spielstände starten nicht still mit NPC-W6. [W6-Integration #400](https://github.com/tobiasfranziskus/Check/pull/400) · [Spieler-/Save-Vertrag](docs/W6_KARRIERE_OPTIN.md).

**[QA]** Die unabhängige Integrationsprüfung bestätigte **345/345 Node22-Tests**, Chromium und WebKit **je vier Touchgrößen**, originale Root-/NAS-Build- und Speicher-/Eigentums-/Waren-/Geldregressionen. W6-Karrierestart mit +60 Minuten und +1 Spieltag: **1.500 Weltminuten, Hash `29d9cfd676b1c429`** in beiden Browsern; F4-Referenz `e4514490aedc13bd` unverändert. Weltgeld **33.000 ISK, Mint/Burn 0**. [GitHub-Pages-Deploy #43741818820](https://github.com/tobiasfranziskus/Check/actions/runs/43741818820) für exakt `b63701a9` erfolgreich. [Backup unmittelbar vor W6](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-w6-autonomous-career-20261115) · [Backup vor J13b](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j13b-and-w6-20261115).

**[ANALYSE / GRENZEN]** Der zusätzliche, vollständig finanzierte S02-P6-Versuch erzeugte **zwei Jäger und 93 Ersatzkäufe in 90 Tagen**, verbrauchte aber alle **16 vorhandenen Siliziumeinheiten**. Das ist **kein Beweis für unbegrenzte Jägerproduktion oder die Nachhaltigkeit aller 13 Wirtschaftskrisen**; acht andere untersuchte Regime weisen reale Stillstände bzw. Blockaden auf. Weitere Rohstoffquellen, Nachfrage und längerfristige Produktionsketten bleiben Entwicklungsaufgaben. Die originalen Grenzen des freien Fluges, die bekannte Sondergrenze der J8-Pilotenauswahl nach J2b-Reload und echte iPad-Safari-/NAS-Geräteabnahme bleiben offen. Keine NAS-Veröffentlichung, keine destruktive Save-Migration oder zusätzliche Geldemission.

## Projektquellen

- [**Verbindliche Produkt-Roadmap**](docs/ROADMAP.md) – Ziele, W0–W6, Prioritäten, Freigabe.
- [**Belegter technischer Projektstatus**](docs/PROJEKTSTATUS.md) – aktueller MAIN-/PAGES-Stand, CI, Blocker.
- [**Entwicklungsregeln und Release-Gates**](AGENTS.md) – deterministische Core-, Save- und Merge-Regeln.
- [**Repo-/Forschungsindex**](docs/README.md) – aktive/abgelöste PRs, Backups, Archiv.
- [**Historische Originaldokumentation**](docs/archiv/) – unverändert als Git-Blobs bewahrte ausführliche Berichte.

Forschungs-PRs und historische Zahlen dürfen **nicht** als aktueller integrierter Stand gelesen werden. Kein automatischer NAS-Push und kein Überschreiben von Spielerständen.
