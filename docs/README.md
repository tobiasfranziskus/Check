# Aphros Void – Repo- und Forschungsindex

> **[AKTUELL / 11.11.2026]** [Repository-Konsolidierung und Void-Echoes-Restübernahme](REPO_KONSOLIDIERUNG_VOID_ECHOES_20261111.md): [MAIN] `04124f2b`, Regel195/Schema8 einschließlich Save-Schutz; Flug- und Grafik-Drafts #294 → #296 → #297 → #298 noch nicht im Produkt. 126 offene PRs wurden als Forschungs- und Reviewverlauf erfasst; alte Stacks nicht pauschal mergen. Die nachfolgende Tabelle ist eine historische Übersicht vom 07.11.2026, **keine aktuelle Main-Aussage**.

> **Stand: 07.11.2026.** Dies ist **nur Navigation**. Einzige verbindliche Produktplanung: [ROADMAP.md](ROADMAP.md). Belegter Stand: [PROJEKTSTATUS.md](PROJEKTSTATUS.md); Regeln: [AGENTS.md](../AGENTS.md). Vor dem Arbeiten die tatsächlichen GitHub-Refs/CI erneut prüfen.

## Welche Version ist was?

| Status | Einstieg | Tatsächlicher Befund |
|---|---|---|
| **[MAIN]** | [Hauptbranch](https://github.com/tobiasfranziskus/Check/tree/main) | `v0.12.5`, **Regel14/Schema8**, produktive HTML/JS-Datei `index.html`. Kein R32-Neuaufbau gemergt. |
| **[BACKUP]** | [Version v0.12.5](../versionen/v0.12.5/) / [Backup-Branch](https://github.com/tobiasfranziskus/Check/tree/backup/pages-v0.12.5-20261106) | Unveränderter Spieltest-Archivstand. Weder Index noch produktive Saves mit Drafts überschreiben. |
| **[DRAFT/ANALYSE] Wirtschaft** | [#243 Gesamtwirtschaft](https://github.com/tobiasfranziskus/Check/pull/243) | Endpunkt des **gestapelten** W0–W5s/R32-Forschungszweigs. Audits grün, Langzeitwirtschaft bei legalem Sparen/fehlender Endnachfrage **nicht** stabil. |
| **[DRAFT/ANALYSE] Spiel-UI** | [#203 Hub](https://github.com/tobiasfranziskus/Check/pull/203) → [#207 Adapter](https://github.com/tobiasfranziskus/Check/pull/207) → [#234 W5u](https://github.com/tobiasfranziskus/Check/pull/234) | Isolierter Forschungs-Hub mit **Regel14**, nicht R32. Eigenständige UI-Extraktionen #186/#187/#189/#195/#198 bleiben Ausgangsmaterial. |
| **[OPTION / nicht publiziert]** | [Geplanter W5-Pages-Test](PAGES_SPIELTEST.md) | Das vorhandene Freigabe-/Backupkonzept ist keine Bestätigung einer tatsächlich live veröffentlichten W5-Version. |

## Warum sind noch so viele Draft-PRs offen?

Am Beginn der Bereinigung am 07.11.2026 waren **76** PRs offen. Ein Großteil enthält **Abhängigkeiten im Basis-Branch**: Jeder spätere PR zeigt nur seine Änderungen gegen den direkt darunterliegenden Schritt. Ein solcher PR ist **nicht** durch den Endpunkt-PR ersetzbar, wenn man ihn als laufenden Review-/Testnachweis benötigt. **Nicht sämtliche PRs gegen main retargeten, blind squashen, mergen oder löschen.**

**Wirtschaftsstapel [DRAFT]:** Start [#161](https://github.com/tobiasfranziskus/Check/pull/161) → W1–W5, W5n/o/q/r → Folgeforschung #202–#243. Aktuelle Forschungs-Endpunkte: [#241 Langzeit](https://github.com/tobiasfranziskus/Check/pull/241), [#242 Export-Kosten](https://github.com/tobiasfranziskus/Check/pull/242), [#243 integrierte Wirtschaft](https://github.com/tobiasfranziskus/Check/pull/243). [Gesamtbericht mit 58 Welten](https://github.com/tobiasfranziskus/Check/blob/feature/w5s-ao-gesamtwirtschaft-stresstest-20261107/docs/W5S_AO_INTEGRIERTE_WIRTSCHAFTSANALYSE.md).

**UI-Stapel [DRAFT]:** [#203](https://github.com/tobiasfranziskus/Check/pull/203) → [#207](https://github.com/tobiasfranziskus/Check/pull/207) → [#234](https://github.com/tobiasfranziskus/Check/pull/234); Ursprung #186/#187/#189/#195/#198, unverändert als Quell-PRs.

**Frühere unabhängige Dokumentationspflege:** [#201](https://github.com/tobiasfranziskus/Check/pull/201) verdichtete Roadmap/Status **gegen einen Forschungs-Branch** und darf deshalb nicht unbesehen nach `main` gemergt werden. Dieser Stand dient ausschließlich als redaktionelle Vorlage für den jetzt unabhängig auf `main` begonnenen Kompass. Nach belegter Übernahme **ohne** Forschungsmechanik kann #201 als ersetzt geschlossen werden; seine Historie bleibt erhalten.

## Tests und CI gezielt lesen

- `main`: **2** eigene Workflows und **9** Node-Testdateien im produktiven Hauptbaum, dazu historisches Testmaterial in der Git-Historie. Einstieg `node --test tests/*.test.mjs` (Node.js 22).
- Jüngster R32-Forschungs-Head: **39** Workflow-Dateien einschließlich der Main-Workflows und ~**95** Einträge im `tests/`-Verzeichnis. Ein Stack-Pull-Request kann daher sehr viele alte, überlappende CI-Läufe auslösen. Das ist **Branch-lokale Forschungsinfrastruktur**, noch kein Main-Workflow-Problem.
- Qualität: erfolgreiche **Node-/Chromium-Tests sind keine echte iPad-Safari-/NAS-Abnahme**; fehlgeschlagene/abgebrochene Aktionen und nur frühere Test-Heads sichtbar unterscheiden.
- Die R32-Verschleißregeln (15/30 Tage), Export-Sätze/ISK-Deckel und Folge-/Eigentumsmechaniken sind **Forschungsannahmen**, keine freigegebene Veröffentlichung.

## Sicheres Aufräumen

1. Nur **nachweislich nicht mehr benötigte, unabhängige** Dokumentations-PRs als ersetzt schließen; aneinanderhängende Wirtschafts-/UI-PRs erhalten.
2. Erst mit einer geprüften konsolidierten Integration, echten Geld-/Waren-/Save-Gates und expliziter Produktfreigabe einzelne Forschungs-Features nach `main` holen; **keine 39 Workflow-Dateien** durch unkontrolliertes Mergen mitnehmen.
3. **Keinen** Git-History-Rewrite und **keine** Branchlöschungen ohne Beleg der Nichtbenutzung; `versionen/`, `backup/`, Index und Spielstände unverändert.
4. Historische Langtexte sind vor der Redaktion fest gepinnt: [Roadmap](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/ROADMAP.md), [Projektstatus](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/PROJEKTSTATUS.md). Wiederherstellung mit `git show 5a56d9d7:docs/ROADMAP.md` usw. (oder gezielter Revert dieser Dokumentationsänderung).

**Nächster verifizierbarer Entwicklungsauftrag:** R32-Finanzierungs- und Endnachfrageproblem aus #243 beheben **ohne Gratisrettung**, während #234 separat auf echter Hardware abgenommen wird. Nur die [Roadmap](ROADMAP.md) entscheidet über verbindliche Prioritäten.
