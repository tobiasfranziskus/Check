# P3 – Folgezyklen des eigenen W5-Werftfrachters

**[DRAFT / ANALYSE, 18.11.2026]** Abgeschotteter Nachweis nach [#495](https://github.com/tobiasfranziskus/Check/pull/495), Basismain `1e15ed2`. Keine neuen Produktregeln, NPC-Nachfrage, Startware, Bezahlung, Emission, Preisänderung, UI- oder Save-Felder.

## Ziel / Falsifizierbarkeit

Aus dem autoritativen S02-Regel204-Kern (Seed 42) wird zunächst eine echte W3-Erzfracht, W4-Materialproduktion und eine W5-Hülle erzeugt. Der Spieler kauft diese Hülle für 750 ISK, bezahlt 60 ISK Überführung nach Aldera und kauft/bezahlt seinen eigenen Eisminer. Nach der ersten vollständigen 50er-F4-Rundfahrt werden **Originalangebote alle zehn Weltminuten** abgerufen. Der Spieler nimmt weitere Angebote nur dann an, wenn der Original-J8-Kern sie signiert und die vollständige Save-/Core-/Eigentumsprüfung besteht. Es gibt keine Garantie, dass ein zweiter Auftrag zustande kommt.

Eine bereits aktive NPC-Fracht, fehlendes Eis, Käuferkapital oder eigenes Arbeitskapital können einen neuen Vertrag verhindern. Der NPC-Disponent bleibt aktiv; kein Zurücksetzen eines Käuferbudgets, keine Transport- oder Einkommenserfindung. Die Untersuchung endet nach maximal 720 weiteren Minuten Angebotsprüfung oder nach der vierten abgeschlossenen eigenen F4-Rundfahrt (gegebenenfalls etwas mehr Gesamtlaufzeit durch bezahlte Transporte).

## Herkunft und Rechnung

Jeder Abschluss liefert die Originalbelege für 50 Eis, 240 ISK Frachttarif, 120 ISK bezahlte Hin-/Rückflugminuten sowie den direkt über `welt.buchwert` festgestellten Frachterverschleiß (im ersten Lauf 36 ISK). `Tarif – Pilotenlohn – Frachterwertverzehr` ist nur ein **enger Transport-Deckungsbeitrag**, keine Gesamtrentabilität (Minerkauf, Eisförderung, Überführung, Kapitalkosten, laufende NPC-Geschäfte getrennt). Firmenkasse nicht pauschal als Frachtergewinn interpretieren.

## Prüfungen / Grenzen

`node --test tests/p3-werftfrachter-zyklus.test.mjs`, vollständige Node22-Suite und GitHub-CI sind erst nach tatsächlicher Ausführung als bestanden zu vermerken. Das Testwerkzeug protokolliert abgeschlossene Originalaufträge, konkurrierende NPC-Frachten, Ablehnungsgründe, Kassen, Lager, Schiffsbuchwert und identische kalte Saves/Hashes. Manipulierte Herkunft/Überführungsbelege werden bereits in #495 regressiert. **Kein Merge oder Deployment aus diesem Forschungs-PR.** Browser-/iPad-/NAS-Geräteprüfung nicht durch Node simuliert.
