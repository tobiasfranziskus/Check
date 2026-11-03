# B-K11f – Ein Auftrag ohne Gratisgeld: Escrow, Verlust und Wiederholbarkeit

**[ANALYSE/DRAFT · 03.11.2026]** Ausgangspunkt [main `b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c), v0.12.5 / Regel14 / Schema8. **Keine Änderung an `index.html`, Geldemission, Preis-/Lohntarifen, Spielständen oder Spielregeln. Keine Merge-/Deployment-Freigabe.**

## Warum genau dieser Auftrag

Die früheren tatsächlich ausgeführten, nicht integrierten [B-K10k-Chargenprüfungen #128](https://github.com/tobiasfranziskus/Check/pull/128) enthalten einen ungewöhnlich genauen Beleg: **8, 16 und 24 neu hergestellte Nahrungseinheiten aus original neu gefördertem und aus Stationskassen bezahlt eingekauftem Eis, mit tatsächlich aus der Test-Rezeptreserve gezahltem 4-ISK/min-Fabriklohn, Original-Frachterflügen und einmaliger direkt durch vorhandene Haushalts-ISK bezahlter Lieferung**. [B-K11e #143](https://github.com/tobiasfranziskus/Check/pull/143) hat das parallele Problem der Quellenliquidität im unveränderten `main` bereits untersucht.

**Diese Rechnungen werden nicht erneut als neue reale Core-Lieferung ausgegeben.** B-K11f nimmt die originalen belegten B-K10k-Zahlungsbeträge als **fixierten Prüfdatensatz** und prüft einen bisher fehlenden Punkt: Können alle beteiligten Akteure zu jedem Zeitpunkt die **gesamten Verpflichtungen einschließlich Warenbeschaffung, Löhnen, Arbeit, Frachterreise und einer echten monetären Hüllenreserve** vorfinanzieren, ohne Kredit, Emission, Gratisgeld oder doppelte Leistungen? Was geschieht bei Nichtlieferung, und wann scheitert ein zweiter Auftrag? Dies ist ein **unabhängiger, isolierter Buchungs-/Escrow-Replay**, **kein neuer echter Core-Wirtschaftslauf** und keine nachgewiesene autonome Dauerlösung.

## Gepinnte echte Ausgangsbelege aus #128

Die Rechnungen verwenden nur den ursprünglichen Testtarif von **4 ISK pro Fabrikminute**, **keine beschlossene Produktionslohnregel**. Die Original-main-`index.html`-SHA256 und Regel14/Schema8, Rezept `2 Eis → 1 Nahrung, 6 Minuten`, `150 ISK/h` Minerarbeit sowie Original-Starthaben Nadir 4.000 / Miner 2.000 / Spielerfrachter 2.000 werden beim Start des Prüfwerkzeugs überprüft. Der damalige Ersatzpreis **780 ISK** ist eine Reserve-Bemessung, **keine gekaufte oder physisch vorhandene neue Hülle**.

| Echt belegter B-K10k-Rechnungsblock | 8 Nahrung | 16 Nahrung | 24 Nahrung |
| --- | ---: | ---: | ---: |
| Wirklich in der alten Probe gekauftes Eis | 16 / 352 ISK | 32 / 704 ISK | 48 / 1.056 ISK |
| Bezahlt angenommene Fabrikarbeit | 192 ISK | 384 ISK | 576 ISK |
| Bezahlt geleistete Minerarbeit (Pro-rata) | 40 ISK | 80 ISK | 120 ISK |
| Quelle bekommt vom Händler | 200 ISK | 400 ISK | 600 ISK |
| Frachter: belegte Hin-/Rückflugkosten | 499 ISK | 499 ISK | 499 ISK |
| Belegte Gebühren beider Verkäufe | 24 ISK | 48 ISK | 72 ISK |
| Endkunde zahlt nach Abnahme | 432 ISK | 864 ISK | 1.296 ISK |
| **Quellstations-Deckungsbeitrag** | **−344 ISK** | **−688 ISK** | **−1.032 ISK** |
| **Miner-Deckungsbeitrag** | +312 ISK | +624 ISK | +936 ISK |
| **Händler-Deckungsbeitrag** | −291 ISK | −83 ISK | +125 ISK |
| **Summe dieser drei Betriebe vor Schiffskapital** | **−323 ISK** | **−147 ISK** | **+29 ISK** |

Die Werte sind **kein zusätzlicher historischer CI-Lauf**. Sie referenzieren den belegten ursprünglichen, kontrollierten B-K10k-Versuch mit entfernten Nadir-Startbeständen und stillgelegten autonomen NPC-Frachtern; die damals gezahlten Eispreise von 22 ISK/Eis gelten **nicht allgemein im unveränderten Normalmarkt**. Da der damalige Endkunde ein **anderweitig aus vorhandenen Lohnguthaben finanziertes Konto** ist, darf dieses Einkommen nicht aus der betrachteten einen Nadir-Charge erfunden werden.

## B-K11f: ausgeführter formaler Vorfinanzierungsvertrag

Das **neue** Prüfsystem `tools/bk11f-vertragsbilanz.mjs` benutzt diese historischen Rechnungsbelege in einem strikt bilanzierenden, deterministischen *separaten* Geld-/Warensettlement, mit **atomarer gleichzeitiger Mittelreservierung**. Der historische Endkundebetrag ist bei Vertragsabschluss als **externe, bereits vorher verdiente Kaufkraft angenommen**, nicht im Auftrag selbst geschaffen, nicht als Produktionseinnahme fingiert. Die analytische Kontoauswahl ist ein Anfangsvektor, **kein tatsächlicher zusätzlich erzeugter Spielweltbesitz**. Eine reale Bescheinigung, wie dieser konkrete Endkunde in einer künftigen Wirtschaft zu 1.296 ISK gelangt, bleibt zwingend offen.

Beim 24er-Auftrag werden bereits vor jeder Arbeit **1.632 ISK der Quellstation** (1.056 Eis + 576 Fabriklohn), **120 ISK des Miners**, **1.951 ISK des Frachters** (600 Ware + 499 Fahrt + 72 Gebühren + 780 Reserve) und **1.296 ISK des Endkunden** gleichzeitig gebunden. Sobald ein Eigentümer weniger freies Geld hat, wird **alles atomar abgelehnt**. Auf Leistung gehen Eis/Lohn/Minerarbeit, Warenkauf und tatsächlicher Flug aus den Reserven an den jeweiligen Empfänger; erst echte Endabnahme darf den Endkundenbetrag freigeben. Erfolgreiche Fahrt löst die unbenutzte 780-ISK-Risiko-Reserve; bei Ladungsverlust wird der Kunde vollständig erstattet, die Fracht ausgebucht, geleistete Arbeit bleibt bezahlt und die Hüllenrücklage wird als **nur hypothetisch abgerechnete Ersatzkosten** von 780 ISK belastet – ohne kostenlos eine neue Werfthülle zu behaupten.

Geldsumme **einschließlich offenem Escrow** sowie Eis-/Nahrungskettenidentitäten werden **nach jedem Schritt** gegen die Anfangssumme geprüft; niemals negatives Eigentümerkonto. Dieser Test beweist die Konsistenz *dieses einen vereinfachten Buchungsschemas*, keine korrekte produktive Warenreservierung bei konkurrierenden NPCs, keine Lieferung durch den heutigen Regel14-Core und keine tatsächlich gebaute Ersatzhülle.

## Wirtschaftliche Schlussfolgerung – beweisbare Grenzen statt vorschneller Reform

**Ein anfänglich zahlungsfähiger 24er-Auftrag lässt sich rein buchhalterisch aus bestehendem Kapital sichern.** Das löst aber nicht den Betriebszyklus. Die Quelle erhält nur 600 ISK zurück, nachdem sie 1.632 ISK bezahlt hat. Der Händler verdient +125 ISK, der Miner +936 ISK; ihre Gewinne befinden sich **auf anderen Konten** und stehen der Quelle ohne vertragliche Neuverteilung nicht zur Verfügung. Die 29 ISK verbleibender gemeinsamer Zahlungsbeitrag sind *vor* Risiko-/Hüllenkosten und stellen **keinen Makro-Geldzuwachs** dar.

Nach einer solchen Lieferung ist der zuvor mit genau 1.296 ISK vorfinanzierte Endkunde bereits bei **0 ISK**. Derselbe Folgeauftrag muss ohne **neue nachgewiesene Lohneinkommen oder sonstige reale Transfers** abgelehnt werden. Er darf nicht aus erwarteten künftigen Verkaufserlösen vorfinanziert werden. Selbst bei stets erneut solventer Endnachfrage und unverändertem 24er-Preis sinkt eine anfängliche 4.000-ISK-Quellkasse wegen −1.032 ISK je Charge nach der dritten identischen Charge auf 904 ISK und könnte eine **vierte 1.632-ISK-Reserve** nicht mehr eröffnen. Diese Wiederholungszahl ist eine **eingefrorene Rechnungs-Gegenrechnung, kein neuer spielbarer Vier-Chargen-Versuch**.

**Mathematische Verteilungsgrenze ohne neue ISK und bei fixierten alten Gebühren:** 24 Nahrung erzielen 1.296 ISK von Kunden. Minerarbeit (120), Fabriklohn (576), Frachterbetrieb (499) und Gebühren (72) kosten bereits 1.267 ISK. Damit bleiben höchstens **29 ISK für Unternehmer und Schiffskapital**. Bei alternativ frei verhandelten Preisen müsste der Miner mindestens 120 ISK für Eis erhalten, die Quellstation dann mindestens 696 ISK für Nahrung, der Händler kann höchstens 725 ISK zahlen: ein **nur rechnerisch mögliches** 29-ISK-Fenster. Die historischen Preise (Eis 1.056; Quellabnahme 600) liegen weit außerhalb. **Werden die historischen Eispreise beibehalten**, müsste die Quelle mindestens 1.632 ISK für Nahrung erhalten, der Händler vom Kunden unter eingefrorenen Gebühren mindestens **2.203 ISK** (statt 1.296) verlangen – **untere rechnerische Mehrkaufkraft 907 ISK**. Eine echte Preisanpassung verändert jedoch die Marktgebühren/Angebote und würde andere Akteure verdrängen; **diese Zahlen sind keine neuen Produktpreise, kein Emissionsbedarf und kein Reformvorschlag.**

Ein einziger 780-ISK-Ersatz kostet schon das Äquivalent von **27** solchen +29-ISK-Überschüssen. Auch bei erwarteten Verlusten statt jedem Flug bleibt Kapitalrisiko offen. Die Rücklage deckt nur Geld, **keine tatsächliche Bau-/Bestell-/Verfügbarkeit einer Hülle**.

## Noch nicht freigegeben

D2 Lohn-/Arbeitstarife und Lohnempfänger; D3 zustands-/savefeste Material-, Geld- und Hüllenbindung; D4 vollkostendeckende statt isolierte Routendisposition; D5 echte Schiffsersatz-Lebensdauer und Rücklage; D6 kaufkräftige Zivilbevölkerung/Endnachfrage; D7 Umgang mit bestehenden spezifischen Flottenzuschüssen; H1/Geldmodell-B: **gesonderte Entscheidung** zu exakt begrenzter und auditierter *leistungsgebundener* ISK-Emission. Keine Spielervermögensgrenze und keine Konkursgarantien.

**B-K11f ist ein kleiner Rechnungsbeweis, nicht der Abschluss von Phase B.** Nach bestandener CI sollte die nächste konkrete Produktentscheidung ein integrierbares generisches Angebots-/Auftragsgate mit abgegrenzter Finanzierungsquelle und echten Zahlungsberechtigten betreffen – nicht noch eine pauschale Wirtschaftsrettung.

## [TEST] Tatsächlich ausgeführter Analyse- und Regressionstest · 03.11.2026

**[CI B-K11f #41608365778](https://github.com/tobiasfranziskus/Check/actions/runs/41608365778)** auf Commit `abc60950`: **erfolgreich**, 5/5 gezielte Node-Tests (0 Fehler), zusätzlich automatischer CLI-Buchungsbericht. Die unabhängige Standard-Regressions-CI [#41608365643](https://github.com/tobiasfranziskus/Check/actions/runs/41608365643) hat auf demselben Codecommit **72/72 Node-Tests bestanden**, 0 Fehler; historische Referenzjobs sind getrennt zu bewerten. **Weder 13×90d noch reale iPad-/NAS-Abnahme dieses Entwurfs**: Es gibt gerade **keine** Änderungen am Produktkern, am Speicherschema oder eine neue beauftragbare Lieferung im Spiel.

Alle getesteten historischen 8/16/24-Belege reproduzieren **exakt** die vorher in B-K10k belegten Betreiber-Deckungsbeiträge (−323 / −147 / +29 ISK) und die getrennten Source-/Miner-/Händlerwerte. In dem neuen reinen Vertragsschatten werden **alle Kassen und gebundenen Beträge bei jedem Buchungsschritt** gegen denselben Anfangsbestand auditiert. Versuche mit 0 ISK Käufer, 1.950 statt 1.951 ISK Händler, 1.631 statt 1.632 ISK Quelle und 119 statt 120 ISK Miner scheitern vor Arbeitsaufnahme **atomar**. Kein Kredit, kein Gratislohn, keine stille Teilreservierung. Gesicherter Käufer bekommt bei Ladungsverlust 100 % der Bestellung zurück; Eis, Fabrikarbeit, Fahrtkosten und zerstörte Fracht werden nicht fiktiv erstattet. Eine rein finanzielle 780-ISK-Verlustposition schafft ausdrücklich **kein** materiell neues Schiff.

**B-K11f-Prüfergebnis:** Nach genau einer ursprünglich kaufkräftigen 24er-Abnahme: Quelle **2.968 ISK** statt 4.000, Händler **2.125** statt 2.000, Miner **2.936** statt 2.000, Endkunde **0** statt 1.296. Der unmittelbar folgende identische Auftrag ist ohne weiteres vorhandenes Endkundeneinkommen **nicht vorfinanzierbar**. Das ist eine deterministische **kontoförmige Bedingungsrechnung**, keine behauptete unveränderte 90-Tage-Produktwirtschaft.

**Entscheidungsgate:** Mit den historisch bezahlten Marktpreisen führt mehr vorhandenes Geld zwar kurzfristig zu real finanzierbaren Aufträgen, aber **nicht** zu wiederholbaren, individuell tragfähigen Erwerbs- und Ersatzzyklen. Für die spätere echte Implementierung sind **D2/D3/D6 zusammen**, inklusive festem finanziertem Endkundeneinkommen und Quellenmarge, vorab zu spezifizieren. Danach erst tatsächliche Core-Lieferungen und 13×90d-Spielerkrisen, nicht noch ein pauschaler Liquiditätstransfer. **Kein Emissionsbetrag und keine Preisreform sind freigegeben.**
