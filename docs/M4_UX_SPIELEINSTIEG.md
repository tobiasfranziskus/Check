# M4-UX · Radikaler Spieleinstieg – Teil 1 [DRAFT]

Basis: main 53c1dfc23f61ddd9e55e28721d5179ebf205d055. Nutzerbeanstandung 23.11.2026: mehrfacher überladener Einstieg. Priorität: eine ruhige Startfläche im Used-Future-Stil (Graphit, matter Stahl, Messing, gedämpftes Türkis).

## Teil 1 – öffentlicher Einstieg

Eine primäre Aktion Wirtschaftsmanager, eine geschlossene Auswahl weiterer Spielmodi, ein Titel und ein kurzer Leitsatz. Sektorprofil, Marketingtexte und Kacheln entfallen. W0–W5 erscheint nur bei explizitem Fragmentaufruf; Original-DOM, Datenbank, Skripte und NAS-Einzeldatei bleiben unverändert. Browser ohne :has behalten den zugänglichen ursprünglichen Legacy-Bereich als Fallback. Keine Migration, keine Wirtschaftsregeln.

## Abnahme und Nachweis

Vor Commit: exakte inverse Normalisierung der alten und neuen Root-Datei gegen die unveränderte NAS-Datei sowie Strukturassertionen in der Connector-Laufzeit ausgeführt. Neue Node- und Chromium/WebKit-Browserassertionen ergänzt, noch nicht ausgeführt. Volle CI, visuelle Abnahme und neues Pages-Gate bleiben offen.

## Teil 2 – ein gemeinsames Karrieremenü (noch nicht implementiert)

Laufende PIR-Forschung #594/#596/#597 bearbeitet dieselbe Karriere-HTML, CSS und Startlogik. Nach abgestimmter Integration: genau ein sichtbares Hauptmenü auf der öffentlichen URL (direkter Übergang zur existierenden Karriere ohne vorgeschaltetes Marketingportal); Fortsetzen, Neue Karriere, Spielstand laden, weitere Modi. Keine Sektorkarten, Firmenkacheln oder technischen Erklärungen im Hauptmenü. Standardstart ohne separaten Prolog; bestehende Überschreibbestätigung, Importvalidierung, Save-Slots und explizite Forschungswahl erhalten. Neue Piratenforschung nur unter weiteren Modi. Nicht vorhandene Einstellungen nicht vortäuschen. Bestehende Akademien und Firmennamen im Spiel erhalten. Abnahme mit realen Browser-Screenshots 1024×768 und 667×375, Querformat ohne Scrollen für das geschlossene Hauptmenü, reguläre Karriere plus Wiederherstellung/Import/Opt-in und Legacy-Link; danach vollständiges AGENTS-Gate. Roadmap/Projektstatus-Abgleich mit P0 #586, nicht parallel dessen große Dokumentationsänderung überschreiben.
