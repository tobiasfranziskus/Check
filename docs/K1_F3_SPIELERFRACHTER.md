# F3 – Persönlicher 2D-Frachter in der kanonischen K1-Forschungswelt

**[DRAFT / 12.11.2026]** [PR #318](https://github.com/tobiasfranziskus/Check/pull/318), Basis #316 (`a056b93e`), Codehead `c6bbd150`, nicht integriert. Aktuelles Produkt auf `main 04124f2b` (Regel195/Schema8) unverändert. Keine automatische Übernahme von K4–K7.

## Kleine vollständig finanzierte Spielfunktion
1. Ein in Aldera **wirklich lagernder**, endlicher `frachter` darf ausschließlich vom Spieler über `shipBuy` gekauft werden. Preis und Buchungen stammen aus dem originalen W5-/W3-Kern (750 ISK; Käuferkasse belastet, Werftkasse erhält ISK, Lager reduziert, physische neue Schiff-ID, Eigentum `house`). Der NPC verliert ggf. den Zugang zu dieser knappen Hülle; keine Gratisersatzproduktion.
2. Nur dieser eigene, **unbeladene**, nicht vertraglich gebundene Frachter darf in Aldera `shipUndock` und die vorhandenen `shipSteer`/`shipApproach`/`shipDock` verwenden. Der bestehende Flugkern simuliert tatsächlich Position, Beschleunigung, Bremse und Dockanflug. Ein ursprünglicher `transport`-Frachter bleibt für Spielerbefehle tabu.
3. Der Original-K1-Flugdienst bindet vor dem Start 40 ISK aus der tatsächlich verfügbaren Eigentümerkasse. Entlohnte Minuten gehen an das bestehende persönliche Pilotenkonto `pilot_house`. Bei legalem Andocken wird ausschließlich unverbrauchte Reserve zurückgegeben; Verschleiß wird protokolliert. Keine gewöhnliche Treibstoffmechanik.
4. Jeder Wirtschafts-/W3-Befehl auf einem bereits abgedockten Frachter wird im K1-Wrapper **vor** dem Wirtschafts-Kern atomar abgelehnt. Deshalb kein Teleport, Fernladen oder Umgehen der gültigen W3-Arbeitstreuhand.
5. K1-eigener optionaler Kaufbeleg `kanon.spielerFrachterKaeufe` dokumentiert nur echte Käuferhüllen. Der Core trennt im Forschungsprofil W3-Speditionsinvestitionen von bereits bezahlten Spielerhüllen; unabhängiger K1-Audit vergleicht alle Belege mit echten Schiff-IDs, Lager-/Ledgerzählern, Eigentümer und Preis. Alte Regel199-Spielstände ohne dieses Feld bleiben akzeptiert; keine Regel195-Migration.
6. Touch-Oberfläche: gemeinsame Auswahl eigener Miner/Frachter, Original-Kurs-/Brems- und Raumkarte, physischer Kauf in Station, keine Miner-Förderknöpfe im Frachtermodus. Die begleitete Miner-Eisrunde bleibt bei fehlendem Schiff sichtbar.

## Noch ausdrücklich nicht enthalten
- **Kein persönlich abgeschlossener, bezahlter W3-Frachtvertrag**, keine eigenmächtigen Käufe/Verkäufe fremder Ware, keine reale 2D-Inter-System-Reise Aldera–Nadir. W3-NPC-Spedition fährt weiterhin ihren abstrakten, vollständig finanzierten Originaltransit.
- Kein neues Geld, keine neuen Güter, keine kostenlose Hülle, keine geänderten Preise und keine direkte Spielerübernahme von NPC-Schiffen.
- Keine Produktfreigabe, kein `main`-Merge, keine Pages-/NAS-Aktualisierung, kein Eingriff in den produktiven Browser-Spielstand.

## Prüfgrenzen und negative Befunde
**Ausgeführt, zunächst negativ:** [K1-CI #43270175234](https://github.com/tobiasfranziskus/Check/actions/runs/43270175234) zeigte unmittelbar nach dem neuen Käufer-Frachterkauf **drei legitime Auditwarnungen**: W1-Vollkosten, W3-Speditionseigentum und W5ad-Ersatzbuch ordneten sämtliche gekauften Frachter noch der Spedition zu. [K1-CI #43270427638](https://github.com/tobiasfranziskus/Check/actions/runs/43270427638) bestätigte den Befund; zusätzlich wurde der genaue Original-W3-Ablehnungsgrund für unberechtigte Spielerfracht festgestellt. Diese Läufe gelten **nicht als bestanden**.

**Nachfolgende Korrektur:** Getrenntes, prüfbares K1-Spieler-Frachterkaufjournal; alle drei ursprünglichen wirtschaftlichen Gleichungen werden nun unter `rules.kanon` um den tatsächlich anderen Eigentümer ergänzt, nicht abgeschaltet. Tests für echte Währungen/Waren, neue Flugminute, Original-W3-Sperren, alten Regel195-Start, manipulierte Schiffe/Belege und Save/Load wurden ergänzt.

**Noch nicht als abgeschlossen behaupten:** [K1-CI #43271328129](https://github.com/tobiasfranziskus/Check/actions/runs/43271328129) (dedizierter K1-Frachter-Node22-Test, 15×90/5×365/2×730, bestehende 328+ Tests, Chromium+WebKit je vier Touchgrößen), [RC1](https://github.com/tobiasfranziskus/Check/actions/runs/43271328173) und [historische JS-Regression](https://github.com/tobiasfranziskus/Check/actions/runs/43271328340). Abschlussstatus auf dem letzten Codehead gesondert nachtragen. Echte iPad-Safari-/NAS-Abnahme bleibt offen.

## Nächstes belegbares Spielbarkeitsgate
Ausreichend finanzierten, vom **richtigen Eigentümer** autorisierten persönlichen Frachterauftrag mit vorhandener Ware, einmaligem Kauf-/Frachtgeld, beidseitiger Dockprüfung und einem wirklichen Lieferbeleg verbinden. Bei nicht finanzierbarem Vertrag oder unbelegbarer Preis-/Frachtkette ausdrücklich abbrechen, keine Scheinauszahlung.
