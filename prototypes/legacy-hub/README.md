# Aphros Void · Legacy-UI-Hub

**DRAFT / UI-VORSCHAU.** `index.html` direkt öffnen oder Repository statisch
per HTTP ausliefern und `prototypes/legacy-hub/` aufrufen. Kein Build,
Framework, Backend, CDN oder Laufzeitpaket. Das Hauptspiel wird nicht geladen.

Die Hauptnavigation verbindet Konzernzentrale, Station, Fitting, Pilotenakte
und Bergbauscanner. Auf schmalen Geräten ist die Hauptnavigation horizontal
scrollbar. Fachliche Reiter bleiben innerhalb der jeweiligen Ansicht.
Auswahl und Scrollposition bleiben beim Ansichtswechsel erhalten. Die
Stations-Anschlüsse führen zu den entsprechenden Hub-Ansichten.

Alle fünf Datenquellen sind ausdrücklich fiktive, tief eingefrorene Demo-Snapshots.
Sie zeigen unterschiedliche Szenarien: Gleichnamige Orte oder Rollen stellen
**keine gemeinsame Identität** dar. Station/Schiffsauswahl bestimmt daher nicht
Fitting, Pilot oder Konzern. Es gibt keine autoritativen Beziehungen oder
Core-Daten, aus denen sich diese Zuordnung ableiten ließe. Fehlende Werte
werden ausschließlich von den bestehenden Komponenten als unbekannt ausgegeben.

`LegacyHub.mount(root, nav)` liefert `show(id)`, `getCurrent()` und idempotentes
`destroy()`. Unbekannte Routen werden ignoriert. Komponenten werden beim ersten
Aufruf gemountet, danach nur verborgen, schließlich über ihre eigene Schnittstelle
abgebaut. Der Host verwaltet nur die aktive Ansicht und Komponenten-Handles,
keine Kopie der Auswahl oder des fachlichen Zustands. Keine URL-/Save-Persistenz.

Styles werden über relative Links einmal je Shadow Root aus den Originaldateien
geladen. Kein dupliziertes Komponenten-CSS im Hub. Shadow DOM begrenzt die globalen
Selektoren der ursprünglichen Demos. Kleine Höhenregeln passen Stations-/HQ-Viewport
an den Host an; Fokusermittlung der Komponenten berücksichtigt den Shadow Root.

Fitting besitzt lediglich `mount`. `LegacyHub.fittingMount` ergänzt `update` durch
validierten Neuaufbau und `destroy` durch Entfernen des Listener-besitzenden Kindes.
Ein explizites Update setzt hier die Auswahl zurück; normales Navigieren tut dies
nicht. Keine anonymen Listener auf einem dauerhaft wiederverwendeten Root sammeln.

Prüfung (Entwicklungswerkzeuge, nicht Teil der Auslieferung):

```sh
node --test tests/*.test.mjs
node --test --experimental-test-isolation=none tests/*.test.mjs
python3 tests/legacy-hub-touch.py
```

Node 22 verwenden. Browserprüfung benötigt extern installiertes Python-Playwright
und Chromium (`/usr/bin/chromium`), startet nur einen temporären Loopback-Server.
Kein Paketmanifest oder Abhängigkeit für die Vorschau erforderlich.

[Integrationsbericht](../../docs/LEGACY_HUB_INTEGRATION.md).

## W5t: eigener lesender Core-Einstieg

`core-preview.html` zeigt zunächst keine Welt. Eine explizit ausgewählte Core-JSON
und eine vorhandene Eigentümer-ID laden HQ/Station aus **einem** Snapshot.
Unterstützt: der validierte W5s-c/R32-State (Schema 8), kein Save-Hüllenformat.
Alte Saves zuerst separat mit dem passenden Core laden; der Adapter migriert nicht.
Keine Speicherung, kein Spielstart, kein automatischer Tick, kein Netzwerkabruf.
Die drei übrigen Ansichten bleiben eigene gekennzeichnete Demos.

[Vertrag, Grenzen und Prüfnachweis W5t](../../docs/W5T_CORE_ADAPTER.md).
