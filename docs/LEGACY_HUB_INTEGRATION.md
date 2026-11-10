# Legacy-UI-Hub · Integrationsbericht

**[DRAFT / UI-PROTOTYP] 05.11.2026.** Branch `codex/legacy-ui-hub`, Basis
aktueller, per GitHub erneut geprüfter `main b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`.
Keine Produktintegration oder Änderung der Prioritäten. AGENTS, Roadmap und
Projektstatus geprüft. Roadmap/Projektstatus bleiben gemäß ausdrücklichem
Schutzauftrag für die Dokumentationsdateien von PR #201 unverändert.

## Herkunft und Übernahme

Alle neuen Dateien der fünf Quell-PRs einschließlich ihrer Node-/Browsertests,
Demo-Einstiege und Übernahmeberichte übernommen. Keine Quelldemo gelöscht.

| PR | Quellbranch / gepinnter Head | Komponentenvertrag |
| --- | --- | --- |
| #186 | `codex/legacy-fitting-ui-extraktion` · `d744d3a4fe9ac15be9887b8eb831779cde3034e8` | `m_ui_fitting_ansicht.mount`; Host ergänzt Update/Destroy |
| #187 | `feat/legacy-station-preview` · `63f39a3749a6a6346c1a40f5201230c316d5272e` | `LegacyStation.mount/update/destroy` |
| #189 | `feat/legacy-pilotenakte` · `effb82b1e19738293359073b6eff391995ce3273` | `LegacyPilot.mount/update/destroy` |
| #195 | `feature/legacy-mining-scanner-20261105` · `059d284661802767c4f065b3b0881f70f49e2018` | `LegacyMiningScanner.mount/update/destroy` |
| #198 | `feat/legacy-corporation-preview` · `4396305c3812fefdc75fd9f1f9e9d0632cc5b4ed` | `LegacyCorporation.mount/update/destroy` |

Die PR-Beschreibungen und enthaltenen Tests wurden gelesen; ihre historischen
Testaussagen gelten nicht als heutige Abnahme. Dateien via GitHub-Diff übernommen,
da Shell-Git am Umgebungsproxy scheiterte. Kleine Integrationsänderungen:
Auto-Mount nur bei vorhandenem Demo-Root (Fitting, Station, HQ, Scanner);
Shadow-Root-Fokusermittlung (Station, Pilot, HQ, Scanner); optionale, auf
Fitting/Pilot begrenzte Stationsnavigation per Host-Callback. Bestehende
Zweiparameter-Aufrufe bleiben gültig. Keine Änderungen an Quelltests/Referenzen.

## Gemeinsame Oberfläche und redundante Stellen

Ein statischer Einstieg, eine Hauptnavigation, persistente Komponenteninstanzen.
Styles bleiben in ihren Originaldateien und werden durch Shadow DOM isoliert;
keine Kopie/Neufassung der fünf Stylesheets. Einige globale Basisregeln und
Escaping-/Fehlwert-Helfer sind in den unabhängigen Originalen redundant. Diese
lokalen Helfer jetzt zusammenzuführen wäre ein weitergehendes Refactoring.
Der Host erzeugt keine zweite Auswahlverwaltung und keinen Wirtschaftszustand.

Fitting fehlt ein eigener Update-/Destroy-Vertrag: gesonderter Host-Adapter mit
abwerfbarem Kind und dessen Listenern. Update validiert vor Austausch und setzt
Auswahl zurück. Komponentenwechsel versteckt die bestehende Instanz und behält
Auswahl, Filter und Scrollposition. Scanner-ResizeObserver wird beim finalen
Destroy getrennt. Station/HQ bleiben innerhalb des verfügbaren Host-Viewports.

## Fehlende Core-Daten

Kein Core angebunden. Benötigt werden später autoritative, revisionsgleiche
Station-/Konzern-/Pilot-/Schiff-IDs und Beziehungen, Eigentum, Aufenthaltsort,
Bestände, freie/gebundene Fracht, tatsächliche Zahlungs-/Auftragsbelege samt
Perioden/Herkunft, bestätigte Einbauten und vollständige hypothetische Fittingwerte,
übermittelte Skillfreigaben sowie Scanner-Koordinaten/Einheiten/Gefahrennachweise.
Demos bleiben unabhängig gekennzeichnet; keine Zuordnung allein nach Namen,
keine erfundene gemeinsame Firma/Flotte. Fehlwerte bleiben unbekannt, auch Ergebnis,
Finanzierung, Modulwerte oder Vorkommen. Keine Schätzung und keine neue Regel.
W5r/W5s bleiben unabhängig und vollständig unangetastet.

## Tatsächlich geprüft

- Node **22.23.4**, `node --test tests/*.test.mjs`: **13/13 Dateisubtests**, 0 Fehler/Skips.
- Zusätzlich `--experimental-test-isolation=none`: **109/109 Einzeltests**,
  davon 67 bestehende und 42 übernommene Legacy-Tests, 0 Fehler/Skips/Abbrüche.
- Übernommene Chromium-Touchtests für Station, Pilot, HQ und Scanner erneut grün
  bei **1180×820, 1024×768, 820×1180, 390×844**.
- Neuer reproduzierbarer `tests/legacy-hub-touch.py` in denselben vier Größen
  grün: Hauptnavigation, interne Reiter, Stationsverweise, Schiff-/Modul-/Skill-/
  Asteroidenauswahl, Tastaturfokus, Scroll-Erhalt, Drehung, kein Seitenüberlauf,
  sichere Fitting-Textausgabe, eingefrorene unveränderte Snapshots, Lifecycle.
  Fitting-Auswahl/Filter zusätzlich über dessen übernommene Node-Tests geprüft.
- Schmalen Hub-Screenshot visuell geprüft. Screenshots unter `/tmp/legacy-hub-*.png`
  sind lokale Prüfartefakte; kein Deployment.
- Kein Core-Script im Hub geladen, keine Speicher-/Befehlsanbindung. Damit können
  Ansichtswechsel keinen Core aufrufen; unveränderte Demo-Daten werden zusätzlich
  vor/nach Navigation verglichen. Bestehende Core-/Save-Regressionen bleiben grün.

Offen: echte iPad-Safari-/WebKit-/VoiceOver- und NAS-Abnahme; direkter Datei-Start
ist durch klassische relative Scripts vorbereitet, Browserprüfung hier per HTTP.
Keine neuen Langzeit-Wirtschaftsläufe, keine behauptete CI-Abnahme oder Veröffentlichung.

## Spätere Löschkandidaten

Nach gesonderter Produktintegration und Freigabe: die fünf isolierten HTML-Einstiege,
deren Auto-Mount-Bootstraps, doppelte Demo-Hinweise/Basisstyles und fiktiven Fixtures.
Komponenten und ihre Regressionstests weiterverwenden. Den Fitting-Host-Adapter erst
nach eigenem Komponenten-Lifecycle ersetzen. **Jetzt nichts davon löschen.**

`index.html` des Hauptspiels, Regelversion/Save-Schema, Wirtschaftsbranches,
PR #201 und seine beiden Dokumentationsdateien bleiben unverändert.
Kein Merge, kein Deployment.
