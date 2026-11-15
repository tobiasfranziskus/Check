# Aphros Void – tägliche Projektleitung, Putzplan und Qualitätsmatrix

**[BESCHLOSSEN / 15.11.2026]** Verfahrensdokument zur einen verbindlichen [Produkt-Roadmap](ROADMAP.md), kein Konkurrenzplan. GitHub: `tobiasfranziskus/Check`; geplanter Morgenlauf **06:30 Europe/Berlin**. `AGENTS.md` gilt für alle Änderungen.

## Zweck und Grenzen

ChatGPT koordiniert priorisierte, spielbare Entwicklung und die technische Wahrheit. Die laufende Automatik führt **Supervision, Triage und gegebenenfalls nicht-destruktive Dokumentationspflege** aus. Das ist **keine Genehmigung zum täglichen automatischen Code-Commit, Merge, Pages-Deploy, NAS-Push, Branchlöschen oder zur Freigabe neuer Wirtschaftsregeln**. Jede echte Entwicklung erfolgt in unabhängig prüfbaren, gegen den aktuellen `main` gerichteten Arbeits-PRs nach `AGENTS.md`; die bestehende stehende Integrationsfreigabe für bestandene, spielbare Aufträge bleibt davon getrennt. Fehlende Tool-/GitHub-/Browserrechte offen melden.

## Verbindlicher morgendlicher Ablauf

1. **Frische Wahrheit:** `main`-SHA und Datum, letzter erfolgreicher Pages-Deploy und dazugehöriger SHA, `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, offene/gestapelte PRs, neue Commits, wichtige CI-Läufe und aktuelle Spielpfade nachprüfen. Nie alte Projektberichte als heutigen main-Stand verwenden.
2. **Einordnung:** Jede relevante Entwicklung als **[MAIN]**, **[PAGES]**, **[DRAFT]**, **[ANALYSE]**, **[BESCHLOSSEN]** oder **[OPTION]** kennzeichnen. Test-Erfolg, Merge und Deployment sind getrennte Belege. Forschungs-Regeln 205/206 sind nicht allein wegen grüner CI produktiv.
3. **Putzplan:** PR-Liste gegen aktuelle Hauptversion und Nachfolger abgleichen. Für jedes potenziell überholte PR die ursprüngliche Basis, noch einzigartige Erkenntnisse/Dateien, CI und Nachfolge-/Mainbelege notieren. Kandidaten für Schließung markieren, **nicht allein wegen Alters schließen**. Geschützte Branches, Backups, Tests, Rohberichte und Spielerstände erhalten. Keine doppelten docs-only-PRs.
4. **Produkt-Roadmap:** Nach **P0–P6** (Spielbarkeit) und **W0–W6** (Wirtschaft) beurteilen: Was ist integriert und bedienbar? Was ist nur Demo? Welcher Engpass hemmt die nächste echte Spielerhandlung? Keine neue Produktentscheidung durch Interpretation eines Forschungsergebnisses.
5. **Qualität:** Tatsächlich gelaufene Node22-/Audits-/Seed-/Save-/Touch-/Browser-/Pages-Checks, Ausfälle und Skips mit exakten Referenzen prüfen. Auf offene echte iPad-/NAS-Abnahme ausdrücklich hinweisen.
6. **Fortschritt steuern:** Höchstens **2–4** priorisierte nächstliegende Arbeitspakete mit Ausgangsstand, konkretem Spieler-Nutzen, Dateigrenze, Test-/Abnahmekriterium, Risiken und zuständigem Werkzeug vorschlagen. Codex nur für große entkoppelte Implementierungen/Tests, mit Hoch/Extra hoch und eigenen Drafts; nie parallel kollidierende Dateien beschreiben.
7. **Schreiben nur bei Beleg:** Falls Roadmap/Status/Index materiell falsch sind, einen **docs-only-Draft-PR** gegen aktuellen main erstellen oder einen passenden vorhandenen aktualisieren. Ohne Änderung nicht committen. Automatischer Morgenlauf **merged oder deployed niemals**. Unbewiesene technische Fortschritte nicht in Status umetikettieren.
8. **Kompakt berichten:** Datum, `main`/Pages-SHA, Veränderungen seit Vortag, Roadmap-P/W-Status, Putzfund/PR-Kandidaten, QA-Matrix, Erreicht-Checkliste, nächste Schritte, blockierte Entscheidungen, konkreten Handlungsauftrag und Link zu einem ggf. erstellten docs-only-PR.

## Simulierte iPad-Abnahme vor spätem Gerätetest

| Prüfschicht | Mindestumfang | Wahrheit im Bericht |
| --- | --- | --- |
| Kern/Node22 | Gesamtsuite; deterministische Seeds/Referenzhashes, negative Rechte-/Finanzierungs-/Manipulationsfälle, Geld/Waren/Schiffe/Eigentum und Save/Load | **[NODE BESTANDEN/OFFEN/FEHLER]** nur nach tatsächlicher Ausführung |
| Chromium und WebKit | Je 1180×820, 1024×768, 820×1180, 390×844; echtes UI aus Root, Touchzielwahl, Joystick, Mehrfingerzoom, Scroll/Überlagerung, Fokus, Pause/Resume, Cockpit↔Konzern | **[BROWSER-EMULATION]** mit getrennten Engines und Screen-Größen |
| Flug-Autopilot | Annähern, Orbit, Folgen mit Distanz, Aufschalten, Handübernahme, Abbruch und Zielverlust; solange nicht [MAIN], nur zulässige existierende Aktionen prüfen | Keine simulierten Befehle als integrierten Core ausgeben |
| Speicher/Deployment | Lokalstorage/IndexedDB/Reload, Export/Import alt/neu/ungültig, letzte gültige Sitzung erhalten, statische HTTP-Root, Pages-Deploy-SHA, NAS-Einzeldatei | Pages/HTTP ist kein privates NAS |
| Langzeit/Stress | Angemessene 13×90 sowie S02×365/730 bei großen Wirtschaftsänderungen; Touch-Performance, Zustandsspeicher und Crash-/Unterkapitalisierungstests nach Relevanz | Ergebnisse nur des ausgeführten Profils, kein W6-Generalschluss |
| Physische Geräte | **Echtes iPad Safari** hoch/quer, Gesten, Speicher-/Speicherplatzgrenzen; NAS auf privatem Gerät | **[ECHTGERÄT OFFEN]** bis tatsächlicher späterer Nutzerabnahme |

**Keine falschen Garantien:** WebKit unter Playwright ist nicht mit iPad Safari identisch. Emulierter Viewport bildet Touch-/OS-/Browser-Speicherverhalten nur begrenzt ab. Die echte Abnahme wird bewusst später durchgeführt und bleibt als offene Restschuld dokumentiert. Browser-Gates dürfen trotzdem die kontinuierliche, hinreichend geprüfte öffentliche Spieltestversion tragen.

## Leitentscheidungen für Planung

- **Spielbarkeit parallel zur Wirtschaft:** Konkrete neue Spielerentscheidung oder Tätigkeit vor zusätzlichen isolierten Systemen; Richtwert 50 % Integration/UX, 35 % W6/Wirtschaft, 15 % Ordnung/QA.
- **W0→W6 unverändert; P0→P6 für Erleben und Umsetzung.** NPC dürfen scheitern. Keine Gratisware/ISK/Rettung. Echte Schäden schaffen nur finanzierbaren Bedarf, keinen automatischen Käufer.
- **Bewährtes wiederverwenden:** `void-echoes` für Touch- und Bedienmuster; niemals dessen veraltete Core- oder Speicherlogik unkontrolliert in den aktuellen autoritativen Kern einführen.
- **Wissenschaftlich korrekt:** Ein endliches Siliziumfeld beweist keine unendliche Versorgung; P8b/P8c sind Forschung. Negative 13×90-Befunde stehen als echte Risiken.
- **Arbeitsende:** Offene Tests, PRs, Entscheidungen und tatsächliche `main`-/Pages-SHAs für den nächsten Chat sichern.

## Ausgangslage am 15.11.2026 (historischer Referenzpunkt, täglich neu prüfen)

Zuletzt überprüfter `main`: `fb81a117c9bd976d396187d22b583df6b07bdd3e`, Pages-Deployment `43756986613` erfolgreich; Roadmap/Status-Pflege und bereits zehn begründete alte PR-Schließungen; offenes UX-Thema [#410](https://github.com/tobiasfranziskus/Check/issues/410), Forschungsdrafts [#408](https://github.com/tobiasfranziskus/Check/pull/408) / [#412](https://github.com/tobiasfranziskus/Check/pull/412). **Nicht dauerhaft als aktuellen Stand lesen.**
