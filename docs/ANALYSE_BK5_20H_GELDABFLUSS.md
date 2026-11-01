# B-K5 – Original-Core: 20-Stunden-Stückkosten und Tag-7-Liquiditätskollaps

**01.11.2026 · [ANALYSE/DRAFT] [PR #89](https://github.com/tobiasfranziskus/Check/pull/89)**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c` ·
v0.12.5 · Regel14 · Schema8, **unverändert**.
Dies ist ein unabhängiger Rechenbericht, **keine Produktmechanik,
kein neues Geldmodell-B-Minting, keine Spielstandsänderung und kein Merge**.
Die allein verbindliche Produktplanung bleibt `docs/ROADMAP.md`, Phase B.

## A. Zwanzig kontrollierte Original-Core-Wirtschaftsstunden in Cyris

**Quelle:** `tests/bk5-20h-originalkosten.test.mjs` mit den
*unveränderten Originalfunktionen* `foerderung`, `handel`,
`betriebskosten`, `produktion`, `preis`, `m_core_index.audit/hash`.
Je Teststunde genau 6 Minenförderungen, 6 Einheiten real bezahlter
Eisverkauf, 18 originale Rezept-Ticks (drei Nahrungseinheiten,
je Rezeptdauer 6), und drei zum **aktuellen** Spotpreis
tatsächlich bar bezahlte Nahrungskäufe. Die Restzeit ist
**kontrollierte Ruhezeit**, kein simulierter vollständiger
`m_core_step.step` mit Handel, Piraten, Piratenschutz, anderen
Fabriken und allen Stationen. **Das ist eine nachgewiesene
Wirtschaftszelle, keine 20-Stunden-Gesamtwelt.**

Ein aus vorhandenen `fonds_cyris`-ISK gebildetes Test-Haushaltskonto
startet mit **900 ISK**; globale `initialSupply` und `minted`
bleiben unverändert. Es gibt **keine** am Produkt gebuchte
Haushalts-Lohnregel: Auszahlungen aus realer NPC3-/Stations-
Kasse und bereits gezahlten Betriebskosten an dieses neue Konto
werden im Test als **analytische, vorfinanzierte
Verteilungsannahmen** ausgeführt.

**Eine nach Original-Core beobachtete Teststunde (Seed42):**

| Stufe | Menge/ISK | Bezahlweg |
| --- | ---: | --- |
| Neues Eis | 6 Einheiten | realer Eisminer, 6 Arbeitsminuten |
| Eis-Stationskauf | 6 × 13 = **78 ISK** | Cyris-Station → NPC3 |
| Original-Minerbetriebskosten | **15 ISK** | NPC3 → Cyris-Fonds |
| Original-Eis-Handelsgebühr | **3 ISK** | NPC3 → Cyris-Fonds |
| Reale Nahrungsherstellung | 3 Einheiten | 6 vorhandene Eis, Originalrezept |
| Tatsächlich bezahlter Nahrungsverkauf | **95 ISK** | Haushalt → Cyris-Station (3 dynamische Preise) |
| Verfügbarer Miner-Ertrag nach echten Kosten/Gebühr | **60 ISK** | NPC3, vor zukünftiger Ersatzausgabe |
| Verfügbarer Stations-Rohbeitrag | **17 ISK** | Station, **ohne** ursprünglichen Fabriklohn/-Ersatzkosten |
| Testweise Miner-Rücklage | **6 ISK** | verbleibt in NPC3-Kasse, keine echte Abschreibung |
| Testweise Fabrik-Rücklage | **3 ISK** | verbleibt in Stationskasse, keine echte Abschreibung |
| Fondsgebühr | **3 ISK** | verbleibt beim Fonds |
| Haushaltsempfang im Test | **83 ISK** | 15 echte bezahlte Minerarbeit rückverteilt + 54 Minerüberschuss + 14 Fabriküberschuss |
| Kaufkraftsaldo | **−12 ISK/Stunde** | reale Barzahlung 95 minus Testeinkommen 83 |

Die **6/3 ISK** sind offengelegte Analyse-Rücklagen, **keine
belegte Höhe der tatsächlichen Schiffsabschreibung oder
Produktionsinvestition**. Ein Frachter und sein
Wiederbeschaffungsbedarf sind in diesem 20h-Zellengate nicht
enthalten. Alle Zahlungen stammen aus Konten mit tatsächlich
vorhandenem Guthaben.

**20 Stunden: 120 Eis neu abgebaut, 60 Nahrung hergestellt und
vollständig bezahlt verbraucht**, alle Waren-/ISK-Audits positiv.
Haushaltskasse **900 → 660 ISK**; gleichzeitig Miner
**+120 ISK**, Fabrik **+60 ISK**, Fonds **+60 ISK**.
Summe der Transfers = 0; `minted=0`, `burned=0`.

Weitere tatsächlich getestete Gegenmodelle:

| Auszahlungspolitik im isolierten Test | Haushaltskasse nach 20h | Erkenntnis |
| --- | ---: | --- |
| Verteilung aus Originalerträgen mit 6/3 ISK Rücklagen, Fonds bezahlt tatsächlich anfallende Minerarbeit | **660** | Geld verlässt Haushalt mit 12 ISK/h |
| Wie zuvor, aber die an den Fonds gezahlte Minerarbeit nicht als Haushaltseinkommen zurückgezahlt | **360** | Leck 27 ISK/h |
| Keine Unternehmensrücklagen, aber Handelsgebühr verbleibt im Fonds | **840** | Leck 3 ISK/h |
| Keine Rücklagen, **sämtliche** Fondsgebühren und Minerarbeit an Haushalte | **900** | Gleichbleibende Nachfrage, **aber kein Kapitalaufbau** |
| Kein Haushaltseinkommen überhaupt (wie im heutigen Core) | **9 vollständige Stunden** | Zahlungsausfall in Stunde 10, trotz Restware |
| Wie erste Zeile, aber nur 120 ISK Haushaltsstart | **3 vollständige Stunden** | Zahlungsausfall in Stunde 4 |

**[MATHEMATISCHER BEFUND]** Bei Geldgleichheit
`Σcash = initialSupply + minted − burned` und fortgesetztem
Netto-Geldsparen des Spielers kann die ungebundene Marktliquidität
**ohne weitere Finanzierung oder rückfließende Ausgaben nicht
beliebig lange gleich hoch bleiben**. Ein 20h-Erfolg aus
Anfangskapital ist kein dauerhafter Wirtschaftskreislauf.
Der Test wählt bewusst günstige, aber offengelegte
Einkommensausschüttungen; die reale Produktwirtschaft
hat diese noch nicht.

## B. Frachter: keine pauschale Unprofitabilität am Start

Mit exakt **unverändertem originalen `bestesPaar`** wurden
die fünf tatsächlich gewählten NPC-Startup-Warenrouten
auf die von der Routensuche bisher nicht abgezogenen,
realen **250 ISK je 60 Minuten** Frachter-Arbeitskosten
geprüft. Alle fünf Anfangsrouten haben einen **positiven
Deckungsbeitrag NACH einem real berechneten Fahrtlohn**;
die Differenzen liegen bei **130, 171, 182, 203, 205 ISK**.

Dies ist ein **ex-ante Spotpreis-/Einweg-Check**,
**nicht** bereits ein realisierter, vollständig bezahlter
Frachtabschluss, kein Ersatzhüllen-/Risikoabschlag
und kein Nachweis der Langzeitprofitabilität.
**Nicht** pauschal frühe positive Frachterrouten verbieten,
nur weil spätere Frachter insolvent werden.

## C. 90-Tage-Krisen-Zeitreihe: Beginn, nicht nur Endstand

**Quelle:** `tools/bk5-krisenverlauf-v14.mjs`;
Seed **7/42**, aktiver echter Spieler-Miner mit Original-`shipMine`
auf Erz, jeweils 90 volle Spieltage, originale
`m_core_step.step/advance`, Save-/Load-Prüfungen,
eigenständige Geld-/Waren-Audits und laufende
Core-Checks. Historische `main`-Version14, keine
neue Endverbrauchsprämie, kein Test-Budget.

| Prüftag | Spieler Seed 7 | Spieler Seed 42 | NPC1/2-Frachter Seed 7 / Seed 42 |
| --- | ---: | ---: | ---: |
| 0 | 2.000 ISK | 2.000 ISK | 5 / 5 |
| 1 | 8.285 | 8.702 | 5 / 5 |
| 3 | 19.258 | 20.031 | 5 / 5 |
| 7 | 38.964 | 37.538 | 3 / 4 |
| 14 | **41.228** | **42.795** | **0 / 0** |
| 30 | 41.228 | 42.795 | 0 / 0 |
| 60 | 41.228 | 42.795 | 0 / 0 |
| 90 | 41.228 | 42.795 | 0 / 0 |

Am Tag14 sind insgesamt nach
Startgeld **55.000 ISK**, bisherigen Quellen und Senken
**50.000 ISK** Geld vorhanden:
Seed7 besitzt der Spieler **82,46 %**, Seed42 **85,59 %**
davon. Das ist der Anteil an der **weltweit vorhandenen
Kasse**, nicht am jährlichen Umsatz. In den beiden
Krisen sind am Tag14 die Händlerflotten verschwunden;
Geld-/Flottenbestände bleiben dann bis Tag90 unverändert,
während Nahrung und Medikamente lokal weiter fehlen.
Die bestehenden Güter sind zum Teil weiterhin räumlich
falsch verteilt, weil Transporte und Finanzierung ausfallen.

## D. Gegenfaktisch: Nach wie vielen aktiven Miningtagen kippt die Welt?

**Quelle:** `tools/bk5-stopspieler-varianten.mjs`.
Der Spieler erhält den echten Minenauftrag und stellt
ihn auf Wunsch **freiwillig** an Tag 0/1/3/4/5/6/7 ab,
oder fördert die vollen 90 Tage. Die **Spielfunktionen**
und alle übrigen Regeln bleiben 100 % Original.
**Das ist keine vorgeschlagene Begrenzung des Spielers
oder seines Vermögens**; nur ein Diagnoseeingriff
zur Quantifizierung des Liquiditätsabflusses.
Beide Seeds × acht Varianten × 90 Tage werden
bis zum Ende mit Core-Geld-/Waren-Audit gerechnet.

| Spieler fördert | Mangelstunden Seed7 / 42 (Tag90) | NPC1/2-Händlerfrachter Seed7 / 42 (Tag90) |
| --- | ---: | --- |
| 0 Tage | 57 / 58 | 5 / 5 |
| 1 Tag | 61 / 42 | 5 / 5 |
| 3 Tage | 882 / 591 | 5 / 4 |
| **4 Tage** | **6.514 / 6.561** | 5 / 5 |
| 5 Tage | 8.870 / 9.273 | 4 / 3 |
| **6 Tage** | **28.071 / 15.670** | 0 / 4 |
| 7 Tage | 35.637 / 35.318 | **0 / 0** |
| 90 Tage | 35.993 / 35.798 | **0 / 0** |

Die Beziehung ist **nicht monoton in der einzelnen
Schiffszahl** (Beispiel Seed42: 3 Tage → 4 Schiffe,
4 Tage → 5), da Piraten, Marktpreise, RNG und Ersatzkäufe
mit dem anderen Akteurverhalten divergieren. Die
**Versorgung** verschlechtert sich hingegen in
diesen zwei Seeds sehr deutlich ab **vier Miningtagen**
mit etwa **der Hälfte des weltweiten Geldbestands**
beim Spieler, bis hin zu vollständigem Totalausfall
ab sieben Tagen mit rund 75–78 % Spieler-Geldanteil.
Keine universelle Insolvenzkasse von 50 % ableiten;
zwei Seeds sind nur ein klarer Ursachenbeleg, kein
Balancing-Schwellwert.

## E. Originalzahlungen an den Spielerminer: Wer finanziert das Sparen?

**Quelle:** `tools/bk5-spielerminer-zahlungsquellen.mjs`.
Für 14 Tage wurde die **Originalfunktion `handel`**
instrumentiert; einzige zahlende Rohstoff-Station
für den Spielerminer ist **Aldera**.

| Original-Buchungen Tag 14 | Seed 7 | Seed 42 |
| --- | ---: | ---: |
| Bezahlte Erzverkaufsmenge | 7.412 | 7.698 |
| **Aldera zahlt brutto** | **60.214 ISK** | **62.588 ISK** |
| Original-Handelsgebühren | −2.244 ISK | −2.334 ISK |
| Tatsächlich bezahlter Spieler-Minerbetrieb | −18.742 ISK | −19.459 ISK |
| Spieler-Nettozuwachs | **+39.228 ISK** | **+40.795 ISK** |
| Aus keinem anderen Geldpfad erklärter Rest am Tag 14 | **0 ISK** | **0 ISK** |

Dies ist keine einzelne Stationszahlung aus 30.000
Start-ISK, sondern ein **kumulativer Umsatz über
14 Tage**, finanziert durch wiederkehrende Zu-
und Abflüsse im selben Core. Ein Zwischenstichtag
Seed42 Tag3 zeigt vorübergehend **77 ISK** anderen
Nettogeldfluss; am finalen Tag14 gleichen sich
die drei Hauptkanäle exakt aus. Die Spielerarbeit
war in beiden Seeds bezahlt und gerade
**nicht** der NPC-Kostenunterdeckungsfehler.

Die Menge an **an Aldera verkauftem Erz** ist
tatsächlich neu durch den Miner produziert.
Die danach weiterverarbeiteten Endwaren haben
dagegen heute keinen entsprechend **bezahlten
zivilen Endkunden**. Deshalb erhalten Stationen
keinen gleich verlässlich wiederkehrenden
Endabsatz-Cashflow, um sowohl den Spielerminer
als auch Händler, Rohstoffe und Schiffersatz
dauerhaft zu bezahlen.

## F. Projektleitungsentscheidung nach B-K5

**[BELEGT]** Der primäre untersuchte
Frühkrisen-Auslöser ist **schneller Netto-Geldabfluss
aus dem beschränkten Stations-/Händlerkreislauf
durch tatsächlich bezahlte Spieler-Erzverkäufe,
aber fehlende gleichwertig finanzierte
nachgelagerte Nachfrage**. Ungedeckte NPC-Arbeit,
Piraterie und Schiffersatz verstärken die Krise,
sind aber als isolierte erste Maßnahme nicht ausreichend.
Bereits an Tag 4 beginnen große Mangelstunden,
lange bevor alle Händlerhüllen verschwunden sind.

**[NICHT EMPFOHLEN]** Sparlimit für den Spieler;
garantierte Rettung einzelner NPC-Konzerne;
pauschal gesperrte Frachterrouten am Anfang;
vollständig zahlungspflichtiger Verbrauch ohne
Kaufkrafteinkommen; zusätzliche kostenlose NPC-Flotte;
noch eine beliebige Fondsumschichtung oder bloß
höheres Startkapital. Ebenso wenig ist eine
sofortige, ungekappte 6.000-ISK/Tag-Mintingregel
aus dieser Diagnose ableitbar.

**[NÄCHSTES KONKRETES KLEINGATE – ANALYSE/OPTION]** Im
unveränderten Haupt-Core einen **echten
leistungsfinanzierten Beschaffungsauftrag**
für die Rohstoffe der tatsächlich geplanten
Produktion prüfen, statt die Stationskasse
allein anhand eines Waren-Lagerziels nachzufüllen:
vor Auszahlung ausreichend Geld für
Herstellung, vorhandene Handelsverpflichtungen,
Betrieb und Schiffersatz vorsehen und den Kauf
aus echten bereits finanzierten
Endabnehmer-Aufträgen herleiten. Dieselben
wirtschaftlichen Regeln müssen für Spieler
und NPC gelten. Der Spieler darf weiterhin
beliebig viele ISK sparen, aber niemand
erhält eine kostenlose Absatzgarantie.

**Separat entscheidungsbedürftig:** Ein
belegter ziviler Endabsatz mit realer Kaufkraft
und gegebenenfalls begrenzter, global auditierter
ISK-Emission gegen tatsächlich neu
erbrachte Leistungen gemäß Geldmodell B.
Kein Preis, Budget, Emittent oder Geldschöpfungs-
mechanismus ist durch B-K5 genehmigt.
Der negative B-K4-Draft #88 ist weiterhin
ein anderer, nicht integrierter Versuch.

**Erfolg des Analyseabschnitts:** Der 20h-Mikrozyklus,
die frühen Frachter-Deckungsbeiträge und der
konkret beobachtete Tag-4-/Tag-7-Kollaps
sind falsifizierbar dokumentiert. **Noch kein
wirtschaftlich stabiler Produkt-Patch**;
Langzeit-PC-CI ersetzt keine iPad-/NAS-Abnahme.
