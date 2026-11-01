# B-K1 – Cyris-Nahrungskreislauf: erste vollständig auditierte Wirtschaftszelle

**Stand 01.11.2026 | [ANALYSE/DRAFT] PR #85** auf **[MAIN] `b4e604d`**
(v0.12.5, Regel 14, Schema 8). **Nicht** in `index.html` eingebaut.
Der bestehende [Phase-B-Auftrag](ROADMAP.md) bleibt verbindlich;
B-K1 ist ein kleines, unabhängig widerlegbares Prüftor, **keine zweite Roadmap**.

## 1. Die Testzelle und ihre Grenzen

Im unmodifizierten Originalkern gibt es in Cyris ein Eisfeld mit realem
NPC3-Miner, eine Linie `r_nahrung` sowie Waren, Preis- und Kontenfunktionen.
Die Zelle nutzt **dieselben Originalfunktionen**:
`m_core_state.createState`, `m_core_foerderung.foerderung`,
`m_core_handel.handel`, `m_core_produktion.produktion`,
`m_core_stunde.betriebskosten`, `m_core_preis.preis` und
`m_core_index.audit/hash`. Das gültige Rezept ist
**2 Eis → 1 Nahrung, 6 Produktionsaufrufe**.

Die eine neue, ausdrücklich **hypothetische** Komponente ist ein
`hh_cyris`-Haushaltskonto. Sein **400-ISK-Startbestand** wird vom
vorhandenen `fonds_cyris` real abgebucht (1.000 → 600 ISK);
`initialSupply` und `minted` bleiben unverändert. Nach dem
tatsächlichen Original-Rezeptdurchlauf nimmt der Haushalt **nur
gegen vollständige Barzahlung** eine tatsächlich produzierte
Nahrungseinheit ab; diese wird erst dann aus Stationslager/Warenaudit
als `consumed` ausgebucht. Die bisherige ursprüngliche
`verbrauch`-Funktion kauft **nicht** und wird im B-K1-Verbrauchstest
deshalb **nicht als zahlender Verbraucher dargestellt**.

Alle anderen Linien und aktiven Schiffstätigkeiten werden **nur im
Testzustand** angehalten. Die erste angefangene Nahrungscharge bindet
bereits zwei vorhandene Eis als Work-in-Progress; anschließend führt
jede Test-Runde exakt zwei neu mit dem originalen Miner geförderte
Eis über den **realen** Stationsverkauf zu einem mit dem Originalrezept
erzeugten und **bar** konsumierten Nahrungsgut. Diese Testzellenrunden
sind **keine vollständigen Spielstunden**, weil die Core-Teilfunktionen
gezielt angesteuert und Arbeitskosten nach den real geleisteten
2 Minuten abgerechnet werden. Keine neue Spielmechanik ist damit
genehmigt oder aktiv.

## 2. Aus CI gemessene Buchung einer Runde, Seed 42

| Transaktion/Bilanzposten | ISK | Wer bezahlt / erhält? |
| --- | ---: | --- |
| Verkauf von 1 tatsächlich produzierter Nahrung | 33 | Haushalt → Station Cyris |
| 2 echte geförderte Eis, am aktuellen Originalpreis 13 ISK | 26 | Station Cyris → Miner NPC3 |
| Bergbaubetrieb, originaler Core-Betriebskostenpfad | 5 | NPC3 → Fonds Cyris |
| Eis-Verkaufsgebühr, originaler Core-Handelspfad | 1 | NPC3 → Fonds Cyris |
| Nettoerlös nach realem Eisverkauf und Betriebskosten | 20 | NPC3 kann ihn als Arbeit/Ertrag an Haushalte zahlen |
| Produktions-Mehrwert nach Rohstoffkauf | 7 | Station kann ihn als Arbeit/Ertrag an Haushalte zahlen |
| Fonds-Einnahmen | 6 | 5 aus erbrachter Bergbauarbeit + 1 Gebühr |
| Haushaltsbedarf pro Runde | 33 | Haushaltskasse |

Die **27 ISK Miner-/Fabrikausschüttung an Haushalte** sind explizit
ein analytisches Eigentümer-/Arbeitsverteilungsmodell. Das originale
Spiel zahlt solche Löhne/Dividenden **nicht automatisch**; insbesondere
die Fabrik hat im Original keinen separaten Lohnpfad. Die
Ausschüttung lässt in der Zelle absichtlich **keine Gewinn-/Schiffs-
oder Reparaturrücklage** zurück. Dieser Entwurf ist daher **noch kein
tragfähiges vollständiges Unternehmensmodell**.

## 3. Drei geklärte Alternativen, 20 bezahlte Zyklen

| Variante | Haushaltskasse nach 20 Zyklen | Fonds-Kasse | Reale zusätzliche ISK |
| --- | ---: | ---: | ---: |
| Nur Miner-/Fabrikausschüttungen (27 ISK/Runde), **kein** Fondsrückfluss | 280 ISK | 720 ISK | 0 |
| Zusätzlich **5 ISK** tatsächliche Bergbau-Arbeitszahlung aus Fonds an Haushalte | 380 ISK | 620 ISK | 0 |
| Zusätzlich **alle 6 ISK** (5 Betrieb + 1 Gebühr) aus Fonds an Haushalte | 400 ISK | 600 ISK | 0 |

**Bei fehlendem Fondsrückfluss:** Der nächste Nahrungsverbrauch wird
nach **62 vollständig bezahlten Runden** abgelehnt; 28 ISK reichen
für den folgenden Preis von 33 ISK nicht. Das ist ein
**nachgewiesenes Geldverteilungsproblem trotz verfügbarer Ware**.
Es lässt sich nicht durch eine weitere Frachterhülle reparieren.

**Beim vollständigen Fondsrückfluss:** 20 getestete Runden laufen
mit genau denselben ursprünglichen, vollständig konservierten ISK
und je Runde richtiger Warenbilanz. Dies **beweist nicht**, dass
das Modell die Kosten öffentlicher Dienste tragen kann: Die
Handelsgebühr wird vollständig wieder ausgeschüttet, alle
Unternehmensmehrwerte werden ausgeschüttet und es bleibt **kein**
Kapital für Schiffsersatz, Reparatur oder echte Stationsinvestitionen.
Der mittlere Fall hält 1 ISK Gebühr als Fondsumsatz zurück; ohne
zusätzlichen echten Einkommenskanal werden Haushalte trotzdem ärmer.

## 4. Tatsächlich ausgeführte Testbelege

**[CI #41320278101](https://github.com/tobiasfranziskus/Check/actions/runs/41320278101)**
auf `1beefeff`: **75/75 Node-Tests** (67 bisherige + acht neue B-K1);
0 Fehler. Die Einzelproben enthalten eine vollständige reale
Förderungs-/Handels-/Produktionsrunde, 20 wiederholte Runden in
drei Verteilungsszenarien, die 62-Runden-Zahlungsgrenze,
Geld-/Warenaudits, identische deterministische Hashes und
**13 Seeds mit je 20 kontrollierten Runden**, nicht 13×90 Tage.

Die bisherigen v10–v14-Wirtschafts-CI-Jobs überprüfen **nur die
unveränderte Produktwirtschaft**, nicht diese neue Testzelle.
Es gibt **keine** reale iPad-/NAS-Abnahme, keinen in `main`
eingebauten Haushalt, keinen neuen Save-Loader und keine genehmigte
ISK-Emission.

## 5. Entscheidung aus dem Experiment

**[ANALYSE – erreichte erste Etappe]:** Eine **endliche, 20-mal
reproduzierte, vollständig bilanzierte Nahrungskette** ist als
unabhängige Prüfzelle nachgewiesen. Ihr vollständiger Geldkreislauf
funktioniert **nur unter ausdrücklich offengelegten Annahmen**
über bezahlte Arbeit, Ausschüttungen und Gebührenrückfluss. Ohne
diese Annahmen gibt es ein quantitativ isoliertes Liquiditätsleck.

**[NICHT ERREICHT]:** Selbsttragende, automatisch agierende
NPC-Unternehmen inklusive Schiffsersatz/Produktionskostenreserve;
Haushaltseinkommen aus weiteren realen Leistungen; vollständiges
3-Nachfragestationen-Modell, 90-/365-Tage-Szenarien, Insolvenzfolge
und Spieler-Sparkrisen.

**Empfehlung für die zweite Sitzung:** Den Kernversuch um **eine
echte, aus der Geldbilanz bezahlte Betriebskapital-/Ersatzreserve**
erweitern, ohne Einnahmen oder Güter zu erfinden. Dann ermitteln,
ob Haushalte und Unternehmer bei vorhandener Endnachfrage
beide wiederholt finanzierungsfähig bleiben. Zusätzlich die
Kaufpreis-/Arbeitskosten-Buchung zum exakt originalen 60-Minuten-
Zeitpunkt prüfen; keine künstlichen Preis-/Betriebskostenwerte
allein zum Bestehen auswählen. Falls die Bedingungen mit fester
Geldmenge unerfüllbar sind, als Befund ausweisen und erst danach
eine konkret limitierte gesamtwirtschaftliche Endnachfrage-Regel
für Geldmodell B getrennt zur Freigabe vorschlagen.

**Keine Änderungen an Produktcode, Vertragsregel oder Spielständen;
kein Merge.**
