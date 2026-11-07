# Legacy-Konzernzentrale · Übernahmebericht

**[DRAFT / ANALYSE · 05.11.2026]** Separater Branch `feat/legacy-corporation-preview` gegen den über GitHub bestätigten aktuellen main [`b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c). Lokaler Checkout ist exakt dieser Stand; Shell-Fetch scheitert am nicht erreichbaren Proxy. Produkt weiterhin v0.12.5 / Regel14 / Schema8. Keine Produktintegration, kein Merge oder Deployment.

## Vorbereitung und Abgrenzung

Geprüft: `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, B5b-Testbericht, vorhandene Konzern-/Starttests und `m_ui_hq` / `m_ui_flotte_detail` auf main. Die dortige Kassen-Trendanzeige ist keine Gewinnrechnung; theoretische Stundenkosten sind keine tatsächlich gezahlten Kosten. Beides wird hier nicht als Buchungsbeleg übernommen.

Offene PRs über GitHub abgeglichen, darunter W1 #161, W5m #192, W5n #193, W5o #194, W5p #196 und W5q #197. Diese sind Forschung auf separaten Branches, kein aktueller main. Sie belegen unterschiedliche Datenumfänge, deshalb enthält die Vorschau keinen fest verdrahteten W5-Adapter. Ein expliziter W5r-PR war bei der Suche nicht auffindbar; daraus folgt keine Aussage, dass die laufende Arbeit fehlt. Hüllenverschleiß, Ersatzfinanzierung und Resilienz bleiben vollständig unabhängig und unberührt.

Die Bodies und Abgrenzungen der bestehenden Extraktionen wurden geprüft: [Fitting #186](https://github.com/tobiasfranziskus/Check/pull/186), [Station #187](https://github.com/tobiasfranziskus/Check/pull/187), [Pilotenakte #189](https://github.com/tobiasfranziskus/Check/pull/189), [Bergbauscanner #195](https://github.com/tobiasfranziskus/Check/pull/195). Der Stations-PR wurde zusätzlich mit Diff/Übernahmebericht untersucht. Keine Imports aus diesen Drafts. Keine Ausrüstung, Skills, Raumhafen-Navigation, Marktangebote, Fertigungs-/Transferbedienung oder Scanneransicht erneut extrahiert. Konzernweite Bestände und Aufträge sind lesende Controlling-Zeilen, keine zweite Stationsoberfläche.

Nur neue Dateien unter `prototypes/legacy-corporation/`, zwei eigene Testdateien und dieser Bericht. `index.html`, bestehende Tests, alle anderen Prototypen, Core, W5-Branches, Regeln, Geldmodell und Saves bleiben unverändert. Roadmap-/Statusprüfung: keine neue Priorität, Freigabe oder Main-Integration; gemäß Auftrag keine bestehenden Dokumentationsdateien geändert.

## Tatsächlich untersuchte Legacy-Quellen

Referenz: [Void Echoes am Commit a8e2e36](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36). Über den GitHub-Connector gelesen; Legacy-Repository unverändert. Die dort untersuchten Oberflächen liefern kein vollständiges Konzern-HQ mit belastbarer Gewinn-/Verlustrechnung. Das neue HQ ist eine Synthese der folgenden Darstellungsmuster, keine behauptete Eins-zu-eins-Übernahme einer bestehenden Konzernbuchhaltung.

| Datei unter `src/script/` | Befund / wiederverwendetes Muster | Ausgeschlossen |
| --- | --- | --- |
| `590-ux02-erweiterung.js` (`port02Content`, `port02Ship`, `port02MarketModel`) | Terminalbereiche, Schiffskarten, explizite Budget-/Bestandsangaben | Stationsfunktionen bleiben #187; kein Handel, Einbau oder Aktivieren |
| `340-ve10-ux03-praesentation.js` (`ux3Overview`, `ux3Filters`) | Rollen-/Filtergliederung, lokale Auswahl, Zustandsdetails | Keine Distanz-, Kampf- oder Modulberechnung |
| `160-ve08c-rollen.js` (`npcState`, `npcTrade`, `npcRoute`) | Miner-/Trader-/Kampfrollen, Tätigkeit, getrennte reale Ladung und Kasse | Kein NPC-Verhalten, Routenoptimierung, Preis-/Gebühren- oder Finanzierungsregel |
| `060-ve06-wirtschaft.js` (`economySeed`, Auftragsannahme/-abbruch/-abschluss) | Budget und tatsächliche Zahlung als getrennte Informationen | Keine Preise, Rezepte, Vergütung, Rückzahlung oder Auftragsanlage |
| `190-ve08g-01d-auftragszentrale.js` | Auftragszentrale als eigener Informationsbereich | Keine Missionserzeugung, XP oder Annahme |
| `330-ve10-ux02-ansichten.js` (`ux2Storage`, `ux2Reasons`) | Getrennte Bestände und explizite Gründe neben Angaben | Keine wiederholte Stationsextraktion, nur Controlling-Trennung und Belegspalten |
| `520-x01j-wirtschaft.js`, `680-x02b-wirtschaft.js` | Weiterentwickelte Waren-/Geldpfade; X02B enthält Produktions-/Verbrauchs-/Finanzierungsparameter | Sämtliche Formeln, Fonds, Quellen/Senken und Kreislaufregeln ausgeschlossen |

Auch `580-ux01-erweiterung.js`, `600-ux03-erweiterung.js` und `630-v3uifix01-hostansicht.js` wurden auf passende Oberflächen geprüft. Ihre Flug-/Gast-/Hostbindung wird nicht benötigt. Keine alten globalen Zustände (`S`, `me`, `act`), Monkeypatches, Inline-Handler, Netzwerk-, Speicher- oder Simulationsmechanik übernommen. Dunkle Karten, türkise Auswahl und Touch-Navigation werden eigenständig und auf `.legacy-corporation` begrenzt umgesetzt.

## Datenwahrheit und benötigte Core-Daten

API und vollständige Feldliste stehen im [README](../prototypes/legacy-corporation/README.md). `mount(root, snapshot)` kopiert validierte JSON-Daten; `update` ersetzt sie atomar; `destroy` entfernt Ansicht und Listener. Alle Inhalte kommen aus diesem Snapshot oder sind feste Oberflächenbeschriftungen. Fehlende Angaben heißen „Nicht verfügbar“, leere Listen bleiben von unbekannten Listen getrennt. HTML wird escaped.

Für spätere Integration benötigt der gemeinsame Core bzw. ein autorisierter lesender Adapter:

- Stabile Welt-, Konzern-, Schiff-, Auftrags- und Buchungsidentitäten, Sichtberechtigung, Herkunft und Stand des Snapshots. Eigene Schiffe explizit filtern; Piloten sind nicht automatisch Eigentümer.
- Frei verfügbares Kapital getrennt von Treuhand/gebundenen Mitteln, Buchungszeitraum und Herkunft des Kassenstands. Keine Kassenreserve im UI berechnen.
- Tatsächlich gezahlte Einnahmen/Ausgaben mit Gegenkonto, Beleg-ID, Zeitpunkt, Schiff-/Auftragszuordnung und Vollständigkeitsumfang. Transfers, Finanzierungen und Umsätze dürfen nicht still zusammenfallen.
- Schiffsort, Tätigkeit und Zustand nur soweit im Core vorhanden. Fehlender Verschleiß-/Reparaturbedarf bleibt unbekannt. Keine Zustandsdiagnose aus Tätigkeit oder Alter.
- Physischer Bordbestand, vertraglich gebundene und wirklich frei verfügbare Fracht mit Einheit/Eigentum. Keine Kapazität oder Verfügbarkeit aus einem anderen Wert herleiten.
- Autoritative offene/abgeschlossene Aufträge und Finanzierungsstatus inklusive Begründung. Fehlender Finanzierungsstatus bedeutet weder finanziert noch insolvent. Keine UI-Schätzung von Fehlbeträgen oder Ersatzbedarf.
- Förder- und Verkaufsbelege, Warenbestände und tatsächlich erbrachte Transportleistungen mit Menge, Einheit, Zeitraum, Route, Status, Einnahmen und Kosten. Geplante Transporte sind keine Leistung.
- Nur wenn belegbar: Unternehmensergebnis mit Zeitraum, Ergebnisumfang, vollständigem Kostenbezug und Nachweis. Vollständige Gewinne/Verluste, Abschreibungen, Ersatz-, Wartungs- und Risikokosten sind aus main nicht allgemein ableitbar. Eine fehlende Ergebniszahl bleibt leer im Vertrag und sichtbar unbekannt.

Die Demo hat fiktive Buchungen und Mengen, kennzeichnet sie dauerhaft, und lässt den Unternehmensgewinn ausdrücklich unbekannt. Es gibt keinerlei neue Wirtschaftsrechnung; auch `800 − 300` wird nicht als Gewinn ausgegeben. Datenbelege sind Texte der Quelle, kein neuer unabhängiger Finanz-Audit im UI.

## Ausgeführte Prüfung

Node **22.23.4**: `node --test tests/*.test.mjs` **9/9 Dateisubtests bestanden**. Zusätzliche Einzeltestausgabe mit `--experimental-test-isolation=none`: **78/78 Tests**, davon **67 bestehende und 11 neue**, **0 Fehler, 0 Skips, 0 Abbrüche**. Abgedeckt: gefrorener Input, 100 Updates, defensive Kopien, IDs, Klassen, freie/gebundene Fracht, fehlende/Null-/Leerwerte, keine Gewinnableitung, explizite Unterfinanzierung, sichere Texte, atomare Ablehnung ungültiger Daten/Accessoren, Lifecycle.

Reproduzierbarer Chromium-Touchtest `tests/legacy-corporation-touch.cjs`: **1180×820, 1024×768, 820×1180, 390×844 bestanden**. Statische lokale HTTP-Auslieferung, Touch-Navigation ≥48 px, Schiffsauswahl, Tastatur, Drehung, Fokus-/Scroll-Erhalt, 100 gefrorene Updates, sichere Angriffstexte, fehlende Daten, Abbau und kein horizontaler Seitenüberlauf; **keine Browserfehler**. Tabellen können innerhalb ihrer fokussierbaren Region horizontal gescrollt werden. Breite und schmale Screenshots visuell geprüft. Der lokale Server benötigte eine Ausführungsfreigabe wegen der Socket-Sandbox; keine Repository-Abhängigkeit hinzugefügt.

Lokale Tests sind keine behauptete GitHub-CI-Abnahme. Keine neue Langzeit-Wirtschaftssimulation notwendig oder behauptet; bestehende Referenzen unverändert. **Offen:** echte iPad-Safari-/WebKit- und NAS-Abnahme einschließlich Touch-Tabellenscrollen, Safe Areas und großer Datenmengen. Danach separat freigegebener Adapter aus dem gemeinsamen Core mit Beleg-/Eigentums-/Periodenvertrag, Einbettung in eine Anwendungshülle und Integrationsregressionen. W5r-Daten erst nach dessen eigenständiger Freigabe anbinden. Kein Merge oder Deployment.
