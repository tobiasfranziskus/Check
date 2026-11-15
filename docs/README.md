# Aphros Void – Repository-, Forschungs- und Archivindex

**Stand: 15.11.2026. Nur Navigation, nicht zweite Roadmap.** [Verbindliche Roadmap](ROADMAP.md) · [Technischer Status](PROJEKTSTATUS.md) · [AGENTS.md](../AGENTS.md) · [Root-README](../README.md).

## Aktueller Produktstand

| Bereich | Einordnung | Referenz |
| --- | --- | --- |
| [MAIN/P1] Spielerlebnis-Karriere | Titelbildschirm, Firmenprolog, echte neue Seed42-Regel195→204-Karriere ohne Datei, legaler Miner für 600 ISK, echtes RAUM-1, eigene lokale Saves | [Neue Karriere](https://tobiasfranziskus.github.io/Check/prototypes/spiel/index.html) · [Integration #380](https://github.com/tobiasfranziskus/Check/pull/380) · [Pages](https://github.com/tobiasfranziskus/Check/actions/runs/43712668896) |
| [MAIN] Root W0–W5 Regel195 | Geschütztes Original-Hauptspiel hinter dem öffentlichen Karrierelink; NAS-Einzeldatei bytegleich, keine stille Save-Migration | [GitHub Pages](https://tobiasfranziskus.github.io/Check/) |
| [MAIN] J6/RAUM-1 Regel204 | Grafisch fliegbarer eigener Miner/Jäger, finanzierte Aufträge, gleicher Worldhash | [Integration #359](https://github.com/tobiasfranziskus/Check/pull/359) |
| [MAIN] J7 Regel195→204-Prüfung | Lesend, sechs Original-Konverter, keine automatische Migration | [#361](https://github.com/tobiasfranziskus/Check/pull/361) |
| [MAIN] J8 Konzernkopie | Spieler kann ohne Startjäger vorhandenen Miner legal kaufen und Eis fördern; manuelle Save-Kopie | [#363](https://github.com/tobiasfranziskus/Check/pull/363) |
| [MAIN] J9 | Rechtmäßig gekauften Miner ohne JSON-Zwischenexport im selben Regel204-Zustand fliegen, mit Originalflugreserve und Dock-/Eigentumsgates | [#366](https://github.com/tobiasfranziskus/Check/pull/366) |
| [MAIN] J10a | Original-Werftkassen, Lager, NPC- und Stationsrechte sowie Kaufblockaden im Konzernspiel sichtbar, ohne Eingriff in Firmenrechte | [#368](https://github.com/tobiasfranziskus/Check/pull/368) |
| [MAIN] J10b | 600-ISK-Eigentümerkauf einer echt gebauten Nadir-K2-Minerhülle; öffentlicher Root-Link zu Konzern/Miner; Jäger/RAUM-Touchtests und NAS-Datei erhalten | [Integration #373](https://github.com/tobiasfranziskus/Check/pull/373) · [Pages-Deploy](https://github.com/tobiasfranziskus/Check/actions/runs/43705980924) |
| [ANALYSE / DRAFT] J10b-K7 | Vier getrennt legitimierte Firmenentscheide vor NPC-Pendel, echte Erz-/Fracht-/W5-Industriekette; noch keine normale autonome Koordination | [#370](https://github.com/tobiasfranziskus/Check/pull/370) |
| [ANALYSE / DRAFT] J10c | 7 bezahlte J3-Bauteile aus echten W4- und J2b-Waren; Materiallücke 5 (= 10 Erz) vor J4 | [#374](https://github.com/tobiasfranziskus/Check/pull/374) |
| [ANALYSE / Forschung] Krisen-Wirtschaft | Langzeit- und Käufergeldblockaden; Nachhaltigkeit nicht bewiesen | [Historischer Status](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md) |

**[MAIN] Spielcode `ff828da9`** für P1, [vorheriger main `17090ec6` als Backup](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p1-game-onboarding-20261115), vollständig grüne [P1-Node22/Chromium/WebKit-Abnahme](https://github.com/tobiasfranziskus/Check/actions/runs/43712294281), [296/296 Node22 und NAS-Erhalt](https://github.com/tobiasfranziskus/Check/actions/runs/43712294283), [Jäger-/Miner-Sicherheit](https://github.com/tobiasfranziskus/Check/actions/runs/43712294304), [Pages erfolgreich](https://github.com/tobiasfranziskus/Check/actions/runs/43712668896). Echte iPad-/NAS-Geräteabnahme weiterhin offen.

**[DRAFT / unabhängig]** [J11-Codex-Frachter #378](https://github.com/tobiasfranziskus/Check/pull/378) bleibt getrennt von P1 und ist noch **nicht in main**. **[ANALYSE]** [J10d-Aldera-Finanzierungsblocker #376](https://github.com/tobiasfranziskus/Check/pull/376): 0 von 500 ISK für zweite Erzlieferung; kein Rettungsmodell freigegeben.

## Aufbewahrung und offene Forschungs-PRs

**Keine Branch-/Save-/Beleg-Löschung.** Bei der Inventur am 15.11. waren **166 offene Forschungs-/Draft-PRs** vorhanden. **Neun belegbar abgelöste alte J2–J4e-PRs #338–#346** wurden anschließend mit verlinkter Begründung geschlossen (157 verbleiben). Viele sind gegen ihren direkten Vorgänger gestapelt, nicht gegen den aktuellen `main`. Ein grün getesteter alter PR ist deshalb **nicht automatisch integrierbar**. Schließungen erfolgen nur mit konkretem Superseded-/Nachfolgebeleg und eindeutigem Kommentar; relevante noch nicht integrierte Versuche bleiben als Forschungs-PRs bestehen.

- [Pull Requests](https://github.com/tobiasfranziskus/Check/pulls) – offene Arbeit; historische Branches nicht pauschal rebasen/mergen.
- [J8-Backup vor Integration](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j8-fighterless-corp-20261115) und [ältere Backup-/Versionszweige](https://github.com/tobiasfranziskus/Check/branches) – unverändert.
- [Historische ROADMAP (vollständig)](archiv/ROADMAP_HISTORIE_BIS_20261115.md) und [historischer Projektstatus (vollständig)](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md) – originale vollständige Dateiinhalte von `main 3f0840e3`.
- [Voriger Repo-/Forschungsindex](archiv/REPO_INDEX_BIS_20261115.md) und [alte Root-README](archiv/ROOT_README_BIS_20261115.md) – originale Git-Blobs unverändert.

**Nicht freigegeben:** Neue ISK-Emission, W6-Krisenrettung, destruktive Save-Migration, NAS-Produktionsaktualisierung oder unfinanzierte NPC-Entscheidungen. Echte iPad-Safari-/NAS-Geräteabnahme offen.
