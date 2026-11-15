# J6-I – Integrierte Flotten-/Wirtschafts-APIs (Draft, 15.11.2026)

**Ausgangsbasis:** [main 399a36ab](https://github.com/tobiasfranziskus/Check/commit/399a36ab38c1f6bf4b1b0d40f6a1254d4a52d434). Die bereits separat entwickelten, grün geprüften Drafts [#356](https://github.com/tobiasfranziskus/Check/pull/356) (Flottenprüfung) und [#357](https://github.com/tobiasfranziskus/Check/pull/357) (wirtschaftliche Auftrags-API) wurden ohne Änderung ihrer Quelltexte gemeinsam übernommen. Die einzige bisherige Änderung am Original-Core ist Codex' lesender Export der bereits bestehenden K7-Preistabelle.

## Integrationsgrenzen

- **Keine** Änderung an J4c-App, J4c-HTML, J5-Konzernlage, Root-Navigation oder NAS-Datei. Diese Dateien sind für die separate grafische Integration durch Faible reserviert.
- **Kein** neuer Wirtschaftstakt, keine zweite Welt, kein selbständig agierender Ersatzkunde, keine Preis-/Geld-/Eigentumsregel.
- **Keine** Freigabe der NPC-/Stations-Kassen für den Spieler. Die Kontexte npc3, transport, werft_extern und st_nadir sind bestehende getrennte Entscheider und dürfen nicht durch einen universellen Spielerbutton simuliert werden.
- Die Flotten-API erlaubt ausschließlich den Wechsel zwischen zwei von house wirklich gekauften Jägern am selben, vollständig erreichten Dock. Ein wirklich gekaufter Nadir-Miner besitzt bereits F6-Flugphysik; der eigene Nadir-Frachter ist im freien F6 noch gesperrt.
- Weiterhin getrennte Regel195-Hauptspiel-Saves und Regel204-Jägersitzung. Keine stille Migration.

## Neue unabhängige Zusammenführungsprüfung

`tests/j6i-gemeinsame-welt.test.mjs` führt von der unveränderten Original-Seed42-Regel204-Jägerwelt sämtliche echten Zahlungen und Arbeitsleistungen des zweiten Jägers **durch die J6-Wirtschafts-API** aus. Anschließend wird J6-Fleet auf **derselben Welt und demselben Worldhash** zur wechselseitigen Pilotenauswahl geprüft. Kein neues Schiff wird vorbereitet, importiert, dupliziert oder von Hand im Save angelegt. Das erlaubte Core-Kommando erzeugt die zweite bezahlte Jägerhülle. Negative Rechte- und Trainingsfälle werden ebenfalls geprüft.

Erwarteter Referenzzustand: Tick 22806, zwei gekaufte Jäger, 33.000 ISK Weltgeld, Mint/Burn 0, J5-W-Seed42-Endhash `3630b67418d15855`.

**CI-Status:** Vor der tatsächlichen GitHub-Prüfung nicht als bestanden kennzeichnen; Node22-Gesamtsuite und Browser-/WebKit-/Touch-Gates auf dem gemeinsamen Head notwendig. Es gibt noch keine bedienbare integrierte Wirtschaftskonsole; diese folgt erst mit der grafischen Faible-/ChatGPT-Integration.

Kein Merge, kein Deployment und keine Änderung an produktiven Spielständen.
