# W5ag-Spielintegration [DRAFT]

> **[DRAFT · Folgearbeit UI-Miner2D]** Dieser Bericht dokumentiert den unveränderten Ausgangsstand von #280. Die aktuelle Weiterentwicklung auf `feature/ui-miner2d-rule195` ergänzt das direkt bedienbare Core-Fördercockpit und die gemeinsame Weltkarte. [Aktueller Bericht und Grenzen](UI_MINER2D_RULE195.md); weiterhin kein Freiflug-/Dock-Core.

Separater Forschungsprototyp auf dem geprüften Head von [PR #278](https://github.com/tobiasfranziskus/Check/pull/278): `1b01d3d61e4fd18688d31493a480fc07af77e4ab`. Vorgänger #273–#277 geprüft: W5ab-Spielhub → bezahlte Überführung → Ersatzfinanzierung → Lohnmaterialkauf → Eis/Wasser → individuelle Löhne. Produktplanung: [main fd3e9154 / Roadmap](https://github.com/tobiasfranziskus/Check/blob/fd3e915448a2f35fa803db709aff9ce223dddc6f/docs/ROADMAP.md). Produkt bleibt Regel14/Schema8. Dieser Schritt verwendet ausschließlich die bereits implementierte Forschungsregel195/Schema8.

## Start und Schutz

Repository vollständig über einen beliebigen statischen HTTP(S)-Server ausliefern, dann **`prototypes/w5ag/index.html`** öffnen. Beispiel für die Entwicklung aus dem Repo: `python -m http.server 8000`, danach `http://localhost:8000/prototypes/w5ag/`. Python/Node sind keine Spielvoraussetzung; auf dem NAS genügt statische Auslieferung.

Die Welt beginnt pausiert bei Seed42/Tick0. Nur die vorhandenen Minutenknöpfe bewegen die gemeinsame Simulation. Kein Backend, Build, CDN oder Laufzeitpaket. Navigation, HQ/Station, Flottenliste, Schiffsauswahl, Mineransicht mit Drehung/Zoom, Erzaufträge, Raffinerie, Werft und Überführung bleiben erhalten. Die 2D-Mineransicht ist weiterhin eine schematische Darstellung des echten Core-Schiffs; sie enthält keine neue Flugphysik.

**Vor Reload oder Import JSON exportieren.** Reload startet eine neue Forschungswelt; kein automatisches Speichern in IndexedDB/localStorage. Export enthält den Originalzustand. Import akzeptiert ausschließlich Regel195, lädt in eine getrennte Kandidatenwelt und prüft alle Core-Audits vor dem Austausch. Fremde Profile und falsche Waren-/Lohn-/Eigentumsbelege werden abgewiesen. Der vorhandene Dateigrößen- und Revisionsschutz bleibt aktiv. JSON-Import ist kein kryptografischer Eigentumsnachweis und keine serverseitige Sicherung.

## Vollständiger Bedienweg

1. Unter **W3 – Frachter & Fracht** den Speditionsfrachter kaufen. Über den globalen Knopf einen eigenen Miner kaufen.
2. Unter **Eis, Wasser & Privatkonten** mit diesem Miner Eis fördern. **50 Minuten** vorrücken, dann global **Förderung stoppen / abrechnen**. 50 echtes Eis wurde geliefert; parallel hat der vorhandene NPC echtes Erz gefördert.
3. Unter **W3** Erzfracht starten. **60 Minuten**: 50 Erz erreicht Nadir. Der bezahlte Rückflug läuft weiter.
4. Unter **W4** Raffinerie starten, **20 Minuten**: 10 Erz → 5 Material gegen 20 ISK Werklohn.
5. Unter **W5 Schiffbau** Werftauftrag starten, **30 Minuten**: 5 Material für 500 ISK erworben, 30 ISK Werftlohn tatsächlich gezahlt, eine reale Hülle fertig. **Fertiggebauten Frachter erwerben**: separater 750-ISK-Kauf, eigenes Schiff in Nadir.
6. **10 Minuten**: erster Erzflug vollständig beendet, Erzpilot hat 120 ISK verdient.
7. Unter **Eis, Wasser & Privatkonten** Eisfracht finanzieren. **60 Minuten**, dann Wasserwerk finanzieren und **20 Minuten** vorrücken: 10 Wasser physisch produziert.
8. Konto **Erzpilot**, Menge **6**, freiwillig kaufen. Konto **Eispilot**, Menge **4**, freiwillig kaufen. Persönliche Ausgaben: 84/56 ISK; 10 Wasser wirklich verbraucht.
9. **30 + 10 Minuten**: vollständiger Eis-Rückflug beendet. Beide Piloten haben jeweils 120 echte Arbeitsminuten/ISK verdient; persönliches Guthaben **36/64 ISK**. Weltgeld **33.000 ISK**, Mint **0**.

Die gebaute zweite Hülle bleibt ohne Überführungsauftrag wirklich in Nadir. Über den erhaltenen Reiter **Bezahlte Überführung** lässt sie sich mit vollständig reserviertem 60-ISK-Fluglohn nach Aldera bringen und anschließend für neue echte Erzarbeit einsetzen. Es gibt keinen automatischen Folgeauftrag oder garantierten Käufer.

Angebote, Auftragszustände, Geldbindung, Lohnminuten und Käufe sind aus dem Core lesbar. Gesperrte Knöpfe nennen den tatsächlichen Ablehnungsgrund. Zwischen Anzeigen und Ausführung prüft der Core erneut. Beispiel: Ohne Eis sperrt die Fracht; ohne geliefertes Eis/Arbeitskapital sperrt das Wasserwerk; ohne eigenes Lohngeld oder Wasser sperrt der freiwillige Kauf.

## Aufbau und Nachweise

- Ein vorhandener W5ac-Core, unverändert gegenüber #278. Die bestehende Sitzungshülle bekommt ein explizites opt-in Profil; ihr Regel191-Standard bleibt erhalten. Alle Änderungen passieren an validierten Kopien, Vorschauen bleiben lesend.
- Legacy-Projektion und W3/W4/W5/Transferansichten lassen zusätzlich Regel195 zu. Neue Eis-/Wasser-/Privatkontenansicht ruft ausschließlich bestehende Core-Befehle und Audits auf. Keine Preis-/Reserveformel im UI.
- Anfangskapital entspricht dem bereits geprüften #278-Profil: Spedition 2.000 ISK, Nadir 4.000 ISK, globale Summe unverändert. Private Piloten starten bei 0 ISK.
- `tests/w5ag-spielintegration.test.mjs`: kompletter bezahlter Ablauf über genau die Browser-Sitzungsbefehle, Seeds42/7, deterministischer Doppelreplay, Save/Load während Rückflug, atomare Ablehnungen und gefälschte/regel-fremde Imports.
- `tests/w5ag-touch.py`: derselbe reale Ablauf über Touch, alle elf Ansichten, beide Privatkäufe, JSON-Download/Import, falsche Profile und Lohnbelege, Reload/Storage-Sentinel und Überlaufprüfung in 1180×820, 1024×768, 820×1180, 390×844.
- `tests/w5ac-touch.py`: unveränderter älterer Regel191-Ablauf mit gekauftem Schiff, bezahlter Überführung und Folgefracht.
- Eigener Workflow `.github/workflows/w5ag-integration.yml`: Node22-Gesamtregression und vier Chromium-Touchgrößen. Lokale Ergebnisse sind keine Behauptung eines bereits grünen GitHub-CI-Laufs.

## Noch fehlende Hauptspielintegration [OFFEN]

- Produktentscheidung und geprüfte Migration von Regel14 auf die ausgewählten Forschungsregeln; keine automatische Übernahme des gesamten PR-Stacks.
- Persönliche Konten mit tatsächlicher Spieler-/Pilotenzuordnung und endgültig beschlossenem Arbeits-/Eigentumsrecht. Die Umschaltung zwischen zwei Forschungspiloten ist kein Mehrbenutzer-Rechtesystem.
- Produktive Speicherhülle, kompatible Altstände, gesonderter Forschungs-Slot und Wiederaufnahme nach Reload erst nach eigenem Migrations-/Save-Schutzauftrag.
- Echte persönliche 2D-Flug-/Docksteuerung sowie Frachter-/Jägercockpit, Module und Schiffswechsel auf dem gemeinsamen Core. Hier bleibt die vorhandene schematische Mineransicht erhalten.
- Wiederkehrende rechtmäßig finanzierte Nachfrage, Ersatzflotte/Wartung und tragfähige W6-Dauerwirtschaft; keine Nachhaltigkeitsaussage aus dem einmaligen Spielablauf.
- **Echte iPad-Safari-/NAS-Abnahme offen:** Hoch-/Querformat, Touch und Bildschirmtastatur, Formulare, JSON-Download/Import, Reload und statische NAS-Auslieferung am Gerät testen. Chromium-Emulation ersetzt dies nicht.
- Kein Merge, keine Veröffentlichung, kein Pages-Eingriff. Produktive `index.html`, Versionsarchive und Wirtschaftskern wurden in diesem Integrationsdiff nicht geändert.

## Tatsächliche lokale Abnahme · 09.11.2026

- Node **v22.23.4**, vollständige Suite mit `node --test --experimental-test-isolation=none tests/*.test.mjs`: **191/191 Einzeltests bestanden, 0 Fehler, 0 Skips**, einschließlich der geerbten 13×90d-/365d-Wirtschaftsregime und der zwei neuen Sitzungstests. Keine Referenzhashes oder Wirtschaftsregeln angepasst.
- Neuer Regel195-Chromium-Touchlauf nach der letzten Anzeigeänderung: **4/4 Größen bestanden**. Älterer Regel191-Kompatibilitätslauf: ebenfalls **4/4 bestanden**, einschließlich bezahlter Überführung und echter Folgefracht.
- Erster Regressionsversuch: ein alter Fehlermeldungstest beanstandete lediglich das eingefügte Leerzeichen in „Regel 191“. Die Meldung wurde kompatibel als „Regel191“ erhalten; der Test blieb unverändert. Danach vollständige Suite erfolgreich.
- Echte iPad-Safari-/NAS-Tests **nicht ausgeführt, offen**. GitHub-CI erst nach tatsächlichem Abschluss gesondert bewerten.
- Verbindlicher unveränderter Aufruf `node --test tests/*.test.mjs` auf dem finalen Anwendungscode ebenfalls erfolgreich: **34/34 Dateigruppen**, **0 Fehler / 0 Skips**, 136,8 Sekunden. Der separate Lauf ohne Testisolation oben weist die **191 Einzeltests** aus.
