# Aphros Void – Check

> **Aktuelle Hauptversion / 10.11.2026:** W0–W5-Regel195/Schema8 als [einzige statische HTML-Datei `aphros-void.html`](aphros-void.html), identisch zur [GitHub-Pages-Startdatei](index.html), freigegeben und auf [main `ba0c1861`](https://github.com/tobiasfranziskus/Check/commit/ba0c1861a664f0655928e85cf834dee75c092a00) integriert. Alte Hauptversion gesichert unter [`versionen/main-pre-w5-20261110/`](versionen/main-pre-w5-20261110/) und im [Backup-Branch](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-w5-20261110). [Release- und Save-Hinweise](docs/W5_SINGLEFILE_RELEASE.md). Echte Safari-/NAS-Abnahme offen. Die weiter unten erhaltenen Hinweise auf Regel14 als `[MAIN]` sind **historisch**, nicht mehr aktuell.


**Weltraumwirtschaft, Konzernmanagement und direkt spielbare 2D-Schiffe.** Aphros Void ist ein Browserprojekt mit statischer `index.html`, HTML/CSS/Vanilla JavaScript, deterministischem gemeinsamen Simulationskern und iPad-Safari-/NAS-Zielplattform.

- **Öffentlicher Einstieg:** https://tobiasfranziskus.github.io/Check/ (tatsächlich ausgelieferte Fassung gesondert von lokalen Drafts prüfen)
- **[MAIN]** Hauptbranch: `v0.12.5`, **Regel14/Schema8**. Das R32-/W5s-Forschungsmodell ist **nicht** gemergt und nicht Bestandteil des regulären Hauptspiels.
- **[BACKUP]** Bewahrte [v0.12.5-Datei](versionen/v0.12.5/index.html) / [Originalfassung im Backup-Branch](https://github.com/tobiasfranziskus/Check/tree/backup/pages-v0.12.5-20261106).
- **[DRAFT / Forschung]** [W5s-ao Gesamtwirtschaft #243](https://github.com/tobiasfranziskus/Check/pull/243) auf eigenem Regel32-Branch: der Originalkern bestand Geld-/Waren-/Eigentümeraudits, **der langfristige Wirtschaftskreislauf ist nicht tragfähig**. Keine neue Geldmodell-B-Produktregel.
- **[DRAFT / Oberfläche]** [W5u #234](https://github.com/tobiasfranziskus/Check/pull/234): getrennter Hub-Prototyp mit Regel14 und speziellen Save-Slots, kein R32-Produkt.

## Verbindliche Projektquellen

| Dokument | Aufgabe |
| --- | --- |
| [docs/ROADMAP.md](docs/ROADMAP.md) | **Einzige verbindliche Roadmap**: Spielvision, W0–W6, Prioritäten und noch offene Produktentscheidungen |
| [docs/PROJEKTSTATUS.md](docs/PROJEKTSTATUS.md) | Nachprüfbare technische Fakten, tatsächliches `main`, Forschungs-PRs, Tests und Abnahmegrenzen |
| [AGENTS.md](AGENTS.md) | Entwicklungsregeln, Tests, Eigentümer-/Save-/Merge-/Release-Schutz |
| [docs/README.md](docs/README.md) | **PR-/Branch-/Archivnavigation**, inklusive Status der gestapelten Forschungszweige |
| [docs/PAGES_SPIELTEST.md](docs/PAGES_SPIELTEST.md) | Abgrenzung von geplantem W5-GitHub-Pages-Spieltest und ursprünglichem Hauptlink |

## Lokal starten und prüfen

`index.html` in einem Browser öffnen oder die Dateien über einen statischen HTTP(S)-Server bereitstellen. **Kein npm-Install, Backend, Build-System oder Framework erforderlich.** Für entwicklungsseitige Tests mit **Node.js 22**:

```sh
node --test tests/*.test.mjs
```

Die Forschungs- und UI-Branches haben jeweils zusätzliche Tests und Prototypen. CI- oder Chromium-Touch-Ergebnisse ersetzen **keine** echte Safari-/iPad-/NAS-Abnahme. Spielstände vor einem Versionswechsel als JSON exportieren; **keine** alte IndexedDB-Datenbank still löschen oder umdeuten.

**Freigaben:** Der Nutzer entscheidet über Produktmechaniken, Merges und Veröffentlichungen. Nicht von einem grünen Forschungs-PR auf einen integrierten Hauptspielstand schließen.
