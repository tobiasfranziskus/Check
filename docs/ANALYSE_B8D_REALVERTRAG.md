# B8d – Ein realer Material-Liefervertrag und der Folgezyklus

**[ANALYSE/DRAFT], 31.10.2026.** Fixierte Basis: `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8. Einzige verbindliche Roadmap: [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Kausalfrage

[B8b](https://github.com/tobiasfranziskus/Check/pull/62) und [B8c](https://github.com/tobiasfranziskus/Check/pull/63) zeigen in der historischen Spielerkrise Seed42, Tag14, dass Cyris 0 Material besitzt, die ursprüngliche Kasse 9 ISK beträgt und kein echter Käufer den rechnerisch profitablen Rohstofftransport decken kann. [B7f–B7k](https://github.com/tobiasfranziskus/Check/pull/60) testeten bereits Konzerninvestition, Autohandel, Betriebskosten und Schutz. Eine zusätzliche reine Preis- oder Schiffskapitalrechnung ist daher nicht erforderlich.

B8d führt drei **echte Originalkern-Weltläufe** mit denselben sieben Spielerbefehlen aus:
- **Kontrolle:** Originalwelt ohne Änderung.
- **Nur Frachter:** Ab Ende Tag14 wird ein einmaliger, durch die bestehenden ursprünglichen `ersatzkauf`-/`handel`-Funktionen aus der **echten NPC3-Kasse** bezahlter Konzernfrachter der Sollflotte hinzugefügt, danach der neue Sollplatz entfernt (keine unkontrollierte zweite Hülle). Das Schiff kauft **7 Material** bei Veldra und versucht es per **validiertem `shipMove`** nach Cyris zu bringen. Ein zweiter identischer Auftrag ist nur bei vollständig erfolgreichem erstem Verkauf vorgesehen. Kein privater Piloten-Schiffskauf.
- **Einmaliger real finanzierter Auftrag:** Genau derselbe Frachter, dieselbe Originalwelt. Erst unmittelbar vor der Ankunft der tatsächlich transportierten Ladung in Cyris bucht der Analyse-Runner **einmal** den nach Original-Marktpreis noch fehlenden ISK-Betrag von der **bestehenden neutralen Meridian-Stationskasse** zur Cyris-Stationskasse, ohne `minted` zu ändern. Erst danach wird der **originale** Ankunftsverkauf ausgeführt. Ein zweiter identischer Auftrag **erhält ausdrücklich keine neue Zahlung**.

## Strenge Grenzen

Die einmalige, **zielstationsspezifische Beschaffungsgutschrift ist ausschließlich ein bewusst kontrollierter Kausalversuch**, keine vorgeschlagene reale Produktregel und **keine Freigabe einer individuellen Rettung**. Sie dient dazu, das Ausbleiben eines echten Kaufs bei objektiv fehlender Käuferliquidität von fehlender physischer Lieferung zu unterscheiden. Keine pauschale Stationsrettung, keine wiederholte Hilfe, kein Gratisfrachter, kein individueller Konkurs-Schutz, keine gesetzte Emissionshöhe. Ein Markteintritt des NPC3 wird explizit experimentell ausgelöst – **keine autonome Firmen-KI bewiesen**.

Derselbe echte Core verarbeitet Kauf, Flug, Verkauf, Produktion, Gehälter, Piraten, Verlust und Ersatz, ohne zweite Wirtschaft. Die neue `sollflotte`-Einstellung und die einmalige Kassenumbuchung erfolgen **ausschließlich im Node-Analyse-Runner**; **`index.html`, vorhandene Tests/Goldenwerte, Rule/Schema, UI und Browser-Spielstände bleiben unverändert**.

Zielbelege: ursprünglicher 90-Tage-Spielerhash `784047684dfe5c56`; beide Varianten mit eigenem deterministischem Replay, stündlichen unabhängigen Geld-/Warenaudits und Save/Load; wirkliche Kauf-/Verkaufsergebnisse, reale Erst- und Zweitlieferung, NPC3- und Fabrikkassen, Medizinproduktion und Medizinverbrauch, Schiffbestand und Spielervermögen bis Tag90. **Ein einmaliger realer Warenverkauf beweist keine selbsttragende Dauerwirtschaft.** Ein 13-Seed-Gate sowie 365d-Spielerfälle wären für eine Produktreform zusätzlich erforderlich.

## [TEST] Tatsächliche Ergebnisse (Seed42, 90 Tage)

**[CI #41228816231](https://github.com/tobiasfranziskus/Check/actions/runs/41228816231)** auf dem nach korrigierter Prüferwartung laufenden Code-Head: drei Original-Regel14-Welten je90 Tage, zweimal unabhängig wiederholt, `2.160` Stunden-Audits pro Variante und Replay (= **12.960 unabhängige Stunden-Geld-/Warenaudits und Replayhashes**), **30** Save/Load-Roundtrips (10 je Variante). Originaler historischer 90-Tage-Endhash **`784047684dfe5c56`** exakt erhalten. Der ursprüngliche Lauf [#41228732536](https://github.com/tobiasfranziskus/Check/actions/runs/41228732536) verwarf die nachweislich korrekt ausgeführten 10 Save/Loads pro Versuch wegen **falsch erwarteter 8 im Workflow**; sämtliche drei echten Core-Simulationen hatten bereits protokolliert erfolgreich geendet. Die CI nach Korrektur ist gesondert zu prüfen; ein grüner Simulationslauf allein ist keine produktive Wirtschaftsfreigabe.

| Originalkern, Ende Tag90 | Kontrolle | Ein real gekaufter NPC3-Frachter, ohne Vertrag | Derselbe Frachter, einmaliges neutrales Beschaffungsbudget |
| --- | ---: | ---: | ---: |
| NPC3-Frachter vorhanden | 0 | 1 | 1 |
| Erster realer Materialverkauf nach Cyris | – | **0/7** | **7/7** |
| Zweiter realer Materialverkauf nach Cyris | – | nicht versucht | **0/7** |
| Medizin insgesamt produziert | 472 | 472 | **475** |
| Medizin insgesamt verbraucht | 644 | 644 | **647** |
| Nahrung insgesamt verbraucht | 2.541 | 2.548 | 2.551 |
| NPC3-Kasse | 4.395 | 3.556 | 3.885 |
| Cyris-Kasse | 9 | 5 | 16 |
| Spieler-Kasse | 39.762 | 39.762 | 39.762 |
| Direkte B8d-ISK-Neuschöpfung | 0 | 0 | **0** |

**[ECHTE KERNBEFEHLE]** Das ursprüngliche Schiffbau-Modul kauft an Tick **20.220** **genau eine** NPC3-Frachterhülle `sh106` für **780 ISK**, aus NPC3s tatsächlich vorhandener Kasse (4.395→3.615 ISK), ohne zusätzliche Waren-/ISK-Erzeugung. Der Frachter reist nach Veldra, kauft per validiertem `shipTrade` 7 Material für **167 ISK inklusive Einkaufsgebühr** und bewegt sich per validiertem `shipMove` nach Cyris. In der Variante **ohne Auftrag** bleibt am ersten Ankunftstick **die ganze Ladung unverkauft**; die Käuferstation hat kein ausreichendes ISK-Guthaben.

**[EINMALIGE, REALE GELDUMBUCHUNG]** Unmittelbar vor dem ersten Originalkern-Ankunftsverkauf zahlt die bestehende neutrale Meridian-Kasse genau **403 ISK an Cyris** (eigenes Guthaben 2.800→2.397 ISK). Cyris verfügt zum Moment des Verkaufs über **413 ISK**: 7 Material ×59 ISK. Der echte Core-Verkauf bei Ankunft überweist 413 ISK aus der Stationskasse an NPC3 und zieht die Original-Verkaufsgebühr vom Schiffseigner ab. Nach 7 gelieferten Materialeinheiten startet Cyris drei weitere Originalrezept-Abschlüsse der Medikamentenproduktion (472→475), die anschließend tatsächlich verbraucht werden (644→647).

**[ZWEITER REELER VERSUCH]** Derselbe, bezahlte Frachter kehrt nach Veldra zurück, kauft **nochmals 7 Material für 167 ISK**, fährt beladen zurück und wird an Tick **20.340** in Cyris erneut beim ursprünglichen Core-Ankunftsverkauf geprüft. Ohne weitere neutrale Zahlung verkauft er **0/7**. Dabei ist zu unterscheiden: Die Stationskasse hat **nach** dem vollständigen Stunden-Tick durch die normale Fondsphase 283 ISK; der im **früheren Ankunftsschritt** ausgeführte Originalverkauf wurde jedoch nicht finanziert. Ein späterer *manueller Teilverkauf* wurde **nicht** zusätzlich ausgelöst. Die Aussage lautet daher **„zweiter vollständiger Transport beim Original-Ankunftsverkauf nicht absetzbar“**, nicht „nie wieder irgendeine Teilmenge verkaufbar“. Der Frachter lebt an Tag90, aber die zweite Fracht bleibt ohne Wiederverkauf.

**[WIRTSCHAFTLICH NEGATIV]** Beim tatsächlich ausgeführten Kern-Transport ergibt sich ein kurzer Produktionseffekt und eine echte bezahlte Lieferung, aber kein reproduzierter zweiter vollständiger Verkaufszyklus und keine wiederhergestellte Grundversorgung bis Tag90. NPC3 besitzt die bezahlte Hülle noch; 3.885 ISK Endkasse sind **510 ISK unter dem Ausgangskapital** bei Tag14, kein Nachweis positiver Unternehmensrendite. Die neutrale Finanzierung 403 ISK wurde nicht wiederholt. Die Abweichung im Nahrungskonsum ist ein Weltfolgeeffekt; sie beweist keine durch Material allein begründete Nahrungsversorgung.

**[GRENZE]** Das künstlich ausgewählte Einmal-Contracting ist ausdrücklich **keine** Lösung nach dem beschlossenen globalen Modell B, dessen künftige Geldquelle nicht an die Notsituation einzelner Stationen oder Unternehmen gekoppelt sein darf. Weder eine autonome Entscheidung von NPC3, noch echter dauerhafter Verbraucherabsatz, wiederholte Kaufkraftzuflüsse oder 13-Seed/365d-Stabilität sind nachgewiesen.



**Freigabe: keine.** PR bleibt Draft; kein Merge/Deployment.
