# Aphros Void – schneller Projekt- und Quellenindex

**Nur Navigation, keine zweite Roadmap und kein eigenständiger Projektstatus.** Stand der Indexstruktur: 15.11.2026. **Für aktuelle Fakten stets `main`, CI und die kanonischen Dateien prüfen.** Frühere vollständige Fassung als [Git-Snapshot vor P0](https://github.com/tobiasfranziskus/Check/blob/31d0197dc0c2d6d9a3ea1af06440426065a4a0dd/docs/README.md) erhalten.

## Einstieg für ChatGPT, Codex und Projektleitung

1. **Zuerst** aktuellen [main-Commit](https://github.com/tobiasfranziskus/Check/commits/main), [Pages-Deploy](https://github.com/tobiasfranziskus/Check/actions) und relevante Diff-/PR-Metadaten ermitteln; nichts aus Datum/Chat-Erinnerungen als aktuellen Stand ableiten.
2. **Planung:** [ROADMAP.md](ROADMAP.md), nur die Abschnitte zu betroffenen **W0–W6**-/ **P0–P6**-Schritten; vollständige historische Liste nicht routinemäßig lesen.
3. **Technische Wahrheit:** [PROJEKTSTATUS.md](PROJEKTSTATUS.md), nur jüngste und sachlich betroffene Berichte mit Commit/CI/Save-Belegen; [AGENTS.md](../AGENTS.md) für verpflichtende Entwicklungs-/Release-Gates.
4. **Gewählten Codebereich gezielt öffnen** und seine echten Tests/Abhängigkeiten prüfen. **Nicht** auf Verdacht `docs/archiv/`, alle Prototypen oder sämtliche alten PRs einlesen.
5. **[P0-Aufräumprozess](PROJEKTLEITUNG_SUPERVISION.md)**, [P0-Inventur und PR-Triage](P0_GROSSPUTZ_PR_TRIAGE.md) und [Wiederverwendungskatalog Void Echoes](VOID_ECHOES_CODEKATALOG.md) nur bei entsprechendem Bedarf.
6. **[P0-Prototyp-/Test-Abhängigkeiten](P0_PROTOTYP_TEST_ABHAENGIGKEITEN.md)** vor jeder geplanten Archivierung/Dateiverschiebung konsultieren; Root-Build, Legacy-Tests und öffentliche Neben-Einstiege schützen.

## Produktcode und passende Einstiege

| Aufgabe | Erst hier nachsehen |
| --- | --- |
| Öffentlicher Spielstart, Eigentum, Karriere, Bedienung | [`prototypes/spiel/index.html`](../prototypes/spiel/index.html), [`spiel.js`](../prototypes/spiel/spiel.js), `jaeger-projekt.js`, `jaeger-akte.js` |
| Flug, Touch, Trägheit, Navigation, Zielauswahl | [`prototypes/raum/raum-cockpit.js`](../prototypes/raum/raum-cockpit.js), `raum-szene.js`, `raum-grafik.js`; [Void-Echoes-Katalog](VOID_ECHOES_CODEKATALOG.md) |
| Deterministischer Weltkern, Industrie, Geld, Waren, Eigentum | [`prototypes/welt/welt-kern.js`](../prototypes/welt/welt-kern.js) und relevante `prototypes/welt/`-Module |
| Jäger, Training, Treffer und Kampf | [`prototypes/j4c/`](../prototypes/j4c/) und [`prototypes/f8-jaeger/`](../prototypes/f8-jaeger/); F8-Drafts und Produktfähigkeit getrennt prüfen |
| Bestehende Tests und Simulationen | [`tests/`](../tests/), [`tools/`](../tools/), [GitHub Actions](../.github/workflows/) |
| Historische Module und Übernahmeversuche | [Legacy-Prototypen](../prototypes/legacy-pilot/), `docs/LEGACY_*_UEBERNAHME.md`, [Forschungsarchiv](archiv/) |

## Laufender Stand und historische Nachweise

- **Spiel starten:** [Neue Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html); [öffentliche Root-Seite](https://tobiasfranziskus.github.io/Check/). Welche SHA wirklich veröffentlicht ist, über Pages prüfen.
- **Wirtschaft:** W0–W5 besitzen einen integrierten Kern; W6-S02 hat einen geprüften endlichen Teilkreislauf, **keinen universellen Nachhaltigkeitsbeweis**. Für Details nur [Projektstatus](PROJEKTSTATUS.md) und [W6-Langzeitprüfung](W6_P7_SILIZIUM_LANGZEIT.md) gezielt öffnen.
- **Aktive Forschung:** [P8b #408](https://github.com/tobiasfranziskus/Check/pull/408), [P8c #412](https://github.com/tobiasfranziskus/Check/pull/412) und F8-Jäger-Drafts dürfen nicht als produktiv bezeichnet werden. PR-Zustände vor Verwendung erneut prüfen.
- **Historische Wirtschafts-PR-Ketten (nicht laden ohne Bedarf):** [W5s – 32 geschlossene Vorgänger, Forschungsträger #243](archiv/W5S_PR_KETTE_20261115.md) · [C1b–C1d – 15 geschlossene Vorgänger, getrennter Zweig #252](archiv/C1D_PR_KETTE_20261115.md) · [P0-Triage](P0_GROSSPUTZ_PR_TRIAGE.md). Beide Kataloge enthalten die Original-SHAs und verlinkte Nachfolger, **keine freigegebenen Wirtschaftsregeln**.
- **Weitere historische Quellen:** [frühere Roadmap](archiv/ROADMAP_HISTORIE_BIS_20261115.md), [früherer Status](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md), [früherer Repo-Index](archiv/REPO_INDEX_BIS_20261115.md), [PR-Bereinigungsbericht](PR_BEREINIGUNG_20261115.md).
- **Grundschutz:** Kein neues Wirtschaftsgeld/Balancing oder stille Migration, keine historische PR-Integration ohne Gate. Echte iPad-/NAS-Gerätetests bleiben bis zu ihrer wirklichen Durchführung offen.

**Kontextbudget:** Einstieg idealerweise **unter 2.000 Token**, danach ausschließlich die für die konkrete Aufgabe relevanten Abschnitte, Codepfade und Tests. Die Fundstellen sind **Pointer, kein Ersatz für eine aktuelle Git-/CI-Abnahme**.
