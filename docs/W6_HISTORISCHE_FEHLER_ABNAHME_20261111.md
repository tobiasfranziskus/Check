# W6 – Historische Wirtschaftsfehler und unabhängige Abnahmekriterien

> **[ANALYSE / INDEPENDENT REVIEW · 11.11.2026]** Eigenständige Auswertung der vorhandenen **Primärberichte und Messdaten** aus `Check` und `void-echoes`. 25 Geld-/Mengen-/Kostenidentitäten rechnerisch unabhängig geprüft; außerdem die drei archivierten X02-C-Messdatensätze und die vier C1b-1-Messdatensätze direkt eingelesen und ausgewählte Salden daraus rekonstruiert. **Kein neuer Core-, Browser- oder 90-/365-Tage-Simulationslauf.** Kein Entwicklungs-/Produktfreigabeentscheid. Die unten beschriebenen neuen Abnahmetests sind **noch nicht ausgeführt**.

**Repository-Abgrenzung:** `Check/main 04124f2bca27dc33b54be30c07b6a7bbb7387e81` hat Regel195/Schema8, W0–W5 und bestehende Save-Sicherung. Der freie 2D-Flug liegt in Forschungs-PRs #294/#296/#297/#298. `void-echoes` ist seit 28.10.2026 eingefroren, der nicht gemergte Alt-PR #10 bei `123875d3173eb2e6f64e60ee47a3a09ad6590ce0` ist **kein** Produktcode für Check. Verbindliche Produktentscheidungen stehen allein in `docs/ROADMAP.md`. Für die laufende gemeinsame Core-/Weltintegration durch Claude dürfen hier **keine** konkurrierenden Änderungen an Flug, Simulation, Preisen oder Spielstandformat vorgenommen werden.

## 1. Primärquellen und Evidenzklassen

| Kennung | Unveränderte Quelle | Beleg |
| --- | --- | --- |
| VE-B | [Altspiel X02-B, `main`](https://github.com/tobiasfranziskus/void-echoes/blob/a8e2e36faf8257ac2cc47780d12ea9e8e1f58b9f/docs/X02-B-BERICHT.md) | Endlicher Fonds, 72-h-Simulationsvergleich |
| VE-C | [Altspiel X02-C, PR #10](https://github.com/tobiasfranziskus/void-echoes/blob/123875d3173eb2e6f64e60ee47a3a09ad6590ce0/docs/X02-C-BERICHT.md), [Rohdaten](https://github.com/tobiasfranziskus/void-echoes/blob/123875d3173eb2e6f64e60ee47a3a09ad6590ce0/docs/messung/X02-C-simulator.json) | 3 × 72 h, Seed 1001, Einnahmen, regionale Fonds, Werftquote, Geldmengen |
| BK12 | [B-K12, archivierter Branch-Head](https://github.com/tobiasfranziskus/Check/blob/dfebc8d1e0270a6c7b31dd01d03556f25b01a018/docs/ANALYSE_BK12_WIRTSCHAFTSKREISLAUF.md) | Reale Stückkosten, lokale Stationskasse, Frachter- und Sicherheitskosten |
| BK12a | [B-K12a, archivierter Branch-Head](https://github.com/tobiasfranziskus/Check/blob/7f29e09e78fe2e7fa4c64552b908393309e77094/docs/ANALYSE_BK12A_NADIR_KOSTENDECKUNG.md) | Käufer- gegen Fonds-Finanzierung, nur temporäre Kostendeckung |
| W5r | [W5r-Ersatzflotte #200](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/W5R_ERSATZFLOTTE_ANLAGENSERVICE.md) | Echtgeld und fehlende kaufbare Ersatzhüllen |
| R32 | [W5s-ao-Gesamtanalyse #243](https://github.com/tobiasfranziskus/Check/blob/e921fd29cf4af33b0b325b4d656183638d12abd4/docs/W5S_AO_INTEGRIERTE_WIRTSCHAFTSANALYSE.md) | 13×90 mit identischer Wirtschaft, 39 Spar-/Eigentumsläufe, 6×730 Krisen |
| C1b | [C1b-1-Bericht #247](https://github.com/tobiasfranziskus/Check/blob/83538e9d1aab3d8d843e14158a17f79e02bc7aef/docs/C1B1_EXAKTES_C_WASSERPROFIL.md), [vier Messdatensätze](https://github.com/tobiasfranziskus/Check/blob/83538e9d1aab3d8d843e14158a17f79e02bc7aef/docs/data/C1B1_MESSWERTE.json) | Minutenweise Nachfrage, Kundenkasse, Rohstoff-/Frachtausfälle |
| W5aj | [#283 Sofortengpass](https://github.com/tobiasfranziskus/Check/pull/283), [#284 Kassenbrücke](https://github.com/tobiasfranziskus/Check/blob/ad8a22056f5786db9c755c523f1b3fea4b6109bc/docs/W5AJB_ALDERA_KASSENBRUECKE.md) | Treuhand temporär gebunden, später legitim freigegeben |
| W6a | [Nachfrage-Gegenbeweis #288](https://github.com/tobiasfranziskus/Check/blob/def1f7cac2ffd6010ee40c03723f9cd2b75997d5/docs/W6A_LOHNNACHFRAGE_FOLGEFRACHT.md) | Freiwillige echte Käufe ermöglichen begrenzte nächste Fracht |
| F2b | [Flugforschung #298](https://github.com/tobiasfranziskus/Check/pull/298) | 50 Eis am Feld, Dockverkauf; fehlende volle Piloten-/Flugkosten |
| C-Ref | [Berechnetes Konzept #245](https://github.com/tobiasfranziskus/Check/blob/008728e1f011540842eb090144fa40b284833788/docs/GESAMTWIRTSCHAFT_REFERENZMODELL.md) | Statische Vollkosten-/Mengenmatrix, **keine** dynamische W6-Abnahme |
| SAVE | [Regel195-Spielstandschutz auf main](REGEL195_SPIELSTAENDE.md) | `aphros-void-regel195-v1`, Alt-Rule14-Isolation, Import-/Tab-Konfliktschutz |

**Evidenzklassen:** **[HISTORISCH AUSGEFÜHRT]** = laut Primärbericht tatsächlich simulierter alter Core; **[ROHDATEN GEPRÜFT]** = gespeichertes JSON unabhängig ausgelesen; **[NEU NACHGERECHNET]** = mathematische Kontengleichung unabhängig rekonstruiert; **[ABNAHME ENTWORFEN]** = erst beim zukünftigen Integrations-Head auszuführen. Technisch erfolgreich beendete alte Testläufe können einen **wirtschaftlich gescheiterten Lauf** enthalten. Diese Zustände nicht verwechseln.

## 2. Historische Fehlerfälle – Ursache, Trennschärfe und zwingende Gegenprobe

### F01 – Der endliche Fonds bezahlt die Nachfrage nur vorübergehend (VE-B)

- **Historischer Messpunkt:** Im Altspiel X02-B ist Alderas zentraler Fonds nach ca. **48,2 Stunden** leer; zuvor erhält die Werft Geld und hält dadurch die Station liquide. Danach bricht die Kette ebenfalls ab. Beide Rollen verdienen in der letzten der 72 Stunden **0 ISK**.
- **Fehlerklasse:** Endliche Reserve statt wiederkehrender Finanzierung. Fondsvermögen in anderen Konten bzw. alte Gebühren sind keine unendliche Endnachfrage.
- **[ABNAHME ENTWORFEN]** Ein Endabnehmer muss jeden Auftrag **vor Verpflichtung** aus eigener aktueller Liquidität oder einem genehmigten, belegten Leistungsbudget finanzieren. Nach Budgetende stoppt der Auftrag ohne Seiteneffekt; ein späteres Folgegeschäft braucht reale neue Einnahmen oder genehmigte Ansprüche. Keine kostenlose Reserve- oder Stationsauffüllung.

### F02 – Neues Geld trifft nicht die zahlungsunfähige Stelle (VE-C)

- **[ROHDATEN GEPRÜFT]** Drei alte 72-h-Läufe Seed1001: `koop-aldera` wächst monetär **+15,6068 %**, Bergbau letzte Stunde **0**, Werftquote **78,8257 %**; `ohne-spieler` **−2,38665 %**, Werftquote **33,8929 %**, Handel laut Bericht ab ca. h36 weitgehend unbewegt; `koop-dravos` **+42,4329 %**, Bergbau letzte Stunde **0**, Werftquote **35,2905 %**. Alle alten Erhaltungschecks melden **0 Abweichungen**.
- **Fehlerklasse:** Kopfgeldemission und Einnahmen verbleiben beim falschen Akteur; volle regionale Fonds kaufen keine Waren, wenn der Stationsmarkt keine zahlbaren, realen Aufträge besitzt. Alt-X02-C hatte außerdem einen unbenutzten **Versicherungs-Mint-Pfad**, nicht bloß die ausdrücklich getestete Kopfgeldquelle.
- **[ABNAHME ENTWORFEN]** Für jede Region/Eigentümergruppe frei verfügbares Geld, gebundene Treuhand, reale Zahlungsströme, Quelle von Mint/Burn und **unbezahlte Kaufversuche** getrennt ausweisen. Steigende Gesamtgeldmenge bei stehenbleibender Endnachfrage als ökonomischen Fehlzustand erkennen; alte Kopfgeld-/Versicherungs-/Fondsrettungsregeln **nicht** in Check kopieren.

### F03 – Einkauf/Produktion können pro Stück Verlust machen (BK12)

- **[NEU NACHGERECHNET]** 2 Eis à 22 + 24 bezahlter Produktionslohn = **68 ISK** erste neue Nahrung; realer Endverkauf **53 ISK**, Marge **−15**. Die Stationskasse Nadir: `4.000 + 1.031 − 3.657 − 312 − 1.056 = 6 ISK`, obwohl Vorrat vorhanden bleibt. Verkauf von 23 neuen Nahrungen: **1.031 − 1.564 = −533 ISK**.
- **Fehlerklasse:** Kostendeckung je Los, Käuferpreis und Kapitalreichweite sind eigenständige Variablen; Marktpreis nach Einlagerung sinkt, während Einkauf bei vorheriger Knappheit erfolgte.
- **[ABNAHME ENTWORFEN]** Für jedes Los Inputs, Transport, Arbeit, Wartung, Abschreibung/Ersatz und bezahlte Abnahme mit tatsächlicher Ist-Preis- und Eigentümerkette rekonstruieren. Ein NPC darf begründet Verlust machen, aber eine als „rentabler Standardbetrieb“ deklarierte Kette darf nicht systematisch unter nachgewiesenen Vollkosten verkauft werden. Lagerbewertung ist kein Cash.

### F04 – Nachschuss beim Verbrauch erzeugt keinen dauerhaften Käufer (BK12a)

- **[NEU NACHGERECHNET]** Nur aus Haushaltscash bezahlte historische Nachfinanzierung: **620 + 332 = 952** für 14 neue Nahrung statt 23 im Original. Mit lokalem Fonds: **1.779 + 1.281 = 3.060** für 45 zunächst bezahlte Nahrung. Über 7 Tage im Fondsarm: **4.163 + 2.872 = 7.035** Ist-Kosten für 125 Abnahmen, Fonds am Ende **11 ISK**, Station **18 ISK**, **107/168** Stunden mit Versorgungsmangel.
- **Fehlerklasse:** Ein ausgeglichener Einzelverkauf ersetzt weder laufende Käuferlöhne noch rechtzeitig finanzierte Vorprodukte; ein endlicher Fonds trägt Verluste nur länger.
- **[ABNAHME ENTWORFEN]** Nach der ersten kostendeckenden Lieferung mindestens **einen weiteren Produktions- und Verkaufsauftrag** mit vollständigen Vorleistungskassen, eigenem Käufergeld und verbuchten Erlösen nachweisen. Zahlungen *erst bei Verbrauch* nicht als vorfinanzierte Liefergarantie bezeichnen.

### F05 – Nicht voll bezahlte Sicherheits-/Flugkosten sind keine kostenlose Leistung (BK12, F2b)

- **[NEU NACHGERECHNET]** BK12 Seed42: Soll-Sicherheitskosten **42.000**, tatsächlich bezahlt **6.440**, ungedeckte **35.560 ISK**. NPC1 sieben Tage: `22.433 − 17.262 − 961 − 5.659 − 1.500 = −2.949 ISK`; NPC2 `14.331 − 10.491 − 786 − 5.556 = −2.502 ISK`. F2b liefert 50 Eis zu **250 ISK** nach **100 ISK Förderlohn**: Bruttorest **150 ISK**, noch **vor** Flugpiloten, Hülle (600), Wartung und Ersatz.
- **Fehlerklasse:** Eine technisch ausgeführte Fahrt oder Kampfminute ohne vollständig gebuchte/fällige Kosten ist kein positiver Deckungsbeitrag. Historische BK12-Sicherheitskosten waren teils **nicht** als Schuld aufgelaufen – negative Lücke unabhängig vom Buchungs-Audit.
- **[ABNAHME ENTWORFEN]** Jede Flug-/Schutz-/Produktionsminute entweder vorher ausreichend finanziert, oder eindeutig als **nicht ausgeführte** Leistung gestoppt; echte Folgeverpflichtungen und ggf. Verbindlichkeiten bilanziert. Docking, Rückweg, Abbruch und Ersatz separat prüfen. Zählung aus der Grafik genügt nicht.

### F06 – Sparpolitik und Eigentümerkonzentration ändern den Markt (R32)

- **[HISTORISCH AUSGEFÜHRT]** Gleiche 90-Tage-Wirtschaft bei verschiedenen Eigentums-/Sparprofilen: **4.316** Wasser in NPC-`full`, **1.421** bei `npcSave`, **510** bei nur `wages` und **834** beim sparenden Spieler-Miner. 13 RNG-Seeds im Ausgangsprofil lieferten **identische** Wirtschaftskennzahlen.
- **Fehlerklasse:** Gesamtgeld und RNG-Varianz ersetzen keine Eigentümerrechte, freiwilligen Konsum oder wirtschaftlich verschiedene Regime.
- **[ABNAHME ENTWORFEN]** Vor Testbeginn Eigentümer-, Konsum-, Lohn-/Dividenden- und Insolvenzregeln parametrisiert protokollieren. Keine zwangsweisen Spielerkäufe, Geldabschöpfung bei Hortung, verdeckten NPC-Ausgaben oder „13 Krisenszenarien“ mit nur unterschiedlichem Seed. Ergebnis darf bei freier Hortung realistisch schrumpfen, muss aber ehrlich bilanziert bleiben.

### F07 – 730 Tage korrekt gerechnet und trotzdem stillgelegt (R32)

- **[HISTORISCH AUSGEFÜHRT]** Die sechs 730-Tage-Krisenläufe stoppen den letzten bezahlten Wasserabsatz an Tag **209** (ohne Außenexport), **303** (14-ISK-Export) oder **393** (7-ISK-Export). Bei Tag730 **0 aktive Frachter**, **0 frei kaufbare Frachterhüllen**.
- **[NEU NACHGERECHNET]** In der 7-ISK-Welt befinden sich **17.786 + 8.200 + 6.673 = 32.659** von 40.000 ISK bei nur drei anderen Eigentümern; privater Käufer **11 < 14 ISK**, Spediteur **600 < 930 ISK**, fehlende Eigenmittel **330 ISK**. Haushalt: `1.400 + 248.763 − 250.152 = 11 ISK`. `33.000 + 7.000 = 40.000 ISK` ist rechnerisch korrekt.
- **Fehlerklasse:** Ein grüner deterministischer 730-Tage-Test kann wirtschaftlichen Stillstand genau bestätigen. Gesamtgeld- und Warebestände helfen dem illiquiden Endabnehmer oder Schiffsbesitzer nicht automatisch.
- **[ABNAHME ENTWORFEN]** Letzten **bezahlten** Verkauf, Produktions- und Lohnzeitpunkt, Auftragssperre und Ausfallursache pro Region/Eigentümer dokumentieren. Erfolgsclaim „W6-Dauerbetrieb“ braucht real durchgehende **Möglichkeiten** für wiederholte, legale Wertschöpfung im ausdrücklich tragfähigen Basisfall; keine Rettungspflicht in Extremkrisen. Nachfolger nur über echte Firma, Vertrag und bezahlte Hülle.

### F08 – Exporterlös ist nicht automatisch Gewinn oder Dauerrettung (R32, C-Ref)

- **[NEU NACHGERECHNET]** Alte 50er-Wasser-Direktkosten **11,80 ISK/Stück**: 1.000 Wasser × (7 − 11,80) = **−4.800 ISK**, 500 × (14 − 11,80) = **+1.100 ISK** *vor* zusätzlichen Wartungs-/Ersatzkosten. Beide Varianten hatten bei Tag730 kein aktives Transportnetz.
- **Fehlerklasse:** Mint plus exportierte Ware belegen keine positive Nettomarge; einmalig 7.000 ISK sind nicht dasselbe wie dauerhaft erneuerbare und **global begrenzte** Lieferaufträge.
- **[ABNAHME ENTWORFEN]** Bei einem **ausdrücklich freigegebenen** Testexport: Auftragsrechte vor Zuschlag reservieren, reale Herstellung und bezahlten Transport bis Meridian, einmalige physische Ausbuchung, einmalige Emission bei Übergabe, ein globaler Etat über alle Export-/Kopfgeld-/Fundpfade. Unterkostenangebote dürfen von NPC abgelehnt werden. Ohne Produktfreigabe bleibt Mint **OFF**. Referenz-C-Werte (240 ISK/Tag, hypothetische 400er-Tages-/12.000er-30d-/146.000er-365d-Grenzen) sind **nicht beschlossen**.

### F09 – Freie Kasse ist noch keine physische Ersatzhülle (W5r, C1b)

- **[HISTORISCH AUSGEFÜHRT]** W5r: Am Tag30 ist der Frachter ausgefallen, die Spedition hat **1.250 ISK**, aber **0** Frachter im Werftlager. Am Tag45 scheitert die nächste Nachfolge ohne bezahlte neu gebaute Hüllen. C1b-1: Frachterbestand fällt aus, Betreiber besitzt später **2.150 ISK**, aber weiterhin keine käufliche Hülle.
- **Fehlerklasse:** Falsche Optimismusannahme „Cash ≥ Preis → neue Ware existiert“. Kalender-Verschleiß 15/30d in R32 ist eine **Forschungsannahme** und kein beschlossenes W6-Modell.
- **[ABNAHME ENTWORFEN]** Verlust-ID, Ladungsverlust, freie Ersatzhülle, Eigentümergeld, bezahlt hergestellte Inputs, Werftvertrag und echte Überführung getrennt prüfen. Bei fehlender Hülle: *kein* Schiff trotz überschüssigem Cash. Ein zulässiger Nachfolger muss Material, Arbeit, Eigentumsübergang und **erneute Flug-/Betriebsreserve** nachweisen.

### F10 – Gefülltes Lager trotz nicht finanzierbarer Endnachfrage (C1b)

- **[ROHDATEN GEPRÜFT]** 90-Tage-Datensatz `C1b-1`: **900** geplante Kaufversuche = **234 bezahlt + 665 mangels Cash + 1 mangels Ware**. **300 Wasser produziert − 234 verkauft = 66 im Lager**, Endkunde **8 ISK** für einen Kauf zu **18 ISK**. Erste Cash-Sperre Tick **31.536** bei **14 ISK** und **33** lagernden Wasser; letzter bezahlter Verkauf Tick **45.648**. Die Rohdaten weisen über alle Eigentümerkassen weiterhin **33.000 ISK** und **0 Mint** nach.
- **Fehlerklasse:** Warenknappheit und Kaufkraftlücke sind getrennte, möglicherweise gleichzeitig auftretende Gründe; reine Produktionsrate ohne Käufer kann nicht wirtschaftlich nachhaltig sein.
- **[ABNAHME ENTWORFEN]** Pro abgelehntem Kauf Kunden-Cash **vorher**, angebotenen Preis, Lager, Ort, rechtmäßige Zuordnung und eindeutigen Grund protokollieren. Niemals fehlende Nachfrage nachträglich „nachholen“, wenn kein gültiger Kaufvertrag besteht. Keine automatische Auffüllung der Kasse.

### F11 – Temporär gebundene Treuhand wird als „Geld weg“ fehlinterpretiert (W5aj → W5aj-b)

- **[HISTORISCH AUSGEFÜHRT]** Bei Tick550: Aldera **0 freie ISK, 1.000 ISK** rechtmäßig in W1-Erz-Käufen reserviert. Sofortige dritte Eisabnahme für **250 ISK** muss ohne Nebenwirkung abgewiesen werden. Nach weiteren **50 realen Core-Minuten**, Tick600, sind Reserven durch **vorfinanzierte Arbeit** verfügbar; derselbe Kauf ist möglich, Aldera hat danach **750 ISK**. Die danach mit **490 ISK Käufergeld und 120 ISK Speditionslohn** finanzierte dritte Rundfracht endet Tick720. Seed42/7 unterscheiden sich danach in Nadirs freier Kasse (**2.066 / 66 ISK**).
- **Fehlerklasse:** Schnappschuss von `cash=0` ist weder dauerhafte Insolvenz noch globale Geldvernichtung. Umgekehrt ist reserviertes Geld **nicht** sofort zum Kauf verfügbar.
- **[ABNAHME ENTWORFEN]** Zwei Tests mit **derselben** Welt und unterschiedlichen zulässigen Core-Zeitpunkten: vor Freigabe strikt gesperrt; nach rechtmäßiger Vertragsfreigabe zulässig. Keine Wartezeit überspringen, keine Reserven während Laufzeit doppelt ausgeben, kein fremdes Konto „kurzfristig“ belasten. Die alten Tickzahlen gelten als **historische Referenz**, nicht als unveränderliche neue W6-Regel.

### F12 – Freiwilliger Lohnkonsum kann ein echtes Finanz-Gate öffnen (W6a)

- **[HISTORISCH AUSGEFÜHRT]** Original-Rule195, Seed42/7: Nadir **406 ISK** frei, Kaufauftrag benötigt **490 ISK** und Spedition zusätzlich **120 ISK**. Fünf freiwillige Wasserkäufe à 14 bringen **476 < 490**, Auftrag bleibt blockiert; erst sechs Käuferzahlungen bringen **490** und ermöglichen den zweiten realen Eisflug. **33.000 ISK**, **0 Mint**, **100 Eis geliefert**, **360 bezahlte Flugminuten** bis Tick480 im isolierten Test.
- **[NEU NACHGERECHNET]** `406 + 5×14 = 476`; `406 + 6×14 = 490`. Kein 84-ISK-Transfer aus erfundenem Käuferguthaben.
- **[ABNAHME ENTWORFEN]** Zwei Eigentümerkassen und zwei Ablehnungen/Erlaubnisse getrennt prüfen. Ein Angebot bei unzureichender Käuferkasse darf weder als finanzierte Quote erscheinen noch den Core verändern. Eine Kaufkette nach Rückfluss beweist **einen** zusätzlichen Zyklus, nicht 90 Tage Dauerwirtschaft oder Konsumpflicht.

### F13 – Physischer Dockverkauf ersetzt keine Flugbetriebsrechnung (F2b)

- **[HISTORISCH AUSGEFÜHRT]** Rule198-Forschungsweg: 50 physisch am Eisfeld geförderte Einheiten, **100 ISK echte Förderarbeit**, ursprünglicher Dockverkauf **250 ISK**; die 50 Eis bleiben während des Rückflugs an Bord, der Verkauf ist erst am richtigen Dock erlaubt. Positive Bruttodifferenz **150 ISK** ist **nicht** der Schiffsertrag nach Kauf, Pilotlohn, Verschleiß und Risiko.
- **[ABNAHME ENTWORFEN]** NPC- und Spielerpfad mit identischer Core-Orts-/Eigentumsprüfung; Rückflug/Andocken/Teilabbruch, Frachtlager und Save/Load testen. Für neue W6-Kette volle Flugpiloten-/Betriebskosten rechtzeitig finanzieren oder Start verweigern. Nicht allein alte F2b-Hashes als W6-Ökonomietest zählen.

### F14 – Unterschiedliche Seeds sind nicht notwendigerweise unterschiedliche Wirtschaftsregime (R32)

- **[HISTORISCH AUSGEFÜHRT]** Die ursprünglichen **13 Seeds × 90 Tage** ergaben in allen Welten **4.316** Wasserverkäufe und **88** Eisfrachten trotz unterschiedlicher RNG-/State-Hashes. Erst ökonomische Profile (`npcSave`, `wages`, `full` mit anderem Eigentümer) veränderten die Ergebnisse stark.
- **[ABNAHME ENTWORFEN]** Vor Start pro Szenario einen **Parameter-Fingerprint** für ökonomische Unterschiede dokumentieren, nicht nur Seed. Mindestens **13 tatsächlich unterschiedliche wirtschaftliche Regel-/Eigentums-/Nachfrage-/Verlust-/Kapitalregime × 90 Tage** plus explizite Wiederholung mit identischen Seeds/Kommandos. Jeder Lauf meldet seine erste blockierende Rechnung; bei Ausfall muss er **auditierbar** sein, nicht künstlich gerettet. Keine behauptete Wahrscheinlichkeit aus dem Seed-Vergleich ableiten.

### F15 – Statische Modell-C-Gleichungen sind kein dynamischer Spielnachweis (C-Ref)

- **[NEU NACHGERECHNET]** Für den vorgeschlagenen statischen Referenzpunkt: `299,029311 + 227,370689 = 526,40 = 286,40 + 240` ISK/Tag. Ohne gesetzten Vertragsmechanismus fließen die 240 **nicht** ins Spiel. Historische R32-/Rule195-Welten mit **33.000** ISK und der vorgeschlagene C-Referenzstart mit **55.000** ISK, andere Hüllenpreise (600/750 vs. 1.340/1.690) und andere Rezepte sind verschiedene Versuchsgrundlagen.
- **Fehlerklasse:** Rechenstabile Mengenmatrix bei hypothetischem Abnehmer belegt weder geografische Lieferfähigkeit noch tatsächlich verfügbare Betriebskassen und Ersatzhüllen. Auch das C-Modell gibt bei beliebiger Geldhortung keine Stabilitätsgarantie.
- **[ABNAHME ENTWORFEN]** Keine alten Welt-Saves auf neue Geldverteilung uminterpretieren. Rechnungsmodell, freigegebene Produktparameter und real gebuchte Core-Verträge einzeln vergleichen. Unter dem vorgeschlagenen endlichen Tagesdeckel darf hohe Hortung die Wirtschaft **rechtmäßig** schrumpfen lassen. Ein nicht vom Nutzer freigegebener Emissionspfad muss dauerhaft deaktiviert bleiben.

### F16 – Versionsvermischung gefährdet Wirtschaft und Spielstände (SAVE, #294–#298)

- **[MAIN]** Regel195 ist eine produktive Welt; alte Regel14-Daten liegen unter anderem in einer **anderen IndexedDB**, und Rule196/197/198 sind separate Forschungssave-Profile. Eine gemeinsame aktive Welt bedeutet **nicht**, diese Dateien und Datenbanken unter einem Namen zu überschreiben.
- **[ABNAHME ENTWORFEN]** Vorsicherung, Importvalidierung, Besitzer-/Auftrags-ID-Eindeutigkeit, Midflight-Export, deterministischer Replay, Regel-/Schema-/Origin-Konflikt und Fremdformat-Ablehnung. Alten Regel14-Sentinel und manuelle Slots **vor/nach** allen Tests unverändert vergleichen. Kein automatisch „gültiger“ Rule198-Import nur wegen gleicher Schema8. Ein neuer Ziel-Core darf nur **ausdrücklich implementierte und auditierte** Migrationen anbieten.

## 3. Unabhängige numerische Rekonstruktion

**[NEU NACHGERECHNET]** 25 separate arithmetische Identitäten wurden in einer von den historischen Core-Implementierungen unabhängigen JavaScript-Ausführung kontrolliert (keine importierten Simulationsmodule, kein neues Replay, keine Quellwertänderungen). **25/25 Rechnungen konsistent**; Rundungsdarstellung bei binären Gleitkommazahlen berücksichtigt. Die Rechnungen im Überblick:

| Prüfgruppe | Unabhängig nachgerechnete Identitäten |
| --- | --- |
| BK12 | `4.000+1.031−3.657−312−1.056=6`; `44+24−53=15` Kostenlücke; `1.031−1.564=−533`; NPC1 `22.433−17.262−961−5.659−1.500=−2.949`; NPC2 `14.331−10.491−786−5.556=−2.502`; `42.000−6.440=35.560`; `50.000+1.440−6.440=45.000` |
| BK12a | `620+332=952`; `1.779+1.281=3.060`; `4.163+2.872=7.035` |
| R32 | `17.786+8.200+6.673=32.659`; `1.400+248.763−250.152=11`; `33.000+7.000=40.000`; `750+60+120=930`; `930−600=330`; `1.000×(7−11,80)=−4.800`; `500×(14−11,80)=1.100` |
| C1b | `234+665+1=900` |
| W5aj | `1.000−250=750` nach Freigabe und Einkauf |
| W6a | `406+5×14=476` und `406+6×14=490` |
| F2b | `50×5−50×2=150` vor Flug-/Ersatzkosten |
| C-Ref | `299,029311+227,370689=526,40`; `526,40−286,40=240`; `2×(1.690+270+204)=4.328` als hypothetischer neuer Doppel-Nachfolgerbedarf ohne Risikopuffer |

**[ROHDATEN GEPRÜFT]** Zusätzlich die JSON-Ausgaben von VE-C und C1b unabhängig geparst: VE-C enthält 3×72-h-Protokolle und jeweils `erhaltung.abweichungen=0`, aber die wirtschaftlichen Abnahmefelder für beide Koop-Welten melden `einkommenLetzteStundeBeideRollen=false` sowie für alle drei `werftAlderaMind90=false`. C1b enthält genau vier 30-/90-Tage-Datensätze; für **jeden** ist die Summe aller ausgewiesenen Eigentümerkassen `33.000` und `minted=0`. Für C1b bei 30 Tagen gilt `217 + 82 + 1 = 300`, bei 90 Tagen `234 + 665 + 1 = 900`. **Diese zusätzlichen JSON-Kontrollen sind keine erneute Simulation.**

## 4. Verpflichtende neue Abnahmematrix für Claudes Integrations-Head

Für alle Gates sind **Istwert, Quellkommando/Vertrag, Eigentümer-ID, Warengröße, Zeitpunkt, Seed, Regelprofil, Save-/Schemaidentität, Hash, Testskript/CI-Link und tatsächliche Laufdauer** zu protokollieren. Die alten Zahlen in Abschnitt 2 sind **Golden-Anker nur für das unveränderte historische Szenario**, keine willkürlich auf eine neue Wirtschaftsregel zu übertragenden Erwartungswerte.

| Gate | Geforderte dynamische Prüfung | Bestehenskriterium / negative Gegenprobe |
| --- | --- | --- |
| **G00 – Quelle/Version** | Explizit aktueller `main` plus integrativer Head, Abgleich Rule195/196/197/198, Komponenten, RNG/Tick und Herkunft jeder Buchung | Genau **eine** autoritative aktive Core-Welt; keine konkurrierende Wirtschaftsinstanz, niemals ungeprüfter Save-Import |
| **G01 – Geldbuch** | Für jeden Tick `M_t = M_0 + Σ Mint_belegt − Σ Burn_belegt` über alle Eigentümerkassen **inkl. Treuhand, genau einmal gezählt** | Nicht autorisierte Emission, Doppelabrechnung, heimlicher Ownertransfer oder negatives ungedecktes Konto => durchgefallen |
| **G02 – Waren/Bestände** | Los-/Schiff-/Modul-Herkunft, Warenzufuhr, Produktion, konsumierter, exportierter oder verlorener Bestand, Dock, Frachtvolumen | Kein physisches Doppelverkaufen, Gratisrohstoff/-hülle, Fernhandel am falschen Ort oder fehlender Ersatzverlust |
| **G03 – Volle Leistungskosten** | Vollkosten für mindestens je ein Erz-, Eis-, Wasser-, Material-, Hüllen- und Frachtlos mit realer Arbeits-/Rückfahrts-/Wartungs-/Ersatzbuchung | Alle **tatsächlich ausgeführten** Leistungen bezahlt oder rechtmäßig als Verbindlichkeit/Schaden anerkannt; keine unfinanzierte Schiffs-/Pilotenminute |
| **G04 – Reale Käuferbudgets** | Haushalt, Station, Industrie, Werft und Außenkunde mit frei/gebunden getrennt; erzwungene Kaufkraftlücke und vorhandenem Lager | Fehlende Kaufkraft stoppt atomar; Ware bleibt; **kein** automatisch erzwungener Privatkauf oder Eigentümerrettung |
| **G05 – Echte Folgefinanzierung** | Nach gelieferter und tatsächlich bezahlter Ware ein zweiter vollständiger Kauf-/Herstell-/Transportzyklus mit demselben Core | Folgeauftrag ist aus **echten** neuen Transaktions-/Arbeits-/Endkundenerlösen finanzierbar; Startkapital und Treuhand nicht doppelt verwendet |
| **G06 – Treuhandzeit** | Bei vorhandener Reservierung Blockierung, anschließend echte Arbeits-/Lieferfreigabe und Wiederantrag | Keine vorzeitige Buchung; nach realer Freigabe kein fälschlicher permanenter Totalausfall |
| **G07 – Ersatz statt Scheinliquidität** | Vier Fälle: Cash/Hülle jeweils vorhanden oder fehlend; Hülle real gebaut, Verlust, neue ID, Überführung, Auftrag | Kauf **nur** bei gleichzeitigem Eigentümercash und physischer Kaufware; voll finanzierter Ersatz nimmt Arbeit auf; kein Gratisrespawn |
| **G08 – Endnachfrage** | 90 Tage mit tatsächlichen Löhnen, freiwilligem Verbrauch, Geldumlauf und eigenen Kassen je Region | Tatsächlich bezahlte Verkäufe sowie Zeitpunkt/Grund des letzten Geschäfts statt nur nomineller Nachfrage; Kostenmargen getrennt |
| **G09 – Kapitalstress** | **13 ökonomisch unterschiedliche** 90-Tage-Regime, darunter Sparen, Konkurrenz, fehlende Nachfrage, Rohstoff-/Frachter-/Werft-Ausfall, Insolvenz | Parameterunterschiede belegt; jedes Ergebnis mit Einnahmen, freien Kassen, Waren, Schäden und erster Blockade. Krisen dürfen **ehrlich** scheitern |
| **G10 – Längerfristige Fortsetzung** | Mindestens ausgewählte **365d-Krisen**, später wichtige **730d-Grenzfälle**; gesunder Basisfall ohne erzwungene Sparkäufe | W6-Daueranspruch nur bei echter, über längere Zeit **möglicher** wiederholbarer Bezahlung von Ersatz/Produktion/Endabsatz im vorher deklarierten Betriebsbereich |
| **G11 – Spar-/Eigentumsfreiheit** | Spieler hortet, NPC behält Gewinne, alternative Firmen gründen oder übernehmen freiwillig | Keine Negativzinsen/Umverteilung oder Rettung wegen passivem Kapital; Konkurse erlaubt, reale Nachfolgekosten vollständig gedeckt |
| **G12 – Außenetat** | Ohne Nutzerfreigabe Mint **OFF**; sonst gesondert genehmigte physische Meridian-Lieferung inkl. Transport, Einmalzahlung und mehrere gleichzeitig konkurrierende Ansprüche | Keine doppelte Emission, keine frei erfundenen Exporte, globale Rate/Periodenrechte eingehalten, kein Geld wegen Insolvenz |
| **G13 – Migration/Replay** | Rule14-Sentinel, produktive Rule195-Slots, Forschungs-Rule196/197/198, fehlerhaftes/fremdes JSON, Midflight-/Midorder-Save, Tabs und Browser-Origins | Nie einen alten Stand still überschreiben. Explizite Migration reproduzierbar, sonst sichere Ablehnung; identisches Replay und keine Doppelabrechnung |
| **G14 – Geräte/Release** | Node22, Chromium und WebKit, dann **echtes** iPad Safari und statisches NAS mit Export/Import/Touch/Safe-Areas | CI/Emulation nicht als reale Gerätetest-Abnahme ausgeben; **kein** Main-Merge/Deployment ohne Nutzerfreigabe |

### 4.1 Vorschlag für 13 tatsächlich ökonomisch kontrastierende 90-Tage-Läufe

Die folgenden **noch auszuführenden** Regime sind keine neuen verpflichtenden Spielregeln und keine Behauptung über die beobachteten Resultate. Parameter nur innerhalb der jeweils freigegebenen Produkt-/Forschungsregeln variieren; jede Ausgangslage explizit kapital- und warenbilanzieren:

| ID | Variable gegenüber einer erklärten, finanzierten Basiskonfiguration | Zentrale Messgröße |
| --- | --- | --- |
| S01 | Baseline, freiwillige reale Privatausgaben, vollständige aktuelle Verträge | bezahlte Folgezyklen und echter Ersatz |
| S02 | Spieler spart alle eigenen Erlöse | Einnahmeverteilung / legale Schrumpfung |
| S03 | NPC-Miner behält seinen Gewinn vollständig | Käufergeld / Warenabsatz |
| S04 | Gewinne ohne Dividendenauszahlung, Haushalte ausschließlich mit Löhnen | Löhne gegen Warenkorb |
| S05 | Großes rechtmäßiges Anlegercash bei Nichtinvestor | freies Kapital beim Frachterbetreiber |
| S06 | Nachfragepreisschock oder privater Käufer zahlt tatsächlich nicht | atomare Auftragssperre |
| S07 | Vorfinanzierte Aufträge binden Stationscash temporär | Treuhandfreigabe nach wirklicher Arbeit |
| S08 | Physischer Frachterverlust bei vorhandener eigener Ersatzkasse, **ohne** fertige Hülle | Werftinventar-/Herstellungsengpass |
| S09 | Kaufbare Ersatzhülle, **zu wenig** Kapital für Kauf, Überführung und Arbeit | korrekte Kaufverweigerung |
| S10 | Wichtige Erz-/Siliziumroute fällt aus | realer Materialmangel und alternative Angebote |
| S11 | Zwei konkurrierende wirtschaftlich getrennte Unternehmen | Margen und Eigentümerkonkurrenz |
| S12 | Insolvenz eines Transporteurs, möglicher freiwilliger Nachfolger | reale Eigenkapital-/Auftragsfinanzierung |
| S13 | Eventuell genehmigter externer Etat ausgelaufen **oder** nachgewiesener Null-Export | Nachfrage und Produktion ohne fingierte Aufträge |

**Wichtige Testsemantik:** Ein negatives Szenario besteht die **Regel- und Buchhaltungsabnahme**, wenn es exakt nach seinen Finanz-/Ressourcenbedingungen stoppt; es besteht **nicht** automatisch den Nachweis dauernder Wirtschaft. Für einen „dauerhaft finanzierten W6-Basisbetrieb“ muss eine **konkrete, realistische Basiskonfiguration** mit echten Verkäufen, Waren, Personal und Ersatz über die beanspruchte Zeit nachgewiesen sein. Nur dann kann über Balancing und Produktfreigabe entschieden werden.

### 4.2 Freigabegrenzen

- **[TECHNISCHE MINDESTABNAHME]** G00–G07 und G13 plus tatsächlich ausgeführte Tests auf dem konkreten Integrations-Head; W0–W5-Funktionen und bestehende Save-/Doppeltab-Sicherung erhalten.
- **[WIRTSCHAFTLICHE W6-ABNAHME]** Zusätzlich G08–G12 und ökonomisch differenzierte S01–S13, unabhängiger Blick auf Eigentümer-/Betriebskapital, tatsächlich bezahlten Endabsatz, Wartung und physischen Ersatz. Auch bei grünem Audit ist ein gemessener Dauerstillstand **kein** tragfähiger W6-Abschluss.
- **[PRODUKTENTSCHEIDUNG OFFEN]** Entwurf C und konkrete Exportrechte, Lohnsätze, Preise, Abschreibung, Verschleiß, Eigentümer-/Dividendenrechte und 33k/55k-Neustartprofil sind **nicht** durch diese Analyse freigegeben. Geldmodell B, Sparfreiheit und Insolvenzrecht gelten weiter.
- **[GERÄTE- UND MERGEFREIGABE OFFEN]** Keine echten iPad-/NAS-Tests durch diese Dokumentationsarbeit, kein Merge nach `main`, keine Veröffentlichung, kein automatischer Save- oder Versionstransfer.

## 5. Übergabe an den Integrationsentwickler und unabhängige Prüfer

Erforderlich sind später pro Gate: ausgeführter Testbefehl, Testanzahl/PASS/FAIL/SKIP, konkreter Quell-Commit, CI-Link, zwei exakt gleiche Replays, vollständige Herkunft der Geld-/Warenbelege, jeweiliges Eigentümerkonto und erste ausgefallene Finanzierung. Für dynamische Szenarien zusätzlich Zeitreihen **letzter bezahlter Verkauf / letzte Arbeit / letzter Auftrag / tatsächlich kaufbare Hülle**. Jeder Abweichung von den historischen Ergebnissen ist eine **geänderte Regel oder Ausgangslage** zuzuordnen, nicht nur eine neue Referenzzahl.

**Nächster unabhängiger Review nach Vorliegen eines Claude-Drafts:** Einwelt-Kernstruktur, Zahlungsidentitäten, Endkunden- und Industrieetat, reale physische Frachtrouten, Save-Migration und 13×90-Diversität gegen G00–G14 lesen und **erst danach** neue Tests selbst ausführen. Die vorliegende Dokumentation darf keines dieser Gates vorab als bestanden markieren.
