# W5p – Kaufkraftlücke unter Sparfreiheit: Messung und Geldmodell-B-Vorentscheidung

**[ANALYSE/DRAFT] 05.11.2026, gestapelt auf W5o [#194](https://github.com/tobiasfranziskus/Check/pull/194).** Analyse nutzt **unveränderten Regel-30-/Schema-8-Core**. `main` bleibt Regel14/Schema8, es wird **keine** Geldemission, Preis-, Eigentums-, NPC-Ausschüttungs-, Produktions- oder Kaufregel geändert. Vorliegende Arbeit ergänzt ausschließlich eine pure, lesende Diagnoseroutine unter `analysis/`, reproduzierbare Node-Tests und Dokumentation.

## 1. Die stündliche Trennung der beiden Engpässe

`analysis/w5p-kaufkraftanalyse.mjs` erhält den aus `index.html` extrahierten Original-Core als Parameter. Es führt exakt die bestehenden R30-Ticks und die R30-Szenarien aus, **ohne** selbst Geld oder Waren zu bewegen. Je Stunde werden unmittelbar vor dem echten Verbrauch die physische Wassermenge (einschließlich gegebenenfalls in der letzten Minute abgeschlossener Produktion) und die echte verfügbare Haushaltskasse ermittelt. Die anschließend **wirklich** gebuchte Menge muss exakt

`min(2 Wasser/Stunde, vorhandenes Wasser, floor(Kunden-ISK / 14))`

entsprechen; andernfalls schlägt die Analyse fehl. Jede nicht erfüllte Stunde wird in *nur Ware*, *nur Kaufkraft* oder *beides* getrennt. Tagesende: ursprünglicher Core-Audit, unabhängige Gesamtgeldkontrolle, deterministischer Hash; Save/Load an Tag 30, 60, 90 bzw. 180/365.

### Seed42: 90 Tage, 2 Wasser je Stunde, 14 ISK je Einheit

| Tatsächliche R30-Variante | Erster finanzieller Mangel (Stunde) | Tatsächlich bezahltes Wasser (max. 4.320) | Stunden nur ohne Kaufkraft | Stunden nur ohne Ware | Ausgefallener Nominalumsatz in 90 Tagen |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kein Rückfluss | 53 | 100 | 2.108 | 2 | 59.080 ISK |
| Nur bezahlte Löhne | 148 | 310 | 2.004 | 2 | 56.140 ISK |
| NPC-Miner spart, übrige NPCs schütten aus | 396 | 789 | 1.764 | 2 | 49.434 ISK |
| Vollständiger NPC-Rückfluss | – | 4.316 | 0 | 2 | 56 ISK |
| Spieler-Miner spart, eigener bezahlter Zusatzminer | 369 | 733 | 1.792 | 2 | 50.218 ISK |

**[TESTBEFUND]** Nach zwei materiellen Anlaufstunden verursacht in allen wirtschaftlich abbrechenden Szenarien **ausschließlich fehlende unmittelbare Kaufkraft** die weiteren Mangelstunden; das Wasserlager ist zu diesen Zeitpunkten nicht erschöpft. Beispiel NPC-Sparvariante Tag90: 31 Wasser liegen in Nadir, die Endkunden besitzen noch 9 ISK, für eine Einheit werden aber 14 ISK benötigt. Der letzte erfolgreiche Wasserabsatz erfolgt in Stunde 397, danach keiner mehr. Die Gesamtgeldmenge beträgt weiterhin **33.000 ISK**, nicht null.

**Ausfall gegenüber dem funktionsfähigen R30-Vergleich** ist gesondert definiert: NPC spart 4.316−789=**3.527 ausgefallene Wasserverkäufe** zu 14 ISK = **49.378 ISK nominell**. Einschließlich beider materiellen Anlaufstunden sind es 3.531 nicht verkaufte Einheiten = 49.434 ISK nominell. **Keiner dieser Werte ist der benötigte Geldemissionsbetrag**. Eine ISK kann in einem gesunden Kreislauf unendlich oft erneut als Zahlung dienen. `vergleichOhneScheinemission` liefert deshalb bei jeder Welt explizit `emissionErforderlichISK:null` und lehnt Vergleiche ab, die unterschiedliche Seeds, Zeiten oder Regeln vermischen.

### Eine zusätzliche 365-Tage-Gegenprobe

| Szenario Seed42 | Wirklich bezahltes Wasser / maximal 17.520 | Stunden mit Mangel | Haushaltskasse am Ende | Letzte verkaufte Stunde |
| --- | ---: | ---: | ---: | ---: |
| Vollständiger NPC-Rückfluss | **17.516** | **2** (Anlauf) | 3.221 ISK | 8.760 |
| NPC-Miner spart | **789** | 8.366 | 9 ISK | 397 |
| Spieler-Miner spart | **733** | 8.394 | 10 ISK | 369 |

Der 365-Tage-Dauerlauf bestätigt **nur den beobachteten, vereinfachten** geschlossenen Kreislauf. Keine Anlagen-/Hüllen-Neuinvestitionen, Versicherungen, Piratenverluste, komplexe Nachfrageschwankungen oder freien NPC-Kapitalentscheidungen sind in der Wasser-Forschungswelt nachgewiesen. Eine verpflichtende permanente NPC-Gewinnausschüttung ist **nicht** beschlossen. Die House-Variante enthält einen tatsächlich zugekauften 600-ISK-Miner und ist deshalb keine exakt gleiche Flottenausstattung gegenüber der NPC-Variante; `npcSave` vs. `full` isoliert Sparen bei identischem Eigentum besser.

## 2. Der **strukturelle** Geldabfluss pro realer Charge, kein Emissionsvorschlag

Pro 50 selbst geförderte Eis → zwei bezahlte Flugstrecken → fünf bezahlte Produktionschargen → 50 wirklich bezahlte Wasser:

| Zahlung / Eigentümer | Betrag |
| --- | ---: |
| Kunde zahlt für 50 Wasser | **700 ISK** |
| Minerförderlöhne (50 bezahlte Minuten) | 100 ISK |
| Frachterlohn (Hin-/Rückflug, 120 Minuten) | 120 ISK |
| Wasserwerkslohn (100 Produktionsminuten) | 100 ISK |
| **Gesamte tatsächlich bezahlte Löhne** | **320 ISK** |
| Realisierter Minerüberschuss (250−100) | 150 ISK |
| Realisierter Frachterüberschuss (240−120) | 120 ISK |
| Realisierter Stationsüberschuss (700−250−240−100) | 110 ISK |
| **Unternehmensüberschüsse zusammen** | **380 ISK** |
| **Identität bei vollständiger Rückführung: Löhne + Überschüsse** | **700 ISK** |

Sparen ist eine **Eigentümerentscheidung**, kein verbotener Vorgang. Behält allein der Miner die 150 ISK, dann gehen je 50 real verkaufte Wasser **150 ISK weniger** zurück an Haushalte. Bei exakt 48 Wasser/Tag entspricht das im stationären Idealmodell **144 ISK/Tag Umlaufabfluss**, **nicht 144 ISK/Tag bereits freigegebener neuer Geldmenge**. Die Minenhülle kostet zusätzlich 600 ISK, der Frachter 750 ISK; deren Ersatz, spätere Anlagen und Reparaturen sind nicht Bestandteil dieses einfachen positiven operativen Überschusses. Mit MK1-Bohrkopf (2 Eis pro bezahlter Förderminute) sinken die Minerförderlöhne für 50 Eis auf 50 ISK, und der verfügbare Minerüberschuss steigt rechnerisch auf **200 ISK** pro 50 Wasser: bei Miner-Sparen ein Umlaufabfluss von **4 ISK/Wasser** oder **192 ISK/Tag** bei 48 Wasser/Tag. Diese Zahlen sind **Preis-/Kostenidentitäten vor neuen Vollkosten**, keine dauerhaften Produkt-Mindestlohn- oder Emissionswerte.

## 3. Was ein echter Geldmodell-B-Kandidat leisten müsste

**[BESCHLOSSEN]** Sparfreiheit, Marktversagen einzelner Konzerne, echte Finanzierung und begrenzte, einzeln auditierte ISK-Emission **gegen reale Leistungen**. **[OFFEN/OPTION]** Wer die zusätzlichen ISK erhält, welche Ware/Leistung berechtigt, Tages-/Jahresdeckel, Emissionsrate, preisliche Anreize und regionale Verteilung.

**Nächster technisch zulässiger Schritt nach expliziter Entscheidung über den Testauftrag:**

1. Im separaten, weiterhin nichtproduktiven Forschungsstand eine **echte externe Abnahme** aufbauen, etwa von einem zweiten, nachgewiesenen Wasser-Exportkontingent oder einer ausdrücklich definierten zusätzlichen realen Versorgungsleistung, die unabhängig vom Vermögen eines einzelnen Konzerns oder Haushalts vergeben wird. Ware oder Dienstleistung muss eindeutig entstanden und genau einmal verbraucht/exportiert werden. **Nicht** dieselbe Einheit gleichzeitig intern verkaufen und extern vergüten.
2. Einen einzigen **globalen** deterministischen Tages-/Jahresdeckel mit verfallenden Restbudgets testen, keine Erhöhung bei individueller Pleite, keine überlastete „Notauszahlung“ aus dem Nichts. Beim Verkauf zusätzlich das tatsächliche `state.minted` und den externen Gegenbeleg verbuchen. Quelle, Empfänger, Menge, Tick und Budgetrest vollständig auditieren.
3. Unabhängig prüfen, **wo die Liquidität ankommt**: Eine Zahlung ausschließlich an eine sparende Station oder einen Konzern kann die Wasserkunden leer lassen. Zahlung an Haushalte benötigt einen **eigenständigen realen Leistungsanspruch**; keine doppelt bezahlte Arbeit oder Gratisleistung. Daher stationärer Export und nachweislich externer ziviler Leistungsauftrag getrennt vergleichen.
4. Stufenweise Gegenproben **mit und ohne** Emissionen, NPC-Miner- und Spieler-Sparen, nicht lieferbare Ware, vollem Lager, fehlendem Frachter, Insolvenz, 13×90 und mindestens 1×365 Tage, alle Regel-/Save-Hashes und alte Main-Referenz. Eine konkrete ISK-Rate darf erst aus solchen Prüfungen **und mit Produktfreigabe** entstehen.

**Vorläufige Entscheidungslogik:** Es wird **keine** nominale 49.378-ISK-„Versorgungslücke“ emittiert, ebenso wenig vorbehaltlos die rechnerischen 144 ISK/Tag. Entscheidend sind realer Export/Leistungsnachweis, richtige systemische Mittelverteilung und kontrollierte Nettogeldmenge. Kopfgeld- und seltene Minenfund-Emissionen bleiben eigene, global mit zu bilanzierende Quellen; sie dürfen nicht unbegrenzt zusätzlich dieselbe wirtschaftliche Leistung belohnen. Langfristige Simulation muss auch Investitionen und Ersatzkosten aus eigener Leistung zahlen.

## 4. Test- und Integrationsstand

- **[MAIN]** GitHub `main b4e604d6`, R14/S8, unverändert.
- **[DRAFT]** W5o [PR #194](https://github.com/tobiasfranziskus/Check/pull/194), CI [#42028424978](https://github.com/tobiasfranziskus/Check/actions/runs/42028424978) erfolgreich abgeschlossen.
- **[DRAFT/ANALYSE] W5p** fügt **keinen neuen Regelversions-/Save-Typ** hinzu und verändert `index.html` nicht. Stundenmessung `analysis/w5p-kaufkraftanalyse.mjs`, ausführbare Tests `tests/w5p-kaufkraftanalyse.test.mjs`. Direkte JavaScript-Ausführung: **5/5 neue Tests**, darunter fünf 90-Tage-Vergleichswelten, **13 feste NPC-Spar-Seeds ×90 Tage** mit Tages-Audit und Save/Load, sowie drei 365-Tage-Welten; Ergebnis jeweils hashgleich zu den originalen R30-Core-Läufen.
- GitHub-Node-22-Gesamtsuite/CI für **diesen** W5p-Branch wird erst nach realem Abschluss als bestanden gemeldet. Echte iPad-Safari-/NAS-Abnahme ist weiter offen; für die reine Offline-Analyse ist kein neuer Browser-Code notwendig.
