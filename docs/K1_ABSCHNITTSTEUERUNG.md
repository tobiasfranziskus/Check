# K1 – Sichere Abschnittssteuerung einer begleiteten Eisrunde

**[DRAFT / UI, 12.11.2026]** Aufbau auf PR #316 (begleitete Eisrunde), Basis Rule199/Schema8, **nicht** im produktiven main.

## Spielbarkeit

- Im pausierten K1-Cockpit kann der Spieler einen bereits ausdrücklich gestarteten Flug- oder Bergbauabschnitt mit **einem** Tippen fortsetzen statt jede Minute einzeln zu bestätigen.
- Ausgeführt werden ausschließlich die vorhandenen `welt.minute(state)`-Schritte, **höchstens 60 pro Tipp**. Nach jeder originalen Wirtschafts-/Flugminute wird erneut derselbe Schiffseigentümer, Pendelstatus, Finanzierungsstatus und die aktuelle vorgeschlagene Aktion geprüft.
- Die Simulation hält an, sobald ein neuer Spielerentschluss erforderlich ist, beispielsweise vor `shipApproach`, `shipMine`, `shipDock` oder `shipSellIce`. Weder neuer Auftrag noch Kauf, Verkauf, Schiffsauswahl oder notwendige Lohnfinanzierung wird automatisch erzeugt. **50 Eis sind eine freiwillige UI-Handelscharge, keine Kapazitäts- oder Abbauobergrenze:** Der Core lässt den Miner bei ausreichend Geld und Frachtraum weiterfördern; der Spieler bestätigt den Stopp ausdrücklich mit `shipWait`.
- Die ursprünglichen Einzelknöpfe, der +1-Minute-Knopf, Zeittempo und sämtliche Konzern- und Speicheransichten bleiben vorhanden. Während freilaufender Echtzeitsimulation ist die Abschnittstaste deaktiviert. Der UI-Zustand wird **nicht** gespeichert.
- Kein Framework, kein zweiter Simulationstakt, keine Änderung an Core, Geld, Ware, Schiffswerten, Schema, Versionskennung oder bestehenden Speicherdaten. Spieler-Spareinlagen bleiben frei. Bei Kapitalmangel oder gestrandetem Schiff wird kein Rettungsmechanismus eingeführt.

## Prüfung

`tests/welt-rundenabschnitt-browser.cjs` fährt die vollständige Eisrunde auf zwei frischen Welten:

1. Über Original-UI-Befehle mit `window.__welt.schritte` und den exakt erforderlichen einzelnen Core-Minuten.
2. Über dieselben expliziten Befehle und vier begrenzte Abschnittstastendrücke (Abdocken, Anflug, Förderung bis zur Original-50er-Handelscharge, Dockrückflug) samt ausdrücklich bestätigtem `shipWait` nach dem Abbau.

Zusätzlich startet der Spieler einen originalen langen manuellen Flug weit aus dem Feld heraus. Ein anschließender Zielflug benötigt mehr als 60 Minuten; die Abschnittstaste darf **exakt 60 Minuten**, aber niemals 61 simulieren. Dabei bleiben Eigentum, Geld und Flugphysik unangetastet.

Verglichen werden **vollständiger kanonischer Weltzustand und Referenzhash**, 600-ISK-Kauf, 50 Eis/100 ISK bezahlte Förderarbeit, 250 ISK tatsächlicher Dockankauf, unveränderte Gesamtgeldmenge 33.000 ISK, Mint/Burn 0, unabhängige Geld-/Waren-/Eigentümeraudits, echter Save/Load-Hash und alle vier Hoch-/Querformatgrößen in Chromium und WebKit. Keine automatische nächste Aktion oder Umgehung der Finanzierung.

**[TEST / bei PR-Erstellung offen]** Nur erfolgreiche, tatsächlich abgeschlossene CI-Läufe dürfen hier als bestanden ergänzt werden. Echte iPad-Safari- und NAS-Geräteabnahme bleibt offen.

## Nächstes Roadmap-Gate: persönlich steuerbarer Frachter

Die verbindliche Roadmap benennt einen Frachter als nächsten größeren Spielbarkeitsschritt. Der bestehende **Rule199-Core verweigert derzeit ausdrücklich Frachter-Freiflug** (in `m_core_flugplan.befehl` und `abdockenPruefen`) und lässt `shipBuy` eines Frachters nur durch die gegenwärtige Spedition im W3-Vertrag zu. Ein persönlicher Frachter **kann deshalb nicht durch UI-Umbenennen einer NPC-Fracht oder eine neue kostenfreie Hülle entstehen**. Der anschließende, getrennte Forschungsauftrag muss Kauf-/Nutzungsrecht, die echte Pilotzahlung und W3-Vertrag/Transitausführung im einen autoritativen Kern finanzieren und versionieren; kein stiller Wechsel der Rule199-Saves.

**Keine** Freigabe für einen neuen Balance-, Emissions- oder Produktregelstandard, keinen Merge nach `main` und kein Deployment.
