# W5aj-b – genaues Aldera-Kassenkonto statt neuer Rettungsregel

> [DRAFT/ANALYSE · 09.11.2026] Aufbauend auf [W5aj #283](https://github.com/tobiasfranziskus/Check/pull/283). Verbindliche Roadmap bleibt `main/docs/ROADMAP.md`. Regel195, Preis-/Geldfluss-Original-Core, Schema8, Hauptspiel und Saves unverändert; keine Produktentscheidung.

## Ausgangsbefund

13×90d W5aj erreichen einen weiteren echten bezahlten 50er-Eis-Rundflug; nach dem nächsten tatsächlich finanzierten 50er-Förderauftrag liegt die Ware im Miner, weil Aldera 0 ISK besitzt. Nadir hält gleichzeitig weiterhin Käufer-ISK. Der Original-Core blockiert den Ankauf korrekt. Das allein legt jedoch **nicht** offen, welcher Eigentümer welches Geld zuvor erhielt.

## Jetzt isolierter Prüfauftrag

`tests/w5ajb-aldera-geldbruecke.test.mjs` erstellt zwei unveränderte Original-Regel195-Welten mit Seeds 42 und 7; jede führt dieselben W5ah/W5aj-Kernbefehle aus. Lesende Original-Save-Snapshots protokollieren an jeder kaufmännisch relevanten Phase:
- Alderas freie Kasse, gebuchte kumulierte Erlöse/Kosten, als Gegenprobe Anfangsgeld + Erlöse − Kosten, reale Erz-/Eisbestände;
- Nadir, Spediteur, Miner, NPC und Fonds als **andere Eigentümerkonten**;
- W3- und W5n-Lieferungen, echten verkauften und noch beim Miner befindlichen Eisbestand sowie persönliche Wasserkäufe;
- Hash, unabhängiges Gesamtgeld-Audit, Mint=0 und die nicht-mutierende Core-Ablehnung beim dritten Quellkauf.

Keine zeitgesteuerte Kapitalzuführung, kein willkürlicher neuer Käufer, keine Gegenbuchung, kein Versuch, den tatsächlich fehlenden Quellankauf zu umgehen. Das ist ein isolierter Audit und kein Simulationszweig.

**Interpretation erst nach ausgeführter CI und geprüften Logdaten ergänzen.** Der Report ist ein Recherchebeleg, kein Beweis für dauerhafte W6-Wirtschaft.
