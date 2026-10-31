# B8j – Ursprüngliche NPC-Frachterverluste und finanzieller Ersatzkauf: Einzelereignisse

**[ANALYSE/DRAFT], 1. November 2026.** Produktiv unveränderte Basis: `main 517728a958326e86751f09cd74d0c077edad9921` mit Aphros Void v0.12.5, Regel 14, Schema 8. [Verbindliche Roadmap (main)](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). Kein produktiver Wirtschafts-/Kampf-/Preis-/Werft-/Flotten-/Save- oder Oberflächenpatch.

## Fragestellung und Originalmechanik

[B8i – #69](https://github.com/tobiasfranziskus/Check/pull/69) zeigte in historischen Spielerkrisen (Seeds 42 und 7) ab Tag 15 **0 autonome Verkäufe und 0 echte NPC1-/NPC2-Frachter**, während die passive Welt fünf Händlerfrachter behält. Offen war, ob Schiffe an Piraten verloren gehen, ob Nachkäufe stattfinden, und was den Wiederaufbau **tatsächlich** verhindert.

Die Originalfunktion `m_core_schiffbau.ersatzkauf` prüft **stündlich** jeden fehlenden `sollflotte`-Platz. Sie verlangt ein tatsächlich vorhandenes fertiges Schiff am Werftlager sowie den Originalpreis `preis+gebuehr` und mindestens **250 ISK zusätzliche Ersatzrücklage**, **solange der Konzern mindestens ein beliebiges Schiff besitzt** (`leer=false`). Nur bei *vollständig schiffslosem* Konzern darf `zuschuss` exakt die Differenz zum Kaufpreis aus dem **Fonds im System der Werft**, in unserem Fall `fonds_aldera`, transferieren, und nur, wenn dieser Fonds die gesamte Differenz hat. Das ist eine bereits integrierte, aber konditionierte Geldverschiebung, **keine Geldschöpfung**. Auch eine vorhandene Hülle ist ohne den real ausgeführten `handel`-Kauf nicht im Einsatz.

B8j setzt ausschließlich im Node-Analysewerkzeug ein read-only Beobachtungs-Overlay auf den *identischen*, durch SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixierten Originalkern. Es erfasst:

1. Jede echte `zerstoeren`-/`entfernen`-Kette eines NPC1-/NPC2-Frachters, einschließlich ursprünglicher Schiff-ID, System, Fracht, Tick und damaliger Kassen. `zerstoeren` wird im Original vom `m_core_sicherheit.ueberfall` nach verlorenem Kampf ausgelöst; deshalb ist die Klassifikation **Piratenangriff** nicht nur aus einer verschwundenen ID geraten.
2. Jeden vom Original-`ersatzkauf` tatsächlich beauftragten Soll-Flottenplatz, mit Original-Core `preis`, `gebuehr`, `reserve`, Werftbestand, Eigentümerkasse, `ersatzRuecklage`, Fördermöglichkeit und Fonds-Cash. Die Beobachtung selbst verleiht, zahlt und produziert nichts; tatsächliche Hüllenkäufe werden nach erfolgreichem Original-`handel` protokolliert.
3. Tatsächliche Zuschüsse, neue Schiffs-IDs, tägliche Flotten/Kassen/Werftlagerstände, unabhängige Geld-/Warenaudits stündlich, Original-`audit`, deterministische Replay-Hashes und originale Save/Load-Roundtrips.

Vier unveränderte Seed42/7-Welten, je passive Wirtschaft und historischer aktiver 7-Befehl-Spielerfall, **90 Tage**; jede Welt **zweimal unabhängig abgespielt**.

## [TEST] Ausgeführte Ergebnisse

**[Original-CI #41253002185](https://github.com/tobiasfranziskus/Check/actions/runs/41253002185) erfolgreich**, einschließlich der vier vollständigen Simulationswelten, stündlicher Geld-/Warenaudits, Replay, Save/Load und **67/67 Standardtests**. Die zusätzlich verschärften exakten Verlust-/Kauf-Zahlengates werden auf der nachfolgenden CI geprüft. Historische Original-Hashes für Seed42 aktiv `784047684dfe5c56` und passiv `adf155a018b94094` unverändert; für Seed7 passiv/aktiv `75bf0ddd9a441f60` / `84153573536268f2`. Je vier 90-Tage-Welten mit zwei Replays: **17.280 stündliche vollständige unabhängige Geld-/Warenaudits**, **32 Save/Load-Roundtrips**.

| Vollständige Original-90d-Welt | Seed42 passiv | Seed42 aktiv | Seed7 passiv | Seed7 aktiv |
| --- | ---: | ---: | ---: | ---: |
| Anfängliche Konzernfrachter NPC1 + NPC2 | 5 | 5 | 5 | 5 |
| **Echte Piratenkampf-Zerstörungen** dieser Frachter | **137** | **16** | **150** | **8** |
| **Tatsächlich finanzierte und bezahlte neue Frachter** | **137** | **11** | **150** | **3** |
| Zuschüsse aus Werft-Fonds an NPC1/NPC2 | 0 | **0** | 0 | **0** |
| Überlebende NPC1-/NPC2-Frachter an Tag 90 | **5** | **0** | **5** | **0** |
| NPC1-/NPC2-Kasse Tag90 | 6000 / 6000 | **0 / 0** | 6000 / 4755 | **0 / 0** |
| Fertige Frachter im Werftlager an Tag90 | 2 | **2** | 2 | **2** |

**[KORREKTUR ZUR ALLGEMEINEN MINER/JÄGER-HYPOTHESE]** Die Sollflotten von NPC1 (3 Frachter) und NPC2 (2 Frachter) enthalten in diesen beiden Szenarien **keine Miner/Jäger**. Daher fällt ein vollständig gescheiterter Händlerkonzern grundsätzlich unter den vorhandenen `leer=true`-Zuschussfall. Die Regel „nur bei überhaupt keinem eigenen Schiff“ ist zwar eine **architektonische Einschränkung**, aber **nicht** die direkte dauerhafte Sperre nach dem vollständigen Verlust dieser konkreten Flotten. Der tatsächlich belegte Blocker ist, dass dann die Fonds nicht genug reale ISK haben.

### Exakte erste Vollverlust-Zeitpunkte und erste fehlgeschlagene Ersatzmöglichkeit

| Originalereignis | Seed42 aktiv | Seed7 aktiv |
| --- | --- | --- |
| NPC1 verliert letzten Frachter | Tick **7200** (Tag 5,0) | Tick **9360** (Tag 6,5) |
| NPC2 verliert letzten Frachter | Tick **10560** (Tag 7,33) | Tick **8160** (Tag 5,67) |
| Erste Prüfung NPC1 ohne ein Schiff | Eigencash **0**, Fonds Aldera **113** ISK | Eigencash **0**, Fonds Aldera **0** ISK |
| Erste Prüfung NPC2 ohne ein Schiff | Eigencash **0**, Fonds Aldera **40** ISK | Eigencash **0**, Fonds Aldera **77** ISK |
| Benötigter Kaufpreis je Frachter inklusive Werftgebühr | **780 ISK** | **780 ISK** |
| Kaufpreis bei noch vorhandenen anderen Schiffen +250 Rücklage | **1030 ISK** | **1030 ISK** |
| Bereits physisch vorhandene Frachter-Hüllen bei Vollverlust | **mindestens 1** | **2** |
| Bezahlt neu aus Fonds bei vollständigem Flottenverlust | **0** | **0** |

Der Originalpreis besteht aus **750 ISK Schiffsgrundpreis + 30 ISK Originalgebühr**. Auf dieser Werft sind die Käufe von `frachter` **nicht wegen einem Lagerreservefilter gesperrt** (Original-`reserve(...)` ergibt für Frachter 0). Das Werkzeug protokollierte **keine tatsächlichen Original-Handelsfehlversuche nach einem angenommenen Neubau**; der Ersatz wird schon an Kasse/Fonds bzw. an der vorherigen Schwelle abgewiesen. Der Werftbestand liegt am Tag90 in beiden Krisen bei **2 fertigen Hüllen**, die nicht von den zahlungsunfähigen Eigentümern erworben werden können.

**[TEST-SCHARFE HIERARCHIE]**
- Der **unmittelbare Frachterverlust** erfolgt durch echte `ueberfall`-Piratenkämpfe. Nicht die Trader-KI löscht diese Schiffe.
- In passiven Welten werden die Verluste exakt mit **137/137 bzw. 150/150 tatsächlich bezahlten Ersatzhüllen** kompensiert; die Händlerflotte bleibt bei fünf.
- In den aktiven Krisen stehen **16/11 bzw. 8/3** Verluste/Ersatzkäufe. Sobald die Eigentümer zu wenig selbst verfügbares Geld haben, stoppt der Ersatz.
- Nach vollständiger Entflottung entfällt zwar die Rücklage; der Fonds ist dann **um hunderte ISK zu arm**, um die echten 780 ISK zu zahlen. **Keiner der NPC1-/NPC2-Konzerne erhält in den vier Welten tatsächlich einen Zuschuss.**
- **Physische Werft-Hüllen sind nicht der dauerhafte Engpass.** Die Geldquelle für den dauerhaften Wiedereinstieg – nicht nur ein beliebiges Anfangsgeschenk – bleibt die ungelöste gesamtwirtschaftliche Frage.

## Wirtschaftlicher Schluss und klare Abgrenzung

**[BESTÄTIGT]** Die Kausalkette in den beiden realen Original-Spielerkrisen lautet: **zahlreiche belegte Piratenverluste → bezahlter Wiederaufbau teilweise noch möglich → sinkende Eigentümerkassen / verschärfte 250-ISK-Reserve bei Restflotte → schließlich 0 echte Frachter → leer=true, aber `fonds_aldera` viel zu klein für den tatsächlichen 780-ISK-Erwerb → kein Wiederanlauf.** Die profitable Routenmarge aus B8h und mehrere positive Ladungsbeiträge aus B8i helfen nicht, wenn weder ein zahlender Käufer noch ein finanzierter, physisch vorhandener Dienstleister eingesetzt werden kann.

**[NICHT BELEGT]** Der Verlust mehrerer Schiffe allein beweist keine unprofitablen Handelsmargen im gesamten Spiel; ebenso wenig ist nachgewiesen, dass allein unbegrenzte NPC-Kredite, Fondsüberweisungen, künstliche Ersatzschiffe oder eine Spieler-Vermögensbeschränkung eine stabile Welt ergeben würden. Ein unbegrenzter Fonds-Zuschuss auf Einzelkonzernebene wäre den vom Spieler ausdrücklich gesetzten Projektzielen (Einzelkonkurs zulässig; echte Leistungen, reale Mittel; keine Bailouts) zuwider. Piraten-Ersatzkosten und verlorene Ladungen müssen bei der künftigen Markt-/Risikorendite bepreist werden.

**[NÄCHSTES ENGES GATE, OPTION B8k]** Jetzt **nicht** blind die 780 ISK jedem bankrotten Händler schenken. Stattdessen **systemweite, faire Neugründung / Eintritt neuer Pacht-Händler** und global auf echte Leistungen bezogene Nachfrage-/Geldrückflüsse bei bestehender Spieler-Sparfreiheit als separate Varianten betrachten, mit realem Werfterwerb, kein individueller Bankrottschutz, keinerlei Geld-Mint ohne global begrenzte Quelle. Vor Produktfreigabe 13 Seeds×90d, unabhängige Audit/Hashes, mehrmalige Transport-/Kapitalrunden und vier 365d-Langzeitfälle prüfen.

**Kein Merge/Deployment; keine produktive Mechanik, kein Spielstandschema, keine Roadmap-Entscheidung geändert.** Es besteht weiterhin keine reale iPad-/NAS-Abnahme.
