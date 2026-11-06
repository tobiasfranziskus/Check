# W5t – lesender Core-Adapter [DRAFT / ANALYSE]

Basis: [#203](https://github.com/tobiasfranziskus/Check/pull/203),
`afc2a612ec2bb7f3396e91f63cfaeb66274a3bf5`, Zielbranch `codex/legacy-ui-hub`.
Geprüfter main: `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`.
Ausschließlich lesende Referenz: [#205](https://github.com/tobiasfranziskus/Check/pull/205),
`18667e6d570086cd6bb6a18f7c91179115b413e7` (Schema 8 / Regel 32).
Kein Merge dieser Forschung in den UI-Branch; keine produktive Core-Integration.

## Geprüfter Stack und CI

Offene PRs am 06.11.2026: #161, #164–171, #173, #175–176, #178–198,
#200–205, soweit tatsächlich vorhanden (#177 und #199 nicht in der offenen Liste).
W5s-c stapelt auf #204 → #202 → #200; der Hub #203 liegt auf main.
#201 betrifft ausschließlich ROADMAP/PROJEKTSTATUS auf dem Wirtschaftsstack.
Deren Dateien werden gemäß ausdrücklicher Auftragsgrenze nicht verändert;
Roadmap und Projektstatus wurden gelesen. Dieser Bericht dokumentiert nur den
neuen Draft-Integrationsstand und ersetzt keine Produktplanung.

Historische CI wurde per GitHub geprüft: #203
[42120799883](https://github.com/tobiasfranziskus/Check/actions/runs/42120799883)
erfolgreich; #205 Standardregression
[42171938457](https://github.com/tobiasfranziskus/Check/actions/runs/42171938457),
W5s-a 42171938425, W5s-b 42171938266 und W5s-c 42171938467 jeweils erfolgreich.
Für main liefert die PR-gefilterte Workflow-Abfrage keinen Lauf; daraus folgt
keine Aussage über Push-CI. Neue W5t-CI separat am PR prüfen.

## Vertrag W5t/1

`LegacyCoreAdapter.project(coreStateOrJSON, {ownerId})` ist synchron, DOM-frei,
rein lesend und ohne Core-Aufruf. CommonJS für Node, klassisches Script für
statische Browserauslieferung. Der Aufrufer übergibt **einen vollständigen,
zuvor vom passenden Core validierten Zustand**, keine Save-Hülle, UI-Daten oder
zusammengeführten Teilsnapshots. JSON-Import ist eine Entwickler-Vorschau und
kein Ersatz für die vollständige Core-Ladevalidierung.

Der Adapter prüft Schema/Regel, reine JSON-Daten ohne Getter-Ausführung,
Tabellen-IDs, vorhandene Eigentümer und referenzierte Schiffe/Standorte.
Falsche IDs werden abgelehnt; fehlende Tabellen und Daten bleiben `null`.
Unbekannte Eigentümerauswahl wird abgelehnt. Keine Namensverknüpfung,
Migration, Preisformel, Reservenberechnung, Auftragsentscheidung oder Buchung.
Die Ausgabe ist vollständig abgetrennt und tief eingefroren. Tabellen werden
nach IDs sortiert, damit Core-State, kanonisches Save und geladenes Save dieselbe
Projektion ergeben. Arrays sind UI-Projektionen, kein zweiter Spielzustand.

Rückgabe: `contract`, `tick`, `ownerId`, `corporation`, `station`, `accounts`,
`freightOrders`, `financialEvidence`, `missing`.
`LegacyHub.mount(root, nav, bundle)` nimmt optional dieses **eine Adapter-Bundle**;
`update(bundle)` ersetzt synchron HQ und Station einschließlich noch nicht
geöffneter Ansichten. Niemals separate HQ-/Stations-Snapshots übergeben.
`show/getCurrent/destroy` sowie Komponenten-`mount/update/destroy` bleiben erhalten.
Navigation erhält Instanzen und Auswahl; nach Update gleichen Komponenten eine
nicht mehr vorhandene Auswahl nach ihrem bisherigen Vertrag ab.

| Quelle im selben Core-State | Projektion / Grenze |
| --- | --- |
| `owners[id].cash` | ISK-Kontostand; explizite Beschriftung, kein freies Kapital oder konsolidiertes Konzernvermögen |
| `stats.konto[id].erloes/kosten` | Kumulierte Core-Zähler, keine Vollkosten, kein eigener Gewinn; Zeitabdeckung unbekannt |
| `ships[id].owner` | Flotte exakt nach Eigentümer-ID; keine Zusammenlegung von Spieler, NPC oder Treuhandkonten |
| `ships[id].system/phase/auftrag` | Standort und Tätigkeit; Hangar nur `dock` plus `systems[system].station` |
| `ships[id].ladung` | Physische Bordbestände; Eigentum, freie Verfügbarkeit, Kapazität und Belegungssumme unbekannt |
| `stations[id].lager/eigentum` | Physische Stationsbestände und ausdrücklich vorhandenes Eigentum; niemals aus gleichnamigem Konto ableiten |
| `w3.auftrag`, `w5n.frachtauftrag` | Aktive Slots mit Originalinhalt, Schiffs-ID, Phase, Mengen und gespeicherten Finanzwerten; keine dauerhafte Auftrags-ID vorhanden |
| `ereignisse`, `stats.konto` | Unveränderte finanzielle Rohbelege im Bundle; Ereignistext wird nicht als vollständige Buchung interpretiert |

Auftrags-Zeilen-ID ist ausschließlich der Quellpfad (`w3.auftrag` bzw.
`w5n.frachtauftrag`), **keine erfundene Core-Auftragsidentität**. Es werden weder
abgeschlossene Aufträge aus Zählern rekonstruiert noch gespeicherte Finanzierung
neu bewertet. HQ zeigt aktive eigene Auftrags-Slots, ihr historischer Abschlussstatus
und Finanzierung bleiben unbekannt. Stations-Auftragstafel bleibt unbekannt:
Autoritative Auftraggeber-/Stationsbindungen fehlen im allgemeinen Slotvertrag.
Alle aktiven Frachten bleiben im Bundle lesbar. Produktions-/Verkaufs-/Transport-
Vollkostenlisten, Marktangebote und Journal werden nicht aus Summen erfunden.

Null-Eigentum ist unbekannt, nicht neutral oder spielereigen. Konzerninventar bleibt
unbekannt, solange Stationsbestände nicht eindeutig zugeordnet werden können.
Ein fehlendes Feld bedeutet `null`; echte `0` bleibt `0`, eine nachweislich leere
Liste bleibt leer. Die Komponenten zeigen `null` als „Nicht verfügbar“.

## Vorschau und spätere Integration

1. Repository statisch ausliefern, `prototypes/legacy-hub/core-preview.html` öffnen.
2. Core-Export aus dem gepinnten Forschungs-Core verwenden; außerhalb dieser
   Vorschau über dessen `loadW5R` validieren. Im Test liegt ein unveränderter
   `api.save(api.createW5RState(42,'full','npc3'))` unter
   `tests/fixtures/w5t/r32-seed42.json`. Kein synthetischer Wirtschaftszustand.
3. Datei und vorhandene Eigentümer-ID wählen (`transport`, `npc3`, `house` usw.).
   Vor Import ist keine Welt gemountet. HQ/Station beziehen dasselbe Bundle.
   Ungültige Imports lassen die bisherige Ansicht unverändert. Bei mehreren
   überlappenden Datei-Lesevorgängen gilt ausschließlich die jüngste Anfrage.
4. Fitting/Pilotenakte/Scanner bleiben unabhängige, ausdrücklich bezeichnete
   Demo-Snapshots; Stationswahl erzeugt keine Core-Verknüpfung zu ihnen.
5. Später eine autorisierte Host-Schnittstelle bereitstellen, die nach erfolgreichem
   Core-Laden einen vollständigen Snapshot an `project` übergibt und ein gesamtes
   Bundle per `update` verteilt. Keine Core-Befehle aus diesem Adapter ergänzen.
6. Zuerst autoritative Journal-, Auftrags-, Inventareigentums- und Reservenverträge
   mit Core-Pfaden/Zeitraum definieren, dann die betreffenden unbekannten UI-Felder
   befüllen. Noch kein Umbau des Hauptspiels oder Save-Schemas beauftragt.

| Ansicht | Noch fehlender autoritativer UI-Vertrag |
| --- | --- |
| Fitting | vollständige Slot-/Modulinstanz-IDs, belegte Einbauten, Kompatibilität, Werte/Schiffsklassen und hypothetische Vergleichswerte; vorhandene W5m/W5f-Teilinformationen reichen nicht für den Demo-Vertrag |
| Pilotenakte | dauerhafte Pilot-ID, Person↔Schiff↔Arbeitsvertrag, Skills, Level/Freigaben und Trainingszustand; Konten oder einzelne XP-Zähler ersetzen keine Akte |
| Scanner | Scanmessungen mit Zeit/Quelle, Kontakte, Positionen/Einheiten, Reichweite, Ressourcen- und Gefahrennachweise; keine Vorkommen aus Lagerbeständen ableiten |

## Prüfnachweis

Node **22.23.4**: Pflichtbefehl `node --test tests/*.test.mjs` **14/14 Dateisubtests**;
zusätzlich `node --test --experimental-test-isolation=none tests/*.test.mjs`
**115/115 Einzeltests**, keine Fehler, Abbrüche oder Skips (109 bestehende, 6 neue).
Neue Tests: fehlende Werte/echte Null, falsche IDs und Referenzen, Eigentumsgrenzen,
Reiseschiffe, Frachtslots, Unveränderlichkeit und JSON-Lesbarkeit.

Echte Core-Save/Load-Gegenprobe ohne kopierten Core im Produkt:

```sh
git show 18667e6d570086cd6bb6a18f7c91179115b413e7:index.html > /tmp/w5t-core.html
node tools/w5t-reference-check.mjs /tmp/w5t-core.html
```

Seeds42/7 je vier Prüfpunkte, anschließend je eine tatsächlich bezahlte Bau-/
Überführungs-/Doppel-Frachtsequenz aus #205: Tick391, zwei verschiedene Frachter.
State-/Save-/Load-Projektionen identisch, Originalsave unverändert, Core-Audit grün.
Keine neue 13×90d-/365d-Wirtschaftsfreigabe aus diesen kurzen Lesetests.

Chromium-Touch bei **1180×820, 1024×768, 820×1180, 390×844**:
`tests/legacy-hub-touch.py` und `tests/w5t-core-touch.py` erfolgreich; Import,
Navigation aller fünf Ansichten, interne Reiter, Eigentümerwechsel, falsche IDs,
Rotation, kein horizontaler Seitenüberlauf und Destroy. Bestehende Einzelbrowser-
Regressionen für Station, HQ, Pilot und Scanner ebenfalls erneut ausgeführt.
Browserwerkzeuge sind externe Entwicklungswerkzeuge, keine neue Laufzeitpflicht.
**Echte Safari-/iPad-/NAS-Abnahme bleibt offen.** Kein Deployment.

## Dateiumfang und Integrationsgrenze

Neu: Adapter, Core-HTML/-CSS/-Bootstrap, sechs Node-Tests samt realer Save-Fixture,
Core-Touchtest, Referenz-Prüfwerkzeug und dieser Bericht.
Geändert: Hub nur um optionales Bundle/Update und getrennten Bootstrap erweitert;
HQ um optionale escaped Kapitalbeschriftung (Demo-Standard unverändert), Hub-README.
Bestehende Demos, Komponentenverträge und Testdateien erhalten.
Produktive `index.html`, main, W5s/Core/Preise/Schiffe/Regeln/Save-Schema,
#201 und dessen Dokumentationsdateien unverändert. Genau ein Draft gegen #203;
kein Merge und kein Deployment.
