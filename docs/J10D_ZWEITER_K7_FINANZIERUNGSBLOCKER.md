# J10d – Zweiter K7-Vertrag: Schiffskoordination möglich, Aldera-Erzkauf unfinanziert

**Stand: 15.11.2026 · [DRAFT / ANALYSE], nicht in `main`.** Ausgang ist der J10c-Forschungsstand [#374](https://github.com/tobiasfranziskus/Check/pull/374) mit frischer Regel195→204-Kopie, vollständig real geförderten 50 Erz, bezahltem K7-W5-Frachter, K2-Nadir-Miner, acht Silizium und sieben echten J3-Bauteilen. Keine Änderung an produktivem JavaScript, Preisen, NPC-Standardpolitik, Geldmenge oder Spielständen.

## Reproduzierbarer Original-Core-Gegenversuch

1. **Tick440, nach 7 J3-Bauteilen:** Der NPC3-Erzminer `sh001` ist leer, aber mit aktivem Erzpendel im freien Aldera-Flug; `transport/sh002` liegt leer und frei am Aldera-Dock. In Nadir lagert ein weiterer, vollständig bezahlter K7-W5-Frachter. Der erste neue K7-Angebotstest wird korrekt mit „Schiffe nicht frei im Dock“ abgewiesen.
2. **Rechtmäßiger Eigentümerstopp:** Nur `npc3` gibt den bereits existierenden Original-Core-Befehl `shipShuttleStop` für den eigenen `sh001`; die Simulation setzt den laufenden Flug nicht zurück. Nach **11 echten, auditierten Wirtschaftsminuten** kehrt der Miner regulär leer zum Aldera-Dock zurück. Kein Teleport, kein fremder Befehl, keine unbezahlte Flugarbeit.
3. **Realer Kauf statt Lagerlöschung:** Die Spedition `transport` kauft die vorhandene fertige Nadir-W5-Hülle für **750 ISK**, von ihrem echten Konto (**1.370 → 620 ISK**). Die externe Werft erhält 750 ISK. Der K7-Werftlagerplatz ist frei, `sh002` bleibt physisch am Aldera-Dock.
4. **Getrennte, gültige Vertragsbereitschaft:** `st_nadir` bietet einen zweiten K7-Erzvertrag für `npc3/sh001` und `transport/sh002` an. `npc3`, `transport`, `werft_extern` unterschreiben nacheinander jeweils über ihre echten Original-Eigentümerkontexte. Das sind **explizite Gegenversuchsentscheidungen**, keine automatisch ausgeführten produktiven NPC-Befehle.
5. **Neue harte Finanzierungssperre:** Der endgültige `industrialOreCommit` wird vom unveränderten Core korrekt abgewiesen. Der signierte Vertrag gilt **nicht** als finanziert. Unterschriftsangebot und abgelehnter Commit verändern weder bestehendes Geld noch Ware. Der echte Auftraggeber `st_nadir` storniert ausschließlich das noch nicht rechtswirksam begonnene Angebot; bestehende Käufe, Flugarbeit und vorhandene Schiffe bleiben gebucht.

## Verpflichtende Original-K7-Finanzierung bei Tick451

| Eigenständiges Firmenkonto | Real verfügbare ISK | Vom Original-Core verlangte ISK | Fehlbetrag |
| --- | ---: | ---: | ---: |
| `npc3` – Erzförderung | 3.543 | 100 | 0 |
| **`st_aldera` – erster Erzkäufer** | **0** | **500** | **500** |
| `st_nadir` – industrieller Abnehmer | 3.912 | 740 | 0 |
| `transport` – Frachtunternehmen | 620 | 120 | 0 |
| `werft_extern` – Werftreserve | 3.440 | 530 | 0 |

**Wirklicher Engpass: das Aldera-Firmenkonto hat bereits die erste Erzcharge bezahlt und verfügt über 0 ISK.** Die bisherige Diagnose „Miner nicht frei am Dock“ ist im explizit legitimierten Gegenversuch überwunden; ein wiederholbarer, rechtmäßig finanzierter Erzkauf ist es nicht. Der Core meldet `K7: unvollständig vorfinanzierte Firmenkette`. Weltgeld bleibt **33.000 ISK**, Mint/Burn **0**. Nach rechtmäßigem Storno Referenzhash `f60647a419c37a5d`. Den vorhandenen Lagerfrachter zu kaufen und die NPC-Pendelumstellung zu erlauben **schafft keine neuen Käufer-ISK**.

## Tatsächlich ausgeführte Abnahme

- [Node22/W5-RC1 #43707732638](https://github.com/tobiasfranziskus/Check/actions/runs/43707732638): **293/293 Tests bestanden, 0 Fehler, 0 Skips** auf Codehead `2edfe45c`. Original-W0–W5-Einzeldatei-/Touch-Preflight sowie unabhängig geprüfte Geld-/Waren-/Schiffsaudits; jeder weitere Weltminuten-Schritt auditiert.
- [Wirtschafts-JS #43707732625](https://github.com/tobiasfranziskus/Check/actions/runs/43707732625): `completed/success`. Eventuell bedingt übersprungene Jobs sind kein bestandener Test.
- Gleicher Seed-/Befehlsablauf, Save/Load- und Ablehnungsaudit; **kein** Browsercode geändert und keine zusätzliche Browser-Geräteabnahme behauptet. Echte iPad-Safari-/NAS-Geräteabnahme weiterhin offen.

## Grenzen und Entscheidung

**[BESCHLOSSEN / KEINE ÄNDERUNG]** Die getrennten Unternehmen behalten volle Verfügungsrechte. Der Spieler darf keine NPC-Aufträge unmittelbar unterschreiben; die optionale `industrieAutoSetzen`-Politik bleibt deaktiviert. Ohne Deckung kein zweiter Auftrag, keine zusätzliche Ware und kein daraus gefertigter Jäger. Geldmodell B bleibt unverändert.

**[ANALYSE / NÄCHSTE PRÜFUNG]** Nur tatsächlich bestehende Aldera-Einnahmen prüfen: reales Wasserlager, zahlungsfähige Aldera-Haushalte und freiwillige `householdBuy`-Verträge, bereits vorhandene andere Verkaufspfade. Ein Finanzierungsvorschuss aus Nadir, Kapitalerhöhung/Unternehmensdarlehen oder Änderung des Erz-Abwicklungsschemas wäre **[OPTION]**, eine separat freizugebende wirtschaftliche Produktregel, keine versteckte Rettung. Vor jeder solchen Änderung Kosten, Rückzahlung und Abrechnungsfolge nachweisen.

**Integrationsstatus:** Reine Forschung auf eigenem gestapelten Draft-PR [#376](https://github.com/tobiasfranziskus/Check/pull/376), **nicht in `main`, nicht auf GitHub Pages veröffentlicht**.
