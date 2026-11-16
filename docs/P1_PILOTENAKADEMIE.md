# Pilotenakademie · Auftrag #437

**[DRAFT / NICHT MAIN]** Ausgangsbasis `main b3c3fe8e6d00994758ebd42023a84201cb3919a0`, am 16.11.2026 über GitHub und `git ls-remote` geprüft. Nach der separat integrierten Managerakademie [#438](https://github.com/tobiasfranziskus/Check/pull/438) konfliktfrei auf aktuellen `main 544961eb3f254d4198cdd07f60a4185c8c7b6df8` rebasiert. Anschließend auf den ausschließlich dokumentarisch ergänzten `main ecd855507b2da4a165e64197ba32e4c7d8a4a87d` (#439) rebasiert; Produkt- und Testdateien sind gegenüber der geprüften Managerbasis bitgleich. Piloten-Codecommit nach Rebase: `278ab94`. Keine Integration, kein Merge und kein Pages-Deployment. Dateigrenzen von [#437](https://github.com/tobiasfranziskus/Check/issues/437) eingehalten; Manager-Akademie, Hauptstartseite, Raum- und Wirtschaftskern bleiben unverändert.

## Aufrufen und lernen

Statisch `prototypes/tutorial-pilot/index.html` öffnen. Einen **eigenen Karriere-JSON-Export** ausdrücklich laden, ein rechtmäßig gekauftes Pilotenschiff wählen, eine einzelne Übung starten und im unveränderten Raumcockpit fliegen. Die Seite lädt weder Beispieldateien noch neue Anfangsschiffe. Die einzige geladene J8-Welt ersetzt keine gespeicherte Karriere. Kein Zugriff auf IndexedDB/localStorage; Fortschritt und Training bleiben flüchtig. Fluglöhne und Förderung verändern die geladene Welt tatsächlich: Vor dem Schließen freiwillig als JSON exportieren. Ungültiger Import ersetzt die geladene Welt nicht; für einen Weltwechsel zuerst exportieren und Seite neu öffnen.

Zwölf einzeln wählbare Übungen, jeweils mit Anleitung, Sperrgrund, Erfolg und erneutem Versuch:

| Übung | Originalbeleg |
| --- | --- |
| Eigenes Schiff übernehmen | Originalaudit, Eigentum, ausgewählte Pilotenschiff-ID, vorhandene Szene/Kaufprüfung |
| Abdocken | Tatsächliche 40-Sekunden-Docksequenz, freier Flug, Flugdienst und anschließende Positionsänderung per Knüppel |
| Annähern | Original-Anflugmodus und Zielgeometrie, verringerter Abstand und Erreichen des Zielbereichs |
| Sicher andocken | Übergang zum angehaltenen Körper mit Dockanker |
| Handübernahme | Beobachteter Autopilot, danach Handmodus ohne Ziel und reale Bewegung |
| Orbit | Originalziel/-radius, echte Bewegung, mindestens 30 aufeinanderfolgende Sekunden im Radiusband und mindestens 0,3 rad Umkreisung |
| Folgen | Original-Folgeabstand, bewegtes Ziel, eigene Bewegung, mindestens 30 aufeinanderfolgende Sekunden im Abstandsband |
| Aufschalten/Lösen | Original-Erfassungsfeld erscheint und verschwindet im freien Flug |
| Minerförderung | Gebundener finanzierter Nadir-Siliziumauftrag, Feldflug, gestiegener Original-Förderzähler **und** Schiffsladung |
| Frachtrundfahrt | Derselbe bereits autorisierte F4-Vertrag, Transit, Systemwechsel, Lieferung, bezahltes Vertragsende und Dockrückkehr |
| Jägerpatrouille | Bestehender J4d-Beobachter: drei Bojen, Tempo und Nadir-Dock; kein vorheriger Erfolg zählt erneut |
| Virtuelles Duell | Bestehender J4e/F8-Beobachter, eigener Anflug und neuer Trainingssieg; keine realen Schäden, Munition oder Beute |

Das Radius-/Abstandsband `max(1.200 P, 4 %)` ist nur ein Unterrichts-Abnahmekriterium, keine zusätzliche Flugregel. F4 bleibt der vorhandene Vertrags-Transit, **kein frei steuerbarer Interstationsflug**. Für den Aldera-Eis-Pendel gibt es keine erfundene persönliche Feldförderung: Die Förderlektion nennt den erforderlichen Nadir-Miner und Siliziumauftrag. Nicht verfügbare Schiffsklassen, fehlende Flugfinanzierung, bewegliche Ziele oder Trainingsmodule bleiben gesperrt. Kein automatischer Kauf oder Auftrag.

## Einhängbare Schnittstelle

`akademie.js` exportiert `PilotenAkademie` im Browser bzw. CommonJS; keine DOM-, Speicher-, Befehls- oder Uhrabhängigkeit. `menue.js` zeichnet Karten mit textContent, nativen Tasten und Fokuswiederherstellung. `seite.js` ist ausschließlich der eigenständige Import-/Cockpithost.

```js
const akademie = PilotenAkademie.erstellen({
  welt: () => session.weltReferenz(),
  zustand: () => session.zustandReferenz(),
  aktiv: () => session.pilotStatus(),
  szene: RaumSzene,
  angebot: cmd => session.flugAngebot(cmd), // rein lesendes Originalangebot
  patrouilleStand: () => J4dPatrouille.stand(patrouille),
  duellStand: () => J4eDuell.stand(duell)
});
akademie.menue();                 // Karten mit Freischaltvoraussetzungen
akademie.starten('orbit');        // nur Beobachter starten, kein Flugauftrag
akademie.beobachten(original);    // Originalzustand nach jedem Core-Schritt
akademie.stand();                 // unabhängige Kopie, keine Weltreferenz
akademie.zuruecksetzen();         // nur Unterricht, nie Welt zurücksetzen
```

Die Integration liefert **vertrauenswürdige vollständige Originalzustände** nach jeder Originalsekunde und nach Befehlen. Wiederholte Ablesung derselben Sekunde ist zulässig; Lücken, Rücksprünge und Pilotwechsel unterbrechen. Die bestehende kompakte J8-Flugprobe enthält **nicht** Flugmodus/Ziel, Ladung oder Frachtverträge und reicht allein für diese Lektionen nicht aus. Der Standalonehost ruft deshalb vorhandenes `flugSchritte(1)` und danach `zustandReferenz()` auf; J4d/J4e bekommen weiterhin ihre originalen unveränderlichen Flugproben. Das führt keine zweite Uhr ein, hat aber zusätzliche Clone-/Auditkosten. Vor Haupteinhängung gegebenenfalls einen vollständig lesenden Original-Beobachtungspunkt koordinieren; keine fehlenden Werte aus UI-Klicks erfinden. Die Original-Cockpit-HTML-Struktur ist hier kopiert; Verhalten, Grafik und Styles kommen aus den bestehenden Modulen.

## Tatsächlich ausgeführte Prüfung

- Node **22.23.4**: gezielte neue Unterrichts- und vorhandene P2-/P4-Tests **23/23**, 0 Fehler, 0 Skips. Darin neun neue Akademietests mit echten Core-Befehlen: finanzierter Miner/Frachter/Jäger, Orbit, bewegtes Folgen, kompletter Drei-Bojen-Rundflug, Originalförderung, F4-Lieferung/Rückkehr und F8-Sieg (drei virtuelle Treffer). Save/Load, unveränderter Replay-Save mit/ohne Beobachter, Weltgeld **33.000 ISK**, Mint/Burn **0**; fehlendes/fremdes Eigentum, ungültiger Kauf, Gratis-Hülle/-Vertrag, fehlendes Fördermandat und Unterfinanzierung negativ geprüft.
- Vollständiger Node22-Lauf auf Ausgangsbasis: **477/477**, 0 Fehler, 0 Skips, 446,6 s; einschließlich der ersten sieben neuen Akademietests und der kompletten unveränderten Wirtschafts-/Save-/Determinismus-/W6-Regressionssuite. Die zwei danach ergänzten Duell-/Manipulationstests sind im gezielten Lauf enthalten. Nach Rebase auf `544961e`: **31/31**, 0 Fehler, 0 Skips, mit allen neun neuen Tests, P1-Einstieg, Managerakademie und P2/P4. Die übrigen Kern-/Wirtschaftsdateien sind beim Rebase unverändert geblieben; der gesamte 477er-Lauf wurde auf der neuen Basis nicht nochmals wiederholt. Frühe Sandbox-Ausführung scheiterte bei `spawnSync git EPERM`; die vollständig erfolgreiche Wiederholung mit freigegebenem Prozess-/Netzwerkprofil ist maßgeblich.
- Chromium: neue Akademie über statisches HTTP in **1180×820, 1024×768, 820×1180, 390×844** geprüft: Dateiimport, Touchkarten, echter bezahlter Abdockflug, Knüppelziehen, Originalbewegung und Unterrichtserfolg, Touch-Zielmenü mit echtem Aufschalten/Lösen und zweitem Unterrichtserfolg, Fokus, Scroll, JSON-Export, ungültiger Import ohne Weltverlust, Breitenüberlauf und keine Seiten-JS-Fehler. Gesicherte Browserbilder: [390×844](../prototypes/tutorial-pilot/nachweise/chromium-390.png), [1180×820](../prototypes/tutorial-pilot/nachweise/chromium-1180.png); alle vier Größen zusätzlich lokal unter `/tmp/tutorial-pilot-screens/`. Die Bilder zeigen auch den absichtlich abgelehnten Import.
- WebKit: **nicht ausgeführt**. Browserbinary fehlt; Installationsversuche über Standard-CDN und Azureedge endeten mit **HTTP 403 „Domain forbidden“**. Kein grünes WebKit-Gate behauptet.
- Vorhandener `p1-spielstart-browser.cjs`: erster Chromium-Lauf **fehlgeschlagen** wegen HTTP 404 für `/favicon.ico` des bestehenden Testservers (separat über Konsolen-URL lokalisiert). Wiederholung auf aktuellem `main` mit externem Testadapter, der ausschließlich das fehlende Favicon mit HTTP 204 beantwortet: **4/4 Chromium-Größen bestanden**, einschließlich Root-/Kauf-/Speicherweg, J13B-Fracht, K2-Miner-Wiederanmeldung, W6-Opt-in, P4-Patrouillen-/F8-Duellpfad und acht Managerakademieschritten. Keine Produkt-/Testdatei oder Assertion abgeschwächt. Dieser Serveradapter ist ausdrücklich Teil der lokalen Testumgebung, keine Produktkorrektur.
- Echte iPad-Safari-/NAS-Geräte, Pages, Pinch-/Pointer-Cancel-/Hintergrund-/Orientierungswechselmatrix: **offen**. Lokales statisches HTTP ist keine NAS-Geräteabnahme. Kein Merge-/Deploy-Gate erfüllt; eigenständiger Draft zur koordinierten Integration.

Reproduzierbar: `node --test tests/*.test.mjs`; gezielt `node --test tests/tutorial-pilot-core.test.mjs tests/p2-zielsteuerung.test.mjs tests/p4-karriere-{duell,patrouille}.test.mjs`. Browser: `node tests/tutorial-pilot-browser.cjs` (standardmäßig Chromium und WebKit, Fehler werden nicht übersprungen). Optional einzelne verfügbare Engine: `TUTORIAL_BROWSERS=chromium CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/tutorial-pilot-browser.cjs`. Playwright ist ausschließlich Testwerkzeug, keine Produktabhängigkeit.
