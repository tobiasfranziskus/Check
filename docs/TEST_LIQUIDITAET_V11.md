# Aphros Void – NPC-Liquidität und Kapitalobergrenze, v11

Stand 30.10.2026, Draft-Analyse auf [PR #23](https://github.com/tobiasfranziskus/Check/pull/23), basierend auf PR #22 / #20. **Kein Spielcode, keine Wirtschaftsregel und keine Speicherstruktur wurden geändert.**

## Problem und Prüfstand

Die Geografiewelt v11 erhöht NPC1-Kostenlücken gegenüber der Variante mit nur Meridian–Orion-Tor. Der Produktionscode entscheidet beim Händlerkauf nach bezahlbarer Warenmenge, Zielmarkt, Preis und Transportzeit, jedoch ohne gesonderte Betriebskostenreserve. `npcAusgaben` führt stündlich Kapital oberhalb `world.npcObergrenze` an einen Systemfonds ab. Für die Wirkung beider Mechanismen fehlten bisher kausale Messungen.

**CI:** [GitHub Actions #41016809045](https://github.com/tobiasfranziskus/Check/actions/runs/41016809045), Head `5d21c1d`: **45/45 Standardtests**, v11-Fixwerte, bisherige drei Weltvarianten, neuer NPC-Liquiditätslauf und neuer Kapitalobergrenzen-Gegenversuch erfolgreich; 0 Fehler. Der ältere, nur auf einen anderen Zielbranch begrenzte Job `sicherheitsgeografie-vergleich` wurde planmäßig übersprungen, nicht die neuen Prüfläufe.

### Real ausgeführte Beobachtungsdiagnose

`node tools/npc-liquidity-diagnosis.mjs`: 13 feste Seeds × 90 Tage, jeweils `nur Tor` und `Tor + Nadir`. Stündlicher Geld-/Warenaudit, fixer Referenzhash je Welt/Seed sowie Save/Load. Die Beobachter erfassen nur tatsächliche Handelsereignisse. Bezahlte Fracht wird per FIFO-Beschaffungskosten über ihren Schiffslebenszyklus verfolgt. **Sofort aktivierte Ersatzfrachter sind Investitionen, keine Handelsfracht** und werden getrennt verbucht.

| NPC1, Summe über 13 Seeds | Nur Tor | Tor + Nadir |
| --- | ---: | ---: |
| Ungedeckte Betriebskosten | 11.251 ISK | 17.187 ISK |
| Kostenabrechnungen mit Fehlbetrag | 56 | 87 |
| Fehlbeträge mit gleichzeitig vorhandener bezahlter Handelsfracht | 56 | 87 |
| Kapitalabgaben über 6.000 ISK | 30.968.132 ISK | 37.399.287 ISK |
| Warenkäufe inkl. Gebühren, ohne sofort aktivierte Schiffe | 137.714.647 ISK | 150.861.031 ISK |
| Erhaltene Verkaufserlöse nach Gebühren | 190.663.063 ISK | 210.234.851 ISK |
| Gemessene operative Handelsmarge vor Wartung/Verlusten | 54.368.403 ISK | 60.820.774 ISK |
| Ausgaben für aktivierte Ersatzfrachter | 1.092.780 ISK | 1.061.580 ISK |
| Kassenarme Kaufereignisse (Rest < 750 ISK) | 215 | 225 |

Dies beweist eine wiederholte **Liquiditätsunterdeckung bei gleichzeitig gebundenem Handelskapital**. Die große positive Handelsmarge ist kein Konzerngewinn: Betriebskosten, Schiffsinvestitionen, Verluste und Kapitalabgaben sind darin nicht vollständig enthalten. Das Gesamtvolumen ist sehr viel größer als die Unterdeckung; eine reine Mengenreduktion ist deshalb nicht zwingend die beste Lösung.

### Kontrollierter Kapitalobergrenzen-Gegenversuch

`node tools/npc-cap-scenarios.mjs`: dieselbe v11-Welt, dieselben 13 Seeds × 90 Tage. Nur `world.npcObergrenze` wird im Simulationsregelsatz verändert: 6.000 ISK / 12.000 ISK / praktisch unbegrenzt (`Number.MAX_SAFE_INTEGER`). Produktionsdatei `index.html` bleibt unverändert. Für den Ausgangsfall werden sämtliche v11-Fixpunkthashes aus der vorab versionierten Fixture kontrolliert; Varianten mit anderer Grenze werden gegen unabhängig wiederholte Advance-Läufe kontrolliert. Stündliche Geld-/Warenaudits und Save/Load je Seed.

| Kennzahl (Summe 13 × 90 Tage) | 6.000 ISK | 12.000 ISK | keine Abführung |
| --- | ---: | ---: | ---: |
| Gesamt-Mangelstunden | 4.204 | 23.978 | 494.066 |
| Ungedeckte NPC1-Betriebskosten | 17.187 ISK | 17.022 ISK | 424.888 ISK |
| Ungedeckte NPC2-Betriebskosten | 6.544 ISK | 10.090 ISK | 214.712 ISK |
| NPC1-Verkäufe (Ereignisse) | 179.299 | 331.174 | 7.378 |
| NPC1-Abgaben | 37.399.287 ISK | 15.632.673 ISK | 0 |
| Stunden mit NPC1-Kasse = 0 | 34 | 14 | 27.330 |

Die **ersatzlose Abschaffung der Kapitalobergrenze ist klar widerlegt**: bei unbegrenztem Kapital verbleiben übermäßige Mittel außerhalb der Fonds-/Stationsliquidität. Der Handel und die stationsseitige Bedarfsdeckung brechen im kontrollierten Vergleich weitgehend ein. Auch 12.000 ISK ist kein unbedenklicher Kompromiss: mehr NPC1-Verkäufe, aber deutlich mehr Mangelstunden und NPC2-Kostenunterdeckung.

**Schlussfolgerung:** Die Regel ist derzeit sowohl Gewinnabführung als auch Rückführungsmechanismus für die Stationskassen. Eine bloße Erhöhung/Abschaffung verlagert Liquidität weg von Stationen. Gleichzeitig lässt die bestehende 6.000-ISK-Regel einzelne NPC-Betriebskosten ohne ausreichende Reserve. Optimierungsbedarf betrifft daher die **gezielte Sicherung von Betriebskosten bei weiterhin funktionierender Kapitalzirkulation**.

## Abgeleitete Designidee: Piloten als Teilnehmer derselben Wirtschaft (noch nicht implementiert)

Auf langfristigen Spielerwunsch sollen Piloten ein eigenes, auditiertes Guthaben und Berufserfahrung besitzen, nicht eine zweite Wirtschaft:
- Schiff und Handelsfracht gehören zunächst zum Konzern; dieser bezahlt Einkauf und erhält Verkaufserlös.
- Ein Frachterpilot verdient nach abgeschlossener Lieferung, Miner nach Rohstoffverkauf. Eine gebuchte Gehaltsverbindlichkeit erlaubt verzögerte Zahlung, ohne Kosten zu verbergen. Für zerstörte Schiffe, gestoppte Touren und Leerlauf müssen Vertragsregeln existieren.
- Kampfpiloten verdienen Kopfgeld für bestätigte Abschüsse; bezahlte Eskorte/Sicherheitsarbeit bekommt eigene Auftragsvergütung. Bestehende Kopfgeldbuchungen gehen noch an den Schiffseigentümer und erhöhen `state.minted`; künftige Pilotenzahlung muss **einmalig**, nicht doppelt gebucht werden.
- Piloten können aus ihrer Kasse Reparaturen und Module von tatsächlichen Stationen kaufen, soweit diese Leistungen physisch modelliert und Material/ISK bilanziert werden. Persönliche Erfahrung steigt durch echte Tätigkeiten, nicht durch Vermögenshöhe oder bloßen Einkauf. Eigentum an privat finanzierten Modulen und Regeln für Schiffwechsel sind gesondert zu definieren.
- Diese Gehalts-/Dienstleistungswirtschaft könnte nach modellierter Stationseinnahme die heutige pauschale Kapitalabführung teilweise ersetzen; das ist eine **zu prüfende Hypothese**, keine bereits nachgewiesene Lösung.

## Folgeschritt und Abnahme

Noch keine Änderung von `npcObergrenze`, der Handels-KI, den Kosten, Pilotendaten oder bestehenden Kopfgeldern. Vorgeschlagenes nächstes kleines Paket: Simulation einer **liquiditätsreservierenden Händlerentscheidung bei unverändertem Rückfluss an Stationsfonds**; 13 Seed-Paare, feste v11-Basis-Hashes, Mangel und Unterdeckung getrennt. Danach ggf. begründete wirtschaftliche Codeänderung in eigenem Branch und mit Freigabe.

PR #20 und PR #22 bleiben wirtschaftlich nicht integriert; PR #20 liegt hinter dem aktualisierten PR-#19-Branch zurück. `main` und alle produktiven Spielmechaniken unverändert; keine iPad/NAS-End-to-End-Abnahme.
