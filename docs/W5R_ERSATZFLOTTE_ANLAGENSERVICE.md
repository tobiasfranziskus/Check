# W5r – Ersatzhüllen, reale Verluste und finanzierte Wasserwerksinspektion

**[DRAFT/ANALYSE · 05.11.2026]** Gestapelt auf [W5q #197](https://github.com/tobiasfranziskus/Check/pull/197), **eigene Forschungsregel 32 / Save-Schema 8**, kein Eingriff in `main` (Regel14), keine Produktfreigabe für Verschleiß, Intervall oder Wartungspreis. Die isolierte Forschungswelt benutzt **denselben autoritativen Minuten-Core** und die vorhandenen Kaufbefehle, Geld-/Warenbücher und R31-Emissionsvarianten.

## Forschungsfrage

Genügen eine positive laufende Marge und ausreichend vorhandene ISK für eine jahrelang funktionsfähige Wasserversorgung, wenn **echte Ersatzhüllen** und **bezahlte Anlagenwartung** benötigt werden?

**Antwort [TESTBEFUND]: Nein.** Trotz ausreichender Speditionsliquidität können bei fehlendem Werftlager keine Frachter gekauft werden. Ebenso ist das endliche Miner-Schiffslager kein erneuerbarer Rohstoff.

## Bezahlte und physische Regeln – ausschließlich hypothetische Belastungsparameter

**Feste Forschungslebensdauern, keine beschlossene Produktregel:** aktiver Miner 15 Spieltage; Frachter 30 Spieltage; nur bei Dockzustand und ohne offenen Frachtervertrag. Das ist ein reproduzierbarer Verschleiß-Stresstest, **kein** realistisches Schadens- oder zufälliges Ausfallmodell. Weder Treibstoffverbrauch noch eine unsichtbare Reparaturleistung werden eingeführt.

- Beim fälligen echten Schiffsausfall wird die **bisherige Schiff-ID aus `state.ships` entfernt**. Nicht verkaufte Eisladung wird **nicht vergütet**, sondern physisch im `ledger.eis.consumed` ausgebucht und separat als `w5r.lostIce` dokumentiert. Alte R29-Mengenidentitäten wurden nur für diesen ausdrücklich dokumentierten Warenverlust erweitert. Ein aktiver Frachtvertrag darf nicht im Flug gekappt werden; das Ende eines Flugvertrags hat Vorrang.
- Ein Ersatz wird durch den bestehenden validierten **`shipBuy`-Befehl** an `st_aldera` erworben: Ein Miner kostet **600 ISK**, ein Frachter **750 ISK**. Nur wenn eine **wirklich vorhandene fertige Hülle** im Lager steht **und** der jeweilige Eigentümer genug ISK hat, entsteht ein neues Schiff mit neuer ID. Das ursprüngliche Schiff bleibt vernichtet; keine Gratisaktivierung, kein stiller Kauf auf Kredit.
- **Anfangslager nach dem ersten bezahlten Erwerb:** zwei Minerhüllen, **null Frachterhüllen**. Die NPC-Minerfirma kann später genau zwei tatsächlich bezahlte Ersatzminer kaufen, wenn finanzierbar; danach endet die Flottennachfolge. Trotz **1.250 ISK Transportkasse** am Tag30 ist ein Ersatzfrachter **nicht** verfügbar. Ein erneuter Kaufversuch am Folgetag darf keinen Schiffsbestand oder ISK erfinden.
- Die **stationäre Wasserwerksinspektion** ist alle 20 Spieltage fällig: **60 tatsächlich abgearbeitete Minuten zu 1 ISK je Minute**. Nadir muss vor Beginn **60 ISK tatsächlich in einem eigenen W5r-Arbeitsreservierungskonto sperren**. Erst danach wird Minute für Minute an das neue Arbeiterkonto bezahlt; während der Wartung wird kein konkurrierender `stationWater`-Befehl zugelassen. Fehlendes Geld blockiert den Wartungsbeginn und die folgenden Produktionsaufträge, ohne Zuschuss aus dem Nichts.
- Die Inspektion ist **ausschließlich bezahlte Arbeit**. **Keine Erneuerung der Wasserwerksanlage, kein Ersatzteilmaterial und keine physische Verschleißreparatur** sind hier nachgewiesen; diese vollständige Anlagenkostenstufe und ihr Materialtransport müssen gesondert finanziert werden. Die 60-ISK-Summe ist ein transparenter Forschungsparameter, **kein realer freigegebener Wartungspreis**.
- **W5q-Geldemission unverändert:** Default weiterhin **OFF**, keine neuen ISK. Vergleiche mit R31-Testexporten verwenden **ausschließlich** die zuvor isoliert erlaubten externen Emissionsparameter und dasselbe globale Mengen-/Tages-/Gesamtbudget. Emission erfolgt niemals wegen Insolvenz oder aufgrund eines fehlenden Ersatzschiffes.

**Ledger-Kontrollen:** Eigene R32-Belege für ausgefallene Schiff-IDs, Ladungsverluste, bezahlte Ersatzkäufe und Werftinventar sowie Wartungsreservierungen/-minuten. Original-W3-/W4-/W5-/W5n-/W5o-/W5q-Audits bleiben aktiviert. Neue Stationsausgaben für Wartung werden in allen betroffenen Besitzerkonten-Audits ausdrücklich als reale Auszahlung berücksichtigt. `ledger.miner.consumed=1+[House-Anfangsminer]+bezahlte Ersatzminer`, `ledger.frachter.consumed=1+bezahlte Ersatzfrachter`. Insgesamt `ΣCash=33.000+minted−burned`. Die neue `loadW5R`-Schnittstelle lehnt eine uninitialisierte oder manipulierte Regel32-Welt ab; ältere Saves bleiben getrennt und unangetastet.

## [TEST] 90 Spieltage – Seed 42

| Vergleich, echte R32-Welt | Intern wirklich verkauftes Wasser | W5q-Testemission | Physisch verlorene aktive Miner | Gekaufte Ersatzminer | Frachter verloren/ersetzt | Bezahlt für Wartungsminuten |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| NPC-Miner / vollständiger NPC-Rückfluss / keine Emission | **1.500** | 0 ISK | 3 | 2 | 1 / 0 | 240 ISK |
| NPC-Miner spart / keine Emission | 899 | 0 ISK | 3 | 2 | 1 / 0 | 240 ISK |
| NPC-Miner spart / Exporttest mit 3.500 ISK Haushaltserlös | 1.500 | 3.500 ISK | 3 | 2 | 1 / 0 | 240 ISK |
| **Spieler-Miner** spart / keine Emission | 789 | 0 ISK | 2 | 1 | 1 / 0 | 240 ISK |
| Spieler-Miner spart / Exporttest bis 7.000 ISK | 1.490 | **nur 4.340 ISK tatsächlich emittiert** | 2 | 1 | 1 / 0 | 240 ISK |

**Kontrast zur exakt gleichen W5o/R30-Welt ohne Verschleiß:** Seed42 voller NPC-Geldrückfluss verkaufte 4.316 Wasser in 90 Tagen. R32 verkauft mit den *hypothetischen Hüllenlebensdauern* nur 1.500. Das ist eine zusätzliche **physische Lieferkettenblockade** und kein Anlass für kostenlose Ersatzschiffe. Unter Spieler-Sparen und zusätzlicher externer Endkundennachfrage garantiert selbst ein 7.000-ISK-Testdeckel keine vollständige Versorgung. Die Emission fällt wegen ausgefallener realer Warenproduktion korrekt unter dem nominellen Maximalbetrag aus.

**R32-Tage 15/30/45:** Tag15 verschleißt `sh001` mit 100 Eis, wird im Warenbuch entfernt und als `sh003` für echte 600 ISK ersetzt. Tag30 verschleißt der erste bezahlte Frachter `sh002` am Dock, während bereits zwei Ersatzminer real gekauft wurden. In Aldera liegen nun 0 Miner und 0 Frachter. Tag45 verschleißt auch der letzte Ersatzminer; trotz vorhandenen NPC-Miner- und Speditionsgeldes gibt es **keine** Roh-/Fertigungshüllen mehr. Die originale Schiffbaukette muss diesen Bestand später physisch auffüllen.

## [TEST] 365 Spieltage – Seed 42

| Welt | Endabsatz Wasser | Bezahlte Wasserwerksinspektionen | Lohnkosten | Neue ISK | Freier Frachter nach Ausfall |
| --- | ---: | ---: | ---: | ---: | --- |
| NPC-Rückfluss vollständig | 1.500 | 18 | 1.080 ISK | 0 | Nein |
| NPC-Miner spart | 899 | 18 | 1.080 ISK | 0 | Nein |
| Spieler-Miner spart | 789 | 17 | 1.020 ISK | 0 | Nein |

Die Spieler-Miner-Variante kann eine weitere Inspektion wegen **unzureichendem Stationskapital** nicht mehr vorfinanzieren – korrektes Marktversagen ohne Gratisrettung. Bei NPC-Miner-Sparen bleiben nach 365 Tagen 59 ISK in Nadir, während die Spedition 1.250 ISK besitzt: Kapital existiert, sitzt aber **nicht dort und nicht als fertige Ware**, wo die Versorgung es benötigt.

## Tests und offene Grenzen

- **[DIREKT AUSGEFÜHRT] 8/8 neue gezielte Node-kompatible JS-Tests** bestanden: R31-Save-Isolation, realer Schiffskauf mit Werft-Einnahmebeleg, realer Ladungsverlust, Speditionskasse trotz fehlender Lagerhülle, 60-minütige Wartungsreserve und Arbeitsabrechnung, fünf 90-Tage-Welten, unabhängige Ledger-Fälschungstests und drei 365-Tage-Welten.
- **13 feste Seeds ×90 Spieltage** mit identischen unabhängigen Doppel-Replays, täglichen kompletten Core- und eigenständigen ISK-/Warenprüfungen, Save/Load an Tag30/60/90 und exakten Hashes direkt ausgeführt. **Keine zusätzliche Laufzeitabhängigkeit.**
- Seed42 R32 90d Vollrückfluss ohne Export: deterministischer Hash `b456ac67d9797566`, 1.500 verkauft, 3 Miner-Verluste, zwei bezahlte Ersatzminer, ein Frachterverlust, **null** Ersatzfrachter, 240 ISK Wartung, Gesamtgeld **33.000 ISK**.
- Seed42 365d: Vollrückfluss `334d7dbc14b2a9f0`; NPC-Sparen `7223fe9b3ce910f2`. Für Spieler-Sparen wird in den Tests der gültige R32-Save-Hash geprüft, keine unfreigegebene Referenz ersetzt.
- **Vollständige GitHub-CI separat bestätigen.** Echte iPad-Safari-/NAS-Abnahme bleibt offen. Forschung zeigt keine reale Verschleißwahrscheinlichkeit, Materialausfälle, Werftwiederanlauf-Logik oder Konstruktionskosten einer neuen Wasseranlage.

### Nächster zulässiger Schritt

**W5s [OPTION/ANALYSE]:** Echte neue Frachter- und Minerhüllen durch die bestehende, vollständig finanzierte Erz-/Silizium-/Bauteil-/Schiffbaukette bis zum tatsächlichen Wiederverkauf herstellen, statt weitere ISK zuzuschießen. Gleichzeitig eine erste physische Wasserwerks-Ersatzteil-/Materiallieferung von Nadir oder Aldera finanzieren, ohne Startmaterial zu verschenken. Erst wenn Eigentümer, Werft, Zwischenlager, Frachter, Endkunden und Piloteneinkommen zugleich zahlungsfähig bleiben, darf eine konkrete dauerhafte Emissionsregel als **[OPTION]** zur Produktfreigabe vorgestellt werden. Keine eigenmächtige Emission, kein Merge und kein Deployment.
