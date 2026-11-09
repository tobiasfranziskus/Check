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

## Nachgewiesener Mechanismus: freies Geld vs. echte W1-Erztreuhand

Die erste tatsächlich ausgeführte [W5aj-b-CI #42708069089](https://github.com/tobiasfranziskus/Check/actions/runs/42708069089) war grün: **2/2 gezielte Tests** und **199/199 Node22-Gesamttests**, jeweils ohne Fehler/Skips. Die Originalkonten- und Tickreihe in beiden Seeds 42 und 7 zeigte identische Aldera-Bindungen:

| Zeitpunkt | Aldera frei | Buchsaldo aus ursprünglichen 1.000 ISK plus tatsächlich gebuchten Erlösen minus Kosten | In Erz-Kauf-Treuhand gebunden |
| --- | ---: | ---: | ---: |
| 0 – vor der Arbeit | 1.000 | 1.000 | 0 |
| 50 – nach erster Eisförderung | 250 | 250 | 0 |
| 170 – nach Erz-Rundflug | 0 | 250 | 250 |
| 230 – nach erster Eislieferung | 250 | 750 | 500 |
| 310 – W5ah-Wasser-Zweitkauf | 0 | 1.000 | 1.000 |
| 360 – vor zweitem echten Quellankauf | 1.000 | 1.000 | 0 |
| 360 – nach zweitem bezahlten 50-Eis-Quellankauf | 750 | 750 | 0 |
| 480 – nach zweiter bezahlter Eisrundfahrt | 1.000 | 1.000 | 0 |
| 500 – nach weiterer Wasserproduktion/-kauf | 0 | 1.000 | 1.000 |
| 550 – dritte Eischarge im Miner, Verkauf verweigert | 0 | 1.000 | 1.000 |

**Kassenidentität im unveränderten Core:** `Aldera frei + summe(owners[erz_treuhand_*].cash) = 1.000 Start-ISK + Aldera gebuchte Erlöse − Aldera gebuchte Kosten`. Dieser ursprünglich unaufgeklärte **1.000-ISK-Abstand** ist ein tatsächlicher W1-Vorfinanzierungsauftrag an den NPC-Erzbergbau, **kein ungebuchter Abfluss und keine verschwundene ISK-Menge**. Der Original-Core sperrt die 1.000 ISK bis zur tatsächlichen Vertragsabwicklung. Solange sie nicht frei sind, ist auch der unabhängige Eis-Einkauf von 250 ISK korrekt gesperrt.

### Anschluss: rechtmäßige Wartezeit statt Gratisauffüllung

Ein zusätzlicher Prüfpfad lässt die Originalwelt in echten 10-Minuten-Core-Schritten laufen. **Bei Tick 600** sind die 1.000 ISK wieder frei und das ursprüngliche W1-Erztreuhandkonto auf null zurückgeführt. Aldera erwirbt die schon bei Tick550 tatsächlich geförderten 50 Eis für **250 ISK** aus eigener Kasse; **750 ISK** bleiben frei. Erst anschließend ist der dritte W5n-Rundtransport zugelassen: **Nadir reserviert 490 ISK, die Spedition 120 ISK Arbeitslohn**, und nach 120 echten Flugminuten bei **Tick720** sind 150 Eis insgesamt geliefert, 3 Eisrundfahrten abgeschlossen und weitere 120 private Eispilotenlöhne bezahlt.

Die erste Zeitfreigabe wurde in [CI #42708733133](https://github.com/tobiasfranziskus/Check/actions/runs/42708733133) als gezielter Test **bestanden**; dazu **200/200 Node22-Gesamttests**. Auch der zusätzliche Seed-7-Gegenversuch ist auf dem separat geprüften [CI-Head #42709357577](https://github.com/tobiasfranziskus/Check/actions/runs/42709357577) **bestanden**: **4/4 gezielte Tests, 201/201 Node22-Gesamttests, 0 Fehler/Skips**. Beide Seeds 42 und 7 erreichen den dritten vollständig finanzierten Eisflug bei Tick720, nach echten 50 Minuten Wartezeit und vollständiger Original-Core-Treuhandfreigabe. Nach dem dritten Flug hat Nadir in Seed42 **2.066 ISK** und in Seed7 nur noch **66 ISK**. Die Quelle kann damit wieder liquide sein, während **der nächste** Käuferauftrag am Nadir-Etat scheitert – zwei unterschiedliche, separat zu prüfende Finanzierungsgates.

**Korrektur der Interpretation von W5aj #283:** Die dortige 13×90d-Matrix weist korrekt ein sofort blockiertes nächstes Eisgeschäft bei Tick550 nach. Daraus folgt **nicht**, dass nach zwei Eisfrachten kein dritter bezahlter Transport möglich ist. Bereits ein realer W1-Vertragsabschluss nach 50 weiteren Minuten kann das Geld rechtmäßig freisetzen. Längere Beschäftigung, Wartung, Käuferinsolvenz und dauerhaftes W6-Gleichgewicht sind damit **nicht** geklärt.

Diese Lösung **erfindet weder Arbeitsgeld noch einen NPC-Rettungsmechanismus**: Der Spieler wartet nur, bis tatsächliche, bereits vorfinanzierte Arbeit des bestehenden Original-Core beendet ist. Es wird kein laufender Vertrag abgebrochen, kein fremdes Geld angezapft und kein automatischer privater Wasserkauf ausgelöst.

**Echte iPad-Safari- und NAS-Abnahme offen. Keine Preis-/Core-/Produktänderung oder Merge-Freigabe.**
