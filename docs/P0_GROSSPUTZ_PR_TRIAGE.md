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

**[GEPRÜFT / 15.11.2026]** Historische, eng gestapelte W5s-Forschungs-PRs **#209–#219 und #221–#227** (18 PRs) wurden **einzeln per GitHub-Compare** gegen den erhaltenen offenen Nachfolger [#243](https://github.com/tobiasfranziskus/Check/pull/243), Head `e921fd29cf4a`, geprüft. **Bei jedem einzelnen Head: `status=ahead` und `behind_by=0`** – nachweisbare Commit-Vorfahren. Alle 18 nach jeweiligem PR-Kommentar **ohne Merge geschlossen**. Ursprüngliche Branches, Commit-Geschichte, Tests, Nachweise und fehlgeschlagene Forschungsbefunde bleiben erreichbar. Die späteren PRs #228–#243, die aktuellen W6/P8b-/P8c-Forschungs-PRs und die F8-Prototypen sind **nicht** geschlossen. Getrennter PR #220 war keine Kettenglied. [Vollständiger Herkunfts-/Wiederherstellungsindex](archiv/W5S_PR_KETTE_20261115.md).

**PR-Zahlen (punktueller Vergleich):** 160 offene vor dem ersten Großputz; nach #248/#307 noch 158; durch neuen docs-only-Draft #414 zunächst 159; nach diesem 18er-Batch rechnerisch **141 offene PRs**, GitHub-Livezahl separat nachprüfen. Eine PR-Schließung ist ausdrücklich **kein Produkt-Merge**.

## Nächste P0-Pakete

1. **PR-Triage in Gruppen von 10–20** auf Basis PR-Metadaten und Code-Nachfolger. Nur bei belegtem Ersatz und ohne einzigartige Funktion schließen, immer mit Verweis; Git-Branches/CI/Spielstände niemals löschen.
2. **Aktive Produktdokumente kürzen**: `docs/README.md` als Einstiegsnavigation, `README.md` nur als Spieler-/Projekt-Start; alter Inhalt ist unter dem festen Commit `31d0197d` lesbar. `ROADMAP.md` und `PROJEKTSTATUS.md` bleiben kanonisch; später ihre alten Nachweise linkbasiert archivieren, nicht alles in eine Megadatei zusammenführen.
3. **Prototypinventur**: Importgraph und echte Root-/Testverwendung ermitteln; verschieben/löschen erst in getrennten getesteten PRs. Besonders `prototypes/spiel/`, `prototypes/raum/`, `prototypes/welt/`, `prototypes/j4c/`, `prototypes/f8-jaeger/` sichern.
4. **Kontextbudget**: `README`/kurzer `docs/README` zuerst, dann Änderungen seit main und nur betroffene Roadmap-/Status-/Codebereiche. Kein blindes Einlesen des ganzen Archivs, aller gestapelten PRs oder des privaten `void-echoes`-Repos.

**Regeln:** Jede PR-Schließung ist **keine Codeintegration**. Basen, SHAs und Originaltests bleiben erhalten. Kein Löschen historischer Dateien oder Branches in diesem Schritt. Keine Änderungen an Core, UI, Save, Wirtschaft, Pages oder NAS.
