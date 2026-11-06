# W5s-o – Kontrollierende Konzernbeteiligung und dritter realer Erzauftrag durch Spieler-Mining

**[DRAFT / ANALYSE / OPTION · 06.11.2026]** Gestapelt auf W5s-n #217, nur im ausdrücklich aktivierten isolierten Forschungsprofil Regel32/Schema8. `main b4e604d6`, produktive Regel14, bestehende Spielstände und sämtliche separaten UI-Drafts bleiben unverändert. **Kein automatischer Merge, kein Deployment und keine neue von der Projektleitung beschlossene Firmen- oder Geldregel.**

## Ausgangslage: Warum ein Wechsel des Kapitalgebers allein nicht genügt

W5s-n belegt nach zwei wirklich finanzierten W3-Erzlieferungen und 4.382 tatsächlich bezahlten Wasser am Tag365: Spedition 480 ISK frei, **0 Frachter**, 930 ISK für vollständige Ersatzhülle/Überführung/nächste Arbeitsreserve, also **450 ISK Fehlbedarf**. Beim realen Marktvergleich Tag120 liegen **150 Eis in Aldera** und weitere **100 Eis auf NPC-Miner sh003**; dessen weiterer Verkauf ist wegen voll belegtem Quelllager abgelehnt. Wasser-Endkundengeld fällt auf **2 ISK**. Für einen weiteren Schiffbau fehlen zugleich neue 50 Erz in Nadir.

Der Erzgroßhändler besitzt dennoch echte, separat verbriefte 19.800 ISK. Geld des Großhändlers darf weder dem alten Spediteur still zugerechnet noch als neue Geldemission ausgegeben werden. Ein echter Nachfolger kann **Kontrollrechte gegen vorhandenes Kapital erwerben**, ohne dass die ursprüngliche Rechtsperson `transport`, ihre Original-W3-/W5n-Verträge und ihre Schiffshüllen still ersetzt werden.

## Isolierte Vertrags- und Beteiligungsvariante

### Automatischer Vorfeld-Mehrheitseinstieg – kein staatliches Rettungsgeld

Nur mit dem Forschungsflag `rules.w5s.autoTakeover=true` sowie schon aktivierten vollfinanzierten W5s-k/l/m-Regeln wird eine **einmalige** kontrollierende Kapitalerhöhung vorgeschlagen. Sie setzt nachweislich voraus: zwei echte R32-Frachterverluste, zwei abgeschlossene W3-Erzfrachtaufträge, einen tatsächlich verfügbaren bisher rechtmäßig gekauften R32-Frachter, physisch ausreichende Eisware, auf Kunden- und Stationskonten vorhandenes Kaufbudget, eigene Kapitalunterdeckung des operativen Spediteurs und auf dem **eigenen Export-Großhändlerkonto** mindestens das Anlagengeld zuzüglich des Kapitals für eine weitere 50er-Erzcharge.

Der Großhändler `export` zeichnet zum hypothetischen Testpreis **930 ISK gegen 60 % neue kontrollierende Stimm-/Wirtschaftsbeteiligung** an `transport` (unterstellt 620 ISK alten Unternehmenswert; **nicht beschlossenes Produktbalancing**). Die echte Zahlung wird vom Investor-Konto ab- und beim bestehenden Betreiber gutgeschrieben. Es werden keine Hüllen geschaffen, kein anderes Konto zwangsweise belastet und keine Güter ausgegeben. Der bisherige Frachter und seine Beschäftigungs-/Treibstofffreiheit bleiben beim regulären Betreiber. Die Firmenbeteiligung ist im einmaligen, persistenten `state.w5s.takeover`-Buch mit Eigentümer, Gegenpartei, Kapital, Quote, Zeichnungstick, damaligem Erz-/Eisfahrtenstand, Folgeerträgen und jedem Auszahlungsereignis dokumentiert. Die Mehrheitsbeteiligung gilt **nicht** als gesicherter Kredit oder garantierter Rückzahlungsanspruch; das Kapital kann verloren gehen.

### Gewinnrechte nur auf **nach** dem Einstieg wirklich verdiente Erzlogistik

Der Großhändler erhält im Forschungsmodell nur 60 % des nach dem Anteilskauf tatsächlich durch **vollständig abgeschlossene W3-Erzfracht** erwirtschafteten Netto-Frachtdeckungsbeitrags: bezahlter Tarif für Hin- und Rückfahrt abzüglich der tatsächlich vorfinanzierten Pilotenarbeit. Auszahlung erfolgt **erst beim realen Abschluss der Rückreise** und nur, soweit danach wenigstens das ursprüngliche Eigenkapitalziel für eine neue Hülle plus Überführung und 120 ISK Pilotenarbeit auf dem Speditionskonto stehen bleibt. Bei fehlenden Echtgeld-Aufträgen bleibt der Auszahlungsanspruch **null**. Vorherige Gewinne und die gesamten ursprünglichen W5o-Eis-/Haushaltsdividenden werden **nicht** an den Investor umgeleitet.

Die vollständigen bisherigen Prüfungen `m_core_audit`, `m_core_w1_vollkosten`, `m_core_w3`, `m_core_w5h`, `m_core_w5o` und `m_core_w5s` unterscheiden seither ausdrücklich: normaler Erzkauf/-verkauf, echtes Beteiligungskapital, echte W3-/W5n-Frachtmargen, normale Eis-Haushaltsdividenden und real bezahlte Anlegergewinne. Keine Kapitalanlage darf die Export-Einnahmen oder die geschöpfte Weltgeldmenge erhöhen. Die lesende Finanzsicht `w5sFinanzStatus` zeigt den tatsächlichen Beteiligungsvertrag, die gesamte Investorbilanz und die ohne Staatsrettung nötige nächste Hülle. Die alternative erste Forschungsvariante, welche **Eisdividenden direkt an den Großhändler** umleitete, wurde wegen Schäden am Wasser-Endkundenmarkt **vollständig aus dem aktuellen Code zurückgenommen**: 90-Tage-Wasser nur 3.934 statt 4.316 bei 80 statt 88 Eisfahrten. Test dieser negativen Hypothese auf historischem Branch-Head `9853999a`, [CI #42214190887](https://github.com/tobiasfranziskus/Check/actions/runs/42214190887), 5/5 grün. Keine umgeleiteten Eisdividenden im finalen W5s-o-Modell.

## Ausgeführte positive und negative Belege

**[TEST]** [GitHub Node22 W5s-o-CI #42215678094](https://github.com/tobiasfranziskus/Check/actions/runs/42215678094) auf Code-/Teststand `188747df`: **8/8 Testgruppen bestanden, 0 Fehler, 0 Skips**. Darin: 13 Seeds ×90 Tage, Seed42/7 ×365 Tage, täglich Original- und unabhängiges Weltgeld-/physisches Warenledger-Audit, exakter Hash-Replay, Save/Load, abgelehnte unfinanzierte Beteiligung, keine Doppelzeichnung, wirksame Manipulationsabwehr für Kapital/Anteile/Erträge, unveränderte OFF-Referenzhashes sowie ein echter Spieler-Miner-Integrationspfad.

### Ohne zusätzliche tatsächliche Erzförderung (autonome Forschung)

Die kontrollierende Beteiligung wird in der Seed42/7-Forschungswelt **am Tag60** aus realem Exportkapital von 930 ISK gezeichnet. Der Erwerber erhält **keine** Gewinnausschüttung, weil danach kein weiterer W3-Erzauftrag mehr abgeschlossen wird. Der Investor trägt deshalb bis Tag365 mindestens 930 ISK unrealisierte Kapitalbelastung; eine Marktwert-Erstattung gibt es nicht. Sein neues Konto wird nicht von anderen Firmen subventioniert.

| Isoliertes Profil, Seed42/7, Vorlauf 2d | W5s-n ohne Einstieg | W5s-o mit bezahltem Einstieg |
|---|---:|---:|
| Abgeschlossene W3-Erzfahrten am Tag90 / 365 | 2 / 2 | **2 / 2** |
| Eisfrachten Tag90 / 365 | 88 / 89 | **88 / 93** |
| Tatsächlich bezahltes Wasser Tag90 / 365 | 4.316 / 4.382 | **4.316 / 4.589** |
| Neues Bargeld erzeugt oder stille NPC-Rettung | 0 ISK | **0 ISK** |
| Vom Großhändler tatsächlich gezeichnet | 0 ISK | **930 ISK** |
| Anlegerertrag ohne neue Erzarbeit | – | **0 ISK** |

Der Übergang verbessert die Wasserversorgung über 365 Tage um **207 bezahlte Einheiten**, aber **das Unternehmen geht trotz des Investments später wieder ohne eigene Frachter unter**. Das ist keine langfristige Wirtschaftsstabilisierung. Die 13 Seeds bilden dieselbe kleine Modellwirtschaft ab, unterscheiden sich jedoch deterministisch in ihren Hashes. Die früheren 15/30-Tage-Hüllenlebensdauern sind ausschließlich hypothetische R32-Stressannahmen; kein freigegebenes Schiffsbalancing.

### **Mit** zusätzlichem, tatsächlich finanziertem Spieler-Bergbau

Ein separater Test benutzt **keine** gesetzte Gratisware. Der Spieler kauft einen vorhandenen Miner zum unveränderten Preis von **600 ISK** per Original-`shipBuy`, startet echten Erzabbau per validiertem `shipMine`, bezahlt Arbeitsminuten und verkauft über die bestehenden W2-Käufer-/Stationsbelege. Der Großhändler erwirbt wirkliche Rohware, der originale `shipFreight`-Befehl bindet 50 Erz samt vorhandenen 740 ISK Kundenkaufetat und 120 ISK Speditionslohn und wickelt den dritten Rückflug vollständig ab. **240 Spielminuten nach dem neuen Spieler-Mining-Auftrag** ist der **dritte volle 50-Erz-W3-Transport fertig**: Gesamtlieferungen 150 Erz. Die positive Anleger-Auszahlung beträgt **genau 72 ISK (60 % von 120 ISK neuer Erz-Frachtmarge)**, nie vor der echten dritten Lieferung. Weltgeld und alle Waren-/Finanzbücher bleiben im Original-Core konsistent; keine zusätzliche Geldemission. Vorher war ein dritter Transport **autonom nicht finanzierbar**.

**Wichtig:** Dieser Test belegt die **funktionale Einbindung des wirtschaftlich eigenverantwortlichen Spieler-Minings**, nicht eine autonome NPC-Erznachlieferung oder eine bereits amortisierte 600-ISK-Spieler-Minerhülle. Auch der Erwerber gewinnt im Test nicht automatisch seinen 930-ISK-Eigenkapitaleinsatz zurück.

## Offene Einordnung und nächster Schritt

**[DRAFT/OPTION]** Die 930-ISK-Mehrheitszeichnung und 60-%-Erzmargenbeteiligung sind **nicht freigegebene Produktregeln**. Der Auftrag zeigte einen größeren technisch geschlossenen Schritt: zahlender Konzernteilhaber, echte Unternehmensführung/-gewinne, real gekaufter Miner und nachweislich abgewickelte dritte Erzlieferung im selben deterministischen Original-Core. Eine **juristisch neue** Speditionsfirma mit eigenem Schiffsregister, bezahltem Chartervertrag und einer Nachfolge **erst nach** dem vollständigen Zusammenbruch ist noch nicht vorhanden. Dieser Draft ist daher präzise als **Übernahme des existierenden Unternehmens durch andere NPC-Eigentümer**, nicht als Neugründung, ausgewiesen.

**[OFFEN]** Vollständige JS-/Wirtschafts-Geografie-Regressions-CI auf dem abschließenden PR-Head, iPad Safari (Hoch/Quer), NAS-Test und langfristige Wirtschaftskreislauf-Abnahme. W5s-p sollte in einem isolierten Folgeauftrag einen eigenständigen NPC-Erzminer und eine Nachfrage für die dritte Erzcharge mit **wirklich vorhandener Finanzierung** untersuchen. Kein staatliches Rettungsgeld, keine Gratisware und keine beliebige Begrenzung von Mining-Aufträgen; NPC dürfen scheitern, Spieler frei sparen.

**[MAIN]** weiterhin `b4e604d6`. **Kein Merge oder Deployment.**
