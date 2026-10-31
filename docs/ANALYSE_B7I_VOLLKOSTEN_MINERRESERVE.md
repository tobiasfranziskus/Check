# B7i – Vollkosten- und Minerreserve-Gate vor autonomen NPC3-Handelsfahrten

**31.10.2026 · [ANALYSE/DRAFT] · kein Produktcode, keine Regel-/Saveformatänderung.** Technische Referenz ist `main 517728a958326e86751f09cd74d0c077edad9921` (v0.12.5/Regel14/Schema8); produktverbindliche Planung ausschließlich `docs/ROADMAP.md` auf `main`. Dieser Bericht gehört zum offenen [Analyse-PR #60](https://github.com/tobiasfranziskus/Check/pull/60); der Konzeptentwurf [#55](https://github.com/tobiasfranziskus/Check/pull/55) sieht **Konzerne als NPC-Schiffseigentümer**, nicht persönliche NPC-Pilotenschiffe, vor.

## Versuchsfrage und Umsetzung

Ausgang ist **derselbe** historische `Seed42/handel-flotte`-Spielerfall wie B7f/B7h, derselbe tatsächlich aus NPC3-Konzernmitteln bezahlte Frachter `sh131`, der nach dem **unveränderten, real verkauften 55-Silizium-Einstieg** per originalem validiertem `shipHandeln`-Befehl weiter handelt. Die **einzige Änderung** gegenüber B7h ist eine isolierte **Entscheidungsregel im kopierten Kernmodul `m_core_entscheidung`** – kein `index.html`-Patch, keine neuen Schiffe, keine Pacht, kein neues Geld, keine geänderten Warenpreise, Rezepte, Piratenwahrscheinlichkeiten oder Schiffskosten.

Vor einem neuen NPC3-Frachter-Einkauf werden ausschließlich die originalen `preis`, `verkaufbar`, `aufnehmbar`, `gebuehr`, `bezahlbar`, `route` und die existierenden Eigentümerkassen verwendet. Die Kalkulation fordert:
- positiven **Moment-Deckungsbeitrag** nach beiden Marktgebühren, **beladener Reise-Arbeit**, ggf. **geplanter Leeranreise** sowie **einem zusätzlichen angenommenen Positionierungsweg** (Risikopuffer); Reisearbeit `ceil(Minuten × 250 ISK / 60)` je leg, noch kein real ausgezahltes Geld und keine garantierte Rückfahrt;
- voll vorhandenes **Startkapital** für Warenkauf, Kaufgebühr und diese angenommenen Fahrtkosten **zuzüglich einer einzigen vollen Betriebsstunde für sämtliche aktuell existierenden NPC3-Miner** (150 ISK je Miner). Die Reserve bleibt im echten Konzernkonto; es gibt **keine neue Überweisung/Geldschöpfung und keine unbegrenzte Insolvenzgarantie**;
- wenn lokal keine solche Gelegenheit besteht, **nur für eine vorher tatsächlich finanzierbare und erwartbar positive Marktchance** eine gezielte Leerpositionierung; andernfalls Stillstand statt bisherigem zufälligem Leerflug.
  
Dies ist ein **vereinfachter konservativer Kosten-/Kassenfilter**, **keine** Risikoversicherung, erwartungswertbasierte Piratenpreisbildung oder vollständige sichere Unternehmensplanung. Er greift ausdrücklich nur beim **neuen NPC3-Frachtergeschäft** im Analyseversuch, **nicht** bei alten NPC1/NPC2- oder Spielerhandel-Befehlen; eine spätere produktive Regel müsste nach gleicher Kernlogik auf *alle* Frachter/Spielerrollen generalisiert werden. Real gezahlte Arbeit wird weiter ausschließlich vom vorhandenen Kern gebucht.

## [TEST] Ausführung, Determinismus und Buchungen

[GitHub-CI #41209246161](https://github.com/tobiasfranziskus/Check/actions/runs/41209246161): **1/1 Job erfolgreich; 67/67 Standardtests erfolgreich.** Sieben ausgeführte Weltläufe: originale Regel14-Kontrolle und B7b-Wallet jeweils 10/90 Tage, B7f-Einzelverkauf 90 Tage, B7h unveränderte KI 90 Tage, B7i Vollkostenfilter 90 Tage. Insgesamt **11.280 stündliche unabhängige Geld-/Warenaudits und parallele deterministische Replay-Hash-Prüfungen**, **470 Tageshashes**, **86 Save/Load-Roundtrips**. Original/B7b-/B7f-/B7h-Hashreferenzen unverändert: B7b `82f11deee8c7f566`, B7f `23eb3796fb0b5ec3`, B7h `6573a3c1acc3d5a5`; neuer deterministischer **B7i-Tag90-Hash `517f7d05d13dfaae`**. Kontrolle und Experiment einschließlich Tag15 **identisch**, gleicher Schiffskauf und derselbe erste reale Siliziumverkauf, identischer `shipHandeln`-Start danach. Alle Preis-/Arbeit-/Fonds-/Warenbuchungen erfolgen im realen Kern, kein manipuliertes Endergebnis.

**Validierte B7i-Entscheidungen am experimentellen Schiff:** **6** lokal finanzierte neue beladene Fahrten, **1** gezielte Leerpositionierung, **17** explizite Warteentscheidungen statt ungedeckter Fehlflüge. In jeder akzeptierten Probe war der Moment-Deckungsbeitrag nach berücksichtigten Fahrtannahmen **positiv** und der Bedarf **höchstens** das tatsächliche freie NPC3-Konzernkapital, einschließlich einer gesondert *zurückgehaltenen* Miner-Betriebsstundenreserve. **7 tatsächlich ausgeführte Waren-Einkäufe, 9 reale Waren-Verkäufe**, einschließlich erstem B7f-Lot; **6 weitere Einkäufe und 8 weitere Verkäufe** nach Aktivierung. Tatsächliche NPC3-Frachter-Handelsbuchungen: Einkaufswarenwert **4.947 ISK** plus **151 ISK Gebühren**, Verkaufserlöse **9.308 ISK** minus **209 ISK Gebühren**; **4.001 ISK nominaler Saldo nach Marktgebühren**, **vor** Betriebskosten, Schiffsverlusten und deren Opportunitätswert. Historisch zugewiesene abgeschlossene Warenpartien **7 positiv / 0 negativ nach zugewiesener Arbeit**; dieser Lot-Audit ersetzt **keine** lückenlose Schiffs- oder Konzernvollkostenrechnung (insbesondere ggf. leere Flüge außerhalb offener Lots).

## [TEST] 90-Tage-Vergleich

| Kennzahl | B7f – ein Handel, dann `halten` | B7h – alte autonome KI | B7i – autonome KI mit Vollkosten-/Reserve-Check |
| --- | ---: | ---: | ---: |
| NPC3: Frachterwaren-Einkäufe / -Verkäufe | 1 / 1 | **61 / 64** | **7 / 9** |
| NPC3: abgeschlossene Partien positiv / negativ (zugeordnete Arbeit) | 1 / 0 | **21 / 40** | **7 / 0** |
| NPC3: freie Konzernkasse Tag90 | **2.250 ISK** | **0 ISK** | **3.388 ISK** |
| NPC3: eigene Miner Tag90 | 9 | 9 | 9 |
| NPC3: eigene Frachter Tag90 | 1 | 0 | 0 |
| NPC3: Gesamtverluste im Weltverlauf (einschließlich Minern) | 31 | 31 | 33 |
| Gesamt weltweit fällige / bezahlte Arbeit | 244.463 / 244.463 | 262.922 / 255.632 | **246.341 / 246.341 ISK** |
| Ungedeckte Arbeit | **0** | **7.290 ISK** | **0 ISK** |
| Produktionsabschlüsse | 7.022 | 7.161 | 7.084 |
| Echter ziviler Nahrungsverbrauch | 3.744 | 3.882 | 3.774 |
| Echter ziviler Medikamentenverbrauch | 675 | 693 | **675** |
| Echter ziviler Bauteilverbrauch | 1.504 | 1.543 | **1.511** |
| Echte zivile Grundversorgungs-Verbrauchstage | 14 | 16 | **15** |
| Mangelstunden | 36.085 | 36.000 | 36.068 |
| B7i-90-Tage-Welthash | – | – | `517f7d05d13dfaae` |

**[BESTÄTIGT – im Einzel-Seed]:** Die Vollkosten-/Kassenreserve-Auswahl verhindert das B7h-Szenario eines bankrotten NPC3-Konzerns bei denselben Welt-/Marktregeln; NPC3 besitzt Tag90 **3.388 ISK** frei und alle **246.341 ISK** fällige Arbeit im gesamten Weltlauf wurden bezahlt. Es bleiben einige tatsächlich umgesetzte, nach zugeordneter Arbeit positive Handelsfahrten. Es entsteht **keine nachhaltige zivile Versorgung**; im Vergleich zu B7h sind tatsächlicher Warenfluss und Versorgungswirkung geringer. **[WICHTIG]** Ein positiver Vergleich zwischen genau zwei Seed42-Verläufen rechtfertigt weder kausale Verallgemeinerung noch Produktfreigabe.

**[TATSÄCHLICHER SCHIFFSVERLUST, eigener Problemkreis]:** `sh131` wird bei **Tick22.500** (noch Tag16) im Core entfernt; beim `frachter` ist der vorhandene `m_core_sicherheit.ueberfall`-/Kampf-/`zerstoeren`-Pfad der Verlustpfad. **Keine unbezahlte Arbeit vor diesem Verlust, keine Insolvenz als unmittelbarer Vernichtungsgrund;** der ursprüngliche für 780 ISK bezahlte Frachter ist trotzdem verloren. Nach genau einer gekauften Hülle löst der reine Test **keinen kostenlosen Ersatz** aus. Die B7i-Risiko-/Routenwahl prüft bisher *nicht* Sicherheit, Piratenrisiko, Überlebenswahrscheinlichkeit oder Konvoischutz. Nach dem Verlust bleibt NPC3 bei **3.388 ISK** Kasse und neun Minern; die Welt ist ab Tag17 erneut im überwiegenden Grundverbrauchs-Stillstand. Dadurch erklärt sich die kurze aktive Phase ohne die bereits geprüfte bessere Fahrtenauswahl in Abrede zu stellen.

## Bewertungsgrenzen und nächste Gates

**[POSITIV ALS BEGRENZTE HYPOTHESE]** Endlich gibt es einen tatsächlich ausgeführten Ansatz, der **vollständig aus vorhandenem Kapital** profitablere statt möglichst viele Transporte auswählt und die bisher verfügbare Minerarbeit **nicht zahlungsunfähig** macht. Die 1-Stunden-Reserve und der Extra-Positionierungspuffer sind **Testannahmen**, keine freigegebenen Lohn-/Haftungs-/Reserveparameter. Zudem besitzt der NPC3-Frachter derzeit weiterhin **kein B7b-kompatibles echtes isoliertes Schiffskonto**; bezahlt wurde aus NPC3, wie vor dem Test. Der Kostencheck sollte nicht als fertige universelle Spieler-/NPC-KI verkauft werden.

**[NÄCHSTES EINZELGATE B7j – ANALYSE/OPTION]:** Nicht gleichzeitig neues Kopfgeld, Pacht, Schiffskosten oder Geldregime schaffen. Zuerst **read-only** den tatsächlich riskanten Verlustpfad `sh131` Tick22.500 gegen Welt-Sicherheitszonen, Route und vorhandene Angriffssimulation prüfen. Erst danach höchstens eine isolierte Testvariante: der NPC3-Frachter **kann** risikoreiche Strecken meiden, sofern alternative nach Vollkosten profitable Warenrouten existieren; bewusst **kein** unverwundbarer Gratis-Schutz. Gegen B7i bei unverändertem Kapital-, Vollkosten- und Stationsnachfragemodell testen, ob Überleben, Warenlieferungen, echte Versorgung und Minerbetrieb messbar besser werden. Der globale zivile Endverbrauchs-Stillstand bleibt ein **separates** Phase-B-Geld-/Nachfragegate, kein Anlass, einzelne Unternehmen vor Verlusten zu schützen. Bei positiven Einzeltests **13 Seeds ×90 Tage** plus echte Spieler-/Speicherfälle und neutraler Wartbarkeitsreview vor einem kleinen neuen Produkt-PR. `main` und iPad/NAS bleiben unverändert.

**Status:** PR #60 bleibt **[DRAFT/ANALYSE]**, PR #55 bleibt **[DRAFT/DOKUMENTATION]**, keine Integration, kein Deployment, keine Produkt-Roadmap auf `main` verändert.
