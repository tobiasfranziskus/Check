# F8-E · Jäger-Duelltraining mit gegnerischen 2D-Projektilen

**[DRAFT / ANALYSE · 14.11.2026]** Gestapelt auf F8-D [#336](https://github.com/tobiasfranziskus/Check/pull/336). Getrennter F8-Codepfad, **keine** Übernahme aus Codex' [J1 #335](https://github.com/tobiasfranziskus/Check/pull/335) und keine echte Jägerwirtschaft.

## Spielbarer Trainingsabschnitt

Die statische F8-HTML-Flugübung enthält nun neben „Stehende Drohne“ und „Bewegliche Drohne“ den frei wählbaren **2D-Duellmodus**. Der Pilotenjäger besitzt ausschließlich für die Übung 96 Hüllenpunkte. Die Kreisbahndrohne schießt mit eigenem begrenztem Schussintervall, 2D-Geschossen und Trefferradius. Der Spieler muss manuell abdocken, fliegen, den Kurs erfassen, wiederholt selbst feuern und im Duell auch ausweichen. Bei 0 Drohnen-HP und verflogenen Gegengeschossen ist die Übung gewonnen; bei 0 Spieler-Übungs-HP verliert der Pilot die Übung und kann bis „Neue Übung“ keine Befehle mehr ausführen.

Die **Original-F6-Ganzzahlpositionen** des Piloten und die im F8-D-Kern aus Original-Winkelwerten abgeleitete tatsächliche Drohnenposition bestimmen jedes gegnerische Projektil. Die Trefferauswertung wird je schon bestehendem Trainings-F6-Schritt im selben autoritativen Trainingszustand durchgeführt. Keine separate Browser-/NPC-Uhr, keine UI-basierten Hits, keine Zufallsreparatur und keine Wiederbelebung in der Übung. F8-A-D-Standardprofile und der Referenztick 265 bleiben unverändert.

Neue Komponente `prototypes/f8-jaeger/f8-duell.js`: getrenntes trainingsinternes Gegenfeuerbuch `zielprobe.gegner` mit `pilotHp`, `schuesse`, `treffer`, `naechster`, `geschosse` und fortlaufenden `{schuss,tick,schaden,hp}`-Belegen. Jedes Geschoss ist eine sichtbare reale 2D-Flugbahn. Das Audit validiert gegnerische Geschossfelder und IDs, Reihenfolge, Trefferzeitpunkte, Hüllen-Deltas und Unvereinbarkeit mit Nicht-Duellmodi. Verlorenes Duell blockiert weitere Befehlseingaben. Hüllenverlust kann ausschließlich durch Trainingsgeschosse entstehen.

**Unbeschlossene Trainingswerte:** Pilot 96 HP, Gegenschaden 24, Gegner-Geschossfahrt 9.000 P/Schritt, maximale Flugzeit 40 Schritte, Trefferradius 14.000 P, Schussintervall 36 Sekunden, Einsatzradius 260.000 P, maximal zwei gleichzeitige Gegengeschosse. Die vorhandenen F8-B-Schusswerte bleiben reine Übungswerte. Weder diese Zahlen noch das Zielverhalten sind ein genehmigtes Balancing für produktive Jagdkämpfe.

## Harte Integrationsgrenze

**Kein echter Jäger und kein Pirat:** Die Simulations-ID `f8_training_only` darf **nicht** in eine Weltwirtschaft integriert oder als Schiffswarenbeleg verwertet werden. Es gibt keine realen `owners`, `ledger`, `rulesVersion`, `minted`, `burned`, `kopfgeld`, `xp` oder wirtschaftliche Reparatur. Ein Trainingsverlust ist *kein* beschädigtes oder zerstörtes Wirtschaftsschiff. „Neue Übung“ setzt ausschließlich die separate, nicht persistente Übung neu auf. Keine Save-/Importverknüpfung mit dem Hauptspiel und keine unentgeltliche Wiederherstellung einer echten Hülle.

Codex/J1 ermittelte den echten Blocker: Regel200 besitzt noch keine Silizium-/Bauteil-/Jägerbeschaffung. F8-E greift weder `prototypes/welt/rule200-k7-industry-core.js`, `prototypes/welt/welt-kern.js`, `prototypes/flug2d/flug-kern.js`, `prototypes/welt/app.js`, F7 noch `index.html`/`aphros-void.html` an. Der später integrierte Regel200-Jäger muss vollständig finanziert und mit echter ID gekennzeichnet sein; echte Angriffe, Reparaturen und Kopfgeldzahlungen brauchen separate Verträge. **Keinen alten Minting-Aufrufer aktivieren.**

## Ausgeführte direkte V8-Kontrollen

- Stationär und beweglich: Duellschusszahl = 0, Original-Zielmarke weiterhin Tick **265**, original F6-Flug.
- Angedockter Gegner schießt nicht; bei Gefechtsnähe werden gegnerische Projektile aus der tatsächlichen Drohnenposition bewegt.
- Unbeweglicher Pilot nach Anflug: Gegnerbelege Tick **272, 308, 343, 379**, je 24 HP Verlust, Sekunde **379 Niederlage**, danach erneuter `shipSteer` korrekt ohne Mutation abgelehnt.
- Aktiv anvisierender Pilot: drei eigene echte Treffer, Gegner-HP 135→90→45→0, Pilot nach zwei Gegentreffern mit **48 HP**, **Sieg** in Sekunde 337; keine weiteren Schadens-/Geldphantasien. Rückdock weiterhin möglich.
- Ausweichen funktioniert als echte Kinematik: Nach 140 Simulationsschritten bei stationärem Jäger 0 HP, bei Richtung Ost/100 % Antrieb 72 HP und nur ein Gegner-Treffer; beide Prüfungen mit auditierbarem Flugzustand.
- Golden-Replay zweimal ausgeführt: identisches Trainings-JSON nach denselben Befehlen, drei Treffer, echtes Andocken bei Sekunde 600, `audit.ok=true`.
- Zusätzliche manipulierte Gegentreffer-, Geschoss-/HP- und Modus-Fälle werden in `tests/f8e-jaeger-duell.test.mjs` geprüft.

## Automatisierte Tests und CI

`tests/f8e-jaeger-duell.test.mjs` ergänzt die vorliegenden Node22-Tests um die zwei Ende-Zustände, echtes Ausweichen, Angriffs-/Gegenangriffs-Replay, manipulierte Daten und klare Nullwirkungen auf die Wirtschaft. `tests/f8e-jaeger-duell-browser.cjs` prüft in Chromium und WebKit je vier Touchgrößen: Duell wählen, echter 2D-Anflug, per Tap anvisieren/feuern, zwei echte Gegentreffer, Sieg/Dock/Neustart, neue Übung ohne Gegenwehr verlieren, deaktivierte Steuerflächen, kein ISK/XP/Save-Zugriff. Der K1-Workflow führt F8-A/B/D/E gezielt sowie historische Wirtschafts-Regression aus.

**Zum Anlegen dieses Berichts: CI für diesen Head noch ausstehend.** Nur separat bereits belegte V8-Direktproben sind oben als ausgeführt markiert. Echte iPad-Safari-/NAS-Abnahme weiterhin offen. Kein Merge oder Deployment.
