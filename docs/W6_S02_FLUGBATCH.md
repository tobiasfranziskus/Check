# W6-S02 – Flugbatch-Kostenpfad (getrennter Forschungs-Draft)

**[ANALYSE / NICHT MAIN] · 15.11.2026.** Basis ist der vollständige S02-Nachweis [#389](https://github.com/tobiasfranziskus/Check/pull/389) mit dessen unverändertem Wirtschafts- und Flugsimulationskern. Dieser Branch schlägt **ausschließlich eine Ablaufoptimierung** vor; die NPC-Politik, Ersatzrücklage, Werftreserve und Emissionsregel bleiben ausdrücklich [OPTION].

## Beobachteter Engpass und begrenzter Eingriff

#389 protokolliert unveränderte, legale S02-Saves mit 190/382/760 historischen Hüllen an Tag 180/365/730. Die beobachteten CPU-Mediane betragen 1,105/2,090/4,077 Sekunden je Spieltag. Bei aktivem Flug ruft `welt.minute()` bis zu 60 Sekunden-Integrationen für eine Wirtschaftsminute auf. `flug-kern.schritt()` sortierte bisher **in jedem Flugschritt** sämtliche historischen Schiffs-IDs neu, obwohl der `wirtschaftsMinute()`-Tick (der neue Schiffe kaufen/bauen kann) erst **nach dem 60. Schritt** beginnt. Die Forschungsautomatik kann während der Teilschritte Flug-/Förderaufträge auslösen, aber keine neue Hülle schaffen.

Änderung:
- Ein originaler Aufruf von `welt.teilschritt()` bleibt unverändert und sortiert/prueft alle IDs wie bisher bei **jedem** isolierten Schritt.
- `welt.minute()` reicht einer **internen** Teilschritt-Funktion einmalig die sortierten IDs derjenigen Hüllen, die sich bewegen oder durch einen bestehenden Pendelauftrag **noch in derselben Minute** am Dock abdocken können. Die ID-Reihenfolge aller tatsächlich verarbeiteten Hüllen bleibt **unverändert**. Historische, angedockte, nicht disponierte Hüllen wurden vorher 60-mal nutzlos geprüft; im Batch werden sie übersprungen. Der nächste Minutenaufruf, auch nach Save/Load oder nach Kauf, ermittelt erneut die Kandidaten.
- Die `FLUG.schritt`-Signatur hat nur einen optionalen internen dritten Parameter; die bisherige Form funktioniert weiter. Keine Änderung an Bewegung, Dockzuständen, Kassen, Waren, Geschäften, Wirtschaftspolitik, Parametern oder Serialisierung.

Dies entfernt wiederholtes ID-**Sortieren und Scannen historisch stillliegender Hüllen** im aktiven Minutenflug. Vollständige Flottenabfragen außerhalb des Flug-Batchs (insbesondere bei NPC-Disposition, Audits und beim Aufbau der Kandidatenliste je Minute) bleiben bestehen. **In der originalen Flugplanung werden während einer Minute ausschließlich bestehende Pendel-IDs disponiert; neue Hüllen und Pendel entstehen erst im nachfolgenden Wirtschafts-Tick.** Ein Gesamtspeedup ist vor echten Messungen **nicht behauptet**.

## Nachweis und Abnahme

- `tests/w6-flugbatch-determinismus.test.mjs`: schneller Minutenaufruf gegen 60 unabhängige Original-`teilschritt()`-Aufrufe über 240 Minuten, begonnenes Flugsegment (17/43 Schritte), historische Stillstandshüllen, neue **originalfinanzierte** Miner-Hülle zwischen Minuten, Save/Load, vollständige kanonische Weltgleichheit, Hash und unabhängiges Geld-/Waren-/Eigentumsaudit.
- Die bestehenden unveränderten 13×90-Szenarien und alle weiteren Node22-Regressionen müssen auf diesem Branch neu ausgeführt werden. Freiflug-/F4-/Kern-Referenzhashes dürfen **nicht** angepasst werden. Bis zur Ausführung gibt es **keinen Test-Erfolgsvermerk**.
- Neuer **optionaler** `tools/w6-flugbatch-benchmark.cjs`: akzeptiert ausschließlich die tatsächlichen auditierbaren S02-Checkpoint-Saves, prüft bei 3 Wiederholungen mit je 180 Minuten denselben kanonischen Endzustand von Minuten-Batch und Einzelschritten und berichtet CPU-Mediane ohne unsichere CI-Zeitschwelle.

Nach Verfügbarkeit der **unveränderten** #389-Saves:
```sh
node --test tests/w6-flugbatch-determinismus.test.mjs
node --test tests/*.test.mjs
node scripts/build-w5-singlefile.mjs --check
node tools/w6-flugbatch-benchmark.cjs /tmp/s02/day180.save.json /tmp/s02/day365.save.json /tmp/s02/day730.save.json
```

## Grenzen

Diese Änderung ist ausdrücklich **Forschungs-Code** auf einem separaten Nachfolgestapel zu #389. Sie wird nicht nach `main` gemergt, nicht in Pages/NAS veröffentlicht und nicht als W6-Produktentscheidung behandelt. Die aktuellen öffentlichen J12/J13-Spielverbesserungen sind ein **anderer** Integrationsstand als diese W6-Forschungsbasis. Ein späterer Integrationsvorschlag benötigt eigenen Abgleich, unabhängiges vollständiges Test-/Browser-Gate und ausdrückliche Freigabe der wirtschaftlichen Regeln. iPad Safari und privates NAS sind nicht abgenommen.
