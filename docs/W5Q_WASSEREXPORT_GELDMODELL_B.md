# W5q – Physischer Wasserexport und testweise begrenzte ISK-Ausgabe

**Status: [DRAFT/ANALYSE] · 05.11.2026.** Isolierte Forschungsregel **31 / Save-Schema 8**, auf W5p ([PR #196](https://github.com/tobiasfranziskus/Check/pull/196)) gestapelt. Produktives `main` unverändert. **Keine Produktfreigabe für Emittent, Preis, Tages-/Gesamtbudget oder Exportdividende.** Alle nichtproduktiven Regeln bleiben auch in der Testwelt zunächst ausgeschaltet.

## 1. Fachliche Frage und entscheidende Unterscheidung

W5p belegte, dass bei frei sparenden Akteuren die Nachfrage mangels Haushaltskaufkraft zusammenbricht, obwohl 33.000 ISK weiter in der Welt vorhanden sind. W5q prüft erstmals im gemeinsamen Wirtschaftskern einen **separaten, nachweisbar realen Außenverkauf** von Wasser: Nur aus dem Nadir-Lager tatsächlich abgebuchte und im Warenledger als `exported` erfasste Einheiten dürfen in einer **explizit gewählten Forschungsvariante** einmalig einen Geldzufluss erhalten.

**Eine Einheit kann entweder:** an die Nadir-Wasserhaushalte verkauft und als `consumed` verbucht werden **oder** am Nadir-Exportterminal physisch ausgebucht und als `exported` an einen abstrahierten außerweltlichen Abnehmer übertragen werden. **Nie beides.** Der externe Abnehmer erhält keine kostenlos importierten Waren; die gesamte Rohwarenkette bleibt der vorhandene W5n-Kern mit bezahlten Minern, Hin- und Rückfracht und Wasserwerk. Eine zusätzliche externe Frachterroute nach dem Exportterminal, Frachtgefahr sowie externe Lager-/Dockgebühren sind **noch nicht modelliert**; ihre spätere Finanzierung bleibt offen. Für die Testwelt ist das Exportterminal eine sofortige Übergabe aus dem Stationslager.

## 2. Harte W5q-Gates (nur Forschungsregel31)

- **Default OFF:** `createW5QState()` startet mit `mode:off, rate:0, dayCap:0, totalCap:0`, also **keine** neue ISK. Erst bewusst ausgewählte isolierte Testprofile aktivieren den Außenhandel.
- **Reale Lieferware:** Einmal am Ende eines Spieltags dürfen höchstens zehn tatsächlich vorhandene Nadir-Wasser aus dem physischen Lager entfernt werden. Der Core verbucht im selben Tick `ledger.wasser.exported += n` und reduziert das reale Lager um `n`. Der reguläre Wasserverbrauch kann diese Einheiten nie zusätzlich abnehmen.
- **Begrenzte Testausgabe:** Die Forschungsprofile lassen nur `rate=7` oder `14 ISK` je exportiertem Wasser, `dayCap=70/140 ISK` und `totalCap=1400/3500/7000 ISK` zu. `n <= min(10, vorhandene Ware, floor(noch frei/Rate))`. Diese Zahlen sind **Hypothesen für Gegenproben**, keine freigegebenen Preise oder Produktbudgets.
- **Genau ein Beleg je Tag:** `{tick,day,units,amount,mode}` wird in `state.w5q.events` gespeichert. `lastExportDay` sperrt einen zweiten Aufruf desselben Ticks; der R31-Audit prüft Tick-Eindeutigkeit, Tages- und Gesamtbudget, Gebührenhöhe, Provenienz über das Lager-/Warenledger und genau einen Geldemissionsbeleg.
- **Zahlung an Station:** Bei `station` werden ausschließlich `state.minted += betrag` und Nadir-Kassen-/Erlöskonto erhöht. Kein Haushalts-Zuschuss.
- **Testweise Weiterverteilung:** Bei `household` erfolgt dieselbe **einmalige** Emission an die Stationskasse und ein **normaler, direkt folgender Transfer** aus dieser Kasse an die abstrakten Wasserhaushalte. Auf Welt-Ebene entstehen **nur die exportbelegten ISK**, nicht zweimal Geld. Dieser Test ist eine **hypothetische, allgemeine Exporterlös-Ausschüttungsregel**, keine Rettung bei leerem Konto oder individuellem Konkurs.
- **Kein Einzelrettungs-Trigger:** Emission und externer Absatz richten sich ausschließlich nach tatsächlicher Ware, Tick, konstantem Profil und globalem Restbudget; **nie** nach NPC-/Spieler-/Stationskasse, Bankrott, Preisniveau oder entgangenem Umsatz. Unternehmen dürfen scheitern, Spieler dürfen unbegrenzt sparen. Der unter W5o modellierte vollständige oder eingeschränkte Gewinnrückfluss bleibt getrennt wählbar.
- **Save-/Audit-Schutz:** Regel31/Schema8 getrennt von Regel30 und allen älteren Regelversionen. Altsaves werden weder verändert noch ohne Freigabe migriert. Alte Wirtschafts- und Flottenaudits bleiben aktiv, R31 ergänzt nur die konkret nachgewiesenen ISK, Exportmengen und zulässigen Transfers; `Σcash = 33000 + minted - burned`.

## 3. Tatsächlich ausgeführte Ergebnisse

Alle Läufe verwenden denselben Seed42, denselben auf eigene Rechnung zahlenden NPC-Miner und den Modus **`npcSave`** (Miner darf Gewinne behalten), dieselben anderen W5o-Arbeitseinkommen und NPC-Dividenden. Weiterleitung an Haushalte bedeutet hier **100 % des externen Erlöses**, nicht eine zweite externe Vergütung. Es handelt sich um **testweise Emissionen innerhalb R31**, ausdrücklich **nicht** um die Einführung in `main`.

| Variante | Exportierte Wasser | Kumuliert ausgegebene ISK | Bezahlte interne Wassereinheiten in 365 Tagen | Letzter Tag mit internem Wasserkauf |
| --- | ---: | ---: | ---: | ---: |
| Default OFF | 0 | 0 | 789 | 17 |
| Station erhält Exporterlös, Tagesdeckel 140 / Gesamtdeckel 3.500 | 250 | 3.500 | 1.533 | 33 |
| Haushalte erhalten Exporterlös als Transfer, 140 / 3.500 | 250 | 3.500 | **1.872** | 40 |
| Haushalte erhalten Exporterlös als Transfer, 140 / 7.000 | 500 | 7.000 | **2.775** | 58 |

Die 365-Tage-Gesamtgeldmengen sind exakt **33.000 / 36.500 / 36.500 / 40.000 ISK**. In jeder Variante sind Geld- und Warenledger einschließlich extern exportierter Wasser ohne Differenz; `burned=0`.

**[TESTBEFUND]:** Der Empfänger ist wirtschaftlich wesentlich: Die 3.500-ISK-Stationsemission steigert die bezahlte Grundversorgung auf 1.533 Wasser, während eine echte allgemeine Weiterverteilung desselben Betrags auf Haushalte 1.872 Wasser ermöglicht. Aber selbst 7.000 ausschließlich durch physisch exportierte Wasser entstandene ISK retten den Konsum nur bis Tag 58, **nicht dauerhaft bis Tag 365**. Der gesamte Deckel ist dann verbraucht; kein Konzern erhält einen Nachschuss bei Bedarf.

**[TESTBEFUND]** Rate 7 ISK, Tagesdeckel 70 und Gesamtdeckel 3.500 liefern in der 90-Tage-Gegenprobe **nur 348 real exportierte Wasser / 2.436 tatsächlich ausgegebene ISK**; übriges theoretisches Budget bleibt ungenutzt. Das ist korrekt: **Ohne reale Ware wird nicht emittiert**. Die 90-Tage-Gegenprobe mit Rate 14 und Gesamtdeckel 3.500 verbucht **250 physische Exporte**, **3.500 neue ISK**, 25 eindeutige Tagesbelege und 1.872 Wasser an Haushalte, statt 789 ohne Export.

### Spieler spart – gleiche Import-/Exportregel, kein Zugriff auf seine Kasse

Zusätzliche **direkt ausgeführte, vollständig auditierte 90-Tage-Gegenprobe**, Seed42 mit einem **aus eigenen 600 ISK bezahlten Spieler-Miner**, dessen Gewinn nicht zwangsweise ausgeschüttet wird:

| Außenverkaufs-Profil | Wasserkäufe intern | Neue ISK | Spieler-Endkasse |
| --- | ---: | ---: | ---: |
| OFF | 733 | 0 | 4.750 ISK |
| Station bekommt 3.500 ISK | 1.479 | 3.500 | 7.750 ISK |
| 3.500 ISK an Haushalt weitergeleitet | 1.780 | 3.500 | 8.650 ISK |
| 7.000 ISK an Haushalt weitergeleitet | 2.722 | 7.000 | 12.250 ISK |

Alle vier Weltgeld- und Warenaudits sind korrekt; die Nachfragesicherung gelingt jedoch auch in der höchsten getesteten Variante **nicht**. Gleichzeitig darf der Spieler weiter sparen und verdient durch den wiedergewonnenen Handel. Dieser zusätzliche Sparabfluss zeigt, warum **die Auszahlung neuer ISK an Haushalte allein keine dauerhafte Kreislaufgarantie** ist. Diese House-Gegenprobe verwendet wie W5o eine zusätzliche real gekaufte House-Minerhülle gegenüber der NPC-Variante und ist deshalb keine exakt identische Flotteninventar-Simulation.

### Prüfungen

- **7/7 neue Kernprüfungen direkt ausgeführt und bestanden:** Default-OFF, R30-/Altsave-Schutz, echte einmalige Außenlieferung, Station-vs.-Haushalt-Gegenprobe, Tages-/Gesamtdeckel, physischer Knappheitsfall, 12 zielgerichtete Geld-/Waren-/Beleg-Fälschungen sowie Wiederholungsangriff desselben Ticks.
- **13 feste Seeds ×90 Tage** mit **separatem deterministischem Doppel-Replay**, täglichem vollständigem unabhängigen Geld- und Waren-Audit, Save/Load an Tag 30/60/90 und eindeutigen Exportbelegen: erfolgreich.
- **Vier Seed42-Szenarien ×365 Tage**, jeder Tag auditiert; die hier dokumentierten Endwerte und Hashes wurden **nach dem behobenen Doppelbuchungsfehler erneut unabhängig** aus dem unveränderten Rechenkern nachgerechnet.
- Hashes Regel31 Seed42/Tag365: OFF `a70646bfe8bbc428`; Station 3.500 `5198e94f7e86806a`; Haushalte 3.500 `d3cc977cfebdf7c5`; Haushalte 7.000 `5d2bb4b20ae305c2`.
- Der ursprüngliche neue Test entdeckte einen zweiten Auszahlungsvorgang bei doppeltem Tagesaufruf. **Der Fehler wurde durch gespeicherten `lastExportDay`-Beleg korrigiert und der Wiederholungsangriff anschließend grün getestet.** Nicht nur die erwarteten Test-Hashes wurden angepasst, sondern erneut echte Güter-/Geldbilanzen, Tagesbelege und Szenarien berechnet.
- Die vollständige GitHub-Node-22-CI ist nach PR-Erstellung gesondert zu prüfen; echte iPad-Safari-/NAS-Abnahme bleibt offen.

## 4. Wirtschaftliche Folgerung – noch keine freigegebene Modell-B-Regel

Die Daten erlauben eine strengere Aussage als W5p: **Ein physisch und monetär korrekt begrenzter Außenhandel ist möglich.** Ebenso nachgewiesen ist aber, dass eine einmalige endliche Emission den strukturellen Sparabfluss nicht allein beseitigt. Würde man einfach die Emissionsrate oder das Gesamtbudget erhöhen, ohne Schiffs-/Werft-Finanzierung und langfristiges Geldumlaufverhalten zu prüfen, wäre das keine seriöse Wirtschaftsreparatur.

Für einen späteren Produktbeschluss müssen noch getrennt bestimmt werden:

1. **Echter Exportort/Route:** Nadir-Übergabe oder Meridian-Hafen und ggf. eine zusätzlich bezahlte Dritt-Fracht; Frachtkosten, Besitzübergang, Schiffsausfall und Verlust der exportierten Ware
2. **Globaler Emittent und Gesamtbudget:** Auswahl einer _kleinen_ auf reale Exporte begrenzten Regel inklusive Zeit-/Gesamtdeckel, gemeinsamer Obergrenze für Jagdprämien und später seltene Funde
3. **Empfängerkonzept:** ausschließlich Stationskasse, Eigentümerüberschuss, öffentliches Haushaltskonto oder Mischverteilung – mit vollständigem Transferprotokoll, ohne Bedürftigkeitszuschuss
4. **Nicht ausfechtbarer Zufall:** Kein Exportanspruch auf Eis/Wasser ohne physisch bezahlte Produktion und rechtzeitige Übergabe
5. **Marktresilienz:** Spieler spart, NPC spart, NPC-Insolvenz, Produktionsstillstand, Schiffverlust, Reserve-/Ersatzhüllen, weitere Systeme und vor allem Langzeitbilanz; keine Senken/Emissionen für dasselbe Gut zweimal

**Empfehlung [ANALYSE]:** W5r sollte zunächst die **wiederkehrend notwendige Flotten-/Anlagenersatzfinanzierung** und eine global begrenzte, *nicht unbegrenzt kumulative* externe Nachfrage simulieren. Dabei das Risiko absichtlich vorhandener Insolvenzen akzeptieren. Eine weitere Produktregel zu Geldmodell B bleibt ausdrücklich **[OPTION]** und erfordert eigene Freigabe.
