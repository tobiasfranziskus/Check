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

## Ausgeführter Messbefund (Seed-/Kapital-/Konsummatrix, 09.11.2026)

**[TEST / DRAFT]** [W5aj-CI #42706734820](https://github.com/tobiasfranziskus/Check/actions/runs/42706734820) hat die **2/2 gezielten W5aj-Tests** mit 13 × 90 tatsächlichen Spieltagen und einem separaten 365-Tage-Gate **bestanden**. Zusätzlich lief die vollständige Node22-Regression mit **197/197 Einzeltests, 0 Fehler, 0 Skips** erfolgreich. Die übergeordnete JS-Regression [#42706734775](https://github.com/tobiasfranziskus/Check/actions/runs/42706734775) war bei Berichterstellung ebenfalls erfolgreich.

**Überraschend einheitlicher, tatsächlich gemessener Engpass:** Alle 13 wirtschaftlich unterschiedlichen Regime erreichen nach dem ersten vorab eingerichteten Eis-Rundflug **genau einen weiteren real bezahlten Eis-Rundflug** (insgesamt je zwei). Beim folgenden Quellverkauf blockiert der unveränderte Original-Core `shipSellIce`: **Aldera hat 0 ISK** und kann die neu geförderte physische Eisladung des Miners nicht erwerben. Im selben Moment hat **Nadir je nach Regime noch 556 bis 2.844 ISK**. Diese Reserve auf einem anderen Eigentümerkonto ist kein Anspruch auf Umbuchung und darf nicht als Stationsrettung ausgegeben werden.

Die verschiedenen freiwilligen Wasser-Kauf- und Fabrikmuster ändern dieses konkrete Abnahme-Gate in dieser Matrix nicht. Beim Spar-Regime verbleiben z. B. **128 ISK** auf dem privaten Eispiloten-Konto und das Wasser wird **nicht** automatisch gekauft. Auch nach den folgenden 90 Sim-Tagen wird kein neuer Fluglohn oder Privathaushaltsverbrauch ohne echte Aufträge erzeugt. Alle Finanz-/Güter-/Lohn-/Eigentums-Audits und Regel195-Save-/Hashkontrollen bleiben intakt.

**Unabhängiger Gegenbeleg Käuferetat:** Im separaten Krisenfall werden physische 50 Eis tatsächlich von Aldera angekauft, doch Nadir besitzt nur 454 statt erforderlicher 490 ISK. Dieser nächste Eisfrachtauftrag wird ohne Mutation abgelehnt. Nach **365 Sim-Tagen**: Hash `9c2c379458be5d22`, Welt-ISK **33.000**, Mint **0**, kein erfundener zweiter Fluglohn.

**Schlussfolgerung (nur Analyse):** Die am aktuellen konkreten Experiment zuerst bindende Grenze ist **Alderas Rohstoff-Abnahmekasse**, nicht die Eisverfügbarkeit, fehlende Fluglohn-Berechnung oder Nadirs Käuferetat. *Warum* Aldera bis zum Folgeverkauf auf 0 ISK fällt, ist damit noch **nicht** nach Eigentümer-/Buchungsarten aufgeschlüsselt. Nächster gezielter Forschungsschritt: genau diese reale Kassenabnahme mit Core-Buchungsbelegen entlang der Tickfolge erklären, statt Geld aufzufüllen oder neue Regeln einzuführen. Dauerwirtschaft W6 ist **nicht** bewiesen.

## Korrektur durch den nachgelagerten W5aj-b-Draft #284

**[DRAFT/TEST]** [W5aj-b #284](https://github.com/tobiasfranziskus/Check/pull/284) hat den Kassenabfluss unabhängig mit Original-Regel195 belegt. Der hier beobachtete Aldera-Kassenstopp ist **nicht** zwingend endgültig: Bei Tick550 sind **0 ISK frei, 1.000 ISK rechtswirksam im W1-Erz-Käuferauftrag als Treuhandreserve gebunden**. Dies ist eine vorübergehende Konkurrenz zwischen Erz-/Eis-Nachfrage um dieselbe Quellkasse, kein verschwundenes Geld.

Nach **50 zusätzlichen realen Core-Minuten** geben erfüllte W1-Aufträge die 1.000 ISK wieder frei. Der ursprüngliche Miner kann dann die echte dritte 50er-Eischarge für 250 ISK an Aldera verkaufen, während Nadir mit 490 ISK Kauf-/Frachtetat und die Spedition mit 120 ISK Arbeitsreserve einen **dritten vollständigen Flug bis Tick720** bezahlen. Auch Seed7 bestätigt den Nachweis. [W5aj-b-CI #42709357577](https://github.com/tobiasfranziskus/Check/actions/runs/42709357577): **4/4 gezielte Tests, 201/201 Gesamttests erfolgreich**.

Die hier dokumentierten 13/13 sofort blockierten Verkäufe waren als **Momentaufnahme** korrekt, dürfen aber nicht als finale Reichweitenobergrenze interpretiert werden. Nach dem dritten Flug verbleiben beim Nadir-Käufer **2.066 ISK (Seed42)** beziehungsweise **66 ISK (Seed7)**. Quellen-Treuhandfreigabe, Käuferetat, Lager und freiwilliger Absatz sind getrennte Grenzen; ein wieder verfügbarer Quellankauf beweist keine W6-Dauerwirtschaft. Keine automatische Kassenauffüllung oder Freigabe neuer Geldschöpfung.

Echte iPad Safari/NAS nicht Gegenstand dieses reinen Audit-/Forschungsauftrags.
