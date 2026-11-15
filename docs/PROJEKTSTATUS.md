# Aphros Void – aktueller belegter Projektstatus

**Aktualisiert: 15.11.2026.** Die historische vollständige Statuschronik wurde **ohne Datenverlust** nach [archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md) übernommen. Historische DRAFT-Aussagen sind keine aktuelle Releasebeschreibung.

## Integrierte Version und Spieltest

- **[MAIN] `3f0840e3e4f5aab22d215d129b6360fdbe434446`** – J8 als letzter Produktfortschritt, abschließender Commit nur Dokumentation. Referenz: [#363](https://github.com/tobiasfranziskus/Check/pull/363), [#364](https://github.com/tobiasfranziskus/Check/pull/364).
- **[PAGES]** [#43694798622](https://github.com/tobiasfranziskus/Check/actions/runs/43694798622) completed/success für genannten `main`. Öffentlichkeit: [Root-Spiel](https://tobiasfranziskus.github.io/Check/).
- **[MAIN] Regel195/Schema8:** Erhaltenes W0–W5-Hauptspiel als `index.html` (Pages) und `aphros-void.html` (NAS-Ausgabedatei). Alte Speicherplätze und Exporte nicht verändert; NAS selbst **nicht** aktualisiert.
- **[MAIN] Regel204/Schema8:** Getrennte spielbare Jäger-/Minerwelt unter [prototypes/j4c/index.html](../prototypes/j4c/index.html), finanziertes 2D-Cockpit, Konzern/Flotte, sichere gleiche-Dock-Übernahme, Eigentums-/Kauf-/Lohngates und vom Core bezahlte Wirtschaftsbefehle.
- **[MAIN] J7:** [Regel195→204-Kompatibilitätsprüfung](../prototypes/verbund/index.html) mit sechs existierenden Audit-Konvertern, nicht destruktiv und ohne automatisch erzeugte Schiffe.
- **[MAIN] J8:** [Konzernsitzung ohne Anfangsjäger](../prototypes/verbund/konzern.html): eine **ausdrücklich bestätigte und getrennte** Kopie von Regel195 nach 204, echter **600-ISK**-Aldera-Minerkauf vor Eis-Pendel, 1/10/60 finanzierte Minuten, manuelles JSON-Export/Import. Keine automatische Save-Überschreibung; J8-Cockpitwechsel noch offen.
- **[BACKUP]** [vor J8](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j8-fighterless-corp-20261115) enthält den kompletten vorherigen `main baa1d477`. Ältere Versions-/Backup-Branches bleiben unangetastet.

## Tatsächlich ausgeführte Referenz-Gates

| Integration | Ergebnis | Nachweis |
| --- | --- | --- |
| J8, finaler Draft `88baf69e` | **280/280 Node22**; iPad-Touch-Preflight und NAS-Einzeldatei-Lieferprüfung bestanden | [CI #43694265499](https://github.com/tobiasfranziskus/Check/actions/runs/43694265499) |
| J8 Browser | **Chromium und WebKit je 3 J8-Touchgrößen**, bestehendes grafisches Cockpit je 4 Größen; echte JSON-Import-/Export-/Kauf-/Eis-/Manipulationsfälle bestanden | [CI #43694265551](https://github.com/tobiasfranziskus/Check/actions/runs/43694265551) |
| J8 Wirtschaftsregression | Erfolgreich; bedingt ausgelassener Sicherheitsgeografie-Job ausdrücklich **nicht** ausgeführt | [CI #43694265509](https://github.com/tobiasfranziskus/Check/actions/runs/43694265509) |
| Veröffentlichung J8 | GitHub-Pages-Deploy erfolgreich; **kein** echter Geräte-/NAS-Test | [#43694798622](https://github.com/tobiasfranziskus/Check/actions/runs/43694798622) |
| J6/Jägerwirtschaft | Zweiter 900-ISK-Jäger in Regel204 mit Original-Core komplett finanziert, Seed42 Tick 22806, Hash `3630b67418d15855`, Weltgeld **33.000 ISK, Mint/Burn 0** | [J6 Integrations-PR #359](https://github.com/tobiasfranziskus/Check/pull/359), [Bericht](J6I_GEMEINSAME_FLOTTENWIRTSCHAFT.md) |

**[QUALITÄT]** Die J8-Regel195-Kopie, real bezahlte Eisfahrt und reproduzierbare zweite Jägerhülle belegen jeweils begrenzte Zahlungsketten. Sie beweisen **keine** wirtschaftliche Langzeitstabilität. 13 RNG-Seeds sind nicht 13 wirtschaftlich unterschiedliche Krisenregime.

## Offene Blocker und nächste Schritte

1. **[BESCHLOSSEN / J9]** J8-Welt und persönlich spielbares RAUM-1-Cockpit an **denselben** in-memory Regel204-Kern anschließen. Miner auch ohne Jägerkauf steuern, mit echten Dock-/Arbeits-/Lohn-Gates. Kein JSON-Zwang beim Wechsel.
2. **[OFFEN]** Rechtmäßig finanzierte Werft-/Transportkette aus einer frischen 195→204-Welt, inklusive unabhängig entscheidender NPC-/Stationsunternehmen und legitimer Käufe; keine fremden Kontozugriffe.
3. **[OFFEN]** Freier Spielerfrachterflug, Piraten/Kampf/Module und W6-Krisennachhaltigkeit. Keine neuen Preise oder Geldemissionsregeln ohne Entscheidung.
4. **[ABNAHME OFFEN]** Echte iPad-Safari-Abnahme, private NAS-Liveprüfung und unabhängig gerenderter Pages-Einstieg; CI ist kein Gerätetest.
5. **[REPO-HYGIENE]** Historische, teils gestapelte Forschungs-PRs anhand Integrationsnachweisen klassifizieren; superseded PRs mit Kommentar schließen, keine blindlings gelöschten Branches, Tests, Backups oder Spielstände.

## Quellen und Statuslabel

[Verbindliche Roadmap](ROADMAP.md) · [Repo-/PR-Index](README.md) · [AGENTS.md](../AGENTS.md) · [Historisches Statusarchiv](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md). Labels: **[MAIN]** gemergt, **[PAGES]** tatsächlich deployt, **[DRAFT]** ungemergt, **[ANALYSE]** begrenzter Nachweis, **[BESCHLOSSEN]** verbindliches Ziel, **[OPTION]** offen.
