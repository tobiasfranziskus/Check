# P4 – Original-F8-E-Duell in der öffentlichen Jägerkarriere [DRAFT]

## Spielpfad und Autorität
- Normaler öffentlicher Einstieg `index.html` → `prototypes/spiel/index.html` → **Regel204-Karriere** mit tatsächlichem, für 900 ISK in Nadir bezahltem und vom Kern auditiertem Jägerkauf. Keine Gratis-Auswahl, keine vom UI erzeugte Hülle.
- Im Jägercockpit rechtmäßig **für 40 ISK Flugreserve** abdocken. Erst im finanzierten freien Flug ist „Duelltraining“ verfügbar; der Button bleibt bei Minern, Fracht und isolierter Regel207-W6-Forschung verborgen.
- Bestehende F8-E-Trainingsdrohne anfliegen, über die reale F6-Flugsteuerung steuern, virtuelle Geschosse abfeuern, beweglichem Gegenfeuer ausweichen; Treffer, virtuelle HP und Ausgang werden sichtbar. Geld, Ware, reales Schiff, Hüllenschaden, Ausrüstung, Munition und NPC-Eigentum **werden niemals durch das Training verändert**.
- Die Übung läuft **nur im flüchtigen Browserzustand**. Das Original-Regel204-Save/Load/Export-/Backupformat bleibt bitgleich; Reload oder Weltzeitsprung außerhalb des Cockpits unterbrechen sie. Keine Änderung von Preis, Fitting, Waffenbalancing, Schadens- oder Reparaturregel.

## Wiederverwendung statt Duplikat
- Unveränderte `prototypes/j4c/duell.js`, `prototypes/f8-jaeger/f8-treffer.js` und `f8-duell.js`: In J4c bereits bestehendes F8-E-Schuss-/Kollisions- und Gegnertraining, ausdrücklich kein realer Kampf.
- Die autoritative `J8KonzernSitzung.flugSchritte` kann ohnehin unveränderbare Flugsekundenbelege an reine Beobachter geben. Die Original-Jägerflugprobe enthält nun zusätzlich **Kurs und originalen Flugdienstnachweis**. Kein zweiter Ticker, kein zusätzlicher Wirtschaftsbefehl. J4e-Start/Feuer fordert zusätzlich den Original-Regel204-Audit.
- Bereits integrierte J4d-Patrouille und getrennte W6-Regel207-Welt bleiben erhalten. Ein noch laufendes Duell darf keine neue Patrouille starten; eine laufende Patrouille verhindert den Duellstart.

## QA / Release-Grenze
- Neuer Node22-Test: tatsächlicher Jägerkaufbeleg, bezahltes Abdocken, echte F6-Proben, virtuelles Gegenfeuer, Beobachter-Immutable-Checks, identischer JSON-Save/Hash mit und ohne Training, 33.000 ISK Weltgeld und Mint/Burn 0; negative Fälle ohne eigenes Schiff/Kauf/Flug, manipulierte Belege, Zeitlücken.
- P1-Workflow: Root→eigenes bezahltes Jägercockpit→virtuelles F8-Duell/Feuer, Chromium und WebKit in vier Touchgrößen; alte Miner-/Fracht-/Patrouillen-/W6-/Save-Tests erhalten. Relevante Gesamtregression in `tests/*.test.mjs`.
- Nach vollständiger unabhängiger Abnahme und Sicherung des alten `main`: Merge mit vorhandener Dauerfreigabe möglich. Produktive Feuer-/Damage-/Reparatur-/Modulregeln sind ein anderer, **noch nicht freigegebener** Wirtschaftsschritt.
- **Nicht als ausgeführt ausgeben**, solange CI-Ergebnisse nicht vorliegen. Echte iPad-Safari-/NAS-Geräteabnahme bleibt offen.
