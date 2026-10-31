# B7e – Wiederanlauf durch finanzierte Flotteninvestition? Kapitalpfad der Siliziumroute

**31. Oktober 2026 · [ANALYSE/DRAFT], kein Eingriff in den Simulationskern.** Der verbindliche Plan bleibt **`docs/ROADMAP.md` auf `main`**; das in [Draft #55](https://github.com/tobiasfranziskus/Check/pull/55) entwickelte Rollen-/Flottenziel: NPC-Piloten besitzen persönlich keine Schiffe, Konzerne kaufen und verpachten Flotten, der Spieler darf persönlich Schiffseigentümer werden. B7e untersucht **noch keine Pachtverträge oder neuen NPC-Piloten**, sondern nur, ob ein bereits kapitalisierter Konzern mit realer Frachterhülle und Ware überhaupt in eine belegte Gewinnchance eintreten könnte.

## Ausgeführte Analyse und Qualität

**[TEST] [CI #41197603944](https://github.com/tobiasfranziskus/Check/actions/runs/41197603944) erfolgreich, 1/1 Job, 67/67 Node-Standardtests.** Vier unveränderte Welten Seed42 (Regel14-Kontrolle und B7b-Kontenvariante je 10 und 90 Tage), dieselben sieben historischen Spielerbefehle mit einem zusätzlichen, dokumentierten Spieler-`shipFund`-Befehl nur in der Wallet-Variante. Bestehende **4.800 unabhängige Stunden-Geld-/Waren-/Hash-Audits**, **200 Tageshashes**, **44 Save/Load-Roundtrips**, **340 B7c-stündliche reine Beobachtungsbilder** und vollständige B7d-Angebotsmessungen erneut erfolgreich. B7e ergänzt **10 völlig zustandsneutrale Tagesbilder**: Tage10/11/12/15 je Kontroll-/Wallet-90d-Lauf sowie Tag10 der beiden 10d-Läufe, mit Wiederholung/Identitätsprüfung Tag10 10d vs. 90d. Beide originalen und experimentellen 90-Tage-Referenzhashes unverändert (`784047684dfe5c56`, `82f11deee8c7f566`; Kontrolle Tag10 `84f1a88d2701ff2a`).

Verwendet ausschließlich bestehende `m_core_preis.preis`, `m_core_handel.{gebuehr,verkaufbar,obergrenze}`, `m_core_route.route`, echte Kassen und Lager. Die hypothetische real bezahlte Schiffstransaktion berücksichtigt exakt den beobachteten Core-Pfad `m_core_schiffbau.ersatzkauf` → `m_core_handel.handel`: `st_aldera` erhält **750 ISK echten Warenpreis**, zusätzliche **30 ISK Gebühr** gehen bei einer neutralen Station an den regionalen Fonds (bei einem Stationseigentümer stattdessen auf die Stationskasse). **Keine ISK-Schöpfung.** Der Rest des Tests berechnet nur ein *hypothetisches* Folgeangebot nach dieser Einnahme. Es wurde **kein Schiff gekauft, keine Route neu gefahren, kein NPC-Owner umgestellt und keine neuen Piloten aktiviert**. Preis-, Gebühr-, Reserve-, Flugkosten- und Nachfrageroutinen im Produkt sind unverändert; die Berechnung garantiert **keine** spätere Verkaufsdurchführung zum eingefrorenen Preis.

## Reale Einzelbilanz am Ende von Tag15 (B7b, Seed42)

Aldera besitzt **zwei verkaufbare fertige Frachter** (Preis 750 ISK/Stück, Kaufgebühr 30 ISK, zusammen **780 ISK**), die direkte Route Aldera → Dravos braucht 20 Minuten; Dravos → Aldera ebenfalls 20 Minuten, jeweils **250 ISK angesetzte Arbeitskosten** bei voller Stundenabrechnung. Die Siliziumpreise der read-only Momentaufnahme sind Dravos **17 ISK/Stück** und Aldera **43 ISK/Stück**. Der Frachter besitzt maximal 100 Frachteinheiten.

| Position | Ohne neu gekauftes Schiff (B7d) | Nach real bezahltem Hüllenkauf, bei sonst gleichem Markt (B7e) |
| --- | ---: | ---: |
| Alderas Stationskasse **vor** Schiffsverkauf | 1.603 ISK | 1.603 ISK |
| Stationseinnahme aus verkauftem Frachter | 0 ISK | **+750 ISK** |
| Alderas Kaufkraft zum Zeitpunkt des Siliziumverkaufs | 1.603 ISK | **2.353 ISK** |
| An Käuferkasse und Lagerkapazität angepasste Siliziummenge | **37** | **54** |
| Silizium-Einkauf + Einkaufsgebühr | 629 + 25 = **654 ISK** | 918 + 36 = **954 ISK** |
| Arbeit für beladene Fahrt Dravos → Aldera | **250 ISK** | **250 ISK** |
| Verkaufserlös abzüglich Verkaufsgebühr | 1.591 − 63 = **1.528 ISK** | 2.322 − 92 = **2.230 ISK** |
| Kalkulierter Überschuss **einer beladenen Fahrt** | **+624 ISK** | **+1.026 ISK** |
| Zusätzlich Frachterkauf inkl. Gebühr | – | **780 ISK** |
| Zusätzlich Leerfahrt Aldera → Dravos | – | **250 ISK** |
| **Vorab benötigtes freies Konzernkapital**, inklusive sämtlicher Ausgaben | – | **2.234 ISK** |
| **Bargeldänderung des neuen Eigentümers nach erster Lieferung**, nach Hüllenkauf und Leerfahrt | – | **−4 ISK** |
| Weiterhin im Eigentum des Konzerns | vorhandenes Schiff nötig | **ein real bezahlter Frachter** |
| Aldera Stationscash nach vollem hypothetischem Siliziumkauf | **12 ISK** | **31 ISK** |

**Wichtig:** Das vorherige B7d-`37 Stück/624 ISK`-Angebot ist korrekt **ohne** zusätzlichen Frachterkauf. **Nach** einem tatsächlich bezahlten Hüllenkauf muss die Käuferkasse neu kalkuliert werden: 750 ISK stationärer Geldzufluss erhöhen Alderas Finanzierbarkeit auf 54 Einheiten. Die ursprüngliche Zahl **„nach einem Frachterkauf bleiben 12 ISK“ wäre falsch**: Nach dem hypothetischen 54er Verkauf wären es **31 ISK**. Auch dann kann Aldera **keine weitere Siliziumeinheit zu 43 ISK** finanzieren, sofern keine neuen Zahlungseingänge entstehen. Der scheinbare fast sofortige Kapitalrückfluss ist somit **eine einmalige, kapitalfinanzierte Gegenwirkung des Schiffskaufs**, noch **kein nachgewiesener dauerhafter Handelskreislauf**.

## Eigentümerseitige Finanzierbarkeit am Ende Tag15

| Akteur (Konzernkonto, kein NPC-Pilot-Privatkonto) | Frei verfügbare Kasse | 780-ISK-Schiffskauf? | 2.234 ISK kompletten Einstieg decken? |
| --- | ---: | --- | --- |
| NPC1 – Handelskonzern | **2 ISK**, daneben 181 ISK bereits im Schiffskonto gebunden | Nein | Nein |
| NPC2 – Handelskonzern | **744 ISK**, kein Schiff mehr | **Nein – 36 ISK fehlen** | Nein – **1.490 ISK fehlen** |
| **NPC3 – Bergbaukonzern** | **4.353 ISK** | Ja | **Ja** |
| Spielerhaus | **37.602 ISK** | Ja | **Ja**, ohne Zwangsentnahme |

Alderas regionaler Fonds ist beim untersuchten Tag15 **0 ISK**, die frühere tatsächliche `zuschuss`-Routine könnte den NPC2-Mangel von 36 ISK hier also **nicht** decken. Der bestehende automatische `ersatzkauf` repariert nur offene Sollplätze eines Eigentümers; **NPC3 mit neun Minern ist nicht als Frachtereigentümer/Handelsinvestor eingeplant**. Daher investiert das tatsächlich vorhandene Kapital von NPC3 nicht in das Geschäft; dies **ist kein Beweis**, dass ein vorgesehener Marktteilnehmer trotz Kapital und Auftrag unzulässig am Handel gehindert wird, sondern belegt die **fehlende Fähigkeit zur branchenübergreifenden Marktinvestition**. Spielerbesitz ist ausdrücklich nicht gleich eine automatisch verfügbare NPC-Subvention.

**Wirtschaftlicher Vorbehalt:** NPC3s Kasse ist nicht automatisch freier *Gewinn* – seine Miner brauchen weiter volle Arbeits-/Verlustreserve, und seine neun Miner stehen am Kollaps bereits mit vollen Warenladungen. Ein vollständiger Investor prüft daher zuerst die Überlebensfähigkeit des **bestehenden** Konzerns nach der Investition. Der Status „2.234 ISK vorhanden“ ist eine **Finanzierungsfähigkeit ohne Liquiditätsstressprüfung**, nicht eine Freigabe zum Kauf. Bei tatsächlicher Umsetzung muss die **erste** Schiffsinvestition und spätere Pfand-/Pacht-/Pilotenzahlung mit einem einzigen `ship.owner` und genau gebuchten Transfers arbeiten; NPC-Piloten kaufen keine Schiffe privat.

## Konsequenz, nicht mit Produktfreigabe verwechseln

**[BEWERTUNG]** Eine mögliche neue Strategie heißt nicht „NPC1/NPC2 retten“, sondern **ein bereits solventer Konzern kann eine erkannte, reale Marktlücke mit eigener Hülle und betriebsbereitem Schiff bedienen**. Die beste isolierte Folgeprüfung wäre **ein** wirklich ausgeführter Kapitaltransfer aus `npc3` mit regulärem Schiffskauf, realem Leerflug, Siliziumeinkauf, bezahlter Frachtfahrt und tatsächlich abgerechnetem Verkauf, gegen die unveränderte Seed42-B7b-Kontrolle. Anschließend den Effekt auf Käuferkassen, Produktion und Minerkasse verfolgen, **ohne** zugleich eine Piloten-/Pacht-, Preis-, Grundnachfrage- oder neue Geldschöpfungsregel einzuführen. Dabei muss ein Pachtpilot als **Steuerungsquelle**, nicht als neuer kostenloser Schiffseigentümer gedacht werden. Erst positive tatsächliche Seed42-Folgeergebnisse rechtfertigen einen größeren Mehrseed-/90-Tage-Test. Die Endverbraucher-Nachfrage bleibt ein separates Problem; 31 ISK nach einem Kauf finanzieren keinen zweiten gleichartigen Abverkauf.

**[STATUS]** Ausschließlich Analyse-Draft [#60](https://github.com/tobiasfranziskus/Check/pull/60). `main 517728a9` unverändert, Produkt-`index.html`/Regel14/Schema8, Save-Migration, iPad Safari und NAS unangetastet. Kein Merge, keine Veröffentlichung.
