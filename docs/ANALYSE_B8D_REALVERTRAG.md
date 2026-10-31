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

## [TEST] Ergebnis

CI und Vergleichsergebnisse werden ausschließlich nach tatsächlich abgeschlossenem Lauf an dieser Stelle dokumentiert. Ein erfolgreicher Node-Test ist weder Merge noch iPad-/NAS-Abnahme.

**Freigabe: keine.** PR bleibt Draft; kein Merge/Deployment.
