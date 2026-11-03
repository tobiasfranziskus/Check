# B-K11p – Dravos: lückenlos bezahlte Neu-Nahrung aus sh015; Station und Folgegeschäft weiterhin defizitär

**[ANALYSE/DRAFT · 03.11.2026]** [PR #154](https://github.com/tobiasfranziskus/Check/pull/154) auf #153 → #152 → #151 → #150 → #149 → #148 → #147 → #146. **[MAIN]** `b4e604d6`, v0.12.5 Regel14/Schema8 unverändert. Nur historische isolierte R15-/Schema9-Testinstrumentierung; **keine** produktive Mechanik, Preise, Löhne, Steuern, Fonds, Emission, Save-Migration oder Integration.

## Worum geht es?

B-K11o belegt **23 echte und profitable Kauf-/Verkauf-Chargen** eines einzelnen NPC1-Frachters `sh015` mit **+1.747 ISK** über die ersten 48 Stunden; nach sieben Tagen geht dieses Schiff verloren und sein Eigentümer ist illiquide. In Dravos hat die Station nachweislich Nahrung von diesem Frachter gekauft, und der Dravos-Haushalt hat anschließend neue Nahrung bezahlt. Bisher war nicht nachgewiesen, ob beides *dieselbe* Ware ist.

Die R15-`m_core_herkunft`-Buchung garantiert **Neuware vs. Altware** über Stationen, Schiffstransit und tatsächlich bezahlten Haushaltsverbrauch, aber keine dauerhafte Einzelchargen-ID innerhalb gemischter Neuware. B-K11p fügt deshalb **nur im Test** beobachtende Tags hinzu: tatsächliche Original-Core-Produktion, Kauf/Transport nach dem im Core bestimmten NEU-Anteil, echte Stationsankäufe, bezahlter NEU-Verbrauch, Alt-Verbrauch, Außenhandel und Zielsaldierung. Die Zusatzbeobachtung muss **jede Stunde exakt mit dem originalen Dravos-NEU-Bestand übereinstimmen** und darf kein Geld oder Lager ändern. Bei vermischter Neuware wäre die Test-FIFO-Zuordnung *nicht* als physische Herkunft beweiskräftig.

**Hier ist die Herkunft dennoch eindeutig:** Dravos startet mit **0 neuer und 0 alter Nahrung**. Während des geprüften Zeitfensters kommt dort **keine andere neue Nahrung an und wird keine neue Nahrung lokal hergestellt**. Deshalb stammen alle neun Neu-Einheiten, die der Haushalt bezahlt, tatsächlich aus `sh015` – unabhängig von der hypothetischen FIFO-Reihenfolge innerhalb der Neuware. Testassertionen prüfen an **jedem konkreten Kaufzeitpunkt**, dass Mindest- und Höchstanteil aus `sh015` identisch zur gesamten bezahlten Menge sind.

## [TEST] Die tatsächliche Kette – Tick und ISK

| Realer Core-Vorgang | Zeitpunkt | Neuware | ISK | Belastete/Gutschrift-Kasse |
| --- | ---: | ---: | ---: | --- |
| `sh015` kauft neue Nahrung in **Veldra** | Tick **5.141** | **9** | **324 + 12 Marktgebühr** | NPC1 bezahlt Veldra |
| `sh015` verkauft an **Dravos** | Tick **5.161** | **9** | **441**, Verkäufergebühr 17 | Dravos bezahlt NPC1; NPC1 bezahlt Gebühr |
| Dravos-Haushalt verzehrt neu und bezahlt | Tick **5.220** | **3** | **117** | Haushaltskonto → Stationskonto |
| Dravos-Haushalt verzehrt neu und bezahlt | Tick **5.280** | **2** | **84** | Haushaltskonto → Stationskonto |
| Dravos produziert bezahlte Material-Chargen; Lohn je 40 ISK | Ticks **8.411, 8.421, 8.431, 8.441** | – | **160 Lohn insgesamt** | Stationskonto → Dravos-Haushalt |
| Dravos-Haushalt verzehrt neu und bezahlt | Tick **8.460** | **3** | **132** | Haushaltskonto → Stationskonto |
| Dravos-Haushalt verzehrt neu und bezahlt | Tick **8.520** | **1** | **48** | Haushaltskonto → Stationskonto |

**Erste 48h:** 9 Neu-Einheiten angekommen, davon 5 für **201 ISK** bezahlt und gegessen, 4 verbleiben als Core-auditierte Neuware. Haushaltskonto nach den ersten beiden Käufen **39 ISK**, noch keine lokalen Produktionslöhne. **7 Tage:** Genau dieselben 9 Neu-Einheiten sind schließlich für **381 ISK** vollständig bezahlt verzehrt, **0 neue Restware**. Die vier tatsächlich bezahlten Produktionslöhne von 40 ISK stellen genau **160 ISK zusätzliche lokale Haushaltskaufkraft** bereit; nach den ersten fünf Käufen besitzt der Haushalt 39 ISK, vor dem dritten Kauf **199 ISK**, nach weiteren 132+48 ISK bezahlt verbleiben **19 ISK**. Das ist ein **echter Lohn→Nachfrage→Stationskasse-Rückfluss**, keine neue globale Geldemission.

**Der Frachter finanziert wirklich eine Folgefahrt:** Nach der Stationsveräußerung bei Tick5161 und dem ersten Haushaltskauf bei Tick5220 startet `sh015` bei Tick **5.221** von Dravos nach Aldera mit vorhandenem Original-R15-Fahrtvertrag `v894`; **83 ISK** Arbeit werden aus dem **NPC1-Frachtvertrag** bezahlt. Die Haushaltszahlung fließt an **Dravos**, nicht direkt an NPC1. Die Finanzierung der Folgefahrt beruht auf der Händlerkasse und dem vorangegangenen echten Stationsverkauf; die Haushaltszahlung schafft zuerst **Stationsliquidität**.

## [TEST] Die verbleibende wirtschaftliche Lücke

**Neun Neu-Einheiten: Dravos bezahlt 441 ISK für die Ware und erhält über sieben Tage aus genau diesen Einheiten nur 381 ISK zurück.** Das ist **−60 ISK aus Einkauf minus bezahlt gegessen**, noch vor lokaler Lohnzahlung, anderen Lieferungen, Verkaufs-/Ankaufsgebühren oder eventuellen weiteren Stationsgeschäften. Die vier Material-Produktionslöhne von 160 ISK sind real gezahlte zusätzliche Kosten; deren wirtschaftliche Deckung darf **nicht** automatisch dem Nahrungsverkauf gutgeschrieben werden, weil das Stationsgeld fungibel ist.

**Weitere Altware:** `sh015` kauft bei Tick **8.821** für **975 ISK** 25 Einheiten Nahrung in Meridian, verkauft diese bei Tick **8.869** als **25 echte Alt-Einheiten** für **1.225 ISK** an Dravos (Verkäufergebühr 49). Der Frachter kauft schon bei Tick **8.881** **12** dieser Alt-Einheiten für **300 ISK** plus Gebühr 12 von Dravos zurück. Die verbleibenden **13 Alt-Einheiten** werden laut Original-Core als **Altverbrauch** abgebucht – **ohne** eine Haushaltszahlung für Neuware. Für diese gesamte Altware-Stationstransaktion ergibt sich rein aus Wareneinkauf, tatsächlichem Rückverkauf und Altverbrauch für Dravos **−925 ISK Waren-Cashflow** (−1.225 +300 +0), ohne noch andere Stationsgeschäfte und Gebühren zu berücksichtigen. Die 12 zurückgekauften Einheiten dürfen weder als neue Produktion noch als bezahlter Endverbrauch erscheinen.

**Handels-/Flottenkrise bleibt:** Derselbe einzelne Frachter erreicht in den ersten 48h **+1.747 ISK** Eigenhandelsnetto; nach 7d beträgt sein gebuchtes Einzelhandel-/Fahrt-Ergebnis **−942 ISK**. Das Ausgangsschiff geht tatsächlich bei Tick **9.420** verloren; der Core kauft anschließend für NPC1 ein Ersatzschiff mit **750 ISK Kaufwert + 30 ISK Gebühr**. Die reale NPC1-Gesamtkasse nach sieben Tagen liegt bei **926 ISK** statt 3.000 zu Beginn. **Dravos hat in diesem Sieben-Tage-Gegenversuch 162 von 168 Stunden Nahrungsmangel**, und die sechs zivilen Verbrauchsstationen insgesamt 878 von 1.008 Mangelstunden. Ein einzelner bewiesener Warendurchlauf heilt die Gesamtwirtschaft also nicht.

## Grenzen und Empfehlung

**[TEST]** [Gezielte B-K11p-CI #41674127634](https://github.com/tobiasfranziskus/Check/actions/runs/41674127634): **16/16 Node-Tests bestanden**, zwei originalhashidentische Nachweise (48h `64644f6b43a2e824` und 7d `00920e2a5507b371`); vollständige Original-Geld-/Waren-/Herkunftsaudits jede Stunde, tägliche Save/Load-Hashes, zusätzliche Dravos-eigene Neu-Lager- und Zahlungsbilanz. Die nochmals verschärfte Pinning-CI mit Veldra-Quelle und Altwarenrückkauf wird auf aktuellem Head separat überprüft.

**Nicht belegt** ist die konkrete Eis-/Rohstoffherkunft der **in Veldra** gekauften Nahrung; die originäre R15-Herkunft bescheinigt nur real neu produzierte Ware, nicht die Miner-Charge, aus der sie entstanden ist. Ebenso ist nicht belegt, dass genau die Dravos-Nahrungszahlungen die 160 ISK Materiallohn finanzierten – das allgemeine Stationskonto ist fungibel. Die Zeitfolge und realen Kontoüberweisungen **sind** hingegen tatsächlich ausgeführt. Dies ist eine isolierte NPC-Einzelwelt nach vorheriger Spielerkrise, keine natürliche Normalwelt von Start an und keine 13×90d-/iPad-/NAS-Abnahme.

**[OPTION] B-K11q:** Jetzt braucht es **keine neue Emissions- oder Preisregel**, sondern einen **wirtschaftlich vollständigen Stations- und Frachterzyklus**: einkaufbare/verbrauchbare Neuware gegenüber gratis verbrauchter Altware, Ertrags-/Kostenmarge der kaufenden Station, reale Folgeaufträge samt Risikopuffer und Schiffersatz. Ein zuerst nur testseitiges Gegenmodell kann untersuchen, was passiert, wenn Händler *vor* Einkauf nicht bloß ihre Verkaufs-Spanne, sondern auch die wirtschaftlich tragfähige Zielstationsnachfrage und langfristige Folgefahrt prüfen. **Keine Produktkorrektur ohne gesonderte Freigabe.**
