# P0 – W5v–W5al: archivierte PR-Abstammungsprüfung (17.11.2026)

**[GEPRÜFT / PR-TRIAGE, keine Produktintegration]** Ausgangs-`main`: [`7dce1021`](https://github.com/tobiasfranziskus/Check/commit/7dce1021067a46f0bf6ce64dbcdeeca0b7c96241). Die GitHub-REST-PR-Liste enthielt zunächst **92 offene PRs**. Nach dieser Arbeit waren **77 PRs offen**. In der PR-Triage wurden **15 direkte Commit-Vorfahren** des weiterhin offenen [#286](https://github.com/tobiasfranziskus/Check/pull/286) **mit individuellem Begründungskommentar und ohne Merge geschlossen**. Kein Branch, Test, Save, Tag, Bericht oder Commit wurde gelöscht. Originalcode und negative Befunde bleiben im Git-Verlauf verfügbar.

**Beibehaltenes Forschungs-Leaf:** [#286 – W5al](https://github.com/tobiasfranziskus/Check/pull/286), `f84fd79675e2dc31c1574463047e614c22556586`. Vergleichsmethode: GitHub `compare/{alter-head}...{leaf-head}`; für jeden nachstehend geschlossenen Head `status=ahead` und `behind_by=0`. Das belegt die Git-Abstammung, **keine** Gleichwertigkeit mit dem derzeitigen Regel204-/207-Produkt oder dessen QA.

| Geschlossener PR | Geprüfter Original-Head (vollständig) | Nachfolger voraus / alte Commits hinterher |
| --- | --- | --- |
| [#266](https://github.com/tobiasfranziskus/Check/pull/266) | `344c776df2e5f9d9fbd1356a480536050e4e9de3` | `140 / 0` |
| [#267](https://github.com/tobiasfranziskus/Check/pull/267) | `eb8a036d2c9f6166c4ec545096e25c1ba571b779` | `129 / 0` |
| [#268](https://github.com/tobiasfranziskus/Check/pull/268) | `a3aa907cb27c69eb7f1ffdc8cf84bf495c3dc8f0` | `115 / 0` |
| [#269](https://github.com/tobiasfranziskus/Check/pull/269) | `243811f8670efc89985af6f41415e7314e69f256` | `98 / 0` |
| [#270](https://github.com/tobiasfranziskus/Check/pull/270) | `d50c4d576959a8c7b6b12f3516e88180a7edc530` | `92 / 0` |
| [#271](https://github.com/tobiasfranziskus/Check/pull/271) | `71fc437c0c5050c52446fa57e93879cce6958ba3` | `76 / 0` |
| [#273](https://github.com/tobiasfranziskus/Check/pull/273) | `d2908e9a0c17ae6a9dcfa0777a76c4715c4ccaf9` | `57 / 0` |
| [#274](https://github.com/tobiasfranziskus/Check/pull/274) | `4db5e8d6cc99a5fd875faa1320e6ecc0d4549394` | `33 / 0` |
| [#275](https://github.com/tobiasfranziskus/Check/pull/275) | `aa5d986c7bb449a24b799bee5225317ecbe2b566` | `32 / 0` |
| [#276](https://github.com/tobiasfranziskus/Check/pull/276) | `c0e97278d8012a1ef7cd96d959cae6552d1925df` | `26 / 0` |
| [#277](https://github.com/tobiasfranziskus/Check/pull/277) | `ef9c7b3754e56f024e3ca664f03199ffbc330544` | `15 / 0` |
| [#278](https://github.com/tobiasfranziskus/Check/pull/278) | `1b01d3d61e4fd18688d31493a480fc07af77e4ab` | `7 / 0` |
| [#280](https://github.com/tobiasfranziskus/Check/pull/280) | `500669a01ba94589a5f6e343a884833a2184d3fa` | `5 / 0` |
| [#282](https://github.com/tobiasfranziskus/Check/pull/282) | `fc833af629573c25b05374ce0e201a79276782a9` | `3 / 0` |
| [#285](https://github.com/tobiasfranziskus/Check/pull/285) | `0547f002160bba8bfefa9e8e52e5823ddcf9ccae` | `2 / 0` |

**Nicht geschlossen – abweichende Forschungslinien:** Die folgenden Heads wurden ebenfalls unabhängig gegen #286 verglichen und liefern `status=diverged`; sie besitzen jeweils nicht enthaltene Originalcommits:

| Erhaltener PR | Original-Head | `ahead_by / behind_by` beim Vergleich alt → #286 |
| --- | --- | --- |
| [#279](https://github.com/tobiasfranziskus/Check/pull/279) | `4bc9e37603bd0ed9afc9eb91dd8050abdcb77f6e` | `7 / 2` |
| [#281](https://github.com/tobiasfranziskus/Check/pull/281) | `f0e7e8ea5d9923226996dcc5ce2b9a4ebc7dddff` | `7 / 7` |
| [#283](https://github.com/tobiasfranziskus/Check/pull/283) | `0d3d098c37e40934bebd59da0f4e8bd2c5b281ee` | `7 / 9` |
| [#284](https://github.com/tobiasfranziskus/Check/pull/284) | `ad8a22056f5786db9c755c523f1b3fea4b6109bc` | `7 / 15` |

Weitere Schutzgrenzen: [#286](https://github.com/tobiasfranziskus/Check/pull/286) bleibt als Forschungs-Leaf offen; die aktuellen [P3/W4/W5-PRs #484–#486](https://github.com/tobiasfranziskus/Check/pull/486), W6-Forschung und P4-Jägerbranches wurden **nicht** verändert. Die bisherigen zentralen Quellen `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, sämtliche Spiel-/Build-/Testdateien und alle produktiven Spielstände sind nicht Bestandteil dieser PR-Triage.

**QA-Scope:** Für diesen rein administrativen Batch wurden PR-Metadaten, Git-Abstammung, Kommentare, `closed/merged=false` sowie die anschließend erneut gelesene Open-PR-Liste geprüft. **Keine** Node22-/Browser-/Save-/Wirtschaftstestläufe ausgeführt; für diese Schließungen ist kein neuer Pages-Deploy beansprucht. Das kanonische P0-Vorgehen steht in [P0-Triage](../P0_GROSSPUTZ_PR_TRIAGE.md) und [Supervision](../PROJEKTLEITUNG_SUPERVISION.md).
