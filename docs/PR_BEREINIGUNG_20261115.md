# PR-Bereinigung und sicherer Entwicklungsanschluss – 15.11.2026

**[DOKUMENTATION / MAIN-BASIS `f65351a03132fa16ecc9b5541c589eb0c8b37617`]**

## Ziel und Sicherheitsprinzip

Für die fortlaufend spielbare Hauptversion ist **ein einzelner autoritativer `main`** maßgeblich, nicht die Anzahl offener, teils aufeinander gestapelter Forschungs-PRs. Historische Tests und negative Befunde bleiben wertvoll; alte gestapelte PRs werden aber **nicht** ohne aktuellen Release-Check automatisch gemergt. **Kein Branch, Tag, Commit, Backup, Spielstand, Archiv oder CI-Artefakt wurde gelöscht**. Die PR-Kommentare behalten jeweils eine separate Begründung. Eine PR-Schließung ist **keine** Integration.

## In diesem Auftrag tatsächlich ohne Merge geschlossene PRs

| Geschlossene PRs | Originalziel | Sachlicher Nachfolger/Status |
| --- | --- | --- |
| [#394](https://github.com/tobiasfranziskus/Check/pull/394), [#393](https://github.com/tobiasfranziskus/Check/pull/393), [#389](https://github.com/tobiasfranziskus/Check/pull/389) | Autonome Silizium-NPC-P4- und historische S02-730-Tage-/Flug-QA | W6/P5/P6 produktiv über [#400](https://github.com/tobiasfranziskus/Check/pull/400); **erst** [P7 #403](https://github.com/tobiasfranziskus/Check/pull/403) prüfte die **wirklich aktivierte** NPC-Silizium-/Jägerkette 730 Tage |
| [#378](https://github.com/tobiasfranziskus/Check/pull/378) | Persönlicher J11-Aldera-Frachter | [#383](https://github.com/tobiasfranziskus/Check/pull/383) integrierter Root-Frachter, #404 Cockpit-Reload |
| [#382](https://github.com/tobiasfranziskus/Check/pull/382) | Opt-in NPC-Firmenpolitik, alte 13×90 | [#400](https://github.com/tobiasfranziskus/Check/pull/400) geprüfte W6/S02-P1-Integration, #403 Langzeitprüfung |
| [#379](https://github.com/tobiasfranziskus/Check/pull/379) | P1-Root-Karriere und Spielstart | [#380](https://github.com/tobiasfranziskus/Check/pull/380) geprüfter Spielstart, #404 und #406 neuere Karriereentwicklung |
| [#371](https://github.com/tobiasfranziskus/Check/pull/371), [#372](https://github.com/tobiasfranziskus/Check/pull/372) | Ursprünglicher J10b-K2-Kauf und dazu gestapelte Browser-/NAS-QA | [#373](https://github.com/tobiasfranziskus/Check/pull/373) Integration, [#404](https://github.com/tobiasfranziskus/Check/pull/404) Root-Mehrschiff-Reload |
| [#300](https://github.com/tobiasfranziskus/Check/pull/300) | Ursprung des gemeinsamen K1-Weltkerns in Forschungsregel199 | Über späteren gemeinsamen Regel204-Stand [#400](https://github.com/tobiasfranziskus/Check/pull/400) abgelöst; ältere Regel199-Saves/Quell-Hashes nicht einfach nachträglich mergen |
| [#299](https://github.com/tobiasfranziskus/Check/pull/299) | Nicht-destruktive Aufräumdoku auf historischem Rule195-`main` | Zentrale [Roadmap](ROADMAP.md), [Status](PROJEKTSTATUS.md), [AGENTS](../AGENTS.md) und nachfolgende [#401](https://github.com/tobiasfranziskus/Check/pull/401)/[#402](https://github.com/tobiasfranziskus/Check/pull/402)/[#405](https://github.com/tobiasfranziskus/Check/pull/405)/[#407](https://github.com/tobiasfranziskus/Check/pull/407) maßgeblich |

**Ergebnis:** Zehn obsolete PRs wurden **geschlossen, nicht gemergt**. Die PR-Verläufe bleiben einschließlich ursprünglicher GitHub-Actions-Belege erhalten. Die zugehörigen Branches bleiben für Reproduktion und Vergleich verfügbar. Keine bereinigte PR wird damit nachträglich als neuer bestandener Integrationstest dargestellt.

## Bewusst **nicht** geschlossen oder veröffentlicht

- **[#408](https://github.com/tobiasfranziskus/Check/pull/408) [DRAFT/ANALYSE] Regel205:** Zwei räumlich getrennte, jeweils 16 Einheiten umfassende **experimentelle Nadir-Felder**, streng auditiert. [13×90 und S02×365](https://github.com/tobiasfranziskus/Check/actions/runs/43753837865) erfolgreich: S02/S11 erzeugen je vier tatsächlich finanzierte Jäger, die anderen elf Krisenregime keinen dritten. S02 nach 365 Tagen: vier Jäger, drei bezahlte 900-ISK-Spielerkäufe, 379 Ersatzkäufe, 33.000 ISK, Mint/Burn 0, Hash `e7001bb97dfb4df2`. **356/356 Node22** und unveränderter Regel204-90-Tage-Referenzhash. Das ist kein genehmigtes Rohstoff- oder Save-Balancing und keine Dravos-Fracht. Details weiterhin im Draft: `docs/W6_P8B_RULE205_ZWEIFELD_VERSUCH.md`.
- **Historische K-/J-/F8-Forschungsbranches** mit eigenständigen negativen Analysen oder nur teilweise integrierten Gameplay-Prototypen bleiben als Forschung erhalten, bis ihr einziger verbleibender Erkenntnis-/Merge-Wert geprüft wurde. Bloßes Alter, große PR-Zahl oder ein erfolgreiches altes CI-Gate rechtfertigen keine ungezielte Löschung.
- **Main & Pages** bleiben bei `f65351a03132fa16ecc9b5541c589eb0c8b37617`, bestätigter [Pages-Deploy #43751194918](https://github.com/tobiasfranziskus/Check/actions/runs/43751194918); Regel204/Schema8, J14 und P8a. Ohne eigenständig genehmigte Ressourcen- und Finanzierungsregeln **kein** Regel205-Merge.
- **Keine echte Geräteabnahme:** iPad Safari und privater NAS-Server bleiben offen, unabhängig von Chromium/WebKit-/Pages-CI.

## Verbindlicher Anschluss für die nächste Entwicklung

1. **[NÄCHSTER FORSCHUNGSSCHRITT / P8c]** Die **wirkliche** Dravos→Nadir-Verbindung erfordert ein aktives, endliches Dravos-Siliziumfeld, reale und finanzierte lokale Miner-/Frachterrechte, eigene Station/Dock, physische Warenübergabe, einen bezahlten intersystemischen Transit, Stations-Nachfragebudget, Schiffsverschleiß und Manipulations-/Save-Schutz. Der P8b-Nadir-Zweifeldversuch ist nur methodischer Vorläufer, **nicht** selbst die Dravos-Implementierung.
2. P8c auf **separatem Forschungsbranch** mit expliziter Regel-/Schemagrenze und Tests; keine fiktive Dravos-Buchung in die bisherige W3-Aldera/Nadir-Strecke einschleusen. Insbesondere zunächst das vorhandene `m_core_route`, `m_core_w3`, `m_core_spielerfracht`, `m_core_silizium`, Dock-/Flugbuch und `m_core_audit` wiederverwenden.
3. Danach eigene Abnahme: feste Seeds/Hashes, Geld-/Waren-/Eigentums-/Schiffs-Summen, Finanzierungs-/Unterkapitalisierungs-Negativfälle, Save/Load und ausdrücklich kontrollierte 204→Neuregel-Übernahme. Für größere Integrationen **13×90** und mindestens S02×365, bei Bedarf 730 Tage; Chromium und WebKit je vier Touchgrößen. Wirklich spielbarer Root-Weg und bestehende Nutzer-Saves bleiben bis zu vollständiger Freigabe geschützt.
4. Bei erfolgreicher Forschung produktive Wirtschaftsentscheidung (Lagergröße, Flug-/Arbeitskosten, Handelspartner, Risiko und Regeln zur Save-Übernahme) **explizit an den Nutzer** geben; erst dann die neue Wirtschaft in `main` integrieren. Negative Finanzierungsergebnisse als echte Engpässe dokumentieren, nicht still ausgleichen.

Diese Aufräumdokumentation ist **keine neue Roadmap**. Maßgeblich bleiben die Ziele und Prioritäten aus [ROADMAP.md](ROADMAP.md).
