# W6 Gesamtwirtschaft [FORSCHUNG]

Basis dieses Drafts ist `main d23a1e95427f77c4dcb5634061189ed873421fb4`. Das zusätzliche Profil läuft über Node und hat eine eigene gespeicherte Profilkennung. Der Treiber übernimmt die nachgewiesenen Anfangskassen aus einer validierten U7/U8-Kopie. Das Regel204-Spiel und die U7/U8-Referenz werden über ihre bestehenden Ladepfade betrieben.

## Umsetzung

- #625 und #638 liefern den finanzierten W3/W4/W5-Kreislauf, die freiwillige kombinierte Wasser-Rückfracht und die Mindestkapazitätsprüfung. Übernommen wurden die betreffenden Kernänderungen und die zugehörigen Regressionen.
- Die Methode aus #645 und #648 wurde im Forschungsprofil für Haus- und NPC-Angebote zusammengeführt. Geeignete Schiffe werden nach Restaktivzeit und bei Gleichstand nach Schiffs-ID geordnet. Ein eingesetztes Paar muss auf einer Same-Tick-Kopie über die Originalsignaturen, die volle bezahlte Hin- und Rückfahrt und die Fertigstellung der reservierten Hülle gelangen. Die Prüfung ist auf 360 Wirtschaftsminuten begrenzt, ein offenes Ergebnis gilt als Ablehnung. Die Zusage des Hauses bleibt freiwillig, der Originalkäufer prüft vor der Bindung erneut. Die Automatik veröffentlicht nur bestätigte Paare und prüft weitere Kombinationen bei Ablehnung. Prüfungen werden an regelmäßige Zeitpunkte und neue Dockfenster gebunden.
- Die bezahlte K2-/W5-Ersatzkette arbeitet mit Originalkassen, existierenden Hüllen, Arbeit und physischen Flügen. Ein Frachter muss die bezahlte Runde vollständig leisten können. Abschreibung eines für die Spedition ausgedienten Frachters kann nach dem realen Ersatzkauf aus der Ersatzrücklage fallen. Der Forschungstreiber kann den Kauf der letzten Hülle freiwillig verschieben, wenn die Spedition sie benötigt und Kauf, Überführung und Arbeit bestreiten kann. Die Forschungsstrategie nutzt 60 Prozent als Kandidaten. Die absichtliche 80-Prozent-Variante S11 bleibt als eigenes Krisenregime erhalten.
- #583, #584, #580 und #585 liefern Original-Leerstorno, physische Erzreservierung gegen Export sowie Teilabrechnung und volle Dockabnahme. Leere, unbezahlte, stillgelegte Fälle dürfen über den Originalkäufer storniert werden. Für Ladung bleiben die zwei auditierenden Kopieverfahren mit zustandsgebundener Zustimmung sämtlicher Vertragsparteien bestehen. Ein voll geladenes Schiff kann am Dock rechtmäßig liefern, ohne weiteren Flug des stillgelegten Miners. Die Forschungsautomatik fingiert keine Zustimmung für tatsächliche aktive Verträge.
- Zivile K2-/W5-Ersatznachfrage hat im Kandidaten Vorrang vor spekulativem NPC-Jägerbau. Originalbefehle für manuell finanzierte Produktion und persönlichen Hauskauf sind weiterhin verwendbar. Die Abschlussprobe versucht den bestehenden persönlichen 900-ISK-Kauf auf einer validierten Kopie. Ein Kaufbeleg erfordert realen Bestand, Deckung, Händlererlös und Eigentumsnachweis. Zahlungsfähigkeit allein begründet keinen wiederkehrenden Kaufwunsch. Ein verbindlicher Vorauftrag oder ein dauerhafter wirtschaftlicher Einsatznutzen für Jäger bleibt eine Produktentscheidung.

## Verifizierte historische CI

| PR | Nachweis | Bedeutung |
| --- | --- | --- |
| [#625](https://github.com/tobiasfranziskus/Check/pull/625), [#638](https://github.com/tobiasfranziskus/Check/pull/638), [#639](https://github.com/tobiasfranziskus/Check/pull/639) | 11/11, 8/8 und 2/2 Workflows erfolgreich auf den jeweiligen Head-SHAs. [#639-Matrix](https://github.com/tobiasfranziskus/Check/actions/runs/45710006937) 3/3. | Physische Kreisläufe und notwendiger Kapazitätsfilter, weiterhin S02-Folgestillstand. |
| [#643](https://github.com/tobiasfranziskus/Check/pull/643), [#644](https://github.com/tobiasfranziskus/Check/pull/644), [#645](https://github.com/tobiasfranziskus/Check/pull/645), [#646](https://github.com/tobiasfranziskus/Check/pull/646) | Je 2/2 Workflows erfolgreich. | Silizium bindet Miner und Material, 57 Restminuten reichen für nur 47 Erz, letzte Eisfahrt aussetzen schafft keinen Ersatz. |
| [#647](https://github.com/tobiasfranziskus/Check/actions/runs/45814118357) | 6/6 Matrixjobs erfolgreich, P0 ebenfalls erfolgreich. | S02/60/Silizium an: 1016 Eisfrachten, 20 W3, 50.810 Wasser, 50 Frachter, 45 gelieferte Miner, 93 Ersatzkäufe, ein unverkaufter Jäger an Tag 90. |
| [#648](https://github.com/tobiasfranziskus/Check/actions/runs/45814533665) | Forschungsjob und P0 erfolgreich. | Nach 1153 Wiederholungen im Kontrollarm übernimmt sh044 im Kandidaten den Auftrag. Wirklicher 50-Erz-Transport mit sh004, Tick 60492–60612, 120 ISK Lohn und 240 ISK Tarif. |
| [#649](https://github.com/tobiasfranziskus/Check/actions/runs/45814816763) | Beide Langzeitjobs und P0 erfolgreich. | Tag 365 und 730 gleichauf bei 2849 Eisfahrten, 54 W3 und 142.450 Wasser. Letzter W3 Tick 354191. 1390 ISK gebunden, aktiver Vertrag mit angenommener Erzcharge. Null Fortschritt zwischen 365 und 730. |
| [#579–#585](https://github.com/tobiasfranziskus/Check/pull/585), [#587](https://github.com/tobiasfranziskus/Check/pull/587), [#590–#592](https://github.com/tobiasfranziskus/Check/pull/592) | Forschungsjobs 1/1, 1/1, 1/1, 21/21, 7/7, 5/5, 18/18, 7/7, 7/7, 3/3, 5/5. #586 ist Dokumentation, #588 und #589 betreffen Spielpfad bzw. Inventur. | Teilabrechnung ist mit physischer Ware und Zustimmungen möglich. 49/50-Exportkonflikt belegt. Allgemeiner Reservekauf erwies sich als nachteilig. Freiwilliger gezielter Hausaufschub in #592 brachte im damaligen Profil echte Folgekäufe und 8285 Eisfrachten bis Tag 730. |

Die gepinnten S02-42-Hashes für #649 lauten `19f89c50daadc124` (7), `6091f983a74a53af` (30), `452d5222e5b38709` (90), `45aef2492bd627cb` (365) und `2d68de45bc6a53b8` (730).

## Abnahme und Integrationsstatus

```sh
node --test tests/*.test.mjs
node tools/w6-gesamtpaket.cjs S02 730 42 gesamt
node tools/w6-gesamtpaket.cjs S02 730 42 60
```

Die Matrix führt alle 13 Regime mit Seeds 42, 7 und 113 gepaart mit Regel204 und U7/U8 aus. Die S02-Langzeitläufe vergleichen den Kandidaten mit dem unveränderten 60-Prozent-Siliziumarm. Jeder Matrixlauf führt einen exakten Replay aus. Kontrollpunkte prüfen Core-Audits, unabhängig summiertes 33.000-ISK-Weltgeld, Mint/Burn, Waren, Vertrags- und Eigentumsbelege und Save/Load. Für den Kandidaten werden die letzten 30 und 7 Tage gesondert erfasst. Aktueller Stand der neuen Abnahme folgt in diesem Draft.
