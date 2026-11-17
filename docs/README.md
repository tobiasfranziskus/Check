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
| **Manager- und Pilotenakademie (P1)** | [`prototypes/tutorial-manager/`](../prototypes/tutorial-manager/) mit [Manager-Prüfbericht](P1_MANAGERAKADEMIE.md); [`prototypes/tutorial-pilot/`](../prototypes/tutorial-pilot/) mit 13 Fluglektionen (12 ursprüngliche + integrierte P2-Flugprüfung), [Integrationsnachweis](P1_AKADEMIEN_INTEGRATION.md) und [Original-Codex-Katalog](P1_PILOTENAKADEMIE.md); gemeinsam aus [`prototypes/spiel/index.html`](../prototypes/spiel/index.html) erreichbar |
| Flug, Touch, Trägheit, Navigation, Zielauswahl | [`prototypes/raum/raum-cockpit.js`](../prototypes/raum/raum-cockpit.js), `raum-szene.js`, `raum-grafik.js`; [Void-Echoes-Katalog](VOID_ECHOES_CODEKATALOG.md) |
| **P3 – wiederholbare Spielerfracht** | [`prototypes/spiel/p3-handelsweg.js`](../prototypes/spiel/p3-handelsweg.js) (nur lesender Auftragsweg), originaler J8-Controller `prototypes/verbund/konzern-session.js`, [P3-Integration #465](https://github.com/tobiasfranziskus/Check/pull/465), `tests/p3-handelsweg.test.mjs` und `tests/p3-handelsweg-browser.cjs` |\n| Deterministischer Weltkern, Industrie, Geld, Waren, Eigentum | [`prototypes/welt/welt-kern.js`](../prototypes/welt/welt-kern.js) und relevante `prototypes/welt/`-Module |
| Jäger, Training, Treffer und Kampf | [`prototypes/j4c/`](../prototypes/j4c/) und [`prototypes/f8-jaeger/`](../prototypes/f8-jaeger/); F8-Drafts und Produktfähigkeit getrennt prüfen |
| Bestehende Tests und Simulationen | [`tests/`](../tests/), [`tools/`](../tools/), [GitHub Actions](../.github/workflows/) |
| Historische Module und Übernahmeversuche | [Legacy-Prototypen](../prototypes/legacy-pilot/), `docs/LEGACY_*_UEBERNAHME.md`, [Forschungsarchiv](archiv/) |

## Laufender Stand und historische Nachweise

- **[MAIN / PAGES / W6 P8g · 16.11.2026]** [Freigegebener W6-Release-PR #430](https://github.com/tobiasfranziskus/Check/pull/430) ist unter `main bf1d33536895d5c4904594fadb5fff9d5443ba88` integriert; [Pages-Deploy #43884696901](https://github.com/tobiasfranziskus/Check/actions/runs/43884696901) erfolgreich. [Spielbare neue Regel207-Dravos-Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) ausdrücklich im Prolog wählen; Regel204 bleibt die normale, **vollständig getrennt gespeicherte** Karriere. Wirtschafts-/Sicherheitsnachweise: [selektive Integration](W6_P8G_INTEGRATION_P2.md) · [P1/P2-Forschungsstart](W6_P8G_FORSCHUNGSKARRIERE.md). **13×90 und S02×365/730 buchungsstabil, aber nicht wirtschaftlich dauerhaft tragfähig**; 0 Mint/Burn. Echte iPad-/NAS-Abnahme offen.
- **[MAIN / PAGES / W6 P8h · 17.11.2026]** [Finanzierte NPC-Folgeversorgung](W6_P8H_INTEGRATION.md) im bewusst gewählten Regel207-Modus: [Merge #458](https://github.com/tobiasfranziskus/Check/pull/458), [Pages #44031015568](https://github.com/tobiasfranziskus/Check/actions/runs/44031015568), 507/507 Node22, Chromium/WebKit je 4/4 Touchgrößen. S02 produziert vier und verkauft drei durch **bezahlte Spielerkäufe**; nach Tag 90 keine dauerhafte Jägernachfrage/Produktion. Keine Gratisressourcen oder garantierten NPC-Käufer.

- **Spiel starten:** [Aphros Void – Premium-Haupteinstieg](https://tobiasfranziskus.github.io/Check/) führt zur [Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html). Auf derselben Root-Seite bleibt die klassische W0–W5-Wirtschaft erhalten; separater [Jägerzugang](https://tobiasfranziskus.github.io/Check/prototypes/j4c/index.html) und [ältere Konzernansicht](https://tobiasfranziskus.github.io/Check/prototypes/verbund/konzern.html) sind weiterhin erreichbar. [Geprüfter Release #446](https://github.com/tobiasfranziskus/Check/pull/446), [Pages-Beleg](https://github.com/tobiasfranziskus/Check/actions/runs/43941907658).
- **Wirtschaft:** W0–W5 besitzen einen integrierten Kern; W6-S02 hat einen geprüften endlichen Teilkreislauf, **keinen universellen Nachhaltigkeitsbeweis**. Für Details nur [Projektstatus](PROJEKTSTATUS.md) und [W6-Langzeitprüfung](W6_P7_SILIZIUM_LANGZEIT.md) gezielt öffnen.
- **Aktive Forschung:** [P8b #408](https://github.com/tobiasfranziskus/Check/pull/408), [P8c #412](https://github.com/tobiasfranziskus/Check/pull/412) und F8-Jäger-Drafts dürfen nicht als produktiv bezeichnet werden. PR-Zustände vor Verwendung erneut prüfen.
- **Historische Wirtschafts-PR-Ketten (nicht laden ohne Bedarf):** [W5s – 32 geschlossene Vorgänger, Forschungsträger #243](archiv/W5S_PR_KETTE_20261115.md) · [C1b–C1d – 15 geschlossene Vorgänger, getrennter Zweig #252](archiv/C1D_PR_KETTE_20261115.md) · [P0-Triage](P0_GROSSPUTZ_PR_TRIAGE.md). Beide Kataloge enthalten die Original-SHAs und verlinkte Nachfolger, **keine freigegebenen Wirtschaftsregeln**.
- **Weitere historische Quellen:** [frühere Roadmap](archiv/ROADMAP_HISTORIE_BIS_20261115.md), [früherer Status](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md), [früherer Repo-Index](archiv/REPO_INDEX_BIS_20261115.md), [PR-Bereinigungsbericht](PR_BEREINIGUNG_20261115.md).
- **Grundschutz:** Kein neues Wirtschaftsgeld/Balancing oder stille Migration, keine historische PR-Integration ohne Gate. Echte iPad-/NAS-Gerätetests bleiben bis zu ihrer wirklichen Durchführung offen.

**Kontextbudget:** Einstieg idealerweise **unter 2.000 Token**, danach ausschließlich die für die konkrete Aufgabe relevanten Abschnitte, Codepfade und Tests. Die Fundstellen sind **Pointer, kein Ersatz für eine aktuelle Git-/CI-Abnahme**.
