# F8-D – Bewegliche 2D-Trainingsdrohne mit echter Verfolgung

**[DRAFT / ANLESE · 14.11.2026]** Basis: [F8-B #333](https://github.com/tobiasfranziskus/Check/pull/333) (statische Drohne, echte Projektilbahn) und [F8-A #332](https://github.com/tobiasfranziskus/Check/pull/332) (Original-F6-Flugkern). Der separate Wirtschaftsauftrag [F8-C #334](https://github.com/tobiasfranziskus/Check/issues/334) bearbeitet rechtmäßig finanzierte Jägerhüllen und ist **nicht** Teil dieser Aufgabe.

## Umsetzung

In der bereits bestehenden statischen Browserübung `prototypes/f8-jaeger/index.html` kann der Pilot *vor Trainingsbeginn* zwischen statischer und beweglicher unbewaffneter Drohne wählen. Der bewährte stationäre Modus bleibt unverändert. Während der laufenden Übung ist ein Wechsel gesperrt; nach „Neue Übung“ lässt sich neu wählen.

Im beweglichen Modus berechnet `prototypes/f8-jaeger/f8-treffer.js` die Zielkoordinaten ausschließlich aus den gespeicherten Flugsekunden, dem Original-F6-Viertelsinus und einem ganzzahligen Kreisradius von **96.000 Raumpunkten**. Der ganzzahlige Winkelschritt 0–255 wird alle fünf Flugsekunden erhöht; die volle Umrundung dauert **1.280 F6-Flugsekunden**. **Kein eigenes Zufallsmodell, kein `Math.random`, keine `Date`, kein `performance.now` im Core.** Browser-Bildwiederholrate und Projektion verändern weder Zielposition noch Treffer.

Der bisherige `fighterFire`-Befehl lässt Projektile aus der Position und dem Kurs des echten F6-Jägers fliegen. Der deterministische Abstand zwischen Projektil und **aktuell beweglichem** Ziel entscheidet über Treffer, HP-Verlust, Nachladezeit und Beleg. Das Touch-Cockpit zeigt stationäre Flugmarke und bewegliche Drohne getrennt, echte Projektilpositionen, Nachladezustand und die verbleibenden HP. „Richtung zur Drohne erfassen“ ist ein **bewusster, vom Spieler ausgelöster** `shipSteer`-Flugbefehl zur derzeitigen Position, kein automatischer Abschuss und keine manipulierende Canvas-Treffererkennung. Der Spieler muss Kurs erneut erfassen und dann selbst schießen.

## Sicherungen und explizite Nicht-Ziele

- Übung **ohne** echten Piraten, Wirtschaftskonto, NPC-Eigentum, finanzierte Jägerhülle, Kopfgeld oder reale Schiffszerstörung. Das trainierte Objekt ist ein **unbewaffnetes Trainingsziel**; Treffer haben nur die isolierten Übungs-HP zur Folge.
- `fighterTargetMode` ist nur für die eigene Trainings-ID `f8_training_only`, exakte Befehlsfelder und Simulationssekunde 0 zugelassen. Fehler werden **ohne Zustandsänderung** abgelehnt; Modus und Trefferbelege bleiben im JSON-Roundtrip prüfbar.
- Keine Änderungen an `main`, `index.html`, `aphros-void.html`, `prototypes/welt/**`, `prototypes/flug2d/flug-kern.js`, `prototypes/w5ac/rule191-w5-ferry-core.js`, F7- oder Codex-Dateigrenzen. Keine Spielstanddatenbank, kein Import in Rule200, keine zusätzliche Laufzeitabhängigkeit.
- 96.000 P Radius, fünf Sekunden pro Winkelschritt und das bekannte Trainingswaffenprofil sind reine **[OPTION/ANALYSE]**, keine beschlossenen Kampf-Balancingwerte.

## Prüfungen

Neue Node22-Tests `tests/f8d-bewegliches-ziel.test.mjs` kontrollieren das ursprüngliche Standziel als Default und den unveränderten F8-A-Golden-Tick 265, den ganzzahligen Kreisumlauf, manipulationsfeste und atomare Moduswahl, verfehlte reale Geschosse, drei real räumlich geprüfte Treffer auf das bewegliche Ziel, JSON-Roundtrip, Replay, vollständige Rückkehr zum Dock und Isolation der Wirtschaft.

Neue Browsertests `tests/f8d-bewegliches-ziel-browser.cjs` führen in Chromium und WebKit je **vier** Touchgrößen aus. Sie wählen die bewegliche Drohne über das native Auswahlmenü, docken ab, navigieren im F6-Kern, erfassen dreimal per Touch die neue Zielrichtung, feuern mit Cooldown, prüfen je einen echten Treffer- und HP-Beleg und docken wieder an. Danach Neustart, kein ISK/Kopfgeld. Die bisherigen F8-A-/F8-B- und Wirtschaftstests bleiben Teil derselben CI.

**Direkte JS-V8-Probe vor CI:** Bei tick265 (unveränderter Flug-Golden-Wert) liegt die bewegliche Drohne an anderer Position als das ursprüngliche Ziel. Der Spieler richtet sich wiederholt neu aus und erzielt exakt 3 echte Treffer bei intaktem Audit, bis Ziel-HP 0. **Nicht** als abgeschlossenen Node22-/WebKit-Gesamtlauf ausgeben, bis GitHub Actions tatsächlich grün ist.

**Offen:** echte iPad Safari/NAS, Rule200-Werft-Jägerproduktion, Eigentum, bezahlte Jagdstunden, Piraten und Kopfgeld. Kein Merge und kein Deployment ohne Nutzerfreigabe.
