# B7a – Eigene NPC-Frachterkonten und vollständige vorfinanzierte Reisearbeit

**31.10.2026 · [ANALYSE/DRAFT] – exakt ein experimenteller Wallet-Prototyp, keine produktive Änderung oder Integrationsfreigabe.** Planungsquelle bleibt [ROADMAP.md auf main](ROADMAP.md); bestehende H1-C2-/C3-Prüfung in [Draft #58](https://github.com/tobiasfranziskus/Check/pull/58), Konzeptionsentwurf in [Draft #55](https://github.com/tobiasfranziskus/Check/pull/55). Basis `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5/Regel14/Schema8.

## 1. Eingriff – reine Testregel, **keine Pilotengehälter**

In einer **isolierten Quelltransformation** des bestehenden Kerns führt `state.pilotAccounts[shipId].cash` für NPC1-/NPC2-**Frachter** jeweils eine eigene, tatsächlich finanzierte Kasse. Zu Beginn werden die **vorhandenen 3.000 ISK pro Konzern ohne Minting** unter dessen 3 bzw. 2 Frachter umgebucht (1.000 bzw. 1.500 ISK je Startschiff). Die Warenkäufe, Verkaufsgebühren und Warenverkaufserlöse laufen über dieses Schiffskonto statt über den freien Konzerncash; die vorhandene Kernhandels-/Marktpreis-/Bestandslogik bleibt bestehen. Die fällige **250-ISK/Frachterstunde** wird aus dem entsprechenden Schiffskonto bezahlt. Vor jeder neuen Fahrt ist mindestens die konservativ aufgerundete Arbeit für `s.arbeit + Fahrtminuten` gedeckt; nur der danach verfügbare Betrag darf für Ware/Handelsgebühr ausgegeben werden. Ein weiterer Flug mit Ware oder leerer Fracht ohne diese Deckung wird nicht angetreten. Keine zweite Simulation; dieselben bestehenden Core-Funktionen bleiben die Berechnungsquelle.

Nach abgerechnetem Leerlauf im Dock wird nur die **Testannahme** `Schiffskasse über 1.000 ISK` zurück an den Konzern übertragen, nicht neu erschaffen. **Schiffskauf/Ersetzung ist weiterhin aus dem realen freien Konzernvermögen zu bezahlen** und benötigt 500 ISK zusätzlich finanzierbares Arbeitskapital; neu gekaufte Hüllen bekommen danach max. 1.000 ISK aus derselben Kasse zugewiesen. Beim Schiffverlust fließt der verbleibende Bankkontostand zurück an den Besitzer (kein kostenloses Geld, keine Vernichtung). Der ursprüngliche NPC-6.000-ISK-Abschöpfungspfad bleibt auf die **freie Konzernkasse** bestehen – gebundenes Kapital ist davon nicht erfasst, weil es physisch getrennt ist. Dies ist **noch keine geprüfte Balance/Fondsentscheidung**; kein Kauf einer Hülle aus der Schiffskasse. Miner, Spieler, Jäger, Piraten und Stationen bleiben unverändert.

**Grenzen:** `1.000/500 ISK` sind **ungenehmigte, isolierte Versuchsparameter**; reale Pilotengehälter, Privatausgaben, persönlich besessene Hüllen, Rückflüge, Verlustrisiken, Konzernfinanzierung mehrerer Piloten und wirtschaftliche Verteilung werden **nicht** vollständig modelliert. Wiederholt profitable Frachter können sich auf Bankkonten trotz Konzerncash-Leerstand nicht ohne neue Kapitalanweisung refinanzieren – das ist ein bewusst offenes Testproblem, kein Beweis, dass getrennte Kassen grundsätzlich ungeeignet sind. Das zusätzlicher Spielstandsfeld `pilotAccounts` ist **nur** im temporären Analysezustand; für Produktübernahme wären Regel-/Schema-, Altspielstand-/Migrationstests und UI nötig. Echte Save/Load-Replays bestanden für den experimentellen Zustand; das allein ersetzt kein Migrationsgate.

## 2. Reproduzierbarer Einzelvergleich

**[TEST] [GitHub-CI #41191522487](https://github.com/tobiasfranziskus/Check/actions/runs/41191522487) 1/1 erfolgreich, 67/67 Node-Standardtests grün (0 fehlgeschlagen, 0 übersprungen)**. Genau **ein** gepaarter B1-Spielerfall `handel-flotte`, Seed 42, Regel14 ab Tick0 bis Tag10; sieben historische Spielerbefehle, keine weitere H1-/Export-/Startkapital-/Piratenvariante. **Je 240 Stunden-Geld-/Warenaudits und Hash-Replays, 10 Tageshashes, 8 Save/Load-Roundtrips**, zusammen 480/20/16. Quell-Referenzchecksumme `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. Original-Kontrollhash am Tag10 **`84f1a88d2701ff2a`** identisch [mit H1-C3-Referenz](https://github.com/tobiasfranziskus/Check/actions/runs/41190568798). Experimentelle Variante Tag10 **`1d222609e5657423`**. Jeder Stunden-Tick unabhängig auf Geld- und Warenerhaltung einschließlich aller geschützten Konten geprüft; **keine neuen Schiffskonten-ISK**, ggf. endogen geänderte bisherige Kopfgeld-/Kostenverbrennungsereignisse durch anderen Weltverlauf separat bilanziert.

| Kennzahl Tag 10 | Originalkern | Eine B7a-Walletregel |
| --- | ---: | ---: |
| NPC1/2 fällige + bezahlte Arbeit | **159.587 / 147.186 ISK** | **83.572 / 83.572 ISK** |
| NPC1/2 ungedeckte Arbeit | **12.401 ISK** | **0 ISK** |
| Alle NPC-Arbeiten (inkl. NPC3) ungedeckt | **12.401 ISK** | **0 ISK** |
| NPC1/2 verbleibende Frachter | **0** | **5** (3 / 2) |
| NPC1/2 realer Warenverkauf, Transaktionen | **1.225** | **673** |
| Kumulierte Mangelstunden | **2.099** | **2.504** |
| Zivil verbrauchte Nahrung / Medikamente | **2.541 / 644** | **2.035 / 517** |
| Freie NPC1-/NPC2-Konzernkassen | **0 / 0 ISK** | **6.000 / 2.190 ISK** |
| Gebundene NPC1-/NPC2-Schiffskassen gesamt | **0** | **753 ISK in fünf Schiffskonten** |
| Spieler-Kasse | **39.762 ISK** | **29.288 ISK** |
| Weltgeldmenge (55.000 + minted - burned) | **50.000 ISK** | **50.000 ISK** |
| Aldera Silizium / Bauteile | **0 / 0** | **0 / 0** |

Kontrollwelt kumuliert `minted=6.360`, `burned=11.360`. Walletwelt kumuliert `minted=4.920`, `burned=9.920`. Diese Differenzen entstehen aus dem jeweils anderen **endogenen** Kampf-/Betriebsverlauf, nicht aus B7a-Emission, Gesamtgeld verbleibt in beiden Welten **50.000 ISK**. Betroffene Lieferungen/Bewegungen sind echt; die 673 Verkäufe bedeuten nicht 673 voll profitable Fahrten, auch die 5 erhaltenen Hüllen sind allein kein Wirtschaftsgewinn.

## 3. Befund und Integrationsentscheidung

**[POSITIV für ein begrenztes Invarianz-Gate]** Kein NPC1/2-Frachter überzieht sein individuelles Bankkonto; es entsteht **kein einziger ISK unbezahlter NPC1/2-Arbeit**; die Bankkontensumme ist unabhängig auditiert und Save/Load deterministisch. Die Startflotte beider Konzerne überlebt zehn Tage als Gesamtflotte ohne Gratis-Neustart.

**[NEGATIV für Phase-B-Versorgungsgate]** **−552 (−45,1 %) NPC1/2-Verkaufsereignisse** und **+405 (+19,3 %) Mangelstunden** gegenüber der historischen Regel14-Kontrolle. Trotz **8.190 ISK an freien Konzernkassen** haben die 5 Frachter zusammen nur **753 ISK** – insbesondere weniger als eine sichere nächste Arbeitsstunde je Schiff. Stand am Tag10: Wallets `sh014:247`, `sh047:220`, `sh050:47` (NPC1), `sh018:93`, `sh086:146` (NPC2). Die Schiffe sind **nicht insolvent aufgrund fehlenden gesamten Konzernvermögens**, sondern durch eine fehlende unternehmensinterne Kapitalzuweisung teilweise betriebsunfähig. Die Erhaltung der Schiffe wird also durch zu wenig bezahlten Warentransport erkauft.

**[OPTION als nächster isolierter Design-/Testschritt]:** `Fahrtkonto` als **zweckgebundene Konzernkasse** mit **regulärer, vorher finanziell begründeter Kapitalzuweisung an ein konkret lohnendes Transportvorhaben** statt eines fixen, nie erneuerten Pilotensaldos. Kein neues Geld; Zuweisung nur aus bereits vorhandenem, frei verfügbarem Konzernvermögen und nur wenn Warenkauf, Gebühren, vollständig fällige nächste Arbeitsstunden und risikoangemessene Rücklage einschließlich Fortbewegung finanziert sind. Das ist ein *Investitionsentscheid* (eine Firma darf auch keine neue Fahrt finanzieren), **keine Insolvenzrettung**, keine Geldschöpfung. Alternativ kann der Eigentümer entscheiden, Schiffe stillzulegen und wirklich aus dem Markt auszuscheiden; ein einzelner Pilot muss nicht gerettet werden. Ein zukünftiger Vergleich muss **bezahlte Arbeit UND Handelsdurchsatz/Versorgung UND tatsächliche Wiederbeschaffung** gemeinsam verbessern. Das Konto allein ist **nicht produktreif**; ein aufsteigender Bedarf an Pilotengehältern und Modulkosten ist noch separat zu prüfen.

**Status:** Alle Veränderungen [ANALYSE/DRAFT] in [PR #59](https://github.com/tobiasfranziskus/Check/pull/59) als einzelner Runner/CI und Berichte; **kein** `index.html`, `main`, Spielstandsformat oder Regelversion im Produkt, kein Merge, keine iPad-/NAS-Abnahme oder Veröffentlichung.
