# W5s-ao – integrierte Wirtschaftsanalyse auf dem echten R32-Core

**[DRAFT/ANALYSE · 07.11.2026]** Forschungsbasis: [W5s-an #242](https://github.com/tobiasfranziskus/Check/pull/242), darunter [W5s-am #241](https://github.com/tobiasfranziskus/Check/pull/241). `main` bleibt beim separat freizugebenden Produkt; dieses Paket enthält **nur Node22-Testinstrumente und Dokumentation**, keine neue Geld-/Spielregel, keine Schemaänderung, keine ISK-Minting-Freigabe.

## Fragestellung

Ist der **zusammenhängende** Kreislauf aus echter Förderung → Vorfinanzierung → frachtpflichtigem Transport → Produktion → bezahlter Endabnahme → tatsächlich verdienter Lohn-/Dividendenrückkehr → Flottenersatz unter vollständigen Eigentümer- und Finanzierungsprüfungen krisenfest? Wenn nein: **welcher konkrete Engpass endet zuerst?**

Nicht nur positive Mengen, sondern die *Gleichzeitigkeit* von zahlungsfähiger Nachfrage, Deckungsbeitrag, Reserve, realen Ersatzschiffen und zulässigen Haushaltseinkommen ist maßgeblich. Bestehende Einzeltests werden als Vorbefunde verwendet, **nicht** als Gesamtfreigabe.

## A. Reproduzierbare Messmatrix

**A1 – Breite:** 13 feste Seeds `1, 7, 17, 21, 42, 58, 77, 101, 202, 313, 404, 777, 999` × 90 Tage mit denselben originalen R32-Wirtschaftsgates (`BASE`), ohne neue Außenemission. Jeweils unabhängig erstellte Welten, echte Core-Ticks und Geld-/Waren-/Eigentumsaudits alle 30 Tage. Keine gefälschten Aufträge, keine zweite Simulationsengine. Report: `W5S_AO_13X90`.

**A2 – Tiefe und eindeutige Gegenprobe:** **Zwei** Krisenseeds 42/7; jeweils dieselbe im R32-Core tatsächlich *bezahlte* Startflotte mit nachgewiesenen Werft-, Bergbau-, Überführungs- und Frachtvorgängen. Von derselben Save-/Hash-Basis werden drei Varianten getrennt bis **Tag730** fortgeschrieben:

| Szenario | Exportpreis | Externer Gesamtetat | Berechtigter Empfänger |
|---|---:|---:|---|
| `off` | – | 0 ISK | niemand |
| `station7` | 7 ISK je echtes Exportwasser | einmalig 7.000 ISK, max. 10 Wasser/Tag | ausschließlich Station Nadir |
| `station14` | 14 ISK je echtes Exportwasser | einmalig 7.000 ISK, max. 10 Wasser/Tag | ausschließlich Station Nadir |

Kein nachträgliches Auffüllen, keine Direktzahlung an Haushalte, keine neue Anteilsberechtigung. Die **7.000 ISK** und Exportpreise sind *vorhandene, begrenzte Forschungsparameter*, **kein beschlossenes Geldmodell-B-Produkt**.

Alle drei Varianten durchlaufen den selben finanzierenden Ablauf von echten Minern/Frachtern bis Spieltag ~155. Dann werden nur die bereits vorhandenen W5q-Exportparameter alternativ eingeschaltet; nur der Originalkern `api.advance` entscheidet, ob wirklich Ware und Budgets vorhanden sind. Messpunkte ab `Tag185, 245, 365, 425, 550, 730`; jedes Szenario erhält dessen Originalhash und Save/Load-Prüfung.

**A3 – Wirtschaftsgrößen statt Scheinstabilität:** Umverteilung der gesamten originalen 33.000 ISK plus exakt belegte `state.minted`; Kassen von Nadir, Endkunden, altem Spediteur, Minern, Werft, Investor, getrennten Nachfolgern und Fonds; tatsächlich gezahlte Löhne aus Eis/Fracht/Wasser/Industrie/Überführung, Original-W5o-Dividenden, Wasserverkauf und tatsächliche W3- und Eisfrachten, Material/Schiffbau und physische Waren; real verschlissene/gekaufte Miner und Frachter; nach Eigentümer getrennt vorhandene Frachter und kapitalgedeckte Ersatzbereitschaft.

**A4 – Krisenursache:** Der Tag des **letzten tatsächlich abgeschlossenen** bezahlten Wasserverkaufs, der letzten Wassercharge, der letzten Eisfracht und der letzten echten Lohn-/Dividendensteigerung wird jeweils getrennt aus Originalständen ermittelt (nicht prognostiziert). Lesend: nächster Wasserpreis, echte Kundenkasse, Original-W5s-Wartungsgate sowie Speditionskapitalbedarf und freie Werfthüllen.

**A5 – Unabhängige Schranken:** Core- und Eigentümeraudit alle 30 Tage (zusätzlich Messpunkte); alle 13×90 Seeds ohne neue ISK; 6 echte Langzeitwelten mit `sum(owners.cash)=33.000+minted`; `w5q.payout=0`; `buyer.cash=1.400+verdientes Einkommen−bezahlte Wasser`; Wasserlager = wirklich produziert − wirklich verbraucht − wirklich exportiert. Keine positiven Dividenden aus unverdienten stationseigenen Exportgewinnen; W5o-Stationsdividende nur im vorhandenen **inländischen** Gewinnpfad. Alle Checkpoint-Spielstände müssen serialisieren, korrekt laden und denselben Hash besitzen.

**[TESTSTATUS]** Die Testdatei `tests/w5s-ao-gesamtwirtschaft-13x90-730.test.mjs` und GitHub-Workflow `w5s-ao-gesamtwirtschaft.yml` wurden erstellt; Ausführung/Ergebnisse bei Anlage **noch offen**. Zahlen außerhalb schon bestätigter W5s-an/am-Referenzen ausdrücklich **nicht** aus Vermutungen ergänzt. Echte iPad-/NAS-Abnahme wäre nur für ein Produkt relevant und bleibt separat offen.

## B. Bereits bestätigte Referenzbefunde, noch nicht das Ergebnis dieser Matrix

- [W5s-am #241](https://github.com/tobiasfranziskus/Check/pull/241): Stationsexport zu 7 ISK, Seed42/7: spätestens Tag425 6.673 ISK bei Nadir, 11 ISK beim Verbraucher, 14 ISK pro Wasser. Bis Tag730 keine weiteren Wasserwerkschargen/Eisfrachten/regulären Verkäufe – trotz korrekt finanzierter Station. Keiner der sieben überprüften Lohnpfade hatte offenen verdienten Lohn.
- [W5s-an #242](https://github.com/tobiasfranziskus/Check/pull/242): direkter stationärer Zuordnungskostenmaßstab `590 ISK / 50 Wasser`, also 11,80 ISK pro Wasser (250 Eis + 240 Hin-/Rücktransport + 100 Wasserwerkslohn; **ohne** Wartung, Verschleiß, Kapitalkosten). 7-ISK-Export von 1.000 Einheiten = −4.800 ISK direkter Export-Deckungsbeitrag; 14 ISK bei 500 Einheiten = +1.100 ISK *vor* Zusatzkosten. **Nicht** mit tatsächlich investierbar freiem Kassenbestand oder rechtmäßigem Dividendenanspruch gleichsetzen.
- Bereits existierende W5o-Dividenden gehen an `w5n_kunden` und beruhen auf **inländischem** Wassererlös und pauschaler direkter Kostenformel. Das ist ein **modellierter Haushaltsgewinnanspruch**, keine nachgewiesene neue Stationsaktie. Die Modellberechtigung und eventuelle spätere Anteile dürfen nicht doppelt ausgeschüttet werden.

## C. Annahme und nächste Produktentscheidung

Ein **technisch bestandener Test** beweist Geld-/Waren-/Eigentumskonsistenz. Eine **wirtschaftlich tragfähige Welt** benötigt darüber hinaus auch an Tag730 echte regelmäßige, bezahlte Anschlussnachfrage, finanzierbaren unabhängigen Flottenersatz und positive, nachgewiesene Eigentümerbilanz ohne Gratiszahlung. Deshalb darf die Analyse bei einem ehrlichen Stillstand **technisch grün** sein und muss das wirtschaftliche Nichtbestehen klar ausweisen.

Aus den ermittelten Gesamt- statt Einzelzahlen folgt als nächster separater, genehmigungspflichtiger Produktversuch **genau eine** Kernhypothese. Keine automatische Rettung durch Stationsguthaben, keine erfundene Vollbeschäftigung, kein heimlicher Subventionsmechanismus und keine Pflicht, Spielerersparnisse abzuschöpfen. **[DRAFT] Kein Merge/Deployment, keine Pages-, Save- oder W5u-Änderung.**

## D. Ausgeführte, unabhängige Gesamtmatrix – technischer Abschluss A/B

**[TEST/CI BESTANDEN]** [GitHub-Node22-Auswertung #42421949722](https://github.com/tobiasfranziskus/Check/actions/runs/42421949722), Workflow `integrated-economics`, Commit `0d1a3e25`: **2/2 integrierte Tests bestanden, 0 Fehler und 0 Skips.** Test A prüfte tatsächlich alle 13 Seeds × 90 Tage; Test B **sechs** kontrollierte W5r/R32-Welten bis Tag730 (2 Krisenseeds × 3 Exportvarianten), jeweils 30-tägliche Originalgeld-/Waren-/Eigentümeraudits und Save/Load-Checkpoint-Hashes. Kein Produktcode verändert. Der später ergänzte Test C zu unterschiedlichen Spar-/Eigentümerregimen besitzt einen gesonderten CI-Lauf und ist hier zunächst **noch nicht** als bestanden aufgeführt.

### D1. Seed-Unabhängigkeit ist noch keine ökonomische Stresstestvielfalt

Alle **13 festen Seeds** lieferten in der 90-Tage-`BASE`-Welt exakt denselben wirtschaftlichen Endstand (aber unterschiedliche RNG-/Zustandshashes):

| Kennzahl nach 90 Tagen | Wert in allen 13 Seeds |
|---|---:|
| Tatsächlich bezahlter Wasserverbrauch | 4.316 |
| Produziertes Wasser | 4.340 |
| Bezahlte Eisfrachten | 88 |
| Erzfrachten | 2 |
| Im W5-Forschungsbuch fertiggestellte Hüllen, inkl. Miner | 8 |
| Liquider Endverbraucher | 2.371 ISK |
| Liquide Station Nadir | 2.929 ISK |
| registrierte Miner-/Frachterverluste im R32-Verschleiß | 6 / 3 |
| kumulierte belegte Haushaltseinkommen | 61.395 ISK |

**Kritische Grenze:** 13 verschiedene RNG-Hashes bestätigen die Wiederholbarkeit, aber **nicht 13 verschiedene wirtschaftliche Krisen**. Die vorgegebene frühe R32-Welt reagiert in diesem Messfenster nicht unterscheidbar auf die Seed-Auswahl. Diese Matrix ist ein **13-facher Reproduktions- und Buchungstest**, kein Nachweis über die Wahrscheinlichkeit von Krisen in frei variierten Markt-/Eigentumsszenarien. Die nachgeschobene Profilprüfung C vergleicht daher echten NPC-Sparmodus, reinen Lohnmodus und Spieler-Miner-Eigentum, **ohne** Erfindung von Geld oder Aufträgen.

### D2. Sechs Langzeitläufe – nachweislicher letzter Aktivitätstag

Die physisch gleiche, bezahlte Startwelt wurde bei Spieltag 155 in drei eigenständige Regime verzweigt. Beide Krisenseeds 42 und 7 erbrachten **die gleichen wirtschaftlichen Messwerte**, aber unterschiedliche gespeicherte Hashes.

| Maßzahl, jeweils Tag730 | Ohne Außenexport | 14 ISK je Wasser | 7 ISK je Wasser |
|---|---:|---:|---:|
| **Letzter tatsächlich bezahlter Wasserverkauf** | **209** | **303** | **393** |
| Letzte Wasserwerkscharge | 209 | 303 | 393 |
| Letzte bezahlte Eisfracht | 209 | 302 | 392 |
| Letzter Anstieg originaler Haushaltseinkommen / Dividenden | 209 | 303 | 393 |
| Zusätzlich regulär verkaufte Wasser ab Tag155 | 1.524 | 7.066 | 11.389 |
| Gesamtbestand regulär verkaufter Wasser | 8.003 | 13.545 | 17.868 |
| Physisch zusätzlich exportierte Wasser | 0 | 500 | 1.000 |
| Einmalig neu auditiertes Gesamt-ISK | 0 | 7.000 | 7.000 |
| Rechnerischer direkter Beitrag der Exportware vor weiterer Wartung | – | **+1.100 ISK** | **−4.800 ISK** |
| Summe aller Eigentümerkassen | 33.000 | 40.000 | 40.000 |
| Zahlungsfähige Endkundenkasse (14 ISK pro Wasser nötig) | **8 ISK** | **3 ISK** | **11 ISK** |
| Stationseigentümer Nadir | 2.056 ISK | 6.841 ISK | 6.673 ISK |
| Alter Frachterbetreiber `transport` | 240 ISK | 600 ISK | 600 ISK |
| Fehlbetrag des Altbetreibers für Hülle + Flug + eigenen Arbeitsbedarf (930 ISK) | 690 ISK | 330 ISK | 330 ISK |
| Tatsächlich noch im Weltzustand vorhandene Frachter, **alle** Eigentümer | **0** | **0** | **0** |
| Jetzt frei kaufbare W5-Frachter im Werftlager | **0** | **0** | **0** |
| Noch physisch vorhandenes Wasser in Nadir | 47 | 45 | 42 |

**[WIRTSCHAFTLICH NICHT BESTANDEN]** Der bisherige R32-Gesamtkreislauf stoppt **auch mit positivem Exportdeckungsbeitrag** und unverbrauchtem Stationskapital. An Tag730 existieren weder ein zahlungsfähiger Wasserendkunde noch eine einzige aktive Frachterhülle. Es fehlt an legal finanzierter Folgereserve *beim jeweils zuständigen Betreiber* und an zahlungsfähiger Endnachfrage; das ist keine globale ISK-Null und kein Warenmangel. Keine verdeckte „Wiederbelebung“ der Welt bis Tag730.

### D3. Konzentration liquider ISK und Eigentümertrennung

| Kasse bei Tag730 | Ohne Export | Export 14 | Export 7 |
|---|---:|---:|---:|
| Handel-/Investorkasse `export` | 18.026 | 18.266 | 17.786 |
| Externe Werft `werft_extern` | 5.970 | 7.120 | 8.200 |
| Station `st_nadir` | 2.056 | 6.841 | 6.673 |
| Alter Spediteur `transport` | 240 | 600 | 600 |
| Verbraucherkonto `w5n_kunden` | 8 | 3 | 11 |

In der 7-ISK-Variante halten genau **drei andere Konten** `export + werft_extern + st_nadir = 32.659 ISK` von weltweit 40.000 ISK, während der alte Frachterbetreiber **330 ISK** zur eigenen Neufinanzierung fehlen und der einzige private Endverbraucher keine 14 ISK besitzt. Die rechtmäßigen Guthaben **dürfen nicht** ohne freiwilligen, bezahlten Vertrag abgeschöpft werden. Eine Wirtschaftsreparatur durch Kontenneuzuordnung wäre zwar bilanziell möglich, verletzte aber die bestehenden Eigentumsregeln.

**Wichtig:** Für die 7-ISK-Welt sind `248.763 ISK` **kumulierte** vollständig belegte Endkundenlöhne/Dividenden bis Tag425, während exakt `250.152 ISK` kumulierte Wasserzahlungen flossen. Das bedeutet vielfachen *Umlauf* bereits vorhandener ISK, **keine** Geldschöpfung in Höhe dieser Bruttosummen: `1.400 + 248.763 − 250.152 = 11` ISK Rest. Die einzige zusätzliche Geldschöpfung sind 7.000 ISK W5q auf echte Exportware.

### D4. Separates Problem: wirtschaftlich wirkender Flottenersatz

Die R32-Verschleißzählung registriert kumulativ beim 7-ISK-Fall **27 Miner- und 14 Frachterverluste**, beim 14-ISK-Fall **21/11**, ohne Export **14/8**. Die zugehörigen R32-`bought`-Referenzfelder sind in diesen Läufen jeweils 0; das ist **nicht mit allen W5s-/W5-Gesamtkäufen gleichzusetzen** (andere Produktpfade bauen/verkaufen reale Hüllen). Das entscheidende beobachtete Ergebnis: **Keine einzige Frachterhülle gehört bei Tag730 noch einem aktiven Eigentümer.** Die Altspedition hat weder die benötigten 930 ISK noch eine freie Werfthülle; die übrigen Gesellschaften haben zwar teils Guthaben, aber keine rechtmäßige kostenlose Übernahme- oder Rettungsgarantie.

### D5. Folgerungen für die nächsten produktiven Schritte (keine Freigabe)

1. **Vorrang 1 – legal finanzierte Endnachfrage:** Ein Verbraucher oder institutioneller Käufer muss tatsächlich zahlungsfähig und wirtschaftlich berechtigt sein; nicht die Station um dieselben ISK reicher machen und auf einen Geldrückfluss hoffen. Ein externer Exportkunde benötigt bei globaler Geldschöpfung einen noch explizit zu genehmigenden Etat und aus Weltleistung abgeleiteten Anspruch. Künstliche Konsumenten-ISK ohne Leistung sind ausgeschlossen.
2. **Vorrang 2 – echtes Eigenkapital für Ersatzlogistik:** Ein freiwilliger und bezahlter Investitions-/Schiffskaufvertrag muss dem tatsächlichen transportierenden Eigentümer 930 ISK inklusive Flug und Arbeitsreserve verfügbar machen – nur wenn damit echte Nachfrage/Transportmarge existieren. Keine automatische Erbschaft, kein geschenkter Frachter.
3. **Vorrang 3 – Eigentümer- und Dividendenrecht:** Die W5o-`divStation`-Verteilung basiert auf tatsächlich verkauften **inländischen** Wasserprodukten; neue Stationsanteile oder Exportgewinnausschüttungen dürfen diese alte Auszahlung nicht rückwirkend verdoppeln. Der 7-ISK-Export macht zudem bei 11,80 ISK direkten Produktions-/Transportkosten rechnerisch Verlust, der 14-ISK-Export allein löst die Nachfrage-/Flottenkrise nicht.
4. **Erst danach Freigabeprüfung:** 13×90 dynamisch **verschiedene** Wirtschaftsszenarien (nicht nur RNG-Seeds), 42/7 bis ≥730, Kontrollgruppe sparender Spieler, ohne externe Verbraucher, bei NPC-Verlust/Stillstand und echter freiwilliger Insolvenz-Nachfolge, neben Save/Load und Negativ-Audits. Solange diese Kriterien fehlen: [DRAFT/ANALYSE], kein Nachhaltigkeitsnachweis.

Diese konkreten Schlüsse stammen **nur** aus tatsächlich protokollierten CI-Zahlen. W5u #234 bleibt isolierte Regel-14-Spielwelt; `main`, Pages und Spielstände sind von der Analyse nicht betroffen.
