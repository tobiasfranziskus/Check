# B-K9w – Flottenzuschuss-Gegenprobe und bezahlte Nahrungsfracht

**[ANALYSE/DRAFT · 02.11.2026]** [PR #114](https://github.com/tobiasfranziskus/Check/pull/114) baut auf #113 → #112 → #111 → #110 → #109 → #108 auf. **[MAIN]** bleibt unverändert `b4e604d6` (Produkt v0.12.5, Regel14, Schema8). Ausschließlich analytischer Regel15-/Schema9-Test. Keine Lohn-, Preis-, Rezept- oder Emissionsentscheidung; keine Änderung an `index.html` oder produktivem Save.

## Fragestellung und Methode

1. **Kausalprüfung des alten Werftfonds-Zuschusses:** Der bestehende produktive Core ruft bei leerer NPC-Flotte `zuschuss(state,rules,owner,bedarf)` vor Ersatzkauf. Im Test wird **nur in einer dynamisch kompilierten Core-Kopie** exakt dieser Aufruf unterdrückt. Paarvariante A behält ihn. Sonst sind Startgeld, Seed, NPC-Disposition, Piraten, Regeln, NPC- und Stationsfonds, Fabriklöhne, Endverbrauch, Schiffs-/Warenlogik und Tickfolge gleich. Die allgemeine Stationsfonds-Auffüllung ist bereits für B-K9s/v kontrolliert deaktiviert (`mindeststand:0`, sehr hohe Fondsobergrenze), der individuelle Zuschuss in A aber nicht.
2. **Tatsächliche Frachter-Nahrungslosrechnung:** Der Original-Core protokolliert Nahrungs-Käufe und -Verkäufe einschließlich Preis, Menge und **beider** realer Handelsgebühren. Gekaufte Losmengen werden pro Schiff FIFO einem späteren Verkauf zugeordnet. Waren ohne Einstandsnachweis gelten **nicht als kostenlos**, sondern als unbewertet. Gleichzeitig werden echte Frachter-Flugverträge beim Abflug mit Ladungszusammensetzung und bei jeder wirklichen Zahlung erfasst. Leere/andere Frachten werden separat gehalten, nicht der Nahrung zugerechnet.
3. **Audit:** Beide Varianten werden stündlich auf unabhängige Geld-/gebundene Vertragsreserve- und Original-Warenbilanz, Herkunft und täglich auf Save/Load-Hash geprüft. Vor tatsächlicher Zuschusswirkung müssen die Welten hashidentisch bleiben. Testwerte sind echte Core-Ausgaben, keine geschätzten Preis-Momentaufnahmen.

**Grenze:** Der Händler-Beleg beweist kauf- und verkaufsbezogene Frachtzahlungsströme, nicht die vorgelagerten Vollkosten des produzierenden Nahrungswerks oder globale Nachverfolgung jeder von anderen Schiffen wiederverkauften Ware. Leerpositionierung, Kapital-/Schiffskauf, Schiffsschäden, mögliche Verluste und spätere Schiffsersatzkosten sind für die einzelne Nahrungsladung noch nicht vollständig zugeordnet. Die bezahlten lokalen Neu-Nahrungsverbräuche sind außerdem ein **anderer Vorgang** als Handel zwischen Stationen.

## Reale Nahrungstransporte im aktiven Markt, jeweils 5 Tage

| Händlergeschäft (NPC1+NPC2, tatsächliche Zahlungen) | Seed42 | Seed7 |
| --- | ---: | ---: |
| Belegte eingekaufte Nahrung | 38 Einheiten | 39 Einheiten |
| Einkaufspreise insgesamt | 973 ISK | 998 ISK |
| Einkaufs-Handelsgebühren | 38 ISK | 34 ISK |
| Tatsächlich verkaufte und zuordenbare Nahrung | 38 | 39 |
| Erlöse aus Verkauf | 1.503 ISK | 1.527 ISK |
| Verkaufs-Handelsgebühren | 18 ISK | 14 ISK |
| **Realisierte Händler-Handelsspanne vor Fahrtkosten** | **+474 ISK** | **+481 ISK** |
| Echte reine Nahrungsflüge | 5 | 7 |
| Abgerechnete Flugkosten dieser Nahrungsflüge | 602 ISK | 1.184 ISK |
| **Handelsspanne abzüglich dieser realen Nahrungsflugkosten** | **−128 ISK** | **−703 ISK** |
| Mischfrachtflüge | 0 | 0 |

Die beiden negativen Beträge sind **Händler-Teilergebnisse**, nicht gesamtwirtschaftliche Produktionsmargen. Sie enthalten keine Erlöse aus bezahltem Endverbrauch und dürfen nicht mit der B-K9u-Fabrikmarge verwechselt oder erneut als Warenherstellungskosten angesetzt werden. Erzwungene Leerpositionierungen und bereits bezahlte Schiffsanschaffungen würden die Gesamtbelastung *weiter* erhöhen, nicht die ausgewiesene negative Teilrechnung ausgleichen. Die 1184/602 ISK sind **wirklich abgegoltene** Flugstunden, nicht allein reservierte Budgets.

**Diagnose:** Das bisherige Routen-Gate bewertet Warenpreisunterschied und Gebühren, berücksichtigt im gezeigten Abschnitt die tatsächlichen Reisebetriebskosten nicht im Gewinnvergleich. Tatsächlich in der Testwelt gekaufte und verkaufte Nahrung ist daher trotz positiver nomineller Handelsmarge nach Fahrarbeit negativ. Für den Gesamtwirtschaftsvergleich muss zusätzlich die korrekte Abgrenzung der zurückgelegten Leerfahrten erfolgen; sie werden hier ausdrücklich nicht künstlich auf Nahrungschargen verteilt.

## Kausale Werftfonds-Gegenprobe Seed7

Bis einschließlich vor Tick **3060** sind die Ausführungen mit/ohne den Zuschuss hashidentisch. Der erste Zuschuss über **693 ISK** löst zu Tick3060 exakt die erste Zustandsabweichung aus. Es handelt sich um einen **Transfer aus vorhandenen Fonds-ISK** an NPC1, nicht um `minted`.

| Beobachtung an Tag5 | Zuschuss aktiv | Zuschuss nur im Test unterdrückt |
| --- | ---: | ---: |
| Kumulativer individueller Zuschuss | 693 ISK | 0 ISK |
| NPC-Händlerfrachter vorhanden | 3 | 2 |
| Handelsbuchungen (alle Waren) | 318 | 277 |
| Frachterflugkosten (alle Waren/Leerflüge) | 12.204 ISK | 10.047 ISK |
| Abgerechnete Flugkosten von Nahrungsfahrten | 1.184 ISK | 1.184 ISK |
| Nahrungs-Händlerverkauf (belegte Einheiten) | 39 | 39 |
| Cyris: bezahlte neue Nahrung | 57 | 57 |
| Cyris: kumulativer fehlender Nahrungsbedarf | 251 | 251 |
| Cyris: Stationskasse | 5 ISK | 5 ISK |
| `minted` / `burned` | 1.440 / 6.440 ISK | 1.440 / 6.440 ISK |

**Kausal interpretierbar:** Die gewährte Hilfe erzeugt in diesem Fall einen zusätzlichen vorhandenen Händlerfrachter und 41 zusätzliche Handelsbuchungen, während die zusätzlichen **2.157 ISK abgerechneten Flugkosten** vollständig auf Fahrten ohne Nahrungsladung entfallen. Der gemessene Cyris-Nahrungsverbrauch und die bezahlten Nahrungsfracht-Lose ändern sich nicht. Somit zeigt diese konkrete Probe **keine Versorgungsverbesserung gegen die 693-ISK-Individualhilfe**. Das ist kein allgemeiner Nachweis, dass alle Ersatzinvestitionen unnötig wären oder dass eine bestimmte andere Regel langfristig stabil wäre.

### Negativkontrolle Seed42

In beiden Varianten kommt **kein Individualzuschuss** vor. Hashes bleiben über alle fünf Tage identisch, ebenso Händlerhandel, Frachterkosten und Cyris-Versorgung. Cyris endet mit 23 ISK Stationskasse, 111 bezahlten Neu-Nahrungseinheiten und 197 kumuliert fehlenden Einheiten. Damit stammt die beobachtete Seed7-Divergenz nicht von dem Testaufbau allein.

## Teststatus

- [CI, erster Code-Head `580b3cf`](https://github.com/tobiasfranziskus/Check/actions/runs/41433255419): Node-22-Testjob **120/120 bestanden**, 0 fehlgeschlagen, 0 übersprungen. Darin drei neue B-K9w-Tests: Seed7 5d, Seed42 5d und Seed7 48h-Replay. Geld-/Waren-/Herkunftsaudits und tägliche Save/Load-Prüfung ausgeführt.
- Nachfolgender Testcode-Commit `a4cfe71` ergänzt explizite Assertions für 39/38 reale Nahrungs-Einkaufslosen, 1184/602 ISK Flugkosten, die negativen -703/-128 ISK und Seed7-Versorgungsidentität. Dessen eigener CI-Status ist **gesondert** zu prüfen; der vorherige Lauf ersetzt keine erneute Bestätigung.
- Historische v10–v14-Referenzjobs im Workflow sind keine Regel15-Langzeitprüfung. Keine reale iPad-/NAS-Abnahme.

## Schlussfolgerung und nächstes Gate

**[BELEGT]** Positive Warenpreis-Arbitrage kann bei real finanzierter Frachterarbeit einen negativen Händler-Cashflow produzieren. Der vorhandene 693-ISK-Flottenzuschuss finanziert in der überprüften Seed7-Variante mehr Handlungsvorgänge, aber keinen zusätzlichen bezahlten Cyris-Endverbrauch. Eine automatische Individualrettung widerspricht dem beschlossenen Ziel der Selbstfinanzierung und ist keine nachgewiesene Versorgungslösung.

**[OFFEN]** Der autonome R15-Kreislauf bleibt über fünf Tage nicht nachhaltig. Offen sind insbesondere das tatsächlich tragfähige handelsseitige Routen-Finanzierungs-Gate inklusive Hin-/Rückflug und Ersatzrisiko, die Durchgängigkeit globaler Warenherkunft sowie eine marktweite Kaufkraft- und Betriebskapitalrechnung. Eine separate, kleine **Analyse** der Handelsentscheidung *einschließlich echter Fahrtkosten* ist das nächste plausible B-K9x-Gate. Erst danach darf eine Spielregeländerung mit Entscheidungsvorlage vorgeschlagen werden; keine Lohn-/Preis-/Emissionsreform ohne gesonderte Freigabe. 40 fortlaufende Perioden, 13×90d/365d und Krisenfälle stehen weiter aus.
