# Managerakademie · Acht Wirtschaftslektionen [DRAFT / P1]

**Quelle:** öffentlicher Original-Karrierestart `prototypes/spiel/index.html` mit unverändertem J8/Weltkern. Zusätzlicher ausklappbarer Kurs **Managerakademie** oberhalb der Konzern-Karten. Keine zweite Simulation, keine neuen wirtschaftlichen Angebote, kein Buildsystem.

## Lektionen
1. Angebote entdecken – Original-Angebotsübersicht aufrufen (Lese-Übung).
2. Miner erwerben – nur auditiert von der Werft gekauft (üblicher Startpreis: 600 ISK).
3. Frachter erwerben – nur auditiert von der Werft gekauft (üblicher Startpreis: 750 ISK).
4. Bergbau beauftragen – nur ein **aktiver eigener** bezahlter Eis-/Siliziumauftrag im Weltbuch zählt.
5. Bestände und Kassen prüfen – Wirtschaftsterminal öffnen (Lese-Übung).
6. Frachter disponieren – erst der ursprüngliche, für einen eigenen Frachter gebuchte Wirtschaftsvertrag zählt.
7. Handelsergebnis prüfen – erst **beendete** Fracht mit Original-Lieferbeleg und bezahlter Frachtgebühr gilt als abgerechnet. Vertragsstart allein nicht genug.
8. Optional: Silizium verkaufen – nur signierter originaler Nadir-Ankaufsbeleg `kanon.silizium.belege`, nicht mit Eis-Frachtentgelt verwechseln.

Die Menübuttons navigieren nur zu **bereits vorhandenen** und vom Original-Core angebotenen Spieleraktionen. Sie kaufen und verkaufen **nicht selbst**, um die wirtschaftliche Autorität einzuhalten. Sperrgründe bleiben sichtbar, wenn Lager, Berechtigung, Finanzierung oder Material fehlen.

## Sicherheit / Integration
- Die Lektionen laufen in `prototypes/tutorial-manager/manager.js` und eigenem `manager.css`. Minimale Anschlüsse an `prototypes/spiel/spiel.js`, `index.html`; `prototypes/raum/`, `prototypes/welt/`, J8, Spielstandsformate und vorhandene IDs werden nicht verändert.
- `ManagerAkademie.daten(session, gesehen)` verifiziert vor jedem Abschluss `welt.audit(zustand)`. Nur echte Core-Belege markieren Kauf, Förderung, Vertragsstart, Abrechnung und Nadir-Siliziumverkauf. Das reine Betrachten der Angebots-/Lageransicht ist bewusst nur als UI-Handlung markiert und wird beim Sitzungsneustart nicht gespeichert.
- Ein geöffneter Lernkurs lebt nur in der UI; Fortschritte aus echten Wirtschaftsbelegen sind bei regulärem Save/Load wieder sichtbar. Original-Saves (Regel204 und getrenntes Rule207-Opt-in) bleiben unverändert.
- **CI-Gate:** `node --test tests/p1-managerakademie.test.mjs`, gesamter Node22-Regressionslauf, P1-Browser mit neuer Lehrfolge Chromium/WebKit je 4 Touchgrößen, außerdem W5/Jäger/W6 getrennt prüfen. Nicht ausgeführte oder fehlgeschlagene Checks als offen melden; iPad-Safari-/NAS-Realabnahme offen.
- **Separater Pilotenstrang:** [Codex-Issue #437](https://github.com/tobiasfranziskus/Check/issues/437), nur eigene `prototypes/tutorial-pilot`-Dateien. Keine unkoordinierte Änderung an Startbildschirm oder zentraler Roadmap.
