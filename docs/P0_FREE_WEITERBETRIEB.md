# P0 · Weiterarbeiten mit GitHub und lokalen Tests

Das [Auftragsboard #658](https://github.com/tobiasfranziskus/Check/issues/658) führt die Arbeitsaufträge. Vor dem Start [AGENTS.md](../AGENTS.md), [Roadmap](ROADMAP.md) und [Projektstatus](PROJEKTSTATUS.md) lesen. Für die Übergabe genügen Auftrag, Prüfbasis, PR-Head, Originalbelege und offene Gates.

## iPad · GitHub im Browser

Mit einem GitHub-Konto mit Schreibrecht im Repository **Actions → P0 - CI-Nachweis → Run workflow** öffnen, **main** auswählen und starten. Für einen Draft die PR-Nummer und bei Bedarf die erlaubten Pfade angeben, etwa `docs/,tools/p0-free-handoff.cjs`. Sobald der Lauf erscheint, **Summary** öffnen. Das Artifact **p0-ci-nachweis** enthält `handoff.md` und `handoff.json` und bleibt sieben Tage verfügbar.

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

Den Branch mit dem Werkzeug auschecken und den Ausgabeordner außerhalb des Repos wählen, etwa unter `/tmp` bzw. `$env:TEMP`. PR 672 dient hier nur als Beispielnummer.

```bash
node tools/p0-free-handoff.cjs --pr 672 --allow 'docs/,tools/p0-free-handoff.cjs' --out /tmp/check-ci
```

```powershell
node tools/p0-free-handoff.cjs --pr 672 --allow "docs/,tools/p0-free-handoff.cjs" --out (Join-Path $env:TEMP "check-ci")
```

Ohne `--pr` zeigt der Bericht Main. Mit `--allow` gelten exakte Dateipfade und Verzeichnisse mit abschließendem `/`, auch für den alten Pfad bei Umbenennungen. Ohne Pfadgrenze bleibt die Bewertung offen. Die Detaildatei enthält bis zu drei Seiten à 100 Einträge pro Liste. Die Markdown-Ansicht zeigt bis zu 15 Einträge pro Abschnitt und verweist bei weiteren Einträgen auf JSON.

Der Bericht betrachtet die P0-Inventur und JavaScript-Regressionsprüfung für Main-Pushes und PR-Ereignisse. Er zeigt den GitHub-Abschlussstatus und beim PR den gemeldeten Bezug zur Base. `stale_head`, `stale_base` und `unverified_base` verlangen einen Blick in den verlinkten Originaljob. `missing` bezeichnet einen fehlenden Eintrag in einem erfolgreich gelesenen Ausschnitt, `unknown` einen unklaren Status oder fehlgeschlagenen Abruf. Ein grüner Job liefert allein keine Testzahl oder fachliche Freigabe. Die Artefaktliste gilt für den Run, die Jobliste für den verlinkten Versuch. Exitcode `2` kennzeichnet Abruflücken oder einen während der Erfassung geänderten Stand. Der Teilbericht bleibt lesbar. Exitcode `1` kennzeichnet CLI-/Ausgabefehler. GitHub-Jobfehler und Pfadabweichungen stehen im Bericht.

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
