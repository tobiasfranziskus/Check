# W5n – Eisabbau, Wasseraufbereitung und bezahlter Stationsverbrauch

**[DRAFT/ANALYSE] 05.11.2026, Regel 29/Schema 8, Forschungsstack auf W5m #192.** Kein Produkt-Merge, keine reguläre Geldmodell-B-Emission und keine neue Spielstandmigration. Hauptspiel `main` bleibt Regel14/Schema8.

## Designziel

Belege einen realen, von Jäger- und Schiffbauaufträgen unabhängigen Grundversorgungspfad:
**House/NPC-Miner → Aldera-Eisankauf → real vorfinanzierter 2-Wege-Frachter → Nadir-Wasserwerk → nachweislich bezahlter Wasserverbrauch**.

Alle Befehle laufen im einen `m_core_index` und durch die vorhandene Befehls-/Buchungsprüfung. Der neue Coreabschnitt `m_core_w5n` ist keine zweite Weltuhr. Das Modell verwendet identische Regeln für House-/NPC-Miner. Eis bleibt bei fehlender zahlungsfähiger Station Eigentümerfracht, Produktion und Transport halten bei unzureichendem Betriebskapital.

## Forschungsparameter – keine Produkt-Balancingfreigabe

| Schritt | Physische Leistung | Tatsächlich bezahlter Betrag |
| --- | --- | --- |
| Miner | 1 Eis je Arbeitsminute; MK1-Miner kann 2 Eis fördern | 2 ISK je gearbeiteter Minute an Aldera-Fonds |
| Aldera-Eisankauf | Nur wirklich im Schiff gefördertes Eis; begrenztes Lager | 5 ISK je Eis aus vorhandener Stationskasse |
| Eisfracht Aldera → Nadir → Aldera | 50 Eis, 60+60 Flugminuten, bezahlte Rückfahrt | Nadir bindet **250 ISK Warenkauf + 240 ISK Frachttarif**, Frachterhalter zusätzlich **120 ISK Fluglöhne** |
| Wasserwerk Nadir | 10 real geliefertes Eis → 10 Wasser über 20 Minuten | Nadir bindet 20 ISK Arbeitslohn vor Beginn |
| Endverbrauch Nadir | Bis 2 Wasser je Spielstunde, nur vorhandenes Stationslager | 14 ISK je wirklich verbrauchtem Wasser aus **endlicher** Kundenkasse |

**Geldquelle:** Keine neue. Die W5m-Nadir-Startkasse (3.100 ISK nach der bisherigen Piraten-/Sicherheitsverteilung) wird in W5n in **1.700 ISK Nadir** und **1.400 ISK benannten Wasser-Endkunden** aufgeteilt. Die bestehende Gesamtgeldmenge bleibt **33.000 ISK**. Ein zusätzliches Kundenkonto mit bereits zugeordnetem Guthaben ist **kein** Nachschuss und keine freie Kreditlinie. Bei 0 ISK Kundengeld entstehen keine Verkaufserlöse; Bedarf kann als unversorgt weiter bestehen.

Diese Verteilung ist eine **Forschungsannahme**, kein endgültiges Bevölkerungs- oder Steuerkonzept. Die Anlage selbst wird im Versuch als Teil der vorhandenen Stationsinfrastruktur betrachtet; Anschaffung, Wartung, Energie, Stationsbau, Risiko-/Schadenskosten sowie weitere NPC-Interaktionen sind noch nicht vollständig in den langfristigen Vollkosten enthalten. Entsprechend sind die operativen Beiträge keine freigegebene Dauerprofitabilität.

## Core- und Save-Vertrag

- Neues R29-Profil `W5N_RULES` enthält `eis` und `wasser` ausschließlich für den separaten Forschungsstand; ursprüngliche Startlager werden tatsächlich genullt.
- `shipMine(ware:eis)` führt real finanzierte Förderung aus; `shipSellIce` verkauft eigene Rohware nur bei vorhandener Stationskasse und freiem Lager.
- `shipFreightIce` nutzt den vorhandenen W3-Frachter, dieselben Aldera–Nadir-Gates und die bestehende Kernuhr. W3-Erzauftrag und W5n-Eisauftrag sperren sich gegenseitig. Zwei Zahlungsreserven werden vollständig vor Reisebeginn befüllt; bei Ankunft wird die physische Ware samt Kaufpreis übertragen, nach tatsächlich bezahltem Rückflug folgt die Vergütung an die Spedition.
- `stationWater` zahlt 20 ISK Arbeitsreserve vor Produktionsbeginn; erst nach 20 bezahlten Ticks werden 10 Eis aus dem Nadir-Lager verbraucht und 10 Wasser erzeugt.
- Stundenverbrauch erfolgt nur aus dem tatsächlich vorhandenen Wasserlager und der real gedeckten Endkundenkasse; Geld- und Warenbuchung liegen im selben Tick, `state.minted=0`.
- Vorhandene Erz-, Raffinerie-, Werft-, Jäger- und Frachteraudits erhalten **gesondert nachgewiesene** Eis-/Wassertransfers und Lohnkonten. Sie werden nicht deaktiviert. Gemeinsamer Gesamt-ISK-/Güteraudit und unabhängiger W5n-Audit bleiben aktiv.
- `createW5NState`, `loadW5N`, `pilotW5NStand` sind R29-spezifisch. Alte R14/R26/R27/R28-Daten bleiben inkompatibel mit R29 und dürfen nicht still migriert/überschrieben werden.
- Die Oberfläche `prototypes/w5-versorgung/index.html` verwendet Browser-Standardfunktionen und hält den Forschungsstand **nur im Arbeitsspeicher**, mit ausdrücklich manuellem JSON-Export/-Import. Keine IndexedDB- oder Hauptspiel-Veränderungen.

## Direkt ausgeführte Tests · 05.11.2026

**Gesondert vom GitHub-Gesamttest** wurden der echte JavaScript-Core und alle unabhängigen Bilanzprüfungen ausgeführt:

1. Seed 42: 50 Eis aus 50 bezahlten Arbeitsminuten, tatsächlicher 250-ISK-Verkauf an Aldera, realer Frachterkauf, 490 ISK Kauf-/Frachtreserve in Nadir, 120 ISK vorab gebundene Fluglöhne, echte 50 Eis in Nadir, bezahlte Rückfahrt; 20 Produktionsminuten erzeugen 10 Wasser; danach 2 Wasser für 28 vorhandene Kunden-ISK verbraucht und bezahlt. Hash `a75f6ec01ac1d95b`, Geld-/Warenaudit gültig.
2. Seed 42, **zwei** voll finanzierte 50er-Frachtrunden, zehn zu je 20 ISK vorfinanzierte Wasserchargen: 100 Wasser physisch erzeugt und nach dem tatsächlichen Verbrauch für genau **1.400 ISK** bezahlt. Kundenkasse anschließend **0 ISK**; Nadir-Kasse **1.920 ISK** gegenüber 1.700 ISK Start, vor weiteren Fixkosten. Keine Kunden-Neufinanzierung, keine zusätzlichen ISK, 33.000 ISK global. Alle Zwischenbilanzen gültig.
3. Die fünf isolierten Fälle einschließlich Kassenmangel, Fremdeigentum, Doppelauftrag und manipulierten Save-Ledgern wurden unmittelbar erfolgreich ausgeführt; zusätzlich 13 feste Seeds ×90 Spieltage mit **täglichen unabhängigen Geld-/Waren-Audits**, 13 deterministischen Save-/Replay-Fortsetzungen und jeweils drei Save-/Load-Kontrollen. Alle 13 direkt ausgeführten Szenarien bestanden. In der 90-Tage-Kontrolle ist **nur eine einzelne** Wassercharge produziert – sie beweist nicht die unbegrenzt laufende Versorgung.

**CI-Prüfung der gesamten Node-Suite erfolgt separat.** Echte Safari-/iPad-/NAS-Abnahme steht aus.

## Wirtschaftliche Einordnung

Bei vollständiger, tatsächlich bezahlter 50er-Charge: 250 ISK echter Rohstoffeinkauf + 240 ISK Frachtervergütung + 100 ISK Wasserwerkslohn = **590 ISK variable Stationsausgaben**; 50 verkaufte Wasser ×14 ISK = **700 ISK reguläre Einnahmen**, stationärer Deckungsbeitrag **+110 ISK** vor Fixkosten. Der Miner erzielt vor Anschaffungskosten pro 50 Eis mit Basisförderung 250−100=**150 ISK**; die Spedition 240−120=**120 ISK**, aber ihre Hülle kostet 750 ISK. Effizientere Miner verbessern das Kostenniveau, dürfen keine Käuferzahlungsfähigkeit erzeugen.

Nach 100 bezahlten Wasserlieferungen ist das Endkundenbudget von 1.400 ISK erschöpft. Das erfüllt den Beleg für eine profitable **endliche** Grundversorgungstransaktion. Es liefert **keinen** dauerhaft kapitalerneuernden Wirtschaftsautomatismus. Der nächste gesonderte Schritt muss entweder externe zahlungsfähige Endnachfrage (Geldmodell B, **Betrag/Deckel nach expliziter Freigabe**) oder einen anderweitig nachgewiesenen Haushalts-Einkommenskreislauf beweisen.

Keine Artefakte, Edelsteine, Sauerstoffaufspaltung, neue Piratenereignisse, MK2-Rezepte oder unfundierten Kredit-/Fondsauffüllungen in diesem PR.
