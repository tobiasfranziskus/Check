# P0 · Weiterarbeiten mit GitHub und lokalen Tests

Das [Auftragsboard #658](https://github.com/tobiasfranziskus/Check/issues/658) führt die Arbeitsaufträge. Vor dem Start [AGENTS.md](../AGENTS.md), [Roadmap](ROADMAP.md) und [Projektstatus](PROJEKTSTATUS.md) lesen. Für die Übergabe genügen Auftrag, Prüfbasis, PR-Head, Originalbelege und offene Gates.

## iPad · GitHub im Browser

Mit einem GitHub-Konto mit Schreibrecht im Repository **Actions → P0 - CI-Nachweis → Run workflow** öffnen, **main** auswählen und starten. Für einen Draft die PR-Nummer und bei Bedarf die erlaubten Pfade angeben, etwa `docs/,tools/p0-free-handoff.cjs`. Sobald der Lauf erscheint, **Summary** öffnen. Das Artefakt **p0-ci-nachweis-<Run-ID>-<Versuch>** enthält `handoff.md` und `handoff.json` und bleibt sieben Tage verfügbar.

GitHub bietet den manuellen Start erst an, wenn der Workflow auf dem Standardbranch registriert ist. Bis dahin oder ohne Schreibrecht **Actions**, den PR-Reiter **Checks** und **Files changed** direkt öffnen. Die GitHub-Oberfläche zeigt dort die Originaljobs, den jeweiligen Commit und die Dateiliste. Den Draft über den lokalen Weg unten prüfen.

## Windows und Linux · eigener Branch und lokale Checks

Git, **aktuelle Node-Version 22.x** mit npm und für den Metadatenbericht GitHub CLI (`gh`) installieren. Den Browserlogin mit `gh auth login --hostname github.com --web` starten und mit `gh auth status` prüfen. Zugangsdaten verbleiben im lokalen Credential Store. Die öffentlichen Quellen lassen sich auch ohne ChatGPT-GitHub-Verbindung klonen. GitHub-Schreibrechte sind für einen PR im Originalrepository nötig. Wer sie nicht hat, kann auf einem eigenen Fork arbeiten und später einen Draft gegen das Original öffnen.

Einmal klonen. Bei vorhandener Kopie ab `git status` beginnen und eigene Änderungen vor einem Branchwechsel sichern.

```sh
git clone https://github.com/tobiasfranziskus/Check.git
cd Check
git status --short
git fetch origin main
git switch --no-track -c codex/eigener-auftrag origin/main
git rev-parse HEAD
node --version
node --test "tests/*.test.mjs"
node scripts/p0-prototype-deps.mjs --check
```

Bei einem Fork zeigt `origin` auf den eigenen Fork. Das Original als `upstream` hinzufügen (`git remote add upstream https://github.com/tobiasfranziskus/Check.git`), `git fetch upstream main` ausführen und von `upstream/main` abzweigen.

Für einen Touch-Smoke denselben Playwright-Pin und dasselbe J4e-Skript wie in der [Browser-CI](../.github/workflows/j4e-public-smoke.yml) verwenden. Der Test startet seinen eigenen lokalen HTTP-Server und prüft vier Viewports. Die Installation liegt im Temp-Verzeichnis.

**Linux (Bash, auf unterstütztem Ubuntu/Debian bei Bedarf `install --with-deps chromium webkit` verwenden)**

```bash
pw_dir="$(mktemp -d)"
npm install --no-save --prefix "$pw_dir" playwright@1.62.0
node "$pw_dir/node_modules/playwright/cli.js" install chromium webkit
PLAYWRIGHT_MODULE="$pw_dir/node_modules/playwright" WELT_BROWSER=chromium node tests/j4e-duell-browser.cjs
PLAYWRIGHT_MODULE="$pw_dir/node_modules/playwright" WELT_BROWSER=webkit node tests/j4e-duell-browser.cjs
```

**Windows (PowerShell)**

```powershell
$pwDir = Join-Path $env:TEMP ("check-playwright-" + [guid]::NewGuid())
npm.cmd install --no-save --prefix $pwDir playwright@1.62.0
node (Join-Path $pwDir "node_modules/playwright/cli.js") install chromium webkit
$env:PLAYWRIGHT_MODULE = Join-Path $pwDir "node_modules/playwright"
$env:WELT_BROWSER = "chromium"
node tests/j4e-duell-browser.cjs
$env:WELT_BROWSER = "webkit"
node tests/j4e-duell-browser.cjs
Remove-Item Env:PLAYWRIGHT_MODULE, Env:WELT_BROWSER
```

Vor dem Push `git diff --check` und den Diff gegen den Zielbranch lesen. Nur die Auftragsdateien stagen und committen. Für laufende Arbeit auf dem eigenen Branch `git push -u origin HEAD` und im Browser **Pull requests → New pull request → Create draft pull request** wählen. Alternativ im Originalrepository `gh pr create --draft --base main --fill` ausführen. Die Projektleitung entscheidet über die Integration.

## Metadatenbericht lokal lesen

**Vertrauensgrenze:** Mit lokalem `gh`-Login ausschließlich einen vertrauenswürdigen, anhand des Commit-SHA gepinnten und geprüften Werkzeugstand ausführen (nach Integration vorzugsweise den geprüften Main-Commit). Niemals beliebigen PR-Code im angemeldeten lokalen Checkout starten. Den Werkzeug-Commit getrennt vom zu untersuchenden PR wählen, mit `git rev-parse HEAD` bestätigen und bei Bedarf in einem separaten sauberen Checkout ausführen. Für den Bericht nach Möglichkeit einen nur lesenden GitHub-Zugang verwenden; Schreibzugriff wird dafür nicht benötigt. Der Ziel-PR wird ausschließlich über seine Nummer abgefragt.

Den Ausgabeordner außerhalb des Repos wählen, etwa unter `/tmp` bzw. `$env:TEMP`. PR 672 dient hier nur als Beispielnummer.

```bash
node tools/p0-free-handoff.cjs --pr 672 --allow 'docs/,tools/p0-free-handoff.cjs' --out /tmp/check-ci
```

```powershell
node tools/p0-free-handoff.cjs --pr 672 --allow "docs/,tools/p0-free-handoff.cjs" --out (Join-Path $env:TEMP "check-ci")
```

Ohne `--pr` zeigt der Bericht Main und Veröffentlichung. Mit `--allow` gelten exakte Dateipfade und Verzeichnisse mit abschließendem `/`, auch für den alten Pfad bei Umbenennungen. Ohne Pfadgrenze bleibt die Bewertung offen. `handoff.md` fasst die nächsten offenen Gates in unter 100 Zeilen zusammen. `handoff.json` (Schema 2) enthält die Details, darunter die Originaljob- und Versuchslinks, die Jobdauer und den ersten auffälligen Schritt, soweit verfügbar.

| Abschnitt | Was der Bericht prüft |
| --- | --- |
| PR | Head, aktuelle Base und Run-Base getrennt. Der Testmerge-Kandidat wird anhand seiner beiden Git-Eltern und seines Trees geprüft. Bei einem geschlossenen PR kann die aktuelle Base von der historischen Run-Base abweichen. |
| Main-Push | P0-Inventur für jeden Main-Push. Die JS-Regression berücksichtigt ihre Pfadfilter. Für eine negative Trigger-Aussage ist ein passender GitHub-Push mit vollständigem Vergleich nötig. Ohne diesen bleibt ein ausstehender Lauf unklar. |
| Pages | Der systemseitige Actions-Lauf und der GitHub-Deploymentstatus werden separat auf dem Main-SHA erfasst. |
| Öffentlicher Root | Den separaten HTTP-/Browsernachweis für denselben Stand im Original prüfen, etwa den [Regel208-Nachweis](https://github.com/tobiasfranziskus/Check/actions/runs/46114021120/job/140883655423). |

Der geprüfte Katalog umfasst 22 Repository-Workflows. Er enthält PR-Pfade, Push-Branches, manuelle Trigger und konkrete Jobnamen einschließlich Matrixvarianten. Ein Git-Blob-Abgleich macht geänderte Definitionen sichtbar. Historische Pushes der W6-Forschungsbranches sowie manuelle Modelljobs mit Zustimmung sind keine Main-Pflichtchecks. Bei einer Workflow-Änderung Katalog, Blob-ID (`git hash-object <Pfad>`) und betroffene Fixtures in einem geprüften Werkzeugstand nachführen. Unbekannte oder abweichende Definitionen als `unknown` behandeln und die Originaljobs öffnen.

`metadata_success` bezeichnet einen passenden, stabilen GitHub-Run mit vollständigen und erfolgreichen erwarteten Jobmetadaten. `missing` setzt einen erwarteten Check und einen vollständigen Abruf voraus. `stale_head`, `stale_base` und `unverified_base` kennzeichnen abweichenden oder unbelegten Commit-Bezug. Bei mehreren Runs desselben SHA zählt der neueste. Bei einem Retry bleiben frühere Jobs separat. Ein übersprungener Pflichtjob oder ein fehlender Matrixjob lässt die Jobabdeckung offen. Die historisch bedingte Sicherheitsgeografie ist nur für die dafür vorgesehene PR-Base Pflicht.

Ein fehlgeschlagener oder ungültiger PR-Abruf erhält die angefragte PR-Nummer, Main/Pages und Abruffehler im Teilbericht; PR-Stand und Dateidifferenz bleiben unbekannt. Bei abgeschlossenen Jobs müssen auch die Schrittzustände abgeschlossen und widerspruchsfrei sein. Legitime bedingte `skipped`-Schritte bleiben erlaubt. Nicht abrufbare oder auf drei Versuche gekappte Historien setzen die Gesamtbewertung auf `unknown`; die aktuellen Jobs und deren Bewertung bleiben separat sichtbar. Markdown nennt die unvollständige Versuchshistorie und hält das nächste Gate bei Abruflücken offen.

Der Reporter liest GitHub-Metadaten mit GET. Er ruft weder Rohlogs noch Artefaktinhalte ab und verwendet keine freien Schritttexte als Fachbeleg. Der tatsächliche Checkout, TAP-Zahlen, fachliche Marker und die Zuordnung von Artefakten zu einem Versuch bleiben deshalb `unknown`. Für diese Nachweise den verlinkten Originaljob, den konkreten Versuch und den Checkout prüfen. Beispielsweise kann der V10-Schritt erfolgreich enden, nachdem er den Vergleich intern übersprungen hat. Der Bericht liefert CI-Evidenz für die technische Übergabe. Die M4-Abnahme sowie echte iPad-/NAS-Prüfungen haben eigene Nachweise.

Der Abruf begrenzt Listen auf drei Seiten à 100 Einträge, Versuchsdetails auf die drei jüngsten Versuche und Schrittmetadaten auf 80 Einträge pro Job. Die CLI akzeptiert je Aufruf maximal 220 Requests mit sechs gleichzeitigen Abrufen, 12 Sekunden pro Request, 100 Sekunden Gesamtzeit und bis zu 2 MiB pro Antwort innerhalb eines 48-MiB-Budgets. Fehlende, ungültige oder wiederholte IDs und widersprüchliche Mengen gelten als Abruflücken. Main, PR und der ausgewählte Run werden nachgelesen. Exitcode `2` kennzeichnet Abruflücken oder einen während der Erfassung geänderten Stand. Der Teilbericht bleibt erhalten. Exitcode `1` kennzeichnet CLI-/Ausgabefehler. Fachliche GitHub-Fehler und Pfadabweichungen stehen im Bericht.

## Falls ChatGPT GitHub nicht erreicht

1. Board und PR mit der GitHub-Anmeldung im Browser öffnen. Den genauen Auftrag, den erlaubten Dateisatz sowie Main-/PR-SHA in die Vorlage unten übernehmen. Originalprüfungen anhand der Links lesen.
2. Repo im Terminal klonen bzw. aktualisieren, eigenen Branch anlegen und die lokalen Checks ausführen. Für eine rein manuelle Übergabe `git rev-parse HEAD`, `git merge-base origin/main HEAD` und `git diff --name-status origin/main...HEAD` verwenden. Beim Fork `upstream/main` einsetzen. Über **Checks** den Run und den Job öffnen und Status sowie Testzahlen am Originaljob verifizieren.
3. Falls KI-Unterstützung verfügbar ist, Codex im eigenen Checkout mit dem kopierten Auftrag starten. Bei ausgeschöpftem oder fehlendem Zugang im Editor weiterarbeiten oder Cline mit einem lokal erreichbaren Ollama-Modell nutzen. In Cline **Ollama** als Anbieter wählen, ein lokal installiertes Modell auswählen und den eigenen Checkout öffnen. Modell, Hardware und verfügbare Kontingente bestimmen, was nutzbar ist. Die Befehle oben funktionieren unabhängig vom KI-Zugang. Schlüssel gehören in die lokale Integration, Zugangsdaten und Spielstände bleiben außerhalb des PRs.
4. Bei fehlendem Connector Draft und Board-Kommentar im GitHub-Browser selbst anlegen. Fehlt auch GitHub-Schreibzugriff, lokalen Commit und Testbelege sichern und an die Projektleitung mit Schreibrecht übergeben.

**Auftrag**

```text
<ID> · <Ziel und beobachteter Befund> · Basis <SHA>
Dateigrenze <Pfade> · Abnahme <konkret prüfbare Ergebnisse>
```

**Übergabe für PR und Board**

```text
<ID> · <Ergebnis und Status> · Branch <Name> · Draft <Link> · Head <SHA> · Base <SHA>
Belege <tatsächlich ausgeführte Checks mit Resultat und Originaljob-Links>
Offen <Blocker oder nächstes Gate für 00>
```
