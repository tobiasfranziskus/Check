# W5s-n – Dritter Erztransport: Insolvenzursache und echte Flottenrücklage

**[DRAFT/ANALYSE · 06.11.2026]** Auf W5s-m (#216) gestapeltes isoliertes Regel32/Schema8-Profil. `main b4e604d6`, Spieler-Saves und produktive Regel14 bleiben unverändert. Kein Merge/Deployment.

## Unabhängig beobachteter Stillstand (Seed42/7)

Die bisherigen Schritte haben im 2-Tage-R32-Stressprofil **2 echte 50-Erz-Transporte (zweiter Tag59), 88 echte Eisfahrten und 4.316 real bezahlte Wasser** bis Tag90 ermöglicht. Erst gegen Tag120 fallen die letzten bezahlten R32-Frachter und -Miner aus. Der Spediteur hat **keine Frachterhülle** mehr und nur **480 ISK eigener Kasse**. Ein neuer Frachter erfordert **750 ISK Schiffskauf + 60 ISK Überführung + 120 ISK eigenes Fluglohnkapital = 930 ISK**. Es fehlen **450 ISK**, nicht nur eine falsch berechnete Fracht. Diese 120 ISK sind keine neue Gebühr, sondern nach der Überführung verfügbares Kapital für die nächste echte Fracht.

Die Erzversorgung ist ebenfalls nicht sofort vollständig: Aldera enthält weitere **20 bereits gekaufte Erz im Großhandel und 20 unverkäufte Erz im Stationslager**, d. h. **noch keine** neue komplette 50er-Transporteinheit. Der letzte normale NPC3-Erzminer besitzt später nur noch eine bereits geförderte volle **100-Eis-Ladung** und wird nicht mehr als Erzmine frei. Der letzte R32-Eisminer und der letzte R32-Versorgungsfrachter sind verschwunden. Nadir besitzt zu Tag120 zwar **3.038 ISK**, der Erzgroßhändler **19.800 ISK**, die externe Werft **3.560 ISK**, doch das sind **andere Rechtspersonen**. Ihre Mittel als Speditionskapital zu zählen oder wortlos umzubuchen wäre eine unzulässige Einzelrettung.

Ab Tag120 fehlen somit *gleichzeitig* (a) ein neuer, real vollständig finanzierter Frachter, (b) kurzfristig die vollständige neue 50er-Erzcharge und (c) langfristig bezahlte neue Endnachfrage. Schon (a) blockiert jeden weiteren eigenständigen Transport.

## Kontrollierte Geld-Rücklagen-Gegenprobe

Ein ausschließlich auf separatem Forschungshead `8bc1000c` getesteter, opt-in Weg behielt vor Dividenden 1, 2 oder 3 komplette Ersatzzyklen beim Spediteur. [Ausgeführter GitHub-Vergleich #42210099694](https://github.com/tobiasfranziskus/Check/actions/runs/42210099694), **2/2 Testgruppen grün** inklusive originaler vollständiger Tages-Core-Audits, realer Weltgeldsumme 33.000 ISK und Save/Load.

| R32-Reservehypothese 365d, Seed42 | echte Erzfahrten | bezahltes Wasser | Spedition Tag365 | ausgezahlte Frachtdividenden |
|---|---:|---:|---:|---:|
| 1 kompletter Folgezyklus (bisher) | 2 | **4.382** | 480 ISK | 9.260 ISK |
| 2 komplette Folgezyklen | 2 | 3.725 | 240 ISK | 7.130 ISK |
| 3 komplette Folgezyklen | 2 | 2.970 | 150 ISK | 4.610 ISK |

**[NEGATIV – HYPOTHESE VERWORFEN]** Übermäßige Gewinnthesaurierung schwächt die einzige wiederkehrende Endkundenkaufkraft und verringert den Wasserabsatz um 657 bzw. 1.412 Einheiten, ohne einen dritten Erztransport zu schaffen. Deshalb wurde der experimentelle `carrierRenewalCycles`-Code **wieder aus dem endgültigen W5s-n-Branch entfernt**. Kein verborgenes Default-Balancing und keine unnötige neue Produktregel. Die einmalig ausgeführte Gegenprobe ist mit diesem genau benannten historischen Head reproduzierbar; sie ist ausdrücklich **nicht** identisch mit der finalen Implementierung.

## Aufrechterhaltener kleiner Fortschritt: unabhängig prüfbares Insolvenz-Gate

Der bestehende **rein lesende** `w5sFinanzStatus(state,rules)` meldet jetzt auch `continuity`: Anzahl realer Eigentümerfrachter und freie Hüllen, vorhandene Firmenkasse, separate Preise für Schiff/Überführung/Fluglohn, Kapitalfehlbetrag, wirklich physisch vorhandene Werfthüllen und die **nur informativ ausgewiesenen**, rechtlich separaten Guthaben des Erzgroßhändlers und der Werft. Stufen: `flotte_vorhanden`, `neuer_frachter_eigenfinanzierbar`, `spedition_ohne_frachter_und_kapital`. Das ist ein transparenter späterer UI-/Übernahme-Vertrag, **keine** automatische Übernahme oder Transferanweisung. Jeder angezeigte Wert stammt aus dem vorhandenen gemeinsamen Core.

Die neue Prüfung muss sicherstellen, dass ein künstliches +450-ISK-Schreiben auf dem Carrier-Konto **unmittelbar** am Original-Gesamtaudit und am unabhängigen Eigentümer-Kassenaudit scheitert, ohne den eigentlichen Spielstand zu verändern. 13 Seeds ×90 Tage, Seed42/7 ×365 Tage, feste W5s-m-Referenzhashes, täglicher unabhängiger Gesamtgeld-/Warenabgleich, Save/Load, Replay und Vorlaufvergleich 7/30 Tage sind vorgesehen.

## Nachfolge-Option, keine freigegebene Wirtschaftsumstellung

**[OPTION/W5s-o]** Andere NPC-Konzerne dürfen nach einer belegten Insolvenz eigenständig in einen Markt eintreten, wenn sie dafür **wirklich eigene liquide Mittel** besitzen. Für einen neuen Logistikkonzern müssten Schiffsherkunft, gekaufter Frachter, bezahlte Überführung, Schiffseigentum, offener Frachtauftrag, echte gebundene Pilotenarbeit, Verkaufserlöse und späterer realer Verschleiß im *einen* Simulationskern zusammengeführt werden. Eine Kauf-/Charter- oder Lizenzregel für den bestehenden Erzgroßhändler wäre eine gesondert zu prüfende Produktentscheidung – **niemals** ein Gratisgeld-Transfer an `transport`, unbelegter Kredit oder nicht verschleißender Fremdfrachter.

Zusätzlich ist vor einem dritten 50-Erz-Transport eine wirklich verfügbare neue Charge bei einem bezahlbaren NPC-Mining-Auftrag nötig. Keine willkürlichen globalen Förderauftragsgrenzen und keine Waren-Neuerzeugung im Dispatcher. NPC3 darf scheitern; der Spieler darf unbegrenzt sparen.

**[OFFEN]** Ein dritter echter Transport und dauerhafter Wirtschaftskreislauf sind **nicht erreicht**. Vollständige JavaScript-Gesamtregression, iPad-Safari-/NAS-Abnahme und spätere W6-Balancierung sind getrennte Freigabeschritte.
