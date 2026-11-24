# M4-UX · Radikaler Spieleinstieg – Teil 1 [MAIN+PAGES], Teil 2a/2b [DRAFT]

Basis: main 53c1dfc23f61ddd9e55e28721d5179ebf205d055. Nutzerbeanstandung 23.11.2026: mehrfacher überladener Einstieg. Priorität: eine ruhige Startfläche im Used-Future-Stil (Graphit, matter Stahl, Messing, gedämpftes Türkis).

## Teil 1 – öffentlicher Einstieg

Eine primäre Aktion Wirtschaftsmanager, eine geschlossene Auswahl weiterer Spielmodi, ein Titel und ein kurzer Leitsatz. Sektorprofil, Marketingtexte und Kacheln entfallen. W0–W5 erscheint nur bei explizitem Fragmentaufruf; Original-DOM, Datenbank, Skripte und NAS-Einzeldatei bleiben unverändert. Browser ohne :has behalten den zugänglichen ursprünglichen Legacy-Bereich als Fallback. Keine Migration, keine Wirtschaftsregeln.

## Abnahme und Nachweis

Vor Commit: exakte inverse Normalisierung der alten und neuen Root-Datei gegen die unveränderte NAS-Datei sowie Strukturassertionen in der Connector-Laufzeit ausgeführt. Neue Node- und Chromium/WebKit-Browserassertionen ergänzt, noch nicht ausgeführt. Volle CI, visuelle Abnahme und neues Pages-Gate bleiben offen.

## Teil 2 – ein gemeinsames Karrieremenü (ursprünglicher Arbeitsauftrag)

Laufende PIR-Forschung #594/#596/#597 bearbeitet dieselbe Karriere-HTML, CSS und Startlogik. Nach abgestimmter Integration: genau ein sichtbares Hauptmenü auf der öffentlichen URL (direkter Übergang zur existierenden Karriere ohne vorgeschaltetes Marketingportal); Fortsetzen, Neue Karriere, Spielstand laden, weitere Modi. Keine Sektorkarten, Firmenkacheln oder technischen Erklärungen im Hauptmenü. Standardstart ohne separaten Prolog; bestehende Überschreibbestätigung, Importvalidierung, Save-Slots und explizite Forschungswahl erhalten. Neue Piratenforschung nur unter weiteren Modi. Nicht vorhandene Einstellungen nicht vortäuschen. Bestehende Akademien und Firmennamen im Spiel erhalten. Abnahme mit realen Browser-Screenshots 1024×768 und 667×375, Querformat ohne Scrollen für das geschlossene Hauptmenü, reguläre Karriere plus Wiederherstellung/Import/Opt-in und Legacy-Link; danach vollständiges AGENTS-Gate. Roadmap/Projektstatus-Abgleich mit P0 #586, nicht parallel dessen große Dokumentationsänderung überschreiben.

## Nachprüfung und UX-Nacharbeit 23.11.2026

Auf `2b87d985bd1e8098d0a2e4290a743cf1b9786600` waren JS, W5-Preflight und P1 (Chromium/WebKit) erfolgreich. [J4e-CI](https://github.com/tobiasfranziskus/Check/actions/runs/45259888724) scheiterte in beiden Engines am älteren `raum-cockpit-browser.cjs`: Jägertraining war im absichtlich geschlossenen Menü nicht direkt antippbar; vorherige Chromium-Duellmatrix 4/4 erfolgreich. Der Test öffnet nun die echte sichtbare Auswahl, keine direkte URL als Ausweichpfad. Kurzes Querformat ab 600px Breite: Titel und Menü nebeneinander, sichere Innenabstände, 48px Touchziele, zusätzlicher Browserpfad 667×375 mit Rotation. Klassische Wirtschaft erhält einen Rücklink ohne Reload und ohne Löschen/Ändern laufender Spielstände; Rückkehr klappt den Legacy-Bereich wieder aus der Ansicht. Alter und neuer Root aus unverändertem NAS-Original und jeweiligem Portal exakt rekonstruiert, inverse Transformation identisch. Neue CI und visuelle Abnahme offen; keine Änderung an der parallelen PIR-Karrieredatei. Teil 2 bleibt das abgestimmte gemeinsame Karrieremenü nach PIR-Integration.

## 24.11.2026 – Teil 1 veröffentlicht / Teil 2a

[#612](https://github.com/tobiasfranziskus/Check/pull/612) auf `main 3095df7`: 4/4 CI, 600/600 Node22, beide Browser einschließlich 667×375; [Pages](https://github.com/tobiasfranziskus/Check/actions/runs/45354786166) und [Push-CI](https://github.com/tobiasfranziskus/Check/actions/runs/45354787389) erfolgreich. Physische/ästhetische Sichtabnahme weiterhin offen.

Teil 2a: tatsächliche Karriere-Startfläche ohne Marketingkarten und Firmenprolog; sichtbare Aktion Neue Karriere ruft unverändert startNeu mit zurückgesetzter Forschungswahl auf. Alte optionale Moduswahl bleibt separat und rückkehrbar, Forschungs-Fortsetzen nur bei vorhandener Sicherung. Bestehende Bestätigungen, Slots, Import und Core bleiben unverändert. Browser-Test prüft zurückgenommene PIR-Wahl und direkten regulären Start mit 33.000 Welt-ISK. Teil 2b: öffentlicher Root direkt zum Karrieremenü, explizite Legacy-Zugänge erhalten, Forschungsfortsetzung/Wiederherstellung noch kompakter organisieren. #610 und #577 bearbeiten dieselben Dateien in anderen Funktionsbereichen; keine Übernahme fremder Forschungslogik, spätere Integration nur nach Hunk-Abgleich. Eigene CI und Screenshotabnahme für 2a offen.

## 24.11.2026 – Teil 2b [DRAFT, auf #613]

Der normale Root-Aufruf leitet relativ und mit location.replace direkt zur existierenden Karriere weiter; explizite Fragmente bleiben im unveränderten klassischen Dokument. Queryparameter bleiben erhalten. Bei deaktiviertem JavaScript bleibt das bisherige Portal als Fallback sichtbar. Weitere Spielmodi enthält nun geschlossene Wiederherstellungs- und Legacy-Gruppen (Klassische Wirtschaft, Jägertraining, frühere Konzernansicht); vorhandene IDs und Handler bleiben erhalten. Keine Änderung an spiel.js, Weltkern, Speicherformat oder NAS-Datei gegenüber Teil 2a. Root- und Quelltemplate synchron; inverse Entfernung der Pages-Hülle im Connector tatsächlich bytegleich mit aphros-void.html geprüft. Vorhandene Karriere-IDs bis auf die zwei neu eingeführten Gruppierungs-IDs identisch. Angepasste Browserpfade prüfen direkte Navigation, 667×375-Touchflächen, die vier Standardgrößen, Legacy-Rückkehr im selben Dokument und Forschungsfortsetzung über das echte Menü. Node22, Playwright, Sichtabnahme und vollständige CI noch nicht ausgeführt; echte iPad-/NAS-Abnahme offen. Separater Folgebranch von #613; kein Merge oder Pages-Deploy. Vor Integration #613 und Konflikte mit #577/#610 abgleichen.
