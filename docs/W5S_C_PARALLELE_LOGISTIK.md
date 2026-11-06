# W5s-c – paralleler, vollständig finanziert buchender Erz- und Eisverkehr

**[DRAFT / ANALYSE · 06.11.2026]** [PR #205](https://github.com/tobiasfranziskus/Check/pull/205), Branch `feature/w5s-c-parallele-erz-eis-logistik-20261106`, auf W5s-b #204 → W5s-a #202 → W5r #200. `main` weiterhin b4e604d6 / Regel14 / Schema8. Keine neue Laufzeitpflicht, keine Emission, kein Merge, keine Veröffentlichung.

## Anlass und Trennung

Bisher blockierte ein tatsächlich gestarteter W3-Erztransport **jeden** W5n-Eisauftrag, auch wenn ein anderes bezahltes Schiff verfügbar war. Umgekehrt sperrte Eis alle Erztransporte. W5s-a konnte deswegen den zweiten Frachter nur unter künstlich ausgesetzter Eis-Disposition bauen.

Im **expliziten Forschungsprofil** `{...W5R_RULES,w5s:{concurrent:true}}` prüft der vorhandene Core die tatsächliche **Schiffs-ID** statt einer globalen Frachtersperre. W3 und W5n behalten getrennte, vollständig gedeckte Kauf-/Fracht-/Arbeitstreuhanden. Die bestehende W5o-Automatik beauftragt den **registrierten R32-Frachter für Eis**, nur einen **weiteren freien eigenen Frachter für Erz**. Start und Abrechnung passieren ausschließlich über die schon validierten Core-Befehle. W5r-Verschleiß blockiert nur die wirklich belegte Hülle; bei fehlender Ersatzhülle bleibt ein frei gewordener Werftfrachter für dessen Zuordnung verfügbar.

Das Produkt-/R32-Profil **ohne** `w5s.concurrent` und die Save-/Regelnummern bleiben unverändert. Im W5s-c-Test wird die zweite Hülle zuerst mit dem nachweislich bezahlten W5s-a-Erz→Material→W5-Werft→750-ISK-Kauf und der W5s-b-Überführung (60 echte Pilotenlohnminuten) hergestellt. **Nur diese erste Produktionsphase** verwendet weiterhin das ausdrücklich isolierte `oreFirst`-Diagnoseprofil, nicht die spätere parallele Betriebsphase. Ein automatischer paralleler Kaltstart ist noch **nicht** bewiesen.

## Reale Einzelfracht

- **[TEST]** Seed 42 und Seed 7: simultaner W3-Auftrag auf `sh004` (industriell produzierte zweite Hülle) und W5n-Eisauftrag auf `sh002` (erste Hülle), beide tatsächlich in Transit am Tick **391**.
- Jeder Auftrag verfügt über seine **eigene bezahlte Treuhand**, Waren aus realer Förderung, echte Zielkäufer und reale Reisezeit; doppelter Einsatz derselben Schiff-ID wird ohne Zustandsänderung abgelehnt.
- Nach vollständigen echten Hin-/Rückfahrten: **2 abgeschlossene Erztransporte und 1 Eistransport**, Weltgeld weiterhin **33.000 ISK**, kein Minting, genau **1 neu produzierter Frachter**, insgesamt **2 gekaufte Frachter**, 60 bezahlte Überführungsminuten.
- Seed42-Kurz-Hash `5bd05774435f4225`, Seed7 `066f354cea777116`. Save/Load mitten in zwei gleichzeitig gebundenen Fahrten plus deterministisches Fortsetzen geprüft.

## Größeres Langzeit-Gate

`tests/w5s-c-parallele-logistik.test.mjs` prüft 13 Seeds (42, 7, 11, 1, 2, 65535, 1234, 98765, 3, 99, 2024, 2025, 314159) je **90 Tage nach dem realen Aufbau** sowie Seed 42 und 7 zusätzlich je **365 Tage**. Alle Tage unabhängiger Geld-/Waren-Bestand gegen den Ledger plus kompletter Original-Core-Audit; Save/Load bei Tag 30/60/90/365; für Seed42/7 90-Tage-Doppelreplay.

**[TEST/ANALYSE]** Im grünen gezielten Vorlauf (ohne die nachträglich ergänzte 90d-Doppelreplayprüfung) ergaben alle 13×90 Welten **1.650 bezahlte Wasser** (aggregierter Mengenindikator), **33 abgeschlossene Eis-Hin-/Rückfahrten**, **2 abgeschlossene Erzfahrten**, zwei registrierte Frachterverluste und genau eine aus real gebauter Hülle zugeordnete Ersatzhülle. Nach Verlust auch dieser Hülle erfolgt **keine zweite Produktion und keine automatische Rettung**. Die beiden 365d-Proben enden unverändert bei 1.650 Wasser, 33 Eisfahrten und 2 Frachterverlusten. Das belegt einen realen weiteren Engpass, **keine selbsttragende Ersatzindustrie**. Kein zusätzlicher ISK-Zufluss. Keine Interpretation als freigegebene R32-Lebensdauer oder balancierte Wirtschaft.

Bei der ersten Langzeitprüfung wurde der alte W5-Werft-Audit am zweiten Schiffverlust falsch, da er für die historisch real gekaufte ID weiterhin ein aktives Schiff verlangte. Der Code akzeptiert nun **nur einen nachweislichen W5r-Verlust derselben W5-Schiff-ID** als gültige fortbestehende Eigentums-/Herkunftsakte; Waren, Lohn und Kassen werden unverändert geprüft. Keine Neubildung oder Rückzahlung. Gezielt erneute Prüfung läuft nach jedem Code-Update.

## Grenzen / nächste Stufe

1. **W5s-d: Miner-Neubau** als echte bezahlte, physische Produktion (kein Rückgriff auf endlichen Aldera-Startbestand) und bezahlter Einsatzort. Zuerst Rezept/Materialherkunft/Abnehmerkapital klären, nicht kostenlos starten.
2. **Automatischer Ersatzwerft-Dispatcher** bei echter Nachfrage und vollständiger Finanzierung; Erz- und Eisflotten dürfen dabei nicht verhungern. Kleine, stabil überprüfbare Aufträge.
3. Kaltstart mit aktivem Eisverkehr und nur einer Startfracht (ohne `oreFirst`), wirtschaftliche Konkurrenz, Spar-/Insolvenztests und Varianten #199/#200 unabhängig vergleichen.
4. Wasserwerks-Ersatzmaterial und langfristiges Geldmodell B bleiben ungeklärt; keine neue Emissionsregel ohne Beschluss.
5. Weiter echte iPad-Safari-/NAS-Abnahme und Integration des Legacy-UI-Hubs separat.

**Die Daten oben bezeichnen Prüfungen, keine Produktfreigabe.** CI-Referenzen und genaue Head-Ergebnisse werden im [PR #205](https://github.com/tobiasfranziskus/Check/pull/205) nach endgültiger CI aktualisiert. Roadmap/Status-Dokumentations-PR #201 bleibt bewusst separat; keine widersprechende zweite Roadmap.
