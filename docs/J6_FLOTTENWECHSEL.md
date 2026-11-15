# J6 – Sicherer Flottenwechsel am wirklichen Dock

**[DRAFT / 15.11.2026]** Ausgangspunkt: main 399a36ab38c1f6bf4b1b0d40f6a1254d4a52d434, Regel204-J5-Jägercockpit, integrierte finanzierte Jägerfolgeproduktion J5-W (#354). Keine Änderungen am Regel195-Hauptspiel, J4e-Cockpit, Vanilla-JS-Grafik, NAS-Einzeldatei oder Save-Format.

## Technischer Fortschritt

Das neue Modul prototypes/j4c/flotten-wechsel.js liefert die reine, in Browser und Node identische Schnittstelle:

- J6FlottenWechsel.liste(welt, zustand, aktivesSchiffId, {spielt,patrouille,duell})
- J6FlottenWechsel.pruefen(welt, zustand, aktivesSchiffId, zielSchiffId, {spielt,patrouille,duell})

Erfolg ergibt {ok:true,pilot:zielId,vorher:aktivId,station:'st_nadir',trainingsanzeigenZuruecksetzen:boolean}. Ein Fehler ergibt {ok:false,reason}. **Kein Core-Befehl, keine Pilotenbewegung, kein Konto und kein JSON-Feld werden dabei geändert.** Die Oberfläche setzt nur nach Erfolg ihre lokale, nichtpersistente Auswahl pilot=ergebnis.pilot.

Ein Wechsel ist ausschließlich möglich, wenn:

1. Ein originaler, unabhängig auditierbarer Regel204-Zustand geladen ist.
2. Beide eindeutig identifizierten Jäger house gehören und jeweils einen echten J4b-Kaufbeleg besitzen.
3. Beide Schiffe vollständig mit phase:dock, flug.lage:angedockt und gleichem realem Stationsanker angedockt sind. Kein Schiffwechsel im Raum, bei Transit, beim An- oder Abdocken.
4. Die Flugzeit angehalten ist, keine aktive Patrouille und kein aktives Trainingsduell laufen.
5. Für keines der beiden Schiffe ein noch aktiver Flugdienst bzw. eine gebundene Lohnreserve besteht.

Miner und Frachter erscheinen in der Flottenliste, sind aber in diesem Jägercockpit noch **nicht** als Cockpitschiff auswählbar. Ihre persönliche Steuerung benötigt den separaten späteren Gameplay-Schritt; es wird kein funktionsfähiges Miner- oder Frachtercockpit vorgetäuscht.

Eine beendete Trainingssession darf beim Wechsel in der **Oberfläche** ausdrücklich zurückgesetzt werden; sie ist kein persistenter Teil des Wirtschaftssaves. Der echte Weltzustand, alle Konten, Positionen und Fluglohnbelege bleiben unverändert. Das Pilotenauswahlfeld ist bisher kein eigener Core-Eigentumstatbestand: J6 implementiert einen lokalen Sichtwechsel am gemeinsamen Dock, **keinen frei beauftragbaren Pilotenwechsel über Systeme hinweg**.

## Integration mit Faibles Grafikarbeit

Damit Parallelentwicklung kollisionsarm bleibt, wurden prototypes/j4c/app.js und prototypes/j4c/index.html ausdrücklich **nicht bearbeitet**. Faible darf flotten-wechsel.js als unveränderliches API-Modul einbinden.

Minimaler Integrationsvertrag:

1. Beim Laden und für eine auswählbare Flottenliste liste(...) mit echtem World-Objekt und geladener Welt benutzen.
2. Vor Klick-Ausführung pruefen(...) mit aktuellem Zustand und aktuellen Trainings-/Play-Flags **erneut** aufrufen.
3. Nur bei ok:true die lokale Variable pilot auf die zurückgegebene, unveränderte Schiff-ID setzen.
4. Bei trainingsanzeigenZuruecksetzen:true explizit die alten, nichtpersistenten Trainingsanzeigedaten zurücksetzen. Flugzeit bleibt pausiert.
5. Keinen fiktiven Transferbefehl, keine globalen Teleports, keine neue Kasse und keine automatische Save-Migration hinzufügen.

**Bedienbare Oberfläche fehlt auf diesem Branch noch.** Der echte Zwei-Jäger-Pfad wird in tests/j6-flottenwechsel.test.mjs aus dem vorhandenen Regel204-Originalsave mit allen alten J5-W-Core-Befehlen erzeugt. Ziel dieses isolierten Drafts ist die sichere, unabhängig testbare Übergabeschnittstelle.

## Abnahmegrenzen

Node22-Tests, GitHub-CI und echte Browserprüfungen erst nach tatsächlicher Ausführung dokumentieren. Die neuen Tests prüfen Originalflotte/Negativfälle, echte vollständig bezahlte zweite Jägerhülle, beide Richtungen am Dock, Welt- und Save-Hashneutralität und Manipulationsabwehr.

Keine neuen Wirtschaftsgesetze, keine Emission, keine Spielstandänderung, kein Root-Pages-Release. Echte iPad-/NAS-Geräteabnahme offen. Die spätere Übernahme in main darf nur nach Gesamtregression, relevanten Chromium-/WebKit-Gates und Backup erfolgen.


## CI-Nachweis auf finalem Head 54538e4e · 15.11.2026

- [W5-RC1 #43686057839](https://github.com/tobiasfranziskus/Check/actions/runs/43686057839): completed/success. Vollständige Node22-Suite **250/250 Einzeltests**, Fehler 0, Skips 0, Abbrüche 0. Die vier neuen J6-Tests wurden im Joblog ausdrücklich als Tests 72–75 ausgeführt und bestanden. iPad-Touch-Preflight und NAS-Einzeldatei-Lieferprüfung ebenfalls completed/success. Der Touch-Preflight ist **kein echter iPad-Safari-Gerätetest**.
- [J4e-Browser #43686058466](https://github.com/tobiasfranziskus/Check/actions/runs/43686058466): completed/success; Root- und Beispieljäger-Nachweis sowie Chromium-/WebKit-Browserjobs abgeschlossen.
- [JavaScript-Regression #43686057849](https://github.com/tobiasfranziskus/Check/actions/runs/43686057849): completed/success; ein bedingt nicht durchgeführter Sicherheitsgeografie-Job zählt als `skipped`, nicht als bestandener Test.

**Geltungsbereich:** Die unveränderte alte J5-Cockpitoberfläche wurde im Browser regressionsgeprüft. Die J6-Flottenauswahl ist nur als reines API-Modul implementiert; ein Browser-Test ihrer noch nicht existierenden Schaltfläche ist ausdrücklich **nicht** behauptet.
