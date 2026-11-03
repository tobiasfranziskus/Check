# B-K12a – Eine reale Kostendeckung ist nicht automatisch eine finanzierbare Nachfrage

**[ANALYSE/DRAFT · 03.11.2026]** [PR #156](https://github.com/tobiasfranziskus/Check/pull/156), gestapelt auf [B-K12 #155](https://github.com/tobiasfranziskus/Check/pull/155). **[MAIN]** `b4e604d6` / v0.12.5 Regel14/Schema8 unverändert. Die simulierte Testwelt ist der **historisch isolierte R15-/Schema9-Core** mit unbeschlossenem Testlohn von **4 ISK pro Produktionsminute**. Keine Änderung von `index.html`, historische Core-Fixture, Preisen, Lohnsatz, Fondsemission, echten Spielständen oder Roadmap; kein Merge/Deployment.

## 1. Kausale Frage und identische Ausgangslage

B-K12 hat aus echten Produktions-/Waren-/Lohnbuchungen in Nadir nachgewiesen: Die erste neu produzierte Nahrungseinheit kostet **2 Eis × 22 ISK + 24 ISK Produktionslohn = 68 ISK**, die aus der bestehenden Haushaltskasse bezahlte Endabnahme zu damaligem Marktpreis bringt **53 ISK**. Nach 24 Stunden werden original **23 Einheiten zu insgesamt 1.031 ISK** konsumiert und bezahlt, deren nach FIFO wirklich bezahlter Produktionsaufwand **1.564 ISK** beträgt. **−533 ISK realisierte Stückkostenmarge** ist bei gleichzeitig vorhandenem, zum Ist-Einkauf bewertetem Lagerbestand nicht bloß ein Kassen-/Inventareffekt. Der ursprüngliche Spotpreis sinkt im Zeitverlauf; eine einmalige Regel `68/53` beschreibt nicht jeden Marktzeitpunkt.

In allen Varianten werden nur die **anfänglichen Nadir-Eis-/Nahrungsbestände aus Lager UND Anfangsledger entfernt**; kein Rohstoff hinzugefügt. Anfangs vorhandene NPC-Handelsfrachter halten, Miner/Produktion/Haushaltszahlung/Kampf und übrige Welt laufen real. Keine Fondsauffüllung und keine individuelle Hüllensubvention (wie der explizit strenge B-K12-Mikrofall), keine künstliche Geldquelle. **Gleiche Seeds 42/7** für Vergleich 24h; für **Seed42** zusätzlich die identischen Startwelten über 7 Tage.

## 2. Zwei ausschließlich testseitige Abnahmemodelle

**A – Haushalt deckt vollständige IST-Kosten:** Der originale Nahrungsmarktpreis bleibt als Markttransaktion bestehen. Zusätzlich verlangt die Testwelt für eine tatsächlich neu konsumierte FIFO-Charge einen separaten Leistungsbeitrag `max(0, reale bereits bezahlte Chargenkosten − Originalmarktpreis)` von **demselben Haushalt**. Der Haushaltscash muss *vor der Endabnahme* sowohl Marktpreis als auch den ergänzenden Betrag vollständig decken. Reicht er nicht, verbleibt die vorhandene Nahrung im Lager; **kein Gratisverbrauch**. Das ist wirtschaftlich **eine höhere effektive Käuferbelastung**, nicht eine genehmigte Preisreform.

**B – Haushalt bezahlt Spot, örtlicher Fonds die IST-Kostenlücke:** Der Haushalt muss seinen vollständigen originalen Spotpreis besitzen. Zusätzlich muss der freie vorhandene Cash des **lokalen Systemfonds** den exakt zum gleichzeitig tatsächlich konsumierten Neu-Los passenden Fehlbetrag decken. Die Zahlung erfolgt **nur beim realen Core-Endverbrauch**, nicht für bloße Fertigstellung oder Lagerhaltung. Bei fehlendem Käufer-/Fondsbudget keine Bezahlung und keine kostenlose Konsumation.

In beiden Gegenarmen läuft der Zusatzbetrag ausschließlich über die **Original-R15-Vertragsfunktionen** `reservieren → bezahlen → abschliessen`, samt echtem Zahlungsbeleg und identischem Geldkonto; weder Test- noch Produktcode erzeugen dadurch zusätzliche ISK. Der Original-Core bezahlt das Vorprodukt, den Testproduktionslohn und den normalen Haushaltskauf unverändert. Die Zusatzbuchung verändert ausschließlich die Zahlungsmodalität eines bereits wirklich produzierten und **bezahlten** Endverbrauchs. Es handelt sich ausdrücklich um eine **Abnahmefinanzierung zum Verbrauchszeitpunkt**, noch **keine vor der Produktion garantierte Fabrik-/Rohstoff-Auftragsfinanzierung**. Keine allgemeine Reparatur von Schiffersatz oder Sicherheitslohn.

## 3. [TEST] Unmittelbarer Erfolg und späterer Finanzierungsausfall

**24h-Vergleich:**

| Nadir | Seed42 Original | Seed42 Haushalt | Seed42 Fonds | Seed7 Original | Seed7 Haushalt | Seed7 Fonds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Tatsächlich bezahlte NEU-Nahrungseinheiten | 23 | **14** | **45** | 23 | **14** | **45** |
| Original-Markterlös vom Haushalt (ISK) | 1.031 | 620 | 1.779 | 1.031 | 620 | 1.779 |
| Zusatzkauf aus beständigem HH/Fonds-Geld (ISK) | 0 | **332** | **1.281** | 0 | **332** | **1.281** |
| Tatsächliche zugeordnete Istproduktionskosten (ISK) | 1.564 | 952 | 3.060 | 1.564 | 952 | 3.060 |
| Marge nur auf vollständig bezahltem Endverbrauch (ISK) | **−533** | **0** | **0** | **−533** | **0** | **0** |
| Fehlende Versorgungsstunden /24 | **14** | **18** | **2** | 14 | 18 | 2 |
| Nadir-Station Endcash | 6 | 7 | 145 | 6 | 7 | 145 |
| Lokaler Fonds Endcash | 2.207 | 2.199 | **1.139** | 2.604 | 2.596 | **1.536** |
| Gepinnter historischer Gegenwelt-Hash | `bfd818fd603159f6` | `00eb4a68c47d355b` | `bf55067d8a997e33` | `1f8f2bacf39228da` | `9b8a90836ca36244` | `56f475e72e3c1e0a` |

**Sieben Tage · Seed42, aus identischen Ausgangsbeständen:**

| Zusammengehöriger KPI | Original | Haushalt | Fonds |
| --- | ---: | ---: | ---: |
| Wirklich bezahlte Nahrung | 23 | 14 | **125** |
| Spotzahlung Haushalt | 1.031 ISK | 620 ISK | 4.163 ISK |
| Zusatzzahlungen | 0 ISK | 332 ISK | **2.872 ISK** |
| Tatsächliche Kosten der konsumierten Lose | 1.564 ISK | 952 ISK | **7.035 ISK** |
| Realisierte Marge auf diese Lose | **−533 ISK** | **0 ISK** | **0 ISK** |
| Nahrungsmangelstunden /168 | **158** | **162** | **107** |
| Nadir-Station Endcash | 6 ISK | 7 ISK | **18 ISK** |
| Nadir-Haushalt Endcash | 25 ISK | 56 ISK | 157 ISK |
| Lokaler Fonds Endcash | 2.207 ISK | 2.199 ISK | **11 ISK** |
| Noch gelagerte fertige NEU-Nahrung | 21 | 28 | 55 |
| Neue bezahlte Material-/Arbeitseinheiten (Nahrung hergestellt) | 44 | 42 | 180 |
| Tatsächlich abgewickelte zusätzliche Leistungsaufträge | 0 | 8 | **64** |
| Vollkostenbedingte Kaufablehnungen bei vorhandener Nachfrage | 0 | **159** | **103** |
| Gepinnter 7d-Hash | `5554f722d40b92b6` | `d7f658627d41237a` | `9aa487944d9f4aa5` |

**[NEGATIV]** Die Haushaltssonderzahlung rettet den Kostendeckungsbeitrag auf bereits verkaufte Nahrung, **verkleinert aber tatsächlich bediente Nachfrage und Versorgung**: 14 statt 23 bezahlte Einheiten, 162 statt 158 Mangelstunden. Der Haushalt kann die teurere Leistung nicht aus ausreichend neuem Einkommen finanzieren.

**[TEILVERBESSERUNG, NICHT STABIL]** Der Fondsweg deckt ebenfalls die nachgewiesene Stückkostenlücke bei jedem erfolgten Endverbrauch – aber die zusätzliche Zahlung von 2.872 ISK geht zulasten **endlich verfügbarer Fondsmittel**. Trotz laufender realer Fonds-Zu- und Abflüsse bleiben nach sieben Tagen **nur 11 ISK**. Immer noch **107 von 168** Versorgungsstunden mangelhaft, 55 fertige neue Nahrung bleibt unverbraucht im Lager, die Station besitzt nur 18 ISK freien Cash. Der gewachsene bezahlte Absatz ist keine dauerhafte eigenfinanzierte Versorgungsleistung.

**Die erste 68→53-Lücke ist konkret aus bereits bezahlt erworbenem Eis und Arbeiterlohn ableitbar**. Die späteren konsumierten Lose sind trotz gleicher Test-Lohnregel zum Teil günstiger, weil **reale Eis-/Marktpreise und die tatsächlich verarbeiteten Lose variieren**. 125 Einheiten im Fondsarm haben zusammen 7.035 ISK belegte Kosten, nicht pauschal 125×68. Die Zusatzaufträge decken **nur den historischen FIFO-IST-Aufwand tatsächlich verkaufter Nahrung**, nicht pauschal alle Lager-, Finanzierungs-, Sicherheits-, Risiko- oder Schiffersatzkosten.

## 4. Qualität, Grenzen und nächstes Entscheidungs-Gate

- **[TEST]** [Gezielte CI #41689564256](https://github.com/tobiasfranziskus/Check/actions/runs/41689564256) am Test-Head `b09e997609fc`: **3/3 erfolgreich**, 0 Fehler. Es wurden Seed42/7×24h Referenz/Haushalt/Fonds und Seed42×7d Referenz/Haushalt/Fonds wirklich ausgeführt; alle Stunden unabhängige Geld-/Waren-/Herkunftsaudits, dazu Core-Audit und täglicher Save/Load-Hash. Der echte initiale Weltgeldbestand in diesen Historienwelten ist **55.000 ISK**; die Endgeldmenge ist der unabhängig auditierte echte Startwert + die bestehenden Core-Emissionen − echte Senken. **Keine zusätzliche Emission.**
- **[TEST FEHLERKORREKTUR]** Die ersten beiden CI-Runs hatten eine fehlerhafte **Testannahme**, nicht Core-Abweichung: Zuerst wurde die Ausgangswelt irrigerweise als 50.000 statt tatsächlich 55.000 ISK angenommen; danach wurde die tatsächliche Nadir-Verbrauchsrate von mehr als einer Einheit/Stunde irrigerweise auf 1 begrenzt. Beides ist anhand der Originalreferenz richtiggestellt, **ohne** die Geld-/Warenaudits oder bestehenden Hashes zu lockern. Erst die CI #41689564256 ist der tatsächlich bestandene B-K12a-Gesamttest.
- **[KEIN WELTGATE]** Diese historisch isolierten Mikro-Szenarien sind weder volle R15-Welten mit aktiven Konkurrenzhändlern noch die 13×90-Tage-Wirtschafts-/Spielerkrisenprobe. Die hier zweckentfremdeten zusätzlichen Vertragsbelege sind ausschließlich Testversuche und keine Save-Migration oder Produktentscheidung. Keine iPad-Safari-/NAS-Abnahme.
- **[OPTION]** Der nächste notwendige Schritt ist nicht noch eine weitere Gebühr oder Gratiszahlung. Wir müssen **vor** Produktion und Warenankauf entscheiden, wer einen kostendeckenden und tatsächlich finanzierten Endauftrag erteilt, wie dieser Akteur aus echten Leistungen laufend Einnahmen erwirtschaftet und wie bei leerem Käufer- oder Fondsbudget automatisch auf rentables Ersatzangebot umgeschwenkt wird. Der Fonds darf nicht zum ungedeckelten Verlustträger werden. Gerade weil die lokale Nachfinanzierung kurzfristig funktioniert, aber über sieben Tage endet, sind **ohne zusätzliche echte Einnahmequellen oder niedrigere tatsächliche Kosten** keine nachhaltigen Versorgungsversprechen legitim. Produktionslohn-/Preisänderungen, neue öffentliche Dienstleistungen oder Emissionsregeln verlangen jeweils eine eigene Nutzerentscheidung.

**Empfehlung:** Keine der beiden B-K12a-Varianten integrieren. Nächster kleiner **[ANALYSE]**-Schritt: eine **vor Produktionsstart gesperrte Käuferreserve** und ihr wirtschaftlich belegter wiederkehrender Zufluss für Nadir/weitere Stationen prüfen, ohne Kaufkraft vorzutäuschen. Phase B bleibt gemäß verbindlicher `docs/ROADMAP.md` auf `main` vorrangig.
