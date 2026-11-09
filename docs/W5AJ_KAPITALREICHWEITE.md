# W5aj – begrenzte Kapitalreichweite mehrerer echter Folgezyklen

> **[DRAFT/ANALYSE · 09.11.2026]** Direkt auf [W5ai #281](https://github.com/tobiasfranziskus/Check/pull/281); `main`, Roadmap, Preisregeln, der unveränderte Original-Regel195-Core, produktive Saves und GitHub Pages bleiben unberührt. Dies ist ausdrücklich **kein** W6-Produktgesetz.

## Forschungsfrage

W5ai beweist zwei komplette Eis-Rundfrachten mit jeweils tatsächlich ausgezahlten 120 Privatpiloten-ISK und anschließender freiwilliger Nachfrage. Wie weit trägt das **endliche vorhandene Kapital** wirklich, wenn die Beteiligten freiwillig weitere 50-Eis-Chargen abbauen, diese nur gegen **tatsächlich gedeckten** Quellkauf verkaufen, von Nadir einen neuen `490 ISK`-Kauf-/Frachttarif und von der Spedition `120 ISK` Fluglohn reservieren lassen und anschließend optional weitere 10-Eis→10-Wasser-Chargen und individuelle Käufe ausführen?

Diese Dateien fügen dem Spiel **keine** NPC-Kaufautomatik, Fiktionstransfers oder selbständigen Tick hinzu. `tests/w5aj-kapitalreichweite.test.mjs` ist ausschließlich eine **manuell definierte Experiment-Abfolge** über die vorhandene API von W5ai/W5ah und den Original-Regel195-Core. Alle Fracht-, Eigentums-, Lager-, Werk-, Kauf-, Geld- und Lohnregeln bleiben unmodifiziert.

## Matrix und messbare Gegenbeispiele

- 13 wirtschaftlich unterschiedliche Regime: Seed, Nadir-Anfangsetat (2.000–4.400 ISK), Speditionskapital (1.700–2.400 ISK) und fünf freiwillige Konsum-/Produktionsmuster; unveränderte Weltgeldmenge 33.000 ISK. Nach jedem Ende folgen exakt **90×1.440 tatsächliche Core-Minuten** pro Regime, Original-Audit und Save/Load-Hash bei Tag30 und Tag90. Keine spätere Arbeit oder Konsum ohne neuen Originalauftrag.
- Maximal 12 zusätzlich aufeinanderfolgende 50-Eis-Frachtzyklen pro Regime; Abbruch nur nach dokumentierter Core-Ablehnung oder nach dieser ausdrücklichen Versuchsobergrenze. So werden Kaufgeld, Spedition, Ursprungskasse, Lagerknappheit und freiwillig gehortetes Einkommen nicht verwechselt.
- Einzelner 365-Tage-Krisenfall mit tatsächlich nachgewiesener `454 < 490 ISK`-Käuferunterdeckung aus zwei bereits finanzierten W5ah-Wasserchargen und einem voll gezahlten Eisflug; der Core muss die nächste Fracht **ohne** Buchung verweigern. Echtes, von Aldera erworbenes Eis bleibt dort liegen und kann keinen Gratislohn auslösen.
- Bei jedem Flug werden vorab `490 ISK` an Kauf-/Frachttreuhand und **120 ISK** für die komplette Pilotenarbeitszeit gesperrt. Persönliche Wasserkäufe sind optional und auf tatsächlich ausgezahltes, eigenes Geld und reale Wasserware begrenzt.
- Der Versuchsreport `W5AJ_REAL_FINANCE_13X90` meldet pro Regime Anzahl weiterer realer Flüge, Wasserproduktionen/-käufe, erste Finanzierung-/Waren-/Lager-Ablehnung und Kapitalstände nach Core-Audit, ohne aus künstlich erzwungenen Umsätzen Dauerwirtschaft abzuleiten.

## Grenzen und Entscheidungen

Ein endgültiger Stopp ist unter freiwilliger Nachfrage erlaubt. Auch ein erfolgreicher 12-Zyklen-Versuch beweist keine dauerhaft tragfähige Wirtschaft. Die Versuchsgrenze ist **kein** Mining-Auftragslimit im Spiel. Kein neues Geldmodell, keine automatische Käuferrettung, keine Änderung am Core oder der Produkt-Roadmap. Für W6 fehlen unabhängige zivile Nachfrage, bezahlte Ersatz-/Wartungswirtschaft und Krisennachfolge.

**Prüfstatus:** Nach ausgeführter CI mit echten Daten ergänzen. Echte iPad Safari/NAS nicht Gegenstand dieses reinen Audit-/Forschungsauftrags.
