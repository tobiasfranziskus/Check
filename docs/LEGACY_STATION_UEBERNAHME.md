# Legacy-Station: Übernahme der Darstellung

**[DRAFT / ANALYSE · 05.11.2026]** Eigenständige UI-Vorschau auf Basis des aktuell per GitHub geprüften `main` [`b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c), Branch `feat/legacy-station-preview`. Keine Produktintegration oder Änderung von Regel 14 / Schema 8 / v0.12.5. Ausschließlich neue Dateien im Prototyp, passende neue Tests und dieser Bericht. Roadmap und Projektstatus bleiben gemäß enger Auftragsgrenze unverändert; Phase-B-Priorität und bestehende Integrationsgates gelten weiter.

## Quellen und Vergleich

Verbindlich geprüft: [AGENTS.md](../AGENTS.md), [ROADMAP.md](ROADMAP.md), [PROJEKTSTATUS.md](PROJEKTSTATUS.md), bestehender Start-/UI-Testcode und [B5b-Testbericht](TEST_B5B_SOLLFLOTTENZUORDNUNG.md). Historische Statusabschnitte sind keine Aussage über aktuelle Branch-Integration. `main` wurde über den GitHub-Connector bestätigt; lokales `git fetch` scheiterte am nicht erreichbaren Shell-Proxy. Der bereits vorhandene Checkout hat exakt denselben SHA; kein anderer Branch wurde importiert.

Legacy-Referenz ist ausschließlich [Void Echoes, a8e2e36](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36). Quelltexte und sämtliche 21 Golden-JSONs wurden über GitHub gelesen; die Goldenwerte bleiben unverändert im alten Repository. Es sind serialisierte DOM-/Zustandsreferenzen, keine visuellen Pixelreferenzen.

| Quelle am Legacy-Commit | Befund | Übernahme / Abgrenzung |
| --- | --- | --- |
| [590-ux02-erweiterung.js](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/590-ux02-erweiterung.js) | Wirksame `port02`-Shell: Kopf, feste Navigation, Inhalts-Scrollbereich, Übersichtskacheln, Schiffskarten | Neu implementierte Shell und Karten; kein `S`, `me`, `PORT02`, Monkeypatching von `ui`, Inline-Handler oder `act` |
| [040-style-ux02-station.css](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/head/040-style-ux02-station.css) | Dunkles Terminal, türkise Auswahl, Seitenleiste quer, Navigation oben hoch, getrenntes Scrollen, Safe Areas, Fokusmarkierung | Auf `.legacy-station` begrenzte Komponentenregeln; kleine Ansichten mit mehrzeiliger sichtbarer Navigation statt horizontal versteckter Bereiche |
| [320-ve10-ux01-navigation.js](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/320-ve10-ux01-navigation.js) | Dienste gruppiert, Stationsstart als Rückweg, lesbare aktive Navigation und Fokus | Feste Bereichsnavigation plus Übersichtskacheln; keine modalen Alt-Panels, globale Click-Abfanglogik oder Focus-Trap |
| [330-ve10-ux02-ansichten.js](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36/src/script/330-ve10-ux02-ansichten.js) | Lokale Anzeigeauswahl, Lager/Fracht explizit getrennt, Material-/Produktionswege und Sperrgründe sichtbar | Separate Lager- und Frachttabellen, Industriewege mit geliefertem Status; keine Rezepte, Quoten, Preis-/Kosten-/Kapazitätsformeln oder Auftragserzeugung |
| [test-station-render.cjs und Golden-Verzeichnis](https://github.com/tobiasfranziskus/void-echoes/tree/a8e2e36/tests/station-render) | Zehn Ansichten, Erstaufruf, Gast, leer/volle Fracht, geringe/ausreichende ISK, Änderungsrendering, kein Dock, Cache/Busy-Guards | Charakterisierung als Informationsarchitektur-Vergleich; neue Tests prüfen den neuen lesenden Vertrag, keine bytegleiche Kopie der alten HTML-Ausgabe |

Die 21 Goldenfälle umfassen `ansicht-{home,market,refinery,production,industry,shipyard,modules,missions,storage,loot}`, `erster-aufruf`, `gast-{home,market}`, `fracht-{leer,voll}-{market,storage}`, `markt-isk-{fehlt,reicht}`, `nach-aenderung` und `nicht-angedockt`. Home zeigt Dienstekacheln; Shipyard verbindet Karten mit Kauf/Aktivierung; Storage trennt Bestände mit Transferaktionen; Industry zeigt Materialketten; Missions führt zur gemeinsamen Auftragszentrale. Übernommen wird jeweils die Orientierung, nicht die Aktion. Modules und Loot bleiben außerhalb dieser Extraktion. ISK-/Kapazitätsrandfälle werden hier zu fehlenden oder explizit gelieferten Daten, ohne eine eigene Handelsfreigabe zu berechnen. Der alte Nicht-Dock-Fall unterdrückt Rendering; die neue Vorschau zeigt unabhängig von einem echten Spielerstandort den gewählten Snapshot. Cache und Busy-Zeiten sind keine importierten globalen Zustände.

[Legacy-Fitting PR #186](https://github.com/tobiasfranziskus/Check/pull/186) wurde lesend geprüft (Draft-Head `d744d3a4`). Sieben Slots, Alternativen, Modulvergleich und Vorher/Nachher bleiben dort. Hier gibt es nur einen erklärenden Anschlussbereich; keine Imports, duplizierten Module, Einbauvorschau oder Abhängigkeit von dessen Branch. W5i/W5j bleiben unberührt.

## Bewusst ausgeschlossene Mechaniken

Keine Käufe/Verkäufe, Schiffaktivierung, Abdock-/Flugaktionen, automatische Reparaturen oder Einlagerung, Transfers, Produktion, Rezeptauflösung, Gebühren-/Preis-/Geldberechnung, Finanzierung, Belohnungen, Versicherung, Inventarerzeugung oder Save-/Load-Zugriffe. Kein IndexedDB, Web Storage, Fetch, Timer, Core-Import, RNG oder alte globale Spielzustände. UI-Navigation ändert ausschließlich lokalen Auswahlzustand. Die Vorschau importiert keine Werte aus Void Echoes als Aphros-Void-Regeln.

Die Demo benennt alle Daten ausdrücklich als fiktiv. Geld, Preise, Produktionsmengen und Kapazitäten sind absichtlich nicht mit erfundenen Zahlen gefüllt. Die explizite Null bei der Demo-Miner-Fracht ist nur ein UI-Beispiel. Fehlende Angaben, `null`, leere Texte und nicht skalare Tabellenwerte erscheinen als **„Nicht verfügbar“**. Eine explizite leere Liste lautet „Keine Einträge im Snapshot“; unbekannt ist nicht null Einträge oder Nullbestand.

## Lesender Vertrag

```js
const view = LegacyStation.mount(root, snapshot);
view.update(nextSnapshot); // vollständiger Ersatz, keine Mutation/Commands
view.getSelection();      // {stationId, shipId, tab}, defensive Kopie
view.destroy();           // Listener und Ansicht entfernen
```

Die Wurzel trägt `class="legacy-station"`. Der Vertrag enthält reine JSON-Daten, keine Callbacks, HTML, DOM-Objekte, `undefined`, nicht endliche Zahlen oder Zyklen. Input wird vor Verwendung validiert und tief per JSON kopiert. Ein ungültiges Update lässt den letzten gültigen Snapshot stehen. Stationen und Schiffe benötigen eindeutige, nicht leere String-IDs (Schiff-IDs innerhalb einer Station); Anzeigenamen sind keine Identität. Keine Auswahl wird gespeichert oder an einen Befehlskanal gemeldet. Eine Instanz je Wurzel; vor Neumontage `destroy()` aufrufen.

| Snapshot-Pfad | Erwartete Darstellung |
| --- | --- |
| `provenance` | Herkunft/Beispielkennzeichnung als Text |
| `stations[]: {id, name}` | Wählbare Stationsansichten; fehlt die Liste, unbekannte Station |
| `stations[].ships[]: {id, name, role, owner, pilot, status, cargoUsed, cargoCapacity}` | Schiffsauswahl und getrennte Stammdaten; keine Aktivierung oder Eigentumsableitung |
| `stations[].ships[].cargo[]`, `stations[].storage[]: {name, quantity, owner}` | Getrennte Bestände; keinerlei Transfer |
| `stations[].industry[]: {name, input, output, status}` | Vom Adapter formulierte Material-/Ausgabetexte und Status/Sperrgründe |
| `stations[].market[]: {name, stock, buyPrice, sellPrice, fee}` | Lesende Angebote; Preise/Gebühren mit Einheiten als formatierter Text vom Core-Adapter, keine Rechnung |
| `stations[].orders[]: {name, issuer, status, funding}` | Auftragstafel mit getrenntem Finanzierungsnachweis; keine Annahme |

Skalare Anzeigen sind Strings oder endliche Zahlen; Einheiten und Summen liefert der Adapter. Fehlende Listen bleiben unbekannt. Gleichnamige Schiffe bleiben durch IDs unterscheidbar. Updates erhalten gültige IDs, Tab, Inhaltsscrollposition und fokussiertes Navigations-/Auswahlelement; entfallene IDs fallen auf den ersten vorhandenen Eintrag zurück, andernfalls `null`. Stationswechsel setzt die Schiffsauswahl auf den ersten Eintrag, erhält aber den Bereich. Bereichswechsel beginnt oben im Inhaltsbereich. Keine Tick-Schleife und keine Simulation in der Ansicht.

## Spätere Integrationsbedingungen

Ein zukünftiger W5-Adapter darf einen Snapshot aus der Forschungswelt projizieren und muss Herkunft, Welt-/Stations-/Schiff-Identitäten, Aktualität und Sichtberechtigung eindeutig bestimmen. Ein gemeinsamer Core bleibt einzige Autorität für Eigentümer, Pilot, Auftraggeber, Kontoinhaber, Warenherkunft, frei verfügbare/gebundene Finanzierung und sämtliche Befehle. Ein ausgewähltes Schiff bedeutet weder Eigentum noch Steuerungsberechtigung. Keine Annahme, dass angezeigte Finanzierung noch ausführbar ist.

Fitting kann später über eine gemeinsame Anwendungshülle und denselben ID-Kontext geöffnet werden; diese Vorschau enthält dafür keine URL auf einen Draft und keine zweite Modulimplementierung. Vor wirtschaftlicher Integration: freigegebener gemeinsamer Snapshot-/Command-Vertrag, erneute Core-Validierung bei Ausführung, deterministische Replays, Geld-/Warenaudit, Finanzierung für Spieler und NPC, Save-/Migrationsschutz sowie Forschungswelt-/Fitting-Kompatibilität belegen. Diese Darstellung entscheidet keine offenen Produktregeln.

## Testnachweise und offene Abnahme

Node **22.23.4**, Pflichtbefehl `node --test tests/*.test.mjs`: **9/9 Dateisuiten bestanden**, 0 Fehler/Skip/Abbruch. Zusätzlich direkte Ausführung der einzelnen Testdateien: **75/75 Einzeltests**, davon **67 bestehende und 8 neue**, 0 Fehler/Skip/Abbruch. Die neuen Tests prüfen tief gefrorene Inputs, defensive Kopien, unabhängige Instanzen, IDs/Navigation/Stationswechsel, Update/Fallback, sichere Textausgabe, fehlende Daten versus Null/Leerlisten, ungültige atomare Updates und Abbau.

Chromium mit Touch-Emulation, lokale HTTP-Auslieferung: **1180×820, 1024×768, 820×1180 und 390×844 bestanden**. Reproduzierbares Skript: `tests/legacy-station-touch.cjs`; extern vorhandenes Playwright ausschließlich als Entwicklungswerkzeug, keine neue Laufzeitabhängigkeit. Geprüft: alle sieben sichtbaren Navigationsflächen ≥48 px hoch und ≥44 px breit, Tabwechsel, Schiffsauswahl, Stationswechsel, Update/Fokus, sicherer DOM-Text, unveränderter eingefrorener Input, Rückkehr zum Inhaltsanfang und kein horizontaler Seitenüberlauf. Bildnachweise wurden lokal erzeugt und geprüft, nicht als produktive Goldenreferenzen eingeführt. Das lokale Listen-Socket benötigte die Ausführungsfreigabe außerhalb der Sandbox.

**Offen:** echte iPad-Safari-Abnahme mit Quer-/Hochformat, Safe Areas, Touchscrollen und Tastatur, statische NAS-Auslieferung, WebKit-Test sowie spätere Core-/W5-/Fitting-Integration. Keine neuen Langzeit-Wirtschaftssimulationen; bestehende Regressionen einschließlich gespeicherter Referenzen liefen unverändert. Kein Merge, Deployment oder Eingriff in vorhandene Spielstände.

Start und Testaufrufe: [README der Vorschau](../prototypes/legacy-station/README.md).
