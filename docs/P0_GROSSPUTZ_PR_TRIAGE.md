# P0 – Großputz, erste inventarisierte PR-Triage

**[ANALYSE / 15.11.2026]** Ausgangs-`main` **`31d0197dc0c2d6d9a3ea1af06440426065a4a0dd`**, vollständiger GitHub-Baum **338 Dateien** (davon **83 unter `docs/`**, **115 `prototypes/`**, **110 `tests/`**); GitHub-Suche: **160 offene PRs** vor dieser ersten Triage; **158 nach belegter Schließung von #307 und #248** (Livezahl bei späteren Läufen neu prüfen). Zahlen sind **zeitpunktbezogen**, am nächsten Morgen neu prüfen. [P0-Auftrag #413](https://github.com/tobiasfranziskus/Check/issues/413); keine komplette Lektüre aller 160 PR-Texte nötig.

## Erste selektive Einordnung

| PR | Klasse | Tatsächlicher Nachfolger / Aktion |
| --- | --- | --- |
| [#307](https://github.com/tobiasfranziskus/Check/pull/307) | **Überholter docs-only-Draft** | Prompt-Regeln (ChatGPT führt, Codex optional, Claude aus) sind bereits in `docs/CHATGPT_PROJEKTANWEISUNGEN.md` und `AGENTS.md` auf main einschließlich [#411](https://github.com/tobiasfranziskus/Check/pull/411) enthalten. **Am 15.11. ohne Merge geschlossen**, Originalbranch erhalten ([Begründung](https://github.com/tobiasfranziskus/Check/pull/307#issuecomment-6901503333)). |
| [#248](https://github.com/tobiasfranziskus/Check/pull/248) | **Überholter docs-only-Draft** | Die damalige Arbeitsverteilung und W0–W6-Grenzen stehen in main/`docs/ROADMAP.md`, `AGENTS.md` sowie [#411](https://github.com/tobiasfranziskus/Check/pull/411). Historische „kein Merge“-Aussage ist durch spätere ausdrückliche Dauerfreigabe überholt. **Am 15.11. ohne Merge geschlossen**, Branch erhalten ([Begründung](https://github.com/tobiasfranziskus/Check/pull/248#issuecomment-6901504366)). |
| [#291](https://github.com/tobiasfranziskus/Check/pull/291) | **Wertvolle historische Quellprüfung** | Quellenanalyse des privaten `void-echoes`, nicht als aktiver Produktcode behandeln. Neuer [Wiederverwendungskatalog](VOID_ECHOES_CODEKATALOG.md) erschließt die Originaldateien. PR/Branch/kompletten Prüfbericht vorerst **erhalten**, separat über Schließung entscheiden. |
| [#408](https://github.com/tobiasfranziskus/Check/pull/408) | **Aktive W6/P8b-Forschung** | Regel205 mit zwei finanzierten, endlichen Siliziumfeldern, keine Produktfreigabe. **Nicht schließen/mergen.** |
| [#412](https://github.com/tobiasfranziskus/Check/pull/412) | **Aktive gestapelte W6/P8c-Forschung** | Regel206 Dravos-Orion-Nadir; GitHub Actions auf jüngstem Stand gesondert prüfen. Nicht mit aktueller Regel204-Karriere verwechseln. **Nicht schließen/mergen.** |
| [#332–#337](https://github.com/tobiasfranziskus/Check/pull/337) | **F8-Jägerprototypen, teilweise gestapelt** | Kein pauschales Löschen: Für P4 möglicherweise noch einzigartige Treffer-/Gegenfeuerfunktion; Funktionsvergleich zu `main` und Browserabnahme vor Triage. |

## Zweite PR-Metadaten-Stichprobe: nicht voreilig schließen

**[ANALYSE, nur PR-Beschreibungen/Basen geprüft, keine unabhängige Code-Diff-Abnahme]:** Die älteren K1-PRs sind **nicht pauschal redundant**. [#318](https://github.com/tobiasfranziskus/Check/pull/318) (originalfinanzierter 2D-Frachter) und [#319](https://github.com/tobiasfranziskus/Check/pull/319) (50-Eis-Rundfracht) haben scheinbare Nachfolger im inzwischen integrierten P1/J11 [#383](https://github.com/tobiasfranziskus/Check/pull/383). **Erst** nach konkretem Dateidiff-/Testvergleich können sie einzeln geschlossen werden. [#320](https://github.com/tobiasfranziskus/Check/pull/320) enthält dagegen **persönliche 2D-Steuerung während des bezahlten W5n-Transits**, die in `main` gerade gesperrt bleibt; [#321](https://github.com/tobiasfranziskus/Check/pull/321) eine noch nicht produktive **physische Torfreigabe**. Beide als potenziell wiederverwendbare Forschung erhalten.

Die gestapelten Touch-PRs [#310](https://github.com/tobiasfranziskus/Check/pull/310) (direkte Befehle/Kurswahl), [#311](https://github.com/tobiasfranziskus/Check/pull/311) (berührbare Karte mit expliziter Zielflugbestätigung), [#312](https://github.com/tobiasfranziskus/Check/pull/312) (durchgängige K1-Cockpit-/Wirtschafts-/Save-QA) und [#317](https://github.com/tobiasfranziskus/Check/pull/317) (bis zum nächsten Entscheidungspunkt schrittweiser Original-Core-Zeitlauf) können für P1/P2 noch eigene UX-/Testkenntnisse enthalten. **Keine Schließung ohne Funktionsnachfolger.** Das ist der Hauptgrund für eine qualifizierte statt quantitative PR-Bereinigung.

**[NUTZERKLARSTELLUNG 15.11.2026]** Im alten `void-echoes` existierte **keine Folgen-/Abstandseinstellung**; das ist ein neues P2-Ziel und wurde im Codekatalog/Roadmap ausdrücklich korrigiert.

## Archiv-Batch W5s-f bis W5s-w – 18 geprüfte PRs geschlossen

**[GEPRÜFT / 15.11.2026]** Historische, eng gestapelte W5s-Forschungs-PRs **#209–#219 und #221–#227** (18 PRs) wurden **einzeln per GitHub-Compare** gegen den erhaltenen offenen Nachfolger [#243](https://github.com/tobiasfranziskus/Check/pull/243), Head `e921fd29cf4a`, geprüft. **Bei jedem einzelnen Head: `status=ahead` und `behind_by=0`** – nachweisbare Commit-Vorfahren. Alle 18 nach jeweiligem PR-Kommentar **ohne Merge geschlossen**. Ursprüngliche Branches, Commit-Geschichte, Tests, Nachweise und fehlgeschlagene Forschungsbefunde bleiben erreichbar. Zum historischen Prüfzeitpunkt waren #228–#243 noch offen; **der nachfolgende 14er-Batch** ist unten separat dokumentiert. #243, die aktuellen W6/P8b-/P8c-Forschungs-PRs und F8-Prototypen sind weiterhin **nicht** geschlossen. Getrennter PR #220 war keine Kettenglied. [Vollständiger Herkunfts-/Wiederherstellungsindex](archiv/W5S_PR_KETTE_20261115.md).

**PR-Zahlen (punktueller Vergleich):** 160 offene vor dem ersten Großputz; nach #248/#307 noch 158; durch neuen docs-only-Draft #414 zunächst 159; nach diesem 18er-Batch rechnerisch **141 offene PRs**, GitHub-Livezahl separat nachprüfen. Eine PR-Schließung ist ausdrücklich **kein Produkt-Merge**.

## Fortsetzung: 29 weitere historische PRs nach Git-Abstammung geschlossen

**[GEPRÜFT / 15.11.2026]** Von den späteren W5s-Forschungs-PRs **#228–#233 und #235–#242** wurden **14 einzelne Head-SHAs** per GitHub-Compare als Vorfahren von [#243](https://github.com/tobiasfranziskus/Check/pull/243) nachgewiesen (`ahead`, `behind_by=0`) und **mit individuellen Kommentaren ohne Merge geschlossen**. Der **unabhängige W5u-Hub #234** und der W5s-Research-Abschluss **#243** bleiben offen. [Nachweise und alle SHAs](archiv/W5S_PR_KETTE_20261115.md). Die W5s-Kette enthält damit insgesamt **32** auf Git-Ebene sicher reduzierte historische PRs; keine alten Wirtschaftsregeln wurden integriert.

Für die C1b-/C1c-/C1d-Industriekette wurden **#249–#251 und #253–#264** (15 PRs) einzeln als Vorfahren des weiterhin offenen [#265](https://github.com/tobiasfranziskus/Check/pull/265) nachgewiesen und **ohne Merge geschlossen**. **[Abzweig #252](https://github.com/tobiasfranziskus/Check/pull/252) hat dagegen `status=diverged`, `behind_by=7`** und bleibt ausdrücklich offen; nicht in der Hauptkette aufgegangene Commits dürfen nicht übersehen werden. [C1-Forschungsindex](archiv/C1D_PR_KETTE_20261115.md). Keine neuen privaten Einkommen, Käufer oder Modell-C-/B-Emissionsregeln freigegeben.

**Live-Ausgang nach diesem Batch:** GitHub-Suche ergab **112 offene PRs** vor Erstellung eines weiteren neuen Dokumentations-PRs; Zahl ist zeitpunktbezogen und muss bei einer nächsten Supervision neu abgefragt werden. Die 29 Schließungen sind weder Main-Integrationen noch Spielreleases. Aktuelle Regel204-P1-Spielstände, Forschungs-PRs #408/#412, F8-Jäger und P2-Altcode bleiben geschützt.

## Fortsetzung am 16.11.2026 – 13 historische Flug-/K1-/F8-PRs geschlossen

**[GEPRÜFT / P0]** 13 PRs (#294, #296, #297, #310–#312, #316, #318–#320, #332, #333, #336) wurden nach **einzeln bestätigter direkter Git-Abstammung** und PR-Kommentar **ohne Merge** geschlossen. Die offenen Nachfolger #298, #317, #321 und #337 samt allen Originalcommits und Forschungsbefunden bleiben erhalten. Die divergierenden Forschungslinien #305 und #317/#318 wurden **nicht** zusammengeführt; W6-PRs wurden nicht verändert. GitHub-Livezahl unmittelbar danach: **102 offene PRs** (vorher 115; exklusive neuem Dokumentations-PR). [Vollständige Tabelle, Head-SHAs, Vergleichsergebnisse und Grenzen](archiv/P0_PR_KETTEN_F2_K1_F8_20261116.md).

## K2–K13-Forschungs-PR-Kette: 14 weitere Vorgänger geschlossen · 16.11.2026

**[GEPRÜFT / P0]** Nach eigenständiger Head-Abstammungsprüfung wurden #301, #304, #308, #309, #313–#315 und #322–#328 mit GitHub-Kommentaren **ohne Merge** geschlossen. Alle 14 Heads sind echte Vorfahren des weiterhin offenen K13/F6-Forschungs-Leaf [#329](https://github.com/tobiasfranziskus/Check/pull/329) (`behind_by=0`); [#306](https://github.com/tobiasfranziskus/Check/pull/306) ist dagegen `diverged` und bleibt wegen eigener Commits geschützt. **103 → 89 offene PRs** unmittelbar vor/nach dieser zweiten Runde (einschließlich Docs-Draft #448). Weder Forschung noch Geld-/Warenregeln dadurch nach main integriert. [Original-Head-SHAs, individuelle Vergleichszahlen, Erhaltungsgrenzen](archiv/P0_PR_KETTE_K2_K13_20261116.md).

## Fortsetzung am 17.11.2026 – 15 historische W5v–W5al-Forschungs-PRs geschlossen

**[GEPRÜFT / P0]** Die 15 PRs **#266–#271, #273–#278, #280, #282, #285** sind nach **individuellem GitHub-Compare** (`status=ahead`, `behind_by=0`) vollständig als direkte Commit-Vorfahren des weiterhin offenen Forschungs-Leaf **[#286](https://github.com/tobiasfranziskus/Check/pull/286)** bestätigt. Jeder PR erhielt einen Nachfolger-/Erhaltungskommentar und wurde **ohne Merge geschlossen**; Branches, Commits, negative Befunde und Tests bleiben erhalten. Die separat geprüften Abzweige **#279, #281, #283, #284** sind `diverged` und deshalb ausdrücklich **offen geblieben**. **92 → 77 offene PRs**, live geprüft nach der Bereinigung. Die aktive W4/W5-Integrationsarbeit #484–#486 blieb unverändert. [Vollständiger SHA-/Compare-/Wiederherstellungsnachweis](archiv/P0_PR_KETTE_W5V_W5AL_20261117.md). Kein Code-Merge, keine neue Wirtschaftsregel und kein durch diese P0-Arbeit ausgelöster Pages-Deploy.

## Fortsetzung am 17.11.2026 – acht historische K1/F7/J10/Legacy-Forschungs-Vorfahren

**[GEPRÜFT / P0]** Die PRs **#203, #207, #234, #306, #329, #331, #370, #374** wurden einzeln per GitHub-Compare als Vorfahren der jeweils weiterhin offenen Forschungs-Leaves **#286, #321, #335, #376** nachgewiesen (`status=ahead`, `behind_by=0`), mit individuellen Nachfolgerkommentaren **ohne Merge geschlossen**. Unabhängige K1-/F8-Forschung **#305/#317/#321/#337** bleibt erhalten, insbesondere #305 `diverged` gegenüber #317/#321. Dazu W6/P3-Forschung, alle ursprünglichen Branches, Tests, Saves und Commits unangetastet. **78 → 70 offene PRs** (inklusive bestehendem Docs-Draft #487), nach Schließung live geprüft. [SHA-/Compare-/Schutzindex](archiv/P0_PR_KETTEN_K1_F7_J10_LEGACY_20261117.md). Nur PR-Triage und Dokumentation, keine Spiel-/Wirtschafts-/Save-Änderung, kein durch diesen Batch ausgelöster Pages-Deploy.

## Fortsetzung am 17.11.2026 – 14 weitere W5s-Vorfahren geschlossen

**[GEPRÜFT / P0]** Die noch offenen älteren W5s-PRs **#188, #190–#194, #196, #197, #200, #202, #204–#206, #208** wurden **jeweils unabhängig per GitHub-Compare** als echte Commit-Vorfahren des weiterhin offenen Forschungsnachfolgers [#243](https://github.com/tobiasfranziskus/Check/pull/243) bestätigt (`status=ahead`, `behind_by=0`). Jeder PR erhielt einen dokumentierten Nachfolgerhinweis und wurde **ohne Merge geschlossen**; alle Branches, Originalcommits, Tests und negativen Geld-/Kapital-/Krisenbefunde bleiben erhalten. Inklusive der früheren 32 W5s-Vorgänger wurden **46 PRs dieser Forschungskette** nach Abstammungsnachweis geschlossen. **70 → 56 offene PRs**, per Live-Abfrage nachgeprüft, einschließlich des weiter offenen Dokumentations-Drafts #487. [Einzel-SHAs und Vergleichszahlen im fortgeführten W5s-Archiv](archiv/W5S_PR_KETTE_20261115.md). Kein produktiver Wirtschaftsregel-/Geldemissionswechsel, kein Code-Merge, kein durch die Triage ausgelöster Pages-Deploy. Die unabhängigen aktiven P3/W4/W5-PRs #484–#486, W6- und F8-Forschung blieben unberührt.

## Tagesabschluss 17.11.2026 – 19 ältere W0/W1–W5-Forschungs-Vorfahren ohne Merge geschlossen

**[GEPRÜFT / P0]** Nach individuellem GitHub-Compare gegen den weiterhin offenen Forschungsnachfolger [#243](https://github.com/tobiasfranziskus/Check/pull/243) (`behind_by=0`) wurden die alten PRs **#161, #164–#169, #171, #173, #175, #176, #178–#185** jeweils nach Begründungskommentar **ohne Merge geschlossen**. Im Nachfolger sind ihre vollständigen Head-Commits enthalten. **#170 bleibt ausdrücklich offen**: `status=diverged`, `behind_by=2` – eigene Commits nicht im Nachfolger. Zusammen mit 46 zuvor sicher geschlossenen W5s-Vorgängern ergibt das **65 bewahrte, einzeln belegte historische PR-Schließungen** dieser W5s-Forschungsfamilie. [Vollständige SHA-/Compare-Tabelle und Erhaltungsgrenzen](archiv/W5S_PR_KETTE_20261115.md). Die Live-PR-Zahl ging im abschließenden Batch **56 → 37** zurück (einschließlich offenem Dokumentations-PR #487). Weder #243 noch aktive Wirtschaft/Gameplay-PRs, Legacy-Prototypen, Tags, Branches, Spielstände oder Referenztests wurden gelöscht. Kein Code-Merge, keine Wirtschaftsregel- oder Save-Änderung, kein durch diese Triage ausgelöster Pages-Deploy.

## P0-Nachtrag 18.11.2026 – acht weitere gesicherte Forschungsvorfahren

**[MAIN/PAGES, nur Dokumentation]** [Integrations-PR #492](https://github.com/tobiasfranziskus/Check/pull/492) hat die vier vollständigen historischen Dokumentationsdateien des zuvor geschlossenen, nicht gemergten Original-Drafts [#487](https://github.com/tobiasfranziskus/Check/pull/487) mit identischen Git-Blob-SHAs plus einen korrigierten Quellenindex auf `main 6e4ae87f6c082d2f805dd6dbf9d2bd35e7e4075d` gebracht. [Pages-Deploy #44244728937](https://github.com/tobiasfranziskus/Check/actions/runs/44244728937) meldet genau diesen SHA `completed/success`. Für den docs-only-PR wurden keine CI-/Node22-/Browserchecks ausgeführt; 62 relative Verweise geprüft. Originalbranch #487 und die Vorversion `backup/main-before-p0-archiv-20261118` sind erhalten.

**[GEPRÜFT / P0-PR-Triage]** Weitere **acht** offene PRs wurden nach direktem GitHub-Compare ihres unveränderten Head-SHAs mit einem noch offenen Forschungsnachfolger, `status=ahead` und **`behind_by=0`**, jeweils mit eigenem Nachfolgerkommentar **ohne Merge geschlossen**. Bezeichnete Werte sind die Anzahl der nach dem alten Head folgenden Commits im Forschungsnachfolger, **keine** Produktionsfreigabe:

| Ohne Merge geschlossen | Original-Head | Offener, schützender Nachfolger-Head | Compare ahead/behind |
| --- | --- | --- | --- |
| [#408](https://github.com/tobiasfranziskus/Check/pull/408) | `eac8ae5ec4a25b5a06c265c1029e95b600f0181c` | [#423](https://github.com/tobiasfranziskus/Check/pull/423) `6835542c07260537e8c2a2f37e102c1ba575c612` | 56/0 |
| [#412](https://github.com/tobiasfranziskus/Check/pull/412) | `c6c40cec68085f399b4baa833fc259abb5bc0626` | #423 (wie oben) | 39/0 |
| [#415](https://github.com/tobiasfranziskus/Check/pull/415) | `3f771856ecc79c931e70e8238c3de2001cd408e6` | #423 | 14/0 |
| [#420](https://github.com/tobiasfranziskus/Check/pull/420) | `a483d3274fb2a27ab3332526f07d0ce272888058` | #423 | 11/0 |
| [#422](https://github.com/tobiasfranziskus/Check/pull/422) | `ccaff327cf73193deff13a6f475e0aa199d4d71d` | #423 | 8/0 |
| [#246](https://github.com/tobiasfranziskus/Check/pull/246) | `76880387c4ebeec75461dd14bedafadc85726090` | [#265](https://github.com/tobiasfranziskus/Check/pull/265) `98fc29bd039bfbf907baefefe5a3b60bbee57b09` | 149/0 |
| [#247](https://github.com/tobiasfranziskus/Check/pull/247) | `83538e9d1aab3d8d843e14158a17f79e02bc7aef` | #265 | 147/0 |
| [#298](https://github.com/tobiasfranziskus/Check/pull/298) | `791392816ecd5959e67f8728ff25bd604567f7eb` | [#321](https://github.com/tobiasfranziskus/Check/pull/321) `a297e6f6e62402a9b7fe76285ed3c2aa3c287ce0` | 134/0 |

**Bewusst erhalten:** [#252](https://github.com/tobiasfranziskus/Check/pull/252) `diverged` gegen #265 (136/7), [#317](https://github.com/tobiasfranziskus/Check/pull/317) `diverged` gegen #321 (67/13), [#335](https://github.com/tobiasfranziskus/Check/pull/335) `diverged` gegen #376 (30/284). Weitere abweichende #170, #279/#281/#283/#284 sowie K1-/Jäger-Leaves und unabhängige W6-Analysen bleiben unangetastet. Forschung ist **nicht [MAIN]**; kein neues Regel205/206-Opt-in, keine Geld-/Balancefreigabe.

**GitHub-Livezählung unmittelbar nach diesen acht Schließungen:** 28 offene PRs (nach Merge #492: 36; danach 31; danach 28). Diese Zahl ist eine Momentaufnahme **vor einem neuen Nachtrags-PR**, keine dauerhafte Vorgabe. Keine Branches/Commits/Tests/Spielstände gelöscht, keine neuen Node22-/Wirtschafts-/Browserprüfungen für die Triage durchgeführt.

## Fortsetzung 23.11.2026 – P3 und alter W5aj-Abzweig (7 PRs geschlossen)

Liveabfrage: 54 offene PRs vor und 47 nach den sieben Schließungen. Main unverändert `d824040e20e0f9a69188cbe34282901ed6497976`. Für jeden Kandidaten Git-Compare auf die konkreten Heads ausgeführt; nur bei `ahead` und `behind_by=0` ohne Merge geschlossen, nach individuellem Kommentar. Nachfolger bleiben offen; keine Branchlöschung. Die Zahlen sind Momentaufnahmen.

| Vorgänger | Erhaltener Nachfolger | Compare (ahead / behind) | Entscheidung |
| --- | --- | --- | --- |
| [#505](https://github.com/tobiasfranziskus/Check/pull/505) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [ahead: 25 / 0](https://github.com/tobiasfranziskus/Check/compare/0234bf4e3d977ece2114c46960d718166f287c3f...da686630d2cb12d1802aa9b8fc775665da17179f) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/505#issuecomment-7101953966) |
| [#506](https://github.com/tobiasfranziskus/Check/pull/506) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [ahead: 16 / 0](https://github.com/tobiasfranziskus/Check/compare/2901a20454ba0c3a6a3b4feb89cbe8d3786c5f69...da686630d2cb12d1802aa9b8fc775665da17179f) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/506#issuecomment-7101954962) |
| [#509](https://github.com/tobiasfranziskus/Check/pull/509) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [ahead: 10 / 0](https://github.com/tobiasfranziskus/Check/compare/6316e5ab0a8ba02ddf8f452d1d18f0e09fcc66a3...da686630d2cb12d1802aa9b8fc775665da17179f) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/509#issuecomment-7101955706) |
| [#510](https://github.com/tobiasfranziskus/Check/pull/510) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [ahead: 6 / 0](https://github.com/tobiasfranziskus/Check/compare/52fddda1cd997c388ea15c80cc75bfe6beb334a2...da686630d2cb12d1802aa9b8fc775665da17179f) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/510#issuecomment-7101956835) |
| [#507](https://github.com/tobiasfranziskus/Check/pull/507) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [diverged: 16 / 9](https://github.com/tobiasfranziskus/Check/compare/8b823d9bbe5d626d2d4a320e2089aaeea985e456...da686630d2cb12d1802aa9b8fc775665da17179f) | Offen: eigene Commits erhalten |
| [#508](https://github.com/tobiasfranziskus/Check/pull/508) | [#511](https://github.com/tobiasfranziskus/Check/pull/511) | [diverged: 16 / 4](https://github.com/tobiasfranziskus/Check/compare/49f71e1dfa9c75b68017babcd70dc08156bc9003...da686630d2cb12d1802aa9b8fc775665da17179f) | Offen: eigene Commits erhalten |
| [#279](https://github.com/tobiasfranziskus/Check/pull/279) | [#284](https://github.com/tobiasfranziskus/Check/pull/284) | [ahead: 13 / 0](https://github.com/tobiasfranziskus/Check/compare/4bc9e37603bd0ed9afc9eb91dd8050abdcb77f6e...ad8a22056f5786db9c755c523f1b3fea4b6109bc) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/279#issuecomment-7101957592) |
| [#281](https://github.com/tobiasfranziskus/Check/pull/281) | [#284](https://github.com/tobiasfranziskus/Check/pull/284) | [ahead: 8 / 0](https://github.com/tobiasfranziskus/Check/compare/f0e7e8ea5d9923226996dcc5ce2b9a4ebc7dddff...ad8a22056f5786db9c755c523f1b3fea4b6109bc) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/281#issuecomment-7101958328) |
| [#283](https://github.com/tobiasfranziskus/Check/pull/283) | [#284](https://github.com/tobiasfranziskus/Check/pull/284) | [ahead: 6 / 0](https://github.com/tobiasfranziskus/Check/compare/0d3d098c37e40934bebd59da0f4e8bd2c5b281ee...ad8a22056f5786db9c755c523f1b3fea4b6109bc) | [Ohne Merge geschlossen](https://github.com/tobiasfranziskus/Check/pull/283#issuecomment-7101958992) |

Erhaltene Nachfolger-CI: #511 Head `da686630d2cb12d1802aa9b8fc775665da17179f`, drei abgerufene Workflows erfolgreich ([Audit](https://github.com/tobiasfranziskus/Check/actions/runs/44454301107), [W5](https://github.com/tobiasfranziskus/Check/actions/runs/44454301113), [JS](https://github.com/tobiasfranziskus/Check/actions/runs/44454301078)); S03-Negativbefund, NPC-Priorität und Integration bleiben offen. #284 Head `ad8a22056f5786db9c755c523f1b3fea4b6109bc`: vier abgerufene Workflows erfolgreich ([Diagnose](https://github.com/tobiasfranziskus/Check/actions/runs/42709770729), [JS](https://github.com/tobiasfranziskus/Check/actions/runs/42709771173), [W5u](https://github.com/tobiasfranziskus/Check/actions/runs/42709770760), [90/365 Tage](https://github.com/tobiasfranziskus/Check/actions/runs/42709770758)). Historischer Regel195-Nachweis, keine W6-Stabilitäts- oder Produktfreigabe. #286 bleibt als anderer Zweig offen. Aktive M4-Forschung einschließlich #587 unangetastet. Keine neuen Node-/Browser-Tests oder Deployments in diesem Triage-Lauf.

## Nächste P0-Pakete

1. **PR-Triage in Gruppen von 10–20** auf Basis PR-Metadaten und Code-Nachfolger. Nur bei belegtem Ersatz und ohne einzigartige Funktion schließen, immer mit Verweis; Git-Branches/CI/Spielstände niemals löschen.
2. **Aktive Produktdokumente kürzen**: `docs/README.md` als Einstiegsnavigation, `README.md` nur als Spieler-/Projekt-Start; alter Inhalt ist unter dem festen Commit `31d0197d` lesbar. `ROADMAP.md` und `PROJEKTSTATUS.md` bleiben kanonisch; später ihre alten Nachweise linkbasiert archivieren, nicht alles in eine Megadatei zusammenführen.
3. **Prototypinventur**: Importgraph und echte Root-/Testverwendung ermitteln; verschieben/löschen erst in getrennten getesteten PRs. Besonders `prototypes/spiel/`, `prototypes/raum/`, `prototypes/welt/`, `prototypes/j4c/`, `prototypes/f8-jaeger/` sichern.
4. **Kontextbudget**: `README`/kurzer `docs/README` zuerst, dann Änderungen seit main und nur betroffene Roadmap-/Status-/Codebereiche. Kein blindes Einlesen des ganzen Archivs, aller gestapelten PRs oder des privaten `void-echoes`-Repos.

**Regeln:** Jede PR-Schließung ist **keine Codeintegration**. Basen, SHAs und Originaltests bleiben erhalten. Kein Löschen historischer Dateien oder Branches in diesem Schritt. Keine Änderungen an Core, UI, Save, Wirtschaft, Pages oder NAS.


## Nachbereitung der Morgensupervision 24.11.2026

Main 679ba6c1, 66 offene PRs laut gespeichertem Morgenlauf (zeitpunktbezogen). P0-Kurzfassung gegen den neuen Main-Stand konsolidiert; frühere Archive unverändert. #599 UX-CI-Fehler identifiziert und im Quell-Draft korrigiert, neue CI offen. #610 Kampfstack aktiv; #611 gezielte Langzeitbelege ausgewertet. #573/#576/#577 getrennte Sicherheits-/Wirtschaftsforschung vor Integration erhalten. Keine pauschale Schließung oder Regelaktivierung.


## Fortsetzung 24.11.2026 – fünf übernommene Legacy-Quellen geschlossen

Main `fb229ea5f3cb6c3018240ed321b6a281a06fffe4`, PR #620; 603/603 Node22 ([CI](https://github.com/tobiasfranziskus/Check/actions/runs/45469561655)). Alle 39 ursprünglichen Dateien vorhanden, 29 SHA-identisch, 10 abweichende Dateien einzeln auf Quellzeilen und Archiv-HTML geprüft. Release-Baum ba0c1861, Archivierung #449/055d96cb. Ursprüngliche Testdateien erhalten.

| Quelle | Beleg | Ergebnis |
|---|---|---|
| #198 | 6/8 identisch; Kapitalbeschriftung, ShadowRoot-Fokus, selectShip, Mount-Guard | geschlossen, kein Merge |
| #195 | 6/8 identisch; ShadowRoot-Fokus, Mount-Guard | geschlossen, kein Merge |
| #189 | 6/8 identisch; ShadowRoot-Fokus, Archiv-Weiterleitung mit Originalressourcen | geschlossen, kein Merge |
| #187 | 6/8 identisch; optionale Hub-Navigation, ShadowRoot-Fokus, Mount-Guard | geschlossen, kein Merge |
| #186 | 5/7 identisch; Mount-Guard und Archiv-Weiterleitung mit Originalressourcen | geschlossen, kein Merge |

Einzelbelege in den jeweiligen PR-Kommentaren. #291 und #170 bleiben offen: nicht alle ursprünglichen Berichte/Tests im aktuellen Baum vorhanden; kein vollständiger Nachfolgernachweis. Keine Branch- oder Dateilöschung. 67 → 61 offene PRs inklusive #620-Merge, vor neuem Doku-Draft. Aktive M4-/PIR-Stacks unverändert.


## Fortsetzung 24.11.2026 – ältere Forschungsnachweise geschützt

Basis `fb229ea5f3cb6c3018240ed321b6a281a06fffe4`. Push-Regression [#45471314787](https://github.com/tobiasfranziskus/Check/actions/runs/45471314787) completed/success. Vor der Prüfung 62 offene PRs einschließlich #621. Abgleich der PR-Dateilisten mit dem rekursiven Main-Baum (Blob-SHA und Pfad; keine semantische Gleichwertigkeit aus abweichenden Dateien abgeleitet):

| PR | Dateien | SHA-identisch | Pfad fehlt in main | Schwerpunkt |
|---|---:|---:|---:|---|
| [#305](https://github.com/tobiasfranziskus/Check/pull/305) | 7 | 0 | 5 | K1-Cockpit/Browser |
| [#317](https://github.com/tobiasfranziskus/Check/pull/317) | 7 | 0 | 5 | Abschnittsteuerung |
| [#321](https://github.com/tobiasfranziskus/Check/pull/321) | 10 | 0 | 7 | Torfreigabe/Browser |
| [#335](https://github.com/tobiasfranziskus/Check/pull/335) | 5 | 0 | 5 | J1-Audit/90 Tage |
| [#337](https://github.com/tobiasfranziskus/Check/pull/337) | 11 | 2 | 7 | F8E-Duelltraining |
| [#376](https://github.com/tobiasfranziskus/Check/pull/376) | 2 | 0 | 2 | J10d-Finanzierungsblocker |
| [#423](https://github.com/tobiasfranziskus/Check/pull/423) | 3 | 1 | 2 | P8e/P8f-Materialgate |
| [#470](https://github.com/tobiasfranziskus/Check/pull/470) | 24 | 0 | 19 | Rohstoffforschung und Replay |
| [#490](https://github.com/tobiasfranziskus/Check/pull/490) | 10 | 0 | 10 | W6-Langzeitbelege |
| [#496](https://github.com/tobiasfranziskus/Check/pull/496) | 6 | 0 | 6 | F4-Folgezyklen |
| [#501](https://github.com/tobiasfranziskus/Check/pull/501) | 3 | 0 | 3 | Zweitbetrieb |
| [#526](https://github.com/tobiasfranziskus/Check/pull/526) | 2 | 0 | 2 | M3-Industrieaudit |
| [#527](https://github.com/tobiasfranziskus/Check/pull/527) | 14 | 0 | 14 | Manager-Live-Audit |
| [#528](https://github.com/tobiasfranziskus/Check/pull/528) | 1 | 0 | 1 | Rechte-/Buchungsansicht |

Alle 14 bleiben offen: fehlende Pfade sind kein Beweis für fehlende Funktion, aber ohne Einzelübernahme der Berichte/Tests kein hinreichender Nachfolgerbeleg. Zusätzlich acht Git-Compare-Abfragen zwischen möglichen Nachfolgern, jeweils Status `diverged`:

| Quelle → Kandidat | Kandidat ahead | Kandidat behind |
|---|---:|---:|
| #305 → #317 | 70 | 7 |
| #317 → #321 | 67 | 13 |
| #496 → #501 | 7 | 4 |
| #501 → #511 | 39 | 3 |
| #376 → #423 | 114 | 12 |
| #423 → #490 | 78 | 75 |
| #335 → #337 | 42 | 5 |
| #526 → #528 | 2 | 1 |

Keine Schließung, kein neuer Produktcode, keine Branchlöschung. Aktive M4-/PIR-Forschung nicht bearbeitet. Nächster Schritt: die wenigen historischen Nachweise mit konkretem Bezug zu offenen Management-Gates gezielt und commitgebunden indexieren, keine pauschale Codeübernahme.

### Dokumentations-Gate

#621 erweitert den vorhandenen P0-Workflow um Trigger für AGENTS.md, README.md, docs/** und den Linkprüfer. Bei diesen Änderungen laufen bestehende Parser-Fixtures und der kanonische Repository-Linktest (AGENTS, ROADMAP, PROJEKTSTATUS) zusätzlich zur Inventur. Lokale Dateiziele, nicht externe URLs oder vollständige Ankerprüfung. Kein neuer Lauf als erfolgreich behauptet, solange die CI offen ist.
