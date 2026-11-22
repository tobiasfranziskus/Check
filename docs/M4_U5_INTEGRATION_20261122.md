# M4-U5 – unabhängige Integrationsprüfung (22.11.2026)

**[DRAFT / INTEGRATIONSKANDIDAT]** Quelle [#571](https://github.com/tobiasfranziskus/Check/pull/571), exakt `c991d2f0b008d6750ce4a670b168a9f6287499de`, gegen `main 41ee2b8d3197f91af1dcac176dd6c9c68917f076`. Vergleich: 6 Commits voraus, 0 zurück, 21 Quelldateien. Vorversion gesichert unter [backup/main-before-m4-u5-20261122](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-m4-u5-20261122). Der Integrationsbranch übernimmt die Quelle unverändert und ergänzt diesen Prüfbericht. Keine Freigabe neuer Regeln.

## Unabhängig gelesene Codeänderungen und Testabdeckung

- Beide Änderungen im Weltkern sind zusätzliche Anzeigezugänge zu bestehenden Stilllegungs- und Eisfrachtpreisfunktionen. Keine Änderung der Buchungs-, Tick-, RNG-, Save- oder Preisregeln im jeweiligen Diff.
- Handelsweg bevorzugt eine tatsächlich freigegebene Frachtquote; Flotte zeigt bestehende eigene Erzaufträge und Stop-Befehle. Die Dispositionsansicht liest Lager, Abnahmebudgets und Originalpreise, führt selbst keine Buchung aus. Bestehende J8-Ausführung prüft die Quote erneut. Ersatzkauf beruht auf bestehendem Angebot, nicht auf erfundener Hülle.
- Rückmeldung und Sektorkarte trennen Erz/Eis; ältere Frachtbelege bleiben zugänglich. Schutzfenster der Flottenaktion beginnt nach Aktualisierung. Keine neue alternative Nachfrage.
- Der Quelltest `tests/m4-u5-wirtschaft.test.mjs` enthält Nachstellung des 48-Fahrten-Engpasses, unveränderten Export bei Anzeige und atomar abgelehnten Fremd-/unzulässigen Befehlen, manipulierte Saves, Originalhashes, zwei weitere Tage, Waren-/Geld-/Eigentumsaudit, reguläre Förderpause. Nicht mit dem Originalsave des Spieltests verwechseln.

## Nachweis der bereits ausgeführten Quell-CI

GitHub-Workflow-Status für exakt den Quellhead abgefragt: **8/8 completed/success**. Details der folgenden Jobs zusätzlich abgerufen:

- [M4 #45027746563](https://github.com/tobiasfranziskus/Check/actions/runs/45027746563): Node22 Originalfinanzierung/Save/Replay/Negativfälle sowie Chromium und WebKit je vier Touchgrößen, Root, Import der Nachstellung, Sperrtexte, Erzpause und Reload.
- [P1 #45027746539](https://github.com/tobiasfranziskus/Check/actions/runs/45027746539): beide Browser, Karte, Karriere, P2, Root-/HTTP-Prüfung und Core-Audit.
- [JavaScript #45027746549](https://github.com/tobiasfranziskus/Check/actions/runs/45027746549): Gesamtsuite und Referenzläufe erfolgreich; bedingter Sicherheitsgeografie-Job übersprungen.
- [W6 #45027746572](https://github.com/tobiasfranziskus/Check/actions/runs/45027746572): vollständige Node22-Suite, 13×90, S02×365/730 und getrennte Regel207-Browserkompatibilität erfolgreich.
- [J4e #45027746546](https://github.com/tobiasfranziskus/Check/actions/runs/45027746546), [W5 #45027746533](https://github.com/tobiasfranziskus/Check/actions/runs/45027746533), [W6-P8a #45027746554](https://github.com/tobiasfranziskus/Check/actions/runs/45027746554), [W6-P8g #45027746573](https://github.com/tobiasfranziskus/Check/actions/runs/45027746573): Workflowstatus erfolgreich.

Diese Tests wurden von GitHub ausgeführt, nicht erneut lokal in diesem Audit. Die Integration benötigt eigene CI und einen bestätigten unveränderten Produktdiff. Kein Merge oder Pages-Deployment mit dieser Notiz behauptet.

## Offene Produkt-/Abnahmegrenze

Der eigentliche Wirtschaftsengpass bleibt bestehen (Nadir 130/150 Eis, 118 Wasser, Exportkäufer 0 ISK). Förderpause vermeidet Folgekosten, erzeugt aber keine Nachfrage. Die automatische Erzwartephase und der freiwillig finanzierte W3-Hausfrachtervertrag sind separate Kernaufgaben mit Regel-/Rechte-/Langzeitprüfungen. Keine Wasserabholung, variable Frachtmenge, Piraten, Schäden oder XP aktiviert. M4-U4 (60 Minuten interaktiver Blindtest), physisches iPad und NAS bleiben offen.

**Vor Merge:** aktuellen main und Integrationshead erneut prüfen, vollständige Integrations-CI abwarten, dann gesondert Pages-Deploy und öffentliches Root nachweisen; Roadmap/Projektstatus erst danach als MAIN/PAGES kennzeichnen. Backup nicht verschieben.
